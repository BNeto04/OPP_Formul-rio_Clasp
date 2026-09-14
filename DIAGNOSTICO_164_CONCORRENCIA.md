# DIAGNÓSTICO — Concorrência / `LockService` (#164 · DP24-003 · item 1 de 3)

Peça de **diagnóstico**, não de implementação. Nenhum arquivo de produto, planilha ou documento
pré-existente foi alterado. Escopo: tornar **decidível** a política transversal de trava, com
causa provada e com as quatro pontas declaradas.

---

## 0. Cenário congelado (antes de qualquer conclusão)

| Campo | Valor |
|---|---|
| Repositório | `C:\Users\Bneto04\Documents\Codex\syntheon-gs-downplant-offline` |
| Branch | `sprint/g01-guardiao-qualidade-live-001` |
| HEAD | `a70da9e95158bf2f8dd2dfcca93795c99ee45ede` |
| Node | `v24.14.0` |
| Comando de congelação | `git rev-parse HEAD` · `git rev-parse --abbrev-ref HEAD` |

**Baseline do validador único do card (executado neste HEAD):**

- Comando: `node scripts/downplant/validar-portas.mjs`
- Resultado real: **286 PASS / 0 FAIL · exit 0** — 45 Portas no inventário · **25 ELEGÍVEIS** · 20 não
  elegíveis · 25 arquivos de Porta · **17 itens `pendente`** (bloqueiam G7).
- Artefato bruto: `C:\Users\Bneto04\AppData\Local\Temp\diag164\validar_portas_baseline.txt`
  (`sha256 9f049894a850063f61c10ec6de6b072018a7f55d6ebce4c58c90a6f0a1db447d`).
- **Leitura correta do verde atual:** o validador mede `pendente` **com justificativa escrita** como
  PASS (ver `scripts/downplant/validar-portas.mjs:247-255`). Ou seja: hoje o repositório está verde
  *com* as 9 pendências declaradas. A meta do Planner — *“25/25 elegíveis verdes e 0 pendência
  bloqueante”* — **não** é atingida por este verde: exige que cada `race_condition` saia de
  `pendente` para `aplicavel` **com resposta medida** (ou que o risco seja contratado por decisão
  explícita, e mesmo assim o estado deixa de ser `pendente`).

---

## 1. Inventário dos 9 itens `race_condition` (`arquivo:linha` do caminho de escrita real)

### 1.1 Tabela-síntese

| # | Porta | Arquivo da Porta | Caminho de **escrita** real | O que pode colidir | O que quebra concretamente |
|---|---|---|---|---|---|
| 1 | `C00/MOD-C00-03/P01` LOG_DE_AUDITORIA | `.../MOD-C00-03_INFRAESTRUTURA_CORE/portas/PORTA-C00-03-P01_LOG_DE_AUDITORIA.md` | `Core/Logger.js:44` → `Render/RendererAuditoria.js:11` (`sheet.clear()`) + `:14` (`setValues`) | Qualquer par de geradores (comparativo, armas, produtividade, PIP/CPM, GXT) — **nome de aba fixo** | **Aba inteira**: log de uma execução apagado por outra; ou log **híbrido** (cabeçalho de A + cauda de B). 0 erro reportado |
| 2 | `C01/MOD-C01-01/P03` ENTRADA_MANUAL_BO | `.../MOD-C01-01_FORMULARIO_E_MENUS/portas/PORTA-C01-01-P03_ENTRADA_MANUAL_BO.md` | `Entrada/EntradaManual.js:315-377` (escolhe a linha livre: `:326` `linhaParaEscrever = ultimaLinha+2`) → `:500` (`rangeCol.setValues`), em **loop coluna a coluna** (`:473-500`), + `:751-752`, `:769` | **Dois operadores** (formulário `google.script.run`) + os Corretores de menu (`Features/CorretorTuneis.js:211` `aba.deleteRow`) | **Linha/célula**: dois BOs escolhem a **mesma** linha livre; um sobrescreve o outro → ocorrência **perdida**. Gravação por 25 chamadas → linha **pela metade** visível |
| 3 | `C01/MOD-C01-02/P02` ESCRITA_EFETIVO | `.../MOD-C01-02_NORMALIZADOR_DE_EFETIVO/portas/PORTA-C01-02-P02_ESCRITA_EFETIVO.md` | `Features/NormalizadorEfetivo.js:158` (`clearContent`) + `:160` (`setValues`); legado em `:169,171` | **Menu** (`Features/NormalizadorEfetivo.js:395`) × **headless** (`:431`) = Porta P03 | **Aba EFETIVO**: tabela **híbrida** (N linhas de A + resto de B) ou perda total do resultado de B, **com sucesso reportado nas duas** |
| 4 | `C01/MOD-C01-02/P03` NORMALIZADOR_HEADLESS | `.../portas/PORTA-C01-02-P03_NORMALIZADOR_HEADLESS.md` | `Features/NormalizadorEfetivo.js:431` → `executar()` → mesmo `:158,160` | é o **2º chamador** do mesmo efeito de #3 | idêntico a #3 (o headless é o chamador que torna o risco real) |
| 5 | `C05/MOD-C05-01/P02` ABAS_DE_AUDITORIA | `.../MOD-C05-01_GUARDIAO_DE_QUALIDADE/portas/PORTA-C05-01-P02_ABAS_DE_AUDITORIA.md` | `Render/RendererAuditoriaSaude.js:111` (`logSheet.clear()`) + `:112` (`setValues`) e `:121-132` (anexo no `[HISTORICO]`, linha calculada em `:146-149`); chamado de `Features/GuardiaoQualidade.js:723` | **Menu** (`Features/GuardiaoQualidade.js:756`→`:762`) × **headless** (`Features/GuardiaoHeadless.js:106`) e × **seletor de meses** (`Entrada/SeletorMesesGuardiao.js:355`) | `[AUDITORIA]` **sobrescrita** (o retrato de quem perdeu desaparece); `[HISTORICO]` **anexa no mesmo bloco** → um laudo de auditoria inteiro **perdido** |
| 6 | `C05/MOD-C05-01/P03` COLUNA_ALERTA_AM | `.../portas/PORTA-C05-01-P03_COLUNA_ALERTA_AM.md` | `Features/GuardiaoQualidade.js:715-716` (`prepararColunaAlertas` + `setValues` na AM) + `:717` (destaque); limpeza prévia em `Render/RendererAuditoriaSaude.js:408-410`; leitura em `:143,:219` | Dois auditores (menu + headless) sobre a **mesma aba mensal** | **Coluna AM** (célula por linha): alertas de uma execução correspondem a um retrato **parcial**; a limpeza de `prepararColunaAlertas` apaga os alertas do outro |
| 7 | `C05/MOD-C05-01/P05` GUARDIAO_HEADLESS | `.../portas/PORTA-C05-01-P05_GUARDIAO_HEADLESS.md` | `Features/GuardiaoHeadless.js:106` → `SeletorMesesGuardiao.auditarMeses` → mesmo ciclo de #5/#6 | é o **2º chamador** do mesmo ciclo | idêntico a #5+#6, disparado de fora da UI |
| 8 | `C06/MOD-C06-01/P01` MENU_COMPARATIVO | `.../MOD-C06-01_RELATORIOS_OFICIAIS/portas/PORTA-C06-01-P01_MENU_COMPARATIVO.md` | `Features/CompiladorProdutividade.js:40,74` → `Render/RendererComparativo2026.js:11` (`sheet.clear()`) + `:29-90` (escritas) | **Menu** (`abrirMenuComparativo2026`) × **headless** (`Features/CompiladorProdutividade.js:92`) | Aba de **nome fixo** `COMPARATIVO_2026`: o segundo `clear()` apaga o primeiro relatório; resultado final mistura duas leituras (`LOG_COMPARATIVO_2026` idem, via #1 — `:75`) |
| 9 | `C06/MOD-C06-01/P02` COMPARATIVO_HEADLESS | `.../portas/PORTA-C06-01-P02_COMPARATIVO_HEADLESS.md` | `Features/CompiladorProdutividade.js:92` → mesma cadeia de #8 | é o **2º chamador** da mesma aba | idêntico a #8 |

**Contraexemplo no próprio repositório (o que *não* é pendente e por quê):** `C06/MOD-C06-02/P01-P03`
(Compilador de Armas) está `aplicavel` e **não** `pendente` porque o nome da aba é **versionado** e a
reserva termina em `insertSheet` (`Compilador_Armas.js:251-260`): na colisão o Sheets **recusa a
segunda** com erro explícito — falha **ruidosa**, sem corromper a aba da primeira. É exatamente o
padrão “nome por execução” citado nas opções (§4-D). O log do mesmo fluxo (`:327` `abaLog.clear()`)
**continua vulnerável** e é o item #1.

### 1.2 Fichas por Porta (o que colide, concreto)

**#1 · `C00/MOD-C00-03/P01`** — `Core/Logger.js:43` (`gravarPlanilha`) chama
`RendererAuditoria.render(...)` → `Render/RendererAuditoria.js:7-14`: `getSheetByName(nome)` →
`sheet.clear()` → `getRange(...).setValues(linhas)`. **Uma** aba para **N** geradores. Quem entra
depois limpa o log de quem entrou antes. O conteúdo de `linhas` depende só do `logger` **daquele**
fluxo (`:27-64`): não há versão, chave, nem carimbo de execução.

**#2 · `C01/MOD-C01-01/P03`** — `localizarBlocoModeloDisponivel_` (`Entrada/EntradaManual.js:315-377`)
lê a coluna **B** inteira (`:317`), acha a última linha preenchida (`:319-324`) e devolve
`linhaParaEscrever = ultimaLinha + 2` (`:326`). A gravação real é **coluna a coluna**, 25 pares
range/`setValues` (`:473-500`), seguidos de `copyTo` de fórmulas (`:504-...`) — não é bloco único.
Dois operadores, ou um operador e um dos Corretores (que **apaga linhas**:
`Features/CorretorTuneis.js:211` `aba.deleteRow(r)`), deslocam a linha e/ou disputam o mesmo alvo.

**#3/#4 · `C01/MOD-C01-02/P02+P03`** — `escreverEfetivo` (`Features/NormalizadorEfetivo.js:156-164`):
`linhasParaLimpar = max(getLastRow(), saida.length, 1)` → `clearContent` (`:158`) → `setValues`
(`:160`). **Dois** passos de API separados por latência de rede. `escreverLegado` (`:166-174`) repete
o padrão para `EFETIVO_LEGADO`. Chamadores: menu `normalizarEfetivo` (`:395`) e headless
`normalizarEfetivoHeadless` (`:431`) — o mesmo `executar()`.

**#5/#6/#7 · `C05/MOD-C05-01/P02+P03+P05`** — `RendererAuditoriaSaude.renderizarLog`
(`Render/RendererAuditoriaSaude.js:19`), chamado de `Features/GuardiaoQualidade.js:723` (dentro de
`varrerAba`, definido em `:135`): `[AUDITORIA] Ocorrencias` é **sobrescrita**
(`:111` `logSheet.clear()` + `:112` `setValues`); `[HISTORICO]` é **anexado** numa linha calculada
por leitura prévia (`:121` `getLastRow()` → `:122` → `calcularLinhaAnexoHistorico` em `:146-149` →
`:132` `setValues`). A coluna AM é regravada em `Features/GuardiaoQualidade.js:715-716`, com limpeza
prévia em `Render/RendererAuditoriaSaude.js:408-410`. **Três** chamadores do mesmo ciclo (menu por
aba em `:762`, menu por seletor de meses, headless em `Features/GuardiaoHeadless.js:106`).

**#8/#9 · `C06/MOD-C06-01/P01+P02`** — `gerarComparativo2026Premium`
(`Features/CompiladorProdutividade.js:40`) chama `RendererComparativo2026.render(ss, "COMPARATIVO_2026", …)`
— **nome literal fixo** (`:74`) — cujo `render` faz `sheet.clear()` (`Render/RendererComparativo2026.js:11`)
e sequência longa de escritas de layout (`:29-90`). O headless
(`Features/CompiladorProdutividade.js:92`) executa **a mesma** função. O log
(`LOG_COMPARATIVO_2026`, `:75`) cai no item #1.

### 1.3 Achados de fidelidade do contrato (declarado × medido) — não são os 9 itens, mas importam

| Porta | O texto diz | O código tem | Efeito |
|---|---|---|---|
| `C05/MOD-C05-01/P03` | `Features/GuardiaoQualidade.js:162,648` | leitura em `:143,:219`; escrita da AM em `:715-716`; `:648` é uma **regra** (`ORDEM_ANTIGUIDADE_EQUIPE`), não escrita | o `arquivo:linha` da justificativa **não localiza** a escrita — atrapalha auditoria e a fechadura (§6) |
| `C05/MOD-C05-01/P02` | `calcularProximaLinhaHistorico`, `RendererAuditoriaSaude.js:140-152` | a função real é **`calcularLinhaAnexoHistorico`** (`:146-149`); a faixa `:140-152` está correta | nome inexistente no código → grep do auditor falha |
| `C05/MOD-C05-01/P02/P03/P05` | `varrerAba` em `Features/GuardiaoQualidade.js:78` (P03), `:647-651`/`:655` (P02) | `varrerAba` é **`:135`**; o `renderizarLog` é chamado em **`:723`**; a AM em **`:715-716`** | as linhas citadas caem em **outros** trechos (o `:78` é cabeçalho de bloco, o `:655` é uma regra) |
| `C06/MOD-C06-01/P01/P02` | escrita em `Render/RendererComparativo2026.js:11-69` | `clear()` em `:11`; escritas em `:29-90` (passa de `:69`) | faixa subestimada |

---

## 2. A reprodução (comando exato, resultado bruto)

**Não foi preciso tocar na planilha.** A corrida é reproduzível **offline** executando as **funções
reais** de produto do HEAD congelado com um mock instrumentado do Sheets que expõe um **gancho** no
instante exato em que a outra execução caberia — a janela de rede entre **duas chamadas de API**
distintas, que é onde a corrida vive.

- **Script (fora do repositório, para não poluir o `git status`):**
  `C:\Users\Bneto04\AppData\Local\Temp\diag164\repro_164_concorrencia.js`
  (`sha256 f728d913657d5ed6e84f7fd3f7aecd72bab30cf85214eac28be0ee4172e0f2f2`)
- **Comando:** `node "C:/Users/Bneto04/AppData/Local/Temp/diag164/repro_164_concorrencia.js"`
- **Saída bruta:** `C:\Users\Bneto04\AppData\Local\Temp\diag164\saida_repro.txt`
  (`sha256 3a51bac2fbdd99e8dddabfbf0564eb5b3b93988ea649d5fd0cff0c2aead77549d`)
- **Método (honestidade metodológica):** cada cenário roda primeiro em **baseline serial** (o mock
  confere que o caminho normal produz o resultado correto) e depois com **um intercalamento legal**.
  Só o intercalamento difere; logo a diferença de resultado é atribuível à **ausência de exclusão
  mútua**, não ao mock. Os arquivos carregados são os de produto
  (`Features/NormalizadorEfetivo.js`, `Render/RendererAuditoriaSaude.js`,
  `Render/RendererAuditoria.js`, `Entrada/EntradaManual.js`).
  **Limite declarado:** o mock **prova que o código não oferece barreira** (qualquer intercalamento é
  possível); ele **não** mede a frequência real da colisão no Sheets — isso exigiria duas execuções
  reais simultâneas na planilha do proprietário.

### 2.1 Cenário 1 — `Features/NormalizadorEfetivo.js:158,160` (itens #3/#4)

Saída bruta (verbatim):

```
--- 1a) BASELINE SERIAL — fidelidade do mock ---
  erros: A=null B=null | getLastRow final=12 {"total":12,"deA":0,"deB":12,"outras":0}

--- 1b) CORRIDA: B executa INTEIRA entre o clearContent(:158) e o setValues(:160) de A ---
  erros: A=null B=null | getLastRow final=12 {"total":12,"deA":5,"deB":7,"outras":0}
  >>> EFETIVO final:
  L 1 | ANOME1   |AGRAD1   |ACOMP1
  ...
  L 5 | ANOME5   |AGRAD5   |ACOMP5
  L 6 | BNOME6   |BGRAD6   |BCOMP6
  ...
  L12 | BNOME12  |BGRAD12  |BCOMP12

--- 1c) CORRIDA simetrica: B executa INTEIRA depois do setValues de A ---
  erros: A=null B=null | getLastRow final=12 {"total":12,"deA":0,"deB":12,"outras":0}

--- 1d) CONTRAFACTUAL: a MESMA intercalacao com um lock por execucao ---
  A: {"bloqueado":null} | B: {"bloqueado":"ALREADY_RUNNING:A"}
  getLastRow final=5 {"total":5,"deA":5,"deB":0,"outras":0}
```

**Efeito observado:** em **1b** a aba EFETIVO fica **híbrida** — 5 linhas da execução A seguidas de 7
linhas da execução B, num único estado que **não é o resultado de nenhuma das duas**; e **as duas
execuções retornaram sem erro**. Em **1c** o resultado inteiro de A **desaparece** sem erro. Em
**1d**, com um lock por execução, a corrida é impedida (`ALREADY_RUNNING:A`) e o resultado é íntegro.
Isto isola a causa: **a barreira que falta é exatamente a trava.**

### 2.2 Cenário 2 — `Render/RendererAuditoriaSaude.js:121-133` (itens #5/#7)

```
--- 2a) BASELINE SERIAL ---
  erros: A=null B=null | getLastRow final=17

--- 2b) CORRIDA: as duas leram lastRow=10 e escrevem no MESMO bloco ---
  erros: A=null B=null | getLastRow final=14
  L11 |              |             |             |
  L12 | 14/09/2026 09|CRITICO      |RA           |diag 5
  L13 | 14/09/2026 09|ALERTA       |RA           |diag 7
  L14 | 14/09/2026 09|OBSERVACAO   |RA           |diag 9

--- 2c) MICRO — o primitivo, com a funcao REAL calcularLinhaAnexoHistorico (:146) ---
  A: lastRow=10 -> proxLinha=12   B: lastRow=10 -> proxLinha=12
  linha 12 final: "B" / "bloco de B"
  >>> COLISAO: as duas escolheram a MESMA linha 12
```

**Efeito observado:** o `[HISTORICO]` termina com **um único bloco** (14 linhas) onde o serial produz
**dois** (17 linhas): a auditoria de B **não existe mais**, e `[AUDITORIA] Ocorrencias` fica com o
retrato de A apenas. Em **2c**, a função real de cálculo devolve a **mesma** linha 12 para as duas
execuções; a segunda escrita **sobrescreve** o laudo da primeira. **Nada reportou erro.**

### 2.3 Cenário 3 — `Render/RendererAuditoria.js:11,14` (item #1)

```
--- 3a) BASELINE SERIAL ---
  erros: A=null B=null | getLastRow=22 | L1="RELATORIO DE AUDITORIA E LOG - ARMAS-ANUAL"

--- 3b) CORRIDA (perda): A longo(20 matriculas) .clear, B curto(3) inteira, A .set(39) ---
  erros: A=null B=null | getLastRow=39
  L1 = "RELATORIO DE AUDITORIA E LOG - COMPARATIVO-2026" | linhas do rodape de A (MATA###) = 20 | do rodape de B (MATB###) = 0
  >>> log de B DESAPARECEU, e B reportou sucesso

--- 3c) CORRIDA (hibrido): A curto(3) .clear, B longo(20) inteira, A .set(22) ---
  erros: A=null B=null | getLastRow=39
  L1 = "RELATORIO DE AUDITORIA E LOG - COMPARATIVO-2026" (fluxo A) | rodape MATA### = 3 | rodape MATB### = 14 (primeira em L23)
  >>> HIBRIDO: um unico log com cabecalho de A e cauda de B — nenhum dos dois e o log correto
```

**Efeito observado:** o mesmo código produz **dois danos distintos** conforme o tamanho relativo dos
logs — **perda total** (3b) ou **log híbrido** (3c) — sempre com **sucesso nas duas execuções**. É a
prova de que “declarar o log descartável” (a alternativa sugerida no inventário) **não** resolve: o
artefato híbrido é pior que o descartado, porque *parece* um log válido.

### 2.4 Cenário 4 — `Entrada/EntradaManual.js:315-377` + `:500` (item #2)

```
--- 4a) BASELINE SERIAL — dois operadores, um depois do outro ---
  erros A=null B=null | blocoA.startRow=4 blocoB.startRow=6
  linhas com MIKE: [{"r":2,"mike":"M1"},{"r":3,"mike":""},{"r":4,"mike":"MIKE-A"},{"r":5,"mike":""},{"r":6,"mike":"MIKE-B"}]

--- 4b) CORRIDA: B le+escreve dentro do retrato de A (mesma linha livre escolhida) ---
  erros A=null B=null
  blocoA.startRow=4 blocoB.startRow=4  >>> COLISAO na MESMA linha
  linhas com MIKE: [{"r":2,"mike":"M1"},{"r":3,"mike":""},{"r":4,"mike":"MIKE-A"}]
  >>> SOBREPOSICAO: a ocorrencia de um operador sumiu (o outro gravou por cima) — 1 registro onde deveria haver 2
```

**Efeito observado:** em serial cada operador recebe uma linha distinta (4 e 6). Em corrida, os dois
recebem **a linha 4** e um BO **desaparece**; as duas execuções respondem sucesso. Este é o dano de
**perda de dado operacional** da lista — o único dos quatro que apaga fato, não derivado.

---

## 3. O que já existe de proteção hoje (reusar > criar)

| Sonda | Comando | Resultado real |
|---|---|---|
| `LockService` / `tryLock` / `releaseLock` no produto | `grep -rn "LockService\|tryLock\|withLock\|releaseLock\|getDocumentLock\|getScriptLock\|getUserLock" --include=*.js .` (fora de `Testes/`) | **0 no produto.** As **2** ocorrências do repositório são `VigiaPonte/LockManager.js:93` (`releaseLock`, classe própria) e `VigiaPonte/VigiaBootEngine.js:267` |
| stub de sandbox | `Testes/TestMenuP3.js:80` | `LockService: { getDocumentLock: () => ({ tryLock: () => true, releaseLock: () => {} }), getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} }) }` — **só mock de teste**, e mesmo ele **já prevê** as duas formas de lock |
| `flush()` | `grep -rn "\.flush()" --include=*.js .` | **0 no repositório** (nem `SpreadsheetApp.flush`): nenhuma execução força a materialização entre `clear` e `setValues` |
| fila / mutex / reentrância no produto | `grep -rni "mutex\|reentran\|writequeue" --include=*.js` (fora de `Testes/` e das pontes) | **0.** `packetQueue` existe só em `ponte1_telegram_chatgpt/server/ponte1_daemon.js` (Node, fora do Apps Script) |
| **Lock com dono + PID + recuperação de órfão** | `VigiaPonte/LockManager.js:28-106` | **Existe e é reutilizável como padrão:** `acquireLock()` devolve `{acquired:false, reason:'ALREADY_RUNNING', activePid}` (`:35-43`); detecta **lock órfão** por PID morto (`:12-26`, `tasklist`/`kill -0`) e o recupera (`:45-60`); trata **arquivo de lock corrompido** (`:61-76`); `releaseLock` só apaga o lock **se for o dono** (`:98`). É o precedente interno de “trava que não fica presa” |
| Instalação transversal | `grep -rln "INST-SERIALIZACAO"` | **1 ocorrência**, e ela é a *promessa*: `INVENTARIO_PORTAS_E_CHECKLIST_12_6.md:138` cita `INST-SERIALIZACAO-*` (§8.11) — **o arquivo da instalação NÃO existe**. Hoje, referenciar `INST-SERIALIZACAO-*` numa Porta **nasce vermelho** no validador (`validar-portas.mjs:257-274`) |
| gates/triggers | `grep -rn "newTrigger\|ScriptApp" --include=*.js` | **0 no repositório**; `appsscript.json` não declara triggers. Portanto **hoje** os chamadores são: **menu** (`Entrada/Menu.js:128` `onOpen` → P3) e **headless** (`clasp run`, `executionApi.access = MYSELF`). Um trigger instalado pela UI seria um **terceiro chamador invisível ao cofre** — e nenhum dos 9 itens o menciona |
| harness de sandbox reutilizável | `Testes/TestMenuP3.js:65-95` | `vm.createContext` com globais do Apps Script + `carregarProduto()` rodando **todos** os arquivos de produto — o molde pronto para a fechadura do §6 |
| contrato de mutação | `Core/ContratoMutacaoSegura.js:1-80` | **não** trata de concorrência: é whitelist/blacklist de **o quê** pode ser mutado, não de **quando/por quem**. Não há colisão de responsabilidade com a trava |

**Conclusão do §3:** não existe nenhuma proteção de concorrência no produto; existe **um precedente
completo e testado** (`VigiaPonte/LockManager.js`, com recuperação de órfão) e **um stub de sandbox
que já conhece `LockService`** (`Testes/TestMenuP3.js:80`). Criar do zero é desnecessário — o delta
mínimo é um helper no produto com a mesma semântica do `LockManager` (dono + órfão + releitura).

---

## 4. Opções de política (consequência de cada uma — **sem escolher**)

### A. Lock global por execução — `LockService.getScriptLock()` (ou `getDocumentLock()`) adquirido no início de cada ponto de entrada que escreve

- **Delta:** 1 helper novo no produto (≈30-50 linhas, no padrão de `VigiaPonte/LockManager.js:28-106`)
  + 1 chamada nos **poucos** pontos de entrada: `NormalizadorEfetivo.executar`
  (`Features/NormalizadorEfetivo.js:6`), `normalizarEfetivoHeadless` (`:431`), `gerarComparativo2026Premium`
  (`Features/CompiladorProdutividade.js:40`), `gerarComparativo2026Headless` (`:92`),
  `GuardiaoQualidade.varrerAba` (`Features/GuardiaoQualidade.js:135`) /
  `executarGuardiaoQualidade` (`:756`) / `GuardiaoHeadless.executar` (`Features/GuardiaoHeadless.js:106`),
  `processarEntradaManual` (`Entrada/EntradaManual.js:85`), `SyntheonLogger.gravarPlanilha` (`Core/Logger.js:43`).
- **Custo:** baixo (1 arquivo + ~8 call sites). **Sem** mudança de desenho.
- **Risco residual:** (i) **cobertura parcial** = falsa segurança — qualquer caminho novo que escreva
  sem pegar o lock reabre a corrida; (ii) **não** resolve `operacao_atomica`: um **leitor** ainda pode
  ver o estado intermediário entre `clearContent` e `setValues` (o Guardião e o comparativo **leem**
  as mesmas abas); (iii) **granularidade grossa**: serializa execuções que não disputam nada (EFETIVO
  × COMPARATIVO_2026), reduzindo paralelismo com o agente headless.
- **Comportamento em falha:** o Apps Script **libera os locks ao fim da execução** — inclusive em
  exceção/timeout. É por isso que a opção A **não** precisa de TTL nem de coleta de órfão; o risco
  “trava presa” é **baixo**, limitado a execuções legitimamente longas (limite de 6 min).
- **Headless e triggers:** `clasp run` roda como o proprietário (`appsscript.json` `executionApi.access
  = MYSELF`), no **mesmo projeto de script** → observa o **mesmo** lock de script. Triggers instalados
  pela UI, idem. Ou seja: a opção A cobre os três chamadores com **um** lock.
- **Reentrância (ponto de atenção real):** menu → função → trigger na mesma execução, ou duas funções
  do mesmo fluxo pegando o lock, exigem **flag de reentrância explícita** (o Apps Script não garante
  documentalmente o comportamento de reentrada do mesmo lock na mesma execução). Sem a flag, o risco é
  **autobloqueio** — que se manifesta como falha ruidosa, não como corrupção.
- **Se a trava não for liberada:** só acontece se o runtime falhar em liberar (não previsto); o efeito
  seria as execuções seguintes falharem o `tryLock` — **falha ruidosa**, sem corrupção.

### B. Lock **por aba** (`getDocumentLock` + chave no `CacheService`/`PropertiesService`, TTL)

- **Delta:** maior que A — precisa de **store de coordenação** por aba, **TTL** e caminho de
  **expiração**; o lock nativo do Apps Script é **por script/documento**, não por aba, então “por aba”
  teria de ser **construído** sobre ele.
- **Custo:** médio-alto; mais superfície para erro (chave, TTL, limpeza).
- **Risco residual:** **preferível sob concorrência, hostil sob falha** — se a execução morrer no meio,
  a chave fica **presa** até o TTL (o `LockManager` da ponte resolve isso com PID; o `CacheService` não
  tem PID). Risco de **bloqueio permanente do recurso** (a aba fica “travada” sem ninguém escrevendo).
- **Headless e triggers:** mesmo comportamento; porém cada aba nova exige chave nova — erro de omissão
  não é detectável por teste estático simples.
- **Se a trava não for liberada:** **é exatamente o caso ruim** — a aba deixa de aceitar escrita até o
  TTL; se a política for “falhar”, o operador fica sem a função.

### C. Lock **por Porta de escrita** (uma trava por artefato: EFETIVO, COMPARATIVO_2026, [HISTORICO], AM)

- **Delta:** igual a A + uma **tabela artefato→chave** mantida à mão.
- **Custo:** médio; a tabela é o novo ponto de manutenção.
- **Risco residual:** **a chave tem de ser por ARTEFATO, não por Porta** — senão P02 e P03
  (`C01/MOD-C01-02`) pegariam travas diferentes para a **mesma** aba EFETIVO e a corrida sobrevive
  intacta. O mesmo para P01/P02 de C06-01 (mesma `COMPARATIVO_2026`). Omissão de um item da tabela =
  corrida silenciosa.
- **Headless e triggers:** cobre, se todos usarem a **mesma** chave.
- **Se a trava não for liberada:** igual a A (locks nativos, liberados no fim da execução).

### D. Fila / serialização por desenho (ex.: `LockService.waitLock` + retentativa; ou “nome por execução”)

- **Delta:** maior — ou uma fila de verdade (não existe infraestrutura para isso no produto; só o
  `packetQueue` do daemon Node), ou a adesão ao padrão **já comprovado** no repositório: **nome de aba
  versionado + `insertSheet`** (`Compilador_Armas.js:251-260`), que transforma a colisão em **erro
  ruidoso**. Para `COMPARATIVO_2026` (item #8) isso significaria mudar o **nome do artefato de saída**
  (decisão de produto, não técnica).
- **Custo:** alto para o log/`[HISTORICO]` (nome fixo é contrato do proprietário).
- **Risco residual:** baixo para o que migrar; **nenhum** para o que não migrar.
- **Headless e triggers:** agnóstico — não há lock para não ser liberado. **Se a trava não for
  liberada: não se aplica.**
- **Contra-indicação medida:** o §2.3 mostra que o log **fixo** produz **híbrido**, não lixo óbvio —
  “log descartável” não é equivalente a “log versionado”.

### E. Desenho idempotente que **dispensa** lock (escrita em bloco único + append atômico)

- Ações concretas por artefato: **EFETIVO** — `setValues` de uma matriz **já dimensionada** (1 chamada,
  sem `clearContent` prévio) mata a janela do §2.1; **[HISTORICO]** — trocar o par `getLastRow()`+`setValues`
  por **`appendRow`** (1 chamada de API, sem leitura prévia) mata a do §2.2; **AM** — idem bloco único;
  **LOG** — nome versionado (D) ou sobrescrita com carimbo de execução.
- **Custo:** o **maior** (toca cada redator) e o **mais seguro**.
- **Risco residual:** baixo, mas **não zero**: onde houver regra de negócio **ler-depois-escrever sobre
  as mesmas linhas** (AM do Guardião, §2.2/§1.2-#6), o desenho idempotente **não** substitui a
  serialização — a coluna é derivada do que foi lido, então duas leituras concorrentes ainda produzem
  um alerta baseado em retrato parcial.
- **Headless e triggers:** sem lock, sem reentrância, sem órfão — o melhor comportamento em falha.
- **Se a trava não for liberada:** não se aplica.

### F. Não decidir (status quo)

- **Custo:** zero. **Consequência:** as 9 pendências continuam bloqueando **G7**; a regra declarada
  hoje em 4 Portas — *“até a decisão, não executar a geração headless em paralelo com a geração pelo
  menu”* — depende de **disciplina humana** e não é verificável por nenhum teste; e o item #2
  (perda de BO por dois operadores) permanece **sem mitigação declarada de paralelismo**.

---

## 5. Recomendação técnica fundamentada (a decisão é do Planner)

Reduz mais risco pelo menor delta, **sem** escolher desenho novo:

1. **Adotar A como piso comum** — um **único helper** de serialização no produto, no molde do
   precedente interno `VigiaPonte/LockManager.js:28-106` (dono explícito, detecção de órfão, releitura
   antes de escrever), chamado **no início dos pontos de entrada de escrita** listados em §4-A.
   Justificativa: cobre **menu × headless × trigger** com **um** lock de script (o headless roda no
   mesmo projeto; ver §4-A), e é a **única** opção cuja falha é **ruidosa** e cuja trava o runtime
   **libera sozinho**.
2. **Combinar com E nos pontos cuja janela é de duas chamadas de API** — `clearContent`+`setValues`
   (#3/#4, §2.1) e `getLastRow`+`setValues` no `[HISTORICO]` (#5/#7, §2.2). Sem isso, a trava fecha a
   corrida entre **escritores**, mas o item `operacao_atomica` (irmão do `race_condition` na P02) fica
   aberto e um leitor ainda vê estado intermediário.
3. **Não escolher B** (lock por aba com TTL manual) — é a opção que **cria um modo de falha novo**
   (trava presa) sem resolver nada que A+E não resolvam, porque o lock nativo do Apps Script não tem
   granularidade por aba.
4. **Se o Planner optar por C**, o requisito duro fica: a chave é por **artefato**, jamais por Porta
   (senão P02/P03 e P01/P02 se cruzam e a corrida sobrevive) — está provado em §2.1 e §1.2.
5. **Se o Planner optar por F**, então as 9 Portas permanecem `pendente` e a meta “25/25 verdes e 0
   pendência bloqueante” **não** é alcançável por este item — declarar isso explicitamente, porque o
   validador continuará verde mesmo assim (§0).

**O que continua faltando para decidir (declarado, não inventado):** ver §9.

---

## 6. Fechadura proposta (o que faria a proteção nascer vermelha se alguém a removesse)

**Arquivo:** `Testes/TestSerializacaoEscrita.js` — mesma forma das suítes recentes
(`TestValidarChecklistProducaoPortas.js` do #164, `TestGuardiaoHeadlessEfeitoDeclarado.js`): contador
`PASS/FAIL`, `RESULTADOS FINAIS: N PASS / M FAIL`, `process.exitCode = 1` em falha, registro de bloco
em `Testes/RodarTodosOsTestes.js` (precedente: `RELATORIO_164_FIX.md` §4).

**Casos:**

1. **Estrutural — “nenhuma escrita sem trava”.** Tabela no teste com os pontos de entrada de §4-A;
   para cada um, ler o **fonte** do arquivo (precedente: `Testes/TestContratoMutacaoSegura.js:218` lê
   o próprio fonte) e exigir a chamada do helper de lock **antes** da primeira operação de escrita
   reconhecida. Remover a trava de qualquer um dos pontos → **vermelho na hora**.
2. **Comportamental — o contrafactual de §2.1/2.2.** Rodar o harness de intercalamento desta peça
   como teste: com o helper no lugar, asserir que **não** há linha de A e de B na mesma sequência
   (EFETIVO) e que **duas** auditorias produzem **dois** blocos (HISTORICO). Regressão ao estado atual
   → vermelho.
3. **Falha fechada (fail-closed).** Mock de `LockService` que **sempre recusa** o `tryLock`: asserir
   **0 escritas** chegam à planilha (a Porta falha ruidosamente em vez de escrever sem barreira).
   Sem esse caso, uma trava “decorativa” (que pega o lock e escreve de qualquer jeito) passa no caso 1.
4. **Anti-ornamento do contrato.** Asserir que o item `race_condition` das 9 Portas **não** é
   `pendente` e que, se citar `INST-SERIALIZACAO-*`, o arquivo da instalação **existe** — o validador
   já faz a segunda metade (`scripts/downplant/validar-portas.mjs:257-274`); a primeira é o gate da
   meta do Planner (§0). **Nota de justiça:** o validador sozinho **não** consegue medir semântica de
   corrida; a fechadura tem de morar no teste.
5. **Controle negativo do endereço (`arquivo:linha`).** Asserir que cada justificativa `race_condition`
   aponta um arquivo que **existe** e uma linha que **contém** a operação citada — nasce vermelho para
   os 3 desvios já medidos em §1.3.

---

## 7. Arquivos tocados por esta auditoria

| Arquivo | Estado |
|---|---|
| `DIAGNOSTICO_164_CONCORRENCIA.md` (raiz do repo) | **CRIADO** (esta peça) — `sha256 c399a8dacffe9831e36e90fd251446248737d2fe9b54e37cbfe2824078f01b42` |
| `C:\Users\Bneto04\AppData\Local\Temp\diag164\repro_164_concorrencia.js` | script de reprodução, **fora do repositório** (não aparece no `git status`) — `sha256 f728d913657d5ed6e84f7fd3f7aecd72bab30cf85214eac28be0ee4172e0f2f2`; reexecutado 2× com saída **byte-idêntica** (determinístico) |
| `C:\Users\Bneto04\AppData\Local\Temp\diag164\saida_repro.txt` | saída bruta da reprodução — `sha256 3a51bac2fbdd99e8dddabfbf0564eb5b3b93988ea649d5fd0cff0c2aead77549` |
| `C:\Users\Bneto04\AppData\Local\Temp\diag164\validar_portas_baseline.txt` | baseline do validador único — `sha256 9f049894a850063f61c10ec6de6b072018a7f55d6ebce4c58c90a6f0a1db447d` |
| Todo o resto | **intocado** — `git status --short` final = as 3 modificações e os 2 não-rastreados que já existiam antes desta sessão + este único arquivo novo |

**Não houve** commit, push, postagem no GitHub, criação de card, `clasp push`, nem toque no #172.

---

## 8. Texto proposto para o comentário `[HERMES] DIAGNÓSTICO — concorrência/LockService (#164)`

```text
[HERMES] DIAGNÓSTICO — concorrência/LockService (#164)

STATUS: PARCIAL — causa-raiz PROVADA por reprodução offline; política TRANSVERSAL ainda NÃO decidida
        (é decisão de arquitetura do Planner, não implementação livre). Nada foi corrigido: esta fatia
        é diagnóstico isolado (nenhum arquivo de produto, planilha ou documento pré-existente
        alterado; sem commit/push/postagem; sem clasp push; #172 intocado).
        Cenário congelado: branch sprint/g01-guardiao-qualidade-live-001 · HEAD a70da9e.
        Peça: DIAGNOSTICO_164_CONCORRENCIA.md (raiz do repo).
        BASELINE MEDIDO (este HEAD): node scripts/downplant/validar-portas.mjs -> 286 PASS / 0 FAIL ·
        45 Portas · 25 ELEGÍVEIS · 17 itens 'pendente'. O validador está VERDE *com* as 9 pendências
        declaradas (ele mede 'pendente COM justificativa' como PASS, validar-portas.mjs:247-255):
        logo "25/25 verdes e 0 pendência bloqueante" NÃO é atingível sem tirar os itens de 'pendente'.

1) INVENTÁRIO DOS 9 race_condition (Porta -> escrita real -> dano)
   #1 C00/MOD-C00-03/P01 (LOG_DE_AUDITORIA): Core/Logger.js:44 -> Render/RendererAuditoria.js:11
      clear() + :14 setValues, nome de ABA FIXO, N geradores (comparativo/armas/produtividade/PIP)
      -> aba inteira: log de uma execução apagado, ou HÍBRIDO. 0 erro.
   #2 C01/MOD-C01-01/P03 (ENTRADA_MANUAL_BO): Entrada/EntradaManual.js:315-377 escolhe a linha livre
      (:326 ultimaLinha+2) e grava em :500 COLUNA A COLUNA (:473-500) + :751-752,:769
      -> dois operadores escolhem a MESMA linha; um BO DESAPARECE. É o único dos 9 que apaga FATO.
      Terceiro escritor na mesma aba: Features/CorretorTuneis.js:211 aba.deleteRow -> desloca linha.
   #3 C01/MOD-C01-02/P02 + #4 .../P03 (headless): Features/NormalizadorEfetivo.js:158 clearContent +
      :160 setValues (2 chamadas); menu :395 x headless :431 = mesmo executar() -> EFETIVO HÍBRIDO
      ou perda total do resultado, com SUCESSO reportado nas duas.
   #5 C05/MOD-C05-01/P02 + #7 .../P05 (headless): Render/RendererAuditoriaSaude.js:111-112
      ([AUDITORIA] sobrescrita) e :121-132 com linha calculada em :146-149 ([HISTORICO] anexa por
      ler-depois-escrever) -> um laudo de auditoria INTEIRO perdido.
   #6 C05/MOD-C05-01/P03: Features/GuardiaoQualidade.js:715-716 (AM) + limpeza em
      RendererAuditoriaSaude.js:408-410 (dentro de varrerAba :135, renderizarLog chamado em :723)
      -> coluna AM com alerta de retrato parcial; correção apaga o alerta do outro. (Justificativa da
      Porta cita :162,648 — :648 é REGRA, não escrita; :162 é comentário. Escrita real: :715-716. A P02
      cita varrerAba :647-651/:655 e a P03 cita :78 — o real é :135. Nome da função do HISTORICO na P02
      também diverge: 'calcularProximaLinhaHistorico' x calcularLinhaAnexoHistorico :146.)
   #8 C06/MOD-C06-01/P01 + #9 .../P02 (headless): Features/CompiladorProdutividade.js:40,74 ->
      Render/RendererComparativo2026.js:11 clear() + :29-90, nome FIXO 'COMPARATIVO_2026'
      -> o 2º clear() apaga o 1º relatório. (A Porta cita :11-69; as escritas vão até :90.)
   CONTRAEXEMPLO (não pendente e por quê): C06/MOD-C06-02/P01-P03 usa NOME VERSIONADO +
   insertSheet (Compilador_Armas.js:251-260): colisão = ERRO RUIDOSO do Sheets, sem corromper.
   O log do mesmo fluxo (:327 abaLog.clear()) segue vulnerável e é o item #1.

2) REPRODUÇÃO (offline, funções REAIS de produto + mock instrumentado; nenhuma planilha tocada)
   COMANDO: node "C:/Users/Bneto04/AppData/Local/Temp/diag164/repro_164_concorrencia.js"
   Saída bruta: ...\diag164\saida_repro.txt (sha256 3a51bac2...). Script sha256 f728d913...
   EFEITOS OBSERVADOS (todas as corridas com erro = null nas duas execuções):
   - NormalizadorEfetivo (:158/:160): 1a serial = 12 linhas de B (correto); 1b corrida = EFETIVO com
     5 linhas de A SEGUIDAS de 7 de B (HÍBRIDO); 1c = resultado de A desaparece sem erro;
     1d CONTRAFACTUAL com lock por execução = B recebe ALREADY_RUNNING:A e a aba fica íntegra
     (5 linhas de A) -> isola a causa: a barreira que falta é a trava.
   - [HISTORICO] (:121-132 + :146): 2a serial = 2 blocos (getLastRow 17); 2b corrida = 1 bloco
     (getLastRow 14), auditoria de B INEXISTENTE; 2c micro: as duas calculam proxLinha=12 com a
     função REAL -> colisão, a segunda escrita sobrescreve a primeira.
   - LOG_DE_AUDITORIA (:11/:14): 3b = log de B DESAPARECE; 3c = log HÍBRIDO (cabeçalho de A +
     cauda de B, L23+) -> "declarar o log descartável" NÃO resolve: híbrido é pior que descartado.
   - EntradaManual (:326/:500): 4a serial = linhas 4 e 6; 4b corrida = as duas escolhem a linha 4
     e o BO de um operador SOME (1 registro onde deveria haver 2).
   LIMITE DECLARADO: o mock prova que o código não oferece BARREIRA (qualquer intercalamento é
   possível); ele NÃO mede a frequência real da colisão no Sheets.

3) O QUE JÁ EXISTE (reusar > criar)
   - grep LockService|tryLock|releaseLock|getDocumentLock|getScriptLock no PRODUTO = 0 ocorrências.
     As 2 do repositório são VigiaPonte/LockManager.js:93 e VigiaPonte/VigiaBootEngine.js:267.
   - PRECEDENTE INTERNO COMPLETO: VigiaPonte/LockManager.js:28-106 (dono + PID + detecção de lock
     ÓRFÃO :12-26,45-60 + lock corrompido :61-76 + release só se for o dono :98).
   - Stub de sandbox que já conhece as duas formas: Testes/TestMenuP3.js:80 (tryLock/releaseLock).
   - flush() no repositório = 0 (nada força a materialização entre clear e setValues).
   - Fila/mutex/reentrância no produto = 0 (packetQueue só em ponte1_daemon.js, Node).
   - INST-SERIALIZACAO-* é PROMESSA: citada em INVENTARIO_PORTAS_E_CHECKLIST_12_6.md:138 e o arquivo
     NÃO existe (hoje, citá-la numa Porta nasce VERMELHO: validar-portas.mjs:257-274).
   - Triggers: 0 ScriptApp.newTrigger e nenhum trigger no manifesto -> hoje os chamadores são MENU
     (Entrada/Menu.js:128) e HEADLESS (clasp run; appsscript.json executionApi.access = MYSELF).
     Um trigger de UI seria um TERCEIRO chamador invisível ao cofre — nenhum dos 9 itens o cita.

4) OPÇÕES (consequência de cada uma — sem escolher; detalhe em DIAGNOSTICO_164_CONCORRENCIA.md §4)
   A) Lock GLOBAL por execução (getScriptLock no início dos pontos de entrada): delta MÍNIMO (1 helper
      no molde do LockManager + ~8 call sites); cobre menu x headless x trigger com UM lock (o headless
      roda no mesmo projeto); falha RUIDOSA; o runtime LIBERA o lock no fim da execução (inclusive em
      exceção) -> risco de "trava presa" BAIXO. Risco residual: cobertura parcial = falsa segurança;
      NÃO resolve operacao_atomica (leitor vê o meio do clear/setValues); granularidade grossa.
      Reentrância precisa de FLAG explícita (não há garantia documental do mesmo lock na mesma execução).
   B) Lock POR ABA (chave em CacheService/Properties + TTL): o lock do Apps Script NÃO tem granularidade
      por aba -> teria de ser construído; CUSTO médio-alto; cria modo de falha NOVO (chave PRESA até o
      TTL, sem PID para recuperar) -> risco de bloqueio permanente do recurso.
   C) Lock POR PORTA: mesmo delta de A + tabela artefato->chave à mão. REQUISITO DURO: a chave tem de ser
      por ARTEFATO, nunca por Porta (P02 e P03 disputam a MESMA aba EFETIVO; P01 e P02 a MESMA
      COMPARATIVO_2026) — senão a corrida SOBREVIVE.
   D) FILA / nome por execução: delta alto (mudaria o NOME do artefato, decisão de produto); o padrão
      JÁ EXISTE e está provado em Compilador_Armas.js:251-260; NÃO se aplica ao log/|HISTORICO (nome
      fixo é contrato do proprietário). Sem lock, sem órfão.
   E) DESENHO IDEMPOTENTE que dispensa lock (setValues de bloco já dimensionado sem clear; appendRow no
      [HISTORICO]; bloco único na AM): maior delta, MAIS seguro, e não tem trava para não ser liberada.
      Não substitui serialização onde há regra de negócio ler-depois-escrever na MESMA região (AM).
   F) NÃO DECIDIR: as 9 pendências seguem bloqueando G7; a regra "não rodar headless em paralelo com o
      menu" depende de disciplina humana e não é verificável; o item #2 (BO perdido) fica sem mitigação.

5) RECOMENDAÇÃO TÉCNICA (a decisão é do PLANNER)
   (i) A como PISO COMUM — um helper único de serialização, no molde VigiaPonte/LockManager.js:28-106;
   (ii) + E nos pontos de janela de duas chamadas de API (#3/#4 :158/:160 e #5/#7 :121-132), senão o
   operacao_atomica fica aberto; (iii) NÃO B (cria trava presa sem resolver nada que A+E não resolvam);
   (iv) se C, chave por ARTEFATO; (v) se F, declarar que a meta do Planner não é alcançável por este item.

6) FECHADURA PROPOSTA: Testes/TestSerializacaoEscrita.js (registrado em RodarTodosOsTestes.js)
   (a) estrutural: helper de lock ANTES da 1ª escrita em cada ponto de entrada (tabela no teste; ler o
       próprio fonte, precedente TestContratoMutacaoSegura.js:218) -> remover a trava nasce VERMELHO;
   (b) comportamental: o harness de intercalamento desta peça como teste -> hoje VERMELHO, com a trava
       VERDE; (c) FAIL-CLOSED: LockService que sempre recusa -> 0 escritas na planilha (impede trava
       decorativa); (d) anti-ornamento: os 9 itens deixam de ser 'pendente' e INST citada tem de existir
       (metade já garantida por validar-portas.mjs:257-274); (e) controle do endereço: cada
       justificativa aponta arquivo existente e linha que CONTÉM a operação — nasce vermelho para os 3
       desvios medidos (:162,648 da P03; 'calcularProximaLinhaHistorico').

QUATRO PONTAS (#57)
- CODE_STATE ......... INALTERADO — 0 arquivos de produto tocados; helper de lock NÃO implementado
                       (decisão pendente).
- DOC_STATE .......... AVANÇA — DIAGNOSTICO_164_CONCORRENCIA.md criado (esta peça) com inventário
                       arquivo:linha, reprodução e opções; NENHUMA Porta alterada.
- CANVAS_STATE ....... NAO_APLICAVEL — sem delta estrutural (nenhum cômodo/módulo/Porta/nó novo). A
                       instalação INST-SERIALIZACAO-* segue INEXISTENTE (é promessa no inventário).
- GIT_STATE .......... PENDENTE — 1 arquivo novo não commitado (regra do card: sem commit/push).

O QUE FALTA PARA DECIDIR
1. Escolher a OPÇÃO (A, B, C, D, E ou F) e a granularidade (execução x artefato x aba).
2. Definir o comportamento em BLOQUEIO (falhar rápido com alerta ao operador x esperar com timeout).
3. Definir reentrância (flag explícita?) e o comportamento de menu -> trigger na MESMA execução.
4. Declarar se o log/|HISTORICO (nome fixo, contrato do proprietário) fica serializado ou versionado.
5. Declarar se o item #2 (dois operadores na MESMA aba mensal) entra no mesmo lock — é o único com
   perda de FATO, não de derivado.
6. Declarar o status dos 3 desvios de arquivo:linha das Portas (§1.3) — corrigir Porta ou corrigir texto.
7. Nomear a INST (INST-SERIALIZACAO-*) e o dono da capacidade, se a forma escolhida for a instalação
   transversal (§8.11) — senão as Portas que a citarem nascem vermelhas.
```

---

## 9. O que falta para decidir (declarado, não inventado)

1. **Opção e granularidade.** O diagnóstico torna as consequências decidíveis, mas **não** escolhe
   entre A/B/C/D/E/F (§4) nem entre granularidade “por execução”, “por artefato” ou “por aba”. É
   decisão de arquitetura, não implementação livre — e é a razão de esta fatia ser diagnóstico.
2. **Comportamento em bloqueio.** Falhar rápido com alerta ao operador é diferente de esperar com
   `timeout`: muda a experiência de menu para o dono. Nenhum dos 9 itens declara qual é o contrato.
3. **Reentrância.** Menu → trigger na **mesma** execução pode levar a autobloqueio se a flag explícita
   não for definida; o Apps Script não documenta o comportamento de reentrada do mesmo lock.
4. **Artefato de nome fixo.** `LOG_DE_AUDITORIA` / `LOG_COMPARATIVO_2026` / `[HISTORICO]` /
   `COMPARATIVO_2026` são **contrato do proprietário** (nome fixo): decidir se ficam **serializados**
   (A/C) ou **versionados** (D) — a §2.3 mostra que a terceira via, “descartável”, produz **híbrido**.
5. **Escopo do item #2 (perda de BO).** É o único dos 9 que apaga **fato operacional** (não derivado
   regenerável). Se entrar no mesmo lock, o custo de A sobe (o formulário é o caminho mais usado pelo
   operador) e a política de bloqueio (§9.2) passa a ter impacto diário — precisa de decisão explícita.
6. **Os 3 desvios de `arquivo:linha`** medidos em §1.3 (`GuardiaoQualidade.js:162,648`,
   `calcularProximaLinhaHistorico`): corrigir a justificativa da Porta **ou** corrigir o texto — sem
   isso a fechadura §6-caso-5 nasce vermelha por motivo alheio à corrida.
7. **Instalação transversal.** Se a forma escolhida for `INST-SERIALIZACAO-*` (§8.11), alguém precisa
   **criar o arquivo da instalação** (hoje é só uma promessa em
   `INVENTARIO_PORTAS_E_CHECKLIST_12_6.md:138`): enquanto não existir, toda Porta que a citar nasce
   vermelha no validador.
8. **Trigger.** Não há trigger hoje (0 `ScriptApp.newTrigger`), mas se o dono instalar um por UI, ele
   passa a ser um **terceiro chamador** sobre o mesmo efeito. A opção A o cobre; C o cobre só se a
   tabela de artefatos for completa; nenhum dos 9 itens o menciona hoje.
