# PORTA C05/MOD-C05-01/P03 — Guardiao → coluna de alerta (AM) da aba auditada

- **Endereço global:** `C05_Guardiao/MOD-C05-01_GUARDIAO_DE_QUALIDADE/P03`
- **Escala:** modulo
- **Origem:** `Features/GuardiaoQualidade.js:647-651` (dentro de `varrerAba`, `:78`)
- **Destino:** coluna **AM** (indice 0-based 38) da propria aba mensal auditada — `Render/RendererAuditoriaSaude.js:348` (`aplicarDestaquesAlertasAM_`) e `:392` (`prepararColunaAlertas`)
- **Elegibilidade (§12.6):** ELEGÍVEL — (B) expoe efeito externo: **escreve na aba operacional** (nao so em aba de apoio); (C) lida com concorrencia: a coluna e regravada apos a varredura, no mesmo dado que foi lido
- **Estado:** AMARELO — 1 item(ns) `pendente` declarado(s) (BLOQUEIA a Porta em G7, §12.6)

## Payload
`Array` de textos de alerta, uma linha por linha de dado da aba (`Features/GuardiaoQualidade.js:638-646`); a coluna recebe o texto consolidado dos diagnosticos da linha, unidos por ` | `.

## require
1. a coluna ALERTA e localizada pelo cabecalho (`Features/GuardiaoQualidade.js:195`, `loc('ALERTA_INTEGRIDADE')`).
2. quando o cabecalho nao existe, a Porta **cria** a coluna AM: `idx.alerta = 38` + `setValue('Alerta Integridade')` na linha 1 (`Features/GuardiaoQualidade.js:199-201`) — efeito declarado, nao implicito.

## ensure
1. **A:AL preservadas**: o destaque e aplicado na coluna AM e o caminho sem alerta limpa **apenas o destaque visual** de AM, sem alterar qualquer celula de A:AL (`Render/RendererAuditoriaSaude.js:372,379`).
2. a escrita e em bloco unico: `setValues(saida)` de uma coluna por `saida.length` linhas (`Features/GuardiaoQualidade.js:648`), com preparacao previa da coluna (`RendererAuditoriaSaude.js:392`).

## invariant
1. a coluna de alerta e **derivada**: nenhum dado de origem (A:AL) e alterado por esta Porta.
2. o alerta e por linha de dado e corresponde aos diagnosticos daquela linha (`Features/GuardiaoQualidade.js:638-646`).

## Checklist de produção (§12.6)

| Item | Estado | Resposta (fato medido) |
|---|---|---|
| idempotente | aplicavel | a coluna e regravada integralmente por bloco (`setValues` de `saida.length` linhas, `Features/GuardiaoQualidade.js:648`): reauditar com o mesmo dado reconstroi o mesmo conteudo, sem acumular texto de execucoes anteriores. |
| deduplicacao | aplicavel | os textos por linha sao deduplicados antes de virar alerta (`RegrasQualidade.unicos(...)`, `Features/GuardiaoQualidade.js:639-642`) — o mesmo diagnostico nao aparece duas vezes na mesma linha. |
| rate_limit | nao_aplicavel | executada por gesto do operador ou prova headless sob demanda; sem volume externo. |
| paginacao | nao_aplicavel | a escrita e uma coluna da aba corrente; sem colecao paginavel. |
| validacao_entrada | aplicavel | a coluna e localizada por cabecalho; ausente, a Porta **declara** a criacao (`Features/GuardiaoQualidade.js:199-201`) em vez de escrever em coluna suposta. |
| operacao_atomica | aplicavel | o efeito e a substituicao de **uma** coluna derivada em bloco unico (`Features/GuardiaoQualidade.js:648`), com o destaque aplicado depois (`:651`). O pior estado intermediario e a coluna AM sem o destaque visual — dado derivado, regeneravel por nova auditoria; A:AL permanecem intactas em qualquer ponto. |
| race_condition | pendente | **Justificativa:** a auditoria **le** a aba e **escreve nela** na mesma execucao (ler-depois-escrever sobre a mesma regiao de linhas: `Features/GuardiaoQualidade.js:162,648`). Duas auditorias concorrentes (operador na UI + card headless) podem gravar a coluna AM de linhas que a outra ainda nao leu, fazendo os alertas de uma execucao corresponderem a um retrato parcial. O codigo de produto **nao** usa `LockService` (unica mencao no repositorio: stub de sandbox em `Testes/TestMenuP3.js:80`). **Decisao exigida:** `LockService` no ciclo de auditoria; ate a decisao, auditar a mesma aba em paralelo por UI e headless e proibido por contrato. |
| cache | nao_aplicavel | a Porta escreve; a leitura da aba acontece uma vez por auditoria (`Features/GuardiaoQualidade.js:162`). |
| retry_pelo_cliente | aplicavel | o chamador e o operador/agente: nova auditoria reescreve a coluna inteira, sem exigir limpeza manual (`Features/GuardiaoQualidade.js:648`). |

## Erros
Sem documento/range funcional a Porta retorna sem efeito (`Render/RendererAuditoriaSaude.js:348-350`). Nao ha erro tipado — declarado.

## Efeitos
Escrita de uma coluna (AM) na aba mensal auditada + formatacao condicional (fundo/fonte/negrito) apenas nessa coluna. Possivel criacao do cabecalho da coluna quando ausente (`Features/GuardiaoQualidade.js:201`).

## Seguranca
Escreve na aba operacional — e por isso o contrato exige explicitamente a preservacao de A:AL; nenhum dado de origem e movido ou apagado.

## Observabilidade
O texto do alerta e legivel na propria aba e replicado no `[AUDITORIA] Ocorrencias` (Porta C05/MOD-C05-01/P02).

## Implementacao
`Features/GuardiaoQualidade.js:195-201,638-651` → `Render/RendererAuditoriaSaude.js:348-400`.

## Testes
`Testes/TestGuardiao.js` · `Testes/TestRenderers.js`.

## Evidencia
Leitura direta do codigo nesta sessao (13/09/2026): `Features/GuardiaoQualidade.js:195,199,200,201,647,648,651`; `Render/RendererAuditoriaSaude.js:348,372,379,392`.

## Estado
Contrato declarado. **1 item `pendente`** (race_condition) — a Porta **bloqueia em G7**. Antes deste card a Porta existia como linha **`Guardiao -> coluna AM`** na capsula de C05.


> **Reconciliação D-164-04 (13-14/09/2026):** esta Porta descrevia o comportamento anterior (`idx=38` + criação de `AM1`). O comportamento vigente é: **validar completamente antes de qualquer escrita**; coluna de alerta resolvida por **cabeçalho canônico**; ausente/ambígua ⇒ **`ERRO_TECNICO`, diagnóstico e nenhuma escrita**. Ver `DIAGNOSTICO_D_164_04.md`, `RELATORIO_164_FIX.md` e `Features/GuardiaoQualidade.js:resolverColunaAlerta`.
