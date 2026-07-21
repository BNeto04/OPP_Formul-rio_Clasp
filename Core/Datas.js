/**
 * Converte de forma robusta qualquer entrada para um objeto Date do JS.
 * Trata Date nativo, strings brasileiras (com/sem horário), congela horário e evita inversão de dia/mês.
 * 
 * @param {*} valor - O dado bruto da célula.
 * @return {Date|null} O objeto Date com horário zerado ou null se inválido.
 */
function converterDataUnificada(valor) {
  // 1. Tratar Date nativo do Google Sheets
  if (valor instanceof Date) {
    if (isNaN(valor.getTime())) return null;
    
    // Criar nova instância para não alterar o objeto original e congelar horário
    const dataNativa = new Date(valor.getTime());
    dataNativa.setHours(0, 0, 0, 0);
    return dataNativa;
  }

  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  const texto = String(valor).trim();

  // 2. Regex brasileira robusta que aceita e parseia DD/MM/YYYY com ou sem HH:MM:SS (com âncora $)
  const partesBr = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}):(\d{2}))?$/);
  if (partesBr) {
    const dia = Number(partesBr[1]);
    const mes = Number(partesBr[2]) - 1; // Meses no JS são base 0
    const ano = Number(partesBr[3]);
    const hora = partesBr[4] ? Number(partesBr[4]) : 0;
    const min = partesBr[5] ? Number(partesBr[5]) : 0;
    const seg = partesBr[6] ? Number(partesBr[6]) : 0;
    
    const dataGerada = new Date(ano, mes, dia, hora, min, seg);
    
    // Validar datas inexistentes (ex: 31/02 transformado pelo JS em 03/03)
    if (
      dataGerada.getFullYear() !== ano ||
      dataGerada.getMonth() !== mes ||
      dataGerada.getDate() !== dia
    ) {
      return null;
    }
    
    // Congelar horário para evitar variações de fuso horário local
    dataGerada.setHours(0, 0, 0, 0);
    return dataGerada;
  }

  // Sem fallback - qualquer formato que não corresponda à regex acima é rejeitado por segurança
  return null;
}

// Para exportação no Node.js durante os testes locais
function formatarDataBR(data) {
  if (!data || !(data instanceof Date) || isNaN(data.getTime())) return '';
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = data.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { converterDataUnificada, formatarDataBR };
}
