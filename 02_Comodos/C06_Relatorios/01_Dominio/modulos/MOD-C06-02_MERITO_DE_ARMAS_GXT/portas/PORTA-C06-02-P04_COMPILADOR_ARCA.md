# PORTA C06/MOD-C06-02/P04 — Compilador de armas → ARCA (regras R1-R10)

- **Endereço global:** `C06_Relatorios/MOD-C06-02_MERITO_DE_ARMAS_GXT/P04`
- **Escala:** modulo
- **Origem:** **declarada** na capsula de C06-02: `Compilador -> ARCA` | consulta | regras R1-R9 inferidas + R10 ditada pelo proprietario
- **Destino:** ARCA (catalogo canonico) — destino declarado; **nenhuma chamada existe no runtime**
- **Elegibilidade (§12.6):** ELEGÍVEL — (A) cruza fronteira: o destino declarado esta **fora da Planta** (ARCA). ATENCAO: a Porta esta **declarada sem implementacao** (divergencia **D-164-02**)
- **Estado:** VERDE — 0 bloqueante (§12.6); os 3 itens de existencia foram decididos por **NAO_APLICAVEL com justificativa medida** (a implementacao nao existe). A Porta segue declarada como NAO IMPLEMENTADA.

## Payload
**Nao existe.** Medicao: `grep -n 'AdaptadorConsultaArca|consultarPorRuleId' Compilador_Armas.js` = **0** ocorrencias; as unicas referencias do repositorio a `AdaptadorConsultaArca` estao em `Core/RegrasQualidade.js:32-38`, `Entrada/EntradaManual.js:805-812`, `Features/NormalizadorEfetivo.js:258-268` e no proprio adaptador. As regras R1-R9 vivem em **documento** (`Dominio/ARCA/REGRAS_ARMAS_INFERIDAS.md`) e o R10 (desempate por antiguidade) esta **codificado localmente** em `Compilador_Armas.js:241-249` — sem consulta a ARCA.

## require
1. **nao verificavel hoje:** nao ha chamada, portanto nao ha pre-condicao executavel. O que se pode exigir e o **reconhecimento de uma das duas saidas**: implementar a consulta **ou** retirar esta Porta da capsula.
2. quando implementada, deve seguir a mesma porta canonica das demais consultas a ARCA (`Dominio/ARCA/AdaptadorConsultaArca.consultarPorRuleId`, `:155`) — nao criar caminho paralelo de leitura do catalogo.

## ensure
1. **nao verificavel hoje.** A funcao `executarCompilador` (`Compilador_Armas.js:130-354`) nao le a ARCA: o desempate por antiguidade e codigo local (`:241-249`) e a legenda vem de `Core/LegendaCores.js` (`:320-322`).
2. quando implementada, o ensure minimo e: metadado de regra retornado com `status:'MAPPED'` e fail-soft identico ao das Portas C01/MOD-C01-02/P01 e C05/MOD-C05-01/P01.

## invariant
1. **fato medido (vale hoje):** o compilador **nao** depende da ARCA para funcionar — a Porta e documental. A fonte real das regras aplicadas e o codigo + `Dominio/ARCA/REGRAS_ARMAS_INFERIDAS.md`.
2. a ARCA, quando consultada, permanece somente-leitura.

## Checklist de produção (§12.6)

| Item | Estado | Resposta (fato medido) |
|---|---|---|
| idempotente | nao_aplicavel | **Justificativa (medida em 14/09/2026):** nao existe comportamento idempotente a declarar porque **a consulta a ARCA NAO EXISTE no runtime**. Medicao: `grep -n "AdaptadorConsultaArca\|consultarPorRuleId\|obterRegra" Compilador_Armas.js Motor/PoliticaMeritoArmas.js` => **0 ocorrencias** (as unicas mencoes de ARCA no arquivo sao comentarios sobre o indice de antiguidade de `Core/Policiais.js`). Sem chamada nao ha idempotencia a contratar; a decisao do Planner (14/09/2026, §3) e explicita: **proibido criar implementacao apenas para satisfazer documentacao**. A promessa foi RETIRADA da capsula de C06-02 (linha da tabela de Portas marcada como prevista e nao implementada). |
| deduplicacao | nao_aplicavel | **Justificativa (medida):** nao ha consumo a deduplicar — nenhum chamador consulta regra/servico ARCA no compilador de armas (mesma medicao: 0 ocorrencias de `AdaptadorConsultaArca`/`consultarPorRuleId` em `Compilador_Armas.js` e `Motor/PoliticaMeritoArmas.js`). Item sem objeto: declarar `aplicavel` seria afirmar fato inexistente. |
| rate_limit | nao_aplicavel | quando implementada, e leitura local de catalogo em processo, sem volume externo nem rede (padrao das demais consultas a ARCA). |
| paginacao | nao_aplicavel | a resposta prevista e metadado de regra, um item por `rule_id`. |
| validacao_entrada | nao_aplicavel | **Justificativa (medida):** sem implementacao nao existe `rule_id` de entrada para validar. A consulta a ARCA segue **prevista e nao implementada** (divergencia **D-164-02**); a capsula perdeu a promessa e a Porta permanece declarada para que a decisao futura (implementar OU retirar) tenha endereco. |
| operacao_atomica | nao_aplicavel | consulta prevista e somente leitura — sem estado intermediario. |
| race_condition | nao_aplicavel | consulta prevista sobre catalogo imutavel com cache congelado no adaptador (`Dominio/ARCA/AdaptadorConsultaArca.js:108,137`). |
| cache | nao_aplicavel | quando implementada, deve usar a porta canonica e **herda** o cache existente do adaptador — nada a decidir aqui (§12.6: referenciar, nao repetir). |
| retry_pelo_cliente | nao_aplicavel | o padrao das consultas a ARCA e fail-soft (devolve status ao chamador, sem re-tentativa) — `Core/RegrasQualidade.js:40-44`. |

## Erros
**Nenhum contratado** — nao ha implementacao que possa falhar (declarado).

## Efeitos
Nenhum. A Porta nao produz efeito algum hoje.

## Seguranca
Sem leitura externa hoje. Quando implementada: somente leitura do catalogo local.

## Observabilidade
Nenhuma. O compilador registra `logs` proprios (`Compilador_Armas.js:133-139`), sem associacao a `rule_id` da ARCA — a rastreabilidade regra x codigo existe apenas como documento (`REGRAS_ARMAS_INFERIDAS.md`).

## Implementacao
**Ausente.** Declaracao: `02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-02_MERITO_DE_ARMAS_GXT/MOD-C06-02_MERITO_DE_ARMAS_GXT.md` (secao `## Portas`); documento de regras: `Dominio/ARCA/REGRAS_ARMAS_INFERIDAS.md`; codigo do R10: `Compilador_Armas.js:241-249`.

## Testes
Nenhum teste exercita esta Porta — nao ha o que exercitar (declarado).

## Evidencia
Medicao nesta sessao (13/09/2026): `grep -n 'AdaptadorConsultaArca\|consultarPorRuleId' Compilador_Armas.js` = 0 linhas; `grep -rn AdaptadorConsultaArca --include=*.js` lista apenas `Core/RegrasQualidade.js:32,35`, `Entrada/EntradaManual.js:805,806`, `Features/NormalizadorEfetivo.js:258,260,268` e `Dominio/ARCA/AdaptadorConsultaArca.js`.

## Estado
Contrato declarado **como nao implementado**. **0 item `pendente`/0 bloqueante**: os 3 itens de existencia foram decididos em 14/09/2026 como **NAO_APLICAVEL com justificativa medida** (a consulta a ARCA nao existe no runtime). **Fechamento (#164, 14/09/2026):** o Planner admitia duas saidas — implementar ou retirar (proibido implementar para satisfazer documentacao); a medicao sustenta a **retirada da promessa da capsula**, e a Porta permanece declarada para preservar o rastro da decisao. Esta e a unica Porta do inventario cuja pendencia nao era de operacao, mas de **existencia**: ou a capsula de C06-02 perde a linha, ou a consulta a ARCA e implementada (divergencia **D-164-02**).
