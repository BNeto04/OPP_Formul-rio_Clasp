# ESPELHO — SaudeTuneis.js

> [!NOTE] Espelho rico de código (Metodo §46.15) — gerado por `scripts/downplant/espelho-rico.mjs`
> Somente leitura. Não editar à mão: qualquer edição é sobrescrita na próxima geração.
> O código abaixo é cópia verbatim do arquivo de origem no commit declarado; divergência entre o embutido e a origem é deriva (§18.1).
> Regra do sha256 declarado: sha256 do conteúdo **normalizado para LF** (igual ao blob do Git). Em arquivo CRLF com terminador final diferente, ele difere do `sha256sum` dos bytes crus — a comparação de deriva é feita conteúdo-contra-conteúdo.
> Papel desta cópia: CANÔNICA (repositório). O derivado navegável no vault é gerado com as mesmas entradas.

- **Endereço Down Plant:** `C05_Guardiao / MOD-C05-01_GUARDIAO_DE_QUALIDADE` — [NOTA_DE_RESPONSABILIDADE.md](../../02_Comodos/C05_Guardiao/01_Dominio/modulos/MOD-C05-01_GUARDIAO_DE_QUALIDADE/NOTA_DE_RESPONSABILIDADE.md)
- **Arquivo de origem (link para o disco):** [`Core/SaudeTuneis.js`](../../Core/SaudeTuneis.js)
- **Commit de referência:** `0049c30443c138cdaca525cdc55524aa11d39fce` (`0049c30`)
- **Data da última sincronização:** 2026-09-15T18:23:05-03:00

## Código-fonte embutido

Verbatim de `Core/SaudeTuneis.js` em `0049c30`. sha256 do bloco (LF): `63b352eff05edc61f51181c62ddbf59db1711c6ade8752cec13b083c67c26d93` — 198 linhas.

```javascript
/**
 * ARQUIVO: Core/SaudeTuneis.js
 * DESCRICAO: Quadro de saude por tunel/MIKE do Guardiao da Qualidade (G01 #114).
 * Núcleo 100% puro (sem APIs Apps Script), consome somente estruturas canonicas:
 * tuneis/mikesMapa/diagnosticos produzidos pelo motor GuardiaoQualidade.varrerAba.
 *
 * Classificacao (precedencia, sem inventar regra):
 *   CRITICO      -> existe diagnostico CRITICO no tunel (ex.: TUNEL_SEM_EQUIPE, MERITO_ARMAS_*).
 *   ALERTA       -> diagnostico ALERTA ou EXCECAO_MANUAL no tunel
 *                   (excecao manual justificada exige atencao humana e nunca e "verde limpo").
 *   INCOMPLETO   -> estrutura incompleta: TUNEL_SEM_FATOS / statusClassificacao VAZIO
 *                   ou INVALIDO_SEM_FATOS (equipe sem fato ou MIKE sem conteudo).
 *   NAO_AUDITAVEL-> so ha OBSERVACAO de verificabilidade (numerario sem valor,
 *                   fonte de antiguidade nao localizada, catalogo PIP em modo limitado)
 *                   ou observacao generica (indicador desconhecido): nao da para afirmar verde.
 *   SAUDAVEL     -> VALIDO e zero diagnosticos.
 *
 * Deteccoes estruturais:
 *   - Orfao: ocorrencia/linha com conteudo sem MIKE (diag OCORRENCIA_ORFA ja emitido pelo motor).
 *   - Duplicado: mesmo MIKE com BOEs ou datas divergentes (diags MIKE_BOE_DIVERGENTE /
 *     MIKE_DATAS_DIVERGENTES ja emitidos pelo motor) -> sumarizado aqui.
 *   - Fragmentado: mesmo MIKE com datas e BOE unicos, mas espalhado em mais de uma chave de tunel
 *     (ex.: formato de data Date vs String - risco documentado em ARCA_REGRAS_DOMINIO.md).
 *
 * Regra do produto mantida: o Guardiao NAO corrige dados; detecta, explica e localiza.
 */

const CODIGOS_NAO_AUDITAVEL = new Set([
  'FATO_NAO_AUDITAVEL_AUTOMATICAMENTE',
  'ANTIGUIDADE_FONTE_NAO_LOCALIZADA',
  'MODO_LIMITADO_CATALOGO_PIP'
]);

const SEVERIDADES_REF = {
  ERRO_TECNICO: 'ERRO TECNICO',
  CRITICO: 'CRITICO',
  ALERTA: 'ALERTA',
  OBSERVACAO: 'OBSERVACAO',
  EXCECAO_MANUAL: 'EXCECAO MANUAL'
};

class SaudeTuneis {
  /** Separa diagnosticos por chave de tunel. Diagnosticos sem tunel ficam em '' (orfas de ocorrencia). */
  static diagnosticosPorTunel(diagnosticos) {
    const mapa = {};
    (diagnosticos || []).forEach(d => {
      const chave = (d && d.tunel) || '';
      if (!mapa[chave]) mapa[chave] = [];
      mapa[chave].push(d);
    });
    return mapa;
  }

  static temSeveridade(diags, sev) {
    return (diags || []).some(d => (d.severidade || '') === sev);
  }

  static temCodigo(diags, codigo) {
    return (diags || []).some(d => (d.codigoRegra || '') === codigo);
  }

  /**
   * Classifica UM tunel nos 5 estados de saude.
   * @returns {{classificacao:string, motivo:string, codigos:Array<string>, linhas:Array<number>}}
   */
  static classificarTunel(tunel, diagsDoTunel) {
    const diags = diagsDoTunel || [];
    const codigos = Array.from(new Set(diags.map(d => d.codigoRegra || '').filter(Boolean)));
    const linhas = Array.from(new Set(
      diags.map(d => d.linha).filter(l => l && l >= 2)
        .concat((tunel.linhasFatos || []).map(lf => lf.linha))
    )).sort((a, b) => a - b);
    const statusEstrutural = tunel && tunel.statusClassificacao;

    const base = { codigos, linhas };

    // 1. CRITICO domina tudo
    if (SaudeTuneis.temSeveridade(diags, SEVERIDADES_REF.CRITICO)) {
      return Object.assign(base, { classificacao: 'CRITICO', motivo: 'DIAGNOSTICO_CRITICO_NO_TUNEL' });
    }

    // 2. Estrutural incompleto (sem fatos / vazio) tem precedencia sobre ALERTA generico do mesmo tunel
    if (statusEstrutural === 'INVALIDO_SEM_FATOS' || statusEstrutural === 'VAZIO' ||
        SaudeTuneis.temCodigo(diags, 'TUNEL_SEM_FATOS')) {
      return Object.assign(base, { classificacao: 'INCOMPLETO', motivo: 'TUNEL_SEM_FATOS_OU_VAZIO' });
    }

    // 3. ALERTA / EXCECAO_MANUAL
    if (SaudeTuneis.temSeveridade(diags, SEVERIDADES_REF.ALERTA) ||
        SaudeTuneis.temSeveridade(diags, SEVERIDADES_REF.EXCECAO_MANUAL)) {
      return Object.assign(base, { classificacao: 'ALERTA', motivo: 'DIAGNOSTICO_ALERTA_OU_EXCECAO' });
    }

    // 4. Nao auditavel: observacoes de verificabilidade (ou genericas) -> nunca falso verde
    if (diags.length > 0 && SaudeTuneis.temSeveridade(diags, SEVERIDADES_REF.OBSERVACAO)) {
      return Object.assign(base, { classificacao: 'NAO_AUDITAVEL', motivo: 'OBSERVACAO_SEM_VERIFICACAO_COMPLETA' });
    }

    // 5. Saudavel
    if (diags.length === 0 && statusEstrutural === 'VALIDO') {
      return Object.assign(base, { classificacao: 'SAUDAVEL', motivo: 'INTEGRIDADE_OK' });
    }

    // Caso residual (ex.: tunel sem nenhuma informacao acumulada) -> incompleto, nunca verde
    return Object.assign(base, { classificacao: 'INCOMPLETO', motivo: 'SEM_INFORMACAO_SUFICIENTE' });
  }

  /**
   * Detecta tuneis fragmentados: mesmo MIKE com BOE e data unicos, porem >1 chave de tunel.
   * Causa tipica: representacao de data inconsistente (Date vs String) fragmentando a chave.
   * @returns {Array<{mike:string, chaves:Array<string>, linhas:Array<number>}>}
   */
  static detectarFragmentados(mikesMapa) {
    const fragmentados = [];
    Object.values(mikesMapa || {}).forEach(entry => {
      if (!entry || !entry.mike) return;
      const chaves = Array.from(new Set((entry.linhas || []).map(l => l.chave).filter(Boolean)));
      if (chaves.length > 1 && entry.boes.size <= 1 && entry.datas.size <= 1) {
        fragmentados.push({
          mike: entry.mike,
          chaves,
          linhas: (entry.linhas || []).map(l => l.linha).sort((a, b) => a - b)
        });
      }
    });
    return fragmentados;
  }

  /** Sumariza tuneis duplicados (MIKE com BOEs/datas divergentes) para o quadro. */
  static detectarDuplicados(mikesMapa) {
    const duplicados = [];
    Object.values(mikesMapa || {}).forEach(entry => {
      if (!entry || !entry.mike) return;
      const tipos = [];
      if (entry.boes && entry.boes.size > 1) tipos.push('BOE');
      if (entry.datas && entry.datas.size > 1) tipos.push('DATA');
      if (tipos.length) {
        duplicados.push({
          mike: entry.mike,
          tipo: tipos.join('_'),
          boes: entry.boes ? Array.from(entry.boes) : [],
          datas: entry.datas ? Array.from(entry.datas) : [],
          linhas: (entry.linhas || []).map(l => l.linha).sort((a, b) => a - b)
        });
      }
    });
    return duplicados;
  }

  /** Conta ocorrencias orfas (linha com conteudo sem MIKE) a partir dos diagnosticos. */
  static contarOcorrenciasOrfas(diagnosticos) {
    return (diagnosticos || []).filter(d => d.codigoRegra === 'OCORRENCIA_ORFA').length;
  }

  /**
   * Monta o quadro completo de saude de uma varredura.
   * @param {Object} tuneis mapa chave->tunel
   * @param {Object} mikesMapa mapa mike->{...}
   * @param {Array} diagnosticos todos os diagnosticos da varredura (ja com tunel/linha)
   * @returns {{tuneis:Array, contagem:Object, orfaos:Object, duplicados:Array, fragmentados:Array}}
   */
  static montarQuadroSaude(tuneis, mikesMapa, diagnosticos) {
    const porTunelDiags = SaudeTuneis.diagnosticosPorTunel(diagnosticos);
    const tuneisLista = [];
    Object.keys(tuneis || {}).forEach(chave => {
      const tunel = tuneis[chave];
      const cls = SaudeTuneis.classificarTunel(tunel, porTunelDiags[chave] || []);
      tuneisLista.push(Object.assign({
        chave,
        mike: tunel.chave ? String(tunel.chave).split('|')[1] || '' : '',
        statusEstrutural: tunel.statusClassificacao || null,
        fatos: tunel.fatos || null,
        equipe: tunel.matriculas ? tunel.matriculas.size : 0
      }, cls));
    });

    const contagem = {
      total: tuneisLista.length,
      saudaveis: tuneisLista.filter(t => t.classificacao === 'SAUDAVEL').length,
      alertas: tuneisLista.filter(t => t.classificacao === 'ALERTA').length,
      criticos: tuneisLista.filter(t => t.classificacao === 'CRITICO').length,
      incompletos: tuneisLista.filter(t => t.classificacao === 'INCOMPLETO').length,
      naoAuditaveis: tuneisLista.filter(t => t.classificacao === 'NAO_AUDITAVEL').length
    };

    return {
      tuneis: tuneisLista,
      contagem,
      orfaos: { ocorrenciasSemMike: SaudeTuneis.contarOcorrenciasOrfas(diagnosticos) },
      duplicados: SaudeTuneis.detectarDuplicados(mikesMapa),
      fragmentados: SaudeTuneis.detectarFragmentados(mikesMapa)
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SaudeTuneis, SEVERIDADES_REF };
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

- Superfície exposta no nível do arquivo (nível global): `SaudeTuneis`, `SEVERIDADES_REF`
- Membros públicos observados: `diagnosticosPorTunel`, `temSeveridade`, `temCodigo`, `classificarTunel`, `detectarFragmentados`, `detectarDuplicados`, `contarOcorrenciasOrfas`, `montarQuadroSaude`

_Extraído por heurística do gerador (globais de nível arquivo + métodos/accessors de 1º–2º nível). Não substitui a declaração de porta da Planta: confirme no endereço acima._

## Divergência com a Planta declarada

Testes mecânicos executados na geração (commit `0049c30`, 2026-09-15T18:23:05-03:00):

- OK — T1 endereco existe: NOTA_DE_RESPONSABILIDADE.md do modulo presente
- OK — T2 artefato declarado no endereco: "Core/SaudeTuneis.js" aparece na Planta
- OK — T3 arquivo presente no commit de referencia (0049c30:Core/SaudeTuneis.js)
- OK — T4 conteudo em disco identico ao do commit de referencia (sha256 LF)

Veredito mecânico: **nenhuma divergência detectada pelos testes acima**.

## Última verificação (data/commit)

- 2026-09-15T18:23:05-03:00 · commit `0049c30` · sha256 da origem (LF): `63b352eff05edc61f51181c62ddbf59db1711c6ade8752cec13b083c67c26d93`
- Reexecutar: `node scripts/downplant/espelho-rico.mjs gerar --endereco C05_Guardiao/MOD-C05-01_GUARDIAO_DE_QUALIDADE --origem Core/SaudeTuneis.js --saida <caminho>`
- Verificar deriva sem regravar: `node scripts/downplant/espelho-rico.mjs verificar --espelho <caminho>`
