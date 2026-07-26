/**
 * ARQUIVO: Render/DocumentoLogico.js
 * DESCRIÇÃO: Representação em memória de um relatório gerado.
 * É completamente agnóstico de plataforma, não conhece HTML, PDF ou Sheets.
 * Possui apenas strings e meta-informações de estilo.
 */

class DocumentoLogico {
  constructor(titulo) {
    this.titulo = titulo;
    this.cabecalhos = [];
    this.linhas = [];
    this.estilos = []; // Matriz bidimensional [linha][coluna] contendo os hexadecimais
    this.metadados = {}; // Para futuras expansões (ex: timestamp de geração)
  }
}
