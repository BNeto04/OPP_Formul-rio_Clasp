# ESPELHO — Policial.js

> [!NOTE] Espelho rico de código (Metodo §46.15) — gerado por `scripts/downplant/espelho-rico.mjs`
> Somente leitura. Não editar à mão: qualquer edição é sobrescrita na próxima geração.
> O código abaixo é cópia verbatim do arquivo de origem no commit declarado; divergência entre o embutido e a origem é deriva (§18.1).
> Regra do sha256 declarado: sha256 do conteúdo **normalizado para LF** (igual ao blob do Git). Em arquivo CRLF com terminador final diferente, ele difere do `sha256sum` dos bytes crus — a comparação de deriva é feita conteúdo-contra-conteúdo.
> Papel desta cópia: CANÔNICA (repositório). O derivado navegável no vault é gerado com as mesmas entradas.

- **Endereço Down Plant:** `C03_Dominio / MOD-C03-01_MODELO_DE_OCORRENCIA` — [NOTA_DE_RESPONSABILIDADE.md](../../02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-01_MODELO_DE_OCORRENCIA/NOTA_DE_RESPONSABILIDADE.md)
- **Arquivo de origem (link para o disco):** [`Dominio/Policial.js`](../../Dominio/Policial.js)
- **Commit de referência:** `fbb0608e7b98144533628c7f9b773a10505b800d` (`fbb0608`)
- **Data da última sincronização:** 2026-09-13T21:45:21-03:00

## Código-fonte embutido

Verbatim de `Dominio/Policial.js` em `fbb0608`. sha256 do bloco (LF): `79a30e6f493a7bafc35f071c05d332d841e154551cf494cdf590869d049a3bb5` — 38 linhas.

```javascript
/**
 * ARQUIVO: Dominio/Policial.js
 * RESPONSABILIDADE: Representar a entidade de Domínio Policial
 */

class Policial {
  constructor(matricula, nome, graduacao, pelotao) {
    if (!matricula || String(matricula).trim() === '') {
      throw new ErroValidacaoDominio('Policial', 'matricula', 'Matrícula é obrigatória e não pode ser vazia');
    }
    
    // Limpeza intrínseca da matrícula (somente dígitos)
    this.matricula = String(matricula).replace(/\D/g, '').trim();
    if (this.matricula === '') {
      throw new ErroValidacaoDominio('Policial', 'matricula', 'Matrícula deve conter caracteres numéricos válidos');
    }

    this.nome = nome ? String(nome).trim().toUpperCase() : 'N/I';
    this.graduacao = graduacao ? String(graduacao).trim().toUpperCase() : 'N/I';
    this.pelotao = pelotao ? String(pelotao).trim().toUpperCase() : 'N/I';
  }

  /**
   * Compara se este policial é igual a outro com base na matrícula funcional.
   * @param {Policial} outro
   * @return {boolean}
   */
  equals(outro) {
    if (!outro || !(outro instanceof Policial)) return false;
    return this.matricula === outro.matricula;
  }
}

// Para exportação no Node.js durante os testes locais
if (typeof module !== 'undefined' && module.exports) {
  const { ErroValidacaoDominio } = require('../Core/Erros');
  module.exports = { Policial };
}
```

## Responsabilidade observada

Fonte: `02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-01_MODELO_DE_OCORRENCIA/NOTA_DE_RESPONSABILIDADE.md` — NOTA_DE_RESPONSABILIDADE.md do modulo (fallback: primeiras linhas uteis; sem secao de papel/responsabilidade).

Responsabilidade canonica do modulo.
## Documentos do modulo

## Portas expostas (se aplicável)

- Superfície exposta no nível do arquivo (nível global): `Policial`
- Membros públicos observados: `constructor`, `equals`

_Extraído por heurística do gerador (globais de nível arquivo + métodos/accessors de 1º–2º nível). Não substitui a declaração de porta da Planta: confirme no endereço acima._

## Divergência com a Planta declarada

Testes mecânicos executados na geração (commit `fbb0608`, 2026-09-13T21:45:21-03:00):

- OK — T1 endereco existe: NOTA_DE_RESPONSABILIDADE.md do modulo presente
- OK — T3 arquivo presente no commit de referencia (fbb0608:Dominio/Policial.js)
- OK — T4 conteudo em disco identico ao do commit de referencia (sha256 LF)
- OK — T5 espelho anterior sem deriva de codigo (sha256 do bloco == origem)
- OK — T6 endereco declarado no espelho anterior corresponde ao endereco canonico atual
- OK — T7 sem duplicidade: exatamente 1 espelho de leitura declara "Dominio/Policial.js" como origem
- **ACHADO** — T2 artefato NAO declarado no endereco: "Dominio/Policial.js" nao aparece nas NOTAS/capsula de C03_Dominio / MOD-C03-01_MODELO_DE_OCORRENCIA

Veredito mecânico: **1 divergência(s) detectada(s) pelos testes acima**.

Declaração verificada a mão por humano/agente (não derivável automaticamente):

- **Como o endereco foi derivado (nao inventado):** menção em arquivo do próprio endereço; fonte `02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-01_MODELO_DE_OCORRENCIA/CIR-MOD-C03-01_MODELO_DE_OCORRENCIA.canvas`.
- **Nada foi corrigido no artefato:** o gerador nao altera codigo de produto; o arquivo de origem permanece byte a byte como estava.

## Última verificação (data/commit)

- 2026-09-13T21:45:21-03:00 · commit `fbb0608` · sha256 da origem (LF): `79a30e6f493a7bafc35f071c05d332d841e154551cf494cdf590869d049a3bb5`
- Reexecutar: `node scripts/downplant/espelho-rico.mjs gerar --endereco C03_Dominio/MOD-C03-01_MODELO_DE_OCORRENCIA --origem Dominio/Policial.js --saida <caminho>`
- Verificar deriva sem regravar: `node scripts/downplant/espelho-rico.mjs verificar --espelho <caminho>`
