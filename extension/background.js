/**
 * Syntheon Bridge V2 - Chrome Extension Background Service Worker (Resiliente)
 *
 * Implementa salvaguardas contratuais da Issue #53 / CALL-53-STAGE1-CARRIER-RESILIENCE-001:
 * 1. Lifecycle MV3 Resiliente: Heartbeat da aba ativa + chrome.alarms + setInterval.
 * 2. Persistência de Estado em chrome.storage.local:
 *    - current_in_flight
 *    - last_delivered_packet_id
 *    - delivered_ids (histórico para DEDUPE_NO_OP)
 * 3. Reidratação no wakeup antes de consumir novo pacote.
 * 4. Reconciliação antes de retry (zero reinjeção cega).
 * 5. Deduplicação determinística: delivery_confirmed => DEDUPE_NO_OP.
 * 6. Single-Flight estrito: no máximo 1 pacote em voo por vez.
 */

const DEFAULT_CONFIG = {
  bridgeEndpoint: 'http://127.0.0.1:8765',
  pollIntervalMs: 3000,
  autoSubmit: true,
  enabled: true
};

const STORAGE_KEYS = {
  IN_FLIGHT: 'carrier_current_in_flight',
  LAST_DELIVERED: 'carrier_last_delivered_id',
  DELIVERED_IDS: 'carrier_delivered_ids'
};

let currentInFlight = null;
let lastDeliveredPacketId = null;
let deliveredIds = new Set();
let isDispatching = false;
let isRehydrated = false;
let networkStatus = (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean')
  ? (navigator.onLine ? 'ONLINE' : 'OFFLINE')
  : 'ONLINE';

// Monitoramento de conectividade de rede
if (typeof self !== 'undefined' && typeof self.addEventListener === 'function') {
  self.addEventListener('online', () => {
    networkStatus = 'ONLINE';
    remoteLog('[NETWORK_ONLINE] Rede restabelecida. Acionando reconciliação...');
    reconcileAndResume();
  });

  self.addEventListener('offline', () => {
    networkStatus = 'OFFLINE';
    remoteLog('[NETWORK_OFFLINE] Rede desconectada. Pausando envios automáticos.');
    updateBadge('OFF', '#6c757d');
  });
}

function updateBadge(text, color) {
  if (typeof chrome !== 'undefined' && chrome.action && chrome.action.setBadgeText) {
    chrome.action.setBadgeText({ text });
    if (color && chrome.action.setBadgeBackgroundColor) {
      chrome.action.setBadgeBackgroundColor({ color });
    }
  }
}

async function remoteLog(msg) {
  console.log('[BridgeV2-BG]', msg);
  try {
    const config = await getConfig();
    if (typeof fetch !== 'undefined') {
      fetch(`${config.bridgeEndpoint}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: `[BG] ${msg}`
      }).catch(() => {});
    }
  } catch (e) {}
}

async function getConfig() {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(DEFAULT_CONFIG, (items) => resolve(items || DEFAULT_CONFIG));
    } else {
      resolve(DEFAULT_CONFIG);
    }
  });
}

/**
 * Reidratação do Estado Persistido em chrome.storage.local
 */
async function rehydrateState() {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get([
        STORAGE_KEYS.IN_FLIGHT,
        STORAGE_KEYS.LAST_DELIVERED,
        STORAGE_KEYS.DELIVERED_IDS
      ], (res) => {
        if (res) {
          if (res[STORAGE_KEYS.IN_FLIGHT]) {
            currentInFlight = res[STORAGE_KEYS.IN_FLIGHT];
            remoteLog(`[REHYDRATE] currentInFlight reidratado: ${currentInFlight.packet_id}`);
          }
          if (res[STORAGE_KEYS.LAST_DELIVERED]) {
            lastDeliveredPacketId = res[STORAGE_KEYS.LAST_DELIVERED];
          }
          if (Array.isArray(res[STORAGE_KEYS.DELIVERED_IDS])) {
            deliveredIds = new Set(res[STORAGE_KEYS.DELIVERED_IDS]);
          }
        }
        isRehydrated = true;
        resolve({ currentInFlight, lastDeliveredPacketId, deliveredIds });
      });
    } else {
      isRehydrated = true;
      resolve({ currentInFlight, lastDeliveredPacketId, deliveredIds });
    }
  });
}

/**
 * Persistência de Estado em chrome.storage.local
 */
async function persistState() {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      const data = {
        [STORAGE_KEYS.IN_FLIGHT]: currentInFlight,
        [STORAGE_KEYS.LAST_DELIVERED]: lastDeliveredPacketId,
        [STORAGE_KEYS.DELIVERED_IDS]: Array.from(deliveredIds)
      };
      chrome.storage.local.set(data, () => resolve(true));
    } else {
      resolve(true);
    }
  });
}

async function findChatGPTTab() {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({}, (tabs) => {
        if (!tabs || tabs.length === 0) {
          resolve(null);
          return;
        }
        const gptTabs = tabs.filter((t) => t.url && (t.url.includes('chatgpt.com') || t.url.includes('chat.openai.com')));
        if (gptTabs.length === 0) {
          resolve(null);
          return;
        }
        const activeTab = gptTabs.find((t) => t.active);
        resolve(activeTab || gptTabs[0]);
      });
    } else {
      resolve(null);
    }
  });
}

/**
 * Reconciliação com o DOM da aba do ChatGPT antes de qualquer retry cego
 */
async function reconcileAndResume() {
  if (!currentInFlight) return { reconciled: false, reason: 'NO_IN_FLIGHT' };
  const targetTab = await findChatGPTTab();
  if (!targetTab) return { reconciled: false, reason: 'NO_CHATGPT_TAB' };

  try {
    const check = await chrome.tabs.sendMessage(targetTab.id, {
      type: 'CHECK_HISTORY_FOR_PACKET',
      packet_id: currentInFlight.packet_id,
      payloadSnippet: currentInFlight.payload ? currentInFlight.payload.substring(0, 60) : ''
    });

    if (check && check.found) {
      remoteLog(`[RECONCILE] Pacote ${currentInFlight.packet_id} confirmado no histórico do chat! Concluindo entrega.`);
      const config = await getConfig();
      await sendAckToBridge(config.bridgeEndpoint, currentInFlight.packet_id);
      lastDeliveredPacketId = currentInFlight.packet_id;
      deliveredIds.add(currentInFlight.packet_id);
      currentInFlight = null;
      await persistState();
      updateBadge('OK', '#28a745');
      return { reconciled: true, status: 'DELIVERED_CONFIRMED' };
    } else {
      remoteLog(`[RECONCILE] Pacote ${currentInFlight.packet_id} não encontrado no histórico. Mantendo pendente.`);
      return { reconciled: false, status: 'NOT_FOUND_IN_HISTORY' };
    }
  } catch (e) {
    remoteLog(`Erro na reconciliação: ${e.message}`);
    return { reconciled: false, error: e.message };
  }
}

/**
 * Ciclo Principal de Consulta à Bridge Local
 */
async function checkBridge() {
  if (!isRehydrated) {
    await rehydrateState();
  }

  const config = await getConfig();
  const isOnline = (typeof navigator === 'undefined' || typeof navigator.onLine !== 'boolean') ? true : navigator.onLine;
  if (!config.enabled || !isOnline) {
    return;
  }

  // 1. Single-Flight e Reconciliação Prévia:
  // Se já existe pacote em voo (em memória ou reidratado do storage), reconcilia primeiro!
  if (currentInFlight) {
    await reconcileAndResume();
    if (currentInFlight) {
      if (!currentInFlight._acquiredAt) {
        currentInFlight._acquiredAt = Date.now();
      } else if (Date.now() - currentInFlight._acquiredAt > 30000) {
        remoteLog(`[TIMEOUT_RELEASE] Pacote ${currentInFlight.packet_id} retido por mais de 30s. Liberando trava.`);
        currentInFlight = null;
        await persistState();
      } else {
        return;
      }
    }
  }

  if (isDispatching) return;
  isDispatching = true;

  try {
    const url = `${config.bridgeEndpoint}/context_packet`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    });

    if (!res.ok) {
      isDispatching = false;
      return;
    }

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      isDispatching = false;
      return;
    }

    if (!data || !data.packet_id || !data.payload) {
      isDispatching = false;
      return;
    }

    // 2. DEDUPE_NO_OP Determinístico:
    // Se o pacote já foi entregue e confirmado anteriormente, não reinjeta!
    if (deliveredIds.has(data.packet_id) || data.packet_id === lastDeliveredPacketId) {
      remoteLog(`[DEDUPE_NO_OP] Pacote ${data.packet_id} já entregue anteriormente. Descartando re-injeção.`);
      await sendAckToBridge(config.bridgeEndpoint, data.packet_id);
      isDispatching = false;
      return;
    }

    // 3. Alocação Single-Flight com persistência imediata
    currentInFlight = {
      packet_id: data.packet_id,
      payload: data.payload,
      _acquiredAt: Date.now(),
      status: 'IN_FLIGHT'
    };
    await persistState();
    remoteLog(`[SINGLE_FLIGHT_ACQUIRED] Novo pacote adquirido e persistido: ${data.packet_id}`);
    await deliverPacket(data, config);
  } catch (err) {
    remoteLog(`Erro em checkBridge: ${err.message}`);
  } finally {
    isDispatching = false;
  }
}

/**
 * Despacho do Pacote para a Aba do ChatGPT
 */
async function deliverPacket(packet, config) {
  updateBadge('DEL', '#FFA500');

  const targetTab = await findChatGPTTab();
  if (!targetTab) {
    remoteLog('Nenhuma aba do ChatGPT encontrada. Mantendo item in-flight persistido.');
    return;
  }

  try {
    const response = await chrome.tabs.sendMessage(targetTab.id, {
      type: 'INJECT_CONTEXT_PACKET',
      packet_id: packet.packet_id,
      payload: packet.payload,
      autoSubmit: config.autoSubmit
    });

    if (response && response.success) {
      remoteLog(`[DELIVERY_ACCEPTED] Pacote ${packet.packet_id} entregue e aceito pelo ChatGPT!`);
      lastDeliveredPacketId = packet.packet_id;
      deliveredIds.add(packet.packet_id);
      currentInFlight = null;
      await persistState();

      await sendAckToBridge(config.bridgeEndpoint, packet.packet_id);
      updateBadge('OK', '#28a745');
    } else if (response && response.status === 'COMPOSER_BUSY_OWNER_TEXT') {
      remoteLog(`[HOLD] Composer ocupado pelo usuário. Preservando escrita e retendo pacote ${packet.packet_id}.`);
      updateBadge('BUSY', '#ffc107');
    } else if (response && response.status === 'COMPOSER_BUSY_PREVIOUS_PACKET_PENDING') {
      remoteLog(`[HOLD] Pacote anterior pendente no composer. Não concatenar.`);
      updateBadge('WAIT', '#ffc107');
      setTimeout(reconcileAndResume, 1500);
    } else if (response && response.status === 'SEND_UNCERTAIN') {
      // SEND_UNCERTAIN: Zero reinjeção cega! Marca status e agenda reconciliação no DOM.
      remoteLog(`[UNCERTAIN] Envio incerto para ${packet.packet_id}. Aguardando reconciliação sem retry cego.`);
      if (currentInFlight) {
        currentInFlight.status = 'SEND_UNCERTAIN';
        await persistState();
      }
      updateBadge('UNC', '#e83e8c');
      setTimeout(reconcileAndResume, 2000);
    } else {
      remoteLog(`Falha na entrega: ${JSON.stringify(response)}`);
    }
  } catch (err) {
    remoteLog(`Erro de comunicação com content script: ${err.message}`);
  }
}

async function sendAckToBridge(endpoint, packetId) {
  try {
    await fetch(`${endpoint}/ack`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        packet_id: packetId,
        source: 'CHROME_EXTENSION_V2_RESILIENT',
        delivered_at: new Date().toISOString()
      })
    });
  } catch (e) {}
}

// 1. Listener de Heartbeat disparado pelo content script da aba do ChatGPT
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message && (message.type === 'HEARTBEAT_CHECK_BRIDGE' || message.type === 'CARRIER_PULSE')) {
      checkBridge();
      sendResponse({ ok: true });
      return false;
    }
  });
}

// 2. Alarme periódico do Chrome (Garantia de Wakeup caso o worker durma)
if (typeof chrome !== 'undefined' && chrome.alarms) {
  chrome.alarms.create('checkBridgeAlarm', { periodInMinutes: 0.1 });
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm && alarm.name === 'checkBridgeAlarm') {
      checkBridge();
    }
  });
}

// 3. Inicialização e Reidratação Imediata
rehydrateState().then(() => {
  checkBridge();
});

// Polling local ativo enquanto o worker estiver em execução
setInterval(checkBridge, 3000);

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DEFAULT_CONFIG,
    STORAGE_KEYS,
    rehydrateState,
    persistState,
    reconcileAndResume,
    checkBridge,
    deliverPacket,
    sendAckToBridge,
    _resetForTest: () => {
      currentInFlight = null;
      lastDeliveredPacketId = null;
      deliveredIds = new Set();
      isDispatching = false;
      isRehydrated = false;
    }
  };
}
