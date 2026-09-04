/**
 * AntigravityObserver.js - Observador Factual da Atividade do Antigravity
 * 
 * Princípios e Correções Arquiteturais:
 * 1. Ambiguidade: Se houver mais de uma Issue IN_PROGRESS, reporta DIVERGENT/AMBIGUOUS.
 * 2. Fallback Factual: Nunca adota a ordem da API do GitHub como verdade operacional.
 * 3. Freshness / Staleness: Classificação explícita CURRENT vs STALE com idade calculada.
 * 4. TASK_ID Canônico: Preserva o TASK_ID real ou null, sem inventar identificadores.
 * 5. Degradação Offline: Resposta local útil caso a API do GitHub falhe.
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
    this.staleThresholdMs = options.staleThresholdMs || 300000; // 5 minutos
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

      const evaluatedIssues = [];
      for (const issue of issues) {
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

      // 1. Avaliação de concorrência e precedência
      const inProgressTasks = evaluatedIssues.filter(i => i.cardStatus === 'IN_PROGRESS');

      if (inProgressTasks.length > 1) {
        // Ambiguidade factual: múltiplas tarefas IN_PROGRESS simultâneas
        this.cachedState = {
          found: true,
          gitHubAvailable: true,
          isAmbiguous: true,
          ambiguousIssues: inProgressTasks.map(t => t.issueNumber),
          cardStatus: 'DIVERGENT_AMBIGUOUS_TASK',
          reason: 'MULTIPLE_IN_PROGRESS_TASKS'
        };
        this.cacheTimestamp = now;
        return this.cachedState;
      }

      let selectedTask = null;
      let isHistoricalOnly = false;

      if (inProgressTasks.length === 1) {
        selectedTask = inProgressTasks[0];
      } else {
        // Nenhuma IN_PROGRESS. Busca se há tarefa em REVIEW ativa
        const reviewTasks = evaluatedIssues.filter(i => i.cardStatus === 'REVIEW');
        if (reviewTasks.length > 0) {
          selectedTask = reviewTasks[0];
        } else {
          // Sem tarefa ativa: adota como histórico se houver, mas sinaliza ausência de tarefa em execução
          const knownTasks = evaluatedIssues.filter(i => i.cardStatus !== 'UNKNOWN');
          if (knownTasks.length > 0) {
            selectedTask = knownTasks[0];
            isHistoricalOnly = true;
          }
        }
      }

      if (!selectedTask || selectedTask.cardStatus === 'UNKNOWN') {
        this.cachedState = { found: false, reason: 'NO_ACTIVE_OR_KNOWN_TASK', gitHubAvailable: true };
        this.cacheTimestamp = now;
        return this.cachedState;
      }

      const lastActivityMs = selectedTask.lastActivityTimestamp ? new Date(selectedTask.lastActivityTimestamp).getTime() : now;
      const ageMs = Math.max(0, now - lastActivityMs);
      const freshness = ageMs > this.staleThresholdMs ? 'STALE' : 'CURRENT';

      this.cachedState = {
        found: true,
        gitHubAvailable: true,
        isAmbiguous: false,
        isHistoricalOnly,
        issueNumber: selectedTask.issueNumber,
        issueTitle: selectedTask.issueTitle,
        taskId: selectedTask.taskId, // Canônico real ou null
        cardStatus: selectedTask.cardStatus,
        lastActivityTimestamp: selectedTask.lastActivityTimestamp,
        freshness,
        ageMs,
        ageMinutes: Math.round(ageMs / 60000),
        lastActionSummary: selectedTask.lastActionSummary,
        ownerDecisionRequired: selectedTask.ownerDecisionRequired,
        lastResultOrError: selectedTask.lastResultOrError,
        blockingClassification: selectedTask.blockingClassification
      };
      this.cacheTimestamp = now;
      return this.cachedState;
    } catch (e) {
      return {
        found: false,
        gitHubAvailable: false,
        reason: 'GITHUB_UNAVAILABLE',
        error: e.message
      };
    }
  }

  async inspect(detailed = false) {
    let processRunning = false;
    if (this.recoveryManager) {
      const inv = this.recoveryManager.inventoryState();
      processRunning = inv.antigravity ? inv.antigravity.running : false;
    }

    const task = await this.fetchGitHubActiveTask();

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
    } else if (task && task.isAmbiguous) {
      responseMode = 'DIVERGENT';
      confidence = 'HIGH';
      executionPhase = 'DIVERGENT';
    } else if (processRunning && isTaskActive) {
      confidence = 'HIGH';
      if (task.isHistoricalOnly) {
        executionPhase = 'PROCESS_RUNNING_TASK_UNKNOWN';
      } else if (task.ownerDecisionRequired) {
        executionPhase = 'WAITING_OWNER';
      } else if (task.cardStatus === 'IN_PROGRESS') {
        executionPhase = 'IN_PROGRESS';
      } else if (task.cardStatus === 'REVIEW') {
        executionPhase = 'REVIEW';
      } else if (task.cardStatus === 'DONE') {
        executionPhase = 'IDLE';
      } else {
        executionPhase = 'PROCESS_RUNNING_TASK_UNKNOWN';
        confidence = 'MEDIUM';
      }
    } else if (processRunning && !isTaskActive) {
      executionPhase = (task && task.reason === 'NO_OPEN_ISSUES') ? 'IDLE' : 'PROCESS_RUNNING_TASK_UNKNOWN';
      confidence = 'HIGH';
      sourceOfTruth = 'LOCAL_PROCESS_AND_GITHUB_TASK';
    } else if (!processRunning && isTaskActive && task.cardStatus === 'IN_PROGRESS') {
      executionPhase = 'DIVERGENT';
      confidence = 'HIGH';
      responseMode = 'DIVERGENT';
    } else if (!processRunning) {
      executionPhase = 'STOPPED';
      confidence = 'HIGH';
    }

    let calculatedAgeMinutes = task && task.ageMinutes !== undefined ? task.ageMinutes : null;
    let calculatedFreshness = task && task.freshness ? task.freshness : 'UNKNOWN';
    if (task && task.lastActivityTimestamp) {
      const lastMs = new Date(task.lastActivityTimestamp).getTime();
      const ageMs = Math.max(0, Date.now() - lastMs);
      if (calculatedAgeMinutes === null) {
        calculatedAgeMinutes = Math.round(ageMs / 60000);
      }
      if (calculatedFreshness === 'UNKNOWN') {
        calculatedFreshness = ageMs > this.staleThresholdMs ? 'STALE' : 'CURRENT';
      }
    }

    const payload = {
      antigravity_process_running: processRunning,
      current_task_id: task && task.taskId ? task.taskId : null,
      current_issue_number: task && task.issueNumber ? task.issueNumber : null,
      current_card_status: task && task.cardStatus ? task.cardStatus : (processRunning && !isTaskActive ? 'IDLE' : 'UNKNOWN'),
      is_ambiguous: task ? !!task.isAmbiguous : false,
      ambiguous_issues: task && task.ambiguousIssues ? task.ambiguousIssues : [],
      execution_phase: executionPhase,
      last_activity_timestamp: task && task.lastActivityTimestamp ? task.lastActivityTimestamp : null,
      freshness: calculatedFreshness,
      age_minutes: calculatedAgeMinutes,
      last_action_summary: task && task.lastActionSummary ? SanitizadorSegredos.sanitizarTexto(task.lastActionSummary) : null,
      owner_decision_required: task ? !!task.ownerDecisionRequired : false,
      last_result_or_error: task && task.lastResultOrError ? SanitizadorSegredos.sanitizarTexto(task.lastResultOrError) : null,
      blocking_classification: task && task.blockingClassification ? task.blockingClassification : 'NONE',
      source_of_truth_used: sourceOfTruth,
      confidence,
      response_mode: responseMode
    };

    payload.summary = ResponseFormatter.formatAntigravityStatus(payload, detailed);

    return payload;
  }
}

module.exports = AntigravityObserver;
