# PORTA C00/MOD-C00-03/P01 — Log de auditoria materializado em aba do Sheets

- **Endereço global:** `C00_Governanca_Estrutural/MOD-C00-03_INFRAESTRUTURA_CORE/P01`
- **Escala:** modulo
- **Origem:** instancia de `SyntheonLogger` do fluxo de leitura (`Core/Logger.js`), entregue pelo chamador — ex.: `Features/CompiladorProdutividade.js:43,78`
- **Destino:** aba de log/relatorio no mesmo documento Sheets — `Core/Logger.js:43` (`gravarPlanilha`) → `Render/RendererAuditoria.js:6-24`
- **Elegibilidade (§12.6):** ELEGÍVEL — (B) expõe efeito externo: grava uma aba no Sheets; (C) lida com concorrência: duas geracoes do mesmo fluxo escrevem a **mesma** aba de log
- **Estado:** VERDE — 0 item `pendente`/0 bloqueante (§12.6); a corrida do log esta serializada pela instalação transversal `INST-SERIALIZACAO-001`.

## Payload
O proprio objeto `SyntheonLogger` (modo, `abasLidas`, `linhasLidas`, `linhasValidas`, `linhasIgnoradas`, `duplicidades`, `matriculasNaoEncontradas`, `avisos`) e o nome da aba de resultado — `Render/RendererAuditoria.js:27-64`.

## require
1. `logger` existe e esta populado (o objeto e construido antes da leitura; `Features/CompiladorProdutividade.js:43`).
2. `nomeAbaLog` e `nomeAbaResultado` nao vazios (o chamador sempre informa: `Features/CompiladorProdutividade.js:78`).
3. existe um `Spreadsheet` ativo ao qual a aba de log pertence.

## ensure
1. a aba `nomeAbaLog` existe ao final (criada quando ausente: `Render/RendererAuditoria.js:9`).
2. o conteudo anterior e apagado antes da escrita (`sheet.clear()`, `Render/RendererAuditoria.js:11`) e o relatorio ocupa da linha 1 em diante (`:14`).
3. o estado intermediario possivel (aba de log vazia entre `clear()` e `setValues`) e **artefato regeneravel**, nunca dado operacional: a fonte de verdade (abas mensais) nao e tocada por esta Porta.

## invariant
1. esta Porta escreve apenas em aba de log; nenhuma celula das abas mensais e alterada.
2. nenhum dado operacional (ocorrencia, efetivo, pontuacao) atravessa esta Porta — ela transporta estatistica de execucao.

## Checklist de produção (§12.6)

| Item | Estado | Resposta (fato medido) |
|---|---|---|
| idempotente | aplicavel | `sheet.clear()` antes de `setValues` (`Render/RendererAuditoria.js:11,14`): reprocessar o mesmo insumo reescreve a mesma aba, sem acumular lixo. |
| deduplicacao | nao_aplicavel | nao ha ingestao de registros: o log e um retrato do logger, nao um historico acumulado. |
| rate_limit | nao_aplicavel | chamada uma vez por execucao do fluxo, pelo proprio runtime; sem volume externo nem rede. |
| paginacao | nao_aplicavel | o relatorio e um bloco unico (cabecalho + secoes) escrito de uma vez (`:14`). |
| validacao_entrada | aplicavel | exige `nomeAbaLog` nao vazio; sem ele nao ha destino — o chamador sempre informa (`Features/CompiladorProdutividade.js:78`). |
| operacao_atomica | aplicavel | efeito = substituicao de um retrato regeneravel em UMA aba de log; o pior estado intermediario e a aba de log vazia, nunca dado operacional parcial (`:11,14`). |
| race_condition | aplicavel | **Resolvido pela trava global (`INST-SERIALIZACAO-001` (§8.11)):** a materializacao do log em aba de NOME FIXO passa a rodar sob a trava de escrita — `SyntheonLogger.gravarPlanilha` adquire `SyntheonSerializacaoEscrita.executarComLock` (`Core/Logger.js:57`) ANTES de `RendererAuditoria.render` (`Render/RendererAuditoria.js:11` faz `sheet.clear()`; `:14` faz `setValues`). Sem trava a Porta FALHA FECHADO (zero escrita). Dois geradores concorrentes (comparativo + armas/produtividade) nao se apagam nem produzem log hibrido. **Helper da trava:** `Core/SerializacaoEscrita.js` (helper unico da `INST-SERIALIZACAO-001`). **Evidencia:** `Testes/TestSerializacaoEscrita.js` (caso fail-closed + caso da corrida #1 do diagnostico). |
| cache | nao_aplicavel | o insumo ja esta em memoria (o objeto logger); nao ha leitura cara a cachear. |
| retry_pelo_cliente | nao_aplicavel | a Porta e o ultimo passo do fluxo; o proprio runtime e o chamador e o proximo ciclo reescreve o log. |

## Erros
Falha de escrita propaga ao chamador (o fluxo principal segue). Nao ha erro contratado proprio; a Porta nao engole excecao.

## Efeitos
Escrita (substituicao integral) de uma aba de log/relatorio no Sheets. Nenhuma mutacao de aba mensal.

## Seguranca
Escreve somente no documento ativo do proprio operador; nao expoe segredo nem dado de terceiro.

## Observabilidade
A Porta **e** o mecanismo de observabilidade: registro de abas varridas, linhas lidas/validas/ignoradas, duplicidades e avisos (`Render/RendererAuditoria.js:36-60`).

## Implementacao
`Core/Logger.js:43` · `Render/RendererAuditoria.js:6-64`. Consumidores declarados: `Features/CompiladorProdutividade.js:78` (`LOG_COMPARATIVO_2026`).

## Testes
`Testes/TestRendererComparativo2026.js` · `Testes/TestRenderers.js` exercitam os renderers; nao ha teste dedicado a esta Porta (declarado).

## Evidencia
Leitura direta do codigo nesta sessao (13/09/2026): `Core/Logger.js:43`; `Render/RendererAuditoria.js:9,11,14,27`.

## Estado
Contrato declarado. **1 item `pendente`** (race_condition) — a Porta **bloqueia em G7**. A Porta **nao** estava descrita formalmente antes deste card (existia apenas como linha na capsula de C00-03).
**Fechamento (#164, 14/09/2026):** o item `race_condition` saiu de `pendente` e virou `aplicavel` com prova — a decisao exigida (lock no gerador do log) foi implantada como instalação transversal (`INST-SERIALIZACAO-001`) e a fechadura `Testes/TestSerializacaoEscrita.js` nasce vermelha se a trava for removida. A aba de log continua de NOME FIXO (contrato do proprietario): o que mudou e a serializacao, nao o contrato.
