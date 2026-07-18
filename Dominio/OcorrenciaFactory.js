/**
 * ARQUIVO: Dominio/OcorrenciaFactory.js
 * RESPONSABILIDADE: Criar e validar a Ocorrência (Aggregate Root) isolando regras complexas de construção
 */

class OcorrenciaFactory {
  /**
   * Constrói e inicializa uma ocorrência válida a partir de dados brutos de entrada.
   * @param {Object} dados
   * @return {Ocorrencia}
   */
  static criar(dados) {
    if (!dados) {
      throw new ErroValidacaoDominio('OcorrenciaFactory', 'dados', 'Dados para criação não podem ser nulos');
    }

    // Cria o Value Object de ChaveOcorrencia para validação e geração da identidade imutável
    const chaveVO = new ChaveOcorrencia(dados.mike, dados.boe);

    // Resolve a função de conversão de data dependendo do contexto (Apps Script ou Node.js)
    let converterData = null;
    if (typeof converterDataUnificada !== 'undefined') {
      converterData = converterDataUnificada;
    } else if (typeof require !== 'undefined') {
      converterData = require('../Core/Datas').converterDataUnificada;
    }

    if (!converterData) {
      throw new Error('Função de conversão de data (converterDataUnificada) não encontrada.');
    }

    const dataConvertida = converterData(dados.data);
    if (!dataConvertida) {
      throw new ErroValidacaoDominio('OcorrenciaFactory', 'data', `A data fornecida é inválida: "${dados.data}"`);
    }

    const ocorrencia = new Ocorrencia(
      chaveVO.valor,
      dataConvertida,
      dados.cidade,
      dados.bairro
    );

    ocorrencia.mike = chaveVO.mike;
    ocorrencia.boe = chaveVO.boe;
    ocorrencia.hora = dados.hora ? String(dados.hora).trim() : null;
    ocorrencia.ais = dados.ais !== undefined && dados.ais !== null ? Number(dados.ais) : null;
    ocorrencia.detidos = Number(dados.detidos) || 0;
    ocorrencia.origemEntrada = dados.origemEntrada || 'MANUAL';

    // Adiciona Naturezas
    if (Array.isArray(dados.naturezas)) {
      dados.naturezas.forEach(n => ocorrencia.adicionarNatureza(n));
    } else if (dados.natureza) {
      ocorrencia.adicionarNatureza(dados.natureza);
    }

    return ocorrencia;
  }

  /**
   * Valida regras de negócio do Domínio e integridade da ocorrência.
   * @param {Ocorrencia} ocorrencia
   * @return {Object} { valido: boolean, erros: Array<string>, ocorrencia: Ocorrencia }
   */
  static validar(ocorrencia) {
    const erros = [];

    if (!ocorrencia) {
      return { valido: false, erros: ['Instância da ocorrência é nula ou indefinida'], ocorrencia };
    }

    if (!ocorrencia.data) {
      erros.push("Data da ocorrência é obrigatória.");
    }

    if (ocorrencia.equipe.quantidadeIntegrantes === 0) {
      erros.push("A ocorrência deve possuir pelo menos um policial militar na equipe.");
    }

    if (ocorrencia.naturezas.length === 0) {
      erros.push("A ocorrência deve possuir pelo menos uma natureza cadastrada.");
    }

    return {
      valido: erros.length === 0,
      erros,
      ocorrencia
    };
  }
}

// Para exportação no Node.js durante os testes locais
if (typeof module !== 'undefined' && module.exports) {
  const { ErroValidacaoDominio } = require('../Core/Erros');
  const { ChaveOcorrencia } = require('./ValueObjects/ChaveOcorrencia');
  const { Ocorrencia } = require('./Ocorrencia');
  module.exports = { OcorrenciaFactory };
}
