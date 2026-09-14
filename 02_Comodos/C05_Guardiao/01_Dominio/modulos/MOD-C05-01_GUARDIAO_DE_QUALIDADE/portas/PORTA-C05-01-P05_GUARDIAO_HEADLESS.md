# PORTA C05/MOD-C05-01/P05 — Prova headless do Guardiao (clasp run)

- **Endereço global:** `C05_Guardiao/MOD-C05-01_GUARDIAO_DE_QUALIDADE/P05`
- **Escala:** modulo
- **Origem:** chamador **fora da Planta**: `clasp run executarGuardiaoHeadless` — `Features/GuardiaoHeadless.js:102`
- **Destino:** mesma cadeia da Porta C05/MOD-C05-01/P04: `SeletorMesesGuardiao.auditarMeses` (`Entrada/SeletorMesesGuardiao.js:208`) → `GuardiaoQualidade.varrerAba` (`Features/GuardiaoQualidade.js:78`)
- **Elegibilidade (§12.6):** ELEGÍVEL — (A) cruza fronteira: o chamador esta **fora da Planta**; (B) o efeito e o mesmo do fluxo oficial (abas de auditoria + coluna AM); (C) e o **segundo chamador** que torna o risco concorrente real
- **Estado:** AMARELO — 1 item(ns) `pendente` declarado(s) (BLOQUEIA a Porta em G7, §12.6)

## Payload
Entrada: `selecaoTexto` (`TODOS` | nomes/indices separados por virgula | vazio = TODOS). Saida: **STRING JSON** `{status, selecionadas, resumo[], painel, prioritarios[]}` (`Features/GuardiaoHeadless.js:83-89`).

## require
1. planilha injetada disponivel (`deps.obterSS` = `obterSpreadsheetOcorrencias_`, `Features/GuardiaoHeadless.js:57,105`).
2. motor e modulo injetados (`GuardiaoQualidade` / `SeletorMesesGuardiao`, `:104-107`).
3. retorno serializavel em JSON — exigencia de `scripts.run` (`:7-8,91`).

## ensure
1. **nunca lanca**: qualquer erro vira `{status:'ERRO', mensagem}` (`Features/GuardiaoHeadless.js:90-93,108-110`).
2. sem aba valida ⇒ `NAO_AUDITAVEL` (`:61-63`); selecao cancelada ⇒ `CANCELADO` (`:69`); nome invalido ⇒ `SELECAO_INVALIDA` **sem efeito colateral** (`:70-73`).
3. o painel e cortado em `LIMITE_TEXTO = 4000` com marcador `[...cortado]` (`:17,79-81`) e os prioritarios em 15 (`:16,35`).
4. os mesmos efeitos do fluxo de UI sao produzidos — e por isso esta Porta **tambem** escreve a coluna AM da aba auditada, apesar do comentario `NAO altera dados operacionais` em `Features/GuardiaoHeadless.js:11` (divergencia **D-164-04**, medida: `:75` chama `auditarMeses`, que chama `varrerAba` em `Entrada/SeletorMesesGuardiao.js:224`, que grava AM em `Features/GuardiaoQualidade.js:648`).

## invariant
1. nao abre dialogo e nao substitui a selecao do operador (`Features/GuardiaoHeadless.js:11-12`).
2. a selecao invalida nao produz efeito: a Porta recusa antes de auditar (`:70-73`).

## Checklist de produção (§12.6)

| Item | Estado | Resposta (fato medido) |
|---|---|---|
| idempotente | aplicavel | **Referencia:** o efeito e o das Portas C05/MOD-C05-01/P02 (substituicao de `[AUDITORIA]` + append em `[HISTORICO]`) e P03 (coluna AM regravada em bloco) — contrato declarado la, nao repetido aqui. |
| deduplicacao | aplicavel | **Referencia:** a lista de alvos e resolvida contra as abas existentes (`Features/GuardiaoHeadless.js:68`) e os textos de alerta sao deduplicados por linha (`Features/GuardiaoQualidade.js:639-642`). |
| rate_limit | nao_aplicavel | rota headless autenticada, chamada sob demanda por card/tarefa. |
| paginacao | nao_aplicavel | resposta cortada em 4000 caracteres com marcador explicito (`Features/GuardiaoHeadless.js:79-81`) e prioritarios limitados a 15 (`:35`) — o corte e contratado, nao silencioso. |
| validacao_entrada | aplicavel | selecao vazia = TODOS; nome invalido ⇒ `SELECAO_INVALIDA` **sem efeito** (`Features/GuardiaoHeadless.js:65-73`); sem aba valida ⇒ `NAO_AUDITAVEL` (`:61-63`). |
| operacao_atomica | aplicavel | **Referencia:** cada passo do efeito e contratado nas Portas P02/P03 (bloco unico por artefato); esta Porta nao adiciona efeito proprio. |
| race_condition | pendente | **Justificativa (herdada e agravada):** esta Porta executa a auditoria **completa** — inclusive a escrita nas abas de apoio e na coluna AM — a partir de **fora** da UI. E o segundo chamador que torna concreto o risco declarado em C05/MOD-C05-01/P02 e P03: o operador pode estar auditando a mesma aba pelo menu no momento em que a prova headless roda, sem `LockService` em nenhum arquivo de produto (unica mencao do repositorio: stub de sandbox em `Testes/TestMenuP3.js:80`). **Decisao exigida:** a mesma das Portas P02/P03 (lock no ciclo de auditoria). **Ate a decisao, nao executar a prova headless sobre aba que o operador esteja auditando.** |
| cache | nao_aplicavel | a Porta executa auditoria viva; cache anularia a prova. |
| retry_pelo_cliente | aplicavel | o chamador headless repete a prova por decisao do card; a politica esta declarada na propria resposta tipada (`NAO_AUDITAVEL`/`CANCELADO`/`SELECAO_INVALIDA` sao desfechos estaveis, `Features/GuardiaoHeadless.js:62,69,72`). |

## Erros
`NAO_AUDITAVEL` · `CANCELADO` · `SELECAO_INVALIDA` · `ERRO` (`Features/GuardiaoHeadless.js:62,69,72,92`).

## Efeitos
Identicos aos da Porta C05/MOD-C05-01/P04 (definidos nas Portas P02 e P03): abas de auditoria/historico + coluna AM da aba auditada.

## Seguranca
Roda na conta do proprietario pela rota autenticada; nao expoe segredo; nao abre UI.

## Observabilidade
Retorno JSON unico com resumo por aba, painel em texto e prioritarios (`Features/GuardiaoHeadless.js:83-89`).

## Implementacao
`Features/GuardiaoHeadless.js:15-115` → `Entrada/SeletorMesesGuardiao.js:208-290`.

## Testes
`Testes/TestGuardiaoHeadless.js` · `Testes/TestSeletorMesesGuardiao.js` (injeção de `deps` existe exatamente para isso).

## Evidencia
Leitura direta do codigo nesta sessao (13/09/2026): `Features/GuardiaoHeadless.js:11,16,17,55,57,62,70,75,83,90,102,104`.

## Estado
Contrato declarado. **1 item `pendente`** (race_condition, herdado) — a Porta **bloqueia em G7**. Antes deste card a Porta existia como linha **`clasp run -> Guardiao | headless`** na capsula de C05 (e repetida como `Portas de auditoria` em C08-01).
