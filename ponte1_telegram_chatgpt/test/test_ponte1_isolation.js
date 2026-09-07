const assert = require('assert');
const path = require('path');
const fs = require('fs');
const http = require('http');
const Ponte1Daemon = require('../server/ponte1_daemon');

function httpGet(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:8766${path}`, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(d) }));
    }).on('error', reject);
  });
}

function httpPost(path, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const req = http.request(`http://127.0.0.1:8766${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(d) }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function runTests() {
  console.log('===============================================================');
  console.log('TESTES DE ISOLAMENTO E CONFORMIDADE: PONTE 1 (TELEGRAM <-> CHATGPT)');
  console.log('===============================================================');

  let passed = 0;
  let failed = 0;
  function ok(desc) { console.log(`PASS: ${desc}`); passed++; }
  function fail(desc, e) { console.error(`FAIL: ${desc} ->`, e.message || e); failed++; }

  // 1. Inicia o daemon em modo mock (sem poller real do Telegram)
  const daemon = new Ponte1Daemon();
  daemon.client = {
    messagesSent: [],
    sendMessage: async (chatId, text, replyToId) => {
      daemon.client.messagesSent.push({ chatId, text, replyToId });
      return { ok: true, result: { message_id: 1000 + daemon.client.messagesSent.length } };
    }
  };
  const server = daemon.startHttpServer();
  await new Promise(r => setTimeout(r, 400));

  try {
    // TESTE 1: Status inicial e rota /status
    const st = await httpGet('/status');
    assert.strictEqual(st.body.bridge, 'PONTE_1_TELEGRAM_CHATGPT');
    assert.strictEqual(st.body.queue_length, 0);
    ok('1: Servidor da Ponte 1 ativo na porta 8766');

    // TESTE 2: Enfileiramento e Single-Flight em /packet
    daemon.packetQueue.push({
      packet_id: 'TEST_PKT_001',
      telegram_message_id: 501,
      payload: '[TELEGRAM de Manoel]: oi\n[CHATGPT_REPLY_V1]\nREPLY_TO_MESSAGE_ID: 501\nPAYLOAD: sua resposta\n[/CHATGPT_REPLY_V1]'
    });
    daemon.packetQueue.push({
      packet_id: 'TEST_PKT_002',
      telegram_message_id: 502,
      payload: '[TELEGRAM de Manoel]: teste 2'
    });

    const p1 = await httpGet('/packet');
    assert.strictEqual(p1.body.packet_id, 'TEST_PKT_001');

    // Segunda chamada deve reter o lock (Single-Flight: retorna in_flight e não entrega TEST_PKT_002)
    const p1_locked = await httpGet('/packet');
    assert.strictEqual(p1_locked.body.packet_id, null);
    assert.strictEqual(p1_locked.body.in_flight, 'TEST_PKT_001');
    ok('2: Single-Flight estrito: segundo pacote retido até confirmação do primeiro');

    // TESTE 3: Confirmação via /ack libera o próximo item
    const ackRes = await httpPost('/ack', { packet_id: 'TEST_PKT_001' });
    assert.strictEqual(ackRes.body.status, 'ACK_RECORDED');

    const p2 = await httpGet('/packet');
    assert.strictEqual(p2.body.packet_id, 'TEST_PKT_002');
    await httpPost('/ack', { packet_id: 'TEST_PKT_002' });
    ok('3: /ack libera a fila e avança para o próximo pacote');

    // TESTE 4: Envio de resposta do ChatGPT via /reply para o Telegram
    const replyRes = await httpPost('/reply', {
      reply_to_message_id: 501,
      payload: 'Olá! Mensagem recebida perfeitamente.'
    });
    assert.strictEqual(replyRes.body.delivered_to_telegram, true);
    assert.strictEqual(daemon.client.messagesSent.length, 1);
    assert.strictEqual(daemon.client.messagesSent[0].replyToId, 501);
    assert.strictEqual(daemon.client.messagesSent[0].text, 'Olá! Mensagem recebida perfeitamente.');
    ok('4: /reply encaminha resposta diretamente ao Telegram com correlação de mensagem');

    // TESTE 5: Deduplicação determinística em /reply (DEDUPE_NO_OP)
    const replyDupe = await httpPost('/reply', {
      reply_to_message_id: 501,
      payload: 'Olá! Mensagem recebida perfeitamente.'
    });
    assert.strictEqual(replyDupe.body.dedupe, true);
    assert.strictEqual(daemon.client.messagesSent.length, 1, 'Não deve reenviar ao Telegram');
    ok('5: DEDUPE_NO_OP ativo para respostas duplicadas ao Telegram');

    // TESTE 6: Isolamento Estrito de Arquivos e Código
    const daemonCode = fs.readFileSync(path.join(__dirname, '../server/ponte1_daemon.js'), 'utf8');
    const bgCode = fs.readFileSync(path.join(__dirname, '../extension/background.js'), 'utf8');
    const contentCode = fs.readFileSync(path.join(__dirname, '../extension/content.js'), 'utf8');

    assert.strictEqual(daemonCode.includes('Stage1BridgeTransport'), false, 'Não deve referenciar Stage1BridgeTransport');
    assert.strictEqual(daemonCode.includes('UnifiedHub'), false, 'Não deve referenciar UnifiedHub');
    assert.strictEqual(daemonCode.includes('AntigravityObserver'), false, 'Não deve referenciar AntigravityObserver');
    assert.strictEqual(bgCode.includes('CALL_ID'), false, 'Ponte 1 não processa CALL_ID');
    assert.strictEqual(bgCode.includes('[RESULT]'), false, 'Ponte 1 não processa [RESULT]');
    assert.strictEqual(contentCode.includes('BRIDGE_TO_ANTIGRAVITY'), false, 'Ponte 1 não toca em BRIDGE_TO_ANTIGRAVITY');
    ok('6: Isolamento absoluto verificado (zero legado cruzado, zero CALL/RESULT/Gravity)');

  } catch (err) {
    fail('Execução da suíte', err);
  } finally {
    server.close();
  }

  console.log('---------------------------------------------------------------');
  console.log(`RESULTADO: ${passed} PASS / ${failed} FAIL`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
