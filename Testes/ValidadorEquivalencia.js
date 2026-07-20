/**
 * ARQUIVO: Testes/ValidadorEquivalencia.js
 * FASE 5: Homologação Operacional
 * DESCRIÇÃO: Avalia a conformidade entre a V1 (Legado) e V2 (Nova Arquitetura).
 * Garante o Princípio da Equivalência Funcional executando um teste
 * de colisão matemática e de performance no ambiente real do Google Apps Script.
 */

class ValidadorEquivalencia {
  static compararMotores() {
    const planilha = SpreadsheetApp.getActiveSpreadsheet();
    // Use uma aba real para o teste (ajuste se necessário)
    const nomeAbaTeste = "JAN2026"; 
    const sheet = planilha.getSheetByName(nomeAbaTeste);
    
    if (!sheet) {
      Logger.log(`[ERRO] Aba ${nomeAbaTeste} não encontrada. Abortando teste.`);
      return;
    }

    Logger.log("==========================================");
    Logger.log(" INICIANDO HOMOLOGAÇÃO: V1 vs V2 ");
    Logger.log(` ALVO: Aba ${nomeAbaTeste}`);
    Logger.log("==========================================\n");

    // Dicionário de Efetivo (Mock idêntico para ambos)
    let mapaEfetivo = {};
    const abaEfetivo = planilha.getSheetByName('Efetivo');
    if (abaEfetivo) {
       // mapaEfetivo = carregarEfetivo(abaEfetivo);
    }

    // ----------------------------------------------------
    // EXECUÇÃO V1 (Legado)
    // ----------------------------------------------------
    Logger.log(">> Rodando Pipeline V1 (Legado)...");
    const t0_v1 = new Date().getTime();
    
    // ATENÇÃO: As chamadas abaixo dependem de como o V1 foi implementado no seu GAS.
    // O LeitorPlanilhas lia a aba e o Metricas gerava os objetos consolidados.
    // Simulação do fluxo V1:
    // const ocorrenciasV1 = LeitorPlanilhas.lerAba(sheet);
    // const arrayV1 = Metricas.processarProdutividadePolicial(ocorrenciasV1, mapaEfetivo);
    
    // MOCK (Remova no ambiente real e descomente as linhas acima)
    const arrayV1 = []; 
    
    const t1_v1 = new Date().getTime();
    const tempoV1 = t1_v1 - t0_v1;


    // ----------------------------------------------------
    // EXECUÇÃO V2 (Nova Arquitetura)
    // ----------------------------------------------------
    Logger.log(">> Rodando Pipeline V2 (Nova Arquitetura)...");
    const t0_v2 = new Date().getTime();
    
    const metadado2026 = CatalogoEstruturas[FonteDados.OPP_2026];
    const fatosBrutos = Adaptador2026.extrairFatos(sheet, metadado2026, mapaEfetivo);
    const arrayV2 = MotorAnaliticoV2.processarProdutividadePolicial(fatosBrutos);
    
    const t1_v2 = new Date().getTime();
    const tempoV2 = t1_v2 - t0_v2;


    // ----------------------------------------------------
    // COMPARAÇÃO MATEMÁTICA E FUNCIONAL
    // ----------------------------------------------------
    Logger.log("\n==========================================");
    Logger.log(" RESULTADOS DA COMPARAÇÃO ");
    Logger.log("==========================================");
    Logger.log(`Tempo V1: ${tempoV1}ms | Tempo V2: ${tempoV2}ms`);
    
    if (tempoV2 < tempoV1) {
      Logger.log(`[PERFORMANCE] V2 é ${(tempoV1/tempoV2).toFixed(2)}x mais rápida! 🚀`);
    }

    // Indexando V1 pela matrícula para busca O(1)
    const mapaV1 = {};
    arrayV1.forEach(reg => {
      mapaV1[reg.matricula] = reg;
    });

    let erros = 0;
    let pmVerificados = 0;

    arrayV2.forEach(regV2 => {
      pmVerificados++;
      const mat = regV2.matricula;
      const regV1 = mapaV1[mat];

      if (!regV1) {
        Logger.log(`[ERRO] V2 gerou o PM ${mat}, mas ele NÃO EXISTE na V1.`);
        erros++;
        return;
      }

      // Função utilitária de checagem
      const check = (campo, val1, val2) => {
        if (val1 !== val2) {
          Logger.log(`❌ Matrícula ${mat} divergência em [${campo}]: V1 = ${val1} | V2 = ${val2}`);
          erros++;
        }
      };

      // Comparação Campo a Campo
      check("Ocorrências", regV1.fatos.ocorrencias, regV2.fatos.ocorrencias);
      check("Armas", regV1.fatos.armas, regV2.fatos.armas);
      check("Maconha", regV1.fatos.maconha, regV2.fatos.maconha);
      check("Cocaína", regV1.fatos.cocaina, regV2.fatos.cocaina);
      check("Crack", regV1.fatos.crack, regV2.fatos.crack);
      check("Drogas Totais", regV1.fatos.drogasTotal, regV2.fatos.drogasTotal);
      check("Pontos Totais", regV1.indicadores.pontosTotais, regV2.indicadores.pontosTotais);

      // Remove do mapaV1 para descobrirmos se sobrou alguém que a V2 ignorou
      delete mapaV1[mat];
    });

    // PMs que estão na V1 mas faltaram na V2
    const pmsFaltandoNaV2 = Object.keys(mapaV1);
    if (pmsFaltandoNaV2.length > 0) {
      Logger.log(`[ERRO] A V1 encontrou ${pmsFaltandoNaV2.length} PMs que a V2 ignorou: ${pmsFaltandoNaV2.join(', ')}`);
      erros += pmsFaltandoNaV2.length;
    }

    Logger.log("\n==========================================");
    if (erros === 0) {
      Logger.log("✅ HOMOLOGAÇÃO BEM-SUCEDIDA!");
      Logger.log(`100% de equivalência matemática validada para ${pmVerificados} policiais.`);
    } else {
      Logger.log(`⚠️ FALHA NA HOMOLOGAÇÃO: ${erros} divergência(s) encontrada(s).`);
      Logger.log("A substituição da V1 NÃO está autorizada.");
    }
    Logger.log("==========================================");
  }
}
