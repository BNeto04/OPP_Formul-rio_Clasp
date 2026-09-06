const http = require('http');
const fs = require('fs');
const path = require('path');
const TelegramConfig = require('./TelegramConfig');
const TelegramClient = require('./TelegramClient');
const TelegramAllowlist = require('./TelegramAllowlist');
const SanitizadorSegredos = require('./SanitizadorSegredos');

class UnifiedReactiveWakeListener {
  constructor(options = {}) {
    this.bridgePort = options.bridgePort || 8765;
    this.bridgeHost = options.bridgeHost || '127.0.0.1';
    this.offsetFile = options.offsetFile || path.join(__dirname, 'telegram_offset.json');
    this.allowlist = options.allowlist || new TelegramAllowlist(TelegramConfig.getAllowlistPath());
    this.client = options.client || (TelegramConfig.getBotToken() ? new TelegramClient(TelegramConfig.getBotToken()) : null);
    this.seenEvents = new Set();
    this.inFlightLock = false;
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

  async waitBridgeWake(timeoutSeconds = 5) {
    return new Promise((resolve) => {
      const req = http.get(`http://${this.bridgeHost}:${this.bridgePort}/wait_wake?timeout=${timeoutSeconds}`, (res) => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(d);
            if (parsed && parsed.status === 'WAKE_TRIGGERED' && parsed.packet) {
              resolve({ type: 'CHATGPT_BRIDGE', packet: parsed.packet });
            } else {
              resolve(null);
            }
          } catch (e) {
            resolve(null);
          }
        });
      });
      req.on('error', () => resolve(null));
      req.setTimeout(timeoutSeconds * 1000 + 2000, () => {
        req.destroy();
        resolve(null);
      });
    });
  }

  async waitTelegram(timeoutSeconds = 5) {
    if (!this.client) return null;
    const offset = this.getSavedOffset();
    try {
      const res = await this.client.getUpdates(offset + 1, timeoutSeconds);
      if (res && res.ok && Array.isArray(res.result) && res.result.length > 0) {
        return { type: 'TELEGRAM', updates: res.result };
      }
    } catch (e) {}
    return null;
  }

  async listenOnce(maxWaitSeconds = 60) {
    if (this.inFlightLock) {
      return { status: 'LOCKED', reason: 'SINGLE_FLIGHT_BUSY' };
    }

    const startTime = Date.now();
    const deadline = startTime + (maxWaitSeconds * 1000);
    const authorizedUser = this.allowlist.getAuthorizedUser();
    const authorizedChatId = authorizedUser ? authorizedUser.authorized_chat_id : null;

    while (Date.now() < deadline) {
      // Monitora ambos os canais concorrentemente em fatias curtas
      const [bridgeRes, tgRes] = await Promise.all([
        this.waitBridgeWake(4),
        this.waitTelegram(4)
      ]);

      // 1. Evento de Bridge (ChatGPT)
      if (bridgeRes && bridgeRes.packet) {
        const p = bridgeRes.packet;
        const eventId = p.call_id || p.packet_id;
        if (this.seenEvents.has(eventId)) {
          continue; // Dedupe
        }
        this.seenEvents.add(eventId);

        return {
          status: 'EVENT_RECEIVED',
          source_channel: 'CHATGPT_BRIDGE',
          call_id: p.call_id,
          packet_id: p.packet_id,
          type: p.type,
          payload: p.payload,
          timestamp: new Date().toISOString(),
          sanitized_preview: SanitizadorSegredos.sanitizarTexto(String(p.payload || '')).substring(0, 100)
        };
      }

      // 2. Evento do Telegram
      if (tgRes && tgRes.updates.length > 0) {
        for (const upd of tgRes.updates) {
          const curOffset = this.getSavedOffset();
          this.saveOffset(Math.max(curOffset, upd.update_id));

          const msg = upd.message;
          if (msg && msg.from && (!authorizedChatId || msg.chat.id === authorizedChatId)) {
            const eventId = `tg_${msg.message_id}`;
            if (this.seenEvents.has(eventId)) {
              continue; // Dedupe
            }
            this.seenEvents.add(eventId);

            return {
              status: 'EVENT_RECEIVED',
              source_channel: 'TELEGRAM',
              chat_id: msg.chat.id,
              message_id: msg.message_id,
              from: msg.from.first_name || msg.from.username || msg.from.id,
              text: msg.text,
              date: msg.date,
              timestamp: new Date().toISOString(),
              sanitized_preview: SanitizadorSegredos.sanitizarTexto(String(msg.text || '')).substring(0, 100)
            };
          }
        }
      }
    }

    return { status: 'TIMEOUT', timestamp: new Date().toISOString() };
  }
}

module.exports = UnifiedReactiveWakeListener;
