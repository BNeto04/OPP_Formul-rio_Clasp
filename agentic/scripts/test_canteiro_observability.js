/**
 * Syntheon Agentic Layer - Testes Observabilidade/Recuperacao (Card #87)
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const obs = require('./canteiro_observability');

let passed = 0;
let failed = 0;
function assert(condition, message) {
  if (condition) { console.log('  [PASS] ' + message); passed++; }
  else { console.error('  [FAIL] ' + message); failed++; }
}

async function main() {
  console.log('================================================================');
  console.log('  TEST SUITE: OBSERVABILIDADE/RECUPERACAO (Card #87)');
  console.log('================================================================');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'syn-obs-'));
  const sd = path.join(tmp, 'state');

  // 1. execution_id deterministico
  {
    const a = obs.execId('T-1', 'C-1');
    const b = obs.execId('T-1', 'C-1');
    const c = obs.execId('T-1', 'C-2');
    assert(a === b && a.length === 16, 'execution_id deterministico por TASK_ID+CALL_ID');
    assert(a !== c, 'CALL_ID diferente -> execution_id diferente');
  }

  // 2. Replay nao duplica: begin 2x mesma chave
  {
    const r1 = obs.begin({ task_id: 'T-1', call_id: 'C-1', stateDir: sd });
    const r2 = obs.begin({ task_id: 'T-1', call_id: 'C-1', stateDir: sd });
    assert(r1.replay === false && r2.replay === true, 'begin 2x mesma chave: replay detectado, sem duplicar efeito');
  }

  // 3. Ciclo completo + gates + attempts tipados + finish
  {
    obs.begin({ task_id: 'T-2', call_id: 'C-2', provider_alias: 'syntheon-worker', model_alias: 'deepseek-v4-flash', stateDir: sd });
    const id = obs.execId('T-2', 'C-2');
    obs.updateGate({ execution_id: id, gate: 'EXECUTING', stateDir: sd });
    obs.recordAttempt({ execution_id: id, retry_type: 'PROVIDER', detail: '429 simulado', duration_ms: 300, fallback_used: true, stateDir: sd });
    obs.recordAttempt({ execution_id: id, retry_type: 'CORRECTION', detail: 'ciclo 1', stateDir: sd });
    obs.updateGate({ execution_id: id, gate: 'TESTING', stateDir: sd });
    const f = obs.finish({ execution_id: id, status: 'SUCCESS', stateDir: sd });
    assert(f.ok && f.state === 'DONE', 'finish SUCCESS -> DONE');
    const rec = JSON.parse(fs.readFileSync(path.join(sd, id + '.json'), 'utf8'));
    assert(rec.last_gate === 'DONE' && rec.attempts.length === 2 && rec.fallback_count === 1, 'estado persistido: ultimo gate, attempts e fallback');
  }

  // 4. Resume de execucao presa (stale) sem duplicar conclusao
  {
    obs.begin({ task_id: 'T-3', call_id: 'C-3', stateDir: sd });
    const id = obs.execId('T-3', 'C-3');
    obs.updateGate({ execution_id: id, gate: 'EXECUTING', stateDir: sd });
    const stale = obs.resume({ execution_id: id, stale_after_ms: -1, stateDir: sd }); // forca stale
    assert(stale.ok && stale.stale === true && stale.resume_from === 'EXECUTING', 'resume: execucao presa detectada, resume do ultimo gate seguro');
    const done = obs.finish({ execution_id: id, status: 'SUCCESS', stateDir: sd });
    const r = obs.resume({ execution_id: id, stale_after_ms: -1, stateDir: sd });
    assert(done.ok && r.resume_from === null, 'resume apos DONE: sem reexecucao (replay limpo)');
  }

  // 5. Reconciliacao de RESULT nao entregue pela Ponte 2 (sem inventar entrega)
  {
    obs.begin({ task_id: 'T-4', call_id: 'C-4', stateDir: sd });
    const id = obs.execId('T-4', 'C-4');
    obs.finish({ execution_id: id, status: 'SUCCESS', stateDir: sd });
    const p = obs.reconcileDelivery({ execution_id: id, delivered: false, stateDir: sd });
    assert(p.ok && p.delivery === 'PENDENTE', 'RESULT sem entrega Ponte 2: PENDENTE (nao inventado)');
    const inv = obs.reconcileDelivery({ execution_id: id, delivered: true, delivery_evidence: null, stateDir: sd });
    assert(inv.ok === false && inv.error === 'DELIVERY_SEM_EVIDENCIA', 'entrega exige evidencia real (sem prova nao marca ENTREGUE)');
    const ok = obs.reconcileDelivery({ execution_id: id, delivered: true, delivery_evidence: 'msg_id_588', stateDir: sd });
    assert(ok.delivery === 'ENTREGUE', 'entrega com evidencia: ENTREGUE');
  }

  // 6. Metricas tipadas + zero LLM idle
  {
    const m = obs.metrics(sd);
    assert(m.executions >= 4 && m.success >= 3, 'metricas: execucoes e sucessos contados');
    assert(m.retrabalho >= 1 && m.fallbacks >= 1, 'metricas: retrabalho (CORRECTION) e fallback contados');
    assert(m.retry_by_type.PROVIDER >= 1 && m.retry_by_type.TRANSPORT === 0, 'metricas: retry por tipo distinto');
    assert(m.llm_idle_calls === 0, 'ZERO chamada LLM em idle (nada invoca modelo sem task)');
  }

  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('\n================================================================');
  console.log('  RESULTADO: ' + passed + ' PASS / ' + failed + ' FAIL');
  console.log('================================================================');
  process.exit(failed === 0 ? 0 : 1);
}

main();
