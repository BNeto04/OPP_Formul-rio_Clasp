# PORTA C02/MOD-C02-01/P01 — Planilha → Leitura (abas mensais e EFETIVO)

- **Endereço global:** `C02_Leitura/MOD-C02-01_LEITURA_E_ADAPTACAO/P01`
- **Escala:** modulo
- **Origem:** Google Sheets (fonte **externa** a Planta) — `Core/LeitorPlanilhas.js:25-38` (`ss.getSheetByName` + `getRange(...).getValues()`) e `Leitura/Adaptador2026.js:44-52`
- **Destino:** estruturas em memoria do leitor/adaptador (`Core/LeitorPlanilhas.js:39-60`; `Leitura/Adaptador2026.js:38-120`)
- **Elegibilidade (§12.6):** ELEGÍVEL — (A) cruza fronteira: a fonte (Sheets) esta **fora da Planta**; e a unica porta que conhece o layout fisico das abas (invariante da capsula de C02)
- **Estado:** VERDE — checklist §12.6 sem itens pendentes

## Payload
Matriz 2D de valores da aba (`dados = sheet.getRange(1,1,lastRow,lastCol).getValues()`), com cabecalho na linha 1 (`Core/LeitorPlanilhas.js:38-40`; `Leitura/Adaptador2026.js:50`).

## require
1. aba existe (`ss.getSheetByName`); ausente ⇒ aba pulada com aviso (`Core/LeitorPlanilhas.js:31-32`).
2. aba com pelo menos 2 linhas e 1 coluna (`Core/LeitorPlanilhas.js:36`; `Leitura/Adaptador2026.js:48-52`).
3. coluna de matricula localizada; ausente ⇒ aba pulada com aviso (`Core/LeitorPlanilhas.js:43-46`).
4. ao menos uma coluna identificadora de ocorrencia (MIKE ou BOE); ausente ⇒ aba pulada com aviso (`Core/LeitorPlanilhas.js:47-49`).

## ensure
1. **cabecalho desconhecido nao vira indice suposto**: sem match de alias a leitura falha explicitamente (`FALHA_ADAPTADOR_SEM_FATOS` — invariante 4 e secao Limites da capsula de C02).
2. a leitura de formula no runtime e feita por `Range.getFormulas()` onde o fluxo precisa dela (`Entrada/EntradaManual.js:338`, `Features/CorretorQualidade.js:100`, `Features/GuardiaoQualidade.js:164`).
3. o resultado e um retrato da aba no momento da leitura; nao ha agregacao nesta Porta (Regra de Ouro #4, documentada no cabecalho do adaptador).

## invariant
1. somente leitura: esta Porta nao escreve em nenhuma celula (secao Limites da capsula de C02).
2. **divergencia D-164-01 declarada:** a capsula de C02 descreve este contrato como "`valueRenderOption=FORMULA` **e** `FORMATTED_VALUE` (metodo do #142)". Medicao: `grep -rn valueRenderOption` no codigo de produto = **0** ocorrencias e `appsscript.json` **nao** habilita servico avancado do Sheets (`"dependencies": {}`). Aquilo foi o **metodo de medicao do card #142**, nao uma chamada de runtime. O contrato correto do runtime e `getValues()` + `getFormulas()` onde necessario.

## Checklist de produção (§12.6)

| Item | Estado | Resposta (fato medido) |
|---|---|---|
| idempotente | aplicavel | somente leitura: a mesma aba produz o mesmo retrato; nenhum estado alterado. |
| deduplicacao | nao_aplicavel | nao cria registro (a deduplicacao de linhas dentro do tunel e regra do leitor, nao efeito desta Porta). |
| rate_limit | nao_aplicavel | uma leitura por aba por execucao do fluxo; o volume e limitado pelas abas do documento (13 no maximo). |
| paginacao | aplicavel | a leitura e por **aba** (unidade natural de recorte: `ss.getSheetByName` + `getRange`), e cada aba e lida em uma chamada — o recorte existe por desenho (uma aba por vez, `Core/LeitorPlanilhas.js:26-38`). O fluxo nunca pede o documento inteiro de uma vez. |
| validacao_entrada | aplicavel | antes de ler valores a Porta valida existencia da aba, dimensao minima e presenca das colunas-chave; sem elas **pula com aviso** em vez de ler lixo (`Core/LeitorPlanilhas.js:31,36,44,48`). |
| operacao_atomica | nao_aplicavel | sem escrita: nao existe estado intermediario a proteger. |
| race_condition | aplicavel | a Porta **nao muda a fonte**, mas o retrato pode ser lido no meio de uma gravacao concorrente (ex.: operador gravando o BO na aba mensal). Contrato declarado: o leitor e um retrato pontual e a triagem de inconsistencia e do Guardiao; **nao** ha promessa de leitura consistente com a gravacao — o risco e nomeado, nao escondido. |
| cache | nao_aplicavel | o insumo muda entre execucoes (dado operacional vivo): cache introduziria leitura obsoleta sem ganho — declarado. |
| retry_pelo_cliente | aplicavel | o chamador e o proprio fluxo de leitura, que reexecuta na proxima rodada; a politica esta declarada: aba ausente e pulada com aviso, nunca aborta o fluxo inteiro (`Core/LeitorPlanilhas.js:31`). |

## Erros
Aba ausente/ilegivel ⇒ aba pulada + aviso (`Core/LeitorPlanilhas.js:31,44,48`). Cabecalho sem alias ⇒ erro explicito (`FALHA_ADAPTADOR_SEM_FATOS`), nunca indice suposto.

## Efeitos
Nenhum efeito de escrita. Leitura integral da aba (custo proporcional a `lastRow x lastCol`).

## Seguranca
Leitura do documento do proprio operador; nao ha escrita e nao ha rede.

## Observabilidade
Logger injetado registra aba varrida, linhas lidas/validas/ignoradas e avisos (`Core/LeitorPlanilhas.js:24-34`).

## Implementacao
`Core/LeitorPlanilhas.js:20-60` · `Leitura/Adaptador2026.js:38-60` · `Drivers/GoogleSheetsDriver.js:36`.

## Testes
`Testes/TestAdaptador2026.js` · `Testes/TestLeitorAntiguidadePeculio.js` · `Testes/TestMotorAnaliticoRegressao.js`.

## Evidencia
Leitura direta do codigo nesta sessao (13/09/2026): `Core/LeitorPlanilhas.js:26,31,36,38,43,47`; `Leitura/Adaptador2026.js:44-52`; `appsscript.json` (medido).

## Estado
Contrato declarado. Checklist §12.6 completo (0 pendentes). Antes deste card a Porta existia como linha **`Planilha -> Leitura`** na capsula de C02 — com o contrato de render option **equivocado** (divergencia D-164-01).
