const https = require('https');
const SanitizadorSegredos = require('./SanitizadorSegredos');

class AntigravityObserver {
  constructor(options = {}) {
    this.recoveryManager = options.recoveryManager || null;
    this.journal = options.journal || null;
    this.gitHubPat = options.gitHubPat || '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';
    this.repo = options.repo || 'BNeto04/OPP_Formul-rio_Clasp';
    this.customTaskFetcher = options.customTaskFetcher || null;
    this.cacheTtlMs = options.cacheTtlMs || 15000;
    this.cachedState = null;
    this.cacheTimestamp = 0;
  }

  async fetchGitHubActiveTask() {
    if (this.customTaskFetcher) {
      return this.customTaskFetcher();
    }

    // Cache para evitar rate limit
    const now = Date.now();
    if (this.cachedState && (now - this.cacheTimestamp < this.cacheTtlMs)) {
      return this.cachedState;
    }

    try {
      const issues = await new Promise((resolve, reject) => {
        const req = https.request({
          hostname: 'api.github.com',
          path: `/repos/${this.repo}/issues?state=open&per_page=5`,
          method: 'GET',
          headers: {
            'User-Agent': 'NodeJS-Syntheon-AntigravityObserver',
            'Authorization': `Bearer ${this.gitHubPat}`
          },
          timeout: 4000
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try { resolve(JSON.parse(data)); } catch (e) { resolve([]); }
          });
        });
        req.on('error', () => resolve([]));
        req.on('timeout', () => { req.destroy(); resolve([]); });
        req.end();
      });

      if (!Array.isArray(issues) || issues.length === 0) {
        this.cachedState = { found: false, reason: 'NO_OPEN_ISSUES' };
        this.cacheTimestamp = now;
        return this.cachedState;
      }

      // Procura a issue de maior número aberta (a mais recente ativa)
      const sorted = issues.sort((a, b) => b.number - a.number);
      const activeIssue = sorted[0];

      // Busca os últimos comentários da issue ativa para saber o status atual
      const comments = await new Promise((resolve) => {
        const req = https.request({
          hostname: 'api.github.com',
          path: `/repos/${this.repo}/issues/${activeIssue.number}/comments?per_page=5`,
          method: 'GET',
          headers: {
            'User-Agent': 'NodeJS-Syntheon-AntigravityObserver',
            'Authorization': `Bearer ${this.gitHubPat}`
          },
          timeout: 4000
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try { resolve(JSON.parse(data)); } catch (e) { resolve([]); }
          });
        });
        req.on('error', () => resolve([]));
        req.on('timeout', () => { req.destroy(); resolve([]); });
        req.end();
      });

      let cardStatus = 'UNKNOWN';
      let taskId = null;
      let lastActivityTimestamp = activeIssue.updated_at || activeIssue.created_at;
      let lastActionSummary = activeIssue.title;
      let ownerDecisionRequired = false;
      let lastResultOrError = null;
      let blockingClassification = 'NONE';

      // Extrai metadados da Issue body
      const taskIdMatch = activeIssue.body ? activeIssue.body.match(/TASK_ID:\s*([A-Za-z0-9_-]+)/i) : null;
      if (taskIdMatch) taskId = taskIdMatch[1];

      // Percorre os comentários do mais recente para o mais antigo
      if (Array.isArray(comments) && comments.length > 0) {
        const lastComment = comments[comments.length - 1];
        lastActivityTimestamp = lastComment.updated_at || lastComment.created_at;

        // Verifica evidência KANBAN
        const kanbanMatch = lastComment.body ? lastComment.body.match(/<!--\s*KANBAN_STATUS_EVIDENCE:\s*({[^>]+})\s*-->/i) : null;
        if (kanbanMatch) {
          try {
            const kb = JSON.parse(kanbanMatch[1]);
            cardStatus = kb.status_after || kb.status || 'UNKNOWN';
            if (kb.task_id) taskId = kb.task_id;
          } catch (e) {}
        } else {
          // Checagem por texto
          if (/status=IN_PROGRESS/i.test(lastComment.body) || /STATUS_KANBAN:\s*`?IN_PROGRESS`?/i.test(lastComment.body)) {
            cardStatus = 'IN_PROGRESS';
          } else if (/status=REVIEW/i.test(lastComment.body) || /STATUS_KANBAN:\s*`?REVIEW`?/i.test(lastComment.body) || /Aguardando auditoria/i.test(lastComment.body)) {
            cardStatus = 'REVIEW';
          }
        }

        // Verifica auditoria ou decisão pendente
        if (/OWNER_DECISION_REQUIRED:\s*true/i.test(lastComment.body)) {
          ownerDecisionRequired = true;
        }
        if (/DECISION:\s*APPROVE/i.test(lastComment.body)) {
          cardStatus = 'DONE';
        }

        // Extrai resumo da última ação do comentário
        const headerMatch = lastComment.body.match(/^#{2,3}\s+(.+)$/m);
        if (headerMatch) {
          lastActionSummary = headerMatch[1].trim();
        }

        // Verifica se houve erro
        if (/❌|FAIL|ERRO|ERROR/i.test(lastComment.body)) {
          lastResultOrError = 'Incidente ou falha recente reportada no log da tarefa.';
        }
      } else {
        // Sem comentários, está no estado inicial
        cardStatus = 'IN_PROGRESS';
      }

      this.cachedState = {
        found: true,
        issueNumber: activeIssue.number,
        issueTitle: activeIssue.title,
        taskId: taskId || `ISSUE-${activeIssue.number}`,
        cardStatus,
        lastActivityTimestamp,
        lastActionSummary,
        ownerDecisionRequired,
        lastResultOrError,
        blockingClassification
      };
      this.cacheTimestamp = now;
      return this.cachedState;
    } catch (e) {
      return { found: false, reason: 'FETCH_ERROR', error: e.message };
    }
  }

  async inspect() {
    // 1. Processo do Antigravity
    let processRunning = false;
    if (this.recoveryManager) {
      const inv = this.recoveryManager.inventoryState();
      processRunning = inv.antigravity ? inv.antigravity.running : false;
    }

    // 2. Estado da Tarefa (GitHub / Cache / Injetado)
    const task = await this.fetchGitHubActiveTask();

    // 3. Correlaciona Sinais Factuais
    let executionPhase = 'UNKNOWN';
    let confidence = 'LOW';
    let sourceOfTruth = 'LOCAL_PROCESS_AND_GITHUB_TASK';
    let summary = '';

    const isTaskActive = task && task.found;
    const minutesAgo = task && task.lastActivityTimestamp ? 
      Math.max(0, Math.round((Date.now() - new Date(task.lastActivityTimestamp).getTime()) / 60000)) : null;
    const timeStr = minutesAgo !== null ? (minutesAgo < 2 ? 'há instantes' : `há ${minutesAgo} minutos`) : '';

    if (processRunning && isTaskActive) {
      if (task.ownerDecisionRequired) {
        executionPhase = 'WAITING_OWNER';
        confidence = 'HIGH';
        summary = `O Antigravity está aguardando uma decisão do proprietário na Issue #${task.issueNumber} (${task.taskId}).`;
      } else if (task.cardStatus === 'IN_PROGRESS') {
        executionPhase = 'IN_PROGRESS';
        confidence = 'HIGH';
        summary = `O Antigravity está trabalhando ativamente na Issue #${task.issueNumber} (${task.issueTitle}). O card está IN_PROGRESS no Kanban. A última ação foi registrada ${timeStr}. Não há decisão sua pendente.`;
      } else if (task.cardStatus === 'REVIEW') {
        executionPhase = 'REVIEW';
        confidence = 'HIGH';
        summary = `O Antigravity concluiu a execução da Issue #${task.issueNumber} (${task.taskId}). O card está em REVIEW, aguardando auditoria.`;
      } else if (task.cardStatus === 'DONE') {
        executionPhase = 'IDLE';
        confidence = 'HIGH';
        summary = `A Issue #${task.issueNumber} foi aprovada e concluída (DONE). O Antigravity está ativo e disponível para novas tarefas.`;
      } else {
        executionPhase = 'IN_PROGRESS';
        confidence = 'MEDIUM';
        summary = `O Antigravity está ativo e vinculado à Issue #${task.issueNumber}. A última atividade foi registrada ${timeStr}.`;
      }
    } else if (processRunning && !isTaskActive) {
      executionPhase = 'IDLE';
      confidence = 'MEDIUM';
      sourceOfTruth = 'LOCAL_PROCESS_ONLY';
      summary = 'O processo Antigravity está aberto e em execução no computador, mas não há nenhuma tarefa ou Issue ativa em andamento no momento (IDLE).';
    } else if (!processRunning && isTaskActive && task.cardStatus === 'IN_PROGRESS') {
      executionPhase = 'DIVERGENT';
      confidence = 'MEDIUM';
      summary = `Estado divergente detectado: A Issue #${task.issueNumber} consta como IN_PROGRESS no GitHub, porém o processo Antigravity não está em execução no host local.`;
    } else if (!processRunning) {
      executionPhase = 'STOPPED';
      confidence = 'HIGH';
      summary = 'O Antigravity está fechado (parado) no momento. Nenhuma tarefa está em execução.';
    }

    // Se houver erro recente na tarefa
    if (task && task.lastResultOrError) {
      summary += ` Nota operacional: ${task.lastResultOrError}`;
    }

    const cleanSummary = SanitizadorSegredos.sanitizarTexto(summary);

    return {
      antigravity_process_running: processRunning,
      current_task_id: task && task.taskId ? task.taskId : null,
      current_issue_number: task && task.issueNumber ? task.issueNumber : null,
      current_card_status: task && task.cardStatus ? task.cardStatus : 'UNKNOWN',
      execution_phase: executionPhase,
      last_activity_timestamp: task && task.lastActivityTimestamp ? task.lastActivityTimestamp : null,
      last_action_summary: task && task.lastActionSummary ? SanitizadorSegredos.sanitizarTexto(task.lastActionSummary) : null,
      owner_decision_required: task ? !!task.ownerDecisionRequired : false,
      last_result_or_error: task && task.lastResultOrError ? SanitizadorSegredos.sanitizarTexto(task.lastResultOrError) : null,
      blocking_classification: task && task.blockingClassification ? task.blockingClassification : 'NONE',
      source_of_truth_used: sourceOfTruth,
      confidence,
      summary: cleanSummary
    };
  }
}

module.exports = AntigravityObserver;
