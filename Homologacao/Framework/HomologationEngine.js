/**
 * ARQUIVO: Homologacao/Framework/HomologationEngine.js
 * DESCRIÇÃO: Orquestrador da suíte de homologação.
 * Agrega os testes isolados e gera o HomologationReport.
 */
class HomologationEngine {
  constructor(driverVisual) {
    this.driver = driverVisual; // Ex: ConsoleDriver, HomologationSheetsDriver
    this.testes = [];
  }

  registrarTeste(funcaoTeste) {
    this.testes.push(funcaoTeste);
  }

  executar(sheet, metadado, mapaEfetivo) {
    const relatorio = new HomologationReport("Homologação V1 x V2");
    const comparator = new Comparator();

    // 1. Extração Massiva
    const { arrayV1, arrayV2, tempos } = comparator.extrairDatasets(sheet, metadado, mapaEfetivo);
    const { mapaV1, mapaV2 } = comparator.parearDatasets(arrayV1, arrayV2);
    
    relatorio.setTemposExecucao(tempos.tempoV1, tempos.tempoV2);

    // 2. Loop sobre o Universo de Dados (Usaremos V2 como referência de tamanho, mas validaremos falhas em V1)
    Object.keys(mapaV2).forEach(mat => {
      const regV1 = mapaV1[mat];
      const regV2 = mapaV2[mat];

      if (!regV1) {
        relatorio.adicionarResultado("Integridade", 1, 0, "FAIL", -1, `PM ${mat} não existe na V1, mas apareceu na V2.`);
        return;
      }

      // Rodar suíte de testes individuais para este policial
      this.testes.forEach(teste => {
         const res = teste(regV1, regV2);
         if (res && res.status !== 'PASS') {
           relatorio.adicionarResultado(res.nomeMetrica, res.v1, res.v2, res.status, res.diferenca, `PM ${mat}: ${res.diagnostico}`);
         }
      });
      
      // Remove do mapa V1 para verificarmos quem sobrou
      delete mapaV1[mat];
    });

    const pmsFaltandoNaV2 = Object.keys(mapaV1);
    if (pmsFaltandoNaV2.length > 0) {
      relatorio.adicionarResultado("Integridade", pmsFaltandoNaV2.length, 0, "FAIL", pmsFaltandoNaV2.length, `V1 encontrou PMs ignorados pela V2: ${pmsFaltandoNaV2.join(', ')}`);
    }

    // Se nenhum teste falhou individualmente, adicionamos um 'Passou Limpo' por métrica?
    // Ou delegamos a emissão da métrica de forma macro. 
    // Para simplificar, se não houver registros de erro, adicionamos sucesso macro:
    if (relatorio.sucessoTotal) {
       relatorio.adicionarResultado("Geral", "OK", "OK", "PASS", 0, "100% de Equivalência para todas as métricas validadas.");
    }

    // 3. Renderização no Driver escolhido
    this.driver.renderizar(relatorio);
    return relatorio;
  }
}
