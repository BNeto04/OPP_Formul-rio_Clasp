/**
 * Syntheon Agentic Layer - Worktree Manager (Canteiro A02)
 * Card: #83 T-A02-WORKTREE-005
 *
 * Isola a execucao de cada card em um git worktree proprio (por TASK_ID), a partir
 * do head/base esperados, preservando o working tree operacional (dirty files
 * preexistentes nao vazam para o worktree e nao sao tocados). Registra manifest
 * (base SHA, arquivos tocados, diff) e oferece cleanup seguro + reexecucao idempotente.
 *
 * CLI: node agentic/scripts/worktree_manager.js <create|manifest|cleanup|status>
 *      --task <TASK_ID> --repo <caminho-do-repo> [--base <sha|ref>] [--reconcile] [--state-dir <dir>]
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const MANAGER = 'syntheon_worktree_manager.v1';

function git(repo, args) {
  return execFileSync('git', args, { cwd: repo, encoding: 'utf8', timeout: 30000 }).trim();
}

function gitSafe(repo, args) {
  try { return { ok: true, out: git(repo, args) }; }
  catch (e) { return { ok: false, out: String((e.stderr || '').trim() || e.message) }; }
}

function stateDirFor(stateDir) {
  const dir = path.resolve(stateDir || path.join(os.tmpdir(), 'syntheon_worktrees'));
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function taskPath(stateDir, taskId) {
  return path.join(stateDir, taskId.replace(/[^A-Za-z0-9_-]/g, '_'));
}

function manifestFile(stateDir, taskId) {
  return path.join(stateDir, taskId.replace(/[^A-Za-z0-9_-]/g, '_') + '.manifest.json');
}

function readManifest(stateDir, taskId) {
  try { return JSON.parse(fs.readFileSync(manifestFile(stateDir, taskId), 'utf8')); }
  catch (e) { return null; }
}

function listWorktrees(repo) {
  const out = gitSafe(repo, ['worktree', 'list', '--porcelain']);
  if (!out.ok) return [];
  const trees = [];
  let cur = null;
  for (const line of out.out.split('\n')) {
    if (line.startsWith('worktree ')) { if (cur) trees.push(cur); cur = { path: line.slice('worktree '.length).trim() }; }
    else if (line.startsWith('HEAD ')) { if (cur) cur.head = line.slice('HEAD '.length).trim(); }
    else if (line.startsWith('branch ')) { if (cur) cur.branch = line.slice('branch '.length).trim(); }
  }
  if (cur) trees.push(cur);
  return trees;
}

function currentHead(repo) {
  return gitSafe(repo, ['rev-parse', 'HEAD']).out;
}

async function create({ repo, taskId, base, reconcile, stateDir }) {
  const sdir = stateDirFor(stateDir);
  const wtPath = taskPath(sdir, taskId);
  const tp = manifestFile(sdir, taskId);
  const result = { schema: MANAGER, task_id: taskId, action: 'create', status: null, worktree_dir: null, base_sha: null, reason: null };

  const baseRef = base || 'HEAD';
  const mainHead = currentHead(repo);
  if (!mainHead) return Object.assign(result, { status: 'BLOCKED', reason: 'REPO_SEM_HEAD' });

  // Guarda de base: se base_expected fornecido e divergir do HEAD operacional, bloqueia sem reconciliacao.
  if (base && base !== mainHead && !reconcile) {
    return Object.assign(result, { status: 'BLOCKED', reason: 'BASE_DIVERGENCE', detalhe: 'base esperado=' + base + ' head operacional=' + mainHead + ' (use --reconcile para aceitar divergencia e ancorar no head)' });
  }
  const anchor = reconcile && base && base !== mainHead ? mainHead : (base || mainHead);

  const existing = fs.existsSync(wtPath) && gitSafe(wtPath, ['rev-parse', '--is-inside-work-tree']).ok;
  if (existing) {
    // Reexecucao idempotente: reutiliza worktree existente do mesmo TASK_ID.
    const head = gitSafe(wtPath, ['rev-parse', 'HEAD']).out;
    return Object.assign(result, { status: 'REUSED', worktree_dir: wtPath, base_sha: head, reason: 'worktree existente reutilizado (reexecucao idempotente)' });
  }

  fs.mkdirSync(sdir, { recursive: true });
  const add = gitSafe(repo, ['worktree', 'add', '--detach', wtPath, anchor]);
  if (!add.ok) {
    return Object.assign(result, { status: 'BLOCKED', reason: 'WORKTREE_ADD_FAILED', detalhe: add.out.split('\n')[0] });
  }
  const wtHead = gitSafe(wtPath, ['rev-parse', 'HEAD']).out;
  const manifest = { task_id: taskId, created_at: new Date().toISOString(), base_sha: wtHead, worktree_dir: wtPath, files_changed: [], diff: null, main_head_at_create: mainHead };
  fs.writeFileSync(tp, JSON.stringify(manifest, null, 2), 'utf8');
  return Object.assign(result, { status: 'CREATED', worktree_dir: wtPath, base_sha: wtHead });
}

function manifest({ repo, taskId, stateDir }) {
  const sdir = stateDirFor(stateDir);
  const wtPath = taskPath(sdir, taskId);
  const mf = manifestFile(sdir, taskId);
  const result = { schema: MANAGER, task_id: taskId, action: 'manifest', status: null, manifest: null };
  const m = readManifest(sdir, taskId) || {};
  if (!m.worktree_dir || !fs.existsSync(m.worktree_dir)) {
    return Object.assign(result, { status: 'BLOCKED', reason: 'SEM_WORKTREE', detalhe: 'nenhum worktree registrado para o TASK_ID' });
  }
  const names = gitSafe(m.worktree_dir, ['diff', '--name-only', 'HEAD']).out;
  const numstat = gitSafe(m.worktree_dir, ['diff', '--numstat', 'HEAD']).out;
  const untracked = gitSafe(m.worktree_dir, ['status', '--porcelain']).out.split('\n').filter((l) => l.startsWith('??')).map((l) => l.slice(3).trim());
  const files_changed = names.split('\n').filter(Boolean);
  m.files_changed = files_changed;
  m.untracked = untracked;
  m.diff_numstat = numstat;
  m.observed_at = new Date().toISOString();
  fs.writeFileSync(mf, JSON.stringify(m, null, 2), 'utf8');
  return Object.assign(result, { status: 'OK', manifest: m, worktree_dir: m.worktree_dir });
}

function cleanup({ repo, taskId, stateDir }) {
  const sdir = stateDirFor(stateDir);
  const wtPath = taskPath(sdir, taskId);
  const mf = manifestFile(sdir, taskId);
  const result = { schema: MANAGER, task_id: taskId, action: 'cleanup', status: null };
  if (fs.existsSync(wtPath) && gitSafe(wtPath, ['rev-parse', '--is-inside-work-tree']).ok) {
    gitSafe(wtPath, ['add', '-A']); // garante que o worktree esta sem alteracoes para remocao segura
    gitSafe(wtPath, ['reset', '--hard', 'HEAD']);
    const rm = gitSafe(repo, ['worktree', 'remove', '--force', wtPath]);
    if (!rm.ok) return Object.assign(result, { status: 'BLOCKED', reason: 'CLEANUP_FAILED', detalhe: rm.out.split('\n')[0] });
  }
  try { fs.rmSync(wtPath, { recursive: true, force: true }); } catch (e) { /* noop */ }
  try { fs.rmSync(mf, { force: true }); } catch (e) { /* noop */ }
  return Object.assign(result, { status: 'CLEANED' });
}

function status({ repo, stateDir }) {
  const sdir = stateDirFor(stateDir);
  const result = { schema: MANAGER, task_id: null, action: 'status', worktrees: listWorktrees(repo).map((w) => ({ path: w.path, head: (w.head || '').substring(0, 12) })) };
  return Object.assign(result, { status: 'OK' });
}

async function mainAction(action, args) {
  if (action === 'create') return create(args);
  if (action === 'manifest') return manifest(args);
  if (action === 'cleanup') return cleanup(args);
  if (action === 'status') return status(args);
  return { schema: MANAGER, status: 'BLOCKED', reason: 'ACAO_INVALIDA', acoes: ['create', 'manifest', 'cleanup', 'status'] };
}

function parseArgs(argv) {
  const a = { action: argv[2] };
  for (let i = 3; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--task') a.taskId = argv[++i];
    else if (k === '--repo') a.repo = argv[++i];
    else if (k === '--base') a.base = argv[++i];
    else if (k === '--reconcile') a.reconcile = true;
    else if (k === '--state-dir') a.stateDir = argv[++i];
  }
  return a;
}

if (require.main === module) {
  const args = parseArgs(process.argv);
  if (!args.repo) { console.error('[WORKTREE] --repo obrigatorio'); process.exit(2); }
  mainAction(args.action, args).then((r) => {
    console.log(JSON.stringify(r, null, 2));
    process.exit(r.status === 'CREATED' || r.status === 'REUSED' || r.status === 'OK' || r.status === 'CLEANED' ? 0 : 1);
  }).catch((e) => { console.error('[WORKTREE] ' + e.message); process.exit(2); });
}

module.exports = { create, manifest, cleanup, status, listWorktrees, currentHead };
