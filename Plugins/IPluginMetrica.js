/**
 * ARQUIVO: Plugins/IPluginMetrica.js
 * DESCRIÇÃO: Interface/Molde base para todos os plugins de métricas da Central Analítica.
 * Impõe o contrato para inicialização, processamento de linha e consolidação final.
 */
class IPluginMetrica {
  /**
   * Chamado quando um policial é descoberto pela primeira vez no Motor.
   * Útil para injetar as chaves na estrutura (ex: fatos.armas = 0).
   * @param {Object} consolidado O objeto em construção do policial.
   */
  inicializar(consolidado) {
    throw new Error("Metodo inicializar() deve ser implementado pelo Plugin.");
  }

  /**
   * Chamado para cada fato canônico lido na base associado ao policial.
   * @param {RegistroCanonico} fato O fato completo (ocorrência, origem, métricas primárias).
   * @param {Object} pmFato Apenas as métricas do PM nesta linha.
   * @param {Object} consolidado O objeto em construção do policial.
   * @param {string} chaveAtuacao Chave única Ocorrencia+Matricula.
   * @param {boolean} primeiraVezNaOcorrencia True se é a 1ª vez que lemos o PM nesta ocorrência.
   */
  processar(fato, pmFato, consolidado, chaveAtuacao, primeiraVezNaOcorrencia) {
    throw new Error("Metodo processar() deve ser implementado pelo Plugin.");
  }

  /**
   * Chamado após todas as linhas da planilha terem sido lidas.
   * Útil para cálculos finais (ex: somatórios de arrays, médias, rateios finais).
   * @param {Object} consolidado O objeto final do policial.
   */
  finalizar(consolidado) {
    throw new Error("Metodo finalizar() deve ser implementado pelo Plugin.");
  }
}
