# ESPELHO — CoberturaAuditoria.js

> [!NOTE] Espelho rico de código (Metodo §46.15) — gerado por `scripts/downplant/espelho-rico.mjs`
> Somente leitura. Não editar à mão: qualquer edição é sobrescrita na próxima geração.
> O código abaixo é cópia verbatim do arquivo de origem no commit declarado; divergência entre o embutido e a origem é deriva (§18.1).
> Regra do sha256 declarado: sha256 do conteúdo **normalizado para LF** (igual ao blob do Git). Em arquivo CRLF com terminador final diferente, ele difere do `sha256sum` dos bytes crus — a comparação de deriva é feita conteúdo-contra-conteúdo.
> Papel desta cópia: CANÔNICA (repositório). O derivado navegável no vault é gerado com as mesmas entradas.

- **Endereço Down Plant:** `C05_Guardiao / MOD-C05-01_GUARDIAO_DE_QUALIDADE` — [NOTA_DE_RESPONSABILIDADE.md](../../02_Comodos/C05_Guardiao/01_Dominio/modulos/MOD-C05-01_GUARDIAO_DE_QUALIDADE/NOTA_DE_RESPONSABILIDADE.md)
- **Arquivo de origem (link para o disco):** [`Core/CoberturaAuditoria.js`](../../Core/CoberturaAuditoria.js)
- **Commit de referência:** `0049c30443c138cdaca525cdc55524aa11d39fce` (`0049c30`)
- **Data da última sincronização:** 2026-09-15T18:23:04-03:00

## Código-fonte embutido

Verbatim de `Core/CoberturaAuditoria.js` em `0049c30`. sha256 do bloco (LF): `9c28c7090df84c354c2dbfa52bbae7e933a1bdb32027b03d5e741ba9f823814e` — 113 linhas.

```javascript
/**
 * ARQUIVO: Core/CoberturaAuditoria.js
 * DESCRICAO: Cobertura de auditoria do Guardiao da Qualidade (G01 #115).
 * Nucleo 100% puro (sem APIs Apps Script). Resposta explicita para:
 * "o que o Guardiao NAO conseguiu verificar neste mes?".
 *
 * Postura anti-falso-verde: toda familia de regra que nao pôde ser avaliada
 * vira entrada em `regrasNaoAuditadas` com tipo LIMITACAO_DE_AUDITORIA e motivo.
 * Nenhuma heuristica e promovida a regra oficial (requisito #115-10).
 */

class CoberturaAuditoria {
  /**
   * Monta o relatorio de cobertura da varredura.
   * @param {Object} ctx
   *  - catalogoPIP: null quando a Tabela PIP/coluna de indicadores nao foi localizada
   *  - resPeculio: resultado do LeitorAntiguidadePeculio ({erro} quando indisponivel)
   *  - diagnosticos: todos os diagnosticos emitidos na varredura (com .arca)
   * @returns {{status:'COMPLETA'|'PARCIAL', regrasNaoAuditadas:Array}}
   */
  static montarCobertura(ctx) {
    const regrasNaoAuditadas = [];
    const catalogoPIP = ctx && ctx.catalogoPIP;
    const resPeculio = ctx && ctx.resPeculio;
    const diagnosticos = (ctx && ctx.diagnosticos) || [];

    // 1. Catalogo PIP indisponivel -> regras de indicador nao avaliadas
    if (!catalogoPIP || (Array.isArray(catalogoPIP) && catalogoPIP.length === 0)) {
      regrasNaoAuditadas.push({
        regra: 'VALIDACAO_INDICADOR_PIP',
        motivo: 'CATALOGO_PIP_INDISPONIVEL: aba Tabela PIP ou coluna de indicador nao localizada.',
        tipo: 'LIMITACAO_DE_AUDITORIA'
      });
    }

    // 2. Fonte de antiguidade (EFETIVO/PECULIO) indisponivel -> merito por armas nao avaliado
    if (resPeculio && resPeculio.erro) {
      regrasNaoAuditadas.push({
        regra: 'MERITO_ARMAS_ANTIGUIDADE',
        motivo: 'FONTE_ANTIGUIDADE_INDISPONIVEL: ' + resPeculio.erro,
        tipo: 'LIMITACAO_DE_AUDITORIA'
      });
    }

    // 3. Lacunas de ARCA: diagnostico emitido sem mapeamento ARCA
    // (codigos de verificabilidade sao reportados como limitacao nas regras 1/2 acima)
    const CODIGOS_VERIFICABILIDADE = new Set([
      'MODO_LIMITADO_CATALOGO_PIP',
      'FATO_NAO_AUDITAVEL_AUTOMATICAMENTE',
      'ANTIGUIDADE_FONTE_NAO_LOCALIZADA'
    ]);
    const semArca = Array.from(new Set(
      diagnosticos
        .filter(d => d && d.arca && d.arca.status === 'ARCA_RULE_NOT_MAPPED' && !CODIGOS_VERIFICABILIDADE.has(d.codigoRegra))
        .map(d => d.codigoRegra || '')
        .filter(Boolean)
    ));
    if (semArca.length > 0) {
      regrasNaoAuditadas.push({
        regra: 'METADADOS_ARCA',
        motivo: 'ARCA_RULE_NOT_MAPPED: diagnosticos sem mapeamento ARCA: ' + semArca.join(', '),
        tipo: 'LACUNA_ARCA'
      });
    }

    return {
      status: regrasNaoAuditadas.length === 0 ? 'COMPLETA' : 'PARCIAL',
      regrasNaoAuditadas
    };
  }

  /**
   * Detecta policial (matricula) vinculado a 2+ MIKEs na MESMA data.
   * Participacao em multiplas ocorrencias no mesmo dia exige confirmacao humana -> OBSERVACAO.
   * @param {Object} mapaMatriculas matricula -> {datas:Set(data), mikes:Set(mike), linhas:Array}
   * @param {Function} criarDiag injecao de RegrasQualidade.criarDiagnostico (ou construtor puro)
   * @returns {Array} diagnosticos OBSERVACAO
   */
  static detectarMatriculaMultiplaNaMesmaData(mapaMatriculas, criarDiag) {
    const diags = [];
    Object.keys(mapaMatriculas || {}).forEach(mat => {
      const info = mapaMatriculas[mat];
      const datasComMultiplosMikes = [];
      const porData = {};
      (info.linhas || []).forEach(l => {
        if (!porData[l.data]) porData[l.data] = new Set();
        porData[l.data].add(l.mike);
      });
      Object.keys(porData).forEach(data => {
        if (porData[data].size > 1) {
          datasComMultiplosMikes.push({ data, mikes: Array.from(porData[data]) });
        }
      });
      datasComMultiplosMikes.forEach(oc => {
        diags.push(criarDiag({
          severidade: 'OBSERVACAO',
          codigoRegra: 'MATRICULA_MULTIPLAS_OCORRENCIAS_MESMA_DATA',
          camada: 'SEMANTICA',
          linha: (info.linhas || []).find(l => l.data === oc.data) ? info.linhas.find(l => l.data === oc.data).linha : 2,
          tunel: '',
          diagnostico: `Matricula ${mat} vinculada a mais de um MIKE na mesma data (${oc.data}).`,
          evidencia: `Matricula: ${mat} | MIKEs na data: ${oc.mikes.join(', ')}`,
          acaoRecomendada: 'Confirme se o policial participou de mais de uma ocorrência no mesmo dia ou se houve erro de preenchimento.'
        }));
      });
    });
    return diags;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CoberturaAuditoria };
}
```

## Responsabilidade observada

Fonte: `02_Comodos/C05_Guardiao/01_Dominio/modulos/MOD-C05-01_GUARDIAO_DE_QUALIDADE/MOD-C05-01_GUARDIAO_DE_QUALIDADE.md` — CAPSULA do modulo (formato 46.2), "## Responsabilidade".

Fazer a **varredura estatica de integridade** das abas mensais: detectar, classificar e explicar incoerencias
com diagnosticos estruturados, **sem alterar dado operacional**, e publicar o resultado nas abas
`[AUDITORIA] Ocorrencias` e `[HISTORICO] Auditoria Ocorrencias`. E quem **audita**, nao quem corrige.

Fonte: `02_Comodos/C05_Guardiao/01_Dominio/modulos/MOD-C05-01_GUARDIAO_DE_QUALIDADE/MOD-C05-01_GUARDIAO_DE_QUALIDADE.md` — CAPSULA do modulo (formato 46.2), "## Limites".

- **Nao altera dado operacional** - nem colunas A:AL, nem formula: somente leitura + escrita nas abas de auditoria
  e no destaque da coluna **AM** (39).
- **Nao corrige:** corrigir e do modulo irmao `MOD-C05-02_NORMALIZADOR_DE_ABA` (via plano explicito).
- **Nao promove heuristica a regra:** o que a ARCA nao mapeia aparece como `NAO_AUDITAVEL`, nao como lei.
- **Nao se audita** (Governanca fora da propria auditoria) e a auditoria e **fail-closed** - nao passa sem.

## Portas expostas (se aplicável)

- Superfície exposta no nível do arquivo (nível global): `CoberturaAuditoria`
- Membros públicos observados: `montarCobertura`, `detectarMatriculaMultiplaNaMesmaData`

_Extraído por heurística do gerador (globais de nível arquivo + métodos/accessors de 1º–2º nível). Não substitui a declaração de porta da Planta: confirme no endereço acima._

## Divergência com a Planta declarada

Testes mecânicos executados na geração (commit `0049c30`, 2026-09-15T18:23:04-03:00):

- OK — T1 endereco existe: NOTA_DE_RESPONSABILIDADE.md do modulo presente
- OK — T2 artefato declarado no endereco: "Core/CoberturaAuditoria.js" aparece na Planta
- OK — T3 arquivo presente no commit de referencia (0049c30:Core/CoberturaAuditoria.js)
- OK — T4 conteudo em disco identico ao do commit de referencia (sha256 LF)

Veredito mecânico: **nenhuma divergência detectada pelos testes acima**.

## Última verificação (data/commit)

- 2026-09-15T18:23:04-03:00 · commit `0049c30` · sha256 da origem (LF): `9c28c7090df84c354c2dbfa52bbae7e933a1bdb32027b03d5e741ba9f823814e`
- Reexecutar: `node scripts/downplant/espelho-rico.mjs gerar --endereco C05_Guardiao/MOD-C05-01_GUARDIAO_DE_QUALIDADE --origem Core/CoberturaAuditoria.js --saida <caminho>`
- Verificar deriva sem regravar: `node scripts/downplant/espelho-rico.mjs verificar --espelho <caminho>`
