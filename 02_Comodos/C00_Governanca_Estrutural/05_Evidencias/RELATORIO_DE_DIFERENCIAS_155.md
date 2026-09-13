# RELATÓRIO DE DIFERENÇAS — CARD #155 (DP-INST-EXEC-001)

- **Card:** #155 — `[DP-INST-EXEC-001] Classificar endpoint de execução como instalação transversal`
- **Pai:** #57 · **Repositório canônico:** `C:/Users/Bneto04/Documents/Codex/syntheon-gs-downplant-offline`
- **Espelho (leitura):** `C:/Users/Bneto04/Documents/Obsidian/Obsidian_Brain/Syntheon`
- **Branch:** `sprint/g01-guardiao-qualidade-live-001` · **HEAD observado:** `98f5c8d`
- **Data:** 13/09/2026 · **Autor:** HERMES (subagente)
- **Regra do dono aplicada:** não inventar — escolher a alternativa que a **evidência** sustenta e declarar o que a sustenta.
- **Escopo desta execução:** auditar `Entrada/WebAppExecucao.js`, classificar como instalação transversal **ou** justificar remoção; produzir documento no repo + derivação no espelho. **Nenhum código funcional foi alterado** (o `.js` não foi tocado); **nenhum** commit, push, `clasp push` ou postagem no GitHub.

---

## 0. Decisão (o que a evidência sustenta)

**RETIRAR (remoção proposta), documentada factualmente — e não registrar como instalação transversal instalada.**
O documento entregue é a **justificativa factual de remoção**, não o guia de instalação (conforme o ramo
(2) do card). O que sustenta está na §2 abaixo e no documento `INST-EXEC-001_ENDPOINT_DE_EXECUCAO.md` §8.

O artefato **é** de natureza transversal (transporte/segurança atravessando Cômodos — §8.10 do método),
porém está **RETIRADO**: nunca implantado, sem consumidor, com a razão de existir refutada.

---

## 1. Diferenças de endereçamento e de espectro (o mapa não tinha onde guardar este artefato)

| # | Tipo | Diferença encontrada | Ação |
|---|---|---|---|
| D1 | **CARD × MÉTODO** | O card referencia “INST transversal (§8.11)”. No método (Skill Package `down-plant-progressivo-2.1`, `references/metodo-down-plant-progressivo-v2.1.md`), **§8.10 = Instalação transversal** e **§8.11 = Espelho AS-IS**. Há deslocamento de um número. | Registrado aqui; o documento novo ancora em **§8.10** (definição) **+ §46.7** (template) e respeita **§8.11** (espelho). Nada foi inventado para “caber” no §8.11. |
| D2 | **REPO × ESPELHO** | Não existia **nenhum** lugar canônico para instalação transversal no repo: zero identificadores `INST-*`, zero pasta `instalacoes/`. O artefato era **órfão no mapa**. | Criado `02_Comodos/C00_Governanca_Estrutural/03_Especificacoes/INSTALACOES_TRANSVERSAIS/` — âncora em **Cômodo técnico** (§8.10). Formato **derivado** de: §46.7 do método + `06_Inventario/EXTERNAL_CAPABILITY_REGISTRY.md` (precedente real de registro com porta/estado) + cabeçalho dos espelhos AS-IS. Declarado no próprio documento. |
| D3 | **REPO × ESPELHO** | `Entrada/WebAppExecucao.js` existia no repo e **não tinha espelho AS-IS** no vault: `07_Codigo_Leitura/Entrada/` tinha `EntradaManual.js.md`, `Formulario.html.md`, `Menu.js.md`, `Dialog*.html.md` — e **não** o endpoint. Lacuna de espelho (§8.11). | Criado `07_Codigo_Leitura/Entrada/WebAppExecucao.js.md` (cabeçalho AS-IS com caminho real, commit, SHA-256 e endereço canônico + código-fonte). |
| D4 | **DOCUMENTAÇÃO × REGISTRO** | A cápsula `MOD-C01-01_FORMULARIO_E_MENUS.md:77` cita o commit `a1de4bf` como “**(endpoint/INST)**” — afirmava uma relação `INST` que **não existia em nenhum documento**. | Resolvido: o `INST-EXEC-001` passa a ser o documento que a cápsula pressupunha. (A cápsula **não** foi editada — escopo.) |

## 2. Diferenças entre o que o artefato declara e a realidade medida

| # | Tipo | Declarado no artefato | Medido | Veredito |
|---|---|---|---|---|
| D5 | **premissa** | `WebAppExecucao.js:5-8`: o `clasp run` **recusa** a conta com `403 The caller does not have permission` (verificado 11/09/2026). É **a única** razão de existir do arquivo (idem corpo do commit `a1de4bf`). | O `clasp run` **funciona**: `clasp run executarGuardiaoHeadless -p '["SET2026"]'` → `status OK`, 12 túneis, 213 linhas, 33 alertas (`agentic/state/RESULT_CORRECAO_145_146_148_CLASP.md:29`, 12/09/2026). | **Premissa refutada** → cai a justificativa de existência. |
| D6 | **implantação** | `WebAppExecucao.js:16-22` descreve SETUP de implantação de App da Web (token + “Executar como: Eu” + “Qualquer pessoa”). | **Nenhum** dos 3 passos foi executado. O arquivo é `push`ado (`Entrada/` **não** está no `.claspignore`), mas **não há implantação de App da Web** → **não existe URL do endpoint**. `appsscript.json` habilita só `executionApi: MYSELF` (rota do `clasp run`). | **Não instalado** → não é instalação; é código latente. |
| D7 | **consumidores** | O artefato é “infraestrutura de apoio” (implícito: haveria consumidor). | Varredura **no código de runtime** por `WebAppExecucao`, `TOKEN_EXECUCAO`, `EXECUCAO_LISTA_BRANCA`: **3 arquivos, todos autorreferentes** (o `.js`, seu teste e a linha 99 de `Testes/RodarTodosOsTestes.js`). | **Consumidores reais (runtime) = 0.** |
| D8 | **redundância** | — | As 4 funções da lista branca (`getEfetivo`, `obterOpcoesValidacao`, `obterTabelaTerritorialAIS`, `resolverAISTerritorial`) **já** são alcançáveis por dois caminhos vivos: (a) a ponte oficial da UI `google.script.run` (`Entrada/Formulario.html:957-959, 1266-1268`); (b) a rota headless `clasp run`. | **Redundante na prática**, não só na teoria. |
| D9 | **superação** | — | Entre 11/09 (`a1de4bf`) e 13/09, **toda** a cadeia headless correu pela rota `clasp run` (p.ex. `executarGuardiaoHeadless`, `executarCompiladorArmasHeadless`, `gerarComparativo2026Headless`, `verificarParticipacaoArmasHeadless`), com **zero** chamada ao endpoint. | **Superado em uso.** |
| D10 | **DOCUMENTAÇÃO (concorrente) × ESTADO** | — | Cards **executados em paralelo** (#153/#156) passaram a **citar** o artefato como capacidade ativa, sem chamá-lo: `dependencias/DEP-001_GOOGLE_APPS_SCRIPT.md:30` (“Web app — endpoint HTTP headless, token em Script Properties”), `MOD-C08-01_HOMOLOGACAO_OFFLINE.md:63` e `EV-C08-001_SUITES_E_PORTAS_HEADLESS.md:29` (listam `Entrada/WebAppExecucao.js` entre as “portas headless”) — mas a rota headless real é `clasp run`. | **Citar ≠ consumir.** Registro conflate endpoint × `clasp run`; permanece **zero consumidor de runtime**. Não editado (pertence ao outro card). |

## 3. Nota de concorrência (não confundir com regressão do #155)

O lint do repositório **mudou de resultado durante esta execução** sem qualquer relação com os artefatos
do #155. Outros cards estão sendo executados **ao mesmo tempo** neste mesmo diretório, e o **#153**
(cápsulas §46.2) criou arquivos `MOD-CXX-NN_*.md` na raiz dos módulos usando caminho relativo
**inválido** para as evidências:

```text
[EV-C00-001](../05_Evidencias/EV-C00-001_ESTRUTURA_E_VALIDACAO.md)
```
A partir de `02_Comodos/<CXX>/01_Dominio/modulos/<MOD>/`, `../05_Evidencias/` resolve para
`01_Dominio/05_Evidencias/`, que não existe (o slot correto está **dois** níveis acima:
`02_Comodos/<CXX>/05_Evidencias/`). Também o `#156/#157` criou
`08_Execucao_Ao_Vivo/downplant_handoff.md`, que aponta para `../scripts/downplant/validar-handoff.mjs`.

Cada arquivo novo do #153 **soma 1 erro** e a contagem **cresceu durante a medição** (0 → 4 → 5 → 8).
**Nenhuma falha apontou para os artefatos do #155.** O **próprio #153 corrigiu o caminho**
(`../05_Evidencias/` → `../../../05_Evidencias/`) e o lint do repositório **fechou em exit 0**, estável
em 3 execuções consecutivas.

## 4. Lint — saída exata

### Abertura do card #155 (antes de qualquer escrita)
```
$ cd "C:/Users/Bneto04/Documents/Codex/syntheon-gs-downplant-offline"
$ node scripts/downplant/lint-estrutura.mjs
🔍 Verificando Terreno: C:\Users\Bneto04\Documents\Codex\syntheon-gs-downplant-offline
✅ SUCESSO! A arvore documental esta em estrita conformidade com o Down Plant 2.1.   (exit 0)
```

### Durante (cápsulas concorrentes do #153 em escrita, ~13:53–13:58)
```
$ node scripts/downplant/lint-estrutura.mjs
🔍 Verificando Terreno: ...
❌ ERRO: Link quebrado em .../MOD-C00-01_ESTRUTURA_DO_COFRE/MOD-C00-01_ESTRUTURA_DO_COFRE.md: ../05_Evidencias/EV-C00-001_ESTRUTURA_E_VALIDACAO.md
❌ ERRO: Link quebrado em .../MOD-C00-02_VALIDACAO_ESTRUTURAL/MOD-C00-02_VALIDACAO_ESTRUTURAL.md: ../05_Evidencias/EV-C00-001_ESTRUTURA_E_VALIDACAO.md
❌ ERRO: Link quebrado em .../MOD-C02-01_LEITURA_E_ADAPTACAO/MOD-C02-01_LEITURA_E_ADAPTACAO.md: ../05_Evidencias/EV-C02-001_LEITURA_TUNEL_E_FORMULAS.md
❌ ERRO: Link quebrado em .../MOD-C04-01_MOTOR_ANALITICO/MOD-C04-01_MOTOR_ANALITICO.md: ../05_Evidencias/EV-C04-001_MOTOR_E_MERITO_ARMAS.md
🔥 FALHA! 4 erro(s) de estrutura encontrados.                                        (exit 1)
```
A contagem oscilou (4 → 5 → 8) conforme o #153 criava mais cápsulas; em nenhum momento houve erro
apontando para os artefatos do #155.

### Fechamento (após o #153 corrigir o próprio caminho)
```
$ node scripts/downplant/lint-estrutura.mjs
🔍 Verificando Terreno: C:\Users\Bneto04\Documents\Codex\syntheon-gs-downplant-offline
✅ SUCESSO! A arvore documental esta em estrita conformidade com o Down Plant 2.1.   (exit 0)
```
**Estável: 3 execuções consecutivas, todas exit 0.**

### Prova de que nenhuma falha pertence ao #155
```bash
node scripts/downplant/lint-estrutura.mjs 2>&1 | grep "ERRO:" | grep -E "INST-EXEC-001|INSTALACOES_TRANSVERSAIS|RELATORIO_DE_DIFERENCIAS_155" || echo "NENHUM ERRO APONTA PARA OS ARTEFATOS DO #155"
```
Resultado: `NENHUM ERRO APONTA PARA OS ARTEFATOS DO #155`.

Além disso, o documento novo não usa link Markdown (só wikilinks, todos resolvidos —
`[[MOD-C01-01_FORMULARIO_E_MENUS]]` e `[[EXTERNAL_CAPABILITY_REGISTRY]]`) e não contém nenhum
dos tokens legados varridos pelo linter.

## 5. Teste do artefato

```
$ node Testes/TestWebAppExecucao.js
... 11 casos ...
RESULTADOS FINAIS: 11 PASS / 0 FAIL        (exit 0)
```
Nenhuma regressão: o código não foi tocado; o teste guarda `Testes/TestMenuP3.js:190-202`
(features abandonadas GXT/Central Analítica fora do menu, código preservado) **não** é afetado.

## 6. Arquivos escritos

**Repositório canônico (3 escritas, nenhuma em código funcional)**
```
02_Comodos/C00_Governanca_Estrutural/03_Especificacoes/INSTALACOES_TRANSVERSAIS/INST-EXEC-001_ENDPOINT_DE_EXECUCAO.md   (novo)
02_Comodos/C00_Governanca_Estrutural/05_Evidencias/RELATORIO_DE_DIFERENCIAS_155.md                                       (este arquivo)
```
(nenhuma alteração em `Entrada/WebAppExecucao.js`, `Testes/TestWebAppExecucao.js`, `appsscript.json`,
`.clasp.json`, `Testes/RodarTodosOsTestes.js` — `git diff --stat -- '*.js' '*.html' '*.json'` referente ao #155 = vazio)

**Espelho (2 escritas) — derivação**
```
02_Comodos/C00_Governanca_Estrutural/03_Especificacoes/INSTALACOES_TRANSVERSAIS/INST-EXEC-001_ENDPOINT_DE_EXECUCAO.md   (cópia idêntica ao repo)
07_Codigo_Leitura/Entrada/WebAppExecucao.js.md                                                                            (espelho AS-IS, novo)
```

## 7. Limites declarados desta execução

- **Não** houve commit, push, `clasp push`, release, comentário ou fechamento de Issue.
- **Não** foi alterado código funcional (o endpoint e seu teste permanecem byte a byte).
- **Não** foi executada a remoção — o card manda **propor** antes de mutar; a remoção fica registrada
  como plano (§9 do documento) aguardando autorização do Planner/dono.
- **Não** foram corrigidas as divergências de outros cards (`#153` caminho de evidência; taxonomia
  repo × espelho de C00/C01/C05 já reportada no `RELATORIO_DE_DIFERENCIAS_154.md`).
- A sonda `clasp deployments` (somente leitura) foi tentada e **não retornou** (timeout; requer
  sessão/interação) — a ausência de implantação apoia-se no fato fornecido e no `appsscript.json`,
  não nessa sonda.

## 8. Comandos exatos de verificação

```bash
R="C:/Users/Bneto04/Documents/Codex/syntheon-gs-downplant-offline"
E="C:/Users/Bneto04/Documents/Obsidian/Obsidian_Brain/Syntheon"

# 1) o teste do artefato (11 PASS / 0 FAIL)
cd "$R" && node Testes/TestWebAppExecucao.js

# 2) lint do repositório (na abertura do card: exit 0; ver §3 para a concorrência do #153)
cd "$R" && node scripts/downplant/lint-estrutura.mjs; echo "EXIT=$?"

# 3) nenhuma falha de lint aponta para os artefatos do #155
cd "$R" && node scripts/downplant/lint-estrutura.mjs 2>&1 | grep "ERRO:" | grep -E "INST-EXEC-001|INSTALACOES_TRANSVERSAIS|RELATORIO_DE_DIFERENCIAS_155" || echo "NENHUM"

# 4) o artefato nao foi tocado (SHA-256 esperado: 14dc8b86ecf5d492be2b6ebbbf4bbaaa7da8bb540efc3b6cdd0b8b0621377fd2)
cd "$R" && sha256sum Entrada/WebAppExecucao.js

# 5) consumidores reais do endpoint (esperado: apenas o proprio arquivo, o teste e o runner)
cd "$R" && grep -rln "WebAppExecucao\|TOKEN_EXECUCAO\|EXECUCAO_LISTA_BRANCA" . 2>/dev/null | grep -v "^./.git/"

# 6) prova de que a rota clasp run funciona (a premissa do endpoint caiu)
cd "$R" && grep -n "clasp run" agentic/state/RESULT_CORRECAO_145_146_148_CLASP.md

# 7) a derivação existe no espelho
ls -la "$E/02_Comodos/C00_Governanca_Estrutural/03_Especificacoes/INSTALACOES_TRANSVERSAIS/"
ls -la "$E/07_Codigo_Leitura/Entrada/WebAppExecucao.js.md"

# 8) nenhum codigo funcional alterado pelo #155
cd "$R" && git diff --stat -- '*.js' '*.html' '*.json'
```
