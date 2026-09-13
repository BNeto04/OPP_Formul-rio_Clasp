# MOD-C08-01_HOMOLOGACAO_OFFLINE

- **ID:** MOD-C08-01
- **Endereco Down Plant:** `C08_Homologacao / MOD-C08-01_HOMOLOGACAO_OFFLINE` (escala: modulo) . circuito `CIR-MOD-C08-01_HOMOLOGACAO_OFFLINE.canvas`
- **Estado (§19):** Codigo 🟢 . Teste 🟢 (**71** arquivos `Testes/Test*.js`) . Contrato 🟢 . Integracao 🟢 . Visual 🟡 (homologacao visual e manual) . Publicacao 🟢 (81/81 nos cards #140/#141/#144) . Documentacao 🟢 *(esta capsula; evidencia EV-C08-001)*
- **Perfil:** P1 (operacao recorrente)
- **Responsavel:** Proprietario (Manoel) - execucao por agentes sob card

## Responsabilidade
Ser a **bancada de prova** do produto: rodar a suite automatizada, comparar V1 x V2 sobre uma aba real e expor
**portas headless** executaveis sem clique - para que cada correcao tenha prova binaria antes do commit.

## Limites
- **Nao altera o produto:** o ambiente de homologacao isola drivers (`JsonDriver`, `HomologationSheetsDriver`) e
  roda sobre **copia descartavel**, nunca sobre a planilha oficial.
- **Nao valida o produto inteiro:** cada suite cobre o seu recorte; a suite integral nao e uma medicao unica
  canonica (ver Divergencias).
- **Nao substitui a conferencia do operador:** a prova de produto real e do proprietario.

## Entradas
Fatos/fixtures (`Testes/Fixtures/*`) . abas reais quando a prova exige (via porta headless) . alteracoes de
produto dos cards.

## Saidas
Status por suite e consolidado da execucao . abas de apoio da homologacao . **STRING JSON** das portas headless .

## Portas
| Porta | Direcao | Contrato (resumo) |
|---|---|---|
| CLI -> suite | execucao | `node Testes/RodarTodosOsTestes.js` |
| `clasp run` -> portas headless | execucao remota | retorno obrigatorio **STRING JSON** (`scripts.run`) |
| Portas de entrada | headless | `validarEntradaManualHeadless` (`Entrada/EntradaManualHeadless.js`) |
| Portas de auditoria | headless | `GuardiaoHeadless` (`Features/GuardiaoHeadless.js`) |
| Portas de produto | headless | `gerarComparativo2026Headless`, `executarCompiladorArmasHeadless` |
| Portas de prova | binarias | `verificarParticipacaoArmasHeadless`, `verificarQtdOcorrenciasHeadless`, `verificarPontuacaoHeadless`, `verificarDrogasHeadless`, `diagnosticarCaminhoArmasHeadless` |

## Conexoes
`C08 -> todos os comodos` (a bancada testa o produto) . `C08 -> C06` (relatorio de homologacao visual) .
`C08 -> Apps Script` (as portas headless rodam no runtime).

## Invariantes
1. **Teste antes do commit** - nenhuma correcao entra sem prova (RED -> GREEN registrado).
2. **Isolamento:** homologacao offline sobre copia descartavel; drivers de teste nao tocam a planilha oficial.
3. **Prova binaria:** as portas de verificacao devolvem `confere: true/false`, sem opiniao.
4. **Sem clique:** tudo que pode ser provado por porta headless **e** provado por porta headless.

## Regras (dominio x heuristica)
| Regra | Onde rege | Artefato |
|---|---|---|
| Metodo "teste -> Git -> CLASP -> remoto -> RESULT" | convencao de trabalho | cards #140-#152 |
| Regra Zero Push na homologacao offline | protocolo do comodo | `00_Visao_Do_Comodo/INDICE.md` (protocolo C06) |
| Retorno STRING JSON para `scripts.run` | limite do runtime | cabecalhos de `*Headless.js` |
| `02_Comodos/**` fora do `.claspignore`-alvo | infra | `.claspignore` |

## Tecnologia existente avaliada (§31.4)
Node.js para o runner local . Apps Script para as portas headless . `clasp run` para execucao remota .
**nenhuma** biblioteca externa de teste (runner caseiro).

## Artefatos
`Testes/RodarTodosOsTestes.js` . `Testes/Test*.js` (**71**) . `Testes/Fixtures/*` .
`Homologacao/RodarTesteDeHomologacao.js` . `Homologacao/Framework/Comparator.js` .
`Homologacao/Drivers/JsonDriver.js` . `Homologacao/Drivers/HomologationSheetsDriver.js` .
`Entrada/EntradaManualHeadless.js` . `Features/GuardiaoHeadless.js` . `Entrada/WebAppExecucao.js` .

## Dependencias (§31.6)
| Dependencia | Vinculo | Versao/estado |
|---|---|---|
| [DEP-001](../../../../../dependencias/DEP-001_GOOGLE_APPS_SCRIPT.md) | runtime das portas headless | ativo (V8) |
| [DEP-003](../../../../../dependencias/DEP-003_CLASP_DEPLOY.md) | `clasp run` / `clasp push` | ativo |
| Runtime Node.js | execucao local da suite | **versao nao pinada no repo** |

## Erros
Suite vermelha -> commit bloqueado . `TestVigiaNaturalLanguage` **pre-existente** vermelho (Ollama offline) desconsiderado
pelos cards . `Testes/TestNormalizadorEfetivo.js` **nunca versionado** (untracked, listado no #150) - nao entra na suite.

## Observabilidade
Saida consolidada do runner . `agentic/state/RESULT_*.md` (14 arquivos de resultado versionados) .
`[HISTORICO]` do Guardiao para execucoes de auditoria.

## Testes (fechaduras)
| Card | Antes (RED) | Depois (GREEN) |
|---|---|---|
| #140 - AIS SEI | 3/6 | **6/6** |
| #141 - ARMA x QDT ARMAS | 3/6 | **6/6** |
| #144 - entorpecentes | 4/6 | **6/6** |
| #144 - conversoes | - | **6/6** |
| Guardas ARCA | - | 9/9, 11/11, 7/7 |
| Suite integral | - | **423 PASS** (#140/#144) . **411 PASS** (#141) . **620 PASS** (`b74f9d0`) |

## Evidencias
- [EV-C08-001](../../../05_Evidencias/EV-C08-001_SUITES_E_PORTAS_HEADLESS.md) (#140, #141, #142, #144, #152).
- Commits: `62635ca`, `966bba0`, `5ac6670`, `61e4415`, `0c489ad`, `ab2e1b6`, `7a42ac3`, `eab6fa4`,
  `fe4ec03`, `89c8a17`, `486e324`, `71f1d61`, `a1de4bf`, `b74f9d0`.

## Divergencias conhecidas
- **Numeros de suite divergentes** (411 / 423 / 620 PASS): a suite **cresceu** entre as medicoes; nao ha uma
  medicao unica canonica no repositorio.
- **`.claspignore` nao cobre `02_Comodos/**`?** Cobre - mas o protocolo de homologacao do C06 proibia **qualquer**
  push enquanto os cards #140/#141/#144 registraram `clasp push` com verificacao remota 81/81. Os dois registros
  **convivem** e a diferenca (protocolo de homologacao offline x deploy de correcao aprovada) **nao esta explicada
  em um unico lugar** - declarada como divergencia de leitura.
- **1 teste nunca versionado:** `Testes/TestNormalizadorEfetivo.js`.
- `TestVigiaNaturalLanguage` permanece **vermelho por dependencia externa** (Ollama offline).
- O espelho Obsidian usa outra taxonomia (`SUB-C08-01_BANCADA_DE_TESTES`) - divergencia no **#154**.

## Critérios de verde
Suite integral verde (fora o vermelho pre-existente) . provas binarias `confere: true` . nenhuma correcao sem
teste RED->GREEN . isolamento respeitado . capsula e evidencia presentes.
