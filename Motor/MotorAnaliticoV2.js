/**
 * ARQUIVO: Motor/MotorAnaliticoV2.js
 * PILAR 3: Motor Analítico (O Cérebro)
 * DESCRIÇÃO: Responsável por receber o array de Registros Canônicos (Fatos) 
 * e aplicar as regras de negócio de consolidação e cálculo de indicadores.
 * Respeita a regra de Coexistência (V2).
 */

class MotorAnaliticoV2 {
  /**
   * Consolida os fatos puros de policiais extraídos pelo Adaptador 
   * e converte em Registros Analíticos agregados.
   * @param {Array<RegistroCanonico>} fatosCanonicos 
   * @returns {Array<RegistroAnalitico>}
   */
  static processarProdutividadePolicial(fatosCanonicos) {
    const mapaPoliciais = {};
    const ocorrenciasProcessadas = new Set(); // Controle para não duplicar métricas da mesma ocorrência se o PM aparecer nela 2 vezes

    fatosCanonicos.forEach(fato => {
      const pmFato = fato.policiais[0]; // Como o adaptador gera 1 PM por fato nesta versão
      const matricula = pmFato.matricula;
      const chaveOcorrencia = fato.ocorrencia.chave;
      
      // Identificador único da atuação do PM nesta ocorrência
      const chaveAtuacao = `${matricula}_${chaveOcorrencia}`;

      if (!mapaPoliciais[matricula]) {
        mapaPoliciais[matricula] = {
          matricula: matricula,
          nome: pmFato.nome,
          grad: pmFato.graduacao,
          pelotao: pmFato.pelotao,
          historicoEscalas: [],
          fatos: {
            ocorrencias: 0,
            armas: 0, maconha: 0, cocaina: 0, crack: 0, drogasTotal: 0,
            detidos: 0, apfd: 0, tco: 0, boc: 0, qtdBoe: 0,
            ocorrenciasComArma: 0, ocorrenciasComDroga: 0
          },
          indicadores: {
            pontosPIP: 0, pontosCPM: 0, pontosTotais: 0
          }
        };
      }

      const consolidado = mapaPoliciais[matricula];

      // Rastreabilidade de Lotação
      if (pmFato.pelotao && pmFato.pelotao !== 'N/I') {
        consolidado.pelotao = pmFato.pelotao;
        if (!consolidado.historicoEscalas.includes(pmFato.pelotao)) {
          consolidado.historicoEscalas.push(pmFato.pelotao);
        }
      }

      // Se o policial ainda não tinha sido processado NESTA ocorrência, contamos a ocorrência
      if (!ocorrenciasProcessadas.has(chaveAtuacao)) {
        ocorrenciasProcessadas.add(chaveAtuacao);
        consolidado.fatos.ocorrencias++;
        if (fato.ocorrencia.boe) consolidado.fatos.qtdBoe++;

        // Regra de Contagem: Se ELE pegou arma ou droga neste evento
        if (pmFato.armas > 0) consolidado.fatos.ocorrenciasComArma++;
        if (pmFato.maconha > 0 || pmFato.cocaina > 0 || pmFato.crack > 0) consolidado.fatos.ocorrenciasComDroga++;
      }

      // Agregação de Fatos Físicos
      consolidado.fatos.armas += pmFato.armas;
      consolidado.fatos.maconha += pmFato.maconha;
      consolidado.fatos.cocaina += pmFato.cocaina;
      consolidado.fatos.crack += pmFato.crack;
      consolidado.fatos.detidos += pmFato.detidos; // O Adaptador atualiza `detidos` mas no Canônico a ocorrência detinha a métrica total. Como o legado amarrava ao PM na mesma linha, mantemos a leitura física da linha.
      consolidado.fatos.apfd += pmFato.apfd;
      consolidado.fatos.tco += pmFato.tco;
      consolidado.fatos.boc += pmFato.boc;
      consolidado.fatos.drogasTotal += (pmFato.maconha + pmFato.cocaina + pmFato.crack);

      // Agregação de Indicadores
      // Em caso de múltiplas linhas na mesma ocorrência para o mesmo PM, o legado pegava o Math.max.
      // Como estamos consolidando as linhas, precisamos garantir que a pontuação não multiplique.
      // Mas para manter coesão e simplificar a V2 sem quebrar, somamos a participação lida da linha.
      // Ajuste: Apenas o maior valor do Rateio para o PM naquela ocorrência deve valer,
      // mas como já filtramos o fato, podemos manter a soma de atuações distintas ou garantir max:
      // O correto no legado era Math.max no Leitor. Aqui faremos de forma mais limpa:
      
      // Cria uma propriedade temporária para armazenar a pontuação máxima detectada naquela atuação
      const chavePonto = `pts_${chaveAtuacao}`;
      if (!consolidado._pts) consolidado._pts = {};
      
      if (!consolidado._pts[chavePonto]) {
        consolidado._pts[chavePonto] = pmFato.pontosRateados;
      } else {
        consolidado._pts[chavePonto] = Math.max(consolidado._pts[chavePonto], pmFato.pontosRateados);
      }
    });

    // Finaliza cálculo de Indicadores
    const resultadoAnalitico = [];
    Object.values(mapaPoliciais).forEach(consolidado => {
      // Soma a pontuação máxima obtida por ocorrência (replicando o Math.max do legado)
      let pontos = 0;
      if (consolidado._pts) {
        Object.values(consolidado._pts).forEach(p => pontos += p);
        delete consolidado._pts;
      }
      
      consolidado.indicadores.pontosCPM = pontos;
      consolidado.indicadores.pontosPIP = pontos;
      consolidado.indicadores.pontosTotais = pontos;
      
      resultadoAnalitico.push(new RegistroAnalitico(consolidado));
    });

    return resultadoAnalitico;
  }
}
