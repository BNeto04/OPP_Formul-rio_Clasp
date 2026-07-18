/**
 * Utilitários diversos do ecossistema SYNTHÉON.
 */
const SyntheonUtils = {
  /**
   * Limpa a matrícula funcional, removendo qualquer caractere não-numérico.
   * @param {*} valor
   * @return {string}
   */
  limparMatricula(valor) {
    return String(valor || '').replace(/\D/g, '').trim();
  },

  /**
   * Converte strings numéricas brasileiras para number de forma segura.
   * @param {*} valor
   * @return {number}
   */
  converterNumero(valor) {
    if (typeof valor === 'number') {
      return isNaN(valor) ? 0 : valor;
    }
    if (valor === null || valor === undefined || valor === '') {
      return 0;
    }
    const texto = String(valor)
      .replace(/\./g, '')
      .replace(',', '.')
      .trim();
    const numero = Number(texto);
    return isNaN(numero) ? 0 : numero;
  },

  /**
   * Remove acentuação, espaços nulos e deixa em maiúsculo.
   * @param {*} valor
   * @return {string}
   */
  normalizarTexto(valor) {
    return String(valor || '')
      .trim()
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  },

  /**
   * Localiza a coluna de um cabeçalho através de uma lista de aliases.
   * @param {Array<string>} headers - Cabeçalhos da planilha limpos/normalizados.
   * @param {string} chaveAlias - Chave definida no ALIASES de Constantes.js.
   * @return {number} Índice (0-based) ou -1 se não localizado.
   */
  localizarColuna(headers, chaveAlias) {
    const aliases = CONSTANTES_SYNTHEON.ALIASES[chaveAlias] || [chaveAlias];
    const opcoesNormalizadas = aliases.map(alias => this.normalizarTexto(alias));

    // 1. Procura match exato
    for (const opcao of opcoesNormalizadas) {
      const idx = headers.indexOf(opcao);
      if (idx !== -1) return idx;
    }

    // 2. Procura match por contenção (parcial)
    for (const opcao of opcoesNormalizadas) {
      const idx = headers.findIndex(h => h.includes(opcao));
      if (idx !== -1) return idx;
    }

    return -1;
  }
};
