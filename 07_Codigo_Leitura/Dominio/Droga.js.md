# ESPELHO — Droga.js

> [!NOTE] Espelho rico de código (Metodo §46.15) — gerado por `scripts/downplant/espelho-rico.mjs`
> Somente leitura. Não editar à mão: qualquer edição é sobrescrita na próxima geração.
> O código abaixo é cópia verbatim do arquivo de origem no commit declarado; divergência entre o embutido e a origem é deriva (§18.1).
> Regra do sha256 declarado: sha256 do conteúdo **normalizado para LF** (igual ao blob do Git). Em arquivo CRLF com terminador final diferente, ele difere do `sha256sum` dos bytes crus — a comparação de deriva é feita conteúdo-contra-conteúdo.
> Papel desta cópia: CANÔNICA (repositório). O derivado navegável no vault é gerado com as mesmas entradas.

- **Endereço Down Plant:** `C03_Dominio / MOD-C03-01_MODELO_DE_OCORRENCIA` — [NOTA_DE_RESPONSABILIDADE.md](../../02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-01_MODELO_DE_OCORRENCIA/NOTA_DE_RESPONSABILIDADE.md)
- **Arquivo de origem (link para o disco):** [`Dominio/Droga.js`](../../Dominio/Droga.js)
- **Commit de referência:** `fbb0608e7b98144533628c7f9b773a10505b800d` (`fbb0608`)
- **Data da última sincronização:** 2026-09-13T21:45:17-03:00

## Código-fonte embutido

Verbatim de `Dominio/Droga.js` em `fbb0608`. sha256 do bloco (LF): `c06318e99a829e51217ad5739b9078f98cc1668d6fb073aa9eed598b19910e27` — 31 linhas.

```javascript
/**
 * ARQUIVO: Dominio/Droga.js
 * RESPONSABILIDADE: Representar o fato de uma apreensão de entorpecentes
 */

class Droga {
  constructor(tipo, quantidade, unidadeMedida = 'G') {
    if (!tipo || String(tipo).trim() === '') {
      throw new ErroValidacaoDominio('Droga', 'tipo', 'Tipo de droga é obrigatório');
    }

    const qtd = Number(quantidade);
    if (isNaN(qtd) || qtd <= 0) {
      throw new ErroValidacaoDominio('Droga', 'quantidade', 'Quantidade de drogas deve ser maior que zero');
    }

    this.tipo = String(tipo).trim().toUpperCase();
    this.quantidade = qtd;
    this.unidadeMedida = String(unidadeMedida).trim().toUpperCase();
    Object.freeze(this);
  }
}

// Para exportação no Node.js durante os testes locais
if (typeof module !== 'undefined' && module.exports) {
  if (typeof ErroValidacaoDominio === 'undefined') {
    global.ErroValidacaoDominio = require('../Core/Erros').ErroValidacaoDominio;
  }
  module.exports = { Droga };
}

```

## Responsabilidade observada

Fonte: `02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-01_MODELO_DE_OCORRENCIA/NOTA_DE_RESPONSABILIDADE.md` — NOTA_DE_RESPONSABILIDADE.md do modulo (fallback: primeiras linhas uteis; sem secao de papel/responsabilidade).

Responsabilidade canonica do modulo.
## Documentos do modulo

## Portas expostas (se aplicável)

- Superfície exposta no nível do arquivo (nível global): `Droga`
- Membros públicos observados: `constructor`

_Extraído por heurística do gerador (globais de nível arquivo + métodos/accessors de 1º–2º nível). Não substitui a declaração de porta da Planta: confirme no endereço acima._

## Divergência com a Planta declarada

Testes mecânicos executados na geração (commit `fbb0608`, 2026-09-13T21:45:17-03:00):

- OK — T1 endereco existe: NOTA_DE_RESPONSABILIDADE.md do modulo presente
- OK — T3 arquivo presente no commit de referencia (fbb0608:Dominio/Droga.js)
- OK — T4 conteudo em disco identico ao do commit de referencia (sha256 LF)
- OK — T5 espelho anterior sem deriva de codigo (sha256 do bloco == origem)
- OK — T6 endereco declarado no espelho anterior corresponde ao endereco canonico atual
- OK — T7 sem duplicidade: exatamente 1 espelho de leitura declara "Dominio/Droga.js" como origem
- **ACHADO** — T2 artefato NAO declarado no endereco: "Dominio/Droga.js" nao aparece nas NOTAS/capsula de C03_Dominio / MOD-C03-01_MODELO_DE_OCORRENCIA

Veredito mecânico: **1 divergência(s) detectada(s) pelos testes acima**.

Declaração verificada a mão por humano/agente (não derivável automaticamente):

- **Como o endereco foi derivado (nao inventado):** menção em arquivo do próprio endereço; fonte `02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-01_MODELO_DE_OCORRENCIA/CIR-MOD-C03-01_MODELO_DE_OCORRENCIA.canvas`.
- **Nada foi corrigido no artefato:** o gerador nao altera codigo de produto; o arquivo de origem permanece byte a byte como estava.

## Última verificação (data/commit)

- 2026-09-13T21:45:17-03:00 · commit `fbb0608` · sha256 da origem (LF): `c06318e99a829e51217ad5739b9078f98cc1668d6fb073aa9eed598b19910e27`
- Reexecutar: `node scripts/downplant/espelho-rico.mjs gerar --endereco C03_Dominio/MOD-C03-01_MODELO_DE_OCORRENCIA --origem Dominio/Droga.js --saida <caminho>`
- Verificar deriva sem regravar: `node scripts/downplant/espelho-rico.mjs verificar --espelho <caminho>`
