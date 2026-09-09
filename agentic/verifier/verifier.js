/**
 * Syntheon Agentic Layer - Verifier (Colmeia H01)
 * Card: #96 H01-005 - Verificador independente da rota minima confiavel.
 *
 * Consome SOMENTE evidencia tipada: claim/RESULT do Executor, resultado do
 * Test Runner, evidencia Local e evidencia Git (sensores #95). Nao confia em
 * prosa do Executor: ausencia de evidencia nunca vira aprovacao.
 *
 * Modo spec-driven (verifyTask): o SPEC (interpretacao executavel do card,
 * definida de forma independente do claim) e a autoridade dos criterios:
 *   - escopo real do diff commitado (base..HEAD) confinado a allowed_paths;
 *   - areas proibidas intocadas;
 *   - artefatos obrigatorios existem no disco E foram commitados;
 *   - working tree dos artefatos limpo (nada modificado apos o commit);
 *   - scan de secrets no patch real (nunca expoe o valor);
 *   - claim do Executor deve declarar todos os artefatos obrigatorios do spec.
 *
 * Saidas canonicas:
 *   VERIFIED | NOT_VERIFIED | INSUFFICIENT_EVIDENCE | TEST_FAILED
 */

const path = require('path');

const SCHEMA = 'syntheon.verifier.v1';
const VERSION = '2.0.0';
const SPEC_SCHEMA = 'syntheon.task_spec.v1';
const VERDICTS = ['VERIFIED', 'NOT_VERIFIED', 'INSUFFICIENT_EVIDENCE', 'TEST_FAILED'];

const SECRET_PATTERNS = [
  { id: 'OPENAI_LIKE_SK', re: /\bsk-[A-Za-z0-9_-]{20,}\b/g },
  { id: 'GEMINI_AIZA', re: /\bAIza[0-9A-Za-z_-]{30,}\b/g },
  { id: 'AWS_AKIA', re: /\bAKIA[0-9A-Z]{16}\b/g },
  { id: 'PRIVATE_KEY_BLOCK', re: /-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----/g },
  { id: 'GITHUB_TOKEN', re: /\bgh[pousr]_[A-Za-z0-9]{20,}\b|\bgithub_pat_[A-Za-z0-9_]{20,}\b/g },
  { id: 'SLACK_TOKEN', re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g },
  { id: 'TELEGRAM_BOT_TOKEN', re: /\b[0-9]{8,10}:[A-Za-z0-9_-]{30,}\b/g },
  { id: 'KEY_ASSIGNMENT', re: /\b(?:api[_-]?key|token|secret|password)\s*[:=]\s*["'][^"']{8,}["']/gi }
];

function isNonEmptyObject(o) {
  return Boolean(o) && typeof o === 'object' && !Array.isArray(o) && Object.keys(o).length > 0;
}

function norm(p) {
  return String(p).replace(/\\/g, '/');
}

function isUnder(p, prefix) {
  const pathNorm = norm(p).replace(/\/+$/, '');
  const preNorm = norm(prefix).replace(/\/+$/, '');
  return pathNorm === preNorm || pathNorm.startsWith(preNorm + '/');
}

function resolveClaimPath(claimFile, repoRoot) {
  if (!repoRoot) return path.resolve(claimFile);
  return path.resolve(repoRoot, claimFile);
}

function verdictResult(verdict, present, checks, reasons) {
  return {
    schema: SCHEMA,
    version: VERSION,
    verdict,
    checked_at: new Date().toISOString(),
    inputs_present: present,
    checks,
    reasons
  };
}

function scanSecrets(patchText) {
  const found = [];
  if (!patchText) return found;
  // Realismo: o risco e o que ENTRA no codigo. Scaneia apenas linhas adicionadas
  // (prefixo +), ignorando cabecalhos de diff (+++) e linhas removidas (-).
  const added = patchText.split('\n')
    .filter((l) => l.startsWith('+') && !l.startsWith('+++'))
    .map((l) => l.slice(1))
    .join('\n');
  for (const pat of SECRET_PATTERNS) {
    const matches = added.match(pat.re);
    if (matches && matches.length) {
      found.push({ pattern: pat.id, occurrences: matches.length });
    }
  }
  return found;
}

/**
 * Modo legado (claim-driven): verifica se o que o claim declarou existe
 * e o HEAD bate. Mantido para compatibilidade; o modo spec-driven e o
 * criterio realista da rota.
 */
function verify({ claim, testResult, local, git } = {}) {
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
    return verdictResult('INSUFFICIENT_EVIDENCE', present, checks,
      ['Ausencia de evidencia nunca vira aprovacao. Evidencia ausente: ' + missing.join(', ')]);
  }

  const failed = Number.isFinite(Number(testResult.failed)) ? Number(testResult.failed) : -1;
  const passed = Number.isFinite(Number(testResult.passed)) ? Number(testResult.passed) : -1;
  const exitCode = Number.isFinite(Number(testResult.exit_code)) ? Number(testResult.exit_code) : -1;
  const testOk = failed === 0 && passed >= 0 && (exitCode === 0 || exitCode === -1);
  checks.push({ id: 'test_runner', status: testOk ? 'OK' : 'FAIL', detail: `passed=${passed} failed=${failed} exit_code=${exitCode}` });
  if (!testOk) {
    reasons.push(`Test Runner reprovou: passed=${passed} failed=${failed} exit_code=${exitCode}`);
    return verdictResult('TEST_FAILED', present, checks, reasons);
  }

  const declaredFiles = Array.isArray(claim.files_created) ? claim.files_created : [];
  if (!declaredFiles.length) {
    checks.push({ id: 'claim', status: 'FAIL', detail: 'claim.files_created vazio ou ausente' });
    reasons.push('Claim do Executor nao declara arquivos a verificar.');
    return verdictResult('NOT_VERIFIED', present, checks, reasons);
  }

  const localTargets = Array.isArray(local.targets) ? local.targets : [];
  const repoRoot = (git && git.repo_root) || null;
  const byPath = {};
  for (const t of localTargets) byPath[t.path] = t;

  const filesOk = [];
  for (const f of declaredFiles) {
    const abs = resolveClaimPath(f, repoRoot);
    const target = byPath[abs];
    const ok = Boolean(target && target.exists === true && target.kind === 'file');
    filesOk.push({ declared: f, found: ok });
    checks.push({ id: 'local_file', status: ok ? 'OK' : 'FAIL', detail: `${f} (${abs})` });
    if (!ok) reasons.push(`Evidencia Local nao confirma arquivo declarado: ${f}`);
  }

  if (claim.commit_sha) {
    if (!git.head_sha) {
      checks.push({ id: 'git_head', status: 'INSUFFICIENT', detail: 'claim pede commit_sha mas evidencia Git nao tem head' });
      reasons.push('Evidencia Git sem head_sha impossibilita conferir commit declarado.');
      return verdictResult('INSUFFICIENT_EVIDENCE', present, checks, reasons);
    }
    const headOk = git.head_sha === claim.commit_sha;
    checks.push({ id: 'git_head', status: headOk ? 'OK' : 'FAIL', detail: `esperado=${claim.commit_sha} real=${git.head_sha}` });
    if (!headOk) {
      reasons.push(`HEAD do repositorio difere do commit declarado: ${git.head_sha} != ${claim.commit_sha}`);
      return verdictResult('NOT_VERIFIED', present, checks, reasons);
    }
  }

  if (!filesOk.every((f) => f.found)) {
    return verdictResult('NOT_VERIFIED', present, checks, reasons);
  }

  checks.push({ id: 'verdict', status: 'OK', detail: 'todas as evidencias confirmam o claim' });
  return verdictResult('VERIFIED', present, checks,
    ['Evidencia material confirma o claim do Executor de forma independente.']);
}

/**
 * Modo spec-driven (realista com a tarefa): o spec e a autoridade.
 * @param {object} spec { card_id, branch?, base_sha, commit_sha?, allowed_paths[], forbidden_paths[], required_files[], no_secrets? }
 */
function verifyTask({ spec, claim, testResult, local, git } = {}) {
  const checks = [];
  const reasons = [];
  const present = {
    spec: isNonEmptyObject(spec),
    claim: isNonEmptyObject(claim),
    test_result: isNonEmptyObject(testResult),
    local_evidence: isNonEmptyObject(local),
    git_evidence: isNonEmptyObject(git)
  };
  const missing = Object.keys(present).filter((k) => !present[k]);

  if (missing.length) {
    checks.push({ id: 'inputs', status: 'INSUFFICIENT', detail: 'faltando: ' + missing.join(', ') });
    return verdictResult('INSUFFICIENT_EVIDENCE', present, checks,
      ['Ausencia de evidencia nunca vira aprovacao. Evidencia ausente: ' + missing.join(', ')]);
  }

  // 1. Test Runner
  const failed = Number.isFinite(Number(testResult.failed)) ? Number(testResult.failed) : -1;
  const passed = Number.isFinite(Number(testResult.passed)) ? Number(testResult.passed) : -1;
  const exitCode = Number.isFinite(Number(testResult.exit_code)) ? Number(testResult.exit_code) : -1;
  const testOk = failed === 0 && passed >= 0 && (exitCode === 0 || exitCode === -1);
  checks.push({ id: 'test_runner', status: testOk ? 'OK' : 'FAIL', detail: `passed=${passed} failed=${failed} exit_code=${exitCode}` });
  if (!testOk) {
    reasons.push(`Test Runner reprovou: passed=${passed} failed=${failed} exit_code=${exitCode}`);
    return verdictResult('TEST_FAILED', present, checks, reasons);
  }

  // 2. Branch
  if (spec.branch) {
    const branchOk = Boolean(git.branch) && git.branch === spec.branch;
    checks.push({ id: 'branch', status: branchOk ? 'OK' : 'FAIL', detail: `esperado=${spec.branch} real=${git.branch}` });
    if (!branchOk) {
      reasons.push(`Branch real (${git.branch}) difere do spec (${spec.branch}).`);
      return verdictResult('NOT_VERIFIED', present, checks, reasons);
    }
  }

  // 3. Claim deve declarar todos os artefatos obrigatorios do spec
  const requiredFiles = Array.isArray(spec.required_files) ? spec.required_files : [];
  const declared = new Set((Array.isArray(claim.files_created) ? claim.files_created : []).map(norm));
  const claimCoverage = requiredFiles.filter((f) => !declared.has(norm(f)));
  checks.push({
    id: 'claim_coverage',
    status: claimCoverage.length === 0 ? 'OK' : 'FAIL',
    detail: claimCoverage.length === 0 ? 'claim declara todos os artefatos do spec'
      : 'nao declarados: ' + claimCoverage.join(', ')
  });
  if (claimCoverage.length) {
    reasons.push('Claim do Executor omite artefato obrigatorio do spec: ' + claimCoverage.join(', '));
    return verdictResult('NOT_VERIFIED', present, checks, reasons);
  }

  // 4. HEAD: spec.commit_sha autoritativo (fallback claim.commit_sha)
  const expectedSha = spec.commit_sha || claim.commit_sha || null;
  if (expectedSha) {
    if (!git.head_sha) {
      checks.push({ id: 'git_head', status: 'INSUFFICIENT', detail: 'spec pede commit_sha mas evidencia Git nao tem head' });
      reasons.push('Evidencia Git sem head_sha impossibilita conferir commit declarado.');
      return verdictResult('INSUFFICIENT_EVIDENCE', present, checks, reasons);
    }
    const headOk = git.head_sha === expectedSha;
    checks.push({ id: 'git_head', status: headOk ? 'OK' : 'FAIL', detail: `esperado=${expectedSha} real=${git.head_sha}` });
    if (!headOk) {
      reasons.push(`HEAD real difere do commit esperado: ${git.head_sha} != ${expectedSha}`);
      return verdictResult('NOT_VERIFIED', present, checks, reasons);
    }
  }

  // 5. Escopo commitado (base..HEAD) confinado e sem areas proibidas
  if (spec.base_sha) {
    const committed = git.committed;
    if (!committed || !Array.isArray(committed.files_changed)) {
      checks.push({ id: 'committed_scope', status: 'INSUFFICIENT', detail: 'evidencia Git sem escopo commitado (base_sha no spec)' });
      reasons.push('Spec define base_sha mas a evidencia Git nao traz committed.files_changed.');
      return verdictResult('INSUFFICIENT_EVIDENCE', present, checks, reasons);
    }
    if (committed.files_changed.length === 0) {
      checks.push({ id: 'committed_scope', status: 'FAIL', detail: 'nenhuma mudanca commitada entre base e HEAD' });
      reasons.push('Nenhuma mudanca commitada entre base e HEAD: nada a verificar.');
      return verdictResult('NOT_VERIFIED', present, checks, reasons);
    }
    const allowed = Array.isArray(spec.allowed_paths) ? spec.allowed_paths : [];
    const forbidden = Array.isArray(spec.forbidden_paths) ? spec.forbidden_paths : [];
    const outside = committed.files_changed.filter((f) => !allowed.some((a) => isUnder(f, a)));
    checks.push({
      id: 'scope_confinement',
      status: outside.length === 0 ? 'OK' : 'FAIL',
      detail: outside.length === 0 ? 'diff commitado 100% dentro de allowed_paths'
        : 'fora do escopo: ' + outside.join(', ')
    });
    if (outside.length) {
      reasons.push('Diff commitado contem arquivos fora do escopo permitido: ' + outside.join(', '));
      return verdictResult('NOT_VERIFIED', present, checks, reasons);
    }
    const touchedForbidden = committed.files_changed.filter((f) => forbidden.some((fp) => isUnder(f, fp)));
    checks.push({
      id: 'forbidden_paths',
      status: touchedForbidden.length === 0 ? 'OK' : 'FAIL',
      detail: touchedForbidden.length === 0 ? 'areas proibidas intocadas' : 'tocadas: ' + touchedForbidden.join(', ')
    });
    if (touchedForbidden.length) {
      reasons.push('Diff commitado toca area proibida: ' + touchedForbidden.join(', '));
      return verdictResult('NOT_VERIFIED', present, checks, reasons);
    }
  } else {
    checks.push({ id: 'committed_scope', status: 'INSUFFICIENT', detail: 'spec sem base_sha: escopo nao verificado' });
    reasons.push('Spec sem base_sha impossibilita conferir confinamento do diff (definir base_sha).');
    return verdictResult('INSUFFICIENT_EVIDENCE', present, checks, reasons);
  }

  // 6. Artefatos obrigatorios: existem no disco (Local) E foram commitados (escopo)
  const localTargets = Array.isArray(local.targets) ? local.targets : [];
  const repoRoot = git.repo_root || null;
  const byPath = {};
  for (const t of localTargets) byPath[t.path] = t;
  const committedSet = new Set(git.committed.files_changed.map(norm));

  for (const f of requiredFiles) {
    const abs = resolveClaimPath(f, repoRoot);
    const target = byPath[abs];
    const onDisk = Boolean(target && target.exists === true && target.kind === 'file');
    const inCommit = committedSet.has(norm(f));
    const ok = onDisk && inCommit;
    checks.push({
      id: 'required_artifact',
      status: ok ? 'OK' : 'FAIL',
      detail: `${f} disco=${onDisk} commitado=${inCommit}`
    });
    if (!ok) {
      if (!onDisk) reasons.push(`Artefato obrigatorio ausente do disco: ${f}`);
      if (!inCommit) reasons.push(`Artefato obrigatorio existe mas nao foi commitado: ${f}`);
      return verdictResult('NOT_VERIFIED', present, checks, reasons);
    }
  }

  // 7. Working tree: artefatos obrigatorios nao podem estar modificados apos o commit
  const wtSet = new Set((Array.isArray(git.working_tree) ? git.working_tree : []).map(norm));
  const dirtyArtifacts = requiredFiles.filter((f) => wtSet.has(norm(f)));
  checks.push({
    id: 'working_tree_clean',
    status: dirtyArtifacts.length === 0 ? 'OK' : 'FAIL',
    detail: dirtyArtifacts.length === 0 ? 'artefatos sem modificacao pos-commit' : 'modificados: ' + dirtyArtifacts.join(', ')
  });
  if (dirtyArtifacts.length) {
    reasons.push('Artefato obrigatorio modificado apos o commit (disco != commit): ' + dirtyArtifacts.join(', '));
    return verdictResult('NOT_VERIFIED', present, checks, reasons);
  }

  // 8. Secrets no patch real
  const noSecrets = spec.no_secrets !== false;
  if (noSecrets) {
    const patch = (git.committed && git.committed.patch) || null;
    if (patch === null) {
      checks.push({ id: 'secrets_scan', status: 'INSUFFICIENT', detail: 'no_secrets=true mas evidencia Git sem patch' });
      reasons.push('Scan de secrets exigido mas o diff commitado nao foi fornecido na evidencia.');
      return verdictResult('INSUFFICIENT_EVIDENCE', present, checks, reasons);
    }
    const found = scanSecrets(patch);
    checks.push({
      id: 'secrets_scan',
      status: found.length === 0 ? 'OK' : 'FAIL',
      detail: found.length === 0 ? 'nenhum padrao de secret no diff' : found.map((s) => `${s.pattern}x${s.occurrences}`).join(', ')
    });
    if (found.length) {
      reasons.push('Padroes de secret detectados no diff commitado (sem expor valor): ' +
        found.map((s) => s.pattern).join(', '));
      return verdictResult('NOT_VERIFIED', present, checks, reasons);
    }
  }

  checks.push({ id: 'verdict', status: 'OK', detail: 'evidencia material confirma a task contra o spec' });
  return verdictResult('VERIFIED', present, checks,
    ['Evidencia material (disco + diff commitado + working tree) confirma a task contra o spec, de forma independente do claim.']);
}

module.exports = {
  SCHEMA, SPEC_SCHEMA, VERSION, VERDICTS, SECRET_PATTERNS, verify, verifyTask
};
