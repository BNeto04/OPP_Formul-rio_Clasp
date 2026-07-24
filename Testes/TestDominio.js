'use strict';

/**
 * ARQUIVO: Testes/TestDominio.js
 * DESCRIÇÃO: Suite de testes unitários para a camada de Domínio.
 * Executável em ambiente Node.js sem dependência do Google Apps Script.
 */

const assert = require('assert');

const Erros = require('../Core/Erros');
global.ErroValidacaoDominio = Erros.ErroValidacaoDominio;
const ErroValidacaoDominio = Erros.ErroValidacaoDominio;

const ChaveOcorrenciaMod = require('../Dominio/ValueObjects/ChaveOcorrencia');
const ChaveOcorrencia = ChaveOcorrenciaMod.ChaveOcorrencia || ChaveOcorrenciaMod;

const PolicialMod = require('../Dominio/Policial');
const Policial = PolicialMod.Policial || PolicialMod;
global.Policial = Policial;

const EquipeMod = require('../Dominio/Equipe');
const Equipe = EquipeMod.Equipe || EquipeMod;

const ArmaMod = require('../Dominio/Arma');
const Arma = ArmaMod.Arma || ArmaMod;

const DrogaMod = require('../Dominio/Droga');
const Droga = DrogaMod.Droga || DrogaMod;

const RegistroCanonicoMod = require('../Dominio/RegistroCanonico');
const RegistroCanonico = RegistroCanonicoMod.RegistroCanonico || RegistroCanonicoMod;

console.log('🧪 Iniciando Testes Unitários: Camada de Domínio...\n');

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

// 1. Testes de ChaveOcorrencia
test('ChaveOcorrencia: deve gerar chave formatada correta', () => {
  const chave = new ChaveOcorrencia('050500', '26E117');
  assert.strictEqual(chave.valor, '050500|26E117');
});

test('ChaveOcorrencia: deve ser totalmente imutável (frozen)', () => {
  const chave = new ChaveOcorrencia('050500', '26E117');
  assert.throws(() => { chave.valor = 'OUTRO'; }, TypeError);
});

test('ChaveOcorrencia: deve reconstruir a partir de string (fromString)', () => {
  const chave = ChaveOcorrencia.fromString('050500|26E117');
  assert.strictEqual(chave.mike, '050500');
  assert.strictEqual(chave.boe, '26E117');
});

test('ChaveOcorrencia: deve rejeitar se MIKE e BOE forem ambos vazios', () => {
  assert.throws(() => {
    new ChaveOcorrencia('', '');
  }, (err) => err instanceof ErroValidacaoDominio || err.name === 'ErroValidacaoDominio');
});

// 2. Testes de Policial
test('Policial: deve sanitizar a matrícula removendo não-dígitos', () => {
  const pol = new Policial('113920-7', 'SILVA', 'SD', '1º PEL');
  assert.strictEqual(pol.matricula, '1139207');
});

test('Policial: deve considerar iguais policiais com a mesma matrícula numérica', () => {
  const p1 = new Policial('113920-7', 'SILVA', 'SD', '1º PEL');
  const p2 = new Policial('1139207', 'SILVA OUTRO NOME', 'CB', '2º PEL');
  assert.strictEqual(p1.equals(p2), true);
});

// 3. Testes de Equipe
test('Equipe: não deve permitir adicionar policiais duplicados', () => {
  const equipe = new Equipe();
  const p1 = new Policial('1139207', 'SILVA', 'SD', '1º PEL');
  const p2 = new Policial('113920-7', 'SILVA DUP', 'SD', '1º PEL');
  equipe.adicionarPolicial(p1);
  equipe.adicionarPolicial(p2);
  assert.strictEqual(equipe.quantidadeIntegrantes, 1);
});

// 4. Testes de Arma e Droga (Imutabilidade)
test('Arma: deve congelar a instância e validar quantidade >= 1', () => {
  const arma = new Arma('PISTOLA', 1, '.40');
  assert.throws(() => { arma.quantidade = 999; }, TypeError);
  assert.throws(() => { new Arma('PISTOLA', 0); }, (err) => err instanceof ErroValidacaoDominio || err.name === 'ErroValidacaoDominio');
});

test('Droga: deve congelar a instância e aceitar decimais > 0', () => {
  const droga = new Droga('MACONHA', 15.5, 'G');
  assert.strictEqual(droga.quantidade, 15.5);
  assert.throws(() => { droga.quantidade = 999; }, TypeError);
  assert.throws(() => { new Droga('MACONHA', 0); }, (err) => err instanceof ErroValidacaoDominio || err.name === 'ErroValidacaoDominio');
});

// 5. Testes de RegistroCanonico
test('RegistroCanonico: sub-estruturas devem ser imutáveis (frozen)', () => {
  const reg = new RegistroCanonico({
    origem: { ano: 2026, aba: 'JAN2026', linha: 2 },
    ocorrencia: { chave: '050500|26E117' }
  });
  assert.throws(() => { reg.origem.ano = 2099; }, TypeError);
  assert.throws(() => { reg.ocorrencia.chave = 'HACKED'; }, TypeError);
});

console.log(`\n🎉 Testes de Domínio concluídos: ${sucessos} testes passaram!`);
