/**
 * Configuracoes Globais do Ecossistema SYNTHEON.
 */
const CONFIG_SYNTHEON = (() => {
  const deepFreeze = obj => {
    Object.getOwnPropertyNames(obj).forEach(prop => {
      const valor = obj[prop];
      if (valor && typeof valor === 'object' && !Object.isFrozen(valor)) {
        deepFreeze(valor);
      }
    });
    return Object.freeze(obj);
  };

  const config = {
    VERSAO: "1.0.0",
    FUSO_HORARIO: "America/Recife",
    DEBUG: false,

    PLANILHAS: {
      OCORRENCIAS_ID: "1S05sTbd3otgjGjrC-YrzHk7dXp7mzzaw_J2lyQ86hOY",
      PECULIO_ID: "1PJnA8d9sf5CNj0-rt3yIxnwS8BEGfqxRvoyOjCitVHNE"
    },

    ABAS: {
      EFETIVO_ALIASES: ["EFETIVO", "Efetivo", "efetivo"],
      MESES_2026: [
        { nome: 'JAN2026', mes: 0, ano: 2026, label: 'JAN' },
        { nome: 'FEV2026', mes: 1, ano: 2026, label: 'FEV' },
        { nome: 'MAR2026', mes: 2, ano: 2026, label: 'MAR' },
        { nome: 'ABR2026', mes: 3, ano: 2026, label: 'ABR' },
        { nome: 'MAI2026', mes: 4, ano: 2026, label: 'MAI' },
        { nome: 'JUN2026', mes: 5, ano: 2026, label: 'JUN' },
        { nome: 'JUL2026', mes: 6, ano: 2026, label: 'JUL' },
        { nome: 'AGO2026', mes: 7, ano: 2026, label: 'AGO' },
        { nome: 'SET2026', mes: 8, ano: 2026, label: 'SET' },
        { nome: 'OUT2026', mes: 9, ano: 2026, label: 'OUT' },
        { nome: 'NOV2026', mes: 10, ano: 2026, label: 'NOV' },
        { nome: 'DEZ2026', mes: 11, ano: 2026, label: 'DEZ' }
      ]
    },

    RELATORIOS: {
      CABECALHO_BG: "#073763",
      CABECALHO_TXT: "#ffffff",
      TOTAL_BG: "#073763",
      TOTAL_TXT: "#ffffff"
    },

    obterIdOcorrencias() {
      return this.PLANILHAS.OCORRENCIAS_ID;
    },

    obterIdPeculio() {
      return this.PLANILHAS.PECULIO_ID;
    }
  };

  // Aliases temporarios para compatibilidade com codigo legado.
  config.RELATORIOS['CABEÇALHO_BG'] = config.RELATORIOS.CABECALHO_BG;
  config.RELATORIOS['CABEÇALHO_TXT'] = config.RELATORIOS.CABECALHO_TXT;

  return deepFreeze(config);
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG_SYNTHEON;
}
