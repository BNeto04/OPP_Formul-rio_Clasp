const https = require('https');

class TelegramClient {
  constructor(token) {
    this.token = token;
    this.baseUrl = `https://api.telegram.org/bot${token}`;
  }

  request(endpoint, data = {}) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(data);
      const url = new URL(`${this.baseUrl}/${endpoint}`);

      const req = https.request({
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            resolve({ ok: false, error: 'JSON_PARSE_ERROR', raw: body });
          }
        });
      });

      req.on('error', reject);
      req.setTimeout(15000, () => {
        req.destroy();
        reject(new Error('TIMEOUT'));
      });
      req.write(postData);
      req.end();
    });
  }

  async getUpdates(offset = 0, timeout = 5) {
    const res = await this.request('getUpdates', {
      offset: offset,
      timeout: timeout,
      allowed_updates: ['message']
    });
    return res;
  }

  async sendMessage(chatId, text, replyToMessageId = null) {
    const payload = {
      chat_id: chatId,
      text: text
    };
    if (replyToMessageId) {
      payload.reply_to_message_id = replyToMessageId;
    }
    return await this.request('sendMessage', payload);
  }
}

module.exports = TelegramClient;
