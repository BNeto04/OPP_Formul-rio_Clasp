# ESPELHO — Adaptador2026.js

> [!NOTE] Espelho rico de código (Metodo §46.15) — gerado por `scripts/downplant/espelho-rico.mjs`
> Somente leitura. Não editar à mão: qualquer edição é sobrescrita na próxima geração.
> O código abaixo é cópia verbatim do arquivo de origem no commit declarado; divergência entre o embutido e a origem é deriva (§18.1).
> Regra do sha256 declarado: sha256 do conteúdo **normalizado para LF** (igual ao blob do Git). Em arquivo CRLF com terminador final diferente, ele difere do `sha256sum` dos bytes crus — a comparação de deriva é feita conteúdo-contra-conteúdo.
> Papel desta cópia: CANÔNICA (repositório). O derivado navegável no vault é gerado com as mesmas entradas.

- **Endereço Down Plant:** `C02_Leitura / MOD-C02-01_LEITURA_E_ADAPTACAO` — [NOTA_DE_RESPONSABILIDADE.md](../../02_Comodos/C02_Leitura/01_Dominio/modulos/MOD-C02-01_LEITURA_E_ADAPTACAO/NOTA_DE_RESPONSABILIDADE.md)
- **Arquivo de origem (link para o disco):** [`Leitura/Adaptador2026.js`](../../Leitura/Adaptador2026.js)
- **Commit de referência:** `fbb0608e7b98144533628c7f9b773a10505b800d` (`fbb0608`)
- **Data da última sincronização:** 2026-09-13T21:45:34-03:00

## Código-fonte embutido

Verbatim de `Leitura/Adaptador2026.js` em `fbb0608`. sha256 do bloco (LF): `c5f782b9281d3f7576ccbe1af19d295d18ad632268361a47e84fc426cdf15666` — 227 linhas.

```javascript
/**
 * ARQUIVO: Leitura/Adaptador2026.js
 * PILAR 1: Leitura e Adaptadores
 * DESCRIÇÃO: Implementação da FonteDados para o formato da OPP de 2026.
 * O adaptador NÃO agrega dados (Regra de Ouro #4). Ele apenas traduz linhas
 * físicas em instâncias de RegistroCanonico (Fatos).
 * Estendido na TASK-M06.3-05I.2R para extrair armaFato (coluna ARMA), tipoArma e modeloArma separadamente.
 */

let SyntheonCabecalhosMod = typeof SyntheonCabecalhos !== 'undefined' ? SyntheonCabecalhos : null;
if (!SyntheonCabecalhosMod && typeof require !== 'undefined') {
  try { SyntheonCabecalhosMod = require('../Core/Cabecalhos'); } catch (e) {}
}

let SyntheonUtilsMod = typeof SyntheonUtils !== 'undefined' ? SyntheonUtils : null;
if (!SyntheonUtilsMod && typeof require !== 'undefined') {
  try { SyntheonUtilsMod = require('../Core/Utils'); } catch (e) {}
}

let ConstantesMod = typeof CONSTANTES_SYNTHEON !== 'undefined' ? CONSTANTES_SYNTHEON : null;
if (!ConstantesMod && typeof require !== 'undefined') {
  try { ConstantesMod = require('../Core/Constantes'); } catch (e) {}
}

let RegistroCanonicoMod = typeof RegistroCanonico !== 'undefined' ? RegistroCanonico : null;
if (!RegistroCanonicoMod && typeof require !== 'undefined') {
  try { RegistroCanonicoMod = require('../Core/RegistroCanonico'); } catch (e) {}
}

class Adaptador2026 {
  /**
   * Converte o conteúdo da aba em um array de Registros Canônicos (um por linha válida)
   * @param {SpreadsheetApp.Sheet|Array} fonte - Aba do Google Sheets ou Matriz 2D
   * @param {Object} metadado - Configuração da fonte via Metamodelos
   * @param {Object} mapaEfetivo - Dicionário de policiais ativos
   * @returns {Array<RegistroCanonico>}
   */
  static extrairFatos(fonte, metadado = {}, mapaEfetivo = null) {
    let dados = [];
    let nomeAba = metadado?.aba || '2026';

    if (fonte && typeof fonte.getRange === 'function') {
      const lastRow = fonte.getLastRow();
      const lastCol = fonte.getLastColumn();
      if (lastRow < 2 || lastCol < 1) return [];
      dados = fonte.getRange(1, 1, lastRow, lastCol).getValues();
      if (typeof fonte.getName === 'function') nomeAba = fonte.getName();
    } else if (Array.isArray(fonte)) {
      dados = fonte;
    } else {
      return [];
    }

    if (dados.length < 2) return [];

    const rawHeaders = dados[0];

    const loc = (chaveAlias) => {
      if (SyntheonCabecalhosMod && typeof SyntheonCabecalhosMod.encontrar === 'function') {
        return SyntheonCabecalhosMod.encontrar(rawHeaders, chaveAlias);
      }
      if (SyntheonUtilsMod && typeof SyntheonUtilsMod.localizarColuna === 'function') {
        return SyntheonUtilsMod.localizarColuna(rawHeaders.map(h => String(h || '').toUpperCase().trim()), chaveAlias);
      }
      const normHeaders = rawHeaders.map(h => String(h || '').toUpperCase().trim());
      const aliases = (ConstantesMod && ConstantesMod.ALIASES && ConstantesMod.ALIASES[chaveAlias])
        ? ConstantesMod.ALIASES[chaveAlias]
        : [chaveAlias];

      for (const alias of aliases) {
        const normAlias = String(alias || '').toUpperCase().trim();
        const exactIdx = normHeaders.indexOf(normAlias);
        if (exactIdx !== -1) return exactIdx;
      }
      for (const alias of aliases) {
        const normAlias = String(alias || '').toUpperCase().trim();
        const partialIdx = normHeaders.findIndex(h => h.includes(normAlias));
        if (partialIdx !== -1) return partialIdx;
      }
      return -1;
    };

    const idx = {
      data: loc('DATA'),
      hora: loc('HORA'),
      mike: loc('MIKE'),
      boe: loc('BOE'),
      natureza: loc('NATUREZA'),
      cidade: loc('CIDADE'),
      bairro: loc('BAIRRO'),
      ais: loc('AIS'),
      matricula: loc('MATRICULA'),
      militar: loc('POLICIAL'),
      grad: loc('GRAD'),
      pelotao: loc('PELOTAO'),
      armaFato: loc('ARMA_FATO'),
      tipoArma: loc('TIPO_ARMA'),
      modeloArma: loc('MODELO_ARMA'),
      qtdArmasReplicada: loc('QDT_ARMAS') !== -1 ? loc('QDT_ARMAS') : loc('ARMAS'),
      maconha: loc('MACONHA'),
      cocaina: loc('COCAINA'),
      crack: loc('CRACK'),
      pontosTotais: loc('PONTOS_TOTAIS'),
      pontosFiccao: loc('PONTOS_FICCAO'),
      indicadorPip: loc('INDICADOR_PIP'),
      imputado: loc('IMPUTADO'),
      detidos: loc('DETIDOS'),
      apfd: loc('APFD'),
      tco: loc('TCO'),
      boc: loc('BOC')
    };

    const registros = [];

    const getNum = (colIdx, row) => {
      if (colIdx === -1 || colIdx >= row.length) return 0;
      if (SyntheonUtilsMod && typeof SyntheonUtilsMod.converterNumero === 'function') {
        return SyntheonUtilsMod.converterNumero(row[colIdx]);
      }
      const val = row[colIdx];
      if (typeof val === 'number') return isNaN(val) ? 0 : val;
      const n = Number(String(val || '').replace(/\./g, '').replace(',', '.').trim());
      return isNaN(n) ? 0 : n;
    };

    for (let i = 1; i < dados.length; i++) {
      const row = dados[i];
      let matriculaBruta = idx.matricula !== -1 ? String(row[idx.matricula] || '').trim() : '';
      
      // Validação básica (Pula linhas em branco)
      if (!matriculaBruta) continue;
      let matricula = matriculaBruta.replace(/[^0-9X-]/gi, '').toUpperCase();
      if (matricula.indexOf('-') === -1 && matricula.length > 1) {
        matricula = matricula.slice(0, -1) + '-' + matricula.slice(-1);
      }

      const mike = idx.mike !== -1 ? String(row[idx.mike] || '').trim() : '';
      if (!mike) continue;

      const boe = idx.boe !== -1 ? String(row[idx.boe] || '').trim() : '';
      
      const rawData = idx.data !== -1 ? row[idx.data] : null;
      let dataStr = '';
      if (typeof converterDataUnificada === 'function' && typeof formatarDataBR === 'function') {
        dataStr = formatarDataBR(converterDataUnificada(rawData));
      } else if (rawData instanceof Date) {
        const d = String(rawData.getDate()).padStart(2, '0');
        const m = String(rawData.getMonth() + 1).padStart(2, '0');
        const y = rawData.getFullYear();
        dataStr = `${d}/${m}/${y}`;
      } else {
        dataStr = String(rawData || '').split(' ')[0];
      }

      const chave = `${dataStr}|${mike}|${boe}`;

      const cadastro = mapaEfetivo && mapaEfetivo[matricula] ? mapaEfetivo[matricula] : null;
      let nome = cadastro ? cadastro.nome : (idx.militar !== -1 ? String(row[idx.militar] || '').trim() : 'N/I');
      let grad = cadastro ? cadastro.graduacao : (idx.grad !== -1 ? String(row[idx.grad] || '').trim() : 'N/I');
      let pelotao = cadastro && cadastro.pelotao ? cadastro.pelotao : (idx.pelotao !== -1 ? String(row[idx.pelotao] || '').trim() : 'N/I');

      const valArmaFato = idx.armaFato !== -1 ? getNum(idx.armaFato, row) : 0;
      const valTipoArma = idx.tipoArma !== -1 ? String(row[idx.tipoArma] || '').trim() : '';
      const valModeloArma = idx.modeloArma !== -1 ? String(row[idx.modeloArma] || '').trim() : '';
      const valQtdReplicada = idx.qtdArmasReplicada !== -1 ? getNum(idx.qtdArmasReplicada, row) : 0;

      const payload = {
        origem: {
          ano: 2026,
          aba: nomeAba,
          linha: i + 1,
          versaoEstrutura: metadado.versao || '2026'
        },
        coberturaHistorica: metadado.coberturaHistorica,
        ocorrencia: {
          chave: chave,
          data: idx.data !== -1 ? row[idx.data] : null,
          mike: mike,
          boe: boe,
          natureza: idx.natureza !== -1 ? row[idx.natureza] : '',
          cidade: idx.cidade !== -1 ? row[idx.cidade] : '',
          bairro: idx.bairro !== -1 ? row[idx.bairro] : '',
          ais: getNum(idx.ais, row),
          armaFato: valArmaFato,
          tipoArma: valTipoArma,
          modeloArma: valModeloArma,
          qtdArmasReplicada: valQtdReplicada
        },
        metricasPrimarias: {
          pontosTotais: getNum(idx.pontosTotais, row),
          detidos: getNum(idx.detidos, row),
          apfd: getNum(idx.apfd, row),
          tco: getNum(idx.tco, row),
          boc: getNum(idx.boc, row)
        },
        eventoPontuavel: {
          indicador: idx.indicadorPip !== -1 ? String(row[idx.indicadorPip] || '').trim() : '',
          imputado: idx.imputado !== -1 ? String(row[idx.imputado] || '').trim() : ''
        },
        policiais: [{
          matricula: matricula,
          nome: nome.toUpperCase(),
          graduacao: grad.toUpperCase(),
          pelotao: pelotao,
          pontosRateados: getNum(idx.pontosFiccao, row),
          armaFato: valArmaFato,
          tipoArma: valTipoArma,
          modeloArma: valModeloArma,
          qtdArmasReplicada: valQtdReplicada,
          armas: Math.max(0, valArmaFato),
          maconha: Math.max(0, getNum(idx.maconha, row)),
          cocaina: Math.max(0, getNum(idx.cocaina, row)),
          crack: Math.max(0, getNum(idx.crack, row))
        }]
      };

      const registro = RegistroCanonicoMod ? new RegistroCanonicoMod(payload) : payload;
      registros.push(registro);
    }

    return registros;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Adaptador2026;
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

- Superfície exposta no nível do arquivo (nível global): `Adaptador2026`
- Membros públicos observados: `extrairFatos`

_Extraído por heurística do gerador (globais de nível arquivo + métodos/accessors de 1º–2º nível). Não substitui a declaração de porta da Planta: confirme no endereço acima._

## Divergência com a Planta declarada

Testes mecânicos executados na geração (commit `fbb0608`, 2026-09-13T21:45:34-03:00):

- OK — T1 endereco existe: NOTA_DE_RESPONSABILIDADE.md do modulo presente
- OK — T2 artefato declarado no endereco: "Leitura/Adaptador2026.js" aparece na Planta
- OK — T3 arquivo presente no commit de referencia (fbb0608:Leitura/Adaptador2026.js)
- OK — T4 conteudo em disco identico ao do commit de referencia (sha256 LF)
- OK — T5 espelho anterior sem deriva de codigo (sha256 do bloco == origem)
- OK — T6 endereco declarado no espelho anterior corresponde ao endereco canonico atual
- OK — T7 sem duplicidade: exatamente 1 espelho de leitura declara "Leitura/Adaptador2026.js" como origem

Veredito mecânico: **nenhuma divergência detectada pelos testes acima**.

Declaração verificada a mão por humano/agente (não derivável automaticamente):

- **Como o endereco foi derivado (nao inventado):** secao Artefatos; fonte `02_Comodos/C02_Leitura/01_Dominio/modulos/MOD-C02-01_LEITURA_E_ADAPTACAO/MOD-C02-01_LEITURA_E_ADAPTACAO.md`:61.
- **Nada foi corrigido no artefato:** o gerador nao altera codigo de produto; o arquivo de origem permanece byte a byte como estava.

## Última verificação (data/commit)

- 2026-09-13T21:45:34-03:00 · commit `fbb0608` · sha256 da origem (LF): `c5f782b9281d3f7576ccbe1af19d295d18ad632268361a47e84fc426cdf15666`
- Reexecutar: `node scripts/downplant/espelho-rico.mjs gerar --endereco C02_Leitura/MOD-C02-01_LEITURA_E_ADAPTACAO --origem Leitura/Adaptador2026.js --saida <caminho>`
- Verificar deriva sem regravar: `node scripts/downplant/espelho-rico.mjs verificar --espelho <caminho>`
