/**
 * ARQUIVO: Homologacao/Tests/TestArmas.js
 */
function testArmas(regV1, regV2) {
  const v1 = regV1.fatos.armas;
  const v2 = regV2.fatos.armas;
  const val = ValidationRule.comparar("Armas", v1, v2);
  return { nomeMetrica: "Armas", v1: v1, v2: v2, ...val };
}
