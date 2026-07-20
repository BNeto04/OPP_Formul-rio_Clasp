/**
 * ARQUIVO: Leitura/Adaptador2026.js
 * PILAR 1: Leitura e Adaptadores
 * DESCRIÇÃO: Implementação da FonteDados para o formato da OPP de 2026.
 * O adaptador NÃO agrega dados (Regra de Ouro #4). Ele apenas traduz linhas
 * físicas em instâncias de RegistroCanonico (Fatos).
 */
class Adaptador2026 {
  /**
   * Converte o conteúdo da aba em um array de Registros Canônicos (um por linha válida)
   * @param {SpreadsheetApp.Sheet} sheet - Aba do Google Sheets
   * @param {Object} metadado - Configuração da fonte via Metamodelos
   * @param {Object} mapaEfetivo - Dicionário de policiais ativos
   * @returns {Array<RegistroCanonico>}
   */
  static extrairFatos(sheet, metadado, mapaEfetivo) {
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow < 2 || lastCol < 1) return [];

    const dados = sheet.getRange(1, 1, lastRow, lastCol).getValues();
    const headers = dados[0].map(h => typeof h === 'string' ? h.trim().toUpperCase() : '');
    
    // Função auxiliar local (em ambiente real usaria SyntheonUtils)
    const loc = (nome) => {
      const idx = headers.indexOf(nome);
      return idx;
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
      matricula: loc('MATRÍCULA') > -1 ? loc('MATRÍCULA') : loc('MATRICULA'), // fallback
      militar: loc('POLICIAL'),
      grad: loc('GRAD'),
      pelotao: loc('PELOTAO') > -1 ? loc('PELOTAO') : loc('PELOTÃO'),
      armas: loc('ARMAS'),
      maconha: loc('MACONHA'),
      cocaina: loc('COCAINA') > -1 ? loc('COCAINA') : loc('COCAÍNA'),
      crack: loc('CRACK'),
      pontosTotais: loc('PONTOS_TOTAIS'),
      pontosFiccao: loc('PONTOS_FICCAO') > -1 ? loc('PONTOS_FICCAO') : loc('PONTOS_FICÇÃO'),
      detidos: loc('DETIDOS'),
      apfd: loc('APFD'),
      tco: loc('TCO'),
      boc: loc('BOC')
    };

    const registros = [];

    for (let i = 1; i < dados.length; i++) {
      const row = dados[i];
      let matriculaBruta = idx.matricula !== -1 ? String(row[idx.matricula]).trim() : '';
      
      // Validação básica (Pula linhas em branco)
      if (!matriculaBruta) continue;
      // Normalização rápida da matrícula (usaria SyntheonValidador no ambiente completo)
      let matricula = matriculaBruta.replace(/[^0-9X-]/gi, '').toUpperCase();
      if (matricula.indexOf('-') === -1 && matricula.length > 1) {
        matricula = matricula.slice(0, -1) + '-' + matricula.slice(-1);
      }

      const mike = idx.mike !== -1 ? String(row[idx.mike]).trim() : '';
      const boe = idx.boe !== -1 ? String(row[idx.boe]).trim() : '';
      const chave = (mike && boe) ? `${mike}|${boe}` : (mike || boe || `L${i+1}_${sheet.getName()}`);

      // Enriquecimento do Policial via Efetivo
      const cadastro = mapaEfetivo && mapaEfetivo[matricula] ? mapaEfetivo[matricula] : null;
      let nome = cadastro ? cadastro.nome : (idx.militar !== -1 ? String(row[idx.militar]).trim() : 'N/I');
      let grad = cadastro ? cadastro.graduacao : (idx.grad !== -1 ? String(row[idx.grad]).trim() : 'N/I');
      let pelotao = idx.pelotao !== -1 ? String(row[idx.pelotao]).trim() : 'N/I';

      // Captura segura de números
      const getNum = (colIdx) => (colIdx !== -1 && !isNaN(row[colIdx]) && row[colIdx] !== '') ? Number(row[colIdx]) : 0;

      // Cria a instância canônica representando ESTE fato imutável (esta linha exata)
      // O Leitor NÃO soma, apenas traduz a linha física para a linguagem oficial.
      const registro = new RegistroCanonico({
        origem: {
          ano: 2026,
          aba: sheet.getName(),
          linha: i + 1,
          versaoEstrutura: metadado.versao
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
          ais: getNum(idx.ais)
        },
        metricasPrimarias: {
          pontosTotais: getNum(idx.pontosTotais),
          detidos: getNum(idx.detidos),
          apfd: getNum(idx.apfd),
          tco: getNum(idx.tco),
          boc: getNum(idx.boc)
        },
        policiais: [{
          matricula: matricula,
          nome: nome.toUpperCase(),
          graduacao: grad.toUpperCase(),
          pelotao: pelotao,
          pontosRateados: getNum(idx.pontosFiccao),
          armas: Math.max(0, getNum(idx.armas)),
          maconha: Math.max(0, getNum(idx.maconha)),
          cocaina: Math.max(0, getNum(idx.cocaina)),
          crack: Math.max(0, getNum(idx.crack))
        }]
      });

      registros.push(registro);
    }

    return registros;
  }
}
