# ESTADO DA FILA PARA AUDITORIA — índice factual (para o Planner)

**Data**: 2026-09-12 · **Branch**: `sprint/g01-guardiao-qualidade-live-001` · **HEAD**: `58f8bcb` (local == remoto)
**Origem**: pedido do proprietário — *"o próximo passo do meu V deve ser auditar esses RESULTs novos e separar em três grupos"*.

---

## 1. RESULTs disponíveis para auditoria

| Card | Arquivo em `agentic/state/` | Commit | O que prova |
|---|---|---|---|
| **#117** | `RESULT_117_G01_005.md` + 2 adendos | `ebceab0`, `997667e` | 15/15 gates: 13 provados, 2 dispensados por decisão do proprietário |
| **#143** | `RESULT_143_OCR_P3_009.md` | `d657bc8` (fix `ee543bd`) | defeito de falha silenciosa provado + corrigido + **validado por uso real do dono** |
| **#122 / #133 / #139** | `RESULT_LOTE_122_133_139.md` | `58f8bcb` | gates de código verdes; gate live dispensado |
| **#145** | `RESULT_145_ARCA_GUARD_001.md` | `60939f1` | 3 regras ARCA registradas; catálogo 45→48 |
| **#146 / #147** | `RESULT_146_ARCA_GUARD_002.md`, `RESULT_147_ARCA_GUARD_003.md`, `RESULT_146_147_ARCA_GUARD_002_003.md` | `c60aeea`, `f42d1ea` | diagnósticos `ORDEM_ANTIGUIDADE_EQUIPE` e `QTD_O_DIVERGENTE` |
| **#148** | `RESULT_148_ARCA_GUARD_004.md`, `RESULT_CORRECAO_145_146_148_CLASP.md` | `03f82fd`, `f0e7c91`, `7e69c6a` | prova ARMA x QDT ARMAS (múltiplos cenários) |
| **#149** | `RESULT_149_ARCA_GUARD_005.md` | `266a7db`, `d49c391` | `AIS_AUSENTE`/`AIS_DIVERGENTE` sem falso positivo |
| **#151** | (RESULT nos comentários do card) | — | board 149 → 23 |
| — | `RESULT_REMEDIACAO_AUDITORIA_20260912.md` | `323c7a3` | auditoria do repo: labels/assignees/default branch |

---

## 2. Triagem sugerida (sujeita à sua auditoria)

### 🟢 Grupo 1 — homologável / fechável agora
`#145`, `#146`, `#147`, `#148`, `#149` — RESULT individual + prova + CLASP validado no remoto
`#143` — resolvido no código e **testado em uso real pelo proprietário**
`#133` — 6 provas do menu P3 verdes na suíte

### 🟡 Grupo 2 — precisa do Executor
`#117`, `#122` — **somente se você não aceitar o gate live como dispensado**; aceitando, migram para o Grupo 1
`#139` — a **Necessidade 5** do comentário `5628419318` (OCR extrai entorpecente parcial; DETIDOS fica vazio) **não tem card** e não foi tratada. É trabalho de código, não de prova

### 🔵 Grupo 3 — depende do proprietário / prova no Sheets
**Vazio.** Os itens que estavam aqui (prova live do #117 e do #122) foram dispensados pela
autorização de 2026-09-12 (*"humano autoriza o cancelamento disso uma vez que a prova foi
substituida pelo uso real da ferramenta por ele"*). Reverter a dispensa = os itens voltam.

---

## 3. Pendência declarada (não escondida)

1. **Necessidade 5 sem card** — OCR de entorpecentes parcial + DETIDOS vazio. Único buraco real da fila.
2. **Erro meu, já corrigido** — no 1º comentário do #151 eu resumi a lista de arquivados como `#152-#200` (faixa inexistente). Reescrevi com a relação nominal real; seção *Correção* no próprio card.
3. **Rate-limit da API** — dois episódios durante os lotes de arquivamento; retomados por verificação de estado, sem item duplicado ou pulado.

## 4. Ponte 1 (contexto do pedido)

Ponte 1 (`127.0.0.1:8766`) **desligada** no momento do pedido. Fluxo verificado no código
(`ponte1_telegram_chatgpt/server/ponte1_daemon.js`): `/status` e `/packet` (GET), `/ack`,
`/reply`, `/reset` (POST), e o **relay** `ChatGPT → chat do Hermes` (config
`config/hermes_relay.json`, ignorada pelo Git). **Não existe rota de injeção Hermes → ChatGPT** —
por isso este índice foi publicado no canal que a auditoria efetivamente lê: `agentic/state/`.
