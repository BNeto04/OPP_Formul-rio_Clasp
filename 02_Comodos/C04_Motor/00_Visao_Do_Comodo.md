# InventÃ¡rio Geral do Motor AnalÃ­tico & Plugins (Task C04.1-01)

> **Status:** CONCLUÃDO  
> **CÃ´modo:** C04 Motor AnalÃ­tico  
> **Data de Mapeamento:** 29/07/2026  

---

## ðŸ“Š Tabela Geral do InventÃ¡rio do Motor

| Componente / MÃ³dulo | Arquivo | Responsabilidade | DependÃªncias | Entradas | SaÃ­das / Destino | Status / Pureza | Testes Existentes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `MotorAnaliticoV2` | `Motor/MotorAnaliticoV2.js` | Orquestrar o ciclo de vida dos plugins (`inicializar`, `processar`, `finalizar`) e consolidar o `RegistroAnalitico` | `IPluginMetrica`, `RegistroAnalitico` | Lista de `RegistroCanonico` | Vetor de `RegistroAnalitico` | **PURO** | `TestPlugins.js`, `TestCentralAnalitica.js` |
| `IPluginMetrica` | `Plugins/IPluginMetrica.js` | Interface/Classe Abstrata de contrato para plugins de mÃ©trica | Nenhuma | Nenhuma | DefiniÃ§Ã£o de mÃ©todos do ciclo de vida | **PURO** | `TestPlugins.js` |
| `PluginArmas` | `Plugins/Metricas/PluginArmas.js` | Contabilizar armas fÃ­sicas apreendidas e ocorrÃªncias com armas | `IPluginMetrica` | `RegistroCanonico`, Policial Fato | `fatos.armas`, `fatos.ocorrenciasComArma` | **PURO** | `TestPlugins.js` |
| `PluginEntorpecentes` | `Plugins/Metricas/PluginEntorpecentes.js` | Contabilizar drogas (maconha, cocaÃ­na, crack) e calcular gramatura total | `IPluginMetrica` | `RegistroCanonico`, Policial Fato | `fatos.maconha`, `fatos.cocaina`, `fatos.crack`, `fatos.drogasTotal` | **PURO** | `TestPlugins.js` |
| `PluginOcorrencias` | `Plugins/Metricas/PluginOcorrencias.js` | Contabilizar ocorrÃªncias Ãºnicas e contagem de BOE deduplicados por tÃºnel | `IPluginMetrica` | `RegistroCanonico`, Policial Fato | `fatos.ocorrencias`, `fatos.qtdBoe` | **PURO** | `TestPlugins.js` |
| `PluginPontuacao` | `Plugins/Metricas/PluginPontuacao.js` | Calcular a pontuaÃ§Ã£o rateada (PIP e CPM) deduplicada pelo MÃXIMO da ocorrÃªncia | `IPluginMetrica` | `RegistroCanonico`, Policial Fato | `indicadores.pontosPIP`, `indicadores.pontosCPM` | **PURO** | `TestPlugins.js` |
| `PluginPrisoes` | `Plugins/Metricas/PluginPrisoes.js` | Acumular detenÃ§Ãµes, APFD, TCO e BOC por militar | `IPluginMetrica` | `RegistroCanonico`, Policial Fato | `fatos.detidos`, `fatos.apfd`, `fatos.tco`, `fatos.boc` | **PURO** | `TestPlugins.js` |
| `SyntheonRanking` | `Core/Ranking.js` | Classificar e ranquear a produtividade consolidada segundo vetores de critÃ©rios | Nenhuma | Objeto de produtividade, critÃ©rios | Lista ordenada com o atributo `rank` | **PURO** | `TestCentralAnalitica.js` |
| `SyntheonMetricas` | `Core/Metricas.js` | Consolidador de compatibilidade V1 para a API legado do SYNTHÃ‰ON | `RegistroAnalitico` | Lista de ocorrÃªncias canÃ´nicas | Mapa de produtividade | **PURO** | `TestCentralAnalitica.js` |

---

## ðŸ›‘ PreservaÃ§Ã£o Transversal de Dados Visuais (C06)

Foi verificado que o Motor AnalÃ­tico V2 e seus plugins nÃ£o truncam nem alteram as informaÃ§Ãµes de grupo do policial (`pelotao`, ex: `1Âº PEL GTAR`) ou o detalhamento numÃ©rico de armas. O `MotorAnaliticoV2` rastreia o histÃ³rico de escalas e propaga o pelotÃ£o do policial intacto para o `RegistroAnalitico`, assegurando que o C06 RelatÃ³rios possua todas as informaÃ§Ãµes necessÃ¡rias para aplicar a formataÃ§Ã£o condicional de cores e tabelas operacionais.

---

## ðŸŸ¢ AvaliaÃ§Ã£o Inicial de Arquitetura & Pureza
- **Zero acoplamento a I/O e GAS:** Nenhum arquivo em `Motor/`, `Plugins/` ou `Core/` (relacionado ao Motor) invoca `SpreadsheetApp` ou APIs de planilha.
- **OrquestraÃ§Ã£o Desacoplada:** O pipeline de plugins permite adicionar ou alterar regras de mÃ©tricas sem tocar no core do motor.
- **Testabilidade Total:** Toda a famÃ­lia do Motor V2 executa diretamente no Node.js via `Testes/TestPlugins.js` e `Testes/TestCentralAnalitica.js`.
- **RelatÃ³rio Completo de Pureza:** Ver 02_Comodos/M04_MOTOR_PUREZA.md.


