'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/TestDominio.js
 * DESCRIÇÃO: Suite de testes unitários para a camada de Domínio.
 * Valida a conversão, imutabilidade e preservação semântica de todas as entidades e Value Objects.
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

const RegistroAnalitico = require('../Dominio/RegistroAnalitico');

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

test('Policial: igualdade deve funcionar comparando matricula sanitizada com pontuação e hífens', () => {
  const p1 = new Policial('123.456-7', 'SOUZA', 'CB', '1º PEL GTAR');
  const p2 = new Policial('1234567', 'SOUZA', 'CB', '1º PEL GTAR');
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

test('RegistroCanonico: deve preservar eventoPontuavel (indicador e imputado) para o Guardião', () => {
  const reg = new RegistroCanonico({
    eventoPontuavel: { indicador: 'MANDADO DE PRISÃO', imputado: 'JOAO DA SILVA' }
  });
  assert.strictEqual(reg.eventoPontuavel.indicador, 'MANDADO DE PRISÃO');
  assert.strictEqual(reg.eventoPontuavel.imputado, 'JOAO DA SILVA');
  assert.throws(() => { reg.eventoPontuavel.indicador = 'ALTERADO'; }, TypeError);
});

test('RegistroCanonico: deve preservar pelotão com GTAR (1º PEL GTAR e 2º PEL GTAR)', () => {
  const reg = new RegistroCanonico({
    policiais: [{ matricula: '123456-7', nome: 'CB SOUZA', graduacao: 'CB', pelotao: '1º PEL GTAR' }]
  });
  assert.strictEqual(reg.policiais[0].pelotao, '1º PEL GTAR');
});

// 6. Testes de RegistroAnalitico
test('RegistroAnalitico: deve separar Fatos de Indicadores e calcular médias dinâmicas', () => {
  const analitico = new RegistroAnalitico({
    matricula: '1234567',
    nome: 'CB SOUZA',
    grad: 'CB',
    pelotao: '1º PEL GTAR',
    fatos: { ocorrencias: 10, armas: 5, drogasTotal: 100, ocorrenciasComArma: 4, ocorrenciasComDroga: 3 },
    indicadores: { pontosTotais: 50.5 }
  });

  assert.strictEqual(analitico.mediaPontos, 5.05);
  assert.strictEqual(analitico.mediaArmas, 0.5);
  assert.strictEqual(analitico.mediaDrogas, 10);
  assert.strictEqual(analitico.percentualArmas, 0.4);
  assert.strictEqual(analitico.percentualDrogas, 0.3);
});

test('Normalizador: deve normalizar 1º PEL GTAR e 2º PEL GTAR preservando a sigla GTAR', () => {
  const NormalizadorMod = require('../Core/Normalizador');
  const SyntheonUtils = require('../Core/Utils');
  global.SyntheonUtils = SyntheonUtils;

  assert.strictEqual(NormalizadorMod.normalizarPelotao('1º PEL GTAR'), '1º PEL GTAR');
  assert.strictEqual(NormalizadorMod.normalizarPelotao('2º PEL GTAR'), '2º PEL GTAR');
  assert.strictEqual(NormalizadorMod.normalizarPelotao('1º PEL'), '1º PEL');
});

console.log(`\n🎉 Testes de Domínio concluídos: ${sucessos} testes passaram!`);
}
