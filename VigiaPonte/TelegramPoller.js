const fs = require('fs');
const path = require('path');

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
          const msg = update.message;
          const reply = await this.router.processUpdate(update);
          if (reply && reply.chatId && reply.text) {
            const sendRes = await this.client.sendMessage(reply.chatId, reply.text);
            const outMsgId = (sendRes && sendRes.result) ? sendRes.result.message_id : null;
            const record = {
              timestamp: new Date().toISOString(),
              update_id: update.update_id,
              in_message_id: msg ? msg.message_id : null,
              in_timestamp: msg ? (msg.date ? new Date(msg.date * 1000).toISOString() : null) : null,
              in_text: msg ? msg.text : null,
              in_from: msg && msg.from ? (msg.from.username || msg.from.first_name || msg.from.id) : null,
              out_message_id: outMsgId,
              out_timestamp: (sendRes && sendRes.result && sendRes.result.date) ? new Date(sendRes.result.date * 1000).toISOString() : new Date().toISOString(),
              out_text: reply.text,
              origin: reply.text && reply.text.startsWith('ANTIGRAVITY >') ? 'ANTIGRAVITY' : (reply.text && reply.text.startsWith('VIGIA >') ? 'VIGIA' : (reply.final_responder || 'UNKNOWN')),
              responder: reply.final_responder || 'ANTIGRAVITY'
            };
            console.log(`[TELEGRAM_LIVE_AUDIT] IN_ID=${record.in_message_id} OUT_ID=${record.out_message_id} ORIGIN=${record.origin} TEXT="${(record.in_text || '').substring(0, 40)}"`);
            try {
              const auditFile = path.join(__dirname, 'telegram_live_audit.jsonl');
              fs.appendFileSync(auditFile, JSON.stringify(record) + '\n', 'utf8');
            } catch (e) {}
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
