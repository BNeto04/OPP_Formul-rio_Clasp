'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/TestSaudeTuneis.js
 * DESCRICAO: Suite do quadro de saude por tunel (G01 #114): classificacao SAUDAVEL|ALERTA|
 * CRITICO|INCOMPLETO|NAO_AUDITAVEL, deteccao de orfao/duplicado/fragmentado e contabilizacao.
 */

const assert = require('assert');
const { SaudeTuneis } = require('../Core/SaudeTuneis');

console.log('Iniciando Testes: Saude dos Tuneis do Guardiao (G01 #114)...\n');

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

function diag(severidade, codigoRegra, linha = 2, tunel = '') {
  return { severidade, codigoRegra, linha, tunel, diagnostico: codigoRegra };
}

function tunelValido(chave = '15/07/2026|26E100|BOE1') {
  return {
    chave,
    statusClassificacao: 'VALIDO',
    fatos: { armas: 1, municao: 10, maconha: 0, crack: 0, cocaina: 0, numerario: 0 },
    matriculas: new Set(['123']),
    linhasFatos: [{ linha: 2, matricula: '123' }, { linha: 3, matricula: '456' }],
    eventos: [{ linha: 2, indicador: 'ARMA DE FOGO' }]
  };
}

function mikeEntry(mike, boes, datas, linhas) {
  return { mike, boes: new Set(boes), datas: new Set(datas), linhas };
}

// ---------- Classificacao ----------
test('tunel VALIDO sem diagnosticos -> SAUDAVEL', () => {
  const t = tunelValido();
  const cls = SaudeTuneis.classificarTunel(t, []);
  assert.strictEqual(cls.classificacao, 'SAUDAVEL');
  assert.strictEqual(cls.motivo, 'INTEGRIDADE_OK');
});

test('tunel com CRITICO -> CRITICO (domina alerta)', () => {
  const t = tunelValido();
  const cls = SaudeTuneis.classificarTunel(t, [diag('ALERTA', 'RATEIO_PONTOS_INCOERENTE', 2, t.chave), diag('CRITICO', 'TUNEL_SEM_EQUIPE', 2, t.chave)]);
  assert.strictEqual(cls.classificacao, 'CRITICO');
});

test('tunel com ALERTA -> ALERTA', () => {
  const t = tunelValido();
  const cls = SaudeTuneis.classificarTunel(t, [diag('ALERTA', 'FORMULA_AUSENTE', 3, t.chave)]);
  assert.strictEqual(cls.classificacao, 'ALERTA');
  assert.deepStrictEqual(cls.linhas, [2, 3]);
});

test('excecao manual justificada nunca e verde limpo -> ALERTA', () => {
  const t = tunelValido();
  const cls = SaudeTuneis.classificarTunel(t, [diag('EXCECAO MANUAL', 'EXCECAO_MANUAL_JUSTIFICADA', 2, t.chave)]);
  assert.strictEqual(cls.classificacao, 'ALERTA');
});

test('tunel INVALIDO_SEM_FATOS -> INCOMPLETO mesmo com alerta de formula', () => {
  const t = tunelValido();
  t.statusClassificacao = 'INVALIDO_SEM_FATOS';
  const cls = SaudeTuneis.classificarTunel(t, [diag('ALERTA', 'FORMULA_AUSENTE', 2, t.chave)]);
  assert.strictEqual(cls.classificacao, 'INCOMPLETO');
});

test('tunel VAZIO -> INCOMPLETO', () => {
  const t = tunelValido();
  t.statusClassificacao = 'VAZIO';
  assert.strictEqual(SaudeTuneis.classificarTunel(t, []).classificacao, 'INCOMPLETO');
});

test('tunel com TUNEL_SEM_FATOS (equipe sem fato) -> INCOMPLETO', () => {
  const t = tunelValido();
  assert.strictEqual(SaudeTuneis.classificarTunel(t, [diag('ALERTA', 'TUNEL_SEM_FATOS', 2, t.chave)]).classificacao, 'INCOMPLETO');
});

test('numerario sem valor (obs) -> NAO_AUDITAVEL, nunca verde', () => {
  const t = tunelValido();
  const cls = SaudeTuneis.classificarTunel(t, [diag('OBSERVACAO', 'FATO_NAO_AUDITAVEL_AUTOMATICAMENTE', 2, t.chave)]);
  assert.strictEqual(cls.classificacao, 'NAO_AUDITAVEL');
});

test('fonte antiguidade ausente (obs) -> NAO_AUDITAVEL', () => {
  const t = tunelValido();
  const cls = SaudeTuneis.classificarTunel(t, [diag('OBSERVACAO', 'ANTIGUIDADE_FONTE_NAO_LOCALIZADA', 2, t.chave)]);
  assert.strictEqual(cls.classificacao, 'NAO_AUDITAVEL');
});

test('indicador desconhecido (obs generica) -> NAO_AUDITAVEL (anti falso verde)', () => {
  const t = tunelValido();
  const cls = SaudeTuneis.classificarTunel(t, [diag('OBSERVACAO', 'INDICADOR_DESCONHECIDO', 2, t.chave)]);
  assert.strictEqual(cls.classificacao, 'NAO_AUDITAVEL');
});

test('tunel sem informacao (sem status) -> INCOMPLETO residual, nunca verde', () => {
  const t = { chave: 'X|MIKE1|', statusClassificacao: undefined };
  assert.strictEqual(SaudeTuneis.classificarTunel(t, []).classificacao, 'INCOMPLETO');
});

// ---------- Orfaos / Duplicados / Fragmentados ----------
test('conta ocorrencias orfas (conteudo sem MIKE)', () => {
  const n = SaudeTuneis.contarOcorrenciasOrfas([
    diag('CRITICO', 'OCORRENCIA_ORFA', 4), diag('CRITICO', 'OCORRENCIA_ORFA', 7), diag('ALERTA', 'X', 9)
  ]);
  assert.strictEqual(n, 2);
});

test('detecta tuneis duplicados por BOE e por DATA', () => {
  const mapa = {
    A: mikeEntry('26E100', ['BOE1', 'BOE2'], ['15/07/2026'], [{ linha: 2, chave: 'a|26E100|BOE1' }, { linha: 3, chave: 'a|26E100|BOE2' }]),
    B: mikeEntry('26E200', ['BOE3'], ['15/07/2026', '16/07/2026'], [{ linha: 5, chave: 'b|26E200|BOE3' }])
  };
  const d = SaudeTuneis.detectarDuplicados(mapa);
  assert.strictEqual(d.length, 2);
  assert.strictEqual(d[0].tipo, 'BOE');
  assert.strictEqual(d[1].tipo, 'DATA');
});

test('detecta tunel fragmentado (mesma data/BOE, chaves diferentes)', () => {
  const mapa = {
    A: mikeEntry('26E100', ['BOE1'], ['15/07/2026'], [
      { linha: 2, chave: '15/07/2026|26E100|BOE1' },
      { linha: 3, chave: 'DateObj|26E100|BOE1' }
    ])
  };
  const f = SaudeTuneis.detectarFragmentados(mapa);
  assert.strictEqual(f.length, 1);
  assert.strictEqual(f[0].mike, '26E100');
  assert.deepStrictEqual(f[0].linhas, [2, 3]);
});

test('MIKE com 2 chaves por BOEs diferentes NAO e fragmentado (e duplicado)', () => {
  const mapa = {
    A: mikeEntry('26E100', ['BOE1', 'BOE2'], ['15/07/2026'], [
      { linha: 2, chave: 'a|26E100|BOE1' }, { linha: 3, chave: 'a|26E100|BOE2' }
    ])
  };
  assert.strictEqual(SaudeTuneis.detectarFragmentados(mapa).length, 0);
  assert.strictEqual(SaudeTuneis.detectarDuplicados(mapa).length, 1);
});

// ---------- Quadro agregado ----------
test('montarQuadroSaude contabiliza os 5 estados corretamente', () => {
  const tuneis = {
    'S|M1|B': Object.assign(tunelValido('S|M1|B'), { statusClassificacao: 'VALIDO' }),
    'A|M2|B': Object.assign(tunelValido('A|M2|B'), { statusClassificacao: 'VALIDO' }),
    'C|M3|B': Object.assign(tunelValido('C|M3|B'), { statusClassificacao: 'VALIDO' }),
    'I|M4|B': Object.assign(tunelValido('I|M4|B'), { statusClassificacao: 'INVALIDO_SEM_FATOS' }),
    'N|M5|B': Object.assign(tunelValido('N|M5|B'), { statusClassificacao: 'VALIDO' })
  };
  const diagnosticos = [
    diag('CRITICO', 'TUNEL_SEM_EQUIPE', 2, 'C|M3|B'),
    diag('ALERTA', 'RATEIO_PONTOS_INCOERENTE', 3, 'A|M2|B'),
    diag('OBSERVACAO', 'FATO_NAO_AUDITAVEL_AUTOMATICAMENTE', 2, 'N|M5|B'),
    diag('CRITICO', 'OCORRENCIA_ORFA', 9)
  ];
  const quadro = SaudeTuneis.montarQuadroSaude(tuneis, {}, diagnosticos);
  assert.deepStrictEqual(quadro.contagem, {
    total: 5, saudaveis: 1, alertas: 1, criticos: 1, incompletos: 1, naoAuditaveis: 1
  });
  assert.strictEqual(quadro.orfaos.ocorrenciasSemMike, 1);
  assert.ok(quadro.tuneis.every(t => ['SAUDAVEL', 'ALERTA', 'CRITICO', 'INCOMPLETO', 'NAO_AUDITAVEL'].includes(t.classificacao)));
});

test('quadro expoe linhas envolvidas e codigos por tunel', () => {
  const t = tunelValido('X|M1|B');
  const quadro = SaudeTuneis.montarQuadroSaude({ 'X|M1|B': t }, {}, [diag('ALERTA', 'FORMULA_AUSENTE', 3, 'X|M1|B')]);
  const item = quadro.tuneis[0];
  assert.ok(item.linhas.includes(3));
  assert.ok(item.codigos.includes('FORMULA_AUSENTE'));
});

test('quadro vazio (sem tuneis) nao estoura', () => {
  const quadro = SaudeTuneis.montarQuadroSaude({}, {}, []);
  assert.strictEqual(quadro.contagem.total, 0);
  assert.deepStrictEqual(quadro.duplicados, []);
  assert.deepStrictEqual(quadro.fragmentados, []);
});

console.log(`\nRESULTADOS FINAIS: ${sucessos} PASS / ${falhas} FAIL`);
if (falhas > 0) process.exit(1);
}
