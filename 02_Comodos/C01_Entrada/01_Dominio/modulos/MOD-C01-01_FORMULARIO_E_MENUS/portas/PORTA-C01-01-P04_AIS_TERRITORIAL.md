# PORTA C01/MOD-C01-01/P04 — Formulario → C03 (resolucao territorial AIS)

- **Endereço global:** `C01_Entrada/MOD-C01-01_FORMULARIO_E_MENUS/P04`
- **Escala:** modulo
- **Origem:** formulario HTML (`google.script.run`) — `Entrada/EntradaManual.js:685` (`resolverAISTerritorial`) e `:663` (`obterTabelaTerritorialAIS`)
- **Destino:** dominio territorial de C03 — `Dominio/ResolverAIS.js` + `Dominio/TabelaTerritorialAIS` (`Entrada/EntradaManual.js:692-698`)
- **Elegibilidade (§12.6):** ELEGÍVEL — (A) cruza Comodo: a resolucao pertence a C03 (Dominio) e e pedida por C01
- **Estado:** VERDE — checklist §12.6 sem itens pendentes

## Payload
Entrada: `cidade` + `bairro` (strings). Saida: `{ ais, sucesso, criterio, ... }`; falha devolve `status: 'PENDENTE_CONFERENCIA'` (`Entrada/EntradaManual.js:700-707`).

## require
1. `resolverAIS` disponivel no escopo global ou por `require('../Dominio/ResolverAIS')` (`Entrada/EntradaManual.js:690-697`).
2. tabela territorial disponivel (`obterTabelaTerritorialAIS`, `Entrada/EntradaManual.js:663-673`).

## ensure
1. **nunca chuta**: sem base suficiente a resposta e `PENDENTE_CONFERENCIA` e nao uma AIS suposta (`Entrada/EntradaManual.js:703-706`; invariante 1 da capsula de C03).
2. falha de backend devolve objeto tipado com `criterio: 'ERRO_BACKEND'`, nunca excecao solta (`Entrada/EntradaManual.js:704-707`).

## invariant
1. a Porta nao grava: resolver AIS nao altera aba nem EFETIVO.
2. a tabela territorial e a fonte unica de resolucao — nenhuma lista paralela e criada aqui.

## Checklist de produção (§12.6)

| Item | Estado | Resposta (fato medido) |
|---|---|---|
| idempotente | aplicavel | funcao pura cidade+bairro → AIS: mesma entrada, mesma saida, nenhum estado alterado. |
| deduplicacao | nao_aplicavel | resolucao, nao criacao de registro; nada a deduplicar. |
| rate_limit | nao_aplicavel | chamada pelo formulario por interacao de operador; sem volume externo. |
| paginacao | nao_aplicavel | resposta e um objeto unico de resolucao territorial. |
| validacao_entrada | aplicavel | sem base suficiente o retorno e `PENDENTE_CONFERENCIA` — a Porta declara explicitamente que **nao chuta** (`Entrada/EntradaManual.js:703-706`). |
| operacao_atomica | nao_aplicavel | sem escrita: nao existe estado intermediario. |
| race_condition | nao_aplicavel | funcao pura sem estado compartilhado; duas chamadas concorrentes nao interagem. |
| cache | nao_aplicavel | a tabela e constante de dominio carregada em processo (`Entrada/EntradaManual.js:665-670`); nao ha leitura externa cara repetida. |
| retry_pelo_cliente | nao_aplicavel | o desfecho e deterministico e tipado; re-tentar produz o mesmo resultado. |

## Erros
`ERRO_BACKEND` · `PENDENTE_CONFERENCIA` (`Entrada/EntradaManual.js:704-706`); tabela indisponivel ⇒ `null` (`:671-673`).

## Efeitos
Nenhum efeito persistente.

## Seguranca
Somente resolucao local de cidade/bairro; sem rede e sem dado sensivel proprio.

## Observabilidade
`criterio` e `status` tipados na resposta (`Entrada/EntradaManual.js:705-706`); `console.error` em falha (`:702`).

## Implementacao
`Entrada/EntradaManual.js:663-707` → `Dominio/ResolverAIS.js`, `Dominio/TabelaTerritorialAIS`.

## Testes
`Testes/TestFormularioAis.js` · `Testes/TestFormularioAisSei.js` · `Testes/TestFormularioCidadeBairro.js`.

## Evidencia
Leitura direta do codigo nesta sessao (13/09/2026): `Entrada/EntradaManual.js:663,685,690,700,703`.

## Estado
Contrato declarado. Checklist §12.6 completo (0 pendentes). Antes deste card a Porta existia como linha **`Formulario → C03 (AIS)`** na capsula de C01-01.
