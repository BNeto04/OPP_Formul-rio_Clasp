---
card: "140"
cards_relacionados: ["141", "142", "144", "152"]
comodo: C08_Homologacao
modulos: [MOD-C08-01_HOMOLOGACAO_OFFLINE]
tipo: evidencia
formato: "46.5 - commit . ambiente . entrada . resultado . limite"
data: "2026-09-13"
---

# EVD-C08-001 - Suites de teste e portas headless dos cards recentes

**Entrega:** instrumentacao de prova que sustenta #140, #141, #142, #144 e #152 -
testes automatizados e portas headless executaveis sem clique (inclusive do celular).

## Commit
| Hash | Mensagem | Artefato de prova |
|---|---|---|
| `62635ca` | `fix(ocr): AIS em endereco SEI/CIODS segmentado por ';' (#140)` | `Testes/TestFormularioAisSei.js` |
| `966bba0` | `fix(test): injeta os helpers de OCR (#140/#144) no sandbox` | `Testes/TestFormularioCidadeBairro.js` |
| `5ac6670` | `fix(ocr): multiplas entradas de entorpecente e DETIDOS explicito (#144)` | `Testes/TestOcrEntorpecentesDetidos.js` |
| `61e4415` | `feat(dominio): conversao canonica das formas de apreensao de drogas (#144)` | `Testes/TestConversaoDrogas.js` |
| `0c489ad` | `fix(dominio): semantica canonica ARMA x QDT ARMAS (#141)` | `Testes/TestSemanticaArmasQdt.js` |
| `ab2e1b6` | `feat(armas): porta headless executarCompiladorArmasHeadless (#152)` | porta headless |
| `7a42ac3` | `feat(comparativo): porta headless gerarComparativo2026Headless (#152)` | porta headless |
| `eab6fa4` | `chore(diag): bisturi do caminho da participacao de arma no comparativo (#152)` | `diagnosticarCaminhoArmasHeadless` |
| `fe4ec03`, `89c8a17`, `486e324`, `71f1d61` | portas de prova das 4 partes (#152) | `verificar*Headless` |
| `b74f9d0` | `fix(suite): suite global 100% verde (620 PASS) - gate 9 do #117` | runner integral |
| `a1de4bf` | `feat(infra): endpoint HTTP de execucao headless (web app + token em Script Properties)` | `Entrada/WebAppExecucao.js` |

## Ambiente
| Item | Valor |
|---|---|
| Runner | `node Testes/RodarTodosOsTestes.js` (Node.js no host; `v24.14.0` no momento deste registro) |
| Arquivos de teste | **71** arquivos `Testes/Test*.js` no momento do registro |
| Portas headless | `Entrada/EntradaManualHeadless.js`, `Features/GuardiaoHeadless.js`, `gerarComparativo2026Headless`, `executarCompiladorArmasHeadless` |
| Chamada remota | `clasp run <funcao> -p '...'` - retorno **STRING JSON** (exigencia do `scripts.run`) |
| Deploy | `clasp push` + verificacao remota (**81/81** nos cards #140/#141/#144) |

## Entrada
Alteracoes de produto dos cards #140/#141/#144/#152 (OCR, dominio de armas, drogas, comparativo) exigindo
prova automatizada antes do commit - metodo "teste -> Git -> CLASP -> remoto -> RESULT".

## Resultado
| Card | Suite antes (RED) | Suite depois (GREEN) |
|---|---|---|
| #140 - AIS SEI | 3 PASS / 3 FAIL | **6 PASS / 0 FAIL** |
| #141 - ARMA x QDT ARMAS | 3 PASS / 3 FAIL | **6 PASS / 0 FAIL** |
| #144 - entorpecentes | 4 PASS / 2 FAIL | **6 PASS / 0 FAIL** |
| #144 - conversoes | - | **6/6** |
| Guardas ARCA (#125/#126) | - | `TestArcaConsumidores` 9/9 . `TestArcaMapaCobertura` 11/11 . `TestIntegracaoArca` 7/7 |
| Suite integral | - | **423 PASS** (#140 e #144) . **411 PASS** (#141) . **620 PASS** (`b74f9d0`) |

Instrumentos **permanentes** (nao conserto manual): `gerarComparativo2026Headless`,
`executarCompiladorArmasHeadless`, `diagnosticarCaminhoArmasHeadless(matricula)` (mede os 5 elos),
`verificarParticipacaoArmasHeadless`, `verificarQtdOcorrenciasHeadless`, `verificarPontuacaoHeadless`,
`verificarDrogasHeadless` - todas as `verificar*` devolvem `confere: true/false` (**prova binaria**).

## Limite
- **O numero da suite integral varia por card** (411 / 423 / 620 PASS) porque a suite **cresceu** entre as
  medicoes. Cada numero vale para o seu momento; **nao** ha uma medicao unica canonica neste repositorio.
- Ha **um vermelho pre-existente e nao relacionado**: `TestVigiaNaturalLanguage` (Ollama offline). Os cards
  registram "0 FAIL" desconsiderando esse teste.
- Ha **1 arquivo de teste nunca versionado**: `Testes/TestNormalizadorEfetivo.js` (untracked, listado no
  #150). Ele **nao** entra na suite versionada.
- As portas `verificar*` provam **uma matricula** (1133306). A consistencia global e mostrada por totais
  agregados (298 tuneis no ano), nao por varredura de todos os policiais.
- **Nao ha, neste repo, prova de paridade byte-a-byte das portas headless** com o remoto: a medicao
  registrada e de **arquivos** (81/81), nao de comportamento.
