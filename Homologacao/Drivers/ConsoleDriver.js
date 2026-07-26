/**
 * ARQUIVO: Homologacao/Drivers/ConsoleDriver.js
 * DESCRIÇÃO: Imprime o HomologationReport no console
 * do Google Apps Script (Logger).
 */
class ConsoleDriver {
  renderizar(relatorio) {
    Logger.log("==========================================");
    Logger.log(` 📊 ${relatorio.titulo.toUpperCase()} `);
    Logger.log(` 🕒 ${relatorio.dataHora}`);
    Logger.log("==========================================");
    
    Logger.log(`[PERFORMANCE] V1: ${relatorio.estatisticas.tempoV1_ms}ms | V2: ${relatorio.estatisticas.tempoV2_ms}ms`);
    Logger.log("------------------------------------------");
    
    relatorio.resultados.forEach(res => {
      const icone = res.status === 'PASS' ? '✅' : '❌';
      Logger.log(`${icone} [${res.nome}] V1: ${res.v1} | V2: ${res.v2}`);
      if (res.diagnostico) {
        Logger.log(`   └─ ⚠️ DIAGNÓSTICO: ${res.diagnostico}`);
      }
    });

    Logger.log("==========================================");
    if (relatorio.sucessoTotal) {
      Logger.log("🏆 STATUS FINAL: APROVADO (100% DE EQUIVALÊNCIA)");
    } else {
      Logger.log("🛑 STATUS FINAL: REPROVADO (DIVERGÊNCIAS ENCONTRADAS)");
    }
    Logger.log("==========================================");
  }
}
