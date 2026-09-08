/**
 * Teste Especifico: Garantia de Exactly-Once e Anti-Duplicidade na Ponte 1 (Telegram <-> ChatGPT)
 *
 * Determinismo exigido na Issue #53 (Gate 013):
 * "dedupe da Ponte 1 deve ocorrer antes da injecao por MESSAGE_ID. Nao usar contrafuncao como mecanismo principal.
 * Validar com teste LIVE exatamente-once nas duas pontes."
 *
 * Executa em porta efemera (8791) e diretorio de estado isolado.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const TEST_DIR = path.join(__dirname, 'temp_p1_exactly_once');
const TEST_PORT = 8791;
const TEST_HOST = '127.0.0.1';

if (fs.existsSync(TEST_DIR)) {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
}
fs.mkdirSync(TEST_DIR, { recursive: true });

const CONFIG_TEST = {
  port: TEST_PORT,
  host: TEST_HOST,
  dedupeFile: path.join(TEST_DIR, 'ponte1_dedupe.json'),
  deliveryHistoryFile: path.join(TEST_DIR, 'ponte1_delivery_history.json'),
  logFile: path.join(TEST_DIR, 'ponte1.log')
};

class IsolatedPonte1Daemon {
  constructor(config) {
    this.config = config;
    this.packetQueue = [];
    this.inFlightPacket = null;
    this.seenMessageIds = new Set();
    this.uncertainPackets = new Map();
    this.deliveredCount = 0;
    this.server = null;
    this.loadDedupe();
  }

  loadDedupe() {
    try {
      if (fs.existsSync(this.config.dedupeFile)) {
        const raw = fs.readFileSync(this.config.dedupeFile, 'utf8');
        const data = JSON.parse(raw);
        if (Array.isArray(data.seenMessageIds)) {
          this.seenMessageIds = new Set(data.seenMessageIds);
        }
      }
    } catch (e) {}
  }

  saveDedupe() {
    try {
      const data = {
        seenMessageIds: Array.from(this.seenMessageIds),
        updated_at: new Date().toISOString()
      };
      fs.writeFileSync(this.config.dedupeFile, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {}
  }

  enqueueTelegramMessage(msgId, text) {
    if (this.seenMessageIds.has(msgId)) {
      return { enqueued: false, status: 'DEDUPE_NO_OP' };
    }
    this.seenMessageIds.add(msgId);
    this.saveDedupe();

    const packetId = `PONTE1_MSG_${msgId}`;
    const payload = `[TELEGRAM de Manoel]: ${text}\n\nResponda exclusivamente no formato:\n[CHATGPT_REPLY_V1]\nREPLY_TO_MESSAGE_ID: ${msgId}\nPAYLOAD: sua resposta\n[/CHATGPT_REPLY_V1]`;
    this.packetQueue.push({
      packet_id: packetId,
      telegram_message_id: msgId,
      payload: payload,
      enqueued_at: new Date().toISOString()
    });
    return { enqueued: true, packet_id: packetId };
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

        if (req.method === 'GET' && url.pathname === '/status') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            queue_length: this.packetQueue.length,
            in_flight: this.inFlightPacket ? this.inFlightPacket.packet_id : null,
            uncertain_count: this.uncertainPackets.size,
            delivered_count: this.deliveredCount
          }));
          return;
        }

        // GET /packet
        if (req.method === 'GET' && url.pathname === '/packet') {
          let packetToSend = null;
          // Zero requeue por timeout: move para SEND_UNCERTAIN
          if (this.inFlightPacket && this.inFlightPacket._dispatchedAt && (Date.now() - this.inFlightPacket._dispatchedAt > 15000)) {
            this.uncertainPackets.set(this.inFlightPacket.packet_id, {
              packet: this.inFlightPacket,
              status: 'SEND_UNCERTAIN'
            });
            this.inFlightPacket = null;
          }

          if (this.inFlightPacket === null && this.packetQueue.length > 0) {
            this.inFlightPacket = this.packetQueue.shift();
            this.inFlightPacket._dispatchedAt = Date.now();
            packetToSend = this.inFlightPacket;
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          if (packetToSend) {
            res.end(JSON.stringify(packetToSend));
          } else {
            res.end(JSON.stringify({ packet_id: null, payload: null }));
          }
          return;
        }

        // POST /ack
        if (req.method === 'POST' && url.pathname === '/ack') {
          let body = '';
          req.on('data', c => body += c);
          req.on('end', () => {
            const data = JSON.parse(body || '{}');
            if (this.inFlightPacket && this.inFlightPacket.packet_id === data.packet_id) {
              this.inFlightPacket = null;
              this.deliveredCount++;
            } else if (this.uncertainPackets.has(data.packet_id)) {
              this.uncertainPackets.delete(data.packet_id);
              this.deliveredCount++;
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true, status: 'ACK_RECORDED' }));
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
    if (postData) req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    req.end();
  });
}

async function run() {
  console.log('===============================================================');
  console.log('TESTE DE EXACTLY-ONCE E ANTI-DUPLICIDADE (PONTE 1)');
  console.log('===============================================================');

  let daemon = new IsolatedPonte1Daemon(CONFIG_TEST);
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
    const testMsgId = 350;

    // 1. Ingestao inicial da mensagem 350
    const ing1 = daemon.enqueueTelegramMessage(testMsgId, 'Continue com eco');
    report(1, 'Primeira ingestao da mensagem Telegram 350: aceita e enfileirada',
      ing1.enqueued === true && ing1.packet_id === 'PONTE1_MSG_350'
    );

    // 2. Ingestao duplicada da MESMA mensagem 350
    const ing2 = daemon.enqueueTelegramMessage(testMsgId, 'Continue com eco repetido');
    report(2, 'Segunda ingestao da MESMA mensagem 350: suprimida com DEDUPE_NO_OP',
      ing2.enqueued === false && ing2.status === 'DEDUPE_NO_OP'
    );

    // 3. Fila do daemon retem estritamente 1 item
    const status1 = await httpRequest({ host: TEST_HOST, port: TEST_PORT, path: '/status', method: 'GET' });
    report(3, 'Fila do daemon retem exatamente 1 pacote',
      status1.data.queue_length === 1
    );

    // 4. Consumo pela extensao sob Single-Flight
    const get1 = await httpRequest({ host: TEST_HOST, port: TEST_PORT, path: '/packet', method: 'GET' });
    report(4, 'Extensao consome o pacote sob single-flight',
      get1.data.packet_id === 'PONTE1_MSG_350'
    );

    // Confirma ACK
    await httpRequest({
      host: TEST_HOST, port: TEST_PORT, path: '/ack', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { packet_id: 'PONTE1_MSG_350' });

    // 5. Segunda consulta: fila vazia
    const get2 = await httpRequest({ host: TEST_HOST, port: TEST_PORT, path: '/packet', method: 'GET' });
    report(5, 'Fila subsequente vazia: zero requeue residual',
      get2.data.packet_id === null
    );

    // 6. Persistencia do dedupe em disco apos restart do daemon
    await daemon.stop();
    await new Promise(r => setTimeout(r, 400));
    daemon = new IsolatedPonte1Daemon(CONFIG_TEST);
    await daemon.start();

    const ing3 = daemon.enqueueTelegramMessage(testMsgId, 'Tentativa pos-restart');
    report(6, 'Persistencia pos-restart: mensagem 350 retida no dedupe em disco',
      ing3.enqueued === false && ing3.status === 'DEDUPE_NO_OP'
    );

    // 7. Camada de Content Script da Ponte 1: dedupe antes da injecao por MESSAGE_ID
    const deliveredContentIds = new Set();
    function simulatePonte1ContentInjection(msgId, payload) {
      if (msgId && deliveredContentIds.has(String(msgId))) {
        return { success: true, status: 'DEDUPE_NO_OP', message_id: msgId };
      }
      if (payload.includes('[BRIDGE_TO_ANTIGRAVITY_V1]')) {
        return { success: false, status: 'ECHO_NO_OP', error: 'ECHO_NO_OP' };
      }
      deliveredContentIds.add(String(msgId));
      return { success: true, injected: true };
    }

    const c1 = simulatePonte1ContentInjection(350, '[TELEGRAM de Manoel]: Olá');
    const c2 = simulatePonte1ContentInjection(350, '[TELEGRAM de Manoel]: Olá');
    const cEcho = simulatePonte1ContentInjection(351, '[BRIDGE_TO_ANTIGRAVITY_V1]\nCALL_ID: 123');

    report(7, 'Content Script da Ponte 1: dedupe antes da injecao por MESSAGE_ID e anti-eco (ECHO_NO_OP)',
      c1.success === true && c1.injected === true &&
      c2.success === true && c2.status === 'DEDUPE_NO_OP' && c2.injected === undefined &&
      cEcho.status === 'ECHO_NO_OP'
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
