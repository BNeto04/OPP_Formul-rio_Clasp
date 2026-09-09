/**
 * Syntheon Agentic Layer - Testes do Template de Card Executavel (Card #80)
 * Verifica que o template e os 2 cards ficticios sao parseaveis deterministicamente
 * (metadados 'CHAVE: valor' no topo + blocos '## CHAVE') e suficientes sem contexto externo.
 */

const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) { console.log('  [PASS] ' + message); passed++; }
  else { console.error('  [FAIL] ' + message); failed++; }
}

const CONTRACTS = path.join(__dirname, '..', 'contracts');

// Parser deterministico (mesma convencao que o dispatcher #82 usara)
function parseCard(text) {
  const meta = {};
  const metaRe = /^-\s+(TASK_ID|PARENT|PRIORIDADE|BRANCH|OWNER_DECISION_REQUIRED|CLASP_REQUIRED_RULE|RESULT_SCHEMA):\s*(.+)$/gm;
  let m;
  while ((m = metaRe.exec(text)) !== null) {
    if (!meta[m[1]]) meta[m[1]] = m[2].trim();
  }
  const sections = {};
  const parts = text.split(/^##\s+(.+)$/m);
  for (let i = 1; i < parts.length; i += 2) {
    const title = parts[i].trim().toUpperCase();
    const body = (parts[i + 1] || '').trim();
    if (!sections[title]) sections[title] = body;
  }
  const listOf = (title) => {
    const b = sections[title] || '';
    return b.split('\n').filter((l) => /^-\s+/.test(l.trim())).map((l) => l.trim().replace(/^-\s+/, ''));
  };
  const firstLine = (title) => {
    const b = sections[title] || '';
    const line = b.split('\n').map((l) => l.trim()).find((l) => l.length > 0);
    return line || '';
  };
  return {
    task_id: meta.TASK_ID || '',
    parent: meta.PARENT || '',
    prioridade: meta.PRIORIDADE || '',
    branch: meta.BRANCH || '',
    owner_decision_required: meta.OWNER_DECISION_REQUIRED || '',
    clasp_rule: meta.CLASP_REQUIRED_RULE || '',
    result_schema: meta.RESULT_SCHEMA || '',
    endereco: firstLine('ENDERECO_DOWN_PLANT'),
    alvo: listOf('ARQUIVOS_ALVO'),
    proibidos: listOf('ARQUIVOS_PROIBIDOS'),
    objetivo: firstLine('OBJETIVO'),
    contexto: firstLine('CONTEXTO_MINIMO'),
    imports: listOf('CONTRATOS_IMPORTS'),
    passos: (sections['PASSO_A_PASSO'] || '').split('\n').filter((l) => /^\s*\d+\./.test(l)).length,
    criterios: (sections['CRITERIOS_DE_ACEITE'] || '').split('\n').filter((l) => /\[ \]/.test(l)).length,
    testes: firstLine('TESTES_OBRIGATORIOS'),
    efeitos: listOf('EFEITOS_COLATERAIS_PERMITIDOS')
  };
}

const REQUIRED_META = ['TASK_ID', 'PARENT', 'PRIORIDADE', 'BRANCH', 'OWNER_DECISION_REQUIRED', 'CLASP_REQUIRED_RULE', 'RESULT_SCHEMA'];
const REQUIRED_SECTIONS = ['ENDERECO_DOWN_PLANT', 'ARQUIVOS_ALVO', 'ARQUIVOS_PROIBIDOS', 'OBJETIVO', 'CONTEXTO_MINIMO', 'CONTRATOS_IMPORTS', 'PASSO_A_PASSO', 'CRITERIOS_DE_ACEITE', 'TESTES_OBRIGATORIOS', 'EFEITOS_COLATERAIS_PERMITIDOS'];

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
}

// 4. Suficiencia: todos os campos obrigatorios preenchidos nos 2 cards ficticios
{
  for (const f of ['card_example_A.md', 'card_example_B.md']) {
    const p = parseCard(fs.readFileSync(path.join(CONTRACTS, 'examples', f), 'utf8'));
    const ok = p.task_id && p.parent && p.branch && p.owner_decision_required && p.endereco &&
      p.alvo.length > 0 && p.proibidos.length > 0 && p.objetivo && p.contexto && p.passos > 0 &&
      p.criterios > 0 && p.testes && p.efeitos.length > 0;
    assert(ok, f + ': card auto-suficiente (todos os campos obrigatorios preenchidos)');
  }
}

console.log('\n================================================================');
console.log('  RESULTADO: ' + passed + ' PASS / ' + failed + ' FAIL');
console.log('================================================================');
process.exit(failed === 0 ? 0 : 1);
