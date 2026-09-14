# PORTA C06/MOD-C06-02/P03 — Prova headless do compilador de armas (clasp run)

- **Endereço global:** `C06_Relatorios/MOD-C06-02_MERITO_DE_ARMAS_GXT/P03`
- **Escala:** modulo
- **Origem:** chamador **fora da Planta**: `clasp run executarCompiladorArmasHeadless` — `Compilador_Armas.js:363`
- **Destino:** mesma cadeia das Portas C06/MOD-C06-02/P01 e P02 (`executarCompilador`, `:130`)
- **Elegibilidade (§12.6):** ELEGÍVEL — (A) cruza fronteira: chamador **fora da Planta**; (B) mesmo efeito de escrita; (C) reserva versionada de nome
- **Estado:** AMARELO — 1 item(ns) `pendente` declarado(s) (BLOQUEIA a Porta em G7, §12.6)

## Payload
Entrada: `mesesAlvo` (string separada por virgula ou lista; vazio ⇒ `['JAN2026']`) e `modo` (default `'LIVRE'`) — `Compilador_Armas.js:364-366`. Saida: **STRING JSON** (`:368`).

## require
1. mesmas pre-condicoes de fonte e cabecalho das Portas P01/P02 (`Compilador_Armas.js:131,146-149,172-175`).
2. retorno serializavel — exigencia de `scripts.run` (`:368`).

## ensure
1. **nunca devolve `undefined`**: fallback `{sucesso:null, aviso:'executarCompilador nao retornou resumo'}` (`Compilador_Armas.js:368`).
2. a UI e opcional no caminho headless (`_uiSeguraArmas_()`, `:132`) — sem UI a Porta executa e retorna o resumo, sem alerta.
3. o efeito e identico ao da Porta P01/P02 (mesma funcao, sem clique): aba versionada + log.

## invariant
1. esta Porta nao tem regra propria: e a mesma compilacao sem UI — nenhuma divergencia de calculo entre menu e headless.
2. nao altera abas mensais.

## Checklist de produção (§12.6)

| Item | Estado | Resposta (fato medido) |
|---|---|---|
| idempotente | pendente | **Justificativa (herdada):** mesma reserva versionada de nome das Portas P01/P02 (`Compilador_Armas.js:251-260`) — a prova headless cria mais uma aba por execucao. **Decisao exigida:** a mesma (politica de versionamento/expurgo ou sobrescrita idempotente). |
| deduplicacao | aplicavel | **Referencia:** identico as Portas P01/P02 (um registro por tunel; `Motor/PoliticaMeritoArmas.js:4-6`). |
| rate_limit | nao_aplicavel | rota headless autenticada, chamada sob demanda por card/tarefa. |
| paginacao | aplicavel | **Referencia:** o recorte e uma lista de meses (`Compilador_Armas.js:364-365`); vazio significa `['JAN2026']` — declarado, nao ambiguo. |
| validacao_entrada | aplicavel | `mesesAlvo` e normalizado (string ou lista) com default explicito e `modo` tem default `'LIVRE'` (`Compilador_Armas.js:364-366`); as validacoes de cabecalho/matricula bloqueiam (`:172-175,210`). |
| operacao_atomica | aplicavel | **Referencia:** identico as Portas P01/P02 (aba nova por passos; artefato derivado e regeneravel). |
| race_condition | aplicavel | **Referencia:** identico as Portas P01/P02 (nome versionado; colisao de nome falha de forma ruidosa no Sheets, sem corromper a aba da outra execucao; log sobrescrito por inteiro — `Compilador_Armas.js:255-260,327`). |
| cache | nao_aplicavel | dado vivo; a prova le as abas naquele instante. |
| retry_pelo_cliente | aplicavel | o chamador headless repete a prova sob demanda; a repeticao cria nova versao e nao exige limpeza manual (`Compilador_Armas.js:255-260`). |

## Erros
Identicos aos das Portas P01/P02 (`Compilador_Armas.js:172-175,210`); erro bloqueante vira `{sucesso:false, erro, logs}` no JSON (`:356-358`).

## Efeitos
Identicos aos das Portas C06/MOD-C06-02/P01 e P02.

## Seguranca
Roda na conta do proprietario pela rota autenticada; nao abre UI.

## Observabilidade
JSON de retorno com `sucesso`, nome da aba gerada e `logs` (`Compilador_Armas.js:353,368`).

## Implementacao
`Compilador_Armas.js:359-369` → `:130-354`.

## Testes
`Testes/TestRelatorioArmas.js` (carrega o arquivo sem altera-lo) — a rota headless e provada por `clasp run` (planilha real), **declarado**.

## Evidencia
Leitura direta do codigo nesta sessao (13/09/2026): `Compilador_Armas.js:359,363,364,366,368`.

## Estado
Contrato declarado. **1 item `pendente`** (idempotente, herdado) — a Porta **bloqueia em G7**. Antes deste card a Porta existia como linha **`clasp run -> compilador`** na capsula de C06-02 (e repetida como `Portas de produto` em C08-01).
