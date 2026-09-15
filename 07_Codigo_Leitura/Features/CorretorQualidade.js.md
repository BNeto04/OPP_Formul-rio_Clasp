# ESPELHO — CorretorQualidade.js

> [!NOTE] Espelho rico de código (Metodo §46.15) — gerado por `scripts/downplant/espelho-rico.mjs`
> Somente leitura. Não editar à mão: qualquer edição é sobrescrita na próxima geração.
> O código abaixo é cópia verbatim do arquivo de origem no commit declarado; divergência entre o embutido e a origem é deriva (§18.1).
> Regra do sha256 declarado: sha256 do conteúdo **normalizado para LF** (igual ao blob do Git). Em arquivo CRLF com terminador final diferente, ele difere do `sha256sum` dos bytes crus — a comparação de deriva é feita conteúdo-contra-conteúdo.
> Papel desta cópia: CANÔNICA (repositório). O derivado navegável no vault é gerado com as mesmas entradas.

- **Endereço Down Plant:** `C05_Guardiao / MOD-C05-01_GUARDIAO_DE_QUALIDADE` — [NOTA_DE_RESPONSABILIDADE.md](../../02_Comodos/C05_Guardiao/01_Dominio/modulos/MOD-C05-01_GUARDIAO_DE_QUALIDADE/NOTA_DE_RESPONSABILIDADE.md)
- **Arquivo de origem (link para o disco):** [`Features/CorretorQualidade.js`](../../Features/CorretorQualidade.js)
- **Commit de referência:** `0049c30443c138cdaca525cdc55524aa11d39fce` (`0049c30`)
- **Data da última sincronização:** 2026-09-15T18:23:06-03:00

## Código-fonte embutido

Verbatim de `Features/CorretorQualidade.js` em `0049c30`. sha256 do bloco (LF): `d734230f35004320735ea7a72029ea0be1cabfee07802838e7bf5f02f96cf9d6` — 232 linhas.

```javascript
/**
 * ARQUIVO: Features/CorretorQualidade.js
 * DESCRICAO: Corretor de qualidade — restaura as formulas das colunas calculadas
 * das abas mensais (PELOTAO, GRAD, MATRICULA, TOTAIS de droga, PONTOS, CHAVE).
 *
 * Motivo: os BOs antigos foram gravados com VALOR ESTATICO nas colunas calculadas
 * (que deveriam ser formula). O Guardiao detecta isso como FORMULA_AUSENTE (68% do
 * passivo). Este corretor clona a formula de uma linha valida da propria aba e a
 * replica (via R1C1, preservando referencias relativas) nas celulas sem formula.
 *
 * Regras de seguranca (nenhum "buraco"):
 *  - nao toca a linha 1 (cabecalho);
 *  - nao sobrescreve celula que JA tem formula;
 *  - respeita nota de celula iniciada por "EXCECAO:" (excecao manual justificada);
 *  - nao usa como fonte uma formula com erro (#REF!, #N/A, etc.);
 *  - se a coluna nao tem nenhuma linha com formula valida, NAO inventa: reporta.
 *
 * Entradas:
 *  - corrigirFormulasAbaAtual()        -> menu (aba ativa)
 *  - corrigirFormulasAbaHeadless(nome) -> clasp run (uma aba por vez)
 */

var CorretorQualidade = {
  ERROS_PLANILHA: ['#NOME?', '#NAME?', '#REF!', '#VALOR!', '#VALUE!', '#N/D', '#N/A', '#DIV/0!', '#NULL!', '#ERRO!', '#ERROR!'],

  /**
   * Localiza as colunas calculadas usando as MESMAS regras do Guardiao.
   * @param {Sheet} sheet
   * @returns {Array<{nome:string, indice:number}>} indice ZERO-based
   */
  localizarColunas: function (sheet) {
    const headersRaw = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const headers = headersRaw.map(function (h) {
      return (typeof SyntheonUtils !== 'undefined') ? SyntheonUtils.normalizarTexto(h) : String(h).toUpperCase().trim();
    });
    if (typeof RegrasQualidade !== 'undefined' && typeof RegrasQualidade.localizarColunasCalculadas === 'function') {
      return RegrasQualidade.localizarColunasCalculadas(headers);
    }
    return [];
  },

  temErro: function (formula) {
    const f = String(formula || '').toUpperCase();
    return this.ERROS_PLANILHA.some(function (e) { return f.indexOf(e) !== -1; });
  },

  /** Valor de celula e um erro de planilha (#REF!, #N/A, etc.) — comparacao exata. */
  ehErroValor: function (valor) {
    const v = String(valor || '').trim().toUpperCase();
    return this.ERROS_PLANILHA.indexOf(v) !== -1;
  },

  /**
   * Nucleo: restaura as formulas das colunas calculadas em uma aba.
   * @param {Sheet} sheet
   * @returns {{aba:string, colunas:Array, corrigidas:number, naoCorrigidas:Array}}
   */
  corrigirFormulasAba: function (sheet, opcoes) {
    const self = this;
    const dryRun = !!(opcoes && opcoes.dryRun);

    const headersRaw = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const headers = headersRaw.map(function (h) {
      return (typeof SyntheonUtils !== 'undefined') ? SyntheonUtils.normalizarTexto(h) : String(h).toUpperCase().trim();
    });
    const colunas = (typeof RegrasQualidade !== 'undefined' && typeof RegrasQualidade.localizarColunasCalculadas === 'function')
      ? RegrasQualidade.localizarColunasCalculadas(headers)
      : [];
    const idxPolicial = (typeof RegrasQualidade !== 'undefined' && typeof RegrasQualidade.localizarPorAliases === 'function')
      ? RegrasQualidade.localizarPorAliases(headers, ['POLICIAL', 'POLICIAL (CHAVE DO EFETIVO)'])
      : -1;

    const ultimaLinha = Math.max(sheet.getLastRow(), 1);
    const ultimaCol = Math.max(sheet.getLastColumn(), 1);
    const nomeAba = (typeof sheet.getName === 'function') ? sheet.getName() : '';

    const resumo = { aba: nomeAba, colunas: [], corrigidas: 0, naoCorrigidas: [] };
    if (ultimaLinha < 2 || colunas.length === 0) {
      return resumo;
    }

    // Nomes do EFETIVO (para NAO apagar dados de policiais legados nas colunas VLOOKUP).
    let nomesEfetivo = null;
    try {
      const parent = (typeof sheet.getParent === 'function') ? sheet.getParent() : null;
      const efetivo = (parent && typeof parent.getSheetByName === 'function') ? parent.getSheetByName('EFETIVO') : null;
      if (efetivo && efetivo.getLastRow() > 1) {
        nomesEfetivo = new Set();
        efetivo.getRange(2, 1, efetivo.getLastRow() - 1, 1).getValues().forEach(function (linha) {
          const n = String(linha[0] || '').trim().toUpperCase();
          if (n) nomesEfetivo.add(n);
        });
      }
    } catch (e) {
      nomesEfetivo = null;
    }

    // Leitura em lote (uma chamada so): formulas, valores e notas das linhas de dados.
    const rangeDados = sheet.getRange(2, 1, ultimaLinha - 1, ultimaCol);
    const formulas = rangeDados.getFormulas();
    const valores = (typeof rangeDados.getValues === 'function') ? rangeDados.getValues() : [];
    const notes = (typeof rangeDados.getNotes === 'function') ? rangeDados.getNotes() : [];

    colunas.forEach(function (coluna) {
      const col = coluna.indice;
      if (col < 0 || col >= ultimaCol) {
        resumo.naoCorrigidas.push(coluna.nome + ' (indice fora do range)');
        return;
      }

      // ARRAYFORMULA: formula unica no topo derrama na coluna inteira. Nao se replica;
      // o correto e manter apenas a PRIMEIRA e limpar as duplicadas (spill quebrado).
      let ehArrayFormula = false;
      for (let r = 0; r < formulas.length; r++) {
        if (String(formulas[r][col] || '').toUpperCase().indexOf('ARRAYFORMULA') !== -1) {
          ehArrayFormula = true;
          break;
        }
      }
      if (ehArrayFormula) {
        let primeiroVisto = false;
        let limpas = 0;
        let fonteLinha = 0;
        for (let r = 0; r < formulas.length; r++) {
          const f = String(formulas[r][col] || '');
          if (f.toUpperCase().indexOf('ARRAYFORMULA') !== -1) {
            if (!primeiroVisto) {
              primeiroVisto = true;
              fonteLinha = r + 2;
            } else {
              if (!dryRun) sheet.getRange(r + 2, col + 1).clearContent();
              limpas++;
            }
          }
        }
        resumo.colunas.push({ nome: coluna.nome, fonte: fonteLinha, corrigidas: limpas, arrayFormula: true });
        resumo.corrigidas += limpas;
        return;
      }

      // 1. Acha uma linha-fonte com formula valida nesta coluna.
      let fonteR1C1 = null;
      let fonteFormula = '';
      let fonteLinha = 0;
      for (let r = 0; r < formulas.length; r++) {
        const f = String(formulas[r][col] || '');
        const v = (valores[r] && valores[r][col] !== undefined) ? String(valores[r][col]) : '';
        if (f.charAt(0) === '=' && !self.temErro(f) && !self.ehErroValor(v)) {
          fonteR1C1 = sheet.getRange(r + 2, col + 1).getFormulaR1C1();
          fonteFormula = f;
          fonteLinha = r + 2;
          break;
        }
      }

      if (!fonteR1C1) {
        resumo.naoCorrigidas.push(coluna.nome);
        return;
      }

      const ehVlookup = fonteFormula.toUpperCase().indexOf('VLOOKUP') !== -1;

      // 2. Replica nas celulas sem formula valida (e sem excecao justificada).
      let corrigidas = 0;
      for (let r = 0; r < formulas.length; r++) {
        const f = String(formulas[r][col] || '');
        const v = (valores[r] && valores[r][col] !== undefined) ? String(valores[r][col]) : '';
        if (f.charAt(0) === '=' && !self.ehErroValor(v)) continue;

        // Colunas VLOOKUP: preserva valor estatico de policial FORA do EFETIVO (legado).
        if (ehVlookup && nomesEfetivo && idxPolicial >= 0) {
          const nomeAE = String((valores[r] && valores[r][idxPolicial]) || '').trim().toUpperCase();
          if (nomeAE && !nomesEfetivo.has(nomeAE)) continue;
        }

        const nota = (notes[r] && notes[r][col]) ? String(notes[r][col]) : '';
        if (nota.toUpperCase().indexOf('EXCECAO:') === 0) continue;
        if (!dryRun) {
          sheet.getRange(r + 2, col + 1).setFormulaR1C1(fonteR1C1);
        }
        corrigidas++;
      }

      resumo.colunas.push({ nome: coluna.nome, fonte: fonteLinha, corrigidas: corrigidas });
      resumo.corrigidas += corrigidas;
    });

    return resumo;
  }
};

/** Entrada de menu: corrige a aba ativa. */
function corrigirFormulasAbaAtual() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const resumo = CorretorQualidade.corrigirFormulasAba(sheet);
  const ui = SpreadsheetApp.getUi();
  let msg = 'Formulas corrigidas: ' + resumo.corrigidas + ' celulas em ' + resumo.colunas.length + ' colunas.';
  if (resumo.naoCorrigidas.length) {
    msg += '\n\nNao corrigidas (sem linha-modelo valida):\n' + resumo.naoCorrigidas.join('\n');
  }
  ui.alert('Corretor de Formulas — ' + resumo.aba, msg, ui.ButtonSet.OK);
  return resumo;
}

/** Entrada headless: corrige uma aba pelo nome (clasp run). */
function corrigirFormulasAbaHeadless(nomeAba) {
  const ss = obterSpreadsheetOcorrencias_();
  const sheet = ss.getSheetByName(nomeAba);
  if (!sheet) {
    return { status: 'ERRO', mensagem: 'Aba nao encontrada: ' + nomeAba };
  }
  const resumo = CorretorQualidade.corrigirFormulasAba(sheet);
  resumo.status = 'OK';
  return resumo;
}

/** Entrada headless de DIAGNOSTICO (dry-run): reporta sem escrever. */
function diagnosticarFormulasAbaHeadless(nomeAba) {
  const ss = obterSpreadsheetOcorrencias_();
  const sheet = ss.getSheetByName(nomeAba);
  if (!sheet) {
    return { status: 'ERRO', mensagem: 'Aba nao encontrada: ' + nomeAba };
  }
  const resumo = CorretorQualidade.corrigirFormulasAba(sheet, { dryRun: true });
  resumo.status = 'OK';
  resumo.dryRun = true;
  return resumo;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CorretorQualidade;
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

- Superfície exposta no nível do arquivo (nível global): `corrigirFormulasAbaAtual`, `corrigirFormulasAbaHeadless`, `diagnosticarFormulasAbaHeadless`, `CorretorQualidade`
- Membros públicos observados: —

_Extraído por heurística do gerador (globais de nível arquivo + métodos/accessors de 1º–2º nível). Não substitui a declaração de porta da Planta: confirme no endereço acima._

## Divergência com a Planta declarada

Testes mecânicos executados na geração (commit `0049c30`, 2026-09-15T18:23:06-03:00):

- OK — T1 endereco existe: NOTA_DE_RESPONSABILIDADE.md do modulo presente
- OK — T2 artefato declarado no endereco: "Features/CorretorQualidade.js" aparece na Planta
- OK — T3 arquivo presente no commit de referencia (0049c30:Features/CorretorQualidade.js)
- OK — T4 conteudo em disco identico ao do commit de referencia (sha256 LF)

Veredito mecânico: **nenhuma divergência detectada pelos testes acima**.

## Última verificação (data/commit)

- 2026-09-15T18:23:06-03:00 · commit `0049c30` · sha256 da origem (LF): `d734230f35004320735ea7a72029ea0be1cabfee07802838e7bf5f02f96cf9d6`
- Reexecutar: `node scripts/downplant/espelho-rico.mjs gerar --endereco C05_Guardiao/MOD-C05-01_GUARDIAO_DE_QUALIDADE --origem Features/CorretorQualidade.js --saida <caminho>`
- Verificar deriva sem regravar: `node scripts/downplant/espelho-rico.mjs verificar --espelho <caminho>`
