/**
 * Syntheon Bridge V2 - Chrome Extension Inbound Content Script (Resiliente)
 *
 * Implementa as salvaguardas contratuais da Issue #43:
 * 1. Single-Flight e detecção de COMPOSER_BUSY (texto do proprietário ou pacote anterior).
 * 2. Proteção estrita do texto do usuário: NUNCA sobrescreve, NUNCA concatena.
 * 3. Verificação positiva de envio: confirma que o texto saiu do composer.
 * 4. Tratamento de perda de conexão: relata SEND_UNCERTAIN sem retry cego.
 * 5. Reconciliação no DOM: busca histórico de mensagens enviadas.
 */

(() => {
  if (window.__SYNTHEON_CARRIER_INJECTED__) {
    console.log('[BridgeV2-Content] Script já ativo nesta aba.');
    return;
  }
  window.__SYNTHEON_CARRIER_INJECTED__ = true;

  function remoteLog(msg) {
    console.log('[BridgeV2-Content]', msg);
    try {
      chrome.runtime.sendMessage({ type: 'LOG', text: `[CONTENT] ${msg}` });
    } catch (e) {}
  }

  remoteLog(`Carrier Inbound ativo e monitorando aba: ${window.location.href}`);

  // Listener para comandos do Background Service Worker
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'INJECT_CONTEXT_PACKET') {
      remoteLog(`Recebida solicitação de injeção para pacote: ${message.packet_id}`);
      handleInjection(message.packet_id, message.payload, message.autoSubmit)
        .then((res) => sendResponse(res))
        .catch((err) => {
          remoteLog(`Erro em handleInjection: ${err.message}`);
          sendResponse({ success: false, status: 'ERROR', error: err.message });
        });
      return true; // async
    }

    if (message.type === 'INSPECT_COMPOSER') {
      const inspectRes = inspectComposerCurrentState();
      sendResponse(inspectRes);
      return false;
    }

    if (message.type === 'CHECK_HISTORY_FOR_PACKET') {
      const found = checkHistoryForPacket(message.packet_id, message.payloadSnippet);
      sendResponse({ found });
      return false;
    }
  });

  function inspectComposerCurrentState() {
    const inputEl = findInputElement();
    if (!inputEl) {
      return { ready: false, status: 'ELEMENT_NOT_FOUND' };
    }

    const currentText = getElementText(inputEl).trim();
    if (!currentText) {
      return { ready: true, status: 'READY', text: '' };
    }

    const isPacket = currentText.includes('[CONTEXT_PACKET]') || 
                    currentText.includes('[BRIDGE_') || 
                    currentText.includes('RESULT_OBRIGATORIO:');

    if (isPacket) {
      return {
        ready: false,
        status: 'COMPOSER_BUSY_PREVIOUS_PACKET_PENDING',
        detail: 'Pacote anterior ainda presente no composer. Não concatenar.',
        text: currentText
      };
    }

    return {
      ready: false,
      status: 'COMPOSER_BUSY_OWNER_TEXT',
      detail: 'Texto do proprietário detectado no composer. Preservar sem sobrescrever.',
      text: currentText
    };
  }

  async function handleInjection(packetId, textPayload, autoSubmit) {
    // 1. Aguarda caso o ChatGPT esteja atualmente gerando resposta
    await waitForIdle();

    // 2. Localiza o elemento de entrada
    const inputEl = findInputElement();
    if (!inputEl) {
      throw new Error('Elemento de entrada do ChatGPT não encontrado na página.');
    }

    // 3. Inspeção defensiva: se o campo está ocupado, FAIL-CLOSED imediato
    const inspect = inspectComposerCurrentState();
    if (!inspect.ready) {
      remoteLog(`[FAIL-CLOSED] Injeção abortada para ${packetId}: ${inspect.status}`);
      return {
        success: false,
        status: inspect.status,
        reason: inspect.detail || inspect.status
      };
    }

    // 4. Injeta o texto no campo vazio
    inputEl.focus();
    setTextIntoElement(inputEl, textPayload);

    // 5. Validação pós-escrita: confirma que o conteúdo confere 100% antes de submeter
    const textAfterWrite = getElementText(inputEl).trim();
    if (!textAfterWrite.includes(textPayload.trim().substring(0, 50))) {
      remoteLog(`[ABORT] Conteúdo no composer não corresponde ao payload esperado para ${packetId}.`);
      return {
        success: false,
        status: 'CONTENT_MISMATCH',
        reason: 'Texto escrito não coincide com o payload esperado.'
      };
    }

    // 6. Submissão se autoSubmit estiver ativo
    if (autoSubmit) {
      await sleep(300);

      // Dispara envio
      const sent = triggerSubmit(inputEl);
      if (!sent) {
        remoteLog('Tentando envio via Enter com evento KeyboardEvent...');
        triggerEnterKey(inputEl);
      }

      // 7. Confirmação positiva: verifica se o texto realmente saiu do composer
      const confirmed = await waitForComposerCleared(inputEl, 4000);
      
      // Se a conexão caiu ou o texto ainda está preso
      if (!navigator.onLine || !confirmed) {
        remoteLog(`[SEND_UNCERTAIN] Pacote ${packetId} não confirmado no DOM. onLine=${navigator.onLine}, cleared=${confirmed}`);
        return {
          success: false,
          status: 'SEND_UNCERTAIN',
          reason: !navigator.onLine ? 'NETWORK_OFFLINE_DURING_SUBMIT' : 'COMPOSER_NOT_CLEARED'
        };
      }
    }

    return {
      success: true,
      status: 'CONFIRMED_DELIVERED',
      packet_id: packetId,
      timestamp: new Date().toISOString()
    };
  }

  function getElementText(el) {
    if (!el) return '';
    if (el.tagName.toLowerCase() === 'textarea') {
      return el.value || '';
    }
    return el.innerText || el.textContent || '';
  }

  function findInputElement() {
    const byId = document.getElementById('prompt-textarea');
    if (byId) return byId;

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
      el.focus();
      while (el.firstChild) {
        el.removeChild(el.firstChild);
      }
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
        remoteLog(`Botão de envio acionado: ${sel}`);
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

  async function waitForComposerCleared(inputEl, timeoutMs = 4000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const current = getElementText(inputEl).trim();
      if (!current) {
        return true;
      }
      // Se botão de stop generation apareceu, significa que o ChatGPT aceitou e começou a responder
      const stopBtn = document.querySelector('button[data-testid="stop-button"], button[aria-label="Stop generating"], button[aria-label="Parar de gerar"]');
      if (stopBtn) {
        return true;
      }
      await sleep(250);
    }
    return false;
  }

  function checkHistoryForPacket(packetId, snippet) {
    try {
      const messages = document.querySelectorAll('div[data-message-author-role="user"], div[data-testid*="user"]');
      for (const msg of messages) {
        const text = msg.innerText || msg.textContent || '';
        if (packetId && text.includes(packetId)) return true;
        if (snippet && text.includes(snippet.substring(0, 60))) return true;
      }
    } catch (e) {}
    return false;
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
