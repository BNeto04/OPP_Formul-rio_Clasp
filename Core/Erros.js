/**
 * ARQUIVO: Core/Erros.js
 * RESPONSABILIDADE: Definir classes de erros personalizadas para o ecossistema SYNTHÉON.
 */

class ErroValidacaoDominio extends Error {
  constructor(entidade, campo, mensagem) {
    super(`[Validação de Domínio - ${entidade}] O campo '${campo}' é inválido: ${mensagem}`);
    this.name = 'ErroValidacaoDominio';
    this.entidade = entidade;
    this.campo = campo;
    this.mensagem = mensagem;
  }
}

// Para permitir importação no Node.js durante testes locais
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ErroValidacaoDominio };
}
