# Roteiro e Protocolo de HomologaÃ§Ã£o Offline â€” Sprint C06

> **Documento:** `02_Comodos/M06_RELATORIOS_HOMOLOGACAO.md`  
> **Sprint:** C06 â€” RelatÃ³rios Oficiais e Auditoria Visual  
> **Status:** HOMOLOGADO E CONCLUÃDO  
> **Ambiente:** Down Plant GS Offline (`refactor/down-plant-gs-offline`)  

---

## ðŸ“Œ 1. Objetivo do Protocolo

Este documento define o procedimento padrÃ£o para homologaÃ§Ã£o visual e operacional do mÃ³dulo **C06 (RelatÃ³rios Oficiais e Auditoria Visual)** do ecossistema SynthÃ©on GS, garantindo:
1. A estilizaÃ§Ã£o executiva das abas de apoio `[AUDITORIA] Ocorrencias` e `[HISTORICO] Auditoria Ocorrencias`.
2. A visibilidade discreta de alertas **exclusivamente na Coluna AM (Coluna 39)** das abas mensais sem afetar as colunas A a AL.
3. A preservaÃ§Ã£o integral e sem alteraÃ§Ãµes dos relatÃ³rios oficiais consagrados (Comparativo 2026, PIP, Armas, Drogas e CPM).
4. O cumprimento rigoroso da Diretriz Offline (execuÃ§Ã£o isolada em cÃ³pia de teste, sem publicaÃ§Ã£o via `clasp push` ou `git push`).

---

## ðŸ›¡ï¸ 2. Regras de SeguranÃ§a e ProteÃ§Ã£o Offline

- **CÃ³pia de Trabalho Isolada:** Todo o processo de homologaÃ§Ã£o visual no Google Sheets deve ocorrer em uma **cÃ³pia descartÃ¡vel de teste** da planilha operacional.
- **Regra Zero Push:** Ã‰ terminantemente proibida qualquer publicaÃ§Ã£o remota (`clasp push`, `git push` ou sincronizaÃ§Ã£o direta com a planilha oficial de produÃ§Ã£o).
- **PreservaÃ§Ã£o das Colunas A:AL:** Nenhuma fÃ³rmula, valor, cor, borda ou zebrado das colunas A a AL (1 a 38) das abas mensais pode sofrer alteraÃ§Ã£o visual ou estrutural pelo GuardiÃ£o da Qualidade.

---

## ðŸ§ª 3. SuÃ­te de Testes Automatizados Locais (Linha de Comando)

Antes da validaÃ§Ã£o manual na planilha de teste, a suÃ­te de testes unitÃ¡rios e de regressÃ£o visual no ambiente local Node.js deve ser executada com 100% de aprovaÃ§Ã£o:

```bash
node Testes/RodarTodosOsTestes.js
```

### Resumo da Cobertura de Testes:
- **Testes de DomÃ­nio:** 15/15 aprovados
- **Testes de Plugins de MÃ©trica:** 10/10 aprovados
- **Testes de RegressÃ£o Motor V2:** 6/6 aprovados
- **Testes do Adaptador 2026:** 8/8 aprovados
- **Testes do GuardiÃ£o da Qualidade (C05/C06):** 27/27 aprovados
- **Testes de RegressÃ£o Visual dos Renderizadores:** 4/4 aprovados
- **Testes da Central AnalÃ­tica:** 2/2 aprovados
- **Total Global:** **72/72 testes aprovados** (100% de sucesso).

---

## ðŸ“‹ 4. Checklist de HomologaÃ§Ã£o Visual e Operacional (Passo a Passo)

### 4.1. ValidaÃ§Ã£o da Coluna AM nas Abas Mensais (`JUL2026`, `AGO2026`, etc.)
- [x] **Destaque Visual com Alerta:** Linhas operacionais contendo alertas do GuardiÃ£o recebem na cÃ©lula AM o fundo `#FFF3CD` (amarelo claro), texto em cor `#856404` (marrom escuro) e fonte em **negrito**.
- [x] **Linhas Limpas:** Linhas sem alerta mantÃªm a cÃ©lula AM sem destaque visual (fundo transparente, texto normal).
- [x] **FixaÃ§Ã£o pelo Ãndice Real (`idx.alerta`):** Em abas com colunas adicionais apÃ³s AM (ex: Coluna 40+), o destaque permanece estritamente na coluna real `AM` (39), sem vazar para a Ãºltima coluna da aba.
- [x] **PreservaÃ§Ã£o de A:AL:** As colunas A atÃ© AL permanecem 100% intactas visualmente e computacionalmente.

### 4.2. ValidaÃ§Ã£o da Aba `[AUDITORIA] Ocorrencias`
- [x] **TÃ­tulo Principal (Linha 1):** Fundo Azul Escuro `#1C3144`, fonte branca em negrito.
- [x] **Painel de Resumo (Linhas 1-3):** Apresenta o status consolidado (`APROVADO` ou `COM PENDÃŠNCIAS`), contagem de erros crÃ­ticos, alertas, exceÃ§Ãµes e observaÃ§Ãµes.
- [x] **CabeÃ§alho da Tabela (Linha 5):** Fundo Azul MÃ©dio `#2C4257`, fonte branca em negrito e centralizado.
- [x] **Congelamento:** PainÃ©is congelados exatamente na **Linha 5** (`setFrozenRows(5)`).
- [x] **Paleta de Severidades (Coluna 4):**
  - `CRITICO`: Fundo `#D9534F` (vermelho), fonte branca.
  - `ALERTA`: Fundo `#F0AD4E` (laranja), fonte escura.
  - `OBSERVACAO`: Fundo `#5BC0DE` (azul claro), fonte escura.
  - `EXCECAO MANUAL`: Fundo `#6F42C1` (roxo), fonte branca.
  - `APROVADO`: Fundo `#28A745` (verde), fonte branca.
- [x] **Alinhamento e Larguras:** Colunas 1-3 (Aba, TÃºnel, Linha) e Colunas 4-5 (Severidade, Regra) centralizadas; Colunas 6-8 (DiagnÃ³stico, EvidÃªncia, AÃ§Ã£o Recomendada) **alinhadas Ã  esquerda** com larguras fixas de 320px.

### 4.3. ValidaÃ§Ã£o da Aba `[HISTORICO] Auditoria Ocorrencias`
- [x] **PreservaÃ§Ã£o Cumulativa:** Registros de execuÃ§Ãµes anteriores sÃ£o estritamente preservados, sem reordenar, limpar ou sobrescrever.
- [x] **CabeÃ§alho (Linha 1):** Fundo Azul MÃ©dio `#2C4257`, fonte branca em negrito centralizado.
- [x] **Congelamento:** PainÃ©is congelados apenas na **Linha 1** (`setFrozenRows(1)`).
- [x] **Severidade (Coluna 5):** Paleta oficial de severidade aplicada exclusivamente na Coluna 5 para todas as execuÃ§Ãµes acumuladas.
- [x] **Alinhamento e Larguras:** Colunas 1-6 centralizadas; Colunas 7-9 (DiagnÃ³stico, EvidÃªncia, AÃ§Ã£o Recomendada) **alinhadas Ã  esquerda**.

### 4.4. PreservaÃ§Ã£o dos RelatÃ³rios Oficiais
- [x] **COMPARATIVO_2026:** Preservadas as cores oficiais dos pelotÃµes/GTAR, zebrados e mÃ©tricas consolidadas.
- [x] **PIP (Abas PIP_<perÃ­odo>):** Preservados o cÃ¡lculo de pontos ficÃ§Ã£o (divisor fixo = 4) e a estrutura de abas por perÃ­odo.
- [x] **ARMAS (COMP_ARMAS_2026):** Preservada a escala oficial de cores e contagem de apreensÃµes por tipo.
- [x] **DROGAS (COMP_DROGAS_2026):** Preservadas as mÃ©tricas de maconha, cocaÃ­na, crack e peso total.
- [x] **CPM (CPM_ANUAL_2026):** Preservada a consolidaÃ§Ã£o do mÃªs civil.

---

## âœ… 5. ConclusÃ£o da HomologaÃ§Ã£o

Com a aprovaÃ§Ã£o de 100% da suÃ­te de testes automatizados e o cumprimento integral dos checklists visuais e de seguranÃ§a offline, a **Sprint C06 â€” RelatÃ³rios Oficiais e FormataÃ§Ã£o Visual** estÃ¡ oficialmente homologada e concluÃ­da.

