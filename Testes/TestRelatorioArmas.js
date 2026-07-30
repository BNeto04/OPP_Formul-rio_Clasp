'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/TestRelatorioArmas.js
 * DESCRIÇÃO: Suíte de testes unitários e de integração real para a padronização visual
 * e escala de armas do Compilador de Armas GS (TASK-M06.2-04).
 * Executa a função de produção executarCompilador() de verdade em um ambiente mockado.
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
  formatDate: () => '29/07/2026 22:30:00'
};

global.Session = {
  getScriptTimeZone: () => 'America/Recife'
};

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

console.log('🧪 Iniciando Testes Unitários e Integrados: Relatório de ARMAS (M06.2-04)...\n');

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

// 2. Teste: Execução Integrada Real de executarCompilador()
test('Armas: executarCompilador() real gera aba de saída com paleta oficial, escala de armas e zero em vermelho', () => {
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
    getLastColumn: () => 6,
    getLastRow: () => 6,
    getRange: (r, c, numR, numC) => ({
      getValues: () => {
        if (r === 1) return [['BOE', 'PELOTÃO', 'MATRICULA', 'POLICIAL', 'GRAD', 'QTD ARMAS']];
        return [
          ['BOE101', 'OFICIAIS', '100001', 'TEN SILVA', '1º TEN', 12],
          ['BOE102', '1º PEL GTAR', '100002', 'SD SOUZA', 'SD', 7],
          ['BOE103', '1º PEL', '100003', 'SD SANTOS', 'SD', 4],
          ['BOE104', '2º PEL GTAR', '100004', 'CB OLIVEIRA', 'CB', 2],
          ['BOE105', '3º PEL', '100006', 'SGT FERREIRA', '1º SGT', 1]
        ];
      }
    })
  };

  // Mock isolado para a aba de LOG que não contamina os dados do relatório
  const dummyLogRange = { setValues: () => dummyLogRange, setFontFamily: () => dummyLogRange };
  const mockAbaLog = {
    clear: () => {},
    getRange: () => dummyLogRange,
    autoResizeColumns: () => {}
  };

  const mockResultadoSheet = {
    getName: () => 'COMP_ARMAS_2026',
    setFrozenRows: (n) => { tracker.linhasCongeladas = n; },
    autoResizeColumns: () => {},
    getRange: (r, c, numR, numC) => createRangeMock(r, c, numR || 1, numC || 1)
  };

  const mockSS = {
    getSheetByName: (nome) => {
      if (nome === 'JAN2026') return mockJanSheet;
      if (nome === 'LOG_ANUAL') return mockAbaLog;
      return null;
    },
    insertSheet: (nome) => {
      if (nome === 'LOG_ANUAL') return mockAbaLog;
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

  // Executa o caminho de produção real do compilador de armas
  executarCompilador(['JAN2026'], 'ANUAL');

  // Validações do cabeçalho da aba de saída COMP_ARMAS_2026
  assert.strictEqual(tracker.valores['1:1'], 'PELOTÃO');
  assert.strictEqual(tracker.valores['1:5'], 'SCORE ACUMULADO (ARMAS)');
  assert.strictEqual(tracker.backgrounds['1:1'], '#e0e0e0');
  assert.strictEqual(tracker.linhasCongeladas, 1);
  assert.strictEqual(tracker.filterCreated, true);

  // Formatos e Alinhamentos dos Dados
  assert.strictEqual(tracker.numberFormats['2:5'], '#,##0');
  assert.strictEqual(tracker.alignments['2:5'], 'right');
  assert.strictEqual(tracker.alignments['2:4'], 'left');

  // Cores dos Pelotões (ordenados por maior score de armas)
  // L2: TEN SILVA (12 armas - Oficial) -> Fundo #f1c232
  assert.strictEqual(tracker.backgrounds['2:1'], '#f1c232');
  // L3: SD SOUZA (7 armas - 1º PEL GTAR) -> Fundo #00cc00 bold
  assert.strictEqual(tracker.backgrounds['3:1'], '#00cc00');
  assert.strictEqual(tracker.fontWeightsMatriz[1][0], 'bold');
  // L4: SD SANTOS (4 armas - 1º PEL) -> Fundo #00ff00
  assert.strictEqual(tracker.backgrounds['4:1'], '#00ff00');
  // L5: CB OLIVEIRA (2 armas - 2º PEL GTAR) -> Fundo #3c78d8 bold branco
  assert.strictEqual(tracker.backgrounds['5:1'], '#3c78d8');
  assert.strictEqual(tracker.fontColorsMatriz[3][0], '#ffffff');
  assert.strictEqual(tracker.fontWeightsMatriz[3][0], 'bold');

  // Escala de Armas na Coluna 5
  assert.strictEqual(tracker.backgrounds['2:5'], '#38761d'); // 12 armas (10+)
  assert.strictEqual(tracker.fontColorsMatriz[0][4], '#ffffff');
  assert.strictEqual(tracker.backgrounds['3:5'], '#93c47d'); // 7 armas (6 a 9)
  assert.strictEqual(tracker.backgrounds['4:5'], '#ffff00'); // 4 armas (4 a 5)
  assert.strictEqual(tracker.backgrounds['5:5'], '#ff9900'); // 2 armas (1 a 3)
});

console.log(`\n🎉 Testes do Relatório de ARMAS concluídos: ${sucessos} testes passaram!`);
}
