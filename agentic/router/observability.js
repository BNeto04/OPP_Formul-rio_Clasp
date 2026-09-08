/**
 * Syntheon Agentic Layer - Observability, Metrics Collector & Event Trail
 * Card: #74 T-A01-OBSERVABILITY-006
 */

const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', 'logs');
const EVENT_TRAIL_FILE = path.join(LOG_DIR, 'event_trail.jsonl');
const METRICS_SNAPSHOT_FILE = path.join(LOG_DIR, 'metrics_snapshot.json');

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

class ObservabilityCollector {
  constructor() {
    this.router_started_at = new Date().toISOString();
    this.metrics_since = this.router_started_at;
    this.last_request_at = null;
    this.last_fallback_at = null;

    // Contadores globais event-driven
    this.requests_total = 0;
    this.requests_success = 0;
    this.requests_failed = 0;
    this.attempts_total = 0;
    this.retries_total = 0;
    this.fallbacks_total = 0;
    this.timeouts_total = 0;
    this.rate_limits_total = 0;
    this.server_5xx_total = 0;
    this.auth_errors_total = 0;
    this.task_failures_total = 0;
    this.provider_failures_total = 0;
    this.idempotency_replays_total = 0;
    this.circuit_open_total = 0;

    // Contadores de ociosidade garantida
    this.idle_llm_calls = 0;
    this.idle_network_calls = 0;

    // Provedores ativos da sprint
    this.providers = {
      gemini: {
        attempts: 0,
        success: 0,
        failures: 0,
        retries: 0,
        latency_total_ms: 0,
        latency_avg_ms: 0,
        latency_last_ms: 0
      },
      groq: {
        attempts: 0,
        success: 0,
        failures: 0,
        retries: 0,
        latency_total_ms: 0,
        latency_avg_ms: 0,
        latency_last_ms: 0
      },
      openrouter: { status: 'DEFERRED' },
      deepseek: { status: 'DEFERRED' }
    };

    // Ring buffer para trilha em memória (máx 100 eventos)
    this.recentEvents = [];
    this.maxMemoryEvents = 100;
  }

  recordRequest(executionId, taskId) {
    this.requests_total++;
    this.last_request_at = new Date().toISOString();
    this.recordEvent({
      timestamp: this.last_request_at,
      execution_id: executionId || 'UNKNOWN',
      task_id: taskId || 'UNKNOWN',
      provider: null,
      attempt: 1,
      event_type: 'REQUEST_RECEIVED',
      error_class: null,
      fallback_decision: null,
      latency_ms: 0
    });
  }

  recordSuccess(provider, latencyMs = 0, isFallback = false, fallbackReason = null, executionId = null, taskId = null) {
    this.requests_success++;
    this.attempts_total++;
    if (this.providers[provider]) {
      const p = this.providers[provider];
      p.attempts++;
      p.success++;
      p.latency_last_ms = latencyMs;
      p.latency_total_ms += latencyMs;
      p.latency_avg_ms = Math.round(p.latency_total_ms / p.success);
    }

    if (isFallback && !this.last_fallback_at) {
      this.last_fallback_at = new Date().toISOString();
    }

    this.recordEvent({
      timestamp: new Date().toISOString(),
      execution_id: executionId || 'UNKNOWN',
      task_id: taskId || 'UNKNOWN',
      provider: provider,
      attempt: 1,
      event_type: 'EXECUTION_SUCCESS',
      error_class: null,
      fallback_decision: isFallback ? (fallbackReason || 'fallback_used') : null,
      latency_ms: latencyMs
    });
    this.saveSnapshot();
  }

  recordFailure(provider, errorClass, isProviderFailure, latencyMs = 0, executionId = null, taskId = null) {
    this.requests_failed++;
    this.attempts_total++;

    if (provider && this.providers[provider]) {
      this.providers[provider].attempts++;
      this.providers[provider].failures++;
      this.providers[provider].latency_last_ms = latencyMs;
    }

    if (isProviderFailure) {
      this.provider_failures_total++;
    } else {
      this.task_failures_total++;
    }

    if (errorClass === 'QUOTA_429' || errorClass === 'RATE_LIMIT') this.rate_limits_total++;
    if (errorClass === 'TIMEOUT') this.timeouts_total++;
    if (errorClass === 'SERVER_5XX') this.server_5xx_total++;
    if (errorClass === 'AUTH_ERROR') this.auth_errors_total++;

    this.recordEvent({
      timestamp: new Date().toISOString(),
      execution_id: executionId || 'UNKNOWN',
      task_id: taskId || 'UNKNOWN',
      provider: provider || 'none',
      attempt: 1,
      event_type: 'EXECUTION_FAILURE',
      error_class: errorClass || 'UNKNOWN_ERROR',
      fallback_decision: null,
      latency_ms: latencyMs
    });
    this.saveSnapshot();
  }

  recordRetry(provider, executionId = null, taskId = null) {
    this.retries_total++;
    this.attempts_total++;
    if (this.providers[provider]) {
      this.providers[provider].retries++;
      this.providers[provider].attempts++;
    }
    this.recordEvent({
      timestamp: new Date().toISOString(),
      execution_id: executionId || 'UNKNOWN',
      task_id: taskId || 'UNKNOWN',
      provider: provider,
      attempt: 2,
      event_type: 'RETRY_ATTEMPTED',
      error_class: null,
      fallback_decision: 'retry_same_provider',
      latency_ms: null
    });
  }

  recordFallback(fromProvider, toProvider, reason, executionId = null, taskId = null) {
    this.fallbacks_total++;
    this.last_fallback_at = new Date().toISOString();

    // Incrementa contadores especificos da falha que originou o fallback
    if (reason === 'QUOTA_429' || reason === 'RATE_LIMIT') {
      this.rate_limits_total++;
      this.provider_failures_total++;
    } else if (reason === 'TIMEOUT') {
      this.timeouts_total++;
      this.provider_failures_total++;
    } else if (reason === 'SERVER_5XX') {
      this.server_5xx_total++;
      this.provider_failures_total++;
    }

    this.recordEvent({
      timestamp: this.last_fallback_at,
      execution_id: executionId || 'UNKNOWN',
      task_id: taskId || 'UNKNOWN',
      provider: fromProvider,
      attempt: 1,
      event_type: 'FALLBACK_TRANSITION',
      error_class: reason,
      fallback_decision: `transition_to_${toProvider}`,
      latency_ms: null
    });
  }

  recordReplay(idempotencyKey, executionId = null, taskId = null) {
    this.idempotency_replays_total++;
    this.recordEvent({
      timestamp: new Date().toISOString(),
      execution_id: executionId || 'UNKNOWN',
      task_id: taskId || 'UNKNOWN',
      provider: null,
      attempt: 1,
      event_type: 'IDEMPOTENCY_REPLAY',
      error_class: null,
      fallback_decision: null,
      latency_ms: 0
    });
  }

  recordCircuitOpen(provider) {
    this.circuit_open_total++;
    this.recordEvent({
      timestamp: new Date().toISOString(),
      execution_id: 'CIRCUIT_WATCHER',
      task_id: 'CIRCUIT_WATCHER',
      provider: provider,
      attempt: 1,
      event_type: 'CIRCUIT_OPENED',
      error_class: 'CONSECUTIVE_PROVIDER_FAILURES',
      fallback_decision: 'bypass_provider',
      latency_ms: null
    });
  }

  recordEvent(eventObj) {
    // Sanitizacao rigorosa: sem prompts, sem tokens, sem headers sensiveis
    const cleanEvent = {
      timestamp: eventObj.timestamp || new Date().toISOString(),
      execution_id: eventObj.execution_id || 'UNKNOWN',
      task_id: eventObj.task_id || 'UNKNOWN',
      provider: eventObj.provider || null,
      attempt: eventObj.attempt || 1,
      event_type: eventObj.event_type || 'EVENT',
      error_class: eventObj.error_class || null,
      fallback_decision: eventObj.fallback_decision || null,
      latency_ms: (typeof eventObj.latency_ms === 'number') ? eventObj.latency_ms : null
    };

    this.recentEvents.push(cleanEvent);
    if (this.recentEvents.length > this.maxMemoryEvents) {
      this.recentEvents.shift();
    }

    try {
      fs.appendFileSync(EVENT_TRAIL_FILE, JSON.stringify(cleanEvent) + '\n', 'utf8');
    } catch (e) {}
  }

  saveSnapshot() {
    try {
      fs.writeFileSync(METRICS_SNAPSHOT_FILE, JSON.stringify(this.getMetricsSnapshot(), null, 2), 'utf8');
    } catch (e) {}
  }

  getMetricsSnapshot() {
    return {
      status: 'healthy',
      metrics_storage: 'memory_with_local_snapshot',
      router_started_at: this.router_started_at,
      metrics_since: this.metrics_since,
      last_request_at: this.last_request_at,
      last_fallback_at: this.last_fallback_at,
      active_providers: ['gemini', 'groq'],
      deferred_providers: ['openrouter', 'deepseek'],
      requests_total: this.requests_total,
      requests_success: this.requests_success,
      requests_failed: this.requests_failed,
      attempts_total: this.attempts_total,
      retries_total: this.retries_total,
      fallbacks_total: this.fallbacks_total,
      timeouts_total: this.timeouts_total,
      rate_limits_total: this.rate_limits_total,
      server_5xx_total: this.server_5xx_total,
      auth_errors_total: this.auth_errors_total,
      task_failures_total: this.task_failures_total,
      provider_failures_total: this.provider_failures_total,
      idempotency_replays_total: this.idempotency_replays_total,
      circuit_open_total: this.circuit_open_total,
      idle_llm_calls: this.idle_llm_calls,
      idle_network_calls: this.idle_network_calls,
      gemini_metrics: {
        attempts: this.providers.gemini.attempts,
        success: this.providers.gemini.success,
        failures: this.providers.gemini.failures,
        retries: this.providers.gemini.retries,
        latency_avg_ms: this.providers.gemini.latency_avg_ms,
        latency_last_ms: this.providers.gemini.latency_last_ms
      },
      groq_metrics: {
        attempts: this.providers.groq.attempts,
        success: this.providers.groq.success,
        failures: this.providers.groq.failures,
        retries: this.providers.groq.retries,
        latency_avg_ms: this.providers.groq.latency_avg_ms,
        latency_last_ms: this.providers.groq.latency_last_ms
      },
      event_trail_file: EVENT_TRAIL_FILE,
      recent_events_count: this.recentEvents.length,
      recent_events: this.recentEvents.slice(-10) // ultimos 10 eventos
    };
  }

  reset() {
    this.constructor();
  }
}

const globalObservability = new ObservabilityCollector();

module.exports = {
  ObservabilityCollector,
  globalObservability,
  EVENT_TRAIL_FILE,
  METRICS_SNAPSHOT_FILE
};
