---
card: "142"
cards_relacionados: ["152"]
comodo: C02_Leitura
modulos: [MOD-C02-01_LEITURA_E_ADAPTACAO]
tipo: evidencia
formato: "46.5 - commit . ambiente . entrada . resultado . limite"
data: "2026-09-13"
---

# EVD-C02-001 - Leitura do tunel e acumulacao de participacao

**Entrega:** #142 (OCR-P3-008) - arqueologia **somente-leitura** da aba mensal e das formulas;
#152 (PROD-ARMAS-001) - leitura e acumulo do campo de participacao de arma ate o comparativo.

## Commit
| Hash | Mensagem | Arquivos | Estatistica |
|---|---|---|---|
| `8f9bec8` | `docs(dominio): mapa factual do tunel e auditoria das formulas da aba mensal (#142 OCR-P3-008)` | `MAPA_DO_TUNEL_E_FORMULAS.md`, `NOTA_DE_RESPONSABILIDADE.md` (modulo C03) | 2 arquivos, +137 |
| `a0045be` | `fix(leitor): linha filha herda a DATA da mestra do tunel (#152)` | leitor/planilhas | - |
| `7e15433` | `fix(leitor): acumula participacaoArmas no caminho do policial (#152)` | `Core/LeitorPlanilhas.js` | - |
| `d52de16` | `fix(diag): bisturi passa logger para lerAbas (#152)` | instrumento de diagnostico | - |

## Ambiente
| Item | Valor |
|---|---|
| Metodo do #142 | leitura **somente-leitura** da aba `SET2026` (linhas 1-60 reais + 345-355 "preparadas") |
| Renderizacao pedida | `valueRenderOption=FORMULA` **e** `FORMATTED_VALUE` |
| Alteracao de celula | **nenhuma** (declarado no card) |
| Runtime de produto | Google Apps Script + planilha operacional real |
| Deploy do #142 | **nenhum** - `02_Comodos/**` esta no `.claspignore`; o conjunto remoto segue **81/81** |

## Entrada
- Aba mensal real `SET2026`, 37 colunas fisicas, abas `JAN..SET2026`.
- Documento de origem do parser: `Leitura/Adaptador2026.js` (traduz linhas fisicas em `RegistroCanonico`;
  **nao agrega dados** - "Regra de Ouro #4").
- Cabecalhos/aliases: `Core/Cabecalhos.js`, `Core/Constantes.js`.

## Resultado
**Composicao e propagacao do tunel (comprovado no #142):**
- `DATA | MIKE | BOE` repetidos em **todas** as linhas; chave materializada por **formula**
  (`=IF(AND(B="";E="");"";TEXT(B;"DD/MM/YYYY")&"/"&E&"/"&G)`).
- Bloco contiguo de linhas, **fronteira por linha em branco** (13 e 19 vazias na amostra).
- `PONTOS FICCAO = soma de PONTOS do tunel / 4`, replicado (`ARCA-PIP-001`).

**Classificacao das 37 colunas:** 17 ENTRADA, 8 FORMULA, 3 DERIVADA-EXTERNA
(`PELOTAO`/`GRAD`/`MATRICULA` = `VLOOKUP(POLICIAL; EFETIVO!$A$1:$W$293; 6/4/5)` - isto e, `POLICIAL` e a
**chave** do EFETIVO). **8 riscos classificados** (R1..R8) e **3 lacunas declaradas**.

**Efeito medido do #152 na leitura:**

| Indicador | Antes | Depois |
|---|---|---|
| Ocorrencias lidas | 296 | **298** (a heranca da DATA da linha mestra recuperou 2 descartadas) |
| Tempo de execucao do comparativo | ~6 s | **~5 s** |
| `QTD. ARMAS` no comparativo | 0 (todos os 198) | **vivo** (fonte = produto) |

Prova `verificarParticipacaoArmasHeadless('1133306')` - FERNANDES, 3o PEL:
`JAN 0 . FEV 2 . MAR 0 . ABR 0 . MAI 1 . JUN 1 . JUL 0 . AGO 3 . SET 1` = **8** na fonte = **8** no produto,
`confere: true`.

## Limite
- O mapa do tunel foi levantado em **amostra** (linhas 1-60 + 345-355), **nao** na aba inteira: os ranges
  inconsistentes (R1) foram detectados pela formula, nao por varredura completa das linhas.
- **R3 permanece nao observado** por completo: a formula `Dividido` le a **primeira linha do MIKE**; a
  exigencia de "quantidade na primeira linha do tunel" foi comprovada em apenas **2 tuneis reais**.
- **R1 (ranges inconsistentes)** nao foi corrigido - a razao historica dos limites
  (maconha ate `$S$2012`, cocaina ate `$Z$2014`) **nao foi achada** e esta declarada como lacuna.
- O `Math.max` em `Leitura`/`Core/LeitorPlanilhas.js:290` **parecia** defeito e **nao e**: e o dedupe
  **dentro do mesmo tunel** (evita contar o mesmo policial duas vezes na mesma ocorrencia); a soma entre
  tuneis e feita depois. Isso esta medido, nao suposto.
- O arquivo `MAPA_DO_TUNEL_E_FORMULAS.md` foi **arquivado no modulo C03** (`MOD-C03-01`), nao neste comodo;
  este registro cobre o **caminho de leitura** que produziu o mapa.
