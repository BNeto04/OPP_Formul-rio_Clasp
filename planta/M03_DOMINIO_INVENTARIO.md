# Inventário Geral da Camada de Domínio (Task M03.1-01)

> **Status:** CONCLUÍDO  
> **Cômodo:** M03 Domínio  
> **Data de Mapeamento:** 29/07/2026  

---

## 📊 Tabela Geral do Inventário do Domínio

| Entidade / Value Object | Arquivo | Responsabilidade | Dependências | Entradas | Saídas / Destino | Status / Pureza | Testes Existentes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `RegistroCanonico` | `Dominio/RegistroCanonico.js` | Representar o fato operacional imutável e indivisível (linguagem oficial) | Nenhuma (depende de `Object.freeze`) | Dados brutos extraídos pelos adaptadores | Consumido pelo Motor Analítico V2 | **PURO / IMUTÁVEL** | `TestDominio.js` |
| `RegistroAnalitico` | `Dominio/RegistroAnalitico.js` | Agregação analítica da produção por policial/unidade (separação de Fatos vs Indicadores) | Nenhuma | Totais de ocorrências, armas, drogas e pontuações | Consumido pelos Renderizadores do M06 | **PURO** | `TestDominio.js` |
| `ChaveOcorrencia` | `Dominio/ValueObjects/ChaveOcorrencia.js` | Value Object identificador único da ocorrência (`mike\|boe`) | `ErroValidacaoDominio` | MIKE e/ou BOE | Chave string formatada `MIKE\|BOE` | **PURO / IMUTÁVEL** | `TestDominio.js` |
| `Policial` | `Dominio/Policial.js` | Representar a entidade militar (matrícula sanitizada, nome, graduação, pelotão) | `ErroValidacaoDominio` | Matrícula, Nome, Graduação, Pelotão | Comparação de igualdade (`equals()`) | **PURO** | `TestDominio.js` |
| `Ocorrencia` | `Dominio/Ocorrencia.js` | Aggregate Root que gerencia a equipe, apreensões e metadados do fato policial | `ErroValidacaoDominio`, `Equipe`, `Arma`, `Droga` | Chave, Data, Cidade, Bairro | DTO JSON / Objetos de domínio | **PURO** | `TestDominio.js` |
| `OcorrenciaFactory` | `Dominio/OcorrenciaFactory.js` | Factory que valida e contrói instâncias de `Ocorrencia` a partir de payloads | `ErroValidacaoDominio`, `ChaveOcorrencia`, `Ocorrencia`, `Core/Datas` | Objeto bruto de entrada | Instância validada de `Ocorrencia` | **PURO** | `TestDominio.js` |
| `Equipe` | `Dominio/Equipe.js` | Agregação de policiais em guarnição evitando duplicidade por matrícula | `ErroValidacaoDominio`, `Policial` | Instâncias de `Policial` | Lista deduplicada de policiais | **PURO** | `TestDominio.js` |
| `Arma` | `Dominio/Arma.js` | Fato imutável de apreensão de arma de fogo | `ErroValidacaoDominio` | Tipo, Quantidade, Calibre | Instância imutável de `Arma` | **PURO / IMUTÁVEL** | `TestDominio.js` |
| `Droga` | `Dominio/Droga.js` | Fato imutável de apreensão de entorpecente | `ErroValidacaoDominio` | Tipo, Quantidade, UnidadeMedida | Instância imutável de `Droga` | **PURO / IMUTÁVEL** | `TestDominio.js` |

---

## 🛑 Preservação Transversal de Dados Visuais (M06)

Foi verificado que o modelo de Domínio preserva 100% das propriedades brutas e normalizadas necessárias para o M06 aplicar as formatações visuais definidas em [planta/02_SPECS/REGRA_TRANSVERSAL_FORMATACAO_RELATORIOS.md](file:///C:/Users/Bneto04/Documents/Codex/syntheon-gs-downplant-offline/planta/02_SPECS/REGRA_TRANSVERSAL_FORMATACAO_RELATORIOS.md):

1. **Pelotões/Subunidades:** As propriedades `pelotao` em `RegistroCanonico`, `RegistroAnalitico` e `Policial` preservam a string completa (ex: `1º PEL GTAR`, `2º PEL GTAR`, `OFICIAIS`), permitindo que a regra visual pinte as células adequadamente.
2. **Escala de Armas:** Os totais de armas em `RegistroCanonico.policiais[].armas` e `RegistroAnalitico.fatos.armas` mantêm contagens numéricas exatas sem truncamento para aplicação da escala de cores (0, 1..3, 4..5, 6..9, 10+).

---

## 🟢 Avaliação da Pureza Arquitetural
- **Zero acoplamento a planilhas:** Nenhuma classe do Domínio lê ou grava diretamente no Google Sheets.
- **Zero chamadas a APIs de UI:** Nenhuma chamada a `SpreadsheetApp`, `HtmlService` ou `Logger.log` da planilha.
- **Imutabilidade Ativa:** `RegistroCanonico`, `ChaveOcorrencia`, `Arma` e `Droga` aplicam `Object.freeze` em suas estruturas.
