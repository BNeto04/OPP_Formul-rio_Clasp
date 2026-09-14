# PORTA C01/MOD-C01-01/P03 — Formulario → EntradaManual (gravacao do BO na aba mensal)

- **Endereço global:** `C01_Entrada/MOD-C01-01_FORMULARIO_E_MENUS/P03`
- **Escala:** modulo
- **Origem:** formulario HTML via `google.script.run` — `Entrada/EntradaManual.js:85` (`processarEntradaManual`, porta da UI) sobre o nucleo `_processarEntradaManual` (`:36`)
- **Destino:** aba mensal tratada do documento de ocorrencias (`Entrada/EntradaManual.js:108-173` localiza a aba; `:386-520` grava)
- **Elegibilidade (§12.6):** ELEGÍVEL — (A) nao cruza Comodo (C01→C01) mas (B) expoe efeito externo: grava linhas na aba mensal do Sheets; (C) lida com concorrencia: dois operadores podem gravar na mesma aba
- **Estado:** VERDE — 0 bloqueante (1 item `PENDENTE_DECLARADA` com MARCO: `operacao_atomica`, residual de leitura parcial declarado em `INST-SERIALIZACAO-001` §6, §12.6).

## Payload
Objeto do BO: `data`, `natureza`, `mike`, `boe`, detidos, armas, drogas e indicadores PIP. O nucleo monta as linhas em `montarLinhasEntradaManual` (`Entrada/EntradaManual.js:209`) e grava em `gravarLinhasEntradaManual` (`:386`).

## require
1. existe um documento de ocorrencias alcancavel (`obterSpreadsheetOcorrencias_`, `Entrada/EntradaManual.js:16-32`).
2. a aba mensal tratada da DATA existe (`localizarAbaMensalTratada`, `Entrada/EntradaManual.js:143`); sem ela o retorno e `NAO_GRAVADO` com aviso (`:46-49`).
3. o payload produz linhas montaveis; falha de montagem ⇒ `NAO_GRAVADO` com aviso (`Entrada/EntradaManual.js:56-59`).

## ensure
1. o resultado e **sempre** um dos status tipados `OK` | `SIMULADO` | `NAO_GRAVADO` (`Entrada/EntradaManual.js:64-72`).
2. `NAO_GRAVADO` e tornardo INCONFUNDIVEL na mensagem ao operador (`Entrada/EntradaManual.js:93-96`), para o BO nao se perder em silencio.
3. toda validacao vira **aviso**, nunca excecao: o nucleo **nunca bloqueia** (`Entrada/EntradaManual.js:34-35`).
4. duplicidade por `BOE`/`MIKE` e detectada na aba-alvo e sinalizada (`Entrada/EntradaManual.js:180-203`).

## invariant
1. a gravacao respeita o bloco modelo da aba (formulas e validacoes clonadas), nao escreve em regiao arbitraria (`Entrada/EntradaManual.js:315-345,386-520`).
2. a triagem forte de duplicidade pertence ao Guardiao, nao a esta Porta (`Entrada/EntradaManual.js:51`).

## Checklist de produção (§12.6)

| Item | Estado | Resposta (fato medido) |
|---|---|---|
| idempotente | aplicavel | **Resolvido (ENTRADA_OPERACIONAL, decisao do Planner 14/09/2026):** a identidade da operacao e `DATA/MIKE/BOE` (regra canonica `ARCA-OCORRENCIA-007`) e a reentrega da MESMA operacao e REPLAY — `_processarEntradaManual` recusa a gravacao com status `REPLAY_RECUSADO` (`Entrada/EntradaManual.js:85`), com ZERO escrita, em vez de gravar um segundo bloco avisando depois. **Evidencia:** `Testes/TestSerializacaoEscrita.js` (casos "reentrega da MESMA operacao => REPLAY_RECUSADO, zero escrita" e "operacao DIFERENTE continua gravando") e `Testes/TestEntradaManualFormulario.js` (14.2/14.3/15.7). |
| deduplicacao | aplicavel | deteccao por `BOE` e `MIKE` na aba-alvo, sinalizada como `DUPLICIDADE` (`Entrada/EntradaManual.js:180-203`); a regra canonica de identidade da ocorrencia e `ARCA-OCORRENCIA-007` (`Dominio/ARCA/AdaptadorConsultaArca.js:45`). |
| rate_limit | nao_aplicavel | entrada manual: um BO por gesto humano; nao ha volume externo a limitar. |
| paginacao | nao_aplicavel | o payload e um BO — volume limitado pelos detidos/armas do proprio registro; nao ha colecao paginavel. |
| validacao_entrada | aplicavel | `montarLinhasEntradaManual` (`Entrada/EntradaManual.js:209`) valida e falha em `MONTAGEM` (`:56-59`); `DATA`/`NATUREZA`/`MIKE`/`BOE` sao pre-condicao da aba-alvo (`:46-49,143`). |
| operacao_atomica | pendente | **Justificativa (remedida no fechamento):** a gravacao continua em blocos contiguos (`Entrada/EntradaManual.js:604`), nao em bloco unico, porque a aba-alvo do proprietario tem colunas de FORMULA intercaladas (TOTAL DE MACONHA, DIVIDIDO MAC, TOTAL CRACK (GR), TOTAL DE COCAINA, DIVIDIDO COC, PONTOS TOTAIS, PONTOS FICCAO, CHAVE OCORRENCIA) que nao podem ser sobrescritas por `setValues` de valor; e por isso o bloco NAO pode ser uma unica matriz. O que foi feito nesta fatia: agrupamento das colunas permitidas em RUNS CONTIGUOS (a versao anterior fazia uma chamada por coluna) e a selecao da linha livre + gravacao sob a trava global, de modo que outro ESCRITOR nao interleava. Residual declarado: um LEITOR pode ver a linha parcialmente escrita. **MARCO:** `INST-SERIALIZACAO-001` §6 (riscos residuais) + decisao do Planner de 14/09/2026 (#164) — divida ACEITA com rastro, nao silenciada. |
| race_condition | aplicavel | **Resolvido pela trava global (`INST-SERIALIZACAO-001` (§8.11)):** a leitura da coluna B que escolhe a linha livre (`localizarBlocoModeloDisponivel_`) e a gravacao rodam DENTRO da trava, adquirida em `Entrada/EntradaManual.js:80` antes de qualquer leitura/escrita. Dois operadores (ou operador + card headless) nao escolhem a mesma linha: o segundo FALHA RUIDOSAMENTE (`SERIALIZACAO_OCUPADA`) com ZERO escrita — nenhum BO e perdido. **Helper da trava:** `Core/SerializacaoEscrita.js` (helper unico da `INST-SERIALIZACAO-001`). **Evidencia:** `Testes/TestSerializacaoEscrita.js` — caso "RED->GREEN: B disparado na janela de A falha RUIDOSAMENTE, escreve ZERO e o BO de A e integro" (o cenario de corrida do diagnostico §2.4) e caso fail-closed (tryLock recusado => 0 escrita). |
| cache | nao_aplicavel | nao ha leitura cara repetida nesta Porta (a aba-alvo e lida uma vez por gravacao). |
| retry_pelo_cliente | aplicavel | o cliente e o operador: o status `NAO_GRAVADO` e explicito e inconfundivel (`Entrada/EntradaManual.js:93-96`) e a reentrega e sinalizada como `DUPLICIDADE` (`:180-203`) — a politica de re-tentativa esta declarada e e observavel. |

## Erros
`ABA_MENSAL` · `MONTAGEM` · `GRAVACAO` · `ERRO` · `DUPLICIDADE` · `LINHAS_INSUFICIENTES` (todos como aviso em `avisos[]`: `Entrada/EntradaManual.js:46,57,62,73,195,198,331`).

## Efeitos
Escrita em aba mensal (colunas a coluna, por fases: `Entrada/EntradaManual.js:386-520`) + possivel expansao de grade (`insertRows`, `:330`).

## Seguranca
Escreve apenas no documento de ocorrencias configurado; nao expoe segredo; mensagem ao operador nao ecoa payload bruto.

## Observabilidade
Status tipado + lista de avisos retornados ao formulario (`Entrada/EntradaManual.js:85-103`); prova headless equivalente na Porta C01/MOD-C01-01/P05.

## Implementacao
`Entrada/EntradaManual.js:36-110,143-173,180-203,209-314,315-385,386-520`.

## Testes
`Testes/TestEntradaManualFormulario.js` · `Testes/TestEntradaManualDryRun.js` · `Testes/TestDryRunNormalizador.js` · `Testes/TestOcrEntorpecentesDetidos.js`.

## Evidencia
Leitura direta do codigo nesta sessao (13/09/2026): `Entrada/EntradaManual.js:36,46,51,56,62,64,73,85,93,180,195,209,315,330,386,500`.

## Estado
Contrato declarado. **3 itens `pendente`** (idempotente, operacao_atomica, race_condition) — a Porta **bloqueia em G7** ate decisao do Planner. Antes deste card a Porta existia como linha **`Formulario → EntradaManual`** na capsula de C01-01.
**Fechamento (#164, 14/09/2026):** `idempotente` e `race_condition` sairam de `pendente` com prova (identidade de operacao / trava global); `operacao_atomica` permanece `pendente` **com aceite formal (`MARCO`)** — o limite e da propria planilha-alvo (colunas de formula intercaladas), nao do produto. O caso de maior severidade do diagnostico (perda de BO por dois operadores) esta fechado e coberto por fechadura.
