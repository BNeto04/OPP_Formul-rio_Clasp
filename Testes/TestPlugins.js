'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/TestPlugins.js
 * DESCRIÇÃO: Suite de testes unitários para a arquitetura de Plugins de Métrica.
 * Testa isoladamente e de forma combinada o ciclo de vida (inicializar, processar, finalizar).
 */

const assert = require('assert');

global.IPluginMetrica = require('../Plugins/IPluginMetrica');

// Garante que cada plugin encontre IPluginMetrica no escopo global
const PluginArmasMod = require('../Plugins/Metricas/PluginArmas');
const PluginArmas = PluginArmasMod.PluginArmas || PluginArmasMod;

const PluginEntorpecentesMod = require('../Plugins/Metricas/PluginEntorpecentes');
const PluginEntorpecentes = PluginEntorpecentesMod.PluginEntorpecentes || PluginEntorpecentesMod;

const PluginOcorrenciasMod = require('../Plugins/Metricas/PluginOcorrencias');
const PluginOcorrencias = PluginOcorrenciasMod.PluginOcorrencias || PluginOcorrenciasMod;

const PluginPrisoesMod = require('../Plugins/Metricas/PluginPrisoes');
const PluginPrisoes = PluginPrisoesMod.PluginPrisoes || PluginPrisoesMod;

const PluginPontuacaoMod = require('../Plugins/Metricas/PluginPontuacao');
const PluginPontuacao = PluginPontuacaoMod.PluginPontuacao || PluginPontuacaoMod;

console.log('🧪 Iniciando Testes Unitários: Plugins de Métrica...\n');

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

// 1. PluginArmas
test('PluginArmas: deve acumular armas e contar ocorrência com arma apenas 1x', () => {
  const plugin = new PluginArmas();
  const consolidado = { fatos: {} };
  plugin.inicializar(consolidado);

  const pmFato1 = { armas: 1 };
  const pmFato2 = { armas: 2 };

  plugin.processar(null, pmFato1, consolidado, 'PM1_OC1', true);
  plugin.processar(null, pmFato2, consolidado, 'PM1_OC1', false); // Mesma ocorrência

  assert.strictEqual(consolidado.fatos.armas, 3);
  assert.strictEqual(consolidado.fatos.ocorrenciasComArma, 1);
});

// 2. PluginEntorpecentes
test('PluginEntorpecentes: deve acumular drogas por tipo e calcular peso total', () => {
  const plugin = new PluginEntorpecentes();
  const consolidado = { fatos: {} };
  plugin.inicializar(consolidado);

  const pmFato = { maconha: 10, cocaina: 5, crack: 2 };
  plugin.processar(null, pmFato, consolidado, 'PM1_OC1', true);

  assert.strictEqual(consolidado.fatos.maconha, 10);
  assert.strictEqual(consolidado.fatos.cocaina, 5);
  assert.strictEqual(consolidado.fatos.crack, 2);
  assert.strictEqual(consolidado.fatos.drogasTotal, 17);
  assert.strictEqual(consolidado.fatos.ocorrenciasComDroga, 1);
});

// 3. PluginOcorrencias
test('PluginOcorrencias: deve contar ocorrência única e BOE apenas quando primeiraVezNaOcorrencia=true', () => {
  const plugin = new PluginOcorrencias();
  const consolidado = { fatos: {} };
  plugin.inicializar(consolidado);

  const fato = { ocorrencia: { boe: '26E117' } };
  plugin.processar(fato, {}, consolidado, 'PM1_OC1', true);
  plugin.processar(fato, {}, consolidado, 'PM1_OC1', false); // Linha 2 do mesmo túnel

  assert.strictEqual(consolidado.fatos.ocorrencias, 1);
  assert.strictEqual(consolidado.fatos.qtdBoe, 1);
});

// 4. PluginPontuacao (Deduplicação por Max-Value)
test('PluginPontuacao: deve deduplicar a pontuação rateada pelo valor MÁXIMO da mesma ocorrência', () => {
  const plugin = new PluginPontuacao();
  const consolidado = { matricula: '1139207', indicadores: {} };
  plugin.inicializar(consolidado);

  // Ocorrência 1 (PM aparece em 3 linhas com mesmo rateio 12 pts)
  plugin.processar(null, { pontosRateados: 12 }, consolidado, '1139207_OC1', true);
  plugin.processar(null, { pontosRateados: 12 }, consolidado, '1139207_OC1', false);
  plugin.processar(null, { pontosRateados: 12 }, consolidado, '1139207_OC1', false);

  // Ocorrência 2 (PM aparece em 1 linha com 25 pts)
  plugin.processar(null, { pontosRateados: 25 }, consolidado, '1139207_OC2', true);

  plugin.finalizar(consolidado);

  // Resultado esperado: 12 + 25 = 37 pts (não 12+12+12+25 = 61 pts!)
  assert.strictEqual(consolidado.indicadores.pontosTotais, 37);
  assert.strictEqual(consolidado._pts, undefined); // Deve garantir que não há sujeira em _pts
});

console.log(`\n🎉 Testes de Plugins concluídos: ${sucessos} testes passaram!`);
}

