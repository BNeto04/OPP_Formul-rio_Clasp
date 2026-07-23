/**
 * Normalizador central de dados do ecossistema SYNTHÉON.
 */
const SyntheonNormalizador = {
  /**
   * Normaliza graduações de policiais para siglas padronizadas.
   * @param {string} rawGrad
   * @return {string}
   */
  normalizarGraduacao(rawGrad) {
    const limpo = SyntheonUtils.normalizarTexto(rawGrad);
    const chaveSemOrdinal = this.normalizarChaveGraduacao(limpo);
    return CONSTANTES_SYNTHEON.GRADUACOES[limpo]
      || CONSTANTES_SYNTHEON.GRADUACOES[chaveSemOrdinal]
      || limpo
      || 'N/I';
  },

  normalizarChaveGraduacao(valor) {
    return SyntheonUtils.normalizarTexto(valor)
      .replace(/[º°ª]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  },

  /**
   * Normaliza a identificação de pelotões / escalas (ex: "1ºPEL" -> "1º PEL").
   * @param {string} rawPel
   * @return {string}
   */
  normalizarPelotao(rawPel) {
    let limpo = SyntheonUtils.normalizarTexto(rawPel);
    if (!limpo) return 'N/I';

    // Se bater com "1º PEL", "1ºPEL", "1 PEL", "PEL 1", etc.
    if (/^1[º°O]?\s*PEL/i.test(limpo) || /^PEL\s*1/i.test(limpo)) {
      return '1º PEL';
    }
    if (/^2[º°O]?\s*PEL/i.test(limpo) || /^PEL\s*2/i.test(limpo)) {
      return '2º PEL';
    }
    if (/^3[º°O]?\s*PEL/i.test(limpo) || /^PEL\s*3/i.test(limpo)) {
      return '3º PEL';
    }
    if (limpo.includes('OFICIAIS')) {
      return 'OFICIAIS';
    }
    if (limpo.includes('GTAR')) {
      return 'GTAR';
    }
    if (limpo.includes('CPM')) {
      return 'CPM';
    }

    return limpo; // Retorna o valor limpo original se não bater nos padrões
  }
};
