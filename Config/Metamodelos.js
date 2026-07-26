/**
 * ARQUIVO: Config/Metamodelos.js
 * PILAR 0: Metamodelo e Catálogo de Estruturas
 * DESCRIÇÃO: Define o catálogo das fontes de dados, informando ao sistema 
 * as capacidades de cada versão e sua cobertura histórica.
 */
const FonteDados = Object.freeze({
  OPP_2026: "OPP_2026",
  OPP_2025: "OPP_2025",
  FIREBASE_OCORRENCIAS: "FIREBASE_OCORRENCIAS"
});

const CatalogoEstruturas = (() => {
  const catalog = {
    [FonteDados.OPP_2026]: {
      versao: "2026",
      adaptador: "Adaptador2026",
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
        armas: true,
        maconha: false,
        cocaina: false,
        crack: false,
        pontosTotais: true,
        pontosIndividuais: true,
        detidos: true
      }
    }
  };

  const deepFreeze = obj => {
    Object.getOwnPropertyNames(obj).forEach(prop => {
      const valor = obj[prop];
      if (valor && typeof valor === 'object' && !Object.isFrozen(valor)) {
        deepFreeze(valor);
      }
    });
    return Object.freeze(obj);
  };

  return deepFreeze(catalog);
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FonteDados, CatalogoEstruturas };
}
