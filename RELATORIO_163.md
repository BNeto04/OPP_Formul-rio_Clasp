# RELATÓRIO — #163 (DP24-002) — contrato §32.14 no validador canônico de handoff

- **Card:** #163 `[DP24-002] Integrar contrato §32.14 ao validador canônico de handoff` (pai #57)
- **Repositório (canônico):** `C:/Users/Bneto04/Documents/Codex/syntheon-gs-downplant-offline`
- **Branch:** `sprint/g01-guardiao-qualidade-live-001` · **HEAD:** `c7dd84b`
- **Texto canônico do método:** `03_Fundacao/METODO_DOWN_PLANT_PROGRESSIVO_v2.4.md`
- **Regra transversal aplicada:** MEDIR ANTES → localizar o que já existe → aplicar **somente o delta** exigido pelo 2.4 → verificar → RESULT. **Um** validador de handoff no repositório: o do #156, estendido. Nenhum segundo validador criado.
- **Não feito (por regra do card):** nenhum commit, push, postagem no GitHub, card novo; `#172` intocado; nenhum código de produto (`Core/`, `Features/`, `Entrada/`, `Render/`, `Dominio/`) alterado.

---

## 1. O contrato citado (verbatim do texto canônico)

`03_Fundacao/METODO_DOWN_PLANT_PROGRESSIVO_v2.4.md:577-593`:

```
32.14 Contrato de entrada do handoff
Aplica o Design by Contract da §12 ao próprio objeto downplant_handoff, tornando a navegação
estrutural verificável em vez de apenas recomendada.
require:
  - downplant.comodo presente e não vazio
  - downplant.modulo presente e não vazio
  - downplant.escala ∈ {submodulo, modulo, comodo}
  - task.id presente, único e rastreável a Task existente
  - escopo.arquivos não vazio quando task.acao implicar alteração de arquivo
  - escopo.pode_expandir explicitamente true ou false (nunca ausente)
  - estado.portao_atual e estado.portao_destino presentes

ensure:
  - toda Task aceita pelo Executor referencia um downplant_handoff válido
  - todo commit gerado a partir da Task carrega task.id no histórico Git

invariant:
  - um Executor nunca inicia execução com handoff que falhe o require
require violado é problema do chamador (§12.4) — um handoff incompleto bloqueia antes da execução,
com a mesma seriedade de uma Porta de código malformada. Isso pode ser auditado hoje, manualmente,
pelo Conferidor (§7.4); quando automatizado, o require acima já está pronto para virar schema formal
de validação.
```

Duas notas que governam o delta:

1. a §32.14 fala a **nomenclatura do objeto §46.12** (`downplant.*`, `task.*`, `escopo.*`, `estado.*`) e a §46.12 (`METODO…v2.4.md:969-997`) é a **fonte única e canônica da passagem de tarefa**; o YAML de exemplo dela é o fixture positivo verbatim deste card;
2. o objeto **já existente** no repositório (#156, schema `DP-HANDOFF-1`) guarda parte desses campos em `contexto_de_task` — logo o delta é **projeção + verificação**, não duplicação de campo.

---

## 2. MEDIÇÃO ANTES — campo por campo

Antes (estado medido, não suposto): `node scripts/downplant/validar-handoff.mjs .` → **27 PASS / 0 FAIL, exit 0** e **nenhuma** verificação da §32.14 (a seção não existia no validador nem no objeto).

| # | Exigência §32.14 | ANTES — o que já cobria | Onde o dado estava | Depois — onde é verificado |
|---|---|---|---|---|
| R1 | `downplant.comodo` presente e não vazio | parcial: exigia `contexto_de_task.comodo` (schema), mas **não** como campo do contrato | `downplant_handoff.yaml:20` | `validar-handoff.mjs:221` |
| R2 | `downplant.modulo` presente e não vazio | idem, via `contexto_de_task.modulo_ativo` | `downplant_handoff.yaml:21` | `validar-handoff.mjs:224` |
| R3 | `downplant.escala ∈ {submodulo,modulo,comodo}` | **ausente**: campo não existia no objeto nem em nenhuma verificação | — (não existia) | `downplant_handoff.yaml:52` → `validar-handoff.mjs:227-231` |
| R4 | `task.id` presente, **único** e rastreável | **ausente**: nenhum id de Task no objeto; nada impedia id repetido entre handoffs | — (não existia) | `downplant_handoff.yaml:55` → `validar-handoff.mjs:235-259` |
| R5 | `escopo.arquivos` não vazio quando a ação altera arquivo | parcial: exigia `contexto_de_task.arquivos_permitidos` não vazio **sem** vínculo com a ação; `escopo.arquivos` não existia | `downplant_handoff.yaml:26-31` (projeção) | `validar-handoff.mjs:262-270` |
| R6 | `escopo.pode_expandir` explicitamente true/false (**nunca ausente**) | **ausente** | — (não existia) | `downplant_handoff.yaml:60` → `validar-handoff.mjs:274-277` |
| R7 | `estado.portao_atual` e `estado.portao_destino` presentes | parcial: só `contexto_de_task.portao_atual` como texto livre (não como portão do contrato); **destino não existia** | `downplant_handoff.yaml:24` (atual) | `validar-handoff.mjs:280-284`, destino `yaml:63` |
| E1 | toda Task aceita referencia um handoff válido | **ausente**: não havia vínculo Task → handoff | — | `validar-handoff.mjs:288-300` |
| E2 | todo commit gerado carrega `task.id` no histórico Git | **ausente**: o validador não olhava commits | — | `validar-handoff.mjs:305-322` |
| I | Executor não inicia com handoff que falhe o require | **ausente como contrato**: o validador só reprovava schema/fato; um objeto §46.12 sem os campos nem era validável | — | `validar-handoff.mjs:346` (gate), `456-470` (seção 8), `467-468` (invariante) |

Gaps estruturais medidos no #156 (pré-requisitos do delta, todos corrigidos aqui):

- **não era importável**: o script executava no `import` (inclusive `process.exit`), então não havia como *reusar* o validador como biblioteca — e a §32.14 exige o mesmo validador como contrato do Executor, não um segundo. Corrigido com portão `isMain` (`validar-handoff.mjs:346`);
- **não validava outro objeto**: só o caminho canônico do handoff de sessão; um objeto §46.12 (a passagem de tarefa que a §32.14 governa) não tinha entrada. Corrigido com `--handoff` (`validar-handoff.mjs:44-62`);
- **parser não lia o exemplo do §46.12**: o exemplo do método tem comentário de fim de linha (`escala: modulo             # submodulo | modulo | comodo`) e o parser antigo devolveria o comentário como parte do valor → `escala` inválida. Corrigido em `semComentario` (`validar-handoff.mjs:74-84`);

**Números antes/depois (handoff real do repositório):**

| Medida | ANTES | DEPOIS |
|---|---|---|
| `validar-handoff.mjs .` | 27 PASS / 0 FAIL, exit 0 | **40 PASS / 0 FAIL, exit 0** (27 antigas idênticas + 13 do §32.14) |
| exigências do require §32.14 verificadas | 0 de 7 (+0 de 2 ensure, +0 de 1 invariant) | **7 de 7 (+2 ensure, +1 invariant)** |
| `lint-estrutura.mjs .` | exit 0 | exit 0 |
| Suíte integral (`npm test`) | 630 `[PASS]` / 0 FAIL, exit **0** | 648–649 `[PASS]` / 0 FAIL, exit **0** (duas execuções) |

---

## 3. O delta aplicado (só o delta)

### 3.1 `scripts/downplant/validar-handoff.mjs` (estendido, **não** substituído)

| Linha | Delta |
|---|---|
| `44-62` | CLI ganha `--handoff <arquivo>` (validar outro objeto de handoff com o mesmo validador) |
| `74-84` | `semComentario()` — o parser passa a ler o objeto fontes do §46.12/§46.13 verbatim (comentário de fim de linha) |
| `92` | `parseYaml` **exportado** (reuso pelo portão de teste) |
| `168-210` | `ESCALAS_32_14`, `ACOES_MUTAM_ARQUIVO_32_14`, `projetar32_14()` — projeção §46.12 sobre o objeto real, **sem duplicar** campo já declarado |
| `212-333` | `validarContrato32_14()` — os 7 requires + 2 ensures + invariant, um a um, com mensagem nomeando o campo |
| `328-341` | `vizinhosDe()` — unicidade de `task.id` entre os handoffs do mesmo diretório de registro |
| `346` | portão `isMain` (o módulo passa a ser importável — reuso sem segundo validador) |
| `456-470` | **seção 8 — Contrato de entrada §32.14** no CLI: imprime require/ensure/invariant e converte violação em `exit 1` (o invariante) |

Mapa de projeção (o que **não** foi duplicado no YAML, porque já existia):

```
downplant.comodo     <- contexto_de_task.comodo
downplant.modulo     <- contexto_de_task.modulo_ativo
escopo.arquivos      <- contexto_de_task.arquivos_permitidos
estado.portao_atual  <- contexto_de_task.portao_atual
```

### 3.2 `08_Execucao_Ao_Vivo/downplant_handoff.yaml` (fonte canônica — 6 campos que faltavam)

`51-63` — bloco do delta, com o comentário que declara o mapa de projeção:

```yaml
downplant:
  escala: modulo            # submodulo | modulo | comodo (§40.4)
task:
  id: "TASK-C00-163"        # Task do card #163 (DP24-002), padrao TASK-<COMODO>-<n> (§46.12)
  acao: alterar
  alvo: "scripts/downplant/validar-handoff.mjs"
escopo:
  pode_expandir: false      # explicito: nunca ausente (§32.14)
estado:
  portao_destino: "Conferidor -> Publicacao (apos auditoria)"
```

Nenhum campo legado do #156 foi reescrito (nem `arquivos_permitidos`, nem `fatia_ativa`, nem `card_origem`) — isso seria além do delta; ver §7 (limites).

### 3.3 `08_Execucao_Ao_Vivo/downplant_handoff.md` (espelho derivado, §46.11)

- nova seção `3.1 Contrato de entrada §32.14 (campos declarados)` + correção da nota §7 (que afirmava que o método não tinha §46.12/§32.14 — o 2.4 canônico está versionado no repo desde `42ca47e`);
- **pendência declarada:** este espelho **não tem gerador versionado** (o `espelho-rico.mjs` do #162 gera espelhos de código, não este par) — logo a derivação foi manual, contrariando o §46.11 por ausência de ferramenta. Ver §7.

### 3.4 Teste + fixtures (novos)

- `Testes/TestValidarHandoffContrato32_14.js` (190 linhas) — fechadura RED→GREEN;
- `Testes/Fixtures/handoff_32_14/` — 9 fixtures: `exemplo_46_12.yaml` (**verbatim** do §46.12, provado por `diff`), `sem_escala.yaml`, `sem_task_id.yaml`, `sem_pode_expandir.yaml`, `sem_portoes.yaml`, `sem_escopo_arquivos.yaml`, `task_id_nao_rastreavel.yaml`, `tarefa_sem_handoff_apontado.yaml`, `duplicado/{a,b}.handoff.yaml`;
- `Testes/RodarTodosOsTestes.js:102` — o portão entra na suíte (mesmo padrão dos outros testes assíncronos).

---

## 4. Teste que nasce VERMELHO e fica verde

### 4.1 VERMELHO (antes do delta) — medido

`node Testes/TestValidarHandoffContrato32_14.js` → **13 FAIL / 3 PASS**. Amostras:

```
  [FAIL] o YAML de exemplo do §46.12 passa o contrato de entrada (§32.14): esperado exit 0, obtido 2
  [FAIL] o handoff real do repo satisfaz o §32.14 (escala, task.id, pode_expandir, portoes):
         saida nao contem "§32.14 invariant"
  [FAIL] sem escala -> rejeitado: esperado exit 1 (handoff REJEITADO pelo contrato), obtido 2
  [FAIL] task.id ausente -> rejeitado: esperado exit 1 ..., obtido 2
  [FAIL] task.id duplicado -> rejeitado: esperado exit 1 ..., obtido 2
  [FAIL] sem pode_expandir -> rejeitado: esperado exit 1 ..., obtido 2
  [FAIL] sem portoes -> rejeitado: esperado exit 1 ..., obtido 2
  [FAIL] invariante §32.14: handoff invalido bloqueia a execucao (exit 1, nao "aceito por omissao"): obtido 2
```

Antes do delta, um handoff **inválido pela §32.14 não era rejeitado pelo contrato** (exit 2 = "handoff nao encontrado", porque o validador não sabia receber outro objeto) — que é exatamente o "aceito por omissão" que o invariante proíbe. O `exit` do RED é 0 por um artefato medido e pré-delta: o módulo executava no `import` e chamava `process.exit(0)`; a correção disso (portão `isMain`) é parte do próprio delta.

### 4.2 VERDE (depois do delta) — medido

`node Testes/TestValidarHandoffContrato32_14.js` → **18 PASS / 0 FAIL, exit 0**

```
1) Require §32.14 - objeto canonico §46.12 e handoff real do repo
  [PASS] o YAML de exemplo do §46.12 passa o contrato de entrada (§32.14)
  [PASS] o handoff real do repo continua aceito no inicio de uma task (nao-regressao do #156)
  [PASS] o handoff real do repo satisfaz o §32.14 (escala, task.id, pode_expandir, portoes)
  [PASS] nao-regressao: as verificacoes do validador antigo continuam todas PASS e nenhuma FAIL
2) Negativos - o require violado e nomeado e nao ha execucao (invariante)
  [PASS] sem escala -> rejeitado
  [PASS] task.id ausente -> rejeitado
  [PASS] task.id duplicado -> rejeitado
  [PASS] sem pode_expandir -> rejeitado
  [PASS] sem portoes -> rejeitado
  [PASS] acao que altera arquivo com escopo.arquivos vazio -> rejeitado
  [PASS] task.id nao rastreavel ao comodo declarado -> rejeitado
  [PASS] Task apontando para handoff inexistente (ensure) -> rejeitada
  [PASS] os dois lados do id duplicado sao rejeitados (nao e sorte de ordem de leitura)
  [PASS] invariante §32.14: handoff invalido bloqueia a execucao (exit 1, nao "aceito por omissao")
3) Ensure §32.14 - pos-condicoes verificadas pelo mesmo validador
  [PASS] ensure: commit atribuido a Task (trailer Handoff:) sem task.id no historico -> violacao
  [PASS] ensure: commit que carrega o task.id no historico -> conforme
  [PASS] ensure: handoff sem historico (nenhum commit da Task ainda) -> nao inventa violacao
  [PASS] require: os oito campos exigidos sao verificados um a um (sem aceitar por omissao)
RESULTADOS FINAIS: 18 PASS / 0 FAIL
```

Saídas reais de rejeição (`--handoff` fixture, todas `exit 1`):

```
sem_escala.yaml ............ FAIL §32.14 require — downplant.escala AUSENTE: declare explicitamente submodulo | modulo | comodo (§40.4)
sem_task_id.yaml ........... FAIL §32.14 require — task.id AUSENTE: sem id a Task nao e rastreavel nem unica
duplicado/a.handoff.yaml ... FAIL §32.14 require — task.id DUPLICADO: TASK-C00-042 tambem declarado em b.handoff.yaml
sem_pode_expandir.yaml ..... FAIL §32.14 require — escopo.pode_expandir AUSENTE ou nao booleano (lido: ausente) — deve ser explicitamente true ou false
sem_portoes.yaml ........... FAIL §32.14 require — estado.portao_atual AUSENTE ... / estado.portao_destino AUSENTE
sem_escopo_arquivos.yaml ... FAIL §32.14 require — escopo.arquivos vazio/ausente com task.acao="corrigir" (acao que altera arquivo)
task_id_nao_rastreavel.yaml  FAIL §32.14 require — task.id nao rastreavel: "TASK-C99-047" declara comodo C99 mas downplant.comodo = C00
tarefa_sem_handoff_apontado  FAIL §32.14 ensure — task.handoff aponta para handoff INEXISTENTE: nao/existe/handoff.yaml
(todas) .................... FAIL §32.14 invariant — Executor BLOQUEADO: um handoff que falhe o require nunca inicia execucao
```

E o **positivo** `exemplo_46_12.yaml` (`--handoff`, verbatim do §46.12):

```
8) Contrato de entrada §32.14 (objeto §46.12 de passagem de tarefa)
  PASS  §32.14 require — downplant.comodo presente: C00
  PASS  §32.14 require — downplant.modulo presente: MOD-C00-01
  PASS  §32.14 require — downplant.escala = modulo
  PASS  §32.14 require — task.id = TASK-C00-042 (padrao canonico TASK-<COMODO>-<n>)
  PASS  §32.14 require — task.id rastreavel ao comodo declarado (C00)
  PASS  §32.14 require — task.id unico entre os handoffs do diretorio (1 vizinho(s))
  PASS  §32.14 require — escopo.arquivos nao vazio (2) para task.acao="corrigir" (acao que altera arquivo)
  PASS  §32.14 require — escopo.pode_expandir = false (explicito, nunca ausente)
  PASS  §32.14 require — estado.portao_atual presente
  PASS  §32.14 require — estado.portao_destino presente: G7
  PASS  §32.14 ensure — a Task TASK-C00-042 referencia este handoff ...
  PASS  §32.14 invariant — Executor autorizado a iniciar: nenhum require violado
SUCESSO! O objeto §46.12 satisfaz o contrato de entrada da §32.14 (require/ensure/invariant).   (exit 0)
```

Prova de verbatim do fixture: extração das linhas `downplant:`…`acao: REPORTAR_AO_PLANEJADOR` de `METODO…v2.4.md:971-996` vs `Testes/Fixtures/handoff_32_14/exemplo_46_12.yaml` → `diff` **vazio** (`FIXTURE_VERBATIM=OK`, 26 linhas).

---

## 5. Não-regressão (prova)

| Prova | Comando | Resultado |
|---|---|---|
| Validador **antigo** (de `HEAD`, inline) contra o repo | `git show HEAD:scripts/downplant/validar-handoff.mjs > tmp; node tmp <repo>` | saída de PASS **byte-idêntica** às 27 primeiras PASS do validador novo (`diff` vazio, `NAO_REGRESSAO_OK`) |
| Validador novo no handoff real | `node scripts/downplant/validar-handoff.mjs .` | 40 PASS / 0 FAIL, **exit 0** (27 antigas + 13 do §32.14) |
| Lint estrutural | `node scripts/downplant/lint-estrutura.mjs .` | **exit 0** ("estrita conformidade com o Down Plant 2.1") |
| Suíte integral ANTES | `npm test` | 630 `[PASS]` / 0 FAIL, 23 blocos, **exit 0** |
| Suíte integral DEPOIS | `npm test` | 648–649 `[PASS]` / 0 FAIL, 24 blocos, **exit 0** (duas execuções; +18 = exatamente o portão novo, oscilação residual de contagem em `TestVigiaNaturalLanguage`) |
| Oscilação conhecida #172 | `TestVigiaNaturalLanguage` | **passou nas duas execuções** ("TESTES DE LINGUAGEM NATURAL (A a P) APROVADOS COM SUCESSO") — não usada como justificativa |

---

## 6. Mapa §32.14 → implementação

| §32.14 | Implementação (`arquivo:linha`) | Prova |
|---|---|---|
| require `downplant.comodo` | `scripts/downplant/validar-handoff.mjs:221` (+ `projetar32_14:183`) | seção 8 do CLI; teste §1 |
| require `downplant.modulo` | `validar-handoff.mjs:224` (+ `projetar32_14:184`) | idem |
| require `downplant.escala` | `validar-handoff.mjs:227-231`; dado em `08_Execucao_Ao_Vivo/downplant_handoff.yaml:52` | `sem_escala.yaml` → exit 1 |
| require `task.id` presente | `validar-handoff.mjs:235-238`; dado em `downplant_handoff.yaml:55` | `sem_task_id.yaml` → exit 1 |
| require `task.id` único | `validar-handoff.mjs:254-259` + `vizinhosDe:328-341` | `duplicado/{a,b}.handoff.yaml` → exit 1 nos dois lados |
| require `task.id` rastreável | `validar-handoff.mjs:239-248` (cômodo do id × `downplant.comodo`) | `task_id_nao_rastreavel.yaml` → exit 1 |
| require `escopo.arquivos` quando a ação altera | `validar-handoff.mjs:262-270` | `sem_escopo_arquivos.yaml` → exit 1 |
| require `escopo.pode_expandir` explícito | `validar-handoff.mjs:274-277`; dado em `downplant_handoff.yaml:60` | `sem_pode_expandir.yaml` → exit 1 |
| require `estado.portao_atual` / `portao_destino` | `validar-handoff.mjs:280-284`; destino em `downplant_handoff.yaml:63` | `sem_portoes.yaml` → exit 1 |
| ensure: Task aceita referencia handoff válido | `validar-handoff.mjs:288-300` | `tarefa_sem_handoff_apontado.yaml` → exit 1; teste §3 |
| ensure: commit carrega `task.id` | `validar-handoff.mjs:305-322` (lê `git log --format=%H%x09%B%x02`) | teste §3 (log injetado: com e sem violação) |
| invariant: Executor não inicia com require violado | `validar-handoff.mjs:346` (gate), `456-470` (seção 8), `467-468` (mensagem) | todos os negativos → exit 1 + "BLOQUEADO"; suíte verde |
| §46.12 verbatim como entrada válida | `Testes/Fixtures/handoff_32_14/exemplo_46_12.yaml` (26 linhas, `diff` contra `METODO…v2.4.md:971-996` vazio) | `--handoff` → exit 0 |
| portão na suíte | `Testes/RodarTodosOsTestes.js:102` + `Testes/TestValidarHandoffContrato32_14.js` | suíte 648 PASS / exit 0 |

---

## 7. Limites, decisões e pendências honestas

1. **Unicidade do `task.id`**: YAML não permite chave repetida no mesmo mapa, então unicidade é verificada **entre handoffs do mesmo diretório de registro** (`vizinhosDe`), que é o risco real (duas Tasks com o mesmo id). Um registro central de Tasks não existe no repositório — se passar a existir, o ponto de extensão é `vizinhosDe`, não um validador novo.
2. **Ensure 2 no estado atual**: o handoff real tem `GIT_STATE: PENDENTE` e a regra do card proíbe commitar. A verificação roda sobre o histórico real (`400` commits lidos) e reporta `nenhum commit atribuído à Task TASK-C00-163` — a pós-condição é satisfeita **vacuamente e por declaração**, não por evidência de commit (que não existe ainda). Não inventei commit nem evidência.
3. **§32.14 E1 no objeto de sessão**: o handoff de sessão é ele mesmo o handoff da Task (não há `task.handoff` apontando para fora); a referência é o próprio objeto. O caso "Task → outro handoff" é o caminho coberto por `task.handoff` (verificado recursivamente, profundidade 1) e testado pelo fixture negativo.
4. **Campos legados do objeto NÃO foram reescritos** (decisão de escopo): `contexto_de_task.fatia_ativa`/`card_origem` ainda dizem "#156 + #157" e `arquivos_permitidos` ainda é a lista do #156. É estado **pré-existente** do objeto, fora do delta pedido; alterá-lo mexeria no espelho e na narrativa do handoff sem exigência do 2.4. Fica declarado como dívida de atualização do objeto.
5. **Espelho `.md` sem gerador**: a derivação manual do §3.1 contraria o §46.11 na forma (o conteúdo deriva do YAML). A pendência real é a ausência de gerador/verificador do par `downplant_handoff.{yaml,md}` — o `espelho-rico.mjs` do #162 cobre espelhos de código (§46.15), não este par. Não criei o gerador: fora do delta do card.
6. **`--handoff` em objeto de sessão**: se apontado para outro `DP-HANDOFF-1`, roda a validação completa (seções 1-8) daquele arquivo; se apontado para um objeto §46.12 (sem `downplant_schema`), roda só o contrato — declarado no cabeçalho do script e impresso no CLI, sem heurística silenciosa.
7. **`head_observado: 98f5c8d`** no YAML segue sendo o HEAD observado na criação do objeto (#156); o HEAD real desta fatia é `c7dd84b`. Não é falha do validador (o commit existe), é idade declarada do objeto.

---

## 8. RESULT proposto

```text
[HERMES] RESULT — #163 (DP24-002)

STATUS: ENTREGUE — §32.14 integrada ao validador CANÔNICO de handoff que já existia (#156). Nenhum
        segundo validador criado. Delta medido: 13 verificações do contrato (7 require + 2 ensure +
        1 invariant + reuso/portão) sobre 27 verificações antigas intactas.
        Validador 40 PASS / 0 FAIL (exit 0) · teste 18 PASS / 0 FAIL (exit 0) · lint exit 0 ·
        suíte 648 PASS / 0 FAIL (exit 0).

EVIDÊNCIA TIPADA
- 03_Fundacao/METODO_DOWN_PLANT_PROGRESSIVO_v2.4.md:577-593 — require/ensure/invariant da §32.14,
  citados verbatim no relatório (fonte: texto canônico versionado no repo, commit 42ca47e)
- 03_Fundacao/METODO_DOWN_PLANT_PROGRESSIVO_v2.4.md:969-996 — objeto §46.12, usado como fixture
  positivo VERBATIM (diff vazio contra Testes/Fixtures/handoff_32_14/exemplo_46_12.yaml, 26 linhas)
- scripts/downplant/validar-handoff.mjs:212-333 (validarContrato32_14: 7 require + 2 ensure),
  :168-210 (projetar32_14 + enums), :328-341 (vizinhosDe), :346 (portão isMain — reuso sem segundo
  validador), :44-62 (--handoff), :74-84 (semComentario), :456-470 (seção 8 no CLI = o invariante)
- 08_Execucao_Ao_Vivo/downplant_handoff.yaml:51-63 — os 6 campos que faltavam (escala, task.id,
  task.acao, task.alvo, escopo.pode_expandir, estado.portao_destino); os demais campos do require
  são PROJETADOS de contexto_de_task, sem duplicação (mapa em validar-handoff.mjs:183-193)
- Testes/TestValidarHandoffContrato32_14.js (190 linhas) + 9 fixtures em Testes/Fixtures/handoff_32_14/
  (duplicado/{a,b}.handoff.yaml; negativos de escala, task.id, pode_expandir, portões, escopo.arquivos)
- Testes/RodarTodosOsTestes.js:102 — portão do contrato dentro da suíte
- RELATORIO_163.md (medição antes/depois campo a campo + mapa §32.14 → implementação)

TESTE RED → GREEN (saída do teste)
- VERMELHO (antes do delta): node Testes/TestValidarHandoffContrato32_14.js → 13 FAIL / 3 PASS.
  Amostra: "[FAIL] sem escala -> rejeitado: esperado exit 1 ..., obtido 2"; "[FAIL] o YAML de exemplo
  do §46.12 passa o contrato de entrada (§32.14): esperado exit 0, obtido 2". Antes, handoff inválido
  pela §32.14 NÃO era rejeitado pelo contrato (exit 2 = arquivo não encontrado): era aceito por omissão.
- VERDE (depois do delta): 18 PASS / 0 FAIL, exit 0 — casos: sem escala, task.id ausente, task.id
  duplicado, sem pode_expandir, sem portões, escopo.arquivos vazio com ação de mutação, task.id não
  rastreável, Task com handoff inexistente → TODOS exit 1 com o campo nomeado e
  "§32.14 invariant — Executor BLOQUEADO"; e exemplo §46.12 → exit 0.
- Não-regressão byte a byte: o validador de HEAD rodado contra o repo produz PASS idênticas às 27
  primeiras do validador novo (diff vazio).

AS QUATRO PONTAS
- CÓDIGO: validar-handoff.mjs estendido (1 arquivo, mesmas 27 verificações + 13 do §32.14, exit 0);
  parser do §46.12 verbatim; nenhum arquivo de produto alterado (Core/, Features/, Entrada/, Render/,
  Dominio/ intocados — git status prova).
- DOCUMENTAÇÃO: RELATORIO_163.md (medição antes/depois + mapa §32.14 → arquivo:linha + pendências);
  08_Execucao_Ao_Vivo/downplant_handoff.md derivado (§3.1 nova, §7 corrigida — o 2.4 canônico tem
  §46.11/§46.12/§32.14, resolvendo a divergência registrada no #156).
- CANVAS/PLANTA: sem delta estrutural — nenhum cômodo, módulo, porta, circuito ou nó criado/alterado;
  nenhum .canvas tocado.
- GIT: branch sprint/g01-guardiao-qualidade-live-001, HEAD c7dd84bc7b7e5171aec57a2b8e1c177f326975bb.
  Delta só no working tree (6 modificados + Testes/Fixtures/handoff_32_14/ e Testes/
  TestValidarHandoffContrato32_14.js novos). Sem commit, sem push, sem postagem, sem card novo, #172
  intocado.

DIVERGÊNCIAS DECLARADAS COM O BRIEFING
- "hoje verde (28 PASS / 0 FAIL)": medido 27 PASS / 0 FAIL no validador do #156 (contagem de linhas
  "  PASS  "). A diferença é de contagem, não de cobertura: nenhuma verificação antiga foi removida
  (diff da saída do validador de HEAD contra as 27 primeiras linhas do novo é vazio).
- "suíte": esperado falha por TestVigiaNaturalLanguage (#172); medido exit 0 nas duas execuções
  (antes 630 [PASS]/0 FAIL; depois 648/0 FAIL) e o NLU passou — não usei a oscilação como justificativa.

PENDÊNCIAS (com causa) — não resolvidas de propósito
1) Espelho .md do handoff sem gerador versionado → a derivação do §3.1 foi manual (contraria o §46.11
   na forma). O gerador/verificador do par downplant_handoff.{yaml,md} não existe; o espelho-rico.mjs
   do #162 cobre §46.15 (código), não este par. Fora do delta.
2) Unicidade de task.id é verificada entre handoffs do MESMO diretório (não há registro central de
   Tasks no repo). Ponto de extensão declarado: vizinhosDe().
3) campos legados do objeto (fatia_ativa/card_origem = #156+#157; arquivos_permitidos da fatia do #156)
   seguem como estavam: atualizá-los não é exigência do 2.4 e mexeria na narrativa do objeto.
4) ensure 2 satisfeita por declaração (GIT_STATE: PENDENTE, sem commit por regra do card): a
   verificação roda sobre o histórico real (400 commits) e reporta 0 commit atribuído à Task.

PRÓXIMO PASSO NATURAL: rodar o validador como PORTÃO antes de cada aceitação de Task (exit != 0 =
não inicia) e, quando o Planner emitir handoffs §46.12 por Task, alimentá-los por --handoff — sem
criar validador paralelo.
```
