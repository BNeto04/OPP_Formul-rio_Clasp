/**
 * ARQUIVO: Modelos/ModeloProdutividade.js
 * DESCRIÇÃO: Define as regras de exibição e ordenação para o relatório
 * de Produtividade Geral. Delega o preenchimento físico das colunas para o Schema.
 */

class ModeloProdutividade extends IRelatorioModelo {
  constructor() {
    super();
    // Opcionalmente podemos injetar um tema aqui futuramente
  }

  obterTitulo() {
    return "PRODUTIVIDADE_GERAL_V2";
  }

  obterColunas() {
    return ProdutividadeSchema.getHeaders();
  }

  formatarLinha(registroAnalitico) {
    return ProdutividadeSchema.formatarLinha(registroAnalitico);
  }

  ordenarDados(registrosAnaliticos) {
    // A lógica de ordenação sai do Compilador e vem morar no Modelo.
    return registrosAnaliticos.sort((a, b) => {
      // 1. Maior pontuação total primeiro
      if (b.indicadores.pontosTotais !== a.indicadores.pontosTotais) {
        return b.indicadores.pontosTotais - a.indicadores.pontosTotais;
      }
      // 2. Desempate: Mais ocorrências atendidas
      if (b.fatos.ocorrencias !== a.fatos.ocorrencias) {
        return b.fatos.ocorrencias - a.fatos.ocorrencias;
      }
      // 3. Ordem alfabética pelo nome
      if (a.nome && b.nome) {
        return a.nome.localeCompare(b.nome);
      }
      return 0;
    });
  }
}
