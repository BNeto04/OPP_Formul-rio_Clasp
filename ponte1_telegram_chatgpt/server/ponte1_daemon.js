/**
 * Syntheon Ponte 1 - Daemon Canônico de Transporte (Telegram <-> ChatGPT)
 *
 * Arquitetura Estrita (TASK_ID: BRIDGE-V2-HARD-SEPARATION-001):
 * - Escopo Exclusivo: MANO <-> TELEGRAM <-> CHATGPT.
 * - Zero acoplamento com componentes legados, Vigia ou Gravity.
 * - Zero tráfego técnico (CALL, RESULT, AUDIT).
 * - Servidor HTTP na porta 8766 dedicado à extensão da Ponte 1.
 */

const http = require('http');
const path = require('path');
const fs = require('fs');
const TelegramClient = require('./telegram_client');

const CONFIG = {
  port: 8766,
  host: '127.0.0.1',
  pollIntervalMs: 2000,
  tokenFile: 'C:\\Users\\Bneto04\\AppData\\Local\\SyntheonVigia\\telegram.token',
  allowlistFile: 'C:\\Users\\Bneto04\\AppData\\Local\\SyntheonVigia\\allowlist.json',
  offsetFile: path.join(__dirname, 'ponte1_offset.json'),
  deliveryHistoryFile: path.join(__dirname, 'ponte1_delivery_history.json'),
  logFile: path.join(__dirname, 'ponte1.log')
};

function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] [PONTE_1] ${msg}`;
  console.log(line);
  try {
    fs.appendFileSync(CONFIG.logFile, line + '\n', 'utf8');
  } catch (e) {}
}

function getBotToken() {
  try {
    if (fs.existsSync(CONFIG.tokenFile)) {
      return fs.readFileSync(CONFIG.tokenFile, 'utf8').trim();
    }
  } catch (e) {}
  return process.env.TELEGRAM_BOT_TOKEN || null;
}

function getAuthorizedChatId() {
  try {
    if (fs.existsSync(CONFIG.allowlistFile)) {
      const data = JSON.parse(fs.readFileSync(CONFIG.allowlistFile, 'utf8'));
      return data.authorized_chat_id || (data.authorized_user && data.authorized_user.authorized_chat_id) || 6857459665;
    }
  } catch (e) {}
  return 6857459665;
}

class Ponte1Daemon {
  constructor() {
    this.token = getBotToken();
    this.authorizedChatId = getAuthorizedChatId();
    this.client = this.token ? new TelegramClient(this.token) : null;

    this.packetQueue = [];
    this.inFlightPacket = null;
    this.seenMessageIds = new Set();
    this.seenReplyIds = new Set();
    this.deliveredCount = 0;
    this.running = false;
    this.currentOffset = this.loadOffset();
  }

  loadOffset() {
    try {
      if (fs.existsSync(CONFIG.offsetFile)) {
        const data = JSON.parse(fs.readFileSync(CONFIG.offsetFile, 'utf8'));
        return data.offset || 0;
      }
    } catch (e) {}
    return 0;
  }

  saveOffset(offset) {
    this.currentOffset = offset;
    try {
      fs.writeFileSync(CONFIG.offsetFile, JSON.stringify({ offset, updated_at: new Date().toISOString() }, null, 2), 'utf8');
    } catch (e) {}
  }

  recordDelivery(replyId, tgMsgId) {
    try {
      let hist = {};
      if (fs.existsSync(CONFIG.deliveryHistoryFile)) {
        hist = JSON.parse(fs.readFileSync(CONFIG.deliveryHistoryFile, 'utf8'));
      }
      hist[replyId] = {
        delivered_at: new Date().toISOString(),
        telegram_message_id: tgMsgId
      };
      fs.writeFileSync(CONFIG.deliveryHistoryFile, JSON.stringify(hist, null, 2), 'utf8');
    } catch (e) {}
  }

  // 1. Poller Contínuo do Telegram
  async startTelegramPolling() {
    if (!this.client) {
      log('AVISO: Token do Telegram não encontrado. Polling desativado.');
      return;
    }
    this.running = true;
    log(`Iniciando polling exclusivo do Telegram para chat_id=${this.authorizedChatId}...`);

    while (this.running) {
      try {
        const res = await this.client.getUpdates(this.currentOffset, 5);
        if (res && res.ok && Array.isArray(res.result)) {
          for (const update of res.result) {
            this.saveOffset(update.update_id + 1);
            const msg = update.message;
            if (!msg || !msg.text) continue;

            // Filtro estrito de autorização: somente o proprietário
            const fromId = msg.from?.id;
            const chatId = msg.chat?.id;
            if (chatId != this.authorizedChatId && fromId != this.authorizedChatId) {
              log(`Ignorando mensagem de remetente não autorizado: from=${fromId}, chat=${chatId}`);
              continue;
            }

            // Deduplicação determinística
            const msgId = msg.message_id;
            if (this.seenMessageIds.has(msgId)) {
              continue;
            }
            this.seenMessageIds.add(msgId);

            // Filtro de isolamento: descarta envelopes técnicos da outra ponte se algum dia chegarem
            if (msg.text.includes('[BRIDGE_TO_ANTIGRAVITY') || msg.text.includes('[RESULT]') || msg.text.includes('CALL_ID:')) {
              log(`ISOLAMENTO: Envelope técnico descartado da Ponte 1: msgId=${msgId}`);
              continue;
            }

            // Formatação do Envelope Mínimo e Indispensável para o ChatGPT
            const sender = msg.from?.first_name || 'Manoel';
            const cleanText = msg.text.trim();
            const packetId = `PONTE1_MSG_${msgId}`;

            const payload = 
`[TELEGRAM de ${sender}]: ${cleanText}

Responda exclusivamente no formato:
[CHATGPT_REPLY_V1]
REPLY_TO_MESSAGE_ID: ${msgId}
PAYLOAD: sua resposta
[/CHATGPT_REPLY_V1]`;

            this.packetQueue.push({
              packet_id: packetId,
              telegram_message_id: msgId,
              chat_id: chatId,
              payload: payload,
              enqueued_at: new Date().toISOString()
            });

            log(`[TELEGRAM_INGEST] Mensagem enfileirada: packet_id=${packetId}, text="${cleanText.substring(0, 30)}"`);
          }
        }
      } catch (err) {
        log(`Erro no polling do Telegram: ${err.message}`);
        await new Promise(r => setTimeout(r, 4000));
      }
      await new Promise(r => setTimeout(r, 500));
    }
  }

  // 2. Servidor HTTP Local (Porta 8766)
  startHttpServer() {
    const server = http.createServer(async (req, res) => {
      // CORS
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      const url = new URL(req.url, `http://${CONFIG.host}:${CONFIG.port}`);

      // GET /status
      if (req.method === 'GET' && url.pathname === '/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          bridge: 'PONTE_1_TELEGRAM_CHATGPT',
          queue_length: this.packetQueue.length,
          in_flight: this.inFlightPacket ? this.inFlightPacket.packet_id : null,
          delivered_count: this.deliveredCount,
          running: this.running
        }));
        return;
      }

      // GET /packet -> Entrega 1 pacote sob Single-Flight Lock
      if (req.method === 'GET' && url.pathname === '/packet') {
        let packetToSend = null;
        // Se inFlightPacket expirou (> 15 segundos sem ACK), libera o lock
        if (this.inFlightPacket && this.inFlightPacket._dispatchedAt && (Date.now() - this.inFlightPacket._dispatchedAt > 15000)) {
          log(`[IN_FLIGHT_TIMEOUT] Pacote ${this.inFlightPacket.packet_id} retido por mais de 15s. Devolvendo para fila.`);
          this.packetQueue.unshift(this.inFlightPacket);
          this.inFlightPacket = null;
        }

        if (this.inFlightPacket === null && this.packetQueue.length > 0) {
          this.inFlightPacket = this.packetQueue.shift();
          this.inFlightPacket._dispatchedAt = Date.now();
          packetToSend = this.inFlightPacket;
          log(`[SINGLE_FLIGHT_DISPATCH] Pacote alocado para o ChatGPT Carrier: ${packetToSend.packet_id}`);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        if (packetToSend) {
          res.end(JSON.stringify(packetToSend));
        } else {
          res.end(JSON.stringify({
            packet_id: null,
            payload: null,
            in_flight: this.inFlightPacket ? this.inFlightPacket.packet_id : null
          }));
        }
        return;
      }

      // POST /ack -> Confirma que o Carrier injetou com sucesso no ChatGPT
      if (req.method === 'POST' && url.pathname === '/ack') {
        let body = '';
        req.on('data', c => body += c);
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (this.inFlightPacket && this.inFlightPacket.packet_id === data.packet_id) {
              log(`[CARRIER_ACK_CONFIRMED] Pacote ${data.packet_id} confirmado entregue no ChatGPT.`);
              this.inFlightPacket = null;
              this.deliveredCount++;
            }
          } catch (e) {}
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, status: 'ACK_RECORDED' }));
        });
        return;
      }

      // POST /reply -> Recebe a resposta do ChatGPT capturada pelo content script e despacha ao Telegram
      if (req.method === 'POST' && url.pathname === '/reply') {
        let body = '';
        req.on('data', c => body += c);
        req.on('end', async () => {
          try {
            const data = JSON.parse(body);
            const rawPayload = data.payload || '';
            const replyToMsgId = data.reply_to_message_id || null;

            log(`[CHATGPT_REPLY_RECEIVED] Resposta recebida da extensão: reply_to=${replyToMsgId}`);

            // Deduplicação de envio ao Telegram
            const replyKey = `REPLY_${replyToMsgId}_${rawPayload.substring(0, 30)}`;
            if (this.seenReplyIds.has(replyKey)) {
              log(`[DEDUPE_NO_OP] Resposta já enviada ao Telegram anteriormente.`);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ ok: true, dedupe: true }));
              return;
            }
            this.seenReplyIds.add(replyKey);

            // Envia ao Telegram
            if (this.client) {
              const tgRes = await this.client.sendMessage(this.authorizedChatId, rawPayload, replyToMsgId);
              if (tgRes && tgRes.ok) {
                const outMsgId = tgRes.result.message_id;
                this.recordDelivery(replyKey, outMsgId);
                log(`[TELEGRAM_SEND_SUCCESS] Resposta entregue no Telegram: msg_id=${outMsgId}, reply_to=${replyToMsgId}`);
              } else {
                log(`Falha no envio ao Telegram: ${JSON.stringify(tgRes)}`);
              }
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true, delivered_to_telegram: true }));
          } catch (err) {
            log(`Erro ao processar /reply: ${err.message}`);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: err.message }));
          }
        });
        return;
      }

      // POST /reset -> Limpa filas e locks para testes
      if (req.method === 'POST' && url.pathname === '/reset') {
        this.packetQueue = [];
        this.inFlightPacket = null;
        log('[RESET] Filas da Ponte 1 limpas.');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, status: 'RESET_OK' }));
        return;
      }

      res.writeHead(404);
      res.end();
    });

    server.listen(CONFIG.port, CONFIG.host, () => {
      log(`Servidor da Ponte 1 escutando em http://${CONFIG.host}:${CONFIG.port}`);
    });
    return server;
  }

  start() {
    this.startHttpServer();
    this.startTelegramPolling();
    // Watchdog periódico para liberar pacotes retidos sem ACK por > 15s
    setInterval(() => {
      if (this.inFlightPacket && this.inFlightPacket._dispatchedAt && (Date.now() - this.inFlightPacket._dispatchedAt > 15000)) {
        log(`[IN_FLIGHT_WATCHDOG] Pacote ${this.inFlightPacket.packet_id} retido por mais de 15s. Devolvendo para fila.`);
        this.packetQueue.unshift(this.inFlightPacket);
        this.inFlightPacket = null;
      }
    }, 5000);
  }
}

if (require.main === module) {
  const daemon = new Ponte1Daemon();
  daemon.start();
}

module.exports = Ponte1Daemon;
