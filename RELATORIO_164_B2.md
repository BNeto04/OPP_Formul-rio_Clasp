# RELATORIO_164_B2.md

**Card:** #164 [DP24-003] · **Bloqueador:** B2 (fail-safe da coluna AM contra o universo real)
**Data/hora da coleta:** 2026-09-14 08:05:14 -0300
**Repo:** `C:\Users\Bneto04\Documents\Codex\syntheon-gs-downplant-offline`
**Branch / HEAD:** `sprint/g01-guardiao-qualidade-live-001` / `989fa1455c71802e41145391584e624242bd2e0e`
**Planilha (somente leitura):** `OCORRÊNCIA POR PEL 2026` · ID `1S05sTbd3otgjGjrC-YrzHk7dXp7mzzaw_J2lyQ86hOY` · 60 abas
**Leitura:** service account read-only (`$LOCALAPPDATA\hermes\secrets\gsheets-sa.json`, scope `spreadsheets.readonly`),
`values.batchGet(valueRenderOption='FORMULA')` — FORMULA render replica o que o Apps Script enxerga como
“célula com conteúdo” (fórmula OU valor).

**Restrições respeitadas:** nenhuma escrita na planilha; o Guardião **não** foi executado na planilha viva
(`auditarMeses`/`GuardiaoHeadless` escrevem a coluna AM); nenhum `clasp push`; nenhum commit/push; nada postado
no GitHub; código de produto intocado.

---

## 0. Sumário executivo

| Pergunta do bloqueador | Resposta medida |
|---|---|
| Quantas abas mensais reais o Guardião audita? | **9** (`JAN2026`→`SET2026`), de 60 abas na planilha |
| Quantas resolvem a coluna AM pelo critério canônico? | **9 OK / 0 AUSENTE / 0 AMBÍGUA** |
| Quantas abas reais deixariam de ser auditadas por abortar com `ERRO_TECNICO`? | **0** |
| Quantas dependiam da auto-criação removida? | **0 dentro do universo auditado**; 12 no caminho de MENU (fora do universo, todas backup) |
| O fail-safe funciona com os cabeçalhos reais? | **Sim — 153 asserções PASS / 0 FAIL, `exit 0`** |
| A fechadura existente continua verde? | **7 PASS / 0 FAIL, `exit 0`** |

---

## 1. Abas mensais REAIS (função real do produto)

A lista não foi inferida por regex própria: foi produzida pela **função real**
`Entrada/SeletorMesesGuardiao.js → listarAbasMensais(ss)`, alimentada com os **nomes reais** das 60 abas
lidas da planilha (`C:\Users\Bneto04\_tmp_164_b2_rodar_seletor.js`, `exit 0`).

| # | aba | ano | mês | ordem | oculta | grade (col) |
|---|---|---|---|---|---|---|
| 1 | `JAN2026` | 2026 | 1 | 202601 | não | 39 |
| 2 | `FEV2026` | 2026 | 2 | 202602 | não | 52 |
| 3 | `MAR2026` | 2026 | 3 | 202603 | não | 39 |
| 4 | `ABR2026` | 2026 | 4 | 202604 | não | 39 |
| 5 | `MAI2026` | 2026 | 5 | 202605 | não | 39 |
| 6 | `JUN2026` | 2026 | 6 | 202606 | não | 39 |
| 7 | `JUL2026` | 2026 | 7 | 202607 | não | 40 |
| 8 | `AGO2026` | 2026 | 8 | 202608 | não | 39 |
| 9 | `SET2026` | 2026 | 9 | 202609 | não | 39 |

As **51 não-mensais** foram excluídas pela própria função (padrões `AUDITORIA/HISTORICO/BACKUP/BKP/MODELO/PIP/LOG/…`
e nomes que não casam com `JAN..DEZ`+ano). Nenhuma aba de mês real escapou e nenhuma aba de apoio entrou na lista.

---

## 2. Resolução da coluna AM por aba — OK / AUSENTE / AMBÍGUA

Critério canônico: `Features/GuardiaoQualidade.js → resolverColunaAlerta(headers)` exige o cabeçalho
**`Alerta Integridade` exatamente uma vez** (normalizado: *trim* + maiúsculas + remoção de acentos).

| aba | grade | cabeçalho canônico | ocorrências | AM/col 39 (linha 1 lida) | resolução | status |
|---|---|---|---|---|---|---|
| `JAN2026` | 39 | col 39 | **1** | `Alerta Integridade` | idx=38 (AM) | **OK** |
| `FEV2026` | 52 | col 39 | **1** | `Alerta Integridade` | idx=38 (AM) | **OK** |
| `MAR2026` | 39 | col 39 | **1** | `Alerta Integridade` | idx=38 (AM) | **OK** |
| `ABR2026` | 39 | col 39 | **1** | `Alerta Integridade` | idx=38 (AM) | **OK** |
| `MAI2026` | 39 | col 39 | **1** | `Alerta Integridade` | idx=38 (AM) | **OK** |
| `JUN2026` | 39 | col 39 | **1** | `Alerta Integridade` | idx=38 (AM) | **OK** |
| `JUL2026` | 40 | col 39 | **1** | `Alerta Integridade` | idx=38 (AM) | **OK** |
| `AGO2026` | 39 | col 39 | **1** | `Alerta Integridade` | idx=38 (AM) | **OK** |
| `SET2026` | 39 | col 39 | **1** | `Alerta Integridade` | idx=38 (AM) | **OK** |

**Total: OK=9 · AUSENTE=0 · AMBÍGUA=0.**

Zero ocorrências do cabeçalho canônico **em qualquer coluna de A:AL** (colunas 1..38) nas 9 abas —
logo nenhuma delas tem o nome repetido e nenhuma tem um `ALERTA …`/`OBSERVADOR` parcial que a resolução
por alias solto pudesse mirar (medido: `ABAS_COM_HAZARD_PARCIAL_EM_A_AL=0`).

### 2.1 Evidência: linha de cabeçalho lida (A1:AM1) das 9 abas mensais

Range lido: `'ABA'!A1:CB1` (80 colunas, `FORMULA`). Abaixo a linha 1 inteira até o último conteúdo, na ordem
A→AM. A coluna **AM** é a 39ª (índice 0-based 38) e é o último conteúdo da linha em todas as 9 abas.

- **`JAN2026`** (último conteúdo em AM, col 39):
  `A:ORD | B:DATA | C:HORA | D:QTD O | E:MIKE | F:NATUREZA DA OCORRÊNCIA  | G:BOE  | H:AIS | I:CIDADE | J:BAIRRO | K:DETIDOS | L:ARMA | M:TIPO | N:CALIBRE | O:MODELO | P:MUNIÇÃO | Q:MACONHA DOLAR | R:MACONHA GRAMA | S:TOTAL DE MACONHA | T:Dividido mac | U:CRACK PEDRA | V:CRACK GRAMA | W:Total CRACK (gr) | X:COCAINA PINO | Y:COCAINA GRAMA | Z:TOTAL DE COCAINA | AA:Dividido coc | AB:PELOTÃO | AC:GRAD | AD:MATRICULA | AE:POLICIAL | AF:QDT ARMAS | AG:OCORRÊNCIA PIP | AH:IMPUTADO? | AI:PONTOS TOTAIS | AJ:PONTOS FICÇÃO (1/4) | AK:Chave Ocorrência | AL:(vazio) | AM:Alerta Integridade`
- **`FEV2026`** (último conteúdo em AM, col 39):
  `A:ORD | B:DATA | C:HORA | D:QTD O | E:MIKE | F:NATUREZA DA OCORRÊNCIA  | G:BOE  | H:AIS | I:CIDADE | J:BAIRRO | K:DETIDOS | L:ARMA | M:TIPO | N:CALIBRE | O:MODELO | P:MUNIÇÃO | Q:MACONHA DOLAR | R:MACONHA GRAMA | S:TOTAL DE MACONHA | T:Dividido mac | U:CRACK PEDRA | V:CRACK GRAMA | W:Total CRACK (gr) | X:COCAINA PINO | Y:COCAINA GRAMA | Z:TOTAL DE COCAINA | AA:Dividido coc | AB:PELOTÃO | AC:GRAD | AD:MATRICULA | AE:POLICIAL | AF:QDT ARMAS | AG:OCORRÊNCIA PIP | AH:IMPUTADO? | AI:PONTOS TOTAIS | AJ:PONTOS FICÇÃO (1/4) | AK:Chave Ocorrência | AL:(vazio) | AM:Alerta Integridade`
- **`MAR2026`** (último conteúdo em AM, col 39):
  `A:ORD | B:DATA | C:HORA | D:QTD O | E:MIKE | F:NATUREZA DA OCORRÊNCIA  | G:BOE  | H:AIS | I:CIDADE | J:BAIRRO | K:DETIDOS | L:ARMA | M:TIPO | N:CALIBRE | O:MODELO | P:MUNIÇÃO | Q:MACONHA DOLAR | R:MACONHA GRAMA | S:TOTAL DE MACONHA | T:Dividido mac | U:CRACK PEDRA | V:CRACK GRAMA | W:Total CRACK (gr) | X:COCAINA PINO | Y:COCAINA GRAMA | Z:TOTAL DE COCAINA | AA:Dividido coc | AB:PELOTÃO | AC:GRAD | AD:MATRICULA | AE:POLICIAL | AF:QDT ARMAS | AG:OCORRÊNCIA PIP | AH:IMPUTADO? | AI:PONTOS TOTAIS | AJ:PONTOS FICÇÃO (1/4) | AK:Chave Ocorrência | AL:(vazio) | AM:Alerta Integridade`
- **`ABR2026`** (último conteúdo em AM, col 39):
  `A:ORD | B:DATA | C:HORA | D:QTD O | E:MIKE | F:NATUREZA DA OCORRÊNCIA  | G:BOE  | H:AIS | I:CIDADE | J:BAIRRO | K:DETIDOS | L:ARMA | M:TIPO | N:CALIBRE | O:MODELO | P:MUNIÇÃO | Q:MACONHA DOLAR | R:MACONHA GRAMA | S:TOTAL DE MACONHA | T:Dividido mac | U:CRACK PEDRA | V:CRACK GRAMA | W:Total CRACK (gr) | X:COCAINA PINO | Y:COCAINA GRAMA | Z:TOTAL DE COCAINA | AA:Dividido coc | AB:PELOTÃO | AC:GRAD | AD:MATRICULA | AE:POLICIAL | AF:QDT ARMAS | AG:OCORRÊNCIA PIP | AH:IMPUTADO? | AI:PONTOS TOTAIS | AJ:PONTOS FICÇÃO (1/4) | AK:Chave Ocorrência | AL:(vazio) | AM:Alerta Integridade`
- **`MAI2026`** (último conteúdo em AM, col 39):
  `A:ORD | B:DATA | C:HORA | D:QTD O | E:MIKE | F:NATUREZA DA OCORRÊNCIA  | G:BOE  | H:AIS | I:CIDADE | J:BAIRRO | K:DETIDOS | L:ARMA | M:TIPO | N:CALIBRE | O:MODELO | P:MUNIÇÃO | Q:MACONHA DOLAR | R:MACONHA GRAMA | S:TOTAL DE MACONHA | T:Dividido mac | U:CRACK PEDRA | V:CRACK GRAMA | W:Total CRACK (gr) | X:COCAINA PINO | Y:COCAINA GRAMA | Z:TOTAL DE COCAINA | AA:Dividido coc | AB:PELOTÃO | AC:GRAD | AD:MATRICULA | AE:POLICIAL | AF:QDT ARMAS | AG:OCORRÊNCIA PIP | AH:IMPUTADO? | AI:PONTOS TOTAIS | AJ:PONTOS FICÇÃO (1/4) | AK:Chave Ocorrência | AL:(vazio) | AM:Alerta Integridade`
- **`JUN2026`** (último conteúdo em AM, col 39):
  `A:ORD | B:DATA | C:HORA | D:QTD O | E:MIKE | F:NATUREZA DA OCORRÊNCIA  | G:BOE  | H:AIS | I:CIDADE | J:BAIRRO | K:DETIDOS | L:ARMA | M:TIPO | N:CALIBRE | O:MODELO | P:MUNIÇÃO | Q:MACONHA DOLAR | R:MACONHA GRAMA | S:TOTAL DE MACONHA | T:Dividido mac | U:CRACK PEDRA | V:CRACK GRAMA | W:Total CRACK (gr) | X:COCAINA PINO | Y:COCAINA GRAMA | Z:TOTAL DE COCAINA | AA:Dividido coc | AB:PELOTÃO | AC:GRAD | AD:MATRICULA | AE:POLICIAL | AF:QDT ARMAS | AG:OCORRÊNCIA PIP | AH:IMPUTADO? | AI:PONTOS TOTAIS | AJ:PONTOS FICÇÃO (1/4) | AK:Chave Ocorrência | AL:(vazio) | AM:Alerta Integridade`
- **`JUL2026`** (último conteúdo em AM, col 39):
  `A:ORD | B:DATA | C:HORA | D:QTD O | E:MIKE | F:NATUREZA DA OCORRÊNCIA  | G:BOE  | H:AIS | I:CIDADE | J:BAIRRO | K:DETIDOS | L:ARMA | M:TIPO | N:CALIBRE | O:MODELO | P:MUNIÇÃO | Q:MACONHA DOLAR | R:MACONHA GRAMA | S:TOTAL DE MACONHA | T:Dividido mac | U:CRACK PEDRA | V:CRACK GRAMA | W:Total CRACK (gr) | X:COCAINA PINO | Y:COCAINA GRAMA | Z:TOTAL DE COCAINA | AA:Dividido coc | AB:PELOTÃO | AC:GRAD | AD:MATRICULA | AE:POLICIAL | AF:QDT ARMAS | AG:OCORRÊNCIA PIP | AH:IMPUTADO? | AI:PONTOS TOTAIS | AJ:PONTOS FICÇÃO (1/4) | AK:Chave Ocorrência | AL:(vazio) | AM:Alerta Integridade`
- **`AGO2026`** (último conteúdo em AM, col 39):
  `A:ORD | B:DATA | C:HORA | D:QTD O | E:MIKE | F:NATUREZA DA OCORRÊNCIA  | G:BOE  | H:AIS | I:CIDADE | J:BAIRRO | K:DETIDOS | L:ARMA | M:TIPO | N:CALIBRE | O:MODELO | P:MUNIÇÃO | Q:MACONHA DOLAR | R:MACONHA GRAMA | S:TOTAL DE MACONHA | T:Dividido mac | U:CRACK PEDRA | V:CRACK GRAMA | W:Total CRACK (gr) | X:COCAINA PINO | Y:COCAINA GRAMA | Z:TOTAL DE COCAINA | AA:Dividido coc | AB:PELOTÃO | AC:GRAD | AD:MATRICULA | AE:POLICIAL | AF:QDT ARMAS | AG:OCORRÊNCIA PIP | AH:IMPUTADO? | AI:PONTOS TOTAIS | AJ:PONTOS FICÇÃO (1/4) | AK:Chave Ocorrência | AL:(vazio) | AM:Alerta Integridade`
- **`SET2026`** (último conteúdo em AM, col 39):
  `A:ORD | B:DATA | C:HORA | D:QTD O | E:MIKE | F:NATUREZA DA OCORRÊNCIA  | G:BOE  | H:AIS | I:CIDADE | J:BAIRRO | K:DETIDOS | L:ARMA | M:TIPO | N:CALIBRE | O:MODELO | P:MUNIÇÃO | Q:MACONHA DOLAR | R:MACONHA GRAMA | S:TOTAL DE MACONHA | T:Dividido mac | U:CRACK PEDRA | V:CRACK GRAMA | W:Total CRACK (gr) | X:COCAINA PINO | Y:COCAINA GRAMA | Z:TOTAL DE COCAINA | AA:Dividido coc | AB:PELOTÃO | AC:GRAD | AD:MATRICULA | AE:POLICIAL | AF:QDT ARMAS | AG:OCORRÊNCIA PIP | AH:IMPUTADO? | AI:PONTOS TOTAIS | AJ:PONTOS FICÇÃO (1/4) | AK:Chave Ocorrência | AL:(vazio) | AM:Alerta Integridade`

Para as demais 51 abas a medição completa está em `C:\Users\Bneto04\_tmp_164_b2_headers_todas_abas.json`
(linha 1 de todas as 60, `FORMULA` render). Resumo: **11 abas** têm o cabeçalho canônico exatamente 1×
(as 9 mensais + `CA_JUL2026_JUL2026` + `Modelo_2026`, ambas fora do universo mensal), **0 ambíguas**, **49 sem** o
cabeçalho (todas de apoio, log ou backup).

---

## 3. Critério ANTERIOR × critério canônico (o que a mudança altera)

Critério anterior (`a70da9e^`): `loc('ALERTA_INTEGRIDADE')` com aliases
`['ALERTA INTEGRIDADE','ALERTA','OBSERVADOR']` (`Core/Constantes.js:61`) e **match parcial**
(`Core/Utils.js:69-73`), mais o **fallback cego** `if (idx.alerta === -1) { idx.alerta = 38;
sheet.getRange(1, 39).setValue('Alerta Integridade'); }` — o trecho **removido** pelo commit `a70da9e`.

| aba | idx critério anterior | idx critério canônico | muda endereço? | acionava a auto-criação de AM1? |
|---|---|---|---|---|
| `JAN2026` | 38 | 38 | não | não |
| `FEV2026` | 38 | 38 | não | não |
| `MAR2026` | 38 | 38 | não | não |
| `ABR2026` | 38 | 38 | não | não |
| `MAI2026` | 38 | 38 | não | não |
| `JUN2026` | 38 | 38 | não | não |
| `JUL2026` | 38 | 38 | não | não |
| `AGO2026` | 38 | 38 | não | não |
| `SET2026` | 38 | 38 | não | não |

`ABAS_QUE_ACIONAVAM_A_AUTO_CRIACAO_AM1=0` · `ABAS_EM_QUE_O_ENDERECO_MUDOU=0`.
**Para o universo auditado a troca de critério é comportamentalmente idêntica** (mesmo endereço, `AM`),
e o que ela muda é apenas o que acontece **quando a resolução falha** — que é o objeto do B2.

---

## 4. Impacto operacional quantificado

### 4.1 Universo auditado (abas mensais reais) — impacto ZERO

- Abas que **deixariam de ser auditadas** por abortar com `ERRO_TECNICO`: **0 de 9**.
- Abas que hoje **dependiam da auto-criação removida**: **0 de 9** — as 9 já tinham `AM1 = 'Alerta Integridade'`
  antes da mudança, então o ramo `idx.alerta === -1` **nunca era executado** nelas.
- Consequência, conforme decidido pelo Planner (**efeito zero em falha**): a remoção da auto-criação **não tira
  auditoria de nenhum mês real** e não cria necessidade de backfill/migração. Nada a remediar no universo mensal.

### 4.2 Fora do universo: o caminho de MENU pode apontar para qualquer aba

O item de menu `executarGuardiaoQualidade()` (`Features/GuardiaoQualidade.js:759-771`) audita a **aba ATIVA**
(`SpreadsheetApp.getActiveSheet()`), sem passar pelo seletor de meses. Ou seja, o operador consegue apontar o
Guardião para as **12 abas de backup** (`_BACKUP_*`, `_BKP_*`) — que o seletor exclui, mas o menu não.
Medido com os cabeçalhos **reais** dessas 12 abas (`_tmp_164_b2_failsafe_real.js`, cenário D):

| aba | grade | col 39 (AM) na aba real | critério ANTERIOR faria | comportamento ATUAL (medido) |
|---|---|---|---|---|
| `_BACKUP_JUN2026` | 37 | (não existe: grade de 37 colunas) | miraria a col 39, que **não existe na grade** da aba: `getRange(1,39)` ou recusa as coordenadas (fora da grade) ou a expande — em qualquer hipótese, endereço que **não é o contratado** (a AM é a 39ª coluna de um layout de 39) | `ERRO_TECNICO`, **0 escrita**; nenhuma coluna criada (col 39 continua inexistente) |
| `_BKP_20260710_JAN2026` | 37 | (não existe: grade de 37 colunas) | miraria a col 39, que **não existe na grade** da aba: `getRange(1,39)` ou recusa as coordenadas (fora da grade) ou a expande — em qualquer hipótese, endereço que **não é o contratado** (a AM é a 39ª coluna de um layout de 39) | `ERRO_TECNICO`, **0 escrita**; nenhuma coluna criada (col 39 continua inexistente) |
| `_BKP_20260710_FEV2026` | 58 | `QTD TOTAL DROGAS` | **destruiria o cabeçalho de dado `QTD TOTAL DROGAS`** e ainda auditava (as 4 colunas obrigatórias existem) → gravaria alerta **dentro de uma coluna de dado** | `ERRO_TECNICO`, **0 escrita**; col 39 preservada (`QTD TOTAL DROGAS`) |
| `_BKP_20260710_MAR2026` | 37 | (não existe: grade de 37 colunas) | miraria a col 39, que **não existe na grade** da aba: `getRange(1,39)` ou recusa as coordenadas (fora da grade) ou a expande — em qualquer hipótese, endereço que **não é o contratado** (a AM é a 39ª coluna de um layout de 39) | `ERRO_TECNICO`, **0 escrita**; nenhuma coluna criada (col 39 continua inexistente) |
| `_BKP_20260710_ABR2026` | 37 | (não existe: grade de 37 colunas) | miraria a col 39, que **não existe na grade** da aba: `getRange(1,39)` ou recusa as coordenadas (fora da grade) ou a expande — em qualquer hipótese, endereço que **não é o contratado** (a AM é a 39ª coluna de um layout de 39) | `ERRO_TECNICO`, **0 escrita**; nenhuma coluna criada (col 39 continua inexistente) |
| `_BKP_20260710_MAI2026` | 37 | (não existe: grade de 37 colunas) | miraria a col 39, que **não existe na grade** da aba: `getRange(1,39)` ou recusa as coordenadas (fora da grade) ou a expande — em qualquer hipótese, endereço que **não é o contratado** (a AM é a 39ª coluna de um layout de 39) | `ERRO_TECNICO`, **0 escrita**; nenhuma coluna criada (col 39 continua inexistente) |
| `_BKP_20260710_JUN2026` | 37 | (não existe: grade de 37 colunas) | miraria a col 39, que **não existe na grade** da aba: `getRange(1,39)` ou recusa as coordenadas (fora da grade) ou a expande — em qualquer hipótese, endereço que **não é o contratado** (a AM é a 39ª coluna de um layout de 39) | `ERRO_TECNICO`, **0 escrita**; nenhuma coluna criada (col 39 continua inexistente) |
| `_BACKUP_MAI2026` | 37 | (não existe: grade de 37 colunas) | miraria a col 39, que **não existe na grade** da aba: `getRange(1,39)` ou recusa as coordenadas (fora da grade) ou a expande — em qualquer hipótese, endereço que **não é o contratado** (a AM é a 39ª coluna de um layout de 39) | `ERRO_TECNICO`, **0 escrita**; nenhuma coluna criada (col 39 continua inexistente) |
| `_BACKUP_ABR2026` | 36 | (não existe: grade de 36 colunas) | miraria a col 39, que **não existe na grade** da aba: `getRange(1,39)` ou recusa as coordenadas (fora da grade) ou a expande — em qualquer hipótese, endereço que **não é o contratado** (a AM é a 39ª coluna de um layout de 39) | `ERRO_TECNICO`, **0 escrita**; nenhuma coluna criada (col 39 continua inexistente) |
| `_BACKUP_MAR2026` | 35 | (não existe: grade de 35 colunas) | miraria a col 39, que **não existe na grade** da aba: `getRange(1,39)` ou recusa as coordenadas (fora da grade) ou a expande — em qualquer hipótese, endereço que **não é o contratado** (a AM é a 39ª coluna de um layout de 39) | `ERRO_TECNICO`, **0 escrita**; nenhuma coluna criada (col 39 continua inexistente) |
| `_BACKUP_FEV2026` | 58 | `QTD TOTAL DROGAS` | **destruiria o cabeçalho de dado `QTD TOTAL DROGAS`** e abortaria depois (D-164-04b: escrita antes da validação) — dano sem auditoria | `ERRO_TECNICO`, **0 escrita**; col 39 preservada (`QTD TOTAL DROGAS`) |
| `_BACKUP_JAN2026` | 34 | (não existe: grade de 34 colunas) | miraria a col 39, que **não existe na grade** da aba: `getRange(1,39)` ou recusa as coordenadas (fora da grade) ou a expande — em qualquer hipótese, endereço que **não é o contratado** (a AM é a 39ª coluna de um layout de 39) | `ERRO_TECNICO`, **0 escrita**; nenhuma coluna criada (col 39 continua inexistente) |

**Resumo quantificado:** 12 abas reais de apoio/backup seriam alcançadas pelo menu e agora **abortam com
`ERRO_TECNICO` e ZERO escrita**; em **2 delas** (`_BKP_20260710_FEV2026`, `_BACKUP_FEV2026`) a auto-criação antiga
**destruía o cabeçalho de dado `QTD TOTAL DROGAS` da coluna 39** — dano irreversível em aba de dado, inclusive em
execução que abortava depois. Nenhuma delas é auditada pelo caminho canônico (o seletor as exclui), então o
aborto não retira auditoria de mês nenhum: **é o comportamento desejado**.

> **Substituição declarada (auto-atestado).** O item do card pede “rodar/pedir rodagem de `auditarMeses` nas abas
> mensais reais”. Rodar `auditarMeses` **na planilha viva** é uma execução que **ESCREVE** (coluna AM das abas
> auditadas + `[AUDITORIA] Ocorrencias` + `[HISTORICO] Auditoria Ocorrencias`), e a restrição deste trabalho proíbe
> essa execução. A prova foi obtida por **medição read-only do cabeçalho real** + **reprodução offline da cadeia
> real com esses mesmos cabeçalhos** (seções 2 e 5). Se o Proprietário quiser o `clasp run executarGuardiaoHeadless
> '"SET2026"'` **ao vivo**, isso é uma **execução com escrita** e precisa de autorização explícita — não foi feita
> aqui por decisão, não por falha.

---

## 5. Reprodução do fail-safe com os cabeçalhos REAIS (offline, cadeia real)

Nada é simulado no código de produto. O harness (`C:\Users\Bneto04\_tmp_164_b2_failsafe_real.js`) instala os módulos
canônicos nos globais e dirige:

```
GuardiaoHeadless.executar('TODOS', {obterSS, modulo: SeletorMesesGuardiao})
   -> SeletorMesesGuardiao.auditarMeses   (Entrada/SeletorMesesGuardiao.js:209)
      -> GuardiaoQualidade.varrerAba     (Features/GuardiaoQualidade.js:135)
         -> resolverColunaAlerta + prepararColunaAlertas + setValues(AM)
```

O `sheet` da aba mensal é um mock **instrumentado** que registra **toda** escrita (aba, A1, operação, valores),
com a linha 1 = **o cabeçalho real lido da planilha** para aquela aba. O cenário (D) chama `varrerAba` diretamente,
que é exatamente o caminho do menu.

| cenário | abas | status | escritas totais | escritas fora da AM(39) | A:AL valores intacta | A:AL fórmulas intactas |
|---|---|---|---|---|---|---|
| (A) REAL as-is | 9 | OK | 9 | 0 | sim | sim |
| (B) AUSENTE | 9 | ERRO | 0 | 0 | sim | sim |
| (C) AMBÍGUA | 9 | ERRO | 0 | 0 | sim | sim |
| (D) MENU em backup real | 12 | ERRO | 0 | 0 | sim | sim |

**Resultado do harness: `153 PASS / 0 FAIL`, `exit 0`** (log integral: `C:\Users\Bneto04\_tmp_164_b2_failsafe_real.log`).

### 5.1 (A) aba OK ⇒ escrita SOMENTE na AM e A:AL intocadas

Nas 9 abas, a cadeia fez **9 escritas, todas na coluna 39 (AM)**. Exemplo literal de `JAN2026` (idêntico nas outras 8):

```
clearDataValidations JAN2026!AM1
setValue JAN2026!AM1
clearContent JAN2026!AM2:AM3
clearDataValidations JAN2026!AM2:AM3
setValues JAN2026!AM2:AM3
setBackground JAN2026!AM2
setFontColor JAN2026!AM2
setBackground JAN2026!AM3
setFontColor JAN2026!AM3
```

- `A:AL` (colunas 1..38): valores **e** fórmulas idênticos antes/depois (`aalIntacta=true`, `aalFormulasIntactas=true`)
  nas 9 abas.
- `AM1` continua com o cabeçalho canônico `Alerta Integridade` (antes e depois).
- **Observação residual (declarada, não é defeito novo):** a primeira escrita é `setValue AM1` —
  `RendererAuditoriaSaude.prepararColunaAlertas` reescreve o **mesmo** texto canônico no **mesmo** endereço
  (`Render/RendererAuditoriaSaude.js:392-397`, chamado em `Features/GuardiaoQualidade.js:715`, **depois** da validação).
  Não é criação de coluna e não é escrita em A:AL; é reescrita idempotente do cabeçalho contratado. Fica registrado
  como item de observação para o REVIEW — se o contrato exigir “zero escrita quando já correto”, é ajuste de 1 linha.

### 5.2 (B) aba AUSENTE ⇒ `ERRO_TECNICO` + ZERO escrita

Com o cabeçalho canônico removido da linha 1 **real** de cada uma das 9 abas:

```
status          = ERRO            (9/9 abas)
escritas totais = 0               (9/9 abas — nem AM1, em aba NENHUMA)
AM1 depois      = não criado
mensagem        = Coluna de alerta canonica ("Alerta Integridade" em AM) ausente na aba: nenhuma
                  escrita foi feita (fail-safe). A AM e o endereco contratado do alerta
                  (Core/ContratoMutacaoSegura.js:58-61); o Guardiao nao cria a coluna para nao
                  mirar uma coluna de A:AL.
```

### 5.3 (C) aba AMBÍGUA ⇒ `ERRO_TECNICO` + ZERO escrita

Cenário construído sobre a linha 1 **real** de cada aba: o nome canônico foi duplicado na coluna **AL**
(a última de `A:AL`, vazia no layout real) mantendo o original em `AM`.

```
status          = ERRO            (9/9 abas)
escritas totais = 0               (9/9 abas)
AL (col 38)     = 'Alerta Integridade' PRESERVADA — nenhuma das duas colunas foi escolhida
mensagem        = Coluna de alerta ambigua: o cabecalho canonico "Alerta Integridade" aparece em
                  2 colunas (38, 39): nenhuma escrita foi feita (fail-safe). O endereco da AM
                  nao e resolvido por posicao.
```

**Contraprova de impacto:** o critério **anterior** (`localizarColuna` com `ALERTA INTEGRIDADE`) teria escolhido
`idx = 37` — **a coluna 38 = AL, dentro de A:AL** — nas 9 abas, e teria gravado cabeçalho e alertas ali. É
exatamente o hazard §4.3 do `DIAGNOSTICO_D_164_04.md` materializado: com o critério canônico, **as duas colunas
ficam intactas e o desfecho é diagnóstico, não escrita**.

### 5.4 Fechadura existente (não regrediu)

```
$ node Testes/TestGuardiaoHeadlessEfeitoDeclarado.js
RESULTADOS FINAIS: 7 PASS / 0 FAIL
exit 0
```

---

## 6. Opções de remediação (nenhuma escolhida — decisão do Proprietário/Planner)

Premissa medida: **nenhuma aba mensal real precisa de remediação** (9/9 OK). As opções abaixo se aplicam
(a) às **12 abas de backup** alcançáveis pelo menu e (b) ao caso geral de aba futura sem o cabeçalho.

| # | Opção | Consequência | Custo / risco | Escolhe |
|---|---|---|---|---|
| R1 | **Não fazer nada** (aceitar o aborto) | As 12 abas de backup deixam de ser auditáveis pelo menu; nenhum mês real é afetado; a AM permanece canal exclusivo de alerta | zero; preserva o invariante `A:AL` somente leitura | Planner |
| R2 | **Criar o cabeçalho canônico nas abas problemáticas** (escrever `Alerta Integridade` na coluna AM de cada uma) | Torna-as auditáveis; nas 2 abas de 58 colunas **exige reorganizar o layout antes**, porque a coluna 39 hoje é `QTD TOTAL DROGAS` (dado) — criar AM ali é **mover/estender colunas** de um dado real | **É ESCRITA em planilha real e exige autorização explícita do Proprietário**; nas 2 de 58 colunas é migração de layout, com risco de dano se feita em massa | Proprietário |
| R3 | **Migração pontual assistida** (por aba, com dry-run e lista de linhas afetadas antes de aplicar) | Reaproveita o padrão já usado no repo (ferramenta autônoma com modo simulação que devolve a lista; só então o dono aplica) | média; exige card/escopo próprio **sem criar card novo** (trilho de card existente) | Planner + Proprietário |
| R4 | **Mensagem de diagnóstico ao operador** (o aborto já devolve a mensagem canônica com o nome do cabeçalho) | O operador entende *por que* a aba não foi auditada e o que falta, em vez de “não aconteceu nada” | baixa; é o comportamento **já implementado** e verificado na seção 5.2 | já vigente |
| R5 | **Renomear/ocultar as abas de backup** para fora do alcance do menu | Elimina a possibilidade de o operador apontar o Guardião para dado antigo | baixa; mas **é escrita** (renomear aba) → exige autorização | Proprietário |

Opcionalmente (R6, técnico, sem tocar dado): fazer o caminho de MENU aplicar o **mesmo seletor** de abas mensais
antes de auditar a aba ativa, de modo que uma aba fora do universo nem chegue a `varrerAba`. Consequência:
o menu deixa de poder auditar aba fora do padrão mensal — inclusive as de backup — e passa a recusar de forma
explícita. Custo: mudança de comportamento do menu (código de produto), fora do escopo de B2.

---

## 7. B1 — bloco de prova Git (pronto para colar no RESULT)

Ver `BLOCO_PROVA_GIT_164_B1.md` (arquivo separado, no mesmo diretório deste relatório).
Resumo do estado medido **agora**, antes de qualquer commit desta fatia:

```
$ git rev-parse HEAD
989fa1455c71802e41145391584e624242bd2e0e
$ git rev-parse origin/sprint/g01-guardiao-qualidade-live-001   # local x remoto
989fa1455c71802e41145391584e624242bd2e0e
$ git rev-list --left-right --count origin/sprint/g01-guardiao-qualidade-live-001...HEAD
0       0     # 0 atrás / 0 à frente -> local == remoto
```

O comando exato de `git add`/`git commit` **com conferência de exit code** está no bloco separado —
ele **não foi executado** por este trabalho (restrição: não commitar).

---

## 8. Artefatos e caminhos absolutos

**Relatórios (no repo):**
- `C:\Users\Bneto04\Documents\Codex\syntheon-gs-downplant-offline\RELATORIO_164_B2.md`
- `C:\Users\Bneto04\Documents\Codex\syntheon-gs-downplant-offline\BLOCO_PROVA_GIT_164_B1.md`

**Evidência bruta (workspace, fora do repo):**
- `C:\Users\Bneto04\_tmp_164_b2_abas_reais.json` — 60 abas reais (nome/índice/oculta/grade)
- `C:\Users\Bneto04\_tmp_164_b2_mensais.json` — saída do `listarAbasMensais` real
- `C:\Users\Bneto04\_tmp_164_b2_headers_reais.json` — linha 1 (A1:CB1, FORMULA) das 9 mensais + ranges lidos
- `C:\Users\Bneto04\_tmp_164_b2_headers_todas_abas.json` — linha 1 das 60 abas
- `C:\Users\Bneto04\_tmp_164_b2_resolucao_real.json` — resolução por aba (novo × anterior × hazard)
- `C:\Users\Bneto04\_tmp_164_b2_failsafe_real.json` — resultado por cenário (A/B/C/D)
- `C:\Users\Bneto04\_tmp_164_b2_failsafe_real.log` — log integral (153 PASS / 0 FAIL)
- `C:\Users\Bneto04\_tmp_164_fechadura.log` — log da fechadura (7 PASS / 0 FAIL)

**Scripts re-executáveis (workspace, fora do repo):**
- `C:\Users\Bneto04\_tmp_164_b2_abas_e_headers.py` — lê 60 abas + linha 1 (read-only)
- `C:\Users\Bneto04\_tmp_164_b2_listar_abas.py` — lê nomes/grade das abas (read-only)
- `C:\Users\Bneto04\_tmp_164_b2_ler_headers.py` — linha 1 das 9 mensais (read-only)
- `C:\Users\Bneto04\_tmp_164_b2_headers_todas.py` — linha 1 das 60 abas (read-only)
- `C:\Users\Bneto04\_tmp_164_b2_rodar_seletor.js` — roda o seletor REAL sobre os nomes REAIS
- `C:\Users\Bneto04\_tmp_164_b2_resolver_real.js` — roda `resolverColunaAlerta` REAL sobre os cabeçalhos REAIS
- `C:\Users\Bneto04\_tmp_164_b2_failsafe_real.js` — reprodução do fail-safe pela cadeia real (153 asserções)

Comando de reexecução da prova principal:

```
cd "C:/Users/Bneto04" && node _tmp_164_b2_failsafe_real.js < /dev/null; echo "EXIT=$?"
```

---

## 9. Limites declarados (o que este relatório NÃO prova)

1. **Não houve execução do Guardião na planilha viva** (por restrição — ele escreve a AM). A prova é medição
   read-only + reprodução offline com os cabeçalhos reais. Ver a “substituição declarada” em §4.2.
2. **A reprodução é offline com mock instrumentado**, não `clasp run`: prova o comportamento do **código no HEAD**
   contra os **cabeçalhos reais**; não prova que o **deploy publicado** no Apps Script está no mesmo commit.
   O código publicado (efeito remoto) é gate próprio — só se fecha com `clasp push` + leitura da AM, o que**não**
   foi feito aqui.
3. **Nenhuma escrita foi feita na planilha** — inclusive nenhuma correção/backfill do §6 (aguarda decisão).
4. `resolverColunaAlerta` foi exercitado pelo caminho real (`varrerAba`); a verificação de **local×remoto do
   Apps Script** continua pendente para o REVIEW.
5. Este relatório é **auto-atestado** (não houve verifier independente); o log bruto e os scripts estão listados
   em §8 para que a auditoria reproduza cada número.
