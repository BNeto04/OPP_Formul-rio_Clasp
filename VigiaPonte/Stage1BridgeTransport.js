const http = require('http');
const path = require('path');
const fs = require('fs');

const projectRoot = 'C:\\Users\\Bneto04\\Documents\\Codex\\syntheon-gs-downplant-offline';
const TelegramConfig = require(path.join(projectRoot, 'VigiaPonte', 'TelegramConfig'));
const TelegramClient = require(path.join(projectRoot, 'VigiaPonte', 'TelegramClient'));
const TelegramAllowlist = require(path.join(projectRoot, 'VigiaPonte', 'TelegramAllowlist'));
const SanitizadorSegredos = require(path.join(projectRoot, 'VigiaPonte', 'SanitizadorSegredos'));
const ContextHub = require(path.join(projectRoot, 'VigiaPonte', 'ContextHub'));

const LOG_FILE = path.join(__dirname, 'stage1_transport.log');

function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${msg}`;
  console.log(line);
  try {
    fs.appendFileSync(LOG_FILE, line + '\n', 'utf8');
  } catch (e) {}
}

class Stage1BridgeTransport {
  constructor(options = {}) {
    this.bridgeHost = options.bridgeHost || '127.0.0.1';
    this.bridgePort = options.bridgePort || 8765;
    this.contextHub = options.contextHub || new ContextHub();
    this.allowlist = options.allowlist || new TelegramAllowlist(TelegramConfig.getAllowlistPath());
    this.telegramClient = options.telegramClient || (TelegramConfig.getBotToken() ? new TelegramClient(TelegramConfig.getBotToken()) : null);
    this.offsetFile = path.join(projectRoot, 'VigiaPonte', 'telegram_offset.json');
    this.seenTgMessages = new Set();
    this.seenOutboundCalls = new Set();
    this.seenTelegramDeliveries = new Set();
    this.ownerMessagesByEventId = new Map();
    this.lastOwnerMessageId = null;
    this.running = false;
  }

  getSavedOffset() {
    try {
      if (fs.existsSync(this.offsetFile)) {
        const d = JSON.parse(fs.readFileSync(this.offsetFile, 'utf8'));
        return d.offset || 0;
      }
    } catch (e) {}
    return 0;
  }

  saveOffset(offset) {
    try {
      fs.writeFileSync(this.offsetFile, JSON.stringify({ offset }), 'utf8');
    } catch (e) {}
  }

  queueBridgePacket(packet) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(packet);
      const req = http.request({
        hostname: this.bridgeHost,
        port: this.bridgePort,
        path: '/queue',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
      }, res => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            resolve({ raw: body });
          }
        });
      });
      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  waitBridgeWake(timeoutSeconds = 8) {
    return new Promise((resolve) => {
      const req = http.get(`http://${this.bridgeHost}:${this.bridgePort}/wait_wake?timeout=${timeoutSeconds}`, (res) => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(d);
            if (parsed && parsed.status === 'WAKE_TRIGGERED' && parsed.packet) {
              resolve(parsed.packet);
            } else {
              resolve(null);
            }
          } catch (e) {
            resolve(null);
          }
        });
      });
      req.on('error', () => resolve(null));
      req.setTimeout((timeoutSeconds + 2) * 1000, () => {
        req.destroy();
        resolve(null);
      });
    });
  }

  async checkTelegramUpdates(timeoutSeconds = 8) {
    if (!this.telegramClient) return [];
    const offset = this.getSavedOffset();
    try {
      const res = await this.telegramClient.getUpdates(offset + 1, timeoutSeconds);
      if (res && res.ok && Array.isArray(res.result) && res.result.length > 0) {
        return res.result;
      }
    } catch (e) {
      log(`Erro no polling do Telegram: ${e.message}`);
    }
    return [];
  }

  async processTelegramUpdate(upd) {
    this.saveOffset(Math.max(this.getSavedOffset(), upd.update_id));
    const msg = upd.message;
    if (!msg || !msg.text) return;

    const dedupeKey = `tg_msg_${msg.message_id}`;
    if (this.seenTgMessages.has(dedupeKey)) {
      log(`[DEDUPE_TG] Mensagem duplicada ignorada: message_id=${msg.message_id}`);
      return;
    }
    this.seenTgMessages.add(dedupeKey);

    const authorizedUser = this.allowlist.getAuthorizedUser();
    const authorizedChatId = authorizedUser?.authorized_chat_id;
    if (authorizedChatId && msg.chat.id !== authorizedChatId) {
      log(`[UNAUTHORIZED] Mensagem ignorada de chat não pareado: ${msg.chat.id}`);
      return;
    }

    const eventId = `EVT_TG_${msg.message_id}`;
    const packetId = `PACKET_OWNER_MSG_${msg.message_id}`;
    this.lastOwnerMessageId = msg.message_id;
    this.ownerMessagesByEventId.set(eventId, msg.message_id);

    const state = this.contextHub.getState();

    // Registra no ContextHub sem acionar Antigravity
    this.contextHub.updateState({
      last_human_message_summary: SanitizadorSegredos.sanitizarTexto(msg.text),
      last_call_id: eventId
    }, 'STAGE1_TELEGRAM_TRANSPORT');

    const payload = 
`[OWNER_MESSAGE_V1]
EVENT_ID: ${eventId}
ORIGIN_CHANNEL: TELEGRAM
MESSAGE_ID: ${msg.message_id}
FROM: ${SanitizadorSegredos.sanitizarTexto(msg.from?.first_name || 'OWNER')}
TEXT: ${SanitizadorSegredos.sanitizarTexto(msg.text)}
CONTEXT_VERSION: ${state.context_version}
ACTIVE_CHATGPT_ENDPOINT: ${state.active_chatgpt_endpoint || 'DEFAULT'}
TIMESTAMP: ${new Date().toISOString()}
[/OWNER_MESSAGE_V1]`;

    log(`[STAGE1_TG_TO_GPT] Ingerindo mensagem do Telegram -> Fila da Bridge: event_id=${eventId}, text="${msg.text.substring(0, 40)}"`);

    try {
      const qRes = await this.queueBridgePacket({
        packet_id: packetId,
        payload: payload,
        type: 'OWNER_MESSAGE',
        source: 'STAGE1_TELEGRAM_TRANSPORT'
      });
      if (qRes && qRes.status === 'DUPLICATE_NO_OP') {
        log(`[STAGE1_TG_DEDUPE_NO_OP] Mensagem duplicada ignorada na fila da Bridge: ${packetId}`);
      } else {
        log(`[STAGE1_BRIDGE_ENQUEUED] Pacote entregue à Bridge: ${packetId}, res=${JSON.stringify(qRes)}`);
      }
    } catch (err) {
      log(`[STAGE1_BRIDGE_ERROR] Falha ao enfileirar na Bridge: ${err.message}`);
    }
  }

  async processChatGPTOutbound(packet) {
    if (!packet || !packet.call_id) return;

    if (this.seenOutboundCalls.has(packet.call_id)) {
      log(`[DEDUPE_OUTBOUND] Chamada já processada ignorada: ${packet.call_id}`);
      return;
    }
    this.seenOutboundCalls.add(packet.call_id);

    log(`[STAGE1_GPT_OUTBOUND] Pacote recebido do ChatGPT: call_id=${packet.call_id}, type=${packet.type}`);

    // 1. O pacote é uma ordem técnica destinada ao Antigravity (ex: [BRIDGE_TO_ANTIGRAVITY_V1], CALL_ID de correção/tarefa)?
    const isTechnicalForAntigravity = packet.type === 'CALL' || 
                                     packet.type === 'TASK' || 
                                     packet.type === 'AUDIT' ||
                                     packet.type === 'OWNER_DIRECTIVE' ||
                                     (packet.call_id && (packet.call_id.startsWith('MESSAGE-53-FIX') || packet.call_id.startsWith('MESSAGE-53-STAGE1') || packet.call_id.startsWith('MESSAGE-53-RESTORE') || packet.call_id.startsWith('MESSAGE-53-START') || packet.call_id.includes('-ANTIGRAVITY-') || packet.call_id.includes('-EXEC-'))) ||
                                     (packet.payload && (packet.payload.includes('Consuma a correção') || packet.payload.includes('Consuma o comentário') || packet.payload.includes('Consuma a auditoria') || packet.payload.includes('Issue #53') || packet.payload.includes('[BRIDGE_TO_ANTIGRAVITY_V1]')));

    if (isTechnicalForAntigravity) {
      log(`[WAKE_ANTIGRAVITY] Chamada técnica para o Antigravity detectada (${packet.call_id}). NÃO enviando ao Telegram. Disparando despertar do Antigravity!`);
      // Encerra com código 0 para acionar o Reactive Wakeup imediato no IDE
      process.exit(0);
      return;
    }

    // 2. O pacote é uma resposta conversacional do ChatGPT destinada ao proprietário no Telegram
    const authorizedUser = this.allowlist.getAuthorizedUser();
    const targetChatId = authorizedUser?.authorized_chat_id;

    if (targetChatId && this.telegramClient && packet.payload) {
      // Extrai correlação se presente no payload
      let replyToMsgId = this.lastOwnerMessageId;
      if (typeof packet.payload === 'string') {
        const evtMatch = packet.payload.match(/REPLY_TO_EVENT_ID:\s*(EVT_TG_\d+)/i);
        if (evtMatch && this.ownerMessagesByEventId.has(evtMatch[1])) {
          replyToMsgId = this.ownerMessagesByEventId.get(evtMatch[1]);
        } else {
          const msgIdMatch = packet.payload.match(/REPLY_TO_MESSAGE_ID:\s*(\d+)/i);
          if (msgIdMatch) {
            replyToMsgId = parseInt(msgIdMatch[1], 10);
          }
        }
      }

      // Dedupe determinístico de entrega no Telegram (exactly-once)
      const deliveryDedupeKey = `${packet.call_id}_${replyToMsgId || 'DEFAULT'}`;
      if (this.seenTelegramDeliveries.has(deliveryDedupeKey)) {
        log(`[DEDUPE_TG_DELIVERY] Resposta para ${deliveryDedupeKey} já entregue ao Telegram. Ignorando.`);
        return;
      }
      this.seenTelegramDeliveries.add(deliveryDedupeKey);

      const cleanPayload = SanitizadorSegredos.sanitizarTexto(packet.payload);
      const tgText = `CHATGPT > ${cleanPayload}`;

      log(`[STAGE1_GPT_TO_TG] Enviando resposta conversacional do ChatGPT para o Telegram (reply_to=${replyToMsgId})...`);
      try {
        const res = await this.telegramClient.sendMessage(targetChatId, tgText, null, replyToMsgId);
        if (res && res.ok) {
          log(`[STAGE1_DELIVERED_TG] Resposta entregue no Telegram com sucesso: message_id=${res.result?.message_id}, reply_to=${replyToMsgId}`);
        } else {
          log(`[STAGE1_TG_SEND_FAIL] Resposta não entregue: ${JSON.stringify(res)}`);
        }
      } catch (err) {
        log(`[STAGE1_TG_ERROR] Erro ao enviar ao Telegram: ${err.message}`);
      }
    }
  }

  async start() {
    this.running = true;
    log('===============================================================');
    log('🚀 STAGE 1 DIRECT BRIDGE TRANSPORT INICIADO');
    log('Fluxo: Telegram <-> Ponte Local <-> ChatGPT Ativo (Sem Antigravity)');
    log('===============================================================');

    while (this.running) {
      try {
        const [bridgePacket, tgUpdates] = await Promise.all([
          this.waitBridgeWake(6),
          this.checkTelegramUpdates(6)
        ]);

        if (bridgePacket) {
          await this.processChatGPTOutbound(bridgePacket);
        }

        if (tgUpdates && tgUpdates.length > 0) {
          for (const upd of tgUpdates) {
            await this.processTelegramUpdate(upd);
          }
        }
      } catch (err) {
        log(`[LOOP_ERROR] Erro no ciclo de transporte: ${err.message}`);
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }

  stop() {
    this.running = false;
    log('Stage 1 Transport encerrado.');
  }
}

if (require.main === module) {
  const transport = new Stage1BridgeTransport();
  transport.start().catch(err => {
    log(`FATAL: ${err.stack}`);
    process.exit(1);
  });
}

module.exports = Stage1BridgeTransport;
