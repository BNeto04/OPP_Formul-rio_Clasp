/**
 * Syntheon Agentic Layer - Secret Protection Test
 * Card: #70 T-A01-PROVIDERS-002
 *
 * Valida:
 * 1. .gitignore protege efetivamente arquivos de ambiente e runtime (.env, .env.*, venv, node_modules).
 * 2. .env.example permanece rastreavel e versionavel.
 * 3. Nenhum arquivo de credencial ou chave esta rastreado no indice Git (git ls-files).
 * 4. Deteccao segura de presenca/ausencia de chaves sem exposicao de valores.
 */

const { execSync } = require('child_process');
const path = require('path');

function runCheck(name, fn) {
  process.stdout.write(`[CHECK] ${name}... `);
  try {
    const result = fn();
    if (result.pass) {
      console.log(`PASS (${result.detail || 'OK'})`);
      return true;
    } else {
      console.log(`FAIL (${result.detail || 'Erro'})`);
      return false;
    }
  } catch (e) {
    console.log(`ERROR (${e.message})`);
    return false;
  }
}

let allPassed = true;

console.log('=== SYNTHEON AGENTIC LAYER - SECRET PROTECTION AUDIT ===\n');

// 1. Validar git check-ignore em caminhos de segredo
allPassed = runCheck('Ignorar .env real e variantes sensiveis', () => {
  const sensitive = ['.env', '.env.local', 'custom.env', 'agentic/.env', 'venv/lib', 'node_modules/pkg'];
  for (const p of sensitive) {
    try {
      const out = execSync(`git check-ignore "${p}"`, { encoding: 'utf8' }).trim();
      if (!out) return { pass: false, detail: `Arquivo ${p} NAO esta sendo ignorado pelo git` };
    } catch (e) {
      return { pass: false, detail: `Falha ao testar ignore de ${p}: exit code diferente de 0` };
    }
  }
  return { pass: true, detail: 'Todos os caminhos sensiveis devidamente ignorados' };
}) && allPassed;

// 2. Validar que .env.example NAO e ignorado
allPassed = runCheck('Preservar .env.example e agentic/.env.example para versionamento', () => {
  const examples = ['.env.example', 'agentic/.env.example'];
  for (const p of examples) {
    try {
      execSync(`git check-ignore "${p}"`, { encoding: 'utf8' });
      // Se exit code 0, significa que FOI ignorado (o que e um erro para .example)
      return { pass: false, detail: `${p} foi ignorado indevidamente pelo git` };
    } catch (e) {
      // Exit code 1 significa NOT ignored, que e o esperado para excecao !.env.example
    }
  }
  return { pass: true, detail: 'Templates .example permanecem versionaveis' };
}) && allPassed;

// 3. Validar se ha algum .env ou arquivo de chave rastreado no Git
allPassed = runCheck('Varredura do indice Git (git ls-files) por credenciais rastreadas', () => {
  const trackedFiles = execSync('git ls-files', { encoding: 'utf8' }).split(/\r?\n/);
  const leaked = trackedFiles.filter(f => {
    const b = path.basename(f);
    if (b.endsWith('.example')) return false;
    return b === '.env' || b.startsWith('.env.') || b.endsWith('.token') || b.endsWith('.secret');
  });

  if (leaked.length > 0) {
    return { pass: false, detail: `Arquivos sensiveis rastreados: ${leaked.join(', ')}` };
  }
  return { pass: true, detail: `${trackedFiles.length} arquivos auditados; 0 secrets rastreados` };
}) && allPassed;

// 4. Inspecao segura de variaveis de ambiente
allPassed = runCheck('Inspecao de seguranca de chaves no ambiente (sem exibir valores)', () => {
  const keys = ['GEMINI_API_KEY', 'GROQ_API_KEY', 'OPENROUTER_API_KEY', 'DEEPSEEK_API_KEY'];
  const report = {};
  for (const k of keys) {
    const val = process.env[k];
    report[k] = (val && val.trim() !== '') ? 'PRESENTE' : 'AUSENTE';
  }
  return { pass: true, detail: JSON.stringify(report) };
}) && allPassed;

console.log('\n--- RESULTADO FINAL DO TESTE DE PROTECAO ---');
if (allPassed) {
  console.log('STATUS: PASS (Protecao de secrets 100% aderente ao card #70)');
  process.exit(0);
} else {
  console.log('STATUS: FAIL (Vulnerabilidades detectadas na protecao)');
  process.exit(1);
}