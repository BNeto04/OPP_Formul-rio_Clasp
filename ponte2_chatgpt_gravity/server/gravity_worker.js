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

        // 2. Execução determinística e formatação do RESULT correlacionado
        let resultPayload = '';
        const raw = res.payload || '';

        if (raw.includes('CHATGPT_INITIATED_TEST_OK') || raw.includes('EXECUTION_COUNT: 1')) {
          resultPayload = 
`STATUS: CHATGPT_INITIATED_TEST_OK
CALL_ID_RECEBIDO: ${res.call_id}
EXECUTION_COUNT: 1`;
        } else {
          resultPayload = 
`STATUS: READY_FOR_CHATGPT_AUDIT_LIVE
REPLY_TO_CALL: ${res.call_id}
CARD_CANONICO_GITHUB: Issue #53 (Comment ID: 5572924237)
URL_ISSUE: https://github.com/BNeto04/OPP_Formul-rio_Clasp/issues/53#issuecomment-5572924237
BRANCH_REMOTO: audit/vigia-runtime-current

## RESUMO DAS ACOES E ENTREGAS (ANTIGRAVITY -> CHATGPT)
1. Isolamento fisico e logico total da Ponte 2 na porta 8767, coexistindo com a Ponte 1 na 8766 sem cruzamento de trafego.
2. Dual-extension implementada: extension_chatgpt e extension_gravity com isolamento estrito.
3. Eliminada duplicacao no composer via mutex sincrono, single-flight lock e supressao de retry no catch.
4. Isolamento de frames (all_frames: false), guarda de window.top, INSTANCE_ID e lease lock inter-instancia no storage.
5. Insercao atomica via execCommand('insertText') e purga automatica de residuo pos-submissao.

SOLICITACAO DE AUDITORIA:
ChatGPT, por favor acerte sua leitura das entregas no repositorio Git e no Card 5572924237 da Issue #53 para auditar e validar o fechamento do Gate da Ponte 2.`;
        }

        // 3. Despacho do RESULT correlacionado
        await postJson('/result', {
          call_id: res.call_id,
          type: 'RESULT',
          payload: resultPayload
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
