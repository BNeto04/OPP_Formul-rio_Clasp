'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/TestSerializacaoEscrita.js
 * CARD:    #164 [DP24-003] — FECHADURA da serializacao de escrita (INST-SERIALIZACAO-001).
 *
 * O que esta fechadura impede (medido em `DIAGNOSTICO_164_CONCORRENCIA.md`):
 *   (a) qualquer entrypoint mutante escrever SEM a trava global de escrita — a corrida reproduzida
 *       nos 9 itens do diagnostico volta a ser possivel;
 *   (b) duas escritas concorrentes: o cenario de MAIOR severidade e EntradaManual/BO, em que dois
 *       operadores escolhem a MESMA linha livre e o BO de um deles DESAPARECE sem erro (§2.4);
 *   (c) trava DECORATIVA: pega o lock e escreve de qualquer jeito (caso fail-closed);
 *   (d) deadlock de reentrancia (menu -> funcao interna) ou trava presa ao fim de uma excecao;
 *   (e) idempotencia vazia: reentrega da MESMA operacao duplicando gravacao;
 *   (f) o item `race_condition` das 9 Portas voltar a `pendente` (anti-ornamento), e as citacoes
 *       `arquivo:linha` das justificativas apontarem para lugar nenhum (§1.3 do diagnostico).
 *
 * Como prova: carrega o codigo de PRODUTO real em DUAS execucoes isoladas (`vm.createContext`
 * distintas, como no Apps Script, onde cada execucao tem escopo global proprio) que compartilham a
 * MESMA planilha e o MESMO `LockService` — exatamente a topologia da corrida real. O intercalamento
 * e deterministico: a execucao B e disparada no instante em que A grava a primeira celula.
 *
 * Se qualquer ponto divergir, este teste FICA VERMELHO (exit 1).
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const REPO = path.join(__dirname, '..');
const INST = path.join('02_Comodos', 'C00_Governanca_Estrutural', '03_Especificacoes',
  'INSTALACOES_TRANSVERSAIS', 'INST-SERIALIZACAO-001_ESCRITA_GLOBAL.md');

let sucessos = 0;
let falhas = 0;
function test(nome, fn) {
  try { fn(); console.log(`  [PASS] ${nome}`); sucessos++; }
  catch (err) { console.error(`  [FAIL] ${nome}: ${err.message}`); falhas++; }
}

console.log('=== TESTES: SERIALIZACAO DE ESCRITA (INST-SERIALIZACAO-001 / #164 DP24-003) ===\n');

// ---------------------------------------------------------------------------
// 1. ESTRUTURAL — nenhuma escrita sem trava (fonte do produto, entrypoint a entrypoint)
// ---------------------------------------------------------------------------
console.log('1) Estrutural: a trava global e adquirida ANTES da primeira escrita, por entrypoint');

/**
 * Extrai o corpo de uma funcao/metodo a partir da linha de declaracao, ate o fechamento do bloco.
 * Varredura por profundidade de chaves, ignorando strings, template literals e comentarios — o
 * fechamento e a chave que devolve a profundidade a zero.
 */
function corpoDaFuncao(fonte, declaracao) {
  const src = fonte.replace(/\r\n/g, '\n');
  const linhas = src.split('\n');
  const i = linhas.findIndex(l => l.indexOf(declaracao) !== -1);
  if (i === -1) return null;
  const inicio = linhas.slice(0, i).join('\n').length + (i === 0 ? 0 : 1);
  let p = src.indexOf('{', inicio);
  if (p === -1) return null;
  let depth = 0;
  let estado = null; // null | "'" | '"' | '`' | '//' | '/*'
  for (let k = p; k < src.length; k++) {
    const c = src[k];
    const d = src[k + 1];
    if (estado === '//') { if (c === '\n') estado = null; continue; }
    if (estado === '/*') { if (c === '*' && d === '/') { estado = null; k++; } continue; }
    if (estado === "'" || estado === '"' || estado === '`') {
      if (c === '\\') { k++; continue; }
      if (c === estado) estado = null;
      continue;
    }
    if (c === '/' && d === '/') { estado = '//'; k++; continue; }
    if (c === '/' && d === '*') { estado = '/*'; k++; continue; }
    if (c === "'" || c === '"' || c === '`') { estado = c; continue; }
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return src.slice(inicio, k + 1);
    }
  }
  return src.slice(inicio);
}

const PRODUTO = (rel) => fs.readFileSync(path.join(REPO, rel), 'utf8');

const ENTRYPOINTS = [
  // EntradaManual — o caso de MAIOR severidade (perda de BO)
  { arquivo: 'Entrada/EntradaManual.js', entrada: '_processarEntradaManual(payload, opcoes) {', escrita: 'gravarLinhasEntradaManual(' },
  { arquivo: 'Entrada/EntradaManual.js', entrada: 'function processarEntradaManual(payload) {', escrita: '_processarEntradaManual(' },
  // NormalizadorEfetivo — menu, headless e porta de teste
  { arquivo: 'Features/NormalizadorEfetivo.js', entrada: 'static executar(opcoes) {', escrita: '_executarSobTrava_(' },
  { arquivo: 'Features/NormalizadorEfetivo.js', entrada: 'function normalizarEfetivo() {', escrita: 'NormalizadorEfetivo.executar(' },
  { arquivo: 'Features/NormalizadorEfetivo.js', entrada: 'function normalizarEfetivoHeadless() {', escrita: 'NormalizadorEfetivo.executar(' },
  { arquivo: 'Features/NormalizadorEfetivo.js', entrada: 'function normalizarEfetivoTeste() {', escrita: 'NormalizadorEfetivo.executar(' },
  // Comparativo 2026 (menu + headless) e produtividade geral
  { arquivo: 'Features/CompiladorProdutividade.js', entrada: 'function gerarComparativo2026Premium(abasSelecionadas) {', escrita: 'gerarComparativo2026PremiumSobTrava_(' },
  { arquivo: 'Features/CompiladorProdutividade.js', entrada: 'function gerarComparativo2026Headless(abas) {', escrita: 'gerarComparativo2026Premium(' },
  { arquivo: 'Features/CompiladorProdutividade.js', entrada: 'function iniciarCompiladorProdutividade(avancado) {', escrita: 'iniciarCompiladorProdutividadeSobTrava_(' },
  // Guardiao da Qualidade: ciclo (menu por aba, seletor de meses, headless)
  { arquivo: 'Features/GuardiaoQualidade.js', entrada: 'static varrerAba(sheet, fontePeculioExterna = null) {', escrita: '_varrerAbaSobTrava_(' },
  { arquivo: 'Features/GuardiaoQualidade.js', entrada: 'function executarGuardiaoQualidade() {', escrita: 'GuardiaoQualidade.varrerAba(' },
  { arquivo: 'Features/GuardiaoHeadless.js', entrada: 'executar: function (selecaoTexto, deps) {', escrita: '_executarSobTrava_(' },
  { arquivo: 'Features/GuardiaoHeadless.js', entrada: 'function executarGuardiaoHeadless(selecaoTexto) {', escrita: 'GuardiaoHeadless.executar(' },
  { arquivo: 'Entrada/SeletorMesesGuardiao.js', entrada: 'static auditarMeses(selecao, ss, motor) {', escrita: '_auditarMesesSobTrava_(' },
  { arquivo: 'Entrada/SeletorMesesGuardiao.js', entrada: 'function executarSelecaoGuardiao(selecionados) {', escrita: 'auditarMeses(' },
  { arquivo: 'Entrada/SeletorMesesGuardiao.js', entrada: 'function abrirSeletorMesesGuardiaoPorTexto() {', escrita: 'auditarMeses(' },
  // Escritas de Core/Logger.js (aba de log de NOME FIXO)
  { arquivo: 'Core/Logger.js', entrada: 'gravarPlanilha(nomeAbaLog, nomeAbaResultado) {', escrita: 'RendererAuditoria.render(' },
  // Compilador de Armas (menu livre, anual e headless)
  { arquivo: 'Compilador_Armas.js', entrada: 'function executarCompilador(mesesAlvo, modo) {', escrita: '_executarCompiladorSobTrava_(' },
  { arquivo: 'Compilador_Armas.js', entrada: 'function iniciarModoAnual() {', escrita: 'executarCompilador(' },
  { arquivo: 'Compilador_Armas.js', entrada: 'function processarMenuLivre(mesesSelecionados) {', escrita: 'executarCompilador(' },
  { arquivo: 'Compilador_Armas.js', entrada: 'function executarCompiladorArmasHeadless(mesesAlvo, modo) {', escrita: 'executarCompilador(' }
];

/** Confere, num par (fonte, entrypoint), que `executarComLock(` vem ANTES da escrita. */
function travaAntesDaEscrita(fonte, ep) {
  const corpo = corpoDaFuncao(fonte, ep.entrada);
  if (corpo === null) return { ok: false, motivo: `entrypoint nao localizado: ${ep.entrada}` };
  const iTrava = corpo.indexOf('executarComLock(');
  const iEscrita = corpo.indexOf(ep.escrita);
  if (iEscrita === -1) return { ok: false, motivo: `escrita '${ep.escrita}' nao encontrada no corpo (o teste perdeu o dente)` };
  if (iTrava === -1) return { ok: false, motivo: `entrypoint SEM trava global: ${ep.entrada}` };
  if (iTrava > iEscrita) return { ok: false, motivo: `trava DEPOIS da escrita em ${ep.entrada}` };
  return { ok: true, corpo };
}

test(`os ${ENTRYPOINTS.length} entrypoints mutantes adquirem a trava global antes da primeira escrita`, () => {
  const faltas = [];
  ENTRYPOINTS.forEach(ep => {
    const r = travaAntesDaEscrita(PRODUTO(ep.arquivo), ep);
    if (!r.ok) faltas.push(`${ep.arquivo} :: ${r.motivo}`);
  });
  assert.deepStrictEqual(faltas, [], JSON.stringify(faltas, null, 2));
});

test('CONTROLE NEGATIVO: removendo a trava de um entrypoint real, o MESMO conferidor acusa', () => {
  const ep = ENTRYPOINTS[0];
  const mutado = PRODUTO(ep.arquivo).replace(/SyntheonSerializacaoEscrita\.executarComLock\(/g, 'SEM_TRAVA_(');
  assert.notStrictEqual(mutado, PRODUTO(ep.arquivo), 'a copia mutada deve diferir da real');
  const r = travaAntesDaEscrita(mutado, ep);
  assert.ok(!r.ok && /SEM trava global/.test(r.motivo), `esperado RED, obtido: ${JSON.stringify(r)}`);
});

test('o helper e UM arquivo unico e nao cria funcao de topo duplicada entre arquivos enviados', () => {
  const arquivos = ['Entrada/EntradaManual.js', 'Features/NormalizadorEfetivo.js', 'Features/GuardiaoQualidade.js',
    'Features/GuardiaoHeadless.js', 'Features/CompiladorProdutividade.js', 'Entrada/SeletorMesesGuardiao.js',
    'Core/Logger.js', 'Compilador_Armas.js'];
  arquivos.forEach(rel => {
    const src = PRODUTO(rel);
    assert.ok(/SyntheonSerializacaoEscrita/.test(src), `${rel} deve referenciar o helper unico`);
    // nenhum arquivo consumidor define o helper (a definicao vive SO em Core/SerializacaoEscrita.js)
    assert.ok(!/function\s+SyntheonSerializacaoEscrita|class\s+SyntheonSerializacaoEscrita/.test(src),
      `${rel} nao pode REDEFINIR o helper (TestSemRedefinicaoGlobal)`);
  });
  assert.ok(fs.existsSync(path.join(REPO, 'Core', 'SerializacaoEscrita.js')), 'helper unico ausente');
});

// ---------------------------------------------------------------------------
// 2. MOCK de planilha + LockService compartilhado (topologia da corrida real)
// ---------------------------------------------------------------------------
const CABECALHOS = [
  "ORD", "DATA", "HORA", "QTD O", "MIKE", "NATUREZA DA OCORRÊNCIA", "BOE", "AIS", "CIDADE", "BAIRRO", "DETIDOS",
  "ARMA", "TIPO", "CALIBRE", "MODELO", "MUNIÇÃO",
  "MACONHA DOLAR", "MACONHA GRAMA", "TOTAL DE MACONHA", "DIVIDIDO MAC",
  "CRACK PEDRA", "CRACK GRAMA", "TOTAL CRACK (GR)",
  "COCAINA PINO", "COCAINA GRAMA", "TOTAL DE COCAINA", "DIVIDIDO COC",
  "PELOTÃO", "GRAD", "MATRÍCULA", "POLICIAL", "QDT ARMAS",
  "OCORRÊNCIA PIP", "IMPUTADO?", "PONTOS TOTAIS", "PONTOS FICÇÃO (1/4)", "CHAVE OCORRÊNCIA"
];
const COLUNAS_FORMULA = ["TOTAL DE MACONHA", "DIVIDIDO MAC", "TOTAL CRACK (GR)", "TOTAL DE COCAINA",
  "DIVIDIDO COC", "PONTOS TOTAIS", "PONTOS FICÇÃO (1/4)", "CHAVE OCORRÊNCIA"];

function a1Notation(row, col, nR, nC) {
  const letra = (c) => { let s = ''; let x = c - 1; do { s = String.fromCharCode(65 + (x % 26)) + s; x = Math.floor(x / 26) - 1; } while (x >= 0); return s; };
  const ini = letra(col) + row;
  return (nR > 1 || nC > 1) ? `${ini}:${letra(col + nC - 1)}${row + nR - 1}` : ini;
}

/** Planilha mensal mockada; TODA escrita fica registrada em `escritas` (compartilhada). */
function criarAbaMensal(registro) {
  const maxRows = 200;
  const matriz = [CABECALHOS.slice()];
  for (let r = 2; r <= maxRows; r++) {
    const linha = CABECALHOS.map(h => (COLUNAS_FORMULA.indexOf(h) !== -1 ? '=' + r : ''));
    matriz.push(linha);
  }
  const formulas = matriz.map(l => l.map(v => (String(v).startsWith('=') ? v : '')));

  const escrever = (row, col, vals) => {
    vals.forEach((linha, ri) => {
      if (!matriz[row - 1 + ri]) matriz[row - 1 + ri] = [];
      linha.forEach((v, ci) => { matriz[row - 1 + ri][col - 1 + ci] = v; });
    });
  };
  const ler = (row, col, nR, nC) => {
    const out = [];
    for (let i = 0; i < nR; i++) {
      const src = matriz[row - 1 + i] || [];
      const linha = [];
      for (let j = 0; j < nC; j++) linha.push(src[col - 1 + j] === undefined ? '' : src[col - 1 + j]);
      out.push(linha);
    }
    return out;
  };

  const criarRange = (row, col, nR, nC) => ({
    getRow: () => row,
    getColumn: () => col,
    getValues: () => ler(row, col, nR, nC),
    getFormulas: () => {
      const out = [];
      for (let i = 0; i < nR; i++) {
        const src = formulas[row - 1 + i] || [];
        const linha = [];
        for (let j = 0; j < nC; j++) linha.push(src[col - 1 + j] === undefined ? '' : src[col - 1 + j]);
        out.push(linha);
      }
      return out;
    },
    getFormula: () => (formulas[row - 1] && formulas[row - 1][col - 1]) || '',
    getDataValidations: () => Array.from({ length: nR }, () => Array.from({ length: nC }, () => null)),
    setValues: function (vals) {
      registro.escritas.push({ aba: 'AGO2026', op: 'setValues', a1: a1Notation(row, col, vals.length, (vals[0] || []).length), valores: vals });
      registro.hooks.aoEscrever(registro.escritas.length);
      escrever(row, col, vals);
      return this;
    },
    clearContent: function () {
      registro.escritas.push({ aba: 'AGO2026', op: 'clearContent', a1: a1Notation(row, col, nR, nC), valores: null });
      return this;
    },
    clear: function () { return this; },
    copyTo: function () { registro.escritas.push({ aba: 'AGO2026', op: 'copyTo', a1: a1Notation(row, col, nR, nC), valores: null }); return this; }
  });

  const aba = {
    getName: () => 'AGO2026',
    getLastRow: () => matriz.length,
    getLastColumn: () => CABECALHOS.length,
    getMaxRows: () => maxRows,
    getRange: (row, col, nR, nC) => {
      if (typeof row === 'string') {
        const m = /^([A-Z]+)(\d+):([A-Z]+)(\d+)$/.exec(row);
        const c = m[1].split('').reduce((acc, ch) => acc * 26 + (ch.charCodeAt(0) - 64), 0);
        return criarRange(parseInt(m[2], 10), c, parseInt(m[4], 10) - parseInt(m[2], 10) + 1, 1);
      }
      return criarRange(row, col, nR || 1, nC || 1);
    },
    insertRows: () => {},
    setFrozenRows: () => {},
    autoResizeColumns: () => {},
    __matriz: matriz
  };
  return aba;
}

/** `LockService` compartilhado pelas duas execucoes (no Apps Script a trava e do PROJETO). */
function criarLockServiceCompartilhado(registro) {
  const estado = { ocupado: false, tentativas: 0, concessoes: 0, liberacoes: 0 };
  const criar = () => ({
    tryLock: (ms) => {
      estado.tentativas++;
      registro.lockTentativas.push(ms);
      if (estado.ocupado) return false;
      estado.ocupado = true;
      estado.concessoes++;
      return true;
    },
    releaseLock: () => { estado.liberacoes++; estado.ocupado = false; }
  });
  return { getScriptLock: criar, getDocumentLock: criar, __estado: estado };
}

/** PropertiesService em memoria (dono/registro da trava e chave de replay das Armas). */
function criarPropertiesFake() {
  const store = {};
  return {
    getScriptProperties: () => ({
      getProperty: (k) => (k in store ? store[k] : null),
      setProperty: (k, v) => { store[k] = String(v); },
      deleteProperty: (k) => { delete store[k]; }
    }),
    __store: store
  };
}

/** Uma EXECUCAO isolada: contexto `vm` proprio (escopo global proprio, como no Apps Script). */
function criarExecucao(compartilhado, opcoes) {
  opcoes = opcoes || {};
  const sandbox = {
    console: { log: () => {}, warn: () => {}, error: () => {} },
    Logger: { log: () => {} },
    Utilities: { formatDate: () => '10/08/2026 12:00:00' },
    Session: { getScriptTimeZone: () => 'America/Recife' },
    CONFIG_SYNTHEON: { PLANILHAS: { OCORRENCIAS_ID: 'PLANILHA_TESTE' }, DEBUG: false },
    LockService: compartilhado.lockService,
    PropertiesService: compartilhado.properties,
    SpreadsheetApp: {
      getActiveSpreadsheet: () => compartilhado.ss,
      openById: () => compartilhado.ss
    }
  };
  sandbox.globalThis = sandbox;
  sandbox.global = sandbox;
  const ctx = vm.createContext(sandbox);
  const carregar = (rel) => vm.runInContext(fs.readFileSync(path.join(REPO, rel), 'utf8'), ctx, { filename: rel });
  carregar('Core/SerializacaoEscrita.js');
  carregar('Core/Policiais.js');
  carregar('Core/Cabecalhos.js');
  carregar('Entrada/EntradaManual.js');
  if (opcoes.provedorQueRecusa) {
    vm.runInContext('SyntheonSerializacaoEscrita._definirProvedorParaTeste({ nome: "recusa-sempre", tentar: function(){ return false; }, liberar: function(){} });', ctx);
  }
  return {
    ctx: ctx,
    rodar: (expr) => vm.runInContext(expr, ctx),
    processarEntrada: (payload) => vm.runInContext('processarEntradaManual', ctx)(payload)
  };
}

function payloadBo(id) {
  return {
    data: '10/08/2026', hora: '12:00', mike: 'MIKE' + id, boe: 'BOE' + id,
    natureza: 'PORTE ILEGAL DE ARMA', detidos: '0', imputado: 'SEM IMPUTADO',
    policiais: [{ pelotao: '1º PEL', posto: 'SD', matricula: '1000' + id, nome: 'POLICIAL ' + id }],
    armas: [], drogas: [], ocorrenciasPip: ['PORTE ILEGAL DE ARMA']
  };
}

function cenarioNovo(opcoes) {
  const registro = { escritas: [], lockTentativas: [], hooks: { aoEscrever: () => {} } };
  const ss = {
    getSheetByName: (nome) => (nome === 'AGO2026' ? aba : null),
    getSheets: () => [aba],
    insertSheet: () => aba
  };
  const aba = criarAbaMensal(registro);
  const lockService = criarLockServiceCompartilhado(registro);
  const properties = criarPropertiesFake();
  const compartilhado = { ss, lockService, properties, registro };
  const A = criarExecucao(compartilhado, opcoes);
  const B = criarExecucao(compartilhado, opcoes);
  return { registro, ss, aba, compartilhado, A, B };
}

// ---------------------------------------------------------------------------
// 3. CORRIDA — as duas escritas concorrentes do diagnostico (§2.4, item #2)
// ---------------------------------------------------------------------------
console.log('\n2) Corrida do diagnostico: duas escritas concorrentes na MESMA linha livre');

test('RED->GREEN: B disparado na janela de A falha RUIDOSAMENTE, escreve ZERO e o BO de A e integro', () => {
  const c = cenarioNovo();
  let saidaB = null;
  let escritasAntesDeB = -1;
  let escritasDepoisDeB = -1;
  c.registro.hooks.aoEscrever = () => {
    if (saidaB !== null) return;                    // dispara UMA vez, na primeira escrita de A
    escritasAntesDeB = c.registro.escritas.length;
    saidaB = c.B.processarEntrada(payloadBo('B'));  // "segunda execucao" entra na janela de A
    escritasDepoisDeB = c.registro.escritas.length;
  };

  const saidaA = c.A.processarEntrada(payloadBo('A'));

  // (1) A concluiu normalmente e gravou o proprio BO
  assert.ok(/salva/.test(saidaA), `A deveria gravar; saida: ${saidaA}`);
  const valoresA = c.registro.escritas
    .filter(e => e.aba === 'AGO2026' && e.op === 'setValues')
    .reduce((acc, e) => acc.concat(e.valores), []);
  const linhaA = valoresA.find(l => l.some(v => String(v) === 'BOEA'));
  assert.ok(linhaA, 'o BO de A tem de estar na aba (nenhuma perda de BO)');

  // (2) B FALHOU com mensagem clara e NAO escreveu NADA (medido no intervalo da execucao de B)
  assert.ok(saidaB !== null, 'B deveria ter sido disparado na janela');
  assert.ok(/NÃO GRAVADO/.test(saidaB) && /SERIALIZACAO_OCUPADA/.test(saidaB),
    `B deveria falhar fechado com SERIALIZACAO_OCUPADA; saida: ${saidaB}`);
  assert.strictEqual(escritasDepoisDeB, escritasAntesDeB,
    `a segunda execucao escreveu (${escritasAntesDeB} -> ${escritasDepoisDeB} escritas) — fail-closed violado`);
  const boB = valoresA.find(l => l.some(v => String(v) === 'BOEB'));
  assert.strictEqual(boB, undefined, 'o BO da execucao recusada NAO pode estar na aba');

  // (3) as duas execucoes disputaram a trava de verdade
  assert.ok(c.registro.lockTentativas.length >= 2,
    'as duas execucoes tentaram a trava (o teste so tem dentes se B tentou)');
  assert.strictEqual(c.compartilhado.lockService.__estado.concessoes, 1,
    `a trava so pode ser concedida a UMA execucao (concessoes=${c.compartilhado.lockService.__estado.concessoes})`);
});

test('CONTROLE: sem a trava (execucao unica) o fluxo grava normalmente — o fail-closed nao e falso positivo', () => {
  const c = cenarioNovo();
  const saida = c.A.processarEntrada(payloadBo('SOLO'));
  assert.ok(/salva/.test(saida), `saida: ${saida}`);
  const linhas = c.registro.escritas.filter(e => e.op === 'setValues')
    .reduce((acc, e) => acc.concat(e.valores), []);
  assert.ok(linhas.some(l => l.some(v => String(v) === 'BOESOLO')), 'BO gravado quando nao ha disputa');
});

// ---------------------------------------------------------------------------
// 4. FAIL-CLOSED — tryLock falso => ZERO escritas (§6.3 do diagnostico)
// ---------------------------------------------------------------------------
console.log('\n3) Fail-closed: trava recusada => ZERO escritas e mensagem clara');

test('tryLock sempre falso => a Porta nao escreve NADA e diz o motivo ao operador', () => {
  const c = cenarioNovo({ provedorQueRecusa: true });
  const saida = c.A.processarEntrada(payloadBo('X'));
  assert.strictEqual(c.registro.escritas.length, 0, 'trava decorativa: escreveu sem trava!');
  assert.ok(/NÃO GRAVADO/.test(saida), `saida deveria ser inconfundivel: ${saida}`);
  assert.ok(/ESCRITA_BLOQUEADA|SERIALIZACAO_OCUPADA/.test(saida), `motivo deveria aparecer: ${saida}`);
});

test('a trava DECORATIVA seria pega: com a trava removida, o mesmo cenario escreveria (controle negativo)', () => {
  const c = cenarioNovo();
  // prova que o cenario acima (0 escritas) NAO e consequencia de o fluxo nunca escrever:
  const soloSaida = c.A.processarEntrada(payloadBo('Y'));
  assert.ok(/salva/.test(soloSaida) && c.registro.escritas.length > 0,
    'sem provedor que recusa, o fluxo escreve — logo o 0 do caso fail-closed vem da trava');
});

// ---------------------------------------------------------------------------
// 5. REENTRANCIA e RELEASE
// ---------------------------------------------------------------------------
console.log('\n4) Reentrancia (menu -> funcao interna) e release garantido');

test('menu -> funcao interna NAO deadlocka e adquire a trava UMA unica vez', () => {
  const c = cenarioNovo();
  const saida = c.A.processarEntrada(payloadBo('R'));
  assert.ok(/salva/.test(saida), `saida: ${saida}`);
  assert.strictEqual(c.compartilhado.lockService.__estado.concessoes, 1,
    `a trava deve ser concedida 1x (reentrancia); concessoes=${c.compartilhado.lockService.__estado.concessoes}`);
  assert.strictEqual(c.compartilhado.lockService.__estado.liberacoes, 1, 'a trava deve ser liberada 1x');
  assert.strictEqual(c.compartilhado.lockService.__estado.ocupado, false, 'a trava fica LIVRE ao fim');
});

test('excecao dentro da secao critica NAO prende a trava (release em finally)', () => {
  const c = cenarioNovo();
  const erro = c.A.rodar('(function(){ try { SyntheonSerializacaoEscrita.executarComLock("fluxo.boom", function(){ throw new Error("boom"); }); } catch (e) { return e.message; } return null; })()');
  assert.strictEqual(erro, 'boom', 'a excecao deve subir (fail-fast)');
  assert.strictEqual(c.compartilhado.lockService.__estado.ocupado, false, 'trava presa apos excecao');
  const segunda = c.A.rodar('SyntheonSerializacaoEscrita.adquirir("fluxo.depois").ok');
  assert.strictEqual(segunda, true, 'a proxima execucao precisa conseguir a trava');
});

test('release SO do dono: o registro de dono e apagado ao liberar (sem trava fantasma)', () => {
  const c = cenarioNovo();
  c.A.rodar('SyntheonSerializacaoEscrita.executarComLock("fluxo.dono", function(){ return true; })');
  const registro = c.compartilhado.properties.__store['SYNTHEON_ESCRITA_LOCK'];
  assert.strictEqual(registro, undefined, `registro de dono deveria sumir ao liberar: ${registro}`);
});

// ---------------------------------------------------------------------------
// 6. IDEMPOTENCIA (§12.6) — os casos com evidencia de teste
// ---------------------------------------------------------------------------
console.log('\n5) Idempotencia: reentrega/reexecucao nao duplica efeito');

test('ENTRADA_OPERACIONAL: reentrega da MESMA operacao (MIKE/BOE) => REPLAY_RECUSADO, zero escrita', () => {
  const c = cenarioNovo();
  const primeira = c.A.processarEntrada(payloadBo('ID'));
  assert.ok(/salva/.test(primeira), `1a submissao deveria gravar: ${primeira}`);
  // a aba agora contem o MIKE/BOE da operacao
  const matriz = c.aba.__matriz;
  const colMike = CABECALHOS.indexOf('MIKE');
  const colBoe = CABECALHOS.indexOf('BOE');
  const linhasComBo = matriz.filter(l => String(l[colBoe]) === 'BOEID');
  assert.ok(linhasComBo.length >= 1, 'o BO precisa estar na aba para o replay ser detectavel');

  const antes = c.registro.escritas.length;
  const segunda = c.A.processarEntrada(payloadBo('ID'));
  assert.ok(/REPLAY_RECUSADO/.test(segunda), `2a submissao deveria ser replay: ${segunda}`);
  assert.strictEqual(c.registro.escritas.length, antes, 'replay NAO pode escrever (duplicaria a ocorrencia)');
});

test('ENTRADA_OPERACIONAL: operacao DIFERENTE continua gravando (nao virou bloqueio geral)', () => {
  const c = cenarioNovo();
  c.A.processarEntrada(payloadBo('P1'));
  const antes = c.registro.escritas.length;
  const outra = c.A.processarEntrada(payloadBo('P2'));
  assert.ok(/salva/.test(outra), `outra operacao deveria gravar: ${outra}`);
  assert.ok(c.registro.escritas.length > antes, 'a segunda operacao DISTINTA precisa gravar');
});

test('APPEND com chave estavel: mesma compilacao de armas => mesma chave; conteudo diferente => chave diferente', () => {
  const sandbox = {
    console: { log: () => {}, error: () => {}, warn: () => {} },
    PropertiesService: criarPropertiesFake(),
    Utilities: { formatDate: () => '10/08/2026 12:00:00' },
    Session: { getScriptTimeZone: () => 'America/Recife' },
    SpreadsheetApp: { BorderStyle: { SOLID: 'SOLID' }, getActiveSpreadsheet: () => ({}) }
  };
  sandbox.globalThis = sandbox;
  const ctx = vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(REPO, 'Compilador_Armas.js'), 'utf8'), ctx, { filename: 'Compilador_Armas.js' });
  const chave = (modo, meses, ranking) => vm.runInContext(`chaveExecucaoArmas_(${JSON.stringify(modo)}, ${JSON.stringify(meses)}, ${JSON.stringify(ranking)})`, ctx);

  const ranking = [['1º PEL', 'SD', '111', 'FULANO', 3], ['2º PEL', 'CB', '222', 'BELTRANO', 1]];
  const k1 = chave('ANUAL', ['JAN2026', 'FEV2026'], ranking);
  const k2 = chave('ANUAL', ['FEV2026', 'JAN2026'], ranking);   // ordem das abas nao muda a chave
  const k3 = chave('ANUAL', ['JAN2026', 'FEV2026'], [['1º PEL', 'SD', '111', 'FULANO', 4]]);
  assert.strictEqual(k1, k2, 'a chave deve ser estavel (mesmo conteudo, mesma execucao)');
  assert.notStrictEqual(k1, k3, 'conteudo diferente => chave diferente (nao bloqueia recompilacao legitima)');

  // registro/replay: registrar torna a MESMA chave um replay; registro ilegivel NAO trava
  vm.runInContext(`registrarReplayArmas_('COMP_ARMAS_2026', ${JSON.stringify(k1)}, 'COMP_ARMAS_2026');`, ctx);
  const replay = vm.runInContext(`JSON.stringify(decidirReplayArmas_('COMP_ARMAS_2026', ${JSON.stringify(k1)}))`, ctx);
  assert.strictEqual(JSON.parse(replay).replay, true, 'mesma chave deve ser REPLAY');
  assert.strictEqual(JSON.parse(replay).aba, 'COMP_ARMAS_2026', 'o replay deve nomear a aba existente');
  const outra = vm.runInContext(`JSON.stringify(decidirReplayArmas_('COMP_ARMAS_2026', ${JSON.stringify(k3)}))`, ctx);
  assert.strictEqual(JSON.parse(outra).replay, false, 'chave diferente nao e replay');

  sandbox.PropertiesService.getScriptProperties().setProperty('SYNTHEON_ARMAS_REPLAY', '{lixo');
  const corrompido = vm.runInContext(`JSON.stringify(decidirReplayArmas_('COMP_ARMAS_2026', ${JSON.stringify(k1)}))`, ctx);
  assert.strictEqual(JSON.parse(corrompido).replay, false, 'registro corrompido e recuperado, nunca trava o produto');
});

test('EFETIVO: a escrita e UMA chamada (sem clearContent) e repetir reconstroi o MESMO estado', () => {
  const escritas = [];
  const criarSheet = (linhas) => {
    const matriz = linhas.map(l => l.slice());
    while (matriz.length < 12) matriz.push(['', '', '', '', '', '', '']);
    return {
      getLastRow: () => matriz.length,
      getRange: (r, c, nR, nC) => ({
        setValues: (vals) => {
          escritas.push({ op: 'setValues', linha: r, col: c, nR: nR, nC: nC, valores: JSON.parse(JSON.stringify(vals)) });
          vals.forEach((linha, ri) => { matriz[r - 1 + ri] = linha.slice(); });
        },
        clearContent: () => escritas.push({ op: 'clearContent', linha: r, col: c, nR: nR, nC: nC }),
        getValues: () => matriz.slice(r - 1, r - 1 + nR)
      }),
      setFrozenRows: () => {},
      autoResizeColumns: () => {},
      __matriz: matriz
    };
  };
  const sandbox = { console: { log: () => {} } };
  sandbox.globalThis = sandbox;
  const ctx = vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(REPO, 'Features', 'NormalizadorEfetivo.js'), 'utf8'), ctx, { filename: 'NormalizadorEfetivo.js' });
  const saida = [['NOME', 'GRAD 1', 'COMPLETO', 'SD', '111', '1º PEL', '1º PEL'],
                 ['OUTRO', 'GRAD 2', 'COMPLETO2', 'CB', '222', '2º PEL', '2º PEL']];

  const sheet1 = criarSheet(saida.slice(0, 1));
  const mod = vm.runInContext('NormalizadorEfetivo', ctx);
  mod.escreverEfetivo(sheet1, saida);
  assert.strictEqual(escritas.filter(e => e.op === 'clearContent').length, 0,
    'nao pode haver clearContent antes do setValues (janela de rede = corrida do §2.1)');
  assert.strictEqual(escritas.filter(e => e.op === 'setValues').length, 1,
    'a substituicao do EFETIVO tem de ser UMA chamada de API');

  const depoisDaPrimeira = JSON.stringify(sheet1.__matriz);
  escritas.length = 0;
  mod.escreverEfetivo(sheet1, saida);   // repetir a MESMA operacao
  assert.strictEqual(JSON.stringify(sheet1.__matriz), depoisDaPrimeira,
    'repetir a operacao reconstroi o MESMO estado (REGERA/REPLACE, sem acumulo)');
  assert.strictEqual(escritas.filter(e => e.op === 'setValues').length, 1, 'a reexecucao tambem e uma unica chamada');
});

// ---------------------------------------------------------------------------
// 7. ANTI-ORNAMENTO do contrato (§6.4 e §6.5 do diagnostico)
// ---------------------------------------------------------------------------
console.log('\n6) Anti-ornamento: as 9 Portas declaram a trava de verdade e citam endereco real');

const PORTAS_RACE = [
  '02_Comodos/C00_Governanca_Estrutural/01_Dominio/modulos/MOD-C00-03_INFRAESTRUTURA_CORE/portas/PORTA-C00-03-P01_LOG_DE_AUDITORIA.md',
  '02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-01_FORMULARIO_E_MENUS/portas/PORTA-C01-01-P03_ENTRADA_MANUAL_BO.md',
  '02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-02_NORMALIZADOR_DE_EFETIVO/portas/PORTA-C01-02-P02_ESCRITA_EFETIVO.md',
  '02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-02_NORMALIZADOR_DE_EFETIVO/portas/PORTA-C01-02-P03_NORMALIZADOR_HEADLESS.md',
  '02_Comodos/C05_Guardiao/01_Dominio/modulos/MOD-C05-01_GUARDIAO_DE_QUALIDADE/portas/PORTA-C05-01-P02_ABAS_DE_AUDITORIA.md',
  '02_Comodos/C05_Guardiao/01_Dominio/modulos/MOD-C05-01_GUARDIAO_DE_QUALIDADE/portas/PORTA-C05-01-P03_COLUNA_ALERTA_AM.md',
  '02_Comodos/C05_Guardiao/01_Dominio/modulos/MOD-C05-01_GUARDIAO_DE_QUALIDADE/portas/PORTA-C05-01-P05_GUARDIAO_HEADLESS.md',
  '02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-01_RELATORIOS_OFICIAIS/portas/PORTA-C06-01-P01_MENU_COMPARATIVO.md',
  '02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-01_RELATORIOS_OFICIAIS/portas/PORTA-C06-01-P02_COMPARATIVO_HEADLESS.md'
];

/** Le a celula do item `race_condition` na tabela do §12.6 da Porta. */
function itemRaceDaPorta(caminho) {
  const linhas = fs.readFileSync(path.join(REPO, caminho), 'utf8').replace(/\r\n/g, '\n').split('\n');
  for (const l of linhas) {
    const t = l.trim();
    if (!t.startsWith('|')) continue;
    const celulas = t.replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
    if ((celulas[0] || '').toLowerCase() !== 'race_condition') continue;
    return { estado: (celulas[1] || '').toLowerCase(), resposta: celulas.slice(2).join(' | ') };
  }
  return null;
}

test('as 9 Portas com race_condition NAO estao mais `pendente` e citam INST-SERIALIZACAO-001', () => {
  const problemas = [];
  PORTAS_RACE.forEach(p => {
    const item = itemRaceDaPorta(p);
    if (!item) { problemas.push(`${p}: item race_condition ausente`); return; }
    if (item.estado === 'pendente') problemas.push(`${p}: race_condition ainda 'pendente'`);
    if (!/INST-SERIALIZACAO-001/.test(item.resposta)) problemas.push(`${p}: nao cita INST-SERIALIZACAO-001`);
    if (!/Core\/SerializacaoEscrita\.js/.test(item.resposta)) problemas.push(`${p}: nao cita o helper unico`);
  });
  assert.deepStrictEqual(problemas, [], JSON.stringify(problemas, null, 2));
});

test('a Instalacao transversal INST-SERIALIZACAO-001 existe de fato no cofre (§8.11)', () => {
  assert.ok(fs.existsSync(path.join(REPO, INST)), `INST ausente: ${INST}`);
  const texto = fs.readFileSync(path.join(REPO, INST), 'utf8');
  ['Contrato', 'Consumidores', 'Falhas', 'Observabilidade', 'Testes'].forEach(secao => {
    assert.ok(new RegExp('##\\s*[0-9.]*\\s*' + secao, 'i').test(texto), `INST sem a secao obrigatoria: ${secao}`);
  });
});

test('CONTROLE NEGATIVO do endereco: cada `arquivo.js:linha` citado por race_condition existe e contem operacao de escrita/leitura real', () => {
  const tokens = /setValues|setValue|clearContent|clear\(|insertSheet|getLastRow|copyTo|executarComLock|gravar|escrever|varrerAba|prepararColunaAlertas|renderizarLog|calcularLinhaAnexoHistorico|getValues/;
  const problemas = [];
  PORTAS_RACE.forEach(p => {
    const item = itemRaceDaPorta(p);
    if (!item) { problemas.push(`${p}: item race_condition ausente`); return; }
    const citacoes = [...new Set((item.resposta.match(/[A-Za-z0-9_\/.-]+\.js:[0-9]+/g) || []))];
    if (citacoes.length === 0) problemas.push(`${p}: nenhuma citacao arquivo.js:linha`);
    citacoes.forEach(cit => {
      const [rel, linhaStr] = cit.split(':');
      const abs = path.join(REPO, rel);
      if (!fs.existsSync(abs)) { problemas.push(`${p}: arquivo citado inexistente (${rel})`); return; }
      const linhas = fs.readFileSync(abs, 'utf8').replace(/\r\n/g, '\n').split('\n');
      const n = Number(linhaStr);
      if (n < 1 || n > linhas.length) { problemas.push(`${p}: linha fora do arquivo (${cit})`); return; }
      const conteudo = linhas[n - 1];
      if (!tokens.test(conteudo)) problemas.push(`${p}: a linha ${cit} nao contem operacao de escrita/leitura -> "${conteudo.trim().slice(0, 60)}"`);
    });
  });
  assert.deepStrictEqual(problemas, [], JSON.stringify(problemas, null, 2));
});

// ---------------------------------------------------------------------------
// 8. Resultado
// ---------------------------------------------------------------------------
console.log(`\nRESULTADOS FINAIS: ${sucessos} PASS / ${falhas} FAIL`);
if (falhas > 0) process.exitCode = 1;

}
