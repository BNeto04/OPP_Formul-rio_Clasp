'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/TestMunicaoPipOcr.js
 * DESCRICAO: Regressao do defeito reportado pelo proprietario (12/09/2026) no BO de 06/09/2026
 * (MIKE 202609061705524900): revolver calibre .32 com 1 municao foi gravado como
 * "Apreensão de munição calibre .12" — o codigo (a) exigia o literal 'MUNIÇÃO' e o SEU escreve
 * "Munições" (plural) e (b) decidia o calibre por busca da substring "12" no texto inteiro do BO
 * (que aparece na viatura RC1210 e nas matriculas 1129210/1210939).
 *
 * Carrega a FUNCAO REAL de Entrada/Formulario.html (extracao por balanceamento de chaves) — sem copia.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('Iniciando Testes: municao no parser PIP do Formulario (BO 06/09)...\n');

const REPO = path.join(__dirname, '..');

function extrairFuncao(html, nome) {
  const marca = 'function ' + nome + '(';
  const i = html.indexOf(marca);
  if (i === -1) throw new Error('funcao nao encontrada: ' + nome);
  const ini = html.indexOf('{', i);
  let nivel = 0;
  for (let j = ini; j < html.length; j++) {
    const c = html[j];
    if (c === '{') nivel++;
    else if (c === '}') { nivel--; if (nivel === 0) return html.slice(i, j + 1); }
  }
  throw new Error('nao foi possivel delimitar: ' + nome);
}

const html = fs.readFileSync(path.join(REPO, 'Entrada', 'Formulario.html'), 'utf8');

// catalogo real (tabela de pontos PIP) — rotulos exatos
global.window = {
  opcoesFormulario: {
    ocorrenciasPip: [
      'Apreensão de arma de fogo artesanal', 'Apreensão de arma de fogo revólver',
      'Apreensão de arma de fogo pistola', 'Apreensão de arma longa (12 industrial)',
      'Apreensão de arma longa (fuzil)', 'Apreensão de munição revólver/pistola',
      'Apreensão de munição calibre .12', 'Apreensão de munição fuzil',
      'Apreensão de maconha por grama (invólucro ou papelote)', 'Apreensão de maconha (1Kg)',
      'Apreensão de crack por grama', 'Apreensão de crack (1Kg)',
      'Apreensão de cocaína por grama (invólucro)', 'Apreensão de cocaína por grama (kg)'
    ]
  }
};

const conciliarTitulosPipOcr = (0, eval)('(' + extrairFuncao(html, 'conciliarTitulosPipOcr') + ')');

let sucessos = 0;
let falhas = 0;
function test(nome, fn) {
  try {
    fn();
    console.log(`  [PASS] ${nome}`);
    sucessos++;
  } catch (err) {
    console.error(`  [FAIL] ${nome}:`, err.message);
    falhas++;
  }
}

// texto do BO de 06/09 como o SEI entrega (o "12" esta na viatura e nas matriculas)
const TEXTO_BO_0609 = [
  'Prefixo da Viatura: RC1210 Naturezas: ENTORPECENTES (POSSE E USO)',
  'Responsaveis: Matricula: 1225626 Matricula: 1210939 Matricula: 1109553 Matricula: 1129210',
  'OBJETO 1 Tipo do Objeto: ARMA DE FOGO Categoria: REVOLVER Marca: TAURUS Modelo: 73 Calibre:.32 Quantidade de Munições:1 (um) Objeto Apreendido:SIM'
].join('\n');

const REVOLVER_32 = [{ tipo: 'ARMA DE FOGO', modelo: 'REVOLVER', calibre: '.32', municao: 1, quantidade: 1 }];
const ESPINGARDA_12 = [{ tipo: 'ARMA DE FOGO', modelo: 'ESPINGARDA', calibre: '12', municao: 3, quantidade: 1 }];
const FUZIL_762 = [{ tipo: 'ARMA DE FOGO', modelo: 'FUZIL', calibre: '7.62', municao: 30, quantidade: 1 }];

function municao(titulos) {
  return titulos.filter(t => /munição/i.test(String(t)));
}

test('BO 06/09 (revolver .32 + 1 municão, texto com RC1210): NAO pode sair calibre .12', () => {
  const t = conciliarTitulosPipOcr(TEXTO_BO_0609, REVOLVER_32, [], 'ENTORPECENTES (POSSE E USO)');
  const m = municao(t);
  assert.strictEqual(m.length, 1, `esperava 1 titulo de municao, veio: ${JSON.stringify(m)}`);
  assert.strictEqual(m[0], 'Apreensão de munição revólver/pistola');
  assert.ok(t.indexOf('Apreensão de arma de fogo revólver') !== -1, 'arma de fogo revolver deve continuar');
});

test('plurar "Munições" (grafia real do SEI) dispara a deteccao', () => {
  const t = conciliarTitulosPipOcr('Quantidade de Munições:1 (um)', REVOLVER_32, [], '');
  assert.strictEqual(municao(t).length, 1, 'a municao precisa ser detectada com a grafia do SEI');
});

test('o "12" da viatura/matricula nao contamina a classificacao (sem arma informada)', () => {
  const t = conciliarTitulosPipOcr('Prefixo da Viatura: RC1210 Matricula: 1210939 Munições: 2', [], [], '');
  const m = municao(t);
  assert.strictEqual(m.length, 1);
  assert.strictEqual(m[0], 'Apreensão de munição revólver/pistola');
});

test('espingarda calibre 12 continua classificando calibre .12', () => {
  const t = conciliarTitulosPipOcr('Espingarda calibre 12 com 3 munições', ESPINGARDA_12, [], '');
  assert.strictEqual(municao(t)[0], 'Apreensão de munição calibre .12');
});

test('fuzil continua classificando municao de fuzil', () => {
  const t = conciliarTitulosPipOcr('Fuzil com 30 munições', FUZIL_762, [], '');
  assert.strictEqual(municao(t)[0], 'Apreensão de munição fuzil');
});

test('arma com municao 0 e texto sem municao nao gera titulo de municao', () => {
  const semMunicao = [{ tipo: 'ARMA DE FOGO', modelo: 'REVOLVER', calibre: '.32', municao: 0, quantidade: 1 }];
  const t = conciliarTitulosPipOcr('BO de posse de entorpecentes, sem apreensao de armamento no local', semMunicao, [], '');
  assert.strictEqual(municao(t).length, 0);
});

test('BO do 06/09 completo: revolver + maconha + crack (sem duplicidade de titulos)', () => {
  const drogas = [{ tipo: 'MACONHA', quantidade: 52, unidadeMedida: 'UNIDADE' },
                  { tipo: 'CRACK', quantidade: 2, unidadeMedida: 'UNIDADE' }];
  const t = conciliarTitulosPipOcr(TEXTO_BO_0609, REVOLVER_32, drogas, 'ENTORPECENTES (POSSE E USO)');
  assert.ok(t.indexOf('Apreensão de arma de fogo revólver') !== -1);
  assert.ok(t.indexOf('Apreensão de munição revólver/pistola') !== -1);
  assert.ok(t.indexOf('Apreensão de maconha por grama (invólucro ou papelote)') !== -1);
  assert.ok(t.indexOf('Apreensão de crack por grama') !== -1);
  assert.strictEqual(t.length, new Set(t).size, 'nao pode haver titulos repetidos');
});

test('BO com .38 (5 municoes) E 10 municoes de .12 gera os DOIS indicadores', () => {
  const arma = [{ tipo: 'ARMA DE FOGO', modelo: 'REVOLVER', calibre: '.38', municao: 5, quantidade: 1 }];
  const texto = 'OBJETO 1 REVOLVER Calibre:.38 Quantidade de Munições:5 (cinco) Objeto Apreendido:SIM\n' +
                'OBJETO 2 MUNICAO Calibre .12 Quantidade: 10 (dez) Unidade de Medida: UNIDADE Objeto Apreendido:SIM';
  const m = municao(conciliarTitulosPipOcr(texto, arma, [], 'PORTE ILEGAL DE ARMA'));
  assert.ok(m.indexOf('Apreensão de munição revólver/pistola') !== -1, 'falta o indicador de revolver/pistola');
  assert.ok(m.indexOf('Apreensão de munição calibre .12') !== -1, 'falta o indicador de calibre .12');
  assert.strictEqual(m.length, 2, `exatamente dois indicadores, veio: ${JSON.stringify(m)}`);
});

test('municao de calibre repetido nao duplica indicador', () => {
  const texto = 'Munições .32 (3 unidades) e .32 (mais 7)';
  const m = municao(conciliarTitulosPipOcr(texto, [], [], ''));
  assert.strictEqual(m.length, 1);
  assert.strictEqual(m[0], 'Apreensão de munição revólver/pistola');
});

console.log(`\nTestes de munição (PIP): ${sucessos} PASS / ${falhas} FAIL`);
if (falhas > 0) process.exitCode = 1;

}
