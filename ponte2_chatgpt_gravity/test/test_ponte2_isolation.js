/**
 * Testes Automatizados de Isolamento e Conformidade da Ponte 2 (ChatGPT <-> Gravity)
 *
 * TASK_ID: BRIDGE-V2-PONTE2-CHATGPT-GRAVITY-001
 * CALL_ID: CALL-53-PONTE2-HARD-SEPARATION-001
 */

const assert = require('assert');
const http = require('http');
const fs = require('fs');
const path = require('path');
const Ponte2Daemon = require('../server/ponte2_daemon');

function httpRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('===============================================================');
  console.log('TESTES DE ISOLAMENTO E CONFORMIDADE: PONTE 2 (CHATGPT <-> GRAVITY)');
  console.log('===============================================================');

  const daemon = new Ponte2Daemon();
  daemon.start();
  await new Promise(r => setTimeout(r, 600));

  let passed = 0;
  let failed = 0;

  function report(num, title, ok, detail = '') {
    if (ok) {
      console.log(`PASS: ${num}: ${title}`);
      passed++;
    } else {
      console.error(`FAIL: ${num}: ${title} -> ${detail}`);
      failed++;
    }
  }

  try {
    // 1. GET /status na porta 8767
    const st = await httpRequest({ host: '127.0.0.1', port: 8767, path: '/status', method: 'GET' });
    report(1, 'Servidor da Ponte 2 ativo na porta 8767', st.status === 200 && st.data.bridge === 'PONTE_2_CHATGPT_GRAVITY' && st.data.port === 8767);

    // 2. Validação estrita de tipos em /call
    const badType1 = await httpRequest({
      host: '127.0.0.1', port: 8767, path: '/call', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { call_id: 'BAD_01', type: 'OWNER_MESSAGE', payload: 'oi' });

    const badType2 = await httpRequest({
      host: '127.0.0.1', port: 8767, path: '/call', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { call_id: 'BAD_02', type: 'CHATGPT_REPLY', payload: 'oi' });

    report(2, 'Validação estrita de tipos: rejeita OWNER_MESSAGE e CHATGPT_REPLY com 400', badType1.status === 400 && badType2.status === 400);

    // 3. Enfileiramento e Single-Flight de CALLs (ChatGPT -> Gravity)
    const call1 = await httpRequest({
      host: '127.0.0.1', port: 8767, path: '/call', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { call_id: 'CALL-53-TEST-001', task_id: 'TASK-TEST-001', type: 'CALL', payload: 'Executar verificação' });

    const call2 = await httpRequest({
      host: '127.0.0.1', port: 8767, path: '/call', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { call_id: 'CALL-53-TEST-002', task_id: 'TASK-TEST-002', type: 'CALL', payload: 'Executar teste' });

    // Consome 1a CALL
    const getCall1 = await httpRequest({ host: '127.0.0.1', port: 8767, path: '/call', method: 'GET' });
    // Tenta consumir 2a CALL antes de dar ACK na 1a (deve ser retida pelo Single-Flight)
    const getCall2 = await httpRequest({ host: '127.0.0.1', port: 8767, path: '/call', method: 'GET' });

    report(3, 'Single-Flight estrito para CALLs: 2a CALL retida até ACK da primeira',
      getCall1.data.call_id === 'CALL-53-TEST-001' && getCall2.data.call_id === null && getCall2.data.in_flight === 'CALL-53-TEST-001'
    );

    // 4. Confirmação de recebimento pelo Gravity (/call_ack)
    const ackCall1 = await httpRequest({
      host: '127.0.0.1', port: 8767, path: '/call_ack', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { call_id: 'CALL-53-TEST-001' });

    // Agora a 2a CALL deve ser liberada
    const getCall2AfterAck = await httpRequest({ host: '127.0.0.1', port: 8767, path: '/call', method: 'GET' });
    await httpRequest({
      host: '127.0.0.1', port: 8767, path: '/call_ack', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { call_id: 'CALL-53-TEST-002' });

    report(4, '/call_ack libera o lock e entrega próxima CALL pendente',
      ackCall1.status === 200 && getCall2AfterAck.data.call_id === 'CALL-53-TEST-002'
    );

    // 5. Enfileiramento e Single-Flight de RESULTs (Gravity -> ChatGPT)
    const postRes1 = await httpRequest({
      host: '127.0.0.1', port: 8767, path: '/result', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { call_id: 'CALL-53-TEST-001', type: 'RESULT', payload: 'Auditoria concluída com 100%' });

    const postRes2 = await httpRequest({
      host: '127.0.0.1', port: 8767, path: '/result', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { call_id: 'CALL-53-TEST-002', type: 'RESULT', payload: 'Segunda execução OK' });

    const getRes1 = await httpRequest({ host: '127.0.0.1', port: 8767, path: '/result', method: 'GET' });
    const getRes2 = await httpRequest({ host: '127.0.0.1', port: 8767, path: '/result', method: 'GET' });

    // ACK do primeiro resultado
    const ackRes1 = await httpRequest({
      host: '127.0.0.1', port: 8767, path: '/result_ack', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { call_id: 'CALL-53-TEST-001' });

    const getRes2AfterAck = await httpRequest({ host: '127.0.0.1', port: 8767, path: '/result', method: 'GET' });

    report(5, 'Single-Flight estrito para RESULTs com envelope [BRIDGE_FROM_ANTIGRAVITY_V1]',
      getRes1.data.call_id === 'CALL-53-TEST-001' &&
      getRes1.data.payload.includes('[BRIDGE_FROM_ANTIGRAVITY_V1]') &&
      getRes2.data.call_id === null &&
      getRes2AfterAck.data.call_id === 'CALL-53-TEST-002'
    );

    // 6. Deduplicação determinística em CALLs e RESULTs
    const dupCall = await httpRequest({
      host: '127.0.0.1', port: 8767, path: '/call', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { call_id: 'CALL-53-TEST-001', type: 'CALL', payload: 'Repetida' });

    const dupResult = await httpRequest({
      host: '127.0.0.1', port: 8767, path: '/result', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { call_id: 'CALL-53-TEST-001', type: 'RESULT', payload: 'Repetida' });

    report(6, 'Deduplicação determinística: descarta CALL e RESULT repetidos',
      dupCall.data.dedupe === true && dupResult.data.dedupe === true
    );

    // 7. Isolamento estrutural de arquivos
    const daemonContent = fs.readFileSync(path.join(__dirname, '..', 'server', 'ponte2_daemon.js'), 'utf8');
    const bgContent = fs.readFileSync(path.join(__dirname, '..', 'extension', 'background.js'), 'utf8');
    const contentContent = fs.readFileSync(path.join(__dirname, '..', 'extension', 'content.js'), 'utf8');
    const manifestContent = fs.readFileSync(path.join(__dirname, '..', 'extension', 'manifest.json'), 'utf8');

    const hasPonte1Ref = daemonContent.includes('ponte1') || bgContent.includes('ponte1') || contentContent.includes('ponte1');
    const hasTelegramRef = daemonContent.includes('Telegram') || daemonContent.includes('telegram') || bgContent.includes('telegram');
    const hasVigiaRef = daemonContent.includes('Vigia') || bgContent.includes('Vigia');
    const hasPort8766 = daemonContent.includes('8766') || bgContent.includes('8766') || manifestContent.includes('8766');

    report(7, 'Isolamento estrito: zero ponte1, zero Telegram, zero Vigia, zero porta 8766',
      !hasPonte1Ref && !hasTelegramRef && !hasVigiaRef && !hasPort8766
    );

  } catch (err) {
    console.error('Erro na execução dos testes:', err);
    failed++;
  } finally {
    daemon.stop();
  }

  console.log('---------------------------------------------------------------');
  console.log(`RESULTADO: ${passed} PASS / ${failed} FAIL`);
  process.exit(failed === 0 ? 0 : 1);
}

runTests();
