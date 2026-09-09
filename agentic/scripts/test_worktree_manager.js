/**
 * Syntheon Agentic Layer - Testes do Worktree Manager (Card #83)
 * Repos git reais em temp dir (fora do workspace). Main repo com dirty file
 * preexistente para provar isolamento.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const wm = require('./worktree_manager');

let passed = 0;
let failed = 0;
function assert(condition, message) {
  if (condition) { console.log('  [PASS] ' + message); passed++; }
  else { console.error('  [FAIL] ' + message); failed++; }
}

function git(repo, args) { return execFileSync('git', ['-c', 'user.email=w@t.local', '-c', 'user.name=W', ...args], { cwd: repo, encoding: 'utf8' }).trim(); }

async function main() {
  console.log('================================================================');
  console.log('  TEST SUITE: WORKTREE MANAGER (Card #83)');
  console.log('================================================================');

  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'syn-wt-main-'));
  const repo = path.join(base, 'repo');
  const stateDir = path.join(base, 'state');
  fs.mkdirSync(repo);
  try {
    git(repo, ['init', '-q']);
    fs.writeFileSync(path.join(repo, 'f1.txt'), 'v1');
    git(repo, ['add', '.']);
    git(repo, ['commit', '-qm', 'base']);
    const headBase = git(repo, ['rev-parse', 'HEAD']);

    // Main working tree DIRTY preexistente (simula os 56 itens)
    fs.writeFileSync(path.join(repo, 'f1.txt'), 'v1-DIRTY-LOCAL');
    assert(fs.readFileSync(path.join(repo, 'f1.txt'), 'utf8') === 'v1-DIRTY-LOCAL', 'main dirty preexistente confirmado');

    // 1. Create: worktree isolado, HEAD = base, dirty NAO vaza
    const c = await wm.create({ repo, taskId: 'T83-001', stateDir });
    assert(c.status === 'CREATED' && c.base_sha === headBase, 'create: CREATED com base_sha = HEAD do main');
    assert(fs.readFileSync(path.join(c.worktree_dir, 'f1.txt'), 'utf8') === 'v1', 'create: dirty local NAO vaza para o worktree (conteudo limpo = commit)');
    assert(fs.readFileSync(path.join(repo, 'f1.txt'), 'utf8') === 'v1-DIRTY-LOCAL', 'create: dirty do main preservado');

    // 2. Alteracao apenas no worktree + manifest
    fs.writeFileSync(path.join(c.worktree_dir, 'f1.txt'), 'v1-WORKTREE-CHANGE');
    const m = await wm.manifest({ repo, taskId: 'T83-001', stateDir });
    assert(m.status === 'OK' && m.manifest.files_changed.includes('f1.txt'), 'manifest: arquivo tocado registrado');
    assert(m.manifest.base_sha === headBase, 'manifest: base SHA guardado');
    assert(fs.readFileSync(path.join(repo, 'f1.txt'), 'utf8') === 'v1-DIRTY-LOCAL', 'manifest: main continua intacto (alteracao so no worktree)');

    // 3. Reexecucao idempotente
    const c2 = await wm.create({ repo, taskId: 'T83-001', stateDir });
    assert(c2.status === 'REUSED' && c2.worktree_dir === c.worktree_dir, 'reexecucao: REUSED mesmo worktree');

    // 4. Divergencia de base sem reconcile -> BLOCKED
    fs.writeFileSync(path.join(repo, 'f2.txt'), 'novo');
    git(repo, ['add', '.']);
    git(repo, ['commit', '-qm', 'avanco']);
    const b = await wm.create({ repo, taskId: 'T83-BLOCK', base: headBase, stateDir });
    assert(b.status === 'BLOCKED' && b.reason === 'BASE_DIVERGENCE', 'base divergente sem reconcile: BLOCKED BASE_DIVERGENCE');
    const b2 = await wm.create({ repo, taskId: 'T83-BLOCK', base: headBase, reconcile: true, stateDir });
    assert(b2.status === 'CREATED' && b2.base_sha === git(repo, ['rev-parse', 'HEAD']), 'base divergente com reconcile: CREATED ancorado no head atual');

    // 5. Cleanup seguro
    const cl = await wm.cleanup({ repo, taskId: 'T83-001', stateDir });
    assert(cl.status === 'CLEANED', 'cleanup: CLEANED');
    const st = await wm.status({ repo, stateDir });
    assert(!st.worktrees.some((w) => w.path.includes('T83-001')), 'cleanup: worktree removido da lista');
    await wm.cleanup({ repo, taskId: 'T83-BLOCK', stateDir });

    // 6. Main repo continua operacional apos tudo (sem contaminacao)
    assert(fs.readFileSync(path.join(repo, 'f1.txt'), 'utf8') === 'v1-DIRTY-LOCAL', 'final: dirty do main preservado do inicio ao fim');
  } finally {
    fs.rmSync(base, { recursive: true, force: true });
  }

  console.log('\n================================================================');
  console.log('  RESULTADO: ' + passed + ' PASS / ' + failed + ' FAIL');
  console.log('================================================================');
  process.exit(failed === 0 ? 0 : 1);
}

main();
