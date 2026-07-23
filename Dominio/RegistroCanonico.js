/**
 * ARQUIVO: Dominio/RegistroCanonico.js
 * PILAR 2: Registro Canônico (A Linguagem Oficial do SYNTHÉON)
 * DESCRIÇÃO: Objeto imutável contendo os "Fatos". Transforma os dados lidos
 * de qualquer fonte (OPP2024, OPP2026, Firebase) para a estrutura única consumida 
 * pelo Motor Analítico. Nunca possui cálculos ou indicadores (como médias ou percentuais).
 */
class RegistroCanonico {
  constructor(dados) {
    // 1. Rastreabilidade Plena (De onde veio o dado?)
    this.origem = {
      ano: dados.origem?.ano || null,
      mes: dados.origem?.mes || null,
      aba: dados.origem?.aba || '',
      linha: dados.origem?.linha || 0,
      versaoEstrutura: dados.origem?.versaoEstrutura || 'DESCONHECIDA'
    };

    // 2. Cobertura Histórica (Informa ao motor o que é N/D e o que é zero)
    this.coberturaHistorica = dados.coberturaHistorica || {};

    // 3. Fatos: Ocorrência Global (Evento indivisível)
    this.ocorrencia = {
      chave: dados.ocorrencia?.chave || '',
      data: dados.ocorrencia?.data || null,
      mike: dados.ocorrencia?.mike || '',
      boe: dados.ocorrencia?.boe || '',
      natureza: dados.ocorrencia?.natureza || '',
      cidade: dados.ocorrencia?.cidade || '',
      bairro: dados.ocorrencia?.bairro || '',
      ais: dados.ocorrencia?.ais || 0
    };

    // 4. Fatos: Métricas da Ocorrência (Valores que pertencem ao evento, não ao policial isolado)
    this.metricasPrimarias = {
      pontosTotais: dados.metricasPrimarias?.pontosTotais || 0,
      detidos: dados.metricasPrimarias?.detidos || 0,
      apfd: dados.metricasPrimarias?.apfd || 0,
      tco: dados.metricasPrimarias?.tco || 0,
      boc: dados.metricasPrimarias?.boc || 0
    };

    // 5. Evento pontuavel declarado pelo operador na linha fisica (AG/AH).
    this.eventoPontuavel = {
      indicador: dados.eventoPontuavel?.indicador || '',
      imputado: dados.eventoPontuavel?.imputado || ''
    };

    // 6. Fatos: Relacionamento de Equipe
    this.equipe = dados.equipe || ''; // Nome ou sigla da guarnição, se houver
    
    // 7. Fatos: Policiais Envolvidos e sua cota de participação física
    this.policiais = dados.policiais || [];

    // Congela a instância e sub-estruturas para imutabilidade total no pipeline V2
    Object.freeze(this.origem);
    Object.freeze(this.coberturaHistorica);
    Object.freeze(this.ocorrencia);
    Object.freeze(this.metricasPrimarias);
    Object.freeze(this.eventoPontuavel);
    Object.freeze(this.policiais);
    Object.freeze(this);
  }
}

