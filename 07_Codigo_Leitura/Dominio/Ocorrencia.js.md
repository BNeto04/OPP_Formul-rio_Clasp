# ESPELHO — Ocorrencia.js

> [!NOTE] Espelho rico de código (Metodo §46.15) — gerado por `scripts/downplant/espelho-rico.mjs`
> Somente leitura. Não editar à mão: qualquer edição é sobrescrita na próxima geração.
> O código abaixo é cópia verbatim do arquivo de origem no commit declarado; divergência entre o embutido e a origem é deriva (§18.1).
> Regra do sha256 declarado: sha256 do conteúdo **normalizado para LF** (igual ao blob do Git). Em arquivo CRLF com terminador final diferente, ele difere do `sha256sum` dos bytes crus — a comparação de deriva é feita conteúdo-contra-conteúdo.
> Papel desta cópia: CANÔNICA (repositório). O derivado navegável no vault é gerado com as mesmas entradas.

- **Endereço Down Plant:** `C03_Dominio / MOD-C03-01_MODELO_DE_OCORRENCIA` — [NOTA_DE_RESPONSABILIDADE.md](../../02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-01_MODELO_DE_OCORRENCIA/NOTA_DE_RESPONSABILIDADE.md)
- **Arquivo de origem (link para o disco):** [`Dominio/Ocorrencia.js`](../../Dominio/Ocorrencia.js)
- **Commit de referência:** `fbb0608e7b98144533628c7f9b773a10505b800d` (`fbb0608`)
- **Data da última sincronização:** 2026-09-13T21:45:20-03:00

## Código-fonte embutido

Verbatim de `Dominio/Ocorrencia.js` em `fbb0608`. sha256 do bloco (LF): `ffe7eb7bd0e090788ea2fc9e157613ea3c54ae4b890977cd192e9676eedad3d3` — 123 linhas.

```javascript
/**
 * ARQUIVO: Dominio/Ocorrencia.js
 * RESPONSABILIDADE: Agregar e manter a consistência do Aggregate Root Ocorrência
 */

class Ocorrencia {
  constructor(chave, data, cidade, bairro) {
    if (!chave) {
      throw new ErroValidacaoDominio('Ocorrencia', 'chave', 'Chave da ocorrência é obrigatória');
    }
    if (!data || !(data instanceof Date) || isNaN(data.getTime())) {
      throw new ErroValidacaoDominio('Ocorrencia', 'data', 'Data da ocorrência deve ser uma instância válida de Date');
    }

    this.chave = chave; // Identidade única (imutável)
    Object.freeze(this.chave);

    this.data = data;
    this.cidade = cidade ? String(cidade).trim().toUpperCase() : 'N/I';
    this.bairro = bairro ? String(bairro).trim().toUpperCase() : 'N/I';

    this.mike = null;
    this.boe = null;
    this.hora = null;
    this.ais = null;
    this.detidos = 0;
    this.origemEntrada = 'MANUAL';

    this.naturezas = [];
    this.equipe = new Equipe();
    this.armas = [];
    this.drogas = [];
    this.itensApreendidos = [];

    this.timestampCriacao = new Date().toISOString();
    this.ultimaAtualizacao = this.timestampCriacao;
  }

  adicionarNatureza(natureza) {
    if (natureza) {
      const natLimpa = String(natureza).trim().toUpperCase();
      if (!this.naturezas.includes(natLimpa)) {
        this.naturezas.push(natLimpa);
      }
    }
    this._atualizarTimestamp();
  }

  adicionarPolicial(policial) {
    this.equipe.adicionarPolicial(policial);
    this._atualizarTimestamp();
  }

  adicionarArma(arma) {
    if (!(arma instanceof Arma)) {
      throw new ErroValidacaoDominio('Ocorrencia', 'arma', 'Deve ser uma instância válida de Arma');
    }
    this.armas.push(arma);
    this._adicionarItemApreendido('ARMA', arma);
    this._atualizarTimestamp();
  }

  adicionarDroga(droga) {
    if (!(droga instanceof Droga)) {
      throw new ErroValidacaoDominio('Ocorrencia', 'droga', 'Deve ser uma instância válida de Droga');
    }
    this.drogas.push(droga);
    this._adicionarItemApreendido('DROGA', droga);
    this._atualizarTimestamp();
  }

  _adicionarItemApreendido(tipo, instancia) {
    this.itensApreendidos.push({
      tipo,
      instancia,
      timestamp: new Date().toISOString()
    });
  }

  _atualizarTimestamp() {
    this.ultimaAtualizacao = new Date().toISOString();
  }

  obterChave() {
    return this.chave;
  }

  toJSON() {
    return {
      chave: this.chave,
      data: this.data.toISOString(),
      cidade: this.cidade,
      bairro: this.bairro,
      mike: this.mike,
      boe: this.boe,
      hora: this.hora,
      ais: this.ais,
      detidos: this.detidos,
      origemEntrada: this.origemEntrada,
      naturezas: this.naturezas,
      policiais: this.equipe.obterPoliciais().map(p => ({
        matricula: p.matricula,
        nome: p.nome,
        graduacao: p.graduacao,
        pelotao: p.pelotao
      })),
      armas: this.armas.map(a => ({ tipo: a.tipo, quantidade: a.quantidade, calibre: a.calibre })),
      drogas: this.drogas.map(d => ({ tipo: d.tipo, quantidade: d.quantidade, unidadeMedida: d.unidadeMedida })),
      itensApreendidos: this.itensApreendidos,
      timestampCriacao: this.timestampCriacao,
      ultimaAtualizacao: this.ultimaAtualizacao
    };
  }
}

// Para exportação no Node.js durante os testes locais
if (typeof module !== 'undefined' && module.exports) {
  const { ErroValidacaoDominio } = require('../Core/Erros');
  const { Equipe } = require('./Equipe');
  const { Arma } = require('./Arma');
  const { Droga } = require('./Droga');
  module.exports = { Ocorrencia };
}
```

## Responsabilidade observada

Fonte: `02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-01_MODELO_DE_OCORRENCIA/NOTA_DE_RESPONSABILIDADE.md` — NOTA_DE_RESPONSABILIDADE.md do modulo (fallback: primeiras linhas uteis; sem secao de papel/responsabilidade).

Responsabilidade canonica do modulo.
## Documentos do modulo

## Portas expostas (se aplicável)

- Superfície exposta no nível do arquivo (nível global): `Ocorrencia`
- Membros públicos observados: `constructor`, `adicionarNatureza`, `adicionarPolicial`, `adicionarArma`, `adicionarDroga`, `_adicionarItemApreendido`, `_atualizarTimestamp`, `obterChave`, `toJSON`

_Extraído por heurística do gerador (globais de nível arquivo + métodos/accessors de 1º–2º nível). Não substitui a declaração de porta da Planta: confirme no endereço acima._

## Divergência com a Planta declarada

Testes mecânicos executados na geração (commit `fbb0608`, 2026-09-13T21:45:20-03:00):

- OK — T1 endereco existe: NOTA_DE_RESPONSABILIDADE.md do modulo presente
- OK — T3 arquivo presente no commit de referencia (fbb0608:Dominio/Ocorrencia.js)
- OK — T4 conteudo em disco identico ao do commit de referencia (sha256 LF)
- OK — T5 espelho anterior sem deriva de codigo (sha256 do bloco == origem)
- OK — T6 endereco declarado no espelho anterior corresponde ao endereco canonico atual
- OK — T7 sem duplicidade: exatamente 1 espelho de leitura declara "Dominio/Ocorrencia.js" como origem
- **ACHADO** — T2 artefato NAO declarado no endereco: "Dominio/Ocorrencia.js" nao aparece nas NOTAS/capsula de C03_Dominio / MOD-C03-01_MODELO_DE_OCORRENCIA

Veredito mecânico: **1 divergência(s) detectada(s) pelos testes acima**.

Declaração verificada a mão por humano/agente (não derivável automaticamente):

- **Como o endereco foi derivado (nao inventado):** menção em arquivo do próprio endereço; fonte `02_Comodos/C03_Dominio/01_Dominio/modulos/MOD-C03-01_MODELO_DE_OCORRENCIA/CIR-MOD-C03-01_MODELO_DE_OCORRENCIA.canvas`.
- **Nada foi corrigido no artefato:** o gerador nao altera codigo de produto; o arquivo de origem permanece byte a byte como estava.

## Última verificação (data/commit)

- 2026-09-13T21:45:20-03:00 · commit `fbb0608` · sha256 da origem (LF): `ffe7eb7bd0e090788ea2fc9e157613ea3c54ae4b890977cd192e9676eedad3d3`
- Reexecutar: `node scripts/downplant/espelho-rico.mjs gerar --endereco C03_Dominio/MOD-C03-01_MODELO_DE_OCORRENCIA --origem Dominio/Ocorrencia.js --saida <caminho>`
- Verificar deriva sem regravar: `node scripts/downplant/espelho-rico.mjs verificar --espelho <caminho>`
