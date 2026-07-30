'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/TestRelatorioDrogas.js
 * DESCRIÇÃO: Suíte de testes unitários e de integração real para a padronização visual
 * do Relatório de Entorpecentes GS (TASK-M06.2-05).
 * Executa a função de produção executarCompiladorDrogas() de verdade em ambiente mockado.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const UtilsMod = require('../Core/Utils');
global.SyntheonUtils = UtilsMod.SyntheonUtils || UtilsMod;

const CONSTANTES_SYNTHEON = require('../Core/Constantes');
global.CONSTANTES_SYNTHEON = CONSTANTES_SYNTHEON;

const CabecalhosMod = require('../Core/Cabecalhos');
global.SyntheonCabecalhos = CabecalhosMod.SyntheonCabecalhos || CabecalhosMod;

// Globais do Apps Script exigidas na execução real
global.Utilities = {
  formatDate: () => '29/07/2026 23:00:00'
};

global.Session = {
  getScriptTimeZone: () => 'America/Recife'
};

// Carrega o Compilador de Entorpecentes.js via vm.runInThisContext
const codeDrogas = fs.readFileSync(path.join(__dirname, '../Compilador de Entorpecentes.js'), 'utf8');
vm.runInThisContext(codeDrogas);

if (typeof SpreadsheetApp === 'undefined') {
  global.SpreadsheetApp = {
    BorderStyle: {
      SOLID: 'SOLID',
      SOLID_THICK: 'SOLID_THICK'
    }
  };
}

console.log('🧪 Iniciando Testes Unitários e Integrados: Relatório de DROGAS (M06.2-05)...\n');

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

// 1. Teste: Auxiliares de Cores de Pelotões e Escala de Drogas
test('Drogas: corPorGrupoDrogas_ e corPorTotalDrogas_ cobrem todas as regras protegidas', () => {
  // Pelotões
  assert.deepStrictEqual(corPorGrupoDrogas_('1º TEN', 'OFICIAIS'), { fundo: '#F1C232', fonte: '#000000', negrito: false });
  assert.deepStrictEqual(corPorGrupoDrogas_('SD', '1º PEL GTAR'), { fundo: '#00CC00', fonte: '#000000', negrito: true });
  assert.deepStrictEqual(corPorGrupoDrogas_('SD', '1º PEL'), { fundo: '#00FF00', fonte: '#000000', negrito: false });
  assert.deepStrictEqual(corPorGrupoDrogas_('CB', '2º PEL GTAR'), { fundo: '#3C78D8', fonte: '#FFFFFF', negrito: true });
  assert.deepStrictEqual(corPorGrupoDrogas_('SD', '2º PEL'), { fundo: '#6D9EEB', fonte: '#000000', negrito: false });
  assert.deepStrictEqual(corPorGrupoDrogas_('SGT', '3º PEL'), { fundo: '#FFFFFF', fonte: '#000000', negrito: false });

  // Escala de Total de Drogas
  assert.deepStrictEqual(corPorTotalDrogas_(1500), { fundo: '#38761D', fonte: '#FFFFFF', negrito: true }); // >= 1000g
  assert.deepStrictEqual(corPorTotalDrogas_(600), { fundo: '#93C47D', fonte: '#000000', negrito: false });  // >= 500g
  assert.deepStrictEqual(corPorTotalDrogas_(300), { fundo: '#FFFF00', fonte: '#000000', negrito: false });  // >= 200g
  assert.deepStrictEqual(corPorTotalDrogas_(80), { fundo: '#FF9900', fonte: '#000000', negrito: false });   // >= 50g
  assert.deepStrictEqual(corPorTotalDrogas_(20), { fundo: '#FFFFFF', fonte: '#000000', negrito: false });   // < 50g
});

// 2. Teste: Execução Integrada Real de executarCompiladorDrogas()
test('Drogas: executarCompiladorDrogas() real gera aba de saída com 10 colunas, paleta oficial, formatos e totais intactos', () => {
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

  const mockJanSheet = {
    getName: () => 'JAN2026',
    getLastColumn: () => 7,
    getLastRow: () => 7,
    getRange: (r, c, numR, numC) => ({
      getValues: () => {
        if (r === 1) return [['BOE', 'PELOTÃO', 'MATRICULA', 'POLICIAL', 'GRAD', 'TOTAL DE MACONHA', 'TOTAL DE COCAINA']];
        return [
          ['BOE201', 'OFICIAIS', '100001', 'TEN SILVA', '1º TEN', 1000, 500],   // Total 1500g (Rank 1)
          ['BOE202', '1º PEL GTAR', '100002', 'SD SOUZA', 'SD', 400, 200],     // Total 600g (Rank 2)
          ['BOE203', '3º PEL', '100006', 'SGT FERREIRA', '1º SGT', 300, 300],  // Total 600g (Rank 3)
          ['BOE204', '1º PEL', '100003', 'SD SANTOS', 'SD', 200, 100],        // Total 300g (Rank 4)
          ['BOE205', '2º PEL GTAR', '100004', 'CB OLIVEIRA', 'CB', 50, 30],     // Total 80g (Rank 5)
          ['BOE206', '2º PEL', '100005', 'SD LIMA', 'SD', 10, 10]             // Total 20g (Rank 6)
        ];
      }
    })
  };

  const dummyLogRange = { setValues: () => dummyLogRange, setFontFamily: () => dummyLogRange };
  const mockAbaLog = {
    clear: () => {},
    getRange: () => dummyLogRange,
    autoResizeColumns: () => {}
  };

  const mockResultadoSheet = {
    getName: () => 'COMP_DROGAS_2026',
    setFrozenRows: (n) => { tracker.linhasCongeladas = n; },
    autoResizeColumns: () => {},
    getRange: (r, c, numR, numC) => createRangeMock(r, c, numR || 1, numC || 1)
  };

  const mockSS = {
    getSheetByName: (nome) => {
      if (nome === 'JAN2026') return mockJanSheet;
      if (nome === 'LOG_DROGAS_ANUAL') return mockAbaLog;
      return null;
    },
    insertSheet: (nome) => {
      if (nome === 'LOG_DROGAS_ANUAL') return mockAbaLog;
      return mockResultadoSheet;
    }
  };

  global.SpreadsheetApp.getActiveSpreadsheet = () => mockSS;
  global.SpreadsheetApp.getUi = () => ({
    alert: () => {},
    showModalDialog: () => {},
    ButtonSet: { OK: 'OK', YES_NO: 'YES_NO' },
    Button: { YES: 'YES', NO: 'NO' }
  });

  // Executa o caminho de produção real do compilador de entorpecentes
  executarCompiladorDrogas(['JAN2026'], 'ANUAL');

  // Validação dos Cabeçalhos das 10 colunas
  assert.strictEqual(tracker.valores['1:1'], 'POS');
  assert.strictEqual(tracker.valores['1:2'], 'PELOTÃO');
  assert.strictEqual(tracker.valores['1:3'], 'GRADUAÇÃO');
  assert.strictEqual(tracker.valores['1:4'], 'MATRÍCULA');
  assert.strictEqual(tracker.valores['1:5'], 'POLICIAL');
  assert.strictEqual(tracker.valores['1:6'], 'MACONHA (g)');
  assert.strictEqual(tracker.valores['1:7'], 'COCAÍNA (g)');
  assert.strictEqual(tracker.valores['1:8'], 'TOTAL (g)');
  assert.strictEqual(tracker.valores['1:9'], 'OCORRÊNCIAS');
  assert.strictEqual(tracker.valores['1:10'], 'BOEs');

  assert.strictEqual(tracker.backgrounds['1:1'], '#e0e0e0');
  assert.strictEqual(tracker.linhasCongeladas, 1);
  assert.strictEqual(tracker.filterCreated, true);

  // Validação dos Totais Matemáticos (Maconha + Cocaína = Total)
  // L2: TEN SILVA (1000 + 500 = 1500)
  assert.strictEqual(tracker.valores['2:6'], 1000);
  assert.strictEqual(tracker.valores['2:7'], 500);
  assert.strictEqual(tracker.valores['2:8'], 1500);

  // Formatos e Alinhamentos
  assert.strictEqual(tracker.numberFormats['2:6'], '#,##0.00" g"');
  assert.strictEqual(tracker.numberFormats['2:8'], '#,##0.00" g"');
  assert.strictEqual(tracker.numberFormats['2:9'], '#,##0');

  assert.strictEqual(tracker.alignments['2:1'], 'center');
  assert.strictEqual(tracker.alignments['2:4'], 'center');
  assert.strictEqual(tracker.alignments['2:5'], 'left');
  assert.strictEqual(tracker.alignments['2:6'], 'right');
  assert.strictEqual(tracker.alignments['2:8'], 'right');
  assert.strictEqual(tracker.alignments['2:10'], 'right');

  // Cores dos Pelotões nas colunas A:G e I:J por ranking de total
  // L2: TEN SILVA (Oficial) -> Fundo #F1C232
  assert.strictEqual(tracker.backgrounds['2:2'], '#F1C232');
  // L3: SD SOUZA (1º PEL GTAR) -> Fundo #00CC00 bold
  assert.strictEqual(tracker.backgrounds['3:2'], '#00CC00');
  assert.strictEqual(tracker.fontWeightsMatriz[1][1], 'bold');
  // L4: SGT FERREIRA (3º PEL) -> Fundo #FFFFFF
  assert.strictEqual(tracker.backgrounds['4:2'], '#FFFFFF');
  // L5: SD SANTOS (1º PEL) -> Fundo #00FF00
  assert.strictEqual(tracker.backgrounds['5:2'], '#00FF00');
  // L6: CB OLIVEIRA (2º PEL GTAR) -> Fundo #3C78D8 bold branco
  assert.strictEqual(tracker.backgrounds['6:2'], '#3C78D8');
  assert.strictEqual(tracker.fontColorsMatriz[4][1], '#FFFFFF');
  assert.strictEqual(tracker.fontWeightsMatriz[4][1], 'bold');
  // L7: SD LIMA (2º PEL) -> Fundo #6D9EEB
  assert.strictEqual(tracker.backgrounds['7:2'], '#6D9EEB');

  // Escala do Total de Drogas na Coluna H (Col 8)
  assert.strictEqual(tracker.backgrounds['2:8'], '#38761D'); // 1500g (>= 1000g)
  assert.strictEqual(tracker.fontColorsMatriz[0][7], '#FFFFFF');
  assert.strictEqual(tracker.fontWeightsMatriz[0][7], 'bold');
  assert.strictEqual(tracker.backgrounds['3:8'], '#93C47D'); // 600g (>= 500g)
  assert.strictEqual(tracker.backgrounds['4:8'], '#93C47D'); // 600g (>= 500g)
  assert.strictEqual(tracker.backgrounds['5:8'], '#FFFF00'); // 300g (>= 200g)
  assert.strictEqual(tracker.backgrounds['6:8'], '#FF9900'); // 80g (>= 50g)
  assert.strictEqual(tracker.backgrounds['7:8'], '#FFFFFF'); // 20g (< 50g)
});

console.log(`\n🎉 Testes do Relatório de DROGAS concluídos: ${sucessos} testes passaram!`);
}
