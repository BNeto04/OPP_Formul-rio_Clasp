/**
 * ARQUIVO: Homologacao/Tests/TestOcorrencias.js
 */
function testOcorrencias(regV1, regV2) {
  const v1 = regV1.fatos.ocorrencias;
  const v2 = regV2.fatos.ocorrencias;
  const val = ValidationRule.comparar("Ocorrências", v1, v2);
  return { nomeMetrica: "Ocorrências", v1: v1, v2: v2, ...val };
}
