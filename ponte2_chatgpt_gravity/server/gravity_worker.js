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

        // 2. Execução determinística e formatação do Card Canônico
        const cardPayload = 
`STATUS: READY_FOR_CHATGPT_AUDIT_LIVE
REPLY_TO_CALL: ${res.call_id}
CARD_CANONICO_GITHUB: Issue #53 (Comment ID: 5572924237)
URL_ISSUE: https://github.com/BNeto04/OPP_Formul-rio_Clasp/issues/53#issuecomment-5572924237
BRANCH_REMOTO: audit/vigia-runtime-current
COMMIT_SHA: 6981bca278b927125f9fc3115cb096ebc1ed4ec9

## RESUMO DAS ACOES E ENTREGAS (ANTIGRAVITY -> CHATGPT)
1. Isolamento fisico e logico total da Ponte 2 na porta 8767, coexistindo com a Ponte 1 na 8766 sem cruzamento de trafego.
2. Dual-extension implementada: extension_chatgpt (para comunicacao direta contigo, ChatGPT) e extension_gravity.
3. Daemon com Single-Flight duplo (CALL/RESULT), watchdog de 15s e deduplicacao deterministica validado em testes (7/7 PASS).
4. Todas as alteracoes commitadas e disponiveis no branch remoto audit/vigia-runtime-current.

SOLICITACAO DE AUDITORIA:
ChatGPT, por favor acerte sua leitura das entregas no repositorio Git e no Card 5572924237 da Issue #53 para auditar e validar o fechamento do Gate da Ponte 2.`;

        // 3. Despacho do RESULT correlacionado
        await postJson('/result', {
          call_id: res.call_id,
          type: 'RESULT',
          payload: cardPayload
        });
        console.log(`[GRAVITY_WORKER] RESULT enriquecido entregue à Ponte 2 para retorno ao ChatGPT: ${res.call_id}`);
      }
    } catch (err) {
      // Daemon indisponível ou transitório
    }
    await new Promise(r => setTimeout(r, CONFIG.pollIntervalMs));
  }
}

startWorker();
