'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/TestGuardiao.js
 * DESCRIÇÃO: Suíte de testes unitários para o Guardião da Qualidade Operacional (M05).
 * Valida diagnósticos, coerência do túnel, rateio acumulado/zerado, Tabela PIP e o formatador legível com histórico (TASK-M05.1-05).
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

function criarMockSheet(headers, dadosLinhas, formulasLinhas = [], notasLinhas = [], abaPIPValues = null, nomeAba = 'JUL2026_TESTE', nomeAbaPIP = 'Tabela PIP') {
  const dadosTotais = [headers, ...dadosLinhas];
  const formulasTotais = [headers.map(() => ''), ...formulasLinhas];
  const notasTotais = [headers.map(() => ''), ...notasLinhas];

  let dadosColunaAM = [];
  const mapSubSheets = {};

  const createRangeMock = (targetRow, targetCol, sheetDataRef) => {
    const rangeObj = {
      getValues: () => sheetDataRef.values || dadosTotais,
      getFormulas: () => sheetDataRef.formulas || formulasTotais,
      getNotes: () => sheetDataRef.notes || notasTotais,
      setValue: (val) => {
        if (targetCol && targetRow === 1 && sheetDataRef.values) sheetDataRef.values[0][targetCol - 1] = val;
        return rangeObj;
      },
      setValues: (vals) => {
        if (sheetDataRef.isMain && targetRow === 2 && targetCol === headers.length) {
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
      setFontWeight: () => rangeObj
    };
    return rangeObj;
  };

  const mainRef = { values: dadosTotais, formulas: formulasTotais, notes: notasTotais, isMain: true };

  const getSubSheet = (name) => {
    if (!mapSubSheets[name]) {
      const subStorage = [];
      mapSubSheets[name] = {
        getName: () => name,
        getLastRow: () => subStorage.length,
        getLastColumn: () => (subStorage[0] ? subStorage[0].length : 0),
        clear: () => { subStorage.length = 0; },
        getRange: (r, c, numR, numC) => createRangeMock(r, c, { storage: subStorage }),
        autoResizeColumns: () => {},
        setFontWeight: () => {},
        obterDadosArmazenados: () => subStorage
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

  const parentMock = {
    getSheets: () => {
      const list = [sheetMock];
      if (pipSheetMock) list.push(pipSheetMock);
      Object.keys(mapSubSheets).forEach(k => list.push(mapSubSheets[k]));
      return list;
    },
    getSheetByName: (n) => {
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
    getRange: (row, col) => createRangeMock(row, col, mainRef),
    getParent: () => parentMock,
    obterSaidaColunaAM: () => dadosColunaAM,
    obterSubAba: (n) => mapSubSheets[n]
  };

  return sheetMock;
}

const headersPadrao = [
  'DATA', 'NÚMERO MIKE', 'BOE', 'MATRÍCULA', 'POLICIAL', 'ARMAS', 'OCORRÊNCIA PIP', 'IMPUTADO?',
  'TOTAL DE MACONHA', 'DIVIDIDO MAC', 'TOTAL CRACK', 'TOTAL DE COCAINA', 'DIVIDIDO COC',
  'PONTOS TOTAIS', 'PONTOS FICCAO', 'CHAVE OCORRENCIA', 'ALERTA INTEGRIDADE'
];

const formulaCalculadaPadrao = ['', '', '', '', '', '', '', '', '=H2/2', '=I2', '=J2', '=K2/2', '=L2', '=M2/4', '=N2', '=O2'];

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
    ['15/07/2026', '', '26E100', '113920-7', 'SD SILVA', 0, 'PORTE ILEGAL', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 10, 'KEY', '']
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
    ['15/07/2026', '2026', '26E100', '113920-7', 'SD SILVA', 0, 'PORTE ILEGAL', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 10, 'KEY', '']
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
    ['20/07/2026', '202607150001', '26E100', '113920-7', 'SD SILVA', 0, 'PORTE ILEGAL', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 10, 'KEY', '']
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
    [dataObjeto, '202607150001', '26E100', '113920-7', 'SD SILVA', 0, 'PORTE ILEGAL', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 10, 'KEY', '']
  ];
  const mockSheet = criarMockSheet(headersPadrao, dadosLinhas, [formulaCalculadaPadrao]);
  const resultado = GuardiaoQualidade.varrerAba(mockSheet);

  const diagDataMike = resultado.diagnosticos.find(d => d.codigoRegra === 'MIKE_DATA_DIVERGENTE');
  assert.strictEqual(diagDataMike, undefined);
});

// 6. Teste: Coerência cruzada — mesmo MIKE com BOEs divergentes
test('GuardiaoQualidade: mesmo MIKE com BOEs diferentes deve gerar diagnóstico de divergência', () => {
  const dadosLinhas = [
    ['15/07/2026', '202607150001', '26E100', '113920-7', 'SD SILVA', 0, 'PORTE ILEGAL', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 10, 'KEY', ''],
    ['15/07/2026', '202607150001', '26E200', '113921-5', 'SD SOUZA', 0, 'PORTE ILEGAL', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 10, 'KEY', '']
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
    ['15/07/2026', '202607150001', '26E100', '113920-7', 'SD SILVA', 0, 'PORTE ILEGAL', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 10, 'KEY', ''],
    ['20/07/2026', '202607150001', '26E100', '113921-5', 'SD SOUZA', 0, 'PORTE ILEGAL', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 10, 'KEY', '']
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
    ['15/07/2026', '202607150001', '26E100', '113920-7', 'SD SILVA', 0, 'PORTE ILEGAL', '', 0, 0, 0, 0, 0, 10, 10, 'KEY', '']
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
    ['15/07/2026', '202607150001', '26E100', '113920-7', 'SD SILVA', 0, '', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 10, 'KEY', '']
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
    ['15/07/2026', '202607150001', '26E100', '113920-7', 'SD SILVA', 0, 'PORTE ILEGAL', 'COM IMPUTADO', 40, 20, 0, 0, 0, 10, 10, 'KEY', '']
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
    ['15/07/2026', '202607150001', '26E100', '113920-7', 'SD SILVA', 0, 'APREENSÃO DE NUMERÁRIO', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 10, 'KEY', '']
  ];
  const mockSheet = criarMockSheet(headersPadrao, dadosLinhas, [formulaCalculadaPadrao]);
  const resultado = GuardiaoQualidade.varrerAba(mockSheet);

  const diagNaoAuditavel = resultado.diagnosticos.find(d => d.codigoRegra === 'FATO_NAO_AUDITAVEL_AUTOMATICAMENTE');
  assert.ok(diagNaoAuditavel);
  assert.strictEqual(diagNaoAuditavel.severidade, 'OBSERVACAO');
});

// 12. Regressão Matemático do Rateio por Túnel (4 policiais, fatos de 80, 64 e 160 = 304 / 4 = 76)
test('RegrasQualidade: rateio por túnel com 4 policiais e fatos de 80, 64 e 160 (total 304 / 4 = 76) não deve acusar erro', () => {
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

// 13. Rateio Zerado
test('RegrasQualidade: rateio por túnel com 304 pontos e 4 policiais onde um possui PONTOS FICÇÃO = 0 deve gerar RATEIO_PONTOS_INCOERENTE', () => {
  const dadosLinhas = [
    ['15/07/2026', '202607150001', '26E100', '113920-7', 'SD SILVA', 0, 'PORTE ILEGAL', 'COM IMPUTADO', 0, 0, 0, 0, 0, 80, 76, 'KEY', ''],
    ['15/07/2026', '202607150001', '26E100', '113921-5', 'SD SOUZA', 0, 'POSSE DE DROGAS', 'SEM IMPUTADO', 0, 0, 0, 0, 0, 64, 76, 'KEY', ''],
    ['15/07/2026', '202607150001', '26E100', '113922-3', 'SD SANTOS', 0, 'TRÁFICO', 'COM IMPUTADO', 0, 0, 0, 0, 0, 160, 76, 'KEY', ''],
    ['15/07/2026', '202607150001', '26E100', '113923-1', 'SD OLIVEIRA', 0, 'TRÁFICO', 'COM IMPUTADO', 0, 0, 0, 0, 0, 0, 0, 'KEY', '']
  ];
  const mockSheet = criarMockSheet(headersPadrao, dadosLinhas, [formulaCalculadaPadrao, formulaCalculadaPadrao, formulaCalculadaPadrao, formulaCalculadaPadrao]);
  const resultado = GuardiaoQualidade.varrerAba(mockSheet);

  const diagRateioZerado = resultado.diagnosticos.find(d => d.codigoRegra === 'RATEIO_PONTOS_INCOERENTE');
  assert.ok(diagRateioZerado);
  assert.strictEqual(diagRateioZerado.linha, 5);
});

// 14. Nome alternativo da aba Tabela PIP
test('GuardiaoQualidade: reconhece a Tabela PIP com hífen no nome (ex: TABELA-PIP)', () => {
  const abaPIPValores = [
    ['INDICADOR PIP'],
    ['PORTE ILEGAL DE ARMA DE FOGO']
  ];
  const dadosLinhas = [
    ['15/07/2026', '202607150001', '26E100', '113920-7', 'SD SILVA', 1, 'PORTE ILEGAL DE ARMA DE FOGO', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 10, 'KEY', '']
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
    ['15/07/2026', '202607150001', '26E100', '113920-7', 'SD SILVA', 1, 'PORTE ILEGAL DE ARMA DE FOGO', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 10, 'KEY', ''],
    ['15/07/2026', '202607150001', '26E100', '113921-5', 'SD SOUZA', 1, 'INVENTADO_DESCONHECIDO', 'SEM IMPUTADO', 0, 0, 0, 0, 0, 10, 10, 'KEY', '']
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
    ['15/07/2026', '202607150001', '26E100', '113920-7', 'SD SILVA', 1, 'PORTE ILEGAL DE ARMA DE FOGO', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 10, 'KEY', '']
  ];

  const mockSheet = criarMockSheet(headersPadrao, dadosLinhas, [formulaCalculadaPadrao], [], abaPIPSemCabecalhoIndicador, 'JUL2026_TESTE', 'Tabela PIP');
  const resultado = GuardiaoQualidade.varrerAba(mockSheet);

  const diagModoLimitado = resultado.diagnosticos.find(d => d.codigoRegra === 'MODO_LIMITADO_CATALOGO_PIP');
  assert.ok(diagModoLimitado);
  assert.strictEqual(diagModoLimitado.severidade, 'OBSERVACAO');
});

// 17. Auditoria com alertas popula resumo e tabela de 8 colunas em [AUDITORIA] Ocorrencias (TASK-M05.1-05)
test('RendererAuditoriaSaude: auditoria com alertas popula a aba [AUDITORIA] Ocorrencias com resumo e tabela de 8 colunas', () => {
  const abaPIPValores = [['INDICADOR PIP'], ['PORTE ILEGAL DE ARMA DE FOGO']];
  const dadosLinhas = [
    ['15/07/2026', '', '26E100', '113920-7', 'SD SILVA', 1, 'PORTE ILEGAL DE ARMA DE FOGO', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 10, 'KEY', '']
  ];

  const mockSheet = criarMockSheet(headersPadrao, dadosLinhas, [formulaCalculadaPadrao], [], abaPIPValores);
  GuardiaoQualidade.varrerAba(mockSheet);

  const subAbaLog = mockSheet.obterSubAba('[AUDITORIA] Ocorrencias');
  assert.ok(subAbaLog);
  const dadosLog = subAbaLog.obterDadosArmazenados();
  assert.ok(dadosLog.length >= 6);

  assert.deepStrictEqual(dadosLog[4], ['ABA', 'TÚNEL', 'LINHA', 'SEVERIDADE', 'REGRA', 'DIAGNÓSTICO', 'EVIDÊNCIA', 'AÇÃO RECOMENDADA']);
  assert.strictEqual(dadosLog[5][0], 'JUL2026_TESTE');
  assert.strictEqual(dadosLog[5][3], 'CRITICO');
  assert.strictEqual(dadosLog[5][4], 'OCORRENCIA_ORFA');
});

// 18. Auditoria Aprovada (0 alertas -> exibe linha APROVADO) (TASK-M05.1-05)
test('RendererAuditoriaSaude: auditoria aprovada sem alertas exibe a linha APROVADO na aba de auditoria', () => {
  const abaPIPValores = [['INDICADOR PIP'], ['PORTE ILEGAL DE ARMA DE FOGO']];
  const dadosLinhas = [
    ['15/07/2026', '202607150001', '26E100', '113920-7', 'SD SILVA', 1, 'PORTE ILEGAL DE ARMA DE FOGO', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 10, 'KEY', '']
  ];

  const mockSheet = criarMockSheet(headersPadrao, dadosLinhas, [formulaCalculadaPadrao], [], abaPIPValores);
  GuardiaoQualidade.varrerAba(mockSheet);

  const subAbaLog = mockSheet.obterSubAba('[AUDITORIA] Ocorrencias');
  assert.ok(subAbaLog);
  const dadosLog = subAbaLog.obterDadosArmazenados();

  assert.strictEqual(dadosLog[0][5], 'APROVADO');
  assert.strictEqual(dadosLog[5][3], 'APROVADO');
  assert.strictEqual(dadosLog[5][4], 'INTEGRIDADE_OK');
});

// 19. Histórico Preservando Múltiplas Execuções Cumulativas (TASK-M05.1-05)
test('RendererAuditoriaSaude: aba [HISTORICO] Auditoria Ocorrencias preserva registros de múltiplas execuções sem sobrescrever', () => {
  const abaPIPValores = [['INDICADOR PIP'], ['PORTE ILEGAL DE ARMA DE FOGO']];
  const dadosLinhas = [
    ['15/07/2026', '202607150001', '26E100', '113920-7', 'SD SILVA', 1, 'PORTE ILEGAL DE ARMA DE FOGO', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 10, 'KEY', '']
  ];

  const mockSheet = criarMockSheet(headersPadrao, dadosLinhas, [formulaCalculadaPadrao], [], abaPIPValores);
  
  // Primeira execução
  GuardiaoQualidade.varrerAba(mockSheet);
  // Segunda execução
  GuardiaoQualidade.varrerAba(mockSheet);

  const subAbaHist = mockSheet.obterSubAba('[HISTORICO] Auditoria Ocorrencias');
  assert.ok(subAbaHist);
  const dadosHist = subAbaHist.obterDadosArmazenados();

  assert.deepStrictEqual(dadosHist[0], ['DATA/HORA EXECUÇÃO', 'ABA', 'TÚNEL', 'LINHA', 'SEVERIDADE', 'REGRA', 'DIAGNÓSTICO', 'EVIDÊNCIA', 'AÇÃO RECOMENDADA']);
  assert.strictEqual(dadosHist.length, 3);
  assert.strictEqual(dadosHist[1][1], 'JUL2026_TESTE');
  assert.strictEqual(dadosHist[2][1], 'JUL2026_TESTE');
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

console.log(`\n🎉 Testes do Guardião da Qualidade concluídos: ${sucessos} testes passaram!`);
}
