/**
 * ARQUIVO: Features/CorretorArmaArtesanal.js
 * DESCRICAO: Corretor pontual de ARMA artesanal — zera a coluna ARMA (L) nas linhas
 * cujo TIPO (M) é artesanal (ARTESANAL / CASEIRA), conforme regra do proprietário (12/09):
 * arma artesanal NÃO entra na quantidade física (ARMA), mas a participação (QDT ARMAS) permanece.
 *
 * Entradas headless (clasp run):
 *  - diagnosticarArmaArtesanalTodosHeadless() -> dry-run: lista o que seria zerado, sem escrever.
 *  - corrigirArmaArtesanalTodosHeadless()      -> aplica (zera ARMA) em todas as abas mensais.
 *
 * Segurança: só zera ARMA em linha com TIPO artesanal; nunca toca QDT ARMAS, ORD ou qualquer outra coluna.
 */

/** Varre as abas mensais e zera ARMA (L=12) onde TIPO (M=13) é artesanal e ARMA está preenchida. */
function _corrigirArmaArtesanalTodos(dryRun) {
  const ss = obterSpreadsheetOcorrencias_();
  const resumo = { status: 'OK', dryRun: !!dryRun, meses: [], corrigidas: 0 };
  const PADRAO_MENSAL = /^(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)\d{4}$/;

  for (const sheet of ss.getSheets()) {
    const nome = sheet.getName();
    if (!PADRAO_MENSAL.test(nome)) continue;
    const ultima = sheet.getLastRow();
    if (ultima < 2) continue;

    // L=ARMA (col 12), M=TIPO (col 13)
    const valores = sheet.getRange(2, 12, ultima - 1, 2).getValues();
    let n = 0;
    for (let i = 0; i < valores.length; i++) {
      const arma = valores[i][0];
      const tipo = String(valores[i][1] || '').toUpperCase();
      const ehArtesanal = tipo.includes('ARTESANAL') || tipo.includes('CASEIR');
      const armaPreenchida = arma !== '' && arma !== 0 && arma !== null && arma !== undefined;
      if (ehArtesanal && armaPreenchida) {
        if (!dryRun) sheet.getRange(i + 2, 12).setValue('');
        n++;
      }
    }
    if (n) {
      resumo.meses.push({ aba: nome, corrigidas: n });
      resumo.corrigidas += n;
    }
  }
  return resumo;
}

/** Dry-run: reporta sem escrever. */
function diagnosticarArmaArtesanalTodosHeadless() {
  return _corrigirArmaArtesanalTodos(true);
}

/** Aplica a correção em todas as abas mensais. */
function corrigirArmaArtesanalTodosHeadless() {
  return _corrigirArmaArtesanalTodos(false);
}

/**
 * Recalcula o QDT ARMAS (AF=32) de UM túnel específico e aplica o valor esperado
 * (nº de armas = industriais com ARMA preenchido + artesanais por TIPO) em todas as linhas.
 * Usado para corrigir divergência pontual de participação sem varrer todo o mês.
 */
function recomputarQtdArmasTunelHeadless(nomeAba, mike) {
  const ss = obterSpreadsheetOcorrencias_();
  const sheet = ss.getSheetByName(nomeAba);
  if (!sheet) return { status: 'ERRO', mensagem: 'Aba nao encontrada: ' + nomeAba };
  const ultima = sheet.getLastRow();
  const mikes = sheet.getRange(2, 5, ultima - 1, 1).getValues(); // E=MIKE
  const valores = sheet.getRange(2, 12, ultima - 1, 2).getValues(); // L=ARMA, M=TIPO

  let industriais = 0, artesanais = 0, n = 0;
  for (let i = 0; i < mikes.length; i++) {
    if (String(mikes[i][0] || '').trim() !== String(mike)) continue;
    const arma = valores[i][0];
    const tipo = String(valores[i][1] || '').toUpperCase();
    const ehArtesanal = tipo.includes('ARTESANAL') || tipo.includes('CASEIR');
    if (ehArtesanal) artesanais++;
    else if (arma !== '' && arma !== 0 && arma !== null && arma !== undefined) industriais++;
  }
  const qtdEsperado = industriais + artesanais;
  if (n === 0) {
    for (let i = 0; i < mikes.length; i++) {
      if (String(mikes[i][0] || '').trim() === String(mike)) n++;
    }
  }
  if (n === 0) return { status: 'ERRO', mensagem: 'MIKE nao encontrado: ' + mike };
  for (let i = 0; i < mikes.length; i++) {
    if (String(mikes[i][0] || '').trim() === String(mike)) {
      sheet.getRange(i + 2, 32).setValue(qtdEsperado); // AF=32
    }
  }
  return { status: 'OK', aba: nomeAba, mike, qtdEsperado, industriais, artesanais, linhasCorrigidas: n };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    _corrigirArmaArtesanalTodos,
    diagnosticarArmaArtesanalTodosHeadless,
    corrigirArmaArtesanalTodosHeadless,
    recomputarQtdArmasTunelHeadless
  };
}
