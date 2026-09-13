# RESULT — #160 GUARD-D7-001 (identidade unitaria da ocorrencia + 2 diagnosticos)

**Task:** GUARD-D7-001 | **Issue:** #160 | **Branch/HEAD:** `sprint/g01-guardiao-qualidade-live-001` / `8421544`
**Papel:** Operario executor (Hermes) | **Estado:** RESULT_PENDING_AUDIT — o Planner audita e fecha.
**Autorizacao:** ordem direta do PROPRIETARIO (card #160) — regra de dominio "1 ocorrencia = 1 MIKE".
**Auto-atestado:** os numeros abaixo foram medidos pelo proprio executor (suite, lint, leitura read-only da
planilha e runner do Guardiao). Nao houve verificacao independente.
**Sem commit, sem push, sem postagem no GitHub; planilha nao alterada.**

## O que foi entregue

1. **Regra nova na ARCA:** `ARCA-OCORRENCIA-007` — *"Identidade Unitaria da Ocorrencia: 1 Ocorrencia = 1 MIKE"*
   (subdominio `ocorrencia`, `INTERNAL_OPERATIONAL_RULE`, `INTERNAL_SOURCE_CONFIRMED`, `COBERTO`),
   `auditabilidade_guardiao: MAPEADO` com os dois codigos. Nao colide com os 48 `rule_id` existentes.
2. **Dois diagnosticos no Guardiao** (deteccao + apontamento, **sem correcao automatica do dado**):
   - `OCORRENCIA_FRAGMENTADA_POR_DATA` — mesmo MIKE canonico + mesmo BOE em datas distintas (ALERTA).
   - `MIKE_FORMATO_NAO_CANONICO_OU_DUPLICADO` — mesmo BOE com o MIKE em grafias diferentes (ALERTA).
3. **7 testes novos** em `Testes/TestGuardiao.js` (2 positivos + 5 negativos), **nascidos VERMELHOS**.
4. **Runner read-only** contra os 2 casos reais: `scripts/diagnostico-identidade-ocorrencia-160.js`.
5. **`RELATORIO_DE_DIFERENCIAS_160.md`** na raiz, com antes/depois e o procedimento de leitura somente-leitura.

## Evidencia tipada (arquivo:linha)

| Arquivo:linha / bloco | O que prova |
|---|---|
| `Core/RegrasQualidade.js:490` — `static validarIdentidadeOcorrencia(mikesMapa)` | nucleo dos 2 diagnosticos (bloco (a) fragmentacao por DATA; bloco (b) grafia divergente) |
| `Features/GuardiaoQualidade.js:471-480` | ligacao no motor do Guardiao, logo apos `validarCoerenciaCruzadaMikes` |
| `Dominio/ARCA/AdaptadorConsultaArca.js:44-45` | `OCORRENCIA_FRAGMENTADA_POR_DATA` / `MIKE_FORMATO_NAO_CANONICO_OU_DUPLICADO` → `ARCA-OCORRENCIA-007` |
| `Dominio/ARCA/arca_regras_dominio.json` — ultimo item de `regras[]` + `meta.cobertura_reconciliacao` | regra nova + mapeadas 32→33 + id em `regras_adicionadas`/`regras_adicionadas_total` |
| `Dominio/ARCA/ARCA_REGRAS_DOMINIO.md` — `### [ARCA-OCORRENCIA-007]` | secao humana com `Consumidores (reconciliado #125):` |
| `Dominio/ARCA/ARCA_FONTES.md` / `ARCA_COBERTURA.md` | fontes + registro #160 |
| `Testes/TestGuardiao.js` — bloco `#160 ...` | os 7 cenarios |
| `Testes/TestArcaConsumidores.js:34`, `Testes/TestArcaMapaCobertura.js:93,96,98,105` | literais 49 / 33 / 14 |
| `scripts/diagnostico-identidade-ocorrencia-160.js` + `Testes/Fixtures/casos_reais_160.json` | prova contra JUN2026 linhas 128-138 e JAN2026 linhas 69-72 |

## Testes e lint (saidas reais)

**Vermelho (antes da implementacao — so os testes):**
```
$ node Testes/TestGuardiao.js
  ❌ [FAIL] #160 OCORRENCIA_FRAGMENTADA_POR_DATA: mesma ocorrencia (MIKE+BOE) em duas DATAS aponta cada linha: AssertionError: deve apontar as 3 linhas da MESMA identidade (MIKE+BOE)
  ❌ [FAIL] #160 MIKE_FORMATO_NAO_CANONICO_OU_DUPLICADO: mesmo BOE com MIKE em dois formatos aponta cada linha: AssertionError: deve apontar as 4 linhas do mesmo BOE
🎉 Testes do Guardião da Qualidade concluídos: 58 testes passaram!   (exit=1, FAIL=2; 53 pre-existentes + 5 negativos novos)
```

**Verde (depois):**
```
$ node Testes/TestGuardiao.js
🎉 Testes do Guardião da Qualidade concluídos: 60 testes passaram!   (58 + 2 positivos agora verdes)

$ node Testes/TestArcaConsumidores.js            -> RESULTADOS FINAIS: 9 PASS / 0 FAIL
$ node Testes/TestArcaMapaCobertura.js           -> RESULTADOS FINAIS: 11 PASS / 0 FAIL
$ node Testes/TestIntegracaoArca.js              -> 7 testes passaram
```

**Suite integral:**
```
$ node Testes/RodarTodosOsTestes.js
ANTES:  PASS=605  FAIL=3      (FAIL: RendererComparativo2026 legenda + 2 de Armas)
DEPOIS: PASS=612  FAIL=3      (as MESMAS 3 falhas pre-existentes; delta +7 PASS / +0 FAIL)
   Obs.: a suite Vigia/Telegram tem um teste intermitente PRE-EXISTENTE
   ("Teste O: /antigravity, sufixo @botname e aliases aceitos com sucesso.") que aparece em algumas
   execucoes e nao em outras (nao vira FAIL, apenas nao emite [PASS]) -> o total oscila em +/-1
   (612 ou 613). A comparacao valida e 605 + 7 = 612.
```

**Lint:**
```
$ node scripts/downplant/lint-estrutura.mjs
✅ SUCESSO! A arvore documental esta em estrita conformidade com o Down Plant 2.1.   (exit 0)
```

**Prova contra os 2 casos reais (read-only, exit 0):**
```
$ node scripts/diagnostico-identidade-ocorrencia-160.js
--- (a) JUN2026 — [OCORRENCIA_FRAGMENTADA_POR_DATA] ALERTA | linha 128..138 | ARCA-OCORRENCIA-007  (11 diag)
--- (b) JAN2026 — [MIKE_FORMATO_NAO_CANONICO_OU_DUPLICADO] ALERTA | linha 69..72 | ARCA-OCORRENCIA-007  (4 diag)
TOTAL: 15 diagnosticos | os dois casos reais foram detectados e apontados (linha + celula)
```

## Lista dos identificadores criados

- `rule_id`: **`ARCA-OCORRENCIA-007`**
- diagnosticos: **`OCORRENCIA_FRAGMENTADA_POR_DATA`**, **`MIKE_FORMATO_NAO_CANONICO_OU_DUPLICADO`**
- (nenhum codigo existente foi renomeado ou removido)

## Quatro pontas

```
CODE_STATE:       ALINHADO   (RegrasQualidade.validarIdentidadeOcorrencia + ligacao no Guardiao + porta ARCA)
DOC_STATE:        ALINHADO   (ARCA JSON + ARCA_REGRAS_DOMINIO.md + ARCA_FONTES.md + ARCA_COBERTURA.md + relatorio)
CANVAS_STATE:     NAO_APLICAVEL (sem no/porta/comodo novo; ARCA ja enderecada em 02_Comodos/C03_Dominio)
GIT_STATE:        PENDENTE   (10 arquivos rastreados alterados + 2 novos; NAO commitado por regra do card)
```

---

## Texto proposto do RESULT (pt-BR) para publicar no card #160

```markdown
[HERMES] RESULT — #160

STATUS: RESULT_PENDING_AUDIT (executado; sem commit, sem push, sem postagem, planilha nao alterada)
AUTORIZACAO: ordem direta do PROPRIETARIO (regra de dominio "1 ocorrencia = 1 MIKE")
AUTO-ATESTADO: numeros medidos pelo proprio executor; sem verificacao independente.

1) REGRA NOVA NA ARCA
- rule_id: ARCA-OCORRENCIA-007 — "Identidade Unitaria da Ocorrencia: 1 Ocorrencia = 1 MIKE"
- subdominio ocorrencia | INTERNAL_OPERATIONAL_RULE | INTERNAL_SOURCE_CONFIRMED | COBERTO
- auditabilidade_guardiao: MAPEADO, codigos [OCORRENCIA_FRAGMENTADA_POR_DATA, MIKE_FORMATO_NAO_CANONICO_OU_DUPLICADO]
- nao colide: os 48 rule_id existentes foram conferidos antes da escolha (ARCA-OCORRENCIA-001..006 entre eles)
- 5 pontos da ARCA atualizados na mesma passada:
  Dominio/ARCA/arca_regras_dominio.json (regra + meta: mapeadas 32->33, id em regras_adicionadas e regras_adicionadas_total)
  Dominio/ARCA/AdaptadorConsultaArca.js:44-45 (os 2 codigos -> ARCA-OCORRENCIA-007)
  Dominio/ARCA/ARCA_REGRAS_DOMINIO.md (secao ### [ARCA-OCORRENCIA-007] + bloco de metricas recontado do JSON)
  Dominio/ARCA/ARCA_FONTES.md (id presente) | Dominio/ARCA/ARCA_COBERTURA.md (registro #160)
  Testes/TestArcaConsumidores.js:34 + Testes/TestArcaMapaCobertura.js:93,96,98,105 (literais 49 / 33 / 14)

2) OS DOIS DIAGNOSTICOS (detecta + explica + aponta; NAO corrige)
- OCORRENCIA_FRAGMENTADA_POR_DATA (ALERTA / SEMANTICA)
  gatilho: mesma identidade de ocorrencia (MIKE canonico = so digitos + BOE) em >1 DATA
  aponta: linha real da aba + evidencia nomeando MIKE coluna E, BOE coluna G, DATA coluna B
  mensagem cita a regra ("1 ocorrencia = 1 MIKE"), as datas e quantas chaves DATA|MIKE|BOE foram geradas
- MIKE_FORMATO_NAO_CANONICO_OU_DUPLICADO (ALERTA / SINTATICA)
  gatilho: mesmo BOE com o MIKE em >1 grafia (mesmos digitos, pontuacao diferente)
  aponta: linha real da aba + as duas grafias + os digitos de identidade
- nucleo: Core/RegrasQualidade.js:471 (validarIdentidadeOcorrencia)
- ligacao no motor: Features/GuardiaoQualidade.js:471
- mapa de diagnostico: Dominio/ARCA/AdaptadorConsultaArca.js (MAPA_DIAGNOSTICO_ARCA)
- anti-falso-positivo: sem BOE nao dispara (BOE_AUSENTE tem codigo proprio); ocorrencias distintas nao
  colidem; mesmo MIKE em datas distintas com BOEs diferentes segue em MIKE_DATAS_DIVERGENTES/MIKE_BOE_DIVERGENTE

3) TESTES — nasceu VERMELHO e ficou verde
- ANTES (so os testes): node Testes/TestGuardiao.js -> exit 1, 2 [FAIL]
  "#160 OCORRENCIA_FRAGMENTADA_POR_DATA ... deve apontar as 3 linhas da MESMA identidade (MIKE+BOE)"
  "#160 MIKE_FORMATO_NAO_CANONICO_OU_DUPLICADO ... deve apontar as 4 linhas do mesmo BOE"
- DEPOIS: node Testes/TestGuardiao.js -> 60 testes passaram (antes do card: 53; no run vermelho: 58 passando + 2 FAIL)
- TestArcaConsumidores 9 PASS / 0 FAIL | TestArcaMapaCobertura 11 PASS / 0 FAIL | TestIntegracaoArca 7/7
- Suite integral: ANTES 605 PASS / 3 FAIL -> DEPOIS 612 PASS / 3 FAIL (as 3 falhas sao as pre-existentes de
  legenda/renderer/armas; delta +7 PASS / +0 FAIL). O total oscila em +/-1 por um teste intermitente
  PRE-EXISTENTE da suite Vigia/Telegram ("Teste O: /antigravity, sufixo @botname e aliases aceitos com
  sucesso."), que nao vira FAIL — apenas nao emite [PASS] em algumas execucoes. Nenhum codigo de ponte foi tocado.
- Lint: node scripts/downplant/lint-estrutura.mjs -> exit 0
- 7 testes no total: 2 positivos + 5 negativos (DATA unica, ocorrencias distintas, BOEs diferentes,
  grafia unica, sem BOE) + as asserts de mensagem/linha/arca dentro dos positivos
- (TestGuardiao antes->depois: 53 -> 60 passando; no run vermelho eram 58 = 53 + 5 negativos novos)

4) CASOS REAIS (medidos hoje, leitura SOMENTE-LEITURA da planilha)
- (a) JUN2026 BOE 26E0321002656 / MIKE 202606231855084437: bloco de 11 linhas (128-138) com a DATA mudando
  em 23/06 (128-136) e 24/06 (137-138) -> OCORRENCIA_FRAGMENTADA_POR_DATA em 11 linhas.
  Nota: o card cita "linhas 128-133"; a medicao mostra o bloco em 128-138 (fato do card confere, a extensao e maior).
- (b) JAN2026 BOE 26E0127000512: dia 17/01/2026 com o MIKE em duas grafias ('2.026.117.021.535' linhas 69-70 e
  '2026117021535' linhas 71-72) -> MIKE_FORMATO_NAO_CANONICO_OU_DUPLICADO em 4 linhas.
- runner read-only: node scripts/diagnostico-identidade-ocorrencia-160.js -> exit 0, 15 diagnosticos, os dois
  casos detectados e apontados por linha/celula. Nao abre a planilha e nao escreve nada (consome
  Testes/Fixtures/casos_reais_160.json, cujo cabecalho registra os comandos de leitura).
- NENHUM dado foi corrigido: o Guardiao so aponta; quem normaliza e o MOD-C05-02 sob CONFIRM_AUTO/dry-run.

QUATRO PONTAS
CODE_STATE:    ALINHADO   (Core/RegrasQualidade.js + Features/GuardiaoQualidade.js + AdaptadorConsultaArca.js)
DOC_STATE:     ALINHADO   (ARCA JSON + 3 MD + RELATORIO_DE_DIFERENCIAS_160.md)
CANVAS_STATE:  NAO_APLICAVEL (sem no/porta/comodo novo)
GIT_STATE:     PENDENTE   (alteracoes nao commitadas por regra do card)

ARQUIVOS
rastreados alterados (10): Core/RegrasQualidade.js, Features/GuardiaoQualidade.js,
  Dominio/ARCA/{arca_regras_dominio.json, AdaptadorConsultaArca.js, ARCA_REGRAS_DOMINIO.md, ARCA_FONTES.md,
  ARCA_COBERTURA.md}, Testes/{TestGuardiao.js, TestArcaConsumidores.js, TestArcaMapaCobertura.js}
novos (3): RELATORIO_DE_DIFERENCIAS_160.md, scripts/diagnostico-identidade-ocorrencia-160.js,
  Testes/Fixtures/casos_reais_160.json
novo (estado): agentic/state/RESULT_160_GUARD_D7_001.md

LIMITES DECLARADOS
- Nao houve commit/push/deploy: o codigo novo so passa a valer no Apps Script apos clasp push; ate la a
  planilha roda o codigo anterior.
- Os dois defeitos continuam gravados na planilha (o card proibe autocorrecao).
- Nao houve verificacao independente (auto-atestado).
```
