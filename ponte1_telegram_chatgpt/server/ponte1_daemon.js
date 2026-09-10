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
  tokenFile: path.join(__dirname, '..', 'config', 'telegram.token'),
  allowlistFile: path.join(__dirname, '..', 'config', 'allowlist.json'),
  offsetFile: path.join(__dirname, 'ponte1_offset.json'),
  dedupeFile: path.join(__dirname, 'ponte1_dedupe.json'),
  deliveryHistoryFile: path.join(__dirname, 'ponte1_delivery_history.json'),
  outboxFile: path.join(__dirname, 'ponte1_outbox.json'),
  relayConfigFile: path.join(__dirname, '..', 'config', 'hermes_relay.json'),
  silenceLimitMs: 240000,
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

// RELAY PARA O CHAT DO HERMES (10/09/2026): a resposta do ChatGPT passa a aparecer tambem
// no chat do bot do Hermes, onde o proprietario realmente conversa. O token e lido do .env
// do Hermes em tempo de execucao e NUNCA e escrito em log.
function getRelayConfig() {
  try {
    if (!fs.existsSync(CONFIG.relayConfigFile)) return null;
    const cfg = JSON.parse(fs.readFileSync(CONFIG.relayConfigFile, 'utf8'));
    if (!cfg || !cfg.enabled) return null;
    let token = null;
    if (cfg.token_file && fs.existsSync(cfg.token_file)) {
      const linha = fs.readFileSync(cfg.token_file, 'utf8').split(/\r?\n/).find(l => l.trim().startsWith((cfg.env_key || 'TELEGRAM_BOT_TOKEN') + '='));
      if (linha) token = linha.split('=').slice(1).join('=').trim().replace(/^["']|["']$/g, '');
    }
    if (!token || !cfg.chat_id) return null;
    return { token, chatId: cfg.chat_id, prefixo: cfg.prefixo || '[GPT] ' };
  } catch (e) {
    return null;
  }
}

class Ponte1Daemon {
  constructor() {
    this.token = getBotToken();
    this.authorizedChatId = getAuthorizedChatId();
    this.client = this.token ? new TelegramClient(this.token) : null;

    this.packetQueue = [];
    this.inFlightPacket = null;
    this.seenMessageIds = new Set();
    this.uncertainPackets = new Map();
    this.seenReplyIds = new Set();
    this.deliveredCount = 0;
    this.running = false;
    this.currentOffset = this.loadOffset();
    this.loadDedupe();
    this.outbox = this.loadOutbox();
    // Alarme de silencio: pacotes entregues ao ChatGPT que ainda nao voltaram
    this.aguardandoResposta = new Map();
    // Relay para o chat do Hermes (opcional, fail-soft)
    const relay = getRelayConfig();
    this.relayClient = relay ? new TelegramClient(relay.token) : null;
    this.relayChatId = relay ? relay.chatId : null;
    this.relayPrefixo = relay ? relay.prefixo : '';
  }

  loadDedupe() {
    try {
      if (fs.existsSync(CONFIG.dedupeFile)) {
        const raw = fs.readFileSync(CONFIG.dedupeFile, 'utf8');
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
      fs.writeFileSync(CONFIG.dedupeFile, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {}
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

  // CAIXA DE SAIDA (10/09/2026): resposta do ChatGPT que nao conseguiu chegar ao Telegram
  // nao e mais perdida - fica persistida aqui e e reenviada nos ciclos seguintes.
  loadOutbox() {
    try {
      if (fs.existsSync(CONFIG.outboxFile)) {
        const data = JSON.parse(fs.readFileSync(CONFIG.outboxFile, 'utf8'));
        if (Array.isArray(data.pendentes)) return data.pendentes;
      }
    } catch (e) {}
    return [];
  }

  saveOutbox() {
    try {
      fs.writeFileSync(CONFIG.outboxFile, JSON.stringify({ pendentes: this.outbox, updated_at: new Date().toISOString() }, null, 2), 'utf8');
    } catch (e) {}
  }

  enfileirarOutbox(replyKey, replyToMsgId, payload, erro) {
    if (this.outbox.length >= 50) {
      const descartado = this.outbox.shift();
      log(`[OUTBOX_LIMITE] Caixa de saida cheia (50); descartando o mais antigo: ${descartado.reply_key}`);
    }
    this.outbox.push({
      reply_key: replyKey,
      reply_to_message_id: replyToMsgId,
      payload: payload,
      tentativas: 0,
      ultimo_erro: erro || null,
      enfileirado_em: new Date().toISOString()
    });
    this.saveOutbox();
    log(`[OUTBOX_QUEUED] Resposta de reply_to=${replyToMsgId} retida para reenvio (erro: ${erro || 'desconhecido'}). Pendentes: ${this.outbox.length}.`);
  }

  async flushOutbox() {
    if (!this.client || this.outbox.length === 0) return;
    for (const item of [...this.outbox]) {
      try {
        const tgRes = await this.client.sendMessage(this.authorizedChatId, item.payload, item.reply_to_message_id);
        if (tgRes && tgRes.ok) {
          this.recordDelivery(item.reply_key, tgRes.result.message_id);
          this.outbox = this.outbox.filter(x => x.reply_key !== item.reply_key);
          this.saveOutbox();
          log(`[OUTBOX_FLUSH_OK] Resposta de reply_to=${item.reply_to_message_id} entregue no Telegram: msg_id=${tgRes.result.message_id} (apos ${item.tentativas} falha(s)).`);
          this.aguardandoResposta.delete(String(item.reply_to_message_id));
          await this.relayar(item.payload);
        } else {
          item.tentativas++;
          item.ultimo_erro = JSON.stringify(tgRes).substring(0, 200);
          this.saveOutbox();
          break;
        }
      } catch (err) {
        item.tentativas++;
        item.ultimo_erro = String((err && err.message) || err);
        this.saveOutbox();
        break;
      }
    }
  }

  // RELAY E ALARME DE SILENCIO (10/09/2026)
  async relayar(texto) {
    if (!this.relayClient || !this.relayChatId) return false;
    try {
      const res = await this.relayClient.sendMessage(this.relayChatId, this.relayPrefixo + texto);
      if (res && res.ok) {
        log(`[RELAY_HERMES_OK] Resposta replicada no chat do Hermes (msg_id=${res.result.message_id}).`);
        return true;
      }
      log(`[RELAY_HERMES_FALHA] ${JSON.stringify(res).substring(0, 160)}`);
      return false;
    } catch (err) {
      log(`[RELAY_HERMES_FALHA] ${err.message}`);
      return false;
    }
  }

  marcarAguardandoResposta(packetId) {
    const m = String(packetId || '').match(/(\d+)\s*$/);
    if (!m) return;
    const msgId = m[1];
    if (!this.aguardandoResposta.has(msgId)) {
      this.aguardandoResposta.set(msgId, { packet_id: packetId, em: Date.now(), alertado: false });
    }
  }

  async verificarSilencio() {
    if (this.aguardandoResposta.size === 0) return;
    for (const [msgId, info] of [...this.aguardandoResposta]) {
      if (info.alertado) continue;
      if (Date.now() - info.em < CONFIG.silenceLimitMs) continue;
      info.alertado = true;
      const minutos = Math.round((Date.now() - info.em) / 60000);
      const aviso = `[SEM_RESPOSTA] O pacote ${info.packet_id} foi entregue ao ChatGPT ha ~${minutos} min e nenhuma resposta voltou. Causa tipica: o ChatGPT respondeu FORA do envelope [CHATGPT_REPLY_V1] ou a aba do ChatGPT esta fechada/travada.`;
      log(`[SILENCE_ALERT] ${info.packet_id} sem resposta ha ${minutos} min.`);
      try {
        if (this.client) await this.client.sendMessage(this.authorizedChatId, aviso);
      } catch (err) {
        log(`[SILENCE_ALERT_FALHA] ${err.message}`);
      }
      await this.relayar(aviso);
    }
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
        // Reenvia o que ficou preso na caixa de saida (falhas transitorias anteriores)
        await this.flushOutbox();

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
            this.saveDedupe();

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
          uncertain_packets_count: this.uncertainPackets.size,
          outbox_pending: this.outbox.length,
          aguardando_resposta: this.aguardandoResposta.size,
          relay_hermes_ativo: !!this.relayClient,
          uncertain_packets: Array.from(this.uncertainPackets.keys()),
          delivered_count: this.deliveredCount,
          running: this.running
        }));
        return;
      }

      // GET /packet -> Entrega 1 pacote sob Single-Flight Lock
      if (req.method === 'GET' && url.pathname === '/packet') {
        let packetToSend = null;
        // Zero requeue automático: transição para SEND_UNCERTAIN sem devolução cega à fila
        if (this.inFlightPacket && this.inFlightPacket._dispatchedAt && (Date.now() - this.inFlightPacket._dispatchedAt > 15000)) {
          log(`[SEND_UNCERTAIN] Pacote ${this.inFlightPacket.packet_id} retido por mais de 15s sem ACK. Marcado como SEND_UNCERTAIN sem requeue automático.`);
          this.uncertainPackets.set(this.inFlightPacket.packet_id, {
            packet: this.inFlightPacket,
            marked_at: new Date().toISOString(),
            status: 'SEND_UNCERTAIN'
          });
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
              this.marcarAguardandoResposta(data.packet_id);
            } else if (this.uncertainPackets.has(data.packet_id)) {
              log(`[RECONCILE_ACK] Pacote ${data.packet_id} reconciliado de SEND_UNCERTAIN para DELIVERED.`);
              this.uncertainPackets.delete(data.packet_id);
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

            // Envia ao Telegram (com caixa de saida: falha transitoria nao perde mais a resposta)
            let entregue = false;
            if (this.client) {
              try {
                const tgRes = await this.client.sendMessage(this.authorizedChatId, rawPayload, replyToMsgId);
                if (tgRes && tgRes.ok) {
                  const outMsgId = tgRes.result.message_id;
                  this.recordDelivery(replyKey, outMsgId);
                  entregue = true;
                  log(`[TELEGRAM_SEND_SUCCESS] Resposta entregue no Telegram: msg_id=${outMsgId}, reply_to=${replyToMsgId}`);
                  this.aguardandoResposta.delete(String(replyToMsgId));
                  await this.relayar(rawPayload);
                } else {
                  log(`Falha no envio ao Telegram: ${JSON.stringify(tgRes)}`);
                  this.enfileirarOutbox(replyKey, replyToMsgId, rawPayload, JSON.stringify(tgRes).substring(0, 200));
                }
              } catch (err) {
                log(`Falha transitoria no envio ao Telegram (retida na caixa de saida): ${err.message}`);
                this.enfileirarOutbox(replyKey, replyToMsgId, rawPayload, err.message);
              }
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true, delivered_to_telegram: entregue, queued_for_retry: !entregue }));
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
    // Watchdog periódico: marca como SEND_UNCERTAIN se expirar (> 15s) sem ACK, sem requeue automático
    setInterval(async () => {
      await this.verificarSilencio();
      if (this.inFlightPacket && this.inFlightPacket._dispatchedAt && (Date.now() - this.inFlightPacket._dispatchedAt > 15000)) {
        log(`[SEND_UNCERTAIN_WATCHDOG] Pacote ${this.inFlightPacket.packet_id} retido por mais de 15s sem ACK. Marcado como SEND_UNCERTAIN sem requeue.`);
        this.uncertainPackets.set(this.inFlightPacket.packet_id, {
          packet: this.inFlightPacket,
          marked_at: new Date().toISOString(),
          status: 'SEND_UNCERTAIN'
        });
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
