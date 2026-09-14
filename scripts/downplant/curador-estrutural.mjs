#!/usr/bin/env node
/**
 * ARQUIVO: scripts/downplant/curador-estrutural.mjs
 * CARD:    #168 [DP24-005] - §46.13 (relatorio do Curador) + divida §46.11 (Markdown DERIVADO do YAML)
 *
 * CONTRATO (verbatim do metodo canonico 2.4):
 *   §7.7   "O Curador nao toma decisoes arquiteturais por conta propria:
 *           OBSERVA -> COMPARA -> DETECTA -> ATUALIZA O QUE FOR MECANICO
 *                                         ou
 *                                       -> REPORTA O QUE EXIGIR DECISAO"   (METODO...:228-231)
 *   §4.5   "YAML e Markdown do handoff divergentes -> o YAML vence; a divergencia em si e deriva
 *           a ser reportada pelo Curador (§7.7)"                              (METODO...:181)
 *   §46.13 "Relatorio do Curador" com 6 campos de cabecalho, 7 secoes e a saida
 *           "SINCRONIZADO | DIVERGENTE | NENHUMA ACAO"                       (METODO...:998-1015)
 *   §18.1  derivas incluem "YAML e Markdown do handoff divergentes (§4.5)"   (METODO...:395)
 *
 * O QUE ESTE PROGRAMA FAZ: OBSERVA (commit/branch observados, o par YAML+Markdown do handoff, os
 * caminhos tocados pelo commit), COMPARA (o espelho em disco x o espelho DERIVADO do YAML canonico),
 * DETECTA (divergencias do par, linhas do espelho sem derivacao, campos do modelo que o objeto nao
 * declara, referencias quebradas) e REPORTA no formato da secao 46.13.
 *
 * A UNICA ACAO MECANICA (e o §7.7 so autoriza o mecanico) e regerar o espelho a partir do YAML.
 * Ela nao e reimplementada aqui: este programa REUSA `gerarMarkdown` de
 * `scripts/downplant/gerar-handoff-md.mjs` (mecanismo unico do §46.11). Sem `--aplicar` o Curador
 * nao escreve nada; sem `--out` nao escreve nem o relatorio.
 *
 * O QUE ESTE PROGRAMA NAO FAZ (e nao ha flag que faca):
 *   - nao decide arquitetura, nao escolhe fonte canonica, nao renomeia modulo, nao reconcilia
 *     arquivo divergente: isso e "REPORTA O QUE EXIGIR DECISAO" (§7.7);
 *   - nao valida o contrato de entrada §32.14 (o validador unico e `validar-handoff.mjs`) e nao
 *     cria segundo parser YAML (reusa `parseYaml` do validador);
 *   - nao inventa dado: fato nao observado sai como nao observado, nunca como SINCRONIZADO.
 *
 * USO:
 *   node scripts/downplant/curador-estrutural.mjs [--par <dir>] [--out <arquivo>] [--aplicar]
 *
 *   --par <dir>   diretorio do par YAML/Markdown (padrao: 08_Execucao_Ao_Vivo)
 *   --out <arq>   escreve o relatorio NO arquivo indicado (sem esta flag: apenas stdout)
 *   --aplicar     aplica a UNICA acao mecanica permitida: regerar o espelho do YAML (§46.11)
 *
 * CODIGO DE SAIDA (mesma convencao do Vigia de dependencias): 0 quando consegue relatar - a
 * divergencia e informada no relatorio, NAO convertida em bloqueio; 1 em erro de uso, erro de
 * leitura/parse ou pedido de decisao/mutacao nao-mecanica recusado.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

// Reuso (nenhum segundo parser YAML, nenhum segundo gerador do espelho):
import { parseYaml } from './validar-handoff.mjs';
import { gerarMarkdown, sha256, normalizarEol, contarLinhas, YAML_PADRAO, MD_PADRAO, BASE, NAO_DECLARADO, pegar } from './gerar-handoff-md.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ESTADO_SINCRONIZADO = 'SINCRONIZADO';
const ESTADO_DIVERGENTE = 'DIVERGENTE';
const ESTADO_NEUTRO = 'NENHUMA AÇÃO';

// Pedidos de DECISAO ou de mutacao nao-mecanica: recusados ANTES de qualquer leitura/escrita (§7.7).
const FLAGS_PROIBIDAS = ['--fix', '--auto', '--patch', '--upgrade', '--decidir', '--decisao', '--resolver'];

// Campos do modelo §46.12/§46.11 que o objeto pode nao declarar. A ausencia e MEDIDA, nunca
// preenchida por suposicao: o Curador lista a ausencia e devolve a decisao.
const CAMPOS_DO_MODELO = [
  'downplant.terreno', 'downplant.submodulo', 'downplant.circuito', 'downplant.porta',
  'conexoes.origem', 'conexoes.destino', 'conexoes.contrato',
  'escopo.artefatos', 'proibicoes.efeitos_externos', 'proibicoes.publicacao'
];

function uso() {
  return [
    'CURADOR ESTRUTURAL (§7.7 / §46.13) - observa, compara, detecta e reporta.',
    '',
    'uso: node scripts/downplant/curador-estrutural.mjs [--par <dir>] [--out <arquivo>] [--aplicar]',
    '',
    '  --par <dir>   diretorio do par YAML/Markdown do handoff (padrao: 08_Execucao_Ao_Vivo)',
    '  --out <arq>   escreve o relatorio NO arquivo indicado (sem esta flag: apenas stdout)',
    '  --aplicar     aplica a UNICA acao mecanica: regerar o espelho do YAML canonico (§46.11)',
    '',
    'recusadas por contrato (§7.7 - decisao nao e do Curador): ' + FLAGS_PROIBIDAS.join(' ')
  ].join('\n');
}

function recusar(flag) {
  process.stderr.write(
    `CURADOR: pedido recusado - "${flag}".\n` +
    'O Curador ESTRUTURAL nao decide: "O Curador nao toma decisoes arquiteturais por conta propria"\n' +
    '(§7.7 - METODO_DOWN_PLANT_PROGRESSIVO_v2.4.md:228). A unica acao mecanica e regerar o espelho do\n' +
    'YAML canonico (§46.11) via `--aplicar`; o resto e REPORTA O QUE EXIGIR DECISAO.\n'
  );
  process.exit(1);
}

function parseArgs(argv) {
  const args = { par: null, out: null, aplicar: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (FLAGS_PROIBIDAS.includes(a.split('=')[0])) recusar(a);
    if (a === '--help' || a === '-h') { process.stdout.write(uso() + '\n'); process.exit(0); }
    if (a === '--par') { args.par = argv[++i]; continue; }
    if (a === '--out') { args.out = argv[++i]; continue; }
    if (a === '--aplicar') { args.aplicar = true; continue; }
    process.stderr.write(`CURADOR: argumento nao reconhecido "${a}".\n\n${uso()}\n`);
    process.exit(1);
  }
  return args;
}

function git(args) {
  try { return execFileSync('git', ['-C', BASE, ...args], { encoding: 'utf8' }).trim(); }
  catch (e) { return null; }
}

// ---------------------------------------------------------------------------
// OBSERVA
// ---------------------------------------------------------------------------
function observar(dirPar) {
  const arqYaml = path.resolve(BASE, dirPar, path.basename(YAML_PADRAO));
  const arqMd = path.resolve(BASE, dirPar, path.basename(MD_PADRAO));
  const rel = (p) => path.relative(BASE, p).split(path.sep).join('/');

  const obs = {
    arqYaml, arqMd,
    relYaml: rel(arqYaml), relMd: rel(arqMd),
    commit: git(['rev-parse', '--short', 'HEAD']),
    branch: git(['rev-parse', '--abbrev-ref', 'HEAD']),
    caminhos: (git(['show', '--name-only', '--pretty=format:', 'HEAD']) || '').split('\n').map((s) => s.trim()).filter(Boolean),
    yamlExiste: fs.existsSync(arqYaml),
    mdExiste: fs.existsSync(arqMd),
    doc: null, yamlBruto: null, mdEmDisco: null, gerado: null, mapa: null, erroYaml: null
  };

  if (obs.yamlExiste) {
    obs.yamlBruto = fs.readFileSync(arqYaml, 'utf8');
    try { obs.doc = parseYaml(obs.yamlBruto); }
    catch (e) { obs.erroYaml = e.message; }
  }
  if (obs.doc) {
    const g = gerarMarkdown(obs.doc, { arquivoMd: obs.arqMd });
    obs.gerado = normalizarEol(g.markdown);
    obs.mapa = g.mapa;
  }
  if (obs.mdExiste) obs.mdEmDisco = fs.readFileSync(arqMd, 'utf8');
  return obs;
}

// ---------------------------------------------------------------------------
// COMPARA + DETECTA
// ---------------------------------------------------------------------------
function classificarCaminhos(caminhos) {
  const comodos = new Set(); const modulos = new Set(); const circuitos = new Set();
  caminhos.forEach((c) => {
    const mComodo = c.match(/02_Comodos\/(C\d\d)_/); if (mComodo) comodos.add(mComodo[1]);
    (c.match(/MOD-C\d\d-\d\d[A-Z0-9_\-]*/g) || []).forEach((m) => modulos.add(m));
    const b = path.basename(c);
    if (/^CIR-.*\.canvas$/i.test(b)) circuitos.add(b.replace(/\.canvas$/i, ''));
  });
  return {
    comodos: [...comodos].sort(),
    modulos: [...modulos].sort(),
    circuitos: [...circuitos].sort()
  };
}

function comparar(obs) {
  const d = {
    linhasDisco: obs.mdEmDisco ? contarLinhas(obs.mdEmDisco) : 0,
    linhasGerado: obs.gerado ? contarLinhas(obs.gerado) : 0,
    shaDisco: obs.mdEmDisco ? sha256(obs.mdEmDisco) : null,
    shaGerado: obs.gerado ? sha256(obs.gerado) : null,
    identico: false,
    soEol: false,
    soNoEspelho: [],
    soNoDerivado: [],
    camposAusentes: [],
    referenciasQuebradas: [],
    paths: classificarCaminhos(obs.caminhos)
  };
  if (obs.mdEmDisco && obs.gerado) {
    d.identico = obs.mdEmDisco === obs.gerado;
    d.soEol = !d.identico && normalizarEol(obs.mdEmDisco) === obs.gerado;
    const a = obs.mdEmDisco.split(/\r?\n/).map((s) => s.trim()).filter((s) => s !== '');
    const b = obs.gerado.split('\n').map((s) => s.trim()).filter((s) => s !== '');
    const setB = new Set(b); const setA = new Set(a);
    d.soNoEspelho = [...new Set(a.filter((l) => !setB.has(l)))];
    d.soNoDerivado = [...new Set(b.filter((l) => !setA.has(l)))];
  }
  CAMPOS_DO_MODELO.forEach((k) => {
    const v = pegar(obs.doc || {}, k);
    if (v === undefined || v === null || String(v).trim() === '') d.camposAusentes.push(k);
  });
  Object.keys((obs.doc || {}).referencias || {}).forEach((k) => {
    const v = pegar(obs.doc, `referencias.${k}`);
    if (v === undefined || v === null || String(v).trim() === '') return;
    const abs = path.resolve(BASE, String(v));
    if (!fs.existsSync(abs)) d.referenciasQuebradas.push(`${k} -> ${v}`);
  });
  d.estado = !obs.doc || !obs.gerado
    ? ESTADO_NEUTRO
    : (d.identico && d.camposAusentes.length === 0 && d.referenciasQuebradas.length === 0
      ? ESTADO_SINCRONIZADO
      : ESTADO_DIVERGENTE);
  return d;
}

// ---------------------------------------------------------------------------
// RELATORIO (§46.13, na estrutura exata do metodo)
// ---------------------------------------------------------------------------
function montarRelatorio(obs, cmp, atualizacao) {
  const L = [];
  const nao = (v) => (v === undefined || v === null || String(v).trim() === '' ? '(nao observado)' : String(v));
  const lista = (xs) => (xs.length ? xs.join(', ') : 'nenhum');

  L.push('# CURADOR DOWN PLANT');
  L.push(`- Commit observado: ${nao(obs.commit)} (branch ${nao(obs.branch)}; ${obs.caminhos.length} caminho(s) no commit)`);
  L.push(`- Cômodos afetados: ${lista(cmp.paths.comodos)}`);
  L.push(`- Módulos afetados: ${lista(cmp.paths.modulos)}`);
  L.push(`- Circuitos afetados: ${lista(cmp.paths.circuitos)}`);
  L.push(`- Estado anterior: espelho versionado \`${obs.relMd}\` ${obs.mdExiste ? 'no disco' : 'AUSENTE'} - sha256=${cmp.shaDisco ? cmp.shaDisco.slice(0, 16) : '(ausente)'}..., ${cmp.linhasDisco} linhas`);
  L.push(`- Estado encontrado: espelho DERIVADO do YAML canônico \`${obs.relYaml}\` - sha256=${cmp.shaGerado ? cmp.shaGerado.slice(0, 16) : '(nao derivado)'}..., ${cmp.linhasGerado} linhas`);
  L.push('');
  L.push(`> Relatório gerado por \`scripts/downplant/curador-estrutural.mjs\` - formato §46.13 (METODO_DOWN_PLANT_PROGRESSIVO_v2.4.md:998-1015).`);
  L.push('> Papel (§7.7 - :228-231): OBSERVA → COMPARA → DETECTA → ATUALIZA O QUE FOR MECÂNICO ou REPORTA O QUE EXIGIR DECISÃO.');
  L.push('> O Curador **não decide** arquitetura e **não** escolhe fonte canônica: §4.5 (:181) já decide — *o YAML vence*.');
  L.push('');

  // --- Alterações mecanicamente reconciliáveis
  L.push('## Alterações mecanicamente reconciliáveis');
  if (!cmp.identico) {
    L.push(`- Regerar o espelho Markdown a partir do YAML canônico (§46.11 - :926: *"Não editar diretamente — editar o YAML de origem e regerar"*):`);
    L.push('  `node scripts/downplant/gerar-handoff-md.mjs --aplicar`');
    L.push(`  (espelho em disco com ${cmp.linhasDisco} linhas x derivado do YAML com ${cmp.linhasGerado} linhas` +
      `${cmp.soEol ? '; divergência APENAS de terminador de linha CRLF x LF' : ''})`);
    L.push(`- Linhas presentes só no espelho (sem derivação no YAML): ${cmp.soNoEspelho.length}`);
    cmp.soNoEspelho.slice(0, 5).forEach((l) => L.push(`  - \`${l.slice(0, 120)}\``));
    L.push(`- Linhas presentes só no derivado (ausentes no espelho): ${cmp.soNoDerivado.length}`);
    cmp.soNoDerivado.slice(0, 5).forEach((l) => L.push(`  - \`${l.slice(0, 120)}\``));
  } else {
    L.push('- Nenhuma: o espelho em disco já é byte a byte o derivado do YAML canônico (nenhuma linha digitada à mão).');
  }
  L.push('');

  // --- Divergências
  L.push('## Divergências');
  if (cmp.camposAusentes.length) {
    L.push(`- Campos do modelo canônico que o objeto **não declara** (a ausência é um fato medido, não preenchido por suposição): ${cmp.camposAusentes.map((c) => `\`${c}\``).join(', ')}.`);
    L.push('  Origem da lista: objeto §46.12 (:971-996: `downplant.terreno|submodulo|circuito|porta`) e rubricas §46.11 (:927-968: `conexões`, `escopo.artefatos`, `proibições.efeitos_externos|publicação`).');
    L.push('  Regenerar o espelho **não** resolve: exige decisão (declarar o campo no YAML ou aceitar a ausência).');
  } else {
    L.push('- Nenhum campo do modelo §46.12/§46.11 ausente no objeto.');
  }
  if (cmp.referenciasQuebradas.length) {
    cmp.referenciasQuebradas.forEach((r) => L.push(`- Referência declarada e INEXISTENTE em disco: ${r}`));
  } else {
    L.push('- Nenhuma referência declarada aponta para arquivo inexistente.');
  }
  if (!cmp.identico && cmp.soNoEspelho.length) {
    L.push(`- O espelho contém ${cmp.soNoEspelho.length} linha(s) que o YAML não sustenta: conteúdo no Markdown sem origem na fonte canônica (§4.5).`);
  }
  if (!obs.yamlExiste) L.push(`- YAML canônico AUSENTE em \`${obs.relYaml}\`: nada a curar (§4.5 — sem fonte canônica, o espelho é órfão).`);
  if (obs.erroYaml) L.push(`- YAML canônico ILEGÍVEL: ${obs.erroYaml}`);
  L.push('- Contrato de entrada §32.14 do handoff: verificado pelo **validador único** `scripts/downplant/validar-handoff.mjs` (não duplicado aqui — §32.14 tem um dono só).');
  L.push('');

  // --- Links e Canvas
  L.push('## Links e Canvas');
  const plantaMestra = pegar(obs.doc || {}, 'referencias.planta_mestra');
  if (plantaMestra) {
    const abs = path.resolve(BASE, String(plantaMestra));
    L.push(`- \`referencias.planta_mestra\` -> \`${plantaMestra}\`: ${fs.existsSync(abs) ? 'existe em disco' : 'INEXISTENTE'}`);
  } else {
    L.push('- Nenhum canvas declarado como referência do handoff.');
  }
  L.push(`- Canvas citados pelo commit observado: ${lista(cmp.paths.circuitos.map((c) => c + '.canvas'))}. Nenhum canvas foi sobrescrito ou editado por esta passagem.`);
  L.push('');

  // --- Handoffs YAML/Markdown divergentes
  L.push('## Handoffs YAML/Markdown divergentes');
  if (!obs.yamlExiste) {
    L.push('- Não há par a comparar: o YAML canônico está ausente.');
  } else if (!obs.mdExiste) {
    L.push(`- O espelho \`${obs.relMd}\` está AUSENTE: o par não existe materializado (deriva §4.5 — o YAML vence e o espelho é regerado).`);
  } else if (cmp.identico) {
    L.push(`- \`${obs.relYaml}\` x \`${obs.relMd}\`: **sem divergência** — o espelho é byte a byte o derivado do YAML (sha256 = ${cmp.shaGerado.slice(0, 16)}..., ${cmp.linhasGerado} linhas).`);
  } else {
    L.push(`- \`${obs.relYaml}\` x \`${obs.relMd}\`: **DIVERGENTES**`);
    L.push(`  - espelho em disco: sha256=${cmp.shaDisco.slice(0, 16)}..., ${cmp.linhasDisco} linhas`);
    L.push(`  - derivado do YAML: sha256=${cmp.shaGerado.slice(0, 16)}..., ${cmp.linhasGerado} linhas`);
    L.push(`  - pela §4.5 (:181) **o YAML vence**; a divergência em si é deriva a ser reportada pelo Curador (§7.7).`);
  }
  L.push('');

  // --- Atualização realizada
  L.push('## Atualização realizada');
  L.push(atualizacao);
  L.push('');

  // --- Decisão humana necessária
  L.push('## Decisão humana necessária');
  const decisoes = [];
  if (cmp.camposAusentes.length) {
    decisoes.push(`declarar no YAML (ou aceitar como ausente) os campos do modelo não declarados: ${cmp.camposAusentes.join(', ')}`);
  }
  cmp.referenciasQuebradas.forEach((r) => decisoes.push(`referência declarada e inexistente em disco: ${r}`));
  if (!obs.yamlExiste) decisoes.push(`restaurar ou repor o YAML canônico \`${obs.relYaml}\``);
  if (decisoes.length === 0) {
    L.push('- Não.');
  } else {
    decisoes.forEach((x, i) => L.push(`${i + 1}. ${x}`));
  }
  L.push('');

  // --- Resultado
  L.push('## Resultado');
  L.push(`**${cmp.estado}**`);
  L.push('');
  L.push(`**Estado do Curador (§46.13):** \`${cmp.estado}\``);
  L.push('');
  L.push('SINCRONIZADO | DIVERGENTE | NENHUMA AÇÃO');
  return L.join('\n') + '\n';
}

// ---------------------------------------------------------------------------
// principal
// ---------------------------------------------------------------------------
function principal() {
  const args = parseArgs(process.argv.slice(2));
  const dirPar = args.par ? args.par : path.dirname(YAML_PADRAO);

  const obs = observar(dirPar);
  const cmp = comparar(obs);
  if (cmp.estado === ESTADO_NEUTRO) {
    process.stdout.write(
      '# CURADOR DOWN PLANT\n' +
      `- Commit observado: ${obs.commit || '(nao observado)'} (branch ${obs.branch || '(nao observada)'})\n` +
      '- Cômodos afetados: nenhum\n- Módulos afetados: nenhum\n- Circuitos afetados: nenhum\n' +
      '- Estado anterior: (nada a curar)\n- Estado encontrado: (nada a curar)\n\n' +
      `> Nenhum objeto \`downplant_handoff\` materializado em \`${dirPar}\` (§46.12): não há par YAML/Markdown a comparar.\n\n` +
      '## Alterações mecanicamente reconciliáveis\n- Nenhuma.\n\n' +
      '## Divergências\n- Nenhuma observada.\n\n' +
      '## Links e Canvas\n- Nenhum canvas declarado.\n\n' +
      '## Handoffs YAML/Markdown divergentes\n- Não há par a comparar.\n\n' +
      '## Atualização realizada\nNenhuma.\n\n' +
      '## Decisão humana necessária\n- Não.\n\n' +
      '## Resultado\n**NENHUMA AÇÃO**\n\n' +
      '**Estado do Curador (§46.13):** `NENHUMA AÇÃO`\n\n' +
      'SINCRONIZADO | DIVERGENTE | NENHUMA AÇÃO\n'
    );
    process.exit(0);
  }

  let atualizacao = 'Nenhuma: esta rodada é somente leitura (o §46.13 exige `--aplicar` para a ação mecânica).';
  if (args.aplicar) {
    if (cmp.identico) {
      atualizacao = 'Nenhuma: já não havia divergência a reconciliar (espelho == derivado do YAML).';
    } else {
      fs.writeFileSync(obs.arqMd, obs.gerado, 'utf8');
      const depois = sha256(fs.readFileSync(obs.arqMd, 'utf8'));
      atualizacao = `Espelho regerado a partir do YAML canônico (§46.11) via \`scripts/downplant/gerar-handoff-md.mjs\`: ` +
        `\`${obs.relMd}\` sha256 ${cmp.shaDisco ? cmp.shaDisco.slice(0, 16) : '(ausente)'}... -> ${depois.slice(0, 16)}... ` +
        `(${cmp.linhasGerado} linhas). Nenhum outro arquivo foi tocado. O YAML **não** foi alterado.`;
      cmp.identico = true; cmp.shaDisco = depois; cmp.linhasDisco = cmp.linhasGerado;
      cmp.estado = (cmp.camposAusentes.length === 0 && cmp.referenciasQuebradas.length === 0) ? ESTADO_SINCRONIZADO : ESTADO_DIVERGENTE;
    }
  }

  const relatorio = montarRelatorio(obs, cmp, atualizacao);
  if (args.out) {
    const destino = path.resolve(BASE, args.out);
    fs.writeFileSync(destino, relatorio, 'utf8');
    process.stdout.write(`CURADOR: relatorio escrito em ${destino} (nenhum outro arquivo foi tocado)\n`);
  } else {
    process.stdout.write(relatorio);
  }
  process.exit(0);
}

try {
  principal();
} catch (err) {
  process.stderr.write(`CURADOR: erro - ${err.message}\n`);
  process.exit(1);
}
