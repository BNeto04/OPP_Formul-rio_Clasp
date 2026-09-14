# ESPELHO — ChaveOcorrencia.js

> [!NOTE] Espelho rico de código (Metodo §46.15) — gerado por `scripts/downplant/espelho-rico.mjs`
> Somente leitura. Não editar à mão: qualquer edição é sobrescrita na próxima geração.
> O código abaixo é cópia verbatim do arquivo de origem no commit declarado; divergência entre o embutido e a origem é deriva (§18.1).
> Regra do sha256 declarado: sha256 do conteúdo **normalizado para LF** (igual ao blob do Git). Em arquivo CRLF com terminador final diferente, ele difere do `sha256sum` dos bytes crus — a comparação de deriva é feita conteúdo-contra-conteúdo.
> Papel desta cópia: CANÔNICA (repositório). O derivado navegável no vault é gerado com as mesmas entradas.

- **Endereço Down Plant:** `C03_Dominio / MOD-C03-01_MODELO_DE_OCORRENCIA` — [NOTA_DE_RESPONSABILIDADE.md](../../../02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-01_MODELO_DE_OCORRENCIA/NOTA_DE_RESPONSABILIDADE.md)
- **Arquivo de origem (link para o disco):** [`Dominio/ValueObjects/ChaveOcorrencia.js`](../../../Dominio/ValueObjects/ChaveOcorrencia.js)
- **Commit de referência:** `fbb0608e7b98144533628c7f9b773a10505b800d` (`fbb0608`)
- **Data da última sincronização:** 2026-09-13T21:45:24-03:00

## Código-fonte embutido

Verbatim de `Dominio/ValueObjects/ChaveOcorrencia.js` em `fbb0608`. sha256 do bloco (LF): `3e5c9937715a32d3d44c3e572fa01b9c2bc354085cfff043ad05d3bf6b63f6a8` — 49 linhas.

```javascript
/**
 * ARQUIVO: Dominio/ValueObjects/ChaveOcorrencia.js
 * RESPONSABILIDADE: Representar o Value Object identificador de uma ocorrência (Mike/Boe)
 */

class ChaveOcorrencia {
  constructor(mike, boe) {
    this.mike = mike ? String(mike).trim().toUpperCase() : null;
    this.boe = boe ? String(boe).trim().toUpperCase() : null;

    if (!this.mike && !this.boe) {
      throw new ErroValidacaoDominio('ChaveOcorrencia', 'identificador', 'A ocorrência precisa ter pelo menos um número identificador (MIKE ou BOE)');
    }

    this.valor = this.gerar();
    
    // Congela a instância para garantir a imutabilidade do Value Object
    Object.freeze(this);
  }

  /**
   * Gera a representação string única da chave da ocorrência.
   * @return {string}
   */
  gerar() {
    return `${this.mike || 'SEM-MIKE'}|${this.boe || 'SEM-BOE'}`;
  }

  /**
   * Reconstrói o Value Object a partir de sua representação string.
   * @param {string} chaveStr
   * @return {ChaveOcorrencia}
   */
  static fromString(chaveStr) {
    if (!chaveStr || typeof chaveStr !== 'string') {
      throw new ErroValidacaoDominio('ChaveOcorrencia', 'chaveStr', 'Chave string inválida para parse');
    }
    const partes = chaveStr.split('|');
    const mike = partes[0] === 'SEM-MIKE' ? null : partes[0];
    const boe = partes[1] === 'SEM-BOE' ? null : partes[1];
    return new ChaveOcorrencia(mike, boe);
  }
}

// Para exportação no Node.js durante os testes locais
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ChaveOcorrencia };
}

```

## Responsabilidade observada

Fonte: `02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-01_MODELO_DE_OCORRENCIA/NOTA_DE_RESPONSABILIDADE.md` — NOTA_DE_RESPONSABILIDADE.md do modulo (fallback: primeiras linhas uteis; sem secao de papel/responsabilidade).

Responsabilidade canonica do modulo.
## Documentos do modulo

## Portas expostas (se aplicável)

- Superfície exposta no nível do arquivo (nível global): `ChaveOcorrencia`
- Membros públicos observados: `constructor`, `gerar`, `fromString`

_Extraído por heurística do gerador (globais de nível arquivo + métodos/accessors de 1º–2º nível). Não substitui a declaração de porta da Planta: confirme no endereço acima._

## Divergência com a Planta declarada

Testes mecânicos executados na geração (commit `fbb0608`, 2026-09-13T21:45:24-03:00):

- OK — T1 endereco existe: NOTA_DE_RESPONSABILIDADE.md do modulo presente
- OK — T3 arquivo presente no commit de referencia (fbb0608:Dominio/ValueObjects/ChaveOcorrencia.js)
- OK — T4 conteudo em disco identico ao do commit de referencia (sha256 LF)
- OK — T5 espelho anterior sem deriva de codigo (sha256 do bloco == origem)
- OK — T6 endereco declarado no espelho anterior corresponde ao endereco canonico atual
- OK — T7 sem duplicidade: exatamente 1 espelho de leitura declara "Dominio/ValueObjects/ChaveOcorrencia.js" como origem
- **ACHADO** — T2 artefato NAO declarado no endereco: "Dominio/ValueObjects/ChaveOcorrencia.js" nao aparece nas NOTAS/capsula de C03_Dominio / MOD-C03-01_MODELO_DE_OCORRENCIA

Veredito mecânico: **1 divergência(s) detectada(s) pelos testes acima**.

Declaração verificada a mão por humano/agente (não derivável automaticamente):

- **Como o endereco foi derivado (nao inventado):** menção em arquivo do próprio endereço; fonte `02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-01_MODELO_DE_OCORRENCIA/CIR-MOD-C03-01_MODELO_DE_OCORRENCIA.canvas`.
- **Nada foi corrigido no artefato:** o gerador nao altera codigo de produto; o arquivo de origem permanece byte a byte como estava.

## Última verificação (data/commit)

- 2026-09-13T21:45:24-03:00 · commit `fbb0608` · sha256 da origem (LF): `3e5c9937715a32d3d44c3e572fa01b9c2bc354085cfff043ad05d3bf6b63f6a8`
- Reexecutar: `node scripts/downplant/espelho-rico.mjs gerar --endereco C03_Dominio/MOD-C03-01_MODELO_DE_OCORRENCIA --origem Dominio/ValueObjects/ChaveOcorrencia.js --saida <caminho>`
- Verificar deriva sem regravar: `node scripts/downplant/espelho-rico.mjs verificar --espelho <caminho>`
