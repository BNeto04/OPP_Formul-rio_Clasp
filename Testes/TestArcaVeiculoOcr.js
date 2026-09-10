'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/TestArcaVeiculoOcr.js
 * DESCRICAO: Reconciliacao da regra canonica de veiculo na ARCA (card #137 OCR-ARCA-003).
 *
 * O que este teste protege:
 *  1. `ARCA-VEICULO-001` existe no catalogo com proveniencia, consumidores e limites explicitos;
 *  2. **nenhuma heuristica de OCR foi promovida a regra oficial** (tipo != OFFICIAL_BUSINESS_RULE e o texto
 *     da regra NAO carrega a regex/lista lexical do parser);
 *  3. a fronteira esta declarada: ARCA rege a CONDICAO de dominio, o parser realiza a leitura do BO;
 *  4. a defesa anti-falso-positivo permanece documentada (narrativa solta e natureza sem recuperacao);
 *  5. a porta canonica funciona de fato: `AdaptadorConsultaArca.consultarPorRuleId('ARCA-VEICULO-001')`
 *     devolve a regra a partir do JSON real;
 *  6. o consumo honesto: o formulario ainda NAO consome (REAL_CODE_CONSUMER vazio) e a integracao esta
 *     declarada como PLANEJADO (#138).
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('Iniciando Testes: ARCA x Veiculo/OCR (OCR-ARCA-003 / #137)...\n');

let passou = 0, falhou = 0;
function test(nome, fn) {
  try { fn(); console.log(`  [PASS] ${nome}`); passou++; }
  catch (e) { console.error(`  [FAIL] ${nome}:`, e.message); falhou++; }
}

const REPO = path.join(__dirname, '..');
const ARCA = JSON.parse(fs.readFileSync(path.join(REPO, 'Dominio/ARCA/arca_regras_dominio.json'), 'utf8'));
const regra = (ARCA.regras || []).find(r => r.rule_id === 'ARCA-VEICULO-001');

test('ARCA-VEICULO-001 existe no catalogo e na reconciliacao (#137)', () => {
  assert.ok(regra, 'regra ARCA-VEICULO-001 ausente do catalogo');
  assert.strictEqual(regra.subdominio, 'veiculo');
  assert.strictEqual(regra.categoria, 'PIP');
  assert.ok((ARCA.meta.cobertura_reconciliacao.regras_adicionadas_total || []).indexOf('ARCA-VEICULO-001') !== -1,
    'regra nao registrada em regras_adicionadas_total');
});

test('proveniencia e limites declarados (fonte, evidencias, auditabilidade com motivo)', () => {
  assert.ok(Array.isArray(regra.fontes) && regra.fontes.length >= 2, 'fontes insuficientes');
  assert.ok(regra.fontes.some(f => f.tipo === 'CATALOGO_OFICIAL'), 'falta a fonte do rotulo oficial da Tabela PIP');
  assert.ok(regra.fontes.some(f => f.tipo === 'DOCUMENTACAO_INTERNA'), 'falta a fonte documental interna');
  assert.ok(regra.evidencia_codigo.length > 0 && regra.evidencia_testes.length > 0, 'sem evidencia de codigo/teste');
  assert.strictEqual(regra.auditabilidade_guardiao.status, 'NAO_AUDITAVEL');
  assert.ok(regra.auditabilidade_guardiao.motivo.length > 20, 'motivo de NAO_AUDITAVEL ausente/curto');
});

test('NENHUMA heuristica de OCR foi promovida a regra oficial', () => {
  assert.notStrictEqual(regra.tipo_regra, 'OFFICIAL_BUSINESS_RULE',
    'heuristica de OCR nao pode virar regra oficial');
  assert.ok(['INTERNAL_OPERATIONAL_RULE', 'TECHNICAL_RULE'].indexOf(regra.tipo_regra) !== -1,
    'tipo de regra inesperado: ' + regra.tipo_regra);
  // o texto canonico NAO pode carregar a regex/lista lexical do parser
  const texto = JSON.stringify([regra.condicao, regra.descricao_humana, regra.excecoes, regra.parametros]);
  ['[CÇ]', '[AÃ]', '\\\\b', '\\.\\*', '(?:'].forEach(function (fragmentoRegex) {
    assert.strictEqual(texto.indexOf(fragmentoRegex), -1,
      'a regra carrega fragmento de regex do parser: ' + fragmentoRegex);
  });
});

test('fronteira declarada: ARCA = condicao de dominio; parser = leitura do BO e casagem lexical', () => {
  const tudo = JSON.stringify(regra);
  assert.ok(/parser/i.test(tudo), 'a fronteira com o parser nao esta declarada na regra');
  assert.ok(/heuristica/i.test(tudo), 'a regra nao declara que a realizacao lexical e heuristica de OCR');
  assert.ok(/narrativa/i.test(JSON.stringify(regra.excecoes)), 'falta a proibicao de inferir pela narrativa');
  assert.ok(/ROUBO DE VEICULO|ROUBO DE VEÍCULO/.test(JSON.stringify(regra.excecoes)),
    'falta o exemplo negativo de natureza sem recuperacao');
});

test('a condicao canonica admite substantivo (ROUBO/FURTO) E adjetivo (ROUBADO/FURTADO)', () => {
  const c = regra.condicao;
  ['ROUBO', 'FURTO', 'ROUBADO', 'FURTADO'].forEach(function (forma) {
    assert.ok(c.indexOf(forma) !== -1, 'condicao nao cobre a forma: ' + forma);
  });
  ['RECUPERACAO', 'APREENSAO', 'LOCALIZACAO'].forEach(function (termo) {
    assert.ok(c.indexOf(termo) !== -1, 'condicao sem termo de recuperacao: ' + termo);
  });
  assert.ok(/MESMA string/.test(c), 'a condicao precisa exigir os termos na mesma string');
});

test('porta canonica responde: consultarPorRuleId devolve a regra a partir do JSON real', () => {
  const mod = require(path.join(REPO, 'Dominio/ARCA/AdaptadorConsultaArca.js'));
  const Adaptador = mod.AdaptadorConsultaArca || mod.default || mod; // este modulo exporta a classe direto
  assert.ok(Adaptador, 'AdaptadorConsultaArca nao exportado para o Node');
  const viaPorta = Adaptador.consultarPorRuleId('ARCA-VEICULO-001');
  assert.ok(viaPorta, 'a porta canonica nao devolveu a regra');
  assert.strictEqual(viaPorta.rule_id, 'ARCA-VEICULO-001');
});

test('consumo REAL integrado no #138 (formulario + servidor), sem lista declarada inventada', () => {
  assert.deepStrictEqual(regra.consumidores.REAL_CODE_CONSUMER.sort(),
    ['Entrada/EntradaManual.js', 'Entrada/Formulario.html'].sort(), 'consumidores reais do #138');
  assert.deepStrictEqual(regra.consumidores.PLANNED_CONSUMER, [], 'nada mais planejado: integracao concluida no #138');
  assert.deepStrictEqual(regra.consumidores.DECLARED_CONSUMER, [], 'regra NOVA nao tem lista declarada historica (#125 preservado)');
  assert.ok(/consultarPorRuleId/.test(regra.consumidores.OBSERVACAO), 'a observacao deve registrar a porta canonica');
});

test('porta do servidor (obterMetadadosArcaVeiculo) entrega metadados canonicos e e fail-soft', () => {
  const fonte = fs.readFileSync(path.join(REPO, 'Entrada/EntradaManual.js'), 'utf8');
  const trecho = fonte.slice(fonte.indexOf('function obterMetadadosArcaVeiculo()'));
  assert.ok(trecho.length > 0, 'funcao obterMetadadosArcaVeiculo ausente do EntradaManual.js');
  const Adaptador = require(path.join(REPO, 'Dominio/ARCA/AdaptadorConsultaArca.js'));
  const original = global.AdaptadorConsultaArca;
  try {
    // caminho feliz: metadados reais vindos do JSON pela porta canonica
    global.AdaptadorConsultaArca = Adaptador;
    const fn = new Function(trecho.slice(0, trecho.indexOf('\n}') + 2) + '\nreturn obterMetadadosArcaVeiculo;')();
    const meta = fn();
    assert.strictEqual(meta.ok, true, 'porta deveria responder ok com o adaptador disponivel');
    assert.strictEqual(meta.rule_id, 'ARCA-VEICULO-001');
    assert.strictEqual(meta.titulo_pip, 'Apreensão de veículo furtado ou roubado',
      'o rotulo canonico deve vir da regra ARCA, nao de constante local');
    // fail-soft: sem o adaptador, devolve motivo e NAO lanca
    delete global.AdaptadorConsultaArca;
    const semArca = fn();
    assert.strictEqual(semArca.ok, false);
    assert.strictEqual(semArca.motivo, 'ARCA_METADATA_UNAVAILABLE');
    assert.strictEqual(semArca.titulo_pip, null);
  } finally {
    if (original === undefined) delete global.AdaptadorConsultaArca; else global.AdaptadorConsultaArca = original;
  }
});

test('o parser consome a porta canonica e mantem o fallback local no Formulario.html', () => {
  const html = fs.readFileSync(path.join(REPO, 'Entrada/Formulario.html'), 'utf8');
  assert.ok(html.indexOf('tituloCanonicoVeiculoArca_()') !== -1, 'o parser nao usa o rotulo canonico da ARCA');
  assert.ok(html.indexOf('carregarMetadadosArcaVeiculo_') !== -1, 'falta o carregador de metadados da ARCA');
  assert.ok(html.indexOf('ROTULO_VEICULO_LOCAL') !== -1, 'falta o rotulo local de fallback (fail-soft)');
  assert.ok(html.indexOf('obterMetadadosArcaVeiculo') !== -1, 'o cliente nao chama a porta do servidor');
});

test('o catalogo NAO duplicou a heuristica: existe apenas uma regra de veiculo', () => {
  const deVeiculo = (ARCA.regras || []).filter(r => r.subdominio === 'veiculo');
  assert.strictEqual(deVeiculo.length, 1, 'mais de uma regra de veiculo no catalogo: ' + deVeiculo.map(r => r.rule_id).join(', '));
});

console.log(`\nRESULTADOS FINAIS: ${passou} PASS / ${falhou} FAIL`);
if (falhou > 0) process.exitCode = 1;
}
