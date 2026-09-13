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
 * USO (verificar deriva de um espelho ja gravado):
 *   node scripts/downplant/espelho-rico.mjs verificar --espelho <path> [--origem <repo-rel>]
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

function link(fromFile, toFile) {
  let rel = path.relative(path.dirname(fromFile), toFile).split(path.sep).join('/');
  if (!rel.startsWith('.')) rel = './' + rel;
  return rel;
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
    if (!fs.existsSync(subDir)) throw new Error(`Submodulo ausente: ${subDir}`);
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

/**
 * Responsabilidade OBSERVADA: derivada do endereco (nao inventada).
 * Fonte preferencial: ## Papel da NOTA do submodulo; senao ## Papel da NOTA do modulo;
 * senao a primeira linha nao vazia da NOTA do modulo.
 */
function responsabilidadeObservada(end) {
  const fontes = [];
  if (end.notaSub && fs.existsSync(end.notaSub)) {
    const md = ler(end.notaSub);
    const papel = secaoMarkdown(md, '## Papel');
    if (papel.encontrada && papel.texto) {
      fontes.push({ onde: 'NOTA_DE_RESPONSABILIDADE.md do submodulo, secao "## Papel"', caminho: end.notaSub, texto: papel.texto });
      const lim = secaoMarkdown(md, '## Limites');
      if (lim.encontrada && lim.texto) fontes.push({ onde: 'NOTA_DE_RESPONSABILIDADE.md do submodulo, secao "## Limites"', caminho: end.notaSub, texto: lim.texto });
    }
  }
  if (!fontes.length && fs.existsSync(end.notaMod)) {
    const md = ler(end.notaMod);
    const papel = secaoMarkdown(md, '## Papel');
    fontes.push({
      onde: 'NOTA_DE_RESPONSABILIDADE.md do modulo, secao "## Papel"',
      caminho: end.notaMod,
      texto: papel.encontrada && papel.texto ? papel.texto : md.replace(/\r\n/g, '\n').split('\n').filter(Boolean).slice(1, 3).join('\n'),
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

  // T1 - endereco existe
  if (fs.existsSync(end.notaMod)) ok.push('T1 endereco existe: NOTA_DE_RESPONSABILIDADE.md do modulo presente');
  else achados.push(`T1 endereco inexistente: ${end.notaMod}`);

  if (end.notaSub && fs.existsSync(end.notaSub)) ok.push('T1b endereco existe: NOTA_DE_RESPONSABILIDADE.md do submodulo presente');
  else if (end.sub) achados.push(`T1b submodulo sem NOTA_DE_RESPONSABILIDADE.md: ${end.subDir}`);

  // T2 - artefato declarado no endereco
  const textos = [end.notaSub, end.notaMod].filter(p => p && fs.existsSync(p)).map(p => ler(p)).join('\n');
  if (textos.includes(origemRel)) ok.push(`T2 artefato declarado no endereco: "${origemRel}" aparece na Planta`);
  else achados.push(`T2 artefato NAO declarado no endereco: "${origemRel}" nao aparece nas NOTAS de ${end.id}`);

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
    const shaAntigo = antigo !== null ? sha256LF(normalizarBloco(antigo)) : null;
    if (shaAntigo && shaAntigo !== shaAtual) {
      achados.push(`T5 DERIVA no espelho anterior: codigo embutido sha256 ${shaAntigo.slice(0, 12)} != origem ${shaAtual.slice(0, 12)} (${contarLinhas(antigo)} linhas embutidas vs ${contarLinhas(ler(origemAbs))} na origem)`);
    } else if (shaAntigo) {
      ok.push('T5 espelho anterior sem deriva de codigo (sha256 do bloco == origem)');
    } else {
      achados.push('T5 espelho anterior existe mas nao tem bloco de codigo embutido reconhecivel');
    }
    const endDeclarado = (espelhoAnterior.conteudo.match(/\*\*Endere[cç]o[^:]*:\*\*\s*\[?([^\]\n]*(?:\]\([^)]*\))?)/i) || [])[1] || '';
    const rotulo = end.sub || end.mod;
    if (endDeclarado && !(endDeclarado.includes(end.sub || '') || endDeclarado.includes(end.mod))) {
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

  const notaEnd = end.notaSub && fs.existsSync(end.notaSub) ? end.notaSub : end.notaMod;

  const L = [];
  L.push(`# ESPELHO — ${path.basename(origemRel)}`);
  L.push('');
  L.push('> [!NOTE] Espelho rico de código (Metodo §46.15) — gerado por `scripts/downplant/espelho-rico.mjs`');
  L.push('> Somente leitura. Não editar à mão: qualquer edição é sobrescrita na próxima geração.');
  L.push('> O código abaixo é cópia verbatim do arquivo de origem no commit declarado; divergência entre o embutido e a origem é deriva (§18.1).');
  if (papel) L.push(`> Papel desta cópia: ${papel}`);
  L.push('');
  L.push(`- **Endereço Down Plant:** \`${end.id}\` — [${path.basename(notaEnd)}](${linkEnd})`);
  L.push(`- **Arquivo de origem (link para o disco):** [\`${origemRel}\`](${caminhoDisco})`);
  L.push(`- **Commit de referência:** \`${commit.completo}\` (\`${commit.curto}\`)`);
  L.push(`- **Data da última sincronização:** ${data.isoLocalComOffset}`);
  L.push('');
  L.push('## Código-fonte embutido');
  L.push('');
  L.push(`Verbatim de \`${origemRel}\` em \`${commit.curto}\`. sha256 do bloco (LF): \`${shaOrigem}\` — ${contarLinhas(codigo)} linhas.`);
  L.push('');
  L.push('```javascript');
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
  L.push(`- Reexecutar: \`node scripts/downplant/espelho-rico.mjs gerar --endereco ${end.id.replace(/ \/ /g, '/')} --origem ${origemRel} --saida <caminho>\``);
  L.push(`- Verificar deriva sem regravar: \`node scripts/downplant/espelho-rico.mjs verificar --espelho <caminho>\``);
  L.push('');
  return L.join('\n');
}

// --------------------------------------------------------------------- acoes

function gerar(args) {
  const baseDir = path.resolve(args.dir || BASE);
  if (!args.endereco) throw new Error('--endereco obrigatorio');
  if (!args.origem) throw new Error('--origem obrigatorio');
  if (!args.saida.length) throw new Error('--saida obrigatorio (pode repetir)');

  const end = resolverEndereco(baseDir, args.endereco);
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
                 || c.match(/\*\*Caminho Real no Reposit[^:]*:\*\*\s*`([^`]+)`/);
          if (m && m[1].trim() === origemRel) n++;
        }
      })(raiz);
      vaultMirrors = n;
    }
  }

  const testes = testesMecanicos({ baseDir, end, origemRel, origemAbs, commit: commit.completo, shaAtual: shaOrigem, espelhoAnterior: anterior, vaultMirrors });

  const raizVault = args.vault ? path.resolve(args.vault) : null;
  const notaEnd = end.notaSub && fs.existsSync(end.notaSub) ? end.notaSub : end.notaMod;

  for (const s of args.saida) {
    const saida = path.resolve(s);
    const linkDisco = args['link-disco'] || 'relativo';
    // --vault <raiz>: a arvore documental do vault espelha a do repo; o link de endereco
    // tem de resolver DENTRO do vault (navagavel no Obsidian), nao no disco do repo.
    const notaEndAlvo = raizVault ? path.join(raizVault, path.relative(baseDir, notaEnd)) : notaEnd;
    const conteudo = renderizar({
      baseDir, end, origemRel, origemAbs, saida, commit, data, codigo,
      respFonte: responsabilidadeObservada(end),
      portas: { texto: args.portas || null },
      testes, divergenciaExtra: args.divergencia || null, linkDisco,
      linkEnd: link(saida, notaEndAlvo),
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
  out.deriva_codigo = shaBloco !== shaReal;
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
  else if (acao === 'verificar') code = verificar(parseArgs(argv.slice(1)));
  else {
    console.error('Uso: espelho-rico.mjs gerar|verificar ...   (ver cabecalho do arquivo)');
    code = 1;
  }
  process.exit(code);
} catch (e) {
  console.error(`ERRO: ${e.message}`);
  process.exit(1);
}
