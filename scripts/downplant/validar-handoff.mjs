#!/usr/bin/env node
/**
 * validar-handoff.mjs — #156 (DP-HANDOFF-001) + #163 (DP24-002)
 *
 * Prova que o objeto canonico `downplant_handoff` e:
 *   (a) YAML valido (parseavel) e com schema minimo completo; e
 *   (b) UTILIZAVEL no inicio de uma task: o que ele declara coincide com o
 *       estado factual do repositorio (branch, HEAD, arquivos e referencias); e
 *   (c) satisfaz o contrato de entrada da §32.14 (require/ensure/invariant do
 *       metodo canonico 2.4), no vocabulario do objeto §46.12 — #163 (DP24-002).
 *
 * Sem dependencias externas: usa um parser YAML do subconjunto usado pelo
 * objeto (mapas aninhados por indentacao + listas de strings por "- ").
 *
 * Uso:
 *   node scripts/downplant/validar-handoff.mjs [baseDir]
 *   baseDir (opcional) = raiz do repositorio. Padrao: ../../ relativo a este script.
 *
 *   node scripts/downplant/validar-handoff.mjs --handoff <arquivo>
 *   Valida outro objeto de handoff (ex.: o objeto §46.12 de passagem de tarefa
 *   que chega ao Executor). Mesmo validador, mesmo parser: quando o objeto nao
 *   declara `downplant_schema` (ou seja, nao e o handoff de sessao DP-HANDOFF-1),
 *   valida-se o contrato de entrada da §32.14 — que e o contrato daquele objeto.
 *
 * Reuso (#163): `parseYaml`, `projetar32_14` e `validarContrato32_14` sao
 * EXPORTADOS para que o portao de teste chame o mesmo codigo. Nao existe (nem
 * deve existir) um segundo validador de handoff no repositorio.
 *
 * Codigos de saida:
 *   0 = PASS (YAML valido e utilizavel / require §32.14 satisfeito)
 *   1 = FAIL de validacao (schema incompleto, fato divergente, require violado)
 *   2 = erro de leitura/parse (arquivo ausente, YAML invalido)
 */

import fs from 'fs';
import path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------------------------
// Argumentos (baseDir + --handoff)
// ---------------------------------------------------------------------------
function lerArgumentos(argv) {
  let baseDirArg = null;
  let handoffArg = null;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--handoff' || a === '--arquivo') { handoffArg = argv[++i]; continue; }
    if (a.startsWith('--')) continue;
    if (baseDirArg === null) baseDirArg = a;
  }
  return { baseDirArg, handoffArg };
}

const { baseDirArg, handoffArg } = lerArgumentos(process.argv.slice(2));
const baseDir = baseDirArg ? path.resolve(baseDirArg) : path.resolve(__dirname, '../../');
const handoffPath = handoffArg
  ? path.resolve(baseDir, handoffArg)
  : path.join(baseDir, '08_Execucao_Ao_Vivo', 'downplant_handoff.yaml');

let fails = 0;
function ok(msg)   { console.log(`  PASS  ${msg}`); }
function fail(msg) { console.error(`  FAIL  ${msg}`); fails++; }

// ---------------------------------------------------------------------------
// Parser YAML (subconjunto: mapas por indentacao + listas de strings)
// ---------------------------------------------------------------------------
export function unquote(s) {
  const t = s.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1);
  }
  return t;
}

// Remove comentario de fim de linha (o metodo 2.4 usa ` # ...` no objeto §46.12).
export function semComentario(v) {
  const t = String(v);
  if (t === '') return t;
  const q = t[0];
  if (q === '"' || q === "'") {
    const fim = t.indexOf(q, 1);
    return fim === -1 ? t : t.slice(0, fim + 1);
  }
  const i = t.indexOf(' #');
  return i === -1 ? t : t.slice(0, i).trim();
}

export function parseYaml(text) {
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
        const rest = semComentario(cur.text.slice(2).trim());
        pos++;
        if (rest === '') throw new Error(`item de lista vazio (linha ${cur.line})`);
        node.push(unquote(rest));
      } else {
        if (cur.text.startsWith('- ')) throw new Error(`item de lista em contexto de mapa (linha ${cur.line})`);
        const m = cur.text.match(/^([^:]+):(.*)$/);
        if (!m) throw new Error(`linha sem 'chave:' (linha ${cur.line})`);
        const key = m[1].trim();
        const val = semComentario(m[2].trim());
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
// Contrato de entrada §32.14 — require / ensure / invariant (#163 DP24-002)
//
// A §32.14 fala a nomenclatura do objeto canonico §46.12:
//   downplant.comodo | downplant.modulo | downplant.escala | task.id |
//   escopo.arquivos | escopo.pode_expandir | estado.portao_atual | estado.portao_destino
//
// O objeto de sessao que JA existe no repo (#156, schema DP-HANDOFF-1) guarda
// parte desses campos em `contexto_de_task`. A projecao abaixo NAO duplica dado:
// usa o campo §46.12 quando ele existe e cai para o espelho legado quando o dado
// ja esta declarado la (comodo, modulo_ativo, arquivos_permitidos, portao_atual).
// ---------------------------------------------------------------------------
export const ESCALAS_32_14 = ['submodulo', 'modulo', 'comodo'];
export const ACOES_MUTAM_ARQUIVO_32_14 =
  /^(corrigir|alterar|criar|remover|editar|implementar|aplicar|escrever|refatorar|integrar|migrar|fix|add|update|delete)$/i;

const naoVazio = v => v !== undefined && v !== null && String(v).trim() !== '';
const primeiroNaoVazio = (...vs) => {
  for (const v of vs) if (naoVazio(v)) return v;
  return undefined;
};
const boolLiteral = v => v === true || v === false || /^(true|false)$/i.test(String(v === undefined || v === null ? '' : v).trim());
const boolValor = v => v === true || /^true$/i.test(String(v).trim());

// Projecao §46.12 sobre o objeto real (sem duplicar campo ja existente).
export function projetar32_14(doc) {
  const d = doc.downplant || {};
  const ctx = doc.contexto_de_task || {};
  const task = doc.task || {};
  const escopo = doc.escopo || {};
  const estado = doc.estado || {};
  return {
    comodo: primeiroNaoVazio(d.comodo, ctx.comodo),
    modulo: primeiroNaoVazio(d.modulo, ctx.modulo_ativo),
    escala: primeiroNaoVazio(d.escala),
    taskId: primeiroNaoVazio(task.id),
    acao: primeiroNaoVazio(task.acao),
    alvo: primeiroNaoVazio(task.alvo),
    handoffDaTask: primeiroNaoVazio(task.handoff),
    arquivos: Array.isArray(escopo.arquivos) ? escopo.arquivos : (Array.isArray(ctx.arquivos_permitidos) ? ctx.arquivos_permitidos : null),
    podeExpandir: naoVazio(escopo.pode_expandir) || escopo.pode_expandir === false ? escopo.pode_expandir : undefined,
    portaoAtual: primeiroNaoVazio(estado.portao_atual, ctx.portao_atual),
    portaoDestino: primeiroNaoVazio(estado.portao_destino),
  };
}

/**
 * require / ensure / invariant da §32.14 sobre um objeto downplant_handoff.
 * Devolve { passes, falhas, projecao } — o chamador decide o que imprimir
 * (o CLI imprime e converte falhas em exit 1: e o invariante).
 *
 * contexto:
 *   baseDir     — raiz para resolver task.handoff (ensure 1)
 *   gitLog      — saida de `git log --format=%H%x09%B%x02` (ensure 2); ausente = nao verifica
 *   vizinhos    — [{ arquivo, taskId }] outros handoffs do mesmo diretorio (unicidade)
 */
export function validarContrato32_14(doc, contexto = {}) {
  const passes = [];
  const falhas = [];
  const ok = m => passes.push(m);
  const fail = m => falhas.push(m);
  const p = projetar32_14(doc);
  const temId = naoVazio(p.taskId);

  // --- require -----------------------------------------------------------------
  if (naoVazio(p.comodo)) ok(`§32.14 require — downplant.comodo presente: ${p.comodo}`);
  else fail('§32.14 require — downplant.comodo ausente/vazio (downplant.comodo ou contexto_de_task.comodo)');

  if (naoVazio(p.modulo)) ok(`§32.14 require — downplant.modulo presente: ${p.modulo}`);
  else fail('§32.14 require — downplant.modulo ausente/vazio (downplant.modulo ou contexto_de_task.modulo_ativo)');

  if (!naoVazio(p.escala)) {
    fail('§32.14 require — downplant.escala AUSENTE: declare explicitamente submodulo | modulo | comodo (§40.4)');
  } else if (!ESCALAS_32_14.includes(String(p.escala).trim())) {
    fail(`§32.14 require — downplant.escala invalida: "${p.escala}" nao esta em {${ESCALAS_32_14.join(', ')}}`);
  } else {
    ok(`§32.14 require — downplant.escala = ${p.escala}`);
  }

  if (!temId) {
    fail('§32.14 require — task.id AUSENTE: sem id a Task nao e rastreavel nem unica');
  } else if (!/^TASK-[A-Z0-9]+-[0-9]+$/i.test(String(p.taskId).trim())) {
    fail(`§32.14 require — task.id fora do padrao canonico TASK-<COMODO>-<n>: "${p.taskId}"`);
  } else {
    ok(`§32.14 require — task.id = ${p.taskId} (padrao canonico TASK-<COMODO>-<n>)`);
    // rastreavel: o segmento de comodo do id tem de coincidir com downplant.comodo
    const mId = String(p.taskId).trim().match(/^TASK-([A-Z0-9]+)-[0-9]+$/i);
    const mComodo = naoVazio(p.comodo) ? String(p.comodo).trim().match(/^(C[0-9]{2})/i) : null;
    if (mId && mComodo && mId[1].toUpperCase() !== mComodo[1].toUpperCase()) {
      fail(`§32.14 require — task.id nao rastreavel: "${p.taskId}" declara comodo ${mId[1]} mas downplant.comodo = ${p.comodo}`);
    } else if (mId && mComodo) {
      ok(`§32.14 require — task.id rastreavel ao comodo declarado (${mComodo[1]})`);
    }
  }

  if (temId) {
    if (!Array.isArray(contexto.vizinhos)) {
      ok('§32.14 require — task.id unico (nenhum outro handoff no diretorio de registro)');
    } else {
      const nosso = String(p.taskId).trim();
      const dups = contexto.vizinhos.filter(v => v && naoVazio(v.taskId) && String(v.taskId).trim() === nosso);
      if (dups.length) fail(`§32.14 require — task.id DUPLICADO: ${nosso} tambem declarado em ${dups.map(d => d.arquivo).join(', ')}`);
      else ok(`§32.14 require — task.id unico entre os handoffs do diretorio (${contexto.vizinhos.length} vizinho(s))`);
    }
  }

  if (!naoVazio(p.acao)) {
    fail('§32.14 require — task.acao ausente: sem acao declarada o escopo nao e verificavel (§46.12)');
  } else if (ACOES_MUTAM_ARQUIVO_32_14.test(String(p.acao).trim())) {
    if (Array.isArray(p.arquivos) && p.arquivos.length > 0) {
      ok(`§32.14 require — escopo.arquivos nao vazio (${p.arquivos.length}) para task.acao="${p.acao}" (acao que altera arquivo)`);
    } else {
      fail(`§32.14 require — escopo.arquivos vazio/ausente com task.acao="${p.acao}" (acao que altera arquivo)`);
    }
  } else {
    ok(`§32.14 require — task.acao="${p.acao}" (leitura/auditoria): escopo.arquivos nao obrigatorio`);
  }

  if (!boolLiteral(p.podeExpandir)) {
    fail(`§32.14 require — escopo.pode_expandir AUSENTE ou nao booleano (lido: ${p.podeExpandir === undefined ? 'ausente' : JSON.stringify(p.podeExpandir)}) — deve ser explicitamente true ou false`);
  } else {
    ok(`§32.14 require — escopo.pode_expandir = ${boolValor(p.podeExpandir)} (explicito, nunca ausente)`);
  }

  if (naoVazio(p.portaoAtual)) ok('§32.14 require — estado.portao_atual presente');
  else fail('§32.14 require — estado.portao_atual AUSENTE (estado.portao_atual ou contexto_de_task.portao_atual)');

  if (naoVazio(p.portaoDestino)) ok(`§32.14 require — estado.portao_destino presente: ${p.portaoDestino}`);
  else fail('§32.14 require — estado.portao_destino AUSENTE');

  // --- ensure ------------------------------------------------------------------
  if (temId) ok(`§32.14 ensure — a Task ${p.taskId} referencia este handoff (task.id declarado no proprio objeto)`);
  if (naoVazio(p.handoffDaTask) && (contexto.profundidade || 0) < 1) {
    const ref = path.resolve(contexto.baseDir || '.', String(p.handoffDaTask));
    if (!fs.existsSync(ref)) {
      fail(`§32.14 ensure — task.handoff aponta para handoff INEXISTENTE: ${p.handoffDaTask}`);
    } else {
      try {
        const subDoc = parseYaml(fs.readFileSync(ref, 'utf8'));
        const sub = validarContrato32_14(subDoc, { baseDir: path.dirname(ref), profundidade: (contexto.profundidade || 0) + 1 });
        if (sub.falhas.length) fail(`§32.14 ensure — o handoff referenciado por task.handoff falha o require: ${p.handoffDaTask}`);
        else ok(`§32.14 ensure — o handoff referenciado por task.handoff passa o require: ${p.handoffDaTask}`);
      } catch (e) {
        fail(`§32.14 ensure — handoff referenciado ilegivel: ${p.handoffDaTask} (${e.message})`);
      }
    }
  }

  if (temId && typeof contexto.gitLog === 'string') {
    const nosso = String(p.taskId).trim();
    const registros = contexto.gitLog.split('\x02').map(r => r.trim()).filter(Boolean);
    const violacoes = [];
    registros.forEach(rec => {
      const tab = rec.indexOf('\t');
      const hash = (tab === -1 ? rec : rec.slice(0, tab)).trim().slice(0, 12);
      const msg = tab === -1 ? '' : rec.slice(tab + 1);
      const carregaId = msg.includes(nosso);
      const trailer = msg.match(/^\s*Handoff:\s*(.+)$/im);
      const atribuido = carregaId || (trailer && /downplant_handoff|handoff/i.test(trailer[1]));
      if (atribuido && !carregaId) violacoes.push(hash);
    });
    if (violacoes.length) {
      fail(`§32.14 ensure — commit(s) gerados a partir da Task ${nosso} sem task.id no historico Git: ${violacoes.join(', ')}`);
    } else {
      ok(`§32.14 ensure — ${registros.length} commit(s) no historico: nenhum commit atribuido a Task ${nosso} sem task.id`);
    }
  }

  return { passes, falhas, projecao: p };
}

// Outros handoffs do mesmo diretorio de registro (unicidade do task.id).
export function vizinhosDe(dir, arquivoAtual) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  fs.readdirSync(dir).forEach(nome => {
    if (nome === path.basename(arquivoAtual)) return;
    if (!/handoff.*\.ya?ml$/i.test(nome)) return;
    try {
      const d = parseYaml(fs.readFileSync(path.join(dir, nome), 'utf8'));
      const id = (d.task || {}).id;
      if (isStr(id)) out.push({ arquivo: nome, taskId: id });
    } catch (e) { /* vizinho ilegivel nao participa do registro de ids */ }
  });
  return out;
}

// ---------------------------------------------------------------------------
// Execucao (o modulo pode ser importado como biblioteca — #163)
// ---------------------------------------------------------------------------
const isMain = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;

if (isMain) {

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

// O objeto de sessao (DP-HANDOFF-1) tem validacao propria (abaixo). Um objeto
// §46.12 (passagem de tarefa) e governado pelo contrato de entrada da §32.14.
const ehHandoffDeSessao = doc.downplant_schema !== undefined;

console.log('1) Schema e cabecalho');
if (!ehHandoffDeSessao) {
  console.log('   (objeto §46.12 — passagem de tarefa: schema de sessao nao se aplica; contrato §32.14 na secao 8)');
} else if (doc.downplant_schema !== 'DP-HANDOFF-1') fail(`downplant_schema deve ser DP-HANDOFF-1 (lido: ${doc.downplant_schema})`);
else ok('downplant_schema = DP-HANDOFF-1');

if (ehHandoffDeSessao) {
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
}

// ---------------------------------------------------------------------------
// 8) Contrato de entrada §32.14 (#163) — require / ensure / invariant
// ---------------------------------------------------------------------------
console.log(`\n8) Contrato de entrada §32.14 (${ehHandoffDeSessao ? 'objeto de sessao DP-HANDOFF-1' : 'objeto §46.12 de passagem de tarefa'})`);
let gitLog = null;
try { gitLog = git(['log', '--format=%H%x09%B%x02', '-n', '400']); } catch (e) { /* sem historico: ensure 2 fica nao verificavel */ }
const contrato = validarContrato32_14(doc, { baseDir, gitLog, vizinhos: vizinhosDe(path.dirname(handoffPath), handoffPath) });
contrato.passes.forEach(ok);
contrato.falhas.forEach(fail);
if (contrato.falhas.length === 0) ok('§32.14 invariant — Executor autorizado a iniciar: nenhum require violado');
else fail('§32.14 invariant — Executor BLOQUEADO: um handoff que falhe o require nunca inicia execucao');

if (fails > 0) {
  console.error(`\nFALHA! ${fails} verificacao(oes) falharam. O handoff NAO esta utilizavel.`);
  process.exit(1);
}
if (ehHandoffDeSessao) {
  console.log('\nSUCESSO! O YAML do downplant_handoff e valido, utilizavel no inicio de uma task e satisfaz o contrato de entrada da §32.14.');
} else {
  console.log('\nSUCESSO! O objeto §46.12 satisfaz o contrato de entrada da §32.14 (require/ensure/invariant).');
}
process.exit(0);

}
