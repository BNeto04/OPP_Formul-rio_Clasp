# PORTA C02/MOD-C02-01/P02 — Leitura → C03/C04 (fatos canonicos: RegistroCanonico)

- **Endereço global:** `C02_Leitura/MOD-C02-01_LEITURA_E_ADAPTACAO/P02`
- **Escala:** modulo
- **Origem:** `Leitura/Adaptador2026.js:38` (`extrairFatos`) e o caminho de leitura consolidada (`Core/LeitorPlanilhas.js` → `Core/Metricas.js`)
- **Destino:** C03 (chave do tunel e `RegistroCanonico`) e C04 (motor analitico) — consumidores medidos: `Motor/DiagnosticoDeterministicoGxt.js:77`, `Features/CentralAnalitica.js:133`, `Features/CompiladorProdutividadeV2.js:32`, `Features/CompiladorGxt.js:164`
- **Elegibilidade (§12.6):** ELEGÍVEL — (A) cruza Comodo: a Porta entrega dado de C02 para C03 e C04
- **Estado:** VERDE — checklist §12.6 sem itens pendentes

## Payload
`Array<RegistroCanonico>` — um registro por linha valida, com fatos por policial (ocorrencia, armas, drogas, participacao, pontuacao) e `mapaAntiguidade` (`matricula -> N`) (`Leitura/Adaptador2026.js:38-120`).

## require
1. entrada e uma aba do Sheets ou matriz 2D; qualquer outra coisa devolve `[]` (`Leitura/Adaptador2026.js:44-57`).
2. cabecalho reconhecido por alias (`Core/Cabecalhos.js` + `Core/Constantes.js`) — sem match nao ha posicao suposta (`Leitura/Adaptador2026.js:60-80`).

## ensure
1. **sem agregacao e sem mutacao posterior**: o adaptador apenas traduz linhas fisicas em fatos (Regra de Ouro #4, `Leitura/Adaptador2026.js:3-8`; secao Limites da capsula de C02).
2. o consumo a jusante ocorre **sem fallback para `QDT ARMAS`** (`Motor/DiagnosticoDeterministicoGxt.js:8`).
3. nenhum campo do fato e descartado na reconstrucao a jusante (invariante da capsula de C04).

## invariant
1. esta Porta nao grava e nao altera a fonte.
2. a chave de identidade entregue e a do tunel (`DATA | MIKE | BOE`), e a linha-filha herda a DATA da mestra (`Core/LeitorPlanilhas.js`, #152).

## Checklist de produção (§12.6)

| Item | Estado | Resposta (fato medido) |
|---|---|---|
| idempotente | aplicavel | funcao deterministica sobre a matriz lida: mesmo insumo ⇒ mesmo conjunto de fatos, sem estado alterado. |
| deduplicacao | nao_aplicavel | nao cria registro persistente; a identidade do tunel (chave `DATA|MIKE|BOE`) e resolvida pelo leitor, nao por esta Porta. |
| rate_limit | nao_aplicavel | chamada em processo pelos consumidores (C03/C04), sem volume externo. |
| paginacao | aplicavel | a entrega e por **aba** — semantica identica a da Porta C02/MOD-C02-01/P01 (uma matriz por chamada, `Leitura/Adaptador2026.js:44-52`); o consumidor nunca recebe o documento inteiro em um unico payload. |
| validacao_entrada | aplicavel | tipo de fonte e cabecalho sao validados antes da traducao; cabecalho sem alias **falha explicitamente** (`Leitura/Adaptador2026.js:44-80`). |
| operacao_atomica | nao_aplicavel | Porta de transporte de fatos, sem escrita: nao existe estado intermediario a proteger. |
| race_condition | nao_aplicavel | estruturas locais por chamada; duas chamadas concorrentes nao compartilham estado mutavel. |
| cache | nao_aplicavel | dado vivo: cache introduziria fato obsoleto (mesma razao da P01). |
| retry_pelo_cliente | nao_aplicavel | o consumidor e um Modulo interno em processo; falha de cabecalho e erro explicito, nao convite a re-tentativa. |

## Erros
Cabecalho/aba nao reconhecidos ⇒ `FALHA_ADAPTADOR_SEM_FATOS` (explicito, sem fallback) — secao Erros da capsula de C02.

## Efeitos
Nenhum efeito persistente. Alocacao de estruturas em memoria proporcionais ao volume lido.

## Seguranca
Circula dado de pessoa (nome, matricula, posto) **dentro** da Planta; nao sai do documento nem da memoria.

## Observabilidade
Fatos consumidos por diagnosticos e provas binarias; a prova headless equivalente e a Porta C02/MOD-C02-01/P03.

## Implementacao
`Leitura/Adaptador2026.js:38-120` · `Core/LeitorPlanilhas.js:20-60` · `Core/Metricas.js`.

## Testes
`Testes/TestAdaptador2026.js` · `Testes/TestMotorAnaliticoRegressao.js` · `Testes/TestBoeAusente.js`.

## Evidencia
Leitura direta do codigo nesta sessao (13/09/2026): `Leitura/Adaptador2026.js:38,44,50,60`; `Motor/DiagnosticoDeterministicoGxt.js:8,77`.

## Estado
Contrato declarado. Checklist §12.6 completo (0 pendentes). Antes deste card a Porta existia como linha **`Leitura -> C03/C04`** na capsula de C02.
