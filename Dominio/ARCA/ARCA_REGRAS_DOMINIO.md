# ARCA — Catálogo Canônico de Regras de Domínio
**Projeto:** OPP Formulário Clasp / Syntheon  
**Módulo:** Dominio / ARCA  
**Data de Consolidação:** 2026-09-04T03:17:16.482Z  
**Autoridade:** Repositório Local e Contratos Canônicos

---

## 1. Visão Geral e Propósito
A **ARCA** é o repositório canônico de todas as regras de domínio, políticas operacionais, modelos conceituais e restrições de negócio aplicadas no ecossistema de gestão de ocorrências, efetivo e produtividade da PMPE.  
Ela representa o domínio do **PROJETO COMO UM TODO**, transversal a compiladores, motores, normalizadores, plugins e auditores (como o Guardião da Qualidade).

### Métricas de Consolidação
> **Atualizado em 10/09/2026 pelos cards #125 (consumidores) e #126 (cobertura Guardiao<->ARCA).**
> Os números abaixo refletem o catalogo reconciliado. As métricas originais de geração (04/09/2026)
> varriam 200 de 1946 arquivos — a varredura exaustiva do domínio e o escopo do card #128.
- **Arquivos Descobertos:** 1946
- **Arquivos Escaneados na geração original:** 200 (pendente varredura exaustiva — #128)
- **Total de Regras de Negócio/Operacionais:** 32
- **Total de Regras Técnicas:** 4
- **Distribuição por tipo:** INTERNAL_OPERATIONAL_RULE=20, OFFICIAL_BUSINESS_RULE=9, TECHNICAL_RULE=4, HEURISTIC=2, CANONICAL_NORMATIVE_RULE=1
- **Regras com Fonte Canônica Confirmada:** 11
- **Regras com Fonte Interna Confirmada:** 23
- **Regras com Fonte Desconhecida (Heurísticas):** 2
- **Regras mapeadas no Guardiao:** 25
- **Regras explicitamente NAO auditáveis pelo Guardiao:** 11
- **Códigos de diagnóstico do Guardiao sem regra ARCA:** 0 (reconciliado em #126)

---

## 2. Catálogo Humano das Regras de Domínio

### 2.1 Regras de Negócio e Operacionais

| ID | Título | Subdomínio | Tipo | Fonte Status | Confiança | Consumidores |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **ARCA-OCORRENCIA-001** | Conceito e Unicidade do Túnel Operacional | `ocorrencia` | `INTERNAL_OPERATIONAL_RULE` | `INTERNAL_SOURCE_CONFIRMED` | ALTA | GuardiaoQualidade, CompiladorGxt, MotorAnaliticoV2, PoliticaMeritoArmas |
| **ARCA-OCORRENCIA-002** | Ocorrência Órfã (Linha sem Identificação do Despacho) | `ocorrencia` | `INTERNAL_OPERATIONAL_RULE` | `INTERNAL_SOURCE_CONFIRMED` | ALTA | GuardiaoQualidade |
| **ARCA-OCORRENCIA-003** | Imputação Funcional Obrigatória da Ocorrência | `ocorrencia` | `INTERNAL_OPERATIONAL_RULE` | `INTERNAL_SOURCE_CONFIRMED` | ALTA | GuardiaoQualidade |
| **ARCA-OCORRENCIA-004** | Justificativa de Ocorrência sem Fatos Físicos | `ocorrencia` | `INTERNAL_OPERATIONAL_RULE` | `INTERNAL_SOURCE_CONFIRMED` | ALTA | GuardiaoQualidade |
| **ARCA-MIKE-001** | Conformidade Temporal do Código MIKE (PMPE/CIODS) | `mike` | `OFFICIAL_BUSINESS_RULE` | `CANONICAL_SOURCE_CONFIRMED` | ALTA | GuardiaoQualidade |
| **ARCA-MIKE-002** | Unicidade de Datas por MIKE | `mike` | `INTERNAL_OPERATIONAL_RULE` | `INTERNAL_SOURCE_CONFIRMED` | ALTA | GuardiaoQualidade |
| **ARCA-MIKE-003** | Detecção de MIKE Incompleto ou Sinteticamente Suspeito | `mike` | `HEURISTIC` | `DOMAIN_RULE_SOURCE_UNKNOWN` | MEDIA | GuardiaoQualidade |
| **ARCA-BOE-001** | Unicidade de BOE por MIKE (Consistência PCPE x PMPE) | `boe` | `INTERNAL_OPERATIONAL_RULE` | `INTERNAL_SOURCE_CONFIRMED` | ALTA | GuardiaoQualidade |
| **ARCA-PIP-001** | Divisor Regulamentar Fixo de Rateio PIP (Quotas /4) | `pip` | `OFFICIAL_BUSINESS_RULE` | `CANONICAL_SOURCE_CONFIRMED` | ALTA | GuardiaoQualidade, PluginPontuacao, CompiladorProdutividade |
| **ARCA-PIP-002** | Acúmulo Máximo de Pontos por Atuação no Mês | `pip` | `INTERNAL_OPERATIONAL_RULE` | `INTERNAL_SOURCE_CONFIRMED` | ALTA | PluginPontuacao, CompiladorProdutividade |
| **ARCA-PIP-003** | Catálogo Oficial de Indicadores PIP (Tabela PIP Dinâmica) | `pip` | `OFFICIAL_BUSINESS_RULE` | `CANONICAL_SOURCE_CONFIRMED` | ALTA | GuardiaoQualidade |
| **ARCA-IMPUTACAO-001** | Preenchimento Obrigatório da Situação de Imputação (AG x AH) | `imputacao` | `OFFICIAL_BUSINESS_RULE` | `CANONICAL_SOURCE_CONFIRMED` | ALTA | GuardiaoQualidade |
| **ARCA-IMPUTACAO-002** | Contabilização de Procedimentos Legais (APFD, TCO, BOC, AAFAI) | `imputacao` | `INTERNAL_OPERATIONAL_RULE` | `INTERNAL_SOURCE_CONFIRMED` | ALTA | PluginPrisoes, CompiladorProdutividade |
| **ARCA-EFETIVO-001** | Padronização Canônica de Graduações Policiais Militares | `efetivo` | `OFFICIAL_BUSINESS_RULE` | `CANONICAL_SOURCE_CONFIRMED` | ALTA | NormalizadorEfetivo, CompiladorProdutividade, RendererCA |
| **ARCA-EFETIVO-002** | Desambiguação Automática de Nomes de Guerra por Antiguidade N | `efetivo` | `INTERNAL_OPERATIONAL_RULE` | `INTERNAL_SOURCE_CONFIRMED` | ALTA | NormalizadorEfetivo |
| **ARCA-MATRICULA-001** | Higienização e Validação da Matrícula Funcional | `matricula` | `OFFICIAL_BUSINESS_RULE` | `CANONICAL_SOURCE_CONFIRMED` | ALTA | Policial, NormalizadorEfetivo, CompiladorProdutividade, GuardiaoQualidade |
| **ARCA-MATRICULA-002** | Obrigatoriedade de Matrícula para Policial com Nome Declarado | `matricula` | `INTERNAL_OPERATIONAL_RULE` | `INTERNAL_SOURCE_CONFIRMED` | ALTA | GuardiaoQualidade |
| **ARCA-ANTIGUIDADE-001** | Precedência Hierárquica Militar por Menor Número N | `antiguidade` | `OFFICIAL_BUSINESS_RULE` | `CANONICAL_SOURCE_CONFIRMED` | ALTA | PoliticaMeritoArmas, CompiladorGxt, NormalizadorEfetivo |
| **ARCA-MERITO-001** | Atribuição Exclusiva do Mérito de Armas ao Líder mais Antigo (Menor N) | `merito_armas` | `OFFICIAL_BUSINESS_RULE` | `CANONICAL_SOURCE_CONFIRMED` | ALTA | PoliticaMeritoArmas, CompiladorGxt, GuardiaoQualidade |
| **ARCA-MERITO-002** | Bloqueio Crítico por Empate de Antiguidade N na Ocorrência Armada | `merito_armas` | `INTERNAL_OPERATIONAL_RULE` | `INTERNAL_SOURCE_CONFIRMED` | ALTA | GuardiaoQualidade, PoliticaMeritoArmas |
| **ARCA-MERITO-003** | Isolamento da Fonte Pecúlio Externo (Proibição de Fallback) | `merito_armas` | `INTERNAL_OPERATIONAL_RULE` | `INTERNAL_SOURCE_CONFIRMED` | ALTA | GuardiaoQualidade, CompiladorGxt |
| **ARCA-ARMAS-001** | Fonte Exclusiva de Arma Física (Coluna ARMA x Exclusão de QDT ARMAS) | `armas` | `OFFICIAL_BUSINESS_RULE` | `CANONICAL_SOURCE_CONFIRMED` | ALTA | CompiladorGxt, PoliticaMeritoArmas, PluginArmas |
| **ARCA-ARMAS-002** | Reconhecimento Textual de Arma Artesanal | `armas` | `INTERNAL_OPERATIONAL_RULE` | `INTERNAL_SOURCE_CONFIRMED` | ALTA | PoliticaMeritoArmas, CompiladorGxt |
| **ARCA-ARMAS-003** | Consistência de Indicador PIP de Arma vs Apreensão Física | `armas` | `INTERNAL_OPERATIONAL_RULE` | `INTERNAL_SOURCE_CONFIRMED` | ALTA | GuardiaoQualidade |
| **ARCA-MUNICOES-001** | Consistência de Indicador PIP de Munição vs Quantidade Física | `municoes` | `INTERNAL_OPERATIONAL_RULE` | `INTERNAL_SOURCE_CONFIRMED` | ALTA | GuardiaoQualidade |
| **ARCA-DROGAS-001** | Validação Material Obrigatória por Tipo de Entorpecente | `drogas` | `HEURISTIC` | `DOMAIN_RULE_SOURCE_UNKNOWN` | MEDIA | GuardiaoQualidade |
| **ARCA-DROGAS-002** | Consolidação Cumulativa de Apreensão de Drogas por Militar | `drogas` | `INTERNAL_OPERATIONAL_RULE` | `INTERNAL_SOURCE_CONFIRMED` | ALTA | PluginEntorpecentes, CompiladorProdutividade |
| **ARCA-NUMERARIO-001** | Resguardo da Não Auditabilidade Automática de Numerário | `numerario` | `INTERNAL_OPERATIONAL_RULE` | `INTERNAL_SOURCE_CONFIRMED` | ALTA | GuardiaoQualidade |

### 2.2 Regras Técnicas e de Formato de Planilha

| ID | Título | Subdomínio | Tipo | Fonte Status | Confiança | Consumidores |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **ARCA-TECNICA-001** | Detecção de Erros Sintáticos e de Referência em Fórmulas | `formulas` | `TECHNICAL_RULE` | `CANONICAL_SOURCE_CONFIRMED` | ALTA | GuardiaoQualidade |
| **ARCA-TECNICA-002** | Reconhecimento de Exceção Manual Justificada por Nota | `formulas` | `TECHNICAL_RULE` | `INTERNAL_SOURCE_CONFIRMED` | ALTA | GuardiaoQualidade |

---


> **Nota (#125 ARCA-FIX-002):** a coluna `Consumidores` das tabelas acima e a **visao DECLARADA historica** (preservada). A visao reconciliada por regra (REAL_CODE_CONSUMER / INDIRECT_CONSUMER / DECLARED_CONSUMER / PLANNED_CONSUMER) esta registrada em cada regra na secao 3 e no `arca_regras_dominio.json` (campo `consumidores`).

## 3. Especificação Detalhada de Regras por Subdomínio


### [ARCA-OCORRENCIA-001] Conceito e Unicidade do Túnel Operacional
- **Subdomínio:** `ocorrencia` | **Categoria:** `AGREGACAO`
- **Tipo de Regra:** `INTERNAL_OPERATIONAL_RULE` | **Status de Fonte:** `INTERNAL_SOURCE_CONFIRMED`
- **Descrição Humana:** A ocorrência é agregada deterministicamente pelo túnel composto pela tupla DATA | MIKE | BOE. Múltiplas linhas na planilha que compartilham essa mesma tupla pertencem ao mesmo fato operacional integrado.
- **Condição Lógica:** `Linhas operacionais que possuem data, número MIKE e BOE idênticos.`
- **Resultado Esperado:** Geração de chave única UPPERCASE no formato DATA|MIKE|BOE para agregação de apreensões e equipe.
- **Fontes Declaradas:** Padrão Túnel Syntheon (CONTRATO_ARQUITETURAL em Core/RegrasQualidade.js:624-635)
- **Evidência no Código:** `Core/RegrasQualidade.js:624`, `Features/GuardiaoQualidade.js:164`, `Motor/PoliticaMeritoArmas.js:31`
- **Evidência em Testes:** `Testes/TestGuardiao.js:12-15`, `Testes/TestMeritoEquipeArmas.js`
- **Exceções Admitidas:** Quando BOE não estiver preenchido, o túnel é composto por DATA|MIKE|.
- **Consumidores (reconciliado #125):** REAL: Core/RegrasQualidade.js, Features/GuardiaoQualidade.js, Motor/PoliticaMeritoArmas.js | INDIRETO: - | DECLARADO: GuardiaoQualidade, CompiladorGxt, MotorAnaliticoV2, PoliticaMeritoArmas | PLANEJADO: -
- **Riscos Identificados:** Inconsistência de formato de data (Date vs String) pode fragmentar túneis.
- **Observações Operacionais:** Pilar estrutural para prevenir contagem duplicada de apreensões.

---

### [ARCA-OCORRENCIA-002] Ocorrência Órfã (Linha sem Identificação do Despacho)
- **Subdomínio:** `ocorrencia` | **Categoria:** `VALIDACAO`
- **Tipo de Regra:** `INTERNAL_OPERATIONAL_RULE` | **Status de Fonte:** `INTERNAL_SOURCE_CONFIRMED`
- **Descrição Humana:** Qualquer linha da planilha que contenha policiais, apreensões ou indicadores PIP deve obrigatoriamente possuir o número do MIKE vinculado.
- **Condição Lógica:** `Linha sem MIKE contendo matrícula, policial, indicador, imputado ou apreensões físicas.`
- **Resultado Esperado:** Diagnóstico CRÍTICO OCORRENCIA_ORFA.
- **Fontes Declaradas:** Regra de Imputação Syntheon (CONTRATO_ARQUITETURAL em Features/GuardiaoQualidade.js:174-187)
- **Evidência no Código:** `Features/GuardiaoQualidade.js:174-187`
- **Evidência em Testes:** `Testes/TestGuardiao.js:linha 33 (ocorrência órfã)`
- **Exceções Admitidas:** Linhas de plantão tranquilo onde apenas a DATA está preenchida.
- **Consumidores (reconciliado #125):** REAL: Core/RegrasQualidade.js, Features/GuardiaoQualidade.js | INDIRETO: Core/CoberturaAuditoria.js, Render/PainelSaude.js, Render/RendererAuditoriaSaude.js | DECLARADO: GuardiaoQualidade | PLANEJADO: -
- **Riscos Identificados:** Perda de rastreabilidade do fato operacional junto ao CIODS.
- **Observações Operacionais:** Garante que nenhuma apreensão fique sem vínculo com despacho oficial.

---

### [ARCA-OCORRENCIA-003] Imputação Funcional Obrigatória da Ocorrência
- **Subdomínio:** `ocorrencia` | **Categoria:** `VALIDACAO`
- **Tipo de Regra:** `INTERNAL_OPERATIONAL_RULE` | **Status de Fonte:** `INTERNAL_SOURCE_CONFIRMED`
- **Descrição Humana:** Uma ocorrência com apreensões físicas ou indicadores PIP não pode existir sem guarnição (policiais com matrícula válida).
- **Condição Lógica:** `Túnel com fatos > 0 ou eventos > 0 e nenhuma matrícula vinculada.`
- **Resultado Esperado:** Diagnóstico CRÍTICO TUNEL_SEM_EQUIPE e status INVALIDO_SEM_EQUIPE.
- **Fontes Declaradas:** Imputação de Equipe PMPE (DIRETRIZ_OPERACIONAL em Core/RegrasQualidade.js:192-204)
- **Evidência no Código:** `Core/RegrasQualidade.js:192-204`
- **Evidência em Testes:** `Testes/TestGuardiao.js (Homologação E2E cenário sem equipe)`
- **Exceções Admitidas:** Nenhuma exceção aplicável.
- **Consumidores (reconciliado #125):** REAL: Core/RegrasQualidade.js, Features/GuardiaoQualidade.js | INDIRETO: Core/CoberturaAuditoria.js, Render/PainelSaude.js, Render/RendererAuditoriaSaude.js | DECLARADO: GuardiaoQualidade | PLANEJADO: -
- **Riscos Identificados:** Apreensões ficarem sem destinatário de produtividade.
- **Observações Operacionais:** Exige pelo menos um policial com matrícula cadastrada.

---

### [ARCA-OCORRENCIA-004] Justificativa de Ocorrência sem Fatos Físicos
- **Subdomínio:** `ocorrencia` | **Categoria:** `VALIDACAO`
- **Tipo de Regra:** `INTERNAL_OPERATIONAL_RULE` | **Status de Fonte:** `INTERNAL_SOURCE_CONFIRMED`
- **Descrição Humana:** Linhas operacionais com policiais alocados mas sem apreensão material ou indicador PIP devem ser sinalizadas para confirmação de policiamento preventivo.
- **Condição Lógica:** `Túnel com policiais e zero fatos físicos e zero eventos PIP.`
- **Resultado Esperado:** Diagnóstico ALERTA TUNEL_SEM_FATOS com status INVALIDO_SEM_FATOS.
- **Fontes Declaradas:** Classificação de Turno Sem Apreensão (DIRETRIZ_OPERACIONAL em Core/RegrasQualidade.js:205-217)
- **Evidência no Código:** `Core/RegrasQualidade.js:205-217`
- **Evidência em Testes:** `Testes/TestGuardiao.js (Homologação E2E)`
- **Exceções Admitidas:** Plantões tranquilos devidamente justificados.
- **Consumidores (reconciliado #125):** REAL: Core/RegrasQualidade.js, Features/GuardiaoQualidade.js | INDIRETO: Core/CoberturaAuditoria.js, Render/PainelSaude.js, Render/RendererAuditoriaSaude.js | DECLARADO: GuardiaoQualidade | PLANEJADO: -
- **Riscos Identificados:** Falso alarme em ocorrências de apoio ou patrulhamento sem flagrante.
- **Observações Operacionais:** Permite ao operador confirmar a natureza preventiva do serviço.

---

### [ARCA-MIKE-001] Conformidade Temporal do Código MIKE (PMPE/CIODS)
- **Subdomínio:** `mike` | **Categoria:** `INTEGRIDADE_TEMPORAL`
- **Tipo de Regra:** `OFFICIAL_BUSINESS_RULE` | **Status de Fonte:** `CANONICAL_SOURCE_CONFIRMED`
- **Descrição Humana:** O código MIKE é o protocolo gerado pelo despacho CIODS e codifica a data nos 8 primeiros dígitos numéricos (YYYYMMDD). A data da planilha deve ser compatível com essa data embutida.
- **Condição Lógica:** `MIKE numérico >= 8 dígitos na faixa de anos 2020 a 2030 onde ano, mês ou dia divergem da coluna DATA.`
- **Resultado Esperado:** Diagnóstico ALERTA MIKE_DATA_DIVERGENTE.
- **Fontes Declaradas:** Padrão de Protocolo de Despacho PMPE/CIODS (NORMA_CIODS em COOM/CIODS)
- **Evidência no Código:** `Core/RegrasQualidade.js:356-396`
- **Evidência em Testes:** `Testes/TestGuardiao.js (validarDataMike / divergência temporal)`
- **Exceções Admitidas:** MIKEs históricos fora da faixa 2020-2030 são ignorados.
- **Consumidores (reconciliado #125):** REAL: Core/RegrasQualidade.js, Features/GuardiaoQualidade.js | INDIRETO: Core/CoberturaAuditoria.js, Render/PainelSaude.js, Render/RendererAuditoriaSaude.js | DECLARADO: GuardiaoQualidade | PLANEJADO: -
- **Riscos Identificados:** Janela hardcoded 2020-2030 expirará em 2031.
- **Observações Operacionais:** Detecta erro material de digitação ou reutilização de MIKE.

---

### [ARCA-MIKE-002] Unicidade de Datas por MIKE
- **Subdomínio:** `mike` | **Categoria:** `VALIDACAO_CRUZADA`
- **Tipo de Regra:** `INTERNAL_OPERATIONAL_RULE` | **Status de Fonte:** `INTERNAL_SOURCE_CONFIRMED`
- **Descrição Humana:** O mesmo código MIKE não pode ser empregado para fatos ocorridos em datas calendárias distintas dentro do mesmo período.
- **Condição Lógica:** `Mapeamento cruzado encontrar mais de uma data distinta associada ao mesmo número MIKE.`
- **Resultado Esperado:** Diagnóstico ALERTA MIKE_DATAS_DIVERGENTES em todas as linhas envolvidas.
- **Fontes Declaradas:** Invariante de Despacho Único (REGRA_OPERACIONAL em Core/RegrasQualidade.js:415-427)
- **Evidência no Código:** `Core/RegrasQualidade.js:415-427`
- **Evidência em Testes:** `Testes/TestGuardiao.js (mesmo MIKE com datas diferentes)`
- **Exceções Admitidas:** Nenhuma exceção aplicável.
- **Consumidores (reconciliado #125):** REAL: Core/RegrasQualidade.js, Features/GuardiaoQualidade.js | INDIRETO: Core/CoberturaAuditoria.js, Render/PainelSaude.js, Render/RendererAuditoriaSaude.js | DECLARADO: GuardiaoQualidade | PLANEJADO: -
- **Riscos Identificados:** Ocorrências que ultrapassam a meia-noite podem acionar falso alarme se não unificadas.
- **Observações Operacionais:** Previne reaproveitamento indevido de protocolo.

---

### [ARCA-MIKE-003] Detecção de MIKE Incompleto ou Sinteticamente Suspeito
- **Subdomínio:** `mike` | **Categoria:** `SINTAXE`
- **Tipo de Regra:** `HEURISTIC` | **Status de Fonte:** `DOMAIN_RULE_SOURCE_UNKNOWN`
- **Descrição Humana:** Códigos de ocorrência MIKE com dígitos insuficientes (< 8 dígitos) ou preenchidos com o ano corrente isolado (ex: "2026") são rejeitados como suspeitos.
- **Condição Lógica:** `MIKE sanitizado possuir apenas 2026 ou entre 1 e 7 dígitos.`
- **Resultado Esperado:** Diagnóstico ALERTA MIKE_SUSPEITO sem interrupção da varredura.
- **Fontes Declaradas:** _Nenhuma fonte formal comprovada (Heurística / DOMAIN_RULE_SOURCE_UNKNOWN)_
- **Evidência no Código:** `Core/RegrasQualidade.js:637-640`, `Features/GuardiaoQualidade.js:199-211`
- **Evidência em Testes:** `Testes/TestGuardiao.js (MIKE suspeito)`
- **Exceções Admitidas:** Nenhuma exceção aplicável.
- **Consumidores (reconciliado #125):** REAL: Core/RegrasQualidade.js, Features/GuardiaoQualidade.js | INDIRETO: Core/CoberturaAuditoria.js, Render/PainelSaude.js, Render/RendererAuditoriaSaude.js | DECLARADO: GuardiaoQualidade | PLANEJADO: -
- **Riscos Identificados:** MIKEs curtos de anos anteriores a 2020 podem gerar falso alarme.
- **Observações Operacionais:** Heurística adotada para capturar digitação incompleta durante o plantão.

---

### [ARCA-BOE-001] Unicidade de BOE por MIKE (Consistência PCPE x PMPE)
- **Subdomínio:** `boe` | **Categoria:** `VALIDACAO_CRUZADA`
- **Tipo de Regra:** `INTERNAL_OPERATIONAL_RULE` | **Status de Fonte:** `INTERNAL_SOURCE_CONFIRMED`
- **Descrição Humana:** Um mesmo despacho operacional MIKE da PMPE não pode estar vinculado a múltiplos Boletins de Ocorrência Policial (BOE) diferentes da Polícia Civil.
- **Condição Lógica:** `Mapeamento cruzado detectar mais de um BOE associado ao mesmo MIKE.`
- **Resultado Esperado:** Diagnóstico ALERTA MIKE_BOE_DIVERGENTE.
- **Fontes Declaradas:** Unicidade do Fato Policial PMPE/PCPE (DIRETRIZ_INTEGRACAO em Core/RegrasQualidade.js:401-413)
- **Evidência no Código:** `Core/RegrasQualidade.js:401-413`
- **Evidência em Testes:** `Testes/TestGuardiao.js (mesmo MIKE com BOEs diferentes)`
- **Exceções Admitidas:** Desmembramento formal de inquérito na delegacia (justificado em relatório).
- **Consumidores (reconciliado #125):** REAL: Core/RegrasQualidade.js, Features/GuardiaoQualidade.js | INDIRETO: Core/CoberturaAuditoria.js, Render/PainelSaude.js, Render/RendererAuditoriaSaude.js | DECLARADO: GuardiaoQualidade | PLANEJADO: -
- **Riscos Identificados:** Casos legítimos de desdobramento em flagrantes múltiplos.
- **Observações Operacionais:** Preserva a integridade relacional entre o despacho militar e o inquérito civil.

---

### [ARCA-PIP-001] Divisor Regulamentar Fixo de Rateio PIP (Quotas /4)
- **Subdomínio:** `pip` | **Categoria:** `CALCULO_PRODUTIVIDADE`
- **Tipo de Regra:** `OFFICIAL_BUSINESS_RULE` | **Status de Fonte:** `CANONICAL_SOURCE_CONFIRMED`
- **Descrição Humana:** O cálculo regulamentar de PONTOS FICÇÃO individuais para cada policial militar participante do túnel é obtido dividindo a soma de pontos brutos do túnel pelo DIVISOR FIXO 4, independentemente do número de policiais na guarnição (seja 1, 4, 5 ou 10 policiais).
- **Condição Lógica:** `Túnel com pontos totais > 0 e policiais com matrícula cadastrada.`
- **Resultado Esperado:** Pontos Ficção lidos = Total Pontos / 4. Diferença > 0.01 ou valor zerado emite ALERTA RATEIO_PONTOS_INCOERENTE.
- **Fontes Declaradas:** Regulamento de Produtividade PIP / Batalhão (PORTARIA_REGULAMENTAR em Core/Constantes.js:10)
- **Evidência no Código:** `Core/Constantes.js:10`, `Core/RegrasQualidade.js:139-185`
- **Evidência em Testes:** `Testes/TestGuardiao.js:12-15 (rateio com 4, 5 e 10 policiais)`
- **Exceções Admitidas:** Ajuste manual com nota iniciada por EXCECAO: na célula.
- **Consumidores (reconciliado #125):** REAL: Core/RegrasQualidade.js, Features/GuardiaoQualidade.js | INDIRETO: Core/CoberturaAuditoria.js, Render/PainelSaude.js, Render/RendererAuditoriaSaude.js | DECLARADO: GuardiaoQualidade, PluginPontuacao, CompiladorProdutividade | PLANEJADO: -
- **Riscos Identificados:** Operadores desacostumados tentarem ratear dividindo pelo número real de militares.
- **Observações Operacionais:** Regra de ouro da portaria de pontuação do PIP.

---

### [ARCA-PIP-002] Acúmulo Máximo de Pontos por Atuação no Mês
- **Subdomínio:** `pip` | **Categoria:** `AGREGACAO_METRICA`
- **Tipo de Regra:** `INTERNAL_OPERATIONAL_RULE` | **Status de Fonte:** `INTERNAL_SOURCE_CONFIRMED`
- **Descrição Humana:** Ao consolidar a pontuação mensal do policial em múltiplas linhas da mesma atuação/ocorrência, prevalece o valor máximo auferido para evitar inflação cumulativa de frações da mesma ocorrência.
- **Condição Lógica:** `Consolidação de pontos por matrícula e chave de atuação.`
- **Resultado Esperado:** mapaPontos.set(chavePonto, Math.max(atual, pontosLidos)).
- **Fontes Declaradas:** Lógica de Pontuação Consolidada (MOTOR_METRICA em Plugins/Metricas/PluginPontuacao.js:32)
- **Evidência no Código:** `Plugins/Metricas/PluginPontuacao.js:32`
- **Evidência em Testes:** `Testes/TestPlugins.js`, `Testes/TestRelatoriosPipCpm.js`
- **Exceções Admitidas:** Nenhuma exceção aplicável.
- **Consumidores (reconciliado #125):** REAL: Plugins/Metricas/PluginPontuacao.js | INDIRETO: - | DECLARADO: PluginPontuacao, CompiladorProdutividade | PLANEJADO: -
- **Riscos Identificados:** Nenhum identificado; comportamento determinístico.
- **Observações Operacionais:** Garante que o policial receba exatamente sua quota daquela ocorrência.

---

### [ARCA-PIP-003] Catálogo Oficial de Indicadores PIP (Tabela PIP Dinâmica)
- **Subdomínio:** `pip` | **Categoria:** `CATALOGO`
- **Tipo de Regra:** `OFFICIAL_BUSINESS_RULE` | **Status de Fonte:** `CANONICAL_SOURCE_CONFIRMED`
- **Descrição Humana:** A relação de indicadores de ocorrência PIP válidos é fornecida pela aba "Tabela PIP" da planilha do Batalhão. O sistema consome esse catálogo dinamicamente para validar a nomenclatura do evento.
- **Condição Lógica:** `Indicador preenchido na coluna AG confrontado com catálogo.`
- **Resultado Esperado:** Se não mapeado, emite OBSERVACAO INDICADOR_DESCONHECIDO; se aba ausente, emite MODO_LIMITADO_CATALOGO_PIP.
- **Fontes Declaradas:** Aba Tabela PIP (TABELA_PLANILHA em Planilha Mensal / Tabela PIP)
- **Evidência no Código:** `Features/GuardiaoQualidade.js:37-96`, `Core/RegrasQualidade.js:436-451`
- **Evidência em Testes:** `Testes/TestGuardiao.js:16-18`
- **Exceções Admitidas:** Quando a aba Tabela PIP não existir, opera em modo tolerante para não travar auditoria.
- **Consumidores (reconciliado #125):** REAL: Core/RegrasQualidade.js, Features/GuardiaoQualidade.js | INDIRETO: Core/CoberturaAuditoria.js, Render/PainelSaude.js, Render/RendererAuditoriaSaude.js | DECLARADO: GuardiaoQualidade | PLANEJADO: -
- **Riscos Identificados:** Variações ortográficas em novos tipos de ocorrência criados sem atualizar a aba PIP.
- **Observações Operacionais:** Design desacoplado: o catálogo não fica engessado no código.

---

### [ARCA-IMPUTACAO-001] Preenchimento Obrigatório da Situação de Imputação (AG x AH)
- **Subdomínio:** `imputacao` | **Categoria:** `CONSISTENCIA_CAMPOS`
- **Tipo de Regra:** `OFFICIAL_BUSINESS_RULE` | **Status de Fonte:** `CANONICAL_SOURCE_CONFIRMED`
- **Descrição Humana:** Toda linha que declarar um indicador OCORRÊNCIA PIP (coluna AG) deve obrigatoriamente classificar a situação do flagrante como "COM IMPUTADO" ou "SEM IMPUTADO" (coluna AH).
- **Condição Lógica:** `AG preenchido sem AH -> EVENTO_INCOMPLETO_AG; AH preenchido sem AG -> IMPUTADO_SEM_EVENTO_AH; AH diferente de COM/SEM IMPUTADO -> IMPUTADO_INVALIDO.`
- **Resultado Esperado:** Diagnóstico ALERTA nas linhas divergentes.
- **Fontes Declaradas:** Diretriz de Registro Estatístico PMPE (PADRAO_ESTATISTICA em Core/RegrasQualidade.js:591)
- **Evidência no Código:** `Core/RegrasQualidade.js:642-645`, `Features/GuardiaoQualidade.js:218-259`
- **Evidência em Testes:** `Testes/TestGuardiao.js:8-9`
- **Exceções Admitidas:** Nenhuma exceção aplicável.
- **Consumidores (reconciliado #125):** REAL: Core/RegrasQualidade.js, Features/GuardiaoQualidade.js | INDIRETO: Core/CoberturaAuditoria.js, Render/PainelSaude.js, Render/RendererAuditoriaSaude.js | DECLARADO: GuardiaoQualidade | PLANEJADO: -
- **Riscos Identificados:** Distorção nas estatísticas criminais se a imputação for omitida.
- **Observações Operacionais:** Campo indispensável para apuração de prisões em flagrante.

---

### [ARCA-IMPUTACAO-002] Contabilização de Procedimentos Legais (APFD, TCO, BOC, AAFAI)
- **Subdomínio:** `imputacao` | **Categoria:** `AGREGACAO_METRICA`
- **Tipo de Regra:** `INTERNAL_OPERATIONAL_RULE` | **Status de Fonte:** `INTERNAL_SOURCE_CONFIRMED`
- **Descrição Humana:** A quantidade de procedimentos policiais lavrados (Auto de Prisão em Flagrante Delito, Termo Circunstanciado de Ocorrência, Boletim de Ocorrência Circunstanciado, Auto de Apreensão de Flagrante de Ato Infracional) é somada no consolidado individual do militar.
- **Condição Lógica:** `Valores numéricos preenchidos nas colunas de procedimentos da linha do militar.`
- **Resultado Esperado:** Incremento nos contadores de detidos, apfd, tco e boc do policial.
- **Fontes Declaradas:** Dicionário de Colunas de Procedimento (ESQUEMA_DADOS em Core/Constantes.js:44-48)
- **Evidência no Código:** `Plugins/Metricas/PluginPrisoes.js:15-18`
- **Evidência em Testes:** `Testes/TestPlugins.js`
- **Exceções Admitidas:** Nenhuma exceção aplicável.
- **Consumidores (reconciliado #125):** REAL: Plugins/Metricas/PluginPrisoes.js | INDIRETO: - | DECLARADO: PluginPrisoes, CompiladorProdutividade | PLANEJADO: -
- **Riscos Identificados:** Preenchimento textual em vez de contagem numérica.
- **Observações Operacionais:** Espelha o desfecho formal do inquérito na delegacia de plantão.

---

### [ARCA-EFETIVO-001] Padronização Canônica de Graduações Policiais Militares
- **Subdomínio:** `efetivo` | **Categoria:** `PADRONIZACAO`
- **Tipo de Regra:** `OFFICIAL_BUSINESS_RULE` | **Status de Fonte:** `CANONICAL_SOURCE_CONFIRMED`
- **Descrição Humana:** Todas as graduações militares (de Soldado a Coronel) são normalizadas para siglas canônicas uniformes (SD, CB, 3ºSGT, 2ºSGT, 1ºSGT, SUBTEN, ASP, 2ºTEN, 1ºTEN, CAP, MAJ, TC, CEL).
- **Condição Lógica:** `Entrada de postos/graduações com grafia por extenso, abreviações com ponto ou variações.`
- **Resultado Esperado:** Mapeamento determinístico para a sigla oficial PMPE.
- **Fontes Declaradas:** Estatuto dos Policiais Militares de Pernambuco (ESTATUTO_MILITAR em Core/Constantes.js:55-74)
- **Evidência no Código:** `Core/Constantes.js:55-74`, `Core/Utils.js:normalizarGraduacao`, `Features/NormalizadorEfetivo.js:83`
- **Evidência em Testes:** `Testes/TestNormalizadorEfetivo.js`, `Testes/TestDominio.js`
- **Exceções Admitidas:** Valores desconhecidos são preservados como N/I ou string limpa original.
- **Consumidores (reconciliado #125):** REAL: Core/Utils.js, Features/NormalizadorEfetivo.js | INDIRETO: - | DECLARADO: NormalizadorEfetivo, CompiladorProdutividade, RendererCA | PLANEJADO: Features/NormalizadorEfetivo.js
- **Riscos Identificados:** Patentes inexistentes no mapa caírem em N/I.
- **Observações Operacionais:** Base para ordenamento hierárquico em relatórios.

---

### [ARCA-EFETIVO-002] Desambiguação Automática de Nomes de Guerra por Antiguidade N
- **Subdomínio:** `efetivo` | **Categoria:** `DESAMBIGUACAO`
- **Tipo de Regra:** `INTERNAL_OPERATIONAL_RULE` | **Status de Fonte:** `INTERNAL_SOURCE_CONFIRMED`
- **Descrição Humana:** Quando múltiplos policiais do efetivo compartilham o mesmo nome de guerra e mesma graduação, o sistema desambigua numerando por ordem de antiguidade (1º NOME, 2º NOME., 3º NOME:).
- **Condição Lógica:** `Dois ou mais registros com mesma graduação e mesmo nome de guerra.`
- **Resultado Esperado:** Ordenação crescente por antiguidade N e prefixação ordenada.
- **Fontes Declaradas:** Padrão de Nome de Guerra da Seção de Pessoal PMPE (TRADICAO_OPERACIONAL em Features/NormalizadorEfetivo.js:32)
- **Evidência no Código:** `Features/NormalizadorEfetivo.js:140-190 (desambiguarNomesGuerra)`
- **Evidência em Testes:** `Testes/TestNormalizadorEfetivo.js:test 5 (desambiguação)`
- **Exceções Admitidas:** Nenhuma exceção aplicável.
- **Consumidores (reconciliado #125):** REAL: Features/NormalizadorEfetivo.js | INDIRETO: - | DECLARADO: NormalizadorEfetivo | PLANEJADO: Features/NormalizadorEfetivo.js
- **Riscos Identificados:** Mudança de antiguidade no boletim geral alterar o prefixo do nome de guerra.
- **Observações Operacionais:** Evita homônimos em escalas de serviço e relatórios estatísticos.

---

### [ARCA-MATRICULA-001] Higienização e Validação da Matrícula Funcional
- **Subdomínio:** `matricula` | **Categoria:** `IDENTIFICADOR_UNICO`
- **Tipo de Regra:** `OFFICIAL_BUSINESS_RULE` | **Status de Fonte:** `CANONICAL_SOURCE_CONFIRMED`
- **Descrição Humana:** A matrícula do policial é o identificador único institucional. Caracteres não numéricos (hífens, pontos, dígitos verificadores separados) devem ser expurgados, retendo apenas a sequência numérica estrita.
- **Condição Lógica:** `String de matrícula com formatações diversas.`
- **Resultado Esperado:** String contendo unicamente dígitos numéricos. Se vazia, rejeita a instância.
- **Fontes Declaradas:** Padrão de Matrícula do Estado de Pernambuco / SIRH (SISTEMA_RH em Dominio/Policial.js:13)
- **Evidência no Código:** `Dominio/Policial.js:13`, `Core/Utils.js:limparMatricula`, `Core/RegrasQualidade.js:557`
- **Evidência em Testes:** `Testes/TestDominio.js`, `Testes/TestNormalizadorEfetivo.js`
- **Exceções Admitidas:** Nenhuma exceção aplicável.
- **Consumidores (reconciliado #125):** REAL: Core/RegrasQualidade.js, Core/Utils.js, Dominio/Policial.js | INDIRETO: - | DECLARADO: Policial, NormalizadorEfetivo, CompiladorProdutividade, GuardiaoQualidade | PLANEJADO: Features/NormalizadorEfetivo.js
- **Riscos Identificados:** Matrículas de outras forças que contenham letras.
- **Observações Operacionais:** Chave primária para joins entre ocorrências, pecúlio e produtividade.

---

### [ARCA-MATRICULA-002] Obrigatoriedade de Matrícula para Policial com Nome Declarado
- **Subdomínio:** `matricula` | **Categoria:** `INTEGRIDADE_CADASTRO`
- **Tipo de Regra:** `INTERNAL_OPERATIONAL_RULE` | **Status de Fonte:** `INTERNAL_SOURCE_CONFIRMED`
- **Descrição Humana:** Não é permitido registrar policial apenas pelo nome de guerra sem fornecer a matrícula funcional correspondente.
- **Condição Lógica:** `Linha operacional com nome de policial preenchido e coluna matrícula em branco.`
- **Resultado Esperado:** Diagnóstico ALERTA MATRICULA_AUSENTE.
- **Fontes Declaradas:** Consistência de Efetivo Participante (DIRETRIZ_AUDITORIA em Features/GuardiaoQualidade.js:274-286)
- **Evidência no Código:** `Features/GuardiaoQualidade.js:274-286`
- **Evidência em Testes:** `Testes/TestGuardiao.js (matrícula ausente)`
- **Exceções Admitidas:** Nenhuma exceção aplicável.
- **Consumidores (reconciliado #125):** REAL: Core/RegrasQualidade.js, Features/GuardiaoQualidade.js | INDIRETO: Core/CoberturaAuditoria.js, Render/PainelSaude.js, Render/RendererAuditoriaSaude.js | DECLARADO: GuardiaoQualidade | PLANEJADO: -
- **Riscos Identificados:** Policial atuar na ocorrência e não pontuar na produtividade.
- **Observações Operacionais:** Garante que todo militar participante seja pontuado.

---

### [ARCA-ANTIGUIDADE-001] Precedência Hierárquica Militar por Menor Número N
- **Subdomínio:** `antiguidade` | **Categoria:** `HIERARQUIA`
- **Tipo de Regra:** `OFFICIAL_BUSINESS_RULE` | **Status de Fonte:** `CANONICAL_SOURCE_CONFIRMED`
- **Descrição Humana:** Na hierarquia militar da PMPE, a precedência é inversamente proporcional ao número N de antiguidade: quanto menor o número N, mais antigo é o militar e maior é sua autoridade/precedência na guarnição.
- **Condição Lógica:** `Dois ou mais militares na mesma guarnição.`
- **Resultado Esperado:** Identificação do militar com menor valor numérico N como líder hierárquico.
- **Fontes Declaradas:** Estatuto dos Policiais Militares de Pernambuco (Critério de Antiguidade) (ESTATUTO_MILITAR em Motor/PoliticaMeritoArmas.js:8)
- **Evidência no Código:** `Motor/PoliticaMeritoArmas.js:140-160`, `Features/NormalizadorEfetivo.js:94-97`
- **Evidência em Testes:** `Testes/TestMeritoEquipeArmas.js`, `Testes/TestGuardiao.js:28-37`
- **Exceções Admitidas:** Nenhuma exceção aplicável.
- **Consumidores (reconciliado #125):** REAL: Features/NormalizadorEfetivo.js, Motor/PoliticaMeritoArmas.js | INDIRETO: - | DECLARADO: PoliticaMeritoArmas, CompiladorGxt, NormalizadorEfetivo | PLANEJADO: Features/NormalizadorEfetivo.js
- **Riscos Identificados:** Confusão com conceitos civis onde número maior indica maior tempo.
- **Observações Operacionais:** Base de todos os critérios de desempate e liderança de equipe.

---

### [ARCA-MERITO-001] Atribuição Exclusiva do Mérito de Armas ao Líder mais Antigo (Menor N)
- **Subdomínio:** `merito_armas` | **Categoria:** `ATRIBUICAO_MERITO`
- **Tipo de Regra:** `OFFICIAL_BUSINESS_RULE` | **Status de Fonte:** `CANONICAL_SOURCE_CONFIRMED`
- **Descrição Humana:** O reconhecimento institucional e bônus de mérito de equipe por apreensão de armas é atribuído integralmente ao líder da guarnição (o militar de menor N entre todos os participantes do túnel, mesmo que o líder esteja em linha sem arma).
- **Condição Lógica:** `Ocorrência com apreensão de arma de fogo ou artesanal física > 0.`
- **Resultado Esperado:** Atribuição de todas as armas da ocorrência ao líder identificado pelo menor N da equipe.
- **Fontes Declaradas:** Política de Mérito de Equipe por Armas / Gxt (DIRETRIZ_COMANDO em Motor/PoliticaMeritoArmas.js:1-9)
- **Evidência no Código:** `Motor/PoliticaMeritoArmas.js:140-185`, `Features/CompiladorGxt.js:1-10`
- **Evidência em Testes:** `Testes/TestMeritoEquipeArmas.js`, `Testes/TestGuardiao.js:34`
- **Exceções Admitidas:** Túneis sem armas apreendidas não participam da política.
- **Consumidores (reconciliado #125):** REAL: Core/RegrasQualidade.js, Features/CompiladorGxt.js, Features/GuardiaoQualidade.js, Motor/PoliticaMeritoArmas.js | INDIRETO: Core/CoberturaAuditoria.js, Render/PainelSaude.js, Render/RendererAuditoriaSaude.js | DECLARADO: PoliticaMeritoArmas, CompiladorGxt, GuardiaoQualidade | PLANEJADO: -
- **Riscos Identificados:** Falta do cadastro de N no Pecúlio bloqueia a atribuição.
- **Observações Operacionais:** O líder responde pelo mérito da apreensão da equipe.

---

### [ARCA-MERITO-002] Bloqueio Crítico por Empate de Antiguidade N na Ocorrência Armada
- **Subdomínio:** `merito_armas` | **Categoria:** `BLOQUEIO_AUDITORIA`
- **Tipo de Regra:** `INTERNAL_OPERATIONAL_RULE` | **Status de Fonte:** `INTERNAL_SOURCE_CONFIRMED`
- **Descrição Humana:** Se dois ou mais integrantes da ocorrência armada apresentarem rigorosamente o mesmo menor número N no Pecúlio, o sistema não pode arbitrar e deve sinalizar pendência crítica para desempate pelo comando.
- **Condição Lógica:** `Dois integrantes empatados no menor valor N.`
- **Resultado Esperado:** Diagnóstico CRÍTICO MERITO_ARMAS_EMPATE_ANTIGUIDADE e status PENDENTE.
- **Fontes Declaradas:** Vedação ao Arbitramento Automático em Empate de Antiguidade (CRITERIO_EQUIDADE em Core/RegrasQualidade.js:336-351)
- **Evidência no Código:** `Core/RegrasQualidade.js:336-351`, `Motor/PoliticaMeritoArmas.js:165-175`
- **Evidência em Testes:** `Testes/TestGuardiao.js:30 (empate no menor N)`
- **Exceções Admitidas:** Nenhuma exceção aplicável.
- **Consumidores (reconciliado #125):** REAL: Core/RegrasQualidade.js, Features/GuardiaoQualidade.js, Motor/PoliticaMeritoArmas.js | INDIRETO: Core/CoberturaAuditoria.js, Render/PainelSaude.js, Render/RendererAuditoriaSaude.js | DECLARADO: GuardiaoQualidade, PoliticaMeritoArmas | PLANEJADO: -
- **Riscos Identificados:** Líder não ser computado até retificação cadastral.
- **Observações Operacionais:** Resguarda a integridade do mérito militar sem favoritismo algorítmico.

---

### [ARCA-MERITO-003] Isolamento da Fonte Pecúlio Externo (Proibição de Fallback)
- **Subdomínio:** `merito_armas` | **Categoria:** `SEGURANCA_DADOS`
- **Tipo de Regra:** `INTERNAL_OPERATIONAL_RULE` | **Status de Fonte:** `INTERNAL_SOURCE_CONFIRMED`
- **Descrição Humana:** A antiguidade N oficial deve ser lida exclusivamente da planilha externa configurada do Pecúlio. É proibido usar a planilha de ocorrências (sheet.getParent) como fallback para evitar corrupção de dados.
- **Condição Lógica:** `Tentativa de leitura de antiguidade N.`
- **Resultado Esperado:** Consumo via CONFIG_SYNTHEON.obterIdPeculio(); se inacessível, emite OBSERVACAO única sem ler dados locais espúrios.
- **Fontes Declaradas:** Diretriz de Isolamento de Fontes Sensíveis (CONTRATO_ARQUITETURAL em Features/GuardiaoQualidade.js:318)
- **Evidência no Código:** `Features/GuardiaoQualidade.js:318`, `Testes/TestGuardiao.js:37`
- **Evidência em Testes:** `Testes/TestGuardiao.js:36-37`
- **Exceções Admitidas:** Nenhuma exceção aplicável.
- **Consumidores (reconciliado #125):** REAL: Core/RegrasQualidade.js, Features/GuardiaoQualidade.js | INDIRETO: Core/CoberturaAuditoria.js, Render/PainelSaude.js, Render/RendererAuditoriaSaude.js | DECLARADO: GuardiaoQualidade, CompiladorGxt | PLANEJADO: -
- **Riscos Identificados:** Falta de permissão de acesso à planilha externa gera modo limitado.
- **Observações Operacionais:** Blindagem de governança e separação de responsabilidades.

---

### [ARCA-ARMAS-001] Fonte Exclusiva de Arma Física (Coluna ARMA x Exclusão de QDT ARMAS)
- **Subdomínio:** `armas` | **Categoria:** `DEFINICAO_METRICA`
- **Tipo de Regra:** `OFFICIAL_BUSINESS_RULE` | **Status de Fonte:** `CANONICAL_SOURCE_CONFIRMED`
- **Descrição Humana:** A quantidade de armas de fogo físicas apreendidas decorre unicamente da coluna ARMA (numérica). A coluna QDT ARMAS jamais entra na soma dos relatórios executivos para evitar contagem duplicada.
- **Condição Lógica:** `Cálculo e totalização de armas apreendidas no mês/trimestre.`
- **Resultado Esperado:** Total de armas = soma da coluna ARMA; QDT ARMAS ignorada.
- **Fontes Declaradas:** Regra de Ouro do Relatório Trimestral Gxt (REGRA_DE_OURO_GXT em Features/CompiladorGxt.js:4-8)
- **Evidência no Código:** `Features/CompiladorGxt.js:4-8`, `Motor/PoliticaMeritoArmas.js:4-6`
- **Evidência em Testes:** `Testes/TestRelatorioArmas.js`, `Testes/TestRelatorioGxt.js`
- **Exceções Admitidas:** Nenhuma exceção aplicável.
- **Consumidores (reconciliado #125):** REAL: Features/CompiladorGxt.js, Motor/PoliticaMeritoArmas.js | INDIRETO: - | DECLARADO: CompiladorGxt, PoliticaMeritoArmas, PluginArmas | PLANEJADO: -
- **Riscos Identificados:** Se um operador preencher apenas QDT ARMAS, a arma não entra na soma oficial.
- **Observações Operacionais:** Resolução consolidada para sanar antigas divergências em fechamentos mensais.

---

### [ARCA-ARMAS-002] Reconhecimento Textual de Arma Artesanal
- **Subdomínio:** `armas` | **Categoria:** `CLASSIFICACAO`
- **Tipo de Regra:** `INTERNAL_OPERATIONAL_RULE` | **Status de Fonte:** `INTERNAL_SOURCE_CONFIRMED`
- **Descrição Humana:** Armas artesanais/caseiras não são contadas como armas de fogo industriais na pontuação padrão; sua identificação provém exclusivamente de indicadores textuais ("ARTESANAL") nos campos de tipo ou modelo.
- **Condição Lógica:** `Presença do termo ARTESANAL nas colunas de tipo, modelo, descrição ou natureza.`
- **Resultado Esperado:** Contabilização na métrica armasArtesanais e segregação das armas de fogo industriais.
- **Fontes Declaradas:** Classificação de Armas Artesanais (DIRETRIZ_GXT em Motor/PoliticaMeritoArmas.js:50-52)
- **Evidência no Código:** `Motor/PoliticaMeritoArmas.js:50-52`, `Features/CompiladorGxt.js:6`
- **Evidência em Testes:** `Testes/TestMeritoEquipeArmas.js`
- **Exceções Admitidas:** Nenhuma exceção aplicável.
- **Consumidores (reconciliado #125):** REAL: Features/CompiladorGxt.js, Motor/PoliticaMeritoArmas.js | INDIRETO: - | DECLARADO: PoliticaMeritoArmas, CompiladorGxt | PLANEJADO: -
- **Riscos Identificados:** Erro de grafia (ex: "arma caseira" sem o termo artesanal).
- **Observações Operacionais:** Atende às tabelas de diferenciação balística da corporação.

---

### [ARCA-ARMAS-003] Consistência de Indicador PIP de Arma vs Apreensão Física
- **Subdomínio:** `armas` | **Categoria:** `CONSISTENCIA_MATERIAL`
- **Tipo de Regra:** `INTERNAL_OPERATIONAL_RULE` | **Status de Fonte:** `INTERNAL_SOURCE_CONFIRMED`
- **Descrição Humana:** Ocorrência com indicador PIP de arma de fogo exige registro de quantidade de armas > 0 no túnel.
- **Condição Lógica:** `Indicador inclui "ARMA DE FOGO" ou "ARMA LONGA" e armas <= 0.`
- **Resultado Esperado:** Diagnóstico ALERTA FATO_ARMA_AUSENTE.
- **Fontes Declaradas:** Validação Fato Arma vs Indicador (AUDITORIA_INTEGRIDADE em Core/RegrasQualidade.js:94-106)
- **Evidência no Código:** `Core/RegrasQualidade.js:94-106`
- **Evidência em Testes:** `Testes/TestGuardiao.js (Homologação E2E)`
- **Exceções Admitidas:** Nenhuma exceção aplicável.
- **Consumidores (reconciliado #125):** REAL: Core/RegrasQualidade.js, Features/GuardiaoQualidade.js | INDIRETO: Core/CoberturaAuditoria.js, Render/PainelSaude.js, Render/RendererAuditoriaSaude.js | DECLARADO: GuardiaoQualidade | PLANEJADO: -
- **Riscos Identificados:** Tentativa de porte sem apreensão efetiva da arma.
- **Observações Operacionais:** Exige coerência entre o texto e a quantidade física apreendida.

---

### [ARCA-MUNICOES-001] Consistência de Indicador PIP de Munição vs Quantidade Física
- **Subdomínio:** `municoes` | **Categoria:** `CONSISTENCIA_MATERIAL`
- **Tipo de Regra:** `INTERNAL_OPERATIONAL_RULE` | **Status de Fonte:** `INTERNAL_SOURCE_CONFIRMED`
- **Descrição Humana:** Indicador PIP contendo "MUNICAO" exige quantidade numérica de munições > 0 registrada na ocorrência.
- **Condição Lógica:** `Indicador inclui "MUNICAO" e municoes <= 0.`
- **Resultado Esperado:** Diagnóstico ALERTA FATO_MUNICAO_AUSENTE.
- **Fontes Declaradas:** Validação Fato Munição vs Indicador (AUDITORIA_INTEGRIDADE em Core/RegrasQualidade.js:108-120)
- **Evidência no Código:** `Core/RegrasQualidade.js:108-120`
- **Evidência em Testes:** `Testes/TestGuardiao.js (Homologação E2E)`
- **Exceções Admitidas:** Nenhuma exceção aplicável.
- **Consumidores (reconciliado #125):** REAL: Core/RegrasQualidade.js, Features/GuardiaoQualidade.js | INDIRETO: Core/CoberturaAuditoria.js, Render/PainelSaude.js, Render/RendererAuditoriaSaude.js | DECLARADO: GuardiaoQualidade | PLANEJADO: -
- **Riscos Identificados:** Nenhum identificado.
- **Observações Operacionais:** Previne lançamento de indicadores de munição sem comprovação na carga.

---

### [ARCA-DROGAS-001] Validação Material Obrigatória por Tipo de Entorpecente
- **Subdomínio:** `drogas` | **Categoria:** `CONSISTENCIA_MATERIAL`
- **Tipo de Regra:** `HEURISTIC` | **Status de Fonte:** `DOMAIN_RULE_SOURCE_UNKNOWN`
- **Descrição Humana:** Indicadores PIP específicos de maconha, crack ou cocaína exigem comprovação de quantidade física > 0 nas respectivas colunas de pesagem/unidades.
- **Condição Lógica:** `Indicador contém MACONHA/CRACK/COCAINA com fato correspondente <= 0.`
- **Resultado Esperado:** Diagnóstico ALERTA FATO_MACONHA_AUSENTE / FATO_CRACK_AUSENTE / FATO_COCAINA_AUSENTE.
- **Fontes Declaradas:** _Nenhuma fonte formal comprovada (Heurística / DOMAIN_RULE_SOURCE_UNKNOWN)_
- **Evidência no Código:** `Core/RegrasQualidade.js:52-92`
- **Evidência em Testes:** `Testes/TestGuardiao.js (Homologação E2E)`
- **Exceções Admitidas:** Nenhuma exceção aplicável.
- **Consumidores (reconciliado #125):** REAL: Core/RegrasQualidade.js, Features/GuardiaoQualidade.js | INDIRETO: Core/CoberturaAuditoria.js, Render/PainelSaude.js, Render/RendererAuditoriaSaude.js | DECLARADO: GuardiaoQualidade | PLANEJADO: -
- **Riscos Identificados:** Indicadores genéricos (ex: "TRÁFICO DE DROGAS") sem especificar a substância não são capturados.
- **Observações Operacionais:** Heurística desenvolvida internamente com base no padrão dos relatórios.

---

### [ARCA-DROGAS-002] Consolidação Cumulativa de Apreensão de Drogas por Militar
- **Subdomínio:** `drogas` | **Categoria:** `AGREGACAO_METRICA`
- **Tipo de Regra:** `INTERNAL_OPERATIONAL_RULE` | **Status de Fonte:** `INTERNAL_SOURCE_CONFIRMED`
- **Descrição Humana:** O total individual de drogas é a soma de gramas de maconha, crack e cocaína atribuídos ao militar na planilha de ocorrências.
- **Condição Lógica:** `Linhas do policial com apreensão de entorpecentes.`
- **Resultado Esperado:** Incremento das métricas individuais e contagem de ocorrências com droga.
- **Fontes Declaradas:** Totalizador de Entorpecentes (METRICA_PRODUTIVIDADE em Plugins/Metricas/PluginEntorpecentes.js:27)
- **Evidência no Código:** `Plugins/Metricas/PluginEntorpecentes.js:27`
- **Evidência em Testes:** `Testes/TestPlugins.js`, `Testes/TestRelatorioDrogas.js`
- **Exceções Admitidas:** Nenhuma exceção aplicável.
- **Consumidores (reconciliado #125):** REAL: Plugins/Metricas/PluginEntorpecentes.js | INDIRETO: - | DECLARADO: PluginEntorpecentes, CompiladorProdutividade | PLANEJADO: -
- **Riscos Identificados:** Soma de unidades de medida heterogêneas se houver comprimidos/unidades misturadas com gramas.
- **Observações Operacionais:** Expressa o volume total apreendido pelo militar no período.

---

### [ARCA-NUMERARIO-001] Resguardo da Não Auditabilidade Automática de Numerário
- **Subdomínio:** `numerario` | **Categoria:** `DISCRICIONARIEDADE_HUMANA`
- **Tipo de Regra:** `INTERNAL_OPERATIONAL_RULE` | **Status de Fonte:** `INTERNAL_SOURCE_CONFIRMED`
- **Descrição Humana:** Apreensões de dinheiro/numerário sem valor registrado em reais não podem ser recalculadas ou rejeitadas por máquina; o sistema classifica como NÃO AUDITÁVEL AUTOMATICAMENTE e preserva a intervenção humana.
- **Condição Lógica:** `Indicador PIP contendo NUMERARIO ou DINHEIRO com valor lido <= 0.`
- **Resultado Esperado:** Emissão de diagnóstico OBSERVACAO com código FATO_NAO_AUDITAVEL_AUTOMATICAMENTE.
- **Fontes Declaradas:** Resguardo de Discricionariedade Humana em Numerário (DIRETRIZ_GOVERNANCA em Core/RegrasQualidade.js:122-136)
- **Evidência no Código:** `Core/RegrasQualidade.js:122-136`
- **Evidência em Testes:** `Testes/TestGuardiao.js:11 (numerário sem valor em reais)`
- **Exceções Admitidas:** Nenhum bloqueio ou alerta impeditivo gerado.
- **Consumidores (reconciliado #125):** REAL: Core/RegrasQualidade.js, Features/GuardiaoQualidade.js | INDIRETO: Core/CoberturaAuditoria.js, Render/PainelSaude.js, Render/RendererAuditoriaSaude.js | DECLARADO: GuardiaoQualidade | PLANEJADO: -
- **Riscos Identificados:** Nenhum; previne arbitrariedade automatizada.
- **Observações Operacionais:** Garante que o auditor humano decida sobre valores retidos para perícia.

---

### [ARCA-TECNICA-001] Detecção de Erros Sintáticos e de Referência em Fórmulas
- **Subdomínio:** `formulas` | **Categoria:** `INTEGRIDADE_PLANILHA`
- **Tipo de Regra:** `TECHNICAL_RULE` | **Status de Fonte:** `CANONICAL_SOURCE_CONFIRMED`
- **Descrição Humana:** Células calculadas não podem apresentar erros sintáticos típicos de planilha (#NOME?, #REF!, #VALOR!, #DIV/0!, #N/D).
- **Condição Lógica:** `Fórmula ou valor contendo erros de planilha.`
- **Resultado Esperado:** Diagnóstico CRÍTICO FORMULA_CORROMPIDA_ERRO_SINTAXE com recomendação de restauração da linha 2.
- **Fontes Declaradas:** Padrão Google Sheets / Excel (MOTOR_SPREADSHEET em Core/RegrasQualidade.js:482)
- **Evidência no Código:** `Core/RegrasQualidade.js:482-504`
- **Evidência em Testes:** `Testes/TestGuardiao.js (Homologação E2E)`
- **Exceções Admitidas:** Nenhuma exceção aplicável.
- **Consumidores (reconciliado #125):** REAL: Core/RegrasQualidade.js, Features/GuardiaoQualidade.js | INDIRETO: Core/CoberturaAuditoria.js, Render/PainelSaude.js, Render/RendererAuditoriaSaude.js | DECLARADO: GuardiaoQualidade | PLANEJADO: -
- **Riscos Identificados:** Corrupção de totais e rateios em cascata.
- **Observações Operacionais:** Regra estritamente técnica de higienização de planilha.

---

### [ARCA-TECNICA-002] Reconhecimento de Exceção Manual Justificada por Nota
- **Subdomínio:** `formulas` | **Categoria:** `GOVERNANCA_HUMANA`
- **Tipo de Regra:** `TECHNICAL_RULE` | **Status de Fonte:** `INTERNAL_SOURCE_CONFIRMED`
- **Descrição Humana:** Célula calculada sem fórmula é aceita sem erro caso o operador registre uma nota na célula iniciando por "EXCECAO: [motivo]".
- **Condição Lógica:** `Coluna calculada sem fórmula com nota iniciada por EXCECAO:.`
- **Resultado Esperado:** Classificação como EXCECAO MANUAL (EXCECAO_MANUAL_JUSTIFICADA) sem erro.
- **Fontes Declaradas:** Protocolo de Exceção Manual Syntheon (PROTOCOLO_AUDITORIA em Core/RegrasQualidade.js:508-521)
- **Evidência no Código:** `Core/RegrasQualidade.js:508-521`
- **Evidência em Testes:** `Testes/TestGuardiao.js:10 (célula sem fórmula com nota EXCECAO:)`
- **Exceções Admitidas:** Se não houver nota, gera ALERTA FORMULA_AUSENTE.
- **Consumidores (reconciliado #125):** REAL: Core/RegrasQualidade.js, Features/GuardiaoQualidade.js | INDIRETO: Core/CoberturaAuditoria.js, Render/PainelSaude.js, Render/RendererAuditoriaSaude.js | DECLARADO: GuardiaoQualidade | PLANEJADO: -
- **Riscos Identificados:** Uso abusivo de exceções para burlar regras de rateio.
- **Observações Operacionais:** Mecanismo canônico de intervenção e justificativa humana.

### [ARCA-TERRITORIO-001] Determinação Territorial Canônica de AIS por Município e Bairro
- **Subdomínio:** `territorio` | **Categoria:** `TERRITORIALIDADE`
- **Tipo de Regra:** `CANONICAL_NORMATIVE_RULE` | **Status de Fonte:** `CANONICAL_SOURCE_CONFIRMED`
- **Descrição Humana:** A determinação da Área Integrada de Segurança (AIS) em Pernambuco é estritamente canônica baseada nas 26 AIS instituídas por lei e portarias da SDS. Municípios 100% mono-AIS determinam a AIS diretamente sem ambiguidade. Municípios multi-AIS (ex: Recife) exigem o bairro para desambiguação entre AIS 1 a 5. Se os dados forem insuficientes ou não possuírem correlação inequívoca, o sistema não inventa AIS e sinaliza necessidade de conferência humana.
- **Condição Lógica:** `Preenchimento ou extração de Município e/ou Bairro no formulário ou ocorrência.`
- **Resultado Esperado:** Atribuição automática e segura da AIS correspondente ou sinalização de pendência de conferência quando inconclusivo.
- **Fontes Declaradas:** `{'tipo': 'PORTARIA_ESTADUAL', 'nome': 'Portaria SDS nº 1197 de 11/06/2010 (DOE 15/06/2010)', 'localizacao': 'Dominio/TabelaTerritorialAIS.js', 'autoridade': 'Oficial'}`, `{'tipo': 'LEI_ESTADUAL', 'nome': 'Lei Estadual nº 14.320/2011 (alterada pela Lei nº 14.890/2012)', 'localizacao': 'ALEPE Legis - Anexo Único', 'autoridade': 'Oficial'}`, `{'tipo': 'PORTARIA_ESTADUAL', 'nome': 'Portaria SDS nº 129/2008 e Decreto Estadual nº 26.868/2004', 'localizacao': 'Normas de Compatibilização Territorial de Segurança Pública', 'autoridade': 'Oficial'}`
- **Evidência no Código:** `Dominio/TabelaTerritorialAIS.js`, `Dominio/ResolverAIS.js`, `Entrada/EntradaManual.js:578-620`, `Entrada/Formulario.html:1320-1550`
- **Evidência em Testes:** `Testes/TestFormularioAis.js`, `Testes/TestIntegracaoArca.js`
- **Exceções Admitidas:** `Se o operador editar manualmente o campo AIS no formulário, a vontade humana tem precedência soberana sobre o automatismo.`
- **Parâmetros:** `TABELA_TERRITORIAL_AIS`
- **Confiança:** `ALTA` | **Alcance:** `None`
- **Riscos:** -
- **Consumidores (reconciliado #125):** REAL: `Dominio/ResolverAIS.js`, `Dominio/TabelaTerritorialAIS.js`, `Entrada/EntradaManual.js`, `Entrada/Formulario.html` | INDIRETO: - | DECLARADO: `FormularioHtml`, `EntradaManual`, `GuardiaoQualidade`, `MotorAnaliticoV2` | PLANEJADO: -
- **Observações:** SEM codigo mapeado na porta ARCA: implementacao existe, mas nao recebe metadados ARCA (cobertura pendente - #126).

---

## 3.1 Regras adicionadas na reconciliacao de cobertura (#126 ARCA-FIX-003)

> Regras registradas a partir de codigo e teste existentes (nenhuma heuristica promovida a oficial):

### [ARCA-MIKE-004] Fragmentacao de Tunel por Chave Inconsistente
- **Subdomínio:** `mike` | **Categoria:** `INTEGRIDADE_CHAVE`
- **Tipo de Regra:** `INTERNAL_OPERATIONAL_RULE` | **Status de Fonte:** `INTERNAL_SOURCE_CONFIRMED`
- **Descrição Humana:** O mesmo MIKE deve pertencer a UMA unica chave de tunel (DATA|MIKE|BOE). Quando representacoes de data divergentes (Date vs texto) dividem o MIKE em varias chaves, a ocorrencia fica fragmentada e a agregacao por tunel fica incorreta.
- **Condição Lógica:** `MIKE com mesmas datas e BOE, porem presente em mais de uma chave de tunel.`
- **Resultado Esperado:** Diagnostico ALERTA TUNEL_FRAGMENTADO com as chaves e linhas envolvidas.
- **Evidência no Código:** `Core/SaudeTuneis.js:detectarFragmentados`, `Features/GuardiaoQualidade.js (bloco TUNEL_FRAGMENTADO)`
- **Evidência em Testes:** `Testes/TestSaudeTuneis.js (detecta tunel fragmentado)`
- **Auditabilidade no Guardiao:** `MAPEADO` — Codigo de diagnostico emitido pelo Guardiao com metadados ARCA via porta. Codigos: `TUNEL_FRAGMENTADO`
- **Consumidores (reconciliado #125):** REAL: `Core/SaudeTuneis.js`, `Features/GuardiaoQualidade.js` | INDIRETO: `Core/CoberturaAuditoria.js`, `Render/PainelSaude.js`, `Render/RendererAuditoriaSaude.js` | DECLARADO: - | PLANEJADO: -
- **Observações:** Regra registrada na reconciliacao de cobertura (#126 ARCA-FIX-003) com base em codigo e teste existentes.

---

### [ARCA-EFETIVO-003] Matricula sem Nome de Policial Vinculado
- **Subdomínio:** `efetivo` | **Categoria:** `EFETIVO`
- **Tipo de Regra:** `INTERNAL_OPERATIONAL_RULE` | **Status de Fonte:** `INTERNAL_SOURCE_CONFIRMED`
- **Descrição Humana:** Linha operacional com matricula preenchida e sem nome de policial compromete a rastreabilidade do efetivo; deve ser sinalizada como observacao, nunca como dado valido silencioso.
- **Condição Lógica:** `Linha de tunel com matricula preenchida e coluna de policial vazia.`
- **Resultado Esperado:** Diagnostico OBSERVACAO POLICIAL_SEM_NOME pedindo confirmacao do nome vinculado.
- **Evidência no Código:** `Features/GuardiaoQualidade.js (bloco POLICIAL_SEM_NOME)`
- **Evidência em Testes:** `Testes/TestGuardiao.js (regressao de cenarios operacionais)`
- **Auditabilidade no Guardiao:** `MAPEADO` — Codigo de diagnostico emitido pelo Guardiao com metadados ARCA via porta. Codigos: `POLICIAL_SEM_NOME`
- **Consumidores (reconciliado #125):** REAL: `Features/GuardiaoQualidade.js` | INDIRETO: `Core/CoberturaAuditoria.js`, `Render/PainelSaude.js`, `Render/RendererAuditoriaSaude.js` | DECLARADO: - | PLANEJADO: -
- **Observações:** Regra registrada na reconciliacao de cobertura (#126 ARCA-FIX-003) com base em codigo e teste existentes.

---

### [ARCA-MATRICULA-003] Matricula em Multiplas Ocorrencias na Mesma Data
- **Subdomínio:** `matricula` | **Categoria:** `EFETIVO`
- **Tipo de Regra:** `INTERNAL_OPERATIONAL_RULE` | **Status de Fonte:** `INTERNAL_SOURCE_CONFIRMED`
- **Descrição Humana:** A mesma matricula vinculada a mais de um MIKE na mesma data exige confirmacao humana (participacao real em duas ocorrencias) ou indica erro de preenchimento.
- **Condição Lógica:** `Mesma matricula presente em 2 ou mais MIKEs com a mesma data.`
- **Resultado Esperado:** Diagnostico OBSERVACAO MATRICULA_MULTIPLAS_OCORRENCIAS_MESMA_DATA com os MIKEs envolvidos.
- **Evidência no Código:** `Core/CoberturaAuditoria.js:detectarMatriculaMultiplaNaMesmaData`, `Features/GuardiaoQualidade.js (matriculasOcorrencias)`
- **Evidência em Testes:** `Testes/TestCoberturaAuditoria.js (detecta matricula em 2 MIKEs na mesma data)`
- **Auditabilidade no Guardiao:** `MAPEADO` — Codigo de diagnostico emitido pelo Guardiao com metadados ARCA via porta. Codigos: `MATRICULA_MULTIPLAS_OCORRENCIAS_MESMA_DATA`
- **Consumidores (reconciliado #125):** REAL: `Core/CoberturaAuditoria.js`, `Features/GuardiaoQualidade.js` | INDIRETO: `Render/PainelSaude.js`, `Render/RendererAuditoriaSaude.js` | DECLARADO: - | PLANEJADO: -
- **Observações:** Regra registrada na reconciliacao de cobertura (#126 ARCA-FIX-003) com base em codigo e teste existentes.

---

### [ARCA-AUDITORIA-001] Classificacao de Saude por Tunel
- **Subdomínio:** `auditoria` | **Categoria:** `SAUDE_AUDITORIA`
- **Tipo de Regra:** `TECHNICAL_RULE` | **Status de Fonte:** `INTERNAL_SOURCE_CONFIRMED`
- **Descrição Humana:** Cada tunel auditado recebe UM dos cinco estados: SAUDAVEL | ALERTA | CRITICO | INCOMPLETO | NAO_AUDITAVEL, por precedencia explicita, sem permitir verde quando houver lacuna de verificacao.
- **Condição Lógica:** `Tunel com diagnosticos e/ou estrutura incompleta.`
- **Resultado Esperado:** Contagem de tuneis saudaveis/alerta/critico/incompleto/nao auditavel por mes e por tunel.
- **Evidência no Código:** `Core/SaudeTuneis.js:classificarTunel`, `Features/GuardiaoQualidade.js (retorno .saude)`
- **Evidência em Testes:** `Testes/TestSaudeTuneis.js (18 testes de classificacao)`
- **Auditabilidade no Guardiao:** `MAPEADO` — Regra tecnica do proprio auditor: nao gera diagnostico; descreve comportamento da varredura (classificacao de saude / cobertura) e por isso nao tem codigo associado. 
- **Consumidores (reconciliado #125):** REAL: `Core/SaudeTuneis.js`, `Features/GuardiaoQualidade.js` | INDIRETO: `Core/CoberturaAuditoria.js`, `Render/PainelSaude.js`, `Render/RendererAuditoriaSaude.js` | DECLARADO: - | PLANEJADO: -
- **Observações:** Regra registrada na reconciliacao de cobertura (#126 ARCA-FIX-003) com base em codigo e teste existentes.

---

### [ARCA-AUDITORIA-002] Cobertura de Auditoria e Declaracao de NAO_AUDITADO
- **Subdomínio:** `auditoria` | **Categoria:** `COBERTURA`
- **Tipo de Regra:** `TECHNICAL_RULE` | **Status de Fonte:** `INTERNAL_SOURCE_CONFIRMED`
- **Descrição Humana:** O Guardiao deve declarar explicitamente o que NAO conseguiu verificar (catalogo PIP ausente, fonte de antiguidade indisponivel, metadados ARCA ausentes). Ausencia de evidencia nunca vira aprovacao.
- **Condição Lógica:** `Varredura concluida com dependencia ausente ou diagnostico sem metadados ARCA.`
- **Resultado Esperado:** Status COMPLETA|PARCIAL e lista de regras NAO_AUDITADAS com motivo.
- **Evidência no Código:** `Core/CoberturaAuditoria.js:montarCobertura`, `Core/SaudeTuneis.js (classificacao NAO_AUDITAVEL)`
- **Evidência em Testes:** `Testes/TestCoberturaAuditoria.js (10 testes; catalogo ausente -> PARCIAL)`
- **Auditabilidade no Guardiao:** `MAPEADO` — Regra tecnica do proprio auditor: nao gera diagnostico; descreve comportamento da varredura (classificacao de saude / cobertura) e por isso nao tem codigo associado. 
- **Consumidores (reconciliado #125):** REAL: `Core/CoberturaAuditoria.js`, `Features/GuardiaoQualidade.js` | INDIRETO: `Render/PainelSaude.js`, `Render/RendererAuditoriaSaude.js` | DECLARADO: - | PLANEJADO: -
- **Observações:** Regra registrada na reconciliacao de cobertura (#126 ARCA-FIX-003) com base em codigo e teste existentes.

---
