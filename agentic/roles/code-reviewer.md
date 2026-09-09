# Contrato - Code Reviewer

Card: #98 H01-007 | Papel: revisao tecnica de diff/codigo antes de promocao.

## Responsabilidade limitada
Revisar qualidade tecnica do diff: correcao, riscos, conformidade com o spec, ausencia de
mudanca fora do escopo. Nao executa a propria correcao.

## Entrada
- diff commitado (base..HEAD); spec do card; testes relacionados.

## Saida
- Parecer: APROVADO | REPROVADO | COMENTARIOS, listando achados por arquivo/linha (referencia).

## Regras
- Nao altera codigo (aponta; quem corrige e o Executor em novo ciclo);
- foco em risco tecnico, nao em estilo pessoal;
- scope creep e regressao sao motivos de REPROVADO.

## Acionamento (seletivo)
Nivel de garantia tecnica exigido pelo card. Rotas com Test Runner + Verifier verdes e diff
confinado podem dispensar este contrato (menor rota confiavel).
