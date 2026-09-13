---
card: "144"
comodo: C01_Entrada
modulos: [MOD-C01-01_FORMULARIO_E_MENUS]
submodulos: [SUB-C01-01-01_OCR_E_CONFERENCIA]
tipo: evidencia
formato: "46.5 - commit . ambiente . entrada . resultado . limite"
data: "2026-09-13"
---

# EV-C01-002 - OCR parcial de entorpecentes e DETIDOS vazio

**Entrega:** #144 (OCR-P3-010, P0, `sprint:c01`) - corrigir OCR parcial de entorpecentes e DETIDOS vazio.

## Commit
| Hash | Mensagem | Arquivos | Estatistica |
|---|---|---|---|
| `5ac6670` | `fix(ocr): multiplas entradas de entorpecente e DETIDOS explicito (#144 OCR-P3-010)` | `Entrada/Formulario.html`, `Testes/TestOcrEntorpecentesDetidos.js`, `Testes/RodarTodosOsTestes.js` | 3 arquivos, +197 -49 |
| `966bba0` | `fix(test): injeta os helpers de OCR (#140/#144) no sandbox de TestFormularioCidadeBairro` | `Testes/TestFormularioCidadeBairro.js` | 1 arquivo, +11 -9 |
| `61e4415` | `feat(dominio): conversao canonica das formas de apreensao de drogas (#144 OCR-P3-010)` | `Core/Constantes.js`, `Dominio/ARCA/*`, testes | 9 arquivos, +176 -6 |
| `7b2d898` | `docs(dominio): R2 resolvido - conversoes canonicas de drogas confirmadas pelo proprietario (#142/#144)` | `MAPA_DO_TUNEL_E_FORMULAS.md` | 1 arquivo, +17 -2 |

## Ambiente
| Item | Valor |
|---|---|
| Runtime de produto | Google Apps Script + planilha operacional real |
| Prova | `clasp push` + verificacao remota byte-a-byte |
| Fixture | **BO real 01/09/2026** - PDF `SEI - Servico do dia 01SET2026.pdf`, secao *Imagens Complementares* |
| Sem dependencia nova | nenhuma biblioteca externa |

## Entrada
Trecho OCR bruto congelado como fixture:

```
ENTORPECENTE/CRACK , 10 GRAMA(S),
ENTORPECENTE/ANABOLIZANTES , 5 UNIDADE(S),
ENTORPECENTE/CRACK , 20 UNIDADE(S),
```

A tela preenchia **so `CRACK PEDRA - 20`**. Causa: a deduplicacao era **por substancia**, guardando a
**maior quantidade** - `CRACK 10 GRAMA` foi engolido por `CRACK 20 UNIDADE`.

## Resultado
| Verificacao | Antes | Depois |
|---|---|---|
| `Testes/TestOcrEntorpecentesDetidos.js` | 4 PASS / 2 FAIL (`[{CRACK,20,UNIDADES}]`) | **6 PASS / 0 FAIL** |
| Entradas suportadas extraidas | 1 | **2** (CRACK GRAMA 10 + CRACK PEDRA 20) |
| MACONHA fabricada | nao | **nao** (teste explicito) |
| ANABOLIZANTES | - | **nao convertido/duplicado** (sem coluna na aba; declarado nao suportado) |
| `TestConversaoDrogas` (constantes x formulas da aba) | - | 6/6 |
| `TestArcaConsumidores` / `TestArcaMapaCobertura` / `TestIntegracaoArca` | - | 9/9, 11/11, 7/7 (catalogo 41 -> **42 regras**) |
| Suite integral (registrada no card) | - | **423 PASS**; unico vermelho `TestVigiaNaturalLanguage` - pre-existente |
| Deploy | - | **81/81 byte-iguais ao HEAD** |

**DETIDOS:** e indicador processual (`APFD/TCO/BOC/AAFAI`), nao contagem de pessoas, e nunca era
preenchido porque nao existia extracao. Foi implementado `detidosPendentesOcr_` + alerta no `parseAndFill`:
quando o BO traz evidencia estruturada e o campo esta vazio, o sistema **sinaliza**
(`DETIDOS vazio - confira se cabe APFD/TCO/BOC/AAFAI. Nao foi inferido`). **Nao infere valor.**

## Limite
- **DETIDOS nao e inferido** - o limite e deliberado: um DETIDOS errado muda o PIP de SEM para
  COM IMPUTADO e mexeria na pontuacao.
- `ANABOLIZANTES` **nao tem destino** na aba mensal: a ausencia esta declarada, nao foi resolvida.
- A regra de conversao (`ARCA-CONVERSAO-001`: 1 pedra = 0,25 g; 1 papelote/big = 3 g; 1 pino/ziplock = 1 g)
  foi registrada por **ordem do proprietario**, nao por deducao. O ID **nao** pode ser `ARCA-DROGAS-001`
  porque esse ID ja existe no catalogo (heuristica mapeada no Guardiao) - o guarda `TestIntegracaoArca`
  pegou a colisao.
- Nao ha, neste repositorio, prova de campo para o #144 semelhante a do #140 (uso real): o card fecha por
  testes + deploy remoto.
