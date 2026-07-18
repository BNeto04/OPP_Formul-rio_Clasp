/**
 * ARQUIVO: Dominio/Policial.js
 * RESPONSABILIDADE: Representar a entidade de Domínio Policial
 */

class Policial {
  constructor(matricula, nome, graduacao, pelotao) {
    if (!matricula || String(matricula).trim() === '') {
      throw new ErroValidacaoDominio('Policial', 'matricula', 'Matrícula é obrigatória e não pode ser vazia');
    }
    
    // Limpeza intrínseca da matrícula (somente dígitos)
    this.matricula = String(matricula).replace(/\D/g, '').trim();
    if (this.matricula === '') {
      throw new ErroValidacaoDominio('Policial', 'matricula', 'Matrícula deve conter caracteres numéricos válidos');
    }

    this.nome = nome ? String(nome).trim().toUpperCase() : 'N/I';
    this.graduacao = graduacao ? String(graduacao).trim().toUpperCase() : 'N/I';
    this.pelotao = pelotao ? String(pelotao).trim().toUpperCase() : 'N/I';
  }

  /**
   * Compara se este policial é igual a outro com base na matrícula funcional.
   * @param {Policial} outro
   * @return {boolean}
   */
  equals(outro) {
    if (!outro || !(outro instanceof Policial)) return false;
    return this.matricula === outro.matricula;
  }
}

// Para exportação no Node.js durante os testes locais
if (typeof module !== 'undefined' && module.exports) {
  const { ErroValidacaoDominio } = require('../Core/Erros');
  module.exports = { Policial };
}
