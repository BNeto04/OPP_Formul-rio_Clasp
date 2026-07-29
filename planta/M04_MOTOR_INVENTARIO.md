# Inventário Geral do Motor Analítico & Plugins (Task M04.1-01)

> **Status:** CONCLUÍDO  
> **Cômodo:** M04 Motor Analítico  
> **Data de Mapeamento:** 29/07/2026  

---

## 📊 Tabela Geral do Inventário do Motor

| Componente / Módulo | Arquivo | Responsabilidade | Dependências | Entradas | Saídas / Destino | Status / Pureza | Testes Existentes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `MotorAnaliticoV2` | `Motor/MotorAnaliticoV2.js` | Orquestrar o ciclo de vida dos plugins (`inicializar`, `processar`, `finalizar`) e consolidar o `RegistroAnalitico` | `IPluginMetrica`, `RegistroAnalitico` | Lista de `RegistroCanonico` | Vetor de `RegistroAnalitico` | **PURO** | `TestPlugins.js`, `TestCentralAnalitica.js` |
| `IPluginMetrica` | `Plugins/IPluginMetrica.js` | Interface/Classe Abstrata de contrato para plugins de métrica | Nenhuma | Nenhuma | Definição de métodos do ciclo de vida | **PURO** | `TestPlugins.js` |
| `PluginArmas` | `Plugins/Metricas/PluginArmas.js` | Contabilizar armas físicas apreendidas e ocorrências com armas | `IPluginMetrica` | `RegistroCanonico`, Policial Fato | `fatos.armas`, `fatos.ocorrenciasComArma` | **PURO** | `TestPlugins.js` |
| `PluginEntorpecentes` | `Plugins/Metricas/PluginEntorpecentes.js` | Contabilizar drogas (maconha, cocaína, crack) e calcular gramatura total | `IPluginMetrica` | `RegistroCanonico`, Policial Fato | `fatos.maconha`, `fatos.cocaina`, `fatos.crack`, `fatos.drogasTotal` | **PURO** | `TestPlugins.js` |
| `PluginOcorrencias` | `Plugins/Metricas/PluginOcorrencias.js` | Contabilizar ocorrências únicas e contagem de BOE deduplicados por túnel | `IPluginMetrica` | `RegistroCanonico`, Policial Fato | `fatos.ocorrencias`, `fatos.qtdBoe` | **PURO** | `TestPlugins.js` |
| `PluginPontuacao` | `Plugins/Metricas/PluginPontuacao.js` | Calcular a pontuação rateada (PIP e CPM) deduplicada pelo MÁXIMO da ocorrência | `IPluginMetrica` | `RegistroCanonico`, Policial Fato | `indicadores.pontosPIP`, `indicadores.pontosCPM` | **PURO** | `TestPlugins.js` |
| `PluginPrisoes` | `Plugins/Metricas/PluginPrisoes.js` | Acumular detenções, APFD, TCO e BOC por militar | `IPluginMetrica` | `RegistroCanonico`, Policial Fato | `fatos.detidos`, `fatos.apfd`, `fatos.tco`, `fatos.boc` | **PURO** | `TestPlugins.js` |
| `SyntheonRanking` | `Core/Ranking.js` | Classificar e ranquear a produtividade consolidada segundo vetores de critérios | Nenhuma | Objeto de produtividade, critérios | Lista ordenada com o atributo `rank` | **PURO** | `TestCentralAnalitica.js` |
| `SyntheonMetricas` | `Core/Metricas.js` | Consolidador de compatibilidade V1 para a API legado do SYNTHÉON | `RegistroAnalitico` | Lista de ocorrências canônicas | Mapa de produtividade | **PURO** | `TestCentralAnalitica.js` |

---

## 🛑 Preservação Transversal de Dados Visuais (M06)

Foi verificado que o Motor Analítico V2 e seus plugins não truncam nem alteram as informações de grupo do policial (`pelotao`, ex: `1º PEL GTAR`) ou o detalhamento numérico de armas. O `MotorAnaliticoV2` rastreia o histórico de escalas e propaga o pelotão do policial intacto para o `RegistroAnalitico`, assegurando que o M06 Relatórios possua todas as informações necessárias para aplicar a formatação condicional de cores e tabelas operacionais.

---

## 🟢 Avaliação Inicial de Arquitetura & Pureza
- **Zero acoplamento a I/O e GAS:** Nenhum arquivo em `Motor/`, `Plugins/` ou `Core/` (relacionado ao Motor) invoca `SpreadsheetApp` ou APIs de planilha.
- **Orquestração Desacoplada:** O pipeline de plugins permite adicionar ou alterar regras de métricas sem tocar no core do motor.
- **Testabilidade Total:** Toda a família do Motor V2 executa diretamente no Node.js via `Testes/TestPlugins.js` e `Testes/TestCentralAnalitica.js`.
- **Relatório Completo de Pureza:** Ver [planta/M04_MOTOR_PUREZA.md](file:///C:/Users/Bneto04/Documents/Codex/syntheon-gs-downplant-offline/planta/M04_MOTOR_PUREZA.md).
