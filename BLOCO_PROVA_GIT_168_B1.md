# BLOCO_PROVA_GIT_168_B1.md

**Card:** #168 [DP24-005] · **Bloqueador:** B1 (prova Git antes de declarar `GIT 🟢`)
**Data/hora da coleta:** 2026-09-14 12:26:08 -0300
**Repo:** `C:\Users\Bneto04\Documents\Codex\syntheon-gs-downplant-offline`
**HEAD na coleta:** `f8f11b0b2da843a51c932ce67567bcf5a96eb435` (não alterado por esta fatia)
**Branch:** `sprint/g01-guardiao-qualidade-live-001` · **upstream:** `origin/sprint/g01-guardiao-qualidade-live-001`

---

## REGRA (B1) — o que muda no RESULT

> **Nenhum RESULT pode declarar `GIT 🟢` sem estas cinco provas coladas nele.** Lint/suíte verdes **não** bastam.
> `GIT 🟢` só é legítimo se aparecerem, no próprio RESULT:
> **(1)** saída de `git status --short`; **(2)** saída de `git diff --stat`;
> **(3)** **exit code conferido** de `git add` e de `git commit`; **(4)** existência **e conteúdo** do commit
> (`git log -1 --stat` e `git show --stat HEAD`); **(5)** alinhamento **local × remoto**.
> Sem as cinco, o estado correto é **`GIT 🟡 NÃO PROVADO`** (ou 🔴), nunca 🟢.

**Estado desta fatia: `GIT 🟡 NÃO PROVADO`.** Nada foi `git add`/`git commit`/`push` (restrição do card:
não commitar, não empurrar, não postar). As provas (1) e (2) estão medidas abaixo; (3), (4) e (5) só
existem **depois** que o Executor principal rodar os comandos do §1 e colar as saídas.

## 1. Commits — comandos EXATOS para o Executor (com conferência de exit code)

> Este bloco **não foi executado** por quem escreve (restrição: não commitar). Copie, rode e cole a saída.
> `git add` **por caminho explícito** — nada de `git add .` nesta fatia.
> ⚠️ Os relatórios (`RELATORIO_168.md`, `RESULT_PROPOSTO_168.md`, `BLOCO_PROVA_GIT_168_B1.md`) são
> **novos** e precisam de `git add` explícito; os 6 caminhos modificados incluem **arquivos que NÃO são
> desta fatia** (`NOTA_DE_RESPONSABILIDADE.md`, `RELATORIO_DE_DIFERENCIAS_156_157.md`,
> `VigiaPonte/conversation_memory.json`) — **não** os adicione por engano.

```bash
cd "C:/Users/Bneto04/Documents/Codex/syntheon-gs-downplant-offline"

# (1) estado ANTES de qualquer add
git status --short; echo "STATUS_EXIT=$?"
git diff --stat;  echo "DIFF_EXIT=$?"

# (2) add SO dos caminhos DESTA fatia (8 caminhos: 5 novos + 3 modificados)
git add scripts/downplant/gerar-handoff-md.mjs \
        scripts/downplant/curador-estrutural.mjs \
        Testes/TestCuradorEstrutural.js \
        08_Execucao_Ao_Vivo/LEIAME_CURADOR.md \
        08_Execucao_Ao_Vivo/RELATORIO_CURADOR_2026-09-14.md \
        08_Execucao_Ao_Vivo/downplant_handoff.yaml \
        08_Execucao_Ao_Vivo/downplant_handoff.md \
        Testes/RodarTodosOsTestes.js
echo "ADD_EXIT=$?"      # <<< EXIGIDO NO RESULT: tem de ser 0

# (3) commit com vinculo ao card; mensagem longa por ARQUIVO (aspas/parênteses quebram o -m no shell)
git commit -F C:/Users/Bneto04/msg_commit_168.txt \
         scripts/downplant/gerar-handoff-md.mjs \
         scripts/downplant/curador-estrutural.mjs \
         Testes/TestCuradorEstrutural.js \
         08_Execucao_Ao_Vivo/LEIAME_CURADOR.md \
         08_Execucao_Ao_Vivo/RELATORIO_CURADOR_2026-09-14.md \
         08_Execucao_Ao_Vivo/downplant_handoff.yaml \
         08_Execucao_Ao_Vivo/downplant_handoff.md \
         Testes/RodarTodosOsTestes.js
echo "COMMIT_EXIT=$?"   # <<< EXIGIDO NO RESULT: tem de ser 0

# (3b) os 3 relatorios da fatia (novos; caminhos explicitos)
git add RELATORIO_168.md RESULT_PROPOSTO_168.md BLOCO_PROVA_GIT_168_B1.md
echo "ADD_RELATORIOS_EXIT=$?"

# (4) PROVA de que o commit EXISTE e o que ele contem
git log -1 --stat
git show --stat HEAD
git rev-parse HEAD

# (5) alinhamento LOCAL x REMOTO (depois do push, se houver push)
git fetch origin
git rev-parse HEAD
git rev-parse origin/sprint/g01-guardiao-qualidade-live-001
git rev-list --left-right --count origin/sprint/g01-guardiao-qualidade-live-001...HEAD   # esperado: 0<TAB>0 apos o push
git status --short --branch | head -1                                                    # esperado: sem [ahead N]
```

Sugestão de mensagem (arquivo `C:/Users/Bneto04/msg_commit_168.txt`):

```text
DP24-005 #168: §46.11 - espelho do handoff DERIVADO do YAML; §46.13 implantado; §46.14 homologado

- scripts/downplant/gerar-handoff-md.mjs (NOVO): gerador canonico do espelho (§46.11);
  --check | --mapa | --out | --aplicar; reusa parseYaml do validador unico (sem 2o parser)
- scripts/downplant/curador-estrutural.mjs (NOVO): relatorio §46.13 (OBSERVA->COMPARA->DETECTA->
  ATUALIZA O MECANICO ou REPORTA); reusa parseYaml + gerarMarkdown (sem processo paralelo);
  recusa --decidir/--fix/--auto/--patch/--upgrade/--resolver com exit 1
- downplant_handoff.yaml (+11): bloco `notas` - a prosa que vivia SO no .md passou a ser fonte
- downplant_handoff.md: REGERADO do YAML (129+/83-), LF; espelho 158 linhas, 72 linhas de valor
  derivadas verbatim, 0 reescritas, 0 orfas, 9/9 rubricas do §46.11
- Testes/TestCuradorEstrutural.js (NOVO): fechadura 26 PASS / 0 FAIL (exit 0); RED por edicao
  manual do .md (23/3, exit 1) e por YAML alterado sem regerar (22/4, exit 1); reversao conferida
  por sha256sum -c; rubricas §46.11/§46.13/§46.14 EXTRAIDAS do metodo canonico
- §46.14: ZERO delta (implantado no #167) - apenas homologado no teste novo
- lint exit 0; validador do handoff 40 PASS / 0 FAIL exit 0; suite integral 753 PASS / 1 FAIL exit 1
  (o 1 FAIL e PRE-EXISTENTE em f8f11b0: RELATORIO_VIGIA_2026-09-14.md desatualizado vs DEP-003;
  provado em git archive HEAD, fora do delta - declarado, nao corrigido)
```

## 2. Estado medido AGORA (baseline desta fatia — saída real, não template)

### 2.1 `git status --short`

```text
 M 02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-01_FORMULARIO_E_MENUS/submodulos/SUB-C01-01-01_OCR_E_CONFERENCIA/NOTA_DE_RESPONSABILIDADE.md
 M 08_Execucao_Ao_Vivo/downplant_handoff.md
 M 08_Execucao_Ao_Vivo/downplant_handoff.yaml
 M RELATORIO_DE_DIFERENCIAS_156_157.md
 M Testes/RodarTodosOsTestes.js
 M VigiaPonte/conversation_memory.json
?? 08_Execucao_Ao_Vivo/LEIAME_CURADOR.md
?? 08_Execucao_Ao_Vivo/RELATORIO_CURADOR_2026-09-14.md
?? Testes/TestCuradorEstrutural.js
?? Testes/TestNormalizadorEfetivo.js
?? Testes/temp_test_telegram/
?? scripts/downplant/curador-estrutural.mjs
?? scripts/downplant/gerar-handoff-md.mjs
```

**Desta fatia (#168):** 3 modificados (`downplant_handoff.md`, `downplant_handoff.yaml`,
`Testes/RodarTodosOsTestes.js`) + 5 novos (`gerar-handoff-md.mjs`, `curador-estrutural.mjs`,
`Testes/TestCuradorEstrutural.js`, `LEIAME_CURADOR.md`, `RELATORIO_CURADOR_2026-09-14.md`)
— mais os 3 relatórios desta fatia, ainda não escritos na coleta acima.
**PRÉ-EXISTENTES (não são desta fatia):** `NOTA_DE_RESPONSABILIDADE.md`,
`RELATORIO_DE_DIFERENCIAS_156_157.md`, `VigiaPonte/conversation_memory.json`,
`Testes/TestNormalizadorEfetivo.js`, `Testes/temp_test_telegram/`.

### 2.2 `git diff --stat` (tracked)

```text
warning: in the working copy of 'RELATORIO_DE_DIFERENCIAS_156_157.md', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'Testes/RodarTodosOsTestes.js', CRLF will be replaced by LF the next time Git touches it
 .../NOTA_DE_RESPONSABILIDADE.md                    |   2 +-
 08_Execucao_Ao_Vivo/downplant_handoff.md           | 212 +++++++++++++--------
 08_Execucao_Ao_Vivo/downplant_handoff.yaml         |  11 ++
 RELATORIO_DE_DIFERENCIAS_156_157.md                |   4 +-
 Testes/RodarTodosOsTestes.js                       |   9 +
 VigiaPonte/conversation_memory.json                |  44 ++---
 6 files changed, 174 insertions(+), 108 deletions(-)
```

Só o delta desta fatia (`--numstat`, caminhos explícitos):

```text
129     83      08_Execucao_Ao_Vivo/downplant_handoff.md
11      0       08_Execucao_Ao_Vivo/downplant_handoff.yaml
9       0       Testes/RodarTodosOsTestes.js
```

### 2.3 Alinhamento local × remoto (no HEAD da coleta)

```text
$ git status --short --branch | head -1
## sprint/g01-guardiao-qualidade-live-001...origin/sprint/g01-guardiao-qualidade-live-001
$ git rev-parse HEAD
f8f11b0b2da843a51c932ce67567bcf5a96eb435
$ git rev-parse origin/sprint/g01-guardiao-qualidade-live-001
f8f11b0b2da843a51c932ce67567bcf5a96eb435
$ git rev-list --left-right --count origin/sprint/g01-guardiao-qualidade-live-001...HEAD
0	0
```

## 3. sha256 dos artefatos desta fatia (para conferência pós-commit)

```text
2cca516a8b8eb1f0e4ad86f4592528f604d0f79fef59ec944c6883b5d182f9b3 *08_Execucao_Ao_Vivo/downplant_handoff.yaml
93941f948fb08f624cb320ac220f989cde752b3aabbcb91e20a336808b7cdf88 *08_Execucao_Ao_Vivo/downplant_handoff.md
35a5541ea5a42ab29dc5031451a8fcd34083411f3cd064b7ac1ca0c2f9ac7c1e *scripts/downplant/gerar-handoff-md.mjs
22b192a3af7dc184ed1c162662053c364cfdb40c61d4509e7d707ca463e55ca0 *scripts/downplant/curador-estrutural.mjs
e794cedbbcc2fa37615149ed968e83bab9a025ec86128892d2341f491d197d3a *Testes/TestCuradorEstrutural.js
21f6789e5c20dd0d829c4a1a982537991645ad5467cdacb9194908022561601a *08_Execucao_Ao_Vivo/RELATORIO_CURADOR_2026-09-14.md
```

## 4. Portões reexecutados no HEAD da coleta (exit code real)

```text
exit lint (scripts/downplant/lint-estrutura.mjs)          = 0    ✅ SUCESSO! conformidade Down Plant 2.1
exit validador (validar-handoff.mjs .)                    = 0    40 PASS / 0 FAIL
exit gerador (gerar-handoff-md.mjs --check)               = 0    CHECK: IDENTICO (sha256=93941f948fb08f62...)
exit fechadura (Testes/TestCuradorEstrutural.js)          = 0    26 PASS / 0 FAIL
exit suite (Testes/RodarTodosOsTestes.js)                 = 1    753 PASS / 1 FAIL  <<< FAIL PRE-EXISTENTE
exit curador (curador-estrutural.mjs)                     = 0    (relata DIVERGENTE; nao e portao)
exit curador --decidir (recusa §7.7)                      = 1
```

**O `exit 1` da suíte NÃO está coberto pelo delta:** o único FAIL é o relatório do Vigia
(`dependencias/vigia/RELATORIO_VIGIA_2026-09-14.md`) desatualizado em relação a
`dependencias/DEP-003_CLASP_DEPLOY.md` — deriva **pré-existente em `f8f11b0`**, provada numa árvore
pura de HEAD (`git archive HEAD` → `node Testes/TestVigiaDependencias.js` → `27 PASS / 1 FAIL`, exit 1)
e por `git status --short dependencias/` vazio. Detalhe em `RELATORIO_168.md` §8.
