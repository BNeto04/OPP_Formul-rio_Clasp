# PORTA C06/MOD-C06-01/P02 — Prova headless do comparativo 2026 (clasp run)

- **Endereço global:** `C06_Relatorios/MOD-C06-01_RELATORIOS_OFICIAIS/P02`
- **Escala:** modulo
- **Origem:** chamador **fora da Planta**: `clasp run gerarComparativo2026Headless` — `Features/CompiladorProdutividade.js:92`
- **Destino:** mesma cadeia da Porta C06/MOD-C06-01/P01 (`gerarComparativo2026Premium`, `:40`)
- **Elegibilidade (§12.6):** ELEGÍVEL — (A) cruza fronteira: chamador **fora da Planta**; (B) mesmo efeito de escrita; (C) e o segundo chamador que torna o risco concorrente real
- **Estado:** VERDE — 0 item `pendente`/0 bloqueante (§12.6); trava global herdada da P01.

## Payload
Entrada: `abas` como string separada por virgula ou lista; vazio = todas as abas mensais de 2026 (`Features/CompiladorProdutividade.js:93-96`). Saida: **STRING JSON** (`return JSON.stringify(r || {...})`, `:97`).

## require
1. mesmas pre-condicoes de fonte da Porta P01 (`Features/CompiladorProdutividade.js:40-55`).
2. retorno serializavel — exigencia de `scripts.run` (`:97`).

## ensure
1. **nunca devolve `undefined`**: o fallback `{sucesso:null, aviso:'sem retorno'}` cobre retorno vazio (`Features/CompiladorProdutividade.js:97`).
2. a UI e **opcional** no caminho headless: `_uiSeguraComparativo_()` devolve `null` quando `SpreadsheetApp.getUi` nao existe, e a Porta segue sem alerta (`:85-90`).
3. o efeito e identico ao da Porta P01 (mesma funcao, sem clique) — inclusive a escrita da aba `COMPARATIVO_2026` e do log.

## invariant
1. esta Porta nao tem regra propria: e a mesma geracao sem UI (nenhuma divergencia de calculo entre menu e headless).
2. nao altera abas mensais.

## Checklist de produção (§12.6)

| Item | Estado | Resposta (fato medido) |
|---|---|---|
| idempotente | aplicavel | **Referencia:** identico a Porta C06/MOD-C06-01/P01 (`sheet.clear()` antes de reescrever, `Render/RendererComparativo2026.js:9-13`). |
| deduplicacao | aplicavel | **Referencia:** identico a P01 (consolidacao por policial e identidade do tunel, `Features/CompiladorProdutividade.js:57`). |
| rate_limit | nao_aplicavel | rota headless autenticada, chamada sob demanda por card/tarefa. |
| paginacao | aplicavel | **Referencia:** mesmo recorte por aba da P01 (`Features/CompiladorProdutividade.js:93-96`). |
| validacao_entrada | aplicavel | a lista de abas e normalizada (string separada por virgula ou lista) e o vazio significa TODAS — declarado, nao ambiguo (`Features/CompiladorProdutividade.js:93-96`). |
| operacao_atomica | aplicavel | **Referencia:** mesmo contrato da P01 (substituicao de artefato derivado e regeneravel). |
| race_condition | aplicavel | **Resolvido pela trava global (`INST-SERIALIZACAO-001` (§8.11)):** esta Porta (segundo chamador da mesma aba de NOME FIXO) adquire a mesma trava em `Features/CompiladorProdutividade.js:120` (e a Porta premium em `:58`): a prova headless falha RUIDOSAMENTE (`SERIALIZACAO_OCUPADA`, devolvida como JSON) com ZERO escrita quando o operador esta gerando pelo menu. **Helper da trava:** `Core/SerializacaoEscrita.js` (helper unico da `INST-SERIALIZACAO-001`). **Evidencia:** `Testes/TestSerializacaoEscrita.js` (corrida + fail-closed). A proibicao declarada antes ("nao executar em paralelo") deixa de depender de disciplina humana. |
| cache | nao_aplicavel | mesma razao da P01: dado vivo. |
| retry_pelo_cliente | aplicavel | o chamador headless repete a geracao sob demanda; a repeticao e segura por reconstrucao completa da aba (`Render/RendererComparativo2026.js:11-13`). |

## Erros
Nenhuma aba de 2026 ⇒ `{sucesso:false, erro}` dentro do JSON (`Features/CompiladorProdutividade.js:52-54`).

## Efeitos
Identicos aos da Porta C06/MOD-C06-01/P01.

## Seguranca
Roda na conta do proprietario pela rota autenticada; nao abre UI nem dialogo.

## Observabilidade
JSON de retorno com aba gerada, abas lidas, policiais, ocorrencias e tempo (`Features/CompiladorProdutividade.js:81-82`).

## Implementacao
`Features/CompiladorProdutividade.js:92-98` → `:40-82`.

## Testes
`Testes/TestRendererComparativo2026.js` (renderer) — a rota headless e provada por `clasp run` (depende de planilha real), **declarado**.

## Evidencia
Leitura direta do codigo nesta sessao (13/09/2026): `Features/CompiladorProdutividade.js:85,92,93,97`.

## Estado
Contrato declarado. **1 item `pendente`** (race_condition, herdado) — a Porta **bloqueia em G7**. Antes deste card a Porta existia como linha **`clasp run -> comparativo | headless`** na capsula de C06-01.
**Fechamento (#164, 14/09/2026):** o `race_condition` herdado saiu de `pendente` com prova: a rota headless (`clasp run`) roda no mesmo projeto de script e observa a MESMA trava.
