# RESULT — #146 ARCA-GUARD-002 (Diagnóstico da ordem de antiguidade da equipe)

**Task:** ARCA-GUARD-002 | **Issue:** #146 | **Branch:** `sprint/g01-guardiao-qualidade-live-001`
**Papel:** Operário executor (Hermes) | **Estado:** RESULT_PENDING_AUDIT

## Entrega
O Guardião **audita a ORDEM de antiguidade da equipe** de cada túnel — auditor passivo, **não reordena** nada.

- **Regra canônica:** posto/graduação primeiro (mais antigo primeiro); **no empate, matrícula mais antiga (menor número)**.
- **Diagnóstico:** `ORDEM_ANTIGUIDADE_EQUIPE` (ALERTA, lançado na linha do fato).
- Reusa a **mesma lógica** de `Core/Policiais.js:141-151` (bloco `ORDEM_POSTOS_ANTIGUIDADE_` ... `// FIM-ORDEM-ANTIGUIDADE`).
- Sem o núcleo carregado, o check é **ignorado** (nunca gera falso positivo).

## Consistência ARCA == código == testes (exigência do card)
| Onde | O que diz |
|---|---|
| `Core/Policiais.js` (código) | graduação primeiro; desempate por matrícula numérica |
| `Features/GuardiaoQualidade.js` (Guardião) | `indiceAntiguidadePosto_` + `matriculaNumerica_` |
| `Dominio/ARCA/arca_regras_dominio.json` → `ARCA-ANTIGUIDADE-002` | "graduação primeiro; **MATRÍCULA mais antiga**" (corrigido — antes dizia "menor N") |
| `Testes/TestGuardiao.js` | ordem canônica (não gera) / fora de ordem (gera) |
| `Testes/TestOrdemAntiguidadeEquipe.js` | confere core x cliente (`Entrada/Formulario.html`) |

## Testes
`TestGuardiao` **48 PASS / 0 FAIL** · `TestOrdemAntiguidadeEquipe` **7 PASS / 0 FAIL**

## Prova no Apps Script remoto (SET2026, coluna AM)
`Equipe fora da ordem canonica de antiguidade (posto/graduacao; desempate pela matricula mais antiga)` — **múltiplas linhas**.

## Arquivos alterados
`Features/GuardiaoQualidade.js`, `Dominio/ARCA/AdaptadorConsultaArca.js`, `Dominio/ARCA/arca_regras_dominio.json`, `Testes/TestGuardiao.js`
