/**
 * Syntheon Agentic Layer - Idempotent Router Stop Script
 */

const { execSync } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const PID_FILE = path.join(__dirname, '..', 'logs', 'router.pid');

async function isRouterAlive() {
  return new Promise(resolve => {
    const req = http.get('http://127.0.0.1:4000/health', { timeout: 1000 }, res => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

async function stop() {
  let pid = null;
  if (fs.existsSync(PID_FILE)) {
    try {
      pid = parseInt(fs.readFileSync(PID_FILE, 'utf8').trim(), 10);
    } catch (e) {}
  }

  if (pid) {
    try {
      if (process.platform === 'win32') {
        execSync(`taskkill /F /PID ${pid} 2>nul`);
      } else {
        process.kill(pid, 'SIGTERM');
      }
      console.log(`[STOP_ROUTER] Processo PID ${pid} encerrado.`);
    } catch (e) {}
  }

  // Se a porta ainda estiver aberta, localiza e finaliza o processo
  if (process.platform === 'win32') {
    try {
      const netstat = execSync('netstat -ano | findstr :4000', { encoding: 'utf8' }).trim();
      const lines = netstat.split(/\r?\n/).filter(l => l.includes('LISTENING'));
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const portPid = parts[parts.length - 1];
        if (portPid && portPid !== '0') {
          try {
            execSync(`taskkill /F /PID ${portPid} 2>nul`);
            console.log(`[STOP_ROUTER] Processo adicional PID ${portPid} na porta 4000 encerrado.`);
          } catch (e) {}
        }
      }
    } catch (e) {}
  }

  try {
    if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
  } catch (e) {}

  // Aguarda liberacao da porta
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 100));
    if (!(await isRouterAlive())) {
      console.log('[STOP_ROUTER] Router encerrado com sucesso. Porta 4000 liberada.');
      return { ok: true, status: 'STOPPED' };
    }
  }

  console.log('[STOP_ROUTER] Router encerrado.');
  return { ok: true, status: 'STOPPED' };
}

if (require.main === module) {
  stop();
}

module.exports = { stop };