'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/TestMeritoEquipeArmas.js
 * DESCRIÇÃO: Suíte de testes unitários para o Motor puro de cálculo de Mérito de Equipe por Armas (TASK-M06.3-05I.2).
 */

const assert = require('assert');
const PoliticaMeritoArmas = require('../Motor/PoliticaMeritoArmas');
const Fixture = require('./Fixtures/MeritoArmasFixture');

console.log('🧪 Iniciando Testes Unitários: Motor de Mérito de Equipe por Armas (M06.3-05I.2)...\n');

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

// 1. Teste: Um túnel com várias linhas de rateio gera exatamente 1 líder contemplado
test('Mérito de Armas: um túnel com várias linhas gera exatamente 1 líder contemplado', () => {
  const res = PoliticaMeritoArmas.processarMeritoArmas(Fixture.tunelVariasLinhasUmaArma, Fixture.mapaAntiguidade);
  assert.strictEqual(res.length, 1, 'Deve retornar exatamente 1 registro de túnel');
  assert.strictEqual(res[0].status, 'PROCESSADO');
  assert.strictEqual(res[0].qtdArmas, 1, 'Soma total de armas de fogo do túnel deve ser 1');
  assert.strictEqual(res[0].integrantes.length, 3, 'Deve identificar os 3 integrantes da equipe no túnel');
  // SGT IRAN (N=10) é mais antigo que CB MARCONI (N=25) e CB TORRES (N=30)
  assert.strictEqual(res[0].matricula, '108394-5');
  assert.strictEqual(res[0].lider, 'SGT IRAN');
});

// 2. Teste: Soma única de armas (3 armas no túnel)
test('Mérito de Armas: atribuição de 100% das armas (3 armas) do túnel ao líder', () => {
  const res = PoliticaMeritoArmas.processarMeritoArmas(Fixture.tunelTresArmas, Fixture.mapaAntiguidade);
  assert.strictEqual(res.length, 1);
  assert.strictEqual(res[0].status, 'PROCESSADO');
  assert.strictEqual(res[0].qtdArmas, 3);
  assert.strictEqual(res[0].armasFogo, 3);
  assert.strictEqual(res[0].matricula, '102950-9');
});

// 3. Teste: Arma Artesanal resulta em armasFogo === 0 e armasArtesanais === 1, qtdArmas === 0
test('Mérito de Armas: arma artesanal resulta em armasFogo === 0, armasArtesanais === 1 e totalFatosFisicos === 1', () => {
  const res = PoliticaMeritoArmas.processarMeritoArmas(Fixture.tunelArmaArtesanal, Fixture.mapaAntiguidade);
  assert.strictEqual(res.length, 1);
  assert.strictEqual(res[0].status, 'PROCESSADO');
  assert.strictEqual(res[0].qtdArmas, 0, 'Soma de arma de fogo para cards deve ser 0');
  assert.strictEqual(res[0].armasFogo, 0, 'Armas de fogo deve ser 0');
  assert.strictEqual(res[0].armasArtesanais, 1, 'Armas artesanais deve ser 1');
  assert.strictEqual(res[0].totalFatosFisicos, 1, 'Total de fatos físicos deve ser 1');
  assert.strictEqual(res[0].matricula, '108394-5');
});

// 4. Teste: Caso duplo (Arma de Fogo + Arma Artesanal no mesmo túnel)
test('Mérito de Armas: túnel com arma de fogo E artesanal preserva ambos (armasFogo: 1, armasArtesanais: 1, totalFatosFisicos: 2, qtdArmas: 1)', () => {
  const tunelDuplo = [
    {
      data: '2026-06-17',
      mike: '202606171733263474',
      boe: '26E1174008629',
      armas: 1,
      tipoArma: 'INDUSTRIAL',
      policiais: [
        { matricula: '102950-9', nome: 'SGT SAULO', grad: '2º SGT', pelotao: '2º PEL GTAR' },
        { matricula: '108394-5', nome: 'SGT IRAN', grad: '3º SGT', pelotao: '1º PEL GTAR' }
      ]
    },
    {
      data: '2026-06-17',
      mike: '202606171733263474',
      boe: '26E1174008629',
      armas: 0,
      tipoArma: 'ARTESANAL',
      policiais: [
        { matricula: '102950-9', nome: 'SGT SAULO', grad: '2º SGT', pelotao: '2º PEL GTAR' },
        { matricula: '108394-5', nome: 'SGT IRAN', grad: '3º SGT', pelotao: '1º PEL GTAR' }
      ]
    }
  ];

  const res = PoliticaMeritoArmas.processarMeritoArmas(tunelDuplo, Fixture.mapaAntiguidade);
  assert.strictEqual(res.length, 1);
  assert.strictEqual(res[0].status, 'PROCESSADO');
  assert.strictEqual(res[0].armasFogo, 1, 'Arma de fogo deve ser 1');
  assert.strictEqual(res[0].armasArtesanais, 1, 'Arma artesanal deve ser 1');
  assert.strictEqual(res[0].qtdArmas, 1, 'Qtd armas para card numérico deve ser 1');
  assert.strictEqual(res[0].totalFatosFisicos, 2, 'Total de fatos físicos deve ser 2');
  assert.strictEqual(res[0].matricula, '108394-5'); // IRAN (N=10) é mais antigo que SAULO (N=12)
  assert.strictEqual(res[0].designacao, '1º PEL GTAR', 'Designação deve vir da ocorrência mensal');
});

// 5. Teste: Menor N (mais antigo) vence na equipe de 5 integrantes
test('Mérito de Armas: menor número N (militar mais antigo) é selecionado na equipe de 5 integrantes', () => {
  const res = PoliticaMeritoArmas.processarMeritoArmas(Fixture.tunelEquipeCincoIntegrantes, Fixture.mapaAntiguidade);
  assert.strictEqual(res.length, 1);
  assert.strictEqual(res[0].status, 'PROCESSADO');
  assert.strictEqual(res[0].integrantes.length, 5);
  assert.strictEqual(res[0].matricula, '108394-5');
  assert.strictEqual(res[0].numN, 10);
});

// 6. Teste: Líder fora do GTAR (Oficial N=1) é escolhido se for o mais antigo e preserva sua designação mensal
test('Mérito de Armas: líder que não pertence ao GTAR é selecionado se for o mais antigo e preserva designação mensal', () => {
  const res = PoliticaMeritoArmas.processarMeritoArmas(Fixture.tunelLiderForaGtar, Fixture.mapaAntiguidade);
  assert.strictEqual(res.length, 1);
  assert.strictEqual(res[0].status, 'PROCESSADO');
  assert.strictEqual(res[0].matricula, '101001-0');
  assert.strictEqual(res[0].lider, 'MAJ CORREIA');
  assert.strictEqual(res[0].designacao, '3º PEL', 'Deve usar a designação registrada na ocorrência mensal');
  assert.strictEqual(res[0].numN, 1);
});

// 7. Teste: Antiguidade ausente gera PENDENTE_AUDITORIA sem escolha silenciosa
test('Mérito de Armas: ausência de antiguidade cadastrada gera PENDENTE_AUDITORIA', () => {
  const res = PoliticaMeritoArmas.processarMeritoArmas(Fixture.tunelAntiguidadeAusente, Fixture.mapaAntiguidade);
  assert.strictEqual(res.length, 1);
  assert.strictEqual(res[0].status, 'PENDENTE_AUDITORIA');
  assert.strictEqual(res[0].motivoPendente, 'ANTIGUIDADE_AUSENTE');
  assert.strictEqual(res[0].lider, null, 'Não deve escolher um líder silenciosamente');
});

// 8. Teste: Empate estrito em N gera PENDENTE_AUDITORIA sem escolha silenciosa
test('Mérito de Armas: empate estrito de antiguidade N gera PENDENTE_AUDITORIA', () => {
  const res = PoliticaMeritoArmas.processarMeritoArmas(Fixture.tunelEmpateAntiguidade, Fixture.mapaAntiguidade);
  assert.strictEqual(res.length, 1);
  assert.strictEqual(res[0].status, 'PENDENTE_AUDITORIA');
  assert.strictEqual(res[0].motivoPendente, 'EMPATE_ANTIGUIDADE');
  assert.strictEqual(res[0].lider, null, 'Não deve escolher um líder em caso de empate');
});

console.log(`\n🎉 Testes de Mérito de Equipe por Armas concluídos: ${sucessos} testes passaram!`);
}
