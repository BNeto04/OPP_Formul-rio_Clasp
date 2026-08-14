# InventÃ¡rio Geral da Camada de DomÃ­nio (Task C03.1-01)

> **Status:** CONCLUÃDO  
> **CÃ´modo:** C03 DomÃ­nio  
> **Data de Mapeamento:** 29/07/2026  

---

## ðŸ“Š Tabela Geral do InventÃ¡rio do DomÃ­nio

| Entidade / Value Object | Arquivo | Responsabilidade | DependÃªncias | Entradas | SaÃ­das / Destino | Status / Pureza | Testes Existentes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `RegistroCanonico` | `Dominio/RegistroCanonico.js` | Representar o fato operacional imutÃ¡vel e indivisÃ­vel (linguagem oficial) | Nenhuma (depende de `Object.freeze`) | Dados brutos extraÃ­dos pelos adaptadores | Consumido pelo Motor AnalÃ­tico V2 | **PURO / IMUTÃVEL** | `TestDominio.js` |
| `RegistroAnalitico` | `Dominio/RegistroAnalitico.js` | AgregaÃ§Ã£o analÃ­tica da produÃ§Ã£o por policial/unidade (separaÃ§Ã£o de Fatos vs Indicadores) | Nenhuma | Totais de ocorrÃªncias, armas, drogas e pontuaÃ§Ãµes | Consumido pelos Renderizadores do C06 | **PURO** | `TestDominio.js` |
| `ChaveOcorrencia` | `Dominio/ValueObjects/ChaveOcorrencia.js` | Value Object identificador Ãºnico da ocorrÃªncia (`mike\|boe`) | `ErroValidacaoDominio` | MIKE e/ou BOE | Chave string formatada `MIKE\|BOE` | **PURO / IMUTÃVEL** | `TestDominio.js` |
| `Policial` | `Dominio/Policial.js` | Representar a entidade militar (matrÃ­cula sanitizada, nome, graduaÃ§Ã£o, pelotÃ£o) | `ErroValidacaoDominio` | MatrÃ­cula, Nome, GraduaÃ§Ã£o, PelotÃ£o | ComparaÃ§Ã£o de igualdade (`equals()`) | **PURO** | `TestDominio.js` |
| `Ocorrencia` | `Dominio/Ocorrencia.js` | Aggregate Root que gerencia a equipe, apreensÃµes e metadados do fato policial | `ErroValidacaoDominio`, `Equipe`, `Arma`, `Droga` | Chave, Data, Cidade, Bairro | DTO JSON / Objetos de domÃ­nio | **PURO** | `TestDominio.js` |
| `OcorrenciaFactory` | `Dominio/OcorrenciaFactory.js` | Factory que valida e contrÃ³i instÃ¢ncias de `Ocorrencia` a partir de payloads | `ErroValidacaoDominio`, `ChaveOcorrencia`, `Ocorrencia`, `Core/Datas` | Objeto bruto de entrada | InstÃ¢ncia validada de `Ocorrencia` | **PURO** | `TestDominio.js` |
| `Equipe` | `Dominio/Equipe.js` | AgregaÃ§Ã£o de policiais em guarniÃ§Ã£o evitando duplicidade por matrÃ­cula | `ErroValidacaoDominio`, `Policial` | InstÃ¢ncias de `Policial` | Lista deduplicada de policiais | **PURO** | `TestDominio.js` |
| `Arma` | `Dominio/Arma.js` | Fato imutÃ¡vel de apreensÃ£o de arma de fogo | `ErroValidacaoDominio` | Tipo, Quantidade, Calibre | InstÃ¢ncia imutÃ¡vel de `Arma` | **PURO / IMUTÃVEL** | `TestDominio.js` |
| `Droga` | `Dominio/Droga.js` | Fato imutÃ¡vel de apreensÃ£o de entorpecente | `ErroValidacaoDominio` | Tipo, Quantidade, UnidadeMedida | InstÃ¢ncia imutÃ¡vel de `Droga` | **PURO / IMUTÃVEL** | `TestDominio.js` |

---

## ðŸ›‘ PreservaÃ§Ã£o Transversal de Dados Visuais (C06)

Foi verificado que o modelo de DomÃ­nio preserva 100% das propriedades brutas e normalizadas necessÃ¡rias para o C06 aplicar as formataÃ§Ãµes visuais definidas em 02_Comodos/02_SPECS/REGRA_TRANSVERSAL_FORMATACAO_RELATORIOS.md:

1. **PelotÃµes/Subunidades:** As propriedades `pelotao` em `RegistroCanonico`, `RegistroAnalitico` e `Policial` preservam a string completa (ex: `1Âº PEL GTAR`, `2Âº PEL GTAR`, `OFICIAIS`), permitindo que a regra visual pinte as cÃ©lulas adequadamente.
2. **Escala de Armas:** Os totais de armas em `RegistroCanonico.policiais[].armas` e `RegistroAnalitico.fatos.armas` mantÃªm contagens numÃ©ricas exatas sem truncamento para aplicaÃ§Ã£o da escala de cores (0, 1..3, 4..5, 6..9, 10+).

---

## ðŸŸ¢ AvaliaÃ§Ã£o da Pureza Arquitetural
- **Zero acoplamento a planilhas:** Nenhuma classe do DomÃ­nio lÃª ou grava diretamente no Google Sheets.
- **Zero chamadas a APIs de UI:** Nenhuma chamada a `SpreadsheetApp`, `HtmlService` ou `Logger.log` da planilha.
- **Imutabilidade Ativa:** `RegistroCanonico`, `ChaveOcorrencia`, `Arma` e `Droga` aplicam `Object.freeze` em suas estruturas.
- **RelatÃ³rio Completo de Pureza:** Ver 02_Comodos/C03_DOMINIO_PUREZA.md.


