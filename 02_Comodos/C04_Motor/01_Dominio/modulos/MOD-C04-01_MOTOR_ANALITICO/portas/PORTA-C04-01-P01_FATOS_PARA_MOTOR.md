# PORTA C04/MOD-C04-01/P01 — Leitura → Motor (fatos canonicos no motor analitico)

- **Endereço global:** `C04_Motor/MOD-C04-01_MOTOR_ANALITICO/P01`
- **Escala:** modulo
- **Origem:** C02 (Porta C02/MOD-C02-01/P02) — `Leitura/Adaptador2026.extrairFatos` e `Core/LeitorPlanilhas.lerAbas`
- **Destino:** motor analitico de C04 — `Motor/DiagnosticoDeterministicoGxt.js:75-77`, `Features/CompiladorProdutividadeV2.js:32`, `Features/CentralAnalitica.js:133`
- **Elegibilidade (§12.6):** ELEGÍVEL — (A) cruza Comodo: o dado nasce em C02 e e consumido em C04
- **Estado:** VERDE — checklist §12.6 sem itens pendentes

## Payload
`RegistroCanonico[]` / `ocorrenciasNormalizadas` (`Motor/DiagnosticoDeterministicoGxt.js:4-8`).

## require
1. fatos entregues por `Adaptador2026.extrairFatos()` — nenhuma outra fonte e aceita (`Motor/DiagnosticoDeterministicoGxt.js:75-77`).
2. `mapaAntiguidade` quando o calculo exige (merito por armas, `Motor/PoliticaMeritoArmas.js`).

## ensure
1. **nenhum campo do fato e descartado** na reconstrucao (`Dominio/RegistroAnalitico.js` — invariante da capsula de C04).
2. a separacao arma fisica x participacao e obrigatoria: **sem fallback** para `QDT ARMAS` (`Motor/DiagnosticoDeterministicoGxt.js:8`).

## invariant
1. a Porta nao agrega nem muta o fato: consolidacao e responsabilidade do motor.
2. nada e gravado: a Porta transporta dado entre Comodos dentro do processo.

## Checklist de produção (§12.6)

| Item | Estado | Resposta (fato medido) |
|---|---|---|
| idempotente | aplicavel | transporta fatos sem estado: a mesma entrada produz o mesmo conjunto entregue ao motor. |
| deduplicacao | nao_aplicavel | nao cria registro; a identidade da ocorrencia vem do tunel resolvido em C02. |
| rate_limit | nao_aplicavel | chamada em processo pelo proprio fluxo; sem volume externo. |
| paginacao | aplicavel | a entrega e por **aba/lote** (o motor recebe os fatos de uma aba por vez: `Motor/DiagnosticoDeterministicoGxt.js:75-77`), nunca o documento inteiro em um payload. |
| validacao_entrada | aplicavel | o motor so aceita fatos produzidos por `extrairFatos` (`Motor/DiagnosticoDeterministicoGxt.js:75-77`), o que torna o produtor parte do contrato de entrada. |
| operacao_atomica | nao_aplicavel | Sem escrita: a Porta transporta fatos em processo e nao cria estado parcial em recurso. |
| race_condition | nao_aplicavel | dados locais da chamada; duas execucoes do motor nao compartilham estado mutavel. |
| cache | nao_aplicavel | fato vivo por execucao; cache nao e contratado. |
| retry_pelo_cliente | nao_aplicavel | o cliente e o proprio motor em processo; ausencia de fato e tratada como caminho ausente, nao como re-tentativa. |

## Erros
Falta de fatos ⇒ diagnostico declara o caminho ausente em vez de inventar valor (`Motor/DiagnosticoDeterministicoGxt.js` e `FALHA_ADAPTADOR_SEM_FATOS` na origem).

## Efeitos
Nenhum efeito persistente.

## Seguranca
Circulacao interna do dado de pessoa; sem saida externa.

## Observabilidade
Diagnosticos deterministicos expostos por portas headless de prova (Porta C02/MOD-C02-01/P03).

## Implementacao
`Motor/DiagnosticoDeterministicoGxt.js:75-77` · `Leitura/Adaptador2026.js:38` · `Dominio/RegistroAnalitico.js`.

## Testes
`Testes/TestMotorAnaliticoRegressao.js` · `Testes/TestSemanticaArmasQdt.js` · `Testes/TestMeritoEquipeArmas.js`.

## Evidencia
Leitura direta do codigo nesta sessao (13/09/2026): `Motor/DiagnosticoDeterministicoGxt.js:4,8,75,77`; `Leitura/Adaptador2026.js:38`.

## Estado
Contrato declarado. Checklist §12.6 completo (0 pendentes). Antes deste card a Porta existia como linha **`Leitura -> Motor`** na capsula de C04.
