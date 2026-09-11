# ARCA — Catálogo de Fontes e Proveniência de Regras
**Projeto:** OPP Formulário Clasp / Syntheon  
**Data:** 2026-09-04T03:17:16.485Z

---

## 1. Classificação de Autoridade de Fontes
As regras inventariadas na ARCA classificam-se em níveis estritos de autoridade institucional:
1. **Fontes Oficiais Normativas (Oficial):** Leis estaduais, Estatuto dos Policiais Militares de Pernambuco, Portarias de Produtividade PIP e protocolos operacionais PMPE/CIODS.
2. **Fontes Internas Operacionais (Alta):** Práticas consolidadas do Batalhão, contratos de arquitetura da planilha Syntheon, regras de ouro do Relatório Trimestral Gxt.
3. **Fontes Heurísticas Derivadas (Média):** Aproximações de código adotadas pela equipe para resolver inconsistências empíricas da digitação de plantão.
4. **Fontes Desconhecidas (DOMAIN_RULE_SOURCE_UNKNOWN):** Regras codificadas no repositório sem norma ou portaria formal comprovada.

---

## 2. Mapa Geral de Fontes por Regra

| ID da Regra | Título | Tipo de Fonte | Nome da Fonte / Localização | Autoridade | Status da Fonte |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ARCA-OCORRENCIA-001** | Conceito e Unicidade do Túnel Operacional | `CONTRATO_ARQUITETURAL` | Padrão Túnel Syntheon (`Core/RegrasQualidade.js:624-635`) | Alta | `INTERNAL_SOURCE_CONFIRMED` |
| **ARCA-OCORRENCIA-002** | Ocorrência Órfã (Linha sem Identificação do Despacho) | `CONTRATO_ARQUITETURAL` | Regra de Imputação Syntheon (`Features/GuardiaoQualidade.js:174-187`) | Alta | `INTERNAL_SOURCE_CONFIRMED` |
| **ARCA-OCORRENCIA-003** | Imputação Funcional Obrigatória da Ocorrência | `DIRETRIZ_OPERACIONAL` | Imputação de Equipe PMPE (`Core/RegrasQualidade.js:192-204`) | Alta | `INTERNAL_SOURCE_CONFIRMED` |
| **ARCA-OCORRENCIA-004** | Justificativa de Ocorrência sem Fatos Físicos | `DIRETRIZ_OPERACIONAL` | Classificação de Turno Sem Apreensão (`Core/RegrasQualidade.js:205-217`) | Media | `INTERNAL_SOURCE_CONFIRMED` |
| **ARCA-MIKE-001** | Conformidade Temporal do Código MIKE (PMPE/CIODS) | `NORMA_CIODS` | Padrão de Protocolo de Despacho PMPE/CIODS (`COOM/CIODS`) | Oficial | `CANONICAL_SOURCE_CONFIRMED` |
| **ARCA-MIKE-002** | Unicidade de Datas por MIKE | `REGRA_OPERACIONAL` | Invariante de Despacho Único (`Core/RegrasQualidade.js:415-427`) | Alta | `INTERNAL_SOURCE_CONFIRMED` |
| **ARCA-MIKE-003** | Detecção de MIKE Incompleto ou Sinteticamente Suspeito | `DESCONHECIDO` | Sem fonte comprovada (`-`) | Baixa | `DOMAIN_RULE_SOURCE_UNKNOWN` |
| **ARCA-BOE-001** | Unicidade de BOE por MIKE (Consistência PCPE x PMPE) | `DIRETRIZ_INTEGRACAO` | Unicidade do Fato Policial PMPE/PCPE (`Core/RegrasQualidade.js:401-413`) | Alta | `INTERNAL_SOURCE_CONFIRMED` |
| **ARCA-PIP-001** | Divisor Regulamentar Fixo de Rateio PIP (Quotas /4) | `PORTARIA_REGULAMENTAR` | Regulamento de Produtividade PIP / Batalhão (`Core/Constantes.js:10`) | Oficial | `CANONICAL_SOURCE_CONFIRMED` |
| **ARCA-PIP-002** | Acúmulo Máximo de Pontos por Atuação no Mês | `MOTOR_METRICA` | Lógica de Pontuação Consolidada (`Plugins/Metricas/PluginPontuacao.js:32`) | Alta | `INTERNAL_SOURCE_CONFIRMED` |
| **ARCA-PIP-003** | Catálogo Oficial de Indicadores PIP (Tabela PIP Dinâmica) | `TABELA_PLANILHA` | Aba Tabela PIP (`Planilha Mensal / Tabela PIP`) | Oficial | `CANONICAL_SOURCE_CONFIRMED` |
| **ARCA-IMPUTACAO-001** | Preenchimento Obrigatório da Situação de Imputação (AG x AH) | `PADRAO_ESTATISTICA` | Diretriz de Registro Estatístico PMPE (`Core/RegrasQualidade.js:591`) | Alta | `CANONICAL_SOURCE_CONFIRMED` |
| **ARCA-IMPUTACAO-002** | Contabilização de Procedimentos Legais (APFD, TCO, BOC, AAFAI) | `ESQUEMA_DADOS` | Dicionário de Colunas de Procedimento (`Core/Constantes.js:44-48`) | Alta | `INTERNAL_SOURCE_CONFIRMED` |
| **ARCA-EFETIVO-001** | Padronização Canônica de Graduações Policiais Militares | `ESTATUTO_MILITAR` | Estatuto dos Policiais Militares de Pernambuco (`Core/Constantes.js:55-74`) | Oficial | `CANONICAL_SOURCE_CONFIRMED` |
| **ARCA-EFETIVO-002** | Desambiguação Automática de Nomes de Guerra por Antiguidade N | `TRADICAO_OPERACIONAL` | Padrão de Nome de Guerra da Seção de Pessoal PMPE (`Features/NormalizadorEfetivo.js:32`) | Alta | `INTERNAL_SOURCE_CONFIRMED` |
| **ARCA-MATRICULA-001** | Higienização e Validação da Matrícula Funcional | `SISTEMA_RH` | Padrão de Matrícula do Estado de Pernambuco / SIRH (`Dominio/Policial.js:13`) | Oficial | `CANONICAL_SOURCE_CONFIRMED` |
| **ARCA-MATRICULA-002** | Obrigatoriedade de Matrícula para Policial com Nome Declarado | `DIRETRIZ_AUDITORIA` | Consistência de Efetivo Participante (`Features/GuardiaoQualidade.js:274-286`) | Alta | `INTERNAL_SOURCE_CONFIRMED` |
| **ARCA-ANTIGUIDADE-001** | Precedência Hierárquica Militar por Menor Número N | `ESTATUTO_MILITAR` | Estatuto dos Policiais Militares de Pernambuco (Critério de Antiguidade) (`Motor/PoliticaMeritoArmas.js:8`) | Oficial | `CANONICAL_SOURCE_CONFIRMED` |
| **ARCA-MERITO-001** | Atribuição Exclusiva do Mérito de Armas ao Líder mais Antigo (Menor N) | `DIRETRIZ_COMANDO` | Política de Mérito de Equipe por Armas / Gxt (`Motor/PoliticaMeritoArmas.js:1-9`) | Oficial | `CANONICAL_SOURCE_CONFIRMED` |
| **ARCA-MERITO-002** | Bloqueio Crítico por Empate de Antiguidade N na Ocorrência Armada | `CRITERIO_EQUIDADE` | Vedação ao Arbitramento Automático em Empate de Antiguidade (`Core/RegrasQualidade.js:336-351`) | Alta | `INTERNAL_SOURCE_CONFIRMED` |
| **ARCA-MERITO-003** | Isolamento da Fonte Pecúlio Externo (Proibição de Fallback) | `CONTRATO_ARQUITETURAL` | Diretriz de Isolamento de Fontes Sensíveis (`Features/GuardiaoQualidade.js:318`) | Alta | `INTERNAL_SOURCE_CONFIRMED` |
| **ARCA-ARMAS-001** | Fonte Exclusiva de Arma Física (Coluna ARMA x Exclusão de QDT ARMAS) | `REGRA_DE_OURO_GXT` | Regra de Ouro do Relatório Trimestral Gxt (`Features/CompiladorGxt.js:4-8`) | Oficial | `CANONICAL_SOURCE_CONFIRMED` |
| **ARCA-ARMAS-002** | Reconhecimento Textual de Arma Artesanal | `DIRETRIZ_GXT` | Classificação de Armas Artesanais (`Motor/PoliticaMeritoArmas.js:50-52`) | Alta | `INTERNAL_SOURCE_CONFIRMED` |
| **ARCA-ARMAS-003** | Consistência de Indicador PIP de Arma vs Apreensão Física | `AUDITORIA_INTEGRIDADE` | Validação Fato Arma vs Indicador (`Core/RegrasQualidade.js:94-106`) | Alta | `INTERNAL_SOURCE_CONFIRMED` |
| **ARCA-MUNICOES-001** | Consistência de Indicador PIP de Munição vs Quantidade Física | `AUDITORIA_INTEGRIDADE` | Validação Fato Munição vs Indicador (`Core/RegrasQualidade.js:108-120`) | Alta | `INTERNAL_SOURCE_CONFIRMED` |
| **ARCA-DROGAS-001** | Validação Material Obrigatória por Tipo de Entorpecente | `DESCONHECIDO` | Sem fonte comprovada (`-`) | Baixa | `DOMAIN_RULE_SOURCE_UNKNOWN` |
| **ARCA-DROGAS-002** | Consolidação Cumulativa de Apreensão de Drogas por Militar | `METRICA_PRODUTIVIDADE` | Totalizador de Entorpecentes (`Plugins/Metricas/PluginEntorpecentes.js:27`) | Alta | `INTERNAL_SOURCE_CONFIRMED` |
| **ARCA-NUMERARIO-001** | Resguardo da Não Auditabilidade Automática de Numerário | `DIRETRIZ_GOVERNANCA` | Resguardo de Discricionariedade Humana em Numerário (`Core/RegrasQualidade.js:122-136`) | Alta | `INTERNAL_SOURCE_CONFIRMED` |
| **ARCA-TECNICA-001** | Detecção de Erros Sintáticos e de Referência em Fórmulas | `MOTOR_SPREADSHEET` | Padrão Google Sheets / Excel (`Core/RegrasQualidade.js:482`) | Oficial | `CANONICAL_SOURCE_CONFIRMED` |
| **ARCA-TECNICA-002** | Reconhecimento de Exceção Manual Justificada por Nota | `PROTOCOLO_AUDITORIA` | Protocolo de Exceção Manual Syntheon (`Core/RegrasQualidade.js:508-521`) | Alta | `INTERNAL_SOURCE_CONFIRMED` |
| **ARCA-TERRITORIO-001** | Determinação Territorial Canônica de AIS (Pernambuco) | `PORTARIA_ESTADUAL` | Portaria SDS nº 1197/2010 (DOE 15/06/2010), Lei nº 14.320/2011 e Lei nº 14.890/2012 (`Dominio/TabelaTerritorialAIS.js`) | Oficial | `CANONICAL_SOURCE_CONFIRMED` |

---

## 3. Fontes Externas Integradas sob Demanda
- **Planilha do Pecúlio (QO/PECULIO):** ID acessado exclusivamente via `CONFIG_SYNTHEON.obterIdPeculio()`. Fornece a antiguidade N militar, dados de efetivo e desambiguação de homônimos.
- **Aba "Tabela PIP":** Fornecida na própria planilha mensal do Batalhão contendo os indicadores de metas estatísticas.


> **Fontes das regras adicionadas em #126 (G01):**

| ID da Regra | Título | Tipo de Fonte | Nome/Localização | Autoridade | Status da Fonte |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ARCA-MIKE-004** | Fragmentacao de Tunel por Chave Inconsistente | `RISCO_DOCUMENTADO` | ARCA_REGRAS_DOMINIO.md (risco de fragmentacao por formato de data) (Dominio/ARCA/ARCA_REGRAS_DOMINIO.md) | Interna | `INTERNAL_SOURCE_CONFIRMED` |
| **ARCA-EFETIVO-003** | Matricula sem Nome de Policial Vinculado | `CONTRATO_OPERACIONAL` | Implementacao no Guardiao (G01) (Features/GuardiaoQualidade.js (bloco POLICIAL_SEM_NOME)) | Interna | `INTERNAL_SOURCE_CONFIRMED` |
| **ARCA-MATRICULA-003** | Matricula em Multiplas Ocorrencias na Mesma Data | `CONTRATO_OPERACIONAL` | Implementacao no Guardiao (G01) (Core/CoberturaAuditoria.js:detectarMatriculaMultiplaNaMesmaData) | Interna | `INTERNAL_SOURCE_CONFIRMED` |
| **ARCA-AUDITORIA-001** | Classificacao de Saude por Tunel | `CONTRATO_OPERACIONAL` | Implementacao no Guardiao (G01) (Core/SaudeTuneis.js:classificarTunel) | Interna | `INTERNAL_SOURCE_CONFIRMED` |
| **ARCA-AUDITORIA-002** | Cobertura de Auditoria e Declaracao de NAO_AUDITADO | `CONTRATO_OPERACIONAL` | Implementacao no Guardiao (G01) (Core/CoberturaAuditoria.js:montarCobertura) | Interna | `INTERNAL_SOURCE_CONFIRMED` |


> **Fontes das regras adicionadas pela varredura exaustiva (#128):**

| ID da Regra | Título | Tipo de Fonte | Nome/Localização | Autoridade | Status da Fonte |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ARCA-OCORRENCIA-005** | Validacao de Construcao da Ocorrencia (Aggregate Root) | `CONTRATO_ARQUITETURAL` | Codigo de dominio Syntheon (Dominio/OcorrenciaFactory.js:criar) | Interna | `INTERNAL_SOURCE_CONFIRMED` |
| **ARCA-METRICAS-001** | Consolidacao Analitica por Orquestracao de Plugins | `CONTRATO_ARQUITETURAL` | Codigo de dominio Syntheon (Motor/MotorAnaliticoV2.js:processarProdutividadePolicial) | Interna | `INTERNAL_SOURCE_CONFIRMED` |
| **ARCA-GXT-001** | Diagnostico Deterministico de Tuneis do GXT | `CONTRATO_ARQUITETURAL` | Codigo de dominio Syntheon (Motor/DiagnosticoDeterministicoGxt.js:diagnosticarMes) | Interna | `INTERNAL_SOURCE_CONFIRMED` |
| **ARCA-TECNICA-005** | Porta Canonica de Consulta da ARCA | `CONTRATO_ARQUITETURAL` | Codigo de dominio Syntheon (Dominio/ARCA/AdaptadorConsultaArca.js:enriquecerDiagnostico) | Interna | `INTERNAL_SOURCE_CONFIRMED` |

> **Fontes da regra adicionada pela reconciliacao OCR/Veiculo (#137):**

| ID da Regra | Título | Tipo de Fonte | Nome/Localização | Autoridade | Status da Fonte |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ARCA-VEICULO-001** | Autorizacao Canonica do Titulo PIP de Veiculo (Recuperacao de Veiculo Roubado/Furtado) | `DOCUMENTACAO_INTERNA` + `CATALOGO_OFICIAL` | Regra de veiculo do Formulario/OCR documentada em `SUB-C01-01-01_OCR_E_CONFERENCIA/AUDITORIA_OCR_ARCA.md` (card #135) + rotulo oficial da Tabela PIP consumido em `Entrada/Formulario.html:963` | Media / Alta | `INTERNAL_SOURCE_CONFIRMED` |
| **ARCA-CONVERSAO-001** | Conversao de formas de apreensao de drogas em quantidade total (gramas) | `DETERMINACAO_DO_PROPRIETARIO` | Determinacao literal do proprietario do dominio (11/09/2026): 1 pedra de crack = 0,25 g; 1 papelote/big de maconha = 3 g; 1 pino/ziplock de cocaina = 1 g; crack entra no somatorio geral da cocaina nos escaloes superiores (issue #139, cards #142/#144) | Oficial | `CANONICAL_SOURCE_CONFIRMED` |
