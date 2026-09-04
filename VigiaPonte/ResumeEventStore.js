/**
 * VigiaPonte/ResumeEventStore.js
 * 
 * Armazenamento persistente append-only e máquina de deduplicação idempotente de eventos de retomada.
 * Garante que nenhum evento de continuidade gere múltiplos envios de 'V' e audita o ciclo.
 */

const fs = require('fs');
const path = require('path');
const { sanitizarObjeto } = require('./SanitizadorSegredos');

class ResumeEventStore {
  constructor(options = {}) {
    this.storagePath = options.storagePath || path.join(__dirname, 'resume_events.json');
    this.cooldownMs = options.cooldownMs || 60000; // Cooldown mínimo de 60s entre retomadas automáticas
    this.events = [];
    this.lastSendTimestamp = 0;
    this._load();
  }

  _load() {
    try {
      if (fs.existsSync(this.storagePath)) {
        const raw = fs.readFileSync(this.storagePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.events)) {
          this.events = parsed.events;
          this.lastSendTimestamp = parsed.lastSendTimestamp || 0;
          return;
        }
      }
    } catch (err) {
      // Se corrompido, preserva cópia de auditoria e reinicia fail-safe
      try {
        const corruptPath = `${this.storagePath}.corrupt_${Date.now()}`;
        fs.renameSync(this.storagePath, corruptPath);
      } catch (e) {}
    }
    this.events = [];
    this.lastSendTimestamp = 0;
  }

  _save() {
    const dataToSave = {
      version: '1.0.0',
      lastSendTimestamp: this.lastSendTimestamp,
      events: this.events.slice(-100) // Mantém os últimos 100 eventos
    };
    const sanitized = sanitizarObjeto(dataToSave);
    const tmpPath = `${this.storagePath}.tmp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    try {
      fs.writeFileSync(tmpPath, JSON.stringify(sanitized, null, 2), 'utf8');
      fs.renameSync(tmpPath, this.storagePath);
    } catch (err) {
      try {
        if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
      } catch (e) {}
    }
  }

  getEvent(resumeEventId) {
    if (!resumeEventId) return null;
    return this.events.find(e => e.resume_event_id === resumeEventId) || null;
  }

  isEventProcessed(resumeEventId) {
    const ev = this.getEvent(resumeEventId);
    if (!ev) return false;
    return ev.send_confirmed === true || ev.result === 'V_SENT_CONFIRMED' || ev.result === 'NO_OP' || ev.result === 'SEND_UNCERTAIN';
  }

  isCooldownActive(customCooldownMs = null) {
    const cd = customCooldownMs !== null ? customCooldownMs : this.cooldownMs;
    const now = Date.now();
    return (now - this.lastSendTimestamp) < cd;
  }

  recordEvent(eventData) {
    if (!eventData || !eventData.resume_event_id) return null;

    const existingIndex = this.events.findIndex(e => e.resume_event_id === eventData.resume_event_id);
    const entry = {
      resume_event_id: eventData.resume_event_id,
      trigger_type: eventData.trigger_type || 'UNKNOWN',
      detected_at: eventData.detected_at || new Date().toISOString(),
      conversation_identity_hash: eventData.conversation_identity_hash || null,
      send_attempted: eventData.send_attempted || false,
      send_confirmed: eventData.send_confirmed || false,
      ack_observed: eventData.ack_observed || false,
      result: eventData.result || 'PENDING',
      reason: eventData.reason || null,
      retry_count: eventData.retry_count || 0,
      timestamp: Date.now()
    };

    if (existingIndex >= 0) {
      this.events[existingIndex] = { ...this.events[existingIndex], ...entry };
    } else {
      this.events.push(entry);
    }

    if (entry.send_confirmed) {
      this.lastSendTimestamp = Date.now();
    }

    this._save();
    return entry;
  }

  updateEvent(resumeEventId, updates = {}) {
    const ev = this.getEvent(resumeEventId);
    if (!ev) return null;

    Object.assign(ev, updates);
    if (updates.send_confirmed === true) {
      this.lastSendTimestamp = Date.now();
    }
    this._save();
    return ev;
  }

  getLastEvent() {
    if (this.events.length === 0) return null;
    return this.events[this.events.length - 1];
  }

  getRecentEvents(limit = 10) {
    return this.events.slice(-limit).reverse();
  }

  resetAll() {
    this.events = [];
    this.lastSendTimestamp = 0;
    this._save();
  }
}

module.exports = ResumeEventStore;
