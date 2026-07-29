'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/TestAdaptador2026.js
 * DESCRIÇÃO: Suite de testes unitários para o Adaptador2026 e SyntheonCabecalhos.
 * Valida a conversão de linhas da planilha em Registros Canônicos e a busca flexível de cabeçalhos.
 */

const assert = require('assert');

global.ErroValidacaoDominio = require('../Core/Erros').ErroValidacaoDominio;
global.CONSTANTES_SYNTHEON = require('../Core/Constantes');
global.SyntheonCabecalhos = require('../Core/Cabecalhos');

const UtilsMod = require('../Core/Utils');
global.SyntheonUtils = UtilsMod.SyntheonUtils || UtilsMod;

const NormalizadorMod = require('../Core/Normalizador');
global.SyntheonNormalizador = NormalizadorMod.SyntheonNormalizador || NormalizadorMod;

const RegistroCanonicoMod = require('../Dominio/RegistroCanonico');
global.RegistroCanonico = RegistroCanonicoMod.RegistroCanonico || RegistroCanonicoMod;

const Adaptador2026 = require('../Leitura/Adaptador2026');

console.log('🧪 Iniciando Testes Unitários: Adaptador 2026 & SyntheonCabecalhos...\n');

let sucessos = 0;

function test(nome, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${nome}`);
    sucessos++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${nome}:`, err.message);
    process.exitCode = 1;
  }
}

test('SyntheonCabecalhos: deve encontrar colunas com ou sem acentuação (MATRICULA vs MATRÍCULA)', () => {
  const headersComAcento = ['DATA', 'NÚMERO MIKE', 'BOE', 'MATRÍCULA', 'POLICIAL'];
  const idxMat = SyntheonCabecalhos.encontrar(headersComAcento, 'MATRICULA');
  assert.strictEqual(idxMat, 3);

  const headersSemAcento = ['DATA', 'MIKE', 'BOE', 'MATRICULA', 'POLICIAL'];
  const idxMat2 = SyntheonCabecalhos.encontrar(headersSemAcento, 'MATRICULA');
  assert.strictEqual(idxMat2, 3);
});

test('SyntheonCabecalhos: deve encontrar colunas por aliases de OCORRÊNCIA PIP e PELOTÃO', () => {
  const headers = ['DATA', 'MIKE', 'PELOTÃO', 'MATRÍCULA', 'OCORRÊNCIA PIP'];
  assert.strictEqual(SyntheonCabecalhos.encontrar(headers, 'PELOTAO'), 2);
  assert.strictEqual(SyntheonCabecalhos.encontrar(headers, 'INDICADOR_PIP'), 4);
});

test('SyntheonCabecalhos: deve lançar erro claro para colunas obrigatórias ausentes', () => {
  const headers = ['DATA', 'MIKE'];
  assert.throws(() => {
    SyntheonCabecalhos.encontrar(headers, 'MATRICULA', true, 'Matrícula do Policial');
  }, /Cabeçalho obrigatório para 'Matrícula do Policial' não localizado/);
});

test('Adaptador2026: deve ignorar linhas sem MIKE (Regra do MIKE Obrigatório)', () => {
  const dadosMock = [
    ['DATA', 'MIKE', 'BOE', 'MATRICULA', 'POLICIAL', 'ARMAS', 'PONTOS FICÇÃO (1/4)'],
    ['15/07/2026', '', '26E117', '113920-7', 'SOLDADO SILVA', 1, 10], // MIKE VAZIO → PULA
    ['15/07/2026', '050500', '26E117', '113920-7', 'SOLDADO SILVA', 1, 10] // MIKE OK → PROCESSA
  ];

  const metadado = { versao: '2026', aba: 'JUL2026', coberturaHistorica: {} };
  const fatos = Adaptador2026.extrairFatos(dadosMock, metadado, {});

  assert.strictEqual(fatos.length, 1);
  assert.strictEqual(fatos[0].ocorrencia.mike, '050500');
  assert.strictEqual(fatos[0].policiais[0].matricula, '113920-7');
});

test('Adaptador2026: deve enriquecer dados do policial usando o mapaEfetivo', () => {
  const dadosMock = [
    ['DATA', 'MIKE', 'BOE', 'MATRICULA', 'POLICIAL', 'ARMAS', 'PONTOS FICÇÃO (1/4)'],
    ['15/07/2026', '050500', '26E117', '113920-7', 'NOME ERRADO', 1, 10]
  ];

  const mapaEfetivo = {
    '113920-7': { nome: 'NOME OFICIAL DO EFETIVO', graduacao: 'SD', pelotao: '1º PEL' }
  };

  const metadado = { versao: '2026', aba: 'JUL2026', coberturaHistorica: {} };
  const fatos = Adaptador2026.extrairFatos(dadosMock, metadado, mapaEfetivo);

  assert.strictEqual(fatos.length, 1);
  assert.strictEqual(fatos[0].policiais[0].nome, 'NOME OFICIAL DO EFETIVO');
  assert.strictEqual(fatos[0].policiais[0].pelotao, '1º PEL');
});

console.log(`\n🎉 Testes do Adaptador 2026 concluídos: ${sucessos} testes passaram!`);
}
