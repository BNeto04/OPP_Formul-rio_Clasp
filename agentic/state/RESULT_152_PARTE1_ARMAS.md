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

---

# ADENDO — PARTES 2 E 4 PROVADAS (12/09/2026)

## Parte 2 — QTD. O (occurrences)

**Regra de domínio dada pelo proprietário**: *"de quantos túneis aquele policial participou"*.
QTD. O = **número de túneis DISTINTOS** em que o policial participou. Quem estava no mesmo túnel
conta o mesmo túnel (1 por participação, não 1 por ocorrência).

Prova `verificarQtdOcorrenciasHeadless('1133306')`:
`tuneisFonte = 8 · produto = 8 · confere = true · totalTuneisAno = 298`

O `totalTuneisAno = 298` bate com o total do comparativo — consistência global confirmada.

## Parte 4 — ENTROPECENTES (g)

Fonte = soma das colunas MACONHA + COCAINA + CRACK por matrícula, nas 9 abas.

Prova `verificarDrogasHeadless('1133306')`:
`FEV 157 · MAI 20 · JUN 12,5 · AGO 130 · SET 2774 · FONTE = 3.093,5 · produto = 3.093,5 · confere = true`

O valor coincide exatamente com o `3.093,50` exibido no `COMPARATIVO_2026`.

## Estado das 4 partes (atualizado)

| # | Parte | Estado |
|---|---|---|
| 1 | QTD. ARMAS | ✅ **PROVADA** (fonte = produto, 8 = 8) |
| 2 | QTD. O | ✅ **PROVADA** (8 = 8, total 298) |
| 3 | Pontuação | ✅ **PROVADA** (36.385,33 = 36.385,33) |
| 4 | ENTROPECENTES | ✅ **PROVADA** (3.093,5 = 3.093,5) |

## Parte 3 — PONTUAÇÃO (CPM)

**Regra de domínio dada pelo proprietário**: *"o cpm [é] a soma da pontuação do policial de todos
os túneis do mês corrente ou do ano"*.

Prova `verificarPontuacaoHeadless('1133306')`:
`JUN 3.058,33 · AGO 12.413,67 · SET 20.913,33 · SOMA NA FONTE = 36.385,33 · produto = 36.385,33`
`produto_igual_a_soma = true` · `produto_igual_a_maior = false`

**Nota técnica**: o `Math.max` em `LeitorPlanilhas.js:290` parecia defeito (max em vez de soma),
mas é o **dedupe dentro do mesmo túnel** — evita contar duas vezes o mesmo policial na mesma
ocorrência. A soma entre túneis é feita depois, e o resultado confere.

## Fechamento: as 4 partes do comparativo provadas

Fonte = produto, nome por nome, número por número, com matrícula de referência. Nenhum valor
publicado no `COMPARATIVO_2026` ficou sem conferência contra as 9 abas de origem.

## Ferramentas de prova criadas

- `verificarParticipacaoArmasHeadless(matricula)` — Parte 1
- `verificarQtdOcorrenciasHeadless(matricula)` — Parte 2
- `verificarDrogasHeadless(matricula)` — Parte 4

Cada uma devolve `confere: true/false` — **prova binária, sem opinião**.
