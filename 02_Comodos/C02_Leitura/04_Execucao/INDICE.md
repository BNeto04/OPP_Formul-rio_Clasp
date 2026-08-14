# Mapeamento de Tarefas â€” CÃ´modo C02 Leitura

> **Status Geral do CÃ´modo:** VERIFICADO OFFLINE - Sprint 1 (TODAS AS TAREFAS CONCLUÃDAS)  

---

## SPRINT C02.1 â€” Mapeamento & Encapsulamento dos Adaptadores de Leitura

| ID | Tarefa | Arquivo(s) Afetado(s) | Status | Commit |
| :--- | :--- | :--- | :--- | :--- |
| `TASK-C02.1-01` | Inventariar e analisar funÃ§Ãµes de leitura | `02_Comodos/C02_LEITURA_INVENTARIO.md` | **CONCLUÃDA** | `e171759` |
| `TASK-C02.1-02` | Centralizar IDs de planilha, aliases da aba EFETIVO e meses 2026 | `Core/Config.js`, `Entrada/EntradaManual.js`, `Compilador PIP.js` | **CONCLUÃDA** | `1c1de6f` |
| `TASK-C02.1-03` | Substituir leituras ad-hoc por `indexOf`/`findIndex` nos leitores pelo `SyntheonCabecalhos` | `Compilador_Armas.js`, `Compilador de Entorpecentes.js` | **CONCLUÃDA** | `322404c` |
| `TASK-C02.1-04` | Padronizar busca flexÃ­vel de colunas por apelidos/aliases de cabeÃ§alho com mÃ³dulo `Core/Cabecalhos.js` | `Core/Cabecalhos.js`, `Leitura/Adaptador2026.js`, `Core/LeitorPlanilhas.js` | **CONCLUÃDA** | `4de23b2` |
| `TASK-C02.1-05` | Criar testes unitÃ¡rios/offline para os adaptadores de leitura | `Testes/TestAdaptador2026.js` | **CONCLUÃDA** | `9faa0bd` |


## Extrato de MOD-C02-01_Sprint.md

# Sprint C02 Ã¢â‚¬â€ Leitura & Adaptadores

> **Status:** VERIFICADO OFFLINE - Sprint 1  
> **Ambiente:** Bancada Offline (`refactor/down-plant-gs-offline`)  
> **CÃƒÂ´modo Alvo:** C02 Leitura  
> **Data de ConclusÃƒÂ£o:** 29/07/2026  

---

## Ã°Å¸Å½Â¯ Objetivos da Sprint

1. Mapear e higienizar todos os leitores e adaptadores de dados das abas mensais (`JAN2026` a `DEZ2026`), `EFETIVO`, `PECÃƒÅ¡LIO` e `PIP`.
2. Encapsular o parsing de matrizes brutas do Google Sheets em objetos/estruturas previsÃƒÂ­veis para os mÃƒÂ³dulos de DomÃƒÂ­nio e Motor AnalÃƒÂ­tico.
3. Centralizar e parametrizar a obtenÃƒÂ§ÃƒÂ£o da planilha ativa / IDs de planilha em `Core/Config.js` (eliminando `SS_ID` hardcoded dispersos).
4. Garantir leitura defensiva universal via `Core/Cabecalhos.js` tolerando acentuaÃƒÂ§ÃƒÂµes e apelidos de cabeÃƒÂ§alho (`MATRICULA` vs `MATRÃƒÂCULA`, `OCORRÃƒÅ NCIA PIP`, `PELOTÃƒÆ’O`, etc.).

---

## Ã°Å¸â€œÂ¦ EntregÃƒÂ¡veis ConcluÃƒÂ­dos

- **`02_Comodos/C02_LEITURA_INVENTARIO.md`**: InventÃƒÂ¡rio completo de 11 leitores/adaptadores mapeados com escopo e matriz de risco.
- **`Core/Config.js`**: CentralizaÃƒÂ§ÃƒÂ£o de `OCORRENCIAS_ID`, `PECULIO_ID`, aliases da aba `EFETIVO` e catÃƒÂ¡logo de meses 2026.
- **`Core/Cabecalhos.js`**: Mecanismo padronizado de normalizaÃƒÂ§ÃƒÂ£o, indexaÃƒÂ§ÃƒÂ£o e busca de colunas por aliases.
- **`Leitura/Adaptador2026.js` & `Core/LeitorPlanilhas.js`**: Conectados ao `SyntheonCabecalhos.encontrar`.
- **`Compilador_Armas.js` & `Compilador de Entorpecentes.js`**: RemoÃƒÂ§ÃƒÂ£o de `indexOf`/`findIndex` ad-hoc em favor do motor central.
- **`Testes/TestAdaptador2026.js`**: Cobertura expandida para 25 testes automatizados 100% aprovados.

---

## Ã°Å¸Å¸Â¢ CritÃƒÂ©rios de Aceite Atendidos

- [x] Todos os leitores do cÃƒÂ´modo C02 utilizam o mecanismo central de resoluÃƒÂ§ÃƒÂ£o de cabeÃƒÂ§alhos.
- [x] VariaÃƒÂ§ÃƒÂµes conhecidas de nomes de colunas nos cabeÃƒÂ§alhos sÃƒÂ£o tratadas de forma transparente.
- [x] Nenhum leitor de dados altera o conteÃƒÂºdo das planilhas.
- [x] IDs de planilha e aliases centrais estÃƒÂ£o unificados em `Core/Config.js`.
- [x] SuÃƒÂ­te de testes automatizados expandida de 22 para 25 testes com 100% de sucesso.

---

## Ã°Å¸â€â€” Portas de ComunicaÃƒÂ§ÃƒÂ£o do C02

- **C01 Entrada Ã¢â€ â€™ C02 Leitura**: RequisiÃƒÂ§ÃƒÂ£o de validaÃƒÂ§ÃƒÂ£o de duplicidade e consulta de linhas existentes.
- **C02 Leitura Ã¢â€ â€™ C03 DomÃƒÂ­nio**: ConversÃƒÂ£o de matrizes brutas lidas em entidades (`RegistroAnalitico`, `Policial`, `Ocorrencia`).
- **C02 Leitura Ã¢â€ â€™ C04 Motor**: AlimentaÃƒÂ§ÃƒÂ£o do Motor AnalÃƒÂ­tico V2 para cÃƒÂ¡lculo de produtividade acumulada.


