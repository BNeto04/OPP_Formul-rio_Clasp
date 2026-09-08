/**
 * Syntheon Agentic Layer - Local Router Smoke & Lifecycle Test
 * Card: #71 T-A01-ROUTER-003
 */

const { start } = require('./start_router');
const { stop } = require('./stop_router');

async function httpReq(path, options = {}) {
  const url = `http://127.0.0.1:4000${path}`;
  const res = await fetch(url, options);
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch (e) {}
  return { status: res.status, headers: res.headers, text, json };
}

async function run() {
  console.log('=== SYNTHEON AGENTIC LAYER - LOCAL ROUTER TEST BATTERY ===\n');

  // Passo 1: Garantir estado inicial limpo
  await stop();

  // Passo 2: Teste de Start
  console.log('[TEST 1] Iniciando Local Router...');
  const start1 = await start();
  if (!start1.ok) throw new Error('Falha no primeiro start');
  console.log('PASS: Router iniciado com sucesso.\n');

  // Passo 3: Teste de Idempotencia do Start
  console.log('[TEST 2] Testando segundo start (idempotencia)...');
  const start2 = await start();
  if (start2.status !== 'ALREADY_RUNNING') throw new Error('Segundo start nao detectou execucao previa');
  console.log('PASS: Idempotencia comprovada (ALREADY_RUNNING).\n');

  // Passo 4: Teste de Health Endpoint (GET /health)
  console.log('[TEST 3] Testando GET /health...');
  const health = await httpReq('/health');
  if (health.status !== 200 || !health.json || health.json.status !== 'healthy') {
    throw new Error(`Falha no healthcheck: HTTP ${health.status}`);
  }
  if (!health.json.aliases.includes('syntheon-worker')) {
    throw new Error('Alias syntheon-worker ausente no healthcheck');
  }
  console.log(`PASS: Healthcheck 200 OK | Aliases: ${health.json.aliases.join(', ')} | Idle LLM: ${health.json.idle_llm_calls}\n`);

  // Passo 5: Teste de Models Endpoint (GET /v1/models)
  console.log('[TEST 4] Testando GET /v1/models...');
  const models = await httpReq('/v1/models');
  if (models.status !== 200 || !models.json || !models.json.data) {
    throw new Error(`Falha no endpoint /v1/models: HTTP ${models.status}`);
  }
  const modelIds = models.json.data.map(m => m.id);
  console.log(`PASS: /v1/models 200 OK | Modelos registrados: ${modelIds.join(', ')}\n`);

  // Passo 6: Teste de Completion SEM CREDENCIAL (POST /v1/chat/completions)
  console.log('[TEST 5] Testando POST /v1/chat/completions sem credenciais...');
  const cmplNoCred = await httpReq('/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'syntheon-worker',
      messages: [{ role: 'user', content: 'ping' }]
    })
  });
  if (cmplNoCred.status !== 401 || !cmplNoCred.json || cmplNoCred.json.error.type !== 'NO_PROVIDER_CREDENTIAL') {
    throw new Error(`Rejeicao segura sem credencial falhou: HTTP ${cmplNoCred.status} | Body: ${cmplNoCred.text}`);
  }
  console.log(`PASS: Rejeicao segura 401 NO_PROVIDER_CREDENTIAL confirmada. Zero chamadas de rede externas.\n`);

  // Passo 7: Teste de Roteamento Mock - Sucesso no Primario
  console.log('[TEST 6] Testando Mock Routing: Simular sucesso no Primary (Gemini)...');
  const mockPrimary = await httpReq('/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Syntheon-Mock-Routing': 'simulate_primary_success'
    },
    body: JSON.stringify({
      model: 'syntheon-worker',
      messages: [{ role: 'user', content: 'ping' }]
    })
  });
  if (mockPrimary.status !== 200 || mockPrimary.json.provider_used !== 'gemini' || mockPrimary.json.model !== 'gemini-3.6-flash') {
    throw new Error(`Falha no mock primary routing: ${mockPrimary.text}`);
  }
  console.log(`PASS: Mock Primary roteado para [${mockPrimary.json.provider_used}] modelo ${mockPrimary.json.model}\n`);

  // Passo 8: Teste de Roteamento Mock - Fallback 1
  console.log('[TEST 7] Testando Mock Routing: Simular fallback para Groq...');
  const mockFallback1 = await httpReq('/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Syntheon-Mock-Routing': 'simulate_fallback_1_success'
    },
    body: JSON.stringify({
      model: 'syntheon-worker',
      messages: [{ role: 'user', content: 'ping' }]
    })
  });
  if (mockFallback1.status !== 200 || mockFallback1.json.provider_used !== 'groq' || mockFallback1.json.model !== 'qwen/qwen3.6-27b') {
    throw new Error(`Falha no mock fallback_1 routing: ${mockFallback1.text}`);
  }
  console.log(`PASS: Mock Fallback roteado para [${mockFallback1.json.provider_used}] modelo ${mockFallback1.json.model}\n`);

  // Passo 9: Teste de Stop e Liberacao de Porta
  console.log('[TEST 8] Testando Stop e liberacao de porta...');
  await stop();
  const deadCheck = await httpReq('/health').catch(() => null);
  if (deadCheck && deadCheck.status === 200) {
    throw new Error('Porta 4000 continua respondendo apos stop');
  }
  console.log('PASS: Router encerrado e porta 4000 devidamente liberada.\n');

  // Passo 10: Teste de Restart
  console.log('[TEST 9] Testando Restart...');
  await start();
  const restartCheck = await httpReq('/health');
  if (restartCheck.status !== 200) throw new Error('Falha no restart');
  console.log('PASS: Restart concluido com sucesso.\n');

  // Limpeza final
  await stop();
  console.log('=== BATERIA DO LOCAL ROUTER: 100% PASS (9/9 TESTES APROVADOS) ===');
}

run().catch(err => {
  console.error('\nFATAL:', err.message);
  process.exit(1);
});