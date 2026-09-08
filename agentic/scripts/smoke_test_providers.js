/**
 * Syntheon Agentic Layer - Secure Provider Smoke Test
 * Card: #70 T-A01-PROVIDERS-002 (AUDIT-FIX-001)
 *
 * RESTRIÇÕES ESTRITAS DE SEGURANÇA E SEMÂNTICA:
 * 1. NUNCA imprimir o valor de nenhuma chave de API.
 * 2. Se a chave estiver ausente no ambiente, NÃO efetuar requisição de rede e retornar CONFIG_CONTRACT_READY_NO_CREDENTIAL.
 * 3. Modelos obsoletos declarados em deprecated_models são rejeitados como DEPRECATED_MODEL.
 * 4. Apenas chamadas reais com credencial podem receber SMOKE_PASS.
 * 5. Serviços locais offline recebem status UNAVAILABLE.
 */

const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'config', 'providers.json');
const rawConfig = fs.readFileSync(configPath, 'utf8').replace(/^\uFEFF/, '');
const config = JSON.parse(rawConfig);

async function testGemini(p) {
  // Verificação de depreciação
  if (p.deprecated_models && p.deprecated_models.includes(p.default_model)) {
    return {
      provider: p.provider_id,
      model: p.default_model,
      status: 'DEPRECATED_MODEL',
      classification: 'OBSOLETE_MODEL_BLOCKED',
      latency_ms: 0,
      details: `Modelo ${p.default_model} descontinuado na documentacao oficial vigente.`
    };
  }

  const apiKey = process.env[p.api_key_env_var];
  if (!apiKey || apiKey.trim() === '') {
    return {
      provider: p.provider_id,
      model: p.default_model,
      status: 'CONFIG_CONTRACT_READY_NO_CREDENTIAL',
      latency_ms: 0,
      classification: 'CREDENTIAL_ABSENT',
      details: `Contrato valido. Variavel ${p.api_key_env_var} ausente no ambiente; chamada de rede evitada.`
    };
  }

  const start = Date.now();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${p.default_model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), p.timeout_ms || 15000);

    const res = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "ping" }] }],
        generationConfig: { maxOutputTokens: 1 }
      })
    });
    clearTimeout(timer);
    const latency = Date.now() - start;

    if (res.status === 200) {
      return { provider: p.provider_id, model: p.default_model, status: 'SMOKE_PASS', latency_ms: latency, http_code: 200 };
    } else if (res.status === 401 || res.status === 403) {
      return { provider: p.provider_id, model: p.default_model, status: 'SMOKE_FAIL', latency_ms: latency, http_code: res.status, classification: 'AUTH_ERROR_401_403' };
    } else if (res.status === 404) {
      return { provider: p.provider_id, model: p.default_model, status: 'SMOKE_FAIL', latency_ms: latency, http_code: 404, classification: 'MODEL_NOT_FOUND_404' };
    } else if (res.status === 429) {
      return { provider: p.provider_id, model: p.default_model, status: 'SMOKE_FAIL', latency_ms: latency, http_code: 429, classification: 'QUOTA_RATE_LIMIT_429' };
    } else if (res.status >= 500) {
      return { provider: p.provider_id, model: p.default_model, status: 'SMOKE_FAIL', latency_ms: latency, http_code: res.status, classification: 'SERVER_ERROR_5XX' };
    } else {
      return { provider: p.provider_id, model: p.default_model, status: 'SMOKE_FAIL', latency_ms: latency, http_code: res.status, classification: 'UNKNOWN_HTTP_STATUS' };
    }
  } catch (err) {
    const latency = Date.now() - start;
    const isTimeout = err.name === 'AbortError';
    return {
      provider: p.provider_id,
      model: p.default_model,
      status: 'SMOKE_FAIL',
      latency_ms: latency,
      classification: isTimeout ? 'TIMEOUT_EXCEEDED' : 'NETWORK_ERROR',
      details: isTimeout ? 'Timeout atingido' : err.message
    };
  }
}

async function testOpenAiCompatible(p) {
  // Verificação de depreciação
  if (p.deprecated_models && p.deprecated_models.includes(p.default_model)) {
    return {
      provider: p.provider_id,
      model: p.default_model,
      status: 'DEPRECATED_MODEL',
      classification: 'OBSOLETE_MODEL_BLOCKED',
      latency_ms: 0,
      details: `Modelo ${p.default_model} descontinuado na documentacao oficial vigente.`
    };
  }

  const apiKey = p.api_key_env_var ? process.env[p.api_key_env_var] : null;

  // Para provedores cloud que requerem chave:
  if (p.api_key_env_var && (!apiKey || apiKey.trim() === '')) {
    return {
      provider: p.provider_id,
      model: p.default_model,
      status: 'CONFIG_CONTRACT_READY_NO_CREDENTIAL',
      latency_ms: 0,
      classification: 'CREDENTIAL_ABSENT',
      details: `Contrato valido. Variavel ${p.api_key_env_var} ausente no ambiente; chamada de rede evitada.`
    };
  }

  const start = Date.now();
  const url = `${p.base_url}/chat/completions`;
  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), p.timeout_ms || 15000);

    const res = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: headers,
      body: JSON.stringify({
        model: p.default_model,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 1
      })
    });
    clearTimeout(timer);
    const latency = Date.now() - start;

    if (res.status === 200) {
      return { provider: p.provider_id, model: p.default_model, status: 'SMOKE_PASS', latency_ms: latency, http_code: 200 };
    } else if (res.status === 401 || res.status === 403) {
      return { provider: p.provider_id, model: p.default_model, status: 'SMOKE_FAIL', latency_ms: latency, http_code: res.status, classification: 'AUTH_ERROR_401_403' };
    } else if (res.status === 404) {
      return { provider: p.provider_id, model: p.default_model, status: 'SMOKE_FAIL', latency_ms: latency, http_code: 404, classification: 'MODEL_NOT_FOUND_404' };
    } else if (res.status === 429) {
      return { provider: p.provider_id, model: p.default_model, status: 'SMOKE_FAIL', latency_ms: latency, http_code: 429, classification: 'QUOTA_RATE_LIMIT_429' };
    } else if (res.status >= 500) {
      return { provider: p.provider_id, model: p.default_model, status: 'SMOKE_FAIL', latency_ms: latency, http_code: res.status, classification: 'SERVER_ERROR_5XX' };
    } else {
      return { provider: p.provider_id, model: p.default_model, status: 'SMOKE_FAIL', latency_ms: latency, http_code: res.status, classification: 'UNKNOWN_HTTP_STATUS' };
    }
  } catch (err) {
    const latency = Date.now() - start;
    const isTimeout = err.name === 'AbortError';
    const isOffline = err.cause && (err.cause.code === 'ECONNREFUSED' || err.cause.code === 'ENOTFOUND');
    return {
      provider: p.provider_id,
      model: p.default_model,
      status: isOffline ? 'UNAVAILABLE' : 'SMOKE_FAIL',
      latency_ms: latency,
      classification: isOffline ? 'CONNECTION_REFUSED_OFFLINE' : (isTimeout ? 'TIMEOUT_EXCEEDED' : 'NETWORK_ERROR'),
      details: isOffline ? 'Servico local offline' : (isTimeout ? 'Timeout atingido' : err.message)
    };
  }
}

async function runSmokeTests() {
  console.log('=== SYNTHEON AGENTIC LAYER - PROVIDER SMOKE TESTS (AUDIT-FIX-001) ===');
  const results = {};

  for (const [key, provider] of Object.entries(config.providers)) {
    let result;
    if (provider.sdk === 'google-genai') {
      result = await testGemini(provider);
    } else {
      result = await testOpenAiCompatible(provider);
    }
    results[key] = result;
    console.log(`[${provider.tier.toUpperCase()}] ${provider.name} (${provider.default_model}): ${result.status} [${result.classification || 'OK'}] - Latencia: ${result.latency_ms}ms`);
  }

  console.log('\n--- RESUMO FACTUAL ---');
  console.log(JSON.stringify(results, null, 2));
  return results;
}

if (require.main === module) {
  runSmokeTests();
}

module.exports = { runSmokeTests };