/**
 * ARQUIVO: Core/LegendaCores.js
 * DESCRICAO: Legenda de cores das entregas do produto. FONTE UNICA — nenhum compilador deve
 *            repetir esta tabela. Pedido do proprietario (12/09/2026, #152):
 *            "no fim da tabela, para todos os compiladores do produto, mostrar a legenda
 *            informando o que cada cor representa".
 *
 * FONTES CANONICAS (nao inventar):
 *   - Grupos/pelotoes .... Render/RendererGxt.js  (CORES_PELOTAO, linhas 14-22)
 *   - Faixas de armas .... Compilador_Armas.js    (corPorArmasArmas_, linhas 100-107)
 */
const SyntheonLegendaCores = (function () {

  /** Grupos: [rotulo, fundo, fonte, negrito] — espelho de Render/RendererGxt.js */
  const GRUPOS = [
    ['OFICIAIS (oficial prevalece sobre o pelotao)', '#F1C232', '#000000', false],
    ['1o PEL GTAR', '#00CC00', '#000000', true],
    ['1o PEL',      '#00FF00', '#000000', false],
    ['2o PEL GTAR', '#3C78D8', '#FFFFFF', true],
    ['2o PEL',      '#6D9EEB', '#000000', false],
    ['3o PEL (demais grupos)', '#FFFFFF', '#000000', false]
  ];

  /** Faixas de quantidade de armas: [rotulo, fundo, fonte] — espelho de corPorArmasArmas_ */
  const FAIXAS = [
    ['sem armas (0)',      '#FF0000', '#FF0000'],
    ['1 a 3 armas',        '#FF9900', '#000000'],
    ['4 a 5 armas',        '#FFFF00', '#000000'],
    ['6 a 9 armas',        '#93C47D', '#000000'],
    ['10 ou mais armas',   '#38761D', '#FFFFFF']
  ];

  /**
   * Desenha a legenda logo abaixo da tabela.
   * @param {GoogleAppsScript.Spreadsheet.Sheet} aba
   * @param {number} linhaInicial linha (1-based) onde comecar a legenda
   * @param {{faixas?: boolean, titulo?: string}} opcoes
   * @return {number} proxima linha livre
   */
  function desenhar(aba, linhaInicial, opcoes) {
    opcoes = opcoes || {};
    let lin = linhaInicial;

    aba.getRange(lin, 1, 1, 3)
      .merge()
      .setValue(opcoes.titulo || 'LEGENDA DE CORES')
      .setFontFamily('Arial').setFontSize(10).setFontWeight('bold')
      .setBackground('#e0e0e0').setHorizontalAlignment('center');
    lin++;

    aba.getRange(lin, 1).setValue('GRUPO / PELOTAO').setFontWeight('bold');
    lin++;

    GRUPOS.forEach(function (g) {
      aba.getRange(lin, 1).setValue(g[0])
        .setBackground(g[1]).setFontColor(g[2])
        .setFontFamily('Arial').setFontSize(10)
        .setFontWeight(g[3] ? 'bold' : 'normal');
      lin++;
    });

    if (opcoes.faixas !== false) {
      lin++;
      aba.getRange(lin, 1).setValue('QUANTIDADE DE ARMAS (SCORE)').setFontWeight('bold');
      lin++;
      FAIXAS.forEach(function (f) {
        aba.getRange(lin, 1).setValue(f[0])
          .setBackground(f[1]).setFontColor(f[2])
          .setFontFamily('Arial').setFontSize(10);
        lin++;
      });
    }

    aba.getRange(linhaInicial, 1, lin - linhaInicial, 1).setHorizontalAlignment('left');
    return lin + 1;
  }

  return { GRUPOS: GRUPOS, FAIXAS: FAIXAS, desenhar: desenhar };
})();
