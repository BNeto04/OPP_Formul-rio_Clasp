'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/TestMotorAnaliticoRegressao.js
 * DESCRIÇÃO: Suíte de testes de regressão matemática do MotorAnaliticoV2 por túnel (MIKE|BOE).
 * Valida a matemática de deduplicação, acumulação de apreensões e preservação semântica.
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

const RegistroAnaliticoMod = require('../Dominio/RegistroAnalitico');
global.RegistroAnalitico = RegistroAnaliticoMod.RegistroAnalitico || RegistroAnaliticoMod;

global.IPluginMetrica = require('../Plugins/IPluginMetrica');
global.PluginArmas = require('../Plugins/Metricas/PluginArmas');
global.PluginEntorpecentes = require('../Plugins/Metricas/PluginEntorpecentes');
global.PluginOcorrencias = require('../Plugins/Metricas/PluginOcorrencias');
global.PluginPontuacao = require('../Plugins/Metricas/PluginPontuacao');
global.PluginPrisoes = require('../Plugins/Metricas/PluginPrisoes');

const MotorAnaliticoV2 = require('../Motor/MotorAnaliticoV2');
const M04RegressaoFixture = require('./Fixtures/M04RegressaoFixture');

console.log('🧪 Iniciando Testes Unitários: Regressão Matemática do Motor V2 por Túnel...\n');

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

// 1. Cenário: Policial em Múltiplas Linhas do Mesmo Túnel
test('Regressão Motor V2: mesmo policial em várias linhas do mesmo túnel deduplica ocorrência/BOE e usa maior pontuação', () => {
  const fatos = M04RegressaoFixture.obterFatosMesmoPolicialMesmoTunel();
  const resultado = MotorAnaliticoV2.processarProdutividadePolicial(fatos);

  assert.strictEqual(resultado.length, 1);
  const pol = resultado[0];

  // Identificação e Pelotão
  assert.strictEqual(pol.matricula, '1139207');
  assert.strictEqual(pol.pelotao, '1º PEL GTAR');

  // Deduplicação de Ocorrências e BOE (Devem contar apenas 1x)
  assert.strictEqual(pol.fatos.ocorrencias, 1);
  assert.strictEqual(pol.fatos.qtdBoe, 1);

  // Acumulação de Apreensões (Fatos físicos de cada linha)
  assert.strictEqual(pol.fatos.armas, 3);
  assert.strictEqual(pol.fatos.maconha, 10);
  assert.strictEqual(pol.fatos.cocaina, 5);
  assert.strictEqual(pol.fatos.crack, 2.5);
  assert.strictEqual(pol.fatos.drogasTotal, 17.5);
  assert.strictEqual(pol.fatos.detidos, 2);
  assert.strictEqual(pol.fatos.apfd, 1);
  assert.strictEqual(pol.fatos.tco, 1);
  assert.strictEqual(pol.fatos.boc, 1);

  // Pontuação Deduplicada pelo Valor MÁXIMO (Math.max(10, 15, 10) = 15)
  assert.strictEqual(pol.indicadores.pontosPIP, 15);
  assert.strictEqual(pol.indicadores.pontosCPM, 15);
  assert.strictEqual(pol.indicadores.pontosTotais, 15);
});

// 2. Cenário: Policial em Múltiplos Túneis Diferentes
test('Regressão Motor V2: policial em múltiplos túneis acumula ocorrências, BOE, armas e soma máximos de cada túnel', () => {
  const fatos = M04RegressaoFixture.obterFatosPolicialMultiplosTuneis();
  const resultado = MotorAnaliticoV2.processarProdutividadePolicial(fatos);

  assert.strictEqual(resultado.length, 1);
  const pol = resultado[0];

  assert.strictEqual(pol.fatos.ocorrencias, 2);
  assert.strictEqual(pol.fatos.qtdBoe, 2);
  assert.strictEqual(pol.fatos.armas, 5); // 2 no Túnel A + 3 no Túnel B
  assert.strictEqual(pol.fatos.maconha, 25); // 5 + 0 + 20

  // Pontuação: Max no Túnel A (12) + Max no Túnel B (20) = 32
  assert.strictEqual(pol.indicadores.pontosPIP, 32);
});

// 3. Cenário: Dois Policiais no Mesmo Túnel
test('Regressão Motor V2: dois policiais no mesmo túnel recebem apenas suas próprias métricas sem contaminação', () => {
  const fatos = M04RegressaoFixture.obterFatosDoisPoliciaisMesmoTunel();
  const resultado = MotorAnaliticoV2.processarProdutividadePolicial(fatos);

  assert.strictEqual(resultado.length, 2);

  const mapa = {};
  resultado.forEach(p => { mapa[p.matricula] = p; });

  const p1 = mapa['1139207']; // SD SILVA - 1º PEL GTAR
  const p2 = mapa['1140000']; // CB SOUZA - 2º PEL GTAR

  assert.ok(p1 && p2);

  // Policial 1
  assert.strictEqual(p1.pelotao, '1º PEL GTAR');
  assert.strictEqual(p1.fatos.ocorrencias, 1);
  assert.strictEqual(p1.fatos.armas, 1);
  assert.strictEqual(p1.fatos.maconha, 15); // 10 + 5
  assert.strictEqual(p1.fatos.cocaina, 0);
  assert.strictEqual(p1.indicadores.pontosPIP, 10);

  // Policial 2
  assert.strictEqual(p2.pelotao, '2º PEL GTAR');
  assert.strictEqual(p2.fatos.ocorrencias, 1);
  assert.strictEqual(p2.fatos.armas, 2);
  assert.strictEqual(p2.fatos.maconha, 0);
  assert.strictEqual(p2.fatos.cocaina, 15);
  assert.strictEqual(p2.indicadores.pontosPIP, 8);
});

// 4. Cenário: Validação Separada de Entorpecentes
test('Regressão Motor V2: entorpecentes são validados individualmente (maconha, cocaina, crack e total)', () => {
  const fatos = M04RegressaoFixture.obterFatosMesmoPolicialMesmoTunel();
  const resultado = MotorAnaliticoV2.processarProdutividadePolicial(fatos);

  const pol = resultado[0];
  assert.strictEqual(pol.fatos.maconha, 10);
  assert.strictEqual(pol.fatos.cocaina, 5);
  assert.strictEqual(pol.fatos.crack, 2.5);
  assert.strictEqual(pol.fatos.drogasTotal, 17.5);
});

// 5. Cenário: Preservação Semântica de Pelotões
test('Regressão Motor V2: preserva semântica completa dos pelotões especiais (1º PEL GTAR e 2º PEL GTAR)', () => {
  const fatos = M04RegressaoFixture.obterFatosDoisPoliciaisMesmoTunel();
  const resultado = MotorAnaliticoV2.processarProdutividadePolicial(fatos);

  const pelotões = resultado.map(p => p.pelotao);
  assert.ok(pelotões.includes('1º PEL GTAR'));
  assert.ok(pelotões.includes('2º PEL GTAR'));
});

// 6. Cenário: Comutatividade Controlada (Ordem dos Fatos)
test('Regressão Motor V2: comutatividade controlada — inverter a ordem dos fatos do mesmo período produz totais idênticos', () => {
  const fatosOriginais = M04RegressaoFixture.obterFatosMesmoPolicialMesmoTunel();
  const fatosReversos = [...fatosOriginais].reverse();

  const resOriginal = MotorAnaliticoV2.processarProdutividadePolicial(fatosOriginais)[0];
  const resReverso = MotorAnaliticoV2.processarProdutividadePolicial(fatosReversos)[0];

  assert.strictEqual(resOriginal.fatos.ocorrencias, resReverso.fatos.ocorrencias);
  assert.strictEqual(resOriginal.fatos.qtdBoe, resReverso.fatos.qtdBoe);
  assert.strictEqual(resOriginal.fatos.armas, resReverso.fatos.armas);
  assert.strictEqual(resOriginal.fatos.drogasTotal, resReverso.fatos.drogasTotal);
  assert.strictEqual(resOriginal.fatos.detidos, resReverso.fatos.detidos);
  assert.strictEqual(resOriginal.indicadores.pontosPIP, resReverso.indicadores.pontosPIP);
});

console.log(`\n🎉 Testes de Regressão do Motor V2 concluídos: ${sucessos} testes passaram!`);
}
