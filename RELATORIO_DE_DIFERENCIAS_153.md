# RELATORIO DE DIFERENCAS - #153 (DP-SYNC-DOC-001)

**Card:** #153 - *Elevar documentacao do Down Plant ao contrato canonico* (Pai: #57).
**Repo canonico:** `C:\Users\Bneto04\Documents\Codex\syntheon-gs-downplant-offline`
**Branch/HEAD no momento do registro:** `sprint/g01-guardiao-qualidade-live-001` / `98f5c8d`
**Data:** 2026-09-13
**Regra dura respeitada:** **zero mudanca funcional** - nenhum `.js`, `.html` ou formula foi tocado. Nao houve
commit, push nem postagem no GitHub.

---

## 1. Metodo

1. Ler o card #153 e os cards-fonte (#140, #141, #142, #144, #152, #150) com `gh issue view <n> -R BNeto04/OPP_Formul-rio_Clasp`.
2. Reconhecer os commits reais com `git log --all --oneline --grep "#<n>"` e `git show --stat`.
3. Atribuir **modulo por modulo** quais arquivos de codigo foram realmente tocados (`git log -- <dir>/`).
4. Escrever **somente o que tem fonte citavel** (codigo existente, commit, card). Ausencia de dado foi **declarada**,
   nunca preenchida por plausibilidade.
5. Medir o antes e o depois por contagem no disco, e rodar o lint antes e depois.

**Formato das evidencias (§46.5) e das dependencias (§31.6): declarado como DERIVADO.** O repo **nao** contem o texto
das secoes §46.5 nem §31.6 - `03_Fundacao/ESTRUTURA_DO_COFRE.md` define os seis slots, os modulos/submodulos e o lint,
e nada mais. O recorte usado (evidencia: *commit . ambiente . entrada . resultado . limite*; dependencia:
*vinculo . evidencia no repo . versao/estado . falha . limite*) foi derivado da capsula de referencia do proprietario
(`MOD-C01-01_FORMULARIO_E_MENUS.md`). **Se o Planner escrever o template oficial, estes arquivos devem ser reescritos.**

---

## 2. Antes x Depois (medido no disco)

| Item | Antes | Depois | Delta |
|---|---|---|---|
| Arquivos em `02_Comodos/*/05_Evidencias/` | **8** (todos `INDICE.md`) | **19** (8 `INDICE.md` + 11 `EV-*.md`) | **+11** |
| `INDICE.md` de `05_Evidencias` com o stub "NAO APLICAVEL" | **8** de 8 | **0** de 8 | **-8** |
| Evidencias §46.5 materializadas (`EV-*.md`) | **0** | **11** | **+11** |
| Capsulas §46.2 de modulo (`MOD-*.md`) | **1** (MOD-C01-01, feita pelo proprietario) | **9** | **+8** |
| `NOTA_DE_RESPONSABILIDADE.md` de **modulo** em stub de 3 linhas | **8** | **0** | **-8** |
| `NOTA_DE_RESPONSABILIDADE.md` de **submodulo** em stub de 3 linhas | **4** | **4** | **0** (fora de escopo - ver §M-5) |
| Arquivos em `dependencias/` | **0** (diretorio inexistente) | **5** (1 `INDICE.md` + 4 registros) | **+5** |
| Registros de dependencia §31.6 | **0** | **4** | **+4** |
| Linhas escritas nos arquivos do #153 | - | **1.968** | - |
| `03_Fundacao/ESTRUTURA_DO_COFRE.md` | 66 linhas | 66 linhas (2 linhas alteradas) | **0 net** |
| Lint `node scripts/downplant/lint-estrutura.mjs` | exit **0** | exit **0** | **0** |
| Codigo funcional alterado | - | **0 arquivos** | **0** |

### Distribuicao das 11 evidencias por comodo

| Comodo | Evidencias | Cards cobertos |
|---|---|---|
| C00_Governanca_Estrutural | 1 | #153, #150 |
| C01_Entrada | 3 | #140, #144, #141 |
| C02_Leitura | 1 | #142, #152 |
| C03_Dominio | 2 | #141, #144, #142 |
| C04_Motor | 1 | #141, #152 |
| C05_Guardiao | 1 | #141, #146-#149 |
| C06_Relatorios | 1 | #152 |
| C08_Homologacao | 1 | #140, #141, #142, #144, #152 |

---

## 3. Arquivos CRIADOS (11 evidencias + 8 capsulas + 5 dependencias)

### 3.1 Evidencias §46.5 (11)

```
C:\Users\Bneto04\Documents\Codex\syntheon-gs-downplant-offline\02_Comodos\C00_Governanca_Estrutural\05_Evidencias\EV-C00-001_ESTRUTURA_E_VALIDACAO.md
C:\Users\Bneto04\Documents\Codex\syntheon-gs-downplant-offline\02_Comodos\C01_Entrada\05_Evidencias\EV-C01-001_OCR_AIS_SEI.md
C:\Users\Bneto04\Documents\Codex\syntheon-gs-downplant-offline\02_Comodos\C01_Entrada\05_Evidencias\EV-C01-002_OCR_ENTORPECENTES_DETIDOS.md
C:\Users\Bneto04\Documents\Codex\syntheon-gs-downplant-offline\02_Comodos\C01_Entrada\05_Evidencias\EV-C01-003_SEMANTICA_ARMA_QDT_ARMAS.md
C:\Users\Bneto04\Documents\Codex\syntheon-gs-downplant-offline\02_Comodos\C02_Leitura\05_Evidencias\EV-C02-001_LEITURA_TUNEL_E_FORMULAS.md
C:\Users\Bneto04\Documents\Codex\syntheon-gs-downplant-offline\02_Comodos\C03_Dominio\05_Evidencias\EV-C03-001_ARCA_ARMAS_SEMANTICA.md
C:\Users\Bneto04\Documents\Codex\syntheon-gs-downplant-offline\02_Comodos\C03_Dominio\05_Evidencias\EV-C03-002_ARCA_CONVERSOES_E_MAPA_FORMULAS.md
C:\Users\Bneto04\Documents\Codex\syntheon-gs-downplant-offline\02_Comodos\C04_Motor\05_Evidencias\EV-C04-001_MOTOR_E_MERITO_ARMAS.md
C:\Users\Bneto04\Documents\Codex\syntheon-gs-downplant-offline\02_Comodos\C05_Guardiao\05_Evidencias\EV-C05-001_GUARDIAO_SEMANTICA_ARMAS.md
C:\Users\Bneto04\Documents\Codex\syntheon-gs-downplant-offline\02_Comodos\C06_Relatorios\05_Evidencias\EV-C06-001_COMPARATIVO_E_ARMAS.md
C:\Users\Bneto04\Documents\Codex\syntheon-gs-downplant-offline\02_Comodos\C08_Homologacao\05_Evidencias\EV-C08-001_SUITES_E_PORTAS_HEADLESS.md
```

### 3.2 Capsulas §46.2 (8 - a do MOD-C01-01 **nao** foi tocada)

```
...\02_Comodos\C00_Governanca_Estrutural\01_Dominio\modulos\MOD-C00-01_ESTRUTURA_DO_COFRE\MOD-C00-01_ESTRUTURA_DO_COFRE.md
...\02_Comodos\C00_Governanca_Estrutural\01_Dominio\modulos\MOD-C00-02_VALIDACAO_ESTRUTURAL\MOD-C00-02_VALIDACAO_ESTRUTURAL.md
...\02_Comodos\C02_Leitura\01_Dominio\modulos\MOD-C02-01_LEITURA_E_ADAPTACAO\MOD-C02-01_LEITURA_E_ADAPTACAO.md
...\02_Comodos\C04_Motor\01_Dominio\modulos\MOD-C04-01_MOTOR_ANALITICO\MOD-C04-01_MOTOR_ANALITICO.md
...\02_Comodos\C05_Guardiao\01_Dominio\modulos\MOD-C05-01_GUARDIAO_DE_QUALIDADE\MOD-C05-01_GUARDIAO_DE_QUALIDADE.md
...\02_Comodos\C06_Relatorios\01_Dominio\modulos\MOD-C06-01_RELATORIOS_OFICIAIS\MOD-C06-01_RELATORIOS_OFICIAIS.md
...\02_Comodos\C06_Relatorios\01_Dominio\modulos\MOD-C06-02_MERITO_DE_ARMAS_GXT\MOD-C06-02_MERITO_DE_ARMAS_GXT.md
...\02_Comodos\C08_Homologacao\01_Dominio\modulos\MOD-C08-01_HOMOLOGACAO_OFFLINE\MOD-C08-01_HOMOLOGACAO_OFFLINE.md
```
(prefacho comum `C:\Users\Bneto04\Documents\Codex\syntheon-gs-downplant-offline\`)

### 3.3 Dependencias §31.6 (5)

```
C:\Users\Bneto04\Documents\Codex\syntheon-gs-downplant-offline\dependencias\INDICE.md
C:\Users\Bneto04\Documents\Codex\syntheon-gs-downplant-offline\dependencias\DEP-001_GOOGLE_APPS_SCRIPT.md
C:\Users\Bneto04\Documents\Codex\syntheon-gs-downplant-offline\dependencias\DEP-002_GOOGLE_SHEETS.md
C:\Users\Bneto04\Documents\Codex\syntheon-gs-downplant-offline\dependencias\DEP-003_CLASP_DEPLOY.md
C:\Users\Bneto04\Documents\Codex\syntheon-gs-downplant-offline\dependencias\DEP-004_ABAS_E_BASES_CANONICAS.md
```

---

## 4. Arquivos pre-existentes MODIFICADOS (17)

| # | Caminho | O que mudou |
|---|---|---|
| 1-8 | `02_Comodos/<CXX>/05_Evidencias/INDICE.md` (8 comodos: C00, C01, C02, C03, C04, C05, C06, C08) | stub "NAO APLICAVEL" **substituido** por indice real, com links para as evidencias e a declaracao de formato derivado |
| 9-16 | `NOTA_DE_RESPONSABILIDADE.md` dos 8 modulos de 3 linhas | **3 -> 9 linhas**: aponta para a capsula §46.2 do proprio modulo |
| 17 | `03_Fundacao/ESTRUTURA_DO_COFRE.md` | +1 linha (`dependencias` em *Diretorios Raiz*) e 1 linha ajustada ("sete" -> "oito diretorios ativos"), para nao contradizer a nova pasta |

Fora da conta acima ficam **2 correcoes internas** feitas nos arquivos **criados** neste card (nao sao arquivos
pre-existentes): a tabela do `MOD-C02-01` teve um pipe literal dentro de celula resolvido, e o `MOD-C04-01` teve um
erro de digitacao corrigido.

**Modulo protegido:** `MOD-C01-01_FORMULARIO_E_MENUS.md` **nao foi reescrito** (ordem explicita do proprietario).

---

## 5. O que NAO foi feito (ausencias declaradas, nao preenchidas)

- **M-1 - Commit / push / post no GitHub:** proibido pelo card. Todos os arquivos estao **untracked/modificados** no worktree.
- **M-2 - Espelho Obsidian (`Obsidian_Brain/Syntheon`):** **nao** foi tocado. O espelho esta **divergente** (nao possui
  `05_Evidencias` e usa outra taxonomia, ex.: `MOD-C00-01_INFRAESTRUTURA_CORE`, `SUB-C02-01-01_LEITURA_DE_PLANILHAS`).
  Tratado no **#154**.
- **M-3 - Evidencia do produto real (planilha):** as abas `COMPARATIVO_2026`, `SET2026` (linha 28) e as listas de armas
  vivem na planilha e **nao** sao versionaveis aqui. O que esta registrado e a **declaracao do card/proprietario**.
- **M-4 - Modulos nao-stub nao receberam capsula:** `MOD-C01-02_NORMALIZADOR_DE_EFETIVO` (32 linhas),
  `MOD-C03-01_MODELO_DE_OCORRENCIA` (**9 linhas** - tem `MAPA_DO_TUNEL_E_FORMULAS.md`), `MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO`
  (49 linhas) e `MOD-C05-02_NORMALIZADOR_DE_ABA` (37 linhas). O card pediu "modulos que ainda estejam como **stub de 3 linhas**";
  `MOD-C03-01` fica **explicitamente de fora** por ter 9 linhas - **nao** foi reescrito nem inventado.
- **M-5 - Submodulos continuam stub (4):** `SUB-C00-01-01_MIGRACAO_DP21`, `SUB-C00-01-02_PLANTA_MESTRA`,
  `SUB-C00-02-01_LINT` e `SUB-C01-01-02_PERSISTENCIA_MANUAL`. O card falou em **modulos**; estes 4 sao **candidatos
  declarados** a um proximo card (o `SUB-C01-01-02` foi de fato tocado pelo #140/#144, em `Entrada/EntradaManual.js`).
- **M-6 - `dependencias/` nao entra na varredura do lint.** O diretorio foi criado no #153 (registrado no manifesto),
  mas **nao** foi somado a `docsDirs` de `scripts/downplant/lint-estrutura.mjs` para nao alterar o validador dentro de um
  card de documentacao. Consequencia declarada: os registros §31.6 **nao** tem gate estrutural.
- **M-7 - Numeros divergentes de suite nao foram reconciliados:** 411 PASS (#141) x 423 PASS (#140/#144) x 620 PASS (`b74f9d0`).
  Sao medicoes de momentos diferentes; nao existe uma medicao unica canonica no repo.

---

## 6. Divergencias factuais descobertas (nao corrigidas, apenas registradas)

| ID | Divergencia | Fonte |
|---|---|---|
| D-1 | **`agentic/state/RESULT_152_PARTE1_ARMAS.md` cita o commit `b7a0a5d` como "elo final" - esse hash NAO EXISTE no repositorio** (`git log --all` varrido, 10 refs + HEAD). O elo versionado e `824b545`. Registrada em `EV-C06-001` e na capsula `MOD-C06-01`. | git + RESULT 152 |
| D-2 | **Contagem de arquivos publicados:** `81/81 byte-iguais ao HEAD` (cards #140/#141/#144) x `68 arquivos canonicos` (`ponte2_chatgpt_gravity/server/send_audit_fix_result.js`). Nao reconciliados. | cards x log interno |
| D-3 | **Fuso horario:** `appsscript.json` = `America/Sao_Paulo` x `Core/Config.js` = `America/Recife`. Visivel no repo, efeito **nao avaliado**. | manifesto x config |
| D-4 | **`Motor/` nao foi alterado** por nenhum commit dos cards citados - o "#141 auditou o Motor" e **leitura**, nao alteracao. Registrado honestamente em `EV-C04-001`. | `git log -- Motor/` |
| D-5 | **Protocolo de homologacao offline (C06) proibia qualquer push**; os cards #140/#141/#144 registraram `clasp push` com verificacao remota. Os dois registros convivem e a distincao **nao esta explicada em um unico lugar**. | C06 x cards |
| D-6 | **`Testes/TestNormalizadorEfetivo.js` nunca foi versionado** (untracked, listado no #150) - logo **nao** esta na suite. | #150 |

---

## 7. Verificacao (comandos e saida)

```bash
cd "C:\Users\Bneto04\Documents\Codex\syntheon-gs-downplant-offline"
node scripts/downplant/lint-estrutura.mjs
```

Saida (**antes** de qualquer criacao e **depois** de todas as criacoes - identica):

```
🔍 Verificando Terreno: C:\Users\Bneto04\Documents\Codex\syntheon-gs-downplant-offline


✅ SUCESSO! A arvore documental esta em estrita conformidade com o Down Plant 2.1.
```

Contagens (medidas no disco, com a saida real):

```bash
find 02_Comodos -path "*05_Evidencias/EV-*.md" | wc -l          # 11
find 02_Comodos -name "MOD-*.md" | wc -l                        # 9
ls dependencias/ | wc -l                                        # 5
find 02_Comodos -name "NOTA_DE_RESPONSABILIDADE.md" -not -path "*submodulos*" | \
  while read f; do wc -l < "$f"; done | grep -c "^3$"           # 0 (nenhum stub de modulo restante)
git diff --name-only -- '*.js' '*.html' '*.json'                # (vazio) nenhum codigo rastreado alterado
git status --short -- '*.js' '*.html' '*.json'                  # apenas untracked PRE-EXISTENTES a este card
```

Os arquivos listados por `git status --short -- '*.js'` (`Testes/TestNormalizadorEfetivo.js`, `scripts/build-gxt.js`,
`scripts/graphify-cartografia.js`, `scripts/send_audit_fix_result.js`, `scripts/send_live_check_result.js`) **ja eram
untracked antes deste card** (confirmado no `git status` inicial) - **nenhum** deles foi tocado aqui.

**Correcao intermediaria declarada (honestidade de processo):** entre a primeira e a ultima rodada de lint houve
**1 rodada com falha** - `FALHA! 8 erro(s)`, todos de *link quebrado* nos novos arquivos de capsula
(`../05_Evidencias/` em vez de `../../../05_Evidencias/`). O caminho relativo foi corrigido nos 8 arquivos e a
rodada final voltou a `exit 0`. **O lint nao ficou verde por omissao: foi corrigido.**

**Trabalho paralelo no mesmo worktree (nao e deste card):** o worktree contem alteracoes de outros agentes
(#154/#155) - inclui **canvas modificados** (`01_Planta/PLANTA_MESTRA.canvas` e os `CIR-MOD-*.canvas`) e arquivos
como `RELATORIO_DE_DIFERENCIAS_154.md`, `RELATORIO_DE_DIFERENCIAS_155.md`, `RESULT_PROPOSTO_154.md` e
`08_Execucao_Ao_Vivo/downplant_handoff.*`. **Este trabalho nao alterou nenhum `.canvas`.**

---

## 8. Criterios de aceite do card #153 (releitura)

- [x] **Documentacao reflete o codigo/GIT canonico** - cada evidencia cita commit real e card real; divergencias declaradas.
- [x] **Capsulas/evidencias/dependencias necessarias materializadas** - 8 capsulas §46.2, 11 evidencias §46.5, 4 registros §31.6.
- [x] **Relatorio de diferencas antes/depois** - este arquivo, com numeros medidos.
- [x] **Zero mudanca funcional** - nenhum arquivo de codigo tocado; lint exit 0 antes e depois.
- [ ] **Commit / push** - **nao** fazem parte do escopo autorizado deste trabalho (proibidos no comando).
