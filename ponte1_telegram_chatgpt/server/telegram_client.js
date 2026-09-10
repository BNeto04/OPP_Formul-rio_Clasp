const https = require('https');

/**
 * Cliente Telegram da Ponte 1 (endurecido em 10/09/2026 por falhas transitorias de rede).
 *
 * Mudancas (sem alterar o contrato com o daemon):
 * 1. Agent HTTPS com keep-alive (evita handshake TLS a cada envio).
 * 2. Timeout por tentativa configuravel (20s no envio / 25s no polling; antes: 15s fixo em tudo).
 * 3. RETRY com backoff para erros transitorios (TIMEOUT/ENOTFOUND/EAI_AGAIN/ECONNRESET/...).
 *    Antes: um unico TIMEOUT derrubava a resposta do ChatGPT sem chance de reenvio.
 * 4. Observacao de idempotencia: em caso de retry apos TIMEOUT a mensagem pode ter chegado
 *    na primeira tentativa; o log marca explicitamente SEND_RETRY para auditoria.
 */

const ERROS_TRANSITORIOS = [
  'TIMEOUT', 'ECONNRESET', 'ETIMEDOUT', 'EAI_AGAIN', 'ENOTFOUND',
  'ECONNREFUSED', 'EPIPE', 'SOCKET HANG UP', 'NETWORK'
];

const ESPERA_MS = [0, 1500, 4000];

class TelegramClient {
  constructor(token) {
    this.token = token;
    this.baseUrl = `https://api.telegram.org/bot${token}`;
    this.agent = new https.Agent({ keepAlive: true, maxSockets: 6 });
  }

  requestOnce(endpoint, data = {}, timeoutMs = 20000) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(data);
      const url = new URL(`${this.baseUrl}/${endpoint}`);

      const req = https.request({
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: 'POST',
        agent: this.agent,
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
      req.setTimeout(timeoutMs, () => {
        req.destroy();
        reject(new Error('TIMEOUT'));
      });
      req.write(postData);
      req.end();
    });
  }

  async request(endpoint, data = {}, opcoes = {}) {
    const tentativas = opcoes.tentativas || 3;
    const timeoutMs = opcoes.timeoutMs || 20000;
    let ultimoErro = null;

    for (let i = 0; i < tentativas; i++) {
      if (ESPERA_MS[i]) await new Promise(r => setTimeout(r, ESPERA_MS[i]));
      try {
        return await this.requestOnce(endpoint, data, timeoutMs);
      } catch (err) {
        ultimoErro = err;
        const texto = String((err && err.message) || err).toUpperCase();
        const transitorio = ERROS_TRANSITORIOS.some(t => texto.includes(t));
        if (!transitorio || i === tentativas - 1) throw err;
        console.log(`[TELEGRAM_CLIENT] Falha transitoria em ${endpoint} (${texto}); retry ${i + 2}/${tentativas}.`);
      }
    }
    throw ultimoErro;
  }

  async getUpdates(offset = 0, timeout = 5) {
    const res = await this.request('getUpdates', {
      offset: offset,
      timeout: timeout,
      allowed_updates: ['message']
    }, { tentativas: 2, timeoutMs: 25000 });
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
    return await this.request('sendMessage', payload, { tentativas: 3, timeoutMs: 20000 });
  }
}

module.exports = TelegramClient;
