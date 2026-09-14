# RELATORIO_162_ENDERECOS — os 7 endereços canônicos órfãos, resolvidos (#162, DP24-001)

> Arquivo na **raiz do repositório** de propósito: ele nomeia caminhos e tokens que a varredura de conteúdo das
> árvores documentais proíbe. A raiz não é varrida. Mesmo precedente de `MAPA_ARTEFATO_ENDERECO_162.md` /
> `RELATORIO_162_ESCALA.md`. **Nada foi commitado, empurrado ou postado** (ordem do Planner).

**Objetivo desta fatia:** levar `07_Codigo_Leitura/` de **7 endereços NÃO RESOLVIDO** para **72/72 com endereço
canônico resolvido**, resolvendo-os na **Planta** (não no espelho), **sem tocar nos 71 espelhos que já estavam
verdes** e **sem alterar código de produto runtime**.

**Branch:** `sprint/g01-guardiao-qualidade-live-001` · **HEAD:** `57c9f597557c68f47db20929054aed1b4e880435`
(`57c9f59`) · **commit de freeze dos 72 espelhos:** `fbb0608e7b98144533628c7f9b773a10505b800d` (`fbb0608`).

---

## 0. Placar antes → depois

| Métrica | Antes desta fatia | Depois |
| :--- | ---: | ---: |
| Espelhos com endereço canônico resolvido | 64 / 71 | **71 / 71** |
| Nós com endereço resolvido (inclui o índice derivado) | 65 / 72 | **72 / 72** |
| `NÃO RESOLVIDO` (artefato sem declaração na Planta) | **7** | **0** |
| Endereços de nível 1 (seção `## Artefatos`) | 40 | **48** |
| Endereços de nível 3 (menção em arquivo do endereço) | 23 | 22 |
| Verificador §46.15 — espelhos afetados | — | **14/14 `exit 0`** (7 repo + 7 vault) |
| Verificador §46.15 — global (71 espelhos, pin `fbb0608`) | 71/71 `exit 0` | **71/71 `exit 0`** |
| Lint estrutural | `exit 0` | **`exit 0`** |
| Suíte integral | 630 PASS / 0 FAIL · `exit 0` | **630–631 PASS / 0 FAIL · `exit 0`** |
| **Espelhos verdes tocados** | — | **0** (só os 7 afetados + o índice derivado) |
| Arquivos de produto runtime alterados | — | **0** |

O marcador de nível 3 cai de 23 para 22 porque `Modelos/ModeloProdutividade.js` subiu para nível 1
(ver §3.2) — **o endereço primário dele não mudou** e o espelho dele **não** foi tocado.

---

## 1. Os 7 — responsabilidade real (medida no código) e endereço canônico derivado

Nenhum endereço foi "adivinhado": cada um resolve por **declaração explícita** na seção `## Artefatos` do
endereço (nível 1 do método), com a linha citada.

| # | Artefato | Responsabilidade real (medida no código) | Endereço canônico derivado (cômodo / módulo) | Evidência do endereço | Nível |
| ---: | :--- | :--- | :--- | :--- | :---: |
| 1 | `Core/Datas.js` | Utilitários de data (namespace `SyntheonDatas` + aliases globais): `converterDataUnificada()` e `formatarDataBR()` | `C00_Governanca_Estrutural / MOD-C00-03_INFRAESTRUTURA_CORE` | `02_Comodos/C00_Governanca_Estrutural/01_Dominio/modulos/MOD-C00-03_INFRAESTRUTURA_CORE/MOD-C00-03_INFRAESTRUTURA_CORE.md`:61 (seção `## Artefatos`) | 1 |
| 2 | `Core/Erros.js` | Classes de erro nomeadas por origem: `ErroValidacaoDominio`, `ErroLeituraAba`, `ErroConfiguracaoInvalida` | `C00_Governanca_Estrutural / MOD-C00-03_INFRAESTRUTURA_CORE` | idem, `:61` | 1 |
| 3 | `Core/Logger.js` | Classe `SyntheonLogger`: estatísticas do fluxo de leitura + avisos; `logAba`, `logAbaDetalhado`, `aviso`, `getTempoExecucaoSegundos`, `gravarPlanilha` | `C00_Governanca_Estrutural / MOD-C00-03_INFRAESTRUTURA_CORE` | idem, `:61` | 1 |
| 4 | `appsscript.json` | Manifesto de ambiente do projeto Apps Script (fuso, `exceptionLogging`, runtime V8, `executionApi MYSELF`) | `C00_Governanca_Estrutural / MOD-C00-03_INFRAESTRUTURA_CORE` | idem, `:61` | 1 |
| 5 | `Modelos/IRelatorioModelo.js` | Interface base dos modelos de relatório da Central Analítica (contrato `obterTitulo`/`obterColunas`/`ordenarDados`/`formatarLinha`) | `C06_Relatorios / MOD-C06-01_RELATORIOS_OFICIAIS` | `02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-01_RELATORIOS_OFICIAIS/MOD-C06-01_RELATORIOS_OFICIAIS.md`:61 (seção `## Artefatos`) | 1 |
| 6 | `Plugins/IPluginMetrica.js` | Contrato base dos plugins de métrica do Motor (`inicializar` / `processar` / `finalizar`) | `C04_Motor / MOD-C04-01_MOTOR_ANALITICO` | `02_Comodos/C04_Motor/01_Dominio/modulos/MOD-C04-01_MOTOR_ANALITICO/MOD-C04-01_MOTOR_ANALITICO.md`:61 (seção `## Artefatos`) | 1 |
| 7 | `Schemas/ProdutividadeSchema.js` | Esquema do relatório de produtividade (`HEADERS`, `getHeaders`, `extrairLinha`, `formatarLinha`) | `C06_Relatorios / MOD-C06-01_RELATORIOS_OFICIAIS` | idem (C06-01), `:61` | 1 |

### 1.1 Medição por artefato (evidência `arquivo:linha`)

**1) `Core/Datas.js`** — 80 linhas, sha256 (LF) `f31ac501cff0de0b368758a564ef1b287d09aa18f643aa51903c09dea8d31de2`.
- `Core/Datas.js:7` — `const SyntheonDatas = {` (namespace encapsulado).
- `Core/Datas.js:14` — `converterDataUnificada(valor)`: aceita `Date` nativo e string brasileira
  `dd/mm/aaaa [hh:mm:ss]`, **rejeita inversão dia/mês** (checagem de ano/mês/dia em `:37-43`), zera o horário e
  devolve `null` para entrada inválida (nunca lança).
- `Core/Datas.js:56` — `formatarDataBR(data)`: `Date` → `dd/mm/aaaa` (vazio se inválido).
- `Core/Datas.js:66-72` — dois **aliases globais** para o código legado do Apps Script.
- `Core/Datas.js:74-79` — `module.exports` (uso sob Node).

**2) `Core/Erros.js`** — 40 linhas, sha256 (LF) `1078e4e66a1138014649f6a546a1b81d75d770e2dce2115c8e579099c65b44ec`.
- `Core/Erros.js:6` — `class ErroValidacaoDominio extends Error` (entidade + campo + mensagem, `:7-13`).
- `Core/Erros.js:16` — `class ErroLeituraAba extends Error` (aba + mensagem, `:17-23`).
- `Core/Erros.js:25` — `class ErroConfiguracaoInvalida extends Error` (chave + mensagem, `:26-32`).
- `Core/Erros.js:34` — `module.exports` com as três classes.

**3) `Core/Logger.js`** — 46 linhas, sha256 (LF) `1309998f2067be50b3f7cff6aa3562e6c0a50847be479b725e08d052ada3af65`.
- `Core/Logger.js:5` — `class SyntheonLogger {`; acumuladores em `:6-18` (abas lidas, linhas lidas/válidas/
  ignoradas, duplicidades, policiais e ocorrências únicas, matrículas não encontradas, avisos).
- `Core/Logger.js:20` — `logAba(nomeAba)` (dedupe por aba).
- `Core/Logger.js:26` — `logAbaDetalhado(...)`: log formatado por aba.
- `Core/Logger.js:32` — `aviso(mensagem)`: acumula e loga **somente se** `CONFIG_SYNTHEON.DEBUG`.
- `Core/Logger.js:39` — `getTempoExecucaoSegundos()`.
- `Core/Logger.js:43` — `gravarPlanilha(...)`: delega a `RendererAuditoria.render(...)` (dependência real de outro
  cômodo, registrada na cápsula).

**4) `appsscript.json`** — 10 linhas, sha256 (LF) `a1bc419a4f9bafa13b43f15e698480549e38af666f4d36b2fb668485e14a4dc6`.
- `appsscript.json:2` — `"timeZone": "America/Sao_Paulo"`.
- `appsscript.json:3-4` — `dependencies` vazio.
- `appsscript.json:5` — `"exceptionLogging": "STACKDRIVER"`.
- `appsscript.json:6` — `"runtimeVersion": "V8"`.
- `appsscript.json:7-9` — `executionApi.access = "MYSELF"` (rota do `clasp run`, não App da Web — mesma leitura do
  `INST-EXEC-001_ENDPOINT_DE_EXECUCAO.md`, cômodo C00).

**5) `Modelos/IRelatorioModelo.js`** — 25 linhas, sha256 (LF) `8533a6bcf83486bf77ca29fd1a3cfd78fa782110dcdc6eea64c2146c3fc67c02`.
- `Modelos/IRelatorioModelo.js:9` — `class IRelatorioModelo {`.
- `:10`, `:14`, `:18`, `:22` — contrato `obterTitulo()`, `obterColunas()`, `ordenarDados(registrosAnaliticos)`,
  `formatarLinha(registroAnalitico)`; cada um lança `"deve ser implementado"` (interface).
- Consumidor medido: `Modelos/ModeloProdutividade.js:7` — `class ModeloProdutividade extends IRelatorioModelo`.

**6) `Plugins/IPluginMetrica.js`** — 41 linhas, sha256 (LF) `cb7c3381e9e5da96facf33fee26d302dbba112d1d1306184796986e6963c7abc`.
- `Plugins/IPluginMetrica.js:6` — `class IPluginMetrica {`.
- `:12` — `inicializar(consolidado)`; `:24` — `processar(fato, pmFato, consolidado, chaveAtuacao, primeiraVezNaOcorrencia)`;
  `:33` — `finalizar(consolidado)` (o ciclo de vida declarado no endereço `C04-01`).
- `:38` — `module.exports = IPluginMetrica`.
- Consumidores: os 5 plugins `Plugins/Metricas/*.js` e o orquestrador `Motor/MotorAnaliticoV2.js` — ambos **já
  declarados** no endereço `C04_Motor / MOD-C04-01_MOTOR_ANALITICO`.

**7) `Schemas/ProdutividadeSchema.js`** — 56 linhas, sha256 (LF) `c1cddb36ca7b57cb8e7144f7cefb4f087005f269e2bc6a49535b79433501aa7b`.
- `Schemas/ProdutividadeSchema.js:5` — `const ProdutividadeSchema = {`.
- `:6-23` — `HEADERS` (16 colunas do relatório de produtividade).
- `:25` — `getHeaders()`; `:32` — `extrairLinha(registro)` (mapeia `RegistroAnalítico` na ordem dos headers);
  `:53` — `formatarLinha(registro)` (alias).
- Consumidor medido: `Modelos/ModeloProdutividade.js:18` (`ProdutividadeSchema.getHeaders()`) e `:22`
  (`ProdutividadeSchema.formatarLinha(...)`).

### 1.2 Por que cada endereço é o **determinístico**

| Artefato | Por que este endereço (e não outro) |
| :--- | :--- |
| `Core/Datas.js`, `Core/Erros.js`, `Core/Logger.js` | São utilitários **transversais de runtime**, sem regra de negócio e sem dono de negócio: nenhum módulo existente os declara (GAP do #158). O único elemento que já os descrevia era o **conteúdo parado** `_SUP_158/…/MOD-C00-01_INFRAESTRUTURA_CORE` (NOTA §4 lista exatamente `Core/{Config,Constantes,Erros,Logger,Utils,Datas}.js`). |
| `appsscript.json` | É o **manifesto de ambiente** (fuso, runtime, logging, execution API). As únicas menções dele na Planta estão **dentro do cômodo C00** (`03_Especificacoes/INSTALACOES_TRANSVERSAIS/INST-EXEC-001_…md`, `05_Evidencias/RELATORIO_DE_DIFERENCIAS_155.md`). Não é artefato de módulo de produto → vai para o módulo de infraestrutura/ambiente (o mesmo que o conteúdo parado já chamava de "Configurações e Ambiente"). |
| `Plugins/IPluginMetrica.js` | O contrato é implementado pelos **5 plugins** `Plugins/Metricas/*.js`, todos já declarados em `C04_Motor / MOD-C04-01_MOTOR_ANALITICO`; a responsabilidade daquele módulo é textualmente "orquestrador de **plugins**" e sua porta é "Motor -> plugins \| ciclo de vida". O próprio cômodo já o listava como artefato em `C04_Motor/00_Visao_Do_Comodo/INDICE.md`:14 e `03_Especificacoes/INDICE.md`:15. Endereçá-lo ao lado das implementações é a leitura direta da Planta. |
| `Modelos/IRelatorioModelo.js`, `Schemas/ProdutividadeSchema.js` | O par interface+schema serve ao modelo `Modelos/ModeloProdutividade.js`, **já endereçado** em `C06_Relatorios / MOD-C06-01_RELATORIOS_OFICIAIS` (o circuito `CIR-MOD-C06-01_…canvas` cita o modelo concreto na cadeia `CompiladorProdutividadeV2 → ModeloProdutividade → RendererLogico → GoogleSheetsDriver`). Endereçar interface e schema no mesmo endereço do modelo concreto mantém a tríade num só dono. |

---

## 2. O que foi materializado (elemento estrutural criado)

**Único elemento novo:** `02_Comodos/C00_Governanca_Estrutural/01_Dominio/modulos/MOD-C00-03_INFRAESTRUTURA_CORE/`

| Arquivo | Papel |
| :--- | :--- |
| `MOD-C00-03_INFRAESTRUTURA_CORE.md` | Cápsula §46.2 completa (responsabilidade, limites, entradas/saídas, portas, conexões, invariantes, regras, tecnologia avaliada, **artefatos**, dependências, erros, observabilidade, testes, evidências, divergências, critérios de verde). A seção `## Artefatos` (linha **61**) declara `Core/Datas.js`, `Core/Erros.js`, `Core/Logger.js` e `appsscript.json`. |
| `NOTA_DE_RESPONSABILIDADE.md` | Stub canônico do módulo (mesmo formato dos módulos irmãos), apontando para a cápsula. É o alvo do link "Endereço Down Plant" dos 4 espelhos. |

**Por que materializar (e por que com ID novo):**
- O conteúdo parado do #158 (`_SUP_158/…/MOD-C00-01_INFRAESTRUTURA_CORE`) **descreve exatamente** esse código —
  não é arquitetura nova inventada, é **conteúdo preservado que ganha endereço canônico** (rota 1 do próprio
  README do `_SUP_158`: "materializar no repo (card novo) um módulo `C00` para a infraestrutura `Core/*`").
- Ele **não pode** manter `MOD-C00-01`: esse ID pertence ao canônico `MOD-C00-01_ESTRUTURA_DO_COFRE`, **assunto
  diferente** (o #158 já havia classificado a renomeação como "atribuição falsa"). O ID determinístico é o
  **próximo livre da sequência do cômodo**: C00 tem `01`, `02` → `MOD-C00-03`.
- Colisão **apenas nominal** declarada: o ID `MOD-C00-03` também é usado no espelho pelo elemento parado
  `MOD-C00-03_CURADOR_OBSIDIAN` (arquivado no #158, **não existe no repositório**). Nada foi renomeado e o
  contêiner `_SUP_158` **não foi alterado**; a divergência está registrada na cápsula e no mapa.
- **Não** foi criado canvas para o módulo (minimalidade) e **não** foi criado submódulo: a resolução de endereço
  exige apenas a declaração em `## Artefatos`, e um submódulo só seria estrutura a mais sem ganho de determinismo.

**O que ficou de fora da seção `## Artefatos` (de propósito):** `Core/Config.js`, `Core/Constantes.js` e
`Core/Utils.js` — que o conteúdo parado também descrevia — **já têm endereço canônico próprio** em outros módulos
(o #158/#162 os endereçou antes desta fatia). Declará-los aqui os tornaria **novos** no nível 1 e mudaria o
endereço **primário** de pelo menos um deles — o que a ordem do Planner proíbe ("resolver somente esses 7").
A cápsula registra esse limite explicitamente (sem citar os caminhos, para que a derivação siga section-scoped).

---

## 3. Mudanças estruturais mínimas na Planta / cápsulas

### 3.1 Lista exata do que mudou na Planta (repositório canônico)

| # | Arquivo | Mudança | Tamanho |
| ---: | :--- | :--- | :--- |
| 1 | `…/modulos/MOD-C00-03_INFRAESTRUTURA_CORE/MOD-C00-03_INFRAESTRUTURA_CORE.md` | **NOVO** (cápsula §46.2) | +6.0 KB |
| 2 | `…/MOD-C00-03_INFRAESTRUTURA_CORE/NOTA_DE_RESPONSABILIDADE.md` | **NOVO** (stub canônico) | +0.6 KB |
| 3 | `…/C04_Motor/…/MOD-C04-01_MOTOR_ANALITICO/MOD-C04-01_MOTOR_ANALITICO.md` | linha 61 de `## Artefatos`: `+ . \`Plugins/IPluginMetrica.js\`` | **1 linha, +0/-0 linhas** |
| 4 | `…/C06_Relatorios/…/MOD-C06-01_RELATORIOS_OFICIAIS/MOD-C06-01_RELATORIOS_OFICIAIS.md` | linha 61 de `## Artefatos`: `+ . \`Modelos/IRelatorioModelo.js\` . \`Modelos/ModeloProdutividade.js\` . \`Schemas/ProdutividadeSchema.js\`` | **1 linha, +0/-0 linhas** |

**Decisão deliberada: as duas cápsulas existentes foram editadas por APENSO na última linha da seção
`## Artefatos`**, sem inserir linha nova. Motivo: o `MAPA_ARTEFATO_ENDERECO_162.md` cita **linha a linha** as
evidências dos outros 40 endereços de nível 1; inserir uma linha deslocaria todas as citações seguintes das
cápsulas C04-01 e C06-01 e invalidaria 20+ evidências já publicadas. O apenso mantém **todos os números de linha
dos 71 espelhos verdes** válidos.

**Espelho no vault:** as mesmas 4 mudanças foram replicadas em
`C:\Users\Bneto04\Documents\Obsidian\Obsidian_Brain\Syntheon\02_Comodos\…`, para que o link "Endereço Down Plant"
dos 7 espelhos derivados resolva **dentro do vault** (navegável no Obsidian).

### 3.2 Um ajuste fora do escopo dos 7 — declarado, sem trocar endereço

`Modelos/ModeloProdutividade.js` foi incluído na mesma linha 61 da cápsula C06-01 para manter a **tríade coerente**
(interface + modelo + schema no mesmo dono) e tornar o endereço dele **nível 1** em vez de nível 3.
- **O endereço primário não mudou**: continua `C06_Relatorios / MOD-C06-01_RELATORIOS_OFICIAIS`
  (`C04_Motor / MOD-C04-01_MOTOR_ANALITICO` segue como concorrente declarado).
- **O espelho dele não foi tocado** (nenhuma linha alterada).
- Se o Planner preferir minimalidade absoluta, basta remover esse único trecho da linha 61 — o resultado dos
  **7** não muda.

---

## 4. Regeração/verificação — **somente os afetados**

### 4.1 Comandos executados (7 espelhos × 2 árvores = 14 arquivos)

```bash
# repo (canônico) — 7x
node scripts/downplant/espelho-rico.mjs gerar \
  --endereco <C00_Governanca_Estrutural/MOD-C00-03_INFRAESTRUTURA_CORE | C04_Motor/MOD-C04-01_MOTOR_ANALITICO | C06_Relatorios/MOD-C06-01_RELATORIOS_OFICIAIS> \
  --origem <artefato> --saida 07_Codigo_Leitura/<artefato>.md \
  --conta-espelhos 07_Codigo_Leitura --commit-ref fbb0608 --divergencia "<declaração de derivação>"

# vault (derivado) — 7x
node scripts/downplant/espelho-rico.mjs gerar --endereco <idem> --origem <artefato> \
  --saida "<VAULT>/07_Codigo_Leitura/<artefato>.md" --vault "<VAULT>" --link-disco absoluto \
  --conta-espelhos "<VAULT>/07_Codigo_Leitura" --commit-ref fbb0608 --divergencia "<idem>"

# índice derivado (repo + vault)
node scripts/downplant/espelho-rico.mjs indice --raiz 07_Codigo_Leitura --saida 07_Codigo_Leitura/INDICE_AS_IS.md --commit-ref fbb0608
node scripts/downplant/espelho-rico.mjs indice --raiz "<VAULT>/07_Codigo_Leitura" --saida "<VAULT>/07_Codigo_Leitura/INDICE_AS_IS.md" --commit-ref fbb0608
```

### 4.2 Resultado da geração — `exit 0` nos 14 (0 achados)

```
REPO  exit=0 :: Core/Datas.js.md                 VAULT exit=0 :: Core/Datas.js.md
REPO  exit=0 :: Core/Erros.js.md                 VAULT exit=0 :: Core/Erros.js.md
REPO  exit=0 :: Core/Logger.js.md                VAULT exit=0 :: Core/Logger.js.md
REPO  exit=0 :: appsscript.json.md               VAULT exit=0 :: appsscript.json.md
REPO  exit=0 :: Modelos/IRelatorioModelo.js.md   VAULT exit=0 :: Modelos/IRelatorioModelo.js.md
REPO  exit=0 :: Schemas/ProdutividadeSchema.js.md VAULT exit=0 :: Schemas/ProdutividadeSchema.js.md
REPO  exit=0 :: Plugins/IPluginMetrica.js.md     VAULT exit=0 :: Plugins/IPluginMetrica.js.md

# cada geração: "achados": 0  /  "detalhe": []
# índice: { "nos": 71, "espelhos": 71, "nao_espelhos": 0, "com_deriva": 0 }  → exit 0 (repo e vault)
```

Os testes mecânicos passaram a ficar **todos OK** (antes os 7 tinham **T1+ T2 como ACHADO**):

```
- OK — T1 endereco existe: NOTA_DE_RESPONSABILIDADE.md do modulo presente
- OK — T2 artefato declarado no endereco: "<artefato>" aparece na Planta
- OK — T3 arquivo presente no commit de referencia (fbb0608:<artefato>)
- OK — T4 conteudo em disco identico ao do commit de referencia (sha256 LF)
- OK — T5 espelho anterior sem deriva de codigo (sha256 do bloco == origem)
- OK — T6 endereco declarado no espelho anterior corresponde ao endereco canonico atual
- OK — T7 sem duplicidade: exatamente 1 espelho de leitura declara "<artefato>" como origem
Veredito mecânico: nenhuma divergência detectada pelos testes acima.
```

### 4.3 Verificação dos afetados (`espelho-rico.mjs verificar`) — 14/14 `exit 0`

```
repo  Core/Datas.js.md exit=0                  vault Core/Datas.js.md exit=0
repo  Core/Erros.js.md exit=0                  vault Core/Erros.js.md exit=0
repo  Core/Logger.js.md exit=0                 vault Core/Logger.js.md exit=0
repo  appsscript.json.md exit=0                vault appsscript.json.md exit=0
repo  Modelos/IRelatorioModelo.js.md exit=0    vault Modelos/IRelatorioModelo.js.md exit=0
repo  Schemas/ProdutividadeSchema.js.md exit=0 vault Schemas/ProdutividadeSchema.js.md exit=0
repo  Plugins/IPluginMetrica.js.md exit=0      vault Plugins/IPluginMetrica.js.md exit=0
```

---

## 5. Verificador global — `exit 0` e **zero** `NÃO RESOLVIDO`

```
VERIFICADOR_GLOBAL_REPO  OK=71 BAD=0      (71 espelhos; o INDICE_AS_IS.md é derivado, não espelho)
VERIFICADOR_GLOBAL_VAULT OK=71 BAD=0
```

```
$ grep -rn "NÃO RESOLVIDO" 07_Codigo_Leitura/          →  (nenhum)
$ grep -rn "NÃO RESOLVIDO" "<VAULT>/07_Codigo_Leitura/" →  (nenhum)
$ find 07_Codigo_Leitura -name '*.md' | wc -l           →  72
```

**Nota metodológica sobre o `--commit-ref` (declarada, não escondida):** o portão de frescor do verificador é
`HEAD começa-com o commit declarado`. Os **72 espelhos declaram o commit de freeze `fbb0608`** — o commit em que
a escala dos 72 foi congelada — e o `HEAD` atual é `57c9f59`, **o próprio commit que os congelou**. Sem o pin, o
portão acusa `commit_velho` em **todos os 71** (medido: `OK=0 BAD=71`), porque o HEAD avançou depois da captura.
Com o pin no commit de freeze (`--commit-ref fbb0608`) — que é o commit declarado dentro dos arquivos — o
resultado é **71/71 `exit 0`**, e os 7 novos espelhos foram gerados **com o mesmo `--commit-ref`**, para que os
72 fiquem **homogêneos**. Nenhum dos 71 foi regerado: eles foram apenas **verificados**.

---

## 6. Lint e suíte integral

```
$ node scripts/downplant/lint-estrutura.mjs
🔍 Verificando Terreno: C:\Users\Bneto04\Documents\Codex\syntheon-gs-downplant-offline
✅ SUCESSO! A arvore documental esta em estrita conformidade com o Down Plant 2.1.
LINT_EXIT=0
```

```
$ node Testes/RodarTodosOsTestes.js   →  SUITE_EXIT=0      (linha de base, ANTES das mudanças)
PASS=630  FAIL=0
✨ TODAS AS SUÍTES FORAM EXECUTADAS COM SUCESSO!
```

```
$ node Testes/RodarTodosOsTestes.js   →  SUITE_EXIT=0      (DEPOIS das mudanças da Planta)
PASS=630  FAIL=0        <- 1a execução (logo após as mudanças estruturais)
PASS=631  FAIL=0        <- 2a execução (execução final, após mapa/relatorio)
✨ TODAS AS SUÍTES FORAM EXECUTADAS COM SUCESSO!
```

**Observação declarada:** `FAIL=0` e `exit 0` em **todas** as execuções; o PASS oscila **630↔631** por causa do
`TestVigiaNaturalLanguage` (Vigia/Ollama) — oscilação **já declarada** no `RESULT_PROPOSTO_162.md` anterior e
atribuída ao card **#172** (fora do escopo, **não tocado**). Nenhum teste relacionado a esta fatia falhou.

---

## 7. Prova de que os 71 espelhos verdes **não foram tocados**

```
$ git status --porcelain -- 07_Codigo_Leitura
 M 07_Codigo_Leitura/Core/Datas.js.md
 M 07_Codigo_Leitura/Core/Erros.js.md
 M 07_Codigo_Leitura/Core/Logger.js.md
 M 07_Codigo_Leitura/INDICE_AS_IS.md          <- índice DERIVADO (regerado)
 M 07_Codigo_Leitura/Modelos/IRelatorioModelo.js.md
 M 07_Codigo_Leitura/Plugins/IPluginMetrica.js.md
 M 07_Codigo_Leitura/Schemas/ProdutividadeSchema.js.md
 M 07_Codigo_Leitura/appsscript.json.md
```

**Exatamente 7 espelhos + o índice derivado.** Os outros **64 espelhos** rastreados não aparecem (0 modificações),
e os 3 pré-existentes **não rastreados** (`CPM – Compilador de Pontuação Mensal.js.md`, `Compilador PIP.js.md`,
`Compilador de Entorpecentes.js.md`) continuam como estavam. Total: 71 espelhos de artefato.

**Nenhum arquivo de produto runtime foi alterado** — `git diff` vazio em `Core/*.js` (exceto os espelhos),
`Modelos/*`, `Plugins/*`, `Schemas/*`, `appsscript.json`, `Features/`, `Entrada/`, `Render/`.

---

## 8. Pendências (o que ficou, e por quê)

| # | Pendência | Causa | Bloqueia o fechamento do #162? |
| ---: | :--- | :--- | :---: |
| 1 | **27 endereços de nível 3** (derivados por menção, não por `## Artefatos`) | falta mover a declaração para a seção `## Artefatos` do endereço — é trabalho de **outros** artefatos, não dos 7 | **Não** (declarado desde a escala; fora da ordem desta fatia) |
| 2 | **3 dos 72 espelhos não estão versionados no Git** (`git ls-files 07_Codigo_Leitura` = 69) | estado **PRÉ-EXISTENTE** a esta fatia (já apareciam como `??` no `git status` inicial). Fechar exige commit — proibido nesta fatia | **Não** (não foi tocado; declarado) |
| 3 | Contêiner `_SUP_158` segue com os demais elementos parados | o contêiner **não foi alterado** (decisão do #158). Restam 10 espelhos citando o ponteiro parado **apenas no bloco histórico** "Ponteiro anterior" — não no campo de endereço | **Não** |
| 4 | Colisão **nominal** de ID `MOD-C00-03` (parado `CURADOR_OBSIDIAN` × novo `INFRAESTRUTURA_CORE`) | o ID canônico é o próximo livre do cômodo; o parado não existe no repo | **Não** (registrado na cápsula e no mapa) |
| 5 | `Modelos/ModeloProdutividade.js` teve o nível de evidência alterado (3 → 1) | coerência da tríade modelo/schema/interface no mesmo dono; **endereço inalterado**, espelho intocado | **Não** (reversível em 1 trecho de linha) |
| 6 | "Portas expostas" segue heurística (não entende `.html`/`.json` semanticamente) | limitação declarada do gerador, não do endereço | **Não** |

---

## 9. RESULT proposto (texto para colagem no card — **não postado**)

```text
[HERMES] RESULT — #162 (7 endereços resolvidos · 72/72)

STATUS: ENTREGUE — os 7 endereços canônicos que estavam NÃO RESOLVIDO foram resolvidos NA PLANTA de forma
        determinística (declaração na seção "## Artefatos" do endereço = nível 1), os espelhos afetados e o
        índice derivado foram regerados, e nada mais foi tocado. Placar: 72/72 nós com endereço resolvido,
        0 NÃO RESOLVIDO. Verificador global 71/71 exit 0 · lint exit 0 · suíte 630–631 PASS / 0 FAIL, exit 0.

EVIDÊNCIA TIPADA
- 02_Comodos/C00_Governanca_Estrutural/01_Dominio/modulos/MOD-C00-03_INFRAESTRUTURA_CORE/MOD-C00-03_INFRAESTRUTURA_CORE.md:61
  (MÓDULO NOVO, materializado do conteúdo parado do #158 _SUP_158/MOD-C00-01_INFRAESTRUTURA_CORE com ID novo
  porque MOD-C00-01 colide com o canônico ESTRUTURA_DO_COFRE; a seção "## Artefatos" declara Core/Datas.js,
  Core/Erros.js, Core/Logger.js e appsscript.json — resolve 4 dos 7) + NOTA_DE_RESPONSABILIDADE.md
- 02_Comodos/C04_Motor/01_Dominio/modulos/MOD-C04-01_MOTOR_ANALITICO/MOD-C04-01_MOTOR_ANALITICO.md:61
  (+ "Plugins/IPluginMetrica.js" na seção "## Artefatos" — 1 linha, 0 linha nova — resolve 1 dos 7)
- 02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-01_RELATORIOS_OFICIAIS/MOD-C06-01_RELATORIOS_OFICIAIS.md:61
  (+ "Modelos/IRelatorioModelo.js", "Modelos/ModeloProdutividade.js", "Schemas/ProdutividadeSchema.js" — 1 linha,
  0 linha nova — resolve 2 dos 7 e sobe o modelo concreto a nível 1 SEM trocar o endereço dele)
- MAPA_ARTEFATO_ENDERECO_162.md (7 linhas antes->depois + resumo 36 OK / 35 concorrentes / 0 NÃO RESOLVIDO)
- RELATORIO_162_ENDERECOS.md (responsabilidade medida de cada um dos 7, mudanças estruturais, comandos e exits,
  prova de não-toque, pendências)
- 07_Codigo_Leitura/{Core/Datas.js.md, Core/Erros.js.md, Core/Logger.js.md, appsscript.json.md,
  Modelos/IRelatorioModelo.js.md, Schemas/ProdutividadeSchema.js.md, Plugins/IPluginMetrica.js.md} + INDICE_AS_IS.md
  (7 espelhos regerados com T1..T7 TODOS OK e 0 achados; índice derivado regerado) — REPO canônico e VAULT derivado

AS QUATRO PONTAS
- CÓDIGO: ZERO arquivo de produto alterado (git diff vazio em Core/*.js, Modelos/, Plugins/, Schemas/,
  appsscript.json, Features/, Entrada/, Render/). O que mudou em 07_Codigo_Leitura/ foram exatamente os 7
  espelhos afetados + o INDICE_AS_IS.md derivado.
- DOCUMENTAÇÃO: os 7 passam a ter endereço de nível 1 com evidência arquivo:linha; cápsula §46.2 nova para o
  módulo de infraestrutura; mapa e relatório com antes/depois; 0 NÃO RESOLVIDO em 07_Codigo_Leitura (repo e vault).
- CANVAS/PLANTA: 1 elemento estrutural novo (MOD-C00-03_INFRAESTRUTURA_CORE) + 1 linha de "## Artefatos" em cada
  uma das 2 cápsulas existentes (C04-01 e C06-01), editadas por APENSO para não deslocar número de linha nenhum;
  nenhum canvas criado ou alterado; nenhum ID existente renomeado; 02_Comodos espelhado no vault.
- GIT: branch sprint/g01-guardiao-qualidade-live-001, HEAD 57c9f597557c68f47db20929054aed1b4e880435 (57c9f59),
  espelhos ancorados no commit de freeze fbb0608. Delta no working tree. Sem commit, sem push, sem card,
  #172 intocado.

OS 71 ESPELHOS VERDES NÃO FORAM TOCADOS — declaração explícita
- Medição: `git status --porcelain -- 07_Codigo_Leitura` lista EXATAMENTE 7 espelhos + o INDICE_AS_IS.md (derivado).
- Os 71 espelhos que já estavam verdes ficaram byte a byte como estavam (0 modificações) e foram apenas
  VERIFICADOS (não regerados): 71/71 exit 0.
- O único ajuste fora do escopo dos 7 é o nível de evidência de Modelos/ModeloProdutividade.js (3 -> 1 na mesma
  cápsula C06-01): o ENDEREÇO PRIMÁRIO não mudou e o espelho dele não foi tocado.

VERIFICAÇÃO (com exit)
- espelho-rico.mjs verificar — afetados: 7/7 exit 0 (repo) + 7/7 exit 0 (vault)
- espelho-rico.mjs verificar — global: 71/71 exit 0 (repo) + 71/71 exit 0 (vault), pin --commit-ref fbb0608
  (sem o pin o portão de frescor acusa commit_velho nos 71, porque o HEAD avançou para o commit que os congelou)
- lint-estrutura.mjs — LINT_EXIT=0
- node Testes/RodarTodosOsTestes.js — SUITE_EXIT=0 · 630 PASS / 0 FAIL

PENDÊNCIAS (com causa) — nenhuma bloqueia este fechamento
1) 27 endereços de nível 3 (por menção) seguem pendentes de mover a declaração para "## Artefatos" — fora dos 7.
2) 3 dos 72 espelhos não estão versionados no Git (69/72 em git ls-files) — estado PRÉ-EXISTENTE; fechar exige
   commit, proibido nesta fatia.
3) Contêiner _SUP_158 não foi alterado; 10 espelhos ainda citam o ponteiro parado apenas como histórico.
4) Colisão apenas nominal do ID MOD-C00-03 com o parado CURADOR_OBSIDIAN — declarada.
5) Modelos/ModeloProdutividade.js: nível 3 -> 1 (endereço inalterado); reversível em 1 trecho de linha.
```
