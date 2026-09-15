# RESULT — #172 (DIAG-VIGIA-001) · F1 + F2: a suíte deixa de não ser reprodutível

**Task:** #172 — *"Suíte termina exit 1 com 0 FAIL: Vigia nao avisa DEFER_LOCKED — causa A ou B, a provar"* (pai #57, independente da cadeia DP24)
**Perímetro ordenado pelo Planner (15/09/2026):** absorver **F1** e **F2** *"no mesmo diagnóstico"*, com a correção provada em **dois ambientes** (working copy normal **e** checkout limpo/LF), *"0 referência fantasma"*, prova Git completa e *"nenhuma mudança funcional do produto"*.
**Branch:** `sprint/g01-guardiao-qualidade-live-001` · **commits:** `8f6fb53` (F1+F2) e `dc5897f` (fechadura F1) · **HEAD:** `dc5897f` · **local × remoto = `0 0`**

---

## 1. F1 — REFERÊNCIA FANTASMA no runner

**Causa (provada):** `Testes/RodarTodosOsTestes.js:83` chamava `require('./TestNormalizadorEfetivo')` **sem guarda**, e o arquivo **não existe no repositório**:
- nunca esteve rastreado (`git ls-files` = vazio);
- foi **removido do Git** por `9656bc8` — *"chore(teste): remove do Git o WIP local TestNormalizadorEfetivo.js capturado pelo commit 9632d31"* (10/09/2026);
- existia apenas **nesta máquina** (não rastreado, 92 linhas, mtime 10/09 15:17).

**Consequência real:** qualquer checkout limpo que alcançasse a linha 83 morria com `MODULE_NOT_FOUND` — o runner só tinha `main().catch(err => { console.error('❌ Erro fatal…'); process.exit(1); })`. O *"755 PASS / exit 0"* de 15/09 era **verdadeiro apenas nesta working copy**.

**Substituto que deveria ocupar o slot (medido, não presumido):** o Normalizador Efetivo **já é coberto, de forma rastreada**, por `TestArcaNormalizadorEfetivo` (l.30), `TestDryRunNormalizador` (l.36), `TestExecutorNormalizador` (l.38), `TestReauditoriaNormalizador` (l.40) e `TestOrdemAntiguidadeEquipe` (l.99) — todos no runner e no Git.

**Correção:** `require` fantasma **removido** do runner, com o histórico explicado em comentário no próprio arquivo. **Nenhuma cobertura rastreada foi perdida.**

**Fechadura nova — `Testes/TestReferenciaFantasma.js` (RED → GREEN):**
| Antes | Depois |
|---|---|
| **1 PASS / 2 FAIL · exit 1** — *"modulo exigido pelo runner e NAO rastreado: TestNormalizadorEfetivo"* | **3 PASS / 0 FAIL · exit 0** |

Ela exige: (1) todo `require('./X')` do runner resolve para arquivo **existente** em `Testes/`; (2) esse arquivo está **rastreado no Git** (garantia de que um checkout limpo o tem); (3) o arquivo removido que originou o F1 **não é exigido**. Comentários em prosa são removidos antes do parse — *menção não é dependência*. Sem `.git`, a checagem 2 é declarada `NAO_APLICAVEL_SEM_GIT` e **nunca** contada como PASS.

## 2. F2 — o `sha256` do §159 era IDENTIDADE DE BYTES, não de conteúdo

**Causa exata (linha medida):** `scripts/downplant/contar-regras-arca.mjs:59-61`

```js
const buffer = fs.readFileSync(ARQ_JSON);
const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');   // <-- bytes crus
```

O hash era calculado sobre os **bytes do checkout**. A mesma medição produzia:
- working copy **CRLF** → `f9c853d67…` (valor gravado nos derivados);
- checkout **LF** → `f805e1c815…` (valor medido no export).

Resultado: **7 FAIL** no bloco §159 (ARCA-COUNT-001) *por EOL, não por divergência de conteúdo* — inclusive no nó de métricas do canvas e no snapshot. A comparação de texto do mesmo lock já usava `semCR`; **só o hash não era normalizado**.

**Correção semântica (não é normalizar o ambiente):** o hash passa a identificar **conteúdo** — `replace(/\r\n/g, '\n')` antes do digest. O conteúdo não muda; a *identidade* deixa de depender da representação de fim de linha do checkout.

**Regeneração dos derivados** (`node scripts/downplant/contar-regras-arca.mjs --aplicar`) — **só o hash mudou**, medido: 12 inserções / 12 remoções em 6 arquivos (`INVENTARIO_ARCA.md`, `ARCA_REGRAS_DOMINIO.md`, `ARCA_COBERTURA.md`, `arca_flow.html`, o canvas `CIR-MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO.canvas` e `scripts/downplant/arca_metricas_derivadas.json`).

| Fechadura §159 | Antes (checkout LF) | Depois |
|---|---|---|
| `node -e "require('./Testes/TestArcaContagemDerivada')()"` | **8 PASS / 7 FAIL** | **15 PASS / 0 FAIL** |

## 3. GATE DO #172 — os seis itens, medidos

| Item exigido | Resultado medido |
|---|---|
| **working copy → suíte verde** | `node Testes/RodarTodosOsTestes.js` → **exit 0 · 760 PASS · 0 FAIL real** |
| **checkout limpo/LF → suíte verde** | clone limpo (`git clone -c core.autocrlf=false`, HEAD `dc5897f`, LF conferido: CR=0 nos arquivos de amostra) → **exit 0 · 760 PASS · 0 FAIL · 0 erro fatal** |
| **mesmo conjunto de testes nos dois ambientes** | conjuntos normalizados: **760 × 760**, `diff` = **0 linhas** → **idênticos** |
| **0 referência fantasma** | fechadura F1 **3/3 nos dois ambientes**; runner exige **61 módulos**, todos existentes **e rastreados** |
| **prova Git completa** | `HEAD local == HEAD remoto == dc5897f`; `rev-list --left-right --count` = `0 0`; commits `8f6fb53` (9 arquivos, +133/−15) e `dc5897f` |
| **nenhuma mudança funcional do produto** | **zero** arquivo de runtime `.js` alterado — os únicos `.js` da fatia são `Testes/RodarTodosOsTestes.js` e `Testes/TestReferenciaFantasma.js`; nada em `Core/`, `Entrada/`, `Features/`, `Motor/`, `Render/`, `Drivers/`, `Leitura/`, `Plugins/`, `Modelos/`, `Config/`, `Schemas/`, `Temas/` |

**CLASP/publicação:** **NÃO EXECUTADO** — nenhuma alteração funcional. O único arquivo alterado **não** coberto pelo `.claspignore` é `Dominio/ARCA/arca_flow.html` (visão gerada; **não referenciada pelo runtime** — busca por `arca_flow` em todo o runtime = 0), e seu diff é **somente o hash**.

## 4. Achados declarados (não corrigidos — decisão do Planner)

1. **Lacuna de cobertura real:** a regra de **desambiguação de nomes duplicados** do `Features/NormalizadorEfetivo.js` (1º mantém o nome; 2º recebe `.`; 3º recebe `:`) é exercitada **somente** pelo WIP **não rastreado** `Testes/TestNormalizadorEfetivo.js` (4 casos). Não há teste rastreado para essa regra. O WIP **continua no disco** (nada foi apagado), apenas **não é exigido** pelo runner. Reocupar o slot de forma legítima = trazer essa cobertura para o Git sob card próprio.
2. **Não varri outros comparadores de hash por bytes** do repositório. O que o gate acusava era o do §159, e esse está corrigido e provado nos dois ambientes. Se existir outro hash sensível a EOL, ele ainda não foi medido.
3. **O `.git` deste repositório exige `safe.directory`** para ser lido por um clone (`detected dubious ownership`). Contornado com `git -c safe.directory='*' clone …` — registrado para quem for montar pipeline.

## 5. Estado

**STATUS: RESULT ENTREGUE — aguardando auditoria (REVIEW).** O card permanece **aberto**.
**Rollback:** `git revert dc5897f 8f6fb53` (ou restaurar `Testes/RodarTodosOsTestes.js`, `scripts/downplant/contar-regras-arca.mjs` e os 6 derivados do ARCA).
**Não iniciado:** qualquer correção da causa do `DEFER_LOCKED` (objeto original do card) — esta fatia fechou a **reprodutibilidade** do gate, que era a prioridade ordenada.
