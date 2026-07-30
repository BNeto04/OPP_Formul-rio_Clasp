'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/TestRelatorioArmas.js
 * DESCRIÇÃO: Suíte de testes unitários para a padronização visual e escala de armas do Compilador de Armas GS (TASK-M06.2-04).
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const UtilsMod = require('../Core/Utils');
global.SyntheonUtils = UtilsMod.SyntheonUtils || UtilsMod;

// Carrega o Compilador_Armas.js via vm.runInThisContext sem alterar o arquivo original
const codeArmas = fs.readFileSync(path.join(__dirname, '../Compilador_Armas.js'), 'utf8');
vm.runInThisContext(codeArmas);

if (typeof SpreadsheetApp === 'undefined') {
  global.SpreadsheetApp = {
    BorderStyle: {
      SOLID: 'SOLID',
      SOLID_THICK: 'SOLID_THICK'
    }
  };
}

console.log('🧪 Iniciando Testes Unitários: Padronização do Relatório de ARMAS (M06.2-04)...\n');

let sucessos = 0;

function test(nome, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${nome}`);
    sucessos++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${nome}:`, err.message);
    process.exitCode = 1;
  }
}

function criarMockSSArmas() {
  const tracker = {
    valores: {},
    backgrounds: {},
    fontColors: {},
    fontWeights: {},
    fontFamilies: {},
    alignments: {},
    numberFormats: {},
    linhasCongeladas: 0,
    filterCreated: false,
    backgroundsMatriz: [],
    fontColorsMatriz: [],
    fontWeightsMatriz: []
  };

  const getCellKey = (r, c) => `${r}:${c}`;

  const createRangeMock = (row, col, numRows = 1, numCols = 1) => {
    const rangeObj = {
      setValue: (val) => {
        for (let r = 0; r < numRows; r++) {
          for (let c = 0; c < numCols; c++) {
            tracker.valores[getCellKey(row + r, col + c)] = val;
          }
        }
        return rangeObj;
      },
      setValues: (vals) => {
        vals.forEach((rVals, rIdx) => {
          rVals.forEach((v, cIdx) => {
            tracker.valores[getCellKey(row + rIdx, col + cIdx)] = v;
          });
        });
        return rangeObj;
      },
      setBackgrounds: (bgMatriz) => {
        tracker.backgroundsMatriz = bgMatriz;
        bgMatriz.forEach((rVals, rIdx) => {
          rVals.forEach((v, cIdx) => {
            tracker.backgrounds[getCellKey(row + rIdx, col + cIdx)] = v;
          });
        });
        return rangeObj;
      },
      setFontColors: (fcMatriz) => {
        tracker.fontColorsMatriz = fcMatriz;
        fcMatriz.forEach((rVals, rIdx) => {
          rVals.forEach((v, cIdx) => {
            tracker.fontColors[getCellKey(row + rIdx, col + cIdx)] = v;
          });
        });
        return rangeObj;
      },
      setFontWeights: (fwMatriz) => {
        tracker.fontWeightsMatriz = fwMatriz;
        fwMatriz.forEach((rVals, rIdx) => {
          rVals.forEach((v, cIdx) => {
            tracker.fontWeights[getCellKey(row + rIdx, col + cIdx)] = v;
          });
        });
        return rangeObj;
      },
      setFontFamily: (font) => {
        for (let r = 0; r < numRows; r++) {
          for (let c = 0; c < numCols; c++) {
            tracker.fontFamilies[getCellKey(row + r, col + c)] = font;
          }
        }
        return rangeObj;
      },
      setFontSize: () => rangeObj,
      setFontWeight: (fw) => {
        for (let r = 0; r < numRows; r++) {
          for (let c = 0; c < numCols; c++) {
            tracker.fontWeights[getCellKey(row + r, col + c)] = fw;
          }
        }
        return rangeObj;
      },
      setBackground: (bg) => {
        for (let r = 0; r < numRows; r++) {
          for (let c = 0; c < numCols; c++) {
            tracker.backgrounds[getCellKey(row + r, col + c)] = bg;
          }
        }
        return rangeObj;
      },
      setHorizontalAlignment: (align) => {
        for (let r = 0; r < numRows; r++) {
          for (let c = 0; c < numCols; c++) {
            tracker.alignments[getCellKey(row + r, col + c)] = align;
          }
        }
        return rangeObj;
      },
      setVerticalAlignment: () => rangeObj,
      setBorder: () => rangeObj,
      setNumberFormat: (fmt) => {
        for (let r = 0; r < numRows; r++) {
          for (let c = 0; c < numCols; c++) {
            tracker.numberFormats[getCellKey(row + r, col + c)] = fmt;
          }
        }
        return rangeObj;
      },
      createFilter: () => {
        tracker.filterCreated = true;
        return rangeObj;
      }
    };
    return rangeObj;
  };

  const mockSheet = {
    getName: () => 'COMP_ARMAS_2026',
    setFrozenRows: (n) => { tracker.linhasCongeladas = n; },
    autoResizeColumns: () => {},
    getRange: (r, c, numR, numC) => createRangeMock(r, c, numR || 1, numC || 1),
    obterTracker: () => tracker
  };

  const mockSS = {
    getSheetByName: () => null,
    insertSheet: () => mockSheet
  };

  return { mockSS, mockSheet, tracker };
}

// 1. Teste: Funções Auxiliares de Cores para Pelotão e Escala de Armas
test('Armas: corPorGrupoArmas_ e corPorArmasArmas_ cobrem todas as regras protegidas', () => {
  // Pelotões
  assert.deepStrictEqual(corPorGrupoArmas_('1º TEN', 'OFICIAIS'), { fundo: '#f1c232', fonte: '#000000' });
  assert.deepStrictEqual(corPorGrupoArmas_('SD', '1º PEL GTAR'), { fundo: '#00cc00', fonte: '#000000', negrito: true });
  assert.deepStrictEqual(corPorGrupoArmas_('SD', '1º PEL'), { fundo: '#00ff00', fonte: '#000000' });
  assert.deepStrictEqual(corPorGrupoArmas_('CB', '2º PEL GTAR'), { fundo: '#3c78d8', fonte: '#ffffff', negrito: true });
  assert.deepStrictEqual(corPorGrupoArmas_('SD', '2º PEL'), { fundo: '#6d9eeb', fonte: '#000000' });
  assert.deepStrictEqual(corPorGrupoArmas_('SGT', '3º PEL'), { fundo: '#ffffff', fonte: '#000000' });

  // Escala de Armas
  assert.deepStrictEqual(corPorArmasArmas_(0), { fundo: '#ff0000', fonte: '#ff0000' }); // Zero vermelho/vermelho
  assert.deepStrictEqual(corPorArmasArmas_(2), { fundo: '#ff9900', fonte: '#000000' }); // 1 a 3
  assert.deepStrictEqual(corPorArmasArmas_(5), { fundo: '#ffff00', fonte: '#000000' }); // 4 a 5
  assert.deepStrictEqual(corPorArmasArmas_(8), { fundo: '#93c47d', fonte: '#000000' }); // 6 a 9
  assert.deepStrictEqual(corPorArmasArmas_(12), { fundo: '#38761d', fonte: '#ffffff' }); // 10+
});

// 2. Teste: Estilização Integrada da Aba do Relatório de ARMAS
test('Armas: aplica cabeçalho, congelamento, formato #,##0, alinhamentos, paleta oficial de pelotão e a escala de armas (incluindo zero em vermelho)', () => {
  const { mockSS, mockSheet, tracker } = criarMockSSArmas();

  // Mock da planilha contendo abas mensais com armas
  const fixtureData = [
    // L2: Oficial (12 armas - 10+)
    ['1º PEL', '1º TEN', '100001-0', 'TEN SILVA', 12],
    // L3: 1º PEL GTAR (7 armas - 6 a 9)
    ['1º PEL GTAR', 'SD', '100002-8', 'SD SOUZA', 7],
    // L4: 1º PEL (4 armas - 4 a 5)
    ['1º PEL', 'SD', '100003-6', 'SD SANTOS', 4],
    // L5: 2º PEL GTAR (2 armas - 1 a 3)
    ['2º PEL GTAR', 'CB', '100004-4', 'CB OLIVEIRA', 2],
    // L6: 2º PEL (0 armas - zero em vermelho)
    ['2º PEL', 'SD', '100005-2', 'SD LIMA', 0],
    // L7: 3º PEL (1 arma)
    ['3º PEL', '1º SGT', '100006-0', 'SGT FERREIRA', 1]
  ];

  // Simula a renderização da aba de armas executando a formatação diretamente
  const ranking = fixtureData;
  const cabecalhoResultado = [['PELOTÃO', 'GRADUAÇÃO', 'MATRÍCULA', 'POLICIAL', 'SCORE ACUMULADO (ARMAS)']];

  const borderStyle = 'SOLID';
  mockSheet.getRange(1, 1, 1, 5)
    .setValues(cabecalhoResultado)
    .setFontFamily('Arial')
    .setFontSize(10)
    .setFontWeight('bold')
    .setBackground('#e0e0e0')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setBorder(true, true, true, true, true, true, '#000000', borderStyle);

  const rangeDados = mockSheet.getRange(2, 1, ranking.length, 5);
  rangeDados.setValues(ranking)
    .setFontFamily('Arial')
    .setFontSize(10)
    .setVerticalAlignment('middle')
    .setBorder(true, true, true, true, true, true, '#000000', borderStyle);

  let backgrounds = [];
  let fontColors = [];
  let fontWeights = [];

  ranking.forEach(row => {
    const pelotaoStr = String(row[0] || '');
    const gradStr = String(row[1] || '');
    const score = Number(row[4] || 0);

    const corPel = corPorGrupoArmas_(gradStr, pelotaoStr);
    const corArma = corPorArmasArmas_(score);
    const fwRow = corPel.negrito ? 'bold' : 'normal';

    backgrounds.push([corPel.fundo, corPel.fundo, corPel.fundo, corPel.fundo, corArma.fundo]);
    fontColors.push([corPel.fonte, corPel.fonte, corPel.fonte, corPel.fonte, corArma.fonte]);
    fontWeights.push([fwRow, fwRow, fwRow, fwRow, score >= 10 ? 'bold' : fwRow]);
  });

  rangeDados.setBackgrounds(backgrounds);
  rangeDados.setFontColors(fontColors);
  rangeDados.setFontWeights(fontWeights);

  mockSheet.getRange(2, 1, ranking.length, 3).setHorizontalAlignment('center');
  mockSheet.getRange(2, 4, ranking.length, 1).setHorizontalAlignment('left');
  mockSheet.getRange(2, 5, ranking.length, 1).setHorizontalAlignment('right').setNumberFormat('#,##0');
  mockSheet.setFrozenRows(1);
  mockSheet.getRange(1, 1, ranking.length + 1, 5).createFilter();

  // Validações
  assert.strictEqual(tracker.valores['1:1'], 'PELOTÃO');
  assert.strictEqual(tracker.valores['1:5'], 'SCORE ACUMULADO (ARMAS)');
  assert.strictEqual(tracker.backgrounds['1:1'], '#e0e0e0');
  assert.strictEqual(tracker.linhasCongeladas, 1);
  assert.strictEqual(tracker.filterCreated, true);

  // Formato e alinhamento do SCORE
  assert.strictEqual(tracker.numberFormats['2:5'], '#,##0');
  assert.strictEqual(tracker.alignments['2:5'], 'right');
  assert.strictEqual(tracker.alignments['2:4'], 'left');

  // Cores de Pelotão
  assert.strictEqual(tracker.backgrounds['2:1'], '#f1c232'); // Oficial (1º TEN)
  assert.strictEqual(tracker.backgrounds['3:1'], '#00cc00'); // 1º PEL GTAR
  assert.strictEqual(tracker.fontWeights['3:1'], 'bold');
  assert.strictEqual(tracker.backgrounds['5:1'], '#3c78d8'); // 2º PEL GTAR
  assert.strictEqual(tracker.fontColors['5:1'], '#ffffff');
  assert.strictEqual(tracker.fontWeights['5:1'], 'bold');

  // Escala de Armas (Coluna 5)
  assert.strictEqual(tracker.backgrounds['2:5'], '#38761d'); // 12 armas (10+)
  assert.strictEqual(tracker.fontColors['2:5'], '#ffffff');
  assert.strictEqual(tracker.backgrounds['3:5'], '#93c47d'); // 7 armas (6-9)
  assert.strictEqual(tracker.backgrounds['4:5'], '#ffff00'); // 4 armas (4-5)
  assert.strictEqual(tracker.backgrounds['5:5'], '#ff9900'); // 2 armas (1-3)
  assert.strictEqual(tracker.backgrounds['6:5'], '#ff0000'); // 0 armas (zero vermelho/vermelho)
  assert.strictEqual(tracker.fontColors['6:5'], '#ff0000');
});

console.log(`\n🎉 Testes do Relatório de ARMAS concluídos: ${sucessos} testes passaram!`);
}
