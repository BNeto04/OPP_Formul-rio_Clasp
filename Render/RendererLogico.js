/**
 * ARQUIVO: Render/RendererLogico.js
 * DESCRIÇÃO: Responsável por mesclar o Modelo Lógico (O QUÊ) com o Tema (COMO) e os 
 * RegistrosAnaliticos (DADOS). O produto final é um DocumentoLógico estático,
 * completamente livre da API do Google. Respeita a Coexistência, mantendo o 
 * RendererTabela legado inalterado para a V1.
 */

class RendererLogico {
  /**
   * Constrói o Documento abstrato pronto para impressão por qualquer Driver
   */
  static renderizar(modelo, registrosAnaliticos, tema) {
    const doc = new DocumentoLogico(modelo.obterTitulo());
    
    // 1. Cabeçalhos
    doc.cabecalhos = modelo.obterColunas();
    
    // Estilo do cabeçalho (Linha 1 da matriz de estilos)
    const estiloCabecalho = Array(doc.cabecalhos.length).fill(tema.corCabecalho);
    doc.estilos.push(estiloCabecalho);

    // 2. Linhas e Cores Físicas (Mapeadas logicamente)
    registrosAnaliticos.forEach(reg => {
      // Valor das colunas
      const valores = modelo.formatarLinha(reg);
      doc.linhas.push(valores);
      
      // Regra de cores: Podemos pintar o fundo da linha inteira baseado no Pelotão, por exemplo.
      // (Isso é uma simulação elegante para tirar as cores do código espaguete)
      const corFundo = tema.corPelotao(reg.pelotao);
      
      // Constrói a linha de estilos correspondente às colunas
      const estilosLinha = Array(doc.cabecalhos.length).fill(corFundo);
      
      doc.estilos.push(estilosLinha);
    });

    return doc;
  }
}
