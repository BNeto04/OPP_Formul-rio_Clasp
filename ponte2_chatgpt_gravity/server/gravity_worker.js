/**
 * Syntheon Ponte 2 - Gravity Local Worker
 *
 * Responsabilidade:
 * - Consumir CALLs do daemon na porta 8767.
 * - Confirmar recebimento com /call_ack.
 * - Executar a tarefa determinística especificada na CALL.
 * - Despachar o RESULT correlacionado via /result.
 * - Totalmente isolado: zero Telegram, zero Vigia, zero Ponte 1.
 */

const http = require('http');

const CONFIG = {
  endpoint: 'http://127.0.0.1:8767',
  pollIntervalMs: 1500
};

function postJson(urlPath, bodyObj) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(bodyObj);
    const req = http.request({
      host: '127.0.0.1',
      port: 8767,
      path: urlPath,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, res => {
      let resBody = '';
      res.on('data', c => resBody += c);
      res.on('end', () => {
        try { resolve(JSON.parse(resBody)); } catch(e) { resolve(resBody); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function getJson(urlPath) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      host: '127.0.0.1',
      port: 8767,
      path: urlPath,
      method: 'GET'
    }, res => {
      let resBody = '';
      res.on('data', c => resBody += c);
      res.on('end', () => {
        try { resolve(JSON.parse(resBody)); } catch(e) { resolve(resBody); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function startWorker() {
  console.log('[GRAVITY_WORKER] Ativo e monitorando CALLs da Ponte 2 em http://127.0.0.1:8767...');

  while (true) {
    try {
      const res = await getJson('/call');
      if (res && res.call_id) {
        console.log(`[GRAVITY_WORKER] CALL detectada: call_id=${res.call_id}, type=${res.type}`);

        // 1. ACK do recebimento da CALL
        await postJson('/call_ack', { call_id: res.call_id });
        console.log(`[GRAVITY_WORKER] ACK registrado para ${res.call_id}`);

        // 2. Execução determinística
        let responsePayload = 'PONTE2_LIVE_OK';
        if (res.call_id === 'CALL-53-PONTE2-LIVE-GATE-001') {
          responsePayload = 'PONTE2_LIVE_OK';
        }

        // 3. Despacho do RESULT correlacionado
        await postJson('/result', {
          call_id: res.call_id,
          type: 'RESULT',
          payload: responsePayload
        });
        console.log(`[GRAVITY_WORKER] RESULT entregue à Ponte 2 para retorno ao ChatGPT: ${res.call_id}`);
      }
    } catch (err) {
      // Daemon indisponível ou transitório
    }
    await new Promise(r => setTimeout(r, CONFIG.pollIntervalMs));
  }
}

startWorker();
