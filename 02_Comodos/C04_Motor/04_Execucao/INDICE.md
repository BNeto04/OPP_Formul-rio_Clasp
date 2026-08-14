# Mapeamento de Tarefas â€” CÃ´modo C04 Motor AnalÃ­tico

> **Status Geral do CÃ´modo:** VERIFICADO OFFLINE - Sprint 1 (TODAS AS TAREFAS CONCLUÃDAS)  

---

## ðŸ›‘ Regra de PreservaÃ§Ã£o Transversal

> **IMPORTANTE:** O Motor AnalÃ­tico calcula os totais sem alterar ou descartar informaÃ§Ãµes de pelotÃ£o/subunidade e escala de armas necessÃ¡rias ao C06 RelatÃ³rios:  
> 02_Comodos/02_SPECS/REGRA_TRANSVERSAL_FORMATACAO_RELATORIOS.md

---

## SPRINT C04.1 â€” PurificaÃ§Ã£o & OrganizaÃ§Ã£o do Motor AnalÃ­tico

| ID | Tarefa | Arquivo(s) Afetado(s) | Status | Commit |
| :--- | :--- | :--- | :--- | :--- |
| `TASK-C04.1-01` | InventÃ¡rio detalhado do Motor AnalÃ­tico V2 e Plugins | `02_Comodos/C04_MOTOR_INVENTARIO.md` | **CONCLUÃDA** | `3a50786` |
| `TASK-C04.1-02` | Auditoria de pureza do Motor e Plugins (isolar I/O e GAS) | `02_Comodos/C04_MOTOR_PUREZA.md`, `Motor/*.js`, `Plugins/*.js` | **CONCLUÃDA** | `61d72d3` |
| `TASK-C04.1-03` | Blindar contratos e testes unitÃ¡rios dos plugins de mÃ©trica | `Testes/TestPlugins.js` | **CONCLUÃDA** | `1aad511` |
| `TASK-C04.1-04` | RegressÃ£o matemÃ¡tica do Motor V2 por tÃºnel (deduplicaÃ§Ã£o e comutatividade) | `Testes/TestMotorAnaliticoRegressao.js`, `Testes/Fixtures/C04RegressaoFixture.js` | **CONCLUÃDA** | `4cb039e` |
| `TASK-C04.1-05` | Registrar invariantes finais do Motor e declarar congelamento | `02_Comodos/02_SPECS/C04_MOTOR_SPEC.md` | **CONCLUÃDA** | `3f44148` |


## Extrato de MOD-C04-01_Sprint.md

# Sprint C04 Ã¢â‚¬â€ Motor AnalÃƒÂ­tico & Plugins de MÃƒÂ©trica

> **Status:** VERIFICADO OFFLINE - Sprint 1  
> **Ambiente:** Bancada Offline (`refactor/down-plant-gs-offline`)  
> **CÃƒÂ´modo Alvo:** C04 Motor AnalÃƒÂ­tico  
> **Data de ConclusÃƒÂ£o:** 29/07/2026  

---

## Ã°Å¸Å½Â¯ Objetivos da Sprint

1. Organizar, purificar e blindar o **Motor AnalÃƒÂ­tico (C04)** e toda a sua famÃƒÂ­lia de plugins de mÃƒÂ©tricas (`PluginArmas`, `PluginEntorpecentes`, `PluginOcorrencias`, `PluginPontuacao`, `PluginPrisoes`).
2. Assegurar que o cÃƒÂ¡lculo de mÃƒÂ©tricas permaneÃƒÂ§a 100% puro, operando exclusivamente sobre entidades de DomÃƒÂ­nio (`RegistroCanonico`, `Policial`, `Ocorrencia`) vindas do C03, sem qualquer acoplamento a APIs do Google Apps Script ou componentes visuais.
3. Garantir a preservaÃƒÂ§ÃƒÂ£o absoluta das regras matemÃƒÂ¡ticas do Motor V2 por tÃƒÂºnel (deduplicaÃƒÂ§ÃƒÂ£o por tÃƒÂºnel, maior pontuaÃƒÂ§ÃƒÂ£o, acÃƒÂºmulo de fatos fÃƒÂ­sicos e comutatividade).
4. Assegurar a correta deduplicaÃƒÂ§ÃƒÂ£o por tÃƒÂºnel de ocorrÃƒÂªncia (`MIKE|BOE`) e a integridade de dados necessÃƒÂ¡rios ao C06 RelatÃƒÂ³rios.

---

## Ã°Å¸â€œÂ¦ EntregÃƒÂ¡veis ConcluÃƒÂ­dos

- **`02_Comodos/C04_MOTOR_INVENTARIO.md`**: InventÃƒÂ¡rio mapeando os 9 componentes do Motor V2 e plugins.
- **`02_Comodos/C04_MOTOR_PUREZA.md`**: Auditoria confirmando 0% de acoplamento a I/O, GAS ou UI.
- **`Testes/Fixtures/C04RegressaoFixture.js`**: Fixture determinÃƒÂ­stica para testes de regressÃƒÂ£o do Motor V2 por tÃƒÂºnel.
- **`Testes/TestMotorAnaliticoRegressao.js`**: SuÃƒÂ­te de regressÃƒÂ£o matemÃƒÂ¡tica do Motor V2 por tÃƒÂºnel.
- **`02_Comodos/02_SPECS/C04_MOTOR_SPEC.md`**: EspecificaÃƒÂ§ÃƒÂ£o tÃƒÂ©cnica contendo a seÃƒÂ§ÃƒÂ£o de Invariantes do Motor AnalÃƒÂ­tico.

---

## Ã°Å¸Å¸Â¢ CritÃƒÂ©rios de Aceite Atendidos

- [x] InventÃƒÂ¡rio de todos os componentes do C04 concluÃƒÂ­do (`TASK-C04.1-01`).
- [x] Auditoria de pureza aprovada com 0% de acoplamento a APIs do Apps Script (`TASK-C04.1-02`).
- [x] Plugins e Motor blindados com testes unitÃƒÂ¡rios expandidos em `TestPlugins.js` (`TASK-C04.1-03`).
- [x] RegressÃƒÂ£o matemÃƒÂ¡tica do Motor V2 por tÃƒÂºnel atestando deduplicaÃƒÂ§ÃƒÂ£o, acumuladores e comutatividade (`TASK-C04.1-04`).
- [x] Invariantes do Motor documentadas em `C04_MOTOR_SPEC.md` (`TASK-C04.1-05`).
- [x] SuÃƒÂ­te integral de 41/41 testes automatizados passando em verde absoluto.



