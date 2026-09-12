# RESULT — Correção de domínio (#145/#146) + prova do #148 + CLASP push do lote

**Ordem do proprietário (auditoria de 12/09):** corrigir ARCA-ANTIGUIDADE-002 → rodar testes → provar #148 → CLASP push + validar remoto → (ele) fecha #145–#149.
**Papel:** Operário executor (Hermes). **Estado:** RESULT_PENDING_AUDIT — o Planner/proprietário fecha.

## Passo 1 — Divergência de domínio corrigida ✅
O proprietário apontou: a ARCA gravada em `60939f1` dizia desempate por **menor N**; a regra real
(e o código do Guardião) é **graduação → matrícula mais antiga**.

`ARCA-ANTIGUIDADE-002` corrigida em `Dominio/ARCA/arca_regras_dominio.json` + `ARCA_REGRAS_DOMINIO.md`:
- **Descrição:** "...primeiro pelo posto/graduação (o mais antigo primeiro) e, em caso de mesma graduação, pela **MATRÍCULA mais antiga (menor número)**".
- **Resultado esperado:** idem.
- **Observação:** distingue explicitamente do ARCA-ANTIGUIDADE-001 (precedência por menor N = critério de **MÉRITO**), citando `Core/Policiais.js:141-151`.

Varredura confirmou: os "menor N" remanescentes pertencem a regras de **mérito** (ARCA-MERITO-001) e **desambiguação de nome de guerra** (ARCA-EFETIVO-002) — critérios distintos, corretos.

## Passo 2 — Testes do #145/#146 ✅
`TestArcaMapaCobertura` 11/0 · `TestArcaConsumidores` 9/0 · `TestOrdemAntiguidadeEquipe` 7/0 · `TestPadroesFormularioQtdODetidos` 7/0 · `TestGuardiao` **42/0**.

## Passo 3 — Prova do #148 (sem reimplementar) ✅
O núcleo já existia (`QDT_ARMAS_DIVERGENTE_NO_TUNEL` + mapeamento para `ARCA-ARMAS-001`). Foi adicionada a
**prova formal dos cenários** em `Testes/TestGuardiao.js` (+3):
1. QDT ARMAS == soma de ARMA física no túnel → **não gera**;
2. QDT ARMAS divergente entre participantes → gera;
3. QDT ARMAS diferente da soma de ARMA física → gera.

## Passo 4 — CLASP push + validação do remoto ✅
- `clasp push -f` → **código 0** (Apps Script atualizado).
- `clasp run executarGuardiaoHeadless -p '["SET2026"]'` → `status OK`, **12 túneis, 213 linhas, 33 alertas**.
- **Evidência material na planilha (coluna AM, SET2026):**
  - `Equipe fora da ordem canonica de antiguidade (posto/graduacao; desempate pela matricula mais antiga)` — **múltiplas linhas** (diagnóstico do #146, já com o texto correto);
  - `AIS ausente: cidade/bairro permitem determinacao territorial canonica` — presente;
  - `AIS divergente: valor gravado difere da base territorial canonica (cidade+bairro)` — presente em várias linhas.
- **Nota de precisão:** `QTD_O_DIVERGENTE` **não** aparece no SET2026 — **correto**: a coluna QTD O tem `1` na primeira linha (normalizado para `01`) e vazio nas filhas; sem divergência.

## Commits
- `60939f1` → #145 (regras canônicas) — *continha a divergência corrigida agora*
- `c60aeea` → #146/#147 (diagnósticos ordem + QTD O)
- `266a7db` → #149 (diagnósticos AIS)
- correção de domínio + prova do #148: commit desta passada (abaixo do HEAD)

## Estado do bloco ARCA-GUARD
| Card | Estado |
|---|---|
| #145 | entregue + **corrigido** (desempate = matrícula) |
| #146 | entregue (diagnóstico ativo no remoto) |
| #147 | entregue (ativo; sem divergência no SET) |
| #148 | entregue (núcleo já existia; agora com **prova formal**) |
| #149 | entregue (diagnósticos ativos no remoto) |

**Catálogo ARCA:** 48 regras · MAPEADO 32 · INTEGRADO 8 · NAO_APLICAVEL 8 — zero cegas.
**CLASP:** publicado e validado no remoto.
