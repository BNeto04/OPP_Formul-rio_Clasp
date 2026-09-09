/**
 * Syntheon Agentic Layer - Git Seguro (Canteiro A02)
 * Card: #85 T-A02-GIT-007
 *
 * Promove para Git SOMENTE patch verde e aprovado: exige PASS do test_gate #84,
 * opera no worktree da task (#83), adiciona APENAS arquivos do allowlist (nunca
 * `git add .`), bloqueia scope/secret, commit referencia TASK_ID/Issue, push para a
 * branch correta, confirma LOCAL_HEAD == REMOTE_HEAD e NAO fecha Issue.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const GIT_SCHEMA = 'syntheon.git_secure.v1';

function git(repo, args) {
  return execFileSync('git', args, { cwd: repo, encoding: 'utf8', timeout: 30000 }).trim();
}
function gitSafe(repo, args) {
  try { return { ok: true, out: git(repo, args) }; }
  catch (e) { return { ok: false, out: String((e.stderr || '').trim() || e.message).split('\n')[0] }; }
}

function changedInWorktree(wt) {
  const names = gitSafe(wt, ['diff', '--name-only', 'HEAD']).out.split('\n').filter(Boolean);
  const st = gitSafe(wt, ['status', '--porcelain']).out.split('\n').filter(Boolean);
  const untracked = st.filter((l) => l.startsWith('??')).map((l) => l.slice(3).trim());
  return [...new Set(names.concat(untracked))].map((f) => path.normalize(f).replace(/\\/g, '/'));
}

const SECRET_RE = /(sk-[A-Za-z0-9]{16,}|AIza[0-9A-Za-z_-]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----)/;

function isAllowed(file, allowed, forbidden) {
  const n = path.normalize(file).replace(/\\/g, '/');
  const okAllow = allowed.some((a) => n === a || n.startsWith(a.replace(/\/+$/, '') + '/'));
  const okForbid = !forbidden.some((f) => n === f || n.startsWith(f.replace(/\/+$/, '') + '/'));
  return okAllow && okForbid;
}

/**
 * @param {object} input { worktree, main_repo, task_id, issue_ref, branch,
 *   allowed_files[], forbidden_files[], gate_pass: bool, force_remote_ref?: 'origin' }
 */
async function publish(input) {
  const wt = path.resolve(input.worktree || '.');
  const branch = input.branch || 'sprint/h01-colmeia-api-001';
  const taskId = input.task_id || 'TASK_UNKNOWN';
  const issueRef = input.issue_ref || 'sem-issue';
  const allowed = (input.allowed_files || []).map((f) => path.normalize(f).replace(/\\/g, '/'));
  const forbidden = (input.forbidden_files || []).map((f) => path.normalize(f).replace(/\\/g, '/'));
  const remote = input.remote || 'origin';

  const result = { schema: GIT_SCHEMA, task_id: taskId, status: null, commit_sha: null, files_committed: [], reason: null };

  if (input.gate_pass !== true) {
    return Object.assign(result, { status: 'BLOCKED', reason: 'GATE_NOT_PASSED', detalhe: 'test_gate #84 precisa estar PASS antes de commit/push' });
  }

  const headBefore = gitSafe(wt, ['rev-parse', 'HEAD']).out;
  const changed = changedInWorktree(wt);
  const outOfScope = changed.filter((f) => !isAllowed(f, allowed, forbidden));
  const secretFiles = changed.filter((f) => {
    const abs = path.join(wt, f);
    return fs.existsSync(abs) && SECRET_RE.test(fs.readFileSync(abs, 'utf8'));
  });
  if (outOfScope.length) {
    return Object.assign(result, { status: 'BLOCKED', reason: 'SCOPE_VIOLATION', detalhe: 'arquivos fora do allowlist no worktree: ' + outOfScope.join(', ') });
  }
  if (secretFiles.length) {
    return Object.assign(result, { status: 'BLOCKED', reason: 'SECRET_IN_DIFF', detalhe: secretFiles.join(', ') });
  }
  if (!changed.length) {
    return Object.assign(result, { status: 'BLOCKED', reason: 'NADA_A_COMMITAR' });
  }

  // Stage seletivo: somente os arquivos alterados permitidos (nunca git add .)
  for (const f of changed) {
    const r = gitSafe(wt, ['add', '--', f]);
    if (!r.ok) return Object.assign(result, { status: 'BLOCKED', reason: 'STAGE_FAILED', detalhe: r.out });
  }
  const staged = gitSafe(wt, ['diff', '--cached', '--name-only']).out.split('\n').filter(Boolean);
  const stagedOut = staged.filter((f) => !isAllowed(f, allowed, forbidden));
  if (stagedOut.length) {
    return Object.assign(result, { status: 'BLOCKED', reason: 'STAGED_OUT_OF_SCOPE', detalhe: stagedOut.join(', ') });
  }

  const msg = input.message || 'feat(agentic): ' + taskId + ' (#' + issueRef + ') [canteiro]';
  const c = gitSafe(wt, ['commit', '-m', msg]);
  if (!c.ok) return Object.assign(result, { status: 'BLOCKED', reason: 'COMMIT_FAILED', detalhe: c.out });
  const commitSha = gitSafe(wt, ['rev-parse', 'HEAD']).out;
  result.commit_sha = commitSha;
  result.files_committed = staged;
  result.issue_closed = false;

  // Push: HEAD do worktree -> refs/heads/branch no remoto (fast-forward exigido pelo git)
  const p = gitSafe(wt, ['push', remote, 'HEAD:refs/heads/' + branch]);
  if (!p.ok) {
    return Object.assign(result, { status: 'BLOCKED', reason: 'PUSH_FAILED', detalhe: p.out, issue_closed: false });
  }

  // Confirmacao LOCAL_HEAD == REMOTE_HEAD (pelo remoto)
  const lsRemote = gitSafe(wt, ['ls-remote', remote, 'refs/heads/' + branch]).out.split(/\s+/)[0];
  result.remote_head_sha = lsRemote || null;
  result.local_vs_remote = lsRemote === commitSha ? 'ALINHADO' : 'DIVERGENTE';

  // Sincroniza o repo operacional (fetch) sem tocar dirty files
  if (input.main_repo) gitSafe(input.main_repo, ['fetch', remote, branch + ':' + 'refs/remotes/' + remote + '/' + branch]);

  result.status = result.local_vs_remote === 'ALINHADO' ? 'PUBLISHED' : 'DIVERGENT';
  return result;
}

module.exports = { publish, changedInWorktree, isAllowed, GIT_SCHEMA };
