# EspecificaÃ§Ã£o TÃ©cnica â€” CÃ´modo C03 DomÃ­nio

> **CÃ³digo do CÃ´modo:** C03  
> **Nome:** Camada de DomÃ­nio  
> **Status:** VERIFICADO OFFLINE - Sprint 1  

---

## 1. VisÃ£o Geral e Responsabilidades

O cÃ´modo **C03 DomÃ­nio** reÃºne as regras de negÃ³cio puras, modelos conceituais, entidades e Value Objects do SYNTHÃ‰ON GS. Ele representa a verdade conceitual do sistema, independente da forma de armazenamento (Google Sheets, Firebase ou arquivos JSON).

### Pertence ao C03:
- `Dominio/RegistroCanonico.js`
- `Dominio/RegistroAnalitico.js`
- `Dominio/Policial.js`
- `Dominio/Ocorrencia.js`
- `Dominio/OcorrenciaFactory.js`
- `Dominio/Equipe.js`
- `Dominio/Arma.js`
- `Dominio/Droga.js`
- `Dominio/ValueObjects/ChaveOcorrencia.js`

### VedaÃ§Ãµes (NÃƒO pertence ao C03):
- Leitura de planilhas ou chamadas a `SpreadsheetApp` (cÃ´modo C02).
- CÃ¡lculo e compilaÃ§Ã£o de rankings operacionais (cÃ´modo C04).
- GeraÃ§Ã£o de HTML, menus ou modais (cÃ´modo C01).
- AplicaÃ§Ã£o de estilos de cor ou formataÃ§Ã£o de cÃ©lulas (cÃ´modo C06).

---

## 2. Regra de PreservaÃ§Ã£o Visual (Transversal)

Toda entidade e objeto de valor do C03 deve preservar integralmente as propriedades que alimentam o C06 RelatÃ³rios. O DomÃ­nio nÃ£o aplica cores nem estilos visuais, porÃ©m Ã© **estritamente obrigado** a manter a fidelidade e riqueza dos dados de origem para que o C06 possa aplicar as regras de formataÃ§Ã£o declaradas em 02_Comodos/02_SPECS/REGRA_TRANSVERSAL_FORMATACAO_RELATORIOS.md.

---

## 3. Diretrizes de Imutabilidade e Pureza

1. **Pureza Total:** Zero imports de bibliotecas de infraestrutura de planilhas ou APIs do Apps Script.
2. **Value Objects ImutÃ¡veis:** InstÃ¢ncias de `ChaveOcorrencia`, `Arma` e `Droga` devem ser congeladas via `Object.freeze`.
3. **Fatos CanÃ´nicos:** O `RegistroCanonico` representa o evento imutÃ¡vel da ocorrÃªncia e nÃ£o pode ser alterado apÃ³s a instanciaÃ§Ã£o.

---

## 4. Invariantes do DomÃ­nio

As seguintes regras constituem os **Invariantes do DomÃ­nio** do SYNTHÃ‰ON e nunca podem ser violadas:

- **Isolamento de Infraestrutura:** O DomÃ­nio nunca acessa Google Apps Script (`SpreadsheetApp`, `HtmlService`, `Logger`, `Utilities`, `Session`).
- **Isolamento de Leitura/Escrita:** O DomÃ­nio nÃ£o lÃª nem escreve em planilhas ou bancos de dados.
- **Isolamento de UI/RenderizaÃ§Ã£o:** O DomÃ­nio nÃ£o renderiza relatÃ³rios, modais ou menus.
- **Isolamento EstÃ©tico:** O DomÃ­nio nÃ£o conhece cores, layouts, cÃ©lulas ou nomes de abas.
- **PreservaÃ§Ã£o SemÃ¢ntica de PelotÃµes:** O DomÃ­nio preserva o pelotÃ£o/subunidade exatamente como recebido (ex: `1Âº PEL GTAR` e `2Âº PEL GTAR` nÃ£o podem ser truncados para `1Âº PEL`).
- **PreservaÃ§Ã£o do GuardiÃ£o:** O DomÃ­nio preserva integralmente `eventoPontuavel.indicador` e `eventoPontuavel.imputado`.
- **SanitizaÃ§Ã£o Identificadora:** A matrÃ­cula Ã© sanitizada numericamente para comparaÃ§Ã£o de igualdade (`equals()`), mas os dados de exibiÃ§Ã£o originais sÃ£o preservados quando necessÃ¡rio.
- **Imutabilidade Ativa:** Todos os Value Objects (`ChaveOcorrencia`, `Arma`, `Droga`) e Fatos CanÃ´nicos (`RegistroCanonico`) utilizam `Object.freeze`.
- **SeparaÃ§Ã£o de Fatos vs Indicadores:** Indicadores computados devem ser derivados exclusivamente por getters dinÃ¢micos em `RegistroAnalitico`, sem alterar ou sobrescrever os fatos brutos.


## Extrato de MOD-C03-02_Pureza.md

# RelatÃƒÂ³rio de Pureza Arquitetural Ã¢â‚¬â€ CÃƒÂ´modo C03 DomÃƒÂ­nio (Task C03.1-03)

> **Status:** CONCLUÃƒÂDO / 100% PURO  
> **CÃƒÂ´modo:** C03 DomÃƒÂ­nio  
> **Data da Auditoria:** 29/07/2026  

---

## Ã°Å¸Å½Â¯ Objetivo da Auditoria

Garantir que todos os arquivos da camada de DomÃƒÂ­nio (`Dominio/`) estejam totalmente desvinculados de APIs de infraestrutura, chamadas ao Google Apps Script (GAS), manipulaÃƒÂ§ÃƒÂ£o de planilhas, serviÃƒÂ§os de renderizaÃƒÂ§ÃƒÂ£o HTML e componentes de UI.

---

## Ã°Å¸â€Â Escopo Auditado

Foram auditados todos os 9 arquivos JavaScript da pasta `Dominio/`:

1. `Dominio/RegistroCanonico.js`
2. `Dominio/RegistroAnalitico.js`
3. `Dominio/ValueObjects/ChaveOcorrencia.js`
4. `Dominio/Policial.js`
5. `Dominio/Ocorrencia.js`
6. `Dominio/OcorrenciaFactory.js`
7. `Dominio/Equipe.js`
8. `Dominio/Arma.js`
9. `Dominio/Droga.js`

---

## Ã°Å¸â€œâ€¹ Matriz de VerificaÃƒÂ§ÃƒÂ£o de DependÃƒÂªncias Indevidas

| PadrÃƒÂ£o / API Auditada | OcorrÃƒÂªncias Encontradas | Status |
| :--- | :--- | :--- |
| `SpreadsheetApp` | 0 | **ISOLADO** |
| `HtmlService` | 0 | **ISOLADO** |
| `Logger` | 0 | **ISOLADO** |
| `Utilities` | 0 | **ISOLADO** |
| `Session` | 0 | **ISOLADO** |
| Chamadas a Planilhas (`getRange`, `getValues`, `getSheetByName`) | 0 | **ISOLADO** |
| APIs de Browser / UI (`document`, `window`, `HtmlOutput`) | 0 | **ISOLADO** |
| DependÃƒÂªncia de Menus ou UI (`ui`, `createMenu`) | 0 | **ISOLADO** |

---

## Ã°Å¸Å¸Â¢ Veredito de Pureza

A camada de DomÃƒÂ­nio do SYNTHÃƒâ€°ON GS ÃƒÂ© **100% PURA**. 

- Todas as classes operam exclusivamente com tipos nativos do JavaScript (`Date`, `String`, `Number`, `Array`, `Object`).
- A imutabilidade ÃƒÂ© ativamente garantida com `Object.freeze()`.
- O modelo pode ser executado sem qualquer alteraÃƒÂ§ÃƒÂ£o no Node.js, em browsers ou em backend serverless/Firebase.



