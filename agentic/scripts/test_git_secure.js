/**
 * Syntheon Agentic Layer - Testes do Git Seguro (Card #85)
 * Bare remote + clone + worktree em temp dir (git real). Prova stage seletivo,
 * bloqueios e HEAD remoto alinhado, preservando dirty do main.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const gs = require('./git_secure');
const wm = require('./worktree_manager');

let passed = 0;
let failed = 0;
function assert(condition, message) {
  if (condition) { console.log('  [PASS] ' + message); passed++; }
  else { console.error('  [FAIL] ' + message); failed++; }
}
function git(repo, args) { return execFileSync('git', ['-c', 'user.email=gs@t.local', '-c', 'user.name=GS', ...args], { cwd: repo, encoding: 'utf8' }).trim(); }

async function main() {
  console.log('================================================================');
  console.log('  TEST SUITE: GIT SEGURO (Card #85)');
  console.log('================================================================');
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'syn-gs-'));
  const bare = path.join(base, 'remote.git');
  const main = path.join(base, 'main');
  const state = path.join(base, 'state');
  fs.mkdirSync(main);
  try {
    // Remote bare + clone main com branch sprint/h01
    git(main, ['init', '-q', '-b', 'sprint/h01-colmeia-api-001']);
    fs.writeFileSync(path.join(main, 'f1.txt'), 'v1');
    git(main, ['add', '.']); git(main, ['commit', '-qm', 'base']);
    git(main, ['remote', 'add', 'origin', bare]);
    git(main, ['clone', '--bare', main, bare]); // bare do estado atual? clone bare do main
    // limpa e recria bare corretamente:
    fs.rmSync(bare, { recursive: true, force: true });
    git(main, ['clone', '--bare', '--', main, bare]);
    git(main, ['push', '-q', 'origin', 'sprint/h01-colmeia-api-001']);
    // dirty preexistente no main
    fs.writeFileSync(path.join(main, 'f1.txt'), 'v1-DIRTY');

    // Worktree da task a partir do HEAD remoto
    const c = await wm.create({ repo: main, taskId: 'T85-001', stateDir: state });
    const wt = c.worktree_dir;
    fs.writeFileSync(path.join(wt, 'mod.js'), 'module.exports = 1;\n');

    // 1. Gate nao passado -> BLOCKED
    const r0 = await gs.publish({ worktree: wt, task_id: 'T85-001', issue_ref: '85', branch: 'sprint/h01-colmeia-api-001', allowed_files: ['mod.js'], forbidden_files: ['.env*'], gate_pass: false });
    assert(r0.status === 'BLOCKED' && r0.reason === 'GATE_NOT_PASSED', 'gate nao passado: BLOCKED GATE_NOT_PASSED (sem commit)');

    // 2. Arquivo fora do escopo no worktree -> BLOCKED
    fs.writeFileSync(path.join(wt, 'fora.txt'), 'x');
    const r1 = await gs.publish({ worktree: wt, task_id: 'T85-001', issue_ref: '85', branch: 'sprint/h01-colmeia-api-001', allowed_files: ['mod.js'], forbidden_files: ['.env*'], gate_pass: true });
    assert(r1.status === 'BLOCKED' && r1.reason === 'SCOPE_VIOLATION', 'arquivo fora do allowlist: BLOCKED SCOPE_VIOLATION');
    fs.rmSync(path.join(wt, 'fora.txt'));

    // 3. Secret no diff -> BLOCKED
    fs.writeFileSync(path.join(wt, 'mod.js'), 'module.exports = "sk-ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";\n');
    const r2 = await gs.publish({ worktree: wt, task_id: 'T85-001', issue_ref: '85', branch: 'sprint/h01-colmeia-api-001', allowed_files: ['mod.js'], forbidden_files: ['.env*'], gate_pass: true });
    assert(r2.status === 'BLOCKED' && r2.reason === 'SECRET_IN_DIFF', 'secret no diff: BLOCKED SECRET_IN_DIFF');

    // 4. Commit verde + push -> PUBLISHED, HEAD remoto alinhado
    fs.writeFileSync(path.join(wt, 'mod.js'), 'module.exports = 2;\n');
    const r3 = await gs.publish({ worktree: wt, task_id: 'T85-001', issue_ref: '85', branch: 'sprint/h01-colmeia-api-001', allowed_files: ['mod.js'], forbidden_files: ['.env*'], gate_pass: true, main_repo: main });
    assert(r3.status === 'PUBLISHED' && r3.local_vs_remote === 'ALINHADO', 'commit verde: PUBLISHED com LOCAL==REMOTE');
    const remoteHead = git(main, ['ls-remote', 'origin', 'refs/heads/sprint/h01-colmeia-api-001']).split(/\s+/)[0];
    assert(remoteHead === r3.commit_sha, 'push: HEAD remoto = commit publicado');
    assert(fs.readFileSync(path.join(main, 'f1.txt'), 'utf8') === 'v1-DIRTY', 'main dirty preservado apos push');

    // 5. Replay (mesmo estado ja publicado) -> nao duplica commit
    fs.writeFileSync(path.join(main, 'f1.txt'), 'v1-DIRTY');
    // novo publish sem mudanca nova no wt -> NADA_A_COMMITAR (sem commit duplicado)
    const r4 = await gs.publish({ worktree: wt, task_id: 'T85-001', issue_ref: '85', branch: 'sprint/h01-colmeia-api-001', allowed_files: ['mod.js'], forbidden_files: ['.env*'], gate_pass: true, main_repo: main });
    const remoteHead2 = git(main, ['ls-remote', 'origin', 'refs/heads/sprint/h01-colmeia-api-001']).split(/\s+/)[0];
    assert(remoteHead2 === r3.commit_sha, 'replay: HEAD remoto inalterado (sem commit duplicado)');

    // 6. Issue jamais fechada pelo git_secure
    assert(r3.issue_closed === false, 'git_secure nunca fecha Issue');
    await wm.cleanup({ repo: main, taskId: 'T85-001', stateDir: state });
  } finally {
    fs.rmSync(base, { recursive: true, force: true });
  }

  console.log('\n================================================================');
  console.log('  RESULTADO: ' + passed + ' PASS / ' + failed + ' FAIL');
  console.log('================================================================');
  process.exit(failed === 0 ? 0 : 1);
}

main();
