# RESULT — Trabalho executado SEM o Planner (2026-09-12)

**Papel:** Operario executor (Hermes). **Autoridade:** ordem direta do proprietario (Mano), sem card previo.
**Destino:** auditoria do Planner (reconciliacao local == Git == Kanban). Nada foi auto-homologado.
**Issues relacionadas permanecem OPEN:** #112 (sprint), #145-#149 (ARCA-GUARD), #117, #133.

---

## 1. Formatacao condicional do tunel (marca visual)

**Arquivo:** `Features/FormatacaoTunel.js`
**Commits:** `fe2eb2f`, `a2a06b2`, `74842d2`

| Marca | Cor | Condicao | Coluna |
|---|---|---|---|
| Amarelo | `#FFFF00` | componente da chave vazio, dentro do tunel | DATA (B) e BOE (G) |
| Vermelho | `#FF0000` | ocorrencia com arma apreendida | MIKE (E) |
| Cinza | `#EFEFEF` | celula de dados vazia, dentro do tunel | demais colunas |

- **Funcao headless:** `aplicarFormatacaoTodosMesesHeadless` (roda em JAN..DEZ canonicos).
- **Detecao de arma:** coluna `TIPO` (M) preenchida - pega industrial (`INDUSTRIAL`) e artesanal (`FABRICACAO CASEIRA`), que em ARMA (L) fica vazio.
- **Aplicado nas 9 abas:** JAN..SET2026 (verificado na cor efetiva da celula; nao no texto da regra).
- **Pitfall registrado:** a planilha e locale `pt_BR` - formula de formatacao condicional exige **ponto-e-virgula** `;`; com virgula `,` a regra grava mas nunca dispara. Usar `ISBLANK`/`NOT(ISBLANK)`.

## 2. Correcao de fragmentacao de tuneis (dados)

**Ferramenta:** `Features/CorretorTuneis.js` (`corrigirTuneisAbaHeadless`) - ja existente.
**Diagnostico previo (dry-run):** FEV 112, MAR 107, ABR 147, MAI 119 datas; 0 conflitos.

| Aba | Datas preenchidas | Restante |
|---|---|---|
| FEV2026 | 112 | 0 |
| MAR2026 | 107 | 0 |
| ABR2026 | 147 | 2 |
| MAI2026 | 119 | 1 |
| **Total** | **485** | **3** |

- **ORD (coluna A):** intacto (verificado sequencial, sem buracos). O corretor so toca DATA (B) e BOE (G).
- **3 celulas restantes (nao sao fragmentacao):** ocorrencias divididas em MIKEs diferentes - o corretor preenche so DENTRO do mesmo MIKE, corretamente.
  - ABR linhas 19-20: ocorrencia 03/04 (PORTE ILEGAL DE ARMA/TRAFICO) dividida em 3 MIKEs (`...366220`, `...366221`, `...366222`) e 3 BOEs.
  - MAI linha 24: ATROPELAMENTO COM VITIMA FATAL (07/05) dividido em 2 MIKEs (`...322465`, `...322466`).
  - Decisao de dominio pendente (unificar MIKE ou preencher DATA manual).

## 3. Levantamento da ARCA

**Commit:** `d4f6c0c` — `docs(arca): levantamento das 45 regras + fluxo visual`
**Artefatos:** `Dominio/ARCA/INVENTARIO_ARCA.md`, `Dominio/ARCA/arca_flow.html`

| Auditabilidade | Qtde |
|---|---|
| MAPEADO (Guardiao audita) | 29 |
| INTEGRADO (Normalizador/plugins via porta #127) | 7 |
| NAO_APLICAVEL (estrutural / entrada de dados) | 9 |
| **Total** | **45** |

- Correcao de leitura: nao ha regra "cega". As 16 fora de MAPEADO sao 7 INTEGRADO + 9 NAO_APLICAVEL.
- Lacuna de dados apurada: `ARCA-TERRITORIO-001` com `status_cobertura` vazio no JSON.

---

## Observacoes para auditoria

1. Todo o trabalho acima foi feito por ordem direta do proprietario, **sem card previo** — este documento e o registro retroativo exigido pela regra "nada so na conversa".
2. Nenhuma Issue foi fechada pelo operario.
3. O dado de planilha (485 datas) e mutacao fora do Git; a evidencia e o proprio estado da aba + este RESULT.
4. Card de design criado: **#150 ARCA-GOV-001** (comodo Governanca) — BACKLOG, aguardando especificacao do Planner.

## Vinculos
- Card de design: #150 (ARCA-GOV-001)
- Sprint: #112
- Cards ARCA-GUARD (cobertura): #145-#149
- Artefatos: `Features/FormatacaoTunel.js`, `Dominio/ARCA/INVENTARIO_ARCA.md`, `Dominio/ARCA/arca_flow.html`, `agentic/state/result_sem_planner_20260912.md`
