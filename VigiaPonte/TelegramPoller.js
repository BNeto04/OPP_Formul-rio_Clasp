class TelegramPoller {
  constructor(options = {}) {
    this.client = options.client;
    this.router = options.router;
    this.lastUpdateId = 0;
    this.isPolling = false;
    this.pollIntervalMs = options.pollIntervalMs || 2000;
    this.timeoutSeconds = options.timeoutSeconds || 20;
    this.backoffMs = 5000;
  }

  async pollCycle() {
    if (!this.isPolling) return;

    try {
      const response = await this.client.getUpdates(this.lastUpdateId + 1, this.timeoutSeconds);
      if (response && response.ok && Array.isArray(response.result)) {
        for (const update of response.result) {
          this.lastUpdateId = Math.max(this.lastUpdateId, update.update_id);
          const reply = await this.router.processUpdate(update);
          if (reply && reply.chatId && reply.text) {
            await this.client.sendMessage(reply.chatId, reply.text);
          }
        }
      }
      this.backoffMs = 5000; // restaura backoff normal
    } catch (err) {
      // Backoff suave para tolerância a falhas de rede sem derrubar o Vigia
      this.backoffMs = Math.min(this.backoffMs * 1.5, 30000);
      await new Promise(r => setTimeout(r, this.backoffMs));
    }

    if (this.isPolling) {
      setTimeout(() => this.pollCycle(), this.pollIntervalMs);
    }
  }

  start() {
    if (this.isPolling) return; // Invariante: second_listener_created = false
    this.isPolling = true;
    this.pollCycle();
  }

  stop() {
    this.isPolling = false;
  }
}

module.exports = TelegramPoller;
