/**
 * Syntheon Agentic Layer - Fallback, Retry & Idempotency Test Suite
 * Card: #73 T-A01-POLICY-005
 */

const { start, isRouterAlive } = require('./start_router');
const { stop } = require('./stop_router');
const { executeTask } = require('../workers/syntheon_worker_adapter');
const {
  CircuitBreaker,
  IdempotencyStore,
  classifyError,
  CONSTANTS
} = require('../router/fallback_policy');

async function runTests() {
  console.log('================================================================');
  console.log('  TEST SUITE: FALLBACK, RETRY, CIRCUIT BREAKER & IDEMPOTENCY    ');
  console.log('  Card #73 T-A01-POLICY-005                                     ');
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

  // 1. Testes Unitários de Taxonomia e Classificação
  console.log('--- 1. Taxonomia de Erros & Separacao Provider vs Task Failure ---');
  {
    const authErr = classifyError({ message: 'Unauthorized' }, 401);
    assert(authErr.error_class === 'AUTH_ERROR' && !authErr.is_provider_failure && !authErr.allow_fallback,
      '401 classificado como AUTH_ERROR (TASK_FAILURE, allow_fallback=false, retryable=false)');

    const notFound = classifyError({ message: 'Model not found' }, 404);
    assert(notFound.error_class === 'MODEL_NOT_FOUND' && notFound.is_provider_failure && notFound.allow_fallback,
      '404 classificado como MODEL_NOT_FOUND (PROVIDER_FAILURE, allow_fallback=true)');

    const quota = classifyError({ message: 'Rate limit exceeded' }, 429);
    assert(quota.error_class === 'QUOTA_429' && quota.is_provider_failure && quota.retryable_same_provider && quota.allow_fallback,
      '429 classificado como QUOTA_429 (PROVIDER_FAILURE, retryable=true, allow_fallback=true)');

    const timeout = classifyError({ message: 'Request timeout' });
    assert(timeout.error_class === 'TIMEOUT' && timeout.is_provider_failure && timeout.retryable_same_provider && timeout.allow_fallback,
      'Timeout classificado como TIMEOUT (PROVIDER_FAILURE, retryable=true, allow_fallback=true)');

    const conn = classifyError({ message: 'connect ECONNREFUSED' });
    assert(conn.error_class === 'CONNECTION_ERROR' && conn.is_provider_failure && conn.allow_fallback,
      'ECONNREFUSED classificado como CONNECTION_ERROR (PROVIDER_FAILURE, allow_fallback=true)');

    const server500 = classifyError({ message: 'Internal Server Error' }, 500);
    assert(server500.error_class === 'SERVER_5XX' && server500.is_provider_failure && server500.allow_fallback,
      '500 classificado como SERVER_5XX (PROVIDER_FAILURE, allow_fallback=true)');

    const badReq = classifyError({ message: 'Bad syntax' }, 400);
    assert(badReq.error_class === 'INVALID_REQUEST' && !badReq.is_provider_failure && !badReq.allow_fallback,
      '400 classificado como INVALID_REQUEST (TASK_FAILURE, allow_fallback=false)');

    const taskLogic = classifyError({ message: 'business_rule_violation' }, 422);
    assert(taskLogic.error_class === 'TASK_LOGIC_ERROR' && !taskLogic.is_provider_failure && !taskLogic.allow_fallback,
      '422 classificado como TASK_LOGIC_ERROR (TASK_FAILURE, allow_fallback=false)');
  }

  // 2. Testes Unitários de Circuit Breaker
  console.log('\n--- 2. Circuit Breaker State Machine & Isolation ---');
  {
    const cb = new CircuitBreaker(3, 200); // 3 falhas, cooldown 200ms
    assert(cb.getState('p1') === 'CLOSED', 'Estado inicial eh CLOSED');
    assert(cb.canExecute('p1') === true, 'canExecute() eh true em CLOSED');

    // Falhas de tarefa NAO devem abrir o circuito
    cb.recordFailure('p1', false); // isProviderFailure = false
    assert(cb.getState('p1') === 'CLOSED', 'Falha de tarefa (TASK_FAILURE) NAO incrementa nem abre circuito');

    // 3 falhas de provedor consecutivas devem abrir o circuito
    cb.recordFailure('p1', true);
    cb.recordFailure('p1', true);
    assert(cb.getState('p1') === 'CLOSED', 'Apos 2 falhas, estado continua CLOSED');
    cb.recordFailure('p1', true);
    assert(cb.getState('p1') === 'OPEN', 'Apos 3 falhas de provedor, circuito transita para OPEN');
    assert(cb.canExecute('p1') === false, 'canExecute() eh false em OPEN');

    // Aguarda cooldown
    await new Promise(r => setTimeout(r, 250));
    assert(cb.canExecute('p1') === true, 'Apos cooldown, canExecute() eh true (transita para HALF_OPEN)');
    assert(cb.getState('p1') === 'HALF_OPEN', 'Circuito transita para HALF_OPEN');

    // Sucesso em HALF_OPEN fecha o circuito
    cb.recordSuccess('p1');
    assert(cb.getState('p1') === 'CLOSED', 'Sucesso em HALF_OPEN restaura circuito para CLOSED');
  }

  // 3. Testes Unitários de Idempotência
  console.log('\n--- 3. Idempotency Store & Deterministic Hash ---');
  {
    const store = new IdempotencyStore();
    const key1 = store.generateKey('TASK-01', 'EXEC-01', { text: 'abc' });
    const key2 = store.generateKey('TASK-01', 'EXEC-01', { text: 'abc' });
    const key3 = store.generateKey('TASK-01', 'EXEC-01', { text: 'xyz' });

    assert(key1 === key2, 'Mesmo payload produz hash e idempotency key identicos');
    assert(key1 !== key3, 'Payload diferente produz hash diferente');

    store.set(key1, { output: 'sucesso_01' });
    const fetched = store.get(key1);
    assert(fetched && fetched.result.output === 'sucesso_01', 'Store recupera resultado indexado pela chave');
    store.clear();
  }

  // 4. Testes de Integração com Router Server (Fault Injection & Worker Adapter)
  console.log('\n--- 4. Testes de Integracao Worker <-> Router Server ---');
  console.log('Iniciando Syntheon Local Router...');
  await start();

  try {
    // Cenário A: 429 Quota
    console.log('\n[Cenario A: 429 Quota]');
    const resA = await executeTask({
      taskId: 'T-A01-TEST-A',
      instruction: 'Teste de 429',
      faultInjectionHeader: 'fault_429'
    });
    assert(resA.status === 'COMPLETED' && resA.fallback_used === true && resA.provider_used === 'groq',
      '429 no primary aciona retry e fallback com sucesso para Groq');
    assert(resA.attempts.length >= 2, 'Tentativas registradas no metadata (retry + fallback)');

    // Cenário B: Timeout
    console.log('\n[Cenario B: Timeout]');
    const resB = await executeTask({
      taskId: 'T-A01-TEST-B',
      instruction: 'Teste de Timeout',
      faultInjectionHeader: 'fault_timeout'
    });
    assert(resB.status === 'COMPLETED' && resB.fallback_used === true && resB.fallback_reason === 'primary_timeout_exceeded',
      'Timeout no primary aciona retry controlado e fallback para Groq');

    // Cenário C: 500 Server Error
    console.log('\n[Cenario C: 500 Server Error]');
    const resC = await executeTask({
      taskId: 'T-A01-TEST-C',
      instruction: 'Teste de 500',
      faultInjectionHeader: 'fault_500'
    });
    assert(resC.status === 'COMPLETED' && resC.fallback_used === true && resC.fallback_reason === 'primary_server_500',
      '500 Server Error aciona retry e fallback para Groq');

    // Cenário D: 401 Auth Error (ZERO retry, ZERO fallback silencioso)
    console.log('\n[Cenario D: 401 Auth Error]');
    const resD = await executeTask({
      taskId: 'T-A01-TEST-D',
      instruction: 'Teste de 401',
      faultInjectionHeader: 'fault_401'
    });
    assert(resD.status === 'FAILED_AUTH_ERROR' && resD.fallback_used === false,
      '401 Auth devolve erro explícito sem retry e sem fallback silencioso');
    assert(resD.error && resD.error.allow_fallback === false, 'Metadata explicita allow_fallback=false');

    // Cenário E: Invalid Request (400)
    console.log('\n[Cenario E: 400 Invalid Request]');
    const resE = await executeTask({
      taskId: 'T-A01-TEST-E',
      instruction: 'Teste de 400',
      faultInjectionHeader: 'fault_invalid_request'
    });
    assert(resE.status === 'FAILED_INVALID_REQUEST' && resE.fallback_used === false,
      '400 Invalid Request devolve erro do cliente/schema sem fallback');

    // Cenário F: Task Logic Error (422)
    console.log('\n[Cenario F: 422 Task Logic Error]');
    const resF = await executeTask({
      taskId: 'T-A01-TEST-F',
      instruction: 'Teste de 422',
      faultInjectionHeader: 'fault_task_logic'
    });
    assert(resF.status === 'FAILED_TASK_LOGIC_ERROR' && resF.fallback_used === false,
      '422 Task Logic devolve erro de negocio sem mascarar com modelo alternativo');

    // Cenário G: Circuit Breaker em tempo de execução
    console.log('\n[Cenario G: Circuit Breaker Live Trip & Bypass]');
    // Dispara 3 falhas de provedor no Gemini
    await executeTask({ taskId: 'T-CB-TRIP', instruction: 'Trip CB', faultInjectionHeader: 'fault_circuit_break' });

    // Proxima chamada solicita primary (simulate_primary_success), mas Circuit Breaker OPEN deve desviar para Groq
    const resG = await executeTask({
      taskId: 'T-CB-BYPASS',
      instruction: 'Tenta primary com CB aberto',
      mockRoutingHeader: 'simulate_primary_success'
    });
    assert(resG.fallback_used === true && resG.provider_used === 'groq' && resG.fallback_reason === 'primary_circuit_breaker_open',
      'Circuit Breaker OPEN desvia requisicao do primary diretamente para fallback Groq sem chamar Gemini');

    // Cenário H: Idempotência / Replay Detection
    console.log('\n[Cenario H: Idempotencia & Replay Detection]');
    const idempKey = `IDEMP-TASK-73-EXEC-01-${Date.now()}`;
    const resH1 = await executeTask({
      taskId: 'T-IDEMP-01',
      instruction: 'Execucao com chave idempotente',
      mockRoutingHeader: 'simulate_fallback_1_success',
      idempotencyKey: idempKey
    });
    assert(resH1.status === 'COMPLETED' && resH1.replay_detected === false,
      'Primeira execucao processa normalmente (replay_detected=false)');

    const resH2 = await executeTask({
      taskId: 'T-IDEMP-01',
      instruction: 'Execucao com chave idempotente repetida',
      mockRoutingHeader: 'simulate_fallback_1_success',
      idempotencyKey: idempKey
    });
    assert(resH2.status === 'COMPLETED' && resH2.replay_detected === true,
      'Segunda execucao com mesma chave detecta replay e retorna resultado sem reprocessar (replay_detected=true)');

    // Cenário I: Limite Global de Tentativas
    console.log('\n[Cenario I: Limites Globais Contra Loops]');
    assert(CONSTANTS.MAX_RETRIES_PER_PROVIDER === 1, 'Max retries por provider = 1');
    assert(CONSTANTS.MAX_PROVIDERS_PER_EXECUTION === 3, 'Max providers por execucao = 3');
    assert(CONSTANTS.GLOBAL_ATTEMPT_LIMIT === 6, 'Limite global de tentativas = 6 (sem loops infinitos)');

  } finally {
    console.log('\nEncerrando router apos testes...');
    await stop();
  }

  console.log('\n================================================================');
  console.log(`  RESULTADOS FINAIS: ${passed} PASS, ${failed} FAIL             `);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runTests().catch(err => {
    console.error('Erro na suíte de testes:', err);
    process.exit(1);
  });
}
