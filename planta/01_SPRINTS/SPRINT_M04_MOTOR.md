# Sprint M04 — Motor Analítico & Plugins de Métrica

> **Status:** PLANEJADA (PRONTA PARA INICIAR EXECUÇÃO)  
> **Ambiente:** Bancada Offline (`refactor/down-plant-gs-offline`)  
> **Cômodo Alvo:** M04 Motor Analítico  

---

## 🎯 Objetivos da Sprint

1. Organizar, purificar e blindar o **Motor Analítico (M04)** e toda a sua família de plugins de métricas (`PluginArmas`, `PluginEntorpecentes`, `PluginOcorrencias`, `PluginPontuacao`, `PluginPrisoes`).
2. Assegurar que o cálculo de métricas permaneça 100% puro, operando exclusivamente sobre entidades de Domínio (`RegistroCanonico`, `Policial`, `Ocorrencia`) vindas do M03, sem qualquer acoplamento a APIs do Google Apps Script ou componentes visuais.
3. Garantir a preservação absoluta das regras matemáticas homologadas (tolerância zero de divergência contra a V1 histórica).
4. Assegurar a correta deduplicação por túnel de ocorrência (`MIKE|BOE`) e o respeito aos gatilhos da coluna `AG` (Indicador PIP).

---

## 📦 Entregáveis Planejados

- **`planta/M04_MOTOR_INVENTARIO.md`**: Mapeamento do Motor V2, interfaces e plugins de métricas.
- **`planta/M04_MOTOR_PUREZA.md`**: Auditoria confirmando a ausência de acoplamento a I/O, GAS ou UI.
- **`Motor/MotorAnaliticoV2.js`**: Core do motor de consolidação e pipeline de métricas.
- **`Plugins/IPluginMetrica.js`**: Interface/Contrato de plugin.
- **`Plugins/Metricas/*.js`**: Plugins de armas, entorpecentes, ocorrências, pontuação e prisões.
- **`Core/Metricas.js`**, **`Core/Ranking.js`**.

---

## 🟢 Critérios de Aceite da Sprint

- [ ] Inventário de todos os componentes do M04 concluído (`TASK-M04.1-01`).
- [ ] Auditoria de pureza aprovada com 0% de acoplamento a APIs do Apps Script (`TASK-M04.1-02`).
- [ ] Plugins e Motor blindados com testes unitários sem alteração das regras matemáticas (`TASK-M04.1-03`).
- [ ] Regressão matemática atestando equivalência perfeita de 100% (`TASK-M04.1-04`).
- [ ] Invariantes do Motor documentadas em `M04_MOTOR_SPEC.md` (`TASK-M04.1-05`).
- [ ] Todos os 29+ testes automatizados passando em verde absoluto.
