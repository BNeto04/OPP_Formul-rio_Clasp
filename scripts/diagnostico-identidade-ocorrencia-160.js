'use strict';
/**
 * ARQUIVO: scripts/diagnostico-identidade-ocorrencia-160.js
 * DESCRICAO: Roda os DOIS diagnosticos de identidade unitaria da ocorrencia (ARCA-OCORRENCIA-007 /
 *            card #160 GUARD-D7-001) contra os DOIS casos REAIS medidos na planilha OCORRENCIAS:
 *              (a) JUN2026 — mesmo MIKE + mesmo BOE em DUAS DATAS  -> OCORRENCIA_FRAGMENTADA_POR_DATA
 *              (b) JAN2026 — mesmo BOE com o MIKE em DOIS FORMATOS -> MIKE_FORMATO_NAO_CANONICO_OU_DUPLICADO
 *
 * LEITURA SOMENTE-LEITURA: este script NAO abre a planilha, NAO escreve nada e NAO corrige dado algum.
 * Ele consome um SNAPSHOT JSON ja extraido por leitura read-only (ver cabecalho do fixture) e roda o
 * MOTOR REAL do Guardiao (Features/GuardiaoQualidade.js -> Core/RegrasQualidade.js) sobre essas linhas,
 * reaproveitando a fabrica de mock do proprio TestGuardiao (nada de leitor novo, nada de mock paralelo).
 *
 * Uso (da raiz do repo):
 *   node scripts/diagnostico-identidade-ocorrencia-160.js
 *   node scripts/diagnostico-identidade-ocorrencia-160.js Testes/Fixtures/casos_reais_160.json
 *
 * Exit code: 0 = os dois casos acusaram exatamente o que se esperava; 1 = divergencia (o script diz qual).
 */

const fs = require('fs');
const path = require('path');

const REPO = path.join(__dirname, '..');

// --- Globais exigidos pelo Guardiao (mesma ordem do TestGuardiao) -----------------------------
const UtilsMod = require(path.join(REPO, 'Core', 'Utils'));
global.SyntheonUtils = UtilsMod.SyntheonUtils || UtilsMod;
global.CONSTANTES_SYNTHEON = require(path.join(REPO, 'Core', 'Constantes'));

const { RegrasQualidade, SEVERIDADES_GUARDIAO } = require(path.join(REPO, 'Core', 'RegrasQualidade'));
global.RegrasQualidade = RegrasQualidade;
global.SEVERIDADES_GUARDIAO = SEVERIDADES_GUARDIAO;

global.RendererAuditoriaSaude = require(path.join(REPO, 'Render', 'RendererAuditoriaSaude'));
global.GuardiaoQualidade = require(path.join(REPO, 'Features', 'GuardiaoQualidade'));

/**
 * A fabrica de mock vive DENTRO do TestGuardiao (nao exportada). Extraimos por balanceamento de
 * chaves e instanciamos com `new Function` — reusar a fabrica provada evita um mock paralelo que
 * divergiria do motor real.
 */
function extrairCriarMockSheet() {
  const fonte = fs.readFileSync(path.join(REPO, 'Testes', 'TestGuardiao.js'), 'utf8');
  const inicio = fonte.indexOf('function criarMockSheet(');
  if (inicio === -1) throw new Error('criarMockSheet nao encontrada em Testes/TestGuardiao.js');
  let nivel = 0;
  let i = fonte.indexOf('{', inicio);
  for (; i < fonte.length; i++) {
    if (fonte[i] === '{') nivel++;
    else if (fonte[i] === '}') { nivel--; if (nivel === 0) { i++; break; } }
  }
  return new Function('return (' + fonte.slice(inicio, i) + ')')();
}

// Mesmo cabecalho usado pelos testes do Guardiao (as colunas de identidade sao DATA/MIKE/BOE).
const HEADERS = [
  'DATA', 'QTD O', 'NÚMERO MIKE', 'BOE', 'GRAD', 'MATRÍCULA', 'POLICIAL', 'ARMAS', 'OCORRÊNCIA PIP',
  'IMPUTADO?', 'TOTAL DE MACONHA', 'DIVIDIDO MAC', 'TOTAL CRACK', 'TOTAL DE COCAINA', 'DIVIDIDO COC',
  'PONTOS TOTAIS', 'PONTOS FICCAO', 'CHAVE OCORRENCIA', 'ALERTA INTEGRIDADE'
];
const CODES_IDENTIDADE = ['OCORRENCIA_FRAGMENTADA_POR_DATA', 'MIKE_FORMATO_NAO_CANONICO_OU_DUPLICADO'];

function linhaDaFixture(l) {
  return [
    l.data, '', l.mike, l.boe, '', '', '', 0, '', '',
    0, 0, 0, 0, 0, 0, 0,
    l.data + '|' + l.mike + '|' + l.boe, // coluna Chave Ocorrencia (DATA|MIKE|BOE), como a planilha materializa
    ''
  ];
}

function main(caminhoSnapshot) {
  const snap = JSON.parse(fs.readFileSync(caminhoSnapshot, 'utf8'));
  const criarMockSheet = extrairCriarMockSheet();

  console.log('====================================================');
  console.log('DIAGNOSTICO DE IDENTIDADE DA OCORRENCIA — ARCA-OCORRENCIA-007 (#160 GUARD-D7-001)');
  console.log('Leitura SOMENTE-LEITURA: planilha nao e aberta; snapshot de', snap.proveniencia.medido_em);
  console.log('====================================================\n');

  let ok = true;
  let totalNovos = 0;

  snap.casos.forEach(caso => {
    // Reproduz o bloco do JEITO que ele esta na aba: linhas em branco antes e entre os buracos,
    // para que o numero de LINHA emitido pelo Guardiao seja o numero REAL da linha na planilha.
    const ultimaLinha = caso.linhas[caso.linhas.length - 1].linha;
    const vazio = () => HEADERS.map(() => '');
    const porLinha = {};
    caso.linhas.forEach(l => { porLinha[l.linha] = linhaDaFixture(l); });
    const linhas = [];
    for (let linha = 2; linha <= ultimaLinha; linha++) {
      linhas.push(porLinha[linha] || vazio());
    }
    const formulas = linhas.map(() => HEADERS.map(() => ''));
    const sheet = criarMockSheet(HEADERS, linhas, formulas);
    const resultado = global.GuardiaoQualidade.varrerAba(sheet);

    const diags = resultado.diagnosticos.filter(d => CODES_IDENTIDADE.indexOf(d.codigoRegra) !== -1);
    totalNovos += diags.length;

    console.log(`--- ${caso.card_ref} | aba ${caso.aba} — ${caso.titulo}`);
    console.log(`    linhas reais do bloco: ${caso.linhas.map(l => l.linha).join(', ')}`);
    console.log(`    esperado: ${caso.esperado.join(', ')}`);

    if (!diags.length) {
      console.log('    >> NENHUM diagnostico de identidade. DIVERGENCIA.\n');
      ok = false;
      return;
    }

    diags.forEach(d => {
      console.log(`    [${d.codigoRegra}] ${d.severidade} | linha ${d.linha} | ${d.arca && d.arca.rule_id ? d.arca.rule_id : '(ARCA nao enriquecido)'}`);
      console.log(`      mensagem: ${d.diagnostico}`);
      console.log(`      evidencia: ${d.evidencia}`);
      console.log(`      acao: ${d.acaoRecomendada}`);
    });

    const codigos = Array.from(new Set(diags.map(d => d.codigoRegra))).sort();
    const esperados = caso.esperado.slice().sort();
    const codigoOk = codigos.length === esperados.length && codigos.every((c, k) => c === esperados[k]);
    if (!codigoOk) {
      console.log(`    >> codigos emitidos ${codigos.join(', ')} != esperado ${esperados.join(', ')}. DIVERGENCIA.`);
      ok = false;
    } else {
      console.log(`    >> OK: ${diags.length} diagnostico(s) — apenas o(s) codigo(s) esperado(s).`);
    }
    console.log('');
  });

  console.log('====================================================');
  console.log(`TOTAL de diagnosticos de identidade emitidos nos 2 casos reais: ${totalNovos}`);
  console.log(ok ? 'RESULTADO: os dois casos reais foram detectados e apontados (linha + celula).' : 'RESULTADO: DIVERGENCIA — ver acima.');
  console.log('Nenhum dado foi corrigido: o Guardiao apenas detecta, explica e aponta.');
  console.log('====================================================');

  process.exit(ok ? 0 : 1);
}

const alvo = process.argv[2]
  ? path.resolve(process.cwd(), process.argv[2])
  : path.join(REPO, 'Testes', 'Fixtures', 'casos_reais_160.json');

if (!fs.existsSync(alvo)) {
  console.error('Snapshot nao encontrado: ' + alvo);
  process.exit(1);
}
main(alvo);
