/**
 * Syntheon Agentic Layer - Unified Worker Adapter
 * Card: #72 T-A01-INTEGRATION-004
 *
 * RESPONSABILIDADE:
 * 1. Interface unificada para execucao agêntica via Router Local (http://127.0.0.1:4000/v1).
 * 2. O worker depende EXCLUSIVAMENTE do alias logico (ex: syntheon-worker) e do endpoint do router.
 * 3. O worker NAO conhece Gemini, Groq, OpenRouter ou DeepSeek diretamente.
 * 4. Captura metadados de provedor, tier e fallback em um schema estruturado.
 * 5. Zero chamadas diretas ao Telegram ou a provedores de terceiros.
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
  mockRoutingHeader = null
}) {
  const execId = executionId || `exec_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const targetModel = modelAlias || DEFAULT_MODEL_ALIAS;
  const timeout = timeoutMs || DEFAULT_TIMEOUT_MS;
  const baseUrl = DEFAULT_BASE_URL.replace(/\/+$/, '');

  // Suporte a bypass diagnostico explicito
  if (process.env.SYNTHEON_ROUTER_BYPASS === 'true') {
    return {
      task_id: taskId,
      execution_id: execId,
      router_alias: targetModel,
      provider_used: 'DIAGNOSTIC_BYPASS',
      model_used: 'none',
      routing_tier: 'bypass',
      fallback_used: false,
      fallback_reason: null,
      status: 'BYPASS_EXECUTED',
      output: 'Execucao concluida em modo de bypass diagnostico.',
      latency_ms: 0,
      error: null
    };
  }

  const promptContent = context ? `${instruction}\n\nContexto:\n${context}` : instruction;
  const startTime = Date.now();

  const headers = {
    'Content-Type': 'application/json'
  };

  if (mockRoutingHeader) {
    headers['X-Syntheon-Mock-Routing'] = mockRoutingHeader;
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
        messages: [{ role: 'user', content: promptContent }]
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
      const isFallback = tier !== 'primary' && tier !== 'mock_primary';

      return {
        task_id: taskId,
        execution_id: execId,
        router_alias: targetModel,
        provider_used: bodyJson.provider_used || 'unknown',
        model_used: bodyJson.model || targetModel,
        routing_tier: tier,
        fallback_used: isFallback,
        fallback_reason: isFallback ? (bodyJson.fallback_reason || 'primary_provider_failed') : null,
        status: 'COMPLETED',
        output: outputText,
        latency_ms: latency,
        error: null
      };
    }

    // 2. Falha controlada por ausencia de credencial (HTTP 401 NO_PROVIDER_CREDENTIAL)
    if (res.status === 401 && bodyJson && bodyJson.error && bodyJson.error.type === 'NO_PROVIDER_CREDENTIAL') {
      return {
        task_id: taskId,
        execution_id: execId,
        router_alias: targetModel,
        provider_used: 'none',
        model_used: targetModel,
        routing_tier: 'none',
        fallback_used: false,
        fallback_reason: null,
        status: 'FAILED_NO_CREDENTIAL',
        output: null,
        latency_ms: latency,
        error: {
          type: 'NO_PROVIDER_CREDENTIAL',
          message: bodyJson.error.message,
          providers_checked: bodyJson.error.providers_checked
        }
      };
    }

    // 3. Outras falhas HTTP
    return {
      task_id: taskId,
      execution_id: execId,
      router_alias: targetModel,
      provider_used: 'unknown',
      model_used: targetModel,
      routing_tier: 'unknown',
      fallback_used: false,
      fallback_reason: null,
      status: 'FAILED_HTTP',
      output: null,
      latency_ms: latency,
      error: {
        http_status: res.status,
        message: bodyJson ? (bodyJson.error ? bodyJson.error.message : bodyText) : bodyText
      }
    };

  } catch (err) {
    clearTimeout(timer);
    const latency = Date.now() - startTime;
    const isTimeout = err.name === 'AbortError';

    return {
      task_id: taskId,
      execution_id: execId,
      router_alias: targetModel,
      provider_used: 'none',
      model_used: targetModel,
      routing_tier: 'none',
      fallback_used: false,
      fallback_reason: null,
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