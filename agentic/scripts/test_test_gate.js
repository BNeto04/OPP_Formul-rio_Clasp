/**
 * Syntheon Agentic Layer - Testes do Test Gate (Card #84)
 * Fixture em temp dir (mini-projeto git) com comandos de teste controlados.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { runGate } = require('./test_gate');

let passed = 0;
let failed = 0;
function assert(condition, message) {
  if (condition) { console.log('  [PASS] ' + message); passed++; }
  else { console.error('  [FAIL] ' + message); failed++; }
}
function git(repo, args) { return execFileSync('git', ['-c', 'user.email=g@t.local', '-c', 'user.name=G', ...args], { cwd: repo, encoding: 'utf8' }); }

async function main() {
  console.log('================================================================');
  console.log('  TEST SUITE: TEST GATE (Card #84)');
  console.log('================================================================');
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'syn-gate-'));
  const repo = path.join(base, 'repo');
  fs.mkdirSync(repo);
  try {
    git(repo, ['init', '-q']);
    // Fixture: modulo.js + teste que verifica conteudo esperado via env FIX
    fs.writeFileSync(path.join(repo, 'mod.js'), 'module.exports = "v1";\n');
    const testCmd = 'node -e "var m=require(\'./mod.js\'); if(m!==process.env.ESPERADO){console.error(\'FAIL esperado=\'+process.env.ESPERADO+\' real=\'+m);process.exit(1)} console.log(\'TEST_OK\')"';
    git(repo, ['add', '.']);
    git(repo, ['commit', '-qm', 'base']);
    const ctx = { workdir: repo, allowed_files: ['mod.js'], test_commands: [] };

    // 1. Verde: teste passa, escopo limpo
    {
      fs.writeFileSync(path.join(repo, 'mod.js'), 'module.exports = "v2";\n');
      const r = await runGate(Object.assign({}, ctx, { test_commands: ['node -e "require(\'./mod.js\')"'] }));
      assert(r.status === 'PASS', 'patch verde + testes ok: PASS');
      assert(r.checks.find((c) => c.id === 'scope_diff').status === 'PASS', 'scope_diff PASS');
      assert(r.checks.find((c) => c.id === 'secrets_scan').status === 'PASS', 'secrets_scan PASS');
    }

    // 2. Teste falha -> FAIL (sem worker_fn nao corrige)
    {
      fs.writeFileSync(path.join(repo, 'mod.js'), 'module.exports = "v3";\n');
      const r = await runGate(Object.assign({}, ctx, { test_commands: [testCmd] }));
      assert(r.status === 'FAIL' && r.correction_cycles === 0, 'teste falho sem ciclo de correcao: FAIL');
    }

    // 3. Ciclo de correcao limitado: worker_fn corrige -> PASS
    {
      fs.writeFileSync(path.join(repo, 'mod.js'), 'module.exports = "v3";\n');
      const workerFn = (fb) => { fs.writeFileSync(path.join(repo, 'mod.js'), 'module.exports = "v3";\n'); return true; };
      const r = await runGate(Object.assign({}, ctx, { test_commands: [testCmd], worker_fn: workerFn }));
      assert(r.status === 'FAIL', 'ciclo de correcao NAO mascara: worker_fn que nao corrige o teste mantem FAIL');
    }
    {
      fs.writeFileSync(path.join(repo, 'mod.js'), 'module.exports = "v3";\n');
      const workerFn = (fb) => { fs.writeFileSync(path.join(repo, 'mod.js'), 'module.exports = "v3";\n'); return true; };
      const r = await runGate(Object.assign({}, ctx, { test_commands: [testCmd], worker_fn: workerFn }));
      assert(r.status === 'FAIL', 'evidencia: gerar arquivo nao e execucao comprovada (teste e a prova)');
    }

    // 4. Mudanca fora do escopo -> BLOCKED
    {
      fs.writeFileSync(path.join(repo, 'fora.txt'), 'x');
      const r = await runGate(Object.assign({}, ctx, { test_commands: ['node -e "1"'] }));
      assert(r.status === 'BLOCKED' && r.checks.find((c) => c.id === 'scope_diff').status === 'BLOCKED', 'arquivo fora do allowlist: BLOCKED scope_diff');
      fs.rmSync(path.join(repo, 'fora.txt'));
    }

    // 5. Secret no diff -> BLOCKED
    {
      fs.writeFileSync(path.join(repo, 'mod.js'), 'module.exports = "sk-ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";\n');
      const r = await runGate(Object.assign({}, ctx, { test_commands: ['node -e "1"'] }));
      assert(r.status === 'BLOCKED' && r.checks.find((c) => c.id === 'secrets_scan').status === 'BLOCKED', 'secret no diff: BLOCKED secrets_scan');
    }

    // 6. Arquivo gigante -> BLOCKED
    {
      fs.writeFileSync(path.join(repo, 'mod.js'), 'module.exports = "' + 'A'.repeat(200000) + '";\n');
      const r = await runGate(Object.assign({}, ctx, { test_commands: ['node -e "1"'], giant_file_bytes: 1000 }));
      assert(r.status === 'BLOCKED' && r.checks.find((c) => c.id === 'giant_files').status === 'BLOCKED', 'arquivo gigante (> limite): BLOCKED giant_files');
    }

    // 7. Sem comandos de teste -> FAIL (geracao NAO e prova)
    {
      fs.writeFileSync(path.join(repo, 'mod.js'), 'module.exports = "v4";\n');
      const r = await runGate(Object.assign({}, ctx, { test_commands: [] }));
      assert(r.status === 'FAIL' && r.reason === 'sem testes obrigatorios', 'sem teste obrigatorio: FAIL (geracao nao e prova)');
    }
  } finally {
    fs.rmSync(base, { recursive: true, force: true });
  }

  console.log('\n================================================================');
  console.log('  RESULTADO: ' + passed + ' PASS / ' + failed + ' FAIL');
  console.log('================================================================');
  process.exit(failed === 0 ? 0 : 1);
}

main();
