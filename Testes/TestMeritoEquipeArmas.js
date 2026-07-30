'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/TestMeritoEquipeArmas.js
 * DESCRIÇÃO: Suíte de testes unitários para o Motor puro de cálculo de Mérito de Equipe por Armas (TASK-M06.3-02).
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const PoliticaMeritoArmas = require('../Motor/PoliticaMeritoArmas');
const Fixture = require('./Fixtures/MeritoArmasFixture');

console.log('🧪 Iniciando Testes Unitários: Motor de Mérito de Equipe por Armas (M06.3-02)...\n');

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
  assert.strictEqual(res[0].qtdArmas, 1, 'Soma total de armas do túnel deve ser 1');
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
  // SGT SAULO (N=12) é mais antigo que SD SAMPAIO (N=45)
  assert.strictEqual(res[0].matricula, '102950-9');
});

// 3. Teste: Arma Artesanal equivale a 1 arma de mérito
test('Mérito de Armas: arma artesanal equivale a 1 arma de mérito', () => {
  const res = PoliticaMeritoArmas.processarMeritoArmas(Fixture.tunelArmaArtesanal, Fixture.mapaAntiguidade);
  assert.strictEqual(res.length, 1);
  assert.strictEqual(res[0].status, 'PROCESSADO');
  assert.strictEqual(res[0].qtdArmas, 1);
  assert.strictEqual(res[0].armasArtesanais, 1);
  assert.strictEqual(res[0].matricula, '108394-5');
});

// 4. Teste: Menor N (mais antigo) vence na equipe de 5 integrantes
test('Mérito de Armas: menor número N (militar mais antigo) é selecionado na equipe de 5 integrantes', () => {
  const res = PoliticaMeritoArmas.processarMeritoArmas(Fixture.tunelEquipeCincoIntegrantes, Fixture.mapaAntiguidade);
  assert.strictEqual(res.length, 1);
  assert.strictEqual(res[0].status, 'PROCESSADO');
  assert.strictEqual(res[0].integrantes.length, 5);
  // Entre IRAN (N=10), SAULO (N=12), MARCONI (N=25), TORRES (N=30) e SAMPAIO (N=45), IRAN (N=10) vence
  assert.strictEqual(res[0].matricula, '108394-5');
  assert.strictEqual(res[0].numN, 10);
});

// 5. Teste: Líder fora do GTAR (Oficial N=1) é escolhido se for o mais antigo
test('Mérito de Armas: líder que não pertence ao GTAR é selecionado se for o mais antigo (menor N)', () => {
  const res = PoliticaMeritoArmas.processarMeritoArmas(Fixture.tunelLiderForaGtar, Fixture.mapaAntiguidade);
  assert.strictEqual(res.length, 1);
  assert.strictEqual(res[0].status, 'PROCESSADO');
  // MAJ CORREIA (N=1, 3º PEL) é mais antigo que SGT IRAN (N=10, 1º PEL GTAR)
  assert.strictEqual(res[0].matricula, '101001-0');
  assert.strictEqual(res[0].lider, 'MAJ CORREIA');
  assert.strictEqual(res[0].numN, 1);
});

// 6. Teste: Antiguidade ausente gera PENDENTE_AUDITORIA sem escolha silenciosa
test('Mérito de Armas: ausência de antiguidade cadastrada gera PENDENTE_AUDITORIA', () => {
  const res = PoliticaMeritoArmas.processarMeritoArmas(Fixture.tunelAntiguidadeAusente, Fixture.mapaAntiguidade);
  assert.strictEqual(res.length, 1);
  assert.strictEqual(res[0].status, 'PENDENTE_AUDITORIA');
  assert.strictEqual(res[0].motivoPendente, 'ANTIGUIDADE_AUSENTE');
  assert.strictEqual(res[0].lider, null, 'Não deve escolher um líder silenciosamente');
});

// 7. Teste: Empate estrito em N gera PENDENTE_AUDITORIA sem escolha silenciosa
test('Mérito de Armas: empate estrito de antiguidade N gera PENDENTE_AUDITORIA', () => {
  const res = PoliticaMeritoArmas.processarMeritoArmas(Fixture.tunelEmpateAntiguidade, Fixture.mapaAntiguidade);
  assert.strictEqual(res.length, 1);
  assert.strictEqual(res[0].status, 'PENDENTE_AUDITORIA');
  assert.strictEqual(res[0].motivoPendente, 'EMPATE_ANTIGUIDADE');
  assert.strictEqual(res[0].lider, null, 'Não deve escolher um líder em caso de empate');
});

console.log(`\n🎉 Testes de Mérito de Equipe por Armas concluídos: ${sucessos} testes passaram!`);
}
