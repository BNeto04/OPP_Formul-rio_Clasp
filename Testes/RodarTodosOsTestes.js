'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/RodarTodosOsTestes.js
 * DESCRIÇÃO: Executor principal de toda a suíte de testes automatizados do SYNTHÉON.
 */

async function main() {
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
  require('./TestIntegracaoArca');
  console.log('');
  require('./TestArcaConsumidores');
  console.log('');
  require('./TestArcaMapaCobertura');
  console.log('');
  require('./TestArcaNormalizadorEfetivo');
  console.log('');
  require('./TestContratoMutacaoSegura');
  console.log('');
  require('./TestDryRunNormalizador');
  console.log('');
  require('./TestExecutorNormalizador');
  console.log('');
  require('./TestReauditoriaNormalizador');
  console.log('');
  require('./TestMenuP3');
  console.log('');
  require('./TestSemRedefinicaoGlobal');
  console.log('');
  require('./TestArcaVeiculoOcr');
  console.log('');
  require('./TestOcrVeiculoRoubado');
  console.log('');
  require('./TestSeletorMesesGuardiao');
  console.log('');
  require('./TestCatalogoPipGuardiao');
  console.log('');
  require('./TestSaudeTuneis');
  console.log('');
  require('./TestCoberturaAuditoria');
  console.log('');
  require('./TestPainelSaude');
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
  require('./TestFormularioAisSei');
  console.log('');
  require('./TestSemanticaArmasQdt');
  console.log('');
  require('./TestOcrEntorpecentesDetidos');
  console.log('');
  require('./TestConversaoDrogas');
  console.log('');
  require('./TestPadroesFormularioQtdODetidos');
  console.log('');
  require('./TestOrdemAntiguidadeEquipe');
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
  console.log('');
  
  const testRefatorNlu = require('./TestVigiaRefatorNluObs');
  if (typeof testRefatorNlu === 'function') {
    await testRefatorNlu();
  }
  console.log('');

  const testModeloMemoria = require('./TestVigiaModeloMemoria');
  if (testModeloMemoria && typeof testModeloMemoria.runTests === 'function') {
    await testModeloMemoria.runTests();
  } else if (typeof testModeloMemoria === 'function') {
    await testModeloMemoria();
  }
  console.log('');

  const testRetomadaV = require('./TestVigiaRetomadaV');
  if (testRetomadaV && typeof testRetomadaV.runTestSuite === 'function') {
    await testRetomadaV.runTestSuite();
  } else if (typeof testRetomadaV === 'function') {
    await testRetomadaV();
  }
  console.log('');

  const testInterlocucao = require('./TestVigiaTelegramInterlocucao');
  if (testInterlocucao && typeof testInterlocucao.testSuite === 'function') {
    await testInterlocucao.testSuite();
  } else if (typeof testInterlocucao === 'function') {
    await testInterlocucao();
  }

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

main().catch(err => {
  console.error('\n❌ Erro fatal durante a execução dos testes:', err);
  process.exit(1);
});

}
