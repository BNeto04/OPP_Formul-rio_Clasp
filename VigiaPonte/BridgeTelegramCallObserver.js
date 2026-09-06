const SanitizadorSegredos = require('./SanitizadorSegredos');

class BridgeTelegramCallObserver {
  constructor(options = {}) {
    this.client = options.client || null;
    this.allowlist = options.allowlist || null;
    this.recoveryManager = options.recoveryManager || null;
    this._bridgeAvailable = options.bridgeAvailable !== undefined ? options.bridgeAvailable : true;
    this.seenCalls = new Set();
    this.seenResults = new Set();
    this.history = [];
  }

  isBridgeAvailable() {
    if (typeof this._bridgeAvailable === 'function') {
      return this._bridgeAvailable();
    }
    return !!this._bridgeAvailable;
  }

  setBridgeAvailable(val) {
    this._bridgeAvailable = val;
  }

  isAntigravityAvailable() {
    if (this.recoveryManager && typeof this.recoveryManager.inventoryState === 'function') {
      const state = this.recoveryManager.inventoryState();
      return !!(state && state.antigravity && state.antigravity.running);
    }
    return true;
  }

  getAuthorizedChatId() {
    if (!this.allowlist) return null;
    if (typeof this.allowlist.isPaired === 'function' && !this.allowlist.isPaired()) return null;
    if (typeof this.allowlist.getAuthorizedUser === 'function') {
      const u = this.allowlist.getAuthorizedUser();
      return u ? u.authorized_chat_id : null;
    }
    return null;
  }

  async sendTelegram(text) {
    const chatId = this.getAuthorizedChatId();
    if (!chatId || !this.client || typeof this.client.sendMessage !== 'function') {
      return { sent: false, reason: 'NO_RECIPIENT_OR_CLIENT' };
    }
    const sanitized = SanitizadorSegredos.sanitizarTexto(text);
    try {
      const res = await this.client.sendMessage(chatId, sanitized);
      return { sent: true, res };
    } catch (err) {
      return { sent: false, error: err.message };
    }
  }

  async onCallReceived(callPacket) {
    if (!callPacket || !callPacket.call_id) {
      return { success: false, reason: 'INVALID_PACKET' };
    }

    const callId = callPacket.call_id;
    const sprintId = callPacket.sprint_id || 'SPRINT-UNKNOWN';

    // 16. Dedupe estrito: uma CALL gera no máximo um ACK operacional
    if (this.seenCalls.has(callId)) {
      return {
        success: true,
        call_id: callId,
        action: 'DEDUPE_NO_OP',
        duplicate: true
      };
    }
    this.seenCalls.add(callId);

    const bridgeOnline = this.isBridgeAvailable();
    const antigravityOnline = this.isAntigravityAvailable();

    // 14. Falha factual (Bridge ou Antigravity offline ao chegar CALL)
    if (!bridgeOnline || !antigravityOnline) {
      const routeReason = !antigravityOnline ? 'ANTIGRAVITY_OFFLINE' : 'BRIDGE_OFFLINE';
      const fallbackText = 'VIGIA/FALLBACK > CALL ' + callId + ' não chegou/Antigravity não respondeu; estado factual: ' + routeReason;
      await this.sendTelegram(fallbackText);

      const entry = {
        timestamp: new Date().toISOString(),
        call_id: callId,
        sprint_id: sprintId,
        route_type: 'VIGIA_FALLBACK',
        route_reason: routeReason,
        final_responder: 'VIGIA',
        text: fallbackText
      };
      this.history.push(entry);
      return {
        success: true,
        call_id: callId,
        route_type: 'VIGIA_FALLBACK',
        route_reason: routeReason,
        final_responder: 'VIGIA',
        text: fallbackText
      };
    }

    // ISOLAMENTO ESTRITO: em circuito saudavel, Antigravity e Vigia nao enviam
    // mensagens conversacionais ao Telegram. O canal humano e exclusivo do ChatGPT.
    // Antigravity executa a CALL silenciosamente e publica RESULT no GitHub.
    // Vigia permanece HEALTHY_SILENT.

    const entry = {
      timestamp: new Date().toISOString(),
      call_id: callId,
      sprint_id: sprintId,
      route_type: 'ANTIGRAVITY_CALL_ACK',
      final_responder: 'ANTIGRAVITY',
      vigia_supervision: 'HEALTHY',
      ag_text: agAckText,
      vigia_text: vigiaHealthText
    };
    this.history.push(entry);

    return {
      success: true,
      call_id: callId,
      route_type: 'ANTIGRAVITY_CALL_ACK',
      final_responder: 'ANTIGRAVITY',
      vigia_supervision: 'HEALTHY',
      ag_text: agAckText,
      vigia_text: vigiaHealthText
    };
  }

  async onResultDelivered(resultPacket) {
    if (!resultPacket || !resultPacket.call_id) {
      return { success: false, reason: 'INVALID_PACKET' };
    }

    const callId = resultPacket.call_id;
    if (this.seenResults.has(callId)) {
      return {
        success: true,
        call_id: callId,
        action: 'DEDUPE_NO_OP',
        duplicate: true
      };
    }
    this.seenResults.add(callId);

    // 13. RESULT da CALL -> Telegram mostra ANTIGRAVITY > ENTREGUE/RESULT correlacionado
    const resultText = 'ANTIGRAVITY > ENTREGUE/RESULT: CALL ' + callId + ' concluída.';
    await this.sendTelegram(resultText);

    const entry = {
      timestamp: new Date().toISOString(),
      call_id: callId,
      route_type: 'ANTIGRAVITY_RESULT',
      final_responder: 'ANTIGRAVITY',
      text: resultText
    };
    this.history.push(entry);

    return {
      success: true,
      call_id: callId,
      action: 'RESULT_DELIVERED',
      text: resultText
    };
  }
}

module.exports = BridgeTelegramCallObserver;
