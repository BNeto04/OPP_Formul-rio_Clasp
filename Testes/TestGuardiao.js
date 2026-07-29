'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/TestGuardiao.js
 * DESCRIÇÃO: Suíte de testes unitários para o Guardião da Qualidade Operacional (M05).
 * Valida a compatibilidade de diagnósticos, coerência do túnel e auditoria matemática/exceções (TASK-M05.1-04A).
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

function criarMockSheet(headers, dadosLinhas, formulasLinhas = [], notasLinhas = []) {
  const dadosTotais = [headers, ...dadosLinhas];
  const formulasTotais = [headers.map(() => ''), ...formulasLinhas];
  const notasTotais = [headers.map(() => ''), ...notasLinhas];

  let dadosColunaAM = [];

  const createRangeMock = (targetRow, targetCol) => {
    const rangeObj = {
      getValues: () => dadosTotais,
      getFormulas: () => formulasTotais,
      getNotes: () => notasTotais,
      setValue: (val) => {
        if (targetCol && targetRow === 1) headers[targetCol - 1] = val;
        return rangeObj;
      },
      setValues: (vals) => {
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

const headersPadrao = [
  'DATA', 'NÚMERO MIKE', 'BOE', 'MATRÍCULA', 'POLICIAL', 'ARMAS', 'OCORRÊNCIA PIP', 'IMPUTADO?',
  'TOTAL DE MACONHA', 'DIVIDIDO MAC', 'TOTAL CRACK', 'TOTAL DE COCAINA', 'DIVIDIDO COC',
  'PONTOS TOTAIS', 'PONTOS FICCAO', 'CHAVE OCORRENCIA', 'ALERTA INTEGRIDADE'
];

const formulaCalculadaPadrao = ['', '', '', '', '', '', '', '', '=H2/2', '=I2', '=J2', '=K2/2', '=L2', '=M2/4', '=N2', '=O2'];

// 1. Teste: Plantão Tranquilo (permitido sem alertas)
test('GuardiaoQualidade: linha de plantão tranquilo (apenas data) não deve gerar alerta', () => {
  const dadosLinhas = [
    ['15/07/2026', '', '', '', '', 0, '', '', 0, 0, 0, 0, 0, 0, 0, '', '']
  ];
  const mockSheet = criarMockSheet(headersPadrao, dadosLinhas, [['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']]);
  const resultado = GuardiaoQualidade.varrerAba(mockSheet);

  assert.strictEqual(resultado.alertas, 0);
  assert.strictEqual(resultado.diagnosticos.length, 0);
});

// 2. Teste: Ocorrência órfã (participação sem MIKE -> CRITICO)
test('GuardiaoQualidade: ocorrência órfã (policial sem MIKE) deve gerar diagnóstico CRITICO', () => {
  const dadosLinhas = [
    ['15/07/2026', '', '26E100', '113920-7', 'SD SILVA', 0, 'PORTE ILEGAL', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 10, 'KEY', '']
  ];
  const mockSheet = criarMockSheet(headersPadrao, dadosLinhas, [formulaCalculadaPadrao]);
  const resultado = GuardiaoQualidade.varrerAba(mockSheet);

  assert.strictEqual(resultado.alertas, 1);
  const diagOrfa = resultado.diagnosticos.find(d => d.codigoRegra === 'OCORRENCIA_ORFA');
  assert.ok(diagOrfa);
  assert.strictEqual(diagOrfa.severidade, 'CRITICO');
});

// 3. Teste: MIKE suspeito (ALERTA)
test('GuardiaoQualidade: MIKE suspeito deve gerar ALERTA sem bloquear a execução', () => {
  const dadosLinhas = [
    ['15/07/2026', '2026', '26E100', '113920-7', 'SD SILVA', 0, 'PORTE ILEGAL', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 10, 'KEY', '']
  ];
  const mockSheet = criarMockSheet(headersPadrao, dadosLinhas, [formulaCalculadaPadrao]);
  const resultado = GuardiaoQualidade.varrerAba(mockSheet);

  assert.strictEqual(resultado.alertas, 1);
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
  assert.ok(diagDataMike.diagnostico.includes('Divergência entre data'));
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
  const formulas = [formulaCalculadaPadrao, formulaCalculadaPadrao];

  const mockSheet = criarMockSheet(headersPadrao, dadosLinhas, formulas);
  const resultado = GuardiaoQualidade.varrerAba(mockSheet);

  const diagBoe = resultado.diagnosticos.find(d => d.codigoRegra === 'MIKE_BOE_DIVERGENTE');
  assert.ok(diagBoe);
  assert.strictEqual(diagBoe.severidade, 'ALERTA');
  assert.ok(diagBoe.diagnostico.includes('BOEs diferentes'));
});

// 7. Teste: Coerência cruzada — mesmo MIKE em datas diferentes
test('GuardiaoQualidade: mesmo MIKE utilizado em datas diferentes deve gerar diagnóstico de datas divergentes', () => {
  const dadosLinhas = [
    ['15/07/2026', '202607150001', '26E100', '113920-7', 'SD SILVA', 0, 'PORTE ILEGAL', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 10, 'KEY', ''],
    ['20/07/2026', '202607150001', '26E100', '113921-5', 'SD SOUZA', 0, 'PORTE ILEGAL', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 10, 'KEY', '']
  ];
  const formulas = [formulaCalculadaPadrao, formulaCalculadaPadrao];

  const mockSheet = criarMockSheet(headersPadrao, dadosLinhas, formulas);
  const resultado = GuardiaoQualidade.varrerAba(mockSheet);

  const diagDatas = resultado.diagnosticos.find(d => d.codigoRegra === 'MIKE_DATAS_DIVERGENTES');
  assert.ok(diagDatas);
  assert.strictEqual(diagDatas.severidade, 'ALERTA');
  assert.ok(diagDatas.diagnostico.includes('datas incompatíveis'));
});

// 8. Teste: AG sem AH (Evento incompleto)
test('GuardiaoQualidade: AG preenchido sem AH deve gerar EVENTO_INCOMPLETO_AG com ação recomendada', () => {
  const dadosLinhas = [
    ['15/07/2026', '202607150001', '26E100', '113920-7', 'SD SILVA', 0, 'PORTE ILEGAL', '', 0, 0, 0, 0, 0, 10, 10, 'KEY', '']
  ];
  const mockSheet = criarMockSheet(headersPadrao, dadosLinhas, [formulaCalculadaPadrao]);
  const resultado = GuardiaoQualidade.varrerAba(mockSheet);

  const diagIncompleto = resultado.diagnosticos.find(d => d.codigoRegra === 'EVENTO_INCOMPLETO_AG');
  assert.ok(diagIncompleto);
  assert.strictEqual(diagIncompleto.severidade, 'ALERTA');
  assert.ok(diagIncompleto.acaoRecomendada.includes('Revise AG/AH'));
});

// 9. Teste: AH sem AG (Imputado sem evento)
test('GuardiaoQualidade: AH preenchido sem AG (imputado sem evento) deve gerar IMPUTADO_SEM_EVENTO_AH com ALERTA', () => {
  const dadosLinhas = [
    ['15/07/2026', '202607150001', '26E100', '113920-7', 'SD SILVA', 0, '', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 10, 'KEY', '']
  ];
  const mockSheet = criarMockSheet(headersPadrao, dadosLinhas, [formulaCalculadaPadrao]);
  const resultado = GuardiaoQualidade.varrerAba(mockSheet);

  const diagImputadoSemAG = resultado.diagnosticos.find(d => d.codigoRegra === 'IMPUTADO_SEM_EVENTO_AH');
  assert.ok(diagImputadoSemAG);
  assert.strictEqual(diagImputadoSemAG.severidade, 'ALERTA');
  assert.ok(diagImputadoSemAG.diagnostico.includes('Imputado sem evento'));
});

// 10. Teste: Exceção Manual por Nota iniciada por EXCECAO: (TASK-M05.1-04)
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
  assert.ok(diagExcecao.condicaoExcecaoManual);
  assert.ok(diagExcecao.diagnostico.includes('Numerario de R$ 40,00 conforme BOE'));
});

// 11. Teste: Fato não auditável automaticamente (Numerário sem valor cadastrado) (TASK-M05.1-04)
test('GuardiaoQualidade: numerário sem valor em reais registrado deve ser classificado como NÃO AUDITÁVEL AUTOMATICAMENTE', () => {
  const dadosLinhas = [
    ['15/07/2026', '202607150001', '26E100', '113920-7', 'SD SILVA', 0, 'APREENSÃO DE NUMERÁRIO', 'COM IMPUTADO', 0, 0, 0, 0, 0, 10, 10, 'KEY', '']
  ];
  const mockSheet = criarMockSheet(headersPadrao, dadosLinhas, [formulaCalculadaPadrao]);
  const resultado = GuardiaoQualidade.varrerAba(mockSheet);

  const diagNaoAuditavel = resultado.diagnosticos.find(d => d.codigoRegra === 'FATO_NAO_AUDITAVEL_AUTOMATICAMENTE');
  assert.ok(diagNaoAuditavel);
  assert.strictEqual(diagNaoAuditavel.severidade, 'OBSERVACAO');
  assert.ok(diagNaoAuditavel.diagnostico.includes('NÃO AUDITÁVEL AUTOMATICAMENTE'));
});

// 12. Regressão Matemático do Rateio por Túnel (4 policiais, fatos de 80, 64 e 160 = 304 / 4 = 76) (TASK-M05.1-04A)
test('RegrasQualidade: rateio por túnel com 4 policiais e fatos de 80, 64 e 160 (total 304 / 4 = 76) não deve acusar erro', () => {
  const dadosLinhas = [
    ['15/07/2026', '202607150001', '26E100', '113920-7', 'SD SILVA', 0, 'PORTE ILEGAL', 'COM IMPUTADO', 0, 0, 0, 0, 0, 80, 76, 'KEY', ''],
    ['15/07/2026', '202607150001', '26E100', '113921-5', 'SD SOUZA', 0, 'POSSE DE DROGAS', 'SEM IMPUTADO', 0, 0, 0, 0, 0, 64, 76, 'KEY', ''],
    ['15/07/2026', '202607150001', '26E100', '113922-3', 'SD SANTOS', 0, 'TRÁFICO', 'COM IMPUTADO', 0, 0, 0, 0, 0, 160, 76, 'KEY', ''],
    ['15/07/2026', '202607150001', '26E100', '113923-1', 'SD OLIVEIRA', 0, 'TRÁFICO', 'COM IMPUTADO', 0, 0, 0, 0, 0, 0, 76, 'KEY', '']
  ];
  const formulas = [formulaCalculadaPadrao, formulaCalculadaPadrao, formulaCalculadaPadrao, formulaCalculadaPadrao];

  const mockSheet = criarMockSheet(headersPadrao, dadosLinhas, formulas);
  const resultado = GuardiaoQualidade.varrerAba(mockSheet);

  const diagRateio = resultado.diagnosticos.find(d => d.codigoRegra === 'RATEIO_PONTOS_INCOERENTE');
  assert.strictEqual(diagRateio, undefined); // 304 / 4 = 76.00 -> PERFEITO!
});

// 13. Teste: Catálogo PIP Dinâmico - Consulta, Ausente (OBSERVACAO) e Novo Item no Catálogo (TASK-M05.1-04A)
test('RegrasQualidade: consulta ao catálogo PIP dinâmico reconhece itens cadastrados, gera OBSERVACAO para ausentes e aceita novos itens sem alterar código', () => {
  const catalogoDinamico = ['PORTE ILEGAL DE ARMA', 'TRÁFICO DE ENTORPECENTES', 'NOVO_EVENTO_OPERACIONAL_2026'];

  // 1. Item presente no catálogo -> reconhecido
  assert.strictEqual(RegrasQualidade.indicadorConhecido('PORTE ILEGAL DE ARMA', catalogoDinamico), true);

  // 2. Novo item incluído no catálogo sem editar RegrasQualidade.js -> reconhecido
  assert.strictEqual(RegrasQualidade.indicadorConhecido('NOVO_EVENTO_OPERACIONAL_2026', catalogoDinamico), true);

  // 3. Item ausente do catálogo -> false (Guardião emitirá OBSERVACAO)
  assert.strictEqual(RegrasQualidade.indicadorConhecido('EVENTO_INVENTADO_DESCONHECIDO', catalogoDinamico), false);
});

console.log(`\n🎉 Testes do Guardião da Qualidade concluídos: ${sucessos} testes passaram!`);
}
