// Testes/TestExtensionBackgroundNoWindow.js
// Regressao factual: Service Worker Background sem window e compativel com MV3

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('=== TESTE REGRESSIVO: BACKGROUND SEM WINDOW (MV3 COMPLIANCE) ===');

// 1. Analise estatica: garantir zero referencias a 'window' nos backgrounds
console.log('\n[G1] Varredura estatica por ocorrencias de window em backgrounds...');
const bgFiles = [
  path.resolve(__dirname, '../extension/background.js'),
  path.resolve(__dirname, '../extension_outbound/background.js')
];

bgFiles.forEach((f) => {
  assert(fs.existsSync(f), 'Arquivo deve existir: ' + f);
  const content = fs.readFileSync(f, 'utf8');
  const linesOfFile = content.split('\n');
  linesOfFile.forEach((line, idx) => {
    assert(!/\bwindow\b/.test(line), 'Referencia a window proibida em background! Arquivo: ' + path.basename(f) + ' linha ' + (idx + 1) + ': ' + line.trim());
  });
  console.log('PASS: Zero referencias a window em ' + path.basename(f));
});

// 2. Execucao dinamica em VM isolada sem 'window' (Service Worker Environment)
console.log('\n[G2] Execucao em sandbox VM isolado simulando Service Worker (window is undefined)...');

function createServiceWorkerContext() {
  const logs = [];
  const store = {};
  const listeners = {};

  const context = {
    console: {
      log: (...args) => logs.push('[LOG] ' + args.join(' ')),
      warn: (...args) => logs.push('[WARN] ' + args.join(' ')),
      error: (...args) => logs.push('[ERROR] ' + args.join(' '))
    },
    navigator: {
      onLine: true
    },
    fetch: async (url, opts) => ({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ status: 'OK', packet_id: 'TEST_PKT' }),
      json: async () => ({ status: 'OK', packet_id: 'TEST_PKT' })
    }),
    setInterval: (fn, ms) => {},
    clearInterval: (id) => {},
    setTimeout: (fn, ms) => fn(),
    clearTimeout: (id) => {},
    chrome: {
      storage: {
        local: {
          get: (keys, cb) => cb(typeof keys === 'object' && !Array.isArray(keys) ? keys : store),
          set: (obj, cb) => { Object.assign(store, obj); if (cb) cb(); }
        }
      },
      tabs: {
        query: (q, cb) => cb([{ id: 101, url: 'https://chatgpt.com', active: true }]),
        sendMessage: async (tabId, msg) => ({ success: true, status: 'DELIVERED' })
      },
      action: {
        setBadgeText: () => {},
        setBadgeBackgroundColor: () => {}
      },
      runtime: {
        onMessage: {
          addListener: (fn) => { listeners['message'] = fn; }
        }
      }
    }
  };

  // No Service Worker, self e globalThis apontam para o escopo global
  context.self = context;
  context.globalThis = context;
  context.addEventListener = (event, fn) => { listeners[event] = fn; };

  // Garantir que window NAO existe no contexto
  delete context.window;

  return vm.createContext(context);
}

bgFiles.forEach((f) => {
  const code = fs.readFileSync(f, 'utf8');
  const sandbox = createServiceWorkerContext();
  try {
    vm.runInContext(code, sandbox);
    console.log('PASS: ' + path.basename(f) + ' inicializou com exito em Service Worker puro (sem window)!');
  } catch (err) {
    console.error('FAIL: ' + path.basename(f) + ' falhou ao inicializar: ' + err.message);
    throw err;
  }
});

// 3. Prova de que a tentativa de acesso a window no contexto geraria erro imediato
console.log('\n[G3] Prova de isolamento: testando se acesso acidental a window dispara ReferenceError...');
const testSandbox = createServiceWorkerContext();
let caughtReferenceError = false;
try {
  vm.runInContext('window.addEventListener("online", () => {});', testSandbox);
} catch (e) {
  if (e.name === 'ReferenceError' || (e.message && e.message.includes('window is not defined'))) {
    caughtReferenceError = true;
  }
}
assert.strictEqual(caughtReferenceError, true, 'O ambiente de teste deve estritamente rejeitar qualquer window');
console.log('PASS: Isolamento confirmado: window is not defined e disparado se referenciado.');

console.log('\n=======================================================');
console.log('TODOS OS 3 GATES DO TESTE REGRESSIVO PASSARAM.');
console.log('=======================================================');