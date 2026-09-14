# PORTA C02/MOD-C02-01/P03 — Prova binaria headless (fonte x produto)

- **Endereço global:** `C02_Leitura/MOD-C02-01_LEITURA_E_ADAPTACAO/P03`
- **Escala:** modulo
- **Origem:** chamador **fora da Planta** (`clasp run`), funcoes de prova: `diagnosticarCaminhoArmasHeadless` (`Core/LeitorPlanilhas.js:298`), `verificarParticipacaoArmasHeadless` (`:349`), `verificarQtdOcorrenciasHeadless` (`:389`), `verificarDrogasHeadless` (`:423`), `verificarPontuacaoHeadless` (`:469`)
- **Destino:** abas mensais (fonte) e o caminho de produto (`SyntheonLeitor.lerAbas` + `SyntheonMetricas`) — comparacao fonte x produto
- **Elegibilidade (§12.6):** ELEGÍVEL — (A) cruza fronteira: o chamador esta **fora da Planta**; a Porta existe para provar o produto contra a fonte
- **Estado:** VERDE — checklist §12.6 sem itens pendentes

## Payload
Entrada: matriculas/abas alvo. Saida: **STRING JSON** com o valor da fonte, o valor do produto e o veredito binario — ex.: `out.confere = (out.totalFonte === out.produto)` (`Core/LeitorPlanilhas.js:385`); `produto_igual_a_soma` / `produto_igual_a_maior` (`:533-534`).

## require
1. documento ativo disponivel (`SpreadsheetApp.getActiveSpreadsheet()`, `Core/LeitorPlanilhas.js:299,350,390,424,470`).
2. retorno em STRING JSON (exigencia da rota `scripts.run`, declarada em `Entrada/EntradaManualHeadless.js:5` e no padrao das demais portas headless).

## ensure
1. toda prova devolve **veredito explicito** (`confere` booleano ou par de comparacoes), nunca so o dado bruto (`Core/LeitorPlanilhas.js:385,533-534`).
2. aba ausente e nomeada no resultado (`out.porMes[nome] = 'aba ausente'`, `Core/LeitorPlanilhas.js:356`) — a prova nao esconde buraco.
3. erro de leitura do produto e capturado e devolvido no proprio JSON (`out.produto = 'erro: ...'`, `:377-380`), sem derrubar a prova.

## invariant
1. esta Porta **nao conserta nada**: mede (`Core/LeitorPlanilhas.js:294`, "Nao conserta nada - so mede").
2. nenhuma escrita em aba: as provas sao somente leitura.

## Checklist de produção (§12.6)

| Item | Estado | Resposta (fato medido) |
|---|---|---|
| idempotente | aplicavel | somente leitura e funcao deterministica: repetir a prova com a mesma fonte e o mesmo produto devolve o mesmo veredito. |
| deduplicacao | nao_aplicavel | nao cria registro; a comparacao fonte x produto e o proprio objeto. |
| rate_limit | nao_aplicavel | rota headless autenticada, executada sob demanda por card/tarefa. |
| paginacao | nao_aplicavel | a prova e por matricula/aba e devolve um JSON compacto por chamada (`out.porMes` com 9 chaves). |
| validacao_entrada | aplicavel | ausencia de aba-alvo e nomeada no resultado (`Core/LeitorPlanilhas.js:356`) e matricula alvo e normalizada para texto (`:351`). |
| operacao_atomica | nao_aplicavel | Porta de prova somente-leitura: nenhum passo de escrita, logo nenhum estado parcial. |
| race_condition | aplicavel | a prova le a fonte e roda o produto na **mesma** janela: uma gravacao concorrente pode fazer a prova acusar divergencia que nao existe. Contrato declarado: o veredito vale para o instante da medicao e a prova **nunca** escreve — o risco e de falso negativo, nunca de dano. |
| cache | nao_aplicavel | o objetivo e medir o estado corrente; cache anularia a prova. |
| retry_pelo_cliente | aplicavel | o chamador headless repete a prova quando o produto muda; a repeticao e segura por desenho (somente leitura) — politica declarada. |

## Erros
Nao lancam: erro e serializado no JSON de retorno (`Core/LeitorPlanilhas.js:377-380`).

## Efeitos
Nenhum efeito persistente. Leitura de varias abas por prova (custo proporcional a 9 abas mensais).

## Seguranca
Roda na conta do proprietario pela rota autenticada; devolve dado de pessoa da propria planilha ao console local.

## Observabilidade
E o proprio instrumento de observabilidade do produto: cada funcao isola um elo da corrente (participacao, QTD O, drogas, pontuacao).

## Implementacao
`Core/LeitorPlanilhas.js:298-538`.

## Testes
Os testes da suite nao cobrem estas funcoes diretamente (dependem de planilha real); a prova e a execucao por `clasp run` — **declarado**.

## Evidencia
Leitura direta do codigo nesta sessao (13/09/2026): `Core/LeitorPlanilhas.js:294,298,349,377,385,389,423,469,533`.

## Estado
Contrato declarado. Checklist §12.6 completo (0 pendentes). Antes deste card a Porta existia apenas como linha **`Portas de prova | binarias`** na tabela de C08-01, sem dono declarado — este card registra o dono real: MOD-C02-01 (implementacao em `Core/LeitorPlanilhas.js`).
