/**
 * ARQUIVO: Dominio/Equipe.js
 * RESPONSABILIDADE: Agregar e gerenciar a lista de policiais na ocorrência sem duplicidades
 */

class Equipe {
  constructor() {
    this.policiais = [];
  }

  /**
   * Adiciona um policial à equipe caso ele não esteja cadastrado (comparação por matrícula).
   * @param {Policial} policial
   */
  adicionarPolicial(policial) {
    if (!policial || !(policial instanceof Policial)) {
      throw new ErroValidacaoDominio('Equipe', 'policial', 'Deve ser uma instância válida de Policial');
    }
    
    const jaExiste = this.policiais.some(p => p.equals(policial));
    if (!jaExiste) {
      this.policiais.push(policial);
    }
  }

  /**
   * Retorna uma cópia da lista de policiais.
   * @return {Array<Policial>}
   */
  obterPoliciais() {
    return [...this.policiais];
  }

  /**
   * Retorna a quantidade de policiais na equipe.
   * @return {number}
   */
  get quantidadeIntegrantes() {
    return this.policiais.length;
  }
}

// Para exportação no Node.js durante os testes locais
if (typeof module !== 'undefined' && module.exports) {
  const { ErroValidacaoDominio } = require('../Core/Erros');
  const { Policial } = require('./Policial');
  module.exports = { Equipe };
}
