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
eval(entradaManualCode + '\nif(typeof gravarLinhasEntradaManual !== "undefined") global.gravarLinhasEntradaManual = gravarLinhasEntradaManual; if(typeof obterOpcoesValidacao !== "undefined") global.obterOpcoesValidacao = obterOpcoesValidacao; if(typeof localizarAbaMensalTratada !== "undefined") global.localizarAbaMensalTratada = localizarAbaMensalTratada; if(typeof processarEntradaManual !== "undefined") global.processarEntradaManual = processarEntradaManual;'); 
const gravarLinhasEntradaManual = global.gravarLinhasEntradaManual;
const obterOpcoesValidacao = global.obterOpcoesValidacao;
const localizarAbaMensalTratada = global.localizarAbaMensalTratada;
const processarEntradaManual = global.processarEntradaManual;

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
        getDataValidations: () => validations || values.map(r => r.map(() => null))
    };
}

function mockSheet(headers, mockValuesCallback, mockFormulasCallback, mockValidationsCallback) {
    let mockAba = {
        getName: () => 'JAN2026',
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
            return (r + idx === 3 && h === 'DATA') ? 'Lixo' : ''; // Tem lixo na prox linha (linha 3)
        }).slice(c - 1, c - 1 + nc);
    });
}, null, defaultValidations);
sheetLinhaPreenchida.linhaManualPreenchida = true; // Força começar na linha 3
assert.throws(() => {
    gravarLinhasEntradaManual(sheetLinhaPreenchida, [linhaInserirFake]);
}, /não está vazia na coluna/, "Deveria abortar se a linha manual tiver dados residuais");

console.log('  [Test 4] Ausência de validação em campo controlado');
let sheetSemValidacao = mockSheet(CABECALHOS_ORIGINAIS, null, null, (r, c, nr, nc) => {
    return Array(nr).fill(CABECALHOS_ORIGINAIS.map(h => null)).map(rowVals => rowVals.slice(c - 1, c - 1 + nc)); // tudo nulo
});
assert.throws(() => {
    gravarLinhasEntradaManual(sheetSemValidacao, [linhaInserirFake]);
}, /Validação ausente na coluna controlada/, "Deveria abortar");

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

console.log('  [Test 8] Sintaxe do Formulario.html');

const html = fs.readFileSync(path.join(__dirname, '../Entrada/Formulario.html'), 'utf8');
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

console.log('  [Test 9] Proteção contra resposta obsoleta e preenchimento OCR explícito (Formulario.html)');

// Mocks do DOM para Formulario.html
global.document = {
    elements: {
        natureza: { value: '', innerHTML: '', addEventListener: () => {} },
        data: { value: '01/01/2026', addEventListener: () => {} },
        dropZone: { classList: { add: () => {}, remove: () => {} }, addEventListener: () => {} },
        fileInput: { addEventListener: () => {} }
    },
    getElementById: function(id) {
        if (id === 'natureza' || id === 'data' || id === 'dropZone' || id === 'fileInput') return this.elements[id];
        return { value: '', innerHTML: '', appendChild: () => {}, remove: () => {}, addEventListener: () => {}, removeEventListener: () => {}, style: {} };
    },
    querySelector: function(sel) {
        if (sel === '.btn-save') return { disabled: false };
        return null;
    },
    querySelectorAll: () => []
};

global.window = { addEventListener: () => {}, opcoesFormulario: null };

let statusList = [];
global.setStatus = (msg, color) => statusList.push(msg);
global.log = (msg) => {}; // ignorar logs
global.alert = () => {};
global.pdfjsLib = { GlobalWorkerOptions: {} };
global.Tesseract = {};

// Mock do google.script.run assíncrono
let successCb, failureCb, lastCalledObterOpcoes;
global.google = {
    script: {
        run: {
            withSuccessHandler: function(cb) { successCb = cb; return this; },
            withFailureHandler: function(cb) { failureCb = cb; return this; },
            obterOpcoesValidacao: function(d) { lastCalledObterOpcoes = d; },
            getEfetivo: function() { return this; }
        }
    }
};

// Injeta as funções do Formulario.html no escopo global deste teste
fullFormularioScript += "\n\nglobal.carregarOpcoesValidacao = carregarOpcoesValidacao;";
eval(fullFormularioScript);

// O script foi injetado. Vamos testar.
statusList = [];
global.document.elements.data.value = '10/01/2026';

// Dispara a requisição 1 (ex: usuário altera data ou OCR extrai)
const req1Promise = carregarOpcoesValidacao('10/01/2026').catch(e => e.message);
const cb1 = successCb; // captura o callback da req 1

// Antes da req 1 voltar, dispara a requisição 2 (ex: usuário percebeu que digitou errado)
global.document.elements.data.value = '11/01/2026';
const req2Promise = carregarOpcoesValidacao('11/01/2026');
const cb2 = successCb; // captura o callback da req 2

// Agora as respostas chegam fora de ordem. 
// Resposta 1 (obsoleta) chega primeiro:
try {
    cb1({ naturezas: ['NAT_ERRADA'] });
} catch(e) {}

// Resposta 2 (atual) chega:
cb2({ naturezas: ['NAT_CORRETA'], detidos: [], ocorrenciasPip: [] });

Promise.all([req1Promise, req2Promise]).then(results => {
    assert.strictEqual(results[0], "Resposta obsoleta ignorada.", "Req 1 deve ser rejeitada como obsoleta");
    assert.deepStrictEqual(results[1].naturezas, ['NAT_CORRETA'], "Req 2 deve ser resolvida corretamente");
    assert.ok(global.document.elements.natureza.innerHTML.includes('NAT_CORRETA'), "Aba final da natureza deve ter NAT_CORRETA");
    assert.ok(!global.document.elements.natureza.innerHTML.includes('NAT_ERRADA'), "Aba final da natureza NÃO deve ter NAT_ERRADA");

    console.log('✅ OK - EntradaManual.js e Formulario.html');
}).catch(err => {
    console.error("Falha no teste 8:", err);
    process.exit(1);
});

} // end else
