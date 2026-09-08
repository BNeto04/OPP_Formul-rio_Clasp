/**
 * Syntheon Agentic Layer - Formal Fallback, Retry & Idempotency Policy Engine
 * Card: #73 T-A01-POLICY-005
 *
 * TAXONOMIA FORMAL DE ERROS:
 * - AUTH_ERROR: 401/403 (Credenciais invalidas). NAO retry, NAO fallback.
 * - CONFIG_ERROR: Configuracao incompleta. NAO retry, NAO fallback.
 * - MODEL_NOT_FOUND: 404. NAO retry cego. Fallback se proximo provider disponivel.
 * - QUOTA_429: Rate limit / quota. Retry limitado, fallback permitido.
 * - RATE_LIMIT: Subtipo de 429.
 * - TIMEOUT: Timeout de rede/socket. 1 retry controlado, fallback permitido.
 * - CONNECTION_ERROR: Falha de socket/DNS/offline. Fallback permitido.
 * - SERVER_5XX: Erro interno do provedor. Retry curto, fallback permitido.
 * - INVALID_REQUEST: 400 (Erro de payload/schema do cliente). NAO fallback.
 * - TASK_LOGIC_ERROR: Erro de logica na tarefa. NAO fallback.
 *
 * SEPARACAO ESTRITA:
 * - PROVIDER_FAILURE: Falha imputavel ao provedor (alimenta Circuit Breaker).
 * - TASK_FAILURE: Falha imputavel a tarefa/cliente (NAO alimenta Circuit Breaker).
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const IDEMPOTENCY_STORE_FILE = path.join(__dirname, '..', 'logs', 'idempotency_store.json');

// --- CIRCUIT BREAKER STATE MACHINE ---
class CircuitBreaker {
  constructor(threshold = 3, cooldownMs = 5000) {
    this.threshold = threshold;
    this.cooldownMs = cooldownMs;
    this.circuits = new Map(); // providerId -> { state: 'CLOSED', failures: 0, lastFailure: 0 }
  }

  getCircuit(providerId) {
    if (!this.circuits.has(providerId)) {
      this.circuits.set(providerId, { state: 'CLOSED', failures: 0, lastFailure: 0 });
    }
    const c = this.circuits.get(providerId);

    // Transicao automatica de OPEN para HALF_OPEN apos cooldown
    if (c.state === 'OPEN' && (Date.now() - c.lastFailure > this.cooldownMs)) {
      c.state = 'HALF_OPEN';
    }
    return c;
  }

  canExecute(providerId) {
    const c = this.getCircuit(providerId);
    if (c.state === 'CLOSED' || c.state === 'HALF_OPEN') {
      return true;
    }
    return false; // OPEN
  }

  recordSuccess(providerId) {
    const c = this.getCircuit(providerId);
    c.failures = 0;
    c.state = 'CLOSED';
  }

  recordFailure(providerId, isProviderFailure) {
    // Apenas PROVIDER_FAILURE afeta o circuit breaker!
    if (!isProviderFailure) return;

    const c = this.getCircuit(providerId);
    c.failures += 1;
    c.lastFailure = Date.now();

    if (c.failures >= this.threshold || c.state === 'HALF_OPEN') {
      c.state = 'OPEN';
    }
  }

  getState(providerId) {
    return this.getCircuit(providerId).state;
  }

  reset() {
    this.circuits.clear();
  }
}

// --- IDEMPOTENCY STORE ---
class IdempotencyStore {
  constructor() {
    this.store = new Map();
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(IDEMPOTENCY_STORE_FILE)) {
        const data = JSON.parse(fs.readFileSync(IDEMPOTENCY_STORE_FILE, 'utf8'));
        for (const [k, v] of Object.entries(data)) {
          this.store.set(k, v);
        }
      }
    } catch (e) {}
  }

  save() {
    try {
      const obj = {};
      for (const [k, v] of this.store.entries()) {
        obj[k] = v;
      }
      fs.writeFileSync(IDEMPOTENCY_STORE_FILE, JSON.stringify(obj, null, 2), 'utf8');
    } catch (e) {}
  }

  generateKey(taskId, executionId, payload) {
    const hash = crypto.createHash('sha256').update(JSON.stringify(payload || '')).digest('hex').substring(0, 16);
    return `${taskId || 'TASK'}:${executionId || 'EXEC'}:${hash}`;
  }

  get(key) {
    return this.store.get(key) || null;
  }

  set(key, result) {
    this.store.set(key, {
      cached_at: new Date().toISOString(),
      result: result
    });
    this.save();
  }

  clear() {
    this.store.clear();
    try {
      if (fs.existsSync(IDEMPOTENCY_STORE_FILE)) fs.unlinkSync(IDEMPOTENCY_STORE_FILE);
    } catch (e) {}
  }
}

// --- CLASSIFICADOR DE ERROS ---
function classifyError(errorObj, httpStatus) {
  if (httpStatus === 401 || httpStatus === 403) {
    return { error_class: 'AUTH_ERROR', is_provider_failure: false, retryable_same_provider: false, allow_fallback: false };
  }
  if (httpStatus === 404) {
    return { error_class: 'MODEL_NOT_FOUND', is_provider_failure: true, retryable_same_provider: false, allow_fallback: true };
  }
  if (httpStatus === 429) {
    return { error_class: 'QUOTA_429', is_provider_failure: true, retryable_same_provider: true, allow_fallback: true };
  }
  if (httpStatus === 400) {
    return { error_class: 'INVALID_REQUEST', is_provider_failure: false, retryable_same_provider: false, allow_fallback: false };
  }
  if (httpStatus >= 500) {
    return { error_class: 'SERVER_5XX', is_provider_failure: true, retryable_same_provider: true, allow_fallback: true };
  }

  const msg = (errorObj && errorObj.message) ? errorObj.message.toLowerCase() : '';
  if (msg.includes('timeout') || errorObj.name === 'AbortError') {
    return { error_class: 'TIMEOUT', is_provider_failure: true, retryable_same_provider: true, allow_fallback: true };
  }
  if (msg.includes('econnrefused') || msg.includes('enotfound') || msg.includes('connection')) {
    return { error_class: 'CONNECTION_ERROR', is_provider_failure: true, retryable_same_provider: false, allow_fallback: true };
  }
  if (msg.includes('task_logic') || msg.includes('business_rule')) {
    return { error_class: 'TASK_LOGIC_ERROR', is_provider_failure: false, retryable_same_provider: false, allow_fallback: false };
  }

  return { error_class: 'PROVIDER_FAILURE', is_provider_failure: true, retryable_same_provider: false, allow_fallback: true };
}

const globalCircuitBreaker = new CircuitBreaker(3, 5000);
const globalIdempotencyStore = new IdempotencyStore();

module.exports = {
  CircuitBreaker,
  IdempotencyStore,
  classifyError,
  globalCircuitBreaker,
  globalIdempotencyStore,
  CONSTANTS: {
    MAX_RETRIES_PER_PROVIDER: 1,
    MAX_PROVIDERS_PER_EXECUTION: 3,
    GLOBAL_ATTEMPT_LIMIT: 6,
    GLOBAL_TIMEOUT_MS: 60000,
    CIRCUIT_OPEN_THRESHOLD: 3,
    CIRCUIT_COOLDOWN_MS: 5000
  }
};