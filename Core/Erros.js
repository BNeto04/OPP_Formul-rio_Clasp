/**
 * ARQUIVO: Core/Erros.js
 * RESPONSABILIDADE: Definir classes de erros personalizadas para o ecossistema SYNTHEON.
 */

class ErroValidacaoDominio extends Error {
  constructor(entidade, campo, mensagem) {
    super(`[Validacao de Dominio - ${entidade}] O campo '${campo}' e invalido: ${mensagem}`);
    this.name = 'ErroValidacaoDominio';
    this.entidade = entidade;
    this.campo = campo;
    this.mensagem = mensagem;
  }
}

class ErroLeituraAba extends Error {
  constructor(aba, mensagem) {
    super(`[Leitura de Aba - ${aba}] ${mensagem}`);
    this.name = 'ErroLeituraAba';
    this.aba = aba;
    this.mensagem = mensagem;
  }
}

class ErroConfiguracaoInvalida extends Error {
  constructor(chave, mensagem) {
    super(`[Configuracao Invalida - ${chave}] ${mensagem}`);
    this.name = 'ErroConfiguracaoInvalida';
    this.chave = chave;
    this.mensagem = mensagem;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ErroValidacaoDominio,
    ErroLeituraAba,
    ErroConfiguracaoInvalida
  };
}
