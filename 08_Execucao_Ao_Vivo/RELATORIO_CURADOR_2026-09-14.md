# CURADOR DOWN PLANT
- Commit observado: f8f11b0 (branch sprint/g01-guardiao-qualidade-live-001; 1 caminho(s) no commit)
- Cômodos afetados: nenhum
- Módulos afetados: nenhum
- Circuitos afetados: nenhum
- Estado anterior: espelho versionado `08_Execucao_Ao_Vivo/downplant_handoff.md` no disco - sha256=93941f948fb08f62..., 158 linhas
- Estado encontrado: espelho DERIVADO do YAML canônico `08_Execucao_Ao_Vivo/downplant_handoff.yaml` - sha256=93941f948fb08f62..., 158 linhas

> Relatório gerado por `scripts/downplant/curador-estrutural.mjs` - formato §46.13 (METODO_DOWN_PLANT_PROGRESSIVO_v2.4.md:998-1015).
> Papel (§7.7 - :228-231): OBSERVA → COMPARA → DETECTA → ATUALIZA O QUE FOR MECÂNICO ou REPORTA O QUE EXIGIR DECISÃO.
> O Curador **não decide** arquitetura e **não** escolhe fonte canônica: §4.5 (:181) já decide — *o YAML vence*.

## Alterações mecanicamente reconciliáveis
- Nenhuma: o espelho em disco já é byte a byte o derivado do YAML canônico (nenhuma linha digitada à mão).

## Divergências
- Campos do modelo canônico que o objeto **não declara** (a ausência é um fato medido, não preenchido por suposição): `downplant.terreno`, `downplant.submodulo`, `downplant.circuito`, `downplant.porta`, `conexoes.origem`, `conexoes.destino`, `conexoes.contrato`, `escopo.artefatos`, `proibicoes.efeitos_externos`, `proibicoes.publicacao`.
  Origem da lista: objeto §46.12 (:971-996: `downplant.terreno|submodulo|circuito|porta`) e rubricas §46.11 (:927-968: `conexões`, `escopo.artefatos`, `proibições.efeitos_externos|publicação`).
  Regenerar o espelho **não** resolve: exige decisão (declarar o campo no YAML ou aceitar a ausência).
- Nenhuma referência declarada aponta para arquivo inexistente.
- Contrato de entrada §32.14 do handoff: verificado pelo **validador único** `scripts/downplant/validar-handoff.mjs` (não duplicado aqui — §32.14 tem um dono só).

## Links e Canvas
- `referencias.planta_mestra` -> `01_Planta/PLANTA_MESTRA.canvas`: existe em disco
- Canvas citados pelo commit observado: nenhum. Nenhum canvas foi sobrescrito ou editado por esta passagem.

## Handoffs YAML/Markdown divergentes
- `08_Execucao_Ao_Vivo/downplant_handoff.yaml` x `08_Execucao_Ao_Vivo/downplant_handoff.md`: **sem divergência** — o espelho é byte a byte o derivado do YAML (sha256 = 93941f948fb08f62..., 158 linhas).

## Atualização realizada
Nenhuma: esta rodada é somente leitura (o §46.13 exige `--aplicar` para a ação mecânica).

## Decisão humana necessária
1. declarar no YAML (ou aceitar como ausente) os campos do modelo não declarados: downplant.terreno, downplant.submodulo, downplant.circuito, downplant.porta, conexoes.origem, conexoes.destino, conexoes.contrato, escopo.artefatos, proibicoes.efeitos_externos, proibicoes.publicacao

## Resultado
**DIVERGENTE**

**Estado do Curador (§46.13):** `DIVERGENTE`

SINCRONIZADO | DIVERGENTE | NENHUMA AÇÃO
