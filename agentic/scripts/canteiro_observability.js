/**
 * Syntheon Agentic Layer - Observabilidade e Recuperacao do Canteiro (A02)
 * Card: #87 T-A02-OBSERVABILITY-009
 *
 * Estado minimo de execucao PERSISTIDO FORA do prompt/modelo: execution_id
 * deterministico (TASK_ID+CALL_ID), ultimo gate atingido, attempts (retry de
 * transporte x provider x correcao), duracao, metricas (sucesso/retrabalho/fallback),
 * resume do ultimo estado seguro, replay sem efeito duplicado, reconciliacao de
 * RESULT nao entregue pela Ponte 2 (sem inventar entrega) e ZERO chamada LLM em idle.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const SCHEMA = 'syntheon.canteiro_obs.v1';
const RETRY_TYPES = ['TRANSPORT', 'PROVIDER', 'CORRECTION'];
const GATES = ['DISPATCHED', 'EXECUTING', 'TESTING', 'RESULT_PENDING_AUDIT', 'DONE'];

function stateDirFor(dir) {
  const d = path.resolve(dir || path.join(os.tmpdir(), 'syntheon_obs'));
  fs.mkdirSync(d, { recursive: true });
  return d;
}
function fileOf(dir, execId) { return path.join(dir, execId + '.json'); }

function execId(taskId, callId) {
  return crypto.createHash('sha1').update(String(taskId) + '|' + String(callId)).digest('hex').substring(0, 16);
}

function load(dir, execId) {
  try { return JSON.parse(fs.readFileSync(fileOf(dir, execId), 'utf8')); }
  catch (e) { return null; }
}
function save(dir, rec) { fs.writeFileSync(fileOf(dir, rec.execution_id), JSON.stringify(rec, null, 2), 'utf8'); }

/** Inicia (ou detecta replay de) uma execucao. */
function begin({ task_id, call_id, provider_alias, model_alias, stateDir }) {
  const dir = stateDirFor(stateDir);
  const id = execId(task_id, call_id);
  const existing = load(dir, id);
  if (existing) {
    return { execution_id: id, replay: true, state: existing.state, reason: 'execucao ja registrada para TASK_ID+CALL_ID (replay nao duplica efeito)' };
  }
  const rec = {
    schema: SCHEMA, execution_id: id, task_id: task_id, call_id: call_id,
    provider_alias: provider_alias || null, model_alias: model_alias || null,
    state: 'EXECUTING', last_gate: null, started_at: new Date().toISOString(),
    finished_at: null, result_status: null, attempts: [], llm_idle_calls: 0,
    retry_counts: { TRANSPORT: 0, PROVIDER: 0, CORRECTION: 0 }
  };
  save(dir, rec);
  return { execution_id: id, replay: false, state: rec.state };
}

/** Registra o ultimo gate seguro atingido. */
function updateGate({ execution_id, gate, stateDir }) {
  const dir = stateDirFor(stateDir);
  const rec = load(dir, execution_id);
  if (!rec) return { ok: false, error: 'EXECUTION_NOT_FOUND' };
  if (!GATES.includes(gate)) return { ok: false, error: 'GATE_INVALIDO' };
  rec.last_gate = gate;
  save(dir, rec);
  return { ok: true, last_gate: gate };
}

/** Registra attempt com taxonomia de retry e fallback. */
function recordAttempt({ execution_id, retry_type, detail, duration_ms, fallback_used, stateDir }) {
  const dir = stateDirFor(stateDir);
  const rec = load(dir, execution_id);
  if (!rec) return { ok: false, error: 'EXECUTION_NOT_FOUND' };
  if (!RETRY_TYPES.includes(retry_type)) return { ok: false, error: 'RETRY_TYPE_INVALIDO' };
  rec.attempts.push({ retry_type, detail: detail || null, duration_ms: duration_ms || null, fallback_used: Boolean(fallback_used), at: new Date().toISOString() });
  rec.retry_counts[retry_type] = (rec.retry_counts[retry_type] || 0) + 1;
  if (fallback_used) rec.fallback_count = (rec.fallback_count || 0) + 1;
  save(dir, rec);
  return { ok: true };
}

/** Finaliza execucao (SUCCESS/FAILED/BLOCKED). */
function finish({ execution_id, status, stateDir }) {
  const dir = stateDirFor(stateDir);
  const rec = load(dir, execution_id);
  if (!rec) return { ok: false, error: 'EXECUTION_NOT_FOUND' };
  rec.state = status === 'SUCCESS' ? 'DONE' : status;
  rec.result_status = status;
  rec.finished_at = new Date().toISOString();
  rec.last_gate = status === 'SUCCESS' ? 'DONE' : rec.last_gate;
  save(dir, rec);
  return { ok: true, state: rec.state };
}

/** Resume: devolve o ultimo estado seguro; detecta execucao presa (stale) e permite recover. */
function resume({ execution_id, stale_after_ms, stateDir }) {
  const dir = stateDirFor(stateDir);
  const rec = load(dir, execution_id);
  if (!rec) return { ok: false, error: 'EXECUTION_NOT_FOUND' };
  if (rec.state === 'DONE') {
    return { ok: true, resume_from: null, reason: 'execucao ja concluida (replay sem efeito)' };
  }
  const stale = rec.stale || (rec.started_at && Date.now() - new Date(rec.started_at).getTime() > (stale_after_ms || 3600000));
  if (stale) {
    rec.state = 'STALE';
    save(dir, rec);
    return { ok: true, resume_from: rec.last_gate || 'DISPATCHED', reason: 'execucao presa recuperada do ultimo gate seguro', stale: true };
  }
  return { ok: true, resume_from: rec.last_gate || 'DISPATCHED', reason: 'em andamento; resume do ultimo gate seguro' };
}

/** Reconciliacao de RESULT nao entregue pela Ponte 2: so marca entregue com prova real. */
function reconcileDelivery({ execution_id, delivered, delivery_evidence, stateDir }) {
  const dir = stateDirFor(stateDir);
  const rec = load(dir, execution_id);
  if (!rec) return { ok: false, error: 'EXECUTION_NOT_FOUND' };
  if (!delivered) {
    rec.result_delivery = { state: 'PENDENTE_PONTE2', observed_at: new Date().toISOString(), note: 'Ponte 2 fora do ar; entrega NAO inventada' };
    save(dir, rec);
    return { ok: true, delivery: 'PENDENTE' };
  }
  if (!delivery_evidence) return { ok: false, error: 'DELIVERY_SEM_EVIDENCIA' };
  rec.result_delivery = { state: 'ENTREGUE', evidence: delivery_evidence, at: new Date().toISOString() };
  save(dir, rec);
  return { ok: true, delivery: 'ENTREGUE' };
}

/** Metricas agregadas (sucesso, retrabalho, fallback) + garantia zero LLM idle. */
function metrics(stateDir) {
  const dir = stateDirFor(stateDir);
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.json')) : [];
  const agg = { executions: files.length, success: 0, failed: 0, blocked: 0, stale: 0, retrabalho: 0, fallbacks: 0, llm_idle_calls: 0, retry_by_type: { TRANSPORT: 0, PROVIDER: 0, CORRECTION: 0 } };
  for (const f of files) {
    const r = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    if (r.result_status === 'SUCCESS') agg.success++;
    else if (r.result_status === 'FAILED') agg.failed++;
    else if (r.result_status === 'BLOCKED') agg.blocked++;
    if (r.state === 'STALE') agg.stale++;
    agg.retrabalho += (r.retry_counts && r.retry_counts.CORRECTION) || 0;
    agg.fallbacks += r.fallback_count || 0;
    agg.llm_idle_calls += r.llm_idle_calls || 0;
    for (const t of RETRY_TYPES) agg.retry_by_type[t] += (r.retry_counts && r.retry_counts[t]) || 0;
  }
  return agg;
}

module.exports = { SCHEMA, RETRY_TYPES, GATES, execId, begin, updateGate, recordAttempt, finish, resume, reconcileDelivery, metrics };
