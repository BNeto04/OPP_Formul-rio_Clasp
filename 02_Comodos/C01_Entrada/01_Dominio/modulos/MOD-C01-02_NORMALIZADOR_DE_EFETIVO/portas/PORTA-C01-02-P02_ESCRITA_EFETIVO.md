# PORTA C01/MOD-C01-02/P02 — Normalizador → aba EFETIVO (escrita da referencia) e EFETIVO_LEGADO

- **Endereço global:** `C01_Entrada/MOD-C01-02_NORMALIZADOR_DE_EFETIVO/P02`
- **Escala:** modulo
- **Origem:** `NormalizadorEfetivo.executar` — chamado pelo gatilho de menu (`Features/NormalizadorEfetivo.js:395`) e pela Porta headless (C01/MOD-C01-02/P03)
- **Destino:** aba `EFETIVO` (referencia) e aba `EFETIVO_LEGADO` — `Features/NormalizadorEfetivo.js:155` (`escreverEfetivo`) e `:166` (`escreverLegado`)
- **Elegibilidade (§12.6):** ELEGÍVEL — (B) expoe efeito externo: **reescreve** a aba de referencia EFETIVO; (C) lida com concorrencia: apaga antes de escrever, sem serializacao
- **Estado:** VERDE — 0 item `pendente`/0 bloqueante (§12.6); a corrida e a janela de duas chamadas estao fechadas pela instalação transversal `INST-SERIALIZACAO-001`.

## Payload
Linhas de EFETIVO montadas de `PECULIO` (fonte externa) + `EFETIVO` atual: `escreverEfetivo(sheet, saida)` recebe `Array<Array>` de 7 colunas (`Features/NormalizadorEfetivo.js:155-164,177-190`).

## require
1. `PECULIO_ID` configurado (`Features/NormalizadorEfetivo.js:14-15`); ausente ⇒ `throw`.
2. aba `PECULIO` localizada na planilha QO/PECULIO (`:35-36`); ausente ⇒ `throw`.
3. aba de destino existe ou e criada (`:17`).

## ensure
1. a aba EFETIVO fica com **exatamente** as linhas do PECULIO, sem restos: `clearContent` cobrindo `max(lastRow, saida.length, 1)` e depois `setValues` (`Features/NormalizadorEfetivo.js:156-161`).
2. registros fora do PECULIO (legado) sao **arquivados** em `EFETIVO_LEGADO`, nunca silenciados (`:55-68,166-175`).
3. o resultado da execucao e sempre registrado em `[AUDITORIA] Efetivo` com `INICIADO` antes e o resumo depois (`:24-32,72-79`); falha e registrada por `renderizarErro` (`:317-327`).
4. matricula duplicada no PECULIO e recusada com log `CRITICO` (`:47-50`).

## invariant
1. a fonte de verdade e o PECULIO: `EFETIVO` nao acumula registro fora dele (`:55-56`).
2. a referencia EFETIVO nao e apagada sem rastro: toda remocao vira linha `LEGADO` na auditoria (`:61,66`).

## Checklist de produção (§12.6)

| Item | Estado | Resposta (fato medido) |
|---|---|---|
| idempotente | aplicavel | reescrita completa a partir do PECULIO com `clearContent` + `setValues` cobrindo `max(lastRow, saida.length, 1)` (`Features/NormalizadorEfetivo.js:156-161`): reprocessar com o mesmo PECULIO reconstroi a mesma referencia, sem acumular e sem deixar resto. |
| deduplicacao | aplicavel | matricula duplicada no PECULIO e **recusada** com log `CRITICO` (`Features/NormalizadorEfetivo.js:47-50`) e o indice `porMatricula` e unico por construcao (`:106,` `lerEfetivoAtual`). |
| rate_limit | nao_aplicavel | operacao de referencia, executada por decisao humana/card; nao ha volume externo. |
| paginacao | nao_aplicavel | a escrita e da referencia inteira em um par `clearContent`+`setValues`; nao existe leitor paginado desta aba. |
| validacao_entrada | aplicavel | pre-condicoes de fonte (PECULIO configurado, aba PECULIO localizada) falham **antes** de qualquer escrita (`Features/NormalizadorEfetivo.js:14-15,34-36`); linha sem matricula e sem nome e descartada (`:104`). |
| operacao_atomica | aplicavel | o efeito e a substituicao integral de um artefato **derivado e regeneravel** (a referencia e reconstruivel do PECULIO em qualquer momento). O pior estado intermediario e a aba EFETIVO parcialmente vazia entre `clearContent` (`:158`) e `setValues` (`:160`) — contrato declarado e aceito porque a fonte de verdade (PECULIO) nao e tocada; nao ha risco de perda de dado operacional. |
| race_condition | aplicavel | **Resolvido pela trava global (`INST-SERIALIZACAO-001` (§8.11)):** `NormalizadorEfetivo.executar` adquire a trava ANTES de ler PECULIO/EFETIVO (`Features/NormalizadorEfetivo.js:27`) e menu (`:440`) e headless (`:484`) compartilham a MESMA trava. A substituicao da referencia deixou de ser `clearContent` + `setValues` e passou a ser UMA chamada de API (`escreverEfetivo`, `Features/NormalizadorEfetivo.js:200`), o que elimina a janela de rede do diagnostico §2.1 (aba EFETIVO hibrida). **Helper da trava:** `Core/SerializacaoEscrita.js` (helper unico da `INST-SERIALIZACAO-001`). **Evidencia:** `Testes/TestSerializacaoEscrita.js` (caso EFETIVO: 1 `setValues`, 0 `clearContent` e repeticao reconstruindo o MESMO estado) e caso da corrida. |
| cache | nao_aplicavel | a Porta escreve; nao ha leitura cara a cachear (a leitura do PECULIO e feita uma vez por execucao, `Features/NormalizadorEfetivo.js:38,94`). |
| retry_pelo_cliente | aplicavel | o cliente e o operador/agente: a politica esta declarada — falha **re-lanca** ao chamador depois de registrar `ERRO` na auditoria (`Features/NormalizadorEfetivo.js:405-415`), e a reexecucao e segura porque a operacao e reconstrucao completa a partir do PECULIO. |

## Erros
`ID da planilha do PECULIO nao configurado` · `Aba PECULIO nao encontrada` (throws: `Features/NormalizadorEfetivo.js:15,36`), capturados pelo gatilho que registra `ERRO` na auditoria e re-lanca ao operador (`:405-415`).

## Efeitos
Escrita com apagamento na aba `EFETIVO` (7 colunas) · escrita com apagamento em `EFETIVO_LEGADO` · escrita do log em `[AUDITORIA] Efetivo` (`Features/NormalizadorEfetivo.js:155-175,277-315`).

## Seguranca
Escreve apenas no documento ativo do proprietario; le planilha externa por ID configurado.

## Observabilidade
Aba `[AUDITORIA] Efetivo` com status, contagens, regras ARCA aplicadas e diagnostico por linha (`Features/NormalizadorEfetivo.js:288-314`).

## Implementacao
`Features/NormalizadorEfetivo.js:6-88,130-175,277-327,395-416`.

## Testes
`Testes/TestNormalizadorEfetivo.js` · `Testes/TestExecutorNormalizador.js` · `Testes/TestArcaNormalizadorEfetivo.js`.

## Evidencia
Leitura direta do codigo nesta sessao (13/09/2026): `Features/NormalizadorEfetivo.js:14,17,34,36,47,70,71,155,156,158,160,166,311,312`.

## Estado
Contrato declarado. **1 item `pendente`** (race_condition) — a Porta **bloqueia em G7**. Antes deste card a Porta nao estava descrita em lugar nenhum como Porta: existia apenas na tabela de **Artefatos** da NOTA_DE_RESPONSABILIDADE (`EFETIVO (escrita)`) e no no `norm-4` do circuito.
**Fechamento (#164, 14/09/2026):** o `race_condition` saiu de `pendente` com prova dupla — trava global no entrypoint + escrita em UMA chamada de API (a opcao A+E da recomendacao do diagnostico). A fechadura `Testes/TestSerializacaoEscrita.js` reprova `clearContent` antes do `setValues`.
