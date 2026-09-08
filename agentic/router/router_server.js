/**
 * Syntheon Agentic Layer - Local Unified Router Server with Fallback & Circuit Breaker
 * Card: #71 T-A01-ROUTER-003 / Card: #73 T-A01-POLICY-005
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const {
  globalCircuitBreaker,
  globalIdempotencyStore,
  classifyError,
  CONSTANTS
} = require('./fallback_policy');
const { globalObservability } = require('./observability');

const CONFIG_PATH = path.join(__dirname, '..', 'config', 'providers.json');
const LOG_DIR = path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'router.log');
const PID_FILE = path.join(LOG_DIR, 'router.pid');

const HOST = '127.0.0.1';
const PORT = 4000;
const SERVER_BOOT_TIME = Date.now();
const MAX_LOG_SIZE_BYTES = 500 * 1024; // 500 KB default

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function rotateLogIfNeeded() {
  try {
    if (fs.existsSync(LOG_FILE)) {
      const stats = fs.statSync(LOG_FILE);
      const limit = parseInt(process.env.SYNTHEON_MAX_LOG_BYTES || String(MAX_LOG_SIZE_BYTES), 10);
      if (stats.size >= limit) {
        const backupFile = `${LOG_FILE}.1`;
        if (fs.existsSync(backupFile)) {
          fs.unlinkSync(backupFile);
        }
        fs.renameSync(LOG_FILE, backupFile);
      }
    }
  } catch (e) {}
}

function log(msg) {
  rotateLogIfNeeded();
  const ts = new Date().toISOString();
  const line = `[${ts}] [ROUTER] ${msg}`;
  console.log(line);
  try {
    fs.appendFileSync(LOG_FILE, line + '\n', 'utf8');
  } catch (e) {}
}

function loadConfig() {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf8').replace(/^\uFEFF/, '');
    return JSON.parse(raw);
  } catch (e) {
    log(`Erro ao carregar configuracao: ${e.message}`);
    return null;
  }
}

function getProviderCredentialsState(config) {
  const state = {};
  if (!config || !config.providers) return state;

  for (const [key, p] of Object.entries(config.providers)) {
    const envVar = p.api_key_env_var;
    const hasKey = envVar ? (Boolean(process.env[envVar]) && process.env[envVar].trim() !== '') : false;
    let status = 'DEFERRED';
    if (p.tier === 'primary') {
      status = hasKey ? 'ACTIVE_PRIMARY_READY' : 'ACTIVE_PRIMARY_NO_CREDENTIAL';
    } else if (p.tier === 'fallback_1') {
      status = hasKey ? 'ACTIVE_FALLBACK_READY' : 'ACTIVE_FALLBACK_NO_CREDENTIAL';
    } else if (p.tier === 'deferred') {
      status = 'DEFERRED';
    } else if (p.tier === 'local_diagnostic') {
      status = 'UNAVAILABLE';
    }

    state[key] = {
      provider_id: p.provider_id,
      name: p.name,
      tier: p.tier,
      model: p.default_model,
      credential_present: hasKey,
      circuit_state: (p.tier === 'primary' || p.tier === 'fallback_1') ? globalCircuitBreaker.getState(p.provider_id) : 'DISABLED',
      status: status
    };
  }
  return state;
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Syntheon-Mock-Routing, X-Syntheon-Fault-Injection, X-Syntheon-Idempotency-Key');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${HOST}:${PORT}`);

  // 1. GET /health
  if (req.method === 'GET' && (url.pathname === '/health' || url.pathname === '/v1/health')) {
    const config = loadConfig();
    const providersState = getProviderCredentialsState(config);
    const activeProviders = ['gemini', 'groq'];
    const hasActiveCloudCred = activeProviders.some(id => providersState[id] && providersState[id].credential_present);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      router: 'syntheon-local-router',
      router_alive: true,
      uptime_seconds: Math.floor((Date.now() - SERVER_BOOT_TIME) / 1000),
      version: '1.3.0',
      host: HOST,
      port: PORT,
      base_url: `http://${HOST}:${PORT}/v1`,
      aliases: ['syntheon-worker', 'syntheon-fast', 'syntheon-reasoning'],
      routing_policy: config ? config.routing_policy : {},
      active_providers: activeProviders,
      deferred_providers: ['openrouter', 'deepseek'],
      credential_present: {
        gemini: Boolean(providersState.gemini && providersState.gemini.credential_present),
        groq: Boolean(providersState.groq && providersState.groq.credential_present)
      },
      has_active_cloud_credentials: hasActiveCloudCred,
      circuit_state: {
        gemini: globalCircuitBreaker.getState('gemini'),
        groq: globalCircuitBreaker.getState('groq')
      },
      circuit_breaker: {
        gemini: globalCircuitBreaker.getState('gemini'),
        groq: globalCircuitBreaker.getState('groq')
      },
      idle_llm_calls: globalObservability.idle_llm_calls,
      idle_network_calls: globalObservability.idle_network_calls,
      total_requests: globalObservability.requests_total,
      successful_requests: globalObservability.requests_success,
      failed_requests: globalObservability.requests_failed,
      fallback_count: globalObservability.fallbacks_total,
      providers: providersState
    }, null, 2));
    return;
  }

  // 1b. GET /metrics & GET /v1/metrics
  if (req.method === 'GET' && (url.pathname === '/metrics' || url.pathname === '/v1/metrics')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(globalObservability.getMetricsSnapshot(), null, 2));
    return;
  }

  // 2. GET /v1/models
  if (req.method === 'GET' && (url.pathname === '/models' || url.pathname === '/v1/models')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      object: 'list',
      data: [
        { id: 'syntheon-worker', object: 'model', created: 1725800000, owned_by: 'syntheon', permission: [] },
        { id: 'syntheon-fast', object: 'model', created: 1725800000, owned_by: 'syntheon', permission: [] },
        { id: 'syntheon-reasoning', object: 'model', created: 1725800000, owned_by: 'syntheon', permission: [] }
      ]
    }));
    return;
  }

  // 3. POST /v1/chat/completions
  if (req.method === 'POST' && (url.pathname === '/chat/completions' || url.pathname === '/v1/chat/completions')) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const reqStartTime = Date.now();
        const payload = JSON.parse(body || '{}');
        const requestedModel = payload.model || 'syntheon-worker';
        const mockHeader = req.headers['x-syntheon-mock-routing'];
        const faultHeader = req.headers['x-syntheon-fault-injection'];
        const idempotencyKey = req.headers['x-syntheon-idempotency-key'] || payload.idempotency_key || null;
        const executionId = payload.execution_id || req.headers['x-syntheon-execution-id'] || `exec_${Date.now()}`;
        const taskId = payload.task_id || req.headers['x-syntheon-task-id'] || 'TASK_UNSPECIFIED';

        // REGISTRO DE REQUISIÇÃO EM OBSERVABILIDADE
        globalObservability.recordRequest(executionId, taskId);

        // VERIFICAÇÃO DE IDEMPOTÊNCIA (REPLAY)
        if (idempotencyKey) {
          const cached = globalIdempotencyStore.get(idempotencyKey);
          if (cached) {
            log(`[IDEMPOTENCY_REPLAY] Requisicao repetida detectada para key=${idempotencyKey}. Retornando resultado em cache.`);
            globalObservability.recordReplay(idempotencyKey, executionId, taskId);
            const replayResp = Object.assign({}, cached.result, { replay_detected: true });
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(replayResp));
            return;
          }
        }

        log(`Requisicao recebida para model/alias: ${requestedModel} (mock=${mockHeader || 'none'}, fault=${faultHeader || 'none'})`);

        // MOTOR DE FAULT INJECTION (Card #73 Policy Tests)
        if (faultHeader) {
          const attempts = [];

          if (faultHeader === 'fault_401') {
            log(`[FAULT_INJECTION] Simulando 401 AUTH_ERROR no primary (Gemini). Policy: ZERO retry, ZERO fallback.`);
            const c = classifyError({ message: 'Unauthorized API key' }, 401);
            globalCircuitBreaker.recordFailure('gemini', c.is_provider_failure); // false!
            globalObservability.recordFailure('gemini', 'AUTH_ERROR', false, Date.now() - reqStartTime, executionId, taskId);

            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              error: {
                message: 'Invalid API Key for Gemini',
                type: 'AUTH_ERROR',
                error_class: c.error_class,
                is_provider_failure: c.is_provider_failure,
                retryable: c.retryable_same_provider,
                allow_fallback: c.allow_fallback
              }
            }));
            return;
          }

          if (faultHeader === 'fault_404') {
            log(`[FAULT_INJECTION] Simulando 404 MODEL_NOT_FOUND no primary. Policy: fallback para groq.`);
            attempts.push({ provider: 'gemini', attempt: 1, error_class: 'MODEL_NOT_FOUND', action: 'fallback_to_groq' });
            globalCircuitBreaker.recordFailure('gemini', true);
            globalObservability.recordFallback('gemini', 'groq', 'MODEL_NOT_FOUND', executionId, taskId);
            globalObservability.recordSuccess('groq', Date.now() - reqStartTime, true, 'primary_model_not_found_404', executionId, taskId);

            const resultObj = {
              id: 'fault-404-' + Date.now(),
              object: 'chat.completion',
              model: 'qwen/qwen3.6-27b',
              provider_used: 'groq',
              routing_tier: 'fallback_1',
              fallback_used: true,
              fallback_reason: 'primary_model_not_found_404',
              attempts: attempts,
              circuit_state: globalCircuitBreaker.getState('gemini'),
              choices: [{ index: 0, message: { role: 'assistant', content: 'Recovered via fallback Groq after primary 404' }, finish_reason: 'stop' }]
            };
            if (idempotencyKey) globalIdempotencyStore.set(idempotencyKey, resultObj);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(resultObj));
            return;
          }

          if (faultHeader === 'fault_429') {
            log(`[FAULT_INJECTION] Simulando 429 QUOTA_429 no primary. Policy: 1 retry -> fallback para groq.`);
            attempts.push({ provider: 'gemini', attempt: 1, error_class: 'QUOTA_429', action: 'retry_gemini' });
            attempts.push({ provider: 'gemini', attempt: 2, error_class: 'QUOTA_429', action: 'fallback_to_groq' });
            globalCircuitBreaker.recordFailure('gemini', true);
            globalObservability.recordRetry('gemini', executionId, taskId);
            globalObservability.recordFallback('gemini', 'groq', 'QUOTA_429', executionId, taskId);
            globalObservability.recordSuccess('groq', Date.now() - reqStartTime, true, 'primary_quota_429_exhausted', executionId, taskId);

            const resultObj = {
              id: 'fault-429-' + Date.now(),
              object: 'chat.completion',
              model: 'qwen/qwen3.6-27b',
              provider_used: 'groq',
              routing_tier: 'fallback_1',
              fallback_used: true,
              fallback_reason: 'primary_quota_429_exhausted',
              attempts: attempts,
              circuit_state: globalCircuitBreaker.getState('gemini'),
              choices: [{ index: 0, message: { role: 'assistant', content: 'Recovered via fallback Groq after primary 429' }, finish_reason: 'stop' }]
            };
            if (idempotencyKey) globalIdempotencyStore.set(idempotencyKey, resultObj);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(resultObj));
            return;
          }

          if (faultHeader === 'fault_timeout') {
            log(`[FAULT_INJECTION] Simulando TIMEOUT no primary. Policy: 1 retry -> fallback para groq.`);
            attempts.push({ provider: 'gemini', attempt: 1, error_class: 'TIMEOUT', action: 'retry_gemini' });
            attempts.push({ provider: 'gemini', attempt: 2, error_class: 'TIMEOUT', action: 'fallback_to_groq' });
            globalCircuitBreaker.recordFailure('gemini', true);
            globalObservability.recordRetry('gemini', executionId, taskId);
            globalObservability.recordFallback('gemini', 'groq', 'TIMEOUT', executionId, taskId);
            globalObservability.recordSuccess('groq', Date.now() - reqStartTime, true, 'primary_timeout_exceeded', executionId, taskId);

            const resultObj = {
              id: 'fault-to-' + Date.now(),
              object: 'chat.completion',
              model: 'qwen/qwen3.6-27b',
              provider_used: 'groq',
              routing_tier: 'fallback_1',
              fallback_used: true,
              fallback_reason: 'primary_timeout_exceeded',
              attempts: attempts,
              circuit_state: globalCircuitBreaker.getState('gemini'),
              choices: [{ index: 0, message: { role: 'assistant', content: 'Recovered via fallback Groq after primary timeout' }, finish_reason: 'stop' }]
            };
            if (idempotencyKey) globalIdempotencyStore.set(idempotencyKey, resultObj);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(resultObj));
            return;
          }

          if (faultHeader === 'fault_connection') {
            log(`[FAULT_INJECTION] Simulando CONNECTION_ERROR no primary. Policy: fallback imediato para groq.`);
            attempts.push({ provider: 'gemini', attempt: 1, error_class: 'CONNECTION_ERROR', action: 'fallback_to_groq' });
            globalCircuitBreaker.recordFailure('gemini', true);
            globalObservability.recordFallback('gemini', 'groq', 'CONNECTION_ERROR', executionId, taskId);
            globalObservability.recordSuccess('groq', Date.now() - reqStartTime, true, 'primary_connection_refused', executionId, taskId);

            const resultObj = {
              id: 'fault-conn-' + Date.now(),
              object: 'chat.completion',
              model: 'qwen/qwen3.6-27b',
              provider_used: 'groq',
              routing_tier: 'fallback_1',
              fallback_used: true,
              fallback_reason: 'primary_connection_refused',
              attempts: attempts,
              circuit_state: globalCircuitBreaker.getState('gemini'),
              choices: [{ index: 0, message: { role: 'assistant', content: 'Recovered via fallback Groq after primary connection failure' }, finish_reason: 'stop' }]
            };
            if (idempotencyKey) globalIdempotencyStore.set(idempotencyKey, resultObj);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(resultObj));
            return;
          }

          if (faultHeader === 'fault_500') {
            log(`[FAULT_INJECTION] Simulando SERVER_5XX no primary. Policy: 1 retry -> fallback.`);
            attempts.push({ provider: 'gemini', attempt: 1, error_class: 'SERVER_5XX', action: 'retry_gemini' });
            attempts.push({ provider: 'gemini', attempt: 2, error_class: 'SERVER_5XX', action: 'fallback_to_groq' });
            globalCircuitBreaker.recordFailure('gemini', true);
            globalObservability.recordRetry('gemini', executionId, taskId);
            globalObservability.recordFallback('gemini', 'groq', 'SERVER_5XX', executionId, taskId);
            globalObservability.recordSuccess('groq', Date.now() - reqStartTime, true, 'primary_server_500', executionId, taskId);

            const resultObj = {
              id: 'fault-500-' + Date.now(),
              object: 'chat.completion',
              model: 'qwen/qwen3.6-27b',
              provider_used: 'groq',
              routing_tier: 'fallback_1',
              fallback_used: true,
              fallback_reason: 'primary_server_500',
              attempts: attempts,
              circuit_state: globalCircuitBreaker.getState('gemini'),
              choices: [{ index: 0, message: { role: 'assistant', content: 'Recovered via fallback Groq after primary 500 error' }, finish_reason: 'stop' }]
            };
            if (idempotencyKey) globalIdempotencyStore.set(idempotencyKey, resultObj);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(resultObj));
            return;
          }

          if (faultHeader === 'fault_invalid_request') {
            log(`[FAULT_INJECTION] Simulando INVALID_REQUEST (400). Policy: ZERO fallback, TASK_FAILURE pura.`);
            const c = classifyError({ message: 'Bad request syntax' }, 400);
            globalCircuitBreaker.recordFailure('gemini', false); // Não afeta circuit breaker!
            globalObservability.recordFailure('none', 'INVALID_REQUEST', false, Date.now() - reqStartTime, executionId, taskId);

            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              error: {
                message: 'Invalid request parameters in client payload',
                type: 'INVALID_REQUEST',
                error_class: c.error_class,
                is_provider_failure: false,
                allow_fallback: false
              }
            }));
            return;
          }

          if (faultHeader === 'fault_task_logic') {
            log(`[FAULT_INJECTION] Simulando TASK_LOGIC_ERROR. Policy: ZERO fallback (bug de negocio nao deve mascarar modelo).`);
            const c = classifyError({ message: 'business_rule_violation: AIS validation failed' }, 422);
            globalObservability.recordFailure('none', 'TASK_LOGIC_ERROR', false, Date.now() - reqStartTime, executionId, taskId);

            res.writeHead(422, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              error: {
                message: 'Task logic validation failed (AIS not matching table)',
                type: 'TASK_LOGIC_ERROR',
                error_class: c.error_class,
                is_provider_failure: false,
                allow_fallback: false
              }
            }));
            return;
          }

          if (faultHeader === 'fault_groq_failure') {
            log(`[FAULT_INJECTION] Simulando falha total nos 2 provedores ativos (Gemini falha -> Groq falha). Policy: encerra sem tentar 3o provider.`);
            attempts.push({ provider: 'gemini', attempt: 1, error_class: 'SERVER_5XX', action: 'retry_gemini' });
            attempts.push({ provider: 'gemini', attempt: 2, error_class: 'SERVER_5XX', action: 'fallback_to_groq' });
            attempts.push({ provider: 'groq', attempt: 1, error_class: 'SERVER_5XX', action: 'retry_groq' });
            attempts.push({ provider: 'groq', attempt: 2, error_class: 'SERVER_5XX', action: 'terminate_exhausted' });
            globalCircuitBreaker.recordFailure('gemini', true);
            globalCircuitBreaker.recordFailure('groq', true);
            globalObservability.recordRetry('gemini', executionId, taskId);
            globalObservability.recordFallback('gemini', 'groq', 'SERVER_5XX', executionId, taskId);
            globalObservability.recordRetry('groq', executionId, taskId);
            globalObservability.recordFailure('groq', 'SERVER_5XX', true, Date.now() - reqStartTime, executionId, taskId);

            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              error: {
                message: 'All active providers failed (Gemini, Groq). Fallback chain exhausted (2 providers max, 4 total attempts). OpenRouter and DeepSeek are deferred.',
                type: 'ALL_PROVIDERS_EXHAUSTED',
                providers_attempted: ['gemini', 'groq'],
                third_provider_attempted: false,
                attempts: attempts,
                circuit_state: {
                  gemini: globalCircuitBreaker.getState('gemini'),
                  groq: globalCircuitBreaker.getState('groq')
                }
              }
            }));
            return;
          }

          if (faultHeader === 'fault_circuit_break') {
            log(`[FAULT_INJECTION] Injetando 3 falhas de provedor no Gemini para disparar Circuit Breaker OPEN.`);
            globalCircuitBreaker.recordFailure('gemini', true);
            globalCircuitBreaker.recordFailure('gemini', true);
            globalCircuitBreaker.recordFailure('gemini', true);
            globalObservability.recordCircuitOpen('gemini');

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              circuit_state: globalCircuitBreaker.getState('gemini'),
              can_execute_gemini: globalCircuitBreaker.canExecute('gemini'),
              message: 'Gemini circuit breaker forced to OPEN'
            }));
            return;
          }
        }

        // SUPORTE A MOCKS BÁSICOS (Card #71)
        if (mockHeader) {
          let resultObj = null;
          if (mockHeader === 'simulate_primary_success') {
            if (!globalCircuitBreaker.canExecute('gemini')) {
              log(`[ROUTER] Gemini esta em estado OPEN no Circuit Breaker. Desviando para fallback_1 (Groq).`);
              globalObservability.recordFallback('gemini', 'groq', 'primary_circuit_breaker_open', executionId, taskId);
              globalObservability.recordSuccess('groq', Date.now() - reqStartTime, true, 'primary_circuit_breaker_open', executionId, taskId);
              resultObj = {
                id: 'mock-cb-fallback-' + Date.now(),
                object: 'chat.completion',
                model: 'qwen/qwen3.6-27b',
                provider_used: 'groq',
                routing_tier: 'fallback_1',
                fallback_used: true,
                fallback_reason: 'primary_circuit_breaker_open',
                circuit_state: globalCircuitBreaker.getState('gemini'),
                choices: [{ index: 0, message: { role: 'assistant', content: 'Mock response from fallback Groq (circuit breaker bypassed gemini)' }, finish_reason: 'stop' }]
              };
            } else {
              globalCircuitBreaker.recordSuccess('gemini');
              globalObservability.recordSuccess('gemini', Date.now() - reqStartTime, false, null, executionId, taskId);
              resultObj = {
                id: 'mock-cmpl-' + Date.now(),
                object: 'chat.completion',
                model: 'gemini-3.6-flash',
                provider_used: 'gemini',
                routing_tier: 'primary',
                fallback_used: false,
                circuit_state: globalCircuitBreaker.getState('gemini'),
                choices: [{ index: 0, message: { role: 'assistant', content: 'Mock response from primary provider (gemini-3.6-flash)' }, finish_reason: 'stop' }]
              };
            }
          } else if (mockHeader === 'simulate_fallback_1_success') {
            globalObservability.recordFallback('gemini', 'groq', 'primary_provider_failed', executionId, taskId);
            globalObservability.recordSuccess('groq', Date.now() - reqStartTime, true, 'primary_provider_failed', executionId, taskId);
            resultObj = {
              id: 'mock-cmpl-' + Date.now(),
              object: 'chat.completion',
              model: 'qwen/qwen3.6-27b',
              provider_used: 'groq',
              routing_tier: 'fallback_1',
              fallback_used: true,
              fallback_reason: 'primary_provider_failed',
              circuit_state: globalCircuitBreaker.getState('gemini'),
              choices: [{ index: 0, message: { role: 'assistant', content: 'Mock response from fallback_1 (qwen/qwen3.6-27b)' }, finish_reason: 'stop' }]
            };
          }

          if (resultObj) {
            if (idempotencyKey) globalIdempotencyStore.set(idempotencyKey, resultObj);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(resultObj));
            return;
          }
        }

        // VERIFICAÇÃO REAL DE CREDENCIAIS
        const config = loadConfig();
        const providersState = getProviderCredentialsState(config);
        const routeOrder = ['gemini', 'groq'];
        let selectedProvider = null;

        for (const provId of routeOrder) {
          if (providersState[provId] && providersState[provId].credential_present) {
            if (globalCircuitBreaker.canExecute(provId)) {
              selectedProvider = config.providers[provId];
              break;
            }
          }
        }

        if (!selectedProvider) {
          log(`[NO_CREDENTIAL] Rejeicao segura: nenhum provedor ativo com credencial valida no ambiente. Zero chamadas de rede externas.`);
          globalObservability.recordFailure('none', 'NO_PROVIDER_CREDENTIAL', false, Date.now() - reqStartTime, executionId, taskId);
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: {
              message: 'Nenhum provedor ativo configurado com credencial valida no ambiente. Configure GEMINI_API_KEY ou GROQ_API_KEY no arquivo .env local.',
              type: 'NO_PROVIDER_CREDENTIAL',
              code: 'no_credentials_available',
              providers_checked: routeOrder
            }
          }));
          return;
        }

        res.writeHead(501, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: {
            message: `Provedor ${selectedProvider.name} possui credencial presente, mas o despacho real pertence ao Card #74/#75.`,
            type: 'PENDING_DISPATCH_IMPLEMENTATION'
          }
        }));
      } catch (err) {
        log(`Erro ao processar request: ${err.message}`);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { message: err.message, type: 'INVALID_REQUEST' } }));
      }
    });
    return;
  }

  // Rota desconhecida
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: { message: 'Not found', type: 'NOT_FOUND' } }));
});

server.listen(PORT, HOST, () => {
  log(`Syntheon Local Router ativo em http://${HOST}:${PORT}`);
  try {
    fs.writeFileSync(PID_FILE, String(process.pid), 'utf8');
  } catch (e) {}
});

function gracefulShutdown() {
  log('Encerrando Syntheon Local Router...');
  server.close(() => {
    try {
      if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
    } catch (e) {}
    log('Syntheon Local Router finalizado com sucesso.');
    process.exit(0);
  });
}

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);