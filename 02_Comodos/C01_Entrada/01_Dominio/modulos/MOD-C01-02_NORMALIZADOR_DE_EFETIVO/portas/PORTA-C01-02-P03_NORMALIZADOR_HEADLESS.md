# PORTA C01/MOD-C01-02/P03 — Prova headless do normalizador de efetivo

- **Endereço global:** `C01_Entrada/MOD-C01-02_NORMALIZADOR_DE_EFETIVO/P03`
- **Escala:** modulo
- **Origem:** chamador **fora da Planta**: `clasp run normalizarEfetivoHeadless` (`Features/NormalizadorEfetivo.js:431`) e a variante de teste `clasp run normalizarEfetivoTeste` (`:422`)
- **Destino:** aba `EFETIVO` (variante real) ou `EFETIVO_TESTE` (variante de teste) — `Features/NormalizadorEfetivo.js:423-433`
- **Elegibilidade (§12.6):** ELEGÍVEL — (A) cruza fronteira: o chamador esta **fora da Planta**; (B) e (C) o efeito e o mesmo da Porta C01/MOD-C01-02/P02 (escrita da referencia), com o mesmo par apagar/escrever
- **Estado:** AMARELO — 1 item(ns) `pendente` declarado(s) (BLOQUEIA a Porta em G7, §12.6)

## Payload
Sem payload de entrada (a variante de teste aceita somente opcoes internas: `abaDestino`, `abaLog`, `abaFonteExistentes`, `abaLegado` — `Features/NormalizadorEfetivo.js:422-429`). Retorno: objeto resumo `{peculio, legado, alertas, linhas, arca}` (`:81-87`).

## require
1. as mesmas pre-condicoes de fonte da Porta C01/MOD-C01-02/P02 (PECULIO configurado e aba PECULIO localizada — `Features/NormalizadorEfetivo.js:14-15,34-36`).
2. na rota `clasp run`, o retorno deve ser compativel com serializacao JSON (a variante de teste retorna objeto simples, sem UI).

## ensure
1. a variante de **teste** escreve em `EFETIVO_TESTE` / `EFETIVO_LEGADO_TESTE` e **nunca** na referencia canonica (`Features/NormalizadorEfetivo.js:422-429`) — o log vai para `[AUDITORIA] Efetivo TESTE`.
2. a variante **real** tem exatamente o efeito da Porta P02 (mesma funcao `executar()`, `:431-433`).

## invariant
1. esta Porta nao contem regra propria: e a mesma execucao sem UI — nenhuma divergencia de comportamento entre menu e headless (mesma funcao `NormalizadorEfetivo.executar`).
2. a referencia canonica so e tocada pela variante real; a variante de teste usa abas isoladas.

## Checklist de produção (§12.6)

| Item | Estado | Resposta (fato medido) |
|---|---|---|
| idempotente | aplicavel | **Referencia:** identico a Porta C01/MOD-C01-02/P02 (`clearContent`+`setValues` reconstroem a referencia, `Features/NormalizadorEfetivo.js:156-161`). |
| deduplicacao | aplicavel | **Referencia:** identico a P02 (matricula duplicada recusada com log `CRITICO`, `Features/NormalizadorEfetivo.js:47-50`). |
| rate_limit | nao_aplicavel | rota headless autenticada, chamada sob card/tarefa; sem volume externo. |
| paginacao | nao_aplicavel | a resposta e um resumo de contagens (`Features/NormalizadorEfetivo.js:81-87`). |
| validacao_entrada | aplicavel | nao aceita entrada de origem externa: o unico parametro e de uso interno/teste (`Features/NormalizadorEfetivo.js:422-429`) e as pre-condicoes de fonte falham antes da escrita (`:14-36`). |
| operacao_atomica | aplicavel | **Referencia:** mesma contratacao da P02 — substituicao integral de artefato derivado e regeneravel (a referencia e reconstruivel do PECULIO). |
| race_condition | pendente | **Justificativa (herdada e agravada):** esta Porta e justamente o **segundo chamador** que torna o risco da P02 real — o card headless pode rodar enquanto o operador sincroniza pelo menu, sobre as mesmas abas, sem `LockService` em nenhum arquivo de produto (`Features/NormalizadorEfetivo.js:158,160`; unica mencao do repositorio: stub de sandbox em `Testes/TestMenuP3.js:80`). **Decisao exigida:** a mesma da P02 (lock no inicio de `executar()` ou Instalacao transversal de serializacao). **Ate a decisao, esta Porta nao deve ser executada em paralelo com o gatilho de menu.** |
| cache | nao_aplicavel | mesma razao da P02: a Porta escreve; a leitura do PECULIO e unica por execucao. |
| retry_pelo_cliente | aplicavel | o chamador headless re- executa a prova por decisao do card; a reexecucao e segura por reconstrucao completa (mesma contratacao da P02), e a variante de teste e isolada da referencia. |

## Erros
Falha de pre-condicao lanca (mesma tabela da Porta P02); na variante real nao ha UI para apresentar, entao o registro fica na aba de auditoria (`Features/NormalizadorEfetivo.js:317-327`).

## Efeitos
Identicos aos da Porta C01/MOD-C01-02/P02 (escrita com apagamento em EFETIVO + EFETIVO_LEGADO + log de auditoria).

## Seguranca
Roda na conta do proprietario pela rota autenticada `clasp run`; nao expoe segredo; a variante de teste evita tocar a referencia.

## Observabilidade
Retorno objeto com contagens e regras ARCA (`Features/NormalizadorEfetivo.js:81-87`) + aba de auditoria.

## Implementacao
`Features/NormalizadorEfetivo.js:422-433` → `:6-88`.

## Testes
`Testes/TestNormalizadorEfetivo.js` (exercita `executar` sem UI) · `Testes/TestExecutorNormalizador.js`.

## Evidencia
Leitura direta do codigo nesta sessao (13/09/2026): `Features/NormalizadorEfetivo.js:422,423,431,432`.

## Estado
Contrato declarado. Checklist §12.6 herdado da Porta P02 onde o efeito e o mesmo (**referenciado, nao repetido**) e proprio nos itens de fronteira. **1 item `pendente`** (race_condition, herdado da escrita) — a Porta **bloqueia em G7**. Antes deste card a Porta nao estava descrita: existia apenas como funcao no arquivo.
