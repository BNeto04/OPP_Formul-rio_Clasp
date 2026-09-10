'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/TestContratoMutacaoSegura.js
 * DESCRICAO: Suite do Contrato de Mutacao Segura (G01-006 / #118).
 * Prova: classificacao AUTO_FIX|CONFIRM_FIX|MANUAL_ONLY, whitelist/blacklist, politica de formula,
 * cobertura do contrato sobre TODOS os codigos reais do Guardiao, validacao de proposta/plano,
 * portao de autorizacao (kill-switch/lock/dry-run/snapshot/reauditoria) e ausencia de escrita.
 */

const assert = require('assert');
const { ContratoMutacaoSegura } = require('../Core/ContratoMutacaoSegura');
const fs = require('fs');
const path = require('path');

console.log('Iniciando Testes: Contrato de Mutacao Segura do Normalizador (G01-006 / #118)...\n');

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

const C = ContratoMutacaoSegura;
const diagFormula = (extra) => Object.assign({
  codigoRegra: 'FORMULA_AUSENTE', aba: 'ago.2026', linha: 42, coluna: 'FORMULA',
  severidade: 'ALERTA', camada: 'ESTRUTURAL', tunel: 'MIKE-1',
  diagnostico: 'Formula ausente na coluna calculada.', evidencia: 'Celula vazia em vez de =SOMA(...)'
}, extra || {});

const ctxValido = { fonteCanonica: true, contextoCompativel: true, padraoComprovado: true, reauditoriaImediata: true, valorProposto: '=SOMA(A2:A5)', valorAtual: '', justificativa: 'Restaurar formula canonica do rateio.' };
const arcaOk = { rule_id: 'ARCA-PIP-001', status: 'MAPPED', fonte_status: 'CANONICAL_SOURCE_CONFIRMED' };

// ---------- 1. politica de formula ----------
test('formula sem contexto comprovado e CONFIRM_FIX (padrao do contrato)', () => {
  const c = C.classificar(diagFormula(), {});
  assert.strictEqual(c.classe, 'CONFIRM_FIX');
  assert.strictEqual(c.mutavel, true);
  assert.strictEqual(c.tipo_acao, 'RESTAURAR_FORMULA');
  assert.ok(c.motivos.some(m => m.indexOf('CONDICOES_AUSENTES') === 0), 'deve apontar as condicoes ausentes');
});

test('formula vira AUTO_FIX somente com as 4 condicoes comprovadas', () => {
  const c = C.classificar(diagFormula(), ctxValido);
  assert.strictEqual(c.classe, 'AUTO_FIX');
});

test('formula com 3 de 4 condicoes continua CONFIRM_FIX e diz qual falta', () => {
  const ctx = Object.assign({}, ctxValido, { reauditoriaImediata: false });
  const c = C.classificar(diagFormula(), ctx);
  assert.strictEqual(c.classe, 'CONFIRM_FIX');
  assert.ok(c.motivos.some(m => m.indexOf('REAUDITORIA_IMEDIATA') !== -1), 'motivo deve citar REAUDITORIA_IMEDIATA');
});

// ---------- 2. blacklist dura ----------
test('blacklist: nenhum campo operacional sensivel pode ser mutado', () => {
  C.BLACKLIST().forEach(campo => {
    const c = C.classificar(diagFormula({ coluna: campo }), ctxValido);
    assert.strictEqual(c.classe, 'MANUAL_ONLY', `campo ${campo} deveria ser MANUAL_ONLY`);
    assert.strictEqual(c.mutavel, false);
  });
});

test('blacklist pega campos compostos reais da planilha (QTD ARMAS, PONTOS PIP, MIKE OPERACIONAL)', () => {
  ['QTD ARMAS', 'PONTOS PIP', 'MIKE OPERACIONAL', 'MATRICULA POLICIAL'].forEach(campo => {
    assert.ok(C.campoBloqueado(campo), `${campo} deveria estar bloqueado`);
    assert.strictEqual(C.classificar(diagFormula({ coluna: campo }), ctxValido).classe, 'MANUAL_ONLY');
  });
});

// ---------- 3. fonte nao canonica nunca promove ----------
test('fonte HEURISTIC/UNKNOWN nunca e promovida (vira MANUAL_ONLY)', () => {
  ['HEURISTIC', 'HEURISTICA', 'UNKNOWN', 'DESCONHECIDA'].forEach(fonte => {
    const c = C.classificar(diagFormula(), Object.assign({}, ctxValido, { fonte: fonte }));
    assert.strictEqual(c.classe, 'MANUAL_ONLY', `fonte ${fonte} deveria bloquear`);
  });
});

// ---------- 4. cobertura do contrato sobre a realidade ----------
test('todos os 29 codigos reais do Guardiao estao cobertos pelo contrato (nenhum desconhecido)', () => {
  const codigosReais = ['TUNEL_SEM_FATOS', 'TUNEL_SEM_EQUIPE', 'TUNEL_FRAGMENTADO', 'RATEIO_PONTOS_INCOERENTE',
    'POLICIAL_SEM_NOME', 'OCORRENCIA_ORFA', 'MODO_LIMITADO_CATALOGO_PIP', 'MIKE_SUSPEITO', 'MIKE_DATAS_DIVERGENTES',
    'MIKE_DATA_DIVERGENTE', 'MIKE_BOE_DIVERGENTE', 'MERITO_ARMAS_EMPATE_ANTIGUIDADE', 'MERITO_ARMAS_ANTIGUIDADE_AUSENTE',
    'MATRICULA_MULTIPLAS_OCORRENCIAS_MESMA_DATA', 'MATRICULA_AUSENTE', 'INDICADOR_DESCONHECIDO', 'IMPUTADO_SEM_EVENTO_AH',
    'IMPUTADO_INVALIDO', 'FORMULA_CORROMPIDA_ERRO_SINTAXE', 'FORMULA_AUSENTE', 'FATO_NAO_AUDITAVEL_AUTOMATICAMENTE',
    'FATO_MUNICAO_AUSENTE', 'FATO_MACONHA_AUSENTE', 'FATO_CRACK_AUSENTE', 'FATO_COCAINA_AUSENTE', 'FATO_ARMA_AUSENTE',
    'EXCECAO_MANUAL_JUSTIFICADA', 'EVENTO_INCOMPLETO_AG', 'ANTIGUIDADE_FONTE_NAO_LOCALIZADA'];
  assert.strictEqual(codigosReais.length, 29);
  const desconhecidos = [];
  const mutaveis = [];
  codigosReais.forEach(codigo => {
    const c = C.classificar(diagFormula({ codigoRegra: codigo }), ctxValido);
    if (c.motivos.indexOf('CODIGO_DESCONHECIDO_NO_CONTRATO') !== -1) desconhecidos.push(codigo);
    if (c.mutavel) mutaveis.push(codigo);
  });
  assert.deepStrictEqual(desconhecidos, [], 'codigos reais sem classificacao explicita: ' + desconhecidos.join(', '));
  assert.deepStrictEqual(mutaveis.sort(), ['FORMULA_AUSENTE', 'FORMULA_CORROMPIDA_ERRO_SINTAXE', 'RATEIO_PONTOS_INCOERENTE'], 'somente correcoes de formula podem ser mutaveis hoje');
});

test('codigo real proibido explica o motivo (MIKE_BOE_DIVERGENTE)', () => {
  const c = C.classificar(diagFormula({ codigoRegra: 'MIKE_BOE_DIVERGENTE' }), ctxValido);
  assert.strictEqual(c.classe, 'MANUAL_ONLY');
  assert.ok(c.motivos.some(m => m.indexOf('NAO_CORRIGIVEL') !== -1));
});

// ---------- 5. proposta e validacao ----------
test('proposta CONFIRM_FIX valida carrega trilha completa e exige confirmacao do operador', () => {
  const ctxPadrao = { valorProposto: '=SOMA(A2:A5)', valorAtual: '', justificativa: 'Restaurar formula canonica do rateio.', arca: arcaOk };
  const p = C.construirProposta(diagFormula(), ctxPadrao);
  assert.strictEqual(p.classe, 'CONFIRM_FIX');
  assert.strictEqual(p.regra_arca.rule_id, 'ARCA-PIP-001');
  assert.ok(p.exigencias.indexOf('CONFIRMACAO_DO_OPERADOR') !== -1);
  ['DRY_RUN_OBRIGATORIO', 'LOCK_SINGLE_FLIGHT', 'SNAPSHOT_ANTES', 'REAUDITORIA_APOS', 'LOG_ANTES_DEPOIS'].forEach(ex => {
    assert.ok(p.exigencias.indexOf(ex) !== -1, 'exigencia ausente: ' + ex);
  });
  assert.strictEqual(p.diagnostico_origem.codigoRegra, 'FORMULA_AUSENTE');
  const v = C.validarProposta(p);
  assert.strictEqual(v.valida, true, 'bloqueios: ' + v.bloqueios.join(', '));
});

test('proposta AUTO_FIX sem as condicoes registradas e rejeitada', () => {
  const p = C.construirProposta(diagFormula(), Object.assign({}, ctxValido, { arca: arcaOk }));
  p.classe = 'AUTO_FIX';
  p.condicoes_auto_fix = { fonteCanonica: true, contextoCompativel: false, padraoComprovado: false, reauditoriaImediata: true };
  const v = C.validarProposta(p);
  assert.strictEqual(v.valida, false);
  assert.ok(v.bloqueios.some(b => b.indexOf('AUTO_FIX_SEM_CONDICOES') === 0));
});

test('proposta MANUAL_ONLY nunca e validada como mutacao', () => {
  const p = C.construirProposta(diagFormula({ coluna: 'MATRICULA' }), ctxValido);
  assert.strictEqual(p.classe, 'MANUAL_ONLY');
  const v = C.validarProposta(p);
  assert.strictEqual(v.valida, false);
  assert.ok(v.bloqueios.indexOf('MUTACAO_MANUAL_ONLY_PROIBIDA') !== -1);
});

test('janela operacional: coluna de alerta (AM) e colunas fora de A:AL sao bloqueadas', () => {
  const base = C.construirProposta(diagFormula(), Object.assign({}, ctxValido, { arca: arcaOk }));
  const alerta = Object.assign({}, base, { coluna: 'AM' });
  assert.ok(C.validarProposta(alerta).bloqueios.indexOf('PROIBIDO_ALTERAR_COLUNA_DE_ALERTA') !== -1);
  const fora = Object.assign({}, base, { coluna: 'BN' });
  assert.ok(C.validarProposta(fora).bloqueios.indexOf('FORA_DA_JANELA_OPERACIONAL') !== -1);
});

test('trilha obrigatoria: sem valor, sem justificativa, sem ARCA e tipo fora da whitelist', () => {
  const base = C.construirProposta(diagFormula(), Object.assign({}, ctxValido, { arca: arcaOk }));
  assert.ok(C.validarProposta(Object.assign({}, base, { valor_proposto: '' })).bloqueios.indexOf('SEM_VALOR_PROPOSTO') !== -1);
  assert.ok(C.validarProposta(Object.assign({}, base, { justificativa: '   ' })).bloqueios.indexOf('SEM_JUSTIFICATIVA') !== -1);
  assert.ok(C.validarProposta(Object.assign({}, base, { regra_arca: null })).bloqueios.indexOf('SEM_REGRA_ARCA_OU_LACUNA_EXPLICITA') !== -1);
  const comLacuna = Object.assign({}, base, { regra_arca: null, lacuna_arca_explicita: true });
  assert.strictEqual(C.validarProposta(comLacuna).bloqueios.indexOf('SEM_REGRA_ARCA_OU_LACUNA_EXPLICITA'), -1);
  const tipoErrado = Object.assign({}, base, { classe: 'AUTO_FIX', tipo_acao: 'AJUSTAR_FORMATACAO' });
  assert.ok(C.validarProposta(tipoErrado).bloqueios.some(b => b.indexOf('TIPO_ACAO_FORA_DA_WHITELIST') === 0));
});

test('id da proposta e deterministico (idempotencia do plano)', () => {
  const a = C.construirProposta(diagFormula(), ctxValido);
  const b = C.construirProposta(diagFormula(), {});
  assert.strictEqual(a.id, b.id);
});

// ---------- 6. plano e autorizacao ----------
test('plano separa mutaveis de bloqueadas e nunca coloca MANUAL_ONLY em mutaveis', () => {
  const ok = C.construirProposta(diagFormula(), Object.assign({}, ctxValido, { arca: arcaOk }));
  const auto = C.construirProposta(diagFormula({ linha: 43 }), Object.assign({}, ctxValido, { arca: arcaOk }));
  const proibida = C.construirProposta(diagFormula({ coluna: 'MATRICULA', linha: 44 }), ctxValido);
  const plano = C.planejar([ok, auto, proibida]);
  assert.strictEqual(plano.total, 3);
  assert.strictEqual(plano.por_classe.MANUAL_ONLY, 1);
  assert.strictEqual(plano.mutaveis.length, 2);
  assert.ok(plano.bloqueadas.every(i => i.classe === 'MANUAL_ONLY' || !i.valida));
  assert.ok(plano.mutaveis.every(i => i.classe !== 'MANUAL_ONLY'));
  assert.strictEqual(plano.dry_run, true);
  assert.ok(plano.exigencias_globais.indexOf('NOVOS_ERROS_CRIADOS_IGUAL_ZERO') !== -1);
});

test('porteiro: sem kill-switch/lock/dry-run/snapshot/reauditoria nada e autorizado', () => {
  const p = C.construirProposta(diagFormula(), Object.assign({}, ctxValido, { arca: arcaOk }));
  const plano = C.planejar([p]);
  const negado = C.podeAutorizar(plano, {});
  assert.strictEqual(negado.autorizado, false);
  ['KILL_SWITCH_AUSENTE_OU_ACIONADO', 'LOCK_NAO_ADQUIRIDO', 'DRY_RUN_NAO_EXECUTADO', 'SNAPSHOT_INDISPONIVEL', 'REAUDITORIA_INDISPONIVEL'].forEach(m => {
    assert.ok(negado.motivos.indexOf(m) !== -1, 'motivo ausente: ' + m);
  });
  const ok = C.podeAutorizar(plano, { kill_switch: false, lock_adquirido: true, dry_run_executado: true, snapshot_disponivel: true, reauditoria_disponivel: true });
  assert.strictEqual(ok.autorizado, true, 'motivos: ' + ok.motivos.join(', '));
  const killLigado = C.podeAutorizar(plano, { kill_switch: true, lock_adquirido: true, dry_run_executado: true, snapshot_disponivel: true, reauditoria_disponivel: true });
  assert.strictEqual(killLigado.autorizado, false);
});

// ---------- 7. interfaces e ausencia de escrita ----------
test('interfaces dos cards seguintes declaradas com invariantes (dry-run, lock, rollback, kill-switch, reauditoria)', () => {
  const i = C.INTERFACES();
  ['DRY_RUN', 'LOCK', 'SNAPSHOT_ROLLBACK', 'KILL_SWITCH', 'REAUDITORIA_DELTA'].forEach(k => {
    assert.ok(i[k] && i[k].assinatura, 'interface ausente: ' + k);
    assert.ok(Array.isArray(i[k].invariantes) && i[k].invariantes.length > 0);
  });
  assert.ok(i.DRY_RUN.invariantes.indexOf('NAO_ESCREVE') !== -1);
  assert.ok(i.REAUDITORIA_DELTA.invariantes.indexOf('NOVOS_ERROS_CRIADOS_IGUAL_ZERO') !== -1);
});

test('contrato nao expoe nenhuma funcao de escrita (nucleo puro)', () => {
  const verbos = /^(escrever|gravar|aplicar|salvar|persistir|atualizar|set|update|delete|remove|clear|mutar)/i;
  const metodos = Object.getOwnPropertyNames(C).filter(n => typeof C[n] === 'function');
  const suspeitos = metodos.filter(m => verbos.test(m));
  assert.deepStrictEqual(suspeitos, [], 'metodos de escrita encontrados: ' + suspeitos.join(', '));
  const fonte = fs.readFileSync(path.join(__dirname, '..', 'Core', 'ContratoMutacaoSegura.js'), 'utf8');
  ['SpreadsheetApp', 'setValue', 'setValues', 'setFormula', 'appendRow', 'setBackground'].forEach(api => {
    assert.ok(fonte.indexOf(api) === -1, 'API de escrita encontrada no contrato: ' + api);
  });
});

console.log(`\nRESULTADOS FINAIS: ${sucessos} PASS / ${falhas} FAIL`);
if (falhas > 0) process.exitCode = 1;
}
