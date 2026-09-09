/**
 * Syntheon Agentic Layer - Real Provider Dispatch (openai-compatible)
 * Card: #97 H01-006 - Despacho real config-driven (primary -> fallback_1).
 *
 * Sem terceiro provider: usa somente a cadeia do routing_policy do providers.json
 * (primary e fallback_1). Nenhuma chave e logada; erros sao classificados sem
 * vazar conteudo sensivel. Modo H01 test (env) permite falha primaria injetada
 * e/ou fallback mockado EXPLICITAMENTE marcado (mocked:true) - nunca mascara
 * indisponibilidade real: a resposta declara o que foi real e o que foi mock.
 */

const https = require('https');
const http = require('http');

const OPENAI_COMPATIBLE_TIMEOUT_MS = 45000;

function requestOnce({ baseUrl, apiKey, body, timeoutMs }) {
  return new Promise((resolve) => {
    const url = new URL(baseUrl.replace(/\/+$/, '') + '/chat/completions');
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;
    const payload = JSON.stringify(body);
    const req = lib.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        Authorization: 'Bearer ' + apiKey
      },
      timeout: timeoutMs || OPENAI_COMPATIBLE_TIMEOUT_MS
    }, (res) => {
      let raw = '';
      res.on('data', (c) => { raw += c; });
      res.on('end', () => {
        let data = null;
        try { data = JSON.parse(raw); } catch (e) { data = { raw_prefix: raw.substring(0, 200) }; }
        resolve({ status: res.statusCode, data });
      });
    });
    req.on('timeout', () => { req.destroy(new Error('TIMEOUT')); });
    req.on('error', (err) => resolve({ status: 0, data: { error: { message: String(err.message || err.code || 'NETWORK_ERROR').substring(0, 200) } } }));
    req.write(payload);
    req.end();
  });
}

/**
 * Executa uma completions real contra provider openai-compatible.
 * @returns {Promise<{ok:boolean, status:number, data:object}>}
 */
async function complete({ provider, messages, timeoutMs }) {
  const apiKey = (process.env[provider.api_key_env_var] || '').trim();
  if (!apiKey) {
    return { ok: false, status: 401, data: { error: { message: 'Credencial ausente para ' + provider.provider_id, type: 'NO_CREDENTIAL' } } };
  }
  const body = {
    model: provider.default_model,
    messages,
    max_tokens: 256,
    temperature: 0
  };
  const res = await requestOnce({ baseUrl: provider.base_url, apiKey, body, timeoutMs });
  return { ok: res.status >= 200 && res.status < 300, status: res.status, data: res.data };
}

module.exports = { complete, OPENAI_COMPATIBLE_TIMEOUT_MS };
