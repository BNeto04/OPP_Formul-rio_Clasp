# Especificação Técnica — Cômodo M03 Domínio

> **Código do Cômodo:** M03  
> **Nome:** Camada de Domínio  
> **Status:** VERIFICADO OFFLINE - Sprint 1  

---

## 1. Visão Geral e Responsabilidades

O cômodo **M03 Domínio** reúne as regras de negócio puras, modelos conceituais, entidades e Value Objects do SYNTHÉON GS. Ele representa a verdade conceitual do sistema, independente da forma de armazenamento (Google Sheets, Firebase ou arquivos JSON).

### Pertence ao M03:
- `Dominio/RegistroCanonico.js`
- `Dominio/RegistroAnalitico.js`
- `Dominio/Policial.js`
- `Dominio/Ocorrencia.js`
- `Dominio/OcorrenciaFactory.js`
- `Dominio/Equipe.js`
- `Dominio/Arma.js`
- `Dominio/Droga.js`
- `Dominio/ValueObjects/ChaveOcorrencia.js`

### Vedações (NÃO pertence ao M03):
- Leitura de planilhas ou chamadas a `SpreadsheetApp` (cômodo M02).
- Cálculo e compilação de rankings operacionais (cômodo M04).
- Geração de HTML, menus ou modais (cômodo M01).
- Aplicação de estilos de cor ou formatação de células (cômodo M06).

---

## 2. Regra de Preservação Visual (Transversal)

Toda entidade e objeto de valor do M03 deve preservar integralmente as propriedades que alimentam o M06 Relatórios. O Domínio não aplica cores nem estilos visuais, porém é **estritamente obrigado** a manter a fidelidade e riqueza dos dados de origem para que o M06 possa aplicar as regras de formatação declaradas em [planta/02_SPECS/REGRA_TRANSVERSAL_FORMATACAO_RELATORIOS.md](file:///C:/Users/Bneto04/Documents/Codex/syntheon-gs-downplant-offline/planta/02_SPECS/REGRA_TRANSVERSAL_FORMATACAO_RELATORIOS.md).

---

## 3. Diretrizes de Imutabilidade e Pureza

1. **Pureza Total:** Zero imports de bibliotecas de infraestrutura de planilhas ou APIs do Apps Script.
2. **Value Objects Imutáveis:** Instâncias de `ChaveOcorrencia`, `Arma` e `Droga` devem ser congeladas via `Object.freeze`.
3. **Fatos Canônicos:** O `RegistroCanonico` representa o evento imutável da ocorrência e não pode ser alterado após a instanciação.

---

## 4. Invariantes do Domínio

As seguintes regras constituem os **Invariantes do Domínio** do SYNTHÉON e nunca podem ser violadas:

- **Isolamento de Infraestrutura:** O Domínio nunca acessa Google Apps Script (`SpreadsheetApp`, `HtmlService`, `Logger`, `Utilities`, `Session`).
- **Isolamento de Leitura/Escrita:** O Domínio não lê nem escreve em planilhas ou bancos de dados.
- **Isolamento de UI/Renderização:** O Domínio não renderiza relatórios, modais ou menus.
- **Isolamento Estético:** O Domínio não conhece cores, layouts, células ou nomes de abas.
- **Preservação Semântica de Pelotões:** O Domínio preserva o pelotão/subunidade exatamente como recebido (ex: `1º PEL GTAR` e `2º PEL GTAR` não podem ser truncados para `1º PEL`).
- **Preservação do Guardião:** O Domínio preserva integralmente `eventoPontuavel.indicador` e `eventoPontuavel.imputado`.
- **Sanitização Identificadora:** A matrícula é sanitizada numericamente para comparação de igualdade (`equals()`), mas os dados de exibição originais são preservados quando necessário.
- **Imutabilidade Ativa:** Todos os Value Objects (`ChaveOcorrencia`, `Arma`, `Droga`) e Fatos Canônicos (`RegistroCanonico`) utilizam `Object.freeze`.
- **Separação de Fatos vs Indicadores:** Indicadores computados devem ser derivados exclusivamente por getters dinâmicos em `RegistroAnalitico`, sem alterar ou sobrescrever os fatos brutos.
