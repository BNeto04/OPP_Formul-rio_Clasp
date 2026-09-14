# PORTA C01/MOD-C01-01/P03 — Formulario → EntradaManual (gravacao do BO na aba mensal)

- **Endereço global:** `C01_Entrada/MOD-C01-01_FORMULARIO_E_MENUS/P03`
- **Escala:** modulo
- **Origem:** formulario HTML via `google.script.run` — `Entrada/EntradaManual.js:85` (`processarEntradaManual`, porta da UI) sobre o nucleo `_processarEntradaManual` (`:36`)
- **Destino:** aba mensal tratada do documento de ocorrencias (`Entrada/EntradaManual.js:108-173` localiza a aba; `:386-520` grava)
- **Elegibilidade (§12.6):** ELEGÍVEL — (A) nao cruza Comodo (C01→C01) mas (B) expoe efeito externo: grava linhas na aba mensal do Sheets; (C) lida com concorrencia: dois operadores podem gravar na mesma aba
- **Estado:** AMARELO — 3 item(ns) `pendente` declarado(s) (BLOQUEIA a Porta em G7, §12.6)

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
| idempotente | pendente | **Justificativa:** a reentrega do mesmo payload **grava um novo bloco** — a anti-duplicidade apenas **avisa** (`Entrada/EntradaManual.js:51,180-203`) e a triagem fica no Guardiao. Nao existe chave de idempotencia. **Decisao exigida do Planner:** criar chave de idempotencia (`MIKE`+`BOE`) ou formalizar que reentrega gera segundo bloco e a correcao e manual. |
| deduplicacao | aplicavel | deteccao por `BOE` e `MIKE` na aba-alvo, sinalizada como `DUPLICIDADE` (`Entrada/EntradaManual.js:180-203`); a regra canonica de identidade da ocorrencia e `ARCA-OCORRENCIA-007` (`Dominio/ARCA/AdaptadorConsultaArca.js:45`). |
| rate_limit | nao_aplicavel | entrada manual: um BO por gesto humano; nao ha volume externo a limitar. |
| paginacao | nao_aplicavel | o payload e um BO — volume limitado pelos detidos/armas do proprio registro; nao ha colecao paginavel. |
| validacao_entrada | aplicavel | `montarLinhasEntradaManual` (`Entrada/EntradaManual.js:209`) valida e falha em `MONTAGEM` (`:56-59`); `DATA`/`NATUREZA`/`MIKE`/`BOE` sao pre-condicao da aba-alvo (`:46-49,143`). |
| operacao_atomica | pendente | **Justificativa:** a gravacao e por fases e coluna a coluna (`Entrada/EntradaManual.js:386-520`, `setValues` por coluna em `:500`), sem transacao e **sem rollback**; falha no meio deixa bloco parcial na aba e o retorno e `NAO_GRAVADO` com aviso. **Decisao exigida:** escrita em bloco unico (`setValues` da matriz inteira) ou rollback contratado. |
| race_condition | pendente | **Justificativa:** a escolha do bloco modelo e **ler-depois-escrever** (`localizarBlocoModeloDisponivel_`, `Entrada/EntradaManual.js:315-345`): dois operadores gravando na mesma aba podem escolher a mesma linha livre. O codigo de produto **nao** usa `LockService` em nenhum arquivo (unica mencao do repositorio: stub de sandbox em `Testes/TestMenuP3.js:80`). **Decisao exigida:** `LockService` + revalidacao do bloco sob lock (ou Instalacao transversal de serializacao, §8.11). |
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
