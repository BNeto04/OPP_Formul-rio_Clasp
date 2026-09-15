# CONFIRMAÇÃO DO PROPRIETÁRIO — §21.2/3 (critério de retomada de fatia de produto)

**Status:** CONFIRMADO
**Condição:** §21.2, terceira condição — "o Proprietário confirma explicitamente que a visão geral do Cômodo foi restabelecida"
**Data:** 2026-09-15
**Proprietário:** Manoel (autoridade do projeto) — confirmação dada com o marcador explícito "V" na tratativa do card #170
**Card:** #170 (DP24-007) · `gs-downplant`
**Instrumento que lê este registro:** `scripts/downplant/gate-retomada.mjs` (C3)
**Ressalvas:** C2 = NAO_MENSURAVEL (LACUNA_DE_GOVERNANCA); GATE_GLOBAL = VERMELHO exclusivamente por C2; C1 não reabre por homologação/DONO×CONSUMIDOR/NAO_APLICAVEL/cápsulas

## Texto confirmado (verbatim)

> "C3: considerando que C1 está VERDE, os reparos estruturais mensuráveis terminaram e os resíduos foram explicitamente separados como decisões/advisories, eu confirmo a visão geral estrutural restabelecida para fins do §21.2, com a ressalva explícita de C2 ainda não mensurável. Esta é a confirmação do proprietário para o gate; portanto C3 pode passar a CONFIRMADO."

## Escopo exato desta confirmação

- Vale **para o §21.2/3** do gate de retomada, com o estado do terreno no commit `62f2948`:
  - **C1 = VERDE** (0 pendências que contam no critério de retomada);
  - **C2 = NAO_MENSURAVEL** — causa `AUSENCIA_DE_FONTE_CANONICA_DE_ESTADO_DE_AUDITORIA`;
  - resíduos **separados como decisões/advisories** (homologação/infra 5 · DONO×CONSUMIDOR 4 casos · NÃO APLICÁVEL 1 · 4 Módulos sem cápsula).
- **Ressalva explícita e inseparável:** C2 continua **não mensurável**. O `GATE_GLOBAL` **permanece VERMELHO**, e esse vermelho passa a significar exclusivamente **LACUNA_DE_GOVERNANCA** — não "continuar reformando o terreno".

## O que esta confirmação NÃO autoriza

1. Transformar **C2** em verde dentro deste card, nem inventar fonte canônica de estado de Auditoria aqui.
2. Reabrir **C1** por causa de homologação/infra, DONO×CONSUMIDOR, NÃO APLICÁVEL ou dos 4 Módulos sem cápsula — o instrumento já os separou do critério de retomada (§21.2 fala de espelho rico, não de cápsula; e a aplicabilidade a bancada segue a decidir).
3. Nova rodada de **catch-up estrutural** por rotina, nem transformar o Down Plant em reforma permanente.
4. Interpretar esta confirmação como fechamento do #170: o fechamento exige decisão consciente sobre onde mora o **estado canônico das Auditorias**.

## Como o instrumento usa este registro

- Enquanto este arquivo existir com `Status: CONFIRMADO`, a **C3** do placar vale `CONFIRMADO` e declara este caminho como `fonte`.
- Se o arquivo for removido ou o status mudar, a **C3** volta a `PENDENTE` (o instrumento nunca infere confirmação humana).
- O `GATE_GLOBAL` só fica `VERDE` quando C1 = VERDE **e** C2 = VERDE **e** C3 = CONFIRMADO. Hoje: **VERMELHO exclusivamente por C2**.
