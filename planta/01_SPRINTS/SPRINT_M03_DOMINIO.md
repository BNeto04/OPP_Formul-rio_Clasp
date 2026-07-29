# Sprint M03 — Camada de Domínio (Entidades & Value Objects)

> **Status:** VERIFICADO OFFLINE - Sprint 1  
> **Ambiente:** Bancada Offline (`refactor/down-plant-gs-offline`)  
> **Cômodo Alvo:** M03 Domínio  
> **Data de Conclusão:** 29/07/2026  

---

## 🎯 Objetivos da Sprint

1. Inventariar, isolar e purificar todas as entidades de negócio e Value Objects do SYNTHÉON GS.
2. Garantir que as classes de Domínio sejam puras, sem acoplamento a APIs do Google Apps Script (`SpreadsheetApp`, `HtmlService`), chamadas diretas de I/O ou dependências de UI.
3. Garantir a imutabilidade (`Object.freeze`) das instâncias canônicas e objetos de valor (`ChaveOcorrencia`, `RegistroCanonico`, `Arma`, `Droga`).
4. Preservar intactas todas as propriedades necessárias para a formatação visual e relatórios operacionais do M06 (ex: siglas completas de pelotões como `1º PEL GTAR` e `2º PEL GTAR`).

---

## 📦 Entregáveis Concluídos

- **`planta/M03_DOMINIO_INVENTARIO.md`**: Inventário completo das 9 entidades e Value Objects.
- **`planta/M03_DOMINIO_PUREZA.md`**: Relatório de pureza garantindo 0% de acoplamento a I/O ou Apps Script.
- **`planta/02_SPECS/M03_DOMINIO_SPEC.md`**: Especificação técnica com seção formal de Invariantes do Domínio.
- **`Testes/TestDominio.js`**: Cobertura expandida para 15 testes do Domínio (29 testes no total da suíte integral, todos aprovados).

---

## 🟢 Critérios de Aceite Atendidos

- [x] Inventário das 9 entidades e Value Objects concluído e documentado.
- [x] Nenhuma classe do Domínio depende do `SpreadsheetApp` ou `Google Apps Script` (0% de acoplamento).
- [x] Todos os dados necessários para o M06 aplicar as formatações visuais (cores por pelotão, escala de armas, `eventoPontuavel`) são preservados sem perdas.
- [x] Suíte integral de 29/29 testes unitários passando com 100% de sucesso.
