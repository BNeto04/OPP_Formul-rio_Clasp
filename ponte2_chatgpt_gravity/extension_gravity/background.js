/**
 * Syntheon Ponte 2 - Background Service Worker (Gravity Carrier)
 *
 * Responsabilidade Exclusiva:
 * - Porta HTTP: 8767.
 * - Consultar GET /call para buscar CALLs/AUDITs pendentes geradas pelo ChatGPT.
 * - Injetar a CALL na interface do Antigravity via content script.
 * - Encaminhar confirmação (ACK) para POST /call_ack.
 * - Receber RESULT do content script do Antigravity e despachar para POST /result.
 * - Isolamento absoluto: exclusivo para CALL, AUDIT, RESULT e ACK técnico.
 */

const CONFIG = {
  endpoint: 'http://127.0.0.1:8767',
  pollIntervalMs: 2500
};

let currentInFlightCall = null;
let lastDeliveredCallId = null;
let deliveredCallIds = new Set();
let isPollingCall = false;

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
      chrome.storage.local.get(['ponte2_gravity_in_flight_call', 'ponte2_gravity_last_delivered', 'ponte2_gravity_delivered_ids'], res => {
        if (res) {
          if (res.ponte2_gravity_in_flight_call) currentInFlightCall = res.ponte2_gravity_in_flight_call;
          if (res.ponte2_gravity_last_delivered) lastDeliveredCallId = res.ponte2_gravity_last_delivered;
          if (Array.isArray(res.ponte2_gravity_delivered_ids)) deliveredCallIds = new Set(res.ponte2_gravity_delivered_ids);
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
        ponte2_gravity_in_flight_call: currentInFlightCall,
        ponte2_gravity_last_delivered: lastDeliveredCallId,
        ponte2_gravity_delivered_ids: Array.from(deliveredCallIds)
      }, () => resolve());
    } else {
      resolve();
    }
  });
}

async function findTargetTab() {
  return new Promise(resolve => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        if (tabs && tabs.length > 0) return resolve(tabs[0]);
        chrome.tabs.query({}, allTabs => {
          if (!allTabs || allTabs.length === 0) return resolve(null);
          resolve(allTabs[0]);
        });
      });
    } else {
      resolve(null);
    }
  });
}

async function checkCallQueue() {
  if (isPollingCall) return;
  isPollingCall = true;

  try {
    // 1. Se há uma CALL pendente em voo, tenta entregá-la prioritariamente
    if (currentInFlightCall) {
      const ok = await deliverCallToGravity(currentInFlightCall);
      if (!ok) {
        isPollingCall = false;
        return;
      }
    }

    // 2. Consulta nova CALL vinda do daemon
    const res = await fetch(`${CONFIG.endpoint}/call`, { cache: 'no-store' });
    if (!res.ok) {
      isPollingCall = false;
      return;
    }

    const data = await res.json();
    if (!data || !data.call_id || !data.payload) {
      isPollingCall = false;
      return;
    }

    // Dedupe determinístico
    if (deliveredCallIds.has(data.call_id) || data.call_id === lastDeliveredCallId) {
      await fetch(`${CONFIG.endpoint}/call_ack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ call_id: data.call_id })
      });
      isPollingCall = false;
      return;
    }

    currentInFlightCall = data;
    await persist();
    await deliverCallToGravity(data);
  } catch (err) {
    // Daemon offline ou rede
  } finally {
    isPollingCall = false;
  }
}

async function deliverCallToGravity(packet) {
  updateBadge('CALL', '#FFA500');
  const tab = await findTargetTab();
  if (!tab) {
    updateBadge('WAIT', '#ffc107');
    return false;
  }

  try {
    let response = null;
    try {
      response = await chrome.tabs.sendMessage(tab.id, {
        type: 'PONTE2_GRAVITY_INJECT_CALL',
        call_id: packet.call_id,
        payload: packet.payload
      });
    } catch (sendErr) {
      if (typeof chrome !== 'undefined' && chrome.scripting && tab.id) {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          });
          await new Promise(r => setTimeout(r, 400));
          response = await chrome.tabs.sendMessage(tab.id, {
            type: 'PONTE2_GRAVITY_INJECT_CALL',
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
      lastDeliveredCallId = packet.call_id;
      deliveredCallIds.add(packet.call_id);
      currentInFlightCall = null;
      await persist();

      await fetch(`${CONFIG.endpoint}/call_ack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ call_id: packet.call_id })
      });

      updateBadge('OK', '#28a745');
      return true;
    }
  } catch (e) {
    updateBadge('ERR', '#dc3545');
    return false;
  }
  return false;
}

if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // 1. Heartbeat
    if (message.type === 'PONTE2_GRAVITY_HEARTBEAT') {
      checkCallQueue();
      sendResponse({ ok: true });
      return false;
    }

    // 2. RESULT produzido no Antigravity -> envia ao Daemon para o ChatGPT
    if (message.type === 'PONTE2_GRAVITY_RESULT_DETECTED') {
      updateBadge('RES', '#17a2b8');
      fetch(`${CONFIG.endpoint}/result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message.result)
      }).then(res => res.json()).then(data => {
        if (data && data.ok) {
          updateBadge('OK', '#28a745');
          sendResponse({ ok: true, call_id: message.result.call_id });
        } else {
          updateBadge('ERR', '#dc3545');
          sendResponse({ ok: false, error: data ? data.error : 'FAILED' });
        }
      }).catch(err => {
        updateBadge('ERR', '#dc3545');
        sendResponse({ ok: false, error: err.message });
      });
      return true; // async
    }
  });
}

if (typeof chrome !== 'undefined' && chrome.alarms) {
  chrome.alarms.create('ponte2_gravity_alarm', { periodInMinutes: 0.1 });
  chrome.alarms.onAlarm.addListener(alarm => {
    if (alarm && alarm.name === 'ponte2_gravity_alarm') {
      checkCallQueue();
    }
  });
}

rehydrate().then(() => checkCallQueue());
setInterval(checkCallQueue, CONFIG.pollIntervalMs);

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CONFIG,
    rehydrate,
    persist,
    checkCallQueue,
    deliverCallToGravity
  };
}
