/**
 * Syntheon Agentic Layer - Observability, Metrics & Healthcheck Test Suite
 * Card: #74 T-A01-OBSERVABILITY-006
 */

const { start } = require('./start_router');
const { stop } = require('./stop_router');
const { executeTask } = require('../workers/syntheon_worker_adapter');
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '..', 'logs', 'router.log');
const BACKUP_LOG_FILE = path.join(__dirname, '..', 'logs', 'router.log.1');

async function httpGet(path) {
  const res = await fetch(`http://127.0.0.1:4000${path}`);
  const json = await res.json();
  return { status: res.status, json };
}

async function runTests() {
  console.log('================================================================');
  console.log('  TEST SUITE: OBSERVABILITY, HEALTHCHECK & METRICS (Card #74)   ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Garantir router ativo
  console.log('Iniciando Local Router...');
  await stop();
  await start();

  try {
    // Teste A: Observação em Idle
    console.log('\n[TEST A] Observacao de Ociosidade (Idle LLM & Network Calls = 0)...');
    await new Promise(r => setTimeout(r, 1000)); // Intervalo de idle controlado
    const healthInit = await httpGet('/health');
    assert(healthInit.status === 200, 'GET /health responde HTTP 200');
    assert(healthInit.json.idle_llm_calls === 0, 'Zero chamadas de LLM em idle (idle_llm_calls = 0)');
    assert(healthInit.json.idle_network_calls === 0, 'Zero chamadas de rede externas em idle (idle_network_calls = 0)');

    // Teste B: Integridade de Campos do Healthcheck
    console.log('\n[TEST B] Integridade dos Campos no GET /health...');
    const h = healthInit.json;
    assert(h.router_alive === true, 'router_alive = true');
    assert(typeof h.uptime_seconds === 'number' && h.uptime_seconds >= 0, 'uptime_seconds presente');
    assert(Array.isArray(h.active_providers) && h.active_providers.join(',') === 'gemini,groq', 'active_providers: [gemini, groq]');
    assert(Array.isArray(h.deferred_providers) && h.deferred_providers.includes('openrouter'), 'deferred_providers inclui openrouter e deepseek');
    assert(typeof h.credential_present === 'object' && 'gemini' in h.credential_present, 'credential_present booleans presentes por provider');
    assert(h.circuit_state && h.circuit_state.gemini === 'CLOSED' && h.circuit_state.groq === 'CLOSED', 'circuit_state presente para gemini e groq');
    assert('total_requests' in h && 'successful_requests' in h && 'failed_requests' in h && 'fallback_count' in h, 'Contadores essenciais presentes no healthcheck');

    // Teste C: Endpoint de Métricas Sob Demanda (GET /metrics)
    console.log('\n[TEST C] Integridade do Endpoint GET /metrics...');
    const metricsInit = await httpGet('/metrics');
    assert(metricsInit.status === 200, 'GET /metrics responde HTTP 200');
    const m = metricsInit.json;
    assert(m.metrics_storage === 'memory_with_local_snapshot', 'Storage semantico eh memoria com snapshot local');
    assert(m.requests_total >= 0, 'requests_total presente no snapshot');
    assert(m.gemini_metrics && typeof m.gemini_metrics.attempts === 'number', 'gemini_metrics estruturado');
    assert(m.groq_metrics && typeof m.groq_metrics.attempts === 'number', 'groq_metrics estruturado');

    // Teste D: Mock Primary Incrementa Contador Gemini e requests_success
    console.log('\n[TEST D] Mock Primary incrementa metricas do Gemini e sucesso global...');
    const beforeD = (await httpGet('/metrics')).json;
    await executeTask({
      taskId: 'TEST_TASK_OBS_D',
      instruction: 'Mock primary metrics test',
      mockRoutingHeader: 'simulate_primary_success'
    });
    const afterD = (await httpGet('/metrics')).json;
    assert(afterD.requests_success === beforeD.requests_success + 1, 'requests_success incrementou em 1');
    assert(afterD.gemini_metrics.success === beforeD.gemini_metrics.success + 1, 'gemini_metrics.success incrementou em 1');

    // Teste E: Mock Fallback Incrementa fallbacks_total e Groq
    console.log('\n[TEST E] Mock Fallback incrementa fallbacks_total e metricas do Groq...');
    const beforeE = (await httpGet('/metrics')).json;
    await executeTask({
      taskId: 'TEST_TASK_OBS_E',
      instruction: 'Mock fallback metrics test',
      mockRoutingHeader: 'simulate_fallback_1_success'
    });
    const afterE = (await httpGet('/metrics')).json;
    assert(afterE.fallbacks_total === beforeE.fallbacks_total + 1, 'fallbacks_total incrementou em 1');
    assert(afterE.groq_metrics.success === beforeE.groq_metrics.success + 1, 'groq_metrics.success incrementou em 1');

    // Teste F: Fault 429 Incrementa rate_limits, retries e fallbacks
    console.log('\n[TEST F] Fault 429 incrementa rate_limits_total, retries_total e fallbacks_total...');
    const beforeF = (await httpGet('/metrics')).json;
    await executeTask({
      taskId: 'TEST_TASK_OBS_F',
      instruction: 'Fault 429 metrics test',
      faultInjectionHeader: 'fault_429'
    });
    const afterF = (await httpGet('/metrics')).json;
    assert(afterF.rate_limits_total === beforeF.rate_limits_total + 1, 'rate_limits_total incrementou em 1');
    assert(afterF.retries_total === beforeF.retries_total + 1, 'retries_total incrementou em 1');
    assert(afterF.fallbacks_total === beforeF.fallbacks_total + 1, 'fallbacks_total incrementou em 1');

    // Teste G: Fault Timeout Incrementa timeouts_total
    console.log('\n[TEST G] Fault Timeout incrementa timeouts_total...');
    const beforeG = (await httpGet('/metrics')).json;
    await executeTask({
      taskId: 'TEST_TASK_OBS_G',
      instruction: 'Fault Timeout metrics test',
      faultInjectionHeader: 'fault_timeout'
    });
    const afterG = (await httpGet('/metrics')).json;
    assert(afterG.timeouts_total === beforeG.timeouts_total + 1, 'timeouts_total incrementou em 1');
    assert(afterG.retries_total === beforeG.retries_total + 1, 'retries_total incrementou em 1');

    // Teste H: Auth 401 Incrementa auth_errors_total e Zero Fallback
    console.log('\n[TEST H] Auth 401 incrementa auth_errors_total sem acionar fallback...');
    const beforeH = (await httpGet('/metrics')).json;
    await executeTask({
      taskId: 'TEST_TASK_OBS_H',
      instruction: 'Auth 401 metrics test',
      faultInjectionHeader: 'fault_401'
    });
    const afterH = (await httpGet('/metrics')).json;
    assert(afterH.auth_errors_total === beforeH.auth_errors_total + 1, 'auth_errors_total incrementou em 1');
    assert(afterH.fallbacks_total === beforeH.fallbacks_total, 'fallbacks_total NAO incrementou (zero fallback em 401)');

    // Teste I: Idempotency Replay Incrementa idempotency_replays_total
    console.log('\n[TEST I] Idempotency Replay incrementa idempotency_replays_total...');
    const idempKey = `IDEMP-OBS-${Date.now()}`;
    await executeTask({
      taskId: 'TEST_TASK_OBS_I',
      instruction: 'First execution',
      mockRoutingHeader: 'simulate_primary_success',
      idempotencyKey: idempKey
    });
    const beforeI = (await httpGet('/metrics')).json;
    await executeTask({
      taskId: 'TEST_TASK_OBS_I',
      instruction: 'Replay execution',
      mockRoutingHeader: 'simulate_primary_success',
      idempotencyKey: idempKey
    });
    const afterI = (await httpGet('/metrics')).json;
    assert(afterI.idempotency_replays_total === beforeI.idempotency_replays_total + 1, 'idempotency_replays_total incrementou em 1');

    // Teste J: Circuit Open Incrementa circuit_open_total
    console.log('\n[TEST J] Circuit Open incrementa circuit_open_total...');
    const beforeJ = (await httpGet('/metrics')).json;
    await executeTask({
      taskId: 'TEST_TASK_OBS_J',
      instruction: 'Circuit trip test',
      faultInjectionHeader: 'fault_circuit_break'
    });
    const afterJ = (await httpGet('/metrics')).json;
    assert(afterJ.circuit_open_total === beforeJ.circuit_open_total + 1, 'circuit_open_total incrementou em 1');

    // Teste K: Log Rotation Enxuto
    console.log('\n[TEST K] Log Rotation enxuto...');
    const testLogLimit = 10 * 1024; // 10 KB para teste unitário rápido
    process.env.SYNTHEON_MAX_LOG_BYTES = String(testLogLimit);
    await stop();
    await start();

    // Escreve dados no log para ultrapassar 10KB
    const padding = 'X'.repeat(12 * 1024);
    fs.appendFileSync(LOG_FILE, padding + '\n', 'utf8');

    // Executa chamada que força a rotação no log() do router
    await executeTask({
      taskId: 'TEST_LOG_ROTATION',
      instruction: 'Trigger log rotate',
      mockRoutingHeader: 'simulate_fallback_1_success'
    });
    delete process.env.SYNTHEON_MAX_LOG_BYTES;

    assert(fs.existsSync(BACKUP_LOG_FILE), 'Backup de rotacao router.log.1 criado com sucesso');
    assert(fs.statSync(LOG_FILE).size < testLogLimit, 'Arquivo ativo router.log reiniciado abaixo do limite');

  } finally {
    console.log('\nEncerrando router apos testes...');
    await stop();
    // Limpeza de backup de teste
    try {
      if (fs.existsSync(BACKUP_LOG_FILE)) fs.unlinkSync(BACKUP_LOG_FILE);
    } catch (e) {}
  }

  console.log('\n================================================================');
  console.log(`  RESULTADOS OBSERVABILIDADE: ${passed} PASS, ${failed} FAIL    `);
  console.log('================================================================');

  if (failed > 0) process.exit(1);
}

if (require.main === module) {
  runTests().catch(err => {
    console.error('Erro na suite de observabilidade:', err);
    process.exit(1);
  });
}
