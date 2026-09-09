/**
 * Syntheon Agentic Layer - Testes do Template de Card Executavel (Card #80)
 * Usa o parser compartilhado agentic/contracts/card_parser.js (tambem usado pelo dispatcher #82).
 */

const fs = require('fs');
const path = require('path');
const { parseCard, validateCard, REQUIRED_META, REQUIRED_SECTIONS } = require('../contracts/card_parser');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) { console.log('  [PASS] ' + message); passed++; }
  else { console.error('  [FAIL] ' + message); failed++; }
}

const CONTRACTS = path.join(__dirname, '..', 'contracts');

console.log('================================================================');
console.log('  TEST SUITE: TEMPLATE DE CARD EXECUTAVEL (Card #80)');
console.log('================================================================');

// 1. Template contem todas as chaves obrigatorias
{
  const raw = fs.readFileSync(path.join(CONTRACTS, 'issue_template.md'), 'utf8');
  const missingMeta = REQUIRED_META.filter((k) => !new RegExp('^-\\s+' + k + ':', 'm').test(raw));
  const missingSec = REQUIRED_SECTIONS.filter((s) => !new RegExp('^##\\s+' + s + '$', 'm').test(raw));
  assert(missingMeta.length === 0, 'template com todas as chaves de metadado (faltando: ' + missingMeta.join(',') + ')');
  assert(missingSec.length === 0, 'template com todas as secoes obrigatorias (faltando: ' + missingSec.join(',') + ')');
  assert(raw.includes('EX-001') && raw.includes('caminho/relativo'), 'template (nao preenchido) mantem placeholders, sem falsos positivos de card preenchido');
}

// 2. Card ficticio A: 1 arquivo, sem OWNER_DECISION
{
  const p = parseCard(fs.readFileSync(path.join(CONTRACTS, 'examples', 'card_example_A.md'), 'utf8'));
  assert(p.task_id === 'EX-A-001', 'A: TASK_ID parseado');
  assert(p.parent === 'nenhum', 'A: PARENT parseado');
  assert(p.branch === 'sprint/h01-colmeia-api-001', 'A: BRANCH parseado');
  assert(p.owner_decision_required === 'NAO', 'A: OWNER_DECISION_REQUIRED=NAO');
  assert(p.alvo.length === 1 && p.alvo[0] === 'agentic/state/exemplo_a.txt', 'A: ARQUIVOS_ALVO com 1 arquivo');
  assert(p.proibidos.some((f) => f === '.env*') && p.proibidos.some((f) => f.includes('providers.json')), 'A: ARQUIVOS_PROIBIDOS parseados');
  assert(p.testes === 'node agentic/scripts/test_exemplo_a.js', 'A: TESTES_OBRIGATORIOS (comando unico em linha)');
  assert(p.criterios >= 1 && p.passos >= 1, 'A: criterios e passos contados');
  assert(p.efeitos.length === 1 && p.efeitos[0] === 'nenhum', 'A: efeitos colaterais permitidos declarados');
  const v = validateCard(p);
  assert(v.valid === true, 'A: validacao de schema OK');
}

// 3. Card ficticio B: multiplos arquivos + OWNER_DECISION
{
  const p = parseCard(fs.readFileSync(path.join(CONTRACTS, 'examples', 'card_example_B.md'), 'utf8'));
  assert(p.task_id === 'EX-B-002', 'B: TASK_ID parseado');
  assert(p.parent === '#999', 'B: PARENT com numero de Issue');
  assert(p.owner_decision_required === 'SIM', 'B: OWNER_DECISION_REQUIRED=SIM');
  assert(p.alvo.length === 2, 'B: multiplos arquivos representados (2 itens)');
  assert(p.proibidos.includes('.git/'), 'B: .git/ proibido');
  assert(p.imports.length === 2, 'B: contratos/imports referenciados');
  assert(p.endereco === 'agentic/state/', 'B: ENDERECO_DOWN_PLANT parseado');
  assert(validateCard(p).valid === true, 'B: validacao de schema OK');
}

// 4. Suficiencia: ambos os cards ficticios passam na validacao
{
  for (const f of ['card_example_A.md', 'card_example_B.md']) {
    const p = parseCard(fs.readFileSync(path.join(CONTRACTS, 'examples', f), 'utf8'));
    const v = validateCard(p);
    assert(v.valid, f + ': card auto-suficiente (validacao completa)');
  }
}

console.log('\n================================================================');
console.log('  RESULTADO: ' + passed + ' PASS / ' + failed + ' FAIL');
console.log('================================================================');
process.exit(failed === 0 ? 0 : 1);
