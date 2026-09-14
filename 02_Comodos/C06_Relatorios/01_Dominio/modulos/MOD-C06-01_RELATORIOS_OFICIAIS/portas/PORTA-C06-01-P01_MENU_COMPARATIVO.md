# PORTA C06/MOD-C06-01/P01 — Menu do Sheets → comparativo 2026 (aba COMPARATIVO_2026 + log)

- **Endereço global:** `C06_Relatorios/MOD-C06-01_RELATORIOS_OFICIAIS/P01`
- **Escala:** modulo
- **Origem:** menu unico P3 (C01), item `Gerar produtividade / comparativo 2026` → `abrirMenuComparativo2026` (`Features/CompiladorProdutividade.js:14`); declarado em `Entrada/Menu.js:33-34`
- **Destino:** aba `COMPARATIVO_2026` e aba de log `LOG_COMPARATIVO_2026` — `Features/CompiladorProdutividade.js:40,78` (`gerarComparativo2026Premium` → `RendererComparativo2026.render`)
- **Elegibilidade (§12.6):** ELEGÍVEL — (A) cruza Comodo: origem no menu de C01, destino em C06; (B) expoe efeito externo: grava a aba do comparativo e o log; (C) lida com concorrencia: dois geradores escrevem a **mesma** aba
- **Estado:** VERDE — 0 item `pendente`/0 bloqueante (§12.6); a geracao do comparativo esta serializada por `INST-SERIALIZACAO-001`.

## Payload
Sem payload de entrada pela UI (o dialogo `Entrada/DialogComparativo2026` devolve as abas marcadas). Saida: resumo `{sucesso, aba, abasLidas, policiais, ocorrencias, tempo}` (`Features/CompiladorProdutividade.js:81-82`).

## require
1. existe ao menos uma aba mensal de 2026 (`obterAbasComparativo2026`, `Features/CompiladorProdutividade.js:100-106`); sem ela a Porta avisa e **nao grava** (`:51-55`).
2. `SyntheonLeitor`, `SyntheonMetricas` e `RendererComparativo2026` disponiveis (`:56-58,77`).

## ensure
1. a aba `COMPARATIVO_2026` e **substituida** a cada geracao: `sheet.clear()` + remocao de filtro e de formatacao condicional antes de reescrever (`Render/RendererComparativo2026.js:9-13`).
2. o log de auditoria da geracao e materializado em `LOG_COMPARATIVO_2026` (`Features/CompiladorProdutividade.js:78` → Porta C00/MOD-C00-03/P01).
3. sem abas-alvo nao ha escrita: o retorno e `{sucesso:false, erro}` e a mensagem ao operador e explicita (`:51-55`).

## invariant
1. esta Porta **nao** altera abas mensais: le a fonte e escreve apenas as abas de comparativo e log (invariante da capsula de C06).
2. o comparativo e derivado: pode ser regerado a qualquer momento a partir das abas mensais.

## Checklist de produção (§12.6)

| Item | Estado | Resposta (fato medido) |
|---|---|---|
| idempotente | aplicavel | regerar o comparativo **substitui** a aba: `sheet.clear()` + `clearConditionalFormatRules()` + remocao do filtro antes de reescrever (`Render/RendererComparativo2026.js:9-13`); o log e reescrito pelo mesmo caminho da Porta C00/MOD-C00-03/P01. |
| deduplicacao | aplicavel | a consolidacao e por policial (`SyntheonMetricas.consolidarPoliciais`, `Features/CompiladorProdutividade.js:57`) e a linha-filha herda a DATA da mestra do tunel (#152) — cada ocorrencia entra uma vez. |
| rate_limit | nao_aplicavel | gesto humano no menu; sem volume externo. |
| paginacao | aplicavel | a leitura e por aba selecionada (`SyntheonLeitor.lerAbas(ss, abasAlvo, ...)`, `Features/CompiladorProdutividade.js:56`) e a escrita e uma matriz por geracao — o recorte e por mes, nunca o documento inteiro. |
| validacao_entrada | aplicavel | a selecao e filtrada contra as abas reais (`:45-49`) e sem alvo a Porta recusa sem gravar (`:51-55`). |
| operacao_atomica | aplicavel | o efeito e a substituicao de um artefato **derivado e regeneravel** (o comparativo e reconstruivel das abas mensais). O pior estado intermediario e a aba `COMPARATIVO_2026` parcialmente escrita entre `clear()` e o `setValues` dos dados (`Render/RendererComparativo2026.js:11,69`) — regeneravel por nova geracao, e nenhuma aba mensal e tocada. |
| race_condition | aplicavel | **Resolvido pela trava global (`INST-SERIALIZACAO-001` (§8.11)):** `gerarComparativo2026Premium` adquire a trava ANTES de renderizar (`Features/CompiladorProdutividade.js:58`) e o menu (`:58`) e o headless (`:120`) compartilham a MESMA trava. A sequencia `clear()` + escritas da aba de NOME FIXO (`Render/RendererComparativo2026.js:11`) deixa de ser interleavavel: a segunda execucao falha RUIDOSAMENTE (`SERIALIZACAO_OCUPADA`) com ZERO escrita, em vez de produzir comparativo hibrido. **Helper da trava:** `Core/SerializacaoEscrita.js` (helper unico da `INST-SERIALIZACAO-001`). **Evidencia:** `Testes/TestSerializacaoEscrita.js` (corrida + fail-closed). |
| cache | nao_aplicavel | dado vivo: cache de leitura produziria comparativo obsoleto. |
| retry_pelo_cliente | aplicavel | o cliente e o operador/agente: a politica esta declarada — regerar reconstroi a aba inteira sem limpeza manual (`Render/RendererComparativo2026.js:11-13`) e o desfecho de recusa e explicito (`Features/CompiladorProdutividade.js:52-54`). |

## Erros
Nenhuma aba de 2026 ⇒ `{sucesso:false, erro:'Nenhuma aba de 2026 encontrada'}` + alerta (`Features/CompiladorProdutividade.js:52-54`).

## Efeitos
Escrita (substituicao) da aba `COMPARATIVO_2026` (9 colunas, com filtro e formatacao) + escrita do log `LOG_COMPARATIVO_2026`.

## Seguranca
Escreve somente no documento ativo do operador; nao expoe dado para fora do arquivo.

## Observabilidade
`SyntheonLogger('COMPARATIVO_2026')` → aba de log com abas varridas, linhas lidas, duplicidades e avisos (`Features/CompiladorProdutividade.js:43,78`).

## Implementacao
`Entrada/Menu.js:33-34` · `Features/CompiladorProdutividade.js:14-82,100-106` · `Render/RendererComparativo2026.js:5-90`.

## Testes
`Testes/TestRendererComparativo2026.js` · `Testes/TestRelatoriosPipCpm.js` · `Testes/TestMenuP3.js`.

## Evidencia
Leitura direta do codigo nesta sessao (13/09/2026): `Features/CompiladorProdutividade.js:14,40,51,56,77,78,81,92`; `Render/RendererComparativo2026.js:6,9,11,13`.

## Estado
Contrato declarado. **1 item `pendente`** (race_condition) — a Porta **bloqueia em G7**. Antes deste card a Porta existia como linha **`Menu -> comparativo`** na capsula de C06-01.
**Fechamento (#164, 14/09/2026):** o `race_condition` saiu de `pendente` com prova. O nome da aba continua FIXO (`COMPARATIVO_2026`, contrato do proprietario) — o que mudou e a serializacao das execucoes.
