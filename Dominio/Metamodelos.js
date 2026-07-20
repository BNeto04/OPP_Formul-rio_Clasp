/**
 * ARQUIVO: Dominio/Metamodelos.js
 * PILAR 0: Metamodelo e Catálogo de Estruturas
 * DESCRIÇÃO: Define o catálogo das fontes de dados, informando ao sistema 
 * as capacidades de cada versão e sua cobertura histórica (o que era gravado 
 * e o que não existia na época).
 */
const FonteDados = {
  OPP_2026: "OPP_2026",
  OPP_2025: "OPP_2025",
  FIREBASE_OCORRENCIAS: "FIREBASE_OCORRENCIAS"
};

const CatalogoEstruturas = {
  [FonteDados.OPP_2026]: {
    versao: "2026",
    adaptador: "Adaptador2026", // Nome da classe/objeto que processará os dados
    camposObrigatorios: ["MATRICULA", "DATA", "MIKE"],
    camposOpcionais: ["BOE", "NATUREZA", "CIDADE", "BAIRRO", "AIS", "POLICIAL", "GRAD", "PELOTAO"],
    metricasDisponiveis: ["ARMAS", "MACONHA", "COCAINA", "CRACK", "PONTOS_TOTAIS", "PONTOS_FICCAO", "DETIDOS", "APFD", "TCO", "BOC"],
    coberturaHistorica: {
      armas: true,
      maconha: true,
      cocaina: true,
      crack: true,
      pontosTotais: true,
      pontosIndividuais: true,
      detidos: true,
      apfd: true,
      tco: true,
      boc: true
    }
  },
  [FonteDados.OPP_2025]: {
    versao: "2025",
    adaptador: "Adaptador2025",
    camposObrigatorios: ["MATRICULA", "DATA", "MIKE"],
    camposOpcionais: [],
    metricasDisponiveis: [],
    coberturaHistorica: {
      // Será expandido quando analisarmos o histórico
      armas: true,
      maconha: false, // Exemplo: Em 2025 ainda não diferenciava tipos de drogas
      cocaina: false,
      crack: false,
      pontosTotais: true,
      pontosIndividuais: true,
      detidos: true
    }
  }
};
