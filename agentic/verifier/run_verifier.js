/**
 * Syntheon Agentic Layer - Runner do Verifier (Colmeia H01)
 * Card: #96 H01-005
 *
 * Uso:
 *   node agentic/verifier/run_verifier.js \
 *     --claim claim.json --test test_result.json \
 *     --local local_evidence.json --git git_evidence.json
 *
 * Entradas: JSON tipados (claim/RESULT do Executor, resultado do Test Runner,
 * evidencias Local e Git dos sensores #95). Saida: verdict JSON em stdout.
 */

const fs = require('fs');
const { verify } = require('./verifier');

function readJson(file, label) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    console.error(`[VERIFIER] Falha ao ler ${label} (${file}): ${e.message}`);
    process.exit(2);
  }
}

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--claim') args.claim = argv[++i];
    else if (a === '--test') args.test = argv[++i];
    else if (a === '--local') args.local = argv[++i];
    else if (a === '--git') args.git = argv[++i];
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv);
  const required = ['claim', 'test', 'local', 'git'];
  const missing = required.filter((k) => !args[k]);
  if (missing.length) {
    console.error('[VERIFIER] Uso: --claim <json> --test <json> --local <json> --git <json>');
    console.error('[VERIFIER] Faltando: ' + missing.join(', '));
    process.exit(2);
  }
  const result = verify({
    claim: readJson(args.claim, 'claim'),
    testResult: readJson(args.test, 'test_result'),
    local: readJson(args.local, 'local_evidence'),
    git: readJson(args.git, 'git_evidence')
  });
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  process.exit(result.verdict === 'VERIFIED' ? 0 : 1);
}

main();
