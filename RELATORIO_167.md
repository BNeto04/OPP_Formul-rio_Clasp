# RELATÓRIO — #167 · DP24-004 — Integrar §31.4/§31.6 e o Vigia de Dependências (§7.8)

**Card:** #167 (`DP24-004`) · **Pai:** #57 · **Método canônico:** `03_Fundacao/METODO_DOWN_PLANT_PROGRESSIVO_v2.4.md` (commit `42ca47e`)
**Repo:** `C:\Users\Bneto04\Documents\Codex\syntheon-gs-downplant-offline` · **Branch:** `sprint/g01-guardiao-qualidade-live-001` · **HEAD:** `99877b4cc6d7c383e5328f1321e9b8202ddae2fa`
**Natureza desta fatia:** delta cirúrgico de **documentação/contrato + 1 validador + 1 fechadura**. **Nenhum** arquivo de produto foi tocado.
**Parada:** a fatia **termina aqui**. Nada foi commitado, empurrado, postado; nenhum card criado; #172 intocado; as fatias dependentes (#168) **não** foram iniciadas.

---

## 1. Cadeia obrigatória da fatia (diretriz #174) — declarada etapa a etapa

| Elo | Declaração |
|---|---|
| **INTENÇÃO** | integrar §31.4/§31.6 (vínculo de tecnologia existente a Módulo/Circuito/Porta) e implantar o **Vigia de dependências** (§7.8) como *observa, compara e reporta* — **sem** decidir nem atualizar. Card #167, `DONE`: "Vínculos completos conforme §31.6; relatório §46.14 implantado e preenchível; nada de atualização automática de dependência". |
| **CAPACIDADE** | já existia: os **4 registros `dependencias/DEP-00X` + `INDICE.md`** (#153), as **25 Portas §46.3** (#164), as **2 Instalações transversais** (#155/#164), o **lint estrutural** e a **suíte** (700 PASS). Faltava: **campos do §31.6**, **Decisão §46.4**, **vínculo Módulo/Circuito/Porta**, e **qualquer** papel de Vigia. |
| **CONTRATO** | §31.6 (`METODO...:507`): nome, versão, fonte, data da decisão, Decisão associada · §7.8 (`:232-234`): irmão do Curador, **não decide** · §46.14 (`:1016-1028`): formato do relatório · §46.4 (`:808-818`): formato da Decisão · §40.5 (`:686`): `dependencias/` na cápsula · §40.8 (`:702`): lint detecta "dependência vinculada sem registro de decisão" · §8.11 (`:259-260`): Instalação transversal. |
| **TAREFA** | completar os vínculos **nos registros existentes** (integrar, não recriar) + implantar o Vigia (mecanismo + relatório, observação assistida nesta fatia) + a **fechadura** que prova o vínculo e a **não-mutação**. |
| **PROVA** | `arquivo:linha` + saída real colada neste relatório: lint `exit 0`, suíte **728 PASS / 0 FAIL / exit 0**, fechadura **28 PASS / 0 FAIL / exit 0**, validador **82 OK / 4 PENDENTE_DECLARADA / 0 BLOQUEANTE / exit 0**, RED→GREEN com `sha256sum -c` **16/16 OK / exit 0**. |

---

## 2. MEDIÇÃO ANTES — o que já existia (com `arquivo:linha`)

### 2.1 Comandos e saída real (baseline no HEAD `99877b4`)

```text
$ git ls-tree -r --name-only HEAD -- dependencias | wc -l
5                              # DEP-001..DEP-004 + INDICE.md  (registro §31.6 do #153)

$ # ocorrencias dos campos do §31.6 em dependencias/ no HEAD:   (por arquivo, somadas)
  "^versao:"        -> 0
  "^fonte:"         -> 0
  "^data_decisao:"  -> 0
  "^decisao:"       -> 0
  "Vinculo estrutural" -> 0
  "## Vigia"           -> 0

$ git ls-tree -r --name-only HEAD | grep -c "^02_Comodos/.*/portas/PORTA-"
25                             # Portas §46.3 materializadas no #164
$ git ls-tree -r --name-only HEAD | grep -c "INSTALACOES_TRANSVERSAIS/INST-"
2                              # INST-EXEC-001 (#155) + INST-SERIALIZACAO-001 (#164)
$ git grep -l "dependencias/DEP-" HEAD -- "*.md" | wc -l
13                             # documentos que já apontam para os registros DEP-*
$ git ls-tree -r --name-only HEAD -- scripts/downplant | grep -c "\.mjs$"
5                              # lint-estrutura · contar-regras-arca · espelho-rico · validar-handoff · validar-portas
$ node Testes/RodarTodosOsTestes.js   -> exit 0 · 700 [PASS] · 0 [FAIL]
```

### 2.2 O que cada elemento era

| Elemento existente | Onde (medido) | Estado no HEAD |
|---|---|---|
| Registro de dependências (§31.6) | `dependencias/INDICE.md:14-19` · `dependencias/DEP-001_GOOGLE_APPS_SCRIPT.md:1-10` (+3 irmãos) | **existia** com `id/nome/tipo/vinculo/estado/comodos/cards/data_registro` e corpo `Vinculo · Evidencia · Versao/estado · Falha · Limite`. **Sem** `versao`, `fonte`, `data_decisao`, `decisao`, **sem** vínculo a Módulo/Circuito/Porta. |
| Cápsulas dos Módulos (§40.5) | `02_Comodos/C00_Governanca_Estrutural/01_Dominio/modulos/MOD-C00-01_ESTRUTURA_DO_COFRE/MOD-C00-01_ESTRUTURA_DO_COFRE.md:65` e +12 docs | **já vinculavam** os Módulos aos registros (`../../../../../dependencias/DEP-*.md`) — 13 arquivos. O vínculo Módulo↔DEP **não** foi recriado. |
| Portas §46.3 (§12.6/§46.3) | bloco `PORTA-REGISTRY-V1` em `02_Comodos/C00_Governanca_Estrutural/03_Especificacoes/INVENTARIO_PORTAS_E_CHECKLIST_12_6.md:54-98` + 25 arquivos `portas/PORTA-*.md` | **existiam**. Foram **citadas** por caminho (`:1`, linha do título `# PORTA C01/MOD-C01-01/P05 — …`). |
| Instalações transversais (§8.11) | `02_Comodos/C00_Governanca_Estrutural/03_Especificacoes/INSTALACOES_TRANSVERSAIS/INST-SERIALIZACAO-001_ESCRITA_GLOBAL.md` · `INST-EXEC-001_ENDPOINT_DE_EXECUCAO.md` | **existiam** (2). Nenhuma foi recriada; a `INST-SERIALIZACAO-001` é citada como cobertura da concorrência da Porta de log. |
| Inventário de capacidades externas (§31.1/§31.4) | `06_Inventario/EXTERNAL_CAPABILITY_REGISTRY.md:37-164` (5 capacidades: Graphify, Improve, Ponytail, Ruflo, Open Design, com `PLANT_ADDRESS`/`PORT`/`DECISION`) | **registry de CAPACIDADE** (ferramentas para agentes), **não** o registro de dependência §31.6 do produto. **Não tocado** (ver §11, D-167-02). |
| Inventário AS-IS | `06_Inventario/INVENTARIO_AS_IS.md:11-19` | **desatualizado** (aponta branch `refactor/down-plant-gs-offline`, HEAD `1f91661`, "17 arquivos ativos" contra os 309 `.js` de hoje). **Não atualizado** (D-167-03). |
| Lint estrutural (§40.8) | `scripts/downplant/lint-estrutura.mjs` (5.º `.mjs` da pasta) | roda **exit 0**; o manifesto declara `dependencias/` **fora** da varredura (`03_Fundacao/ESTRUTURA_DO_COFRE.md:37`). |

### 2.3 O que **faltava** exatamente para cumprir §31.4/§31.6 e §7.8

| # | Falta medida | Exigência |
|---|---|---|
| F1 | `versao`, `fonte`, `data_decisao`, `decisao` em **0/4** registros | §31.6 — `METODO...:507` |
| F2 | **Decisão associada (§46.4)**: 0 arquivos `DEC-*` no repositório (`grep -rn "DEC-"` só encontra o template em `METODO...:809`) | §31.6 + §46.4 (`:808-818`) |
| F3 | **Vínculo Módulo/Circuito/Porta**: 0 seções; só `comodos: [...]` no cabeçalho | §31.6 + §31.4 (`:484-503`) + §46.14 (`:1021`) |
| F4 | **Vigia de dependências**: 0 mecanismo, 0 relatório, 0 rotina; nenhuma menção a §7.8 fora do próprio método | §7.8 — `METODO...:232-234` |
| F5 | **Formato §46.14** não implantado (nem modelo nem relatório preenchível) | §46.14 — `METODO...:1016-1028` |
| F6 | **Fechadura** do vínculo/§40.8 inexistente; nada impedia "dependência vinculada sem registro de decisão" | §40.8 — `METODO...:702` |

**Divergência de baseline declarada (D-167-01):** o briefing descreve "uma fatia anterior já criou **3 Portas novas e 1 INST**". Medido nesta branch: **25** Portas §46.3 (`f745034`, #164) e **2** INST (`c8964b0`/`5839c3d`, #155 · `fff5daa`, #164). Não localizei fatia "3+1" no histórico da branch — usei a árvore **medida** como baseline.

---

## 3. DELTA APLICADO (só o que faltava — 12 arquivos, 0 recriados)

### 3.1 Vínculos completados nos 4 registros existentes (§31.6)

Por registro (`arquivo:linha` do delta):

| Registro | Campos §31.6 acrescentados | Seção de vínculo estrutural | Seção do Vigia |
|---|---|---|---|
| `dependencias/DEP-001_GOOGLE_APPS_SCRIPT.md` (94 l.) | `:10` versao `V8` · `:11` fonte (release notes + feed) · `:12` data_decisao · `:13` decisao `DEC-DEP-001` · `:14` vigia | `:29` (tabela `:38`) — **12 Portas** | `:53` |
| `dependencias/DEP-002_GOOGLE_SHEETS.md` (96 l.) | `:10-14` (versao `NAO_PINADA`) | `:29` (tabela `:38`) — **10 Portas** | `:51` |
| `dependencias/DEP-003_CLASP_DEPLOY.md` (92 l.) | `:10-14` (versao `AUSENTE_DECLARADO`) | `:29` (tabela `:38`) — **8 Portas** | `:49` |
| `dependencias/DEP-004_ABAS_E_BASES_CANONICAS.md` (93 l.) | `:10-14` (versao `1.0.0 (AIS)`) | `:29` (tabela `:38`) — **7 Portas** | `:48` |

**Formato do vínculo** (5 colunas, exigido pela fechadura e pelo validador):
`| Modulo | Circuito | Porta | Papel da dependencia na Porta | Vinculo (arquivo:linha) |`

- **37 vínculos** declarados (12 + 10 + 8 + 7), todos com `arquivo:linha` do artefato §46.3 **da própria Porta** — medido: `12 · 10 · 8 · 7 = 37`.
- Ausências **declaradas**, nunca supridas por inferência: `AUSENTE_DECLARADO` (circuito inexistente) e `SEM_ARQUIVO_46.3` (Porta declarada só na cápsula; vinculo cita a linha da cápsula) → contam como `PENDENTE_DECLARADA` no validador (4 no total).
- **Correções factuais medidas** (2, ambas declaradas): `DEP-001:7` e `DEP-002:7` passaram a incluir `C00` em `comodos:` — a Porta `PORTA-C00-03-P01` (log de auditoria em aba do Sheets) pertence a `MOD-C00-03`, que a cápsula já vinculava a `DEP-001` (`MOD-C00-03_INFRAESTRUTURA_CORE.md:66`).
- `dependencias/INDICE.md:14` — a tabela de registros ganhou `Versao` e `Decisao`; `:27` decisões associadas; `:33` bloco do Vigia. **Nada foi removido** do #153.

### 3.2 Decisões associadas (§46.4) — 4 arquivos novos

`dependencias/decisoes/DEC-DEP-001_RUNTIME_GOOGLE_APPS_SCRIPT.md` · `DEC-DEP-002_PLANILHA_OPERACIONAL.md` · `DEC-DEP-003_CLASP_PUBLICACAO.md` · `DEC-DEP-004_BASES_CANONICAS.md`.
Cada um com os **9 campos** do template §46.4 (`:808-818`), verificados na fechadura (`Testes/TestVigiaDependencias.js:180`): `Estado · Data · Localizacao · Contexto · Decisao · Alternativas · Consequencias · Riscos · Condicao de revisao`.
Natureza declarada em cada arquivo: **registro retroativo** do vínculo — o uso precede o registro; não há decisão nova neste card.
Decisão registrada em cada: `ADOTAR (manter)`, com alternativas **construir/adaptar** explicitamente rejeitadas e a condição de revisão disparada pelo relatório do Vigia.

### 3.3 Vigia de dependências implantado (§7.8 / §46.14)

| Artefato | Papel |
|---|---|
| `scripts/downplant/vigia-dependencias.mjs` | o **mecanismo** — observa (lê registro + observação upstream), **compara** (`:133` `comparar`), **reporta** (`:183` `montarRelatorio`). `:35` lista as flags de mutação que ele **recusa** |
| `dependencias/vigia/UPSTREAM_OBSERVADO.json` | o **insumo de observação** (real, de 2026-09-14) — mantido por quem observa, **não** pelo Vigia |
| `dependencias/vigia/RELATORIO_VIGIA_2026-09-14.md` | o **primeiro relatório real**, gerado pelo próprio mecanismo, no formato §46.14 |
| `dependencias/vigia/LEIAME_VIGIA.md` | como opera + o que ele se recusa a fazer |
| `scripts/downplant/validar-dependencias.mjs` | **validador canônico** da família (operacionaliza o §40.8): `:47` campos do §31.6 · `:53-54` seções obrigatórias · `:110` validação por registro · `:238` CLI/exit codes |
| `Testes/TestVigiaDependencias.js` + bloco em `Testes/RodarTodosOsTestes.js` | a **fechadura** (28 PASS) e seu registro na suíte |

---

## 4. DESENHO DO VIGIA — o que ele observa e o que ele **se recusa** a fazer

**Contrato (verbatim do método, citado no próprio código do mecanismo, `vigia-dependencias.mjs:8-10`):**
> §7.8 (`:234`): "O Vigia **não decide** adotar ou trocar uma dependência por conta própria — apenas **observa, compara e reporta** ao Planejador ou Proprietário."
> §31.6 (`:508`): "**nunca aplica** a atualização por conta própria."

| Ele **OBSERVA** | Ele **COMPARA** | Ele **REPORTA** |
|---|---|---|
| o vínculo de cada `DEP-*` (nome, `versao` registrada, `fonte`, `decisao`); a fonte externa declarada no campo `fonte`; a observação registrada em `vigia/UPSTREAM_OBSERVADO.json` | `versao` registrada × `versao_observada`, item a item (`:133-172`) | o relatório §46.14 com as 7 seções verbatim + `Estado do Vigia`: `SINCRONIZADO` \| `DEFASADO` \| `NENHUMA AÇÃO` (`:236-239`) |

**O que ele se RECUSA a fazer (provado na fechadura):**
1. **Não aplica atualização, não troca dependência, não edita o registro.** Recusa `--aplicar`, `--atualizar`, `--fix`, `--auto`, `--write-registry`, `--escrever`, `--patch`, `--upgrade` com **exit 1** e mensagem de contrato (`:35-63`). Provado: `Testes/TestVigiaDependencias.js:334`, `:401`.
2. **Não muta nada.** Sem `--out` explícito escreve **somente em stdout**; com `--out`, escreve **somente aquele arquivo**. Provado por `sha256` da árvore antes/depois em 4 cenários: `:347`, `:357`, `:368`, `:410` (+ no repositório real).
3. **Não "auto-corrige" a versão registrada.** Com upstream divergente (`V99` × registrado `V8`), o relatório diz `DEFASADO` e a linha `versao: "V8"` continua **byte-idêntica** — o estado global passa a ser o **pior** observado (`:368-389`).
4. **Não inventa dado upstream.** Sem observação registrada, o item sai como `NENHUMA AÇÃO` — **nunca** `SINCRONIZADO` por suposição (`:390-400`). Ausência de dado é declarada, não preenchida.
5. **Não é portão de build.** O exit code é 0 sempre que consegue relatar; a defasagem é **informada**, não convertida em bloqueio (`vigia-dependencias.mjs:23-25`).

**Primeiro relatório real (`dependencias/vigia/RELATORIO_VIGIA_2026-09-14.md`), estado `DEFASADO`:**

| Registro | Registrada | Observada | Estado |
|---|---|---|---|
| DEP-001 | `V8` | `V8` (release notes de 2026-08-03; a deprecação citada é a do runtime **Rhino**, não do V8) | **SINCRONIZADO** |
| DEP-002 | `NAO_PINADA` | — (planilha viva, sem leitura remota autorizada nesta fatia) | **NENHUMA AÇÃO** |
| DEP-003 | `AUSENTE_DECLARADO` | `3.4.1` (npm `dist-tags.latest`; releases do GitHub param em `v3.3.0`, 2026-03-12 — **as duas fontes divergem entre si**) | **DEFASADO** |
| DEP-004 | `1.0.0 (AIS)` | `1.0.0` (cópia versionada; a base viva **não** foi observada) | **SINCRONIZADO** |

`Recomendação` do item defasado: *registrar a versão instalada no campo `versao` do vínculo* — **decisão humana necessária: Sim**. O Vigia **não** registra, **não** instala e **não** atualiza: ele devolve o candidato.

**Verificação periódica declarada:** assistida/manual nesta fatia (o card autoriza: "pode ser manual/assistida"). Rodada = (1) observar a `fonte` de cada registro e gravar o resultado em `vigia/UPSTREAM_OBSERVADO.json`; (2) `node scripts/downplant/vigia-dependencias.mjs`; (3) materializar com `--out`. **Frescor é portão:** o relatório em disco tem de ser reproduzível por uma geração atual — a fechadura fica vermelha se ele divergir (`Testes/TestVigiaDependencias.js:328`).

---

## 5. PROVA DE QUE NADA EXISTENTE FOI REIMPLEMENTADO

| Capacidade que **já existia** | Onde já existia (medido) | Como foi **integrada** (não recriada) |
|---|---|---|
| Registro de dependências §31.6 | `dependencias/` (5 arquivos, #153) | **4 arquivos editados** (+1 `INDICE.md`). Nenhum arquivo novo de registro foi criado; o de #153 foi **preservado** (só acrescentado) |
| Cápsulas ↔ registro DEP | 13 documentos citam `dependencias/DEP-*` | **não editadas** — o vínculo Módulo↔DEP já existia e foi preservado; o delta ligou **Circuito/Porta** dentro do registro |
| Portas §46.3 (§12.6) | 25 arquivos `portas/PORTA-*.md` (#164) | **25 → 25** (nenhuma criada, nenhuma editada). Foram **citadas** por `arquivo:linha` do próprio artefato |
| Instalações transversais §8.11 | 2 arquivos `INST-*` (#155/#164) | **2 → 2**. A `PORT A-C00-03-P01` segue coberta pela `INST-SERIALIZACAO-001` |
| Lint estrutural §40.8 | `scripts/downplant/lint-estrutura.mjs` | **não estendido** — o manifesto declara `dependencias/` fora da varredura (`03_Fundacao/ESTRUTURA_DO_COFRE.md:37`). O §40.8 é operacionalizado pelo **validador da família** (ver D-167-05) |
| Padrão de validador canônico por família | `validar-portas.mjs` (§12.6) · `validar-handoff.mjs` (§32.14) | o novo `validar-dependencias.mjs` **segue o mesmo padrão** (CLI, estados, exit) — precedente reusado, não reinventado |
| Padrão de fechadura na suíte | `TestValidarChecklistProducaoPortas.js` (#164) | a nova fechadura **copia a estrutura** (`test()`, chamada do validador como CLI, fixtures/negativos, `process.exitCode`) |
| Runner da suíte | `Testes/RodarTodosOsTestes.js` | **1 bloco** acrescentado (8 linhas), na convenção do #163/#164. Nenhum teste existente foi alterado |

**Nada de produto:** `git diff --stat` mostra **0** arquivos de `Core/`, `Features/`, `Entrada/`, `Render/`, `Dominio/`, `Motor/`, `Leitura/`, `Drivers/` ou raiz (fora relatórios). Nenhum `clasp push`.

---

## 6. ANTES / DEPOIS medido

| Métrica | ANTES (HEAD `99877b4`) | DEPOIS | Δ |
|---|---|---|---|
| Arquivos em `dependencias/` | 5 (`:1` tabela sem versão/decisão) | **12** (+4 DEC, +3 vigia) | +7 |
| Campos §31.6 (`versao`/`fonte`/`data_decisao`/`decisao`) | **0 / 0 / 0 / 0** | **4 / 4 / 4 / 4** | +16 |
| Decisões §46.4 no repositório | **0** | **4** (9/9 campos cada) | +4 |
| Seções `Vinculo estrutural (§31.4/§31.6)` | **0** | **4** | +4 |
| Vínculos Módulo/Circuito/Porta declarados | **0** | **37** | +37 |
| Seções `Vigia (§7.8/§46.14)` nos registros | **0** | **4** | +4 |
| Relatórios §46.14 implantados | **0** | **1** (estado `DEFASADO`) | +1 |
| Mecanismo do Vigia | **0** | **1** (`vigia-dependencias.mjs`) | +1 |
| Validadores em `scripts/downplant` | 5 `.mjs` | **7 `.mjs`** | +2 |
| Portas §46.3 do produto | 25 | **25** | **0** (nada recriado) |
| Instalações transversais | 2 | **2** | **0** (nada recriado) |
| Fechadura do vínculo/§40.8 | **inexistente** | **28 PASS / 0 FAIL** | nova |
| Lint estrutural | `exit 0` | **`exit 0`** | = |
| Suíte integral | **700 PASS / 0 FAIL / exit 0** | **728 PASS / 0 FAIL / exit 0** | **+28** (exatamente a fechadura nova) |
| Contagem de `.js` da suíte | `308 (84 no push / 224 fora)` | `309 (84 / 225)` | +1 (o teste novo; fora do push, como os demais) |

---

## 7. RED → GREEN (com reversão e `sha256sum -c`)

**Backup íntegro antes da reversão:** 16 arquivos do delta → `sha256sum -c` **16/16 OK** (`ARQUIVOS_NO_BACKUP=16`).

**(1) RED — artefatos guardados revertidos** (`git checkout` nos 5 rastreados + `rm -rf dependencias/decisoes dependencias/vigia`), **mantendo** validador e fechadura no lugar:

```text
secoes 'Vinculo estrutural' restantes: DEP-001:0, DEP-002:0, DEP-003:0, DEP-004:0
arquivos em dependencias/: 5

$ node scripts/downplant/validar-dependencias.mjs
RESULTADO §31.6/§7.8: 0 OK / 0 PENDENTE_DECLARADA / 28 BLOQUEANTE
VALIDADOR_EXIT=1

$ node Testes/TestVigiaDependencias.js
  [FAIL] o validador passa no repositorio real com exit 0 e 0 pendencia BLOQUEANTE: exit 1
  [FAIL] todo registro declara nome, versao, fonte, data_decisao e decisao (§31.6): DEP-001_GOOGLE_APPS_SCRIPT.md: campo "versao" ausente/vazio
  [FAIL] a Decisao associada (§46.4) existe e tem os 9 campos do template: ENOENT ... \dependencias\decisoes
  [FAIL] todo registro vincula Modulo/Circuito/Porta com vinculo arquivo:linha existente: DEP-001...: tabela de vinculo sem linhas
  [FAIL] todo registro declara o Vigia, o mecanismo e a recusa de aplicar (§7.8): DEP-001...: secao do Vigia ausente
  [FAIL] RED-3..RED-10 (8 cenarios que dependem dos alvos reais revertidos)
RESULTADOS FINAIS: 9 PASS / 19 FAIL
FECHADURA_EXIT=1
```

**(2) GREEN — delta restaurado do backup:**

```text
$ sha256sum -c <manifesto do delta>
16/16 : OK          (nenhuma linha != OK)
SHA256SUM_C_EXIT=0

$ node scripts/downplant/validar-dependencias.mjs        -> VALIDADOR_EXIT=0
RESULTADO §31.6/§7.8: 82 OK / 4 PENDENTE_DECLARADA / 0 BLOQUEANTE

$ node Testes/TestVigiaDependencias.js                    -> FECHADURA_EXIT=0
RESULTADOS FINAIS: 28 PASS / 0 FAIL

$ node scripts/downplant/lint-estrutura.mjs               -> LINT_EXIT=0
```

**Verde por herança descartado:** `exit 0` de um lado **não** é aceito como prova do outro — o RED foi produzido **revertendo os artefatos guardados**, não afrouxando o teste; os 11 cenários de mutação controlada (`Testes/TestVigiaDependencias.js:265-310`) provam os dentes contra cópias do registro real.

---

## 8. LINT, SUÍTE E FECHADURAS (PASS/FAIL **e** exit)

| Portão | Saída real | Exit |
|---|---|---|
| `node scripts/downplant/lint-estrutura.mjs` | `✅ SUCESSO! A arvore documental esta em estrita conformidade com o Down Plant 2.1.` | **0** |
| `node Testes/RodarTodosOsTestes.js` (integral) | **728 PASS / 0 FAIL** · `✨ TODAS AS SUÍTES FORAM EXECUTADAS COM SUCESSO!` | **0** |
| `node Testes/TestVigiaDependencias.js` (fechadura #167) | **28 PASS / 0 FAIL** | **0** |
| `node scripts/downplant/validar-dependencias.mjs` (validador §31.6/§7.8) | **82 OK / 4 PENDENTE_DECLARADA / 0 BLOQUEANTE** | **0** |
| `node scripts/downplant/vigia-dependencias.mjs` (relatório §46.14) | relatório completo, estado `DEFASADO` | **0** |
| `node scripts/downplant/vigia-dependencias.mjs --aplicar` (recusa) | `pedido de mutacao recusado - "--aplicar"` | **1** |
| `node scripts/downplant/validar-portas.mjs` (não afetado — regressão) | inalterado; coberto pela suíte | **0** |
| Suíte **antes** desta fatia | 700 PASS / 0 FAIL | 0 |

As **700 PASS** anteriores continuam íntegras: o único efeito fora da fechadura nova é a contagem de `.js` do próprio runner (`308 → 309`), refletida no teste de carregamento e **verde**.

**Repetição da suíte (5 execuções completas, caracterizando estabilidade):**

| # | Log | Estado do delta | PASS | FAIL | `exit` |
|---|---|---|---|---|---|
| 1 | `suite_antes_167.log` | **antes** (HEAD `99877b4`) | 700 | 0 | **0** |
| 2 | `suite_depois_167.log` | depois | 728 | 0 | **0** |
| 3 | `suite_final_167.log` | depois | 728 | 0 | **0** |
| 4 | `suite_167_final2.log` | depois | 722 | 0 | **1** ← flake pré-existente (D-167-08) |
| 5 | `suite_run6.log` | depois | 728 | 0 | **0** |

**Prova adicional de não-mutação no nível da suíte:** depois das 5 execuções, `sha256sum -c` do delta do #167 continua **16/16 OK** — nenhuma execução da suíte (nem a própria fechadura) alterou **1 byte** do que esta fatia escreveu.

---

## 9. AS QUATRO PONTAS (#57)

- **`CODE_STATE` — NÃO APLICÁVEL ao produto / verificado.** Nenhum arquivo de produto foi tocado. Os 3 arquivos executáveis da fatia são: `scripts/downplant/vigia-dependencias.mjs`, `scripts/downplant/validar-dependencias.mjs` (bancada de governança, fora do Apps Script — `scripts/**` está no `.claspignore`) e `Testes/TestVigiaDependencias.js`. Provado por `git diff --stat` (§12) e por `clasp push` **não** executado.
- **`DOC_STATE` — ELEVADO.** 4 registros §31.6 completos (nome, versão, fonte, data da decisão, Decisão) + 37 vínculos Módulo/Circuito/Porta + 4 Decisões §46.4 + `INDICE.md` reconciliado + `LEIAME_VIGIA.md` + relatório §46.14 + este relatório. Antes: 0 campos, 0 decisões, 0 vínculos.
- **`CANVAS_STATE` — INALTERADO por decisão.** Nenhum `.canvas` editado, nenhum nó/aresta novo: os circuitos já existiam e o delta apenas os **cita** (`Circuito` = canvas do Módulo dono, verificado no validador). `MOD-C00-03_INFRAESTRUTURA_CORE` **não tem** canvas — declarado como `AUSENTE_DECLARADO` em vez de inventado (`DEP-001:40`, `DEP-002:40`).
- **`GIT_STATE` — 🟡 NÃO PROVADO (correto por protocolo, B1).** Nada commitado nesta fatia (proibido pelo briefing). As provas colhidas estão em §12; os `exit` de `git add`/`git commit` **serão preenchidos pelo Executor principal**. Declarar `GIT 🟢` aqui seria exatamente o anti-padrão que o B1 proíbe.

---

## 10. DIVERGÊNCIAS / PENDÊNCIAS DECLARADAS (não escondidas)

| ID | Achado | Estado |
|---|---|---|
| **D-167-01** | Briefing cita "3 Portas novas + 1 INST" de fatia anterior; medido nesta branch: **25 Portas** §46.3 (#164) e **2 INST** (#155/#164). Nenhuma fatia "3+1" localizada no histórico | **declarado** — baseline usada foi a árvore medida |
| **D-167-02** | `06_Inventario/EXTERNAL_CAPABILITY_REGISTRY.md:37-164` é registry de **capacidade** (Graphify, Improve, Ponytail, Ruflo, Open Design — ferramentas para agentes), **não** o registro de dependência §31.6 do produto; seus itens declaram `PLANT_ADDRESS`/`PORT`/`DECISION`, mas 3 dos 5 Portas referenciadas **não existem** como artefato | **fora do delta** (tocá-lo seria expansão de escopo). Candidato a card próprio |
| **D-167-03** | `06_Inventario/INVENTARIO_AS_IS.md:11-19` desatualizado (branch/HEAD/contagem de outra era) | **fora do delta** |
| **D-167-04** | O card fala em "5 itens" em `dependencias/`; medido: **5 arquivos** = 4 registros + `INDICE.md` (não 5 registros) | **declarado** |
| **D-167-05** | §40.8 manda o lint detectar "dependência vinculada sem registro de decisão"; o manifesto declara `dependencias/` **fora** da varredura do lint (`ESTRUTURA_DO_COFRE.md:37`) | §40.8 operacionalizado pelo **validador da família** (`validar-dependencias.mjs`), não pelo lint de árvore. Ligar o lint diretamente exigiria mudar o manifesto — **proposta, não executada** |
| **D-167-06** | **Defasagem real (não corrigida, por contrato):** `DEP-003` (clasp) — versão **nunca registrada**; observado `3.4.1` no npm contra `v3.3.0` nas releases do GitHub; os dois números de publicação dos cards (`81/81` × `68`) seguem **não reconciliados** | **reportada pelo Vigia** (`RELATORIO_VIGIA_2026-09-14.md`, `DEFASADO`). **Decisão humana necessária: Sim.** O Vigia não aplica |
| **D-167-07** | `DEP-002` (planilha) e `DEP-004` (base viva): a observação cobre a **cópia versionada** e a **declaração**, não o estado vivo da planilha (sem leitura remota autorizada nesta fatia) | **limite declarado** no próprio relatório e no registro |
| **D-167-08** | **Flake pré-existente, fora do delta, NÃO mascarado:** na 4.ª execução da suíte, `Testes/TestVigiaTelegramInterlocucao.js:151` (Teste F — "Sessão gráfica bloqueada → DEFER_LOCKED") falhou com `AssertionError: Deve avisar sobre deferimento` → `exit 1` (722 PASS). A asserção só é satisfeita quando `res.action === 'DEFER_LOCKED'` (`VigiaPonte/TelegramCommandRouter.js:172-176`); o texto alternativo é `⚠️ Envio de V adiado: …` (`:180`), dependente do gate de prontidão (`VigiaPonte/OperationalResumeController.js:154-190`, com poll de processo de 2 s). Medido: o teste passa **3/3 isolado**; a suíte ficou **verde em 4 das 5 execuções** (a 1.ª antes da fatia, com 700 PASS; 3 das 4 seguintes, com 728 PASS) e **vermelha em 1** (722 PASS, `exit 1`). **Nenhum** arquivo de `VigiaPonte/**` foi tocado por esta fatia e `VigiaPonte/conversation_memory.json` **já aparecia como `M` no status colhido ANTES de qualquer escrita** — estado compartilhado persistente entre execuções da família VigiaPonte | **declarado** como flake da família VigiaPonte (timing/estado compartilhado), **sem** relação causal com o delta do #167. **Candidato a card próprio** — aqui não foi corrigido (seria escopo alheio) nem escondido |

---

## 11. FORA DO DELTA (o que deliberadamente **não** foi feito)

1. **Nada de atualizador automático** — proibido; o Vigia só relata (e recusa as flags).
2. **Nada de mutação de dependência, pino de versão ou troca de ferramenta** (D-167-06 fica como decisão do Planner/Proprietário).
3. **Nenhuma edição nas 13 citações das cápsulas, nas 25 Portas §46.3, nas 2 INST, no `EXTERNAL_CAPABILITY_REGISTRY`, no `INVENTARIO_AS_IS`** ou nos 5 validadores pré-existentes.
4. **Nenhuma mudança em `lint-estrutura.mjs`** (ver D-167-05).
5. **Nenhuma observação de rede automatizada** — a rodada do Vigia foi **assistida** nesta fatia (o card autoriza).
6. **#168 não iniciado**; nenhum card fechado/aberto; nada commitado, empurrado ou postado.

---

## 12. BLOCO DE PROVA GIT (B1 — protocolo: nada de `GIT 🟢` sem prova)

```text
GIT_STATE: 🟡 NÃO PROVADO nesta fatia (por protocolo: nada foi commitado; exit codes de add/commit
           serão preenchidos pelo Executor principal)

git_status_short (coletado; saída real):
 M 02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-01_FORMULARIO_E_MENUS/submodulos/SUB-C01-01-01_OCR_E_CONFERENCIA/NOTA_DE_RESPONSABILIDADE.md
 M RELATORIO_DE_DIFERENCIAS_156_157.md
 M Testes/RodarTodosOsTestes.js
 M VigiaPonte/conversation_memory.json
 M dependencias/DEP-001_GOOGLE_APPS_SCRIPT.md
 M dependencias/DEP-002_GOOGLE_SHEETS.md
 M dependencias/DEP-003_CLASP_DEPLOY.md
 M dependencias/DEP-004_ABAS_E_BASES_CANONICAS.md
 M dependencias/INDICE.md
?? RELATORIO_167.md
?? RESULT_PROPOSTO_167.md
?? Testes/TestNormalizadorEfetivo.js
?? Testes/TestVigiaDependencias.js
?? Testes/temp_test_telegram/
?? dependencias/decisoes/
?? dependencias/vigia/
?? scripts/downplant/validar-dependencias.mjs
?? scripts/downplant/vigia-dependencias.mjs
STATUS_EXIT=0     # 4 entradas M e 2 ?? são drift PRE-EXISTENTE (presentes antes desta fatia)

git_diff_stat (saída real):
 .../NOTA_DE_RESPONSABILIDADE.md                    |  2 +-
 RELATORIO_DE_DIFERENCIAS_156_157.md                |  4 +-
 Testes/RodarTodosOsTestes.js                       |  8 ++++
 VigiaPonte/conversation_memory.json                | 44 +++++++-----
 dependencias/DEP-001_GOOGLE_APPS_SCRIPT.md         | 44 +++++++++++++-
 dependencias/DEP-002_GOOGLE_SHEETS.md              | 40 ++++++++++++-
 dependencias/DEP-003_CLASP_DEPLOY.md               | 38 ++++++++++++-
 dependencias/DEP-004_ABAS_E_BASES_CANONICAS.md     | 37 ++++++++++++-
 dependencias/INDICE.md                             | 33 +++++++++--
 9 files changed, 214 insertions(+), 36 deletions(-)
DIFF_EXIT=0

HEAD: 99877b4cc6d7c383e5328f1321e9b8202ddae2fa   (inalterado — nada commitado)

git_add_exit    = <PREENCHER pelo Executor principal>
git_commit_exit = <PREENCHER pelo Executor principal>
APPS_SCRIPT_STATE: ⚪ NÃO APLICÁVEL — nenhum delta de produto, nenhum `clasp push`
```

**Caminhos desta fatia (para `git add` explícito — nunca `git add .`):**

```text
dependencias/DEP-001_GOOGLE_APPS_SCRIPT.md  dependencias/DEP-002_GOOGLE_SHEETS.md
dependencias/DEP-003_CLASP_DEPLOY.md        dependencias/DEP-004_ABAS_E_BASES_CANONICAS.md
dependencias/INDICE.md                      dependencias/decisoes/
dependencias/vigia/                         scripts/downplant/validar-dependencias.mjs
scripts/downplant/vigia-dependencias.mjs    Testes/TestVigiaDependencias.js
Testes/RodarTodosOsTestes.js                RELATORIO_167.md  RESULT_PROPOSTO_167.md
```

---

## 13. RESULT proposto

Texto pronto para colagem no card em **`RESULT_PROPOSTO_167.md`** (raiz, precedente do #158…#164). **Não postado.**
