'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/TestGuardiao.js
 * DESCRIÇÃO: Suíte de testes unitários para o Guardião da Qualidade Operacional (M05).
 * Valida a compatibilidade dos diagnósticos estruturados com o Guardião (TASK-M05.1-02A).
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

const GuardiaoQualidade = require('../Features/GuardiaoQualidade');
global.GuardiaoQualidade = GuardiaoQualidade;

console.log('🧪 Iniciando Testes Unitários: Guardião da Qualidade Operacional (M05)...\n');

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

function criarMockSheet(headers, dadosLinhas, formulasLinhas = []) {
  const dadosTotais = [headers, ...dadosLinhas];
  const formulasTotais = [headers.map(() => ''), ...formulasLinhas];

  let dadosColunaAM = [];

  const createRangeMock = (targetRow, targetCol) => {
    const rangeObj = {
      getValues: () => dadosTotais,
      getFormulas: () => formulasTotais,
      setValue: (val) => {
        if (targetCol && targetRow === 1) headers[targetCol - 1] = val;
        return rangeObj;
      },
      setValues: (vals) => {
        // Se a gravação for a partir da linha 2 na coluna de alertas (última coluna)
        if (targetRow === 2 && targetCol === headers.length) {
          dadosColunaAM = vals;
        }
        return rangeObj;
      },
      clearDataValidations: () => rangeObj,
      clearContent: () => rangeObj,
      clear: () => rangeObj,
      setFontWeight: () => rangeObj
    };
    return rangeObj;
  };

  return {
    getName: () => 'JUL2026_TESTE',
    getLastRow: () => dadosTotais.length,
    getLastColumn: () => headers.length,
    getRange: (row, col) => createRangeMock(row, col),
    getParent: () => ({
      getSheetByName: () => null,
      insertSheet: () => ({
        clear: () => {},
        getRange: (r, c) => createRangeMock(r, c),
        autoResizeColumns: () => {}
      })
    }),
    obterSaidaColunaAM: () => dadosColunaAM
  };
}

// 1. Teste: Fórmula ausente em coluna calculada
test('GuardiaoQualidade: deve detectar fórmula ausente em coluna calculada e gerar texto limpo em AM sem [object Object]', () => {
  const headers = [
    'DATA', 'NÚMERO MIKE', 'BOE', 'MATRÍCULA', 'POLICIAL', 'OCORRÊNCIA PIP', 'IMPUTADO?',
    'TOTAL DE MACONHA', 'DIVIDIDO MAC', 'TOTAL CRACK', 'TOTAL DE COCAINA', 'DIVIDIDO COC',
    'PONTOS TOTAIS', 'PONTOS FICCAO', 'CHAVE OCORRENCIA', 'ALERTA INTEGRIDADE'
  ];
  
  // MIKE válido com 8 dígitos
  const dadosLinhas = [
    ['15/07/2026', '20260505', '26E100', '113920-7', 'SD SILVA', 'PORTE ILEGAL', 'COM IMPUTADO', 10, 5, 0, 0, 0, 10, 10, 'KEY', '']
  ];
  
  // Fórmula ausente apenas em 'TOTAL DE MACONHA' (índice 7)
  const formulasLinhas = [
    ['', '', '', '', '', '', '', '', '=H2/2', '=SUM(...)', '=SUM(...)', '=K2/2', '=SUM(...)', '=M2/4', '=N2', '']
  ];

  const mockSheet = criarMockSheet(headers, dadosLinhas, formulasLinhas);
  const resultado = GuardiaoQualidade.varrerAba(mockSheet);

  assert.strictEqual(resultado.alertas, 1);
  assert.ok(resultado.diagnosticos.length > 0);

  const diagFormula = resultado.diagnosticos.find(d => d.codigoRegra === 'FORMULA_AUSENTE');
  assert.ok(diagFormula);
  assert.strictEqual(diagFormula.severidade, 'ALERTA');
  assert.ok(diagFormula.diagnostico.includes('TOTAL DE MACONHA'));

  // Valida texto gravado na coluna AM
  const saidaAM = mockSheet.obterSaidaColunaAM();
  assert.strictEqual(saidaAM.length, 1);
  const textoAM = saidaAM[0][0];
  assert.ok(!textoAM.includes('[object Object]'));
  assert.ok(!textoAM.includes('undefined'));
  assert.ok(textoAM.includes('Fórmula ausente'));
});

// 2. Teste: Indicador de arma de fogo sem fato físico correspondente no túnel
test('GuardiaoQualidade: deve detectar indicador de arma sem fato físico no túnel e expor em alerta.diagnostico', () => {
  const headers = [
    'DATA', 'NÚMERO MIKE', 'BOE', 'MATRÍCULA', 'POLICIAL', 'ARMAS', 'OCORRÊNCIA PIP', 'IMPUTADO?',
    'TOTAL DE MACONHA', 'DIVIDIDO MAC', 'TOTAL CRACK', 'TOTAL DE COCAINA', 'DIVIDIDO COC',
    'PONTOS TOTAIS', 'PONTOS FICCAO', 'CHAVE OCORRENCIA', 'ALERTA INTEGRIDADE'
  ];
  
  // Linha com OCORRÊNCIA PIP indicando ARMA DE FOGO, mas ARMAS = 0
  const dadosLinhas = [
    ['15/07/2026', '20260505', '26E100', '113920-7', 'SD SILVA', 0, 'PORTE ILEGAL DE ARMA DE FOGO', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 10, 'KEY', '']
  ];

  // Todas as colunas calculadas possuem fórmulas para isolar o teste de fato físico
  const formulasLinhas = [
    ['', '', '', '', '', '', '', '', '=H2/2', '=I2', '=J2', '=K2/2', '=L2', '=M2/4', '=N2', '=O2']
  ];

  const mockSheet = criarMockSheet(headers, dadosLinhas, formulasLinhas);
  const resultado = GuardiaoQualidade.varrerAba(mockSheet);

  assert.strictEqual(resultado.alertas, 1);

  const diagArma = resultado.diagnosticos.find(d => d.codigoRegra === 'FATO_ARMA_AUSENTE');
  assert.ok(diagArma);
  assert.strictEqual(diagArma.severidade, 'ALERTA');
  assert.ok(diagArma.diagnostico.includes('Indicador de arma de fogo sem fato correspondente'));

  const saidaAM = mockSheet.obterSaidaColunaAM();
  assert.strictEqual(saidaAM.length, 1);
  const textoAM = saidaAM[0][0];
  assert.ok(!textoAM.includes('[object Object]'));
  assert.ok(!textoAM.includes('undefined'));
  assert.ok(textoAM.includes('Indicador de arma de fogo sem fato correspondente'));
});

console.log(`\n🎉 Testes do Guardião da Qualidade concluídos: ${sucessos} testes passaram!`);
}
