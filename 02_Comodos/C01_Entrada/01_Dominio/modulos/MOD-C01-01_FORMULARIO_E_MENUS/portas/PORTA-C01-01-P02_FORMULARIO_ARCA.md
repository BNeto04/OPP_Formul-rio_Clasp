# PORTA C01/MOD-C01-01/P02 — Formulario/OCR → ARCA (metadados canonicos do veiculo)

- **Endereço global:** `C01_Entrada/MOD-C01-01_FORMULARIO_E_MENUS/P02`
- **Escala:** modulo
- **Origem:** parser do formulario (heuristica OCR) — `Entrada/EntradaManual.js:802` (`obterMetadadosArcaVeiculo`)
- **Destino:** ARCA (Catalogo Canonico de Regras de Dominio), fora da Planta — `Dominio/ARCA/AdaptadorConsultaArca.js:155` (`consultarPorRuleId`)
- **Elegibilidade (§12.6):** ELEGÍVEL — (A) cruza Comodo/fronteira: o destino esta **fora da Planta** (a ARCA e dependencia transversal)
- **Estado:** VERDE — checklist §12.6 sem itens pendentes

## Payload
`rule_id` fixo `ARCA-VEICULO-001` (`Entrada/EntradaManual.js:803`); devolve `{ ok, rule_id, titulo_pip, campo_avaliado, campo_proibido_para_inferencia, fronteira, origem }` (`:815-823`).

## require
1. `AdaptadorConsultaArca` existe e expoe `consultarPorRuleId` (`Entrada/EntradaManual.js:805-808`).
2. a regra existe na ARCA carregada (`Dominio/ARCA/AdaptadorConsultaArca.js:165-172`).

## ensure
1. **fail-soft garantido**: qualquer indisponibilidade devolve `{ ok:false, motivo }` e o cliente segue com o rotulo local (`Entrada/EntradaManual.js:806-808,821-823`).
2. a resposta e **congelada** (`Object.freeze`, `Dominio/ARCA/AdaptadorConsultaArca.js:158,167,183`) — o consumidor nao consegue mutar a regra canonica.
3. fronteira declarada: a ARCA **nao** le o BO e **nao** decide por regex; a leitura do documento continua no parser do formulario (`Entrada/EntradaManual.js:796-798`).

## invariant
1. a Porta e **somente leitura** (`AdaptadorConsultaArca.js:5`): nao escreve na ARCA nem no documento.
2. a regra oficial nunca e substituida por heuristica: `is_official` vem do catalogo (`AdaptadorConsultaArca.js:174`).

## Checklist de produção (§12.6)

| Item | Estado | Resposta (fato medido) |
|---|---|---|
| idempotente | aplicavel | somente leitura: mesmo `rule_id` ⇒ mesmo metadado, nenhum estado alterado. |
| deduplicacao | nao_aplicavel | nao cria registro; a repeticao da consulta nao gera duplicata em lugar nenhum. |
| rate_limit | nao_aplicavel | chamada em processo contra catalogo local (JSON em disco), sem volume externo nem rede. |
| paginacao | nao_aplicavel | a resposta e **uma** regra (`AdaptadorConsultaArca.js:183-201`). |
| validacao_entrada | aplicavel | `rule_id` e constante declarada no chamador (`Entrada/EntradaManual.js:803`); ausencia do adaptador e tratada antes do uso (`:805-808`). |
| operacao_atomica | nao_aplicavel | sem efeito de escrita: nao existe estado intermediario. |
| race_condition | nao_aplicavel | leitura de catalogo imutavel dentro do processo; o cache e congelado (`AdaptadorConsultaArca.js:137`). |
| cache | aplicavel | Instalacao transversal **de leitura**: singleton congelado `_cacheArca` (`AdaptadorConsultaArca.js:108,137`), invalidado explicitamente por `limparCache()` (`:98`) e por `configurarCaminho()` (`:90-93`). **Referencia a implementacao existente — nao repetida aqui.** |
| retry_pelo_cliente | nao_aplicavel | o cliente nao re-tenta: fail-soft devolve `{ok:false, motivo}` e o rotulo local e usado (`Entrada/EntradaManual.js:806-808`). |

## Erros
`ARCA_METADATA_UNAVAILABLE` · `ARCA_RULE_NOT_MAPPED` · `ARCA_RULE_NOT_FOUND` · `ARCA_METADATA_ERROR` (`Entrada/EntradaManual.js:806,811,822`; `AdaptadorConsultaArca.js:159,168`).

## Efeitos
Nenhum efeito persistente. Leitura de catalogo + cache de processo.

## Seguranca
Somente leitura do catalogo local; sem rede, sem token, sem dado de pessoa.

## Observabilidade
`status` tipado na resposta (`MAPPED`/`ARCA_*`), rastreavel pelo chamador (`Entrada/EntradaManual.js:822` registra `origem`).

## Implementacao
`Entrada/EntradaManual.js:802-824` → `Dominio/ARCA/AdaptadorConsultaArca.js:107-202`.

## Testes
`Testes/TestArcaConsumidores.js` · `Testes/TestArcaNormalizadorEfetivo.js` · `Testes/TestArcaVeiculoOcr.js`.

## Evidencia
Leitura direta do codigo nesta sessao (13/09/2026): `Entrada/EntradaManual.js:803,805,812,822`; `Dominio/ARCA/AdaptadorConsultaArca.js:108,137,158,165`.

## Estado
Contrato declarado. Checklist §12.6 completo (0 pendentes). Antes deste card a Porta existia como linha **`Formulario → ARCA`** na capsula de C01-01, sem arquivo §46.3.
