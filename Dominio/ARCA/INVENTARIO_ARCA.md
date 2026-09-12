# ARCA — Levantamento de Regras de Domínio

> Documento gerado automaticamente a partir de `Dominio/ARCA/arca_regras_dominio.json`.
> Fonte da verdade: o JSON. Este arquivo é um retrato (retrato = levantamento).

## Visão geral

| Métrica | Valor |
|---|---|
| Total de regras | **45** |
| Auditadas pelo Guardião (MAPEADO) | **29** |
| Aplicadas por outros componentes (INTEGRADO) | **7** |
| Estruturais / não-auditáveis (NAO_APLICAVEL) | **9** |

**Leitura:** não existem regras "cegas". As 45 regras têm destino: 29 o Guardião audita,
7 são aplicadas pelo NormalizadorEfetivo/plugins via porta ARCA (#127), e 9 são
estruturais (agregação, layout, entrada de dados) que por definição não geram diagnóstico de planilha.

## Fluxo (fluid flow)

```
  ENTRADA            NORMALIZACAO           PLANILHA            GUARDIAO             METRICAS
  Formulario   ->    NormalizadorEfetivo -> abas mensais  ->    29 diagnosticos ->   plugins
  EntradaManual      (porta ARCA #127)     (tuneis)           (auditoria)          (PIP/drogas/armas)
```

## MAPEADO — auditadas pelo Guardião (29)

Cada regra abaixo tem um diagnóstico que o Guardião emite na planilha.

### `ARCA-ARMAS-001` — Fonte Exclusiva de Arma Física (Coluna ARMA x Exclusão de QDT ARMAS)
- **Categoria:** DEFINICAO_METRICA · **Subdomínio:** armas · **Cobertura:** COBERTO · **Confiança:** ALTA
- **Condição:** Cálculo e totalização de armas apreendidas no mês/trimestre.
- **Esperado:** Total de armas = soma da coluna ARMA (col 12); QDT ARMAS ignorada em somas; QDT ARMAS deve ser idêntico para todos os participantes do túnel e igual à soma de A
- **Diagnóstico(s):** `QDT_ARMAS_DIVERGENTE_NO_TUNEL`
- **Consumidor(es) real(is):** `Features/CompiladorGxt.js`, `Motor/PoliticaMeritoArmas.js`, `Features/GuardiaoQualidade.js`
- **Motivo (não-auditável):** Codigo de diagnostico emitido pelo Guardiao (QDT_ARMAS_DIVERGENTE_NO_TUNEL) com metadados ARCA via porta. Invariante definida no card #141: QDT ARMAS identico entre participantes e igual a soma de ARMA do tunel.

### `ARCA-ARMAS-002` — Reconhecimento Textual de Arma Artesanal
- **Categoria:** CLASSIFICACAO · **Subdomínio:** armas · **Cobertura:** COBERTO · **Confiança:** ALTA
- **Condição:** Presença do termo ARTESANAL nas colunas de tipo, modelo, descrição ou natureza.
- **Esperado:** Contabilização na métrica armasArtesanais e segregação das armas de fogo industriais.
- **Diagnóstico(s):** `ARMA_ARTESANAL_INCONSISTENTE`
- **Consumidor(es) real(is):** `Features/CompiladorGxt.js`, `Motor/PoliticaMeritoArmas.js`, `Features/GuardiaoQualidade.js`
- **Motivo (não-auditável):** Codigo de diagnostico emitido pelo Guardiao com metadados ARCA via porta (regra do proprietario 12/09: artesanal nao entra na quantidade fisica ARMA).

### `ARCA-ARMAS-003` — Consistência de Indicador PIP de Arma vs Apreensão Física
- **Categoria:** CONSISTENCIA_MATERIAL · **Subdomínio:** armas · **Cobertura:** COBERTO · **Confiança:** ALTA
- **Condição:** Indicador inclui "ARMA DE FOGO" ou "ARMA LONGA" e armas <= 0.
- **Esperado:** Diagnóstico ALERTA FATO_ARMA_AUSENTE.
- **Diagnóstico(s):** `FATO_ARMA_AUSENTE`
- **Consumidor(es) real(is):** `Core/RegrasQualidade.js`, `Features/GuardiaoQualidade.js`
- **Motivo (não-auditável):** Codigo de diagnostico emitido pelo Guardiao com metadados ARCA via porta.

### `ARCA-AUDITORIA-001` — Classificacao de Saude por Tunel
- **Categoria:** SAUDE_AUDITORIA · **Subdomínio:** auditoria · **Cobertura:** COBERTO · **Confiança:** ALTA
- **Condição:** Tunel com diagnosticos e/ou estrutura incompleta.
- **Esperado:** Contagem de tuneis saudaveis/alerta/critico/incompleto/nao auditavel por mes e por tunel.
- **Diagnóstico(s):** —
- **Consumidor(es) real(is):** `Core/SaudeTuneis.js`, `Features/GuardiaoQualidade.js`
- **Motivo (não-auditável):** Regra tecnica do proprio auditor: nao gera diagnostico; descreve comportamento da varredura (classificacao de saude / cobertura) e por isso nao tem codigo associado.

### `ARCA-AUDITORIA-002` — Cobertura de Auditoria e Declaracao de NAO_AUDITADO
- **Categoria:** COBERTURA · **Subdomínio:** auditoria · **Cobertura:** COBERTO · **Confiança:** ALTA
- **Condição:** Varredura concluida com dependencia ausente ou diagnostico sem metadados ARCA.
- **Esperado:** Status COMPLETA|PARCIAL e lista de regras NAO_AUDITADAS com motivo.
- **Diagnóstico(s):** —
- **Consumidor(es) real(is):** `Core/CoberturaAuditoria.js`, `Features/GuardiaoQualidade.js`
- **Motivo (não-auditável):** Regra tecnica do proprio auditor: nao gera diagnostico; descreve comportamento da varredura (classificacao de saude / cobertura) e por isso nao tem codigo associado.

### `ARCA-BOE-001` — Unicidade de BOE por MIKE (Consistência PCPE x PMPE)
- **Categoria:** VALIDACAO_CRUZADA · **Subdomínio:** boe · **Cobertura:** COBERTO · **Confiança:** ALTA
- **Condição:** Mapeamento cruzado detectar mais de um BOE associado ao mesmo MIKE.
- **Esperado:** Diagnóstico ALERTA MIKE_BOE_DIVERGENTE.
- **Diagnóstico(s):** `MIKE_BOE_DIVERGENTE`
- **Consumidor(es) real(is):** `Core/RegrasQualidade.js`, `Features/GuardiaoQualidade.js`
- **Motivo (não-auditável):** Codigo de diagnostico emitido pelo Guardiao com metadados ARCA via porta.

### `ARCA-BOE-002` — Obrigatoriedade do BOE (Número da Polícia Civil)
- **Categoria:** OBRIGATORIEDADE · **Subdomínio:** boe · **Cobertura:** COBERTO · **Confiança:** ALTA
- **Condição:** MIKE presente com BOE vazio em todas as linhas do túnel.
- **Esperado:** Diagnóstico ALERTA BOE_AUSENTE.
- **Diagnóstico(s):** `BOE_AUSENTE`
- **Consumidor(es) real(is):** `Core/RegrasQualidade.js`, `Features/GuardiaoQualidade.js`
- **Motivo (não-auditável):** Codigo de diagnostico emitido pelo Guardiao com metadados ARCA via porta.

### `ARCA-DROGAS-001` — Validação Material Obrigatória por Tipo de Entorpecente
- **Categoria:** CONSISTENCIA_MATERIAL · **Subdomínio:** drogas · **Cobertura:** COBERTO · **Confiança:** MEDIA
- **Condição:** Indicador contém MACONHA/CRACK/COCAINA com fato correspondente <= 0.
- **Esperado:** Diagnóstico ALERTA FATO_MACONHA_AUSENTE / FATO_CRACK_AUSENTE / FATO_COCAINA_AUSENTE.
- **Diagnóstico(s):** `FATO_COCAINA_AUSENTE`, `FATO_CRACK_AUSENTE`, `FATO_MACONHA_AUSENTE`
- **Consumidor(es) real(is):** `Core/RegrasQualidade.js`, `Features/GuardiaoQualidade.js`
- **Motivo (não-auditável):** Codigo de diagnostico emitido pelo Guardiao com metadados ARCA via porta.

### `ARCA-EFETIVO-003` — Matricula sem Nome de Policial Vinculado
- **Categoria:** EFETIVO · **Subdomínio:** efetivo · **Cobertura:** COBERTO · **Confiança:** ALTA
- **Condição:** Linha de tunel com matricula preenchida e coluna de policial vazia.
- **Esperado:** Diagnostico OBSERVACAO POLICIAL_SEM_NOME pedindo confirmacao do nome vinculado.
- **Diagnóstico(s):** `POLICIAL_SEM_NOME`
- **Consumidor(es) real(is):** `Features/GuardiaoQualidade.js`
- **Motivo (não-auditável):** Codigo de diagnostico emitido pelo Guardiao com metadados ARCA via porta.

### `ARCA-IMPUTACAO-001` — Preenchimento Obrigatório da Situação de Imputação (AG x AH)
- **Categoria:** CONSISTENCIA_CAMPOS · **Subdomínio:** imputacao · **Cobertura:** COBERTO · **Confiança:** ALTA
- **Condição:** AG preenchido sem AH -> EVENTO_INCOMPLETO_AG; AH preenchido sem AG -> IMPUTADO_SEM_EVENTO_AH; AH diferente de COM/SEM IMPUTADO -> IMPUTADO_INVALIDO.
- **Esperado:** Diagnóstico ALERTA nas linhas divergentes.
- **Diagnóstico(s):** `EVENTO_INCOMPLETO_AG`, `IMPUTADO_INVALIDO`, `IMPUTADO_SEM_EVENTO_AH`
- **Consumidor(es) real(is):** `Core/RegrasQualidade.js`, `Features/GuardiaoQualidade.js`
- **Motivo (não-auditável):** Codigo de diagnostico emitido pelo Guardiao com metadados ARCA via porta.

### `ARCA-MATRICULA-002` — Obrigatoriedade de Matrícula para Policial com Nome Declarado
- **Categoria:** INTEGRIDADE_CADASTRO · **Subdomínio:** matricula · **Cobertura:** COBERTO · **Confiança:** ALTA
- **Condição:** Linha operacional com nome de policial preenchido e coluna matrícula em branco.
- **Esperado:** Diagnóstico ALERTA MATRICULA_AUSENTE.
- **Diagnóstico(s):** `MATRICULA_AUSENTE`
- **Consumidor(es) real(is):** `Core/RegrasQualidade.js`, `Features/GuardiaoQualidade.js`
- **Motivo (não-auditável):** Codigo de diagnostico emitido pelo Guardiao com metadados ARCA via porta.

### `ARCA-MATRICULA-003` — Matricula em Multiplas Ocorrencias na Mesma Data
- **Categoria:** EFETIVO · **Subdomínio:** matricula · **Cobertura:** COBERTO · **Confiança:** ALTA
- **Condição:** Mesma matricula presente em 2 ou mais MIKEs com a mesma data.
- **Esperado:** Diagnostico OBSERVACAO MATRICULA_MULTIPLAS_OCORRENCIAS_MESMA_DATA com os MIKEs envolvidos.
- **Diagnóstico(s):** `MATRICULA_MULTIPLAS_OCORRENCIAS_MESMA_DATA`
- **Consumidor(es) real(is):** `Core/CoberturaAuditoria.js`, `Features/GuardiaoQualidade.js`
- **Motivo (não-auditável):** Codigo de diagnostico emitido pelo Guardiao com metadados ARCA via porta.

### `ARCA-MERITO-001` — Atribuição Exclusiva do Mérito de Armas ao Líder mais Antigo (Menor N)
- **Categoria:** ATRIBUICAO_MERITO · **Subdomínio:** merito_armas · **Cobertura:** COBERTO · **Confiança:** ALTA
- **Condição:** Ocorrência com apreensão de arma de fogo ou artesanal física > 0.
- **Esperado:** Atribuição de todas as armas da ocorrência ao líder identificado pelo menor N da equipe.
- **Diagnóstico(s):** `MERITO_ARMAS_ANTIGUIDADE_AUSENTE`
- **Consumidor(es) real(is):** `Core/RegrasQualidade.js`, `Features/CompiladorGxt.js`, `Features/GuardiaoQualidade.js`, `Motor/PoliticaMeritoArmas.js`
- **Motivo (não-auditável):** Codigo de diagnostico emitido pelo Guardiao com metadados ARCA via porta.

### `ARCA-MERITO-002` — Bloqueio Crítico por Empate de Antiguidade N na Ocorrência Armada
- **Categoria:** BLOQUEIO_AUDITORIA · **Subdomínio:** merito_armas · **Cobertura:** COBERTO · **Confiança:** ALTA
- **Condição:** Dois integrantes empatados no menor valor N.
- **Esperado:** Diagnóstico CRÍTICO MERITO_ARMAS_EMPATE_ANTIGUIDADE e status PENDENTE.
- **Diagnóstico(s):** `MERITO_ARMAS_EMPATE_ANTIGUIDADE`
- **Consumidor(es) real(is):** `Core/RegrasQualidade.js`, `Features/GuardiaoQualidade.js`, `Motor/PoliticaMeritoArmas.js`
- **Motivo (não-auditável):** Codigo de diagnostico emitido pelo Guardiao com metadados ARCA via porta.

### `ARCA-MERITO-003` — Isolamento da Fonte Pecúlio Externo (Proibição de Fallback)
- **Categoria:** SEGURANCA_DADOS · **Subdomínio:** merito_armas · **Cobertura:** COBERTO · **Confiança:** ALTA
- **Condição:** Tentativa de leitura de antiguidade N.
- **Esperado:** Consumo via CONFIG_SYNTHEON.obterIdPeculio(); se inacessível, emite OBSERVACAO única sem ler dados locais espúrios.
- **Diagnóstico(s):** `ANTIGUIDADE_FONTE_NAO_LOCALIZADA`
- **Consumidor(es) real(is):** `Core/RegrasQualidade.js`, `Features/GuardiaoQualidade.js`
- **Motivo (não-auditável):** Codigo de diagnostico emitido pelo Guardiao com metadados ARCA via porta.

### `ARCA-MIKE-001` — Conformidade Temporal do Código MIKE (PMPE/CIODS)
- **Categoria:** INTEGRIDADE_TEMPORAL · **Subdomínio:** mike · **Cobertura:** COBERTO · **Confiança:** ALTA
- **Condição:** MIKE numérico >= 8 dígitos na faixa de anos 2020 a 2030 onde ano, mês ou dia divergem da coluna DATA.
- **Esperado:** Diagnóstico ALERTA MIKE_DATA_DIVERGENTE.
- **Diagnóstico(s):** `MIKE_DATA_DIVERGENTE`
- **Consumidor(es) real(is):** `Core/RegrasQualidade.js`, `Features/GuardiaoQualidade.js`
- **Motivo (não-auditável):** Codigo de diagnostico emitido pelo Guardiao com metadados ARCA via porta.

### `ARCA-MIKE-002` — Unicidade de Datas por MIKE
- **Categoria:** VALIDACAO_CRUZADA · **Subdomínio:** mike · **Cobertura:** COBERTO · **Confiança:** ALTA
- **Condição:** Mapeamento cruzado encontrar mais de uma data distinta associada ao mesmo número MIKE.
- **Esperado:** Diagnóstico ALERTA MIKE_DATAS_DIVERGENTES em todas as linhas envolvidas.
- **Diagnóstico(s):** `MIKE_DATAS_DIVERGENTES`
- **Consumidor(es) real(is):** `Core/RegrasQualidade.js`, `Features/GuardiaoQualidade.js`
- **Motivo (não-auditável):** Codigo de diagnostico emitido pelo Guardiao com metadados ARCA via porta.

### `ARCA-MIKE-003` — Detecção de MIKE Incompleto ou Sinteticamente Suspeito
- **Categoria:** SINTAXE · **Subdomínio:** mike · **Cobertura:** COBERTO · **Confiança:** MEDIA
- **Condição:** MIKE sanitizado possuir apenas 2026 ou entre 1 e 7 dígitos.
- **Esperado:** Diagnóstico ALERTA MIKE_SUSPEITO sem interrupção da varredura.
- **Diagnóstico(s):** `MIKE_SUSPEITO`
- **Consumidor(es) real(is):** `Core/RegrasQualidade.js`, `Features/GuardiaoQualidade.js`
- **Motivo (não-auditável):** Codigo de diagnostico emitido pelo Guardiao com metadados ARCA via porta.

### `ARCA-MIKE-004` — Fragmentacao de Tunel por Chave Inconsistente
- **Categoria:** INTEGRIDADE_CHAVE · **Subdomínio:** mike · **Cobertura:** COBERTO · **Confiança:** ALTA
- **Condição:** MIKE com mesmas datas e BOE, porem presente em mais de uma chave de tunel.
- **Esperado:** Diagnostico ALERTA TUNEL_FRAGMENTADO com as chaves e linhas envolvidas.
- **Diagnóstico(s):** `TUNEL_FRAGMENTADO`
- **Consumidor(es) real(is):** `Core/SaudeTuneis.js`, `Features/GuardiaoQualidade.js`
- **Motivo (não-auditável):** Codigo de diagnostico emitido pelo Guardiao com metadados ARCA via porta.

### `ARCA-MUNICOES-001` — Consistência de Indicador PIP de Munição vs Quantidade Física
- **Categoria:** CONSISTENCIA_MATERIAL · **Subdomínio:** municoes · **Cobertura:** COBERTO · **Confiança:** ALTA
- **Condição:** Indicador inclui "MUNICAO" e municoes <= 0.
- **Esperado:** Diagnóstico ALERTA FATO_MUNICAO_AUSENTE.
- **Diagnóstico(s):** `FATO_MUNICAO_AUSENTE`
- **Consumidor(es) real(is):** `Core/RegrasQualidade.js`, `Features/GuardiaoQualidade.js`
- **Motivo (não-auditável):** Codigo de diagnostico emitido pelo Guardiao com metadados ARCA via porta.

### `ARCA-NUMERARIO-001` — Resguardo da Não Auditabilidade Automática de Numerário
- **Categoria:** DISCRICIONARIEDADE_HUMANA · **Subdomínio:** numerario · **Cobertura:** COBERTO · **Confiança:** ALTA
- **Condição:** Indicador PIP contendo NUMERARIO ou DINHEIRO com valor lido <= 0.
- **Esperado:** Emissão de diagnóstico OBSERVACAO com código FATO_NAO_AUDITAVEL_AUTOMATICAMENTE.
- **Diagnóstico(s):** `FATO_NAO_AUDITAVEL_AUTOMATICAMENTE`
- **Consumidor(es) real(is):** `Core/RegrasQualidade.js`, `Features/GuardiaoQualidade.js`
- **Motivo (não-auditável):** Codigo de diagnostico emitido pelo Guardiao com metadados ARCA via porta.

### `ARCA-OCORRENCIA-002` — Ocorrência Órfã (Linha sem Identificação do Despacho)
- **Categoria:** VALIDACAO · **Subdomínio:** ocorrencia · **Cobertura:** COBERTO · **Confiança:** ALTA
- **Condição:** Linha sem MIKE contendo matrícula, policial, indicador, imputado ou apreensões físicas.
- **Esperado:** Diagnóstico CRÍTICO OCORRENCIA_ORFA.
- **Diagnóstico(s):** `OCORRENCIA_ORFA`
- **Consumidor(es) real(is):** `Core/RegrasQualidade.js`, `Features/GuardiaoQualidade.js`
- **Motivo (não-auditável):** Codigo de diagnostico emitido pelo Guardiao com metadados ARCA via porta.

### `ARCA-OCORRENCIA-003` — Imputação Funcional Obrigatória da Ocorrência
- **Categoria:** VALIDACAO · **Subdomínio:** ocorrencia · **Cobertura:** COBERTO · **Confiança:** ALTA
- **Condição:** Túnel com fatos > 0 ou eventos > 0 e nenhuma matrícula vinculada.
- **Esperado:** Diagnóstico CRÍTICO TUNEL_SEM_EQUIPE e status INVALIDO_SEM_EQUIPE.
- **Diagnóstico(s):** `TUNEL_SEM_EQUIPE`
- **Consumidor(es) real(is):** `Core/RegrasQualidade.js`, `Features/GuardiaoQualidade.js`
- **Motivo (não-auditável):** Codigo de diagnostico emitido pelo Guardiao com metadados ARCA via porta.

### `ARCA-OCORRENCIA-004` — Justificativa de Ocorrência sem Fatos Físicos
- **Categoria:** VALIDACAO · **Subdomínio:** ocorrencia · **Cobertura:** COBERTO · **Confiança:** ALTA
- **Condição:** Túnel com policiais e zero fatos físicos e zero eventos PIP.
- **Esperado:** Diagnóstico ALERTA TUNEL_SEM_FATOS com status INVALIDO_SEM_FATOS.
- **Diagnóstico(s):** `TUNEL_SEM_FATOS`
- **Consumidor(es) real(is):** `Core/RegrasQualidade.js`, `Features/GuardiaoQualidade.js`
- **Motivo (não-auditável):** Codigo de diagnostico emitido pelo Guardiao com metadados ARCA via porta.

### `ARCA-PIP-001` — Divisor Regulamentar Fixo de Rateio PIP (Quotas /4)
- **Categoria:** CALCULO_PRODUTIVIDADE · **Subdomínio:** pip · **Cobertura:** COBERTO · **Confiança:** ALTA
- **Condição:** Túnel com pontos totais > 0 e policiais com matrícula cadastrada.
- **Esperado:** Pontos Ficção lidos = Total Pontos / 4. Diferença > 0.01 ou valor zerado emite ALERTA RATEIO_PONTOS_INCOERENTE.
- **Diagnóstico(s):** `RATEIO_PONTOS_INCOERENTE`
- **Consumidor(es) real(is):** `Core/RegrasQualidade.js`, `Features/GuardiaoQualidade.js`
- **Motivo (não-auditável):** Codigo de diagnostico emitido pelo Guardiao com metadados ARCA via porta.

### `ARCA-PIP-003` — Catálogo Oficial de Indicadores PIP (Tabela PIP Dinâmica)
- **Categoria:** CATALOGO · **Subdomínio:** pip · **Cobertura:** COBERTO · **Confiança:** ALTA
- **Condição:** Indicador preenchido na coluna AG confrontado com catálogo.
- **Esperado:** Se não mapeado, emite OBSERVACAO INDICADOR_DESCONHECIDO; se aba ausente, emite MODO_LIMITADO_CATALOGO_PIP.
- **Diagnóstico(s):** `INDICADOR_DESCONHECIDO`, `MODO_LIMITADO_CATALOGO_PIP`
- **Consumidor(es) real(is):** `Core/RegrasQualidade.js`, `Features/GuardiaoQualidade.js`
- **Motivo (não-auditável):** Codigo de diagnostico emitido pelo Guardiao com metadados ARCA via porta.

### `ARCA-TECNICA-001` — Detecção de Erros Sintáticos e de Referência em Fórmulas
- **Categoria:** INTEGRIDADE_PLANILHA · **Subdomínio:** formulas · **Cobertura:** COBERTO · **Confiança:** ALTA
- **Condição:** Fórmula ou valor contendo erros de planilha.
- **Esperado:** Diagnóstico CRÍTICO FORMULA_CORROMPIDA_ERRO_SINTAXE com recomendação de restauração da linha 2.
- **Diagnóstico(s):** `FORMULA_AUSENTE`, `FORMULA_CORROMPIDA_ERRO_SINTAXE`
- **Consumidor(es) real(is):** `Core/RegrasQualidade.js`, `Features/GuardiaoQualidade.js`
- **Motivo (não-auditável):** Codigo de diagnostico emitido pelo Guardiao com metadados ARCA via porta.

### `ARCA-TECNICA-002` — Reconhecimento de Exceção Manual Justificada por Nota
- **Categoria:** GOVERNANCA_HUMANA · **Subdomínio:** formulas · **Cobertura:** COBERTO · **Confiança:** ALTA
- **Condição:** Coluna calculada sem fórmula com nota iniciada por EXCECAO:.
- **Esperado:** Classificação como EXCECAO MANUAL (EXCECAO_MANUAL_JUSTIFICADA) sem erro.
- **Diagnóstico(s):** `EXCECAO_MANUAL_JUSTIFICADA`
- **Consumidor(es) real(is):** `Core/RegrasQualidade.js`, `Features/GuardiaoQualidade.js`
- **Motivo (não-auditável):** Codigo de diagnostico emitido pelo Guardiao com metadados ARCA via porta.

### `ARCA-TECNICA-005` — Porta Canonica de Consulta da ARCA
- **Categoria:** INTERFACE_CATALOGO · **Subdomínio:** auditoria · **Cobertura:** COBERTO · **Confiança:** ALTA
- **Condição:** Qualquer consumidor (Guardiao, NormalizadorEfetivo, cobertura) consultando a ARCA.
- **Esperado:** Metadados de regra (rule_id, tipo, fonte, excecoes) ou status explicito de ausencia.
- **Diagnóstico(s):** —
- **Consumidor(es) real(is):** `Dominio/ARCA/AdaptadorConsultaArca.js`
- **Motivo (não-auditável):** Regra tecnica da porta de consulta do proprio catalogo (nao gera diagnostico).

## INTEGRADO — aplicadas por outros componentes (7)

Aplicadas pelo NormalizadorEfetivo ou pelos plugins de métricas, via porta ARCA (#127).

### `ARCA-ANTIGUIDADE-001` — Precedência Hierárquica Militar por Menor Número N
- **Categoria:** HIERARQUIA · **Subdomínio:** antiguidade · **Cobertura:** COBERTO · **Confiança:** ALTA
- **Condição:** Dois ou mais militares na mesma guarnição.
- **Esperado:** Identificação do militar com menor valor numérico N como líder hierárquico.
- **Diagnóstico(s):** —
- **Consumidor(es) real(is):** `Features/NormalizadorEfetivo.js`, `Motor/PoliticaMeritoArmas.js`
- **Motivo (não-auditável):** Precedencia por menor N aplicada em Motor/PoliticaMeritoArmas.js e NormalizadorEfetivo (#127); no Guardiao aparece via merito de armas.

### `ARCA-DROGAS-002` — Consolidação Cumulativa de Apreensão de Drogas por Militar
- **Categoria:** AGREGACAO_METRICA · **Subdomínio:** drogas · **Cobertura:** COBERTO · **Confiança:** ALTA
- **Condição:** Linhas do policial com apreensão de entorpecentes.
- **Esperado:** Incremento das métricas individuais e contagem de ocorrências com droga.
- **Diagnóstico(s):** —
- **Consumidor(es) real(is):** `Plugins/Metricas/PluginEntorpecentes.js`
- **Motivo (não-auditável):** Aplicada em Plugins/Metricas/PluginEntorpecentes.js; consolidacao cumulativa de drogas fora do caminho de auditoria do Guardiao.

### `ARCA-EFETIVO-001` — Padronização Canônica de Graduações Policiais Militares
- **Categoria:** PADRONIZACAO · **Subdomínio:** efetivo · **Cobertura:** COBERTO · **Confiança:** ALTA
- **Condição:** Entrada de postos/graduações com grafia por extenso, abreviações com ponto ou variações.
- **Esperado:** Mapeamento determinístico para a sigla oficial PMPE.
- **Diagnóstico(s):** —
- **Consumidor(es) real(is):** `Core/Utils.js`, `Features/NormalizadorEfetivo.js`
- **Motivo (não-auditável):** Aplicada pelo NormalizadorEfetivo (Features/NormalizadorEfetivo.js) via porta ARCA (#127); transformacao de dados, nao auditoria de planilha.

### `ARCA-EFETIVO-002` — Desambiguação Automática de Nomes de Guerra por Antiguidade N
- **Categoria:** DESAMBIGUACAO · **Subdomínio:** efetivo · **Cobertura:** COBERTO · **Confiança:** ALTA
- **Condição:** Dois ou mais registros com mesma graduação e mesmo nome de guerra.
- **Esperado:** Ordenação crescente por antiguidade N e prefixação ordenada.
- **Diagnóstico(s):** —
- **Consumidor(es) real(is):** `Features/NormalizadorEfetivo.js`
- **Motivo (não-auditável):** Aplicada pelo NormalizadorEfetivo (desambiguacao de nomes de guerra por menor N) via porta ARCA (#127).

### `ARCA-IMPUTACAO-002` — Contabilização de Procedimentos Legais (APFD, TCO, BOC, AAFAI)
- **Categoria:** AGREGACAO_METRICA · **Subdomínio:** imputacao · **Cobertura:** COBERTO · **Confiança:** ALTA
- **Condição:** Valores numéricos preenchidos nas colunas de procedimentos da linha do militar.
- **Esperado:** Incremento nos contadores de detidos, apfd, tco e boc do policial.
- **Diagnóstico(s):** —
- **Consumidor(es) real(is):** `Plugins/Metricas/PluginPrisoes.js`
- **Motivo (não-auditável):** Aplicada em Plugins/Metricas/PluginPrisoes.js; contabilizacao de procedimentos legais fora do caminho de auditoria do Guardiao.

### `ARCA-MATRICULA-001` — Higienização e Validação da Matrícula Funcional
- **Categoria:** IDENTIFICADOR_UNICO · **Subdomínio:** matricula · **Cobertura:** COBERTO · **Confiança:** ALTA
- **Condição:** String de matrícula com formatações diversas.
- **Esperado:** String contendo unicamente dígitos numéricos. Se vazia, rejeita a instância.
- **Diagnóstico(s):** —
- **Consumidor(es) real(is):** `Core/RegrasQualidade.js`, `Core/Utils.js`, `Dominio/Policial.js`, `Features/NormalizadorEfetivo.js`
- **Motivo (não-auditável):** Higienizacao de formato aplicada pelo NormalizadorEfetivo; o Guardiao audita apenas a ausencia (ARCA-MATRICULA-002).

### `ARCA-PIP-002` — Acúmulo Máximo de Pontos por Atuação no Mês
- **Categoria:** AGREGACAO_METRICA · **Subdomínio:** pip · **Cobertura:** COBERTO · **Confiança:** ALTA
- **Condição:** Consolidação de pontos por matrícula e chave de atuação.
- **Esperado:** mapaPontos.set(chavePonto, Math.max(atual, pontosLidos)).
- **Diagnóstico(s):** —
- **Consumidor(es) real(is):** `Plugins/Metricas/PluginPontuacao.js`
- **Motivo (não-auditável):** Aplicada em Plugins/Metricas/PluginPontuacao.js; o Guardiao audita os insumos (rateio) via ARCA-PIP-001, nao o acumulo final.

## NAO_APLICAVEL — regras estruturais (9)

Não são regras de auditoria de planilha: agregação, layout físico, entrada de dados.

### `ARCA-CONVERSAO-001` — Conversao de formas de apreensao de drogas em quantidade total (gramas)
- **Categoria:** DEFINICAO_METRICA · **Subdomínio:** drogas · **Cobertura:** COBERTO · **Confiança:** ALTA
- **Condição:** Registro de apreensao de droga em forma unitaria (pedra, papelote/big, pino/ziplock) ou ja em gramas.
- **Esperado:** Consolidacao em total de gramas conforme as medidas canonicas. Formulas da aba mensal: TOTAL DE MACONHA = MACONHA DOLAR*3 + MACONHA GRAMA; Total CRACK (gr) = CR
- **Diagnóstico(s):** —
- **Consumidor(es) real(is):** `Core/Constantes.js`
- **Motivo (não-auditável):** Conversao de drogas em gramas aplicada nas formulas da aba mensal; nao e auditoria do Guardiao.

### `ARCA-GXT-001` — Diagnostico Deterministico de Tuneis do GXT
- **Categoria:** DIAGNOSTICO_RELATORIO · **Subdomínio:** gxt · **Cobertura:** COBERTO · **Confiança:** ALTA
- **Condição:** Execucao do diagnostico determinista sobre um mes.
- **Esperado:** Matriz de diagnostico por tunel com fatos e ocorrencias normalizadas rastreaveis.
- **Diagnóstico(s):** —
- **Consumidor(es) real(is):** `Leitura/Adaptador2026.js`, `Motor/DiagnosticoDeterministicoGxt.js`
- **Motivo (não-auditável):** Diagnostico deterministico do relatorio GXT (saida); nao e regra de auditoria de planilha.

### `ARCA-IMPUTACAO-003` — Instrumento Mais Gravoso no Preenchimento (APFD / AAFAI para Menor)
- **Categoria:** DISCRICIONARIEDADE_HUMANA · **Subdomínio:** imputacao · **Cobertura:** COBERTO · **Confiança:** ALTA
- **Condição:** Preenchimento do campo DETIDOS (coluna K) na entrada de uma ocorrencia.
- **Esperado:** Menor envolvido -> AAFAI; somente adultos -> APFD; ausente no BO -> em branco (manual).
- **Diagnóstico(s):** —
- **Consumidor(es) real(is):** `Entrada/EntradaManual.js`
- **Motivo (não-auditável):** Criterio discricionario de preenchimento (instrumento mais gravoso); sem fonte canonica no BO para auditar automaticamente.

### `ARCA-METRICAS-001` — Consolidacao Analitica por Orquestracao de Plugins
- **Categoria:** CONSOLIDACAO_METRICAS · **Subdomínio:** metricas · **Cobertura:** COBERTO · **Confiança:** ALTA
- **Condição:** Fatos canonicos disponiveis e plugins registrados.
- **Esperado:** Registro analitico consolidado (pontos PIP/CPM, ocorrencias, fatos) por policial.
- **Diagnóstico(s):** —
- **Consumidor(es) real(is):** `Motor/MotorAnaliticoV2.js`, `Plugins/Metricas/PluginOcorrencias.js`, `Plugins/Metricas/PluginPontuacao.js`
- **Motivo (não-auditável):** Consolidacao analitica por orquestracao de plugins; o Guardiao audita insumos e rateios, nao o calculo final.

### `ARCA-OCORRENCIA-001` — Conceito e Unicidade do Túnel Operacional
- **Categoria:** AGREGACAO · **Subdomínio:** ocorrencia · **Cobertura:** COBERTO · **Confiança:** ALTA
- **Condição:** Linhas operacionais que possuem data, número MIKE e BOE idênticos.
- **Esperado:** Geração de chave única UPPERCASE no formato DATA|MIKE|BOE para agregação de apreensões e equipe.
- **Diagnóstico(s):** —
- **Consumidor(es) real(is):** `Core/RegrasQualidade.js`, `Features/GuardiaoQualidade.js`, `Motor/PoliticaMeritoArmas.js`
- **Motivo (não-auditável):** Conceito estrutural de agregacao (chave DATA|MIKE|BOE); nao e regra de auditoria. Integridade coberta por ARCA-MIKE-004, ARCA-BOE-001 e ARCA-MIKE-002.

### `ARCA-OCORRENCIA-005` — Validacao de Construcao da Ocorrencia (Aggregate Root)
- **Categoria:** CRIACAO_AGREGADO · **Subdomínio:** ocorrencia · **Cobertura:** COBERTO · **Confiança:** ALTA
- **Condição:** Chamada de criacao de ocorrencia com dados nulos ou chave incompleta.
- **Esperado:** Excecao de validacao de dominio (ErroValidacaoDominio) em vez de objeto invalido.
- **Diagnóstico(s):** —
- **Consumidor(es) real(is):** `Dominio/OcorrenciaFactory.js`, `Dominio/ValueObjects/ChaveOcorrencia.js`
- **Motivo (não-auditável):** Validacao de construcao do agregado (fabrica); garantia de integridade interna do modelo, nao gera diagnostico de planilha.

### `ARCA-OCORRENCIA-006` — Contiguidade Física do Bloco do Túnel
- **Categoria:** INTEGRIDADE_ESTRUTURAL · **Subdomínio:** ocorrencia · **Cobertura:** COBERTO · **Confiança:** ALTA
- **Condição:** Mesma chave DATA|MIKE|BOE presente em blocos não-adjacentes (separados por linha em branco ou por outro túnel).
- **Esperado:** Bloco contíguo por túnel; fragmentação física detectável quando a chave reaparece em bloco separado.
- **Diagnóstico(s):** —
- **Consumidor(es) real(is):** `Core/SaudeTuneis.js`
- **Motivo (não-auditável):** Especificacao estrutural de layout fisico; a fragmentacao detectavel e coberta por ARCA-MIKE-004 (TUNEL_FRAGMENTADO). Consumida pelo corretor de tuneis.

### `ARCA-TERRITORIO-001` — Determinação Territorial Canônica de AIS por Município e Bairro
- **Categoria:** TERRITORIALIDADE · **Subdomínio:** territorio · **Cobertura:** (vazio) · **Confiança:** ALTA
- **Condição:** Preenchimento ou extração de Município e/ou Bairro no formulário ou ocorrência.
- **Esperado:** Atribuição automática e segura da AIS correspondente ou sinalização de pendência de conferência quando inconclusivo.
- **Diagnóstico(s):** —
- **Consumidor(es) real(is):** `Dominio/ResolverAIS.js`, `Dominio/TabelaTerritorialAIS.js`, `Entrada/EntradaManual.js`, `Entrada/Formulario.html`
- **Motivo (não-auditável):** Determinacao de AIS e entrada de dados (nao auditoria); o Guardiao nao audita dado de entrada.

### `ARCA-VEICULO-001` — Autorizacao Canonica do Titulo PIP de Veiculo (Recuperacao de Veiculo Roubado/Furtado)
- **Categoria:** PIP · **Subdomínio:** veiculo · **Cobertura:** COBERTO · **Confiança:** ALTA
- **Condição:** A natureza normalizada (campo NATUREZA DA OCORRENCIA) contem, na MESMA string: (1) termo de recuperacao [RECUPERACAO | APREENSAO | LOCALIZACAO]; (2) termo de ve
- **Esperado:** Titulo 'Apreensao de veiculo furtado ou roubado' sugerido uma unica vez, sujeito a conferencia humana antes da gravacao.
- **Diagnóstico(s):** —
- **Consumidor(es) real(is):** `Entrada/Formulario.html`, `Entrada/EntradaManual.js`
- **Motivo (não-auditável):** Consumidor e o formulario (cliente, Entrada/Formulario.html), nao a planilha auditada.

## Lacunas apuradas

- `ARCA-TERRITORIO-001` (Determinação Territorial Canônica de AIS por Município e Bairro) — **status_cobertura vazio** no JSON.
