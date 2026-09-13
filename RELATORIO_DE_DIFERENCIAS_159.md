# RELATORIO DE DIFERENCAS - #159 (ARCA-COUNT-001)

**Card:** #159 - *[ARCA-COUNT-001] Reconciliar contagens da ARCA em JSON, MD, inventario e circuito* (Pai logico: #57 / #154).
**Titulo do card no GitHub:** `[ARCA-COUNT-001] Reconciliar contagens da ARCA em JSON, MD, inventario e circuito` (OPEN, labels `sprint:g01`, `tipo:task`).
**Repo canonico:** `C:\Users\Bneto04\Documents\Codex\syntheon-gs-downplant-offline`
**Branch / HEAD no momento do registro:** `sprint/g01-guardiao-qualidade-live-001` / `6a2671a`
**Espelho:** `C:\Users\Bneto04\Documents\Obsidian\Obsidian_Brain\Syntheon`
**Data:** 2026-09-13
**Regra do Proprietario (verbatim):** *"reconciliar as contagens da ARCA por METRICA, nao escolher um numero artificial"*.
**Regra dura respeitada:** **nenhum numero foi digitado para "fechar" a reconciliacao** - todo valor publicado e a MEDICAO de um campo do JSON, feita por script versionado. Nenhum codigo de produto (`.js`/`.html` de runtime) foi alterado; nenhum commit, push, `clasp push` ou postagem no GitHub.

---

## 1. O que o card pediu e o que foi entregue

| Pedido do card | Entrega |
|---|---|
| Separar total de regras, mapeadas, integradas, nao aplicaveis, nao auditaveis, codigos de diagnostico e rule_ids unicos | `scripts/downplant/contar-regras-arca.mjs` publica **25 metricas nomeadas**, cada uma com a definicao do campo medido (secao 2) |
| Usar o JSON canonico como fonte somente para o que ele realmente representa | Medicao 100% derivada de `Dominio/ARCA/arca_regras_dominio.json` (sha256 pinado no texto gerado) + porta medida do `AdaptadorConsultaArca.js` |
| Corrigir MD/inventario/circuito com rotulos explicitos | `INVENTARIO_ARCA.md` (regerado por inteiro), `ARCA_REGRAS_DOMINIO.md`, `ARCA_COBERTURA.md`, `arca_flow.html`, circuito `CIR-MOD-C03-02` e os 4 submodulos/NOTAs do MOD-C03-02 |
| Criar teste/validador que impeca nova divergencia silenciosa | `Testes/TestArcaContagemDerivada.js` - **fechadura** de 15 testes; **nasceu VERMELHO** (1 PASS / 13 FAIL) e ficou **VERDE** (15 PASS / 0 FAIL) apos a aplicacao derivada |
| DONE: nenhum "total ARCA" ambiguo permanece | Os totais agora existem so como metrica nomeada + definicao; regiao historica e explicitamente marcada por marcador (`ARCA-HISTORICO`) |

---

## 2. As metricas (o que cada numero significa)

Publicadas pelo gerador/medidor (saida em TEXTO e em JSON). Nenhuma metrica nova foi inventada: todas sao a decomposicao do mesmo campo do JSON.

| Metrica | Definicao (campo medido) | Valor |
|---|---|---|
| `regras_total` | registros na lista `regras` | **49** |
| `rule_ids_unicos` | valores distintos de `rule_id` | **49** |
| `regras_mapeadas` | `auditabilidade_guardiao.status = MAPEADO` (o Guardiao audita) | **33** |
| `regras_integradas` | `auditabilidade_guardiao.status = INTEGRADO` | **8** |
| `regras_nao_aplicaveis` | `auditabilidade_guardiao.status = NAO_APLICAVEL` | **8** |
| `regras_nao_auditaveis` | `auditabilidade_guardiao.status = NAO_AUDITAVEL` (cegas) | **0** |
| `regras_sem_auditoria_guardiao` | `regras_total − regras_mapeadas` (o que o Guardiao **nao** audita) | **16** |
| `codigos_diagnostico` / `_unicos` | soma / distintos de `auditabilidade_guardiao.codigos` | **38 / 38** |
| `regras_com_codigo` | regras com ao menos 1 codigo | **30** |
| `porta_codigos` / `porta_rule_ids` | entradas de `AdaptadorConsultaArca.MAPA_DIAGNOSTICO_ARCA` / `rule_id` distintos alcancados | **38 / 30** |
| `regras_sem_regra_na_porta` | `regras_total − porta_rule_ids` | **19** |
| `campos_por_regra` / `_uniao` | campos do padrao do catalogo / uniao de campos | **23 / 25** |
| `fontes_canonicas` / `internas` / `desconhecidas` | `fonte_status` | **12 / 35 / 2** |
| `subdominios` / `categorias` | valores distintos | **19 / 36** |
| `arquivos_totais_repo` / `arquivos_varridos_dominio_js` / `arquivos_excluidos` | `meta.varredura_exaustiva.universo` | **3413 / 127 / 3286** |
| `lacunas_detectadas` / `resolvidas` / `aceitas` | `meta.varredura_exaustiva` | **6 / 6 / 0** |

Coerencia provada pelo proprio medidor (e testada): soma por tipo = 49; soma por status = 49; soma por subdominio = 49; `mapeadas + integradas + nao_aplicaveis + nao_auditaveis = 49`; 38 codigos na porta = 38 codigos no JSON; 0 codigo da porta sem `rule_id`; 0 codigo de diagnostico em duas regras.

**Saidas do script (evidencia bruta):**

```
node scripts/downplant/contar-regras-arca.mjs          -> tabela em TEXTO (stdout)
node scripts/downplant/contar-regras-arca.mjs --json   -> payload JSON (metricas + blocos + artefatos)
node scripts/downplant/contar-regras-arca.mjs --aplicar [--espelho]
scripts/downplant/arca_metricas_derivadas.json         -> snapshot de maquina (metricas + sha256 do JSON)
```

---

## 3. Antes x Depois por arquivo (medido, nao estimado)

### 3.1 `Dominio/ARCA/INVENTARIO_ARCA.md` - metrica: `regras_total` / `regras_mapeadas` / `regras_integradas` / `regras_nao_aplicaveis` / `codigos_diagnostico`

| Campo | ANTES | DEPOIS |
|---|---|---|
| Total de regras | **45** | **49** |
| Auditadas pelo Guardiao (MAPEADO) | **29** | **33** |
| Aplicadas por outros componentes (INTEGRADO) | **7** | **8** |
| Estruturais (NAO_APLICAVEL) | **9** | **8** |
| Cegas (NAO_AUDITAVEL) | (nao declarado) | **0** |
| Fora da auditoria do Guardiao | (nao declarado) | **16** |
| Codigos de diagnostico | (nao declarado) | **38** (em 30 regras) |
| Porta de consulta | (nao declarado) | **38 -> 30** |
| Secoes de regras listadas | 29 + 7 + 9 = **45** (listas desatualizadas) | **33 + 8 + 8 = 49** (regeradas do JSON) |

O arquivo passou a ser **gerado por inteiro** (ele mesmo ja se declarava "gerado automaticamente a partir do JSON"); a fechadura compara o arquivo byte a byte com o que o gerador produz.

### 3.2 `Dominio/ARCA/ARCA_REGRAS_DOMINIO.md` - metrica: todas (bloco de metricas)

- ANTES: secao "Metricas de Consolidacao" com bullets digitados a mao ("Total de Regras: 49", "Fontes: ... conflitos=0", "Auditabilidade no Guardiao: MAPEADO=33 | ..."). Os valores estavam certos por sorte de recontagem manual do #160, mas **sem definicao de metrica** e sem qualquer trava contra divergencia.
- DEPOIS: bloco delimitado por `<!-- ARCA-METRICAS:INICIO ... -->`/`<!-- ARCA-METRICAS:FIM -->`, gerado do JSON, com **tabela metrica x definicao x valor**, quebra por tipo e por subdominio, e o sha256 do JSON no proprio marcador. A nota do #160 foi preservada como **regiao historica** declarada (`ARCA-HISTORICO`), que a fechadura reconhece como tal.
- Delta: +78 linhas (bloco derivado) e as 8 metricas nomeadas com definicao explicita.

### 3.3 `Dominio/ARCA/ARCA_COBERTURA.md` - metrica: bloco derivado + `status_cobertura` por subdominio

| Alvo | ANTES | DEPOIS |
|---|---|---|
| Bloco de metricas | inexistente | bloco `ARCA-METRICAS` derivado (mesmo contrato do 3.2) |
| Linha `VEICULOS` da matriz | `NAO_COBERTO` ("nao possui regras de veiculos") | `COBERTO` por `ARCA-VEICULO-001` (subdominio `veiculo`, `status_cobertura = COBERTO` no JSON); a validacao fisica (placa/chassi) fica declarada como **fronteira** |
| Notas historicas (#126 36 regras / #128 40 / #137 41 / #144 42 / #160 49) | soltas no fim do arquivo, lidas como estado atual | movidas para regiao `ARCA-HISTORICO` declarada; **nao** entram na varredura de contagem antiga |

### 3.4 Circuito `CIR-MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO.canvas` - metrica: `regras_total` + por tipo + fontes + porta

| No | ANTES | DEPOIS |
|---|---|---|
| `arca-1` (modulo) | "31 regras: 9 OFFICIAL_BUSINESS, 17 INTERNAL_OPERATIONAL, 1 CANONICAL_NORMATIVE, 2 HEURISTIC, 2 TECHNICAL." (soma 31) | "**49** regras: **10** OFFICIAL_BUSINESS, **31** INTERNAL_OPERATIONAL, **1** CANONICAL_NORMATIVE, **2** HEURISTIC, **5** TECHNICAL." (soma 49) |
| `arca-3` (fontes) | "11 canonicas \| 18 internas \| 2 desconhecidas" | "**12** canonicas \| **35** internas \| **2** desconhecidas" |
| `arca-5` (porta) | "26 codigos -> 20 de 31 regras" | "**38** codigos -> **30** de **49** regras" |
| `arca-metricas` | (no inexistente) | **no novo** com o bloco derivado completo (regras/status/codigos/porta/fontes/subdominios/campos) |

### 3.5 `02_Comodos/C03_Dominio/00_Visao_Do_Comodo/CIR-C03_DOMINIO.canvas`

| ANTES | DEPOIS |
|---|---|
| "Catalogo canonico read-only (31 regras) + porta de consulta" | "Catalogo canonico read-only (**49** regras) + porta de consulta" |

### 3.6 `MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO/NOTA_DE_RESPONSABILIDADE.md`

| ANTES | DEPOIS |
|---|---|
| "Catalogo canonico legivel por maquina (31 regras)" | "(**49** regras)" |
| "Mapeamento: 26 codigos de diagnostico -> 20 das 31 regras." | "Mapeamento: **38** codigos de diagnostico -> **30** das **49** regras." |
| "11 regras sem mapeamento na porta." | "**19** regras sem mapeamento na porta." |
| "#126 cobertura Guardiao<->ARCA (11 regras + lacunas G01)" | "(lacunas G01 do #126; hoje **19** regras fora do mapa de codigos)" |
| "catalogo atual varreu 200 de 1946 arquivos" | "catalogo atual varreu **127** de **3413** arquivos (varredura exaustiva revisada no #159)" |

### 3.7 Submodulos do MOD-C03-02

| Arquivo | ANTES | DEPOIS |
|---|---|---|
| `SUB-C03-02-01/NOTA_DE_RESPONSABILIDADE.md` | "31 regras com 22 campos por regra" | "**49** regras com **23** campos por regra (uniao de campos: **25**)" |
| `SUB-C03-02-01/CIR-SUB-C03-02-01_...canvas` | "31 regras com 22 campos por regra" | "**49** regras com **23** campos por regra (uniao de campos: **25**)" |
| `SUB-C03-02-04/NOTA_DE_RESPONSABILIDADE.md` | "Mapeia 26 codigos -> 20 das 31 regras" | "Mapeia **38** codigos -> **30** das **49** regras" |
| `SUB-C03-02-04/CIR-SUB-C03-02-04_...canvas` | "26 codigos -> 20 das 31 regr..." | "**38** codigos -> **30** das **49** regr..." |

> Nota de medicao nova revelada pelo metodo: o catalogo **nao** tem 22 campos por regra - tem 23 (padrao) e 25 na uniao (`impacto_se_violada` e `auditavel_automaticamente` existem em 1 regra). O "22" era numero digitado.

### 3.8 `Dominio/ARCA/arca_flow.html` (levantamento + fluxo)

| Alvo | ANTES | DEPOIS |
|---|---|---|
| Cabecalho/pills | "45 regras" + pills 29 auditadas / 7 integradas / 9 estruturais / 45 total | "**49** regras" + pills **33 / 8 / 8 / 49** + pill nova de codigos (**38** em 30 regras) e de cegas (**0**) |
| Grid MAPEADO | 29 cards | **33 cards** (regerados do JSON) |
| Grid INTEGRADO | 7 cards | **8 cards** |
| Grid NAO_APLICAVEL | 9 cards | **8 cards** |
| Blocos | HTML estatico (sem marcador) | `ARCA-STATS` + 3 blocos `ARCA-GRID-*` derivados e travados |

### 3.9 Arquivos vivos de outros comodos (varredura "qualquer outro que cite numero")

| Arquivo | ANTES | DEPOIS | Metrica usada |
|---|---|---|---|
| `C01_Entrada/.../AUDITORIA_OCR_ARCA.md` | "LACUNA_ARCA: nao existe regra de veiculo... (40 regras, nenhuma sobre veiculo)" e "(confirmado nas 40 regras de `arca_regras_dominio.json`)" | LACUNA marcada como **da data da auditoria**, fechada por `ARCA-VEICULO-001` (#137/#138); a contagem vigente passa a ser a do bloco derivado | `regras_total` (removida a contagem digitada) |
| `C01_Entrada/.../NOTA_DE_RESPONSABILIDADE.md` | "sem regra correspondente nas 40 regras da ARCA" | "sem regra correspondente na ARCA **na data da auditoria** - lacuna fechada por `ARCA-VEICULO-001`; contagem vigente e a do bloco derivado (#159)" | `regras_total` |
| `C03_Dominio/01_Dominio/INDICE.md` | "#126 (cobertura 11 regras + lacunas G01)" | "#126 (cobertura Guardiao<->ARCA + lacunas G01; contagem vigente derivada do JSON no #159)" | `regras_sem_regra_na_porta` (removida a contagem digitada) |

**Fora do escopo (preservado, com o porque):** evidencias datadas (`EVD-C00-001`, `EVD-C01-002`, `EVD-C03-001`, `EVD-C03-002`) e relatorios de cards anteriores (`RELATORIO_DE_DIFERENCAS_154/156_157/158/160`) sao **registro historico** do estado na data — inclusive uma delas declara isso ("e a contagem no momento do registro"). Foram mantidas intactas e **nao** entram na varredura da fechadura.

### 3.10 Espelho (`Obsidian_Brain/Syntheon`) - "derivar no espelho"

| Espelho | Acao | Resultado |
|---|---|---|
| `07_Codigo_Leitura/Dominio/ARCA/ARCA_REGRAS_DOMINIO.md` | regerado (cabecalho de espelho + conteudo do repo) | espelho deixou de estar 2 versoes atras (tinha 1946/200 arquivos, 28 regras de negocio, etc.) |
| `07_Codigo_Leitura/Dominio/ARCA/ARCA_COBERTURA.md` | regerado idem | idem |
| `02_Comodos/C03_Dominio/00_Visao_Do_Comodo/CIR-C03_DOMINIO.canvas` | copia pura (era byte-identico ao HEAD) | 49 regras |
| `02_Comodos/.../MOD-C03-02.../CIR-MOD-C03-02_...canvas` | copia pura | 49 / 38->30 / no de metricas |
| `02_Comodos/.../SUB-C03-02-01...` (NOTA + canvas) | copia pura | 49 regras / 23-25 campos |
| `02_Comodos/.../SUB-C03-02-04...` (NOTA + canvas) | copia pura | 38 -> 30 das 49 |
| `02_Comodos/C01_Entrada/.../AUDITORIA_OCR_ARCA.md` | copia pura | idem repo |
| `02_Comodos/C05_Guardiao/00_Visao_Do_Comodo/COMODO-C05.canvas` | overlay **so do espelho**: aresta "Consulta Read-Only (26 regras)" | "(38 codigos -> 30 rule_ids)" |
| `02_Comodos/C03_Dominio/01_Dominio/INDICE.md`, `MOD-C03-02.../NOTA_DE_RESPONSABILIDADE.md`, `C01_Entrada/.../NOTA_DE_RESPONSABILIDADE.md` | conteudo proprio do espelho (preservado no #158) - **nao sobrescrito** | verificados por varredura: **nao** carregam contagem de catalogo antiga |

---

## 4. A FECHADURA (`Testes/TestArcaContagemDerivada.js`)

**Como funciona (15 testes):**

1. executa `scripts/downplant/contar-regras-arca.mjs --json` (o script e o unico medidor - o teste nao reimplementa medicao);
2. compara **byte a byte**: (a) o arquivo gerado por inteiro (`INVENTARIO_ARCA.md`), (b) cada bloco entre marcadores `ARCA-*` (`ARCA_REGRAS_DOMINIO.md`, `ARCA_COBERTURA.md`, `arca_flow.html` x4), (c) o no `arca-metricas` do circuito, (d) o snapshot `arca_metricas_derivadas.json`;
3. exige que **todo marcador** carregue o sha256 vigente do JSON (JSON editado sem regerar = VERMELHO);
4. varre os 11 arquivos vivos de catalogo e reprova: (a) totais proibidos (`31/36/40/41/42/45/48 regras`, `9 OFFICIAL_BUSINESS`, `17 INTERNAL_OPERATIONAL`, `11 canonicas`, `18 internas`, `26 codigos`, `20 das 31`, `11 regras sem mapeamento`, `22 campos`, `MAPEADO=29`, `INTEGRADO=7`) fora de regiao historica, e (b) qualquer "N regras" cujo N nao seja um valor publicado pela medicao;
5. exige que cada substituicao dirigida seja **ponto fixo** (reaplicar nao altera o arquivo) e que o valor derivado esteja presente;
6. exige que o catalogo humano declare a **definicao** das 8 metricas (fim do "total ARCA" ambiguo).

**Nascimento VERMELHO (antes de aplicar):**

```
RESULTADOS FINAIS: 1 PASS / 13 FAIL
```
(com o JSON ja medido: INVENTARIO=45 vs 49; bloco do MD ausente/divergente; circuito sem o no derivado; `31 regras` no canvas e nas NOTAs; `40 regras` no C01; etc.)

**Depois de aplicar:**

```
  [PASS] medicao derivada e coerente (somas, unicidade, porta)
  [PASS] Dominio/ARCA/INVENTARIO_ARCA.md e exatamente o que o JSON produz (arquivo gerado por inteiro)
  [PASS] Dominio/ARCA/ARCA_REGRAS_DOMINIO.md :: bloco ARCA-METRICAS bate com o derivado
  [PASS] Dominio/ARCA/ARCA_COBERTURA.md :: bloco ARCA-METRICAS bate com o derivado
  [PASS] Dominio/ARCA/arca_flow.html :: bloco ARCA-STATS bate com o derivado
  [PASS] Dominio/ARCA/arca_flow.html :: bloco ARCA-GRID-MAPEADO bate com o derivado
  [PASS] Dominio/ARCA/arca_flow.html :: bloco ARCA-GRID-INTEGRADO bate com o derivado
  [PASS] Dominio/ARCA/arca_flow.html :: bloco ARCA-GRID-NAO_APLICAVEL bate com o derivado
  [PASS] todo marcador de bloco gerado carrega o sha256 vigente do JSON
  [PASS] circuito CIR-MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO.canvas declara as metricas derivadas no no 'arca-metricas'
  [PASS] snapshot scripts/downplant/arca_metricas_derivadas.json bate com a medicao
  [PASS] os arquivos pontuais carregam o valor DERIVADO (o numero digitado foi substituido)
  [PASS] nenhum artefato vivo carrega contagem de catalogo proibida fora de regiao historica
  [PASS] as substituicoes dirigidas sao idempotentes (reaplicar nao altera o arquivo)
  [PASS] o catalogo humano declara a DEFINICAO de cada metrica (sem "total ARCA" ambiguo)

RESULTADOS FINAIS: 15 PASS / 0 FAIL
TESTE_EXIT=0
```

**Prova de que a fechadura morde:** o teste foi escrito e executado **antes** de qualquer aplicacao (1 PASS / 13 FAIL) e a idempotencia da aplicacao foi medida (dois `--aplicar` seguidos nao alteram os arquivos: `md5sum` identico). O teste entrou na suite (`Testes/RodarTodosOsTestes.js`) logo apos os testes da ARCA.

---

## 5. Suite e lint (saida real)

| Instrumento | Antes (baseline `6a2671a`) | Depois | Delta |
|---|---|---|---|
| `node Testes/RodarTodosOsTestes.js` | 612 PASS / 3 FAIL (exit 1) | **627 PASS / 3 FAIL (exit 1)** | **+15 PASS / +0 FAIL** (exatamente os 15 testes da fechadura) |
| `node scripts/downplant/lint-estrutura.mjs` | exit 0 | **exit 0** | 0 |
| `Testes/TestArcaContagemDerivada.js` | (nao existia) | **15 PASS / 0 FAIL (exit 0)** | +15 |

As **3 falhas sao pre-existentes** e nao foram tocadas por este card (`RendererComparativo2026` legenda e duas de `Armas`: paleta/legenda). Os testes da ARCA que ja existiam seguem verdes: `TestArcaMapaCobertura` **11 PASS / 0 FAIL**, `TestArcaConsumidores` **9 PASS / 0 FAIL**, `TestArcaVeiculoOcr` **10 PASS / 0 FAIL**, `TestArcaNormalizadorEfetivo` **8 PASS / 0 FAIL**, `TestIntegracaoArca` **7/7**.

```
🔍 Verificando Terreno: C:\Users\Bneto04\Documents\Codex\syntheon-gs-downplant-offline
✅ SUCESSO! A arvore documental esta em estrita conformidade com o Down Plant 2.1.
LINT_EXIT=0
```

---

## 6. Arquivos tocados (git status do repo)

**Modificados (14):** `Dominio/ARCA/INVENTARIO_ARCA.md`, `Dominio/ARCA/ARCA_REGRAS_DOMINIO.md`, `Dominio/ARCA/ARCA_COBERTURA.md`, `Dominio/ARCA/arca_flow.html`, `02_Comodos/C03_Dominio/00_Visao_Do_Comodo/CIR-C03_DOMINIO.canvas`, `02_Comodos/C03_Dominio/01_Dominio/INDICE.md`, `.../MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO/CIR-MOD-C03-02_...canvas`, `.../MOD-C03-02.../NOTA_DE_RESPONSABILIDADE.md`, `.../SUB-C03-02-01.../NOTA_DE_RESPONSABILIDADE.md`, `.../SUB-C03-02-01.../CIR-SUB-C03-02-01_...canvas`, `.../SUB-C03-02-04.../NOTA_DE_RESPONSABILIDADE.md`, `.../SUB-C03-02-04.../CIR-SUB-C03-02-04_...canvas`, `02_Comodos/C01_Entrada/.../SUB-C01-01-01_OCR_E_CONFERENCIA/AUDITORIA_OCR_ARCA.md`, `02_Comodos/C01_Entrada/.../SUB-C01-01-01_OCR_E_CONFERENCIA/NOTA_DE_RESPONSABILIDADE.md`, `Testes/RodarTodosOsTestes.js`.

**Novos (3):** `scripts/downplant/contar-regras-arca.mjs`, `scripts/downplant/arca_metricas_derivadas.json`, `Testes/TestArcaContagemDerivada.js`.

**Sem tocar (nao e deste card):** `08_Execucao_Ao_Vivo/downplant_handoff.md` e `RELATORIO_DE_DIFERENCIAS_156_157.md` ja estavam modificados no inicio da execucao; `Testes/TestNormalizadorEfetivo.js`, `Testes/temp_test_telegram/` e `VigiaPonte/conversation_memory.json` ja eram nao rastreados. **Nenhum `.js`/`.html` de produto foi alterado** (o unico `.js` tocado e o executor de testes `Testes/RodarTodosOsTestes.js`, para incluir a fechadura).

---

## 7. Decisoes e limites declarados

1. **Nao foi escolhido um numero**: o gerador nao contem nenhum literal de contagem; ele mede o JSON. Se o JSON mudar, os textos passam a divergir e a fechadura fica vermelha ate `--aplicar`.
2. **Metricas diferentes permanecem diferentes**: total (49), mapeadas (33), integradas (8), nao aplicaveis (8), cegas (0), sem auditoria do Guardiao (16), codigos (38), porta (38 -> 30). O card pediu exatamente isso; nenhuma foi colapsada em um "total ARCA".
3. **A porta de consulta e medida do codigo**, nao da lista declarada no JSON - por isso `porta_codigos/porta_rule_ids` entram no bloco e na trava (mexer no mapa do `AdaptadorConsultaArca.js` sem regerar deixa o teste vermelho; isso e intencional).
4. **Regiao historica e explicita**: notas de card anteriores ficam entre `<!-- ARCA-HISTORICO:INICIO -->`/`FIM` e por isso nao contam como contagem vigente. Nada foi apagado.
5. **Espelho deriva, nao inventa** (D1/#158): 7 copias puras + 2 espelhos de leitura regerados + 1 overlay so-do-espelho corrigido; 3 arquivos com conteudo proprio do espelho foram **preservados** (e verificados sem contagem antiga).
6. **Nao executado (proibido pelo card):** commit, push, `clasp push`, postagem/fechamento no GitHub, criacao de card novo.

---

## 8. RESULT proposto (nao postado)

> Texto integral em `RESULT_PROPOSTO_159.md`. NAO foi postado no GitHub.

[HERMES] RESULT — #159

**Card:** #159 (ARCA-COUNT-001 — Reconciliar contagens da ARCA em JSON, MD, inventario e circuito) · **Pai:** #57 / #154
**Repo canonico:** `syntheon-gs-downplant-offline` (branch `sprint/g01-guardiao-qualidade-live-001`, HEAD `6a2671a`) · **Espelho:** `Obsidian_Brain/Syntheon`
**Regra aplicada:** reconciliacao **por METRICA**, com **numero derivado** do JSON (nunca digitado). Nenhum codigo de produto alterado. Sem commit, sem push, sem `clasp push`, nada postado no GitHub.

**STATUS: CONCLUIDO.** Todas as contagens da ARCA passaram a ser **medidas** de `Dominio/ARCA/arca_regras_dominio.json` por um gerador versionado, e uma **fechadura** de 15 testes impede nova divergencia silenciosa. O total ambiguo nao existe mais: cada numero tem metrica nomeada e definicao explicita.

**Evidencia tipada — antes x depois (medido no disco):**

| Item | Antes | Depois | Delta |
|---|---|---|---|
| `regras_total` no `INVENTARIO_ARCA.md` | 45 | **49** | +4 |
| MAPEADO / INTEGRADO / NAO_APLICAVEL no inventario | 29 / 7 / 9 | **33 / 8 / 8** | +4 / +1 / -1 |
| Circuito `CIR-MOD-C03-02` (regras) | 31 | **49** | +18 |
| Circuito — por tipo | 9/17/1/2/2 | **10/31/1/2/5** | corrigido |
| Circuito — fontes | 11/18/2 | **12/35/2** | corrigido |
| Circuito — porta | 26 codigos -> 20 de 31 | **38 -> 30 de 49** | corrigido |
| `arca_flow.html` — pills | 29/7/9/45 | **33/8/8/49 (+38 codigos, 0 cegas)** | corrigido |
| `arca_flow.html` — cards por status | 29/7/9 | **33/8/8** | corrigido |
| NOTAs/submodulos com contagem digitada | 6 arquivos | **0** | -6 |
| `campos_por_regra` declarado | 22 (errado) | **23 (uniao 25)** | corrigido |
| Arquivos vivos com total proibido | 11 | **0** | -11 |
| `Testes/TestArcaContagemDerivada.js` | nao existia | **15 PASS / 0 FAIL** | +15 |
| Suite integral | 612 PASS / 3 FAIL | **627 PASS / 3 FAIL** | **+15 / +0** |
| Lint estrutural (repo) | exit 0 | **exit 0** | 0 |
| Espelho (arquivos derivados) | 2 espelhos 2 versoes atras + overlay `(26 regras)` | **9 arquivos derivados + 3 preservados** | corrigido |

**As quatro pontas:**

- **CODIGO:** `scripts/downplant/contar-regras-arca.mjs` (medidor/gerador: 25 metricas, saida TEXTO + JSON, `--aplicar`) e `scripts/downplant/arca_metricas_derivadas.json` (snapshot). A porta e medida do proprio `AdaptadorConsultaArca.js` (38 -> 30). **Zero alteracao em `.js`/`.html` de runtime.**
- **DOCUMENTACAO:** `INVENTARIO_ARCA.md` (regerado por inteiro), `ARCA_REGRAS_DOMINIO.md` (bloco derivado com metrica x definicao), `ARCA_COBERTURA.md` (bloco + `VEICULOS` reconciliado ao JSON + historico marcado), `C01/AUDITORIA_OCR_ARCA.md`, `C01 NOTA`, `C03 INDICE`; `Testes/TestArcaContagemDerivada.js` (fechadura) e `Testes/RodarTodosOsTestes.js` (registro). `RELATORIO_DE_DIFERENCIAS_159.md` com antes/depois por arquivo e a metrica usada.
- **CANVAS/PLANTA:** `CIR-MOD-C03-02` (49 regras, tipos 10/31/1/2/5, fontes 12/35/2, porta 38 -> 30, **no novo `arca-metricas`**), `CIR-C03_DOMINIO.canvas` (49), NOTAs/canvases dos SUB-C03-02-01/04 (49 regras, 23-25 campos, 38 -> 30). Espelho: 9 arquivos derivados (2 espelhos de leitura regerados, 7 copias puras) + overlay `COMODO-C05.canvas` (26 -> 38->30) + 3 arquivos proprios do espelho preservados e verificados.
- **GIT:** nada commitado, nada empurrado, nada postado. Diff local: **14 arquivos modificados, 3 novos** (`git status`); os artefatos derivados sao reproduziveis por `node scripts/downplant/contar-regras-arca.mjs --aplicar --espelho`.

**Verificacao independente (comandos):** `node Testes/TestArcaContagemDerivada.js` -> 15 PASS / 0 FAIL; `node Testes/RodarTodosOsTestes.js` -> 627 PASS / 3 FAIL (as 3 falhas sao pre-existentes: `RendererComparativo2026` + 2 de `Armas`); `node scripts/downplant/lint-estrutura.mjs` -> exit 0; aplicar duas vezes nao altera nenhum arquivo (`md5sum` identico).
