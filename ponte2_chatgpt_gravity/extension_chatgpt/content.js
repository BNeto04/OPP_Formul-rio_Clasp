/**
 * Syntheon Ponte 2 - Content Script (ChatGPT Tab)
 *
 * Responsabilidades Estritas:
 * 1. Outbound (ChatGPT -> Gravity):
 *    - Monitorar o DOM do ChatGPT por envelopes [BRIDGE_TO_ANTIGRAVITY_V1].
 *    - Rejeitar estritamente texto comum ou envelopes não autorizados.
 *    - Extrair CALL_ID, TASK_ID, TYPE (CALL|AUDIT) e PAYLOAD.
 *    - Despachar para o background da Ponte 2.
 * 2. Inbound (Gravity -> ChatGPT):
 *    - Receber [BRIDGE_FROM_ANTIGRAVITY_V1] (RESULT / ACK técnico) do background.
 *    - Injetar no composer do ChatGPT com execCommand('insertText') e submissão automática.
 * 3. Heartbeat com o service worker.
 */

(() => {
  // 0. Rejeição estrita de execução dentro de iframes (apenas frame principal)
  if (typeof window !== 'undefined' && window.self !== window.top) {
    return;
  }

  if (window.__SYNTHEON_PONTE2_CONTENT_INJECTED__) return;
  window.__SYNTHEON_PONTE2_CONTENT_INJECTED__ = true;

  const INSTANCE_ID = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : 'inst_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);

  console.log(`[Ponte2-Content] [INSTANCE_INIT] ID: ${INSTANCE_ID} | URL: ${window.location.href} | is_top: ${window.self === window.top}`);

  const seenCallIds = new Set();
  const ALLOWED_OUTBOUND_TYPES = new Set(['CALL', 'AUDIT']);

  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  function getElementText(el) {
    if (!el) return '';
    if (el.tagName && el.tagName.toLowerCase() === 'textarea') return el.value || '';
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

  function setTextIntoElement(el, text, callId = 'UNKNOWN') {
    console.warn(`[Ponte2-Content] [INJECT_TRACE] { instance_id: "${INSTANCE_ID}", is_top: ${window.self === window.top}, call_id: "${callId}", time: ${Date.now()} }`);
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

    const form = inputEl ? inputEl.closest('form') : document.querySelector('form');
    if (form && typeof form.requestSubmit === 'function') {
      try {
        form.requestSubmit();
        return true;
      } catch (e) {}
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

  async function handleInjection(payload, callId = 'UNKNOWN') {
    console.log('[Ponte2-Content] handleInjection acionado para payload de tamanho:', payload.length);
    const inputEl = findInputElement();
    if (!inputEl) {
      console.error('[Ponte2-Content] Campo de entrada (inputEl) não encontrado no DOM!');
      return { success: false, reason: 'INPUT_NOT_FOUND' };
    }

    const current = getElementText(inputEl).trim();
    if (current && !current.includes('[BRIDGE_FROM_ANTIGRAVITY')) {
      console.warn('[Ponte2-Content] Composer ocupado com outro texto.');
      return { success: false, status: 'COMPOSER_BUSY' };
    }

    // 1. Inserção determinística única (sem paste duplo)
    setTextIntoElement(inputEl, payload, callId);

    let submitted = false;
    // 2. Aguarda o React habilitar o botão de envio (até 3 segundos)
    for (let i = 0; i < 15; i++) {
      await sleep(200);
      submitted = triggerSubmit(inputEl);
      if (submitted) {
        console.log('[Ponte2-Content] Submissão confirmada via botão habilitado.');
        break;
      }
    }

    // 3. Fallback de submissão: apenas se o botão nunca foi habilitado
    if (!submitted) {
      console.log('[Ponte2-Content] Nenhum botão habilitado. Tentando submissão via Enter...');
      triggerEnterKey(inputEl);
      await sleep(300);
    }

    // 4. Verificação de esvaziamento do composer
    for (let i = 0; i < 10; i++) {
      await sleep(200);
      const postText = getElementText(inputEl).trim();
      if (postText === '') {
        console.log('[Ponte2-Content] Sucesso: composer limpo após envio.');
        return { success: true };
      }
    }

    // 5. Limpeza de resíduo garantida: se o ChatGPT enviou mas deixou fragmento ou réplica na caixa, limpa automaticamente
    const residual = getElementText(inputEl).trim();
    if (residual.length > 0) {
      console.warn('[Ponte2-Content] Limpando resíduo que permaneceu no composer após envio.');
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

    return { success: true };
  }

  const deliveredResultIds = new Set();
  const inFlightInjectionIds = new Set();
  let isInjectingCurrently = false;

  // Trava de lease compartilhada via chrome.storage.local (impede concorrência entre frames/abas)
  async function acquireStorageLease(callId, ttlMs = 20000) {
    return new Promise(resolve => {
      if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
        return resolve(true);
      }
      const leaseKey = `ponte2_lease_${callId}`;
      const now = Date.now();

      chrome.storage.local.get([leaseKey, 'ponte2_delivered_ids'], res => {
        const delivered = (res && Array.isArray(res.ponte2_delivered_ids)) ? res.ponte2_delivered_ids : [];
        if (delivered.includes(callId)) {
          console.warn(`[Ponte2-Content] [LEASE_REJECT] RESULT ${callId} já consta entregue no storage compartilhado.`);
          return resolve(false);
        }

        const existing = res ? res[leaseKey] : null;
        if (existing && existing.expires_at > now && existing.holder !== INSTANCE_ID) {
          console.warn(`[Ponte2-Content] [LEASE_COLLISION] RESULT ${callId} em execução por outra instância: ${existing.holder}`);
          return resolve(false);
        }

        chrome.storage.local.set({
          [leaseKey]: { holder: INSTANCE_ID, acquired_at: now, expires_at: now + ttlMs }
        }, () => resolve(true));
      });
    });
  }

  async function releaseStorageLease(callId, markedDelivered = true) {
    return new Promise(resolve => {
      if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
        return resolve();
      }
      const leaseKey = `ponte2_lease_${callId}`;
      chrome.storage.local.get(['ponte2_delivered_ids'], res => {
        let delivered = (res && Array.isArray(res.ponte2_delivered_ids)) ? res.ponte2_delivered_ids : [];
        if (markedDelivered && !delivered.includes(callId)) {
          delivered.push(callId);
        }
        chrome.storage.local.set({
          [leaseKey]: null,
          ponte2_delivered_ids: delivered
        }, () => resolve());
      });
    });
  }

  // 0. Listener de reconciliação para evitar retry cego pós-restart do service worker
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'PONTE2_CHECK_DELIVERED') {
      const callId = msg.call_id;
      const isDelivered = (callId && (deliveredResultIds.has(callId) || inFlightInjectionIds.has(callId))) || false;
      sendResponse({ delivered: isDelivered, call_id: callId });
      return false;
    }
  });

  // 1. Inbound listener (Injeção de RESULT / ACK do Gravity)
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'PONTE2_INJECT_RESULT') {
      const payload = msg.payload || '';
      const callId = msg.call_id || null;

      console.log(`[Ponte2-Content] [MSG_RECEIVED] call_id: ${callId} | sender frameId: ${sender?.frameId} | instance: ${INSTANCE_ID}`);

      // Regra 0: Deduplicação determinística síncrona imediata no content script
      if (callId && (deliveredResultIds.has(callId) || inFlightInjectionIds.has(callId))) {
        console.log('[Ponte2-Content] DEDUPE_NO_OP: RESULT', callId, 'já em injeção ou entregue anteriormente no ChatGPT.');
        sendResponse({ success: true, status: 'DEDUPE_NO_OP', call_id: callId });
        return false;
      }

      // Trava de exclusão mútua: impede injeções concorrentes no mesmo composer
      if (isInjectingCurrently) {
        console.warn('[Ponte2-Content] COMPOSER_BUSY: Injeção já em andamento no DOM.');
        sendResponse({ success: false, status: 'COMPOSER_BUSY', reason: 'INJECTION_IN_PROGRESS' });
        return false;
      }

      // Verificação de geração ativa: se o ChatGPT está gerando resposta (botão stop ativo), aguardar
      const stopBtn = document.querySelector('button[data-testid="stop-button"], button[aria-label*="Stop"], button[aria-label*="Parar"]');
      if (stopBtn) {
        console.warn('[Ponte2-Content] COMPOSER_BUSY: ChatGPT está gerando resposta ativa. Injeção adiada.');
        sendResponse({ success: false, status: 'COMPOSER_BUSY', reason: 'CHATGPT_GENERATING' });
        return false;
      }

      // Regra 1: Impedir eco de [BRIDGE_TO_ANTIGRAVITY_V1] de volta ao ChatGPT
      if (payload.includes('[BRIDGE_TO_ANTIGRAVITY_V1]')) {
        console.warn('[Ponte2-Content] ECHO_NO_OP: Rejeitado eco de [BRIDGE_TO_ANTIGRAVITY_V1] de volta ao ChatGPT!');
        sendResponse({ success: false, status: 'ECHO_NO_OP', error: 'ECHO_NO_OP', call_id: callId });
        return false;
      }

      // Regra 2: Inbound do ChatGPT aceita apenas [BRIDGE_FROM_ANTIGRAVITY_V1]
      if (!payload.includes('[BRIDGE_FROM_ANTIGRAVITY_V1]')) {
        console.error('[Ponte2-Content] REJEITADO: Inbound do ChatGPT aceita apenas envelopes [BRIDGE_FROM_ANTIGRAVITY_V1]!');
        sendResponse({ success: false, status: 'INVALID_INBOUND_ENVELOPE', error: 'INVALID_INBOUND_ENVELOPE' });
        return false;
      }

      // Trava de lease compartilhada via storage antes de tocar no DOM
      if (callId) inFlightInjectionIds.add(callId);
      isInjectingCurrently = true;

      acquireStorageLease(callId).then(hasLease => {
        if (!hasLease) {
          sendResponse({ success: true, status: 'DEDUPE_NO_OP', reason: 'STORAGE_LEASE_REJECT', call_id: callId });
          return;
        }

        handleInjection(payload, callId).then(async res => {
          if (res && res.success && callId) {
            deliveredResultIds.add(callId);
          }
          await releaseStorageLease(callId, res && res.success);
          sendResponse(res);
        });
      }).finally(() => {
        isInjectingCurrently = false;
        if (callId) inFlightInjectionIds.delete(callId);
      });
      return true; // async
    }
  });

  // 2. Outbound scanner (Varredura de CALLs do ChatGPT)
  function scanAssistantCalls() {
    const containers = document.querySelectorAll('div[data-message-author-role="assistant"], div.agent-turn');
    for (const container of containers) {
      const text = container.innerText || container.textContent || '';
      const startTag = '[BRIDGE_TO_ANTIGRAVITY_V1]';
      const endTag = '[/BRIDGE_TO_ANTIGRAVITY_V1]';
      const sIdx = text.indexOf(startTag);
      if (sIdx !== -1) {
        const eIdx = text.indexOf(endTag, sIdx);
        if (eIdx !== -1) {
          const body = text.substring(sIdx + startTag.length, eIdx).trim();
          const callMatch = body.match(/CALL_ID:\s*([^\r\n]+)/i);
          const taskMatch = body.match(/TASK_ID:\s*([^\r\n]+)/i);
          const typeMatch = body.match(/TYPE:\s*([^\r\n]+)/i);
          const payloadMatch = body.match(/(?:PAYLOAD|BODY):\s*([\s\S]+)/i);

          const callId = callMatch ? callMatch[1].trim() : null;
          const taskId = taskMatch ? taskMatch[1].trim() : null;
          const type = typeMatch ? typeMatch[1].trim().toUpperCase() : 'CALL';
          const payload = payloadMatch ? payloadMatch[1].trim() : body;

          if (!callId) continue;
          if (!ALLOWED_OUTBOUND_TYPES.has(type)) continue;

          if (!seenCallIds.has(callId)) {
            seenCallIds.add(callId);
            console.log('[Ponte2-Content] Nova CALL detectada no ChatGPT! Despachando:', callId, type);
            chrome.runtime.sendMessage({
              type: 'PONTE2_CALL_DETECTED',
              call: {
                call_id: callId,
                task_id: taskId,
                type: type,
                payload: payload,
                detected_at: new Date().toISOString()
              }
            });
          }
        }
      }
    }
  }

  // Monitora a cada 1.5s
  setInterval(scanAssistantCalls, 1500);

  // Heartbeat com o Service Worker a cada 2.5s
  setInterval(() => {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
        chrome.runtime.sendMessage({ type: 'PONTE2_HEARTBEAT' }, () => {
          void chrome.runtime.lastError;
        });
      }
    } catch (e) {}
  }, 2500);
})();
