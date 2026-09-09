# Colmeia H01 - Registro de Papeis (Registry)

Card: #98 H01-007
Regra-mestre: MENOR ROTA CONFIÁVEL - somente agentes necessarios para o nivel de garantia exigido.
Nenhum papel abaixo e GATE obrigatorio por task. Auditorias orbitais continuam FORA do fluxo por task (regra #91/#100 e decisoes do Planner).

## Papeis disponiveis (acionamento seletivo)

| Papel | Contrato | Acionar quando... | Proibicoes |
|---|---|---|---|
| Reviewer / Argos | roles/reviewer-argos.md | auditoria independente de uma entrega (leitura pura) | nao corrige, nao se auto-homologa |
| Code Reviewer | roles/code-reviewer.md | revisao tecnica de diff/codigo antes de promocao | nao executa a propria correcao |
| DDD Reviewer | roles/ddd-reviewer.md | revisao de dominio/linguagem/contratos | nao altera codigo |
| Curator | roles/curator.md | promocao de conhecimento/estado p/ mapa (REALIDADE == MAPA) | nao substitui o Verifier |
| Obsidian / Down Plant | roles/obsidian-downplant.md | promocao estrutural/documental respeitando regra #57 | nao edita artefato fora do escopo autorizado |

## Ordem de rota (quando acionados em cadeia)
Reviewer/Argos -> Code Reviewer -> DDD Reviewer -> Curator -> Obsidian/Down Plant.
A cadeia so percorre os elos exigidos pelo nivel de garantia do card. Uma task simples (ex.: correcao pontual ja coberta por teste) aciona ZERO reviewers.

## Regras transversais
- Reviewer nao executa a propria correcao e nao se auto-homologa.
- Curator promove conhecimento/estado; quem valida entrega material e o Verifier (#96).
- Promocao estrutural/documental respeita REALIDADE == MAPA e a regra #57 (quatro pontas de icamento).
- Papeis sao contratos (markdown acionavel por qualquer agente autorizado), nao processos residentes.
- Sem emoji em fluxo operacional. Sem secrets em contrato ou saida.

## Referencias
- A02 #79 (formalizar papeis/autoridade) - em aberto; este registry antecipa a fatia H01.
- Regra #57 (quatro pontas de icamento) - aplicavel a promocao estrutural.
- Template executavel de card: #80 (A02).
