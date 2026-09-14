# PORTA C01/MOD-C01-01/P05 — Prova headless da entrada manual (valida e NAO grava)

- **Endereço global:** `C01_Entrada/MOD-C01-01_FORMULARIO_E_MENUS/P05`
- **Escala:** modulo
- **Origem:** chamador **fora da Planta**: `clasp run validarEntradaManualHeadless -p '[{...}]'` — `Entrada/EntradaManualHeadless.js:10`
- **Destino:** nucleo permissivo `_processarEntradaManual` em modo simulacao (`Entrada/EntradaManual.js:36`), com `simular: true`
- **Elegibilidade (§12.6):** ELEGÍVEL — (A) cruza Comodo/fronteira: o chamador esta **fora da Planta** (linha de comando autenticada). Nao ha efeito de escrita — o modo simulacao o proibe
- **Estado:** VERDE — checklist §12.6 sem itens pendentes

## Payload
`payload` do BO (mesmo objeto da Porta C01/MOD-C01-01/P03). Retorno: **STRING JSON** `{ status, gravou:false, problemas[], relatorio{...} }` (`Entrada/EntradaManualHeadless.js:15-34`).

## require
1. `payload` e objeto nao vazio; ausente ⇒ `{status:'ERRO', gravou:false}` (`Entrada/EntradaManualHeadless.js:12-14`).
2. o retorno e **STRING JSON** — exigencia da rota `scripts.run` (`Entrada/EntradaManualHeadless.js:5`).

## ensure
1. `gravou: false` e **invariante do desenho**: a simulacao roda toda a validacao e nao escreve (`Entrada/EntradaManualHeadless.js:19`; `Entrada/EntradaManual.js:64`).
2. problemas sao devolvidos como lista de `{codigo, mensagem}` recortando o codigo do aviso (`Entrada/EntradaManualHeadless.js:21-23`).
3. nenhuma excecao escapa: qualquer erro vira `{status:'ERRO', mensagem}` (`Entrada/EntradaManualHeadless.js:36-38`).

## invariant
1. esta Porta **nunca** grava em aba mensal — por desenho, nao por sorte de caminho.
2. o relatorio devolve aba-alvo e `linhasComputadas` para tornar visivel o que teria sido escrito (`Entrada/EntradaManualHeadless.js:31-32`).

## Checklist de produção (§12.6)

| Item | Estado | Resposta (fato medido) |
|---|---|---|
| idempotente | aplicavel | o modo simulacao nao escreve: repetir a chamada produz o mesmo relatorio e nenhum efeito (`Entrada/EntradaManualHeadless.js:19`; `Entrada/EntradaManual.js:64`). |
| deduplicacao | nao_aplicavel | nao grava, logo nao cria registro duplicado; a deteccao de duplicidade da Porta P03 e reportada como problema. |
| rate_limit | nao_aplicavel | rota headless autenticada, chamada sob demanda por card/tarefa; sem volume externo. |
| paginacao | nao_aplicavel | a resposta e o relatorio de UM BO (`Entrada/EntradaManualHeadless.js:24-33`). |
| validacao_entrada | aplicavel | payload ausente/invalido e recusado antes de qualquer trabalho (`Entrada/EntradaManualHeadless.js:12-14`). |
| operacao_atomica | nao_aplicavel | sem escrita: nao existe estado intermediario a proteger. |
| race_condition | nao_aplicavel | somente leitura da aba-alvo; nao disputa linhas com a gravacao real. |
| cache | nao_aplicavel | nao ha leitura cara repetida a cachear. |
| retry_pelo_cliente | aplicavel | o chamador e externo (linha de comando): repetir a prova e **seguro por desenho**, porque a Porta nao grava — politica de re-tentativa declarada. |

## Erros
`ERRO` (payload invalido/excecao) · `PROBLEMAS` (avisos) · `OK` · `SIMULADO` (`Entrada/EntradaManualHeadless.js:15,36`).

## Efeitos
Nenhum. Somente leitura da aba-alvo para validacao (localizacao da aba mensal e varredura de BOE/MIKE).

## Seguranca
Nao grava e nao expoe token; roda na conta do proprietario pela rota `clasp run`.

## Observabilidade
Retorno JSON unico com `status`, `problemas`, `relatorio` (`Entrada/EntradaManualHeadless.js:15-34`).

## Implementacao
`Entrada/EntradaManualHeadless.js:10-40` → `Entrada/EntradaManual.js:36-79`.

## Testes
`Testes/TestEntradaManualDryRun.js` · `Testes/TestEntradaManualFormulario.js` (modo simulacao).

## Evidencia
Leitura direta do codigo nesta sessao (13/09/2026): `Entrada/EntradaManualHeadless.js:10,12,19,21,31,36`.

## Estado
Contrato declarado. Checklist §12.6 completo (0 pendentes). Antes deste card a Porta existia apenas como item da tabela de C08-01 (`Portas de entrada | headless`), sem arquivo §46.3 e **sem dono declarado** — este card registra o dono real: MOD-C01-01 (implementacao) / SUB-C01-01-02 (persistencia manual).
