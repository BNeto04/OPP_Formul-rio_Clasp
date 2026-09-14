# PORTA C06/MOD-C06-02/P02 — Menu Armas → Anual (lista de merito por armas do ano)

- **Endereço global:** `C06_Relatorios/MOD-C06-02_MERITO_DE_ARMAS_GXT/P02`
- **Escala:** modulo
- **Origem:** menu unico P3 (C01), grupo Armas → `iniciarModoAnual` (`Compilador_Armas.js:23`), declarado em `Entrada/Menu.js:27`
- **Destino:** aba `COMP_ARMAS_2026` + log `LOG_ANUAL` — `Compilador_Armas.js:29,251,323`
- **Elegibilidade (§12.6):** ELEGÍVEL — (A) cruza Comodo (menu de C01 → C06); (B) cria aba e log; (C) reserva de nome por laco (ler-depois-escrever)
- **Estado:** VERDE — 0 item `pendente`/0 bloqueante (§12.6); efeito APPEND com chave estavel (herdada da P01).

## Payload
Sem payload de entrada: confirmacao `YES_NO` no alerta (`Compilador_Armas.js:27`); os 12 meses de 2026 sao passados ao compilador (`:25-29`). Saida: `{sucesso, aba, logs}`.

## require
1. confirmacao explicita do operador (`Compilador_Armas.js:27-29`).
2. mesmas pre-condicoes de fonte e cabecalho da Porta C06/MOD-C06-02/P01 (`:131,146-149,172-175`).

## ensure
1. **nenhum efeito antes da confirmacao**: recusar o alerta nao executa nada (`Compilador_Armas.js:28-29`).
2. o nome da aba no modo ANUAL e fixo (`COMP_ARMAS_2026`) e igualmente versionado na reserva (`:251-260`).
3. os demais contratos (fonte `ARMA`, legenda unica, log reescrito, um registro por tunel) sao os da Porta P01 — mesma funcao `executarCompilador`.

## invariant
1. esta Porta nao tem regra propria: difere da P01 apenas no conjunto de meses e no nome da aba/log (mesma execucao).
2. nao altera abas mensais.

## Checklist de produção (§12.6)

| Item | Estado | Resposta (fato medido) |
|---|---|---|
| idempotente | aplicavel | **Resolvido (herdado da P01):** modo ANUAL entra na chave de execucao (`chaveExecucaoArmas_`, `Compilador_Armas.js:35`) — repetir a compilacao anual com o MESMO ranking e REPLAY (`:367-375`) e nao cria `COMP_ARMAS_2026.vN`. A reserva de nome continua versionada e a colisao de nome continua sendo falha RUIDOSA do Sheets. **Evidencia:** `Testes/TestSerializacaoEscrita.js` (caso APPEND/chave estavel). |
| deduplicacao | aplicavel | **Referencia:** identico a Porta P01 (um registro por tunel; `Motor/PoliticaMeritoArmas.js:4-6`). |
| rate_limit | nao_aplicavel | confirmacao humana no menu; sem volume externo. |
| paginacao | aplicavel | **Referencia:** mesmo recorte por aba mensal da P01 (`Compilador_Armas.js:145-215`); no modo anual sao 12 leituras, uma por aba. |
| validacao_entrada | aplicavel | a confirmacao explicita e pre-condicao (`Compilador_Armas.js:27-29`) e as validacoes de cabecalho/matricula bloqueiam (`:172-175,210`). |
| operacao_atomica | aplicavel | **Referencia:** identico a P01 — aba nova escrita por passos; artefato derivado e regeneravel; a versao anterior nunca e sobrescrita. |
| race_condition | aplicavel | **Referencia:** identico a P01 — nome versionado + falha ruidosa do Sheets em colisao; log anual sobrescrito por inteiro (`Compilador_Armas.js:255-260,327`). |
| cache | nao_aplicavel | Dado vivo: o modo anual le as abas a cada geracao; cache produziria merito obsoleto. |
| retry_pelo_cliente | aplicavel | o operador pode reconfirmar e gerar nova versao sem limpeza manual; recusar e neutro (`Compilador_Armas.js:28-29`). |

## Erros
Identicos aos da Porta C06/MOD-C06-02/P01 (`Compilador_Armas.js:172-175,210,356`).

## Efeitos
`insertSheet` versionado (`:251-260`) + escrita/formatacao (`:267-314`) + log `LOG_ANUAL` reescrito (`:323-349`).

## Seguranca
Escreve somente no documento ativo do operador.

## Observabilidade
`logs` no retorno (`:353`) + aba `LOG_ANUAL`.

## Implementacao
`Compilador_Armas.js:23-30` → `:130-354`.

## Testes
`Testes/TestRelatorioArmas.js` · `Testes/TestMeritoEquipeArmas.js`.

## Evidencia
Leitura direta do codigo nesta sessao (13/09/2026): `Compilador_Armas.js:23,25,27,29,251,260,323`.

## Estado
Contrato declarado. **1 item `pendente`** (idempotente, herdado da aba versionada) — a Porta **bloqueia em G7**. Antes deste card a Porta existia como linha **`Menu Armas -> Anual`** na capsula de C06-02.
**Fechamento (#164, 14/09/2026):** o `idempotente` herdado saiu de `pendente` pela mesma chave de execucao da P01 (o modo ANUAL compoe a chave).
