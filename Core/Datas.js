/**
 * ARQUIVO: Core/Datas.js
 * DESCRIÇÃO: Módulo de utilitários de data do ecossistema SYNTHÉON.
 * Encapsulado sob o namespace SyntheonDatas mantendo aliases globais para compatibilidade.
 */

const SyntheonDatas = {
  /**
   * Converte de forma robusta qualquer entrada para um objeto Date do JS.
   * Trata Date nativo, strings brasileiras (com/sem horário), congela horário e evita inversão de dia/mês.
   * @param {*} valor - O dado bruto da célula.
   * @return {Date|null} O objeto Date com horário zerado ou null se inválido.
   */
  converterDataUnificada(valor) {
    if (valor instanceof Date) {
      if (isNaN(valor.getTime())) return null;
      const dataNativa = new Date(valor.getTime());
      dataNativa.setHours(0, 0, 0, 0);
      return dataNativa;
    }

    if (valor === null || valor === undefined || valor === "") {
      return null;
    }

    const texto = String(valor).trim();
    const partesBr = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}):(\d{2}))?$/);
    if (partesBr) {
      const dia = Number(partesBr[1]);
      const mes = Number(partesBr[2]) - 1;
      const ano = Number(partesBr[3]);
      const hora = partesBr[4] ? Number(partesBr[4]) : 0;
      const min = partesBr[5] ? Number(partesBr[5]) : 0;
      const seg = partesBr[6] ? Number(partesBr[6]) : 0;
      
      const dataGerada = new Date(ano, mes, dia, hora, min, seg);
      if (
        dataGerada.getFullYear() !== ano ||
        dataGerada.getMonth() !== mes ||
        dataGerada.getDate() !== dia
      ) {
        return null;
      }
      dataGerada.setHours(0, 0, 0, 0);
      return dataGerada;
    }

    return null;
  },

  /**
   * Formata um objeto Date no padrão brasileiro DD/MM/YYYY.
   * @param {Date} data
   * @return {string}
   */
  formatarDataBR(data) {
    if (!data || !(data instanceof Date) || isNaN(data.getTime())) return '';
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
  }
};

// Aliases globais de compatibilidade para código legado e chamadas diretas no Apps Script
function converterDataUnificada(valor) {
  return SyntheonDatas.converterDataUnificada(valor);
}

function formatarDataBR(data) {
  return SyntheonDatas.formatarDataBR(data);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SyntheonDatas,
    converterDataUnificada,
    formatarDataBR
  };
}
