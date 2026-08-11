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

// Ler script
const entradaManualCode = fs.readFileSync(path.join(__dirname, '../Entrada/EntradaManual.js'), 'utf8');
eval(entradaManualCode + '\nif(typeof gravarLinhasEntradaManual !== "undefined") global.gravarLinhasEntradaManual = gravarLinhasEntradaManual;'); 
const gravarLinhasEntradaManual = global.gravarLinhasEntradaManual;

// Helpers de mock para Range/DataValidation
function mockDataValidation(listaValores) {
    return {
        getCriteriaType: () => 'VALUE_IN_LIST',
        getCriteriaValues: () => [listaValores]
    };
}

function mockRange(values, formulas = null, validations = null) {
    return {
        getValues: () => values,
        setValues: function(v) { this.writtenValues = v; },
        getFormulas: () => formulas || values.map(row => row.map(() => '')),
        getDataValidations: () => validations || values.map(row => row.map(() => null))
    };
}

function mockSheet(headers, values, validations) {
    let mockAba = {
        rangesEscritos: [],
        getLastColumn: () => headers.length,
        getMaxRows: () => 100,
        getRange: function(row, col, numRows = 1, numCols = 1) {
            if (row === 1 && numRows === 1) {
                // Header row
                return mockRange([headers.slice(col - 1, col - 1 + numCols)]);
            } else if (col === 2 && numRows === 100) {
                // Col B (Data) mock for finding ultimaLinha
                const colB = Array(100).fill(['']);
                colB[0] = ['01/01/2026'];
                return mockRange(colB);
            } else {
                // Alvo
                const r = mockRange(
                    Array(numRows).fill(Array(numCols).fill('')), // values
                    Array(numRows).fill(headers.map(h => { // formulas
                        const fomCols = ["TOTAL DE MACONHA", "DIVIDIDO MAC", "TOTAL CRACK (GR)", "TOTAL DE COCAINA", "DIVIDIDO COC", "PONTOS TOTAIS", "PONTOS FICÇÃO (1/4)", "CHAVE OCORRÊNCIA"];
                        return fomCols.includes(h.toUpperCase()) ? '=1' : '';
                    })).map(rowFormulas => rowFormulas.slice(col - 1, col - 1 + numCols)),
                    Array(numRows).fill(validations || Array(numCols).fill(null)).map(rowVals => rowVals.slice(col - 1, col - 1 + numCols))
                );
                
                // Hook in setValues to track what is written
                const originalSetValues = r.setValues;
                r.setValues = function(v) {
                    originalSetValues.call(this, v);
                    mockAba.rangesEscritos.push({col, numRows, values: v});
                };
                return r;
            }
        }
    };
    return mockAba;
}

const CABECALHOS_ORIGINAIS = [
    "ORD", "DATA", "HORA", "QTD O", "MIKE", "NATUREZA", "BOE", "AIS", "CIDADE", "BAIRRO", "DETIDOS",
    "ARMA", "TIPO", "CALIBRE", "MODELO", "MUNIÇÃO", 
    "MACONHA DOLAR", "MACONHA GRAMA", "TOTAL DE MACONHA", "DIVIDIDO MAC",
    "CRACK PEDRA", "CRACK GRAMA", "TOTAL CRACK (GR)", 
    "COCAINA PINO", "COCAINA GRAMA", "TOTAL DE COCAINA", "DIVIDIDO COC",
    "PELOTÃO", "GRAD", "MATRICULA", "POLICIAL", "QDT ARMAS", 
    "OCORRÊNCIA PIP", "IMPUTADO?", "PONTOS TOTAIS", "PONTOS FICÇÃO (1/4)", "CHAVE OCORRÊNCIA"
];

const linhaInserirFake = CABECALHOS_ORIGINAIS.map((c, i) => `Val_${c}`);
// Correção de validação (se passar uma lista que inclui 'Val_NATUREZA')
const valsPadrao = CABECALHOS_ORIGINAIS.map(c => c === 'NATUREZA' ? mockDataValidation(['Val_NATUREZA']) : null);

console.log('  [Test 1] Colunas em ordem padrão com validação positiva e fórmulas');
let sheetOrdemPadrao = mockSheet(CABECALHOS_ORIGINAIS, [], valsPadrao);
gravarLinhasEntradaManual(sheetOrdemPadrao, [linhaInserirFake]);

assert(sheetOrdemPadrao.rangesEscritos.length > 0, "Deveria ter escrito nas colunas mapeadas");
const escritaNaturezaIdx = CABECALHOS_ORIGINAIS.indexOf("NATUREZA") + 1; // 1-based
const escritaNat = sheetOrdemPadrao.rangesEscritos.find(w => w.col === escritaNaturezaIdx);
assert.strictEqual(escritaNat.values[0][0], "Val_NATUREZA", "Deveria mapear NATUREZA corretamente");

console.log('  [Test 2] Colunas embaralhadas para provar independência de posições fixas');
const CABECALHOS_EMBARALHADOS = ["NATUREZA", "CHAVE OCORRÊNCIA", "PONTOS TOTAIS", "TOTAL DE MACONHA", "DIVIDIDO MAC", "TOTAL CRACK (GR)", "TOTAL DE COCAINA", "DIVIDIDO COC", "PONTOS FICÇÃO (1/4)", "DATA"];
const valsEmbaralhado = CABECALHOS_EMBARALHADOS.map(c => c === 'NATUREZA' ? mockDataValidation(['Val_NATUREZA']) : null);
let sheetEmbaralhada = mockSheet(CABECALHOS_EMBARALHADOS, [], valsEmbaralhado);
gravarLinhasEntradaManual(sheetEmbaralhada, [linhaInserirFake]);

const escNatEmb = sheetEmbaralhada.rangesEscritos.find(w => w.col === 1); // "NATUREZA" é a coluna 1
assert.strictEqual(escNatEmb.values[0][0], "Val_NATUREZA", "Deveria mapear NATUREZA para a coluna 1");
const escDataEmb = sheetEmbaralhada.rangesEscritos.find(w => w.col === 10); // "DATA" é a coluna 10
assert.strictEqual(escDataEmb.values[0][0], "Val_DATA", "Deveria mapear DATA para a coluna 10");

console.log('  [Test 3] Gravação abortada por ausência de fórmula (linha 2 incompleta)');
// Vamos remover as fórmulas do mock localmente
sheetOrdemPadrao = mockSheet(CABECALHOS_ORIGINAIS, [], valsPadrao);
// monkey patch
const oldGetRange = sheetOrdemPadrao.getRange;
sheetOrdemPadrao.getRange = function(row, col, nr, nc) {
    const r = oldGetRange.call(sheetOrdemPadrao, row, col, nr, nc);
    r.getFormulas = () => Array(nr).fill(Array(nc).fill('')); // sem formulas
    return r;
};
assert.throws(() => {
    gravarLinhasEntradaManual(sheetOrdemPadrao, [linhaInserirFake]);
}, /fórmulas pré-formatadas requeridas/, "Deveria lançar erro se não houver fórmula pré-existente");

console.log('  [Test 4] Valores que falham na validação de dados são bloqueados');
sheetOrdemPadrao = mockSheet(CABECALHOS_ORIGINAIS, [], CABECALHOS_ORIGINAIS.map(c => c === 'NATUREZA' ? mockDataValidation(['Outro Valor']) : null));
assert.throws(() => {
    gravarLinhasEntradaManual(sheetOrdemPadrao, [linhaInserirFake]);
}, /não é permitido pela validação/, "Deveria abortar a gravação");

console.log('✅ OK - EntradaManual.js');

} // end else
