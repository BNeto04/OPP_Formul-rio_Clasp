# Léxico do Projeto

- **Down Plant:** Metodologia de estruturação canônica do repositório em cômodos.
- **Cômodo (CXX):** Domínio de negócio isolado (ex: C01 Entrada, C02 Leitura).
- **Módulo (MOD-CXX-NN):** Subdivisão estrutural dentro de um cômodo.

## Vocabulário de dados × metadados (fechamento de D-164-04, #164)

- **Dado operacional (A:AL):** o conteúdo das colunas **A:AL** da aba mensal de ocorrências — fatos,
  indicadores, participação de efetivo, armas, drogas, pontos, fórmulas e sua formatação. É
  **somente leitura** para o Guardião: nenhuma célula, fórmula, cor, borda ou zebrado de A:AL pode
  ser criado, alterado ou apagado por auditoria. Definição canônica:
  `Core/ContratoMutacaoSegura.js:58-61` — *"A:AL sao dados; AM e a coluna de alerta do Guardiao"* —
  combinada com `02_Comodos/C05_Guardiao/01_Dominio/modulos/MOD-C05-01_GUARDIAO_DE_QUALIDADE/MOD-C05-01_GUARDIAO_DE_QUALIDADE.md:14-16`
  (*"Nao altera dado operacional - nem colunas A:AL, nem formula: somente leitura + escrita nas abas
  de auditoria e no destaque da coluna **AM** (39)"*) e `:43` (*"A:AL intocaveis"*).
- **Metadado / alerta de auditoria (AM):** a coluna **AM** (`Alerta Integridade`) da aba mensal — o
  **canal de alerta do Guardião**. É endereçada por **cabeçalho canônico** (`Alerta Integridade`) e
  por contrato, nunca por posição suposta nem por alias solto; ausente ou ambígua, a auditoria segue
  **fail-safe** (emite diagnóstico e não escreve). É **proibida ao Normalizador**
  (`Core/ContratoMutacaoSegura.js:263` `PROIBIDO_ALTERAR_COLUNA_DE_ALERTA`) — a AM é do Guardião.
- **Efeito de auditoria (detecta ≠ corrige):** o Guardião **detecta, explica e aponta**; publica o
  diagnóstico em AM e nas abas de apoio. Ele **não corrige dado operacional** — quem muta A:AL é o
  Normalizador (MOD-C05-02) sob `CONFIRM_AUTO`/dry-run.
