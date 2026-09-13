const http = require('http');

const payload = [
  'WAITER_PROCESS_ACTIVE: SIM. O wake_waiter.js estava ativo no momento em que a chamada chegou.',
  'WAITER_PID_OR_TASK: Rodando como background task task-3495 na IDE Antigravity (GET /wait_call?timeout=900000).',
  'BASELINE_CALL_RECEIVED: SIM. CALL-T-C01-BASELINE-001-EXEC-001 chegou a porta 8767 as 16:29:14.514Z.',
  'BASELINE_CALL_STATE: EXECUTADA_E_ENTREGUE. Foi consumida, executada (commit 6281e99) e o RESULT postado as 16:34:20Z. A extensao retirou o RESULT da fila as 16:34:21Z, mas a aba do ChatGPT estava inativa/desfocada e o ACK expirou em 15s transitando para SEND_UNCERTAIN. Foi reenfileirada via /reconcile as 16:43:29Z e confirmada com [RESULT_ACK_CONFIRMED] as 16:43:39Z.',
  'WAKE_EVENT_EMITTED: SIM. Log do daemon registra: [WAKE_NOTIFY] Notificando 1 wake waiter(s) sobre nova CALL: CALL-P2-REACTIVE-WAKE-LIVE-CHECK-001 as 16:41:55.022Z.',
  'IDE_WAKE_RECEIVED: SIM. A IDE recebeu o <SYSTEM_MESSAGE> Task id task-3495 finished com [WAKE_WAITER] Sinal recebido: CALL_READY as 16:41:55Z (latencia < 1s).',
  'LIVE_FAILURE_CAUSE: ZERO falha de wake na IDE. O wake reativo funcionou 100% em ambas as chamadas. A aparencia de parada decorreu da retencao do RESULT anterior na extensao do Chrome devido a aba do ChatGPT inativa no momento da primeira entrega.',
  'FIX_APPLIED: Reconciliacao manual executada via POST /reconcile (action: REQUEUE_EXPLICIT). O RESULT do #55 foi imediatamente injetado e confirmado no ChatGPT as 16:43:39Z. Rearmamento continuo do wake_waiter mantido.',
  'LIVE_WAKE_PROOF: CALL-P2-REACTIVE-WAKE-LIVE-CHECK-001 recebida as 16:41:55Z -> task-3495 encerrou imediatamente e acordou a IDE -> Antigravity consumiu a chamada sob single-flight com ACK as 16:42:15Z sem qualquer cron de polling.',
  'PERSISTENCE_AFTER_RESTART: Na sessao ativa, o agente rearma wake_waiter.js ao final de cada turno. Entre sessoes ou reboots do PC, um loop leve em PowerShell/Batch (node wake_waiter.js) mantem a escuta sem custo de modelo.',
  'POLLING_3MIN_REENABLED: NAO. O polling de 3 minutos permanece 100% desativado. O wake reativo e o mecanismo principal comprovado ao vivo.',
  'NEXT_ACTION: O RESULT do #55 ja esta entregue e confirmado no ChatGPT. Prosseguir para o Card #56: T-C01-DADOS-FATO-002.'
].join('\n');

const body = JSON.stringify({
  call_id: 'CALL-P2-REACTIVE-WAKE-LIVE-CHECK-001',
  task_id: 'ADM-BRIDGE2-REACTIVE-WAKE-LIVE-CHECK-001',
  type: 'RESULT',
  payload: payload
});

const req = http.request({
  hostname: '127.0.0.1',
  port: 8767,
  path: '/result',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  }
}, res => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    console.log('POST /result response status:', res.statusCode);
    console.log('POST /result response body:', data);
  });
});

req.on('error', err => {
  console.error('POST /result error:', err.message);
});

req.write(body);
req.end();
