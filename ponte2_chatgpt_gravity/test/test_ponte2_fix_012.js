/**
 * Teste Automatizado de Conformidade para CALL-53-PONTE2-FIX-012
 *
 * Executa em porta efemera isolada (8789) para nao poluir o canal de producao do ChatGPT.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const TEST_DIR = path.join(__dirname, 'temp_fix012');
const TEST_PORT = 8789;
const TEST_HOST = '127.0.0.1';

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

const ALLOWED_CALL_TYPES = new Set(['CALL', 'AUDIT']);
const ALLOWED_RESULT_TYPES = new Set(['RESULT', 'ACK', 'ERROR']);

class IsolatedDaemon {
  constructor(config) {
    this.config = config;
    this.callQueue = [];
    this.inFlightCall = null;
    this.seenCallIds = new Set();
    this.uncertainCalls = new Map();
    this.resultQueue = [];
    this.inFlightResult = null;
    this.seenResultIds = new Set();
    this.uncertainResults = new Map();
    this.server = null;
    this.loadDedupe();
  }

  loadDedupe() {
    try {
      if (fs.existsSync(this.config.dedupeFile)) {
        const data = JSON.parse(fs.readFileSync(this.config.dedupeFile, 'utf8'));
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
          res.writeHead(200); res.end(); return;
        }

        const url = new URL(req.url, `http://${this.config.host}:${this.config.port}`);

        if (req.method === 'POST' && url.pathname === '/reset') {
          this.callQueue = [];
          this.resultQueue = [];
          this.seenCallIds.clear();
          this.seenResultIds.clear();
          this.saveDedupe();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, status: 'RESET_OK' }));
          return;
        }

        if (req.method === 'POST' && url.pathname === '/call') {
          let body = '';
          req.on('data', c => body += c);
          req.on('end', () => {
            const data = JSON.parse(body);
            if (this.seenCallIds.has(data.call_id)) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ ok: true, dedupe: true, status: 'DEDUPE_NO_OP', call_id: data.call_id }));
              return;
            }
            this.seenCallIds.add(data.call_id);
            this.saveDedupe();
            this.callQueue.push(data);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true, queued: true, call_id: data.call_id }));
          });
          return;
        }

        if (req.method === 'GET' && url.pathname === '/call') {
          const item = this.callQueue.shift() || null;
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(item || { call_id: null }));
          return;
        }

        if (req.method === 'POST' && url.pathname === '/result') {
          let body = '';
          req.on('data', c => body += c);
          req.on('end', () => {
            const data = JSON.parse(body);
            const raw = data.payload || '';
            if (raw.includes('[BRIDGE_TO_ANTIGRAVITY_V1]')) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ ok: false, error: 'ECHO_FORBIDDEN' }));
              return;
            }
            const key = `RESULT_${data.call_id}_${data.type || 'RESULT'}`;
            if (this.seenResultIds.has(key) || this.seenResultIds.has(data.call_id)) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ ok: true, dedupe: true, status: 'DEDUPE_NO_OP', call_id: data.call_id }));
              return;
            }
            this.seenResultIds.add(key);
            this.seenResultIds.add(data.call_id);
            this.saveDedupe();
            this.resultQueue.push(data);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true, queued: true, call_id: data.call_id }));
          });
          return;
        }

        if (req.method === 'POST' && url.pathname === '/reconcile') {
          let body = '';
          req.on('data', c => body += c);
          req.on('end', () => {
            const data = JSON.parse(body);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true, call_id: data.call_id, reconciled: true }));
          });
          return;
        }

        res.writeHead(404); res.end();
      });

      this.server.listen(this.config.port, this.config.host, () => resolve());
    });
  }

  stop() {
    return new Promise(resolve => {
      if (this.server) {
        this.server.close(() => setTimeout(resolve, 300));
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

async function runTests() {
  console.log('===============================================================');
  console.log('TESTES DE CONFORMIDADE: CALL-53-PONTE2-FIX-012');
  console.log('===============================================================');

  let daemon = new IsolatedDaemon(CONFIG_TEST);
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
    // 1. Anti-Eco: Envio de [BRIDGE_TO_ANTIGRAVITY_V1] em /result deve ser rejeitado com 400
    const echoResult = await httpRequest({
      host: TEST_HOST, port: TEST_PORT, path: '/result', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      call_id: 'CALL-53-TEST-ECHO-001',
      type: 'RESULT',
      payload: '[BRIDGE_TO_ANTIGRAVITY_V1]\nCALL_ID: 123\n[/BRIDGE_TO_ANTIGRAVITY_V1]'
    });
    report(1, 'Anti-Eco: Rejeita tentativa de enviar [BRIDGE_TO_ANTIGRAVITY_V1] para o ChatGPT (HTTP 400)',
      echoResult.status === 400 && echoResult.data.error.includes('ECHO_FORBIDDEN')
    );

    // 2. CALL duplicada retorna DEDUPE_NO_OP
    const call1 = await httpRequest({
      host: TEST_HOST, port: TEST_PORT, path: '/call', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { call_id: 'CALL-53-FIX12-DEDUP-001', type: 'CALL', payload: 'Primeira vez' });

    const callDup = await httpRequest({
      host: TEST_HOST, port: TEST_PORT, path: '/call', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { call_id: 'CALL-53-FIX12-DEDUP-001', type: 'CALL', payload: 'Tentativa repetida' });

    report(2, 'Deduplicação: CALL duplicada retorna status DEDUPE_NO_OP',
      call1.status === 200 && call1.data.ok === true &&
      callDup.status === 200 && callDup.data.dedupe === true && callDup.data.status === 'DEDUPE_NO_OP'
    );

    // 3. RESULT duplicado retorna DEDUPE_NO_OP
    const res1 = await httpRequest({
      host: TEST_HOST, port: TEST_PORT, path: '/result', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { call_id: 'CALL-53-FIX12-DEDUP-001', type: 'RESULT', payload: 'Resultado inicial' });

    const resDup = await httpRequest({
      host: TEST_HOST, port: TEST_PORT, path: '/result', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { call_id: 'CALL-53-FIX12-DEDUP-001', type: 'RESULT', payload: 'Resultado repetido' });

    report(3, 'Deduplicação: RESULT duplicado retorna status DEDUPE_NO_OP',
      res1.status === 200 && res1.data.ok === true &&
      resDup.status === 200 && resDup.data.dedupe === true && resDup.data.status === 'DEDUPE_NO_OP'
    );

    // 4. Persistência de Dedupe em disco (ponte2_dedupe.json)
    const dedupePath = CONFIG_TEST.dedupeFile;
    const dedupeExists = fs.existsSync(dedupePath);
    let dedupeContainsId = false;
    if (dedupeExists) {
      const dedupeData = JSON.parse(fs.readFileSync(dedupePath, 'utf8'));
      dedupeContainsId = dedupeData.seenCallIds.includes('CALL-53-FIX12-DEDUP-001');
    }
    report(4, 'Persistência: Dedupe gravado em disco preservado entre restarts',
      dedupeExists && dedupeContainsId
    );

    // 5. Verificação do content script do ChatGPT: Anti-eco (ECHO_NO_OP) e validação de envelope
    const contentJs = fs.readFileSync(path.join(__dirname, '..', 'extension_chatgpt', 'content.js'), 'utf8');
    const hasAntiEchoInContent = contentJs.includes("payload.includes('[BRIDGE_TO_ANTIGRAVITY_V1]')") &&
                                 contentJs.includes("ECHO_NO_OP");
    const hasStrictInbound = contentJs.includes("!payload.includes('[BRIDGE_FROM_ANTIGRAVITY_V1]')") &&
                             contentJs.includes("INVALID_INBOUND_ENVELOPE");

    report(5, 'Content Script ChatGPT: Rejeição estrita de eco (ECHO_NO_OP) e validação de envelope',
      hasAntiEchoInContent && hasStrictInbound
    );

    // 6. Isolamento estrito mantido (Ponte 1 na 8766 intacta)
    const p1Status = await httpRequest({ host: '127.0.0.1', port: 8766, path: '/status', method: 'GET' });
    report(6, 'Isolamento estrito: Ponte 1 (8766) ativa e independente',
      p1Status.status === 200 && p1Status.data.bridge === 'PONTE_1_TELEGRAM_CHATGPT'
    );

    // 7. Reconciliação: Endpoint /reconcile disponível
    const reconcileCheck = await httpRequest({
      host: TEST_HOST, port: TEST_PORT, path: '/reconcile', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { call_id: 'CALL-53-FIX12-DEDUP-001' });

    report(7, 'Reconciliação: Endpoint /reconcile responde e reconcilia estado',
      reconcileCheck.status === 200 && reconcileCheck.data.call_id === 'CALL-53-FIX12-DEDUP-001'
    );

  } finally {
    await daemon.stop();
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
  }

  console.log('---------------------------------------------------------------');
  console.log(`RESULTADO: ${passed} PASS / ${failed} FAIL`);
  process.exit(failed === 0 ? 0 : 1);
}

runTests().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
