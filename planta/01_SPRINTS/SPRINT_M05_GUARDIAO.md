# Sprint M05 — Guardião da Qualidade Operacional

> **Documento:** `planta/01_SPRINTS/SPRINT_M05_GUARDIAO.md`  
> **Status:** VERIFICADO OFFLINE - Sprint 1 (Concluído)  
> **Arquivos Afetados:** `Core/Constantes.js`, `Core/RegrasQualidade.js`, `Features/GuardiaoQualidade.js`, `Render/RendererAuditoriaSaude.js`, `Testes/TestGuardiao.js`, `planta/M05_GUARDIAO_HOMOLOGACAO.md`, `planta/03_TASKS/M05_TASKS.md`  
> **Total de Testes:** 64/64 testes aprovados  

---

## 🎯 Objetivo da Sprint

Implementar o Guardião da Qualidade Operacional como uma camada passiva, explicativa e auditável de validação de dados em ambiente offline. O Guardião audita diagnósticos estruturados sem alterar fórmulas ou dados das células operacionais.

---

## 📌 Regras de Negócio e Princípios Fundamentais

1. **Leitura Passiva e Não Intervenção:** O Guardião observa, registra diagnósticos em `[AUDITORIA] Ocorrencias`, acumula histórico em `[HISTORICO] Auditoria Ocorrencias` e escreve resumos curtos na coluna AM. Ele jamais altera células de dados ou fórmulas.
2. **Diagnósticos Curtos na Coluna AM:** Exibe apenas resumos textuais de diagnósticos para facilitar a visualização rápida pelo operador.
3. **Plantão Tranquilo:** Linhas vazias contendo apenas data são tratadas como normais, sem emissão de alertas.
4. **Divisor Fixo do Rateio PIP (`DIVISOR_RATEIO_PIP = 4`):** O valor esperado de `PONTOS FICÇÃO` para cada policial no túnel é **sempre `totalPontosTunel / 4`**, independentemente do número de policiais vinculados ao túnel. Se a ocorrência pontuou 304, a cota de cada policial é 76. Policiais com `0` recebem alerta individual de rateio zerado/incoerente.
5. **Catálogo Dinâmico da Tabela PIP:** Busca flexível por aliases com normalização de hífen/underline. Quando a aba ou o cabeçalho de indicador não são localizados, ativa `MODO_LIMITADO_CATALOGO_PIP` como `OBSERVACAO`, sem gerar falsos erros.
6. **Exceções Manuais Justificadas:** Células calculadas sem fórmula iniciadas por nota `EXCECAO:` são tratadas como `EXCECAO MANUAL`, registrando o motivo e dispensando alertas.

---

## 📊 Entregas Realizadas

- `Core/Constantes.js`: Adicionado `DIVISOR_RATEIO_PIP: 4`.
- `Core/RegrasQualidade.js`: Implementados motores de auditoria, diagnósticos estruturados, verificação cruzada de túneis e rateio fixo dividido por 4.
- `Features/GuardiaoQualidade.js`: Controlador principal de varredura, sanitização e atualização da Coluna AM e abas de auditoria.
- `Render/RendererAuditoriaSaude.js`: Formatador da aba `[AUDITORIA] Ocorrencias` (com linha APROVADO se zerado) e acumulador de `[HISTORICO] Auditoria Ocorrencias`.
- `Testes/TestGuardiao.js`: 23 testes unitários e homologação E2E cobrindo 10 cenários operacionais simultâneos.

---

## 🔒 Status Final

A Sprint M05 está **100% selada, verificada e aprovada offline** em conformidade com as diretrizes do ecossistema Synthéon.
