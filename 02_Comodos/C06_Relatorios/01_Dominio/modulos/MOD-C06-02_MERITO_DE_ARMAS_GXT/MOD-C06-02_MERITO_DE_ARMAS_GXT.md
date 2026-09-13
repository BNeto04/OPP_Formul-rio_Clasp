# MOD-C06-02_MERITO_DE_ARMAS_GXT

- **ID:** MOD-C06-02
- **Endereco Down Plant:** `C06_Relatorios / MOD-C06-02_MERITO_DE_ARMAS_GXT` (escala: modulo) . circuito `CIR-MOD-C06-02_MERITO_DE_ARMAS_GXT.canvas`
- **Estado (§19):** Codigo 🟢 . Teste 🟢 (`TestRelatorioArmas`, `TestMeritoEquipeArmas`) . Contrato 🟢 . Integracao 🟢 . Visual 🟢 . Publicacao 🟢 (81/81) . Documentacao 🟢 *(esta capsula; evidencia EVD-C06-001)*
- **Perfil:** P1 (operacao recorrente)
- **Responsavel:** Proprietario (Manoel) - execucao por agentes sob card

## Responsabilidade
Gerar as **listas de apreensao de armas** por `P3 -> Armas -> Selecao Livre` e `Armas -> Anual` - o rateio de
produtividade de armas por PEL/GTAR a partir das armas fisicas do tunel, com a cor de cada faixa.

## Limites
- **Nao inventa arma:** a fonte e `ARMA` (fisica, uma por linha); `QDT ARMAS` e participacao e **nao** entra no
  calculo (o proprio compilador lia a coluna errada - defeito real corrigido em `1b2c0ae`).
- **Nao decide a regra sozinho:** as regras embutidas foram **inferidas e registradas** (`Dominio/ARCA/REGRAS_ARMAS_INFERIDAS.md`);
  o que o proprietario ditou (R2/R6/R10) foi implementado no `be68de8`.
- **Nao altera relatorios consagrados** ao gerar as listas.

## Entradas
Ocorrencias com arma fisica por tunel . indicadores textuais (`TIPO`/`MODELO`/`ARMA`) para **artesanal** .
antiguidade (`N`/matricula) para desempate . tabela canonica de cores.

## Saidas
Lista de armas por periodo (Selecao Livre e Anual) . faixas de cor com **quantos e quem** esta em cada faixa
(`0a8c5b3`) . legenda ao fim da tabela, com a fonte unica de cores.

## Portas
| Porta | Direcao | Contrato (resumo) |
|---|---|---|
| Menu `Armas` -> Selecao Livre | UI | `abrirMenuSelecaoLivre` (`Compilador_Armas.js`) + `Entrada/DialogGxtSelecaoLivre.html` |
| Menu `Armas` -> Anual | UI | `iniciarModoAnual` |
| `clasp run` -> compilador | **headless** | `executarCompiladorArmasHeadless` |
| Compilador -> legenda | padrao visual | `Core/LegendaCores.js` (fonte unica) |
| Compilador -> ARCA | consulta | regras R1-R9 inferidas + R10 ditada pelo proprietario |

## Conexoes
`C06-02 -> C04/Motor` (`PoliticaMeritoArmas`) . `C06-02 -> C03/ARCA` (regra de armas) .
`C06-02 -> C06-01` (mesma origem) . `C06-02 -> EFETIVO/PECULIO` (antiguidade).

## Invariantes
1. **`ARMA` fisica e a fonte exclusiva** de arma de fogo; artesanal vem de indicador textual.
2. **Cada tunel gera um unico registro**; sem duplicidade entre tuneis.
3. **Ordem de entrega: participacoes (score desc) e, no empate, ANTIGUIDADE** (R10).
4. **`3o PEL` existe** (`#FFFFFF`) e e o fallback; `GTAR` e resolvido por **nome exato** (nao substring) e os
   **OFICIAIS** tem soberania sobre a cor do pelotao.
5. **Legenda = fonte unica** (`Core/LegendaCores.js`) - nenhum compilador repete a tabela.

## Regras (dominio x heuristica)
| Regra | Onde rege | Artefato |
|---|---|---|
| R1-R9 (pelotao/GTAR/oficiais, faixas, computo, score, ordenacao, nomenclatura, esquema, linha mestra) | inferidas do codigo e registradas | `Dominio/ARCA/REGRAS_ARMAS_INFERIDAS.md` |
| R10: desempate por ANTIGUIDADE + soberania dos OFICIAIS | **ditada pelo proprietario** | `be68de8` / `64daaed` |
| 1 arma artesanal = 1 | dominio | `PoliticaMeritoArmas` |
| Faixas de armas: `0` vermelho, `10+` verde escuro negrito | convencao visual do produto | `Core/LegendaCores.js` / `Compilador_Armas.js` |

## Tecnologia existente avaliada (§31.4)
Apps Script V8 + `SpreadsheetApp` (menu `Armas`) . renderer + legenda compartilhada .
**nenhuma** biblioteca externa.

## Artefatos
`Compilador_Armas.js` (raiz) . `Core/LegendaCores.js` . `Render/RendererComparativo2026.js` .
`Motor/PoliticaMeritoArmas.js` . `Entrada/DialogGxtSelecaoLivre.html` . `Dominio/ARCA/REGRAS_ARMAS_INFERIDAS.md` .
`Testes/TestRelatorioArmas.js` . `Testes/TestMeritoEquipeArmas.js`.

## Dependencias (§31.6)
| Dependencia | Vinculo | Versao/estado |
|---|---|---|
| [DEP-001](../../../../../dependencias/DEP-001_GOOGLE_APPS_SCRIPT.md) | runtime e menu | ativo (V8) |
| [DEP-004](../../../../../dependencias/DEP-004_ABAS_E_BASES_CANONICAS.md) | `EFETIVO`/PECULIO (antiguidade) | ativo |
| `Render/RendererGxt.js` | tabela canonica de cores (fonte) | ativo |

## Erros
Leitura da coluna errada (`ARMAS` -> coluna 32) - **defeito real corrigido** no `1b2c0ae` .
Insercao indevida de linha em branco no `ABR2026` - revertida no `eaca285` (a deteccao por DATA falhou porque
as datas haviam sido preenchidas em toda linha na correcao anterior).

## Observabilidade
Menu `Armas` (Selecao Livre / Anual) . `executarCompiladorArmasHeadless` (sem clique) . legenda com QUANTOS e
QUEM por faixa de cor (leitura imediata do resultado).

## Testes (fechaduras)
`Testes/TestRelatorioArmas.js` (carrega `Compilador_Armas.js` sem alterar o arquivo) .
`Testes/TestMeritoEquipeArmas.js` (6 cenarios: tunel com varias linhas e uma arma, tres artesanais, artesanal,
tunel duplo, equipe de cinco, lider fora do GTAR) . `TestSemRedefinicaoGlobal` (menu).

## Evidencias
- [EVD-C06-001](../../../05_Evidencias/EVD-C06-001_COMPARATIVO_E_ARMAS.md) (#152).
- Commits nucleares: `ab2e1b6` (porta headless) . `be68de8` (R2/R6/R10) . `1b2c0ae` (defeito real) .
  `9195a18` (legenda fonte unica) . `4b7b58d` / `64daaed` / `efd12f9` (regras e divergencias).
- **Fechamento:** lista gerada e tema resolvido, confirmado pelo proprietario em 13/09/2026.

## Divergencias conhecidas
- **Ordenacao:** o codigo ordenava por score **sem** desempate de antiguidade - divergencia registrada (`64daaed`),
  **nao** corrigida.
- **3 divergencias de cor/grupo** registradas no `efd12f9` (3o PEL existe e e o fallback; `GTAR` por nome exato;
  soberania dos OFICIAIS).
- **A prova do produto real e da planilha**, nao do repositorio: a lista gerada nao esta versionada.
- O espelho Obsidian usa outra taxonomia (`SUB-C06-02_GERACAO_MERITO_GXT`) - divergencia no **#154**.

## Critérios de verde
Lista gerada nos dois modos . `ARMA` fisica como unica fonte . nenhuma duplicidade entre tuneis . legenda com
fonte unica . divergencias classificadas . suite verde . capsula e evidencia presentes.
