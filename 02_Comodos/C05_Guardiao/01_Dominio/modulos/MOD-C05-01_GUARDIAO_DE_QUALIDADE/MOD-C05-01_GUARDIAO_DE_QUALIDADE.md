# MOD-C05-01_GUARDIAO_DE_QUALIDADE

- **ID:** MOD-C05-01
- **Endereco Down Plant:** `C05_Guardiao / MOD-C05-01_GUARDIAO_DE_QUALIDADE` (escala: modulo) . circuito `CIR-MOD-C05-01_GUARDIAO_DE_QUALIDADE.canvas`
- **Estado (§19):** Codigo 🟢 . Teste 🟢 (`TestGuardiao` 32 PASS, `TestGuardiaoHeadless`) . Contrato 🟢 . Integracao 🟢 . Visual 🟢 (abas `[AUDITORIA]`/`[HISTORICO]` + coluna AM) . Publicacao 🟢 (81/81) . Documentacao 🟢 *(esta capsula; evidencia EV-C05-001)*
- **Perfil:** P1 (operacao recorrente)
- **Responsavel:** Proprietario (Manoel) - execucao por agentes sob card

## Responsabilidade
Fazer a **varredura estatica de integridade** das abas mensais: detectar, classificar e explicar incoerencias
com diagnosticos estruturados, **sem alterar dado operacional**, e publicar o resultado nas abas
`[AUDITORIA] Ocorrencias` e `[HISTORICO] Auditoria Ocorrencias`. E quem **audita**, nao quem corrige.

## Limites
- **Nao altera dado operacional** - nem colunas A:AL, nem formula: somente leitura + escrita nas abas de auditoria
  e no destaque da coluna **AM** (39).
- **Nao corrige:** corrigir e do modulo irmao `MOD-C05-02_NORMALIZADOR_DE_ABA` (via plano explicito).
- **Nao promove heuristica a regra:** o que a ARCA nao mapeia aparece como `NAO_AUDITAVEL`, nao como lei.
- **Nao se audita** (Governanca fora da propria auditoria) e a auditoria e **fail-closed** - nao passa sem.

## Entradas
Abas mensais (fatos + formulas) . metadados ARCA por `rule_id` (porta `AdaptadorConsultaArca`, fail-soft) .
catalogo PIP (`localizarAbaCatalogoPIP`) . base territorial AIS . fonte de antiguidade (`EFETIVO`/PECULIO).

## Saidas
Diagnosticos estruturados (`codigoRegra`, severidade, evidencia, acao recomendada) . abas de auditoria e
historico . destaques na coluna **AM** . resumo consolidado para a porta headless.

## Portas
| Porta | Direcao | Contrato (resumo) |
|---|---|---|
| Guardiao -> ARCA | consulta | `rule_id` -> metadados, **fail-soft** |
| Guardiao -> abas de auditoria | escrita | `[AUDITORIA] Ocorrencias` (sobrepoe) e `[HISTORICO]` (acumula) |
| Guardiao -> coluna AM | escrita | alerta em `AM` (39) com **A:AL preservadas** |
| Menu -> Guardiao | UI | `SpreadsheetApp.getUi()` |
| `clasp run` -> Guardiao | **headless** | `Features/GuardiaoHeadless.js` - planilha injetada, retorno **STRING JSON** |

## Conexoes
`C05 -> C03/ARCA` (regra canonica) . `C04/Motor -> C05` (merito/antiguidade) . `C02/Leitura -> C05` (mesma via de
leitura) . `C05 -> C05-02` (encaminha correcao) . `C05 -> C00/Governanca` (porta de auditoria).

## Invariantes
1. **A:AL intocaveis** - nenhuma formula, cor, borda ou zebrado de A:AL pode mudar.
2. **`QDT ARMAS` identico entre participantes do tunel e igual a soma de `ARMA` fisica** (ARCA-ARMAS-001) - a
   violacao vira diagnostico `QDT_ARMAS_DIVERGENTE_NO_TUNEL`.
3. **Auditoria fail-closed; entrada fail-open** (decisao do proprietario, registrada no #150).
4. **Nenhuma regra sem regra:** so audita o que a ARCA mapeia; o resto e declarado nao auditavel.

## Regras (dominio x heuristica)
| Regra | Onde rege | Artefato |
|---|---|---|
| Semantica `ARMA` x `QDT ARMAS` + invariante de tunel | ARCA-ARMAS-001 | `Dominio/ARCA/` |
| Ordem de antiguidade da equipe | ARCA-ANTIGUIDADE-002 | `Core/RegrasQualidade.js` |
| AIS ausente/divergente vs base territorial | ARCA-TERRITORIO-001 | `Features/GuardiaoQualidade.js` + `Dominio/ResolverAIS.js` |
| QTD.O divergente | ARCA (bloco ARCA-GUARD) | idem |
| Catalogo PIP: exige `TABELA` **+** `PIP` no nome | fix G01 #117 | `localizarAbaCatalogoPIP` |

## Tecnologia existente avaliada (§31.4)
Apps Script V8 . `SpreadsheetApp` para leitura e para as abas de auditoria . **nenhuma** biblioteca externa .

## Artefatos
`Features/GuardiaoQualidade.js` . `Features/GuardiaoHeadless.js` . `Core/RegrasQualidade.js` .
`Core/CoberturaAuditoria.js` . `Core/SaudeTuneis.js` . `Render/RendererAuditoria.js` .
`Render/RendererAuditoriaSaude.js` . `Render/PainelSaude.js` . `Features/CorretorQualidade.js` .

## Dependencias (§31.6)
| Dependencia | Vinculo | Versao/estado |
|---|---|---|
| [DEP-004](../../../../../dependencias/DEP-004_ABAS_E_BASES_CANONICAS.md) | catalogo PIP, base AIS, `EFETIVO` | ativo |
| [DEP-001](../../../../../dependencias/DEP-001_GOOGLE_APPS_SCRIPT.md) | runtime | ativo (V8) |
| `Dominio/ARCA/AdaptadorConsultaArca.js` | porta de regra | ativo (cache O(1)) |

## Erros
`MODO_LIMITADO_CATALOGO_PIP` / `CATALOGO_PIP_INDISPONIVEL` . `AIS_AUSENTE` / `AIS_DIVERGENTE` .
`QDT_ARMAS_DIVERGENTE_NO_TUNEL` . `ORDEM_ANTIGUIDADE_EQUIPE` . `QTD_O_DIVERGENTE` .
`FATO_NAO_AUDITAVEL_AUTOMATICAMENTE` . fonte de antiguidade ausente => merito **nao avaliado**.

## Observabilidade
Painel de saude com drill-down MES -> TUNEL -> LINHAS -> DIAGNOSTICO . aba `[HISTORICO]` acumulativa com linha
em branco separando execucoes . `GuardiaoHeadless.resumir()` (aba/status/tuneis/linhas/alertas) .

## Testes (fechaduras)
`Testes/TestGuardiao.js` (**32 PASS / 0 FAIL** em 12/09) . `Testes/TestGuardiaoHeadless.js` .
`Testes/TestSemanticaArmasQdt.js` (6/6) . `TesteArca*`: `TestArcaConsumidores` 9/9,
`TestArcaMapaCobertura` 11/11, `TestIntegracaoArca` 7/7 . Suite global `620 PASS` (`b74f9d0`).

## Evidencias
- [EV-C05-001](../../../05_Evidencias/EV-C05-001_GUARDIAO_SEMANTICA_ARMAS.md) (#141, #146-#149).
- Commits: `0c489ad` (#141), `fa52c07` (#148/#141), `c60aeea` (#146/#147), `266a7db` (#149), `b74f9d0` (suite).

## Divergencias conhecidas
- O ajuste do #141 (`armaLinha`/`armas`) corrigiu a leitura da **coluna 32** onde o Guardiao somava participacao
  como fisica (8 em vez de 2 no tunel de 4 policiais) - o numero esta medido, nao estimado.
- **Numeros de suite diferentes por card** (411 / 423 / 620 PASS) porque a suite cresceu; cada numero vale no seu
  momento. `TestVigiaNaturalLanguage` e um **vermelho pre-existente** (Ollama offline) desconsiderado pelos cards.
- O espelho Obsidian usa outra taxonomia (`SUB-C05-01_AUDITORIA_E_INTEGRIDADE`) - divergencia tratada no **#154**.

## Critérios de verde
Zero alteracao em A:AL . diagnosticos com regra ARCA mapeada . invariante de armas provada . suite verde .
abas de auditoria e historico atualizadas . capsula e evidencia presentes.
