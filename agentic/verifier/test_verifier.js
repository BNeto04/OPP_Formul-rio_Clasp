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
const { verify } = require('./verifier');

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
console.log('  RESULTADO: ' + passed + ' PASS / ' + failed + ' FAIL');
console.log('================================================================');
process.exit(failed === 0 ? 0 : 1);
