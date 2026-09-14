# ESPELHO — Compilador de Entorpecentes.js

> [!NOTE] Espelho rico de código (Metodo §46.15) — gerado por `scripts/downplant/espelho-rico.mjs`
> Somente leitura. Não editar à mão: qualquer edição é sobrescrita na próxima geração.
> O código abaixo é cópia verbatim do arquivo de origem no commit declarado; divergência entre o embutido e a origem é deriva (§18.1).
> Regra do sha256 declarado: sha256 do conteúdo **normalizado para LF** (igual ao blob do Git). Em arquivo CRLF com terminador final diferente, ele difere do `sha256sum` dos bytes crus — a comparação de deriva é feita conteúdo-contra-conteúdo.
> Papel desta cópia: CANÔNICA (repositório). O derivado navegável no vault é gerado com as mesmas entradas.

- **Endereço Down Plant:** `C06_Relatorios / MOD-C06-01_RELATORIOS_OFICIAIS` — [NOTA_DE_RESPONSABILIDADE.md](../02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-01_RELATORIOS_OFICIAIS/NOTA_DE_RESPONSABILIDADE.md)
- **Arquivo de origem (link para o disco):** [`Compilador de Entorpecentes.js`](../Compilador de Entorpecentes.js)
- **Commit de referência:** `fbb0608e7b98144533628c7f9b773a10505b800d` (`fbb0608`)
- **Data da última sincronização:** 2026-09-13T21:44:58-03:00

## Código-fonte embutido

Verbatim de `Compilador de Entorpecentes.js` em `fbb0608`. sha256 do bloco (LF): `b2dcad1e754b6abc59d58ccb878d7a35a826de1e3835f28f4396fc6a07050a3f` — 373 linhas.

```javascript
/**
 * PROJETO: Compilador de Entorpecentes GS
 * LOTE: Ocorrência por PEL 2026
 * DESCRIÇÃO: Consolidação robusta de produtividade de entorpecentes.
 */

// ============================================================================
// AUXILIARES DE PALETA E FORMATO VISUAL (M06.2-05)
// ============================================================================

/**
 * Retorna o mapa de cores oficial para os grupos de lotação / pelotões.
 * @param {string} grad 
 * @param {string} pelotao 
 * @returns {{ fundo: string, fonte: string, negrito: boolean }}
 */
function corPorGrupoDrogas_(grad, pelotao) {
  const pelStr = String(pelotao || '').toUpperCase().trim();
  const gradStr = String(grad || '').toUpperCase().trim();

  if (pelStr.includes('OFICIAIS') || gradStr.includes('TEN') || gradStr.includes('CAP') || gradStr.includes('MAJ') || gradStr.includes('CEL')) {
    return { fundo: '#F1C232', fonte: '#000000', negrito: false };
  }
  if (pelStr.includes('GTAR')) {
    if (pelStr.includes('1') || pelStr.includes('1º') || pelStr.includes('1º PEL')) {
      return { fundo: '#00CC00', fonte: '#000000', negrito: true };
    }
    if (pelStr.includes('2') || pelStr.includes('2º') || pelStr.includes('2º PEL')) {
      return { fundo: '#3C78D8', fonte: '#FFFFFF', negrito: true };
    }
    return { fundo: '#00CC00', fonte: '#000000', negrito: true };
  }
  if (pelStr.includes('1º PEL') || pelStr.includes('1 PEL') || pelStr === '1') {
    return { fundo: '#00FF00', fonte: '#000000', negrito: false };
  }
  if (pelStr.includes('2º PEL') || pelStr.includes('2 PEL') || pelStr === '2') {
    return { fundo: '#6D9EEB', fonte: '#000000', negrito: false };
  }
  return { fundo: '#FFFFFF', fonte: '#000000', negrito: false };
}

/**
 * Retorna o mapa de cores da escala oficial de total de entorpecentes (coluna H).
 * @param {number} total 
 * @returns {{ fundo: string, fonte: string, negrito: boolean }}
 */
function corPorTotalDrogas_(total) {
  if (total >= 1000) return { fundo: '#38761D', fonte: '#FFFFFF', negrito: true };
  if (total >= 500) return { fundo: '#93C47D', fonte: '#000000', negrito: false };
  if (total >= 200) return { fundo: '#FFFF00', fonte: '#000000', negrito: false };
  if (total >= 50) return { fundo: '#FF9900', fonte: '#000000', negrito: false };
  return { fundo: '#FFFFFF', fonte: '#000000', negrito: false };
}

// ============================================================================
// MENU
// ============================================================================
function criarMenuDrogas_() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Drogas')
    .addItem('Selecao livre', 'abrirMenuSelecaoLivreDrogas')
    .addItem('Anual', 'iniciarModoAnualDrogas')
    .addToUi();
}

// ============================================================================
// FLUXO ANUAL
// ============================================================================
function iniciarModoAnualDrogas() {
  const ui = SpreadsheetApp.getUi();
  const meses = ['JAN2026','FEV2026','MAR2026','ABR2026','MAI2026','JUN2026','JUL2026','AGO2026','SET2026','OUT2026','NOV2026','DEZ2026'];
  
  const response = ui.alert('Compilador de Entorpecentes - Modo Anual', 
    'Deseja processar todos os meses de 2026?', ui.ButtonSet.YES_NO);
    
  if (response === ui.Button.YES) {
    executarCompiladorDrogas(meses, 'ANUAL');
  }
}

// ============================================================================
// FLUXO SELEÇÃO LIVRE
// ============================================================================
function abrirMenuSelecaoLivreDrogas() {
  const htmlOutput = HtmlService.createHtmlOutput(`
    <div style="font-family: Arial, sans-serif; padding: 15px;">
      <h4>Selecione os meses para compilar (Entorpecentes):</h4>
      <form id="mesesForm">
        <label><input type="checkbox" name="mes" value="JAN2026"> JAN2026</label><br>
        <label><input type="checkbox" name="mes" value="FEV2026"> FEV2026</label><br>
        <label><input type="checkbox" name="mes" value="MAR2026"> MAR2026</label><br>
        <label><input type="checkbox" name="mes" value="ABR2026"> ABR2026</label><br>
        <label><input type="checkbox" name="mes" value="MAI2026"> MAI2026</label><br>
        <label><input type="checkbox" name="mes" value="JUN2026"> JUN2026</label><br>
        <label><input type="checkbox" name="mes" value="JUL2026"> JUL2026</label><br>
        <label><input type="checkbox" name="mes" value="AGO2026"> AGO2026</label><br>
        <label><input type="checkbox" name="mes" value="SET2026"> SET2026</label><br>
        <label><input type="checkbox" name="mes" value="OUT2026"> OUT2026</label><br>
        <label><input type="checkbox" name="mes" value="NOV2026"> NOV2026</label><br>
        <label><input type="checkbox" name="mes" value="DEZ2026"> DEZ2026</label><br>
        <br>
        <button type="button" onclick="enviar()" 
          style="padding: 10px 20px; background: #d93025; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Compilar Entorpecentes
        </button>
      </form>
      <script>
        function enviar() {
          const checkboxes = document.querySelectorAll('input[name="mes"]:checked');
          const selecionados = Array.from(checkboxes).map(cb => cb.value);
          if (selecionados.length === 0) {
            alert('Selecione pelo menos um mês!');
            return;
          }
          google.script.run.withSuccessHandler(google.script.host.close)
            .processarMenuLivreDrogas(selecionados);
        }
      </script>
    </div>
  `).setWidth(320).setHeight(460);
  
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Seleção Livre - Entorpecentes');
}

function processarMenuLivreDrogas(mesesSelecionados) {
  executarCompiladorDrogas(mesesSelecionados, 'LIVRE');
}

// ============================================================================
// MOTOR PRINCIPAL
// ============================================================================
function executarCompiladorDrogas(mesesAlvo, modo) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const startTime = new Date();

  let logs = {
    abasProcessadas: [],
    linhasLidas: 0,
    policiaisUnicos: 0,
    linhasIgnoradas: 0,
    avisosGerados: [],
    totalMac: 0,
    totalCoc: 0
  };

  let dadosBrutos = [];

  try {
    mesesAlvo.forEach(nomeAba => {
      const sheet = ss.getSheetByName(nomeAba);
      if (!sheet) {
        logs.avisosGerados.push(`Aba '${nomeAba}' não encontrada.`);
        return;
      }

      logs.abasProcessadas.push(nomeAba);
      const lastCol = sheet.getLastColumn();
      const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

      const loc = (chaveAlias) => (typeof SyntheonCabecalhos !== 'undefined')
        ? SyntheonCabecalhos.encontrar(headers, chaveAlias)
        : SyntheonUtils.localizarColuna(headers.map(h => SyntheonUtils.normalizarTexto(h)), chaveAlias);

      const idxBoe = loc('BOE');
      const idxPelotao = loc('PELOTAO');
      const idxGrad = loc('GRAD');
      const idxMat = loc('MATRICULA');
      const idxPolicial = loc('POLICIAL');
      const idxMac = loc('MACONHA');
      const idxCoc = loc('COCAINA');

      if ([idxPelotao, idxMat, idxPolicial, idxMac, idxCoc].some(i => i === -1)) {
        throw new Error(`Cabeçalhos obrigatórios não encontrados na aba ${nomeAba}.`);
      }

      const numRows = sheet.getLastRow() - 1;
      if (numRows <= 0) return;

      const data = sheet.getRange(2, 1, numRows, lastCol).getValues();
      logs.linhasLidas += data.length;

      data.forEach(row => {
        const matricula = String(row[idxMat]).trim();
        const policial = String(row[idxPolicial]).trim();

        if (!matricula || !policial) {
          logs.linhasIgnoradas++;
          return;
        }

        const pelotao = row[idxPelotao];
        const graduacao = idxGrad !== -1 ? row[idxGrad] : "";
        const mac = Number(row[idxMac]) || 0;
        const coc = Number(row[idxCoc]) || 0;
        const boe = idxBoe !== -1 ? String(row[idxBoe]).trim() : "";

        dadosBrutos.push({
          chave: matricula + "|" + policial,
          matricula,
          policial,
          pelotao,
          graduacao,
          mac,
          coc,
          boe
        });
      });
    });

    if (dadosBrutos.length === 0) {
      ui.alert('Aviso', 'Nenhum registro válido encontrado.', ui.ButtonSet.OK);
      return;
    }

    const produtividade = {};
    dadosBrutos.forEach(item => {
      if (!produtividade[item.chave]) {
        produtividade[item.chave] = {
          matricula: item.matricula,
          nome: item.policial,
          pelotao: item.pelotao,
          graduacao: item.graduacao,
          mac: 0,
          coc: 0,
          ocorrencias: 0,
          boes: new Set()
        };
        logs.policiaisUnicos++;
      }

      const p = produtividade[item.chave];
      p.mac += item.mac;
      p.coc += item.coc;
      p.ocorrencias++;
      if (item.boe) p.boes.add(item.boe);

      logs.totalMac += item.mac;
      logs.totalCoc += item.coc;
    });

    let ranking = Object.values(produtividade).map(p => {
      const total = p.mac + p.coc;
      return [p.pelotao, p.graduacao, p.matricula, p.nome, p.mac, p.coc, total, p.ocorrencias, p.boes.size];
    });

    ranking.sort((a, b) => b[6] - a[6]);

    let nomeBase = modo === 'ANUAL' ? 'COMP_DROGAS_2026' : `COMP_DROGAS_${logs.abasProcessadas[0]}_${logs.abasProcessadas.at(-1) || ''}`;
    let nomeFinal = nomeBase;
    let versao = 1;
    while (ss.getSheetByName(nomeFinal)) {
      nomeFinal = `${nomeBase}.v${versao}`;
      versao++;
    }

    const novaAba = ss.insertSheet(nomeFinal);
    const cabecalho = [['POS', 'PELOTÃO', 'GRADUAÇÃO', 'MATRÍCULA', 'POLICIAL', 'MACONHA (g)', 'COCAÍNA (g)', 'TOTAL (g)', 'OCORRÊNCIAS', 'BOEs']];
    const borderStyle = (typeof SpreadsheetApp !== 'undefined' && SpreadsheetApp.BorderStyle)
      ? SpreadsheetApp.BorderStyle.SOLID
      : 'SOLID';
    
    novaAba.getRange(1, 1, 1, 10)
      .setValues(cabecalho)
      .setFontFamily('Arial')
      .setFontSize(10)
      .setFontWeight('bold')
      .setBackground('#e0e0e0')
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle')
      .setBorder(true, true, true, true, true, true, '#000000', borderStyle);

    novaAba.setFrozenRows(1);

    if (ranking.length > 0) {
      const dadosFormatados = ranking.map((row, i) => [i + 1, ...row]);
      const dataRange = novaAba.getRange(2, 1, dadosFormatados.length, 10);
      dataRange
        .setValues(dadosFormatados)
        .setFontFamily('Arial')
        .setFontSize(10)
        .setVerticalAlignment('middle')
        .setBorder(true, true, true, true, true, true, '#000000', borderStyle);

      let backgrounds = [];
      let fontColors = [];
      let fontWeights = [];

      ranking.forEach(row => {
        const pel = row[0];
        const grad = row[1];
        const total = row[6];

        const cPel = corPorGrupoDrogas_(grad, pel);
        const cTot = corPorTotalDrogas_(total);

        backgrounds.push([
          cPel.fundo, cPel.fundo, cPel.fundo, cPel.fundo, cPel.fundo, cPel.fundo, cPel.fundo,
          cTot.fundo,
          cPel.fundo, cPel.fundo
        ]);

        fontColors.push([
          cPel.fonte, cPel.fonte, cPel.fonte, cPel.fonte, cPel.fonte, cPel.fonte, cPel.fonte,
          cTot.fonte,
          cPel.fonte, cPel.fonte
        ]);

        const wPel = cPel.negrito ? 'bold' : 'normal';
        const wTot = cTot.negrito ? 'bold' : 'normal';

        fontWeights.push([
          wPel, wPel, wPel, wPel, wPel, wPel, wPel,
          wTot,
          wPel, wPel
        ]);
      });

      dataRange.setBackgrounds(backgrounds);
      dataRange.setFontColors(fontColors);
      dataRange.setFontWeights(fontWeights);

      // Alinhamentos: POS, Pelotão, Graduação, Matrícula centralizados; Policial à esquerda; Métricas à direita
      novaAba.getRange(2, 1, ranking.length, 4).setHorizontalAlignment('center');
      novaAba.getRange(2, 5, ranking.length, 1).setHorizontalAlignment('left');
      novaAba.getRange(2, 6, ranking.length, 5).setHorizontalAlignment('right');

      // Formatos: Gramagem F:H em #,##0.00" g"; Ocorrências e BOEs I:J em #,##0
      novaAba.getRange(2, 6, ranking.length, 3).setNumberFormat('#,##0.00" g"');
      novaAba.getRange(2, 9, ranking.length, 2).setNumberFormat('#,##0');

      // Cria filtro de dados
      novaAba.getRange(1, 1, ranking.length + 1, 10).createFilter();
    }

    novaAba.autoResizeColumns(1, 10);

    const duration = (new Date() - startTime) / 1000;
    const nomeLog = modo === 'ANUAL' ? 'LOG_DROGAS_ANUAL' : 'LOG_DROGAS_LIVRE';
    let abaLog = ss.getSheetByName(nomeLog);
    if (!abaLog) abaLog = ss.insertSheet(nomeLog);

    abaLog.clear();
    const conteudoLog = [
      ['RELATÓRIO DE EXECUÇÃO - COMPILADOR DE ENTORPECENTES'],
      ['Modo:', modo],
      ['Data/Hora:', Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss")],
      ['Duração:', duration.toFixed(2) + ' segundos'],
      ['Aba Gerada:', nomeFinal],
      ['Meses Processados:', logs.abasProcessadas.length],
      [''],
      ['ESTATÍSTICAS GERAIS'],
      ['Linhas Lidas:', logs.linhasLidas],
      ['Policiais Únicos:', logs.policiaisUnicos],
      ['Linhas Ignoradas:', logs.linhasIgnoradas],
      ['Total Maconha:', logs.totalMac.toFixed(2) + ' g'],
      ['Total Cocaína:', logs.totalCoc.toFixed(2) + ' g'],
      ['Total Geral:', (logs.totalMac + logs.totalCoc).toFixed(2) + ' g'],
      [''],
      ['AVISOS']
    ];

    logs.avisosGerados.forEach(aviso => conteudoLog.push(['•', aviso]));

    abaLog.getRange(1, 1, conteudoLog.length, 2).setValues(conteudoLog.map(l => l.length === 1 ? [l[0], ''] : l));
    abaLog.autoResizeColumns(1, 2);

    ui.alert('Sucesso!', `Compilação finalizada!\nAba gerada: ${nomeFinal}`, ui.ButtonSet.OK);

  } catch (error) {
    ui.alert('Erro bloqueante', error.message, ui.ButtonSet.OK);
  }
}
```

## Responsabilidade observada

Fonte: `02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-01_RELATORIOS_OFICIAIS/MOD-C06-01_RELATORIOS_OFICIAIS.md` — CAPSULA do modulo (formato 46.2), "## Responsabilidade".

Gerar e publicar os **relatorios oficiais** do produto - em especial o `COMPARATIVO_2026` (produtividade
consolidada por policial) - a partir dos fatos canonicos, com renderizacao propria.

Fonte: `02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-01_RELATORIOS_OFICIAIS/MOD-C06-01_RELATORIOS_OFICIAIS.md` — CAPSULA do modulo (formato 46.2), "## Limites".

- **Nao decide regra de dominio:** consome o que o C04 consolidou e o que a ARCA declara.
- **Nao corrige a fonte:** quando o valor publicado diverge, o defeito e rastreado ate a origem
  (o #152 separa "defeito do produto" de "defeito da entrada").
- **Nao inventa valor:** a ordem de entrega de armas segue a regra do proprietario (score desc, empate por
  antiguidade - R10) e a divergencia fica **registrada**, nao resolvida por conveniencia.

## Portas expostas (se aplicável)

- Superfície exposta no nível do arquivo (nível global): `corPorGrupoDrogas_`, `corPorTotalDrogas_`, `criarMenuDrogas_`, `iniciarModoAnualDrogas`, `abrirMenuSelecaoLivreDrogas`, `processarMenuLivreDrogas`, `executarCompiladorDrogas`
- Membros públicos observados: `executarCompiladorDrogas`

_Extraído por heurística do gerador (globais de nível arquivo + métodos/accessors de 1º–2º nível). Não substitui a declaração de porta da Planta: confirme no endereço acima._

## Divergência com a Planta declarada

Testes mecânicos executados na geração (commit `fbb0608`, 2026-09-13T21:44:58-03:00):

- OK — T1 endereco existe: NOTA_DE_RESPONSABILIDADE.md do modulo presente
- OK — T3 arquivo presente no commit de referencia (fbb0608:Compilador de Entorpecentes.js)
- OK — T4 conteudo em disco identico ao do commit de referencia (sha256 LF)
- OK — T5 espelho anterior sem deriva de codigo (sha256 do bloco == origem)
- OK — T6 endereco declarado no espelho anterior corresponde ao endereco canonico atual
- OK — T7 sem duplicidade: exatamente 1 espelho de leitura declara "Compilador de Entorpecentes.js" como origem
- **ACHADO** — T2 artefato NAO declarado no endereco: "Compilador de Entorpecentes.js" nao aparece nas NOTAS/capsula de C06_Relatorios / MOD-C06-01_RELATORIOS_OFICIAIS

Veredito mecânico: **1 divergência(s) detectada(s) pelos testes acima**.

Declaração verificada a mão por humano/agente (não derivável automaticamente):

- **Como o endereco foi derivado (nao inventado):** menção em arquivo do próprio endereço; fonte `02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-01_RELATORIOS_OFICIAIS/CIR-MOD-C06-01_RELATORIOS_OFICIAIS.canvas`.
- **Enderecos concorrentes declarados na Planta (1):** `C01_Entrada/MOD-C01-01_FORMULARIO_E_MENUS`. O artefato e referenciado em mais de um endereco; o campo acima registra o endereco PRIMARIO. Nao e erro de endereco — e declaracao concorrente na propria Planta.
- **Nada foi corrigido no artefato:** o gerador nao altera codigo de produto; o arquivo de origem permanece byte a byte como estava.

## Última verificação (data/commit)

- 2026-09-13T21:44:58-03:00 · commit `fbb0608` · sha256 da origem (LF): `b2dcad1e754b6abc59d58ccb878d7a35a826de1e3835f28f4396fc6a07050a3f`
- Reexecutar: `node scripts/downplant/espelho-rico.mjs gerar --endereco C06_Relatorios/MOD-C06-01_RELATORIOS_OFICIAIS --origem Compilador de Entorpecentes.js --saida <caminho>`
- Verificar deriva sem regravar: `node scripts/downplant/espelho-rico.mjs verificar --espelho <caminho>`
