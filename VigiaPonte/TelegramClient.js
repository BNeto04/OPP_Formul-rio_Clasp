const https = require('https');
const SanitizadorSegredos = require('./SanitizadorSegredos');

class TelegramClient {
  constructor(token) {
    this.token = token;
  }

  request(methodPath, postData = null) {
    return new Promise((resolve, reject) => {
      if (!this.token) {
        return reject(new Error('TOKEN_MISSING: Token do Telegram não configurado.'));
      }

      const payload = postData ? JSON.stringify(postData) : null;
      const options = {
        hostname: 'api.telegram.org',
        path: `/bot${this.token}/${methodPath}`,
        method: payload ? 'POST' : 'GET',
        timeout: 35000,
        headers: {
          'User-Agent': 'Syntheon-Vigia-Telegram-Client'
        }
      };

      if (payload) {
        options.headers['Content-Type'] = 'application/json';
        options.headers['Content-Length'] = Buffer.byteLength(payload);
      }

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            resolve({ statusCode: res.statusCode, data });
          } catch (e) {
            reject(new Error(`PARSE_ERROR: Falha ao interpretar JSON: ${SanitizadorSegredos.sanitizarTexto(body)}`));
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('TIMEOUT_ERROR: Tempo esgotado na chamada ao Telegram.'));
      });

      req.on('error', (err) => {
        reject(new Error(`NETWORK_ERROR: ${SanitizadorSegredos.sanitizarTexto(err.message)}`));
      });

      if (payload) req.write(payload);
      req.end();
    });
  }

  async getMe() {
    const res = await this.request('getMe');
    return res.data;
  }

  async getUpdates(offset = 0, timeout = 20) {
    const res = await this.request(`getUpdates?offset=${offset}&timeout=${timeout}`);
    return res.data;
  }

  async sendMessage(chatId, text, parseMode = 'Markdown', replyToMessageId = null) {
    const sanitizedText = SanitizadorSegredos.sanitizarTexto(text);
    let res = null;
    const extra = {};
    if (replyToMessageId) {
      extra.reply_to_message_id = replyToMessageId;
    }
    try {
      res = await this.request('sendMessage', {
        chat_id: chatId,
        text: sanitizedText,
        ...(parseMode ? { parse_mode: parseMode } : {}),
        ...extra
      });
    } catch (e) {
      if (parseMode) {
        res = await this.request('sendMessage', {
          chat_id: chatId,
          text: sanitizedText,
          ...extra
        });
        return res ? res.data : null;
      }
      throw e;
    }

    if (res && res.data && !res.data.ok && parseMode) {
      const retryRes = await this.request('sendMessage', {
        chat_id: chatId,
        text: sanitizedText,
        ...extra
      });
      return retryRes ? retryRes.data : null;
    }

    return res ? res.data : null;
  }
}

module.exports = TelegramClient;
