# RESULT — #147 ARCA-GUARD-003 (Diagnóstico QTD O ≠ 01)

**Task:** ARCA-GUARD-003 | **Issue:** #147 | **Branch:** `sprint/g01-guardiao-qualidade-live-001`
**Papel:** Operário executor (Hermes) | **Estado:** RESULT_PENDING_AUDIT

## Entrega
O Guardião audita a regra **QTD O = 01 na primeira linha (fato)** do túnel — e **vazio nas linhas filhas**.

- **Diagnóstico:** `QTD_O_DIVERGENTE` (ALERTA).
- Normalização: `''`, `0` ou `1` contam como `01` na primeira linha (mesma regra de `Entrada/EntradaManual.js: qtdOcorrenciaPadrao_`).
- Alias canônico `QTD_O` adicionado em `Core/Constantes.js`.
- Mapeado na porta → `ARCA-QTD-O-001` (**promovida de INTEGRADO para MAPEADO**).

## Testes
`TestGuardiao` **48 PASS / 0 FAIL**, incluindo:
- QTD O = 01 na 1ª linha e vazio na filha → **não gera**;
- QTD O ≠ 01 na 1ª linha → **gera**.

## Estado no remoto
CLASP publicado (`clasp push -f`, código 0). No SET2026 o diagnóstico **corretamente não dispara**: a coluna QTD O tem `1` na primeira linha (normalizado para `01`) e vazio nas filhas — sem divergência.

## Arquivos alterados
`Core/Constantes.js`, `Features/GuardiaoQualidade.js`, `Dominio/ARCA/AdaptadorConsultaArca.js`, `Dominio/ARCA/arca_regras_dominio.json`, `Testes/TestGuardiao.js`
