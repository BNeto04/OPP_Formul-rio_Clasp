/**
 * ARQUIVO: Temas/TemaPMPE.js
 * DESCRIÇÃO: Encapsula as regras de identidade visual institucionais (Cores, Fontes).
 * Impede o uso de strings hexadecimais chumbadas nos módulos analíticos e de renderização.
 */

class TemaPMPE {
  static get corCabecalho() { return "#d9ead3"; } // Verde suave institucional
  static get corND() { return "#f3f3f3"; } // Cinza para Não Disponível
  static get corFundoPadrao() { return "#ffffff"; }
  
  // Regras de cor institucional
  static corPelotao(pelotao) {
    switch (String(pelotao).toUpperCase()) {
      case "1º PEL": return "#e2efda"; 
      case "2º PEL": return "#ddebf7"; 
      case "3º PEL": return "#fff2cc"; 
      default: return this.corFundoPadrao;
    }
  }

  static corGraduacao(grad) {
    if (grad === "OF" || grad === "TEN" || grad === "CAP") {
      return "#fff2cc"; // Destaque Oficiais
    }
    return this.corFundoPadrao;
  }
}
