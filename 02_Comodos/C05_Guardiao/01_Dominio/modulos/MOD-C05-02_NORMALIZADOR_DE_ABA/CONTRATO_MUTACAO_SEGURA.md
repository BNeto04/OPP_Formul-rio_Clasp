# CONTRATO DE MUTACAO SEGURA — MOD-C05-02_NORMALIZADOR_DE_ABA

Card: **#118** (G01-006, Lote B da Sprint #112) | Branch: `sprint/g01-guardiao-qualidade-live-001`
Artefato de codigo (fonte de verdade): `Core/ContratoMutacaoSegura.js`
Suíte: `Testes/TestContratoMutacaoSegura.js`

## Por que existe
O Normalizador so pode corrigir depois que existir um **contrato tipado**: o que pode ser corrigido,
com que classe de seguranca, com que provas e sob quais travas. Este documento e o endereco canonico
desse contrato no Down Plant; a implementacao vive no codigo acima (nada duplicado aqui).

## Classes de correcao
| Classe | Significado | Muta sozinho? |
| :--- | :--- | :--- |
| `AUTO_FIX` | Correcao com fonte canonica inequivoca, contexto compativel, padrao comprovado e reauditoria imediata. | Sim, apos dry-run + lock + snapshot. |
| `CONFIRM_FIX` | Correcao plausivel que **exige confirmacao do operador**. **Padrao para formula.** | Nao: exige aprovacao explicita. |
| `MANUAL_ONLY` | Nunca mutado por este contrato (dado operacional, julgamento humano, lacuna de catalogo). | Nao. |

## Politica de formula (requisito 2 e 3)
- Formula e **`CONFIRM_FIX` por padrao**.
- Vira `AUTO_FIX` **somente** com as quatro provas simultaneas: `FONTE_CANONICA` + `CONTEXTO_COMPATIVEL`
  + `PADRAO_COMPROVADO` + `REAUDITORIA_IMEDIATA`. Faltando uma, permanece `CONFIRM_FIX` e o motivo
  nomeia a condicao ausente.

## Whitelist (o que cada classe pode mutar)
- `AUTO_FIX`: `RESTAURAR_FORMULA`.
- `CONFIRM_FIX`: `RESTAURAR_FORMULA`, `CORRIGIR_CABECALHO`, `AJUSTAR_FORMATACAO`.
- `MANUAL_ONLY`: nada.

## Blacklist dura (nunca mutado, nem com fonte canonica)
`MIKE`, `BOE`, `MATRICULA`, `POLICIAL`, `NOME`, `ARMA/ARMAS`, `DROGA/DROGAS`, `PIP`, `PONTOS`,
`QUANTIDADE/QTD`, `EFETIVO`, `FATO`, `OCORRENCIA`, `DATA`, `HORA`, `LOCAL`, `AIS`, `TERRITORIO`, `ANTIGUIDADE`.
Janela operacional: **A:AL** sao dados; **AM** e a coluna de alerta do Guardiao e nunca e alterada pelo normalizador.

## Cobertura sobre a realidade
O contrato classifica explicitamente **todos os 29 codigos de diagnostico reais** do MOD-C05-01:
hoje apenas `FORMULA_AUSENTE`, `FORMULA_CORROMPIDA_ERRO_SINTAXE` e `RATEIO_PONTOS_INCOERENTE` sao corrigiveis
(como `CONFIRM_FIX`); os demais tem motivo explicito de bloqueio (`DADO_OPERACIONAL_BLACKLIST`,
`JULGAMENTO_HUMANO_NECESSARIO`, `SEM_FONTE_CANONICA`, `LIMITACAO_DE_CATALOGO`, ...).
Nenhuma heuristica/`UNKNOWN` e promovida a regra oficial.

## Trilha obrigatoria por acao
Toda proposta carrega: diagnostico de origem (codigo, severidade, camada, linha, tunel, evidencia),
regra ARCA/fonte (ou lacuna declarada explicitamente), aba, linha, coluna, valor atual, valor proposto
e justificativa — mais as exigencias `DRY_RUN_OBRIGATORIO`, `LOCK_SINGLE_FLIGHT`, `SNAPSHOT_ANTES`,
`REAUDITORIA_APOS`, `LOG_ANTES_DEPOIS` e, quando `CONFIRM_FIX`, `CONFIRMACAO_DO_OPERADOR`.

## Porteiro unico de autorizacao
`ContratoMutacaoSegura.podeAutorizar(plano, estado)` exige, simultaneamente: plano com acoes mutaveis,
`kill_switch` desacionado, `lock_adquirido`, `dry_run_executado`, `snapshot_disponivel` e
`reauditoria_disponivel`. Sem qualquer uma delas, nada e autorizado.

## Interfaces deixadas para os cards seguintes
`DRY_RUN`, `LOCK`, `SNAPSHOT_ROLLBACK`, `KILL_SWITCH` e `REAUDITORIA_DELTA` (com invariantes declarados,
incluindo `NAO_ESCREVE` no dry-run e `NOVOS_ERROS_CRIADOS_IGUAL_ZERO` na reauditoria) — ver
`ContratoMutacaoSegura.INTERFACES()`.

## Limite deste card
Nenhuma escrita operacional foi implementada aqui: o artefato e o contrato + testes (18/18 PASS).
A execucao real e dos cards G01-007 a G01-010.
