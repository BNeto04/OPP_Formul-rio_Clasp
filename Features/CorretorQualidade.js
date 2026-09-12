/**
 * ARQUIVO: Features/CorretorQualidade.js
 * DESCRICAO: Corretor de qualidade — restaura as formulas das colunas calculadas
 * das abas mensais (PELOTAO, GRAD, MATRICULA, TOTAIS de droga, PONTOS, CHAVE).
 *
 * Motivo: os BOs antigos foram gravados com VALOR ESTATICO nas colunas calculadas
 * (que deveriam ser formula). O Guardiao detecta isso como FORMULA_AUSENTE (68% do
 * passivo). Este corretor clona a formula de uma linha valida da propria aba e a
 * replica (via R1C1, preservando referencias relativas) nas celulas sem formula.
 *
 * Regras de seguranca (nenhum "buraco"):
 *  - nao toca a linha 1 (cabecalho);
 *  - nao sobrescreve celula que JA tem formula;
 *  - respeita nota de celula iniciada por "EXCECAO:" (excecao manual justificada);
 *  - nao usa como fonte uma formula com erro (#REF!, #N/A, etc.);
 *  - se a coluna nao tem nenhuma linha com formula valida, NAO inventa: reporta.
 *
 * Entradas:
 *  - corrigirFormulasAbaAtual()        -> menu (aba ativa)
 *  - corrigirFormulasAbaHeadless(nome) -> clasp run (uma aba por vez)
 */

var CorretorQualidade = {
  ERROS_PLANILHA: ['#NOME?', '#NAME?', '#REF!', '#VALOR!', '#VALUE!', '#N/D', '#N/A', '#DIV/0!', '#NULL!', '#ERRO!', '#ERROR!'],

  /**
   * Localiza as colunas calculadas usando as MESMAS regras do Guardiao.
   * @param {Sheet} sheet
   * @returns {Array<{nome:string, indice:number}>} indice ZERO-based
   */
  localizarColunas: function (sheet) {
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    if (typeof RegrasQualidade !== 'undefined' && typeof RegrasQualidade.localizarColunasCalculadas === 'function') {
      return RegrasQualidade.localizarColunasCalculadas(headers);
    }
    return [];
  },

  temErro: function (formula) {
    const f = String(formula || '').toUpperCase();
    return this.ERROS_PLANILHA.some(function (e) { return f.indexOf(e) !== -1; });
  },

  /** Valor de celula e um erro de planilha (#REF!, #N/A, etc.) — comparacao exata. */
  ehErroValor: function (valor) {
    const v = String(valor || '').trim().toUpperCase();
    return this.ERROS_PLANILHA.indexOf(v) !== -1;
  },

  /**
   * Nucleo: restaura as formulas das colunas calculadas em uma aba.
   * @param {Sheet} sheet
   * @returns {{aba:string, colunas:Array, corrigidas:number, naoCorrigidas:Array}}
   */
  corrigirFormulasAba: function (sheet, opcoes) {
    const self = this;
    const dryRun = !!(opcoes && opcoes.dryRun);
    const colunas = this.localizarColunas(sheet);
    const ultimaLinha = Math.max(sheet.getLastRow(), 1);
    const ultimaCol = Math.max(sheet.getLastColumn(), 1);
    const nomeAba = (typeof sheet.getName === 'function') ? sheet.getName() : '';

    const resumo = { aba: nomeAba, colunas: [], corrigidas: 0, naoCorrigidas: [] };
    if (ultimaLinha < 2 || colunas.length === 0) {
      return resumo;
    }

    // Leitura em lote (uma chamada so): formulas, valores e notas das linhas de dados.
    const rangeDados = sheet.getRange(2, 1, ultimaLinha - 1, ultimaCol);
    const formulas = rangeDados.getFormulas();  // [linha-2][col-1]
    const valores = (typeof rangeDados.getValues === 'function') ? rangeDados.getValues() : [];
    const notes = (typeof rangeDados.getNotes === 'function') ? rangeDados.getNotes() : [];

    colunas.forEach(function (coluna) {
      const col = coluna.indice; // zero-based
      if (col < 0 || col >= ultimaCol) {
        resumo.naoCorrigidas.push(coluna.nome + ' (indice fora do range)');
        return;
      }

      // 1. Acha uma linha-fonte com formula valida nesta coluna.
      let fonteR1C1 = null;
      let fonteLinha = 0;
      for (let r = 0; r < formulas.length; r++) {
        const f = String(formulas[r][col] || '');
        const v = (valores[r] && valores[r][col] !== undefined) ? String(valores[r][col]) : '';
        if (f.charAt(0) === '=' && !self.temErro(f) && !self.ehErroValor(v)) {
          fonteR1C1 = sheet.getRange(r + 2, col + 1).getFormulaR1C1();
          fonteLinha = r + 2;
          break;
        }
      }

      if (!fonteR1C1) {
        resumo.naoCorrigidas.push(coluna.nome);
        return;
      }

      // 2. Replica nas celulas sem formula valida (e sem excecao justificada).
      let corrigidas = 0;
      for (let r = 0; r < formulas.length; r++) {
        const f = String(formulas[r][col] || '');
        const v = (valores[r] && valores[r][col] !== undefined) ? String(valores[r][col]) : '';
        // ja tem formula valida (nao produz erro de planilha) -> preserva.
        if (f.charAt(0) === '=' && !self.ehErroValor(v)) continue;
        const nota = (notes[r] && notes[r][col]) ? String(notes[r][col]) : '';
        if (nota.toUpperCase().indexOf('EXCECAO:') === 0) continue; // excecao manual
        if (!dryRun) {
          sheet.getRange(r + 2, col + 1).setFormulaR1C1(fonteR1C1);
        }
        corrigidas++;
      }

      resumo.colunas.push({ nome: coluna.nome, fonte: fonteLinha, corrigidas: corrigidas });
      resumo.corrigidas += corrigidas;
    });

    return resumo;
  }
};

/** Entrada de menu: corrige a aba ativa. */
function corrigirFormulasAbaAtual() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const resumo = CorretorQualidade.corrigirFormulasAba(sheet);
  const ui = SpreadsheetApp.getUi();
  let msg = 'Formulas corrigidas: ' + resumo.corrigidas + ' celulas em ' + resumo.colunas.length + ' colunas.';
  if (resumo.naoCorrigidas.length) {
    msg += '\n\nNao corrigidas (sem linha-modelo valida):\n' + resumo.naoCorrigidas.join('\n');
  }
  ui.alert('Corretor de Formulas — ' + resumo.aba, msg, ui.ButtonSet.OK);
  return resumo;
}

/** Entrada headless: corrige uma aba pelo nome (clasp run). */
function corrigirFormulasAbaHeadless(nomeAba) {
  const ss = obterSpreadsheetOcorrencias_();
  const sheet = ss.getSheetByName(nomeAba);
  if (!sheet) {
    return { status: 'ERRO', mensagem: 'Aba nao encontrada: ' + nomeAba };
  }
  const resumo = CorretorQualidade.corrigirFormulasAba(sheet);
  resumo.status = 'OK';
  return resumo;
}

/** Entrada headless de DIAGNOSTICO (dry-run): reporta sem escrever. */
function diagnosticarFormulasAbaHeadless(nomeAba) {
  const ss = obterSpreadsheetOcorrencias_();
  const sheet = ss.getSheetByName(nomeAba);
  if (!sheet) {
    return { status: 'ERRO', mensagem: 'Aba nao encontrada: ' + nomeAba };
  }
  const resumo = CorretorQualidade.corrigirFormulasAba(sheet, { dryRun: true });
  resumo.status = 'OK';
  resumo.dryRun = true;
  return resumo;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CorretorQualidade;
}
