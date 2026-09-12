/**
 * ARQUIVO: Features/FormatacaoTunel.js
 * DESCRICAO: Marca visual de "componente da chave ausente" — formatação condicional que pinta
 * de AMARELO as células VAZIAS dos campos da chave do túnel (DATA=B e BOE=G) quando a linha
 * está DENTRO de um túnel (tem MIKE preenchido).
 *
 * Regra do proprietário (12/09): quando faltar componente da chave (DATA|MIKE|BOE), a célula
 * fica amarela para o operador enxergar de relance o que falta. MIKE é o marcador de túnel
 * (não é marcado — vazio = linha em branco). Túnel saudável não pinta nada.
 *
 * Entrada headless (clasp run): aplicarFormatacaoChaveAusenteHeadless(nomeAba)
 */

function aplicarFormatacaoChaveAusenteHeadless(nomeAba) {
  const ss = obterSpreadsheetOcorrencias_();
  const sheet = ss.getSheetByName(nomeAba);
  if (!sheet) return { status: 'ERRO', mensagem: 'Aba nao encontrada: ' + nomeAba };

  const maxRows = sheet.getMaxRows();

  // DATA (col 2 = B): vazia + linha com MIKE -> amarelo
  const rData = sheet.getRange(2, 2, maxRows - 1, 1);
  const regraData = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND($E2<>"", B2="")')
    .setBackground('#FFFF00')
    .setRanges([rData])
    .build();

  // BOE (col 7 = G): vazio + linha com MIKE -> amarelo
  const rBoe = sheet.getRange(2, 7, maxRows - 1, 1);
  const regraBoe = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND($E2<>"", G2="")')
    .setBackground('#FFFF00')
    .setRanges([rBoe])
    .build();

  const regras = sheet.getConditionalFormatRules();
  regras.push(regraData);
  regras.push(regraBoe);
  sheet.setConditionalFormatRules(regras);

  return {
    status: 'OK',
    aba: nomeAba,
    regrasAdicionadas: 2,
    colunas: ['DATA (B)', 'BOE (G)'],
    cor: 'amarelo (#FFFF00)',
    condicao: 'celula vazia + linha com MIKE (dentro do túnel)'
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { aplicarFormatacaoChaveAusenteHeadless };
}
