# ESPELHO — Validador.js

> [!NOTE] Espelho rico de código (Metodo §46.15) — gerado por `scripts/downplant/espelho-rico.mjs`
> Somente leitura. Não editar à mão: qualquer edição é sobrescrita na próxima geração.
> O código abaixo é cópia verbatim do arquivo de origem no commit declarado; divergência entre o embutido e a origem é deriva (§18.1).
> Regra do sha256 declarado: sha256 do conteúdo **normalizado para LF** (igual ao blob do Git). Em arquivo CRLF com terminador final diferente, ele difere do `sha256sum` dos bytes crus — a comparação de deriva é feita conteúdo-contra-conteúdo.
> Papel desta cópia: CANÔNICA (repositório). O derivado navegável no vault é gerado com as mesmas entradas.

- **Endereço Down Plant:** `C02_Leitura / MOD-C02-01_LEITURA_E_ADAPTACAO` — [NOTA_DE_RESPONSABILIDADE.md](../../02_Comodos/C02_Leitura/01_Dominio/modulos/MOD-C02-01_LEITURA_E_ADAPTACAO/NOTA_DE_RESPONSABILIDADE.md)
- **Arquivo de origem (link para o disco):** [`Core/Validador.js`](../../Core/Validador.js)
- **Commit de referência:** `fbb0608e7b98144533628c7f9b773a10505b800d` (`fbb0608`)
- **Data da última sincronização:** 2026-09-13T21:45:11-03:00

## Código-fonte embutido

Verbatim de `Core/Validador.js` em `fbb0608`. sha256 do bloco (LF): `31de95f192bfec92c4e4f5b462be742178c24aea0d78b40c8dd60cc72c4086e6` — 33 linhas.

```javascript
/**
 * Validador central de dados do ecossistema SYNTHÉON.
 */
const SyntheonValidador = {
  /**
   * Valida se a matrícula é numérica e possui formato correto.
   * @param {string} matricula
   * @return {boolean}
   */
  validarMatricula(matricula) {
    if (!matricula) return false;
    return /^\d+$/.test(matricula);
  },

  /**
   * Valida se o objeto Date gerado é válido e coerente.
   * @param {Date} date
   * @return {boolean}
   */
  validarData(date) {
    if (!date || !(date instanceof Date)) return false;
    return !isNaN(date.getTime());
  },

  /**
   * Valida se as quantidades físicas de armas ou entorpecentes não são negativas.
   * @param {number} valor
   * @return {boolean}
   */
  validarQuantidadeNaoNegativa(valor) {
    return valor >= 0;
  }
};
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

- Superfície exposta no nível do arquivo (nível global): `SyntheonValidador`
- Membros públicos observados: `validarMatricula`, `validarData`, `validarQuantidadeNaoNegativa`

_Extraído por heurística do gerador (globais de nível arquivo + métodos/accessors de 1º–2º nível). Não substitui a declaração de porta da Planta: confirme no endereço acima._

## Divergência com a Planta declarada

Testes mecânicos executados na geração (commit `fbb0608`, 2026-09-13T21:45:11-03:00):

- OK — T1 endereco existe: NOTA_DE_RESPONSABILIDADE.md do modulo presente
- OK — T3 arquivo presente no commit de referencia (fbb0608:Core/Validador.js)
- OK — T4 conteudo em disco identico ao do commit de referencia (sha256 LF)
- OK — T5 espelho anterior sem deriva de codigo (sha256 do bloco == origem)
- OK — T6 endereco declarado no espelho anterior corresponde ao endereco canonico atual
- OK — T7 sem duplicidade: exatamente 1 espelho de leitura declara "Core/Validador.js" como origem
- **ACHADO** — T2 artefato NAO declarado no endereco: "Core/Validador.js" nao aparece nas NOTAS/capsula de C02_Leitura / MOD-C02-01_LEITURA_E_ADAPTACAO

Veredito mecânico: **1 divergência(s) detectada(s) pelos testes acima**.

Declaração verificada a mão por humano/agente (não derivável automaticamente):

- **Como o endereco foi derivado (nao inventado):** menção em arquivo do próprio endereço; fonte `02_Comodos/C02_Leitura/01_Dominio/modulos/MOD-C02-01_LEITURA_E_ADAPTACAO/CIR-MOD-C02-01_LEITURA_E_ADAPTACAO.canvas`.
- **Ponteiro anterior para elemento PARADO:** o espelho de leitura anterior apontava para `_SUP_158/C00_Governanca_Estrutural/01_Dominio/modulos/MOD-C00-01_INFRAESTRUTURA_CORE`, elemento arquivado no card #158 (sem lastro em nenhuma ref do repo). O endereco acima NAO e uma renomeacao daquele: foi derivado da declaracao do artefato na Planta (medido em `MAPA_ARTEFATO_ENDERECO_162.md`).
- **Divergencia com o espelho anterior:** o espelho antigo declarava o modulo `MOD-C00-01_INFRAESTRUTURA_CORE`; a derivacao atual chega a `C02_Leitura/MOD-C02-01_LEITURA_E_ADAPTACAO`. Divergencia declarada, nao sobrescrita em silencio.
- **Nada foi corrigido no artefato:** o gerador nao altera codigo de produto; o arquivo de origem permanece byte a byte como estava.

## Última verificação (data/commit)

- 2026-09-13T21:45:11-03:00 · commit `fbb0608` · sha256 da origem (LF): `31de95f192bfec92c4e4f5b462be742178c24aea0d78b40c8dd60cc72c4086e6`
- Reexecutar: `node scripts/downplant/espelho-rico.mjs gerar --endereco C02_Leitura/MOD-C02-01_LEITURA_E_ADAPTACAO --origem Core/Validador.js --saida <caminho>`
- Verificar deriva sem regravar: `node scripts/downplant/espelho-rico.mjs verificar --espelho <caminho>`
