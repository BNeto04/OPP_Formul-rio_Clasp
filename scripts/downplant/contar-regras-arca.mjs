#!/usr/bin/env node
/**
 * ARQUIVO: scripts/downplant/contar-regras-arca.mjs
 * CARD:    #159 [ARCA-COUNT-001] - Reconciliar as contagens da ARCA POR METRICA.
 *
 * FONTE UNICA DA VERDADE: Dominio/ARCA/arca_regras_dominio.json
 * Este script NAO guarda numero nenhum: ele MEDE o JSON e, a partir da medicao,
 * GERA o texto dos lugares derivados (blocos markdown, inventario, canvas, HTML).
 *
 * Regra do Proprietario (verbatim): "reconciliar as contagens da ARCA por METRICA,
 * nao escolher um numero artificial" -> todo numero e derivado, nunca digitado.
 *
 * USO
 *   node scripts/downplant/contar-regras-arca.mjs            # saida em TEXTO (stdout)
 *   node scripts/downplant/contar-regras-arca.mjs --json     # payload JSON (metricas + blocos + artefatos)
 *   node scripts/downplant/contar-regras-arca.mjs --aplicar  # escreve os lugares derivados (repo)
 *   node scripts/downplant/contar-regras-arca.mjs --aplicar --espelho  # + espelho do Obsidian
 *
 * A FECHADURA vive em Testes/TestArcaContagemDerivada.js: ela executa este script
 * com --json e compara byte a byte com os arquivos. Qualquer numero digitado a mao
 * (ou JSON alterado sem regerar) deixa o teste VERMELHO.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export const ARQ_JSON = path.join(RAIZ, 'Dominio', 'ARCA', 'arca_regras_dominio.json');
export const ARQ_ADAPTADOR = path.join(RAIZ, 'Dominio', 'ARCA', 'AdaptadorConsultaArca.js');
export const ARQ_SNAPSHOT = path.join(RAIZ, 'scripts', 'downplant', 'arca_metricas_derivadas.json');
export const ARQ_INVENTARIO = 'Dominio/ARCA/INVENTARIO_ARCA.md';
export const ARQ_REGRAS = 'Dominio/ARCA/ARCA_REGRAS_DOMINIO.md';
export const ARQ_COBERTURA = 'Dominio/ARCA/ARCA_COBERTURA.md';
export const ARQ_FLOW = 'Dominio/ARCA/arca_flow.html';
export const ARQ_CANVAS_MOD = '02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO/CIR-MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO.canvas';
export const ARQ_CANVAS_COMODO = '02_Comodos/C03_Dominio/00_Visao_Do_Comodo/CIR-C03_DOMINIO.canvas';

const ESPELHO = 'C:\\Users\\Bneto04\\Documents\\Obsidian\\Obsidian_Brain\\Syntheon';

export const HIST_INI = '<!-- ARCA-HISTORICO:INICIO -->';
export const HIST_FIM = '<!-- ARCA-HISTORICO:FIM -->';

const MARCADORES = {
  METRICAS: 'ARCA-METRICAS',
  STATS: 'ARCA-STATS',
  GRID_MAPEADO: 'ARCA-GRID-MAPEADO',
  GRID_INTEGRADO: 'ARCA-GRID-INTEGRADO',
  GRID_NAO_APLICAVEL: 'ARCA-GRID-NAO_APLICAVEL'
};

// ---------------------------------------------------------------------------
// 1. MEDICAO (tudo derivado do JSON; a porta e derivada do proprio .js)
// ---------------------------------------------------------------------------

export function calcularMetricas() {
  const buffer = fs.readFileSync(ARQ_JSON);
  const json = JSON.parse(buffer.toString('utf8'));
  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
  const regras = json.regras;

  const contarPor = (f) => regras.reduce((acc, r) => {
    const k = f(r);
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  const porStatus = contarPor((r) => (r.auditabilidade_guardiao && r.auditabilidade_guardiao.status) || 'SEM_STATUS');
  const porTipo = contarPor((r) => r.tipo_regra);
  const porFonte = contarPor((r) => r.fonte_status);
  const porSubdominio = contarPor((r) => r.subdominio);
  const porCategoria = contarPor((r) => r.categoria);
  const porConfianca = contarPor((r) => r.confianca);

  const codigos = regras.flatMap((r) => ((r.auditabilidade_guardiao && r.auditabilidade_guardiao.codigos) || []));
  const codigosUnicos = [...new Set(codigos)];
  const ruleIds = regras.map((r) => r.rule_id);
  const ruleIdsUnicos = [...new Set(ruleIds)];

  // porta de consulta: mede o mapa real do adaptador (nao a lista declarada no JSON)
  const portaSrc = fs.readFileSync(ARQ_ADAPTADOR, 'utf8');
  const portaMapa = {};
  const rePorta = /'([A-Z0-9_]{4,})':\s*'(ARCA-[A-Z0-9-]+)'/g;
  let m;
  while ((m = rePorta.exec(portaSrc)) !== null) portaMapa[m[1]] = m[2];
  const portaCodigos = Object.keys(portaMapa);
  const portaRuleIds = [...new Set(Object.values(portaMapa))];
  const portaIdsAusentesNoJson = portaRuleIds.filter((id) => !ruleIdsUnicos.includes(id));
  const codigosDoJsonAusentesNaPorta = codigosUnicos.filter((c) => !portaCodigos.includes(c));
  const codigosDaPortaAusentesNoJson = portaCodigos.filter((c) => !codigosUnicos.includes(c));

  const varredura = (json.meta && json.meta.varredura_exaustiva) || {};
  const universo = varredura.universo || {};

  const total = regras.length;

  const metricas = {
    sha256_json: sha256,
    regras_total: total,
    rule_ids_unicos: ruleIdsUnicos.length,
    regras_mapeadas: porStatus.MAPEADO || 0,
    regras_integradas: porStatus.INTEGRADO || 0,
    regras_nao_aplicaveis: porStatus.NAO_APLICAVEL || 0,
    regras_nao_auditaveis: porStatus.NAO_AUDITAVEL || 0,
    regras_sem_auditoria_guardiao: total - (porStatus.MAPEADO || 0),
    codigos_diagnostico: codigos.length,
    codigos_diagnostico_unicos: codigosUnicos.length,
    regras_com_codigo: regras.filter((r) => ((r.auditabilidade_guardiao && r.auditabilidade_guardiao.codigos) || []).length > 0).length,
    porta_codigos: portaCodigos.length,
    porta_rule_ids: portaRuleIds.length,
    regras_sem_regra_na_porta: total - portaRuleIds.length,
    porta_codigos_sem_regra: portaIdsAusentesNoJson.length,
    campos_por_regra: Object.keys(regras[0]).length,
    campos_por_regra_uniao: new Set(regras.flatMap((r) => Object.keys(r))).size,
    fontes_canonicas: porFonte.CANONICAL_SOURCE_CONFIRMED || 0,
    fontes_internas: porFonte.INTERNAL_SOURCE_CONFIRMED || 0,
    fontes_desconhecidas: porFonte.DOMAIN_RULE_SOURCE_UNKNOWN || 0,
    confianca_alta: porConfianca.ALTA || 0,
    confianca_media: porConfianca.MEDIA || 0,
    subdominios: Object.keys(porSubdominio).length,
    categorias: Object.keys(porCategoria).length,
    arquivos_totais_repo: universo.arquivos_totais_repo != null ? universo.arquivos_totais_repo : null,
    arquivos_varridos_dominio_js: universo.arquivos_varridos_dominio_js != null ? universo.arquivos_varridos_dominio_js : null,
    arquivos_excluidos: universo.arquivos_excluidos != null ? universo.arquivos_excluidos : null,
    lacunas_detectadas: varredura.lacunas_detectadas != null ? varredura.lacunas_detectadas : null,
    lacunas_resolvidas: varredura.lacunas_resolvidas != null ? varredura.lacunas_resolvidas : null,
    lacunas_aceitas: varredura.lacunas_aceitas != null ? varredura.lacunas_aceitas : null
  };

  return { metricas, porTipo, porStatus, porFonte, porSubdominio, porCategoria, regras, json };
}

// ---------------------------------------------------------------------------
// 2. VALIDACOES INTERNAS (o proprio medidor prova a coerencia da medicao)
// ---------------------------------------------------------------------------

export function validarMetricas(medido) {
  const { metricas: k, porTipo, porStatus, regras } = medido;
  const erros = [];
  const soma = (o) => Object.values(o).reduce((a, b) => a + b, 0);
  if (soma(porTipo) !== k.regras_total) erros.push('soma por tipo != regras_total');
  if (soma(porStatus) !== k.regras_total) erros.push('soma por status != regras_total');
  if (k.rule_ids_unicos !== k.regras_total) erros.push('rule_ids duplicados no catalogo');
  const s = k.regras_mapeadas + k.regras_integradas + k.regras_nao_aplicaveis + k.regras_nao_auditaveis;
  if (s !== k.regras_total) erros.push('mapeadas+integradas+nao_aplicaveis+nao_auditaveis != regras_total');
  if (k.regras_sem_auditoria_guardiao !== k.regras_total - k.regras_mapeadas) erros.push('regras_sem_auditoria_guardiao incoerente');
  if (k.regras_sem_regra_na_porta !== k.regras_total - k.porta_rule_ids) erros.push('regras_sem_regra_na_porta incoerente');
  if (k.porta_codigos_sem_regra !== 0) erros.push('codigo da porta sem rule_id no JSON');
  if (k.codigos_diagnostico_unicos !== k.codigos_diagnostico) erros.push('codigo de diagnostico duplicado entre regras');
  if (k.porta_codigos !== k.codigos_diagnostico) erros.push('porta e JSON divergem no numero de codigos de diagnostico');
  regras.forEach((r) => {
    if (!r.auditabilidade_guardiao || !r.auditabilidade_guardiao.status) erros.push(r.rule_id + ': auditabilidade_guardiao.status ausente');
  });
  return erros;
}

// ---------------------------------------------------------------------------
// 3. GERACAO DOS TEXTOS DERIVADOS
// ---------------------------------------------------------------------------

function tabelaContagem(titulo, objeto, mapearNome) {
  const linhas = Object.entries(objeto)
    .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])))
    .map(([chave, valor]) => `| \`${mapearNome ? mapearNome(chave) : chave}\` | ${valor} |`);
  return [`**${titulo}**`, '', '| Chave | Regras |', '| :--- | ---: |', ...linhas].join('\n');
}

export function blocoMarkdown(medido) {
  const k = medido.metricas;
  const sub = Object.entries(medido.porSubdominio)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([nome, qtd]) => {
      const doSub = medido.regras.filter((r) => r.subdominio === nome);
      const c = (st) => doSub.filter((r) => r.auditabilidade_guardiao.status === st).length;
      return `| \`${nome}\` | ${qtd} | ${c('MAPEADO')} | ${c('INTEGRADO')} | ${c('NAO_APLICAVEL')} |`;
    });

  return [
    '#### Métricas derivadas do JSON — por métrica, com definição explícita (#159 ARCA-COUNT-001)',
    '',
    '> Gerado por `scripts/downplant/contar-regras-arca.mjs` a partir de `Dominio/ARCA/arca_regras_dominio.json` ',
    `> (sha256 \`${k.sha256_json}\`). **Nenhum número abaixo é digitado à mão**: cada linha é a medição do campo indicado.`,
    '> Substitui qualquer "total ARCA" anterior — o total ambíguo não existe mais.',
    '',
    '| Métrica | Definição (campo medido no JSON) | Valor |',
    '| :--- | :--- | ---: |',
    `| \`regras_total\` | registros na lista \`regras\` (total do catálogo) | **${k.regras_total}** |`,
    `| \`rule_ids_unicos\` | valores distintos de \`rule_id\` | **${k.rule_ids_unicos}** |`,
    `| \`regras_mapeadas\` | \`auditabilidade_guardiao.status = MAPEADO\` (o Guardião audita) | **${k.regras_mapeadas}** |`,
    `| \`regras_integradas\` | \`auditabilidade_guardiao.status = INTEGRADO\` (NormalizadorEfetivo/plugins via porta) | **${k.regras_integradas}** |`,
    `| \`regras_nao_aplicaveis\` | \`auditabilidade_guardiao.status = NAO_APLICAVEL\` (estruturais) | **${k.regras_nao_aplicaveis}** |`,
    `| \`regras_nao_auditaveis\` | \`auditabilidade_guardiao.status = NAO_AUDITAVEL\` (regras cegas) | **${k.regras_nao_auditaveis}** |`,
    `| \`regras_sem_auditoria_guardiao\` | \`regras_total − regras_mapeadas\` (tudo que o Guardião **não** audita) | **${k.regras_sem_auditoria_guardiao}** |`,
    `| \`codigos_diagnostico\` | soma dos itens de \`auditabilidade_guardiao.codigos\` | **${k.codigos_diagnostico}** |`,
    `| \`codigos_diagnostico_unicos\` | códigos distintos | **${k.codigos_diagnostico_unicos}** |`,
    `| \`regras_com_codigo\` | regras com ao menos 1 código de diagnóstico | **${k.regras_com_codigo}** |`,
    `| \`porta_codigos\` | entradas de \`AdaptadorConsultaArca.MAPA_DIAGNOSTICO_ARCA\` | **${k.porta_codigos}** |`,
    `| \`porta_rule_ids\` | \`rule_id\` distintos alcançados pela porta | **${k.porta_rule_ids}** |`,
    `| \`regras_sem_regra_na_porta\` | \`regras_total − porta_rule_ids\` (regras fora do mapa de códigos) | **${k.regras_sem_regra_na_porta}** |`,
    `| \`campos_por_regra\` | campos da regra no JSON (padrão do catálogo) | **${k.campos_por_regra}** |`,
    `| \`campos_por_regra_uniao\` | união de campos declarados em alguma regra | **${k.campos_por_regra_uniao}** |`,
    `| \`fontes_canonicas\` | \`fonte_status = CANONICAL_SOURCE_CONFIRMED\` | **${k.fontes_canonicas}** |`,
    `| \`fontes_internas\` | \`fonte_status = INTERNAL_SOURCE_CONFIRMED\` | **${k.fontes_internas}** |`,
    `| \`fontes_desconhecidas\` | \`fonte_status = DOMAIN_RULE_SOURCE_UNKNOWN\` | **${k.fontes_desconhecidas}** |`,
    `| \`subdominios\` | valores distintos de \`subdominio\` | **${k.subdominios}** |`,
    `| \`categorias\` | valores distintos de \`categoria\` | **${k.categorias}** |`,
    `| \`arquivos_totais_repo\` | \`meta.varredura_exaustiva.universo.arquivos_totais_repo\` | **${k.arquivos_totais_repo}** |`,
    `| \`arquivos_varridos_dominio_js\` | \`meta.varredura_exaustiva.universo.arquivos_varridos_dominio_js\` | **${k.arquivos_varridos_dominio_js}** |`,
    `| \`arquivos_excluidos\` | \`meta.varredura_exaustiva.universo.arquivos_excluidos\` | **${k.arquivos_excluidos}** |`,
    `| \`lacunas_detectadas\` | \`meta.varredura_exaustiva.lacunas_detectadas\` | **${k.lacunas_detectadas}** |`,
    `| \`lacunas_resolvidas\` | \`meta.varredura_exaustiva.lacunas_resolvidas\` | **${k.lacunas_resolvidas}** |`,
    `| \`lacunas_aceitas\` | \`meta.varredura_exaustiva.lacunas_aceitas\` | **${k.lacunas_aceitas}** |`,
    '',
    '**Por tipo de regra (`tipo_regra`)** — soma = ' + k.regras_total + ': ' +
      Object.entries(medido.porTipo).sort((a, b) => b[1] - a[1]).map(([t, n]) => `\`${t}\` = **${n}**`).join(' · ') + '.',
    '',
    '**Por subdomínio (`subdominio`)** — total = ' + k.regras_total + ':',
    '',
    '| Subdomínio | Regras | MAPEADO | INTEGRADO | NAO_APLICAVEL |',
    '| :--- | ---: | ---: | ---: | ---: |',
    ...sub,
    '',
    `**Códigos de diagnóstico:** ${k.codigos_diagnostico} códigos (${k.codigos_diagnostico_unicos} distintos) em ${k.regras_com_codigo} regras; ` +
      `a porta de consulta cobre ${k.porta_codigos} códigos → ${k.porta_rule_ids} rule_ids (0 código sem regra, 0 regra duplicada por código).`,
    ''
  ].join('\n');
}

export function inventarioCompleto(medido) {
  const k = medido.metricas;
  const blocos = [];
  const grupos = [
    ['MAPEADO', 'MAPEADO — auditadas pelo Guardião', 'Cada regra abaixo tem um diagnóstico que o Guardião emite na planilha.'],
    ['INTEGRADO', 'INTEGRADO — aplicadas por outros componentes', 'Aplicadas pelo NormalizadorEfetivo ou pelos plugins de métricas, via porta ARCA (#127).'],
    ['NAO_APLICAVEL', 'NAO_APLICAVEL — regras estruturais', 'Não são regras de auditoria de planilha: agregação, layout físico, entrada de dados.']
  ];
  grupos.forEach(([status, titulo, intro]) => {
    const doGrupo = medido.regras
      .filter((r) => r.auditabilidade_guardiao.status === status)
      .sort((a, b) => a.rule_id.localeCompare(b.rule_id));
    blocos.push(`## ${titulo} (${doGrupo.length})`, '', intro, '');
    doGrupo.forEach((r) => {
      const a = r.auditabilidade_guardiao;
      const esperado = String(r.resultado_esperado || '').replace(/\s+/g, ' ').trim();
      blocos.push(
        `### \`${r.rule_id}\` — ${r.titulo}`,
        `- **Categoria:** ${r.categoria} · **Subdomínio:** ${r.subdominio} · **Cobertura:** ${r.status_cobertura || '(vazio)'} · **Confiança:** ${r.confianca || '(vazio)'}`,
        `- **Condição:** ${String(r.condicao || '').replace(/\s+/g, ' ').trim()}`,
        `- **Esperado:** ${esperado.length > 200 ? esperado.slice(0, 200) : esperado}`,
        `- **Diagnóstico(s):** ${(a.codigos || []).length ? a.codigos.map((c) => '`' + c + '`').join(', ') : '—'}`,
        `- **Consumidor(es) real(is):** ${((r.consumidores && r.consumidores.REAL_CODE_CONSUMER) || []).map((c) => '`' + c + '`').join(', ') || '—'}`,
        `- **Motivo (auditabilidade_guardiao):** ${String(a.motivo || '').replace(/\s+/g, ' ').trim()}`,
        ''
      );
    });
  });

  const lacunas = medido.regras.filter((r) => !r.status_cobertura).map((r) => `- \`${r.rule_id}\` (${r.titulo}) — **status_cobertura vazio** no JSON.`);
  if (!lacunas.length) lacunas.push('- Nenhuma lacuna apurada: todas as regras têm `status_cobertura` no JSON.');

  return [
    '# ARCA — Levantamento de Regras de Domínio',
    '',
    '> Documento **gerado** a partir de `Dominio/ARCA/arca_regras_dominio.json`.',
    `> Fonte da verdade: o JSON (sha256 \`${k.sha256_json}\`). Este arquivo é um retrato (retrato = levantamento).`,
    '> Gerado por `scripts/downplant/contar-regras-arca.mjs` — **não editar à mão** (#159 ARCA-COUNT-001).',
    '',
    '## Visão geral',
    '',
    '| Métrica | Definição (campo do JSON) | Valor |',
    '|---|---|---:|',
    `| Total de regras (\`regras\`) | registros da lista | **${k.regras_total}** |`,
    `| \`rule_id\` únicos | valores distintos | **${k.rule_ids_unicos}** |`,
    `| Auditadas pelo Guardião (\`MAPEADO\`) | \`auditabilidade_guardiao.status\` | **${k.regras_mapeadas}** |`,
    `| Aplicadas por outros componentes (\`INTEGRADO\`) | \`auditabilidade_guardiao.status\` | **${k.regras_integradas}** |`,
    `| Estruturais (\`NAO_APLICAVEL\`) | \`auditabilidade_guardiao.status\` | **${k.regras_nao_aplicaveis}** |`,
    `| Cegas (\`NAO_AUDITAVEL\`) | \`auditabilidade_guardiao.status\` | **${k.regras_nao_auditaveis}** |`,
    `| Fora da auditoria do Guardião | \`regras_total − regras_mapeadas\` | **${k.regras_sem_auditoria_guardiao}** |`,
    `| Códigos de diagnóstico | soma de \`auditabilidade_guardiao.codigos\` | **${k.codigos_diagnostico}** (em ${k.regras_com_codigo} regras) |`,
    `| Porta de consulta | códigos → \`rule_id\` distintos | **${k.porta_codigos} → ${k.porta_rule_ids}** |`,
    '',
    `**Leitura:** não existem regras "cegas" (\`NAO_AUDITAVEL\` = ${k.regras_nao_auditaveis}). As **${k.regras_total}** regras têm destino:`,
    `**${k.regras_mapeadas}** o Guardião audita, **${k.regras_integradas}** são aplicadas pelo NormalizadorEfetivo/plugins via porta ARCA (#127),`,
    `e **${k.regras_nao_aplicaveis}** são estruturais (agregação, layout, entrada de dados) que por definição não geram diagnóstico de planilha.`,
    '',
    '## Fluxo (fluid flow)',
    '',
    '```',
    '  ENTRADA            NORMALIZACAO           PLANILHA            GUARDIAO                METRICAS',
    `  Formulario   ->    NormalizadorEfetivo -> abas mensais  ->    ${k.regras_mapeadas} diagnosticos ->   plugins`,
    `  EntradaManual      (porta ARCA #127)     (tuneis)           (auditoria)             (PIP/drogas/armas)`,
    '```',
    '',
    ...blocos,
    '## Lacunas apuradas',
    '',
    ...lacunas,
    ''
  ].join('\n');
}

export function textoCanvas(medido) {
  const k = medido.metricas;
  return [
    '### METRICAS DERIVADAS DA ARCA (do JSON - nao editar a mao)',
    'Fonte: Dominio/ARCA/arca_regras_dominio.json',
    `sha256: ${k.sha256_json.slice(0, 16)}...`,
    `${k.regras_total} regras | ${k.regras_mapeadas} MAPEADO | ${k.regras_integradas} INTEGRADO | ${k.regras_nao_aplicaveis} NAO_APLICAVEL | ${k.regras_nao_auditaveis} NAO_AUDITAVEL`,
    `${k.regras_sem_auditoria_guardiao} regras fora da auditoria do Guardiao | ${k.codigos_diagnostico} codigos de diagnostico (${k.codigos_diagnostico_unicos} distintos) em ${k.regras_com_codigo} regras`,
    `porta: ${k.porta_codigos} codigos -> ${k.porta_rule_ids} rule_ids | ${k.regras_sem_regra_na_porta} regras sem regra na porta`,
    `${k.fontes_canonicas} canonicas | ${k.fontes_internas} internas | ${k.fontes_desconhecidas} desconhecidas | ${k.subdominios} subdominios | ${k.categorias} categorias | ${k.campos_por_regra} campos por regra`,
    'Gerado por scripts/downplant/contar-regras-arca.mjs (#159 ARCA-COUNT-001)'
  ].join('\n');
}

function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function blocoFlowStats(medido) {
  const k = medido.metricas;
  return [
    `<div class="sub">${k.regras_total} regras de dom&iacute;nio &middot; fonte: <code>Dominio/ARCA/arca_regras_dominio.json</code> &middot; sha256 <code>${k.sha256_json.slice(0, 12)}</code> &middot; derivado por <code>scripts/downplant/contar-regras-arca.mjs</code> (#159 ARCA-COUNT-001)</div>`,
    '<div class="stats">',
    `  <span class="pill p-m"><b>${k.regras_mapeadas}</b> auditadas</span>`,
    `  <span class="pill p-i"><b>${k.regras_integradas}</b> integradas</span>`,
    `  <span class="pill p-n"><b>${k.regras_nao_aplicaveis}</b> estruturais</span>`,
    `  <span class="pill"><b>${k.regras_total}</b> total</span>`,
    `  <span class="pill"><b>${k.codigos_diagnostico}</b> c&oacute;digos em ${k.regras_com_codigo} regras</span>`,
    '  <span class="pill"><b>0</b> cegas</span>',
    '</div>'
  ].join('\n');
}

export function blocoFlowGrid(medido, status) {
  const k = medido.metricas;
  const classe = { MAPEADO: 'm', INTEGRADO: 'i', NAO_APLICAVEL: 'n' }[status];
  const titulo = {
    MAPEADO: `MAPEADO &mdash; auditadas pelo Guardi&atilde;o (${k.regras_mapeadas})`,
    INTEGRADO: `INTEGRADO &mdash; aplicadas por outros componentes (${k.regras_integradas})`,
    NAO_APLICAVEL: `NAO_APLICAVEL &mdash; regras estruturais (${k.regras_nao_aplicaveis})`
  }[status];
  const cards = medido.regras
    .filter((r) => r.auditabilidade_guardiao.status === status)
    .sort((a, b) => a.rule_id.localeCompare(b.rule_id))
    .map((r) => {
      const codigos = (r.auditabilidade_guardiao.codigos || []).join(', ');
      const cons = ((r.consumidores && r.consumidores.REAL_CODE_CONSUMER) || []).join(', ').slice(0, 80);
      return `<div class="card ${classe}"><div class="c-top"><code>${r.rule_id}</code><span class="cat">${escHtml(r.categoria)}</span></div>` +
        `<div class="c-tit">${escHtml(r.titulo)}</div>` +
        (codigos ? `<div class="c-diag">${escHtml(codigos)}</div>` : '') +
        `<div class="c-cons">${escHtml(cons)}</div></div>`;
    });
  return [`<h2>${titulo}</h2>`, `<div class="grid">${cards.join('')}</div>`].join('\n');
}

// ---------------------------------------------------------------------------
// 4. REGISTRO DOS LUGARES DERIVADOS (o que a fechadura cobra)
// ---------------------------------------------------------------------------

// Artefatos com bloco gerado entre marcadores (nome do marcador -> arquivo)
export const BLOCOS = [
  { marcador: MARCADORES.METRICAS, arquivo: ARQ_REGRAS, gerar: blocoMarkdown },
  { marcador: MARCADORES.METRICAS, arquivo: ARQ_COBERTURA, gerar: blocoMarkdown },
  { marcador: MARCADORES.STATS, arquivo: ARQ_FLOW, gerar: blocoFlowStats },
  { marcador: MARCADORES.GRID_MAPEADO, arquivo: ARQ_FLOW, gerar: (m) => blocoFlowGrid(m, 'MAPEADO') },
  { marcador: MARCADORES.GRID_INTEGRADO, arquivo: ARQ_FLOW, gerar: (m) => blocoFlowGrid(m, 'INTEGRADO') },
  { marcador: MARCADORES.GRID_NAO_APLICAVEL, arquivo: ARQ_FLOW, gerar: (m) => blocoFlowGrid(m, 'NAO_APLICAVEL') }
];

// Arquivos gerados por inteiro
export const ARQUIVOS_INTEIROS = [
  { arquivo: ARQ_INVENTARIO, gerar: inventarioCompleto }
];

// Substituicoes dirigidas em arquivos pontuais (numero digitado -> numero derivado)
export const SUBSTITUICOES = [
  {
    arquivo: ARQ_CANVAS_MOD,
    regex: /31 regras: 9 OFFICIAL_BUSINESS, 17 INTERNAL_OPERATIONAL, 1 CANONICAL_NORMATIVE, 2 HEURISTIC, 2 TECHNICAL\./g,
    gerar: (m) => `${m.metricas.regras_total} regras: ${m.porTipo.OFFICIAL_BUSINESS_RULE} OFFICIAL_BUSINESS, ${m.porTipo.INTERNAL_OPERATIONAL_RULE} INTERNAL_OPERATIONAL, ${m.porTipo.CANONICAL_NORMATIVE_RULE} CANONICAL_NORMATIVE, ${m.porTipo.HEURISTIC} HEURISTIC, ${m.porTipo.TECHNICAL_RULE} TECHNICAL.`
  },
  {
    arquivo: ARQ_CANVAS_MOD,
    regex: /\d+ canonicas \| \d+ internas \| \d+ desconhecidas/g,
    gerar: (m) => `${m.metricas.fontes_canonicas} canonicas | ${m.metricas.fontes_internas} internas | ${m.metricas.fontes_desconhecidas} desconhecidas`
  },
  {
    arquivo: ARQ_CANVAS_MOD,
    regex: /\d+ codigos -> \d+ de \d+ regras/g,
    gerar: (m) => `${m.metricas.porta_codigos} codigos -> ${m.metricas.porta_rule_ids} de ${m.metricas.regras_total} regras`
  },
  {
    arquivo: ARQ_CANVAS_COMODO,
    regex: /\(\d+ regras\)/g,
    gerar: (m) => `(${m.metricas.regras_total} regras)`
  },
  {
    arquivo: '02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO/NOTA_DE_RESPONSABILIDADE.md',
    regex: /\(31 regras\)/g,
    gerar: (m) => `(${m.metricas.regras_total} regras)`
  },
  {
    arquivo: '02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO/NOTA_DE_RESPONSABILIDADE.md',
    regex: /Mapeamento: \d+ codigos de diagnostico -> \d+ das \d+ regras\./g,
    gerar: (m) => `Mapeamento: ${m.metricas.porta_codigos} codigos de diagnostico -> ${m.metricas.porta_rule_ids} das ${m.metricas.regras_total} regras.`
  },
  {
    arquivo: '02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO/NOTA_DE_RESPONSABILIDADE.md',
    regex: /\d+ regras sem mapeamento na porta\./g,
    gerar: (m) => `${m.metricas.regras_sem_regra_na_porta} regras sem mapeamento na porta.`
  },
  {
    arquivo: '02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO/NOTA_DE_RESPONSABILIDADE.md',
    regex: /\(\d+ regras \+ lacunas G01\)/g,
    gerar: (m) => `(lacunas G01 do #126; hoje ${m.metricas.regras_sem_regra_na_porta} regras fora do mapa de codigos)`
  },
  {
    arquivo: '02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO/NOTA_DE_RESPONSABILIDADE.md',
    regex: /catalogo atual varreu \d+ de \d+ arquivos( \(varredura exaustiva revisada no #159\))*/g,
    gerar: (m) => `catalogo atual varreu ${m.metricas.arquivos_varridos_dominio_js} de ${m.metricas.arquivos_totais_repo} arquivos (varredura exaustiva revisada no #159)`
  },
  {
    arquivo: '02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO/submodulos/SUB-C03-02-01_CATALOGO_DE_REGRAS/NOTA_DE_RESPONSABILIDADE.md',
    regex: /\d+ regras com \d+ campos por regra( \(uniao de campos: \d+\))*/g,
    gerar: (m) => `${m.metricas.regras_total} regras com ${m.metricas.campos_por_regra} campos por regra (uniao de campos: ${m.metricas.campos_por_regra_uniao})`
  },
  {
    arquivo: '02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO/submodulos/SUB-C03-02-01_CATALOGO_DE_REGRAS/CIR-SUB-C03-02-01_CATALOGO_DE_REGRAS.canvas',
    regex: /\d+ regras com \d+ campos por regra( \(uniao de campos: \d+\))*/g,
    gerar: (m) => `${m.metricas.regras_total} regras com ${m.metricas.campos_por_regra} campos por regra (uniao de campos: ${m.metricas.campos_por_regra_uniao})`
  },
  {
    arquivo: '02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO/submodulos/SUB-C03-02-04_ADAPTADOR_PORTA_DE_CONSULTA/NOTA_DE_RESPONSABILIDADE.md',
    regex: /Mapeia \d+ codigos -> \d+ das \d+ regras/g,
    gerar: (m) => `Mapeia ${m.metricas.porta_codigos} codigos -> ${m.metricas.porta_rule_ids} das ${m.metricas.regras_total} regras`
  },
  {
    arquivo: '02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO/submodulos/SUB-C03-02-04_ADAPTADOR_PORTA_DE_CONSULTA/CIR-SUB-C03-02-04_ADAPTADOR_PORTA_DE_CONSULTA.canvas',
    regex: /Mapeia \d+ codigos -> \d+ das \d+ regr/g,
    gerar: (m) => `Mapeia ${m.metricas.porta_codigos} codigos -> ${m.metricas.porta_rule_ids} das ${m.metricas.regras_total} regr`
  }
];

// Arquivos vivos que carregam numero de catalogo e que a fechadura vigia
export const VIGIADOS = [
  ARQ_REGRAS,
  ARQ_INVENTARIO,
  ARQ_COBERTURA,
  ARQ_FLOW,
  ARQ_CANVAS_MOD,
  ARQ_CANVAS_COMODO,
  '02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO/NOTA_DE_RESPONSABILIDADE.md',
  '02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO/submodulos/SUB-C03-02-01_CATALOGO_DE_REGRAS/NOTA_DE_RESPONSABILIDADE.md',
  '02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO/submodulos/SUB-C03-02-01_CATALOGO_DE_REGRAS/CIR-SUB-C03-02-01_CATALOGO_DE_REGRAS.canvas',
  '02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO/submodulos/SUB-C03-02-04_ADAPTADOR_PORTA_DE_CONSULTA/NOTA_DE_RESPONSABILIDADE.md',
  '02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO/submodulos/SUB-C03-02-04_ADAPTADOR_PORTA_DE_CONSULTA/CIR-SUB-C03-02-04_ADAPTADOR_PORTA_DE_CONSULTA.canvas'
];

// ---------------------------------------------------------------------------
// 5. MARCADORES
// ---------------------------------------------------------------------------

export function marcadorInicio(nome, sha256) {
  return `<!-- ${nome}:INICIO (gerado por scripts/downplant/contar-regras-arca.mjs; sha256 do JSON: ${sha256}) -->`;
}

export function marcadorFim(nome) {
  return `<!-- ${nome}:FIM -->`;
}

export function lerBloco(texto, nome) {
  const re = new RegExp('<!-- ' + nome + ':INICIO[^>]*-->\\r?\\n([\\s\\S]*?)\\r?\\n?<!-- ' + nome + ':FIM -->');
  const m = texto.match(re);
  return m ? m[1] : null;
}

export function escreverBloco(texto, nome, conteudo, sha256) {
  const eol = texto.indexOf('\r\n') !== -1 ? '\r\n' : '\n';
  const corpo = conteudo.split('\n').join(eol);
  const novo = marcadorInicio(nome, sha256) + eol + corpo + eol + marcadorFim(nome);
  const re = new RegExp('<!-- ' + nome + ':INICIO[^>]*-->[\\s\\S]*?<!-- ' + nome + ':FIM -->');
  if (!re.test(texto)) return null;
  return texto.replace(re, novo);
}

export function faixasHistoricas(texto, ini, fim) {
  const faixas = [];
  let i = 0;
  while (i < texto.length) {
    const a = texto.indexOf(ini, i);
    if (a === -1) break;
    const b = texto.indexOf(fim, a);
    faixas.push([a, b === -1 ? texto.length : b + fim.length]);
    i = b === -1 ? texto.length : b + fim.length;
  }
  return faixas;
}

// ---------------------------------------------------------------------------
// 6. PAYLOAD (metricas + textos gerados) - e o contrato consumido pela fechadura
// ---------------------------------------------------------------------------

export function montarPayload(medido) {
  const arquivos = {};
  ARQUIVOS_INTEIROS.forEach(({ arquivo, gerar }) => { arquivos[arquivo] = gerar(medido); });
  const blocos = {};
  BLOCOS.forEach(({ marcador, arquivo, gerar }) => {
    blocos[arquivo + '#' + marcador] = gerar(medido);
  });
  return {
    fonte: 'Dominio/ARCA/arca_regras_dominio.json',
    sha256_json: medido.metricas.sha256_json,
    metricas: medido.metricas,
    por_tipo: medido.porTipo,
    por_status: medido.porStatus,
    por_fonte: medido.porFonte,
    por_subdominio: medido.porSubdominio,
    por_categoria: medido.porCategoria,
    blocos,
    arquivos,
    canvas_texto: textoCanvas(medido),
    canvas_modulo: ARQ_CANVAS_MOD,
    no_canvas: 'arca-metricas',
    marcadores: { ...MARCADORES, HISTORICO: 'ARCA-HISTORICO' },
    historico_inicio: HIST_INI,
    historico_fim: HIST_FIM,
    vigiados: VIGIADOS,
    substuicoes: SUBSTITUICOES.map((s) => ({
      arquivo: s.arquivo,
      regex: s.regex.source,
      flags: s.regex.flags,
      texto: s.gerar(medido)
    }))
  };
}

export function snapshotJson(medido) {
  const k = medido.metricas;
  const { sha256_json, ...semHash } = k;
  return JSON.stringify({
    fonte: 'Dominio/ARCA/arca_regras_dominio.json',
    sha256_json,
    gerado_por: 'scripts/downplant/contar-regras-arca.mjs',
    metricas: semHash,
    por_status: medido.porStatus,
    por_tipo: medido.porTipo,
    por_fonte: medido.porFonte,
    por_subdominio: medido.porSubdominio,
    por_categoria: medido.porCategoria
  }, null, 2) + '\n';
}

export function textoSaida(medido) {
  const k = medido.metricas;
  const linhas = [
    '',
    'ARCA — CONTAGEM DERIVADA DO JSON (por metrica) — #159 ARCA-COUNT-001',
    'fonte: ' + ARQ_JSON,
    'sha256: ' + k.sha256_json,
    '',
    'METRICA                                    DEFINICAO                                              VALOR',
    '-----------------------------------------  -----------------------------------------------------  -----'
  ];
  [
    ['regras_total', 'registros em regras', k.regras_total],
    ['rule_ids_unicos', 'rule_id distintos', k.rule_ids_unicos],
    ['regras_mapeadas', 'status MAPEADO (auditadas pelo Guardiao)', k.regras_mapeadas],
    ['regras_integradas', 'status INTEGRADO', k.regras_integradas],
    ['regras_nao_aplicaveis', 'status NAO_APLICAVEL', k.regras_nao_aplicaveis],
    ['regras_nao_auditaveis', 'status NAO_AUDITAVEL (cegas)', k.regras_nao_auditaveis],
    ['regras_sem_auditoria', 'regras_total - regras_mapeadas', k.regras_sem_auditoria_guardiao],
    ['codigos_diagnostico', 'soma de auditabilidade_guardiao.codigos', k.codigos_diagnostico],
    ['codigos_unicos', 'codigos distintos', k.codigos_diagnostico_unicos],
    ['regras_com_codigo', 'regras com ao menos 1 codigo', k.regras_com_codigo],
    ['porta_codigos', 'entradas de MAPA_DIAGNOSTICO_ARCA', k.porta_codigos],
    ['porta_rule_ids', 'rule_ids distintos na porta', k.porta_rule_ids],
    ['regras_fora_da_porta', 'regras_total - porta_rule_ids', k.regras_sem_regra_na_porta],
    ['campos_por_regra', 'campos por regra no JSON (padrao)', k.campos_por_regra],
    ['campos_por_regra_uniao', 'uniao de campos declarados', k.campos_por_regra_uniao],
    ['fontes_canonicas', 'CANONICAL_SOURCE_CONFIRMED', k.fontes_canonicas],
    ['fontes_internas', 'INTERNAL_SOURCE_CONFIRMED', k.fontes_internas],
    ['fontes_desconhecidas', 'DOMAIN_RULE_SOURCE_UNKNOWN', k.fontes_desconhecidas],
    ['subdominios', 'subdominio distintos', k.subdominios],
    ['categorias', 'categoria distintas', k.categorias]
  ].forEach(([nome, def, valor]) => linhas.push(nome.padEnd(42) + ' ' + String(def).padEnd(53) + ' ' + String(valor).padStart(5)));
  linhas.push('', 'POR SUBDOMINIO');
  Object.entries(medido.porSubdominio).sort((a, b) => b[1] - a[1]).forEach(([s, n]) => linhas.push('  ' + s.padEnd(20) + String(n).padStart(3)));
  linhas.push('', 'POR CATEGORIA (' + k.categorias + ')');
  Object.entries(medido.porCategoria).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).forEach(([c, n]) => linhas.push('  ' + c.padEnd(30) + String(n).padStart(3)));
  linhas.push('', 'POR TIPO');
  Object.entries(medido.porTipo).sort((a, b) => b[1] - a[1]).forEach(([t, n]) => linhas.push('  ' + t.padEnd(30) + String(n).padStart(3)));
  linhas.push('');
  return linhas.join('\n');
}

// ---------------------------------------------------------------------------
// 7. APLICACAO
// ---------------------------------------------------------------------------

function lerArquivo(rel) { return fs.readFileSync(path.join(RAIZ, rel), 'utf8'); }
function gravarArquivo(rel, conteudo) { fs.writeFileSync(path.join(RAIZ, rel), conteudo, 'utf8'); }

export function aplicar(medido, opcoes = {}) {
  const sha = medido.metricas.sha256_json;
  const escritos = [];
  const ausentes = [];

  ARQUIVOS_INTEIROS.forEach(({ arquivo, gerar }) => {
    gravarArquivo(arquivo, gerar(medido));
    escritos.push(arquivo);
  });

  const porArquivo = new Map();
  BLOCOS.forEach(({ marcador, arquivo, gerar }) => {
    if (!porArquivo.has(arquivo)) porArquivo.set(arquivo, lerArquivo(arquivo));
    const atual = porArquivo.get(arquivo);
    const novo = escreverBloco(atual, marcador, gerar(medido), sha);
    if (novo === null) { ausentes.push(arquivo + ' (' + marcador + ')'); return; }
    porArquivo.set(arquivo, novo);
  });
  porArquivo.forEach((conteudo, arquivo) => { gravarArquivo(arquivo, conteudo); escritos.push(arquivo); });

  SUBSTITUICOES.forEach((s) => {
    const atual = lerArquivo(s.arquivo);
    const novo = atual.replace(s.regex, s.gerar(medido));
    if (novo !== atual) { gravarArquivo(s.arquivo, novo); escritos.push(s.arquivo); }
  });

  // canvas do modulo: no de metricas derivadas
  const canvas = JSON.parse(lerArquivo(ARQ_CANVAS_MOD));
  const texto = textoCanvas(medido);
  const existente = canvas.nodes.find((n) => n.id === 'arca-metricas');
  if (existente) { existente.text = texto; }
  else {
    canvas.nodes.push({ id: 'arca-metricas', x: 0, y: 520, width: 700, height: 190, type: 'text', text: texto });
  }
  gravarArquivo(ARQ_CANVAS_MOD, JSON.stringify(canvas, null, 2));
  escritos.push(ARQ_CANVAS_MOD);

  gravarArquivo('scripts/downplant/arca_metricas_derivadas.json', snapshotJson(medido));
  escritos.push('scripts/downplant/arca_metricas_derivadas.json');

  if (opcoes.espelho) {
    const esp = aplicarEspelho(medido);
    escritos.push(...esp.escritos);
    esp.pulados.forEach((p) => console.log('  (espelho pulado: ' + p + ')'));
  }
  return { escritos: [...new Set(escritos)], ausentes };
}

// --- espelho (Obsidian) -----------------------------------------------------
// Regra D1 (#158): o REPO/GIT e canonico; o espelho deriva.
//  - COPIA PURA: arquivos do espelho byte-identicos ao HEAD do repo -> recebem a versao nova verbatim.
//  - DIVERGENTE: arquivos com conteudo proprio do espelho (preservados no #158) -> NAO sao
//    sobrescritos; neles apenas as contagens antigas sao trocadas pelo valor derivado.
//  - LEITURA: espelhos somente-leitura de arquivos do repo (cabecalho + conteudo verbatim).
const ESPELHO_COPIA_PURA = [
  '02_Comodos/C03_Dominio/00_Visao_Do_Comodo/CIR-C03_DOMINIO.canvas',
  '02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO/CIR-MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO.canvas',
  '02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO/submodulos/SUB-C03-02-01_CATALOGO_DE_REGRAS/CIR-SUB-C03-02-01_CATALOGO_DE_REGRAS.canvas',
  '02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO/submodulos/SUB-C03-02-01_CATALOGO_DE_REGRAS/NOTA_DE_RESPONSABILIDADE.md',
  '02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO/submodulos/SUB-C03-02-04_ADAPTADOR_PORTA_DE_CONSULTA/CIR-SUB-C03-02-04_ADAPTADOR_PORTA_DE_CONSULTA.canvas',
  '02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO/submodulos/SUB-C03-02-04_ADAPTADOR_PORTA_DE_CONSULTA/NOTA_DE_RESPONSABILIDADE.md',
  '02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-01_FORMULARIO_E_MENUS/submodulos/SUB-C01-01-01_OCR_E_CONFERENCIA/AUDITORIA_OCR_ARCA.md'
];

const ESPELHO_LEITURA = [
  [ARQ_REGRAS, '07_Codigo_Leitura/Dominio/ARCA/ARCA_REGRAS_DOMINIO.md', 'Dominio/ARCA/ARCA_REGRAS_DOMINIO.md'],
  [ARQ_COBERTURA, '07_Codigo_Leitura/Dominio/ARCA/ARCA_COBERTURA.md', 'Dominio/ARCA/ARCA_COBERTURA.md']
];

function aplicarEspelho(medido) {
  const escritos = [];
  const pulados = [];
  const sha = medido.metricas.sha256_json;

  ESPELHO_COPIA_PURA.forEach((rel) => {
    const origem = path.join(RAIZ, rel);
    const destino = path.join(ESPELHO, rel);
    if (!fs.existsSync(origem) || !fs.existsSync(path.dirname(destino))) { pulados.push(rel + ' (ausente)'); return; }
    fs.writeFileSync(destino, fs.readFileSync(origem));
    escritos.push('ESPELHO: ' + rel);
  });

  ESPELHO_LEITURA.forEach(([origemRel, destinoRel, caminhoReal]) => {
    const conteudo = fs.readFileSync(path.join(RAIZ, origemRel), 'utf8');
    const destino = path.join(ESPELHO, destinoRel);
    if (!fs.existsSync(path.dirname(destino))) { pulados.push(destinoRel + ' (ausente)'); return; }
    const cabecalho = [
      '# ' + path.basename(caminhoReal),
      '',
      '> [!NOTE] Espelho de Leitura Unidirecional',
      '> - **Caminho Real no Repositório:** `' + caminhoReal + '`',
      '> - **Endereço Canônico Down Plant:** [MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO](../../../02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO/NOTA_DE_RESPONSABILIDADE.md)',
      '> - **SHA-256 do repo:** `' + sha + '`',
      '> - **Aviso:** Arquivo estritamente somente-leitura gerado para inspeção no Obsidian. Alterações não sincronizam de volta ao repositório.',
      '',
      conteudo
    ].join('\n');
    fs.writeFileSync(destino, cabecalho, 'utf8');
    escritos.push(destinoRel);
  });

  return { escritos, pulados };
}

// ---------------------------------------------------------------------------
// 8. CLI
// ---------------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);
  const medido = calcularMetricas();
  const erros = validarMetricas(medido);

  if (args.includes('--json')) {
    process.stdout.write(JSON.stringify(montarPayload(medido), null, 2) + '\n');
    if (erros.length) process.exit(2);
    return;
  }

  if (args.includes('--aplicar')) {
    const r = aplicar(medido, { espelho: args.includes('--espelho') });
    console.log('Aplicado (derivado do JSON) — sha256 ' + medido.metricas.sha256_json);
    console.log('Arquivos escritos (' + r.escritos.length + '):');
    r.escritos.forEach((f) => console.log('  - ' + f));
    if (r.ausentes.length) {
      console.error('MARCADOR AUSENTE (nada aplicado nesses):');
      r.ausentes.forEach((f) => console.error('  ! ' + f));
      process.exit(3);
    }
    if (erros.length) { erros.forEach((e) => console.error('ERRO DE MEDICAO: ' + e)); process.exit(2); }
    return;
  }

  process.stdout.write(textoSaida(medido));
  if (erros.length) { erros.forEach((e) => console.error('ERRO DE MEDICAO: ' + e)); process.exit(2); }
}

const executadoDiretamente = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (executadoDiretamente) main();
