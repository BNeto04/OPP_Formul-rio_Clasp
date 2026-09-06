const fs = require('fs');
const path = require('path');
const SanitizadorSegredos = require('./SanitizadorSegredos');

class ContextHub {
  constructor(options = {}) {
    this.storagePath = options.storagePath || path.join(__dirname, 'context_hub_state.json');
    this.isNetworkOnline = options.isNetworkOnline !== undefined ? options.isNetworkOnline : true;
    this.state = this._loadState();
  }

  _getDefaultState() {
    return {
      context_version: '1.0.0',
      sprint_id: 'SPRINT-PC-TRABALHO-SANEAMENTO-DONE-001',
      owner_objective: 'Saneamento e unificação da Sprint com continuidade multi-dispositivo sem amnésia',
      current_phase: 'REVIEW',
      active_issue_numbers: [45, 50, 46],
      last_call_id: 'MESSAGE-WAKE-45-50-CONTINUE-012',
      last_result_id: 'RESULT_ISSUE_45_DONE_GATE_CORRECTED',
      last_audit_decision: 'CORRECTION_REQUIRED_CONTINUE',
      open_blockers: [],
      owner_directives: [],
      last_human_message_summary: '',
      antigravity_state: 'READY',
      vigia_state: 'SENTINEL_ONLINE',
      bridge_state: 'ONLINE',
      telegram_state: 'CONVERSATIONAL_READY',
      next_expected_action: 'Homologação da Issue #50 e encerramento consolidado da Issue #46',
      is_stale: false,
      stale_reason: null,
      updated_at: new Date().toISOString(),
      updated_by: 'PC_TRABALHO'
    };
  }

  _loadState() {
    try {
      if (this.storagePath !== ':memory:' && fs.existsSync(this.storagePath)) {
        const raw = fs.readFileSync(this.storagePath, 'utf8');
        return JSON.parse(raw);
      }
    } catch (e) {}
    return this._getDefaultState();
  }

  _saveState() {
    if (this.storagePath === ':memory:') return;
    try {
      fs.writeFileSync(this.storagePath, JSON.stringify(this.state, null, 2), 'utf8');
    } catch (e) {}
  }

  setNetworkOnline(online) {
    this.isNetworkOnline = online;
    if (!online) {
      this.state.is_stale = true;
      this.state.stale_reason = 'CONNECTIVITY_LOST';
    } else {
      this.state.is_stale = false;
      this.state.stale_reason = null;
    }
    this._saveState();
  }

  getState() {
    return { ...this.state };
  }

  updateState(patch = {}, updatedBy = 'PC_TRABALHO') {
    // Regra 6: Se offline, marca como stale sem sobrescrever remoto descontroladamente
    if (!this.isNetworkOnline) {
      this.state.is_stale = true;
      this.state.stale_reason = 'OFFLINE_STALE_MUTATION';
      return { success: false, reason: 'NETWORK_OFFLINE_STALE', state: this.getState() };
    }

    // Regra 5: Dedupe de evento por context_version / last_call_id
    if (patch.last_call_id && patch.last_call_id === this.state.last_call_id && patch.last_result_id === this.state.last_result_id && !patch.owner_directives && !patch.owner_directive) {
      return { success: true, action: 'DEDUPE_NO_OP', state: this.getState() };
    }

    // Regra 7: OWNER_DIRECTIVE mais recente tem prioridade absoluta sobre inferência
    if (patch.owner_directive) {
      const dirObj = {
        directive: SanitizadorSegredos.sanitizarTexto(patch.owner_directive),
        timestamp: patch.timestamp || new Date().toISOString(),
        source: updatedBy
      };
      this.state.owner_directives = [dirObj, ...(this.state.owner_directives || [])].slice(0, 10);
    }

    // Atualização dos campos permitidos
    const allowed = [
      'owner_objective', 'current_phase', 'active_issue_numbers',
      'last_call_id', 'last_result_id', 'last_audit_decision',
      'open_blockers', 'last_human_message_summary', 'antigravity_state',
      'vigia_state', 'bridge_state', 'telegram_state', 'next_expected_action'
    ];

    for (const key of allowed) {
      if (patch[key] !== undefined) {
        this.state[key] = patch[key];
      }
    }

    const vParts = (this.state.context_version || '1.0.0').split('.').map(Number);
    vParts[2] = (vParts[2] || 0) + 1;
    this.state.context_version = vParts.join('.');
    this.state.updated_at = new Date().toISOString();
    this.state.updated_by = updatedBy;
    this.state.is_stale = false;
    this.state.stale_reason = null;

    this._saveState();
    return { success: true, state: this.getState() };
  }

  generateRehydrationPacket() {
    const s = this.state;
    const directives = (s.owner_directives && s.owner_directives.length > 0) 
      ? s.owner_directives[0].directive 
      : 'NENHUMA';
    const blockers = (s.open_blockers && s.open_blockers.length > 0)
      ? s.open_blockers.join(', ')
      : 'NENHUM';

    const raw = `[BRIDGE_CONTEXT_REHYDRATE_V1]
CONTEXT_VERSION: ${s.context_version}
SPRINT_ID: ${s.sprint_id}
OWNER_OBJECTIVE: ${s.owner_objective}
CURRENT_PHASE: ${s.current_phase}
ACTIVE_ISSUES: #${(s.active_issue_numbers || []).join(', #')}
LAST_CALL: ${s.last_call_id || 'NONE'}
LAST_RESULT: ${s.last_result_id || 'NONE'}
LAST_AUDIT: ${s.last_audit_decision || 'NONE'}
BLOCKERS: ${blockers}
OWNER_DIRECTIVES: ${directives}
NEXT_EXPECTED_ACTION: ${s.next_expected_action}
IS_STALE: ${s.is_stale ? 'true (' + s.stale_reason + ')' : 'false'}
UPDATED_AT: ${s.updated_at}
UPDATED_BY: ${s.updated_by}
[/BRIDGE_CONTEXT_REHYDRATE_V1]`;

    // Regra 8: Sem segredos no pacote
    return SanitizadorSegredos.sanitizarTexto(raw);
  }

  generateNaturalStatusSummary() {
    const s = this.state;
    const issues = (s.active_issue_numbers || []).map(n => '#' + n).join(', ');
    const staleNote = s.is_stale ? ' (Atenção: estado local marcado como desatualizado devido a queda de rede)' : '';
    return `Estamos na fase ${s.current_phase} da Sprint ${s.sprint_id}.${staleNote} As issues ativas são ${issues}. O último chamado processado foi ${s.last_call_id} com decisão ${s.last_audit_decision}. Próximo passo: ${s.next_expected_action}.`;
  }
}

module.exports = ContextHub;
