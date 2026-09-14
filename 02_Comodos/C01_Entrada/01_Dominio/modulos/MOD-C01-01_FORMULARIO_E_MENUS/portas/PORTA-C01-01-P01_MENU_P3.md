# PORTA C01/MOD-C01-01/P01 — Navegacao unica do produto (menu P3)

- **Endereço global:** `C01_Entrada/MOD-C01-01_FORMULARIO_E_MENUS/P01`
- **Escala:** modulo
- **Origem:** operador, ao abrir a planilha — `Entrada/Menu.js:128` (`onOpen`), unico `onOpen` do projeto
- **Destino:** funcoes de produto de C01, C05, C06 e C02, alcancadas por nome (`Entrada/Menu.js:20-65`); os itens executam nos Modulos donos
- **Elegibilidade (§12.6):** ELEGÍVEL — (A) cruza Comodo: o menu nasce em C01 e executa funcoes de C05 (guardiao), C06 (comparativo/PIP/armas) e C02 (gravacao); (B) expoe efeito externo: e a porta de entrada do operador no runtime
- **Estado:** VERDE — checklist §12.6 sem itens pendentes

## Payload
A arvore canonica de menus (`arvoreMenuP3_()`, `Entrada/Menu.js:20-65`): grupos, subgrupos, rotulos e **nomes de funcao alvo** (strings). Nenhum dado operacional atravessa esta Porta.

## require
1. existe um documento ativo com UI disponivel (`SpreadsheetApp.getUi()`, `Entrada/Menu.js:95`).
2. cada `alvo` e o nome de uma funcao global ja existente — nenhum alvo e inventado (`Entrada/Menu.js:68-74`, `alvoMenuExiste_`).

## ensure
1. existe **um unico** menu superior, de nome `P3` (`Entrada/Menu.js:96`, `123`); menus superiores legados (`criarMenuPip_`, `criarMenuCPM_`) nao sao criados.
2. todo item adicionado aponta para funcao existente; item cujo alvo nao existe e **omitido com log** (`Entrada/Menu.js:83-86`).
3. grupo que fica sem itens disponiveis nao e adicionado (`Entrada/Menu.js:114-117`).
4. se a construcao do P3 falhar, o formulario continua alcancavel por um menu minimo de rede (`Entrada/Menu.js:131-141`).

## invariant
1. nenhuma regra de negocio vive nesta Porta: o arquivo so navega (`Entrada/Menu.js:10`).
2. nenhum entrypoint homologado e perdido: qualquer alvo ausente e omitido, nunca substituido por outro (`Entrada/Menu.js:83`).

## Checklist de produção (§12.6)

| Item | Estado | Resposta (fato medido) |
|---|---|---|
| idempotente | aplicavel | `onOpen` reexecutado reconstroi a mesma arvore; nenhum estado persistido entre execucoes (`Entrada/Menu.js:94-126`). |
| deduplicacao | aplicavel | a arvore lista cada alvo **uma vez**; menus legados nao sao criados no mesmo ciclo (`Entrada/Menu.js:20-65,96`). |
| rate_limit | nao_aplicavel | disparada pelo proprio Sheets, uma vez por abertura do documento; nao ha volume externo. |
| paginacao | nao_aplicavel | a resposta e a arvore de menus (7 grupos), sem colecao a recortar. |
| validacao_entrada | aplicavel | item so entra se `globalThis[alvo]` for funcao (`Entrada/Menu.js:68-89`); alvo ausente ⇒ omitido com log. |
| operacao_atomica | nao_aplicavel | nao ha escrita multi-passo em recurso; o efeito e a montagem do menu em memoria + `addToUi()`. |
| race_condition | nao_aplicavel | `onOpen` e por sessao de documento e nao disputa estado compartilhado com outra execucao. |
| cache | nao_aplicavel | a arvore e constante em codigo; nao ha leitura a cachear. |
| retry_pelo_cliente | nao_aplicavel | o Sheets reexecuta `onOpen` na proxima abertura; ha rede de seguranca interna declarada (`Entrada/Menu.js:131-141`). |

## Erros
Ausencia de funcao alvo ⇒ item omitido + `Logger.log` (`Entrada/Menu.js:84`). Falha total ⇒ menu minimo (`:135-137`). Nenhuma excecao chega ao operador.

## Efeitos
Cria a arvore de menus do documento (UI). Nao escreve em celula, nao grava dado, nao altera aba.

## Seguranca
Roda como o usuario da planilha (`onOpen`); nao recebe entrada externa, nao expoe dado.

## Observabilidade
`Logger.log` de item omitido, grupo omitido e resumo final (`Entrada/Menu.js:84,115,124`). O resumo retornado alimenta os testes.

## Implementacao
`Entrada/Menu.js:20-151`. Contrato de inventario que fundamenta a arvore: `INVENTARIO_MENUS_E_CONTRATO_P3.md` (card #129).

## Testes
`Testes/TestMenuP3.js` (entre outros, proibe redefinicao global).

## Evidencia
Leitura direta do codigo nesta sessao (13/09/2026): `Entrada/Menu.js:20,68,83,95,96,114,123,128,131`.

## Estado
Contrato declarado. Checklist §12.6 completo (0 pendentes). Antes deste card a Porta existia apenas como linha **`P3` (menu)** na capsula de C01-01 e como inventario do #129.
