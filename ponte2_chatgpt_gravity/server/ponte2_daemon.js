/**
 * Syntheon Ponte 2 - Daemon Canônico de Transporte Técnico (ChatGPT <-> Gravity)
 *
 * Arquitetura Estrita (TASK_ID: BRIDGE-V2-PONTE2-CHATGPT-GRAVITY-001):
 * - Escopo Exclusivo: CHATGPT <-> GRAVITY.
 * - Tráfego permitido:
 *     ChatGPT -> Gravity: CALL, AUDIT
 *     Gravity -> ChatGPT: RESULT, ACK, ERROR
 * - Servidor HTTP na porta 8767 dedicado à Ponte 2.
 * - Resolução Canônica CALL-53-PONTE2-FIX-012:
 *     1. Zero eco: Rejeição de [BRIDGE_TO_ANTIGRAVITY_V1] no outbound para ChatGPT.
 *     2. Zero requeue automático após timeout: estado SEND_UNCERTAIN com reconciliação.
 *     4. Segregação e isolamento operacional estrito.
 */

const http = require('http');
const path = require('path');
const fs = require('fs');

const CONFIG = {
  port: 8767,
  host: '127.0.0.1',
  historyFile: path.join(__dirname, '..', 'state', 'ponte2_history.json'),
  dedupeFile: path.join(__dirname, '..', 'state', 'ponte2_dedupe.json'),
  lastCallFile: path.join(__dirname, '..', 'state', 'last_received_call.json'),
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
    this.uncertainCalls = new Map(); // call_id -> { packet, marked_at, status: 'SEND_UNCERTAIN' }
    this.callsProcessed = 0;

    this.resultQueue = [];
    this.inFlightResult = null;
    this.seenResultIds = new Set();
    this.uncertainResults = new Map(); // call_id -> { packet, marked_at, status: 'SEND_UNCERTAIN' }
    this.resultsDelivered = 0;

    this.running = false;
    this.server = null;
    this.watchdogInterval = null;
    this.wakeWaiters = new Set();

    this.loadDedupe();
  }

  loadDedupe() {
    try {
      if (fs.existsSync(CONFIG.dedupeFile)) {
        const raw = fs.readFileSync(CONFIG.dedupeFile, 'utf8');
        const data = JSON.parse(raw);
        if (Array.isArray(data.seenCallIds)) {
          this.seenCallIds = new Set(data.seenCallIds);
        }
        if (Array.isArray(data.seenResultIds)) {
          this.seenResultIds = new Set(data.seenResultIds);
        }
        log(`[DEDUPE_INIT] Estado persistido carregado: ${this.seenCallIds.size} CALLs, ${this.seenResultIds.size} RESULTs.`);
      }
    } catch (e) {
      log(`[DEDUPE_INIT_ERROR] Falha ao carregar dedupe persistido: ${e.message}`);
    }
  }

  saveDedupe() {
    try {
      const data = {
        seenCallIds: Array.from(this.seenCallIds),
        seenResultIds: Array.from(this.seenResultIds),
        updated_at: new Date().toISOString()
      };
      fs.writeFileSync(CONFIG.dedupeFile, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      log(`[DEDUPE_SAVE_ERROR] Falha ao salvar dedupe persistido: ${e.message}`);
    }
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

  notifyWakeWaiters(callPacket) {
    if (!this.wakeWaiters || this.wakeWaiters.size === 0) return;
    log(`[WAKE_NOTIFY] Notificando ${this.wakeWaiters.size} wake waiter(s) sobre nova CALL: ${callPacket.call_id}`);
    for (const waiter of this.wakeWaiters) {
      clearTimeout(waiter.timer);
      try {
        waiter.res.writeHead(200, { 'Content-Type': 'application/json' });
        waiter.res.end(JSON.stringify({ event: 'CALL_READY', call_id: callPacket.call_id }));
      } catch (e) {}
    }
    this.wakeWaiters.clear();
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
          uncertain_calls_count: this.uncertainCalls.size,
          uncertain_calls: Array.from(this.uncertainCalls.keys()),
          result_queue_length: this.resultQueue.length,
          in_flight_result: this.inFlightResult ? this.inFlightResult.call_id : null,
          uncertain_results_count: this.uncertainResults.size,
          uncertain_results: Array.from(this.uncertainResults.keys()),
          calls_processed: this.callsProcessed,
          results_delivered: this.resultsDelivered,
          wake_waiters_count: this.wakeWaiters ? this.wakeWaiters.size : 0,
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

            // Deduplicação persistente determinística: DEDUPE_NO_OP
            if (this.seenCallIds.has(callId)) {
              log(`[DEDUPE_NO_OP] CALL ${callId} já registrada anteriormente. Descartando com DEDUPE_NO_OP.`);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ ok: true, dedupe: true, status: 'DEDUPE_NO_OP', call_id: callId }));
              return;
            }
            this.seenCallIds.add(callId);
            this.saveDedupe();

            const callPacket = {
              call_id: callId,
              task_id: data.task_id || null,
              type: type,
              payload: data.payload || '',
              detected_at: data.detected_at || new Date().toISOString(),
              enqueued_at: new Date().toISOString()
            };

            this.callQueue.push(callPacket);
            log(`[CALL_ENQUEUED] Nova ${type} enfileirada: call_id=${callId}, task_id=${callPacket.task_id}\n[CALL_PAYLOAD]:\n${callPacket.payload}\n---`);
            this.recordHistory({ event: 'CALL_RECEIVED', call_id: callId, type: type, payload: callPacket.payload });
            try {
              fs.writeFileSync(CONFIG.lastCallFile, JSON.stringify(callPacket, null, 2), 'utf8');
            } catch (e) {}

            this.notifyWakeWaiters(callPacket);

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

      // 2b. GET /wait_call -> Long-polling de WAKE reativo (exclusivo para campainha/sinalização, NÃO consome CALL)
      if (req.method === 'GET' && url.pathname === '/wait_call') {
        const timeoutMs = parseInt(url.searchParams.get('timeout') || '600000', 10);

        // Se já há CALL pendente na fila, responde imediatamente sem esperar
        if (this.callQueue.length > 0) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ event: 'CALL_READY', count: this.callQueue.length, call_id: this.callQueue[0].call_id }));
          return;
        }

        const waiter = { res, timer: null };
        waiter.timer = setTimeout(() => {
          this.wakeWaiters.delete(waiter);
          try {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ event: 'TIMEOUT_IDLE' }));
          } catch (e) {}
        }, timeoutMs);

        this.wakeWaiters.add(waiter);

        req.on('close', () => {
          clearTimeout(waiter.timer);
          this.wakeWaiters.delete(waiter);
        });
        return;
      }

      // 3. GET /call -> Gravity consome a próxima CALL sob Single-Flight Lock
      if (req.method === 'GET' && url.pathname === '/call') {
        let callToSend = null;

        // Zero requeue automático: transição para SEND_UNCERTAIN sem colocar de volta na fila
        if (this.inFlightCall && this.inFlightCall._dispatchedAt && (Date.now() - this.inFlightCall._dispatchedAt > 15000)) {
          log(`[SEND_UNCERTAIN] CALL ${this.inFlightCall.call_id} expirou (>15s) sem ACK. Marcada como SEND_UNCERTAIN sem requeue automático.`);
          this.uncertainCalls.set(this.inFlightCall.call_id, {
            packet: this.inFlightCall,
            marked_at: new Date().toISOString(),
            status: 'SEND_UNCERTAIN'
          });
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
            } else if (this.uncertainCalls.has(data.call_id)) {
              log(`[RECONCILE_ACK] CALL ${data.call_id} reconciliada de SEND_UNCERTAIN para ACK_CONFIRMED.`);
              this.uncertainCalls.delete(data.call_id);
              this.callsProcessed++;
              this.recordHistory({ event: 'CALL_ACK_RECONCILED', call_id: data.call_id });
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

            // Regra Anti-Eco: Impede eco de [BRIDGE_TO_ANTIGRAVITY_V1] para o ChatGPT
            const rawPayload = data.payload || '';
            if (rawPayload.includes('[BRIDGE_TO_ANTIGRAVITY_V1]')) {
              log(`[REJECT_ECHO] Tentativa de despachar [BRIDGE_TO_ANTIGRAVITY_V1] para o ChatGPT via /result.`);
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ ok: false, error: 'ECHO_FORBIDDEN_CANNOT_DISPATCH_TO_ANTIGRAVITY_TO_CHATGPT' }));
              return;
            }

            // Deduplicação persistente determinística: DEDUPE_NO_OP
            const resultKey = `RESULT_${callId}_${type}`;
            if (this.seenResultIds.has(resultKey) || this.seenResultIds.has(callId)) {
              log(`[DEDUPE_NO_OP] Resultado ${resultKey} já registrado. Retornando DEDUPE_NO_OP.`);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ ok: true, dedupe: true, status: 'DEDUPE_NO_OP', call_id: callId }));
              return;
            }
            this.seenResultIds.add(resultKey);
            this.seenResultIds.add(callId);
            this.saveDedupe();

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

        // Zero requeue automático: transição para SEND_UNCERTAIN sem devolução cega à fila
        if (this.inFlightResult && this.inFlightResult._dispatchedAt && (Date.now() - this.inFlightResult._dispatchedAt > 15000)) {
          log(`[SEND_UNCERTAIN] RESULT ${this.inFlightResult.call_id} expirou (>15s) sem ACK. Marcado como SEND_UNCERTAIN sem requeue automático.`);
          this.uncertainResults.set(this.inFlightResult.call_id, {
            packet: this.inFlightResult,
            marked_at: new Date().toISOString(),
            status: 'SEND_UNCERTAIN'
          });
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
            } else if (this.uncertainResults.has(data.call_id)) {
              log(`[RECONCILE_ACK] RESULT ${data.call_id} reconciliado de SEND_UNCERTAIN para DELIVERED.`);
              this.uncertainResults.delete(data.call_id);
              this.resultsDelivered++;
              this.recordHistory({ event: 'RESULT_DELIVERED_RECONCILED', call_id: data.call_id });
            }
          } catch (e) {}
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, status: 'RESULT_ACK_RECORDED' }));
        });
        return;
      }

      // 8. POST /reconcile -> Reconciliação explícita por CALL_ID antes de qualquer retry
      if (req.method === 'POST' && url.pathname === '/reconcile') {
        let body = '';
        req.on('data', c => body += c);
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            const callId = data.call_id;
            const action = data.action || 'STATUS'; // STATUS, RESOLVE_CONFIRMED, DISCARD, REQUEUE_EXPLICIT

            const callUncertain = this.uncertainCalls.get(callId);
            const resultUncertain = this.uncertainResults.get(callId);

            if (action === 'RESOLVE_CONFIRMED') {
              if (callUncertain) {
                this.uncertainCalls.delete(callId);
                this.callsProcessed++;
              }
              if (resultUncertain) {
                this.uncertainResults.delete(callId);
                this.resultsDelivered++;
              }
              log(`[RECONCILE] ${callId} reconciliado manualmente como RESOLVE_CONFIRMED.`);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ ok: true, status: 'RESOLVED_CONFIRMED', call_id: callId }));
              return;
            }

            if (action === 'REQUEUE_EXPLICIT') {
              if (callUncertain) {
                this.callQueue.unshift(callUncertain.packet);
                this.uncertainCalls.delete(callId);
                log(`[RECONCILE] CALL ${callId} reenfileirada explicitamente sob ordem controlada.`);
              }
              if (resultUncertain) {
                this.resultQueue.unshift(resultUncertain.packet);
                this.uncertainResults.delete(callId);
                log(`[RECONCILE] RESULT ${callId} reenfileirado explicitamente sob ordem controlada.`);
              }
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ ok: true, status: 'REQUEUED_EXPLICIT', call_id: callId }));
              return;
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              call_id: callId,
              is_call_uncertain: !!callUncertain,
              is_result_uncertain: !!resultUncertain,
              seen_call: this.seenCallIds.has(callId),
              seen_result: this.seenResultIds.has(`RESULT_${callId}_RESULT`)
            }));
          } catch (e) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: 'BAD_JSON' }));
          }
        });
        return;
      }

      // 9. POST /reset -> Limpa filas, locks e incertos para testes controlados
      if (req.method === 'POST' && url.pathname === '/reset') {
        this.callQueue = [];
        this.inFlightCall = null;
        this.resultQueue = [];
        this.inFlightResult = null;
        this.uncertainCalls.clear();
        this.uncertainResults.clear();
        this.seenCallIds.clear();
        this.seenResultIds.clear();
        this.saveDedupe();
        log('[RESET] Filas e dedupe da Ponte 2 limpos.');
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
      // Zero requeue automático: marca SEND_UNCERTAIN
      if (this.inFlightCall && this.inFlightCall._dispatchedAt && (now - this.inFlightCall._dispatchedAt > 15000)) {
        log(`[WATCHDOG_SEND_UNCERTAIN] CALL ${this.inFlightCall.call_id} retida >15s marcada como SEND_UNCERTAIN (zero requeue).`);
        this.uncertainCalls.set(this.inFlightCall.call_id, {
          packet: this.inFlightCall,
          marked_at: new Date().toISOString(),
          status: 'SEND_UNCERTAIN'
        });
        this.inFlightCall = null;
      }
      if (this.inFlightResult && this.inFlightResult._dispatchedAt && (now - this.inFlightResult._dispatchedAt > 15000)) {
        log(`[WATCHDOG_SEND_UNCERTAIN] RESULT ${this.inFlightResult.call_id} retido >15s marcado como SEND_UNCERTAIN (zero requeue).`);
        this.uncertainResults.set(this.inFlightResult.call_id, {
          packet: this.inFlightResult,
          marked_at: new Date().toISOString(),
          status: 'SEND_UNCERTAIN'
        });
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
