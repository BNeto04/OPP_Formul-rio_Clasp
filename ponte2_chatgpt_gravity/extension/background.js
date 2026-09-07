/**
 * Syntheon Ponte 2 - Background Service Worker (ChatGPT <-> Gravity)
 *
 * Responsabilidade Exclusiva:
 * - Porta HTTP: 8767.
 * - Receber [BRIDGE_TO_ANTIGRAVITY_V1] (CALL/AUDIT) do content script e despachar para POST /call.
 * - Consultar GET /result para buscar [BRIDGE_FROM_ANTIGRAVITY_V1] (RESULT/ACK técnico) gerados pelo Gravity.
 * - Injetar o resultado na aba ativa do ChatGPT via content script.
 * - Encaminhar confirmação (ACK) para POST /result_ack.
 * - Isolamento absoluto: exclusivo para CALL, AUDIT, RESULT e ACK técnico.
 */

const CONFIG = {
  endpoint: 'http://127.0.0.1:8767',
  pollIntervalMs: 2500
};

let currentInFlightResult = null;
let lastDeliveredResultId = null;
let deliveredResultIds = new Set();
let isPollingResult = false;

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
      chrome.storage.local.get(['ponte2_in_flight_result', 'ponte2_last_delivered', 'ponte2_delivered_ids'], res => {
        if (res) {
          if (res.ponte2_in_flight_result) currentInFlightResult = res.ponte2_in_flight_result;
          if (res.ponte2_last_delivered) lastDeliveredResultId = res.ponte2_last_delivered;
          if (Array.isArray(res.ponte2_delivered_ids)) deliveredResultIds = new Set(res.ponte2_delivered_ids);
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
        ponte2_in_flight_result: currentInFlightResult,
        ponte2_last_delivered: lastDeliveredResultId,
        ponte2_delivered_ids: Array.from(deliveredResultIds)
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

async function checkResultQueue() {
  if (isPollingResult) return;
  isPollingResult = true;

  try {
    // 1. Se há um resultado pendente em voo que não completou, tenta entregá-lo
    if (currentInFlightResult) {
      const ok = await deliverResultToChatGPT(currentInFlightResult);
      if (!ok) {
        isPollingResult = false;
        return;
      }
    }

    // 2. Consulta novo resultado vindo do Gravity
    const res = await fetch(`${CONFIG.endpoint}/result`, { cache: 'no-store' });
    if (!res.ok) {
      isPollingResult = false;
      return;
    }

    const data = await res.json();
    if (!data || !data.call_id || !data.payload) {
      isPollingResult = false;
      return;
    }

    // Dedupe determinístico
    if (deliveredResultIds.has(data.call_id) || data.call_id === lastDeliveredResultId) {
      await fetch(`${CONFIG.endpoint}/result_ack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ call_id: data.call_id })
      });
      isPollingResult = false;
      return;
    }

    currentInFlightResult = data;
    await persist();
    await deliverResultToChatGPT(data);
  } catch (err) {
    // Daemon offline ou erro de rede transitório
  } finally {
    isPollingResult = false;
  }
}

async function deliverResultToChatGPT(packet) {
  updateBadge('RES', '#17a2b8');
  const tab = await findChatGPTTab();
  if (!tab) {
    updateBadge('WAIT', '#ffc107');
    return false;
  }

  try {
    let response = null;
    try {
      response = await chrome.tabs.sendMessage(tab.id, {
        type: 'PONTE2_INJECT_RESULT',
        call_id: packet.call_id,
        payload: packet.payload
      });
    } catch (sendErr) {
      // Auto-injeção dinâmica via chrome.scripting se aba ainda não recarregou
      if (typeof chrome !== 'undefined' && chrome.scripting && tab.id) {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          });
          await new Promise(r => setTimeout(r, 400));
          response = await chrome.tabs.sendMessage(tab.id, {
            type: 'PONTE2_INJECT_RESULT',
            call_id: packet.call_id,
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
      lastDeliveredResultId = packet.call_id;
      deliveredResultIds.add(packet.call_id);
      currentInFlightResult = null;
      await persist();

      await fetch(`${CONFIG.endpoint}/result_ack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ call_id: packet.call_id })
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

// Ouvinte de mensagens do content script
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // 1. Heartbeat
    if (message.type === 'PONTE2_HEARTBEAT') {
      checkResultQueue();
      sendResponse({ ok: true });
      return false;
    }

    // 2. CALL ou AUDIT detectada no ChatGPT -> envia ao Daemon
    if (message.type === 'PONTE2_CALL_DETECTED') {
      updateBadge('CALL', '#FFA500');
      fetch(`${CONFIG.endpoint}/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message.call)
      }).then(res => res.json()).then(data => {
        if (data && data.ok) {
          updateBadge('OK', '#28a745');
          sendResponse({ ok: true, call_id: message.call.call_id });
        } else {
          updateBadge('ERR', '#dc3545');
          sendResponse({ ok: false, error: data ? data.error : 'FAILED_TO_DISPATCH' });
        }
      }).catch(err => {
        updateBadge('ERR', '#dc3545');
        sendResponse({ ok: false, error: err.message });
      });
      return true; // async
    }
  });
}

// Alarme para manter ciclo ativo
if (typeof chrome !== 'undefined' && chrome.alarms) {
  chrome.alarms.create('ponte2_check_alarm', { periodInMinutes: 0.1 });
  chrome.alarms.onAlarm.addListener(alarm => {
    if (alarm && alarm.name === 'ponte2_check_alarm') {
      checkResultQueue();
    }
  });
}

rehydrate().then(() => checkResultQueue());
setInterval(checkResultQueue, CONFIG.pollIntervalMs);

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CONFIG,
    rehydrate,
    persist,
    checkResultQueue,
    deliverResultToChatGPT
  };
}
