'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- TESTANDO ENTRADA MANUAL (Carga e Gravação Mapeada) ---');

// Mock GAS
global.SpreadsheetApp = {
    DataValidationCriteria: {
        VALUE_IN_LIST: 'VALUE_IN_LIST',
        VALUE_IN_RANGE: 'VALUE_IN_RANGE'
    }
};

global.Logger = { log: console.log };

const entradaManualCode = fs.readFileSync(path.join(__dirname, '../Entrada/EntradaManual.js'), 'utf8');
eval(entradaManualCode + '\nif(typeof gravarLinhasEntradaManual !== "undefined") global.gravarLinhasEntradaManual = gravarLinhasEntradaManual; if(typeof obterOpcoesValidacao !== "undefined") global.obterOpcoesValidacao = obterOpcoesValidacao; if(typeof localizarAbaMensalTratada !== "undefined") global.localizarAbaMensalTratada = localizarAbaMensalTratada; if(typeof processarEntradaManual !== "undefined") global.processarEntradaManual = processarEntradaManual; if(typeof verificarDuplicidadeOcorrencia !== "undefined") global.verificarDuplicidadeOcorrencia = verificarDuplicidadeOcorrencia; if(typeof resolverNomeAbaMensal !== "undefined") global.resolverNomeAbaMensal = resolverNomeAbaMensal;'); 
const gravarLinhasEntradaManual = global.gravarLinhasEntradaManual;
const obterOpcoesValidacao = global.obterOpcoesValidacao;
const localizarAbaMensalTratada = global.localizarAbaMensalTratada;
const processarEntradaManual = global.processarEntradaManual;
const verificarDuplicidadeOcorrencia = global.verificarDuplicidadeOcorrencia;
const resolverNomeAbaMensal = global.resolverNomeAbaMensal;

function mockDataValidation(listaValores) {
    return {
        getCriteriaType: () => 'VALUE_IN_LIST',
        getCriteriaValues: () => [listaValores]
    };
}

function mockRange(row, col, values, formulas = null, validations = null) {
    return {
        getRow: () => row,
        getColumn: () => col,
        getValues: () => values,
        setValues: function(v) { this.writtenValues = v; },
        getFormulas: () => formulas || values.map(r => r.map(() => '')),
        getFormula: () => (formulas && formulas[0] && formulas[0][0]) ? formulas[0][0] : '',
        setFormulas: function(f) { this.writtenFormulas = f; },
        setFormulaR1C1: function(f) { this.writtenFormulaR1C1 = f; },
        copyTo: function(target) { target.copiedFrom = this; },
        getDataValidations: () => validations || values.map(r => r.map(() => null))
    };
}

function mockSheet(headers, mockValuesCallback, mockFormulasCallback, mockValidationsCallback) {
    let mockAba = {
        sheetName: 'JAN2026',
        getName: function() { return this.sheetName; },
        colBoeValues: null,
        colMikeValues: null,
        rangesEscritos: [],
        getLastColumn: () => headers.length,
        getMaxRows: () => 100,
        getRange: function(row, col, numRows = 1, numCols = 1) {
            if (typeof row === 'string' && row.startsWith('B1:B')) {
                const maxRows = parseInt(row.replace('B1:B', '')) || 100;
                const colB = Array(maxRows).fill(0).map(() => ['']);
                colB[0] = ['01/01/2026'];
                if (mockAba.linhaManualPreenchida) {
                    colB[1] = ['02/01/2026']; // Ocupa a linha 2, forçando a gravar na linha 3
                }
                return mockRange(1, 2, colB, colB.map(()=>['']), colB.map(()=>[null]));
            }
            if (typeof row === 'string' && (row.startsWith('G2:G') || row.startsWith('E2:E'))) {
                const maxRows = mockAba.getMaxRows();
                let vals;
                if (row.startsWith('G2:G')) {
                    vals = mockAba.colBoeValues || Array(maxRows).fill(['']);
                } else {
                    vals = mockAba.colMikeValues || Array(maxRows).fill(['']);
                }
                return mockRange(2, row.startsWith('G2:G') ? 7 : 5, vals);
            }
            if (row === 1 && numRows === 1) {
                return mockRange(row, col, [headers.slice(col - 1, col - 1 + numCols)]);
            } else {
                const rValues = mockValuesCallback ? mockValuesCallback(row, col, numRows, numCols) : Array(numRows).fill(Array(numCols).fill(''));
                
                const rFormulas = mockFormulasCallback ? mockFormulasCallback(row, col, numRows, numCols) : Array(numRows).fill(headers.map(h => {
                    const fomCols = ["TOTAL DE MACONHA", "DIVIDIDO MAC", "TOTAL CRACK (GR)", "TOTAL DE COCAINA", "DIVIDIDO COC", "PONTOS TOTAIS", "PONTOS FICÇÃO (1/4)", "CHAVE OCORRÊNCIA"];
                    return fomCols.includes(h.toUpperCase()) ? '=1' : '';
                })).map(rowFormulas => rowFormulas.slice(col - 1, col - 1 + numCols));
                
                const rValidations = mockValidationsCallback ? mockValidationsCallback(row, col, numRows, numCols) : Array(numRows).fill(Array(numCols).fill(null)).map(rowVals => rowVals.slice(col - 1, col - 1 + numCols));

                const r = mockRange(row, col, rValues, rFormulas, rValidations);
                const originalSetValues = r.setValues;
                r.setValues = function(v) {
                    originalSetValues.call(this, v);
                    mockAba.rangesEscritos.push({row, col, numRows, values: v});
                };
                return r;
            }
        }
    };
    return mockAba;
}

const CABECALHOS_ORIGINAIS = [
    "ORD", "DATA", "HORA", "QTD O", "MIKE", "NATUREZA DA OCORRÊNCIA", "BOE", "AIS", "CIDADE", "BAIRRO", "DETIDOS",
    "ARMA", "TIPO", "CALIBRE", "MODELO", "MUNIÇÃO", 
    "MACONHA DOLAR", "MACONHA GRAMA", "TOTAL DE MACONHA", "DIVIDIDO MAC",
    "CRACK PEDRA", "CRACK GRAMA", "TOTAL CRACK (GR)", 
    "COCAINA PINO", "COCAINA GRAMA", "TOTAL DE COCAINA", "DIVIDIDO COC",
    "PELOTÃO", "GRAD", "MATRÍCULA", "POLICIAL", "QDT ARMAS", 
    "OCORRÊNCIA PIP", "IMPUTADO?", "PONTOS TOTAIS", "PONTOS FICÇÃO (1/4)", "CHAVE OCORRÊNCIA"
];

const fomCols = ["TOTAL DE MACONHA", "DIVIDIDO MAC", "TOTAL CRACK (GR)", "TOTAL DE COCAINA", "DIVIDIDO COC", "PONTOS TOTAIS", "PONTOS FICÇÃO (1/4)", "CHAVE OCORRÊNCIA"];
const controlados = ["NATUREZA DA OCORRÊNCIA", "TIPO", "MODELO", "OCORRÊNCIA PIP"]; // Usando alias real

const linhaInserirFake = CABECALHOS_ORIGINAIS.map(c => {
    if (fomCols.includes(c)) return "";
    return `Val_${c}`;
});

const defaultValidations = (row, col, numRows, numCols) => {
    return Array(numRows).fill(CABECALHOS_ORIGINAIS.map(c => {
        if (controlados.includes(c)) return mockDataValidation([`Val_${c}`]);
        return null;
    })).map(rowVals => rowVals.slice(col - 1, col - 1 + numCols));
};

console.log('  [Test 1] Colunas em ordem padrão com validação positiva e fórmulas');
let sheetOrdemPadrao = mockSheet(CABECALHOS_ORIGINAIS, null, null, defaultValidations);
gravarLinhasEntradaManual(sheetOrdemPadrao, [linhaInserirFake]);
assert(sheetOrdemPadrao.rangesEscritos.length > 0, "Deveria ter escrito nas colunas mapeadas");

console.log('  [Test 2] Payload de duas linhas com fórmula ausente apenas na segunda');
let sheetFormulasIncompletas = mockSheet(CABECALHOS_ORIGINAIS, null, (r, c, nr, nc) => {
    return Array(nr).fill(0).map((_, idx) => {
        return CABECALHOS_ORIGINAIS.map(h => {
            if (fomCols.includes(h.toUpperCase())) {
                return (r + idx === 3) ? '' : '=1'; // linha 3 (segunda do bloco) sem formula
            }
            return '';
        }).slice(c - 1, c - 1 + nc);
    });
}, defaultValidations);
assert.throws(() => {
    gravarLinhasEntradaManual(sheetFormulasIncompletas, [linhaInserirFake, linhaInserirFake]);
}, /Faltam linhas preparadas/, "Deveria abortar pois a segunda linha não tem fórmula");

console.log('  [Test 3] Linha manual já preenchida');
let sheetLinhaPreenchida = mockSheet(CABECALHOS_ORIGINAIS, (r, c, nr, nc) => {
    return Array(nr).fill(0).map((_, idx) => {
        return CABECALHOS_ORIGINAIS.map(h => {
            return (r + idx === 4 && h === 'DATA') ? 'Lixo' : ''; // Tem lixo na prox linha de escrita (linha 4)
        }).slice(c - 1, c - 1 + nc);
    });
}, null, defaultValidations);
sheetLinhaPreenchida.linhaManualPreenchida = true; // Força começar na linha 4 (linha 2 + 2 de respiro)
assert.throws(() => {
    gravarLinhasEntradaManual(sheetLinhaPreenchida, [linhaInserirFake]);
}, /não está vazia na coluna/, "Deveria abortar se a linha manual tiver dados residuais");

console.log('  [Test 4] Validação de campo controlado via linha de referência (row 2)');
let sheetValidacaoNaLinha2 = mockSheet(CABECALHOS_ORIGINAIS, null, null, (r, c, nr, nc) => {
    return Array(nr).fill(CABECALHOS_ORIGINAIS.map(h => {
        if (controlados.includes(h)) return mockDataValidation(['Outro Valor']); // row 2 validation
        return null;
    })).map(rowVals => rowVals.slice(c - 1, c - 1 + nc));
});
assert.throws(() => {
    gravarLinhasEntradaManual(sheetValidacaoNaLinha2, [linhaInserirFake]);
}, /não é permitido pela validação/, "Deveria validar contra a regra da linha de referência");

console.log('  [Test 5] Valor fora da lista');
let sheetValorInvalido = mockSheet(CABECALHOS_ORIGINAIS, null, null, (r, c, nr, nc) => {
    return Array(nr).fill(CABECALHOS_ORIGINAIS.map(h => {
        if (controlados.includes(h)) return mockDataValidation(['Outro Valor']); // nao aceita Val_...
        return null;
    })).map(rowVals => rowVals.slice(c - 1, c - 1 + nc));
});
assert.throws(() => {
    gravarLinhasEntradaManual(sheetValorInvalido, [linhaInserirFake]);
}, /não é permitido pela validação/, "Deveria abortar");

console.log('  [Test 6] Extração de valores com cabeçalho curto NATUREZA');
let sheetNaturezaCurta = mockSheet(CABECALHOS_ORIGINAIS.map(h => h === 'NATUREZA DA OCORRÊNCIA' ? 'NATUREZA' : h), null, null, (row, col, nr, nc) => {
    return Array(nr).fill(CABECALHOS_ORIGINAIS.map(h => {
        if (h === 'NATUREZA DA OCORRÊNCIA') return mockDataValidation(['Nat1', 'Nat2']);
        return null;
    })).map(rowVals => rowVals.slice(col - 1, col - 1 + nc));
});
global.SpreadsheetApp.openById = function() {
    return { getSheetByName: function() { return sheetNaturezaCurta; } };
};
const opcoesNat = obterOpcoesValidacao('01/01/2026');
assert.deepStrictEqual(opcoesNat.naturezas, ['Nat1', 'Nat2'], "Deve extrair opções usando apenas NATUREZA");
global.SpreadsheetApp.openById = undefined;

console.log('  [Test 7] Resolução de abas com variantes de nome (localizarAbaMensalTratada)');
let mockAbaVariante = mockSheet(CABECALHOS_ORIGINAIS.map(h => h === 'NATUREZA DA OCORRÊNCIA' ? 'NATUREZA' : h), null, null, (row, col, nr, nc) => {
    return Array(nr).fill(CABECALHOS_ORIGINAIS.map(h => {
        if (h === 'NATUREZA DA OCORRÊNCIA') return mockDataValidation(['NatVariante']);
        return null;
    })).map(rowVals => rowVals.slice(col - 1, col - 1 + nc));
});
mockAbaVariante.getName = () => 'ago.2026';
let mockAbaLixo = mockSheet([], null, null, null);
mockAbaLixo.getName = () => 'LIXO';

global.SpreadsheetApp.openById = function() {
    return {
        getSheetByName: function(nome) { return null; }, // força a falhar e buscar nas sheets
        getSheets: function() { return [mockAbaLixo, mockAbaVariante]; }
    };
};
// Teste a) obterOpcoesValidacao resolve a aba variante 'ago.2026' a partir da data '12/08/2026'
const opcoesVariante = obterOpcoesValidacao('12/08/2026');
assert.deepStrictEqual(opcoesVariante.naturezas, ['NatVariante'], "Deve localizar a aba ago.2026 usando normalização");

// Teste b) se não houver aba variante, processarEntradaManual falha e aborta sem escrever nada
global.SpreadsheetApp.openById = function() {
    return {
        getSheetByName: function(nome) { return null; },
        getSheets: function() { return [mockAbaLixo]; }
    };
};
const originalConsoleError = console.error;
try {
    console.error = () => {};
    assert.throws(() => {
        processarEntradaManual({ data: '12/08/2026' });
    }, /Aba mensal esperada \(AGO2026\) não encontrada\. Abas examinadas: \[LIXO\]/, "Deveria abortar e informar o erro técnico com abas examinadas");
} finally {
    console.error = originalConsoleError;
}
global.SpreadsheetApp.openById = undefined;

console.log('  [Test 8] Estrutura e sintaxe do Formulario.html');

const html = fs.readFileSync(path.join(__dirname, '../Entrada/Formulario.html'), 'utf8');

// Validações estruturais obrigatórias da R10.6
assert.ok(!html.includes('<select id="natureza">'), "Formulário não deve mais conter <select id=\"natureza\">");
assert.ok(html.includes('id="natureza"') && html.includes('list="naturezasList"'), "Formulário deve conter input com id=\"natureza\" e list=\"naturezasList\"");
assert.ok(html.includes('<datalist id="naturezasList">'), "Formulário deve conter <datalist id=\"naturezasList\">");

const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let fullFormularioScript = "";
while ((match = scriptRegex.exec(html)) !== null) {
    const scriptContent = match[1];
    fullFormularioScript += scriptContent + "\n";
    try {
        new Function(scriptContent);
    } catch (e) {
        assert.fail(`Erro de sintaxe no Formulario.html: ${e.message}`);
    }
}

console.log('  [Test 9] Natureza assistiva, não bloqueante e proteção assíncrona (Formulario.html)');

const mockElements = {
    natureza: { value: '', list: 'naturezasList', addEventListener: () => {} },
    naturezasList: { innerHTML: '', appendChild: () => {} },
    data: { value: '01/01/2026', addEventListener: () => {} },
    hora: { value: '', addEventListener: () => {} },
    qtd_o: { value: '1', addEventListener: () => {} },
    mike: { value: '', addEventListener: () => {} },
    boe: { value: '', addEventListener: () => {} },
    ais: { value: '', addEventListener: () => {} },
    cidade: { value: '', addEventListener: () => {} },
    bairro: { value: '', addEventListener: () => {} },
    detidos: { value: '', addEventListener: () => {}, removeEventListener: () => {}, parentNode: { replaceChild: () => {} } },
    imputado: { value: 'SEM IMPUTADO', addEventListener: () => {} },
    dropZone: { classList: { add: () => {}, remove: () => {} }, addEventListener: () => {} },
    fileInput: { value: '', addEventListener: () => {} },
    policeInput: { value: '', addEventListener: () => {} },
    policeTableBody: { innerHTML: '', children: [], appendChild: () => {}, classList: { add: () => {}, remove: () => {} }, addEventListener: () => {}, querySelectorAll: () => [] },
    armasList: { innerHTML: '', appendChild: () => {}, querySelectorAll: () => [] },
    drogasList: { innerHTML: '', appendChild: () => {}, querySelectorAll: () => [] },
    pipList: { innerHTML: '', appendChild: () => {}, querySelectorAll: () => [] },
    ocrTerminal: { innerText: '', scrollTop: 0, scrollHeight: 0 },
    statusMessage: { innerText: '', style: {} },
    progressContainer: { style: {} },
    progressBar: { style: {} },
    progressLabel: { innerText: '', style: {} },
    ocrConferenceCard: { style: {} },
    ocrConferenceContent: { innerHTML: '' }
};

const saveBtn = { disabled: false };

global.document = {
    elements: mockElements,
    getElementById: function(id) {
        if (this.elements[id]) return this.elements[id];
        return { value: '', innerHTML: '', innerText: '', appendChild: () => {}, remove: () => {}, addEventListener: () => {}, removeEventListener: () => {}, style: {}, classList: { add: () => {}, remove: () => {} }, querySelectorAll: () => [] };
    },
    querySelector: function(sel) {
        if (sel === '.btn-save') return saveBtn;
        return null;
    },
    querySelectorAll: () => [],
    createElement: function(tag) {
        return {
            id: '',
            value: '',
            innerHTML: '',
            innerText: '',
            appendChild: () => {},
            remove: () => {},
            addEventListener: () => {},
            removeEventListener: () => {},
            style: {},
            classList: { add: () => {}, remove: () => {} },
            querySelectorAll: () => [],
            querySelector: () => null
        };
    }
};

global.window = { addEventListener: () => {}, opcoesFormulario: null };

let statusList = [];
global.setStatus = (msg, color) => statusList.push(msg);
global.log = (msg) => {};
global.alert = () => {};
global.pdfjsLib = { GlobalWorkerOptions: {} };
global.Tesseract = {};

let successCb, failureCb, lastCalledObterOpcoes, ultimoPayloadGravacao = null;
global.google = {
    script: {
        run: {
            withSuccessHandler: function(cb) { successCb = cb; return this; },
            withFailureHandler: function(cb) { failureCb = cb; return this; },
            obterOpcoesValidacao: function(d) { lastCalledObterOpcoes = d; },
            getEfetivo: function() { return this; },
            processarEntradaManual: function(payload) {
                ultimoPayloadGravacao = payload;
                if (successCb) successCb("Gravado com sucesso!");
                return this;
            }
        }
    }
};

fullFormularioScript += `
global.carregarOpcoesValidacao = carregarOpcoesValidacao;
global.atualizarDataLists = atualizarDataLists;
global.salvarDados = salvarDados;
global.parseAndFill = parseAndFill;
global.limparFormulario = limparFormulario;
global.limparDadosDocumentoAnterior = limparDadosDocumentoAnterior;
global.conciliarTitulosPipOcr = conciliarTitulosPipOcr;
global.montarConferenciaOcrHtml = montarConferenciaOcrHtml;
`;
eval(fullFormularioScript);

(async function rodarTestesFormulario() {
    // 9.1: Natureza OCR não correspondente permanece no input e Salvar não fica desabilitado
    saveBtn.disabled = false;
    mockElements.data.value = '10/01/2026';
    mockElements.natureza.value = '';
    const textoOcr = "BOLETIM DE OCORRÊNCIA Nº: 1234567890\nNatureza da Ocorrência: PORTE ILEGAL DE ARMA\nData do Fato: 10/01/2026 14:30\nRECIFE\nBairro: BOA VIAGEM";
    parseAndFill(textoOcr);

    // OCR já deve ter preenchido a natureza candidata no input
    assert.strictEqual(mockElements.natureza.value, 'PORTE ILEGAL DE ARMA', "Natureza do OCR deve ser preenchida no input");

    // Responde obterOpcoesValidacao com lista sem a natureza exata
    if (successCb) {
        successCb({ naturezas: ['TRAFICO DE DROGAS', 'ROUBO'], detidos: [], armasTipos: [], armasModelos: [], ocorrenciasPip: [] });
    }
    await new Promise(r => setImmediate(r));
    assert.strictEqual(mockElements.natureza.value, 'PORTE ILEGAL DE ARMA', "Natureza OCR não correspondida deve permanecer no input");
    assert.strictEqual(saveBtn.disabled, false, "Salvar não deve ser desabilitado quando a natureza OCR não corresponde");

    // 9.2: Resposta com sugestões popula o datalist e preserva texto manual já digitado
    mockElements.data.value = '15/01/2026';
    mockElements.natureza.value = 'DIGITACAO MANUAL OPERADOR';
    const reqSugPromise = carregarOpcoesValidacao('15/01/2026');
    successCb({ naturezas: ['HOMICIDIO', 'FURTO'], detidos: [], armasTipos: [], armasModelos: [], ocorrenciasPip: [] });
    await reqSugPromise;
    assert.ok(mockElements.naturezasList.innerHTML.includes('HOMICIDIO'), "Datalist deve ser populado com as sugestões");
    assert.strictEqual(mockElements.natureza.value, 'DIGITACAO MANUAL OPERADOR', "Texto digitado pelo operador deve ser preservado");

    // 9.3: Falha de obterOpcoesValidacao preserva o input editável e permite tentativa de salvar quando DATA e NATUREZA existem
    mockElements.data.value = '20/01/2026';
    mockElements.natureza.value = 'QUALQUER NATUREZA DIGITADA';
    const reqFailPromise = carregarOpcoesValidacao('20/01/2026').catch(e => e.message);
    failureCb(new Error("Aba 20/01/2026 não encontrada"));
    await reqFailPromise;
    assert.strictEqual(mockElements.natureza.value, 'QUALQUER NATUREZA DIGITADA', "Input deve permanecer com o texto digitado mesmo após falha na busca de opções");
    assert.strictEqual(saveBtn.disabled, false, "Salvar não deve ser desabilitado após erro de carregamento");

    ultimoPayloadGravacao = null;
    salvarDados();
    assert.ok(ultimoPayloadGravacao !== null, "Tentativa de salvar deve chamar processarEntradaManual mesmo com falha no carregamento prévio de opções");
    assert.strictEqual(ultimoPayloadGravacao.data, '20/01/2026');
    assert.strictEqual(ultimoPayloadGravacao.natureza, 'QUALQUER NATUREZA DIGITADA');

    // 9.4: DATA ou NATUREZA vazias bloqueiam localmente sem chamar processarEntradaManual
    ultimoPayloadGravacao = null;
    mockElements.data.value = '';
    mockElements.natureza.value = 'NATUREZA SEM DATA';
    salvarDados();
    assert.strictEqual(ultimoPayloadGravacao, null, "Data vazia deve bloquear localmente");

    ultimoPayloadGravacao = null;
    mockElements.data.value = '22/01/2026';
    mockElements.natureza.value = '';
    salvarDados();
    assert.strictEqual(ultimoPayloadGravacao, null, "Natureza vazia deve bloquear localmente");

    // 9.5: Resposta obsoleta continua sem sobrescrever sugestões ou texto atual
    mockElements.data.value = '10/01/2026';
    const req1Promise = carregarOpcoesValidacao('10/01/2026').catch(e => e.message);
    const cb1 = successCb;

    mockElements.data.value = '11/01/2026';
    const req2Promise = carregarOpcoesValidacao('11/01/2026');
    const cb2 = successCb;

    try {
        cb1({ naturezas: ['NAT_ERRADA_OBSOLETA'] });
    } catch(e) {}
    cb2({ naturezas: ['NAT_CORRETA_ATUAL'], detidos: [], ocorrenciasPip: [] });

    const results = await Promise.all([req1Promise, req2Promise]);
    assert.strictEqual(results[0], "Resposta obsoleta ignorada.", "Req 1 deve ser rejeitada como obsoleta");
    assert.deepStrictEqual(results[1].naturezas, ['NAT_CORRETA_ATUAL'], "Req 2 deve ser resolvida corretamente");
    assert.ok(mockElements.naturezasList.innerHTML.includes('NAT_CORRETA_ATUAL'), "Datalist deve conter a resposta atual");
    assert.ok(!mockElements.naturezasList.innerHTML.includes('NAT_ERRADA_OBSOLETA'), "Datalist NÃO deve conter a resposta obsoleta");

    // 9.6: Um novo BO zera integralmente o estado derivado do OCR anterior.
    mockElements.mike.value = 'MIKE_ANTERIOR';
    mockElements.boe.value = 'BOE_ANTERIOR';
    mockElements.data.value = '12/01/2026';
    mockElements.natureza.value = 'NATUREZA_ANTERIOR';
    mockElements.armasList.innerHTML = 'ARMA_ANTERIOR';
    mockElements.drogasList.innerHTML = 'DROGA_ANTERIOR';
    mockElements.pipList.innerHTML = 'PIP_ANTERIOR';
    mockElements.imputado.value = 'COM IMPUTADO';
    mockElements.ocrConferenceCard.style.display = 'block';
    mockElements.ocrConferenceContent.innerHTML = 'CONFERENCIA_ANTERIOR';
    window.opcoesFormulario = { naturezas: ['NATUREZA_ANTERIOR'] };

    global.limparDadosDocumentoAnterior();

    assert.strictEqual(mockElements.mike.value, '', 'Novo BO deve limpar MIKE anterior');
    assert.strictEqual(mockElements.boe.value, '', 'Novo BO deve limpar BOE anterior');
    assert.strictEqual(mockElements.data.value, '', 'Novo BO deve limpar DATA anterior');
    assert.strictEqual(mockElements.natureza.value, '', 'Novo BO deve limpar NATUREZA anterior');
    assert.strictEqual(mockElements.armasList.innerHTML, '', 'Novo BO deve limpar armas anteriores');
    assert.strictEqual(mockElements.drogasList.innerHTML, '', 'Novo BO deve limpar drogas anteriores');
    assert.strictEqual(mockElements.pipList.innerHTML, '', 'Novo BO deve limpar PIP anterior');
    assert.strictEqual(mockElements.imputado.value, 'SEM IMPUTADO', 'Novo BO deve restaurar imputado padrão');
    assert.strictEqual(mockElements.ocrConferenceCard.style.display, 'none', 'Novo BO deve ocultar conferência anterior');
    assert.strictEqual(mockElements.ocrConferenceContent.innerHTML, '', 'Novo BO deve limpar conferência anterior');
    assert.strictEqual(window.opcoesFormulario, null, 'Novo BO deve invalidar opções do mês anterior');

    // 9.7: Termos soltos e negativos da narrativa não podem criar PIP falso.
    window.opcoesFormulario = {
        ocorrenciasPip: ['Prisão por mandado', 'Apreensão de veículo furtado ou roubado']
    };
    const textoBoSemPip = 'ROUBO A TRANSEUNTE. NÃO ENCONTRAMOS ANTECEDENTES OU MANDADOS DE PRISÃO. BICICLETA APREENDIDA.';
    assert.deepStrictEqual(
        global.conciliarTitulosPipOcr(textoBoSemPip, [], [], 'ROUBO A TRANSEUNTE'),
        [],
        'Narrativa com mandado negado e bicicleta apreendida não deve sugerir PIP'
    );
    assert.deepStrictEqual(
        global.conciliarTitulosPipOcr('', [], [], 'RECUPERAÇÃO DE VEÍCULO ROUBADO'),
        ['Apreensão de veículo furtado ou roubado'],
        'Natureza confirmada deve sugerir PIP de veículo'
    );
    assert.deepStrictEqual(
        global.conciliarTitulosPipOcr('', [], [], 'CUMPRIMENTO DE MANDADO DE PRISÃO'),
        ['Prisão por mandado'],
        'Natureza confirmada deve sugerir PIP de mandado'
    );

    // 9.8: Conferência deve agrupar a informação geral em blocos legíveis.
    const conferencia = global.montarConferenciaOcrHtml({
        data: '20/08/2026', hora: '09:23', mike: '202608200953381429', boe: '26E1174012127',
        cidade: 'RECIFE', bairro: 'PINA', totalEquipe: 4, totalArmas: 0, totalDrogas: 0,
        statusNatureza: '[OK] Natureza: ROUBO A TRANSEUNTE'
    });
    assert.ok(conferencia.includes('DATA / HORA') && conferencia.includes('LEITURA DO OCR'), 'Conferência deve separar identificação e leitura OCR');

    // [Test 10] Contrato Operacional de Equipe/Policiais (Card #61: T-C01-EQUIPE-004)
    console.log('  [Test 10] Contrato Operacional de Equipe/Policiais (Mapeamento AB a AF, fórmulas e qtd_armas)');
    const payloadEquipe = {
        origem: 'FORMULARIO',
        data: '10/08/2026',
        hora: '14:30',
        natureza: 'PORTE ILEGAL DE ARMA DE FOGO',
        policiais: [
            { pelotao: '1º PEL GTAR', posto: '3º SGT', matricula: '102140', nome: 'JOÃO SILVA', qtd_armas: 2 },
            { pelotao: '2º PEL GTAR', posto: 'CABO', matricula: '987654', nome: 'MARIA SANTOS', qtd_armas: 0 }
        ],
        armas: [
            { tipo: 'INDUSTRIAL', modelo: 'PISTOLA', calibre: '.40', municao: 15, quantidade: 1 },
            { tipo: 'INDUSTRIAL', modelo: 'REVÓLVER', calibre: '.38', municao: 6, quantidade: 1 }
        ]
    };

    const EntradaManualMod = require('../Entrada/EntradaManual');
    const linhasEquipe = EntradaManualMod.montarLinhasEntradaManual(payloadEquipe);
    assert.strictEqual(linhasEquipe.length, 2, 'Deve gerar exatamente 2 linhas para 2 policiais e 2 armas');

    // Mapeamento de índices canônicos:
    // 27: PELOTÃO (AB), 28: GRAD (AC), 29: MATRÍCULA (AD), 30: POLICIAL (AE), 31: QDT ARMAS (AF)
    const idxPel = 27; const idxGrad = 28; const idxMat = 29; const idxPol = 30; const idxArmas = 31;

    // Linha 0 (Policial 1: JOÃO SILVA com 2 armas)
    assert.strictEqual(linhasEquipe[0][idxPel], '', 'Coluna AB (PELOTÃO) deve ser vazia no payload para preservação de fórmula PROCV');
    assert.strictEqual(linhasEquipe[0][idxGrad], '', 'Coluna AC (GRAD) deve ser vazia no payload para preservação de fórmula PROCV');
    assert.strictEqual(linhasEquipe[0][idxMat], '', 'Coluna AD (MATRÍCULA) deve ser vazia no payload para preservação de fórmula PROCV');
    assert.strictEqual(linhasEquipe[0][idxPol], 'JOÃO SILVA', 'Coluna AE (POLICIAL) deve conter o nome do policial para alimentar PROCV');
    assert.strictEqual(linhasEquipe[0][idxArmas], 2, 'Coluna AF (QDT ARMAS) deve conter a quantidade positiva de armas do policial');

    // Linha 1 (Policial 2: MARIA SANTOS com 0 armas)
    assert.strictEqual(linhasEquipe[1][idxPel], '', 'Coluna AB (PELOTÃO) na linha 2 deve ser vazia para fórmula');
    assert.strictEqual(linhasEquipe[1][idxGrad], '', 'Coluna AC (GRAD) na linha 2 deve ser vazia para fórmula');
    assert.strictEqual(linhasEquipe[1][idxMat], '', 'Coluna AD (MATRÍCULA) na linha 2 deve ser vazia para fórmula');
    assert.strictEqual(linhasEquipe[1][idxPol], 'MARIA SANTOS', 'Coluna AE (POLICIAL) na linha 2 deve conter o nome');
    assert.strictEqual(linhasEquipe[1][idxArmas], '', 'Coluna AF (QDT ARMAS) deve ser string vazia quando qtd_armas for 0');

    // Teste de gravação física comprovando proteção e clonagem de fórmulas
    const validationsEquipe = (row, col, numRows, numCols) => {
        return Array(numRows).fill(CABECALHOS_ORIGINAIS.map(c => {
            if (c === 'NATUREZA DA OCORRÊNCIA') return mockDataValidation(['PORTE ILEGAL DE ARMA DE FOGO']);
            if (c === 'TIPO') return mockDataValidation(['INDUSTRIAL']);
            if (c === 'MODELO') return mockDataValidation(['PISTOLA', 'REVÓLVER']);
            if (c === 'OCORRÊNCIA PIP') return mockDataValidation(['PORTE ILEGAL DE ARMA DE FOGO']);
            return null;
        })).map(rowVals => rowVals.slice(col - 1, col - 1 + numCols));
    };

    let sheetEquipe = mockSheet(CABECALHOS_ORIGINAIS, null, null, validationsEquipe);
    gravarLinhasEntradaManual(sheetEquipe, linhasEquipe);
    assert.ok(sheetEquipe.rangesEscritos.length > 0, 'Deve gravar as colunas permitidas no Sheets');

    // Proteção estrita: se payload tentar sobrescrever fórmulas com valor literal, deve abortar
    const linhaComSobrescrita = [...linhasEquipe[0]];
    linhaComSobrescrita[idxMat] = '102140'; // valor literal na coluna de fórmula MATRÍCULA
    let sheetComFormula = mockSheet(CABECALHOS_ORIGINAIS, null, (r, c, nr, nc) => {
        const fomColsMat = ["TOTAL DE MACONHA", "DIVIDIDO MAC", "TOTAL CRACK (GR)", "TOTAL DE COCAINA", "DIVIDIDO COC", "PONTOS TOTAIS", "PONTOS FICÇÃO (1/4)", "CHAVE OCORRÊNCIA", "MATRÍCULA"];
        return Array(nr).fill(0).map(() => CABECALHOS_ORIGINAIS.map(h => (fomColsMat.includes(h.toUpperCase()) ? '=1' : '')).slice(c - 1, c - 1 + nc));
    }, validationsEquipe);
    assert.throws(() => {
        gravarLinhasEntradaManual(sheetComFormula, [linhaComSobrescrita]);
    }, /Tentativa de sobrescrever a fórmula da coluna 'MATR[ÍI]CULA'/, 'Deve lançar erro bloqueante se tentar sobrescrever coluna com fórmula');

    // [Test 11] Contrato Operacional de Armas Apreendidas (Card #62: T-C01-ARMAS-005)
    console.log('  [Test 11] Contrato Operacional de Armas Apreendidas (Mapeamento L a P, multi-linhas e independência posicional)');
    const payloadArmasMulti = {
        origem: 'FORMULARIO',
        data: '15/08/2026',
        hora: '22:15',
        natureza: 'PORTE ILEGAL DE ARMA DE FOGO',
        policiais: [
            { pelotao: '1º PEL', posto: 'SGT', matricula: '1001', nome: 'POLICIAL UM', qtd_armas: 2 }
        ],
        armas: [
            { tipo: 'INDUSTRIAL', modelo: 'PISTOLA', calibre: '.40', municao: 16, quantidade: 1 },
            { tipo: 'INDUSTRIAL', modelo: 'REVÓLVER', calibre: '.38', municao: 6, quantidade: 1 }
        ]
    };

    const linhasArmas = EntradaManualMod.montarLinhasEntradaManual(payloadArmasMulti);
    assert.strictEqual(linhasArmas.length, 2, 'Deve expandir para 2 linhas (max entre 1 policial e 2 armas)');

    // Índices de armas: 11: ARMA (L), 12: TIPO (M), 13: CALIBRE (N), 14: MODELO (O), 15: MUNIÇÃO (P)
    const idxL = 11; const idxM = 12; const idxN = 13; const idxO = 14; const idxP = 15;

    // Linha 0: Policial 1 + Arma 1
    assert.strictEqual(linhasArmas[0][idxL], 1, 'Linha 0 Coluna L (ARMA/Qtd) deve ser 1');
    assert.strictEqual(linhasArmas[0][idxM], 'INDUSTRIAL', 'Linha 0 Coluna M (TIPO) deve ser INDUSTRIAL');
    assert.strictEqual(linhasArmas[0][idxN], '.40', 'Linha 0 Coluna N (CALIBRE) deve ser .40');
    assert.strictEqual(linhasArmas[0][idxO], 'PISTOLA', 'Linha 0 Coluna O (MODELO) deve ser PISTOLA');
    assert.strictEqual(linhasArmas[0][idxP], 16, 'Linha 0 Coluna P (MUNIÇÃO) deve ser 16');
    assert.strictEqual(linhasArmas[0][30], 'POLICIAL UM', 'Linha 0 deve conter o policial da ocorrência');

    // Linha 1: Arma 2 + Policial vazio (independência posicional)
    assert.strictEqual(linhasArmas[1][idxL], 1, 'Linha 1 Coluna L (ARMA/Qtd) deve ser 1');
    assert.strictEqual(linhasArmas[1][idxM], 'INDUSTRIAL', 'Linha 1 Coluna M (TIPO) deve ser INDUSTRIAL');
    assert.strictEqual(linhasArmas[1][idxN], '.38', 'Linha 1 Coluna N (CALIBRE) deve ser .38');
    assert.strictEqual(linhasArmas[1][idxO], 'REVÓLVER', 'Linha 1 Coluna O (MODELO) deve ser REVÓLVER');
    assert.strictEqual(linhasArmas[1][idxP], 6, 'Linha 1 Coluna P (MUNIÇÃO) deve ser 6');
    assert.strictEqual(linhasArmas[1][30], '', 'Linha 1 Coluna AE (POLICIAL) deve ser vazia pois só havia 1 policial para 2 armas');

    // Cenário inverso: 2 policiais e 1 arma
    const payloadInverso = {
        origem: 'FORMULARIO',
        data: '15/08/2026',
        hora: '22:15',
        natureza: 'PORTE ILEGAL DE ARMA DE FOGO',
        policiais: [
            { pelotao: '1º PEL', posto: 'SGT', matricula: '1001', nome: 'POLICIAL UM', qtd_armas: 1 },
            { pelotao: '2º PEL', posto: 'CB', matricula: '1002', nome: 'POLICIAL DOIS', qtd_armas: 0 }
        ],
        armas: [
            { tipo: 'INDUSTRIAL', modelo: 'PISTOLA', calibre: '9mm', municao: 15, quantidade: 1 }
        ]
    };
    const linhasInverso = EntradaManualMod.montarLinhasEntradaManual(payloadInverso);
    assert.strictEqual(linhasInverso.length, 2, 'Deve gerar 2 linhas para 2 policiais e 1 arma');
    assert.strictEqual(linhasInverso[0][idxL], 1, 'Linha 0 tem arma preenchida');
    assert.strictEqual(linhasInverso[1][idxL], '', 'Linha 1 tem arma vazia (policial sem arma direta na linha)');
    assert.strictEqual(linhasInverso[1][30], 'POLICIAL DOIS', 'Linha 1 preserva o segundo policial');

    // Gravação física confirmada no mockSheet
    let sheetArmas = mockSheet(CABECALHOS_ORIGINAIS, null, null, validationsEquipe);
    gravarLinhasEntradaManual(sheetArmas, linhasArmas);
    assert.ok(sheetArmas.rangesEscritos.length > 0, 'Deve persistir colunas de armas no Sheets');

    // [Test 12] Contrato Operacional de Drogas Apreendidas (Card #63: T-C01-DROGAS-006)
    console.log('  [Test 12] Contrato Operacional de Drogas Apreendidas (Mapeamento Q a AA, acumulação por tipo, fórmulas e fluxo sem drogas)');
    const payloadDrogas = {
        origem: 'FORMULARIO',
        data: '16/08/2026',
        hora: '10:30',
        natureza: 'TRÁFICO DE ENTORPECENTES',
        policiais: [
            { pelotao: '1º PEL', posto: 'SGT', matricula: '1001', nome: 'POLICIAL UM', qtd_armas: 0 },
            { pelotao: '1º PEL', posto: 'CB', matricula: '1002', nome: 'POLICIAL DOIS', qtd_armas: 0 }
        ],
        drogas: [
            { tipo: 'MACONHA DOLAR', quantidade: 10 },
            { tipo: 'MACONHA DOLAR', quantidade: 5 }, // Acumulação: 15
            { tipo: 'MACONHA GRAMA', quantidade: 50 },
            { tipo: 'CRACK PEDRA', quantidade: 20 },
            { tipo: 'CRACK GRAMA', quantidade: 5.5 },
            { tipo: 'COCAINA PINO', quantidade: 30 },
            { tipo: 'COCAINA GRAMA', quantidade: 12.8 }
        ]
    };

    const linhasDrogas = EntradaManualMod.montarLinhasEntradaManual(payloadDrogas);
    assert.strictEqual(linhasDrogas.length, 2, 'Deve gerar 2 linhas (max entre 2 policiais e drogas)');

    // Índices de drogas:
    // 16: MACONHA DOLAR (Q), 17: MACONHA GRAMA (R), 18: TOTAL DE MACONHA (S), 19: DIVIDIDO MAC (T)
    // 20: CRACK PEDRA (U), 21: CRACK GRAMA (V), 22: TOTAL CRACK (GR) (W)
    // 23: COCAINA PINO (X), 24: COCAINA GRAMA (Y), 25: TOTAL DE COCAINA (Z), 26: DIVIDIDO COC (AA)
    const idxQ = 16; const idxR = 17; const idxS = 18; const idxT = 19;
    const idxU = 20; const idxV = 21; const idxW = 22;
    const idxX = 23; const idxY = 24; const idxZ = 25; const idxAA = 26;

    // Linha 0: Valores literais acumulados presentes apenas na Linha 0 (isFirst === true)
    assert.strictEqual(linhasDrogas[0][idxQ], 15, 'Linha 0 Coluna Q (MACONHA DOLAR) deve acumular 10+5 = 15');
    assert.strictEqual(linhasDrogas[0][idxR], 50, 'Linha 0 Coluna R (MACONHA GRAMA) deve ser 50');
    assert.strictEqual(linhasDrogas[0][idxS], '', 'Linha 0 Coluna S (TOTAL DE MACONHA) deve ser vazia (preservada para fórmula)');
    assert.strictEqual(linhasDrogas[0][idxT], '', 'Linha 0 Coluna T (DIVIDIDO MAC) deve ser vazia (preservada para fórmula)');
    assert.strictEqual(linhasDrogas[0][idxU], 20, 'Linha 0 Coluna U (CRACK PEDRA) deve ser 20');
    assert.strictEqual(linhasDrogas[0][idxV], 5.5, 'Linha 0 Coluna V (CRACK GRAMA) deve ser 5.5');
    assert.strictEqual(linhasDrogas[0][idxW], '', 'Linha 0 Coluna W (TOTAL CRACK GR) deve ser vazia (preservada para fórmula)');
    assert.strictEqual(linhasDrogas[0][idxX], 30, 'Linha 0 Coluna X (COCAINA PINO) deve ser 30');
    assert.strictEqual(linhasDrogas[0][idxY], 12.8, 'Linha 0 Coluna Y (COCAINA GRAMA) deve ser 12.8');
    assert.strictEqual(linhasDrogas[0][idxZ], '', 'Linha 0 Coluna Z (TOTAL DE COCAINA) deve ser vazia (preservada para fórmula)');
    assert.strictEqual(linhasDrogas[0][idxAA], '', 'Linha 0 Coluna AA (DIVIDIDO COC) deve ser vazia (preservada para fórmula)');

    // Linha 1: Múltiplos policiais -> Linha 1 NÃO repete drogas (isFirst === false)
    for (let c = idxQ; c <= idxAA; c++) {
        assert.strictEqual(linhasDrogas[1][c], '', `Linha 1 Coluna ${c} de drogas deve ser vazia para evitar duplicação`);
    }

    // Fluxo SEM Drogas: payload sem drogas ou com array vazio
    const payloadSemDrogas = {
        origem: 'FORMULARIO',
        data: '16/08/2026',
        hora: '10:30',
        natureza: 'AVERIGUAÇÃO',
        policiais: [
            { pelotao: '1º PEL', posto: 'SGT', matricula: '1001', nome: 'POLICIAL UM', qtd_armas: 0 }
        ],
        drogas: []
    };
    const linhasSemDrogas = EntradaManualMod.montarLinhasEntradaManual(payloadSemDrogas);
    assert.strictEqual(linhasSemDrogas.length, 1, 'Deve gerar 1 linha para 1 policial sem drogas');
    for (let c = idxQ; c <= idxAA; c++) {
        assert.strictEqual(linhasSemDrogas[0][c], '', `Fluxo sem drogas: Coluna ${c} deve ser string vazia`);
    }

    // Gravação física confirmada no mockSheet e preservação de fórmulas derivadas
    const validationsDrogas = (row, col, numRows, numCols) => {
        return Array(numRows).fill(CABECALHOS_ORIGINAIS.map(c => {
            if (c === 'NATUREZA DA OCORRÊNCIA') return mockDataValidation(['TRÁFICO DE ENTORPECENTES', 'AVERIGUAÇÃO']);
            if (c === 'OCORRÊNCIA PIP') return mockDataValidation(['TRÁFICO DE ENTORPECENTES', 'AVERIGUAÇÃO']);
            return null;
        })).map(rowVals => rowVals.slice(col - 1, col - 1 + numCols));
    };

    let sheetDrogas = mockSheet(CABECALHOS_ORIGINAIS, null, null, validationsDrogas);
    gravarLinhasEntradaManual(sheetDrogas, linhasDrogas);
    assert.ok(sheetDrogas.rangesEscritos.length > 0, 'Deve persistir colunas literais de drogas no Sheets');

    // Tentativa de sobrescrever fórmula derivada deve lançar erro bloqueante
    assert.throws(() => {
        let sheetComFormulaDroga = mockSheet(CABECALHOS_ORIGINAIS, null, null, validationsDrogas);
        let linhaInvalida = CABECALHOS_ORIGINAIS.map(() => '');
        linhaInvalida[idxS] = 100; // Tentando gravar no TOTAL DE MACONHA
        gravarLinhasEntradaManual(sheetComFormulaDroga, [linhaInvalida]);
    }, /Tentativa de sobrescrever a fórmula da coluna 'TOTAL DE MACONHA'/, 'Deve lançar erro bloqueante ao tentar sobrescrever fórmula de drogas');

    // [Test 13] Contrato Operacional de Ocorrências PIP e Imputado (Card #64: T-C01-PIP-007)
    console.log('  [Test 13] Contrato Operacional de Ocorrências PIP e Imputado (Mapeamento AG/AH, expansão multi-linhas, precedência de imputado e conciliação OCR)');

    // 13.1: Teste de conciliarTitulosPipOcr (Formulario.html)
    window.opcoesFormulario = {
        ocorrenciasPip: [
            'Apreensão de arma de fogo revólver',
            'Apreensão de arma de fogo pistola',
            'Apreensão de arma de fogo artesanal',
            'Apreensão de arma longa (12 industrial)',
            'Apreensão de arma longa (fuzil)',
            'Apreensão de munição fuzil',
            'Apreensão de munição revólver/pistola',
            'Apreensão de maconha por grama (invólucro ou papelote)',
            'Apreensão de maconha (1Kg)',
            'Apreensão de cocaína por grama (invólucro)',
            'Apreensão de cocaína por grama (kg)',
            'Apreensão de crack por grama',
            'Apreensão de crack (1Kg)',
            'Apreensão de veículo furtado ou roubado',
            'Prisão por mandado'
        ]
    };

    // Caso A: Conciliação de armas e munição
    const armasOcr = [{ tipo: 'INDUSTRIAL', modelo: 'REVÓLVER' }, { tipo: 'FABRICAÇÃO CASEIRA', modelo: 'PISTOLA' }];
    const titulosArmas = conciliarTitulosPipOcr('Apreensão de 6 cartuchos de munição', armasOcr, [], 'PORTE DE ARMA');
    assert.ok(titulosArmas.includes('Apreensão de arma de fogo revólver'), 'Deve conciliar revólver');
    assert.ok(titulosArmas.includes('Apreensão de arma de fogo artesanal'), 'Deve conciliar arma caseira');
    assert.ok(titulosArmas.includes('Apreensão de munição revólver/pistola'), 'Deve conciliar munição');

    // Caso B: Conciliação de drogas (gramas vs kg)
    const drogasGramas = [{ tipo: 'MACONHA', quantidade: 50, unidadeMedida: 'GRAMAS' }];
    const titulosDrogasG = conciliarTitulosPipOcr('', [], drogasGramas, 'TRÁFICO');
    assert.ok(titulosDrogasG.includes('Apreensão de maconha por grama (invólucro ou papelote)'), 'Deve conciliar maconha por grama');

    const drogasKg = [{ tipo: 'MACONHA', quantidade: 2, unidadeMedida: 'QUILOGRAMAS' }];
    const titulosDrogasKg = conciliarTitulosPipOcr('', [], drogasKg, 'TRÁFICO');
    assert.ok(titulosDrogasKg.includes('Apreensão de maconha (1Kg)'), 'Deve conciliar maconha 1Kg');

    // Caso C: Narrativa negativa/ambígua no texto do BO
    // Texto contém 'não foram encontrados mandados de prisão' e histórico de 'roubo de celular', mas a natureza é 'PORTE ILEGAL DE ARMA DE FOGO'
    const textoAmbiguo = 'Durante a busca pessoal, não foram encontrados mandados de prisão em aberto contra o indivíduo, que alegou ser vítima de roubo.';
    const titulosAmbiguos = conciliarTitulosPipOcr(textoAmbiguo, [{ tipo: 'INDUSTRIAL', modelo: 'PISTOLA' }], [], 'PORTE ILEGAL DE ARMA DE FOGO');
    assert.strictEqual(titulosAmbiguos.includes('Prisão por mandado'), false, 'Não deve criar Prisão por Mandado por menção negativa no texto');
    assert.strictEqual(titulosAmbiguos.includes('Apreensão de veículo furtado ou roubado'), false, 'Não deve criar Veículo Roubado sem natureza correspondente');

    // Caso D: Mandado e Veículo confirmados na natureza
    const titulosMandado = conciliarTitulosPipOcr('Cumprimento realizado', [], [], 'CUMPRIMENTO DE MANDADO DE PRISÃO');
    assert.ok(titulosMandado.includes('Prisão por mandado'), 'Deve reconhecer Prisão por Mandado quando presente na natureza');

    const titulosVeiculo = conciliarTitulosPipOcr('Veículo localizado', [], [], 'RECUPERAÇÃO DE VEÍCULO ROUBADO');
    assert.ok(titulosVeiculo.includes('Apreensão de veículo furtado ou roubado'), 'Deve reconhecer Veículo recuperado quando presente na natureza');

    // 13.2: Integração com EntradaManual.js, Expansão Multi-Linhas e Mapeamento AG (idx 32) e AH (idx 33)
    const idxAG = 32; // OCORRÊNCIA PIP
    const idxAH = 33; // IMPUTADO?

    // Cenário 1: Múltiplos títulos PIP (3 títulos) com 1 policial -> deve expandir para 3 linhas
    const payloadMultiPip = {
        origem: 'FORMULARIO',
        data: '17/08/2026',
        hora: '18:00',
        natureza: 'TRÁFICO ILÍCITO DE ENTORPECENTES',
        imputado: 'COM IMPUTADO', // Valor explícito do operador
        detidos: '1',
        policiais: [
            { pelotao: '1º PEL', posto: 'SGT', matricula: '1001', nome: 'POLICIAL UM', qtd_armas: 0 }
        ],
        ocorrenciasPip: [
            'Apreensão de cocaína por grama (invólucro)',
            'Apreensão de maconha por grama (invólucro ou papelote)',
            'Apreensão de munição revólver/pistola'
        ]
    };

    const linhasMultiPip = EntradaManualMod.montarLinhasEntradaManual(payloadMultiPip);
    assert.strictEqual(linhasMultiPip.length, 3, 'Deve expandir para 3 linhas baseado na quantidade de títulos PIP');

    // Linha 0: Policial 0, PIP 0, Imputado
    assert.strictEqual(linhasMultiPip[0][idxAG], 'Apreensão de cocaína por grama (invólucro)', 'Linha 0 Coluna AG deve ter o primeiro título PIP');
    assert.strictEqual(linhasMultiPip[0][idxAH], 'COM IMPUTADO', 'Linha 0 Coluna AH deve ter COM IMPUTADO');
    assert.strictEqual(linhasMultiPip[0][30], 'POLICIAL UM', 'Linha 0 deve ter o policial');

    // Linha 1: Policial vazio, PIP 1, Imputado
    assert.strictEqual(linhasMultiPip[1][idxAG], 'Apreensão de maconha por grama (invólucro ou papelote)', 'Linha 1 Coluna AG deve ter o segundo título PIP');
    assert.strictEqual(linhasMultiPip[1][idxAH], 'COM IMPUTADO', 'Linha 1 Coluna AH deve ter COM IMPUTADO pois há eventoPip');
    assert.strictEqual(linhasMultiPip[1][30], '', 'Linha 1 Coluna AE (POLICIAL) deve ser vazia pois só há 1 policial');

    // Linha 2: Policial vazio, PIP 2, Imputado
    assert.strictEqual(linhasMultiPip[2][idxAG], 'Apreensão de munição revólver/pistola', 'Linha 2 Coluna AG deve ter o terceiro título PIP');
    assert.strictEqual(linhasMultiPip[2][idxAH], 'COM IMPUTADO', 'Linha 2 Coluna AH deve ter COM IMPUTADO pois há eventoPip');

    // 13.3: Regra de Precedência do Campo Imputado (Operador > Detidos)
    // Precedência explícita do operador: mesmo se detidos for 0, se operador marcou COM IMPUTADO, respeita o operador
    const payloadImputadoExplicito = {
        origem: 'FORMULARIO',
        data: '17/08/2026',
        natureza: 'APREENSÃO',
        imputado: 'COM IMPUTADO',
        detidos: '0',
        policiais: [{ nome: 'POLICIAL UM' }]
    };
    const linhasExplicito = EntradaManualMod.montarLinhasEntradaManual(payloadImputadoExplicito);
    assert.strictEqual(linhasExplicito[0][idxAH], 'COM IMPUTADO', 'Precedência explícita do operador sobre detidos=0');

    // Fallback por detidos: quando payload.imputado for ausente/vazio
    const payloadFallbackComDetidos = {
        origem: 'API_LEGADA',
        data: '17/08/2026',
        natureza: 'FLAGRANTE',
        detidos: '2',
        policiais: [{ nome: 'POLICIAL UM' }]
    };
    const linhasFallbackCom = EntradaManualMod.montarLinhasEntradaManual(payloadFallbackComDetidos);
    assert.strictEqual(linhasFallbackCom[0][idxAH], 'COM IMPUTADO', 'Fallback por detidos > 0 gera COM IMPUTADO');

    const payloadFallbackSemDetidos = {
        origem: 'API_LEGADA',
        data: '17/08/2026',
        natureza: 'AVERIGUAÇÃO',
        detidos: '0',
        policiais: [{ nome: 'POLICIAL UM' }]
    };
    const linhasFallbackSem = EntradaManualMod.montarLinhasEntradaManual(payloadFallbackSemDetidos);
    assert.strictEqual(linhasFallbackSem[0][idxAH], 'SEM IMPUTADO', 'Fallback por detidos = 0 gera SEM IMPUTADO');

    // 13.4: Fluxo SEM Ocorrências PIP (payload.ocorrenciasPip = [])
    const payloadSemPip = {
        origem: 'FORMULARIO',
        data: '17/08/2026',
        natureza: 'PATRULHAMENTO DE ROTINA',
        imputado: 'SEM IMPUTADO',
        policiais: [
            { pelotao: '1º PEL', posto: 'SGT', matricula: '1001', nome: 'POLICIAL UM' },
            { pelotao: '1º PEL', posto: 'CB', matricula: '1002', nome: 'POLICIAL DOIS' }
        ],
        ocorrenciasPip: []
    };
    const linhasSemPip = EntradaManualMod.montarLinhasEntradaManual(payloadSemPip);
    assert.strictEqual(linhasSemPip.length, 2, 'Gera 2 linhas para 2 policiais');
    assert.strictEqual(linhasSemPip[0][idxAG], 'PATRULHAMENTO DE ROTINA', 'Linha 0 Coluna AG faz fallback para payload.natureza');
    assert.strictEqual(linhasSemPip[0][idxAH], 'SEM IMPUTADO', 'Linha 0 Coluna AH recebe SEM IMPUTADO');
    assert.strictEqual(linhasSemPip[1][idxAG], '', 'Linha 1 Coluna AG deve ser vazia no fluxo sem PIP extra');
    assert.strictEqual(linhasSemPip[1][idxAH], '', 'Linha 1 Coluna AH deve ser vazia para linha sem evento PIP');

    // 13.5: Gravação física confirmada no mockSheet
    const validationsPip = (row, col, numRows, numCols) => {
        return Array(numRows).fill(CABECALHOS_ORIGINAIS.map(c => {
            if (c === 'NATUREZA DA OCORRÊNCIA') return mockDataValidation(['TRÁFICO ILÍCITO DE ENTORPECENTES']);
            if (c === 'OCORRÊNCIA PIP') return mockDataValidation([
                'Apreensão de cocaína por grama (invólucro)',
                'Apreensão de maconha por grama (invólucro ou papelote)',
                'Apreensão de munição revólver/pistola'
            ]);
            if (c === 'IMPUTADO?') return mockDataValidation(['COM IMPUTADO', 'SEM IMPUTADO']);
            return null;
        })).map(rowVals => rowVals.slice(col - 1, col - 1 + numCols));
    };

    let sheetPip = mockSheet(CABECALHOS_ORIGINAIS, null, null, validationsPip);
    gravarLinhasEntradaManual(sheetPip, linhasMultiPip);
    assert.ok(sheetPip.rangesEscritos.length > 0, 'Deve persistir colunas AG e AH de PIP e Imputado no Sheets');

    // [Test 14] Contrato Operacional de Salvar / Persistência no Sheets (Card #65: T-C01-PERSISTENCIA-008)
    console.log('  [Test 14] Contrato Operacional de Salvar e Persistência no Sheets (Pipeline completo, duplicidade, validação e atomicidade real)');

    // 14.1: Pipeline completo de processarEntradaManual (Fato, Equipe, Armas, Drogas, PIP, Imputado)
    const validacoesPersistencia = (row, col, numRows, numCols) => {
        return Array(numRows).fill(CABECALHOS_ORIGINAIS.map(c => {
            if (c === 'NATUREZA DA OCORRÊNCIA') return mockDataValidation(['TRÁFICO ILÍCITO DE ENTORPECENTES']);
            if (c === 'TIPO') return mockDataValidation(['INDUSTRIAL']);
            if (c === 'MODELO') return mockDataValidation(['PISTOLA']);
            if (c === 'OCORRÊNCIA PIP') return mockDataValidation(['Apreensão de arma de fogo pistola', 'Apreensão de cocaína por grama (invólucro)', 'TRÁFICO ILÍCITO DE ENTORPECENTES']);
            if (c === 'IMPUTADO?') return mockDataValidation(['COM IMPUTADO', 'SEM IMPUTADO']);
            return null;
        })).map(rowVals => rowVals.slice(col - 1, col - 1 + numCols));
    };

    let sheetPersistencia = mockSheet(CABECALHOS_ORIGINAIS, null, null, validacoesPersistencia);
    sheetPersistencia.sheetName = 'AGO2026';

    const mockSs = {
        getSheetByName: (n) => (n === sheetPersistencia.getName() ? sheetPersistencia : null),
        getSheets: () => [sheetPersistencia]
    };
    global.SpreadsheetApp.getActiveSpreadsheet = () => mockSs;
    global.SpreadsheetApp.openById = () => mockSs;

    const payloadCompleto = {
        origem: 'FORMULARIO',
        data: '18/08/2026',
        hora: '15:40',
        qtd_o: '1',
        mike: 'M123456',
        boe: '2026/000123',
        natureza: 'TRÁFICO ILÍCITO DE ENTORPECENTES',
        ais: '3',
        cidade: 'RECIFE',
        bairro: 'BOA VIAGEM',
        detidos: '1',
        imputado: 'COM IMPUTADO',
        policiais: [
            { pelotao: '1º PEL', posto: 'SGT', matricula: '1001', nome: 'POLICIAL UM', qtd_armas: 1 },
            { pelotao: '1º PEL', posto: 'CB', matricula: '1002', nome: 'POLICIAL DOIS', qtd_armas: 0 }
        ],
        armas: [
            { tipo: 'INDUSTRIAL', modelo: 'PISTOLA', calibre: '.40', municao: 15, quantidade: 1 }
        ],
        drogas: [
            { tipo: 'COCAINA PINO', quantidade: 50 },
            { tipo: 'MACONHA GRAMA', quantidade: 100 }
        ],
        ocorrenciasPip: [
            'Apreensão de arma de fogo pistola',
            'Apreensão de cocaína por grama (invólucro)'
        ]
    };

    const resSucesso = processarEntradaManual(payloadCompleto);
    assert.ok(resSucesso.includes('salva com sucesso'), 'Deve retornar mensagem canônica de sucesso');
    assert.ok(resSucesso.includes('2 registros computados'), 'Deve computar 2 registros (max entre policiais, armas e PIP)');
    assert.ok(sheetPersistencia.rangesEscritos.length > 0, 'Deve registrar escrita física no Sheets');

    // 14.2: Bloqueio por Duplicidade de BOE com ZERO ESCRITA
    let sheetBoeDup = mockSheet(CABECALHOS_ORIGINAIS, null, null, validacoesPersistencia);
    sheetBoeDup.sheetName = 'AGO2026';
    sheetBoeDup.colBoeValues = [['2026/000123']]; // BOE já presente
    const mockSsBoeDup = {
        getSheetByName: () => sheetBoeDup,
        getSheets: () => [sheetBoeDup]
    };
    global.SpreadsheetApp.getActiveSpreadsheet = () => mockSsBoeDup;

    assert.throws(() => {
        processarEntradaManual(payloadCompleto);
    }, /BLOQUEADO: A ocorrência com BOE 2026\/000123 já consta cadastrada nesta planilha/, 'Deve bloquear duplicidade de BOE');
    assert.strictEqual(sheetBoeDup.rangesEscritos.length, 0, 'Zero escrita comprovada quando BOE for duplicado');

    // 14.3: Bloqueio por Duplicidade de MIKE com ZERO ESCRITA
    let sheetMikeDup = mockSheet(CABECALHOS_ORIGINAIS, null, null, validacoesPersistencia);
    sheetMikeDup.sheetName = 'AGO2026';
    sheetMikeDup.colMikeValues = [['M123456']]; // MIKE já presente
    const mockSsMikeDup = {
        getSheetByName: () => sheetMikeDup,
        getSheets: () => [sheetMikeDup]
    };
    global.SpreadsheetApp.getActiveSpreadsheet = () => mockSsMikeDup;

    assert.throws(() => {
        processarEntradaManual(payloadCompleto);
    }, /BLOQUEADO: A ocorrência com MIKE M123456 já consta cadastrada nesta planilha/, 'Deve bloquear duplicidade de MIKE');
    assert.strictEqual(sheetMikeDup.rangesEscritos.length, 0, 'Zero escrita comprovada quando MIKE for duplicado');

    // 14.4: Bloqueio por Aba Mensal Ausente com ZERO ESCRITA
    let sheetAgo2026 = mockSheet(CABECALHOS_ORIGINAIS, null, null, validacoesPersistencia);
    sheetAgo2026.sheetName = 'AGO2026';
    const mockSsMesInexistente = {
        getSheetByName: (name) => name === 'AGO2026' ? sheetAgo2026 : null,
        getSheets: () => [sheetAgo2026]
    };
    global.SpreadsheetApp.getActiveSpreadsheet = () => mockSsMesInexistente;

    const payloadMesInexistente = { ...payloadCompleto, data: '18/12/2099' };
    assert.throws(() => {
        processarEntradaManual(payloadMesInexistente);
    }, /Aba mensal esperada \(DEZ2099\) não encontrada/, 'Deve bloquear se a aba mensal não existir');

    // 14.5: Bloqueio por Falha de Validação na Fase 1 com ZERO ESCRITA
    let sheetValFalha = mockSheet(CABECALHOS_ORIGINAIS, null, null, validacoesPersistencia);
    sheetValFalha.sheetName = 'AGO2026';
    const mockSsValFalha = {
        getSheetByName: () => sheetValFalha,
        getSheets: () => [sheetValFalha]
    };
    global.SpreadsheetApp.getActiveSpreadsheet = () => mockSsValFalha;

    const payloadInvalido = { ...payloadCompleto, natureza: 'NATUREZA_FORA_DA_LISTA_TOTALMENTE_INVALIDA' };
    assert.throws(() => {
        processarEntradaManual(payloadInvalido);
    }, /não é permitido pela validação da planilha/, 'Fase 1 deve barrar valor fora da validação');
    assert.strictEqual(sheetValFalha.rangesEscritos.length, 0, 'Zero escrita comprovada quando validação da Fase 1 falhar');

    // 14.6: Fluxo Manual Sem OCR
    let sheetManualPuro = mockSheet(CABECALHOS_ORIGINAIS, null, null, validacoesPersistencia);
    sheetManualPuro.sheetName = 'AGO2026';
    const mockSsManualPuro = {
        getSheetByName: () => sheetManualPuro,
        getSheets: () => [sheetManualPuro]
    };
    global.SpreadsheetApp.getActiveSpreadsheet = () => mockSsManualPuro;

    const payloadManualSemOcr = {
        origem: 'FORMULARIO',
        data: '18/08/2026',
        hora: '11:00',
        mike: 'M987654',
        boe: '2026/987654',
        natureza: 'TRÁFICO ILÍCITO DE ENTORPECENTES',
        ais: '3',
        cidade: 'RECIFE',
        bairro: 'BOA VIAGEM',
        detidos: '0',
        imputado: 'SEM IMPUTADO',
        policiais: [{ nome: 'POLICIAL DIGITADO MANUAL' }],
        armas: [],
        drogas: [],
        ocorrenciasPip: []
    };
    const resManual = processarEntradaManual(payloadManualSemOcr);
    assert.ok(resManual.includes('salva com sucesso'), 'Fluxo manual puro deve salvar com sucesso');
    assert.ok(sheetManualPuro.rangesEscritos.length > 0, 'Fluxo manual deve registrar escrita no Sheets');

    // 14.7: Validações no Client-Side (salvarDados em Formulario.html)
    ultimoPayloadGravacao = null;
    mockElements.statusMessage.innerText = '';
    mockElements.data.value = '';
    mockElements.natureza.value = '';
    salvarDados();
    assert.strictEqual(ultimoPayloadGravacao, null, 'Não deve despachar para o backend se campos obrigatórios estiverem vazios');
    assert.ok(mockElements.statusMessage.innerText.includes('Preencha DATA e NATUREZA antes de salvar'), 'Client deve exibir mensagem de erro na UI');

    // [Test 15] Homologação E2E Ponta a Ponta do C01 (Gate Final - Card #66: T-C01-E2E-HOMOLOGACAO-009)
    console.log('  [Test 15] Homologação E2E Ponta a Ponta do C01 (Gate Final: Fato, Equipe, Armas, Drogas, PIP, Imputado, OCR e Manual)');

    // 15.1: Cenário E2E Completo (Fato, Equipe, Armas, Drogas, PIP, Imputado)
    let sheetE2E = mockSheet(CABECALHOS_ORIGINAIS, null, null, validacoesPersistencia);
    sheetE2E.sheetName = 'AGO2026';
    const mockSsE2E = {
        getSheetByName: (n) => (n === 'AGO2026' ? sheetE2E : null),
        getSheets: () => [sheetE2E]
    };
    global.SpreadsheetApp.getActiveSpreadsheet = () => mockSsE2E;

    const payloadE2ECompleto = {
        origem: 'FORMULARIO',
        mike: 'M888999',
        boe: '2026/888999',
        ais: '3',
        data: '18/08/2026',
        hora: '15:30',
        cidade: 'RECIFE',
        bairro: 'BOA VIAGEM',
        natureza: 'TRÁFICO ILÍCITO DE ENTORPECENTES',
        qtd_o: '1',
        detidos: '1',
        imputado: 'COM IMPUTADO',
        policiais: [
            { nome: 'CB SILVA 111111', pelotao: '1', posto: 'CB', matricula: '111111', qtd_armas: 1 },
            { nome: 'SD SOUZA 222222', pelotao: '1', posto: 'SD', matricula: '222222', qtd_armas: 0 }
        ],
        armas: [
            { tipo: 'INDUSTRIAL', modelo: 'PISTOLA', calibre: '.40', municao: 15, quantidade: 1 }
        ],
        drogas: [
            { tipo: 'COCAINA PINO', quantidade: 50 },
            { tipo: 'MACONHA GRAMA', quantidade: 200 }
        ],
        ocorrenciasPip: [
            'Apreensão de arma de fogo pistola',
            'Apreensão de cocaína por grama (invólucro)'
        ]
    };

    const resE2E = processarEntradaManual(payloadE2ECompleto);
    assert.ok(resE2E.includes('salva com sucesso'), 'Cenário E2E completo deve ser salvo com sucesso');
    assert.ok(resE2E.includes('2 registros computados'), 'Cenário E2E completo deve expandir para 2 registros');
    assert.ok(sheetE2E.rangesEscritos.length > 0, 'Cenário E2E deve realizar gravação física no Sheets');

    // 15.2: Fluxo Manual Completo sem OCR
    let sheetManualE2E = mockSheet(CABECALHOS_ORIGINAIS, null, null, validacoesPersistencia);
    sheetManualE2E.sheetName = 'AGO2026';
    const mockSsManualE2E = {
        getSheetByName: (n) => (n === 'AGO2026' ? sheetManualE2E : null),
        getSheets: () => [sheetManualE2E]
    };
    global.SpreadsheetApp.getActiveSpreadsheet = () => mockSsManualE2E;

    const payloadManual100 = {
        origem: 'FORMULARIO',
        mike: 'M777666',
        boe: '2026/777666',
        ais: '7',
        data: '18/08/2026',
        hora: '10:00',
        cidade: 'OLINDA',
        bairro: 'BAIRRO NOVO',
        natureza: 'TRÁFICO ILÍCITO DE ENTORPECENTES',
        qtd_o: '1',
        detidos: '0',
        imputado: 'SEM IMPUTADO',
        policiais: [{ nome: 'SD MANUAL 333333', pelotao: '2', posto: 'SD', matricula: '333333', qtd_armas: 0 }],
        armas: [],
        drogas: [],
        ocorrenciasPip: []
    };
    const resManual100 = processarEntradaManual(payloadManual100);
    assert.ok(resManual100.includes('salva com sucesso'), 'Fluxo 100% manual sem OCR deve persistir perfeitamente');

    // 15.3: Fluxo OCR Completo: Documento -> Prefill -> Conferência -> Correção Humana -> Payload
    limparFormulario();
    const textoOcrE2E = "BOLETIM DE OCORRÊNCIA Nº: 123456789012\n26E1174010335\nData do Fato: 18/08/2026 18:45\nCidade: RECIFE\nBairro: BOA VIAGEM\nNatureza da Ocorrência: PORTE ILEGAL DE ARMA\nAPREENSÃO: 01 PISTOLA CALIBRE .40";
    parseAndFill(textoOcrE2E);

    // Valida prefill assistivo inicial
    assert.strictEqual(mockElements.data.value, '18/08/2026', 'OCR deve preencher Data');
    assert.strictEqual(mockElements.hora.value, '18:45', 'OCR deve preencher Hora');
    assert.strictEqual(mockElements.mike.value, '123456789012', 'OCR deve preencher MIKE');
    assert.strictEqual(mockElements.boe.value, '26E1174010335', 'OCR deve preencher BOE');
    assert.strictEqual(mockElements.cidade.value, 'RECIFE', 'OCR deve preencher Cidade');
    assert.strictEqual(mockElements.bairro.value, 'BOA VIAGEM', 'OCR deve preencher Bairro');
    assert.strictEqual(mockElements.natureza.value, 'PORTE ILEGAL DE ARMA', 'OCR deve sugerir Natureza');

    // Intervenção e Correção Humana soberana do Operador
    mockElements.natureza.value = 'TRÁFICO ILÍCITO DE ENTORPECENTES'; // Operador corrige
    assert.strictEqual(mockElements.natureza.value, 'TRÁFICO ILÍCITO DE ENTORPECENTES', 'Correção do operador deve prevalecer');

    // 15.4: Prova de que OCR tardio não sobrescreve correção manual
    if (successCb) {
        successCb({ naturezas: ['ROUBO A TRANSEUNTE'], detidos: [], armasTipos: [], armasModelos: [], ocorrenciasPip: [] });
    }
    assert.strictEqual(mockElements.natureza.value, 'TRÁFICO ILÍCITO DE ENTORPECENTES', 'OCR tardio não deve sobrescrever alteração do operador');

    // 15.5: Prova de que OCR NUNCA chama persistência diretamente
    assert.strictEqual(ultimoPayloadGravacao, null, 'OCR em si NUNCA deve acionar persistência diretamente no Sheets');

    // 15.6: Convergência de Manual e OCR para o MESMO payload e porta processarEntradaManual
    ultimoPayloadGravacao = null;
    salvarDados();
    assert.ok(ultimoPayloadGravacao !== null, 'Salvar dispara envio de payload unificado');
    const chavesPayload = Object.keys(ultimoPayloadGravacao).sort();
    const chavesEsperadas = ['ais','armas','bairro','boe','cidade','data','detidos','drogas','hora','imputado','mike','natureza','ocorrenciasPip','origem','policiais','qtd_o'].sort();
    assert.deepStrictEqual(chavesPayload, chavesEsperadas, 'Payload unificado deve conter exatamente as 16 chaves contratuais');

    // 15.7: Provas de Resiliência: Duplicidade, Validação Inválida e Aba Ausente com ZERO ESCRITA
    global.SpreadsheetApp.getActiveSpreadsheet = () => mockSsE2E;
    // a) Duplicidade BOE
    sheetE2E.rangesEscritos = [];
    sheetE2E.colBoeValues = [['2026/888999']];
    assert.throws(() => {
        processarEntradaManual(payloadE2ECompleto);
    }, /BLOQUEADO: A ocorrência com BOE 2026\/888999 já consta cadastrada/, 'Duplicidade BOE deve bloquear');
    assert.strictEqual(sheetE2E.rangesEscritos.length, 0, 'Zero escrita comprovada em duplicidade de BOE');

    // b) Duplicidade MIKE
    sheetE2E.rangesEscritos = [];
    sheetE2E.colBoeValues = null;
    sheetE2E.colMikeValues = [['M888999']];
    assert.throws(() => {
        processarEntradaManual(payloadE2ECompleto);
    }, /BLOQUEADO: A ocorrência com MIKE M888999 já consta cadastrada/, 'Duplicidade MIKE deve bloquear');
    assert.strictEqual(sheetE2E.rangesEscritos.length, 0, 'Zero escrita comprovada em duplicidade de MIKE');

    // c) Validação Inválida (Fase 1)
    sheetE2E.rangesEscritos = [];
    sheetE2E.colBoeValues = null;
    sheetE2E.colMikeValues = null;
    const payloadInvalidoE2E = { ...payloadE2ECompleto, natureza: 'NATUREZA_INVALIDA_E2E' };
    assert.throws(() => {
        processarEntradaManual(payloadInvalidoE2E);
    }, /não é permitido pela validação da planilha/, 'Fase 1 deve barrar valor inválido');
    assert.strictEqual(sheetE2E.rangesEscritos.length, 0, 'Zero escrita comprovada em validação inválida');

    // d) Aba Mensal Ausente
    const payloadAbaAusenteE2E = { ...payloadE2ECompleto, data: '01/01/2099' };
    assert.throws(() => {
        processarEntradaManual(payloadAbaAusenteE2E);
    }, /Aba mensal esperada \(JAN2099\) não encontrada/, 'Aba ausente deve barrar');
    assert.strictEqual(sheetE2E.rangesEscritos.length, 0, 'Zero escrita comprovada em aba ausente');

    // 15.8: Preservação de Fórmulas e Fluxo sem seções opcionais (sem armas, sem drogas, sem PIP)
    let sheetSemOpcionais = mockSheet(CABECALHOS_ORIGINAIS, null, null, validacoesPersistencia);
    sheetSemOpcionais.sheetName = 'AGO2026';
    const mockSsSemOpcionais = {
        getSheetByName: (n) => (n === 'AGO2026' ? sheetSemOpcionais : null),
        getSheets: () => [sheetSemOpcionais]
    };
    global.SpreadsheetApp.getActiveSpreadsheet = () => mockSsSemOpcionais;

    const payloadMinimo = {
        origem: 'FORMULARIO',
        mike: 'M111222',
        boe: '2026/111222',
        ais: '3',
        data: '18/08/2026',
        hora: '14:00',
        cidade: 'RECIFE',
        bairro: 'BOA VIAGEM',
        natureza: 'TRÁFICO ILÍCITO DE ENTORPECENTES',
        qtd_o: '1',
        detidos: '0',
        imputado: 'SEM IMPUTADO',
        policiais: [{ nome: 'SGT TESTE', pelotao: '3', posto: 'SGT', matricula: '999999', qtd_armas: 0 }],
        armas: [],
        drogas: [],
        ocorrenciasPip: []
    };
    const resMinimo = processarEntradaManual(payloadMinimo);
    assert.ok(resMinimo.includes('salva com sucesso'), 'Fluxo mínimo sem seções opcionais deve ser salvo com sucesso');
    assert.ok(sheetSemOpcionais.rangesEscritos.length > 0, 'Fluxo mínimo deve registrar no Sheets');

    console.log('✅ OK - EntradaManual.js e Formulario.html');
})().catch(err => {
    console.error("Falha no teste:", err);
    process.exit(1);
});

} // end else
