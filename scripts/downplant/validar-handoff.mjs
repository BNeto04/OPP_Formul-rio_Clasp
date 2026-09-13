#!/usr/bin/env node
/**
 * validar-handoff.mjs — #156 (DP-HANDOFF-001)
 *
 * Prova que o objeto canonico `downplant_handoff` e:
 *   (a) YAML valido (parseavel) e com schema minimo completo; e
 *   (b) UTILIZAVEL no inicio de uma task: o que ele declara coincide com o
 *       estado factual do repositorio (branch, HEAD, arquivos e referencias).
 *
 * Sem dependencias externas: usa um parser YAML do subconjunto usado pelo
 * objeto (mapas aninhados por indentacao + listas de strings por "- ").
 *
 * Uso:
 *   node scripts/downplant/validar-handoff.mjs [baseDir]
 *   baseDir (opcional) = raiz do repositorio. Padrao: ../../ relativo a este script.
 *
 * Codigos de saida:
 *   0 = PASS (YAML valido e utilizavel)
 *   1 = FAIL de validacao (schema incompleto, fato divergente)
 *   2 = erro de leitura/parse (arquivo ausente, YAML invalido)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseDir = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(__dirname, '../../');
const handoffPath = path.join(baseDir, '08_Execucao_Ao_Vivo', 'downplant_handoff.yaml');

let fails = 0;
function ok(msg)   { console.log(`  PASS  ${msg}`); }
function fail(msg) { console.error(`  FAIL  ${msg}`); fails++; }

// ---------------------------------------------------------------------------
// Parser YAML (subconjunto: mapas por indentacao + listas de strings)
// ---------------------------------------------------------------------------
function unquote(s) {
  const t = s.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1);
  }
  return t;
}

function parseYaml(text) {
  const raw = text.replace(/\r\n/g, '\n').split('\n');
  const lines = [];
  raw.forEach((r, i) => {
    const t = r.trim();
    if (t === '' || t.startsWith('#')) return;
    lines.push({ indent: r.length - r.replace(/^\s+/, '').length, text: t, line: i + 1 });
  });
  if (lines.length === 0) throw new Error('YAML vazio');

  let pos = 0;
  function parseBlock(indent) {
    const isList = lines[pos].text.startsWith('- ');
    const node = isList ? [] : {};
    while (pos < lines.length) {
      const cur = lines[pos];
      if (cur.indent < indent) break;
      if (cur.indent > indent) throw new Error(`indentacao inesperada (linha ${cur.line})`);
      if (isList) {
        if (!cur.text.startsWith('- ')) throw new Error(`esperava item de lista (linha ${cur.line})`);
        const rest = cur.text.slice(2).trim();
        pos++;
        if (rest === '') throw new Error(`item de lista vazio (linha ${cur.line})`);
        node.push(unquote(rest));
      } else {
        if (cur.text.startsWith('- ')) throw new Error(`item de lista em contexto de mapa (linha ${cur.line})`);
        const m = cur.text.match(/^([^:]+):(.*)$/);
        if (!m) throw new Error(`linha sem 'chave:' (linha ${cur.line})`);
        const key = m[1].trim();
        const val = m[2].trim();
        pos++;
        if (val === '') {
          if (pos < lines.length && lines[pos].indent > indent) {
            node[key] = parseBlock(lines[pos].indent);
          } else {
            node[key] = null;
          }
        } else {
          node[key] = unquote(val);
        }
      }
    }
    return node;
  }
  const root = parseBlock(lines[0].indent);
  if (pos !== lines.length) throw new Error(`sobrou conteudo nao consumido (linha ${lines[pos] && lines[pos].line})`);
  return root;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const isStr = v => typeof v === 'string' && v.trim() !== '';
function requireKeys(obj, keys, where) {
  keys.forEach(k => {
    if (!obj || obj[k] === undefined || obj[k] === null || (typeof obj[k] === 'string' && obj[k].trim() === '')) {
      fail(`${where}: chave obrigatoria ausente/vazia -> ${k}`);
    }
  });
}
function git(args) {
  return execFileSync('git', ['-C', baseDir, ...args], { encoding: 'utf8' }).trim();
}

// ---------------------------------------------------------------------------
// Execucao
// ---------------------------------------------------------------------------
console.log(`\n[validar-handoff] baseDir = ${baseDir}`);
console.log(`[validar-handoff] handoff = ${handoffPath}\n`);

if (!fs.existsSync(handoffPath)) {
  console.error(`ERRO: handoff nao encontrado em ${handoffPath}`);
  process.exit(2);
}

let doc;
try {
  doc = parseYaml(fs.readFileSync(handoffPath, 'utf8'));
} catch (e) {
  console.error(`ERRO: YAML invalido -> ${e.message}`);
  process.exit(2);
}

console.log('1) Schema e cabecalho');
if (doc.downplant_schema !== 'DP-HANDOFF-1') fail(`downplant_schema deve ser DP-HANDOFF-1 (lido: ${doc.downplant_schema})`);
else ok('downplant_schema = DP-HANDOFF-1');
requireKeys(doc, ['downplant_version', 'handoff_version', 'gerado_em', 'autor', 'proposito', 'card_origem', 'card_pai', 'estado_do_handoff'], 'raiz');
if (isStr(doc.downplant_version)) ok(`downplant_version = ${doc.downplant_version}`);
if (doc.estado_do_handoff !== 'ATIVO') fail(`estado_do_handoff deve ser ATIVO (lido: ${doc.estado_do_handoff})`);
else ok('estado_do_handoff = ATIVO');
if (isStr(doc.proposito)) ok('proposito preenchido');

console.log('\n2) Identidade');
const id = doc.identidade || {};
requireKeys(id, ['projeto', 'repositorio', 'espelho', 'branch', 'head_observado', 'pasta_de_trabalho'], 'identidade');
if (isStr(id.repositorio) && fs.existsSync(id.repositorio) && fs.statSync(id.repositorio).isDirectory()) ok(`repositorio existe: ${id.repositorio}`);
else fail(`repositorio inexistente: ${id.repositorio}`);
if (isStr(id.espelho) && fs.existsSync(id.espelho) && fs.statSync(id.espelho).isDirectory()) ok(`espelho existe: ${id.espelho}`);
else fail(`espelho inexistente: ${id.espelho}`);

console.log('\n3) Contexto de task (minimo obrigatorio)');
const ctx = doc.contexto_de_task || {};
requireKeys(ctx, ['comodo', 'modulo_ativo', 'fatia_ativa', 'ambiente', 'portao_atual', 'regra_de_parada', 'arquivos_permitidos', 'proibicoes', 'ids_remotos'], 'contexto_de_task');
if (Array.isArray(ctx.arquivos_permitidos) && ctx.arquivos_permitidos.length > 0) ok(`arquivos_permitidos = ${ctx.arquivos_permitidos.length}`);
else fail('arquivos_permitidos deve ser lista nao vazia');
if (Array.isArray(ctx.proibicoes) && ctx.proibicoes.length > 0) ok(`proibicoes = ${ctx.proibicoes.length}`);
else fail('proibicoes deve ser lista nao vazia');
requireKeys(ctx.ids_remotos || {}, ['apps_script_script_id', 'sheets_id', 'github_repo'], 'contexto_de_task.ids_remotos');
ok('ids_remotos: apps_script_script_id, sheets_id, github_repo presentes');

console.log('\n4) Quatro pontas');
const qp = doc.quatro_pontas || {};
const allowed = ['ALINHADO', 'PENDENTE', 'STALE', 'DIVERGENTE', 'NAO_APLICAVEL'];
['CODE_STATE', 'DOC_STATE', 'CANVAS_STATE', 'GIT_STATE'].forEach(p => {
  if (!allowed.includes(qp[p])) fail(`${p} invalido (lido: ${qp[p]}) — esperado um de ${allowed.join('/')}`);
  else ok(`${p} = ${qp[p]}`);
});

console.log('\n5) Utilizavel no inicio de uma task (coerencia com o fato)');
// 5a. branch declarada == branch real do repo
try {
  const realBranch = git(['rev-parse', '--abbrev-ref', 'HEAD']);
  if (id.branch === realBranch) ok(`branch confere com o repo: ${realBranch}`);
  else fail(`branch divergente: handoff='${id.branch}' vs repo='${realBranch}'`);
} catch (e) {
  fail(`nao foi possivel ler a branch do repo: ${e.message}`);
}
// 5b. HEAD observado existe como commit
try {
  git(['rev-parse', '--verify', `${id.head_observado}^{commit}`]);
  ok(`head_observado existe como commit: ${id.head_observado}`);
} catch (e) {
  fail(`head_observado nao existe no repo: ${id.head_observado}`);
}
// 5c. arquivos_permitidos existem
(ctx.arquivos_permitidos || []).forEach(rel => {
  const abs = path.resolve(baseDir, rel);
  if (fs.existsSync(abs)) ok(`arquivo permitido existe: ${rel}`);
  else fail(`arquivo permitido inexistente: ${rel}`);
});
// 5d. referencias existem
const refs = doc.referencias || {};
const refKeys = Object.keys(refs);
if (refKeys.length === 0) fail('referencias vazio');
refKeys.forEach(k => {
  const abs = path.resolve(baseDir, refs[k]);
  if (fs.existsSync(abs)) ok(`referencia existe: ${k} -> ${refs[k]}`);
  else fail(`referencia quebrada: ${k} -> ${refs[k]}`);
});

console.log('\n6) Proveniencia');
requireKeys(doc.proveniencia || {}, ['agente', 'modelo', 'objetivo', 'revisao_humana'], 'proveniencia');
ok('agente, modelo, objetivo e revisao_humana presentes');

console.log('\n7) Contexto de task carregado (uso real no inicio da task)');
console.log('   --------------------------------------------------------------');
console.log(`   projeto .......... ${id.projeto}`);
console.log(`   repositorio ...... ${id.repositorio}`);
console.log(`   branch ........... ${id.branch} @ ${id.head_observado}`);
console.log(`   comodo x modulo .. ${ctx.comodo} / ${ctx.modulo_ativo}`);
console.log(`   fatia ............ ${ctx.fatia_ativa}`);
console.log(`   portao ........... ${ctx.portao_atual}`);
console.log(`   parada ........... ${ctx.regra_de_parada}`);
console.log(`   4 pontas ......... CODE=${qp.CODE_STATE} DOC=${qp.DOC_STATE} CANVAS=${qp.CANVAS_STATE} GIT=${qp.GIT_STATE}`);
console.log('   --------------------------------------------------------------');

if (fails > 0) {
  console.error(`\nFALHA! ${fails} verificacao(oes) falharam. O handoff NAO esta utilizavel.`);
  process.exit(1);
}
console.log('\nSUCESSO! O YAML do downplant_handoff e valido e utilizavel no inicio de uma task.');
process.exit(0);
