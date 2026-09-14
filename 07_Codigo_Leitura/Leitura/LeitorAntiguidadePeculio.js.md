# ESPELHO — LeitorAntiguidadePeculio.js

> [!NOTE] Espelho rico de código (Metodo §46.15) — gerado por `scripts/downplant/espelho-rico.mjs`
> Somente leitura. Não editar à mão: qualquer edição é sobrescrita na próxima geração.
> O código abaixo é cópia verbatim do arquivo de origem no commit declarado; divergência entre o embutido e a origem é deriva (§18.1).
> Regra do sha256 declarado: sha256 do conteúdo **normalizado para LF** (igual ao blob do Git). Em arquivo CRLF com terminador final diferente, ele difere do `sha256sum` dos bytes crus — a comparação de deriva é feita conteúdo-contra-conteúdo.
> Papel desta cópia: CANÔNICA (repositório). O derivado navegável no vault é gerado com as mesmas entradas.

- **Endereço Down Plant:** `C02_Leitura / MOD-C02-01_LEITURA_E_ADAPTACAO` — [NOTA_DE_RESPONSABILIDADE.md](../../02_Comodos/C02_Leitura/01_Dominio/modulos/MOD-C02-01_LEITURA_E_ADAPTACAO/NOTA_DE_RESPONSABILIDADE.md)
- **Arquivo de origem (link para o disco):** [`Leitura/LeitorAntiguidadePeculio.js`](../../Leitura/LeitorAntiguidadePeculio.js)
- **Commit de referência:** `fbb0608e7b98144533628c7f9b773a10505b800d` (`fbb0608`)
- **Data da última sincronização:** 2026-09-13T21:45:35-03:00

## Código-fonte embutido

Verbatim de `Leitura/LeitorAntiguidadePeculio.js` em `fbb0608`. sha256 do bloco (LF): `49ed319f7edfff1148a687bd0fc654f4df89cf6e91bb939fcfaabcb00f9a42eb` — 278 linhas.

```javascript
/**
 * ARQUIVO: Leitura/LeitorAntiguidadePeculio.js
 * DESCRIÇÃO: Leitor oficial do mapa de antiguidade N a partir do Pecúlio / Efetivo (TASK-M06.3-03B).
 * REGRA ESTRITA: Exige presença explícita de aba válida e colunas de N e MATRÍCULA.
 * Sem fallbacks para primeira aba arbitrária ou índices fixos de colunas.
 */

const LeitorAntiguidadePeculio = {
  /**
   * Normaliza a matrícula removendo pontuação, hífens, pontos e espaços.
   * Exemplo: '108.394-5' -> '1083945'
   * @param {string|number} mat 
   * @returns {string} Matrícula limpa contendo apenas caracteres alfanuméricos.
   */
  normalizarMatricula(mat) {
    if (mat === null || mat === undefined) return '';
    return String(mat).replace(/[^a-zA-Z0-9]/g, '').toUpperCase().trim();
  },

  /**
   * Lê o mapa de antiguidade a partir de uma planilha (objeto SpreadsheetApp.Spreadsheet ou matriz 2D).
   * @param {SpreadsheetApp.Spreadsheet|Array<Array>} fonte - Planilha do Google Sheets ou matriz 2D.
   * @param {string} [nomeAba='EFETIVO'] - Nome da aba a procurar no projeto.
   * @returns {{ mapa: Object.<string, number>, mapaCompleto: Object.<string, Object>, erro?: string, estatisticas: Object }}
   */
  /**
   * Examina as primeiras 25 linhas de uma matriz de dados para localizar a combinação de cabeçalhos de antiguidade e matrícula.
   * @param {Array<Array>} dados - Matriz 2D da aba.
   * @returns {{ valido: boolean, idxCabecalho?: number, colMatricula?: number, colN?: number, colNome?: number, colGrad?: number, colPelotao?: number }}
   */
  localizarCabecalhoEmMatriz(dados) {
    if (!Array.isArray(dados) || dados.length < 2) {
      return { valido: false };
    }

    for (let r = 0; r < Math.min(25, dados.length); r++) {
      const linha = dados[r].map(c => String(c || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim());
      
      const cMat = linha.findIndex(h => h === 'MATRICULA' || h === 'MAT' || h === 'MAT.' || h.includes('MATRICULA'));
      const cN = linha.findIndex(h => h === 'N' || h === 'Nº' || h === 'N°' || h === 'ORD' || h === 'ORD.' || h === 'ANTIGUIDADE' || h === 'ORDEM' || h === 'POSICAO' || h.includes('ANTIGUIDADE'));
      const cNome = linha.findIndex(h => h === 'NOME' || h === 'N GUERRA' || h === 'NOME DE GUERRA' || h === 'NOME COMPLETO' || h === 'POLICIAL' || h === 'MILITAR');
      const cGrad = linha.findIndex(h => h === 'GRAD' || h === 'GRAD.' || h === 'GRADUACAO' || h === 'POSTO' || h.includes('GRAD'));
      const cPel = linha.findIndex(h => h === 'P' || h === 'PELOTAO' || h === 'DESIGNACAO' || h === 'LOTACAO' || h.includes('SUB-UNIDADE') || h.includes('UNIDADE'));

      const temGrad = cGrad !== -1;
      const temNome = cNome !== -1;
      const temPelotao = cPel !== -1;
      const countIdentidade = (temGrad ? 1 : 0) + (temNome ? 1 : 0) + (temPelotao ? 1 : 0);

      // EXIGÊNCIA ESTRITA DO CONTRATO DE ANTIGUIDADE:
      // Exige ORD/N + MAT./MATRÍCULA + pelo menos 2 marcadores de identidade (GRAD., NOME DE GUERRA, SUB-UNIDADE)
      if (cMat !== -1 && cN !== -1 && countIdentidade >= 2) {
        return {
          valido: true,
          idxCabecalho: r,
          colMatricula: cMat,
          colN: cN,
          colNome: cNome,
          colGrad: cGrad,
          colPelotao: cPel
        };
      }
    }

    return { valido: false };
  },

  /**
   * Lê o mapa de antiguidade a partir de uma planilha (objeto SpreadsheetApp.Spreadsheet ou matriz 2D).
   * Realiza a seleção semântica estrita da aba examinando o cabeçalho completo antes de se fixar.
   * @param {SpreadsheetApp.Spreadsheet|Array<Array>} fonte - Planilha do Google Sheets ou matriz 2D.
   * @param {string} [nomeAba=null] - Nome preferencial da aba a procurar no projeto.
   * @returns {{ mapa: Object.<string, number>, mapaCompleto: Object.<string, Object>, erro?: string, detalheErro?: string, estatisticas: Object, nomeAba?: string }}
   */
  lerMapaAntiguidade(fonte, nomeAba = null) {
    if (!fonte) {
      return {
        mapa: {},
        mapaCompleto: {},
        erro: 'PECULIO_ACESSO_NEGADO',
        detalheErro: 'Fonte do Pecúlio nula ou indefinida.',
        estatisticas: { lidos: 0, validos: 0, invalidos: 0, duplicados: 0 }
      };
    }

    let dados = null;
    let infoCabecalho = null;
    let nomeAbaSelecionada = '';

    if (Array.isArray(fonte)) {
      if (fonte.length === 0) {
        return {
          mapa: {},
          mapaCompleto: {},
          erro: 'PECULIO_ABA_NAO_LOCALIZADA',
          detalheErro: 'Fonte do Pecúlio é uma matriz vazia.',
          estatisticas: { lidos: 0, validos: 0, invalidos: 0, duplicados: 0 }
        };
      }
      dados = fonte;
      infoCabecalho = this.localizarCabecalhoEmMatriz(dados);
      if (!infoCabecalho.valido) {
        return {
          mapa: {},
          mapaCompleto: {},
          erro: 'PECULIO_CABECALHO_NAO_LOCALIZADO',
          detalheErro: 'Matriz fornecida não atende ao contrato estrito do Pecúlio (exige ORD/N, MAT./MATRÍCULA e ao menos 2 marcadores de identidade: GRAD., NOME DE GUERRA, SUB-UNIDADE).',
          estatisticas: { lidos: 0, validos: 0, invalidos: 0, duplicados: 0 }
        };
      }
    } else if (fonte && typeof fonte.getSheetByName === 'function') {
      const candidatas = [];
      const nomesVistos = new Set();

      const adicionarCandidata = (s) => {
        if (s) {
          const nome = typeof s.getName === 'function' ? s.getName() : ('ABA_' + candidatas.length);
          if (!nomesVistos.has(nome)) {
            nomesVistos.add(nome);
            candidatas.push(s);
          }
        }
      };

      try {
        const nomeAbaAlvo = nomeAba || 'EFETIVO';
        adicionarCandidata(fonte.getSheetByName(nomeAbaAlvo));

        const aliasesAbas = [
          'EFETIVO', 'PECULIO', 'PECÚLIO', 'EFETIVO 2026',
          'CÓPIA DE PECÚLIO COM PONTUAÇÃO', 'COPIA DE PECULIO COM PONTUACAO',
          'CÓPIA DE PECÚLIO COM PONTUAÇÃO ', 'PECÚLIO 2026', 'PECULIO 2026'
        ];
        for (const alias of aliasesAbas) {
          adicionarCandidata(fonte.getSheetByName(alias));
        }

        // Remoção de fallback perigoso: não iteramos mais sobre `fonte.getSheets()`
        // para adivinhar a aba se ela não tiver o nome ou alias exato.
      } catch (e) {
        return {
          mapa: {},
          mapaCompleto: {},
          erro: 'PECULIO_ACESSO_NEGADO',
          detalheErro: e.message || String(e),
          estatisticas: { lidos: 0, validos: 0, invalidos: 0, duplicados: 0 }
        };
      }

      if (candidatas.length === 0) {
        return {
          mapa: {},
          mapaCompleto: {},
          erro: 'PECULIO_ABA_NAO_LOCALIZADA',
          detalheErro: 'Nenhuma aba com o nome EFETIVO ou PECÚLIO foi encontrada na planilha do Pecúlio.',
          estatisticas: { lidos: 0, validos: 0, invalidos: 0, duplicados: 0 }
        };
      }

      const abasExaminadas = [];

      for (const s of candidatas) {
        const nomeAbaItem = typeof s.getName === 'function' ? s.getName() : 'Aba';
        abasExaminadas.push(nomeAbaItem);
        try {
          const lastRow = typeof s.getLastRow === 'function' ? s.getLastRow() : 0;
          const lastCol = typeof s.getLastColumn === 'function' ? s.getLastColumn() : 0;
          
          let matrizValores = null;
          if (typeof s.getRange === 'function' && lastRow >= 2 && lastCol >= 1) {
            matrizValores = s.getRange(1, 1, Math.min(lastRow, 3000), lastCol).getValues();
          } else if (Array.isArray(s.dados)) {
            matrizValores = s.dados;
          }

          if (Array.isArray(matrizValores)) {
            const cab = this.localizarCabecalhoEmMatriz(matrizValores);
            if (cab.valido) {
              dados = matrizValores;
              infoCabecalho = cab;
              nomeAbaSelecionada = nomeAbaItem;
              break;
            }
          }
        } catch (e) {}
      }

      if (!dados || !infoCabecalho || !infoCabecalho.valido) {
        return {
          mapa: {},
          mapaCompleto: {},
          erro: 'PECULIO_CABECALHO_NAO_LOCALIZADO',
          detalheErro: `Abas examinadas: [${abasExaminadas.join(', ')}]. Nenhuma continha o contrato estrito (ORD/N + MAT. + ao menos 2 de: GRAD., NOME DE GUERRA, SUB-UNIDADE) nas primeiras 25 linhas.`,
          estatisticas: { lidos: 0, validos: 0, invalidos: 0, duplicados: 0 }
        };
      }
    }

    if (!Array.isArray(dados) || !infoCabecalho || !infoCabecalho.valido) {
      return {
        mapa: {},
        mapaCompleto: {},
        erro: 'PECULIO_ABA_NAO_LOCALIZADA',
        detalheErro: 'Não foi possível extrair dados da aba de antiguidade.',
        estatisticas: { lidos: 0, validos: 0, invalidos: 0, duplicados: 0 }
      };
    }

    const { idxCabecalho, colMatricula, colN, colNome, colGrad, colPelotao } = infoCabecalho;
    const mapa = {};
    const mapaCompleto = {};
    const estatisticas = { lidos: 0, validos: 0, invalidos: 0, duplicados: 0 };

    for (let i = idxCabecalho + 1; i < dados.length; i++) {
      const linha = dados[i];
      if (!linha || linha.length === 0) continue;

      // Ignora linhas completamente vazias
      if (linha.every(c => String(c || '').trim() === '')) continue;

      estatisticas.lidos++;

      const rawMat = linha[colMatricula];
      const matNorm = this.normalizarMatricula(rawMat);

      if (!matNorm) {
        estatisticas.invalidos++;
        continue;
      }

      const rawN = linha[colN];
      const numN = Number(rawN);

      if (rawN === undefined || rawN === null || rawN === '' || isNaN(numN) || numN <= 0) {
        estatisticas.invalidos++;
        continue;
      }

      // Trata duplicidade de matrícula (preserva a primeira ocorrência válida de N)
      if (mapa[matNorm] !== undefined) {
        estatisticas.duplicados++;
        continue;
      }

      const nome = colNome !== -1 ? String(linha[colNome] || '').trim() : '';
      const grad = colGrad !== -1 ? String(linha[colGrad] || '').trim() : '';
      const designacao = colPelotao !== -1 ? String(linha[colPelotao] || '').trim() : '';

      mapa[matNorm] = numN;
      mapaCompleto[matNorm] = {
        matricula: matNorm,
        matriculaOriginal: String(rawMat).trim(),
        numN: numN,
        nome: nome,
        grad: grad,
        designacao: designacao
      };

      estatisticas.validos++;
    }

    if (estatisticas.validos === 0) {
      return {
        mapa: {},
        mapaCompleto: {},
        erro: 'PECULIO_SEM_REGISTROS_VALIDOS',
        detalheErro: `Aba "${nomeAbaSelecionada || 'Desconhecida'}" contém os cabeçalhos válidos, mas zero registros com ORD e MAT. preenchidos.`,
        estatisticas
      };
    }

    return { mapa, mapaCompleto, estatisticas, nomeAba: nomeAbaSelecionada };
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = LeitorAntiguidadePeculio;
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

- Superfície exposta no nível do arquivo (nível global): `LeitorAntiguidadePeculio`
- Membros públicos observados: `normalizarMatricula`, `localizarCabecalhoEmMatriz`, `lerMapaAntiguidade`

_Extraído por heurística do gerador (globais de nível arquivo + métodos/accessors de 1º–2º nível). Não substitui a declaração de porta da Planta: confirme no endereço acima._

## Divergência com a Planta declarada

Testes mecânicos executados na geração (commit `fbb0608`, 2026-09-13T21:45:35-03:00):

- OK — T1 endereco existe: NOTA_DE_RESPONSABILIDADE.md do modulo presente
- OK — T2 artefato declarado no endereco: "Leitura/LeitorAntiguidadePeculio.js" aparece na Planta
- OK — T3 arquivo presente no commit de referencia (fbb0608:Leitura/LeitorAntiguidadePeculio.js)
- OK — T4 conteudo em disco identico ao do commit de referencia (sha256 LF)
- OK — T5 espelho anterior sem deriva de codigo (sha256 do bloco == origem)
- OK — T6 endereco declarado no espelho anterior corresponde ao endereco canonico atual
- OK — T7 sem duplicidade: exatamente 1 espelho de leitura declara "Leitura/LeitorAntiguidadePeculio.js" como origem

Veredito mecânico: **nenhuma divergência detectada pelos testes acima**.

Declaração verificada a mão por humano/agente (não derivável automaticamente):

- **Como o endereco foi derivado (nao inventado):** secao Artefatos; fonte `02_Comodos/C02_Leitura/01_Dominio/modulos/MOD-C02-01_LEITURA_E_ADAPTACAO/MOD-C02-01_LEITURA_E_ADAPTACAO.md`:61.
- **Enderecos concorrentes declarados na Planta (1):** `C04_Motor/MOD-C04-01_MOTOR_ANALITICO`. O artefato e referenciado em mais de um endereco; o campo acima registra o endereco PRIMARIO. Nao e erro de endereco — e declaracao concorrente na propria Planta.
- **Nada foi corrigido no artefato:** o gerador nao altera codigo de produto; o arquivo de origem permanece byte a byte como estava.

## Última verificação (data/commit)

- 2026-09-13T21:45:35-03:00 · commit `fbb0608` · sha256 da origem (LF): `49ed319f7edfff1148a687bd0fc654f4df89cf6e91bb939fcfaabcb00f9a42eb`
- Reexecutar: `node scripts/downplant/espelho-rico.mjs gerar --endereco C02_Leitura/MOD-C02-01_LEITURA_E_ADAPTACAO --origem Leitura/LeitorAntiguidadePeculio.js --saida <caminho>`
- Verificar deriva sem regravar: `node scripts/downplant/espelho-rico.mjs verificar --espelho <caminho>`
