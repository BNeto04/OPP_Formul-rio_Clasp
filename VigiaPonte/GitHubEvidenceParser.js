/**
 * GitHubEvidenceParser.js - Parser Estruturado Centralizado de Evidências do GitHub
 * 
 * Regras Estritas:
 * 1. Default inicial é UNKNOWN/null. Nunca assume IN_PROGRESS sem evidência positiva.
 * 2. OWNER_DECISION_REQUIRED respeita a ordem cronológica mais recente (não sticky).
 * 3. DECISION avalia tipos estruturados canônicos sem heurísticas de palavras soltas.
 * 4. TASK_ID extraído canonicamente da Issue/comentários. Nunca fabrica ISSUE-${number}.
 */

class GitHubEvidenceParser {
  /**
   * Analisa o corpo de um texto (Issue ou Comentário)
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
        ownerDecisionRequired: null,
        blockingClassification: null,
        auditDecision: null,
        lastActionSummary: null,
        lastResultOrError: null,
        timestamp: null
      };
    }

    let cardStatus = null;
    let taskId = null;
    let issueNumber = null;
    let ownerDecisionRequired = null;
    let blockingClassification = null;
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
          if (k === 'updated_at' || k === 'timestamp') timestamp = v;
        }
      }
    }

    // 2. Extração de TASK_ID estruturado canônico
    const taskMatch = body.match(/TASK_ID:\s*`?([A-Z0-9_-]+)`?/i);
    if (taskMatch) {
      taskId = taskMatch[1].trim();
    }

    // 3. Extração de ISSUE_NUMBER estruturado
    const issueMatch = body.match(/ISSUE_NUMBER:\s*(\d+)/i);
    if (issueMatch) {
      issueNumber = parseInt(issueMatch[1], 10);
    }

    // 4. Decisão do Proprietário (não-sticky: captura true ou false explícito)
    const ownerDecMatch = body.match(/OWNER_DECISION_REQUIRED:\s*(true|false)/i);
    if (ownerDecMatch) {
      ownerDecisionRequired = ownerDecMatch[1].toLowerCase() === 'true';
    }

    const blockMatch = body.match(/BLOCKING_CLASSIFICATION:\s*([A-Z0-9_]+)/i);
    if (blockMatch) {
      blockingClassification = blockMatch[1].toUpperCase().trim();
    }

    // 5. Decisão de Auditoria Estruturada (TYPE: AUDIT_DECISION / DECISION: ...)
    const isAuditBlock = /TYPE:\s*AUDIT_DECISION/i.test(body);
    const decisionMatch = body.match(/DECISION:\s*([A-Z0-9_]+)/i);
    if (isAuditBlock && decisionMatch) {
      auditDecision = decisionMatch[1].toUpperCase().trim();
    } else if (decisionMatch && !auditDecision) {
      // Fallback para DECISION isolada
      auditDecision = decisionMatch[1].toUpperCase().trim();
    }

    // 6. Resumo da ação (título markdown nível 2 ou 3)
    const headerMatch = body.match(/^#{2,3}\s+(.+)$/m);
    if (headerMatch) {
      lastActionSummary = headerMatch[1].trim();
    }

    // 7. Extração de erros / incidentes
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
   * Determina o status efetivo da Issue a partir do corpo da Issue e comentários
   * @param {object} issue - objeto da Issue da API do GitHub
   * @param {Array} comments - lista de comentários cronológicos da Issue
   * @returns {object}
   */
  static evaluateIssueStatus(issue, comments = []) {
    if (!issue) return null;

    // Inicia com UNKNOWN/null. Nunca assume IN_PROGRESS sem evidência explícita.
    let currentStatus = 'UNKNOWN';
    let taskId = null;
    let ownerDecisionRequired = false;
    let blockingClassification = 'NONE';
    let lastActionSummary = issue.title;
    let lastResultOrError = null;
    let lastActivityTimestamp = issue.created_at;

    // 1. Inspeciona o corpo da própria Issue
    if (issue.body) {
      const issueBodyParsed = this.parseCommentBody(issue.body);
      if (issueBodyParsed.taskId) taskId = issueBodyParsed.taskId;
      if (issueBodyParsed.cardStatus) currentStatus = issueBodyParsed.cardStatus;
      if (issueBodyParsed.ownerDecisionRequired !== null) ownerDecisionRequired = issueBodyParsed.ownerDecisionRequired;
      if (issueBodyParsed.blockingClassification) blockingClassification = issueBodyParsed.blockingClassification;
    }

    // 2. Ordena comentários cronologicamente por created_at
    const sortedComments = [...comments].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    // 3. Processa cada comentário na ordem cronológica exata
    for (const c of sortedComments) {
      const parsed = this.parseCommentBody(c.body);
      if (parsed.cardStatus) currentStatus = parsed.cardStatus;
      if (parsed.taskId) taskId = parsed.taskId;
      if (parsed.ownerDecisionRequired !== null) ownerDecisionRequired = parsed.ownerDecisionRequired;
      if (parsed.blockingClassification) blockingClassification = parsed.blockingClassification;
      if (parsed.lastActionSummary) lastActionSummary = parsed.lastActionSummary;
      if (parsed.lastResultOrError) lastResultOrError = parsed.lastResultOrError;
      if (c.created_at) lastActivityTimestamp = c.created_at;

      // Decisão canônica estruturada de auditoria
      if (parsed.auditDecision) {
        if (parsed.auditDecision === 'APPROVE') {
          currentStatus = 'DONE';
        } else if (parsed.auditDecision === 'APPROVE_WITH_NONBLOCKING_CORRECTION') {
          // Se a issue já foi fechada no GitHub, status é DONE; se continua aberta, permanece REVIEW
          currentStatus = issue.state === 'closed' ? 'DONE' : 'REVIEW';
        } else if (parsed.auditDecision === 'CORRECTION_REQUIRED_BEFORE_DONE') {
          currentStatus = 'REVIEW';
        } else if (parsed.auditDecision === 'REJECT') {
          currentStatus = 'IN_PROGRESS';
        }
      }
    }

    // Se o estado oficial da issue no GitHub for closed, é indiscutivelmente DONE
    if (issue.state === 'closed') {
      currentStatus = 'DONE';
    }

    return {
      issueNumber: issue.number,
      issueTitle: issue.title,
      state: issue.state,
      taskId, // null se nao houver TASK_ID estruturado; nunca inventa ISSUE-num
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
