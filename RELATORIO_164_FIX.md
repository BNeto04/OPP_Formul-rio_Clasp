# RELATÓRIO — Correção de D-164-04 / D-164-04b (#164 · DP24-003)

**Natureza:** execução cirúrgica da **decisão do Planner** sobre `DIAGNOSTICO_D_164_04.md`.
**Cenário congelado:** repo `C:\Users\Bneto04\Documents\Codex\syntheon-gs-downplant-offline` ·
branch `sprint/g01-guardiao-qualidade-live-001` · HEAD `dd51707`.
**Proibições respeitadas:** nenhum commit, nenhum push, nenhuma postagem no GitHub, nenhum card criado,
nenhum `clasp push`, nenhum toque no #172, **nenhuma planilha alterada**, nenhum arquivo fora do recorte autorizado.

**Arquivos tocados (5):**

| Arquivo | Mudança |
|---|---|
| `Features/GuardiaoHeadless.js` | **docblock** (linhas 10-16) — correção documental |
| `Features/GuardiaoQualidade.js` | **método `resolverColunaAlerta`** + **ordem** da validação × escrita |
| `Testes/TestGuardiaoHeadlessEfeitoDeclarado.js` | **CRIADO** — fechadura (7 casos: (a)-(e) obrigatórios + (f)(g) anti-ornamento) |
| `Testes/RodarTodosOsTestes.js` | registro da suíte (2 linhas) |
| `03_Fundacao/LEXICO.md` | verbete "dado operacional × metadado/alerta de auditoria" |
| `RELATORIO_164_FIX.md` | **CRIADO** — esta peça |

Nada mais foi tocado. `Testes/TestNormalizadorEfetivo.js`, `RELATORIO_DE_DIFERENCIAS_156_157.md`,
`NOTA_DE_RESPONSABILIDADE.md`, `VigiaPonte/conversation_memory.json` e `Testes/temp_test_telegram/` já
estavam modificados/untracked **antes** desta execução (o diagnóstico §0 os lista) e **não** foram tocados aqui.

---

## 0. O defeito e o que foi decidido

| # | Defeito (do diagnóstico) | Decisão do Planner | Onde foi implementado |
|---|---|---|---|
| D | O docblock do arquivo headless **omite a coluna AM** e diz "NAO altera dados operacionais" — legível nos dois sentidos | corrigir o **docblock**: explicitar **A:AL somente leitura; AM = canal de alerta do Guardião** | `Features/GuardiaoHeadless.js:10-16` |
| D-164-04b | `:199-201` grava `AM1` **antes** de `:204 validarCabecalhosObrigatorios` → auditoria que aborta com `ERRO_TECNICO` **já mutou** a aba | validar **completamente** antes de qualquer escrita; falha ⇒ efeito **ZERO**, inclusive `AM1` | `Features/GuardiaoQualidade.js:262-272` |
| §4.3 (hazard) | alias solto `'ALERTA'`/`'OBSERVADOR'` (`Core/Constantes.js:61`) + match **parcial** (`Core/Utils.js:70-73`/`Core/Cabecalhos.js:77-82`) + fallback fixo `idx = 38` podiam mirar coluna de **A:AL** | resolver a AM por **contrato/cabeçalho canônico**; ausente/ambígua ⇒ **fail-safe** (diagnóstico + nenhuma escrita); **sem** match parcial, **sem** fallback fixo | `Features/GuardiaoQualidade.js:76-127` (`resolverColunaAlerta`) + `:233,258,265-272` |
| Léxico | `grep operacional` em `03_Fundacao/LEXICO.md` = **0** | acrescentar o verbete | `03_Fundacao/LEXICO.md` |
| Doutrina | — | o Guardião continua **detecta → registra alerta → não corrige dado**; nenhuma arquitetura nova | nenhuma escrita em A:AL, nenhum "corretor" |

---

## 1. Docblock corrigido (correção documental)

### 1.1 Antes (`Features/GuardiaoHeadless.js:10-12`, verbatim)

```
 * Escopo: leitura/diagnostico + os mesmos efeitos do fluxo oficial (auditarMeses renderiza
 * [AUDITORIA] Ocorrencias e [HISTORICO] Auditoria Ocorrencias). NAO abre dialogo, NAO altera
 * dados operacionais e NAO substitui a selecao do operador.
```

### 1.2 Depois (verbatim, `:10-16`)

```
 * Escopo: leitura/diagnostico + os mesmos efeitos do fluxo oficial (auditarMeses renderiza
 * [AUDITORIA] Ocorrencias e [HISTORICO] Auditoria Ocorrencias e publica o alerta na coluna AM
 * da aba auditada). As colunas A:AL da aba mensal sao SOMENTE LEITURA — nenhuma celula, formula
 * ou formatacao de dado operacional e alterada; a coluna AM ('Alerta Integridade') e o CANAL DE
 * ALERTA DO GUARDIAO, enderecado por cabecalho canonico
 * (`Core/ContratoMutacaoSegura.js:58-61`: "A:AL sao dados; AM e a coluna de alerta do Guardiao").
 * NAO abre dialogo e NAO substitui a selecao do operador.
```

### 1.3 Diff

```diff
--- a/Features/GuardiaoHeadless.js
+++ b/Features/GuardiaoHeadless.js
@@ -8,8 +8,12 @@
  * exigencia do scripts.run).
  *
  * Escopo: leitura/diagnostico + os mesmos efeitos do fluxo oficial (auditarMeses renderiza
- * [AUDITORIA] Ocorrencias e [HISTORICO] Auditoria Ocorrencias). NAO abre dialogo, NAO altera
- * dados operacionais e NAO substitui a selecao do operador.
+ * [AUDITORIA] Ocorrencias e [HISTORICO] Auditoria Ocorrencias e publica o alerta na coluna AM
+ * da aba auditada). As colunas A:AL da aba mensal sao SOMENTE LEITURA — nenhuma celula, formula
+ * ou formatacao de dado operacional e alterada; a coluna AM ('Alerta Integridade') e o CANAL DE
+ * ALERTA DO GUARDIAO, enderecado por cabecalho canonico
+ * (`Core/ContratoMutacaoSegura.js:58-61`: "A:AL sao dados; AM e a coluna de alerta do Guardiao").
+ * NAO abre dialogo e NAO substitui a selecao do operador.
  */
```

**É comentário.** Nenhuma regra mudou por causa dele; a fechadura lê o próprio fonte (caso (g)).

---

## 2. Ordem corrigida em `GuardiaoQualidade.js` — validação ANTES de qualquer escrita

### 2.1 Antes (`:195-204` — o trecho `:197-206` pedido, verbatim)

```
195|      alerta: loc('ALERTA_INTEGRIDADE'),
196|      calculadas: RegrasQualidade.localizarColunasCalculadas(headers)
197|    };
198|
199|    if (idx.alerta === -1) {
200|      idx.alerta = 38; // Coluna AM (0-based: 38)
201|      sheet.getRange(1, idx.alerta + 1).setValue('Alerta Integridade');
202|    }
203|
204|    RegrasQualidade.validarCabecalhosObrigatorios(idx);
```

Dois defeitos na mesma janela: **(i)** escrita (`:201`) **antes** da validação (`:204`) ⇒ auditoria que
aborta deixa `AM1` mutado (D-164-04b); **(ii)** a coluna vem do alias solto (`:195`) e, ausente o
cabeçalho, de **posição fixa** (`:200`) ⇒ pode cair em coluna de A:AL (§4.3).

### 2.2 Depois (`:233` + `:258` + `:262-272`, verbatim)

```
233|    const resolucaoAlerta = GuardiaoQualidade.resolverColunaAlerta(headers);
...
258|      alerta: resolucaoAlerta.indice, // endereco canonico da AM (D-164-04) — ver comentario acima
259|      calculadas: RegrasQualidade.localizarColunasCalculadas(headers)
260|    };
261|
262|    // D-164-04b (ordem): a validacao completa — cabecalhos obrigatorios E endereco da coluna de
263|    // alerta — roda ANTES de qualquer escrita. Em falha o efeito e ZERO, inclusive AM1: nao ha
264|    // criacao de cabecalho nem publicacao parcial em execucao que aborta.
265|    RegrasQualidade.validarCabecalhosObrigatorios(idx);
266|
267|    if (resolucaoAlerta.indice === -1) {
268|      const err = new Error(resolucaoAlerta.mensagem);
269|      err.severidade = typeof SEVERIDADES_GUARDIAO !== 'undefined' ? SEVERIDADES_GUARDIAO.ERRO_TECNICO : 'ERRO TECNICO';
270|      err.codigoRegra = resolucaoAlerta.codigo;
271|      throw err;
272|    }
```

A **criação do cabeçalho foi removida** (era ela a mutação-em-falha) e o endereço da AM passou a ser
resolvido **antes** do `idx`; a validação estrutural (`:265`) precede o gate da coluna (`:267`) e ambos
precedem **qualquer** escrita — a única escrita que restou no motor continua uma só:
`Features/GuardiaoQualidade.js:716` (`setValues` em `idx.alerta + 1`), agora inalcançável com
`resolucaoAlerta.indice === -1`.

### 2.3 Diff resumido do motor

```diff
@@ -170,4 +227,10 @@
     const loc = (chaveAlias) => SyntheonUtils.localizarColuna(headers, chaveAlias);
+
+    // D-164-04: a coluna de alerta NAO e resolvida por alias solto ('ALERTA'/'OBSERVADOR', que
+    // casariam por match parcial com uma coluna de A:AL) nem por posicao fixa (fallback cego
+    // idx = 38). O endereco da AM e o do contrato: o CABECALHO CANONICO 'Alerta Integridade'
+    // (Core/ContratoMutacaoSegura.js:58-61: "A:AL sao dados; AM e a coluna de alerta do Guardiao").
+    const resolucaoAlerta = GuardiaoQualidade.resolverColunaAlerta(headers);
+
     const idx = {
@@ -193,15 +256,20 @@
       pontosFiccao: loc('PONTOS_FICCAO'),
-      alerta: loc('ALERTA_INTEGRIDADE'),
+      alerta: resolucaoAlerta.indice, // endereco canonico da AM (D-164-04) — ver comentario acima
       calculadas: RegrasQualidade.localizarColunasCalculadas(headers)
     };
 
-    if (idx.alerta === -1) {
-      idx.alerta = 38; // Coluna AM (0-based: 38)
-      sheet.getRange(1, idx.alerta + 1).setValue('Alerta Integridade');
-    }
-
+    // D-164-04b (ordem): a validacao completa — cabecalhos obrigatorios E endereco da coluna de
+    // alerta — roda ANTES de qualquer escrita. Em falha o efeito e ZERO, inclusive AM1: nao ha
+    // criacao de cabecalho nem publicacao parcial em execucao que aborta.
     RegrasQualidade.validarCabecalhosObrigatorios(idx);
+
+    if (resolucaoAlerta.indice === -1) {
+      const err = new Error(resolucaoAlerta.mensagem);
+      err.severidade = typeof SEVERIDADES_GUARDIAO !== 'undefined' ? SEVERIDADES_GUARDIAO.ERRO_TECNICO : 'ERRO TECNICO';
+      err.codigoRegra = resolucaoAlerta.codigo;
+      throw err;
+    }
```

---

## 3. Endereço canônico da AM — `resolverColunaAlerta` (`:76-127`)

Regra implementada (contrato, não heurística):

1. **Fonte do endereço:** `Core/ContratoMutacaoSegura.js:58-61` — *"A:AL sao dados; AM e a coluna de
   alerta do Guardiao"*; nome fixado por `C05/03_Especificacoes/INDICE.md:18` (*"A coluna AM continua
   sendo `Alerta Integridade`"*). O endereço é o **cabeçalho canônico exato**.
2. **Sem match parcial:** `'ALERTA OPERACIONAL'`, `'ALERTA'`, `'OBSERVADOR'` **não** são endereço (o
   alias solto de `Core/Constantes.js:61` deixou de ser usado no caminho do Guardião).
3. **Sem posição fixa:** o fallback `idx = 38` foi **removido**.
4. **Fail-safe:** `AUSENTE` (0 ocorrências) ou `AMBIGUA` (nome canônico repetido em 2+ colunas) ⇒
   retorno `indice = -1` ⇒ `ERRO_TECNICO` com diagnóstico emitido e **nenhuma escrita** (nem
   `AM1`, nem destaque, nem `setValues`).
5. **Sem arquitetura nova:** um método estático privado no próprio motor do Guardião, no mesmo padrão
   de `localizarAbaCatalogoPIP`/`localizarLinhaCabecalhoCatalogo` (que já resolvem endereço por
   identidade canônica em vez de por alias solto — precedente próprio do arquivo).
6. **Doutrina preservada:** o Guardião detecta, registra alerta e **não corrige dado**; a coluna de
   alerta continua sendo a única célula da aba mensal tocada, e só quando o endereço é inequívoco.

**Consequência operacional declarada (para o Planner):** uma aba mensal **sem** o cabeçalho canônico
da AM (ou com ele duplicado) **deixa de ser auditada com escrita** — a auditoria aborta com
`ERRO_TECNICO` e mensagem acionável em vez de criar a coluna. É a troca exigida pela decisão (fail-safe >
auto-criação); a criação de `AM1` era justamente o efeito-em-falha de D-164-04b.

---

## 4. Os 5 testes obrigatórios (+2) — `Testes/TestGuardiaoHeadlessEfeitoDeclarado.js`

A fechadura dirige a **cadeia real** (`GuardiaoHeadless.executar` → `SeletorMesesGuardiao.auditarMeses`
→ `GuardiaoQualidade.varrerAba`) sobre um mock instrumentado que registra **toda** escrita (aba + A1 +
operação + valores) e **separa** a matriz da aba mensal das abas de apoio — nenhum módulo de produto é
substituído por fake. A:AL = 38 colunas (A..AL); AM = 39ª.

| Caso | O que prova | Estado antes | Estado depois |
|---|---|---|---|
| **(a)** cabeçalho obrigatório ausente | aborta com `ERRO_TECNICO` e **nenhuma** escrita (nem `AM1`) — **D-164-04b** | **VERMELHO** (`setValue AGO2026!AM1`) | VERDE |
| **(b)** coluna de alerta ausente | fail-safe: diagnóstico (`AUSENTE`) e **zero** escrita (sem criar `AM1`, sem `idx=38`) | **VERMELHO** (status `OK`, gravou AM) | VERDE |
| **(c)** cabeçalho canônico ambíguo (2 colunas) | **zero** escrita — o endereço não é escolhido por posição | **VERMELHO** (status `OK`) | VERDE |
| **(d)** estrutura válida | escrita **somente** na AM; bloco único `setValues` em `AM2:AMn` | verde (vira trava de regressão) | VERDE |
| **(e)** nenhuma célula de **A:AL** alterada | matriz A:AL (valores **e** fórmulas) idêntica antes/depois — no sucesso **e** na falha | **VERMELHO** (o hazard mutou uma coluna de A:AL) | VERDE |
| **(f)** anti-ornamento: alias solto | `'ALERTA OPERACIONAL'`/`'OBSERVADOR'` em A:AL **nunca** viram alvo (nem cabeçalho) | **VERMELHO** (gravou `'Alerta Integridade'` na coluna U de A:AL) | VERDE |
| **(g)** declaração × documentação | o docblock do arquivo headless **cita a AM** e declara **A:AL somente leitura** | **VERMELHO** (omissão) | VERDE |

### 4.1 Prova RED (código de produto revertido — `git checkout --` nos 2 arquivos, restaurados em seguida; `sha256sum -c` confirmado)

Comando: `node Testes/TestGuardiaoHeadlessEfeitoDeclarado.js` → **exit 1**

```
  [FAIL] (a) ... auditoria que falha nao pode deixar NENHUMA escrita
+ actual - expected
+ [ 'setValue AGO2026!AM1' ]
- []
  [FAIL] (b) ... ausencia do endereco canonico da AM deve abortar a publicacao      ('OK' !== 'ERRO')
  [FAIL] (c) ... ambiguidade deve abortar a publicacao                              ('OK' !== 'ERRO')
  [PASS] (d) ...
  [FAIL] (e) ... cenario de falha NAO pode mutar A:AL
      'COLAB_20',
+     'Alerta Integridade',
-     'OBSERVADOR',          <-- o cabecalho de uma coluna de A:AL foi SOBRESCRITO
  [FAIL] (f) ... nenhuma escrita (nem cabecalho) quando o alvo nao e o endereco canonico
  [FAIL] (g) ... o escopo declarado deve citar a coluna AM entre os efeitos

RESULTADOS FINAIS: 1 PASS / 6 FAIL
❌ FECHADURA D-164-04/D-164-04b FALHOU — efeito medido diverge do declarado.
```

O RED **confirma os dois achados por execução**: (a) `AM1` gravado em auditoria que aborta
(D-164-04b) e (f/e) uma coluna **de A:AL** (cabeçalho `OBSERVADOR`, coluna U) recebendo
`'Alerta Integridade'` + `clearContent` + `setValues` — o hazard de §4.3 **estava vivo**, alcançado
pela cadeia real.

### 4.2 Prova GREEN (após a correção)

Comando: `node Testes/TestGuardiaoHeadlessEfeitoDeclarado.js` → **exit 0**

```
Iniciando Testes: efeito declarado x efeito medido do Guardiao (D-164-04 / D-164-04b)...

  [PASS] (a) cabecalho obrigatorio ausente: auditoria aborta com ERRO_TECNICO e NAO deixa nenhuma escrita (nem AM1)
  [PASS] (b) coluna de alerta ausente: fail-safe emite diagnostico e NAO escreve nada (sem criacao de AM1)
  [PASS] (c) cabecalho canonico ambiguo: duas colunas declaram "ALERTA INTEGRIDADE" -> ZERO escrita
  [PASS] (d) estrutura valida: toda escrita cai na coluna de alerta (AM) e a auditoria publica o alerta
  [PASS] (e) nenhuma celula de A:AL e alterada: matriz A:AL identica antes/depois em toda a cadeia
  [PASS] (f) alias solto nao e endereco: "ALERTA OPERACIONAL"/"OBSERVADOR" em A:AL nao recebem escrita nem cabecalho
  [PASS] (g) docblock do arquivo headless cita a coluna AM e declara A:AL somente leitura

RESULTADOS FINAIS: 7 PASS / 0 FAIL
✅ FECHADURA D-164-04/D-164-04b: efeito declarado == efeito medido (A:AL intocadas, AM canonica).
```

Nota de robustez descoberta na integração: `Testes/TestNormalizadorEfetivo.js` (required pelo runner)
substitui `global.SyntheonUtils`/`global.CONSTANTES_SYNTHEON` por **stubs parciais**; a fechadura instala
os módulos canônicos durante a própria execução e **restaura** os globais no fim — sem alterar o
comportamento das demais suítes (rodada completa verde).

---

## 5. Verbete no léxico (`03_Fundacao/LEXICO.md`)

Acrescentada a seção **"Vocabulário de dados × metadados (fechamento de D-164-04, #164)"** com três
verbetes: **Dado operacional (A:AL)** = somente leitura, definição canônica citada
(`ContratoMutacaoSegura.js:58-61` + `MOD-C05-01:14-16,43`); **Metadado / alerta de auditoria (AM)** =
canal de alerta do Guardião, endereçado por cabeçalho canônico, fail-safe, proibida ao Normalizador
(`ContratoMutacaoSegura.js:263`); **Efeito de auditoria (detecta ≠ corrige)**. `grep operacional` no
léxico deixou de ser 0.

---

## 6. Mapa decisão → implementação → teste

| Decisão do Planner | Implementação (arquivo:linha) | Teste que a trava |
|---|---|---|
| 1. corrigir o **docblock** (A:AL leitura / AM canal de alerta) | `Features/GuardiaoHeadless.js:10-16` | **(g)** — lê o fonte e exige `AM` + `A:AL` + `SOMENTE LEITURA` |
| 2. **D-164-04b** — validar tudo antes de escrever; falha ⇒ zero efeito, inclusive `AM1` | `Features/GuardiaoQualidade.js:262-272` (e remoção do `setValue` de `:201`) | **(a)** — `ERRO_TECNICO` + lista de escritas vazia |
| 3. **endereço canônico da AM** + fail-safe, sem match parcial e sem fallback fixo | `Features/GuardiaoQualidade.js:76-127,233,258,265-272` | **(b)** ausente, **(c)** ambígua, **(f)** alias solto, **(d)** caminho válido |
| 4. **5 testes** (a)-(e) | `Testes/TestGuardiaoHeadlessEfeitoDeclarado.js` (7 casos) + registro no runner | RED 1/6 → GREEN 7/7 |
| 5. **léxico** (dado operacional = A:AL · metadado/alerta = AM) | `03_Fundacao/LEXICO.md` | verificação documental (`grep operacional`) |
| 6. **sem arquitetura nova**, sem virar corretor | 1 método estático no motor existente; **zero** escrita em A:AL; nenhuma correção de dado | **(d)+(e)** — toda escrita confinada à AM; A:AL byte-idênticas |

---

## 7. Estado final das verificações

| Verificação | Comando | Resultado | Exit |
|---|---|---|---|
| Fechadura (isolada) | `node Testes/TestGuardiaoHeadlessEfeitoDeclarado.js` | **7 PASS / 0 FAIL** | **0** |
| Suíte integral | `node Testes/RodarTodosOsTestes.js` | **310 PASS / 0 FAIL** em **26** blocos (baseline: 303 / 25) · última linha `TODAS AS SUÍTES FORAM EXECUTADAS COM SUCESSO` | **0** |
| Lint estrutural | `node scripts/downplant/lint-estrutura.mjs .` | `SUCESSO! A arvore documental esta em estrita conformidade com o Down Plant 2.1` | **0** |
| Portas §12.6 | `node scripts/downplant/validar-portas.mjs .` | **286 PASS / 0 FAIL** · 45 Portas · **25 elegíveis** · 25 arquivos · **17 itens `pendente`** (bloqueiam G7) | **0** |

**Onda de oscilação conhecida (`TestVigiaNaturalLanguage`, #172):** **não** se manifestou nesta execução —
0 `[FAIL]` em toda a suíte (26/26 blocos com `0 FAIL`).

### 7.1 D-164-04 ficou VERDE?

- **No plano do defeito medido: SIM.** Os dois defeitos do card estão fechados **com prova de execução**:
  (i) auditoria que aborta **não deixa mais** `AM1` (caso (a)); (ii) a coluna de alerta é resolvida por
  endereço canônico, com fail-safe, e o caminho que alcançava **A:AL** (alias solto + match parcial)
  **deixou de existir** (casos (b)(c)(e)(f)); (iii) o docblock que omitia a AM **foi corrigido** (caso (g)).
- **No plano do `validar-portas.mjs`: o validador é ORTOGONAL a D-164-04** — ele mede a completude do
  checklist §12.6 de cada Porta elegível, não a divergência doc×código. Portanto ele **já estava
  `exit 0` antes** e continua `exit 0` **depois** (286 PASS / 0 FAIL); não é ele que "acende" D-164-04.
  Quem acende é `Testes/TestGuardiaoHeadlessEfeitoDeclarado.js` (RED→GREEN acima).
- **Pendências §12.6:** seguem **17 itens `pendente` em 13 das 25 Portas elegíveis** (9 de `race_condition`,
  5 de `idempotente`, 3 de C06-02/P04) — **inalterados** por esta correção (a causa-raiz deles é a
  ausência de serialização/`LockService` e de política de idempotência, decisão do Planner).

---

## 8. O que NÃO foi feito e o que ficou pendente (declarado)

1. **Portas P03/P05 descrevem o comportamento ANTIGO** (fora do recorte de arquivos autorizado — não editei):
   - `PORTA-C05-01-P03_COLUNA_ALERTA_AM.md`: `require` item 2 ("quando o cabecalho nao existe, a Porta
     **cria** a coluna AM: `idx.alerta = 38` + `setValue`"), checklist `validacao_entrada` ("ausente, a
     Porta **declara** a criacao (`:199-201`)") e `Efeitos` ("Possivel criacao do cabecalho da coluna
     quando ausente (`:201`)") — **três afirmações que o código não cumpre mais** (fail-safe exige o
     oposto). As referências de linha (`:195-201`, `:638-651`, `:648`) deslocaram-se.
   - `PORTA-C05-01-P05_GUARDIAO_HEADLESS.md:22`: cita a divergência **D-164-04** "apesar do comentario
     `NAO altera dados operacionais` em `Features/GuardiaoHeadless.js:11`" — o comentário **não diz mais
     isso**; a frase fica obsoleta.
   - **Ação sugerida ao Executor/Planner:** reconciliar as duas Portas no fechamento (é a mesma classe de
     defeito — doc ≠ código — que este card corrige). **Não** fiz isso aqui porque o recorte autorizado
     é: `Features/GuardiaoHeadless.js` (docblock), `Features/GuardiaoQualidade.js` (ordem + coluna),
     testes e léxico.
2. **`Core/Constantes.js:61`** mantém o alias solto `ALERTA_INTEGRIDADE: ['ALERTA INTEGRIDADE','ALERTA','OBSERVADOR']`.
   Ele **deixou de ter consumidor no caminho do Guardião** (o motor não usa mais `loc('ALERTA_INTEGRIDADE')`),
   mas segue no arquivo — `Core/` está fora do recorte. Risco residual: outro consumidor futuro voltar a
   usá-lo. Registrado para decisão.
3. **Criação automática do cabeçalho da AM foi removida por decisão** (fail-safe). Aba mensal **sem** o
   cabeçalho canônico não é mais auto-corrigida: a auditoria aborta com diagnóstico. Consequência
   operacional declarada em §3; se o Planner quiser auto-criação segura (ex.: só quando a 39ª coluna
   estiver vazia **e** o contrato permitir), isso é uma decisão nova, não um defeito.
4. **Sem `clasp push`** (por ordem do card — é do Executor principal no fechamento). Consequência: a
   planilha viva **ainda roda o código antigo** até o push.
5. **Não auditei a planilha** e não rodei `clasp run` (proibido nesta fatia); a evidência de produção
   continua a citada no diagnóstico (`agentic/state/RESULT_CORRECAO_145_146_148_CLASP.md:29`).
6. **Git:** nada commitado/pushado/postado; nenhum card criado; #172 intocado.

---

## 9. Texto proposto para o RESULT do #164

```text
[HERMES] RESULT — #164 (D-164-04 corrigido)

STATUS: CORRIGIDO e VERIFICADO — docblock do arquivo headless, ordem da validacao (D-164-04b) e
        endereco canonico da coluna AM com fail-safe. Execucao CIRURGICA, dentro do recorte
        autorizado: 2 arquivos de produto (1 deles so comentario), 1 suite nova, o registro dela no
        runner e o verbete do lexico. Sem commit/push/postagem, sem card, sem clasp push, #172
        intocado, nenhuma planilha tocada.
        Cenario: branch sprint/g01-guardiao-qualidade-live-001, HEAD dd51707.

1) DOCBLOCK (correcao documental, Features/GuardiaoHeadless.js:10-16)
ANTES: "Escopo: leitura/diagnostico + os mesmos efeitos do fluxo oficial (auditarMeses renderiza
[AUDITORIA] Ocorrencias e [HISTORICO] Auditoria Ocorrencias). NAO abre dialogo, NAO altera dados
operacionais e NAO substitui a selecao do operador."
DEPOIS: "... e publica o alerta na coluna AM da aba auditada). As colunas A:AL da aba mensal sao
SOMENTE LEITURA — nenhuma celula, formula ou formatacao de dado operacional e alterada; a coluna AM
('Alerta Integridade') e o CANAL DE ALERTA DO GUARDIAO, enderecado por cabecalho canonico
(Core/ContratoMutacaoSegura.js:58-61: 'A:AL sao dados; AM e a coluna de alerta do Guardiao'). NAO
abre dialogo e NAO substitui a selecao do operador."

2) ORDEM (D-164-04b) — ANTES (Features/GuardiaoQualidade.js:195-204):
   alerta: loc('ALERTA_INTEGRIDADE') ... if (idx.alerta === -1) { idx.alerta = 38;
   sheet.getRange(1, idx.alerta + 1).setValue('Alerta Integridade'); }
   RegrasQualidade.validarCabecalhosObrigatorios(idx);
   DEPOIS (:233,258,262-272): resolucaoAlerta = GuardiaoQualidade.resolverColunaAlerta(headers);
   alerta: resolucaoAlerta.indice; RegrasQualidade.validarCabecalhosObrigatorios(idx);
   if (resolucaoAlerta.indice === -1) throw <ERRO_TECNICO>; -> nenhum setValue antes da validacao.
   A criacao de AM1 foi REMOVIDA. Unica escrita do motor continua :716 (setValues em idx.alerta+1).

3) ENDERECO DA AM (fechamento do hazard §4.3)
   - resolvido por CONTRATO/CABECALHO CANONICO ('Alerta Integridade'), match EXATO;
   - SEM match parcial de 'ALERTA' e SEM o alias solto 'OBSERVADOR' (Core/Constantes.js:61);
   - SEM fallback fixo idx = 38;
   - AUSENTE ou AMBIGUA (nome canonico repetido) => FAIL-SAFE: diagnostico ERRO_TECNICO emitido e
     NENHUMA escrita (nem AM1, nem destaque, nem valores).
   - 1 metodo estatico no proprio motor (mesmo padrao de localizarAbaCatalogoPIP); sem arquitetura
     nova; o Guardiao continua detecta -> registra alerta -> NAO corrige dado.

4) TESTES — Testes/TestGuardiaoHeadlessEfeitoDeclarado.js (cadeia REAL + mock instrumentado que
   registra toda escrita e separa aba mensal de abas de apoio), registrado em RodarTodosOsTestes.js:
   (a) cabecalho obrigatorio ausente => ERRO_TECNICO + ZERO escrita (nem AM1);
   (b) coluna de alerta ausente => diagnostico + ZERO escrita;
   (c) cabecalho canonico ambiguo => ZERO escrita;
   (d) estrutura valida => escrita SOMENTE na AM (bloco unico AM2:AMn);
   (e) nenhuma celula de A:AL alterada (valores e formulas identicos antes/depois);
   (f) anti-ornamento: 'ALERTA OPERACIONAL'/'OBSERVADOR' em A:AL nunca viram alvo;
   (g) o docblock tem de citar a AM e declarar A:AL somente leitura.
   PROVA RED -> GREEN (prod revertido por git checkout e restaurado, sha256sum -c OK):
     RED  (exit 1): 1 PASS / 6 FAIL — (a) deixa exatamente 'setValue AGO2026!AM1' (D-164-04b
                    reproduzido) e (e)/(f) mostram 'Alerta Integridade' SOBRESCREVENDO o cabecalho
                    'OBSERVADOR' de uma coluna de A:AL (o hazard de §4.3 estava VIVO).
     GREEN (exit 0): 7 PASS / 0 FAIL.

5) LEXICO (03_Fundacao/LEXICO.md): verbetes "Dado operacional (A:AL)" (somente leitura; definicao
   canonica ContratoMutacaoSegura.js:58-61 + MOD-C05-01:14-16,43) e "Metadado / alerta de auditoria
   (AM)" (canal de alerta do Guardiao; endereco por cabecalho canonico; fail-safe; proibida ao
   Normalizador por ContratoMutacaoSegura.js:263). grep 'operacional' no lexico deixou de ser 0.

6) VERIFICACOES (saida real, com exit)
   - fechadura isolada ................. 7 PASS / 0 FAIL ................ exit 0
   - node Testes/RodarTodosOsTestes.js .. 310 PASS / 0 FAIL em 26 blocos . exit 0
     (baseline antes do fix: 303 / 25) — "TODAS AS SUITES FORAM EXECUTADAS COM SUCESSO".
     0 [FAIL]; a oscilacao conhecida (TestVigiaNaturalLanguage, #172) NAO se manifestou.
   - node scripts/downplant/lint-estrutura.mjs . .. exit 0
   - node scripts/downplant/validar-portas.mjs . ... exit 0 · 286 PASS / 0 FAIL · 45 Portas · 25
     ELEGIVEIS · 17 itens 'pendente' (bloqueiam G7) — INALTERADOS por este fix (a causa-raiz das 9
     race_condition + 5 idempotente + 3 de C06-02/P04 e a ausencia de LockService/politica de
     idempotencia, decisao do Planner).
   Observacao de metodo: o validar-portas.mjs e ORTOGONAL a D-164-04 (mede o checklist §12.6, nao a
   divergencia doc x codigo); ja estava exit 0 antes e continua exit 0. Quem acende/verde o defeito e
   a nova fechadura (RED->GREEN acima).

7) PENDENCIAS DECLARADAS (nao silenciadas)
   - PORTA-C05-01-P03 e PORTA-C05-01-P05 descrevem o comportamento ANTIGO (P03: require 2,
     validacao_entrada e Efeitos afirmam a CRIACAO de AM1/idx=38 e a criacao do cabecalho; P05:22
     cita a divergencia 'apesar do comentario NAO altera dados operacionais'). Sao markdown de
     contrato FORA do recorte de arquivos autorizado — NAO editei; recomendo reconciliar as duas
     Portas no fechamento, sob pena de nascer uma divergencia doc x codigo da mesma classe.
   - Core/Constantes.js:61 mantem o alias solto ALERTA_INTEGRIDADE: ['ALERTA INTEGRIDADE','ALERTA',
     'OBSERVADOR'] — sem consumidor no caminho do Guardiao hoje (Core/ fora do recorte); registrado.
   - Fail-safe removeu a auto-criacao do cabecalho da AM: aba mensal sem o cabecalho canonico passa a
     abortar com diagnostico em vez de ser auto-corrigida (troca exigida pela decisao). Se o Planner
     quiser auto-criacao restrita (39a coluna vazia + contrato), e decisao nova.
   - Sem clasp push (por ordem): a planilha viva segue no codigo antigo ate o fechamento.
   - Nada commitado/pushado/postado; nenhum card criado; #172 intocado.
```
