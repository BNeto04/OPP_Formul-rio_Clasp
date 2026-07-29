# Especificação Técnica — Cômodo M05 Guardião da Qualidade

> **Código do Cômodo:** M05  
> **Nome:** Guardião da Qualidade Operacional  
> **Status:** SPEC APROVADA (EM EXECUÇÃO - SPRINT M05.1)  

---

## 1. Visão Geral e Responsabilidades

O cômodo **M05 Guardião da Qualidade** é o consultor e auditor de integridade operacional do SYNTHÉON GS. Ele observa a planilha, audita dados operacionais por ocorrência/túnel (`MIKE|BOE`), identifica divergências sintáticas ou de fórmulas e apresenta diagnósticos claros com evidências e **ações recomendadas** para a revisão humana.

### Princípios Inegociáveis:
1. **Não Intervenção Silenciosa:** O Guardião **nunca** altera, corrige, apaga, preenche ou substitui dados operacionais automaticamente.
2. **Não Bloqueio Operacional:** Alertas de negócio nunca interrompem a execução. Somente `ERRO TECNICO` por ausência de cabeçalhos indispensáveis pode interromper o fluxo.
3. **Respeito ao Plantão Tranquilo:** Linhas que contêm apenas data, sem MIKE, sem policial e sem fato físico são permitidas e tratadas como plantão tranquilo sem alertas.
4. **Matrícula Desconhecida:** Matrícula ausente do mapa de efetivo é classificada como `OBSERVAÇÃO`; nome presente com matrícula vazia permanece como `ALERTA`.
5. **Preservação de Coluna AM:** Nenhuma nova coluna operacional é criada. A coluna AM continua sendo `Alerta Integridade`.
6. **Exceção Manual por Nota:** Células calculadas sem fórmula são classificadas como `EXCECAO MANUAL` quando contiverem nota iniciada pelo padrão `EXCECAO: motivo` (ex: `EXCECAO: Numerario de R$ 40,00 conforme BOE`). Células sem fórmula e sem nota permanecem como `ALERTA`.

---

## 2. Classificação Geral de Severidade

- **`ERRO TECNICO`**: Cabeçalho indispensável ausente na aba; pode interromper a execução.
- **`CRITICO`**: Comprometimento da identidade da ocorrência ou cálculo crítico sem justificativa.
- **`ALERTA`**: Preenchimento, fórmulas ou rateios que exigem atenção/revisão humana.
- **`OBSERVACAO`**: Situação operacional possível que merece ciência do operador.
- **`EXCECAO MANUAL`**: Valor manual ajustado legitimamente e justificado por nota `EXCECAO:`.

---

## 3. Formato do Relatório Detalhado de Auditoria

O relatório detalhado gravado nas abas de auditoria deve conter as seguintes colunas padronizadas:
`EXECUCAO` | `DATA/HORA` | `ABA` | `TUNEL` | `LINHA` | `SEVERIDADE` | `REGRA` | `DIAGNOSTICO` | `EVIDENCIA` | `ACAO RECOMENDADA` | `STATUS`

- `[AUDITORIA] Ocorrencias`: Mostra o resultado da **última auditoria** executada.
- `[HISTORICO] Auditoria Ocorrencias`: Acumula os registros de todas as auditorias executadas sem apagar o histórico anterior.
