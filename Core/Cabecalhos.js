/**
 * ARQUIVO: Core/Cabecalhos.js
 * DESCRIÇÃO: Mecanismo central para normalização, indexação e localização flexível de cabeçalhos.
 */
const SyntheonCabecalhos = {
  /**
   * Normaliza um nome de cabeçalho removendo acentos, espaços extras e convertendo para maiúsculas.
   * @param {*} valor
   * @return {string}
   */
  normalizar(valor) {
    if (typeof SyntheonUtils !== 'undefined' && typeof SyntheonUtils.normalizarTexto === 'function') {
      return SyntheonUtils.normalizarTexto(valor);
    }
    return String(valor || '')
      .trim()
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  },

  /**
   * Mapeia um array de cabeçalhos brutos em um mapa { headerNormalizado: indice0Based }.
   * @param {Array} headers 
   * @returns {Object.<string, number>}
   */
  criarIndice(headers) {
    const mapa = {};
    if (!Array.isArray(headers)) return mapa;
    headers.forEach((h, index) => {
      const norm = this.normalizar(h);
      if (norm && mapa[norm] === undefined) {
        mapa[norm] = index;
      }
    });
    return mapa;
  },

  /**
   * Localiza o índice de uma coluna a partir de uma lista de aliases ou chave oficial.
   * @param {Array<string>|Object.<string, number>} headersOuIndice - Array de cabeçalhos brutos ou mapa de índice.
   * @param {string|Array<string>} aliases - Chave alias em CONSTANTES_SYNTHEON.ALIASES ou vetor de opções.
   * @param {boolean} [obrigatorio=false] - Se true, lança erro se não encontrar.
   * @param {string} [nomeCampo=''] - Nome descritivo do campo para mensagem de erro.
   * @returns {number} Índice (0-based) ou -1 se não localizado.
   */
  encontrar(headersOuIndice, aliases, obrigatorio = false, nomeCampo = '') {
    let listaAliases = [];

    if (typeof aliases === 'string') {
      if (typeof CONSTANTES_SYNTHEON !== 'undefined' && CONSTANTES_SYNTHEON.ALIASES && CONSTANTES_SYNTHEON.ALIASES[aliases]) {
        listaAliases = CONSTANTES_SYNTHEON.ALIASES[aliases];
      } else {
        listaAliases = [aliases];
      }
    } else if (Array.isArray(aliases)) {
      listaAliases = aliases;
    }

    const opcoesNormalizadas = listaAliases.map(a => this.normalizar(a));

    let idx = -1;

    if (Array.isArray(headersOuIndice)) {
      const headersNorm = headersOuIndice.map(h => this.normalizar(h));
      
      // 1. Busca Exata
      for (const opcao of opcoesNormalizadas) {
        idx = headersNorm.indexOf(opcao);
        if (idx !== -1) break;
      }
      // 2. Busca Parcial (.includes)
      if (idx === -1) {
        for (const opcao of opcoesNormalizadas) {
          idx = headersNorm.findIndex(h => h.includes(opcao));
          if (idx !== -1) break;
        }
      }
    } else if (headersOuIndice && typeof headersOuIndice === 'object') {
      // 1. Busca Exata no mapa
      for (const opcao of opcoesNormalizadas) {
        if (headersOuIndice[opcao] !== undefined) {
          idx = headersOuIndice[opcao];
          break;
        }
      }
      // 2. Busca Parcial no mapa
      if (idx === -1) {
        const chaves = Object.keys(headersOuIndice);
        for (const opcao of opcoesNormalizadas) {
          const chaveEncontrada = chaves.find(c => c.includes(opcao));
          if (chaveEncontrada) {
            idx = headersOuIndice[chaveEncontrada];
            break;
          }
        }
      }
    }

    if (idx === -1 && obrigatorio) {
      const campoDesc = nomeCampo || (typeof aliases === 'string' ? aliases : listaAliases.join('/'));
      throw new Error(`Cabeçalho obrigatório para '${campoDesc}' não localizado. Opções aceitas: ${listaAliases.join(', ')}.`);
    }

    return idx;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SyntheonCabecalhos;
}
