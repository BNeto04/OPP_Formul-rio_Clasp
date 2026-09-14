# ESPELHO — Equipe.js

> [!NOTE] Espelho rico de código (Metodo §46.15) — gerado por `scripts/downplant/espelho-rico.mjs`
> Somente leitura. Não editar à mão: qualquer edição é sobrescrita na próxima geração.
> O código abaixo é cópia verbatim do arquivo de origem no commit declarado; divergência entre o embutido e a origem é deriva (§18.1).
> Regra do sha256 declarado: sha256 do conteúdo **normalizado para LF** (igual ao blob do Git). Em arquivo CRLF com terminador final diferente, ele difere do `sha256sum` dos bytes crus — a comparação de deriva é feita conteúdo-contra-conteúdo.
> Papel desta cópia: CANÔNICA (repositório). O derivado navegável no vault é gerado com as mesmas entradas.

- **Endereço Down Plant:** `C03_Dominio / MOD-C03-01_MODELO_DE_OCORRENCIA` — [NOTA_DE_RESPONSABILIDADE.md](../../02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-01_MODELO_DE_OCORRENCIA/NOTA_DE_RESPONSABILIDADE.md)
- **Arquivo de origem (link para o disco):** [`Dominio/Equipe.js`](../../Dominio/Equipe.js)
- **Commit de referência:** `fbb0608e7b98144533628c7f9b773a10505b800d` (`fbb0608`)
- **Data da última sincronização:** 2026-09-13T21:45:18-03:00

## Código-fonte embutido

Verbatim de `Dominio/Equipe.js` em `fbb0608`. sha256 do bloco (LF): `181c487709fe7d3280d9ed7d1aed230349127da91598ff1c1503915426927cc5` — 48 linhas.

```javascript
/**
 * ARQUIVO: Dominio/Equipe.js
 * RESPONSABILIDADE: Agregar e gerenciar a lista de policiais na ocorrência sem duplicidades
 */

class Equipe {
  constructor() {
    this.policiais = [];
  }

  /**
   * Adiciona um policial à equipe caso ele não esteja cadastrado (comparação por matrícula).
   * @param {Policial} policial
   */
  adicionarPolicial(policial) {
    if (!policial || !(policial instanceof Policial)) {
      throw new ErroValidacaoDominio('Equipe', 'policial', 'Deve ser uma instância válida de Policial');
    }
    
    const jaExiste = this.policiais.some(p => p.equals(policial));
    if (!jaExiste) {
      this.policiais.push(policial);
    }
  }

  /**
   * Retorna uma cópia da lista de policiais.
   * @return {Array<Policial>}
   */
  obterPoliciais() {
    return [...this.policiais];
  }

  /**
   * Retorna a quantidade de policiais na equipe.
   * @return {number}
   */
  get quantidadeIntegrantes() {
    return this.policiais.length;
  }
}

// Para exportação no Node.js durante os testes locais
if (typeof module !== 'undefined' && module.exports) {
  const { ErroValidacaoDominio } = require('../Core/Erros');
  const { Policial } = require('./Policial');
  module.exports = { Equipe };
}
```

## Responsabilidade observada

Fonte: `02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-01_MODELO_DE_OCORRENCIA/NOTA_DE_RESPONSABILIDADE.md` — NOTA_DE_RESPONSABILIDADE.md do modulo (fallback: primeiras linhas uteis; sem secao de papel/responsabilidade).

Responsabilidade canonica do modulo.
## Documentos do modulo

## Portas expostas (se aplicável)

- Superfície exposta no nível do arquivo (nível global): `Equipe`
- Membros públicos observados: `quantidadeIntegrantes`, `constructor`, `adicionarPolicial`, `obterPoliciais`

_Extraído por heurística do gerador (globais de nível arquivo + métodos/accessors de 1º–2º nível). Não substitui a declaração de porta da Planta: confirme no endereço acima._

## Divergência com a Planta declarada

Testes mecânicos executados na geração (commit `fbb0608`, 2026-09-13T21:45:18-03:00):

- OK — T1 endereco existe: NOTA_DE_RESPONSABILIDADE.md do modulo presente
- OK — T3 arquivo presente no commit de referencia (fbb0608:Dominio/Equipe.js)
- OK — T4 conteudo em disco identico ao do commit de referencia (sha256 LF)
- OK — T5 espelho anterior sem deriva de codigo (sha256 do bloco == origem)
- OK — T6 endereco declarado no espelho anterior corresponde ao endereco canonico atual
- OK — T7 sem duplicidade: exatamente 1 espelho de leitura declara "Dominio/Equipe.js" como origem
- **ACHADO** — T2 artefato NAO declarado no endereco: "Dominio/Equipe.js" nao aparece nas NOTAS/capsula de C03_Dominio / MOD-C03-01_MODELO_DE_OCORRENCIA

Veredito mecânico: **1 divergência(s) detectada(s) pelos testes acima**.

Declaração verificada a mão por humano/agente (não derivável automaticamente):

- **Como o endereco foi derivado (nao inventado):** menção em arquivo do próprio endereço; fonte `02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-01_MODELO_DE_OCORRENCIA/CIR-MOD-C03-01_MODELO_DE_OCORRENCIA.canvas`.
- **Nada foi corrigido no artefato:** o gerador nao altera codigo de produto; o arquivo de origem permanece byte a byte como estava.

## Última verificação (data/commit)

- 2026-09-13T21:45:18-03:00 · commit `fbb0608` · sha256 da origem (LF): `181c487709fe7d3280d9ed7d1aed230349127da91598ff1c1503915426927cc5`
- Reexecutar: `node scripts/downplant/espelho-rico.mjs gerar --endereco C03_Dominio/MOD-C03-01_MODELO_DE_OCORRENCIA --origem Dominio/Equipe.js --saida <caminho>`
- Verificar deriva sem regravar: `node scripts/downplant/espelho-rico.mjs verificar --espelho <caminho>`
