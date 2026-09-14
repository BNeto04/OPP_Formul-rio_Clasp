# ESPELHO — OcorrenciaFactory.js

> [!NOTE] Espelho rico de código (Metodo §46.15) — gerado por `scripts/downplant/espelho-rico.mjs`
> Somente leitura. Não editar à mão: qualquer edição é sobrescrita na próxima geração.
> O código abaixo é cópia verbatim do arquivo de origem no commit declarado; divergência entre o embutido e a origem é deriva (§18.1).
> Regra do sha256 declarado: sha256 do conteúdo **normalizado para LF** (igual ao blob do Git). Em arquivo CRLF com terminador final diferente, ele difere do `sha256sum` dos bytes crus — a comparação de deriva é feita conteúdo-contra-conteúdo.
> Papel desta cópia: CANÔNICA (repositório). O derivado navegável no vault é gerado com as mesmas entradas.

- **Endereço Down Plant:** `C03_Dominio / MOD-C03-01_MODELO_DE_OCORRENCIA` — [NOTA_DE_RESPONSABILIDADE.md](../../02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-01_MODELO_DE_OCORRENCIA/NOTA_DE_RESPONSABILIDADE.md)
- **Arquivo de origem (link para o disco):** [`Dominio/OcorrenciaFactory.js`](../../Dominio/OcorrenciaFactory.js)
- **Commit de referência:** `fbb0608e7b98144533628c7f9b773a10505b800d` (`fbb0608`)
- **Data da última sincronização:** 2026-09-13T21:45:20-03:00

## Código-fonte embutido

Verbatim de `Dominio/OcorrenciaFactory.js` em `fbb0608`. sha256 do bloco (LF): `8933873b12e5eaac4855c667ef4a28d21f933509128759923d563720e6c303b7` — 99 linhas.

```javascript
/**
 * ARQUIVO: Dominio/OcorrenciaFactory.js
 * RESPONSABILIDADE: Criar e validar a Ocorrência (Aggregate Root) isolando regras complexas de construção
 */

class OcorrenciaFactory {
  /**
   * Constrói e inicializa uma ocorrência válida a partir de dados brutos de entrada.
   * @param {Object} dados
   * @return {Ocorrencia}
   */
  static criar(dados) {
    if (!dados) {
      throw new ErroValidacaoDominio('OcorrenciaFactory', 'dados', 'Dados para criação não podem ser nulos');
    }

    // Cria o Value Object de ChaveOcorrencia para validação e geração da identidade imutável
    const chaveVO = new ChaveOcorrencia(dados.mike, dados.boe);

    // Resolve a função de conversão de data dependendo do contexto (Apps Script ou Node.js)
    let converterData = null;
    if (typeof converterDataUnificada !== 'undefined') {
      converterData = converterDataUnificada;
    } else if (typeof require !== 'undefined') {
      converterData = require('../Core/Datas').converterDataUnificada;
    }

    if (!converterData) {
      throw new Error('Função de conversão de data (converterDataUnificada) não encontrada.');
    }

    const dataConvertida = converterData(dados.data);
    if (!dataConvertida) {
      throw new ErroValidacaoDominio('OcorrenciaFactory', 'data', `A data fornecida é inválida: "${dados.data}"`);
    }

    const ocorrencia = new Ocorrencia(
      chaveVO.valor,
      dataConvertida,
      dados.cidade,
      dados.bairro
    );

    ocorrencia.mike = chaveVO.mike;
    ocorrencia.boe = chaveVO.boe;
    ocorrencia.hora = dados.hora ? String(dados.hora).trim() : null;
    ocorrencia.ais = dados.ais !== undefined && dados.ais !== null ? Number(dados.ais) : null;
    ocorrencia.detidos = Number(dados.detidos) || 0;
    ocorrencia.origemEntrada = dados.origemEntrada || 'MANUAL';

    // Adiciona Naturezas
    if (Array.isArray(dados.naturezas)) {
      dados.naturezas.forEach(n => ocorrencia.adicionarNatureza(n));
    } else if (dados.natureza) {
      ocorrencia.adicionarNatureza(dados.natureza);
    }

    return ocorrencia;
  }

  /**
   * Valida regras de negócio do Domínio e integridade da ocorrência.
   * @param {Ocorrencia} ocorrencia
   * @return {Object} { valido: boolean, erros: Array<string>, ocorrencia: Ocorrencia }
   */
  static validar(ocorrencia) {
    const erros = [];

    if (!ocorrencia) {
      return { valido: false, erros: ['Instância da ocorrência é nula ou indefinida'], ocorrencia };
    }

    if (!ocorrencia.data) {
      erros.push("Data da ocorrência é obrigatória.");
    }

    if (ocorrencia.equipe.quantidadeIntegrantes === 0) {
      erros.push("A ocorrência deve possuir pelo menos um policial militar na equipe.");
    }

    if (ocorrencia.naturezas.length === 0) {
      erros.push("A ocorrência deve possuir pelo menos uma natureza cadastrada.");
    }

    return {
      valido: erros.length === 0,
      erros,
      ocorrencia
    };
  }
}

// Para exportação no Node.js durante os testes locais
if (typeof module !== 'undefined' && module.exports) {
  const { ErroValidacaoDominio } = require('../Core/Erros');
  const { ChaveOcorrencia } = require('./ValueObjects/ChaveOcorrencia');
  const { Ocorrencia } = require('./Ocorrencia');
  module.exports = { OcorrenciaFactory };
}
```

## Responsabilidade observada

Fonte: `02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-01_MODELO_DE_OCORRENCIA/NOTA_DE_RESPONSABILIDADE.md` — NOTA_DE_RESPONSABILIDADE.md do modulo (fallback: primeiras linhas uteis; sem secao de papel/responsabilidade).

Responsabilidade canonica do modulo.
## Documentos do modulo

## Portas expostas (se aplicável)

- Superfície exposta no nível do arquivo (nível global): `OcorrenciaFactory`
- Membros públicos observados: `criar`, `validar`

_Extraído por heurística do gerador (globais de nível arquivo + métodos/accessors de 1º–2º nível). Não substitui a declaração de porta da Planta: confirme no endereço acima._

## Divergência com a Planta declarada

Testes mecânicos executados na geração (commit `fbb0608`, 2026-09-13T21:45:20-03:00):

- OK — T1 endereco existe: NOTA_DE_RESPONSABILIDADE.md do modulo presente
- OK — T3 arquivo presente no commit de referencia (fbb0608:Dominio/OcorrenciaFactory.js)
- OK — T4 conteudo em disco identico ao do commit de referencia (sha256 LF)
- OK — T5 espelho anterior sem deriva de codigo (sha256 do bloco == origem)
- OK — T6 endereco declarado no espelho anterior corresponde ao endereco canonico atual
- OK — T7 sem duplicidade: exatamente 1 espelho de leitura declara "Dominio/OcorrenciaFactory.js" como origem
- **ACHADO** — T2 artefato NAO declarado no endereco: "Dominio/OcorrenciaFactory.js" nao aparece nas NOTAS/capsula de C03_Dominio / MOD-C03-01_MODELO_DE_OCORRENCIA

Veredito mecânico: **1 divergência(s) detectada(s) pelos testes acima**.

Declaração verificada a mão por humano/agente (não derivável automaticamente):

- **Como o endereco foi derivado (nao inventado):** menção em arquivo do próprio endereço; fonte `02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-01_MODELO_DE_OCORRENCIA/CIR-MOD-C03-01_MODELO_DE_OCORRENCIA.canvas`.
- **Nada foi corrigido no artefato:** o gerador nao altera codigo de produto; o arquivo de origem permanece byte a byte como estava.

## Última verificação (data/commit)

- 2026-09-13T21:45:20-03:00 · commit `fbb0608` · sha256 da origem (LF): `8933873b12e5eaac4855c667ef4a28d21f933509128759923d563720e6c303b7`
- Reexecutar: `node scripts/downplant/espelho-rico.mjs gerar --endereco C03_Dominio/MOD-C03-01_MODELO_DE_OCORRENCIA --origem Dominio/OcorrenciaFactory.js --saida <caminho>`
- Verificar deriva sem regravar: `node scripts/downplant/espelho-rico.mjs verificar --espelho <caminho>`
