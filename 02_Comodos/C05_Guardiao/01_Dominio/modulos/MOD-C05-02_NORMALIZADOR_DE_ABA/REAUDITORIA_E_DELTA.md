# REAUDITORIA AUTOMATICA E DELTA — MOD-C05-02_NORMALIZADOR_DE_ABA

Card: **#121** (G01-009, Lote B da Sprint #112) | Branch: `sprint/g01-guardiao-qualidade-live-001`
Artefato de codigo: `Core/ReauditoriaNormalizador.js` | Suíte: `Testes/TestReauditoriaNormalizador.js`

## O que faz
Depois de um lote aplicado pelo executor (#120), o Guardiao e chamado de novo **no mesmo escopo** e o delta
antes/depois e comparado de forma factual. Nenhum sucesso e declarado sem prova; falha de qualidade
**reverte o lote** e reaudita o rollback.

## Criterio de sucesso (todos simultaneos)
`ERRO_ALVO_RESOLVIDO=true`, `NOVOS_ERROS_CRIADOS=0`, `ESCOPO_MUTADO<=LIMITE` e `REAUDITORIA=GREEN` para o
escopo tratado. A cobertura entra no criterio: cobertura **PARCIAL** ou regra alvo marcada **NAO_AUDITADA**
derrubam o verde — **ausencia de diagnostico nao conta como verde**.

## Cadeia rastreavel
`diagnostic_id -> plano_id -> mutacao_id -> reauditoria_id`, mantendo `regra_arca` e `fonte_regra` em cada elo.

## Delta e resumo
Delta estruturado (`resolvidos`, `persistentes`, `novos`, `nao_auditados`) + `resumo_humano` com o lote,
o resultado de cada criterio, a cobertura final e — quando ha rollback — quantas celulas foram revertidas,
se os defeitos alvo voltaram e se o **estado final foi comprovado**.

## Rollback por qualidade
Qualquer criterio vermelho dispara `reverterLote` do lote inteiro (via executor do #120), seguido de nova
reauditoria pos-rollback (com `reauditoria_id` proprio) para comprovar o estado final. Com
`executarRollback:false` o resultado declara explicitamente **estado final NAO comprovado** (nunca falso verde).

## Prova
`Testes/TestReauditoriaNormalizador.js`: **13 PASS / 0 FAIL** — correcao bem-sucedida; diagnostico conhecido
fora do lote permanece persistente sem bloquear o verde; cadeia + ARCA preservada; erro persistente;
novo erro introduzido; perda de auditabilidade (cobertura PARCIAL e regra NAO_AUDITADA); escopo acima do
limite; `SEM_MUTACAO`; rollback desabilitado com estado nao comprovado; resumo humano; pureza do nucleo;
determinismo do `reauditoria_id`.
