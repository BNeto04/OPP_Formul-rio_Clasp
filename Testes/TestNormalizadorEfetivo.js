const assert = require('assert');
const path = require('path');

// Mock dependencies for offline testing
global.CONFIG_SYNTHEON = { PLANILHAS: { PECULIO_ID: 'MOCK_PECULIO' } };
global.CONSTANTES_SYNTHEON = { ABA_EFETIVO: 'EFETIVO' };
global.SyntheonUtils = {
  limparMatricula(val) {
    if (!val) return '';
    return String(val).replace(/[^a-zA-Z0-9]/g, '').toUpperCase().trim();
  },
  normalizarTexto(val) {
    if (!val) return '';
    return String(val).toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }
};

// Import code under test
const NormalizadorEfetivo = require('../Features/NormalizadorEfetivo');

console.log('Testes Unitarios: Desambiguacao de Nomes de Guerra...');

function test(name, fn) {
  try {
    fn();
    console.log('  [PASS] ' + name);
  } catch (err) {
    console.error('  [FAIL] ' + name);
    console.error(err);
    process.exit(1);
  }
}

test('Nomes unicos permanecem inalterados', () => {
  const registros = [
    { matricula: '101', nomeGuerra: 'ALBUQUERQUE', antiguidadeN: 10, linhaOrigem: 12 },
    { matricula: '102', nomeGuerra: 'BEZERRA', antiguidadeN: 15, linhaOrigem: 13 }
  ];
  NormalizadorEfetivo.desambiguarNomesGuerra(registros);
  assert.strictEqual(registros[0].nomeGuerra, 'ALBUQUERQUE');
  assert.strictEqual(registros[1].nomeGuerra, 'BEZERRA');
});

test('2 policiais com mesmo nome: 1o mantem nome, 2o recebe ponto (.)', () => {
  const registros = [
    { matricula: '202', nomeGuerra: 'SILVA', antiguidadeN: 45, linhaOrigem: 20 },
    { matricula: '201', nomeGuerra: 'SILVA', antiguidadeN: 12, linhaOrigem: 14 }
  ];
  const log = [];
  NormalizadorEfetivo.desambiguarNomesGuerra(registros, log);
  
  const maisAntigo = registros.find(r => r.matricula === '201');
  const maisRecruta = registros.find(r => r.matricula === '202');

  assert.strictEqual(maisAntigo.nomeGuerra, 'SILVA', 'Mais antigo deve manter SILVA');
  assert.strictEqual(maisRecruta.nomeGuerra, 'SILVA.', 'Mais recruta deve virar SILVA.');
  assert.strictEqual(log.length, 1, 'Deve registrar 1 entrada de log informativo');
  assert.ok(log[0][3].includes('SILVA.'), 'Mensagem de log deve citar SILVA.');
});

test('3 policiais com mesmo nome: 1o nome, 2o ponto (.), 3o dois pontos (:)', () => {
  const registros = [
    { matricula: '303', nomeGuerra: 'SANTOS', antiguidadeN: 99, linhaOrigem: 30 },
    { matricula: '301', nomeGuerra: 'SANTOS', antiguidadeN: 5, linhaOrigem: 15 },
    { matricula: '302', nomeGuerra: 'SANTOS', antiguidadeN: 40, linhaOrigem: 22 }
  ];
  const log = [];
  NormalizadorEfetivo.desambiguarNomesGuerra(registros, log);

  const r1 = registros.find(r => r.matricula === '301');
  const r2 = registros.find(r => r.matricula === '302');
  const r3 = registros.find(r => r.matricula === '303');

  assert.strictEqual(r1.nomeGuerra, 'SANTOS', '1o mais antigo deve ser SANTOS');
  assert.strictEqual(r2.nomeGuerra, 'SANTOS.', '2o deve ser SANTOS.');
  assert.strictEqual(r3.nomeGuerra, 'SANTOS:', '3o mais recruta deve ser SANTOS:');
  assert.strictEqual(log.length, 2, 'Deve registrar 2 avisos de log');
});

test('Desambiguacao idempotente: se ja vier com ponto ou dois pontos, reprocessa corretamente', () => {
  const registros = [
    { matricula: '401', nomeGuerra: 'LIMA', antiguidadeN: 10, linhaOrigem: 10 },
    { matricula: '402', nomeGuerra: 'LIMA.', antiguidadeN: 20, linhaOrigem: 20 },
    { matricula: '403', nomeGuerra: 'LIMA:', antiguidadeN: 30, linhaOrigem: 30 }
  ];
  NormalizadorEfetivo.desambiguarNomesGuerra(registros);
  assert.strictEqual(registros.find(r => r.matricula === '401').nomeGuerra, 'LIMA');
  assert.strictEqual(registros.find(r => r.matricula === '402').nomeGuerra, 'LIMA.');
  assert.strictEqual(registros.find(r => r.matricula === '403').nomeGuerra, 'LIMA:');
});

console.log('Todos os testes de desambiguacao passaram com sucesso!');
