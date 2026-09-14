# RESULT PROPOSTO — #167 (DP24-004) — texto para postagem no card

> Arquivo na **raiz do repositório de propósito** (mesmo precedente de `RESULT_PROPOSTO_158.md` … `RESULT_PROPOSTO_164.md`).
> **Não postado.** O briefing proíbe postar no GitHub nesta fatia. Texto pronto para colagem pelo Planner.
> Relatório completo, com a medição campo a campo: `RELATORIO_167.md`.

```text
[HERMES] RESULT — #167 (DP24-004)

STATUS: ENTREGUE COM PENDÊNCIA DECLARADA — o §31.6 passou a ser VINCULADO (Módulo/Circuito/Porta) e
        VERIFICÁVEL, e o Vigia de Dependências (§7.8) existe como mecanismo que OBSERVA, COMPARA e REPORTA
        — sem decidir e sem aplicar nada. Medição antes: 0/4 registros com versão/fonte/data da decisão/
        Decisão associada, 0 Decisões §46.4, 0 vínculos a Módulo/Circuito/Porta, 0 papel de Vigia.
        Medição depois: 4/4 registros completos, 4 Decisões §46.4 (9/9 campos), 37 vínculos declarados com
        arquivo:linha, 1 relatório §46.14 (estado DEFASADO — achado REAL, ver abaixo), validador canônico
        com 82 OK / 4 PENDENTE_DECLARADA / 0 BLOQUEANTE (exit 0) e fechadura 28 PASS / 0 FAIL (exit 0).
        Nada foi reimplementado: as 25 Portas §46.3 e as 2 INST existentes foram CITADAS (25→25, 2→2),
        nenhum arquivo de produto foi tocado, lint exit 0 e suíte 728 PASS / 0 FAIL / exit 0 (700 antes).

EVIDÊNCIA TIPADA (arquivo:linha + saída real)
- FUNDAMENTO NO MÉTODO
  · 03_Fundacao/METODO_DOWN_PLANT_PROGRESSIVO_v2.4.md:507 — §31.6 verbatim: "nome, versão, fonte, data da
    decisão, Decisão associada (§46.4)" + :508 "nunca aplica a atualização por conta própria"
  · :232-234 — §7.8: o Vigia é irmão do Curador, "apenas observa, compara e reporta" e "não decide"
  · :1016-1028 — §46.14: formato do relatório (7 seções + SINCRONIZADO | DEFASADO | NENHUMA AÇÃO)
  · :808-818 — §46.4: template da Decisão (9 campos) · :686 — §40.5: `dependencias/` na cápsula
  · :702 — §40.8: lint deve detectar "dependência vinculada sem registro de decisão"
  · :491-503 — §31.4: fluxo DEFINIR FUNÇÃO → BUSCAR → AVALIAR → DECIDIR → REGISTRAR
- VÍNCULOS COMPLETADOS (integrar, não recriar — os 4 registros do #153 foram preservados)
  · dependencias/DEP-001_GOOGLE_APPS_SCRIPT.md:10-14 (versao V8 · fonte · data_decisao · decisao · vigia),
    :29 e :38 (seção + tabela do vínculo estrutural, 12 Portas), :53 (seção do Vigia)
  · dependencias/DEP-002_GOOGLE_SHEETS.md:10-14, :29/:38 (10 Portas), :51
  · dependencias/DEP-003_CLASP_DEPLOY.md:10-14, :29/:38 (8 Portas), :49
  · dependencias/DEP-004_ABAS_E_BASES_CANONICAS.md:10-14, :29/:38 (7 Portas), :48
  · total medido: 12+10+8+7 = 37 vínculos, cada um com `arquivo:linha` do artefato §46.3 da PRÓPRIA Porta
  · ausências DECLARADAS (não inferidas): `AUSENTE_DECLARADO` (circuito sem canvas — MOD-C00-03) e
    `SEM_ARQUIVO_46.3` (Porta só na cápsula — C00-01/P03 e C08-01/P02) → 4 PENDENTE_DECLARADA
- DECISÕES ASSOCIADAS (§46.4) — 4 arquivos novos, 9/9 campos cada
  · dependencias/decisoes/DEC-DEP-001_RUNTIME_GOOGLE_APPS_SCRIPT.md:8-30 (Estado/Data/Localizacao/Contexto/
    Decisao/Alternativas/Consequencias/Riscos/Condicao de revisao) + DEC-DEP-002 · DEC-DEP-003 · DEC-DEP-004
  · natureza declarada: registro RETROATIVO do vínculo (o uso precede o registro; nenhuma decisão nova)
- VIGIA DE DEPENDÊNCIAS IMPLANTADO (§7.8 / §46.14)
  · scripts/downplant/vigia-dependencias.mjs — :8-10 cita o contrato; :35 lista as flags que RECUSA;
    :133 `comparar` (registrada × observada); :175 `estadoGlobal` (o PIOR observado); :183-239 relatório
  · dependencias/vigia/UPSTREAM_OBSERVADO.json — insumo de observação (real, 2026-09-14; não é escrito pelo Vigia)
  · dependencias/vigia/RELATORIO_VIGIA_2026-09-14.md — primeiro relatório real, gerado pelo mecanismo
  · dependencias/vigia/LEIAME_VIGIA.md — como opera + o que se recusa a fazer
  · scripts/downplant/validar-dependencias.mjs — validador canônico da família (operacionaliza o §40.8)
  · Testes/TestVigiaDependencias.js + Testes/RodarTodosOsTestes.js (+1 bloco) — a fechadura e seu registro
- PRIMEIRO RELATÓRIO (§46.14) — estado DEFASADO, achado REAL e não corrigido por contrato
  · DEP-001 (Apps Script): registrado V8 × observado V8 (release notes: última entrada 2026-08-03; a
    deprecação anunciada é a do runtime Rhino, NÃO a do V8) → SINCRONIZADO
  · DEP-002 (planilha viva): sem observação registrada nesta rodada (não houve leitura remota autorizada)
    → NENHUMA AÇÃO (o Vigia NÃO converte ausência de dado em verde)
  · DEP-003 (clasp): registrado AUSENTE_DECLARADO × observado 3.4.1 (npm dist-tags.latest; as releases do
    GitHub param em v3.3.0, 2026-03-12 — as duas fontes divergem entre si) → DEFASADO
  · DEP-004 (bases): registrado 1.0.0 (AIS) × observado 1.0.0 (cópia versionada; a base viva não foi
    observada) → SINCRONIZADO, com limite declarado
  · Recomendação do item defasado: registrar a versão instalada do clasp no vínculo (§31.6 exige versão).
    Decisão humana necessária: SIM. O Vigia NÃO registra, NÃO instala e NÃO atualiza.

O VIGIA — O QUE ELE OBSERVA E O QUE ELE SE RECUSA A FAZER
- OBSERVA: o vínculo de cada DEP (nome, `versao`, `fonte`, `decisao`) e a fonte externa declarada; lê a
  observação registrada em `vigia/UPSTREAM_OBSERVADO.json`.
- COMPARA: versão registrada × versão observada, item a item.
- REPORTA: as 7 seções verbatim do §46.14 + `Estado do Vigia` no vocabulário do método.
- RECUSA (com exit != 0): `--aplicar` · `--atualizar` · `--fix` · `--auto` · `--write-registry` · `--escrever`
  · `--patch` · `--upgrade`. NÃO edita registro, NÃO troca dependência, NÃO pina versão.
- NÃO muta por omissão: sem `--out` escreve SOMENTE stdout; com `--out` escreve SOMENTE aquele arquivo.
- NÃO auto-corrige: com upstream divergente (V99 × V8) o relatório diz DEFASADO e a linha `versao: "V8"`
  permanece byte-idêntica (sha256 antes/depois igual).
- NÃO é portão: exit 0 sempre que consegue relatar; a defasagem é INFORMADA, nunca bloqueia build.

TESTE RED → GREEN (fechadura nasce vermelha onde faltar — e o verde não é por herança)
- backup íntegro do delta antes da reversão: 16 arquivos, `sha256sum -c` 16/16 OK
- RED (artefatos guardados revertidos com `git checkout` + `rm -rf dependencias/decisoes dependencias/vigia`,
  mantendo validador e fechadura no lugar):
    node scripts/downplant/validar-dependencias.mjs → "0 OK / 0 PENDENTE_DECLARADA / 28 BLOQUEANTE", exit 1
    node Testes/TestVigiaDependencias.js           → "RESULTADOS FINAIS: 9 PASS / 19 FAIL", exit 1
      [FAIL] campo "versao" ausente/vazio · [FAIL] dependencias/decisoes ENOENT · [FAIL] tabela de vinculo
      sem linhas · [FAIL] secao do Vigia ausente · [FAIL] RED-3..RED-10
- GREEN (delta restaurado): `sha256sum -c` 16/16 OK (exit 0) · validador 82 OK/4 PENDENTE_DECLARADA/
  0 BLOQUEANTE (exit 0) · fechadura 28 PASS / 0 FAIL (exit 0) · lint exit 0
- 11 cenários de RED adicionais por mutação controlada de uma CÓPIA do registro (Testes/TestVigiaDependencias.js:265-310)

LINT / SUÍTE / FECHADURAS (PASS/FAIL E exit)
- node scripts/downplant/lint-estrutura.mjs → "SUCESSO! A arvore documental esta em estrita conformidade"
  exit 0
- node Testes/RodarTodosOsTestes.js → 728 PASS / 0 FAIL · "TODAS AS SUÍTES FORAM EXECUTADAS COM SUCESSO"
  exit 0   (antes desta fatia: 700 PASS / 0 FAIL / exit 0 — delta = exatamente os +28 da fechadura nova;
  única outra variação é a contagem de .js do próprio runner: 308→309, 224→225 fora do push)
- suíte repetida 5x para caracterizar estabilidade: 700/0/exit0 (antes) · 728/0/exit0 · 728/0/exit0 ·
  722/0/exit1 (D-167-08, flake pré-existente da família VigiaPonte) · 728/0/exit0
- node Testes/TestVigiaDependencias.js → 28 PASS / 0 FAIL, exit 0
- node scripts/downplant/validar-dependencias.mjs → 82 OK / 4 PENDENTE_DECLARADA / 0 BLOQUEANTE, exit 0
- node scripts/downplant/vigia-dependencias.mjs --aplicar → recusa, exit 1
- NÃO-MUTAÇÃO no nível da suíte: depois das 5 execuções, sha256sum -c do delta continua 16/16 OK

PROVA DE NÃO-REIMPLEMENTAÇÃO (antes → depois)
- Portas §46.3 do produto: 25 → 25 (nenhuma criada, nenhuma editada)
- Instalações transversais: 2 → 2 (INST-SERIALIZACAO-001 segue cobrindo a concorrência da Porta de log)
- Cápsulas/13 citações de `dependencias/DEP-*`: NÃO editadas (o vínculo Módulo↔DEP já existia)
- `scripts/downplant/*.mjs`: 5 → 7 (+2: o validador da família e o Vigia — padrão de `validar-portas.mjs`)
- Lint estrutural: NÃO estendido (o manifesto declara `dependencias/` fora da varredura,
  03_Fundacao/ESTRUTURA_DO_COFRE.md:37) → o §40.8 é operacionalizado pelo validador da família
- Produto (Core/ Features/ Entrada/ Render/ Dominio/ Motor/ Leitura/ Drivers/): 0 arquivos tocados

AS QUATRO PONTAS (#57)
- CÓDIGO: NÃO APLICÁVEL ao produto (0 arquivos de produto; `clasp push` NÃO executado). Os 3 arquivos
  executáveis são bancada de governança/teste, fora do Apps Script (`scripts/**` e `Testes/**` no .claspignore).
- DOCUMENTAÇÃO: ELEVADA — 4 registros §31.6, 37 vínculos, 4 Decisões §46.4, INDICE reconciliado,
  LEIAME do Vigia, relatório §46.14 e RELATORIO_167.md.
- CANVAS/PLANTA: INALTERADO por decisão — nenhum .canvas editado; o delta apenas CITA o circuito do Módulo
  dono (e declara `AUSENTE_DECLARADO` onde ele não existe, em vez de inventar nó).
- GIT: 🟡 NÃO PROVADO (por protocolo B1) — nada commitado/empurrado/postado nesta fatia; HEAD segue
  99877b4cc6d7c383e5328f1321e9b8202ddae2fa. Bloco A abaixo traz o que foi colhido; os exit codes de
  `git add` e `git commit` serão preenchidos pelo Executor principal.

DIVERGÊNCIAS E PENDÊNCIAS DECLARADAS (nada escondido)
- D-167-01: o briefing cita "3 Portas novas + 1 INST" de fatia anterior; medido nesta branch: 25 Portas §46.3
  (#164) e 2 INST (#155/#164). Não localizei fatia "3+1" no histórico — usei a árvore medida como baseline.
- D-167-02: 06_Inventario/EXTERNAL_CAPABILITY_REGISTRY.md:37-164 é registry de CAPACIDADE (Graphify, Improve,
  Ponytail, Ruflo, Open Design), não o registro de dependência §31.6 do produto → NÃO tocado (fora do delta).
- D-167-03: 06_Inventario/INVENTARIO_AS_IS.md:11-19 está desatualizado (branch/HEAD/contagem de outra era)
  → NÃO atualizado (fora do delta).
- D-167-04: o card diz "5 itens" em `dependencias/`; medido: 5 arquivos = 4 registros + INDICE (não 5 registros).
- D-167-05: §40.8 (lint detecta dependência sem decisão) × manifesto que exclui `dependencias/` da varredura
  → resolvido pelo validador da família; ligar ao lint exigiria mudar o manifesto (PROPOSTA, não executada).
- D-167-06: defasagem REAL do clasp (versão nunca registrada; npm 3.4.1 × GitHub v3.3.0; 81×68 de publicação
  não reconciliados) — reportada pelo Vigia, decisão humana necessária: SIM. Não aplicada (contrato §7.8).
- D-167-07: em DEP-002 e DEP-004 a observação cobre a declaração/cópia versionada, não o estado vivo da
  planilha (sem leitura remota autorizada nesta fatia) — limite declarado no relatório.
- D-167-08: NÃO MASCARADO — flake pré-existente, fora do delta: na 4.ª execução da suíte,
  Testes/TestVigiaTelegramInterlocucao.js:151 (Teste F — "Sessão gráfica bloqueada → DEFER_LOCKED") falhou
  com "AssertionError: Deve avisar sobre deferimento" → exit 1 (722 PASS). A asserção só vale quando
  res.action === 'DEFER_LOCKED' (VigiaPonte/TelegramCommandRouter.js:172-176); o texto alternativo é
  "⚠️ Envio de V adiado: …" (:180), dependente do gate de prontidão
  (VigiaPonte/OperationalResumeController.js:154-190, com poll de 2 s). Medido: 3/3 verde ISOLADO; suíte
  verde em 4 das 5 execuções (700 antes · 728 · 728 · 722/exit1 · 728). NENHUM arquivo de VigiaPonte/** foi
  tocado por esta fatia, e VigiaPonte/conversation_memory.json JÁ aparecia como "M" no git status colhido
  ANTES de qualquer escrita desta fatia → flake da família VigiaPonte (timing/estado compartilhado),
  sem relação causal com o delta. Candidato a card próprio; NÃO corrigido aqui (seria escopo alheio).

BLOCO DE PROVA GIT (B1) — preencher os 2 exit codes no Executor principal

git_status_short:
 M 02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-01_FORMULARIO_E_MENUS/submodulos/SUB-C01-01-01_OCR_E_CONFERENCIA/NOTA_DE_RESPONSABILIDADE.md
 M RELATORIO_DE_DIFERENCIAS_156_157.md
 M Testes/RodarTodosOsTestes.js
 M VigiaPonte/conversation_memory.json
 M dependencias/DEP-001_GOOGLE_APPS_SCRIPT.md
 M dependencias/DEP-002_GOOGLE_SHEETS.md
 M dependencias/DEP-003_CLASP_DEPLOY.md
 M dependencias/DEP-004_ABAS_E_BASES_CANONICAS.md
 M dependencias/INDICE.md
?? RELATORIO_167.md
?? RESULT_PROPOSTO_167.md
?? Testes/TestNormalizadorEfetivo.js
?? Testes/TestVigiaDependencias.js
?? Testes/temp_test_telegram/
?? dependencias/decisoes/
?? dependencias/vigia/
?? scripts/downplant/validar-dependencias.mjs
?? scripts/downplant/vigia-dependencias.mjs
STATUS_EXIT=0     # 4 M + 2 ?? são drift PRE-EXISTENTE, já presentes antes desta fatia
                  # (VigiaPonte/conversation_memory.json é log de runtime → não commitar)

git_diff_stat:
 .../NOTA_DE_RESPONSABILIDADE.md                    |  2 +-
 RELATORIO_DE_DIFERENCIAS_156_157.md                |  4 +-
 Testes/RodarTodosOsTestes.js                       |  8 ++++
 VigiaPonte/conversation_memory.json                | 44 +++++++++++-----------
 dependencias/DEP-001_GOOGLE_APPS_SCRIPT.md         | 44 +++++++++++++++++++++-
 dependencias/DEP-002_GOOGLE_SHEETS.md              | 40 +++++++++++++++++++-
 dependencias/DEP-003_CLASP_DEPLOY.md               | 38 ++++++++++++++++++-
 dependencias/DEP-004_ABAS_E_BASES_CANONICAS.md     | 37 ++++++++++++++++++-
 dependencias/INDICE.md                             | 33 ++++++++++++++---
 9 files changed, 214 insertions(+), 36 deletions(-)
DIFF_EXIT=0

HEAD: 99877b4cc6d7c383e5328f1321e9b8202ddae2fa  (inalterado)
git_add_exit    = <PREENCHER>
git_commit_exit = <PREENCHER>
APPS_SCRIPT_STATE: NAO APLICAVEL (nenhum delta de produto, nenhum clasp push)

CAMINHOS PARA `git add` EXPLÍCITO (nunca `git add .`):
dependencias/DEP-001_GOOGLE_APPS_SCRIPT.md dependencias/DEP-002_GOOGLE_SHEETS.md
dependencias/DEP-003_CLASP_DEPLOY.md dependencias/DEP-004_ABAS_E_BASES_CANONICAS.md
dependencias/INDICE.md dependencias/decisoes/ dependencias/vigia/
scripts/downplant/validar-dependencias.mjs scripts/downplant/vigia-dependencias.mjs
Testes/TestVigiaDependencias.js Testes/RodarTodosOsTestes.js
RELATORIO_167.md RESULT_PROPOSTO_167.md

PRÓXIMO PASSO NÃO INICIADO
- #168 (DP24-005 — deltas de §46.13/§46.14) NÃO iniciado, por regra de parada desta fatia.
- Candidatos que ficaram FORA do delta e exigem decisão: (a) ligar o §40.8 ao lint (D-167-05);
  (b) reconciliar a defasagem do clasp (D-167-06) — decisão humana; (c) rodada completa do Vigia sobre
  as fontes vivas (DEP-002/DEP-004) quando houver leitura remota autorizada (D-167-07);
  (d) EXTERNAL_CAPABILITY_REGISTRY × §31.6 (D-167-02).
```
