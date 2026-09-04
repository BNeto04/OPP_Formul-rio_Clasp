// Dominio/ValidarIntegridadeTabelaAIS.js
// Utilitário de validação e certificação de integridade da Tabela Territorial AIS

function validarIntegridadeTabela(tabela) {
  var relatorio = {
    valido: true,
    totalMunicipiosMono: 0,
    totalBairrosMulti: 0,
    totalBairrosMonoNotorios: 0,
    aisDetectadas: {},
    erros: [],
    avisos: []
  };

  if (!tabela) {
    relatorio.valido = false;
    relatorio.erros.push('Tabela não fornecida.');
    return relatorio;
  }

  // Validar Multi-AIS
  if (tabela.municipiosMultiAis) {
    Object.keys(tabela.municipiosMultiAis).forEach(function(mun) {
      var cfg = tabela.municipiosMultiAis[mun];
      if (!cfg.bairros || Object.keys(cfg.bairros).length === 0) {
        relatorio.valido = false;
        relatorio.erros.push('Município multi-AIS ' + mun + ' não possui bairros definidos.');
      } else {
        Object.keys(cfg.bairros).forEach(function(bairro) {
          relatorio.totalBairrosMulti++;
          var ais = cfg.bairros[bairro];
          if (!ais || typeof ais !== 'string' || !ais.startsWith('AIS ')) {
            relatorio.valido = false;
            relatorio.erros.push('Bairro ' + bairro + ' em ' + mun + ' possui AIS inválida: ' + ais);
          }
          relatorio.aisDetectadas[ais] = (relatorio.aisDetectadas[ais] || 0) + 1;
        });
      }
    });
  }

  // Validar Mono-AIS
  if (tabela.municipiosMonoAis) {
    Object.keys(tabela.municipiosMonoAis).forEach(function(mun) {
      relatorio.totalMunicipiosMono++;
      var ais = tabela.municipiosMonoAis[mun];
      if (!ais || typeof ais !== 'string' || (!ais.startsWith('AIS ') && ais !== 'AIS ESPECIAL')) {
        relatorio.valido = false;
        relatorio.erros.push('Município mono-AIS ' + mun + ' possui AIS inválida: ' + ais);
      }
      relatorio.aisDetectadas[ais] = (relatorio.aisDetectadas[ais] || 0) + 1;
    });
  }

  // Validar Bairros Mono Notórios
  if (tabela.bairrosMonoAisConhecidos) {
    Object.keys(tabela.bairrosMonoAisConhecidos).forEach(function(bairro) {
      relatorio.totalBairrosMonoNotorios++;
      var ais = tabela.bairrosMonoAisConhecidos[bairro];
      if (!ais || typeof ais !== 'string' || !ais.startsWith('AIS ')) {
        relatorio.valido = false;
        relatorio.erros.push('Bairro notório ' + bairro + ' possui AIS inválida: ' + ais);
      }
    });
  }

  // Verificar se cobriu as 26 AIS principais
  for (var i = 1; i <= 26; i++) {
    var aisEsperada = 'AIS ' + i;
    // AIS 24 pode estar agrupada na circunscrição do Araripe dependendo da lei
    if (!relatorio.aisDetectadas[aisEsperada] && i !== 24) {
      relatorio.avisos.push('Atenção: ' + aisEsperada + ' não foi mapeada em nenhum município/bairro.');
    }
  }

  return relatorio;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    validarIntegridadeTabela: validarIntegridadeTabela
  };
}
