# Sprint M02 — Leitura & Adaptadores

> **Status:** VERIFICADO OFFLINE - Sprint 1  
> **Ambiente:** Bancada Offline (`refactor/down-plant-gs-offline`)  
> **Cômodo Alvo:** M02 Leitura  
> **Data de Conclusão:** 29/07/2026  

---

## 🎯 Objetivos da Sprint

1. Mapear e higienizar todos os leitores e adaptadores de dados das abas mensais (`JAN2026` a `DEZ2026`), `EFETIVO`, `PECÚLIO` e `PIP`.
2. Encapsular o parsing de matrizes brutas do Google Sheets em objetos/estruturas previsíveis para os módulos de Domínio e Motor Analítico.
3. Centralizar e parametrizar a obtenção da planilha ativa / IDs de planilha em `Core/Config.js` (eliminando `SS_ID` hardcoded dispersos).
4. Garantir leitura defensiva universal via `Core/Cabecalhos.js` tolerando acentuações e apelidos de cabeçalho (`MATRICULA` vs `MATRÍCULA`, `OCORRÊNCIA PIP`, `PELOTÃO`, etc.).

---

## 📦 Entregáveis Concluídos

- **`planta/M02_LEITURA_INVENTARIO.md`**: Inventário completo de 11 leitores/adaptadores mapeados com escopo e matriz de risco.
- **`Core/Config.js`**: Centralização de `OCORRENCIAS_ID`, `PECULIO_ID`, aliases da aba `EFETIVO` e catálogo de meses 2026.
- **`Core/Cabecalhos.js`**: Mecanismo padronizado de normalização, indexação e busca de colunas por aliases.
- **`Leitura/Adaptador2026.js` & `Core/LeitorPlanilhas.js`**: Conectados ao `SyntheonCabecalhos.encontrar`.
- **`Compilador_Armas.js` & `Compilador de Entorpecentes.js`**: Remoção de `indexOf`/`findIndex` ad-hoc em favor do motor central.
- **`Testes/TestAdaptador2026.js`**: Cobertura expandida para 25 testes automatizados 100% aprovados.

---

## 🟢 Critérios de Aceite Atendidos

- [x] Todos os leitores do cômodo M02 utilizam o mecanismo central de resolução de cabeçalhos.
- [x] Variações conhecidas de nomes de colunas nos cabeçalhos são tratadas de forma transparente.
- [x] Nenhum leitor de dados altera o conteúdo das planilhas.
- [x] IDs de planilha e aliases centrais estão unificados em `Core/Config.js`.
- [x] Suíte de testes automatizados expandida de 22 para 25 testes com 100% de sucesso.

---

## 🔗 Portas de Comunicação do M02

- **M01 Entrada → M02 Leitura**: Requisição de validação de duplicidade e consulta de linhas existentes.
- **M02 Leitura → M03 Domínio**: Conversão de matrizes brutas lidas em entidades (`RegistroAnalitico`, `Policial`, `Ocorrencia`).
- **M02 Leitura → M04 Motor**: Alimentação do Motor Analítico V2 para cálculo de produtividade acumulada.
