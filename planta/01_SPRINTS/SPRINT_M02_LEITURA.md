# Sprint M02 — Leitura & Adaptadores

> **Status:** PLANEJADA (PRONTA PARA EXECUÇÃO)  
> **Ambiente:** Bancada Offline (`refactor/down-plant-gs-offline`)  
> **Cômodo Alvo:** M02 Leitura  

---

## 🎯 Objetivos da Sprint

1. Mapear e higienizar todos os leitores e adaptadores de dados das abas mensais (`JAN2026` a `DEZ2026`), `EFETIVO`, `PECÚLIO` e `PIP`.
2. Encapsular o parsing de matrizes brutas do Google Sheets em objetos/estruturas previsíveis para os módulos de Domínio e Motor Analítico.
3. Centralizar e parametrizar a obtenção da planilha ativa / IDs de planilha (eliminando `SS_ID` hardcoded dispersos).
4. Garantir leitura defensiva que tolere variações de caixa de texto nos cabeçalhos (ex: `QDT ARMAS` vs `QTD ARMAS`).

---

## 📦 Entregáveis Planejados

- **`Leitura/Adaptador2026.js`**: Revisor e adaptador padrão para as abas mensais do ano de 2026.
- **`Core/LeitorPlanilhas.js`**: Leitor infraestrutural com métodos genéricos de varredura e obtenção de ranges.
- **Parametrização de Configuração**: Migração do `SS_ID` disperso em `EntradaManual.js` e leitores para o módulo central.

---

## 🟢 Critérios de Aceite da Sprint

- [ ] Todos os arquivos do cômodo M02 Leitura utilizam a mesma interface para ler abas mensais.
- [ ] Variações conhecidas de nomes de colunas nos cabeçalhos são tratadas de forma transparente sem estourar exceções.
- [ ] Nenhum leitor de dados altera o conteúdo das planilhas.
- [ ] Zero dependência de IDs fixos hardcoded espalhados por funções individuais.

---

## 🔗 Portas de Comunicação do M02

- **M01 Entrada → M02 Leitura**: Requisição de validação de duplicidade e consulta de linhas existentes.
- **M02 Leitura → M03 Domínio**: Conversão de matrizes brutas lidas em entidades (`RegistroAnalitico`, `Policial`, `Ocorrencia`).
- **M02 Leitura → M04 Motor**: Alimentação do Motor Analítico V2 para cálculo de produtividade acumulada.
