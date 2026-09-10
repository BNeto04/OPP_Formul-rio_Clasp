'use strict';
/**
 * FERRAMENTA (nao vai para o Apps Script; scripts/ esta no .claspignore)
 * Varredura exaustiva do dominio para reconciliacao da ARCA (G01 #128 ARCA-FIX-005).
 * Uso: node scripts/varredura_dominio.js [--json]
 */

const fs = require('fs');
const path = require('path');

const REPO = path.join(__dirname, '..');

// Universo relevante de dominio (o resto e dependencia/infra/gerado e deve ser registrado como excluido)
const INCLUIR_RAIZ = ['.js'];
const PASTAS_DOMINIO = ['Core', 'Dominio', 'Entrada', 'Features', 'Leitura', 'Modelos', 'Motor', 'Plugins', 'Render', 'Schemas', 'Temas', 'Testes'];
const EXCLUIDAS = [
  { padrao: /(^|\/)\.git\//, motivo: 'controle de versao' },
  { padrao: /(^|\/)node_modules\//, motivo: 'dependencias' },
  { padrao: /^agentic\//, motivo: 'camada de desenvolvimento agentic (nao e dominio do produto)' },
  { padrao: /^scripts\//, motivo: 'ferramentas de desenvolvimento' },
  { padrao: /^VigiaPonte\//, motivo: 'infraestrutura das pontes' },
  { padrao: /^ponte1_telegram_chatgpt\//, motivo: 'infraestrutura das pontes' },
  { padrao: /^ponte2_chatgpt_gravity\//, motivo: 'infraestrutura das pontes' },
  { padrao: /^extension(_outbound)?\//, motivo: 'extensoes de navegador (infra)' },
  { padrao: /^Homologacao\//, motivo: 'saida de homologacao' },
  { padrao: /^planta\//, motivo: 'saida grafica' },
  { padrao: /^scratch\//, motivo: 'rascunho' },
  { padrao: /^02_Comodos\//, motivo: 'documentacao Down Plant' },
  { padrao: /^06_Inventario\//, motivo: 'documentacao' },
  { padrao: /^01_Planta\//, motivo: 'canvas/planta' },
  { padrao: /\.(json|md|canvas|log|env|example|txt|py|html)$/, motivo: 'nao-JS de dominio (catalogos/estado/docs)' },
  { padrao: /\.env/, motivo: 'segredos' }
];

function deveExcluir(rel) {
  for (const e of EXCLUIDAS) if (e.padrao.test(rel)) return e.motivo;
  return null;
}

function* walk(dir, base) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(base, full).replace(/\\/g, '/');
    if (entry.isDirectory()) { yield* walk(full, base); } else yield rel;
  }
}

const todos = [...walk(REPO, REPO)];
const excluidosPorMotivo = {};
let varridos = [];
todos.forEach(rel => {
  const motivo = deveExcluir(rel) || (rel.includes('/') ? null : (INCLUIR_RAIZ.some(x => rel.endsWith(x)) ? null : 'nao-JS raiz'));
  if (motivo) {
    excluidosPorMotivo[motivo] = (excluidosPorMotivo[motivo] || 0) + 1;
  } else {
    varridos.push(rel);
  }
});

// Inventario de regras: metodos de validacao/classificacao/normalizacao por arquivo
const PADRAO_REGRA = /\bstatic\s+(validar|classificar|detectar|normalizar|processar|resolver|calcular|acumular|montar|desambiguar|localizar|limpar|converter)[A-Za-z0-9_]*\s*\(/g;
const inventario = {};
varridos.filter(f => !f.startsWith('Testes/')).forEach(f => {
  const src = fs.readFileSync(path.join(REPO, f), 'utf8');
  const metodos = [...new Set([...src.matchAll(PADRAO_REGRA)].map(m => m[0].replace(/\s*\($/, '').replace(/^static\s+/, '')))];
  const codigos = [...new Set([...src.matchAll(/codigoRegra:\s*'([A-Z0-9_]+)'/g)].map(m => m[1]))];
  if (metodos.length || codigos.length) inventario[f] = { metodos, codigos };
});

// Cruzamento com a ARCA
const arca = JSON.parse(fs.readFileSync(path.join(REPO, 'Dominio/ARCA/arca_regras_dominio.json'), 'utf8'));
const evidencias = new Set();
arca.regras.forEach(r => (r.evidencia_codigo || []).forEach(e => evidencias.add(String(e).split(':')[0].trim())));
const arquivosArca = new Set(arca.regras.map(r => (r.evidencia_codigo || []).map(e => String(e).split(':')[0].trim())).flat());

const lacunas = [];
Object.keys(inventario).forEach(f => {
  if (!arquivosArca.has(f)) {
    lacunas.push({ arquivo: f, metodos: inventario[f].metodos.slice(0, 6), codigos: inventario[f].codigos });
  }
});

const saida = {
  universo: {
    arquivos_totais_repo: todos.length,
    arquivos_varridos: varridos.length,
    arquivos_excluidos: todos.length - varridos.length,
    excluidos_por_motivo: excluidosPorMotivo
  },
  arca: { regras: arca.regras.length, arquivos_com_evidencia: arquivosArca.size },
  arquivos_de_dominio_sem_regra_arca: lacunas,
  resumo: {
    arquivos_de_dominio_inventariados: Object.keys(inventario).length,
    lacunas_de_catalogo: lacunas.length
  }
};

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(saida, null, 2));
} else {
  console.log('=== VARREDURA EXAUSTIVA DE DOMINIO (G01 #128) ===');
  console.log(`Arquivos totais no repo: ${saida.universo.arquivos_totais_repo}`);
  console.log(`Varridos (dominio JS):    ${saida.universo.arquivos_varridos}`);
  console.log(`Excluidos:                ${saida.universo.arquivos_excluidos}`);
  console.log('Exclusoes por motivo:');
  Object.entries(excluidosPorMotivo).sort((a, b) => b[1] - a[1]).forEach(([m, n]) => console.log(`  ${String(n).padStart(5)}  ${m}`));
  console.log(`\nARCA: ${saida.arca.regras} regras | ${saida.arca.arquivos_com_evidencia} arquivos com evidencia`);
  console.log(`Dominio inventariado: ${saida.resumo.arquivos_de_dominio_inventariados} arquivos`);
  console.log(`Lacunas de catalogo (arquivo de dominio sem regra ARCA): ${saida.resumo.lacunas_de_catalogo}`);
  lacunas.forEach(l => console.log(`  - ${l.arquivo} | metodos: ${l.metodos.join(', ')}${l.codigos.length ? ' | codigos: ' + l.codigos.join(', ') : ''}`));
}
