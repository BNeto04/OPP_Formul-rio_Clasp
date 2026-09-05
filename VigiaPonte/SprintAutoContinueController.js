/**
 * VigiaPonte/SprintAutoContinueController.js
 * 
 * Controlador de Ciclo de Vida da Sprint e Auto-Continuidade (Issue #48).
 * 
 * Redefine a semântica legada de "Parar após a entrega":
 * - Em vez de desligar o executor e exigir intervenção humana,
 *   a entrega transiciona para WAITING_FOR_AUDIT.
 * - Ao receber auditoria do ChatGPT (APPROVE ou CORRECTION_REQUIRED) ou wake-up,
 *   rearma automaticamente o circuito para consumir o GitHub.
 * - O término efetivo (STOP) só ocorre em:
 *   1. SPRINT_DONE (todas as tarefas concluídas e homologadas)
 *   2. OWNER_DECISION_REQUIRED (decisão humana expressamente necessária)
 *   3. Erro crítico irrecuperável ou ambiguidade fail-closed
 */

const fs = require('fs');
const path = require('path');
const { sanitizarObjeto } = require('./SanitizadorSegredos');

class SprintAutoContinueController {
  constructor(options = {}) {
    this.sprintId = options.sprintId || 'SPRINT-PC-TRABALHO-SANEAMENTO-DONE-001';
    this.journalPath = options.journalPath || path.join(__dirname, 'sprint_lifecycle_journal.log');
    this.carrierQueue = options.carrierQueue || null;
    
    // Estado inicial
    this.state = 'IDLE'; 
    // Máquina de estados:
    // IDLE -> READY_TO_CONSUME_GITHUB -> EXECUTING -> WAITING_FOR_AUDIT -> REARMED_NEXT -> SPRINT_DONE / STOPPED
    this.currentTask = null;
    this.completedTasks = new Set();
    this.pendingTasks = options.initialTasks ? [...options.initialTasks] : [];
    this.ownerDecisionPending = false;
    this.auditHistory = [];
  }

  _appendJournal(event, data = {}) {
    try {
      const sanitized = sanitizarObjeto(data);
      const entry = JSON.stringify({
        sprint_id: this.sprintId,
        event,
        state: this.state,
        timestamp: new Date().toISOString(),
        ...sanitized
      }) + '\n';
      fs.appendFileSync(this.journalPath, entry, 'utf8');
    } catch (e) {}
  }

  /**
   * Recebe estímulo externo (Wake-up da extensão Outbound ou diretiva)
   */
  handleWakeUp(wakePayload = {}) {
    const callId = wakePayload.call_id || 'NO_CALL';
    this._appendJournal('WAKE_RECEIVED', { callId, text: wakePayload.payload });

    if (this.state === 'SPRINT_DONE') {
      return {
        action: 'HOLD_SPRINT_DONE',
        shouldStop: true,
        reason: 'Sprint já finalizada com zero pendências.'
      };
    }

    if (this.ownerDecisionPending || this.state === 'OWNER_DECISION_REQUIRED') {
      return {
        action: 'HOLD_OWNER_DECISION',
        shouldStop: true,
        reason: 'Aguardando decisão explícita do proprietário.'
      };
    }

    // Auto-rearm para ler o GitHub
    this.state = 'READY_TO_CONSUME_GITHUB';
    this._appendJournal('AUTO_REARM_TRIGGERED', { target: 'GITHUB' });

    return {
      action: 'CONSUME_GITHUB',
      shouldStop: false,
      callId,
      sprintId: this.sprintId
    };
  }

  /**
   * Inicia a execução de uma tarefa factual obtida do GitHub
   */
  startTaskExecution(taskNumber, taskTitle = '') {
    this.currentTask = {
      taskNumber,
      taskTitle,
      started_at: new Date().toISOString()
    };
    this.state = 'EXECUTING';
    this._appendJournal('TASK_EXECUTION_STARTED', { taskNumber, taskTitle });
    return { status: 'EXECUTING', taskNumber };
  }

  /**
   * Conclui a execução da tarefa atual e publica o RESULT
   * Redefinição canônica: NÃO desliga o executor, entra em WAITING_FOR_AUDIT
   */
  finishTaskAndPublishResult(taskNumber, resultData = {}) {
    this.state = 'WAITING_FOR_AUDIT';
    this._appendJournal('TASK_RESULT_PUBLISHED_WAITING_AUDIT', { taskNumber, resultData });

    return {
      status: 'WAITING_FOR_AUDIT',
      taskNumber,
      shouldStop: false, // CONTINUA VIVO AGUARDANDO AUDITORIA
      message: 'Execução concluída; aguardando auditoria'
    };
  }

  /**
   * Processa o retorno de auditoria emitido pelo ChatGPT / Proprietário
   * @param {string} decision 'APPROVE' | 'CORRECTION_REQUIRED' | 'OWNER_DECISION_REQUIRED'
   * @param {Object} details
   */
  processAuditDecision(decision, details = {}) {
    const taskNumber = details.taskNumber || (this.currentTask ? this.currentTask.taskNumber : null);
    this._appendJournal('AUDIT_DECISION_RECEIVED', { decision, taskNumber, details });
    this.auditHistory.push({ decision, taskNumber, timestamp: new Date().toISOString() });

    if (decision === 'APPROVE') {
      if (taskNumber) {
        this.completedTasks.add(taskNumber);
        this.pendingTasks = this.pendingTasks.filter(t => t !== taskNumber);
      }
      this.currentTask = null;

      // Verifica se restam tarefas na sprint
      if (this.pendingTasks.length === 0) {
        this.state = 'SPRINT_DONE';
        this._appendJournal('SPRINT_ALL_TASKS_COMPLETED', { completed: Array.from(this.completedTasks) });
        return {
          action: 'SPRINT_DONE',
          shouldStop: true,
          reason: 'Todas as tarefas da Sprint foram concluídas e aprovadas.'
        };
      }

      // Auto-rearm imediato para próxima tarefa válida da Sprint
      const nextTask = this.pendingTasks[0];
      this.state = 'READY_TO_CONSUME_GITHUB';
      this._appendJournal('AUTO_ADVANCE_NEXT_TASK', { nextTask });

      return {
        action: 'AUTO_ADVANCE_NEXT_TASK',
        shouldStop: false,
        nextTask,
        remainingCount: this.pendingTasks.length
      };
    }

    if (decision === 'CORRECTION_REQUIRED') {
      // Reabre a mesma tarefa para correção sem nova CALL
      this.state = 'READY_TO_CONSUME_GITHUB';
      this._appendJournal('AUTO_REARM_CORRECTION_SAME_TASK', { taskNumber });

      return {
        action: 'RETRY_SAME_TASK_CORRECTION',
        shouldStop: false,
        taskNumber,
        reason: details.reason || 'Correção exigida na mesma Issue.'
      };
    }

    if (decision === 'OWNER_DECISION_REQUIRED') {
      this.state = 'OWNER_DECISION_REQUIRED';
      this.ownerDecisionPending = true;
      this._appendJournal('STOP_OWNER_DECISION_REQUIRED', { details });

      return {
        action: 'STOP_OWNER_DECISION_REQUIRED',
        shouldStop: true,
        reason: details.reason || 'Decisão humana obrigatória.'
      };
    }

    // Decisão desconhecida -> Fail-closed
    this.state = 'STOPPED_UNKNOWN_DECISION';
    return {
      action: 'STOP_FAIL_CLOSED',
      shouldStop: true,
      reason: `Decisão de auditoria não reconhecida: ${decision}`
    };
  }

  isStopped() {
    return ['SPRINT_DONE', 'OWNER_DECISION_REQUIRED', 'STOPPED_UNKNOWN_DECISION'].includes(this.state);
  }
}

module.exports = SprintAutoContinueController;
