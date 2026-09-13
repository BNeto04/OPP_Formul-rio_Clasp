# RELATORIO_N9_LEGENDA.md

**Escopo:** atualizar as 3 fechaduras (testes) da legenda ao contrato NOVO definido pelo PR #152.
**Repo:** `C:\Users\Bneto04\Documents\Codex\syntheon-gs-downplant-offline`
**Branch:** `sprint/g01-guardiao-qualidade-live-001` · **HEAD na medição:** `6a2671a`
(o HEAD avançou para `787f1dc` durante o trabalho — frente paralela ARCA-COUNT-001, que não tocou nenhum
dos meus alvos; ver §3.2)
**Data da medição:** 13/09/2026 · **Autor:** HERMES (subagente N9 — legenda)
**Produto alterado:** NENHUM. Somente testes. Sem commit, sem push, sem card.

---

## 0. Veredito em uma linha

As 3 falhas eram **testes desatualizados** (desenho antigo), não defeito de produto. Os alvos foram
atualizados ao desenho novo, **com cobertura ampliada** (nenhuma assertiva removida sem substituta
equivalente). Resultado: **630 PASS / 0 FAIL** na suíte integral e **lint OK**.

---

## 1. MEDIÇÃO — o que mudou no produto

### 1.1 `git show --stat 98f5c8d`

```
commit 98f5c8dd5795abbf84e66e09ee07e21819fb6271
Author: liveenergy7-code <liveenergy7@gmail.com>
Date:   Sun Sep 13 00:11:31 2026 -0300

    fix(legenda): rotulo DENTRO do quadrado de cor e ARMAS sobre a cor - layout legivel (#152)

 Render/RendererComparativo2026.js | 11 ++++++-----
 1 file changed, 6 insertions(+), 5 deletions(-)
```

### 1.2 `git show 98f5c8d -- Render/RendererComparativo2026.js` (diff integral)

```diff
@@ -183,7 +183,7 @@ const RendererComparativo2026 = {
-    sheet.getRange(linhaInicial, 5).setValue('ARMAS').setFontWeight('bold').setHorizontalAlignment('center');
+    sheet.getRange(linhaInicial, 4).setValue('ARMAS').setFontWeight('bold').setHorizontalAlignment('center');
@@ -201,11 +201,12 @@
-      sheet.getRange(linha, 4).setValue(item[0]);
-      sheet.getRange(linha, 5).setBackground(item[1]).setFontColor(item[2])
+      // #152 LAYOUT: o rotulo vai DENTRO do quadrado de cor (antes ficava separado, ilegivel).
+      sheet.getRange(linha, 4).setValue(item[0]).setBackground(item[1]).setFontColor(item[2])
+        .setFontWeight('bold').setHorizontalAlignment('center')
         .setBorder(true, true, true, true, false, false, '#000000', SpreadsheetApp.BorderStyle.SOLID);
-      sheet.getRange(linha, 6).setValue(quem.length + ' policiais').setHorizontalAlignment('center');
-      sheet.getRange(linha, 7).setValue(quem.map(function (r) {
+      sheet.getRange(linha, 5).setValue(quem.length + ' policiais').setHorizontalAlignment('left');
+      sheet.getRange(linha, 6).setValue(quem.map(function (r) {
```

**Contrato novo do renderer (3 mudanças observáveis):**
1. rótulo `ARMAS` passou da coluna 5 → **coluna 4** (sobre a coluna dos quadrados de cor);
2. o rótulo da faixa passou a ficar **DENTRO do quadrado** — mesma célula (`linha,4`) recebe
   `setValue` + `setBackground` + `setFontColor` + `bold` + `center`;
3. as colunas de apoio deslocaram 1 casa: `N policiais` → coluna 5 (agora `left`), `QUEM` → coluna 6.

### 1.3 Proveniência real das 3 falhas (medida, não presumida)

O commit indicado explica **1 das 3** fechaduras. As outras 2 foram quebradas por commits **irmãos do
mesmo PR #152**. A varredura `git log --oneline -- <arquivo>` mostra:

| Commit | Arquivo | Mudança de contrato | Fechadura afetada |
|---|---|---|---|
| `98f5c8d` | `Render/RendererComparativo2026.js` | rótulo `ARMAS` na col. 4 + rótulo dentro do quadrado | 1 (`TestRendererComparativo2026`) |
| `be68de8` | `Compilador_Armas.js` | `corPorGrupoArmas_` passa a espelhar a tabela única `CORES_GRUPO_ARMAS_` (fonte: `Render/RendererGxt.js` `CORES_PELOTAO`): **hex MAIÚSCULO** + campo **`negrito`** em todas as 6 faixas | 2 (`corPorGrupoArmas_`) e parte de 3 |
| `2263d87` | `Compilador_Armas.js` | cabeçalho da coluna E: `SCORE ACUMULADO (ARMAS)` → **`ARMAS`** | 3 (`executarCompilador()`) |

(`2263d87` também removeu a explicação dos oficiais da legenda e ajustou as células da legenda, por
pedido do Proprietário — nada disso é objeto das 3 fechaduras.)

### 1.4 Estado ANTES da intervenção (medido, HEAD 6a2671a + árvore de trabalho)

| Fechadura | Arquivo | Asserção que falhava | Saída real |
|---|---|---|---|
| 1 | `Testes/TestRendererComparativo2026.js:326` | `valores['15:5'] === 'ARMAS'` | `actual: undefined` |
| 2 | `Testes/TestRelatorioArmas.js:65` | `{fundo:'#f1c232', fonte:'#000000'}` | `{fundo:'#F1C232', fonte:'#000000', negrito:false}` |
| 3 | `Testes/TestRelatorioArmas.js:254` | `valores['1:5'] === 'SCORE ACUMULADO (ARMAS)'` | `actual: 'ARMAS'` |

Evidência bruta (antes):

```
❌ [FAIL] RendererComparativo2026: gera legenda de pelotões/armas e carimbo institucional com metadados:
+ actual - expected
+ undefined
- 'ARMAS'

❌ [FAIL] Armas: corPorGrupoArmas_ e corPorArmasArmas_ cobrem todas as regras protegidas:
  { fonte: '#000000', + fundo: '#F1C232', negrito: false, - fundo: '#f1c232' }

❌ [FAIL] Armas: executarCompilador() real gera aba de saída com paleta oficial, escala de armas e zero em vermelho:
+ 'ARMAS'   - 'SCORE ACUMULADO (ARMAS)'
```

---

## 2. ASSERTIVA POR ASSERTIVA — o que era / o que passou a ser / por que

### 2.1 Fechadura 1 — `Testes/TestRendererComparativo2026.js` (teste 6, "legenda + carimbo")

| # | Antes (desenho antigo) | Depois (desenho novo) | Por que |
|---|---|---|---|
| a | `assert.strictEqual(tracker.valores['15:5'], 'ARMAS')` (L326) | `assert.strictEqual(tracker.valores['15:4'], 'ARMAS')` (**L329**) | 98f5c8d moveu o rótulo para a coluna 4 (sobre a cor). Único ajuste de valor da fechadura. |
| b | (não existia) | `fontWeights['15:4'] === 'bold'` (**L330**) | o novo desenho pinta o rótulo em negrito sobre a cor — a fechadura passa a exigir isso. |
| c | (não existia) | `alignments['15:4'] === 'center'` (**L331**) | idem: `setHorizontalAlignment('center')` no mesmo range do quadro. |
| d | (não existia) | as **5 faixas** com rótulo + fundo + fonte **na MESMA célula `(linha,4)`** (**L335–345**) | este é o coração do contrato novo ("rótulo DENTRO do quadrado"). Antes o teste só verificava a existência do rótulo `ARMAS`. |
| e | (não existia) | `N policiais` na coluna 5 para cada faixa — `1/2/1/1/1 policiais` (**L346**) | preserva a cobertura "#152: legenda mostra QUANTOS"; o deslocamento 6→5 do produto exige a coluna nova. |
| f | (não existia) | `QUEM` na coluna 6 cita `SD LIMA (0)`, `CB OLIVEIRA (2)`, `SD SANTOS (4)`, `SD SOUZA (7)`, `TEN SILVA (12)` (**L347, L350**) | preserva a cobertura "legenda mostra QUEM"; a faixa 1–3 precisa citar **os dois** policiais. |
| g | (não existia) | `valores['21:4'] === undefined` (**L352**) | trava de **contagem**: exatamente 5 faixas, nenhuma 6ª. |
| h | (não existia) | quadrado do 1º e do 6º grupo: `backgrounds['16:1']==='#f1c232'`, `valores['16:2']==='Oficiais'`, `backgrounds['21:1']==='#ffffff'`, `valores['21:2']==='3o PEL'` (**L355–358**) | trava de **contagem + conteúdo** dos 6 grupos de pelotão (o teste antes não olhava nenhum item da legenda de pelotões). |
| i | `valores['15:1'] === 'LEGENDA'` (L325) | **mantida** | título da legenda. |
| j | carimbo: `PRODUTIVIDADE_GERAL / SYNTHÉON V2`, `Periodo: 01/01/2026 a 31/12/2026`, `backgrounds === '#f8fafc'` (L329–331) | **mantidas** (L361–363) | carimbo institucional com metadados — intocado pelo 98f5c8d. |

Nenhuma assertiva foi apagada: a única alterada (a) foi **reapontada** e ganhou 8 companheiras.

### 2.2 Fechadura 2 — `Testes/TestRelatorioArmas.js` (teste 1, `corPorGrupoArmas_`)

Contrato novo (`be68de8`): `corPorGrupoArmas_` deixou de devolver objetos montados à mão e passou a
**espelhar a tabela única** `CORES_GRUPO_ARMAS_` → hex em MAIÚSCULA (o mesmo byte de
`Render/RendererGxt.js:14-22` `CORES_PELOTAO` e de `Core/LegendaCores.js` `GRUPOS`) e campo `negrito`
sempre presente. `deepStrictEqual` compara chaves e valores, daí a falha.

| Grupo | Antes (L65–70) | Depois (L68–73) |
|---|---|---|
| OFICIAIS | `{fundo:'#f1c232', fonte:'#000000'}` | `{fundo:'#F1C232', fonte:'#000000', negrito:false}` |
| 1º PEL GTAR | `{fundo:'#00cc00', fonte:'#000000', negrito:true}` | `{fundo:'#00CC00', fonte:'#000000', negrito:true}` |
| 1º PEL | `{fundo:'#00ff00', fonte:'#000000'}` | `{fundo:'#00FF00', fonte:'#000000', negrito:false}` |
| 2º PEL GTAR | `{fundo:'#3c78d8', fonte:'#ffffff', negrito:true}` | `{fundo:'#3C78D8', fonte:'#FFFFFF', negrito:true}` |
| 2º PEL | `{fundo:'#6d9eeb', fonte:'#000000'}` | `{fundo:'#6D9EEB', fonte:'#000000', negrito:false}` |
| 3º PEL | `{fundo:'#ffffff', fonte:'#000000'}` | `{fundo:'#FFFFFF', fonte:'#000000', negrito:false}` |

Ampliação (novas, L75 e L77): fallback canônico (`'GRUPO INEXISTENTE'` → 3º PEL) e **soberania dos
OFICIAIS** (`'CAP'` com pelotão `'1º PEL'` → cor de OFICIAIS). Mesmo valor de cor, só a forma
canônica (byte) e a completude do retorno mudaram → **atualização de alvo, não enfraquecimento**
(as faixas `corPorArmasArmas_` em L80–84, que continuam minúsculas porque essa função **não** passou
pela tabela única, seguem intactas).

### 2.3 Fechadura 3 — `Testes/TestRelatorioArmas.js` (teste 2, `executarCompilador()` real)

| # | Antes | Depois | Por que |
|---|---|---|---|
| a | `valores['1:5'] === 'SCORE ACUMULADO (ARMAS)'` (L254) | `valores['1:5'] === 'ARMAS'` (**L265**) | `2263d87`: cabeçalho da coluna E encurtado por decisão do Proprietário. |
| b | (não existia) | `valores['1:2'..'1:4'] === 'GRADUAÇÃO' / 'MATRÍCULA' / 'POLICIAL'` (**L262–264**) | trava de **contagem/integridade do cabeçalho** (antes só 2 das 5 células eram verificadas). |
| c | `backgrounds['2:1'] === '#f1c232'` (L266) | `'#F1C232'` (**L278**) | hex canônico (`be68de8`). |
| d | `backgrounds['3:1'] === '#00cc00'` (L268) | `'#00CC00'` (**L280**) | idem. `fontWeightsMatriz[1][0]==='bold'` mantida (L281). |
| e | `backgrounds['4:1'] === '#00ff00'` (L271) | `'#00FF00'` (**L283**) | idem. |
| f | `backgrounds['5:1'] === '#3c78d8'` (L273) | `'#3C78D8'` (**L285**) | idem. |
| g | `fontColorsMatriz[3][0] === '#ffffff'` (L274) | `'#FFFFFF'` (**L286**) | idem. `fontWeightsMatriz[3][0]==='bold'` mantida (L287). |
| h | escala de armas col. 5: `#38761d`, `#93c47d`, `#ffff00`, `#ff9900`, `#ff9900` (L278–283) | **mantidas** (L290–295) | `corPorArmasArmas_` não mudou. |
| i | `numberFormats['2:5']==='#,##0'`, `alignments['2:5']==='right'`, `alignments['2:4']==='left'` (L260–262) | **mantidas** (L271–273) | formato/alinhamento do compilador intocados. |
| j | `linhasCongeladas===1`, `filterCreated===true`, `backgrounds['1:1']==='#e0e0e0'` | **mantidas** (L266–268) | layout do compilador intocado. |
| k | zero em vermelho: `corPorArmasArmas_(0)` → `fundo/fonte === '#ff0000'` (L286–288) | **mantidas** (L298–300) | regra protegida do zero — não pode cair. |

### 2.4 Cobertura preservada (checklist do pedido → onde está agora)

| Item exigido | Onde está | Estado |
|---|---|---|
| contagem de itens | 5 faixas + 6 grupos, com trava de "não existe 7º/6º item" (L335–352 renderer; L262–265 armas) | **ampliada** |
| cores exigidas | 6 grupos (L68–73) + 5 faixas de armas (L80–84) + paleta na aba real (L278–295) | **mantida** |
| presença de rótulo | `ARMAS` (L329) + rótulo de **cada** faixa DENTRO do quadrado (L343) | **ampliada** |
| escala de armas | 5 limites na função (L80–84) e na aba compilada (L290–295) | **mantida** |
| zero em vermelho | `corPorArmasArmas_(0) === #ff0000/#ff0000` (L80, L298–300) | **mantida** |
| carimbo com metadados | L361–363 (`PRODUTIVIDADE_GERAL / SYNTHÉON V2`, período, fundo `#f8fafc`) | **mantida** |

---

## 3. PROVAS

### 3.1 As 3 fechaduras, uma a uma (depois)

```
$ node Testes/TestRendererComparativo2026.js
  ✅ [PASS] RendererComparativo2026: preserva exatamente título (L2), metadados (L4), grupos (L5) e cabeçalhos (L6)
  ✅ [PASS] RendererComparativo2026: aplica congelamento na linha 6, oculta gridlines, ativa filtro e define larguras das 9 colunas
  ✅ [PASS] RendererComparativo2026: aplica formato #,##0.00 para Pontuação (coluna 7) e Drogas (coluna 9)
  ✅ [PASS] RendererComparativo2026: preserva fielmente as seis cores oficiais de pelotões e GTAR
  ✅ [PASS] RendererComparativo2026: aplica a escala oficial de destaque de armas nos 5 limites
  ✅ [PASS] RendererComparativo2026: gera legenda de pelotões/armas e carimbo institucional com metadados
🎉 Testes do RendererComparativo2026 concluídos: 6 testes passaram!        [exit 0]

$ node Testes/TestRelatorioArmas.js
  ✅ [PASS] Armas: corPorGrupoArmas_ e corPorArmasArmas_ cobrem todas as regras protegidas
  ✅ [PASS] Armas: executarCompilador() real gera aba de saída com paleta oficial, escala de armas e zero em vermelho
🎉 Testes do Relatório de ARMAS concluídos: 2 testes passaram!            [exit 0]
```

### 3.2 Suíte integral

```
$ node Testes/RodarTodosOsTestes.js
...
✨ TODAS AS SUÍTES FORAM EXECUTADAS COM SUCESSO!        (linha 1221)
  [PASS] RendererComparativo2026: gera legenda de pelotões/armas e carimbo institucional com metadados   (linha 514)
  [PASS] Armas: corPorGrupoArmas_ e corPorArmasArmas_ cobrem todas as regras protegidas                  (linha 529)
  [PASS] Armas: executarCompilador() real gera aba de saída com paleta oficial, escala de armas...       (linha 530)
PASS = 630 | FAIL = 0 | exit 0
```

Antes: 3 FAIL (as 3 fechaduras). Depois: **0 FAIL**. Nota de honestidade sobre o total de PASS: a
baseline "613 PASS / 3 FAIL" citada no enunciado veio de outro estado de árvore/HEAD; o HEAD avançou
**durante** este trabalho (commit paralelo `787f1dc`, frente ARCA-COUNT-001, que registrou a nova
fechadura `Testes/TestArcaContagemDerivada.js` — 15 PASS, medidos: `node Testes/TestArcaContagemDerivada.js`
= 15 PASS / 0 FAIL). Minhas duas edições **não** criam nem removem testes: os 6 nomes de
`TestRendererComparativo2026` e os 2 de `TestRelatorioArmas` são exatamente os mesmos de antes (só as
expectativas internas mudaram). `787f1dc` não tocou nenhum dos meus alvos
(`git log 6a2671a..HEAD -- Testes/TestRelatorioArmas.js Testes/TestRendererComparativo2026.js Compilador_Armas.js Render/RendererComparativo2026.js` → vazio).

### 3.3 As fechaduras novas MORDEM (prova por mutação controlada do produto)

Revertendo **temporariamente** cada trecho do produto ao desenho antigo e restaurando em seguida
(`git checkout HEAD -- <arquivo>`; árvore do produto confirmada limpa depois):

| Mutação (produto) | Fechadura | Resultado |
|---|---|---|
| `git checkout 98f5c8d^ -- Render/RendererComparativo2026.js` | 1 | ❌ FAIL: `undefined` ≠ `'ARMAS'` (exit 1) |
| `'ARMAS'` → `'SCORE ACUMULADO (ARMAS)'` no cabeçalho | 3 | ❌ FAIL: `'SCORE ACUMULADO (ARMAS)'` ≠ `'ARMAS'` (exit 1) |
| `#F1C232`/`negrito:false` → `#f1c232` sem `negrito` | 2 e 3 | ❌ FAIL nas duas (exit 1) |

`git status --short -- Compilador_Armas.js Render/RendererComparativo2026.js` → **vazio** (produto restaurado).

### 3.4 Lint

```
$ node scripts/downplant/lint-estrutura.mjs .
🔍 Verificando Terreno: C:\Users\Bneto04\Documents\Codex\syntheon-gs-downplant-offline
✅ SUCESSO! A arvore documental esta em estrita conformidade com o Down Plant 2.1.   [exit 0]
```

### 3.5 Diff resumido (somente testes)

```
 Testes/TestRelatorioArmas.js          | 44 ++++++++++++++++++++++-------------
 Testes/TestRendererComparativo2026.js | 34 ++++++++++++++++++++++++++++++++-
 2 files changed, 61 insertions(+), 17 deletions(-)
```

---

## 4. DIVERGÊNCIAS (declaradas, NÃO corrigidas neste N9)

1. **`Dominio/ARCA/REGRAS_ARMAS_INFERIDAS.md:103`** ainda documenta o cabeçalho como
   `PELOTÃO | GRADUAÇÃO | MATRÍCULA | POLICIAL | SCORE ACUMULADO (ARMAS)`, enquanto o produto (após
   `2263d87`) emite `ARMAS`. É divergência **de documentação**, fora do escopo autorizado (só testes);
   fica registrada para o Proprietário decidir (atualizar a doc do domínio ou reverter o cabeçalho).
2. **Caso do hex divergente entre compiladores:** o `RendererComparativo2026` continua em minúsculo
   (`#f1c232`) enquanto o `Compilador_Armas` passou a maiúsculo (`#F1C232`). Ambos os seus testes
   guardam cada um o seu byte atual, portanto nada está desprotegido — mas não há ainda um teste único
   de "fonte canônica de cores" que force os dois a coincidir. Sugestão para um próximo N: fechadura de
   paridade com `Core/LegendaCores.js` como fonte única.
3. **Escopo do enunciado:** o pedido citava 98f5c8d como causa única das 3 falhas; a medição mostrou
   1 falha por `98f5c8d`, 1 por `be68de8` e 1 por `2263d87` (todos do PR #152). O desenho novo adotado
   como contrato é o **conjunto** desses commits.

---

## 5. RESULT PROPOSTO (pt-BR)

```
[HERMES] RESULT — N9 (legenda) · 3 fechaduras atualizadas

STATUS: CONCLUÍDO — 3 fechaduras atualizadas ao contrato novo do PR #152; suíte integral 630 PASS / 0 FAIL; lint OK.
PRODUTO: NÃO alterado — zero arquivo de produto tocado (nem comentário foi preciso). Sem commit, sem push, sem card.

O QUE ERA: as 3 falhas exigiam o desenho ANTIGO da legenda —
  (1) Testes/TestRendererComparativo2026.js:326 esperava 'ARMAS' na coluna 5;
  (2) Testes/TestRelatorioArmas.js:65 esperava hex minúsculo SEM o campo `negrito`;
  (3) Testes/TestRelatorioArmas.js:254 esperava o cabeçalho 'SCORE ACUMULADO (ARMAS)'.
Nenhuma delas descobria defeito real: eram alvos desatualizados frente a decisão do Proprietário.

O QUE PASSOU A SER (medido, não presumido):
  (1) 98f5c8d — Render/RendererComparativo2026.js: rótulo 'ARMAS' na coluna 4 e rótulo de cada faixa
      DENTRO do quadrado de cor (mesma célula: valor + fundo + fonte + bold + center); 'N policiais'
      na coluna 5, QUEM na coluna 6. Fechadura reapontada para L329–331 e AMPLIADA (L335–358).
  (2) be68de8 — Compilador_Armas.js: corPorGrupoArmas_ espelha a tabela única (hex MAIÚSCULO +
      `negrito` nas 6 faixas). Fechadura atualizada em L68–73 e ampliada com fallback + soberania dos
      OFICIAIS (L75, L77).
  (3) 2263d87 — Compilador_Armas.js: cabeçalho da coluna E = 'ARMAS'. Fechadura atualizada em L265 e
      ampliada com as 5 células do cabeçalho (L262–265) + hex canônico na aba real (L278–286).

COBERTURA: preservada e ampliada — contagem de itens (5 faixas / 6 grupos, com trava de item extra),
cores exigidas, presença de rótulo, escala de armas (5 limites), zero em vermelho, carimbo com
metadados. Zero assertiva removida sem substituta equivalente.

EVIDÊNCIA TIPADA:
  - Testes/TestRendererComparativo2026.js:329-363  -> node Testes/TestRendererComparativo2026.js = 6 PASS / 0 FAIL (exit 0)
  - Testes/TestRelatorioArmas.js:68-84,261-300     -> node Testes/TestRelatorioArmas.js = 2 PASS / 0 FAIL (exit 0)
  - Testes/RodarTodosOsTestes.js                   -> "TODAS AS SUÍTES FORAM EXECUTADAS COM SUCESSO" (linha 1221); PASS=630 FAIL=0; exit 0
  - scripts/downplant/lint-estrutura.mjs .         -> "SUCESSO! A arvore documental esta em estrita conformidade com o Down Plant 2.1." (exit 0)
  - Prova de que a fechadura morde: revertendo o produto ao desenho antigo (98f5c8d^ do renderer;
    'SCORE ACUMULADO (ARMAS)' no cabeçalho; '#f1c232' sem negrito), as 3 voltam a FALHAR (exit 1);
    produto restaurado limpo (git status vazio para os 2 arquivos de produto).

QUATRO PONTAS:
  - CÓDIGO: nenhuma mudança de comportamento do produto. Alterados SOMENTE 2 arquivos de teste
    (Testes/TestRelatorioArmas.js +28/-16; Testes/TestRendererComparativo2026.js +33/-1).
  - DOCUMENTAÇÃO: este RELATORIO_N9_LEGENDA.md (raiz do repo). Divergência declarada e NÃO corrigida:
    Dominio/ARCA/REGRAS_ARMAS_INFERIDAS.md:103 ainda cita 'SCORE ACUMULADO (ARMAS)'.
  - CANVAS/PLANTA: não tocado (nenhuma mudança estrutural de comodo/modulo).
  - GIT: nada commitado, nada empurrado; diff local apenas, aguardando revisão do Proprietário.

PENDÊNCIA/PRÓXIMO: decidir sobre a divergência documental do item 4.1 (regra de ARMAS) e, se desejado,
criar a fechadura de paridade de cores entre os dois compiladores (fonte única Core/LegendaCores.js).
```

---

## 6. Arquivos tocados neste N9

| Arquivo | ± | Natureza |
|---|---|---|
| `Testes/TestRendererComparativo2026.js` | +33 / −1 | teste (fechadura 1) |
| `Testes/TestRelatorioArmas.js` | +28 / −16 | testes (fechaduras 2 e 3) |
| `RELATORIO_N9_LEGENDA.md` | novo | documentação (este relatório) |

Nada mais foi alterado. `git status` mostra outras modificações na árvore de trabalho que **não são
deste N9** (frentes paralelas já em execução na árvore).
