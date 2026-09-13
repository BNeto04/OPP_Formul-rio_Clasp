# RESULT — #152 [PROD-ARMAS-001] — PARTE 1 PROVADA (12/09/2026)

**Método**: Down Plant (teste → Git → CLASP → remoto → RESULT). Cada mudança vinculada ao card.
**Direção do proprietário**: dividir o comparativo em 4 partes, usando a peça provada (armas)
como referência das demais.

---

## Defeito encontrado (produto real, não teste)

**Sintoma**: `COMPARATIVO_2026` publicava `QTD. ARMAS = 0` para **todos** os 198 policiais,
mesmo com a fonte cheia. O compilador de Armas (mesma fonte) publicava certo.

**Causa raiz (medida, não deduzida)**: o valor era lido, acumulado e **descartado na saída**.
A corrente tinha 6 elos; 5 estavam corretos, e o último — `Dominio/RegistroAnalitico.js:16-23` —
reconstruía o objeto `fatos` com **7 campos explícitos**, sem o `participacaoArmas`.

Como foi localizado: instrumento (**bisturi**), não tentativa. `diagnosticarCaminhoArmasHeadless`
mediu os elos e mostrou `elo4_metricas` devolvendo `participacaoArmas` **undefined** enquanto o
`armas` chegava. O JSON omitindo o campo foi a evidência.

## Correções (5 elos + o último)

| Arquivo | O que foi feito |
|---|---|
| `Core/LeitorPlanilhas.js` | alias `QDT_ARMAS` mapeado; herança da DATA da linha mestra do túnel; acúmulo no policial |
| `Core/Metricas.js` | `participacaoArmas` declarado e acumulado |
| `Dominio/RegistroAnalitico.js` | **preserva `participacaoArmas`** na reconstrução do registro (o elo final) |
| `Features/CompiladorProdutividade.js` | comparativo consome `fatos.participacaoArmas` |

Commit do elo final: `b7a0a5d` (linha única no construtor).

## Prova da Parte 1 (fonte = produto)

`verificarParticipacaoArmasHeadless('1133306')` — FERNANDES, 3º PEL:

| Mês | Fonte |
|---|---|
| JAN 0 · FEV 2 · MAR 0 · ABR 0 · MAI 1 · JUN 1 · JUL 0 · AGO 3 · SET 1 | **TOTAL 8** |

**`totalFonte` = 8 · `produto` = 8 · `confere` = true** ✅

Na tela (`COMPARATIVO_2026`): `1133306 | FERNANDES | 3º PEL | QTD.O 8 | 36.385,33 | QTD.ARMAS 8`.

## Efeito medido

| | Antes | Depois |
|---|---|---|
| QTD. ARMAS no comparativo | 0 (todos) | **vivo** |
| Ocorrências lidas | 296 | **298** (a herança de data recuperou 2 descartadas) |
| Tempo de execução | ~6s | **~5s** |

## Estado das 4 partes

| # | Parte | Estado |
|---|---|---|
| 1 | QTD. ARMAS | ✅ **PROVADA** (fonte = produto) |
| 2 | QTD. O | 🟡 funcional, prova pendente |
| 3 | Pontuação | 🟡 funcional, prova pendente |
| 4 | Entorpecentes (g) | 🟡 funcional, prova pendente |

## Ferramentas permanentes criadas (não é conserto manual)

- `gerarComparativo2026Headless()` — porta headless do comparativo (sem clique)
- `diagnosticarCaminhoArmasHeadless(matricula)` — bisturi: mede os 5 elos da corrente
- `verificarParticipacaoArmasHeadless(matricula)` — prova fonte×produto, mês a mês

## Método (regra que ficou)

**Medir antes de editar.** Nada de rodar às cegas em planilha real (a lição das 191 linhas no
ABR2026). Se não se sabe qual elo quebra, **instrumentar** — não tentar.
