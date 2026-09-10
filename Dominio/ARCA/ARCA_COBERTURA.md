# ARCA — Mapa de Cobertura do Domínio e Lacunas Conhecidas
**Projeto:** OPP Formulário Clasp / Syntheon  
**Data:** 2026-09-04T03:17:16.488Z

---

## 1. Matriz de Cobertura por Subdomínio

| Subdomínio | Status de Cobertura | Justificativa e Escopo Factual |
| :--- | :--- | :--- |
| **OCORRENCIA** | `COBERTO` | Conceito de túnel (DATA|MIKE|BOE), ocorrência órfã, imputação de equipe e turno sem apreensão implementados e testados. |
| **MIKE** | `COBERTO` | Formato YYYYMMDD, unicidade temporal, validação cruzada entre linhas e detecção de códigos suspeitos cobertos. |
| **BOE** | `COBERTO` | Unicidade de BOE por MIKE e vínculo com inquérito civil cobertos. |
| **PIP** | `COBERTO` | Divisor fixo 4 de rateio, agregação por máxima atuação e catálogo dinâmico de indicadores cobertos. |
| **IMPUTACAO** | `COBERTO` | Consistência de COM/SEM IMPUTADO e totalização de procedimentos (APFD, TCO, BOC, AAFAI) cobertos. |
| **EFETIVO** | `COBERTO` | Normalização estrita de graduações e desambiguação de nomes de guerra por antiguidade N cobertos. |
| **MATRICULA** | `COBERTO` | Higienização numérica e obrigatoriedade de vínculo cadastral cobertos. |
| **ANTIGUIDADE** | `COBERTO` | Precedência hierárquica militar inversamente proporcional a N coberta em testes e código. |
| **MERITO_ARMAS** | `COBERTO` | Atribuição exclusiva ao menor N da equipe, bloqueio em empate e blindagem de fonte Pecúlio cobertos. |
| **ARMAS** | `COBERTO` | Fonte exclusiva na coluna ARMA, exclusão de QDT ARMAS, diferenciação de artesanal e consistência com indicadores cobertos. |
| **MUNICOES** | `COBERTO` | Validação material de apreensão de munições associada a indicadores coberta. |
| **DROGAS** | `COBERTO` | Validação material por tipo (maconha, crack, cocaína) e agregação de gramas/unidades coberta. |
| **NUMERARIO** | `COBERTO` | Proteção explícita de não auditabilidade automática e preservação da autonomia humana coberta. |
| **VEICULOS** | `NAO_COBERTO` | O sistema atual não possui regras de validação de veículos apreendidos/recuperados (placa, chassi, roubo/furto). |
| **ESCALA** | `NAO_COBERTO` | Não há integração com escalas de serviço ou registro de afastamentos/férias para checar legalidade da escala. |
| **TERRITORIALIDADE** | `COBERTO` | Determinação e validação canônica de AIS (26 AIS de PE) a partir de Município e Bairro com suporte mono/multi-AIS e desambiguação de homônimos (Portaria SDS nº 1197/2010 e Lei nº 14.320/2011). |
| **TIPIFICACAO** | `NAO_AUTOMATIZAVEL` | A qualificação jurídica (tráfico vs posse, concurso de crimes) é competência exclusiva da Autoridade Policial e Judiciária. |
| **FORMULAS** | `COBERTO` | Detecção de erros #NOME/#REF, exigência de fórmula e suporte formal a notas EXCECAO: cobertos. |
| **GXT** | `COBERTO` | Diagnostico deterministico de tuneis do relatorio GXT mapeado em ARCA-GXT-001 (#128). |
| **METRICAS** | `COBERTO` | Consolidacao analitica por orquestracao de plugins (MotorAnaliticoV2 + Plugins/Metricas) mapeada em ARCA-METRICAS-001 (#128). |
| **AUDITORIA** | `COBERTO` | Saude por tunel (5 estados), cobertura explicita com NAO_AUDITADO e modo limitado de catalogo PIP, mapeados como regras tecnicas ARCA-AUDITORIA-001/002 (#126). |

---

## 2. Análise das Lacunas e Fronteiras do Sistema
1. **Veículos (Apreensão / Recuperação):**
   - *Status:* `NAO_COBERTO`
   - *Diagnóstico:* O sistema atual não valida dados de veículos (placas, adulteração de chassi, queixas de roubo/furto). Trata-se de uma expansão futura recomendada para a Seção de Inteligência/Estatística.
2. **Escala e Afastamentos:**
   - *Status:* `NAO_COBERTO`
   - *Diagnóstico:* O sistema não valida se o militar escalado estava em gozo de férias, licença médica (LTS) ou dispensa regulamentar. Assume-se a veracidade da escala fornecida pelo operador.
3. **Circunscrição Territorial (AIS / Bairros / Companhias):**
   - *Status:* `COBERTO`
   - *Diagnóstico:* Implementada tabela canônica territorial oficial das 26 AIS de Pernambuco (`Dominio/TabelaTerritorialAIS.js` e `Dominio/ResolverAIS.js`). O sistema resolve automaticamente a AIS a partir do Município (quando mono-AIS) ou Bairro (quando multi-AIS como Recife), sinalizando pendência de conferência sem inventar dados caso a correspondência não seja inequívoca.
4. **Tipificação e Legalidade Jurídica:**
   - *Status:* `NAO_AUTOMATIZAVEL`
   - *Diagnóstico:* O enquadramento legal e a tipificação penal (crime consumado vs tentado, tráfico vs uso próprio, legítima defesa) são de competência privativa do Delegado de Polícia Civil e do Poder Judiciário, sendo vedado ao sistema automatizado qualquer juízo de valor substitutivo.


> **Atualizacao 10/09/2026 (#126):** catalogo reconciliado com 36 regras; 25 mapeadas no Guardiao e 11 explicitamente NAO auditaveis com motivo. Nenhum codigo de diagnostico do Guardiao ficou sem regra ARCA.


> **Varredura exaustiva 10/09/2026 (#128):** 127 arquivos de dominio JS varridos de 3413 no repositorio (exclusoes por motivo em `meta.varredura_exaustiva`); 40 regras no catalogo; 6 lacunas de catalogo detectadas e 6 resolvidas; 0 aceitas.
