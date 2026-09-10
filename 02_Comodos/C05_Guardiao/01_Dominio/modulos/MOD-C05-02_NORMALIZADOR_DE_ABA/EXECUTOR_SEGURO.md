# EXECUTOR SEGURO — MOD-C05-02_NORMALIZADOR_DE_ABA

Card: **#120** (G01-008, Lote B da Sprint #112) | Branch: `sprint/g01-guardiao-qualidade-live-001`
Artefato de codigo: `Core/ExecutorNormalizador.js` | Suíte: `Testes/TestExecutorNormalizador.js`

## O que faz
Aplica SOMENTE as correcoes autorizadas pelo plano do dry-run (#119) e pelo contrato (#118), sob contencao
de risco. O executor nao fala com a planilha diretamente: recebe um **adaptador** injetado
(`adquirirLock`, `liberarLock`, `lerCelula`, `escreverCelula`, `killSwitchAcionado`), o que permite
provar todo o comportamento em memoria e usar a planilha real so no adaptador.

## Contencoes implementadas (requisitos 1 a 10)
1. **Consome apenas plano valido**: passa pelo portao do #119 (`autorizarExecucao`) — sem dry-run, sem
   snapshot, sem reauditoria ou com kill-switch acionado, nada e executado.
2. **Lock single-flight por aba** adquirido ANTES de qualquer leitura/escrita; lock indisponivel =
   fail-closed sem escrita; o lock e liberado em todos os caminhos (inclusive falha e rollback).
3. **Revalidacao anti plano stale**: a celula e lida antes de cada escrita; se o valor atual divergir do
   plano, o lote para e dispara rollback (`PLANO_STALE`).
4. **Snapshot pre-execucao** por celula (valor antes), suficiente para reverter o lote inteiro.
5. **Kill-switch por quantidade**: consultado antes de CADA escrita; acionado interrompe o lote e reverte
   o que ja tinha sido aplicado. Limite de lote (`maxAcoes`) vindo do plano tambem trava o inicio.
6. **Somente `AUTO_FIX`** aplica direto; **`CONFIRM_FIX` exige confirmacao explicita** do operador
   (lista de ids); **`MANUAL_ONLY` nunca muta**.
7. **Log completo**: `plano_id`, `execucao_id`, `diagnostic_id`, regra/fonte, classe, aba, range,
   `ANTES -> DEPOIS`, `timestamp` e `resultado`.
8. **Rollback do LOTE inteiro** (`reverterLote`), em ordem inversa — nao apenas a celula que falhou.
9. **Fail-closed**: falha parcial de escrita, excecao de escrita, divergencia de pre-condicao, kill-switch
   ou violacao de escopo disparam rollback automatico (`ROLLBACK_EXECUTADO`/`INTERROMPIDO_POR_KILL_SWITCH`).
10. **Escopo**: revalidacao de cada acao imediatamente antes de escrever (blacklist de dado operacional,
    janela A:AL, coluna de alerta AM e whitelist por classe) — defesa em profundidade alem do plano.

## Status possiveis
`APLICADO` | `SEM_ACOES` | `NAO_AUTORIZADO` | `INTERROMPIDO_POR_KILL_SWITCH` | `ROLLBACK_EXECUTADO`.

## Prova
`Testes/TestExecutorNormalizador.js`: **17 PASS / 0 FAIL** — portao de autorizacao, caminho felizes,
CONFIRM_FIX sem/com confirmacao, MANUAL_ONLY, plano stale, falha parcial, excecao de escrita, kill-switch
antes e no meio, lock indisponivel, violacao de escopo (AM e blacklist), limite de lote, conjunto exato de
escritas, determinismo do `execucao_id` e integracao #118 -> #119 -> #120.
