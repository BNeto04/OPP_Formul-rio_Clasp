'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/TestRenderers.js
 * DESCRIÇÃO: Suíte dedicada a testes unitários e de regressão visual para Renderers do Synthéon (M06).
 * Valida especificamente o RendererAuditoriaSaude: paleta de severidades, congelamento de painéis,
 * alinhamentos à esquerda, zebrado, formatação do histórico e destaque isolado na Coluna AM.
 */

const assert = require('assert');

const UtilsMod = require('../Core/Utils');
global.SyntheonUtils = UtilsMod.SyntheonUtils || UtilsMod;

const CONSTANTES_SYNTHEON = require('../Core/Constantes');
global.CONSTANTES_SYNTHEON = CONSTANTES_SYNTHEON;

const { RegrasQualidade, SEVERIDADES_GUARDIAO } = require('../Core/RegrasQualidade');
global.RegrasQualidade = RegrasQualidade;
global.SEVERIDADES_GUARDIAO = SEVERIDADES_GUARDIAO;

const RendererAuditoriaSaude = require('../Render/RendererAuditoriaSaude');
global.RendererAuditoriaSaude = RendererAuditoriaSaude;

console.log('🧪 Iniciando Testes Unitários e Regressão Visual: Renderizadores do Synthéon (M06)...\n');

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

function criarMockSheetRenderer(headers, dadosLinhas, nomeAba = 'JUL2026_TESTE') {
  const dadosTotais = [headers, ...dadosLinhas];
  const mapSubSheets = {};
  const mainTracker = { coresBackground: [], coresFont: [], alinhamentos: [] };

  const createRangeMock = (targetRow, targetCol, sheetDataRef, subTracker = null, numRowsParam = 1, numColsParam = 1) => {
    const rangeObj = {
      getValues: () => {
        if (sheetDataRef.storage) {
          const startR = targetRow - 1;
          return sheetDataRef.storage.slice(startR, startR + numRowsParam);
        }
        return sheetDataRef.values || dadosTotais;
      },
      setValues: (vals) => {
        if (sheetDataRef.storage) {
          const startR = targetRow - 1;
          const startC = targetCol - 1;
          vals.forEach((r, ri) => {
            if (!sheetDataRef.storage[startR + ri]) sheetDataRef.storage[startR + ri] = [];
            r.forEach((c, ci) => {
              sheetDataRef.storage[startR + ri][startC + ci] = c;
            });
          });
        }
        return rangeObj;
      },
      clearDataValidations: () => rangeObj,
      clearContent: () => rangeObj,
      clear: () => rangeObj,
      setFontWeight: () => rangeObj,
      setFontColor: (color) => {
        if (sheetDataRef.isMain) mainTracker.coresFont.push({ row: targetRow, col: targetCol, color });
        if (subTracker && subTracker.coresFont) subTracker.coresFont.push({ row: targetRow, col: targetCol, color });
        return rangeObj;
      },
      setBackground: (color) => {
        if (sheetDataRef.isMain) mainTracker.coresBackground.push({ row: targetRow, col: targetCol, color });
        if (subTracker && subTracker.coresBackground) subTracker.coresBackground.push({ row: targetRow, col: targetCol, color });
        return rangeObj;
      },
      setHorizontalAlignment: (align) => {
        if (sheetDataRef.isMain) mainTracker.alinhamentos.push({ row: targetRow, col: targetCol, align });
        if (subTracker && subTracker.alinhamentos) subTracker.alinhamentos.push({ row: targetRow, col: targetCol, align });
        return rangeObj;
      },
      setVerticalAlignment: () => rangeObj,
      setFontSize: () => rangeObj,
      setFontFamily: () => rangeObj,
      setBorder: () => rangeObj,
      createFilter: () => rangeObj
    };
    return rangeObj;
  };

  const mainRef = { values: dadosTotais, isMain: true };

  const getSubSheet = (name) => {
    if (!mapSubSheets[name]) {
      const subStorage = [];
      const subTracker = { linhasCongeladas: 0, alinhamentos: [], coresBackground: [], coresFont: [] };
      mapSubSheets[name] = {
        getName: () => name,
        getLastRow: () => subStorage.length,
        getLastColumn: () => (subStorage[0] ? subStorage[0].length : 0),
        clear: () => { subStorage.length = 0; },
        getRange: (r, c, numR, numC) => createRangeMock(r, c, { storage: subStorage }, subTracker, numR || 1, numC || 1),
        autoResizeColumns: () => {},
        setFontWeight: () => {},
        setFrozenRows: (n) => { subTracker.linhasCongeladas = n; },
        setHiddenGridlines: () => {},
        setColumnWidth: () => {},
        obterDadosArmazenados: () => subStorage,
        obterLinhasCongeladas: () => subTracker.linhasCongeladas,
        obterAlinhamentos: () => subTracker.alinhamentos,
        obterCoresBackground: () => subTracker.coresBackground,
        obterCoresFont: () => subTracker.coresFont
      };
    }
    return mapSubSheets[name];
  };

  const parentMock = {
    getSheets: () => [sheetMock, ...Object.keys(mapSubSheets).map(k => mapSubSheets[k])],
    getSheetByName: (n) => mapSubSheets[n] || null,
    insertSheet: (n) => getSubSheet(n)
  };

  const sheetMock = {
    getName: () => nomeAba,
    getLastRow: () => dadosTotais.length,
    getLastColumn: () => headers.length,
    getRange: (row, col, numR, numC) => createRangeMock(row, col, mainRef, null, numR || 1, numC || 1),
    getParent: () => parentMock,
    obterSubAba: (n) => mapSubSheets[n],
    obterCoresMainBackground: () => mainTracker.coresBackground,
    obterCoresMainFont: () => mainTracker.coresFont
  };

  return sheetMock;
}

// 1. Validação da Paleta Oficial de Severidades
test('RendererAuditoriaSaude: paleta oficial de severidades possui os 6 níveis definidos e imutáveis', () => {
  const paleta = RendererAuditoriaSaude.PALETA_SEVERIDADES;
  assert.strictEqual(paleta['ERRO TECNICO'].fundo, '#900C3F');
  assert.strictEqual(paleta['CRITICO'].fundo, '#D9534F');
  assert.strictEqual(paleta['ALERTA'].fundo, '#F0AD4E');
  assert.strictEqual(paleta['OBSERVACAO'].fundo, '#5BC0DE');
  assert.strictEqual(paleta['EXCECAO MANUAL'].fundo, '#6F42C1');
  assert.strictEqual(paleta['APROVADO'].fundo, '#28A745');
});

// 2. Validação da Estilização Visual da Aba [AUDITORIA] Ocorrencias
test('RendererAuditoriaSaude: estilização da aba [AUDITORIA] aplica congelamento na linha 5 e alinhamento à esquerda nas colunas 6-8', () => {
  const headers = ['DATA', 'NÚMERO MIKE', 'BOE', 'MATRÍCULA', 'POLICIAL', 'ARMAS', 'OCORRÊNCIA PIP', 'IMPUTADO?', 'ALERTA INTEGRIDADE'];
  const mockSheet = criarMockSheetRenderer(headers, [['15/07/2026', '', '26E100', '113920-7', 'SD SILVA', 1, 'PORTE', 'COM IMPUTADO', '']]);

  const diags = [{
    severidade: 'CRITICO',
    codigoRegra: 'OCORRENCIA_ORFA',
    linha: 2,
    tunel: '15/07/2026|26E100',
    diagnostico: 'Linha com participação sem MIKE',
    evidencia: 'SD SILVA',
    acaoRecomendada: 'Preencher MIKE'
  }];

  RendererAuditoriaSaude.renderizarLog(mockSheet, diags, { '15/07/2026|26E100': {} }, 1);

  const subLog = mockSheet.obterSubAba('[AUDITORIA] Ocorrencias');
  assert.ok(subLog);
  assert.strictEqual(subLog.obterLinhasCongeladas(), 5);

  const alinhamentos = subLog.obterAlinhamentos();
  const alignLeftCols6To8 = alinhamentos.find(a => a.row === 6 && a.col === 6 && a.align === 'left');
  assert.ok(alignLeftCols6To8, 'As colunas 6 a 8 da tabela de auditoria devem ter alinhamento à esquerda (left)');
});

// 3. Validação da Estilização Visual da Aba [HISTORICO] Auditoria Ocorrencias
test('RendererAuditoriaSaude: estilização do [HISTORICO] aplica congelamento apenas na linha 1 e alinhamento à esquerda nas colunas 7-9', () => {
  const headers = ['DATA', 'NÚMERO MIKE', 'BOE', 'MATRÍCULA', 'POLICIAL', 'ARMAS', 'OCORRÊNCIA PIP', 'IMPUTADO?', 'ALERTA INTEGRIDADE'];
  const mockSheet = criarMockSheetRenderer(headers, [['15/07/2026', '', '26E100', '113920-7', 'SD SILVA', 1, 'PORTE', 'COM IMPUTADO', '']]);

  const diags = [{
    severidade: 'ALERTA',
    codigoRegra: 'MIKE_SUSPEITO',
    linha: 2,
    tunel: '15/07/2026|2026',
    diagnostico: 'MIKE suspeito 2026',
    evidencia: '2026',
    acaoRecomendada: 'Verificar MIKE'
  }];

  RendererAuditoriaSaude.renderizarLog(mockSheet, diags, {}, 1);

  const subHist = mockSheet.obterSubAba('[HISTORICO] Auditoria Ocorrencias');
  assert.ok(subHist);
  assert.strictEqual(subHist.obterLinhasCongeladas(), 1);

  const alinhamentos = subHist.obterAlinhamentos();
  const alignLeftCols7To9 = alinhamentos.find(a => a.col === 7 && a.align === 'left');
  assert.ok(alignLeftCols7To9, 'As colunas 7 a 9 do histórico devem ter alinhamento à esquerda (left)');
});

// 4. Validação Isolada da Coluna AM (fundo #FFF3CD e fonte #856404)
test('RendererAuditoriaSaude: aplicarDestaquesAlertasAM_ aplica fundo #FFF3CD e fonte #856404 na coluna informada sem tocar em A:AL', () => {
  const headers = Array.from({ length: 39 }, (_, i) => i === 38 ? 'ALERTA INTEGRIDADE' : `COL_${i + 1}`);
  const mockSheet = criarMockSheetRenderer(headers, [['dados']]);

  const saida = [['Alerta na linha 2'], ['']];
  RendererAuditoriaSaude.aplicarDestaquesAlertasAM_(mockSheet, 38, saida);

  const coresB = mockSheet.obterCoresMainBackground();
  const coresF = mockSheet.obterCoresMainFont();

  const destaqueFundo = coresB.find(c => c.row === 2 && c.col === 39 && c.color === '#FFF3CD');
  const destaqueFonte = coresF.find(c => c.row === 2 && c.col === 39 && c.color === '#856404');
  assert.ok(destaqueFundo, 'A célula AM da Linha 2 deve receber fundo #FFF3CD');
  assert.ok(destaqueFonte, 'A célula AM da Linha 2 deve receber fonte #856404');

  const vazoes = coresB.filter(c => c.col >= 1 && c.col < 39);
  assert.strictEqual(vazoes.length, 0, 'Nenhuma formatação de fundo deve ser aplicada às colunas A até AL (1 a 38)');
});

console.log(`\n🎉 Testes do Renderizador concluídos: ${sucessos} testes passaram!`);
}
