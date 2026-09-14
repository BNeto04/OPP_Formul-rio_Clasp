# PORTA C06/MOD-C06-02/P01 — Menu Armas → Selecao Livre (lista de merito por armas)

- **Endereço global:** `C06_Relatorios/MOD-C06-02_MERITO_DE_ARMAS_GXT/P01`
- **Escala:** modulo
- **Origem:** menu unico P3 (C01), grupo Armas → `abrirMenuSelecaoLivre` (`Compilador_Armas.js:33`), com retorno do dialogo em `processarMenuLivre` (`:69`); declarado em `Entrada/Menu.js:25-28`
- **Destino:** aba gerada `COMP_ARMAS_<primeiro>_<ultimo>` na planilha ativa + aba de log `LOG_LIVRE` — `Compilador_Armas.js:130,251-260,323-349`
- **Elegibilidade (§12.6):** ELEGÍVEL — (A) cruza Comodo: origem no menu de C01, destino em C06; (B) expoe efeito externo: cria aba e log; (C) lida com concorrencia: a reserva do nome da aba e ler-depois-escrever
- **Estado:** VERDE — 0 item `pendente`/0 bloqueante (§12.6); efeito APPEND com chave de execucao estavel e rejeicao de replay. 

## Payload
Entrada: lista de meses marcados no dialogo (`processarMenuLivre`, `Compilador_Armas.js:69`). Saida: `{sucesso, aba, logs{abasProcessadas, linhasLidas, policiaisUnicos, linhasIgnoradas, avisosGerados}}` (`:353`).

## require
1. existe planilha ativa (`SpreadsheetApp.getActiveSpreadsheet()`, `Compilador_Armas.js:131`).
2. as abas mensais pedidas existem — aba ausente vira aviso e e pulada (`:146-149`).
3. cabecalhos obrigatorios presentes em cada aba (PELOTAO, MATRICULA, POLICIAL, QDT ARMAS): ausente ⇒ **erro bloqueante** (`:172-175`).

## ensure
1. cada tunel gera **um unico** registro; sem duplicidade entre tuneis (invariante 2 da capsula de C06-02).
2. `ARMA` fisica e a fonte exclusiva da arma de fogo; artesanal vem de indicador textual e **`QDT ARMAS` nao entra no calculo** (`Compilador_Armas.js:175` — nota do defeito corrigido em `1b2c0ae`; `Motor/PoliticaMeritoArmas.js:4-6`).
3. a legenda de cores vem da **fonte unica** (`Core/LegendaCores.js`), nao repetida no compilador (`Compilador_Armas.js:320-322`).
4. o log da geracao e reescrito em `LOG_LIVRE` (`abaLog.clear()` + `setValues`, `:327,349`).

## invariant
1. ordenacao por score com desempate por ANTIGUIDADE (R10) — `Compilador_Armas.js:241-249`; a **divergencia** de que o ordenador historico ignorava o desempate esta registrada em `64daaed` (capsula de C06-02).
2. o compilador nao altera abas mensais: le a fonte e cria aba nova.

## Checklist de produção (§12.6)

| Item | Estado | Resposta (fato medido) |
|---|---|---|
| idempotente | aplicavel | **Resolvido — efeito classificado como APPEND com CHAVE DE EXECUCAO ESTAVEL + rejeicao de replay.** A aba nova por execucao e preservacao declarada do resultado anterior (versionamento por `insertSheet`, `Compilador_Armas.js:378-382`); a execucao passou a ser identificada por uma chave estavel — modo + abas processadas + hash deterministico do ranking (`chaveExecucaoArmas_`, `Compilador_Armas.js:35`) — e repetir a MESMA compilacao e RECUSADO com `REPLAY_RECUSADO` (`Compilador_Armas.js:367-375`), SEM criar aba nova. O registro de execucoes tem retencao limitada (20 bases) e registro ilegivel e recuperado, nunca trava o produto. **Evidencia:** `Testes/TestSerializacaoEscrita.js` (caso "APPEND com chave estavel": mesma chave para o mesmo ranking, chave diferente para conteudo diferente, replay nomeando a aba existente, registro corrompido recuperado). |
| deduplicacao | aplicavel | a agregacao e por tunel (`Motor/PoliticaMeritoArmas.js:4-6`) e o ranking tem uma linha por policial/GTAR — cada tunel entra uma vez (invariante 2 da capsula de C06-02); a legenda tambem nao repete faixa (`Core/LegendaCores.js`, fonte unica). |
| rate_limit | nao_aplicavel | gesto humano no menu; sem volume externo. |
| paginacao | aplicavel | a leitura e por aba mensal (`Compilador_Armas.js:145-215`) e a saida e a aba do periodo selecionado — o recorte e por mes, nunca o ano inteiro num payload. |
| validacao_entrada | aplicavel | meses ausentes sao avisados e pulados (`:146-149`) e a falta de cabecalho obrigatorio **bloqueia** com erro (`:172-175`), inclusive matricula invalida (`:210`). |
| operacao_atomica | aplicavel | o efeito e criar uma **aba nova** e escreve-la por passos (`:260` a `:314`). O pior estado intermediario e uma aba nova incompleta — artefato derivado e regeneravel, e nenhuma aba mensal e tocada; o log so e reescrito ao fim (`:323-349`). A aba nova nunca sobrescreve resultado anterior (nome versionado). |
| race_condition | aplicavel | **Contratado:** duas compilacoes concorrentes nao colidem porque o nome e versionado e a reserva termina em `insertSheet` (`Compilador_Armas.js:251-260`) — se as duas escolherem o mesmo nome no mesmo instante, o Sheets recusa a segunda com erro explicito (falha ruidosa, sem corromper a aba da primeira) e o log `LOG_LIVRE` e sobrescrito por inteiro, nunca mesclado (`:327`). Nao ha estado compartilhado mutavel entre as execucoes. |
| cache | nao_aplicavel | dado vivo: o compilador le as abas a cada geracao. |
| retry_pelo_cliente | aplicavel | o cliente e o operador: repetir a geracao e seguro e cria uma nova versao, sem exigir limpeza manual (`Compilador_Armas.js:255-260`); erro bloqueante e apresentado com mensagem (`:356`). |

## Erros
`Coluna X nao encontrada no cabecalho da aba` (throw, `Compilador_Armas.js:172-175`) · `Matricula invalida na aba ..., linha ...` (`:210`) · erro bloqueante apresentado ao operador (`:356`).

## Efeitos
`insertSheet` de uma **nova aba versionada** (`:251-260`) + escrita de cabecalho/ranking/formatacao/filtro/legenda (`:267-314`) + reescrita do log (`:323-349`).

## Seguranca
Escreve somente no documento ativo do operador.

## Observabilidade
Retorno com `logs` (abas processadas, linhas lidas/ignoradas, policiais unicos, avisos) (`Compilador_Armas.js:133-139,353`) + aba de log `LOG_LIVRE`.

## Implementacao
`Entrada/Menu.js:25-28` · `Compilador_Armas.js:33-70,130-354` · `Motor/PoliticaMeritoArmas.js` · `Core/LegendaCores.js`.

## Testes
`Testes/TestRelatorioArmas.js` · `Testes/TestMeritoEquipeArmas.js` · `Testes/TestOrdemAntiguidadeEquipe.js` · `Testes/TestSemRedefinicaoGlobal.js`.

## Evidencia
Leitura direta do codigo nesta sessao (13/09/2026): `Compilador_Armas.js:33,63,69,131,146,172,241,251,255,260,267,320,327,349,353`.

## Estado
Contrato declarado. **1 item `pendente`** (idempotente) — a Porta **bloqueia em G7** ate a decisao de desenho. Antes deste card a Porta existia como linha **`Menu Armas -> Selecao Livre`** na capsula de C06-02.
**Fechamento (#164, 14/09/2026):** o item `idempotente` saiu de `pendente`. A decisao exigida do Planner foi tomada no formato do §2 do adendo: efeito classificado como **APPEND** — logo com **chave de execucao estavel** e **rejeicao de replay**, preservando o versionamento (o resultado anterior nunca e sobrescrito).
