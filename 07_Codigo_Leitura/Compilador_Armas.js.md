# ESPELHO — Compilador_Armas.js

> [!NOTE] Espelho rico de código (Metodo §46.15) — gerado por `scripts/downplant/espelho-rico.mjs`
> Somente leitura. Não editar à mão: qualquer edição é sobrescrita na próxima geração.
> O código abaixo é cópia verbatim do arquivo de origem no commit declarado; divergência entre o embutido e a origem é deriva (§18.1).
> Regra do sha256 declarado: sha256 do conteúdo **normalizado para LF** (igual ao blob do Git). Em arquivo CRLF com terminador final diferente, ele difere do `sha256sum` dos bytes crus — a comparação de deriva é feita conteúdo-contra-conteúdo.
> Papel desta cópia: CANÔNICA (repositório). O derivado navegável no vault é gerado com as mesmas entradas.

- **Endereço Down Plant:** `C06_Relatorios / MOD-C06-02_MERITO_DE_ARMAS_GXT` — [NOTA_DE_RESPONSABILIDADE.md](../02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-02_MERITO_DE_ARMAS_GXT/NOTA_DE_RESPONSABILIDADE.md)
- **Arquivo de origem (link para o disco):** [`Compilador_Armas.js`](../Compilador_Armas.js)
- **Commit de referência:** `fbb0608e7b98144533628c7f9b773a10505b800d` (`fbb0608`)
- **Data da última sincronização:** 2026-09-13T21:44:59-03:00

## Código-fonte embutido

Verbatim de `Compilador_Armas.js` em `fbb0608`. sha256 do bloco (LF): `e107f4baccbd3bdcd18c7dd041617eaca7fb8b769731d0c074814f371ebc4714` — 369 linhas.

```javascript
/**
 * PROJETO: Compilador de Armas GS
 * LOTE: Ocorrência por PEL 2026
 * DESCRIÇÃO: Script para consolidação automática do rateio de produtividade de armas.
 */

// ============================================================================
// UI - ENTRADA DO FLUXO
// ============================================================================
function criarMenuArmas_() {

  const ui = SpreadsheetApp.getUi();

  ui.createMenu('Armas')
    .addItem('Selecao livre', 'abrirMenuSelecaoLivre')
    .addItem('Anual', 'iniciarModoAnual')
    .addToUi();
}

// ============================================================================
// FUNÇÕES DO COMPILADOR DE ARMAS
// ============================================================================
function iniciarModoAnual() {
  const ui = SpreadsheetApp.getUi();
  const mesesAnual = ['JAN2026', 'FEV2026', 'MAR2026', 'ABR2026', 'MAI2026', 'JUN2026', 'JUL2026', 'AGO2026', 'SET2026', 'OUT2026', 'NOV2026', 'DEZ2026'];
  
  const response = ui.alert('Modo Anual', 'Deseja processar todos os meses de 2026?', ui.ButtonSet.YES_NO);
  if (response == ui.Button.YES) {
    executarCompilador(mesesAnual, 'ANUAL');
  }
}

function abrirMenuSelecaoLivre() {
  const htmlOutput = HtmlService.createHtmlOutput(`
    <div style="font-family: Arial, sans-serif; padding: 10px;">
      <h4>Selecione os meses para compilar:</h4>
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
        <button type="button" onclick="enviar()" style="padding: 8px 15px; background: #0f9d58; color: white; border: none; border-radius: 4px; cursor: pointer;">Compilar</button>
      </form>
      <script>
        function enviar() {
          const checkboxes = document.querySelectorAll('input[name="mes"]:checked');
          const selecionados = Array.from(checkboxes).map(cb => cb.value);
          if (selecionados.length === 0) {
            alert('Selecione pelo menos um mês!');
            return;
          }
          google.script.run.withSuccessHandler(google.script.host.close).processarMenuLivre(selecionados);
        }
      </script>
    </div>
  `).setWidth(300).setHeight(400);
  
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Seleção Livre de Meses');
}

function processarMenuLivre(mesesSelecionados) {
  executarCompilador(mesesSelecionados, 'LIVRE');
}

// Tabela CANONICA de cores por grupo. Fonte unica: Render/RendererGxt.js:14-22 (CORES_PELOTAO).
// O Compilador de Armas NAO deve reinventar esta tabela (#152 PROD-ARMAS-001).
const CORES_GRUPO_ARMAS_ = {
  'OFICIAIS':    { fundo: '#F1C232', fonte: '#000000', negrito: false },
  '1º PEL GTAR': { fundo: '#00CC00', fonte: '#000000', negrito: true },
  '1º PEL':      { fundo: '#00FF00', fonte: '#000000', negrito: false },
  '2º PEL GTAR': { fundo: '#3C78D8', fonte: '#FFFFFF', negrito: true },
  '2º PEL':      { fundo: '#6D9EEB', fonte: '#000000', negrito: false },
  '3º PEL':      { fundo: '#FFFFFF', fonte: '#000000', negrito: false }
};

function corPorGrupoArmas_(grad, pelotao) {
  const g = (typeof SyntheonUtils !== 'undefined' && SyntheonUtils.normalizarTexto)
    ? SyntheonUtils.normalizarTexto(grad || '')
    : String(grad || '').toUpperCase();
  const p = (typeof SyntheonUtils !== 'undefined' && SyntheonUtils.normalizarTexto)
    ? SyntheonUtils.normalizarTexto(pelotao || '')
    : String(pelotao || '').toUpperCase();

  // SOBERANIA DOS OFICIAIS (proprietario, 12/09/2026): a marca de oficial prevalece sobre a cor
  // do pelotao. Posto isolado por fronteira de palavra (antes casava "TEN" dentro de qualquer texto).
  if (/(^|[^A-Z])(MAJ|CAP|TEN|ASP|CEL|TC)([^A-Z]|$)/.test(g) || p.indexOf('OFICIAIS') !== -1) {
    return CORES_GRUPO_ARMAS_['OFICIAIS'];
  }
  // GTAR: o nome canonico e "1º PEL GTAR" / "2º PEL GTAR" (nunca "GTAR 1").
  if (p.indexOf('GTAR') !== -1) {
    if (p.indexOf('2') !== -1) return CORES_GRUPO_ARMAS_['2º PEL GTAR'];
    if (p.indexOf('1') !== -1) return CORES_GRUPO_ARMAS_['1º PEL GTAR'];
  }
  if (p.indexOf('1') !== -1 && p.indexOf('PEL') !== -1) return CORES_GRUPO_ARMAS_['1º PEL'];
  if (p.indexOf('2') !== -1 && p.indexOf('PEL') !== -1) return CORES_GRUPO_ARMAS_['2º PEL'];
  // Fallback canonico: grupo desconhecido e o 3º PEL (RendererGxt.js:59).
  return CORES_GRUPO_ARMAS_['3º PEL'];
}

function corPorArmasArmas_(qtd) {
  if (qtd === 0) return { fundo: '#ff0000', fonte: '#ff0000' };
  if (qtd >= 10) return { fundo: '#38761d', fonte: '#ffffff' };
  if (qtd >= 6) return { fundo: '#93c47d', fonte: '#000000' };
  if (qtd >= 4) return { fundo: '#ffff00', fonte: '#000000' };
  if (qtd >= 1) return { fundo: '#ff9900', fonte: '#000000' };
  return { fundo: '#ffffff', fonte: '#000000' };
}

// ============================================================================
// MOTOR PRINCIPAL DO COMPILADOR
// ============================================================================
/** UI opcional: em contexto headless (executionApi/trigger) nao existe UI interativa. */
function _uiSeguraArmas_() {
  try {
    return (typeof SpreadsheetApp !== 'undefined' && SpreadsheetApp.getUi) ? SpreadsheetApp.getUi() : null;
  } catch (e) {
    return null;
  }
}

function executarCompilador(mesesAlvo, modo) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = _uiSeguraArmas_();
  
  let logs = {
    abasProcessadas: [],
    linhasLidas: 0,
    policiaisUnicos: 0,
    linhasIgnoradas: 0,
    avisosGerados: []
  };
  
  let dadosBrutos = [];
  
  try {
    mesesAlvo.forEach(nomeAba => {
      const sheet = ss.getSheetByName(nomeAba);
      
      if (!sheet) {
        logs.avisosGerados.push(`Aba '${nomeAba}' não encontrada — mês pulado.`);
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
      const idxMatricula = loc('MATRICULA');
      const idxPolicial = loc('POLICIAL');
      const idxGraduacao = loc('GRAD');
      // PARTICIPACAO de armas (coluna QDT ARMAS, 32 na planilha real) — NAO a arma fisica (coluna L).
      // Card #152 (relato do proprietario 12/09): lendo 'ARMAS' o compilador trazia apenas quem tem
      // a arma fisica registrada na linha; o correto e TODOS que participaram, com suas participacoes.
      const idxArmas = loc('QDT_ARMAS');
      
      if (idxPelotao === -1) throw new Error(`Coluna PELOTÃO não encontrada no cabeçalho da aba ${nomeAba}.`);
      if (idxMatricula === -1) throw new Error(`Coluna MATRICULA não encontrada no cabeçalho da aba ${nomeAba}.`);
      if (idxPolicial === -1) throw new Error(`Coluna POLICIAL não encontrada no cabeçalho da aba ${nomeAba}.`);
      if (idxArmas === -1) throw new Error(`Coluna QDT ARMAS (ou QTD ARMAS) não encontrada no cabeçalho da aba ${nomeAba}.`);
      
      const numRows = sheet.getLastRow() - 1;
      if (numRows <= 0) return;
      
      const data = sheet.getRange(2, 1, numRows, lastCol).getValues();
      logs.linhasLidas += data.length;
      
      let boesVistos = {};
      
      data.forEach((row, index) => {
        const linhaReal = index + 2;
        const boe = idxBoe !== -1 ? String(row[idxBoe]).trim() : ""; 
        const pelotao = row[idxPelotao];
        const graduacao = idxGraduacao !== -1 ? row[idxGraduacao] : "";
        const matricula = String(row[idxMatricula]).trim();
        const policial = row[idxPolicial];
        const qtdArmas = Number(row[idxArmas]);
        
        if (boe !== "") {
          if (!boesVistos[boe]) {
            boesVistos[boe] = true;
            if (matricula !== "" && qtdArmas > 0) {
              logs.avisosGerados.push(`Linha mestra do BOE ${boe} na linha ${linhaReal} (${nomeAba}) possui matrícula e QDT ARMAS preenchidos.`);
            }
          }
        }
        
        if (matricula === "" || isNaN(qtdArmas) || qtdArmas === 0) {
          logs.linhasIgnoradas++;
          return;
        }
        
        const regexNumerica = /^\d+$/;
        if (!regexNumerica.test(matricula)) {
          throw new Error(`Matrícula inválida na aba ${nomeAba}, linha ${linhaReal}: '${matricula}'.`);
        }
        
        dadosBrutos.push({ pelotao, graduacao, matricula, policial, qtdArmas });
      });
    });
    
    if (dadosBrutos.length === 0) {
      if (ui) ui.alert('Aviso', 'Nenhum dado válido de armas foi encontrado.', ui.ButtonSet.OK);
      return;
    }
    
    let produtividade = {};
    
    dadosBrutos.forEach(item => {
      if (!produtividade[item.matricula]) {
        produtividade[item.matricula] = { nome: item.policial, pelotao: item.pelotao, graduacao: item.graduacao, score: 0 };
        logs.policiaisUnicos++;
      }
      produtividade[item.matricula].score += item.qtdArmas;
    });
    
    let ranking = [];
    for (const mat in produtividade) {
      ranking.push([produtividade[mat].pelotao, produtividade[mat].graduacao, mat, produtividade[mat].nome, produtividade[mat].score]);
    }
    // ORDEM DA ENTREGA (regra do proprietario, 12/09/2026 - R6):
    //   1) quem esta mais bem colocado nas PARTICIPACOES (score desc);
    //   2) empate -> ANTIGUIDADE (posto/graduacao canonico; depois matricula mais antiga).
    // Usa o indice canonico de Core/Policiais.js (ARCA-ANTIGUIDADE-002) para nao divergir.
    const _idxAntiguidade_ = (g) => (typeof indiceAntiguidadePosto_ === 'function')
      ? indiceAntiguidadePosto_(g)
      : 999;
    ranking.sort((a, b) => {
      if (b[4] !== a[4]) return b[4] - a[4];
      const ia = _idxAntiguidade_(a[1]);
      const ib = _idxAntiguidade_(b[1]);
      if (ia !== ib) return ia - ib;
      return Number(a[2]) - Number(b[2]);
    });
    
    let nomeBaseAba = modo === 'ANUAL' ? 'COMP_ARMAS_2026' : `COMP_ARMAS_${logs.abasProcessadas[0]}_${logs.abasProcessadas[logs.abasProcessadas.length - 1]}`;
    let nomeFinalAba = nomeBaseAba;
    let versao = 1;
    
    while (ss.getSheetByName(nomeFinalAba)) {
      nomeFinalAba = `${nomeBaseAba}.v${versao}`;
      versao++;
    }
    
    const novaAba = ss.insertSheet(nomeFinalAba);
    
    const cabecalhoResultado = [['PELOTÃO', 'GRADUAÇÃO', 'MATRÍCULA', 'POLICIAL', 'ARMAS']];
    const borderStyle = (typeof SpreadsheetApp !== 'undefined' && SpreadsheetApp.BorderStyle)
      ? SpreadsheetApp.BorderStyle.SOLID
      : 'SOLID';

    novaAba.getRange(1, 1, 1, 5)
      .setValues(cabecalhoResultado)
      .setFontFamily('Arial')
      .setFontSize(10)
      .setFontWeight('bold')
      .setBackground('#e0e0e0')
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle')
      .setBorder(true, true, true, true, true, true, '#000000', borderStyle);
    
    if (ranking.length > 0) {
      const rangeDados = novaAba.getRange(2, 1, ranking.length, 5);
      rangeDados.setValues(ranking)
        .setFontFamily('Arial')
        .setFontSize(10)
        .setVerticalAlignment('middle')
        .setBorder(true, true, true, true, true, true, '#000000', borderStyle);
      
      let backgrounds = [];
      let fontColors = [];
      let fontWeights = [];
      
      ranking.forEach(row => {
        const pelotaoStr = String(row[0] || '');
        const gradStr = String(row[1] || '');
        const score = Number(row[4] || 0);
        
        const corPel = corPorGrupoArmas_(gradStr, pelotaoStr);
        const corArma = corPorArmasArmas_(score);
        
        const fwRow = corPel.negrito ? 'bold' : 'normal';
        
        backgrounds.push([corPel.fundo, corPel.fundo, corPel.fundo, corPel.fundo, corArma.fundo]);
        fontColors.push([corPel.fonte, corPel.fonte, corPel.fonte, corPel.fonte, corArma.fonte]);
        fontWeights.push([fwRow, fwRow, fwRow, fwRow, score >= 10 ? 'bold' : fwRow]);
      });
      
      rangeDados.setBackgrounds(backgrounds);
      rangeDados.setFontColors(fontColors);
      rangeDados.setFontWeights(fontWeights);
      
      novaAba.getRange(2, 1, ranking.length, 3).setHorizontalAlignment('center'); // PELOTÃO, GRAD, MAT
      novaAba.getRange(2, 4, ranking.length, 1).setHorizontalAlignment('left');   // POLICIAL
      novaAba.getRange(2, 5, ranking.length, 1).setHorizontalAlignment('right').setNumberFormat('#,##0'); // SCORE ARMAS
    }

    novaAba.setFrozenRows(1);
    novaAba.getRange(1, 1, Math.max(1, ranking.length + 1), 5).createFilter();
    novaAba.autoResizeColumns(1, 5);

    // LEGENDA DE CORES no fim da tabela (pedido do proprietario, 12/09/2026 - #152).
    // Fonte unica: Core/LegendaCores.js — nao repetir a tabela de cores dentro do compilador.
    if (typeof SyntheonLegendaCores !== 'undefined' && SyntheonLegendaCores.desenhar) {
      SyntheonLegendaCores.desenhar(novaAba, ranking.length + 3, { faixas: true });
    }
    
    const nomeLog = modo === 'ANUAL' ? 'LOG_ANUAL' : 'LOG_LIVRE';
    let abaLog = ss.getSheetByName(nomeLog);
    if (!abaLog) abaLog = ss.insertSheet(nomeLog);
    
    abaLog.clear();
    
    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
    
    const conteudoLog = [
      ['RELATÓRIO DE EXECUÇÃO - COMPILADOR DE ARMAS GS'],
      ['Modo de Execução:', modo],
      ['Data/Hora:', timestamp],
      ['Aba Gerada:', nomeFinalAba],
      [''],
      ['ESTATÍSTICAS'],
      ['Abas Processadas:', logs.abasProcessadas.join(', ') || 'Nenhuma'],
      ['Total de Linhas Lidas:', logs.linhasLidas],
      ['Policiais Únicos Identificados:', logs.policiaisUnicos],
      ['Linhas Ignoradas:', logs.linhasIgnoradas],
      ['Alertas Gerados:', logs.avisosGerados.length],
      [''],
      ['AVISOS DETALHADOS']
    ];
    
    logs.avisosGerados.forEach(aviso => conteudoLog.push(['-', aviso]));
    
    abaLog.getRange(1, 1, conteudoLog.length, 2).setValues(conteudoLog.map(linha => linha.length === 1 ? [linha[0], ''] : linha));
    abaLog.autoResizeColumns(1, 2);
    
    if (ui) ui.alert('Sucesso!', `Compilação concluída.\nAba: ${nomeFinalAba}`, ui.ButtonSet.OK);
    return { sucesso: true, aba: nomeFinalAba, logs: logs };

  } catch (error) {
    if (ui) ui.alert('Erro bloqueante', error.message, ui.ButtonSet.OK);
    return { sucesso: false, erro: error.message, logs: logs };
  }
}
// ============================================================================
// PORTA HEADLESS (clasp run / sem UI) — PROD-ARMAS-001 (#152)
// ============================================================================
function executarCompiladorArmasHeadless(mesesAlvo, modo) {
  const lista = (typeof mesesAlvo === 'string')
    ? (mesesAlvo ? mesesAlvo.split(',').map(function (s) { return s.trim(); }).filter(Boolean) : [])
    : (mesesAlvo || []);
  const r = executarCompilador(lista.length ? lista : ['JAN2026'], modo || 'LIVRE');
  return JSON.stringify(r || { sucesso: null, aviso: 'executarCompilador nao retornou resumo' });
}
```

## Responsabilidade observada

Fonte: `02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-02_MERITO_DE_ARMAS_GXT/MOD-C06-02_MERITO_DE_ARMAS_GXT.md` — CAPSULA do modulo (formato 46.2), "## Responsabilidade".

Gerar as **listas de apreensao de armas** por `P3 -> Armas -> Selecao Livre` e `Armas -> Anual` - o rateio de
produtividade de armas por PEL/GTAR a partir das armas fisicas do tunel, com a cor de cada faixa.

Fonte: `02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-02_MERITO_DE_ARMAS_GXT/MOD-C06-02_MERITO_DE_ARMAS_GXT.md` — CAPSULA do modulo (formato 46.2), "## Limites".

- **Nao inventa arma:** a fonte e `ARMA` (fisica, uma por linha); `QDT ARMAS` e participacao e **nao** entra no
  calculo (o proprio compilador lia a coluna errada - defeito real corrigido em `1b2c0ae`).
- **Nao decide a regra sozinho:** as regras embutidas foram **inferidas e registradas** (`Dominio/ARCA/REGRAS_ARMAS_INFERIDAS.md`);
  o que o proprietario ditou (R2/R6/R10) foi implementado no `be68de8`.
- **Nao altera relatorios consagrados** ao gerar as listas.

## Portas expostas (se aplicável)

- Superfície exposta no nível do arquivo (nível global): `criarMenuArmas_`, `iniciarModoAnual`, `abrirMenuSelecaoLivre`, `processarMenuLivre`, `corPorGrupoArmas_`, `corPorArmasArmas_`, `_uiSeguraArmas_`, `executarCompilador`, `executarCompiladorArmasHeadless`, `CORES_GRUPO_ARMAS_`
- Membros públicos observados: `executarCompilador`

_Extraído por heurística do gerador (globais de nível arquivo + métodos/accessors de 1º–2º nível). Não substitui a declaração de porta da Planta: confirme no endereço acima._

## Divergência com a Planta declarada

Testes mecânicos executados na geração (commit `fbb0608`, 2026-09-13T21:44:59-03:00):

- OK — T1 endereco existe: NOTA_DE_RESPONSABILIDADE.md do modulo presente
- OK — T2 artefato declarado no endereco: "Compilador_Armas.js" aparece na Planta
- OK — T3 arquivo presente no commit de referencia (fbb0608:Compilador_Armas.js)
- OK — T4 conteudo em disco identico ao do commit de referencia (sha256 LF)
- OK — T5 espelho anterior sem deriva de codigo (sha256 do bloco == origem)
- OK — T6 endereco declarado no espelho anterior corresponde ao endereco canonico atual
- OK — T7 sem duplicidade: exatamente 1 espelho de leitura declara "Compilador_Armas.js" como origem

Veredito mecânico: **nenhuma divergência detectada pelos testes acima**.

Declaração verificada a mão por humano/agente (não derivável automaticamente):

- **Como o endereco foi derivado (nao inventado):** secao Artefatos; fonte `02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-02_MERITO_DE_ARMAS_GXT/MOD-C06-02_MERITO_DE_ARMAS_GXT.md`:62.
- **Enderecos concorrentes declarados na Planta (2):** `C01_Entrada/MOD-C01-01_FORMULARIO_E_MENUS`, `C06_Relatorios/MOD-C06-01_RELATORIOS_OFICIAIS`. O artefato e referenciado em mais de um endereco; o campo acima registra o endereco PRIMARIO. Nao e erro de endereco — e declaracao concorrente na propria Planta.
- **Divergencia com o espelho anterior:** o espelho antigo declarava o modulo `MOD-C06-01_RELATORIOS_OFICIAIS`; a derivacao atual chega a `C06_Relatorios/MOD-C06-02_MERITO_DE_ARMAS_GXT`. Divergencia declarada, nao sobrescrita em silencio.
- **Nada foi corrigido no artefato:** o gerador nao altera codigo de produto; o arquivo de origem permanece byte a byte como estava.

## Última verificação (data/commit)

- 2026-09-13T21:44:59-03:00 · commit `fbb0608` · sha256 da origem (LF): `e107f4baccbd3bdcd18c7dd041617eaca7fb8b769731d0c074814f371ebc4714`
- Reexecutar: `node scripts/downplant/espelho-rico.mjs gerar --endereco C06_Relatorios/MOD-C06-02_MERITO_DE_ARMAS_GXT --origem Compilador_Armas.js --saida <caminho>`
- Verificar deriva sem regravar: `node scripts/downplant/espelho-rico.mjs verificar --espelho <caminho>`
