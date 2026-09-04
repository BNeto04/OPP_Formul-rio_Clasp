const fs = require('fs');
const path = require('path');

class TelegramConfig {
  static getBotToken() {
    // 1. Variável de ambiente
    if (process.env.TELEGRAM_BOT_TOKEN) {
      return process.env.TELEGRAM_BOT_TOKEN.trim();
    }

    // 2. Arquivo seguro em AppData fora do repositório
    const appDataToken = 'C:\\Users\\Bneto04\\AppData\\Local\\SyntheonVigia\\telegram.token';
    if (fs.existsSync(appDataToken)) {
      try {
        const token = fs.readFileSync(appDataToken, 'utf8').trim();
        if (token.length > 20) return token;
      } catch (e) {}
    }

    // 3. Arquivo local no diretório do Vigia (se existir e for ignorado)
    const localToken = path.join(__dirname, '.telegram_token');
    if (fs.existsSync(localToken)) {
      try {
        const token = fs.readFileSync(localToken, 'utf8').trim();
        if (token.length > 20) return token;
      } catch (e) {}
    }

    return null;
  }

  static getAllowlistPath() {
    const appDataDir = 'C:\\Users\\Bneto04\\AppData\\Local\\SyntheonVigia';
    if (!fs.existsSync(appDataDir)) {
      try { fs.mkdirSync(appDataDir, { recursive: true }); } catch (e) {}
    }
    return path.join(appDataDir, 'allowlist.json');
  }

  static getExpectedUsername() {
    return 'sentinela_alert_bot';
  }
}

module.exports = TelegramConfig;
