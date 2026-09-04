class TelegramAlertManager {
  constructor(options = {}) {
    this.client = options.client;
    this.allowlist = options.allowlist;
    this.cooldownMs = options.cooldownMs || 30000;
    this.lastAlertTimes = new Map();
    this.offlineQueue = [];
  }

  async sendAlert(eventType, messageText) {
    const now = Date.now();
    const lastTime = this.lastAlertTimes.get(eventType) || 0;

    // Deduplicação / Cooldown contra spam
    if (now - lastTime < this.cooldownMs) {
      return { sent: false, reason: 'SUPPRESSED_BY_COOLDOWN' };
    }

    if (!this.allowlist || !this.allowlist.isPaired()) {
      return { sent: false, reason: 'NO_PAIRING' };
    }

    const chatId = this.allowlist.getAuthorizedUser().authorized_chat_id;
    if (!chatId) {
      return { sent: false, reason: 'CHAT_ID_MISSING' };
    }

    try {
      this.lastAlertTimes.set(eventType, now);
      await this.client.sendMessage(chatId, messageText);
      return { sent: true };
    } catch (err) {
      // Se falhar (ex: Internet down), guarda na fila offline
      this.offlineQueue.push({ eventType, messageText, timestamp: new Date().toISOString() });
      if (this.offlineQueue.length > 20) this.offlineQueue.shift();
      return { sent: false, reason: 'ENQUEUED_OFFLINE', error: err.message };
    }
  }

  async flushOfflineQueue() {
    if (this.offlineQueue.length === 0 || !this.allowlist || !this.allowlist.isPaired()) {
      return;
    }

    const count = this.offlineQueue.length;
    const chatId = this.allowlist.getAuthorizedUser().authorized_chat_id;
    const summaryText = `📡 *RESUMO DE EVENTOS OFFLINE*\n\nDurante o período sem conectividade, ${count} evento(s) foram gerados:\n` +
      this.offlineQueue.map(e => `• [${e.timestamp.slice(11, 19)}] ${e.eventType}`).join('\n');

    this.offlineQueue = [];

    try {
      await this.client.sendMessage(chatId, summaryText);
    } catch (e) {}
  }
}

module.exports = TelegramAlertManager;
