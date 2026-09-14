# PORTA C05/MOD-C05-01/P05 — Prova headless do Guardiao (clasp run)

- **Endereço global:** `C05_Guardiao/MOD-C05-01_GUARDIAO_DE_QUALIDADE/P05`
- **Escala:** modulo
- **Origem:** chamador **fora da Planta**: `clasp run executarGuardiaoHeadless` — `Features/GuardiaoHeadless.js:131` (docblock do arquivo em `:1-20`)
- **Destino:** mesma cadeia da Porta C05/MOD-C05-01/P04: `SeletorMesesGuardiao.auditarMeses` (`Entrada/SeletorMesesGuardiao.js:219`) → `GuardiaoQualidade.varrerAba` (`Features/GuardiaoQualidade.js:155`)
- **Elegibilidade (§12.6):** ELEGÍVEL — (A) cruza fronteira: o chamador esta **fora da Planta**; (B) o efeito e o mesmo do fluxo oficial (abas de auditoria + coluna AM); (C) e o **segundo chamador** que torna o risco concorrente real
- **Estado:** VERDE — 0 item `pendente`/0 bloqueante (§12.6); a corrida herdada esta serializada por `INST-SERIALIZACAO-001`.

## Payload
Entrada: `selecaoTexto` (`TODOS` | nomes/indices separados por virgula | vazio = TODOS). Saida: **STRING JSON** `{status, selecionadas, resumo[], painel, prioritarios[]}` (`Features/GuardiaoHeadless.js:112-118`).

## require
1. planilha injetada disponivel (`deps.obterSS` = `obterSpreadsheetOcorrencias_`, `Features/GuardiaoHeadless.js:86,131`).
2. motor e modulo injetados (`GuardiaoQualidade` / `SeletorMesesGuardiao`, `:104-107`).
3. retorno serializavel em JSON — exigencia de `scripts.run` (`:7-8,91`).

## ensure
1. **nunca lanca**: qualquer erro vira `{status:'ERRO', mensagem}` (`Features/GuardiaoHeadless.js:119-122,139-143`).
2. sem aba valida ⇒ `NAO_AUDITAVEL` (`:91-92`); selecao cancelada ⇒ `CANCELADO` (`:98`); nome invalido ⇒ `SELECAO_INVALIDA` **sem efeito colateral** (`:99-102`).
3. o painel e cortado em `LIMITE_TEXTO = 4000` com marcador `[...cortado]` (`:29,108-110`) e os prioritarios em 15 (`:28,47`).
4. os mesmos efeitos do fluxo de UI sao produzidos — e por isso esta Porta **tambem** escreve a coluna AM (`Alerta Integridade`) da aba auditada. **Contrato vigente (D-164-04 reconciliado em 14/09/2026):** o docblock passou a declarar explicitamente que as colunas **A:AL sao SOMENTE LEITURA** e que a **AM e o CANAL DE ALERTA DO GUARDIAO**, endereçado por cabecalho canonico (`Features/GuardiaoHeadless.js:12-15`; `Core/ContratoMutacaoSegura.js:58-61`). A cadeia real: `:104` chama `auditarMeses`, que chama `varrerAba` em `Entrada/SeletorMesesGuardiao.js:230`, que grava a AM em `Features/GuardiaoQualidade.js:741`. Nao ha mais contradicao declarada x medida.

## invariant
1. nao abre dialogo e nao substitui a selecao do operador (`Features/GuardiaoHeadless.js:11-12`).
2. a selecao invalida nao produz efeito: a Porta recusa antes de auditar (`:99-102`).

## Checklist de produção (§12.6)

| Item | Estado | Resposta (fato medido) |
|---|---|---|
| idempotente | aplicavel | **Referencia:** o efeito e o das Portas C05/MOD-C05-01/P02 (substituicao de `[AUDITORIA]` + append em `[HISTORICO]`) e P03 (coluna AM regravada em bloco) — contrato declarado la, nao repetido aqui. |
| deduplicacao | aplicavel | **Referencia:** a lista de alvos e resolvida contra as abas existentes (`Features/GuardiaoHeadless.js:68`) e os textos de alerta sao deduplicados por linha (`Features/GuardiaoQualidade.js:639-642`). |
| rate_limit | nao_aplicavel | rota headless autenticada, chamada sob demanda por card/tarefa. |
| paginacao | nao_aplicavel | resposta cortada em 4000 caracteres com marcador explicito (`Features/GuardiaoHeadless.js:79-81`) e prioritarios limitados a 15 (`:35`) — o corte e contratado, nao silencioso. |
| validacao_entrada | aplicavel | selecao vazia = TODOS; nome invalido ⇒ `SELECAO_INVALIDA` **sem efeito** (`Features/GuardiaoHeadless.js:96-102`); sem aba valida ⇒ `NAO_AUDITAVEL` (`:91-92`). |
| operacao_atomica | aplicavel | **Referencia:** cada passo do efeito e contratado nas Portas P02/P03 (bloco unico por artefato); esta Porta nao adiciona efeito proprio. |
| race_condition | aplicavel | **Resolvido pela trava global (`INST-SERIALIZACAO-001` (§8.11)):** esta Porta (segundo chamador do ciclo completo) adquire a mesma trava em `Features/GuardiaoHeadless.js:70` (e a porta oficial em `:133`), herdando a serializacao de `GuardiaoQualidade.varrerAba` (`Features/GuardiaoQualidade.js:155`). Auditoria pelo menu e prova headless nao anexavam no mesmo bloco nem escreviam a AM a partir de retrato parcial: a segunda execucao falha RUIDOSAMENTE (`SERIALIZACAO_OCUPADA`) com ZERO escrita. **Helper da trava:** `Core/SerializacaoEscrita.js` (helper unico da `INST-SERIALIZACAO-001`). **Evidencia:** `Testes/TestSerializacaoEscrita.js` e `Testes/TestGuardiaoHeadlessEfeitoDeclarado.js`. |
| cache | nao_aplicavel | a Porta executa auditoria viva; cache anularia a prova. |
| retry_pelo_cliente | aplicavel | o chamador headless repete a prova por decisao do card; a politica esta declarada na propria resposta tipada (`NAO_AUDITAVEL`/`CANCELADO`/`SELECAO_INVALIDA` sao desfechos estaveis, `Features/GuardiaoHeadless.js:62,69,72`). |

## Erros
`NAO_AUDITAVEL` · `CANCELADO` · `SELECAO_INVALIDA` · `ERRO` (`Features/GuardiaoHeadless.js:91,98,101,120`).

## Efeitos
Identicos aos da Porta C05/MOD-C05-01/P04 (definidos nas Portas P02 e P03): abas de auditoria/historico + coluna AM da aba auditada.

## Seguranca
Roda na conta do proprietario pela rota autenticada; nao expoe segredo; nao abre UI.

## Observabilidade
Retorno JSON unico com resumo por aba, painel em texto e prioritarios (`Features/GuardiaoHeadless.js:112-118`).

## Implementacao
`Features/GuardiaoHeadless.js:62-145` → `Entrada/SeletorMesesGuardiao.js:208-291`.

## Testes
`Testes/TestGuardiaoHeadless.js` · `Testes/TestSeletorMesesGuardiao.js` (injeção de `deps` existe exatamente para isso).

## Evidencia
Leitura direta do codigo nesta sessao (13/09/2026): `Features/GuardiaoHeadless.js:12,28,29,70,86,91,99,104,112,119,131,133`.

## Estado
Contrato declarado. **0 item `pendente`/0 bloqueante** — a Porta **nao bloqueia mais G7**. **Fechamento (#164, 14/09/2026):** (a) o `race_condition` herdado saiu de `pendente` com prova de fechadura; (b) a divergencia **D-164-04** foi reconciliada — o docblock vigente declara A:AL somente leitura e a AM como canal de alerta endereçado por cabecalho canonico; (c) os `arquivo:linha` desta Porta foram remedidos contra o codigo do fechamento. Antes deste card a Porta existia como linha **`clasp run -> Guardiao | headless`** na capsula de C05 (e repetida como `Portas de auditoria` em C08-01).
