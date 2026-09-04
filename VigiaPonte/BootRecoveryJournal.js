const fs = require('fs');
const path = require('path');
const SanitizadorSegredos = require('./SanitizadorSegredos');

class BootRecoveryJournal {
  constructor(options = {}) {
    this.journalPath = options.journalPath || path.join(__dirname, 'boot_recovery_journal.log');
    this.sanitizer = SanitizadorSegredos;
  }

  recordEntry(entry = {}) {
    const record = {
      timestamp: entry.timestamp || new Date().toISOString(),
      boot_session_id: entry.boot_session_id || 'UNKNOWN_SESSION',
      internet_state: entry.internet_state || 'UNKNOWN',
      process_state_before: entry.process_state_before || {},
      process_state_after: entry.process_state_after || {},
      action: entry.action || 'NO_OP',
      reason: entry.reason || 'UNSPECIFIED',
      result: entry.result || 'OK',
      retry_count: entry.retry_count || 0,
      owner_decision_required: entry.owner_decision_required === true
    };

    const serialized = JSON.stringify(record);
    const sanitizedLine = this.sanitizer.sanitizarTexto(serialized);

    fs.appendFileSync(this.journalPath, sanitizedLine + '\n', 'utf8');
    return JSON.parse(sanitizedLine);
  }

  readEntries(limit = 50) {
    if (!fs.existsSync(this.journalPath)) return [];
    const lines = fs.readFileSync(this.journalPath, 'utf8')
      .trim()
      .split('\n')
      .filter(l => l.length > 0);
    return lines.slice(-limit).map(l => {
      try {
        return JSON.parse(l);
      } catch (e) {
        return { raw: l };
      }
    });
  }
}

module.exports = BootRecoveryJournal;
