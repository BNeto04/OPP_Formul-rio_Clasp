# SYNTHÉON V1
## README – Planilha Operacional

### Visão Geral

A planilha operacional do SYNTHÉON constitui a primeira implementação do modelo de domínio do sistema.

Ela não deve ser entendida como uma planilha convencional de registros, mas como um Motor Matemático de Processamento de Ocorrências Policiais, responsável por transformar fatos operacionais em indicadores estratégicos.

Seu objetivo é garantir que toda ocorrência seja registrada de forma íntegra, permitindo que a pontuação PIP, estatísticas e compiladores sejam calculados automaticamente.

---

### Filosofia da Planilha

A unidade fundamental da planilha não é a linha.
A unidade fundamental é a **Ocorrência Operacional**.

Cada ocorrência forma um Bloco Lógico (Túnel) identificado por:
* Data Operacional
* MIKE
* BOE

Essa combinação representa a identidade única da ocorrência. A coluna `AK` representa essa chave de forma computacional para facilitar consultas e agrupamentos.

---

### Modelo Mental

O operador não preenche linhas.
O operador **descreve fatos** de uma ocorrência.

A planilha interpreta esses fatos para produzir:
* Pontuação PIP
* Rateio
* Estatísticas
* Indicadores
* Compiladores

---

### Estrutura do Túnel

Todo cálculo é realizado dentro do contexto da ocorrência.

```text
Ocorrência
├── Policiais
├── Drogas
├── Armas
├── Munições
├── Veículos
├── Prisões
├── Indicadores PIP
└── Pontuação
```

Nenhum cálculo considera apenas a linha atual. Todos os cálculos utilizam o contexto completo da ocorrência.

---

### Fatos Operacionais

Os fatos representam informações objetivas registradas na ocorrência.

Exemplos:
* quantidade de maconha;
* quantidade de cocaína;
* quantidade de crack;
* quantidade de armas;
* tipo da arma;
* munições;
* prisão;
* veículo;
* policiais participantes.

Esses fatos alimentam o Motor de Regras.

---

### Indicadores Operacionais

A coluna `AG` representa um Indicador Operacional. O indicador não contém a pontuação. Ele informa ao sistema qual regra deverá ser aplicada.

**Exemplo:**
`AG` = Apreensão de Maconha

**O sistema interpreta:**
Localizar o Túnel
↓
Somar toda a maconha registrada
↓
Consultar Tabela PIP
↓
Aplicar regra matemática
↓
Retornar a pontuação

---

### Independência da Ordem

A ordem das linhas nunca altera o resultado.

Exemplo:
```text
Revólver
Maconha
Crack
```
gera exatamente o mesmo resultado que:
```text
Crack
Revólver
Maconha
```

O cálculo depende exclusivamente dos fatos registrados dentro do Túnel.

---

### Regras Gerais

#### Identificação
Toda ocorrência deve possuir:
* Data Operacional
* MIKE
* BOE

Sem essas informações a ocorrência não poderá ser processada.

#### Contexto
Todo cálculo deve considerar apenas registros pertencentes ao mesmo Túnel. Nunca utilizar dados de outra ocorrência.

#### Autoria
O status `COM IMPUTADO` ou `SEM IMPUTADO` pertence ao evento registrado na linha e não necessariamente à ocorrência inteira. Uma mesma ocorrência pode conter eventos com status diferentes.

#### Linhas Extras
Quando a quantidade de eventos superar a quantidade de policiais participantes, poderão ser criadas linhas adicionais. Essas linhas pertencem ao mesmo Túnel e existem apenas para representar fatos adicionais da ocorrência.

---

### Fluxo de Processamento

1. Operador registra os fatos
2. Planilha organiza o Túnel
3. Motor Matemático
4. Tabela PIP
5. Pontuação
6. Rateio
7. Compiladores
8. Central Analítica

---

### Objetivo da V1

A V1 tem como objetivo:
* garantir integridade dos dados;
* calcular automaticamente todas as regras PIP;
* servir como base para auditoria;
* alimentar compiladores;
* validar regras de negócio.

---

### Evolução para a V2

A V2 não altera as regras de negócio. Ela apenas altera a tecnologia. Toda lógica descrita neste documento deverá permanecer exatamente igual, independentemente da plataforma utilizada.
