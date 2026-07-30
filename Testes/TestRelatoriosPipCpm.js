'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/TestRelatoriosPipCpm.js
 * DESCRIÇÃO: Suíte de testes unitários para a padronização visual e preservação de regras protegidas
 * do Compilador PIP e CPM - Compilador de Pontuação Mensal (TASK-M06.2-03).
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const UtilsMod = require('../Core/Utils');
global.SyntheonUtils = UtilsMod.SyntheonUtils || UtilsMod;

// Carrega os compiladores via vm.runInThisContext sem alterar a estrutura global do script
const codePip = fs.readFileSync(path.join(__dirname, '../Compilador PIP.js'), 'utf8');
vm.runInThisContext(codePip);

const codeCPM = fs.readFileSync(path.join(__dirname, '../CPM – Compilador de Pontuação Mensal.js'), 'utf8');
vm.runInThisContext(codeCPM);

if (typeof SpreadsheetApp === 'undefined') {
  global.SpreadsheetApp = {
    BorderStyle: {
      SOLID: 'SOLID',
      SOLID_THICK: 'SOLID_THICK'
    }
  };
}

console.log('🧪 Iniciando Testes Unitários: Padronização PIP & CPM (M06.2-03)...\n');

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

function criarMockSSGenerico(nomeAbaTarget) {
  const tracker = {
    valores: {},
    backgrounds: {},
    fontColors: {},
    fontWeights: {},
    fontFamilies: {},
    alignments: {},
    numberFormats: {},
    linhasCongeladas: 0,
    filterCreated: false
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
      setFontColor: (fc) => {
        for (let r = 0; r < numRows; r++) {
          for (let c = 0; c < numCols; c++) {
            tracker.fontColors[getCellKey(row + r, col + c)] = fc;
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
    getName: () => nomeAbaTarget,
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

// 1. Teste: Prova da Diferença de Períodos entre PIP (29-28) e CPM (Mês Civil)
test('Regra de Período: confirma que PIP usa ciclo 29-28 e CPM usa Mês Civil (dia 1º ao último)', () => {
  // Janeiro 2026 (mes = 0)
  const periodoPip = calcularPeriodoPip(0, 2026);
  assert.strictEqual(periodoPip.inicio.getFullYear(), 2025);
  assert.strictEqual(periodoPip.inicio.getMonth(), 11); // Dezembro 2025
  assert.strictEqual(periodoPip.inicio.getDate(), 29);
  assert.strictEqual(periodoPip.fim.getFullYear(), 2026);
  assert.strictEqual(periodoPip.fim.getMonth(), 0); // Janeiro 2026
  assert.strictEqual(periodoPip.fim.getDate(), 28);

  const periodoCpm = calcularPeriodoCPM(0, 2026);
  assert.strictEqual(periodoCpm.inicio.getFullYear(), 2026);
  assert.strictEqual(periodoCpm.inicio.getMonth(), 0); // Janeiro 2026
  assert.strictEqual(periodoCpm.inicio.getDate(), 1);
  assert.strictEqual(periodoCpm.fim.getFullYear(), 2026);
  assert.strictEqual(periodoCpm.fim.getMonth(), 0); // Janeiro 2026
  assert.strictEqual(periodoCpm.fim.getDate(), 31);
});

// 2. Teste: Formatação e Cores de Pelotão no PIP (usando DESIGNAÇÃO)
test('PIP: preserva cabeçalho #d9ead3, aplica fontes Arial, formatos #,##0.00 e cores de pelotão por DESIGNAÇÃO', () => {
  const { mockSS, tracker } = criarMockSSGenerico('PIP_JAN_2026');

  const rankingPip = [
    [1, '1º TEN', '100001-0', 'TEN SILVA', 'OFICIAIS', 150.5, 12],
    [2, 'SD', '100002-8', 'SD SOUZA', '1º PEL GTAR', 95.0, 8],
    [3, 'SD', '100003-6', 'SD SANTOS', '1º PEL', 80.25, 6],
    [4, 'CB', '100004-4', 'CB OLIVEIRA', '2º PEL GTAR', 45.0, 4],
    [5, 'SD', '100005-2', 'SD LIMA', '2º PEL', 20.0, 2],
    [6, '1º SGT', '100006-0', 'SGT FERREIRA', '3º PEL', 10.0, 1]
  ];

  criarAbaResultado_(mockSS, rankingPip, null, null, 'PIP_JAN_2026');

  // Cabeçalho L1
  assert.strictEqual(tracker.valores['1:1'], 'RANK');
  assert.strictEqual(tracker.valores['1:5'], 'DESIGNAÇÃO');
  assert.strictEqual(tracker.valores['1:6'], 'PONTUAÇÃO');
  assert.strictEqual(tracker.backgrounds['1:1'], '#d9ead3');
  assert.strictEqual(tracker.linhasCongeladas, 1);
  assert.strictEqual(tracker.filterCreated, true);

  // Formatos e Alinhamentos
  assert.strictEqual(tracker.numberFormats['2:6'], '#,##0.00'); // PONTUAÇÃO (Col 6)
  assert.strictEqual(tracker.numberFormats['2:7'], '#,##0');    // QTD OC (Col 7)
  assert.strictEqual(tracker.alignments['2:1'], 'center');     // RANK
  assert.strictEqual(tracker.alignments['2:4'], 'left');       // NOME
  assert.strictEqual(tracker.alignments['2:6'], 'right');      // PONTUAÇÃO
  assert.strictEqual(tracker.alignments['2:7'], 'right');      // QTD OC

  // Cores de Pelotão
  assert.strictEqual(tracker.backgrounds['2:1'], '#f1c232'); // Oficial
  assert.strictEqual(tracker.backgrounds['3:1'], '#00cc00'); // 1º PEL GTAR
  assert.strictEqual(tracker.fontWeights['3:1'], 'bold');
  assert.strictEqual(tracker.backgrounds['4:1'], '#00ff00'); // 1º PEL
  assert.strictEqual(tracker.backgrounds['5:1'], '#3c78d8'); // 2º PEL GTAR
  assert.strictEqual(tracker.fontColors['5:1'], '#ffffff');
  assert.strictEqual(tracker.fontWeights['5:1'], 'bold');
  assert.strictEqual(tracker.backgrounds['6:1'], '#6d9eeb'); // 2º PEL
  assert.strictEqual(tracker.backgrounds['7:1'], '#ffffff'); // 3º PEL
});

// 3. Teste: Formatação e Manutenção de Estrutura no CPM
test('CPM: preserva 6 colunas originais, cabeçalho #d9ead3, formato #,##0.00 e alinhamentos sem inventar pelotão', () => {
  const { mockSS, tracker } = criarMockSSGenerico('CPM_JAN_2026');

  const rankingCPM = [
    [1, '1º TEN', '100001-0', 'TEN SILVA', 12, 150.5],
    [2, 'SD', '100002-8', 'SD SOUZA', 8, 95.0]
  ];

  criarAbaResultadoCPM_(mockSS, rankingCPM, null, null, 'CPM_JAN_2026');

  // Cabeçalho L1
  assert.strictEqual(tracker.valores['1:1'], 'RANK');
  assert.strictEqual(tracker.valores['1:5'], 'OCORRÊNCIAS');
  assert.strictEqual(tracker.valores['1:6'], 'PONTUAÇÃO');
  assert.strictEqual(tracker.valores['1:7'], undefined); // Estritamente 6 colunas!
  assert.strictEqual(tracker.backgrounds['1:1'], '#d9ead3');
  assert.strictEqual(tracker.linhasCongeladas, 1);
  assert.strictEqual(tracker.filterCreated, true);

  // Formatos e Alinhamentos
  assert.strictEqual(tracker.numberFormats['2:5'], '#,##0');    // OCORRÊNCIAS (Col 5)
  assert.strictEqual(tracker.numberFormats['2:6'], '#,##0.00'); // PONTUAÇÃO (Col 6)
  assert.strictEqual(tracker.alignments['2:1'], 'center');     // RANK
  assert.strictEqual(tracker.alignments['2:4'], 'left');       // NOME COMPLETO
  assert.strictEqual(tracker.alignments['2:5'], 'right');      // OCORRÊNCIAS
  assert.strictEqual(tracker.alignments['2:6'], 'right');      // PONTUAÇÃO
});

console.log(`\n🎉 Testes do PIP & CPM concluídos: ${sucessos} testes passaram!`);
}
