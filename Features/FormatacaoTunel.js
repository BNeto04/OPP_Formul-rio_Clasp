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
 * PITFALL (12/09): a planilha é locale pt_BR (separador ;). A fórmula `<>""` NÃO disparou
 * (cor efetiva ficou branca). Usar ISBLANK()/NOT(ISBLANK()) — sintaxe imune a locale.
 *
 * Entrada headless (clasp run): aplicarFormatacaoChaveAusenteHeadless(nomeAba)
 */

function aplicarFormatacaoChaveAusenteHeadless(nomeAba) {
  const ss = obterSpreadsheetOcorrencias_();
  const sheet = ss.getSheetByName(nomeAba);
  if (!sheet) return { status: 'ERRO', mensagem: 'Aba nao encontrada: ' + nomeAba };

  const maxRows = sheet.getMaxRows();

  // Mantém as regras de OUTROS processos; remove apenas as NOSSAS (colunas B e G) para não duplicar.
  const regrasExistentes = sheet.getConditionalFormatRules().filter(function (regra) {
    return regra.getRanges().every(function (r) {
      const col = r.getColumn();
      return col !== 2 && col !== 7; // 2 = B (DATA), 7 = G (BOE)
    });
  });

  // DATA (col 2 = B): vazia + linha com MIKE -> amarelo
  const rData = sheet.getRange(2, 2, maxRows - 1, 1);
  const regraData = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND(NOT(ISBLANK($E2)); ISBLANK(B2))')
    .setBackground('#FFFF00')
    .setRanges([rData])
    .build();

  // BOE (col 7 = G): vazio + linha com MIKE -> amarelo
  const rBoe = sheet.getRange(2, 7, maxRows - 1, 1);
  const regraBoe = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND(NOT(ISBLANK($E2)); ISBLANK(G2))')
    .setBackground('#FFFF00')
    .setRanges([rBoe])
    .build();

  sheet.setConditionalFormatRules(regrasExistentes.concat([regraData, regraBoe]));

  return {
    status: 'OK',
    aba: nomeAba,
    regrasAplicadas: 2,
    colunas: ['DATA (B)', 'BOE (G)'],
    cor: 'amarelo (#FFFF00)',
    condicao: 'ISBLANK na celula + NOT(ISBLANK($E2)) (linha dentro do túnel)'
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { aplicarFormatacaoChaveAusenteHeadless };
}
