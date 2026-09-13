---
card: "140"
comodo: C01_Entrada
modulos: [MOD-C01-01_FORMULARIO_E_MENUS]
submodulos: [SUB-C01-01-01_OCR_E_CONFERENCIA]
tipo: evidencia
formato: "46.5 - commit . ambiente . entrada . resultado . limite"
data: "2026-09-13"
---

# EV-C01-001 - OCR de AIS em endereco SEI/CIODS segmentado por ';'

**Entrega:** #140 (OCR-P3-006, P0, `sprint:c01`) - corrigir deteccao de AIS em enderecos SEI com
separadores e bairros canonicos.

## Commit
| Hash | Mensagem | Arquivos | Estatistica |
|---|---|---|---|
| `62635ca` | `fix(ocr): AIS em endereco SEI/CIODS segmentado por ';' (#140 OCR-P3-006)` | `Entrada/Formulario.html`, `Testes/TestFormularioAisSei.js`, `Testes/TestFormularioCidadeBairro.js`, `Testes/RodarTodosOsTestes.js` | 4 arquivos, +200 -42 |
| `966bba0` | `fix(test): injeta os helpers de OCR (#140/#144) no sandbox de TestFormularioCidadeBairro` | `Testes/TestFormularioCidadeBairro.js` | 1 arquivo, +11 -9 |
| `4dde66a` | `fix(entrada): endereco do print 04/09, QTD O padrao 01 e DETIDOS lista suspensa com padrao TCO` | `Entrada/EntradaManual.js`, `Entrada/Formulario.html`, testes | 5 arquivos, +203 -7 |

## Ambiente
| Item | Valor |
|---|---|
| Runtime de produto | Google Apps Script (runtime do produto), planilha operacional real |
| Deploy | `clasp push` + verificacao remota byte-a-byte |
| Antes da correcao | base territorial ja resolvia `TORROES`/`SANCHO` para `AIS 4`; o parser e que nao entregava o bairro |
| Prova de campo | **uso real pelo proprietario** (BO `202609042215125692`) |

## Entrada
Endereco real do BO, segmentado por `;` e sem rotulos, com `NAO INFORMADO` no meio:
`AVENIDA GAROTA DE IPANEMA; COMPLEMENTO NAO INFORMADO;NUMERO NAO INFORMADO;50920-680;SANCHO;RECIFE;PE; BRASIL`
Fixture anexada ao card: PDF `SEI - Servico do dia 01SET2026.pdf`, secao de endereco.
Base canonica de resolucao: `Dominio/ResolverAIS.js` + `Dominio/TabelaTerritorialAIS.js`.

## Resultado
| Verificacao | Resultado |
|---|---|
| `Testes/TestFormularioAisSei.js` - RED antes | 3 PASS / 3 FAIL (os 3 do SEI) |
| `Testes/TestFormularioAisSei.js` - GREEN depois | **6 PASS / 0 FAIL** |
| Endereco do BO 01/09 - bairro/cidade | `TORROES` / `RECIFE` |
| Endereco do BO 04/09 - bairro/cidade | `SANCHO` / `RECIFE` |
| AIS alcancado pela base canonica | **AIS 4** (`status: DETERMINADO`, criterio `MULTI_AIS_BAIRRO_EXATO`) para os dois |
| `TestFormularioCidadeBairro` (regressao de DOM, 7 casos) | 7/7 |
| `TestFormularioAis` (base territorial / EntradaManual) | 12/12 |
| Suite integral (registrada no card) | **423 PASS**; unico vermelho `TestVigiaNaturalLanguage` - **pre-existente** (Ollama offline) |
| Producao | **gravou** na aba `SET2026`, linha 28: `CIDADE = RECIFE . BAIRRO = SANCHO . AIS = 4`, `DETIDOS = TCO` |
| Deploy | **81/81 arquivos remotos byte-iguais ao HEAD** |

Correcao minima aplicada: a extracao de endereco saiu de dentro de `parseAndFill` e virou
`extrairEnderecoOcr_(text)` em `Entrada/Formulario.html` (testavel sem DOM); nova regra le o layout SEI
**do fim para o comeco** (`...; BAIRRO;CIDADE;UF; PAIS`), tolerando `NAO INFORMADO`/CEP no meio.

## Limite
- O card corrige a **extracao**, nao a **decisao de produto**: se o AIS deve ser automatico ou apenas
  sugerido (P2) continua **pendente de deliberacao**. A soberania do operador nao muda - o AIS segue
  editavel e o alerta de conferencia continua existindo quando a base nao resolve.
- A prova de producao e a **declaracao do card/proprietario** (aba `SET2026` linha 28); nao e verificavel
  offline por este repositorio (o dado vive na planilha).
- `NÃO INFORMADO` permanece sem valor por decisao explicita: **nada e chutado**.
- A suite integral citada e o numero **registrado no card**; a suite evoluiu depois (`620 PASS` em `b74f9d0`).
