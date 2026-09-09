/**
 * Syntheon Agentic Layer - Verifier (Colmeia H01)
 * Card: #96 H01-005 - Verificador independente da rota minima confiavel.
 *
 * Consome SOMENTE evidencia tipada: claim/RESULT do Executor, resultado do
 * Test Runner, evidencia Local e evidencia Git (sensores #95). Nao confia em
 * prosa do Executor: ausencia de evidencia nunca vira aprovacao.
 *
 * Saidas canonicas:
 *   VERIFIED | NOT_VERIFIED | INSUFFICIENT_EVIDENCE | TEST_FAILED
 */

const path = require('path');

const SCHEMA = 'syntheon.verifier.v1';
const VERSION = '1.0.0';
const VERDICTS = ['VERIFIED', 'NOT_VERIFIED', 'INSUFFICIENT_EVIDENCE', 'TEST_FAILED'];

function isNonEmptyObject(o) {
  return Boolean(o) && typeof o === 'object' && !Array.isArray(o) && Object.keys(o).length > 0;
}

function resolveClaimPath(claimFile, repoRoot) {
  if (!repoRoot) return path.resolve(claimFile);
  return path.resolve(repoRoot, claimFile);
}

/**
 * @param {object} inputs
 * @param {object} [inputs.claim]          { task_id, status, files_created: string[], commit_sha? }
 * @param {object} [inputs.testResult]     { passed, failed, exit_code }
 * @param {object} [inputs.local]          evidencia Local (schema syntheon.sensor.local.v1)
 * @param {object} [inputs.git]            evidencia Git (schema syntheon.sensor.git.v1)
 * @returns {object} verdict tipado
 */
function verify({ claim, testResult, local, git } = {}) {
  const checked_at = new Date().toISOString();
  const checks = [];
  const reasons = [];

  const present = {
    claim: isNonEmptyObject(claim),
    test_result: isNonEmptyObject(testResult),
    local_evidence: isNonEmptyObject(local),
    git_evidence: isNonEmptyObject(git)
  };
  const missing = Object.keys(present).filter((k) => !present[k]);

  if (missing.length) {
    checks.push({ id: 'inputs', status: 'INSUFFICIENT', detail: 'faltando: ' + missing.join(', ') });
    return {
      schema: SCHEMA,
      version: VERSION,
      verdict: 'INSUFFICIENT_EVIDENCE',
      checked_at,
      inputs_present: present,
      checks,
      reasons: ['Ausencia de evidencia nunca vira aprovacao. Evidencia ausente: ' + missing.join(', ')]
    };
  }

  // 1. Test Runner: falha de teste encerra como TEST_FAILED
  const failed = Number.isFinite(Number(testResult.failed)) ? Number(testResult.failed) : -1;
  const passed = Number.isFinite(Number(testResult.passed)) ? Number(testResult.passed) : -1;
  const exitCode = Number.isFinite(Number(testResult.exit_code)) ? Number(testResult.exit_code) : -1;
  const testOk = failed === 0 && passed >= 0 && (exitCode === 0 || exitCode === -1);
  checks.push({
    id: 'test_runner',
    status: testOk ? 'OK' : 'FAIL',
    detail: `passed=${passed} failed=${failed} exit_code=${exitCode}`
  });
  if (!testOk) {
    reasons.push(`Test Runner reprovou: passed=${passed} failed=${failed} exit_code=${exitCode}`);
    return {
      schema: SCHEMA, version: VERSION, verdict: 'TEST_FAILED', checked_at,
      inputs_present: present, checks, reasons
    };
  }

  // 2. Claim deve declarar artefatos a verificar
  const declaredFiles = Array.isArray(claim.files_created) ? claim.files_created : [];
  if (!declaredFiles.length) {
    checks.push({ id: 'claim', status: 'FAIL', detail: 'claim.files_created vazio ou ausente' });
    reasons.push('Claim do Executor nao declara arquivos a verificar.');
    return {
      schema: SCHEMA, version: VERSION, verdict: 'NOT_VERIFIED', checked_at,
      inputs_present: present, checks, reasons
    };
  }

  // 3. Evidencia Local: arquivos declarados devem existir como file
  const localTargets = Array.isArray(local.targets) ? local.targets : [];
  const repoRoot = (git && git.repo_root) || null;
  const expectedAbs = declaredFiles.map((f) => resolveClaimPath(f, repoRoot));
  const targetPaths = new Set(localTargets.map((t) => t.path));
  const byPath = {};
  for (const t of localTargets) byPath[t.path] = t;

  const filesOk = [];
  for (let i = 0; i < declaredFiles.length; i++) {
    const abs = expectedAbs[i];
    const target = byPath[abs];
    const ok = Boolean(target && target.exists === true && target.kind === 'file');
    filesOk.push({ declared: declaredFiles[i], expected_abs: abs, found: ok });
    checks.push({
      id: 'local_file',
      status: ok ? 'OK' : 'FAIL',
      detail: `${declaredFiles[i]} (${abs})`
    });
    if (!ok) {
      reasons.push(`Evidencia Local nao confirma arquivo declarado: ${declaredFiles[i]}`);
    }
  }

  // 4. Evidencia Git: se claim declara commit_sha, head deve bater
  if (claim.commit_sha) {
    if (!git.head_sha) {
      checks.push({ id: 'git_head', status: 'INSUFFICIENT', detail: 'claim pede commit_sha mas evidencia Git nao tem head' });
      reasons.push('Evidencia Git sem head_sha impossibilita conferir commit declarado.');
      return {
        schema: SCHEMA, version: VERSION, verdict: 'INSUFFICIENT_EVIDENCE', checked_at,
        inputs_present: present, checks, reasons
      };
    }
    const headOk = git.head_sha === claim.commit_sha;
    checks.push({ id: 'git_head', status: headOk ? 'OK' : 'FAIL', detail: `esperado=${claim.commit_sha} real=${git.head_sha}` });
    if (!headOk) {
      reasons.push(`HEAD do repositorio difere do commit declarado: ${git.head_sha} != ${claim.commit_sha}`);
      return {
        schema: SCHEMA, version: VERSION, verdict: 'NOT_VERIFIED', checked_at,
        inputs_present: present, checks, reasons
      };
    }
  }

  // 5. Veredito final
  const allOk = filesOk.every((f) => f.found);
  if (!allOk) {
    return {
      schema: SCHEMA, version: VERSION, verdict: 'NOT_VERIFIED', checked_at,
      inputs_present: present, checks, reasons
    };
  }

  checks.push({ id: 'verdict', status: 'OK', detail: 'todas as evidencias confirmam o claim' });
  return {
    schema: SCHEMA, version: VERSION, verdict: 'VERIFIED', checked_at,
    inputs_present: present, checks, reasons: ['Evidencia material confirma o claim do Executor de forma independente.']
  };
}

module.exports = { SCHEMA, VERSION, VERDICTS, verify };
