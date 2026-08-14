# Mapeamento de Tarefas â€” CÃ´modo C03 DomÃ­nio

> **Status Geral do CÃ´modo:** VERIFICADO OFFLINE - Sprint 1 (TODAS AS TAREFAS CONCLUÃDAS)  

---

## ðŸ›‘ Regra de PreservaÃ§Ã£o Transversal

> **IMPORTANTE:** Toda alteraÃ§Ã£o no C03 deve preservar integralmente os contratos e dados necessÃ¡rios para os relatÃ³rios visuais definidos em:  
> 02_Comodos/02_SPECS/REGRA_TRANSVERSAL_FORMATACAO_RELATORIOS.md  
> *O DomÃ­nio nÃ£o formata a cÃ©lula, mas Ã© obrigado a preservar os dados fiÃ©is que permitem ao C06 aplicar as cores de pelotÃµes e escalas de armas.*

---

## SPRINT C03.1 â€” PurificaÃ§Ã£o & OrganizaÃ§Ã£o do DomÃ­nio

| ID | Tarefa | Arquivo(s) Afetado(s) | Status | Commit |
| :--- | :--- | :--- | :--- | :--- |
| `TASK-C03.1-01` | InventÃ¡rio detalhado das entidades e Value Objects | `02_Comodos/C03_DOMINIO_INVENTARIO.md` | **CONCLUÃDA** | `a01d1b9` |
| `TASK-C03.1-02` | Blindar contratos semÃ¢nticos do DomÃ­nio e testes de preservaÃ§Ã£o visual | `Testes/TestDominio.js` | **CONCLUÃDA** | `5e44488` |
| `TASK-C03.1-03` | Auditoria de pureza arquitetural da camada de DomÃ­nio (isolar I/O e GAS) | `02_Comodos/C03_DOMINIO_PUREZA.md`, `Dominio/*.js` | **CONCLUÃDA** | `7430361` |
| `TASK-C03.1-04` | Registrar invariantes finais do DomÃ­nio na especificaÃ§Ã£o tÃ©cnica | `02_Comodos/02_SPECS/C03_DOMINIO_SPEC.md` | **CONCLUÃDA** | `ec0200e` |
| `TASK-C03.1-05` | SuÃ­te de testes do DomÃ­nio e verificaÃ§Ã£o integral da bancada | `Testes/TestDominio.js` | **CONCLUÃDA** | `5e44488` |


## Extrato de MOD-C03-01_Sprint.md

# Sprint C03 Ã¢â‚¬â€ Camada de DomÃƒÂ­nio (Entidades & Value Objects)

> **Status:** VERIFICADO OFFLINE - Sprint 1  
> **Ambiente:** Bancada Offline (`refactor/down-plant-gs-offline`)  
> **CÃƒÂ´modo Alvo:** C03 DomÃƒÂ­nio  
> **Data de ConclusÃƒÂ£o:** 29/07/2026  

---

## Ã°Å¸Å½Â¯ Objetivos da Sprint

1. Inventariar, isolar e purificar todas as entidades de negÃƒÂ³cio e Value Objects do SYNTHÃƒâ€°ON GS.
2. Garantir que as classes de DomÃƒÂ­nio sejam puras, sem acoplamento a APIs do Google Apps Script (`SpreadsheetApp`, `HtmlService`), chamadas diretas de I/O ou dependÃƒÂªncias de UI.
3. Garantir a imutabilidade (`Object.freeze`) das instÃƒÂ¢ncias canÃƒÂ´nicas e objetos de valor (`ChaveOcorrencia`, `RegistroCanonico`, `Arma`, `Droga`).
4. Preservar intactas todas as propriedades necessÃƒÂ¡rias para a formataÃƒÂ§ÃƒÂ£o visual e relatÃƒÂ³rios operacionais do C06 (ex: siglas completas de pelotÃƒÂµes como `1Ã‚Âº PEL GTAR` e `2Ã‚Âº PEL GTAR`).

---

## Ã°Å¸â€œÂ¦ EntregÃƒÂ¡veis ConcluÃƒÂ­dos

- **`02_Comodos/C03_DOMINIO_INVENTARIO.md`**: InventÃƒÂ¡rio completo das 9 entidades e Value Objects.
- **`02_Comodos/C03_DOMINIO_PUREZA.md`**: RelatÃƒÂ³rio de pureza garantindo 0% de acoplamento a I/O ou Apps Script.
- **`02_Comodos/02_SPECS/C03_DOMINIO_SPEC.md`**: EspecificaÃƒÂ§ÃƒÂ£o tÃƒÂ©cnica com seÃƒÂ§ÃƒÂ£o formal de Invariantes do DomÃƒÂ­nio.
- **`Testes/TestDominio.js`**: Cobertura expandida para 15 testes do DomÃƒÂ­nio (29 testes no total da suÃƒÂ­te integral, todos aprovados).

---

## Ã°Å¸Å¸Â¢ CritÃƒÂ©rios de Aceite Atendidos

- [x] InventÃƒÂ¡rio das 9 entidades e Value Objects concluÃƒÂ­do e documentado.
- [x] Nenhuma classe do DomÃƒÂ­nio depende do `SpreadsheetApp` ou `Google Apps Script` (0% de acoplamento).
- [x] Todos os dados necessÃƒÂ¡rios para o C06 aplicar as formataÃƒÂ§ÃƒÂµes visuais (cores por pelotÃƒÂ£o, escala de armas, `eventoPontuavel`) sÃƒÂ£o preservados sem perdas.
- [x] SuÃƒÂ­te integral de 29/29 testes unitÃƒÂ¡rios passando com 100% de sucesso.



