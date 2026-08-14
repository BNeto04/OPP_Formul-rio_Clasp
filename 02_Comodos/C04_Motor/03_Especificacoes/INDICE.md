# EspecificaÃ§Ã£o TÃ©cnica â€” CÃ´modo C04 Motor AnalÃ­tico

> **CÃ³digo do CÃ´modo:** C04  
> **Nome:** Motor AnalÃ­tico & Plugins de MÃ©trica  
> **Status:** VERIFICADO OFFLINE - Sprint 1  

---

## 1. VisÃ£o Geral e Responsabilidades

O cÃ´modo **C04 Motor AnalÃ­tico** Ã© a inteligÃªncia computacional do SYNTHÃ‰ON GS. Ele recebe do C02 (Leitura) e C03 (DomÃ­nio) os registros canÃ´nicos imutÃ¡veis e executa os cÃ¡lculos, acumulaÃ§Ãµes e deduplicaÃ§Ãµes de produtividade atravÃ©s de uma arquitetura baseada em plugins extensÃ­veis.

### Pertence ao C04:
- `Motor/MotorAnaliticoV2.js`
- `Plugins/IPluginMetrica.js`
- `Plugins/Metricas/PluginArmas.js`
- `Plugins/Metricas/PluginEntorpecentes.js`
- `Plugins/Metricas/PluginOcorrencias.js`
- `Plugins/Metricas/PluginPontuacao.js`
- `Plugins/Metricas/PluginPrisoes.js`
- `Core/Metricas.js`
- `Core/Ranking.js`

### VedaÃ§Ãµes (NÃƒO pertence ao C04):
- Leitura direta de cÃ©lulas ou planilhas (`SpreadsheetApp`).
- FormataÃ§Ã£o de cÃ©lulas, pintura de cores ou alinhamento de tabela (cÃ´modo C06).
- InteraÃ§Ã£o com menus, HTML, formulÃ¡rios ou modais (cÃ´modo C01).
- DefiniÃ§Ã£o ou parsing de entidades do domÃ­nio (cÃ´modo C03).

---

## 2. Diretrizes Principais de CÃ¡lculo

1. **SeparaÃ§Ã£o Fatos vs Indicadores:** Fatos (armas fÃ­sicas, peso de entorpecentes em gramas, detenÃ§Ãµes) sÃ£o contabilizados diretamente; Indicadores (pontuaÃ§Ãµes rateadas) sÃ£o deduplicados pelo valor MÃXIMO da ocorrÃªncia.
2. **DeduplicaÃ§Ã£o de OcorrÃªncias e BOE:** A contagem de ocorrÃªncias Ãºnicas e do BOE ocorre apenas na primeira apariÃ§Ã£o do fato dentro do mesmo tÃºnel (`MIKE|BOE`).
3. **Comutatividade LÃ³gica:** A ordem fÃ­sica das linhas na planilha nÃ£o afeta o resultado final dos rankings.
4. **Respeito Ã s Regras Visuais (Transversal):** O motor compila os totais de produtividade sem truncar pelotÃµes (`1Âº PEL GTAR`, `2Âº PEL GTAR`) ou contagens de armas, garantindo os insumos do C06.

---

## 3. Invariantes do Motor AnalÃ­tico

As seguintes regras constituem os **Invariantes do Motor AnalÃ­tico** do SYNTHÃ‰ON e nunca podem ser violadas:

- **Isolamento de Infraestrutura:** O Motor AnalÃ­tico e seus plugins nunca acessam Google Apps Script (`SpreadsheetApp`, `HtmlService`, `Logger`, `Utilities`, `Session`).
- **Isolamento de I/O:** O Motor nÃ£o lÃª nem escreve diretamente em cÃ©lulas, ranges, abas ou planilhas.
- **Isolamento de UI/RenderizaÃ§Ã£o:** O Motor nÃ£o gera relatÃ³rios, grÃ¡ficos, modais ou menus visuais.
- **Arquitetura Aberta a Plugins:** Toda nova mÃ©trica ou regra de cÃ¡lculo deve ser implementada herdando de `IPluginMetrica`, sem alterar o core do `MotorAnaliticoV2`.
- **DeduplicaÃ§Ã£o por TÃºnel:** A pontuaÃ§Ã£o no mesmo tÃºnel (`MIKE|BOE`) Ã© deduplicada pelo valor MÃXIMO lido (`Math.max`), enquanto a contagem de ocorrÃªncias e BOEs ocorre apenas na primeira leitura do policial na ocorrÃªncia.
- **AcumulaÃ§Ã£o FÃ­sica de Fatos:** ApreensÃµes de armas, entorpecentes e prisÃµes acumulam fisicamente por linha para o militar.
- **PreservaÃ§Ã£o de Dados de LotaÃ§Ã£o:** O histÃ³rico de escalas e a sigla completa do pelotÃ£o/subunidade (`1Âº PEL GTAR`, `2Âº PEL GTAR`) devem ser propagados intactos para o `RegistroAnalitico`.
- **Comutatividade de PerÃ­odo:** A ordem de processamento das linhas dentro de uma mesma unidade de tempo nÃ£o altera os totais calculados.


## Extrato de MOD-C04-02_Pureza.md

# RelatÃƒÂ³rio de Pureza Arquitetural Ã¢â‚¬â€ CÃƒÂ´modo C04 Motor AnalÃƒÂ­tico (Task C04.1-02)

> **Status:** CONCLUÃƒÂDO / 100% PURO  
> **CÃƒÂ´modo:** C04 Motor AnalÃƒÂ­tico  
> **Data da Auditoria:** 29/07/2026  

---

## Ã°Å¸Å½Â¯ Objetivo da Auditoria

Confirmar que o **Motor AnalÃƒÂ­tico V2** e toda a sua famÃƒÂ­lia de plugins de mÃƒÂ©trica operam de forma 100% pura, sem qualquer dependÃƒÂªncia ou acoplamento a APIs do Google Apps Script (GAS), serviÃƒÂ§os de planilhas (`SpreadsheetApp`), renderizaÃƒÂ§ÃƒÂ£o HTML (`HtmlService`), manipuladores de UI ou bibliotecas de I/O.

---

## Ã°Å¸â€Â Escopo Auditado

Foram auditados individualmente todos os 9 arquivos que compÃƒÂµem o cÃƒÂ´modo C04:

1. `Motor/MotorAnaliticoV2.js` (Core do motor e orquestrador)
2. `Plugins/IPluginMetrica.js` (Interface/Contrato de plugin)
3. `Plugins/Metricas/PluginArmas.js` (Plugin de armas)
4. `Plugins/Metricas/PluginEntorpecentes.js` (Plugin de entorpecentes)
5. `Plugins/Metricas/PluginOcorrencias.js` (Plugin de ocorrÃƒÂªncias)
6. `Plugins/Metricas/PluginPontuacao.js` (Plugin de pontuaÃƒÂ§ÃƒÂ£o)
7. `Plugins/Metricas/PluginPrisoes.js` (Plugin de prisÃƒÂµes/detenÃƒÂ§ÃƒÂµes)
8. `Core/Metricas.js` (Consolidador de mÃƒÂ©tricas legado)
9. `Core/Ranking.js` (Classificador e ordenador)

---

## Ã°Å¸â€œâ€¹ Matriz de VerificaÃƒÂ§ÃƒÂ£o por Arquivo

| Arquivo Auditado | `SpreadsheetApp` | `HtmlService` | `Logger` | `Utilities` | `Session` | `Browser` | UI / Menu | Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| `Motor/MotorAnaliticoV2.js` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **100% PURO** |
| `Plugins/IPluginMetrica.js` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **100% PURO** |
| `Plugins/Metricas/PluginArmas.js` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **100% PURO** |
| `Plugins/Metricas/PluginEntorpecentes.js` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **100% PURO** |
| `Plugins/Metricas/PluginOcorrencias.js` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **100% PURO** |
| `Plugins/Metricas/PluginPontuacao.js` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **100% PURO** |
| `Plugins/Metricas/PluginPrisoes.js` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **100% PURO** |
| `Core/Metricas.js` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **100% PURO** |
| `Core/Ranking.js` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **100% PURO** |

---

## Ã°Å¸Å¸Â¢ Veredito de Pureza

O cÃƒÂ´modo **C04 Motor AnalÃƒÂ­tico** ÃƒÂ© **100% PURO**.

- **ExecuÃƒÂ§ÃƒÂ£o Universal:** Pode ser executado em ambiente Node.js, em testes offline automatizados, em backend serverless (Firebase Cloud Functions / AWS Lambda) ou em navegadores sem necessidade de APIs do Google Apps Script.
- **TransparÃƒÂªncia de Fatos:** Os plugins recebem os fatos canÃƒÂ´nicos vindos do C03 e acumulam valores numÃƒÂ©ricos em estruturas de dados puras (`Map`, `Set`, `Object`).
- **Sem Perda de Dados Visuais:** O Motor transmite integralmente os dados de agrupamento (`pelotao`) e contagem de armas para o `RegistroAnalitico`, preservando os requisitos de `02_Comodos/02_SPECS/REGRA_TRANSVERSAL_FORMATACAO_RELATORIOS.md`.


