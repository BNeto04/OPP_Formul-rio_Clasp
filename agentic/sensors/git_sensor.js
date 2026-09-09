/**
 * Syntheon Agentic Layer - Git Sensor (Colmeia H01)
 * Card: #95 H01-004 - Git: "O que mudou no repositorio?"
 *
 * Read-only por padrao: apenas le estado do repositorio via git; nao modifica,
 * nao faz fetch, nao julga qualidade. Evidencia tipada (schema syntheon.sensor.git.v1).
 */

const { execFileSync } = require('child_process');
const path = require('path');

const SCHEMA = 'syntheon.sensor.git.v1';
const VERSION = '1.0.0';

function gitSafe(args, cwd) {
  try {
    const out = execFileSync('git', args, { cwd, encoding: 'utf8', timeout: 15000 })
      .replace(/[\r\n]+$/, '');
    return { ok: true, out, err: null };
  } catch (e) {
    const err = String((e.stderr || '').trim() || e.message || 'GIT_ERROR');
    return { ok: false, out: '', err };
  }
}

function classifyPorcelain(entries) {
  const staged = [];
  const unstaged = [];
  const untracked = [];
  for (const line of entries) {
    if (!line || line.length < 4) continue;
    const xy = line.slice(0, 2);
    const p = line.slice(3);
    if (xy === '??') { untracked.push(p); continue; }
    const x = xy[0];
    const y = xy[1];
    if (x !== ' ' && x !== '?') staged.push(p);
    if (y === 'M' || y === 'D' || y === 'A' || y === 'R' || y === 'C' || y === 'U') unstaged.push(p);
  }
  return { staged, unstaged, untracked };
}

function parseNumstat(text) {
  return text.split('\n').filter(Boolean).map((l) => {
    const [adds, dels, ...rest] = l.split('\t');
    return { path: rest.join('\t'), insertions: adds === '-' ? null : Number(adds), deletions: dels === '-' ? null : Number(dels) };
  });
}

/**
 * Observa um repositorio git em repoRoot (ou sobe ate achar .git).
 * options.base: sha de referencia (pre-task) -> adiciona committed.files_changed,
 * committed.patch (diff base..HEAD) e working_tree (diff HEAD, mudancas nao commitadas).
 * Retorna objeto tipado; erros sao coletados em result.errors (nao lanca).
 */
function observe(repoRoot, options = {}) {
  const start = path.resolve(repoRoot || '.');
  const baseSha = options.base || null;
  const result = {
    schema: SCHEMA,
    sensor: 'git',
    version: VERSION,
    read_only: true,
    observed_at: new Date().toISOString(),
    requested_root: start,
    repo_root: null,
    branch: null,
    head_sha: null,
    head_short: null,
    remote: null,
    remote_head_sha: null,
    ahead: null,
    behind: null,
    status: { total: 0, staged: [], unstaged: [], untracked: [] },
    diff_vs_head: [],
    committed: null,
    working_tree: [],
    recent_commits: [],
    errors: []
  };

  const cwd = (() => {
    let cur = start;
    const st = (d) => {
      try { return require('fs').statSync(path.join(d, '.git')); } catch (e) { return null; }
    };
    if (st(cur)) return cur;
    for (;;) {
      const parent = path.dirname(cur);
      if (parent === cur) return start;
      cur = parent;
      if (st(cur)) return cur;
    }
  })();

  const isRepo = gitSafe(['rev-parse', '--is-inside-work-tree'], cwd);
  if (!isRepo.ok) {
    result.errors.push('NOT_A_GIT_REPO: ' + isRepo.err.split('\n')[0]);
    return result;
  }
  result.repo_root = cwd;

  const branch = gitSafe(['symbolic-ref', '--short', 'HEAD'], cwd);
  if (branch.ok) {
    result.branch = branch.out;
  } else {
    const brFallback = gitSafe(['rev-parse', '--abbrev-ref', 'HEAD'], cwd);
    if (brFallback.ok && brFallback.out !== 'HEAD') result.branch = brFallback.out;
  }

  const head = gitSafe(['rev-parse', '--verify', '--quiet', 'HEAD'], cwd);
  if (head.ok) {
    result.head_sha = head.out;
    result.head_short = head.out.substring(0, 7);
  }

  const remote = gitSafe(['remote'], cwd);
  if (remote.ok && remote.out) {
    result.remote = remote.out.split('\n')[0] || null;
    if (result.remote && result.branch) {
      const rHead = gitSafe(['rev-parse', '--verify', '--quiet', `${result.remote}/${result.branch}`], cwd);
      if (rHead.ok && rHead.out) result.remote_head_sha = rHead.out;
      if (result.remote_head_sha) {
        const lr = gitSafe(['rev-list', '--left-right', '--count', `${result.remote}/${result.branch}...HEAD`], cwd);
        if (lr.ok) {
          const parts = lr.out.split(/\s+/);
          if (parts.length >= 2) {
            result.behind = Number(parts[0]);
            result.ahead = Number(parts[1]);
          }
        }
      }
    }
  }

  const st = gitSafe(['status', '--porcelain'], cwd);
  if (st.ok) {
    const parsed = classifyPorcelain(st.out.split('\n').filter(Boolean));
    parsed.total = parsed.staged.length + parsed.unstaged.length + parsed.untracked.length;
    result.status = parsed;
  } else {
    result.errors.push('STATUS: ' + st.err.split('\n')[0]);
  }

  if (result.head_sha) {
    const diff = gitSafe(['diff', '--numstat', 'HEAD'], cwd);
    if (diff.ok && diff.out) result.diff_vs_head = parseNumstat(diff.out);

    const wt = gitSafe(['diff', '--name-only', 'HEAD'], cwd);
    if (wt.ok && wt.out) result.working_tree = wt.out.split('\n').filter(Boolean);

    const log = gitSafe(['log', '-10', '--format=%h%x09%s'], cwd);
    if (log.ok && log.out) {
      result.recent_commits = log.out.split('\n').filter(Boolean).map((l) => {
        const [sha_short, ...rest] = l.split('\t');
        return { sha_short, subject: rest.join('\t') };
      });
    }
  }

  // Escopo commitado entre base (pre-task) e HEAD: prova material do que a task mudou.
  if (baseSha) {
    const baseValid = gitSafe(['rev-parse', '--verify', '--quiet', baseSha], cwd);
    if (!baseValid.ok) {
      result.errors.push('BASE_INVALIDA: ' + baseSha + ' nao e um commit valido no repositorio');
    } else if (result.head_sha) {
      const names = gitSafe(['diff', '--name-only', baseSha + '...HEAD'], cwd);
      const patch = gitSafe(['diff', baseSha + '...HEAD'], cwd);
      result.committed = {
        base_sha: baseSha,
        head_sha: result.head_sha,
        files_changed: names.ok && names.out ? names.out.split('\n').filter(Boolean) : [],
        patch: patch.ok ? patch.out.substring(0, 300000) : '',
        patch_truncated: patch.ok ? patch.out.length > 300000 : false
      };
    }
  }

  return result;
}

module.exports = { SCHEMA, VERSION, observe };
