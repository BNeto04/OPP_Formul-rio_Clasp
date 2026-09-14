# RESULT PROPOSTO — #164 (DP24-003) — texto para postagem no card

> Arquivo na **raiz do repositório de propósito** (mesmo precedente de `RESULT_PROPOSTO_158.md`,
> `RESULT_PROPOSTO_159.md`, `RESULT_PROPOSTO_162.md` e `RESULT_PROPOSTO_163.md`).
>
> **Não postado.** O briefing proíbe postar no GitHub nesta fatia. Texto pronto para colagem pelo Planner.
> Relatório completo com a medição campo a campo: `RELATORIO_164.md`.

```text
[HERMES] RESULT — #164 (DP24-003)

STATUS: ENTREGUE COM PENDÊNCIAS DECLARADAS — o §12.6 passou a ser VERIFICÁVEL em todas as Portas
        existentes que o exigem, e a verificação é executável (validador único + fechadura na suíte).
        Medição: 25 Portas ELEGÍVEIS (das 45 declaradas) receberam descrição formal §46.3 e o
        checklist de produção completo (9/9 itens, 286 verificações PASS / 0 FAIL, exit 0).
        13 Portas ficam com 17 itens `pendente` — todos COM justificativa escrita, como manda o §12.6:
        o item pendente BLOQUEIA a Porta em G7 e este card NÃO o esconde (é o achado principal).
        Antes deste card: 0 Portas com contrato §46.3, 0 Portas com checklist, 0 seções §12.6 no cofre.

EVIDÊNCIA TIPADA
- 03_Fundacao/METODO_DOWN_PLANT_PROGRESSIVO_v2.4.md:308-320 — §12.6 verbatim (9 itens + a regra
  "item pendente bloqueia a Porta em G7" + "referenciar a Instalação transversal em vez de repeti-la")
- 03_Fundacao/METODO_DOWN_PLANT_PROGRESSIVO_v2.4.md:789-807 — modelo de Porta §46.3 (a seção
  `## Checklist de produção (§12.6)` é do próprio modelo); :259-260 §8.11 (Instalação transversal);
  :676-686 §40.5 (cápsula → pasta `portas/`); :391 (bloqueio por item pendente)
- 02_Comodos/C00_Governanca_Estrutural/03_Especificacoes/INVENTARIO_PORTAS_E_CHECKLIST_12_6.md
  — inventário canônico (bloco PORTA-REGISTRY-V1, 45 linhas): critério do §12.6 operacionalizado,
  veredito de elegibilidade com motivo, seção 4 (mapa dos 17 pendentes) e 4.1 (as duas causas-raiz)
- 02_Comodos/**/portas/PORTA-*.md — 25 arquivos §46.3 criados (antes: 15 pastas `portas/` VAZIAS);
  cada item do checklist carrega `arquivo:linha` do fato medido (ex.: PORTA-C01-02-P02_ESCRITA_EFETIVO.md:38
  cita Features/NormalizadorEfetivo.js:158,160; PORTA-C05-01-P03_COLUNA_ALERTA_AM.md:35 cita
  Features/GuardiaoQualidade.js:162,648)
- scripts/downplant/validar-portas.mjs — validador canônico ÚNICO (286 PASS / 0 FAIL, exit 0);
  exporta parseInventario/lerItensChecklist/validarPortaArquivo/portasDeclaradas/conferir (reuso, sem 2º validador)
- Testes/TestValidarChecklistProducaoPortas.js + Testes/Fixtures/portas_12_6/ (6 fixtures + mini_repo
  com 4 inventários) + Testes/RodarTodosOsTestes.js (bloco de registro do portão na suíte)

MEDIÇÃO ANTES (comando → resultado)
- grep -rln "^## Portas" 02_Comodos --include=*.md → 11 cápsulas (+INDICE de C01) declaram Portas como
  LINHA DE TABELA; find 02_Comodos -type d -name portas → 15 pastas, TODAS vazias (0 arquivos)
- grep -rn "PORTA-" (md/canvas/mjs) → 0; grep -rln "Checklist de produção|checklist_producao" → só o método
- grep -rn LockService --include=*.js no produto → 0 (única menção do repo: stub de sandbox,
  Testes/TestMenuP3.js:80)

INVENTÁRIO (45 Portas; elegível = cruza Cômodo OU efeito externo OU concorrência)
- ELEGÍVEIS 25: C00/MOD-C00-03/P01 · C01/MOD-C01-01/P01..P06 · C01/MOD-C01-02/P01..P03 ·
  C02/MOD-C02-01/P01..P03 · C04/MOD-C04-01/P01 · C05/MOD-C05-01/P01..P05 ·
  C06/MOD-C06-01/P01..P02 · C06/MOD-C06-02/P01..P04
- NÃO ELEGÍVEIS 20 (com motivo escrito): Portas declarativas/normativas de C00-01/C00-02, utilitários
  puros de C00-03, manifesto appsscript.json, resolução de cabeçalho e acúmulo em memória de C02,
  Portas internas de C04 e C06, agregadora de headless de C08, bancada CLI de C08, gatilho de menu do
  normalizador. Leitura declarada: travessia DE CÓDIGO (import/manifesto/lint/config) ≠ travessia DE
  EXECUÇÃO — os 9 itens seriam todos nao_aplicavel e o §40.6 proíbe documento vazio.

CHECKLIST APLICADO (mapa §12.6 → Porta → estado por item, completo no RELATORIO_164.md §4)
- 12 Portas VERDES (9/9 itens sem pendência): P3, Formulário→ARCA, AIS, entrada-manual-headless,
  efetivo-autocomplete, normalizador→ARCA, leitura-de-planilha, fatos canônicos, prova headless de C02,
  fatos→motor, guardião→ARCA, menu→guardião.
- 13 Portas AMARELAS com 17 `pendente` JUSTIFICADOS:
  race_condition (9): P01 log de auditoria de C00-03; P03 entrada manual de BO; P02/P03 do normalizador
  (escrita em EFETIVO + headless); P02/P03/P05 do guardião (abas de auditoria, coluna AM, headless);
  P01/P02 do comparativo 2026.
  idempotente (5): P03 entrada manual (reentrega grava novo bloco; a decisão declarada é avisar e triar
  no Guardião) e P01/P02/P03 do compilador de armas (aba nova versionada por execução, sem política de
  expurgo — Compilador_Armas.js:251-260).
  operacao_atomica (1): P03 entrada manual (gravação por fases, coluna a coluna, sem rollback).
  C06/MOD-C06-02/P04 (3): Porta `Compilador → ARCA` DECLARADA NA CÁPSULA E SEM CHAMADA NO RUNTIME.
- RESPOSTAS JÁ COBERTAS, REFERENCIADAS EM VEZ DE REPETIDAS (§12.6): `cache` das 3 Portas de ARCA
  referencia o mesmo singleton congelado (Dominio/ARCA/AdaptadorConsultaArca.js:108,137); as Portas
  headless referenciam o contrato das Portas de UI irmãs. Não há Instalação transversal VIGENTE para
  referenciar hoje: o único INST-* do cofre (INST-EXEC-001) está RETIRADO; o validador já reprova
  referência a INST-* inexistente para o dia em que existir.

CAUSAS-RAIZ (uma decisão cada, não 17 correções)
1. NÃO EXISTE SERIALIZAÇÃO no produto (0 LockService) e há sempre dois chamadores do mesmo efeito
   (operador pela UI + agente por `clasp run`). Resolve os 9 `race_condition` → forma prevista: UMA
   Instalação transversal INST-* de serialização (§8.11), referenciada pelas Portas.
2. NÃO EXISTE POLÍTICA DE IDEMPOTÊNCIA para artefatos que se acumulam (aba nova por execução; novo
   bloco por reentrega). Resolve os 5 `idempotente` → decisão do Planner (chave MIKE+BOE na entrada;
   versionamento com expurgo ou sobrescrita idempotente nas abas geradas).
3. SEM CAUSA COMUM: C06/MOD-C06-02/P04 — ou a consulta à ARCA é implementada, ou a linha sai da cápsula
   (§17, mapa == realidade). 3 `pendente`.

TESTE RED → GREEN (saída real)
- VERMELHO (estado pré-card): 0 arquivos PORTA-* e 0 seções §12.6 no cofre. Reprodução determinística
  na fechadura: node scripts/downplant/validar-portas.mjs Testes/Fixtures/portas_12_6/mini_repo
  --registry .../inventario_antes_do_card.md → exit 1, "Porta ELEGIVEL sem 'arquivo_porta'" nomeando
  cada Porta; e os cenários de arquivo ausente e de Porta ORNAMENTAL → exit 1 cada.
- VERDE (depois): validador no repo real → 286 PASS / 0 FAIL, exit 0; fechadura →
  node Testes/TestValidarChecklistProducaoPortas.js → 18 PASS / 0 FAIL, exit 0.
- DENTES NO ARTEFATO REAL (prova no teste nº 15/16): removendo o item `cache` (ou a seção inteira) de
  uma Porta REAL, o validador acusa — a fechadura não é decorativa.
- O teste também confere o MAPA de pendências do inventário contra os arquivos, ITEM A ITEM nos dois
  sentidos: o relatório não pode divergir do artefato.

AS QUATRO PONTAS
- CÓDIGO: INALTERADO. Nenhum arquivo de produto (Core/, Features/, Entrada/, Render/, Dominio/, Motor/,
  Leitura/, Drivers/, raiz) foi tocado; git status prova. O único arquivo de código alterado é o runner
  de teste (Testes/RodarTodosOsTestes.js: 1 bloco, na convenção já usada pelo #163).
- DOCUMENTAÇÃO: inventário canônico + 25 Portas §46.3 + RELATORIO_164.md (antes/depois, mapa item a item,
  4 divergências nomeadas) + este RESULT.
- CANVAS/PLANTA: INALTERADO por decisão — nenhum .canvas editado, nenhum nó/aresta novo. As Portas já
  estavam desenhadas nos circuitos; o que faltava era o ELEMENTO com contrato, e ele passou a existir
  no endereço que o §40.5 previa e que estava VAZIO (15 pastas `portas/`). Elemento→Porta→Circuito
  preservado: cada Porta aponta o Módulo dono, o circuito e os arquivos medidos.
- GIT: branch sprint/g01-guardiao-qualidade-live-001, HEAD f19198c2c758d4652b0d5ab2f7b1f05aaf05b4ff
  (inalterado — nada commitado). Delta só no working tree: 42 arquivos novos deste card (25 Portas +
  inventário + validador + fechadura + 12 fixtures + RELATORIO_164.md + RESULT_PROPOSTO_164.md) + 1
  modificado (Testes/RodarTodosOsTestes.js, 1 bloco). Sem commit, sem push, sem postagem, sem card novo,
  #172 intocado. (Os arquivos M/?? que não são deste card estão nomeados no RELATORIO_164.md §11.)

DIVERGÊNCIAS ENCONTRADAS E REGISTRADAS (não corrigidas — escopo: doc/contrato + teste)
- D-164-01 C02: a cápsula descreve `valueRenderOption=FORMULA|FORMATTED_VALUE` como contrato de runtime;
  medido: 0 ocorrências no produto e nenhum serviço avançado no appsscript.json — era o MÉTODO DE MEDIÇÃO
  do #142. Runtime: getValues() e Range.getFormulas() (3 pontos).
- D-164-02 C06-02: Porta `Compilador → ARCA` declarada SEM chamada (grep AdaptadorConsultaArca em
  Compilador_Armas.js = 0). É a mesma raiz do pendente da P04.
- D-164-03 C01: o INDICE declara "C01 → C07 Efetivo (getEfetivo)" e o código rotula "M07 Efetivo", mas
  NÃO existe Cômodo C07 no cofre (C00,C01,C02,C03,C04,C05,C06,C08).
- D-164-04 C05: Features/GuardiaoHeadless.js:11 declara "NAO altera dados operacionais", porém a prova
  headless executa auditarMeses → varrerAba, que GRAVA a coluna AM (Alerta Integridade) da aba auditada
  e cria o cabeçalho quando ausente (Features/GuardiaoQualidade.js:199-201,648).

SUÍTE E LINT (saída real, exit explícito)
- node scripts/downplant/lint-estrutura.mjs .  → exit 0
- node Testes/RodarTodosOsTestes.js → exit 0 (antes: 285 PASS/0 FAIL; depois: 303 PASS/0 FAIL, +18 = a
  fechadura nova). As 31 linhas "FAIL" do log são saída ESPERADA das fixtures negativas (22 do #163 +
  9 deste card) — nenhuma asserção real falhou. TestVigiaNaturalLanguage (#172) passou nas duas execuções.

PENDÊNCIAS DECLARADAS (o que este card NÃO fechou, por decisão de escopo)
- Os 17 `pendente` acima (bloqueiam G7 nas 13 Portas). Este card os torna VISÍVEIS e justificados; a
  decisão é do Planner (§6 do relatório).
- Nada commitado/empurrado/postado (ordem do card). Sem push, sem card novo, #172 intocado.
- Nenhum código de produto alterado — inclusive onde a medição mostrou defeito (D-164-01..04 ficam
  nomeados e localizados para card próprio).

DONE_GATE: §12.6 verificável e verificado nas Portas elegíveis (presença + completude + justificativa de
pendente + nenhuma Porta ornamental), com fechadura na suíte. Não é verde absoluto porque 17 itens
`pendente` são REAIS e bloqueiam 13 Portas em G7 — declarados, com causa-raiz e correção exigida.
NEXT_ACTION: Planner decide (1) a Instalação transversal de serialização, (2) a política de idempotência
e (3) o destino da Porta `Compilador → ARCA`; depois disto as 13 Portas amarelas viram verdes sem
reescrever nenhuma delas (passariam a referenciar a instalação).
```
