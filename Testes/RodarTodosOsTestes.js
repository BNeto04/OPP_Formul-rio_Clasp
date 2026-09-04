'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/RodarTodosOsTestes.js
 * DESCRIÇÃO: Executor principal de toda a suíte de testes automatizados do SYNTHÉON.
 */

console.log('====================================================');
console.log('🚀 EXECUTANDO SUÍTE INTEGRAL DE TESTES DO SYNTHÉON');
console.log('====================================================\n');

require('./TestDominio');
console.log('');
require('./TestPlugins');
console.log('');
require('./TestMotorAnaliticoRegressao');
console.log('');
require('./TestAdaptador2026');
console.log('');
require('./TestGuardiao');
console.log('');
require('./TestRenderers');
console.log('');
require('./TestRendererComparativo2026');
console.log('');
require('./TestRelatoriosPipCpm');
console.log('');
require('./TestRelatorioArmas');
console.log('');
require('./TestRelatorioDrogas');
console.log('');
require('./TestCentralAnalitica');
console.log('');
require('./TestMeritoEquipeArmas');
console.log('');
require('./TestLeitorAntiguidadePeculio');
console.log('');
require('./TestRelatorioGxt');
console.log('');
require('./TestEntradaManualFormulario');
console.log('');
require('./TestNormalizadorEfetivo');
console.log('');
require('./TestFormularioCidadeBairro');
console.log('');
require('./TestFormularioAis');
console.log('');
require('./TestVigiaPonte');
console.log('');
require('./TestVigiaBootRecovery');
console.log('');
require('./TestVigiaTelegram');
console.log('');
require('./TestVigiaNaturalLanguage');
console.log('');
require('./TestVigiaObservarAntigravity');

if (process.exitCode && process.exitCode !== 0) {
  console.error('\n====================================================');
  console.error('❌ SUÍTE DE TESTES FALHOU! VERIFIQUE OS ERROS ACIMA.');
  console.error('====================================================\n');
  process.exit(1);
} else {
  console.log('\n====================================================');
  console.log('✨ TODAS AS SUÍTES FORAM EXECUTADAS COM SUCESSO!');
  console.log('====================================================\n');
  process.exit(0);
}
}
