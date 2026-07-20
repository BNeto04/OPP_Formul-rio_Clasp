/**
 * ARQUIVO: Homologacao/Tests/TestDrogas.js
 */
function testDrogas(regV1, regV2) {
  const v1 = regV1.fatos.drogasTotal;
  const v2 = regV2.fatos.drogasTotal;
  const val = ValidationRule.comparar("Drogas Totais", v1, v2);
  return { nomeMetrica: "Drogas Totais", v1: v1, v2: v2, ...val };
}
