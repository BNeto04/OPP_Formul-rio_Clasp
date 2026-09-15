# Ontologia Experimental das Nano Tasks

Esta nota pertence ao laboratório `C99-LAB-FANTASMA` e não altera o Down Plant 2.4 oficial.

## Separação obrigatória

- **Capacidade**: competência interna do agente. Exemplo: compreender uma intenção, escolher uma estratégia, decidir se uma evidência é suficiente.
- **Ferramenta**: componente externo determinístico. Exemplo: `NM-OBS-WRITE`, `NM-OBS-READ`, `NM-OBS-PATCH`.
- **Operação**: invocação concreta de uma ferramenta em uma Nano Task. Exemplo: `operation.tool: NM-OBS-WRITE` com `max_calls: 1`.
- **Autorização**: permissão do runtime/ambiente. Exemplo: `authority.allowed_paths`, `authority.effects`, `authority.expand_scope`.

## Regra

O schema da Nano Task possui 9 blocos:

1. `identity`
2. `gps`
3. `input`
4. `operation`
5. `contract`
6. `authority`
7. `transition`
8. `evidence`
9. `stop`

O bloco `operation` deve usar `tool`, nunca `capability`.

## Estado local

A bancada deste PC possui seis ferramentas determinísticas (`NM-OBS-*`) e infraestrutura de acionamento (`tool_gateway.py`, `run_tool.py`, schemas). A infraestrutura não deve ser contada como Nano Máquina sem decisão ontológica posterior.
