---
card: "141"
comodo: C03_Dominio
modulos: [MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO]
submodulos: [SUB-C03-02-01_CATALOGO_DE_REGRAS, SUB-C03-02-02_FONTES_E_PROVENIENCIA]
tipo: evidencia
formato: "46.5 - commit . ambiente . entrada . resultado . limite"
data: "2026-09-13"
---

# EV-C03-001 - ARCA: semantica canonica ARMA x QDT ARMAS

**Entrega:** #141 (OCR-P3-007) - a ARCA recebe a semantica explicita dos dois campos e a invariante de
participacao por tunel, **somente com regra factual comprovada**.

## Commit
| Hash | Mensagem | Arquivos | Estatistica |
|---|---|---|---|
| `0c489ad` | `fix(dominio): semantica canonica ARMA (fisica) x QDT ARMAS (participacao) (#141 OCR-P3-007)` | `Dominio/ARCA/ARCA_REGRAS_DOMINIO.md`, `Dominio/ARCA/arca_regras_dominio.json`, `Core/Constantes.js`, `Features/CompiladorGxt.js`, testes | 6 arquivos, +135 -14 |
| `fa52c07` | `feat(arca): fluid flow - 17 NAO_AUDITAVEL reclassificadas + diagnostico QDT_ARMAS_DIVERGENTE_NO_TUNEL (ARCA-ARMAS-001) - ref #148 #141` | `Dominio/ARCA/AdaptadorConsultaArca.js`, `Dominio/ARCA/arca_regras_dominio.json`, `Features/GuardiaoQualidade.js`, `Core/ContratoMutacaoSegura.js`, testes | 6 arquivos, +103 -53 |
| `653e9ba`, `03f82fd` | reconciliacao de `ARCA-ANTIGUIDADE-002` (desempate por matricula mais antiga) | `Dominio/ARCA/*` | - |

## Ambiente
| Item | Valor |
|---|---|
| Fonte canonica | `Dominio/ARCA/arca_regras_dominio.json` + espelho legivel `Dominio/ARCA/ARCA_REGRAS_DOMINIO.md` |
| Porta de consulta | `Dominio/ARCA/AdaptadorConsultaArca.js` (singleton, cache em memoria, lookup O(1)) |
| Prova | `clasp push` + verificacao remota (**81/81**) |
| Base de dados | aba `SET2026` real (tuneis com 4 e 7 policiais) |

## Entrada
- Regra de origem: `ARCA-ARMAS-001`.
- Confirmacao literal do proprietario registrada no #139 (a invariante de participacao).
- Evidencia de codigo: `Core/Constantes.js:33-37`, `Core/LeitorPlanilhas.js`, `Features/GuardiaoQualidade.js`.

## Resultado
O que a ARCA passou a declarar (somente factual):
- semantica explicita dos dois campos (`ARMA` = arma fisica **da linha**; `QDT ARMAS` = participacao);
- a **invariante de participacao por tunel**;
- fontes (confirmacao do proprietario);
- evidencia de codigo;
- o teste novo (`Testes/TestSemanticaArmasQdt.js`).

JSON e MD reconciliados; `ARCA_COBERTURA.md` ja marcava `COBERTO`.
Complemento posterior (`fa52c07`): `QDT_ARMAS_DIVERGENTE_NO_TUNEL` mapeado para `ARCA-ARMAS-001` no
adaptador e **acrescentado a blacklist dura** de `Core/ContratoMutacaoSegura.js`.
Fluid flow final: **29 MAPEADO + 7 INTEGRADO + 9 NAO_APLICAVEL = 45 regras** (nenhuma "cega").

## Limite
- **Desvio declarado pelo proprio autor:** mantenho `auditabilidade_guardiao.status = NAO_AUDITAVEL`
  **de proposito** no #141 - a invariante habilita um diagnostico dedicado, mas cria-lo naquele momento
  geraria codigo sem cobertura ARCA mapeada (violaria os guardas #125/#126). O diagnostico veio **depois**,
  no `fa52c07`.
- A ARCA **nao** promove convencao de UI a regra oficial: so recebeu o que o proprietario confirmou.
- O ID `ARCA-DROGAS-001` **ja existia** (heuristica mapeada) - a regra de conversao teve de ser criada com
  outro ID (`ARCA-CONVERSAO-001`). Detalhe em `EV-C03-002`.
- O inventario de 45 regras e um **levantamento**, nao uma prova: e a contagem no momento do registro
  (`d4f6c0c`, 12/09/2026).
