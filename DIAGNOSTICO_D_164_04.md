# DIAGNÓSTICO — D-164-04 (auditoria isolada)

**Divergência auditada:** `GuardiaoHeadless` grava a coluna AM apesar de o contrato declarar que **não**
altera dados operacionais.
**Card de origem:** #164 (`DP24-003`) — em REVIEW · **pai** #57 · **método** v2.4
**Natureza desta peça:** diagnóstico isolado (**nada foi corrigido**). Nenhum arquivo de produto, nenhuma
planilha, nenhum documento pré-existente foi alterado; nenhum commit, push, postagem ou `clasp push`.
**Regra durar respeitada nesta auditoria:** contrato declarado separado de comportamento medido; causa provada
por leitura de código **e** por execução; nenhuma causa inventada.

---

## 0. Cenário congelado (antes de qualquer conclusão)

| Item | Valor medido |
|---|---|
| Repositório | `C:\Users\Bneto04\Documents\Codex\syntheon-gs-downplant-offline` |
| Branch | `sprint/g01-guardiao-qualidade-live-001` |
| HEAD | `f745034d52bb36366d572f66c5c01c08c0d2d0b5` (`f745034`) |
| `git status --short` no início | `M 02_Comodos/C01_Entrada/.../SUB-C01-01-01_OCR_E_CONFERENCIA/NOTA_DE_RESPONSABILIDADE.md` · `M RELATORIO_DE_DIFERENCIAS_156_157.md` · `?? Testes/TestNormalizadorEfetivo.js` — **pré-existentes, não são desta auditoria** |
| `git status --short` no fim | os 3 acima **+** o criado por esta auditoria (`?? DIAGNOSTICO_D_164_04.md`) **+** `M VigiaPonte/conversation_memory.json` e `?? Testes/temp_test_telegram/`, que **surgiram durante a sessão** por processo de fundo do Vigia/bridge (o `RELATORIO_164.md` §11 já os lista como "NÃO são deste card") — não foram tocados por esta auditoria |
| Arquivos criados por esta auditoria | **1** — este `DIAGNOSTICO_D_164_04.md` (raiz) |
| Baselines executados (saída real) | `node Testes/RodarTodosOsTestes.js` → **exit 0** · somatório dos 25 blocos `RESULTADOS FINAIS` = **303 PASS / 0 FAIL** · última linha `TODAS AS SUÍTES FORAM EXECUTADAS COM SUCESSO` <br> `node Testes/TestGuardiao.js` → **exit 0** (60 testes) <br> `node Testes/TestGuardiaoHeadless.js` → **exit 0** (9 PASS / 0 FAIL) <br> `node scripts/downplant/lint-estrutura.mjs .` → **exit 0** |
| Planilha / `clasp` | **não tocados** (a escrita é demonstrável offline — ver §3) |

---

## 1. O contrato declarado — onde está escrito "não altera dados operacionais" e a que se refere

### 1.1 A frase literal (é um **docblock de arquivo**, não uma Porta nem um INST)

`Features/GuardiaoHeadless.js:10-12` (verbatim, o trecho que a divergência cita como `:11`):

```
 * Escopo: leitura/diagnostico + os mesmos efeitos do fluxo oficial (auditarMeses renderiza
 * [AUDITORIA] Ocorrencias e [HISTORICO] Auditoria Ocorrencias). NAO abre dialogo, NAO altera
 * dados operacionais e NAO substitui a selecao do operador.
```

**A que ela se refere (medido, não suposto):**
- **Não é Porta.** A Porta que descreve esta entrada é `PORTA-C05-01-P05_GUARDIAO_HEADLESS.md` (criada pelo
  próprio #164) e ela declara o **oposto**: `:22` "os mesmos efeitos do fluxo de UI sao produzidos — e por
  isso esta Porta **tambem** escreve a coluna AM da aba auditada" e `:46` (Efeitos) "abas de auditoria/historico
  + coluna AM da aba auditada".
- **Não é Instalação transversal.** O único `INST-*` do cofre é
  `INST-EXEC-001_ENDPOINT_DE_EXECUCAO.md:5` → `Estado: **RETIRADO — remoção proposta, NÃO instalado**`, e ele
  descreve o endpoint Web App (`Entrada/WebAppExecucao.js`), não o Guardião. Não há INST vigente para referir.
- **Não é cápsula.** A cápsula do Módulo dono declara o efeito (ver 1.3).
- **É o escopo declarado do arquivo de entrada headless** — a "prova headless" (`clasp run`), só isso.

### 1.2 O mesmo predicado, no contrato de domínio — e a definição operacional do termo

`02_Comodos/C05_Guardiao/01_Dominio/modulos/MOD-C05-01_GUARDIAO_DE_QUALIDADE/MOD-C05-01_GUARDIAO_DE_QUALIDADE.md:14-16`
(verbatim):

```
## Limites
- **Nao altera dado operacional** - nem colunas A:AL, nem formula: somente leitura + escrita nas abas de auditoria
  e no destaque da coluna **AM** (39).
```

**Este é o ponto decisivo:** a cápsula usa exatamente o mesmo predicado ("não altera dado operacional") e, **na
mesma frase**, define o que ele exclui (`nem colunas A:AL, nem formula`) e o que ele **licencia** (escrita nas
abas de auditoria **e** na coluna AM). O termo não é aberto: está ancorado em colunas.

### 1.3 O efeito declarado (o Guardião escrever a AM é contrato, não acidente)

| Onde | Trecho verbatim |
|---|---|
| `MOD-C05-01_GUARDIAO_DE_QUALIDADE.md:34` | `| Guardiao -> coluna AM | escrita | alerta em `AM` (39) com **A:AL preservadas** |` |
| `MOD-C05-01_GUARDIAO_DE_QUALIDADE.md:43` | `1. **A:AL intocaveis** - nenhuma formula, cor, borda ou zebrado de A:AL pode mudar.` |
| `MOD-C05-01_GUARDIAO_DE_QUALIDADE.md:26-27` | `Saidas` … `abas de auditoria e historico . destaques na coluna **AM** . resumo consolidado para a porta headless.` |
| `02_Comodos/C05_Guardiao/03_Especificacoes/INDICE.md:14` | `1. **NÃ£o IntervenÃ§Ã£o Silenciosa:** O GuardiÃ£o **nunca** altera, corrige, apaga, preenche ou substitui dados operacionais automaticamente.` |
| `02_Comodos/C05_Guardiao/03_Especificacoes/INDICE.md:18` | `5. **PreservaÃ§Ã£o de Coluna AM:** Nenhuma nova coluna operacional Ã© criada. A coluna AM continua sendo `Alerta Integridade`.` |
| `02_Comodos/C05_Guardiao/03_Especificacoes/INDICE.md:56` | `… | SaÃ­das / Destino | Coluna AM (`Alerta Integridade`), Abas de auditoria | …` |
| `02_Comodos/C05_Guardiao/03_Especificacoes/INDICE.md:64-66` | `1. **Coluna `AM` (`Alerta Integridade`)**:` / `- **Formato:** Resumo por linha contendo texto explicativo (ou limpo em linhas sem alerta).` / `- **Efeito:** Nunca insere validaÃ§Ãµes de dados restritivas; apenas escreve strings de alerta.` |
| `02_Comodos/C05_Guardiao/04_Execucao/INDICE.md:18` | `- Escrever apenas texto curto sanitizado na coluna AM.` |
| `02_Comodos/C05_Guardiao/04_Execucao/INDICE.md:74` | `1. **Leitura Passiva e NÃƒÂ£o IntervenÃƒÂ§ÃƒÂ£o:** O GuardiÃƒÂ£o observa, registra diagnÃƒÂ³sticos em `[AUDITORIA] Ocorrencias`, acumula histÃƒÂ³rico em `[HISTORICO] Auditoria Ocorrencias` e escreve resumos curtos na coluna AM. Ele jamais altera cÃƒÂ©lulas de dados ou fÃƒÂ³rmulas.` |
| `02_Comodos/C05_Guardiao/00_Visao_Do_Comodo/INDICE.md:30-33` | `### Passo 3: ValidaÃ§Ã£o da Coluna AM (`Alerta Integridade`)` … `Linhas com inconformidades devem exibir resumos curtos em texto` |
| `02_Comodos/C05_Guardiao/01_Dominio/modulos/MOD-C05-02_NORMALIZADOR_DE_ABA/NOTA_DE_RESPONSABILIDADE.md:16` | `- Nao cria colunas operacionais novas (A:AL preservadas; AM segue "Alerta Integridade").` |

> Nota de fidelidade: os arquivos de C05 acima estão gravados com **mojibake** (dupla codificação) — os trechos
> foram transcritos **byte a byte** como estão no disco, não "arrumados".

### 1.4 O contrato de mutação dá a definição canônica de "dado" (e reserva AM para o Guardião)

`Core/ContratoMutacaoSegura.js:58-61` (verbatim):

```
  /** Janela operacional das abas mensais: A:AL sao dados; AM e a coluna de alerta do Guardiao. */
  static JANELA_OPERACIONAL() {
    return { primeira_coluna: 'A', ultima_coluna: 'AL', coluna_alerta: 'AM' };
  }
```

e `Core/ContratoMutacaoSegura.js:262-263` (validação do plano):

```
    if (ehLetraDeColuna && col > janela.ultima_coluna) b.push('FORA_DA_JANELA_OPERACIONAL');
    if (ehLetraDeColuna && col === janela.coluna_alerta) b.push('PROIBIDO_ALTERAR_COLUNA_DE_ALERTA');
```

### 1.5 A doutrina (detecta ≠ corrige) — onde está escrita

| Onde | Trecho verbatim |
|---|---|
| `Core/SaudeTuneis.js:25` | `* Regra do produto mantida: o Guardiao NAO corrige dados; detecta, explica e localiza.` |
| `Entrada/SeletorMesesGuardiao.js:9` | `* Regra do produto: o Guardiao NAO corrige dados. Detecta, explica e localiza.` |
| `Core/RegrasQualidade.js:477-478` | `* Emite DOIS diagnosticos, sem corrigir o dado (Regra do Guardiao: detecta, explica e aponta;` / `* quem muta e o Normalizador sob CONFIRM_AUTO/dry-run):` |
| `Dominio/ARCA/arca_regras_dominio.json:2973` | `"OBSERVACAO": "… A correção do dado é do MOD-C05-02 (Normalizador) sob CONFIRM_AUTO/dry-run; o Guardião só detecta, explica e aponta."` |
| `RELATORIO_DE_DIFERENCIAS_160.md:7` | `**Regra dura respeitada:** **zero mutacao de dado**. O Guardiao apenas **detecta, explica e aponta**` |

**Leitura do lado-contato:** todas as formulações da doutrina são sobre **corrigir o dado** ("dados
operacionais", "células de dados ou fórmulas", "A:AL"), não sobre **publicar o diagnóstico na coluna
derivada**. A escrita da AM é, em todos os artefatos de contrato, a **saída** declarada do Guardião.

---

## 2. O comportamento medido — onde e como o `GuardiaoHeadless` grava a AM

### 2.1 Cadeia exata (todas as linhas medidas no HEAD `f745034`)

| # | `arquivo:linha` | O que faz |
|---|---|---|
| 1 | `Features/GuardiaoHeadless.js:55` | `executar(selecaoTexto, deps)` — corpo da porta headless |
| 2 | `Features/GuardiaoHeadless.js:75` | `const consolidado = modulo.auditarMeses(sel, ss);` ← **a chamada que dispara o efeito** |
| 3 | `Entrada/SeletorMesesGuardiao.js:208` | `static auditarMeses(selecao, ss, motor)` |
| 4 | `Entrada/SeletorMesesGuardiao.js:224` | `const r = motorReal.varrerAba(alvo.sheet);` |
| 5 | `Features/GuardiaoQualidade.js:78` | `static varrerAba(sheet, fontePeculioExterna = null)` — função que grava |
| 6 | `Features/GuardiaoQualidade.js:195` | `alerta: loc('ALERTA_INTEGRIDADE')` — resolve a coluna por cabeçalho |
| 7 | `Features/GuardiaoQualidade.js:199-201` | **cria o cabeçalho quando ausente:** `if (idx.alerta === -1) { idx.alerta = 38; // Coluna AM (0-based: 38)` + `sheet.getRange(1, idx.alerta + 1).setValue('Alerta Integridade'); }` |
| 8 | `Features/GuardiaoQualidade.js:640-645` | monta a saída por linha: `saida = alertasPorLinha.map(...)` → `[textos.join(' \| ')]` (textos deduplicados) |
| 9 | `Features/GuardiaoQualidade.js:647` | `RendererAuditoriaSaude.prepararColunaAlertas(sheet, idx.alerta, saida.length);` |
| 10 | **`Features/GuardiaoQualidade.js:648`** | **A ESCRITA:** `sheet.getRange(2, idx.alerta + 1, saida.length, 1).setValues(saida);` |
| 11 | `Features/GuardiaoQualidade.js:651` | `RendererAuditoriaSaude.aplicarDestaquesAlertasAM_(sheet, idx.alerta, saida);` → formatação de AM (`Render/RendererAuditoriaSaude.js:348-390`) |
| 12 | `Render/RendererAuditoriaSaude.js:392-411` | `prepararColunaAlertas`: grava `'Alerta Integridade'` em `(1, coluna)` (`:394-396`), calcula `totalLinhasDados = max(linhasDados, getLastRow()-1)` (`:402-406`) e faz `clearContent()` + `clearDataValidations()` em `(2, coluna, totalLinhasDados, 1)` (`:408-410`) |

### 2.2 Respostas pontuais exigidas

- **A escrita:** `Features/GuardiaoQualidade.js:648` (`setValues`) — a linha que a divergência procura. Cabeçalho:
  `:201` e `Render/RendererAuditoriaSaude.js:396`, ambos `setValue('Alerta Integridade')`.
- **A função:** `GuardiaoQualidade.varrerAba` (`Features/GuardiaoQualidade.js:78`). **Não** existe função
  separada de "escrever AM": a saída do diagnóstico é publicada na própria varredura.
- **Condição de disparo:** qualquer execução com **seleção válida** (`TODOS` ou nomes válidos) sobre ≥ 1 aba
  mensal. **Não depende de opção nem de flag:** `grep -ni "dryrun|dry_run|somenteLeitura|readOnly|apenasLeitura"`
  em `GuardiaoHeadless.js` + `GuardiaoQualidade.js` + `SeletorMesesGuardiao.js` + `RendererAuditoriaSaude.js` =
  **0 ocorrências**; não há parâmetro booleano nem modo somente-leitura. Os únicos desfechos que **não** geram
  efeito são os curtos-circuitos declarados: `NAO_AUDITAVEL` (`:61-63`), `CANCELADO` (`:69`),
  `SELECAO_INVALIDA` (`:70-73`).
- **Valor gravado:** por linha de dados, `[diagnósticos deduplicados e unidos por ' | ']` — string; **`''`
  (vazia) quando não há alerta** (`:640-645`). Cabeçalho: `'Alerta Integridade'`. Formatação por linha: fundo
  `#FFF3CD` + fonte `#856404` + negrito com alerta; `null/null/normal` sem alerta
  (`Render/RendererAuditoriaSaude.js:371-385`).
- **Roda no caminho headless normal?** **SIM — é o único caminho.** `executarGuardiaoHeadless`
  (`Features/GuardiaoHeadless.js:102-111`) chama `GuardiaoHeadless.executar` com `obterSS =
  obterSpreadsheetOcorrencias_` e `modulo = SeletorMesesGuardiao`; não há ramo alternativo.
- **A AM é a única célula da aba mensal que o Guardião toca?** Sim, medido: em
  `Features/GuardiaoQualidade.js` há **exatamente 2** escritas de valor — `:201` e `:648`, ambas em
  `idx.alerta + 1`. Grep de `setValue|setValues|clearContent|setFormula|deleteRow|insertRow|setNote` no arquivo
  devolve só essas duas.
- **Quem escreve AM no cofre?** `grep -rln "Alerta Integridade|ALERTA_INTEGRIDADE|idx.alerta" --include=*.js`
  (fora de `07_Codigo_Leitura` e espelhos) = `Core/Constantes.js` (alias), `Features/GuardiaoQualidade.js`,
  `Render/RendererAuditoriaSaude.js`, `Testes/TestGuardiao.js`. **O Normalizador (`Features/CorretorQualidade.js`)
  não escreve AM** (0 escritas de valor no arquivo).

---

## 3. A reprodução (comando exato, resultado bruto)

**Não foi preciso tocar na planilha:** a escrita é reproduzível offline com a cadeia **real**, o mesmo padrão
de mock já usado em `Testes/TestGuardiao.js` (`criarMockSheet` + `obterSaidaColunaAM`), adaptado para
**registrar toda escrita** (aba de destino + A1 + operação + valores).

- **Script (fora do repositório, para não poluir o `git status`):**
  `C:\Users\Bneto04\AppData\Local\Temp\d16404_repro.js`
- **Comando:** `node "C:/Users/Bneto04/AppData/Local/Temp/d16404_repro.js"`
- **O que ele carrega (real, não fake):** `Core/Utils`, `Core/Constantes`, `Core/RegrasQualidade`,
  `Render/RendererAuditoriaSaude`, `Features/GuardiaoQualidade`, `Entrada/SeletorMesesGuardiao` e
  `Features/GuardiaoHeadless`; chama a **mesma** `executarGuardiaoHeadless` (via `GuardiaoHeadless.executar`)
  com `{ obterSS, modulo: SeletorMesesGuardiao }`.

Resultado bruto (exit 0):

```
=== CENARIO 1 — 38 colunas A:AL, SEM cabecalho AM (fallback idx.alerta = 38 -> coluna 39 = AM) ===
status headless (JSON): OK | resumo: [{"aba":"AGO2026","status":"OK","tuneis":1,"linhas":2,"alertas":2}]
colunas da aba mensal: 38 | idx ALERTA INTEGRIDADE (0-based): -1 | coluna de alerta efetiva: AM1
ESCRITAS NA ABA MENSAL (10):
   - setValue AM1 => "Alerta Integridade"
   - clearDataValidations AM1
   - setValue AM1 => "Alerta Integridade"
   - clearContent AM2:AM3
   - clearDataValidations AM2:AM3
   - setValues AM2:AM3 => [["Aba \"Tabela PIP\" não encontrada no arquivo. Auditoria de indicadores operando em modo limitado. | Ocorrencia orfa: linha com participacao/evento sem MIKE."],["Túnel com policiais alocados, mas sem nenhum fato físico ou indicador PIP correspondente."]]
   - setBackground AM2
   - setFontColor AM2
   - setBackground AM3
   - setFontColor AM3
escritas na aba mensal FORA da coluna de alerta: 0 (nenhuma)
abas de apoio criadas/escritas: [AUDITORIA] Ocorrencias | [HISTORICO] Auditoria Ocorrencias
aba mensal mutada (matriz antes != depois)? true

=== CENARIO 2 — 39 colunas, cabecalho "ALERTA INTEGRIDADE" presente (coluna 39 = AM) ===
status headless (JSON): OK | resumo: [{"aba":"AGO2026","status":"OK","tuneis":1,"linhas":2,"alertas":2}]
colunas da aba mensal: 39 | idx ALERTA INTEGRIDADE (0-based): 38 | coluna de alerta efetiva: AM1
ESCRITAS NA ABA MENSAL (9):
   - clearDataValidations AM1
   - setValue AM1 => "Alerta Integridade"
   - clearContent AM2:AM3
   - clearDataValidations AM2:AM3
   - setValues AM2:AM3 => [[…],[…]]
   - setBackground AM2 / setFontColor AM2 / setBackground AM3 / setFontColor AM3
escritas na aba mensal FORA da coluna de alerta: 0 (nenhuma)

=== CENARIO 4 — cabecalhos obrigatorios AUSENTES (auditoria aborta com ERRO_TECNICO) ===
status headless (JSON): OK | resumo: [{"aba":"AGO2026","status":"ERRO","mensagem":"Cabeçalhos obrigatórios não encontrados: OCORRENCIA PIP, IMPUTADO?"}]
ESCRITAS NA ABA MENSAL (1):
   - setValue AM1 => "Alerta Integridade"
aba mensal mutada (matriz antes != depois)? true

=== CENARIO 3 (controle negativo) — selecao invalida ===
status: SELECAO_INVALIDA | escritas na aba mensal: 0
```

**O que a reprodução prova:**
1. O caminho headless normal (sem flag) **grava a coluna de alerta** — valores, cabeçalho e formatação
   (Cenários 1 e 2). Os writes `AM1`/`AM2:AM3` no cenário 1 e 2 batem **exatamente** com
   `Features/GuardiaoQualidade.js:648` + `RendererAuditoriaSaude.js:394-410`.
2. **Nenhuma** escrita cai fora da coluna de alerta (0 em ambos os cenários) — A:AL preservadas, como o contrato
   exige.
3. O efeito **não é condicional**: idêntico com e sem o cabeçalho AM.
4. Controle negativo: `SELECAO_INVALIDA` → **0** escritas (o curto-circuito de `:70-73` é real).
5. **Achado novo (D-164-04b):** quando a auditoria **aborta** com `ERRO_TECNICO` por cabeçalhos obrigatórios
   ausentes, o cabeçalho da AM **já foi gravado** — a criação (`:199-201`) acontece **antes** de
   `RegrasQualidade.validarCabecalhosObrigatorios(idx)` (`:204`, que lança em `Core/RegrasQualidade.js:720-724`).
   Ou seja: existe mutação em execução que falha.

**Sobre produção:** não executei `clasp run` nem abri planilha (proibido nesta fatia). Há, porém, evidência
registrada de que a rota headless **já rodou contra a planilha viva**:
`agentic/state/RESULT_CORRECAO_145_146_148_CLASP.md:29` →
`- \`clasp run executarGuardiaoHeadless -p '["SET2026"]'\` → \`status OK\`, **12 túneis, 213 linhas, 33 alertas**.`
(espelhado em `INST-EXEC-001_ENDPOINT_DE_EXECUCAO.md:124`). Como é a mesma cadeia de código e não há flag, a
gravação da AM da aba SET2026 (cabeçalho + 33 linhas com alerta) é a consequência direta dessa execução — o
Planner pode confirmar na planilha sem rodar nada (basta olhar AM1 e a coluna AM de SET2026). **Não afirmei
ter lido a planilha.**

---

## 4. Impacto

### 4.1 Quais linhas/células estão em risco

- **Coluna de alerta da aba mensal auditada** — `AM` (índice 0-based 38 ⇒ coluna 39) quando o cabeçalho
  `ALERTA INTEGRIDADE` está presente; a mesma coluna por fallback fixo (`idx.alerta = 38`) quando ausente
  (`Features/GuardiaoQualidade.js:200`).
- **Linha 1** (`AM1`): o cabeçalho é **sobrescrito** com `'Alerta Integridade'` em toda execução
  (`Features/GuardiaoQualidade.js:201` e `Render/RendererAuditoriaSaude.js:396`).
- **Linhas 2..N**, com `N = max(saida.length, sheet.getLastRow() - 1)`: `clearContent()` + `clearDataValidations()`
  e depois `setValues(saida)` (`RendererAuditoriaSaude.js:402-410`, `GuardiaoQualidade.js:648`). Na prática, **toda
  a coluna AM a partir da linha 2** — inclusive linhas abaixo do recorte atual, se a coluna tiver conteúdo órfão.
  Como `saida.length` = `lastRow - 1`, a janela limpa é igual à janela escrita (não há órfãos dentro da mesma aba).
- **A:AL: nada.** Medido (0 escritas fora da coluna de alerta nos 3 cenários com efeito) e por grep (2 únicas
  escritas de valor no motor, ambas na coluna de alerta).

### 4.2 A escrita é reversível?

- **Sim, por natureza:** AM é coluna derivada de texto, não dado de ocorrência —
  `Core/ContratoMutacaoSegura.js:58` ("A:AL sao dados; AM e a coluna de alerta do Guardiao") e
  `PORTA-C05-01-P03_COLUNA_ALERTA_AM.md:34` (operacao_atomica: "substituicao de **uma** coluna derivada em bloco
  unico (`Features/GuardiaoQualidade.js:648`)… dado derivado, regeneravel por nova auditoria").
- **Não há rollback/undo automático:** a única recuperação é **reauditar** (a própria coluna é a saída). Conteúdo
  manual eventualmente digitado na AM por um operador seria perdido — não há trava de conteúdo nem validação de
  dados (`RendererAuditoriaSaude.js:395,410` limpam `dataValidations`).
- **Risco específico da ordem (D-164-04b):** auditoria que falha deixa `AM1 = 'Alerta Integridade'` criado; é
  reversível mas é mutação com desfecho "ERRO".

### 4.3 Pode colidir com a fórmula/coluna já existente?

- **No layout canônico, não.** AM é a 39ª coluna, fora de A:AL (38), contém strings, e o contrato proíbe
  explicitamente que outro módulo a escreva (`Core/ContratoMutacaoSegura.js:263`
  `PROIBIDO_ALTERAR_COLUNA_DE_ALERTA`) — ou seja, o desenho **reserva** a AM para o Guardião; não é colisão, é
  posse declarada. O cabeçalho só é criado quando **ausente** (`:199-201`).
- **Hazard residual, declarado e não provado como vivo:** a coluna-alvo é resolvida por **alias com match
  parcial** — `Core/Constantes.js:61` `ALERTA_INTEGRIDADE: ['ALERTA INTEGRIDADE', 'ALERTA', 'OBSERVADOR']`
  combinado com `Core/Utils.js:70-73` / `Core/Cabecalhos.js:77-82` (`h.includes(opcao)`). Se, numa aba real, o
  cabeçalho da AM estiver ausente/renomeado **e** existir em A:AL alguma coluna cujo cabeçalho contenha
  `ALERTA`, o Guardião gravaria `'Alerta Integridade'` no cabeçalho **dessa** coluna e **limparia o conteúdo**
  dela (`RendererAuditoriaSaude.js:394-410`) — aí sim, dado operacional. Não encontrei inventário canônico dos
  38 cabeçalhos A:AL no repositório para adjudicar (o `RELATORIO_DE_DIFERENCAS_154.md:121` fala em "37 colunas
  A..AK"), e a lista de colunas permitidas do C01
  (`NOTA_DE_RESPONSABILIDADE.md:365`: ORD, DATA, …, POLICIAL, QDT ARMAS, OCORRÊNCIA PIP, IMPUTADO?) **não**
  contém `ALERTA`. Fica como **hazard de robustez a decidir**, não como contradição.
- **Segundo hazard do mesmo tipo:** o fallback `idx.alerta = 38` (`:200`) é uma posiçãoFixada; numa aba fora do
  layout canônico (mais/menos colunas) a escrita cai no que estiver na 39ª coluna.

### 4.4 Fere a doutrina do Guardião (detecta ≠ corrige)?

- **Não, sob a leitura canônica.** A doutrina é sobre **corrigir o dado** (`Core/SaudeTuneis.js:25`,
  `Core/RegrasQualidade.js:477-478`, `arca_regras_dominio.json:2973`); a coluna AM é a **saída de diagnóstico**
  (cápsula `:26-27,34`, specs `:56,64-66`, execução `:18,74`) e o contrato de mutação a define como *não-dado*
  (`ContratoMutacaoSegura.js:58-61`). "Detecta, explica e aponta" **exige** um canal de publicação; o canal é
  declarado, é a AM, e não há outro.
- **Atrito real, e é aqui que a divergência nasce:** o docblock de `Features/GuardiaoHeadless.js:10-11`
  enumera os efeitos do fluxo oficial **e omite a coluna AM** — quem lê só o arquivo headless conclui o
  contrário do contrato. E `Testes/TestGuardiao.js:719-722` mostra que o próprio repositório chama de "dados
  operacionais" as colunas A:P enquanto, **no mesmo teste**, afirma a escrita da AM (`:707-711`) — ou seja, a
  expressão tem sentido técnico estável no cofre, e o #164 a leu fora desse sentido.

### 4.5 Fere o `Core/ContratoMutacaoSegura.js`?

- **Não — é fora do escopo dele, e o contrato reforça a posse.** O contrato rege o **Normalizador**
  (`MOD-C05-02`, card #118): whitelist `{RESTAURAR_FORMULA, CORRIGIR_CABECALHO, AJUSTAR_FORMATACAO}`
  (`:37-44`), blacklist dura de campos operacionais (`:50-56`), janela `A:AL` com **AM proibida** (`:258-263`).
  O Guardião **não consome** esse contrato (0 referências em `Features/GuardiaoQualidade.js`) e o Normalizador
  **não escreve AM** (0 escritas de valor em `Features/CorretorQualidade.js`). Logo: não há violação; há
  **assimetria de governança** — a coluna AM tem dono declarado (o Guardião) e não é governada por nenhum
  contrato de mutação próprio.

---

## 5. Classificação com prova

> **PARCIAL** — o **comportamento** é REAL e medido; a **contradição contratual**, como relatada, é **REFUTADA**;
> resta um defeito documental REAL e estreito (a enumeração de efeitos no cabeçalho do arquivo headless) e um
> achado novo (D-164-04b).

| Metade | Veredito | Prova |
|---|---|---|
| `GuardiaoHeadless` grava a coluna AM (cabeçalho, valores, destaque) no caminho headless normal, sem flag | **REAL (medido)** | §2 + §3 (Cenários 1-2): `Features/GuardiaoQualidade.js:648`, `:199-201`, `:651`; `Render/RendererAuditoriaSaude.js:392-411`; execução real com 9-10 escritas, todas na coluna de alerta |
| Isso **contraria** o contrato ("não altera dados operacionais") | **REFUTADA** | `MOD-C05-01_GUARDIAO_DE_QUALIDADE.md:14-16` define o predicado e **licencia** a AM na mesma frase; `Core/ContratoMutacaoSegura.js:58-61` define "A:AL sao dados; AM e a coluna de alerta do Guardiao"; `:263` proíbe a AM para o Normalizador (posse); efeito declarado em `MOD-C05-01:34`, `03_Especificacoes/INDICE.md:56,64-66`, `04_Execucao/INDICE.md:18,74`, `PORTA-C05-01-P05:22,46`, `PORTA-C05-01-P03:14-15`; `Testes/TestGuardiao.js:719-722` usa "dados operacionais" = A:P enquanto `:707-711` afirma a escrita da AM |
| O docblock `Features/GuardiaoHeadless.js:10-11` enumera os efeitos do fluxo oficial e **omite** a coluna AM | **REAL (defeito documental em código)** | verbatim em §1.1 vs. a cadeia medida em §2 (`auditarMeses` → `varrerAba` grava AM em `:648`); a frase "auditarMeses renderiza [AUDITORIA] Ocorrencias e [HISTORICO] Auditoria Ocorrencias" é factualmente incompleta |
| `PORTA-C05-01-P05...md:22` afirma que a Porta escreve AM "apesar do comentario" | **REAL (afirmação indevida)** | o "apesar" supõe que o comentário seja o contrato; §1.2/§1.4 mostram que o contrato canônico diz o contrário. A Porta está em REVIEW no #164 — **não foi editada** |
| Auditoria que aborta com `ERRO_TECNICO` ainda grava `AM1` (mutação antes da validação) | **REAL (achado novo — D-164-04b)** | §3 Cenário 4: `setValue AM1 => "Alerta Integridade"` com `status: ERRO`; ordem `:199-201` **antes** de `:204` (que lança em `Core/RegrasQualidade.js:720-724`). O efeito em si é declarado (`PORTA-C05-01-P03:15`), a **ordem** não |

### O que falta para fechar (declarado, não inventado)

1. **Planner — vocabulário.** Definir o verbete "dado operacional" no `03_Fundacao/LEXICO.md` (grep
   `operacional` no LEXICO = **0**) citando `Core/ContratoMutacaoSegura.js:58-61` e `MOD-C05-01:14-16`. Sem isso,
   a mesma frase continuará legível nos dois sentidos e a divergência "volta" em cada leitura.
2. **Planner — a enumeração de efeitos** em `Features/GuardiaoHeadless.js:10-12`: corrigir (incluir "coluna AM
   da aba auditada") ou ratificar (declarar que o docblock lista só as abas de apoio).
3. **Planner — D-164-04b:** decidir se a criação do cabeçalho (`:199-201`) deve vir **depois** de
   `validarCabecalhosObrigatorios` (`:204`) — hoje há mutação em execução que falha.
4. **Planner — robustez da resolução da coluna:** decidir sobre o alias solto `'ALERTA'`
   (`Core/Constantes.js:61`) com match parcial (`Core/Utils.js:70-73`) e o fallback fixo `38` (`:200`) — é o
   único caminho pelo qual o Guardião poderia alcançar A:AL. Falta no repositório um **inventário canônico dos
   38 cabeçalhos A:AL** para provar que nenhum contém `ALERTA`.
5. **Reconciliar `PORTA-C05-01-P05...md:22`** (está em REVIEW) com este diagnóstico.
6. **Não verificado nesta fatia (declarado):** não li a planilha nem rodei `clasp run`; a existência de conteúdo
   manual prévio na coluna AM (que seria perdido) não é auditável offline.

---

## 6. Options (consequência de cada uma — sem escolher)

### A. Corrigir o CONTRATO (mínimo: o cabeçalho do arquivo headless)
Incluir "coluna AM da aba auditada" na enumeração de efeitos de `Features/GuardiaoHeadless.js:10-12` (e, se o
Planner quiser, no verbete do LEXICO).
- **Consequência:** ~3 linhas de comentário; **nenhum teste quebra** (nenhuma suíte lê o comentário); a
  divergência morre como texto. Deixa intacto o item `race_condition` pendente da P05 (a escrita continua).
- **Custo/risco:** exige um card que autorize tocar `Features/` (o #164 proíbe); a Porta P05 passa a ter de
  corrigir a frase "apesar do comentario".

### B. Corrigir o CÓDIGO (o headless deixa de escrever AM: modo somente-leitura/`dryRun`, ou motor que não
renderiza)
- **Consequência (ganho):** o efeito deixa de existir fora da UI; o item `race_condition` **pendente** de
  `C05/MOD-C05-01/P05` (e o agravamento que ela descreve) cai **por construção** — o segundo chamador do mesmo
  efeito deixa de existir; o docblock volta a ser verdadeiro sem edição.
- **Consequência (perda):** a prova headless **deixa de reproduzir o efeito do fluxo oficial**, que é justamente
  o que hoje a torna prova (`PORTA-C05-01-P05:7,22,46`); o §12.6 da P05 muda (Efeitos, idempotente,
  operacao_atomica passam a `nao_aplicavel`); e a evidência histórica de que a rota headless exercita o efeito
  real (SET2026, 33 alertas) passa a não se repetir — quem quiser validar a publicação na AM terá de usar o menu.
- **Variante B2 (cirúrgica):** manter a escrita e **mover** a criação do cabeçalho para depois de
  `validarCabecalhosObrigatorios` (`:199-201` → após `:204`) — elimina só D-164-04b; toca 1 arquivo de produto;
  nenhum item de checklist muda.

### C. Declarar EXCEÇÃO (registrar formalmente que o Guardião publica na AM; manter o docblock)
- **Consequência:** nada muda em código; a divergência passa a ser **de vocabulário**; precisa de decisão do
  Planner + registro (LEXICO e/ou ARCA) para não renascer; é a opção de menor custo e a única que não mexe em
  produto nem quebra contrato algum **hoje**.
- **Consequência adversa:** se a decisão do Planner for a leitura larga ("AM é dado operacional"), a exceção
  deixa de fechar a divergência e **cascateia**: teriam de ser reescritos `MOD-C05-01:14-16,34`,
  `03_Especificacoes/INDICE.md:18,56,64-66`, `04_Execucao/INDICE.md:18,74`, `00_Visao_Do_Comodo/INDICE.md:30-33`,
  `NOTA_DE_RESPONSABILIDADE.md:16`, `Core/ContratoMutacaoSegura.js:58-61`, e as Portas P03/P04/P05 — e o
  comportamento atual passaria a ser violação REAL, exigindo a opção B.

### D. Não decidir (registrar como divergência conhecida e seguir)
- **Consequência:** a mesma auditoria volta no próximo card; o item `race_condition` da P05 permanece pendente
  por causa da escrita; o docblock continua dizendo menos do que o código faz; risco de nova leitura divergente.

> Nota comum às opções: **nenhuma delas exige `clasp push`**, e nenhuma altera A:AL.

---

## 7. Fechadura proposta (no formato do que já existe em `Testes/`)

**Arquivo:** `Testes/TestGuardiaoHeadlessEfeitoDeclarado.js` — mesma forma das suítes recentes
(`Testes/TestValidarChecklistProducaoPortas.js` do #164, `Testes/TestGuardiaoHeadless.js`): contador
`PASS/FAIL` + `console.log('RESULTADOS FINAIS: N PASS / M FAIL')`, `process.exitCode = 1` em falha, registro de
um bloco em `Testes/RodarTodosOsTestes.js`.

**Casos (o que ficaria vermelho se a contradição voltar):**

1. **Efeito medida × declarado — o caso central.** Dirigir a cadeia **real**
   (`GuardiaoHeadless.executar('TODOS', { obterSS, modulo: SeletorMesesGuardiao })`) com o mock instrumentado
   desta auditoria (registra aba + A1 + operação) e asserir que **toda** escrita na aba mensal é ⊆ coluna de
   alerta: `AM1` e `AM2:AM{lastRow}` no máximo — i.e. **0 escritas fora da coluna de alerta**. É a fechadura que
   protege A:AL (o sentido técnico de "não altera dados operacionais") e que denuncia qualquer novo write
   operacional que alguém acrescente ao motor.
2. **Declaração × documentação.** Ler o próprio `Features/GuardiaoHeadless.js` como texto (precedente exato:
   `Testes/TestContratoMutacaoSegura.js:218` lê o seu fonte) e exigir que o docblock de escopo **cite a coluna
   AM** entre os efeitos — assim a *documentação* vira requisito verificável e um docblock que volte a omitir a
   AM nasce vermelho.
3. **Controle negativo de efeito.** `SELECAO_INVALIDA` → **0** escritas na aba mensal (hoje verde; garante que o
   curto-circuito de `:70-73` não regrida).
4. **Ordem (D-164-04b).** Com cabeçalhos obrigatórios ausentes (`OCORRENCIA PIP`/`IMPUTADO?` removidos), a
   auditoria devolve `status ERRO` **e** o mock não registra **nenhuma** escrita (hoje: 1 escrita em `AM1` —
   **nasceria vermelho, é o comportamento a corrigir/decidir**). Marcar explicitamente como caso
   `known-red-until-decided` se o Planner optar por declarar a exceção.
5. **Anti-ornamento.** Asserir que o conjunto de efeitos medido é **exatamente** o conjunto contratado nas Portas
   P02/P03/P05 (abas de apoio + coluna AM): se o Guardião passar a escrever em outra coluna/aba, falha — a
   fechadura não é só sobre a AM, é sobre a **fronteira de efeito** do Módulo.

Se o Planner escolher a **opção B**, o caso 1 se inverte (asserção: **0** escritas na aba mensal) e o caso 2
passa a exigir a atualização de `PORTA-C05-01-P05...md` (Efeitos + o item `race_condition`).

---

## 8. Arquivos tocados por esta auditoria

| Arquivo | Estado |
|---|---|
| `DIAGNOSTICO_D_164_04.md` (raiz do repo) | **CRIADO** (esta peça) |
| `C:\Users\Bneto04\AppData\Local\Temp\d16404_repro.js` | script de reprodução, **fora do repositório** (não aparece no `git status`) |
| Todo o resto | **intocado** — `git status --short` idêntico ao do início |

**Não houve** commit, push, postagem no GitHub, criação de card, `clasp push`, nem toque no #172.

---

## 9. Texto proposto para o comentário/RESULT do #164

```text
[HERMES] DIAGNÓSTICO — D-164-04

STATUS: PARCIAL — comportamento REAL e medido; CONTRADIÇÃO CONTRATUAL REFUTADA pelo contrato canônico;
        resta 1 defeito documental real, estreito e datado (enumeração de efeitos no cabeçalho do arquivo
        headless) + 1 achado novo (D-164-04b: mutação antes da validação). Nada foi corrigido: esta fatia é
        diagnóstico isolado (nenhum arquivo de produto, planilha ou documento pré-existente alterado; sem
        commit/push/postagem; sem clasp push).
        Cenário congelado: branch sprint/g01-guardiao-qualidade-live-001 · HEAD f745034.

OS DOIS LADOS
- CONTRATO (declarado): a frase existe como DOCBLOCK DE ARQUIVO, não como Porta nem INST —
  Features/GuardiaoHeadless.js:10-12 "Escopo: leitura/diagnostico + os mesmos efeitos do fluxo oficial
  (auditarMeses renderiza [AUDITORIA] Ocorrencias e [HISTORICO] Auditoria Ocorrencias). NAO abre dialogo,
  NAO altera dados operacionais e NAO substitui a selecao do operador."
  O MESMO predicado, no contrato de domínio, DEFINE o termo e LICENCIA a AM na mesma frase:
  MOD-C05-01_GUARDIAO_DE_QUALIDADE.md:14-16 "Nao altera dado operacional - nem colunas A:AL, nem formula:
  somente leitura + escrita nas abas de auditoria e no destaque da coluna AM (39)" (idem :34 "Guardiao ->
  coluna AM | escrita | alerta em AM (39) com A:AL preservadas"; :43 "A:AL intocaveis").
  Definição canônica de "dado": Core/ContratoMutacaoSegura.js:58 "A:AL sao dados; AM e a coluna de alerta do
  Guardiao" + :263 PROIBIDO_ALTERAR_COLUNA_DE_ALERTA (a AM é RESERVADA ao Guardião, proibida ao Normalizador).
  Efeito declarado também em C05/03_Especificacoes/INDICE.md:56,64-66 · C05/04_Execucao/INDICE.md:18,74 ·
  C05/00_Visao_Do_Comodo/INDICE.md:30-33 · MOD-C05-02/NOTA_DE_RESPONSABILIDADE.md:16.
  Doutrina (detecta ≠ corrige): Core/SaudeTuneis.js:25 · Core/RegrasQualidade.js:477-478 ·
  Entrada/SeletorMesesGuardiao.js:9 · Dominio/ARCA/arca_regras_dominio.json:2973 · RELATORIO_DE_DIFERENCIAS_160.md:7
  — fala de "corrigir o dado" (A:AL/células/fórmulas), não de publicar diagnóstico na coluna derivada.
  INST-EXEC-001 (o único INST) está RETIRADO (INST-EXEC-001:5) e não trata do Guardião.
- COMPORTAMENTO (medido): a cadeia grava a coluna de alerta no caminho headless NORMAL, sem flag —
  Features/GuardiaoHeadless.js:75 auditarMeses → Entrada/SeletorMesesGuardiao.js:208,224 varrerAba →
  Features/GuardiaoQualidade.js:199-201 (cria AM1 quando ausente) + :647-651 (prepararColunaAlertas +
  setValues em :648 + aplicarDestaquesAlertasAM_) → Render/RendererAuditoriaSaude.js:392-411 (AM1 = "Alerta
  Integridade"; clearContent em AM2:AMN). Valor: string por linha (diagnósticos deduplicados unidos por " | ")
  / "" quando sem alerta. Únicas 2 escritas de valor do motor (201 e 648) — AM é a ÚNICA célula da aba mensal
  tocada. Normalizador não escreve AM (0 em Features/CorretorQualidade.js).

REPRODUÇÃO (comando exato, exit 0)
- node "C:/Users/Bneto04/AppData/Local/Temp/d16404_repro.js"   (script fora do repo; cadeia REAL + mock
  instrumentado que registra aba+A1+operação)
  CENÁRIO 1 (38 col A:AL, sem cabeçalho AM): status OK · 10 escritas na aba mensal, TODAS na coluna de alerta
  (setValue AM1 "Alerta Integridade"; setValues AM2:AM3 com os alertas; setBackground/setFontColor AM2/AM3) ·
  escritas FORA da coluna de alerta: 0.
  CENÁRIO 2 (39 col, cabeçalho AM presente): status OK · 9 escritas, todas na coluna de alerta · fora: 0.
  CENÁRIO 4 (cabeçalhos obrigatórios ausentes): status ERRO_TECNICO e, ainda assim, setValue AM1 gravado.
  CENÁRIO 3 (controle): SELECAO_INVALIDA → 0 escritas.
- Não toquei na planilha nem rodei clasp. Evidência de execução real anterior:
  agentic/state/RESULT_CORRECAO_145_146_148_CLASP.md:29 ("clasp run executarGuardiaoHeadless -p '[\"SET2026\"]'
  → status OK, 12 túneis, 213 linhas, 33 alertas") — mesma cadeia, sem flag: a gravação da AM de SET2026 é
  consequência direta (verificável no Sheets pelo Planner).
- Baselines: node Testes/RodarTodosOsTestes.js exit 0 (303 PASS/0 FAIL somados nos 25 blocos) ·
  Testes/TestGuardiao.js exit 0 (60) · Testes/TestGuardiaoHeadless.js exit 0 (9 PASS/0 FAIL) ·
  node scripts/downplant/lint-estrutura.mjs . exit 0.

CLASSIFICAÇÃO (com prova)
- REAL: o GuardiaoHeadless grava a AM no caminho normal, sem flag (execução acima + Features/GuardiaoQualidade.js:648).
- REAL (documental, estreito): Features/GuardiaoHeadless.js:10-11 enumera os efeitos do fluxo oficial e OMITE a
  coluna AM — a frase é factualmente incompleta (a cadeia medida em :75 grava AM).
- REAL (novo, D-164-04b): a criação do cabeçalho (:199-201) ocorre ANTES de validarCabecalhosObrigatorios (:204,
  que lança em Core/RegrasQualidade.js:720-724) → auditoria que aborta com ERRO_TECNICO já mutou a aba.
- REFUTADA: que isso contrarie o contrato/doutrina. AM não é "dado operacional" no sentido técnico do cofre
  (ContratoMutacaoSegura.js:58-61), é a saída declarada do Guardião (MOD-C05-01:34 etc.) e é justamente por ser
  dele que o contrato de mutação PROÍBE o Normalizador de tocar AM (:263). O teste do próprio repositório usa
  "dados operacionais" = A:P e, no mesmo caso, afirma a escrita da AM (Testes/TestGuardiao.js:719-722 × :707-711).
- FALTA PARA FECHAR: (1) verbete "dado operacional" no 03_Fundacao/LEXICO.md (hoje: 0 ocorrências) citando
  ContratoMutacaoSegura.js:58-61 e MOD-C05-01:14-16; (2) decidir a enumeração de efeitos do docblock; (3) decidir
  D-164-04b (ordem validação × cabeçalho); (4) decidir robustez da resolução da coluna (alias solto 'ALERTA' em
  Core/Constantes.js:61 + match parcial em Core/Utils.js:70-73 + fallback fixo idx=38 em :200) — falta inventário
  canônico dos 38 cabeçalhos A:AL para provar que nenhum contém 'ALERTA'; (5) reconciliar
  PORTA-C05-01-P05_GUARDIAO_HEADLESS.md:22 ("apesar do comentario") — não editada (está em REVIEW).

OPTIONS (sem escolha — consequência de cada uma)
A) Corrigir o CONTRATO (incluir "coluna AM" em Features/GuardiaoHeadless.js:10-12; + verbete no LEXICO):
   ~3 linhas de comentário, nenhum teste quebra, divergência morre como texto; exige card que autorize tocar
   Features/; o item race_condition pendente da P05 permanece.
B) Corrigir o CÓDIGO (headless somente-leitura/dryRun, sem publicar AM): o race_condition pendente da P05 cai por
   construção (deixa de existir o 2º chamador do mesmo efeito); em troca, a prova headless deixa de reproduzir o
   efeito do fluxo oficial (é o que hoje a torna prova) e o §12.6 da P05 muda (Efeitos/idempotente/atômico).
   Variante B2 (cirúrgica): manter a escrita e mover a criação do cabeçalho para depois da validação — fecha só
   D-164-04b, 1 arquivo, nenhum item de checklist muda.
C) Declarar EXCEÇÃO (registrar formalmente que o Guardião publica na AM; manter o docblock): custo zero em código;
   a divergência vira vocabulário; se o Planner decidir pela leitura larga ("AM é dado operacional"), cascateia
   em MOD-C05-01:14-16,34 · C05/03_Especificacoes:18,56,64-66 · C05/04_Execucao:18,74 · C05/00_Visao:30-33 ·
   MOD-C05-02 NOTA:16 · ContratoMutacaoSegura:58-61 · Portas P03/P04/P05, e aí volta a opção B.
D) Não decidir: a auditoria volta no próximo card; race_condition da P05 fica pendente por causa da escrita.

FECHADURA PROPOSTA (formato das suítes existentes; nada criado nesta fatia)
Testes/TestGuardiaoHeadlessEfeitoDeclarado.js, registrado em Testes/RodarTodosOsTestes.js (1 bloco), com 5 casos:
(1) dirige a cadeia REAL com mock instrumentado e exige que toda escrita na aba mensal seja ⊆ coluna de alerta
(0 escritas em A:AL) — protege o sentido de "não altera dados operacionais"; (2) lê o fonte de
Features/GuardiaoHeadless.js (precedente: TestContratoMutacaoSegura.js:218) e exige que o docblock de escopo
CITE a coluna AM — a omissão volta a nascer vermelha; (3) controle negativo SELECAO_INVALIDA → 0 escritas;
(4) D-164-04b: cabeçalhos obrigatórios ausentes → status ERRO e 0 escritas (hoje nasce vermelho: 1 escrita em
AM1); (5) anti-ornamento: o conjunto de efeitos medido = exatamente o contratado nas Portas P02/P03/P05.
Se o Planner escolher B, o caso (1) se inverte (0 escritas) e exige atualizar PORTA-C05-01-P05 (Efeitos +
race_condition).

QUATRO PONTAS
- CÓDIGO: INALTERADO — nenhuma linha de produto tocada (Features/, Core/, Entrada/, Render/, Dominio/, Motor/,
  Leitura/, Drivers/, raiz). As duas únicas escritas de valor na AM continuam em Features/GuardiaoQualidade.js:201,648.
- DOCUMENTAÇÃO: **1 arquivo novo** — DIAGNOSTICO_D_164_04.md (raiz). Os artefatos do #164 (RELATORIO_164.md,
  RESULT_PROPOSTO_164.md, INVENTARIO_PORTAS_E_CHECKLIST_12_6.md, as 25 Portas §46.3) NÃO foram editados;
  a frase de PORTA-C05-01-P05:22 fica registrada aqui como pendente de reconciliação.
- CANVAS / PLANTA: INALTERADO — nenhum canvas/planta editado; nenhum elemento novo.
- GIT: PENDENTE por ordem do card — nada commitado, nada empurrado, nada postado. git status --short: os 3 itens
  pré-existentes (M em SUB-C01-01-01/NOTA_DE_RESPONSABILIDADE.md e RELATORIO_DE_DIFERENCIAS_156_157.md, ??
  Testes/TestNormalizadorEfetivo.js) + o único arquivo novo desta auditoria (?? DIAGNOSTICO_D_164_04.md) + dois
  artefatos de processo de fundo que surgiram durante a sessão (M VigiaPonte/conversation_memory.json, ??
  Testes/temp_test_telegram/) — nenhum destes tocado por esta auditoria.
```
