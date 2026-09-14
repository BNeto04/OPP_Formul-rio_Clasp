# RELATÓRIO — CARD #164 (`DP24-003`) · Checklist de produção da Porta (§12.6)

- **Card:** [#164](https://github.com/BNeto04/OPP_Formul-rio_Clasp/issues/164) — pai **#57** · método canônico **v2.4**
- **Branch:** `sprint/g01-guardiao-qualidade-live-001` · **HEAD de partida:** `f19198c`
- **Natureza:** documentação/contrato + teste (fechadura). **Nenhum** arquivo de código de produto
  (`Core/`, `Features/`, `Entrada/`, `Render/`, `Dominio/`, `Motor/`, `Leitura/`, `Drivers/`, arquivos de raiz)
  foi alterado. Nada foi commitado, empurrado ou publicado.
- **Regra transversal respeitada:** MEDIR ANTES → localizar o que já existe → aplicar **somente** o delta
  exigido pelo 2.4 → verificar → RESULT.

---

## 1. MEDIÇÃO ANTES (o que existia de fato)

| O que | Medição (comando/evidência) | Resultado |
|---|---|---|
| Seções `## Portas` nas cápsulas §46.2 | `grep -rln "^## Portas" 02_Comodos --include=*.md` | **11 arquivos** (+ o `INDICE.md` de C01) |
| Pastas `portas/` do §40.5 | `find 02_Comodos -type d -name portas` + `ls` em cada uma | **15 pastas, TODAS vazias (0 arquivos)** |
| Arquivo de Porta no modelo §46.3 | `grep -rn "PORTA-" --include=*.md --include=*.canvas --include=*.mjs` | **0 ocorrências** — nenhuma Porta tinha descrição formal |
| Seção `## Checklist de produção (§12.6)` | `grep -rln "Checklist de produção\|checklist_producao" --include=*.md` | **1 arquivo: o próprio método** — nenhuma Porta declarava o checklist |
| `LockService` no código de produto | `grep -rn LockService --include=*.js .` (fora de `node_modules`) | **0 no produto**; a única menção do repositório é um stub de sandbox em `Testes/TestMenuP3.js:80` |
| Suíte de testes (baseline) | `node Testes/RodarTodosOsTestes.js` | **exit 0** · somatório dos `RESULTADOS FINAIS`: **285 PASS / 0 FAIL** |
| Lint estrutural (baseline) | `node scripts/downplant/lint-estrutura.mjs .` | **exit 0** |

**Conclusão da medição:** as Portas existiam como **linha de tabela** na cápsula (`| Porta | Direção |
Contrato (resumo) |`) e como **nó de circuito**; nenhuma tinha contrato §46.3 nem o checklist de produção.
Ou seja: o requisito do §12.6 estava **100% não verificável** antes deste card.

## 2. Critério de elegibilidade aplicado (§12.6, verbatim)

> "Toda Porta que **cruza Cômodo**, **expõe efeito externo** ou **lida com concorrência** deve declarar,
> como parte do seu `ensure`/`invariant`, o checklist de produção."

Operacionalização (para ser auditável, não interpretável):

| Coluna | `SIM` quando | `NAO` quando |
|---|---|---|
| `cruza` | origem e destino em Cômodos **diferentes**, ou um dos lados é **externo à Planta** (Sheets, ARCA, chamador `clasp run`) | origem e destino no **mesmo** Cômodo e nenhum lado externo |
| `efeito` | a execução **grava** em recurso fora do Módulo (aba mensal, aba de auditoria, aba de relatório, log) | a Porta não grava |
| `conc` | dois chamadores podem interleavar sobre o **mesmo estado compartilhado** (linhas/aba) | não há estado compartilhado mutável |

**Elegível = `cruza` OU `efeito` OU `conc`.**

**Leitura declarada (sujeita a contestação do Planner):** travessia **de código** (utilitário puro importado
entre Cômodos, manifesto, regra de lint, fronteira configuracional `.claspignore`) **não** conta como travessia
**de execução**. Nesses casos cada um dos 9 itens seria `nao_aplicavel` e o §40.6 proíbe criar documento vazio
para aparentar conformidade — por isso eles ficam **registrados como não elegíveis com motivo escrito**, e
podem ser promovidos por decisão do Planner sem reescrita (basta declarar `elegivel = SIM` e criar o arquivo).

## 3. Inventário canônico das Portas (45) e veredito por Porta

Fonte única: `02_Comodos/C00_Governanca_Estrutural/03_Especificacoes/INVENTARIO_PORTAS_E_CHECKLIST_12_6.md`
(bloco `PORTA-REGISTRY-V1`, lido pelo validador). **44 Portas** vêm das tabelas `## Portas` das cápsulas +
circuitos; **1** (o gatilho de menu do normalizador) foi separada explicitamente porque não tinha dono
declarado. Totais: **25 elegíveis · 20 não elegíveis**.

| Porta | Módulo | Direção (Porta) | cruza | efeito | conc | elegível | itens `pendente` |
|---|---|---|---|---|---|---|---|
| `C00/MOD-C00-01/P01` | MOD-C00-01_ESTRUTURA_DO_COFRE | manifesto → lint | NAO | NAO | NAO | **nao** |  |
| `C00/MOD-C00-01/P02` | MOD-C00-01_ESTRUTURA_DO_COFRE | estrutura → todo o cofre | NAO | NAO | NAO | **nao** |  |
| `C00/MOD-C00-01/P03` | MOD-C00-01_ESTRUTURA_DO_COFRE | documentacao → Apps Script (bloqueada) | SIM | NAO | NAO | **nao** |  |
| `C00/MOD-C00-02/P01` | MOD-C00-02_VALIDACAO_ESTRUTURAL | manifesto → lint (regra 1) | NAO | NAO | NAO | **nao** |  |
| `C00/MOD-C00-02/P02` | MOD-C00-02_VALIDACAO_ESTRUTURAL | arvore → lint (regra 2) | NAO | NAO | NAO | **nao** |  |
| `C00/MOD-C00-02/P03` | MOD-C00-02_VALIDACAO_ESTRUTURAL | conteudo → lint (regra 3) | NAO | NAO | NAO | **nao** |  |
| `C00/MOD-C00-03/P01` | MOD-C00-03_INFRAESTRUTURA_CORE | `Core/Logger.js` → `Render/Auditoria` | NAO | SIM | SIM | **SIM** | race_condition |
| `C00/MOD-C00-03/P02` | MOD-C00-03_INFRAESTRUTURA_CORE | `Core/Datas.js` → consumidores | NAO | NAO | NAO | **nao** |  |
| `C00/MOD-C00-03/P03` | MOD-C00-03_INFRAESTRUTURA_CORE | `Core/Erros.js` → consumidores | NAO | NAO | NAO | **nao** |  |
| `C00/MOD-C00-03/P04` | MOD-C00-03_INFRAESTRUTURA_CORE | `appsscript.json` → runtime | NAO | NAO | NAO | **nao** |  |
| `C01/MOD-C01-01/P01` | MOD-C01-01_FORMULARIO_E_MENUS | menu do Sheets → produto (P3) | SIM | SIM | NAO | **SIM** | - |
| `C01/MOD-C01-01/P02` | MOD-C01-01_FORMULARIO_E_MENUS | formulario → ARCA (metadados de veiculo) | SIM | NAO | NAO | **SIM** | - |
| `C01/MOD-C01-01/P03` | MOD-C01-01_FORMULARIO_E_MENUS | formulario → EntradaManual (payload do BO) | NAO | SIM | SIM | **SIM** | idempotente, operacao_atomica, race_condition |
| `C01/MOD-C01-01/P04` | MOD-C01-01_FORMULARIO_E_MENUS | formulario → C03 (AIS territorial) | SIM | NAO | NAO | **SIM** | - |
| `C01/MOD-C01-01/P05` | MOD-C01-01_FORMULARIO_E_MENUS | prova headless → entrada manual (sem gravar) | SIM | NAO | NAO | **SIM** | - |
| `C01/MOD-C01-01/P06` | MOD-C01-01_FORMULARIO_E_MENUS | formulario → EFETIVO (autocomplete) | SIM | NAO | NAO | **SIM** | - |
| `C01/MOD-C01-02/P01` | MOD-C01-02_NORMALIZADOR_DE_EFETIVO | normalizador → ARCA (metadados de regra) | SIM | NAO | NAO | **SIM** | - |
| `C01/MOD-C01-02/P02` | MOD-C01-02_NORMALIZADOR_DE_EFETIVO | normalizador → aba EFETIVO (escrita) | NAO | SIM | SIM | **SIM** | race_condition |
| `C01/MOD-C01-02/P03` | MOD-C01-02_NORMALIZADOR_DE_EFETIVO | prova headless → normalizador | SIM | SIM | SIM | **SIM** | race_condition |
| `C01/MOD-C01-02/P04` | MOD-C01-02_NORMALIZADOR_DE_EFETIVO | gatilho de menu → normalizador | NAO | NAO | NAO | **nao** |  |
| `C02/MOD-C02-01/P01` | MOD-C02-01_LEITURA_E_ADAPTACAO | planilha → leitura (abas mensais/EFETIVO) | SIM | NAO | NAO | **SIM** | - |
| `C02/MOD-C02-01/P02` | MOD-C02-01_LEITURA_E_ADAPTACAO | leitura → C03/C04 (fatos canonicos) | SIM | NAO | NAO | **SIM** | - |
| `C02/MOD-C02-01/P03` | MOD-C02-01_LEITURA_E_ADAPTACAO | prova headless binaria → abas | SIM | NAO | NAO | **SIM** | - |
| `C02/MOD-C02-01/P04` | MOD-C02-01_LEITURA_E_ADAPTACAO | cabecalho → leitura (resolucao de alias) | NAO | NAO | NAO | **nao** |  |
| `C02/MOD-C02-01/P05` | MOD-C02-01_LEITURA_E_ADAPTACAO | leitura → participacao (acumulo) | NAO | NAO | NAO | **nao** |  |
| `C04/MOD-C04-01/P01` | MOD-C04-01_MOTOR_ANALITICO | leitura → motor (fatos) | SIM | NAO | NAO | **SIM** | - |
| `C04/MOD-C04-01/P02` | MOD-C04-01_MOTOR_ANALITICO | motor → plugins (ciclo de vida) | NAO | NAO | NAO | **nao** |  |
| `C04/MOD-C04-01/P03` | MOD-C04-01_MOTOR_ANALITICO | motor → RegistroAnalitico | NAO | NAO | NAO | **nao** |  |
| `C04/MOD-C04-01/P04` | MOD-C04-01_MOTOR_ANALITICO | diagnostico → motor | NAO | NAO | NAO | **nao** |  |
| `C05/MOD-C05-01/P01` | MOD-C05-01_GUARDIAO_DE_QUALIDADE | guardiao → ARCA (enriquecimento) | SIM | NAO | NAO | **SIM** | - |
| `C05/MOD-C05-01/P02` | MOD-C05-01_GUARDIAO_DE_QUALIDADE | guardiao → abas de auditoria e historico | NAO | SIM | SIM | **SIM** | race_condition |
| `C05/MOD-C05-01/P03` | MOD-C05-01_GUARDIAO_DE_QUALIDADE | guardiao → coluna de alerta (AM) da aba auditada | NAO | SIM | SIM | **SIM** | race_condition |
| `C05/MOD-C05-01/P04` | MOD-C05-01_GUARDIAO_DE_QUALIDADE | menu do Sheets → guardiao (seletor de meses) | SIM | SIM | NAO | **SIM** | - |
| `C05/MOD-C05-01/P05` | MOD-C05-01_GUARDIAO_DE_QUALIDADE | prova headless → guardiao | SIM | SIM | SIM | **SIM** | race_condition |
| `C06/MOD-C06-01/P01` | MOD-C06-01_RELATORIOS_OFICIAIS | menu do Sheets → comparativo 2026 | SIM | SIM | SIM | **SIM** | race_condition |
| `C06/MOD-C06-01/P02` | MOD-C06-01_RELATORIOS_OFICIAIS | prova headless → comparativo | SIM | SIM | SIM | **SIM** | race_condition |
| `C06/MOD-C06-01/P03` | MOD-C06-01_RELATORIOS_OFICIAIS | comparativo → fonte (prova binaria) | NAO | NAO | NAO | **nao** |  |
| `C06/MOD-C06-01/P04` | MOD-C06-01_RELATORIOS_OFICIAIS | renderer → legenda | NAO | NAO | NAO | **nao** |  |
| `C06/MOD-C06-02/P01` | MOD-C06-02_MERITO_DE_ARMAS_GXT | menu Armas → selecao livre | SIM | SIM | SIM | **SIM** | idempotente |
| `C06/MOD-C06-02/P02` | MOD-C06-02_MERITO_DE_ARMAS_GXT | menu Armas → anual | SIM | SIM | SIM | **SIM** | idempotente |
| `C06/MOD-C06-02/P03` | MOD-C06-02_MERITO_DE_ARMAS_GXT | prova headless → compilador de armas | SIM | SIM | SIM | **SIM** | idempotente |
| `C06/MOD-C06-02/P04` | MOD-C06-02_MERITO_DE_ARMAS_GXT | compilador → ARCA (regras de armas) | SIM | NAO | NAO | **SIM** | idempotente, deduplicacao, validacao_entrada |
| `C06/MOD-C06-02/P05` | MOD-C06-02_MERITO_DE_ARMAS_GXT | compilador → legenda | NAO | NAO | NAO | **nao** |  |
| `C08/MOD-C08-01/P01` | MOD-C08-01_HOMOLOGACAO_OFFLINE | CLI → suite de testes | NAO | NAO | NAO | **nao** |  |
| `C08/MOD-C08-01/P02` | MOD-C08-01_HOMOLOGACAO_OFFLINE | `clasp run` → portas headless (generica) | SIM | NAO | NAO | **nao** |  |

## 4. Checklist aplicado — mapa §12.6 → Porta → estado por item

Legenda: **A** = `aplicavel` · **NA** = `nao_aplicavel` · **P** = `pendente` (bloqueia a Porta em G7, §12.6).

| Porta | Endereço/Cápsula | idem | dedup | rate | pág | valid | atôm | race | cache | retry |
|---|---|---|---|---|---|---|---|---|---|---|
| `C00/MOD-C00-03/P01` | MOD-C00-03_INFRAESTRUTURA_CORE | A | NA | NA | NA | A | A | P | NA | NA |
| `C01/MOD-C01-01/P01` | MOD-C01-01_FORMULARIO_E_MENUS | A | A | NA | NA | A | NA | NA | NA | NA |
| `C01/MOD-C01-01/P02` | MOD-C01-01_FORMULARIO_E_MENUS | A | NA | NA | NA | A | NA | NA | A | NA |
| `C01/MOD-C01-01/P03` | MOD-C01-01_FORMULARIO_E_MENUS | P | A | NA | NA | A | P | P | NA | A |
| `C01/MOD-C01-01/P04` | MOD-C01-01_FORMULARIO_E_MENUS | A | NA | NA | NA | A | NA | NA | NA | NA |
| `C01/MOD-C01-01/P05` | MOD-C01-01_FORMULARIO_E_MENUS | A | NA | NA | NA | A | NA | NA | NA | A |
| `C01/MOD-C01-01/P06` | MOD-C01-01_FORMULARIO_E_MENUS | A | NA | NA | A | A | NA | NA | NA | NA |
| `C01/MOD-C01-02/P01` | MOD-C01-02_NORMALIZADOR_DE_EFETIVO | A | NA | NA | NA | A | NA | NA | A | NA |
| `C01/MOD-C01-02/P02` | MOD-C01-02_NORMALIZADOR_DE_EFETIVO | A | A | NA | NA | A | A | P | NA | A |
| `C01/MOD-C01-02/P03` | MOD-C01-02_NORMALIZADOR_DE_EFETIVO | A | A | NA | NA | A | A | P | NA | A |
| `C02/MOD-C02-01/P01` | MOD-C02-01_LEITURA_E_ADAPTACAO | A | NA | NA | A | A | NA | A | NA | A |
| `C02/MOD-C02-01/P02` | MOD-C02-01_LEITURA_E_ADAPTACAO | A | NA | NA | A | A | NA | NA | NA | NA |
| `C02/MOD-C02-01/P03` | MOD-C02-01_LEITURA_E_ADAPTACAO | A | NA | NA | NA | A | NA | A | NA | A |
| `C04/MOD-C04-01/P01` | MOD-C04-01_MOTOR_ANALITICO | A | NA | NA | A | A | NA | NA | NA | NA |
| `C05/MOD-C05-01/P01` | MOD-C05-01_GUARDIAO_DE_QUALIDADE | A | NA | NA | NA | A | NA | NA | A | NA |
| `C05/MOD-C05-01/P02` | MOD-C05-01_GUARDIAO_DE_QUALIDADE | A | A | NA | NA | A | A | P | NA | A |
| `C05/MOD-C05-01/P03` | MOD-C05-01_GUARDIAO_DE_QUALIDADE | A | A | NA | NA | A | A | P | NA | A |
| `C05/MOD-C05-01/P04` | MOD-C05-01_GUARDIAO_DE_QUALIDADE | A | A | NA | NA | A | A | A | NA | A |
| `C05/MOD-C05-01/P05` | MOD-C05-01_GUARDIAO_DE_QUALIDADE | A | A | NA | NA | A | A | P | NA | A |
| `C06/MOD-C06-01/P01` | MOD-C06-01_RELATORIOS_OFICIAIS | A | A | NA | A | A | A | P | NA | A |
| `C06/MOD-C06-01/P02` | MOD-C06-01_RELATORIOS_OFICIAIS | A | A | NA | A | A | A | P | NA | A |
| `C06/MOD-C06-02/P01` | MOD-C06-02_MERITO_DE_ARMAS_GXT | P | A | NA | A | A | A | A | NA | A |
| `C06/MOD-C06-02/P02` | MOD-C06-02_MERITO_DE_ARMAS_GXT | P | A | NA | A | A | A | A | NA | A |
| `C06/MOD-C06-02/P03` | MOD-C06-02_MERITO_DE_ARMAS_GXT | P | A | NA | A | A | A | A | NA | A |
| `C06/MOD-C06-02/P04` | MOD-C06-02_MERITO_DE_ARMAS_GXT | P | P | NA | NA | P | NA | NA | NA | NA |

**Leitura do mapa:** 12 Portas ficam **verdes** (nenhum `pendente`) e 13 ficam **amarelas** com **17 itens
`pendente`**, todos com justificativa escrita no próprio arquivo (ver §6). Nenhum `pendente` foi usado como
"resposta" sem análise: 9 dos 17 são `race_condition` de uma única causa-raiz (ausência de serialização).

### 4.1 Rubrica aplicada a cada item (para que a resposta seja auditável)

| Item | `aplicavel` (também satisfeito) | `nao_aplicavel` | `pendente` |
|---|---|---|---|
| `idempotente` | a reexecução reconstrói/substitui o mesmo estado, com evidência no código | Porta sem efeito (somente leitura) | reexecução multiplica efeito e não há chave de idempotência |
| `deduplicacao` | existe detecção/consolidação de repetição declarada | não cria registro | repetição gera segundo registro **e** nada é declarado |
| `rate_limit` | existe limite contratado | Porta chamada por gesto humano / em processo, sem volume externo | — |
| `paginacao` | o recorte existe por desenho (por aba / lote / por BO) | resposta é um item único | volume ilimitado sem recorte |
| `validacao_entrada` | a entrada é validada antes do efeito (com `arquivo:linha`) | Porta sem entrada própria | efeito ocorre sem validação declarada |
| `operacao_atomica` | efeito **regenerável** com estado intermediário nomeado, ou bloco único | Porta sem escrita | escrita multi-passo em **dado operacional/evidência**, sem rollback |
| `race_condition` | nome versionado + falha ruidosa, ou somente leitura (com contrato) | não há estado compartilhado mutável | gravação com nome fixo / ler-depois-escrever, sem serialização |
| `cache` | referência à implementação de cache existente | leitura barata ou dado vivo | — |
| `retry_pelo_cliente` | política de re-tentativa declarada e segura | o desfecho é estável/determinístico | — |

## 5. Descrições formais criadas (§46.3) — 25 arquivos

Todos em `portas/` do Módulo dono (§40.5), no modelo do **§46.3** (Endereço global, Escala, Origem, Destino,
Payload, require, ensure, invariant, **Checklist de produção (§12.6)**, Erros, Efeitos, Segurança,
Observabilidade, Implementação, Testes, Evidência, Estado). Todos derivados do **código medido** — nenhum
comportamento inventado; toda afirmação carrega `arquivo:linha`.

| Módulo dono | Arquivos de Porta criados |
|---|---|
| MOD-C00-03_INFRAESTRUTURA_CORE | `PORTA-C00-03-P01_LOG_DE_AUDITORIA.md` |
| MOD-C01-01_FORMULARIO_E_MENUS | `P01_MENU_P3` · `P02_FORMULARIO_ARCA` · `P03_ENTRADA_MANUAL_BO` · `P04_AIS_TERRITORIAL` · `P05_ENTRADA_MANUAL_HEADLESS` · `P06_EFETIVO_AUTOCOMPLETE` |
| MOD-C01-02_NORMALIZADOR_DE_EFETIVO | `P01_NORMALIZADOR_ARCA` · `P02_ESCRITA_EFETIVO` · `P03_NORMALIZADOR_HEADLESS` |
| MOD-C02-01_LEITURA_E_ADAPTACAO | `P01_LEITURA_DE_PLANILHA` · `P02_FATOS_CANONICOS` · `P03_PROVA_HEADLESS` |
| MOD-C04-01_MOTOR_ANALITICO | `P01_FATOS_PARA_MOTOR` |
| MOD-C05-01_GUARDIAO_DE_QUALIDADE | `P01_GUARDIAO_ARCA` · `P02_ABAS_DE_AUDITORIA` · `P03_COLUNA_ALERTA_AM` · `P04_MENU_PARA_GUARDIAO` · `P05_GUARDIAO_HEADLESS` |
| MOD-C06-01_RELATORIOS_OFICIAIS | `P01_MENU_COMPARATIVO` · `P02_COMPARATIVO_HEADLESS` |
| MOD-C06-02_MERITO_DE_ARMAS_GXT | `P01_MENU_SELECAO_LIVRE` · `P02_MENU_ANUAL` · `P03_ARMAS_HEADLESS` · `P04_COMPILADOR_ARCA` |

**Elemento → Porta → Circuito preservado:** cada Porta aponta o Módulo dono (endereço global
`Cxx/MOD-Cxx-nn/Pnn`), o circuito que a desenha e os arquivos de implementação. Nenhum circuito foi editado
(nenhum nó novo, nenhuma aresta nova) e nenhuma cápsula foi reescrita — a Porta passou a existir como
**elemento próprio**, que era o que faltava.

**Portas que já tratavam um item sem declarar (declaradas e referenciadas, não reescritas):**
`cache` da ARCA (3 Portas) referencia o mesmo singleton congelado de
`Dominio/ARCA/AdaptadorConsultaArca.js:108,137`; as Portas headless (`P05`/`P03`/`P02`) **referenciam** o
contrato das Portas de UI irmãs em vez de repeti-lo — mesma lógica que o §12.6 manda usar para Instalação
transversal (§8.11).

**Instalação transversal (§8.11):** o único `INST-*` catalogado no cofre é
`INST-EXEC-001_ENDPOINT_DE_EXECUCAO.md`, que está **RETIRADO** (decisão do proprietário, 13/09/2026) — e é
justamente a Porta externa que deixou de existir. Logo **não há, hoje, Instalação transversal vigente para
referenciar** em nenhum item; o validador já impõe a regra (referência a `INST-*` inexistente = falha) para
quando existir. A serialização que falta (§6) é o caso óbvio de `INST-*` futura.

## 6. Pendências declaradas (17 itens em 13 Portas) e as duas causas-raiz

| Porta | Item(ns) `pendente` | Correção exigida |
|---|---|---|
| `C00/MOD-C00-03/P01` | race_condition | lock, nome de aba por execução, ou declarar o log descartável |
| `C01/MOD-C01-01/P03` | idempotente, operacao_atomica, race_condition | chave MIKE+BOE, gravação em bloco único, lock + revalidação do bloco |
| `C01/MOD-C01-02/P02` | race_condition | lock no início de `executar()` + escrita em uma chamada |
| `C01/MOD-C01-02/P03` | race_condition | idem P02 (é o segundo chamador do mesmo efeito) |
| `C05/MOD-C05-01/P02` | race_condition | lock no ciclo de auditoria (histórico anexa por ler-depois-escrever) |
| `C05/MOD-C05-01/P03` | race_condition | lock no ciclo de auditoria (lê a aba e escreve nela) |
| `C05/MOD-C05-01/P05` | race_condition | idem P02/P03 (prova headless é o segundo chamador) |
| `C06/MOD-C06-01/P01` | race_condition | lock na geração de `COMPARATIVO_2026` |
| `C06/MOD-C06-01/P02` | race_condition | idem P01 |
| `C06/MOD-C06-02/P01` | idempotente | decidir versionador (com expurgo) ou sobrescrita idempotente |
| `C06/MOD-C06-02/P02` | idempotente | idem P01 |
| `C06/MOD-C06-02/P03` | idempotente | idem P01 |
| `C06/MOD-C06-02/P04` | idempotente, deduplicacao, validacao_entrada | implementar a consulta à ARCA **ou** retirar a Porta da cápsula |

- **Causa-raiz 1 (9 das 17):** não existe serialização. O código de produto não usa `LockService` em nenhum
  arquivo e há **sempre dois chamadores** para o mesmo efeito (operador pela UI + agente por `clasp run`).
  A forma que o método prevê é **uma** Instalação transversal de serialização (§8.11) referenciada por todas
  as Portas — uma decisão, não nove correções.
- **Causa-raiz 2 (5 das 17):** não existe política de idempotência para artefatos que se acumulam (aba nova
  por execução em `Compilador_Armas.js:251-260`; novo bloco por reentrega em `Entrada/EntradaManual.js:51`).
- **Sem causa-raiz comum (3 das 17):** `C06/MOD-C06-02/P04` (`Compilador → ARCA`) está **declarada na cápsula
  e não existe no runtime** — a pendência ali é de **existência**, não de operação (ver D-164-02).

## 7. Divergências encontradas durante a medição (registradas, não corrigidas)

| ID | Divergência | Evidência |
|---|---|---|
| **D-164-01** | A cápsula de C02 descreve a Porta `Planilha → Leitura` como "`valueRenderOption=FORMULA` **e** `FORMATTED_VALUE`". Isso foi o **método de medição** do card #142, não chamada de runtime: `grep -rn valueRenderOption` no produto = **0** e `appsscript.json` não habilita serviço avançado (`"dependencies": {}`). A leitura de runtime é `getValues()` e, onde precisa de fórmula, `Range.getFormulas()` (3 pontos). | `Core/LeitorPlanilhas.js:38` · `Leitura/Adaptador2026.js:50` · `Entrada/EntradaManual.js:338` · `Features/CorretorQualidade.js:100` · `Features/GuardiaoQualidade.js:164` |
| **D-164-02** | A cápsula de C06-02 declara a Porta `Compilador → ARCA` (regras R1–R10) **sem chamada correspondente**: `Compilador_Armas.js` não toca `AdaptadorConsultaArca`; o R10 está codificado localmente e as regras R1–R9 vivem em documento. | `grep -n "AdaptadorConsultaArca\|consultarPorRuleId" Compilador_Armas.js` = **0** · `Compilador_Armas.js:241-249` · `Dominio/ARCA/REGRAS_ARMAS_INFERIDAS.md` |
| **D-164-03** | O `INDICE.md` de C01 declara a Porta `C01 → C07 Efetivo (getEfetivo)` e o comentário de `getEfetivo` rotula o destino como "M07 Efetivo" — **não existe Cômodo C07 no cofre** (`ls 02_Comodos`: C00,C01,C02,C03,C04,C05,C06,C08). A implementação lê a aba `EFETIVO` (recurso externo), não um Cômodo. | `02_Comodos/C01_Entrada/00_Visao_Do_Comodo/INDICE.md:30-36` · `Entrada/EntradaManual.js:605,611` |
| **D-164-04** | `Features/GuardiaoHeadless.js:11` declara "NAO altera dados operacionais", mas a prova headless executa `auditarMeses` → `varrerAba`, que **grava a coluna AM (Alerta Integridade)** da aba mensal auditada — e cria o cabeçalho dela quando ausente. Efeito medido ≠ efeito declarado. | `Features/GuardiaoHeadless.js:11,75` · `Entrada/SeletorMesesGuardiao.js:224` · `Features/GuardiaoQualidade.js:199-201,648` |

Nenhuma dessas divergências foi corrigida (escopo: documentação/contrato + teste; código de produto intocado).
Todas passam a estar **nomeadas e localizadas**, prontas para card próprio.

## 8. A fechadura — teste que verifica presença e completude do checklist

**Validador canônico único:** `scripts/downplant/validar-portas.mjs` (431 linhas, sem dependência externa,
exporta `parseInventario`, `lerItensChecklist`, `validarPortaArquivo`, `portasDeclaradas`, `conferir` — o
teste chama **o mesmo código**, não existe segundo validador no repositório).

O que ele reprova (exit 1): Porta elegível sem arquivo; arquivo sem a seção `## Checklist de produção (§12.6)`;
item do §12.6 ausente; estado fora de `{aplicavel, nao_aplicavel, pendente}`; resposta vazia;
**`pendente` sem justificativa**; referência a `INST-*` inexistente; Porta elegível declarada com `arquivo_porta = -`;
Porta **ornamental** (arquivo `PORTA-*.md` fora do inventário); divergência entre o endereço do inventário e o
do arquivo.

**Fechadura:** `Testes/TestValidarChecklistProducaoPortas.js` (296 linhas) — **18 PASS / 0 FAIL**, registrado em
`Testes/RodarTodosOsTestes.js:108-114` (bloco de registro do #164).

### RED → GREEN (medido)

| Momento | Comando | Resultado |
|---|---|---|
| **ANTES** (estado real pré-card) | `grep -rln "Checklist de produção" --include=*.md 02_Comodos` | **0 arquivos** (só o método) — nenhuma Porta declarava checklist |
| **ANTES** (estado real pré-card) | `grep -rn "PORTA-" --include=*.md --include=*.canvas .` | **0** — nenhuma Porta tinha arquivo §46.3 |
| **RED** (reprodução determinística do estado pré-card) | `node scripts/downplant/validar-portas.mjs Testes/Fixtures/portas_12_6/mini_repo --registry 02_Comodos/C00_Governanca_Estrutural/03_Especificacoes/inventario_antes_do_card.md` | **exit 1** — `Porta ELEGIVEL sem 'arquivo_porta'` nomeando cada Porta sem checklist |
| **RED** (Porta elegível com arquivo ausente) | idem, `--registry .../inventario_porta_sem_arquivo.md` | **exit 1** — `arquivo declarado NAO EXISTE` |
| **RED** (Porta ornamental) | idem, `--registry .../inventario_ornamental.md` | **exit 1** — `Porta ORNAMENTAL` |
| **RED** (item removido de uma Porta **real**) | fixture do teste nº 15 | **acusa**: `itens do §12.6 AUSENTES: cache` |
| **RED** (seção removida de uma Porta **real**) | fixture do teste nº 16 | **acusa**: `secao ... ausente — a Porta nao declara o checklist` |
| **GREEN** (depois do card) | `node scripts/downplant/validar-portas.mjs .` | **exit 0** · 286 PASS / 0 FAIL |
| **GREEN** (fechadura) | `node Testes/TestValidarChecklistProducaoPortas.js` | **exit 0** · 18 PASS / 0 FAIL |

Fixtures: `Testes/Fixtures/portas_12_6/` — 6 arquivos de Porta (1 válido + 5 defeitos de completude, um por
item) e `mini_repo/` com 4 inventários (verde, elegível sem arquivo, estado-antes-do-card, ornamental) e
2 Portas. A fechadura também confere o **mapa de pendências do inventário contra os arquivos, item a item**
(nos dois sentidos) — o relatório não pode divergir do artefato.

## 9. Saídas exigidas (verbatim)

**Lint estrutural** — `node scripts/downplant/lint-estrutura.mjs .`
```
✅ SUCESSO! A arvore documental esta em estrita conformidade com o Down Plant 2.1.
exit 0
```

**Suíte integral** — `node Testes/RodarTodosOsTestes.js`

| | Somatório dos `RESULTADOS FINAIS` | Verificações `FAIL` esperadas (fixtures negativas) | Última linha | **exit** |
|---|---|---|---|---|
| **antes** (HEAD `f19198c`) | **285 PASS / 0 FAIL** | 22 (do #163) | `TODAS AS SUÍTES FORAM EXECUTADAS COM SUCESSO` | **0** |
| **depois** (este card) | **303 PASS / 0 FAIL** | 31 (22 do #163 + 9 do #164) | `TODAS AS SUÍTES FORAM EXECUTADAS COM SUCESSO` | **0** |

`+18 PASS` = exatamente os 18 casos da fechadura nova. As 31 linhas `FAIL` do log são **saída esperada** das
fixtures negativas (o #163 já tinha 22; este card acrescenta 9 ao exercitar os cenários RED) — nenhuma
asserção real falhou. `TestVigiaNaturalLanguage` (#172) **passou** nas duas execuções.

## 10. Quatro pontas (#57)

| Ponta | Estado | Evidência |
|---|---|---|
| **CÓDIGO** | **INALTERADO** — nenhum arquivo de produto tocado; único arquivo de código alterado é o runner de teste (`Testes/RodarTodosOsTestes.js`, 1 bloco) | `git status` (ver §11) |
| **DOCUMENTAÇÃO** | **ALINHADO** — inventário canônico + 25 Portas §46.3 + este relatório + RESULT proposto | `INVENTARIO_PORTAS_E_CHECKLIST_12_6.md` · `portas/PORTA-*.md` (25) |
| **CANVAS / PLANTA** | **INALTERADO (por decisão)** — nenhum canvas editado, nenhum nó novo. As Portas já estavam desenhadas nos circuitos; o que faltava era o **elemento** com contrato, agora em `portas/` (endereço do §40.5 que existia vazio). | 15 pastas `portas/` deixam de ser vazias; `CIR-MOD-*/*.canvas` intactos |
| **GIT** | **PENDENTE por ordem do card** — nada commitado, nada empurrado, nada postado | ver §11 |

## 11. Arquivos criados/alterados (não commitados)

**Criados por este card (42 arquivos):**
- `scripts/downplant/validar-portas.mjs` (1)
- `Testes/TestValidarChecklistProducaoPortas.js` (1)
- `Testes/Fixtures/portas_12_6/` — 6 fixtures de Porta (1 válida + 5 defeitos) + `mini_repo/` (4 inventários
  + 2 Portas) = **12 arquivos**
- `02_Comodos/C00_Governanca_Estrutural/03_Especificacoes/INVENTARIO_PORTAS_E_CHECKLIST_12_6.md` (1)
- `02_Comodos/**/portas/PORTA-*.md` (**25**, nas 8 pastas `portas/` que estavam vazias)
- `RELATORIO_164.md` (1) · `RESULT_PROPOSTO_164.md` (1)

**Alterado por este card (1):**
- `Testes/RodarTodosOsTestes.js` — 1 bloco novo (registro da fechadura), na convenção já usada pelo #163.

**NÃO são deste card** (estavam no `git status` antes de começar ou pertencem a agentes irmãos; não foram
tocados): `02_Comodos/C01_Entrada/.../SUB-C01-01-01_OCR_E_CONFERENCIA/NOTA_DE_RESPONSABILIDADE.md` (M),
`RELATORIO_DE_DIFERENCIAS_156_157.md` (M), `Testes/TestNormalizadorEfetivo.js` (??),
`Testes/temp_test_telegram/` (??), `VigiaPonte/conversation_memory.json` (??).

## 12. Próximo passo seguro

1. **Planner:** decidir as duas causas-raiz (§6) — serialização como Instalação transversal (`INST-*`, §8.11)
   e política de idempotência/versionamento. Isso resolve **14 dos 17** `pendente` sem reescrever nenhuma Porta
   (as Portas passariam a **referenciar a instalação**).
2. **Planner:** decidir `C06/MOD-C06-02/P04` (`Compilador → ARCA`): implementar a consulta ou retirar a linha
   da cápsula (§17, mapa == realidade) — 3 `pendente`.
3. **Planner:** decidir D-164-01 (contrato da leitura de C02) e D-164-04 (efeito real da prova headless do
   Guardião) — as duas com evidência pronta neste relatório.
4. **Git:** commit/push sob autorização (o card proíbe neste passo).
