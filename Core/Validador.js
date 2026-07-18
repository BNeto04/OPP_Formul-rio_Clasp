/**
 * Validador central de dados do ecossistema SYNTHÉON.
 */
const SyntheonValidador = {
  /**
   * Valida se a matrícula é numérica e possui formato correto.
   * @param {string} matricula
   * @return {boolean}
   */
  validarMatricula(matricula) {
    if (!matricula) return false;
    return /^\d+$/.test(matricula);
  },

  /**
   * Valida se o objeto Date gerado é válido e coerente.
   * @param {Date} date
   * @return {boolean}
   */
  validarData(date) {
    if (!date || !(date instanceof Date)) return false;
    return !isNaN(date.getTime());
  },

  /**
   * Valida se as quantidades físicas de armas ou entorpecentes não são negativas.
   * @param {number} valor
   * @return {boolean}
   */
  validarQuantidadeNaoNegativa(valor) {
    return valor >= 0;
  }
};
