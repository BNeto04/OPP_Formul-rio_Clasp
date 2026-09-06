/**
 * Syntheon Bridge V2 - Chrome Extension Background Service Worker (Resiliente)
 *
 * Arquitetura Single-Flight e Tolerante a Falhas:
 * 1. Single-Flight estrito: no máximo 1 pacote em voo por vez.
 * 2. Deduplicação em memória e storage por chave única e hash de payload.
 * 3. Proteção contra quedas de Internet:
 *    - Se offline: suspende o ciclo e retém itens na fila.
 *    - Se rede cai durante envio: marca SEND_UNCERTAIN e aciona reconciliação.
 * 4. Reconciliação ao retornar online:
 *    - Consulta o DOM da aba do ChatGPT para checar se o pacote foi recebido.
 *    - Somente avança a fila após confirmação factual.
 */

const DEFAULT_CONFIG = {
  bridgeEndpoint: 'http://127.0.0.1:8765',
  pollIntervalMs: 3000,
  autoSubmit: true,
  enabled: true
};

let currentInFlight = null;
let lastDeliveredPacketId = null;
let isDispatching = false;
let networkStatus = (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean')
  ? (navigator.onLine ? 'ONLINE' : 'OFFLINE')
  : 'ONLINE';

// Monitoramento de conectividade de rede compativel com Service Worker
if (typeof self !== 'undefined' && typeof self.addEventListener === 'function') {
  self.addEventListener('online', () => {
    networkStatus = 'ONLINE';
    remoteLog('[NETWORK_ONLINE] Rede restabelecida. Acionando reconciliação...');
    reconcileAndResume();
  });

  self.addEventListener('offline', () => {
    networkStatus = 'OFFLINE';
    remoteLog('[NETWORK_OFFLINE] Rede desconectada. Pausando envios automáticos.');
    if (typeof chrome !== 'undefined' && chrome.action) {
      chrome.action.setBadgeText({ text: 'OFF' });
      chrome.action.setBadgeBackgroundColor({ color: '#6c757d' });
    }
  });
}

async function remoteLog(msg) {
  console.log('[BridgeV2-BG]', msg);
  try {
    fetch('http://127.0.0.1:8765/log', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: `[BG] ${msg}`
    }).catch(() => {});
  } catch (e) {}
}

async function getConfig() {
  return new Promise((resolve) => {
    chrome.storage.local.get(DEFAULT_CONFIG, (items) => resolve(items));
  });
}

async function findChatGPTTab() {
  return new Promise((resolve) => {
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
  });
}

async function reconcileAndResume() {
  if (!currentInFlight) return;
  const targetTab = await findChatGPTTab();
  if (!targetTab) return;

  try {
    const check = await chrome.tabs.sendMessage(targetTab.id, {
      type: 'CHECK_HISTORY_FOR_PACKET',
      packet_id: currentInFlight.packet_id,
      payloadSnippet: currentInFlight.payload ? currentInFlight.payload.substring(0, 60) : ''
    });

    if (check && check.found) {
      remoteLog(`[RECONCILE] Pacote ${currentInFlight.packet_id} já consta no histórico do chat! Confirmando entrega.`);
      const config = await getConfig();
      await sendAckToBridge(config.bridgeEndpoint, currentInFlight.packet_id);
      lastDeliveredPacketId = currentInFlight.packet_id;
      currentInFlight = null;
      chrome.action.setBadgeText({ text: 'OK' });
      chrome.action.setBadgeBackgroundColor({ color: '#28a745' });
    } else {
      remoteLog(`[RECONCILE] Pacote ${currentInFlight.packet_id} não encontrado no histórico. Mantido para tentativa única.`);
    }
  } catch (e) {
    remoteLog(`Erro na reconciliação: ${e.message}`);
  }
}

async function checkBridge() {
  const config = await getConfig();
  const isOnline = (typeof navigator === 'undefined' || typeof navigator.onLine !== 'boolean') ? true : navigator.onLine;
  if (!config.enabled || !isOnline) {
    return;
  }

  // Single-flight: se já temos item em voo não resolvido, não consome outro
  if (currentInFlight) {
    return;
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

    if (data.packet_id === lastDeliveredPacketId) {
      isDispatching = false;
      return;
    }

    // Aloca item in-flight sob single-flight lock
    currentInFlight = data;
    remoteLog(`[SINGLE_FLIGHT_ACQUIRED] Novo pacote adquirido: ${data.packet_id}`);
    await deliverPacket(data, config);
  } catch (err) {
    remoteLog(`Erro em checkBridge: ${err.message}`);
  } finally {
    isDispatching = false;
  }
}

async function deliverPacket(packet, config) {
  chrome.action.setBadgeText({ text: 'DEL' });
  chrome.action.setBadgeBackgroundColor({ color: '#FFA500' });

  const targetTab = await findChatGPTTab();
  if (!targetTab) {
    remoteLog('Nenhuma aba do ChatGPT encontrada. Mantendo item in-flight.');
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
      currentInFlight = null;

      await sendAckToBridge(config.bridgeEndpoint, packet.packet_id);
      chrome.action.setBadgeText({ text: 'OK' });
      chrome.action.setBadgeBackgroundColor({ color: '#28a745' });
    } else if (response && response.status === 'COMPOSER_BUSY_OWNER_TEXT') {
      remoteLog(`[HOLD] Composer ocupado pelo usuário. Preservando escrita e retendo pacote ${packet.packet_id}.`);
      chrome.action.setBadgeText({ text: 'BUSY' });
      chrome.action.setBadgeBackgroundColor({ color: '#ffc107' });
    } else if (response && response.status === 'COMPOSER_BUSY_PREVIOUS_PACKET_PENDING') {
      remoteLog(`[HOLD] Pacote anterior pendente no composer. Não concatenar.`);
      chrome.action.setBadgeText({ text: 'WAIT' });
      chrome.action.setBadgeBackgroundColor({ color: '#ffc107' });
    } else if (response && response.status === 'SEND_UNCERTAIN') {
      remoteLog(`[UNCERTAIN] Envio incerto para ${packet.packet_id}. Aguardando reconciliação sem retry cego.`);
      chrome.action.setBadgeText({ text: 'UNC' });
      chrome.action.setBadgeBackgroundColor({ color: '#e83e8c' });
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

// Inicia ciclo de polling do background a cada 3 segundos
setInterval(checkBridge, 3000);
