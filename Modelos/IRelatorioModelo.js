/**
 * ARQUIVO: Modelos/IRelatorioModelo.js
 * PILAR 4: Modelos de Relatório (A Estrutura Lógica)
 * DESCRIÇÃO: Interface base para todos os relatórios da Central Analítica.
 * Define o contrato de formatação, agrupamento e ordenação, tirando essa 
 * responsabilidade do orquestrador (Feature).
 */

class IRelatorioModelo {
  obterTitulo() {
    throw new Error("Método 'obterTitulo()' deve ser implementado.");
  }

  obterColunas() {
    throw new Error("Método 'obterColunas()' deve ser implementado.");
  }

  ordenarDados(registrosAnaliticos) {
    throw new Error("Método 'ordenarDados(registrosAnaliticos)' deve ser implementado.");
  }

  formatarLinha(registroAnalitico) {
    throw new Error("Método 'formatarLinha(registroAnalitico)' deve ser implementado.");
  }
}
