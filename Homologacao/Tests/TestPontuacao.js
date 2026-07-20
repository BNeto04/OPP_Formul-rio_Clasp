/**
 * ARQUIVO: Homologacao/Tests/TestPontuacao.js
 */
function testPontuacao(regV1, regV2) {
  const v1 = regV1.indicadores.pontosTotais;
  const v2 = regV2.indicadores.pontosTotais;
  const val = ValidationRule.comparar("Pontos Totais", v1, v2);
  return { nomeMetrica: "Pontuação", v1: v1, v2: v2, ...val };
}
