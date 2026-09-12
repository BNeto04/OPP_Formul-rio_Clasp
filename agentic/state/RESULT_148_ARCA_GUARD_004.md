# RESULT — #148 ARCA-GUARD-004 (Prova formal: ARMA x QDT ARMAS)

**Task:** ARCA-GUARD-004 | **Issue:** #148 | **Branch:** `sprint/g01-guardiao-qualidade-live-001`
**Papel:** Operário executor (Hermes) | **Estado:** RESULT_PENDING_AUDIT

## Entrega
O núcleo **já existia** — `QDT_ARMAS_DIVERGENTE_NO_TUNEL` no Guardião (participação x soma de ARMA física) já mapeado para `ARCA-ARMAS-001` na porta. **Nada foi reimplementado**; foi adicionada a **prova formal dos cenários** exigida pelo card.

## Cenários provados (`Testes/TestGuardiao.js`)
| Cenário | Esperado | Resultado |
|---|---|---|
| QDT == soma de ARMA física em todo o túnel | não gera | PASS |
| QDT divergente entre participantes | gera | PASS |
| QDT diferente da soma de ARMA física | gera | PASS |
| **Túnel sem arma** (ARMA 0 / QDT 0) | não gera | PASS |
| **Múltiplas armas coerentes** (ARMA 2 / QDT 2) | não gera | PASS |
| **Túnel com 3 policiais**, QDT coerente | não gera | PASS |
| **Túnel com 3 policiais**, QDT divergente | gera | PASS |

## Testes
`TestGuardiao` **48 PASS / 0 FAIL** · `TestSemanticaArmasQdt` 6/0.

## Registro do card (#141, que originou a regra)
`ARCA-ARMAS-001`: a coluna `ARMA` é a fonte física; `QDT ARMAS` é participação e **nunca** entra em soma física (alias separados em `Core/Constantes.js`).
