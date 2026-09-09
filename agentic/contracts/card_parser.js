/**
 * Syntheon Agentic Layer - Parser deterministico de card executavel (Canteiro A02)
 * Cards: #80 (template) / #82 (dispatcher) - modulo compartilhado.
 * Convencao: metadados 'CHAVE: valor' (bullets no topo) + blocos '## CHAVE' ate o proximo.
 */

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

const META_FIELD = {
  TASK_ID: 'task_id', PARENT: 'parent', PRIORIDADE: 'prioridade', BRANCH: 'branch',
  OWNER_DECISION_REQUIRED: 'owner_decision_required', CLASP_REQUIRED_RULE: 'clasp_rule', RESULT_SCHEMA: 'result_schema'
};

function validateCard(card) {
  const missing = [];
  for (const k of REQUIRED_META) if (!card[META_FIELD[k]]) missing.push(k);
  for (const s of REQUIRED_SECTIONS) {
    if (s === 'ENDERECO_DOWN_PLANT') { if (!card.endereco) missing.push(s); }
    else if (s === 'ARQUIVOS_ALVO') { if (!card.alvo.length) missing.push(s); }
    else if (s === 'ARQUIVOS_PROIBIDOS') { if (!card.proibidos.length) missing.push(s); }
    else if (s === 'OBJETIVO') { if (!card.objetivo) missing.push(s); }
    else if (s === 'CONTEXTO_MINIMO') { if (!card.contexto) missing.push(s); }
    else if (s === 'CONTRATOS_IMPORTS') { /* opcional por template */ }
    else if (s === 'PASSO_A_PASSO') { if (!card.passos) missing.push(s); }
    else if (s === 'CRITERIOS_DE_ACEITE') { if (!card.criterios) missing.push(s); }
    else if (s === 'TESTES_OBRIGATORIOS') { if (!card.testes) missing.push(s); }
    else if (s === 'EFEITOS_COLATERAIS_PERMITIDOS') { if (!card.efeitos.length) missing.push(s); }
  }
  return { valid: missing.length === 0, missing };
}

module.exports = { parseCard, validateCard, REQUIRED_META, REQUIRED_SECTIONS };
