// VigiaPonte/Config.js
// Configurações operacionais conservadoras do Vigia da Ponte

const path = require('path');

module.exports = {
  // Identidade canônica
  ROLE: 'BRIDGE_LOCAL_WATCHDOG_ONLY',
  TARGET_NODE: 'DESKTOP-URNBR9C',
  VERSION: '1.0.0',

  // Limites e intervalos
  POLLING_INTERVAL_MS: 5000,      // Polling conservador (5 segundos)
  EVENT_COOLDOWN_MS: 30000,       // Cooldown de 30s por tipo de evento para evitar loops de alerta
  DEBOUNCE_DELAY_MS: 1500,        // Debounce para eventos consecutivos

  // Ollama
  OLLAMA_HOST: 'http://127.0.0.1:11434',
  OLLAMA_MODEL: 'gemma3:1b',
  OLLAMA_TIMEOUT_MS: 3500,        // Timeout estrito de 3.5s para fail-fast

  // Caminhos
  LOG_PATH: path.join(__dirname, 'vigia_ponte_events.log'),

  // Regras de autoridade e segurança
  AUTO_APPROVE_SENSITIVE: false,
  ALLOW_SECOND_WATCHER: false,
  FAIL_OPEN: true
};
