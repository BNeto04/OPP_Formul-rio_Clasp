# MOD-C06-01_RELATORIOS_OFICIAIS

- **ID:** MOD-C06-01
- **Endereco Down Plant:** `C06_Relatorios / MOD-C06-01_RELATORIOS_OFICIAIS` (escala: modulo) . circuito `CIR-MOD-C06-01_RELATORIOS_OFICIAIS.canvas`
- **Estado (§19):** Codigo 🟢 . Teste 🟢 . Contrato 🟢 . Integracao 🟢 . Visual 🟢 . Publicacao 🟢 (81/81) . Documentacao 🟢 *(esta capsula; evidencia EVD-C06-001)*
- **Perfil:** P1 (operacao recorrente)
- **Responsavel:** Proprietario (Manoel) - execucao por agentes sob card

## Responsabilidade
Gerar e publicar os **relatorios oficiais** do produto - em especial o `COMPARATIVO_2026` (produtividade
consolidada por policial) - a partir dos fatos canonicos, com renderizacao propria.

## Limites
- **Nao decide regra de dominio:** consome o que o C04 consolidou e o que a ARCA declara.
- **Nao corrige a fonte:** quando o valor publicado diverge, o defeito e rastreado ate a origem
  (o #152 separa "defeito do produto" de "defeito da entrada").
- **Nao inventa valor:** a ordem de entrega de armas segue a regra do proprietario (score desc, empate por
  antiguidade - R10) e a divergencia fica **registrada**, nao resolvida por conveniencia.

## Entradas
`RegistroAnalitico` (fatos + participacao + pontuacao + entorpecentes) . catalogo PIP . `EFETIVO`.

## Saidas
Aba `COMPARATIVO_2026` (por matricula: `QTD.O`, `CPM`, `QTD. ARMES`) . demais abas oficiais preservadas
(PIP, CPM, COMP_ARMAS_2026, COMP_DROGAS_2026) . dialogos de UI (`Entrada/DialogComparativo2026.html`).

## Portas
| Porta | Direcao | Contrato (resumo) |
|---|---|---|
| Menu -> comparativo | UI | `abrirMenuComparativo2026` -> `gerarComparativo2026Premium` devolve **resumo** |
| `clasp run` -> comparativo | **headless** | `gerarComparativo2026Headless()` - sem clique (#152) |
| Comparativo -> fonte | rastreio | cada valor publicado tem prova binaria (`verificar*Headless`, `confere: true/false`) |
| Renderer -> legenda | padrao visual | `Core/LegendaCores.js` e **fonte unica** da legenda |

## Conexoes
`C04/Motor -> C06-01` (registros analiticos) . `C06-02 -> C06-01` (mesma origem, outro recorte) .
`C06-01 -> C03/ARCA` (regra) . `C06-01 -> EFETIVO` (identidade do policial).

## Invariantes
1. **Fonte = produto:** nenhum valor publicado fica sem conferencia contra as abas de origem.
2. **Relatorios consagrados preservados** (PIP, CPM, ARMES, DROGAS) - o comparativo nao os altera.
3. **Prova binaria:** as portas `verificar*` devolvem `confere: true/false`, **sem opiniao**.
4. **Legenda com fonte unica** (`Core/LegendaCores.js`) - nenhum compilador repete a tabela de cores.

## Regras (dominio x heuristica)
| Regra | Onde rege | Artefato |
|---|---|---|
| QTD.O = tuneis **distintos** que o policial participou | dominio (ditada pelo proprietario) | `Features/CompiladorProdutividade.js` |
| CPM = soma da pontuacao do policial de TODOS os tuneis (mes/ano) | dominio (ditada pelo proprietario) | idem |
| ENTROPECENTES = MACONHA + COCAINA + CRACK nas 9 abas | dominio | idem |
| Dedupe **dentro** do tunel (`Math.max`) | heuristica medida | `Core/LeitorPlanilhas.js:290` |
| Faixa ZERO (vermelho) explicada na legenda | convencao visual (pedido do proprietario) | `Core/LegendaCores.js` |

## Tecnologia existente avaliada (§31.4)
Apps Script V8 + `SpreadsheetApp` para escrita das abas . renderer proprio (`Render/RendererComparativo2026.js`) .
**nenhuma** biblioteca externa.

## Artefatos
`Features/CompiladorProdutividade.js` . `Features/CompiladorProdutividadeV2.js` .
`CPM - Compilador de Pontuacao Mensal.js` . `Compilador PIP.js` . `Render/RendererComparativo2026.js` .
`Render/RendererCA.js` . `Entrada/DialogComparativo2026.html` . `Core/LegendaCores.js` . `Modelos/IRelatorioModelo.js` . `Modelos/ModeloProdutividade.js` . `Schemas/ProdutividadeSchema.js`.

## Dependencias (§31.6)
| Dependencia | Vinculo | Versao/estado |
|---|---|---|
| [DEP-002](../../../../../dependencias/DEP-002_GOOGLE_SHEETS.md) | destino das abas de relatorio | ativo |
| [DEP-004](../../../../../dependencias/DEP-004_ABAS_E_BASES_CANONICAS.md) | catalogo PIP e `EFETIVO` | ativo |

## Erros
Valor publicado sem correspondencia na fonte -> defeito classificado (foi exatamente o `QTD. ARMAS = 0` do #152)
. coloracao de pelotao sem match -> fallback `#FFFFFF` (3o PEL) . `GTAR` resolvido por **nome exato**, nao substring.

## Observabilidade
Tela `COMPARATIVO_2026` . resumo devolvido pela porta headless . RESULT `agentic/state/RESULT_152_PARTE1_ARMAS.md`
(antes/depois medidos) . tempo de execucao medido (~6 s -> ~5 s).

## Testes (fechaduras)
Portas `verificarParticipacaoArmasHeadless`, `verificarQtdOcorrenciasHeadless`, `verificarPontuacaoHeadless`,
`verificarDrogasHeadless` (todas `confere: true` para a matricula 1133306) . `TestRelatorioArmas` .
`TestSemRedefinicaoGlobal` (garante que o menu e as funcoes publicas nao colidem).

## Evidencias
- [EVD-C06-001](../../../05_Evidencias/EVD-C06-001_COMPARATIVO_E_ARMAS.md) (#152).
- Commit do elo final: **`824b545`** (`RegistroAnalitico` preserva `participacaoArmas`).
- **Divergencia declarada:** `agentic/state/RESULT_152_PARTE1_ARMAS.md` cita o commit `b7a0a5d` como "elo final",
  mas **esse hash nao existe no repositorio** - o elo versionado e `824b545`.

## Divergencias conhecidas
- **Ordenacao da entrega de armas:** o codigo ordenava **somente por score**; a regra do proprietario exige
  desempate por **ANTIGUIDADE** (R10, `64daaed`). Registrada, **nao** corrigida.
- **R1-R9 do Compilador de Armas** eram regras embutidas das quais a ARCA era cega (`4b7b58d`) - inferidas e
  registradas, **nao** promovidas automaticamente.
- As 4 provas do #152 usam **uma** matricula de referencia (1133306); a consistencia global e mostrada pelo total
  do ano (298), nao por varredura dos 198 policiais.
- O espelho Obsidian usa outra taxonomia (`SUB-C06-01_GERACAO_RELATORIOS_TABULARES`) - divergencia no **#154**.

## Critérios de verde
Fonte = produto em todas as colunas publicadas . relatorios consagrados intactos . legenda como fonte unica .
provas binarias verdes . nenhuma duplicidade/omissao conhecida sem classificacao . capsula e evidencia presentes.
