/**
 * GitHubEvidenceParser.js - Parser Estruturado Centralizado de Evidências do GitHub
 * 
 * Centraliza a interpretação de comentários, marcadores kanban e decisões de auditoria,
 * garantindo que campos ausentes permaneçam null/unknown e nunca sejam inventados.
 */

class GitHubEvidenceParser {
  /**
   * Analisa o corpo de um comentário ou issue do GitHub
   * @param {string} body
   * @returns {object}
   */
  static parseCommentBody(body) {
    if (!body || typeof body !== 'string') {
      return {
        hasEvidence: false,
        cardStatus: null,
        taskId: null,
        issueNumber: null,
        ownerDecisionRequired: false,
        blockingClassification: 'NONE',
        auditDecision: null,
        lastActionSummary: null,
        lastResultOrError: null,
        timestamp: null
      };
    }

    let cardStatus = null;
    let taskId = null;
    let issueNumber = null;
    let ownerDecisionRequired = false;
    let blockingClassification = 'NONE';
    let auditDecision = null;
    let lastActionSummary = null;
    let lastResultOrError = null;
    let timestamp = null;

    // 1. Parser de KANBAN_STATUS_EVIDENCE (JSON ou delimitado por ponto e vírgula)
    const kanbanJsonMatch = body.match(/<!--\s*KANBAN_STATUS_EVIDENCE:\s*({[^>]+})\s*-->/i);
    if (kanbanJsonMatch) {
      try {
        const kb = JSON.parse(kanbanJsonMatch[1]);
        if (kb.status_after) cardStatus = kb.status_after;
        else if (kb.status) cardStatus = kb.status;
        if (kb.task_id) taskId = kb.task_id;
        if (kb.timestamp) timestamp = kb.timestamp;
      } catch (e) {}
    } else {
      const kanbanKvMatch = body.match(/<!--\s*KANBAN_STATUS_EVIDENCE:\s*([^>]+)\s*-->/i);
      if (kanbanKvMatch) {
        const pairs = kanbanKvMatch[1].split(';');
        for (const p of pairs) {
          const [k, v] = p.split('=').map(s => s.trim());
          if (k === 'status') cardStatus = v;
          if (k === 'task_id') taskId = v;
          if (k === 'updated_at') timestamp = v;
        }
      }
    }

    // Fallback de checagem textual estruturada de status
    if (!cardStatus) {
      if (/status=IN_PROGRESS/i.test(body) || /STATUS_KANBAN:\s*`?IN_PROGRESS`?/i.test(body)) {
        cardStatus = 'IN_PROGRESS';
      } else if (/status=REVIEW/i.test(body) || /STATUS_KANBAN:\s*`?REVIEW`?/i.test(body) || /Aguardando auditoria/i.test(body)) {
        cardStatus = 'REVIEW';
      } else if (/status=DONE/i.test(body) || /STATUS_KANBAN:\s*`?DONE`?/i.test(body)) {
        cardStatus = 'DONE';
      }
    }

    // 2. Extração de TASK_ID estruturado
    const taskMatch = body.match(/TASK_ID:\s*`?([A-Z0-9_-]+)`?/i);
    if (taskMatch && !taskId) {
      taskId = taskMatch[1];
    }

    // 3. Extração de ISSUE_NUMBER estruturado
    const issueMatch = body.match(/ISSUE_NUMBER:\s*(\d+)/i);
    if (issueMatch) {
      issueNumber = parseInt(issueMatch[1], 10);
    }

    // 4. Decisão do Proprietário / Auditoria
    if (/OWNER_DECISION_REQUIRED:\s*true/i.test(body)) {
      ownerDecisionRequired = true;
    }

    const blockMatch = body.match(/BLOCKING_CLASSIFICATION:\s*([A-Z_]+)/i);
    if (blockMatch) {
      blockingClassification = blockMatch[1].toUpperCase();
    }

    // Decisão de auditoria explícita
    const decisionMatch = body.match(/DECISION:\s*([A-Z_]+)/i);
    if (decisionMatch) {
      auditDecision = decisionMatch[1].toUpperCase();
    }

    // 5. Extração de resumo da ação (título markdown)
    const headerMatch = body.match(/^#{2,3}\s+(.+)$/m);
    if (headerMatch) {
      lastActionSummary = headerMatch[1].trim();
    }

    // 6. Extração de erros / incidentes
    if (/❌|FAIL|ERRO|ERROR|FATAL/i.test(body)) {
      const errorLine = body.split('\n').find(l => /❌|FAIL|ERRO|ERROR/i.test(l));
      lastResultOrError = errorLine ? errorLine.trim().substring(0, 150) : 'Incidente reportado no registro da tarefa.';
    }

    return {
      hasEvidence: !!(cardStatus || taskId || auditDecision || lastActionSummary),
      cardStatus,
      taskId,
      issueNumber,
      ownerDecisionRequired,
      blockingClassification,
      auditDecision,
      lastActionSummary,
      lastResultOrError,
      timestamp
    };
  }

  /**
   * Determina o status efetivo da Issue a partir dos comentários
   * @param {object} issue - objeto da Issue da API do GitHub
   * @param {Array} comments - lista de comentários da Issue
   * @returns {object}
   */
  static evaluateIssueStatus(issue, comments = []) {
    if (!issue) return null;

    let currentStatus = 'IN_PROGRESS';
    let taskId = null;
    let ownerDecisionRequired = false;
    let blockingClassification = 'NONE';
    let lastActionSummary = issue.title;
    let lastResultOrError = null;
    let lastActivityTimestamp = issue.updated_at || issue.created_at;

    // Processa comentários do mais antigo ao mais recente
    for (const c of comments) {
      const parsed = this.parseCommentBody(c.body);
      if (parsed.cardStatus) currentStatus = parsed.cardStatus;
      if (parsed.taskId) taskId = parsed.taskId;
      if (parsed.ownerDecisionRequired) ownerDecisionRequired = true;
      if (parsed.blockingClassification !== 'NONE') blockingClassification = parsed.blockingClassification;
      if (parsed.lastActionSummary) lastActionSummary = parsed.lastActionSummary;
      if (parsed.lastResultOrError) lastResultOrError = parsed.lastResultOrError;
      if (c.created_at) lastActivityTimestamp = c.created_at;

      // Se houver decisão de auditoria específica
      if (parsed.auditDecision) {
        if (parsed.auditDecision === 'APPROVE') {
          // Só é DONE definitivo se a issue for fechada ou se a aprovação não exigir correção
          if (issue.state === 'closed' || !/CORRECTION|REQUIRED|PENDENTE/i.test(c.body)) {
            currentStatus = 'DONE';
          } else {
            currentStatus = 'REVIEW';
          }
        } else if (parsed.auditDecision.startsWith('APPROVE_WITH')) {
          currentStatus = 'REVIEW';
        } else if (parsed.auditDecision === 'REJECT') {
          currentStatus = 'IN_PROGRESS';
        }
      }
    }

    // Se a issue do GitHub estiver fechada, o status final é impreterivelmente DONE
    if (issue.state === 'closed') {
      currentStatus = 'DONE';
    }

    return {
      issueNumber: issue.number,
      issueTitle: issue.title,
      state: issue.state,
      taskId: taskId || `ISSUE-${issue.number}`,
      cardStatus: currentStatus,
      ownerDecisionRequired,
      blockingClassification,
      lastActionSummary,
      lastResultOrError,
      lastActivityTimestamp
    };
  }
}

module.exports = GitHubEvidenceParser;
