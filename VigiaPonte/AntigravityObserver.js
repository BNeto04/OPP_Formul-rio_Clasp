/**
 * AntigravityObserver.js - Observador Factual da Atividade do Antigravity
 * 
 * Princípios:
 * 1. OBSERVAR != CONTROLAR: Somente leitura factual, sem capacidade de controle remoto.
 * 2. Múltiplas Fontes Correlacionadas: Processo local + GitHub Kanban + Timestamps estruturados.
 * 3. Freshness / Staleness: Idade da evidência explicitamente qualificada (CURRENT vs STALE).
 * 4. Degradação Graciosa: Opera com fontes locais caso o GitHub esteja indisponível.
 * 5. Dupla Sanitização: Mascaramento estrito de segredos na ingestão e na saída.
 */

const https = require('https');
const SanitizadorSegredos = require('./SanitizadorSegredos');
const GitHubEvidenceParser = require('./GitHubEvidenceParser');
const ResponseFormatter = require('./ResponseFormatter');

class AntigravityObserver {
  constructor(options = {}) {
    this.gitHubPat = options.gitHubPat || process.env.GITHUB_PAT || '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';
    this.repoOwner = options.repoOwner || 'BNeto04';
    this.repoName = options.repoName || 'OPP_Formul-rio_Clasp';
    this.recoveryManager = options.recoveryManager || null;
    this.cachedState = null;
    this.cacheTimestamp = 0;
    this.cacheTtlMs = options.cacheTtlMs || 15000;
    this.staleThresholdMs = options.staleThresholdMs || 300000; // 5 minutos para STALE
    this.customTaskFetcher = options.customTaskFetcher || null;
  }

  requestGitHub(path) {
    return new Promise((resolve, reject) => {
      const sanitizedPath = SanitizadorSegredos.sanitizarTexto(path);
      const req = https.request({
        hostname: 'api.github.com',
        path: sanitizedPath,
        method: 'GET',
        headers: {
          'User-Agent': 'NodeJS-Syntheon-Vigia-Observer',
          'Authorization': `Bearer ${this.gitHubPat}`,
          'Accept': 'application/vnd.github.v3+json'
        },
        timeout: 5000
      }, res => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(d));
            } catch (e) {
              reject(new Error(`JSON_PARSE_ERROR: ${e.message}`));
            }
          } else {
            reject(new Error(`HTTP_${res.statusCode}`));
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('GITHUB_TIMEOUT'));
      });
      req.on('error', reject);
      req.end();
    });
  }

  async fetchGitHubActiveTask() {
    if (this.customTaskFetcher) {
      return this.customTaskFetcher();
    }

    const now = Date.now();
    if (this.cachedState && (now - this.cacheTimestamp < this.cacheTtlMs)) {
      return this.cachedState;
    }

    try {
      const issues = await this.requestGitHub(`/repos/${this.repoOwner}/${this.repoName}/issues?state=open&sort=updated&direction=desc&per_page=10`);
      if (!Array.isArray(issues) || issues.length === 0) {
        this.cachedState = { found: false, reason: 'NO_OPEN_ISSUES', gitHubAvailable: true };
        this.cacheTimestamp = now;
        return this.cachedState;
      }

      // Avalia cada issue aberta em busca de correlação factual
      const evaluatedIssues = [];
      for (const issue of issues) {
        // Ignora Pull Requests
        if (issue.pull_request) continue;

        let comments = [];
        try {
          comments = await this.requestGitHub(`/repos/${this.repoOwner}/${this.repoName}/issues/${issue.number}/comments?per_page=20`);
        } catch (e) {
          comments = [];
        }

        const evaluated = GitHubEvidenceParser.evaluateIssueStatus(issue, comments);
        if (evaluated) {
          evaluatedIssues.push(evaluated);
        }
      }

      if (evaluatedIssues.length === 0) {
        this.cachedState = { found: false, reason: 'NO_VALID_ISSUES', gitHubAvailable: true };
        this.cacheTimestamp = now;
        return this.cachedState;
      }

      // Regra de Correlação: IN_PROGRESS tem precedência sobre REVIEW ou DONE
      const inProgressTask = evaluatedIssues.find(i => i.cardStatus === 'IN_PROGRESS');
      const activeTask = inProgressTask || evaluatedIssues[0]; // fallback para a mais recente avaliada

      const lastActivityMs = activeTask.lastActivityTimestamp ? new Date(activeTask.lastActivityTimestamp).getTime() : now;
      const ageMs = Math.max(0, now - lastActivityMs);
      const freshness = ageMs > this.staleThresholdMs ? 'STALE' : 'CURRENT';

      this.cachedState = {
        found: true,
        gitHubAvailable: true,
        issueNumber: activeTask.issueNumber,
        issueTitle: activeTask.issueTitle,
        taskId: activeTask.taskId,
        cardStatus: activeTask.cardStatus,
        lastActivityTimestamp: activeTask.lastActivityTimestamp,
        freshness,
        ageMs,
        ageMinutes: Math.round(ageMs / 60000),
        lastActionSummary: activeTask.lastActionSummary,
        ownerDecisionRequired: activeTask.ownerDecisionRequired,
        lastResultOrError: activeTask.lastResultOrError,
        blockingClassification: activeTask.blockingClassification
      };
      this.cacheTimestamp = now;
      return this.cachedState;
    } catch (e) {
      // Degradação sem GitHub: registra indisponibilidade sem travar o Vigia
      return {
        found: false,
        gitHubAvailable: false,
        reason: 'GITHUB_UNAVAILABLE',
        error: e.message
      };
    }
  }

  async inspect(detailed = false) {
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
    let responseMode = 'FACTUAL';

    const isGitHubDown = task && task.gitHubAvailable === false;
    const isTaskActive = task && task.found;

    if (isGitHubDown) {
      responseMode = 'DEGRADED';
      confidence = 'MEDIUM';
      sourceOfTruth = 'LOCAL_PROCESS_ONLY';
      executionPhase = processRunning ? 'PROCESS_RUNNING_TASK_UNKNOWN' : 'STOPPED';
    } else if (processRunning && isTaskActive) {
      confidence = 'HIGH';
      if (task.ownerDecisionRequired) {
        executionPhase = 'WAITING_OWNER';
      } else if (task.cardStatus === 'IN_PROGRESS') {
        executionPhase = 'IN_PROGRESS';
      } else if (task.cardStatus === 'REVIEW') {
        executionPhase = 'REVIEW';
      } else if (task.cardStatus === 'DONE') {
        executionPhase = 'IDLE';
      } else {
        executionPhase = 'IN_PROGRESS';
        confidence = 'MEDIUM';
      }
    } else if (processRunning && !isTaskActive) {
      executionPhase = 'PROCESS_RUNNING_TASK_UNKNOWN';
      confidence = 'MEDIUM';
      sourceOfTruth = 'LOCAL_PROCESS_ONLY';
    } else if (!processRunning && isTaskActive && task.cardStatus === 'IN_PROGRESS') {
      executionPhase = 'DIVERGENT';
      confidence = 'HIGH';
      responseMode = 'DIVERGENT';
    } else if (!processRunning) {
      executionPhase = 'STOPPED';
      confidence = 'HIGH';
    }

    const payload = {
      antigravity_process_running: processRunning,
      current_task_id: task && task.taskId ? task.taskId : null,
      current_issue_number: task && task.issueNumber ? task.issueNumber : null,
      current_card_status: task && task.cardStatus ? task.cardStatus : 'UNKNOWN',
      execution_phase: executionPhase,
      last_activity_timestamp: task && task.lastActivityTimestamp ? task.lastActivityTimestamp : null,
      freshness: task && task.freshness ? task.freshness : 'UNKNOWN',
      age_minutes: task && task.ageMinutes !== undefined ? task.ageMinutes : null,
      last_action_summary: task && task.lastActionSummary ? SanitizadorSegredos.sanitizarTexto(task.lastActionSummary) : null,
      owner_decision_required: task ? !!task.ownerDecisionRequired : false,
      last_result_or_error: task && task.lastResultOrError ? SanitizadorSegredos.sanitizarTexto(task.lastResultOrError) : null,
      blocking_classification: task && task.blockingClassification ? task.blockingClassification : 'NONE',
      source_of_truth_used: sourceOfTruth,
      confidence,
      response_mode: responseMode
    };

    // Formata o resumo em linguagem natural pt-BR via ResponseFormatter com dupla sanitização
    payload.summary = ResponseFormatter.formatAntigravityStatus(payload, detailed);

    return payload;
  }
}

module.exports = AntigravityObserver;
