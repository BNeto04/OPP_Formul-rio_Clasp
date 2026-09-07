const assert = require('assert');
const path = require('path');
const fs = require('fs');

async function runTests() {
  console.log('===============================================================');
  console.log('SUITE DE TESTES: CALL-53-STAGE1-CARRIER-RESILIENCE-001');
  console.log('===============================================================');

  let passed = 0;
  let failed = 0;
  function ok(name) { console.log(`PASS: ${name}`); passed++; }
  function fail(name, err) { console.error(`FAIL: ${name} -> ${err.message || err}`); failed++; }

  // Mock de ambiente Chrome para Background Service Worker
  let mockStorage = {};
  global.chrome = {
    storage: {
      local: {
        get: (keys, cb) => {
          const res = {};
          if (Array.isArray(keys)) {
            keys.forEach(k => { res[k] = mockStorage[k]; });
          } else if (typeof keys === 'object') {
            Object.keys(keys).forEach(k => { res[k] = mockStorage[k] !== undefined ? mockStorage[k] : keys[k]; });
          }
          cb(res);
        },
        set: (data, cb) => {
          Object.assign(mockStorage, data);
          if (cb) cb();
        }
      }
    },
    action: {
      setBadgeText: () => {},
      setBadgeBackgroundColor: () => {}
    },
    alarms: {
      create: () => {},
      onAlarm: { addListener: () => {} }
    },
    runtime: {
      onMessage: { addListener: () => {} }
    },
    tabs: {
      query: (filter, cb) => cb([{ id: 101, url: 'https://chatgpt.com/c/test', active: true }]),
      sendMessage: async (tabId, msg) => {
        return { success: true };
      }
    }
  };

  global.fetch = async (url, opts) => {
    return {
      ok: true,
      text: async () => JSON.stringify({ packet_id: 'PKT_1', payload: 'hello' })
    };
  };

  const bg = require('../extension/background');

  // TESTE H: Ausência de 'window is not defined' e 'Uncaught (in promise)'
  try {
    const bgCode = fs.readFileSync(path.join(__dirname, '../extension/background.js'), 'utf8');
    assert.strictEqual(bgCode.includes('window.'), false, 'background.js não deve acessar window diretamente');
    ok('H: Sem acesso direto a window no Carrier Service Worker');
  } catch (e) {
    fail('H: window is defined check', e);
  }

  // TESTE A: Reidratação de estado persistido antes de consumir novo pacote
  try {
    bg._resetForTest();
    mockStorage = {
      carrier_current_in_flight: {
        packet_id: 'PKT_RESTORED_123',
        payload: 'texto pendente',
        _acquiredAt: Date.now()
      },
      carrier_last_delivered_id: 'PKT_OLD_999',
      carrier_delivered_ids: ['PKT_OLD_999']
    };

    const restored = await bg.rehydrateState();
    assert.strictEqual(restored.currentInFlight.packet_id, 'PKT_RESTORED_123', 'Deve reidratar packet_id');
    assert.strictEqual(restored.lastDeliveredPacketId, 'PKT_OLD_999', 'Deve reidratar lastDeliveredPacketId');
    ok('A: Reidratação de currentInFlight e lastDeliveredPacketId após restart');
  } catch (e) {
    fail('A: Reidratação de estado', e);
  }

  // TESTE B: DEDUPE_NO_OP em pacote já confirmado
  try {
    bg._resetForTest();
    mockStorage = {
      carrier_current_in_flight: null,
      carrier_last_delivered_id: 'PKT_OLD_999',
      carrier_delivered_ids: ['PKT_OLD_999']
    };

    let deliveredCalled = false;
    let ackSent = false;
    global.fetch = async (url, opts) => {
      if (url.includes('/context_packet')) {
        return { ok: true, text: async () => JSON.stringify({ packet_id: 'PKT_OLD_999', payload: 'duplicado' }) };
      }
      if (url.includes('/ack')) {
        ackSent = true;
        return { ok: true };
      }
    };

    global.chrome.tabs.sendMessage = async () => {
      deliveredCalled = true;
      return { success: true };
    };

    await bg.rehydrateState();
    await bg.checkBridge();

    assert.strictEqual(deliveredCalled, false, 'Pacote já entregue não deve ser despachado ao ChatGPT');
    assert.strictEqual(ackSent, true, 'Deve confirmar ACK à bridge para liberar a fila');
    ok('B: Pacote já confirmado gera DEDUPE_NO_OP (zero reinjeção)');
  } catch (e) {
    fail('B: DEDUPE_NO_OP', e);
  }

  // TESTE C: SEND_UNCERTAIN sem reinjeção cega
  try {
    bg._resetForTest();
    mockStorage = {
      carrier_current_in_flight: null,
      carrier_delivered_ids: []
    };

    let injectedCount = 0;
    global.chrome.tabs.sendMessage = async (tabId, msg) => {
      if (msg.type === 'INJECT_CONTEXT_PACKET') {
        injectedCount++;
        return { success: false, status: 'SEND_UNCERTAIN' };
      }
      if (msg.type === 'CHECK_HISTORY_FOR_PACKET') {
        return { found: false };
      }
      return { success: false };
    };

    global.fetch = async (url) => {
      if (url.includes('/context_packet')) {
        return { ok: true, text: async () => JSON.stringify({ packet_id: 'PKT_UNCERTAIN_1', payload: 'texto incerto' }) };
      }
      return { ok: true };
    };

    await bg.rehydrateState();
    await bg.checkBridge();
    assert.strictEqual(injectedCount, 1, 'Injeção inicial realizada');

    // Segundo checkBridge: como está em voo e não foi reconciliado, NÃO deve reinjetar
    await bg.checkBridge();
    assert.strictEqual(injectedCount, 1, 'Não deve reinjetar cegamente enquanto status for incerto');
    ok('C: SEND_UNCERTAIN retém sem reinjeção cega');
  } catch (e) {
    fail('C: SEND_UNCERTAIN', e);
  }

  // TESTE D: Composer ocupado preserva escrita
  try {
    bg._resetForTest();
    mockStorage = {
      carrier_current_in_flight: null,
      carrier_delivered_ids: []
    };

    global.chrome.tabs.sendMessage = async (tabId, msg) => {
      if (msg.type === 'INJECT_CONTEXT_PACKET') {
        return { success: false, status: 'COMPOSER_BUSY_OWNER_TEXT' };
      }
      return { found: false };
    };

    global.fetch = async (url) => {
      if (url.includes('/context_packet')) {
        return { ok: true, text: async () => JSON.stringify({ packet_id: 'PKT_BUSY_1', payload: 'texto busy' }) };
      }
      return { ok: true };
    };

    await bg.rehydrateState();
    await bg.checkBridge();

    const state = await bg.rehydrateState();
    assert.ok(state.currentInFlight, 'Item deve ser mantido pendente');
    assert.strictEqual(state.currentInFlight.packet_id, 'PKT_BUSY_1');
    ok('D: Composer ocupado mantém pacote pendente sem sobrescrever texto');
  } catch (e) {
    fail('D: Composer ocupado', e);
  }

  // TESTE E: Uma única mensagem Telegram produz uma única injeção
  try {
    bg._resetForTest();
    mockStorage = {
      carrier_current_in_flight: null,
      carrier_delivered_ids: []
    };

    let injectionCount = 0;
    global.chrome.tabs.sendMessage = async (tabId, msg) => {
      if (msg.type === 'INJECT_CONTEXT_PACKET') {
        injectionCount++;
        return { success: true };
      }
      return { found: false };
    };

    global.fetch = async (url) => {
      if (url.includes('/context_packet')) {
        return { ok: true, text: async () => JSON.stringify({ packet_id: 'PKT_SINGLE_1', payload: 'uma vez' }) };
      }
      return { ok: true };
    };

    await bg.rehydrateState();
    await bg.checkBridge();
    assert.strictEqual(injectionCount, 1);

    // Repetição de chamada de polling:
    await bg.checkBridge();
    assert.strictEqual(injectionCount, 1, 'Não deve injetar novamente');
    ok('E: Uma única mensagem produz exatamente uma injeção (exactly-once)');
  } catch (e) {
    fail('E: Exactly-once injection', e);
  }

  // TESTE I: Lifecycle MV3 híbrido (Alarms + Heartbeat + setInterval)
  try {
    const bgCode = fs.readFileSync(path.join(__dirname, '../extension/background.js'), 'utf8');
    const contentCode = fs.readFileSync(path.join(__dirname, '../extension/content.js'), 'utf8');
    assert.ok(bgCode.includes('chrome.alarms'), 'Deve ter suporte a chrome.alarms');
    assert.ok(bgCode.includes('HEARTBEAT_CHECK_BRIDGE'), 'Deve ter listener de heartbeat');
    assert.ok(contentCode.includes('HEARTBEAT_CHECK_BRIDGE'), 'Content script deve enviar heartbeat');
    ok('I: Mecanismo de wake híbrido MV3 implementado (Alarms + Content Script Heartbeat)');
  } catch (e) {
    fail('I: Lifecycle MV3', e);
  }

  console.log('---------------------------------------------------------------');
  console.log(`RESULTADO: ${passed} PASS / ${failed} FAIL`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
