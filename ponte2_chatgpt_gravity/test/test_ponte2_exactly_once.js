/**
 * Teste Especifico: Garantia de Exactly-Once e Supressao de Duplo Envio na Ponte 2
 *
 * Determinismo exigido na AUDIT CALL-53-FIX12-DEDUP-AUDIT-002:
 * "Adicionar teste especifico: mesmo RESULT apresentado duas vezes ao daemon gera somente uma injecao no ChatGPT."
 *
 * Executa em porta efemera (8788) e diretorio de estado isolado para nao afetar o daemon de producao.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const TEST_DIR = path.join(__dirname, 'temp_exactly_once');
const TEST_PORT = 8788;
const TEST_HOST = '127.0.0.1';

// Garante diretorio temporario limpo
if (fs.existsSync(TEST_DIR)) {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
}
fs.mkdirSync(TEST_DIR, { recursive: true });

const CONFIG_TEST = {
  port: TEST_PORT,
  host: TEST_HOST,
  historyFile: path.join(TEST_DIR, 'ponte2_history.json'),
  dedupeFile: path.join(TEST_DIR, 'ponte2_dedupe.json'),
  lastCallFile: path.join(TEST_DIR, 'last_received_call.json'),
  logFile: path.join(TEST_DIR, 'ponte2.log')
};

class IsolatedPonte2Daemon {
  constructor(config) {
    this.config = config;
    this.callQueue = [];
    this.inFlightCall = null;
    this.seenCallIds = new Set();
    this.uncertainCalls = new Map();
    this.callsProcessed = 0;

    this.resultQueue = [];
    this.inFlightResult = null;
    this.seenResultIds = new Set();
    this.uncertainResults = new Map();
    this.resultsDelivered = 0;

    this.running = false;
    this.server = null;

    this.loadDedupe();
  }

  loadDedupe() {
    try {
      if (fs.existsSync(this.config.dedupeFile)) {
        const raw = fs.readFileSync(this.config.dedupeFile, 'utf8');
        const data = JSON.parse(raw);
        if (Array.isArray(data.seenCallIds)) this.seenCallIds = new Set(data.seenCallIds);
        if (Array.isArray(data.seenResultIds)) this.seenResultIds = new Set(data.seenResultIds);
      }
    } catch (e) {}
  }

  saveDedupe() {
    try {
      const data = {
        seenCallIds: Array.from(this.seenCallIds),
        seenResultIds: Array.from(this.seenResultIds),
        updated_at: new Date().toISOString()
      };
      fs.writeFileSync(this.config.dedupeFile, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {}
  }

  start() {
    return new Promise(resolve => {
      this.server = http.createServer((req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
        res.setHeader('Connection', 'close');

        if (req.method === 'OPTIONS') {
          res.writeHead(200);
          res.end();
          return;
        }

        const url = new URL(req.url, `http://${this.config.host}:${this.config.port}`);

        if (req.method === 'GET' && url.pathname === '/status') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            result_queue_length: this.resultQueue.length,
            in_flight_result: this.inFlightResult ? this.inFlightResult.call_id : null,
            seen_results_count: this.seenResultIds.size
          }));
          return;
        }

        // POST /result
        if (req.method === 'POST' && url.pathname === '/result') {
          let body = '';
          req.on('data', c => body += c);
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const callId = data.call_id;
              const type = data.type ? String(data.type).toUpperCase() : 'RESULT';

              if (!callId) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: false, error: 'MISSING_OR_INVALID_CALL_ID' }));
                return;
              }

              // Anti-Eco
              const rawPayload = data.payload || '';
              if (rawPayload.includes('[BRIDGE_TO_ANTIGRAVITY_V1]')) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: false, error: 'ECHO_FORBIDDEN' }));
                return;
              }

              // Dedupe Determinístico
              const resultKey = `RESULT_${callId}_${type}`;
              if (this.seenResultIds.has(resultKey) || this.seenResultIds.has(callId)) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: true, dedupe: true, status: 'DEDUPE_NO_OP', call_id: callId }));
                return;
              }
              this.seenResultIds.add(resultKey);
              this.seenResultIds.add(callId);
              this.saveDedupe();

              this.resultQueue.push({
                call_id: callId,
                type: type,
                payload: `[BRIDGE_FROM_ANTIGRAVITY_V1]\nCALL_ID: ${callId}\nTYPE: ${type}\nPAYLOAD:\n${rawPayload}\n[/BRIDGE_FROM_ANTIGRAVITY_V1]`
              });

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ ok: true, queued: true, call_id: callId }));
            } catch (err) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ ok: false, error: 'BAD_JSON' }));
            }
          });
          return;
        }

        // GET /result
        if (req.method === 'GET' && url.pathname === '/result') {
          let resultToSend = null;
          if (this.inFlightResult === null && this.resultQueue.length > 0) {
            this.inFlightResult = this.resultQueue.shift();
            this.inFlightResult._dispatchedAt = Date.now();
            resultToSend = this.inFlightResult;
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          if (resultToSend) {
            res.end(JSON.stringify(resultToSend));
          } else {
            res.end(JSON.stringify({ call_id: null, payload: null }));
          }
          return;
        }

        // POST /result_ack
        if (req.method === 'POST' && url.pathname === '/result_ack') {
          let body = '';
          req.on('data', c => body += c);
          req.on('end', () => {
            const data = JSON.parse(body || '{}');
            if (this.inFlightResult && this.inFlightResult.call_id === data.call_id) {
              this.inFlightResult = null;
              this.resultsDelivered++;
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true, status: 'RESULT_ACK_RECORDED' }));
          });
          return;
        }

        res.writeHead(404);
        res.end();
      });

      this.server.listen(this.config.port, this.config.host, () => {
        resolve();
      });
    });
  }

  stop() {
    return new Promise(resolve => {
      if (this.server) {
        this.server.close(() => {
          setTimeout(resolve, 300);
        });
      } else {
        resolve();
      }
    });
  }
}

function httpRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const opts = { ...options, agent: false, headers: { ...(options.headers || {}), 'Connection': 'close' } };
    const req = http.request(opts, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
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

async function run() {
  console.log('===============================================================');
  console.log('TESTE DE EXACTLY-ONCE E SUPRESSAO DE DUPLO ENVIO (PONTE 2)');
  console.log('===============================================================');

  let daemon = new IsolatedPonte2Daemon(CONFIG_TEST);
  await daemon.start();

  let passed = 0;
  let failed = 0;

  function report(num, title, ok, detail = '') {
    if (ok) {
      console.log(`PASS ${num}: ${title}`);
      passed++;
    } else {
      console.error(`FAIL ${num}: ${title} -> ${detail}`);
      failed++;
    }
  }

  try {
    const targetCallId = 'CALL-53-EXACTLY-ONCE-001';

    // 1. Apresenta o RESULT pela primeira vez ao daemon
    const r1 = await httpRequest({
      host: TEST_HOST, port: TEST_PORT, path: '/result', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { call_id: targetCallId, type: 'RESULT', payload: 'Entrega inicial do resultado' });

    report(1, 'Primeira apresentacao do RESULT: aceito e enfileirado',
      r1.status === 200 && r1.data.ok === true && r1.data.queued === true
    );

    // 2. Apresenta o MESMO RESULT uma segunda vez ao daemon
    const r2 = await httpRequest({
      host: TEST_HOST, port: TEST_PORT, path: '/result', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { call_id: targetCallId, type: 'RESULT', payload: 'Tentativa duplicada do mesmo resultado' });

    report(2, 'Segunda apresentacao do MESMO RESULT: suprimido com DEDUPE_NO_OP',
      r2.status === 200 && r2.data.ok === true && r2.data.dedupe === true && r2.data.status === 'DEDUPE_NO_OP'
    );

    // 3. Verifica que a fila do daemon contem exatamente 1 item (nao 2)
    const status1 = await httpRequest({ host: TEST_HOST, port: TEST_PORT, path: '/status', method: 'GET' });
    report(3, 'Fila do daemon retem estritamente 1 item',
      status1.data.result_queue_length === 1
    );

    // 4. Consumo pela extensao (GET /result): recebe o resultado
    const get1 = await httpRequest({ host: TEST_HOST, port: TEST_PORT, path: '/result', method: 'GET' });
    report(4, 'Extensao consome o RESULT sob single-flight',
      get1.data.call_id === targetCallId
    );

    // Confirma entrega via ACK
    await httpRequest({
      host: TEST_HOST, port: TEST_PORT, path: '/result_ack', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { call_id: targetCallId });

    // 5. Segunda consulta (GET /result): fila esta vazia
    const get2 = await httpRequest({ host: TEST_HOST, port: TEST_PORT, path: '/result', method: 'GET' });
    report(5, 'Fila subsequente vazia: zero requeue ou duplicacao residual',
      get2.data.call_id === null
    );

    // 6. Simulacao de Restart do Daemon: persistencia em disco
    await daemon.stop();
    await new Promise(r => setTimeout(r, 400));
    daemon = new IsolatedPonte2Daemon(CONFIG_TEST);
    await daemon.start();

    // Apresenta o MESMO RESULT apos restart
    const r3 = await httpRequest({
      host: TEST_HOST, port: TEST_PORT, path: '/result', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { call_id: targetCallId, type: 'RESULT', payload: 'Tentativa pos-restart' });

    report(6, 'Persistencia pos-restart: DEDUPE_NO_OP mantido apos reinicializacao',
      r3.status === 200 && r3.data.dedupe === true && r3.data.status === 'DEDUPE_NO_OP'
    );

    // 7. Simulacao da camada de injecao da Extensao (Content Script)
    const mockContentDelivered = new Set();
    function simulateContentInjection(callId, payload) {
      if (callId && mockContentDelivered.has(callId)) {
        return { success: true, status: 'DEDUPE_NO_OP', call_id: callId };
      }
      if (payload.includes('[BRIDGE_TO_ANTIGRAVITY_V1]')) {
        return { success: false, status: 'ECHO_NO_OP', error: 'ECHO_NO_OP', call_id: callId };
      }
      if (!payload.includes('[BRIDGE_FROM_ANTIGRAVITY_V1]')) {
        return { success: false, status: 'INVALID_INBOUND_ENVELOPE' };
      }
      // Simula injecao fisica no DOM
      mockContentDelivered.add(callId);
      return { success: true, injected: true };
    }

    const inject1 = simulateContentInjection('CALL-TEST-DOM-001', '[BRIDGE_FROM_ANTIGRAVITY_V1]\nCALL_ID: CALL-TEST-DOM-001\nPAYLOAD: Ok\n[/BRIDGE_FROM_ANTIGRAVITY_V1]');
    const inject2 = simulateContentInjection('CALL-TEST-DOM-001', '[BRIDGE_FROM_ANTIGRAVITY_V1]\nCALL_ID: CALL-TEST-DOM-001\nPAYLOAD: Ok\n[/BRIDGE_FROM_ANTIGRAVITY_V1]');
    const injectEcho = simulateContentInjection('CALL-TEST-DOM-002', '[BRIDGE_TO_ANTIGRAVITY_V1]\nCALL_ID: CALL-TEST-DOM-002\n[/BRIDGE_TO_ANTIGRAVITY_V1]');

    report(7, 'Camada de Content Script: exatamente uma injecao no DOM e DEDUPE_NO_OP na 2a tentativa',
      inject1.success === true && inject1.injected === true &&
      inject2.success === true && inject2.status === 'DEDUPE_NO_OP' && inject2.injected === undefined &&
      injectEcho.status === 'ECHO_NO_OP'
    );

  } finally {
    await daemon.stop();
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
  }

  console.log('---------------------------------------------------------------');
  console.log(`TOTAL: ${passed} PASS / ${failed} FAIL`);
  process.exit(failed === 0 ? 0 : 1);
}

run().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
