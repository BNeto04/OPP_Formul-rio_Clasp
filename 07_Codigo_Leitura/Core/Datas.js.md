# ESPELHO — Datas.js

> [!NOTE] Espelho rico de código (Metodo §46.15) — gerado por `scripts/downplant/espelho-rico.mjs`
> Somente leitura. Não editar à mão: qualquer edição é sobrescrita na próxima geração.
> O código abaixo é cópia verbatim do arquivo de origem no commit declarado; divergência entre o embutido e a origem é deriva (§18.1).
> Regra do sha256 declarado: sha256 do conteúdo **normalizado para LF** (igual ao blob do Git). Em arquivo CRLF com terminador final diferente, ele difere do `sha256sum` dos bytes crus — a comparação de deriva é feita conteúdo-contra-conteúdo.
> Papel desta cópia: CANÔNICA (repositório). O derivado navegável no vault é gerado com as mesmas entradas.

- **Endereço Down Plant:** `C00_Governanca_Estrutural / MOD-C00-03_INFRAESTRUTURA_CORE` — [NOTA_DE_RESPONSABILIDADE.md](../../02_Comodos/C00_Governanca_Estrutural/01_Dominio/modulos/MOD-C00-03_INFRAESTRUTURA_CORE/NOTA_DE_RESPONSABILIDADE.md)
- **Arquivo de origem (link para o disco):** [`Core/Datas.js`](../../Core/Datas.js)
- **Commit de referência:** `fbb0608e7b98144533628c7f9b773a10505b800d` (`fbb0608`)
- **Data da última sincronização:** 2026-09-13T22:05:06-03:00

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

Fonte: `02_Comodos/C00_Governanca_Estrutural/01_Dominio/modulos/MOD-C00-03_INFRAESTRUTURA_CORE/MOD-C00-03_INFRAESTRUTURA_CORE.md` — CAPSULA do modulo (formato 46.2), "## Responsabilidade".

Enderecar a **infraestrutura transversal de runtime** do produto: utilitarios deterministicos de data, classes
de erro padronizadas, logger operacional e o **manifesto de ambiente** do projeto Google Apps Script. E a casa
canonica dos recursos de `Core/` que **nao pertencem a nenhum modulo de negocio** (GAP declarado no #158).
Nao executa regra de negocio: prove infraestrutura.

Fonte: `02_Comodos/C00_Governanca_Estrutural/01_Dominio/modulos/MOD-C00-03_INFRAESTRUTURA_CORE/MOD-C00-03_INFRAESTRUTURA_CORE.md` — CAPSULA do modulo (formato 46.2), "## Limites".

- **Nao** decide regra de dominio: constantes, tabelas e limiares vivem na ARCA e nos modulos consumidores.
- **Nao** re-declara os utilitarios de `Core/` que **ja possuem endereco canonico proprio** em outros modulos
  (identificadores de configuracao, constantes e utils). Re-declara-los aqui moveria um endereco primario **ja
  fixado** — ver `MAPA_ARTEFATO_ENDERECO_162.md`.
- **Nao** publica o cofre: a fronteira de publicacao e do `MOD-C00-01_ESTRUTURA_DO_COFRE` (`.claspignore`).
- **Nao** altera codigo de produto: o modulo endereca; quem prova o verbatim e o espelho (§46.15).

## Portas expostas (se aplicável)

- Superfície exposta no nível do arquivo (nível global): `converterDataUnificada`, `formatarDataBR`, `SyntheonDatas`
- Membros públicos observados: `converterDataUnificada`, `formatarDataBR`

_Extraído por heurística do gerador (globais de nível arquivo + métodos/accessors de 1º–2º nível). Não substitui a declaração de porta da Planta: confirme no endereço acima._

## Divergência com a Planta declarada

Testes mecânicos executados na geração (commit `fbb0608`, 2026-09-13T22:05:06-03:00):

- OK — T1 endereco existe: NOTA_DE_RESPONSABILIDADE.md do modulo presente
- OK — T2 artefato declarado no endereco: "Core/Datas.js" aparece na Planta
- OK — T3 arquivo presente no commit de referencia (fbb0608:Core/Datas.js)
- OK — T4 conteudo em disco identico ao do commit de referencia (sha256 LF)
- OK — T5 espelho anterior sem deriva de codigo (sha256 do bloco == origem)
- OK — T6 endereco declarado no espelho anterior corresponde ao endereco canonico atual
- OK — T7 sem duplicidade: exatamente 1 espelho de leitura declara "Core/Datas.js" como origem

Veredito mecânico: **nenhuma divergência detectada pelos testes acima**.

Declaração verificada a mão por humano/agente (não derivável automaticamente):

- **Como o endereco foi derivado (nao inventado):** declaracao de artefato na secao "## Artefatos" da capsula §46.2 do endereco `C00_Governanca_Estrutural / MOD-C00-03_INFRAESTRUTURA_CORE` (linha 61 de `02_Comodos/C00_Governanca_Estrutural/01_Dominio/modulos/MOD-C00-03_INFRAESTRUTURA_CORE/MOD-C00-03_INFRAESTRUTURA_CORE.md`) — nivel 1 do MAPA_ARTEFATO_ENDERECO_162.md. O modulo materializa, com ID canonico novo (`MOD-C00-03`, proximo livre do comodo na sequencia existente 01/02), o conteudo PARADO do card #158 `MOD-C00-01_INFRAESTRUTURA_CORE` (arquivado no espelho por colisao de ID com `MOD-C00-01_ESTRUTURA_DO_COFRE`).
- **Ponteiro anterior para elemento PARADO:** o espelho de leitura anterior apontava para `_SUP_158/.../MOD-C00-01_INFRAESTRUTURA_CORE`. O endereco acima NAO e renomeacao daquele elemento: o ID mudou (colisao) e o endereco foi declarado na Planta canonica do repositorio.
- **Nada foi corrigido no artefato:** o gerador nao altera codigo de produto; o arquivo de origem permanece byte a byte como estava.

## Última verificação (data/commit)

- 2026-09-13T22:05:06-03:00 · commit `fbb0608` · sha256 da origem (LF): `f31ac501cff0de0b368758a564ef1b287d09aa18f643aa51903c09dea8d31de2`
- Reexecutar: `node scripts/downplant/espelho-rico.mjs gerar --endereco C00_Governanca_Estrutural/MOD-C00-03_INFRAESTRUTURA_CORE --origem Core/Datas.js --saida <caminho>`
- Verificar deriva sem regravar: `node scripts/downplant/espelho-rico.mjs verificar --espelho <caminho>`
