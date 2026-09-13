---
cards: ["158 DP-TAXONOMIA-001"]
card_pai: "#57"
destrava: "#154"
tipo: relatorio_de_diferencas
data: "2026-09-13"
autor: HERMES
commit: "(pendente - commit proibido neste card)"
---

# RELATORIO_DE_DIFERENCIAS_158

Reconciliacao da taxonomia **repo x espelho** para que exista **um nome/endereco por elemento** e a
**diferenca nominal seja ZERO**, deixando o espelho como **derivacao valida** do repo.

- **Card:** #158 (DP-TAXONOMIA-001) - Pai: #57 - Destrava: #154
- **Repo canonico:** `C:\Users\Bneto04\Documents\Codex\syntheon-gs-downplant-offline` (branch `sprint/g01-guardiao-qualidade-live-001`, HEAD `8421544`)
- **Espelho (deriva):** `C:\Users\Bneto04\Documents\Obsidian\Obsidian_Brain\Syntheon`
- **Decisao aplicada:** **D1 - o repositorio/GIT e canonico; o espelho deriva dele.**
- **Regra dura respeitada:** zero alteracao de codigo funcional (nenhum `.js` / `.html` / `.json` de produto). Sem commit, sem push, sem postagem no GitHub. O **alvo estrutural foi o espelho**; no repo foi escrito apenas este relatorio (arquivo novo, nao rastreado).

---

## 1. Metodo

1. Reproduzir o card (`gh issue view 158 -R BNeto04/OPP_Formul-rio_Clasp`).
2. Medir a linha de base: lint no **repo** e no **espelho**; contagem de modulos, submodulos, slots e arquivos de cada lado.
3. Separar o que e **mecanicamente derivavel** (todo endereco que existe no repo) do que **exige decisao** (elemento so do espelho, sem endereco canonico).
4. Aplicar **somente o mecanico**, no espelho, **sem sobrescrever nenhum arquivo existente** e **sem inventar arquitetura**.
5. O que nao tem lastro no repo **nao foi materializado**: foi **preservado** em conteiner declarado e **reportado** (secao 4).
6. Medir de novo, com a mesma instrumentacao, e rodar o lint nas duas arvores.

Backup integral do espelho antes de qualquer escrita: `%LOCALAPPDATA%\Temp\dp158_backup\Syntheon_antes` (172 arquivos; `.obsidian` excluido de proposito).

---

## 2. Antes x Depois (medido no disco)

| Item | Antes | Depois | Delta |
|---|---|---|---|
| **Lint do ESPELHO** | **358 erros** (exit 1) | **20 erros** (exit 1) | **-338** |
| Lint do REPO | `SUCESSO` (exit 0) | `SUCESSO` (exit 0) | **0** |
| **Modulos no repo** | 13 | 13 | 0 |
| **Modulos no espelho** | 12 | **13** | **+1** |
| **Diferenca nominal de MODULOS** | 3 so no repo, 2 so no espelho | **0 (ZERO)** | **-5** |
| Submodulos no repo | 10 | 10 | 0 |
| Submodulos no espelho | 15 | **10** | **-5** |
| **Diferenca nominal de SUBMODULOS** | 8 so no repo, 13 so no espelho | **0 (ZERO)** | **-21** |
| Slots de comodo no espelho (6 x 8 = 48) | **17** (16 com `INDICE.md`) | **48 (48 com `INDICE.md`)** | **+31** |
| Erros de lint por slot ausente/sem indice | **32** | **0** | **-32** |
| Wikilinks quebrados no espelho | **309** | **5** | **-304** |
| Erros de "legado" no espelho | **17** | **15** | **-2** |
| Links markdown quebrados no espelho | 0 | **0** | 0 |
| Arquivos no espelho (sem `.obsidian`) | 172 | **257** | **+85** |
| Arquivos em `02_Comodos` do espelho | 84 | **135** | **+51** |
| Arquivo `02_Comodos` identico ao repo (endereco comum) | - | **106** | - |
| Endereco do repo ausente no espelho | **169 itens** | **0** | **-169** |
| Divergencia de CONTEUDO em endereco comum | 21 | **21 (preservada)** | 0 |

Leitura do DONE do card: **diferenca de nomes/endereco repo x espelho = 0 (ATINGIDO)** para modulos,
submodulos e slots. O lint do espelho **nao ficou verde**: os 20 erros remanescentes sao
**explicitamente nao relacionados a taxonomia** (secao 4.1) - sao falsos positivos do validador e
copias literais de comentarios do codigo de producao.

---

## 3. O que foi APLICADO (mecanico, so no espelho)

### 3.1 Slots - 31 diretorios + 1 `INDICE.md` criados

Cada um dos 8 comodos passou a ter os **6 slots do manifesto** com `INDICE.md`
(`00_Visao_Do_Comodo`, `01_Dominio`, `02_Integracoes`, `03_Especificacoes`, `04_Execucao`,
`05_Evidencias`). Faltavam `02_Integracoes`, `03_Especificacoes`, `04_Execucao` e `05_Evidencias` em
**C01, C02, C03, C04, C05, C06, C08** (28), mais `02_Integracoes`, `04_Execucao` e `05_Evidencias` em
**C00** (3) e o `INDICE.md` de `C00/03_Especificacoes` (1 - a pasta existia, o indice nao; resquicio
da escrita concorrente ja registrada no #157).

### 3.2 Enderecos canonicos materializados a partir do repo

| Classe | Quantidade |
|---|---|
| Diretorios criados em `02_Comodos` | **89** |
| Arquivos copiados em `02_Comodos` (byte-identicos ao repo) | **80** |
| Arquivos copiados em `dependencias/` | **5** (`INDICE.md` + `DEP-001..004`) |

Inclui o que o card nomeia: **`MOD-C01-02_NORMALIZADOR_DE_EFETIVO`** com
**`SUB-C01-02-01_DEPENDENCIA_ARCA`** e **`MOD-C05-02_NORMALIZADOR_DE_ABA`** (com seus 4 documentos de
contrato + circuito), alem de `MOD-C00-01_ESTRUTURA_DO_COFRE` (com
`SUB-C00-01-01_MIGRACAO_DP21` e `SUB-C00-01-02_PLANTA_MESTRA`), `SUB-C00-02-01_LINT`,
`SUB-C01-01-01_OCR_E_CONFERENCIA`, `SUB-C01-01-02_PERSISTENCIA_MANUAL`, os 4
`SUB-C03-02-01..04`, as capsulas `.md`, os `CIR-*.canvas` e as 11 evidencias `EV-*`.

**Nenhum arquivo existente no espelho foi sobrescrito.** `dependencias/` entrou porque as capsulas
do repo o referenciam por caminho relativo (`../../../../../dependencias/DEP-*.md`): sem a pasta, os
15 links quebrariam no espelho.

### 3.3 Links - 263 wikilinks em forma de caminho convertidos

O linter resolve wikilink **por nome-base**; a forma de caminho completo **nunca** resolve (diagnostico
registrado no #154). A conversao preservou o **alvo exato** e o **texto exibido**:

- **217** convertidos para **link markdown relativo** apontando para o mesmo arquivo de destino
  (a forma que o **proprio repo** usa: `[texto](../../../05_Evidencias/EV-...md)`);
- **46** repontados para o conteiner `_SUP_158/` (os que apontavam para elementos preservados fora
  da arvore canonica) - continuam navegaveis em vez de quebrados;
- **5** deixados intactos de proposito: sao **falsos positivos** dentro de blocos de codigo (secao 4.1);
- ajuste adicional: 25 arquivos tiveram o caminho do conteiner corrigido apos a mudanca de nome/pasta
  (item 3.4) - mesmo alvo, endereco final.

Zero alteracao de codigo: a varredura e **fence-aware** (nunca toca conteudo entre crases triplas).

### 3.4 Conteiner de preservacao `_SUP_158/` (13 elementos, 29 arquivos)

Os elementos que existiam so no espelho e **nao tem endereco canonico no repo** sairam de
`02_Comodos/**` e foram **movidos byte a byte** para `_SUP_158/` na raiz do espelho, com `README.md`
declarando o motivo item a item, o que fazer e como reverter. **Nada foi apagado.** O conteiner fica
fora dos `docsDirs` do linter de proposito (conteudo preservado, nao conteudo canonico).

> **Achado de plataforma:** o Windows corta caminho em 260 caracteres. O caminho mais longo do
> conteiner hoje tem **247**. A primeira versao (`_SUPERSEDED_158/02_Comodos/...`) chegava a **265**
> em 2 arquivos e `os.path.exists`/o linter retornavam falso - por isso o conteiner esta na raiz e
> **sem** o nivel `02_Comodos/`.

---

## 4. O que NAO foi reconciliado (lista completa, com o porque)

### 4.1 Os 20 erros de lint remanescentes do espelho - 15 "legado" + 5 "wikilink"

**Nenhum deles e divergencia de taxonomia repo x espelho.** Duas classes, ambas **nao editaveis sem
quebrar uma regra mais forte**:

**(a) Copia literal de comentario do codigo de producao (14 erros de "legado").** Os arquivos
`07_Codigo_Leitura/*.js.md` sao espelhos **somente-leitura** do codigo, com `SHA-256` e a porta
`P01` exigindo imutabilidade ("blocos literais de leitura"). Os tokens legados vieram **do proprio
codigo do repo** - verificado no repo:

```
Core/RegrasQualidade.js:250     * Valida a política de mérito por armas para um túnel de ocorrência (TASK-M06.3-03C).
Features/GuardiaoQualidade.js:3 * DESCRICAO: Motor central do Guardião da Qualidade Operacional (M05/M06).
Render/RendererAuditoriaSaude.js  (M06) / TASK-M06.1-04
Compilador de Entorpecentes.js:8  AUXILIARES DE PALETA E FORMATO VISUAL (M06.2-05)
CPM – Compilador de Pontuação Mensal.js:237  (TASK-M06.2-03A)
+ Leitura/Adaptador2026.js, Leitura/LeitorAntiguidadePeculio.js, Motor/DiagnosticoDeterministicoGxt.js,
  Motor/PoliticaMeritoArmas.js, Features/CompiladorGxt.js, Render/RendererGxt.js
```

Consertar no espelho **falsificaria** o espelho do codigo. O conserto e de **produto** (limpar o
comentario no `.js` do repo) ou de **validador** (isentar bloco de codigo) - os dois **fora do escopo
autorizado** deste card ("NAO altere codigo funcional", e o lint e o validador canonico do Down Plant:
enfraquece-lo para ficar verde seria trocar a evidencia pela aparencia).

**(b) Falsos positivos do validador (1 "legado" + 5 "wikilink").**

| Arquivo | O que o linter acusou | Por que e falso positivo |
|---|---|---|
| `03_Fundacao/CONTRATO_VISUAL_DAS_PLANTAS.md` | `file:///` | A linha **proibe** o padrao: "Links absolutos `file:` | Quebra de portabilidade entre sistemas". O linter flagra a mencao a anti-padrao. |
| `07_Codigo_Leitura/Entrada/Formulario.html.md` | `M15`, `M14`, `M19` | Sao **dados de path SVG** copiados do `Entrada/Formulario.html` do repo (`d="M14,13V17H10..."`, `d="M15.41,16.58..."`). A regex `M[0-9]{2}` casa com comando SVG. |
| `07_Codigo_Leitura/Render/RendererAuditoriaSaude.js.md` | `[[ 'DATA/HORA EXECUÇÃO', 'ABA', ... ]]` | **Array literal do JS** dentro do bloco de codigo. A regex de wikilink casa `[[...]]` aninhado. |
| `07_Codigo_Leitura/Compilador de Entorpecentes.js.md` | idem | Idem (lista de colunas). |
| `07_Codigo_Leitura/Compilador_Armas.js.md` | idem | Idem. |
| `07_Codigo_Leitura/Features/NormalizadorEfetivo.js.md` | idem (2) | Idem (`['SISTEMA','-','ERRO', mensagem]`). |

### 4.2 Os 13 elementos preservados em `_SUP_158/` (sem endereco canonico no repo)

`MOD-C00-01_INFRAESTRUTURA_CORE` (+ `SUB-C00-01-01_CONFIGURACOES_E_AMBIENTE`) |
`MOD-C00-03_CURADOR_OBSIDIAN` (+ `SUB-C00-03-01_SINCRONIZACAO_UNIDIRECIONAL`) |
`SUB-C00-02-01_LINTER_E_VALIDADOR` | `SUB-C02-01-01_LEITURA_DE_PLANILHAS` |
`SUB-C02-01-02_LEITOR_PECULIO` | `SUB-C02-01-03_ADAPTADOR_2026` |
`SUB-C03-01_ENTIDADES_E_OCORRENCIA` | `SUB-C03-02_ARCA_CANONICA` |
`SUB-C04-01_CALCULO_ANALITICO_E_MERITO` | `SUB-C05-01_AUDITORIA_E_INTEGRIDADE` |
`SUB-C06-01_GERACAO_RELATORIOS_TABULARES` | `SUB-C06-02_GERACAO_MERITO_GXT` |
`SUB-C08-01_BANCADA_DE_TESTES`.

**Por que nao foram reconciliados:** o repo **nunca teve** esses enderecos - verificado por
`git log --all -S "INFRAESTRUTURA_CORE"`, `-S "CURADOR_OBSIDIAN"`, `-S "SUB-C02-01-01"` e por
`git log --all -- <caminho>` (nenhuma ocorrencia em qualquer ref). Renomea-los seria **inventar um
mapeamento**: `MOD-C00-01_INFRAESTRUTURA_CORE` colide no ID com `MOD-C00-01_ESTRUTURA_DO_COFRE`, mas
o **assunto e outro** (infraestrutura `Core/*.js` x estrutura do cofre). Onde ha evidencia de
supersessao por particao (`SUB-C03-02_ARCA_CANONICA` x os 4 `SUB-C03-02-0N` do repo), a particao
canonica foi materializada e a antiga preservada. **Decisao do proprietario** (3 rotas no `README.md`
do conteiner).

### 4.3 GAP de cobertura descoberto no repo (reportado, nao materializado)

Nenhum modulo do Down Plant do repo governa `Core/Config.js`, `Core/Constantes.js`, `Core/Logger.js`,
`Core/Erros.js`, `Core/Datas.js`, `Core/Validador.js` - medido com
`grep -rl "Core/Logger.js" 02_Comodos 01_Planta 03_Fundacao 06_Inventario 08_Execucao_Ao_Vivo` (0
resultados; `Core/Datas.js`: 0). Os arquivos **existem** no repo, mas a taxonomia canonica nao lhes da
endereco. O espelho tinha exatamente esse modulo (`MOD-C00-01_INFRAESTRUTURA_CORE`) - **sem lastro**.
Nao foi importado para o repo (proibido sem card/evidencia) nem mantido com endereco falso.

### 4.4 Afirmacao do espelho sem lastro no repo

O `SUB-C00-02-01_LINTER_E_VALIDADOR` (preservado) cita **`scripts/lint-downplant.js`**, que **nao
existe** no repo (`ls scripts/downplant/` -> `lint-estrutura.mjs`, `validar-handoff.mjs`). Registrado;
nao corrigido (o arquivo esta preservado byte a byte).

### 4.5 Overlay do espelho (82 arquivos) - sem endereco no repo, mantido no lugar

| Classe | Qtd | Situacao |
|---|---|---|
| `COMODO-CXX.canvas` (visao de comodo, 8 comodos) | 8 | Overlay de leitura do espelho; **nao colide** com endereco do repo (`CIR-C03_DOMINIO.canvas` convive). Mantido e reportado. |
| Espelhos de codigo `07_Codigo_Leitura/**.js.md`, `.html.md`, `.json.md` | 71 | Camada de leitura do Curador (com `SHA-256` e commit de origem). O repo tem 1 arquivo nessa pasta. Mantido; **nao e divida de taxonomia de modulo**. |
| `00_Painel/RELATORIO_DO_CURADOR.md`, `RELATORIO_DE_RECONSTRUCAO.md`; `03_Fundacao/CONTRATO_VISUAL_DAS_PLANTAS.md`; `RELATORIO_DE_DIFERENCIAS_156_157.md` (raiz) | 3 + 1 | Documentos so do espelho, sem colisao. Mantidos. `CONTRATO_VISUAL_DAS_PLANTAS.md` e a origem de 1 falso positivo (4.1b). |

### 4.6 Divergencia de CONTEUDO em endereco comum (21 arquivos) - preservada

Nao e divergencia nominal (nome/endereco iguais nos dois lados), por isso **nao** foi tocada:
"preservando conteudo existente". Lista:

```
C00/00_Visao_Do_Comodo/INDICE.md          C00/01_Dominio/INDICE.md
C00/.../MOD-C00-02_VALIDACAO_ESTRUTURAL/NOTA_DE_RESPONSABILIDADE.md
C01/00_Visao_Do_Comodo/INDICE.md          C01/01_Dominio/INDICE.md
C01/.../SUB-C01-01-01_OCR_E_CONFERENCIA/{CIR-*.canvas, NOTA_DE_RESPONSABILIDADE.md}
C01/.../SUB-C01-01-02_PERSISTENCIA_MANUAL/{CIR-*.canvas, NOTA_DE_RESPONSABILIDADE.md}
C02/00_Visao_Do_Comodo/INDICE.md          C02/01_Dominio/INDICE.md
C02/.../MOD-C02-01_LEITURA_E_ADAPTACAO/NOTA_DE_RESPONSABILIDADE.md
C03/01_Dominio/INDICE.md
C03/.../MOD-C03-01_MODELO_DE_OCORRENCIA/NOTA_DE_RESPONSABILIDADE.md
C03/.../MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO/NOTA_DE_RESPONSABILIDADE.md
C04/.../MOD-C04-01_MOTOR_ANALITICO/NOTA_DE_RESPONSABILIDADE.md
C05/00_Visao_Do_Comodo/INDICE.md
C05/.../MOD-C05-01_GUARDIAO_DE_QUALIDADE/NOTA_DE_RESPONSABILIDADE.md
C06/.../MOD-C06-01_RELATORIOS_OFICIAIS/NOTA_DE_RESPONSABILIDADE.md
C06/.../MOD-C06-02_MERITO_DE_ARMAS_GXT/NOTA_DE_RESPONSABILIDADE.md
C08/.../MOD-C08-01_HOMOLOGACAO_OFFLINE/NOTA_DE_RESPONSABILIDADE.md
```

### 4.7 Concorrencia (nao e desta entrega)

Outro executor esta escrevendo **no repo** durante esta execucao: `Core/RegrasQualidade.js`
(mtime 15:11:04), `Dominio/ARCA/AdaptadorConsultaArca.js` e `Features/GuardiaoQualidade.js` (15:11:16),
`Testes/TestGuardiao.js` (15:10:43) e `scripts/diagnostico-identidade-ocorrencia-160.js` (**15:15:36**,
card #160). **Nenhum arquivo desses e desta entrega** - o #158 escreveu **zero** arquivos no repo
(apenas este relatorio, novo). Medicao: `find 02_Comodos 03_Fundacao dependencias 07_Codigo_Leitura
scripts -newermt "2026-09-13 15:05"` retorna **somente** o script do #160.

---

## 5. Evidencia - lint nas DUAS arvores (inicio e fim)

### 5.1 Repositorio canonico - inicio e fim (identico)

Antes (inicio da execucao) e depois (fim), mesmo comando:

```
$ cd "C:/Users/Bneto04/Documents/Codex/syntheon-gs-downplant-offline"
$ node scripts/downplant/lint-estrutura.mjs
```

```
🔍 Verificando Terreno: C:\Users\Bneto04\Documents\Codex\syntheon-gs-downplant-offline


✅ SUCESSO! A arvore documental esta em estrita conformidade com o Down Plant 2.1.
EXIT_REPO=0
```

### 5.2 Espelho - ANTES (358 erros, exit 1)

```
$ node scripts/downplant/lint-estrutura.mjs "C:/Users/Bneto04/Documents/Obsidian/Obsidian_Brain/Syntheon"
```

Primeiras linhas e ultima (o log completo, com as 358 linhas, esta em
`%LOCALAPPDATA%\Temp\lint_espelho_antes.txt`):

```
🔍 Verificando Terreno: C:\Users\Bneto04\Documents\Obsidian\Obsidian_Brain\Syntheon

❌ ERRO: Comodo C00_Governanca_Estrutural nao possui diretorio slot 02_Integracoes
...
🔥 FALHA! 358 erro(s) de estrutura encontrados.
```

Composicao medida dos 358: **309 WikiLink quebrado** + **32 slots de comodo ausentes/sem indice** +
**17 Legado encontrado**.

### 5.3 Espelho - DEPOIS (20 erros, exit 1) - saida integral

```
❌ ERRO: Legado encontrado em C:\Users\Bneto04\Documents\Obsidian\Obsidian_Brain\Syntheon\03_Fundacao\CONTRATO_VISUAL_DAS_PLANTAS.md: file:///
❌ ERRO: Legado encontrado em C:\Users\Bneto04\Documents\Obsidian\Obsidian_Brain\Syntheon\07_Codigo_Leitura\Compilador de Entorpecentes.js.md: M06
❌ ERRO: WikiLink quebrado em C:\Users\Bneto04\Documents\Obsidian\Obsidian_Brain\Syntheon\07_Codigo_Leitura\Compilador de Entorpecentes.js.md: [['POS', 'PELOTÃO', 'GRADUAÇÃO', 'MATRÍCULA', 'POLICIAL', 'MACONHA (g)', 'COCAÍNA (g)', 'TOTAL (g)', 'OCORRÊNCIAS', 'BOEs']]
❌ ERRO: WikiLink quebrado em C:\Users\Bneto04\Documents\Obsidian\Obsidian_Brain\Syntheon\07_Codigo_Leitura\Compilador_Armas.js.md: [['PELOTÃO', 'GRADUAÇÃO', 'MATRÍCULA', 'POLICIAL', 'SCORE ACUMULADO (ARMAS)']]
❌ ERRO: Legado encontrado em C:\Users\Bneto04\Documents\Obsidian\Obsidian_Brain\Syntheon\07_Codigo_Leitura\Core\RegrasQualidade.js.md: TASK-M06
❌ ERRO: Legado encontrado em C:\Users\Bneto04\Documents\Obsidian\Obsidian_Brain\Syntheon\07_Codigo_Leitura\CPM – Compilador de Pontuação Mensal.js.md: TASK-M06
❌ ERRO: Legado encontrado em C:\Users\Bneto04\Documents\Obsidian\Obsidian_Brain\Syntheon\07_Codigo_Leitura\Entrada\EntradaManual.js.md: M01, M02, M06, M07
❌ ERRO: Legado encontrado em C:\Users\Bneto04\Documents\Obsidian\Obsidian_Brain\Syntheon\07_Codigo_Leitura\Entrada\Formulario.html.md: M15, M14, M19
❌ ERRO: Legado encontrado em C:\Users\Bneto04\Documents\Obsidian\Obsidian_Brain\Syntheon\07_Codigo_Leitura\Entrada\Menu.js.md: TASK-M01
❌ ERRO: Legado encontrado em C:\Users\Bneto04\Documents\Obsidian\Obsidian_Brain\Syntheon\07_Codigo_Leitura\Features\CompiladorGxt.js.md: TASK-M06
❌ ERRO: Legado encontrado em C:\Users\Bneto04\Documents\Obsidian\Obsidian_Brain\Syntheon\07_Codigo_Leitura\Features\GuardiaoQualidade.js.md: M05, M06, TASK-M06
❌ ERRO: WikiLink quebrado em C:\Users\Bneto04\Documents\Obsidian\Obsidian_Brain\Syntheon\07_Codigo_Leitura\Features\NormalizadorEfetivo.js.md: [['SISTEMA', '-', 'INICIADO', 'Sincronizacao iniciada; se falhar, o erro sera registrado nesta aba.']]
❌ ERRO: WikiLink quebrado em C:\Users\Bneto04\Documents\Obsidian\Obsidian_Brain\Syntheon\07_Codigo_Leitura\Features\NormalizadorEfetivo.js.md: [['SISTEMA', '-', 'ERRO', mensagem]]
❌ ERRO: Legado encontrado em C:\Users\Bneto04\Documents\Obsidian\Obsidian_Brain\Syntheon\07_Codigo_Leitura\Leitura\Adaptador2026.js.md: TASK-M06
❌ ERRO: Legado encontrado em C:\Users\Bneto04\Documents\Obsidian\Obsidian_Brain\Syntheon\07_Codigo_Leitura\Leitura\LeitorAntiguidadePeculio.js.md: TASK-M06
❌ ERRO: Legado encontrado em C:\Users\Bneto04\Documents\Obsidian\Obsidian_Brain\Syntheon\07_Codigo_Leitura\Motor\DiagnosticoDeterministicoGxt.js.md: TASK-M06
❌ ERRO: Legado encontrado em C:\Users\Bneto04\Documents\Obsidian\Obsidian_Brain\Syntheon\07_Codigo_Leitura\Motor\PoliticaMeritoArmas.js.md: TASK-M06
❌ ERRO: Legado encontrado em C:\Users\Bneto04\Documents\Obsidian\Obsidian_Brain\Syntheon\07_Codigo_Leitura\Render\RendererAuditoriaSaude.js.md: M06, TASK-M06
❌ ERRO: WikiLink quebrado em C:\Users\Bneto04\Documents\Obsidian\Obsidian_Brain\Syntheon\07_Codigo_Leitura\Render\RendererAuditoriaSaude.js.md: [['DATA/HORA EXECUÇÃO', 'ABA', 'TÚNEL', 'LINHA', 'SEVERIDADE', 'REGRA', 'DIAGNÓSTICO', 'EVIDÊNCIA', 'AÇÃO RECOMENDADA']]
❌ ERRO: Legado encontrado em C:\Users\Bneto04\Documents\Obsidian\Obsidian_Brain\Syntheon\07_Codigo_Leitura\Render\RendererGxt.js.md: TASK-M06
🔥 FALHA! 20 erro(s) de estrutura encontrados.
EXIT_ESPELHO=1
```

---

## 6. Comandos exatos de verificacao

```bash
# 1) lint do REPO (deve dar SUCESSO / exit 0)
cd "C:/Users/Bneto04/Documents/Codex/syntheon-gs-downplant-offline"
node scripts/downplant/lint-estrutura.mjs ; echo "EXIT=$?"

# 2) lint do ESPELHO (hoje: 20 erros, exit 1 - todos de 4.1, nenhum de taxonomia)
node scripts/downplant/lint-estrutura.mjs "C:/Users/Bneto04/Documents/Obsidian/Obsidian_Brain/Syntheon" ; echo "EXIT=$?"

# 3) diferenca nominal de MODULOS entre repo e espelho (esperado: vazio)
#    (mesma instrumentacao aplicada antes e depois; ver secao 2)

# 4) nenhum endereco do repo ausente no espelho (esperado: 0)
#    comparacao arquivo a arquivo dos 127 arquivos de 02_Comodos do repo

# 5) provar que a entrega nao tocou codigo funcional do repo (vazio para os arquivos DO #158)
git status --short -- 02_Comodos 03_Fundacao dependencias 07_Codigo_Leitura

# 6) provar que nada foi apagado do espelho (29 arquivos preservados)
find "C:/Users/Bneto04/Documents/Obsidian/Obsidian_Brain/Syntheon/_SUP_158" -type f | wc -l   # 29
```

---

## 7. Quatro pontas (estado desta entrega)

| Ponta | Estado | Prova |
|---|---|---|
| **CODIGO** | 🟢 **Intocado** | Zero arquivos funcionais alterados. As alteracoes desta entrega sao `.md`/`.canvas` **do espelho** + 1 `.md` novo no repo (este relatorio). A varredura de links e fence-aware e nao escreve em bloco de codigo. |
| **DOCUMENTACAO** | 🟢 **Reconciliada (nome/endereco)** | 13 = 13 modulos, 10 = 10 submodulos, 48 = 48 slots com `INDICE.md`, 0 endereco do repo ausente no espelho. 21 arquivos de conteudo divergente **preservados** e listados (4.6). |
| **CANVAS / PLANTA** | 🟡 **Preservado, nao reconciliado** | Nenhum `.canvas` do repo foi alterado. No espelho os `CIR-*.canvas` canonicos foram **materializados** (copia do repo); 8 `COMODO-CXX.canvas` continuam como overlay sem endereco no repo (4.5); os circuitos dos elementos arquivados foram para `_SUP_158/` (3.4). A reconciliacao *visual* das plantas nao e deste card. |
| **GIT** | 🔴 **Pendente, working tree so** | Sem commit, sem push, sem tag, sem `clasp push`, nada postado/fechado no GitHub. O **espelho nao e repositorio git** (nao existe `.git` em `Obsidian_Brain`): a alteracao do espelho **nao tem trilha versionada** - e exatamente por isso que D1 define o repo como canonico. Rollback: backup em `%LOCALAPPDATA%\Temp\dp158_backup\Syntheon_antes`. |

---

## 8. Limites declarados

- **Nao** houve commit, push, deploy nem postagem (proibido pelo card).
- O lint valida **estrutura, nomenclatura, legado, links e JSON de canvas** - nao valida semantica nem conteudo.
- O espelho **nao ficou com lint verde**: os 20 erros restantes exigem decisao fora do escopo (4.1). Nao foram "resolvidos" editando codigo de producao nem enfraquecendo o validador.
- A ambiguidade de navegacao dos wikilinks foi **eliminada** convertendo-os em links relativos ao alvo exato; nenhum link aponta para "qualquer arquivo de mesmo nome".
- O espelho **nao e versionado em git**: as mudancas vivem apenas em disco (declarado na ponta GIT).
- 21 arquivos de conteudo divergente seguem **como estavam** (preservacao > uniformizacao, por ordem do card).

---

## 9. Proximo passo seguro

Decisao do proprietario/Planner sobre as tres rotas do `_SUP_158/README.md` (materializar no repo,
formalizar como `99_Arquivo_Transicao` ou descartar) e sobre o destino dos 21 arquivos de conteudo
divergente. Sugestao de cards pequenos e independentes:

1. **Produto:** alinhar os comentarios legados nos `.js` do repo (mata 14 dos 20 erros de lint do espelho na proxima re-espelhagem).
2. **Validador:** isentar bloco de codigo (` ``` `) e mencao a anti-padrao na varredura de legado/wikilink (mata os 6 restantes) - **sem** afrouxar as regras da arvore documental.
3. **Taxonomia:** decidir o endereco canonico (ou o descarte) de cada elemento de `_SUP_158/`.
4. **Conteudo:** reconciliar os 21 arquivos divergentes arquivo a arquivo (lado a lado decidido).

Auditoria da entrega (Conferidor). Nenhuma fatia dependente iniciada automaticamente.
