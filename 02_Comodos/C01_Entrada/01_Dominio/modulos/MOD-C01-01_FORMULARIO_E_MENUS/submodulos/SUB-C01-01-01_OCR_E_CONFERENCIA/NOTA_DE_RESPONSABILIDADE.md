# SUB-C01-01-01_OCR_E_CONFERENCIA

## Responsabilidade Canônica
Este submódulo é responsável pela extração in-browser de dados do Boletim de Ocorrência (BO/OCR) via Tesseract.js / PDF.js e pela interface assistiva e não bloqueante de conferência do operador no formulário HTML.

## Fluxo Factual da Interface
```text
BO/OCR -> sugestão de natureza -> operador (escolhe ou digita) -> tentativa de salvar
```

## Diretrizes de Comportamento
1. **Assistência Não Bloqueante:** A lista de naturezas obtida da aba mensal atua estritamente como orientação/sugestão (`<datalist>`). A ausência ou falha de carregamento de sugestões nunca desabilita o formulário nem bloqueia a digitação do operador.
2. **Preservação de Dados:** O texto extraído pelo OCR permanece no campo para conferência e edição humana. Se houver correspondência exata por normalização com uma das sugestões, adota-se a grafia canônica; caso contrário, o texto original é preservado.
3. **Porta de Persistência Inalterada:** A interface realiza validação local prévia apenas de preenchimento de `DATA` e `NATUREZA`. A fronteira de validação semântica e gravação segura continua sendo exercida exclusivamente pelo backend (`Entrada/EntradaManual.js`) e pelas validações da planilha. Nenhuma Porta de persistência foi alterada nesta fatia.
