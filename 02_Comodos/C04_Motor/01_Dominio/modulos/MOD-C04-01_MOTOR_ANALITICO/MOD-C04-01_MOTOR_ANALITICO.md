# MOD-C04-01_MOTOR_ANALITICO

- **ID:** MOD-C04-01
- **Endereco Down Plant:** `C04_Motor / MOD-C04-01_MOTOR_ANALITICO` (escala: modulo) . circuito `CIR-MOD-C04-01_MOTOR_ANALITICO.canvas`
- **Estado (§19):** Codigo 🟢 . Teste 🟢 (`TestMotorAnaliticoRegressao`, `TestMeritoEquipeArmas`, `TestCentralAnalitica`) . Contrato 🟢 . Integracao 🟢 . Visual - . Publicacao 🟢 (81/81) . Documentacao 🟢 *(esta capsula; evidencia EVD-C04-001)*
- **Perfil:** P1 (operacao recorrente)
- **Responsavel:** Proprietario (Manoel) - execucao por agentes sob card

## Responsabilidade
Consolidar os fatos canonicos em **Registro Analitico** e calcular o **merito por armas**. Depois da
refatoracao, o Motor e um **orquestrador de plugins**: recebe fatos, dispara o ciclo de vida
(`inicializar -> processar -> finalizar`) e consolida o resultado.

## Limites
- **Nao le planilha** e **nao grava**: consome fatos e devolve registros.
- **Nao reimplementa regra de dominio:** as tabelas/limiares vivem na ARCA e em `Core/Constantes.js`.
- **Nao usa `QDT ARMAS` como arma fisica.** `ARMA` e a **fonte exclusiva** de arma de fogo fisica; o
  reconhecimento de artesanal vem de indicadores textuais (`TIPO`/`MODELO`/`ARMA`), nunca de `QDT ARMAS`.
- **Nao infere lideranca por outro criterio:** o merito vai ao militar de **menor `N`** (mais antigo).

## Entradas
`RegistroCanonico` (fatos) . `mapaAntiguidade` (matricula -> `N`) . ocorrencias agrupadas pelo tunel.

## Saidas
`RegistroAnalitico` **preservando todos os campos do fato** - inclusive `participacaoArmas` (elo final
corrigido no `824b545`) . registros de merito por tunel (status + atribuicao).

## Portas
| Porta | Direcao | Contrato (resumo) |
|---|---|---|
| Leitura -> Motor | fatos | `RegistroCanonico` / `ocorrenciasNormalizadas`, sem mutacao posterior |
| Motor -> plugins | ciclo de vida | `registrarPlugin` + `inicializar/processar/finalizar` |
| Motor -> RegistroAnalitico | consolidacao | **nenhum campo do fato pode ser descartado** na reconstrucao (`Dominio/RegistroAnalitico.js`) |
| Diagnostico -> Motor | via pura | `DiagnosticoDeterministicoGxt` invoca `Adaptador2026.extrairFatos()` **realmente**, sem fallback para `QDT ARMAS` |

## Conexoes
`C02/Leitura -> C04` (fatos) . `C04 -> C05/Guardiao` (merito e integridade) . `C04 -> C06/Relatorios`
(consumo pelo comparativo e pelos compiladores) . `C04 -> C03/ARCA` (regra de dominio).

## Invariantes
1. **`ARMA` fisica e a unica fonte de arma de fogo** no calculo de merito; `QDT ARMAS` nao entra.
2. **Artesanal** vem de indicador textual, nunca de quantidade replicada.
3. **Lider = menor `N`** (mais antigo) entre os participantes do tunel.
4. **Agrupamento por tunel**, nao por linha: uma arma em 3 linhas nao vira 3 armas.
5. **Nenhum campo do fato e descartado** na consolidacao (o `participacaoArmas` era o elo quebrado).

## Regras (dominio x heuristica)
| Regra | Onde rege | Artefato |
|---|---|---|
| Merito por armas: 1 arma fisica = 1, agrupada por tunel | dominio | `Motor/PoliticaMeritoArmas.js` |
| `QDT ARMAS` fora do calculo | dominio (ARCA-ARMAS-001) | idem + `Core/Constantes.js` |
| Lideranca por menor `N` | dominio | idem + `Leitura/LeitorAntiguidadePeculio.js` |
| Dedupe dentro do tunel | heuristica medida | `Core/LeitorPlanilhas.js:290` |

## Tecnologia existente avaliada (§31.4)
JavaScript puro sobre Apps Script V8 . plugins em `Plugins/Metricas/*` . **nenhuma** biblioteca externa.

## Artefatos
`Motor/MotorAnaliticoV2.js` . `Motor/PoliticaMeritoArmas.js` . `Motor/DiagnosticoDeterministicoGxt.js` .
`Plugins/Metricas/PluginArmas.js`, `PluginEntorpecentes.js`, `PluginOcorrencias.js`, `PluginPontuacao.js`,
`PluginPrisoes.js` . `Dominio/RegistroAnalitico.js` . `Features/CentralAnalitica.js`.

## Dependencias (§31.6)
| Dependencia | Vinculo | Versao/estado |
|---|---|---|
| [DEP-001](../../../../../dependencias/DEP-001_GOOGLE_APPS_SCRIPT.md) | runtime (V8) | ativo |
| [DEP-004](../../../../../dependencias/DEP-004_ABAS_E_BASES_CANONICAS.md) | `EFETIVO`/PECULIO para a antiguidade | ativo |

## Erros
Merito por armas **nao avaliado** quando a fonte de antiguidade esta indisponivel (`Core/CoberturaAuditoria.js`)
. alerta de cadastro de `N` ausente (`Core/RegrasQualidade.js`) . diagnostico explicito quando o adaptador
retorna vazio.

## Observabilidade
`TestCentralAnalitica` e as provas headless do #152 (`verificar*Headless`, com `confere: true/false`) .
relatorio de homologacao (`Homologacao/RodarTesteDeHomologacao.js`).

## Testes (fechaduras)
`Testes/TestMotorAnaliticoRegressao.js` . `Testes/TestMeritoEquipeArmas.js` . `Testes/TestCentralAnalitica.js` .
Prova de produto do #152: PONTUACAO (CPM) `36.385,33 = 36.385,33` e QTD.O `8 = 8` para a matricula 1133306.

## Evidencias
- [EVD-C04-001](../../../05_Evidencias/EVD-C04-001_MOTOR_E_MERITO_ARMAS.md) (#141, #152).
- Commit de auditoria: `0c489ad` (#141) - o inventario registra `Motor/PoliticaMeritoArmas.js` como **correto**.
- **O `Motor` NAO foi alterado** por nenhum commit dos cards #140/#141/#142/#144/#152/#150.

## Divergencias conhecidas
- **Ordem de entrega de armas:** o codigo ordenava **somente por score**; a regra ditada pelo proprietario exige
  desempate por **ANTIGUIDADE** na entrega de armas (R10, `64daaed`). Divergencia registrada e **nao** corrigida
  neste modulo.
- **Compilador de Armas embutia 9 regras de dominio (R1-R9)** das quais a ARCA era cega (`4b7b58d`) - a
  inferencia foi registrada em `Dominio/ARCA/REGRAS_ARMAS_INFERIDAS.md`, **nao** promovida automaticamente a regra.
- `DiagnosticoDeterministicoGxt` tem historico de **fallback removido** (bloco residual eliminado em `1f91661`);
  o estado atual proibe fallback de `QDT ARMAS`, mas isso e declaracao de cabecalho - **nao remedido** no #153.

## Critérios de verde
Nenhum campo do fato descartado na consolidacao . `ARMA` fisica como unica fonte . lideranca por menor `N` .
suite verde . produto conferido contra a fonte . capsula e evidencia presentes.
