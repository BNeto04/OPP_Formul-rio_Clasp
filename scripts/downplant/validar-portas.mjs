#!/usr/bin/env node
/**
 * validar-portas.mjs — #164 (DP24-003)
 *
 * Torna VERIFICAVEL o checklist de producao da Porta (metodo 2.4, §12.6):
 *
 *   "Toda Porta que cruza Comodo, expoe efeito externo ou lida com concorrencia deve
 *    declarar, como parte do seu ensure/invariant, o checklist de producao"
 *
 * O que este validador exige (e que nenhum outro validador do repositorio exige):
 *   (a) o INVENTARIO canonico declara, para cada Porta, os tres criterios do §12.6
 *       (cruza Comodo / efeito externo / concorrencia) e o veredito de elegibilidade
 *       com MOTIVO escrito — nenhuma Porta elegivel fica sem checklist e nenhuma Porta
 *       nao elegivel ganha checklist ornamental;
 *   (b) toda Porta ELEGIVEL tem arquivo §46.3 existente, com identidade completa
 *       (Endereco global / Escala / Origem / Destino) e a secao
 *       `## Checklist de producao (§12.6)`;
 *   (c) os NOVE itens do §12.6 estao presentes, um a um, com estado em
 *       {aplicavel | nao_aplicavel | pendente} e resposta NAO vazia;
 *   (d) CLASSIFICACAO DE FECHAMENTO em QUATRO estados (decisao do Planner, 14/09/2026 — §0 do
 *       adendo de fechamento do #164). O instrumento nao pode contar `pendente` justificado como
 *       PASS de fechamento:
 *         - `PASS` .............. item com estado `aplicavel` ou `nao_aplicavel` e resposta medida;
 *         - `PENDENTE_DECLARADA` . item `pendente` com **justificativa escrita** E **aceite formal
 *                                  com marco** — o marcador `MARCO:` seguido de valor nao vazio na
 *                                  propria resposta (ex.: `MARCO: #171 / decisao do Proprietario
 *                                  14/09/2026`). Divida aceita COM rastro: nao bloqueia G7;
 *         - `PENDENTE_BLOQUEANTE` item `pendente` SEM justificativa (=> FAIL, ver abaixo) ou COM
 *                                  justificativa e SEM `MARCO:` — declaracao sem aceite formal:
 *                                  **bloqueia G7** e o exit NAO pode ser 0 (ver codigos de saida);
 *         - `FAIL` .............. estado invalido, resposta vazia/curta, item ausente, secao
 *                                  ausente, identidade §46.3 incompleta, referencia quebrada.
 *       O criterio e explicito e verificavel por teste
 *       (`Testes/TestValidarChecklistProducaoPortas.js` exercita os quatro estados).
 *   (e) referencias a Instalacao transversal (§8.11) existem de fato no cofre;
 *   (f) nenhum arquivo de Porta existe fora do inventario (Porta ornamental = falha).
 *
 * Nao ha segundo validador de Porta no repositorio: as funcoes abaixo sao EXPORTADAS
 * para que o portao de teste chame o mesmo codigo.
 *
 * Uso:
 *   node scripts/downplant/validar-portas.mjs [baseDir]
 *   node scripts/downplant/validar-portas.mjs [baseDir] --registry <arquivo-relativo-ao-baseDir>
 *
 * Codigos de saida:
 *   0 = PASS de fechamento (inventario coerente, checklist completo nas Portas elegiveis,
 *       nenhum item PENDENTE_BLOQUEANTE e nenhuma verificacao falha)
 *   1 = FAIL de validacao (Porta elegivel sem checklist, item ausente/invalido, resposta vazia,
 *       pendente sem justificativa, referencia quebrada, Porta ornamental)
 *   2 = erro de leitura (inventario ausente ou bloco do inventario ilegivel)
 *   3 = PENDENTE_BLOQUEANTE: checklist formalmente incompleto — `pendente` sem aceite formal
 *       (`MARCO:`). Nao e erro de leitura nem defeito do checklist: e divida NAO aceita, e o
 *       metodo diz que ela bloqueia a Porta em G7. **Nunca exit 0.**
 */

import fs from 'fs';
import path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------------------------
// Vocabulario do metodo (verbatim, §12.6 e §46.3)
// ---------------------------------------------------------------------------
export const ITENS_12_6 = [
  'idempotente',
  'deduplicacao',
  'rate_limit',
  'paginacao',
  'validacao_entrada',
  'operacao_atomica',
  'race_condition',
  'cache',
  'retry_pelo_cliente'
];

export const ESTADOS = ['aplicavel', 'nao_aplicavel', 'pendente'];
/** Estados de FECHAMENTO do item (medidos, nao declarados pelo autor da Porta). */
export const ESTADOS_FECHAMENTO = ['PASS', 'PENDENTE_DECLARADA', 'PENDENTE_BLOQUEANTE', 'FAIL'];
/** Marcador de ACEITE FORMAL de divida: `MARCO:` + valor nao vazio. Sem ele, `pendente` bloqueia G7. */
export const MARCO_FECHAMENTO = /MARCO:\s*[^\s|]/i;
export const ESCALAS = ['submodulo', 'modulo', 'comodo'];
export const SECAO_CHECKLIST = '## Checklist de produção (§12.6)';
export const REGISTRY_MARK_INI = '<!-- PORTA-REGISTRY-V1 -->';
export const REGISTRY_MARK_FIM = '<!-- /PORTA-REGISTRY-V1 -->';
export const REGISTRY_DEFAULT = path.join(
  '02_Comodos', 'C00_Governanca_Estrutural', '03_Especificacoes',
  'INVENTARIO_PORTAS_E_CHECKLIST_12_6.md'
);
// Colunas do inventario (ordem fixa).
export const COLUNAS_REGISTRY = [
  'porta', 'modulo', 'direcao', 'cruza', 'efeito', 'conc', 'elegivel', 'motivo', 'arquivo_porta'
];

const ID_PORTA = /^C[0-9]{2}\/MOD-C[0-9]{2}-[0-9]{2}\/P[0-9]{2}$/;
const ID_PORTA_NO_ARQUIVO = /[Cc][0-9]{2}\/MOD-C[0-9]{2}-[0-9]{2}\/P[0-9]{2}/;

// ---------------------------------------------------------------------------
// Helpers de parsing
// ---------------------------------------------------------------------------
const naoVazio = v => v !== undefined && v !== null && String(v).trim() !== '';

/** Quebra uma linha de tabela markdown em celulas (split simples). */
export function celulas(linha) {
  const t = String(linha).trim();
  if (!t.startsWith('|')) return null;
  return t.replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
}

/** Celula da resposta do checklist: pode conter `|` no texto, entao o resto da linha e rejuntado. */
export function celulaResposta(c) {
  return c.length <= 3 ? (c[2] || '').trim() : c.slice(2).join(' | ').trim();
}

const ehSeparador = c => c.every(x => /^:?-{2,}:?$/.test(x.replace(/\s/g, '')));

// ---------------------------------------------------------------------------
// 1) Inventario
// ---------------------------------------------------------------------------
export function parseInventario(texto) {
  const linhas = texto.replace(/\r\n/g, '\n').split('\n');
  const i = linhas.findIndex(l => l.includes(REGISTRY_MARK_INI));
  const f = linhas.findIndex(l => l.includes(REGISTRY_MARK_FIM));
  if (i === -1 || f === -1 || f <= i) {
    throw new Error(`bloco do inventario ausente (esperado ${REGISTRY_MARK_INI} ... ${REGISTRY_MARK_FIM})`);
  }
  const corpo = linhas.slice(i + 1, f).map(l => l.trim()).filter(l => l !== '');
  const registros = [];
  const erros = [];
  let cabecalho = null;
  corpo.forEach((l, idx) => {
    const c = celulas(l);
    if (!c) { erros.push(`linha ignorada no bloco do inventario (nao e tabela): ${l.slice(0, 60)}`); return; }
    if (ehSeparador(c)) return;
    if (cabecalho === null && c[0].toLowerCase() !== 'porta') { erros.push(`cabecalho do inventario inesperado: ${c.join(' | ')}`); }
    if (cabecalho === null && c[0].toLowerCase() === 'porta') {
      cabecalho = c;
      if (c.length !== COLUNAS_REGISTRY.length) erros.push(`cabecalho do inventario com ${c.length} colunas (esperado ${COLUNAS_REGISTRY.length})`);
      return;
    }
    if (c.length !== COLUNAS_REGISTRY.length) {
      erros.push(`linha ${idx + 1} do inventario com ${c.length} colunas (esperado ${COLUNAS_REGISTRY.length}): ${c[0]}`);
      return;
    }
    const r = {};
    COLUNAS_REGISTRY.forEach((k, n) => { r[k] = c[n]; });
    r._linha = i + 2 + idx;
    registros.push(r);
  });
  return { registros, erros, cabecalho };
}

export function validarLinhaInventario(r) {
  const passes = []; const falhas = [];
  const ok = m => passes.push(m); const fail = m => falhas.push(m);
  const onde = `inventario linha ${r._linha} (${r.porta || 'sem id'})`;

  if (!ID_PORTA.test(String(r.porta || '').trim())) fail(`${onde}: 'porta' fora do padrao Cxx/MOD-Cxx-nn/Pnn (lido: ${r.porta})`);
  else ok(`${onde}: id de Porta no padrao canonico`);

  ['cruza', 'efeito', 'conc'].forEach(k => {
    const v = String(r[k] || '').trim().toUpperCase();
    if (v !== 'SIM' && v !== 'NAO') fail(`${onde}: coluna '${k}' deve ser SIM ou NAO (lido: ${r[k]})`);
  });

  if (!naoVazio(r.motivo)) fail(`${onde}: motivo de elegibilidade AUSENTE (toda Porta precisa de motivo escrito)`);
  else ok(`${onde}: motivo de elegibilidade declarado`);

  const elegivel = String(r.elegivel || '').trim().toUpperCase();
  if (elegivel !== 'SIM' && elegivel !== 'NAO') {
    fail(`${onde}: coluna 'elegivel' deve ser SIM ou NAO (lido: ${r.elegivel})`);
  } else if (elegivel === 'SIM') {
    const algum = ['cruza', 'efeito', 'conc'].some(k => String(r[k] || '').trim().toUpperCase() === 'SIM');
    if (!algum) fail(`${onde}: elegivel=SIM mas nenhum criterio do §12.6 esta marcado SIM (cruza/efeito/concorrencia)`);
    else ok(`${onde}: elegivel=SIM coerente com pelo menos um criterio do §12.6`);
    if (!naoVazio(r.arquivo_porta) || r.arquivo_porta === '-') {
      fail(`${onde}: Porta ELEGIVEL sem 'arquivo_porta' (§12.6 obriga checklist — nao pode ser '-')`);
    } else ok(`${onde}: Porta elegivel aponta para o arquivo §46.3`);
  } else {
    if (naoVazio(r.arquivo_porta) && r.arquivo_porta !== '-') {
      fail(`${onde}: elegivel=NAO mas declara 'arquivo_porta' (checklist ornamental nao e permitido, §40.6)`);
    } else ok(`${onde}: Porta nao elegivel sem arquivo de checklist`);
  }
  return { passes, falhas };
}

// ---------------------------------------------------------------------------
// 2) Arquivo de Porta (§46.3 + §12.6)
// ---------------------------------------------------------------------------
export function lerItensChecklist(texto) {
  const linhas = texto.replace(/\r\n/g, '\n').split('\n');
  const i = linhas.findIndex(l => l.trim() === SECAO_CHECKLIST);
  if (i === -1) return { secao: false, itens: {}, faltando: [...ITENS_12_6], invalidos: [`secao '${SECAO_CHECKLIST}' ausente`] };

  const itens = {}; const invalidos = [];
  for (let n = i + 1; n < linhas.length; n++) {
    const l = linhas[n].trim();
    if (/^##\s/.test(l)) break;                    // fim da secao
    const c = celulas(l);
    if (!c) continue;                              // prosa/linha vazia
    if (ehSeparador(c)) continue;                  // |---|---|---|
    const item = c[0].replace(/[`*]/g, '').trim().toLowerCase();
    if (item === 'item') continue;                 // cabecalho da tabela
    if (!ITENS_12_6.includes(item)) { invalidos.push(`item desconhecido na tabela do §12.6: '${c[0]}'`); continue; }
    if (itens[item]) { invalidos.push(`item duplicado na tabela do §12.6: '${item}'`); continue; }
    itens[item] = { estado: String(c[1] || '').trim().toLowerCase(), resposta: celulaResposta(c), linha: n + 1 };
  }
  const faltando = ITENS_12_6.filter(k => !itens[k]);
  return { secao: true, itens, faltando, invalidos, linhaSecao: i + 1 };
}

export function validarPortaArquivo(relCaminho, conteudo, baseDir) {
  const passes = []; const falhas = [];
  const pendentesDeclaradas = []; const pendentesBloqueantes = [];
  const ok = m => passes.push(m); const fail = m => falhas.push(m);
  const nome = relCaminho;

  const texto = String(conteudo).replace(/\r\n/g, '\n');

  // (b1) identidade §46.3
  const mTitulo = texto.match(/^#\s*PORTA\s+(\S+)/m);
  if (!mTitulo || !ID_PORTA_NO_ARQUIVO.test(mTitulo[1])) fail(`${nome}: cabecalho 'PORTA <endereco>' ausente ou fora do padrao (§46.3)`);
  else ok(`${nome}: identidade da Porta declarada (${mTitulo[1]})`);

  const campos = {
    'Endereco global': /^-\s*\*\*Endereço global:\*\*\s*`?([^`\n]*)/m,
    'Escala': /^-\s*\*\*Escala:\*\*\s*([^\n]*)/m,
    'Origem': /^-\s*\*\*Origem:\*\*\s*([^\n]*)/m,
    'Destino': /^-\s*\*\*Destino:\*\*\s*([^\n]*)/m,
    'Elegibilidade': /^-\s*\*\*Elegibilidade \(§12\.6\):\*\*\s*([^\n]*)/m
  };
  Object.keys(campos).forEach(k => {
    const m = texto.match(campos[k]);
    if (!m || !naoVazio(m[1])) fail(`${nome}: campo §46.3 '${k}' ausente/vazio`);
  });
  const mEsc = texto.match(campos['Escala']);
  if (mEsc && naoVazio(mEsc[1]) && !ESCALAS.includes(String(mEsc[1]).trim().toLowerCase().replace(/[`*]/g, ''))) {
    fail(`${nome}: Escala '${mEsc[1].trim()}' fora de {${ESCALAS.join(', ')}} (§46.3)`);
  } else if (mEsc && naoVazio(mEsc[1])) {
    ok(`${nome}: campos §46.3 (Endereco global, Escala, Origem, Destino, Elegibilidade) presentes`);
  }

  if (!/^##\s*Estado\s*$/m.test(texto)) fail(`${nome}: secao '## Estado' ausente (§46.3)`);

  // (c) os 9 itens
  const { secao, itens, faltando, invalidos, linhaSecao } = lerItensChecklist(texto);
  if (!secao) {
    fail(`${nome}: secao '${SECAO_CHECKLIST}' ausente — a Porta nao declara o checklist de producao`);
    return { passes, falhas, pendentesDeclaradas, pendentesBloqueantes, itensPass: 0 };
  }
  ok(`${nome}: secao do checklist presente (linha ${linhaSecao})`);
  invalidos.forEach(x => fail(`${nome}: ${x}`));
  if (faltando.length) fail(`${nome}: itens do §12.6 AUSENTES: ${faltando.join(', ')}`);
  else ok(`${nome}: os 9 itens do §12.6 estao presentes`);

  // (d) CLASSIFICACAO DE FECHAMENTO em QUATRO estados (Planner, 14/09/2026)
  let itensPass = 0;
  ITENS_12_6.forEach(k => {
    const it = itens[k];
    if (!it) return;
    if (!ESTADOS.includes(it.estado)) {
      fail(`${nome}: item '${k}' com estado invalido '${it.estado || '(vazio)'}' (linha ${it.linha}) — use ${ESTADOS.join(' | ')}`);
      return;
    }
    if (it.resposta.length < 20) {
      fail(`${nome}: item '${k}' sem resposta medida (linha ${it.linha}) — ${ESTADOS.join(' | ')} exige fato, nao celula vazia`);
      return;
    }
    if (it.estado === 'pendente') {
      if (!/justificativa/i.test(it.resposta)) {
        fail(`${nome}: item '${k}' marcado 'pendente' SEM justificativa (linha ${it.linha}) — o metodo exige justificativa escrita`);
        return;
      }
      if (!MARCO_FECHAMENTO.test(it.resposta)) {
        pendentesBloqueantes.push(`${nome}: item '${k}' PENDENTE_BLOQUEANTE (linha ${it.linha}) — declarado com justificativa e SEM aceite formal; para nao bloquear G7 a resposta precisa do marco: 'MARCO: <card|data|dono>'`);
        return;
      }
      pendentesDeclaradas.push(`${nome}: item '${k}' PENDENTE_DECLARADA (linha ${it.linha}) — justificativa escrita + aceite formal (MARCO)`);
      return;
    }
    itensPass++;
  });
  if (pendentesBloqueantes.length === 0) ok(`${nome}: nenhum item PENDENTE_BLOQUEANTE — a Porta nao bloqueia G7 (§12.6)`);
  if (pendentesDeclaradas.length) ok(`${nome}: ${pendentesDeclaradas.length} item(ns) PENDENTE_DECLARADA (divida com aceite formal)`);

  // (e) Instalacao transversal referenciada precisa existir (§8.11)
  const refs = [...new Set((texto.match(/INST-[A-Z0-9-]+/g) || []))];
  refs.forEach(inst => {
    let achou = false;
    const dirs = ['02_Comodos', '03_Fundacao', '06_Inventario'];
    const pilha = dirs.map(d => path.join(baseDir, d)).filter(d => fs.existsSync(d));
    while (pilha.length && !achou) {
      const d = pilha.pop();
      for (const nomeArq of fs.readdirSync(d)) {
        const p = path.join(d, nomeArq);
        const st = fs.statSync(p);
        if (st.isDirectory()) pilha.push(p);
        else if (nomeArq.startsWith(inst)) { achou = true; break; }
      }
    }
    if (achou) ok(`${nome}: instalacao transversal referenciada existe (${inst})`);
    else fail(`${nome}: referencia a instalacao transversal INEXISTENTE (${inst}) — §8.11 exige a instalacao real, nao a promessa dela`);
  });

  return { passes, falhas, pendentesDeclaradas, pendentesBloqueantes, itensPass };
}

// ---------------------------------------------------------------------------
// 3) Conferencia completa (inventario x arquivos)
// ---------------------------------------------------------------------------
export function portasDeclaradas(baseDir) {
  const raiz = path.join(baseDir, '02_Comodos');
  const out = [];
  const pilha = [raiz];
  while (pilha.length) {
    const d = pilha.pop();
    if (!fs.existsSync(d)) continue;
    for (const nome of fs.readdirSync(d)) {
      const p = path.join(d, nome);
      const st = fs.statSync(p);
      if (st.isDirectory()) pilha.push(p);
      else if (/^PORTA-.*\.md$/.test(nome)) out.push(path.relative(baseDir, p).replace(/\\/g, '/'));
    }
  }
  return out.sort();
}

export function conferir(baseDir, opts = {}) {
  const passes = []; const falhas = [];
  const pendentesDeclaradas = []; const pendentesBloqueantes = [];
  const ok = m => passes.push(m); const fail = m => falhas.push(m);
  const registryRel = opts.registryRel || REGISTRY_DEFAULT;
  const registryAbs = path.resolve(baseDir, registryRel);

  if (!fs.existsSync(registryAbs)) {
    return { passes, falhas: [`inventario de Portas ausente: ${registryRel}`], resumo: null, fatal: true };
  }
  let inv;
  try {
    inv = parseInventario(fs.readFileSync(registryAbs, 'utf8'));
  } catch (e) {
    return { passes, falhas: [`inventario ilegivel: ${e.message}`], resumo: null, fatal: true };
  }
  inv.erros.forEach(fail);
  if (!inv.cabecalho) fail('inventario sem cabecalho de tabela no bloco do registro');

  const elegiveis = [];
  const naoElegiveis = [];
  const IDsVistos = new Map();
  inv.registros.forEach(r => {
    const v = validarLinhaInventario(r);
    v.passes.forEach(ok); v.falhas.forEach(fail);
    const id = String(r.porta || '').trim();
    if (IDsVistos.has(id)) fail(`id de Porta duplicado no inventario: ${id} (linhas ${IDsVistos.get(id)} e ${r._linha})`);
    else IDsVistos.set(id, r._linha);
    if (String(r.elegivel || '').toUpperCase() === 'SIM') elegiveis.push(r);
    else naoElegiveis.push(r);
  });

  // Portas elegiveis: arquivo existente + checklist completo
  let portasVerdes = 0;
  let itensPass = 0;
  elegiveis.forEach(r => {
    const rel = String(r.arquivo_porta).replace(/\\/g, '/');
    const abs = path.resolve(baseDir, rel);
    if (!fs.existsSync(abs)) {
      fail(`Porta elegivel ${r.porta}: arquivo declarado NAO EXISTE -> ${rel}`);
      return;
    }
    const conteudo = fs.readFileSync(abs, 'utf8');
    const res = validarPortaArquivo(rel, conteudo, baseDir);
    res.passes.forEach(ok); res.falhas.forEach(fail);
    (res.pendentesDeclaradas || []).forEach(x => pendentesDeclaradas.push(`${r.porta}: ${x}`));
    (res.pendentesBloqueantes || []).forEach(x => pendentesBloqueantes.push(`${r.porta}: ${x}`));
    itensPass += res.itensPass || 0;
    if ((res.falhas || []).length === 0 && (res.pendentesBloqueantes || []).length === 0) {
      portasVerdes++;
    } else {
      ok(`Porta ${r.porta}: NAO VERDE (${(res.pendentesBloqueantes || []).length} bloqueante(s), ${(res.falhas || []).length} falha(s))`);
    }
    const idArquivo = (conteudo.match(/^#\s*PORTA\s+(\S+)/m) || [])[1];
    if (idArquivo && idArquivo.trim() !== r.porta.trim()) {
      fail(`Porta ${r.porta}: o arquivo ${rel} declara outro endereco (${idArquivo}) — inventario e arquivo divergem`);
    }
    const noDiretorioPortas = /\/portas\/PORTA-[^/]+\.md$/.test(rel);
    if (!noDiretorioPortas) fail(`Porta ${r.porta}: arquivo ${rel} nao esta na pasta 'portas/' do Modulo (§40.5)`);
  });

  // Porta ornamental: arquivo de Porta que nao esta no inventario
  const declarados = new Set(elegiveis.map(r => String(r.arquivo_porta).replace(/\\/g, '/')));
  const arquivos = portasDeclaradas(baseDir);
  arquivos.forEach(a => {
    if (!declarados.has(a)) fail(`Porta ORNAMENTAL: ${a} existe no cofre e NAO esta declarada no inventario (§12.6/§40.6)`);
  });
  if (arquivos.length) ok(`${arquivos.length} arquivo(s) de Porta no cofre, todos declarados no inventario`);

  const resumo = {
    baseDir,
    registros: inv.registros.length,
    elegiveis: elegiveis.length,
    naoElegiveis: naoElegiveis.length,
    arquivosDePorta: arquivos.length,
    portasVerdes,
    itensPass,
    itensPendentesDeclaradas: pendentesDeclaradas.length,
    itensPendentesBloqueantes: pendentesBloqueantes.length,
    passes: passes.length,
    falhas: falhas.length
  };
  return { passes, falhas, pendentesDeclaradas, pendentesBloqueantes, resumo };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
export function lerArgumentos(argv) {
  let baseDirArg = null; let registryRel = null;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--registry' || a === '--inventario') { registryRel = argv[++i]; continue; }
    if (a.startsWith('--')) continue;
    if (baseDirArg === null) baseDirArg = a;
  }
  return { baseDirArg, registryRel };
}

const isMain = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;

if (isMain) {
  const { baseDirArg, registryRel } = lerArgumentos(process.argv.slice(2));
  const baseDir = baseDirArg ? path.resolve(baseDirArg) : path.resolve(__dirname, '../../');
  const reg = registryRel || REGISTRY_DEFAULT;

  console.log('\n[validar-portas] §12.6 — checklist de producao da Porta (#164 DP24-003)');
  console.log(`[validar-portas] baseDir  = ${baseDir}`);
  console.log(`[validar-portas] inventario = ${reg}\n`);

  let r;
  try {
    r = conferir(baseDir, { registryRel: reg });
  } catch (e) {
    console.error(`ERRO: ${e.message}`);
    process.exit(2);
  }
  if (r.fatal) { console.error(`ERRO: ${r.falhas.join('; ')}`); process.exit(2); }

  r.passes.forEach(m => console.log(`  PASS  ${m}`));
  r.falhas.forEach(m => console.error(`  FAIL  ${m}`));
  (r.pendentesDeclaradas || []).forEach(m => console.log(`  DECL  ${m}`));
  (r.pendentesBloqueantes || []).forEach(m => console.error(`  BLOQ  ${m}`));

  const s = r.resumo;
  const verdes = `${s.portasVerdes}/${s.elegiveis}`;
  console.log('\n   --------------------------------------------------------------');
  console.log(`   Portas no inventario ......... ${s.registros}`);
  console.log(`   Portas ELEGIVEIS (§12.6) ..... ${s.elegiveis}`);
  console.log(`   Portas nao elegiveis ......... ${s.naoElegiveis}`);
  console.log(`   Arquivos de Porta no cofre ... ${s.arquivosDePorta}`);
  console.log(`   Portas elegiveis VERDES ...... ${verdes} (sem blq/falha)`);
  console.log(`   Itens PASS ................... ${s.itensPass}`);
  console.log(`   Itens PENDENTE_DECLARADA ..... ${s.itensPendentesDeclaradas} (aceite formal com MARCO)`);
  console.log(`   Itens PENDENTE_BLOQUEANTE .... ${s.itensPendentesBloqueantes}`);
  console.log(`   Itens FAIL ................... ${s.falhas}`);
  console.log(`   Verificacoes ................. ${s.passes} PASS / ${s.falhas} FAIL`);
  console.log('   --------------------------------------------------------------\n');

  if (s.falhas > 0) {
    console.error(`FALHA! ${s.falhas} verificacao(oes) do §12.6 falharam. O checklist NAO esta completo.\n`);
    process.exit(1);
  }
  if (s.itensPendentesBloqueantes > 0) {
    console.error(`BLOQUEADO! ${s.itensPendentesBloqueantes} item(ns) PENDENTE_BLOQUEANTE (pendente sem aceite formal 'MARCO:').`);
    console.error('O metodo diz que `pendente` bloqueia a Porta em G7: o placar NAO e verde e o exit NAO e 0.\n');
    process.exit(3);
  }
  console.log(`SUCESSO! ${verdes} Portas elegiveis verdes, 0 PENDENTE_BLOQUEANTE, 0 FAIL (§12.6).\n`);
  process.exit(0);
}
