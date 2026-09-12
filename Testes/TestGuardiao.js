'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/TestGuardiao.js
 * DESCRIÇÃO: Suíte de testes unitários e homologação final offline para o Guardião da Qualidade (M05/M06).
 * Valida diagnósticos, coerência do túnel, rateio acumulado/zerado com divisor PIP fixo = 4 (TASK-M05.1-04E), Tabela PIP, relatórios legíveis, estilização executiva (TASK-M06.1-02/TASK-M06.1-03), destaque AM explícito (TASK-M06.1-04) e homologação E2E.
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

console.log('🧪 Iniciando Testes Unitários e Homologação: Guardião da Qualidade Operacional (M05/M06)...\n');

let sucessos = 0;

function test(nome, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${nome}`);
    sucessos++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${nome}:`, err.stack);
    process.exitCode = 1;
  }
}

function criarMockSheet(headers, dadosLinhas, formulasLinhas = [], notasLinhas = [], abaPIPValues = null, nomeAba = 'JUL2026_TESTE', nomeAbaPIP = 'Tabela PIP') {
  const dadosTotais = [headers, ...dadosLinhas];
  const formulasTotais = [headers.map(() => ''), ...formulasLinhas];
  const notasTotais = [headers.map(() => ''), ...notasLinhas];

  let dadosColunaAM = [];
  const mapSubSheets = {};
  const mainTracker = { coresBackground: [], coresFont: [], alinhamentos: [] };

  const createRangeMock = (targetRow, targetCol, sheetDataRef, subTracker = null, numRowsParam = 1, numColsParam = 1) => {
    const rangeObj = {
      getValues: () => {
        if (sheetDataRef.storage) {
          const startR = targetRow - 1;
          return sheetDataRef.storage.slice(startR, startR + numRowsParam);
        }
        const idxAlertaHeader = SyntheonUtils.localizarColuna(headers, 'ALERTA_INTEGRIDADE');
        const colAlertaReal = idxAlertaHeader !== -1 ? idxAlertaHeader + 1 : headers.length;
        if (sheetDataRef.isMain && targetCol === colAlertaReal && dadosColunaAM.length > 0) {
          const startR = targetRow - 2;
          return dadosColunaAM.slice(startR, startR + numRowsParam);
        }
        return sheetDataRef.values || dadosTotais;
      },
      getFormulas: () => sheetDataRef.formulas || formulasTotais,
      getNotes: () => sheetDataRef.notes || notasTotais,
      setValue: (val) => {
        if (targetCol && targetRow === 1 && sheetDataRef.values) sheetDataRef.values[0][targetCol - 1] = val;
        return rangeObj;
      },
      setValues: (vals) => {
        const idxAlertaHeader = SyntheonUtils.localizarColuna(headers, 'ALERTA_INTEGRIDADE');
        const colAlertaReal = idxAlertaHeader !== -1 ? idxAlertaHeader + 1 : headers.length;
        if (sheetDataRef.isMain && targetRow === 2 && targetCol === colAlertaReal) {
          dadosColunaAM = vals;
        }
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
        if (sheetDataRef.isMain) {
          mainTracker.coresFont.push({ row: targetRow, col: targetCol, color });
        }
        if (subTracker && subTracker.coresFont) {
          subTracker.coresFont.push({ row: targetRow, col: targetCol, color });
        }
        return rangeObj;
      },
      setBackground: (color) => {
        if (sheetDataRef.isMain) {
          mainTracker.coresBackground.push({ row: targetRow, col: targetCol, color });
        }
        if (subTracker && subTracker.coresBackground) {
          subTracker.coresBackground.push({ row: targetRow, col: targetCol, color });
        }
        return rangeObj;
      },
      setHorizontalAlignment: (align) => {
        if (sheetDataRef.isMain) {
          mainTracker.alinhamentos.push({ row: targetRow, col: targetCol, align });
        }
        if (subTracker && subTracker.alinhamentos) {
          subTracker.alinhamentos.push({ row: targetRow, col: targetCol, align });
        }
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

  const mainRef = { values: dadosTotais, formulas: formulasTotais, notes: notasTotais, isMain: true };

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

  const pipSheetMock = abaPIPValues ? {
    getName: () => nomeAbaPIP,
    getDataRange: () => ({
      getValues: () => abaPIPValues
    })
  } : null;

  const efetivoSheetMock = {
    getName: () => 'EFETIVO',
    getLastRow: () => 4,
    getLastColumn: () => 5,
    getRange: () => ({
      getValues: () => [
        ['ORD.', 'GRAD.', 'MAT.', 'NOME DE GUERRA', 'SUB-UNIDADE'],
        [10, 'CB', '113920-7', 'SD SILVA', '1º PEL'],
        [12, '3º SGT', '108394-5', 'IRAN SILVA', '1º PEL GTAR'],
        [15, '2º SGT', '102950-9', 'SAULO ALVES', '2º PEL GTAR']
      ]
    })
  };

  const parentMock = {
    getSheets: () => {
      const list = [sheetMock];
      if (pipSheetMock) list.push(pipSheetMock);
      list.push(efetivoSheetMock);
      Object.keys(mapSubSheets).forEach(k => list.push(mapSubSheets[k]));
      return list;
    },
    getSheetByName: (n) => {
      if (n === 'EFETIVO' || n === 'PECULIO' || n === 'PECÚLIO') return efetivoSheetMock;
      if (pipSheetMock && (n === nomeAbaPIP || n === 'Tabela PIP')) return pipSheetMock;
      if (mapSubSheets[n]) return mapSubSheets[n];
      return null;
    },
    insertSheet: (n) => getSubSheet(n)
  };

  const sheetMock = {
    getName: () => nomeAba,
    getLastRow: () => dadosTotais.length,
    getLastColumn: () => headers.length,
    getRange: (row, col, numR, numC) => createRangeMock(row, col, mainRef, null, numR || 1, numC || 1),
    getParent: () => parentMock,
    obterSaidaColunaAM: () => dadosColunaAM,
    obterSubAba: (n) => mapSubSheets[n],
    obterCoresMainBackground: () => mainTracker.coresBackground,
    obterCoresMainFont: () => mainTracker.coresFont
  };

  return sheetMock;
}

const headersPadrao = [
  'DATA', 'NÚMERO MIKE', 'BOE', 'MATRÍCULA', 'POLICIAL', 'ARMAS', 'OCORRÊNCIA PIP', 'IMPUTADO?',
  'TOTAL DE MACONHA', 'DIVIDIDO MAC', 'TOTAL CRACK', 'TOTAL DE COCAINA', 'DIVIDIDO COC',
  'PONTOS TOTAIS', 'PONTOS FICCAO', 'CHAVE OCORRENCIA', 'ALERTA INTEGRIDADE'
];

const formulaCalculadaPadrao = ['', '', '', '', '', '', '', '', '=H2/2', '=I2', '=J2', '=K2/2', '=L2', '=M2/4', '=N2', '=O2'];

const mockPeculioExterno = {
  getSheetByName: (n) => {
    if (n === 'EFETIVO' || n === 'PECULIO' || n === 'PECÚLIO' || n === 'CÓPIA DE PECÚLIO COM PONTUAÇÃO') {
      return {
        getName: () => 'CÓPIA DE PECÚLIO COM PONTUAÇÃO',
        getLastRow: () => 3,
        getLastColumn: () => 5,
        getRange: () => ({
          getValues: () => [
            ['ORD.', 'GRAD.', 'MAT.', 'NOME DE GUERRA', 'SUB-UNIDADE'],
            [1, '3º SGT', '108394-5', 'IRAN SILVA', '1º PEL GTAR'],
            [5, '2º SGT', '102950-9', 'SAULO ALVES', '2º PEL GTAR']
          ]
        })
      };
    }
    return null;
  }
};

// 1. Teste: Plantão Tranquilo
test('GuardiaoQualidade: linha de plantão tranquilo (apenas data) não deve gerar alerta', () => {
  const dadosLinhas = [
    ['15/07/2026', '', '', '', '', 0, '', '', 0, 0, 0, 0, 0, 0, 0, '', '']
  ];
  const mockSheet = criarMockSheet(headersPadrao, dadosLinhas, [['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']]);
  const resultado = GuardiaoQualidade.varrerAba(mockSheet);

  assert.ok(resultado.linhas >= 1);
  const diagOrfaOuAlerta = resultado.diagnosticos.filter(d => d.codigoRegra !== 'MODO_LIMITADO_CATALOGO_PIP');
  assert.strictEqual(diagOrfaOuAlerta.length, 0);
});

// 2. Teste: Ocorrência órfã
test('GuardiaoQualidade: ocorrência órfã (policial sem MIKE) deve gerar diagnóstico CRITICO', () => {
  const dadosLinhas = [
    ['15/07/2026', '', '26E100', '113920-7', 'SD SILVA', 0, 'PORTE ILEGAL', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 2.5, 'KEY', '']
  ];
  const mockSheet = criarMockSheet(headersPadrao, dadosLinhas, [formulaCalculadaPadrao]);
  const resultado = GuardiaoQualidade.varrerAba(mockSheet);

  const diagOrfa = resultado.diagnosticos.find(d => d.codigoRegra === 'OCORRENCIA_ORFA');
  assert.ok(diagOrfa);
  assert.strictEqual(diagOrfa.severidade, 'CRITICO');
});

// 3. Teste: MIKE suspeito
test('GuardiaoQualidade: MIKE suspeito deve gerar ALERTA sem bloquear a execução', () => {
  const dadosLinhas = [
    ['15/07/2026', '2026', '26E100', '113920-7', 'SD SILVA', 0, 'PORTE ILEGAL', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 2.5, 'KEY', '']
  ];
  const mockSheet = criarMockSheet(headersPadrao, dadosLinhas, [formulaCalculadaPadrao]);
  const resultado = GuardiaoQualidade.varrerAba(mockSheet);

  const diagMike = resultado.diagnosticos.find(d => d.codigoRegra === 'MIKE_SUSPEITO');
  assert.ok(diagMike);
  assert.strictEqual(diagMike.severidade, 'ALERTA');
});

// 4. Teste: Divergência entre DATA (string) e MIKE
test('GuardiaoQualidade: divergência entre data da planilha e data do MIKE deve gerar ALERTA', () => {
  const dadosLinhas = [
    ['20/07/2026', '202607150001', '26E100', '113920-7', 'SD SILVA', 0, 'PORTE ILEGAL', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 2.5, 'KEY', '']
  ];
  const mockSheet = criarMockSheet(headersPadrao, dadosLinhas, [formulaCalculadaPadrao]);
  const resultado = GuardiaoQualidade.varrerAba(mockSheet);

  const diagDataMike = resultado.diagnosticos.find(d => d.codigoRegra === 'MIKE_DATA_DIVERGENTE');
  assert.ok(diagDataMike);
  assert.strictEqual(diagDataMike.severidade, 'ALERTA');
});

// 5. Teste: DATA como objeto Date
test('GuardiaoQualidade: deve processar DATA como objeto Date sem gerar falso alerta de data', () => {
  const dataObjeto = new Date(2026, 6, 15);
  const dadosLinhas = [
    [dataObjeto, '202607150001', '26E100', '113920-7', 'SD SILVA', 0, 'PORTE ILEGAL', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 2.5, 'KEY', '']
  ];
  const mockSheet = criarMockSheet(headersPadrao, dadosLinhas, [formulaCalculadaPadrao]);
  const resultado = GuardiaoQualidade.varrerAba(mockSheet);

  const diagDataMike = resultado.diagnosticos.find(d => d.codigoRegra === 'MIKE_DATA_DIVERGENTE');
  assert.strictEqual(diagDataMike, undefined);
});

// 6. Teste: Coerência cruzada — mesmo MIKE com BOEs divergentes
test('GuardiaoQualidade: mesmo MIKE com BOEs diferentes deve gerar diagnóstico de divergência', () => {
  const dadosLinhas = [
    ['15/07/2026', '202607150001', '26E100', '113920-7', 'SD SILVA', 0, 'PORTE ILEGAL', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 2.5, 'KEY', ''],
    ['15/07/2026', '202607150001', '26E200', '113921-5', 'SD SOUZA', 0, 'PORTE ILEGAL', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 2.5, 'KEY', '']
  ];
  const mockSheet = criarMockSheet(headersPadrao, dadosLinhas, [formulaCalculadaPadrao, formulaCalculadaPadrao]);
  const resultado = GuardiaoQualidade.varrerAba(mockSheet);

  const diagBoe = resultado.diagnosticos.find(d => d.codigoRegra === 'MIKE_BOE_DIVERGENTE');
  assert.ok(diagBoe);
  assert.strictEqual(diagBoe.severidade, 'ALERTA');
});

// 7. Teste: Coerência cruzada — mesmo MIKE em datas diferentes
test('GuardiaoQualidade: mesmo MIKE utilizado em datas diferentes deve gerar diagnóstico de datas divergentes', () => {
  const dadosLinhas = [
    ['15/07/2026', '202607150001', '26E100', '113920-7', 'SD SILVA', 0, 'PORTE ILEGAL', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 2.5, 'KEY', ''],
    ['20/07/2026', '202607150001', '26E100', '113921-5', 'SD SOUZA', 0, 'PORTE ILEGAL', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 2.5, 'KEY', '']
  ];
  const mockSheet = criarMockSheet(headersPadrao, dadosLinhas, [formulaCalculadaPadrao, formulaCalculadaPadrao]);
  const resultado = GuardiaoQualidade.varrerAba(mockSheet);

  const diagDatas = resultado.diagnosticos.find(d => d.codigoRegra === 'MIKE_DATAS_DIVERGENTES');
  assert.ok(diagDatas);
  assert.strictEqual(diagDatas.severidade, 'ALERTA');
});

// 8. Teste: AG sem AH
test('GuardiaoQualidade: AG preenchido sem AH deve gerar EVENTO_INCOMPLETO_AG com ação recomendada', () => {
  const dadosLinhas = [
    ['15/07/2026', '202607150001', '26E100', '113920-7', 'SD SILVA', 0, 'PORTE ILEGAL', '', 0, 0, 0, 0, 0, 10, 2.5, 'KEY', '']
  ];
  const mockSheet = criarMockSheet(headersPadrao, dadosLinhas, [formulaCalculadaPadrao]);
  const resultado = GuardiaoQualidade.varrerAba(mockSheet);

  const diagIncompleto = resultado.diagnosticos.find(d => d.codigoRegra === 'EVENTO_INCOMPLETO_AG');
  assert.ok(diagIncompleto);
  assert.strictEqual(diagIncompleto.severidade, 'ALERTA');
});

// 9. Teste: AH sem AG
test('GuardiaoQualidade: AH preenchido sem AG (imputado sem evento) deve gerar IMPUTADO_SEM_EVENTO_AH com ALERTA', () => {
  const dadosLinhas = [
    ['15/07/2026', '202607150001', '26E100', '113920-7', 'SD SILVA', 0, '', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 2.5, 'KEY', '']
  ];
  const mockSheet = criarMockSheet(headersPadrao, dadosLinhas, [formulaCalculadaPadrao]);
  const resultado = GuardiaoQualidade.varrerAba(mockSheet);

  const diagImputadoSemAG = resultado.diagnosticos.find(d => d.codigoRegra === 'IMPUTADO_SEM_EVENTO_AH');
  assert.ok(diagImputadoSemAG);
  assert.strictEqual(diagImputadoSemAG.severidade, 'ALERTA');
});

// 10. Teste: Exceção Manual por Nota iniciada por EXCECAO:
test('GuardiaoQualidade: célula sem fórmula mas com nota iniciada por EXCECAO: deve ser classificada como EXCECAO MANUAL', () => {
  const dadosLinhas = [
    ['15/07/2026', '202607150001', '26E100', '113920-7', 'SD SILVA', 0, 'PORTE ILEGAL', 'COM IMPUTADO', 40, 20, 0, 0, 0, 10, 2.5, 'KEY', '']
  ];
  const formulas = [
    ['', '', '', '', '', '', '', '', '', '=I2', '=J2', '=K2/2', '=L2', '=M2/4', '=N2', '=O2']
  ];
  const notas = [
    ['', '', '', '', '', '', '', '', 'EXCECAO: Numerario de R$ 40,00 conforme BOE', '', '', '', '', '', '', '']
  ];

  const mockSheet = criarMockSheet(headersPadrao, dadosLinhas, formulas, notas);
  const resultado = GuardiaoQualidade.varrerAba(mockSheet);

  const diagExcecao = resultado.diagnosticos.find(d => d.codigoRegra === 'EXCECAO_MANUAL_JUSTIFICADA');
  assert.ok(diagExcecao);
  assert.strictEqual(diagExcecao.severidade, 'EXCECAO MANUAL');
});

// 11. Teste: Fato não auditável automaticamente
test('GuardiaoQualidade: numerário sem valor em reais registrado deve ser classificado como NÃO AUDITÁVEL AUTOMATICAMENTE', () => {
  const dadosLinhas = [
    ['15/07/2026', '202607150001', '26E100', '113920-7', 'SD SILVA', 0, 'APREENSÃO DE NUMERÁRIO', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 2.5, 'KEY', '']
  ];
  const mockSheet = criarMockSheet(headersPadrao, dadosLinhas, [formulaCalculadaPadrao]);
  const resultado = GuardiaoQualidade.varrerAba(mockSheet);

  const diagNaoAuditavel = resultado.diagnosticos.find(d => d.codigoRegra === 'FATO_NAO_AUDITAVEL_AUTOMATICAMENTE');
  assert.ok(diagNaoAuditavel);
  assert.strictEqual(diagNaoAuditavel.severidade, 'OBSERVACAO');
});

// 12. Rateio PIP com 4 policiais (304 / 4 = 76 cada) -> Aprovado (TASK-M05.1-04E)
test('RegrasQualidade: rateio PIP com 304 pontos e 4 policiais (304 / 4 = 76 cada) deve ser aprovado sem alerta', () => {
  const dadosLinhas = [
    ['15/07/2026', '202607150001', '26E100', '113920-7', 'SD SILVA', 0, 'PORTE ILEGAL', 'COM IMPUTADO', 0, 0, 0, 0, 0, 80, 76, 'KEY', ''],
    ['15/07/2026', '202607150001', '26E100', '113921-5', 'SD SOUZA', 0, 'POSSE DE DROGAS', 'SEM IMPUTADO', 0, 0, 0, 0, 0, 64, 76, 'KEY', ''],
    ['15/07/2026', '202607150001', '26E100', '113922-3', 'SD SANTOS', 0, 'TRÁFICO', 'COM IMPUTADO', 0, 0, 0, 0, 0, 160, 76, 'KEY', ''],
    ['15/07/2026', '202607150001', '26E100', '113923-1', 'SD OLIVEIRA', 0, 'TRÁFICO', 'COM IMPUTADO', 0, 0, 0, 0, 0, 0, 76, 'KEY', '']
  ];
  const mockSheet = criarMockSheet(headersPadrao, dadosLinhas, [formulaCalculadaPadrao, formulaCalculadaPadrao, formulaCalculadaPadrao, formulaCalculadaPadrao]);
  const resultado = GuardiaoQualidade.varrerAba(mockSheet);

  const diagRateio = resultado.diagnosticos.find(d => d.codigoRegra === 'RATEIO_PONTOS_INCOERENTE');
  assert.strictEqual(diagRateio, undefined);
});

// 12A. Rateio PIP com 5 policiais (304 / 4 = 76 cada) -> Aprovado (TASK-M05.1-04E)
test('RegrasQualidade: rateio PIP com 304 pontos e 5 policiais (todos recebendo 304 / 4 = 76 cada) deve ser aprovado sem alerta', () => {
  const dadosLinhas = [
    ['15/07/2026', '202607150001', '26E100', '113920-7', 'SD SILVA', 0, 'PORTE ILEGAL', 'COM IMPUTADO', 0, 0, 0, 0, 0, 80, 76, 'KEY', ''],
    ['15/07/2026', '202607150001', '26E100', '113921-5', 'SD SOUZA', 0, 'POSSE DE DROGAS', 'SEM IMPUTADO', 0, 0, 0, 0, 0, 64, 76, 'KEY', ''],
    ['15/07/2026', '202607150001', '26E100', '113922-3', 'SD SANTOS', 0, 'TRÁFICO', 'COM IMPUTADO', 0, 0, 0, 0, 0, 160, 76, 'KEY', ''],
    ['15/07/2026', '202607150001', '26E100', '113923-1', 'SD OLIVEIRA', 0, 'TRÁFICO', 'COM IMPUTADO', 0, 0, 0, 0, 0, 0, 76, 'KEY', ''],
    ['15/07/2026', '202607150001', '26E100', '113924-9', 'SD COSTA', 0, 'TRÁFICO', 'COM IMPUTADO', 0, 0, 0, 0, 0, 0, 76, 'KEY', '']
  ];
  const mockSheet = criarMockSheet(headersPadrao, dadosLinhas, [formulaCalculadaPadrao, formulaCalculadaPadrao, formulaCalculadaPadrao, formulaCalculadaPadrao, formulaCalculadaPadrao]);
  const resultado = GuardiaoQualidade.varrerAba(mockSheet);

  const diagRateio = resultado.diagnosticos.find(d => d.codigoRegra === 'RATEIO_PONTOS_INCOERENTE');
  assert.strictEqual(diagRateio, undefined);
});

// 12B. Rateio PIP com 10 policiais (304 / 4 = 76 cada) -> Aprovado (TASK-M05.1-04E)
test('RegrasQualidade: rateio PIP com 304 pontos e 10 policiais (todos recebendo 304 / 4 = 76 cada) deve ser aprovado sem alerta', () => {
  const dadosLinhas = Array.from({ length: 10 }, (_, i) => [
    '15/07/2026', '202607150001', '26E100', `11392${i}-0`, `SD PM ${i}`, 0, 'TRÁFICO', 'COM IMPUTADO', 0, 0, 0, 0, 0, i === 0 ? 304 : 0, 76, 'KEY', ''
  ]);
  const mockSheet = criarMockSheet(headersPadrao, dadosLinhas, Array(10).fill(formulaCalculadaPadrao));
  const resultado = GuardiaoQualidade.varrerAba(mockSheet);

  const diagRateio = resultado.diagnosticos.find(d => d.codigoRegra === 'RATEIO_PONTOS_INCOERENTE');
  assert.strictEqual(diagRateio, undefined);
});

// 13. Rateio com policial zerado (304 pontos, 5 policiais, quatro com 76 e um com 0 -> alerta apenas no zerado) (TASK-M05.1-04E)
test('RegrasQualidade: rateio PIP com 304 pontos e 5 policiais onde um possui PONTOS FICÇÃO = 0 gera RATEIO_PONTOS_INCOERENTE apenas para a linha zerada', () => {
  const dadosLinhas = [
    ['15/07/2026', '202607150001', '26E100', '113920-7', 'SD SILVA', 0, 'PORTE ILEGAL', 'COM IMPUTADO', 0, 0, 0, 0, 0, 80, 76, 'KEY', ''],
    ['15/07/2026', '202607150001', '26E100', '113921-5', 'SD SOUZA', 0, 'POSSE DE DROGAS', 'SEM IMPUTADO', 0, 0, 0, 0, 0, 64, 76, 'KEY', ''],
    ['15/07/2026', '202607150001', '26E100', '113922-3', 'SD SANTOS', 0, 'TRÁFICO', 'COM IMPUTADO', 0, 0, 0, 0, 0, 160, 76, 'KEY', ''],
    ['15/07/2026', '202607150001', '26E100', '113923-1', 'SD OLIVEIRA', 0, 'TRÁFICO', 'COM IMPUTADO', 0, 0, 0, 0, 0, 0, 76, 'KEY', ''],
    ['15/07/2026', '202607150001', '26E100', '113924-9', 'SD COSTA', 0, 'TRÁFICO', 'COM IMPUTADO', 0, 0, 0, 0, 0, 0, 0, 'KEY', '']
  ];
  const mockSheet = criarMockSheet(headersPadrao, dadosLinhas, [formulaCalculadaPadrao, formulaCalculadaPadrao, formulaCalculadaPadrao, formulaCalculadaPadrao, formulaCalculadaPadrao]);
  const resultado = GuardiaoQualidade.varrerAba(mockSheet);

  const diagsRateio = resultado.diagnosticos.filter(d => d.codigoRegra === 'RATEIO_PONTOS_INCOERENTE');
  assert.strictEqual(diagsRateio.length, 1);
  assert.strictEqual(diagsRateio[0].linha, 6); // Linha 6 (SD COSTA com 0)
});

// 14. Nome alternativo da aba Tabela PIP
test('GuardiaoQualidade: reconhece a Tabela PIP com hífen no nome (ex: TABELA-PIP)', () => {
  const abaPIPValores = [
    ['INDICADOR PIP'],
    ['PORTE ILEGAL DE ARMA DE FOGO']
  ];
  const dadosLinhas = [
    ['15/07/2026', '202607150001', '26E100', '113920-7', 'SD SILVA', 1, 'PORTE ILEGAL DE ARMA DE FOGO', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 2.5, 'KEY', '']
  ];

  const mockSheet = criarMockSheet(headersPadrao, dadosLinhas, [formulaCalculadaPadrao], [], abaPIPValores, 'JUL2026_TESTE', 'TABELA-PIP');
  const resultado = GuardiaoQualidade.varrerAba(mockSheet);

  const diagModoLimitado = resultado.diagnosticos.find(d => d.codigoRegra === 'MODO_LIMITADO_CATALOGO_PIP');
  assert.strictEqual(diagModoLimitado, undefined);
});

// 15. Indicador PIP em outra coluna
test('GuardiaoQualidade: localiza a coluna do indicador por cabeçalho em qualquer posição na Tabela PIP', () => {
  const abaPIPValores = [
    ['CÓDIGO', 'CATEGORIA', 'INDICADOR PIP'],
    ['001', 'ARMAS', 'PORTE ILEGAL DE ARMA DE FOGO']
  ];
  const dadosLinhas = [
    ['15/07/2026', '202607150001', '26E100', '113920-7', 'SD SILVA', 1, 'PORTE ILEGAL DE ARMA DE FOGO', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 2.5, 'KEY', ''],
    ['15/07/2026', '202607150001', '26E100', '113921-5', 'SD SOUZA', 1, 'INVENTADO_DESCONHECIDO', 'SEM IMPUTADO', 0, 0, 0, 0, 0, 10, 2.5, 'KEY', '']
  ];

  const mockSheet = criarMockSheet(headersPadrao, dadosLinhas, [formulaCalculadaPadrao, formulaCalculadaPadrao], [], abaPIPValores, 'JUL2026_TESTE', 'Tabela PIP');
  const resultado = GuardiaoQualidade.varrerAba(mockSheet);

  const diagDesconhecido = resultado.diagnosticos.find(d => d.codigoRegra === 'INDICADOR_DESCONHECIDO');
  assert.ok(diagDesconhecido);
  assert.strictEqual(diagDesconhecido.linha, 3);
});

// 16. Aba sem cabeçalho válido de indicador
test('GuardiaoQualidade: aba existente sem cabeçalho válido de indicador (com dados em A) ativa MODO_LIMITADO_CATALOGO_PIP e não vaza Coluna A', () => {
  const abaPIPSemCabecalhoIndicador = [
    ['CÓDIGO', 'CATEGORIA'],
    ['001', 'ARMAS'],
    ['002', 'DROGAS']
  ];
  const dadosLinhas = [
    ['15/07/2026', '202607150001', '26E100', '113920-7', 'SD SILVA', 1, 'PORTE ILEGAL DE ARMA DE FOGO', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 2.5, 'KEY', '']
  ];

  const mockSheet = criarMockSheet(headersPadrao, dadosLinhas, [formulaCalculadaPadrao], [], abaPIPSemCabecalhoIndicador, 'JUL2026_TESTE', 'Tabela PIP');
  const resultado = GuardiaoQualidade.varrerAba(mockSheet);

  const diagModoLimitado = resultado.diagnosticos.find(d => d.codigoRegra === 'MODO_LIMITADO_CATALOGO_PIP');
  assert.ok(diagModoLimitado);
  assert.strictEqual(diagModoLimitado.severidade, 'OBSERVACAO');
});

// 17. Auditoria com alertas popula resumo e tabela de 9 colunas em [AUDITORIA] Ocorrencias (TASK-M05.1-05)
test('RendererAuditoriaSaude: auditoria com alertas popula a aba [AUDITORIA] Ocorrencias com resumo e tabela de 9 colunas', () => {
  const abaPIPValores = [['INDICADOR PIP'], ['PORTE ILEGAL DE ARMA DE FOGO']];
  const dadosLinhas = [
    ['15/07/2026', '', '26E100', '113920-7', 'SD SILVA', 1, 'PORTE ILEGAL DE ARMA DE FOGO', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 2.5, 'KEY', '']
  ];

  const mockSheet = criarMockSheet(headersPadrao, dadosLinhas, [formulaCalculadaPadrao], [], abaPIPValores);
  GuardiaoQualidade.varrerAba(mockSheet);

  const subAbaLog = mockSheet.obterSubAba('[AUDITORIA] Ocorrencias');
  assert.ok(subAbaLog);
  const dadosLog = subAbaLog.obterDadosArmazenados();
  assert.ok(dadosLog.length >= 6);

  assert.deepStrictEqual(dadosLog[4], ['ABA', 'TÚNEL', 'LINHA', 'CAMADA', 'SEVERIDADE', 'REGRA', 'DIAGNÓSTICO', 'EVIDÊNCIA', 'SUGESTÃO DE CORREÇÃO']);
  assert.strictEqual(dadosLog[5][0], 'JUL2026_TESTE');
  assert.strictEqual(dadosLog[5][3], 'SEMANTICA');
  assert.strictEqual(dadosLog[5][4], 'CRITICO');
  assert.strictEqual(dadosLog[5][5], 'OCORRENCIA_ORFA');
});

// 18. Auditoria Aprovada (0 alertas -> exibe linha APROVADO) (TASK-M05.1-05)
test('RendererAuditoriaSaude: auditoria aprovada sem alertas exibe a linha APROVADO na aba de auditoria', () => {
  const abaPIPValores = [['INDICADOR PIP'], ['PORTE ILEGAL DE ARMA DE FOGO']];
  const dadosLinhas = [
    ['15/07/2026', '202607150001', '26E100', '113920-7', 'SD SILVA', 1, 'PORTE ILEGAL DE ARMA DE FOGO', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 2.5, 'KEY', '']
  ];

  const mockPeculioValido = {
    getSheetByName: (n) => ({
      getName: () => 'CÓPIA DE PECÚLIO COM PONTUAÇÃO',
      getLastRow: () => 2,
      getLastColumn: () => 5,
      getRange: () => ({ getValues: () => [
        ['ORD.', 'GRAD.', 'MAT.', 'NOME DE GUERRA', 'SUB-UNIDADE'],
        [10, 'SD', '113920-7', 'SD SILVA', '1º PEL']
      ] })
    })
  };

  const mockSheet = criarMockSheet(headersPadrao, dadosLinhas, [formulaCalculadaPadrao], [], abaPIPValores);
  GuardiaoQualidade.varrerAba(mockSheet, mockPeculioValido);

  const subAbaLog = mockSheet.obterSubAba('[AUDITORIA] Ocorrencias');
  assert.ok(subAbaLog);
  const dadosLog = subAbaLog.obterDadosArmazenados();

  assert.strictEqual(dadosLog[0][5], 'APROVADO');
  assert.strictEqual(dadosLog[5][4], 'APROVADO');
  assert.strictEqual(dadosLog[5][5], 'INTEGRIDADE_OK');
});

// 19. Histórico Preservando Múltiplas Execuções Cumulativas (TASK-M05.1-05)
test('RendererAuditoriaSaude: aba [HISTORICO] Auditoria Ocorrencias preserva registros de múltiplas execuções sem sobrescrever', () => {
  const abaPIPValores = [['INDICADOR PIP'], ['PORTE ILEGAL DE ARMA DE FOGO']];
  const dadosLinhas = [
    ['15/07/2026', '202607150001', '26E100', '113920-7', 'SD SILVA', 1, 'PORTE ILEGAL DE ARMA DE FOGO', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 2.5, 'KEY', '']
  ];

  const mockPeculioValido = {
    getSheetByName: (n) => ({
      getName: () => 'CÓPIA DE PECÚLIO COM PONTUAÇÃO',
      getLastRow: () => 2,
      getLastColumn: () => 5,
      getRange: () => ({ getValues: () => [
        ['ORD.', 'GRAD.', 'MAT.', 'NOME DE GUERRA', 'SUB-UNIDADE'],
        [10, 'SD', '113920-7', 'SD SILVA', '1º PEL']
      ] })
    })
  };

  const mockSheet = criarMockSheet(headersPadrao, dadosLinhas, [formulaCalculadaPadrao], [], abaPIPValores);
  
  // Primeira execução
  GuardiaoQualidade.varrerAba(mockSheet, mockPeculioValido);
  // Segunda execução
  GuardiaoQualidade.varrerAba(mockSheet, mockPeculioValido);

  const subAbaHist = mockSheet.obterSubAba('[HISTORICO] Auditoria Ocorrencias');
  assert.ok(subAbaHist);
  const dadosHist = subAbaHist.obterDadosArmazenados();

  assert.deepStrictEqual(dadosHist[0], ['DATA/HORA EXECUÇÃO', 'ABA', 'TÚNEL', 'LINHA', 'CAMADA', 'SEVERIDADE', 'REGRA', 'DIAGNÓSTICO', 'EVIDÊNCIA', 'SUGESTÃO DE CORREÇÃO']);
  // G01 #117: cada auditoria e separada por UMA linha em branco -> cabecalho + exec1 + branco + exec2
  assert.strictEqual(dadosHist.length, 4);
  assert.strictEqual(dadosHist[1][1], 'JUL2026_TESTE');
  const linhaSeparadora = dadosHist[2] || [];
  assert.ok(!linhaSeparadora.some(v => String(v === undefined || v === null ? '' : v).trim() !== ''), 'a linha 3 deve ser a separadora em branco');
  assert.strictEqual(dadosHist[3][1], 'JUL2026_TESTE');
});

// 20. Bloqueio de Execução sobre Abas de Relatório/Histórico (TASK-M05.1-05)
test('GuardiaoQualidade: impede execução direta sobre as abas [AUDITORIA] Ocorrencias e [HISTORICO] Auditoria Ocorrencias', () => {
  const mockSheetAuditoria = criarMockSheet(headersPadrao, [], [], [], null, '[AUDITORIA] Ocorrencias');

  assert.throws(() => {
    GuardiaoQualidade.varrerAba(mockSheetAuditoria);
  }, (err) => {
    return err.message.includes('O Guardião não deve ser executado sobre abas de relatório ou histórico') && err.severidade === 'ERRO TECNICO';
  });
});

// 21. Fixture de Homologação Final Offline End-to-End (TASK-M05.1-06)
test('GuardiaoQualidade: Homologação Final Offline End-to-End cobrindo 10 cenários operacionais simultâneos', () => {
  const abaPIPValores = [
    ['INDICADOR PIP'],
    ['PORTE ILEGAL DE ARMA DE FOGO'],
    ['POSSE DE DROGAS'],
    ['TRÁFICO DE DROGAS'],
    ['APREENSÃO DE NUMERÁRIO']
  ];

  const dadosLinhas = [
    // L2: Plantão tranquilo
    ['15/07/2026', '', '', '', '', 0, '', '', 0, 0, 0, 0, 0, 0, 0, '', ''],
    // L3: MIKE suspeito (2026)
    ['15/07/2026', '2026', '26E100', '113920-7', 'SD SILVA', 1, 'PORTE ILEGAL DE ARMA DE FOGO', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 2.5, 'KEY', ''],
    // L4: Ocorrência Órfã (sem MIKE com policial)
    ['15/07/2026', '', '26E101', '113921-5', 'SD SOUZA', 1, 'PORTE ILEGAL DE ARMA DE FOGO', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 2.5, 'KEY', ''],
    // L5: Matrícula ausente
    ['15/07/2026', '202607150002', '26E102', '', 'SD LIMA', 1, 'PORTE ILEGAL DE ARMA DE FOGO', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 2.5, 'KEY', ''],
    // L6: AG sem AH (evento incompleto)
    ['15/07/2026', '202607150003', '26E103', '113922-3', 'SD SANTOS', 1, 'PORTE ILEGAL DE ARMA DE FOGO', '', 0, 0, 0, 0, 0, 10, 2.5, 'KEY', ''],
    // L7: AH sem AG (imputado sem evento)
    ['15/07/2026', '202607150004', '26E104', '113923-1', 'SD OLIVEIRA', 1, '', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 2.5, 'KEY', ''],
    // L8: Exceção manual por nota EXCECAO:
    ['15/07/2026', '202607150005', '26E105', '113924-9', 'SD COSTA', 0, 'PORTE ILEGAL DE ARMA DE FOGO', 'COM IMPUTADO', 40, 20, 0, 0, 0, 10, 2.5, 'KEY', ''],
    // L9: Numerário não auditável
    ['15/07/2026', '202607150006', '26E106', '113925-6', 'SD FERREIRA', 0, 'APREENSÃO DE NUMERÁRIO', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 2.5, 'KEY', ''],
    // L10-L13: Rateio correto (304 / 4 = 76)
    ['15/07/2026', '202607150007', '26E107', '113926-4', 'SD ALVES', 1, 'PORTE ILEGAL DE ARMA DE FOGO', 'COM IMPUTADO', 0, 0, 0, 0, 0, 80, 76, 'KEY', ''],
    ['15/07/2026', '202607150007', '26E107', '113927-2', 'SD ROCHA', 0, 'POSSE DE DROGAS', 'SEM IMPUTADO', 0, 0, 0, 0, 0, 64, 76, 'KEY', ''],
    ['15/07/2026', '202607150007', '26E107', '113928-0', 'SD DIAS', 0, 'TRÁFICO DE DROGAS', 'COM IMPUTADO', 0, 0, 0, 0, 0, 160, 76, 'KEY', ''],
    ['15/07/2026', '202607150007', '26E107', '113929-8', 'SD MARTINS', 0, 'TRÁFICO DE DROGAS', 'COM IMPUTADO', 0, 0, 0, 0, 0, 0, 76, 'KEY', ''],
    // L14: Rateio zerado (quinto policial com PONTOS FICÇÃO = 0 no mesmo túnel)
    ['15/07/2026', '202607150007', '26E107', '113930-6', 'SD RIBEIRO', 0, 'TRÁFICO DE DROGAS', 'COM IMPUTADO', 0, 0, 0, 0, 0, 0, 0, 'KEY', '']
  ];

  const formulas = dadosLinhas.map((r, i) => {
    if (i === 6) { // L8 sem fórmula (tem nota de exceção)
      return ['', '', '', '', '', '', '', '', '', '=I8', '=J8', '=K8/2', '=L8', '=M8/4', '=N8', '=O8'];
    }
    return formulaCalculadaPadrao;
  });

  const notas = dadosLinhas.map((r, i) => {
    if (i === 6) { // L8
      return ['', '', '', '', '', '', '', '', 'EXCECAO: Numerario de R$ 40,00 conforme BOE', '', '', '', '', '', '', ''];
    }
    return headersPadrao.map(() => '');
  });

  const mockSheet = criarMockSheet(headersPadrao, dadosLinhas, formulas, notas, abaPIPValores);
  const resultado = GuardiaoQualidade.varrerAba(mockSheet);

  assert.strictEqual(resultado.linhas, 13);
  assert.ok(resultado.diagnosticos.length >= 7);

  // 1. Linha 2 (Plantão tranquilo): sem alertas
  const alertasL2 = resultado.diagnosticos.filter(d => d.linha === 2);
  assert.strictEqual(alertasL2.length, 0);

  // 2. Linha 3 (MIKE suspeito)
  const diagL3 = resultado.diagnosticos.find(d => d.linha === 3 && d.codigoRegra === 'MIKE_SUSPEITO');
  assert.ok(diagL3);

  // 3. Linha 4 (Ocorrência Órfã)
  const diagL4 = resultado.diagnosticos.find(d => d.linha === 4 && d.codigoRegra === 'OCORRENCIA_ORFA');
  assert.ok(diagL4);
  assert.strictEqual(diagL4.severidade, 'CRITICO');

  // 4. Linha 5 (Matrícula ausente)
  const diagL5 = resultado.diagnosticos.find(d => d.linha === 5 && d.codigoRegra === 'MATRICULA_AUSENTE');
  assert.ok(diagL5);

  // 5. Linha 6 (AG sem AH)
  const diagL6 = resultado.diagnosticos.find(d => d.linha === 6 && d.codigoRegra === 'EVENTO_INCOMPLETO_AG');
  assert.ok(diagL6);

  // 6. Linha 7 (AH sem AG)
  const diagL7 = resultado.diagnosticos.find(d => d.linha === 7 && d.codigoRegra === 'IMPUTADO_SEM_EVENTO_AH');
  assert.ok(diagL7);

  // 7. Linha 8 (Exceção Manual)
  const diagL8 = resultado.diagnosticos.find(d => d.linha === 8 && d.codigoRegra === 'EXCECAO_MANUAL_JUSTIFICADA');
  assert.ok(diagL8);
  assert.strictEqual(diagL8.severidade, 'EXCECAO MANUAL');

  // 8. Linha 9 (Numerário não auditável)
  const diagL9 = resultado.diagnosticos.find(d => d.linha === 9 && d.codigoRegra === 'FATO_NAO_AUDITAVEL_AUTOMATICAMENTE');
  assert.ok(diagL9);
  assert.strictEqual(diagL9.severidade, 'OBSERVACAO');

  // 9. Linha 14 (Rateio zerado no túnel 202607150007)
  const diagL14 = resultado.diagnosticos.find(d => d.linha === 14 && d.codigoRegra === 'RATEIO_PONTOS_INCOERENTE');
  assert.ok(diagL14);
  assert.strictEqual(diagL14.severidade, 'ALERTA');

  // Validação da escrita na Coluna AM
  const saidaAM = mockSheet.obterSaidaColunaAM();
  assert.strictEqual(saidaAM.length, 13);
  assert.strictEqual(saidaAM[0][0], ''); // L2 limpa
  assert.ok(saidaAM[2][0].includes('Ocorrencia orfa')); // L4 com alerta curto na AM

  // Valida a criação das abas [AUDITORIA] e [HISTORICO]
  const subLog = mockSheet.obterSubAba('[AUDITORIA] Ocorrencias');
  assert.ok(subLog);
  const subHist = mockSheet.obterSubAba('[HISTORICO] Auditoria Ocorrencias');
  assert.ok(subHist);

  // Valida que dados operacionais da planilha não foram modificados
  const rangeOriginal = mockSheet.getRange(1, 1, 14, 16);
  assert.strictEqual(rangeOriginal.getValues()[1][0], '15/07/2026'); // L2 Data intacta
  assert.strictEqual(rangeOriginal.getValues()[3][3], '113921-5'); // L4 Matrícula intacta
});

// 22. Estilização Executiva do Renderizador de Auditoria (TASK-M06.1-02)
test('RendererAuditoriaSaude: valida paleta de severidades, congelamento de painéis (linha 5) e alinhamento à esquerda das colunas 7-9', () => {
  const paleta = RendererAuditoriaSaude.PALETA_SEVERIDADES;
  assert.strictEqual(paleta['CRITICO'].fundo, '#D9534F');
  assert.strictEqual(paleta['ALERTA'].fundo, '#F0AD4E');
  assert.strictEqual(paleta['OBSERVACAO'].fundo, '#5BC0DE');
  assert.strictEqual(paleta['EXCECAO MANUAL'].fundo, '#6F42C1');
  assert.strictEqual(paleta['APROVADO'].fundo, '#28A745');

  const abaPIPValores = [['INDICADOR PIP'], ['PORTE ILEGAL DE ARMA DE FOGO']];
  const dadosLinhas = [
    ['15/07/2026', '', '26E100', '113920-7', 'SD SILVA', 1, 'PORTE ILEGAL DE ARMA DE FOGO', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 2.5, 'KEY', '']
  ];
  const mockSheet = criarMockSheet(headersPadrao, dadosLinhas, [formulaCalculadaPadrao], [], abaPIPValores);
  GuardiaoQualidade.varrerAba(mockSheet);

  const subLog = mockSheet.obterSubAba('[AUDITORIA] Ocorrencias');
  assert.ok(subLog);
  const dadosLog = subLog.obterDadosArmazenados();
  assert.strictEqual(dadosLog[5][4], 'CRITICO');

  // Validação do congelamento de painéis (setFrozenRows(5))
  assert.strictEqual(subLog.obterLinhasCongeladas(), 5);

  // Validação de alinhamento à esquerda (left) das colunas 7 a 9
  const alinhamentos = subLog.obterAlinhamentos();
  const alignLeftCols7To9 = alinhamentos.find(a => a.row === 6 && a.col === 7 && a.align === 'left');
  assert.ok(alignLeftCols7To9, 'As colunas 7 a 9 na linha 6 devem ter alinhamento à esquerda (left)');
});

// 23. Estilização Executiva e Histórico Cumulativo em [HISTORICO] Auditoria Ocorrencias (TASK-M06.1-03)
test('RendererAuditoriaSaude: valida histórico cumulativo, congelamento da linha 1, severidade na coluna 6 (cor e texto) e alinhamento à esquerda das colunas 8-10', () => {
  const abaPIPValores = [['INDICADOR PIP'], ['PORTE ILEGAL DE ARMA DE FOGO']];
  const dadosLinhas = [
    ['15/07/2026', '', '26E100', '113920-7', 'SD SILVA', 1, 'PORTE ILEGAL DE ARMA DE FOGO', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 2.5, 'KEY', '']
  ];
  const mockSheet = criarMockSheet(headersPadrao, dadosLinhas, [formulaCalculadaPadrao], [], abaPIPValores);

  // Executa varredura 1
  GuardiaoQualidade.varrerAba(mockSheet);
  // Executa varredura 2 (cumulativo)
  GuardiaoQualidade.varrerAba(mockSheet);

  const subHist = mockSheet.obterSubAba('[HISTORICO] Auditoria Ocorrencias');
  assert.ok(subHist);

  // 1. Confirma histórico estritamente cumulativo (cabeçalho + exec1 + linha em branco separadora + exec2)
  const dadosHist = subHist.obterDadosArmazenados();
  assert.strictEqual(dadosHist.length, 4);
  assert.strictEqual(dadosHist[1][5], 'CRITICO'); // Coluna 6 (SEVERIDADE) na execução 1 (linha 2)
  const separadora = dadosHist[2] || [];
  assert.ok(!separadora.some(v => String(v === undefined || v === null ? '' : v).trim() !== ''), 'linha 3 = separadora em branco (G01 #117)');
  assert.strictEqual(dadosHist[3][5], 'CRITICO'); // Coluna 6 (SEVERIDADE) na execução 2 (linha 4)

  // 2. Confirma congelamento apenas da linha 1
  assert.strictEqual(subHist.obterLinhasCongeladas(), 1);

  // 3. Confirma a cor aplicada na célula de severidade na Coluna 6 (#D9534F para CRITICO) nas execuções existentes
  const coresBackground = subHist.obterCoresBackground();
  const corCriticoLinha2Col6 = coresBackground.find(c => c.row === 2 && c.col === 6 && c.color === '#D9534F');
  assert.ok(corCriticoLinha2Col6, 'A célula de severidade na Coluna 6 da linha 2 deve receber a cor de fundo #D9534F (CRITICO)');

  const corCriticoLinha4Col6 = coresBackground.find(c => c.row === 4 && c.col === 6 && c.color === '#D9534F');
  assert.ok(corCriticoLinha4Col6, 'A célula de severidade na Coluna 6 da linha 4 (execução 2) deve receber a cor de fundo #D9534F (CRITICO)');

  // 4. Confirma alinhamento à esquerda (left) das colunas 8 a 10
  const alinhamentos = subHist.obterAlinhamentos();
  const alignLeftCols8To10 = alinhamentos.find(a => a.col === 8 && a.align === 'left');
  assert.ok(alignLeftCols8To10, 'As colunas 8 a 10 no Histórico devem ter alinhamento à esquerda (left)');
});

// 24. Destaque Visual Discreto da Coluna AM nas Abas Mensais — Fundo e Cor da Fonte (TASK-M06.1-04)
test('RendererAuditoriaSaude: aplica destaque fundo #FFF3CD e fonte #856404 exclusivamente na célula AM com alerta', () => {
  const abaPIPValores = [['INDICADOR PIP'], ['PORTE ILEGAL DE ARMA DE FOGO']];
  const dadosLinhas = [
    // L2: Com alerta (ocorrência órfã - sem MIKE)
    ['15/07/2026', '', '26E100', '113920-7', 'SD SILVA', 1, 'PORTE ILEGAL DE ARMA DE FOGO', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 2.5, 'KEY', ''],
    // L3: Sem alerta (plantão tranquilo)
    ['15/07/2026', '', '', '', '', 0, '', '', 0, 0, 0, 0, 0, 0, 0, '', '']
  ];
  const mockSheet = criarMockSheet(headersPadrao, dadosLinhas, [formulaCalculadaPadrao, ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']], [], abaPIPValores);

  // Executa o Guardião
  GuardiaoQualidade.varrerAba(mockSheet, mockPeculioExterno);

  const coresMain = mockSheet.obterCoresMainBackground();
  const colAMIdx = SyntheonUtils.localizarColuna(headersPadrao, 'ALERTA_INTEGRIDADE') + 1; // Coluna 17 (39 em prod)
  const corAMComAlerta = coresMain.find(c => c.row === 2 && c.col === colAMIdx && c.color === '#FFF3CD');
  assert.ok(corAMComAlerta, 'A célula AM da Linha 2 deve receber fundo #FFF3CD ao conter alerta');

  // 2. Confirma COR DA FONTE #856404 na célula AM da Linha 2 (com alerta)
  const fontesMain = mockSheet.obterCoresMainFont();
  const fonteAMComAlerta = fontesMain.find(c => c.row === 2 && c.col === colAMIdx && c.color === '#856404');
  assert.ok(fonteAMComAlerta, 'A célula AM da Linha 2 deve receber cor da fonte #856404 ao conter alerta');

  // 3. Confirma que a célula AM da Linha 3 (sem alerta) não recebeu a cor de fundo #FFF3CD
  const corAMSemAlerta = coresMain.find(c => c.row === 3 && c.col === colAMIdx && c.color === '#FFF3CD');
  assert.strictEqual(corAMSemAlerta, undefined, 'A célula AM da Linha 3 (sem alerta) não deve receber fundo de alerta');

  // 4. Confirmar que NENHUMA formatação de background foi applied nas colunas A a AL (colunas 1 a 16 no mock)
  const formatacaoNasColunasA_AL = coresMain.filter(c => c.col >= 1 && c.col < colAMIdx);
  assert.strictEqual(formatacaoNasColunasA_AL.length, 0, 'Nenhuma formatação de fundo deve ser aplicada às colunas A até AL (1 a 38)');

  // 5. Confirmar que valores e fórmulas operacionais permanecem iguais antes e depois da auditoria
  const rangeOriginal = mockSheet.getRange(1, 1, 3, 16);
  assert.strictEqual(rangeOriginal.getValues()[1][2], '26E100'); // L2 BOE intacto
  assert.strictEqual(rangeOriginal.getValues()[2][0], '15/07/2026'); // L3 Data intacta
});

// 25. Coluna Adicional após AM — Prova que o destaque não usa a "última coluna" (TASK-M06.1-04)
test('RendererAuditoriaSaude: com coluna adicional após AM, o destaque permanece na coluna real 39 e não vaza para a última coluna', () => {
  const headersComColunaExtra = [
    ...headersPadrao,
    'COLUNA EXTRA APÓS AM' // Coluna 18 no mock (ex: Coluna 40 em produção)
  ];
  const abaPIPValores = [['INDICADOR PIP'], ['PORTE ILEGAL DE ARMA DE FOGO']];
  const dadosLinhas = [
    // L2: Com alerta (ocorrência órfã) + valor na coluna extra
    ['15/07/2026', '', '26E100', '113920-7', 'SD SILVA', 1, 'PORTE ILEGAL DE ARMA DE FOGO', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 2.5, 'KEY', '', 'DADO_EXTRA']
  ];
  const mockSheet = criarMockSheet(headersComColunaExtra, dadosLinhas, [formulaCalculadaPadrao], [], abaPIPValores);

  // Executa o Guardião
  GuardiaoQualidade.varrerAba(mockSheet, mockPeculioExterno);

  const colAlerta = SyntheonUtils.localizarColuna(headersComColunaExtra, 'ALERTA_INTEGRIDADE') + 1; // Coluna 17 (AM em prod: 39)
  const colExtra = headersComColunaExtra.length; // Coluna 18 (última coluna, AN em prod: 40)

  const coresMain = mockSheet.obterCoresMainBackground();
  const fontesMain = mockSheet.obterCoresMainFont();

  // 1. O destaque visual DEVE ser applied na coluna ALERTA INTEGRIDADE (coluna 17 / 39)
  const destaqueAMFundo = coresMain.find(c => c.row === 2 && c.col === colAlerta && c.color === '#FFF3CD');
  const destaqueAMFonte = fontesMain.find(c => c.row === 2 && c.col === colAlerta && c.color === '#856404');
  assert.ok(destaqueAMFundo, 'O destaque de fundo #FFF3CD deve ser aplicado na coluna real de alerta (AM)');
  assert.ok(destaqueAMFonte, 'O destaque de fonte #856404 deve ser aplicado na coluna real de alerta (AM)');

  // 2. O destaque visual NÃO DEVE ser aplicado na coluna extra após AM (coluna 18 / 40)
  const vazaColunaExtraFundo = coresMain.find(c => c.row === 2 && c.col === colExtra && c.color === '#FFF3CD');
  const vazaColunaExtraFonte = fontesMain.find(c => c.row === 2 && c.col === colExtra && c.color === '#856404');
  assert.strictEqual(vazaColunaExtraFundo, undefined, 'A coluna extra após AM não deve receber o fundo de alerta');
  assert.strictEqual(vazaColunaExtraFonte, undefined, 'A coluna extra após AM não deve receber a fonte de alerta');
});

// 26. Mérito por Armas: Líder Resolvido Sem Alerta (TASK-M06.3-03)
test('RegrasQualidade: mérito por armas com líder resolvido não gera diagnóstico de alerta', () => {
  const tunelMock = {
    chave: '2026-07-15_26E100_BOE1',
    data: '2026-07-15',
    mike: '26E100',
    boe: 'BOE1',
    fatos: { armas: 1, armasArtesanais: 0 },
    linhasFatos: [
      { linha: 2, matricula: '108394-5', policial: 'IRAN SILVA', grad: '3º SGT' },
      { linha: 3, matricula: '102950-9', policial: 'SAULO ALVES', grad: '2º SGT' }
    ]
  };

  const resPeculio = {
    mapa: { '1083945': 10, '1029509': 12 }
  };

  const diags = RegrasQualidade.validarMeritoArmasTunel(tunelMock, resPeculio);
  assert.strictEqual(diags.length, 0, 'Líder resolvido não deve gerar nenhum diagnóstico de alerta');
});

// 27. Mérito por Armas: Ausência de N Gera CRITICO MERITO_ARMAS_ANTIGUIDADE_AUSENTE (TASK-M06.3-03)
test('RegrasQualidade: ausência de N para integrante de ocorrência com arma gera CRITICO MERITO_ARMAS_ANTIGUIDADE_AUSENTE', () => {
  const tunelMock = {
    chave: '2026-07-15_26E100_BOE2',
    data: '2026-07-15',
    mike: '26E100',
    boe: 'BOE2',
    fatos: { armas: 1, armasArtesanais: 0 },
    linhasFatos: [
      { linha: 2, matricula: '108394-5', policial: 'IRAN SILVA', grad: '3º SGT' },
      { linha: 3, matricula: '999999-9', policial: 'PM SEM N', grad: 'SD' }
    ]
  };

  const resPeculio = {
    mapa: { '1083945': 10 } // 999999-9 sem N no mapa
  };

  const diags = RegrasQualidade.validarMeritoArmasTunel(tunelMock, resPeculio);
  assert.strictEqual(diags.length, 1);
  assert.strictEqual(diags[0].severidade, SEVERIDADES_GUARDIAO.CRITICO);
  assert.strictEqual(diags[0].codigoRegra, 'MERITO_ARMAS_ANTIGUIDADE_AUSENTE');
  assert.ok(diags[0].evidencia.includes('999999-9'));
});

// 28. Mérito por Armas: Empate de N Gera CRITICO MERITO_ARMAS_EMPATE_ANTIGUIDADE (TASK-M06.3-03)
test('RegrasQualidade: empate no menor N entre integrantes de ocorrência com arma gera CRITICO MERITO_ARMAS_EMPATE_ANTIGUIDADE', () => {
  const tunelMock = {
    chave: '2026-07-15_26E100_BOE3',
    data: '2026-07-15',
    mike: '26E100',
    boe: 'BOE3',
    fatos: { armas: 2, armasArtesanais: 0 },
    linhasFatos: [
      { linha: 2, matricula: '108394-5', policial: 'IRAN SILVA', grad: '3º SGT' },
      { linha: 3, matricula: '102950-9', policial: 'SAULO ALVES', grad: '2º SGT' }
    ]
  };

  const resPeculio = {
    mapa: { '1083945': 10, '1029509': 10 } // Empate no menor N = 10
  };

  const diags = RegrasQualidade.validarMeritoArmasTunel(tunelMock, resPeculio);
  assert.strictEqual(diags.length, 1);
  assert.strictEqual(diags[0].severidade, SEVERIDADES_GUARDIAO.CRITICO);
  assert.strictEqual(diags[0].codigoRegra, 'MERITO_ARMAS_EMPATE_ANTIGUIDADE');
  assert.ok(diags[0].evidencia.includes('IRAN SILVA') && diags[0].evidencia.includes('SAULO ALVES'));
});

// 29. Mérito por Armas: Túnel Sem Arma Não Gera Diagnóstico (TASK-M06.3-03)
test('RegrasQualidade: túnel sem arma apreendida não gera nenhum diagnóstico de mérito por armas', () => {
  const tunelMock = {
    chave: '2026-07-15_26E100_BOE4',
    data: '2026-07-15',
    mike: '26E100',
    boe: 'BOE4',
    fatos: { armas: 0, armasArtesanais: 0 },
    linhasFatos: [
      { linha: 2, matricula: '999999-9', policial: 'PM SEM N', grad: 'SD' }
    ]
  };

  const resPeculio = { mapa: {} };

  const diags = RegrasQualidade.validarMeritoArmasTunel(tunelMock, resPeculio);
  assert.strictEqual(diags.length, 0, 'Túnel sem arma não deve auditar mérito por armas');
});

// 30. Mérito por Armas: Fonte de Antiguidade Indisponível Gera OBSERVACAO ANTIGUIDADE_FONTE_NAO_LOCALIZADA (TASK-M06.3-03)
test('RegrasQualidade: fonte oficial de antiguidade indisponível gera OBSERVACAO ANTIGUIDADE_FONTE_NAO_LOCALIZADA para túnel com arma', () => {
  const tunelMock = {
    chave: '2026-07-15_26E100_BOE5',
    data: '2026-07-15',
    mike: '26E100',
    boe: 'BOE5',
    fatos: { armas: 1, armasArtesanais: 0 },
    linhasFatos: [
      { linha: 2, matricula: '108394-5', policial: 'IRAN SILVA', grad: '3º SGT' }
    ]
  };

  const resPeculio = {
    mapa: {},
    mapaCompleto: {},
    erro: 'ANTIGUIDADE_FONTE_NAO_LOCALIZADA'
  };

  const diags = RegrasQualidade.validarMeritoArmasTunel(tunelMock, resPeculio);
  assert.strictEqual(diags.length, 1);
  assert.strictEqual(diags[0].severidade, SEVERIDADES_GUARDIAO.OBSERVACAO);
  assert.strictEqual(diags[0].codigoRegra, 'ANTIGUIDADE_FONTE_NAO_LOCALIZADA');
});

// 31. Mérito por Armas: Fonte Externa Injetável de Pecúlio (TASK-M06.3-03C)
test('GuardiaoQualidade: varrerAba aceita fonte externa injetável do Pecúlio para leitura de antiguidade', () => {
  const mockPeculioExterno = {
    getSheetByName: (n) => {
      if (n === 'EFETIVO' || n === 'PECULIO' || n === 'PECÚLIO' || n === 'CÓPIA DE PECÚLIO COM PONTUAÇÃO') {
        return {
          getName: () => 'CÓPIA DE PECÚLIO COM PONTUAÇÃO',
          getLastRow: () => 3,
          getLastColumn: () => 5,
          getRange: () => ({
            getValues: () => [
              ['ORD.', 'GRAD.', 'MAT.', 'NOME DE GUERRA', 'SUB-UNIDADE'],
              [1, '3º SGT', '108394-5', 'IRAN SILVA', '1º PEL GTAR'],
              [5, '2º SGT', '102950-9', 'SAULO ALVES', '2º PEL GTAR']
            ]
          })
        };
      }
      return null;
    }
  };

  const abaPIPValores = [['INDICADOR PIP'], ['PORTE ILEGAL DE ARMA DE FOGO']];
  const dadosLinhas = [
    ['15/07/2026', '202607151000', '26E100', '108394-5', 'IRAN SILVA', 1, 'PORTE ILEGAL DE ARMA DE FOGO', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 2.5, 'KEY1', '']
  ];
  const mockSheet = criarMockSheet(headersPadrao, dadosLinhas, [formulaCalculadaPadrao], [], abaPIPValores);

  // Executa o Guardião injetando o mockPeculioExterno
  const resultado = GuardiaoQualidade.varrerAba(mockSheet, mockPeculioExterno);

  const diagSemN = resultado.diagnosticos.find(d => d.codigoRegra === 'MERITO_ARMAS_ANTIGUIDADE_AUSENTE');
  assert.strictEqual(diagSemN, undefined, 'Não deve emitir ausência de N pois o Pecúlio externo foi injetado com sucesso');
});

// 32. Mérito por Armas: Líder Mais Antigo em Linha Sem Arma no Mesmo Túnel (TASK-M06.3-03C)
test('RegrasQualidade: considera líder mais antigo (menor N) mesmo que esteja em linha sem arma no mesmo túnel', () => {
  const tunelMock = {
    chave: '2026-07-15_26E100_BOE_MULTILINHA',
    data: '2026-07-15',
    mike: '26E100',
    boe: 'BOE_MULTILINHA',
    fatos: { armas: 1, armasArtesanais: 0 },
    linhasFatos: [
      { linha: 2, matricula: '102950-9', policial: 'SAULO ALVES', grad: '2º SGT', armas: 1 },
      { linha: 3, matricula: '108394-5', policial: 'IRAN SILVA', grad: '3º SGT', armas: 0 } // IRAN tem N=1 (mais antigo) mas 0 armas na sua linha
    ]
  };

  const resPeculio = {
    mapa: { '1083945': 1, '1029509': 15 } // IRAN (N=1), SAULO (N=15)
  };

  const diags = RegrasQualidade.validarMeritoArmasTunel(tunelMock, resPeculio);
  assert.strictEqual(diags.length, 0, 'O líder IRAN (N=1) deve ser reconhecido a partir do túnel sem gerar alertas');
});

// 33. Mérito por Armas: Emissão Única de ANTIGUIDADE_FONTE_NAO_LOCALIZADA por Varredura (TASK-M06.3-03C)
test('GuardiaoQualidade: vários túneis armados com fonte indisponível geram exatamente 1 única observação ANTIGUIDADE_FONTE_NAO_LOCALIZADA', () => {
  const abaPIPValores = [['INDICADOR PIP'], ['PORTE ILEGAL DE ARMA DE FOGO']];
  const dadosLinhas = [
    // Túnel 1 (Armado)
    ['15/07/2026', '202607151000', '26E100', '108394-5', 'IRAN SILVA', 1, 'PORTE ILEGAL DE ARMA DE FOGO', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 2.5, 'KEY1', ''],
    // Túnel 2 (Armado)
    ['16/07/2026', '202607161000', '26E200', '102950-9', 'SAULO ALVES', 1, 'PORTE ILEGAL DE ARMA DE FOGO', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 2.5, 'KEY2', ''],
    // Túnel 3 (Armado)
    ['17/07/2026', '202607171000', '26E300', '113920-7', 'MARCONI LIMA', 1, 'PORTE ILEGAL DE ARMA DE FOGO', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 2.5, 'KEY3', '']
  ];
  const mockSheet = criarMockSheet(headersPadrao, dadosLinhas, [formulaCalculadaPadrao, formulaCalculadaPadrao, formulaCalculadaPadrao], [], abaPIPValores);

  const mockPeculioSemEfetivo = {
    getSheetByName: () => null
  };

  const resultado = GuardiaoQualidade.varrerAba(mockSheet, mockPeculioSemEfetivo);

  const obsFonte = resultado.diagnosticos.filter(d => d.codigoRegra === 'ANTIGUIDADE_FONTE_NAO_LOCALIZADA');
  assert.strictEqual(obsFonte.length, 1, 'Deve emitir EXATAMENTE UMA observação técnica por varredura');
});

// 34. Fonte de Pecúlio Oficial Configurável por ID (TASK-M06.3-03D)
test('CONFIG_SYNTHEON: obterIdPeculio retorna o ID oficial correto do Pecúlio', () => {
  const ConfigMod = require('../Core/Config');
  assert.strictEqual(ConfigMod.obterIdPeculio(), '1PJnA8d9sf5CNj0-rt3yIxnwS8BEGfqxRvoyOjCtVHNE');
});

// 35. Ausência de Fallback sheet.getParent() (TASK-M06.3-03D)
test('GuardiaoQualidade: planilha de ocorrências (sheet.getParent) NUNCA é usada como fallback de Pecúlio', () => {
  const abaPIPValores = [['INDICADOR PIP'], ['PORTE ILEGAL DE ARMA DE FOGO']];
  const dadosLinhas = [
    ['15/07/2026', '202607151000', '26E100', '108394-5', 'IRAN SILVA', 1, 'PORTE ILEGAL DE ARMA DE FOGO', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 2.5, 'KEY1', '']
  ];
  const mockSheet = criarMockSheet(headersPadrao, dadosLinhas, [formulaCalculadaPadrao], [], abaPIPValores);

  // Sem fonte externa e sem SpreadsheetApp.openById, o Guardião NÃO usa sheet.getParent()
  const resultado = GuardiaoQualidade.varrerAba(mockSheet, null);

  const obsFonte = resultado.diagnosticos.find(d => d.codigoRegra === 'ANTIGUIDADE_FONTE_NAO_LOCALIZADA');
  assert.ok(obsFonte, 'Deve emitir a observação técnica de fonte indisponível sem tentar ler a planilha pai');
});

// ---- #146/#147: QTD O e ordem de antiguidade (ARCA-QTD-O-001 / ARCA-ANTIGUIDADE-002) ----
const headersQtdOOrdem = ['DATA', 'QTD O', 'NÚMERO MIKE', 'BOE', 'GRAD', 'MATRÍCULA', 'POLICIAL', 'ARMAS', 'OCORRÊNCIA PIP', 'IMPUTADO?', 'TOTAL DE MACONHA', 'DIVIDIDO MAC', 'TOTAL CRACK', 'TOTAL DE COCAINA', 'DIVIDIDO COC', 'PONTOS TOTAIS', 'PONTOS FICCAO', 'CHAVE OCORRENCIA', 'ALERTA INTEGRIDADE'];
const formulasQtdOOrdem = [headersQtdOOrdem.map(() => '')];

// Carrega o nucleo canonico de ordem (Core/Policiais.js) no escopo global do teste.
try {
  const fsMod = require('fs'); const pathMod = require('path');
  const fontePol = fsMod.readFileSync(pathMod.join(__dirname, '..', 'Core', 'Policiais.js'), 'utf8');
  const iBloco = fontePol.indexOf('ORDEM_POSTOS_ANTIGUIDADE_ = [');
  const inicio = fontePol.lastIndexOf('var ', iBloco);
  const fim = fontePol.indexOf('// FIM-ORDEM-ANTIGUIDADE', inicio);
  const bloco = fontePol.slice(inicio, fim);
  const fns = new Function(bloco + '\nreturn { indice: indiceAntiguidadePosto_, matricula: matriculaNumerica_ };')();
  global.indiceAntiguidadePosto_ = fns.indice;
  global.matriculaNumerica_ = fns.matricula;
} catch (e) { /* sem o nucleo, o check de ordem e ignorado */ }

test('ARCA-QTD-O-001: QTD O = 01 na primeira linha (e vazio na filha) NAO gera diagnostico', () => {
  const dados = [
    ['15/07/2026', '01', '202607151000', '26E100', '3º SGT', '108394-5', 'IRAN SILVA', 0, 'PORTE ILEGAL', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 2.5, 'KEY1', ''],
    ['15/07/2026', '',   '202607151000', '26E100', 'CB',     '118379-6', 'ANDRESSON',  0, 'PORTE ILEGAL', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 2.5, 'KEY1', '']
  ];
  const r = GuardiaoQualidade.varrerAba(criarMockSheet(headersQtdOOrdem, dados, formulasQtdOOrdem));
  assert.strictEqual(r.diagnosticos.filter(d => d.codigoRegra === 'QTD_O_DIVERGENTE').length, 0);
});

test('ARCA-QTD-O-001: QTD O diferente de 01 na primeira linha gera diagnostico', () => {
  const dados = [
    ['15/07/2026', '02', '202607151000', '26E100', '3º SGT', '108394-5', 'IRAN SILVA', 0, 'PORTE ILEGAL', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 2.5, 'KEY1', '']
  ];
  const r = GuardiaoQualidade.varrerAba(criarMockSheet(headersQtdOOrdem, dados, formulasQtdOOrdem));
  assert.ok(r.diagnosticos.find(d => d.codigoRegra === 'QTD_O_DIVERGENTE'));
});

test('ARCA-ANTIGUIDADE-002: equipe na ordem canonica NAO gera diagnostico', () => {
  const dados = [
    ['16/07/2026', '01', '202607161000', '26E200', '3º SGT', '110955-3', 'ARY SILVA',  0, 'PORTE ILEGAL', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 2.5, 'KEY2', ''],
    ['16/07/2026', '',   '202607161000', '26E200', 'CB',     '118379-6', 'ANDRESSON', 0, 'PORTE ILEGAL', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 2.5, 'KEY2', '']
  ];
  const r = GuardiaoQualidade.varrerAba(criarMockSheet(headersQtdOOrdem, dados, formulasQtdOOrdem));
  assert.strictEqual(r.diagnosticos.filter(d => d.codigoRegra === 'ORDEM_ANTIGUIDADE_EQUIPE').length, 0);
});

test('ARCA-ANTIGUIDADE-002: equipe fora da ordem canonica gera diagnostico', () => {
  const dados = [
    ['16/07/2026', '01', '202607161000', '26E200', 'CB',     '118379-6', 'ANDRESSON', 0, 'PORTE ILEGAL', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 2.5, 'KEY2', ''],
    ['16/07/2026', '',   '202607161000', '26E200', '3º SGT', '110955-3', 'ARY SILVA',  0, 'PORTE ILEGAL', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 2.5, 'KEY2', '']
  ];
  const r = GuardiaoQualidade.varrerAba(criarMockSheet(headersQtdOOrdem, dados, formulasQtdOOrdem));
  assert.ok(r.diagnosticos.find(d => d.codigoRegra === 'ORDEM_ANTIGUIDADE_EQUIPE'));
});

console.log(`\n🎉 Testes do Guardião da Qualidade concluídos: ${sucessos} testes passaram!`);
}
