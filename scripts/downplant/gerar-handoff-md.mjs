#!/usr/bin/env node
/**
 * ARQUIVO: scripts/downplant/gerar-handoff-md.mjs
 * CARD:    #168 [DP24-005] - §46.11 (espelho Markdown DERIVADO do YAML canonico) + §46.13/§46.14
 *
 * CONTRATO (verbatim do metodo canonico 2.4):
 *   §46.11  "Gerado automaticamente a partir do objeto downplant_handoff (§46.12). Nao editar
 *            diretamente - editar o YAML de origem e regerar."     (METODO_DOWN_PLANT...v2.4.md:926)
 *   §4.5    "YAML e Markdown do handoff divergentes -> o YAML vence; a divergencia em si e deriva
 *            a ser reportada pelo Curador (§7.7)"                  (METODO_DOWN_PLANT...v2.4.md:181)
 *   §7.7    "OBSERVA -> COMPARA -> DETECTA -> ATUALIZA O QUE FOR MECANICO ou -> REPORTA O QUE
 *            EXIGIR DECISAO"                                       (METODO_DOWN_PLANT...v2.4.md:229-231)
 *
 * O QUE ESTE PROGRAMA FAZ: le o YAML canonico (§46.12) e GERA o espelho Markdown com o corpo da
 * §46.11 (METODO...:927-968) mais os blocos que o proprio objeto declara. Todo VALOR sai verbatim
 * do YAML - nenhum valor e reescrito, normalizado ou traduzido. As unicas linhas que nao vem do
 * YAML sao a estrutura fixa (titulos do modelo §46.11, cabecalho de tabela, separadores).
 *
 * O QUE ESTE PROGRAMA NAO FAZ: nao inventa campo, nao completa campo ausente (campo ausente sai
 * como a marcacao explicita `(nao declarado no YAML)`), nao decide, nao valida o YAML (o validador
 * canonico e `scripts/downplant/validar-handoff.mjs`, reusado aqui - nao ha segundo parser YAML
 * neste repositorio) e nao escreve nada sem `--out`/`--aplicar`.
 *
 * USO:
 *   node scripts/downplant/gerar-handoff-md.mjs                 # markdown gerado em stdout
 *   node scripts/downplant/gerar-handoff-md.mjs --mapa          # tabela de derivacao (linha -> chave)
 *   node scripts/downplant/gerar-handoff-md.mjs --out <arquivo> # grava no arquivo indicado
 *   node scripts/downplant/gerar-handoff-md.mjs --aplicar       # grava no espelho padrao (§46.11)
 *   node scripts/downplant/gerar-handoff-md.mjs --check         # 0 = identico | 1 = divergente
 *
 * CODIGO DE SAIDA:
 *   0 = espelho identico ao derivado do YAML (ou geracao/impressao concluida)
 *   1 = `--check` e o espelho DIVERGE do derivado do YAML (deriva §4.5)
 *   2 = erro de leitura/parse/uso
 *
 * A FECHADURA vive em Testes/TestCuradorEstrutural.js: prova a derivacao (linha a linha), prova o
 * RED por edicao manual do .md e por alteracao do YAML sem regerar.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

// Unico parser YAML do repositorio: reuso do validador canonico (#163/§32.14).
// Nao existe (nem deve existir) um segundo parser YAML de handoff no repositorio.
import { parseYaml } from './validar-handoff.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const BASE = path.resolve(__dirname, '..', '..');

export const YAML_PADRAO = '08_Execucao_Ao_Vivo/downplant_handoff.yaml';
export const MD_PADRAO = '08_Execucao_Ao_Vivo/downplant_handoff.md';

// Marcacao explicita de campo ausente: a ausencia e um FATO derivado do YAML (nao um valor).
export const NAO_DECLARADO = '(nao declarado no YAML)';

export function sha256(texto) {
  return crypto.createHash('sha256').update(texto, 'utf8').digest('hex');
}

export function normalizarEol(texto) {
  return String(texto).replace(/\r\n/g, '\n');
}

// Linhas de conteudo (mesma convencao de `wc -l`): o terminador final nao conta como linha.
export function contarLinhas(texto) {
  const t = normalizarEol(texto);
  return t === '' ? 0 : t.replace(/\n$/, '').split('\n').length;
}

// ---------------------------------------------------------------------------
// Acesso ao YAML (caminho pontuado; indices de lista com [n])
// ---------------------------------------------------------------------------
export function pegar(doc, caminho) {
  return String(caminho).split('.').reduce((n, k) => (n === undefined || n === null ? undefined : n[k]), doc);
}

// ---------------------------------------------------------------------------
// Geracao (§46.11 como corpo canonico + blocos declarados pelo objeto)
// ---------------------------------------------------------------------------
export function gerarMarkdown(doc, opcoes = {}) {
  const L = [];
  const mapa = [];
  // O espelho pode ser gravado em outro diretorio (`--md`): os links DERIVADOS das referencias
  // sao resolvidos relativos ao diretorio do proprio espelho - e assim que o lint estrutural
  // valida link (`path.resolve(path.dirname(file), link)`, lint-estrutura.mjs:173).
  const dirMd = path.dirname(path.resolve(opcoes.arquivoMd || path.resolve(BASE, MD_PADRAO)));
  const vazio = (v) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

  // p(): grava a linha e registra de ONDE ela deriva.
  //   tipo 'yaml'      -> valor lido do YAML (tem de aparecer no texto do YAML)
  //   tipo 'ausente'   -> chave do YAML consultada e vazia (renderiza NAO_DECLARADO)
  //   tipo 'skeleton'  -> estrutura fixa do modelo §46.11 (METODO...:927-968) ou titulo de bloco
  //   tipo 'estrutura' -> linha em branco / separador de tabela / cabecalho de tabela
  // `valor` guarda o(s) valor(es) BRUTO(S) do YAML usados na linha: e o que permite a fechadura
  // provar a derivacao contra o texto do YAML (nao contra o gerador).
  const p = (texto, chave, tipo, valor) => {
    const v = valor === undefined || valor === null
      ? null
      : (Array.isArray(valor) ? valor.filter((x) => !vazio(x)).map(String) : [String(valor)]);
    L.push(texto);
    mapa.push({ linha: L.length, chave: chave || null, tipo: tipo || 'skeleton', valor: v && v.length ? v : null });
  };
  const emBranco = () => p('', null, 'estrutura');
  const linha = (texto) => p(texto, null, 'skeleton');

  // valor de um campo: deriva do YAML (tipo 'yaml') ou declara a ausencia (tipo 'ausente').
  const campo = (rotulo, valor, chave) => {
    const v = vazio(valor) ? NAO_DECLARADO : String(valor);
    p(`- ${rotulo}: ${v}`, chave, vazio(valor) ? 'ausente' : 'yaml', valor);
  };
  // lista: um item por linha (- Arquivos: / dois espacos / "- item"), cada item verbatim.
  const lista = (rotulo, itens, chave) => {
    if (!Array.isArray(itens) || itens.length === 0) {
      p(`- ${rotulo}: ${NAO_DECLARADO}`, chave, 'ausente');
      return;
    }
    p(`- ${rotulo}:`, chave, 'skeleton');
    itens.forEach((it) => p(`  - ${String(it)}`, chave, 'yaml', it));
  };
  const tabela = (titulos) => {
    p(`| ${titulos.join(' | ')} |`, null, 'estrutura');
    p(`|${titulos.map(() => '---').join('|')}|`, null, 'estrutura');
  };
  const escapar = (v) => String(v).replace(/\|/g, '\\|');
  const linhaTabela = (rotulo, valor, chave) => {
    const v = vazio(valor) ? NAO_DECLARADO : escapar(valor);
    p(`| ${escapar(rotulo)} | ${v} |`, chave, vazio(valor) ? 'ausente' : 'yaml', valor);
  };

  // --- cabecalho do espelho -------------------------------------------------
  linha('# HANDOFF');
  emBranco();
  // Nota do §46.11 (METODO...:926) VERBATIM - e o contrato do espelho.
  linha('> Gerado automaticamente a partir do objeto downplant_handoff (§46.12). Não editar diretamente — editar o YAML de origem e regerar.');
  linha('> Fonte canônica: `08_Execucao_Ao_Vivo/downplant_handoff.yaml` · gerador: `scripts/downplant/gerar-handoff-md.mjs`.');
  emBranco();

  // --- corpo §46.11 --------------------------------------------------------
  linha('## Localização Down Plant');           // §46.11 (METODO...:928)
  campo('Terreno', pegar(doc, 'downplant.terreno'), 'downplant.terreno');
  campo('Cômodo', pegar(doc, 'contexto_de_task.comodo'), 'contexto_de_task.comodo');
  campo('Módulo', pegar(doc, 'contexto_de_task.modulo_ativo'), 'contexto_de_task.modulo_ativo');
  campo('Submódulo', pegar(doc, 'downplant.submodulo'), 'downplant.submodulo');
  campo('Escala', pegar(doc, 'downplant.escala'), 'downplant.escala');
  campo('Circuito', pegar(doc, 'downplant.circuito'), 'downplant.circuito');
  campo('Porta', pegar(doc, 'downplant.porta'), 'downplant.porta');
  emBranco();

  linha('## Task');                              // §46.11 (METODO...:937)
  campo('ID', pegar(doc, 'task.id'), 'task.id');
  campo('Objetivo', pegar(doc, 'contexto_de_task.fatia_ativa'), 'contexto_de_task.fatia_ativa');
  campo('Ação', pegar(doc, 'task.acao'), 'task.acao');
  campo('Alvo', pegar(doc, 'task.alvo'), 'task.alvo');
  campo('Resultado esperado', pegar(doc, 'estado.portao_destino'), 'estado.portao_destino');
  emBranco();

  linha('## Escopo autorizado');                 // §46.11 (METODO...:943)
  lista('Arquivos', pegar(doc, 'contexto_de_task.arquivos_permitidos'), 'contexto_de_task.arquivos_permitidos');
  campo('Funções', pegar(doc, 'task.alvo'), 'task.alvo');
  campo('Artefatos', pegar(doc, 'escopo.artefatos'), 'escopo.artefatos');
  campo('Ambiente', pegar(doc, 'contexto_de_task.ambiente'), 'contexto_de_task.ambiente');
  campo('Pode expandir', pegar(doc, 'escopo.pode_expandir'), 'escopo.pode_expandir');
  emBranco();

  linha('## Conexões afetadas');                 // §46.11 (METODO...:949)
  campo('Origem', pegar(doc, 'conexoes.origem'), 'conexoes.origem');
  campo('Destino', pegar(doc, 'conexoes.destino'), 'conexoes.destino');
  campo('Contrato', pegar(doc, 'conexoes.contrato'), 'conexoes.contrato');
  emBranco();

  linha('## Portões');                           // §46.11 (METODO...:954)
  campo('Atual', pegar(doc, 'contexto_de_task.portao_atual'), 'contexto_de_task.portao_atual');
  campo('Destino', pegar(doc, 'estado.portao_destino'), 'estado.portao_destino');
  emBranco();

  linha('## Proibições');                        // §46.11 (METODO...:958)
  campo('Expandir escopo', pegar(doc, 'escopo.pode_expandir'), 'escopo.pode_expandir');
  campo('Efeitos externos', pegar(doc, 'proibicoes.efeitos_externos'), 'proibicoes.efeitos_externos');
  campo('Publicação', pegar(doc, 'proibicoes.publicacao'), 'proibicoes.publicacao');
  lista('Outros', pegar(doc, 'contexto_de_task.proibicoes'), 'contexto_de_task.proibicoes');
  emBranco();

  linha('## Regra para intercorrências');        // §46.11 (METODO...:964-965)
  linha('Detectar → localizar → registrar → devolver ao Planner.');
  emBranco();

  linha('## Regra de parada');                   // §46.11 (METODO...:967-968)
  linha('Ao concluir o escopo, registrar resultado e parar.');
  campo('Declarada neste objeto', pegar(doc, 'contexto_de_task.regra_de_parada'), 'contexto_de_task.regra_de_parada');
  emBranco();

  // --- blocos declarados pelo objeto (§46.12: o espelho nao introduz fato) --
  linha('## Cabeçalho do objeto');
  emBranco();
  tabela(['Campo', 'Valor']);
  ['downplant_schema', 'downplant_version', 'handoff_version', 'gerado_em', 'autor', 'card_origem', 'card_pai', 'estado_do_handoff']
    .forEach((k) => linhaTabela(k, pegar(doc, k), k));
  emBranco();
  linha('**Propósito**');
  emBranco();
  p(String(pegar(doc, 'proposito') === undefined ? NAO_DECLARADO : pegar(doc, 'proposito')), 'proposito',
    pegar(doc, 'proposito') === undefined ? 'ausente' : 'yaml', pegar(doc, 'proposito'));
  emBranco();

  linha('## Identidade');
  emBranco();
  tabela(['Campo', 'Valor']);
  Object.keys(doc.identidade || {}).forEach((k) => linhaTabela(k, pegar(doc, `identidade.${k}`), `identidade.${k}`));
  emBranco();

  linha('## Contexto de task');
  emBranco();
  tabela(['Campo', 'Valor']);
  Object.keys(doc.contexto_de_task || {})
    .filter((k) => !Array.isArray(pegar(doc, `contexto_de_task.${k}`)) && typeof pegar(doc, `contexto_de_task.${k}`) !== 'object')
    .forEach((k) => linhaTabela(k, pegar(doc, `contexto_de_task.${k}`), `contexto_de_task.${k}`));
  emBranco();
  lista('Proibições', pegar(doc, 'contexto_de_task.proibicoes'), 'contexto_de_task.proibicoes');
  emBranco();
  linha('**Ids remotos**');
  emBranco();
  tabela(['Identificador', 'Valor']);
  Object.keys((doc.contexto_de_task || {}).ids_remotos || {})
    .forEach((k) => linhaTabela(k, pegar(doc, `contexto_de_task.ids_remotos.${k}`), `contexto_de_task.ids_remotos.${k}`));
  emBranco();

  linha('## Quatro pontas');
  emBranco();
  tabela(['Ponta', 'Estado', 'Justificativa']);
  ['CODE_STATE', 'DOC_STATE', 'CANVAS_STATE', 'GIT_STATE'].forEach((k) => {
    const estado = pegar(doc, `quatro_pontas.${k}`);
    const just = pegar(doc, `quatro_pontas.justificativas.${k}`);
    const vazioLado = vazio(estado);
    p(`| ${k} | ${vazioLado ? NAO_DECLARADO : escapar(estado)} | ${vazio(just) ? NAO_DECLARADO : escapar(just)} |`,
      `quatro_pontas.${k}`, vazioLado ? 'ausente' : 'yaml', [estado, just]);
  });
  emBranco();

  linha('## Proveniência');
  emBranco();
  tabela(['Campo', 'Valor']);
  Object.keys(doc.proveniencia || {}).forEach((k) => linhaTabela(k, pegar(doc, `proveniencia.${k}`), `proveniencia.${k}`));
  emBranco();

  linha('## Referências canônicas (o handoff aponta, não copia)');
  emBranco();
  Object.keys(doc.referencias || {}).forEach((k) => {
    const v = pegar(doc, `referencias.${k}`);
    if (vazio(v)) { p(`- ${k}: ${NAO_DECLARADO}`, `referencias.${k}`, 'ausente'); return; }
    // link derivado mecanicamente: rotulo = nome do arquivo, destino = caminho declarado
    // resolvido RELATIVO ao diretorio do espelho (o lint valida link nessa base).
    const destino = path.relative(dirMd, path.resolve(BASE, String(v))).split(path.sep).join('/');
    p(`- ${k}: [${path.basename(destino)}](${destino}) · \`${String(v)}\``, `referencias.${k}`, 'yaml', v);
  });
  emBranco();

  // --- notas do objeto (declaradas no YAML: prosa do espelho sem origem no YAML e divergencia §4.5)
  const notas = pegar(doc, 'notas');
  linha('## Notas do objeto (§46.11)');
  emBranco();
  if (!notas || typeof notas !== 'object' || Array.isArray(notas) || Object.keys(notas).length === 0) {
    p(`- ${NAO_DECLARADO}`, 'notas', 'ausente');
  } else {
    Object.keys(notas).forEach((k) => {
      p(`**${k}**`, `notas.${k}`, 'skeleton');
      emBranco();
      p(String(notas[k]), `notas.${k}`, 'yaml', notas[k]);
      emBranco();
    });
  }

  return { markdown: L.join('\n').replace(/\n+$/, '') + '\n', mapa, linhas: L.length };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
function uso() {
  return [
    'GERADOR CANONICO DO ESPELHO MARKDOWN DO HANDOFF (§46.11) - o YAML vence (§4.5).',
    '',
    'uso: node scripts/downplant/gerar-handoff-md.mjs [--yaml <arquivo>] [--md <arquivo>]',
    '     [--out <arquivo> | --aplicar] [--check] [--mapa]',
    '',
    `  --yaml <arquivo>  YAML canonico (padrao: ${YAML_PADRAO})`,
    `  --md <arquivo>    espelho Markdown (padrao: ${MD_PADRAO})`,
    '  --out <arquivo>   grava o Markdown gerado no arquivo indicado',
    '  --aplicar         grava no espelho padrao (§46.11: regerar a partir do YAML)',
    '  --check           compara o espelho em disco com o derivado do YAML; exit 1 se divergir',
    '  --mapa            imprime a tabela de derivacao (linha do .md -> chave do YAML)'
  ].join('\n');
}

function principal() {
  const argv = process.argv.slice(2);
  const args = { yaml: null, md: null, out: null, aplicar: false, check: false, mapa: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') { process.stdout.write(uso() + '\n'); process.exit(0); }
    if (a === '--yaml') { args.yaml = argv[++i]; continue; }
    if (a === '--md') { args.md = argv[++i]; continue; }
    if (a === '--out') { args.out = argv[++i]; continue; }
    if (a === '--aplicar') { args.aplicar = true; continue; }
    if (a === '--check') { args.check = true; continue; }
    if (a === '--mapa') { args.mapa = true; continue; }
    process.stderr.write(`gerar-handoff-md: argumento nao reconhecido "${a}".\n\n${uso()}\n`);
    process.exit(2);
  }

  const arqYaml = path.resolve(BASE, args.yaml || YAML_PADRAO);
  const arqMd = path.resolve(BASE, args.md || MD_PADRAO);
  if (!fs.existsSync(arqYaml)) { process.stderr.write(`gerar-handoff-md: YAML inexistente: ${arqYaml}\n`); process.exit(2); }

  let doc;
  try {
    doc = parseYaml(fs.readFileSync(arqYaml, 'utf8'));
  } catch (e) {
    process.stderr.write(`gerar-handoff-md: YAML invalido -> ${e.message}\n`);
    process.exit(2);
  }

  const { markdown, mapa, linhas } = gerarMarkdown(doc, { arquivoMd: arqMd });

  if (args.mapa) {
    process.stdout.write(`# derivacao (§46.11): ${linhas} linhas geradas a partir de ${path.relative(BASE, arqYaml).split(path.sep).join('/')}\n`);
    process.stdout.write('linha\tchave-do-yaml\ttipo\tvalor-bruto-do-yaml\n');
    mapa.forEach((m) => process.stdout.write(`${m.linha}\t${m.chave || '-'}\t${m.tipo}\t${m.valor ? m.valor.join(' ⇢ ') : '-'}\n`));
    return;
  }

  if (args.check) {
    if (!fs.existsSync(arqMd)) {
      process.stderr.write(`CHECK: DIVERGENTE - espelho ausente: ${path.relative(BASE, arqMd)}\n`);
      process.exit(1);
    }
    const emDisco = fs.readFileSync(arqMd, 'utf8');
    if (emDisco === markdown) {
      process.stdout.write(`CHECK: IDENTICO - o espelho ${path.relative(BASE, arqMd).split(path.sep).join('/')} deriva do YAML (sha256=${sha256(markdown).slice(0, 16)}...)\n`);
      return;
    }
    const eol = normalizarEol(emDisco) === markdown ? ' (divergencia APENAS de terminador de linha: CRLF no espelho x LF no derivado)' : '';
    process.stderr.write(
      `CHECK: DIVERGENTE - o espelho ${path.relative(BASE, arqMd).split(path.sep).join('/')} NAO deriva do YAML${eol}\n` +
      `  espelho em disco: ${contarLinhas(emDisco)} linhas, sha256=${sha256(emDisco).slice(0, 16)}...\n` +
      `  derivado do YAML: ${contarLinhas(markdown)} linhas, sha256=${sha256(markdown).slice(0, 16)}...\n` +
      '  §46.11/§4.5: editar o YAML de origem e regerar; o YAML vence.\n'
    );
    process.exit(1);
  }

  if (args.aplicar || args.out) {
    const destino = args.out ? path.resolve(args.out) : arqMd;
    fs.writeFileSync(destino, markdown, 'utf8');
    process.stdout.write(
      `gerar-handoff-md: espelho regerado em ${destino} (${contarLinhas(markdown)} linhas, ` +
      `sha256=${sha256(markdown)})\n`
    );
    return;
  }

  process.stdout.write(markdown);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isMain) {
  try { principal(); } catch (e) { process.stderr.write(`gerar-handoff-md: erro - ${e.message}\n`); process.exit(2); }
}
