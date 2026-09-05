/**
 * VigiaPonte/ResilientCarrierQueue.js
 * 
 * Fila Persistente, Deduplicada e Single-Flight do Inbound Carrier (Bridge V2).
 * Garante a continuidade operacional resiliente sob quedas de Internet:
 * - Single-Flight: no máximo 1 item em trânsito por vez.
 * - Deduplicação estrita: por CALL_ID, REPLY_TO, ISSUE e hash de payload.
 * - Deduplicação de ACKs: chave (SPRINT_ID, REPLY_TO_CALL_ID, STATUS, payload_hash) com DROP/NO_OP imediato.
 * - Proteção de escrita: detecção de COMPOSER_BUSY (texto do proprietário ou pacote pendente).
 * - Tratamento de perda de rede: SEND_UNCERTAIN sem retry cego.
 * - Reconciliação pós-queda de rede antes de drenagem.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { sanitizarTexto, sanitizarObjeto } = require('./SanitizadorSegredos');

class ResilientCarrierQueue {
  constructor(options = {}) {
    this.storagePath = options.storagePath || path.join(__dirname, 'carrier_queue.json');
    this.deliveredHistoryPath = options.deliveredHistoryPath || path.join(__dirname, 'carrier_delivered_history.json');
    this.deliveredAckHistoryPath = options.deliveredAckHistoryPath || path.join(__dirname, 'carrier_ack_history.json');
    this.journalPath = options.journalPath || path.join(__dirname, 'carrier_queue_journal.log');
    this.queue = [];
    this.deliveredKeys = new Set();
    this.deliveredAckKeys = new Set();
    this.inFlightItem = null;
    this.state = 'IDLE'; // 'IDLE' | 'IN_FLIGHT' | 'COMPOSER_BUSY' | 'SEND_UNCERTAIN'
    this.loadState();
  }

  _hashPayload(text) {
    if (!text) return '';
    const normalized = text.trim().replace(/\r\n/g, '\n');
    return crypto.createHash('sha256').update(normalized).digest('hex').substring(0, 16);
  }

  _generateDedupeKey(packet) {
    const payload = packet.payload || '';
    const callIdMatch = payload.match(/CALL_ID:\s*([^\r\n]+)/i) || (packet.call_id ? [null, packet.call_id] : null);
    const replyMatch = payload.match(/REPLY_TO_CALL_ID:\s*([^\r\n]+)/i) || (packet.reply_to_call_id ? [null, packet.reply_to_call_id] : null);
    const issueMatch = payload.match(/ISSUE_NUMBER:\s*([^\r\n]+)/i) || (packet.issue_number ? [null, packet.issue_number] : null);

    const callId = callIdMatch ? callIdMatch[1].trim() : (packet.packet_id || 'NO_CALL');
    const replyId = replyMatch ? replyMatch[1].trim() : 'NO_REPLY';
    const issue = issueMatch ? issueMatch[1].trim() : 'NO_ISSUE';
    const payloadHash = this._hashPayload(payload);

    return `ISSUE_${issue}::CALL_${callId}::REPLY_${replyId}::HASH_${payloadHash}`;
  }

  _generateAckDedupeKey(packet) {
    const payload = packet.payload || '';
    const sprintMatch = payload.match(/SPRINT_ID:\s*([^\r\n]+)/i) || (packet.sprint_id ? [null, packet.sprint_id] : [null, 'NO_SPRINT']);
    const replyMatch = payload.match(/REPLY_TO_CALL_ID:\s*([^\r\n]+)/i) || (packet.reply_to_call_id ? [null, packet.reply_to_call_id] : [null, 'NO_REPLY']);
    const statusMatch = payload.match(/STATUS:\s*([^\r\n]+)/i) || (packet.status ? [null, packet.status] : [null, 'NO_STATUS']);
    const payloadHash = this._hashPayload(payload);

    return `ACK::${sprintMatch[1].trim()}::${replyMatch[1].trim()}::${statusMatch[1].trim()}::${payloadHash}`;
  }

  _appendJournal(event, data = {}) {
    try {
      const sanitized = sanitizarObjeto(data);
      const entry = JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        ...sanitized
      }) + '\n';
      fs.appendFileSync(this.journalPath, entry, 'utf8');
    } catch (e) {}
  }

  loadState() {
    try {
      if (fs.existsSync(this.storagePath)) {
        const raw = fs.readFileSync(this.storagePath, 'utf8');
        const data = JSON.parse(raw);
        this.queue = Array.isArray(data.queue) ? data.queue : [];
        this.inFlightItem = data.inFlightItem || null;
        this.state = data.state || 'IDLE';
      }
    } catch (e) {
      this.queue = [];
      this.inFlightItem = null;
      this.state = 'IDLE';
    }

    try {
      if (fs.existsSync(this.deliveredHistoryPath)) {
        const raw = fs.readFileSync(this.deliveredHistoryPath, 'utf8');
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          this.deliveredKeys = new Set(list);
        }
      }
    } catch (e) {
      this.deliveredKeys = new Set();
    }

    try {
      if (fs.existsSync(this.deliveredAckHistoryPath)) {
        const raw = fs.readFileSync(this.deliveredAckHistoryPath, 'utf8');
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          this.deliveredAckKeys = new Set(list);
        }
      }
    } catch (e) {
      this.deliveredAckKeys = new Set();
    }
  }

  saveState() {
    try {
      const data = {
        queue: this.queue,
        inFlightItem: this.inFlightItem,
        state: this.state,
        updated_at: new Date().toISOString()
      };
      fs.writeFileSync(this.storagePath, JSON.stringify(data, null, 2), 'utf8');
      fs.writeFileSync(this.deliveredHistoryPath, JSON.stringify(Array.from(this.deliveredKeys), null, 2), 'utf8');
      fs.writeFileSync(this.deliveredAckHistoryPath, JSON.stringify(Array.from(this.deliveredAckKeys), null, 2), 'utf8');
    } catch (e) {}
  }

  inspectComposer(currentComposerText) {
    if (!currentComposerText || typeof currentComposerText !== 'string' || currentComposerText.trim() === '') {
      return {
        status: 'READY',
        reason: 'COMPOSER_EMPTY'
      };
    }

    const trimmed = currentComposerText.trim();
    const isPacket = trimmed.includes('[CONTEXT_PACKET]') || 
                    trimmed.includes('[BRIDGE_') || 
                    trimmed.includes('RESULT_OBRIGATORIO:');

    if (isPacket) {
      return {
        status: 'COMPOSER_BUSY',
        reason: 'COMPOSER_BUSY_PREVIOUS_PACKET_PENDING',
        detail: 'Pacote anterior ainda presente no composer sem confirmação de envio. Não concatenar.'
      };
    }

    return {
      status: 'COMPOSER_BUSY',
      reason: 'COMPOSER_BUSY_OWNER_TEXT',
      detail: 'Texto do proprietário detectado no campo. Não sobrescrever nem enviar automaticamente.'
    };
  }

  enqueue(packet) {
    if (!packet || !packet.payload) {
      return { success: false, reason: 'INVALID_PACKET' };
    }

    // 1. Tratamento específico para ACKs: deduplicação por chave (SPRINT, REPLY_TO, STATUS, hash)
    const isAck = (packet.payload && (packet.payload.includes('[BRIDGE_AUTO_CONTINUE_V1]') || packet.payload.includes('STATUS: ACK_')));
    let ackDedupeKey = null;
    if (isAck) {
      ackDedupeKey = this._generateAckDedupeKey(packet);
      if (this.deliveredAckKeys.has(ackDedupeKey)) {
        this._appendJournal('ACK_ALREADY_DELIVERED_DROP', { ackDedupeKey, packet_id: packet.packet_id });
        return {
          success: false,
          status: 'ACK_ALREADY_DELIVERED',
          action: 'DROP_NO_OP',
          reason: 'ACK_ALREADY_DELIVERED',
          ackDedupeKey
        };
      }
    }

    const dedupeKey = this._generateDedupeKey(packet);

    // 2. Verifica se o pacote geral já foi entregue
    if (this.deliveredKeys.has(dedupeKey)) {
      this._appendJournal('ENQUEUE_DUPLICATE_ALREADY_DELIVERED', { dedupeKey, packet_id: packet.packet_id });
      return {
        success: false,
        status: 'DUPLICATE_NO_OP',
        reason: 'ALREADY_DELIVERED',
        dedupeKey
      };
    }

    // 3. Verifica se já está em voo
    if (this.inFlightItem && this.inFlightItem.dedupeKey === dedupeKey) {
      this._appendJournal('ENQUEUE_DUPLICATE_IN_FLIGHT', { dedupeKey, packet_id: packet.packet_id });
      return {
        success: false,
        status: 'DUPLICATE_NO_OP',
        reason: 'CURRENTLY_IN_FLIGHT',
        dedupeKey
      };
    }

    // 4. Verifica se já está na fila
    const alreadyQueued = this.queue.some(item => item.dedupeKey === dedupeKey);
    if (alreadyQueued) {
      this._appendJournal('ENQUEUE_DUPLICATE_QUEUED', { dedupeKey, packet_id: packet.packet_id });
      return {
        success: false,
        status: 'DUPLICATE_NO_OP',
        reason: 'ALREADY_QUEUED',
        dedupeKey
      };
    }

    // Adiciona à fila
    const queueItem = {
      packet_id: packet.packet_id || `PKT_${Date.now()}`,
      payload: packet.payload,
      dedupeKey,
      ackDedupeKey,
      isAck,
      enqueued_at: new Date().toISOString(),
      attempts: 0
    };

    this.queue.push(queueItem);
    this.saveState();
    this._appendJournal('ENQUEUE_SUCCESS', { dedupeKey, ackDedupeKey, packet_id: queueItem.packet_id });

    return {
      success: true,
      status: 'QUEUED',
      dedupeKey,
      ackDedupeKey,
      position: this.queue.length
    };
  }

  acquireNextFlight(composerStatus = 'READY') {
    if (this.inFlightItem) {
      return {
        allowed: false,
        reason: 'SINGLE_FLIGHT_LOCKED',
        inFlightItem: this.inFlightItem
      };
    }

    if (composerStatus !== 'READY') {
      return {
        allowed: false,
        reason: composerStatus
      };
    }

    if (this.queue.length === 0) {
      return {
        allowed: false,
        reason: 'QUEUE_EMPTY'
      };
    }

    this.inFlightItem = this.queue.shift();
    this.inFlightItem.attempts += 1;
    this.inFlightItem.dispatched_at = new Date().toISOString();
    this.state = 'IN_FLIGHT';

    this.saveState();
    this._appendJournal('FLIGHT_ACQUIRED', { 
      packet_id: this.inFlightItem.packet_id, 
      dedupeKey: this.inFlightItem.dedupeKey 
    });

    return {
      allowed: true,
      item: this.inFlightItem
    };
  }

  markSendUncertain(packetId, reason = 'NETWORK_LOST_DURING_SUBMIT') {
    if (this.inFlightItem && this.inFlightItem.packet_id === packetId) {
      this.state = 'SEND_UNCERTAIN';
      this.inFlightItem.status = 'SEND_UNCERTAIN';
      this.inFlightItem.uncertain_reason = reason;
      this.saveState();
      this._appendJournal('SEND_UNCERTAIN_MARKED', { packetId, reason });
      return true;
    }
    return false;
  }

  confirmDelivered(packetId) {
    if (!this.inFlightItem || this.inFlightItem.packet_id !== packetId) {
      return false;
    }

    const key = this.inFlightItem.dedupeKey;
    this.deliveredKeys.add(key);

    if (this.inFlightItem.ackDedupeKey) {
      this.deliveredAckKeys.add(this.inFlightItem.ackDedupeKey);
    }

    this._appendJournal('DELIVERED_CONFIRMED', { packetId, key, ackKey: this.inFlightItem.ackDedupeKey });

    this.inFlightItem = null;
    this.state = 'IDLE';
    this.saveState();

    return true;
  }

  reconcileAfterReconnect(chatHistorySnippets = [], currentComposerText = '') {
    this._appendJournal('RECONCILING_START', { state: this.state, inFlight: !!this.inFlightItem });

    if (!this.inFlightItem) {
      this.state = 'IDLE';
      this.saveState();
      return { action: 'READY_TO_DRAIN', drained: 0 };
    }

    const inFlightPayloadSnippet = this.inFlightItem.payload.substring(0, 100);
    const key = this.inFlightItem.dedupeKey;

    const callIdMatch = this.inFlightItem.payload.match(/CALL_ID:\s*([^\r\n]+)/i);
    const callId = callIdMatch ? callIdMatch[1].trim() : null;
    const foundInHistory = chatHistorySnippets.some(snippet => {
      if (!snippet) return false;
      if (snippet.includes(this.inFlightItem.packet_id)) return true;
      if (callId && snippet.includes(callId)) return true;
      if (snippet.includes(inFlightPayloadSnippet)) return true;
      return false;
    });

    if (foundInHistory) {
      this.deliveredKeys.add(key);
      if (this.inFlightItem.ackDedupeKey) {
        this.deliveredAckKeys.add(this.inFlightItem.ackDedupeKey);
      }
      this._appendJournal('RECONCILE_FOUND_IN_HISTORY', { packetId: this.inFlightItem.packet_id, key });
      this.inFlightItem = null;
      this.state = 'IDLE';
      this.saveState();
      return {
        action: 'RESOLVED_AS_DELIVERED',
        reason: 'PAYLOAD_FOUND_IN_CHAT_HISTORY',
        readyForNext: true
      };
    }

    const composerInspect = this.inspectComposer(currentComposerText);
    if (composerInspect.reason === 'COMPOSER_BUSY_OWNER_TEXT') {
      this.state = 'COMPOSER_BUSY';
      this.saveState();
      return {
        action: 'HOLD_COMPOSER_BUSY',
        reason: 'OWNER_TYPING_PROTECTED',
        readyForNext: false
      };
    }

    this.state = 'IN_FLIGHT';
    this.saveState();
    return {
      action: 'RETRY_SINGLE_FLIGHT',
      item: this.inFlightItem,
      readyForNext: false
    };
  }

  reset() {
    this.queue = [];
    this.deliveredKeys.clear();
    this.deliveredAckKeys.clear();
    this.inFlightItem = null;
    this.state = 'IDLE';
    this.saveState();
  }
}

module.exports = ResilientCarrierQueue;
