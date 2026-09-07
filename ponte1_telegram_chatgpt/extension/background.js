/**
 * Syntheon Ponte 1 - Background Service Worker (Telegram <-> ChatGPT)
 *
 * Responsabilidade Exclusiva:
 * - Consultar http://127.0.0.1:8766/packet.
 * - Injetar a mensagem do proprietário na aba ativa do ChatGPT.
 * - Encaminhar confirmação (ACK) para http://127.0.0.1:8766/ack.
 * - Receber [CHATGPT_REPLY_V1] do content script e despachar para http://127.0.0.1:8766/reply.
 * - Totalmente isolado: zero CALL, zero RESULT, zero Gravity.
 */

const CONFIG = {
  endpoint: 'http://127.0.0.1:8766',
  pollIntervalMs: 2500
};

let currentInFlight = null;
let lastDeliveredId = null;
let deliveredIds = new Set();
let isDispatching = false;

function updateBadge(text, color) {
  try {
    if (typeof chrome !== 'undefined' && chrome.action && chrome.action.setBadgeText) {
      chrome.action.setBadgeText({ text });
      if (color) chrome.action.setBadgeBackgroundColor({ color });
    }
  } catch (e) {}
}

async function rehydrate() {
  return new Promise(resolve => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['ponte1_in_flight', 'ponte1_last_delivered', 'ponte1_delivered_ids'], res => {
        if (res) {
          if (res.ponte1_in_flight) currentInFlight = res.ponte1_in_flight;
          if (res.ponte1_last_delivered) lastDeliveredId = res.ponte1_last_delivered;
          if (Array.isArray(res.ponte1_delivered_ids)) deliveredIds = new Set(res.ponte1_delivered_ids);
        }
        resolve();
      });
    } else {
      resolve();
    }
  });
}

async function persist() {
  return new Promise(resolve => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({
        ponte1_in_flight: currentInFlight,
        ponte1_last_delivered: lastDeliveredId,
        ponte1_delivered_ids: Array.from(deliveredIds)
      }, () => resolve());
    } else {
      resolve();
    }
  });
}

async function findChatGPTTab() {
  return new Promise(resolve => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ url: ['https://chatgpt.com/*', 'https://chat.openai.com/*'] }, tabs => {
        if (tabs && tabs.length > 0) {
          const activeTab = tabs.find(t => t.active);
          return resolve(activeTab || tabs[0]);
        }
        chrome.tabs.query({}, allTabs => {
          if (!allTabs || allTabs.length === 0) return resolve(null);
          const gptTabs = allTabs.filter(t => t.url && (t.url.includes('chatgpt.com') || t.url.includes('chat.openai.com')));
          if (gptTabs.length === 0) return resolve(null);
          const active = gptTabs.find(t => t.active);
          resolve(active || gptTabs[0]);
        });
      });
    } else {
      resolve(null);
    }
  });
}

async function checkBridge() {
  if (isDispatching) return;
  isDispatching = true;

  try {
    // 1. Se existe um pacote retido em voo, tenta entregá-lo prioritariamente
    if (currentInFlight) {
      const ok = await deliverToChatGPT(currentInFlight);
      if (!ok) {
        isDispatching = false;
        return;
      }
    }

    // 2. Consulta novo pacote
    const res = await fetch(`${CONFIG.endpoint}/packet`, { cache: 'no-store' });
    if (!res.ok) {
      isDispatching = false;
      return;
    }

    const data = await res.json();
    if (!data || !data.packet_id || !data.payload) {
      isDispatching = false;
      return;
    }

    // Dedupe determinístico
    if (deliveredIds.has(data.packet_id) || data.packet_id === lastDeliveredId) {
      await fetch(`${CONFIG.endpoint}/ack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packet_id: data.packet_id })
      });
      isDispatching = false;
      return;
    }

    currentInFlight = data;
    await persist();
    await deliverToChatGPT(data);
  } catch (err) {
    // Daemon offline ou erro transitório
  } finally {
    isDispatching = false;
  }
}

async function deliverToChatGPT(packet) {
  updateBadge('DEL', '#FFA500');
  const tab = await findChatGPTTab();
  if (!tab) {
    updateBadge('WAIT', '#ffc107');
    return false;
  }

  try {
    let response = null;
    try {
      response = await chrome.tabs.sendMessage(tab.id, {
        type: 'PONTE1_INJECT_MESSAGE',
        packet_id: packet.packet_id,
        payload: packet.payload
      });
    } catch (sendErr) {
      // Auto-injeção dinâmica: se o content script não estiver ativo na aba (ex: aba não recarregada)
      if (typeof chrome !== 'undefined' && chrome.scripting && tab.id) {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          });
          await new Promise(r => setTimeout(r, 400));
          response = await chrome.tabs.sendMessage(tab.id, {
            type: 'PONTE1_INJECT_MESSAGE',
            packet_id: packet.packet_id,
            payload: packet.payload
          });
        } catch (scriptErr) {
          throw sendErr;
        }
      } else {
        throw sendErr;
      }
    }

    if (response && response.success) {
      lastDeliveredId = packet.packet_id;
      deliveredIds.add(packet.packet_id);
      currentInFlight = null;
      await persist();

      await fetch(`${CONFIG.endpoint}/ack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packet_id: packet.packet_id })
      });

      updateBadge('OK', '#28a745');
      return true;
    } else if (response && response.status === 'COMPOSER_BUSY') {
      updateBadge('BUSY', '#ffc107');
      return false;
    }
  } catch (e) {
    updateBadge('ERR', '#dc3545');
    return false;
  }
  return false;
}

// Escuta eventos vindos do content script da aba do ChatGPT
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // 1. Heartbeat da aba do ChatGPT para manter o polling ativo e acordado
    if (message.type === 'PONTE1_HEARTBEAT') {
      checkBridge();
      sendResponse({ ok: true });
      return false;
    }

    // 2. Resposta do ChatGPT detectada no DOM -> despacha para o daemon enviar ao Telegram
    if (message.type === 'PONTE1_REPLY_DETECTED') {
      fetch(`${CONFIG.endpoint}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reply_to_message_id: message.reply_to_message_id,
          payload: message.payload
        })
      }).then(() => {
        updateBadge('SENT', '#17a2b8');
        sendResponse({ ok: true });
      }).catch(err => {
        sendResponse({ ok: false, error: err.message });
      });
      return true; // async
    }
  });
}

// Alarme de segurança para ciclo contínuo mesmo com suspensão do worker
if (typeof chrome !== 'undefined' && chrome.alarms) {
  chrome.alarms.create('ponte1_check_alarm', { periodInMinutes: 0.1 });
  chrome.alarms.onAlarm.addListener(alarm => {
    if (alarm && alarm.name === 'ponte1_check_alarm') {
      checkBridge();
    }
  });
}

rehydrate().then(() => checkBridge());
setInterval(checkBridge, CONFIG.pollIntervalMs);

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CONFIG,
    rehydrate,
    persist,
    checkBridge,
    deliverToChatGPT
  };
}
