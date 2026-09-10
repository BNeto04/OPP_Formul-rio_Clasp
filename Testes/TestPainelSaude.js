'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/TestPainelSaude.js
 * DESCRICAO: Suite do painel de saude + drill-down (G01 #116): resumo por mes, resumo global,
 * hierarquia MES->TUNEL->LINHAS->DIAGNOSTICO com ARCA e priorizacao; compatibilidade quando
 * o retorno nao possui os campos novos (execucao antiga).
 */

const assert = require('assert');
const { PainelSaude } = require('../Render/PainelSaude');
const SeletorMesesGuardiao = require('../Entrada/SeletorMesesGuardiao');

console.log('Iniciando Testes: Painel de Saude do Guardiao (G01 #116)...\n');

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

function resultadoFake() {
  return {
    alertas: 2, linhas: 20, tuneis: 2,
    diagnosticos: [
      { codigoRegra: 'RATEIO_PONTOS_INCOERENTE', severidade: 'ALERTA', linha: 3, tunel: 'A|M1|B', diagnostico: 'Rateio incoerente', evidencia: 'ev', acaoRecomendada: 'ajuste', arca: { id: 'ARCA-1' } },
      { codigoRegra: 'TUNEL_SEM_EQUIPE', severidade: 'CRITICO', linha: 5, tunel: 'B|M2|C', diagnostico: 'Tunel sem equipe', evidencia: 'ev2', acaoRecomendada: 'ajuste2', arca: { status: 'ARCA_RULE_NOT_MAPPED' } }
    ],
    saude: {
      contagem: { total: 2, saudaveis: 0, alertas: 1, criticos: 1, incompletos: 0, naoAuditaveis: 0 },
      tuneis: [
        { chave: 'A|M1|B', mike: 'M1', classificacao: 'ALERTA', motivo: 'DIAGNOSTICO_ALERTA_OU_EXCECAO', codigos: ['RATEIO_PONTOS_INCOERENTE'], linhas: [3] },
        { chave: 'B|M2|C', mike: 'M2', classificacao: 'CRITICO', motivo: 'DIAGNOSTICO_CRITICO_NO_TUNEL', codigos: ['TUNEL_SEM_EQUIPE'], linhas: [5] }
      ],
      orfaos: { ocorrenciasSemMike: 1 },
      duplicados: [{ mike: 'M1' }],
      fragmentados: []
    },
    cobertura: { status: 'PARCIAL', regrasNaoAuditadas: [{ regra: 'VALIDACAO_INDICADOR_PIP', motivo: 'x', tipo: 'LIMITACAO_DE_AUDITORIA' }] }
  };
}

// ---------- Resumo por mes ----------
test('resumo do mes expoe contagens, orfaos, duplicados e cobertura', () => {
  const r = PainelSaude.construirResumoMes('JUL2026', resultadoFake());
  assert.strictEqual(r.mes, 'JUL2026');
  assert.deepStrictEqual(
    [r.tuneisTotal, r.saudaveis, r.alertas, r.criticos, r.incompletos, r.naoAuditaveis],
    [2, 0, 1, 1, 0, 0]
  );
  assert.strictEqual(r.ocorrenciasOrfas, 1);
  assert.strictEqual(r.duplicados, 1);
  assert.strictEqual(r.coberturaStatus, 'PARCIAL');
  assert.deepStrictEqual(r.regrasNaoAuditadas, ['VALIDACAO_INDICADOR_PIP']);
});

test('compatibilidade: resultado sem campos novos nao estoura', () => {
  const r = PainelSaude.construirResumoMes('ANTIGO', { alertas: 0, linhas: 5, tuneis: 0, diagnosticos: [] });
  assert.strictEqual(r.tuneisTotal, 0);
  assert.strictEqual(r.coberturaStatus, 'INDISPONIVEL');
});

// ---------- Resumo global ----------
test('resumo global soma meses e marca meses com cobertura parcial', () => {
  const g = PainelSaude.construirResumoGlobal([
    PainelSaude.construirResumoMes('JUL2026', resultadoFake()),
    Object.assign(PainelSaude.construirResumoMes('AGO2026', resultadoFake()), { coberturaStatus: 'COMPLETA' })
  ]);
  assert.strictEqual(g.total.meses, 2);
  assert.strictEqual(g.total.tuneisTotal, 4);
  assert.strictEqual(g.total.criticos, 2);
  assert.deepStrictEqual(g.mesesNaoAuditados, ['JUL2026']);
});

// ---------- Drill-down ----------
test('drill-down segue MES -> TUNEL -> LINHAS -> DIAGNOSTICO com ARCA', () => {
  const dd = PainelSaude.construirDrillDown('JUL2026', resultadoFake());
  assert.strictEqual(dd.length, 2);
  const critico = dd.find(t => t.classificacao === 'CRITICO');
  assert.strictEqual(critico.mike, 'M2');
  assert.deepStrictEqual(critico.linhas, [5]);
  assert.strictEqual(critico.diagnosticos[0].codigo, 'TUNEL_SEM_EQUIPE');
  assert.strictEqual(critico.diagnosticos[0].arca, 'ARCA_RULE_NOT_MAPPED');
  assert.strictEqual(critico.diagnosticos[0].explicacao, 'Tunel sem equipe');
});

test('drill-down ordena diagnosticos por severidade dentro do tunel', () => {
  const base = resultadoFake();
  base.saude.tuneis = [{ chave: 'A|M1|B', mike: 'M1', classificacao: 'CRITICO', motivo: 'm', codigos: [], linhas: [3, 4] }];
  base.diagnosticos = [
    { codigoRegra: 'OBS', severidade: 'OBSERVACAO', linha: 4, tunel: 'A|M1|B', diagnostico: 'obs' },
    { codigoRegra: 'CRIT', severidade: 'CRITICO', linha: 3, tunel: 'A|M1|B', diagnostico: 'crit' }
  ];
  const dd = PainelSaude.construirDrillDown('M', base);
  assert.deepStrictEqual(dd[0].diagnosticos.map(d => d.codigo), ['CRIT', 'OBS']);
});

test('drill-down sem saude retorna vazio (compativel)', () => {
  assert.deepStrictEqual(PainelSaude.construirDrillDown('M', { diagnosticos: [] }), []);
});

// ---------- Priorizacao e texto ----------
test('prioriza CRITICO > ALERTA > NAO_AUDITAVEL > INCOMPLETO e exclui saudaveis', () => {
  const dd = [
    { mes: 'M', tunel: 't1', classificacao: 'SAUDAVEL', linhas: [], diagnosticos: [] },
    { mes: 'M', tunel: 't2', classificacao: 'INCOMPLETO', linhas: [], diagnosticos: [] },
    { mes: 'M', tunel: 't3', classificacao: 'CRITICO', linhas: [], diagnosticos: [] },
    { mes: 'M', tunel: 't4', classificacao: 'ALERTA', linhas: [], diagnosticos: [] }
  ];
  assert.deepStrictEqual(PainelSaude.listarTuneisPrioritarios(dd, 10).map(t => t.classificacao), ['CRITICO', 'ALERTA', 'INCOMPLETO']);
});

test('texto do painel inclui totais e aviso NAO_AUDITADO', () => {
  const r = PainelSaude.construirResumoMes('JUL2026', resultadoFake());
  const g = PainelSaude.construirResumoGlobal([r]);
  const txt = PainelSaude.formatarPainelTexto([r], g);
  assert.ok(txt.includes('JUL2026'));
  assert.ok(txt.includes('TOTAL GERAL'));
  assert.ok(txt.includes('NAO_AUDITADO'));
});

// ---------- Integracao com o seletor ----------
test('seletor.montarPainel monta painel a partir do consolidado (inclui mes com ERRO)', () => {
  const consolidado = {
    porMes: {
      JUL2026: { status: 'OK', resultado: resultadoFake() },
      AGO2026: { status: 'ERRO', mensagem: 'falha simulada' }
    }
  };
  const painel = SeletorMesesGuardiao.montarPainel(consolidado);
  assert.strictEqual(painel.resumosPorMes.length, 2);
  assert.strictEqual(painel.global.total.meses, 2);
  const mesErro = painel.resumosPorMes.find(r => r.mes === 'AGO2026');
  assert.strictEqual(mesErro.coberturaStatus, 'NAO_AUDITADO');
  assert.ok(painel.texto.includes('NAO_AUDITADO'));
  assert.strictEqual(painel.prioritarios[0].classificacao, 'CRITICO');
});

test('seletor.montarPainel com consolidado vazio nao estoura', () => {
  const painel = SeletorMesesGuardiao.montarPainel({ porMes: {} });
  assert.strictEqual(painel.resumosPorMes.length, 0);
  assert.strictEqual(painel.prioritarios.length, 0);
});

console.log(`\nRESULTADOS FINAIS: ${sucessos} PASS / ${falhas} FAIL`);
if (falhas > 0) process.exit(1);
}
