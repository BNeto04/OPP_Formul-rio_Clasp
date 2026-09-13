# RELATORIO DE DIFERENCAS - #160 (GUARD-D7-001)

**Card:** #160 - *[GUARD-D7-001] Regra 1 ocorrencia = 1 MIKE + diagnosticos das duas anomalias reais* (Pai: #57).
**Repo canonico:** `C:\Users\Bneto04\Documents\Codex\syntheon-gs-downplant-offline`
**Branch / HEAD no momento do registro:** `sprint/g01-guardiao-qualidade-live-001` / `8421544`
**Data:** 2026-09-13
**Regra dura respeitada:** **zero mutacao de dado**. O Guardiao apenas **detecta, explica e aponta**
(Regra do Guardiao). Nao houve commit, push nem postagem no GitHub; a planilha OCORRENCIAS foi lida
**somente-leitura** e **nao foi alterada**.

---

## 1. O que o card pediu e o que foi entregue

| Pedido do card | Entrega |
|---|---|
| Registrar na ARCA a regra de dominio "1 ocorrencia = 1 MIKE" | `ARCA-OCORRENCIA-007` (JSON + MD + FONTES + COBERTURA + meta) |
| Guardiao emitir diagnostico de fragmentacao por DATA | `OCORRENCIA_FRAGMENTADA_POR_DATA` (ALERTA) |
| Guardiao emitir diagnostico de MIKE em formatos divergentes | `MIKE_FORMATO_NAO_CANONICO_OU_DUPLICADO` (ALERTA) |
| Nao autocorrigir dado historico e nao inventar fusao | Nenhuma escrita de celula pelo Guardiao; correcao e do MOD-C05-02 sob CONFIRM_AUTO/dry-run |
| Testes com os dois fixtures factuais e negativos | 7 testes novos no `TestGuardiao.js` (2 positivos + 5 negativos), nascidos **vermelhos** |
| DONE: rule_id canonico + diagnosticos mapeados + cobertura/testes verdes + zero falso positivo | Cumprido (secao 6) |

---

## 2. Antes x Depois (medido, nao estimado)

| Artefato | ANTES | DEPOIS | Como foi medido |
|---|---|---|---|
| `Dominio/ARCA/arca_regras_dominio.json` - total de regras | 48 | **49** | `node -e "require('./Dominio/ARCA/arca_regras_dominio.json').regras.length"` |
| Auditabilidade no Guardiao | MAPEADO 32 / INTEGRADO 8 / NAO_APLICAVEL 8 | **MAPEADO 33** / INTEGRADO 8 / NAO_APLICAVEL 8 | recontagem por `auditabilidade_guardiao.status` |
| Codigos de diagnostico novos | 0 | **2** | `TestArcaMapaCobertura` (nenhum codigo sem regra ARCA) |
| `TestGuardiao.js` | 53 testes passando | **60 testes passando** | `node Testes/TestGuardiao.js` |
| Suite integral | 605 PASS / 3 FAIL | **612 PASS / 3 FAIL** | `node Testes/RodarTodosOsTestes.js` (contado por `[PASS]`/`[FAIL]`) |
| Lint estrutural | exit 0 | **exit 0** | `node scripts/downplant/lint-estrutura.mjs` |

**As 3 falhas sao pre-existentes e nao foram tocadas por este card:** `RendererComparativo2026` (legenda) e
duas de `Armas` (paleta/legenda). O delta da suite e **+7 PASS / +0 FAIL** — exatamente os 7 testes novos.

**Atencao a um flake PRE-EXISTENTE (nao e deste card):** a suite Vigia/Telegram tem um teste intermitente
(`Teste O: /antigravity, sufixo @botname e aliases aceitos com sucesso.`) que aparece em algumas execucoes e
nao em outras — nao conta como FAIL, apenas nao emite `[PASS]`. Isso faz o total oscilar em ±1 (612 numa
execucao, 613 na outra). O baseline medido antes deste card tambem caiu no lado sem o flake (605);
a comparacao valida e **605 + 7 = 612**. Nenhum codigo de ponte foi tocado por este card.

---

## 3. A regra nova na ARCA

**`rule_id: ARCA-OCORRENCIA-007`** — *"Identidade Unitaria da Ocorrencia: 1 Ocorrencia = 1 MIKE"*
(subdominio `ocorrencia`, categoria `IDENTIDADE_OCORRENCIA`, `INTERNAL_OPERATIONAL_RULE`,
`fonte_status: INTERNAL_SOURCE_CONFIRMED`, `status_cobertura: COBERTO`).

- **Nao colide:** os `rule_id` existentes foram conferidos antes da escolha (48 ids, `ARCA-OCORRENCIA-001..006`
  entre eles); `ARCA-OCORRENCIA-007` estava livre e segue a familia `ocorrencia` (a chave do tunel).
- **Fonte:** decisao do proprietario (13/09/2026) registrada no card #160 — "1 ocorrencia = 1 MIKE; nao existe
  ocorrencia dividida entre MIKEs; D7 A/B/C e NAO_APLICAVEL" — mais o contrato arquitetural da chave
  canonica `DATA|MIKE|BOE` (`Core/RegrasQualidade.js:chaveTunel`).
- **Tipo disciplinado:** `INTERNAL_OPERATIONAL_RULE` (nunca `OFFICIAL_BUSINESS_RULE` sem fonte oficial), como
  exige `TestArcaMapaCobertura`.
- **Auditabilidade:** `MAPEADO` com `codigos: [OCORRENCIA_FRAGMENTADA_POR_DATA, MIKE_FORMATO_NAO_CANONICO_OU_DUPLICADO]`
  e `INDIRECT_CONSUMER` real (`Core/CoberturaAuditoria.js`, `Render/PainelSaude.js`,
  `Render/RendererAuditoriaSaude.js`).
- **5 pontos da ARCA atualizados na MESMA passada** (conforme `references/arca-mapa-e-governanca.md`):

| Artefato | Mudanca |
|---|---|
| `Dominio/ARCA/arca_regras_dominio.json` | regra nova + `meta.cobertura_reconciliacao` (mapeadas 32→33, id anexado em `regras_adicionadas` **e** `regras_adicionadas_total`, nota `card_160`) |
| `Dominio/ARCA/AdaptadorConsultaArca.js` | `OCORRENCIA_FRAGMENTADA_POR_DATA` e `MIKE_FORMATO_NAO_CANONICO_OU_DUPLICADO` → `ARCA-OCORRENCIA-007` |
| `Dominio/ARCA/ARCA_REGRAS_DOMINIO.md` | secao `### [ARCA-OCORRENCIA-007]` com a linha `Consumidores (reconciliado #125):` + bloco de metricas recontado do JSON |
| `Dominio/ARCA/ARCA_FONTES.md` | tabela de fontes com o id `ARCA-OCORRENCIA-007` |
| `Dominio/ARCA/ARCA_COBERTURA.md` | registro do #160; subdominio `OCORRENCIA` permanece `COBERTO` |
| `Testes/TestArcaConsumidores.js` / `TestArcaMapaCobertura.js` | literais pinados: total 48→49, MAPEADO 32→33, soma 48→49, `regras_adicionadas_total` 13→14 |

---

## 4. Os dois diagnosticos

| | `OCORRENCIA_FRAGMENTADA_POR_DATA` | `MIKE_FORMATO_NAO_CANONICO_OU_DUPLICADO` |
|---|---|---|
| **Gatilho** | mesma identidade de ocorrencia (**MIKE canonico = so digitos** + **BOE**) em **>1 DATA** | mesmo **BOE** com o MIKE em **>1 grafia** (mesmos digitos, pontuacao diferente) |
| **Severidade** | `ALERTA` | `ALERTA` |
| **Camada** | `SEMANTICA` | `SINTATICA` |
| **Aponta** | `linha` (numero real da aba) + `evidencia` nomeando **MIKE coluna E / BOE coluna G / DATA coluna B** | `linha` (numero real da aba) + `evidencia` nomeando **MIKE coluna E** |
| **Explica** | cita a regra ("1 ocorrencia = 1 MIKE"), as datas encontradas e quantas chaves `DATA\|MIKE\|BOE` foram geradas | cita as duas grafias, os digitos de identidade e que a pontuacao nao cria ocorrencia nova |
| **Nao faz** | nao escolhe data, nao reagrupa bloco, nao corrige celula | nao reescreve o MIKE, nao funde ocorrencias |
| **No mapa do Guardiao** | `AdaptadorConsultaArca.MAPA_DIAGNOSTICO_ARCA['OCORRENCIA_FRAGMENTADA_POR_DATA'] = 'ARCA-OCORRENCIA-007'` | idem para `MIKE_FORMATO_NAO_CANONICO_OU_DUPLICADO` |
| **Nucleo** | `Core/RegrasQualidade.js:validarIdentidadeOcorrencia` (bloco (a)) | mesmo metodo, bloco (b) |
| **Ligacao no motor** | `Features/GuardiaoQualidade.js` (logo apos `validarCoerenciaCruzadaMikes`) | idem |

**Anti-falso-positivo (decisoes explicitas):**
1. **Sem BOE nao dispara** — a identidade da ocorrencia fica incompleta e a ausencia de BOE tem codigo proprio
   (`BOE_AUSENTE` / ARCA-BOE-002). Sem isso, todo tunel sem BOE viraria falso positivo dos dois codigos.
2. **Ocorrencias distintas nao se tocam** — a identidade exige o MESMO MIKE canonico **e** o MESMO BOE; duas
   ocorrencias legitimas tem MIKEs distintos e nao colidem.
3. **Mesmo MIKE em datas distintas com BOEs diferentes nao e fragmentacao por identidade** — segue coberto por
   `MIKE_DATAS_DIVERGENTES` (ARCA-MIKE-002) e `MIKE_BOE_DIVERGENTE` (ARCA-BOE-001), que continuam ativos.
4. **A pontuacao e o unico diferencial aceito no (b)** — dois MIKEs com digitos diferentes permanecem
   ocorrencias distintas (nao ha normalizacao de valor, nunca de identidade).

**Relacao com o que ja existia:** `MIKE_DATAS_DIVERGENTES` (mesmo MIKE em datas diferentes, independente de BOE)
continua sendo a regra generica de ARCA-MIKE-002; o codigo novo e mais **estrito** (ancora na identidade
MIKE+BOE) e e o texto que enuncia a regra do proprietario no proprio alerta que o operador le na planilha.
O caso (b) nao era coberto por nenhum codigo anterior: cada MIKE (grafia) formava sua propria entrada em
`mikesMapa` e nao havia checagem cruzada por BOE.

---

## 5. O teste nasceu VERMELHO e ficou verde

Os 7 testes foram escritos e rodados **antes** da implementacao:

- **ANTES (vermelho):** `node Testes/TestGuardiao.js` → `exit=1`, `2 [FAIL]` nos dois testes positivos
  - `#160 OCORRENCIA_FRAGMENTADA_POR_DATA: mesma ocorrencia (MIKE+BOE) em duas DATAS aponta cada linha: AssertionError: deve apontar as 3 linhas da MESMA identidade (MIKE+BOE)`
  - `#160 MIKE_FORMATO_NAO_CANONICO_OU_DUPLICADO: mesmo BOE com MIKE em dois formatos aponta cada linha: AssertionError: deve apontar as 4 linhas do mesmo BOE`
  - os 5 negativos passavam trivialmente (nao havia codigo para disparar) — sao justamente os que impedem o falso positivo.
  - total da suite do Guardiao naquele momento: `58 testes passaram` (53 pre-existentes + 5 negativos novos).
- **DEPOIS (verde):** `node Testes/TestGuardiao.js` → `60 testes passaram` (53 pre-existentes + 7 novos).

**Matriz de cenarios (nome do teste diz cenario + resultado esperado):**

| # | Cenario | Esperado | Resultado |
|---|---|---|---|
| 1 | mesma identidade (MIKE+BOE) em 2 datas | 3 diagnosticos, linhas 2/3/4, severidade ALERTA, mensagem cita as datas e a regra, `arca.rule_id = ARCA-OCORRENCIA-007` | PASS |
| 2 | mesma identidade com DATA unica | 0 | PASS |
| 3 | ocorrencias DISTINTAS (MIKE e BOE proprios) em datas distintas | 0 dos dois codigos | PASS |
| 4 | mesmo MIKE em 2 datas com BOEs diferentes | 0 do codigo novo; `MIKE_BOE_DIVERGENTE` e `MIKE_DATAS_DIVERGENTES` continuam ativos | PASS |
| 5 | mesmo BOE com MIKE em 2 formatos | 4 diagnosticos, linhas 2/3/4/5, mensagem cita as 2 grafias e os digitos | PASS |
| 6 | mesmo BOE com grafia unica | 0 | PASS |
| 7 | sem BOE (identidade incompleta) | 0 dos dois codigos | PASS |

**Cobertura ARCA:** `TestArcaConsumidores 9/0`, `TestArcaMapaCobertura 11/0`, `TestIntegracaoArca 7/7`.

---

## 6. Como rodar o diagnostico contra os 2 casos REAIS (somente-leitura)

### 6.1 Os dois casos medidos hoje (leitura read-only)

| Caso | Aba | BOE | MIKE | Defeito medido |
|---|---|---|---|---|
| (a) | JUN2026 | `26E0321002656` | `202606231855084437` | mesmas MIKE+BOE em **duas DATAS**: linhas **128-136** = 23/06/2026 e linhas **137-138** = 24/06/2026 (bloco de 11 linhas) |
| (b) | JAN2026 | `26E0127000512` | `2.026.117.021.535` (linhas 69-70) e `2026117021535` (linhas 71-72) | mesmo dia (17/01/2026) com o MIKE em **duas grafias** |

> Nota factual: o card cita "linhas 128-133" para o caso (a). A medicao de hoje mostra o bloco em **11 linhas**
> (128-138), com a DATA mudando na linha 137. O fato do card (mesmo MIKE/BOE em duas datas) confere; a extensao
> do bloco e que e maior que o intervalo citado.

Comandos usados (rota read-only, service account / `spreadsheets.readonly` — a planilha nao e aberta para escrita):

```bash
PY="C:/Users/Bneto04/AppData/Local/hermes/hermes-agent/venv/Scripts/python.exe"
S="<hermes>/skills/autonomous-ai-agents/syntheon-ecosystem/scripts/ler_planilha_sa.py"
"$PY" "$S" valores "JUN2026!A126:G140"
"$PY" "$S" valores "JAN2026!A66:G75"
```

### 6.2 Rodando o MOTOR REAL do Guardiao sobre esses casos

```bash
cd C:/Users/Bneto04/Documents/Codex/syntheon-gs-downplant-offline
node scripts/diagnostico-identidade-ocorrencia-160.js
# exit 0 esperado
```

O runner **nao abre a planilha e nao escreve nada**: ele consome o snapshot
`Testes/Fixtures/casos_reais_160.json` (proveniencia e comandos de leitura registrados no proprio arquivo),
remonta as linhas do bloco nas **mesmas linhas da aba** (para o numero apontado ser o real) e chama
`GuardiaoQualidade.varrerAba` com a fabrica de mock do proprio `TestGuardiao` (extraida por balanceamento de
chaves — nenhum mock paralelo, nenhum leitor novo). Saida real resumida:

```
--- #160 GUARD-D7-001 (a) | aba JUN2026 — mesmo MIKE + mesmo BOE em DUAS DATAS
    linhas reais do bloco: 128, 129, ..., 138
    [OCORRENCIA_FRAGMENTADA_POR_DATA] ALERTA | linha 128 | ARCA-OCORRENCIA-007
    ... (11 diagnosticos, linhas 128 a 138)
    >> OK: 11 diagnostico(s) — apenas o(s) codigo(s) esperado(s).

--- #160 GUARD-D7-001 (b) | aba JAN2026 — mesmo BOE com MIKE em DOIS FORMATOS
    linhas reais do bloco: 69, 70, 71, 72
    [MIKE_FORMATO_NAO_CANONICO_OU_DUPLICADO] ALERTA | linha 69 | ARCA-OCORRENCIA-007
    ... (4 diagnosticos, linhas 69 a 72)
    >> OK: 4 diagnostico(s) — apenas o(s) codigo(s) esperado(s).

TOTAL de diagnosticos de identidade emitidos nos 2 casos reais: 15
RESULTADO: os dois casos reais foram detectados e apontados (linha + celula).
```

Para **reler** os dados medidos (atualizar o snapshot), use a rota read-only da secao 6.1 e substitua as linhas
em `Testes/Fixtures/casos_reais_160.json`; o runner revalida sozinho e retorna exit ≠ 0 se a deteccao mudar.

---

## 7. Evidencia: arquivos e linhas

| Arquivo | Linha/Bloco | O que esta la |
|---|---|---|
| `Core/RegrasQualidade.js` | metodo `validarIdentidadeOcorrencia` (blocos (a) e (b)) | nucleo dos dois diagnosticos |
| `Features/GuardiaoQualidade.js` | apos `validarCoerenciaCruzadaMikes` | ligacao do invariante no motor (distribui por `alertasPorLinha[linha-2]`) |
| `Dominio/ARCA/AdaptadorConsultaArca.js` | bloco "Dominio: Ocorrencia / Tunel" | os 2 codigos → `ARCA-OCORRENCIA-007` |
| `Dominio/ARCA/arca_regras_dominio.json` | ultimo elemento de `regras[]` + `meta.cobertura_reconciliacao` | regra + recontagem |
| `Dominio/ARCA/ARCA_REGRAS_DOMINIO.md` | `### [ARCA-OCORRENCIA-007]` | secao reconciliada com a linha `Consumidores (reconciliado #125):` |
| `Dominio/ARCA/ARCA_FONTES.md` | bloco "Fontes da regra adicionada pelo card #160" | id presente (exigido pelo guard) |
| `Testes/TestGuardiao.js` | bloco `#160 ...` (7 testes) | prova vermelho→verde |
| `Testes/TestArcaConsumidores.js` / `TestArcaMapaCobertura.js` | literais pinados | 49 / 33 / 14 |
| `scripts/diagnostico-identidade-ocorrencia-160.js` | runner read-only | prova contra os 2 casos reais |
| `Testes/Fixtures/casos_reais_160.json` | snapshot com proveniencia | linhas reais 128-138 e 69-72 |

---

## 8. Quatro pontas

| Ponta | Estado | Nota |
|---|---|---|
| **CODIGO** | ALINHADO | `RegrasQualidade.validarIdentidadeOcorrencia` + ligacao no Guardiao + porta ARCA; suite 612 PASS / 3 FAIL (as 3 pre-existentes; ±1 por flake pre-existente da suite Vigia) |
| **DOCUMENTACAO** | ALINHADO | ARCA (JSON + 3 MD + FONTES/COBERTURA), este relatorio e o RESULT em `agentic/state/` |
| **CANVAS / PLANTA** | NAO_APLICAVEL | nenhum no/porta/comodo novo; a ARCA ja tem endereco no cofre (`02_Comodos/C03_Dominio/...MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO`) |
| **GIT** | PENDENTE | alteracoes **nao commitadas** por regra do card (sem commit, sem push, sem postagem) |

---

## 9. Limites e divergencias declarados

1. **Nao houve commit, push, deploy nem postagem.** O `RESULT` proposto esta em
   `agentic/state/RESULT_160_GUARD_D7_001.md` para o Planner publicar.
2. **Nada foi corrigido na planilha.** Os dois defeitos continuam gravados como estao; quem normaliza e o
   MOD-C05-02 (Normalizador) sob `CONFIRM_AUTO`/dry-run, com confirmacao humana.
3. **Nao ha prova no remoto Apps Script.** O delta de `.js` (`Core/RegrasQualidade.js`,
   `Features/GuardiaoQualidade.js`, `Dominio/ARCA/AdaptadorConsultaArca.js`) so passa a valer na planilha apos
   `clasp push`. Enquanto nao houver push, o Google Sheets continua rodando o codigo ANTERIOR — nao procurar
   defeito novo no codigo antes disso.
4. **O caso (b) medido tem 4 linhas (69-72), nao 2.** As duas grafias de MIKE se repetem em duas linhas cada
   (69-70 e 71-72); o diagnostico aponta as quatro.
5. **Auto-atestado.** Os numeros deste relatorio foram medidos pelo proprio executor nesta maquina
   (suite, lint, leitura read-only da planilha, runner do Guardiao). Nao houve verificacao independente.
6. **Texto do RESULT e proposto** — nao foi publicado no GitHub (proibido pelo card).
