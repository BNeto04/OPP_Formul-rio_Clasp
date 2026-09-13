# RESULT PROPOSTO — #159 (NAO POSTADO)

> Texto proposto para o RESULT do card #159. **Nao foi postado no GitHub** (proibido pelo comando do card).
> **Sem emoji**, conforme `NO_EMOJI_IN_OPERATIONAL_FLOW` (payload operacional): a redacao e ASCII; a unica
> nao-ASCII vem dos blocos de saida de teste/lint, colados verbatim.
> Pai logico: #57 / #154 · Autor: HERMES · Data: 2026-09-13.

---

[HERMES] RESULT — #159

**Card:** #159 (ARCA-COUNT-001 — Reconciliar contagens da ARCA em JSON, MD, inventario e circuito) · **Pai:** #57 / #154
**Repo canonico:** `syntheon-gs-downplant-offline` (branch `sprint/g01-guardiao-qualidade-live-001`, HEAD `6a2671a`)
**Espelho:** `Obsidian_Brain/Syntheon`
**Regra aplicada:** reconciliacao **por METRICA**, com **numero derivado** do JSON canonico (nunca digitado).
Nenhum codigo de produto (`.js`/`.html` de runtime) foi alterado. Sem commit, sem push, sem `clasp push`;
nada postado, fechado ou criado no GitHub.

---

## STATUS

**CONCLUIDO.** As contagens da ARCA deixaram de ser numero digitado: hoje sao a **medicao de campo** do
`Dominio/ARCA/arca_regras_dominio.json` (sha256 `f9c853d6…`) feita por um gerador versionado
(`scripts/downplant/contar-regras-arca.mjs`), publicadas com **metrica nomeada + definicao explicita**, e
protegidas por uma **fechadura** (`Testes/TestArcaContagemDerivada.js`, 15 testes) que fica **VERMELHA** se
qualquer lugar derivado divergir do JSON. O "total ARCA" ambiguo nao existe mais.

A fechadura **nasceu VERMELHA** (`RESULTADOS FINAIS: 1 PASS / 13 FAIL`) e ficou **VERDE**
(`RESULTADOS FINAIS: 15 PASS / 0 FAIL`) depois de a aplicacao derivada rodar.

**Metricas canonicas (por metrica, nunca colapsadas em um numero):**
`regras_total`=49 · `rule_ids_unicos`=49 · `regras_mapeadas`=33 · `regras_integradas`=8 ·
`regras_nao_aplicaveis`=8 · `regras_nao_auditaveis`=0 · `regras_sem_auditoria_guardiao`=16 ·
`codigos_diagnostico`=38 (38 distintos, em 30 regras) · `porta_codigos`→`porta_rule_ids`=38→30 ·
`regras_sem_regra_na_porta`=19 · `campos_por_regra`=23 (uniao 25) · fontes 12/35/2 · 19 subdominios ·
36 categorias.

---

## EVIDENCIA TIPADA — antes x depois (medido no disco, nao estimado)

| Item | Antes | Depois | Delta |
|---|---|---|---|
| `INVENTARIO_ARCA.md` — total de regras | 45 | **49** | +4 |
| `INVENTARIO_ARCA.md` — MAPEADO / INTEGRADO / NAO_APLICAVEL | 29 / 7 / 9 | **33 / 8 / 8** | +4 / +1 / -1 |
| `INVENTARIO_ARCA.md` — secoes de regras listadas | 45 | **49** | regerado do JSON |
| `ARCA_REGRAS_DOMINIO.md` — secao de metricas | bullets digitados, sem definicao | **bloco derivado** (metrica x definicao x valor + sha256 no marcador) | +78 linhas |
| `ARCA_COBERTURA.md` — bloco de metricas | inexistente | **bloco derivado** | novo |
| `ARCA_COBERTURA.md` — subdominio `VEICULOS` | `NAO_COBERTO` | **`COBERTO`** por `ARCA-VEICULO-001` (JSON) | reconciliado |
| Circuito `CIR-MOD-C03-02` — regras | 31 | **49** | +18 |
| Circuito — distribuicao por tipo | 9/17/1/2/2 | **10/31/1/2/5** | corrigido |
| Circuito — fontes | 11 canonicas/18 internas/2 desconhecidas | **12/35/2** | corrigido |
| Circuito — porta | 26 codigos -> 20 de 31 regras | **38 codigos -> 30 de 49 regras** | corrigido |
| Circuito — no de metricas | nao existia | **no `arca-metricas`** com o bloco derivado | novo |
| `CIR-C03_DOMINIO.canvas` | (31 regras) | **(49 regras)** | corrigido |
| `arca_flow.html` — pills | 29/7/9/45 | **33/8/8/49** (+38 codigos em 30 regras, 0 cegas) | corrigido |
| `arca_flow.html` — cards por status | 29/7/9 | **33/8/8** | corrigido |
| NOTAs/canvases de submodulo com contagem digitada | 4 arquivos (31 regras, 22 campos, 26->20 de 31) | **0** | -4 |
| `MOD-C03-02 NOTA` — "11 regras sem mapeamento" / "200 de 1946 arquivos" | 11 / 200 de 1946 | **19** / **127 de 3413** | corrigido |
| `C01 AUDITORIA_OCR_ARCA.md` + `C01 NOTA` — "(40 regras)" | 40 (x3) | **0** (contagem removida; lacuna marcada como da data da auditoria, fechada por `ARCA-VEICULO-001`) | -3 |
| `C03 INDICE.md` — "(11 regras + lacunas G01)" | 11 | **0** (aponta para a contagem derivada) | -1 |
| `campos_por_regra` declarado no catalogo | 22 | **23 (uniao 25)** | valor errado -> medido |
| Arquivos vivos com total proibido | 11 ocorrencias | **0** | -11 |
| `Testes/TestArcaContagemDerivada.js` | nao existia | **15 PASS / 0 FAIL** | +15 |
| Suite integral (`RodarTodosOsTestes.js`) | 612 PASS / 3 FAIL | **627 PASS / 3 FAIL** | **+15 PASS / +0 FAIL** |
| Lint estrutural do repo | exit 0 | **exit 0** | 0 |
| Espelho — arquivos derivados | 2 espelhos 2 versoes atras + overlay `(26 regras)` | **9 derivados + 3 preservados** | corrigido |

**As 3 falhas da suite sao PRE-EXISTENTES e nao foram tocadas:** `RendererComparativo2026` (legenda) e duas de
`Armas` (paleta/legenda). O delta da suite e **+15 PASS / +0 FAIL** — exatamente os 15 testes da fechadura.
Os testes da ARCA que ja existiam seguem verdes: `TestArcaMapaCobertura` 11/0, `TestArcaConsumidores` 9/0,
`TestArcaVeiculoOcr` 10/0, `TestArcaNormalizadorEfetivo` 8/0, `TestIntegracaoArca` 7/7.

### Saida exata do teste da fechadura

```
Iniciando Testes: Fechadura das contagens derivadas da ARCA (#159 ARCA-COUNT-001)...

  [PASS] medicao derivada e coerente (somas, unicidade, porta)
  [PASS] Dominio/ARCA/INVENTARIO_ARCA.md e exatamente o que o JSON produz (arquivo gerado por inteiro)
  [PASS] Dominio/ARCA/ARCA_REGRAS_DOMINIO.md :: bloco ARCA-METRICAS bate com o derivado
  [PASS] Dominio/ARCA/ARCA_COBERTURA.md :: bloco ARCA-METRICAS bate com o derivado
  [PASS] Dominio/ARCA/arca_flow.html :: bloco ARCA-STATS bate com o derivado
  [PASS] Dominio/ARCA/arca_flow.html :: bloco ARCA-GRID-MAPEADO bate com o derivado
  [PASS] Dominio/ARCA/arca_flow.html :: bloco ARCA-GRID-INTEGRADO bate com o derivado
  [PASS] Dominio/ARCA/arca_flow.html :: bloco ARCA-GRID-NAO_APLICAVEL bate com o derivado
  [PASS] todo marcador de bloco gerado carrega o sha256 vigente do JSON
  [PASS] circuito CIR-MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO.canvas declara as metricas derivadas no no 'arca-metricas'
  [PASS] snapshot scripts/downplant/arca_metricas_derivadas.json bate com a medicao
  [PASS] os arquivos pontuais carregam o valor DERIVADO (o numero digitado foi substituido)
  [PASS] nenhum artefato vivo carrega contagem de catalogo proibida fora de regiao historica
  [PASS] as substituicoes dirigidas sao idempotentes (reaplicar nao altera o arquivo)
  [PASS] o catalogo humano declara a DEFINICAO de cada metrica (sem "total ARCA" ambiguo)

RESULTADOS FINAIS: 15 PASS / 0 FAIL
```

### Saida exata do lint

```
🔍 Verificando Terreno: C:\Users\Bneto04\Documents\Codex\syntheon-gs-downplant-offline

✅ SUCESSO! A arvore documental esta em estrita conformidade com o Down Plant 2.1.
EXIT=0
```

### Saida exata do medidor (texto)

```
ARCA — CONTAGEM DERIVADA DO JSON (por metrica) — #159 ARCA-COUNT-001
fonte: Dominio/ARCA/arca_regras_dominio.json
sha256: f9c853d6725a4b763472832f679ee339736a715ba4c2521f6b95a59588cadb43

METRICA                                    DEFINICAO                                              VALOR
-----------------------------------------  -----------------------------------------------------  -----
regras_total                               registros em regras                                      49
rule_ids_unicos                            rule_id distintos                                        49
regras_mapeadas                            status MAPEADO (auditadas pelo Guardiao)                 33
regras_integradas                          status INTEGRADO                                          8
regras_nao_aplicaveis                      status NAO_APLICAVEL                                      8
regras_nao_auditaveis                      status NAO_AUDITAVEL (cegas)                              0
regras_sem_auditoria                       regras_total - regras_mapeadas                           16
codigos_diagnostico                        soma de auditabilidade_guardiao.codigos                  38
codigos_unicos                             codigos distintos                                        38
regras_com_codigo                          regras com ao menos 1 codigo                             30
porta_codigos                              entradas de MAPA_DIAGNOSTICO_ARCA                        38
porta_rule_ids                             rule_ids distintos na porta                              30
regras_fora_da_porta                       regras_total - porta_rule_ids                            19
campos_por_regra                           campos por regra no JSON (padrao)                        23
campos_por_regra_uniao                     uniao de campos declarados                               25
fontes_canonicas                           CANONICAL_SOURCE_CONFIRMED                               12
fontes_internas                           INTERNAL_SOURCE_CONFIRMED                                35
fontes_desconhecidas                       DOMAIN_RULE_SOURCE_UNKNOWN                                2
subdominios                                subdominio distintos                                     19
categorias                                 categoria distintas                                      36
```

### Prova de que a fechadura morde

Antes de qualquer aplicacao, com o gerador ja escrito:

```
RESULTADOS FINAIS: 1 PASS / 13 FAIL
```

Depois da aplicacao derivada (`node scripts/downplant/contar-regras-arca.mjs --aplicar --espelho`):

```
RESULTADOS FINAIS: 15 PASS / 0 FAIL
```

E a aplicacao e **idempotente**: duas execucoes seguidas de `--aplicar` produzem `md5sum` identico
(nenhum arquivo muda). Se o JSON mudar sem regerar, o proprio marcador denuncia (teste "sha256 vigente").

---

## AS QUATRO PONTAS

### CÓDIGO

- `scripts/downplant/contar-regras-arca.mjs` — **medidor e gerador** (unica fonte de numero): mede 25 metricas
  do JSON, calcula quebras por tipo/status/fonte/subdominio/categoria, **mede a porta** no
  `AdaptadorConsultaArca.js` (38 codigos -> 30 rule_ids), valida a propria coerencia (somas, unicidade,
  codigo sem regra) e emite **TEXTO** (stdout), **JSON** (`--json`) e aplica com `--aplicar [--espelho]`.
- `scripts/downplant/arca_metricas_derivadas.json` — snapshot de maquina (metricas + sha256 do JSON), travado
  pela fechadura.
- **Nenhum `.js`/`.html` de runtime foi alterado.** O unico `.js` tocado e o executor de testes
  (`Testes/RodarTodosOsTestes.js`), para incluir a fechadura na suite.

### DOCUMENTAÇÃO

- `Dominio/ARCA/INVENTARIO_ARCA.md` — **regerado por inteiro** do JSON (visao geral por metrica, fluxo,
  33 MAPEADO + 8 INTEGRADO + 8 NAO_APLICAVEL com as regras certas, lacunas apuradas).
- `Dominio/ARCA/ARCA_REGRAS_DOMINIO.md` — bloco `ARCA-METRICAS` derivado: **tabela metrica x definicao x valor**,
  quebra por tipo e por subdominio; nota do #160 preservada como regiao historica declarada.
- `Dominio/ARCA/ARCA_COBERTURA.md` — bloco derivado + `VEICULOS` reconciliado ao `status_cobertura` do JSON +
  notas de card anteriores movidas para regiao historica declarada.
- `02_Comodos/C01_Entrada/.../AUDITORIA_OCR_ARCA.md` e `.../NOTA_DE_RESPONSABILIDADE.md` — contagem digitada
  removida; lacuna marcada como da data da auditoria e fechada por `ARCA-VEICULO-001` (#137/#138).
- `02_Comodos/C03_Dominio/01_Dominio/INDICE.md` — pendencia do #126 sem contagem digitada.
- `Testes/TestArcaContagemDerivada.js` — **a fechadura** (15 testes).
- `RELATORIO_DE_DIFERENCIAS_159.md` — antes/depois **por arquivo** e **a metrica usada** em cada um.

### CANVAS / PLANTA

- `CIR-MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO.canvas` — 49 regras (10/31/1/2/5), fontes 12/35/2, porta 38 -> 30 de 49
  e **no novo `arca-metricas`** com o bloco derivado (travado pela fechadura).
- `CIR-C03_DOMINIO.canvas` — 49 regras.
- `SUB-C03-02-01` (NOTA + canvas) — 49 regras com 23 campos por regra (uniao 25).
- `SUB-C03-02-04` (NOTA + canvas) — 38 codigos -> 30 das 49 regras.
- `MOD-C03-02/NOTA_DE_RESPONSABILIDADE.md` — 49 regras, 19 regras fora da porta, varredura 127 de 3413.
- **Espelho (`Obsidian_Brain/Syntheon`) derivado do repo (D1/#158):** 9 arquivos derivados — 2 espelhos de
  leitura regerados (`07_Codigo_Leitura/Dominio/ARCA/ARCA_REGRAS_DOMINIO.md` e `ARCA_COBERTURA.md`, que estavam
  2 versoes atras), 7 copias puras (canvases e NOTAs) e o overlay so-do-espelho `COMODO-C05.canvas`
  ("Consulta Read-Only (26 regras)" -> "(38 codigos -> 30 rule_ids)"). **3 arquivos com conteudo proprio do
  espelho foram preservados** (nao sobrescritos, conforme #158) e verificados por varredura: nao carregam
  contagem de catalogo antiga.

### GIT

- **Nada commitado, nada empurrado, nada postado.** Diff local: **14 arquivos modificados + 3 novos**
  (`git status` limpo de qualquer artefato de maquina gerado fora do padrao; os derivados entram como arquivos
  versionaveis).
- Reproducao integral em um comando: `node scripts/downplant/contar-regras-arca.mjs --aplicar --espelho`.
- O JSON canonico **nao foi alterado** por este card (a fonte da verdade permanece intacta;
  sha256 `f9c853d6725a4b763472832f679ee339736a715ba4c2521f6b95a59588cadb43`).

---

## LIMITES DECLARADOS

1. Nao existe numero literal de contagem no gerador: se o JSON mudar, os textos divergem e a fechadura fica
   vermelha ate `--aplicar`. Isso e intencional (o card pede que impeça divergencia silenciosa).
2. Evidencias datadas (`EVD-*`) e relatorios de cards anteriores permanecem como **registro historico** do
   estado na data — uma delas declara isso em texto; nao entram na varredura da fechadura.
3. Existem contagens da ARCA em `Dominio/ARCA/ARCA_FONTES.md`? **Nao** — o arquivo nao carrega numero de
   catalogo (verificado); a lista de fontes por regra ja e derivavel e permanece intacta.
4. O lint do **espelho** (validador do Down Plant apontando para o cofre) nao foi executado nesta rodada: o
   escopo do #159 e a contagem da ARCA; o lint do **repo** foi executado e esta verde (exit 0).
