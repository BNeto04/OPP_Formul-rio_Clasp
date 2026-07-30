/**
 * ARQUIVO: Render/RendererGxt.js
 * DESCRIÇÃO: Renderizador Executivo do Relatório Trimestral de Mérito por Armas (GTAR X TROPA ARMAS) (TASK-M06.3-04E).
 * REGRA DE OURO: Organiza os meses em painéis verticais de no máximo 3 blocos mensais lado a lado cada.
 * Se a Seleção Livre contiver mais de 3 meses (ex: 4, 8 ou 12 meses), renderiza os painéis subsequentes empilhados verticalmente na mesma aba.
 * Aplica cores oficiais de Pelotão/GTAR, escala oficial consagrada de armas, negritos, alinhamentos,
 * formatos numéricos, larguras e congelamento na planilha.
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

  /**
   * Escala Oficial Consagrada de Destaque de Armas:
   * 0: #FF0000, fundo e fonte vermelhos
   * 1–3: #FF9900 (fundo laranja, texto #000000)
   * 4–5: #FFFF00 (fundo amarelo, texto #000000)
   * 6–9: #93C47D (fundo verde claro, texto #000000)
   * 10+: #38761D (fundo verde escuro, texto #FFFFFF, negrito)
   */
  static corPorArmas(qtd) {
    const q = Number(qtd) || 0;
    if (q >= 10) return { fundo: '#38761D', texto: '#FFFFFF', negrito: true };
    if (q >= 6)  return { fundo: '#93C47D', texto: '#000000', negrito: false };
    if (q >= 4)  return { fundo: '#FFFF00', texto: '#000000', negrito: false };
    if (q >= 1)  return { fundo: '#FF9900', texto: '#000000', negrito: false };
    return { fundo: '#FF0000', texto: '#FF0000', negrito: false };
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
   * Renderiza a aba de saída acumulada com painéis de até 3 blocos mensais empilhados verticalmente.
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

    // Divide os meses em painéis verticais de no máximo 3 meses cada (lado a lado por painel)
    const chunksPaineis = [];
    for (let i = 0; i < meses.length; i += 3) {
      chunksPaineis.push(meses.slice(i, i + 3));
    }

    // Calcula a altura total da matriz acumulada
    let alturaTotal = 0;
    chunksPaineis.forEach(chunk => {
      const maxLinhasPainel = Math.max(...chunk.map(m => (dadosPorMes[m]?.registros?.length || 0)), 1);
      const alturaPainel = Math.max(maxLinhasPainel + 12, 18);
      alturaTotal += alturaPainel + 3; // 3 linhas de respiro entre painéis verticais
    });

    const totalLinhasGrid = Math.max(alturaTotal, 30);

    const matrixValores = Array.from({ length: totalLinhasGrid }, () => Array(18).fill(''));
    const matrixFundos = Array.from({ length: totalLinhasGrid }, () => Array(18).fill('#FFFFFF'));
    const matrixCoresTexto = Array.from({ length: totalLinhasGrid }, () => Array(18).fill('#000000'));
    const matrixNegritos = Array.from({ length: totalLinhasGrid }, () => Array(18).fill(false));
    const matrixAlinhamentos = Array.from({ length: totalLinhasGrid }, () => Array(18).fill('left'));
    const matrixFormatos = Array.from({ length: totalLinhasGrid }, () => Array(18).fill('@'));

    let currentStartRow = 0;

    // Renderiza cada painel vertical trimestral
    chunksPaineis.forEach((chunk) => {
      const maxLinhasNoPainel = Math.max(...chunk.map(m => (dadosPorMes[m]?.registros?.length || 0)), 1);

      chunk.forEach((mes, idxNoPainel) => {
        const colStart = idxNoPainel * 6; // 0, 6, 12
        const dadosMes = dadosPorMes[mes] || { registros: [], resumo: {} };
        const registros = dadosMes.registros || [];

        // Linha 1 do Painel: Título do Mês (ex: JAN2026)
        matrixValores[currentStartRow][colStart] = mes.toUpperCase();
        matrixFundos[currentStartRow][colStart] = '#073763';
        matrixCoresTexto[currentStartRow][colStart] = '#FFFFFF';
        matrixNegritos[currentStartRow][colStart] = true;

        // Linha 2 do Painel: Cabeçalhos das 5 Colunas
        const cabecalhos = ['Nº', 'GRAD. / MATRÍCULA', 'NOME', 'QTD ARMAS', 'DESIGNAÇÃO'];
        const alignCab = ['center', 'center', 'left', 'center', 'center'];

        cabecalhos.forEach((c, cIdx) => {
          const colActual = colStart + cIdx;
          matrixValores[currentStartRow + 1][colActual] = c;
          matrixFundos[currentStartRow + 1][colActual] = '#20124D';
          matrixCoresTexto[currentStartRow + 1][colActual] = '#FFFFFF';
          matrixNegritos[currentStartRow + 1][colActual] = true;
          matrixAlinhamentos[currentStartRow + 1][colActual] = alignCab[cIdx];
        });

        // Linhas 3+ do Painel: Registros do Mês
        registros.forEach((reg, rIdx) => {
          const rowIdx = currentStartRow + 2 + rIdx;
          const estiloPel = this.obterEstiloPelotao(reg.designacao);
          const estiloArmas = this.corPorArmas(reg.qtdArmas);

          const gradMat = `${reg.grad || ''} ${reg.matricula || ''}`.trim();

          matrixValores[rowIdx][colStart + 0] = reg.numSeq; // Nº Sequencial do mês (1, 2, 3...)
          matrixValores[rowIdx][colStart + 1] = gradMat;
          matrixValores[rowIdx][colStart + 2] = reg.nome || '';
          matrixValores[rowIdx][colStart + 3] = reg.qtdArmas;
          matrixValores[rowIdx][colStart + 4] = reg.designacao || '';

          matrixAlinhamentos[rowIdx][colStart + 0] = 'center';
          matrixAlinhamentos[rowIdx][colStart + 1] = 'center';
          matrixAlinhamentos[rowIdx][colStart + 2] = 'left';
          matrixAlinhamentos[rowIdx][colStart + 3] = 'center';
          matrixAlinhamentos[rowIdx][colStart + 4] = 'center';

          matrixFormatos[rowIdx][colStart + 0] = '0';
          matrixFormatos[rowIdx][colStart + 3] = '0';

          for (let c = 0; c < 5; c++) {
            matrixFundos[rowIdx][colStart + c] = estiloPel.fundo;
            matrixCoresTexto[rowIdx][colStart + c] = estiloPel.texto;
            matrixNegritos[rowIdx][colStart + c] = estiloPel.negrito;
          }

          matrixFundos[rowIdx][colStart + 3] = estiloArmas.fundo;
          matrixCoresTexto[rowIdx][colStart + 3] = estiloArmas.texto;
          matrixNegritos[rowIdx][colStart + 3] = estiloArmas.negrito;
        });

        // Resumo por Pelotão abaixo da tabela do mês
        const resumoStartRow = currentStartRow + Math.max(registros.length + 3, 4);

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

          matrixAlinhamentos[currRow][colStart] = 'left';
          matrixAlinhamentos[currRow][colStart + 3] = 'center';

          matrixFormatos[currRow][colStart + 3] = '0';

          matrixFundos[currRow][colStart] = g.estilo.fundo;
          matrixCoresTexto[currRow][colStart] = g.estilo.texto;
          matrixNegritos[currRow][colStart] = g.estilo.negrito;

          matrixFundos[currRow][colStart + 3] = g.estilo.fundo;
          matrixCoresTexto[currRow][colStart + 3] = g.estilo.texto;
          matrixNegritos[currRow][colStart + 3] = g.estilo.negrito;
        });
      });

      // Avança o ponteiro de linha vertical para o próximo painel trimestral
      const alturaUsadaNoPainel = Math.max(maxLinhasNoPainel + 12, 18);
      currentStartRow += alturaUsadaNoPainel + 3;
    });

    // Se for mock de testes, popula os dados armazenados completos
    if (typeof targetSheet._definirDadosMatriz === 'function') {
      targetSheet._definirDadosMatriz({
        valores: matrixValores,
        fundos: matrixFundos,
        coresTexto: matrixCoresTexto,
        negritos: matrixNegritos,
        alinhamentos: matrixAlinhamentos,
        formatos: matrixFormatos
      });
    } else if (typeof targetSheet.getRange === 'function') {
      try {
        const rng = targetSheet.getRange(1, 1, totalLinhasGrid, 18);
        rng.setValues(matrixValores);
        rng.setBackgrounds(matrixFundos);
        rng.setFontColors(matrixCoresTexto);

        if (typeof rng.setFontWeights === 'function') {
          const weights = matrixNegritos.map(row => row.map(b => b ? 'bold' : 'normal'));
          rng.setFontWeights(weights);
        }
        if (typeof rng.setHorizontalAlignments === 'function') {
          rng.setHorizontalAlignments(matrixAlinhamentos);
        }
        if (typeof rng.setNumberFormats === 'function') {
          rng.setNumberFormats(matrixFormatos);
        }

        if (typeof targetSheet.setColumnWidth === 'function') {
          const larguraColunas = [40, 130, 180, 90, 120, 20];
          [0, 1, 2].forEach((idx) => {
            const startColIdx = idx * 6 + 1; // 1-indexed
            larguraColunas.forEach((w, cOffset) => {
              if (startColIdx + cOffset <= 18) {
                targetSheet.setColumnWidth(startColIdx + cOffset, w);
              }
            });
          });
        }

        if (typeof targetSheet.setFrozenRows === 'function') {
          targetSheet.setFrozenRows(2);
        }
      } catch (e) {}
    }

    return targetSheet;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = RendererGxt;
}
