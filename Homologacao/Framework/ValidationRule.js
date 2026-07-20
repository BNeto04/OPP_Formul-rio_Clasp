/**
 * ARQUIVO: Homologacao/Framework/ValidationRule.js
 * DESCRIÇÃO: Regra rica de validação que compara dois valores
 * e produz um objeto diagnóstico detalhado.
 */
class ValidationRule {
  /**
   * Compara o valor obtido na V2 com o esperado na V1.
   * @param {string} metrica Nome da métrica.
   * @param {*} valorV1 Valor originado na V1 (Esperado)
   * @param {*} valorV2 Valor originado na V2 (Obtido)
   * @returns {Object} { status, diferenca, diagnostico }
   */
  static comparar(metrica, valorV1, valorV2) {
    const saoIguais = valorV1 === valorV2;
    const dif = (typeof valorV1 === 'number' && typeof valorV2 === 'number') 
                ? (valorV2 - valorV1) 
                : (saoIguais ? 0 : "Diferença em Tipo/Texto");
    
    let diag = null;
    if (!saoIguais) {
      diag = `A métrica '${metrica}' divergiu. Esperado (V1): ${valorV1}. Obtido (V2): ${valorV2}.`;
    }

    return {
      status: saoIguais ? 'PASS' : 'FAIL',
      diferenca: dif,
      diagnostico: diag
    };
  }
}
