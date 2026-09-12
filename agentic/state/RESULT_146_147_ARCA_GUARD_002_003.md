# RESULT — #146 / #147 ARCA-GUARD-002/003 (diagnósticos de antiguidade e QTD O)

**Tasks:** ARCA-GUARD-002 (#146) e ARCA-GUARD-003 (#147) | **Branch:** `sprint/g01-guardiao-qualidade-live-001`
**Papel:** Operário executor (Hermes) | **Estado:** RESULT_PENDING_AUDIT — o Planner audita e fecha.

## Objetivo entregue
O Guardião passou a **auditar** duas invariantes que a ARCA só descrevia (estavam `INTEGRADO`):

1. **Ordem de antiguidade da equipe** (ARCA-ANTIGUIDADE-002) — `ORDEM_ANTIGUIDADE_EQUIPE`
2. **QTD O = 01 na primeira linha (fato)** (ARCA-QTD-O-001) — `QTD_O_DIVERGENTE`

O Guardião permanece **auditor passivo**: só diagnostica, nunca reordena nem corrige.

## O que foi feito

| Arquivo | Mudança |
|---|---|
| `Core/Constantes.js` | Alias canônico `QTD_O` (`['QTD O', 'QTD OCORRENCIA', 'QTD OCORRÊNCIA', ...]`). |
| `Features/GuardiaoQualidade.js` | `idx.grad` + `idx.qtdO`; linhas do túnel passam a carregar `qtdO`, `grad`, `matricula`; 2 blocos de invariante por túnel (QTD O e ordem), emitindo `ALERTA` na linha. |
| `Dominio/ARCA/AdaptadorConsultaArca.js` | Mapeia `QTD_O_DIVERGENTE` → `ARCA-QTD-O-001` e `ORDEM_ANTIGUIDADE_EQUIPE` → `ARCA-ANTIGUIDADE-002`. |
| `Dominio/ARCA/arca_regras_dominio.json` | As 2 regras promovidas de `INTEGRADO` para `MAPEADO` (com códigos + propagação indireta). Catálogo: **MAPEADO 31 · INTEGRADO 8 · NAO_APLICAVEL 9**. |
| `Dominio/ARCA/ARCA_REGRAS_DOMINIO.md` | Seções das 2 regras regeradas com os consumidores reconciliados. |
| `Testes/TestGuardiao.js` | +4 testes (QTD O correto/divergente; ordem correta/fora de ordem), carregando o núcleo canônico de `Core/Policiais.js`. |
| `Testes/TestArcaMapaCobertura.js` | Contagens (MAPEADO 31 / INTEGRADO 8). |

## Detalhe da regra de ordem
Reusa **a mesma lógica canônica** do formulário (`Core/Policiais.js`, bloco `ORDEM_POSTOS_ANTIGUIDADE_` … `// FIM-ORDEM-ANTIGUIDADE`): patente mais antiga primeiro; empate resolvido pela **matrícula menor**. O check só roda se o núcleo estiver disponível (em Apps Script sempre está; sem ele, é ignorado — nunca gera falso positivo).

## Testes (12/09/2026)
| Suíte | Resultado |
|---|---|
| `TestGuardiao` | **36 PASS / 0 FAIL** (era 32; +4 novos) |
| `TestArcaMapaCobertura` | 11 PASS / 0 FAIL |
| `TestArcaConsumidores` | 9 PASS / 0 FAIL |
| `TestArcaVeiculoOcr` | 10 PASS / 0 FAIL |
| `TestArcaNormalizadorEfetivo` | 8 PASS / 0 FAIL |
| `TestIntegracaoArca` | 7 PASS |
| `TestOrdemAntiguidadeEquipe` | 7 PASS / 0 FAIL |
| `TestPadroesFormularioQtdODetidos` | 7 PASS / 0 FAIL |

## Observações
1. `TestArcaVeiculoOcr` (que falhava por valor antigo `NAO_AUDITAVEL`) foi corrigido no commit anterior — era a **última falha da ARCA**.
2. **CLASP:** pendente — há alteração de Apps Script (`GuardiaoQualidade.js`, `Constantes.js`); publicar após auditoria do Planner (repo já pushado).
3. Cards filhos restantes do bloco: **#149** (diagnóstico de AIS derivado de cidade/bairro).
