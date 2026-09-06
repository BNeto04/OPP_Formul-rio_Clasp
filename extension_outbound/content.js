/**
 * Syntheon Bridge V2 - Antigravity Outbound Sender (Content Script)
 *
 * Responsabilidade Estrita:
 * 1. Observar exclusivamente a saída do ChatGPT na aba ativa.
 * 2. Filtrar SOMENTE blocos envelopados com [BRIDGE_TO_ANTIGRAVITY_V1] ... [/BRIDGE_TO_ANTIGRAVITY_V1].
 * 3. Ignorar completamente qualquer texto comum ou mensagens sem envelope explícito.
 * 4. Despachar o envelope validado ao background service worker para envio à Bridge V2.
 * 5. Deduplicação por call_id para evitar envios duplicados.
 */

(() => {
  if (typeof window !== 'undefined') {
    if (window.__SYNTHEON_OUTBOUND_SENDER_INJECTED__) {
      console.log('[OUTBOUND_SENDER_V2] Content script já carregado nesta aba.');
      return;
    }
    window.__SYNTHEON_OUTBOUND_SENDER_INJECTED__ = true;
  }

  const LOG_PREFIX = '[OUTBOUND_SENDER_V2]';
  const ALLOWED_TYPES = ['CALL', 'MESSAGE', 'AUDIT', 'OWNER_DIRECTIVE', 'CHATGPT_REPLY'];
  const processedCallIds = new Set();

  function remoteLog(msg) {
    console.log(LOG_PREFIX, msg);
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ type: 'OUTBOUND_LOG', text: `${LOG_PREFIX} ${msg}` });
      }
    } catch (e) {}
  }

  if (typeof window !== 'undefined' && window.location) {
    remoteLog(`Outbound content script ativo na aba: ${window.location.href}`);
  }

  // Carrega IDs já processados do storage local da extensão
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['outbound_processed_ids'], (res) => {
        if (res && Array.isArray(res.outbound_processed_ids)) {
          res.outbound_processed_ids.forEach((id) => processedCallIds.add(id));
        }
      });
    }
  } catch (e) {}

  /**
   * Parser e Validador Canônico do Envelope de Saída
   * Retorna { valid: true, envelope: {...} } ou { valid: false, error: '...' } ou null se não contiver envelope
   */
  function parseOutboundEnvelope(rawText) {
    if (!rawText || typeof rawText !== 'string') return null;

    // 1. Envelope de Conversa (Data Plane): [CHATGPT_REPLY_V1] ou [CHATGPT_REPLY]
    let replyStart = rawText.indexOf('[CHATGPT_REPLY_V1]');
    let replyEndTag = '[/CHATGPT_REPLY_V1]';
    let replyTagLen = '[CHATGPT_REPLY_V1]'.length;

    if (replyStart === -1) {
      replyStart = rawText.indexOf('[CHATGPT_REPLY]');
      replyEndTag = '[/CHATGPT_REPLY]';
      replyTagLen = '[CHATGPT_REPLY]'.length;
    }

    if (replyStart !== -1) {
      const replyEnd = rawText.indexOf(replyEndTag, replyStart);
      if (replyEnd !== -1) {
        const body = rawText.substring(replyStart + replyTagLen, replyEnd).trim();
        const evtMatch = body.match(/REPLY_TO_EVENT_ID:\s*([^\r\n]+)/i);
        const msgMatch = body.match(/REPLY_TO_MESSAGE_ID:\s*([^\r\n]+)/i);
        const payloadMatch = body.match(/(?:PAYLOAD|TEXT):\s*([\s\S]+)/i);

        const reply_to_event_id = evtMatch ? evtMatch[1].trim() : null;
        const reply_to_message_id = msgMatch ? msgMatch[1].trim() : null;
        const payload = payloadMatch ? payloadMatch[1].trim() : body;
        const call_id = `REPLY_${reply_to_event_id || reply_to_message_id || Date.now()}`;

        return {
          valid: true,
          envelope: {
            sprint_id: 'SPRINT-DATA-PLANE-001',
            call_id,
            type: 'CHATGPT_REPLY',
            reply_to_event_id,
            reply_to_message_id,
            payload,
            detected_at: new Date().toISOString()
          }
        };
      }
    }

    // 2. Envelope de Controle (Control Plane): [BRIDGE_TO_ANTIGRAVITY_V1]
    const startTag = '[BRIDGE_TO_ANTIGRAVITY_V1]';
    const endTag = '[/BRIDGE_TO_ANTIGRAVITY_V1]';

    const startIndex = rawText.indexOf(startTag);
    const endIndex = rawText.indexOf(endTag);

    if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
      // Texto comum ou sem envelope completo -> ignora completamente
      return null;
    }

    const envelopeBody = rawText.substring(startIndex + startTag.length, endIndex).trim();

    // Extração dos campos canônicos
    const sprintMatch = envelopeBody.match(/SPRINT_ID:\s*([^\r\n]+)/i);
    const callIdMatch = envelopeBody.match(/CALL_ID:\s*([^\r\n]+)/i);
    const typeMatch = envelopeBody.match(/TYPE:\s*([^\r\n]+)/i);
    const payloadMatch = envelopeBody.match(/PAYLOAD:\s*([\s\S]+)/i);

    if (!sprintMatch || !callIdMatch || !typeMatch || !payloadMatch) {
      return {
        valid: false,
        error: 'ENVELOPE_SCHEMA_INVALID: Campos obrigatórios ausentes (SPRINT_ID, CALL_ID, TYPE, PAYLOAD).'
      };
    }

    const sprint_id = sprintMatch[1].trim();
    const call_id = callIdMatch[1].trim();
    const type = typeMatch[1].trim().toUpperCase();
    const payload = payloadMatch[1].trim();

    if (!ALLOWED_TYPES.includes(type)) {
      return {
        valid: false,
        error: `TYPE_NOT_ALLOWED: Tipo '${type}' não permitido. Permitidos: ${ALLOWED_TYPES.join(', ')}.`
      };
    }

    return {
      valid: true,
      envelope: {
        sprint_id,
        call_id,
        type,
        payload,
        detected_at: new Date().toISOString()
      }
    };
  }

  /**
   * Varre mensagens do assistente na interface do ChatGPT
   */
  async function scanAssistantMessages() {
    if (typeof document === 'undefined') return;

    // Não processa se o ChatGPT ainda estiver gerando resposta
    const isGenerating = !!document.querySelector(
      'button[data-testid="stop-button"], button[aria-label="Stop generating"], button[aria-label="Parar de gerar"]'
    );
    if (isGenerating) return;

    // Seletores de blocos de resposta do ChatGPT
    const messageContainers = document.querySelectorAll(
      'div[data-message-author-role="assistant"], article div[data-message-author-role="assistant"], div.agent-turn'
    );

    if (!messageContainers || messageContainers.length === 0) return;

    for (const container of messageContainers) {
      const text = container.innerText || container.textContent || '';
      if (!text.includes('[BRIDGE_TO_ANTIGRAVITY_V1]') && !text.includes('[CHATGPT_REPLY_V1]') && !text.includes('[CHATGPT_REPLY]')) {
        // Ignora texto normal do ChatGPT sem envelope
        continue;
      }

      const parsed = parseOutboundEnvelope(text);
      if (!parsed) continue;

      if (!parsed.valid) {
        remoteLog(`Aviso: Envelope inválido detectado: ${parsed.error}`);
        continue;
      }

      const { envelope } = parsed;

      // Deduplicação local
      if (processedCallIds.has(envelope.call_id)) {
        continue;
      }

      remoteLog(`🎯 Envelope detectado para Antigravity! call_id=${envelope.call_id}, type=${envelope.type}`);
      processedCallIds.add(envelope.call_id);

      try {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage(
            {
              type: 'OUTBOUND_ENVELOPE_DETECTED',
              envelope
            },
            (response) => {
              if (chrome.runtime.lastError) {
                remoteLog(`Erro ao enviar mensagem ao background: ${chrome.runtime.lastError.message}`);
                processedCallIds.delete(envelope.call_id);
                return;
              }

              if (response && response.success) {
                remoteLog(`🎉 Envelope ${envelope.call_id} entregue à Bridge com sucesso!`);
                if (chrome.storage && chrome.storage.local) {
                  chrome.storage.local.get(['outbound_processed_ids'], (data) => {
                    const current = Array.isArray(data.outbound_processed_ids) ? data.outbound_processed_ids : [];
                    if (!current.includes(envelope.call_id)) {
                      current.push(envelope.call_id);
                      if (current.length > 500) current.shift();
                      chrome.storage.local.set({ outbound_processed_ids: current });
                    }
                  });
                }
              } else {
                const err = response ? response.error : 'Sem resposta';
                remoteLog(`Falha na entrega do envelope ${envelope.call_id} à Bridge: ${err}`);
                processedCallIds.delete(envelope.call_id);
              }
            }
          );
        }
      } catch (err) {
        remoteLog(`Exceção ao despachar envelope: ${err.message}`);
        processedCallIds.delete(envelope.call_id);
      }
    }
  }

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    // Polling regular a cada 2000ms
    setInterval(scanAssistantMessages, 2000);

    // Observer no DOM para reação imediata
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver(() => {
        scanAssistantMessages();
      });

      const mainTarget = document.querySelector('main') || document.body;
      if (mainTarget) {
        observer.observe(mainTarget, { childList: true, subtree: true });
      }
    }
  }

  // Exportação para suporte a testes unitários/integrados
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { parseOutboundEnvelope, ALLOWED_TYPES, scanAssistantMessages };
  } else {
    window.__SYNTHEON_OUTBOUND_TEST__ = { parseOutboundEnvelope, ALLOWED_TYPES, scanAssistantMessages };
  }
})();
