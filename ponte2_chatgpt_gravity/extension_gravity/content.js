/**
 * Syntheon Ponte 2 - Content Script (Gravity Carrier)
 *
 * Responsabilidades Estritas:
 * 1. Inbound (ChatGPT -> Gravity):
 *    - Receber CALL do background e injetar no composer do Antigravity.
 *    - Submeter automaticamente exatamente uma vez.
 * 2. Outbound (Gravity -> ChatGPT):
 *    - Monitorar a saída do Antigravity por envelopes de RESULT.
 *    - Despachar para o background da Ponte 2 para envio ao ChatGPT.
 * 3. Heartbeat com o service worker.
 */

(() => {
  // 0. Isolamento Estrito: extension_gravity NUNCA deve executar em páginas do ChatGPT ou dentro de iframes
  if (typeof window !== 'undefined' && window.location && (window.location.hostname.includes('chatgpt.com') || window.location.hostname.includes('openai.com'))) {
    return;
  }
  if (typeof window !== 'undefined' && window.self !== window.top) {
    return;
  }

  if (window.__SYNTHEON_PONTE2_GRAVITY_CONTENT_INJECTED__) return;
  window.__SYNTHEON_PONTE2_GRAVITY_CONTENT_INJECTED__ = true;

  const INSTANCE_ID = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : 'inst_grav_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);

  console.log(`[Ponte2-Gravity-Content] [INSTANCE_INIT] ID: ${INSTANCE_ID} | URL: ${window.location.href} | is_top: ${window.self === window.top}`);

  const seenResultIds = new Set();

  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  function getElementText(el) {
    if (!el) return '';
    if (el.tagName && el.tagName.toLowerCase() === 'textarea') return el.value || '';
    return el.innerText || el.textContent || '';
  }

  function findInputElement() {
    const selectors = [
      'textarea[placeholder*="Prompt"]',
      'textarea[placeholder*="Ask"]',
      'textarea[placeholder*="Message"]',
      'div[contenteditable="true"]',
      'textarea',
      'input[type="text"]'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  function setTextIntoElement(el, text, callId = 'UNKNOWN') {
    console.warn(`[Ponte2-Gravity-Content] [INJECT_TRACE] { instance_id: "${INSTANCE_ID}", is_top: ${window.self === window.top}, call_id: "${callId}", time: ${Date.now()} }`);
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
    } else if (el.isContentEditable) {
      el.focus();

      // Limpa qualquer seleção e conteúdo anterior
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(el);
      sel.removeAllRanges();
      sel.addRange(range);

      // Inserção atômica canônica
      try {
        document.execCommand('insertText', false, text);
      } catch (e) {}

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
      'button[type="submit"]',
      'button[aria-label*="Send"]',
      'button[aria-label*="Enviar"]',
      'button[data-testid*="send"]'
    ];
    for (const sel of selectors) {
      const btn = document.querySelector(sel);
      if (btn) return clickBtn(btn);
    }
    const container = inputEl ? (inputEl.closest('form') || inputEl.parentElement?.parentElement) : null;
    if (container) {
      const buttons = Array.from(container.querySelectorAll('button'));
      if (buttons.length > 0) {
        return clickBtn(buttons[buttons.length - 1]);
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
    const inputEl = findInputElement();
    if (!inputEl) return { success: false, reason: 'INPUT_NOT_FOUND' };

    setTextIntoElement(inputEl, payload, callId);

    let submitted = false;
    for (let i = 0; i < 6; i++) {
      await sleep(200);
      submitted = triggerSubmit(inputEl);
      if (submitted) break;
    }

    if (!submitted) {
      triggerEnterKey(inputEl);
      await sleep(300);
      submitted = triggerSubmit(inputEl);
    }

    triggerEnterKey(inputEl);
    return { success: true };
  }

  // Inbound: recebe CALL do background e injeta
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'PONTE2_GRAVITY_INJECT_CALL') {
      handleInjection(msg.payload, msg.call_id).then(res => sendResponse(res));
      return true; // async
    }
  });

  // Outbound: monitora RESULT produzido na saída do Antigravity
  function scanGravityResults() {
    const tags = [
      { start: '[BRIDGE_FROM_ANTIGRAVITY_V1]', end: '[/BRIDGE_FROM_ANTIGRAVITY_V1]' },
      { start: '[RESULT]', end: '[/RESULT]' }
    ];

    const bodyText = document.body ? (document.body.innerText || '') : '';
    for (const tag of tags) {
      const sIdx = bodyText.indexOf(tag.start);
      if (sIdx !== -1) {
        const eIdx = bodyText.indexOf(tag.end, sIdx);
        if (eIdx !== -1) {
          const body = bodyText.substring(sIdx + tag.start.length, eIdx).trim();
          const callMatch = body.match(/CALL_ID:\s*([^\r\n]+)/i);
          const typeMatch = body.match(/TYPE:\s*([^\r\n]+)/i);
          const payloadMatch = body.match(/(?:PAYLOAD|BODY):\s*([\s\S]+)/i);

          const callId = callMatch ? callMatch[1].trim() : null;
          const type = typeMatch ? typeMatch[1].trim().toUpperCase() : 'RESULT';
          const payload = payloadMatch ? payloadMatch[1].trim() : body;

          if (!callId) continue;

          const resKey = `GRAVITY_RES_${callId}_${payload.substring(0, 30)}`;
          if (!seenResultIds.has(resKey)) {
            seenResultIds.add(resKey);
            console.log('[Ponte2-Gravity-Content] RESULT detectado no Antigravity! Enviando:', callId);
            chrome.runtime.sendMessage({
              type: 'PONTE2_GRAVITY_RESULT_DETECTED',
              result: {
                call_id: callId,
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

  setInterval(scanGravityResults, 1500);

  setInterval(() => {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
        chrome.runtime.sendMessage({ type: 'PONTE2_GRAVITY_HEARTBEAT' }, () => {
          void chrome.runtime.lastError;
        });
      }
    } catch (e) {}
  }, 2500);
})();
