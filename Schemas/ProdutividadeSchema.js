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
      registro.ocorrencias,
      registro.qtdBoe,
      registro.pontosTotais,
      registro.mediaPontos,
      registro.armas,
      registro.mediaArmas,
      registro.maconha,
      registro.crack,
      registro.cocaina,
      registro.drogasTotal,
      registro.mediaDrogas,
      registro.detidos
    ];
  }
};
