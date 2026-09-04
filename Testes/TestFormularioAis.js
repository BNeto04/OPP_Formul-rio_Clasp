'use strict';
if (typeof require === 'undefined') { /* Ignora no Apps Script */ } else {

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- TESTANDO DETERMINAÇÃO TERRITORIAL DE AIS (TASK: FORMULARIO-AIS-TERRITORIAL-001) ---');

// 1. Carregar módulos do domínio
const { TABELA_TERRITORIAL_AIS } = require('../Dominio/TabelaTerritorialAIS');
const { resolverAIS, normalizarTextoTerritorial } = require('../Dominio/ResolverAIS');
const { validarIntegridadeTabela } = require('../Dominio/ValidarIntegridadeTabelaAIS');
const { obterTabelaTerritorialAIS, resolverAISTerritorial } = require('../Entrada/EntradaManual');

// =========================================================================
// TESTE 1: Validação de Integridade Cartográfica da Tabela Oficial
// =========================================================================
console.log('1. Validando integridade cartográfica da tabela canônica oficial...');
const relatorioIntegridade = validarIntegridadeTabela(TABELA_TERRITORIAL_AIS);
assert.strictEqual(relatorioIntegridade.valido, true, 'Tabela territorial deve ser 100% íntegra');
assert.strictEqual(relatorioIntegridade.erros.length, 0, 'Nenhum erro cartográfico permitido na tabela');
assert.ok(relatorioIntegridade.totalMunicipiosMono >= 180, 'Deve mapear todos os municípios mono-AIS de PE');
assert.ok(relatorioIntegridade.totalBairrosMulti >= 80, 'Deve mapear malha de bairros oficiais do Recife');
console.log('   OK: Tabela íntegra com ' + relatorioIntegridade.totalMunicipiosMono + ' municípios e ' + relatorioIntegridade.totalBairrosMulti + ' bairros multi-AIS.');

// =========================================================================
// TESTE 2: Casos Canônicos Mínimos A a J da Issue #34
// =========================================================================
console.log('2. Testando casos mínimos de resolução canônica A a J...');

// Caso A: Município mono-AIS da RMR (ex: Olinda -> AIS 7)
{
  const res = resolverAIS('Olinda', 'Bairro Novo');
  assert.strictEqual(res.sucesso, true);
  assert.strictEqual(res.ais, 'AIS 7');
  assert.strictEqual(res.criterio, 'MONO_AIS_MUNICIPIO_DIRETO');
  console.log('   OK: Caso A (Olinda -> AIS 7)');
}

// Caso B: Municípios mono-AIS do Interior (Garanhuns AIS 18, Caruaru AIS 14, Petrolina AIS 26)
{
  const resGaranhuns = resolverAIS('Garanhuns', 'Centro');
  assert.strictEqual(resGaranhuns.sucesso, true);
  assert.strictEqual(resGaranhuns.ais, 'AIS 18');

  const resCaruaru = resolverAIS('Caruaru', 'Maurício de Nassau');
  assert.strictEqual(resCaruaru.sucesso, true);
  assert.strictEqual(resCaruaru.ais, 'AIS 14');

  const resPetrolina = resolverAIS('Petrolina', 'Areia Branca');
  assert.strictEqual(resPetrolina.sucesso, true);
  assert.strictEqual(resPetrolina.ais, 'AIS 26');
  console.log('   OK: Caso B (Garanhuns AIS 18, Caruaru AIS 14, Petrolina AIS 26)');
}

// Caso C: Município multi-AIS (Recife) com Bairro de AIS 3 (Boa Viagem)
{
  const res = resolverAIS('Recife', 'Boa Viagem');
  assert.strictEqual(res.sucesso, true);
  assert.strictEqual(res.ais, 'AIS 3');
  assert.strictEqual(res.criterio, 'MULTI_AIS_BAIRRO_EXATO');
  console.log('   OK: Caso C (Recife + Boa Viagem -> AIS 3)');
}

// Caso D: Município multi-AIS (Recife) com Bairro de AIS 1 (Santo Amaro / Boa Vista)
{
  const res1 = resolverAIS('Recife', 'Santo Amaro');
  assert.strictEqual(res1.sucesso, true);
  assert.strictEqual(res1.ais, 'AIS 1');

  const res2 = resolverAIS('Recife', 'Boa Vista');
  assert.strictEqual(res2.sucesso, true);
  assert.strictEqual(res2.ais, 'AIS 1');
  console.log('   OK: Caso D (Recife + Santo Amaro / Boa Vista -> AIS 1)');
}

// Caso E: Município multi-AIS (Recife) com Bairro de AIS 2 (Espinheiro / Campo Grande)
{
  const res1 = resolverAIS('Recife', 'Espinheiro');
  assert.strictEqual(res1.sucesso, true);
  assert.strictEqual(res1.ais, 'AIS 2');

  const res2 = resolverAIS('Recife', 'Campo Grande');
  assert.strictEqual(res2.sucesso, true);
  assert.strictEqual(res2.ais, 'AIS 2');
  console.log('   OK: Caso E (Recife + Espinheiro / Campo Grande -> AIS 2)');
}

// Caso F: Município multi-AIS (Recife) com Bairro de AIS 4 (Várzea / San Martin / Afogados)
{
  const res1 = resolverAIS('Recife', 'Várzea');
  assert.strictEqual(res1.sucesso, true);
  assert.strictEqual(res1.ais, 'AIS 4');

  const res2 = resolverAIS('Recife', 'San Martin');
  assert.strictEqual(res2.sucesso, true);
  assert.strictEqual(res2.ais, 'AIS 4');

  const res3 = resolverAIS('Recife', 'Afogados');
  assert.strictEqual(res3.sucesso, true);
  assert.strictEqual(res3.ais, 'AIS 4');
  console.log('   OK: Caso F (Recife + Várzea / San Martin / Afogados -> AIS 4)');
}

// Caso G: Município multi-AIS (Recife) com Bairro de AIS 5 (Casa Amarela / Apipucos)
{
  const res1 = resolverAIS('Recife', 'Casa Amarela');
  assert.strictEqual(res1.sucesso, true);
  assert.strictEqual(res1.ais, 'AIS 5');

  const res2 = resolverAIS('Recife', 'Apipucos');
  assert.strictEqual(res2.sucesso, true);
  assert.strictEqual(res2.ais, 'AIS 5');
  console.log('   OK: Caso G (Recife + Casa Amarela / Apipucos -> AIS 5)');
}

// Caso H: Recife SEM bairro -> NÃO inventar AIS, deixar nulo e status pendente
{
  const res = resolverAIS('Recife', '');
  assert.strictEqual(res.sucesso, false);
  assert.strictEqual(res.ais, null, 'NÃO deve inventar AIS para Recife sem bairro');
  assert.strictEqual(res.status, 'PENDENTE_CONFERENCIA');
  assert.strictEqual(res.criterio, 'MULTI_AIS_SEM_BAIRRO');
  console.log('   OK: Caso H (Recife sem bairro -> nulo, sem inventar AIS)');
}

// Caso I: Recife com bairro desconhecido/não catalogado -> NÃO inventar AIS
{
  const res = resolverAIS('Recife', 'Bairro Ficticio Inexistente');
  assert.strictEqual(res.sucesso, false);
  assert.strictEqual(res.ais, null, 'NÃO deve inventar AIS para bairro não reconhecido');
  assert.strictEqual(res.status, 'PENDENTE_CONFERENCIA');
  console.log('   OK: Caso I (Recife com bairro não reconhecido -> nulo)');
}

// Caso J: Município e Bairro inexistentes/desconhecidos -> NÃO chutar AIS
{
  const res = resolverAIS('Cidade Fantasma', 'Lugar Nenhum');
  assert.strictEqual(res.sucesso, false);
  assert.strictEqual(res.ais, null, 'NÃO deve chutar AIS para locais não identificados');
  assert.strictEqual(res.status, 'PENDENTE_CONFERENCIA');
  console.log('   OK: Caso J (Local desconhecido -> nulo com status pendente)');
}

// =========================================================================
// TESTE 3: Desambiguação de Homônimos Territorial
// =========================================================================
console.log('3. Testando desambiguação de homônimos...');
{
  // Jaqueira em Recife -> AIS 5 (Bairro)
  const resJaqueiraRecife = resolverAIS('Recife', 'Jaqueira');
  assert.strictEqual(resJaqueiraRecife.ais, 'AIS 5');

  // Município Jaqueira (Mata Sul) -> AIS 13
  const resJaqueiraMun = resolverAIS('Jaqueira', 'Centro');
  assert.strictEqual(resJaqueiraMun.ais, 'AIS 13');

  // Parnamirim em Recife -> AIS 5 (Bairro)
  const resParnaRecife = resolverAIS('Recife', 'Parnamirim');
  assert.strictEqual(resParnaRecife.ais, 'AIS 5');

  // Município Parnamirim (Sertão) -> AIS 22
  const resParnaMun = resolverAIS('Parnamirim', 'Centro');
  assert.strictEqual(resParnaMun.ais, 'AIS 22');

  // Município Caetés (Agreste) -> AIS 18
  const resCaetesMun = resolverAIS('Caetés', 'Centro');
  assert.strictEqual(resCaetesMun.ais, 'AIS 18');
  console.log('   OK: Desambiguação de homônimos consistente');
}

// =========================================================================
// TESTE 4: Funções de EntradaManual.js (Servidor)
// =========================================================================
console.log('4. Testando funções de EntradaManual.js...');
{
  const tab = obterTabelaTerritorialAIS();
  assert.ok(tab !== null && typeof tab === 'object');
  assert.ok(tab.municipiosMonoAis['CARUARU'] === 'AIS 14');

  const resServidor = resolverAISTerritorial('Recife', 'Boa Viagem');
  assert.strictEqual(resServidor.sucesso, true);
  assert.strictEqual(resServidor.ais, 'AIS 3');
  console.log('   OK: EntradaManual.js expõe obterTabelaTerritorialAIS e resolverAISTerritorial');
}

// =========================================================================
// TESTE 5: Simulação DOM de Formulario.html
// =========================================================================
console.log('5. Testando integração e comportamento reativo em Formulario.html...');

const htmlPath = path.join(__dirname, '../Entrada/Formulario.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

const sStart = htmlContent.indexOf('<script>');
const sEnd = htmlContent.lastIndexOf('</script>');
assert.ok(sStart !== -1 && sEnd !== -1, 'Formulario.html deve conter tag <script>');
const scriptBody = htmlContent.substring(sStart + '<script>'.length, sEnd);

// Criar ambiente DOM simulado completo
function criarAmbienteFormulario() {
  const elementos = {
    data: { value: '', addEventListener: () => {} },
    hora: { value: '', addEventListener: () => {} },
    qtd_o: { value: '1', addEventListener: () => {} },
    mike: { value: '', addEventListener: () => {} },
    boe: { value: '', addEventListener: () => {} },
    natureza: { value: '', addEventListener: () => {} },
    ais: { value: '', addEventListener: () => {} },
    cidade: { value: '', addEventListener: () => {} },
    bairro: { value: '', addEventListener: () => {} },
    detidos: { value: '', addEventListener: () => {} },
    aisBadge: { innerText: '', style: { display: 'none', background: '', color: '' } },
    aisFeedback: { innerText: '', style: { display: 'none', color: '' } },
    ocrConferenceCard: { style: { display: 'none' } },
    ocrConferenceContent: { innerHTML: '' },
    ocrTerminal: { innerText: '', scrollTop: 0, scrollHeight: 100 },
    policeTableBody: { innerHTML: '' },
    armasList: { innerHTML: '' },
    drogasList: { innerHTML: '' },
    dropZone: { addEventListener: () => {}, classList: { add: () => {}, remove: () => {} } },
    pipList: { innerHTML: '' },
    imputado: { value: 'SEM IMPUTADO' }
  };

  const listeners = {};

  Object.keys(elementos).forEach(id => {
    elementos[id].addEventListener = (evento, callback) => {
      if (!listeners[id]) listeners[id] = {};
      if (!listeners[id][evento]) listeners[id][evento] = [];
      listeners[id][evento].push(callback);
    };
    elementos[id].removeEventListener = () => {};
    elementos[id].appendChild = () => {};
  });

  const mockDocument = {
    getElementById: (id) => elementos[id] || { value: '', style: {}, innerText: '', innerHTML: '', classList: { add: () => {}, remove: () => {} }, addEventListener: () => {}, removeEventListener: () => {}, remove: () => {}, appendChild: () => {} },
    querySelectorAll: () => [],
    createElement: (tag) => ({ tag: tag, style: {}, dataset: {}, children: [], classList: { add: () => {}, remove: () => {} }, appendChild: () => {}, addEventListener: () => {}, removeEventListener: () => {}, setAttribute: () => {}, innerHTML: '', innerText: '', querySelector: () => null, querySelectorAll: () => [] })
  };

  const mockWindow = {
    addEventListener: () => {},
    removeEventListener: () => {},
    opcoesFormulario: null
  };

  return { elementos, listeners, mockDocument, mockWindow };
}

// Extrair e instanciar funções do Formulario.html
const sandboxCode = `
  const pdfjsLib = { GlobalWorkerOptions: { workerSrc: '' } };
  const google = { script: { run: { withSuccessHandler: () => ({ withFailureHandler: () => ({ obterTabelaTerritorialAIS: () => {}, resolverAISTerritorial: () => {}, getEfetivo: () => {}, obterOpcoesValidacao: () => {} }) }) } } };
  function adicionarPolicialLinha() {}
  function adicionarDrogaField() {}
  function adicionarArmaField() {}
  
  ${scriptBody}

  return {
    parseAndFill: parseAndFill,
    recalcularAisFormulario: recalcularAisFormulario,
    resolverAISCliente: resolverAISCliente,
    limparDadosDocumentoAnterior: limparDadosDocumentoAnterior,
    setTabelaCliente: (tab) => { tabelaTerritorialAisCliente = tab; },
    getAisEditadaManualmente: () => aisEditadaManualmente,
    setAisEditadaManualmente: (val) => { aisEditadaManualmente = val; }
  };
`;

const { elementos, listeners, mockDocument, mockWindow } = criarAmbienteFormulario();
const runner = new Function('window', 'document', sandboxCode);
const formApp = runner(mockWindow, mockDocument);

// Definir a tabela no cliente
formApp.setTabelaCliente(TABELA_TERRITORIAL_AIS);

// Teste 5.1: Recálculo automático quando Cidade e Bairro são preenchidos
{
  elementos.cidade.value = 'RECIFE';
  elementos.bairro.value = 'BOA VIAGEM';
  formApp.recalcularAisFormulario(true);
  assert.strictEqual(elementos.ais.value, '3', 'AIS deve ser definida como 3 para Boa Viagem / Recife');
  assert.strictEqual(elementos.aisBadge.style.display, 'inline-block');
  assert.ok(elementos.aisBadge.innerText.includes('AIS 3'));
  console.log('   OK: Recálculo de AIS automático para Recife + Boa Viagem -> 3');
}

// Teste 5.2: Recálculo automático para município mono-AIS (Olinda)
{
  elementos.cidade.value = 'OLINDA';
  elementos.bairro.value = 'BAIRRO NOVO';
  formApp.recalcularAisFormulario(true);
  assert.strictEqual(elementos.ais.value, '7', 'AIS deve ser definida como 7 para Olinda');
  console.log('   OK: Recálculo de AIS automático para Olinda -> 7');
}

// Teste 5.3: Recife SEM bairro -> NÃO inventar AIS, deixar vazio com aviso
{
  elementos.cidade.value = 'RECIFE';
  elementos.bairro.value = '';
  formApp.recalcularAisFormulario(true);
  assert.strictEqual(elementos.ais.value, '', 'AIS deve permanecer vazia quando Recife não tiver bairro');
  assert.ok(elementos.aisBadge.innerText.includes('Conferir AIS'));
  console.log('   OK: Recife sem bairro deixa AIS vazia e alerta conferência');
}

// Teste 5.4: Soberania do Operador (Edição Manual)
{
  elementos.ais.value = '19'; // Operador digitou manualmente 19
  formApp.setAisEditadaManualmente(true);

  // Sistema tenta recalcular sem forçar (ex: evento blur de cidade)
  elementos.cidade.value = 'OLINDA';
  formApp.recalcularAisFormulario(false);

  assert.strictEqual(elementos.ais.value, '19', 'Edição manual do operador NÃO pode ser sobreposta acidentalmente');
  console.log('   OK: Soberania do operador mantida');
}

// Teste 5.5: Limpeza de formulário reseta AIS e estados
{
  formApp.limparDadosDocumentoAnterior();
  assert.strictEqual(elementos.ais.value, '');
  assert.strictEqual(elementos.aisBadge.style.display, 'none');
  assert.strictEqual(formApp.getAisEditadaManualmente(), false);
  console.log('   OK: Limpeza do formulário reseta estados de AIS');
}

// Teste 5.6: Teste integrado com OCR parseAndFill
{
  const textoBO = [
    'POLÍCIA MILITAR DE PERNAMBUCO',
    'BOLETIM DE OCORRÊNCIA N: 2026/987654321',
    'BOE: 2026/5544',
    'Data: 10/08/2026 Hora: 16:30',
    'Local do Fato:',
    'Endereço: AV ENG DOMINGOS FERREIRA, 1000',
    'Bairro: BOA VIAGEM',
    'Município: RECIFE',
    'Natureza: APREENSÃO DE DROGAS',
    'Matrícula: 1021400'
  ].join('\n');

  formApp.parseAndFill(textoBO);
  assert.strictEqual(elementos.cidade.value, 'RECIFE');
  assert.strictEqual(elementos.bairro.value, 'BOA VIAGEM');
  assert.strictEqual(elementos.ais.value, '3', 'OCR deve extrair cidade, bairro e auto-determinar AIS 3');
  console.log('   OK: OCR parseAndFill preenche Cidade, Bairro e auto-determina AIS 3 com sucesso');
}

console.log('--- TODOS OS TESTES DE DETERMINAÇÃO TERRITORIAL DE AIS PASSARAM COM SUCESSO! ---');
}
