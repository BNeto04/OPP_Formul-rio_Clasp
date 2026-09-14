# PORTA C01/MOD-C01-01/P06 — Formulario → EFETIVO (autocomplete de policiais)

- **Endereço global:** `C01_Entrada/MOD-C01-01_FORMULARIO_E_MENUS/P06`
- **Escala:** modulo
- **Origem:** formulario HTML via `google.script.run.getEfetivo()` — `Entrada/EntradaManual.js:611`
- **Destino:** aba `EFETIVO` (aliases em `CONFIG_SYNTHEON.ABAS.EFETIVO_ALIASES`) do documento de ocorrencias (`Entrada/EntradaManual.js:615-627`)
- **Elegibilidade (§12.6):** ELEGÍVEL — (A) fronteira: a origem e a UI de C01 e o destino e o recurso `EFETIVO`/PECULIO, externo a Planta. O comentario do codigo (`Entrada/EntradaManual.js:605`) e o `INDICE.md` de C01 rotulam a Porta com um **Comodo 'Efetivo' que NAO existe no cofre** (divergencia **D-164-03**)
- **Estado:** VERDE — checklist §12.6 sem itens pendentes

## Payload
Saida: `Array<{pelotao, posto, matricula, nome}>` lida de `Coluna A` (nome), `D` (posto), `E` (matricula), `F` (pelotao) (`Entrada/EntradaManual.js:629-657`).

## require
1. existe documento de ocorrencias (`obterSpreadsheetOcorrencias_`, `Entrada/EntradaManual.js:613`).
2. existe aba de efetivo por um dos aliases; sem nenhum, cai na primeira aba do documento (`Entrada/EntradaManual.js:617-626`).

## ensure
1. somente linhas com **matricula e nome** preenchidos entram no resultado (`Entrada/EntradaManual.js:641`).
2. a matricula e normalizada para digitos (`replace(/\D/g,'')`, `Entrada/EntradaManual.js:639`).
3. **fail-soft**: qualquer falha devolve `[]` e nao derruba o formulario (`Entrada/EntradaManual.js:654-657`).

## invariant
1. a Porta **nao escreve**: le a aba de efetivo e devolve lista.
2. nao promove heuristica a regra: nao corrige nem normaliza o EFETIVO (isso e do MOD-C01-02).

## Checklist de produção (§12.6)

| Item | Estado | Resposta (fato medido) |
|---|---|---|
| idempotente | aplicavel | somente leitura: mesma aba ⇒ mesma lista, nenhum estado alterado. |
| deduplicacao | nao_aplicavel | nao cria registro; a lista e um retrato da aba de efetivo. |
| rate_limit | nao_aplicavel | chamada pelo autocomplete do formulario, sob interacao do operador; sem volume externo. |
| paginacao | aplicavel | a leitura e **integral** (`getDataRange().getValues()`, `Entrada/EntradaManual.js:628`) e a lista vai inteira ao cliente. Contrato declarado: o volume e o efetivo da unidade (centenas de linhas) — **nao ha recorte**. Se o efetivo crescer a ponto de pesar no cliente, o item passa a exigir paginacao (registrado como limite observado, nao como pendencia: nao ha medicao de volume que exija recorte hoje). |
| validacao_entrada | aplicavel | linha sem matricula ou sem nome e descartada (`Entrada/EntradaManual.js:641`) e a matricula e normalizada (`:639`). |
| operacao_atomica | nao_aplicavel | Porta somente-leitura: nao ha escrita em dois passos e nenhum estado parcial em recurso. |
| race_condition | nao_aplicavel | somente leitura; nao disputa estado com a normalizacao do EFETIVO. |
| cache | nao_aplicavel | a leitura e por chamada do formulario (interacao especifica); nao ha repeticao proxima que justifique cache — declarado. |
| retry_pelo_cliente | nao_aplicavel | fail-soft devolve `[]`: o cliente ja trata lista vazia; re-tentar nao muda o desfecho (`Entrada/EntradaManual.js:654-657`). |

## Erros
Falha ⇒ `[]` + `console.error` (`Entrada/EntradaManual.js:655-656`). Nenhum erro tipado — declarado.

## Efeitos
Nenhum efeito persistente. Leitura integral da aba de efetivo (`getDataRange().getValues()`, `Entrada/EntradaManual.js:628`).

## Seguranca
Expoe nome/posto/matricula de policiais ao formulario autenticado do proprio documento — dado ja visivel ao operador.

## Observabilidade
`console.log` com a contagem de policiais e o nome da aba usada (`Entrada/EntradaManual.js:650-651`).

## Implementacao
`Entrada/EntradaManual.js:611-660`.

## Testes
`Testes/TestEntradaManualFormulario.js` · `Testes/TestNoEmojiOperationalFlow.js`.

## Evidencia
Leitura direta do codigo nesta sessao (13/09/2026): `Entrada/EntradaManual.js:611,617,626,628,639,641,650,654`.

## Estado
Contrato declarado. Checklist §12.6 completo (0 pendentes). Antes deste card a Porta existia apenas como linha do `INDICE.md` de C01 (`C01 → Efetivo: getEfetivo()`), apontando para um Comodo inexistente — divergencia **D-164-03** registrada no RELATORIO_164.md.
