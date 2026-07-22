/**
 * ARQUIVO: Homologacao/RodarTesteDeHomologacao.js
 * DESCRICAO: Ponto de entrada publico chamado pelo menu do Google Sheets.
 */
function rodarTesteDeHomologacao() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const sheet = ss.getActiveSheet();

  if (!sheet) {
    ui.alert('Homologacao V1 x V2', 'Nenhuma aba ativa foi encontrada.', ui.ButtonSet.OK);
    return null;
  }

  const nomeAba = sheet.getName();
  const regexMes = /^[A-Z]{3}\d{4}$/;
  if (!regexMes.test(nomeAba)) {
    ui.alert(
      'Homologacao V1 x V2',
      `Abra uma aba mensal antes de rodar a homologacao. Aba atual: ${nomeAba}`,
      ui.ButtonSet.OK
    );
    return null;
  }

  try {
    const metadado = CatalogoEstruturas[FonteDados.OPP_2026];
    const mapaEfetivo = SyntheonPoliciais.carregarEfetivo(ss);
    const engine = new HomologationEngine(new HomologationSheetsDriver());

    engine.registrarTeste(testPontuacao);
    engine.registrarTeste(testOcorrencias);
    engine.registrarTeste(testArmas);
    engine.registrarTeste(testDrogas);

    const relatorio = engine.executar(sheet, metadado, mapaEfetivo);
    const status = relatorio.sucessoTotal ? 'APROVADA' : 'REPROVADA';

    ui.alert(
      'Homologacao V1 x V2',
      `Homologacao ${status} para ${nomeAba}.\nConsulte a aba [DEBUG] Homologacao.`,
      ui.ButtonSet.OK
    );

    return relatorio;
  } catch (erro) {
    const mensagem = erro && erro.stack ? erro.stack : String(erro);
    Logger.log(mensagem);
    ui.alert('Erro na Homologacao V1 x V2', mensagem, ui.ButtonSet.OK);
    throw erro;
  }
}
