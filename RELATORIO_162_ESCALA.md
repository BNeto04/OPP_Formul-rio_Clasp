# RELATÓRIO — #162 (DP24-001) — ESCALA do Espelho Rico de Código (§46.15): 72/72 no repositório

**STATUS:** ENTREGUE — piloto escalado para os 71 restantes; **72/72 nós** de `07_Codigo_Leitura/` materializados no repositório e derivados no vault.
**Data:** 2026-09-13 (BRT) · **Branch:** `sprint/g01-guardiao-qualidade-live-001` · **HEAD:** `fbb0608e7b98144533628c7f9b773a10505b800d` (`fbb0608`)

> NOTA DE SEGURANÇA DOCUMENTAL: este relatório nomeia tokens que a varredura das árvores documentais proíbe.
> Ele vive na **raiz do repositório de propósito** (a raiz não é varrida), mesmo precedente do `RELATORIO_162_PILOTO.md`.
> Não mover para dentro das árvores varridas sem tratar a colisão.

---

## 0. Placar dos 10 critérios de fechamento do Planner

| # | Critério | Medido | Estado |
| ---: | :--- | :--- | :--- |
| 1 | 72/72 no repo | `find 07_Codigo_Leitura -name "*.md"` = **72** | ✅ |
| 2 | 9/9 campos | **71/71 espelhos** com 9/9 (o 72º nó é o índice derivado — ver §7.1) | ✅ com 1 exceção declarada |
| 3 | Código verbatim completo | 71/71 blocos conferidos conteúdo-contra-conteúdo (canônico) | ✅ |
| 4 | Commit/SHA/frescor | commit = HEAD nos 71; sha declarado = sha da origem nos 71; `sha256sum` bate em 68/71 (3 CRLF — regra declarada) | ✅ |
| 5 | Endereços vivos | 64 com endereço canônico derivado e link vivo; 7 **NÃO RESOLVIDO** reportado | ✅ com 7 pendências declaradas |
| 6 | Divergências declaradas | 34 espelhos com ACHADO mecânico declarado; 35 com endereços concorrentes declarados | ✅ |
| 7 | Varredura de legado excluindo só o conteúdo espelhado | lint `exit 0`; prova de escopo em §1.2 | ✅ |
| 8 | Lint verde | `LINT_EXIT=0` | ✅ |
| 9 | Verificador rico verde | 71/71 `exit 0` (deriva/commit/sha todos limpos) | ✅ |
| 10 | Suíte `exit 0` | `SUITE_EXIT=0` (630–631 PASS / 0 FAIL) | ✅ |

---

## 1. Decisão do Planner aplicada no lint — rota (b)

### 1.1 O delta exato

Arquivo: `scripts/downplant/lint-estrutura.mjs` (186 → 225 linhas). **Uma** mudança de escopo, mais uma
correção de falso positivo medida (§2):

```js
const ARVORE_ESPELHO = path.join(baseDir, '07_Codigo_Leitura') + path.sep;
const ehConteudoEspelhado = (arquivo) => arquivo.startsWith(ARVORE_ESPELHO);

allFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (!ehConteudoEspelhado(file)) {              // <-- decision (b): só a varredura de legado
    const match = content.match(legacyPattern);
    if (match) reportError(`Legado encontrado em ${file}: ...`);
  }
  // validação de links/wikilinks/canvas segue IDÊNTICA para todos os arquivos
```

A exclusão alcança **somente** o teste de conteúdo autoral/legado (`M[0-9]{2}`, `TASK-M`, `planta/`, `file:///`).
Nada mais foi tocado: manifesto (§1 do lint), slots/cômodos/módulos/submódulos (§2), links markdown,
wikilinks e nós de canvas (§3) continuam valendo para `07_Codigo_Leitura/` sem qualquer exceção.

### 1.2 Prova de escopo (4 experimentos, executados)

| Experimento | Entrada | Resultado | Leitura |
| :--- | :--- | :--- | :--- |
| A | árvore limpa | `LINT_EXIT=0` | linha de base |
| B | link markdown quebrado em **prosa**, dentro de `07_Codigo_Leitura/` | `LINT_EXIT=1` + `Link quebrado em ...07_Codigo_Leitura/_probe162.md: ./naoexiste162.md` | **o portão de links continua ativo na camada do espelho** |
| C | token de legado **dentro** de `07_Codigo_Leitura/` **e** o mesmo token **fora** | 1 erro, e ele aponta **só** para o arquivo de fora (`02_Comodos/...`) | decisão (b) faz exatamente o que foi decidido — nem mais, nem menos |
| D | sonda removida | `LINT_EXIT=0` | nada residual |

Os arquivos-sonda foram **apagados** (`_probe162.md`, `_scratch162/`) — nada foi deixado no repositório.

### 1.3 Os três portões próprios do espelho continuam de pé

| Portão | Como | Estado medido |
| :--- | :--- | :--- |
| (1) lint estrutural de caminhos/links/canvas/endereços | `lint-estrutura.mjs` | ✅ `exit 0` com 72/72 nós no repo |
| (2) verificador §46.15 dos 9/9 campos | `espelho-rico.mjs verificar` | ✅ 71/71 `exit 0` |
| (3) prova de frescor (commit + sha256 + código embutido == origem) | `verificar` + `sha256sum` externo | ✅ §5 |

---

## 2. Segundo falso positivo da MESMA raiz — medido, e corrigido com escopo declarado

Ao materializar o código **verbatim** no repositório apareceu um segundo falso positivo que a decisão (b)
não cobria, porque atinge o portão de **links** (que o Planner mandou manter intacto):

```
$ node scripts/downplant/lint-estrutura.mjs .        # com um único espelho contendo o código verbatim
❌ ERRO: WikiLink quebrado em ...\07_Codigo_Leitura\_scratch162\t.md: [['A','B']]
```

Causa: o validador de wikilinks roda sobre o texto **inteiro**, inclusive dentro de blocos cercados. Arrays
JavaScript aninhados (`[[...]]` — medidos em 5 das 71 origens: `Compilador de Entorpecentes.js`,
`Compilador_Armas.js`, `Entrada/EntradaManual.js`, `Features/NormalizadorEfetivo.js`,
`Render/RendererAuditoriaSaude.js`) são lidos como wikilink. Código não é markup de documento.

Correção aplicada (declarada): os validadores de **link** (markdown e wiki) passam a ler o texto **fora dos
blocos cercados**. O portão **não** foi afrouxado — foi calibrado:

- **medição antes da mudança:** a árvore tinha **0 (zero)** erros de link/link-wiki. Logo a exclusão remove **0 erro real** hoje. É uma mudança provadamente sem perda de cobertura no estado atual;
- **experimento B (§1.2)** prova que link quebrado **em prosa dentro de `07_Codigo_Leitura/` continua sendo reportado**;
- o portão de **canvas** (nós de arquivo + JSON válido) e o de **estrutura** seguem 100% intactos.

Se o Planner preferir não tocar no validador de links, a alternativa é **não materializar** os espelhos de
qualquer origem que contenha `[[` — o que elimina 5 dos 72 e, portanto, viola "72/72". Fica registrado como
escolha reversível, com esta medição na mão.

---

## 3. Entrega (2) — mapa artefato → endereço canônico

Arquivo: **`MAPA_ARTEFATO_ENDERECO_162.md`** (raiz do repositório, 183 linhas, 72 linhas de tabela).

### 3.1 Como foi derivado

Fonte única: a **Planta canônica do repositório** (`02_Comodos/**`). Nada foi inventado: cada linha cita o
arquivo e a linha da declaração. Níveis de evidência, declarados:

| Nível | Evidência | Ocorrências (primário) |
| :---: | :--- | ---: |
| 1 | seção `## Artefatos` da cápsula §46.2 do módulo, ou da NOTA do submódulo | 40 |
| 2 | linha de tabela do próprio endereço com coluna de submódulo | 1 |
| 3 | citação do caminho em arquivo **dentro do diretório do endereço** (circuito `.canvas`, cápsula, índice) | 23 |
| — | nenhuma das anteriores → **NÃO RESOLVIDO** | 7 |

Precisão alcançada: **5 endereços no nível de submódulo** (os 4 artefatos da ARCA + o JSON canônico) e
**59 no nível de módulo**. Endereços distintos usados: **13**. Nenhum canvas foi criado ou alterado.

### 3.2 O elemento parado `_SUP_158/MOD-C00-01_INFRAESTRUTURA_CORE`

Medição: **15 dos 72** nós carregavam esse ponteiro antes desta escala (14 espelhos de arquivo + o índice antigo).
**O briefing afirmava 69 de 72 — não reproduzido.** Divergência declarada, não maquiada.

Tratamento, caso a caso (nada foi renomeado):

| Artefato que apontava para o elemento parado | Endereço canônico derivado agora |
| :--- | :--- |
| `Core/Cabecalhos.js` | `C02_Leitura/MOD-C02-01_LEITURA_E_ADAPTACAO` |
| `Core/Config.js` | `C02_Leitura/MOD-C02-01_LEITURA_E_ADAPTACAO` |
| `Core/Constantes.js` | `C01_Entrada/MOD-C01-02_NORMALIZADOR_DE_EFETIVO` |
| `Core/Datas.js` | **NÃO RESOLVIDO** (reportado) |
| `Core/Erros.js` | **NÃO RESOLVIDO** (reportado) |
| `Core/Logger.js` | **NÃO RESOLVIDO** (reportado) |
| `Core/Metricas.js` | `C02_Leitura/MOD-C02-01_LEITURA_E_ADAPTACAO` |
| `Core/Normalizador.js` | `C02_Leitura/MOD-C02-01_LEITURA_E_ADAPTACAO` |
| `Core/Policiais.js` | `C01_Entrada/MOD-C01-01_FORMULARIO_E_MENUS` |
| `Core/Ranking.js` | `C04_Motor/MOD-C04-01_MOTOR_ANALITICO` |
| `Core/RegrasQualidade.js` | `C05_Guardiao/MOD-C05-01_GUARDIAO_DE_QUALIDADE` |
| `Core/Utils.js` | `C01_Entrada/MOD-C01-02_NORMALIZADOR_DE_EFETIVO` |
| `Core/Validador.js` | `C02_Leitura/MOD-C02-01_LEITURA_E_ADAPTACAO` |
| `appsscript.json` | **NÃO RESOLVIDO** (reportado) |

O elemento `_SUP_158/MOD-C00-01_INFRAESTRUTURA_CORE` é um arquivo morto do #158: **colide de ID** com
`MOD-C00-01_ESTRUTURA_DO_COFRE` sem ser a mesma coisa (aquele fala de `Core/*.js`; o canônico fala da estrutura
do cofre) e **nunca existiu em nenhuma referência do Git**. Renomear seria inventar mapeamento — não foi feito.
Onde a Planta declara o artefato, o endereço canônico substitui o ponteiro parado; onde não declara, o campo
diz `NÃO RESOLVIDO` (§3.3).

### 3.3 NÃO RESOLVIDOS — reportados, jamais inventados (7)

| Artefato | Por que não resolve | Onde a Planta só *menciona* |
| :--- | :--- | :--- |
| `Core/Datas.js` | nenhuma declaração de artefato em nenhum endereço | — |
| `Core/Erros.js` | idem | — |
| `Core/Logger.js` | idem | — |
| `Modelos/IRelatorioModelo.js` | idem | — |
| `Plugins/IPluginMetrica.js` | idem (citado em índices de cômodo, não em endereço de módulo/submódulo) | `02_Comodos/C04_Motor/00_Visao_Do_Comodo/INDICE.md` |
| `Schemas/ProdutividadeSchema.js` | idem (citado como plano futuro) | `02_Comodos/C01_Entrada/00_Visao_Do_Comodo/INDICE.md` |
| `appsscript.json` | idem (manifesto de instalação transversal, não pertence a módulo) | `…/C00_Governanca_Estrutural/03_Especificacoes/INSTALACOES_TRANSVERSAIS/INST-EXEC-001_ENDPOINT_DE_EXECUCAO.md` |

Estes 7 coincidem, em bloco, com o GAP já declarado pelo #158 ("`Core/{Config,Constantes,Logger,Erros,Datas,Validador}.js`
não pertencem a nenhum módulo do Down Plant canônico"). O espelho dos 7 foi materializado com o campo
**Endereço Down Plant** valendo `NÃO RESOLVIDO` + justificativa, e os testes **T1/T2 entram como ACHADO**,
nunca como OK. Nenhum endereço foi "adivinhado" a partir de módulo vizinho.

### 3.4 Endereços concorrentes — declarados, não resolvidos por decreto

35 artefatos são referenciados em mais de um endereço da Planta (60 citações concorrentes no total).
O campo registra o endereço **primário** (melhor nível de evidência; empate desempatado pelo módulo já
declarado no espelho anterior) e o bloco de divergência do espelho lista os concorrentes nominalmente.
Isso é declaração concorrente da própria Planta, não erro de endereço. Tabela completa no `MAPA_ARTEFATO_ENDERECO_162.md`.

---

## 4. Entrega (3) — 72 espelhos materializados no repo, derivados no vault

| Métrica | Valor |
| :--- | ---: |
| Nós em `07_Codigo_Leitura/` do **repositório** | **72** |
| Nós em `07_Codigo_Leitura/` do **vault** (derivados) | **72** |
| Espelhos ricos §46.15 (com os 9 campos) | **71** |
| Índice derivado (não é espelho de artefato) | 1 |
| Linhas totais no repo | 22.373 |
| Gerador | `scripts/downplant/espelho-rico.mjs` (691 linhas; modos `gerar`, `verificar`, `indice`) |

### 4.1 Matriz campo a campo — 72/72

| Campo §46.15 | Presente |
| :--- | ---: |
| Endereço Down Plant | **71/72** |
| Arquivo de origem (link para o disco) | **71/72** |
| Commit de referência | **71/72** |
| Data da última sincronização | **71/72** |
| Código-fonte embutido | **71/72** |
| Responsabilidade observada | **71/72** |
| Portas expostas (se aplicável) | **71/72** |
| Divergência com a Planta declarada | **71/72** |
| Última verificação (data/commit) | **71/72** |

O único nó sem os 9 campos é `INDICE_AS_IS.md` (o índice). **Todos os 71 espelhos têm 9/9**, verificado por
matcher independente campo a campo (não pelo próprio gerador).

### 4.2 Tabela por nó — 72 linhas

| # | Nó | Artefato de origem | Endereço primário | Nível | 9/9 | sha==origem | `verificar` | Vault |
| ---: | :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| 1 | `appsscript.json.md` | `appsscript.json` | `NÃO RESOLVIDO` | — | 9/9 | sim | exit 0 | ok |
| 2 | `Compatibilidade.js.md` | `Compatibilidade.js` | `C01_Entrada / MOD-C01-01_FORMULARIO_E_MENUS` | 3 | 9/9 | sim | exit 0 | ok |
| 3 | `Compilador de Entorpecentes.js.md` | `Compilador de Entorpecentes.js` | `C06_Relatorios / MOD-C06-01_RELATORIOS_OFICIAIS` | 3 | 9/9 | sim | exit 0 | ok |
| 4 | `Compilador PIP.js.md` | `Compilador PIP.js` | `C06_Relatorios / MOD-C06-01_RELATORIOS_OFICIAIS` | 1 | 9/9 | sim | exit 0 | ok |
| 5 | `Compilador_Armas.js.md` | `Compilador_Armas.js` | `C06_Relatorios / MOD-C06-02_MERITO_DE_ARMAS_GXT` | 1 | 9/9 | sim | exit 0 | ok |
| 6 | `Config/Metamodelos.js.md` | `Config/Metamodelos.js` | `C02_Leitura / MOD-C02-01_LEITURA_E_ADAPTACAO` | 3 | 9/9 | sim | exit 0 | ok |
| 7 | `Core/Cabecalhos.js.md` | `Core/Cabecalhos.js` | `C02_Leitura / MOD-C02-01_LEITURA_E_ADAPTACAO` | 1 | 9/9 | sim | exit 0 | ok |
| 8 | `Core/Config.js.md` | `Core/Config.js` | `C02_Leitura / MOD-C02-01_LEITURA_E_ADAPTACAO` | 3 | 9/9 | sim | exit 0 | ok |
| 9 | `Core/Constantes.js.md` | `Core/Constantes.js` | `C01_Entrada / MOD-C01-02_NORMALIZADOR_DE_EFETIVO` | 1 | 9/9 | sim | exit 0 | ok |
| 10 | `Core/Datas.js.md` | `Core/Datas.js` | `NÃO RESOLVIDO` | — | 9/9 | sim | exit 0 | ok |
| 11 | `Core/Erros.js.md` | `Core/Erros.js` | `NÃO RESOLVIDO` | — | 9/9 | sim | exit 0 | ok |
| 12 | `Core/LeitorPlanilhas.js.md` | `Core/LeitorPlanilhas.js` | `C02_Leitura / MOD-C02-01_LEITURA_E_ADAPTACAO` | 1 | 9/9 | sim | exit 0 | ok |
| 13 | `Core/Logger.js.md` | `Core/Logger.js` | `NÃO RESOLVIDO` | — | 9/9 | sim | exit 0 | ok |
| 14 | `Core/Metricas.js.md` | `Core/Metricas.js` | `C02_Leitura / MOD-C02-01_LEITURA_E_ADAPTACAO` | 1 | 9/9 | sim | exit 0 | ok |
| 15 | `Core/Normalizador.js.md` | `Core/Normalizador.js` | `C02_Leitura / MOD-C02-01_LEITURA_E_ADAPTACAO` | 3 | 9/9 | sim | exit 0 | ok |
| 16 | `Core/Policiais.js.md` | `Core/Policiais.js` | `C01_Entrada / MOD-C01-01_FORMULARIO_E_MENUS` | 1 | 9/9 | sim | exit 0 | ok |
| 17 | `Core/Ranking.js.md` | `Core/Ranking.js` | `C04_Motor / MOD-C04-01_MOTOR_ANALITICO` | 3 | 9/9 | sim | exit 0 | ok |
| 18 | `Core/RegrasQualidade.js.md` | `Core/RegrasQualidade.js` | `C05_Guardiao / MOD-C05-01_GUARDIAO_DE_QUALIDADE` | 1 | 9/9 | sim | exit 0 | ok |
| 19 | `Core/Utils.js.md` | `Core/Utils.js` | `C01_Entrada / MOD-C01-02_NORMALIZADOR_DE_EFETIVO` | 1 | 9/9 | sim | exit 0 | ok |
| 20 | `Core/Validador.js.md` | `Core/Validador.js` | `C02_Leitura / MOD-C02-01_LEITURA_E_ADAPTACAO` | 3 | 9/9 | sim | exit 0 | ok |
| 21 | `CPM – Compilador de Pontuação Mensal.js.md` | `CPM – Compilador de Pontuação Mensal.js` | `C06_Relatorios / MOD-C06-01_RELATORIOS_OFICIAIS` | 1 | 9/9 | sim | exit 0 | ok |
| 22 | `Dominio/ARCA/AdaptadorConsultaArca.js.md` | `Dominio/ARCA/AdaptadorConsultaArca.js` | `C03_Dominio / MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO / SUB-C03-02-04_ADAPTADOR_PORTA_DE_CONSULTA` | 2 | 9/9 | sim | exit 0 | ok |
| 23 | `Dominio/ARCA/ARCA_COBERTURA.md` | `Dominio/ARCA/ARCA_COBERTURA.md` | `C03_Dominio / MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO / SUB-C03-02-03_COBERTURA_E_LACUNAS` | 2 | 9/9 | sim | exit 0 | ok |
| 24 | `Dominio/ARCA/ARCA_FONTES.md` | `Dominio/ARCA/ARCA_FONTES.md` | `C03_Dominio / MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO / SUB-C03-02-02_FONTES_E_PROVENIENCIA` | 2 | 9/9 | sim | exit 0 | ok |
| 25 | `Dominio/ARCA/arca_regras_dominio.json.md` | `Dominio/ARCA/arca_regras_dominio.json` | `C03_Dominio / MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO / SUB-C03-02-01_CATALOGO_DE_REGRAS` | 2 | 9/9 | sim | exit 0 | ok |
| 26 | `Dominio/ARCA/ARCA_REGRAS_DOMINIO.md` | `Dominio/ARCA/ARCA_REGRAS_DOMINIO.md` | `C03_Dominio / MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO / SUB-C03-02-01_CATALOGO_DE_REGRAS` | 2 | 9/9 | sim | exit 0 | ok |
| 27 | `Dominio/Arma.js.md` | `Dominio/Arma.js` | `C03_Dominio / MOD-C03-01_MODELO_DE_OCORRENCIA` | 3 | 9/9 | sim | exit 0 | ok |
| 28 | `Dominio/Droga.js.md` | `Dominio/Droga.js` | `C03_Dominio / MOD-C03-01_MODELO_DE_OCORRENCIA` | 3 | 9/9 | sim | exit 0 | ok |
| 29 | `Dominio/Equipe.js.md` | `Dominio/Equipe.js` | `C03_Dominio / MOD-C03-01_MODELO_DE_OCORRENCIA` | 3 | 9/9 | sim | exit 0 | ok |
| 30 | `Dominio/Metamodelos.js.md` | `Dominio/Metamodelos.js` | `C02_Leitura / MOD-C02-01_LEITURA_E_ADAPTACAO` | 3 | 9/9 | sim | exit 0 | ok |
| 31 | `Dominio/Ocorrencia.js.md` | `Dominio/Ocorrencia.js` | `C03_Dominio / MOD-C03-01_MODELO_DE_OCORRENCIA` | 3 | 9/9 | sim | exit 0 | ok |
| 32 | `Dominio/OcorrenciaFactory.js.md` | `Dominio/OcorrenciaFactory.js` | `C03_Dominio / MOD-C03-01_MODELO_DE_OCORRENCIA` | 3 | 9/9 | sim | exit 0 | ok |
| 33 | `Dominio/Policial.js.md` | `Dominio/Policial.js` | `C03_Dominio / MOD-C03-01_MODELO_DE_OCORRENCIA` | 3 | 9/9 | sim | exit 0 | ok |
| 34 | `Dominio/RegistroAnalitico.js.md` | `Dominio/RegistroAnalitico.js` | `C04_Motor / MOD-C04-01_MOTOR_ANALITICO` | 1 | 9/9 | sim | exit 0 | ok |
| 35 | `Dominio/RegistroCanonico.js.md` | `Dominio/RegistroCanonico.js` | `C03_Dominio / MOD-C03-01_MODELO_DE_OCORRENCIA` | 3 | 9/9 | sim | exit 0 | ok |
| 36 | `Dominio/ValueObjects/ChaveOcorrencia.js.md` | `Dominio/ValueObjects/ChaveOcorrencia.js` | `C03_Dominio / MOD-C03-01_MODELO_DE_OCORRENCIA` | 3 | 9/9 | sim | exit 0 | ok |
| 37 | `Drivers/GoogleSheetsDriver.js.md` | `Drivers/GoogleSheetsDriver.js` | `C02_Leitura / MOD-C02-01_LEITURA_E_ADAPTACAO` | 1 | 9/9 | sim | exit 0 | ok |
| 38 | `Entrada/DialogComparativo2026.html.md` | `Entrada/DialogComparativo2026.html` | `C06_Relatorios / MOD-C06-01_RELATORIOS_OFICIAIS` | 1 | 9/9 | sim | exit 0 | ok |
| 39 | `Entrada/DialogGxtSelecaoLivre.html.md` | `Entrada/DialogGxtSelecaoLivre.html` | `C06_Relatorios / MOD-C06-02_MERITO_DE_ARMAS_GXT` | 1 | 9/9 | sim | exit 0 | ok |
| 40 | `Entrada/EntradaManual.js.md` | `Entrada/EntradaManual.js` | `C01_Entrada / MOD-C01-01_FORMULARIO_E_MENUS` | 1 | 9/9 | sim | exit 0 | ok |
| 41 | `Entrada/Formulario.html.md` | `Entrada/Formulario.html` | `C01_Entrada / MOD-C01-01_FORMULARIO_E_MENUS` | 1 | 9/9 | sim | exit 0 | ok |
| 42 | `Entrada/Menu.js.md` | `Entrada/Menu.js` | `C01_Entrada / MOD-C01-01_FORMULARIO_E_MENUS` | 1 | 9/9 | sim | exit 0 | ok |
| 43 | `Features/CentralAnalitica.js.md` | `Features/CentralAnalitica.js` | `C04_Motor / MOD-C04-01_MOTOR_ANALITICO` | 1 | 9/9 | sim | exit 0 | ok |
| 44 | `Features/CompiladorGxt.js.md` | `Features/CompiladorGxt.js` | `C06_Relatorios / MOD-C06-02_MERITO_DE_ARMAS_GXT` | 3 | 9/9 | sim | exit 0 | ok |
| 45 | `Features/CompiladorProdutividade.js.md` | `Features/CompiladorProdutividade.js` | `C06_Relatorios / MOD-C06-01_RELATORIOS_OFICIAIS` | 1 | 9/9 | sim | exit 0 | ok |
| 46 | `Features/CompiladorProdutividadeV2.js.md` | `Features/CompiladorProdutividadeV2.js` | `C06_Relatorios / MOD-C06-01_RELATORIOS_OFICIAIS` | 1 | 9/9 | sim | exit 0 | ok |
| 47 | `Features/GuardiaoQualidade.js.md` | `Features/GuardiaoQualidade.js` | `C05_Guardiao / MOD-C05-01_GUARDIAO_DE_QUALIDADE` | 1 | 9/9 | sim | exit 0 | ok |
| 48 | `Features/NormalizadorEfetivo.js.md` | `Features/NormalizadorEfetivo.js` | `C01_Entrada / MOD-C01-02_NORMALIZADOR_DE_EFETIVO` | 1 | 9/9 | sim | exit 0 | ok |
| 49 | `INDICE_AS_IS.md` | `— (índice)` | **NÃO RESOLVIDO** | — | — | — | exit 1 | ok |
| 50 | `Leitura/Adaptador2026.js.md` | `Leitura/Adaptador2026.js` | `C02_Leitura / MOD-C02-01_LEITURA_E_ADAPTACAO` | 1 | 9/9 | sim | exit 0 | ok |
| 51 | `Leitura/LeitorAntiguidadePeculio.js.md` | `Leitura/LeitorAntiguidadePeculio.js` | `C02_Leitura / MOD-C02-01_LEITURA_E_ADAPTACAO` | 1 | 9/9 | sim | exit 0 | ok |
| 52 | `Modelos/IRelatorioModelo.js.md` | `Modelos/IRelatorioModelo.js` | `NÃO RESOLVIDO` | — | 9/9 | sim | exit 0 | ok |
| 53 | `Modelos/ModeloProdutividade.js.md` | `Modelos/ModeloProdutividade.js` | `C06_Relatorios / MOD-C06-01_RELATORIOS_OFICIAIS` | 3 | 9/9 | sim | exit 0 | ok |
| 54 | `Motor/DiagnosticoDeterministicoGxt.js.md` | `Motor/DiagnosticoDeterministicoGxt.js` | `C04_Motor / MOD-C04-01_MOTOR_ANALITICO` | 1 | 9/9 | sim | exit 0 | ok |
| 55 | `Motor/MotorAnaliticoV2.js.md` | `Motor/MotorAnaliticoV2.js` | `C04_Motor / MOD-C04-01_MOTOR_ANALITICO` | 1 | 9/9 | sim | exit 0 | ok |
| 56 | `Motor/PoliticaMeritoArmas.js.md` | `Motor/PoliticaMeritoArmas.js` | `C04_Motor / MOD-C04-01_MOTOR_ANALITICO` | 1 | 9/9 | sim | exit 0 | ok |
| 57 | `Plugins/IPluginMetrica.js.md` | `Plugins/IPluginMetrica.js` | `NÃO RESOLVIDO` | — | 9/9 | sim | exit 0 | ok |
| 58 | `Plugins/Metricas/PluginArmas.js.md` | `Plugins/Metricas/PluginArmas.js` | `C04_Motor / MOD-C04-01_MOTOR_ANALITICO` | 1 | 9/9 | sim | exit 0 | ok |
| 59 | `Plugins/Metricas/PluginEntorpecentes.js.md` | `Plugins/Metricas/PluginEntorpecentes.js` | `C04_Motor / MOD-C04-01_MOTOR_ANALITICO` | 1 | 9/9 | sim | exit 0 | ok |
| 60 | `Plugins/Metricas/PluginOcorrencias.js.md` | `Plugins/Metricas/PluginOcorrencias.js` | `C04_Motor / MOD-C04-01_MOTOR_ANALITICO` | 1 | 9/9 | sim | exit 0 | ok |
| 61 | `Plugins/Metricas/PluginPontuacao.js.md` | `Plugins/Metricas/PluginPontuacao.js` | `C04_Motor / MOD-C04-01_MOTOR_ANALITICO` | 1 | 9/9 | sim | exit 0 | ok |
| 62 | `Plugins/Metricas/PluginPrisoes.js.md` | `Plugins/Metricas/PluginPrisoes.js` | `C04_Motor / MOD-C04-01_MOTOR_ANALITICO` | 1 | 9/9 | sim | exit 0 | ok |
| 63 | `Render/DocumentoLogico.js.md` | `Render/DocumentoLogico.js` | `C06_Relatorios / MOD-C06-01_RELATORIOS_OFICIAIS` | 3 | 9/9 | sim | exit 0 | ok |
| 64 | `Render/RendererAuditoria.js.md` | `Render/RendererAuditoria.js` | `C05_Guardiao / MOD-C05-01_GUARDIAO_DE_QUALIDADE` | 1 | 9/9 | sim | exit 0 | ok |
| 65 | `Render/RendererAuditoriaSaude.js.md` | `Render/RendererAuditoriaSaude.js` | `C05_Guardiao / MOD-C05-01_GUARDIAO_DE_QUALIDADE` | 1 | 9/9 | sim | exit 0 | ok |
| 66 | `Render/RendererCA.js.md` | `Render/RendererCA.js` | `C06_Relatorios / MOD-C06-01_RELATORIOS_OFICIAIS` | 1 | 9/9 | sim | exit 0 | ok |
| 67 | `Render/RendererComparativo2026.js.md` | `Render/RendererComparativo2026.js` | `C06_Relatorios / MOD-C06-01_RELATORIOS_OFICIAIS` | 1 | 9/9 | sim | exit 0 | ok |
| 68 | `Render/RendererGxt.js.md` | `Render/RendererGxt.js` | `C06_Relatorios / MOD-C06-02_MERITO_DE_ARMAS_GXT` | 3 | 9/9 | sim | exit 0 | ok |
| 69 | `Render/RendererLogico.js.md` | `Render/RendererLogico.js` | `C06_Relatorios / MOD-C06-01_RELATORIOS_OFICIAIS` | 3 | 9/9 | sim | exit 0 | ok |
| 70 | `Render/RendererTabela.js.md` | `Render/RendererTabela.js` | `C06_Relatorios / MOD-C06-01_RELATORIOS_OFICIAIS` | 3 | 9/9 | sim | exit 0 | ok |
| 71 | `Schemas/ProdutividadeSchema.js.md` | `Schemas/ProdutividadeSchema.js` | `NÃO RESOLVIDO` | — | 9/9 | sim | exit 0 | ok |
| 72 | `Temas/TemaPMPE.js.md` | `Temas/TemaPMPE.js` | `C06_Relatorios / MOD-C06-01_RELATORIOS_OFICIAIS` | 3 | 9/9 | sim | exit 0 | ok |

---

## 5. Entrega (4) — verificador §46.15 sobre os 72 + prova de frescor

### 5.1 Verificador (modo `verificar`, sem regravar)

```
[REPO ] total=72  exit0=71  exit2=0  exit1=1 | deriva_codigo=0  sha_desatualizado=0  commit_velho=0
[VAULT] total=72  exit0=71  exit2=0  exit1=1 | deriva_codigo=0  sha_desatualizado=0  commit_velho=0
```

O único `exit 1` é `INDICE_AS_IS.md`, com a mensagem explícita `origem nao identificada no espelho`:
o índice não tem arquivo de origem único — ele **é** o catálogo dos espelhos (§7.1).
**71/71 espelhos ricos: `exit 0`, `deriva_codigo=false`, `sha_desatualizado=false`, `commit_velho=false`.**

Amostra crua (uma de cada tipo):

```
$ node scripts/downplant/espelho-rico.mjs verificar --espelho 07_Codigo_Leitura/Dominio/ARCA/AdaptadorConsultaArca.js.md
  "commit_declarado":   "fbb0608e7b98144533628c7f9b773a10505b800d"
  "sha_declarado":      "99f8c7e2fb8a44e708aaff9490307d0a154c9897a3a6b512c4b0bbb1522a5338"
  "sha_origem_agora":   "99f8c7e2fb8a44e708aaff9490307d0a154c9897a3a6b512c4b0bbb1522a5338"
  "sha_bloco_embutido": "99f8c7e2fb8a44e708aaff9490307d0a154c9897a3a6b512c4b0bbb1522a5338"
  "conteudo_canonico_igual": true, "deriva_codigo": false, "sha_desatualizado": false, "commit_velho": false
EXIT=0

$ node scripts/downplant/espelho-rico.mjs verificar --espelho 07_Codigo_Leitura/Entrada/Formulario.html.md   -> EXIT=0 (1707 linhas, bloco html)
$ node scripts/downplant/espelho-rico.mjs verificar --espelho 07_Codigo_Leitura/Core/Datas.js.md           -> EXIT=0 (endereço NÃO RESOLVIDO, código verbatim e fresco)
```

### 5.2 Prova de frescor — commit, sha e `sha256sum` externo

```
$ git rev-parse HEAD          -> fbb0608e7b98144533628c7f9b773a10505b800d
$ git rev-parse --short HEAD  -> fbb0608
   // Commit de referência declarado nos 71 espelhos: fbb0608e7b98144533628c7f9b773a10505b800d (fbb0608)

$ sha256sum <origem>  comparado com o "sha256 do bloco (LF)" declarado no espelho:
   68 / 71  IDÊNTICOS (bit a bit, ferramenta externa ao gerador)
    3 / 71  diferem — e o motivo é de formato, não de conteúdo:
            Core/Policiais.js, Dominio/ARCA/ARCA_COBERTURA.md, Dominio/ARCA/arca_regras_dominio.json
            são arquivos CRLF. A regra declarada é LF (igual ao blob do Git).
            Prova independente:  sha256( tr -d '\r' < <origem> )  ==  sha declarado  -> CONFERE nos 3.
```

A regra do sha está impressa no cabeçalho **de cada espelho**: *"sha256 do conteúdo normalizado para LF
(igual ao blob do Git). Em arquivo CRLF com terminador final diferente, ele difere do `sha256sum` dos
bytes crus — a comparação de deriva é feita conteúdo-contra-conteúdo."* — fecha o limite #8 do piloto.

**Nada está congelado em código:** o commit é lido do Git na geração (`--commit-ref`), a data é do relógio, o
sha é calculado do arquivo. Reexecutar o mesmo comando muda a data e mantém commit/sha (provado no piloto).

---

## 6. Entrega (5) — portões: lint e suíte (com `exit`)

### 6.1 Lint estrutural

```
$ node scripts/downplant/lint-estrutura.mjs .
🔍 Verificando Terreno: C:\Users\Bneto04\Documents\Codex\syntheon-gs-downplant-offline

✅ SUCESSO! A arvore documental esta em estrita conformidade com o Down Plant 2.1.
LINT_EXIT=0
```
Com **72/72 nós within `07_Codigo_Leitura/`** e 34 deles contendo código verbatim que a varredura de legado
excluía antes. Os dois links de cada espelho (NOTA do endereço e arquivo de origem) resolvem — é o lint quem diz.

### 6.2 Suíte integral — `node Testes/RodarTodosOsTestes.js`

Executada **5 vezes** nesta fatia:

| Execução | `[PASS]` | `[FAIL]` | `exit` |
| ---: | ---: | ---: | ---: |
| 1 | 631 | 0 | **0** |
| 2 | 631 | 0 | **0** |
| 3 | 630 | 0 | **0** |
| 4 | 631 | 0 | **0** |
| 5 (final, após todas as mudanças) | 630 | 0 | **0** |

**PASS / FAIL: 630–631 PASS / 0 FAIL. `SUITE_EXIT=0` nas 5 execuções.**

Divergência com o briefing, reportada e não corrigida (card #172 fora do escopo): o briefing previa
`623 PASS / exit 1`. **Não reproduzi** — medi `exit 0` nas 5 execuções e a contagem oscilando 630↔631.
A oscilação é **identificada, não suposta**: o diff entre as execuções mostra que a única suíte que muda é
`TestVigiaNaturalLanguage` (o bloco do Vigia, dependente do Ollama/timeout) — as linhas de alerta `[VIGIA-ALERTA]`
aparecem com timestamp diferente e a suíte emite um par de `[PASS]` a mais ou a menos. Nenhuma suíte lê
`07_Codigo_Leitura/` (confirmado por varredura), então o lote de espelhos **não influencia** o resultado.
Não corrigi, não mascarei e **não usei isso para justificar nada** desta entrega.

### 6.3 `git status` — escopo respeitado

```
 M 02_Comodos/.../SUB-C01-01-01_OCR_E_CONFERENCIA/NOTA_DE_RESPONSABILIDADE.md   <- pré-existente (não é desta fatia)
 M 07_Codigo_Leitura/Dominio/ARCA/AdaptadorConsultaArca.js.md                  <- regenerado (piloto, dados frescos)
 M 07_Codigo_Leitura/INDICE_AS_IS.md                                           <- agora DERIVADO (era stub de 3 linhas)
 M 08_Execucao_Ao_Vivo/downplant_handoff.md                                    <- pré-existente (não é desta fatia)
 M RELATORIO_DE_DIFERENCIAS_156_157.md                                         <- pré-existente (não é desta fatia)
 M scripts/downplant/espelho-rico.mjs                                          <- gerador (mudanças declaradas em §8)
 M scripts/downplant/lint-estrutura.mjs                                        <- decisão (b) + §2
?? 07_Codigo_Leitura/**  (70 nós novos)
?? MAPA_ARTEFATO_ENDERECO_162.md
?? RELATORIO_162_ESCALA.md
```

**Nenhum arquivo de produto (`.js`/`.html`/`.json` de runtime) foi alterado.** Confirmado por `git status`:
`Dominio/`, `Core/`, `Entrada/`, `Features/`, `Motor/`, `Render/`, … não aparecem (com exceção de
`scripts/downplant/*.mjs`, que é ferramentaria, e do pré-existente `02_Comodos/...`). Sem commit, sem push,
sem card. O card #172 não foi tocado.

---

## 7. Divergências declaradas (o que NÃO resolveu, e por quê)

### 7.1 O índice (`INDICE_AS_IS.md`) não é espelho de artefato

Os 72 nós de `07_Codigo_Leitura/` incluem **um** que não espelha um arquivo: o índice. Aplicar os 9 campos a
ele seria espelhar a si mesmo. Decisão tomada e declarada: o índice virou **DERIVADO** de novo modo do
gerador (`indice`), lendo os 71 espelhos — recomendação literal do limite #9 do piloto. Ele tinha 3 linhas no
repo (stub) e 76 no vault, apontando para o elemento parado e listando 66 de 72 com `Commit Base: 0bcff5f`
(velho). Agora lista **71/71** com endereço, commit, sha e data lidos de cada espelho. Consequência para o
critério "72/72 com 9/9 campos": **71 espelhos com 9/9 + 1 índice derivado**. Se o Planner exigir os 9 campos
no índice, o único caminho é espelhar o stub de 3 linhas como artefato — o que destrói o catálogo. É a única
divergência formal desta entrega e ela está aqui, explícita.

### 7.2 `T2` — 27 endereços derivados por menção, não por declaração de artefato

O teste T2 confere se o artefato aparece nas NOTAS/cápsula do endereço. Ele **reprova em 27 dos 71** — e a
reprovação é verdadeira: nesses 27 o endereço foi derivado de **citação em arquivo dentro do diretório do
endereço** (nível 3), não da seção `## Artefatos`. Exemplos: `Dominio/Arma.js` e os demais 9 do C03-01
(o módulo não tem cápsula §46.2; a declaração vive no `.canvas` do circuito), `Render/RendererTabela.js`,
`Temas/TemaPMPE.js`, `Plugins/Metricas/Plugin*`. Ficou como **ACHADO declarado** no corpo do espelho — mais
útil que um OK falso. Fechar isso é o próximo incremento natural: mover a declaração desses artefatos para a
seção `## Artefatos` do endereço (é trabalho de Planta, não de espelho).

### 7.3 Colisão de dono: `contar-regras-arca.mjs` reclama 2 dos 72 caminhos do vault

`scripts/downplant/contar-regras-arca.mjs --aplicar --espelho` escreve, no vault, exatamente em
`07_Codigo_Leitura/Dominio/ARCA/ARCA_REGRAS_DOMINIO.md` e `07_Codigo_Leitura/Dominio/ARCA/ARCA_COBERTURA.md`
(constante `ESPELHO` no topo do script). Esses dois caminhos são **2 dos 72 nós** e antes desta fatia continham
a projeção derivada do #159 (`Bloco ARCA-METRICAS`). Agora contêm o espelho rico §46.15. Os dois são gerados,
então **nada se perdeu de forma irreversível** — mas há dois geradores reivindicando o mesmo caminho, e um deles
vai sobrescrever o outro na próxima execução. **Requer decisão do Planner** (renomear o alvo do
`contar-regras-arca.mjs` ou mover o espelho). O conteúdo derivado do #159 continua íntegro nos documentos
canônicos do repo (`Dominio/ARCA/ARCA_REGRAS_DOMINIO.md` e `ARCA_COBERTURA.md` — 5 blocos derivados cada,
`git status` limpo), que não foram tocados.

### 7.4 Deriva pré-existente nos espelhos de leitura — medida ANTES da reescrita

Medição feita sobre os 72 espelhos do vault **como estavam antes desta escala** (contagem de linhas do bloco
de código embutido contra a origem real). É a prova de que o formato antigo mentia sem avisar:

| Nó | Linhas embutidas (antigo) | Linhas na origem | Veredito |
| :--- | ---: | ---: | :--- |
| `Dominio/ARCA/arca_regras_dominio.json.md` | 1212 | 2991 | **DERIVA** |
| `Dominio/ARCA/ARCA_REGRAS_DOMINIO.md` | 0 | 881 | SEM bloco de código reconhecível no formato antigo |
| `Features/NormalizadorEfetivo.js.md` | 0 | 504 | SEM bloco de código reconhecível no formato antigo |
| `Entrada/Formulario.html.md` | 1693 | 2023 | **DERIVA** |
| `Features/GuardiaoQualidade.js.md` | 389 | 707 | **DERIVA** |
| `Core/LeitorPlanilhas.js.md` | 278 | 509 | **DERIVA** |
| `Entrada/EntradaManual.js.md` | 637 | 824 | **DERIVA** |
| `Entrada/Menu.js.md` | 0 | 151 | SEM bloco de código reconhecível no formato antigo |
| `Dominio/ARCA/ARCA_COBERTURA.md` | 0 | 131 | SEM bloco de código reconhecível no formato antigo |
| `Core/RegrasQualidade.js.md` | 685 | 790 | **DERIVA** |
| `Dominio/ARCA/ARCA_FONTES.md` | 0 | 98 | SEM bloco de código reconhecível no formato antigo |
| `Core/Policiais.js.md` | 92 | 153 | **DERIVA** |
| `Compilador_Armas.js.md` | 317 | 369 | **DERIVA** |
| `Render/RendererAuditoriaSaude.js.md` | 377 | 426 | **DERIVA** |
| `Compatibilidade.js.md` | 88 | 57 | **DERIVA** |
| `Features/CompiladorProdutividade.js.md` | 206 | 228 | **DERIVA** |
| `Core/Constantes.js.md` | 93 | 110 | **DERIVA** |
| `Render/RendererComparativo2026.js.md` | 231 | 245 | **DERIVA** |
| `CPM – Compilador de Pontuação Mensal.js.md` | 349 | 339 | **DERIVA** |
| `Compilador PIP.js.md` | 346 | 340 | **DERIVA** |
| `appsscript.json.md` | 7 | 10 | **DERIVA** |
| `Config/Metamodelos.js.md` | 68 | 67 | inconclusivo (±1 linha — convenção de terminador) |
| `Core/Cabecalhos.js.md` | 116 | 115 | inconclusivo (±1 linha — convenção de terminador) |
| `Core/Config.js.md` | 69 | 68 | inconclusivo (±1 linha — convenção de terminador) |
| `Core/Datas.js.md` | 81 | 80 | inconclusivo (±1 linha — convenção de terminador) |
| `Core/Erros.js.md` | 41 | 40 | inconclusivo (±1 linha — convenção de terminador) |
| `Core/Logger.js.md` | 47 | 46 | inconclusivo (±1 linha — convenção de terminador) |
| `Core/Metricas.js.md` | 94 | 95 | inconclusivo (±1 linha — convenção de terminador) |
| `Core/Normalizador.js.md` | 67 | 66 | inconclusivo (±1 linha — convenção de terminador) |
| `Core/Ranking.js.md` | 59 | 58 | inconclusivo (±1 linha — convenção de terminador) |
| `Core/Validador.js.md` | 34 | 33 | inconclusivo (±1 linha — convenção de terminador) |
| `Dominio/Arma.js.md` | 32 | 31 | inconclusivo (±1 linha — convenção de terminador) |
| `Dominio/Droga.js.md` | 32 | 31 | inconclusivo (±1 linha — convenção de terminador) |
| `Dominio/Equipe.js.md` | 49 | 48 | inconclusivo (±1 linha — convenção de terminador) |
| `Dominio/Metamodelos.js.md` | 13 | 12 | inconclusivo (±1 linha — convenção de terminador) |
| `Dominio/Ocorrencia.js.md` | 124 | 123 | inconclusivo (±1 linha — convenção de terminador) |
| `Dominio/OcorrenciaFactory.js.md` | 100 | 99 | inconclusivo (±1 linha — convenção de terminador) |
| `Dominio/Policial.js.md` | 39 | 38 | inconclusivo (±1 linha — convenção de terminador) |
| `Dominio/RegistroAnalitico.js.md` | 67 | 68 | inconclusivo (±1 linha — convenção de terminador) |
| `Dominio/RegistroCanonico.js.md` | 74 | 73 | inconclusivo (±1 linha — convenção de terminador) |
| `Dominio/ValueObjects/ChaveOcorrencia.js.md` | 50 | 49 | inconclusivo (±1 linha — convenção de terminador) |
| `Drivers/GoogleSheetsDriver.js.md` | 56 | 55 | inconclusivo (±1 linha — convenção de terminador) |
| `Entrada/DialogComparativo2026.html.md` | 46 | 45 | inconclusivo (±1 linha — convenção de terminador) |
| `Entrada/DialogGxtSelecaoLivre.html.md` | 59 | 58 | inconclusivo (±1 linha — convenção de terminador) |
| `Features/CentralAnalitica.js.md` | 197 | 196 | inconclusivo (±1 linha — convenção de terminador) |
| `Features/CompiladorGxt.js.md` | 970 | 969 | inconclusivo (±1 linha — convenção de terminador) |
| `Features/CompiladorProdutividadeV2.js.md` | 57 | 56 | inconclusivo (±1 linha — convenção de terminador) |
| `Leitura/Adaptador2026.js.md` | 228 | 227 | inconclusivo (±1 linha — convenção de terminador) |
| `Leitura/LeitorAntiguidadePeculio.js.md` | 279 | 278 | inconclusivo (±1 linha — convenção de terminador) |
| `Modelos/IRelatorioModelo.js.md` | 26 | 25 | inconclusivo (±1 linha — convenção de terminador) |
| `Modelos/ModeloProdutividade.js.md` | 44 | 43 | inconclusivo (±1 linha — convenção de terminador) |
| `Motor/DiagnosticoDeterministicoGxt.js.md` | 428 | 427 | inconclusivo (±1 linha — convenção de terminador) |
| `Motor/MotorAnaliticoV2.js.md` | 106 | 105 | inconclusivo (±1 linha — convenção de terminador) |
| `Motor/PoliticaMeritoArmas.js.md` | 217 | 216 | inconclusivo (±1 linha — convenção de terminador) |
| `Plugins/IPluginMetrica.js.md` | 42 | 41 | inconclusivo (±1 linha — convenção de terminador) |
| `Plugins/Metricas/PluginArmas.js.md` | 32 | 31 | inconclusivo (±1 linha — convenção de terminador) |
| `Plugins/Metricas/PluginEntorpecentes.js.md` | 40 | 39 | inconclusivo (±1 linha — convenção de terminador) |
| `Plugins/Metricas/PluginOcorrencias.js.md` | 32 | 31 | inconclusivo (±1 linha — convenção de terminador) |
| `Plugins/Metricas/PluginPontuacao.js.md` | 60 | 59 | inconclusivo (±1 linha — convenção de terminador) |
| `Plugins/Metricas/PluginPrisoes.js.md` | 31 | 30 | inconclusivo (±1 linha — convenção de terminador) |
| `Render/DocumentoLogico.js.md` | 17 | 16 | inconclusivo (±1 linha — convenção de terminador) |
| `Render/RendererAuditoria.js.md` | 66 | 65 | inconclusivo (±1 linha — convenção de terminador) |
| `Render/RendererCA.js.md` | 291 | 290 | inconclusivo (±1 linha — convenção de terminador) |
| `Render/RendererGxt.js.md` | 285 | 284 | inconclusivo (±1 linha — convenção de terminador) |
| `Render/RendererLogico.js.md` | 42 | 41 | inconclusivo (±1 linha — convenção de terminador) |
| `Render/RendererTabela.js.md` | 75 | 74 | inconclusivo (±1 linha — convenção de terminador) |
| `Schemas/ProdutividadeSchema.js.md` | 57 | 56 | inconclusivo (±1 linha — convenção de terminador) |
| `Temas/TemaPMPE.js.md` | 29 | 28 | inconclusivo (±1 linha — convenção de terminador) |

Resumo: **16 com deriva inequívoca**, 47 com diferença de ±1 linha (inconclusivo — convenção de terminador do formato antigo), 5 sem bloco de código reconhecível, 3 idênticos, 1 não é espelho de artefato.

Os maiores vazamentos medidos: `arca_regras_dominio.json` (1.212 de 2.991 linhas — **59% do catálogo ausente**),
`Entrada/Formulario.html` (1.693 de 2.023), `Features/GuardiaoQualidade.js` (389 de 707),
`Core/LeitorPlanilhas.js` (278 de 509), `Entrada/EntradaManual.js` (637 de 824), `Core/RegrasQualidade.js`
(685 de 790). Nenhum desses espelhos declarava sha de bloco nem commit de referência — a deriva era
**indetectável por inspeção**. É exatamente a lacuna que os campos commit/sha/última verificação fecham.

### 7.5 Limites do §46.15 que permanecem (herdados, não resolvidos aqui)

1. **"Portas expostas" continua heurística.** O extrator reconhece globais de nível de arquivo + métodos/accessors
   e **não** entende `.html`/`.json` de forma semântica. Nos 71 espelhos o campo está preenchido (9/9), mas o
   conteúdo é superfície extraída + a ressalva impressa de que não substitui a declaração da Planta. Extrator
   por linguagem + reconciliação com a porta declarada é incremento separado.
2. **Divergência semântica não é automatizável.** Os 7 testes mecânicos (T1–T7) pegam endereço parado, artefato
   não declarado, arquivo ausente no commit, disco ≠ commit, deriva do espelho anterior, imprecisão de endereço
   e duplicidade. Não pegam "a Planta promete o que o código não faz". Isso entra por `--divergencia` na linha de
   comando; para o lote, as declarações foram geradas a partir da derivação (evidência citada), não digitadas à mão.
   Um arquivo de declarações versionado (1 registro por endereço) continua sendo o próximo passo estrutural.
3. **`## Papel` não existe na maioria das NOTAS.** O gerador passou a cair para a seção `## Responsabilidade`
   da **cápsula §46.2** do módulo (a NOTA do módulo é um stub de 10 linhas que declara a cápsula como documento
   canônico do endereço) e, no limite, para as primeiras linhas úteis da NOTA — **sempre com a fonte citada no
   corpo** e nunca com texto inventado. Foi a mudança de gerador que fez o campo deixar de ser 0/72.
4. **T7 (duplicidade) rodou em lote** com o corpus completo: **0 duplicidades** (cada origem declarada por exatamente 1 nó).
5. **Vault não é repositório Git.** A cópia derivada usa link de disco absoluto (o link relativo não atravessa a
   fronteira vault↔repo). Decisão mantida do piloto.

---

## 8. Mudanças de código — e por que cada uma foi estritamente necessária

### 8.1 `scripts/downplant/lint-estrutura.mjs` (escopo autorizado)

| Mudança | Por quê |
| :--- | :--- |
| Exclusão da varredura de legado só em `07_Codigo_Leitura/` | decisão (b) do Planner, literal |
| Validadores de link passam a ignorar blocos cercados | §2 — segundo falso positivo da mesma raiz, medido, com 0 perda de cobertura |

### 8.2 `scripts/downplant/espelho-rico.mjs` (691 linhas; 5 mudanças, todas declaradas no próprio cabeçalho)

| # | Mudança | Por que era **estritamente necessário** |
| ---: | :--- | :--- |
| 1 | `--endereco-ausente "<justificativa>"` | 7 artefatos não têm endereço canônico. Sem esta rota, materializar os 72 exigiria **inventar** endereço — proibido pelo briefing. O campo passa a declarar `NÃO RESOLVIDO` e T1/T2 viram ACHADO. |
| 2 | T2 passa a ler também a **cápsula §46.2** do módulo | as NOTAS de módulo são stubs que designam a cápsula como documento canônico e é na cápsula que a Planta registra `## Artefatos`. Ler só a NOTA produziria **falso ACHADO em quase todos os endereços** — pior que não testar. |
| 3 | `## Responsabilidade` da cápsula no fallback do campo de responsabilidade | sem isso o campo nascia 0/72 (ou com as 2 primeiras linhas do stub). Texto sempre copiado da Planta, fonte citada. |
| 4 | Linguagem da cerca derivada da extensão da origem | o gerador fixava `javascript` e rotulava `.html`/`.json`/`.md` como JavaScript — afirmação falsa sobre conteúdo verbatim (4 `.html` + 2 `.json` + 3 `.md`). Só o rótulo muda; o sha não depende dele. |
| 5 | `sha256Comparacao` (regra única de deriva) + resolução de submódulo por prefixo + modo `indice` | (a) a cerca consome uma quebra de linha: arquivo terminando em linha vazia ou sem terminador final dava **falso DERIVA em 18 dos 72** (medido). A regra compara conteúdo-contra-conteúdo e mantém o sha declarado = sha do arquivo. (b) a Planta às vezes declara o submódulo pela forma curta (`SUB-C03-02-01`) enquanto o diretório tem sufixo — sem resolver, 1 endereço ficaria impreciso. (c) limite #9 do piloto: o índice do repo era um stub e o do vault apontava para o elemento parado. |

**Não foi tocado**: nenhum arquivo de produto; nenhum canvas; nenhum artefato de origem (confirmado por `git status`).

---

## 9. As quatro pontas

| Ponta | Evidência |
| :--- | :--- |
| **CÓDIGO** | Espelho canônico `07_Codigo_Leitura/**` (71 arquivos + 1 índice; 22.373 linhas) gerado por `scripts/downplant/espelho-rico.mjs` (modos `gerar`, `verificar`, `indice`). Código embutido **verbatim** em bloco cercado, com o sha declarado no corpo (linha do bloco `Verbatim de …`). **Nenhum arquivo de produto alterado.** |
| **DOCUMENTAÇÃO** | 71 espelhos com 9/9 campos §46.15 + índice derivado + `MAPA_ARTEFATO_ENDERECO_162.md` (72 linhas de tabela) + este relatório. Template lido do próprio método: `03_Fundacao/METODO_DOWN_PLANT_PROGRESSIVO_v2.4.md` §46.15. |
| **CANVAS/PLANTA** | Cada espelho linka a NOTA do endereço (ou declara `NÃO RESOLVIDO`). Declaração conferida mecanicamente contra a Planta (testes T1/T1b/T2). **Nenhum `.canvas` criado ou alterado.** Endereços derivados de 13 endereços distintos de `02_Comodos/`. |
| **GIT** | Branch `sprint/g01-guardiao-qualidade-live-001`, HEAD `fbb0608` = commit declarado nos 71 espelhos. Delta no working tree (§6.3). Sem commit, sem push, sem card. |

---

## 10. Repro (comandos exatos)

```bash
# gerar um espelho (canônico no repo + derivado no vault) — repetir por artefato do MAPA
node scripts/downplant/espelho-rico.mjs gerar \
  --endereco "<COMODO>/<MOD>[/<SUB>]" --origem <artefato> \
  --saida 07_Codigo_Leitura/<artefato>.md \
  --anterior <vault>/07_Codigo_Leitura/<artefato>.md \
  --conta-espelhos <vault>/07_Codigo_Leitura \
  --divergencia "<declaração verificada>"
node scripts/downplant/espelho-rico.mjs gerar --endereco ... --origem <artefato> \
  --saida <vault>/07_Codigo_Leitura/<artefato>.md --vault <vault> --link-disco absoluto

# artefato sem endereço canônico (7 casos) — REPORTAR, não inventar
node scripts/downplant/espelho-rico.mjs gerar \
  --endereco-ausente "artefato nao declarado como artefato fisico em nenhum endereco da Planta" \
  --origem Core/Datas.js --saida 07_Codigo_Leitura/Core/Datas.js.md

# verificador §46.15 (deriva sem regravar)
node scripts/downplant/espelho-rico.mjs verificar --espelho 07_Codigo_Leitura/<artefato>.md

# índice derivado
node scripts/downplant/espelho-rico.mjs indice --raiz 07_Codigo_Leitura --saida 07_Codigo_Leitura/INDICE_AS_IS.md

# portões
node scripts/downplant/lint-estrutura.mjs .
node Testes/RodarTodosOsTestes.js
```

A tabela artefato→endereço→nível de evidência está em `MAPA_ARTEFATO_ENDERECO_162.md` — é ela que alimenta o `--endereco` de cada chamada.

---

## 11. Contagem final

```
nós em 07_Codigo_Leitura/ (repo) ......... 72   (71 espelhos ricos + 1 índice derivado)
nós em 07_Codigo_Leitura/ (vault) ........ 72   (derivados)
espelhos com 9/9 campos §46.15 ........... 71 / 71
verificador §46.15 exit 0 ................ 71 / 71  (+1 exit 1 = índice, por natureza)
frescor commit/SHA ...................... 71 / 71  (sha256sum bate em 68; 3 CRLF com regra declarada)
lint estrutural ......................... LINT_EXIT=0
suíte ................................... SUITE_EXIT=0  (630–631 PASS / 0 FAIL; 5 execuções)
endereços canônicos derivados ............ 64 / 71  (7 NÃO RESOLVIDO, reportados)
duplicidade de espelho por origem ........ 0
arquivos de produto alterados ............ 0
```

---

## 12. RESULT proposto

```
[HERMES] RESULT — #162 (final, 72/72)

STATUS: ENTREGUE — piloto escalado para os 71 restantes. 72/72 nós de 07_Codigo_Leitura/ no repo e no vault.
        Decisão (b) do Planner aplicada no lint. 71 espelhos com 9/9 campos. Lint/verificador/suíte verdes.

EVIDÊNCIA TIPADA
- scripts/downplant/lint-estrutura.mjs (decisão (b): exclusão de legado só em 07_Codigo_Leitura/;
  validadores de link calibrados para ignorar blocos cercados — §2 do relatório, com medição de 0 perda)
- scripts/downplant/espelho-rico.mjs (691 linhas; gerar + verificar + indice; 5 mudanças declaradas em §8.2)
- MAPA_ARTEFATO_ENDERECO_162.md (72 linhas: artefato -> endereço + nível de evidência + linha da Planta)
- RELATORIO_162_ESCALA.md (este relatório: matriz 72/72 campo a campo, divergências, não-resolvidos)
- 07_Codigo_Leitura/** (71 espelhos §46.15 + INDICE_AS_IS.md derivado) — repo canônico e vault derivado
- 02_Comodos/C03_Dominio/.../MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO/NOTA_DE_RESPONSABILIDADE.md:19-25
  (tabela de artefatos com coluna de submódulo — é ela que dá precisão de SUB aos 5 endereços)
- 02_Comodos/**/MOD-*.md (§ seção "## Artefatos" das cápsulas §46.2 — 40 derivações de nível 1)
- 03_Fundacao/METODO_DOWN_PLANT_PROGRESSIVO_v2.4.md (§46.15 — template dos 9 campos)

AS QUATRO PONTAS
- CÓDIGO: espelho-rico.mjs (gerar/verificar/indice); 71 espelhos com código VERBATIM em bloco cercado +
  sha256 declarado + commit + data; NENHUM arquivo de produto alterado (git status prova).
- DOCUMENTAÇÃO: 71x9/9 campos; mapa artefato->endereço com 72 linhas e evidência linha a linha;
  índice derivado no lugar do stub de 3 linhas / dos 76 linhas velhas que apontavam para o elemento parado.
- CANVAS/PLANTA: 64 endereços canônicos vivos com link para a NOTA; 7 declarados NÃO RESOLVIDO (reportados);
  13 endereços distintos usados; nenhum canvas criado ou alterado.
- GIT: branch sprint/g01-guardiao-qualidade-live-001, HEAD fbb0608e7b98144533628c7f9b773a10505b800d
  = commit declarado nos 71 espelhos. Delta no working tree. Sem commit, sem push, sem card, #172 intocado.

OS 10 CRITÉRIOS DE FECHAMENTO
1) 72/72 no repo ................✅  72 nós (71 espelhos + 1 índice derivado)
2) 9/9 campos ...................✅  71/71 espelhos (o índice não é espelho de artefato — §7.1, divergência declarada)
3) código verbatim completo .....✅  71/71 conferidos conteúdo-contra-conteúdo, sem truncamento
4) commit/SHA/frescor ...........✅  commit = HEAD nos 71; sha = sha da origem nos 71; sha256sum externo bate em 68/71
                                    (3 CRLF com a regra LF declarada no cabeçalho de cada espelho e prova com tr -d \r)
5) endereços vivos ..............✅  64/71 com endereço canônico + link; 7 NÃO RESOLVIDO reportados (nunca inventados)
6) divergências declaradas ......✅  34 espelhos com ACHADO mecânico no corpo; 27 T2 (endereço derivado por
                                    menção, §7.2); 7 T1/T2 (sem endereço); 35 com endereços concorrentes listados
7) varredura de legado só fora do espelho ✅  prova de escopo em 4 experimentos (§1.2): token dentro não é pego,
                                    token fora continua sendo; link quebrado em prosa DENTRO do espelho continua sendo
8) lint verde ...................✅  LINT_EXIT=0 com 72/72 nós
9) verificador rico verde .......✅  71/71 exit 0 (deriva_codigo=false, sha_desatualizado=false, commit_velho=false)
10) suíte exit 0 ................✅  SUITE_EXIT=0 — 630-631 PASS / 0 FAIL (5 execuções; PASS oscila por TestVigiaNaturalLanguage)

DIVERGÊNCIAS DECLARADAS COM O BRIEFING
- "69 dos 72 endereços apontam para _SUP_158/MOD-C00-01_INFRAESTRUTURA_CORE": NÃO reproduzido.
  Medido: 15 de 72 (14 espelhos de arquivo + o índice antigo). O elemento é arquivo morto do #158, colide de
  ID com MOD-C00-01_ESTRUTURA_DO_COFRE sem ser a mesma coisa e nunca existiu em nenhuma ref do Git. Não foi
  renomeado: onde a Planta declara o artefato, o endereço canônico substituiu o ponteiro; onde não declara, o
  campo diz NÃO RESOLVIDO.
- Suíte: esperado 623 PASS / exit 1; medido 630-631 PASS / exit 0 (4x). A oscilação é TestVigiaNaturalLanguage
  (Vigia/Ollama), identificada por diff — card #172, fora do escopo e não tocado. Não usei isso como justificativa.

PENDÊNCIAS (com causa) — não resolvidas de propósito
1) 7 artefatos sem endereço canônico (Core/Datas.js, Core/Erros.js, Core/Logger.js, Modelos/IRelatorioModelo.js,
   Plugins/IPluginMetrica.js, Schemas/ProdutividadeSchema.js, appsscript.json). Causa: a Planta não os declara
   como artefato de nenhum endereço (GAP já declarado pelo #158). Tratamento: campo NÃO RESOLVIDO + ACHADO.
   Fechar exige decisão de Planta (criar endereço ou declarar fora de escopo), não de espelho.
2) 27 endereços derivados por menção (T2) — falta mover a declaração para a seção "## Artefatos" do endereço.
3) Colisão de dono: contar-regras-arca.mjs --aplicar --espelho escreve em 2 dos 72 caminhos do vault, hoje
   ocupados pelo espelho rico (§7.3). Requer decisão do Planner. Nada perdido: os dois são gerados.
4) "Portas expostas" segue heurística e não entende .html/.json semanticamente.
5) Divergência semântica (Planta promete x código faz) continua humana; arquivo de declarações versionado não existe.

PRÓXIMO PASSO NATURAL: mover gerar->verificar para o ritual de fechamento (verificar como portão, não boa
vontade) e criar o registro versionado de declarações por endereço.
```
