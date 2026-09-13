---
card: "144"
cards_relacionados: ["142"]
comodo: C03_Dominio
modulos: [MOD-C03-01_MODELO_DE_OCORRENCIA, MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO]
tipo: evidencia
formato: "46.5 - commit . ambiente . entrada . resultado . limite"
data: "2026-09-13"
---

# EVD-C03-002 - Conversoes de drogas na ARCA e o mapa do tunel / formulas

**Entrega:** #144 (OCR-P3-010) - registro das conversoes canonicas na ARCA;
#142 (OCR-P3-008) - mapa factual do tunel e auditoria das formulas da aba mensal (artefato do dominio).

## Commit
| Hash | Mensagem | Arquivos | Estatistica |
|---|---|---|---|
| `61e4415` | `feat(dominio): conversao canonica das formas de apreensao de drogas (#144 OCR-P3-010)` | `Core/Constantes.js`, `Dominio/ARCA/ARCA_COBERTURA.md`, `Dominio/ARCA/ARCA_FONTES.md`, `Dominio/ARCA/ARCA_REGRAS_DOMINIO.md`, `Dominio/ARCA/arca_regras_dominio.json`, testes | 9 arquivos, +176 -6 |
| `7b2d898` | `docs(dominio): R2 resolvido - conversoes canonicas de drogas confirmadas pelo proprietario (#142/#144)` | `MAPA_DO_TUNEL_E_FORMULAS.md` | 1 arquivo, +17 -2 |
| `8f9bec8` | `docs(dominio): mapa factual do tunel e auditoria das formulas da aba mensal (#142 OCR-P3-008)` | `MAPA_DO_TUNEL_E_FORMULAS.md` (131 linhas), `NOTA_DE_RESPONSABILIDADE.md` | 2 arquivos, +137 |

## Ambiente
| Item | Valor |
|---|---|
| Leitura da aba | somente-leitura, `valueRenderOption=FORMULA` **e** `FORMATTED_VALUE`, aba `SET2026` |
| Celulas alteradas | **nenhuma** |
| Deploy | o artefato do #142 esta em `02_Comodos/**` (**`.claspignore`**) - **nenhum push**; remoto segue **81/81** |
| Regra nova | `ARCA-CONVERSAO-001` (subdominio `drogas`, `CANONICAL_SOURCE_CONFIRMED`) |

## Entrada
**Ordem literal do proprietario (11/09/2026):** uma pedra de crack = 0,25 g; um papelote/big de maconha = 3 g;
um pino/ziplock de cocaina = 1 g; e `crack` conta no somatorio geral da cocaina por ser derivado direto.
Formula de origem auditada: `Total CRACK (gr) = V+(U/4)` e `TOTAL DE COCAINA = (X+Y)+(V+U/4)`.
Consumo real da regra: `Core/Constantes.js:CONVERSOES_DROGAS`.

## Resultado
| Verificacao | Resultado |
|---|---|
| `TestConversaoDrogas` (constantes x formulas da aba) | **6/6** |
| `TestArcaConsumidores` / `TestArcaMapaCobertura` / `TestIntegracaoArca` | 9/9, 11/11, 7/7 (catalogo 41 -> **42 regras**) |
| Suite integral (registrada no card) | **423 PASS**; unico vermelho `TestVigiaNaturalLanguage` - pre-existente |
| Deploy | **81/81 byte-iguais ao HEAD** |

**Desfecho do risco R2 do mapa:** a formula que **inclui o crack no `TOTAL DE COCAINA`** e a pedra
**dividida por 4** **nao sao defeito** - sao a conversao canonica confirmada. O R2 fica **resolvido como
intencional**, com a fonte registrada (ordem do proprietario).

**Conteudo do artefato do dominio (`MAPA_DO_TUNEL_E_FORMULAS.md`):** 37 colunas classificadas por
origem/tipo/formula/dependencias/consumidor, 8 riscos (R1..R8) e 3 lacunas declaradas.
**Retratacao registrada:** o "rotulo x formula desalinhados" reportado antes era **off-by-one do proprio
script de inspecao**; os rotulos conferem com as formulas.

## Limite
- **O ID `ARCA-DROGAS-001` nao pode ser usado:** esse ID ja existe no catalogo como heuristica mapeada no
  Guardiao (`Validacao Material Obrigatoria por Tipo de Entorpecente`, `DOMAIN_RULE_SOURCE_UNKNOWN`) - o
  guarda `TestIntegracaoArca` pegou a colisao. Ficou `ARCA-CONVERSAO-001`.
- A intencao de R2 foi resolvida por **ordem do proprietario**, nao por prova documental no repositorio.
- **R1 (ranges inconsistentes de formula), R3 (quantidade na primeira linha do MIKE), R4 (pares
  duplicados no catalogo PIP), R5 (tunel fragmentado), R6 (SEM IMPUTADO implicito em `AI`), R7 (colunas
  derivadas que `EntradaManual` pode gravar literal), R8 (AIS com alerta)** permanecem **classificados e
  nao corrigidos** - nenhuma correcao sem evidencia.
- O mapa cobre **amostra** da aba (linhas 1-60 + 345-355), nao a aba inteira.
