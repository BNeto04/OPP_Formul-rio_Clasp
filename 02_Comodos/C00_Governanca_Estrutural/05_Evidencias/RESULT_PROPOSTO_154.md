# [HERMES] RESULT — #154

**Card:** #154 (DP-SYNC-CANVAS-001 — Reconciliar Canvas e Planta Mestra com o terreno real) · **Pai:** #57
**Repositório canônico:** `syntheon-gs-downplant-offline` · **Espelho:** `Obsidian_Brain/Syntheon`
**Regra aplicada:** `repo/GIT define nomes e endereços canônicos`. Método do proprietário respeitado: **nada de arquitetura fictícia** — comportamento sem lastro foi marcado e reportado, não desenhado.

> **Nota de medição (concorrência):** outra execução (card #153 e artefatos correlatos) estava escrevendo no repo **e** no espelho durante esta medição. O **delta atribuível a este card é −8 no espelho e 0 no repo** (o repo passou exit 0 com esta entrega). Os números absolutos do espelho derivaram de 358 para **359** e os do repo de 0 para **8** por causa dessas escritas alheias — todas identificadas no relatório de diferenças (§6.1).

---

## STATUS

**CONCLUÍDO NO ESCOPO DO CANVAS/PLANTA.** Repo reconciliado e lint **SUCESSO (exit 0)** imediatamente após a entrega; espelho reduzido de **366 → 358** erros. **14 circuitos vazios preenchidos** (10 de módulo + 4 de submódulo), **0 vazios restantes no repo**, PLANTA MESTRA reconstruída com **8 cômodos + 13 módulos + 3 vizinhança + 7 portas**. As divergências que exigem **decisão do proprietário** ficaram **marcadas e reportadas** (§ DIFERENÇAS ABERTAS) em vez de corrigidas por conta própria.

Sem commit · sem push · sem `clasp push` · nada postado ou fechado no GitHub · nenhum código funcional alterado.

---

## EVIDÊNCIA TIPADA — arquivos + contagens

### 1. REPOSITÓRIO — 15 arquivos `.canvas` escritos (antes → depois)

| Circuito | Antes | Depois |
|---|---|---|
| `01_Planta/PLANTA_MESTRA.canvas` | 13 n / 13 a | **31 n / 43 a** |
| `CIR-MOD-C00-01_ESTRUTURA_DO_COFRE` | 0 / 0 | **10 / 9** |
| `CIR-SUB-C00-01-01_MIGRACAO_DP21` | 0 / 0 | **5 / 4** |
| `CIR-SUB-C00-01-02_PLANTA_MESTRA` | 0 / 0 | **4 / 3** |
| `CIR-MOD-C00-02_VALIDACAO_ESTRUTURAL` | 0 / 0 | **7 / 7** |
| `CIR-SUB-C00-02-01_LINT` | 0 / 0 | **5 / 4** |
| `CIR-SUB-C01-01-02_PERSISTENCIA_MANUAL` | 0 / 0 | **5 / 5** |
| `CIR-MOD-C02-01_LEITURA_E_ADAPTACAO` | 0 / 0 | **9 / 11** |
| `CIR-MOD-C03-01_MODELO_DE_OCORRENCIA` | 0 / 0 | **8 / 8** |
| `CIR-MOD-C04-01_MOTOR_ANALITICO` | 0 / 0 | **8 / 8** |
| `CIR-MOD-C05-01_GUARDIAO_DE_QUALIDADE` | 0 / 0 | **10 / 10** |
| `CIR-MOD-C05-02_NORMALIZADOR_DE_ABA` | 0 / 0 | **9 / 9** |
| `CIR-MOD-C06-01_RELATORIOS_OFICIAIS` | 0 / 0 | **9 / 9** |
| `CIR-MOD-C06-02_MERITO_DE_ARMAS_GXT` | 0 / 0 | **8 / 8** |
| `CIR-MOD-C08-01_HOMOLOGACAO_OFFLINE` | 0 / 0 | **8 / 7** |

**Os 13 circuitos de módulo (`CIR-MOD-*`):** 10 estavam com **0 nós / 0 arestas** → **nenhum vazio**. Os 3 já preenchidos (`CIR-MOD-C01-01` 15/17, `CIR-MOD-C01-02` 4/3, `CIR-MOD-C03-02` 6/5) foram **preservados sem alteração**.
**Nenhum arquivo não-vazio teve conteúdo substituído.** 25 canvas no repo · **0 vazios** após a entrega.

### 2. ESPELHO — 9 arquivos escritos (mesma derivação)

| Circuito (espelho) | Antes | Depois |
|---|---|---|
| `01_Planta/PLANTA_MESTRA.canvas` | 32 n / 11 a | **31 n / 43 a** |
| `CIR-MOD-C00-02_VALIDACAO_ESTRUTURAL` | 0 / 0 | **7 / 7** |
| `CIR-MOD-C02-01_LEITURA_E_ADAPTACAO` | 0 / 0 | **9 / 11** |
| `CIR-MOD-C03-01_MODELO_DE_OCORRENCIA` | 0 / 0 | **8 / 8** |
| `CIR-MOD-C04-01_MOTOR_ANALITICO` | 0 / 0 | **8 / 8** |
| `CIR-MOD-C05-01_GUARDIAO_DE_QUALIDADE` | 0 / 0 | **10 / 10** |
| `CIR-MOD-C06-01_RELATORIOS_OFICIAIS` | 0 / 0 | **9 / 9** |
| `CIR-MOD-C06-02_MERITO_DE_ARMAS_GXT` | 0 / 0 | **8 / 8** |
| `CIR-MOD-C08-01_HOMOLOGACAO_OFFLINE` | 0 / 0 | **8 / 7** |

**8 circuitos de módulo vazios → 0** no espelho. **Prova de "mesma derivação":** os 9 arquivos são **idênticos byte a byte (SHA-256)** entre repo e espelho, incluindo a planta. Os outros 27 canvas do espelho **não foram tocados** (preservam estilo próprio com `group`, código e emojis).

### 3. PLANTA MESTRA — composição medida

`01_Planta/PLANTA_MESTRA.canvas` · **31 nós / 43 arestas** · **Cômodos 8** · **Módulos 13** · **Vizinhança externa 3** · **Portas 7**.
- Vizinhança: texto do BO (SEI/CIODS/PMPE) · Google Sheets (abas mensais A..AK, EFETIVO, Tabela PIP, auditoria/histórico) · planilha PECULIO (antiguidade N).
- Portas: **P3** (menu único) · **payload** (`processarEntradaManual`, AE/AF) · **EFETIVO** · **ARCA** (read-only, fail-soft) · **AM** (coluna 39, única escrita pelo Guardião) · **saída de relatórios** · **publicação** (`clasp push` / `.claspignore`).
- Arestas: 13 `cômodo → módulo` (`contem`) + 30 de fluxo real.

### 4. Relatório de diferenças

`02_Comodos/C00_Governanca_Estrutural/05_Evidencias/RELATORIO_DE_DIFERENCAS_154.md` — antes/depois medido de **25 canvas do repo + 35 do espelho**, rastreabilidade **nó → arquivo de código/doc** para cada circuito, divergências abertas e comandos de verificação.

### 5. LINT — saída exata

```text
# ANTES (repo)
node scripts/downplant/lint-estrutura.mjs .
✅ SUCESSO! A arvore documental esta em estrita conformidade com o Down Plant 2.1.   exit 0

# ANTES (espelho)
node scripts/downplant/lint-estrutura.mjs "C:/Users/Bneto04/Documents/Obsidian/Obsidian_Brain/Syntheon"
🔥 FALHA! 366 erro(s) de estrutura encontrados.   exit 1
   317 WikiLink quebrado | 32 Comodo (slot ausente) | 17 Legado encontrado

# DEPOIS (repo, imediatamente após a entrega dos 15 canvas + relatório)
node scripts/downplant/lint-estrutura.mjs .
✅ SUCESSO! A arvore documental esta em estrita conformidade com o Down Plant 2.1.   exit 0

# DEPOIS (espelho)
node scripts/downplant/lint-estrutura.mjs "C:/Users/Bneto04/Documents/Obsidian/Obsidian_Brain/Syntheon"
🔥 FALHA! 358 erro(s) de estrutura encontrados.   exit 1
   309 WikiLink quebrado | 32 Comodo (slot ausente) | 17 Legado encontrado
```

**Espelho: 366 → 358** (−8 = os wikilinks em forma de caminho que existiam dentro da `PLANTA_MESTRA.canvas` do espelho). Os **358 restantes são a taxonomia divergente** descrita abaixo — evidência do problema que este card resolve.

> **RESSALVA HONESTA (medição no fechamento):** o lint do repo **passou exit 0** com a entrega deste card, mas **voltou a falhar** (8 erros e subindo) porque **a execução concorrente do card #153** começou a gravar as cápsulas `MOD-CXX-NN_*.md` com o caminho relativo **inválido** `../05_Evidencias/...` (de `.../01_Dominio/modulos/<MOD>/` isso resolve para `01_Dominio/05_Evidencias/`, que não existe; o correto é `../../../05_Evidencias/`). **Nenhum erro aponta para os 15 canvas desta entrega nem para o relatório** — verificado por filtro explícito. Correção sugerida para o #153: usar `../../../05_Evidencias/` nas cápsulas.

### 6. Validação estrutural adicional

**0 problemas** em 25 canvas do repo e 35 do espelho: JSON válido · ids de nó e de aresta únicos · toda aresta com `fromNode`/`toNode` existentes · todo nó com `id/type/x/y/width/height` · todo nó `file` com destino existente. Os canvas foram escritos sem wikilink e sem link markdown, portanto não introduzem novas quebras no linter.

---

## DECLARAÇÃO DAS QUATRO PONTAS

| Ponta | Estado | Prova |
|---|---|---|
| **CÓDIGO** | **🟢 Intocado** | `git diff --stat -- '*.js' '*.html' '*.json'` → **vazio**. Nenhum arquivo de runtime, teste, schema ou configuração foi alterado. O comportamento de cada circuito foi **lido** do código (`Motor/MotorAnaliticoV2.js`, `Core/RegrasQualidade.js`, `Core/ContratoMutacaoSegura.js`, `Features/GuardiaoQualidade.js`, `Homologacao/Framework/HomologationEngine.js`, `Leitura/Adaptador2026.js`, `Core/LeitorPlanilhas.js`, `Dominio/ARCA/AdaptadorConsultaArca.js`, entre outros) — nunca inferido. |
| **DOCUMENTAÇÃO** | **🟢 Lida, não reescrita** | Fonte de cada nó: `03_Fundacao/ESTRUTURA_DO_COFRE.md` (manifesto DP-VAULT-1 / 2.1 / P1), `MAPA_DO_TUNEL_E_FORMULAS.md` (card #142 — 37 colunas A..AK e fórmulas literais), `CONTRATO_MUTACAO_SEGURA.md` + `DRY_RUN_E_PLANO.md` + `EXECUTOR_SEGURO.md` + `REAUDITORIA_E_DELTA.md` (cards #118-#121), `NOTA_DE_RESPONSABILIDADE.md` dos módulos, `INDICE.md` de visão dos cômodos C02/C04/C05/C06 e `scripts/downplant/lint-estrutura.mjs`. Nenhuma nota, índice ou cápsula existente foi alterada. |
| **CANVAS / PLANTA** | **🟢 Reconciliados** | 14 circuitos vazios preenchidos (10 `CIR-MOD-*` + 4 `CIR-SUB-*`), **0 vazios** no repo; PLANTA MESTRA com 8/13/3/7; espelho derivado com **9 arquivos idênticos por SHA-256**; lint do repo **exit 0** após a entrega. |
| **GIT** | **🟢 Somente working tree** | **Sem commit, sem push, sem tag, sem release.** Não houve `clasp push`. Nada postado, comentado ou fechado no GitHub. Alterações locais não commitadas: **15** `.canvas` (repo) + **9** arquivos no espelho + **1** `.md` de evidência (relatório) + este RESULT. Backup do estado anterior dos 60 canvas (25 repo + 35 espelho) em `%LOCALAPPDATA%\Temp\dp154_backup`. |

---

## DIFERENÇAS ABERTAS — marcadas, NÃO corrigidas (decisão do proprietário)

1. **ARCA — 4 contagens de regras divergentes.** `Dominio/ARCA/arca_regras_dominio.json` = **48** regras (10 OFFICIAL_BUSINESS · 30 INTERNAL_OPERATIONAL · 2 HEURISTIC · 5 TECHNICAL · 1 CANONICAL_NORMATIVE); `ARCA_REGRAS_DOMINIO.md` = **40**; `INVENTARIO_ARCA.md` = **45** (e "29 auditadas pelo Guardião"); o circuito `CIR-MOD-C03-02` (já preenchido) = **31**. Medição real de `AdaptadorConsultaArca.MAPA_DIAGNOSTICO_ARCA`: **36 códigos → 29 rule_ids**. O `INVENTARIO_ARCA.md` declara "fonte da verdade: o JSON" (⇒ 48), mas **não há decisão registrada**. **Não corrigido por falta de decisão**, apesar de ser derivável.
2. **Taxonomia divergente repo × espelho (a causa dos 358 erros).** Módulos: **13 no repo** × **12 no espelho**. O espelho tem `MOD-C00-01_INFRAESTRUTURA_CORE` e `MOD-C00-03_CURADOR_OBSIDIAN` **sem endereço canônico no repo** — por isso **não receberam circuito**: criá-lo seria inventar arquitetura. O espelho **não possui** `MOD-C01-02_NORMALIZADOR_DE_EFETIVO` nem `MOD-C05-02_NORMALIZADOR_DE_ABA`. Submódulos: 7 (repo) × 15 (espelho), com nomes diferentes.
3. **Espelho sem 4 slots por cômodo.** Faltam `02_Integracoes`, `03_Especificacoes`, `04_Execucao`, `05_Evidencias` nos 8 cômodos → **32 erros** do linter.
4. **Espelho com legado e wikilinks em forma de caminho.** **17 erros** de legado (`07_Codigo_Leitura/*.js.md`) e **309 wikilinks** que o linter resolve por nome-base — a forma de caminho completo nunca resolve.
5. **5 circuitos parcialmente preenchidos (1 nó / 0 arestas)** — `CIR-SUB-C01-02-01_DEPENDENCIA_ARCA` e os 4 `CIR-SUB-C03-02-*`. **Não tocados**: não estavam vazios e não há fonte que autorize desenhar as arestas internas.
6. **Concorrência:** as cápsulas do card #153 (`MOD-CXX-NN_*.md`) introduziram **8 erros de lint** no repo, por link relativo inválido (§ LINT, ressalva). **Não são desta entrega** e não foram corrigidos para não invadir artefato de outro card em execução.

---

## COMANDOS EXATOS DE VERIFICAÇÃO

```bash
cd "C:/Users/Bneto04/Documents/Codex/syntheon-gs-downplant-offline"

# 1) lint do repositorio
node scripts/downplant/lint-estrutura.mjs . ; echo "EXIT=$?"

# 2) lint do espelho (358 erros = taxonomia divergente, ver DIFERENÇAS ABERTAS)
node scripts/downplant/lint-estrutura.mjs "C:/Users/Bneto04/Documents/Obsidian/Obsidian_Brain/Syntheon" ; echo "EXIT=$?"

# 3) contagem de nos/arestas de todos os canvas do repo
node -e "const fs=require('fs'),path=require('path');(function w(d,a){for(const f of fs.readdirSync(d)){if(f==='.git')continue;const p=path.join(d,f);fs.statSync(p).isDirectory()?w(p,a):f.endsWith('.canvas')&&a.push(p)}return a})('.',[]).sort().forEach(p=>{const c=JSON.parse(fs.readFileSync(p,'utf8'));console.log((c.nodes||[]).length+' n / '+(c.edges||[]).length+' e  '+p)})"

# 4) composicao da PLANTA MESTRA -> comodos 8 modulos 13 vizinhanca 3 portas 7 nos 31 arestas 43
node -e "const fs=require('fs');const c=JSON.parse(fs.readFileSync('01_Planta/PLANTA_MESTRA.canvas','utf8'));const i=c.nodes.map(n=>n.id);const f=p=>i.filter(x=>x.startsWith(p)).length;console.log('comodos',f('room_'),'modulos',f('mod_'),'vizinhanca',f('ext_'),'portas',f('porta_'),'nos',i.length,'arestas',c.edges.length)"

# 5) nenhum circuito vazio restante no repo -> "vazios: 0"
node -e "const fs=require('fs'),path=require('path');let e=0,t=0;(function w(d){for(const f of fs.readdirSync(d)){if(f==='.git')continue;const p=path.join(d,f);if(fs.statSync(p).isDirectory())w(p);else if(f.endsWith('.canvas')){t++;if(JSON.parse(fs.readFileSync(p,'utf8')).nodes.length===0)e++;}}})('.');console.log('total canvas no repo:',t,'| vazios:',e)"

# 6) identidade repo x espelho da PLANTA MESTRA (mesmo hash nos dois caminhos)
sha256sum "01_Planta/PLANTA_MESTRA.canvas" "C:/Users/Bneto04/Documents/Obsidian/Obsidian_Brain/Syntheon/01_Planta/PLANTA_MESTRA.canvas"

# 7) provar que nenhum codigo funcional foi alterado (saida deve ser vazia)
git diff --stat -- '*.js' '*.html' '*.json'

# 8) provar que nenhuma falha de lint pertence a este card (saida esperada: NENHUM)
node scripts/downplant/lint-estrutura.mjs . 2>&1 | grep "ERRO:" | grep -E "RELATORIO_DE_DIFERENCAS_154|CIR-MOD|CIR-SUB|PLANTA_MESTRA" || echo "NENHUM"
```

---

## CRITÉRIOS DE DONE DO CARD — leitura honesta

| Critério do #154 | Estado |
|---|---|
| "circuitos relevantes não vazios" | **ATINGIDO** — 0 vazios no repo (era 14); 0 vazios de módulo no espelho (era 8). |
| "PLANTA MESTRA com cômodos, módulos, vizinhança, portas e conexões" | **ATINGIDO** — 8 + 13 + 3 + 7, 43 arestas. |
| "diferença nominal/endereço = 0" | **NÃO ATINGIDO** — depende de decidir a taxonomia (§ DIFERENÇAS ABERTAS 1-4). A regra `repo/GIT define nomes` aponta o rumo, mas renomear módulos do espelho e criar 4 slots × 8 cômodos é mudança estrutural, não preenchimento de circuito. |
| "evidência de validação estrutural" | **ATINGIDO** — lint exato (antes/depois), 0 problemas estruturais em 60 canvas, 9 arquivos idênticos por SHA-256, contagens por circuito. |

**Próximo passo sugerido (não executado):** card de reconciliação nominal do espelho com o repo (renomear `MOD-C00-01_INFRAESTRUTURA_CORE` → `ESTRUTURA_DO_COFRE`, decidir o destino de `MOD-C00-03_CURADOR_OBSIDIAN`, criar `MOD-C01-02` e `MOD-C05-02` no espelho, criar os 4 slots ausentes e trocar wikilinks de caminho por nome-base) e card de decisão da contagem canônica da ARCA.
