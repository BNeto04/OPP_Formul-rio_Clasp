# MAPA DO TÚNEL E AUDITORIA DAS FÓRMULAS DA ABA MENSAL

- **Card:** #142 (OCR-P3-008) — Cartografar túnel completo e auditar fórmulas da aba mensal
- **Pai lógico:** #139 · **Comodo:** C03_Dominio · **Módulo:** MOD-C03-01_MODELO_DE_OCORRENCIA
- **Método:** leitura **somente-leitura** da planilha `OCORRÊNCIA POR PEL 2026`
  (`1S05sTbd3otgjGjrC-YrzHk7dXp7mzzaw_J2lyQ86hOY`), aba `SET2026`, via service account
  (`valueRenderOption=FORMULA` + `FORMATTED_VALUE`), amostra = linhas 1–60 (dados reais) e 345–355
  (linhas "preparadas" que recebem o próximo lançamento). Nenhuma célula foi alterada.
- **Data da medição:** 11/09/2026 (branch `sprint/g01-guardiao-qualidade-live-001`).

---

## 1. O que é o túnel (composição e propagação)

| Aspecto | Fato comprovado |
|---|---|
| Identidade | tripla **`DATA | MIKE | BOE`**, materializada na coluna **AK `Chave Ocorrência`** por **fórmula**: `=IF(AND(B="";E="");"";TEXT(B;"DD/MM/YYYY")&"/"&E&"/"&G)` |
| Representação | bloco **contíguo de linhas** na aba mensal; **uma linha por participante** (policial) e as armas em linhas próprias |
| Repetição | `DATA`, `MIKE` e `BOE` são repetidos em **todas** as linhas do túnel (não só na primeira) — o túnel é reconstruível a partir de qualquer linha |
| Fronteira | **linha em branco** entre um túnel e o próximo (observado: linhas 13 e 19 vazias) |
| Pontuação | bruto **do túnel** (`AI PONTOS TOTAIS` por linha/fato) e `AJ PONTOS FICÇÃO = Σ AI do túnel ÷ 4` (divisor fixo, replicado em todas as linhas) — **ARCA-PIP-001** |

**Consequência prática:** a chave é derivada — **se `DATA` ou `MIKE` faltar numa linha, a chave daquela linha fica vazia** e, por consequência, o `PONTOS FICÇÃO` dela (SUMIFS por chave) também. É o vetor mais provável de "túnel fragmentado".

---

## 2. Mapa coluna a coluna (37 colunas, índices reais da `SET2026`)

Classificação: **ENTRADA** = recebe valor literal de `EntradaManual`/OCR · **FÓRMULA** = derivada na planilha · **DERIVADA-EXTERNA** = VLOOKUP de outra aba.

| # | Col | Cabeçalho (literal) | Tipo | Fórmula real (linha de dados) | Depende de |
|---|---|---|---|---|---|
| 1 | A | `ORD` | ENTRADA | — | — |
| 2 | B | `DATA` | ENTRADA | — | — |
| 3 | C | `HORA` | ENTRADA | — | — |
| 4 | D | `QTD O` | ENTRADA | — | — |
| 5 | E | `MIKE` | ENTRADA | — | — |
| 6 | F | `NATUREZA DA OCORRÊNCIA` | ENTRADA | — | — |
| 7 | G | `BOE` | ENTRADA | — | — |
| 8 | H | `AIS` | ENTRADA | — | (alerta `CONFERIR AIS` — card #140) |
| 9 | I | `CIDADE` | ENTRADA | — | (card #140) |
| 10 | J | `BAIRRO` | ENTRADA | — | (card #140) |
| 11 | K | `DETIDOS` | ENTRADA | — | (card #144) |
| 12 | L | **`ARMA`** (física, uma arma por linha) | ENTRADA | — | — |
| 13 | M | `TIPO` | ENTRADA | — | — |
| 14 | N | `CALIBRE` | ENTRADA | — | — |
| 15 | O | `MODELO` | ENTRADA | — | — |
| 16 | P | `MUNIÇÃO` | ENTRADA | — | — |
| 17 | Q | `MACONHA DOLAR` | ENTRADA | — | — |
| 18 | R | `MACONHA GRAMA` | ENTRADA | — | — |
| 19 | S | `TOTAL DE MACONHA` | FÓRMULA | `=Q*3+R` (dólar×3 + grama) | Q, R |
| 20 | T | `Dividido mac` | FÓRMULA | `=IFERROR(INDEX($S$2:$S$2012; MATCH(E; $E$2:$E$2012; 0)) / COUNTIF($E$2:$E$2012; E); "")` | S, E |
| 21 | U | `CRACK PEDRA` | ENTRADA | — | — |
| 22 | V | `CRACK GRAMA` | ENTRADA | — | — |
| 23 | W | `Total CRACK (gr)` | FÓRMULA | `=V + (U/4)` | V, U |
| 24 | X | `COCAINA PINO` | ENTRADA | — | — |
| 25 | Y | `COCAINA GRAMA` | ENTRADA | — | — |
| 26 | Z | `TOTAL DE COCAINA` | FÓRMULA | `=(X+Y) + (V + (U/4))` | X, Y, V, U |
| 27 | AA | `Dividido coc` | FÓRMULA | `=IFERROR(INDEX($Z$2:$Z$2014; MATCH(E; $E$2:$E$2014; 0)) / COUNTIF($E$2:$E$2014; E); "")` | Z, E |
| 28 | AB | `PELOTÃO` | DERIVADA-EXTERNA | `=IFERROR(VLOOKUP(AE; EFETIVO!$A$1:$W$293; 6; 0); "")` | AE |
| 29 | AC | `GRAD` | DERIVADA-EXTERNA | `=IFERROR(VLOOKUP(AE; EFETIVO!$A$1:$W$293; 4; 0); "")` | AE |
| 30 | AD | `MATRICULA` | DERIVADA-EXTERNA | `=IFERROR(VLOOKUP(AE; EFETIVO!$A$1:$W$293; 5; 0); "")` | AE |
| 31 | AE | `POLICIAL` (**chave do EFETIVO**) | ENTRADA | — | — |
| 32 | AF | **`QDT ARMAS`** (participação por policial) | ENTRADA | — | — |
| 33 | AG | `OCORRÊNCIA PIP` | ENTRADA | — | — |
| 34 | AH | `IMPUTADO?` | ENTRADA | — | — |
| 35 | AI | `PONTOS TOTAIS` | FÓRMULA | `=IFERROR(IF(AG=""; ""; VLOOKUP(AG; 'tabela de pontos PIP'!$C$4:$G$100; IF(AH="COM IMPUTADO";5;4); FALSE) * <quantidade>); "")` | AG, AH |
| 36 | AJ | `PONTOS FICÇÃO (1/4)` | FÓRMULA | `=IF(AK="";""; SUMIFS($AI$2:$AI$1209; $AK$2:$AK$1209; AK) / 4)` | AK, AI |
| 37 | AK | `Chave Ocorrência` | FÓRMULA | `=IF(AND(B="";E="");""; TEXT(B;"DD/MM/YYYY")&"/"&E&"/"&G)` | B, E, G |

Fonte do `AI`: `'tabela de pontos PIP'!C4:G100` — **coluna 4 = SEM IMPUTADO, coluna 5 = COM IMPUTADO** (a fórmula decide por `AH`).

---

## 3. Semântica canônica dos campos de arma e droga (reconciliada com a ARCA)

| Campo | Semântica | Regra ARCA |
|---|---|---|
| `ARMA` (L/12) | arma **física** da linha; 2 armas = 2 linhas com `ARMA=1` | **ARCA-ARMAS-001** |
| `QDT ARMAS` (AF/32) | **participação por policial** = total de armas do túnel, replicado em todos os participantes; **nunca somada** | **ARCA-ARMAS-001** |
| `TOTAL DE MACONHA` (S) / `Total CRACK (gr)` (W) / `TOTAL DE COCAINA` (Z) | quantidades **do túnel** (alimentam a pontuação) | **ARCA-PIP-001** (pontuação usa o **total**) |
| `Dividido mac` (T) / `Dividido coc` (AA) | **fração fictícia por policial** (quantidade do túnel ÷ nº de **linhas** do túnel); **não pontua** — serve ao acumulado individual | — |

**Duas lógicas distintas, confirmadas pelo proprietário:** arma = **participação** (unidade indivisível, conta participação); droga = **fração fictícia** (rateio igualitário declaradamente fictício).

**Precisão comprovada sobre a regra de desalinhamento:** o cruzamento quantidade × motivo PIP é **por túnel**, e a fórmula lê a **PRIMEIRA linha do MIKE** (`INDEX($S…; MATCH(E…))`). Portanto:
- o **motivo PIP pode estar em qualquer linha** do túnel (comprovado: túnel `…443710` com quantidade na L4 e título de maconha na L5; túnel `…413548` com quantidade na L20 e título na L22);
- a **quantidade precisa estar na primeira linha do túnel** — se for lançada numa linha posterior, `MATCH` devolve a primeira e o rateio fica zerado. **Restrição de dados a documentar para o operador.**

---

## 4. Riscos e fragilidades detectados (classificados, nenhum corrigido sem evidência)

| ID | Risco | Evidência | Severidade |
|---|---|---|---|
| **R1** | **Ranges inconsistentes entre fórmulas irmãs**: maconha vai até `$S$2012`, cocaína até `$Z$2014`, e `PONTOS FICÇÃO` só até `$AI$1209`/`$AK$1209` | fórmulas das colunas T, AA e AJ | **ALTA** — uma linha além do limite perde a derivada em silêncio (ex.: linha 1300 pontua mas não gera ficção) |
| **R2** | ~~`Total CRACK (gr) = V + (U/4)` e `TOTAL DE COCAINA = (X+Y) + (V + U/4)`~~ | colunas W e Z | **RESOLVIDO (11/09/2026) — regra de domínio confirmada, não é defeito.** O proprietário determinou as medidas canônicas (pedra de crack = 0,25 g; papelote/big de maconha = 3 g; pino/ziplock de cocaína = 1 g) e que **o crack entra no somatório geral da cocaína nos escalões superiores** por ser derivado direto dela, ainda que a unidade separe as duas contabilidades. Registrado em `ARCA-CONVERSAO-001` + `Core/Constantes.js:CONVERSOES_DROGAS` (#144). |
| **R3** | `Dividido` depende da **primeira linha do MIKE** (ver §3) | coluna T/AA | **MÉDIA** — restrição de entrada, hoje silenciosa |
| **R4** | Catálogo PIP com **pares duplicados** `SEM/COM IMPUTADO` (colunas 2–3 e 4–5 de `C:G`); a fórmula usa as colunas 4/5 | `tabela de pontos PIP` + fórmula de AI | **MÉDIA** — risco de divergência entre os dois pares |
| **R5** | `AJ` e `AK` retornam **vazio** quando `AK` (chave) está vazio → se `DATA`/`MIKE` faltar numa linha filha, a linha perde a ficção | fórmulas de AK/AJ | **MÉDIA** — vetor de "túnel fragmentado" |
| **R6** | `AI` decide imputado por `IF(AH="COM IMPUTADO";5;4)` → qualquer valor diferente (vazio, "SEM IMPUTADO", grafia alternativa) cai em **SEM IMPUTADO** | fórmula de AI | **MÉDIA** — decisão implícita por ausência |
| **R7** | `PELOTÃO`/`GRAD`/`MATRICULA` são **fórmula (VLOOKUP)** mas `EntradaManual` também conhece essas colunas e pode gravar literal | colunas AB/AC/AD x `EntradaManual.js:330,391` | **MÉDIA** — gravar literal sobre célula derivada é o caso clássico de "valor que a fórmula depois sobrescreve ou ignora"; precisa de teste específico |
| **R8** | `AIS`/`CIDADE`/`BAIRRO` são **entrada** com alerta âmbar quando não resolvem | card #140 (endereços SEI) | **BAIXA** — já tratado em #140 |

---

## 4.1 Conversões canônicas das formas de apreensão (RESOLVIDO — 11/09/2026)

Determinação literal do proprietário, registrada em `ARCA-CONVERSAO-001` e em `Core/Constantes.js` (`CONVERSOES_DROGAS`):

| Forma de apreensão | Equivalente | Onde aparece na fórmula |
|---|---|---|
| 1 **pedra de crack** | **0,25 g** | `Total CRACK (gr) = CRACK GRAMA + CRACK PEDRA/4` |
| 1 **papelote / big de maconha** | **3 g** | `TOTAL DE MACONHA = MACONHA DOLAR*3 + MACONHA GRAMA` |
| 1 **pino / ziplock de cocaína** | **1 g** | `TOTAL DE COCAINA = (COCAINA PINO+GRAMA) + (CRACK GRAMA + CRACK PEDRA/4)` |

**Regra de escalão superior:** a unidade separa **cocaína × crack** para fins de contabilidade próprios, mas **o crack
entra no somatório geral da cocaína nos escalões superiores** (derivado direto). Por isso `Z` inclui o crack — é
intencional. O dono descreveu a lógica geral: o túnel registra **as várias formas de apreensão** e a planilha
**converte em totais**.

## 5. Lacunas declaradas (o que não é provável só de fora)

1. ~~R2~~ **resolvido** (§4.1): a conversão e a inclusão do crack no total de cocaína são regra de domínio confirmada.
2. O comportamento da fórmula quando o operador lança a quantidade numa linha não-inicial do túnel (R3) não foi observado em produção — é dedução da semântica de `MATCH`, não um caso real medido.
3. Ranges (`2012`/`2014`/`1209`) podem refletir o tamanho histórico da aba em datas diferentes — não há evidência documental da intenção.

---

## 6. Cruzamento com os consumidores (o que lê o quê)

| Consumidor | Lê | Observação |
|---|---|---|
| `Core/LeitorPlanilhas.js` | headers por alias (`Constantes.js`), inclusive `armas` | corrigido no **#141** (alias `ARMAS` não pode ler a coluna 32) |
| `Features/GuardiaoQualidade.js` | `ARMA_LINHA` (12) e `ARMAS` | corrigido no **#141** |
| `Entrada/EntradaManual.js` | grava A–AF conforme mapeamento (`QDT ARMAS` por policial) | R7 acima |
| `Features/CompiladorGxt.js` / `Motor/PoliticaMeritoArmas.js` | coluna `ARMA` como fonte física exclusiva | comentário alinhado no **#141** |
| ARCA | `ARCA-ARMAS-001`, `ARCA-PIP-001` | reconciliadas |

---

## 7. Vínculo

- Cards: **#142** (este mapa), **#140** (AIS), **#141** (ARMA × QDT ARMAS), **#143** (gravação), **#144** (entorpecentes/DETIDOS).
- Regras ARCA: `ARCA-ARMAS-001`, `ARCA-PIP-001`, `ARCA-OCORRENCIA-001`.
- Nenhuma correção funcional foi feita neste card: o entregável é o mapa factual, com riscos classificados e lacunas declaradas.
