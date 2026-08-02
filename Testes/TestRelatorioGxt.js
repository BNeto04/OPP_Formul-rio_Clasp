/**
 * ARQUIVO: Testes/TestRelatorioGxt.js
 * DESCRIÇÃO: Suíte de Testes Unitários e Integrados do Relatório Trimestral Gxt (TASK-M06.3-05I.2).
 * Valida: 3 meses, líder correto por N, 1 ocorrência por túnel, cores GTAR, total mensal e exclusão de pendentes.
 */

const assert = require('assert');
const ModGxt = require('../Features/CompiladorGxt');
const CompiladorGxt = ModGxt.CompiladorGxt || ModGxt;
const { gerarGxtSelecaoLivre, gerarGxtAnual } = ModGxt;
const RendererGxt = require('../Render/RendererGxt');

function executarTestesGxt() {
  console.log('🧪 Iniciando Testes Unitários e Integrados: Relatório Trimestral Gxt (M06.3-05I.2)...\n');
  let sucessos = 0;

  function test(nome, fn) {
    try {
      fn();
      console.log(`  ✅ [PASS] ${nome}`);
      sucessos++;
    } catch (e) {
      console.error(`  ❌ [FAIL] ${nome}: ${e.message}`);
      throw e;
    }
  }

  const mockPeculioOficial = {
    getSheetByName: (n) => {
      if (n === 'EFETIVO' || n === 'PECULIO') {
        return {
          getLastRow: () => 5,
          getLastColumn: () => 5,
          getRange: () => ({
            getValues: () => [
              ['ORD', 'MATRÍCULA', 'GRAD.', 'NOME DE GUERRA', 'SUB-UNIDADE'],
              [1, '108394-5', '3º SGT', 'IRAN SILVA', '1º PEL GTAR'],
              [5, '102950-9', '2º SGT', 'SAULO ALVES', '2º PEL GTAR'],
              [12, '113920-7', '3º SGT', 'MARCONI LIMA', '1º PEL'],
              [30, '118108-4', 'CB', 'CB TORRES', '2º PEL']
            ]
          })
        };
      }
      return null;
    }
  };

  // 1. Compilação de Três Meses com Resolução Legítima do Líder (TASK-M06.3-04A)
  test('CompiladorGxt: compila 3 meses, seleciona o líder mais antigo (menor N) por túnel e agrupa 100% das armas', () => {
    const dadosOcorrenciasJan = [
      {
        data: '15/01/2026', mike: '26E100', boe: 'BOE1', armas: 2,
        policiais: [
          { matricula: '102950-9', nome: 'SAULO ALVES', grad: '2º SGT', pelotao: '2º PEL GTAR' },
          { matricula: '108394-5', nome: 'IRAN SILVA', grad: '3º SGT', pelotao: '1º PEL GTAR' } // IRAN (N=1) é mais antigo
        ]
      }
    ];

    const dadosOcorrenciasFev = [
      {
        data: '10/02/2026', mike: '26E200', boe: 'BOE2', armas: 1,
        policiais: [
          { matricula: '113920-7', nome: 'MARCONI LIMA', grad: '3º SGT', pelotao: '1º PEL' } // MARCONI (N=12)
        ]
      }
    ];

    const dadosOcorrenciasMar = [
      {
        data: '05/03/2026', mike: '26E300', boe: 'BOE3', armas: 3,
        policiais: [
          { matricula: '102950-9', nome: 'SAULO ALVES', grad: '2º SGT', pelotao: '2º PEL GTAR' } // SAULO (N=5)
        ]
      }
    ];

    const fonteMock = {
      JAN2026: dadosOcorrenciasJan,
      FEV2026: dadosOcorrenciasFev,
      MAR2026: dadosOcorrenciasMar
    };

    const resultado = CompiladorGxt.compilar(fonteMock, ['JAN2026', 'FEV2026', 'MAR2026'], mockPeculioOficial);

    assert.ok(resultado['JAN2026']);
    assert.strictEqual(resultado['JAN2026'].registros.length, 1);
    assert.strictEqual(resultado['JAN2026'].registros[0].matricula, '108394-5');
    assert.strictEqual(resultado['JAN2026'].registros[0].nome, 'IRAN SILVA');
    assert.strictEqual(resultado['JAN2026'].registros[0].qtdArmas, 2);
    assert.strictEqual(resultado['JAN2026'].registros[0].numSeq, 1);

    assert.strictEqual(resultado['FEV2026'].registros[0].matricula, '113920-7');
    assert.strictEqual(resultado['FEV2026'].registros[0].qtdArmas, 1);

    assert.strictEqual(resultado['MAR2026'].registros[0].matricula, '102950-9');
    assert.strictEqual(resultado['MAR2026'].registros[0].qtdArmas, 3);
  });

  // 2. Exclusão de Túneis Pendentes de Auditoria (TASK-M06.3-04A)
  test('CompiladorGxt: exclui do relatório de mérito qualquer túnel com status PENDENTE_AUDITORIA', () => {
    const dadosOcorrenciasPendente = [
      {
        data: '15/01/2026', mike: '26E100', boe: 'BOE_PEND', armas: 2,
        policiais: [
          { matricula: '999999-9', nome: 'POLICIAL SEM N', grad: 'SD', pelotao: '3º PEL' } // N ausente -> PENDENTE_AUDITORIA
        ]
      }
    ];

    const fonteMock = { JAN2026: dadosOcorrenciasPendente };

    const resultado = CompiladorGxt.compilar(fonteMock, ['JAN2026'], mockPeculioOficial);

    assert.strictEqual(resultado['JAN2026'].registros.length, 0, 'Túnel pendente de auditoria deve ser excluído do mérito');
  });

  // 3. Renderização Executiva com Cores GTAR e Totais Mensais (TASK-M06.3-04A)
  test('RendererGxt: renderiza 3 blocos mensais lado a lado com cores GTAR e totais calculados', () => {
    const dadosCompilados = {
      JAN2026: {
        registros: [
          { numSeq: 1, matricula: '108394-5', grad: '3º SGT', nome: 'IRAN SILVA', qtdArmas: 2, armasFogo: 2, armasArtesanais: 0, designacao: '1º PEL GTAR' }
        ],
        resumo: { '1º PEL GTAR': 2, '2º PEL GTAR': 0, '1º PEL': 0, '2º PEL': 0, '3º PEL': 0, 'TOTAL': 2 }
      },
      FEV2026: {
        registros: [
          { numSeq: 1, matricula: '102950-9', grad: '2º SGT', nome: 'SAULO ALVES', qtdArmas: 4, armasFogo: 4, armasArtesanais: 0, designacao: '2º PEL GTAR' }
        ],
        resumo: { '1º PEL GTAR': 0, '2º PEL GTAR': 4, '1º PEL': 0, '2º PEL': 0, '3º PEL': 0, 'TOTAL': 4 }
      }
    };

    let matrizDados = null;

    const mockSheetTarget = {
      getName: () => 'GTAR X TROPA ARMAS 2026',
      clear: () => {},
      _definirDadosMatriz: (m) => { matrizDados = m; }
    };

    const mockSS = {
      getSheetByName: () => mockSheetTarget,
      insertSheet: () => mockSheetTarget
    };

    const sheetResult = RendererGxt.renderizar(mockSS, dadosCompilados, 'GTAR X TROPA ARMAS 2026');
    assert.ok(sheetResult);
    assert.ok(matrizDados);

    // Valida o cabeçalho do Mês 1 (JAN2026) na Coluna A (idx 0)
    assert.strictEqual(matrizDados.valores[0][0], 'JAN2026');
    assert.strictEqual(matrizDados.valores[1][0], 'Nº');
    assert.strictEqual(matrizDados.valores[1][1], 'GRAD. / MATRÍCULA');
    assert.strictEqual(matrizDados.valores[1][3], 'QTD ARMAS');

    // Valida a cor oficial do 1º PEL GTAR (#00CC00, negrito) na linha de registro (linha 3, idx 2)
    assert.strictEqual(matrizDados.fundos[2][0], '#00CC00');
    assert.strictEqual(matrizDados.negritos[2][0], true);

    // Valida o destaque de armas na escala oficial consagrada (qtd 2 -> #FF9900 laranja)
    assert.strictEqual(matrizDados.fundos[2][3], '#FF9900');

    // Valida o Mês 2 (FEV2026) na Coluna G (colStart 6, idx 6)
    assert.strictEqual(matrizDados.valores[0][6], 'FEV2026');

    // Valida a cor oficial do 2º PEL GTAR (#3C78D8, texto #FFFFFF)
    assert.strictEqual(matrizDados.fundos[2][6], '#3C78D8');
    assert.strictEqual(matrizDados.coresTexto[2][6], '#FFFFFF');
  });

  // 4. Teste Integrado com Adaptador2026.extrairFatos() e Planilha Simulada (TASK-M06.3-04B)
  test('CompiladorGxt + Adaptador2026: pipeline completo converte RegistroCanonico e seleciona líder correto', () => {
    const rawHeaders = ['DATA', 'HORA', 'MIKE', 'MATRÍCULA', 'POLICIAL', 'GRAD', 'PELOTÃO', 'ARMAS', 'INDICADOR PIP'];
    const rawDataJan = [
      rawHeaders,
      ['15/01/2026', '10:00', '26E100', '102950-9', 'SAULO ALVES', '2º SGT', '2º PEL GTAR', 2, 'PORTE ILEGAL DE ARMA DE FOGO'],
      ['15/01/2026', '10:00', '26E100', '108394-5', 'IRAN SILVA', '3º SGT', '1º PEL GTAR', 0, 'PORTE ILEGAL DE ARMA DE FOGO'] // IRAN (N=1) em linha sem arma no mesmo túnel
    ];

    const mockSheetJan = {
      getName: () => 'JAN2026',
      getLastRow: () => 3,
      getLastColumn: () => 9,
      getRange: () => ({
        getValues: () => rawDataJan
      })
    };

    const fonteSS = {
      getSheetByName: (n) => (n === 'JAN2026' ? mockSheetJan : null)
    };

    const resultado = CompiladorGxt.compilar(fonteSS, ['JAN2026'], mockPeculioOficial);

    assert.ok(resultado['JAN2026']);
    assert.strictEqual(resultado['JAN2026'].registros.length, 1);
    assert.strictEqual(resultado['JAN2026'].registros[0].matricula, '108394-5', 'Deve selecionar IRAN SILVA (N=1) como líder');
    assert.strictEqual(resultado['JAN2026'].registros[0].qtdArmas, 2, 'Deve atribuir 100% das 2 armas do túnel ao líder');
  });

  // 5. Validação Estrita das Cinco Faixas da Escala Oficial de Armas (TASK-M06.3-04C)
  test('RendererGxt.corPorArmas: valida fielmente as cinco faixas da escala oficial de destaque de armas', () => {
    const f0 = RendererGxt.corPorArmas(0);
    assert.strictEqual(f0.fundo, '#FF0000');
    assert.strictEqual(f0.texto, '#FF0000');

    const f1 = RendererGxt.corPorArmas(2);
    assert.strictEqual(f1.fundo, '#FF9900');
    assert.strictEqual(f1.texto, '#000000');

    const f2 = RendererGxt.corPorArmas(5);
    assert.strictEqual(f2.fundo, '#FFFF00');
    assert.strictEqual(f2.texto, '#000000');

    const f3 = RendererGxt.corPorArmas(8);
    assert.strictEqual(f3.fundo, '#93C47D');
    assert.strictEqual(f3.texto, '#000000');

    const f4 = RendererGxt.corPorArmas(12);
    assert.strictEqual(f4.fundo, '#38761D');
    assert.strictEqual(f4.texto, '#FFFFFF');
    assert.strictEqual(f4.negrito, true);
  });

  // 6. Seleção Livre Encaminha Apenas os Meses Marcados para Nome de Saída Padronizado (TASK-M06.3-04D)
  test('gerarGxtSelecaoLivre: encaminha apenas os meses selecionados e cria aba GXT_ACUMULADO_<primeiro>_<ultimo>', () => {
    const abasCriadas = [];
    const dummyLogSheet = { clear: () => {}, getRange: () => ({ setValues: () => {} }) };
    const mockSS = {
      getSheetByName: (n) => n === '[LOG] Gxt' ? dummyLogSheet : null,
      insertSheet: (n) => {
        abasCriadas.push(n);
        return { clear: () => {}, _definirDadosMatriz: () => {} };
      }
    };

    const resultado = gerarGxtSelecaoLivre(['JAN2026', 'FEV2026'], mockPeculioOficial, mockSS);
    assert.ok(resultado['JAN2026']);
    assert.ok(resultado['FEV2026']);
    assert.strictEqual(resultado['MAR2026'], undefined);
    assert.strictEqual(abasCriadas.length, 1);
    assert.strictEqual(abasCriadas[0], 'GXT_ACUMULADO_JAN2026_FEV2026');
  });

  // 7. Modo Anual Divide os 12 Meses em 4 Saídas Trimestrais (TASK-M06.3-04D)
  test('gerarGxtAnual: divide os 12 meses em 4 saídas trimestrais GXT_1T..4T sem sobrescrever abas existentes', () => {
    const abasCriadas = [];
    const dummyLogSheet = { clear: () => {}, getRange: () => ({ setValues: () => {} }) };
    const mockSS = {
      getSheetByName: (n) => {
        if (n === '[LOG] Gxt') return dummyLogSheet;
        if (n === 'OUTRO_RELATORIO') return { name: 'OUTRO_RELATORIO' };
        return null;
      },
      insertSheet: (n) => {
        abasCriadas.push(n);
        return { clear: () => {}, _definirDadosMatriz: () => {} };
      }
    };

    const resAnual = gerarGxtAnual(mockSS, mockPeculioOficial);
    assert.ok(resAnual['GXT_1T_2026']);
    assert.ok(resAnual['GXT_2T_2026']);
    assert.ok(resAnual['GXT_3T_2026']);
    assert.ok(resAnual['GXT_4T_2026']);

    assert.strictEqual(abasCriadas.length, 4);
    assert.deepStrictEqual(abasCriadas, ['GXT_1T_2026', 'GXT_2T_2026', 'GXT_3T_2026', 'GXT_4T_2026']);
  });

  // 8. Seleção Livre com 4 ou Mais Meses Empilha Painéis Verticais sem Perda de Dados (TASK-M06.3-04E)
  test('gerarGxtSelecaoLivre: 5 meses desordenados são ordenados e empilhados em painéis verticais na mesma aba acumulada', () => {
    let matrizCompilada = null;
    const mockSheetTarget = {
      getName: () => 'GXT_ACUMULADO_JAN2026_MAI2026',
      clear: () => {},
      _definirDadosMatriz: (m) => { matrizCompilada = m; }
    };

    const mockSS = {
      getSheetByName: () => mockSheetTarget,
      insertSheet: () => mockSheetTarget
    };

    const mesesDesordenados = ['MAI2026', 'FEV2026', 'JAN2026', 'ABR2026', 'MAR2026'];
    const res = gerarGxtSelecaoLivre(mesesDesordenados, mockPeculioOficial, mockSS);

    assert.ok(res['JAN2026']);
    assert.ok(res['FEV2026']);
    assert.ok(res['MAR2026']);
    assert.ok(res['ABR2026']);
    assert.ok(res['MAI2026']);
    assert.ok(matrizCompilada);

    assert.strictEqual(matrizCompilada.valores[0][0], 'JAN2026');
    assert.strictEqual(matrizCompilada.valores[0][6], 'FEV2026');
    assert.strictEqual(matrizCompilada.valores[0][12], 'MAR2026');

    const rowPainel2 = 21;
    assert.strictEqual(matrizCompilada.valores[rowPainel2][0], 'ABR2026');
    assert.strictEqual(matrizCompilada.valores[rowPainel2][6], 'MAI2026');
  });

  // 9. Localização Flexível de Abas Mensais por Aproximação Normalizada (TASK-M06.3-05C)
  test('CompiladorGxt.localizarAbaMes: encontra abas com pontos, traços e variações como abr.2026', () => {
    const mockSheetAbr = { getName: () => 'abr.2026' };
    const mockSS = {
      getSheetByName: (n) => (n === 'abr.2026' ? mockSheetAbr : null),
      getSheets: () => [mockSheetAbr]
    };

    const achado = CompiladorGxt.localizarAbaMes(mockSS, 'ABR2026');
    assert.ok(achado);
    assert.strictEqual(achado.getName(), 'abr.2026');
  });

  // 10. Bloqueio Seguro quando o Pecúlio é Indisponível (TASK-M06.3-05G)
  test('gerarGxtSelecaoLivre: bloqueia geração e NÃO altera a planilha de saída quando Pecúlio é indisponível', () => {
    let folhaLimpa = false;
    const dummyLogSheet = { clear: () => {}, getRange: () => ({ setValues: () => {} }) };
    const mockSS = {
      getSheetByName: (n) => (n === '[LOG] Gxt' ? dummyLogSheet : {
        clear: () => { folhaLimpa = true; }
      }),
      insertSheet: (n) => (n === '[LOG] Gxt' ? dummyLogSheet : {
        clear: () => { folhaLimpa = true; }
      })
    };

    const fontePeculioInvalida = [];
    const res = gerarGxtSelecaoLivre(['JAN2026'], fontePeculioInvalida, mockSS);

    assert.ok(res._diagnostico);
    assert.strictEqual(res._diagnostico.peculioValido, false);
    assert.strictEqual(res._diagnostico.peculioErro, 'PECULIO_ABA_NAO_LOCALIZADA');
    assert.strictEqual(folhaLimpa, false);
  });

  // 11. Diagnóstico Claro quando Túneis Armados Possuem Pendências (TASK-M06.3-05G)
  test('gerarGxtSelecaoLivre: informa estatísticas de fatos e pendências sem sobrescrever a aba existente', () => {
    let folhaLimpa = false;
    const dummyLogSheet = { clear: () => {}, getRange: () => ({ setValues: () => {} }) };
    const mockSheetJan = [
      {
        data: '15/01/2026',
        mike: '26E100',
        boe: 'BOE123',
        armas: 1,
        policiais: [
          { matricula: '999999-9', nome: 'POLICIAL SEM N', grad: 'SD', pelotao: '1º PEL', armas: 1 }
        ]
      }
    ];

    const mockSS = {
      getSheetByName: (n) => (n === '[LOG] Gxt' ? dummyLogSheet : (n === 'JAN2026' ? mockSheetJan : { clear: () => { folhaLimpa = true; } })),
      insertSheet: (n) => (n === '[LOG] Gxt' ? dummyLogSheet : { clear: () => { folhaLimpa = true; } })
    };

    const res = gerarGxtSelecaoLivre(['JAN2026'], mockPeculioOficial, mockSS);
    assert.ok(res._diagnostico);
    assert.strictEqual(res._diagnostico.totalFatosLidos, 1);
    assert.strictEqual(res._diagnostico.totalTuneisArmados, 1);
    assert.strictEqual(res._diagnostico.totalTuneisProcessados, 0);
    assert.strictEqual(res._diagnostico.totalTuneisPendentes, 1);
    assert.strictEqual(folhaLimpa, false);
  });

  // 12. Proibição Estrita de Fallback para a Planilha Ativa (TASK-M06.3-05G)
  test('CompiladorGxt.compilar: NUNCA usa a própria planilha de ocorrências como fallback para o Pecúlio', () => {
    const mockSheetEfetivo = [
      ['N', 'MATRÍCULA', 'NOME'],
      [1, '123456-7', 'SD TESTE FALLBACK']
    ];
    const mockSS = {
      getSheetByName: (n) => (n === 'EFETIVO' ? mockSheetEfetivo : null)
    };

    const res = CompiladorGxt.compilar(mockSS, ['JAN2026'], null);
    assert.strictEqual(res._diagnostico.peculioValido, false);
    assert.strictEqual(res._diagnostico.peculioErro, 'PECULIO_ACESSO_NEGADO');
  });

  // 13. Rejeição Estrita de Alias Genérico "Pontuação" para Pecúlio (TASK-M06.3-05G)
  test('LeitorAntiguidadePeculio: NUNCA aceita uma aba chamada "PONTUAÇÃO" ou "PONTUACAO" como Pecúlio', () => {
    const mockSheetPontuacao = {
      getName: () => 'PONTUAÇÃO',
      getRange: () => ({
        getValues: () => [
          ['N', 'MATRÍCULA', 'NOME'],
          [1, '123456-7', 'SD PIP TESTE']
        ]
      })
    };
    const mockSS = {
      getSheetByName: (n) => (n === 'PONTUAÇÃO' ? mockSheetPontuacao : null),
      getSheets: () => [mockSheetPontuacao]
    };

    const LeitorMod = require('../Leitura/LeitorAntiguidadePeculio');
    const res = LeitorMod.lerMapaAntiguidade(mockSS);
    assert.strictEqual(res.erro, 'PECULIO_ABA_NAO_LOCALIZADA');
    assert.strictEqual(Object.keys(res.mapa).length, 0);
  });

  // 14. Preservação Fiel de Aba Existente em Caso de Falha (TASK-M06.3-05D)
  test('gerarGxtSelecaoLivre: preserva integralmente os dados de uma aba de relatório existente em falha de fonte', () => {
    let dadosPreservados = 'DADOS_ANTIGOS_INTACTOS';
    let foiApagado = false;
    const dummyLogSheet = { clear: () => {}, getRange: () => ({ setValues: () => {} }) };

    const mockSheetSaida = {
      getName: () => 'GXT_ACUMULADO_JAN2026_JAN2026',
      clear: () => { foiApagado = true; },
      getRange: () => ({ getValues: () => [[dadosPreservados]] })
    };

    const mockSS = {
      getSheetByName: (n) => (n === '[LOG] Gxt' ? dummyLogSheet : (n === 'GXT_ACUMULADO_JAN2026_JAN2026' ? mockSheetSaida : null))
    };

    gerarGxtSelecaoLivre(['JAN2026'], null, mockSS);
    assert.strictEqual(foiApagado, false);
    assert.strictEqual(dadosPreservados, 'DADOS_ANTIGOS_INTACTOS');
  });

  // 15. Preservação da Exceção de Acesso ao Pecúlio no Diagnóstico (TASK-M06.3-05G.1)
  test('CompiladorGxt.compilar: captura exceção do SpreadsheetApp.openById e repassa peculioDetalhe no diagnóstico', () => {
    const prevSpreadsheetApp = global.SpreadsheetApp;
    global.SpreadsheetApp = {
      openById: () => { throw new Error('Exception: Access denied to spreadsheet 1PJnA8d9sf5CNj0'); }
    };

    const prevConfig = global.CONFIG_SYNTHEON;
    global.CONFIG_SYNTHEON = {
      obterIdPeculio: () => '1PJnA8d9sf5CNj0'
    };

    try {
      const res = CompiladorGxt.compilar({}, ['JAN2026'], null);
      assert.ok(res._diagnostico);
      assert.strictEqual(res._diagnostico.peculioValido, false);
      assert.strictEqual(res._diagnostico.peculioErro, 'PECULIO_ACESSO_NEGADO');
      assert.ok(res._diagnostico.peculioDetalhe.includes('Access denied'));
    } finally {
      global.SpreadsheetApp = prevSpreadsheetApp;
      global.CONFIG_SYNTHEON = prevConfig;
    }
  });

  // 16. Teste de Renderização do Caso Duplo (Arma de Fogo + Artesanal no mesmo túnel) (TASK-M06.3-05I.2)
  test('RendererGxt: renderiza "1 + ARTESANAL" no detalhe do túnel duplo e soma apenas 1 na contagem do card do resumo', () => {
    const dadosCompiladosDuplo = {
      JUN2026: {
        registros: [
          { numSeq: 1, matricula: '108394-5', grad: '3º SGT', nome: 'IRAN SILVA', qtdArmas: 1, armasFogo: 1, armasArtesanais: 1, totalFatosFisicos: 2, designacao: '1º PEL GTAR' }
        ],
        resumo: { '1º PEL GTAR': 1, '2º PEL GTAR': 0, '1º PEL': 0, '2º PEL': 0, '3º PEL': 0, 'TOTAL': 1 }
      }
    };

    let matrizDados = null;
    const mockSheetTarget = {
      getName: () => 'GXT_2T_2026',
      clear: () => {},
      _definirDadosMatriz: (m) => { matrizDados = m; }
    };

    const mockSS = {
      getSheetByName: () => mockSheetTarget,
      insertSheet: () => mockSheetTarget
    };

    RendererGxt.renderizar(mockSS, dadosCompiladosDuplo, 'GXT_2T_2026');

    assert.ok(matrizDados);
    // Linha de registro (linha 3, idx 2, coluna D/idx 3) deve conter '1 + ARTESANAL'
    assert.strictEqual(matrizDados.valores[2][3], '1 + ARTESANAL');
    // Linha de resumo do 1º PEL GTAR (linha 6, idx 5, coluna D/idx 3) deve somar Apenas 1 (armas de fogo numéricas)
    assert.strictEqual(matrizDados.valores[5][3], 1);
  });

  // 17. Pipeline Integrado com Cabeçalhos Reais e Adaptador2026 (TASK-M06.3-05I.2R)
  test('Pipeline Integrado com Cabeçalhos Reais (Adaptador2026 -> Compilador -> Política -> Renderer): desduplica QDT ARMAS, trata artesanal e preserva resumos numéricos', () => {
    const rawHeaders = ['DATA', 'HORA', 'MIKE', 'BOE', 'ARMA', 'TIPO', 'MODELO', 'QDT ARMAS', 'MATRÍCULA', 'POLICIAL', 'GRAD', 'PELOTÃO'];

    // Mês 1: 4 policiais da mesma equipe no mesmo túnel com QDT ARMAS = 1 e apenas ARMA = 1 na linha 1
    const rawJan = [
      rawHeaders,
      ['15/01/2026', '10:00', '26E100', 'BOE1', 1, 'PISTOLA', 'TAURUS', 1, '108394-5', 'IRAN SILVA', '3º SGT', '1º PEL GTAR'],
      ['15/01/2026', '10:00', '26E100', 'BOE1', 0, '', '', 1, '102950-9', 'SAULO ALVES', '2º SGT', '2º PEL GTAR'],
      ['15/01/2026', '10:00', '26E100', 'BOE1', 0, '', '', 1, '113920-7', 'MARCONI LIMA', '3º SGT', '1º PEL'],
      ['15/01/2026', '10:00', '26E100', 'BOE1', 0, '', '', 1, '118108-4', 'CB TORRES', 'CB', '2º PEL']
    ];

    // Mês 2: 1 arma artesanal pura
    const rawFev = [
      rawHeaders,
      ['10/02/2026', '14:00', '26E200', 'BOE2', 0, 'ARTESANAL', 'GARRUCHA', 1, '108394-5', 'IRAN SILVA', '3º SGT', '1º PEL GTAR']
    ];

    // Mês 3: Túnel duplo (1 arma de fogo + 1 arma artesanal no mesmo túnel)
    const rawMar = [
      rawHeaders,
      ['15/03/2026', '18:00', '26E300', 'BOE3', 1, 'PISTOLA', 'TAURUS', 1, '108394-5', 'IRAN SILVA', '3º SGT', '1º PEL GTAR'],
      ['15/03/2026', '18:00', '26E300', 'BOE3', 0, 'ARTESANAL', 'ESCOPETA', 1, '108394-5', 'IRAN SILVA', '3º SGT', '1º PEL GTAR']
    ];

    const mockSheetJan = { getName: () => 'JAN2026', getLastRow: () => 5, getLastColumn: () => 12, getRange: () => ({ getValues: () => rawJan }) };
    const mockSheetFev = { getName: () => 'FEV2026', getLastRow: () => 2, getLastColumn: () => 12, getRange: () => ({ getValues: () => rawFev }) };
    const mockSheetMar = { getName: () => 'MAR2026', getLastRow: () => 3, getLastColumn: () => 12, getRange: () => ({ getValues: () => rawMar }) };

    const mockSS = {
      getSheetByName: (n) => {
        if (n === 'JAN2026') return mockSheetJan;
        if (n === 'FEV2026') return mockSheetFev;
        if (n === 'MAR2026') return mockSheetMar;
        return null;
      }
    };

    const resultado = CompiladorGxt.compilar(mockSS, ['JAN2026', 'FEV2026', 'MAR2026'], mockPeculioOficial);

    // Assertiva 1: Mês 1 - 4 policiais com QDT ARMAS = 1 geram exatamente 1 arma de fogo (não 4!)
    assert.strictEqual(resultado['JAN2026'].registros.length, 1);
    assert.strictEqual(resultado['JAN2026'].registros[0].qtdArmas, 1, 'Quatro policiais com QDT ARMAS=1 e ARMA=1 devem gerar 1');
    assert.strictEqual(resultado['JAN2026'].resumo['1º PEL GTAR'], 1, 'Resumo do 1º PEL GTAR deve ser 1 em JAN2026');

    // Assertiva 2: Mês 2 - Artesanal pura vira 0 nas armas de fogo numéricas para cards
    assert.strictEqual(resultado['FEV2026'].registros.length, 1);
    assert.strictEqual(resultado['FEV2026'].registros[0].armasFogo, 0);
    assert.strictEqual(resultado['FEV2026'].registros[0].armasArtesanais, 1);
    assert.strictEqual(resultado['FEV2026'].resumo['TOTAL'], 0, 'Resumo numérico não deve somar texto artesanal');

    // Assertiva 3: Mês 3 - Caso misto preserva fogo (1) e artesanal (1)
    assert.strictEqual(resultado['MAR2026'].registros.length, 1);
    assert.strictEqual(resultado['MAR2026'].registros[0].armasFogo, 1);
    assert.strictEqual(resultado['MAR2026'].registros[0].armasArtesanais, 1);
    assert.strictEqual(resultado['MAR2026'].resumo['TOTAL'], 1, 'Resumo numérico soma apenas a arma de fogo do caso misto');

    // Renderização final
    let matrizDados = null;
    const mockSheetTarget = {
      getName: () => 'GXT_1T_2026',
      clear: () => {},
      _definirDadosMatriz: (m) => { matrizDados = m; }
    };
    const mockSSOutput = { getSheetByName: () => mockSheetTarget, insertSheet: () => mockSheetTarget };

    RendererGxt.renderizar(mockSSOutput, resultado, 'GXT_1T_2026');

    assert.ok(matrizDados);
    // Linha do detalhe do mês 2 (FEV2026) exibe 'ARTESANAL'
    assert.strictEqual(matrizDados.valores[2][9], 'ARTESANAL'); // Coluna D do bloco FEV2026 (col 6 + 3 = 9)
    // Linha do detalhe do mês 3 (MAR2026) exibe '1 + ARTESANAL'
    assert.strictEqual(matrizDados.valores[2][15], '1 + ARTESANAL'); // Coluna D do bloco MAR2026 (col 12 + 3 = 15)
  });

  // 18. Log Operacional Gxt: Criação e preenchimento por mês e total
  test('Log Operacional Gxt: cria e preenche a aba [LOG] Gxt com resumo superior, linhas mensais e soma no TOTAL', () => {
    let valoresLog = null;
    let foiLimpado = false;

    const mockSheetLog = {
      getName: () => '[LOG] Gxt',
      clear: () => { foiLimpado = true; },
      getRange: () => ({
        setValues: (matriz) => { valoresLog = matriz; }
      })
    };

    const sheetsMap = {
      'ABR2026': { getName: () => 'ABR2026', getLastRow: () => 2, getLastColumn: () => 12, getRange: () => ({ getValues: () => [
        ['DATA', 'HORA', 'MIKE', 'BOE', 'ARMA', 'TIPO', 'MODELO', 'QDT ARMAS', 'MATRÍCULA', 'POLICIAL', 'GRAD', 'PELOTÃO'],
        ['15/04/2026', '10:00', '26E400', 'BOE4', 1, 'PISTOLA', 'TAURUS', 1, '108394-5', 'IRAN SILVA', '3º SGT', '1º PEL GTAR']
      ] }) },
      'MAI2026': { getName: () => 'MAI2026', getLastRow: () => 2, getLastColumn: () => 12, getRange: () => ({ getValues: () => [
        ['DATA', 'HORA', 'MIKE', 'BOE', 'ARMA', 'TIPO', 'MODELO', 'QDT ARMAS', 'MATRÍCULA', 'POLICIAL', 'GRAD', 'PELOTÃO'],
        ['10/05/2026', '11:00', '26E500', 'BOE5', 1, 'PISTOLA', 'TAURUS', 1, '102950-9', 'SAULO ALVES', '2º SGT', '2º PEL GTAR']
      ] }) },
      'JUN2026': { getName: () => 'JUN2026', getLastRow: () => 2, getLastColumn: () => 12, getRange: () => ({ getValues: () => [
        ['DATA', 'HORA', 'MIKE', 'BOE', 'ARMA', 'TIPO', 'MODELO', 'QDT ARMAS', 'MATRÍCULA', 'POLICIAL', 'GRAD', 'PELOTÃO'],
        ['05/06/2026', '12:00', '26E600', 'BOE6', 0, 'ARTESANAL', 'ESCOPETA', 1, '113920-7', 'MARCONI LIMA', '3º SGT', '1º PEL']
      ] }) }
    };

    const mockSS = {
      getSheetByName: (n) => n === '[LOG] Gxt' ? mockSheetLog : sheetsMap[n],
      insertSheet: (n) => n === '[LOG] Gxt' ? mockSheetLog : null
    };

    gerarGxtSelecaoLivre(['ABR2026', 'MAI2026', 'JUN2026'], mockPeculioOficial, mockSS);

    assert.ok(foiLimpado, 'A aba [LOG] Gxt deve ser limpada a cada execução');
    assert.ok(valoresLog, 'Matriz de log deve ser escrita');

    // Valida o Resumo Superior
    assert.strictEqual(valoresLog[0][0], 'PAINEL DE CONTROLE OPERACIONAL — GXT');
    assert.strictEqual(valoresLog[2][1], 'CONCLUÍDO');
    assert.strictEqual(valoresLog[3][1], 'SELEÇÃO LIVRE');

    // Valida as 3 linhas mensais distintas (Abril, Maio, Junho)
    const idxInicioTabela = 10;
    const headerTabela = valoresLog[9];
    assert.strictEqual(headerTabela[0], 'Mês');
    assert.strictEqual(headerTabela[8], 'Diagnóstico & Ação');

    const linAbr = valoresLog[idxInicioTabela];
    assert.strictEqual(linAbr[0], 'ABR2026');
    assert.strictEqual(linAbr[6], 1); // Armas Fogo
    assert.ok(linAbr[8].includes('APROVADO'));

    const linMai = valoresLog[idxInicioTabela + 1];
    assert.strictEqual(linMai[0], 'MAI2026');
    assert.strictEqual(linMai[6], 1);
    assert.ok(linMai[8].includes('APROVADO'));

    const linJun = valoresLog[idxInicioTabela + 2];
    assert.strictEqual(linJun[0], 'JUN2026');
    assert.strictEqual(linJun[6], 0); // Fogo
    assert.strictEqual(linJun[7], 1); // Artesanal
    assert.ok(linJun[8].includes('APROVADO'));

    // Valida a linha TOTAL
    const linTotal = valoresLog[idxInicioTabela + 3];
    assert.strictEqual(linTotal[0], 'TOTAL');
    assert.strictEqual(linTotal[2], linAbr[2] + linMai[2] + linJun[2]); // Fatos
    assert.strictEqual(linTotal[3], linAbr[3] + linMai[3] + linJun[3]); // Túneis
    assert.strictEqual(linTotal[6], linAbr[6] + linMai[6] + linJun[6]); // Fogo = 2
    assert.strictEqual(linTotal[7], linAbr[7] + linMai[7] + linJun[7]); // Artesanal = 1
  });

  // 19. Log Operacional Gxt: Reutilização e sobrescrita
  test('Log Operacional Gxt: reutiliza e sobrescreve a aba [LOG] Gxt sem acumulo historico', () => {
    let vezesLimpado = 0;
    let execucoesLog = 0;

    const mockSheetLog = {
      getName: () => '[LOG] Gxt',
      clear: () => { vezesLimpado++; },
      getRange: () => ({
        setValues: () => { execucoesLog++; }
      })
    };

    const dummyOutputSheet = { clear: () => {}, _definirDadosMatriz: () => {} };

    const mockSS = {
      getSheetByName: (n) => n === '[LOG] Gxt' ? mockSheetLog : null,
      insertSheet: (n) => dummyOutputSheet
    };

    gerarGxtSelecaoLivre(['ABR2026'], mockPeculioOficial, mockSS);
    gerarGxtSelecaoLivre(['MAI2026'], mockPeculioOficial, mockSS);

    assert.strictEqual(vezesLimpado, 2, 'Devia ter limpado 2 vezes');
    assert.strictEqual(execucoesLog, 2, 'Devia ter escrito 2 vezes');
  });

  // 20. Log Operacional Gxt: Diagnóstico de falha
  test('Log Operacional Gxt: registra falha do Pecúlio e mantem abas GXT existentes intactas', () => {
    let valoresLog = null;
    let abasAlteradas = [];

    const mockSheetLog = {
      getName: () => '[LOG] Gxt',
      clear: () => {},
      getRange: () => ({ setValues: (m) => { valoresLog = m; } })
    };

    const mockSheetAnterior = {
      getName: () => 'GXT_ACUMULADO_ABR2026_JUN2026',
      clear: () => { abasAlteradas.push('GXT_ACUMULADO_ABR2026_JUN2026'); }
    };

    const mockSS = {
      getSheetByName: (n) => {
        if (n === '[LOG] Gxt') return mockSheetLog;
        if (n === 'GXT_ACUMULADO_ABR2026_JUN2026') return mockSheetAnterior;
        return null;
      },
      insertSheet: () => mockSheetLog
    };

    const mePeculioInvalido = { getSheetByName: () => null };

    gerarGxtSelecaoLivre(['ABR2026'], mePeculioInvalido, mockSS);

    assert.strictEqual(abasAlteradas.length, 0, 'Nenhuma aba de relatório anterior pode ser alterada');
    assert.ok(valoresLog, 'Log deve ter sido gravado com a falha');
    assert.strictEqual(valoresLog[2][1], 'FALHA');
    assert.strictEqual(valoresLog[3][1], 'SELEÇÃO LIVRE');
    assert.strictEqual(valoresLog[5][1], 'PECULIO_ABA_NAO_LOCALIZADA');
  });

  // 21. Log Operacional Gxt: Modo Anual com 12 linhas mensais
  test('Log Operacional Gxt: modo Anual registra as 12 linhas mensais no mesmo log', () => {
    let valoresLog = null;
    let abasRenderizadas = [];

    const mockSheetLog = {
      getName: () => '[LOG] Gxt',
      clear: () => {},
      getRange: () => ({ setValues: (m) => { valoresLog = m; } })
    };

    const mockSS = {
      getSheetByName: (n) => {
        if (n === '[LOG] Gxt') return mockSheetLog;
        return {
          getName: () => n,
          getLastRow: () => 2,
          getLastColumn: () => 12,
          getRange: () => ({
            getValues: () => [
              ['DATA', 'HORA', 'MIKE', 'BOE', 'ARMA', 'TIPO', 'MODELO', 'QDT ARMAS', 'MATRÍCULA', 'POLICIAL', 'GRAD', 'PELOTÃO'],
              ['01/01/2026', '10:00', '26E100', 'BOE1', 1, 'PISTOLA', 'TAURUS', 1, '108394-5', 'IRAN SILVA', '3º SGT', '1º PEL GTAR']
            ]
          }),
          clear: () => {},
          _definirDadosMatriz: () => { abasRenderizadas.push(n); }
        };
      },
      insertSheet: (n) => ({
        getName: () => n,
        clear: () => {},
        _definirDadosMatriz: () => { abasRenderizadas.push(n); }
      })
    };

    gerarGxtAnual(mockSS, mockPeculioOficial);

    assert.ok(valoresLog, 'Log anual deve ter sido escrito');
    assert.strictEqual(valoresLog[2][1], 'CONCLUÍDO');
    assert.strictEqual(valoresLog[3][1], 'ANUAL');

    // 10 linhas de cabeçalho + 12 linhas mensais + 1 linha TOTAL = 23 linhas na matriz
    assert.strictEqual(valoresLog.length, 23);
    assert.strictEqual(valoresLog[10][0], 'JAN2026');
    assert.strictEqual(valoresLog[21][0], 'DEZ2026');
    assert.strictEqual(valoresLog[22][0], 'TOTAL');
  });

  // 22. Log Operacional Gxt: Registra FALHA em caso de exceção na renderização
  test('Log Operacional Gxt: grava FALHA se a renderização lançar exceção', () => {
    let valoresLog = null;

    const mockSheetLog = {
      getName: () => '[LOG] Gxt',
      clear: () => {},
      getRange: () => ({ setValues: (m) => { valoresLog = m; } })
    };

    const mockSheetJan = [
      {
        data: '15/01/2026',
        mike: '26E100',
        boe: 'BOE123',
        armas: 1,
        policiais: [
          { matricula: '108394-5', nome: 'IRAN SILVA', grad: '3º SGT', pelotao: '1º PEL GTAR', armas: 1 }
        ]
      }
    ];

    const mockSS = {
      getSheetByName: (n) => (n === '[LOG] Gxt' ? mockSheetLog : (n === 'JAN2026' ? mockSheetJan : null)),
      insertSheet: (n) => {
        if (n === '[LOG] Gxt') return mockSheetLog;
        throw new Error('Falha simulada na gravação de planilha de saída');
      }
    };

    gerarGxtSelecaoLivre(['JAN2026'], mockPeculioOficial, mockSS);

    assert.ok(valoresLog, 'Log deve ter sido gravado após a falha de renderização');
    assert.strictEqual(valoresLog[2][1], 'FALHA');
    assert.ok(valoresLog[7][1].includes('FALHA NA RENDERIZAÇÃO'), 'Detalhe deve indicar a falha de renderização');
  });

  // 23. Log Operacional Gxt: Registra CONCLUÍDO COM PENDÊNCIAS quando todos os túneis tiverem pendência
  test('Log Operacional Gxt: grava CONCLUÍDO COM PENDÊNCIAS quando túneis armados possuem pendências', () => {
    let valoresLog = null;

    const mockSheetJan = [
      {
        data: '15/01/2026',
        mike: '26E100',
        boe: 'BOE123',
        armas: 1,
        policiais: [
          { matricula: '999999-9', nome: 'POLICIAL SEM N', grad: 'SD', pelotao: '1º PEL', armas: 1 }
        ]
      }
    ];

    const mockSheetLog = {
      getName: () => '[LOG] Gxt',
      clear: () => {},
      getRange: () => ({ setValues: (m) => { valoresLog = m; } })
    };

    const mockSS = {
      getSheetByName: (n) => (n === '[LOG] Gxt' ? mockSheetLog : (n === 'JAN2026' ? mockSheetJan : null)),
      insertSheet: () => mockSheetLog
    };

    gerarGxtSelecaoLivre(['JAN2026'], mockPeculioOficial, mockSS);

    assert.ok(valoresLog, 'Log deve ter sido gravado');
    assert.strictEqual(valoresLog[2][1], 'CONCLUÍDO COM PENDÊNCIAS');
    assert.ok(valoresLog[7][1].includes('ATENÇÃO'), 'Detalhe final deve alertar para as pendências');
  });

  console.log(`\n🎉 Testes do Relatório Trimestral Gxt concluídos: ${sucessos} testes passaram!`);
}

executarTestesGxt();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { executarTestesGxt };
}
