/**
 * Syntheon Ponte 2 - Daemon Canônico de Transporte Técnico (ChatGPT <-> Gravity)
 *
 * Arquitetura Estrita (TASK_ID: BRIDGE-V2-PONTE2-CHATGPT-GRAVITY-001):
 * - Escopo Exclusivo: CHATGPT <-> GRAVITY.
 * - Tráfego permitido:
 *     ChatGPT -> Gravity: CALL, AUDIT
 *     Gravity -> ChatGPT: RESULT, ACK, ERROR
 * - Servidor HTTP na porta 8767 dedicado à Ponte 2.
 */

const http = require('http');
const path = require('path');
const fs = require('fs');

const CONFIG = {
  port: 8767,
  host: '127.0.0.1',
  historyFile: path.join(__dirname, '..', 'state', 'ponte2_history.json'),
  logFile: path.join(__dirname, '..', 'logs', 'ponte2.log')
};

const ALLOWED_CALL_TYPES = new Set(['CALL', 'AUDIT']);
const ALLOWED_RESULT_TYPES = new Set(['RESULT', 'ACK', 'ERROR']);

function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] [PONTE_2] ${msg}`;
  console.log(line);
  try {
    fs.appendFileSync(CONFIG.logFile, line + '\n', 'utf8');
  } catch (e) {}
}

class Ponte2Daemon {
  constructor() {
    this.callQueue = [];
    this.inFlightCall = null;
    this.seenCallIds = new Set();
    this.callsProcessed = 0;

    this.resultQueue = [];
    this.inFlightResult = null;
    this.seenResultIds = new Set();
    this.resultsDelivered = 0;

    this.running = false;
    this.server = null;
    this.watchdogInterval = null;
  }

  recordHistory(record) {
    try {
      let hist = [];
      if (fs.existsSync(CONFIG.historyFile)) {
        hist = JSON.parse(fs.readFileSync(CONFIG.historyFile, 'utf8'));
      }
      hist.push({
        ...record,
        recorded_at: new Date().toISOString()
      });
      if (hist.length > 200) hist = hist.slice(-200);
      fs.writeFileSync(CONFIG.historyFile, JSON.stringify(hist, null, 2), 'utf8');
    } catch (e) {}
  }

  startHttpServer() {
    this.server = http.createServer((req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      const url = new URL(req.url, `http://${CONFIG.host}:${CONFIG.port}`);

      // 1. GET /status -> Telemetria operacional da Ponte 2
      if (req.method === 'GET' && url.pathname === '/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          bridge: 'PONTE_2_CHATGPT_GRAVITY',
          port: CONFIG.port,
          call_queue_length: this.callQueue.length,
          in_flight_call: this.inFlightCall ? this.inFlightCall.call_id : null,
          result_queue_length: this.resultQueue.length,
          in_flight_result: this.inFlightResult ? this.inFlightResult.call_id : null,
          calls_processed: this.callsProcessed,
          results_delivered: this.resultsDelivered,
          running: this.running
        }));
        return;
      }

      // 2. POST /call -> Content script / Extensão detecta CALL no ChatGPT e envia ao Daemon
      if (req.method === 'POST' && url.pathname === '/call') {
        let body = '';
        req.on('data', c => body += c);
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            const callId = data.call_id;
            const type = data.type ? String(data.type).toUpperCase() : 'CALL';

            if (!callId || typeof callId !== 'string') {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ ok: false, error: 'MISSING_OR_INVALID_CALL_ID' }));
              return;
            }

            if (!ALLOWED_CALL_TYPES.has(type)) {
              log(`[REJECT] Tipo inválido para Ponte 2: ${type}. Permitidos: CALL, AUDIT.`);
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ ok: false, error: 'INVALID_TYPE_FOR_PONTE2', allowed: Array.from(ALLOWED_CALL_TYPES) }));
              return;
            }

            if (this.seenCallIds.has(callId)) {
              log(`[DEDUPE_CALL] CALL ${callId} já registrada anteriormente.`);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ ok: true, dedupe: true, call_id: callId }));
              return;
            }
            this.seenCallIds.add(callId);

            const callPacket = {
              call_id: callId,
              task_id: data.task_id || null,
              type: type,
              payload: data.payload || '',
              detected_at: data.detected_at || new Date().toISOString(),
              enqueued_at: new Date().toISOString()
            };

            this.callQueue.push(callPacket);
            log(`[CALL_ENQUEUED] Nova ${type} enfileirada: call_id=${callId}, task_id=${callPacket.task_id}`);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true, queued: true, call_id: callId }));
          } catch (err) {
            log(`Erro no parsing de /call: ${err.message}`);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: 'BAD_JSON' }));
          }
        });
        return;
      }

      // 3. GET /call -> Gravity consome a próxima CALL sob Single-Flight Lock
      if (req.method === 'GET' && url.pathname === '/call') {
        let callToSend = null;

        if (this.inFlightCall && this.inFlightCall._dispatchedAt && (Date.now() - this.inFlightCall._dispatchedAt > 15000)) {
          log(`[CALL_TIMEOUT] CALL ${this.inFlightCall.call_id} expirou (>15s). Retornando à fila.`);
          this.callQueue.unshift(this.inFlightCall);
          this.inFlightCall = null;
        }

        if (this.inFlightCall === null && this.callQueue.length > 0) {
          this.inFlightCall = this.callQueue.shift();
          this.inFlightCall._dispatchedAt = Date.now();
          callToSend = this.inFlightCall;
          log(`[SINGLE_FLIGHT_CALL_DISPATCH] CALL despachada para o Gravity: ${callToSend.call_id}`);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        if (callToSend) {
          res.end(JSON.stringify(callToSend));
        } else {
          res.end(JSON.stringify({
            call_id: null,
            payload: null,
            in_flight: this.inFlightCall ? this.inFlightCall.call_id : null
          }));
        }
        return;
      }

      // 4. POST /call_ack -> Gravity confirma recebimento da CALL
      if (req.method === 'POST' && url.pathname === '/call_ack') {
        let body = '';
        req.on('data', c => body += c);
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (this.inFlightCall && this.inFlightCall.call_id === data.call_id) {
              log(`[CALL_ACK_CONFIRMED] Gravity confirmou recebimento da CALL: ${data.call_id}`);
              this.inFlightCall = null;
              this.callsProcessed++;
              this.recordHistory({ event: 'CALL_ACK', call_id: data.call_id });
            }
          } catch (e) {}
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, status: 'CALL_ACK_RECORDED' }));
        });
        return;
      }

      // 5. POST /result -> Gravity entrega o RESULT / ACK técnico para ser enviado ao ChatGPT
      if (req.method === 'POST' && url.pathname === '/result') {
        let body = '';
        req.on('data', c => body += c);
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            const callId = data.call_id;
            const type = data.type ? String(data.type).toUpperCase() : 'RESULT';

            if (!callId || typeof callId !== 'string') {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ ok: false, error: 'MISSING_OR_INVALID_CALL_ID' }));
              return;
            }

            if (!ALLOWED_RESULT_TYPES.has(type)) {
              log(`[REJECT] Tipo de resultado inválido para Ponte 2: ${type}. Permitidos: RESULT, ACK, ERROR.`);
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ ok: false, error: 'INVALID_TYPE_FOR_PONTE2_RESULT', allowed: Array.from(ALLOWED_RESULT_TYPES) }));
              return;
            }

            const resultKey = `RESULT_${callId}_${type}`;
            if (this.seenResultIds.has(resultKey)) {
              log(`[DEDUPE_RESULT] Resultado para ${resultKey} já registrado. Descartando.`);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ ok: true, dedupe: true, call_id: callId }));
              return;
            }
            this.seenResultIds.add(resultKey);

            const rawPayload = data.payload || '';
            const envelope = 
`[BRIDGE_FROM_ANTIGRAVITY_V1]
CALL_ID: ${callId}
TYPE: ${type}
PAYLOAD:
${rawPayload}
[/BRIDGE_FROM_ANTIGRAVITY_V1]`;

            const resultPacket = {
              call_id: callId,
              type: type,
              payload: envelope,
              raw_payload: rawPayload,
              created_at: new Date().toISOString()
            };

            this.resultQueue.push(resultPacket);
            log(`[RESULT_ENQUEUED] Novo ${type} enfileirado para envio ao ChatGPT: call_id=${callId}`);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true, queued: true, call_id: callId }));
          } catch (err) {
            log(`Erro no parsing de /result: ${err.message}`);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: 'BAD_JSON' }));
          }
        });
        return;
      }

      // 6. GET /result -> Extensão consome o próximo RESULT sob Single-Flight Lock
      if (req.method === 'GET' && url.pathname === '/result') {
        let resultToSend = null;

        if (this.inFlightResult && this.inFlightResult._dispatchedAt && (Date.now() - this.inFlightResult._dispatchedAt > 15000)) {
          log(`[RESULT_TIMEOUT] RESULT ${this.inFlightResult.call_id} expirou (>15s). Retornando à fila.`);
          this.resultQueue.unshift(this.inFlightResult);
          this.inFlightResult = null;
        }

        if (this.inFlightResult === null && this.resultQueue.length > 0) {
          this.inFlightResult = this.resultQueue.shift();
          this.inFlightResult._dispatchedAt = Date.now();
          resultToSend = this.inFlightResult;
          log(`[SINGLE_FLIGHT_RESULT_DISPATCH] RESULT despachado para a extensão do ChatGPT: ${resultToSend.call_id}`);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        if (resultToSend) {
          res.end(JSON.stringify(resultToSend));
        } else {
          res.end(JSON.stringify({
            call_id: null,
            payload: null,
            in_flight: this.inFlightResult ? this.inFlightResult.call_id : null
          }));
        }
        return;
      }

      // 7. POST /result_ack -> Extensão confirma que injetou o RESULT no ChatGPT
      if (req.method === 'POST' && url.pathname === '/result_ack') {
        let body = '';
        req.on('data', c => body += c);
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (this.inFlightResult && this.inFlightResult.call_id === data.call_id) {
              log(`[RESULT_ACK_CONFIRMED] Extensão confirmou injeção do RESULT no ChatGPT: ${data.call_id}`);
              this.inFlightResult = null;
              this.resultsDelivered++;
              this.recordHistory({ event: 'RESULT_DELIVERED', call_id: data.call_id });
            }
          } catch (e) {}
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, status: 'RESULT_ACK_RECORDED' }));
        });
        return;
      }

      // 8. POST /reset -> Limpa filas e locks para testes controlados
      if (req.method === 'POST' && url.pathname === '/reset') {
        this.callQueue = [];
        this.inFlightCall = null;
        this.resultQueue = [];
        this.inFlightResult = null;
        this.seenCallIds.clear();
        this.seenResultIds.clear();
        log('[RESET] Filas da Ponte 2 limpas.');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, status: 'RESET_OK' }));
        return;
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'NOT_FOUND' }));
    });

    this.server.listen(CONFIG.port, CONFIG.host, () => {
      this.running = true;
      log(`Servidor da Ponte 2 escutando em http://${CONFIG.host}:${CONFIG.port}`);
    });
    return this.server;
  }

  startWatchdog() {
    this.watchdogInterval = setInterval(() => {
      const now = Date.now();
      if (this.inFlightCall && this.inFlightCall._dispatchedAt && (now - this.inFlightCall._dispatchedAt > 15000)) {
        log(`[WATCHDOG] Liberando CALL ${this.inFlightCall.call_id} retida sem ACK por > 15s.`);
        this.callQueue.unshift(this.inFlightCall);
        this.inFlightCall = null;
      }
      if (this.inFlightResult && this.inFlightResult._dispatchedAt && (now - this.inFlightResult._dispatchedAt > 15000)) {
        log(`[WATCHDOG] Liberando RESULT ${this.inFlightResult.call_id} retido sem ACK por > 15s.`);
        this.resultQueue.unshift(this.inFlightResult);
        this.inFlightResult = null;
      }
    }, 5000);
  }

  start() {
    this.startHttpServer();
    this.startWatchdog();
  }

  stop() {
    this.running = false;
    if (this.watchdogInterval) clearInterval(this.watchdogInterval);
    if (this.server) this.server.close();
  }
}

if (require.main === module) {
  const daemon = new Ponte2Daemon();
  daemon.start();
}

module.exports = Ponte2Daemon;
