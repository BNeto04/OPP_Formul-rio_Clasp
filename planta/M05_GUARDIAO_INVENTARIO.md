# Inventário Geral do Guardião da Qualidade Operacional (Task M05.1-01)

> **Status:** CONCLUÍDO  
> **Cômodo:** M05 Guardião da Qualidade  
> **Data de Mapeamento:** 29/07/2026  

---

## 📊 Tabela de Componentes e Responsabilidades do M05

| Componente / Módulo | Arquivo | Responsabilidade | Dependências | Entradas | Saídas / Destino | Status Atual | Testes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GuardiaoQualidade` | `Features/GuardiaoQualidade.js` | Orquestrador principal da auditoria visual e varredura da aba ativa | `RegrasQualidade`, `RendererAuditoriaSaude`, `SpreadsheetApp` | Aba/Sheet ativa do Google Sheets | Coluna AM (`Alerta Integridade`), Abas de auditoria | **APLICADO NO GS** | `Testes/TestGuardiao.js` |
| `RegrasQualidade` | `Core/RegrasQualidade.js` | Núcleo de diagnósticos e validações lógicas de integridade por linha e túnel | `SyntheonUtils` (atualmente com `Utilities`/`Session` na chave de data) | Matriz de dados e fórmulas da aba | Coleção de diagnósticos estruturados | **REFACTOR EM M05.1-02** | `Testes/TestGuardiao.js` |
| `RendererAuditoriaSaude` | `Render/RendererAuditoriaSaude.js` | Renderizador visual das abas de auditoria (`[AUDITORIA]` e `[HISTÓRICO]`) | `SpreadsheetApp`, `Utilities`, `Session` | Diagnósticos estruturados | Abas `[AUDITORIA] Ocorrencias` e `[HISTORICO] Auditoria Ocorrencias` | **EVOLUÇÃO EM M05.1-05** | offline mock |

---

## 🔍 Mapeamento de Regras e Efeitos de Escrita

1. **Coluna `AM` (`Alerta Integridade`)**:
   - **Formato:** Resumo por linha contendo texto explicativo (ou limpo em linhas sem alerta).
   - **Efeito:** Nunca insere validações de dados restritivas; apenas escreve strings de alerta.

2. **Abas de Auditoria**:
   - `[AUDITORIA] Ocorrencias`: Exibe o relatório detalhado da **última auditoria** realizada.
   - `[HISTORICO] Auditoria Ocorrencias`: Registra o histórico acumulado de todas as execuções (nunca é limpo).

3. **Menu de Execução**:
   - Invocado manualmente pelo operador no menu `SYNTHÉON` -> `Guardiao da Qualidade`.

4. **Identificação de Dependências GAS a Isolar**:
   - `Core/RegrasQualidade.js` contém chamadas a `Utilities.formatDate` e `Session.getScriptTimeZone` em `chaveTunel()`. A `TASK-M05.1-02` irá desvincular essas chamadas para garantir 100% de pureza no Node.js.
