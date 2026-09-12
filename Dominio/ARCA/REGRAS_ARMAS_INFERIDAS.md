# REGRAS DE DOMÍNIO INFERIDAS DO COMPILADOR DE ARMAS

**Origem**: inferência direta de `Compilador_Armas.js` (338 linhas) por ordem do proprietário —
*"faça a inferência pelo código, lá está certo"*.
**Data**: 2026-09-12 · **Card**: #152 (PROD-ARMAS-001)
**Estado da ARCA**: ❌ **cega** para todas as regras abaixo (busca `GTAR|PELOT|OFICIAIS` no
catálogo = 1 falso positivo: `MACONHA_PAPELOTE_GRAMA`).

> Este documento é a **fonte de inferência**. A promoção para o catálogo canônico da ARCA
> (`arca_regras_dominio.json`) e o teste correspondente são o passo seguinte.

---

## R1 — Unidade de agrupamento do produto
**Fonte**: `Compilador_Armas.js:154, 160, 222` + cabeçalho de saída `:237`
O produto é consolidado por **PELOTÃO**. A coluna `PELOTÃO` é obrigatória na aba de origem
(erro bloqueante se ausente) e é a primeira coluna da entrega.

## R2 — Composição de grupo e cor (GTAR / PELOTÃO / OFICIAIS)
**Fonte**: `corPorGrupoArmas_()` linhas 74-98

| Grupo (padrão no valor de PELOTÃO/GRAD) | Fundo | Fonte | Negrito |
|---|---|---|---|
| Oficiais — posto em `MAJ/CAP/TEN/ASP/CEL/TC` **ou** valor contendo `OFICIAIS` | `#f1c232` | `#000000` | não |
| **GTAR 1** (contém `GTAR` **e** `1`) | `#00cc00` | `#000000` | **sim** |
| **GTAR 2** (contém `GTAR` **e** `2`) | `#3c78d8` | `#ffffff` | **sim** |
| **1º PEL** (contém `1` **e** `PEL`) | `#00ff00` | `#000000` | não |
| **2º PEL** (contém `2` **e** `PEL`) | `#6d9eeb` | `#000000` | não |
| Demais | `#ffffff` | `#000000` | não |

**Precedência**: a função avalia nesta ordem — Oficiais → GTAR1 → GTAR2 → 1PEL → 2PEL → padrão.

## R3 — Faixas de quantidade de armas (cor por célula)
**Fonte**: `corPorArmasArmas_()` linhas 100-107 — o insumo é o **SCORE ACUMULADO**

| Faixa | Fundo | Fonte |
|---|---|---|
| `= 0` | `#ff0000` | `#ff0000` (texto invisível sobre fundo vermelho) |
| `>= 10` | `#38761d` (verde escuro) | `#ffffff` |
| `>= 6` | `#93c47d` (verde claro) | `#000000` |
| `>= 4` | `#ffff00` (amarelo) | `#000000` |
| `>= 1` | `#ff9900` (laranja) | `#000000` |
| outro | `#ffffff` | `#000000` |

## R4 — O que entra no cômputo
**Fonte**: linhas 191-194, 201
- Linha **ignorada** se: matrícula vazia **ou** QDT ARMAS não numérico **ou** QDT ARMAS `= 0`.
- Linha **computada** se: matrícula preenchida **e** QDT ARMAS `> 0`.
- A matrícula **precisa ser numérica pura** (`/^\d+$/`) — senão é **erro bloqueante** (linha 198).

## R5 — Acúmulo do SCORE
**Fonte**: linhas 210-223
O `SCORE ACUMULADO (ARMAS)` de cada policial é a **soma das QDT ARMAS de todas as abas
processadas**, chaveada pela **MATRÍCULA**. Nome, pelotão e graduação são capturados do
**primeiro** registro encontrado do policial.

## R6 — Ordenação da entrega ⚠️ *regra ditada pelo proprietário (12/09) — o código ainda NÃO a implementa*
**Fonte da verdade**: proprietário. **Fonte no código**: linha 224 (implementa apenas metade).

A ordem da entrega depende de **DOIS critérios**, nesta ordem:

1. **Quem está mais bem colocado nas participações** → SCORE ACUMULADO decrescente
   (participações/quantidade de armas).
2. **Empate → ANTIGUIDADE** → posto/graduação primeiro; no empate, **matrícula mais antiga**
   (mesma regra canônica `ARCA-ANTIGUIDADE-002`, já reconciliada no #145/#146).

**Divergência com o código**: `ranking.sort((a, b) => b[4] - a[4])` (linha 224) ordena **só pelo
score**. Em empate, a ordem fica na sequência de inserção do objeto — **não** aplica antiguidade.
→ Regra registrada como sendo a correta; o compilador precisa ser corrigido para cumpri-la.

## R10 — Soberania da regra dos OFICIAIS
**Fonte**: proprietário ("a regra dos oficiais é soberana") — 12/09.

A classificação de **OFICIAL** prevalece sobre qualquer outra leitura do valor de PELOTÃO/GRAD:
identificado o oficial, ele é tratado como oficial **independentemente** do grupo a que o texto
pareça pertencer. A identificação **não** pode depender de substring frágil
(vide observação 3 abaixo).


## R7 — Nomenclatura da aba gerada
**Fonte**: linhas 226-233

| Modo | Nome base |
|---|---|
| `ANUAL` | `COMP_ARMAS_2026` |
| `LIVRE` | `COMP_ARMAS_<primeira aba>_<última aba>` |

Se o nome já existir, é criada uma versão `…v1`, `…v2`, … (nunca sobrescreve).

## R8 — Esquema e formatação da entrega
**Fonte**: linhas 237-250
Colunas exatas: `PELOTÃO | GRADUAÇÃO | MATRÍCULA | POLICIAL | SCORE ACUMULADO (ARMAS)`
Cabeçalho: Arial 10, **negrito**, fundo `#e0e0e0`, centralizado, borda sólida `#000000`.

## R9 — Regra da linha mestra do túnel
**Fonte**: linhas 182-189
Na **primeira ocorrência** de cada `BOE`, se a linha tiver **matrícula E QDT ARMAS > 0**,
gera aviso: *"Linha mestra do BOE … possui matrícula e QDT ARMAS preenchidos."*
→ Ou seja: a linha mestra do túnel **não deve** carregar matrícula nem quantidade de armas.

---

## Lacunas encontradas na inferência (declaradas, não corrigidas)

| # | Achado | Evidência |
|---|---|---|
| ⚠️ 1 | **O 3º PELOTÃO não tem regra.** As faixas cobrem 1º/2º PEL e GTAR 1/2 — o 3º cai no branco padrão. | linhas 82-97 |
| ⚠️ 2 | **GTAR detectado por substring frágil**: `p.includes('GTAR') && p.includes('1')` casa qualquer valor com "GTAR" e um "1" em qualquer posição. | linhas 85, 88 |
| ⚠️ 3 | **Oficiais por regex de posto** — `/(MAJ|CAP|TEN|ASP|CEL|TC)/` casa **substring** (ex.: um nome/pelotão contendo "TEN" dispara a regra). | linha 82 |
| ⚠️ 4 | **Sem desempate explícito** na ordenação (empate de score fica na ordem de inserção do objeto). | linha 224 |
| ⚠️ 5 | Detalhamento de formatação por linha (linhas 256-300) ainda **não inventariado** neste documento. | — |

## Próximo passo (não feito ainda)
1. Promover R1-R9 ao catálogo canônico (`arca_regras_dominio.json`) com IDs `ARCA-ARMAS-*`.
2. Criar teste que **execute a inferência contra o compilador** e acuse divergência.
3. Decidir com o proprietário as lacunas 1-4 (a inferência **descreve** o que existe; não afirma que está certo).
