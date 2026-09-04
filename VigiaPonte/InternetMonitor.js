const http = require('http');
const https = require('https');
const net = require('net');

class InternetMonitor {
  constructor(options = {}) {
    this.timeoutMs = options.timeoutMs || 2500;
    this.customProbe = options.customProbe || null;
    this.state = 'INITIALIZING'; // 'UP', 'DOWN', 'INITIALIZING'
    this.downSince = null;
    this.lastChecked = null;
    this.lastEvidence = null;
    this.onStateChange = options.onStateChange || null;
  }

  checkTcpPort(host, port) {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      let resolved = false;

      const finish = (success, detail) => {
        if (!resolved) {
          resolved = true;
          socket.destroy();
          resolve({ host, port, success, detail });
        }
      };

      socket.setTimeout(this.timeoutMs);
      socket.once('connect', () => finish(true, 'CONNECTED'));
      socket.once('timeout', () => finish(false, 'TIMEOUT'));
      socket.once('error', (err) => finish(false, err.code || err.message));

      try {
        socket.connect(port, host);
      } catch (err) {
        finish(false, err.message);
      }
    });
  }

  checkHttpHead(urlStr) {
    return new Promise((resolve) => {
      try {
        const url = new URL(urlStr);
        const client = url.protocol === 'https:' ? https : http;
        const req = client.request(url, {
          method: 'HEAD',
          timeout: this.timeoutMs,
          headers: { 'User-Agent': 'Antigravity-Vigia-Internet-Probe' }
        }, (res) => {
          resolve({ url: urlStr, success: res.statusCode >= 200 && res.statusCode < 500, detail: `STATUS_${res.statusCode}` });
        });

        req.on('timeout', () => {
          req.destroy();
          resolve({ url: urlStr, success: false, detail: 'TIMEOUT' });
        });

        req.on('error', (err) => {
          resolve({ url: urlStr, success: false, detail: err.code || err.message });
        });

        req.end();
      } catch (e) {
        resolve({ url: urlStr, success: false, detail: e.message });
      }
    });
  }

  async testConnectivity() {
    if (this.customProbe) {
      return await this.customProbe();
    }

    // Múltiplos endpoints leves e independentes
    const probes = [
      this.checkTcpPort('1.1.1.1', 53),
      this.checkTcpPort('8.8.8.8', 53),
      this.checkHttpHead('https://api.github.com')
    ];

    const results = await Promise.all(probes);
    const successCount = results.filter(r => r.success).length;
    const isUp = successCount > 0;

    return {
      isUp,
      evidence: results
    };
  }

  async check() {
    const result = await this.testConnectivity();
    const now = new Date();
    const nowIso = now.toISOString();
    this.lastChecked = nowIso;
    this.lastEvidence = result.evidence;

    let event = null;

    if (result.isUp) {
      if (this.state === 'DOWN') {
        const durationMs = this.downSince ? (now.getTime() - new Date(this.downSince).getTime()) : 0;
        event = {
          type: 'INTERNET_UP',
          timestamp: nowIso,
          duration_ms: durationMs,
          down_since: this.downSince,
          evidence: result.evidence
        };
        this.downSince = null;
      } else if (this.state === 'INITIALIZING') {
        event = {
          type: 'INTERNET_INITIAL_UP',
          timestamp: nowIso,
          evidence: result.evidence
        };
      }
      this.state = 'UP';
    } else {
      if (this.state !== 'DOWN') {
        this.downSince = nowIso;
        event = {
          type: 'INTERNET_DOWN',
          timestamp: nowIso,
          evidence: result.evidence
        };
      }
      this.state = 'DOWN';
    }

    if (event && typeof this.onStateChange === 'function') {
      this.onStateChange(event);
    }

    return {
      state: this.state,
      event,
      evidence: result.evidence
    };
  }
}

module.exports = InternetMonitor;
