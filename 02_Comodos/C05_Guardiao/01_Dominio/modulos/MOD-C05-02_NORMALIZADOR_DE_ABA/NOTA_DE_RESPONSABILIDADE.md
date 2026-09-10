# MOD-C05-02_NORMALIZADOR_DE_ABA

Responsabilidade canonica do modulo.

## Papel
Executor controlado de correcoes SEGURAS e DETERMINISTICAS nas abas mensais, sempre a partir de um PLANO DE CORRECAO explicito derivado dos diagnosticos do MOD-C05-01_GUARDIAO_DE_QUALIDADE.
Nunca decide sozinho: aplica apenas o que o plano classifica como AUTO_FIX; o que for CONFIRM_FIX exige confirmacao do operador; MANUAL_ONLY nunca e mutado automaticamente (apenas sinalizado).

## Entradas / Saidas
- Entrada: diagnostico + plano de correcao (aba/linhas alvo, colunas, valor canonico esperado), politica de mutacao, escopo permitido.
- Saida: mutacao aplicada + LOG (antes/depois por celula) + rollback da execucao + REAUDITORIA do mesmo periodo.

## Limites inegociaveis
- Nao promove heuristica/UNKNOWN a regra oficial.
- Nao altera dado operacional sem plano explicito e sem trilha de auditoria.
- Nao cria colunas operacionais novas (A:AL preservadas; AM segue "Alerta Integridade").
- Nao substitui o MOD-C05-01: depois de normalizar, DEVOLVE para reauditoria.
- Toda mutacao precisa ser reversivel e rastreavel (preview + log + rollback por execucao).

## Fluxo canonico
DIAGNOSTICO -> PLANO DE CORRECAO -> PREVIEW -> (APROVACAO quando CONFIRM_FIX) -> NORMALIZACAO -> LOG/ROLLBACK -> REAUDITORIA -> SAUDE FINAL -> HISTORICO

## Fronteira com o MOD-C05-01
- MOD-C05-01 = audita, detecta, classifica, explica e mede cobertura (nao altera dados operacionais).
- MOD-C05-02 = corrige de forma controlada somente o que o plano autorizou e devolve o resultado para auditoria.

## Pendencia de implementacao
Lote B da Sprint G01 (#112). O Lote A (#113-#117) entrega apenas a fase auditora (MOD-C05-01).
