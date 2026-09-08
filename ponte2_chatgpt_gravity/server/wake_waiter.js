/**
 * Syntheon Ponte 2 - Wake Waiter Mínimo Reativo (Card #59 ADM-BRIDGE2-REACTIVE-WAKE-001)
 *
 * RESTRIÇÕES ESTRITAS (NÃO VIOLAR):
 * 1. Papel exclusivo: campainha passiva de despertar para o Antigravity.
 * 2. NÃO consome CALL (não faz GET /call).
 * 3. NÃO executa tarefa ou lógica funcional.
 * 4. NÃO gera RESULT nem ACK.
 * 5. NÃO se comunica com ChatGPT nem com Telegram.
 * 6. Ao receber evento CALL_READY ou TIMEOUT_IDLE, encerra imediatamente com código 0.
 */

const http = require('http');

const timeoutMs = process.argv[2] ? parseInt(process.argv[2], 10) : 900000; // default 15 min

const req = http.get(`http://127.0.0.1:8767/wait_call?timeout=${timeoutMs}`, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    try {
      const data = JSON.parse(body);
      console.log(`[WAKE_WAITER] Sinal recebido: ${data.event || 'UNKNOWN'} (call_id: ${data.call_id || 'NONE'})`);
    } catch (e) {
      console.log(`[WAKE_WAITER] Resposta bruta: ${body}`);
    }
    process.exit(0);
  });
});

req.on('error', err => {
  console.error(`[WAKE_WAITER_CONN_ERROR] ${err.message}`);
  process.exit(1);
});
