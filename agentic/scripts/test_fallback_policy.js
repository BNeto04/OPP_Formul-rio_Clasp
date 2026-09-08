/**
 * Syntheon Agentic Layer - Fallback, Retry & Idempotency Test Suite
 * Card: #73 T-A01-POLICY-005 (AUDIT-FIX-002: 2 Active Providers: Gemini -> Groq)
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
  console.log('  Card #73 T-A01-POLICY-005 (AUDIT-FIX-002: 2 Providers Only)   ');
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

  // 2. Testes Unitários de Circuit Breaker Independente por Provider
  console.log('\n--- 2. Circuit Breaker Independente (Gemini vs Groq) & Isolamento ---');
  {
    const cb = new CircuitBreaker(3, 200); // 3 falhas, cooldown 200ms
    assert(cb.getState('gemini') === 'CLOSED', 'Estado inicial do Gemini eh CLOSED');
    assert(cb.getState('groq') === 'CLOSED', 'Estado inicial do Groq eh CLOSED');

    // Falhas de tarefa NAO devem abrir o circuito
    cb.recordFailure('gemini', false); // isProviderFailure = false
    assert(cb.getState('gemini') === 'CLOSED', 'Falha de tarefa (TASK_FAILURE) NAO incrementa nem abre circuito do Gemini');

    // 3 falhas no Gemini abrem Gemini mas mantem Groq CLOSED
    cb.recordFailure('gemini', true);
    cb.recordFailure('gemini', true);
    cb.recordFailure('gemini', true);
    assert(cb.getState('gemini') === 'OPEN', 'Apos 3 falhas de provedor, circuito do Gemini transita para OPEN');
    assert(cb.canExecute('gemini') === false, 'canExecute(gemini) eh false em OPEN');
    assert(cb.getState('groq') === 'CLOSED', 'Circuito do Groq permanece 100% CLOSED (independencia garantida)');
    assert(cb.canExecute('groq') === true, 'canExecute(groq) continua true');

    // Aguarda cooldown
    await new Promise(r => setTimeout(r, 250));
    assert(cb.canExecute('gemini') === true, 'Apos cooldown, canExecute(gemini) eh true (transita para HALF_OPEN)');
    assert(cb.getState('gemini') === 'HALF_OPEN', 'Circuito Gemini transita para HALF_OPEN');

    // Sucesso em HALF_OPEN fecha o circuito
    cb.recordSuccess('gemini');
    assert(cb.getState('gemini') === 'CLOSED', 'Sucesso em HALF_OPEN restaura circuito Gemini para CLOSED');

    // Testa circuito do Groq de forma independente
    cb.recordFailure('groq', true);
    cb.recordFailure('groq', true);
    cb.recordFailure('groq', true);
    assert(cb.getState('groq') === 'OPEN', 'Circuito do Groq transita para OPEN independentemente');
    assert(cb.getState('gemini') === 'CLOSED', 'Gemini permanece CLOSED enquanto Groq esta OPEN');
    cb.recordSuccess('groq');
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
      '401 Auth devolve erro explicito sem retry e sem fallback silencioso');
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

    // Cenário I: Limites Factuais de 2 Providers
    console.log('\n[Cenario I: Limites Factuais de 2 Provedores (Gemini -> Groq)]');
    assert(CONSTANTS.MAX_RETRIES_PER_PROVIDER === 1, 'Max retries por provider = 1');
    assert(CONSTANTS.MAX_PROVIDERS_PER_EXECUTION === 2, 'Max providers por execucao = 2 (exclusivo Gemini -> Groq)');
    assert(CONSTANTS.GLOBAL_ATTEMPT_LIMIT === 4, 'Limite global factual de tentativas = 4 (2 providers x 2 tentativas)');

    // Cenário J: Esgotamento da Cadeia de 2 Providers sem Terceiro
    console.log('\n[Cenario J: Falha no Fallback 1 Encerra Cadeia sem Terceiro Provedor]');
    const resJ = await executeTask({
      taskId: 'T-A01-TEST-J',
      instruction: 'Teste de esgotamento de cadeia de 2 providers',
      faultInjectionHeader: 'fault_groq_failure'
    });
    assert(resJ.status === 'FAILED_ALL_PROVIDERS_EXHAUSTED', 'Status eh FAILED_ALL_PROVIDERS_EXHAUSTED');
    assert(resJ.error && resJ.error.third_provider_attempted === false, 'Zero tentativa de terceiro provider (third_provider_attempted=false)');
    assert(resJ.error && resJ.error.providers_attempted.length === 2, 'Apenas 2 providers foram tentados (Gemini e Groq)');
    assert(resJ.error && resJ.error.attempts.length === 4, 'Exatamente 4 tentativas no total antes do encerramento seguro');

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
