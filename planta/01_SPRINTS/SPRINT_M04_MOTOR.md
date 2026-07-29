# Sprint M04 — Motor Analítico & Plugins de Métrica

> **Status:** VERIFICADO OFFLINE - Sprint 1  
> **Ambiente:** Bancada Offline (`refactor/down-plant-gs-offline`)  
> **Cômodo Alvo:** M04 Motor Analítico  
> **Data de Conclusão:** 29/07/2026  

---

## 🎯 Objetivos da Sprint

1. Organizar, purificar e blindar o **Motor Analítico (M04)** e toda a sua família de plugins de métricas (`PluginArmas`, `PluginEntorpecentes`, `PluginOcorrencias`, `PluginPontuacao`, `PluginPrisoes`).
2. Assegurar que o cálculo de métricas permaneça 100% puro, operando exclusivamente sobre entidades de Domínio (`RegistroCanonico`, `Policial`, `Ocorrencia`) vindas do M03, sem qualquer acoplamento a APIs do Google Apps Script ou componentes visuais.
3. Garantir a preservação absoluta das regras matemáticas do Motor V2 por túnel (deduplicação por túnel, maior pontuação, acúmulo de fatos físicos e comutatividade).
4. Assegurar a correta deduplicação por túnel de ocorrência (`MIKE|BOE`) e a integridade de dados necessários ao M06 Relatórios.

---

## 📦 Entregáveis Concluídos

- **`planta/M04_MOTOR_INVENTARIO.md`**: Inventário mapeando os 9 componentes do Motor V2 e plugins.
- **`planta/M04_MOTOR_PUREZA.md`**: Auditoria confirmando 0% de acoplamento a I/O, GAS ou UI.
- **`Testes/Fixtures/M04RegressaoFixture.js`**: Fixture determinística para testes de regressão do Motor V2 por túnel.
- **`Testes/TestMotorAnaliticoRegressao.js`**: Suíte de regressão matemática do Motor V2 por túnel.
- **`planta/02_SPECS/M04_MOTOR_SPEC.md`**: Especificação técnica contendo a seção de Invariantes do Motor Analítico.

---

## 🟢 Critérios de Aceite Atendidos

- [x] Inventário de todos os componentes do M04 concluído (`TASK-M04.1-01`).
- [x] Auditoria de pureza aprovada com 0% de acoplamento a APIs do Apps Script (`TASK-M04.1-02`).
- [x] Plugins e Motor blindados com testes unitários expandidos em `TestPlugins.js` (`TASK-M04.1-03`).
- [x] Regressão matemática do Motor V2 por túnel atestando deduplicação, acumuladores e comutatividade (`TASK-M04.1-04`).
- [x] Invariantes do Motor documentadas em `M04_MOTOR_SPEC.md` (`TASK-M04.1-05`).
- [x] Suíte integral de 41/41 testes automatizados passando em verde absoluto.
