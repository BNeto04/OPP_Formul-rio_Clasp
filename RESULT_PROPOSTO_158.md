# RESULT PROPOSTO — #158 (NAO POSTADO)

> Texto proposto para o RESULT do card #158. **Nao foi postado no GitHub** (proibido pelo comando do card).
> **Sem emoji**, conforme `NO_EMOJI_IN_OPERATIONAL_FLOW` (payload operacional): a redacao e ASCII; a unica nao-ASCII vem dos blocos de saida do lint, colados verbatim.
> Pai: #57 · Destrava: #154 · Autor: HERMES · Data: 2026-09-13.

---

[HERMES] RESULT — #158

**Card:** #158 (DP-TAXONOMIA-001 — Reconciliar taxonomia repo x espelho pelo canonico Git) · **Pai:** #57 · **Destrava:** #154
**Repo canonico:** `syntheon-gs-downplant-offline` (branch `sprint/g01-guardiao-qualidade-live-001`, HEAD `8421544`)
**Espelho:** `Obsidian_Brain/Syntheon`
**Regra aplicada:** D1 — repo/GIT define nomes e enderecos; o espelho deriva. Nada de arquitetura ficticia: o que nao tem lastro no repo foi **preservado e reportado**, nao materializado.
**Autorizacao:** card #158 (execucao do lote). Sem commit, sem push, sem `clasp push`, nada postado ou fechado no GitHub, nenhum codigo funcional alterado.

---

## STATUS

**CONCLUIDO NO ESCOPO NOMINAL (nome/endereco).** A **diferenca nominal repo x espelho e ZERO** para o que o card pede: **13 = 13 modulos**, **10 = 10 submodulos**, **48 = 48 slots** de comodo com `INDICE.md`, e **0 endereco do repo ausente no espelho** (era 169 itens). O **lint do espelho caiu de 358 para 20 erros (-338)**; o **lint do repo segue verde (exit 0)**.

Os **20 erros remanescentes do espelho NAO sao divergencia de taxonomia** e nao sao editaveis sem violar uma regra mais forte: **14** sao copias **literais de comentarios do proprio codigo de producao** (espelho somente-leitura com SHA-256; o token legado esta no `.js` do repo) e **6** sao **falsos positivos do validador** (comando de path SVG, array literal de JS dentro de bloco de codigo, e a mencao ao anti-padrao `file:` numa tabela que o proibe). Corrigir exige **card de produto** (limpar comentario no `.js`) ou **card de validador** (isentar bloco de codigo) — ambos **fora do escopo autorizado**; enfraquecer o validador para ficar verde seria trocar evidencia por aparencia.

**Nao reconciliado (com o porque):** 13 elementos so do espelho sem endereco canonico no repo (preservados em `_SUP_158/`, nada apagado), 8 `COMODO-CXX.canvas` de overlay, 21 arquivos de **conteudo** divergente (preservados, nao sobrescritos) e 1 GAP de cobertura do repo (`Core/{Config,Constantes,Logger,Erros,Datas,Validador}.js` nao pertencem a nenhum modulo do Down Plant canonico).

---

## EVIDENCIA TIPADA — antes x depois (medido no disco)

| Item | Antes | Depois | Delta |
|---|---|---|---|
| Lint do ESPELHO | 358 erros (exit 1) | **20 erros (exit 1)** | **-338** |
| Lint do REPO | SUCESSO (exit 0) | SUCESSO (exit 0) | 0 |
| Modulos repo / espelho | 13 / 12 | 13 / **13** | **nominal 0** |
| Submodulos repo / espelho | 10 / 15 | 10 / **10** | **nominal 0** |
| Slots de comodo no espelho (6 x 8) | 17 (16 com indice) | **48 (48 com indice)** | +31 |
| Erros de lint por slot | 32 | **0** | -32 |
| Wikilinks quebrados | 309 | **5** | -304 |
| Erros de "legado" | 17 | 15 | -2 |
| Links markdown quebrados | 0 | **0** | 0 |
| Endereco do repo ausente no espelho | 169 itens | **0** | -169 |
| Arquivos no espelho (sem `.obsidian`) | 172 | 257 | +85 |

**Escrita no espelho (so espelho):** 31 diretorios de slot + 1 `INDICE.md`; 89 diretorios + 80 arquivos copiados do repo em `02_Comodos` (byte-identicos) + 5 em `dependencias/`; **263 wikilinks de forma de caminho convertidos** (217 para link relativo ao alvo exato, 46 repontados ao conteiner); 13 elementos movidos para `_SUP_158/` (29 arquivos, **nada apagado**). **Nenhum arquivo existente do espelho foi sobrescrito.** Inclui o que o card nomeia: `MOD-C01-02_NORMALIZADOR_DE_EFETIVO` + `SUB-C01-02-01_DEPENDENCIA_ARCA` e `MOD-C05-02_NORMALIZADOR_DE_ABA`.

**Escrita no repo:** **apenas** `RELATORIO_DE_DIFERENCIAS_158.md` (arquivo novo, nao rastreado). Nenhum arquivo funcional.

### Lint — saida exata

REPO (inicio e fim, identico):

```
🔍 Verificando Terreno: C:\Users\Bneto04\Documents\Codex\syntheon-gs-downplant-offline


✅ SUCESSO! A arvore documental esta em estrita conformidade com o Down Plant 2.1.
EXIT_REPO=0
```

ESPELHO — antes (358), inicio e fim da saida (log integral em `%LOCALAPPDATA%\Temp\lint_espelho_antes.txt`; composicao: 309 wikilink + 32 slot + 17 legado):

```
🔍 Verificando Terreno: C:\Users\Bneto04\Documents\Obsidian\Obsidian_Brain\Syntheon

❌ ERRO: Comodo C00_Governanca_Estrutural nao possui diretorio slot 02_Integracoes
...
🔥 FALHA! 358 erro(s) de estrutura encontrados.
```

ESPELHO — depois (20), saida integral:

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

## NAO RECONCILIADO (lista com o porque)

1. **13 elementos so do espelho, sem endereco canonico no repo** — `MOD-C00-01_INFRAESTRUTURA_CORE` (+ `SUB-C00-01-01_CONFIGURACOES_E_AMBIENTE`), `MOD-C00-03_CURADOR_OBSIDIAN` (+ `SUB-C00-03-01_SINCRONIZACAO_UNIDIRECIONAL`), `SUB-C00-02-01_LINTER_E_VALIDADOR`, os 3 `SUB-C02-01-0N`, `SUB-C03-01_ENTIDADES_E_OCORRENCIA`, `SUB-C03-02_ARCA_CANONICA`, e 1 submodulo em C04/C05/C06/C06/C08. **Porque:** o repo nunca teve esses enderecos (`git log --all -S "INFRAESTRUTURA_CORE"`, `-S "CURADOR_OBSIDIAN"`, `-S "SUB-C02-01-01"` = nenhuma ocorrencia em qualquer ref). Renomear seria inventar mapeamento (o C00-01 do espelho fala de `Core/*.js`; o canonico fala de estrutura do cofre). **Preservados em `_SUP_158/` com README e 3 rotas de decisao.**
2. **20 erros de lint residuais do espelho** — 14 copias literais de comentarios do codigo de producao (o token legado esta em `Core/RegrasQualidade.js`, `Features/GuardiaoQualidade.js`, `Render/RendererAuditoriaSaude.js`, `Compilador de Entorpecentes.js`, `CPM`, `Entrada/EntradaManual.js` etc., verificado por `grep` no repo) + 6 falsos positivos (path SVG do `Entrada/Formulario.html`, array literal do JS, e a mencao ao anti-padrao `file:` no `CONTRATO_VISUAL_DAS_PLANTAS.md`). **Porque:** editar o espelho falsificaria o espelho do codigo; editar o `.js` e codigo funcional (proibido); afrouxar o validador e enfraquecer a evidencia.
3. **8 `COMODO-CXX.canvas`** (visao de comodo) — overlay de navegacao do espelho, sem colisao de nome com o repo (`CIR-C03_DOMINIO.canvas` convive). Mantidos de proposito (o #154 tambem os preservou); se o proprietario quiser zero absoluto, entram no mesmo conteiner com 1 comando.
4. **21 arquivos de CONTEUDO divergente em endereco comum** — nao e divergencia nominal (nome/endereco iguais), entao nao foram tocados: "preservando conteudo existente". Lista integral na secao 4.6 do relatorio.
5. **71 espelhos de codigo em `07_Codigo_Leitura/`** + 3 documentos de painel + `CONTRATO_VISUAL_DAS_PLANTAS.md` — camada de leitura do Curador, sem endereco no repo. Mantidos.
6. **GAP de cobertura do repo:** `Core/Config.js`, `Constantes.js`, `Logger.js`, `Erros.js`, `Datas.js`, `Validador.js` existem no codigo mas **nenhum modulo do Down Plant canonico os governa** (`grep -rl "Core/Logger.js" 02_Comodos 01_Planta 03_Fundacao 06_Inventario 08_Execucao_Ao_Vivo` = 0). Reportado, nao materializado.
7. **Achado de plataforma:** com o conteiner a 1 nivel de profundidade o caminho mais longo chegava a **265** caracteres e o Windows (limite 260) fazia `os.path.exists`/linter retornarem falso. O conteiner foi para a raiz do espelho e sem o nivel `02_Comodos/` (max agora **247**).
8. **Concorrencia:** outro executor escreve no repo durante esta medicao (`Core/RegrasQualidade.js` 15:11, `Dominio/ARCA/*` 15:11, `scripts/diagnostico-identidade-ocorrencia-160.js` 15:15 = card #160). **Nenhum desses arquivos e desta entrega** (o #158 escreveu zero no repo).

---

## DECLARACAO DAS QUATRO PONTAS

| Ponta | Estado | Prova |
|---|---|---|
| **CODIGO** | **INTOCADO** | Zero `.js`/`.html`/`.json` de produto alterado por esta entrega. `git status --short` das pastas do cofre = vazio. As escritas foram `.md`/`.canvas` **do espelho** + 1 `.md` novo no repo (relatorio). A varredura de links e fence-aware: nao escreve dentro de bloco de codigo. |
| **DOCUMENTACAO** | **ALINHADA (nome/endereco)** | 13 = 13 modulos, 10 = 10 submodulos, 48 = 48 slots com `INDICE.md`, 0 endereco do repo ausente no espelho. 106 arquivos byte-identicos ao repo em enderecos comuns; 21 de conteudo divergente preservados e listados. |
| **CANVAS / PLANTA** | **PRESERVADA / NAO RECONCILIADA VISUALMENTE** | Nenhum `.canvas` do repo alterado. No espelho os `CIR-*.canvas` canonicos foram materializados (copia do repo); os 8 `COMODO-CXX.canvas` seguem como overlay; os circuitos dos elementos preservados foram para `_SUP_158/`. Reconciliacao visual da planta nao e deste card (#154). |
| **GIT** | **PENDENTE — so working tree** | Sem commit, push, tag, release ou `clasp push`; nada postado/fechado no GitHub. **O espelho nao e repositorio git** (nao ha `.git` em `Obsidian_Brain`): a mudanca do espelho **nao tem trilha versionada** — e exatamente por isso que D1 define o repo como canonico. Backup/rollback: `%LOCALAPPDATA%\Temp\dp158_backup\Syntheon_antes`. |

---

## COMANDOS DE VERIFICACAO

```bash
cd "C:/Users/Bneto04/Documents/Codex/syntheon-gs-downplant-offline"
node scripts/downplant/lint-estrutura.mjs ; echo "EXIT=$?"                              # SUCESSO / 0
node scripts/downplant/lint-estrutura.mjs "C:/Users/Bneto04/Documents/Obsidian/Obsidian_Brain/Syntheon" ; echo "EXIT=$?"   # 20 erros / 1
git status --short -- 02_Comodos 03_Fundacao dependencias 07_Codigo_Leitura              # vazio (nada funcional tocado)
find "C:/Users/Bneto04/Documents/Obsidian/Obsidian_Brain/Syntheon/_SUP_158" -type f | wc -l   # 29 (nada perdido)
```

Relatorio de diferencas: `RELATORIO_DE_DIFERENCIAS_158.md` (raiz do repo e raiz do espelho).

---

## LIMITES

- O lint valida estrutura/nomenclatura/legado/links/JSON de canvas — **nao valida semantica**.
- O espelho **nao ficou com lint verde**: os 20 erros exigem decisao fora do escopo (item 2 acima). Nao foram resolvidos por edicao de codigo nem por afrouxamento do validador.
- **Self-attestation declarada:** o mesmo agente executou e escreve este RESULT. As fontes independentes dos numeros sao: saida do `scripts/downplant/lint-estrutura.mjs` (repo e espelho), contagem direta no disco (os dois lados), `sha256` arquivo a arquivo e `git log --all -S`/`git status` no repo. Nao ha verificador terceiro nesta entrega.

## PROXIMO PASSO SEGURO

Decisao do proprietario/Planner sobre as 3 rotas do `_SUP_158/README.md` e sobre os 21 divergentes de conteudo. Sugestao de cards pequenos: (a) produto: limpar comentarios legados nos `.js`; (b) validador: isentar bloco de codigo e mencao a anti-padrao; (c) taxonomia: decidir endereco/descarte dos 13 elementos preservados; (d) conteudo: reconciliar os 21 arquivos lado a lado. Auditoria da entrega (Conferidor) — nenhuma fatia dependente iniciada automaticamente.
