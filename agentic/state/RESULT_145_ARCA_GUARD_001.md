# RESULT — #145 ARCA-GUARD-001 (Registrar regras canônicas faltantes)

**Task:** ARCA-GUARD-001 | **Issue:** #145 | **Branch:** `sprint/g01-guardiao-qualidade-live-001`
**Papel:** Operário executor (Hermes) | **Estado:** RESULT_PENDING_AUDIT — o Planner audita e fecha.
**Regra ADM:** #57 (quatro pontas).

## Objetivo entregue
As três regras de domínio ausentes foram registradas na ARCA com proveniência e limites explícitos:
ordem de antiguidade da equipe, `QTD O = 01` e DETIDOS.

## Regras adicionadas (todas `INTEGRADO` — aplicadas fora do caminho de auditoria)

| rule_id | Título | Fonte (tipo em localização) | Evidência de código | Status |
|---|---|---|---|---|
| `ARCA-ANTIGUIDADE-002` | Ordem de Antiguidade da Equipe no Túnel (Posto/Graduação) | `DIRETRIZ_OPERACIONAL` (Core/Policiais.js:94,138) | Core/Policiais.js:94,138; Motor/PoliticaMeritoArmas.js | INTEGRADO |
| `ARCA-QTD-O-001` | QTD O = 01 por Túnel (primeira linha do fato) | `DIRETRIZ_OPERACIONAL` (Entrada/EntradaManual.js:6-14) | Entrada/EntradaManual.js:6-14,261 | INTEGRADO |
| `ARCA-DETIDOS-001` | DETIDOS: Conjunto Canônico e Gravação no Fato | `ESQUEMA_DADOS` (Core/Constantes.js:60) | Core/Constantes.js:60; Entrada/EntradaManual.js:268,754-768 | INTEGRADO |

## Catálogo resultante
- Total: 45 → **48** regras.
- `MAPEADO` 29 · `INTEGRADO` 7 → **10** · `NAO_APLICAVEL` 9. **Zero regras cegas.**
- Meta: `regras_adicionadas` e `regras_adicionadas_total` +3 (10 → 13); campo `card_145` gravado; nota anexada em `fluid_flow`.

## Arquivos alterados
```
Dominio/ARCA/arca_regras_dominio.json    | +173
Dominio/ARCA/ARCA_REGRAS_DOMINIO.md      |  +39   (3 seções, todas com "reconciliado #125")
Dominio/ARCA/ARCA_FONTES.md              |   +8   (seção "bloco ARCA-GUARD (#145)")
Testes/TestArcaMapaCobertura.js          |  +8/-4 (45→48, 7→10, 10→13)
Testes/TestArcaConsumidores.js           |  +2/-1 (45→48)
```

## Testes (executados 12/09/2026)
- `TestArcaMapaCobertura`: **11 PASS / 0 FAIL**
- `TestArcaConsumidores`: **9 PASS / 0 FAIL**
- `TestArcaNormalizadorEfetivo`: **8 PASS / 0 FAIL**
- `TestIntegracaoArca`: **7 PASS**
- `TestGuardiao`: **32 PASS**

## Observações para auditoria
1. `TestArcaVeiculoOcr` tem **1 FAIL pré-existente** — confirmado via `git stash` (falha idêntica com esta mudança fora); **não é regressão** deste card.
2. Nenhuma heurística foi promovida a regra oficial: `tipo_regra = INTERNAL_OPERATIONAL_RULE` + `fonte_status = INTERNAL_SOURCE_CONFIRMED`.
3. `PLANNED_CONSUMER` = vazio (só aceita caminho real do repositório); a referência aos cards filhos ficou em `OBSERVACAO`.
4. `DECLARED_CONSUMER` = vazio: regra nova não tem lista declarada histórica (preserva a proveniência das 34 originais).
5. Diagnósticos ficam para os cards filhos: #146 (antiguidade da equipe), #147 (QTD O ≠ 01). DETIDOS é regra de domínio de dados — sem diagnóstico automático.
6. **CLASP:** não aplicável — nenhuma alteração de Apps Script/HTML neste card.
