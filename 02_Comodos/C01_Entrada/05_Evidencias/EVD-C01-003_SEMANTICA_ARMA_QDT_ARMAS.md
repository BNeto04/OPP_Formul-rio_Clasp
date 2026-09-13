---
card: "141"
comodo: C01_Entrada
modulos: [MOD-C01-01_FORMULARIO_E_MENUS]
tipo: evidencia
formato: "46.5 - commit . ambiente . entrada . resultado . limite"
data: "2026-09-13"
---

# EVD-C01-003 - Semantica ARMA (fisica) x QDT ARMAS (participacao): a ponta do C01

**Entrega:** #141 (OCR-P3-007, P0, `sprint:c01`) - reconciliar `ARMA` x `QDT ARMAS` com ARCA e Guardiao.
Este registro cobre **a ponta do comodo C01** (persistencia e formulario); as pontas ARCA e Guardiao
estao em `EVD-C03-001` e `EVD-C05-001`.

## Commit
| Hash | Mensagem | Arquivos | Estatistica |
|---|---|---|---|
| `0c489ad` | `fix(dominio): semantica canonica ARMA (fisica) x QDT ARMAS (participacao) (#141 OCR-P3-007)` | `Core/Constantes.js`, `Dominio/ARCA/ARCA_REGRAS_DOMINIO.md`, `Dominio/ARCA/arca_regras_dominio.json`, `Features/CompiladorGxt.js`, `Testes/TestSemanticaArmasQdt.js`, `Testes/RodarTodosOsTestes.js` | 6 arquivos, +135 -14 |

**Observacao honesta:** o commit **nao tocou** `Entrada/**`. A ponta do C01 **ja estava correta** e foi
**auditada, nao alterada** - o defeito vivia na resolucao de alias (`Core/Constantes.js`).

## Ambiente
| Item | Valor |
|---|---|
| Runtime de produto | Google Apps Script + planilha operacional real (aba `SET2026`) |
| Prova | `clasp push` + verificacao remota byte-a-byte (**81/81**) |
| Invariante conferida | `QDT ARMAS` identico para todos os participantes do tunel **e** igual a soma de `ARMA` do tunel |
| Confirmacao literal | registrada pelo proprietario no #139 |

## Entrada
Inventario de todas as ocorrencias de `ARMA`, `ARMAS`, `QDT ARMAS`, `QTD ARMAS` e aliases. Trechos do C01:

| Onde | Uso | Semantica | Veredito |
|---|---|---|---|
| `Entrada/EntradaManual.js:231,330,391` | grava `QDT ARMAS` (campo AF) por policial | participacao | **correto** |
| `Core/Constantes.js:33` | `QDT_ARMAS: ['QDT ARMAS','QTD ARMAS']` | participacao | correto |
| `Core/Constantes.js:34` | `ARMAS: ['QDT ARMAS','QTD ARMAS','ARMAS']` | **alias cruzado** - nao listava `ARMA` | **defeito** |
| `Core/Constantes.js:35` | `ARMA_LINHA: ['ARMA']` | fisica | correto |

Prova com dados reais - aba `SET2026`:

| Tunel (MIKE) | Linhas com `ARMA` | `QDT ARMAS` |
|---|---|---|
| `...443710` (4 policiais) | 2 (L4=1, L5=1) | **2 em todos os 4** |
| `...413548` (7 policiais) | 1 (L20=1) | **1 em todos os 7** |
| `...40252476` (4 policiais) | 0 | vazio |

## Resultado
| Verificacao | Resultado |
|---|---|
| `TestSemanticaArmasQdt.js` - RED antes | 3 PASS / 3 FAIL (`alias ARMAS somou 8 - leu a coluna de participacao (32)`) |
| idem - GREEN depois | **6 PASS / 0 FAIL** |
| Invariante do tunel (QDT identico + = soma de ARMA) | teste explicito verde |
| Varredura de **todos** os aliases | so `QDT_ARMAS` pode listar a coluna de participacao |
| `TestArcaConsumidores` / `TestArcaMapaCobertura` / `TestIntegracaoArca` | 9/9, 11/11, 7/7 |
| Suite integral (registrada no card) | **411 PASS / 0 FAIL** (unico vermelho pre-existente: `TestVigiaNaturalLanguage`) |
| Deploy | **81/81 byte-iguais ao HEAD** |

Correcao minima: `ARMAS: ['ARMA','ARMAS']` (+ comentarios proibindo o cruzamento). `QDT_ARMAS` segue
exclusivo de participacao; `ARMA_LINHA` inalterado. No tunel real de 4 policiais o alias somava **8**
(4 x 2) em vez de **2**.

## Limite
- `QDT ARMAS` (coluna 32) e **participacao replicada** - nao e quantidade fisica. Quem somar a coluna
  entre policiais do mesmo tunel **multiplica** o fato fisico. O teste varre os aliases, mas o limite
  permanece: **nenhum alias pode permitir a confusao**.
- A correcao foi no **C01 nao mudou nada** - a ponta de gravacao ja respeitava a semantica. O defeito
  era de resolucao de cabecalho.
- ARCA ficou com `auditabilidade_guardiao.status = NAO_AUDITAVEL` **de proposito** no #141 (o diagnostico
  dedicado foi entregue depois, no `fa52c07`/#148) - desvio declarado pelo proprio autor.
