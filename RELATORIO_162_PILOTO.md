# RELATÓRIO — #162 (DP24-001) — PILOTO do Espelho Rico de Código (§46.15)

**STATUS:** ENTREGUE — piloto aplicado a **1 artefato** (sem escala para os demais 71).
**Data:** 2026-09-13 (BRT) · **Branch:** `sprint/g01-guardiao-qualidade-live-001` · **HEAD:** `ca87280ac99dee798d598453ef94708894008a3d` (`ca87280`)

> NOTA DE SEGURANÇA DOCUMENTAL: este relatório nomeia, na seção "limites", tokens que o próprio lint proíbe dentro das árvores varridas
> (`00_Painel`, `01_Planta`, `02_Comodos`, `03_Fundacao`, `06_Inventario`, `07_Codigo_Leitura`, `08_Execucao_Ao_Vivo`).
> Ele vive na **raiz do repositório de propósito** (raiz não é varrida). Não mover nem duplicar para dentro das árvores varridas sem tratar a colisão.

---

## 1. Decisão: qual artefato, e por quê

**Escolhido:** `Dominio/ARCA/AdaptadorConsultaArca.js`
**Endereço Down Plant:** `C03_Dominio / MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO / SUB-C03-02-04_ADAPTADOR_PORTA_DE_CONSULTA`

| Caminho absoluto | Papel |
| :--- | :--- |
| `C:\Users\Bneto04\Documents\Codex\syntheon-gs-downplant-offline\Dominio\ARCA\AdaptadorConsultaArca.js` | artefato de origem (273 linhas) |
| `C:\Users\Bneto04\Documents\Codex\syntheon-gs-downplant-offline\scripts\downplant\espelho-rico.mjs` | gerador (novo, 501 linhas) |
| `C:\Users\Bneto04\Documents\Codex\syntheon-gs-downplant-offline\07_Codigo_Leitura\Dominio\ARCA\AdaptadorConsultaArca.js.md` | **espelho canônico no REPO** (novo, 339 linhas) |
| `C:\Users\Bneto04\Documents\Obsidian\Obsidian_Brain\Syntheon\07_Codigo_Leitura\Dominio\ARCA\AdaptadorConsultaArca.js.md` | **espelho derivado no VAULT** (regravado, 339 linhas) |

**Quatro razões, todas verificáveis:**

1. **Endereço real e vigente, ao nível do artefato.** O artefato é declarado nominalmente no sub-módulo:
   `02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO/NOTA_DE_RESPONSABILIDADE.md:27`
   → `| AdaptadorConsultaArca.js | Dominio/ARCA/AdaptadorConsultaArca.js | PORTA DE CONSULTA (read-only) | SUB-C03-02-04 |`.
   O gerador confere essa declaração mecanicamente (teste T2).
2. **Exercita os dois campos mais difíceis do §46.15.** "Portas expostas" e "Divergência com a Planta declarada" só podem ser
   demonstrados num artefato que (a) exponha uma porta real — `AdaptadorConsultaArca.enriquecerDiagnostico(codigoRegra, contexto)`
   (`.../MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO/NOTA_DE_RESPONSABILIDADE.md:30`, `.../SUB-C03-02-04_ADAPTADOR_PORTA_DE_CONSULTA/NOTA_DE_RESPONSABILIDADE.md:6`)
   e (b) já tivesse espelho anterior em formato antigo, para medir antes/depois de verdade. Este tem.
3. **O mentir do formato antigo é medível aqui.** O espelho antigo deste arquivo estava **DERIVADO**: 252 linhas embutidas contra 273
   na origem, primeira divergência na linha 21, sha256 do bloco `398221b6c520…` contra `99f8c7e2fb8a…` do arquivo. Sem sha nem commit
   declarados, essa deriva era indetectável por inspeção. É o caso de teste ideal para o padrão.
4. **Não colide com nenhum gate existente.** O arquivo não contém token de legado, então o espelho verbatim pode viver dentro de
   `07_Codigo_Leitura` (árvore varrida pelo lint) **sem** afrouxar nenhum portão. Ver §1.1.

### 1.1 Por que NÃO usei o candidato sugerido (`SUB-C00-02-01_LINT` / `scripts/downplant/lint-estrutura.mjs`)

**Motivo: colisão dura e medida com o próprio lint.** O linter proíbe os padrões `M[0-9]{2}`, `TASK-M[0-9]*`, `planta/` e `file:///`
em toda a árvore documental (`scripts/downplant/lint-estrutura.mjs:118`, aplicado a `07_Codigo_Leitura` em `:95`) — e o próprio
arquivo do linter **contém 4 ocorrências** desses padrões no seu texto:

```
$ node -e ".../(M[0-9]{2}|TASK-M[0-9]*|planta\/|file:\/\/\/)/g... console.log(JSON.stringify(c.match(p)))"
MATCHES: ["TASK-M","planta/","file:///","TASK-M"]
```

Consequência imediata: embutir o código do linter **verbatim** (exigência do §46.15) dentro de `07_Codigo_Leitura` produziria **4 erros**
e o lint sairia **exit 1** — violando requisito explícito desta fatia. O espelho nem poderia *documentar* a colisão no próprio corpo,
porque o texto de documentação também é varrido. Ou seja: o candidato sugerido é o único artefato endereçado que **não** pode ser
provado de ponta a ponta hoje sem antes tomar uma decisão do proprietário sobre a varredura (§7.1).

**Medição que sustenta a escolha** (69 fontes endereçadas resolvidas a partir das NOTAS/MODs de `02_Comodos`):

```
 56 / 69  fontes endereçadas SEM token de legado      -> embutíveis verbatim hoje
 13 / 69  fontes endereçadas COM token de legado      -> bloqueadas pelo lint (20%)
          (scripts/downplant/lint-estrutura.mjs, Entrada/EntradaManual.js, Entrada/Formulario.html,
           Leitura/Adaptador2026.js, Leitura/LeitorAntiguidadePeculio.js, Features/GuardiaoQualidade.js,
           Core/RegrasQualidade.js, Features/CompiladorGxt.js, Motor/PoliticaMeritoArmas.js,
           Motor/DiagnosticoDeterministicoGxt.js, Render/RendererGxt.js, Render/RendererAuditoriaSaude.js,
           + 2 caminhos inexistentes)
```

Também medi, por bloco de código embutido (66 espelhos que já embutem código):
**13 dos 66 estão bloqueados** (mesma proporção). Lista nominal em §7.1.

---

## 2. Medição ANTES — o artefato escolhido, campo por campo

Espelho anterior (formato antigo, vault): 262 linhas, cabeçalho em `> [!NOTE] Espelho de Leitura Unidirecional`.

| Campo exigido pelo §46.15 (`03_Fundacao/METODO_DOWN_PLANT_PROGRESSIVO_v2.4.md:1029-1043`) | Existia antes? | Onde estava | Depois |
| :--- | :--- | :--- | :--- |
| Endereço Down Plant | **SIM** (impreciso) | `**Endereço Canônico Down Plant:**` apontava para a NOTA do **MÓDULO** | SIM — agora desce ao **SUBMÓDULO** `SUB-C03-02-04` |
| Arquivo de origem (link para o disco) | **SIM** | `**Caminho Real no Repositório:**` (texto, sem link) | SIM — agora é link vivo para o arquivo em disco |
| Commit de referência | **NÃO** | — | **ADICIONADO** (sha completo + curto) |
| Data da última sincronização | **NÃO** | — | **ADICIONADO** |
| Código-fonte embutido | **SIM** (derivado) | `## Código Fonte` | SIM — `## Código-fonte embutido`, verbatim + sha256 declarado |
| Responsabilidade observada | **NÃO** | — | **ADICIONADO** (derivado da NOTA do endereço, com fonte citada) |
| Portas expostas (se aplicável) | **NÃO** | — | **ADICIONADO** (superfície extraída + porta declarada na Planta) |
| Divergência com a Planta declarada | **NÃO** | — | **ADICIONADO** (7 testes mecânicos + declaração verificada) |
| Última verificação (data/commit) | **NÃO** | — | **ADICIONADO** |

**Campos que o formato atual já tinha (reaproveitados, não reimplementados):** (1) endereço Down Plant, (2) arquivo de origem,
(3) código-fonte embutido, (4) o aviso de "somente leitura / derivado no Obsidian", (5) o título `# ESPELHO — NOME_DO_ARQUIVO`,
(6) o SHA-256 (existia em 63 dos 72, em forma truncada no índice e no callout de alguns espelhos — aqui **não existia**, por isso
a deriva passou). Formato antigo preservado como base; **o delta é 5 campos e a precisão do endereço**.

**Deriva do espelho anterior (medida antes de sobrescrever):**

```
origem   sha256 (LF): 99f8c7e2fb8a44e708aaff9490307d0a154c9897a3a6b512c4b0bbb1522a5338   273 linhas
embutido sha256 (LF): 398221b6c520…  (bloco antigo)                                      252 linhas
DERIVA: true      primeira divergência na linha 21  ("'ARMA_ARTESANAL_INCONSISTENTE': 'ARCA-ARMAS-002'," ausente no embutido)
```

### 2.1 Corpus: conformidade dos 72 espelhos do vault (medido hoje, já com este piloto aplicado)

| Campo §46.15 | Antes (baseline do briefing) | Medido hoje (72 arquivos) |
| :--- | :--- | :--- |
| Endereço Down Plant | 69/72 | 69/72 |
| Arquivo de origem | 69/72 | 69/72 |
| Commit de referência | 63/72 | 64/72 (63 + o deste piloto) |
| Data da última sincronização | 0/72 | 1/72 (só o deste piloto) |
| Código-fonte embutido | 66/72 | 66/72 |
| Responsabilidade observada | 0/72 | 1/72 (só o deste piloto) |
| Portas expostas (se aplicável) | 4/72 (matcher frouxo, não reproduzido) | 1/72 com o heading do §46.15 (só o deste piloto); 0 antes |
| Divergência com a Planta declarada | 1/72 (matcher frouxo) | 4/72 mencionam "Diverg"; **1/72** com o heading do §46.15 |
| Última verificação (data/commit) | 0/72 | 1/72 (só o deste piloto) |

Os `Commit HEAD`/`SHA-256` remanescentes estão velhos (ex.: `07_Codigo_Leitura/Core/Utils.js.md` declara `0bcff5f`, quando o HEAD é `ca87280`).
Os 69 endereços existentes apontam para um elemento parado (`_SUP_158/…/MOD-C00-01_INFRAESTRUTURA_CORE`), que não é o elemento vigente
(`MOD-C00-01_ESTRUTURA_DO_COFRE`) — dívida registrada em §7.2.

---

## 3. Delta aplicado (escopo respeitado)

1. **NOVO** `scripts/downplant/espelho-rico.mjs` — gerador (501 linhas, ESM, sem dependência externa), dois modos: `gerar` e `verificar`.
2. **NOVO** `07_Codigo_Leitura/Dominio/ARCA/AdaptadorConsultaArca.js.md` — espelho canônico no repositório.
3. **REGRavado (in place)** `…\Syntheon\07_Codigo_Leitura\Dominio\ARCA\AdaptadorConsultaArca.js.md` — derivado no vault, mesmas entradas, link de disco absoluto.
4. **NÃO** toquei em nenhum outro espelho (71 restantes intactos). **NÃO** toquei código de produto. **NÃO** houve commit/push/card.

`git status --porcelain` após o delta:

```
 M 02_Comodos/.../SUB-C01-01-01_OCR_E_CONFERENCIA/NOTA_DE_RESPONSABILIDADE.md   <- pré-existente, não é desta fatia
 M 08_Execucao_Ao_Vivo/downplant_handoff.md                                     <- pré-existente, não é desta fatia
 M RELATORIO_DE_DIFERENCIAS_156_157.md                                          <- pré-existente, não é desta fatia
?? 07_Codigo_Leitura/Dominio/                                                    <- NOVO (espelho canônico)
?? Testes/TestNormalizadorEfetivo.js                                            <- pré-existente (untracked), não é desta fatia
?? Testes/temp_test_telegram/                                                   <- pré-existente
?? VigiaPonte/conversation_memory.json                                          <- pré-existente
?? RELATORIO_162_PILOTO.md                                                      <- NOVO (este relatório)
?? scripts/downplant/espelho-rico.mjs                                           <- NOVO (gerador)
```

O artefato de origem **não aparece** na lista: não foi modificado (o campo "Nada foi corrigido no artefato" do espelho é fato, não promessa).

---

## 4. Prova de frescor (commit/sha/data acompanham o HEAD)

**4.1 As três grandezas são idênticas às calculadas por fora:**

```
$ git rev-parse HEAD                  -> ca87280ac99dee798d598453ef94708894008a3d
$ git rev-parse --short HEAD          -> ca87280
$ sha256sum Dominio/ARCA/AdaptadorConsultaArca.js
  99f8c7e2fb8a44e708aaff9490307d0a154c9897a3a6b512c4b0bbb1522a5338 *Dominio/ARCA/AdaptadorConsultaArca.js

espelho (linha 10) -> Commit de referência: `ca87280ac99dee798d598453ef94708894008a3d` (`ca87280`)
espelho (linha 15) -> sha256 do bloco (LF): `99f8c7e2fb8a44e708aaff9490307d0a154c9897a3a6b512c4b0bbb1522a5338`
```
(o arquivo é LF, então o sha256 "LF normalizado" do gerador coincide com o `sha256sum` do disco.)

**4.2 Reexecução do mesmo comando → a data anda, commit/sha não (não há cache):**

```
20:45:20-03:00   ca87280   sha 99f8c7e2…   (geração do espelho gravado)
20:45:39-03:00   ca87280   sha 99f8c7e2…   (reexecução; exit 0)
```

**4.3 O commit é lido do Git na hora, não congelado no código:**

```
$ node scripts/downplant/espelho-rico.mjs gerar … --commit-ref HEAD~1 …
  "curto": "01851ba",  "completo": "01851baefd58930c6f3ddd3435ca67f0a4779109"
  "data": "2026-09-13T20:45:40-03:00"    "sha256_origem_LF": "99f8c7e2…"   (exit 0)
```

**4.4 O espelho gravado verifica limpo, e a deriva é detectada quando existe (experimento controlado):**

```
$ node scripts/downplant/espelho-rico.mjs verificar --espelho "<repo>/07_Codigo_Leitura/Dominio/ARCA/AdaptadorConsultaArca.js.md"
  "deriva_codigo": false, "sha_desatualizado": false, "commit_velho": false        EXIT_VERIF=0

# experimento em cópia de controle (temp162_drift/, apagado depois):
#  1) cópia intacta  -> "deriva_codigo": false                        EXIT_VERIF_INTACTO=0
#  2) +1 linha na cópia -> "deriva_codigo": true,
#        "sha_origem_agora":   b31657ecae80f9fca37922ecb3b7c75a7bc87c1cb57d0cdde8bee27756ca3a7c
#        "sha_bloco_embutido": 99f8c7e2fb8a44e708aaff9490307d0a154c9897a3a6b512c4b0bbb1522a5338
#                                                                     EXIT_VERIF_MUTADO=2
$ ls -d temp162_drift  ->  ls: cannot access 'temp162_drift': No such file or directory
```

---

## 5. Portões: lint e suíte

**5.1 `node scripts/downplant/lint-estrutura.mjs .` — com o espelho novo dentro de `07_Codigo_Leitura`:**

```
🔍 Verificando Terreno: C:\Users\Bneto04\Documents\Codex\syntheon-gs-downplant-offline

✅ SUCESSO! A arvore documental esta em estrita conformidade com o Down Plant 2.1.
LINT_EXIT=0
```
Os dois links do espelho resolvem (NOTA do sub-módulo e o arquivo de origem) e o código embutido não carrega token de legado.

**5.2 Suíte — `node Testes/RodarTodosOsTestes.js` (executada 2×, estável):**

```
PASS=[630]  FAIL=[0]
"✨ TODAS AS SUÍTES FORAM EXECUTADAS COM SUCESSO!"
SUITE_EXIT=0        (duas execuções independentes, ambas exit 0)
```

**Divergência com o briefing, reportada e não corrigida (card #172 fora do escopo):** o briefing previa `623 PASS / 0 FAIL` com
**exit 1**. Não reproduzi: medi **630 linhas `[PASS]`, 0 `[FAIL]`, exit 0**. Duas causas plausíveis, ambas alheias a esta fatia:
(a) o portão de saída do runner é `process.exitCode` (`Testes/RodarTodosOsTestes.js:142-152`) e nada o elevou nesta execução;
(b) o runner carrega `Testes/TestNormalizadorEfetivo.js` (`Testes/RodarTodosOsTestes.js:83`), arquivo que **não está no Git**
(`?? Testes/TestNormalizadorEfetivo.js`, presente no working tree) — é a explicação mais provável para 630 ≠ 623.
**Não corrigi, não mascarei e não usei isso para justificar nada desta entrega.**

---

## 6. As quatro pontas

| Ponta | Evidência |
| :--- | :--- |
| **CÓDIGO** | artefato espelhado `Dominio/ARCA/AdaptadorConsultaArca.js` (273 linhas, sha256 `99f8c7e2…`) — **não modificado**. Gerador `scripts/downplant/espelho-rico.mjs` (`gerar` + `verificar`). O código de produto entra no espelho verbatim, com o sha declarado (`…\AdaptadorConsultaArca.js.md:15`) e o intervalo do bloco entre as linhas 17 e 291. |
| **DOCUMENTAÇÃO** | Espelho canônico `07_Codigo_Leitura/Dominio/ARCA/AdaptadorConsultaArca.js.md` (339 linhas, 9/9 campos do §46.15) + este relatório. Cabeçalho do §46.15 citado do próprio método: `03_Fundacao/METODO_DOWN_PLANT_PROGRESSIVO_v2.4.md:1029-1043`. |
| **CANVAS/PLANTA** | Endereço `C03_Dominio / MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO / SUB-C03-02-04_ADAPTADOR_PORTA_DE_CONSULTA`, com link para a NOTA do sub-módulo (`…\AdaptadorConsultaArca.js.md:8`). A declaração do artefato é conferida mecanicamente contra a Planta: `…/MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO/NOTA_DE_RESPONSABILIDADE.md:27` (tabela de artefatos físicos, coluna "Submodulo" = `SUB-C03-02-04`) e `…/SUB-C03-02-04_ADAPTADOR_PORTA_DE_CONSULTA/NOTA_DE_RESPONSABILIDADE.md:5,8,11`. Porta declarada: `…/MOD-C03-02_.../NOTA_DE_RESPONSABILIDADE.md:29-30`. Nenhum canvas foi criado ou alterado. |
| **GIT** | Branch `sprint/g01-guardiao-qualidade-live-001`, HEAD `ca87280` (o commit declarado no espelho). O delta está no working tree como `?? 07_Codigo_Leitura/Dominio/` e `?? scripts/downplant/espelho-rico.mjs` (§3). Sem commit, sem push, sem card. |

---

## 7. Limites: o que falta ANTES de escalar para os outros 71

1. **Colisão de token de legado × código verbatim (bloqueio duro, 13/66).** O lint varre `07_Codigo_Leitura` inteiro, inclusive blocos
   cercados, e proíbe `M[0-9]{2}`, `TASK-M[0-9]*`, `planta/`, `file:///` (`scripts/downplant/lint-estrutura.mjs:118`). Espelhos ricos dos
   13 arquivos colidentes nascem com lint **exit 1**. Os 13 medidos nos espelhos existentes: arquivos cujo código embutido contém
   `TASK-M06` (Core/RegrasQualidade, Features/CompiladorGxt, Features/GuardiaoQualidade, Leitura/Adaptador2026,
   Leitura/LeitorAntiguidadePeculio, Motor/DiagnosticoDeterministicoGxt, Motor/PoliticaMeritoArmas, Render/RendererGxt,
   Render/RendererAuditoriaSaude, "CPM – Compilador de Pontuação Mensal"), `M01/M02/M06/M07` (Entrada/EntradaManual),
   `M14/M15/M19` (Entrada/Formulario.html), `M06` (Compilador de Entorpecentes), e o próprio `scripts/downplant/lint-estrutura.mjs`.
   **Decisão necessária do proprietário** (não é decisão desta fatia): (a) escopar a varredura de legado para **ignorar blocos cercados**
   (código verbatim é evidência, não prosa; a integridade continua garantida pelo sha256, que é mais forte que a varredura de token);
   (b) manter a varredura e **excluir `07_Codigo_Leitura` do teste de legado** (preservando validação de links e canvas); ou
   (c) não materializar espelhos de código dentro do repo. Sem essa decisão, escalar para os 71 publica 13 portões vermelhos.
2. **Mapa artefato → endereço canônico (não existe).** Hoje o gerador resolve endereço por id de módulo/sub-módulo. Os 69 endereços
   existentes apontam para o elemento parado `_SUP_158/…/MOD-C00-01_INFRASTRUTURA_CORE`. Escalar exige uma tabela versionada
   (72 linhas: artefato → endereço) e uma decisão sobre o elemento parado (migrar, congelar ou declarar como histórico).
3. **"Portas expostas" ainda é heurística.** O extrator reconhece globais de nível de arquivo + métodos/accessors e **não** entende
   `.html`, `.json` nem `.gs` de Apps Script. Escalar exige (a) extrator por linguagem e (b) reconciliação com a porta **declarada**
   na Planta — senão o campo vira ruído auto-gerado em 66 arquivos.
4. **"Responsabilidade observada" depende de `## Papel`.** Onde a NOTA não tem essa seção, o gerador cai para um fallback (as 2 primeiras
   linhas do documento). É preciso medir quantos dos 72 endereços têm `## Papel` antes de prometer o campo.
5. **Divergência exige declaração humana por artefato.** Os testes mecânicos (T1–T7) pegam endereço parado, artefato não declarado,
   arquivo ausente no commit, conteúdo de disco ≠ commit, deriva do espelho anterior, imprecisão de endereço e duplicidade — mas **não**
   pegam divergência semântica (o que a Planta promete e o código não faz). Hoje isso entra por `--divergencia` na linha de comando.
   Escalar 71 exige um **arquivo de declarações versionado** (1 registro por endereço), senão o campo morre na primeira pressa.
6. **Detecção de duplicidade só vale em lote.** T7 conta espelhos que declaram a mesma origem; para achar pares é preciso rodar depois
   de escrever todos. Hoje: 1 (sem duplicidade).
7. **Link de disco no vault.** O derivado no Obsidian usa caminho absoluto (`C:/Users/…`), porque o vault não é o repo e um link
   relativo não atravessa a fronteira. Decidir se isso basta ou se o vault precisa de cópia do código. No repo o link é relativo e o
   lint o valida a cada execução.
8. **Regra de sha256 precisa ser única e declarada.** O gerador normaliza para LF (aqui o arquivo já é LF, então bate com `sha256sum`).
   Arquivo com CRLF daria sha diferente do `sha256sum` do disco. Recomendação: fixar LF (igual ao blob do Git) e declarar no cabeçalho.
9. **O índice do espelho está velho e não conhece o espelho rico.** `07_Codigo_Leitura/INDICE_AS_IS.md` do vault tem 75 linhas, aponta
   para `_SUP_158/…` e **não lista** `AdaptadorConsultaArca.js`; no repo ele é um stub de 92 bytes. Escalar exige decidir se o índice
   passa a ser derivado do gerador (recomendado) ou se vira dívida declarada.
10. **Ritual de fechamento.** Espelho gerado antes da última mudança de código nasce derivado. O gerador precisa entrar no ritual
    (gerar → verificar → só então fechar) e, idealmente, o `verificar` rodar como portão, não como boa vontade.
11. **Linha de base da suíte instável.** O runner decide o exit por `process.exitCode` (`Testes/RodarTodosOsTestes.js:142-152`) e carrega
    um arquivo fora do Git `Testes/TestNormalizadorEfetivo.js` (`:83`). Enquanto #172 não fechar, "623 PASS / exit 1" e "630 PASS / exit 0"
    convivem, e nenhum número serve como critério de aceite confiável para um lote de 71.

---

## 8. Repro (comandos exatos)

```bash
# canônico (repo)
node scripts/downplant/espelho-rico.mjs gerar \
  --endereco C03_Dominio/MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO/SUB-C03-02-04_ADAPTADOR_PORTA_DE_CONSULTA \
  --origem Dominio/ARCA/AdaptadorConsultaArca.js \
  --saida 07_Codigo_Leitura/Dominio/ARCA/AdaptadorConsultaArca.js.md \
  --anterior <vault>/07_Codigo_Leitura/Dominio/ARCA/AdaptadorConsultaArca.js.md \
  --conta-espelhos <vault>/07_Codigo_Leitura

# derivado (vault)
node scripts/downplant/espelho-rico.mjs gerar … \
  --saida <vault>/07_Codigo_Leitura/Dominio/ARCA/AdaptadorConsultaArca.js.md \
  --vault <vault> --link-disco absoluto

# verificação de deriva (sem regravar)
node scripts/downplant/espelho-rico.mjs verificar --espelho 07_Codigo_Leitura/Dominio/ARCA/AdaptadorConsultaArca.js.md

# portões
node scripts/downplant/lint-estrutura.mjs .
node Testes/RodarTodosOsTestes.js
```

---

## 9. RESULT proposto

```
[HERMES] RESULT — #162 (piloto)

STATUS: ENTREGUE — piloto em 1 artefato; gerador pronto para escalar; escala NÃO executada.

ARTEFATO (1 de 72)
- Dominio/ARCA/AdaptadorConsultaArca.js  (273 linhas, sha256 99f8c7e2fb8a…)
- Endereço: C03_Dominio / MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO / SUB-C03-02-04_ADAPTADOR_PORTA_DE_CONSULTA
- Por que este: endereço declarado ao nível do artefato (MOD…NOTA_DE_RESPONSABILIDADE.md:27), expõe porta real
  (enriquecerDiagnostico), tem espelho anterior DERIVADO para medir antes/depois, e não colide com nenhum gate.
- Por que NÃO o candidato sugerido (scripts/downplant/lint-estrutura.mjs): o próprio lint proíbe 4 tokens que o próprio
  lint contém; espelho verbatim dentro de 07_Codigo_Leitura daria lint exit 1. Medição: 13/69 fontes endereçadas colidem.

CÓDIGO
- scripts/downplant/espelho-rico.mjs (NOVO, 501 linhas, ESM sem dependência): modo `gerar` (endereço + origem → espelho,
  calculando commit/sha256/data NA HORA, com 7 testes mecânicos de divergência) e modo `verificar` (deriva sem regravar).
- Artefato de origem NÃO foi modificado (não aparece em git status).

DOCUMENTAÇÃO
- 07_Codigo_Leitura/Dominio/ARCA/AdaptadorConsultaArca.js.md (NOVO no repo, 339 linhas, 9/9 campos do §46.15).
- Antes (formato antigo, 262 linhas): 3 campos presentes (endereço no nível do MÓDULO, caminho do repo como texto,
  bloco de código) e 1 deles DERIVADO (252 linhas embutidas vs 273; sha do bloco 398221b6c520… vs 99f8c7e2fb8a…;
  1ª divergência na linha 21). Depois: os 9 campos, endereço no SUBMÓDULO, link vivo para o disco, sha256 do bloco,
  responsabilidade derivada da NOTA com fonte citada, portas extraídas, divergência com 7 testes + declaração, última verificação.
- Campos que o formato atual já tinha: endereço Down Plant, arquivo de origem, código embutido, aviso de somente-leitura,
  título ESPELHO — NOME, e SHA-256 (em 63/72, ausente justamente neste).

CANVAS/PLANTA
- Endereço com link para …/SUB-C03-02-04_ADAPTADOR_PORTA_DE_CONSULTA/NOTA_DE_RESPONSABILIDADE.md.
- Declaração do artefato conferida mecanicamente contra a Planta (MOD…:27, coluna Submodulo = SUB-C03-02-04) — teste T2 OK.
- Porta declarada conferida: MOD…:29-30 e SUB…:6. Nenhum canvas criado/alterado.

GIT
- Branch sprint/g01-guardiao-qualidade-live-001, HEAD ca87280ac99dee798d598453ef94708894008a3d (declarado no espelho).
- Delta no working tree: ?? 07_Codigo_Leitura/Dominio/  e  ?? scripts/downplant/espelho-rico.mjs. Sem commit/push/card.

EVIDÊNCIA TIPADA
- 03_Fundacao/METODO_DOWN_PLANT_PROGRESSIVO_v2.4.md:1029-1043 (template §46.15 lido do próprio método)
- 02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO/NOTA_DE_RESPONSABILIDADE.md:27,29-30
- …/MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO/submodulos/SUB-C03-02-04_ADAPTADOR_PORTA_DE_CONSULTA/NOTA_DE_RESPONSABILIDADE.md:5,8,11
- scripts/downplant/lint-estrutura.mjs:95,118
- Testes/RodarTodosOsTestes.js:83,142-152
- 07_Codigo_Leitura/Dominio/ARCA/AdaptadorConsultaArca.js.md:8,9,10,11,13,15,17-291,293,304,311,335  (+ vault homólogo)

PORTÕES
- node scripts/downplant/lint-estrutura.mjs .  ->  "SUCESSO! … estrita conformidade com o Down Plant 2.1."   LINT_EXIT=0
- node Testes/RodarTodosOsTestes.js            ->  PASS=[630]  FAIL=[0]  SUITE_EXIT=0  (2 execuções, estável)
  Divergência do briefing: era esperado 623 PASS / exit 1; não reproduzido. Reportado, NÃO corrigido (card #172 fora
  do escopo). Causas prováveis: portão de saída por process.exitCode e require de um arquivo fora do Git
  (Testes/TestNormalizadorEfetivo.js). Não usei isso para justificar nada.

FRESCOR (provas)
- git rev-parse HEAD = ca87280ac99dee798d598453ef94708894008a3d = campo "Commit de referência" do espelho.
- sha256sum Dominio/ARCA/AdaptadorConsultaArca.js = 99f8c7e2… = "sha256 do bloco" do espelho.
- Reexecução: data 20:45:20 -> 20:45:39, commit/sha inalterados (nada congelado em código).
- --commit-ref HEAD~1: commit do espelho passou a 01851ba… (o campo é lido do Git na geração).
- verificar no espelho gravado: deriva_codigo=false, sha_desatualizado=false, commit_velho=false (exit 0).
- experimento controlado de mutação: +1 linha na origem -> deriva_codigo=true, sha 99f8c7e2… -> b31657ec…, exit 2 (temp apagado).

LIMITES (o que falta antes de escalar para os 71)
1) Colisão dura lint × código verbatim: 13 dos 66 arquivos com código embutido contêm token que o lint proíbe; publicar seus
   espelhos ricos no repo dá exit 1. Precede decisão do proprietário: (a) varredura de legado ignorando blocos cercados,
   (b) excluir 07_Codigo_Leitura da varredura de legado mantendo links/canvas, ou (c) não materializar espelho de código no repo.
2) Falta o mapa artefato→endereço canônico (72 linhas) e a decisão sobre o elemento parado _SUP_158/MOD-C00-01_INFRA…CORE,
   para onde hoje apontam 69 dos 72 endereços.
3) "Portas expostas" é heurística (não cobre .html/.json/.gs) e precisa reconciliar com a porta declarada na Planta.
4) Medir cobertura de "## Papel" nos 72 endereços (fallback hoje é as 2 primeiras linhas do documento).
5) Trocar --divergencia de CLI por arquivo de declarações versionado (71 declarações humanas são inevitáveis).
6) Rodar T7 (duplicidade) só depois de escrever todos os espelhos.
7) Decidir o link de disco no vault (hoje absoluto, por fronteira de vault) e fixar a regra única de sha256 (LF).
8) Índice do espelho (INDICE_AS_IS.md, 75 linhas, sem AdaptadorConsultaArca) precisa virar derivado do gerador.
9) Colocar gerar→verificar no ritual de fechamento, com `verificar` como portão.
10) Estabilizar a linha de base da suíte (#172) antes de usar PASS/exit como critério de aceite de um lote.
```
