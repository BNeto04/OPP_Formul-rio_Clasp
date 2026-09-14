# ESPELHO — AdaptadorConsultaArca.js

> [!NOTE] Espelho rico de código (Metodo §46.15) — gerado por `scripts/downplant/espelho-rico.mjs`
> Somente leitura. Não editar à mão: qualquer edição é sobrescrita na próxima geração.
> O código abaixo é cópia verbatim do arquivo de origem no commit declarado; divergência entre o embutido e a origem é deriva (§18.1).
> Regra do sha256 declarado: sha256 do conteúdo **normalizado para LF** (igual ao blob do Git). Em arquivo CRLF com terminador final diferente, ele difere do `sha256sum` dos bytes crus — a comparação de deriva é feita conteúdo-contra-conteúdo.
> Papel desta cópia: CANÔNICA (repositório). O derivado navegável no vault é gerado com as mesmas entradas.

- **Endereço Down Plant:** `C03_Dominio / MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO / SUB-C03-02-04_ADAPTADOR_PORTA_DE_CONSULTA` — [NOTA_DE_RESPONSABILIDADE.md](../../../02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO/submodulos/SUB-C03-02-04_ADAPTADOR_PORTA_DE_CONSULTA/NOTA_DE_RESPONSABILIDADE.md)
- **Arquivo de origem (link para o disco):** [`Dominio/ARCA/AdaptadorConsultaArca.js`](../../../Dominio/ARCA/AdaptadorConsultaArca.js)
- **Commit de referência:** `fbb0608e7b98144533628c7f9b773a10505b800d` (`fbb0608`)
- **Data da última sincronização:** 2026-09-13T21:45:15-03:00

## Código-fonte embutido

Verbatim de `Dominio/ARCA/AdaptadorConsultaArca.js` em `fbb0608`. sha256 do bloco (LF): `99f8c7e2fb8a44e708aaff9490307d0a154c9897a3a6b512c4b0bbb1522a5338` — 273 linhas.

```javascript
/**
 * ARQUIVO: Dominio/ARCA/AdaptadorConsultaArca.js
 * DESCRIÇÃO: Adaptador de consulta somente leitura para a ARCA (Catálogo Canônico de Regras de Domínio).
 * Fornece metadados explicáveis para enriquecimento aditivo de diagnósticos de auditoria e qualidade.
 * TOTALMENTE SOMENTE LEITURA, FAIL-SOFT E NÃO INTRUSIVO.
 */

class AdaptadorConsultaArca {
  /**
   * Mapeamento canônico entre os códigos de diagnóstico do Guardião/RegrasQualidade e os rule_ids da ARCA.
   */
  static get MAPA_DIAGNOSTICO_ARCA() {
    return Object.freeze({
      // Domínio: Drogas / Entorpecentes
      'FATO_MACONHA_AUSENTE': 'ARCA-DROGAS-001',
      'FATO_CRACK_AUSENTE': 'ARCA-DROGAS-001',
      'FATO_COCAINA_AUSENTE': 'ARCA-DROGAS-001',

      // Domínio: Armas
      'FATO_ARMA_AUSENTE': 'ARCA-ARMAS-003',
      'ARMA_ARTESANAL_INCONSISTENTE': 'ARCA-ARMAS-002',
      'QDT_ARMAS_DIVERGENTE_NO_TUNEL': 'ARCA-ARMAS-001',
      'QTD_O_DIVERGENTE': 'ARCA-QTD-O-001',
      'ORDEM_ANTIGUIDADE_EQUIPE': 'ARCA-ANTIGUIDADE-002',
      'AIS_AUSENTE': 'ARCA-TERRITORIO-001',
      'AIS_DIVERGENTE': 'ARCA-TERRITORIO-001',

      // Domínio: Munições
      'FATO_MUNICAO_AUSENTE': 'ARCA-MUNICOES-001',

      // Domínio: Numerário
      'FATO_NAO_AUDITAVEL_AUTOMATICAMENTE': 'ARCA-NUMERARIO-001',

      // Domínio: PIP / Pontuação
      'RATEIO_PONTOS_INCOERENTE': 'ARCA-PIP-001',
      'INDICADOR_DESCONHECIDO': 'ARCA-PIP-003',
      'MODO_LIMITADO_CATALOGO_PIP': 'ARCA-PIP-003',

      // Domínio: Ocorrência / Túnel
      'TUNEL_SEM_EQUIPE': 'ARCA-OCORRENCIA-003',
      'TUNEL_SEM_FATOS': 'ARCA-OCORRENCIA-004',
      'OCORRENCIA_ORFA': 'ARCA-OCORRENCIA-002',
      // #160 (GUARD-D7-001): identidade unitaria da ocorrencia — "1 ocorrencia = 1 MIKE".
      'OCORRENCIA_FRAGMENTADA_POR_DATA': 'ARCA-OCORRENCIA-007',
      'MIKE_FORMATO_NAO_CANONICO_OU_DUPLICADO': 'ARCA-OCORRENCIA-007',

      // Domínio: Mérito de Equipe por Armas / Antiguidade
      'MERITO_ARMAS_ANTIGUIDADE_AUSENTE': 'ARCA-MERITO-001',
      'MERITO_ARMAS_EMPATE_ANTIGUIDADE': 'ARCA-MERITO-002',
      'ANTIGUIDADE_FONTE_NAO_LOCALIZADA': 'ARCA-MERITO-003',

      // Domínio: MIKE
      'MIKE_DATA_DIVERGENTE': 'ARCA-MIKE-001',
      'MIKE_DATAS_DIVERGENTES': 'ARCA-MIKE-002',
      'MIKE_SUSPEITO': 'ARCA-MIKE-003',

      // Domínio: BOE
      'MIKE_BOE_DIVERGENTE': 'ARCA-BOE-001',
      'BOE_AUSENTE': 'ARCA-BOE-002',

      // Domínio: Imputação
      'EVENTO_INCOMPLETO_AG': 'ARCA-IMPUTACAO-001',
      'IMPUTADO_SEM_EVENTO_AH': 'ARCA-IMPUTACAO-001',
      'IMPUTADO_INVALIDO': 'ARCA-IMPUTACAO-001',

      // Domínio: Matrícula / Efetivo
      'MATRICULA_AUSENTE': 'ARCA-MATRICULA-002',

      // Técnicas / Fórmulas
      'FORMULA_CORROMPIDA_ERRO_SINTAXE': 'ARCA-TECNICA-001',
      'FORMULA_AUSENTE': 'ARCA-TECNICA-001',
      'EXCECAO_MANUAL_JUSTIFICADA': 'ARCA-TECNICA-002',

      // G01 (#126 ARCA-FIX-003): codigos antes sem regra ARCA (geravam LACUNA_ARCA)
      'TUNEL_FRAGMENTADO': 'ARCA-MIKE-004',
      'POLICIAL_SEM_NOME': 'ARCA-EFETIVO-003',
      'MATRICULA_MULTIPLAS_OCORRENCIAS_MESMA_DATA': 'ARCA-MATRICULA-003'
    });
  }

  /**
   * Instância singleton cacheada em memória (somente leitura).
   * Obs.: campos de classe (`static x = ...`) nao sao suportados pelo parser do
   * Apps Script - os valores sao inicializados apos a definicao da classe.
   */

  /**
   * Permite configurar um caminho customizado ou mock injetável (ex: para testes de fail-soft).
   */
  static configurarCaminho(caminho) {
    AdaptadorConsultaArca._caminhoCustomizado = caminho;
    AdaptadorConsultaArca._cacheArca = null;
  }

  /**
   * Reseta o cache interno para forçar recarregamento.
   */
  static limparCache() {
    AdaptadorConsultaArca._cacheArca = null;
  }

  /**
   * Carrega os dados da ARCA de forma totalmente fail-soft.
   * Se o arquivo não existir ou o JSON estiver corrompido, retorna null sem lançar exceção.
   * @returns {Object|null}
   */
  static carregarArca() {
    if (AdaptadorConsultaArca._cacheArca !== null) {
      return AdaptadorConsultaArca._cacheArca;
    }

    try {
      let arcaData = null;

      if (typeof require !== 'undefined') {
        const fs = require('fs');
        const path = require('path');

        let jsonPath = AdaptadorConsultaArca._caminhoCustomizado;
        if (!jsonPath) {
          jsonPath = path.join(__dirname, 'arca_regras_dominio.json');
        }

        if (fs.existsSync(jsonPath)) {
          const raw = fs.readFileSync(jsonPath, 'utf8');
          arcaData = JSON.parse(raw);
        }
      }

      if (arcaData && Array.isArray(arcaData.regras)) {
        const mapaRegras = {};
        arcaData.regras.forEach(r => {
          if (r && r.rule_id) {
            mapaRegras[r.rule_id] = Object.freeze(JSON.parse(JSON.stringify(r)));
          }
        });
        AdaptadorConsultaArca._cacheArca = Object.freeze({
          meta: Object.freeze(arcaData.meta || {}),
          regrasPorId: Object.freeze(mapaRegras)
        });
        return AdaptadorConsultaArca._cacheArca;
      }
    } catch (e) {
      // Fail-soft: silencioso em tempo de execução para não interromper varredura
    }

    return null;
  }

  /**
   * Consulta os metadados de uma regra da ARCA a partir de seu rule_id.
   * @param {string} ruleId - Identificador estável (ex: 'ARCA-PIP-001').
   * @returns {Object}
   */
  static consultarPorRuleId(ruleId) {
    const arca = AdaptadorConsultaArca.carregarArca();
    if (!arca) {
      return Object.freeze({
        status: 'ARCA_METADATA_UNAVAILABLE',
        rule_id: ruleId || null,
        mensagem: 'Metadados da ARCA indisponíveis no momento.'
      });
    }

    const regra = arca.regrasPorId[ruleId];
    if (!regra) {
      return Object.freeze({
        status: 'ARCA_RULE_NOT_MAPPED',
        rule_id: ruleId || null,
        mensagem: `Regra "${ruleId}" não catalogada na ARCA.`
      });
    }

    const isOfficial = (regra.tipo_regra === 'OFFICIAL_BUSINESS_RULE' && regra.fonte_status === 'CANONICAL_SOURCE_CONFIRMED');

    let fonteSummary = 'Fonte interna operacional';
    if (regra.fonte_status === 'CANONICAL_SOURCE_CONFIRMED' && regra.fontes && regra.fontes.length > 0) {
      fonteSummary = `${regra.fontes[0].nome} (${regra.fontes[0].tipo})`;
    } else if (regra.fonte_status === 'DOMAIN_RULE_SOURCE_UNKNOWN' || regra.tipo_regra === 'HEURISTIC') {
      fonteSummary = 'Fonte oficial não comprovada (Heurística / DOMAIN_RULE_SOURCE_UNKNOWN)';
    }

    return Object.freeze({
      status: 'MAPPED',
      rule_id: regra.rule_id,
      titulo: regra.titulo,
      subdominio: regra.subdominio,
      tipo_regra: regra.tipo_regra,
      fonte_status: regra.fonte_status,
      fonte_summary: fonteSummary,
      fontes: regra.fontes || [],
      confianca: regra.confianca || 'MEDIA',
      alcance: regra.alcance || 'LOCAL',
      is_official: isOfficial,
      expected_rule_summary: regra.descricao_humana || regra.resultado_esperado || '',
      condicao: regra.condicao || '',
      // Parametros de dominio declarados na regra (card #138: `titulo_pip` de ARCA-VEICULO-001 e consumido
      // pelo servidor do formulario via porta canonica). Campo aditivo: nao altera os campos existentes.
      parametros: regra.parametros || {},
      excecoes: regra.excecoes || []
    });
  }

  /**
   * Enriquece um diagnóstico existente com metadados canônicos da ARCA de forma explicável.
   * @param {string} codigoDiagnostico - Código do diagnóstico (ex: 'RATEIO_PONTOS_INCOERENTE').
   * @param {Object} [contexto] - Dados contextuais opcionais (evidência, ação recomendada).
   * @returns {Object} Estrutura explicável do enriquecimento.
   */
  static enriquecerDiagnostico(codigoDiagnostico, contexto = {}) {
    const mapa = AdaptadorConsultaArca.MAPA_DIAGNOSTICO_ARCA;
    const ruleId = mapa[codigoDiagnostico];

    if (!ruleId) {
      return Object.freeze({
        status: 'ARCA_RULE_NOT_MAPPED',
        diagnostic_code: codigoDiagnostico,
        rule_id: null,
        rule_type: null,
        source_status: null,
        source_summary: 'Regra sem mapeamento correspondente na ARCA',
        confidence: null,
        found_value: contexto.evidencia || null,
        expected_rule_summary: null,
        human_action: contexto.acaoRecomendada || null,
        is_official: false
      });
    }

    const meta = AdaptadorConsultaArca.consultarPorRuleId(ruleId);

    if (meta.status === 'ARCA_METADATA_UNAVAILABLE') {
      return Object.freeze({
        status: 'ARCA_METADATA_UNAVAILABLE',
        diagnostic_code: codigoDiagnostico,
        rule_id: ruleId,
        rule_type: null,
        source_status: null,
        source_summary: 'ARCA indisponível para consulta em runtime',
        confidence: null,
        found_value: contexto.evidencia || null,
        expected_rule_summary: null,
        human_action: contexto.acaoRecomendada || null,
        is_official: false
      });
    }

    return Object.freeze({
      status: 'ENRICHED',
      diagnostic_code: codigoDiagnostico,
      rule_id: meta.rule_id,
      titulo_regra: meta.titulo,
      subdominio: meta.subdominio,
      rule_type: meta.tipo_regra,
      source_status: meta.fonte_status,
      source_summary: meta.fonte_summary,
      confidence: meta.confianca,
      found_value: contexto.evidencia || null,
      expected_rule_summary: meta.expected_rule_summary,
      human_action: contexto.acaoRecomendada || null,
      is_official: meta.is_official,
      excecoes: meta.excecoes
    });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdaptadorConsultaArca;
}

// Inicializacao pos-classe (compativel com o parser do Apps Script, que rejeita campos de classe)
AdaptadorConsultaArca._cacheArca = null;
AdaptadorConsultaArca._caminhoCustomizado = null;
```

## Responsabilidade observada

Fonte: `02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO/submodulos/SUB-C03-02-04_ADAPTADOR_PORTA_DE_CONSULTA/NOTA_DE_RESPONSABILIDADE.md` — NOTA_DE_RESPONSABILIDADE.md do submodulo, "## Papel".

PORTA DE SAIDA read-only da ARCA: enriquecerDiagnostico(codigoRegra, contexto) devolve metadados (rule_id, fonte, tipo, excecoes, human_action). Mapeia 38 codigos -> 30 das 49 regras; codigo sem mapeamento retorna ARCA_RULE_NOT_MAPPED (o consumidor deve reportar LACUNA_ARCA, nunca assumir verde).

Fonte: `02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO/submodulos/SUB-C03-02-04_ADAPTADOR_PORTA_DE_CONSULTA/NOTA_DE_RESPONSABILIDADE.md` — NOTA_DE_RESPONSABILIDADE.md do submodulo, "## Limites".

- Nao altera diagnostico; nao decide severidade; nao fecha lacuna por omissao.
- Read-only sobre dados operacionais; nenhum acesso a planilha.

## Portas expostas (se aplicável)

- Superfície exposta no nível do arquivo (nível global): `AdaptadorConsultaArca`
- Membros públicos observados: `MAPA_DIAGNOSTICO_ARCA`, `configurarCaminho`, `limparCache`, `carregarArca`, `consultarPorRuleId`, `enriquecerDiagnostico`

_Extraído por heurística do gerador (globais de nível arquivo + métodos/accessors de 1º–2º nível). Não substitui a declaração de porta da Planta: confirme no endereço acima._

## Divergência com a Planta declarada

Testes mecânicos executados na geração (commit `fbb0608`, 2026-09-13T21:45:15-03:00):

- OK — T1 endereco existe: NOTA_DE_RESPONSABILIDADE.md do modulo presente
- OK — T1b endereco existe: NOTA_DE_RESPONSABILIDADE.md do submodulo presente
- OK — T2 artefato declarado no endereco: "Dominio/ARCA/AdaptadorConsultaArca.js" aparece na Planta
- OK — T3 arquivo presente no commit de referencia (fbb0608:Dominio/ARCA/AdaptadorConsultaArca.js)
- OK — T4 conteudo em disco identico ao do commit de referencia (sha256 LF)
- OK — T5 espelho anterior sem deriva de codigo (sha256 do bloco == origem)
- OK — T6 endereco declarado no espelho anterior corresponde ao endereco canonico atual
- OK — T7 sem duplicidade: exatamente 1 espelho de leitura declara "Dominio/ARCA/AdaptadorConsultaArca.js" como origem

Veredito mecânico: **nenhuma divergência detectada pelos testes acima**.

Declaração verificada a mão por humano/agente (não derivável automaticamente):

- **Como o endereco foi derivado (nao inventado):** tabela de artefatos; fonte `02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO/NOTA_DE_RESPONSABILIDADE.md`:27.
- **Enderecos concorrentes declarados na Planta (2):** `C03_Dominio/MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO`, `C05_Guardiao/MOD-C05-01_GUARDIAO_DE_QUALIDADE`. O artefato e referenciado em mais de um endereco; o campo acima registra o endereco PRIMARIO. Nao e erro de endereco — e declaracao concorrente na propria Planta.
- **Nada foi corrigido no artefato:** o gerador nao altera codigo de produto; o arquivo de origem permanece byte a byte como estava.

## Última verificação (data/commit)

- 2026-09-13T21:45:15-03:00 · commit `fbb0608` · sha256 da origem (LF): `99f8c7e2fb8a44e708aaff9490307d0a154c9897a3a6b512c4b0bbb1522a5338`
- Reexecutar: `node scripts/downplant/espelho-rico.mjs gerar --endereco C03_Dominio/MOD-C03-02_ARCA_DE_REGRAS_DE_DOMINIO/SUB-C03-02-04_ADAPTADOR_PORTA_DE_CONSULTA --origem Dominio/ARCA/AdaptadorConsultaArca.js --saida <caminho>`
- Verificar deriva sem regravar: `node scripts/downplant/espelho-rico.mjs verificar --espelho <caminho>`
