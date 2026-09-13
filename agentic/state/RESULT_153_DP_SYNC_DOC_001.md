# [HERMES] RESULT — #153 (DP-SYNC-DOC-001) — Elevar documentação do Down Plant ao contrato canônico

**STATUS:** `DONE (documental)` — 8 cápsulas §46.2, 11 evidências §46.5, 4 registros de dependência §31.6 e o
relatório de diferenças materializados. **Zero mudança funcional.** Lint estrutural `exit 0` antes e depois.
**Nada foi commitado, empurrado ou postado.**

**Data:** 2026-09-13 · **Branch:** `sprint/g01-guardiao-qualidade-live-001` · **HEAD:** `98f5c8d` (inalterado)
**Pai:** #57 · **Regra ADM:** estrutura do repositório/GIT é canônica.

---

## 1. Decisão de forma (declaração honesta)

O repo **não contém** o texto das seções §46.5 nem §31.6. `03_Fundacao/ESTRUTURA_DO_COFRE.md` define os seis slots,
os módulos/submódulos e o lint — e nada mais. O recorte adotado foi **derivado da cápsula de referência do
proprietário** (`MOD-C01-01_FORMULARIO_E_MENUS.md`):

- **Evidência §46.5** → `commit · ambiente · entrada · resultado · limite`;
- **Dependência §31.6** → `vínculo · evidência no repo · versão/estado · falha · limite`.

Os dois arquivos `dependencias/INDICE.md` e `03_Fundacao/ESTRUTURA_DO_COFRE.md` **declaram** isso. Se o Planner
escrever o template oficial, estes arquivos devem ser reescritos nele.

**Regra do dono aplicada em todos os arquivos:** *evidência sem fonte não existe*. Nenhum campo foi preenchido por
plausibilidade; toda ausência está **declarada como ausência**.

---

## 2. Evidência tipada

### 2.1 Estrutura (medida no disco)

| Verificação | Comando | Resultado |
|---|---|---|
| Lint estrutural | `node scripts/downplant/lint-estrutura.mjs` | **exit 0** — `SUCESSO! A arvore documental esta em estrita conformidade com o Down Plant 2.1.` |
| Evidências criadas | `find 02_Comodos -path "*05_Evidencias/EV-*.md" \| wc -l` | **11** (antes: 0) |
| Cápsulas §46.2 | `find 02_Comodos -name "MOD-*.md" \| wc -l` | **9** (antes: 1 — a do proprietário) |
| Dependências | `ls dependencias/ \| wc -l` | **5** (antes: diretório inexistente) |
| Stubs de módulo restantes | `... NOTA_DE_RESPONSABILIDADE.md -not -path "*submodulos*" ... \| grep -c "^3$"` | **0** (antes: 8) |
| `INDICE.md` de `05_Evidencias` ainda com stub | contagem direta | **0** de 8 (antes: 8 de 8) |
| Links internos quebrados | varredura recursiva dos links relativos | **0** |
| Código rastreado alterado | `git diff --name-only -- '*.js' '*.html' '*.json'` | **vazio** |

### 2.2 Evidências materializadas (§46.5) — 11 arquivos, 8 cômodos

```
02_Comodos/C00_Governanca_Estrutural/05_Evidencias/EVD-C00-001_ESTRUTURA_E_VALIDACAO.md   (#153, #150)
02_Comodos/C01_Entrada/05_Evidencias/EVD-C01-001_OCR_AIS_SEI.md                            (#140)
02_Comodos/C01_Entrada/05_Evidencias/EVD-C01-002_OCR_ENTORPECENTES_DETIDOS.md              (#144)
02_Comodos/C01_Entrada/05_Evidencias/EVD-C01-003_SEMANTICA_ARMA_QDT_ARMAS.md               (#141)
02_Comodos/C02_Leitura/05_Evidencias/EVD-C02-001_LEITURA_TUNEL_E_FORMULAS.md               (#142, #152)
02_Comodos/C03_Dominio/05_Evidencias/EVD-C03-001_ARCA_ARMAS_SEMANTICA.md                   (#141)
02_Comodos/C03_Dominio/05_Evidencias/EVD-C03-002_ARCA_CONVERSOES_E_MAPA_FORMULAS.md        (#144, #142)
02_Comodos/C04_Motor/05_Evidencias/EVD-C04-001_MOTOR_E_MERITO_ARMAS.md                     (#141, #152)
02_Comodos/C05_Guardiao/05_Evidencias/EVD-C05-001_GUARDIAO_SEMANTICA_ARMAS.md              (#141, #146-#149)
02_Comodos/C06_Relatorios/05_Evidencias/EVD-C06-001_COMPARATIVO_E_ARMAS.md                 (#152)
02_Comodos/C08_Homologacao/05_Evidencias/EVD-C08-001_SUITES_E_PORTAS_HEADLESS.md           (#140..#152)
```

### 2.3 Cápsulas §46.2 completadas — 8 (o `MOD-C01-01` **não** foi reescrito, por ordem do proprietário)

`MOD-C00-01_ESTRUTURA_DO_COFRE` · `MOD-C00-02_VALIDACAO_ESTRUTURAL` · `MOD-C02-01_LEITURA_E_ADAPTACAO` ·
`MOD-C04-01_MOTOR_ANALITICO` · `MOD-C05-01_GUARDIAO_DE_QUALIDADE` · `MOD-C06-01_RELATORIOS_OFICIAIS` ·
`MOD-C06-02_MERITO_DE_ARMAS_GXT` · `MOD-C08-01_HOMOLOGACAO_OFFLINE`
— cada uma com a `NOTA_DE_RESPONSABILIDADE.md` (3 → 9 linhas) apontando para a cápsula.

### 2.4 Dependências reais (§31.6) — `dependencias/`

| ID | Dependência | Estado |
|---|---|---|
| [DEP-001](../../dependencias/DEP-001_GOOGLE_APPS_SCRIPT.md) | Google Apps Script (runtime; `appsscript.json` → V8, `dependencies: {}`) | ativo |
| [DEP-002](../../dependencias/DEP-002_GOOGLE_SHEETS.md) | Google Sheets (abas mensais `JAN2026..DEZ2026`, `[AUDITORIA]`, coluna `AM`) | ativo |
| [DEP-003](../../dependencias/DEP-003_CLASP_DEPLOY.md) | clasp (deploy/push; `.clasp.json`, `.claspignore`) | ativo |
| [DEP-004](../../dependencias/DEP-004_ABAS_E_BASES_CANONICAS.md) | abas `EFETIVO`, catálogo PIP, base territorial AIS (`tabela_territorial_ais.json` v1.0.0), pecúlio | ativo |

### 2.5 Fontes de verdade usadas (todas reais)

**Cards lidos:** #153, #150, #152, #144, #142, #141, #140 (via `gh issue view <n> -R BNeto04/OPP_Formul-rio_Clasp`).
**Commits citados** (reconhecidos com `git show --stat`): `62635ca`, `4dde66a`, `27daa78`, `966bba0`, `a1de4bf`,
`0c489ad`, `8f9bec8`, `7b2d898`, `5ac6670`, `61e4415`, `fa52c07`, `c60aeea`, `266a7db`, `b74f9d0`, `a2a06b2`,
`74842d2`, `d4f6c0c`, `4dcdab5`, `ab2e1b6`, `4b7b58d`, `64daaed`, `efd12f9`, `be68de8`, `9195a18`, `1b2c0ae`,
`2263d87`, `3d604a9`, `eaca285`, `7a42ac3`, `824b545`, `a0045be`, `7e15433`, `a71a91b`, `eab6fa4`, `d52de16`,
`fe4ec03`, `89c8a17`, `486e324`, `71f1d61`, `9f96dc0`, `0a8c5b3`, `98f5c8d`, `f085152`, `1e492ad`, `c25ee78`,
`cee10cc`.
**Discussão de produto (lida no repo):** `agentic/state/RESULT_152_PARTE1_ARMAS.md`, `RESULT_143_OCR_P3_009.md`,
`result_sem_planner_20260912.md`.

---

## 3. Declaração das QUATRO PONTAS

| Ponta | Estado | O que foi feito / não feito |
|---|---|---|
| **CÓDIGO** | 🟢 **INTOCADO** | `git diff --name-only -- '*.js' '*.html' '*.json'` → **vazio**. Nenhum arquivo do produto foi lido-modificado. Não houve `clasp push`. Leitura apenas. |
| **DOCUMENTAÇÃO** | 🟢 **MATERIALIZADA** | 11 evidências §46.5 · 8 cápsulas §46.2 (+8 NOTA) · 4 dependências §31.6 (+INDICE) · 8 `INDICE.md` de `05_Evidencias` reescritos · `RELATORIO_DE_DIFERENCIAS_153.md` · 2 linhas em `03_Fundacao/ESTRUTURA_DO_COFRE.md`. Total: **1.968 linhas** escritas. |
| **CANVAS/PLANTA** | 🟡 **NÃO TOCADO POR ESTE CARD** | Os **24** canvas existentes (incl. os 8 `CIR-MOD-*.canvas` dos módulos documentados) **não foram alterados aqui** — nenhum `.canvas` está na lista de arquivos que eu escrevi. No worktree aparecem `PLANTA_MESTRA.canvas` e vários `CIR-*.canvas` **modificados por trabalho paralelo (#154/#155)**, não pelo #153. As cápsulas apenas **endereçam** o canvas que já existe (`Endereço Down Plant`), não o reescrevem. |
| **GIT** | 🟡 **ESCRITO, NÃO COMMITADO** | HEAD `98f5c8d` **inalterado**; branch `sprint/g01-guardiao-qualidade-live-001`. Todos os arquivos entregues estão **untracked/modificados no worktree**. **Nenhum** `commit`, **nenhum** `push`, **nada** postado no GitHub. |

---

## 4. Comandos de verificação

```bash
cd "C:\Users\Bneto04\Documents\Codex\syntheon-gs-downplant-offline"

# 1) Estrutura conforma
node scripts/downplant/lint-estrutura.mjs
#    -> exit 0 | "SUCESSO! A arvore documental esta em estrita conformidade com o Down Plant 2.1."

# 2) Contagens da entrega
find 02_Comodos -path "*05_Evidencias/EV-*.md" | wc -l      # 11
find 02_Comodos -name "MOD-*.md" | wc -l                    # 9
ls dependencias/ | wc -l                                    # 5

# 3) Zero stub de modulo restante
find 02_Comodos -name "NOTA_DE_RESPONSABILIDADE.md" -not -path "*submodulos*" \
  | while read f; do wc -l < "$f"; done | grep -c "^3$"     # 0

# 4) Zero mudanca funcional
git diff --name-only -- '*.js' '*.html' '*.json'            # (vazio)

# 5) Nada commitado / nada empurrado
git log --oneline -1                                        # 98f5c8d ... (inalterado)
git status --short | grep -c "RELATORIO_DE_DIFERENCIAS_153" # 1 (untracked)
```

---

## 5. Divergências e ausências DECLARADAS (não preenchidas)

1. **`b7a0a5d` não existe.** `agentic/state/RESULT_152_PARTE1_ARMAS.md` cita esse hash como "commit do elo final";
   `git log --all` (10 refs + HEAD) **não o encontra**. O elo versionado é **`824b545`**. A referência quebrada
   **não** foi corrigida no arquivo de origem (fora do escopo autorizado) — está registrada em `EVD-C06-001` e na
   cápsula `MOD-C06-01`.
2. **Contagem de publicação divergente:** `81/81 byte-iguais ao HEAD` (cards #140/#141/#144) × `68 arquivos canônicos`
   (`ponte2_chatgpt_gravity/server/send_audit_fix_result.js`). Não reconciliados.
3. **Fuso horário divergente:** `appsscript.json` = `America/Sao_Paulo` × `Core/Config.js` = `America/Recife`.
   Visível no repo, efeito **não avaliado**.
4. **`Motor/` não foi alterado** por nenhum dos cards citados — o registro do C04 é de **auditoria (leitura)**.
5. **Protocolo de homologação offline (C06) × push real:** o protocolo proibia *qualquer* push e os cards #140/#141/#144
   registraram `clasp push`. Os dois registros convivem e a distinção **não está explicada em um único lugar**.
6. **`Testes/TestNormalizadorEfetivo.js` nunca foi versionado** (untracked) — logo **não** está na suíte.
7. **Submódulos seguem stub (4):** `SUB-C00-01-01_MIGRACAO_DP21`, `SUB-C00-01-02_PLANTA_MESTRA`, `SUB-C00-02-01_LINT`,
   `SUB-C01-01-02_PERSISTENCIA_MANUAL`. O card falou em **módulos** — estes 4 ficam como **candidatos declarados**
   (o `SUB-C01-01-02` foi de fato tocado pelo #140/#144 em `Entrada/EntradaManual.js`).
8. **`MOD-C03-01_MODELO_DE_OCORRENCIA` NÃO recebeu cápsula** — tem **9 linhas**, não é "stub de 3 linhas" (critério do
   card). Fica declarado, não reescrito.
9. **`dependencias/` NÃO entra na varredura do lint** — o diretório foi criado e registrado no manifesto, mas
   `docsDirs` de `lint-estrutura.mjs` **não** foi alterado (card de documentação, sem mudança funcional). Consequência:
   os registros §31.6 **não têm gate estrutural**.
10. **Números de suíte divergentes por card:** 411 PASS (#141) × 423 PASS (#140/#144) × 620 PASS (`b74f9d0`) — a suíte
    cresceu entre as medições; não há medição única canônica no repo.
11. **Correção declarada de processo:** houve **1 rodada de lint com falha** (`8 erros` de link relativo nas novas
    cápsulas, `../05_Evidencias/` em vez de `../../../05_Evidencias/`), corrigida; a rodada final é `exit 0`.

---

## 6. DONE (releitura do card #153)

- [x] **A documentação reflete o código/GIT canônico** — cada evidência cita card e commit reais; divergências declaradas.
- [x] **Cápsulas/evidências/dependências necessárias materializadas** — 8 §46.2 · 11 §46.5 · 4 §31.6.
- [x] **Relatório de diferenças antes/depois** — `RELATORIO_DE_DIFERENCIAS_153.md` (números medidos).
- [x] **Zero mudança funcional** — `git diff` vazio para código; lint `exit 0` antes e depois.
- [ ] **Commit / push** — **fora do escopo autorizado** deste trabalho (proibidos no comando): entrega no worktree.
