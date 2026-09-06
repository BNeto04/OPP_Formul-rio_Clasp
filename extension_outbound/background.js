/**
 * Syntheon Bridge V2 - Antigravity Outbound Sender (Background Service Worker)
 *
 * Responsabilidade:
 * - Identidade: OUTBOUND_SENDER_V2
 * - Receber envelopes validados do content script.
 * - Manter deduplicação persistente em chrome.storage.local.
 * - Despachar POST para o endpoint local da Bridge V2 (default: http://127.0.0.1:8765/outbound_packet).
 * - Registrar observabilidade e gerenciar status no badge (IDLE, SEND, OK, ERR).
 * - Isolação estrita: não interage com envelopes do Inbound Carrier nem reintroduz V.
 */

const DEFAULT_CONFIG = {
  bridgeEndpoint: 'http://127.0.0.1:8765',
  enabled: true
};

const ALLOWED_TYPES = ['CALL', 'MESSAGE', 'AUDIT', 'OWNER_DIRECTIVE', 'CHATGPT_REPLY'];
let sentCallIds = new Set();

async function remoteLog(msg) {
  console.log('[OUTBOUND_SENDER_V2]', msg);
  try {
    const config = await getConfig();
    if (typeof fetch !== 'undefined') {
      fetch(`${config.bridgeEndpoint}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: `[OUTBOUND_SENDER_V2] ${msg}`
      }).catch(() => {});
    }
  } catch (e) {}
}

async function getConfig() {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(DEFAULT_CONFIG, (items) => {
        resolve(items || DEFAULT_CONFIG);
      });
    } else {
      resolve(DEFAULT_CONFIG);
    }
  });
}

function initDedupe() {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['outbound_processed_ids'], (res) => {
      if (res && Array.isArray(res.outbound_processed_ids)) {
        res.outbound_processed_ids.forEach((id) => sentCallIds.add(id));
      }
    });
  }
}
initDedupe();

async function dispatchToBridge(envelope) {
  const config = await getConfig();
  if (!config.enabled) {
    return { success: false, error: 'OUTBOUND_DISABLED: Extensão outbound desabilitada na configuração.' };
  }

  // Validação de segurança do envelope
  if (!envelope || !envelope.call_id || !envelope.sprint_id || !envelope.type || !envelope.payload) {
    return { success: false, error: 'VALIDATION_FAILED: Envelope incompleto.' };
  }

  if (!ALLOWED_TYPES.includes(envelope.type)) {
    return { success: false, error: `TYPE_REJECTED: Tipo '${envelope.type}' não permitido.` };
  }

  // Deduplicação persistente
  if (sentCallIds.has(envelope.call_id)) {
    return { success: true, dedupe_result: 'DUPLICATE_IGNORED', packet_id: `OUTBOUND_${envelope.call_id}` };
  }

  if (typeof chrome !== 'undefined' && chrome.action) {
    chrome.action.setBadgeText({ text: 'SEND' });
    chrome.action.setBadgeBackgroundColor({ color: '#FFA500' });
  }

  const packetId = `OUTBOUND_${envelope.call_id}`;
  const postBody = {
    packet_id: packetId,
    sprint_id: envelope.sprint_id,
    call_id: envelope.call_id,
    type: envelope.type,
    payload: envelope.payload,
    source: 'OUTBOUND_SENDER_V2',
    timestamp: new Date().toISOString()
  };

  try {
    const url = `${config.bridgeEndpoint}/outbound_packet`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(postBody)
    });

    if (!res.ok) {
      throw new Error(`HTTP_${res.status}: Servidor respondeu com código de erro.`);
    }

    const resData = await res.json().catch(() => ({ status: 'UNKNOWN' }));

    // Sucesso confirmado pela Bridge local
    sentCallIds.add(envelope.call_id);
    if (typeof chrome !== 'undefined' && chrome.action) {
      chrome.action.setBadgeText({ text: 'OK' });
      chrome.action.setBadgeBackgroundColor({ color: '#28a745' });
    }

    remoteLog(`Envio concluído com sucesso para Bridge: ${packetId} (ACK recebido)`);

    return {
      success: true,
      packet_id: packetId,
      bridge_ack: true,
      dedupe_result: 'NEW_DELIVERED',
      response: resData
    };
  } catch (err) {
    if (typeof chrome !== 'undefined' && chrome.action) {
      chrome.action.setBadgeText({ text: 'ERR' });
      chrome.action.setBadgeBackgroundColor({ color: '#dc3545' });
    }
    remoteLog(`FALHA ao entregar envelope ${packetId} na Bridge: ${err.message}`);
    return {
      success: false,
      packet_id: packetId,
      error: err.message,
      delivered_to_bridge: false
    };
  }
}

if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message && message.type === 'OUTBOUND_LOG') {
      remoteLog(message.text);
      sendResponse({ ok: true });
      return false;
    }

    if (message && message.type === 'OUTBOUND_ENVELOPE_DETECTED') {
      dispatchToBridge(message.envelope)
        .then((res) => sendResponse(res))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true;
    }
  });
}

if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onInstalled) {
  chrome.runtime.onInstalled.addListener(() => {
    console.log('[OUTBOUND_SENDER_V2] Instalado com sucesso.');
    if (chrome.action) {
      chrome.action.setBadgeText({ text: 'IDLE' });
      chrome.action.setBadgeBackgroundColor({ color: '#6c757d' });
    }
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { dispatchToBridge, ALLOWED_TYPES, DEFAULT_CONFIG };
}
