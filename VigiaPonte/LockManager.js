const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class LockManager {
  constructor(options = {}) {
    this.lockFilePath = options.lockFilePath || path.join(__dirname, 'vigia.lock');
    this.currentSessionId = options.sessionId || `session_${Date.now()}_${process.pid}`;
    this.isLockedBySelf = false;
  }

  isProcessAlive(pid) {
    if (!pid || isNaN(pid)) return false;
    if (pid === process.pid) return true;
    try {
      if (process.platform === 'win32') {
        const out = execSync(`tasklist /FI "PID eq ${pid}" /FI "IMAGENAME eq node.exe" /NH`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
        return out.toLowerCase().includes('node.exe') && out.includes(String(pid));
      } else {
        process.kill(pid, 0);
        return true;
      }
    } catch (e) {
      return false;
    }
  }

  acquireLock() {
    if (fs.existsSync(this.lockFilePath)) {
      try {
        const content = fs.readFileSync(this.lockFilePath, 'utf8');
        const lockData = JSON.parse(content);
        const existingPid = lockData.pid;

        if (this.isProcessAlive(existingPid)) {
          return {
            acquired: false,
            reason: 'ALREADY_RUNNING',
            activePid: existingPid,
            session: lockData.sessionId,
            timestamp: lockData.timestamp
          };
        }

        // Lock órfão detectado: processo anterior não está mais vivo
        const orphanPid = existingPid;
        const newLockData = {
          pid: process.pid,
          sessionId: this.currentSessionId,
          timestamp: new Date().toISOString(),
          recoveredOrphanFromPid: orphanPid
        };
        fs.writeFileSync(this.lockFilePath, JSON.stringify(newLockData, null, 2), 'utf8');
        this.isLockedBySelf = true;
        return {
          acquired: true,
          recoveredOrphan: true,
          previousPid: orphanPid,
          sessionId: this.currentSessionId
        };
      } catch (err) {
        const newLockData = {
          pid: process.pid,
          sessionId: this.currentSessionId,
          timestamp: new Date().toISOString(),
          corruptedLockRecovered: true
        };
        fs.writeFileSync(this.lockFilePath, JSON.stringify(newLockData, null, 2), 'utf8');
        this.isLockedBySelf = true;
        return {
          acquired: true,
          recoveredOrphan: true,
          corrupted: true,
          sessionId: this.currentSessionId
        };
      }
    }

    const lockData = {
      pid: process.pid,
      sessionId: this.currentSessionId,
      timestamp: new Date().toISOString()
    };
    fs.writeFileSync(this.lockFilePath, JSON.stringify(lockData, null, 2), 'utf8');
    this.isLockedBySelf = true;
    return {
      acquired: true,
      recoveredOrphan: false,
      sessionId: this.currentSessionId
    };
  }

  releaseLock() {
    if (this.isLockedBySelf && fs.existsSync(this.lockFilePath)) {
      try {
        const content = fs.readFileSync(this.lockFilePath, 'utf8');
        const lockData = JSON.parse(content);
        if (lockData.pid === process.pid) {
          fs.unlinkSync(this.lockFilePath);
          this.isLockedBySelf = false;
          return true;
        }
      } catch (e) {}
    }
    return false;
  }
}

module.exports = LockManager;
