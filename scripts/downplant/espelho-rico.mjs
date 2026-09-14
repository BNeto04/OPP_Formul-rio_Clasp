#!/usr/bin/env node
/**
 * ARQUIVO: scripts/downplant/espelho-rico.mjs
 * RESPONSABILIDADE: gerador de espelho rico de codigo (Metodo Down Plant Progressivo
 *   v2.4, secao 46.15). Produz UM espelho por artefato enderecavel, com todos os
 *   campos exigidos, calculando commit, sha256 e data NO MOMENTO DA GERACAO e
 *   declarando a divergencia contra a Planta por testes mecanicos.
 *
 * USO (gerar):
 *   node scripts/downplant/espelho-rico.mjs gerar \
 *     --endereco C03_Dominio/MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO/SUB-C03-02-04_ADAPTADOR_PORTA_DE_CONSULTA \
 *     --origem Dominio/ARCA/AdaptadorConsultaArca.js \
 *     --saida 07_Codigo_Leitura/Dominio/ARCA/AdaptadorConsultaArca.js.md \
 *     --saida C:/.../Obsidian_Brain/Syntheon/07_Codigo_Leitura/Dominio/ARCA/AdaptadorConsultaArca.js.md \
 *     [--link-disco relativo|absoluto] [--commit-ref HEAD] [--divergencia "texto verificado a mao"] \
 *     [--portas "texto verificado a mao"] [--dry-run]
 *
 * USO (gerar espelho de artefato SEM endereco canonico no Down Plant):
 *   node scripts/downplant/espelho-rico.mjs gerar \
 *     --endereco-ausente "artefato nao declarado como artefato fisico em nenhum endereco da Planta (ver MAPA_ARTEFATO_ENDERECO_162.md)" \
 *     --origem <repo-rel> --saida <path>
 *   (O campo "Endereco Down Plant" passa a declarar NAO RESOLVIDO com a justificativa; T1/T2
 *    entram como ACHADO. A escolha e REPORTAR, jamais inventar endereco.)
 *
 * USO (verificar deriva de um espelho ja gravado):
 *   node scripts/downplant/espelho-rico.mjs verificar --espelho <path> [--origem <repo-rel>]
 *
 * USO (indexar uma arvore de espelhos — indice DERIVADO, nunca digitado):
 *   node scripts/downplant/espelho-rico.mjs indice --raiz 07_Codigo_Leitura --saida 07_Codigo_Leitura/INDICE_AS_IS.md
 *
 * Sem dependencia externa. Node ESM.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE = path.resolve(__dirname, '..', '..');

const SECOES = [
  '## Código-fonte embutido',
  '## Responsabilidade observada',
  '## Portas expostas (se aplicável)',
  '## Divergência com a Planta declarada',
  '## Última verificação (data/commit)',
];

const CAMPOS_CABECALHO = [
  'Endereço Down Plant',
  'Arquivo de origem (link para o disco)',
  'Commit de referência',
  'Data da última sincronização',
];

// ---------------------------------------------------------------- utilidades

function parseArgs(argv) {
  const o = { saida: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const k = a.slice(2);
    if (k === 'dry-run') { o.dryRun = true; continue; }
    const v = argv[++i];
    if (k === 'saida') o.saida.push(v); else o[k] = v;
  }
  return o;
}

function ler(p) { return fs.readFileSync(p, 'utf8'); }

/** Numero de linhas de conteudo (uma linha final terminada por LF nao conta como linha extra). */
function contarLinhas(texto) {
  const t = texto.replace(/\r\n/g, '\n');
  return t.split('\n').length - (t.endsWith('\n') ? 1 : 0);
}

/** sha256 do conteudo com quebras de linha normalizadas para LF. */
function sha256LF(texto) {
  return crypto.createHash('sha256').update(texto.replace(/\r\n/g, '\n'), 'utf8').digest('hex');
}

function git(baseDir, args) {
  return execFileSync('git', args, { cwd: baseDir, encoding: 'utf8' }).trim();
}

function commitResolvido(baseDir, ref) {
  const full = git(baseDir, ['rev-parse', ref]);
  return { curto: full.slice(0, 7), completo: full };
}

/** Data/hora no fuso oficial do Brasil, com offset explicito. */
function agoraAmericaSaoPaulo() {
  const d = new Date();
  const iso = d.toISOString();
  const local = d.toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' }).replace(' ', 'T');
  const sp = new Date(d.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  const utc = new Date(d.toLocaleString('en-US', { timeZone: 'UTC' }));
  const offMin = Math.round((sp - utc) / 60000);
  const sinal = offMin < 0 ? '-' : '+';
  const abs = Math.abs(offMin);
  const off = `${sinal}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`;
  return { isoLocalComOffset: `${local}${off}`, isoUTC: iso };
}

/** Extrai o primeiro bloco cercado por ``` de um markdown. */
function blocoEmbutido(md) {
  const m = md.match(/```[a-zA-Z0-9]*\r?\n([\s\S]*?)\r?\n```/);
  return m ? m[1] : null;
}

/**
 * O bloco cercado carrega o conteudo do arquivo SEM o terminador de linha final
 * (o ``` final precisa de uma quebra antes). Normalizar aqui para que a comparacao
 * de sha256 seja conteudo-contra-conteudo e nao acuse deriva por causa do terminador.
 */
function normalizarBloco(bloco) {
  if (bloco === null || bloco === undefined) return null;
  const b = bloco.replace(/\r\n/g, '\n');
  return b.endsWith('\n') ? b : b + '\n';
}

/**
 * REGRA UNICA DE COMPARACAO DE DERIVA (declarada; card #162).
 *
 * Problema medido: a cerca markdown consome UMA quebra de linha como separador. Para
 * arquivos que terminam em linha vazia (conteudo terminando em "\n\n") o bloco resgatado
 * perde UMA quebra; para arquivos SEM terminador final (conteudo terminando em "}") o
 * bloco resgatado ganha uma. Nos dois casos o conteudo de codigo e IDENTICO e o sha cru
 * difere — falso positivo de deriva (18 dos 72 espelhos, medido).
 *
 * Regra: normaliza LF e colapsa os terminadores de linha FINAIS das DUAS pontas antes de
 * comparar. Isso preserva a deteccao de QUALQUER diferenca de conteudo (inclusive espaco
 * em branco no interior) e deixa de acusar deriva pela convencao do separador da cerca.
 *
 * O sha256 DECLARADO no espelho continua sendo `sha256LF(arquivo de origem)` — ou seja, o
 * sha256 do conteudo com LF do arquivo real, comparavel ao `sha256sum` do disco.
 */
function sha256Comparacao(texto) {
  return crypto.createHash('sha256')
    .update(texto.replace(/\r\n/g, '\n').replace(/\n+$/, ''), 'utf8')
    .digest('hex');
}

function link(fromFile, toFile) {
  let rel = path.relative(path.dirname(fromFile), toFile).split(path.sep).join('/');
  if (!rel.startsWith('.')) rel = './' + rel;
  return rel;
}

/**
 * Linguagem do bloco cercado, derivada da EXTENSAO da origem (nunca inventada).
 * Antes o gerador fixava ```javascript; isso rotulava .html/.json/.md como JavaScript,
 * ou seja, dizia algo falso sobre um conteudo que e verbatim. So o rotulo muda:
 * o conteudo embutido e o mesmo, e o sha256 nao depende dele.
 */
function linguagemDoBloco(origemRel) {
  const ext = path.extname(origemRel).toLowerCase();
  if (ext === '.js' || ext === '.gs' || ext === '.mjs') return 'javascript';
  if (ext === '.html') return 'html';
  if (ext === '.json') return 'json';
  if (ext === '.md') return 'markdown';
  if (ext === '.css') return 'css';
  return 'text';
}

// ------------------------------------------------------ resolucao de endereco

/**
 * endereco = "COMODO/MOD-ID[/SUB-ID]" OU "MOD-ID[/SUB-ID]".
 * Devolve os caminhos reais da Planta e o rotulo canonico.
 */
function resolverEndereco(baseDir, endereco) {
  const partes = endereco.split('/').filter(Boolean);
  const comodosDir = path.join(baseDir, '02_Comodos');
  let comodo = null, mod = null, sub = null;

  if (partes.length >= 2 && partes[0].startsWith('C')) {
    comodo = partes[0]; mod = partes[1]; sub = partes[2] || null;
  } else {
    mod = partes[0]; sub = partes[1] || null;
    if (!fs.existsSync(comodosDir)) throw new Error('02_Comodos nao encontrado');
    for (const c of fs.readdirSync(comodosDir)) {
      const cPath = path.join(comodosDir, c);
      if (!fs.statSync(cPath).isDirectory()) continue;
      const mPath = path.join(cPath, '01_Dominio', 'modulos', mod);
      if (fs.existsSync(mPath)) { comodo = c; break; }
    }
  }
  if (!comodo || !mod) throw new Error(`Endereco nao resolvido: ${endereco}`);

  const modDir = path.join(comodosDir, comodo, '01_Dominio', 'modulos', mod);
  if (!fs.existsSync(modDir)) throw new Error(`Modulo ausente: ${modDir}`);

  let subDir = null;
  if (sub) {
    subDir = path.join(modDir, 'submodulos', sub);
    if (!fs.existsSync(subDir)) {
      // A Planta as vezes declara o submodulo pela forma CURTA (ex.: "SUB-C03-02-01"),
      // enquanto o diretorio real carrega o sufixo descritivo (SUB-C03-02-01_CATALOGO_DE_REGRAS).
      // Aceita somente quando existe UM unico diretorio com aquele prefixo: ambiguidade e erro.
      const submodulosDir = path.join(modDir, 'submodulos');
      const achados = fs.existsSync(submodulosDir)
        ? fs.readdirSync(submodulosDir).filter(d => d.startsWith(sub) && fs.statSync(path.join(submodulosDir, d)).isDirectory())
        : [];
      if (achados.length === 1) { subDir = path.join(submodulosDir, achados[0]); sub = achados[0]; }
      else if (achados.length > 1) throw new Error(`Submodulo ambiguo (${achados.length} diretorios com o prefixo ${sub}): ${achados.join(', ')}`);
      else throw new Error(`Submodulo ausente: ${subDir}`);
    }
  }

  const notaMod = path.join(modDir, 'NOTA_DE_RESPONSABILIDADE.md');
  const notaSub = subDir ? path.join(subDir, 'NOTA_DE_RESPONSABILIDADE.md') : null;
  const id = [comodo, mod, sub].filter(Boolean).join(' / ');
  return { comodo, mod, sub, modDir, subDir, notaMod, notaSub, id };
}

// --------------------------------------------------- extracao de observaveis

function secaoMarkdown(md, titulo) {
  const linhas = md.replace(/\r\n/g, '\n').split('\n');
  const i = linhas.findIndex(l => l.trim().toLowerCase() === titulo.toLowerCase());
  if (i < 0) return { encontrada: false, texto: '' };
  const out = [];
  for (let j = i + 1; j < linhas.length; j++) {
    if (/^#{1,6}\s/.test(linhas[j]) || /^-{3,}\s*$/.test(linhas[j])) break;
    out.push(linhas[j]);
  }
  return { encontrada: true, texto: out.join('\n').trim() };
}

/** Capsula canonica do modulo no formato 46.2 (mesmo nome do diretorio + .md). */
function capsulaDoModulo(end) {
  if (!end || !end.modDir) return null;
  const p = path.join(end.modDir, path.basename(end.modDir) + '.md');
  return fs.existsSync(p) ? p : null;
}

/**
 * Responsabilidade OBSERVADA: derivada do endereco (nao inventada).
 * Fontes, em ordem de precedencia:
 *   1. ## Papel / ## Limites da NOTA do SUBMODULO;
 *   2. ## Papel / ## Limites da NOTA do MODULO;
 *   3. ## Responsabilidade da CAPSULA do modulo (formato 46.2 — a NOTA do modulo e um
 *      stub de ~10 linhas que declara a capsula como o documento canonico do endereco);
 *   4. primeiras linhas uteis da NOTA do modulo (fallback declarado).
 * Nenhuma linha e inventada: o texto e sempre copiado da Planta, com a fonte citada.
 */
function responsabilidadeObservada(end) {
  const fontes = [];
  const extrair = (caminho, rotulo) => {
    if (!caminho || !fs.existsSync(caminho)) return false;
    const md = ler(caminho);
    const papel = secaoMarkdown(md, '## Papel');
    const resp = !papel.encontrada || !papel.texto ? secaoMarkdown(md, '## Responsabilidade') : papel;
    const rotuloSecao = papel.encontrada && papel.texto ? '"## Papel"' : '"## Responsabilidade"';
    if (resp.encontrada && resp.texto) {
      fontes.push({ onde: `${rotulo} ${rotuloSecao}`, caminho, texto: resp.texto });
      const lim = secaoMarkdown(md, '## Limites');
      if (lim.encontrada && lim.texto) fontes.push({ onde: `${rotulo} "## Limites"`, caminho, texto: lim.texto });
      return true;
    }
    return false;
  };
  if (extrair(end.notaSub, 'NOTA_DE_RESPONSABILIDADE.md do submodulo,')) return fontes;
  if (extrair(end.notaMod, 'NOTA_DE_RESPONSABILIDADE.md do modulo,')) return fontes;
  if (extrair(capsulaDoModulo(end), 'CAPSULA do modulo (formato 46.2),')) return fontes;
  if (end.notaMod && fs.existsSync(end.notaMod)) {
    const md = ler(end.notaMod);
    fontes.push({
      onde: 'NOTA_DE_RESPONSABILIDADE.md do modulo (fallback: primeiras linhas uteis; sem secao de papel/responsabilidade)',
      caminho: end.notaMod,
      texto: md.replace(/\r\n/g, '\n').split('\n').filter(Boolean).slice(1, 3).join('\n'),
    });
  }
  return fontes;
}

const PALAVRAS_JS = new Set(['if', 'for', 'while', 'switch', 'catch', 'function', 'return', 'do', 'else', 'new', 'typeof', 'await', 'case', 'try', 'throw']);

/**
 * Portas expostas: superficie exportada extraida do codigo (heuristica declarada).
 * Devolve globais (classes/objetos) e membros publicos.
 */
function portasExpostas(codigo) {
  const texto = codigo.replace(/\r\n/g, '\n');
  const globais = [...texto.matchAll(/^(?:class|function)\s+([A-Za-z_$][\w$]*)/gm)].map(m => m[1]);
  const consts = [...texto.matchAll(/^(?:const|var|let)\s+([A-Za-z_$][\w$]*)\s*=\s*\{/gm)].map(m => m[1]);
  const membros = [...texto.matchAll(/^\s{2,4}(?:static\s+)?(?:async\s+)?(?:get\s+|set\s+)?([A-Za-z_$][\w$]*)\s*\(/gm)]
    .map(m => m[1]).filter(n => !PALAVRAS_JS.has(n));
  const getters = [...texto.matchAll(/^\s{2,4}(?:static\s+)?get\s+([A-Za-z_][\w$]*)\s*\(/gm)].map(m => m[1]);
  const uniq = a => [...new Set(a)];
  return { globais: uniq([...globais, ...consts]), membros: uniq([...getters, ...membros]) };
}

// ------------------------------------------------ testes mecanicos de divergencia

function testesMecanicos({ baseDir, end, origemRel, origemAbs, commit, shaAtual, saidas, espelhoAnterior, vaultMirrors }) {
  const achados = [];
  const ok = [];

  // T0 - modo "endereco nao resolvido": declarado, nunca inventado.
  if (end.ausente) {
    achados.push(`T1 endereco NAO RESOLVIDO no Down Plant canonico: ${end.ausente} (registrado em MAPA_ARTEFATO_ENDERECO_162.md — REPORTADO, nao inventado)`);
    achados.push(`T2 declaracao do artefato nao verificavel: sem endereco canonico nao ha Planta contra a qual conferir "${origemRel}"`);
  } else {
    // T1 - endereco existe
    if (fs.existsSync(end.notaMod)) ok.push('T1 endereco existe: NOTA_DE_RESPONSABILIDADE.md do modulo presente');
    else achados.push(`T1 endereco inexistente: ${end.notaMod}`);

    if (end.notaSub && fs.existsSync(end.notaSub)) ok.push('T1b endereco existe: NOTA_DE_RESPONSABILIDADE.md do submodulo presente');
    else if (end.sub) achados.push(`T1b submodulo sem NOTA_DE_RESPONSABILIDADE.md: ${end.subDir}`);

    // T2 - artefato declarado no endereco.
    // Fontes: NOTA do submodulo, NOTA do modulo e a CAPSULA do modulo (formato 46.2).
    // Por que a capsula entra: a NOTA do modulo e um stub que declara a capsula como o
    // documento canonico do endereco ("A capsula canonica deste modulo e <MOD>.md"), e e na
    // secao "## Artefatos" DA CAPSULA que a Planta registra os artefatos fisicos. Conferir
    // so a NOTA produziria falso ACHADO em quase todos os enderecos.
    const capsula = capsulaDoModulo(end);
    const fontesT2 = [end.notaSub, end.notaMod, capsula].filter(p => p && fs.existsSync(p));
    const textos = fontesT2.map(p => ler(p)).join('\n');
    if (textos.includes(origemRel)) ok.push(`T2 artefato declarado no endereco: "${origemRel}" aparece na Planta`);
    else achados.push(`T2 artefato NAO declarado no endereco: "${origemRel}" nao aparece nas NOTAS/capsula de ${end.id}`);
  }

  // T3 - arquivo existe no commit de referencia
  try {
    git(baseDir, ['cat-file', '-e', `${commit}:${origemRel}`]);
    ok.push(`T3 arquivo presente no commit de referencia (${commit.slice(0, 7)}:${origemRel})`);
  } catch {
    achados.push(`T3 arquivo ausente no commit ${commit.slice(0, 7)}: ${origemRel}`);
  }

  // T4 - sha do arquivo em disco == sha do arquivo no commit
  try {
    const noCommit = execFileSync('git', ['show', `${commit}:${origemRel}`], { cwd: baseDir, encoding: 'utf8' });
    if (sha256LF(noCommit) === shaAtual) ok.push('T4 conteudo em disco identico ao do commit de referencia (sha256 LF)');
    else achados.push('T4 conteudo em disco DIFERE do conteudo no commit de referencia (trabalho nao commitado)');
  } catch { achados.push('T4 nao foi possivel comparar o conteudo com o commit de referencia'); }

  // T5 - deriva do espelho anterior (endereco/submodulo parado, texto reescrito)
  if (espelhoAnterior) {
    const antigo = blocoEmbutido(espelhoAnterior.conteudo);
    const shaAntigo = antigo !== null ? sha256Comparacao(antigo) : null;
    const shaOrigemCmp = sha256Comparacao(ler(origemAbs));
    if (shaAntigo && shaAntigo !== shaOrigemCmp) {
      achados.push(`T5 DERIVA no espelho anterior: codigo embutido sha256 ${shaAntigo.slice(0, 12)} != origem ${shaOrigemCmp.slice(0, 12)} (${contarLinhas(antigo)} linhas embutidas vs ${contarLinhas(ler(origemAbs))} na origem)`);
    } else if (shaAntigo) {
      ok.push('T5 espelho anterior sem deriva de codigo (sha256 do bloco == origem)');
    } else {
      achados.push('T5 espelho anterior existe mas nao tem bloco de codigo embutido reconhecivel');
    }
    const endDeclarado = (espelhoAnterior.conteudo.match(/\*\*Endere[cç]o[^:]*:\*\*\s*\[?([^\]\n]*(?:\]\([^)]*\))?)/i) || [])[1] || '';
    const rotulo = end.sub || end.mod;
    if (end.ausente) {
      // sem endereco canonico nao ha o que comparar
    } else if (endDeclarado && !(endDeclarado.includes(end.sub || '') || endDeclarado.includes(end.mod))) {
      achados.push(`T6 endereco declarado no espelho anterior nao corresponde ao endereco canonico atual ("${endDeclarado.trim().replace(/\[.*/, '').trim()}" vs "${rotulo}")`);
    } else if (endDeclarado) {
      ok.push('T6 endereco declarado no espelho anterior corresponde ao endereco canonico atual');
    }
  }

  // T7 - duplicidade de espelhos para a mesma origem
  if (typeof vaultMirrors === 'number') {
    if (vaultMirrors > 1) achados.push(`T7 duplicidade: ${vaultMirrors} espelhos de leitura declaram "${origemRel}" como origem`);
    else if (vaultMirrors === 1) ok.push(`T7 sem duplicidade: exatamente 1 espelho de leitura declara "${origemRel}" como origem`);
    else ok.push(`T7 primeira materializacao no espelho: nenhum espelho anterior declara "${origemRel}" como origem`);
  }

  return { achados, ok };
}

// --------------------------------------------------------------- renderizacao

function renderizar({ baseDir, end, origemRel, origemAbs, saida, commit, data, codigo, respFonte, portas, testes, divergenciaExtra, linkDisco, linkEnd, papel }) {
  const shaOrigem = sha256LF(codigo);
  const caminhoDisco = linkDisco === 'absoluto'
    ? origemAbs.split(path.sep).join('/')
    : link(saida, origemAbs);

  const notaEnd = end.ausente ? null : (end.notaSub && fs.existsSync(end.notaSub) ? end.notaSub : end.notaMod);
  const lang = linguagemDoBloco(origemRel);

  const L = [];
  L.push(`# ESPELHO — ${path.basename(origemRel)}`);
  L.push('');
  L.push('> [!NOTE] Espelho rico de código (Metodo §46.15) — gerado por `scripts/downplant/espelho-rico.mjs`');
  L.push('> Somente leitura. Não editar à mão: qualquer edição é sobrescrita na próxima geração.');
  L.push('> O código abaixo é cópia verbatim do arquivo de origem no commit declarado; divergência entre o embutido e a origem é deriva (§18.1).');
  L.push('> Regra do sha256 declarado: sha256 do conteúdo **normalizado para LF** (igual ao blob do Git). Em arquivo CRLF com terminador final diferente, ele difere do `sha256sum` dos bytes crus — a comparação de deriva é feita conteúdo-contra-conteúdo.');
  if (papel) L.push(`> Papel desta cópia: ${papel}`);
  L.push('');
  if (end.ausente) {
    L.push(`- **Endereço Down Plant:** \`NÃO RESOLVIDO\` — ${end.ausente}`);
    L.push('- Sem link de endereço: não existe elemento da Planta a linkar (não inventado). Ver `MAPA_ARTEFATO_ENDERECO_162.md`.');
  } else {
    L.push(`- **Endereço Down Plant:** \`${end.id}\` — [${path.basename(notaEnd)}](${linkEnd})`);
  }
  L.push(`- **Arquivo de origem (link para o disco):** [\`${origemRel}\`](${caminhoDisco})`);
  L.push(`- **Commit de referência:** \`${commit.completo}\` (\`${commit.curto}\`)`);
  L.push(`- **Data da última sincronização:** ${data.isoLocalComOffset}`);
  L.push('');
  L.push('## Código-fonte embutido');
  L.push('');
  L.push(`Verbatim de \`${origemRel}\` em \`${commit.curto}\`. sha256 do bloco (LF): \`${shaOrigem}\` — ${contarLinhas(codigo)} linhas.`);
  L.push('');
  L.push('```' + lang);
  L.push(codigo.replace(/\r\n/g, '\n').replace(/\n$/, ''));
  L.push('```');
  L.push('');
  L.push('## Responsabilidade observada');
  L.push('');
  if (!respFonte.length) L.push('- _(sem NOTA_DE_RESPONSABILIDADE.md no endereço: responsabilidade não derivável)_');
  respFonte.forEach(f => {
    L.push(`Fonte: \`${path.relative(baseDir, f.caminho).split(path.sep).join('/')}\` — ${f.onde}.`);
    L.push('');
    L.push(f.texto.split('\n').map(l => (l.trim() ? l : '')).join('\n'));
    L.push('');
  });
  L.push('## Portas expostas (se aplicável)');
  L.push('');
  if (portas.texto) {
    L.push(portas.texto);
  } else {
    const p = portasExpostas(codigo);
    if (!p.globais.length && !p.membros.length) {
      L.push('Não aplicável: nenhuma superfície exportada reconhecida no arquivo.');
    } else {
      L.push(`- Superfície exposta no nível do arquivo (nível global): ${p.globais.map(g => '`' + g + '`').join(', ') || '—'}`);
      L.push(`- Membros públicos observados: ${p.membros.map(m => '`' + m + '`').join(', ') || '—'}`);
      L.push('');
      L.push('_Extraído por heurística do gerador (globais de nível arquivo + métodos/accessors de 1º–2º nível). Não substitui a declaração de porta da Planta: confirme no endereço acima._');
    }
  }
  L.push('');
  L.push('## Divergência com a Planta declarada');
  L.push('');
  L.push(`Testes mecânicos executados na geração (commit \`${commit.curto}\`, ${data.isoLocalComOffset}):`);
  L.push('');
  testes.ok.forEach(t => L.push(`- OK — ${t}`));
  testes.achados.forEach(t => L.push(`- **ACHADO** — ${t}`));
  L.push('');
  L.push(`Veredito mecânico: **${testes.achados.length === 0 ? 'nenhuma divergência detectada pelos testes acima' : testes.achados.length + ' divergência(s) detectada(s) pelos testes acima'}**.`);
  if (divergenciaExtra) {
    L.push('');
    L.push('Declaração verificada a mão por humano/agente (não derivável automaticamente):');
    L.push('');
    L.push(divergenciaExtra);
  }
  L.push('');
  L.push('## Última verificação (data/commit)');
  L.push('');
  L.push(`- ${data.isoLocalComOffset} · commit \`${commit.curto}\` · sha256 da origem (LF): \`${shaOrigem}\``);
  const reexec = end.ausente
    ? `node scripts/downplant/espelho-rico.mjs gerar --endereco-ausente "${end.ausente}" --origem ${origemRel} --saida <caminho>`
    : `node scripts/downplant/espelho-rico.mjs gerar --endereco ${end.id.replace(/ \/ /g, '/')} --origem ${origemRel} --saida <caminho>`;
  L.push(`- Reexecutar: \`${reexec}\``);
  L.push('- Verificar deriva sem regravar: `node scripts/downplant/espelho-rico.mjs verificar --espelho <caminho>`');
  L.push('');
  return L.join('\n');
}

// --------------------------------------------------------------------- acoes

function gerar(args) {
  const baseDir = path.resolve(args.dir || BASE);
  if (!args.endereco && !args['endereco-ausente']) throw new Error('--endereco obrigatorio (ou --endereco-ausente "<justificativa>" quando o artefato NAO tem endereco canonico)');
  if (!args.origem) throw new Error('--origem obrigatorio');
  if (!args.saida.length) throw new Error('--saida obrigatorio (pode repetir)');

  const end = args.endereco
    ? resolverEndereco(baseDir, args.endereco)
    : { id: 'NÃO RESOLVIDO', ausente: args['endereco-ausente'], notaMod: null, notaSub: null, subDir: null, modDir: null, mod: null, sub: null, comodo: null };
  const origemRel = args.origem.split(/[\\/]/).join('/');
  const origemAbs = path.isAbsolute(origemRel) ? origemRel : path.join(baseDir, origemRel);
  if (!fs.existsSync(origemAbs)) throw new Error(`Origem inexistente: ${origemAbs}`);

  const commit = commitResolvido(baseDir, args['commit-ref'] || 'HEAD');
  const data = agoraAmericaSaoPaulo();
  const raw = ler(origemAbs);
  const codigo = raw.replace(/\r\n/g, '\n');
  const shaOrigem = sha256LF(codigo);

  const saiu = [];
  const anteriorPath = path.resolve(args.anterior || args.saida[0]);
  const anterior = fs.existsSync(anteriorPath) ? { caminho: anteriorPath, conteudo: ler(anteriorPath) } : null;

  // duplicidade no espelho (Obsidian) para a mesma origem: conta espelhos cujo campo
  // "Caminho Real no Repositório" e EXATAMENTE esta origem.
  let vaultMirrors = null;
  if (args['conta-espelhos']) {
    const raiz = args['conta-espelhos'];
    if (fs.existsSync(raiz)) {
      let n = 0;
      (function w(d) {
        for (const f of fs.readdirSync(d)) {
          const p = path.join(d, f);
          if (fs.statSync(p).isDirectory()) { w(p); continue; }
          if (!p.endsWith('.md')) continue;
          const c = ler(p);
          // formato rico (46.15) e formato antigo: campo de origem em ambos
          const m = c.match(/\*\*Arquivo de origem[^:]*:\*\*\s*\[`?([^`\]]+)`?\]/)
                 || c.match(/\*\*Caminho Real no Reposit[^:]*:\*\*\s*`([^`]+)`/)
                 || c.match(/\*\*Caminho no Reposit[^:]*:\*\*\s*`?([^`\n]+)`?/);
          if (m && m[1].trim() === origemRel) n++;
        }
      })(raiz);
      vaultMirrors = n;
    }
  }

  const testes = testesMecanicos({ baseDir, end, origemRel, origemAbs, commit: commit.completo, shaAtual: shaOrigem, espelhoAnterior: anterior, vaultMirrors });

  const raizVault = args.vault ? path.resolve(args.vault) : null;
  const notaEnd = end.ausente ? null : (end.notaSub && fs.existsSync(end.notaSub) ? end.notaSub : end.notaMod);

  for (const s of args.saida) {
    const saida = path.resolve(s);
    const linkDisco = args['link-disco'] || 'relativo';
    // --vault <raiz>: a arvore documental do vault espelha a do repo; o link de endereco
    // tem de resolver DENTRO do vault (navagavel no Obsidian), nao no disco do repo.
    const notaEndAlvo = raizVault && notaEnd ? path.join(raizVault, path.relative(baseDir, notaEnd)) : notaEnd;
    const conteudo = renderizar({
      baseDir, end, origemRel, origemAbs, saida, commit, data, codigo,
      respFonte: responsabilidadeObservada(end),
      portas: { texto: args.portas || null },
      testes, divergenciaExtra: args.divergencia || null, linkDisco,
      linkEnd: notaEndAlvo ? link(saida, notaEndAlvo) : null,
      papel: raizVault
        ? 'DERIVADA no vault (Obsidian). O espelho canônico é o do repositório; esta cópia é leitura navegável.'
        : 'CANÔNICA (repositório). O derivado navegável no vault é gerado com as mesmas entradas.',
    });
    if (!args.dryRun) {
      fs.mkdirSync(path.dirname(saida), { recursive: true });
      fs.writeFileSync(saida, conteudo, 'utf8');
    }
    saiu.push({ espelho: saida, linhas: conteudo.split('\n').length, sha: shaOrigem });
  }

  console.log(JSON.stringify({
    acao: 'gerar',
    endereco: end.id,
    origem: origemRel,
    commit: commit,
    data: data.isoLocalComOffset,
    sha256_origem_LF: shaOrigem,
    linhas_origem: contarLinhas(codigo),
    camposs46_15: CAMPOS_CABECALHO.length + SECOES.length,
    espelhos_gravados: saiu,
    testes_mecanicos: { ok: testes.ok.length, achados: testes.achados.length, detalhe: testes.achados },
    dry_run: !!args.dryRun,
  }, null, 2));
  return testes.achados.length ? 2 : 0;
}

/**
 * INDEXACAO DERIVADA (card #162, limite #9 do piloto).
 * O indice nao e um espelho de artefato: e o catalogo dos espelhos. Ele e DERIVADO da
 * propria arvore de espelhos (nunca digitado), para nao repetir o defeito do indice antigo
 * (apontava para elemento parado, listava 66 de 72 e declarava commit base velho).
 * Uso: espelho-rico.mjs indice --raiz <dir-de-espelhos> --saida <path> [--titulo "..."]
 */
function indice(args) {
  if (!args.raiz) throw new Error('--raiz obrigatorio');
  if (!args.saida || !args.saida.length) throw new Error('--saida obrigatorio');
  const raiz = path.resolve(args.raiz);
  if (!fs.existsSync(raiz)) throw new Error(`Raiz inexistente: ${raiz}`);
  const baseDir = path.resolve(args.dir || BASE);
  const head = commitResolvido(baseDir, args['commit-ref'] || 'HEAD');
  const data = agoraAmericaSaoPaulo();

  const arquivos = [];
  (function w(d) {
    for (const f of fs.readdirSync(d).sort()) {
      const p = path.join(d, f);
      if (fs.statSync(p).isDirectory()) { w(p); continue; }
      if (p.endsWith('.md')) arquivos.push(p);
    }
  })(raiz);

  const linhas = [];
  let espelhos = 0, comDeriva = 0, semOrigem = 0;
  for (const p of arquivos) {
    const rel = path.relative(raiz, p).split(path.sep).join('/');
    if (path.resolve(p) === path.resolve(args.saida[0])) continue; // o proprio indice nao se lista
    const c = ler(p);
    const origem = (c.match(/\*\*Arquivo de origem[^:]*:\*\*\s*\[`?([^`\]]+)`?\]/) || [])[1];
    if (!origem) { semOrigem++; linhas.push({ rel, origem: '—', endereco: '—', commit: '—', sha: '—', data: '—', estado: 'não é espelho de artefato (catalogo/derivado)' }); continue; }
    espelhos++;
    const endereco = (c.match(/\*\*Endere[çc]o[^\n]*:\*\*\s*`?([^`\n]+?)`?\s*(?:—|$)/m) || [])[1] || '—';
    const commit = (c.match(/\*\*Commit de refer[eê]ncia:\*\*\s*`([0-9a-f]{7,40})`/) || [])[1] || '—';
    const sha = (c.match(/sha256 do bloco \(LF\): `([0-9a-f]{64})`/) || [])[1] || '—';
    const dataEsp = (c.match(/\*\*Data da [uú]ltima sincroniza[çc][aã]o:\*\*\s*([^\n]+)/) || [])[1] || '—';
    const digest = sha256Comparacao(ler(path.join(baseDir, origem)));
    const deriva = sha === '—' || digest !== sha256Comparacao(blocoEmbutido(c) || '');
    if (deriva) comDeriva++;
    linhas.push({ rel, origem, endereco: endereco.trim(), commit, sha, data: dataEsp.trim(), estado: deriva ? '**DERIVA**' : 'verbatim' });
  }

  const L = [];
  L.push('# Índice de Código Leitura (AS-IS)');
  L.push('');
  L.push('> [!NOTE] Índice DERIVADO — gerado por `scripts/downplant/espelho-rico.mjs indice`');
  L.push('> Nenhuma linha é digitada à mão: cada campo é lido do espelho correspondente.');
  L.push(`> Árvore indexada: \`${raiz.split(path.sep).join('/')}\``);
  L.push('');
  L.push('| Espelho | Artefato de origem | Endereço Down Plant | Commit | sha256 (LF) | Última sincronização | Código embutido |');
  L.push('| :--- | :--- | :--- | :--- | :--- | :--- | :--- |');
  for (const l of linhas) {
    L.push(`| [${path.basename(l.rel)}](${l.rel}) | \`${l.origem}\` | \`${l.endereco}\` | \`${l.commit}\` | \`${l.sha}\` | ${l.data} | ${l.estado} |`);
  }
  L.push('');
  L.push(`- **Nós indexados:** ${linhas.length}`);
  L.push(`- **Espelhos de artefato (com origem declarada):** ${espelhos}`);
  L.push(`- **Nós que não são espelho de artefato:** ${semOrigem}`);
  L.push(`- **Com deriva de código declarada:** ${comDeriva}`);
  L.push(`- **Commit de referência da indexação:** \`${head.completo}\` (\`${head.curto}\`)`);
  L.push(`- **Data da indexação:** ${data.isoLocalComOffset}`);
  L.push('');

  for (const s of args.saida) {
    const saida = path.resolve(s);
    if (!args.dryRun) {
      fs.mkdirSync(path.dirname(saida), { recursive: true });
      fs.writeFileSync(saida, L.join('\n'), 'utf8');
    }
  }
  const out = { acao: 'indice', raiz, nos: linhas.length, espelhos, nao_espelhos: semOrigem, com_deriva: comDeriva, commit: head, data: data.isoLocalComOffset, saidas: args.saida, dry_run: !!args.dryRun };
  console.log(JSON.stringify(out, null, 2));
  return comDeriva ? 2 : 0;
}

function verificar(args) {
  if (!args.espelho) throw new Error('--espelho obrigatorio');
  const baseDir = path.resolve(args.dir || BASE);
  const esp = path.resolve(args.espelho);
  if (!fs.existsSync(esp)) throw new Error(`Espelho inexistente: ${esp}`);
  const md = ler(esp);
  const origemRel = (args.origem || (md.match(/\*\*Arquivo de origem[^:]*:\*\*\s*\[`?([^`\]]+)`?\]/) || [])[1] || '').trim();
  const bloco = blocoEmbutido(md);
  const commitDecl = (md.match(/\*\*Commit de referência:\*\*\s*`([0-9a-f]{7,40})`/) || [])[1] || null;
  const shaDecl = (md.match(/sha256 do bloco \(LF\): `([0-9a-f]{64})`/) || [])[1] || null;
  const dataDecl = (md.match(/\*\*Data da última sincronização:\*\*\s*([^\n]+)/) || [])[1] || null;

  const out = { acao: 'verificar', espelho: esp, origem: origemRel, commit_declarado: commitDecl, data_declarada: dataDecl, sha_declarado: shaDecl };
  if (!origemRel) { out.erro = 'origem nao identificada no espelho (use --origem)'; console.log(JSON.stringify(out, null, 2)); return 1; }
  const origemAbs = path.join(baseDir, origemRel);
  if (!fs.existsSync(origemAbs)) { out.erro = `origem ausente: ${origemAbs}`; console.log(JSON.stringify(out, null, 2)); return 1; }

  const shaReal = sha256LF(ler(origemAbs));
  const shaBloco = bloco !== null ? sha256LF(normalizarBloco(bloco)) : null;
  const head = commitResolvido(baseDir, args['commit-ref'] || 'HEAD');
  out.sha_origem_agora = shaReal;
  out.sha_bloco_embutido = shaBloco;
  out.commit_head = head.curto;
  // Deriva pelo CONTEUDO (LF, terminadores finais colapsados nas duas pontas — regra unica
  // declarada no cabecalho de sha256Comparacao). O sha cru continua exposto acima.
  const canonOrigem = sha256Comparacao(ler(origemAbs));
  const canonBloco = bloco !== null ? sha256Comparacao(bloco) : null;
  out.conteudo_canonico_igual = canonBloco !== null && canonBloco === canonOrigem;
  out.deriva_codigo = !out.conteudo_canonico_igual;
  out.sha_desatualizado = shaDecl ? shaDecl !== shaReal : true;
  out.commit_velho = commitDecl ? !head.completo.startsWith(commitDecl) : true;
  console.log(JSON.stringify(out, null, 2));
  return (out.deriva_codigo || out.sha_desatualizado || out.commit_velho) ? 2 : 0;
}

// ----------------------------------------------------------------------- main

const argv = process.argv.slice(2);
const acao = argv[0];
try {
  let code = 0;
  if (acao === 'gerar') code = gerar(parseArgs(argv.slice(1)));
  else if (acao === 'indice') code = indice(parseArgs(argv.slice(1)));
  else if (acao === 'verificar') code = verificar(parseArgs(argv.slice(1)));
  else {
    console.error('Uso: espelho-rico.mjs gerar|verificar|indice ...   (ver cabecalho do arquivo)');
    code = 1;
  }
  process.exit(code);
} catch (e) {
  console.error(`ERRO: ${e.message}`);
  process.exit(1);
}
