# MOD-C02-01_LEITURA_E_ADAPTACAO

- **ID:** MOD-C02-01
- **Endereco Down Plant:** `C02_Leitura / MOD-C02-01_LEITURA_E_ADAPTACAO` (escala: modulo) . circuito `CIR-MOD-C02-01_LEITURA_E_ADAPTACAO.canvas`
- **Estado (§19):** Codigo 🟢 . Teste 🟢 (`TestAdaptador2026`, `TestLeitorAntiguidadePeculio`, `TestMotorAnaliticoRegressao`) . Contrato 🟢 . Integracao 🟢 . Visual - . Publicacao 🟢 (81/81) . Documentacao 🟢 *(esta capsula; evidencia EV-C02-001)*
- **Perfil:** P1 (operacao recorrente)
- **Responsavel:** Proprietario (Manoel) - execucao por agentes sob card

## Responsabilidade
**Ler** as planilhas e **traduzir** linhas fisicas em fatos canonicos (`RegistroCanonico`), alem de resolver a
antiguidade a partir do peculio. E o unico ponto do sistema que conhece o **layout fisico** das abas.

## Limites
- **Nao agrega dados.** O cabecalho do adaptador declara a "Regra de Ouro #4": ele **apenas traduz** linhas
  fisicas em fatos; somar/consolidar e do Motor (C04).
- **Nao grava** em planilha: leitura somente.
- **Nao inventa posicao de coluna:** quando o cabecalho nao e reconhecido, falha explicitamente
  (`FALHA_ADAPTADOR_SEM_FATOS`) em vez de chutar indice.
- **Nao usa fallback para `QDT ARMAS`**: a separacao arma fisica x participacao e obrigatoria.

## Entradas
Abas mensais `JAN2026..DEZ2026` (tunel `DATA | MIKE | BOE`) . `EFETIVO` (chave `POLICIAL`) . peculio externo
(antiguidade `N`) . cabecalhos fisicos.

## Saidas
`RegistroCanonico` (fatos por policial: ocorrencia, armas, drogas, participacao, pontuacao) e
`mapaAntiguidade` (`matricula -> N`) consumidos pelo Motor analitico.

## Portas
| Porta | Direcao | Contrato (resumo) |
|---|---|---|
| Planilha -> Leitura | leitura | `valueRenderOption=FORMULA` **e** `FORMATTED_VALUE` (metodo do #142) |
| Leitura -> C03/C04 | fatos | `extrairFatos()` -> `RegistroCanonico`; sem agregacao, sem mutacao posterior |
| Cabecalho -> Leitura | resolucao | aliases em `Core/Cabecalhos.js` + `Core/Constantes.js`; sem match => erro explicito |
| Leitura -> participacao | acumulo | `Core/LeitorPlanilhas.js` acumula `participacaoArmas` no policial; a linha-filha **herda a DATA da mestra** do tunel (#152) |

## Conexoes
`C02 -> C04/Motor` (fatos) . `C02 -> C03/Dominio` (chave do tunel, `RegistroCanonico`) .
`C02 -> C05/Guardiao` (o Guardiao le pela mesma via) . `C02 -> EFETIVO/PECULIO` (transversal).

## Invariantes
1. **Regra de Ouro #4:** o adaptador nao agrega - so traduz.
2. **Sem fallback de `QDT ARMAS`** no caminho de fatos.
3. **Linha-filha herda a DATA da linha mestra do tunel** (recuperou 2 ocorrencias descartadas no #152:
   296 -> 298).
4. **Cabecalho desconhecido = falha explicita**, nunca indice suposto.

## Regras (dominio x heuristica)
| Regra | Onde rege | Artefato |
|---|---|---|
| Chave do tunel (`DATA` + `MIKE` + `BOE`), bloco contiguo, fronteira por linha em branco | formula + leitor | `MAPA_DO_TUNEL_E_FORMULAS.md` (#142) |
| `POLICIAL` e a chave do `EFETIVO` (`VLOOKUP`) | formula da aba | idem |
| `ARMA` = arma fisica da linha; `QDT ARMAS` = participacao | dominio (ARCA-ARMAS-001) | `Core/Constantes.js` |
| Dedupe **dentro** do mesmo tunel (nao somar o mesmo policial duas vezes) | heuristica medida | `Core/LeitorPlanilhas.js:290` (`Math.max` - **nao e defeito**) |

## Tecnologia existente avaliada (§31.4)
Apps Script `SpreadsheetApp` via `Drivers/GoogleSheetsDriver.js` . Node.js nos testes .
**nenhuma** biblioteca externa (manifesto com `"dependencies": {}`).

## Artefatos
`Leitura/Adaptador2026.js` . `Leitura/LeitorAntiguidadePeculio.js` . `Core/LeitorPlanilhas.js` .
`Core/Cabecalhos.js` . `Drivers/GoogleSheetsDriver.js` . `Core/Metricas.js` (acumulo de participacao).

## Dependencias (§31.6)
| Dependencia | Vinculo | Versao/estado |
|---|---|---|
| [DEP-002](../../../../../dependencias/DEP-002_GOOGLE_SHEETS.md) | fonte dos dados | ativo |
| [DEP-004](../../../../../dependencias/DEP-004_ABAS_E_BASES_CANONICAS.md) | `EFETIVO` e peculio | ativo |
| [DEP-001](../../../../../dependencias/DEP-001_GOOGLE_APPS_SCRIPT.md) | runtime | ativo (V8) |

## Erros
`FALHA_ADAPTADOR_SEM_FATOS` (cabecalho/aba nao reconhecidos - sem fallback) . erros explicitos de selecao da
aba de peculio (marcadores de identidade obrigatorios) . merito nao avaliado quando `EFETIVO`/PECULIO esta
indisponivel (`Core/CoberturaAuditoria.js`).

## Observabilidade
Log do Apps Script . retorno das funcoes de diagnostico (`lerAbas` com logger injetado, #152) .
`MAPA_DO_TUNEL_E_FORMULAS.md` documenta os consumidores por coluna.

## Testes (fechaduras)
`Testes/TestAdaptador2026.js` . `Testes/TestLeitorAntiguidadePeculio.js` . `Testes/TestMotorAnaliticoRegressao.js` .
Provas de leitura do #152: `verificarParticipacaoArmasHeadless` / `verificarQtdOcorrenciasHeadless`
(FERNANDES 1133306: fonte 8 = produto 8; ano 298 tuneis).

## Evidencias
- [EV-C02-001](../../../05_Evidencias/EV-C02-001_LEITURA_TUNEL_E_FORMULAS.md) (#142, #152).
- Commits: `8f9bec8` (mapa do tunel), `a0045be` (heranca da DATA), `7e15433` (acumulo de participacao),
  `d52de16` (bisturi com logger).

## Divergencias conhecidas
- **R1 (ranges de formula inconsistentes), R3 (quantidade na primeira linha do MIKE) e R5 (tunel fragmentado)
  permanecem nao corrigidos** - classificados no #142 e sem evidencia suficiente para correcao.
- **3 celulas** com ocorrencias divididas em MIKEs diferentes: decisao de dominio **pendente** (#150).
- O espelho Obsidian usa **outra taxonomia** para este modulo (`SUB-C02-01-01_LEITURA_DE_PLANILHAS`,
  `SUB-C02-01-02_LEITOR_PECULIO`, `SUB-C02-01-03_ADAPTADOR_2026`) - divergencia tratada no **#154**.

## Critérios de verde
Leitura sem fallback silencioso . fatos canonicos identicos a fonte . suite verde . nenhuma agregacao no
adaptador . capsula e evidencia presentes.
