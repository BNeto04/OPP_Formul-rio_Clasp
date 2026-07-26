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
      PECULIO_ID: "1PJnA8d9sf5CNj0-rt3yIxnwS8BEGfqxRvoyOjCtVHNE"
    },

    RELATORIOS: {
      CABECALHO_BG: "#073763",
      CABECALHO_TXT: "#ffffff",
      TOTAL_BG: "#073763",
      TOTAL_TXT: "#ffffff"
    }
  };

  // Aliases temporarios para compatibilidade com codigo legado.
  config.RELATORIOS['CABEÇALHO_BG'] = config.RELATORIOS.CABECALHO_BG;
  config.RELATORIOS['CABEÇALHO_TXT'] = config.RELATORIOS.CABECALHO_TXT;

  return deepFreeze(config);
})();
