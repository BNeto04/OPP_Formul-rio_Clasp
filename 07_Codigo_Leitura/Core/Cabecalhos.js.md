# ESPELHO — Cabecalhos.js

> [!NOTE] Espelho rico de código (Metodo §46.15) — gerado por `scripts/downplant/espelho-rico.mjs`
> Somente leitura. Não editar à mão: qualquer edição é sobrescrita na próxima geração.
> O código abaixo é cópia verbatim do arquivo de origem no commit declarado; divergência entre o embutido e a origem é deriva (§18.1).
> Regra do sha256 declarado: sha256 do conteúdo **normalizado para LF** (igual ao blob do Git). Em arquivo CRLF com terminador final diferente, ele difere do `sha256sum` dos bytes crus — a comparação de deriva é feita conteúdo-contra-conteúdo.
> Papel desta cópia: CANÔNICA (repositório). O derivado navegável no vault é gerado com as mesmas entradas.

- **Endereço Down Plant:** `C02_Leitura / MOD-C02-01_LEITURA_E_ADAPTACAO` — [NOTA_DE_RESPONSABILIDADE.md](../../02_Comodos/C02_Leitura/01_Dominio/modulos/MOD-C02-01_LEITURA_E_ADAPTACAO/NOTA_DE_RESPONSABILIDADE.md)
- **Arquivo de origem (link para o disco):** [`Core/Cabecalhos.js`](../../Core/Cabecalhos.js)
- **Commit de referência:** `fbb0608e7b98144533628c7f9b773a10505b800d` (`fbb0608`)
- **Data da última sincronização:** 2026-09-13T21:45:01-03:00

## Código-fonte embutido

Verbatim de `Core/Cabecalhos.js` em `fbb0608`. sha256 do bloco (LF): `5d610263944f063e8707959b90dfb5a1867fae8bfd36a58397dce4c8a5bac0e1` — 115 linhas.

```javascript
/**
 * ARQUIVO: Core/Cabecalhos.js
 * DESCRIÇÃO: Mecanismo central para normalização, indexação e localização flexível de cabeçalhos.
 */
const SyntheonCabecalhos = {
  /**
   * Normaliza um nome de cabeçalho removendo acentos, espaços extras e convertendo para maiúsculas.
   * @param {*} valor
   * @return {string}
   */
  normalizar(valor) {
    if (typeof SyntheonUtils !== 'undefined' && typeof SyntheonUtils.normalizarTexto === 'function') {
      return SyntheonUtils.normalizarTexto(valor);
    }
    return String(valor || '')
      .trim()
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  },

  /**
   * Mapeia um array de cabeçalhos brutos em um mapa { headerNormalizado: indice0Based }.
   * @param {Array} headers 
   * @returns {Object.<string, number>}
   */
  criarIndice(headers) {
    const mapa = {};
    if (!Array.isArray(headers)) return mapa;
    headers.forEach((h, index) => {
      const norm = this.normalizar(h);
      if (norm && mapa[norm] === undefined) {
        mapa[norm] = index;
      }
    });
    return mapa;
  },

  /**
   * Localiza o índice de uma coluna a partir de uma lista de aliases ou chave oficial.
   * @param {Array<string>|Object.<string, number>} headersOuIndice - Array de cabeçalhos brutos ou mapa de índice.
   * @param {string|Array<string>} aliases - Chave alias em CONSTANTES_SYNTHEON.ALIASES ou vetor de opções.
   * @param {boolean} [obrigatorio=false] - Se true, lança erro se não encontrar.
   * @param {string} [nomeCampo=''] - Nome descritivo do campo para mensagem de erro.
   * @returns {number} Índice (0-based) ou -1 se não localizado.
   */
  encontrar(headersOuIndice, aliases, obrigatorio = false, nomeCampo = '') {
    let listaAliases = [];
    let constObj = typeof CONSTANTES_SYNTHEON !== 'undefined' ? CONSTANTES_SYNTHEON : (typeof global !== 'undefined' && global.CONSTANTES_SYNTHEON ? global.CONSTANTES_SYNTHEON : null);
    if (!constObj && typeof require !== 'undefined') {
      try { constObj = require('./Constantes'); } catch (e) {}
    }

    if (typeof aliases === 'string') {
      if (constObj && constObj.ALIASES && constObj.ALIASES[aliases]) {
        listaAliases = constObj.ALIASES[aliases];
      } else {
        listaAliases = [aliases];
      }
    } else if (Array.isArray(aliases)) {
      listaAliases = aliases;
    }

    const opcoesNormalizadas = listaAliases.map(a => this.normalizar(a));

    let idx = -1;

    if (Array.isArray(headersOuIndice)) {
      const headersNorm = headersOuIndice.map(h => this.normalizar(h));
      
      // 1. Busca Exata
      for (const opcao of opcoesNormalizadas) {
        idx = headersNorm.indexOf(opcao);
        if (idx !== -1) break;
      }
      // 2. Busca Parcial (.includes)
      if (idx === -1) {
        for (const opcao of opcoesNormalizadas) {
          idx = headersNorm.findIndex(h => h.includes(opcao));
          if (idx !== -1) break;
        }
      }
    } else if (headersOuIndice && typeof headersOuIndice === 'object') {
      // 1. Busca Exata no mapa
      for (const opcao of opcoesNormalizadas) {
        if (headersOuIndice[opcao] !== undefined) {
          idx = headersOuIndice[opcao];
          break;
        }
      }
      // 2. Busca Parcial no mapa
      if (idx === -1) {
        const chaves = Object.keys(headersOuIndice);
        for (const opcao of opcoesNormalizadas) {
          const chaveEncontrada = chaves.find(c => c.includes(opcao));
          if (chaveEncontrada) {
            idx = headersOuIndice[chaveEncontrada];
            break;
          }
        }
      }
    }

    if (idx === -1 && obrigatorio) {
      const campoDesc = nomeCampo || (typeof aliases === 'string' ? aliases : listaAliases.join('/'));
      throw new Error(`Cabeçalho obrigatório para '${campoDesc}' não localizado. Opções aceitas: ${listaAliases.join(', ')}.`);
    }

    return idx;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SyntheonCabecalhos;
}
```

## Responsabilidade observada

Fonte: `02_Comodos/C02_Leitura/01_Dominio/modulos/MOD-C02-01_LEITURA_E_ADAPTACAO/MOD-C02-01_LEITURA_E_ADAPTACAO.md` — CAPSULA do modulo (formato 46.2), "## Responsabilidade".

**Ler** as planilhas e **traduzir** linhas fisicas em fatos canonicos (`RegistroCanonico`), alem de resolver a
antiguidade a partir do peculio. E o unico ponto do sistema que conhece o **layout fisico** das abas.

Fonte: `02_Comodos/C02_Leitura/01_Dominio/modulos/MOD-C02-01_LEITURA_E_ADAPTACAO/MOD-C02-01_LEITURA_E_ADAPTACAO.md` — CAPSULA do modulo (formato 46.2), "## Limites".

- **Nao agrega dados.** O cabecalho do adaptador declara a "Regra de Ouro #4": ele **apenas traduz** linhas
  fisicas em fatos; somar/consolidar e do Motor (C04).
- **Nao grava** em planilha: leitura somente.
- **Nao inventa posicao de coluna:** quando o cabecalho nao e reconhecido, falha explicitamente
  (`FALHA_ADAPTADOR_SEM_FATOS`) em vez de chutar indice.
- **Nao usa fallback para `QDT ARMAS`**: a separacao arma fisica x participacao e obrigatoria.

## Portas expostas (se aplicável)

- Superfície exposta no nível do arquivo (nível global): `SyntheonCabecalhos`
- Membros públicos observados: `normalizar`, `criarIndice`, `encontrar`

_Extraído por heurística do gerador (globais de nível arquivo + métodos/accessors de 1º–2º nível). Não substitui a declaração de porta da Planta: confirme no endereço acima._

## Divergência com a Planta declarada

Testes mecânicos executados na geração (commit `fbb0608`, 2026-09-13T21:45:01-03:00):

- OK — T1 endereco existe: NOTA_DE_RESPONSABILIDADE.md do modulo presente
- OK — T2 artefato declarado no endereco: "Core/Cabecalhos.js" aparece na Planta
- OK — T3 arquivo presente no commit de referencia (fbb0608:Core/Cabecalhos.js)
- OK — T4 conteudo em disco identico ao do commit de referencia (sha256 LF)
- OK — T5 espelho anterior sem deriva de codigo (sha256 do bloco == origem)
- OK — T6 endereco declarado no espelho anterior corresponde ao endereco canonico atual
- OK — T7 sem duplicidade: exatamente 1 espelho de leitura declara "Core/Cabecalhos.js" como origem

Veredito mecânico: **nenhuma divergência detectada pelos testes acima**.

Declaração verificada a mão por humano/agente (não derivável automaticamente):

- **Como o endereco foi derivado (nao inventado):** secao Artefatos; fonte `02_Comodos/C02_Leitura/01_Dominio/modulos/MOD-C02-01_LEITURA_E_ADAPTACAO/MOD-C02-01_LEITURA_E_ADAPTACAO.md`:62.
- **Ponteiro anterior para elemento PARADO:** o espelho de leitura anterior apontava para `_SUP_158/C00_Governanca_Estrutural/01_Dominio/modulos/MOD-C00-01_INFRAESTRUTURA_CORE`, elemento arquivado no card #158 (sem lastro em nenhuma ref do repo). O endereco acima NAO e uma renomeacao daquele: foi derivado da declaracao do artefato na Planta (medido em `MAPA_ARTEFATO_ENDERECO_162.md`).
- **Divergencia com o espelho anterior:** o espelho antigo declarava o modulo `MOD-C00-01_INFRAESTRUTURA_CORE`; a derivacao atual chega a `C02_Leitura/MOD-C02-01_LEITURA_E_ADAPTACAO`. Divergencia declarada, nao sobrescrita em silencio.
- **Nada foi corrigido no artefato:** o gerador nao altera codigo de produto; o arquivo de origem permanece byte a byte como estava.

## Última verificação (data/commit)

- 2026-09-13T21:45:01-03:00 · commit `fbb0608` · sha256 da origem (LF): `5d610263944f063e8707959b90dfb5a1867fae8bfd36a58397dce4c8a5bac0e1`
- Reexecutar: `node scripts/downplant/espelho-rico.mjs gerar --endereco C02_Leitura/MOD-C02-01_LEITURA_E_ADAPTACAO --origem Core/Cabecalhos.js --saida <caminho>`
- Verificar deriva sem regravar: `node scripts/downplant/espelho-rico.mjs verificar --espelho <caminho>`
