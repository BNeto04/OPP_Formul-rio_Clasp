# RESULT — #149 ARCA-GUARD-005 (diagnóstico de AIS + fechamento do bloco)

**Task:** ARCA-GUARD-005 | **Issue:** #149 | **Branch:** `sprint/g01-guardiao-qualidade-live-001`
**Papel:** Operário executor (Hermes) | **Estado:** RESULT_PENDING_AUDIT — o Planner audita e fecha.

## Objetivo entregue
O Guardião passou a auditar o **AIS gravado** contra a **base territorial canônica** (cidade + bairro), e o
**bloco ARCA-GUARD (#145–#149) foi fechado** com o mapa de cobertura fiel.

## Diagnósticos implementados
| Código | Quando | Regra ARCA |
|---|---|---|
| `AIS_DIVERGENTE` | AIS gravado ≠ AIS resolvido da base canônica | ARCA-TERRITORIO-001 |
| `AIS_AUSENTE` | AIS vazio, mas cidade+bairro permitem determinação | ARCA-TERRITORIO-001 |

**Sem falso positivo:** só emite quando o resolver retorna `status === 'DETERMINADO'` com AIS;
casos ambíguos (`PENDENTE_CONFERENCIA`), insuficientes (`DADOS_INSUFICIENTES`) ou sem base ficam
**preservados como pendentes** — nunca inventa AIS. Auditor passivo (não corrige).

## O que foi feito
| Arquivo | Mudança |
|---|---|
| `Features/GuardiaoQualidade.js` | `idx.cidade/bairro/ais`; linhas carregam cidade/bairro/ais; bloco de invariante territorial (usa `resolverAIS` do global no Apps Script, com fallback `require` no Node). |
| `Dominio/ARCA/AdaptadorConsultaArca.js` | Mapeia `AIS_AUSENTE`/`AIS_DIVERGENTE` → `ARCA-TERRITORIO-001`. |
| `Dominio/ARCA/arca_regras_dominio.json` | **ARCA-TERRITORIO-001 promovida `NAO_APLICAVEL` → `MAPEADO`** e `status_cobertura` (que estava **vazio** no levantamento) preenchido como `COBERTO`. Catálogo: **MAPEADO 32 · INTEGRADO 8 · NAO_APLICAVEL 8**. |
| `Dominio/ARCA/ARCA_REGRAS_DOMINIO.md` | Seção da TERRITORIO-001 regerada com os consumidores reconciliados. |
| `Testes/TestGuardiao.js` | +3 testes (AIS coerente / divergente / ausente-resolvível) com par canônico RECIFE+BOA VISTA → AIS 1. |
| `Testes/TestArcaMapaCobertura.js` | Contagens (MAPEADO 32 / NAO_APLICAVEL 8). |

## Testes (12/09/2026)
| Suíte | Resultado |
|---|---|
| `TestGuardiao` | **39 PASS / 0 FAIL** (era 36; +3 do AIS) |
| `TestArcaMapaCobertura` | 11 PASS / 0 FAIL |
| `TestArcaConsumidores` | 9 PASS / 0 FAIL |
| `TestArcaVeiculoOcr` | 10 PASS / 0 FAIL |
| `TestArcaNormalizadorEfetivo` | 8 PASS / 0 FAIL |
| `TestIntegracaoArca` | 7 PASS |
| `TestFormularioAisSei` | 9 PASS / 0 FAIL |
| `TestOrdemAntiguidadeEquipe` | 7 PASS / 0 FAIL |
| `TestPadroesFormularioQtdODetidos` | 7 PASS / 0 FAIL |

## Fechamento do bloco ARCA-GUARD
| Card | Entrega | Estado |
|---|---|---|
| #145 | 3 regras canônicas registradas (antiguidade, QTD O, DETIDOS) | entregue |
| #146 | diagnóstico `ORDEM_ANTIGUIDADE_EQUIPE` | entregue |
| #147 | diagnóstico `QTD_O_DIVERGENTE` | entregue |
| #148 | diagnóstico `QDT_ARMAS_DIVERGENTE_NO_TUNEL` | entregue (commit anterior) |
| #149 | diagnósticos `AIS_*` + fechamento do mapa | entregue |

**Mapa final:** 48 regras · MAPEADO 32 · INTEGRADO 8 · NAO_APLICAVEL 8 — zero cegas.

## Observações
1. **CLASP pendente:** há alteração de Apps Script (`GuardiaoQualidade.js`, `Constantes.js`) — publicar após a auditoria do Planner.
2. `DETIDOS-001` permanece `INTEGRADO`: é regra de esquema/dado operacional (a semântica da lista suspensa **não** foi promovida a regra de domínio, conforme o escopo do #145).
