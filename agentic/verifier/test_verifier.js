/**
 * Syntheon Agentic Layer - Testes deterministicos do Verifier
 * Card: #96 H01-005
 *
 * Fixtures sinteticas em diretorio temporario (fora do workspace).
 * Nao toca em nenhum arquivo do repositorio. Saida: [PASS]/[FAIL] + exit code.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { verify, verifyTask } = require('./verifier');

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

function makeEvidence(dir, files, headSha) {
  const targets = [];
  for (const rel of files) {
    const abs = path.join(dir, rel);
    fs.writeFileSync(abs, 'conteudo');
    targets.push({ path: abs, exists: true, kind: 'file', size_bytes: 8 });
  }
  return {
    claim: { task_id: 'T-001', status: 'PASS', files_created: files, commit_sha: headSha },
    testResult: { passed: 3, failed: 0, exit_code: 0 },
    local: { schema: 'syntheon.sensor.local.v1', targets },
    git: { schema: 'syntheon.sensor.git.v1', repo_root: dir, head_sha: headSha }
  };
}

console.log('================================================================');
console.log('  TEST SUITE: VERIFIER (Card #96 H01-005)');
console.log('================================================================');

// 1. Caminho feliz -> VERIFIED
{
  const dir = mkTmp('syn-verifier-ok-');
  try {
    const ev = makeEvidence(dir, ['a.txt'], 'sha123');
    const v = verify(ev);
    assert(v.verdict === 'VERIFIED', 'evidencia completa e consistente -> VERIFIED');
    assert(v.schema === 'syntheon.verifier.v1', 'schema tipado presente');
    assert(v.inputs_present.claim && v.inputs_present.git_evidence, 'inputs_present registrado');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

// 2. Ausencia de evidencia -> INSUFFICIENT_EVIDENCE (nunca aprovacao)
{
  const v = verify({ claim: null, testResult: null, local: null, git: null });
  assert(v.verdict === 'INSUFFICIENT_EVIDENCE', 'sem nenhuma evidencia -> INSUFFICIENT_EVIDENCE');
  const v2 = verify({ claim: { task_id: 'T' }, testResult: { passed: 1, failed: 0, exit_code: 0 }, local: null, git: null });
  assert(v2.verdict === 'INSUFFICIENT_EVIDENCE', 'evidencia Git ausente -> INSUFFICIENT_EVIDENCE');
}

// 3. Teste falhou -> TEST_FAILED
{
  const dir = mkTmp('syn-verifier-testfail-');
  try {
    const ev = makeEvidence(dir, ['a.txt'], 'sha123');
    ev.testResult = { passed: 1, failed: 2, exit_code: 1 };
    const v = verify(ev);
    assert(v.verdict === 'TEST_FAILED', 'test runner com falha -> TEST_FAILED');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

// 4. Arquivo declarado ausente no disco -> NOT_VERIFIED
{
  const dir = mkTmp('syn-verifier-missing-');
  try {
    const ev = makeEvidence(dir, ['a.txt'], 'sha123');
    ev.claim.files_created = ['b.txt'];
    const v = verify(ev);
    assert(v.verdict === 'NOT_VERIFIED', 'arquivo declarado ausente da evidencia Local -> NOT_VERIFIED');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

// 5. Claim sem arquivos declarados -> NOT_VERIFIED
{
  const dir = mkTmp('syn-verifier-nodecl-');
  try {
    const ev = makeEvidence(dir, ['a.txt'], 'sha123');
    ev.claim.files_created = [];
    const v = verify(ev);
    assert(v.verdict === 'NOT_VERIFIED', 'claim sem files_created -> NOT_VERIFIED');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

// 6. HEAD diverge do commit declarado -> NOT_VERIFIED
{
  const dir = mkTmp('syn-verifier-head-');
  try {
    const ev = makeEvidence(dir, ['a.txt'], 'sha123');
    ev.git.head_sha = 'sha456';
    const v = verify(ev);
    assert(v.verdict === 'NOT_VERIFIED', 'HEAD real != commit declarado -> NOT_VERIFIED');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

// 7. Claim exige commit_sha mas Git nao tem head -> INSUFFICIENT_EVIDENCE
{
  const dir = mkTmp('syn-verifier-nohead-');
  try {
    const ev = makeEvidence(dir, ['a.txt'], 'sha123');
    delete ev.git.head_sha;
    const v = verify(ev);
    assert(v.verdict === 'INSUFFICIENT_EVIDENCE', 'commit declarado sem head na evidencia Git -> INSUFFICIENT_EVIDENCE');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

// 8. Arquivo existe mas nao e file (dir) -> NOT_VERIFIED
{
  const dir = mkTmp('syn-verifier-dir-');
  try {
    const ev = makeEvidence(dir, ['a.txt'], 'sha123');
    ev.local.targets[0].kind = 'dir';
    const v = verify(ev);
    assert(v.verdict === 'NOT_VERIFIED', 'alvo declarado como dir nao confirma file -> NOT_VERIFIED');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

console.log('\n================================================================');
console.log('  BLOCO B: MODO SPEC-DRIVEN (realista com a task)');
console.log('================================================================');

function specFixture(dir, overrides = {}) {
  const files = overrides.files || ['agentic/verifier/verifier.js'];
  const targets = files.map((f) => ({ path: path.join(dir, f), exists: true, kind: 'file', size_bytes: 100 }));
  const base = {
    spec: {
      card_id: 'H01-005-#96',
      branch: 'sprint/h01-colmeia-api-001',
      base_sha: 'base000',
      commit_sha: 'head999',
      allowed_paths: ['agentic/verifier/'],
      forbidden_paths: ['agentic/sensors/', 'config/'],
      required_files: files,
      no_secrets: true
    },
    claim: { task_id: 'H01-005-#96', status: 'PASS', files_created: files, commit_sha: 'head999' },
    testResult: { passed: 4, failed: 0, exit_code: 0 },
    local: { schema: 'syntheon.sensor.local.v1', targets },
    git: {
      schema: 'syntheon.sensor.git.v1',
      repo_root: dir,
      branch: 'sprint/h01-colmeia-api-001',
      head_sha: 'head999',
      committed: {
        base_sha: 'base000',
        head_sha: 'head999',
        files_changed: files,
        patch: 'diff --git a/agentic/verifier/verifier.js b/agentic/verifier/verifier.js\n+module.exports = {};\n'
      },
      working_tree: []
    }
  };
  return Object.assign({}, base, overrides, {
    git: Object.assign({}, base.git, overrides.git || {})
  });
}

// B1. caminho feliz spec-driven -> VERIFIED
{
  const dir = mkTmp('syn-verifier-spec-ok-');
  try {
    const v = verifyTask(specFixture(dir));
    assert(v.verdict === 'VERIFIED', 'spec completo e consistente -> VERIFIED');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

// B2. sem spec -> INSUFFICIENT_EVIDENCE
{
  const dir = mkTmp('syn-verifier-spec-null-');
  try {
    const fx = specFixture(dir);
    const v = verifyTask(Object.assign({}, fx, { spec: null }));
    assert(v.verdict === 'INSUFFICIENT_EVIDENCE', 'spec ausente -> INSUFFICIENT_EVIDENCE');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

// B3. branch errada -> NOT_VERIFIED
{
  const dir = mkTmp('syn-verifier-spec-branch-');
  try {
    const fx = specFixture(dir, { git: { branch: 'main' } });
    const v = verifyTask(fx);
    assert(v.verdict === 'NOT_VERIFIED', 'branch real != spec.branch -> NOT_VERIFIED');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

// B4. claim omite artefato obrigatorio -> NOT_VERIFIED (mentira por omissao)
{
  const dir = mkTmp('syn-verifier-spec-omit-');
  try {
    const fx = specFixture(dir);
    fx.claim.files_created = ['agentic/verifier/verifier.js']; // spec exige 1 so aqui; mudar spec p/ 2
    fx.spec.required_files = ['agentic/verifier/verifier.js', 'agentic/verifier/run_verifier.js'];
    const v = verifyTask(fx);
    assert(v.verdict === 'NOT_VERIFIED', 'claim omite arquivo exigido pelo spec -> NOT_VERIFIED');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

// B5. diff commitado fora do allowed_paths (scope creep real) -> NOT_VERIFIED
{
  const dir = mkTmp('syn-verifier-spec-scope-');
  try {
    const fx = specFixture(dir);
    fx.git.committed.files_changed = fx.git.committed.files_changed.concat(['Core/Utils.js']);
    const v = verifyTask(fx);
    assert(v.verdict === 'NOT_VERIFIED', 'arquivo commitado fora do escopo permitido -> NOT_VERIFIED');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

// B6. area proibida tocada -> NOT_VERIFIED
{
  const dir = mkTmp('syn-verifier-spec-forbid-');
  try {
    const fx = specFixture(dir);
    fx.git.committed.files_changed = ['agentic/sensors/git_sensor.js'];
    const v = verifyTask(fx);
    assert(v.verdict === 'NOT_VERIFIED', 'diff toca forbidden_paths -> NOT_VERIFIED');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

// B7. artefato obrigatorio no disco mas NAO commitado -> NOT_VERIFIED
{
  const dir = mkTmp('syn-verifier-spec-uncommitted-');
  try {
    const fx = specFixture(dir);
    fx.git.committed.files_changed = [];
    const v = verifyTask(fx);
    assert(v.verdict === 'NOT_VERIFIED', 'artefato obrigatorio nao commitado -> NOT_VERIFIED');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

// B8. artefato modificado apos o commit (working tree sujo) -> NOT_VERIFIED
{
  const dir = mkTmp('syn-verifier-spec-dirty-');
  try {
    const fx = specFixture(dir);
    fx.git.working_tree = ['agentic/verifier/verifier.js'];
    const v = verifyTask(fx);
    assert(v.verdict === 'NOT_VERIFIED', 'artefato modificado pos-commit -> NOT_VERIFIED');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

// B9. secret no patch real -> NOT_VERIFIED (sem expor valor)
{
  const dir = mkTmp('syn-verifier-spec-secret-');
  try {
    const fx = specFixture(dir);
    fx.git.committed.patch = 'diff --git a/x b/x\n+const KEY = "sk-ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";\n';
    const v = verifyTask(fx);
    assert(v.verdict === 'NOT_VERIFIED', 'padrao de secret no diff -> NOT_VERIFIED');
    const secretCheck = v.checks.find((c) => c.id === 'secrets_scan');
    assert(secretCheck && secretCheck.status === 'FAIL', 'check secrets_scan registrado como FAIL');
    assert(!JSON.stringify(v).includes('sk-ABCDEFGHIJKLMNOPQRSTUVWXYZ'), 'valor do secret nunca aparece na saida');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

// B10. spec exige base_sha mas evidencia git sem committed -> INSUFFICIENT_EVIDENCE
{
  const dir = mkTmp('syn-verifier-spec-nobase-');
  try {
    const fx = specFixture(dir);
    fx.git.committed = null;
    const v = verifyTask(fx);
    assert(v.verdict === 'INSUFFICIENT_EVIDENCE', 'sem escopo commitado na evidencia -> INSUFFICIENT_EVIDENCE');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

console.log('\n================================================================');
console.log('  RESULTADO: ' + passed + ' PASS / ' + failed + ' FAIL');
console.log('================================================================');
process.exit(failed === 0 ? 0 : 1);
