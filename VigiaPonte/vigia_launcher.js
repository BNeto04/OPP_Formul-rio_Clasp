const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const LockManager = require('./LockManager');

const MAX_RESTARTS = 5;
const BASE_BACKOFF_MS = 5000;
let restartCount = 0;
let lastRestartTime = 0;

function logLauncher(msg) {
  const line = `[${new Date().toISOString()}] [VIGIA_LAUNCHER] ${msg}\n`;
  try {
    fs.appendFileSync(path.join(__dirname, 'launcher.log'), line, 'utf8');
  } catch (e) {}
}

function checkExistingInstance() {
  const lm = new LockManager();
  if (fs.existsSync(lm.lockFilePath)) {
    try {
      const lockData = JSON.parse(fs.readFileSync(lm.lockFilePath, 'utf8'));
      if (lm.isProcessAlive(lockData.pid)) {
        logLauncher(`Instância ativa já detectada no host (PID: ${lockData.pid}). Launcher abortando para garantir single-instance.`);
        return true;
      }
    } catch (e) {}
  }
  return false;
}

if (checkExistingInstance()) {
  process.exit(0);
}

function startVigiaProcess() {
  logLauncher(`Iniciando VigiaBootEngine (tentativa ${restartCount + 1}/${MAX_RESTARTS})...`);

  const child = spawn('node', [path.join(__dirname, 'VigiaBootEngine.js')], {
    cwd: __dirname,
    stdio: 'ignore',
    windowsHide: true
  });

  child.on('exit', (code, signal) => {
    logLauncher(`VigiaBootEngine encerrou com código ${code}, sinal ${signal}`);

    // Se o processo encerrou com 0 (saída limpa ou instância duplicada prevenida), encerra launcher
    if (code === 0) {
      logLauncher(`Processo encerrou normalmente (código 0). Finalizando launcher.`);
      process.exit(0);
    }

    const now = Date.now();

    // Se o processo rodou por mais de 5 minutos, reseta contador de falhas
    if (now - lastRestartTime > 300000) {
      restartCount = 0;
    }

    lastRestartTime = now;
    restartCount++;

    if (restartCount > MAX_RESTARTS) {
      logLauncher(`CRÍTICO: Limite de ${MAX_RESTARTS} reinícios atingido. Parando para evitar crash loop.`);
      process.exit(1);
    }

    const delay = BASE_BACKOFF_MS * Math.pow(2, restartCount - 1);
    logLauncher(`Aguardando backoff de ${delay}ms antes de reiniciar...`);
    setTimeout(startVigiaProcess, delay);
  });

  child.on('error', (err) => {
    logLauncher(`Erro no spawn do Vigia: ${err.message}`);
  });
}

startVigiaProcess();

