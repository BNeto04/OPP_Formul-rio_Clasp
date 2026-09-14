# RELATÓRIO — Card #168 (DP24-005)

**Fatia:** §46.13 (relatório do Curador) + dívida §46.11 (Markdown **derivado** do YAML) · **§46.14 homologado** (§7.8)
**Repo:** `C:\Users\Bneto04\Documents\Codex\syntheon-gs-downplant-offline`
**Branch:** `sprint/g01-guardiao-qualidade-live-001` · **HEAD na coleta:** `f8f11b0` (inalterado — esta fatia **não** commita)
**Método canônico:** `03_Fundacao/METODO_DOWN_PLANT_PROGRESSIVO_v2.4.md` (1.094 linhas; `sha256=bf720099fd26597b…`, commit `42ca47e`)
**Data/hora das medições:** 2026-09-14 11:2x–12:19 -0300
**Regra que governa a fatia (§4.5, `METODO...:181` verbatim):** *"YAML e Markdown do handoff divergentes → o YAML vence; a divergência em si é deriva a ser reportada pelo Curador (§7.7)"*

---

## 0. Regra transversal cumprida

MEDIR ANTES → localizar o que já existe → aplicar **SOMENTE** o delta do 2.4 → verificar → registrar.
Nenhuma capacidade existente foi reimplementada: o parser YAML, o validador do handoff, o padrão do
Vigia (somente-leitura + recusa de mutação + LEIAME + fechadura) e os padrões de gerador
(`espelho-rico.mjs`, `contar-regras-arca.mjs`) foram **reusados**.

---

## 1. MEDIÇÃO ANTES

### 1.1 §46.13 — o modelo existe no método; **não existe mecanismo no repo**

| O que | Onde (arquivo:linha) |
|---|---|
| Modelo canônico §46.13 (6 campos + 7 seções + saída) | `03_Fundacao/METODO_DOWN_PLANT_PROGRESSIVO_v2.4.md:998-1015` |
| Relatório de Curador **realmente praticado** | **SÓ no espelho**: `.../Obsidian_Brain/Syntheon/00_Painel/RELATORIO_DO_CURADOR.md:1-50` |
| Mecanismo que produza o formato §46.13 no repo | **INEXISTENTE** |

Duas leituras independentes da ausência no repo (não uma só):
```
$ find . -iname "*CURADOR*" -not -path "./.git/*"      -> (vazio)
$ find 00_Painel -type f                               -> 00_Painel/INICIO.md
```

**Δ medido, campo a campo, entre o praticado e o modelo §46.13** — o praticado cobre 8 dos 13 elementos:

| Elemento do modelo §46.13 | Praticado (`RELATORIO_DO_CURADOR.md`) |
|---|---|
| `# CURADOR DOWN PLANT` | presente (`:1`) |
| `- Commit observado:` | presente (`:2`) |
| `- Cômodos afetados:` | presente (`:5`) |
| `- Módulos afetados:` | **AUSENTE** |
| `- Circuitos afetados:` | **AUSENTE** |
| `- Estado anterior:` | **AUSENTE** |
| `- Estado encontrado:` | **AUSENTE** |
| `## Alterações mecanicamente reconciliáveis` | presente (`:8`) |
| `## Divergências` | presente (`:28`) |
| `## Links e Canvas` | presente (`:34`) |
| `## Handoffs YAML/Markdown divergentes` | presente (`:37` — declarava *"Não há objeto `downplant_handoff` materializado em nenhum dos lados"*) |
| `## Atualização realizada` | presente (`:40`) |
| `## Decisão humana necessária` | presente (`:43`) |
| `## Resultado` | presente (`:49`) |
| `SINCRONIZADO \| DIVERGENTE \| NENHUMA AÇÃO` | **AUSENTE** — o arquivo termina em `:50` com `**DIVERGENTE** (…)` |

**Δ = 5 elementos ausentes** (4 campos de cabeçalho + a linha de saída canônica). O praticado também é
**só do espelho** — o repo não tem endereço para ele.

### 1.2 §46.14 — **JÁ EXISTE** (implantado no #167 / DP24-004): zero delta, só homologação

| O que | Onde (arquivo:linha) |
|---|---|
| §46.14 verbatim no método | `03_Fundacao/METODO_DOWN_PLANT_PROGRESSIVO_v2.4.md:1016-1028` |
| Mecanismo (observa, compara, reporta; recusa mutação) | `scripts/downplant/vigia-dependencias.mjs:182-240` (relatório §46.14) · `:35-64` (recusa de `--aplicar/--atualizar/...`) |
| Relatório materializado no formato §46.14 | `dependencias/vigia/RELATORIO_VIGIA_2026-09-14.md:1-43` (7 seções + `SINCRONIZADO \| DEFASADO \| NENHUMA AÇÃO`) |
| LEIAME do padrão a copiar | `dependencias/vigia/LEIAME_VIGIA.md:1-49` |
| Fechadura | `Testes/TestVigiaDependencias.js` (28 testes; registrada em `Testes/RodarTodosOsTestes.js:119-125`) |

**Δ = 0** (§46.14 já implantado). O que esta fatia fez foi **homologar** (§4 abaixo, teste extrai as
rubricas do método e as confere no relatório do Vigia).

### 1.3 §46.11 — **a dívida**: o `.md` era derivado **À MÃO**

Estado em HEAD (`git show HEAD:08_Execucao_Ao_Vivo/downplant_handoff.md`), 112 linhas, **CRLF** (o YAML é **LF**):

| Medida (contra o `downplant_handoff.yaml` de HEAD) | Resultado |
|---|---|
| Rubricas do modelo §46.11 (`METODO:926-968`) presentes no `.md` | **0 de 9** (`# HANDOFF`, `## Localização Down Plant`, `## Task`, `## Escopo autorizado`, `## Conexões afetadas`, `## Portões`, `## Proibições`, `## Regra para intercorrências`, `## Regra de parada` — todas AUSENTES) |
| Fatos não-vazios declarados no YAML | 58 |
| Fatos do YAML que aparecem no `.md` **reescritos** (normalização `->` → `→`, ASCII → acento) | **15** — ex.: `contexto_de_task.portao_atual`, `regra_de_parada`, as 5 `proibicoes[]`, as 4 `quatro_pontas.justificativas.*`, `estado.portao_destino`, `proveniencia.objetivo`, `referencias.estado_operacional` |
| Linhas de prosa do `.md` **sem fato correspondente** no YAML | **10** — `downplant_handoff.md:20, :44, :52, :55, :56, :57, :58, :60, :103, :112` |
| Terminador de linha do par | `.md` **CRLF** × `.yaml` **LF** |

**Δ = 25 pontos de divergência** (15 fatos reescritos + 10 linhas órfãs) **e 9 rubricas do template ausentes**.
O `.md` continha prosa normativa (a nota de formato, a explicação da projeção §32.14, o comando de
verificação) que **não existia em lugar nenhum do YAML** — exatamente a divergência que o §46.11 proíbe.

---

## 2. OS DELTAS APLICADOS (só eles)

### 2.1 Delta §46.11 (a dívida) — mecanismo canônico YAML → Markdown

| Arquivo | O que é | Linhas |
|---|---|---|
| `scripts/downplant/gerar-handoff-md.mjs` | **NOVO** — gerador canônico do espelho (§46.11). Reusa `parseYaml` do validador único | 370 |
| `08_Execucao_Ao_Vivo/downplant_handoff.yaml` | **ALTERADO** (+11) — ganhou o bloco `notas` (`:88-98`); nenhum campo existente foi tocado | 99 |
| `08_Execucao_Ao_Vivo/downplant_handoff.md` | **REGERADO** (129+/83−) — agora 100% derivado; LF, 158 linhas | 158 |

Por que o YAML ganhou `notas`: o espelho só pode conter o que o YAML declara. A prosa que vivia **só**
no `.md` (que era a divergência) foi movida para a fonte canônica — `notas.projecao_32_14`,
`notas.verificacao`, `notas.formato`, `notas.derivacao_do_espelho` — e o gerador a deriva de lá.

### 2.2 Delta §46.13 — o Curador com o formato único do método

| Arquivo | O que é | Linhas |
|---|---|---|
| `scripts/downplant/curador-estrutural.mjs` | **NOVO** — relatório §46.13 (OBSERVA→COMPARA→DETECTA→ATUALIZA O MECÂNICO *ou* REPORTA). Reusa `parseYaml` **e** `gerarMarkdown` | 386 |
| `08_Execucao_Ao_Vivo/LEIAME_CURADOR.md` | **NOVO** — o LEIAME do padrão (espelha `LEIAME_VIGIA.md`) | 84 |
| `08_Execucao_Ao_Vivo/RELATORIO_CURADOR_2026-09-14.md` | **NOVO** — exemplo real, materializado pelo próprio mecanismo | 41 |

### 2.3 Delta §46.14 — zero (homologado)

Nada foi criado nem alterado. O teste novo lê as rubricas do §46.14 **do próprio método** (`:1017-1028`)
e as confere no `RELATORIO_VIGIA_2026-09-14.md` — 10/10 presentes.

### 2.4 Fechadura e registro na suíte

| Arquivo | O que é | Linhas |
|---|---|---|
| `Testes/TestCuradorEstrutural.js` | **NOVO** — fechadura §46.11/§46.13 + homologação §46.14 (26 testes) | 453 |
| `Testes/RodarTodosOsTestes.js` | **ALTERADO** (+9, `:127-135`) — registra a fechadura na suíte integral | — |

---

## 3. DESENHO DO GERADOR — o que deriva de quê

`gerarMarkdown(doc, { arquivoMd })` produz 3 coisas: o **Markdown**, o **mapa de derivação**
(`{linha, chave, tipo, valor}`) e a contagem de linhas. `--mapa` imprime o mapa; a fechadura o usa
para provar a derivação **linha a linha, contra o texto do YAML** (não contra o gerador).

Distribuição do espelho final (158 linhas) por origem:

| Origem | Linhas | Regra |
|---|---|---|
| `yaml` — valor bruto do YAML, **verbatim** | **72** | nenhum valor é reescrito, normalizado ou traduzido |
| `ausente` — chave consultada e vazia | 10 | marcação explícita `(nao declarado no YAML)`; nunca inventa |
| `skeleton` — corpo do modelo §46.11 (`METODO:926-968`) | 29 | títulos e as 2 regras verbatim do método |
| `estrutura` — branco / separador / cabeçalho de tabela | 48 | — |

### 3.1 Corpo §46.11 (as 9 rubricas) e a projeção

| Rubrica/linha do espelho | Deriva de (chave do YAML) |
|---|---|
| `# HANDOFF` + nota *"Gerado automaticamente…"* (`METODO:926`) | **skeleton verbatim do método** |
| `## Localização Down Plant` · Terreno/Submódulo/Circuito/Porta | `downplant.terreno` `.submodulo` `.circuito` `.porta` → **ausentes** (medidos) |
| · Cômodo / Módulo / Escala | `contexto_de_task.comodo` · `contexto_de_task.modulo_ativo` · `downplant.escala` |
| `## Task` · ID / Objetivo / Ação / Alvo / Resultado esperado | `task.id` · `contexto_de_task.fatia_ativa` · `task.acao` · `task.alvo` · `estado.portao_destino` |
| `## Escopo autorizado` · Arquivos | `contexto_de_task.arquivos_permitidos` (5 itens, 1 linha cada) |
| · Funções / Ambiente / Pode expandir | `task.alvo` · `contexto_de_task.ambiente` · `escopo.pode_expandir` |
| · Artefatos | `escopo.artefatos` → ausente |
| `## Conexões afetadas` · Origem/Destino/Contrato | `conexoes.*` → ausentes |
| `## Portões` · Atual / Destino | `contexto_de_task.portao_atual` · `estado.portao_destino` |
| `## Proibições` · Expandir escopo / Outros | `escopo.pode_expandir` · `contexto_de_task.proibicoes` (5 itens) |
| · Efeitos externos / Publicação | `proibicoes.*` → ausentes |
| `## Regra para intercorrências` · `## Regra de parada` | **skeleton verbatim** (`METODO:965, :968`) + `contexto_de_task.regra_de_parada` |

### 3.2 Blocos declarados pelo objeto (o espelho não introduz fato)

| Bloco do espelho | Deriva de |
|---|---|
| `## Cabeçalho do objeto` (8 chaves) + Propósito | chaves-raiz `downplant_schema…estado_do_handoff` + `proposito` |
| `## Identidade` (6) | `identidade.*` |
| `## Contexto de task` (6) + Proibições + Ids remotos (3) | `contexto_de_task.*` · `contexto_de_task.proibicoes` · `contexto_de_task.ids_remotos.*` |
| `## Quatro pontas` (4 linhas: estado + justificativa) | `quatro_pontas.{CODE,DOC,CANVAS,GIT}_STATE` + `quatro_pontas.justificativas.*` |
| `## Proveniência` (4) | `proveniencia.*` |
| `## Referências canônicas` (6) | `referencias.*` — o **link** é derivado: destino = caminho declarado resolvido **relativo ao diretório do espelho** (é a mesma base que o lint usa: `path.resolve(path.dirname(file), link)`, `scripts/downplant/lint-estrutura.mjs:173`) |
| `## Notas do objeto (§46.11)` (4) | `notas.*` |

### 3.3 O que o gerador **NÃO** faz
Não inventa campo, não completa campo ausente, não valida o YAML (o validador é
`scripts/downplant/validar-handoff.mjs`, **reusado** — não há segundo parser de handoff no repo),
não escreve nada sem `--out`/`--aplicar`, e **não** decide.

---

## 4. FECHADURA E RED → GREEN POR REVERSÃO (`sha256sum -c` conferido)

Fechadura: `Testes/TestCuradorEstrutural.js` (26 testes) — cobre: rubricas §46.11 extraídas do método;
derivação byte a byte e por mapa; determinismo; RED por edição manual do `.md`; RED por YAML alterado
sem regerar; RED por espelho ausente; RED por CRLF; formato §46.13 (rubricas extraídas do método,
ordem, campos preenchidos); estados `SINCRONIZADO`/`DIVERGENTE`/`NENHUMA AÇÃO`; limites §7.7
(não muta sem `--aplicar`; recusa `--decidir/--fix/--auto/--patch/--upgrade/--resolver` com exit ≠ 0);
ausência de validador/gerador duplicado; homologação §46.14.

### 4.1 Prova real (log integral: `$LOCALAPPDATA/Temp/prova_red_green_168_v2.log`)

```text
### 0. ESTADO DE PARTIDA (o par e derivado: --check)
CHECK: IDENTICO - o espelho 08_Execucao_Ao_Vivo/downplant_handoff.md deriva do YAML (sha256=93941f948fb08f62...)
exit --check = 0

### 1. GREEN de referencia - regera o espelho do YAML e CONGELA o sha256
gerar-handoff-md: espelho regerado ... (158 linhas, sha256=93941f948fb08f624cb320ac220f989cde752b3aabbcb91e20a336808b7cdf88)
exit --aplicar = 0
93941f948fb08f624cb320ac220f989cde752b3aabbcb91e20a336808b7cdf88 *08_Execucao_Ao_Vivo/downplant_handoff.md
2cca516a8b8eb1f0e4ad86f4592528f604d0f79fef59ec944c6883b5d182f9b3 *08_Execucao_Ao_Vivo/downplant_handoff.yaml
exit FECHADURA (GREEN) = 0
RESULTADOS FINAIS: 26 PASS / 0 FAIL

### 2. RED-A - edicao MANUAL do .md (linha que o YAML nao declara)
CHECK: DIVERGENTE - o espelho ... NAO deriva do YAML
  espelho em disco: 160 linhas, sha256=0ff483662ea0110b...
  derivado do YAML: 158 linhas, sha256=93941f948fb08f62...
exit --check = 1
exit FECHADURA (RED-A) = 1
RESULTADOS FINAIS: 23 PASS / 3 FAIL
## Handoffs YAML/Markdown divergentes
- `08_Execucao_Ao_Vivo/downplant_handoff.yaml` x `08_Execucao_Ao_Vivo/downplant_handoff.md`: **DIVERGENTES**

### 3. REVERSAO-A - restaura o espelho congelado e confere com sha256sum -c
08_Execucao_Ao_Vivo/downplant_handoff.md: OK
exit sha256sum -c = 0

### 4. GREEN de novo - a fechadura volta a verde
exit --check = 0
exit FECHADURA (GREEN) = 0
RESULTADOS FINAIS: 26 PASS / 0 FAIL

### 5. RED-B - YAML alterado SEM regerar o espelho
CHECK: DIVERGENTE - o espelho ... NAO deriva do YAML
  derivado do YAML: 159 linhas, sha256=cacf74c858d528a8...
exit --check = 1
exit FECHADURA (RED-B) = 1
RESULTADOS FINAIS: 22 PASS / 4 FAIL

### 6. REVERSAO-B - restaura o YAML congelado e confere com sha256sum -c
08_Execucao_Ao_Vivo/downplant_handoff.yaml: OK
exit sha256sum -c = 0

### 7. GREEN final - par derivado, fechadura e validador verdes
exit --check = 0 · exit FECHADURA (GREEN) = 0 · RESULTADOS FINAIS: 26 PASS / 0 FAIL
exit VALIDADOR = 0 · 40 PASS · 0 FAIL

### 8. sha256 final do par (identico ao congelado no passo 1?)
08_Execucao_Ao_Vivo/downplant_handoff.md: OK      exit sha256sum -c md = 0
08_Execucao_Ao_Vivo/downplant_handoff.yaml: OK    exit sha256sum -c yaml = 0
```

**Leitura:** a fechadura nasce **VERDE** com o `.md` derivado (26/0, exit 0) e **VERMELHA** nos dois
modos de deriva (edição manual do `.md`: 23/3, exit 1; YAML alterado sem regerar: 22/4, exit 1).
As duas reversões foram conferidas com `sha256sum -c` (**OK**, exit 0) e a fechadura voltou a **26/0,
exit 0** — o GREEN não é conjetura, é a mesma árvore de bytes do passo 1.

---

## 5. LINT E SUÍTE INTEGRAL — com `exit`

Log integral: `$LOCALAPPDATA/Temp/verificacao_final_168.log` (coleta 2026-09-14 12:26:08 -0300, HEAD `f8f11b0`).

| Portão | ANTES (delta revertido) | DEPOIS |
|---|---|---|
| Lint estrutural `scripts/downplant/lint-estrutura.mjs` | **exit 0** — *"✅ SUCESSO! A arvore documental esta em estrita conformidade com o Down Plant 2.1."* | **exit 0** — mesma saída |
| Validador canônico `scripts/downplant/validar-handoff.mjs .` | exit 0 · **40 PASS / 0 FAIL** | exit 0 · **40 PASS / 0 FAIL** |
| Fechadura nova `Testes/TestCuradorEstrutural.js` | — (não existia) | **exit 0 · 26 PASS / 0 FAIL** |
| **Suíte integral** `node Testes/RodarTodosOsTestes.js` | **exit 1 · 727 PASS / 1 FAIL** | **exit 1 · 753 PASS / 1 FAIL** |

**+26 PASS** (exatamente a fechadura nova) e **o mesmo único FAIL, que é PRÉ-EXISTENTE** (§8) — o delta
não introduz nenhuma falha. O `exit 1` da suíte **não** é declarado verde: é o FAIL herdado abaixo.

---

## 6. MEDIÇÃO DEPOIS

| Medida | Antes | Depois |
|---|---|---|
| Derivar o `.md` do YAML | **à mão** (nenhum mecanismo) | `scripts/downplant/gerar-handoff-md.mjs` (+364 linhas); `--check` **exit 0** |
| Rubricas §46.11 no espelho | 0 de 9 | **9 de 9** |
| Fatos do YAML reescritos no espelho | 15 de 58 | **0** (72 linhas com valor derivado, todas conferidas contra o texto do YAML) |
| Linhas do espelho sem derivação | 10 | **0** |
| Terminador de linha do par | `.md` CRLF × `.yaml` LF | **LF × LF** |
| Formato §46.13 com mecanismo no repo | inexistente | `scripts/downplant/curador-estrutural.mjs` (+386) — **13 de 13** rubricas do modelo |
| Exemplo real §46.13 | só no espelho, 8/13 elementos | `08_Execucao_Ao_Vivo/RELATORIO_CURADOR_2026-09-14.md` — **13/13**, gerado (determinístico: 2 rodadas idênticas, `cmp = 0`) |
| §46.14 | implantado no #167 | **homologado** (10/10 rubricas do método) — **zero delta** |
| Fechadura | — | `Testes/TestCuradorEstrutural.js` — 26 PASS / 0 FAIL, exit 0 |
| Suíte integral | 727 PASS / 1 FAIL / exit 1 | 753 PASS / 1 FAIL / exit 1 (mesmo FAIL) |

**Estado medido do Curador na rodada real:** `**Estado do Curador (§46.13):** DIVERGENTE` — com o par
do handoff **sem divergência** (o `.md` deriva do YAML). O `DIVERGENTE` vem de **fato medido, não
inventado**: o objeto não declara 10 campos do modelo canônico — `downplant.terreno`, `.submodulo`,
`.circuito`, `.porta` (objeto §46.12, `METODO:971-996`) e `conexoes.origem|destino|contrato`,
`escopo.artefatos`, `proibicoes.efeitos_externos|publicacao` (rubricas §46.11, `METODO:927-968`).
Regerar **não** resolve: é `REPORTA O QUE EXIGIR DECISÃO` (§7.7). A decisão está declarada no
relatório, `## Decisão humana necessária`.

---

## 7. O QUE FICOU **FORA** DO DELTA (declarado)

1. **`downplant.terreno/submodulo/circuito/porta` e `conexoes.*` etc. não foram preenchidos.** Declarar
   esses campos muda o conteúdo do handoff (inventaria endereço Down Plant) — é decisão do Planejador/
   Proprietário, não do Curador (§7.7) e não é a dívida do §46.11. O Curador apenas **reporta**.
2. **O relatório de Curador do espelho** (`Obsidian_Brain/Syntheon/00_Painel/RELATORIO_DO_CURADOR.md`)
   **não foi tocado** — é artefato do espelho (§4.4), reconciliá-lo é outra porta.
3. **A reconciliação espelho × repo** (110 só no espelho, 58 só no repo, 24 divergentes de conteúdo,
   `RELATORIO_DE_DIFERENCIAS_158.md:196-205`) **não** foi retomada — não é esta fatia.
4. **O Curador não verifica o contrato §32.14** nem roda o validador em subprocesso: §32.14 tem um
   dono só (`validar-handoff.mjs`). O relatório aponta o validador e não o duplica.
5. **Nenhuma ação de Git** (add/commit/push/PR), **nenhuma postagem** no GitHub, **nenhum card** criado
   ou reaberto, **nenhum `clasp push`**, **#172 não tocado**, **#164/#167 não reabertos**.
6. **O FAIL pré-existente da suíte não foi corrigido** — ver §8.
7. `notas.verificacao` guarda a medição declarada na data de `gerado_em` ("40 PASS / 0 FAIL, exit 0");
   o Curador **não** reexecuta o validador para confirmá-la rodada a rodada (fora do delta).

---

## 8. DERIVA PRÉ-EXISTENTE ENCONTRADA (não causada por esta fatia; **não** corrigida)

A suíte sai **exit 1** por **1 FAIL** que **já existe em HEAD**:

```
[FAIL] o relatorio commitado e reproduzivel (regerar == arquivo em disco):
       o relatorio em disco nao corresponde a uma geracao atual - relatorio desatualizado e deriva
```
(`Testes/TestVigiaDependencias.js`, bloco [4] do #167)

Causa medida: o relatório versionado **não é regerado desde `f9a23fb`** (DP24-004, o próprio #167),
enquanto o vínculo `dependencias/DEP-003_CLASP_DEPLOY.md` mudou **três vezes** depois disso
(`53684b7` → `a929f1e` → `f8f11b0`). O HEAD `f8f11b0` alterou o vínculo
(`versao: "NAO_COMPROVADA"` → `"3.3.0"`, +1/−1) e **não regerou** o relatório — que segue declarando
`AUSENTE_DECLARADO`. A fechadura do #167 detecta a deriva corretamente (§46.14 / §18.1).

Provado que **não** é desta fatia, por duas leituras independentes:
1. `git status --short dependencias/` → **vazio** (esta fatia não tocou `dependencias/`);
2. **`git archive HEAD`** (árvore pura de HEAD, sem nada meu) →
   `node Testes/TestVigiaDependencias.js` → **`RESULTADOS FINAIS: 27 PASS / 1 FAIL`, exit 1** — o mesmo FAIL.

Correção = `node scripts/downplant/vigia-dependencias.mjs --out dependencias/vigia/RELATORIO_VIGIA_2026-09-14.md`,
que pertence à fatia do #167 (card **fechado**). **Declarado, não executado.**

---

## 9. RASTREABILIDADE E PARADA

- Fontes consultadas: `03_Fundacao/METODO_DOWN_PLANT_PROGRESSIVO_v2.4.md` (§§4.5, 7.7, 18.1, 31.6, 32.14,
  46.11, 46.12, 46.13, 46.14) · issue **#168** (aberta) e **#57** · `08_Execucao_Ao_Vivo/downplant_handoff.{yaml,md}` ·
  `scripts/downplant/{validar-handoff,vigia-dependencias,lint-estrutura,gerar-handoff-md,curador-estrutural}.mjs`.
- sha256 dos artefatos do delta: ver `BLOCO_PROVA_GIT_168_B1.md` §3.
- **Git:** árvore de trabalho com 6 modificados + 6 novos; **nada** foi `git add`/`git commit`/`push`
  (os exits de `add`/`commit` são do Executor principal). `GIT` = **🟡 NÃO PROVADO**.
- **Parada:** fatia concluída. **#169 NÃO iniciado.**
