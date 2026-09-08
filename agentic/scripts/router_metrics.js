/**
 * Syntheon Agentic Layer - Router Metrics & Health Query Utility
 * Card: #74 T-A01-OBSERVABILITY-006
 */

const http = require('http');

async function fetchJson(endpoint) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://127.0.0.1:4000${endpoint}`, { timeout: 3000 }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', err => reject(err));
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function showMetrics() {
  console.log('================================================================');
  console.log('       SYNTHEON LOCAL ROUTER - OBSERVABILITY & METRICS DASH     ');
  console.log('================================================================\n');

  try {
    const [health, metrics] = await Promise.all([
      fetchJson('/health'),
      fetchJson('/metrics')
    ]);

    console.log('[HEALTH SUMMARY]');
    console.log(`  Router Alive:      ${health.data.router_alive}`);
    console.log(`  Uptime:            ${health.data.uptime_seconds}s`);
    console.log(`  Active Providers:  ${health.data.active_providers ? health.data.active_providers.join(', ') : 'none'}`);
    console.log(`  Deferred:          ${health.data.deferred_providers ? health.data.deferred_providers.join(', ') : 'none'}`);
    console.log(`  Circuit Gemini:    ${health.data.circuit_state ? health.data.circuit_state.gemini : 'N/A'}`);
    console.log(`  Circuit Groq:      ${health.data.circuit_state ? health.data.circuit_state.groq : 'N/A'}`);
    console.log(`  Idle LLM Calls:    ${health.data.idle_llm_calls}`);
    console.log(`  Idle Network:      ${health.data.idle_network_calls}\n`);

    console.log('[GLOBAL COUNTERS]');
    console.log(`  Total Requests:    ${metrics.data.requests_total}`);
    console.log(`  Success Requests:  ${metrics.data.requests_success}`);
    console.log(`  Failed Requests:   ${metrics.data.requests_failed}`);
    console.log(`  Attempts Total:    ${metrics.data.attempts_total}`);
    console.log(`  Retries Total:     ${metrics.data.retries_total}`);
    console.log(`  Fallbacks Total:   ${metrics.data.fallbacks_total}`);
    console.log(`  Timeouts Total:    ${metrics.data.timeouts_total}`);
    console.log(`  Rate Limits:       ${metrics.data.rate_limits_total}`);
    console.log(`  Server 5xx:        ${metrics.data.server_5xx_total}`);
    console.log(`  Auth Errors:       ${metrics.data.auth_errors_total}`);
    console.log(`  Task Failures:     ${metrics.data.task_failures_total}`);
    console.log(`  Provider Failures: ${metrics.data.provider_failures_total}`);
    console.log(`  Replay Hits:       ${metrics.data.idempotency_replays_total}`);
    console.log(`  Circuit Openings:  ${metrics.data.circuit_open_total}\n`);

    console.log('[PROVIDER METRICS]');
    if (metrics.data.gemini_metrics) {
      console.log('  Gemini:');
      console.log(`    Attempts:        ${metrics.data.gemini_metrics.attempts}`);
      console.log(`    Success:         ${metrics.data.gemini_metrics.success}`);
      console.log(`    Failures:        ${metrics.data.gemini_metrics.failures}`);
      console.log(`    Retries:         ${metrics.data.gemini_metrics.retries}`);
      console.log(`    Avg Latency:     ${metrics.data.gemini_metrics.latency_avg_ms}ms`);
      console.log(`    Last Latency:    ${metrics.data.gemini_metrics.latency_last_ms}ms`);
    }
    if (metrics.data.groq_metrics) {
      console.log('  Groq:');
      console.log(`    Attempts:        ${metrics.data.groq_metrics.attempts}`);
      console.log(`    Success:         ${metrics.data.groq_metrics.success}`);
      console.log(`    Failures:        ${metrics.data.groq_metrics.failures}`);
      console.log(`    Retries:         ${metrics.data.groq_metrics.retries}`);
      console.log(`    Avg Latency:     ${metrics.data.groq_metrics.latency_avg_ms}ms`);
      console.log(`    Last Latency:    ${metrics.data.groq_metrics.latency_last_ms}ms`);
    }

    console.log('\n================================================================');
  } catch (err) {
    console.error(`[ERROR] Router inativo ou inacessivel em http://127.0.0.1:4000 (${err.message})`);
    process.exit(1);
  }
}

if (require.main === module) {
  showMetrics();
}

module.exports = { showMetrics, fetchJson };
