/**
 * Syntheon Bridge V2 - Chrome Extension Background Service Worker
 *
 * Ciclo do Circuito:
 *   ARMED -> Novo Packet Detectado -> DELIVERING -> ChatGPT Envia -> ACK -> ARMED
 *
 * Papel:
 *   Transportador estrito e sem lógica de planejamento.
 *   Consome o endpoint local da Bridge V2 e entrega o CONTEXT_PACKET na aba do ChatGPT.
 */

const DEFAULT_CONFIG = {
  bridgeEndpoint: 'http://127.0.0.1:8765',
  pollIntervalMs: 3000,
  autoSubmit: true,
  enabled: true
};

let currentState = 'ARMED'; // 'ARMED' | 'DELIVERING' | 'PAUSED'
let lastDeliveredPacketId = null;
let pollTimer = null;

async function remoteLog(msg) {
  console.log(msg);
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
    chrome.storage.local.get(DEFAULT_CONFIG, (items) => {
      resolve(items);
    });
  });
}

async function findChatGPTTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({}, (tabs) => {
      if (!tabs || tabs.length === 0) {
        remoteLog('findChatGPTTab: Nenhuma aba aberta no Chrome');
        resolve(null);
        return;
      }
      const gptTabs = tabs.filter((t) => t.url && (t.url.includes('chatgpt.com') || t.url.includes('chat.openai.com')));
      if (gptTabs.length === 0) {
        remoteLog(`findChatGPTTab: 0 abas ChatGPT. Total de abas: ${tabs.length}. URLs: ${tabs.map(t => (t.url || 'sem-url')).slice(0, 5).join(' , ')}`);
        resolve(null);
        return;
      }
      const activeTab = gptTabs.find((t) => t.active);
      const chosen = activeTab || gptTabs[0];
      remoteLog(`findChatGPTTab: Aba ChatGPT ENCONTRADA! id=${chosen.id}, url=${chosen.url}`);
      resolve(chosen);
    });
  });
}

async function checkBridge() {
  const config = await getConfig();
  console.log(`[BG] checkBridge - enabled=${config.enabled}, state=${currentState}, endpoint=${config.bridgeEndpoint}`);
  if (!config.enabled || currentState === 'DELIVERING') {
    console.log('[BG] checkBridge - SAINDO: desabilitado ou em entrega');
    return;
  }

  try {
    const url = `${config.bridgeEndpoint}/context_packet`;
    console.log(`[BG] Fazendo fetch GET ${url}`);
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    });

    console.log(`[BG] fetch retornou status=${res.status}`);

    if (!res.ok) {
      console.log('[BG] Resposta não-ok, saindo');
      return;
    }

    const text = await res.text();
    console.log(`[BG] Corpo da resposta (primeiros 200 chars): ${text.substring(0, 200)}`);

    let data;
    try {
      data = JSON.parse(text);
    } catch (parseErr) {
      console.error('[BG] ERRO ao parsear JSON:', parseErr.message);
      return;
    }

    console.log(`[BG] Dados parseados: packet_id=${data.packet_id}, payload_length=${data.payload ? data.payload.length : 0}`);

    if (!data || !data.packet_id || !data.payload) {
      console.log('[BG] Pacote inválido (sem packet_id ou payload), saindo');
      return;
    }

    if (data.packet_id === lastDeliveredPacketId) {
      console.log(`[BG] Dedupe: ${data.packet_id} já entregue, saindo`);
      return;
    }

    // Pacote novo identificado -> Disparar ciclo de entrega
    console.log(`[BG] 🚀 NOVO PACOTE DETECTADO: ${data.packet_id} - Chamando deliverPacket...`);
    await deliverPacket(data, config);
  } catch (err) {
    console.error(`[BG] ❌ ERRO em checkBridge: ${err.message}`, err.stack);
  }
}

async function deliverPacket(packet, config) {
  console.log(`[BG] deliverPacket INICIANDO para ${packet.packet_id}`);
  currentState = 'DELIVERING';
  chrome.action.setBadgeText({ text: 'DEL' });
  chrome.action.setBadgeBackgroundColor({ color: '#FFA500' });

  const targetTab = await findChatGPTTab();
  if (!targetTab) {
    console.warn('[BG] ❌ Nenhuma aba do ChatGPT encontrada!');
    currentState = 'ARMED';
    chrome.action.setBadgeText({ text: 'WAIT' });
    chrome.action.setBadgeBackgroundColor({ color: '#888888' });
    return;
  }

  console.log(`[BG] ✅ Aba encontrada: id=${targetTab.id}, url=${targetTab.url}`);

  try {
    console.log(`[BG] Enviando INJECT_CONTEXT_PACKET via chrome.tabs.sendMessage para aba ${targetTab.id}...`);
    let response;
    try {
      response = await chrome.tabs.sendMessage(targetTab.id, {
        type: 'INJECT_CONTEXT_PACKET',
        packet_id: packet.packet_id,
        payload: packet.payload,
        autoSubmit: config.autoSubmit
      });
      console.log(`[BG] sendMessage retornou:`, JSON.stringify(response));
    } catch (sendErr) {
      console.error(`[BG] sendMessage FALHOU: ${sendErr.message}`);
      console.log('[BG] Tentando injeção forçada via chrome.scripting...');
      if (chrome.scripting) {
        await chrome.scripting.executeScript({
          target: { tabId: targetTab.id },
          files: ['content.js']
        });
        console.log('[BG] Script reinjetado, aguardando 600ms...');
        await new Promise((r) => setTimeout(r, 600));
        response = await chrome.tabs.sendMessage(targetTab.id, {
          type: 'INJECT_CONTEXT_PACKET',
          packet_id: packet.packet_id,
          payload: packet.payload,
          autoSubmit: config.autoSubmit
        });
        console.log(`[BG] sendMessage pós-reinjeção retornou:`, JSON.stringify(response));
      } else {
        throw sendErr;
      }
    }

    if (response && response.success) {
      lastDeliveredPacketId = packet.packet_id;
      console.log(`[BG] 🎉 PACOTE ${packet.packet_id} ENTREGUE COM SUCESSO!`);

      // Notifica a Bridge local via ACK
      await sendAckToBridge(config.bridgeEndpoint, packet.packet_id);
      console.log(`[BG] ACK enviado para bridge`);

      // Auto-rearm para o próximo ciclo
      currentState = 'ARMED';
      chrome.action.setBadgeText({ text: 'OK' });
      chrome.action.setBadgeBackgroundColor({ color: '#28a745' });
    } else {
      console.error(`[BG] Content script recusou ou falhou:`, JSON.stringify(response));
      currentState = 'ARMED';
      chrome.action.setBadgeText({ text: 'ERR' });
      chrome.action.setBadgeBackgroundColor({ color: '#dc3545' });
    }
  } catch (err) {
    console.error(`[BG] ❌ FALHA TOTAL NA ENTREGA: ${err.message}`, err.stack);
    currentState = 'ARMED';
    chrome.action.setBadgeText({ text: 'ERR' });
    chrome.action.setBadgeBackgroundColor({ color: '#dc3545' });
  }
}

async function sendAckToBridge(endpoint, packetId) {
  try {
    await fetch(`${endpoint}/ack`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        packet_id: packetId,
        source: 'CHROME_EXTENSION_V2',
        delivered_at: new Date().toISOString()
      })
    });
  } catch (err) {
    console.warn('[BridgeV2-Carrier] Aviso: Falha ao enviar ACK para a Bridge:', err.message);
  }
}

function startPolling() {
  if (pollTimer) clearInterval(pollTimer);
  getConfig().then((cfg) => {
    pollTimer = setInterval(checkBridge, cfg.pollIntervalMs);
    chrome.action.setBadgeText({ text: 'ARM' });
    chrome.action.setBadgeBackgroundColor({ color: '#007bff' });
  });
}

async function autoInjectExistingTabs() {
  try {
    const tabs = await new Promise((resolve) => chrome.tabs.query({}, resolve));
    for (const tab of tabs) {
      if (tab.url && (tab.url.includes('chatgpt.com') || tab.url.includes('chat.openai.com'))) {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          });
          remoteLog(`autoInjectExistingTabs: Script injetado com sucesso na aba ${tab.id} (${tab.url})`);
        } catch (e) {
          remoteLog(`autoInjectExistingTabs aviso: ${e.message}`);
        }
      }
    }
  } catch (err) {
    remoteLog(`autoInjectExistingTabs erro: ${err.message}`);
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.type === 'LOG') {
    remoteLog(message.text);
    sendResponse({ ok: true });
    return false;
  }
  if (message && message.type === 'POLL_BRIDGE') {
    getConfig().then(async (config) => {
      try {
        const res = await fetch(`${config.bridgeEndpoint}/context_packet`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          sendResponse({ packet: data });
        } else {
          sendResponse({ packet: null });
        }
      } catch (err) {
        sendResponse({ packet: null });
      }
    });
    return true; // resposta assíncrona
  }
  if (message && message.type === 'PACKET_DELIVERED') {
    getConfig().then((config) => {
      lastDeliveredPacketId = message.packet_id;
      sendAckToBridge(config.bridgeEndpoint, message.packet_id);
      chrome.action.setBadgeText({ text: 'OK' });
      chrome.action.setBadgeBackgroundColor({ color: '#28a745' });
      sendResponse({ ok: true });
    });
    return true;
  }
});

// Clique no ícone da extensão força verificação, injeção e entrega imediatas
chrome.action.onClicked.addListener(async (tab) => {
  remoteLog(`Ícone da extensão clicado na aba id=${tab ? tab.id : '?'}, url=${tab ? tab.url : '?'}`);
  currentState = 'ARMED';
  lastDeliveredPacketId = null; // força reenvio
  await autoInjectExistingTabs();
  await checkBridge();
});

// Inicialização do worker
chrome.runtime.onInstalled.addListener(() => {
  console.log('[BridgeV2-Carrier] Extensão instalada com sucesso.');
  autoInjectExistingTabs();
  startPolling();
});

chrome.runtime.onStartup.addListener(() => {
  autoInjectExistingTabs();
  startPolling();
});

autoInjectExistingTabs();
startPolling();
