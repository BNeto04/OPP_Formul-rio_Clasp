# RESULT — #143 OCR-P3-009 · Falha residual de gravação do BO de 04/09

**Data**: 2026-09-12 · **Card**: #143 (OCR-P3-009, P0, sprint:c01) · **Pai lógico**: #139
**Branch**: `sprint/g01-guardiao-qualidade-live-001` · **Commit**: `ee543bd`

## Veredito
**RESOLVIDO** — corrigido no código por Hermes e **validado em uso real pelo proprietário**.

## 1. Defeito provado no código (explica o relato "deu problema para gravar")

O caminho de gravação é *best-effort*: `_processarEntradaManual` **nunca lança**, devolve
`status: NAO_GRAVADO`. Mas:

| Camada | Comportamento anterior | Consequência |
|---|---|---|
| `Entrada/EntradaManual.js` | `processarEntradaManual` montava `"Ocorrência X: NAO_GRAVADO."` como **texto de sucesso** | a falha não se distinguia de sucesso |
| `Entrada/Formulario.html` | `salvarDados()` chamava `limparFormulario()` **incondicionalmente** | o BO era apagado da tela como se tivesse gravado |

**Por isso a "mensagem de erro do BO 04/09" nunca foi capturada: ela não existia.**
O operador perdia o registro sem sinal inequívoco de falha.

## 2. Correção aplicada (`ee543bd`)

1. `processarEntradaManual` → `"⛔ NÃO GRAVADO — ocorrência <id> (status: ...)."`
   (e `"SIMULAÇÃO (nada gravado)"` para dry-run). `OK` permanece o único caminho de sucesso.
2. `salvarDados()` → detecta `NÃO GRAVADO`, pinta em vermelho e **não limpa o formulário**:
   o operador mantém o BO na tela para recapturar a causa.
3. `TestEntradaManualFormulario` **Test 16** → trava a regressão (falha visível + form preservado).

## 3. Verificação

| Prova | Comando/Origem | Resultado |
|---|---|---|
| Suíte global | `node Testes/RodarTodosOsTestes.js` | **exit 0 · TODAS AS SUÍTES COM SUCESSO** |
| Teste novo | `TestEntradaManualFormulario` Test 16 | ✅ PASS |
| **Uso real** | **testado pelo próprio proprietário** | ✅ **RESOLVIDO** (declaração do proprietário, 2026-09-12) |

## 4. Decisão do proprietário aplicada
*"foi resolvido eu mesmo ja teste"* — a validação por uso real substitui a prova controlada
(mesma autorização registrada no ADENDO do `RESULT_117_G01_005.md`). O item de reprodução
assistida do BO 04/09 fica **DISPENSADO por decisão do proprietário**.

## Reverter
- `git revert ee543bd` — volta a falha silenciosa + form apagado (**não recomendado**).
