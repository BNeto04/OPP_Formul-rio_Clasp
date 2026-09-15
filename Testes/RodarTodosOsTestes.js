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
  require('./TestArcaContagemDerivada');
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
  require('./TestGuardiaoHeadless');
  require('./TestMunicaoPipOcr');
  require('./TestEntradaManualDryRun');
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
  // #172 (F1): o `require('./TestNormalizadorEfetivo')` foi REMOVIDO daqui por ser REFERENCIA FANTASMA.
  // O arquivo nao existe no repositorio: foi removido do Git em `9656bc8` ("remove do Git o WIP local
  // TestNormalizadorEfetivo.js capturado pelo commit 9632d31") e continuava exigido pelo runner, o que
  // derrubava a suite inteira num checkout limpo (MODULE_NOT_FOUND). O slot do Normalizador Efetivo
  // permanece coberto, de forma rastreada, por: TestArcaNormalizadorEfetivo (l.30), TestDryRunNormalizador
  // (l.36), TestExecutorNormalizador (l.38), TestReauditoriaNormalizador (l.40) e TestOrdemAntiguidadeEquipe
  // (l.99). A fechadura `Testes/TestReferenciaFantasma.js` impede a volta da referencia fantasma.
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
  {
    const testHandoff32_14 = require('./TestValidarHandoffContrato32_14');
    if (typeof testHandoff32_14 === 'function') {
      await testHandoff32_14();
    }
  }
  console.log('');
  {
    const testPortas12_6 = require('./TestValidarChecklistProducaoPortas');
    if (typeof testPortas12_6 === 'function') {
      await testPortas12_6();
    }
  }
  console.log('');
  require('./TestGuardiaoHeadlessEfeitoDeclarado');
  console.log('');
  require('./TestSerializacaoEscrita');
  console.log('');
  {
    // #167 [DP24-004] - fechadura do vinculo §31.6 (tecnologia existente) + Vigia de dependencias §7.8
    const testVigiaDependencias = require('./TestVigiaDependencias');
    if (typeof testVigiaDependencias === 'function') {
      testVigiaDependencias();
    }
  }
  console.log('');
  {
    // #168 [DP24-005] - fechadura do §46.11 (Markdown DERIVADO do YAML canonico) e do §46.13
    // (relatorio do Curador estrutural). §46.14 entra como homologacao (implantado no #167).
    const testCuradorEstrutural = require('./TestCuradorEstrutural');
    if (typeof testCuradorEstrutural === 'function') {
      testCuradorEstrutural();
    }
  }
  console.log('');
  {
    // #169 [DP24-006] - fechadura da INSTALACAO TRANSVERSAL INST-NANO-001 (Nano Task de 9 blocos +
    // ferramentas deterministicas NM-OBS-*), colhida do laboratorio dp24-nano-lab. Esta fechadura
    // executa a bancada da propria instalacao e exige exit 0 dela: contador de PASS nao substitui
    // exit code, e instalacao que nao roda nao esta instalada.
    const testNanoMachines = require('./TestNanoMachines');
    if (typeof testNanoMachines === 'function') {
      testNanoMachines();
    }
  }
  console.log('');
  {
    // #172 (F1) - fechadura contra REFERENCIA FANTASMA: todo `require` do runner tem de resolver para
    // arquivo existente E rastreado no Git. Nasceu VERMELHA (TestNormalizadorEfetivo) e ficou verde
    // quando o require fantasma saiu do runner.
    const testReferenciaFantasma = require('./TestReferenciaFantasma');
    if (typeof testReferenciaFantasma === 'function') {
      testReferenciaFantasma();
    }
  }
  console.log('');
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
