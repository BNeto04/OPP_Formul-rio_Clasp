# PORTA C05/MOD-C05-01/P02 — Guardiao → abas de auditoria e historico

- **Endereço global:** `C05_Guardiao/MOD-C05-01_GUARDIAO_DE_QUALIDADE/P02`
- **Escala:** modulo
- **Origem:** `Features/GuardiaoQualidade.js:655` (`RendererAuditoriaSaude.renderizarLog`, dentro de `varrerAba`)
- **Destino:** abas `[AUDITORIA] Ocorrencias` (sobrescrita) e `[HISTORICO] Auditoria Ocorrencias` (acumulo) — `Render/RendererAuditoriaSaude.js:25-26,111-112,117-132`
- **Elegibilidade (§12.6):** ELEGÍVEL — (B) expoe efeito externo: grava duas abas de auditoria; (C) lida com concorrencia: duas auditorias na mesma janela disputam as mesmas linhas
- **Estado:** AMARELO — 1 item(ns) `pendente` declarado(s) (BLOQUEIA a Porta em G7, §12.6)

## Payload
Diagnosticos consolidados da aba auditada (lista de `{codigoRegra, severidade, linha, celula, arca, ...}`) + tuneis + contagem de linhas (`Render/RendererAuditoriaSaude.js:60-112`).

## require
1. a aba auditada tem documento pai (`sheet.getParent()`; sem ele a Porta nao faz nada — `Render/RendererAuditoriaSaude.js:20-22`).
2. existe ao menos um diagnostico ou o status de aprovacao da aba (`RendererAuditoriaSaude.js:60-108`).

## ensure
1. `[AUDITORIA] Ocorrencias` e **sobrescrita** a cada execucao: `logSheet.clear()` antes de `setValues` (`Render/RendererAuditoriaSaude.js:111-112`).
2. `[HISTORICO] Auditoria Ocorrencias` e **acumulativa por contrato declarado** (`RendererAuditoriaSaude.js:117` "Anexo sem sobrescrever a Aba"), com reserva de uma linha em branco entre blocos (`:126-127`) e cabecalho criado so na primeira vez (`:35-37`).
3. a paleta de severidades e aplicada somente nestas abas de apoio (`RendererAuditoriaSaude.js:4`).

## invariant
1. esta Porta **nao** altera as abas mensais: seu destino sao abas `[AUDITORIA]`/`[HISTORICO]`.
2. o historico nunca e reescrito — apenas anexado.

## Checklist de produção (§12.6)

| Item | Estado | Resposta (fato medido) |
|---|---|---|
| idempotente | aplicavel | `[AUDITORIA]` e substituida integralmente (`clear()` + `setValues`, `Render/RendererAuditoriaSaude.js:111-112`); `[HISTORICO]` e **append por contrato declarado** (`:117`) — a repeticao nunca reescreve o passado, e a acumulacao e o efeito desejado da Porta, nao residuo. |
| deduplicacao | aplicavel | o conteudo de `[AUDITORIA]` e deduplicado por tunel/regra antes da escrita (`RendererAuditoriaSaude.js:60-112` monta uma linha por diagnostico; `Core/RegrasQualidade.js` puro na classificacao) — auditar a mesma aba duas vezes nao cria dois blocos em `[AUDITORIA]`. |
| rate_limit | nao_aplicavel | executada por gesto do operador na UI ou por prova headless sob demanda; sem volume externo. |
| paginacao | nao_aplicavel | a escrita e o bloco de diagnosticos da execucao corrente; nao ha endpoint paginado. |
| validacao_entrada | aplicavel | sem documento pai (`sheet.getParent()`) a Porta nao executa (`RendererAuditoriaSaude.js:20-22`); sem range funcional, retorna sem efeito (`:152,239`). |
| operacao_atomica | aplicavel | `[AUDITORIA]` e substituicao de um retrato regeneravel; `[HISTORICO]` e um bloco anexado de uma vez (`setValues` de `registrosHistorico`, `RendererAuditoriaSaude.js:132`), com a linha separadora limpa imediatamente antes (`:126-127`). O pior estado intermediario e um bloco de historico ausente — regeneravel na proxima auditoria; **nao** ha dado operacional nesse caminho. |
| race_condition | pendente | **Justificativa:** duas auditorias concorrentes sobre a **mesma** aba escrevem as mesmas abas de apoio. `[AUDITORIA]` e sobrescrita (a ultima vence: o retrato de quem perdeu se perde) e `[HISTORICO]` calcula a proxima linha livre com **ler-depois-escrever** (`calcularProximaLinhaHistorico`, `Render/RendererAuditoriaSaude.js:140-152`) — dois processos podem anexar no mesmo bloco. O codigo de produto **nao** usa `LockService` (unica mencao no repositorio: stub de sandbox em `Testes/TestMenuP3.js:80`). **Decisao exigida do Planner:** `LockService` no ciclo de auditoria (ou Instalacao transversal de serializacao, §8.11) e revalidacao da linha livre sob lock. |
| cache | nao_aplicavel | a Porta escreve o resultado da execucao corrente; nao ha leitura cara a cachear. |
| retry_pelo_cliente | aplicavel | o chamador e o operador/agente: a politica esta declarada — nova auditoria reconstroi `[AUDITORIA]` e acrescenta um novo bloco a `[HISTORICO]`, sem exigir limpeza manual. |

## Erros
Ausencia de documento pai ou de range funcional ⇒ retorno silencioso sem efeito (`Render/RendererAuditoriaSaude.js:20,152,239`) — declarado, nao ha erro tipado.

## Efeitos
Escrita (substituicao) de `[AUDITORIA] Ocorrencias` (9 colunas) e acrescimo em `[HISTORICO] Auditoria Ocorrencias` (10 colunas).

## Seguranca
Escreve somente no documento auditado; nenhum dado sai para fora do arquivo.

## Observabilidade
Estas abas **sao** o registro observavel da auditoria; o painel de saude (`Render/PainelSaude.js`) e montado em cima do consolidado.

## Implementacao
`Features/GuardiaoQualidade.js:647-655` → `Render/RendererAuditoriaSaude.js:20-135`.

## Testes
`Testes/TestGuardiao.js` · `Testes/TestRenderers.js` · `Testes/TestSaudeTuneis.js` · `Testes/TestCoberturaAuditoria.js`.

## Evidencia
Leitura direta do codigo nesta sessao (13/09/2026): `Render/RendererAuditoriaSaude.js:20,25,26,35,111,112,117,126,132`; `Features/GuardiaoQualidade.js:655`.

## Estado
Contrato declarado. **1 item `pendente`** (race_condition) — a Porta **bloqueia em G7**. Antes deste card a Porta existia como linha **`Guardiao -> abas de auditoria`** na capsula de C05.


> **Reconciliação D-164-04 (13-14/09/2026):** esta Porta descrevia o comportamento anterior (`idx=38` + criação de `AM1`). O comportamento vigente é: **validar completamente antes de qualquer escrita**; coluna de alerta resolvida por **cabeçalho canônico**; ausente/ambígua ⇒ **`ERRO_TECNICO`, diagnóstico e nenhuma escrita**. Ver `DIAGNOSTICO_D_164_04.md`, `RELATORIO_164_FIX.md` e `Features/GuardiaoQualidade.js:resolverColunaAlerta`.
