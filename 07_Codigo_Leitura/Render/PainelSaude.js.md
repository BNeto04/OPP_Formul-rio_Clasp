# ESPELHO — PainelSaude.js

> [!NOTE] Espelho rico de código (Metodo §46.15) — gerado por `scripts/downplant/espelho-rico.mjs`
> Somente leitura. Não editar à mão: qualquer edição é sobrescrita na próxima geração.
> O código abaixo é cópia verbatim do arquivo de origem no commit declarado; divergência entre o embutido e a origem é deriva (§18.1).
> Regra do sha256 declarado: sha256 do conteúdo **normalizado para LF** (igual ao blob do Git). Em arquivo CRLF com terminador final diferente, ele difere do `sha256sum` dos bytes crus — a comparação de deriva é feita conteúdo-contra-conteúdo.
> Papel desta cópia: CANÔNICA (repositório). O derivado navegável no vault é gerado com as mesmas entradas.

- **Endereço Down Plant:** `C05_Guardiao / MOD-C05-01_GUARDIAO_DE_QUALIDADE` — [NOTA_DE_RESPONSABILIDADE.md](../../02_Comodos/C05_Guardiao/01_Dominio/modulos/MOD-C05-01_GUARDIAO_DE_QUALIDADE/NOTA_DE_RESPONSABILIDADE.md)
- **Arquivo de origem (link para o disco):** [`Render/PainelSaude.js`](../../Render/PainelSaude.js)
- **Commit de referência:** `0049c30443c138cdaca525cdc55524aa11d39fce` (`0049c30`)
- **Data da última sincronização:** 2026-09-15T18:23:05-03:00

## Código-fonte embutido

Verbatim de `Render/PainelSaude.js` em `0049c30`. sha256 do bloco (LF): `b5acf71e4f07ea17c7a6ca2d8fecc9edcae39b08cabfe985ef9125e731ede4f9` — 122 linhas.

```javascript
/**
 * ARQUIVO: Render/PainelSaude.js
 * DESCRICAO: Painel de saude + drill-down do Guardiao da Qualidade (G01 #116).
 * Núcleo 100% puro de MONTAGEM de dados/texto (o desenho na planilha continua no
 * RendererAuditoriaSaude e nos avisos de UI do SeletorMesesGuardiao).
 *
 * Hierarquia do drill-down: MES -> TUNEL/MIKE -> LINHAS -> DIAGNOSTICO
 * (codigo, severidade, explicacao humana, metadados ARCA e acao recomendada).
 */

class PainelSaude {
  static severidadePeso(sev) {
    return ({ 'CRITICO': 5, 'ERRO TECNICO': 6, 'EXCECAO MANUAL': 4, 'ALERTA': 3, 'OBSERVACAO': 1 })[sev] || 2;
  }

  /** Resumo de UM mes a partir do retorno de GuardiaoQualidade.varrerAba. */
  static construirResumoMes(nomeMes, resultado) {
    const saude = (resultado && resultado.saude) || null;
    const contagem = (saude && saude.contagem) || { total: 0, saudaveis: 0, alertas: 0, criticos: 0, incompletos: 0, naoAuditaveis: 0 };
    const cobertura = (resultado && resultado.cobertura) || { status: 'INDISPONIVEL', regrasNaoAuditadas: [] };
    return {
      mes: nomeMes,
      tuneisTotal: contagem.total,
      saudaveis: contagem.saudaveis,
      alertas: contagem.alertas,
      criticos: contagem.criticos,
      incompletos: contagem.incompletos,
      naoAuditaveis: contagem.naoAuditaveis,
      linhas: (resultado && resultado.linhas) || 0,
      ocorrenciasOrfas: (saude && saude.orfaos && saude.orfaos.ocorrenciasSemMike) || 0,
      duplicados: (saude && saude.duplicados) ? saude.duplicados.length : 0,
      fragmentados: (saude && saude.fragmentados) ? saude.fragmentados.length : 0,
      coberturaStatus: cobertura.status,
      regrasNaoAuditadas: (cobertura.regrasNaoAuditadas || []).map(r => r.regra)
    };
  }

  /** Resumo global (varios meses) somando os resumos por mes. */
  static construirResumoGlobal(resumosPorMes) {
    const lista = resumosPorMes || [];
    const total = {
      meses: lista.length,
      tuneisTotal: 0, saudaveis: 0, alertas: 0, criticos: 0, incompletos: 0, naoAuditaveis: 0,
      linhas: 0, ocorrenciasOrfas: 0, duplicados: 0, fragmentados: 0
    };
    const mesesNaoAuditados = [];
    lista.forEach(r => {
      total.tuneisTotal += r.tuneisTotal;
      total.saudaveis += r.saudaveis;
      total.alertas += r.alertas;
      total.criticos += r.criticos;
      total.incompletos += r.incompletos;
      total.naoAuditaveis += r.naoAuditaveis;
      total.linhas += r.linhas;
      total.ocorrenciasOrfas += r.ocorrenciasOrfas;
      total.duplicados += r.duplicados;
      total.fragmentados += r.fragmentados;
      if (r.coberturaStatus && r.coberturaStatus !== 'COMPLETA') mesesNaoAuditados.push(r.mes);
    });
    return { total, mesesNaoAuditados };
  }

  /**
   * Drill-down: MES -> TUNEL/MIKE -> LINHAS -> DIAGNOSTICO.
   * @returns {Array<{mes, tunel, mike, classificacao, motivo, linhas, diagnosticos:Array}>}
   */
  static construirDrillDown(nomeMes, resultado) {
    const saude = (resultado && resultado.saude) || null;
    if (!saude || !Array.isArray(saude.tuneis)) return [];
    const diags = (resultado && resultado.diagnosticos) || [];
    return saude.tuneis.map(t => {
      const diagsTunel = diags.filter(d => (d.tunel || '') === t.chave)
        .sort((a, b) => PainelSaude.severidadePeso(b.severidade) - PainelSaude.severidadePeso(a.severidade));
      return {
        mes: nomeMes,
        tunel: t.chave,
        mike: t.mike || '',
        classificacao: t.classificacao,
        motivo: t.motivo,
        linhas: t.linhas || [],
        diagnosticos: diagsTunel.map(d => ({
          codigo: d.codigoRegra || '',
          severidade: d.severidade || '',
          linha: d.linha || 0,
          explicacao: d.diagnostico || '',
          evidencia: d.evidencia || '',
          acao: d.acaoRecomendada || d.sugestaoCorrecao || '',
          arca: (d.arca && (d.arca.id || d.arca.codigo || d.arca.status)) || null
        }))
      };
    });
  }

  /** Tuneis que exigem acao, na ordem CRITICO -> ALERTA -> NAO_AUDITAVEL -> INCOMPLETO. */
  static listarTuneisPrioritarios(drillDown, limite = 10) {
    const peso = { 'CRITICO': 0, 'ALERTA': 1, 'NAO_AUDITAVEL': 2, 'INCOMPLETO': 3, 'SAUDAVEL': 4 };
    return (drillDown || [])
      .slice()
      .sort((a, b) => (peso[a.classificacao] - peso[b.classificacao]) || (a.mes < b.mes ? -1 : 1))
      .filter(t => t.classificacao !== 'SAUDAVEL')
      .slice(0, limite);
  }

  /** Texto consolidado para o dialogo de UI (mensal + global + limitacoes). */
  static formatarPainelTexto(resumosPorMes, global) {
    const linhas = (resumosPorMes || []).map(r => {
      const flag = r.coberturaStatus === 'COMPLETA' ? '' : ` | NAO_AUDITADO: ${r.regrasNaoAuditadas.join(', ') || r.coberturaStatus}`;
      return `${r.mes}: tuneis ${r.tuneisTotal} | saudaveis ${r.saudaveis} | alerta ${r.alertas} | critico ${r.criticos} | incompleto ${r.incompletos} | nao auditavel ${r.naoAuditaveis} | orfaos ${r.ocorrenciasOrfas}${flag}`;
    });
    const g = (global && global.total) || {};
    linhas.push('');
    linhas.push(`TOTAL GERAL: ${g.meses || 0} mes(es) | tuneis ${g.tuneisTotal || 0} | saudaveis ${g.saudaveis || 0} | alerta ${g.alertas || 0} | critico ${g.criticos || 0} | incompleto ${g.incompletos || 0} | nao auditavel ${g.naoAuditaveis || 0}`);
    if (global && global.mesesNaoAuditados && global.mesesNaoAuditados.length) {
      linhas.push(`MESES COM COBERTURA PARCIAL (NAO_AUDITADO): ${global.mesesNaoAuditados.join(', ')}`);
    }
    return linhas.join('\n');
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PainelSaude };
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

- Superfície exposta no nível do arquivo (nível global): `PainelSaude`
- Membros públicos observados: `severidadePeso`, `construirResumoMes`, `construirResumoGlobal`, `construirDrillDown`, `listarTuneisPrioritarios`, `formatarPainelTexto`

_Extraído por heurística do gerador (globais de nível arquivo + métodos/accessors de 1º–2º nível). Não substitui a declaração de porta da Planta: confirme no endereço acima._

## Divergência com a Planta declarada

Testes mecânicos executados na geração (commit `0049c30`, 2026-09-15T18:23:05-03:00):

- OK — T1 endereco existe: NOTA_DE_RESPONSABILIDADE.md do modulo presente
- OK — T2 artefato declarado no endereco: "Render/PainelSaude.js" aparece na Planta
- OK — T3 arquivo presente no commit de referencia (0049c30:Render/PainelSaude.js)
- OK — T4 conteudo em disco identico ao do commit de referencia (sha256 LF)

Veredito mecânico: **nenhuma divergência detectada pelos testes acima**.

## Última verificação (data/commit)

- 2026-09-15T18:23:05-03:00 · commit `0049c30` · sha256 da origem (LF): `b5acf71e4f07ea17c7a6ca2d8fecc9edcae39b08cabfe985ef9125e731ede4f9`
- Reexecutar: `node scripts/downplant/espelho-rico.mjs gerar --endereco C05_Guardiao/MOD-C05-01_GUARDIAO_DE_QUALIDADE --origem Render/PainelSaude.js --saida <caminho>`
- Verificar deriva sem regravar: `node scripts/downplant/espelho-rico.mjs verificar --espelho <caminho>`
