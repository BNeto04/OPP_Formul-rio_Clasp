/**
 * ARQUIVO: Dominio/Droga.js
 * RESPONSABILIDADE: Representar o fato de uma apreensão de entorpecentes
 */

class Droga {
  constructor(tipo, quantidade, unidadeMedida = 'G') {
    if (!tipo || String(tipo).trim() === '') {
      throw new ErroValidacaoDominio('Droga', 'tipo', 'Tipo de droga é obrigatório');
    }

    const qtd = Number(quantidade);
    if (isNaN(qtd) || qtd <= 0) {
      throw new ErroValidacaoDominio('Droga', 'quantidade', 'Quantidade de drogas deve ser maior que zero');
    }

    this.tipo = String(tipo).trim().toUpperCase();
    this.quantidade = qtd;
    this.unidadeMedida = String(unidadeMedida).trim().toUpperCase();
    Object.freeze(this);
  }
}

// Para exportação no Node.js durante os testes locais
if (typeof module !== 'undefined' && module.exports) {
  const { ErroValidacaoDominio } = require('../Core/Erros');
  module.exports = { Droga };
}
