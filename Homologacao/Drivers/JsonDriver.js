/**
 * ARQUIVO: Homologacao/Drivers/JsonDriver.js
 * DESCRIÇÃO: Exporta o HomologationReport como uma string JSON pura.
 */
class JsonDriver {
  renderizar(relatorio) {
    const saida = JSON.stringify(relatorio, null, 2);
    // No GAS, isso poderia ser retornado para um ContentService (API)
    // ou salvo em um arquivo no Google Drive.
    Logger.log(saida);
    return saida;
  }
}
