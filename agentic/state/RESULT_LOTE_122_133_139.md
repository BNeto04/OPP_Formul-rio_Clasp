# RESULT — Lote G01/OCR · GATES DE CÓDIGO (#122, #133, #139)

**Data**: 2026-09-12 · **Branch**: `sprint/g01-guardiao-qualidade-live-001`
**Contexto**: decisão do proprietário de 2026-09-12 — *"humano autoriza o cancelamento disso
uma vez que a prova foi substituida pelo uso real da ferramenta por ele"*.

## Fundamento comum
Os gates que exigiam prova ao vivo no Google Sheets (Apps Script / HTTP 502 do Google)
estão **DISPENSADOS**: o uso real da ferramenta em produção pelo proprietário substitui a
prova controlada. Os gates de **código** de cada card seguem exigidos e estão **verdes**.

---

## #122 — G01-010 · E2E final do C05 com Normalizador Seguro
**Gate live (16)**: ⚪ DISPENSADO por decisão do proprietário (registrado no card).

| Gate | Prova |
|---|---|
| 3 AUTO_FIX/CONFIRM_FIX/MANUAL_ONLY | testes do porteiro de mutação segura |
| 4 fórmula = CONFIRM_FIX por padrão | contrato de mutação (`somente correções de fórmula são mutáveis`) |
| 5 dry-run não escreve | `TestEntradaManualDryRun` + `simular:true` |
| 6 lock single-flight | ✅ porteiro: sem lock não autoriza |
| 7 whitelist/blacklist + kill-switch | ✅ porteiro: sem kill-switch nada é autorizado |
| 8 snapshot/rollback | ✅ testes do executor do Normalizador |
| 9 reauditoria com rollback | ✅ `TestReauditoriaNormalizador` |
| 10 trilha diagnóstico→plano→mutação→reauditoria | ✅ integração |
| 11 dados não autorizados intactos | ✅ contrato de mutação |
| 12 suíte verde | ✅ `exit 0` |
| 13 Git alinhado | ✅ local == remoto |

## #133 — MENU-P3 · Menu único de navegação
**Gate live**: ⚪ DISPENSADO (mesma decisão).

| Prova | Resultado |
|---|---|
| existe UM único menu superior, chamado P3 | ✅ |
| nenhum menu superior legado é criado | ✅ |
| submenus seguem a árvore canônica do #129 | ✅ |
| todo item aponta para função existente (nenhum alvo morto) | ✅ |
| os 15 entrypoints continuam alcançáveis pelo P3 | ✅ |
| DECISÃO CONGELADA: GXT e Central Analítica fora do menu | ✅ |

## #139 — OCR-P3 · OCR/Formulário + ARCA
**Gate live**: ⚪ DISPENSADO (mesma decisão).

| Prova | Resultado |
|---|---|
| Equipe: sem policiais duplicados | ✅ |
| Policial: mesma matrícula numérica considerada igual | ✅ |
| Droga: instância congelada + decimais > 0 | ✅ |
| PluginPrisoes: acumula detidos e procedimentos | ✅ |
| Regressão Motor V2 (sem contaminação entre policiais) | ✅ |
| Regressão Motor V2 (pelotões especiais preservados) | ✅ |
| Numerário sem valor → NÃO AUDITÁVEL AUTOMATICAMENTE | ✅ |

---

## Estado único
- **Suíte**: `node Testes/RodarTodosOsTestes.js` → **exit 0 · TODAS AS SUÍTES COM SUCESSO**
- **Git**: local == remoto (`d657bc8`)
- **Fechamento**: pertence ao Planner (contrato `a02_canteiro_authority` — o executor
  produz o RESULT, não fecha cards).
