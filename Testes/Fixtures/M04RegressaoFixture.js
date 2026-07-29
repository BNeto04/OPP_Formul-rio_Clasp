'use strict';

/**
 * ARQUIVO: Testes/Fixtures/M04RegressaoFixture.js
 * DESCRIÇÃO: Fixture determinística para os testes de regressão do MotorAnaliticoV2.
 * Fornece fatos canônicos puros sem qualquer acoplamento a planilhas ou Apps Script.
 */

const RegistroCanonicoMod = require('../../Dominio/RegistroCanonico');
const RegistroCanonico = RegistroCanonicoMod.RegistroCanonico || RegistroCanonicoMod;

const M04RegressaoFixture = {
  /**
   * Cenário 1: Mesmo policial em múltiplas linhas do mesmo túnel (MIKE|BOE).
   * Valida deduplicação de ocorrências/BOE, acumulação de fatos físicos e pontuação pelo valor máximo.
   */
  obterFatosMesmoPolicialMesmoTunel() {
    return [
      new RegistroCanonico({
        origem: { ano: 2026, mes: 'JUL2026', aba: 'JUL2026', linha: 2, versaoEstrutura: '2026' },
        ocorrencia: { chave: '050500|26E100', data: '15/07/2026', mike: '050500', boe: '26E100' },
        metricasPrimarias: { detidos: 1, apfd: 1, tco: 0, boc: 0 },
        eventoPontuavel: { indicador: 'MANDADO DE PRISÃO', imputado: 'JOSE DA SILVA' },
        policiais: [
          {
            matricula: '1139207',
            nome: 'SD SILVA',
            graduacao: 'SD',
            pelotao: '1º PEL GTAR',
            armas: 1,
            maconha: 10,
            cocaina: 0,
            crack: 0,
            detidos: 1,
            apfd: 1,
            tco: 0,
            boc: 0,
            qtdBoe: 1,
            pontosRateados: 10
          }
        ]
      }),
      new RegistroCanonico({
        origem: { ano: 2026, mes: 'JUL2026', aba: 'JUL2026', linha: 3, versaoEstrutura: '2026' },
        ocorrencia: { chave: '050500|26E100', data: '15/07/2026', mike: '050500', boe: '26E100' },
        metricasPrimarias: { detidos: 0, apfd: 0, tco: 1, boc: 0 },
        eventoPontuavel: { indicador: '', imputado: '' },
        policiais: [
          {
            matricula: '1139207',
            nome: 'SD SILVA',
            graduacao: 'SD',
            pelotao: '1º PEL GTAR',
            armas: 2,
            maconha: 0,
            cocaina: 5,
            crack: 0,
            detidos: 0,
            apfd: 0,
            tco: 1,
            boc: 0,
            qtdBoe: 1,
            pontosRateados: 15 // Maior pontuação no mesmo túnel
          }
        ]
      }),
      new RegistroCanonico({
        origem: { ano: 2026, mes: 'JUL2026', aba: 'JUL2026', linha: 4, versaoEstrutura: '2026' },
        ocorrencia: { chave: '050500|26E100', data: '15/07/2026', mike: '050500', boe: '26E100' },
        metricasPrimarias: { detidos: 1, apfd: 0, tco: 0, boc: 1 },
        eventoPontuavel: { indicador: '', imputado: '' },
        policiais: [
          {
            matricula: '1139207',
            nome: 'SD SILVA',
            graduacao: 'SD',
            pelotao: '1º PEL GTAR',
            armas: 0,
            maconha: 0,
            cocaina: 0,
            crack: 2.5,
            detidos: 1,
            apfd: 0,
            tco: 0,
            boc: 1,
            qtdBoe: 1,
            pontosRateados: 10 // Pontuação menor, não deve sobrescrever o máximo (15)
          }
        ]
      })
    ];
  },

  /**
   * Cenário 2: Mesmo policial em múltiplos túneis diferentes.
   * Valida a independência da deduplicação por túnel e a soma correta dos totais.
   */
  obterFatosPolicialMultiplosTuneis() {
    return [
      // Túnel A (2 linhas)
      new RegistroCanonico({
        origem: { ano: 2026, mes: 'JUL2026', aba: 'JUL2026', linha: 5 },
        ocorrencia: { chave: '050500|26E100', data: '15/07/2026', mike: '050500', boe: '26E100' },
        policiais: [
          {
            matricula: '1139207',
            nome: 'SD SILVA',
            graduacao: 'SD',
            pelotao: '1º PEL GTAR',
            armas: 1,
            maconha: 5,
            qtdBoe: 1,
            pontosRateados: 10
          }
        ]
      }),
      new RegistroCanonico({
        origem: { ano: 2026, mes: 'JUL2026', aba: 'JUL2026', linha: 6 },
        ocorrencia: { chave: '050500|26E100', data: '15/07/2026', mike: '050500', boe: '26E100' },
        policiais: [
          {
            matricula: '1139207',
            nome: 'SD SILVA',
            graduacao: 'SD',
            pelotao: '1º PEL GTAR',
            armas: 1,
            maconha: 0,
            qtdBoe: 1,
            pontosRateados: 12 // Max no Túnel A = 12
          }
        ]
      }),
      // Túnel B (1 linha)
      new RegistroCanonico({
        origem: { ano: 2026, mes: 'JUL2026', aba: 'JUL2026', linha: 10 },
        ocorrencia: { chave: '060600|26E200', data: '16/07/2026', mike: '060600', boe: '26E200' },
        policiais: [
          {
            matricula: '1139207',
            nome: 'SD SILVA',
            graduacao: 'SD',
            pelotao: '1º PEL GTAR',
            armas: 3,
            maconha: 20,
            qtdBoe: 1,
            pontosRateados: 20 // Max no Túnel B = 20
          }
        ]
      })
    ];
  },

  /**
   * Cenário 3: Dois policiais no mesmo túnel.
   * Valida isolamento e ausência de contaminação cruzada de métricas.
   */
  obterFatosDoisPoliciaisMesmoTunel() {
    return [
      // Policial 1 (Linha 1)
      new RegistroCanonico({
        origem: { ano: 2026, mes: 'JUL2026', aba: 'JUL2026', linha: 15 },
        ocorrencia: { chave: '070700|26E300', data: '17/07/2026', mike: '070700', boe: '26E300' },
        policiais: [
          {
            matricula: '1139207',
            nome: 'SD SILVA',
            graduacao: 'SD',
            pelotao: '1º PEL GTAR',
            armas: 1,
            maconha: 10,
            cocaina: 0,
            detidos: 1,
            apfd: 1,
            qtdBoe: 1,
            pontosRateados: 10
          }
        ]
      }),
      // Policial 1 (Linha 2 - outro item da ocorrência)
      new RegistroCanonico({
        origem: { ano: 2026, mes: 'JUL2026', aba: 'JUL2026', linha: 16 },
        ocorrencia: { chave: '070700|26E300', data: '17/07/2026', mike: '070700', boe: '26E300' },
        policiais: [
          {
            matricula: '1139207',
            nome: 'SD SILVA',
            graduacao: 'SD',
            pelotao: '1º PEL GTAR',
            armas: 0,
            maconha: 5,
            cocaina: 0,
            detidos: 0,
            apfd: 0,
            qtdBoe: 1,
            pontosRateados: 10
          }
        ]
      }),
      // Policial 2 (Linha 3 - no mesmo túnel)
      new RegistroCanonico({
        origem: { ano: 2026, mes: 'JUL2026', aba: 'JUL2026', linha: 17 },
        ocorrencia: { chave: '070700|26E300', data: '17/07/2026', mike: '070700', boe: '26E300' },
        policiais: [
          {
            matricula: '1140000',
            nome: 'CB SOUZA',
            graduacao: 'CB',
            pelotao: '2º PEL GTAR',
            armas: 2,
            maconha: 0,
            cocaina: 15,
            detidos: 2,
            apfd: 2,
            qtdBoe: 1,
            pontosRateados: 8
          }
        ]
      })
    ];
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = M04RegressaoFixture;
}
