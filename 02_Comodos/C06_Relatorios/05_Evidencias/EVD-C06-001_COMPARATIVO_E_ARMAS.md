---
card: "152"
comodo: C06_Relatorios
modulos: [MOD-C06-01_RELATORIOS_OFICIAIS, MOD-C06-02_MERITO_DE_ARMAS_GXT]
tipo: evidencia
formato: "46.5 - commit . ambiente . entrada . resultado . limite"
data: "2026-09-13"
---

# EVD-C06-001 - Comparativo 2026: as 4 partes provadas + Compilador de Armas

**Entrega:** #152 (PROD-ARMAS-001, P0, `sprint:c01`) - gerar o **produto real** (listas de apreensao de
armas por `P3 -> Armas -> Selecao Livre` e `Armas -> Anual`) e provar cada valor publicado.

## Commit
| Hash | Mensagem | Foco |
|---|---|---|
| `ab2e1b6` | `feat(armas): porta headless executarCompiladorArmasHeadless + UI opcional no compilador (#152)` | porta de prova |
| `4b7b58d` | `docs(arca): inferencia das regras de dominio embutidas no Compilador de Armas (R1-R9)` | ARCA era cega a elas |
| `64daaed` | `docs(arca): ordem da entrega de armas = participacoes (score desc) e, no empate, ANTIGUIDADE` | divergencia registrada |
| `efd12f9` | `docs(arca): tabela canonica de cores achada em Render/RendererGxt.js - 3o PEL EXISTE (#FFFFFF)` | divergencias registradas |
| `be68de8` | `fix(armas): implementa R2/R6/R10 ditadas pelo proprietario no Compilador de Armas` | regra |
| `9195a18` | `feat(legenda): Core/LegendaCores.js - fonte unica da legenda de cores + ligada no Compilador de Armas` | fonte unica |
| `1b2c0ae` | `fix(armas): compilador lia ARMA FISICA em vez da PARTICIPACAO (QDT ARMAS) - defeito real do produto` | defeito real |
| `2263d87` | `fix(armas): cabecalho da coluna E passa a ser 'ARMAS'; legenda sem explicacao dos oficiais` | UI |
| `3d604a9` / `eaca285` | `inserirLinhasBrancasTuneisHeadless` / `removerLinhasBrancasHeadless` | reverter insercao indevida no ABR2026 |
| `7a42ac3` | `feat(comparativo): porta headless gerarComparativo2026Headless + UI opcional` | porta de prova |
| `824b545` | `fix(dominio): RegistroAnalitico preserva participacaoArmas - ULTIMO ELO do comparativo` | elo final |
| `a0045be`, `7e15433`, `a71a91b`, `eab6fa4`, `d52de16`, `fe4ec03`, `89c8a17`, `486e324`, `71f1d61` | leitura, diagnostico e provas das 4 partes | medida |
| `9f96dc0`, `0a8c5b3`, `98f5c8d` | legenda: faixa ZERO, QUANTOS/QUEM por faixa, rotulo dentro do quadrado | UI |
| `f085152` | `docs(plano): divisao do comparativo em 4 partes independentes` | metodo |
| `1e492ad`, `c25ee78`, `cee10cc` | RESULT das partes | registro |

## Ambiente
| Item | Valor |
|---|---|
| Produto | `COMPARATIVO_2026` na planilha real; menu `Armas` (`Selecao livre` / `Anual`) |
| Portas sem clique | `gerarComparativo2026Headless()`, `executarCompiladorArmasHeadless()` |
| Provas binarias | `verificarParticipacaoArmasHeadless`, `verificarQtdOcorrenciasHeadless`, `verificarPontuacaoHeadless`, `verificarDrogasHeadless` |
| Matricula de referencia | **1133306 - FERNANDES, 3o PEL** |
| Papel | `agentic/state/RESULT_152_PARTE1_ARMAS.md` |

## Entrada
Regras de dominio **ditadas pelo proprietario** (verbatim):
- QTD. O = *"de quantos tuneis aquele policial participou"* (tuneis **distintos**, 1 por participacao).
- CPM = *"a soma da pontuacao do policial de todos os tuneis do mes corrente ou do ano"*.
- Entorpecentes = soma de MACONHA + COCAINA + CRACK nas 9 abas.
- Ordem da entrega de armas = participacoes (score desc) e, no empate, **ANTIGUIDADE** (soberania da regra dos OFICIAIS, R10).

## Resultado
**Defeito real (produto, nao teste):** `COMPARATIVO_2026` publicava `QTD. ARMAS = 0` para **todos os 198**
policiais, mesmo com a fonte cheia. **Causa medida, nao deduzida:** o valor era lido e acumulado
corretamente e **descartado na saida** - a corrente tinha 6 elos; 5 corretos e o ultimo
(`Dominio/RegistroAnalitico.js`) reconstruia `fatos` com **7 campos explicitos**, sem `participacaoArmas`.
Localizado por **instrumento (bisturi)**, nao por tentativa: `diagnosticarCaminhoArmasHeadless` mediu os elos.

| Parte | Prova | Fonte = Produto |
|---|---|---|
| 1 - QTD. ARMAS | `verificarParticipacaoArmasHeadless(1133306)` | **8 = 8** (`confere: true`) |
| 2 - QTD. O (tuneis distintos) | `verificarQtdOcorrenciasHeadless(1133306)` | **8 = 8** . ano **298** |
| 3 - PONTUACAO (CPM, soma dos tuneis) | `verificarPontuacaoHeadless(1133306)` | **36.385,33 = 36.385,33** |
| 4 - ENTROPECENTES (9 abas) | `verificarDrogasHeadless(1133306)` | **3.093,5 = 3.093,5** |

| Efeito medido | Antes | Depois |
|---|---|---|
| `QTD. ARMAS` no comparativo | 0 (todos) | **vivo** |
| Ocorrencias lidas | 296 | **298** |
| Tempo de execucao | ~6 s | **~5 s** |

Na tela: `1133306 . FERNANDES . 3o PEL . QTD.O 8 . 36.385,33 . QTD.ARMAS 8`.
**Fechamento:** lista gerada e tema resolvido, confirmado pelo proprietario (13/09/2026).

## Limite
- **O commit `b7a0a5d` citado em `agentic/state/RESULT_152_PARTE1_ARMAS.md` como "commit do elo final"
  NAO EXISTE neste repositorio** (`git log --all` nao o encontra; todas as refs foram varridas). O elo final
  efetivamente versionado e **`824b545`** (`RegistroAnalitico preserva participacaoArmas`). **Ausencia
  declarada, nao preenchida** - o hash do RESULT e referencia quebrada e este registro nao a corrige no
  arquivo de origem.
- O `Math.max` em `LeitorPlanilhas.js:290` **parecia** defeito e **nao e** (dedupe dentro do mesmo tunel).
- **Divergencias registradas e nao corrigidas** (`4b7b58d`, `64daaed`, `efd12f9`): o codigo ordenava **so
  por score**, mas a regra do proprietario exige desempate por ANTIGUIDADE (R10); o Compilador de Armas
  embutia **9 regras (R1-R9)** das quais a ARCA era cega; o 3o PEL existe (`#FFFFFF`) e e o fallback;
  `GTAR` e resolvido por **nome exato** (nao substring).
- A UI de legenda foi ajustada por pedido do proprietario (`9f96dc0`, `0a8c5b3`, `98f5c8d`) - e convencao
  visual, **nao** regra de dominio.
- O produto real (abas `COMPARATIVO_2026`, `COMP_ARMAS_2026`) vive na planilha: **nao** e verificavel
  offline por este repositorio.
- As 4 provas usam **uma** matricula de referencia (1133306). A consistencia global foi mostrada pelo
  total do ano (298), **nao** por varredura de todos os 198 policiais.
