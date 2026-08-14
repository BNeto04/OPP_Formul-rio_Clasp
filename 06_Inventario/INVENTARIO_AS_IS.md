# Inventário AS-IS

Inventário dos scripts e classificação de cada arquivo. (Anteriormente em C02_LEITURA_INVENTARIO, C03_DOMINIO_INVENTARIO, etc.)


﻿# Baseline: Auditoria Factual Down Plant

Este documento atua como o inventÃ¡rio de inicializaÃ§Ã£o (Fase 0) exigido para a aplicaÃ§Ã£o da metodologia Down Plant / CronosEdu no projeto em curso. Nenhum arquivo de cÃ³digo foi alterado na formulaÃ§Ã£o deste baseline.

## 1. Caminhos Reais e LocalizaÃ§Ã£o
- **DiretÃ³rio do Projeto:** `C:\Users\Bneto04\Documents\Codex\syntheon-gs-downplant-offline`
- **RepositÃ³rio CronosEdu:** NÃ£o localizado em `Documents\Codex` (conforme premissa).

## 2. Git
- **Branch Ativa:** `refactor/down-plant-gs-offline`
- **Ãšltimo Commit:** `1f91661ed8a7c2c087de33dc26a7749c0a144754` ("fix(gxt): remove bloco de fallback residual (linhas 245-278) em DiagnosticoDeterministicoGxt.js")
- **Estado da Ãrvore Git:**
  - **Modificados:** `Dominio/RegistroCanonico.js`, `Testes/TestRelatorioGxt.js`
  - **Untracked (NÃ£o Rasteados):** `scripts/build-gxt.js`

## 3. Ambientes Conhecidos e IntegraÃ§Ãµes Externas
Com base na varredura factual, as integraÃ§Ãµes e ambientes identificados sÃ£o:
- **Google Apps Script (GAS):** Comprovado pela existÃªncia de `appsscript.json`, `.clasp.json`, e `.claspignore`.
- **Google Sheets:** Principal fonte de dados e UI do projeto, evidenciado por `Drivers/GoogleSheetsDriver.js`, `Core/LeitorPlanilhas.js`, `Leitura/Adaptador2026.js`, e os relatÃ³rios (GXT, Comparativo, etc.).
- **Planilhas PecÃºlio/MatrÃ­culas:** Comprovado pela existÃªncia de `LeitorAntiguidadePeculio.js`.
- **HTML Dialogs (UI Apps Script):** `Entrada/*.html` (ex: `Formulario.html`, `DialogGxtSelecaoLivre.html`).

## 4. Estruturas Existentes

### 4.1. DocumentaÃ§Ã£o (Plantas e Notas)
NÃ£o hÃ¡ um diretÃ³rio `.obsidian` que configure o projeto atualmente como um Vault, mas existe abundante documentaÃ§Ã£o em Markdown que jÃ¡ atua como uma planta inicial:
- `README.md`
- `REGRAS_DE_NEGOCIO.md`
- `OFFLINE_DOWN_PLANT.md`
- **DiretÃ³rio `02_Comodos/`**: ContÃ©m pastas (`01_SPRINTS`, `02_SPECS`, `03_TASKS`, `04_PROTOCOLS`) e mapeamentos de features (`C01_ENTRADA.md`, `C02_LEITURA_INVENTARIO.md`, `C03_DOMINIO_INVENTARIO.md`, `C04_MOTOR_INVENTARIO.md`, `C05_GUARDIAO_HOMOLOGACAO.md`, `C06.3_DIAGNOSTICO_GXT_2T.md`, etc.).

### 4.2. Testes Existentes
O diretÃ³rio `Testes/` contÃ©m 17 arquivos ativos (acionados por `node Testes/RodarTodosOsTestes.js` definido no `package.json`). Principais suÃ­tes incluem:
- `TestAdaptador2026.js`
- `TestDominio.js`
- `TestGuardiao.js`
- `TestMotorAnaliticoRegressao.js`
- `TestRelatorioGxt.js`
- `TestRelatorioArmas.js`
- `TestRelatorioDrogas.js`
- etc.

## 5. Lacunas Encontradas
1. **AusÃªncia de Vault Obsidian Oficial:** O projeto possui pastas e arquivos markdown organizados (em `02_Comodos/`), mas falta a configuraÃ§Ã£o `.obsidian` que torna o repositÃ³rio um Vault completo, bem como as estruturas baseadas nas camadas Mestra, DDD, UI, etc.
2. **DependÃªncias de Build NÃ£o Commitadas:** Arquivos como `scripts/build-gxt.js` estÃ£o untracked, e os testes recentes e ajustes em domÃ­nio ainda constam como modificaÃ§Ãµes nÃ£o-commitadas no Git.
3. **AusÃªncia de Canvas e Transversalidade:** Arquivos descritivos exigidos nas Fases subsequentes (como `TERRENO_DO_PROJETO.md` e `PLANTA_MESTRA.canvas`) ainda nÃ£o existem.

