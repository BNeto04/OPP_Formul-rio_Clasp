const http = require('http');
const path = require('path');
const SanitizadorSegredos = require('./SanitizadorSegredos');
const TelegramConfig = require('./TelegramConfig');
const TelegramClient = require('./TelegramClient');
const TelegramAllowlist = require('./TelegramAllowlist');
const ContextHub = require('./ContextHub');

class UnifiedHub {
  constructor(options = {}) {
    this.bridgeHost = options.bridgeHost || '127.0.0.1';
    this.bridgePort = options.bridgePort || 8765;
    this.contextHub = options.contextHub || new ContextHub();
    this.allowlist = options.allowlist || new TelegramAllowlist(TelegramConfig.getAllowlistPath());
    this.telegramClient = options.telegramClient || (TelegramConfig.getBotToken() ? new TelegramClient(TelegramConfig.getBotToken()) : null);
    this.seenEvents = new Set();
    this.seenResults = new Set();
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

  // 1. Ingestão Telegram: Telegram -> Sentinela/Hub -> Bridge -> ChatGPT
  async ingestTelegramMessage(message) {
    if (!message || !message.text) {
      return { success: false, reason: 'EMPTY_MESSAGE' };
    }

    const eventId = `EVT_TG_${message.message_id || Date.now()}_${Date.now()}`;
    if (this.seenEvents.has(eventId)) {
      return { success: true, action: 'DEDUPE_NO_OP', event_id: eventId };
    }
    this.seenEvents.add(eventId);

    // Atualiza ContextHub com a mensagem do proprietário
    const updateRes = this.contextHub.updateState({
      last_human_message_summary: SanitizadorSegredos.sanitizarTexto(message.text),
      last_call_id: eventId
    }, 'TELEGRAM_HUB');

    const state = this.contextHub.getState();
    const packetId = `PACKET_OWNER_MSG_${Date.now()}`;
    const payload = 
`[OWNER_MESSAGE_V1]
EVENT_ID: ${eventId}
ORIGIN_CHANNEL: TELEGRAM
MESSAGE_ID: ${message.message_id || 'UNKNOWN'}
FROM: ${SanitizadorSegredos.sanitizarTexto(message.from?.first_name || message.from?.username || 'OWNER')}
TEXT: ${SanitizadorSegredos.sanitizarTexto(message.text)}
CONTEXT_VERSION: ${state.context_version}
ACTIVE_CHATGPT_ENDPOINT: ${state.active_chatgpt_endpoint || 'DEFAULT'}
TIMESTAMP: ${new Date().toISOString()}
[/OWNER_MESSAGE_V1]`;

    let bridgeRes = null;
    try {
      bridgeRes = await this.queueBridgePacket({
        packet_id: packetId,
        payload: payload,
        type: 'OWNER_MESSAGE',
        source: 'SENTINELA_HUB_TELEGRAM'
      });
    } catch (err) {
      bridgeRes = { error: err.message };
    }

    return {
      success: true,
      event_id: eventId,
      packet_id: packetId,
      context_version: state.context_version,
      active_chatgpt_endpoint: state.active_chatgpt_endpoint,
      bridge_delivery: bridgeRes
    };
  }

  // 2. ChatGPT -> Telegram: Resposta conversacional correlacionada
  async routeChatGptResponseToTelegram(packet, customChatId = null) {
    if (!packet || !packet.payload) {
      return { success: false, reason: 'EMPTY_PAYLOAD' };
    }

    const eventId = packet.event_id || packet.reply_to_event_id || packet.call_id || `EVT_GPT_${Date.now()}`;
    if (this.seenEvents.has(eventId)) {
      return { success: true, action: 'DEDUPE_NO_OP', event_id: eventId };
    }
    this.seenEvents.add(eventId);

    const authorizedUser = this.allowlist.getAuthorizedUser();
    const targetChatId = customChatId || authorizedUser?.authorized_chat_id;
    if (!targetChatId || !this.telegramClient) {
      return { success: false, reason: 'TELEGRAM_NOT_CONFIGURED', event_id: eventId };
    }

    const cleanText = SanitizadorSegredos.sanitizarTexto(packet.payload);
    const formatted = `CHATGPT > ${cleanText}`;

    try {
      const res = await this.telegramClient.sendMessage(targetChatId, formatted, null);
      return {
        success: !!(res && res.ok),
        event_id: eventId,
        telegram_message_id: res?.result?.message_id || null,
        delivered: true
      };
    } catch (err) {
      return {
        success: false,
        error: SanitizadorSegredos.sanitizarTexto(err.message),
        event_id: eventId
      };
    }
  }

  // 3. Gravity -> RESULT -> Bridge -> ChatGPT + Telegram (Fan-out idempotente)
  async routeGravityResult(resultData, customChatId = null) {
    const callId = resultData.call_id || 'CALL_UNKNOWN';
    const taskId = resultData.task_id || 'TASK_UNKNOWN';
    const dedupeKey = `RESULT::${callId}::${taskId}`;

    if (this.seenResults.has(dedupeKey)) {
      return { success: true, action: 'DEDUPE_NO_OP', dedupe_key: dedupeKey };
    }
    this.seenResults.add(dedupeKey);

    const packetId = `PACKET_RESULT_${taskId}_${Date.now()}`;
    const payload = 
`[BRIDGE_TO_GPT_V1]
SPRINT_ID: ${resultData.sprint_id || 'SPRINT-PC-TRABALHO-SANEAMENTO-DONE-001'}
REPLY_TO_CALL_ID: ${callId}
TYPE: RESULT
TASK_ID: ${taskId}
ISSUE_NUMBER: ${resultData.issue_number || 53}
STATUS: ${resultData.status || 'DONE'}
SUMMARY: ${SanitizadorSegredos.sanitizarTexto(resultData.summary || 'Execução concluída')}
[/BRIDGE_TO_GPT_V1]`;

    // 3.1 Fan-out para Bridge (ChatGPT)
    let bridgeResult = null;
    try {
      bridgeResult = await this.queueBridgePacket({
        packet_id: packetId,
        payload: payload,
        type: 'RESULT',
        source: 'GRAVITY_EXECUTOR'
      });
    } catch (err) {
      bridgeResult = { error: err.message };
    }

    // 3.2 Fan-out para Telegram
    let telegramResult = null;
    const authorizedUser = this.allowlist.getAuthorizedUser();
    const targetChatId = customChatId || authorizedUser?.authorized_chat_id;
    if (targetChatId && this.telegramClient) {
      const tgText = `ANTIGRAVITY > RESULT ${taskId} (#${resultData.issue_number || 53}): ${SanitizadorSegredos.sanitizarTexto(resultData.summary || 'Concluído')}`;
      try {
        const tgRes = await this.telegramClient.sendMessage(targetChatId, tgText, null);
        telegramResult = {
          success: !!(tgRes && tgRes.ok),
          telegram_message_id: tgRes?.result?.message_id || null
        };
      } catch (err) {
        telegramResult = { error: SanitizadorSegredos.sanitizarTexto(err.message) };
      }
    }

    return {
      success: true,
      dedupe_key: dedupeKey,
      packet_id: packetId,
      bridge_dispatch: bridgeResult,
      telegram_dispatch: telegramResult
    };
  }

  // 4. Validação de Endpoint e Lease de Handoff
  validateChatGptEndpoint(endpointId) {
    return this.contextHub.isChatGPTEndpointActive(endpointId);
  }

  validateGravitySession(sessionId) {
    return this.contextHub.isGravitySessionActive(sessionId);
  }
}

module.exports = UnifiedHub;
