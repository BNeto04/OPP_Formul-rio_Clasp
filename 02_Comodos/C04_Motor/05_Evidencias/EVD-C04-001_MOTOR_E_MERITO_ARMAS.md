---
card: "141"
cards_relacionados: ["152"]
comodo: C04_Motor
modulos: [MOD-C04-01_MOTOR_ANALITICO]
tipo: evidencia
formato: "46.5 - commit . ambiente . entrada . resultado . limite"
data: "2026-09-13"
---

# EV-C04-001 - Motor Analitico e politica de merito de armas

**Entrega:** #141 (OCR-P3-007) - auditoria da semantica de arma **no Motor**;
#152 (PROD-ARMAS-001) - provas do comparativo e do merito.

## Commit
| Hash | Mensagem | Arquivos |
|---|---|---|
| `0c489ad` | `fix(dominio): semantica canonica ARMA (fisica) x QDT ARMAS (participacao) (#141 OCR-P3-007)` | `Core/Constantes.js`, ARCA, `Features/CompiladorGxt.js`, testes |
| `1e492ad` | `docs(result): #152 AS 4 PARTES DO COMPARATIVO PROVADAS` | `agentic/state/RESULT_152_PARTE1_ARMAS.md` |
| `fe4ec03`, `89c8a17`, `486e324`, `71f1d61` | portas de prova `verificar*Headless` (#152) | kernel de provas |

**Observacao honesta:** **nenhum** commit de #140/#141/#142/#144/#152/#150 alterou `Motor/**`
(`git log -- Motor/` so mostra trabalho anterior, do ciclo `#117`/GXT). Este registro e, portanto, de
**auditoria (leitura)**, nao de alteracao.

## Ambiente
| Item | Valor |
|---|---|
| Arquivos auditados | `Motor/PoliticaMeritoArmas.js`, `Motor/MotorAnaliticoV2.js`, `Motor/DiagnosticoDeterministicoGxt.js` |
| Alteracao | **nenhuma** |
| Prova do #152 | portas headless `verificar*Headless(matricula)` contra as 9 abas de origem |

## Entrada
- Inventario do #141, que registra `Motor/PoliticaMeritoArmas.js:3-6` como **correto**: o cabecalho do
  arquivo declara "`ARMA` e a fonte exclusiva de arma de fogo fisica (numerica). `QDT ARMAS` nao entra no
  calculo." - exatamente a semantica canonica fixada no #141.
- Consumidores provados por busca no repo: `Features/CompiladorGxt.js:73`, `Core/RegrasQualidade.js:328`,
  `Motor/DiagnosticoDeterministicoGxt.js:22`, `Testes/TestMeritoEquipeArmas.js`.

## Resultado
| Verificacao | Resultado |
|---|---|
| Semantica de arma no Motor | **correta** no #141 (fonte unica = `ARMA` fisica) |
| Descarte do valor no comparativo | o defeito **nao** estava no Motor: estava em `Dominio/RegistroAnalitico.js` (`fatos` reconstruido com 7 campos, sem `participacaoArmas`) - elo final, commit `824b545` |
| Prova do merito/comparativo (#152) | 4 partes provadas: ARMES 8=8 . QTD.O 8=8 . PONTUACAO 36.385,33=36.385,33 . ENTROPECENTES 3.093,5=3.093,5 |
| `TestMotorAnaliticoRegressao` / `TestMeritoEquipeArmas` | presentes e verdes na suite integral (numeros no card) |

## Limite
- **Nada foi alterado no Motor** nos cards citados: o que existe aqui e a **declaracao de que o Motor
  estava correto** (evidencia = cabecalho do arquivo + inventario do #141), nao uma prova de execucao
  nova produzida por este registro.
- O `MotorAnaliticoV2` e um **orquestrador de plugins** (ciclo `inicializar -> processar -> finalizar`);
  a matematica vive nos plugins (`Plugins/Metricas/*`) - este registro **nao** cobre os plugins.
- `DiagnosticoDeterministicoGxt` mantem **duas colecoes separadas** (`fatosFisicos` e
  `ocorrenciasNormalizadas`) e proibe fallback para `QDT ARMAS`: a conformidade foi declarada no cabecalho
  do arquivo, **nao** remedida aqui.
