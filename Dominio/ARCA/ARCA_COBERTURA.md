# ARCA — Mapa de Cobertura do Domínio e Lacunas Conhecidas
**Projeto:** OPP Formulário Clasp / Syntheon  
**Data:** 2026-09-04T03:17:16.488Z

---

<!-- ARCA-METRICAS:INICIO (gerado por scripts/downplant/contar-regras-arca.mjs; sha256 do JSON: f9c853d6725a4b763472832f679ee339736a715ba4c2521f6b95a59588cadb43) -->
#### Métricas derivadas do JSON — por métrica, com definição explícita (#159 ARCA-COUNT-001)

> Gerado por `scripts/downplant/contar-regras-arca.mjs` a partir de `Dominio/ARCA/arca_regras_dominio.json` 
> (sha256 `f9c853d6725a4b763472832f679ee339736a715ba4c2521f6b95a59588cadb43`). **Nenhum número abaixo é digitado à mão**: cada linha é a medição do campo indicado.
> Substitui qualquer "total ARCA" anterior — o total ambíguo não existe mais.

| Métrica | Definição (campo medido no JSON) | Valor |
| :--- | :--- | ---: |
| `regras_total` | registros na lista `regras` (total do catálogo) | **49** |
| `rule_ids_unicos` | valores distintos de `rule_id` | **49** |
| `regras_mapeadas` | `auditabilidade_guardiao.status = MAPEADO` (o Guardião audita) | **33** |
| `regras_integradas` | `auditabilidade_guardiao.status = INTEGRADO` (NormalizadorEfetivo/plugins via porta) | **8** |
| `regras_nao_aplicaveis` | `auditabilidade_guardiao.status = NAO_APLICAVEL` (estruturais) | **8** |
| `regras_nao_auditaveis` | `auditabilidade_guardiao.status = NAO_AUDITAVEL` (regras cegas) | **0** |
| `regras_sem_auditoria_guardiao` | `regras_total − regras_mapeadas` (tudo que o Guardião **não** audita) | **16** |
| `codigos_diagnostico` | soma dos itens de `auditabilidade_guardiao.codigos` | **38** |
| `codigos_diagnostico_unicos` | códigos distintos | **38** |
| `regras_com_codigo` | regras com ao menos 1 código de diagnóstico | **30** |
| `porta_codigos` | entradas de `AdaptadorConsultaArca.MAPA_DIAGNOSTICO_ARCA` | **38** |
| `porta_rule_ids` | `rule_id` distintos alcançados pela porta | **30** |
| `regras_sem_regra_na_porta` | `regras_total − porta_rule_ids` (regras fora do mapa de códigos) | **19** |
| `campos_por_regra` | campos da regra no JSON (padrão do catálogo) | **23** |
| `campos_por_regra_uniao` | união de campos declarados em alguma regra | **25** |
| `fontes_canonicas` | `fonte_status = CANONICAL_SOURCE_CONFIRMED` | **12** |
| `fontes_internas` | `fonte_status = INTERNAL_SOURCE_CONFIRMED` | **35** |
| `fontes_desconhecidas` | `fonte_status = DOMAIN_RULE_SOURCE_UNKNOWN` | **2** |
| `subdominios` | valores distintos de `subdominio` | **19** |
| `categorias` | valores distintos de `categoria` | **36** |
| `arquivos_totais_repo` | `meta.varredura_exaustiva.universo.arquivos_totais_repo` | **3413** |
| `arquivos_varridos_dominio_js` | `meta.varredura_exaustiva.universo.arquivos_varridos_dominio_js` | **127** |
| `arquivos_excluidos` | `meta.varredura_exaustiva.universo.arquivos_excluidos` | **3286** |
| `lacunas_detectadas` | `meta.varredura_exaustiva.lacunas_detectadas` | **6** |
| `lacunas_resolvidas` | `meta.varredura_exaustiva.lacunas_resolvidas` | **6** |
| `lacunas_aceitas` | `meta.varredura_exaustiva.lacunas_aceitas` | **0** |

**Por tipo de regra (`tipo_regra`)** — soma = 49: `INTERNAL_OPERATIONAL_RULE` = **31** · `OFFICIAL_BUSINESS_RULE` = **10** · `TECHNICAL_RULE` = **5** · `HEURISTIC` = **2** · `CANONICAL_NORMATIVE_RULE` = **1**.

**Por subdomínio (`subdominio`)** — total = 49:

| Subdomínio | Regras | MAPEADO | INTEGRADO | NAO_APLICAVEL |
| :--- | ---: | ---: | ---: | ---: |
| `ocorrencia` | 9 | 5 | 1 | 3 |
| `mike` | 4 | 4 | 0 | 0 |
| `armas` | 3 | 3 | 0 | 0 |
| `auditoria` | 3 | 3 | 0 | 0 |
| `drogas` | 3 | 1 | 1 | 1 |
| `efetivo` | 3 | 1 | 2 | 0 |
| `imputacao` | 3 | 1 | 1 | 1 |
| `matricula` | 3 | 2 | 1 | 0 |
| `merito_armas` | 3 | 3 | 0 | 0 |
| `pip` | 3 | 2 | 1 | 0 |
| `antiguidade` | 2 | 1 | 1 | 0 |
| `boe` | 2 | 2 | 0 | 0 |
| `formulas` | 2 | 2 | 0 | 0 |
| `gxt` | 1 | 0 | 0 | 1 |
| `metricas` | 1 | 0 | 0 | 1 |
| `municoes` | 1 | 1 | 0 | 0 |
| `numerario` | 1 | 1 | 0 | 0 |
| `territorio` | 1 | 1 | 0 | 0 |
| `veiculo` | 1 | 0 | 0 | 1 |

**Códigos de diagnóstico:** 38 códigos (38 distintos) em 30 regras; a porta de consulta cobre 38 códigos → 30 rule_ids (0 código sem regra, 0 regra duplicada por código).

<!-- ARCA-METRICAS:FIM -->

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
| **ANTIGUIDADE** | `COBERTO` | Precedência por posto/graduação (mais antigo primeiro) e, no empate, pela **matrícula mais antiga** — coberta em testes e código (`ARCA-ANTIGUIDADE-002`). |
| **MERITO_ARMAS** | `COBERTO` | Atribuição exclusiva ao menor N da equipe, bloqueio em empate e blindagem de fonte Pecúlio cobertos. |
| **ARMAS** | `COBERTO` | Fonte exclusiva na coluna ARMA, exclusão de QDT ARMAS, diferenciação de artesanal e consistência com indicadores cobertos. |
| **MUNICOES** | `COBERTO` | Validação material de apreensão de munições associada a indicadores coberta. |
| **DROGAS** | `COBERTO` | Validação material por tipo (maconha, crack, cocaína), agregação de gramas/unidades e **conversão canônica das formas de apreensão em gramas** (`ARCA-CONVERSAO-001`: pedra 0,25 g · papelote/big 3 g · pino/ziplock 1 g; crack entra no total geral da cocaína nos escalões superiores). |
| **NUMERARIO** | `COBERTO` | Proteção explícita de não auditabilidade automática e preservação da autonomia humana coberta. |
| **VEICULOS** | `COBERTO` | `ARCA-VEICULO-001` (subdomínio `veiculo`, `status_cobertura` = COBERTO no JSON) rege a **autorização canônica do título PIP** de veículo recuperado/furtado/roubado (determinada pela NATUREZA da ocorrência). A validação física (placa, chassi, adulteração) permanece fora do escopo — fronteira declarada. |
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


<!-- ARCA-HISTORICO:INICIO -->
> **Atualizacao 10/09/2026 (#126):** catalogo reconciliado com 36 regras; 25 mapeadas no Guardiao e 11 explicitamente NAO auditaveis com motivo. Nenhum codigo de diagnostico do Guardiao ficou sem regra ARCA.


> **Varredura exaustiva 10/09/2026 (#128):** 127 arquivos de dominio JS varridos de 3413 no repositorio (exclusoes por motivo em `meta.varredura_exaustiva`); 40 regras no catalogo; 6 lacunas de catalogo detectadas e 6 resolvidas; 0 aceitas.


> **Reconciliacao OCR/Veiculo 10/09/2026 (#137 OCR-ARCA-003):** catalogo com **41 regras**; 26 mapeadas no Guardiao e **15** explicitamente NAO auditaveis com motivo. Nova regra de dominio `ARCA-VEICULO-001` (subdominio `veiculo`): o titulo PIP de veiculo exige natureza que confirme recuperacao/apreensao/localizacao de veiculo roubado ou furtado. Fronteira explicita: a ARCA rege a CONDICAO de dominio; o parser do formulario continua responsavel por ler o BO e pela realizacao lexical (heuristica OCR) — nenhuma heuristica foi promovida a regra oficial, e GXT/Central Analitica permanecem fora do menu por decisao do proprietario.


> **Integracao OCR/Veiculo 10/09/2026 (#138 OCR-ARCA-004):** `ARCA-VEICULO-001` passou a ter **consumidores reais** (`Entrada/Formulario.html` + `Entrada/EntradaManual.js`): o formulario consulta os metadados canonicos por rule_id (fail-soft) e a heuristica lexical segue no parser, agora cobrindo substantivo, adjetivo e participio e tolerando quebra de linha. A defesa anti-falso-positivo foi preservada.

> **Registro de conversão de drogas 11/09/2026 (#144 OCR-P3-010):** catálogo com **42 regras**. Nova regra de domínio `ARCA-CONVERSAO-001` (subdomínio `drogas`) registra as medidas canônicas ditadas pelo proprietário — 1 pedra de crack = 0,25 g, 1 papelote/big de maconha = 3 g, 1 pino/ziplock de cocaína = 1 g — e a razão de o `TOTAL DE COCAINA` incluir o crack (crack é derivado direto da cocaína e entra no somatório geral dos escalões superiores, ainda que a unidade mantenha as contabilidades separadas). Isso resolve o risco R2 do mapa do túnel (card #142) como **intencional**, não defeito. Consumidor real: `Core/Constantes.js` (`CONVERSOES_DROGAS`).

> **Registro de identidade da ocorrência 13/09/2026 (#160 GUARD-D7-001):** catálogo com **49 regras**. A regra `ARCA-OCORRENCIA-007` (subdomínio `ocorrencia`) registra a decisão do proprietário **"1 ocorrência = 1 MIKE"** — a chave canônica do túnel é DATA + MIKE + BOE e é única por ocorrência, logo não existe divisão legítima a arbitrar (D7 A/B/C = NÃO_APLICÁVEL). O Guardião passou a emitir `OCORRENCIA_FRAGMENTADA_POR_DATA` (mesma identidade MIKE+BOE em datas distintas) e `MIKE_FORMATO_NAO_CANONICO_OU_DUPLICADO` (mesmo BOE com o MIKE em grafias diferentes), sem corrigir o dado — a normalização é do MOD-C05-02 sob CONFIRM_AUTO/dry-run. Subdomínio `OCORRENCIA` permanece `COBERTO`.
<!-- ARCA-HISTORICO:FIM -->
