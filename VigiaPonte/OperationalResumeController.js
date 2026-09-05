/**
 * VigiaPonte/OperationalResumeController.js
 * 
 * Controlador Canônico de Retomada Operacional e Envio de V.
 * Orquestra os ciclos de continuidade:
 * - BOOT_RECOVERY (Boot / Logon do Windows)
 * - INTERNET_RETURN (Conectividade restaurada)
 * - ANTIGRAVITY_RECOVERY (Processo restaurado pelo RecoveryManager)
 * - OWNER_REMOTE_TRIGGER (Comando explícito do proprietário via Telegram)
 * 
 * Cumpre os Limites de Segurança, Idempotência e Visibilidade Dupla.
 */

const fs = require('fs');
const path = require('path');
const AntigravityUiAdapter = require('./AntigravityUiAdapter');
const ResumeEventStore = require('./ResumeEventStore');
const { sanitizarTexto, sanitizarObjeto } = require('./SanitizadorSegredos');

class OperationalResumeController {
  constructor(options = {}) {
    this.uiAdapter = options.uiAdapter || new AntigravityUiAdapter();
    this.eventStore = options.eventStore || new ResumeEventStore();
    this.recoveryManager = options.recoveryManager || null;
    this.internetMonitor = options.internetMonitor || null;
    this.telegramAlertManager = options.telegramAlertManager || null;
    this.antigravityObserver = options.antigravityObserver || null;
    this.journalPath = options.journalPath || path.join(__dirname, 'resume_cycle_journal.log');
    this.cooldownMs = options.cooldownMs || 60000; // 60s
    this.customGitHubNotifier = options.customGitHubNotifier || null;
  }

  /**
   * Registra entrada de auditoria append-only no journal de ciclos de retomada
   * @param {Object} entry
   */
  _appendJournal(entry) {
    try {
      const sanitized = sanitizarObjeto(entry);
      const line = JSON.stringify({ ...sanitized, timestamp: new Date().toISOString() }) + '\n';
      fs.appendFileSync(this.journalPath, line, 'utf8');
    } catch (e) {}
  }

  /**
   * Avalia a distinção factual de estados de execução do Antigravity (Clarificação 3)
   * @returns {Object}
   */
  async evaluateOperationalState() {
    const isRunning = this.uiAdapter.isProcessRunning();
    if (!isRunning) {
      return {
        state: 'ANTIGRAVITY_PROCESS_DOWN',
        description: 'O processo Antigravity está parado no momento.',
        prerequisiteRunning: false,
        working: false
      };
    }

    const gui = this.uiAdapter.evaluateGuiReadiness();
    if (!gui.ready && gui.state === 'ANTIGRAVITY_PROCESS_UP_GUI_NOT_READY') {
      return {
        state: 'ANTIGRAVITY_PROCESS_UP_GUI_NOT_READY',
        description: 'O Antigravity está aberto, mas sua interface gráfica ainda está carregando.',
        prerequisiteRunning: true,
        working: false
      };
    }

    if (!gui.ready && gui.state === 'ANTIGRAVITY_BLOCKED_OR_WAITING_OWNER') {
      return {
        state: 'ANTIGRAVITY_BLOCKED_OR_WAITING_OWNER',
        description: 'O Antigravity está aguardando decisão do proprietário ou há modal de permissão aberto.',
        prerequisiteRunning: true,
        working: false
      };
    }

    // Checar se há atividade operacional recente
    let observerData = null;
    if (this.antigravityObserver && typeof this.antigravityObserver.inspect === 'function') {
      try {
        observerData = await this.antigravityObserver.inspect(false);
      } catch (e) {}
    }

    const isTaskActive = observerData && observerData.execution_phase === 'IN_PROGRESS' && observerData.freshness === 'CURRENT';

    if (isTaskActive) {
      return {
        state: 'ANTIGRAVITY_WORKING_CONFIRMED',
        description: `O Antigravity está ativo e trabalhando na Issue #${observerData.current_issue_number} (${observerData.current_task_id}).`,
        prerequisiteRunning: true,
        working: true,
        taskData: observerData
      };
    }

    return {
      state: 'ANTIGRAVITY_GUI_READY_IDLE',
      description: 'O Antigravity está aberto e com interface pronta, aguardando retomada ou comando.',
      prerequisiteRunning: true,
      working: false,
      waitingResumeCommand: true
    };
  }

  /**
   * Dispara o ciclo de retomada operacional para um determinado trigger
   * @param {string} triggerType 'BOOT_RECOVERY' | 'INTERNET_RETURN' | 'ANTIGRAVITY_RECOVERY' | 'OWNER_REMOTE_TRIGGER'
   * @param {Object} [details]
   * @returns {Promise<Object>}
   */
  async triggerResume(triggerType, details = {}) {
    const resumeEventId = details.resume_event_id || `${triggerType.toLowerCase()}_${Date.now()}`;
    const detectedAt = new Date().toISOString();

    // 1. Gate de Deduplicação / Idempotência
    if (this.eventStore.isEventProcessed(resumeEventId)) {
      const journalEntry = {
        resume_event_id: resumeEventId,
        trigger: triggerType,
        action: 'NO_OP',
        reason: 'ALREADY_PROCESSED',
        final_state: 'DEDUPE_SUPPRESSED'
      };
      this._appendJournal(journalEntry);
      return journalEntry;
    }

    // 2. Gate de Cooldown Global (exceto quando acionado explicitamente pelo proprietário)
    if (triggerType !== 'OWNER_REMOTE_TRIGGER' && this.eventStore.isCooldownActive(this.cooldownMs)) {
      const journalEntry = {
        resume_event_id: resumeEventId,
        trigger: triggerType,
        action: 'NO_OP',
        reason: 'COOLDOWN_ACTIVE',
        final_state: 'COOLDOWN_SUPPRESSED'
      };
      this._appendJournal(journalEntry);
      return journalEntry;
    }

    // 3. Gate de Processo do Antigravity
    let processRunning = this.uiAdapter.isProcessRunning();
    if (!processRunning) {
      if (this.recoveryManager && typeof this.recoveryManager.restoreComponent === 'function') {
        this.recoveryManager.restoreComponent('antigravity');
        // Breve pausa para estabilização da inicialização do processo
        await new Promise(r => setTimeout(r, 2000));
        processRunning = this.uiAdapter.isProcessRunning();
      }
    }

    if (!processRunning) {
      const journalEntry = {
        resume_event_id: resumeEventId,
        trigger: triggerType,
        action: 'ALERT_OWNER',
        reason: 'PROCESS_UNAVAILABLE',
        final_state: 'ABORTED'
      };
      this._appendJournal(journalEntry);
      this._notifyTelegram('Não consegui restaurar o Antigravity no host.');
      return journalEntry;
    }

    // 4. Gate de Prontidão da GUI e Ambiguidade
    const guiStatus = this.uiAdapter.evaluateGuiReadiness();
    if (!guiStatus.ready) {
      let telegramMsg = '';
      if (guiStatus.state === 'GRAPHICAL_SESSION_LOCKED') {
        telegramMsg = 'Sessão gráfica bloqueada (Windows Locked). Envio de V deferido com segurança até o desbloqueio interativo.';
      } else if (guiStatus.state === 'AMBIGUOUS_CONVERSATION') {
        telegramMsg = 'Não enviei V: não consegui identificar a conversa com segurança.';
      } else if (guiStatus.state === 'ANTIGRAVITY_BLOCKED_OR_WAITING_OWNER') {
        telegramMsg = 'Não enviei V: há modal de permissão ou segurança aberto na tela.';
      } else {
        telegramMsg = 'O Antigravity está rodando mas nenhuma janela foi encontrada na tela. Aguardando janela carregar.';
      }

      const journalEntry = {
        resume_event_id: resumeEventId,
        trigger: triggerType,
        action: guiStatus.state === 'GRAPHICAL_SESSION_LOCKED' ? 'DEFER_LOCKED' : (guiStatus.state === 'ANTIGRAVITY_BLOCKED_OR_WAITING_OWNER' ? 'ALERT_OWNER' : 'NO_SEND'),
        reason: guiStatus.reason,
        final_state: guiStatus.state
      };
      this._appendJournal(journalEntry);
      this._notifyTelegram(telegramMsg);
      this._notifyGitHub(triggerType, journalEntry);
      return journalEntry;
    }

    // 5. Gate de Envio Canônico de 'V'
    const sendRes = await this.uiAdapter.focusAndSendV('V', guiStatus.window);

    if (sendRes.success && sendRes.sentConfirmed) {
      this.eventStore.recordEvent({
        resume_event_id: resumeEventId,
        trigger_type: triggerType,
        detected_at: detectedAt,
        conversation_identity_hash: guiStatus.window ? guiStatus.window.title : 'DEFAULT',
        send_attempted: true,
        send_confirmed: true,
        ack_observed: true,
        result: 'V_SENT_CONFIRMED',
        reason: 'Comando canônico V enviado com sucesso à conversa operacional identificada'
      });

      let notifyText = '';
      if (triggerType === 'BOOT_RECOVERY') {
        notifyText = 'PC retomado; Vigia iniciou e Antigravity foi restaurado com V.';
      } else if (triggerType === 'INTERNET_RETURN') {
        notifyText = 'Internet voltou; fluxo operacional retomado com V.';
      } else if (triggerType === 'ANTIGRAVITY_RECOVERY') {
        notifyText = 'Antigravity foi reaberto e V enviado à conversa operacional.';
      } else {
        notifyText = 'Fluxo retomado: comando V enviado com sucesso à conversa operacional.';
      }

      const journalEntry = {
        resume_event_id: resumeEventId,
        trigger: triggerType,
        action: 'SEND_V',
        reason: 'GATES_SATISFIED',
        send_confirmation: true,
        ack_observed: true,
        final_state: 'V_SENT_CONFIRMED'
      };

      this._appendJournal(journalEntry);
      this._notifyTelegram(notifyText);
      this._notifyGitHub(triggerType, journalEntry);

      return journalEntry;
    }

    // 6. Envio Incerto ou Falha Técnica
    this.eventStore.recordEvent({
      resume_event_id: resumeEventId,
      trigger_type: triggerType,
      detected_at: detectedAt,
      send_attempted: true,
      send_confirmed: false,
      result: 'SEND_UNCERTAIN',
      reason: sendRes.reason || 'Envio incerto'
    });

    const uncertainEntry = {
      resume_event_id: resumeEventId,
      trigger: triggerType,
      action: 'ALERT_OWNER',
      reason: sendRes.reason || 'SEND_UNCERTAIN',
      send_confirmation: false,
      final_state: 'SEND_UNCERTAIN'
    };

    this._appendJournal(uncertainEntry);
    this._notifyTelegram('Envio de V ficou incerto; não repeti para evitar duplicidade.');
    this._notifyGitHub(triggerType, uncertainEntry);

    return uncertainEntry;
  }

  _notifyTelegram(text) {
    if (this.telegramAlertManager && typeof this.telegramAlertManager.enviarAlerta === 'function') {
      try {
        this.telegramAlertManager.enviarAlerta(text);
      } catch (e) {}
    }
  }

  _notifyGitHub(triggerType, entry) {
    if (this.customGitHubNotifier && typeof this.customGitHubNotifier === 'function') {
      try {
        this.customGitHubNotifier(triggerType, entry);
      } catch (e) {}
    }
  }

  getRecentJournalEntries(limit = 10) {
    try {
      if (!fs.existsSync(this.journalPath)) return [];
      const lines = fs.readFileSync(this.journalPath, 'utf8').split(/\r?\n/).filter(Boolean);
      return lines.slice(-limit).map(l => {
        try { return JSON.parse(l); } catch (e) { return null; }
      }).filter(Boolean).reverse();
    } catch (e) {
      return [];
    }
  }
}

module.exports = OperationalResumeController;
