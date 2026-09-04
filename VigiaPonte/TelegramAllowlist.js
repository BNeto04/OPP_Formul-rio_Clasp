const fs = require('fs');

class TelegramAllowlist {
  constructor(filePath) {
    this.filePath = filePath;
    this.data = this.load();
  }

  load() {
    if (fs.existsSync(this.filePath)) {
      try {
        return JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
      } catch (e) {
        return { authorized_user_id: null, authorized_chat_id: null, paired_at: null };
      }
    }
    return { authorized_user_id: null, authorized_chat_id: null, paired_at: null };
  }

  save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf8');
      return true;
    } catch (e) {
      return false;
    }
  }

  isPaired() {
    return !!(this.data && this.data.authorized_user_id);
  }

  getAuthorizedUser() {
    return this.data;
  }

  pairOwner(userId, chatId, username = '') {
    this.data = {
      authorized_user_id: userId,
      authorized_chat_id: chatId,
      username: username || '',
      paired_at: new Date().toISOString()
    };
    this.save();
    return this.data;
  }

  isAuthorized(userId) {
    if (!this.isPaired()) return false;
    return String(this.data.authorized_user_id) === String(userId);
  }
}

module.exports = TelegramAllowlist;
