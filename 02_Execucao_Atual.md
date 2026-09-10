### Pacote de Entrega: OBS-C01-R16 - Reversão de Injeção de Fórmulas e Preservação da Planilha

- **Horário:** 18/08/2026 12:30
- **Endereço Canônico da Tarefa:**
  `Terreno SYNTHÉON GS -> C01 Entrada -> MOD-C01-01_FORMULARIO_E_MENUS -> SUB-C01-01-02_PERSISTENCIA_MANUAL -> Entrada/EntradaManual.js`
- **Destino Exclusivo:**
  `syntheon-gs-downplant-offline/Entrada/EntradaManual.js`
- **Ações Executadas:**
  1. **Reversão Completa de Injeção de Fórmulas:**
     - A Fase 3 de injeção de fórmulas foi **completamente removida** de `EntradaManual.js`.
     - O script agora grava exclusivamente os dados informados (`POLICIAL` na coluna AE e `QDT ARMAS` na coluna AF), deixando as colunas `PELOTÃO` (AB), `GRAD` (AC) e `MATRÍCULA` (AD) 100% intocadas para que as fórmulas pré-existentes na planilha operem livremente.
  2. **Blindagem na Captura de Policiais (`Formulario.html`):**
     - Regex de captura de matrículas no BO expandida para `/(?:Matr[íi]cula|Mat\.?|Matr\.?|PMPE)[\s:.-]*(\d{5,8})/gi`, garantindo extração mesmo com abreviações ou pontuações diferentes.
  3. **Validação e Deploy:**
     - `node Testes/TestEntradaManualFormulario.js` executado com **9/9 testes aprovados (código 0)**.
     - `clasp push --force` transmitido com sucesso (**69 arquivos atualizados no Apps Script online**).
     - Espelho `07_Codigo_Leitura/Entrada/EntradaManual.js.md` atualizado com SHA-256.
- **Validação de Integridade do Cofre:**
  - Total de arquivos no cofre: 141.
  - Zero erros de JSON nos Canvas.
  - 100% dos links e referências resolvem para arquivos existentes no cofre.
- **Arquivos Alterados no Repositório:**
  ```text
  Entrada/EntradaManual.js
  Entrada/Formulario.html
  Testes/TestEntradaManualFormulario.js
  ```
- **Arquivos Alterados no Cofre Obsidian:**
  ```text
  07_Codigo_Leitura/Entrada/EntradaManual.js.md
  ```
- **Efeitos Externos:**
  - `clasp push --force` transmitido com sucesso (código 0).
  - Zero células ou dados de planilhas alterados.
- **Divergências:**
  - Nenhuma.
- **Estado:**
  - Execução concluída; aguardando auditoria.




