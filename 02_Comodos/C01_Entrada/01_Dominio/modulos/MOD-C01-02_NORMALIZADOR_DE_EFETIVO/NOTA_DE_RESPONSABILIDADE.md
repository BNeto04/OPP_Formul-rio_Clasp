# MOD-C01-02_NORMALIZADOR_DE_EFETIVO

Responsabilidade canonica do modulo.

## Papel
Sincronizar a aba EFETIVO a partir do QO/PECULIO sem apagar registros extras, normalizando graduacao,
matricula, nome de guerra (desambiguacao por antiguidade N) e subunidade de produtividade.
Acionado pelo menu (Produtividade > "Sincronizar efetivo pelo peculio").

## Endereco no Down Plant
- Comodo: C01_Entrada | Modulo: MOD-C01-02_NORMALIZADOR_DE_EFETIVO
- Circuito: CIR-MOD-C01-02_NORMALIZADOR_DE_EFETIVO.canvas
- Submodulo: SUB-C01-02-01_DEPENDENCIA_ARCA (porta de consulta a ARCA)

## Artefatos
| Artefato | Funcao | Consome |
| :--- | :--- | :--- |
| Features/NormalizadorEfetivo.js | execucao da sincronizacao + log em [AUDITORIA] Efetivo | ARCA (metadados), PECULIO (leitura), EFETIVO (escrita) |
| Entrada/Menu.js | gatilho de menu (`normalizarEfetivo`) | - |
| Core/Constantes.js + Core/Utils.js | tabela canonica de graduacoes (`SyntheonNormalizador.normalizarGraduacao`) | - |

## Dependencia ARCA (G01 #127 - factual, nao mais declarativa)
- Regras aplicadas: ARCA-EFETIVO-001 (padronizacao de graduacoes), ARCA-EFETIVO-002 (desambiguacao de nomes de guerra),
  ARCA-MATRICULA-001 (higienizacao/validacao de matricula), ARCA-ANTIGUIDADE-001 (precedencia por menor N).
- API consumida: `AdaptadorConsultaArca.consultarPorRuleId(rule_id)` via `NormalizadorEfetivo.obterMetadadosArca()`.
- Fail-soft: se a ARCA estiver indisponivel, devolve `ARCA_METADATA_UNAVAILABLE` e a sincronizacao segue.
- Rastreabilidade: os IDs aplicados sao escritos na aba `[AUDITORIA] Efetivo` (linha "REGRAS ARCA").
- Sem duplicacao de regra: as tabelas/limiares continuam em Core/Constantes.js e Core/Utils.js (fonte unica).

## Limites
- Nao audita dados; nao corrige valores operacionais fora das colunas do EFETIVO.
- Nao promove heuristica a regra oficial.
