# MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO

Responsabilidade canonica do modulo.

## Papel
Catalogo canonico de regras de dominio da Colmeia (ARCA "as-is"): registra, classifica,
prova a proveniencia e mede a cobertura das regras de negocio do dominio, e expoe uma
PORTA DE CONSULTA read-only para os consumidores (Guardião da Qualidade e demais modulos).

A ARCA NAO executa correcao de dados, NAO audita planilha e NAO decide: ela descreve regras
e responde "existe regra canonica para este codigo? qual a fonte? qual o tipo?".

## Endereco no Down Plant
- Comodo: C03_Dominio
- Modulo: MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO
- Circuito principal: CIR-MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO.canvas
- Submodulos: SUB-C03-02-01_CATALOGO_DE_REGRAS, SUB-C03-02-02_FONTES_E_PROVENIENCIA,
  SUB-C03-02-03_COBERTURA_E_LACUNAS, SUB-C03-02-04_ADAPTADOR_PORTA_DE_CONSULTA

## Artefatos fisicos registrados neste endereco (realidade == planta)
| Artefato | Repo path | Funcao | Submodulo |
| :--- | :--- | :--- | :--- |
| arca_regras_dominio.json | Dominio/ARCA/arca_regras_dominio.json | Catalogo canonico legivel por maquina (31 regras) | SUB-C03-02-01 |
| ARCA_REGRAS_DOMINIO.md | Dominio/ARCA/ARCA_REGRAS_DOMINIO.md | Catalogo humano das regras | SUB-C03-02-01 |
| ARCA_FONTES.md | Dominio/ARCA/ARCA_FONTES.md | Proveniencia e autoridade das fontes | SUB-C03-02-02 |
| ARCA_COBERTURA.md | Dominio/ARCA/ARCA_COBERTURA.md | Cobertura por subdominio e lacunas conhecidas | SUB-C03-02-03 |
| AdaptadorConsultaArca.js | Dominio/ARCA/AdaptadorConsultaArca.js | PORTA DE CONSULTA (read-only) | SUB-C03-02-04 |

## Porta de saida (interface)
- API: `AdaptadorConsultaArca.enriquecerDiagnostico(codigoRegra, contexto)` -> metadados ARCA.
- Mapeamento: 26 codigos de diagnostico -> 20 das 31 regras.
- Consumidores FACTUAIS (apurados na auditoria #123, leitura de codigo):
  1. `Core/RegrasQualidade.js` (hub unico; chama a porta ao criar cada diagnostico);
  2. `Core/CoberturaAuditoria.js` (le `arca.status` para reportar LACUNA_ARCA);
  3. `Render/PainelSaude.js` (exibe metadados ARCA no drill-down);
  4. C05 Guardião (consumo INDIRETO, via RegrasQualidade).
- Consumidores DECLARADOS no JSON (12 componentes) sem lastro em codigo: pendencia tratada no card #125
  (reconciliacao consumidor real x indireto x declarado x planejado). Nao usar a lista declarada como fato.

## Limites e invariantes
- Read-only: nunca altera dados, planilha, formulas ou colunas operacionais.
- Nao promove HEURISTIC/UNKNOWN a regra oficial (2 HEURISTIC e 2 fontes desconhecidas permanecem sinalizadas).
- Nao inventa regra nem fonte: regra sem norma/suporte entra como INTERNAL_OPERATIONAL_RULE ou fonte desconhecida.
- Lacunas conhecidas: VEICULOS e ESCALA NAO_COBERTO; TIPIFICACAO NAO_AUTOMATIZAVEL; 11 regras sem mapeamento na porta.
- Este modulo NAO fecha consumidor: quem consome e responsavel pelo seu proprio contrato.

## Pendencias registradas (cards corretivos)
- #125 reconciliacao de consumidores; #126 cobertura Guardiao<->ARCA (11 regras + lacunas G01);
  #127 integracao factual do NormalizadorEfetivo; #128 varredura exaustiva do dominio (catalogo atual varreu 200 de 1946 arquivos).
