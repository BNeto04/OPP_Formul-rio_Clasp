# BLOCO_PROVA_GIT_164_B1.md

**Card:** #164 [DP24-003] · **Bloqueador:** B1 (prova Git antes de declarar `GIT 🟢`)
**Data/hora da coleta:** 2026-09-14 08:05:14 -0300
**Repo:** `C:\Users\Bneto04\Documents\Codex\syntheon-gs-downplant-offline`
**Branch:** `sprint/g01-guardiao-qualidade-live-001`  ·  **upstream:** `origin/sprint/g01-guardiao-qualidade-live-001`

---

## REGRA (B1) — o que muda no RESULT

> **Nenhum RESULT pode declarar `GIT 🟢` sem estas cinco provas coladas nele.** Lint/suíte verdes **não** bastam.
> `GIT 🟢` só é legítimo se aparecerem, no próprio RESULT:
> **(1)** saída de `git status --short`; **(2)** saída de `git diff --stat`;
> **(3)** **exit code conferido** de `git add` e de `git commit`; **(4)** existência **e conteúdo** do commit
> (`git log -1 --stat` e `git show --stat HEAD`); **(5)** alinhamento **local × remoto**.
> Sem as cinco, o estado correto é **`GIT 🟡 NÃO PROVADO`** (ou 🔴), nunca 🟢.
> Origem da regra: um RESULT anterior declarou “GIT 🟢 commit abaixo, empurrado” **antes de o commit existir**.

## 1. Commits — comandos EXATOS para o Executor (com conferência de exit code)

> Este bloco **não foi executado** por quem escreve (restrição: não commitar). Copie, rode e cole a saída.
> `git add` **por caminho explícito** — nunca `git add .` aparecem nesta fatia.

```bash
cd "C:/Users/Bneto04/Documents/Codex/syntheon-gs-downplant-offline"

# (1) estado ANTES de qualquer add
git status --short; echo "STATUS_EXIT=$?"
git diff --stat;  echo "DIFF_EXIT=$?"

# (2) add SO dos caminhos desta fatia (exemplo: os 2 relatorios do B2)
git add RELATORIO_164_B2.md BLOCO_PROVA_GIT_164_B1.md
echo "ADD_EXIT=$?"      # <<< EXIGIDO NO RESULT: tem de ser 0

# (3) commit com vinculo ao card; mensagem longa vai por ARQUIVO (aspas/parenteses quebram o -m no shell)
git commit -F C:/Users/Bneto04/msg_commit_b2.txt -- RELATORIO_164_B2.md BLOCO_PROVA_GIT_164_B1.md
echo "COMMIT_EXIT=$?"   # <<< EXIGIDO NO RESULT: tem de ser 0

# (4) PROVA de que o commit EXISTE e o que ele contem
git log -1 --stat
git show --stat HEAD
git rev-parse HEAD        # sha do commit desta fatia

# (5) alinhamento LOCAL x REMOTO (apos o push, se houver push)
git fetch origin
git rev-parse HEAD
git rev-parse origin/sprint/g01-guardiao-qualidade-live-001
git rev-list --left-right --count origin/sprint/g01-guardiao-qualidade-live-001...HEAD   # esperado: 0<TAB>0 apos o push
git status --short --branch | head -1                # esperado: sem [ahead N]
```

Sugestão de mensagem (arquivo `C:/Users/Bneto04/msg_commit_b2.txt`):

```text
DP24-003/B2: fail-safe da coluna AM provado contra o universo real
(#164)

- abas mensais reais: 9 (JAN2026..SET2026); cabecalho canonico 'Alerta Integridade'
  presente exatamente 1x nas 9 -> OK=9 / AUSENTE=0 / AMBIGUA=0
  (medido read-only; SeletorMesesGuardiao + resolverColunaAlerta reais)
- impactos: 0 abas auditadas deixam de ser auditadas; 0 dependiam da auto-criacao removida
- 12 abas de backup alcancaveis pelo MENU agora abortam com ERRO_TECNICO e ZERO escrita;
  em 2 delas a auto-criacao antiga destruia o cabecalho de dado 'QTD TOTAL DROGAS' (col 39)
- reproducao offline com os cabecalhos REAIS pela cadeia real: 153 PASS / 0 FAIL (exit 0)
- fechadura TestGuardiaoHeadlessEfeitoDeclarado: 7 PASS / 0 FAIL (exit 0)
```

## 2. Estado medido AGORA (baseline desta fatia — saída real, não template)

### 2.1 `git status --short`

```text
 M 02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-01_FORMULARIO_E_MENUS/submodulos/SUB-C01-01-01_OCR_E_CONFERENCIA/NOTA_DE_RESPONSABILIDADE.md
 M RELATORIO_DE_DIFERENCIAS_156_157.md
 M VigiaPonte/conversation_memory.json
?? BLOCO_PROVA_GIT_164_B1.md
?? RELATORIO_164_B2.md
?? Testes/TestNormalizadorEfetivo.js
?? Testes/temp_test_telegram/
STATUS_EXIT=0
```

**Leitura:** **5 das 7 entradas são drift PRE-EXISTENTE** de sessões anteriores — **nenhuma** foi criada por
este trabalho. Decisão do Planner (não commitar automaticamente): `VigiaPonte/conversation_memory.json` é log de
runtime das pontes → **não commitar**; os outros 4 são trabalho de sessões anteriores, a juízo do Planner.
As **2 entradas desta fatia** são `?? RELATORIO_164_B2.md` e `?? BLOCO_PROVA_GIT_164_B1.md` — são exatamente
os caminhos do `git add` explícito do bloco 1. Nada de `git add .`: as outras 5 ficariam de fora por construção.

### 2.2 `git diff --stat`

```text
warning: in the working copy of 'RELATORIO_DE_DIFERENCIAS_156_157.md', CRLF will be replaced by LF the next time Git touches it
 .../NOTA_DE_RESPONSABILIDADE.md                    |  2 +-
 RELATORIO_DE_DIFERENCIAS_156_157.md                |  4 +-
 VigiaPonte/conversation_memory.json                | 44 +++++++++++-----------
 3 files changed, 25 insertions(+), 25 deletions(-)
DIFF_EXIT=0
```

### 2.3 Existência e conteúdo do commit do HEAD atual

```text
$ git log -1 --stat
commit 989fa1455c71802e41145391584e624242bd2e0e
Author: liveenergy7-code <liveenergy7@gmail.com>
Date:   Mon Sep 14 07:51:32 2026 -0300

    DP24-003: diagnostico de concorrencia/LockService - 9 itens mapeados, corrida reproduzida offline, precedente LockManager interno e achado de instrumento (pendente-com-justificativa conta PASS) (#164)

 DIAGNOSTICO_164_CONCORRENCIA.md | 572 ++++++++++++++++++++++++++++++++++++++++
 1 file changed, 572 insertions(+)
```

### 2.4 LOCAL × REMOTO

```text
$ git remote -v
origin  https://github.com/BNeto04/OPP_Formul-rio_Clasp.git (fetch)
origin  https://github.com/BNeto04/OPP_Formul-rio_Clasp.git (push)

$ git rev-parse HEAD
989fa1455c71802e41145391584e624242bd2e0e
$ git rev-parse origin/sprint/g01-guardiao-qualidade-live-001
989fa1455c71802e41145391584e624242bd2e0e
$ git rev-list --left-right --count origin/sprint/g01-guardiao-qualidade-live-001...HEAD
0       0          # 0 atras / 0 a frente -> local == remoto (FETCH_EXIT=0)

$ git status --short --branch | head -1
## sprint/g01-guardiao-qualidade-live-001...origin/sprint/g01-guardiao-qualidade-live-001    # sem [ahead]/[behind]
```

**Veredito do estado atual:** `GIT 🟢` **do baseline** (HEAD == remoto, árvore sem alteração desta fatia).
Depois do commit desta fatia, o `GIT 🟢` só se sustenta repetindo as cinco provas **após** o commit.

## 3. Modelo de fechamento do RESULT (copiar e preencher)

```text
GIT_STATE: 🟢
  git_status_short   = <colar §2.1 apos o commit>
  git_diff_stat      = <colar §2.2 apos o commit>
  git_add_exit       = 0        # conferido, nao presumido
  git_commit_exit    = 0        # conferido, nao presumido
  git_log_1_stat     = <colar a saida: sha + autor + data + arquivos + linhas>
  git_show_stat_HEAD = <colar a saida>
  local_x_remoto     = <sha local> == <sha origin/BRANCH> ; left-right = 0<TAB>0
APPS_SCRIPT_STATE: <🟢 se houve clasp push + efeito remoto lido | ⚪ NAO APLICAVEL se nao houve delta>
```

Se qualquer uma das cinco provas faltar, escrever **`GIT 🟡 NÃO PROVADO`** e a linha `pendente: <qual prova>`.

## 4. Nota de escopo (B1 × B2)

B1 é **formato de RESULT** (prova Git). B2 é **prova material** (fail-safe × universo real). Este arquivo cobre
B1; a prova de B2 está em `RELATORIO_164_B2.md`. Nenhum dos dois foi commitado por este trabalho.
