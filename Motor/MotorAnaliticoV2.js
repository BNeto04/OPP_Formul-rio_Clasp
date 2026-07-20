/**
 * ARQUIVO: Motor/MotorAnaliticoV2.js
 * PILAR 3: Motor Analítico (O Cérebro)
 * DESCRIÇÃO: O Motor deixou de ser um gigante de regras matemáticas e passou 
 * a ser um **Orquestrador de Plugins**. Ele recebe os fatos canônicos, 
 * dispara o ciclo de vida dos plugins (inicializar -> processar -> finalizar) 
 * e consolida o Registro Analítico.
 */
class MotorAnaliticoV2 {
  constructor() {
    this.plugins = [];
  }

  /**
   * Adiciona um plugin de métrica ao pipeline de processamento.
   * @param {IPluginMetrica} plugin 
   */
  registrarPlugin(plugin) {
    this.plugins.push(plugin);
  }

  /**
   * Executa a orquestração dos fatos sobre os plugins registrados.
   * @param {Array<RegistroCanonico>} fatosCanonicos 
   * @returns {Array<RegistroAnalitico>}
   */
  executar(fatosCanonicos) {
    const mapaPoliciais = {};
    const ocorrenciasProcessadas = new Set(); 

    fatosCanonicos.forEach(fato => {
      // Como o adaptador atualiza 1 PM por fato nesta versão
      const pmFato = fato.policiais[0]; 
      if (!pmFato || !pmFato.matricula) return;

      const matricula = pmFato.matricula;
      const chaveOcorrencia = fato.ocorrencia.chave;
      const chaveAtuacao = `${matricula}_${chaveOcorrencia}`;

      // Determina se é a primeira vez lendo este PM nesta ocorrência
      const primeiraVezNaOcorrencia = !ocorrenciasProcessadas.has(chaveAtuacao);
      if (primeiraVezNaOcorrencia) {
        ocorrenciasProcessadas.add(chaveAtuacao);
      }

      // Inicialização do PM no mapa
      if (!mapaPoliciais[matricula]) {
        mapaPoliciais[matricula] = {
          matricula: matricula,
          nome: pmFato.nome,
          grad: pmFato.graduacao,
          pelotao: pmFato.pelotao,
          historicoEscalas: [],
          fatos: {},
          indicadores: {}
        };
        // Notifica plugins para prepararem as chaves
        this.plugins.forEach(p => p.inicializar(mapaPoliciais[matricula]));
      }

      const consolidado = mapaPoliciais[matricula];

      // Rastreabilidade de Lotação (Regra core da plataforma, independe de métrica)
      if (pmFato.pelotao && pmFato.pelotao !== 'N/I') {
        consolidado.pelotao = pmFato.pelotao;
        if (!consolidado.historicoEscalas.includes(pmFato.pelotao)) {
          consolidado.historicoEscalas.push(pmFato.pelotao);
        }
      }

      // Processamento Delegado
      this.plugins.forEach(p => p.processar(fato, pmFato, consolidado, chaveAtuacao, primeiraVezNaOcorrencia));
    });

    // Finalização Delegada
    const resultadoAnalitico = [];
    Object.values(mapaPoliciais).forEach(consolidado => {
      this.plugins.forEach(p => p.finalizar(consolidado));
      resultadoAnalitico.push(new RegistroAnalitico(consolidado));
    });

    return resultadoAnalitico;
  }

  /**
   * Mantém a compatibilidade exata com a API estática usada na V1/V2 original.
   * Cria uma instância efêmera do Motor com os plugins institucionais padrão.
   */
  static processarProdutividadePolicial(fatosCanonicos) {
    const motor = new MotorAnaliticoV2();
    // Injeção de Dependências (Plugins)
    motor.registrarPlugin(new PluginOcorrencias());
    motor.registrarPlugin(new PluginArmas());
    motor.registrarPlugin(new PluginEntorpecentes());
    motor.registrarPlugin(new PluginPrisoes());
    motor.registrarPlugin(new PluginPontuacao());
    
    return motor.executar(fatosCanonicos);
  }
}
