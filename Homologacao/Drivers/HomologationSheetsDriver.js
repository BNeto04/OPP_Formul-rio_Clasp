/**
 * ARQUIVO: Homologacao/Drivers/HomologationSheetsDriver.js
 * DESCRIÇÃO: Renderiza o HomologationReport fisicamente
 * em uma aba do Google Sheets.
 */
class HomologationSheetsDriver {
  renderizar(relatorio) {
    const planilha = SpreadsheetApp.getActiveSpreadsheet();
    const nomeAba = "[DEBUG] Homologação";
    
    let aba = planilha.getSheetByName(nomeAba);
    if (!aba) {
      aba = planilha.insertSheet(nomeAba);
    }
    
    aba.clear(); // Limpa testes antigos
    
    // Cabeçalho
    aba.appendRow([relatorio.titulo, relatorio.dataHora, relatorio.sucessoTotal ? "APROVADO ✅" : "REPROVADO ❌"]);
    aba.appendRow([`Tempo V1: ${relatorio.estatisticas.tempoV1_ms}ms`, `Tempo V2: ${relatorio.estatisticas.tempoV2_ms}ms`, ""]);
    aba.appendRow([]);
    aba.appendRow(["MÉTRICA", "V1 (LEGADO)", "V2 (NOVO)", "STATUS", "DIAGNÓSTICO"]);
    
    // Dados
    const dados = relatorio.resultados.map(res => [
      res.nome,
      res.v1,
      res.v2,
      res.status === 'PASS' ? '✅ PASS' : '❌ FAIL',
      res.diagnostico || ""
    ]);
    
    if (dados.length > 0) {
      aba.getRange(aba.getLastRow() + 1, 1, dados.length, 5).setValues(dados);
    }
    
    // Formatação Básica (Apenas para fins de DEBUG visual rápido)
    aba.getRange(1, 1, 4, 5).setFontWeight("bold");
    aba.autoResizeColumns(1, 5);
  }
}
