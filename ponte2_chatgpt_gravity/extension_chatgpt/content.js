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
  if (window.__SYNTHEON_PONTE2_CONTENT_INJECTED__) return;
  window.__SYNTHEON_PONTE2_CONTENT_INJECTED__ = true;

  console.log('[Ponte2-Content] Ativo na aba do ChatGPT (Porta 8767)');

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

  function setTextIntoElement(el, text) {
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
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(el);
      sel.removeAllRanges();
      sel.addRange(range);

      let success = false;
      try {
        success = document.execCommand('insertText', false, text);
      } catch (e) {}

      if (!success || !el.textContent || el.textContent.trim() === '') {
        while (el.firstChild) {
          el.removeChild(el.firstChild);
        }
        const lines = text.split('\n');
        lines.forEach(line => {
          const p = document.createElement('p');
          if (line.trim() === '') {
            p.appendChild(document.createElement('br'));
          } else {
            p.textContent = line;
          }
          el.appendChild(p);
        });
        el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  }

  function clickBtn(btn) {
    btn.focus();
    if (btn.disabled) {
      btn.removeAttribute('disabled');
      btn.disabled = false;
    }
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

    for (const sel of selectors) {
      const btn = document.querySelector(sel);
      if (btn) {
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
        if (testId.includes('send') || aria.includes('enviar') || aria.includes('send') || btn.querySelector('svg')) {
          return clickBtn(btn);
        }
      }
      if (buttons.length > 0) {
        const lastBtn = buttons[buttons.length - 1];
        const testId = (lastBtn.getAttribute('data-testid') || '').toLowerCase();
        if (!testId.includes('speech')) {
          return clickBtn(lastBtn);
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

  async function handleInjection(payload) {
    const inputEl = findInputElement();
    if (!inputEl) return { success: false, reason: 'INPUT_NOT_FOUND' };

    const current = getElementText(inputEl).trim();
    if (current && !current.includes('[BRIDGE_FROM_ANTIGRAVITY')) {
      return { success: false, status: 'COMPOSER_BUSY' };
    }

    setTextIntoElement(inputEl, payload);

    let submitted = false;
    for (let i = 0; i < 8; i++) {
      await sleep(250);
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

  // 1. Inbound listener (Injeção de RESULT / ACK do Gravity)
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'PONTE2_INJECT_RESULT') {
      handleInjection(msg.payload).then(res => sendResponse(res));
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
      chrome.runtime.sendMessage({ type: 'PONTE2_HEARTBEAT' }, () => {
        if (chrome.runtime.lastError) {}
      });
    } catch (e) {}
  }, 2500);
})();
