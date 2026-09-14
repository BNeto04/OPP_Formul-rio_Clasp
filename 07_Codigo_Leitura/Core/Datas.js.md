# ESPELHO — Datas.js

> [!NOTE] Espelho rico de código (Metodo §46.15) — gerado por `scripts/downplant/espelho-rico.mjs`
> Somente leitura. Não editar à mão: qualquer edição é sobrescrita na próxima geração.
> O código abaixo é cópia verbatim do arquivo de origem no commit declarado; divergência entre o embutido e a origem é deriva (§18.1).
> Regra do sha256 declarado: sha256 do conteúdo **normalizado para LF** (igual ao blob do Git). Em arquivo CRLF com terminador final diferente, ele difere do `sha256sum` dos bytes crus — a comparação de deriva é feita conteúdo-contra-conteúdo.
> Papel desta cópia: CANÔNICA (repositório). O derivado navegável no vault é gerado com as mesmas entradas.

- **Endereço Down Plant:** `NÃO RESOLVIDO` — o artefato nao e declarado como artefato fisico em NENHUM endereco da Planta (varredura de 02_Comodos: secoes "Artefatos", tabelas de artefatos e mencoes no diretorio do endereco). O espelho anterior apontava para `_SUP_158/C00_Governanca_Estrutural/01_Dominio/modulos/MOD-C00-01_INFRAESTRUTURA_CORE`, elemento PARADO (arquivado no #158, sem lastro em nenhuma ref do repo). REPORTADO, nao inventado — ver MAPA_ARTEFATO_ENDERECO_162.md.
- Sem link de endereço: não existe elemento da Planta a linkar (não inventado). Ver `MAPA_ARTEFATO_ENDERECO_162.md`.
- **Arquivo de origem (link para o disco):** [`Core/Datas.js`](../../Core/Datas.js)
- **Commit de referência:** `fbb0608e7b98144533628c7f9b773a10505b800d` (`fbb0608`)
- **Data da última sincronização:** 2026-09-13T21:45:04-03:00

## Código-fonte embutido

Verbatim de `Core/Datas.js` em `fbb0608`. sha256 do bloco (LF): `f31ac501cff0de0b368758a564ef1b287d09aa18f643aa51903c09dea8d31de2` — 80 linhas.

```javascript
/**
 * ARQUIVO: Core/Datas.js
 * DESCRIÇÃO: Módulo de utilitários de data do ecossistema SYNTHÉON.
 * Encapsulado sob o namespace SyntheonDatas mantendo aliases globais para compatibilidade.
 */

const SyntheonDatas = {
  /**
   * Converte de forma robusta qualquer entrada para um objeto Date do JS.
   * Trata Date nativo, strings brasileiras (com/sem horário), congela horário e evita inversão de dia/mês.
   * @param {*} valor - O dado bruto da célula.
   * @return {Date|null} O objeto Date com horário zerado ou null se inválido.
   */
  converterDataUnificada(valor) {
    if (valor instanceof Date) {
      if (isNaN(valor.getTime())) return null;
      const dataNativa = new Date(valor.getTime());
      dataNativa.setHours(0, 0, 0, 0);
      return dataNativa;
    }

    if (valor === null || valor === undefined || valor === "") {
      return null;
    }

    const texto = String(valor).trim();
    const partesBr = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}):(\d{2}))?$/);
    if (partesBr) {
      const dia = Number(partesBr[1]);
      const mes = Number(partesBr[2]) - 1;
      const ano = Number(partesBr[3]);
      const hora = partesBr[4] ? Number(partesBr[4]) : 0;
      const min = partesBr[5] ? Number(partesBr[5]) : 0;
      const seg = partesBr[6] ? Number(partesBr[6]) : 0;
      
      const dataGerada = new Date(ano, mes, dia, hora, min, seg);
      if (
        dataGerada.getFullYear() !== ano ||
        dataGerada.getMonth() !== mes ||
        dataGerada.getDate() !== dia
      ) {
        return null;
      }
      dataGerada.setHours(0, 0, 0, 0);
      return dataGerada;
    }

    return null;
  },

  /**
   * Formata um objeto Date no padrão brasileiro DD/MM/YYYY.
   * @param {Date} data
   * @return {string}
   */
  formatarDataBR(data) {
    if (!data || !(data instanceof Date) || isNaN(data.getTime())) return '';
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
  }
};

// Aliases globais de compatibilidade para código legado e chamadas diretas no Apps Script
function converterDataUnificada(valor) {
  return SyntheonDatas.converterDataUnificada(valor);
}

function formatarDataBR(data) {
  return SyntheonDatas.formatarDataBR(data);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SyntheonDatas,
    converterDataUnificada,
    formatarDataBR
  };
}
```

## Responsabilidade observada

- _(sem NOTA_DE_RESPONSABILIDADE.md no endereço: responsabilidade não derivável)_
## Portas expostas (se aplicável)

- Superfície exposta no nível do arquivo (nível global): `converterDataUnificada`, `formatarDataBR`, `SyntheonDatas`
- Membros públicos observados: `converterDataUnificada`, `formatarDataBR`

_Extraído por heurística do gerador (globais de nível arquivo + métodos/accessors de 1º–2º nível). Não substitui a declaração de porta da Planta: confirme no endereço acima._

## Divergência com a Planta declarada

Testes mecânicos executados na geração (commit `fbb0608`, 2026-09-13T21:45:04-03:00):

- OK — T3 arquivo presente no commit de referencia (fbb0608:Core/Datas.js)
- OK — T4 conteudo em disco identico ao do commit de referencia (sha256 LF)
- OK — T5 espelho anterior sem deriva de codigo (sha256 do bloco == origem)
- OK — T7 sem duplicidade: exatamente 1 espelho de leitura declara "Core/Datas.js" como origem
- **ACHADO** — T1 endereco NAO RESOLVIDO no Down Plant canonico: o artefato nao e declarado como artefato fisico em NENHUM endereco da Planta (varredura de 02_Comodos: secoes "Artefatos", tabelas de artefatos e mencoes no diretorio do endereco). O espelho anterior apontava para `_SUP_158/C00_Governanca_Estrutural/01_Dominio/modulos/MOD-C00-01_INFRAESTRUTURA_CORE`, elemento PARADO (arquivado no #158, sem lastro em nenhuma ref do repo). REPORTADO, nao inventado — ver MAPA_ARTEFATO_ENDERECO_162.md. (registrado em MAPA_ARTEFATO_ENDERECO_162.md — REPORTADO, nao inventado)
- **ACHADO** — T2 declaracao do artefato nao verificavel: sem endereco canonico nao ha Planta contra a qual conferir "Core/Datas.js"

Veredito mecânico: **2 divergência(s) detectada(s) pelos testes acima**.

Declaração verificada a mão por humano/agente (não derivável automaticamente):

- **Como o endereco foi derivado (nao inventado):** sem derivacao.
- **Ponteiro anterior para elemento PARADO:** o espelho de leitura anterior apontava para `_SUP_158/C00_Governanca_Estrutural/01_Dominio/modulos/MOD-C00-01_INFRAESTRUTURA_CORE`, elemento arquivado no card #158 (sem lastro em nenhuma ref do repo). O endereco acima NAO e uma renomeacao daquele: foi derivado da declaracao do artefato na Planta (medido em `MAPA_ARTEFATO_ENDERECO_162.md`).
- **Nada foi corrigido no artefato:** o gerador nao altera codigo de produto; o arquivo de origem permanece byte a byte como estava.

## Última verificação (data/commit)

- 2026-09-13T21:45:04-03:00 · commit `fbb0608` · sha256 da origem (LF): `f31ac501cff0de0b368758a564ef1b287d09aa18f643aa51903c09dea8d31de2`
- Reexecutar: `node scripts/downplant/espelho-rico.mjs gerar --endereco-ausente "o artefato nao e declarado como artefato fisico em NENHUM endereco da Planta (varredura de 02_Comodos: secoes "Artefatos", tabelas de artefatos e mencoes no diretorio do endereco). O espelho anterior apontava para `_SUP_158/C00_Governanca_Estrutural/01_Dominio/modulos/MOD-C00-01_INFRAESTRUTURA_CORE`, elemento PARADO (arquivado no #158, sem lastro em nenhuma ref do repo). REPORTADO, nao inventado — ver MAPA_ARTEFATO_ENDERECO_162.md." --origem Core/Datas.js --saida <caminho>`
- Verificar deriva sem regravar: `node scripts/downplant/espelho-rico.mjs verificar --espelho <caminho>`
