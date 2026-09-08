/**
 * Syntheon Agentic Layer - Idempotent Router Start Script
 */

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

async function isRouterAlive() {
  return new Promise(resolve => {
    const req = http.get('http://127.0.0.1:4000/health', { timeout: 1000 }, res => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

async function start() {
  if (await isRouterAlive()) {
    console.log('[START_ROUTER] IDEMPOTENTE: Router ja esta em execucao na porta 4000.');
    return { ok: true, status: 'ALREADY_RUNNING' };
  }

  const serverScript = path.join(__dirname, '..', 'router', 'router_server.js');
  const logDir = path.join(__dirname, '..', 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  const logFile = path.join(logDir, 'router_stdout.log');
  const out = fs.openSync(logFile, 'a');

  const child = spawn(process.execPath, [serverScript], {
    detached: true,
    stdio: ['ignore', out, out],
    windowsHide: true
  });
  child.unref();

  // Aguarda ate 3 segundos pelo boot
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 100));
    if (await isRouterAlive()) {
      console.log(`[START_ROUTER] Router iniciado com sucesso (PID: ${child.pid}) em http://127.0.0.1:4000`);
      return { ok: true, status: 'STARTED', pid: child.pid };
    }
  }

  console.error('[START_ROUTER] Falha ao iniciar router dentro do tempo limite.');
  process.exit(1);
}

if (require.main === module) {
  start();
}

module.exports = { start, isRouterAlive };