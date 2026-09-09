/**
 * Syntheon Agentic Layer - Test Gate (Canteiro A02)
 * Card: #84 T-A02-TEST-GATE-006
 *
 * Gate entre worker e Git: prova so passa com evidencia.
 * 1. deriva comandos de teste; 2. validacoes sintaticas/lint; 3. testes obrigatorios +
 * regressao minima; 4. diff vs allowlist; 5. detecta mudanca fora de escopo, secrets e
 * arquivos gigantes; 6. classifica PASS/FAIL/BLOCKED; 7. ciclo de correcao limitado;
 * 8. evidencia factual; 9. geracao de arquivo NAO e execucao comprovada.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const GATE_SCHEMA = 'syntheon.test_gate.v1';
const MAX_CORRECTION_CYCLES = 2;
const GIANT_FILE_BYTES = 1024 * 1024; // 1MB

const SECRET_RE = /(sk-[A-Za-z0-9]{16,}|AIza[0-9A-Za-z_-]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|xox[baprs]-|-----BEGIN [A-Z ]*PRIVATE KEY-----|TOKEN\s*[:=]\s*["'][^"']{12,})/g;

function tokenize(cmdLine) {
  // Tokenizador com suporte a aspas duplas: preserva scripts "-e" com espacos.
  const out = [];
  const re = /([^\s"]+)|"([^"]*)"/g;
  let m;
  while ((m = re.exec(cmdLine)) !== null) out.push(m[1] !== undefined ? m[1] : m[2]);
  return out;
}

function run(cwd, cmdLine, timeoutMs) {
  const parts = tokenize(cmdLine);
  const r = spawnSync(parts[0], parts.slice(1), { cwd, encoding: 'utf8', timeout: timeoutMs || 120000 });
  return { exit_code: r.status, stdout: String(r.stdout || ''), stderr: String(r.stderr || '') };
}

function changedFiles(dir) {
  const out = [];
  for (const cmd of [['diff', '--name-only', 'HEAD'], ['status', '--porcelain']]) {
    const r = spawnSync('git', cmd, { cwd: dir, encoding: 'utf8' });
    const lines = String(r.stdout || '').split('\n').filter(Boolean);
    if (cmd[0] === 'diff') out.push(...lines);
    else out.push(...lines.filter((l) => l.startsWith('??')).map((l) => l.slice(3).trim()));
  }
  return [...new Set(out.map((f) => path.normalize(f).replace(/\\/g, '/')).filter(Boolean))];
}

function isOutsideScope(file, allowed) {
  const n = path.normalize(file).replace(/\\/g, '/');
  return !allowed.some((a) => n === a || n.startsWith(a.replace(/\/+$/, '') + '/'));
}

function scanSecretsInFiles(dir, files) {
  const found = [];
  for (const f of files) {
    const abs = path.join(dir, f);
    if (!fs.existsSync(abs)) continue;
    const text = fs.readFileSync(abs, 'utf8');
    SECRET_RE.lastIndex = 0;
    const m = text.match(SECRET_RE);
    if (m) found.push({ file: f, pattern: m[0].substring(0, 12) + '...' });
  }
  return found;
}

/**
 * @param {object} input { workdir, allowed_files[], forbidden_files[], test_commands[],
 *   syntax_check_js?: bool, giant_file_bytes?: number, worker_fn?: (feedback)=>bool (ciclo de correcao) }
 */
async function runGate(input) {
  const dir = path.resolve(input.workdir || '.');
  const allowed = (input.allowed_files || []).map((f) => path.normalize(f).replace(/\\/g, '/'));
  const checks = [];
  const result = { schema: GATE_SCHEMA, status: 'BLOCKED', checks: checks, correction_cycles: 0, evidence: null };

  const add = (id, status, detail) => checks.push({ id, status, detail });

  // 1. Escopo: diff vs allowlist
  const files = changedFiles(dir);
  const outside = files.filter((f) => isOutsideScope(f, allowed));
  const secrets = scanSecretsInFiles(dir, files);
  const giant = [];
  for (const f of files) {
    const abs = path.join(dir, f);
    if (fs.existsSync(abs) && fs.statSync(abs).size > (input.giant_file_bytes || GIANT_FILE_BYTES)) giant.push({ file: f, bytes: fs.statSync(abs).size });
  }
  add('scope_diff', outside.length === 0 ? 'PASS' : 'BLOCKED', outside.length === 0 ? 'diff dentro do allowlist' : 'fora do escopo: ' + outside.join(', '));
  add('secrets_scan', secrets.length === 0 ? 'PASS' : 'BLOCKED', secrets.length === 0 ? 'sem secrets' : secrets.map((s) => s.file + ':' + s.pattern).join('; '));
  add('giant_files', giant.length === 0 ? 'PASS' : 'BLOCKED', giant.length === 0 ? 'sem arquivos gigantes' : giant.map((g) => g.file + '=' + g.bytes + 'B').join('; '));
  if (outside.length || secrets.length || giant.length) {
    result.status = 'BLOCKED';
    result.reason = 'scope/secrets/giant reprovaram antes de qualquer execucao';
    return result;
  }

  // 2. Sintaxe (JS) quando aplicavel
  if (input.syntax_check_js !== false) {
    const jsFiles = files.filter((f) => f.endsWith('.js'));
    let synOk = true;
    for (const f of jsFiles) {
      const r = spawnSync('node', ['--check', path.join(dir, f)], { encoding: 'utf8' });
      if (r.status !== 0) { synOk = false; add('syntax_check', 'FAIL', f + ': ' + String(r.stderr || '').split('\n')[0]); break; }
    }
    if (synOk) add('syntax_check', 'PASS', 'sintaxe JS ok (' + jsFiles.length + ' arquivo(s))');
  }

  // 3. Ciclo de execucao: testes obrigatorios (+ ciclos de correcao limitados)
  const testCommands = (input.test_commands || []).filter(Boolean);
  if (!testCommands.length) {
    add('test_runner', 'FAIL', 'nenhum comando de teste obrigatorio declarado (geracao de arquivo NAO e prova)');
    result.status = 'FAIL';
    result.reason = 'sem testes obrigatorios';
    return result;
  }

  let cycle = 0;
  let passedOnce = false;
  while (cycle <= MAX_CORRECTION_CYCLES) {
    let allOk = true;
    for (const cmd of testCommands) {
      const r = run(dir, cmd);
      add(cycle === 0 ? 'test_runner' : 'test_runner_cycle' + cycle, r.exit_code === 0 ? 'PASS' : 'FAIL', cmd + (r.exit_code === 0 ? '' : ' -> exit ' + r.exit_code + ' | ' + String(r.stderr || r.stdout).split('\n').slice(-2).join(' | ')));
      if (r.exit_code !== 0) allOk = false;
    }
    if (allOk) { passedOnce = true; break; }
    if (cycle >= MAX_CORRECTION_CYCLES) break;
    if (typeof input.worker_fn === 'function') {
      const fixed = input.worker_fn('ciclo de correcao ' + (cycle + 1));
      if (!fixed) break;
      result.correction_cycles = cycle + 1;
    } else {
      break;
    }
    cycle++;
  }

  result.status = passedOnce ? 'PASS' : 'FAIL';
  result.reason = passedOnce ? 'testes verdes + escopo limpo' : 'testes nao passaram apos ciclos de correcao';
  result.evidence = {
    files_changed: files,
    checks_total: checks.length,
    passed: checks.filter((c) => c.status === 'PASS').length,
    blocked_or_failed: checks.filter((c) => c.status !== 'PASS').length
  };
  return result;
}

module.exports = { runGate, changedFiles, isOutsideScope, scanSecretsInFiles, GATE_SCHEMA };
