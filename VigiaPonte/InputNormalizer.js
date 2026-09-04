/**
 * InputNormalizer.js - Normalizador centralizado de entrada pt-BR
 * 
 * Responsabilidades:
 * - Lowercase determinístico
 * - Remoção / decomposição de acentuação pt-BR (NFD)
 * - Remoção de pontuação irrelevante preservando estrutura essencial
 * - Colapso de múltiplos espaços
 * - Detecção de tokens e normalização de variantes fonéticas/typos
 */

class InputNormalizer {
  /**
   * Normaliza texto em português:
   * - Converte para minúsculas
   * - Remove diacríticos/acentos
   * - Substitui pontuações por espaço simples
   * - Colapsa múltiplos espaços em um único espaço
   * 
   * @param {string} text
   * @returns {string}
   */
  static normalize(text) {
    if (!text || typeof text !== 'string') return '';

    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Extrai tokens normalizados
   * @param {string} text
   * @returns {string[]}
   */
  static tokenize(text) {
    const norm = this.normalize(text);
    if (!norm) return [];
    return norm.split(' ').filter(t => t.length > 0);
  }

  /**
   * Verifica se o texto normalizado contém menção a Antigravity (incluindo typos comuns)
   * Variações cobertas: antigravity, antigraviti, antigravitt, antigravit, antigrav, antigravty
   * 
   * @param {string} normalizedText
   * @returns {boolean}
   */
  static hasAntigravityMention(normalizedText) {
    if (!normalizedText) return false;
    return /\bantigrav[a-z]*\b/i.test(normalizedText) ||
      /\bantigraviti\b/i.test(normalizedText) ||
      /\bantigravty\b/i.test(normalizedText);
  }

  /**
   * Verifica se o texto faz referência anafórica ao sujeito (ele/dele/nele)
   * @param {string} normalizedText 
   * @returns {boolean}
   */
  static hasPronounReference(normalizedText) {
    if (!normalizedText) return false;
    return /\b(ele|dele|nele)\b/i.test(normalizedText);
  }
}

module.exports = InputNormalizer;
