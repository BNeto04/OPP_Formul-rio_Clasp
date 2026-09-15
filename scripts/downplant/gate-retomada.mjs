#!/usr/bin/env node
/**
 * ARQUIVO: scripts/downplant/gate-retomada.mjs
 * CARD:    #170 [DP24-007] - Métricas §38 + gate formal de retomada (§21.2)
 *
 * RESPONSABILIDADE: MEDIR. Este instrumento calcula o critério de retomada de fatia de produto (§21.2)
 * e as métricas de catch-up estrutural (§38) e imprime um PLACAR OBJETIVO. Ele NÃO corrige nada, NÃO
 * altera a árvore e NÃO infere estado a partir de nome de arquivo.
 *
 * REGRAS DETERMINADAS PELO PLANNER (15/09/2026):
 *   - C1 = mensurável por critérios explícitos;
 *   - C2 = `NAO_MENSURAVEL` se não existir fonte canônica legível por máquina do estado das Auditorias
 *     (proibido inferir de documento histórico ou do GitHub em silêncio);
 *   - C3 = `PENDENTE` até o Proprietário confirmar explicitamente a visão geral restabelecida
 *     (autorização para construir o gate NÃO é confirmação);
 *   - identidade canônica é ENDEREÇO/ID/RELAÇÃO DECLARADA. Nome normalizado só serve como DIAGNÓSTICO
 *     (`FALLBACK_POR_NOME`) e NUNCA transforma correspondência incerta em PASS;
 *   - qualquer rejeição real mantém `GATE_GLOBAL = VERMELHO`.
 *
 * USO:
 *   node scripts/downplant/gate-retomada.mjs            # placar legível
 *   node scripts/downplant/gate-retomada.mjs --json     # placar em JSON (para fechadura/pipeline)
 * EXIT CODE: 0 somente quando `GATE_GLOBAL = VERDE`.
 */

import fs from 'fs';
import path from 'path';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', '..');
const COMODOS_DIR = path.join(REPO, '02_Comodos');
const ESPELHOS_DIR = path.join(REPO, '07_Codigo_Leitura');

// ---------------------------------------------------------------------------
// leitura da Planta (declarado, nunca inventado)
// ---------------------------------------------------------------------------

function normalizarCaminho(p) {
  return String(p).replace(/\\/g, '/').replace(/^\.\//, '').trim().toLowerCase();
}

function listarModulos() {
  const mods = [];
  for (const comodo of fs.readdirSync(COMODOS_DIR).sort()) {
    if (!/^C\d{2}_/.test(comodo)) continue;
    const dirMods = path.join(COMODOS_DIR, comodo, '01_Dominio', 'modulos');
    if (!fs.existsSync(dirMods)) continue;
    for (const mod of fs.readdirSync(dirMods).sort()) {
      if (!/^MOD-C\d{2}-\d{2}_/.test(mod)) continue;
      mods.push({ comodo, modulo: mod, dir: path.join(dirMods, mod) });
    }
  }
  return mods;
}

/** Artefatos DECLARADOS na cápsula do Módulo (seção `## Artefatos`, tokens em crase). */
function artefatosDeclarados(capsulaPath) {
  const texto = fs.readFileSync(capsulaPath, 'utf8');
  // a flag `s` é necessária: a seção atravessa o fim de linha logo após o cabeçalho
  const m = texto.match(/^##\s+Artefatos\s*$(.*?)(?=^##\s|\Z)/ms);
  if (!m) return null;
  const tokens = [];
  const re = /`([^`]+)`/g;
  let t;
  while ((t = re.exec(m[1])) !== null) {
    const v = t[1].trim();
    if (v && v !== 'Artefatos') tokens.push(v);
  }
  return tokens;
}

/** Cabeçalho DECLARADO dos espelhos ricos (§46.15). */
function indexarEspelhos() {
  const out = [];
  const andar = (dir) => {
    for (const nome of fs.readdirSync(dir).sort()) {
      const p = path.join(dir, nome);
      if (fs.statSync(p).isDirectory()) { andar(p); continue; }
      if (!nome.endsWith('.md')) continue;
      const texto = fs.readFileSync(p, 'utf8');
      const end = (texto.match(/-\s+\*\*Endere[cç]o Down Plant:\*\*\s*`([^`]+)`/) || [])[1] || null;
      const org = (texto.match(/-\s+\*\*Arquivo de origem[^:]*:\*\*\s*\[`([^`]+)`\]/) || [])[1] || null;
      const com = (texto.match(/-\s+\*\*Commit de refer[eê]ncia:\*\*\s*`([^`]+)`/) || [])[1] || null;
      out.push({ espelho: path.relative(REPO, p).replace(/\\/g, '/'), endereco: end, origem: org, commit: com });
    }
  };
  if (fs.existsSync(ESPELHOS_DIR)) andar(ESPELHOS_DIR);
  return out;
}

/**
 * Classificação DECLARADA do artefato (regra explícita, não inferência silenciosa).
 * §21.1/§46.15 exigem espelho rico para CÓDIGO. Doc/teste/curinga não são exigidos por este critério.
 */
function classificar(artefato) {
  const s = String(artefato).replace(/\\/g, '/');
  if (s.includes('*')) return 'CURINGA';
  if (/^testes\//i.test(s)) return 'TESTE';
  if (/\.md$/i.test(s)) return 'DOC';
  if (/\.(js|html|json|gs)$/i.test(s)) return 'CODIGO';
  return 'NAO_CLASSIFICADO';
}

/** Normalização apenas para DIAGNÓSTICO (fallback marcado): sem acento, sem travessão, minúsculo. */
function chaveDiagnostica(p) {
  return String(p).replace(/\\/g, '/').split('/').pop().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2013\u2014]/g, '-').replace(/[^a-z0-9.]/gi, '').toLowerCase();
}

// ---------------------------------------------------------------------------
// C1 — todo Módulo ativo possui espelho rico vinculado ao código real, sem pendência
// ---------------------------------------------------------------------------

function medirCondicao1() {
  const espelhos = indexarEspelhos();
  const modulos = listarModulos();
  const comodos = {};
  const fallbacksPorNome = [];
  let codigoTotal = 0, cobertos = 0, pendentesDeCodigo = 0, modulosSemCapsula = 0;

  for (const { comodo, modulo, dir } of modulos) {
    if (!comodos[comodo]) comodos[comodo] = { comodo, status_legado: 'NAO_DECLARADO', modulos: [] };
    const capsula = path.join(dir, `${modulo}.md`);
    const reg = { modulo, capsula: fs.existsSync(capsula), codigo_total: 0, cobertos: [], pendentes: [], nao_exigem_espelho: [] };

    if (!reg.capsula) {
      modulosSemCapsula++;
      reg.pendentes.push({ artefato: null, classe: 'CAPSULA', motivo: 'cápsula do Módulo ausente (só NOTA_DE_RESPONSABILIDADE.md)' });
      comodos[comodo].modulos.push(reg);
      continue;
    }

    const arts = artefatosDeclarados(capsula) || [];
    for (const artefato of arts) {
      const classe = classificar(artefato);
      if (classe !== 'CODIGO') { reg.nao_exigem_espelho.push({ artefato, classe }); continue; }
      reg.codigo_total++; codigoTotal++;
      const alvo = normalizarCaminho(artefato);
      // identidade canônica: ENDEREÇO DECLARADO contém o Módulo E ORIGEM DECLARADA é o artefato
      const exato = espelhos.find((e) => e.endereco && e.origem
        && normalizarCaminho(e.endereco).includes(modulo.toLowerCase())
        && normalizarCaminho(e.origem) === alvo);
      if (exato) { reg.cobertos.push({ artefato, espelho: exato.espelho }); cobertos++; continue; }
      // fallback: mesmo artefato declarado em OUTRO Módulo, ou nome equivalente só para diagnóstico
      const porNome = espelhos.find((e) => e.origem && normalizarCaminho(e.origem) === alvo);
      const diverge = porNome ? { artefato, espelho: porNome.espelho, endereco: porNome.endereco,
        motivo: 'espelho declara ORIGEM igual, mas ENDEREÇO em outro Módulo (declaração divergente)' }
        : (() => { const ch = chaveDiagnostica(artefato); const perto = espelhos.find((e) => e.origem && chaveDiagnostica(e.origem) === ch);
            return perto ? { artefato, espelho: perto.espelho, endereco: perto.endereco,
              motivo: 'sem espelho com endereço neste Módulo; existe espelho de nome equivalente em outro endereço (texto não idêntico)' } : null; })();
      if (diverge) fallbacksPorNome.push(diverge);
      reg.pendentes.push({ artefato, classe, motivo: diverge ? diverge.motivo : 'nenhum espelho rico declara este código' });
      pendentesDeCodigo++;
    }
    comodos[comodo].modulos.push(reg);
  }

  return {
    valor: pendentesDeCodigo === 0 && modulosSemCapsula === 0 ? 'VERDE' : 'VERMELHO',
    regra: '§21.2/1 — todo Módulo ativo possui espelho rico vinculado ao código real, sem pendência. '
      + 'Identidade por ENDEREÇO DECLARADO + ORIGEM DECLARADA no espelho (§46.15). '
      + 'Código sem espelho = pendência. DOC/TESTE/CURINGA não entram no veredito (§21.1 trata o código) e ficam listados.',
    medido: { modulos: modulos.length, modulos_sem_capsula: modulosSemCapsula,
      artefatos_de_codigo: codigoTotal, cobertos_por_endereco_declarado: cobertos, pendentes: pendentesDeCodigo },
    comodos, fallbacks_por_nome: fallbacksPorNome,
  };
}

// ---------------------------------------------------------------------------
// C2 — nenhuma Auditoria com rejeição em aberto  (fonte canônica: NÃO EXISTE hoje)
// ---------------------------------------------------------------------------

function medirCondicao2() {
  const raizes = [path.join(REPO, '02_Comodos'), path.join(REPO, 'agentic'), path.join(REPO, '06_Inventario'), path.join(REPO, 'dependencias')];
  const historicos = [];
  const estados = ['PARTIAL_APPROVED', 'KEEP_OPEN', 'REJEITADO', 'REJEICAO_EM_ABERTO'];
  const procurar = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const nome of fs.readdirSync(dir).sort()) {
      const p = path.join(dir, nome);
      if (fs.statSync(p).isDirectory()) { procurar(p); continue; }
      if (!/\.(md|json)$/i.test(nome)) continue;
      const texto = fs.readFileSync(p, 'utf8');
      if (/auditoria/i.test(nome) || /auditoria/i.test(texto.slice(0, 400))) historicos.push(path.relative(REPO, p).replace(/\\/g, '/'));
      if (estados.some((e) => texto.includes(e))) historicos.push(`COM_ESTADO:${path.relative(REPO, p)}`);
    }
  };
  raizes.forEach(procurar);
  const comEstado = historicos.filter((h) => h.startsWith('COM_ESTADO:'));
  return {
    mensuravel: false,
    valor: 'NAO_MENSURAVEL',
    motivo: 'não existe fonte canônica legível por máquina do estado das Auditorias (§7.4). '
      + `Busca por ${estados.join('/')} em todo o repositório = ${comEstado.length} ocorrência(s). `
      + 'Documentos encontrados são históricos e sem estado canônico. Não inferir: a casa do estado de Auditoria ainda não foi decidida.',
    fontes_procuradas: raizes.map((r) => path.relative(REPO, r).replace(/\\/g, '/')),
    ocorrencias_de_estado: comEstado.length,
    documentos_historicos_encontrados: historicos.filter((h) => !h.startsWith('COM_ESTADO:')).slice(0, 20),
  };
}

// ---------------------------------------------------------------------------
// C3 — confirmação explícita do Proprietário (literal)
// ---------------------------------------------------------------------------

function medirCondicao3() {
  return {
    valor: 'PENDENTE',
    motivo: 'depende de confirmação explícita do Proprietário de que a visão geral foi restabelecida (§21.2/3). '
      + 'Não há fonte canônica de confirmação; autorização para construir este instrumento NÃO é confirmação.',
    fonte: null,
  };
}

// ---------------------------------------------------------------------------
// §38 — métricas de catch-up estrutural
// ---------------------------------------------------------------------------

function medirMetricas38(c1, comodosComPendencia) {
  const handoffYaml = path.join(REPO, '08_Execucao_Ao_Vivo', 'downplant_handoff.yaml');
  let declaraCatchup = false;
  if (fs.existsSync(handoffYaml)) declaraCatchup = /catch-?up/i.test(fs.readFileSync(handoffYaml, 'utf8'));
  return {
    modulos_ativos_com_espelho_pendente: {
      valor: c1.medido.modulos_sem_capsula + comodosComPendencia,
      detalhe: { modulos_sem_capsula: c1.medido.modulos_sem_capsula, modulos_com_codigo_pendente: comodosComPendencia },
    },
    auditorias_com_rejeicao_em_aberto: { valor: 'NAO_MENSURAVEL', motivo: 'mesma ausência de fonte canônica da Condição 2' },
    proporcao_catchup_vs_produto_por_comodo: {
      valor: 'NAO_MENSURAVEL',
      motivo: 'o §45.4 exige que o handoff declare se a Task é de catch-up estrutural; medido: o handoff canônico (§46.12) '
        + `e o arquivo real (${path.relative(REPO, handoffYaml).replace(/\\/g, '/')}) ${declaraCatchup ? 'declaram' : 'NÃO declaram'} esse campo. `
        + 'Sem campo declarado, a proporção não é calculável sem inferir de título/label de card — o que este instrumento não faz.',
    },
  };
}

// ---------------------------------------------------------------------------
// placar
// ---------------------------------------------------------------------------

function calcular() {
  const c1base = medirCondicao1();
  const velho = Object.entries(c1base.comodos).filter(([, v]) =>
    v.modulos.some((m) => !m.capsula || m.pendentes.length > 0)).map(([k]) => k);
  const c1 = { valor: c1base.valor, regra: c1base.regra, medido: c1base.medido, fallbacks_por_nome: c1base.fallbacks_por_nome,
    comodos_afetados_por_pendencia: velho.length };
  const c2 = medirCondicao2();
  const c3 = medirCondicao3();
  const metricas = medirMetricas38(c1base, velho.length);

  const placar = {
    card: '#170 (DP24-007)',
    instrumento: 'scripts/downplant/gate-retomada.mjs',
    medido_em: new Date().toISOString().slice(0, 10),
    gate_global: (c1base.valor === 'VERDE' && c2.valor === 'VERDE' && c3.valor === 'CONFIRMADO') ? 'VERDE' : 'VERMELHO',
    condicao_1: c1,
    condicao_2: c2,
    condicao_3: c3,
    metricas_38: metricas,
    comodos: Object.values(c1base.comodos).map((c) => ({
      comodo: c.comodo,
      status_legado: c.status_legado,
      modulos: c.modulos.map((m) => ({ modulo: m.modulo, capsula: m.capsula,
        codigo_total: m.codigo_total, cobertos: m.cobertos.length, pendentes: m.pendentes })),
      veredito: c.modulos.some((m) => !m.capsula || m.pendentes.length > 0) ? 'VERMELHO' : 'VERDE',
    })),
    comodos_afetados_por_pendencia: velho,
    artefatos_cobertos: Object.values(c1base.comodos).flatMap((c) => c.modulos.flatMap((m) => m.cobertos.map((x) => x.artefato))),
  };
  return placar;
}

function imprimirHumano(p) {
  const L = [];
  L.push('====================================================');
  L.push('GATE DE RETOMADA DE FATIA DE PRODUTO (§21.2) — card #170');
  L.push(`medido em ${p.medido_em} · instrumento ${p.instrumento}`);
  L.push('====================================================');
  L.push('');
  L.push(`GATE_GLOBAL = ${p.gate_global}`);
  L.push('');
  L.push(`C1 (espelho rico por Módulo ativo) = ${p.condicao_1.valor}`);
  L.push(`   módulos=${p.condicao_1.medido.modulos} · sem cápsula=${p.condicao_1.medido.modulos_sem_capsula} ·`
    + ` código declarado=${p.condicao_1.medido.artefatos_de_codigo} · cobertos=${p.condicao_1.medido.cobertos_por_endereco_declarado} ·`
    + ` pendentes=${p.condicao_1.medido.pendentes}`);
  L.push(`C2 (Auditoria com rejeição em aberto) = ${p.condicao_2.valor}`);
  L.push(`   motivo: ${p.condicao_2.motivo}`);
  L.push(`C3 (confirmação do Proprietário) = ${p.condicao_3.valor}`);
  L.push('');
  L.push('--- por Cômodo (status legado declarado: ' + (p.comodos[0] ? p.comodos[0].status_legado : 'N/A') + ') ---');
  for (const c of p.comodos) {
    L.push(`${c.veredito.padEnd(9)} ${c.comodo}  (legado: ${c.status_legado})`);
    for (const m of c.modulos) {
      const pend = m.pendentes.length;
      L.push(`    ${pend === 0 && m.capsula ? 'OK      ' : 'PENDENTE'} ${m.modulo}  código=${m.codigo_total} cobertos=${m.cobertos} pendentes=${pend}`);
      m.pendentes.slice(0, 3).forEach((x) => L.push(`              - ${x.artefato || '(cápsula)'}: ${x.motivo}`));
      if (pend > 3) L.push(`              ... +${pend - 3} pendência(s)`);
    }
  }
  if (p.condicao_1.fallbacks_por_nome.length) {
    L.push('');
    L.push(`--- DIAGNÓSTICO: ${p.condicao_1.fallbacks_por_nome.length} correspondência(s) por nome equivalente (NÃO contam como cobertura) ---`);
    p.condicao_1.fallbacks_por_nome.slice(0, 8).forEach((f) => L.push(`    ! ${f.artefato} -> ${f.espelho} (${f.motivo})`));
  }
  L.push('');
  L.push('§38 — métricas de catch-up estrutural:');
  L.push(`    módulos com espelho pendente = ${p.metricas_38.modulos_ativos_com_espelho_pendente.valor}`);
  L.push(`    auditorias com rejeição em aberto = ${p.metricas_38.auditorias_com_rejeicao_em_aberto.valor}`);
  L.push(`    proporção catch-up × produto por Cômodo = ${p.metricas_38.proporcao_catchup_vs_produto_por_comodo.valor}`);
  L.push('');
  L.push('Este instrumento MEDE. Não corrige, não escreve e não infere estado a partir de nome de arquivo.');
  return L.join('\n');
}

const placar = calcular();
if (process.argv.includes('--json')) console.log(JSON.stringify(placar, null, 2));
else console.log(imprimirHumano(placar));
process.exit(placar.gate_global === 'VERDE' ? 0 : 1);
