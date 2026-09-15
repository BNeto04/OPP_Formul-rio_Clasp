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
 *   - C2 = `NAO_MENSURAVEL` + `causa = AUSENCIA_DE_FONTE_CANONICA_DE_ESTADO_DE_AUDITORIA` enquanto não
 *     existir fonte canônica legível por máquina do estado das Auditorias (§7.4);
 *   - C3 = `PENDENTE` até o Proprietário confirmar explicitamente a visão geral restabelecida
 *     (autorização para construir o gate NÃO é confirmação);
 *   - identidade canônica é ENDEREÇO/ID/RELAÇÃO DECLARADA. Nome normalizado só serve como DIAGNÓSTICO
 *     (`FALLBACK_POR_NOME`) e NUNCA transforma correspondência incerta em PASS;
 *   - qualquer rejeição real mantém `GATE_GLOBAL = VERMELHO`.
 *
 * SEPARAÇÃO POR NATUREZA (Planner, 15/09/2026 — "não transformar 22 em 22 tarefas por reflexo").
 * BALDES DISJUNTOS (soma = pendências medidas), com prioridade NESTA ordem:
 *   1. NAO_APLICAVEL     artefato declarado não existe mais (retirado)          → NÃO conta
 *   2. DONO_CONSUMIDOR   artefato declarado por 2+ Módulos (dono não escolhido) → NÃO conta; o caso carrega a natureza
 *   3. HOMOLOGACAO_INFRA Módulo C08 (homologação) ou área no .claspignore       → NÃO conta (ontologia a decidir)
 *   4. IDENTIDADE        espelho do arquivo real existe, mas a cápsula declara sem caminho/nome não idêntico → CONTA
 *   5. ALOCACAO          espelho do arquivo real existe declarando OUTRO Módulo → CONTA
 *   6. PRODUTO           código de produto sem espelho rico                      → CONTA
 * VISÃO `cartografia` = IDENTIDADE + ALOCACAO (inclui os casos de alocação que moram em DONO_CONSUMIDOR).
 * ESTRUTURA_MODULO (Módulo sem a cápsula §40.5) é REPORTADO e não pontua: não é requisito do §21.2.
 *
 * RECONCILIAÇÃO DA OBRIGAÇÃO DA CÁPSULA (read-only, 15/09/2026):
 *   §40.5 ("Cápsula") exibe a árvore do Módulo COM `MOD-CXX-NN_NOME.md` e o ESTRUTURA_DO_COFRE.md declara
 *   `padrao_de_modulo: DP-MODULE-1`; §40.6 exige materialização proporcional ao perfil; §21.2 NÃO cita
 *   cápsula em nenhuma das três condições. A lista "Módulos e Submódulos" do manifesto NÃO é exaustiva
 *   (omite também `dependencias/`, que §40.5/§31.6 exigem). Veredito: a cápsula FAZ PARTE do padrão do
 *   Módulo, mas NÃO é requisito do critério de retomada — reportada, não pontuada no C1.
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

export const VEREDITO_CAPSULA = {
  veredito: 'PADRAO_DO_MODULO_NAO_REQUISITO_21.2',
  pergunta: 'a cápsula MOD-*.md é requisito obrigatório, recomendado ou apenas uma forma possível?',
  resposta: 'Faz parte do PADRÃO do Módulo (§40.5 / DP-MODULE-1), com materialização proporcional ao perfil '
    + '(§40.6), e NÃO é requisito de nenhuma das três condições do critério de retomada (§21.2).',
  contradicao_canonica: false,
  fontes: [
    '§40.5 Cápsula — a árvore do Módulo inclui MOD-CXX-NN_NOME.md (o título da própria seção é "Cápsula")',
    '§40.7 Manifesto — padrao_de_modulo: DP-MODULE-1',
    '§40.6 Materialização proporcional — P0 compacto … P3 formal; "não criar documentos vazios para aparentar conformidade"',
    '§8.4 Módulo — responsabilidade, contrato, fluxo, código, testes, evidências (não nomeia documento)',
    'ESTRUTURA_DO_COFRE.md — a lista de conteúdo do Módulo OMITE a cápsula; lista NÃO exaustiva (omite também dependencias/)',
    '§21.2 — as três condições falam em espelho rico (§21.1), Auditoria (§7.4) e confirmação do Proprietário; não citam cápsula',
    'lint-estrutura.mjs — valida taxonomia/nomes; não exige MOD-*.md (por isso os 4 Módulos sem cápsula passam no lint)',
  ],
};

// ---------------------------------------------------------------------------
// leitura da Planta (declarado, nunca inventado)
// ---------------------------------------------------------------------------

function normalizarCaminho(p) {
  return String(p).replace(/\\/g, '/').replace(/^\.\//, '').trim().toLowerCase();
}

/** Chave de BASENAME apenas para DIAGNÓSTICO (sem acento, sem travessão, minúsculo). */
function chaveDiagnostica(p) {
  return String(p).replace(/\\/g, '/').split('/').pop().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2013\u2014]/g, '-').replace(/[^a-z0-9.]/gi, '').toLowerCase();
}

/** ID curto do Módulo (MOD-CXX-NN) a partir de um nome de diretório/endereço declarado. */
function modDe(s) {
  return (String(s || '').match(/MOD-C\d{2}-\d{2}/) || [null])[0];
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

/** Índice dos arquivos VIVOS do repositório (resolver o caminho real de um artefato declarado). */
function indexarArquivos() {
  const out = [];
  const andar = (dir) => {
    for (const nome of fs.readdirSync(dir).sort()) {
      if (['.git', 'node_modules', '__pycache__'].indexOf(nome) !== -1) continue;
      const p = path.join(dir, nome);
      if (fs.statSync(p).isDirectory()) { andar(p); continue; }
      out.push(path.relative(REPO, p).replace(/\\/g, '/'));
    }
  };
  andar(REPO);
  return out;
}

/** Padrões DECLARADOS no .claspignore (o que está fora do produto publicado). */
function padroesClaspignore() {
  const p = path.join(REPO, '.claspignore');
  if (!fs.existsSync(p)) return [];
  return fs.readFileSync(p, 'utf8').split(/\r?\n/)
    .map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
}

function ignoradoNoClasp(artefato, padroes) {
  const alvo = String(artefato).replace(/\\/g, '/');
  return padroes.some((r) => {
    const rx = '^' + r.replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*\*/g, '\u0000').replace(/\*/g, '[^/]*').replace(/\u0000/g, '.*') + '$';
    return new RegExp(rx).test(alvo);
  });
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

// ---------------------------------------------------------------------------
// C1 — todo Módulo ativo possui espelho rico vinculado ao código real, sem pendência
// ---------------------------------------------------------------------------

function medirCondicao1() {
  const espelhos = indexarEspelhos();
  const arquivos = indexarArquivos();
  const padroes = padroesClaspignore();
  const modulos = listarModulos();

  // quem DECLARA cada artefato (todas as cápsulas) — base da distinção DONO × CONSUMIDOR
  const declaradoPor = new Map();
  for (const { modulo, dir } of modulos) {
    const cap = path.join(dir, `${modulo}.md`);
    if (!fs.existsSync(cap)) continue;
    for (const t of artefatosDeclarados(cap) || []) {
      const k = normalizarCaminho(t);
      if (!declaradoPor.has(k)) declaradoPor.set(k, []);
      const lista = declaradoPor.get(k);
      if (!lista.includes(modulo)) lista.push(modulo);
    }
  }

  /** Caminho REAL do artefato declarado (a cápsula pode declarar sem caminho). */
  function resolverReal(artefato) {
    const alvo = normalizarCaminho(artefato);
    const exato = arquivos.find((a) => normalizarCaminho(a) === alvo);
    if (exato) return exato;
    const kb = chaveDiagnostica(artefato);
    const cands = arquivos.filter((a) => chaveDiagnostica(a) === kb);
    if (cands.length === 1) return cands[0];
    return cands.find((a) => normalizarCaminho(a).endsWith('/' + alvo)) || cands[0] || null;
  }

  const comodos = {};
  const fallbacksPorNome = [];
  const baldes = {
    NAO_APLICAVEL: { total: 0, itens: [] },
    HOMOLOGACAO_INFRA: { total: 0, aplicabilidade: 'A_DECIDIR', itens: [],
      nota: 'Módulo MOD-C08-01 (homologação) ou área declarada no .claspignore. O §21.2 fala em Módulo ATIVO; '
        + 'a aplicabilidade da obrigação de espelho rico a bancada/infra NÃO está decidida — separado do placar de produto.' },
    DONO_CONSUMIDOR: { total: 0, casos: [], casos_unicos: 0,
      nota: 'Artefato declarado por 2+ Módulos. Este instrumento NÃO escolhe dono (distinção DONO × CONSUMIDOR é do #176).' },
    IDENTIDADE: { total: 0, itens: [] },
    ALOCACAO: { total: 0, itens: [] },
    PRODUTO: { total: 0, itens: [] },
  };
  const estruturaModulo = { total: 0, modulos: [], reconciliacao: VEREDITO_CAPSULA,
    nota: 'Módulo sem a cápsula do §40.5. NÃO é requisito do §21.2 (que pede espelho rico): reportado, não pontuado no C1.' };
  let codigoTotal = 0, cobertos = 0, pendentesDeCodigo = 0, modulosSemCapsula = 0;

  for (const { comodo, modulo, dir } of modulos) {
    if (!comodos[comodo]) comodos[comodo] = { comodo, status_legado: 'NAO_DECLARADO', modulos: [] };
    const capsula = path.join(dir, `${modulo}.md`);
    const reg = { modulo, capsula: fs.existsSync(capsula), codigo_total: 0, cobertos: [], pendentes: [], nao_exigem_espelho: [] };

    if (!reg.capsula) {
      modulosSemCapsula++;
      estruturaModulo.modulos.push(modulo);
      estruturaModulo.total++;
      comodos[comodo].modulos.push(reg);
      continue;
    }

    const arts = artefatosDeclarados(capsula) || [];
    for (const artefato of arts) {
      const classe = classificar(artefato);
      if (classe !== 'CODIGO') { reg.nao_exigem_espelho.push({ artefato, classe }); continue; }
      reg.codigo_total++; codigoTotal++;
      const alvo = normalizarCaminho(artefato);
      const meuId = modDe(modulo);

      // identidade canônica: ENDEREÇO DECLARADO aponta o Módulo E ORIGEM DECLARADA é o artefato
      const exato = espelhos.find((e) => e.endereco && e.origem
        && modDe(e.endereco) === meuId
        && normalizarCaminho(e.origem) === alvo);
      if (exato) { reg.cobertos.push({ artefato, espelho: exato.espelho }); cobertos++; continue; }

      // diagnóstico (NUNCA cobertura): espelho de origem igual em outro endereço / nome equivalente
      const porNome = espelhos.find((e) => e.origem && normalizarCaminho(e.origem) === alvo);
      const diverge = porNome ? { artefato, espelho: porNome.espelho, endereco: porNome.endereco,
        motivo: 'espelho declara ORIGEM igual, mas ENDEREÇO em outro Módulo (declaração divergente)' }
        : (() => { const ch = chaveDiagnostica(artefato); const perto = espelhos.find((e) => e.origem && chaveDiagnostica(e.origem) === ch);
            return perto ? { artefato, espelho: perto.espelho, endereco: perto.endereco,
              motivo: 'sem espelho com endereço neste Módulo; existe espelho de nome equivalente em outro endereço (texto não idêntico)' } : null; })();
      if (diverge) fallbacksPorNome.push(diverge);

      // ---- separação por NATUREZA (prioridade: NAO_APLICAVEL → HOMOLOGACAO → DONO_CONSUMIDOR → IDENTIDADE → ALOCACAO → PRODUTO) ----
      const real = resolverReal(artefato);
      const espelhoDoReal = real ? espelhos.find((e) => e.origem && normalizarCaminho(e.origem) === normalizarCaminho(real)) : null;
      const modEndereco = espelhoDoReal ? modDe(espelhoDoReal.endereco) : null;
      const declarantes = declaradoPor.get(alvo) || [modulo];
      let balde, motivoBalde;

      if (!real) {
        balde = 'NAO_APLICAVEL';
        baldes.NAO_APLICAVEL.total++;
        baldes.NAO_APLICAVEL.itens.push({ artefato, modulo, motivo: 'artefato declarado não existe no repositório (retirado) — declaração obsoleta' });
        motivoBalde = 'artefato não existe no repositório (retirado)';
      } else if (declarantes.length > 1) {
        // DONO × CONSUMIDOR vem ANTES de HOMOLOGACAO: se o artefato é declarado por 2+ Módulos,
        // a pergunta relevante é QUEM É O DONO (ex.: GuardiaoHeadless em C05-01 e C08-01).
        balde = 'DONO_CONSUMIDOR';
        baldes.DONO_CONSUMIDOR.total++;
        const natureza = espelhoDoReal ? (modEndereco !== meuId ? 'ALOCACAO' : 'IDENTIDADE') : 'AUSENCIA_MATERIAL';
        const caso = baldes.DONO_CONSUMIDOR.casos.find((c) => normalizarCaminho(c.artefato) === alvo);
        if (caso) caso.pendencias++; else baldes.DONO_CONSUMIDOR.casos.push({ artefato, modulos: declarantes.slice(), pendencias: 1, natureza, dono_escolhido: null });
        motivoBalde = `artefato declarado por ${declarantes.length} Módulos (${declarantes.join(', ')}) — dono NÃO escolhido por este instrumento`;
      } else if (meuId === 'MOD-C08-01' || ignoradoNoClasp(real, padroes)) {
        balde = 'HOMOLOGACAO_INFRA';
        baldes.HOMOLOGACAO_INFRA.total++;
        baldes.HOMOLOGACAO_INFRA.itens.push({ artefato, modulo, real,
          motivo: meuId === 'MOD-C08-01' ? 'declarado pelo Módulo de homologação (MOD-C08-01)'
            : 'área declarada no .claspignore (fora do produto publicado)' });
        motivoBalde = 'bancada/infra — aplicabilidade a decidir';
      } else if (declarantes.length > 1) {
        balde = 'DONO_CONSUMIDOR';
        baldes.DONO_CONSUMIDOR.total++;
        const natureza = espelhoDoReal ? (modEndereco !== meuId ? 'ALOCACAO' : 'IDENTIDADE') : 'AUSENCIA_MATERIAL';
        const caso = baldes.DONO_CONSUMIDOR.casos.find((c) => normalizarCaminho(c.artefato) === alvo);
        if (caso) caso.pendencias++; else baldes.DONO_CONSUMIDOR.casos.push({ artefato, modulos: declarantes.slice(), pendencias: 1, natureza, dono_escolhido: null });
        motivoBalde = `artefato declarado por ${declarantes.length} Módulos (${declarantes.join(', ')}) — dono NÃO escolhido por este instrumento`;
      } else if (espelhoDoReal && modEndereco !== meuId) {
        balde = 'ALOCACAO';
        baldes.ALOCACAO.total++;
        baldes.ALOCACAO.itens.push({ artefato, modulo, real, espelho: espelhoDoReal.espelho, endereco_declarado: espelhoDoReal.endereco,
          modulo_do_endereco: modEndereco, motivo: `espelho declara ${modEndereco}; quem declara o artefato é ${modulo}` });
        motivoBalde = `espelho declara ${modEndereco}; quem declara é o Módulo atual — alocação divergente`;
      } else if (espelhoDoReal) {
        balde = 'IDENTIDADE';
        baldes.IDENTIDADE.total++;
        baldes.IDENTIDADE.itens.push({ artefato, modulo, real, espelho: espelhoDoReal.espelho,
          motivo: `cápsula declara "${artefato}"; arquivo real é "${real}" — identidade da declaração não fecha` });
        motivoBalde = 'identidade da declaração não fecha (cápsula sem caminho/nome não idêntico)';
      } else {
        balde = 'PRODUTO';
        baldes.PRODUTO.total++;
        baldes.PRODUTO.itens.push({ artefato, modulo, real, motivo: 'código de produto sem espelho rico' });
        motivoBalde = 'código de produto sem espelho rico';
      }

      reg.pendentes.push({ artefato, classe, balde, motivo: diverge ? diverge.motivo : (motivoBalde || 'nenhum espelho rico declara este código'), motivo_balde: motivoBalde });
      pendentesDeCodigo++;
    }
    comodos[comodo].modulos.push(reg);
  }
  baldes.DONO_CONSUMIDOR.casos_unicos = baldes.DONO_CONSUMIDOR.casos.length;

  // VISÃO cartografia = IDENTIDADE + ALOCACAO (inclusive a alocação que mora em DONO_CONSUMIDOR)
  const alocacaoEmDono = baldes.DONO_CONSUMIDOR.casos.filter((c) => c.natureza === 'ALOCACAO')
    .reduce((n, c) => n + c.pendencias, 0);
  const cartografia = {
    total: baldes.IDENTIDADE.total + baldes.ALOCACAO.total + alocacaoEmDono,
    subtipos: { IDENTIDADE: baldes.IDENTIDADE.total, ALOCACAO: baldes.ALOCACAO.total + alocacaoEmDono },
    observacao: 'Visão (não balde): soma IDENTIDADE + ALOCACAO, incluindo os casos de alocação que ficam em DONO_CONSUMIDOR '
      + 'por serem artefatos declarados por mais de um Módulo.',
  };

  const contamNoVeredito = baldes.PRODUTO.total + baldes.IDENTIDADE.total + baldes.ALOCACAO.total;

  return {
    valor: contamNoVeredito === 0 ? 'VERDE' : 'VERMELHO',
    regra: '§21.2/1 — todo Módulo ativo possui espelho rico vinculado ao código real, sem pendência conhecida. '
      + 'Identidade por ID DO MÓDULO no ENDEREÇO DECLARADO + ORIGEM DECLARADA no espelho (§46.15). '
      + 'Contam no veredito: PRODUTO + IDENTIDADE + ALOCACAO. '
      + 'NÃO contam: HOMOLOGACAO_INFRA (ontologia a decidir), DONO_CONSUMIDOR (dono não escolhido), NAO_APLICAVEL (retirado). '
      + 'ESTRUTURA_MODULO (cápsula §40.5) é reportado e NÃO pontua: não é requisito do §21.2.',
    medido: { modulos: modulos.length, modulos_sem_capsula: modulosSemCapsula,
      artefatos_de_codigo: codigoTotal, cobertos_por_endereco_declarado: cobertos, pendentes: pendentesDeCodigo,
      contam_no_veredito: contamNoVeredito },
    separacao: { baldes, cartografia, estrutura_modulo: estruturaModulo },
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
    causa: 'AUSENCIA_DE_FONTE_CANONICA_DE_ESTADO_DE_AUDITORIA',
    natureza: 'LACUNA_DE_GOVERNANCA',
    motivo: 'não existe fonte canônica legível por máquina do estado das Auditorias (§7.4) — lacuna de governança, '
      + 'não dívida estrutural. '
      + `Busca por ${estados.join('/')} em todo o repositório = ${comEstado.length} ocorrência(s). `
      + 'Documentos encontrados são históricos e sem estado canônico. Não inferir: a casa do estado de Auditoria ainda não foi decidida.',
    fontes_procuradas: raizes.map((r) => path.relative(REPO, r).replace(/\\/g, '/')),
    ocorrencias_de_estado: comEstado.length,
    documentos_historicos_encontrados: historicos.filter((h) => !h.startsWith('COM_ESTADO:')).slice(0, 20),
    candidatos_avaliados_e_descartados: [
      'Dominio/ARCA/arca_regras_dominio.json — auditabilidade por REGRA, não por Cômodo',
      'Core/CoberturaAuditoria.js / Render/RendererAuditoria*.js — produtores/visões de auditoria de DADOS',
      'agentic/state/*AUDITORIA* — fila/remediação históricas de 12/09 (sem estado canônico nem ciclo de vida)',
      'planilha operacional, abas [AUDITORIA] — auditoria de DADOS, não de Cômodo',
    ],
  };
}

// ---------------------------------------------------------------------------
// C3 — confirmação explícita do Proprietário (literal)
// ---------------------------------------------------------------------------

const REGISTRO_CONFIRMACAO = path.join(REPO, '02_Comodos', 'C00_Governanca_Estrutural', '03_Especificacoes', 'CONFIRMACAO_PROPRIETARIO_21_2.md');

function medirCondicao3() {
  const rel = path.relative(REPO, REGISTRO_CONFIRMACAO).replace(/\\/g, '/');
  if (!fs.existsSync(REGISTRO_CONFIRMACAO)) {
    return { valor: 'PENDENTE', fonte: null, fonte_arquivo: null, ressalvas: [],
      motivo: 'depende de confirmacao explicita do Proprietario de que a visao geral foi restabelecida (21.2/3). '
        + 'Nao existe registro declarado (' + rel + '). Autorizacao para construir o instrumento NAO e confirmacao.' };
  }
  const texto = fs.readFileSync(REGISTRO_CONFIRMACAO, 'utf8');
  const campo = (nome) => (texto.match(new RegExp('^\\*\\*' + nome + ':\\*\\*\\s*(.+)$', 'm')) || [])[1] || null;
  const status = campo('Status');
  const ressalvas = (campo('Ressalvas') || '').split(';').map((s) => s.trim()).filter(Boolean);
  if (status !== 'CONFIRMADO') {
    return { valor: 'PENDENTE', fonte: null, fonte_arquivo: rel, ressalvas,
      motivo: 'registro declarado existe (' + rel + ") mas o Status e '" + status + "' - nao e confirmacao valida" };
  }
  return { valor: 'CONFIRMADO', fonte_arquivo: rel,
    fonte: rel + ' - Proprietario: ' + (campo('Proprietário') || campo('Proprietario')) + '; data ' + campo('Data') + '; card ' + campo('Card'),
    ressalvas,
    motivo: 'confirmacao explicita do Proprietario registrada em arquivo declarado; NAO transforma C2 em mensuravel e NAO fecha o card.' };
}

// ---------------------------------------------------------------------------
// §38 — métricas de catch-up estrutural
// ---------------------------------------------------------------------------

function medirMetricas38(c1, comodosComPendencia) {
  const handoffYaml = path.join(REPO, '08_Execucao_Ao_Vivo', 'downplant_handoff.yaml');
  let declaraCatchup = false;
  if (fs.existsSync(handoffYaml)) declaraCatchup = /catch-?up/i.test(fs.readFileSync(handoffYaml, 'utf8'));
  const b = c1.separacao.baldes;
  return {
    modulos_ativos_com_espelho_pendente: {
      valor: comodosComPendencia,
      detalhe: { modulos_com_pendencia_de_produto_cartografia: comodosComPendencia,
        modulos_sem_capsula_advisory: c1.medido.modulos_sem_capsula,
        homologacao_infra: b.HOMOLOGACAO_INFRA.total, dono_consumidor_casos: b.DONO_CONSUMIDOR.casos_unicos,
        nao_aplicavel: b.NAO_APLICAVEL.total },
    },
    auditorias_com_rejeicao_em_aberto: { valor: 'NAO_MENSURAVEL', causa: 'AUSENCIA_DE_FONTE_CANONICA_DE_ESTADO_DE_AUDITORIA',
      natureza: 'LACUNA_DE_GOVERNANCA', motivo: 'mesma ausência de fonte canônica da Condição 2' },
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
  const conta = (p) => p.balde === 'PRODUTO' || p.balde === 'IDENTIDADE' || p.balde === 'ALOCACAO';
  const velho = Object.entries(c1base.comodos).filter(([, v]) =>
    v.modulos.some((m) => m.pendentes.some(conta))).map(([k]) => k);
  const c1 = { valor: c1base.valor, regra: c1base.regra, medido: c1base.medido, separacao: c1base.separacao,
    fallbacks_por_nome: c1base.fallbacks_por_nome, comodos_afetados_por_pendencia: velho.length };
  const c2 = medirCondicao2();
  const c3 = medirCondicao3();
  const metricas = medirMetricas38(c1base, velho.length);

  // motivo do vermelho global: declarado, nunca implicito
  const motivosBloqueio = [];
  if (c1base.valor !== 'VERDE') motivosBloqueio.push('C1: ' + c1base.valor + ' (' + c1base.medido.contam_no_veredito + ' pendencia(s) que contam)');
  if (c2.valor !== 'VERDE') motivosBloqueio.push('C2: ' + c2.valor + ' - ' + c2.natureza);
  if (c3.valor !== 'CONFIRMADO') motivosBloqueio.push('C3: ' + c3.valor);

  const placar = {
    card: '#170 (DP24-007)',
    instrumento: 'scripts/downplant/gate-retomada.mjs',
    medido_em: new Date().toISOString().slice(0, 10),
    gate_global: motivosBloqueio.length === 0 ? 'VERDE' : 'VERMELHO',
    gate_global_motivo: motivosBloqueio,
    condicao_1: c1,
    condicao_2: c2,
    condicao_3: c3,
    capsula: VEREDITO_CAPSULA,
    metricas_38: metricas,
    comodos: Object.values(c1base.comodos).map((c) => ({
      comodo: c.comodo,
      status_legado: c.status_legado,
      modulos: c.modulos.map((m) => ({ modulo: m.modulo, capsula: m.capsula,
        codigo_total: m.codigo_total, cobertos: m.cobertos.length, pendentes: m.pendentes })),
      veredito: c.modulos.some((m) => m.pendentes.some(conta)) ? 'VERMELHO' : 'VERDE',
      veredito_estrutural: c.modulos.some((m) => !m.capsula) ? 'CAPSULA_AUSENTE' : 'OK',
    })),
    comodos_afetados_por_pendencia: velho,
    artefatos_cobertos: Object.values(c1base.comodos).flatMap((c) => c.modulos.flatMap((m) => m.cobertos.map((x) => x.artefato))),
  };
  return placar;
}

function imprimirHumano(p) {
  const b = p.condicao_1.separacao.baldes;
  const cg = p.condicao_1.separacao.cartografia;
  const em = p.condicao_1.separacao.estrutura_modulo;
  const L = [];
  L.push('====================================================');
  L.push('GATE DE RETOMADA DE FATIA DE PRODUTO (§21.2) — card #170');
  L.push(`medido em ${p.medido_em} · instrumento ${p.instrumento}`);
  L.push('====================================================');
  L.push('');
  L.push(`GATE_GLOBAL = ${p.gate_global}`);
  L.push('');
  L.push('--- C1 por natureza (baldes disjuntos: a soma fecha com as pendências medidas) ---');
  L.push(`C1-PRODUTO          = ${b.PRODUTO.total}   ausência material real de espelho em código de produto      [CONTA]`);
  L.push(`C1-CARTOGRAFIA      = ${cg.total}   (IDENTIDADE=${cg.subtipos.IDENTIDADE} + ALOCACAO=${cg.subtipos.ALOCACAO}) — vínculo declarado não fecha   [CONTA]`);
  L.push(`C1-HOMOLOGACAO      = ${b.HOMOLOGACAO_INFRA.total}   aplicável/N/A ainda a decidir   [NÃO conta]`);
  L.push(`C1-DONO×CONSUMIDOR  = ${b.DONO_CONSUMIDOR.casos_unicos} caso(s) em ${b.DONO_CONSUMIDOR.total} ocorrência(s)   [NÃO conta: dono não escolhido]`);
  L.push(`C1-NAO_APLICAVEL    = ${b.NAO_APLICAVEL.total}   [NÃO conta]`);
  L.push(`C1 (veredito)       = ${p.condicao_1.valor}   (contam: ${p.condicao_1.medido.contam_no_veredito} de ${p.condicao_1.medido.pendentes} pendências)`);
  L.push('');
  L.push(`CÁPSULA = ${p.capsula.veredito}   (contradição canônica: ${p.capsula.contradicao_canonica ? 'SIM' : 'NÃO'})`);
  L.push(`   ${p.capsula.resposta}`);
  L.push(`   Módulos sem cápsula (advisory, fora do C1): ${em.modulos.join(', ') || '—'}`);
  L.push('');
  L.push(`C2 (Auditoria com rejeição em aberto) = ${p.condicao_2.valor} - ${p.condicao_2.natureza}`);
  L.push(`   causa = ${p.condicao_2.causa}`);
  L.push(`C3 (confirmação do Proprietário) = ${p.condicao_3.valor}` + (p.condicao_3.fonte_arquivo ? ` · registro: ${p.condicao_3.fonte_arquivo}` : ''));
  L.push('');
  L.push('--- PLACAR FINAL (§21.2) ---');
  L.push(`C1 = ${p.condicao_1.valor}`);
  L.push(`C2 = ${p.condicao_2.valor} - ${p.condicao_2.natureza}`);
  L.push(`C3 = ${p.condicao_3.valor}`);
  L.push(`GATE_GLOBAL = ${p.gate_global}` + (p.gate_global === 'VERMELHO'
    ? (p.gate_global_motivo.length === 1 ? ' exclusivamente por ' + String(p.gate_global_motivo[0]).split(':')[0]
      : ' | bloqueios: ' + p.gate_global_motivo.join(' · ')) : ''));
  L.push('');
  L.push(`módulos=${p.condicao_1.medido.modulos} · código declarado=${p.condicao_1.medido.artefatos_de_codigo}`
    + ` · cobertos=${p.condicao_1.medido.cobertos_por_endereco_declarado} · pendentes=${p.condicao_1.medido.pendentes}`);
  L.push('');
  L.push('--- por Cômodo (status legado declarado: ' + (p.comodos[0] ? p.comodos[0].status_legado : 'N/A') + ') ---');
  for (const c of p.comodos) {
    L.push(`${c.veredito.padEnd(9)} ${c.comodo}  (legado: ${c.status_legado}${c.veredito_estrutural === 'CAPSULA_AUSENTE' ? ' · cápsula ausente' : ''})`);
    for (const m of c.modulos) {
      const contam = m.pendentes.filter((x) => x.balde === 'PRODUTO' || x.balde === 'IDENTIDADE' || x.balde === 'ALOCACAO').length;
      L.push(`    ${contam === 0 ? 'OK      ' : 'PENDENTE'} ${m.modulo}  código=${m.codigo_total} cobertos=${m.cobertos} pendentes=${m.pendentes.length}${contam ? ` (contam: ${contam})` : ''}`);
      m.pendentes.filter((x) => x.balde === 'PRODUTO' || x.balde === 'IDENTIDADE' || x.balde === 'ALOCACAO')
        .slice(0, 3).forEach((x) => L.push(`              - [${x.balde}] ${x.artefato}: ${x.motivo_balde}`));
    }
  }
  if (b.DONO_CONSUMIDOR.casos.length) {
    L.push('');
    L.push('--- DONO × CONSUMIDOR (dono NÃO escolhido por este instrumento) ---');
    b.DONO_CONSUMIDOR.casos.forEach((c) => L.push(`    ${c.artefato} → ${c.modulos.join(' + ')} (${c.pendencias} ocorrência(s) · natureza: ${c.natureza})`));
  }
  if (b.HOMOLOGACAO_INFRA.itens.length) {
    L.push('');
    L.push('--- HOMOLOGACAO/INFRA (separado do placar de produto) ---');
    b.HOMOLOGACAO_INFRA.itens.forEach((i) => L.push(`    ${i.artefato} (${i.modulo}) — ${i.motivo}`));
  }
  if (b.NAO_APLICAVEL.itens.length) {
    L.push('');
    L.push('--- NAO_APLICAVEL (não conta) ---');
    b.NAO_APLICAVEL.itens.forEach((i) => L.push(`    ${i.artefato} (${i.modulo}) — ${i.motivo}`));
  }
  if (p.condicao_1.fallbacks_por_nome.length) {
    L.push('');
    L.push(`--- DIAGNÓSTICO: ${p.condicao_1.fallbacks_por_nome.length} correspondência(s) por nome equivalente (NÃO contam como cobertura) ---`);
    p.condicao_1.fallbacks_por_nome.slice(0, 8).forEach((f) => L.push(`    ! ${f.artefato} -> ${f.espelho} (${f.motivo})`));
  }
  L.push('');
  L.push('§38 — métricas de catch-up estrutural:');
  L.push(`    módulos com espelho pendente = ${p.metricas_38.modulos_ativos_com_espelho_pendente.valor}`);
  L.push(`    auditorias com rejeição em aberto = ${p.metricas_38.auditorias_com_rejeicao_em_aberto.valor}` +
    ` (causa: ${p.metricas_38.auditorias_com_rejeicao_em_aberto.causa})`);
  L.push(`    proporção catch-up × produto por Cômodo = ${p.metricas_38.proporcao_catchup_vs_produto_por_comodo.valor}`);
  L.push('');
  L.push('Este instrumento MEDE. Não corrige, não escreve e não infere estado a partir de nome de arquivo.');
  return L.join('\n');
}

const placar = calcular();
if (process.argv.includes('--json')) console.log(JSON.stringify(placar, null, 2));
else console.log(imprimirHumano(placar));
process.exit(placar.gate_global === 'VERDE' ? 0 : 1);
