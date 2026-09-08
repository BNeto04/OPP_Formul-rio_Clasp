/**
 * Syntheon Agentic Layer - Unified Worker Adapter with Policy Metadata
 * Card: #72 T-A01-INTEGRATION-004 / Card: #73 T-A01-POLICY-005
 */

const crypto = require('crypto');

const DEFAULT_BASE_URL = process.env.SYNTHEON_ROUTER_BASE_URL || 'http://127.0.0.1:4000/v1';
const DEFAULT_MODEL_ALIAS = process.env.SYNTHEON_ROUTER_MODEL || 'syntheon-worker';
const DEFAULT_TIMEOUT_MS = parseInt(process.env.SYNTHEON_ROUTER_TIMEOUT_MS || '30000', 10);

async function executeTask({
  taskId = 'TASK_UNKNOWN',
  instruction = '',
  context = null,
  modelAlias = null,
  timeoutMs = null,
  executionId = null,
  mockRoutingHeader = null,
  faultInjectionHeader = null,
  idempotencyKey = null
}) {
  const execId = executionId || `exec_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const targetModel = modelAlias || DEFAULT_MODEL_ALIAS;
  const timeout = timeoutMs || DEFAULT_TIMEOUT_MS;
  const baseUrl = DEFAULT_BASE_URL.replace(/\/+$/, '');

  const promptContent = context ? `${instruction}\n\nContexto:\n${context}` : instruction;
  const idempKey = idempotencyKey || `${taskId}:${execId}:${crypto.createHash('sha256').update(promptContent).digest('hex').substring(0, 16)}`;

  // Suporte a bypass diagnostico explicito
  if (process.env.SYNTHEON_ROUTER_BYPASS === 'true') {
    return {
      task_id: taskId,
      execution_id: execId,
      idempotency_key: idempKey,
      replay_detected: false,
      router_alias: targetModel,
      provider_used: 'DIAGNOSTIC_BYPASS',
      model_used: 'none',
      routing_tier: 'bypass',
      fallback_used: false,
      fallback_reason: null,
      circuit_state: 'CLOSED',
      attempts: [{ attempt: 1, action: 'bypass' }],
      status: 'BYPASS_EXECUTED',
      output: 'Execucao concluida em modo de bypass diagnostico.',
      latency_ms: 0,
      error: null
    };
  }

  const startTime = Date.now();
  const headers = {
    'Content-Type': 'application/json',
    'X-Syntheon-Idempotency-Key': idempKey
  };

  if (mockRoutingHeader) {
    headers['X-Syntheon-Mock-Routing'] = mockRoutingHeader;
  }
  if (faultInjectionHeader) {
    headers['X-Syntheon-Fault-Injection'] = faultInjectionHeader;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: headers,
      signal: controller.signal,
      body: JSON.stringify({
        model: targetModel,
        messages: [{ role: 'user', content: promptContent }],
        idempotency_key: idempKey
      })
    });

    clearTimeout(timer);
    const latency = Date.now() - startTime;
    const bodyText = await res.text();
    let bodyJson = null;
    try { bodyJson = JSON.parse(bodyText); } catch (e) {}

    // 1. Sucesso HTTP 200
    if (res.status === 200 && bodyJson) {
      const choice = bodyJson.choices && bodyJson.choices[0];
      const outputText = (choice && choice.message && choice.message.content) ? choice.message.content : '';
      const tier = bodyJson.routing_tier || 'primary';
      const isFallback = Boolean(bodyJson.fallback_used || (tier !== 'primary' && tier !== 'mock_primary'));

      return {
        task_id: taskId,
        execution_id: execId,
        idempotency_key: idempKey,
        replay_detected: Boolean(bodyJson.replay_detected),
        router_alias: targetModel,
        provider_used: bodyJson.provider_used || 'unknown',
        model_used: bodyJson.model || targetModel,
        routing_tier: tier,
        fallback_used: isFallback,
        fallback_reason: bodyJson.fallback_reason || (isFallback ? 'primary_provider_failed' : null),
        circuit_state: bodyJson.circuit_state || 'CLOSED',
        attempts: bodyJson.attempts || [{ provider: bodyJson.provider_used, attempt: 1, action: 'success' }],
        status: 'COMPLETED',
        output: outputText,
        latency_ms: latency,
        error: null
      };
    }

    // 2. Falha controlada estruturada (401 / 400 / 422)
    return {
      task_id: taskId,
      execution_id: execId,
      idempotency_key: idempKey,
      replay_detected: false,
      router_alias: targetModel,
      provider_used: 'none',
      model_used: targetModel,
      routing_tier: 'none',
      fallback_used: false,
      fallback_reason: null,
      circuit_state: (bodyJson && bodyJson.circuit_state) ? bodyJson.circuit_state : 'CLOSED',
      attempts: (bodyJson && bodyJson.attempts) ? bodyJson.attempts : [{ attempt: 1, action: 'error_response' }],
      status: (res.status === 401 && bodyJson && bodyJson.error && bodyJson.error.type === 'NO_PROVIDER_CREDENTIAL')
        ? 'FAILED_NO_CREDENTIAL'
        : (bodyJson && bodyJson.error && bodyJson.error.type ? `FAILED_${bodyJson.error.type}` : 'FAILED_HTTP'),
      output: null,
      latency_ms: latency,
      error: bodyJson ? bodyJson.error : { http_status: res.status, message: bodyText }
    };

  } catch (err) {
    clearTimeout(timer);
    const latency = Date.now() - startTime;
    const isTimeout = err.name === 'AbortError';

    return {
      task_id: taskId,
      execution_id: execId,
      idempotency_key: idempKey,
      replay_detected: false,
      router_alias: targetModel,
      provider_used: 'none',
      model_used: targetModel,
      routing_tier: 'none',
      fallback_used: false,
      fallback_reason: null,
      circuit_state: 'CLOSED',
      attempts: [{ attempt: 1, action: 'network_exception' }],
      status: isTimeout ? 'FAILED_TIMEOUT' : 'FAILED_NETWORK',
      output: null,
      latency_ms: latency,
      error: {
        type: isTimeout ? 'TIMEOUT_ERROR' : 'NETWORK_ERROR',
        message: err.message
      }
    };
  }
}

module.exports = {
  executeTask,
  DEFAULT_BASE_URL,
  DEFAULT_MODEL_ALIAS
};