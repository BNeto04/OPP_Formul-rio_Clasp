# Sprint M03 — Camada de Domínio (Entidades & Value Objects)

> **Status:** PLANEJADA (PRONTA PARA INICIAR EXECUÇÃO)  
> **Ambiente:** Bancada Offline (`refactor/down-plant-gs-offline`)  
> **Cômodo Alvo:** M03 Domínio  

---

## 🎯 Objetivos da Sprint

1. Inventariar, isolar e purificar todas as entidades de negócio e Value Objects do SYNTHÉON GS.
2. Garantir que as classes de Domínio sejam puras, sem acoplamento a APIs do Google Apps Script (`SpreadsheetApp`, `HtmlService`), chamadas diretas de I/O ou dependências de UI.
3. Garantir a imutabilidade (`Object.freeze`) das instâncias canônicas e objetos de valor (`ChaveOcorrencia`, `RegistroCanonico`, `Arma`, `Droga`).
4. Preservar intactas todas as propriedades necessárias para a formatação visual e relatórios operacionais do M06 (ex: siglas completas de pelotões como `1º PEL GTAR` e `2º PEL GTAR`).

---

## 📦 Entregáveis Planejados

- **`planta/M03_DOMINIO_INVENTARIO.md`**: Inventário mapeando entidades, responsabilidades, dependências, entradas/saídas e status.
- **`Dominio/RegistroCanonico.js`**: Entidade canônica pura representando o fato operacional imutável.
- **`Dominio/RegistroAnalitico.js`**: Entidade agregadora para visualizações analíticas de produtividade.
- **`Dominio/ValueObjects/ChaveOcorrencia.js`**: Value Object imutável de identificação única de ocorrência (`data|mike|boe`).
- **`Dominio/Policial.js`**, **`Dominio/Ocorrencia.js`**, **`Dominio/OcorrenciaFactory.js`**, **`Dominio/Equipe.js`**, **`Dominio/Arma.js`**, **`Dominio/Droga.js`**.

---

## 🟢 Critérios de Aceite da Sprint

- [ ] Inventário das 9 entidades e Value Objects concluído e documentado.
- [ ] Nenhuma classe do Domínio depende do `SpreadsheetApp` ou `Google Apps Script`.
- [ ] Todos os dados necessários para o M06 aplicar as formatações visuais (cores por pelotão, escala de armas) são preservados na transição.
- [ ] 25/25 testes unitários continuam passando com 100% de sucesso.
