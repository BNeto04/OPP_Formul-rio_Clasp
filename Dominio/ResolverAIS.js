// Dominio/ResolverAIS.js
// Módulo puro de resolução territorial de AIS por Município e Bairro
// Regras canônicas:
// 1. Município mono-AIS: município é suficiente para determinar a AIS com 100% de certeza.
// 2. Município multi-AIS (ex: Recife): bairro é mandatório para desambiguação.
// 3. Se município e bairro forem informados mas pertencerem a correlações conflitantes/inválidas, não inventar AIS.
// 4. Se município for desconhecido ou ausente, e bairro for de município mono-AIS notório comprovado sem ambiguidade, sugerir ou resolver com rastreabilidade.
// 5. Homônimos (ex: Jaqueira em Recife vs Jaqueira município; Caetés em Abreu e Lima vs Caetés município): prioridade contextual estrita.

function normalizarTextoTerritorial(txt) {
  if (!txt || typeof txt !== 'string') return '';
  return txt
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^A-Z0-9\s]/g, ' ')    // remove pontuação
    .replace(/\s+/g, ' ')             // remove espaços duplicados
    .trim();
}

/**
 * Resolve a AIS a partir de Município e Bairro
 * @param {string} municipio 
 * @param {string} bairro 
 * @param {object} [tabela] Tabela opcional (default usa TABELA_TERRITORIAL_AIS)
 * @returns {object} { ais: string|null, sucesso: boolean, criterio: string, status: string, observacao: string }
 */
function resolverAIS(municipio, bairro, tabela) {
  var tab = tabela;
  if (!tab && typeof TABELA_TERRITORIAL_AIS !== 'undefined') {
    tab = TABELA_TERRITORIAL_AIS;
  }
  if (!tab && typeof require !== 'undefined') {
    try {
      var mod = require('./TabelaTerritorialAIS');
      tab = mod.TABELA_TERRITORIAL_AIS;
    } catch (e) {}
  }
  if (!tab) {
    return {
      ais: null,
      sucesso: false,
      criterio: 'TABELA_AUSENTE',
      status: 'ERRO_CONFIGURACAO',
      observacao: 'Tabela territorial canônica não disponível.'
    };
  }

  var mNorm = normalizarTextoTerritorial(municipio);
  var bNorm = normalizarTextoTerritorial(bairro);

  // Caso 1: Nem município nem bairro informados
  if (!mNorm && !bNorm) {
    return {
      ais: null,
      sucesso: false,
      criterio: 'VAZIO',
      status: 'DADOS_INSUFICIENTES',
      observacao: 'Município e Bairro não informados.'
    };
  }

  // Desambiguação de Sinônimos Comuns de Municípios
  if (mNorm === 'RECIFE PE' || mNorm === 'CIDADE DO RECIFE') mNorm = 'RECIFE';
  if (mNorm === 'JABOATAO' || mNorm === 'JABOATAO DOS GUARARAPES PE') mNorm = 'JABOATAO DOS GUARARAPES';
  if (mNorm === 'CABO' || mNorm === 'CABO DE STO AGOSTINHO') mNorm = 'CABO DE SANTO AGOSTINHO';
  if (mNorm === 'S LOURENCO DA MATA' || mNorm === 'SAO LOURENCO') mNorm = 'SAO LOURENCO DA MATA';

  // Verificar se o município está mapeado como Multi-AIS
  if (mNorm && tab.municipiosMultiAis && tab.municipiosMultiAis[mNorm]) {
    var configMulti = tab.municipiosMultiAis[mNorm];
    if (bNorm) {
      if (configMulti.bairros && configMulti.bairros[bNorm]) {
        return {
          ais: configMulti.bairros[bNorm],
          sucesso: true,
          criterio: 'MULTI_AIS_BAIRRO_EXATO',
          status: 'DETERMINADO',
          observacao: 'Determinado pelo bairro ' + bNorm + ' em ' + mNorm + '.'
        };
      }

      // Tentar match parcial ou remoção de prefixos tipo "BAIRRO", "ALTO", "CONJUNTO"
      var bChaves = Object.keys(configMulti.bairros);
      for (var i = 0; i < bChaves.length; i++) {
        var chave = bChaves[i];
        if (bNorm.indexOf(chave) !== -1 || chave.indexOf(bNorm) !== -1) {
          // Se a substring for significativa (>= 5 caracteres para evitar falsos positivos)
          if (bNorm.length >= 5 && chave.length >= 5) {
            return {
              ais: configMulti.bairros[chave],
              sucesso: true,
              criterio: 'MULTI_AIS_BAIRRO_APROXIMADO',
              status: 'DETERMINADO',
              observacao: 'Determinado por correspondência aproximada do bairro ' + bNorm + ' com ' + chave + ' em ' + mNorm + '.'
            };
          }
        }
      }

      // Bairro não encontrado no município multi-AIS
      return {
        ais: null,
        sucesso: false,
        criterio: 'MULTI_AIS_BAIRRO_NAO_RECONHECIDO',
        status: 'PENDENTE_CONFERENCIA',
        observacao: 'Município ' + mNorm + ' possui múltiplas AIS e o bairro ' + bNorm + ' não possui correspondência única cadastrada.'
      };
    } else {
      // Município multi-AIS sem bairro
      return {
        ais: null,
        sucesso: false,
        criterio: 'MULTI_AIS_SEM_BAIRRO',
        status: 'PENDENTE_CONFERENCIA',
        observacao: 'Município ' + mNorm + ' possui múltiplas AIS (AIS 1 a 5). Bairro é necessário para determinar a AIS exata.'
      };
    }
  }

  // Verificar se o município está mapeado como Mono-AIS
  if (mNorm && tab.municipiosMonoAis && tab.municipiosMonoAis[mNorm]) {
    var aisMono = tab.municipiosMonoAis[mNorm];
    return {
      ais: aisMono,
      sucesso: true,
      criterio: 'MONO_AIS_MUNICIPIO_DIRETO',
      status: 'DETERMINADO',
      observacao: 'Determinado pelo município ' + mNorm + ' (100% circunscrito à ' + aisMono + ').'
    };
  }

  // Se município não foi informado ou não reconhecido, mas bairro foi informado:
  if (bNorm) {
    // 1. Verificar se o bairro é um bairro notório de município Mono-AIS
    if (tab.bairrosMonoAisConhecidos && tab.bairrosMonoAisConhecidos[bNorm]) {
      var aisBairro = tab.bairrosMonoAisConhecidos[bNorm];
      return {
        ais: aisBairro,
        sucesso: true,
        criterio: 'MONO_AIS_BAIRRO_NOTORIO',
        status: 'DETERMINADO',
        observacao: 'Determinado pelo bairro notório ' + bNorm + ' circunscrito à ' + aisBairro + '.'
      };
    }

    // 2. Se o bairro constar na tabela de Recife e município não foi informado
    if (!mNorm && tab.municipiosMultiAis && tab.municipiosMultiAis['RECIFE'] && tab.municipiosMultiAis['RECIFE'].bairros[bNorm]) {
      var aisRecife = tab.municipiosMultiAis['RECIFE'].bairros[bNorm];
      return {
        ais: aisRecife,
        sucesso: true,
        criterio: 'MULTI_AIS_BAIRRO_RECIFE_IMPLICITO',
        status: 'DETERMINADO',
        observacao: 'Bairro ' + bNorm + ' identificado na malha territorial de Recife (' + aisRecife + ').'
      };
    }
  }

  // Não foi possível determinar com segurança canônica
  return {
    ais: null,
    sucesso: false,
    criterio: 'NAO_IDENTIFICADO',
    status: 'PENDENTE_CONFERENCIA',
    observacao: 'Município (' + (mNorm || 'vazio') + ') e Bairro (' + (bNorm || 'vazio') + ') não permitiram resolução automática inequívoca.'
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    normalizarTextoTerritorial: normalizarTextoTerritorial,
    resolverAIS: resolverAIS
  };
}
