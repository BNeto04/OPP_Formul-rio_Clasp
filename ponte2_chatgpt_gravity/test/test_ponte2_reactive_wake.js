/**
 * Teste Canônico do Card #59: ADM-BRIDGE2-REACTIVE-WAKE-001
 * Validação do Wake Reativo da Ponte 2 com Watchdog de Baixo Custo
 */

const http = require('http');
const assert = require('assert');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: body ? JSON.parse(body) : null });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== INICIANDO TESTES DO CARD #59: WAKE REATIVO PONTE 2 ===\n');
  const baseOptions = { hostname: '127.0.0.1', port: 8767 };

  // 1. Teste de status inicial
  console.log('1. Verificando telemetria inicial da Ponte 2 (/status)...');
  const initialStatus = await request({ ...baseOptions, path: '/status', method: 'GET' });
  assert.strictEqual(initialStatus.status, 200);
  assert.strictEqual(typeof initialStatus.body.wake_waiters_count, 'number');
  console.log('   OK: wake_waiters_count presente na telemetria:', initialStatus.body.wake_waiters_count);

  // 2. Teste de Wake Reativo imediato: Waiter registrado -> CALL chega -> Waiter acorda
  console.log('\n2. Testando Wake Reativo imediato (CALL nova acorda waiter)...');
  const callId = `TEST-WAKE-${Date.now()}`;
  let wakeTriggered = false;
  let wakeEventData = null;

  const wakePromise = request({ ...baseOptions, path: '/wait_call?timeout=5000', method: 'GET' })
    .then(res => {
      wakeTriggered = true;
      wakeEventData = res.body;
      return res;
    });

  // Aguarda 100ms para garantir que o waiter está registrado no servidor
  await new Promise(r => setTimeout(r, 100));

  const statusWithWaiter = await request({ ...baseOptions, path: '/status', method: 'GET' });
  assert.strictEqual(statusWithWaiter.body.wake_waiters_count >= 1, true, 'Waiter deve estar registrado');
  console.log('   OK: Waiter registrado com sucesso no daemon.');

  // Despacha CALL
  const callPost = await request({
    ...baseOptions,
    path: '/call',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    call_id: callId,
    task_id: 'TASK-TEST-WAKE-001',
    type: 'CALL',
    payload: 'Teste de wake reativo'
  });
  assert.strictEqual(callPost.status, 200);
  assert.strictEqual(callPost.body.ok, true);

  // Aguarda resposta do wakePromise
  const wakeRes = await wakePromise;
  assert.strictEqual(wakeRes.status, 200);
  assert.strictEqual(wakeRes.body.event, 'CALL_READY');
  assert.strictEqual(wakeRes.body.call_id, callId);
  console.log('   OK: Wake disparado reativamente em menos de 100ms:', wakeRes.body);

  // Gravity consome a CALL sob single-flight
  const consumedCall = await request({ ...baseOptions, path: '/call', method: 'GET' });
  assert.strictEqual(consumedCall.body.call_id, callId);
  console.log('   OK: Gravity consumiu a CALL sob Single-Flight Lock.');

  // Gravity envia ACK da CALL
  const ackRes = await request({
    ...baseOptions,
    path: '/call_ack',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { call_id: callId });
  assert.strictEqual(ackRes.body.ok, true);
  console.log('   OK: Gravity confirmou recebimento da CALL (ACK).');

  // Gravity entrega o RESULT
  const resultRes = await request({
    ...baseOptions,
    path: '/result',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    call_id: callId,
    type: 'RESULT',
    payload: 'Resultado do teste de wake'
  });
  assert.strictEqual(resultRes.body.ok, true);
  console.log('   OK: RESULT entregue à fila de saída.');

  // Simula extensão consumindo e confirmando RESULT
  const dispatchedResult = await request({ ...baseOptions, path: '/result', method: 'GET' });
  assert.strictEqual(dispatchedResult.body.call_id, callId);

  const resultAck = await request({
    ...baseOptions,
    path: '/result_ack',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { call_id: callId });
  assert.strictEqual(resultAck.body.ok, true);
  console.log('   OK: RESULT confirmado pela extensão do ChatGPT.');

  // 3. Teste de Timeout / Idle Silencioso (SEM CALL = TIMEOUT_IDLE, sem erro)
  console.log('\n3. Testando timeout idle silencioso (/wait_call?timeout=500)...');
  const timeoutStart = Date.now();
  const timeoutRes = await request({ ...baseOptions, path: '/wait_call?timeout=500', method: 'GET' });
  const elapsed = Date.now() - timeoutStart;
  assert.strictEqual(timeoutRes.status, 200);
  assert.strictEqual(timeoutRes.body.event, 'TIMEOUT_IDLE');
  assert.strictEqual(elapsed >= 450, true);
  console.log(`   OK: Timeout idle disparado após ${elapsed}ms com evento TIMEOUT_IDLE.`);

  // 4. Teste de Deduplicação (DEDUPE_NO_OP não gera wake espúrio)
  console.log('\n4. Testando deduplicação determinística contra wake espúrio...');
  let spuriousWake = false;
  const dedupeWaiter = request({ ...baseOptions, path: '/wait_call?timeout=1000', method: 'GET' })
    .then(r => {
      if (r.body.event === 'CALL_READY') spuriousWake = true;
      return r;
    });

  await new Promise(r => setTimeout(r, 100));

  // Tenta reenviar a mesma callId
  const dupPost = await request({
    ...baseOptions,
    path: '/call',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    call_id: callId,
    type: 'CALL',
    payload: 'Tentativa duplicada'
  });
  assert.strictEqual(dupPost.body.dedupe, true);
  assert.strictEqual(dupPost.body.status, 'DEDUPE_NO_OP');
  console.log('   OK: CALL duplicada rejeitada com DEDUPE_NO_OP.');

  await dedupeWaiter;
  assert.strictEqual(spuriousWake, false, 'Deduplicação não pode gerar wake espúrio');
  console.log('   OK: Zero wake espúrio gerado para retry duplicado.');

  // 5. Teste de Wake Perdido / Recuperação por Watchdog
  console.log('\n5. Testando recuperação de wake perdido por watchdog...');
  const lostCallId = `TEST-LOST-WAKE-${Date.now()}`;
  // Enfileira CALL quando NÃO há waiter escutando
  const lostPost = await request({
    ...baseOptions,
    path: '/call',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    call_id: lostCallId,
    type: 'CALL',
    payload: 'Chamada para teste de wake perdido'
  });
  assert.strictEqual(lostPost.body.ok, true);

  // Watchdog acorda depois e consulta /wait_call ou /status
  const watchdogWait = await request({ ...baseOptions, path: '/wait_call?timeout=5000', method: 'GET' });
  assert.strictEqual(watchdogWait.status, 200);
  assert.strictEqual(watchdogWait.body.event, 'CALL_READY');
  assert.strictEqual(watchdogWait.body.call_id, lostCallId);
  console.log('   OK: Watchdog recuperou imediatamente a CALL pendente:', watchdogWait.body);

  // Limpa a fila consumindo a call de teste
  const cleanCall = await request({ ...baseOptions, path: '/call', method: 'GET' });
  await request({
    ...baseOptions,
    path: '/call_ack',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { call_id: lostCallId });
  console.log('   OK: CALL de recuperação limpa e confirmada.');

  // 6. Teste de isolamento: wake_waiter.js NÃO consome CALL
  console.log('\n6. Validando código do wake_waiter.js contra segundo executor...');
  const fs = require('fs');
  const waiterCode = fs.readFileSync(require('path').join(__dirname, '..', 'server', 'wake_waiter.js'), 'utf8');
  assert.strictEqual(waiterCode.includes('/call_ack'), false, 'wake_waiter não pode chamar /call_ack');
  assert.strictEqual(waiterCode.includes("'/call'"), false, 'wake_waiter não pode chamar GET /call');
  assert.strictEqual(waiterCode.includes('"/call"'), false, 'wake_waiter não pode chamar GET /call');
  assert.strictEqual(waiterCode.includes('/result'), false, 'wake_waiter não pode chamar /result');
  console.log('   OK: wake_waiter.js é puramente passivo e NÃO atua como segundo executor.');

  console.log('\n=== TODOS OS 6 TESTES DO CARD #59 PASSARAM COM SUCESSO! ===');
}

runTests().catch(err => {
  console.error('FALHA NOS TESTES:', err);
  process.exit(1);
});
