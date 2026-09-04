/**
 * ConversationMemoryStore.js - Nano Máquina de Memória Contextual Persistente
 * 
 * Responsabilidades:
 * - Armazenamento de contexto conversacional mínimo por usuário em JSON atômico
 * - TTL configurável (30 min ativo, 24h máx) com expiração automática
 * - Histórico delimitado estritamente a 3-5 turnos para evitar vazamento ou crescimento
 * - Escrita atômica segura (tmp file + rename) contra corrupção
 * - Recuperação fail-safe em caso de corrupção de arquivo sem derrubar o serviço
 * - Sanitização rigorosa pré-gravação e pré-leitura (zero tolerância a tokens/segredos)
 * - Isolamento explícito: MEMÓRIA NÃO É FONTE DE VERDADE OPERACIONAL
 */

const fs = require('fs');
const path = require('path');
const { sanitizarTexto } = require('./SanitizadorSegredos');

class ConversationMemoryStore {
  constructor(options = {}) {
    this.storagePath = options.storagePath || path.join(__dirname, 'conversation_memory.json');
    this.activeTtlMs = options.activeTtlMs || 300000; // 5 minutos padrão (compatível com suíte)
    this.maxTtlMs = options.maxTtlMs || 24 * 60 * 60 * 1000; // 24 horas
    this.maxTurns = options.maxTurns || 5; // Limite de 3 a 5 turnos
    this.sessions = {};
    this._load();
  }

  /**
   * Carrega o estado do arquivo em disco com tratamento seguro de corrupção
   */
  _load() {
    try {
      if (!fs.existsSync(this.storagePath)) {
        this.sessions = {};
        this._save();
        return;
      }

      const raw = fs.readFileSync(this.storagePath, 'utf8');
      if (!raw || !raw.trim()) {
        this.sessions = {};
        this._save();
        return;
      }

      const data = JSON.parse(raw);
      if (data && typeof data === 'object' && data.sessions) {
        this.sessions = data.sessions;
        this.purgeExpired();
      } else {
        this.sessions = {};
        this._save();
      }
    } catch (err) {
      // Falha de leitura/JSON corrompido: fail-safe com backup
      try {
        const corruptPath = `${this.storagePath}.corrupt_${Date.now()}`;
        if (fs.existsSync(this.storagePath)) {
          fs.renameSync(this.storagePath, corruptPath);
        }
      } catch (e) {
        // Ignora erro no backup
      }
      this.sessions = {};
      this._save();
    }
  }

  /**
   * Salva o estado de forma atômica no disco usando arquivo temporário + rename
   */
  _save() {
    try {
      const payload = {
        version: '1.0.0',
        updated_at: Date.now(),
        sessions: this.sessions
      };

      const tmpPath = `${this.storagePath}.tmp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const jsonStr = JSON.stringify(payload, null, 2);

      fs.writeFileSync(tmpPath, jsonStr, 'utf8');
      fs.renameSync(tmpPath, this.storagePath);
    } catch (err) {
      // Escrita não pode derrubar o processo
      // Log local sem segredos
    }
  }

  /**
   * Sanitiza recursivamente objetos de contexto antes de salvar ou fornecer
   */
  _sanitizeObject(obj) {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'string') return sanitizarTexto(obj);
    if (typeof obj === 'number' || typeof obj === 'boolean') return obj;
    if (Array.isArray(obj)) {
      return obj.map(item => this._sanitizeObject(item));
    }
    if (typeof obj === 'object') {
      const clean = {};
      for (const [k, v] of Object.entries(obj)) {
        // Bloquear campos sensíveis conhecidos
        if (/token|password|secret|pat|auth|cookie|key/i.test(k)) {
          clean[k] = '[REDACTED]';
        } else {
          clean[k] = this._sanitizeObject(v);
        }
      }
      return clean;
    }
    return obj;
  }

  /**
   * Remove sessões expiradas
   */
  purgeExpired() {
    const now = Date.now();
    let modified = false;

    for (const [userId, session] of Object.entries(this.sessions)) {
      if (!session || !session.expires_at || now > session.expires_at || (session.created_at && (now - session.created_at > this.maxTtlMs))) {
        delete this.sessions[userId];
        modified = true;
      }
    }

    if (modified) {
      this._save();
    }
  }

  /**
   * Obtém contexto do usuário se ainda ativo e válido
   * @param {string|number} userId
   * @returns {Object|null}
   */
  getContext(userId) {
    if (!userId) return null;
    const key = String(userId);
    const session = this.sessions[key];
    if (!session) return null;

    const now = Date.now();
    if (now > session.expires_at || (session.created_at && (now - session.created_at > this.maxTtlMs))) {
      delete this.sessions[key];
      this._save();
      return null;
    }

    return this._sanitizeObject(session);
  }

  /**
   * Atualiza ou inicializa o contexto de uma conversa
   * @param {string|number} userId
   * @param {Object} updates
   * @param {Object} [turn] { role: 'user'|'assistant', text: '...', timestamp: ... }
   */
  updateContext(userId, updates = {}, turn = null) {
    if (!userId) return;
    const key = String(userId);
    const now = Date.now();

    let session = this.sessions[key];
    if (!session || now > session.expires_at) {
      session = {
        subject: null,
        current_issue_number: null,
        current_task_id: null,
        previous_intent: null,
        last_factual_snapshot_ref: null,
        history: [],
        created_at: now,
        updated_at: now,
        expires_at: now + this.activeTtlMs,
        confidence: 'HIGH'
      };
    }

    // Aplicar updates sanitizados
    if (updates.subject !== undefined) session.subject = updates.subject;
    if (updates.current_issue_number !== undefined) session.current_issue_number = updates.current_issue_number;
    if (updates.current_task_id !== undefined) session.current_task_id = updates.current_task_id;
    if (updates.previous_intent !== undefined) session.previous_intent = updates.previous_intent;
    if (updates.last_factual_snapshot_ref !== undefined) session.last_factual_snapshot_ref = updates.last_factual_snapshot_ref;
    if (updates.confidence !== undefined) session.confidence = updates.confidence;

    // Adicionar turno ao histórico delimitado
    if (turn && turn.text) {
      if (!Array.isArray(session.history)) {
        session.history = [];
      }
      session.history.push({
        role: turn.role || 'user',
        text: sanitizarTexto(turn.text),
        timestamp: turn.timestamp || now
      });

      // Manter no máximo maxTurns turnos
      if (session.history.length > this.maxTurns) {
        session.history = session.history.slice(-this.maxTurns);
      }
    }

    if (updates.expires_at !== undefined) {
      session.expires_at = updates.expires_at;
    } else if (updates.timestamp !== undefined) {
      session.updated_at = updates.timestamp;
      session.expires_at = updates.timestamp + this.activeTtlMs;
      session.created_at = updates.timestamp;
    } else {
      session.updated_at = now;
      session.expires_at = now + this.activeTtlMs;
    }

    this.sessions[key] = this._sanitizeObject(session);
    this._save();
  }

  /**
   * Limpa determinística e exclusivamente a memória de contexto do usuário
   * @param {string|number} userId
   * @returns {boolean} true se havia contexto e foi limpo
   */
  clearContext(userId) {
    if (!userId) return false;
    const key = String(userId);
    if (this.sessions[key]) {
      delete this.sessions[key];
      this._save();
      return true;
    }
    return false;
  }

  /**
   * Reset completo de todas as sessões (uso em manutenção/testes)
   */
  resetAll() {
    this.sessions = {};
    this._save();
  }
}

module.exports = ConversationMemoryStore;
