# Roteiro e Protocolo de Homologação Offline — Sprint M06

> **Documento:** `planta/M06_RELATORIOS_HOMOLOGACAO.md`  
> **Sprint:** M06 — Relatórios Oficiais e Auditoria Visual  
> **Status:** HOMOLOGADO E CONCLUÍDO  
> **Ambiente:** Down Plant GS Offline (`refactor/down-plant-gs-offline`)  

---

## 📌 1. Objetivo do Protocolo

Este documento define o procedimento padrão para homologação visual e operacional do módulo **M06 (Relatórios Oficiais e Auditoria Visual)** do ecossistema Synthéon GS, garantindo:
1. A estilização executiva das abas de apoio `[AUDITORIA] Ocorrencias` e `[HISTORICO] Auditoria Ocorrencias`.
2. A visibilidade discreta de alertas **exclusivamente na Coluna AM (Coluna 39)** das abas mensais sem afetar as colunas A a AL.
3. A preservação integral e sem alterações dos relatórios oficiais consagrados (Comparativo 2026, PIP, Armas, Drogas e CPM).
4. O cumprimento rigoroso da Diretriz Offline (execução isolada em cópia de teste, sem publicação via `clasp push` ou `git push`).

---

## 🛡️ 2. Regras de Segurança e Proteção Offline

- **Cópia de Trabalho Isolada:** Todo o processo de homologação visual no Google Sheets deve ocorrer em uma **cópia descartável de teste** da planilha operacional.
- **Regra Zero Push:** É terminantemente proibida qualquer publicação remota (`clasp push`, `git push` ou sincronização direta com a planilha oficial de produção).
- **Preservação das Colunas A:AL:** Nenhuma fórmula, valor, cor, borda ou zebrado das colunas A a AL (1 a 38) das abas mensais pode sofrer alteração visual ou estrutural pelo Guardião da Qualidade.

---

## 🧪 3. Suíte de Testes Automatizados Locais (Linha de Comando)

Antes da validação manual na planilha de teste, a suíte de testes unitários e de regressão visual no ambiente local Node.js deve ser executada com 100% de aprovação:

```bash
node Testes/RodarTodosOsTestes.js
```

### Resumo da Cobertura de Testes:
- **Testes de Domínio:** 15/15 aprovados
- **Testes de Plugins de Métrica:** 10/10 aprovados
- **Testes de Regressão Motor V2:** 6/6 aprovados
- **Testes do Adaptador 2026:** 8/8 aprovados
- **Testes do Guardião da Qualidade (M05/M06):** 27/27 aprovados
- **Testes de Regressão Visual dos Renderizadores:** 4/4 aprovados
- **Testes da Central Analítica:** 2/2 aprovados
- **Total Global:** **72/72 testes aprovados** (100% de sucesso).

---

## 📋 4. Checklist de Homologação Visual e Operacional (Passo a Passo)

### 4.1. Validação da Coluna AM nas Abas Mensais (`JUL2026`, `AGO2026`, etc.)
- [x] **Destaque Visual com Alerta:** Linhas operacionais contendo alertas do Guardião recebem na célula AM o fundo `#FFF3CD` (amarelo claro), texto em cor `#856404` (marrom escuro) e fonte em **negrito**.
- [x] **Linhas Limpas:** Linhas sem alerta mantêm a célula AM sem destaque visual (fundo transparente, texto normal).
- [x] **Fixação pelo Índice Real (`idx.alerta`):** Em abas com colunas adicionais após AM (ex: Coluna 40+), o destaque permanece estritamente na coluna real `AM` (39), sem vazar para a última coluna da aba.
- [x] **Preservação de A:AL:** As colunas A até AL permanecem 100% intactas visualmente e computacionalmente.

### 4.2. Validação da Aba `[AUDITORIA] Ocorrencias`
- [x] **Título Principal (Linha 1):** Fundo Azul Escuro `#1C3144`, fonte branca em negrito.
- [x] **Painel de Resumo (Linhas 1-3):** Apresenta o status consolidado (`APROVADO` ou `COM PENDÊNCIAS`), contagem de erros críticos, alertas, exceções e observações.
- [x] **Cabeçalho da Tabela (Linha 5):** Fundo Azul Médio `#2C4257`, fonte branca em negrito e centralizado.
- [x] **Congelamento:** Painéis congelados exatamente na **Linha 5** (`setFrozenRows(5)`).
- [x] **Paleta de Severidades (Coluna 4):**
  - `CRITICO`: Fundo `#D9534F` (vermelho), fonte branca.
  - `ALERTA`: Fundo `#F0AD4E` (laranja), fonte escura.
  - `OBSERVACAO`: Fundo `#5BC0DE` (azul claro), fonte escura.
  - `EXCECAO MANUAL`: Fundo `#6F42C1` (roxo), fonte branca.
  - `APROVADO`: Fundo `#28A745` (verde), fonte branca.
- [x] **Alinhamento e Larguras:** Colunas 1-3 (Aba, Túnel, Linha) e Colunas 4-5 (Severidade, Regra) centralizadas; Colunas 6-8 (Diagnóstico, Evidência, Ação Recomendada) **alinhadas à esquerda** com larguras fixas de 320px.

### 4.3. Validação da Aba `[HISTORICO] Auditoria Ocorrencias`
- [x] **Preservação Cumulativa:** Registros de execuções anteriores são estritamente preservados, sem reordenar, limpar ou sobrescrever.
- [x] **Cabeçalho (Linha 1):** Fundo Azul Médio `#2C4257`, fonte branca em negrito centralizado.
- [x] **Congelamento:** Painéis congelados apenas na **Linha 1** (`setFrozenRows(1)`).
- [x] **Severidade (Coluna 5):** Paleta oficial de severidade aplicada exclusivamente na Coluna 5 para todas as execuções acumuladas.
- [x] **Alinhamento e Larguras:** Colunas 1-6 centralizadas; Colunas 7-9 (Diagnóstico, Evidência, Ação Recomendada) **alinhadas à esquerda**.

### 4.4. Preservação dos Relatórios Oficiais
- [x] **COMPARATIVO_2026:** Preservadas as cores oficiais dos pelotões/GTAR, zebrados e métricas consolidadas.
- [x] **PIP (Abas PIP_<período>):** Preservados o cálculo de pontos ficção (divisor fixo = 4) e a estrutura de abas por período.
- [x] **ARMAS (COMP_ARMAS_2026):** Preservada a escala oficial de cores e contagem de apreensões por tipo.
- [x] **DROGAS (COMP_DROGAS_2026):** Preservadas as métricas de maconha, cocaína, crack e peso total.
- [x] **CPM (CPM_ANUAL_2026):** Preservada a consolidação do mês civil.

---

## ✅ 5. Conclusão da Homologação

Com a aprovação de 100% da suíte de testes automatizados e o cumprimento integral dos checklists visuais e de segurança offline, a **Sprint M06 — Relatórios Oficiais e Formatação Visual** está oficialmente homologada e concluída.
