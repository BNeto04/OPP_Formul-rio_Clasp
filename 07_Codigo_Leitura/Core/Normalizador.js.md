# ESPELHO — Normalizador.js

> [!NOTE] Espelho rico de código (Metodo §46.15) — gerado por `scripts/downplant/espelho-rico.mjs`
> Somente leitura. Não editar à mão: qualquer edição é sobrescrita na próxima geração.
> O código abaixo é cópia verbatim do arquivo de origem no commit declarado; divergência entre o embutido e a origem é deriva (§18.1).
> Regra do sha256 declarado: sha256 do conteúdo **normalizado para LF** (igual ao blob do Git). Em arquivo CRLF com terminador final diferente, ele difere do `sha256sum` dos bytes crus — a comparação de deriva é feita conteúdo-contra-conteúdo.
> Papel desta cópia: CANÔNICA (repositório). O derivado navegável no vault é gerado com as mesmas entradas.

- **Endereço Down Plant:** `C02_Leitura / MOD-C02-01_LEITURA_E_ADAPTACAO` — [NOTA_DE_RESPONSABILIDADE.md](../../02_Comodos/C02_Leitura/01_Dominio/modulos/MOD-C02-01_LEITURA_E_ADAPTACAO/NOTA_DE_RESPONSABILIDADE.md)
- **Arquivo de origem (link para o disco):** [`Core/Normalizador.js`](../../Core/Normalizador.js)
- **Commit de referência:** `fbb0608e7b98144533628c7f9b773a10505b800d` (`fbb0608`)
- **Data da última sincronização:** 2026-09-13T21:45:08-03:00

## Código-fonte embutido

Verbatim de `Core/Normalizador.js` em `fbb0608`. sha256 do bloco (LF): `ab56a70fb2b038b43dfa27789d5f132b95b05d1631be14020e7f6a2f11b15f2a` — 66 linhas.

```javascript
/**
 * Normalizador central de dados do ecossistema SYNTHÉON.
 */
const SyntheonNormalizador = {
  /**
   * Normaliza graduações de policiais para siglas padronizadas.
   * @param {string} rawGrad
   * @return {string}
   */
  normalizarGraduacao(rawGrad) {
    const limpo = SyntheonUtils.normalizarTexto(rawGrad);
    const chaveSemOrdinal = this.normalizarChaveGraduacao(limpo);
    return CONSTANTES_SYNTHEON.GRADUACOES[limpo]
      || CONSTANTES_SYNTHEON.GRADUACOES[chaveSemOrdinal]
      || limpo
      || 'N/I';
  },

  normalizarChaveGraduacao(valor) {
    return SyntheonUtils.normalizarTexto(valor)
      .replace(/[º°ª]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  },

  /**
   * Normaliza a identificação de pelotões / escalas (ex: "1ºPEL" -> "1º PEL").
   * @param {string} rawPel
   * @return {string}
   */
  normalizarPelotao(rawPel) {
    let limpo = SyntheonUtils.normalizarTexto(rawPel);
    if (!limpo) return 'N/I';

    // 1. Checa variações de GTAR primeiro (ex: "1º PEL GTAR", "2º PEL GTAR", "GTAR")
    if (limpo.includes('GTAR')) {
      if (limpo.includes('1')) return '1º PEL GTAR';
      if (limpo.includes('2')) return '2º PEL GTAR';
      return 'GTAR';
    }

    // 2. Checa Pelotões comuns
    if (/^1[º°O]?\s*PEL/i.test(limpo) || /^PEL\s*1/i.test(limpo)) {
      return '1º PEL';
    }
    if (/^2[º°O]?\s*PEL/i.test(limpo) || /^PEL\s*2/i.test(limpo)) {
      return '2º PEL';
    }
    if (/^3[º°O]?\s*PEL/i.test(limpo) || /^PEL\s*3/i.test(limpo)) {
      return '3º PEL';
    }
    if (limpo.includes('OFICIAIS')) {
      return 'OFICIAIS';
    }
    if (limpo.includes('CPM')) {
      return 'CPM';
    }

    return limpo;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SyntheonNormalizador;
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

- Superfície exposta no nível do arquivo (nível global): `SyntheonNormalizador`
- Membros públicos observados: `normalizarGraduacao`, `normalizarChaveGraduacao`, `normalizarPelotao`

_Extraído por heurística do gerador (globais de nível arquivo + métodos/accessors de 1º–2º nível). Não substitui a declaração de porta da Planta: confirme no endereço acima._

## Divergência com a Planta declarada

Testes mecânicos executados na geração (commit `fbb0608`, 2026-09-13T21:45:08-03:00):

- OK — T1 endereco existe: NOTA_DE_RESPONSABILIDADE.md do modulo presente
- OK — T3 arquivo presente no commit de referencia (fbb0608:Core/Normalizador.js)
- OK — T4 conteudo em disco identico ao do commit de referencia (sha256 LF)
- OK — T5 espelho anterior sem deriva de codigo (sha256 do bloco == origem)
- OK — T6 endereco declarado no espelho anterior corresponde ao endereco canonico atual
- OK — T7 sem duplicidade: exatamente 1 espelho de leitura declara "Core/Normalizador.js" como origem
- **ACHADO** — T2 artefato NAO declarado no endereco: "Core/Normalizador.js" nao aparece nas NOTAS/capsula de C02_Leitura / MOD-C02-01_LEITURA_E_ADAPTACAO

Veredito mecânico: **1 divergência(s) detectada(s) pelos testes acima**.

Declaração verificada a mão por humano/agente (não derivável automaticamente):

- **Como o endereco foi derivado (nao inventado):** menção em arquivo do próprio endereço; fonte `02_Comodos/C02_Leitura/01_Dominio/modulos/MOD-C02-01_LEITURA_E_ADAPTACAO/CIR-MOD-C02-01_LEITURA_E_ADAPTACAO.canvas`.
- **Ponteiro anterior para elemento PARADO:** o espelho de leitura anterior apontava para `_SUP_158/C00_Governanca_Estrutural/01_Dominio/modulos/MOD-C00-01_INFRAESTRUTURA_CORE`, elemento arquivado no card #158 (sem lastro em nenhuma ref do repo). O endereco acima NAO e uma renomeacao daquele: foi derivado da declaracao do artefato na Planta (medido em `MAPA_ARTEFATO_ENDERECO_162.md`).
- **Enderecos concorrentes declarados na Planta (1):** `C05_Guardiao/MOD-C05-02_NORMALIZADOR_DE_ABA`. O artefato e referenciado em mais de um endereco; o campo acima registra o endereco PRIMARIO. Nao e erro de endereco — e declaracao concorrente na propria Planta.
- **Divergencia com o espelho anterior:** o espelho antigo declarava o modulo `MOD-C00-01_INFRAESTRUTURA_CORE`; a derivacao atual chega a `C02_Leitura/MOD-C02-01_LEITURA_E_ADAPTACAO`. Divergencia declarada, nao sobrescrita em silencio.
- **Nada foi corrigido no artefato:** o gerador nao altera codigo de produto; o arquivo de origem permanece byte a byte como estava.

## Última verificação (data/commit)

- 2026-09-13T21:45:08-03:00 · commit `fbb0608` · sha256 da origem (LF): `ab56a70fb2b038b43dfa27789d5f132b95b05d1631be14020e7f6a2f11b15f2a`
- Reexecutar: `node scripts/downplant/espelho-rico.mjs gerar --endereco C02_Leitura/MOD-C02-01_LEITURA_E_ADAPTACAO --origem Core/Normalizador.js --saida <caminho>`
- Verificar deriva sem regravar: `node scripts/downplant/espelho-rico.mjs verificar --espelho <caminho>`
