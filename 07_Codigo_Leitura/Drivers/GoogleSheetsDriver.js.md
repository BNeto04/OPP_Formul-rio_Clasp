# ESPELHO — GoogleSheetsDriver.js

> [!NOTE] Espelho rico de código (Metodo §46.15) — gerado por `scripts/downplant/espelho-rico.mjs`
> Somente leitura. Não editar à mão: qualquer edição é sobrescrita na próxima geração.
> O código abaixo é cópia verbatim do arquivo de origem no commit declarado; divergência entre o embutido e a origem é deriva (§18.1).
> Regra do sha256 declarado: sha256 do conteúdo **normalizado para LF** (igual ao blob do Git). Em arquivo CRLF com terminador final diferente, ele difere do `sha256sum` dos bytes crus — a comparação de deriva é feita conteúdo-contra-conteúdo.
> Papel desta cópia: CANÔNICA (repositório). O derivado navegável no vault é gerado com as mesmas entradas.

- **Endereço Down Plant:** `C02_Leitura / MOD-C02-01_LEITURA_E_ADAPTACAO` — [NOTA_DE_RESPONSABILIDADE.md](../../02_Comodos/C02_Leitura/01_Dominio/modulos/MOD-C02-01_LEITURA_E_ADAPTACAO/NOTA_DE_RESPONSABILIDADE.md)
- **Arquivo de origem (link para o disco):** [`Drivers/GoogleSheetsDriver.js`](../../Drivers/GoogleSheetsDriver.js)
- **Commit de referência:** `fbb0608e7b98144533628c7f9b773a10505b800d` (`fbb0608`)
- **Data da última sincronização:** 2026-09-13T21:45:24-03:00

## Código-fonte embutido

Verbatim de `Drivers/GoogleSheetsDriver.js` em `fbb0608`. sha256 do bloco (LF): `c41090c4e2dc5714031bcdbc3998f3f17733cf232866502713cbe87ee79d4692` — 55 linhas.

```javascript
/**
 * ARQUIVO: Drivers/GoogleSheetsDriver.js
 * DESCRIÇÃO: Encapsula absolutamente todas as interações com a API do Google Sheets.
 * Recebe um DocumentoLógico (agnóstico) e efetiva as pinturas, escritas e filtros
 * na planilha física. Nenhuma outra classe deve chamar setValues() ou setBackground().
 */

class GoogleSheetsDriver {
  /**
   * Materializa um DocumentoLógico na interface do Google Sheets.
   * @param {SpreadsheetApp.Spreadsheet} planilha - A planilha destino
   * @param {DocumentoLogico} documento - O relatório abstraído
   */
  static materializar(planilha, documento) {
    const nomeAba = documento.titulo;
    let aba = planilha.getSheetByName(nomeAba);
    
    // 1. Criar ou Limpar a Aba (Isolamento de API)
    if (aba) {
      aba.clear();
      if (aba.getFilter()) {
        aba.getFilter().remove();
      }
    } else {
      aba = planilha.insertSheet(nomeAba);
    }

    if (documento.linhas.length === 0 && documento.cabecalhos.length === 0) {
      return; // Documento vazio
    }

    // 2. Escrever Dados
    const totalLinhas = documento.linhas.length + 1; // +1 do cabeçalho
    const totalColunas = documento.cabecalhos.length;
    
    const range = aba.getRange(1, 1, totalLinhas, totalColunas);
    const matrizValores = [documento.cabecalhos, ...documento.linhas];
    
    range.setValues(matrizValores);

    // 3. Aplicar Estilos (Cores Lógicas mapeadas para Cores Físicas hex)
    if (documento.estilos && documento.estilos.length === totalLinhas) {
      range.setBackgrounds(documento.estilos);
    }

    // 4. Acabamentos Físicos (Congelamento, Filtro e Resize)
    aba.setFrozenRows(1);
    aba.getRange(1, 1, 1, totalColunas).setFontWeight("bold");
    range.createFilter();
    
    for (let i = 1; i <= totalColunas; i++) {
      aba.autoResizeColumn(i);
    }
  }
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

- Superfície exposta no nível do arquivo (nível global): `GoogleSheetsDriver`
- Membros públicos observados: `materializar`

_Extraído por heurística do gerador (globais de nível arquivo + métodos/accessors de 1º–2º nível). Não substitui a declaração de porta da Planta: confirme no endereço acima._

## Divergência com a Planta declarada

Testes mecânicos executados na geração (commit `fbb0608`, 2026-09-13T21:45:24-03:00):

- OK — T1 endereco existe: NOTA_DE_RESPONSABILIDADE.md do modulo presente
- OK — T2 artefato declarado no endereco: "Drivers/GoogleSheetsDriver.js" aparece na Planta
- OK — T3 arquivo presente no commit de referencia (fbb0608:Drivers/GoogleSheetsDriver.js)
- OK — T4 conteudo em disco identico ao do commit de referencia (sha256 LF)
- OK — T5 espelho anterior sem deriva de codigo (sha256 do bloco == origem)
- OK — T6 endereco declarado no espelho anterior corresponde ao endereco canonico atual
- OK — T7 sem duplicidade: exatamente 1 espelho de leitura declara "Drivers/GoogleSheetsDriver.js" como origem

Veredito mecânico: **nenhuma divergência detectada pelos testes acima**.

Declaração verificada a mão por humano/agente (não derivável automaticamente):

- **Como o endereco foi derivado (nao inventado):** secao Artefatos; fonte `02_Comodos/C02_Leitura/01_Dominio/modulos/MOD-C02-01_LEITURA_E_ADAPTACAO/MOD-C02-01_LEITURA_E_ADAPTACAO.md`:62.
- **Nada foi corrigido no artefato:** o gerador nao altera codigo de produto; o arquivo de origem permanece byte a byte como estava.

## Última verificação (data/commit)

- 2026-09-13T21:45:24-03:00 · commit `fbb0608` · sha256 da origem (LF): `c41090c4e2dc5714031bcdbc3998f3f17733cf232866502713cbe87ee79d4692`
- Reexecutar: `node scripts/downplant/espelho-rico.mjs gerar --endereco C02_Leitura/MOD-C02-01_LEITURA_E_ADAPTACAO --origem Drivers/GoogleSheetsDriver.js --saida <caminho>`
- Verificar deriva sem regravar: `node scripts/downplant/espelho-rico.mjs verificar --espelho <caminho>`
