/**
 * ARQUIVO: Dominio/Ocorrencia.js
 * RESPONSABILIDADE: Agregar e manter a consistência do Aggregate Root Ocorrência
 */

class Ocorrencia {
  constructor(chave, data, cidade, bairro) {
    if (!chave) {
      throw new ErroValidacaoDominio('Ocorrencia', 'chave', 'Chave da ocorrência é obrigatória');
    }
    if (!data || !(data instanceof Date) || isNaN(data.getTime())) {
      throw new ErroValidacaoDominio('Ocorrencia', 'data', 'Data da ocorrência deve ser uma instância válida de Date');
    }

    this.chave = chave; // Identidade única (imutável)
    Object.freeze(this.chave);

    this.data = data;
    this.cidade = cidade ? String(cidade).trim().toUpperCase() : 'N/I';
    this.bairro = bairro ? String(bairro).trim().toUpperCase() : 'N/I';

    this.mike = null;
    this.boe = null;
    this.hora = null;
    this.ais = null;
    this.detidos = 0;
    this.origemEntrada = 'MANUAL';

    this.naturezas = [];
    this.equipe = new Equipe();
    this.armas = [];
    this.drogas = [];
    this.itensApreendidos = [];

    this.timestampCriacao = new Date().toISOString();
    this.ultimaAtualizacao = this.timestampCriacao;
  }

  adicionarNatureza(natureza) {
    if (natureza) {
      const natLimpa = String(natureza).trim().toUpperCase();
      if (!this.naturezas.includes(natLimpa)) {
        this.naturezas.push(natLimpa);
      }
    }
    this._atualizarTimestamp();
  }

  adicionarPolicial(policial) {
    this.equipe.adicionarPolicial(policial);
    this._atualizarTimestamp();
  }

  adicionarArma(arma) {
    if (!(arma instanceof Arma)) {
      throw new ErroValidacaoDominio('Ocorrencia', 'arma', 'Deve ser uma instância válida de Arma');
    }
    this.armas.push(arma);
    this._adicionarItemApreendido('ARMA', arma);
    this._atualizarTimestamp();
  }

  adicionarDroga(droga) {
    if (!(droga instanceof Droga)) {
      throw new ErroValidacaoDominio('Ocorrencia', 'droga', 'Deve ser uma instância válida de Droga');
    }
    this.drogas.push(droga);
    this._adicionarItemApreendido('DROGA', droga);
    this._atualizarTimestamp();
  }

  _adicionarItemApreendido(tipo, instancia) {
    this.itensApreendidos.push({
      tipo,
      instancia,
      timestamp: new Date().toISOString()
    });
  }

  _atualizarTimestamp() {
    this.ultimaAtualizacao = new Date().toISOString();
  }

  obterChave() {
    return this.chave;
  }

  toJSON() {
    return {
      chave: this.chave,
      data: this.data.toISOString(),
      cidade: this.cidade,
      bairro: this.bairro,
      mike: this.mike,
      boe: this.boe,
      hora: this.hora,
      ais: this.ais,
      detidos: this.detidos,
      origemEntrada: this.origemEntrada,
      naturezas: this.naturezas,
      policiais: this.equipe.obterPoliciais().map(p => ({
        matricula: p.matricula,
        nome: p.nome,
        graduacao: p.graduacao,
        pelotao: p.pelotao
      })),
      armas: this.armas.map(a => ({ tipo: a.tipo, quantidade: a.quantidade, calibre: a.calibre })),
      drogas: this.drogas.map(d => ({ tipo: d.tipo, quantidade: d.quantidade, unidadeMedida: d.unidadeMedida })),
      itensApreendidos: this.itensApreendidos,
      timestampCriacao: this.timestampCriacao,
      ultimaAtualizacao: this.ultimaAtualizacao
    };
  }
}

// Para exportação no Node.js durante os testes locais
if (typeof module !== 'undefined' && module.exports) {
  const { ErroValidacaoDominio } = require('../Core/Erros');
  const { Equipe } = require('./Equipe');
  const { Arma } = require('./Arma');
  const { Droga } = require('./Droga');
  module.exports = { Ocorrencia };
}
