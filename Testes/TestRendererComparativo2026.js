'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/TestRendererComparativo2026.js
 * DESCRIÇÃO: Suíte de testes unitários e de regressão visual para o RendererComparativo2026 (M06.2).
 * Protege integralmente a referência visual soberana: títulos, metadados, grupos, cabeçalhos,
 * congelamento (linha 6), gridlines ocultas, filtro, larguras de 9 colunas, formatos numéricos (#,##0.00),
 * as seis cores oficiais de pelotões/GTAR, escala de destaque de armas, legenda e carimbo institucional.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const UtilsMod = require('../Core/Utils');
global.SyntheonUtils = UtilsMod.SyntheonUtils || UtilsMod;

const CONSTANTES_SYNTHEON = require('../Core/Constantes');
global.CONSTANTES_SYNTHEON = CONSTANTES_SYNTHEON;

// Carrega o RendererComparativo2026 de forma pura sem alterar o arquivo original
const codeRenderer = fs.readFileSync(path.join(__dirname, '../Render/RendererComparativo2026.js'), 'utf8');
vm.runInThisContext(codeRenderer);

// Mock mínimo de SpreadsheetApp.BorderStyle para Node.js
if (typeof SpreadsheetApp === 'undefined') {
  global.SpreadsheetApp = {
    BorderStyle: {
      SOLID: 'SOLID',
      SOLID_THICK: 'SOLID_THICK'
    }
  };
}

console.log('🧪 Iniciando Testes Unitários e Regressão Visual: COMPARATIVO_2026 (M06.2)...\n');

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

function criarMockSSComparativo() {
  const tracker = {
    valores: {},
    backgrounds: {},
    fontColors: {},
    fontWeights: {},
    fontSizes: {},
    fontFamilies: {},
    alignments: {},
    numberFormats: {},
    columnWidths: {},
    linhasCongeladas: 0,
    gridlinesOcultas: false,
    filterCreated: false,
    mergedRanges: []
  };

  const getCellKey = (r, c) => `${r}:${c}`;

  const createRangeMock = (row, col, numRows = 1, numCols = 1) => {
    const rangeObj = {
      merge: () => {
        tracker.mergedRanges.push({ row, col, numRows, numCols });
        return rangeObj;
      },
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
      setFontSize: (sz) => {
        for (let r = 0; r < numRows; r++) {
          for (let c = 0; c < numCols; c++) {
            tracker.fontSizes[getCellKey(row + r, col + c)] = sz;
          }
        }
        return rangeObj;
      },
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
    getName: () => 'COMPARATIVO_2026',
    clear: () => {},
    getFilter: () => null,
    clearConditionalFormatRules: () => {},
    setHiddenGridlines: (hidden) => { tracker.gridlinesOcultas = hidden; },
    setFrozenRows: (n) => { tracker.linhasCongeladas = n; },
    setColumnWidth: (col, w) => { tracker.columnWidths[col] = w; },
    getMaxRows: () => 100,
    getRange: (r, c, numR, numC) => createRangeMock(r, c, numR || 1, numC || 1),
    obterTracker: () => tracker
  };

  const mockSS = {
    getSheetByName: () => null,
    insertSheet: () => mockSheet
  };

  return { mockSS, mockSheet, tracker };
}

// Fixture com todas as 6 graduações/pelotões e faixas de armas para teste
const fixtureRegistros = [
  // L7: Oficial (10+ armas)
  { grad: '1º TEN', matricula: '100001-0', nome: 'TEN SILVA', pelotao: 'OFICIAIS', fatos: { ocorrencias: 15, armas: 12, drogasTotal: 50.5 }, indicadores: { pontosTotais: 150.00 } },
  // L8: 1º PEL GTAR (6-9 armas)
  { grad: 'SD', matricula: '100002-8', nome: 'SD SOUZA', pelotao: '1º PEL GTAR', fatos: { ocorrencias: 10, armas: 7, drogasTotal: 120.00 }, indicadores: { pontosTotais: 95.50 } },
  // L9: 1º PEL (4-5 armas)
  { grad: 'SD', matricula: '100003-6', nome: 'SD SANTOS', pelotao: '1º PEL', fatos: { ocorrencias: 8, armas: 4, drogasTotal: 0 }, indicadores: { pontosTotais: 80.00 } },
  // L10: 2º PEL GTAR (1-3 armas)
  { grad: 'CB', matricula: '100004-4', nome: 'CB OLIVEIRA', pelotao: '2º PEL GTAR', fatos: { ocorrencias: 5, armas: 2, drogasTotal: 15.75 }, indicadores: { pontosTotais: 45.25 } },
  // L11: 2º PEL (0 armas - vermelho)
  { grad: 'SD', matricula: '100005-2', nome: 'SD LIMA', pelotao: '2º PEL', fatos: { ocorrencias: 2, armas: 0, drogasTotal: 0 }, indicadores: { pontosTotais: 20.00 } },
  // L12: 3º PEL
  { grad: '1º SGT', matricula: '100006-0', nome: 'SGT FERREIRA', pelotao: '3º PEL', fatos: { ocorrencias: 1, armas: 1, drogasTotal: 5.00 }, indicadores: { pontosTotais: 10.00 } }
];

const metadataTeste = {
  periodo: '01/01/2026 a 31/12/2026',
  policiais: 6,
  atualizado: '29/07/2026 20:00',
  abasLidas: 12,
  ocorrencias: 41
};

// 1. Teste: Título, Metadados, Grupos e Cabeçalhos (Linhas 2, 4, 5, 6)
test('RendererComparativo2026: preserva exatamente título (L2), metadados (L4), grupos (L5) e cabeçalhos (L6)', () => {
  const { mockSS, tracker } = criarMockSSComparativo();
  RendererComparativo2026.render(mockSS, 'COMPARATIVO_2026', fixtureRegistros, metadataTeste);

  // L2: Título
  assert.strictEqual(tracker.valores['2:1'], 'Comparativo de produtividade 2026');
  assert.strictEqual(tracker.fontSizes['2:1'], 20);
  assert.strictEqual(tracker.fontWeights['2:1'], 'bold');

  // L4: Metadados
  assert.ok(tracker.valores['4:1'].includes('Ano base: 2026'));
  assert.strictEqual(tracker.fontColors['4:1'], '#4b5563');

  // L5: Grupos
  assert.strictEqual(tracker.valores['5:1'], 'IDENTIFICACAO');
  assert.strictEqual(tracker.valores['5:6'], 'QTD. O');
  assert.strictEqual(tracker.valores['5:7'], 'Pontuacao');
  assert.strictEqual(tracker.valores['5:8'], 'QTD. ARMAS');
  assert.strictEqual(tracker.valores['5:9'], 'ENTORPECENTES (g)');
  assert.strictEqual(tracker.backgrounds['5:1'], '#9e9e9e');

  // L6: Cabeçalhos
  assert.strictEqual(tracker.valores['6:1'], 'N');
  assert.strictEqual(tracker.valores['6:2'], 'Grad');
  assert.strictEqual(tracker.valores['6:3'], 'Matricula');
  assert.strictEqual(tracker.valores['6:4'], 'N GUERRA');
  assert.strictEqual(tracker.valores['6:5'], 'ESCALA');
  assert.strictEqual(tracker.valores['6:6'], '2026');
  assert.strictEqual(tracker.backgrounds['6:1'], '#f3f4f6');
});

// 2. Teste: Layout, Congelamento, Gridlines, Filtro e Larguras de Colunas
test('RendererComparativo2026: aplica congelamento na linha 6, oculta gridlines, ativa filtro e define larguras das 9 colunas', () => {
  const { mockSS, tracker } = criarMockSSComparativo();
  RendererComparativo2026.render(mockSS, 'COMPARATIVO_2026', fixtureRegistros, metadataTeste);

  assert.strictEqual(tracker.linhasCongeladas, 6);
  assert.strictEqual(tracker.gridlinesOcultas, true);
  assert.strictEqual(tracker.filterCreated, true);

  const largurasEsperadas = { 1: 44, 2: 70, 3: 92, 4: 260, 5: 86, 6: 72, 7: 112, 8: 92, 9: 140 };
  Object.keys(largurasEsperadas).forEach(col => {
    assert.strictEqual(tracker.columnWidths[col], largurasEsperadas[col], `Coluna ${col} deve ter largura ${largurasEsperadas[col]}`);
  });
});

// 3. Teste: Formatos Numéricos (#,##0.00)
test('RendererComparativo2026: aplica formato #,##0.00 para Pontuação (coluna 7) e Drogas (coluna 9)', () => {
  const { mockSS, tracker } = criarMockSSComparativo();
  RendererComparativo2026.render(mockSS, 'COMPARATIVO_2026', fixtureRegistros, metadataTeste);

  assert.strictEqual(tracker.numberFormats['7:7'], '#,##0.00'); // L7 Pontuação
  assert.strictEqual(tracker.numberFormats['7:9'], '#,##0.00'); // L7 Drogas
});

// 4. Teste: As Seis Cores Oficiais de Pelotões/GTAR
test('RendererComparativo2026: preserva fielmente as seis cores oficiais de pelotões e GTAR', () => {
  const { mockSS, tracker } = criarMockSSComparativo();
  RendererComparativo2026.render(mockSS, 'COMPARATIVO_2026', fixtureRegistros, metadataTeste);

  // L7: Oficial -> Fundo #f1c232, Fonte #000000
  assert.strictEqual(tracker.backgrounds['7:1'], '#f1c232');
  assert.strictEqual(tracker.fontColors['7:1'], '#000000');

  // L8: 1º PEL GTAR -> Fundo #00cc00, Fonte #000000, Bold
  assert.strictEqual(tracker.backgrounds['8:1'], '#00cc00');
  assert.strictEqual(tracker.fontColors['8:1'], '#000000');
  assert.strictEqual(tracker.fontWeights['8:1'], 'bold');

  // L9: 1º PEL -> Fundo #00ff00, Fonte #000000
  assert.strictEqual(tracker.backgrounds['9:1'], '#00ff00');
  assert.strictEqual(tracker.fontColors['9:1'], '#000000');

  // L10: 2º PEL GTAR -> Fundo #3c78d8, Fonte #ffffff, Bold
  assert.strictEqual(tracker.backgrounds['10:1'], '#3c78d8');
  assert.strictEqual(tracker.fontColors['10:1'], '#ffffff');
  assert.strictEqual(tracker.fontWeights['10:1'], 'bold');

  // L11: 2º PEL -> Fundo #6d9eeb, Fonte #000000
  assert.strictEqual(tracker.backgrounds['11:1'], '#6d9eeb');
  assert.strictEqual(tracker.fontColors['11:1'], '#000000');

  // L12: 3º PEL -> Fundo #ffffff, Fonte #000000
  assert.strictEqual(tracker.backgrounds['12:1'], '#ffffff');
  assert.strictEqual(tracker.fontColors['12:1'], '#000000');
});

// 5. Teste: Escala de Destaque de Armas (Coluna 8)
test('RendererComparativo2026: aplica a escala oficial de destaque de armas nos 5 limites', () => {
  const { mockSS, tracker } = criarMockSSComparativo();
  RendererComparativo2026.render(mockSS, 'COMPARATIVO_2026', fixtureRegistros, metadataTeste);

  // L7: 12 armas (10+) -> Fundo #38761d, Fonte #ffffff
  assert.strictEqual(tracker.backgrounds['7:8'], '#38761d');
  assert.strictEqual(tracker.fontColors['7:8'], '#ffffff');

  // L8: 7 armas (6-9) -> Fundo #93c47d, Fonte #000000
  assert.strictEqual(tracker.backgrounds['8:8'], '#93c47d');
  assert.strictEqual(tracker.fontColors['8:8'], '#000000');

  // L9: 4 armas (4-5) -> Fundo #ffff00, Fonte #000000
  assert.strictEqual(tracker.backgrounds['9:8'], '#ffff00');
  assert.strictEqual(tracker.fontColors['9:8'], '#000000');

  // L10: 2 armas (1-3) -> Fundo #ff9900, Fonte #000000
  assert.strictEqual(tracker.backgrounds['10:8'], '#ff9900');
  assert.strictEqual(tracker.fontColors['10:8'], '#000000');

  // L11: 0 armas -> Fundo #ff0000, Fonte #ff0000 (Vermelho/Vermelho)
  assert.strictEqual(tracker.backgrounds['11:8'], '#ff0000');
  assert.strictEqual(tracker.fontColors['11:8'], '#ff0000');
});

// 6. Teste: Legenda e Carimbo Institucional
test('RendererComparativo2026: gera legenda de pelotões/armas e carimbo institucional com metadados', () => {
  const { mockSS, tracker } = criarMockSSComparativo();
  RendererComparativo2026.render(mockSS, 'COMPARATIVO_2026', fixtureRegistros, metadataTeste);

  const ultimaLinhaDados = 7 + fixtureRegistros.length - 1; // L12
  const legLinha = ultimaLinhaDados + 3; // L15
  assert.strictEqual(tracker.valores[`${legLinha}:1`], 'LEGENDA');
  assert.strictEqual(tracker.valores[`${legLinha}:5`], 'ARMAS');

  const carimboLinha = legLinha + 7; // L22
  assert.ok(tracker.valores[`${carimboLinha}:1`].includes('PRODUTIVIDADE_GERAL / SYNTHÉON V2'));
  assert.ok(tracker.valores[`${carimboLinha}:1`].includes('Periodo: 01/01/2026 a 31/12/2026'));
  assert.strictEqual(tracker.backgrounds[`${carimboLinha}:1`], '#f8fafc');
});

console.log(`\n🎉 Testes do RendererComparativo2026 concluídos: ${sucessos} testes passaram!`);
}
