# MOD-C00-03_INFRAESTRUTURA_CORE

- **ID:** MOD-C00-03
- **Endereco Down Plant:** `C00_Governanca_Estrutural / MOD-C00-03_INFRAESTRUTURA_CORE` (escala: modulo)
- **Estado (§19):** Codigo 🟢 (utilitarios de `Core/` endereçados) . Teste 🟢 (suite integral) . Contrato 🟡 . Integracao 🟡 . Visual - . Publicacao 🟢 (manifesto de ambiente) . Documentacao 🟢 *(esta capsula)*
- **Perfil:** P1 (operacao recorrente; sem dados sensiveis)
- **Responsavel:** Proprietario (Manoel) - execucao por agentes sob card

## Responsabilidade
Enderecar a **infraestrutura transversal de runtime** do produto: utilitarios deterministicos de data, classes
de erro padronizadas, logger operacional e o **manifesto de ambiente** do projeto Google Apps Script. E a casa
canonica dos recursos de `Core/` que **nao pertencem a nenhum modulo de negocio** (GAP declarado no #158).
Nao executa regra de negocio: prove infraestrutura.

## Limites
- **Nao** decide regra de dominio: constantes, tabelas e limiares vivem na ARCA e nos modulos consumidores.
- **Nao** re-declara os utilitarios de `Core/` que **ja possuem endereco canonico proprio** em outros modulos
  (identificadores de configuracao, constantes e utils). Re-declara-los aqui moveria um endereco primario **ja
  fixado** — ver `MAPA_ARTEFATO_ENDERECO_162.md`.
- **Nao** publica o cofre: a fronteira de publicacao e do `MOD-C00-01_ESTRUTURA_DO_COFRE` (`.claspignore`).
- **Nao** altera codigo de produto: o modulo endereca; quem prova o verbatim e o espelho (§46.15).

## Entradas
Decisoes de card . o codigo real em `Core/` . o manifesto de ambiente do projeto.

## Saidas
Endereco canonico declarado em `## Artefatos` para os recursos de infraestrutura orfaos . o manifesto de
ambiente permanece como esta.

## Portas
| Porta | Direcao | Contrato (resumo) |
|---|---|---|
| `Core/Datas.js` -> consumidores | utilitario puro | conversao robusta e formatacao de data brasileira (dd/mm/aaaa) |
| `Core/Erros.js` -> consumidores | utilitario puro | classes de erro nomeadas por origem (`ErroValidacaoDominio`, `ErroLeituraAba`, `ErroConfiguracaoInvalida`) |
| `Core/Logger.js` -> Render/Auditoria | objeto de estado | estatisticas e avisos do fluxo de leitura (`logAba`, `aviso`, `gravarPlanilha`) |
| `appsscript.json` -> runtime | manifesto | V8, fuso `America/Sao_Paulo`, `exceptionLogging STACKDRIVER`, `executionApi MYSELF` |

## Conexoes
`C00 -> todos os comodos` (infraestrutura transversal) . `C00 -> C02_Leitura / C06_Relatorios` (consumidores dos
utilitarios) . `C00 -> dependencias/` (DEP-001, Google Apps Script).

## Invariantes
1. **Um endereco por artefato:** os itens de `## Artefatos` nao se repetem em outro endereco da Planta.
2. **Infraestrutura e transversal:** nenhum acesso a planilha, nenhuma regra de negocio propria.
3. **Somente leitura sobre o produto:** o modulo endereca e documenta; nao altera o codigo de runtime.
4. **Data invalida nao lanca:** `Core/Datas.js` devolve `null` — determinismo declarado.

## Regras (dominio x heuristica)
| Regra | Onde rege | Artefato |
|---|---|---|
| Data brasileira deterministica (evita inversao dia/mes) | utilitario | `Core/Datas.js` |
| Erro nomeado e tipado por origem | utilitario | `Core/Erros.js` |
| Log e avisos centralizados no fluxo | utilitario | `Core/Logger.js` |
| Ambiente do produto definido no manifesto | plataforma | `appsscript.json` |

## Tecnologia existente avaliada (§31.4)
JavaScript puro sobre Apps Script V8 . JSON de manifesto . **nenhuma** biblioteca externa e **nenhuma** ferramenta
nova introduzida por este modulo.

## Artefatos
`Core/Datas.js` . `Core/Erros.js` . `Core/Logger.js` . `appsscript.json` (manifesto de ambiente do projeto).

## Dependencias (§31.6)
| Dependencia | Vinculo | Versao/estado |
|---|---|---|
| [DEP-001](../../../../../dependencias/DEP-001_GOOGLE_APPS_SCRIPT.md) | runtime (V8) e manifesto do projeto | ativo |

## Erros
Data invalida -> `null` (nunca excecao) . aviso de leitura roteado ao render de auditoria . classe de erro
propria por origem. O manifesto invalido impede a publicacao (`.clasp`).

## Observabilidade
Acumuladores do logger (abas lidas, linhas validas/ignoradas, duplicidades) . suite integral do repositorio
(`node Testes/RodarTodosOsTestes.js`) . verificador §46.15 dos 4 artefatos deste endereco.

## Testes (fechaduras)
- Suite integral: `node Testes/RodarTodosOsTestes.js` (exit 0).
- Verificador de espelho: `node scripts/downplant/espelho-rico.mjs verificar --espelho <caminho>` (exit 0 nos 4).
- Lint estrutural: `node scripts/downplant/lint-estrutura.mjs` (exit 0).

## Evidencias
- [EVD-C00-001](../../../05_Evidencias/EVD-C00-001_ESTRUTURA_E_VALIDACAO.md) - estrutura e lint do cofre.
- Card **#162** (DP24-001) - resolucao dos 7 enderecos canonicos orfaos; mapa `MAPA_ARTEFATO_ENDERECO_162.md`
  e relatorio `RELATORIO_162_ENDERECOS.md` (raiz do repositorio, fora da varredura de conteudo).
- Conteudo parado do #158 (`MOD-C00-01_INFRAESTRUTURA_CORE`, arquivado no espelho por colisao de ID com a
  estrutura do cofre): materializado aqui com ID canonico novo.

## Divergencias conhecidas
- O elemento parado do #158 usava o ID `MOD-C00-01` (colide com `MOD-C00-01_ESTRUTURA_DO_COFRE`, assunto
  diferente) e o mesmo nome `INFRAESTRUTURA_CORE`; aqui o ID canonico e o **proximo livre do comodo**
  (`MOD-C00-03`), derivado da sequencia existente (`01`, `02`). Nada foi renomeado no elemento parado.
- O ID `MOD-C00-03` foi usado no espelho, **sem lastro no repositorio**, pelo elemento parado
  `MOD-C00-03_CURADOR_OBSIDIAN` (arquivado no #158). Nao existe no repo; a colisao e apenas nominal.
- `Core/Logger.js` chama o render de auditoria de **outro comodo** (`Render/`): dependencia real do codigo,
  registrada aqui, **nao** resolvida por este modulo.

## Criterios de verde
Os 4 artefatos com endereco resolvido e evidenciado . espelho §46.15 verde (exit 0) nos 4 . lint exit 0 .
suite exit 0 . nenhum codigo de produto alterado . nenhum dos demais espelhos tocado.
