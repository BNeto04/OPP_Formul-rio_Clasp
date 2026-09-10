/**
 * Syntheon Ponte 1 - Content Script (ChatGPT Tab)
 *
 * Responsabilidade:
 * - Injetar mensagem do Telegram no composer do ChatGPT com submissão automática robusta.
 * - Monitorar o DOM por [CHATGPT_REPLY_V1] e despachar para o background.
 * - Manter heartbeat com o background service worker.
 */

(() => {
  // 0. Rejeição estrita de execução dentro de iframes (apenas frame principal)
  if (typeof window !== 'undefined' && window.self !== window.top) {
    return;
  }

  if (window.__SYNTHEON_PONTE1_CONTENT_INJECTED__) return;
  window.__SYNTHEON_PONTE1_CONTENT_INJECTED__ = true;

  const INSTANCE_ID = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : 'inst_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);

  console.log(`[Ponte1-Content] [INSTANCE_INIT] ID: ${INSTANCE_ID} | URL: ${window.location.href} | is_top: ${window.self === window.top}`);

  const seenReplies = new Set();
  const deliveredMessageIds = new Set();
  const inFlightInjectionIds = new Set();
  let isInjectingCurrently = false;

  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  function getElementText(el) {
    if (!el) return '';
    if (el.tagName.toLowerCase() === 'textarea') return el.value || '';
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

  function setTextIntoElement(el, text, msgId = 'UNKNOWN') {
    console.warn(`[Ponte1-Content] [INJECT_TRACE] { instance_id: "${INSTANCE_ID}", is_top: ${window.self === window.top}, msg_id: "${msgId}", time: ${Date.now()} }`);
    el.focus();
    if (el.tagName && el.tagName.toLowerCase() === 'textarea') {
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
      if (nativeSetter) {
        nativeSetter.call(el, text);
      } else {
        el.value = text;
      }
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }

    if (el.isContentEditable) {
      el.focus();

      // Limpa qualquer seleção e conteúdo anterior
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(el);
      sel.removeAllRanges();
      sel.addRange(range);

      // Inserção ÚNICA e atômica via execCommand ('insertText')
      // Sem ClipboardEvent, sem criação paralela de tags p e sem InputEvent duplicado
      try {
        document.execCommand('insertText', false, text);
      } catch (e) {}

      // Sincronização limpa com o estado do React
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  function clickBtn(btn) {
    btn.focus();
    btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    btn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
    btn.click();
    return true;
  }

  function triggerSubmit(inputEl) {
    const selectors = [
      'button[data-testid="send-button"]',
      'button[data-testid*="send"]',
      'button[aria-label="Send prompt"]',
      'button[aria-label="Send message"]',
      'button[aria-label="Enviar prompt"]',
      'button[aria-label="Enviar mensagem"]',
      'button[aria-label*="Enviar"]',
      'button[aria-label*="Send"]',
      'button[data-testid="fruitjuice-send-button"]'
    ];

    // Aguarda o botão estar realmente habilitado pelo React; NUNCA remove disabled à força
    for (const sel of selectors) {
      const btn = document.querySelector(sel);
      if (btn && !btn.disabled && !btn.getAttribute('aria-disabled')) {
        return clickBtn(btn);
      }
    }

    const container = inputEl ? (inputEl.closest('form') || inputEl.closest('div[class*="composer"]') || inputEl.parentElement?.parentElement) : null;
    if (container) {
      const buttons = Array.from(container.querySelectorAll('button'));
      for (const btn of buttons) {
        const testId = (btn.getAttribute('data-testid') || '').toLowerCase();
        const aria = (btn.getAttribute('aria-label') || '').toLowerCase();
        if (testId.includes('speech') || aria.includes('voz') || aria.includes('voice')) continue;
        if ((testId.includes('send') || aria.includes('enviar') || aria.includes('send')) && !btn.disabled && !btn.getAttribute('aria-disabled')) {
          return clickBtn(btn);
        }
      }
    }
    return false;
  }

  function triggerEnterKey(inputEl) {
    if (!inputEl) return;
    inputEl.focus();
    const eventInit = {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13,
      charCode: 13,
      bubbles: true,
      cancelable: true,
      composed: true
    };
    inputEl.dispatchEvent(new KeyboardEvent('keydown', eventInit));
    inputEl.dispatchEvent(new KeyboardEvent('keypress', eventInit));
    inputEl.dispatchEvent(new KeyboardEvent('keyup', eventInit));
  }

  async function handleInjection(payload, msgId = 'UNKNOWN') {
    const inputEl = findInputElement();
    if (!inputEl) return { success: false, reason: 'INPUT_NOT_FOUND' };

    const current = getElementText(inputEl).trim();
    if (current && !current.includes('[TELEGRAM')) {
      return { success: false, status: 'COMPOSER_BUSY' };
    }

    // 1. Inserção determinística única (sem paste duplo)
    setTextIntoElement(inputEl, payload, msgId);

    let submitted = false;
    // 2. Aguarda o React habilitar o botão de envio (até 3 segundos)
    for (let i = 0; i < 15; i++) {
      await sleep(200);
      submitted = triggerSubmit(inputEl);
      if (submitted) {
        console.log('[Ponte1-Content] Submissão confirmada via botão habilitado.');
        break;
      }
    }

    // 3. Fallback de submissão: apenas se o botão nunca foi habilitado
    if (!submitted) {
      console.log('[Ponte1-Content] Nenhum botão habilitado. Tentando submissão via Enter...');
      triggerEnterKey(inputEl);
      await sleep(300);
    }

    // 4. Verificação de esvaziamento do composer
    for (let i = 0; i < 10; i++) {
      await sleep(200);
      const postText = getElementText(inputEl).trim();
      if (postText === '') {
        console.log('[Ponte1-Content] Sucesso: composer limpo após envio.');
        return { success: true };
      }
    }

    // 5. Limpeza de resíduo garantida pós-envio: elimina qualquer fragmento ou réplica na caixa
    const residual = getElementText(inputEl).trim();
    if (residual.length > 0) {
      console.warn('[Ponte1-Content] Limpando resíduo que permaneceu no composer após envio.');
      if (inputEl.isContentEditable) {
        const sel = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(inputEl);
        sel.removeAllRanges();
        sel.addRange(range);
        document.execCommand('delete', false, null);
        while (inputEl.firstChild) inputEl.removeChild(inputEl.firstChild);
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
      } else if (inputEl.value) {
        inputEl.value = '';
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }

    fallbackEstado = {
      msgId: String(msgId),
      assistentesBase: document.querySelectorAll('div[data-message-author-role="assistant"], div.agent-turn').length,
      textoAnterior: ''
    };

    return { success: true };
  }

  // Trava de lease compartilhada via chrome.storage.local (impede concorrência entre frames/abas)
  async function acquireStorageLease(msgId, ttlMs = 20000) {
    return new Promise(resolve => {
      if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
        return resolve(true);
      }
      const leaseKey = `ponte1_lease_${msgId}`;
      const now = Date.now();

      chrome.storage.local.get([leaseKey, 'ponte1_delivered_ids'], res => {
        const delivered = (res && Array.isArray(res.ponte1_delivered_ids)) ? res.ponte1_delivered_ids : [];
        if (delivered.includes(msgId)) {
          console.warn(`[Ponte1-Content] [LEASE_REJECT] Mensagem ${msgId} já consta entregue no storage compartilhado.`);
          return resolve(false);
        }

        const existing = res ? res[leaseKey] : null;
        if (existing && existing.expires_at > now && existing.holder !== INSTANCE_ID) {
          console.warn(`[Ponte1-Content] [LEASE_COLLISION] Mensagem ${msgId} em execução por outra instância: ${existing.holder}`);
          return resolve(false);
        }

        chrome.storage.local.set({
          [leaseKey]: { holder: INSTANCE_ID, acquired_at: now, expires_at: now + ttlMs }
        }, () => resolve(true));
      });
    });
  }

  async function releaseStorageLease(msgId, markedDelivered = true) {
    return new Promise(resolve => {
      if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
        return resolve();
      }
      const leaseKey = `ponte1_lease_${msgId}`;
      chrome.storage.local.get(['ponte1_delivered_ids'], res => {
        let delivered = (res && Array.isArray(res.ponte1_delivered_ids)) ? res.ponte1_delivered_ids : [];
        if (markedDelivered && !delivered.includes(msgId)) {
          delivered.push(msgId);
        }
        chrome.storage.local.set({
          [leaseKey]: null,
          ponte1_delivered_ids: delivered
        }, () => resolve());
      });
    });
  }

  // 0. Listener de reconciliação pós-restart do service worker para evitar retry cego
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'PONTE1_CHECK_DELIVERED') {
      const msgId = msg.telegram_message_id || msg.packet_id;
      const isDelivered = (msgId && (deliveredMessageIds.has(String(msgId)) || inFlightInjectionIds.has(String(msgId)))) || false;
      sendResponse({ delivered: isDelivered, message_id: msgId });
      return false;
    }
  });

  // 1. Listener para injeção vinda do background
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'PONTE1_INJECT_MESSAGE') {
      const payload = msg.payload || '';

      // Extrai MESSAGE_ID para deduplicação determinística na origem antes de tocar no DOM
      const match = payload.match(/REPLY_TO_MESSAGE_ID:\s*(\d+)/i);
      const msgId = msg.telegram_message_id || msg.packet_id || (match ? match[1] : null);

      console.log(`[Ponte1-Content] [MSG_RECEIVED] msg_id: ${msgId} | sender frameId: ${sender?.frameId} | instance: ${INSTANCE_ID}`);

      // Regra 0: Deduplicação síncrona imediata no content script
      if (msgId && (deliveredMessageIds.has(String(msgId)) || inFlightInjectionIds.has(String(msgId)))) {
        console.log('[Ponte1-Content] DEDUPE_NO_OP: Mensagem do Telegram', msgId, 'já em injeção ou entregue anteriormente no ChatGPT.');
        sendResponse({ success: true, status: 'DEDUPE_NO_OP', message_id: msgId });
        return false;
      }

      // Trava de exclusão mútua: impede injeções concorrentes no mesmo composer
      if (isInjectingCurrently) {
        console.warn('[Ponte1-Content] COMPOSER_BUSY: Injeção já em andamento no DOM.');
        sendResponse({ success: false, status: 'COMPOSER_BUSY', reason: 'INJECTION_IN_PROGRESS' });
        return false;
      }

      // Verificação de geração ativa: se o ChatGPT está gerando resposta (botão stop ativo), aguardar
      const stopBtn = document.querySelector('button[data-testid="stop-button"], button[aria-label*="Stop"], button[aria-label*="Parar"]');
      if (stopBtn) {
        console.warn('[Ponte1-Content] COMPOSER_BUSY: ChatGPT está gerando resposta ativa. Injeção adiada.');
        sendResponse({ success: false, status: 'COMPOSER_BUSY', reason: 'CHATGPT_GENERATING' });
        return false;
      }

      // Rejeição estrita de eco técnico [BRIDGE_TO_ANTIGRAVITY_V1]
      if (payload.includes('[BRIDGE_TO_ANTIGRAVITY_V1]')) {
        console.warn('[Ponte1-Content] ECHO_NO_OP: Envelope técnico [BRIDGE_TO_ANTIGRAVITY_V1] descartado na Ponte 1.');
        sendResponse({ success: false, status: 'ECHO_NO_OP', error: 'ECHO_NO_OP' });
        return false;
      }

      // Trava de lease compartilhada via storage antes de tocar no DOM
      if (msgId) inFlightInjectionIds.add(String(msgId));
      isInjectingCurrently = true;

      acquireStorageLease(String(msgId)).then(hasLease => {
        if (!hasLease) {
          sendResponse({ success: true, status: 'DEDUPE_NO_OP', reason: 'STORAGE_LEASE_REJECT', message_id: msgId });
          return;
        }

        handleInjection(payload, String(msgId)).then(async res => {
          if (res && res.success && msgId) {
            deliveredMessageIds.add(String(msgId));
          }
          await releaseStorageLease(String(msgId), res && res.success);
          sendResponse(res);
        });
      }).finally(() => {
        isInjectingCurrently = false;
        if (msgId) inFlightInjectionIds.delete(String(msgId));
      });
      return true; // async
    }
  });

  // FALLBACK DE CAPTURA (10/09/2026): se o ChatGPT responder FORA do envelope
  // [CHATGPT_REPLY_V1], a ultima mensagem do assistente e despachada mesmo assim.
  // Guarda: so captura se surgiu mensagem NOVA depois da injecao e se o texto ficou
  // estavel entre dois scans (evita capturar resposta ainda em streaming).
  let fallbackEstado = { msgId: null, assistentesBase: 0, textoAnterior: '' };

  // Outbound: Monitora respostas do ChatGPT no DOM
  function scanAssistantReplies() {
    const containers = document.querySelectorAll('div[data-message-author-role="assistant"], div.agent-turn');
    for (const container of containers) {
      const text = container.innerText || container.textContent || '';
      const startTag = '[CHATGPT_REPLY_V1]';
      const endTag = '[/CHATGPT_REPLY_V1]';
      const sIdx = text.indexOf(startTag);
      if (sIdx !== -1) {
        const eIdx = text.indexOf(endTag, sIdx);
        if (eIdx !== -1) {
          const body = text.substring(sIdx + startTag.length, eIdx).trim();
          const msgMatch = body.match(/REPLY_TO_MESSAGE_ID:\s*(\d+)/i);
          const payloadMatch = body.match(/PAYLOAD:\s*([\s\S]+)/i);

          const replyToId = msgMatch ? msgMatch[1].trim() : null;
          const cleanPayload = payloadMatch ? payloadMatch[1].trim() : body;

          const replyKey = `REPLY_${replyToId}_${cleanPayload.substring(0, 30)}`;
          if (!seenReplies.has(replyKey)) {
            seenReplies.add(replyKey);
            console.log('[Ponte1-Content] Resposta do ChatGPT capturada! Despachando para Telegram:', replyToId);
            chrome.runtime.sendMessage({
              type: 'PONTE1_REPLY_DETECTED',
              reply_to_message_id: replyToId,
              payload: cleanPayload
            });
            fallbackEstado = { msgId: null, assistentesBase: 0, textoAnterior: '' };
          }
        }
      }
    }

    // FALLBACK: ChatGPT respondeu sem o envelope -> usa a ultima mensagem do assistente,
    // desde que seja NOVA (posterior a injecao) e esteja estavel entre dois scans.
    if (fallbackEstado.msgId) {
      const lista = document.querySelectorAll('div[data-message-author-role="assistant"], div.agent-turn');
      if (lista.length > fallbackEstado.assistentesBase) {
        const ultimo = lista[lista.length - 1];
        const texto = ((ultimo.innerText || ultimo.textContent || '') + '').trim().substring(0, 4000);
        const ehEnvelope = texto.includes('[CHATGPT_REPLY_V1]');
        const ehEco = texto.includes('[TELEGRAM de ') || texto.includes('REPLY_TO_MESSAGE_ID:');
        if (texto && !ehEnvelope && !ehEco) {
          if (texto === fallbackEstado.textoAnterior) {
            const replyKey = `REPLY_${fallbackEstado.msgId}_${texto.substring(0, 30)}`;
            const msgIdFallback = fallbackEstado.msgId;
            fallbackEstado = { msgId: null, assistentesBase: 0, textoAnterior: '' };
            if (!seenReplies.has(replyKey)) {
              seenReplies.add(replyKey);
              console.log('[Ponte1-Content] Resposta capturada por FALLBACK (sem envelope). Despachando:', msgIdFallback);
              chrome.runtime.sendMessage({
                type: 'PONTE1_REPLY_DETECTED',
                reply_to_message_id: msgIdFallback,
                payload: texto,
                sem_envelope: true
              });
            }
          } else {
            fallbackEstado.textoAnterior = texto;
          }
        }
      }
    }
  }

  // Loop de monitoramento de saída no DOM a cada 1.5s
  setInterval(scanAssistantReplies, 1500);

  // Heartbeat para manter service worker acordado a cada 2.5s
  setInterval(() => {
    try {
      chrome.runtime.sendMessage({ type: 'PONTE1_HEARTBEAT' }, () => {
        if (chrome.runtime.lastError) {}
      });
    } catch (e) {}
  }, 2500);
})();
