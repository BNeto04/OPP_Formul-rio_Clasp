/**
 * Syntheon Agentic Layer - Dispatcher (Canteiro A02) - Issue -> Worker rastreado
 * Card: #82 T-A02-DISPATCHER-004
 *
 * Le a Issue (numero via gh OU arquivo/--issue-file), valida schema do template #80,
 * confere branch ativa, registra transicoes de estado (#79) e despacha o worker #81
 * com idempotency key = TASK_ID. NUNCA fecha a Issue (fechamento = Planner).
 *
 * CLI:
 *   node agentic/scripts/dispatch_issue.js --issue <n> [--issue-file <path>]
 *     [--branch <b>] [--workspace <dir>] [--mock] [--owner-approved] [--publish]
 * default: dry-run (transicoes impressas, sem comentar na Issue).
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { parseCard, validateCard } = require('../contracts/card_parser');
const worker = require('../workers/syntheon_worker');

function readIssueBody(issueNumber, issueFile) {
  if (issueFile) return fs.readFileSync(path.resolve(issueFile), 'utf8');
  if (issueNumber) {
    const out = execFileSync('gh', ['issue', 'view', String(issueNumber), '--repo', 'BNeto04/OPP_Formul-rio_Clasp', '--json', 'body', '-q', '.body'], { encoding: 'utf8' });
    return out;
  }
  throw new Error('Informe --issue <numero> ou --issue-file <path>');
}

function stateDirFor(stateDir) {
  const dir = path.resolve(stateDir || path.join(os.tmpdir(), 'syntheon_dispatch'));
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function loadMarker(stateDir, taskId) {
  const f = path.join(stateDir, taskId.replace(/[^A-Za-z0-9_-]/g, '_') + '.json');
  try { return { file: f, data: JSON.parse(fs.readFileSync(f, 'utf8')) }; }
  catch (e) { return { file: f, data: null }; }
}

async function dispatch(input) {
  const activeBranch = input.branch || 'sprint/h01-colmeia-api-001';
  const body = readIssueBody(input.issueNumber, input.issueFile);
  const card = parseCard(body);
  const validation = validateCard(card);

  const base = {
    issue_number: input.issueNumber || null,
    task_id: card.task_id,
    branch_ativa: activeBranch,
    branch_card: card.branch,
    schema_valid: validation.valid,
    schema_missing: validation.missing,
    owner_decision_required: card.owner_decision_required === 'SIM',
    transitions: [],
    closed: false,
    result: null
  };

  if (!validation.valid) {
    return Object.assign(base, { status: 'REJECTED', reason: 'SCHEMA_INCOMPLETO', detalhe: 'faltando: ' + validation.missing.join(', ') });
  }
  if (card.branch !== activeBranch) {
    return Object.assign(base, { status: 'REJECTED', reason: 'FORA_DA_BRANCH_ATIVA', detalhe: 'card em ' + card.branch + ', ativa=' + activeBranch });
  }
  if (card.owner_decision_required === 'SIM' && !input.ownerApproved) {
    return Object.assign(base, { status: 'BLOCKED', reason: 'OWNER_DECISION_REQUIRED', detalhe: 'card exige decisao humana explicita (autoridade nivel 1, contrato #79)' });
  }

  const sdir = stateDirFor(input.stateDir);
  const marker = loadMarker(sdir, card.task_id);
  if (marker.data) {
    return Object.assign(base, { status: 'REPLAY_SKIPPED', reason: 'IDEMPOTENCIA', detalhe: 'TASK_ID ja despachado em ' + marker.data.dispatched_at + '; sem duplicacao de execucao' });
  }

  const transition = (st) => { base.transitions.push({ state: st, at: new Date().toISOString() }); };
  transition('DISPATCHED');
  transition('EXECUTING');

  const ws = input.workspace ? path.resolve(input.workspace) : fs.mkdtempSync(path.join(os.tmpdir(), 'syn-dispatch-ws-'));
  const workerInput = {
    task_id: card.task_id,
    workspace: ws,
    allowed_files: card.alvo,
    forbidden_files: card.proibidos.concat(['.git/']),
    instruction: card.objetivo + '\nPASSO_A_PASSO:\n' + Array.from({ length: card.passos }, (_, i) => (i + 1) + '.').join('\n'),
    context: card.contexto,
    mock_response: input.mockWorker || null
  };
  const wres = await worker.execute(workerInput);
  base.worker = {
    status: wres.status,
    provider_used: wres.provider_used,
    model_used: wres.model_used,
    fallback_used: wres.fallback_used,
    fallback_reason: wres.fallback_reason,
    attempts: wres.attempts,
    files_changed: wres.files_changed,
    error: wres.error
  };
  if (wres.status === 'SUCCESS') {
    transition('TESTING');
    transition('RESULT_PENDING_AUDIT');
    base.status = 'RESULT_PENDING_AUDIT';
    base.testes = card.testes;
  } else if (wres.status === 'BLOCKED') {
    base.status = 'BLOCKED';
    base.owner_decision_required = base.owner_decision_required || wres.error && wres.error.includes('OWNER');
    base.reason = wres.error;
  } else {
    base.status = 'FAILED';
    base.reason = wres.error;
  }

  fs.writeFileSync(marker.file, JSON.stringify({ task_id: card.task_id, dispatched_at: base.transitions[0].at, status: base.status }, null, 2), 'utf8');

  if (input.publish && base.issue_number) {
    const summary = '[CANTEIRO] ' + card.task_id + ' -> ' + base.status + ' | transicoes: ' + base.transitions.map((t) => t.state).join('>') +
      ' | worker: ' + (base.worker ? base.worker.status + (base.worker.files_changed ? ' | arquivos: ' + base.worker.files_changed.map((f) => f.file).join(',') : '') : '') +
      (base.worker && base.worker.provider_used ? ' | provider: ' + base.worker.provider_used : '') +
      (base.reason ? ' | motivo: ' + base.reason : '') + ' | ISSUE NAO FECHADA (auditoria do Planner pendente)';
    execFileSync('gh', ['issue', 'comment', String(base.issue_number), '--repo', 'BNeto04/OPP_Formul-rio_Clasp', '--body', summary], { encoding: 'utf8' });
    base.published_comment = true;
  } else if (input.publish) {
    base.published_comment = false;
    base.publish_skipped_reason = 'sem issue_number (issue-file): comentario nao publicado';
  }

  return base;
}

function parseArgs(argv) {
  const a = {};
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--issue') a.issueNumber = argv[++i];
    else if (k === '--issue-file') a.issueFile = argv[++i];
    else if (k === '--branch') a.branch = argv[++i];
    else if (k === '--workspace') a.workspace = argv[++i];
    else if (k === '--mock') a.mockWorker = argv[++i] || '{"ops":[{"op":"write","file":"evidencia.txt","content":"mock"}]}';
    else if (k === '--owner-approved') a.ownerApproved = true;
    else if (k === '--publish') a.publish = true;
    else if (k === '--state-dir') a.stateDir = argv[++i];
  }
  return a;
}

if (require.main === module) {
  dispatch(parseArgs(process.argv)).then((r) => {
    console.log(JSON.stringify(r, null, 2));
    process.exit(r.status === 'RESULT_PENDING_AUDIT' ? 0 : 1);
  }).catch((e) => { console.error('[DISPATCH] ' + e.message); process.exit(2); });
}

module.exports = { dispatch, readIssueBody };
