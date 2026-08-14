# EspecificaÃ§Ã£o TÃ©cnica â€” CÃ´modo C05 GuardiÃ£o da Qualidade

> **CÃ³digo do CÃ´modo:** C05  
> **Nome:** GuardiÃ£o da Qualidade Operacional  
> **Status:** SPEC APROVADA (EM EXECUÃ‡ÃƒO - SPRINT C05.1)  

---

## 1. VisÃ£o Geral e Responsabilidades

O cÃ´modo **C05 GuardiÃ£o da Qualidade** Ã© o consultor e auditor de integridade operacional do SYNTHÃ‰ON GS. Ele observa a planilha, audita dados operacionais por ocorrÃªncia/tÃºnel (`MIKE|BOE`), identifica divergÃªncias sintÃ¡ticas ou de fÃ³rmulas e apresenta diagnÃ³sticos claros com evidÃªncias e **aÃ§Ãµes recomendadas** para a revisÃ£o humana.

### PrincÃ­pios InegociÃ¡veis:
1. **NÃ£o IntervenÃ§Ã£o Silenciosa:** O GuardiÃ£o **nunca** altera, corrige, apaga, preenche ou substitui dados operacionais automaticamente.
2. **NÃ£o Bloqueio Operacional:** Alertas de negÃ³cio nunca interrompem a execuÃ§Ã£o. Somente `ERRO TECNICO` por ausÃªncia de cabeÃ§alhos indispensÃ¡veis pode interromper o fluxo.
3. **Respeito ao PlantÃ£o Tranquilo:** Linhas que contÃªm apenas data, sem MIKE, sem policial e sem fato fÃ­sico sÃ£o permitidas e tratadas como plantÃ£o tranquilo sem alertas.
4. **MatrÃ­cula Desconhecida:** MatrÃ­cula ausente do mapa de efetivo Ã© classificada como `OBSERVAÃ‡ÃƒO`; nome presente com matrÃ­cula vazia permanece como `ALERTA`.
5. **PreservaÃ§Ã£o de Coluna AM:** Nenhuma nova coluna operacional Ã© criada. A coluna AM continua sendo `Alerta Integridade`.
6. **ExceÃ§Ã£o Manual por Nota:** CÃ©lulas calculadas sem fÃ³rmula sÃ£o classificadas como `EXCECAO MANUAL` quando contiverem nota iniciada pelo padrÃ£o `EXCECAO: motivo` (ex: `EXCECAO: Numerario de R$ 40,00 conforme BOE`). CÃ©lulas sem fÃ³rmula e sem nota permanecem como `ALERTA`.

---

## 2. ClassificaÃ§Ã£o Geral de Severidade

- **`ERRO TECNICO`**: CabeÃ§alho indispensÃ¡vel ausente na aba; pode interromper a execuÃ§Ã£o.
- **`CRITICO`**: Comprometimento da identidade da ocorrÃªncia ou cÃ¡lculo crÃ­tico sem justificativa.
- **`ALERTA`**: Preenchimento, fÃ³rmulas ou rateios que exigem atenÃ§Ã£o/revisÃ£o humana.
- **`OBSERVACAO`**: SituaÃ§Ã£o operacional possÃ­vel que merece ciÃªncia do operador.
- **`EXCECAO MANUAL`**: Valor manual ajustado legitimamente e justificado por nota `EXCECAO:`.

---

## 3. Formato do RelatÃ³rio Detalhado de Auditoria

O relatÃ³rio detalhado gravado nas abas de auditoria deve conter as seguintes colunas padronizadas:
`EXECUCAO` | `DATA/HORA` | `ABA` | `TUNEL` | `LINHA` | `SEVERIDADE` | `REGRA` | `DIAGNOSTICO` | `EVIDENCIA` | `ACAO RECOMENDADA` | `STATUS`

- `[AUDITORIA] Ocorrencias`: Mostra o resultado da **Ãºltima auditoria** executada.
- `[HISTORICO] Auditoria Ocorrencias`: Acumula os registros de todas as auditorias executadas sem apagar o histÃ³rico anterior.


## Extrato de MOD-C05-01_Inventario.md

# InventÃƒÂ¡rio Geral do GuardiÃƒÂ£o da Qualidade Operacional (Task C05.1-01)

> **Status:** CONCLUÃƒÂDO  
> **CÃƒÂ´modo:** C05 GuardiÃƒÂ£o da Qualidade  
> **Data de Mapeamento:** 29/07/2026  

---

## Ã°Å¸â€œÅ  Tabela de Componentes e Responsabilidades do C05

| Componente / MÃƒÂ³dulo | Arquivo | Responsabilidade | DependÃƒÂªncias | Entradas | SaÃƒÂ­das / Destino | Status Atual | Testes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GuardiaoQualidade` | `Features/GuardiaoQualidade.js` | Orquestrador principal da auditoria visual e varredura da aba ativa | `RegrasQualidade`, `RendererAuditoriaSaude`, `SpreadsheetApp` | Aba/Sheet ativa do Google Sheets | Coluna AM (`Alerta Integridade`), Abas de auditoria | **APLICADO NO GS** | `Testes/TestGuardiao.js` |
| `RegrasQualidade` | `Core/RegrasQualidade.js` | NÃƒÂºcleo de diagnÃƒÂ³sticos e validaÃƒÂ§ÃƒÂµes lÃƒÂ³gicas de integridade por linha e tÃƒÂºnel | `SyntheonUtils` (atualmente com `Utilities`/`Session` na chave de data) | Matriz de dados e fÃƒÂ³rmulas da aba | ColeÃƒÂ§ÃƒÂ£o de diagnÃƒÂ³sticos estruturados | **REFACTOR EM C05.1-02** | `Testes/TestGuardiao.js` |
| `RendererAuditoriaSaude` | `Render/RendererAuditoriaSaude.js` | Renderizador visual das abas de auditoria (`[AUDITORIA]` e `[HISTÃƒâ€œRICO]`) | `SpreadsheetApp`, `Utilities`, `Session` | DiagnÃƒÂ³sticos estruturados | Abas `[AUDITORIA] Ocorrencias` e `[HISTORICO] Auditoria Ocorrencias` | **EVOLUÃƒâ€¡ÃƒÆ’O EM C05.1-05** | offline mock |

---

## Ã°Å¸â€Â Mapeamento de Regras e Efeitos de Escrita

1. **Coluna `AM` (`Alerta Integridade`)**:
   - **Formato:** Resumo por linha contendo texto explicativo (ou limpo em linhas sem alerta).
   - **Efeito:** Nunca insere validaÃƒÂ§ÃƒÂµes de dados restritivas; apenas escreve strings de alerta.

2. **Abas de Auditoria**:
   - `[AUDITORIA] Ocorrencias`: Exibe o relatÃƒÂ³rio detalhado da **ÃƒÂºltima auditoria** realizada.
   - `[HISTORICO] Auditoria Ocorrencias`: Registra o histÃƒÂ³rico acumulado de todas as execuÃƒÂ§ÃƒÂµes (nunca ÃƒÂ© limpo).

3. **Menu de ExecuÃƒÂ§ÃƒÂ£o**:
   - Invocado manualmente pelo operador no menu `SYNTHÃƒâ€°ON` -> `Guardiao da Qualidade`.

4. **IdentificaÃƒÂ§ÃƒÂ£o de DependÃƒÂªncias GAS a Isolar**:
   - `Core/RegrasQualidade.js` contÃƒÂ©m chamadas a `Utilities.formatDate` e `Session.getScriptTimeZone` em `chaveTunel()`. A `TASK-C05.1-02` irÃƒÂ¡ desvincular essas chamadas para garantir 100% de pureza no Node.js.



## Extrato de MOD-C05-02_Pureza.md

# RelatÃƒÂ³rio de Pureza Arquitetural Ã¢â‚¬â€ Core do GuardiÃƒÂ£o (Task C05.1-02)

> **Status:** CONCLUÃƒÂDO / 100% PURO  
> **CÃƒÂ´modo:** C05 GuardiÃƒÂ£o da Qualidade  
> **Data da Auditoria:** 29/07/2026  

---

## Ã°Å¸Å½Â¯ Objetivo da Auditoria

Desacoplar o nÃƒÂºcleo de diagnÃƒÂ³stico e regras lÃƒÂ³gicas do GuardiÃƒÂ£o (`Core/RegrasQualidade.js`) de qualquer dependÃƒÂªncia a APIs do Google Apps Script (`Utilities`, `Session`, `SpreadsheetApp`), garantindo que todas as regras de integridade possam ser executadas em ambiente Node.js de testes offline.

---

## Ã°Å¸â€Â AlteraÃƒÂ§ÃƒÂµes de Pureza Realizadas

1. **Formatador de Data Nativo:**
   - Em `RegrasQualidade.chaveTunel(data, mike, boe)`, as chamadas a `Utilities.formatDate` e `Session.getScriptTimeZone` foram substituÃƒÂ­das por formatador nativo em JavaScript puro (`Date.prototype.getDate()`, `getMonth()`, `getFullYear()`).
2. **Estrutura de DiagnÃƒÂ³stico Padronizada:**
   - Implementado o gerador `RegrasQualidade.criarDiagnostico()` retornando objetos de diagnÃƒÂ³stico estruturados contendo: `severidade`, `codigoRegra`, `linha`, `tunel`, `diagnostico`, `evidencia`, `acaoRecomendada` e `condicaoExcecaoManual`.
3. **Enum de Severidade Purificado:**
   - Criado e exportado `SEVERIDADES_GUARDIAO` (`ERRO TECNICO`, `CRITICO`, `ALERTA`, `OBSERVACAO`, `EXCECAO MANUAL`).
4. **Tratamento de ExceÃƒÂ§ÃƒÂµes de CabeÃƒÂ§alho:**
   - Em `validarCabecalhosObrigatorios(idx)`, caso faltem cabeÃƒÂ§alhos indispensÃƒÂ¡veis, o erro lanÃƒÂ§ado carrega o atributo `severidade = SEVERIDADES_GUARDIAO.ERRO_TECNICO`.

---

## Ã°Å¸â€œâ€¹ Matriz de VerificaÃƒÂ§ÃƒÂ£o de Pureza

| MÃƒÂ³dulo Auditado | `Utilities` | `Session` | `SpreadsheetApp` | Status |
| :--- | :---: | :---: | :---: | :--- |
| `Core/RegrasQualidade.js` | 0 | 0 | 0 | **100% PURO** |

---

## Ã°Å¸Å¸Â¢ Veredito

O nÃƒÂºcleo de regras diagnÃƒÂ³sticas do GuardiÃƒÂ£o (`Core/RegrasQualidade.js`) estÃƒÂ¡ **100% PURO** e pronto para suÃƒÂ­te de testes unitÃƒÂ¡rios offline no Node.js.


