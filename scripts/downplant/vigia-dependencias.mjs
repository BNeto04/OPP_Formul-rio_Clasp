#!/usr/bin/env node
/**
 * ARQUIVO: scripts/downplant/vigia-dependencias.mjs
 * CARD:    #167 [DP24-004] - VIGIA DE DEPENDENCIAS (§7.8 / §46.14)
 *
 * CONTRATO (verbatim do metodo canonico):
 *   §7.8  "O Vigia nao decide adotar ou trocar uma dependencia por conta propria - apenas observa,
 *          compara e reporta ao Planejador ou Proprietario"          (METODO_DOWN_PLANT...v2.4.md:234)
 *   §31.6 "nunca aplica a atualizacao por conta propria."              (METODO_DOWN_PLANT...v2.4.md:508)
 *
 * O QUE ESTE PROGRAMA FAZ: le o vinculo registrado (§31.6) de cada dependencia, le a observacao upstream
 * registrada por quem observa, COMPARA as versoes e REPORTA no formato da secao 46.14.
 *
 * O QUE ESTE PROGRAMA NAO FAZ (e nao ha flag que faca):
 *   - nao aplica atualizacao; nao troca dependencia; nao edita o registro; nao resolve defasagem;
 *   - nao inventa dado upstream (sem observacao => estado NENHUMA AÇÃO, nunca SINCRONIZADO por suposicao);
 *   - nao escreve em arquivo nenhum sem `--out` explicito. O modo padrao escreve SO em stdout.
 *
 * USO:
 *   node scripts/downplant/vigia-dependencias.mjs [--registro <dir>] [--snapshot <arquivo>] [--out <arquivo>]
 *
 * CODIGO DE SAIDA: 0 quando consegue relatar (a defasagem e informada no relatorio, NAO convertida em
 * bloqueio); 1 apenas em erro de uso ou em pedido de mutacao recusado.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO = path.resolve(__dirname, '..', '..');

// Flags de mutacao declaradas proibidas pelo contrato do §7.8. Recusa ANTES de qualquer leitura/escrita.
const FLAGS_PROIBIDAS = [
  '--aplicar', '--atualizar', '--fix', '--auto', '--write-registry', '--escrever', '--patch', '--upgrade'
];

const ESTADO_SINCRONIZADO = 'SINCRONIZADO';
const ESTADO_DEFASADO = 'DEFASADO';
const ESTADO_NEUTRO = 'NENHUMA AÇÃO';

function uso() {
  return [
    'VIGIA DE DEPENDENCIAS (§7.8) - observa, compara e reporta. NAO decide, NAO atualiza.',
    '',
    'uso: node scripts/downplant/vigia-dependencias.mjs [--registro <dir>] [--snapshot <arquivo>] [--out <arquivo>]',
    '',
    '  --registro <dir>     diretorio dos registros DEP-*.md (padrao: dependencias/)',
    '  --snapshot <arquivo> observacao upstream (padrao: dependencias/vigia/UPSTREAM_OBSERVADO.json)',
    '  --out <arquivo>      escreve o relatorio NO arquivo indicado (sem esta flag: apenas stdout)',
    '',
    'recusadas por contrato (§7.8): ' + FLAGS_PROIBIDAS.join(' ')
  ].join('\n');
}

function recusarMutacao(flag) {
  process.stderr.write(
    `VIGIA: pedido de mutacao recusado - "${flag}".\n` +
    'O Vigia de dependencias observa, compara e reporta; NAO decide, NAO atualiza e NAO aplica\n' +
    '(§7.8 - METODO_DOWN_PLANT_PROGRESSIVO_v2.4.md:234; §31.6 - :508). A reconciliacao e decisao humana (§46.14).\n'
  );
  process.exit(1);
}

function parseArgs(argv) {
  const args = { registro: null, snapshot: null, out: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (FLAGS_PROIBIDAS.includes(a.split('=')[0])) recusarMutacao(a);
    if (a === '--help' || a === '-h') { process.stdout.write(uso() + '\n'); process.exit(0); }
    if (a === '--registro') { args.registro = argv[++i]; continue; }
    if (a === '--snapshot') { args.snapshot = argv[++i]; continue; }
    if (a === '--out') { args.out = argv[++i]; continue; }
    process.stderr.write(`VIGIA: argumento nao reconhecido "${a}".\n\n${uso()}\n`);
    process.exit(1);
  }
  return args;
}

// --- leitura (somente leitura; nenhum write fora de --out) -------------------
function lerFrontmatter(texto) {
  const m = texto.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const fm = {};
  m[1].split(/\r?\n/).forEach((linha) => {
    const i = linha.indexOf(':');
    if (i <= 0) return;
    const chave = linha.slice(0, i).trim();
    let valor = linha.slice(i + 1).trim();
    if (valor.startsWith('"') && valor.endsWith('"')) valor = valor.slice(1, -1);
    fm[chave] = valor;
  });
  return fm;
}

function lerRegistro(dirRegistro) {
  if (!fs.existsSync(dirRegistro)) throw new Error(`registro inexistente: ${dirRegistro}`);
  return fs.readdirSync(dirRegistro)
    .filter((f) => /^DEP-\d+.*\.md$/.test(f))
    .sort()
    .map((f) => {
      const completo = path.join(dirRegistro, f);
      const fm = lerFrontmatter(fs.readFileSync(completo, 'utf8'));
      return {
        arquivo: path.relative(REPO, completo).split(path.sep).join('/'),
        id: fm.id || f.replace(/_.*$/, ''),
        nome: fm.nome || '(nome ausente)',
        versao: fm.versao || '(versao ausente)',
        fonte: fm.fonte || '(fonte ausente)',
        decisao: fm.decisao || '(decisao ausente)',
        estado: fm.estado || '(estado ausente)'
      };
    });
}

function lerSnapshot(arquivo) {
  if (!fs.existsSync(arquivo)) throw new Error(`observacao upstream inexistente: ${arquivo}`);
  const bruto = JSON.parse(fs.readFileSync(arquivo, 'utf8'));
  const lista = Array.isArray(bruto.observacoes) ? bruto.observacoes : [];
  const porId = {};
  lista.forEach((o) => { porId[o.id] = o; });
  return { meta: bruto, porId };
}

// --- comparacao --------------------------------------------------------------
function tokenVersao(v) {
  return String(v == null ? '' : v).split(/[(;]/)[0].split(/\s+/)[0].trim().toUpperCase();
}

const AUSENTES = ['AUSENTE_DECLARADO', 'NAO_PINADA', '', '(VERSAO AUSENTE)'];

function comparar(dep, obs) {
  if (!obs || obs.observado !== true) {
    return {
      estado: ESTADO_NEUTRO,
      motivo: (obs && obs.motivo) || 'nenhuma observacao upstream registrada nesta rodada',
      recomendacao: 'registrar observacao da fonte declarada (`fonte`) na proxima rodada do Vigia',
      decisaoHumana: 'Não',
      risco: (obs && obs.risco) || 'nao estimado - sem observacao'
    };
  }
  const registrada = tokenVersao(dep.versao);
  const observada = tokenVersao(obs.versao_observada);
  const risco = obs.risco || 'nao estimado';

  if (AUSENTES.includes(registrada)) {
    return {
      estado: ESTADO_DEFASADO,
      motivo: 'versao registrada ausente/nao pinada no vinculo, embora o §31.6 exija versao',
      recomendacao: 'registrar a versao instalada no campo `versao` do vinculo (dependencias/' + dep.id +
        ') - nao ha aplicacao automatica: e registro de decisao, §31.6',
      decisaoHumana: 'Sim',
      risco
    };
  }
  if (registrada === observada) {
    return {
      estado: ESTADO_SINCRONIZADO,
      motivo: `versao registrada == versao observada (${registrada})`,
      recomendacao: 'nenhuma acao; o vinculo continua valido',
      decisaoHumana: 'Não',
      risco
    };
  }
  return {
    estado: ESTADO_DEFASADO,
    motivo: `divergencia de versao: registrada ${registrada} x observada ${observada}`,
    recomendacao: `avaliar a versao ${observada} como candidato a reconciliacao (decisao humana)`,
    decisaoHumana: 'Sim',
    risco
  };
}

function estadoGlobal(itens) {
  const estados = itens.map((i) => i.comparacao.estado);
  if (estados.includes(ESTADO_DEFASADO)) return ESTADO_DEFASADO;
  if (estados.includes(ESTADO_SINCRONIZADO)) return ESTADO_SINCRONIZADO;
  return ESTADO_NEUTRO;
}

// --- relatorio (§46.14, verbatim) -------------------------------------------
function montarRelatorio(deps, snap, caminhoSnapshot) {
  const itens = deps.map((d) => ({ dep: d, obs: snap.porId[d.id], comparacao: comparar(d, snap.porId[d.id]) }));
  const L = [];
  L.push('# VIGIA DE DEPENDÊNCIAS');
  L.push(`- Data: ${snap.meta.observado_em || '(nao registrada)'}`);
  L.push(`- Escopo observado: ${snap.meta.escopo || `dependencias/ (${deps.length} registros §31.6)`}`);
  L.push(`- Observacao upstream: \`${caminhoSnapshot}\``);
  L.push(`- Observador: ${snap.meta.observador || '(nao registrado)'}`);
  L.push('');
  L.push('> Relatorio gerado por `scripts/downplant/vigia-dependencias.mjs` - **somente leitura**.');
  L.push('> O Vigia **observa, compara e reporta**; **nao decide** e **nao aplica** atualizacao (§7.8 / §31.6).');
  L.push('');
  L.push('## Dependências vinculadas monitoradas');
  L.push('| Registro | Dependencia | Versao registrada | Decisao (§46.4) | Fonte observada |');
  L.push('|---|---|---|---|---|');
  deps.forEach((d) => {
    L.push(`| \`${d.id}\` | ${d.nome} | \`${d.versao}\` | \`${d.decisao}\` | ${d.fonte} |`);
  });
  L.push('');
  L.push('## Atualizações detectadas upstream');
  L.push('| Registro | Observado | Versao observada | Origem |');
  L.push('|---|---|---|---|');
  itens.forEach(({ dep, obs }) => {
    if (obs && obs.observado === true) {
      L.push(`| \`${dep.id}\` | sim | \`${obs.versao_observada}\` | ${obs.origem} |`);
    } else {
      L.push(`| \`${dep.id}\` | nao | - | ${(obs && obs.motivo) || 'sem observacao registrada'} |`);
    }
  });
  L.push('');
  L.push('## Divergência entre versão registrada e versão atual');
  L.push('| Registro | Registrada | Observada | Estado | Motivo |');
  L.push('|---|---|---|---|---|');
  itens.forEach(({ dep, obs, comparacao }) => {
    const obsVer = obs && obs.observado === true ? obs.versao_observada : '-';
    L.push(`| \`${dep.id}\` | \`${dep.versao}\` | \`${obsVer}\` | **${comparacao.estado}** | ${comparacao.motivo} |`);
  });
  L.push('');
  L.push('## Risco estimado da defasagem');
  L.push('| Registro | Risco |');
  L.push('|---|---|');
  itens.forEach(({ dep, comparacao }) => { L.push(`| \`${dep.id}\` | ${comparacao.risco} |`); });
  L.push('');
  L.push('## Recomendação');
  itens.forEach(({ dep, comparacao }) => { L.push(`- \`${dep.id}\`: ${comparacao.recomendacao}`); });
  L.push('');
  L.push('## Decisão humana necessária');
  L.push('| Registro | Decisao humana necessaria | O que precisa ser decidido |');
  L.push('|---|---|---|');
  itens.forEach(({ dep, comparacao }) => {
    L.push(`| \`${dep.id}\` | ${comparacao.decisaoHumana} | ${comparacao.recomendacao} |`);
  });
  L.push('');
  L.push(`**Estado do Vigia (§46.14):** \`${estadoGlobal(itens)}\``);
  L.push('');
  L.push('SINCRONIZADO | DEFASADO | NENHUMA AÇÃO');
  return L.join('\n') + '\n';
}

// --- principal ---------------------------------------------------------------
function principal() {
  const args = parseArgs(process.argv.slice(2));
  const dirRegistro = args.registro ? path.resolve(args.registro) : path.join(REPO, 'dependencias');
  const arqSnapshot = args.snapshot
    ? path.resolve(args.snapshot)
    : path.join(REPO, 'dependencias', 'vigia', 'UPSTREAM_OBSERVADO.json');

  const deps = lerRegistro(dirRegistro);
  const snap = lerSnapshot(arqSnapshot);
  const relatorio = montarRelatorio(deps, snap, path.relative(REPO, arqSnapshot).split(path.sep).join('/') || arqSnapshot);

  if (args.out) {
    const destino = path.resolve(args.out);
    fs.writeFileSync(destino, relatorio, 'utf8');
    process.stdout.write(`VIGIA: relatorio escrito em ${destino} (nenhum outro arquivo foi tocado)\n`);
  } else {
    process.stdout.write(relatorio);
  }
  process.exit(0);
}

try {
  principal();
} catch (err) {
  process.stderr.write(`VIGIA: erro - ${err.message}\n`);
  process.exit(1);
}
