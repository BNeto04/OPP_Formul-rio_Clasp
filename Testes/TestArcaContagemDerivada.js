'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

/**
 * ARQUIVO: Testes/TestArcaContagemDerivada.js
 * CARD:    #159 [ARCA-COUNT-001] - FECHADURA das contagens da ARCA.
 *
 * O que esta fechadura impede:
 *   qualquer lugar derivado exibir contagem que NAO seja a medida do JSON canonico
 *   (Dominio/ARCA/arca_regras_dominio.json) - seja por numero digitado a mao,
 *   seja por JSON alterado sem regerar os lugares derivados.
 *
 * Como ela funciona (sem reimplementar medicao):
 *   1. executa o gerador/medidor `scripts/downplant/contar-regras-arca.mjs --json`;
 *   2. compara BYTE A BYTE o que o gerador produz com o que esta escrito nos arquivos
 *      (blocos entre marcadores ARCA-*, arquivos gerados por inteiro, no do canvas,
 *      snapshot de metricas);
 *   3. varre os arquivos vivos de catalogo procurando contagem antiga (numero digitado)
 *      fora de regiao historica declarada.
 *
 * Se qualquer um desses pontos divergir, este teste FICA VERMELHO.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const REPO = path.join(__dirname, '..');
const GERADOR = path.join(REPO, 'scripts', 'downplant', 'contar-regras-arca.mjs');

console.log('Iniciando Testes: Fechadura das contagens derivadas da ARCA (#159 ARCA-COUNT-001)...\n');

let sucessos = 0;
let falhas = 0;
function test(nome, fn) {
  try { fn(); console.log(`  [PASS] ${nome}`); sucessos++; }
  catch (err) { console.error(`  [FAIL] ${nome}: ${err.message}`); falhas++; }
}

// --- payload do gerador (fonte do que e "derivado") --------------------------
let payload = null;
try {
  const saida = execFileSync(process.execPath, [GERADOR, '--json'], { cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  payload = JSON.parse(saida);
} catch (err) {
  console.error('  [FAIL] gerador scripts/downplant/contar-regras-arca.mjs nao executou: ' + err.message);
  console.error(`\nRESULTADOS FINAIS: 0 PASS / 1 FAIL`);
  process.exit(1);
}

const k = payload.metricas;
const ler = (rel) => fs.readFileSync(path.join(REPO, rel), 'utf8');
const semCR = (t) => String(t).split('\r\n').join('\n');
const marcadorInicio = (nome) => new RegExp('<!-- ' + nome + ':INICIO[^>]*-->');
const lerBloco = (texto, nome) => {
  const re = new RegExp('<!-- ' + nome + ':INICIO[^>]*-->\\r?\\n([\\s\\S]*?)\\r?\\n?<!-- ' + nome + ':FIM -->');
  const m = texto.match(re);
  return m ? m[1] : null;
};
const faixasHistoricas = (texto) => {
  const faixas = [];
  let i = 0;
  while (i < texto.length) {
    const a = texto.indexOf(payload.historico_inicio, i);
    if (a === -1) break;
    const b = texto.indexOf(payload.historico_fim, a);
    faixas.push([a, b === -1 ? texto.length : b + payload.historico_fim.length]);
    i = b === -1 ? texto.length : b + payload.historico_fim.length;
  }
  return faixas;
};
const dentroDe = (pos, faixas) => faixas.some(([a, b]) => pos >= a && pos < b);

// --- conjuntos publicados pela medicao (numeros que podem aparecer em prosa) --
const publicados = new Set();
[
  Object.values(k),
  Object.values(payload.por_subdominio),
  Object.values(payload.por_tipo),
  Object.values(payload.por_status),
  Object.values(payload.por_fonte)
].forEach((lista) => lista.forEach((v) => { if (typeof v === 'number') publicados.add(String(v)); }));

const CONTAGENS_PROIBIDAS = [
  /\b(31|36|40|41|42|44|45|46|47|48|50|51|52)\s+regras\b/,
  /9 OFFICIAL_BUSINESS/,
  /17 INTERNAL_OPERATIONAL/,
  /\b11\s+canonicas\b/,
  /\b18\s+internas\b/,
  /\b26\s+c[oó]digos\b/,
  /\b20\s+das\s+31\b/,
  /\b20\s+de\s+31\b/,
  /\b11\s+regras\s+sem\s+mapeamento\b/,
  /\b22\s+campos\b/,
  /\bMAPEADO\s*=?\s*29\b/,
  /\b29\s*MAPEADO\b/,
  /\bINTEGRADO\s*=?\s*7\b/
];

// ---------------------------------------------------------------------------
// 1. Sanidade da propria medicao (tudo derivado, nada digitado)
// ---------------------------------------------------------------------------
test('medicao derivada e coerente (somas, unicidade, porta)', () => {
  const soma = (o) => Object.values(o).reduce((a, b) => a + b, 0);
  assert.strictEqual(soma(payload.por_tipo), k.regras_total, 'soma por tipo != regras_total');
  assert.strictEqual(soma(payload.por_status), k.regras_total, 'soma por status != regras_total');
  assert.strictEqual(soma(payload.por_subdominio), k.regras_total, 'soma por subdominio != regras_total');
  assert.strictEqual(k.rule_ids_unicos, k.regras_total, 'rule_id duplicado no catalogo');
  assert.strictEqual(k.regras_mapeadas + k.regras_integradas + k.regras_nao_aplicaveis + k.regras_nao_auditaveis, k.regras_total);
  assert.strictEqual(k.regras_sem_auditoria_guardiao, k.regras_total - k.regras_mapeadas);
  assert.strictEqual(k.regras_sem_regra_na_porta, k.regras_total - k.porta_rule_ids);
  assert.strictEqual(k.codigos_diagnostico, k.codigos_diagnostico_unicos, 'codigo de diagnostico em duas regras');
  assert.strictEqual(k.porta_codigos, k.codigos_diagnostico, 'porta e JSON divergem no numero de codigos');
  assert.ok(k.regras_total > 0 && k.regras_mapeadas > 0);
});

// ---------------------------------------------------------------------------
// 2. Arquivos gerados por inteiro
// ---------------------------------------------------------------------------
Object.entries(payload.arquivos).forEach(([arquivo, esperado]) => {
  test(`${arquivo} e exatamente o que o JSON produz (arquivo gerado por inteiro)`, () => {
    const atual = ler(arquivo);
    assert.strictEqual(semCR(atual), semCR(esperado),
      `${arquivo} divergiu do derivado (${atual.length} vs ${esperado.length} bytes) - rode: node scripts/downplant/contar-regras-arca.mjs --aplicar`);
  });
});

// ---------------------------------------------------------------------------
// 3. Blocos entre marcadores ARCA-*
// ---------------------------------------------------------------------------
Object.entries(payload.blocos).forEach(([chave, esperado]) => {
  const [arquivo, marcador] = chave.split('#');
  test(`${arquivo} :: bloco ${marcador} bate com o derivado`, () => {
    const texto = ler(arquivo);
    assert.ok(marcadorInicio(marcador).test(texto), `marcador ${marcador}:INICIO ausente em ${arquivo}`);
    const atual = lerBloco(texto, marcador);
    assert.notStrictEqual(atual, null, `bloco ${marcador} nao delimitado em ${arquivo}`);
    assert.strictEqual(semCR(atual), semCR(esperado),
      `bloco ${marcador} de ${arquivo} divergiu do derivado - rode: node scripts/downplant/contar-regras-arca.mjs --aplicar`);
  });
});

test('todo marcador de bloco gerado carrega o sha256 vigente do JSON', () => {
  const nomesGerados = Object.keys(payload.marcadores).filter((n) => n !== 'HISTORICO')
    .map((n) => payload.marcadores[n]).join('|');
  const reInicio = new RegExp('<!-- (' + nomesGerados + '):INICIO[^>]*-->', 'g');
  const arquivos = new Set(Object.keys(payload.blocos).map((c) => c.split('#')[0]));
  arquivos.forEach((arquivo) => {
    const texto = ler(arquivo);
    const inicios = texto.match(reInicio) || [];
    assert.ok(inicios.length > 0, `${arquivo}: nenhum marcador de bloco gerado`);
    inicios.forEach((linha) => {
      assert.ok(linha.indexOf(k.sha256_json) !== -1,
        `${arquivo}: marcador sem o sha256 vigente do JSON (${linha}) - o JSON mudou e o derivado nao foi regerado`);
    });
  });
});

// ---------------------------------------------------------------------------
// 4. Canvas (planta) carrega a contagem derivada
// ---------------------------------------------------------------------------
test(`circuito ${path.basename(payload.canvas_modulo)} declara as metricas derivadas no no '${payload.no_canvas}'`, () => {
  const canvas = JSON.parse(ler(payload.canvas_modulo));
  const no = (canvas.nodes || []).find((n) => n.id === payload.no_canvas);
  assert.ok(no, `no '${payload.no_canvas}' ausente no canvas`);
  assert.strictEqual(semCR(no.text), semCR(payload.canvas_texto), 'no de metricas do canvas divergiu do derivado');
  assert.ok(no.text.indexOf(`${k.regras_total} regras`) !== -1, 'no de metricas sem o total derivado');
});

// ---------------------------------------------------------------------------
// 5. Snapshot de metricas em JSON (artefato de maquina)
// ---------------------------------------------------------------------------
test('snapshot scripts/downplant/arca_metricas_derivadas.json bate com a medicao', () => {
  const snapshot = JSON.parse(ler('scripts/downplant/arca_metricas_derivadas.json'));
  assert.strictEqual(snapshot.sha256_json, k.sha256_json, 'sha256 do JSON divergiu');
  assert.deepStrictEqual(snapshot.metricas.regras_total, k.regras_total);
  assert.deepStrictEqual(snapshot.metricas.regras_mapeadas, k.regras_mapeadas);
  assert.deepStrictEqual(snapshot.metricas.regras_nao_auditaveis, k.regras_nao_auditaveis);
  assert.deepStrictEqual(snapshot.por_subdominio, payload.por_subdominio);
  assert.deepStrictEqual(snapshot.por_categoria, payload.por_categoria);
});

// ---------------------------------------------------------------------------
// 6. Substituicoes dirigidas: a contagem antiga nao pode voltar
// ---------------------------------------------------------------------------
test('os arquivos pontuais carregam o valor DERIVADO (o numero digitado foi substituido)', () => {
  const problemas = [];
  payload.substuicoes.forEach((s) => {
    const texto = ler(s.arquivo);
    if (texto.indexOf(s.texto) === -1) {
      problemas.push(`${s.arquivo}: nao contem o valor derivado "${s.texto}"`);
    }
  });
  assert.deepStrictEqual(problemas, [], problemas.join(' | '));
});

// ---------------------------------------------------------------------------
// 7. Varredura dos arquivos vivos: contagem proibida e numero fora da metrica
// ---------------------------------------------------------------------------
test('nenhum artefato vivo carrega contagem de catalogo proibida fora de regiao historica', () => {
  const problemas = [];
  payload.vigiados.forEach((arquivo) => {
    const texto = ler(arquivo);
    const faixas = faixasHistoricas(texto);
    CONTAGENS_PROIBIDAS.forEach((re) => {
      const global = new RegExp(re.source, 'g');
      let m;
      while ((m = global.exec(texto)) !== null) {
        if (!dentroDe(m.index, faixas)) problemas.push(`${arquivo}: "${m[0]}" (posicao ${m.index})`);
      }
    });
    // "N regras" em prosa: o N tem de ser um valor medido/publicado
    const reRegras = /(\d{1,4})\s+regras\b/g;
    let m;
    while ((m = reRegras.exec(texto)) !== null) {
      if (publicados.has(m[1])) continue;
      if (dentroDe(m.index, faixas)) continue;
      if (m[1] === String(k.regras_total)) continue;
      problemas.push(`${arquivo}: "N regras" com N=${m[1]} nao publicado pela medicao (posicao ${m.index})`);
    }
  });
  assert.deepStrictEqual(problemas, [], problemas.join(' | '));
});

// ---------------------------------------------------------------------------
// 8. Definicao explicita: o total ambiguo nao pode sobreviver
// ---------------------------------------------------------------------------
test('as substituicoes dirigidas sao idempotentes (reaplicar nao altera o arquivo)', () => {
  const problemas = [];
  payload.substuicoes.forEach((s) => {
    const texto = ler(s.arquivo);
    const novo = texto.replace(new RegExp(s.regex, s.flags), s.texto);
    if (novo !== texto) problemas.push(`${s.arquivo}: /${s.regex}/ ainda altera o texto (aplicacao nao e ponto fixo)`);
  });
  assert.deepStrictEqual(problemas, [], problemas.join(' | '));
});

test('o catalogo humano declara a DEFINICAO de cada metrica (sem "total ARCA" ambiguo)', () => {
  const md = ler('Dominio/ARCA/ARCA_REGRAS_DOMINIO.md');
  ['regras_total', 'regras_mapeadas', 'regras_integradas', 'regras_nao_aplicaveis', 'regras_nao_auditaveis',
    'codigos_diagnostico', 'porta_codigos', 'porta_rule_ids'].forEach((nome) => {
    assert.ok(md.indexOf('`' + nome + '`') !== -1, `metrica ${nome} sem definicao explicita no MD`);
  });
  assert.ok(md.indexOf('Definição (campo medido no JSON)') !== -1, 'tabela de metricas sem coluna de definicao');
});

console.log(`\nRESULTADOS FINAIS: ${sucessos} PASS / ${falhas} FAIL`);
if (falhas > 0) process.exit(1);
}
