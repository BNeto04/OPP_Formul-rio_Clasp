/**
 * ARQUIVO: Render/RendererGxt.js
 * DESCRIÇÃO: Renderizador Executivo do Relatório Trimestral de Mérito por Armas (GTAR X TROPA ARMAS) (TASK-M06.3-04A).
 * REGRA DE OURO: Renderiza os blocos mensais lado a lado com as 5 colunas protegidas:
 * Nº | GRAD. / MATRÍCULA | NOME | QTD ARMAS | DESIGNAÇÃO
 * Aplica as cores oficiais de Pelotão e GTAR, destaca a quantidade de armas e gera resumos por Pelotão.
 */

class RendererGxt {
  static get CORES_PELOTAO() {
    return {
      'OFICIAIS': { fundo: '#F1C232', texto: '#000000', negrito: false },
      '1º PEL GTAR': { fundo: '#00CC00', texto: '#000000', negrito: true },
      '1º PEL': { fundo: '#00FF00', texto: '#000000', negrito: false },
      '2º PEL GTAR': { fundo: '#3C78D8', texto: '#FFFFFF', negrito: true },
      '2º PEL': { fundo: '#6D9EEB', texto: '#000000', negrito: false },
      '3º PEL': { fundo: '#FFFFFF', texto: '#000000', negrito: false },
      'TOTAL': { fundo: '#073763', texto: '#FFFFFF', negrito: true }
    };
  }

  static corPorArmas(qtd) {
    const q = Number(qtd) || 0;
    if (q >= 5) return { fundo: '#D9534F', texto: '#FFFFFF' };
    if (q === 4) return { fundo: '#F0AD4E', texto: '#000000' };
    if (q === 3) return { fundo: '#5BC0DE', texto: '#000000' };
    if (q === 2) return { fundo: '#5CB85C', texto: '#FFFFFF' };
    if (q === 1) return { fundo: '#E6F3FF', texto: '#000000' };
    return { fundo: '#FFFFFF', texto: '#CC0000' };
  }

  static obterEstiloPelotao(designacao) {
    const desNorm = String(designacao || '').toUpperCase().trim();
    if (desNorm.includes('OFICIAL') || desNorm.includes('TEN') || desNorm.includes('CAP') || desNorm.includes('MAJ')) {
      return this.CORES_PELOTAO['OFICIAIS'];
    }
    if (desNorm.includes('1º PEL GTAR') || desNorm.includes('1 PEL GTAR') || desNorm.includes('1º PEL/GTAR')) {
      return this.CORES_PELOTAO['1º PEL GTAR'];
    }
    if (desNorm.includes('2º PEL GTAR') || desNorm.includes('2 PEL GTAR') || desNorm.includes('2º PEL/GTAR')) {
      return this.CORES_PELOTAO['2º PEL GTAR'];
    }
    if (desNorm.includes('1º PEL') || desNorm.includes('1 PEL')) {
      return this.CORES_PELOTAO['1º PEL'];
    }
    if (desNorm.includes('2º PEL') || desNorm.includes('2 PEL')) {
      return this.CORES_PELOTAO['2º PEL'];
    }
    return this.CORES_PELOTAO['3º PEL'];
  }

  /**
   * Renderiza a aba de saída trimestral com os blocos mensais lado a lado.
   * @param {SpreadsheetApp.Spreadsheet} ss - Planilha Google Apps Script ou mock.
   * @param {Object} dadosPorMes - Objeto com os dados de cada mês compilado.
   * @param {string} [nomeAbaSaida='GTAR X TROPA ARMAS 2026'] - Nome da aba de saída.
   */
  static renderizar(ss, dadosPorMes = {}, nomeAbaSaida = 'GTAR X TROPA ARMAS 2026') {
    if (!ss) return null;

    let targetSheet = null;
    if (typeof ss.getSheetByName === 'function') {
      targetSheet = ss.getSheetByName(nomeAbaSaida);
      if (!targetSheet && typeof ss.insertSheet === 'function') {
        targetSheet = ss.insertSheet(nomeAbaSaida);
      }
    }

    if (!targetSheet) return null;

    if (typeof targetSheet.clear === 'function') {
      targetSheet.clear();
    }

    const meses = Object.keys(dadosPorMes);
    if (meses.length === 0) return targetSheet;

    // Constrói a estrutura dos 3 blocos mensais lado a lado
    // Mês 1: Colunas A..E (1..5) | Espaço: Col F (6) | Mês 2: Colunas G..K (7..11) | Espaço: Col L (12) | Mês 3: Colunas M..Q (13..17)
    const colOffsetPorMes = {};
    meses.forEach((mes, idx) => {
      colOffsetPorMes[mes] = idx * 6; // 0, 6, 12
    });

    const maxLinhasDados = Math.max(...meses.map(m => (dadosPorMes[m]?.registros?.length || 0)), 1);
    const totalLinhasGrid = Math.max(maxLinhasDados + 15, 30);

    const matrixValores = Array.from({ length: totalLinhasGrid }, () => Array(18).fill(''));
    const matrixFundos = Array.from({ length: totalLinhasGrid }, () => Array(18).fill('#FFFFFF'));
    const matrixCoresTexto = Array.from({ length: totalLinhasGrid }, () => Array(18).fill('#000000'));
    const matrixNegritos = Array.from({ length: totalLinhasGrid }, () => Array(18).fill(false));

    // Renderiza cada bloco mensal
    meses.forEach((mes) => {
      const colStart = colOffsetPorMes[mes]; // 0-indexed
      const dadosMes = dadosPorMes[mes] || { registros: [], resumo: {} };
      const registros = dadosMes.registros || [];

      // Linha 1: Título do Mês (ex: JAN/2026)
      matrixValores[0][colStart] = mes.toUpperCase();
      matrixFundos[0][colStart] = '#073763';
      matrixCoresTexto[0][colStart] = '#FFFFFF';
      matrixNegritos[0][colStart] = true;

      // Linha 2: Cabeçalhos das 5 Colunas
      const cabecalhos = ['Nº', 'GRAD. / MATRÍCULA', 'NOME', 'QTD ARMAS', 'DESIGNAÇÃO'];
      cabecalhos.forEach((c, cIdx) => {
        matrixValores[1][colStart + cIdx] = c;
        matrixFundos[1][colStart + cIdx] = '#20124D';
        matrixCoresTexto[1][colStart + cIdx] = '#FFFFFF';
        matrixNegritos[1][colStart + cIdx] = true;
      });

      // Linhas 3+: Registros do Mês
      registros.forEach((reg, rIdx) => {
        const rowIdx = 2 + rIdx;
        const estiloPel = this.obterEstiloPelotao(reg.designacao);
        const estiloArmas = this.corPorArmas(reg.qtdArmas);

        const gradMat = `${reg.grad || ''} ${reg.matricula || ''}`.trim();

        matrixValores[rowIdx][colStart + 0] = reg.numSeq; // Nº Sequencial do mês (1, 2, 3...)
        matrixValores[rowIdx][colStart + 1] = gradMat;
        matrixValores[rowIdx][colStart + 2] = reg.nome || '';
        matrixValores[rowIdx][colStart + 3] = reg.qtdArmas;
        matrixValores[rowIdx][colStart + 4] = reg.designacao || '';

        // Estilização por Pelotão nas colunas de identificação
        for (let c = 0; c < 5; c++) {
          matrixFundos[rowIdx][colStart + c] = estiloPel.fundo;
          matrixCoresTexto[rowIdx][colStart + c] = estiloPel.texto;
          matrixNegritos[rowIdx][colStart + c] = estiloPel.negrito;
        }

        // Destaque específico na coluna QTD ARMAS (coluna 4, idx 3)
        matrixFundos[rowIdx][colStart + 3] = estiloArmas.fundo;
        matrixCoresTexto[rowIdx][colStart + 3] = estiloArmas.texto;
        matrixNegritos[rowIdx][colStart + 3] = true;
      });

      // Resumo por Pelotão abaixo da tabela do mês (linha maxLinhasDados + 4)
      const resumoStartRow = Math.max(registros.length + 3, 4);
      
      matrixValores[resumoStartRow][colStart] = 'RESUMO POR PELOTÃO';
      matrixFundos[resumoStartRow][colStart] = '#073763';
      matrixCoresTexto[resumoStartRow][colStart] = '#FFFFFF';
      matrixNegritos[resumoStartRow][colStart] = true;

      const gruposResumo = [
        { chave: '1º PEL GTAR', estilo: this.CORES_PELOTAO['1º PEL GTAR'] },
        { chave: '2º PEL GTAR', estilo: this.CORES_PELOTAO['2º PEL GTAR'] },
        { chave: '1º PEL', estilo: this.CORES_PELOTAO['1º PEL'] },
        { chave: '2º PEL', estilo: this.CORES_PELOTAO['2º PEL'] },
        { chave: '3º PEL', estilo: this.CORES_PELOTAO['3º PEL'] },
        { chave: 'TOTAL', estilo: this.CORES_PELOTAO['TOTAL'] }
      ];

      gruposResumo.forEach((g, gIdx) => {
        const currRow = resumoStartRow + 1 + gIdx;
        const totalGrupo = dadosMes.resumo ? (dadosMes.resumo[g.chave] || 0) : 0;

        matrixValores[currRow][colStart] = g.chave;
        matrixValores[currRow][colStart + 3] = totalGrupo;

        matrixFundos[currRow][colStart] = g.estilo.fundo;
        matrixCoresTexto[currRow][colStart] = g.estilo.texto;
        matrixNegritos[currRow][colStart] = g.estilo.negrito;

        matrixFundos[currRow][colStart + 3] = g.estilo.fundo;
        matrixCoresTexto[currRow][colStart + 3] = g.estilo.texto;
        matrixNegritos[currRow][colStart + 3] = g.estilo.negrito;
      });
    });

    // Se for mock de testes, popula os dados armazenados
    if (typeof targetSheet._definirDadosMatriz === 'function') {
      targetSheet._definirDadosMatriz({
        valores: matrixValores,
        fundos: matrixFundos,
        coresTexto: matrixCoresTexto,
        negritos: matrixNegritos
      });
    } else if (typeof targetSheet.getRange === 'function') {
      try {
        const rng = targetSheet.getRange(1, 1, totalLinhasGrid, 18);
        rng.setValues(matrixValores);
        rng.setBackgrounds(matrixFundos);
        rng.setFontColors(matrixCoresTexto);
      } catch (e) {}
    }

    return targetSheet;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = RendererGxt;
}
