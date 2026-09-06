const fs = require('fs');
const path = require('path');

/**
 * SprintContinuityEngine
 * Motor de governança soberana e continuidade autônoma da Sprint para o Antigravity.
 * Implementa a máquina de estados canônica da Skill antigravity-sprint-continuity
 * com precedência sobre Down Plant e políticas subordinadas.
 */
class SprintContinuityEngine {
  static SCOPE = 'GLOBAL';
  static PRECEDENCE = 'SOVEREIGN_OPERATIONAL_CONTINUITY';

  static STATES = {
    DISCOVER: 'DISCOVER',
    EXECUTE: 'EXECUTE',
    RESULT_POSTED_WAIT_AUDIT: 'RESULT_POSTED_WAIT_AUDIT',
    CORRECTION_AVAILABLE: 'CORRECTION_AVAILABLE',
    ADMIN_PROMOTION: 'ADMIN_PROMOTION',
    NEXT_WORK: 'NEXT_WORK',
    DONE_CANDIDATE: 'DONE_CANDIDATE',
    OWNER_DECISION_REQUIRED: 'OWNER_DECISION_REQUIRED',
    DEGRADED: 'DEGRADED'
  };

  static EXPECTED_EVENTS = {
    RESULT_POSTED_WAIT_AUDIT: 'AUDIT',
    CORRECTION_AVAILABLE: 'CORRECTED_RESULT',
    ADMIN_PROMOTION: 'ADMIN_RESULT',
    NEXT_WORK: 'NEXT_VALID_CALL',
    DONE_CANDIDATE: 'SPRINT_AUDIT_CLOSE',
    EXECUTE: 'RESULT_SUBMISSION',
    DISCOVER: 'STATE_RECONCILIATION'
  };

  static SUPERSEDED_RULES_TABLE = [
    {
      source: 'Down Plant (Item 13)',
      rule: 'Parar após a entrega',
      original_effect: 'EXIT_OR_TERMINATE',
      superseded_action: 'WAIT_REACTIVE_AND_RESUME_ON_AUDIT',
      status: 'SUPERSEDED_FOR_CONTINUITY'
    },
    {
      source: 'Aguardar humano sem decisão crítica',
      rule: 'Pausar fluxo aguardando comando de texto livre',
      original_effect: 'WAIT_HUMAN_INTERVENTION',
      superseded_action: 'CONTINUE_WHEN_VALID_ACTION_EXISTS',
      status: 'SUPERSEDED_FOR_CONTINUITY'
    },
    {
      source: 'STOP após RESULT',
      rule: 'Interromper agente após postar resultado',
      original_effect: 'HALT_SESSION',
      superseded_action: 'WAIT_REACTIVE_AND_RESUME_ON_AUDIT',
      status: 'SUPERSEDED_FOR_CONTINUITY'
    },
    {
      source: 'STOP após REVIEW',
      rule: 'Interromper agente ao entrar em revisão',
      original_effect: 'HALT_SESSION',
      superseded_action: 'WAIT_REACTIVE_AND_RESUME_ON_VALID_EVENT',
      status: 'SUPERSEDED_FOR_CONTINUITY'
    },
    {
      source: 'Encerrar turno após entrega',
      rule: 'Matar sessão local do agente',
      original_effect: 'TERMINATE_AGENT',
      superseded_action: 'RECONCILE_AND_SEEK_NEXT_VALID_WORK',
      status: 'SUPERSEDED_FOR_CONTINUITY'
    }
  ];

  constructor(journalPath) {
    this.journalPath = journalPath || path.join(__dirname, 'sprint_continuity_journal.json');
    this.journal = this._loadJournal();
  }

  _loadJournal() {
    try {
      if (fs.existsSync(this.journalPath)) {
        const raw = fs.readFileSync(this.journalPath, 'utf8');
        return JSON.parse(raw);
      }
    } catch (e) {}

    return {
      scope: SprintContinuityEngine.SCOPE,
      precedence: SprintContinuityEngine.PRECEDENCE,
      sprint_id: null,
      active_issue: null,
      last_call_id: null,
      phase: SprintContinuityEngine.STATES.DISCOVER,
      expected_next_event: SprintContinuityEngine.EXPECTED_EVENTS.DISCOVER,
      inflight_action: null,
      processed_keys: [],
      superseded_rules_audited: [],
      history: []
    };
  }

  _saveJournal() {
    try {
      const dir = path.dirname(this.journalPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.journalPath, JSON.stringify(this.journal, null, 2), 'utf8');
    } catch (e) {
      console.error('[SprintContinuityEngine] Erro ao salvar journal:', e.message);
    }
  }

  auditConflicts(loadedSkills = ['Down Plant']) {
    const conflicts = [];
    for (const ruleDef of SprintContinuityEngine.SUPERSEDED_RULES_TABLE) {
      conflicts.push({
        source: ruleDef.source,
        rule: ruleDef.rule,
        original_effect: ruleDef.original_effect,
        superseded_action: ruleDef.superseded_action,
        status: 'SUPERSEDED_FOR_CONTINUITY',
        audited_at: new Date().toISOString()
      });
    }

    this.journal.superseded_rules_audited = conflicts;
    this._saveJournal();
    return conflicts;
  }

  resolveStopDirective(source, originalAction) {
    const match = SprintContinuityEngine.SUPERSEDED_RULES_TABLE.find(
      r => r.source.toLowerCase().includes(source.toLowerCase()) || r.original_effect === originalAction
    );

    if (match) {
      return {
        superseded: true,
        source: match.source,
        original_action: originalAction,
        resolved_action: match.superseded_action,
        status: 'SUPERSEDED_FOR_CONTINUITY'
      };
    }

    return {
      superseded: false,
      source,
      original_action: originalAction,
      resolved_action: originalAction,
      status: 'MAINTAINED'
    };
  }

  computeDedupeKey(sprintId, issueNumber, callId, actionKind) {
    const s = String(sprintId || 'NO_SPRINT').trim();
    const i = String(issueNumber || 'NO_ISSUE').trim();
    const c = String(callId || 'NO_CALL').trim();
    const a = String(actionKind || 'ACTION').trim();
    return `${s}:${i}:${c}:${a}`;
  }

  isDuplicate(key) {
    return Array.isArray(this.journal.processed_keys) && this.journal.processed_keys.includes(key);
  }

  registerProcessedKey(key) {
    if (!Array.isArray(this.journal.processed_keys)) {
      this.journal.processed_keys = [];
    }
    if (!this.journal.processed_keys.includes(key)) {
      this.journal.processed_keys.push(key);
      this._saveJournal();
    }
  }

  transition(toState, trigger, metadata = {}) {
    if (!Object.values(SprintContinuityEngine.STATES).includes(toState)) {
      throw new Error(`ESTADO_INVALIDO: '${toState}' não é um estado válido.`);
    }

    const fromState = this.journal.phase;
    this.journal.phase = toState;
    this.journal.expected_next_event = SprintContinuityEngine.EXPECTED_EVENTS[toState] || null;

    if (metadata.sprint_id) this.journal.sprint_id = metadata.sprint_id;
    if (metadata.active_issue) this.journal.active_issue = metadata.active_issue;
    if (metadata.call_id) this.journal.last_call_id = metadata.call_id;

    const transitionRecord = {
      from: fromState,
      to: toState,
      trigger: trigger || 'UNKNOWN',
      expected_next_event: this.journal.expected_next_event,
      timestamp: new Date().toISOString(),
      metadata
    };

    this.journal.history.push(transitionRecord);
    this._saveJournal();

    return transitionRecord;
  }

  processIncomingEvent(event) {
    if (!event) return { status: 'INVALID_EVENT', action: null };

    const sprintId = event.sprint_id || this.journal.sprint_id || 'SPRINT-DEFAULT';
    const issueNum = event.issue_number || this.journal.active_issue || 'NO_ISSUE';
    const callId = event.call_id || `EVENT_${Date.now()}`;
    const type = (event.type || 'MESSAGE').toUpperCase();

    const dedupeKey = this.computeDedupeKey(sprintId, issueNum, callId, type);

    if (this.isDuplicate(dedupeKey)) {
      return {
        status: 'NO_OP_DUPLICATE_DROP',
        key: dedupeKey,
        current_state: this.journal.phase
      };
    }

    let nextState = this.journal.phase;
    let trigger = `INCOMING_${type}`;

    if (type === 'CALL' || type === 'OWNER_DIRECTIVE' || type === 'TASK') {
      nextState = SprintContinuityEngine.STATES.EXECUTE;
    } else if (type === 'AUDIT_CORRECTION' || type === 'CORRECTION_REQUIRED') {
      nextState = SprintContinuityEngine.STATES.CORRECTION_AVAILABLE;
    } else if (type === 'AUDIT_APPROVE' || type === 'APPROVE') {
      if (event.requires_promotion) {
        nextState = SprintContinuityEngine.STATES.ADMIN_PROMOTION;
      } else if (event.has_next_card) {
        nextState = SprintContinuityEngine.STATES.NEXT_WORK;
      } else {
        nextState = SprintContinuityEngine.STATES.DONE_CANDIDATE;
      }
    } else if (type === 'ADMIN_COMPLETED') {
      if (event.has_next_card) {
        nextState = SprintContinuityEngine.STATES.NEXT_WORK;
      } else {
        nextState = SprintContinuityEngine.STATES.DONE_CANDIDATE;
      }
    } else if (type === 'RESULT_POSTED') {
      nextState = SprintContinuityEngine.STATES.RESULT_POSTED_WAIT_AUDIT;
    }

    this.journal.inflight_action = {
      key: dedupeKey,
      type,
      started_at: new Date().toISOString()
    };

    const record = this.transition(nextState, trigger, {
      sprint_id: sprintId,
      active_issue: issueNum,
      call_id: callId,
      raw_type: type
    });

    return {
      status: 'PROCESSED',
      transition: record,
      key: dedupeKey,
      next_state: nextState,
      expected_next_event: this.journal.expected_next_event
    };
  }

  completeInflightAction(key) {
    if (this.journal.inflight_action && this.journal.inflight_action.key === key) {
      this.registerProcessedKey(key);
      this.journal.inflight_action = null;
      this._saveJournal();
      return true;
    }
    return false;
  }

  rehydrate() {
    this.auditConflicts();

    const recovered = {
      was_interrupted: !!this.journal.inflight_action,
      interrupted_action: this.journal.inflight_action,
      phase: this.journal.phase,
      expected_next_event: this.journal.expected_next_event,
      active_issue: this.journal.active_issue,
      sprint_id: this.journal.sprint_id,
      superseded_rules_audited: this.journal.superseded_rules_audited
    };

    if (this.journal.inflight_action) {
      this.journal.history.push({
        from: this.journal.phase,
        to: this.journal.phase,
        trigger: 'REHYDRATE_AFTER_INTERRUPTION',
        action: this.journal.inflight_action,
        timestamp: new Date().toISOString()
      });
      this._saveJournal();
    }

    return recovered;
  }

  canAutoApprove() {
    return false;
  }

  canCloseIssueWithoutAudit() {
    return false;
  }

  getJournal() {
    return { ...this.journal };
  }
}

module.exports = SprintContinuityEngine;
