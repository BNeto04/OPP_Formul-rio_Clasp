'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- TESTANDO EXTRAÇÃO OCR DE CIDADE E BAIRRO (Formulario.html) ---');

const htmlPath = path.join(__dirname, '../Entrada/Formulario.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

const scriptMatch = htmlContent.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i);
if (!scriptMatch) {
  throw new Error('Script inline não encontrado em Formulario.html');
}

function criarAmbienteDOM() {
  const elementos = {
    mike: { value: '' },
    boe: { value: '' },
    natureza: { value: '' },
    data: { value: '' },
    hora: { value: '' },
    cidade: { value: '' },
    bairro: { value: '' },
    drogasList: { innerHTML: '' }
  };

  const mockDocument = {
    getElementById: (id) => {
      if (!elementos[id]) {
        elementos[id] = { value: '', innerHTML: '' };
      }
      return elementos[id];
    }
  };

  return { elementos, mockDocument };
}

const pfStart = scriptMatch[1].indexOf('function parseAndFill');
const pfEnd = scriptMatch[1].indexOf('const dataExtraida =', pfStart);

// Extrai o miolo exato da função sem redeclarar variáveis
const functionBody = scriptMatch[1].substring(pfStart + 'function parseAndFill(text, ocrId = execucaoOcrId) {'.length, pfEnd);

const testableParser = new Function('document', 'text', `
  let execucaoOcrId = 1;
  let ocrId = 1;
  let policiaisSet = new Set();
  function adicionarPolicialLinha() {}
  function adicionarDrogaField() {}
  
  ${functionBody}
  return document;
`);

// Teste A: Bairro: SANTA MÔNICA - CAMARAGIBE -> bairro=SANTA MÔNICA, cidade=CAMARAGIBE
{
  const { elementos, mockDocument } = criarAmbienteDOM();
  const doc = `POLÍCIA MILITAR DE PERNAMBUCO\nBairro: SANTA MÔNICA - CAMARAGIBE\nNatureza: ROUBO`;
  testableParser(mockDocument, doc);
  assert.strictEqual(elementos.bairro.value, 'SANTA MÔNICA', 'Teste A Falhou no Bairro');
  assert.strictEqual(elementos.cidade.value, 'CAMARAGIBE', 'Teste A Falhou na Cidade');
  console.log('✅ Teste A: OK (Bairro: SANTA MÔNICA - CAMARAGIBE)');
}

// Teste B: Bairro: BOA VIAGEM + Cidade: RECIFE -> valores separados corretos
{
  const { elementos, mockDocument } = criarAmbienteDOM();
  const doc = `Local do Fato\nBairro: BOA VIAGEM\nCidade: RECIFE\nData do Fato: 10/08/2026 14:00`;
  testableParser(mockDocument, doc);
  assert.strictEqual(elementos.bairro.value, 'BOA VIAGEM', 'Teste B Falhou no Bairro');
  assert.strictEqual(elementos.cidade.value, 'RECIFE', 'Teste B Falhou na Cidade');
  console.log('✅ Teste B: OK (Bairro: BOA VIAGEM + Cidade: RECIFE)');
}

// Teste C: Documento contendo RECIFE em cabeçalho, mas local do fato em CAMARAGIBE
{
  const { elementos, mockDocument } = criarAmbienteDOM();
  const doc = `DIRETORIA GERAL - RECIFE - PE\nCOMANDO GERAL DA PMPE\nBairro: VILA DA FÁBRICA - CAMARAGIBE\nData: 10/08/2026`;
  testableParser(mockDocument, doc);
  assert.strictEqual(elementos.bairro.value, 'VILA DA FÁBRICA', 'Teste C Falhou no Bairro');
  assert.strictEqual(elementos.cidade.value, 'CAMARAGIBE', 'Teste C Falhou na Cidade');
  console.log('✅ Teste C: OK (Cabeçalho RECIFE não sobrepõe CAMARAGIBE)');
}

// Teste D: Município não presente na antiga lista hardcoded (ex: SURUBIM)
{
  const { elementos, mockDocument } = criarAmbienteDOM();
  const doc = `BOLETIM POLICIAL\nMunicípio: SURUBIM\nBairro: CENTRO`;
  testableParser(mockDocument, doc);
  assert.strictEqual(elementos.cidade.value, 'SURUBIM', 'Teste D Falhou na Cidade');
  assert.strictEqual(elementos.bairro.value, 'CENTRO', 'Teste D Falhou no Bairro');
  console.log('✅ Teste D: OK (SURUBIM extraído mesmo fora da lista antiga)');
}

// Teste E: Ausência de cidade contextual -> não inventar cidade
{
  const { elementos, mockDocument } = criarAmbienteDOM();
  const doc = `Bairro: CENTRO\nNatureza: AMEAÇA`;
  testableParser(mockDocument, doc);
  assert.strictEqual(elementos.bairro.value, 'CENTRO', 'Teste E Falhou no Bairro');
  assert.strictEqual(elementos.cidade.value, '', 'Teste E Falhou: não deve inventar cidade');
  console.log('✅ Teste E: OK (Cidade vazia quando não há contexto)');
}

// Teste F: Bairro sem hífen -> preservar bairro completo
{
  const { elementos, mockDocument } = criarAmbienteDOM();
  const doc = `Bairro: ALTO DO REFÚGIO DOS MILAGRES\nMunicípio: RECIFE`;
  testableParser(mockDocument, doc);
  assert.strictEqual(elementos.bairro.value, 'ALTO DO REFÚGIO DOS MILAGRES', 'Teste F Falhou no Bairro');
  assert.strictEqual(elementos.cidade.value, 'RECIFE', 'Teste F Falhou na Cidade');
  console.log('✅ Teste F: OK (Bairro longo sem hífen preservado)');
}

// Teste de Regressão de Data, Hora e MIKE
{
  const { elementos, mockDocument } = criarAmbienteDOM();
  const doc = `BOLETIM DE OCORRÊNCIA Nº: 1234567890123\nData do Fato: 15/09/2026 21:45\nBairro: DERBY - RECIFE`;
  testableParser(mockDocument, doc);
  assert.strictEqual(elementos.mike.value, '1234567890123', 'Regressão MIKE falhou');
  assert.strictEqual(elementos.data.value, '15/09/2026', 'Regressão Data falhou');
  assert.strictEqual(elementos.hora.value, '21:45', 'Regressão Hora falhou');
  assert.strictEqual(elementos.bairro.value, 'DERBY', 'Bairro Derby falhou');
  assert.strictEqual(elementos.cidade.value, 'RECIFE', 'Cidade Recife falhou');
  console.log('✅ Regressão Data, Hora e MIKE: 100% PRESERVADOS');
}

console.log('--- TODOS OS 7 TESTES DE CIDADE/BAIRRO E REGRESSÃO FORAM APROVADOS COM SUCESSO! ---');
}
