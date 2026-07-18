/**
 * ARQUIVO: Dominio/ValueObjects/ChaveOcorrencia.js
 * RESPONSABILIDADE: Representar o Value Object identificador de uma ocorrência (Mike/Boe)
 */

class ChaveOcorrencia {
  constructor(mike, boe) {
    this.mike = mike ? String(mike).trim().toUpperCase() : null;
    this.boe = boe ? String(boe).trim().toUpperCase() : null;

    if (!this.mike && !this.boe) {
      throw new ErroValidacaoDominio('ChaveOcorrencia', 'identificador', 'A ocorrência precisa ter pelo menos um número identificador (MIKE ou BOE)');
    }

    this.valor = this.gerar();
    
    // Congela a instância para garantir a imutabilidade do Value Object
    Object.freeze(this);
  }

  /**
   * Gera a representação string única da chave da ocorrência.
   * @return {string}
   */
  gerar() {
    return `${this.mike || 'SEM-MIKE'}|${this.boe || 'SEM-BOE'}`;
  }

  /**
   * Reconstrói o Value Object a partir de sua representação string.
   * @param {string} chaveStr
   * @return {ChaveOcorrencia}
   */
  static fromString(chaveStr) {
    if (!chaveStr || typeof chaveStr !== 'string') {
      throw new ErroValidacaoDominio('ChaveOcorrencia', 'chaveStr', 'Chave string inválida para parse');
    }
    const partes = chaveStr.split('|');
    const mike = partes[0] === 'SEM-MIKE' ? null : partes[0];
    const boe = partes[1] === 'SEM-BOE' ? null : partes[1];
    return new ChaveOcorrencia(mike, boe);
  }
}

// Para exportação no Node.js durante os testes locais
if (typeof module !== 'undefined' && module.exports) {
  const { ErroValidacaoDominio } = require('../../Core/Erros');
  module.exports = { ChaveOcorrencia };
}
