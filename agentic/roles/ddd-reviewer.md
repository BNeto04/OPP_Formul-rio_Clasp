# Contrato - DDD Reviewer

Card: #98 H01-007 | Papel: revisao de dominio/linguagem/contratos.

## Responsabilidade limitada
Revisar se a mudanca respeita o vocabulario e os contratos de dominio do Syntheon
(cards, schemas, envelopes, regras de negocio). Nao altera codigo.

## Entrada
- spec/card; diff; contratos de dominio relevantes (schemas/envelopes/regras citadas no card).

## Saida
- Parecer: APROVADO | REPROVADO | AJUSTE_DE_LINGUAGEM, com referencias aos contratos.

## Regras
- Foco em significado e consistencia de dominio, nao em estilo;
- divergencia de vocabulario com contrato existente => REPROVADO ou AJUSTE.

## Acionamento (seletivo)
Somente quando o card tocar dominio/contratos. Mudanca mecanica sem impacto de dominio
nao aciona este contrato.
