/**
 * ARQUIVO: Dominio/Arma.js
 * RESPONSABILIDADE: Representar o fato de uma apreensão de arma
 */

class Arma {
  constructor(tipo, quantidade, calibre = 'N/I') {
    if (!tipo || String(tipo).trim() === '') {
      throw new ErroValidacaoDominio('Arma', 'tipo', 'Tipo de arma é obrigatório');
    }

    const qtd = Number(quantidade);
    if (isNaN(qtd) || qtd < 1) {
      throw new ErroValidacaoDominio('Arma', 'quantidade', 'Quantidade de armas deve ser maior ou igual a 1');
    }

    this.tipo = String(tipo).trim().toUpperCase();
    this.quantidade = qtd;
    this.calibre = String(calibre).trim().toUpperCase();
    Object.freeze(this);
  }
}

// Para exportação no Node.js durante os testes locais
if (typeof module !== 'undefined' && module.exports) {
  if (typeof ErroValidacaoDominio === 'undefined') {
    global.ErroValidacaoDominio = require('../Core/Erros').ErroValidacaoDominio;
  }
  module.exports = { Arma };
}

