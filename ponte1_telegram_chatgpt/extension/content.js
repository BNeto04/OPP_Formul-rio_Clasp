/**
 * Syntheon Ponte 1 - Content Script (ChatGPT Tab)
 *
 * Responsabilidade:
 * - Injetar mensagem do Telegram no composer do ChatGPT com submissão automática robusta.
 * - Monitorar o DOM por [CHATGPT_REPLY_V1] e despachar para o background.
 * - Manter heartbeat com o background service worker.
 */

(() => {
  if (window.__SYNTHEON_PONTE1_CONTENT_INJECTED__) return;
  window.__SYNTHEON_PONTE1_CONTENT_INJECTED__ = true;

  console.log('[Ponte1-Content] Ativo e monitorando chatgpt.com');

  const seenReplies = new Set();

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
    if (current && !current.includes('[TELEGRAM')) {
      return { success: false, status: 'COMPOSER_BUSY' };
    }

    setTextIntoElement(inputEl, payload);

    let submitted = false;
    for (let i = 0; i < 8; i++) {
      await sleep(250);
      submitted = triggerSubmit(inputEl);
      if (submitted) {
        return { success: true };
      }
    }

    // Fallback: somente se nenhum botão submeteu
    if (!submitted) {
      triggerEnterKey(inputEl);
      await sleep(300);
      const postSubmit = triggerSubmit(inputEl);
      if (postSubmit) {
        return { success: true };
      }
    }

    return { success: true };
  }

  // Listener para injeção vinda do background
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'PONTE1_INJECT_MESSAGE') {
      handleInjection(msg.payload).then(res => sendResponse(res));
      return true; // async
    }
  });

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
