'use strict';
const assert = require('assert');
const path = require('path');

const AdaptadorConsultaArca = require('../Dominio/ARCA/AdaptadorConsultaArca');
const { RegrasQualidade, SEVERIDADES_GUARDIAO } = require('../Core/RegrasQualidade');
const GuardiaoQualidade = require('../Features/GuardiaoQualidade');
const UtilsMod = require('../Core/Utils');
global.SyntheonUtils = UtilsMod.SyntheonUtils || UtilsMod;
global.RegrasQualidade = RegrasQualidade;
global.SEVERIDADES_GUARDIAO = SEVERIDADES_GUARDIAO;

console.log('🧪 Iniciando Testes Unitários de Integração: Guardião da Qualidade x ARCA (TASK: ARCA-GUARDIAN-INTEGRATION-001)...\n');

let sucessos = 0;
function test(nome, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${nome}`);
    sucessos++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${nome}:`, err.stack);
    process.exitCode = 1;
  }
}

// Teste A: Lookup de rule_id existente retorna metadados corretos
test('Teste A: lookup de rule_id existente retorna metadados corretos da ARCA', () => {
  const meta = AdaptadorConsultaArca.consultarPorRuleId('ARCA-PIP-001');
  assert.strictEqual(meta.status, 'MAPPED');
  assert.strictEqual(meta.rule_id, 'ARCA-PIP-001');
  assert.strictEqual(meta.subdominio, 'pip');
  assert.strictEqual(meta.tipo_regra, 'OFFICIAL_BUSINESS_RULE');
  assert.strictEqual(meta.fonte_status, 'CANONICAL_SOURCE_CONFIRMED');
  assert.strictEqual(meta.is_official, true);
  assert.ok(meta.expected_rule_summary.length > 0);
});

// Teste B: Código sem mapeamento preserva diagnóstico e marca ARCA_RULE_NOT_MAPPED
test('Teste B: código sem mapeamento na ARCA marca status ARCA_RULE_NOT_MAPPED sem quebrar', () => {
  const diag = RegrasQualidade.criarDiagnostico({
    severidade: SEVERIDADES_GUARDIAO.ALERTA,
    codigoRegra: 'CODIGO_INEXISTENTE_XYZ',
    diagnostico: 'Diagnóstico de teste sem regra na ARCA'
  });
  assert.strictEqual(diag.codigoRegra, 'CODIGO_INEXISTENTE_XYZ');
  assert.strictEqual(diag.diagnostico, 'Diagnóstico de teste sem regra na ARCA');
  assert.ok(diag.arca);
  assert.strictEqual(diag.arca.status, 'ARCA_RULE_NOT_MAPPED');
  assert.strictEqual(diag.arca.is_official, false);
});

// Teste C: HEURISTIC / DOMAIN_RULE_SOURCE_UNKNOWN é exibida como NÃO oficial
test('Teste C: HEURISTIC ou DOMAIN_RULE_SOURCE_UNKNOWN nunca recebe is_official: true', () => {
  const diagDrogas = RegrasQualidade.criarDiagnostico({
    severidade: SEVERIDADES_GUARDIAO.ALERTA,
    codigoRegra: 'FATO_MACONHA_AUSENTE',
    diagnostico: 'Indicador de maconha sem fato'
  });
  assert.strictEqual(diagDrogas.arca.rule_id, 'ARCA-DROGAS-001');
  assert.strictEqual(diagDrogas.arca.source_status, 'DOMAIN_RULE_SOURCE_UNKNOWN');
  assert.strictEqual(diagDrogas.arca.rule_type, 'HEURISTIC');
  assert.strictEqual(diagDrogas.arca.is_official, false, 'Heurística NUNCA pode ter is_official: true');

  const diagMikeSuspeito = RegrasQualidade.criarDiagnostico({
    severidade: SEVERIDADES_GUARDIAO.ALERTA,
    codigoRegra: 'MIKE_SUSPEITO',
    diagnostico: 'MIKE suspeito'
  });
  assert.strictEqual(diagMikeSuspeito.arca.rule_id, 'ARCA-MIKE-003');
  assert.strictEqual(diagMikeSuspeito.arca.is_official, false);
});

// Teste D: Fail-soft com ARCA ausente ou JSON corrompido
test('Teste D: ARCA com arquivo inexistente opera em fail-soft com ARCA_METADATA_UNAVAILABLE', () => {
  AdaptadorConsultaArca.configurarCaminho(path.join(__dirname, 'caminho_inexistente_arca.json'));
  try {
    const diag = RegrasQualidade.criarDiagnostico({
      severidade: SEVERIDADES_GUARDIAO.ALERTA,
      codigoRegra: 'RATEIO_PONTOS_INCOERENTE',
      diagnostico: 'Rateio incoerente'
    });
    assert.strictEqual(diag.codigoRegra, 'RATEIO_PONTOS_INCOERENTE');
    assert.strictEqual(diag.diagnostico, 'Rateio incoerente');
    assert.ok(diag.arca);
    assert.strictEqual(diag.arca.status, 'ARCA_METADATA_UNAVAILABLE');
    assert.strictEqual(diag.arca.is_official, false);
  } finally {
    AdaptadorConsultaArca.configurarCaminho(null); // Restaura caminho padrão
    AdaptadorConsultaArca.limparCache();
  }
});

// Teste E: Integração é estritamente somente leitura (Object.freeze)
test('Teste E: objetos retornados pela ARCA são congelados contra mutações (Read-Only)', () => {
  const meta = AdaptadorConsultaArca.consultarPorRuleId('ARCA-PIP-001');
  assert.ok(Object.isFrozen(meta));
  assert.throws(() => {
    meta.titulo = 'Tentativa de alteracao';
  }, /Cannot assign to read only property/);
});

// Teste F: Baseline comportamental antes/depois é preservado identicamente
test('Teste F: baseline de campos fundamentais do diagnóstico permanece idêntico', () => {
  const diag = RegrasQualidade.criarDiagnostico({
    severidade: SEVERIDADES_GUARDIAO.CRITICO,
    codigoRegra: 'TUNEL_SEM_EQUIPE',
    linha: 10,
    tunel: '14/07/2026|M123|B456',
    camada: 'SEMANTICA',
    diagnostico: 'Túnel sem equipe',
    evidencia: 'Zero policiais',
    acaoRecomendada: 'Adicionar policial',
    sugestaoCorrecao: 'Preencher AD',
    condicaoExcecaoManual: false
  });

  assert.strictEqual(diag.severidade, SEVERIDADES_GUARDIAO.CRITICO);
  assert.strictEqual(diag.codigoRegra, 'TUNEL_SEM_EQUIPE');
  assert.strictEqual(diag.linha, 10);
  assert.strictEqual(diag.tunel, '14/07/2026|M123|B456');
  assert.strictEqual(diag.camada, 'SEMANTICA');
  assert.strictEqual(diag.diagnostico, 'Túnel sem equipe');
  assert.strictEqual(diag.evidencia, 'Zero policiais');
  assert.strictEqual(diag.acaoRecomendada, 'Adicionar policial');
  assert.strictEqual(diag.sugestaoCorrecao, 'Preencher AD');
  assert.strictEqual(diag.condicaoExcecaoManual, false);

  // Propriedade aditiva ARCA
  assert.ok(diag.arca);
  assert.strictEqual(diag.arca.status, 'ENRICHED');
  assert.strictEqual(diag.arca.rule_id, 'ARCA-OCORRENCIA-003');
  assert.strictEqual(diag.arca.rule_type, 'INTERNAL_OPERATIONAL_RULE');
});

// Teste G: Mapeamento amplo de códigos do Guardião
test('Teste G: matriz de mapeamento cobre as regras operacionais principais', () => {
  const mapa = AdaptadorConsultaArca.MAPA_DIAGNOSTICO_ARCA;
  const codigos = Object.keys(mapa);
  assert.ok(codigos.length >= 25, `Esperado >= 25 códigos mapeados, obtido ${codigos.length}`);

  // Verifica que cada rule_id mapeado realmente existe na ARCA
  const arca = AdaptadorConsultaArca.carregarArca();
  assert.ok(arca && arca.regrasPorId);

  codigos.forEach(cod => {
    const rId = mapa[cod];
    assert.ok(arca.regrasPorId[rId], `rule_id ${rId} mapeado para ${cod} não existe na ARCA!`);
  });
});

console.log(`\n🎉 Testes de Integração Guardião x ARCA concluídos: ${sucessos} testes passaram!\n`);
