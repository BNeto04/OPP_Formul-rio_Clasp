# RESULT PROPOSTO — #168 (DP24-005) — texto para postagem no card

> Arquivo na **raiz do repositório de propósito** (mesmo precedente de `RESULT_PROPOSTO_158.md` … `RESULT_PROPOSTO_167.md`).
> **Não postado.** O briefing proíbe postar no GitHub nesta fatia. Texto pronto para colagem pelo Planner.
> Relatório completo, com a medição campo a campo: `RELATORIO_168.md`. Prova Git: `BLOCO_PROVA_GIT_168_B1.md`.

```text
[HERMES] RESULT — #168 (DP24-005)

STATUS: ENTREGUE — COM 1 FALHA PRÉ-EXISTENTE DECLARADA (fora do delta) E 1 DECISÃO HUMANA PENDENTE.
        A dívida §46.11 foi resolvida: o espelho Markdown do handoff PASSOU A DERIVAR do YAML canônico
        (mecanismo único, reusado pelo Curador — sem processo paralelo e sem segundo validador). O modelo
        §46.13 foi implantado como formato único do Curador, com exemplo real materializado pelo próprio
        mecanismo. O §46.14 recebeu ZERO delta: já existia (#167/DP24-004) — foi apenas HOMOLOGADO
        (as rubricas são extraídas do próprio método e conferidas no relatório do Vigia). Nada foi
        reimplementado: `parseYaml` do validador canônico é reusado pelos DOIS scripts novos, e o Curador
        reusa o gerador (§46.11) em vez de ter lógica própria. Nenhum arquivo de produto foi tocado.
        Lint exit 0; validador do handoff 40 PASS / 0 FAIL exit 0; fechadura nova 26 PASS / 0 FAIL exit 0;
        suíte integral 753 PASS / 1 FAIL exit 1 — o único FAIL é PRÉ-EXISTENTE em f8f11b0 (RELATORIO_VIGIA
        desatualizado vs DEP-003), provado em árvore pura de HEAD e NÃO corrigido (fatia do #167, fechado).

MEDIÇÃO ANTES → DEPOIS (o que a fatia mudou, com número)
- §46.13 no repo: ANTES inexistente (nenhum mecanismo; `00_Painel/` do repo só tem INICIO.md; nenhum
  arquivo *CURADOR* no repo — duas leituras independentes) → DEPOIS `scripts/downplant/curador-estrutural.mjs`
  (386 linhas) no formato do método.
- Formato §46.13: ANTES o praticado (só no espelho) cobria 8 dos 13 elementos → DEPOIS 13 de 13.
- §46.14: ANTES já implantado (#167) → DEPOIS inalterado (zero delta), homologado no teste novo.
- Espelho do handoff (§46.11): ANTES derivado À MÃO — 0 de 9 rubricas do modelo, 15 de 58 fatos do YAML
  REESCRITOS no .md, 10 linhas de prosa sem origem no YAML, CRLF × LF → DEPOIS 9 de 9 rubricas,
  0 fatos reescritos, 0 linhas órfãs, LF × LF, `--check` exit 0.
- Espelho: 112 linhas (HEAD) → 158 linhas, todas com origem declarada (72 valor-do-YAML · 10 ausência
  declarada · 29 estrutura do método §46.11 · 48 layout).
- Fechadura: não existia → 26 PASS / 0 FAIL (exit 0), com RED real nos dois modos de deriva.
- Suíte integral: 727 PASS / 1 FAIL / exit 1 → 753 PASS / 1 FAIL / exit 1 (+26 PASS; MESMO FAIL, herdado).

EVIDÊNCIA TIPADA (arquivo:linha + saída real)
- FUNDAMENTO NO MÉTODO
  · 03_Fundacao/METODO_DOWN_PLANT_PROGRESSIVO_v2.4.md:181 — §4.5 verbatim: "YAML e Markdown do handoff
    divergentes → o YAML vence; a divergência em si é deriva a ser reportada pelo Curador (§7.7)"
  · :228-231 — §7.7 verbatim: "O Curador não toma decisões arquiteturais por conta própria: OBSERVA →
    COMPARA → DETECTA → ATUALIZA O QUE FOR MECÂNICO ou → REPORTA O QUE EXIGIR DECISÃO"
  · :926 — §46.11 verbatim: "Gerado automaticamente a partir do objeto downplant_handoff (§46.12).
    Não editar diretamente — editar o YAML de origem e regerar."
  · :927-968 — §46.11: corpo do espelho (9 rubricas) · :971-996 — §46.12: objeto canônico
  · :998-1015 — §46.13: modelo do relatório do Curador (6 campos + 7 seções + saída de 3 estados)
  · :1016-1028 — §46.14: modelo do relatório do Vigia (já implantado no #167)
  · :394-395 — §18.1: "YAML e Markdown do handoff divergentes (§4.5)" listado como deriva
- DÍVIDA §46.11 RESOLVIDA — o .md agora DERIVA do YAML
  · scripts/downplant/gerar-handoff-md.mjs (NOVO, 370 linhas) — `gerarMarkdown(doc,{arquivoMd})` devolve
    {markdown, mapa, linhas}; CLI `--check|--mapa|--out|--aplicar`; :38-40 importa `parseYaml` do
    validador canônico (NENHUM segundo parser YAML no repo)
  · 08_Execucao_Ao_Vivo/downplant_handoff.yaml:88-98 — bloco `notas` (+11): `projecao_32_14`, `verificacao`,
    `formato`, `derivacao_do_espelho`. A prosa que vivia SÓ no .md passou para a FONTE (o espelho só pode
    conter o que o YAML declara)
  · 08_Execucao_Ao_Vivo/downplant_handoff.md — REGERADO (129+/83−, git --numstat): 158 linhas, LF,
    sha256=93941f948fb08f624cb320ac220f989cde752b3aabbcb91e20a336808b7cdf88
  · `node scripts/downplant/gerar-handoff-md.mjs --check` → "CHECK: IDENTICO - o espelho
    08_Execucao_Ao_Vivo/downplant_handoff.md deriva do YAML (sha256=93941f948fb08f62...)" · exit 0
  · `--mapa` medido: 72 linhas tipo `yaml` · 10 `ausente` · 29 `skeleton` (§46.11) · 48 `estrutura`
  · troca de valor NÃO existe no espelho: toda linha de valor é verbatim do YAML (teste dedicado)
  · link das referências é DERIVADO relativo ao diretório do espelho — mesma base do lint
    (scripts/downplant/lint-estrutura.mjs:173)
- MODELO §46.13 IMPLANTADO (formato único do Curador)
  · scripts/downplant/curador-estrutural.mjs (NOVO, 386 linhas) — :30-33 importa `parseYaml` do validador
    e `gerarMarkdown` do gerador; :35-37 FLAGS_PROIBIDAS (`--decidir --decisao --resolver --fix --auto
    --patch --upgrade`); :33-34 campos do modelo de origem declarada
  · `node scripts/downplant/curador-estrutural.mjs` → relatório com os 6 campos + 7 seções NA ORDEM do
    método + linha final "SINCRONIZADO | DIVERGENTE | NENHUMA AÇÃO"; exit 0 (relata, não é portão)
  · estado medido na rodada real: `**Estado do Curador (§46.13):** DIVERGENTE` — com o par do handoff
    "**sem divergência**"; o DIVERGENTE vem de FATO MEDIDO: 10 campos do modelo não declarados pelo
    objeto (`downplant.terreno|submodulo|circuito|porta` — §46.12; `conexoes.origem|destino|contrato`,
    `escopo.artefatos`, `proibicoes.efeitos_externos|publicacao` — rubricas §46.11) → `REPORTA O QUE
    EXIGIR DECISÃO`, listado em "## Decisão humana necessária"
  · 08_Execucao_Ao_Vivo/RELATORIO_CURADOR_2026-09-14.md (41 linhas) — exemplo real, gerado pelo mecanismo;
    determinístico (2 rodadas idênticas, `cmp = 0`; relatório materializado == geração atual, `cmp = 0`)
  · 08_Execucao_Ao_Vivo/LEIAME_CURADOR.md (84 linhas) — o LEIAME do padrão (espelha o LEIAME_VIGIA.md)
  · nada muta sem `--aplicar`: `--aplicar` aplica SÓ a ação mecânica (regerar o espelho do YAML) e o
    teste prova que o YAML sai intacto; `--decidir` etc. → exit 1, ANTES de qualquer leitura/escrita
- §46.14 HOMOLOGADO (zero delta)
  · scripts/downplant/vigia-dependencias.mjs:182-240 (relatório §46.14) e :35-64 (recusa de mutação) —
    intactos · dependencias/vigia/RELATORIO_VIGIA_2026-09-14.md:1-43 · dependencias/vigia/LEIAME_VIGIA.md
  · o teste novo extrai as rubricas do §46.14 (:1017-1028) e confere 10/10 no relatório do Vigia
- FECHADURA (RED → GREEN por reversão, com sha256sum -c)
  · Testes/TestCuradorEstrutural.js (NOVO, 453 linhas) + registro em Testes/RodarTodosOsTestes.js:127-135
  · GREEN: `exit FECHADURA (GREEN) = 0` · `RESULTADOS FINAIS: 26 PASS / 0 FAIL`
  · RED-A (edição manual do .md): `exit --check = 1` · `exit FECHADURA (RED-A) = 1` · `23 PASS / 3 FAIL`
    e o relatório do Curador passa a dizer "**DIVERGENTES**" com a linha órfã contabilizada
  · RED-B (YAML alterado sem regerar): `exit --check = 1` · `exit FECHADURA (RED-B) = 1` · `22 PASS / 4 FAIL`
  · REVERSÃO-A/B: `08_Execucao_Ao_Vivo/downplant_handoff.md: OK` e `…handoff.yaml: OK` (sha256sum -c, exit 0)
    → GREEN de novo: `26 PASS / 0 FAIL`, exit 0
  · rubricas do teste são EXTRAÍDAS do método (:926-968, :999-1015, :1017-1028), não digitadas no teste
- PORTÕES (exit real, coleta 2026-09-14 12:26:08 -0300 @ f8f11b0)
  · `node scripts/downplant/lint-estrutura.mjs` → **exit 0** ("✅ SUCESSO! … Down Plant 2.1")
  · `node scripts/downplant/validar-handoff.mjs .` → **exit 0** · **40 PASS / 0 FAIL**
  · `node Testes/TestCuradorEstrutural.js` → **exit 0** · **26 PASS / 0 FAIL**
  · `node Testes/RodarTodosOsTestes.js` → **exit 1** · **753 PASS / 1 FAIL** (FAIL pré-existente, ver D-168-01)
  · ANTES (delta revertido, resto idêntico): lint exit 0 · suíte **727 PASS / 1 FAIL** exit 1

RED → GREEN POR REVERSÃO (verbatim do log `prova_red_green_168_v2.log` + `verificacao_final_168.log`)
  CHECK: IDENTICO … (sha256=93941f948fb08f62...)          exit --check = 0
  RESULTADOS FINAIS: 26 PASS / 0 FAIL                      exit FECHADURA (GREEN) = 0
  RED-A: CHECK: DIVERGENTE … 160 linhas x 158 derivadas    exit --check = 1 · exit FECHADURA = 1 (23/3)
  08_Execucao_Ao_Vivo/downplant_handoff.md: OK             exit sha256sum -c = 0
  GREEN de novo: RESULTADOS FINAIS: 26 PASS / 0 FAIL       exit FECHADURA = 0
  RED-B: CHECK: DIVERGENTE … derivado sha256=cacf74c858d528a8...  exit --check = 1 · exit FECHADURA = 1 (22/4)
  08_Execucao_Ao_Vivo/downplant_handoff.yaml: OK           exit sha256sum -c = 0
  GREEN final + validador: exit FECHADURA = 0 · exit VALIDADOR = 0 · 40 PASS · 0 FAIL

AS QUATRO PONTAS (#57)
- CÓDIGO: NÃO APLICÁVEL ao produto (0 arquivos de produto tocados; `clasp push` NÃO executado). Os 4
  arquivos executáveis são bancada de governança/teste (`scripts/**`, `Testes/**` — fora do Apps Script
  por `.claspignore`).
- DOCUMENTAÇÃO: ELEVADA — §46.13 com mecanismo + LEIAME + relatório real; §46.11 com gerador canônico;
  bloco `notas` na fonte; RELATORIO_168.md; BLOCO_PROVA_GIT_168_B1.md.
- CANVAS/PLANTA: INALTERADO — nenhum .canvas editado; o Curador apenas verifica a existência do canvas
  declarado (`referencias.planta_mestra` existe em disco) e reporta os canvas citados pelo commit observado.
- GIT: 🟡 NÃO PROVADO (protocolo B1) — nada commitado/empurrado/postado nesta fatia; HEAD segue
  f8f11b0b2da843a51c932ce67567bcf5a96eb435. Bloco B1 abaixo traz o que foi colhido; os exit codes de
  `git add` e `git commit` serão preenchidos pelo Executor principal.

DIVERGÊNCIAS E PENDÊNCIAS DECLARADAS (nada escondido)
- D-168-01: NÃO MASCARADO — a suíte integral sai **exit 1** por **1 FAIL PRÉ-EXISTENTE em f8f11b0**, fora
  do delta: `Testes/TestVigiaDependencias.js` → "o relatorio commitado e reproduzivel (regerar == arquivo
  em disco)". Causa medida: `dependencias/vigia/RELATORIO_VIGIA_2026-09-14.md` não é regerado desde
  `f9a23fb` (DP24-004), enquanto o vínculo mudou 3× (`53684b7` → `a929f1e` → `f8f11b0`, que alterou
  `versao: "NAO_COMPROVADA"` → `"3.3.0"` sem regerar o relatório, que segue declarando `AUSENTE_DECLARADO`).
  Provado que NÃO é desta fatia em duas leituras independentes: (a) `git status --short dependencias/`
  → vazio; (b) `git archive HEAD` (árvore pura de HEAD) → `node Testes/TestVigiaDependencias.js` →
  `27 PASS / 1 FAIL`, exit 1. Correção = `node scripts/downplant/vigia-dependencias.mjs --out
  dependencias/vigia/RELATORIO_VIGIA_2026-09-14.md`, que pertence ao #167 (card FECHADO) → DECLARADO,
  NÃO EXECUTADO.
- D-168-02: DECISÃO HUMANA PENDENTE (não é mecânica) — o objeto `downplant_handoff` não declara 10 campos
  do modelo canônico (`downplant.terreno|submodulo|circuito|porta`; `conexoes.origem|destino|contrato`;
  `escopo.artefatos`; `proibicoes.efeitos_externos|publicacao`). Regerar o espelho NÃO resolve: declarar
  esses campos mudaria o conteúdo do handoff (inventaria endereço Down Plant) — é do Planejador/Proprietário.
  O Curador apenas REPORTA (§7.7), e por isso o estado da rodada é DIVERGENTE.
- D-168-03: fora do delta — a reconciliação espelho × repo (110 só no espelho, 58 só no repo, 24
  divergentes de conteúdo; `RELATORIO_DE_DIFERENCIAS_158.md:196-205`) NÃO foi retomada, e o relatório de
  Curador do espelho (`Obsidian_Brain/Syntheon/00_Painel/RELATORIO_DO_CURADOR.md`, 50 linhas) NÃO foi
  tocado. Os 5 elementos que faltavam nele (4 campos + a linha de saída) estão agora no FORMATO ÚNICO do
  repo — reconciliar o artefato do espelho é outra Porta (§4.4).
- D-168-04: fora do delta — o Curador NÃO roda o validador do handoff em subprocesso nem confere o
  contrato §32.14: §32.14 tem um dono só (`scripts/downplant/validar-handoff.mjs`), e o relatório apenas
  aponta para ele. Idem `notas.verificacao` ("40 PASS / 0 FAIL, exit 0"): é medição declarada na data de
  `gerado_em`, não reexecutada pelo Curador a cada rodada.
- D-168-05: ruído pré-existente NA MEDIÇÃO, não no produto — na árvore pura de HEAD sem `.git` o
  validador do handoff falha 2 verificações (branch/HEAD não legíveis); a medição ANTES da suíte foi
  refeita numa cópia COM `.git` (727 PASS / 1 FAIL), que é o baseline válido desta fatia.

BLOCO DE PROVA GIT (B1) — `GIT 🟡 NÃO PROVADO`
(1) STATUS  → `git status --short` (desta fatia): 3 M + 5 ?? novos + 3 ?? relatórios desta fatia
              M 08_Execucao_Ao_Vivo/downplant_handoff.md
              M 08_Execucao_Ao_Vivo/downplant_handoff.yaml
              M Testes/RodarTodosOsTestes.js
              ?? scripts/downplant/gerar-handoff-md.mjs
              ?? scripts/downplant/curador-estrutural.mjs
              ?? Testes/TestCuradorEstrutural.js
              ?? 08_Execucao_Ao_Vivo/LEIAME_CURADOR.md
              ?? 08_Execucao_Ao_Vivo/RELATORIO_CURADOR_2026-09-14.md
              ?? RELATORIO_168.md · ?? RESULT_PROPOSTO_168.md · ?? BLOCO_PROVA_GIT_168_B1.md
(2) DIFF_STAT_EXIT=0 → só o delta desta fatia (--numstat):
              129  83  08_Execucao_Ao_Vivo/downplant_handoff.md
              11   0  08_Execucao_Ao_Vivo/downplant_handoff.yaml
              9    0  Testes/RodarTodosOsTestes.js
(3) HEAD: f8f11b0b2da843a51c932ce67567bcf5a96eb435  (inalterado)
    git_add_exit    = <PREENCHER>   # caminhos EXATOS no §1 de BLOCO_PROVA_GIT_168_B1.md
    git_commit_exit = <PREENCHER>
(4) remoto: origin = https://github.com/BNeto04/OPP_Formul-rio_Clasp.git
    git rev-parse origin/sprint/g01-guardiao-qualidade-live-001 = f8f11b0b2da843a51c932ce67567bcf5a96eb435
    git rev-list --left-right --count origin/…...HEAD = 0<TAB>0        (sem ahead/behind no HEAD da coleta)
(5) APPS_SCRIPT_STATE: NAO APLICAVEL (nenhum delta de produto, nenhum clasp push)

CAMINHOS PARA `git add` EXPLÍCITO (nunca `git add .`):
scripts/downplant/gerar-handoff-md.mjs scripts/downplant/curador-estrutural.mjs
Testes/TestCuradorEstrutural.js Testes/RodarTodosOsTestes.js
08_Execucao_Ao_Vivo/downplant_handoff.yaml 08_Execucao_Ao_Vivo/downplant_handoff.md
08_Execucao_Ao_Vivo/LEIAME_CURADOR.md 08_Execucao_Ao_Vivo/RELATORIO_CURADOR_2026-09-14.md
RELATORIO_168.md RESULT_PROPOSTO_168.md BLOCO_PROVA_GIT_168_B1.md
(NÃO adicionar: NOTA_DE_RESPONSABILIDADE.md, RELATORIO_DE_DIFERENCIAS_156_157.md,
 VigiaPonte/conversation_memory.json, Testes/TestNormalizadorEfetivo.js, Testes/temp_test_telegram/ —
 são pré-existentes, não desta fatia)

PRÓXIMO PASSO NÃO INICIADO
- #169 NÃO iniciado, por regra de parada desta fatia (parar ao fim da fatia para auditoria).
- Fora do delta, exigindo decisão: (a) D-168-01 — regerar o relatório do Vigia e fechar a deriva de
  `dependencias/` (fatia do #167, card fechado); (b) D-168-02 — declarar (ou aceitar como ausente) os 10
  campos do modelo no handoff; (c) D-168-03 — reconciliar o relatório de Curador do espelho com o formato
  único agora implantado; (d) ler o bloco §46.15 (espelho rico) para a próxima fatia da série DP24.
```
