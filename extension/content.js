(() => {
  if (window.__SYNTHEON_CARRIER_INJECTED__) {
    console.log('[BridgeV2-Content] Script já ativo nesta aba; evitando reinjeção duplicada.');
    return;
  }
  window.__SYNTHEON_CARRIER_INJECTED__ = true;

  function remoteLog(msg) {
    console.log('[BridgeV2-Content]', msg);
    try {
      chrome.runtime.sendMessage({ type: 'LOG', text: `[CONTENT] ${msg}` });
    } catch (e) {}
  }

  remoteLog(`Script de injeção ativo na aba: ${window.location.href}`);

  let contentLastPacketId = null;
  let isInjecting = false;

async function checkBridgeFromContent() {
  if (isInjecting) return;
  try {
    const res = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'POLL_BRIDGE' }, (response) => {
        if (chrome.runtime.lastError) {
          resolve(null);
        } else {
          resolve(response);
        }
      });
    });

    if (res && res.packet && res.packet.packet_id && res.packet.packet_id !== contentLastPacketId) {
      isInjecting = true;
      contentLastPacketId = res.packet.packet_id;
      remoteLog(`🎯 [CONTENT] Novo pacote identificado: ${res.packet.packet_id}. Disparando injeção no prompt!`);
      const result = await handleInjection(res.packet.packet_id, res.packet.payload, true);
      if (result && result.success) {
        chrome.runtime.sendMessage({ type: 'PACKET_DELIVERED', packet_id: res.packet.packet_id });
        remoteLog(`🎉 [CONTENT] Injeção e envio concluídos com sucesso para ${res.packet.packet_id}`);
      }
      isInjecting = false;
    }
  } catch (err) {
    isInjecting = false;
    remoteLog(`[CONTENT] Erro no ciclo de polling do content script: ${err.message}`);
  }
}

// Inicia polling ativo na aba do ChatGPT a cada 2,5 segundos
setInterval(checkBridgeFromContent, 2500);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'INJECT_CONTEXT_PACKET') {
    remoteLog(`Recebida mensagem INJECT_CONTEXT_PACKET para pacote ${message.packet_id}`);
    handleInjection(message.packet_id, message.payload, message.autoSubmit)
      .then((res) => {
        remoteLog(`Injeção concluída com sucesso para pacote ${message.packet_id}`);
        sendResponse(res);
      })
      .catch((err) => {
        remoteLog(`Erro na injeção do pacote ${message.packet_id}: ${err.message}`);
        sendResponse({ success: false, error: err.message });
      });
    return true; // Mantém o canal aberto para resposta assíncrona
  }
});

async function handleInjection(packetId, textPayload, autoSubmit) {
  console.log(`[BridgeV2-Content] Recebido pacote ${packetId} para injeção.`);

  // 1. Aguarda caso o ChatGPT esteja atualmente gerando resposta (botão de parar visível)
  await waitForIdle();

  // 2. Localiza o elemento de entrada
  const inputEl = findInputElement();
  if (!inputEl) {
    throw new Error('Elemento de entrada do ChatGPT não encontrado na página.');
  }

  // 3. Foca e injeta o texto
  inputEl.focus();
  setTextIntoElement(inputEl, textPayload);

  // 4. Se autoSubmit estiver ativo, dispara o envio após breve pausa para renderização
  if (autoSubmit) {
    await sleep(400);
    const sent = triggerSubmit(inputEl);
    if (!sent) {
      console.warn('[BridgeV2-Content] Botão de envio não clicável imediatamente; tentando envio via Enter.');
      triggerEnterKey(inputEl);
    }
  }

  return {
    success: true,
    packet_id: packetId,
    timestamp: new Date().toISOString()
  };
}

function findInputElement() {
  // Procura pelo ID padrão do ChatGPT (div contenteditable ou textarea)
  const byId = document.getElementById('prompt-textarea');
  if (byId) return byId;

  // Seletores alternativos do ProseMirror / React
  const selectors = [
    'div[contenteditable="true"][data-placeholder]',
    'div[contenteditable="true"]#prompt-textarea',
    'div.ProseMirror[contenteditable="true"]',
    'textarea[data-id="root"]',
    'textarea'
  ];

  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) return el;
  }

  return null;
}

function setTextIntoElement(el, text) {
  if (el.tagName.toLowerCase() === 'textarea') {
    el.value = text;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  } else if (el.isContentEditable) {
    // Para elementos contenteditable (ProseMirror do ChatGPT moderno)
    el.focus();
    // Limpa conteúdo prévio
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }
    // Cria parágrafo formatado
    const lines = text.split('\n');
    lines.forEach((line) => {
      const p = document.createElement('p');
      if (line.trim() === '') {
        p.appendChild(document.createElement('br'));
      } else {
        p.textContent = line;
      }
      el.appendChild(p);
    });

    // Notifica o ProseMirror/React sobre a mudança
    el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
  }
}

function triggerSubmit(inputEl) {
  const submitSelectors = [
    'button[data-testid="send-button"]',
    'button[aria-label="Send prompt"]',
    'button[aria-label="Enviar prompt"]',
    'button[data-testid="fruitjuice-send-button"]',
    'button.mb-1'
  ];

  for (const sel of submitSelectors) {
    const btn = document.querySelector(sel);
    if (btn && !btn.disabled) {
      btn.click();
      console.log('[BridgeV2-Content] Botão de envio clicado com sucesso:', sel);
      return true;
    }
  }

  return false;
}

function triggerEnterKey(inputEl) {
  const enterDown = new KeyboardEvent('keydown', {
    key: 'Enter',
    code: 'Enter',
    keyCode: 13,
    which: 13,
    bubbles: true,
    cancelable: true
  });
  inputEl.dispatchEvent(enterDown);
}

async function waitForIdle(maxWaitMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const stopBtn = document.querySelector('button[data-testid="stop-button"], button[aria-label="Stop generating"], button[aria-label="Parar de gerar"]');
    if (!stopBtn) {
      return;
    }
    await sleep(500);
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
})();
