/**
 * ARQUIVO: Features/CorretorTuneis.js
 * DESCRICAO: Corretor de Túneis — propaga DATA (col B) e BOE (col G) da primeira
 * linha de cada túnel para as linhas-filhas do mesmo MIKE.
 *
 * Motivo: nas abas antigas (JAN/ABR/MAI...), a DATA é preenchida SÓ na 1ª linha do
 * túnel; as linhas-filhas ficam com DATA vazia, o que quebra a Chave Ocorrência
 * (DATA|MIKE|BOE) e dispara TUNEL_FRAGMENTADO. O mês AGO2026 (correto) repete a DATA
 * em todas as linhas. Este corretor faz a propagação para normalizar as abas antigas.
 *
 * Segurança (nenhum "buraco"):
 *  - NÃO move linhas: só preenche células vazias de DATA/BOE → a coluna ORD (detector
 *    de adulteração) fica intocada por natureza.
 *  - Só preenche célula VAZIA; nunca sobrescreve valor já existente.
 *  - Túnel com 2+ datas distintas (MIKE reutilizado) ou 2+ BOEs distintos é PULADO e
 *    reportado como conflito (não arbitra).
 *  - Idempotente: segunda execução não corrige nada.
 *
 * Entradas:
 *  - corrigirTuneisAbaAtual()        -> menu (aba ativa)
 *  - corrigirTuneisAbaHeadless(nome) -> clasp run (uma aba por vez)
 */

var CorretorTuneis = {
  /** Normaliza um valor (Date/serial/string) para chave comparável em conflito. */
  chaveValor: function (v) {
    if (v instanceof Date) return v.getTime();
    return String(v).trim();
  },

  /**
   * Nucleo: propaga DATA/BOE nas linhas-filhas de cada túnel de uma aba.
   * @param {Sheet} sheet
   * @param {{dryRun:boolean}} opcoes
   * @returns {{aba:string, tuneis:number, datas:number, boes:number, conflitos:Array}}
   */
  corrigirTuneisAba: function (sheet, opcoes) {
    const self = this;
    const dryRun = !!(opcoes && opcoes.dryRun);
    const ultimaLinha = Math.max(sheet.getLastRow(), 1);
    const nomeAba = (typeof sheet.getName === 'function') ? sheet.getName() : '';

    const resumo = { aba: nomeAba, tuneis: 0, datas: 0, boes: 0, conflitos: [] };
    if (ultimaLinha < 2) return resumo;

    // Lê A..G: ORD(A=0) DATA(B=1) HORA(C=2) QTD O(D=3) MIKE(E=4) NATUREZA(F=5) BOE(G=6)
    const valores = sheet.getRange(2, 1, ultimaLinha - 1, 7).getValues();

    let i = 0;
    while (i < valores.length) {
      const mike = String(valores[i][4] || '').trim();
      if (!mike) { i++; continue; } // linha em branco / sem MIKE (fronteira entre túneis)

      // Bloco do túnel: linhas consecutivas com o MESMO MIKE.
      let j = i;
      while (j < valores.length && String(valores[j][4] || '').trim() === mike) j++;

      // Coleta DATA/BOE não-vazios e a primeira ocorrência (fonte).
      const datasDistintas = new Set();
      const boesDistintos = new Set();
      let fonteData = null;
      let fonteBoe = null;
      for (let k = i; k < j; k++) {
        const d = valores[k][1];
        if (d !== '' && d !== null && d !== undefined) {
          datasDistintas.add(self.chaveValor(d));
          if (fonteData === null) fonteData = d;
        }
        const b = String(valores[k][6] || '').trim();
        if (b) {
          boesDistintos.add(b);
          if (fonteBoe === null) fonteBoe = b;
        }
      }

      // Conflito: 2+ datas ou 2+ BOEs distintos no mesmo MIKE -> não arbitra.
      if (datasDistintas.size > 1 || boesDistintos.size > 1) {
        resumo.conflitos.push({
          mike: mike,
          datas: datasDistintas.size,
          boes: boesDistintos.size,
          linhas: [i + 2, j + 1]
        });
        i = j;
        continue;
      }

      // Preenche células VAZIAS de DATA (B) e BOE (G) nas linhas-filhas.
      let datas = 0;
      let boes = 0;
      for (let k = i; k < j; k++) {
        const linha = k + 2;
        if (fonteData !== null && (valores[k][1] === '' || valores[k][1] === null || valores[k][1] === undefined)) {
          if (!dryRun) sheet.getRange(linha, 2).setValue(fonteData);
          datas++;
        }
        if (fonteBoe !== null && !String(valores[k][6] || '').trim()) {
          if (!dryRun) sheet.getRange(linha, 7).setValue(fonteBoe);
          boes++;
        }
      }

      if (datas || boes) resumo.tuneis++;
      resumo.datas += datas;
      resumo.boes += boes;
      i = j;
    }

    return resumo;
  }
};

/** Entrada de menu: corrige a aba ativa. */
function corrigirTuneisAbaAtual() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const resumo = CorretorTuneis.corrigirTuneisAba(sheet);
  const ui = SpreadsheetApp.getUi();
  let msg = 'DATAs preenchidas: ' + resumo.datas + '\nBOEs preenchidos: ' + resumo.boes +
            '\nTúneis corrigidos: ' + resumo.tuneis;
  if (resumo.conflitos.length) {
    msg += '\n\nConflitos (não corrigidos, revisão manual): ' + resumo.conflitos.length;
  }
  ui.alert('Corretor de Túneis — ' + resumo.aba, msg, ui.ButtonSet.OK);
  return resumo;
}

/** Entrada headless: corrige uma aba pelo nome (clasp run). */
function corrigirTuneisAbaHeadless(nomeAba) {
  const ss = obterSpreadsheetOcorrencias_();
  const sheet = ss.getSheetByName(nomeAba);
  if (!sheet) return { status: 'ERRO', mensagem: 'Aba nao encontrada: ' + nomeAba };
  const resumo = CorretorTuneis.corrigirTuneisAba(sheet);
  resumo.status = 'OK';
  return resumo;
}

/** Entrada headless de DIAGNOSTICO (dry-run): reporta sem escrever. */
function diagnosticarTuneisAbaHeadless(nomeAba) {
  const ss = obterSpreadsheetOcorrencias_();
  const sheet = ss.getSheetByName(nomeAba);
  if (!sheet) return { status: 'ERRO', mensagem: 'Aba nao encontrada: ' + nomeAba };
  const resumo = CorretorTuneis.corrigirTuneisAba(sheet, { dryRun: true });
  resumo.status = 'OK';
  resumo.dryRun = true;
  return resumo;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CorretorTuneis;
}

/**
 * Insere as LINHAS EM BRANCO separadoras ENTRE os tuneis de uma aba mensal.
 * Pedido do proprietario (12/09/2026): "corrige logo a linha em branco de abril".
 * A entrada manual grava em (ultimaLinha + 2) -> deixa 1 linha branca entre tuneis.
 * Abas que nao passaram pela entrada ficaram sem ela.
 * INVARIANTE: nao reordena, nao renumera, nao altera a coluna ORD (A) - apenas INSERE
 * linha vazia ANTES do inicio de cada tunel. O ORD segue colado ao seu dado.
 */
function inserirLinhasBrancasTuneisHeadless(nomeAba) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const aba = ss.getSheetByName(nomeAba);
  if (!aba) return JSON.stringify({ erro: 'Aba nao encontrada: ' + nomeAba });

  const lastRow = aba.getLastRow();
  const lastCol = Math.min(aba.getLastColumn(), 6);
  if (lastRow < 3) return JSON.stringify({ aba: nomeAba, inseridas: 0, aviso: 'poucas linhas' });

  const v = aba.getRange(1, 1, lastRow, lastCol).getValues();
  const linhasInseridas = [];

  // De baixo para cima: inserir nao invalida os indices ainda nao visitados (acima).
  for (let r = lastRow; r >= 3; r--) {
    const dataAtual = String(v[r - 1] ? v[r - 1][1] : '').trim();   // DATA da linha r
    const ordAnterior = String(v[r - 2] ? v[r - 2][0] : '').trim(); // ORD da linha r-1
    // linha r inicia tunel (tem DATA) e a anterior NAO e branca -> falta a separadora
    if (dataAtual !== '' && ordAnterior !== '') {
      aba.insertRowBefore(r);
      linhasInseridas.push(r);
    }
  }

  return JSON.stringify({
    aba: nomeAba,
    inseridas: linhasInseridas.length,
    linhas: linhasInseridas.reverse(),
    lastRowAntes: lastRow,
    lastRowDepois: aba.getLastRow()
  });
}

/**
 * REMOVE as linhas totalmente vazias de uma aba mensal (reverte insercao indevida).
 * Diferente de inserir: aqui a ORDEM e DELETAR o que esta 100% vazio.
 * Seguranca: so remove linha SEM NENHUM conteudo em nenhuma coluna.
 */
function removerLinhasBrancasHeadless(nomeAba) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const aba = ss.getSheetByName(nomeAba);
  if (!aba) return JSON.stringify({ erro: 'Aba nao encontrada: ' + nomeAba });

  const lastRow = aba.getLastRow();
  const lastCol = Math.min(aba.getLastColumn(), 40);
  if (lastRow < 2) return JSON.stringify({ aba: nomeAba, removidas: 0 });

  const v = aba.getRange(1, 1, lastRow, lastCol).getValues();
  let removidas = 0;
  for (let r = lastRow; r >= 2; r--) {
    const linha = v[r - 1];
    const temConteudo = linha.some(function (c) { return String(c === null || c === undefined ? '' : c).trim() !== ''; });
    if (!temConteudo) { aba.deleteRow(r); removidas++; }
  }
  return JSON.stringify({ aba: nomeAba, removidas: removidas, lastRowDepois: aba.getLastRow() });
}
