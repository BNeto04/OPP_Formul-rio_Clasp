/**
 * ARQUIVO: Schemas/ProdutividadeSchema.js
 * DESCRIÇÃO: Define a estrutura, cabeçalhos e formatação do relatório de produtividade
 */
const ProdutividadeSchema = {
  HEADERS: [
    "MATRÍCULA",
    "NOME",
    "GRADUAÇÃO",
    "PELOTÃO",
    "QTD O",
    "QTD BOE",
    "PONTUAÇÃO",
    "MÉDIA PONTOS/O",
    "ARMAS",
    "ARMAS/O",
    "MACONHA (G)",
    "CRACK (G)",
    "COCAÍNA (G)",
    "TOTAL DROGAS",
    "DROGAS/O",
    "DETIDOS"
  ],
  
  /**
   * Converte o RegistroAnalítico para o array ordenado conforme HEADERS
   */
  extrairLinha(registro) {
    return [
      registro.matricula,
      registro.nome,
      registro.grad,
      registro.pelotao,
      registro.fatos.ocorrencias,
      registro.fatos.qtdBoe,
      registro.indicadores.pontosTotais,
      registro.mediaPontos,
      registro.fatos.armas,
      registro.mediaArmas,
      registro.fatos.maconha,
      registro.fatos.crack,
      registro.fatos.cocaina,
      registro.fatos.drogasTotal,
      registro.mediaDrogas,
      registro.fatos.detidos
    ];
  }
};
