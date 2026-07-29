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
require('./TestCentralAnalitica');

console.log('\n====================================================');
console.log('✨ TODAS AS SUÍTES FORAM EXECUTADAS COM SUCESSO!');
console.log('====================================================');
}
