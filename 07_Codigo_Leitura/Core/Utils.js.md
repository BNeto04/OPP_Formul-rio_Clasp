# ESPELHO — Utils.js

> [!NOTE] Espelho rico de código (Metodo §46.15) — gerado por `scripts/downplant/espelho-rico.mjs`
> Somente leitura. Não editar à mão: qualquer edição é sobrescrita na próxima geração.
> O código abaixo é cópia verbatim do arquivo de origem no commit declarado; divergência entre o embutido e a origem é deriva (§18.1).
> Regra do sha256 declarado: sha256 do conteúdo **normalizado para LF** (igual ao blob do Git). Em arquivo CRLF com terminador final diferente, ele difere do `sha256sum` dos bytes crus — a comparação de deriva é feita conteúdo-contra-conteúdo.
> Papel desta cópia: CANÔNICA (repositório). O derivado navegável no vault é gerado com as mesmas entradas.

- **Endereço Down Plant:** `C01_Entrada / MOD-C01-02_NORMALIZADOR_DE_EFETIVO` — [NOTA_DE_RESPONSABILIDADE.md](../../02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-02_NORMALIZADOR_DE_EFETIVO/NOTA_DE_RESPONSABILIDADE.md)
- **Arquivo de origem (link para o disco):** [`Core/Utils.js`](../../Core/Utils.js)
- **Commit de referência:** `fbb0608e7b98144533628c7f9b773a10505b800d` (`fbb0608`)
- **Data da última sincronização:** 2026-09-13T21:45:11-03:00

## Código-fonte embutido

Verbatim de `Core/Utils.js` em `fbb0608`. sha256 do bloco (LF): `90cc795d250d4074a9d27777d893e7c5f729a32e7fa82692d2758ff84fdb5666` — 81 linhas.

```javascript
/**
 * Utilitários diversos do ecossistema SYNTHÉON.
 */
const SyntheonUtils = {
  /**
   * Limpa a matrícula funcional, removendo qualquer caractere não-numérico.
   * @param {*} valor
   * @return {string}
   */
  limparMatricula(valor) {
    return String(valor || '').replace(/\D/g, '').trim();
  },

  /**
   * Converte strings numéricas brasileiras para number de forma segura.
   * @param {*} valor
   * @return {number}
   */
  converterNumero(valor) {
    if (typeof valor === 'number') {
      return isNaN(valor) ? 0 : valor;
    }
    if (valor === null || valor === undefined || valor === '') {
      return 0;
    }
    const texto = String(valor)
      .replace(/\./g, '')
      .replace(',', '.')
      .trim();
    const numero = Number(texto);
    return isNaN(numero) ? 0 : numero;
  },

  /**
   * Remove acentuação, espaços nulos e deixa em maiúsculo.
   * @param {*} valor
   * @return {string}
   */
  normalizarTexto(valor) {
    return String(valor || '')
      .trim()
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  },

  /**
   * Localiza a coluna de um cabeçalho através de uma lista de aliases.
   * @param {Array<string>} headers - Cabeçalhos da planilha limpos/normalizados.
   * @param {string} chaveAlias - Chave definida no ALIASES de Constantes.js.
   * @return {number} Índice (0-based) ou -1 se não localizado.
   */
  localizarColuna(headers, chaveAlias) {
    if (typeof SyntheonCabecalhos !== 'undefined' && typeof SyntheonCabecalhos.encontrar === 'function') {
      return SyntheonCabecalhos.encontrar(headers, chaveAlias);
    }
    const aliases = (typeof CONSTANTES_SYNTHEON !== 'undefined' && CONSTANTES_SYNTHEON.ALIASES && CONSTANTES_SYNTHEON.ALIASES[chaveAlias])
      ? CONSTANTES_SYNTHEON.ALIASES[chaveAlias]
      : [chaveAlias];
    const opcoesNormalizadas = aliases.map(alias => this.normalizarTexto(alias));
    const headersNormalizados = Array.isArray(headers) ? headers.map(h => this.normalizarTexto(h)) : [];

    // 1. Procura match exato
    for (const opcao of opcoesNormalizadas) {
      const idx = headersNormalizados.indexOf(opcao);
      if (idx !== -1) return idx;
    }

    // 2. Procura match por contenção (parcial)
    for (const opcao of opcoesNormalizadas) {
      const idx = headersNormalizados.findIndex(h => h.includes(opcao));
      if (idx !== -1) return idx;
    }

    return -1;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SyntheonUtils;
}
```

## Responsabilidade observada

Fonte: `02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-02_NORMALIZADOR_DE_EFETIVO/NOTA_DE_RESPONSABILIDADE.md` — NOTA_DE_RESPONSABILIDADE.md do modulo, "## Papel".

Sincronizar a aba EFETIVO a partir do QO/PECULIO sem apagar registros extras, normalizando graduacao,
matricula, nome de guerra (desambiguacao por antiguidade N) e subunidade de produtividade.
Acionado pelo menu (Produtividade > "Sincronizar efetivo pelo peculio").

Fonte: `02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-02_NORMALIZADOR_DE_EFETIVO/NOTA_DE_RESPONSABILIDADE.md` — NOTA_DE_RESPONSABILIDADE.md do modulo, "## Limites".

- Nao audita dados; nao corrige valores operacionais fora das colunas do EFETIVO.
- Nao promove heuristica a regra oficial.

## Portas expostas (se aplicável)

- Superfície exposta no nível do arquivo (nível global): `SyntheonUtils`
- Membros públicos observados: `limparMatricula`, `converterNumero`, `normalizarTexto`, `localizarColuna`

_Extraído por heurística do gerador (globais de nível arquivo + métodos/accessors de 1º–2º nível). Não substitui a declaração de porta da Planta: confirme no endereço acima._

## Divergência com a Planta declarada

Testes mecânicos executados na geração (commit `fbb0608`, 2026-09-13T21:45:11-03:00):

- OK — T1 endereco existe: NOTA_DE_RESPONSABILIDADE.md do modulo presente
- OK — T2 artefato declarado no endereco: "Core/Utils.js" aparece na Planta
- OK — T3 arquivo presente no commit de referencia (fbb0608:Core/Utils.js)
- OK — T4 conteudo em disco identico ao do commit de referencia (sha256 LF)
- OK — T5 espelho anterior sem deriva de codigo (sha256 do bloco == origem)
- OK — T6 endereco declarado no espelho anterior corresponde ao endereco canonico atual
- OK — T7 sem duplicidade: exatamente 1 espelho de leitura declara "Core/Utils.js" como origem

Veredito mecânico: **nenhuma divergência detectada pelos testes acima**.

Declaração verificada a mão por humano/agente (não derivável automaticamente):

- **Como o endereco foi derivado (nao inventado):** secao Artefatos; fonte `02_Comodos/C01_Entrada/01_Dominio/modulos/MOD-C01-02_NORMALIZADOR_DE_EFETIVO/NOTA_DE_RESPONSABILIDADE.md`:20.
- **Ponteiro anterior para elemento PARADO:** o espelho de leitura anterior apontava para `_SUP_158/C00_Governanca_Estrutural/01_Dominio/modulos/MOD-C00-01_INFRAESTRUTURA_CORE`, elemento arquivado no card #158 (sem lastro em nenhuma ref do repo). O endereco acima NAO e uma renomeacao daquele: foi derivado da declaracao do artefato na Planta (medido em `MAPA_ARTEFATO_ENDERECO_162.md`).
- **Enderecos concorrentes declarados na Planta (2):** `C01_Entrada/MOD-C01-01_FORMULARIO_E_MENUS/SUB-C01-01-01_OCR_E_CONFERENCIA`, `C02_Leitura/MOD-C02-01_LEITURA_E_ADAPTACAO`. O artefato e referenciado em mais de um endereco; o campo acima registra o endereco PRIMARIO. Nao e erro de endereco — e declaracao concorrente na propria Planta.
- **Divergencia com o espelho anterior:** o espelho antigo declarava o modulo `MOD-C00-01_INFRAESTRUTURA_CORE`; a derivacao atual chega a `C01_Entrada/MOD-C01-02_NORMALIZADOR_DE_EFETIVO`. Divergencia declarada, nao sobrescrita em silencio.
- **Nada foi corrigido no artefato:** o gerador nao altera codigo de produto; o arquivo de origem permanece byte a byte como estava.

## Última verificação (data/commit)

- 2026-09-13T21:45:11-03:00 · commit `fbb0608` · sha256 da origem (LF): `90cc795d250d4074a9d27777d893e7c5f729a32e7fa82692d2758ff84fdb5666`
- Reexecutar: `node scripts/downplant/espelho-rico.mjs gerar --endereco C01_Entrada/MOD-C01-02_NORMALIZADOR_DE_EFETIVO --origem Core/Utils.js --saida <caminho>`
- Verificar deriva sem regravar: `node scripts/downplant/espelho-rico.mjs verificar --espelho <caminho>`
