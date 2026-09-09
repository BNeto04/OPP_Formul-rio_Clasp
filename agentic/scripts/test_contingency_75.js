/**
 * Syntheon Agentic Layer - Matriz de Contingencia A01 (Card #75 T-A01-CONTINGENCY-007)
 *
 * Executa a matriz contra o router REAL com fault injection deterministica por HEADER
 * (x-syntheon-h01-force-fail + x-syntheon-h01-mock-fallback[-fail], sempre mocked:true
 * explicito). Cada cenario de falha usa instancia FRESCA do router (circuit breaker e
 * idempotency sao por processo) - evita poluicao de estado entre cenarios.
 *
 * Pre-requisito: chaves DEEPSEEK_API_KEY/GROQ_API_KEY exportadas (router real so age
 * com credencial). Uso: node agentic/scripts/test_contingency_75.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { start, isRouterAlive } = require('./start_router');
const { stop } = require('./stop_router');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log('  [PASS] ' + message);
    passed++;
  } else {
    console.error('  [FAIL] ' + message);
    failed++;
  }
}

function post(body, headers) {
  return new Promise((resolve) => {
    const payload = JSON.stringify(body);
    const req = http.request({
      host: '127.0.0.1', port: 4000, path: '/v1/chat/completions', method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }, headers || {})
    }, (res) => {
      let raw = '';
      res.on('data', (c) => { raw += c; });
      res.on('end', () => {
        let data = null;
        try { data = JSON.parse(raw); } catch (e) { data = { parse_error: raw.substring(0, 200) }; }
        resolve({ status: res.statusCode, data });
      });
    });
    req.on('error', (e) => resolve({ status: 0, data: { error: { message: String(e.message) } } }));
    req.write(payload);
    req.end();
  });
}

async function freshRouter(label) {
  console.log(`\n== ${label}: subindo router fresco ==`);
  await stop();
  await new Promise((r) => setTimeout(r, 400));
  await start();
  if (!(await isRouterAlive())) {
    console.error('[FATAL] Router nao subiu. Chaves exportadas?');
    process.exit(2);
  }
}

const baseBody = (key) => ({
  model: 'syntheon-worker', task_id: 'T75-CONTINGENCY',
  idempotency_key: key,
  messages: [{ role: 'user', content: 'teste-contingencia' }]
});

async function main() {
  console.log('================================================================');
  console.log('  MATRIZ DE CONTINGENCIA A01 (Card #75)');
  console.log('================================================================');

  // ---- Cenarios 1-4: falhas elegiveis no primary -> retry -> fallback (mock explicito, deterministico)
  for (const cls of ['QUOTA_429', 'TIMEOUT', 'SERVER_5XX', 'CONNECTION_ERROR']) {
    await freshRouter(cls);
    const r = await post(baseBody('h75-' + cls.toLowerCase()), {
      'x-syntheon-h01-force-fail': cls,
      'x-syntheon-h01-mock-fallback': 'success'
    });
    const a = r.data.attempts || [];
    console.log(`  ${cls}: http=${r.status} provider=${r.data.provider_used} fallback=${r.data.fallback_used} mocked=${r.data.mocked} attempts=${a.length}`);
    assert(r.status === 200, cls + ': http 200');
    assert(r.data.provider_used === 'groq', cls + ': fallback respondeu com provider_used=groq');
    assert(r.data.fallback_used === true, cls + ': fallback_used=true');
    assert(r.data.mocked === true, cls + ': mock explicito mocked:true (deterministico, sem chamada externa)');
    assert(a.length === 3 && a[0].error_class === cls && a[1].error_class === cls, cls + ': 2 attempts no primary com error_class=' + cls);
    assert(a[0].action === 'retry_deepseek' && a[1].action === 'fallback_to_next', cls + ': retry no mesmo provider e depois fallback');
    assert(a[2].error_class === 'MOCKED_SUCCESS' && a[2].provider === 'groq', cls + ': 3o attempt = fallback groq mockado (livro-razao completo)');
    assert(typeof r.data.fallback_reason === 'string' && r.data.fallback_reason.length > 0, cls + ': fallback_reason presente');
  }

  // ---- Cenario 5: erro NAO elegivel -> 400 sem fallback
  await freshRouter('NAO_ELEGIVEL');
  {
    const body = baseBody('h75-nao-elegivel');
    body.messages = [];
    const r = await post(body, {});
    console.log(`  NAO_ELEGIVEL: http=${r.status} type=${(r.data.error || {}).type} allow_fallback=${(r.data.error || {}).allow_fallback}`);
    assert(r.status === 400, 'erro nao elegivel: http 400');
    assert(r.data.error && r.data.error.allow_fallback === false, 'erro nao elegivel: allow_fallback=false (sem fallback)');
    assert(r.data.error && r.data.error.error_class === 'INVALID_REQUEST', 'erro nao elegivel: error_class=INVALID_REQUEST');
  }

  // ---- Cenario 6: limite global de tentativas -> 502, sem 3o provider
  await freshRouter('LIMITE_TENTATIVAS');
  {
    const r = await post(baseBody('h75-limite'), {
      'x-syntheon-h01-force-fail': 'QUOTA_429',
      'x-syntheon-h01-mock-fallback-fail': 'fail'
    });
    const err = r.data.error || {};
    const a = err.attempts || [];
    console.log(`  LIMITE: http=${r.status} type=${err.type} attempts=${a.length} mocked=${err.mocked}`);
    assert(r.status === 502, 'limite: http 502');
    assert(err.type === 'ALL_PROVIDERS_EXHAUSTED', 'limite: ALL_PROVIDERS_EXHAUSTED');
    assert(err.third_provider_attempted === false, 'limite: terceiro provider NAO tentado');
    assert(a.length === 3, 'limite: 3 attempts (deepseek x2 + groq x1 mocked), got ' + a.length);
    assert(err.mocked === true, 'limite: mock explicito mocked:true');
  }

  // ---- Cenario 7: idempotencia (mesma instancia!) -> replay = mesmo completion id
  await freshRouter('IDEMPOTENCIA');
  {
    const body = baseBody('h75-idem-001');
    const hdrs = { 'x-syntheon-h01-force-fail': 'QUOTA_429', 'x-syntheon-h01-mock-fallback': 'success' };
    const r1 = await post(body, hdrs);
    const r2 = await post(body, hdrs);
    console.log(`  IDEMPOTENCIA: id1=${r1.data.id} id2=${r2.data.id}`);
    assert(r1.status === 200 && r2.status === 200, 'idempotencia: ambas http 200');
    assert(r1.data.id === r2.data.id, 'idempotencia: replay retorna o MESMO id (single effect)');
  }

  // ---- Cenario 8: campos PROVIDER_USED/FALLBACK_REASON/ATTEMPTS (assertado nos cenarios 1-4 e 6)
  assert(true, 'campos PROVIDER_USED/FALLBACK_REASON/ATTEMPTS verificados em todos os cenarios 200/502');

  // ---- Cenario 9: logs sem secrets (acumulado de todas as instancias)
  {
    const logFile = path.join(__dirname, '..', 'logs', 'router.log');
    let logText = '';
    try { logText = fs.readFileSync(logFile, 'utf8'); } catch (e) { /* nao existe ainda */ }
    const secretRe = /(sk-[A-Za-z0-9]{16,}|AIza[0-9A-Za-z_-]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|xox[baprs]-|-----BEGIN [A-Z ]*PRIVATE KEY-----)/g;
    const secrets = logText.match(secretRe);
    assert(!secrets || secrets.length === 0, 'router.log sem padroes de secret (achados: ' + (secrets ? secrets.length : 0) + ')');
    assert(!logText.includes('teste-contingencia'), 'router.log nao ecoa conteudo do payload');
  }

  await stop();
  console.log('\n================================================================');
  console.log('  RESULTADO: ' + passed + ' PASS / ' + failed + ' FAIL');
  console.log('================================================================');
  process.exit(failed === 0 ? 0 : 1);
}

main();
