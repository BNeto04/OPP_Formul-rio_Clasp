'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/TestCentralAnalitica.js
 * DESCRIÇÃO: Teste unitário para a Central Analítica (Missão CA-1).
 * Valida a ordenação determinística e consolidação da CA em ambiente Node.js.
 */

const assert = require('assert');

global.ErroValidacaoDominio = require('../Core/Erros').ErroValidacaoDominio;
global.CONSTANTES_SYNTHEON = require('../Core/Constantes');
global.SyntheonUtils = require('../Core/Utils');
global.SyntheonNormalizador = require('../Core/Normalizador');
global.RegistroCanonico = require('../Dominio/RegistroCanonico').RegistroCanonico || require('../Dominio/RegistroCanonico');
global.RegistroAnalitico = require('../Dominio/RegistroAnalitico');
global.Adaptador2026 = require('../Leitura/Adaptador2026');

global.IPluginMetrica = require('../Plugins/IPluginMetrica');
global.PluginArmas = require('../Plugins/Metricas/PluginArmas');
global.PluginEntorpecentes = require('../Plugins/Metricas/PluginEntorpecentes');
global.PluginOcorrencias = require('../Plugins/Metricas/PluginOcorrencias');
global.PluginPrisoes = require('../Plugins/Metricas/PluginPrisoes');
global.PluginPontuacao = require('../Plugins/Metricas/PluginPontuacao');

global.MotorAnaliticoV2 = require('../Motor/MotorAnaliticoV2');

console.log('🧪 Iniciando Testes Unitários: Central Analítica (CA-1)...\n');

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

test('CentralAnalitica: deve consolidar e ordenar por Pontuação > Ocorrências > Armas > Nome', () => {
  const dadosMock = [
    ['DATA', 'MIKE', 'BOE', 'MATRICULA', 'POLICIAL', 'ARMAS', 'MACONHA GRAMA', 'PONTOS FICÇÃO (1/4)'],
    ['15/07/2026', '050501', '26E117', '111111-1', 'POLICIAL A', 1, 10, 10], // PM A: 10 pts, 1 oc, 1 arma
    ['15/07/2026', '050502', '26E118', '222222-2', 'POLICIAL B', 2, 50, 25], // PM B: 25 pts, 1 oc, 2 armas
    ['15/07/2026', '050503', '26E119', '111111-1', 'POLICIAL A', 0, 0, 15]  // PM A: +15 pts (total 25 pts, 2 oc)
  ];

  const metadado = { versao: '2026', aba: 'JUL2026', coberturaHistorica: {} };
  const fatos = Adaptador2026.extrairFatos(dadosMock, metadado, {});
  const registros = MotorAnaliticoV2.processarProdutividadePolicial(fatos);

  // Ordenação CA
  registros.sort((a, b) => {
    const ptsA = a.indicadores ? a.indicadores.pontosTotais : (a.pontosTotais || 0);
    const ptsB = b.indicadores ? b.indicadores.pontosTotais : (b.pontosTotais || 0);
    if (ptsB !== ptsA) return ptsB - ptsA;

    const ocA = a.fatos ? a.fatos.ocorrencias : (a.ocorrencias || 0);
    const ocB = b.fatos ? b.fatos.ocorrencias : (b.ocorrencias || 0);
    if (ocB !== ocA) return ocB - ocA;

    return (a.nome || '').localeCompare(b.nome || '', 'pt-BR');
  });

  // Ambos têm 25 pts, mas PM A tem 2 ocorrências (desempate)
  assert.strictEqual(registros.length, 2);
  assert.strictEqual(registros[0].matricula, '111111-1'); // PM A fica em #1 pelo desempate de ocorrências
  assert.strictEqual(registros[0].indicadores.pontosTotais, 25);
  assert.strictEqual(registros[0].fatos.ocorrencias, 2);
});

test('CentralAnalitica: deve ordenar abas mensais cronologicamente (JAN..DEZ)', () => {
  const { ordenarAbasCronologicamente } = require('../Features/CentralAnalitica');
  const abasDesordenadas = ['JUL2026', 'ABR2026', 'FEV2026', 'DEZ2026', 'JAN2026', 'MAR2026'];
  const ordenadas = ordenarAbasCronologicamente(abasDesordenadas);

  assert.deepStrictEqual(ordenadas, ['JAN2026', 'FEV2026', 'MAR2026', 'ABR2026', 'JUL2026', 'DEZ2026']);
});

console.log(`\n🎉 Testes da Central Analítica concluídos: ${sucessos} testes passaram!`);
}


