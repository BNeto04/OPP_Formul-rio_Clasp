'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/TestCatalogoPipGuardiao.js
 * DESCRICAO: Fix do achado de homologacao G01 #117 — resolucao da aba canonica do catalogo PIP.
 *
 * Contexto real (planilha viva, 10/09/2026): o leitor usava o alias solto 'PIP' e pegava a
 * PRIMEIRA aba contendo 'PIP' (PIP_SELECAO_LIVRE). Resultado: os indicadores reais do mes
 * viraram INDICADOR_DESCONHECIDO (126 observacoes) e a cobertura saiu PARCIAL por falso motivo.
 * A resolucao agora exige 'TABELA' + 'PIP' (ou nome canonico), prioriza canonicos e descarta
 * copias/backups; sem candidata inequivoca => null (modo limitado explicito).
 */

const assert = require('assert');

const UtilsMod = require('../Core/Utils');
global.SyntheonUtils = UtilsMod.SyntheonUtils || UtilsMod;

const CONSTANTES_SYNTHEON = require('../Core/Constantes');
global.CONSTANTES_SYNTHEON = CONSTANTES_SYNTHEON;

const GuardiaoQualidade = require('../Features/GuardiaoQualidade');
global.GuardiaoQualidade = GuardiaoQualidade;

console.log('Iniciando Testes: Catalogo PIP do Guardiao (fix G01 #117)...\n');

let sucessos = 0;
let falhas = 0;

function test(nome, fn) {
  try {
    fn();
    console.log(`  [PASS] ${nome}`);
    sucessos++;
  } catch (err) {
    console.error(`  [FAIL] ${nome}:`, err.message);
    falhas++;
  }
}

function criarSS(nomes) {
  return { getSheets: () => nomes.map(n => ({ getName: () => n })) };
}

const nomeDe = aba => (aba ? aba.getName() : null);

// ---------- 1. Cenario REAL da planilha viva ----------
test('planilha viva: escolhe "tabela de pontos PIP" e nao as abas PIP_* (fim do falso PARCIAL)', () => {
  const nomes = [
    'SET2026', '[HISTORICO] Auditoria Ocorrencias', 'AGO2026', 'CA_JUL2026_JUL2026',
    'JUL2026', 'PIP_SELECAO_LIVRE', 'PIP_JUL_2026.v5', 'PRODUTIVIDADE_GERAL',
    'PIP_JUL_2026.v3', 'PIP_JUL_2026.v2', 'PIP_JUL_2026', 'PIP_JUN_2026.v5',
    'PIP_FINAL-AGO2026', 'COMPARATIVO_2026', 'tabela de pontos PIP',
    'Cópia de tabela de pontos PIP'
  ];
  const aba = GuardiaoQualidade.localizarAbaCatalogoPIP(criarSS(nomes));
  assert.strictEqual(nomeDe(aba), 'tabela de pontos PIP');
});

test('nunca escolhe aba que apenas contenha "PIP" (PIP_SELECAO_LIVRE / PIP_JUL_2026.v5)', () => {
  const soPipSoltas = ['AGO2026', 'PIP_SELECAO_LIVRE', 'PIP_JUL_2026.v5', 'PIP_FINAL-AGO2026'];
  assert.strictEqual(GuardiaoQualidade.localizarAbaCatalogoPIP(criarSS(soPipSoltas)), null);
});

// ---------- 2. Prioridade dos nomes canonicos ----------
test('prioridade canonica: "tabela de pontos PIP" (rank 0) vence "TABELA PIP" (rank 1)', () => {
  const nomes = ['tabela de pontos PIP', 'TABELA PIP'];
  assert.strictEqual(nomeDe(GuardiaoQualidade.localizarAbaCatalogoPIP(criarSS(nomes))), 'tabela de pontos PIP');
});

test('nome canonico vence nome nao canonico que apenas contenha TABELA+PIP', () => {
  const nomes = ['TABELA PIP ANTIGA', 'TABELA PIP'];
  assert.strictEqual(nomeDe(GuardiaoQualidade.localizarAbaCatalogoPIP(criarSS(nomes))), 'TABELA PIP');
});

test('"Tabela de Indicadores" e aceito como canonico mesmo sem "PIP" no nome', () => {
  const nomes = ['PIP_SELECAO_LIVRE', 'Tabela de Indicadores'];
  assert.strictEqual(nomeDe(GuardiaoQualidade.localizarAbaCatalogoPIP(criarSS(nomes))), 'Tabela de Indicadores');
});

// ---------- 3. Copias/backups e ausencia de catalogo ----------
test('apenas copia do catalogo: retorna null (nao audita com copia silenciosa)', () => {
  const nomes = ['AGO2026', 'Cópia de tabela de pontos PIP'];
  assert.strictEqual(GuardiaoQualidade.localizarAbaCatalogoPIP(criarSS(nomes)), null);
});

test('backup/rascunho da tabela sao descartados', () => {
  const nomes = ['TABELA PIP - BACKUP', 'RASCUNHO TABELA PIP', 'TABELA PIP'];
  assert.strictEqual(nomeDe(GuardiaoQualidade.localizarAbaCatalogoPIP(criarSS(nomes))), 'TABELA PIP');
});

test('parent invalido (null / sem getSheets) retorna null sem lancar', () => {
  assert.strictEqual(GuardiaoQualidade.localizarAbaCatalogoPIP(null), null);
  assert.strictEqual(GuardiaoQualidade.localizarAbaCatalogoPIP({}), null);
});

// ---------- 4. Normalizacao flexivel de nome ----------
test('variacoes de separador/caixa no nome do catalogo sao resolvidas', () => {
  const nomes = ['PIP_SELECAO_LIVRE', 'tabela-de-pontos-pip', 'TABELA  DE  PONTOS  PIP'];
  const aba = GuardiaoQualidade.localizarAbaCatalogoPIP(criarSS(nomes));
  assert.ok(aba, 'deveria encontrar o catalogo');
  assert.ok(aba.getName().toUpperCase().indexOf('PONTOS') !== -1);
});

// ---------- 4. Linha de cabecalho do catalogo (layout real com titulo antes da tabela) ----------
test('layout real da planilha: cabecalho na 4a linha e localizado (indice 3)', () => {
  const vals = [
    [],
    ['', ' '],
    [],
    ['', 'Nível', 'Ocorrência', 'SEM IMPUTADO'],
    ['', '1', 'ARMAS DE FOGO (por unidade)'],
    ['', '1.2', 'Apreensão de arma de fogo revólver', '9.000']
  ];
  assert.strictEqual(GuardiaoQualidade.localizarLinhaCabecalhoCatalogo(vals), 3);
});

test('cabecalho na primeira linha continua funcionando (indice 0)', () => {
  const vals = [['Nível', 'INDICADOR PIP', 'SEM IMPUTADO'], ['1.2', 'Apreensão de arma de fogo revólver', '9.000']];
  assert.strictEqual(GuardiaoQualidade.localizarLinhaCabecalhoCatalogo(vals), 0);
});

test('aba sem cabecalho de indicador retorna -1 (modo limitado explicito)', () => {
  const vals = [['a'], ['b'], ['c']];
  assert.strictEqual(GuardiaoQualidade.localizarLinhaCabecalhoCatalogo(vals), -1);
});

console.log(`\nRESULTADOS FINAIS: ${sucessos} PASS / ${falhas} FAIL`);
if (falhas > 0) process.exit(1);
}
