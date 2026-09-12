/**
 * ARQUIVO: Features/FormatacaoTunel.js
 * DESCRICAO: Formatação condicional visual DENTRO do túnel (linha com MIKE=E):
 *   - CINZA claro (#EFEFEF): célula vazia dentro do túnel, EXCETO DATA (B) e BOE (G).
 *   - AMARELO (#FFFF00): célula vazia de componente da chave — DATA (B) ou BOE (G).
 *   - VERMELHO (#FF0000): célula MIKE (E) quando a linha tem arma apreendida (TIPO=M preenchido).
 * Fora do túnel (plantão tranquilo / linha em branco) NÃO pinta nada.
 *
 * Regra do proprietário (12/09):
 *   - vazio dentro do túnel = cinza claro; componente da chave ausente = amarelo;
 *   - arma apreendida = MIKE (E) vermelho; "arma aprendida" = coluna E (MIKE), corrigido pelo dono.
 *
 * PITFALL (12/09): planilha locale pt_BR (separador ;). Fórmula com , (vírgula) e <>"" NÃO
 * dispara (cor efetiva fica branca). Usar SEMICOLON + ISBLANK/NOT(ISBLANK) (imune a locale).
 *
 * Entrada headless (clasp run): aplicarFormatacaoTunelHeadless(nomeAba)
 */

function _ehMinhaRegraFormatacao_(regra) {
  var cond = regra.getBooleanCondition();
  if (!cond) return false;
  var vals = cond.getCriteriaValues();
  return !!vals && vals.length > 0 && String(vals[0]).indexOf('ISBLANK($E2)') !== -1;
}

function aplicarFormatacaoTunelHeadless(nomeAba) {
  const ss = obterSpreadsheetOcorrencias_();
  const sheet = ss.getSheetByName(nomeAba);
  if (!sheet) return { status: 'ERRO', mensagem: 'Aba nao encontrada: ' + nomeAba };

  const maxRows = sheet.getMaxRows();
  const ultimaCol = sheet.getLastColumn(); // AK = 37

  // Preserva regras de outros processos; remove apenas as nossas (fórmulas com ISBLANK($E2)).
  const regrasExistentes = sheet.getConditionalFormatRules().filter(function (regra) {
    return !_ehMinhaRegraFormatacao_(regra);
  });

  // 1) CINZA claro: célula vazia dentro do túnel, exceto DATA (B) e BOE (G)
  const rCinza = sheet.getRange(2, 1, maxRows - 1, ultimaCol);
  const regraCinza = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND(NOT(ISBLANK($E2)); ISBLANK(A2); COLUMN(A2)<>2; COLUMN(A2)<>7)')
    .setBackground('#EFEFEF')
    .setRanges([rCinza])
    .build();

  // 2) AMARELO: DATA (B) vazia + linha com MIKE
  const rData = sheet.getRange(2, 2, maxRows - 1, 1);
  const regraData = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND(NOT(ISBLANK($E2)); ISBLANK(B2))')
    .setBackground('#FFFF00')
    .setRanges([rData])
    .build();

  // 3) AMARELO: BOE (G) vazio + linha com MIKE
  const rBoe = sheet.getRange(2, 7, maxRows - 1, 1);
  const regraBoe = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND(NOT(ISBLANK($E2)); ISBLANK(G2))')
    .setBackground('#FFFF00')
    .setRanges([rBoe])
    .build();

  // 4) VERMELHO: MIKE (E) quando a linha tem arma apreendida (TIPO=M preenchido)
  const rMike = sheet.getRange(2, 5, maxRows - 1, 1);
  const regraMike = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND(NOT(ISBLANK($E2)); NOT(ISBLANK($M2)))')
    .setBackground('#FF0000')
    .setFontColor('#FFFFFF')
    .setRanges([rMike])
    .build();

  sheet.setConditionalFormatRules(regrasExistentes.concat([regraCinza, regraData, regraBoe, regraMike]));

  return {
    status: 'OK',
    aba: nomeAba,
    regrasAplicadas: 4,
    cinza: 'celula vazia dentro do tunel (exceto DATA/BOE)',
    amarelo: 'DATA (B) / BOE (G) vazio dentro do tunel',
    vermelho: 'MIKE (E) com arma apreendida (TIPO preenchido)'
  };
}

// Aplica a formatação em TODOS os meses canônicos (JAN..DEZ) que existirem na planilha.
function aplicarFormatacaoTodosMesesHeadless() {
  const MESES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  const ss = obterSpreadsheetOcorrencias_();
  const aplicados = [];
  for (const m of MESES) {
    const aba = m + '2026';
    if (ss.getSheetByName(aba)) {
      const r = aplicarFormatacaoTunelHeadless(aba);
      aplicados.push({ aba: aba, status: r.status });
    }
  }
  return { status: 'OK', total: aplicados.length, meses: aplicados };
}

// Alias antigo (compatibilidade)
function aplicarFormatacaoChaveAusenteHeadless(nomeAba) {
  return aplicarFormatacaoTunelHeadless(nomeAba);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { aplicarFormatacaoTunelHeadless, aplicarFormatacaoChaveAusenteHeadless, aplicarFormatacaoTodosMesesHeadless };
}
