/**
 * Syntheon Agentic Layer - Testes deterministicos dos sensores Local/Git
 * Card: #95 H01-004
 *
 * Fixtures em diretorio temporario do SO (fora do workspace). Nao toca
 * em nenhum arquivo do repositorio. Saida: [PASS]/[FAIL] + exit code.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const localSensor = require('./local_sensor');
const gitSensor = require('./git_sensor');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log('  [PASS] ' + message);
    passed++;
  } else {
    console.error('  [FAIL] ' + message);
    failed++;
  }
}

function mkTmp(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function rmTmp(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { /* noop */ }
}

function git(cwd, args) {
  const base = ['-c', 'user.email=sensor@test.local', '-c', 'user.name=Sensor Test'];
  return execFileSync('git', base.concat(args), { cwd, encoding: 'utf8' }).trim();
}

function testLocalSensor() {
  console.log('\n== LOCAL SENSOR ==');
  const dir = mkTmp('syntheon-local-sensor-');
  try {
    fs.writeFileSync(path.join(dir, 'a.txt'), 'abc');
    fs.mkdirSync(path.join(dir, 'sub'));
    fs.writeFileSync(path.join(dir, 'sub', 'b.bin'), Buffer.from([0, 1, 2]));

    const obs = localSensor.observe(
      [path.join(dir, 'a.txt'), path.join(dir, 'sub'), path.join(dir, 'missing.txt')],
      { hash: true }
    );
    assert(obs.length === 3, 'observa 3 alvos');
    assert(obs[0].exists === true && obs[0].kind === 'file', 'a.txt existe e e file');
    assert(obs[0].sha256 === 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad', 'sha256 de "abc" confere');
    assert(obs[0].size_bytes === 3, 'a.txt tem 3 bytes');
    assert(obs[1].exists === true && obs[1].kind === 'dir', 'sub existe e e dir');
    assert(obs[2].exists === false, 'missing.txt reportado como inexistente');

    const recent = localSensor.listRecent(dir, { sinceIso: new Date(Date.now() - 3600000).toISOString(), max: 50 });
    assert(recent.length === 2, 'listRecent encontra os 2 arquivos criados agora');
    const none = localSensor.listRecent(dir, { sinceIso: new Date(Date.now() + 3600000).toISOString(), max: 50 });
    assert(none.length === 0, 'listRecent com since futuro retorna vazio');
  } finally {
    rmTmp(dir);
  }
}

function testGitSensor() {
  console.log('\n== GIT SENSOR ==');
  const dir = mkTmp('syntheon-git-sensor-');
  try {
    git(dir, ['init', '-q']);
    fs.writeFileSync(path.join(dir, 'f1.txt'), 'v1');

    // estado 1: 1 arquivo novo, sem commit
    let s = gitSensor.observe(dir);
    assert(s.branch !== null, 'branch identificado (' + s.branch + ')');
    assert(s.status.untracked.length === 1 && s.status.untracked[0] === 'f1.txt', 'untracked contem f1.txt');

    // estado 2: commit inicial -> limpo
    git(dir, ['add', '.']);
    git(dir, ['commit', '-q', '-m', 'base']);
    s = gitSensor.observe(dir);
    assert(s.head_sha && s.head_sha.length === 40, 'head_sha tem 40 chars');
    assert(s.head_short === s.head_sha.substring(0, 7), 'head_short bate com prefixo do head');
    assert(s.status.total === 0, 'status limpo apos commit');
    assert(s.recent_commits.length === 1 && s.recent_commits[0].subject === 'base', 'recent_commits normaliza 1 commit');

    // estado 3: modificar f1 + criar f2
    fs.writeFileSync(path.join(dir, 'f1.txt'), 'v2');
    fs.writeFileSync(path.join(dir, 'f2.txt'), 'novo');
    s = gitSensor.observe(dir);
    assert(s.status.unstaged.length === 1 && s.status.unstaged[0] === 'f1.txt', 'unstaged contem f1.txt modificado');
    assert(s.status.untracked.length === 1 && s.status.untracked[0] === 'f2.txt', 'untracked contem f2.txt');
    assert(s.diff_vs_head.length >= 1, 'diff_vs_head nao vazio apos modificacao');
    assert(s.read_only === true, 'sensor marcado read_only');

    // estado 4: commit de f2 -> f1 ainda modificado
    git(dir, ['add', 'f2.txt']);
    git(dir, ['commit', '-q', '-m', 'add f2']);
    s = gitSensor.observe(dir);
    assert(s.recent_commits.length === 2, 'recent_commits = 2 apos segundo commit');
    assert(s.status.unstaged.length === 1, 'f1 segue modificado apos commit de f2');
  } finally {
    rmTmp(dir);
  }
}

function testNonRepo() {
  console.log('\n== NAO-REPO ==');
  const dir = mkTmp('syntheon-notrepo-');
  try {
    const s = gitSensor.observe(dir);
    assert(s.repo_root === null, 'repo_root nulo fora de repo git');
    assert(s.errors.some((e) => e.startsWith('NOT_A_GIT_REPO')), 'erro tipado NOT_A_GIT_REPO');
  } finally {
    rmTmp(dir);
  }
}

console.log('================================================================');
console.log('  TEST SUITE: SENSORES LOCAL/GIT (Card #95 H01-004)');
console.log('================================================================');

testLocalSensor();
testGitSensor();
testNonRepo();

console.log('\n================================================================');
console.log('  RESULTADO: ' + passed + ' PASS / ' + failed + ' FAIL');
console.log('================================================================');
process.exit(failed === 0 ? 0 : 1);
