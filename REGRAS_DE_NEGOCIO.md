# SYNTHÉON V1: Regras de Negócio
## Documentação Executável do Motor Matemático

Este documento concentra a lógica de negócio detalhada da planilha operacional do SYNTHÉON. Ele dita como as fórmulas e os compiladores devem se comportar.

---

### 1. Identidade e Formação do Túnel (Chave Ocorrência)

#### Como identificar um Túnel
Um túnel (bloco lógico) agrupa todas as linhas que pertencem a um mesmo evento do mundo real. 

#### Como formar a chave (Coluna AK)
A chave da ocorrência é a concatenação dos identificadores únicos oficiais:
* Em ocorrências regulares: `MIKE | BOE`
* Se faltar o BOE: Usa apenas o `MIKE`
* Se não houver nenhum dos dois (ex: administrativo): A chave passa a ser a própria linha de origem e a data, garantindo unicidade isolada.

*(NOTA: A regra de extração oficial para o Motor Analítico V2 concatena Data, Mike e Boe ou usa a linha de origem).*

---

### 2. Indicadores Operacionais (Coluna AG)

#### Como calcular cada indicador da AG e quais colunas ele consulta
Os indicadores não são valores monetários nem pontuações prontas, são "gatilhos" matemáticos.

* **Apreensão de Maconha**: 
  * *Contexto*: Soma total de maconha apreendida no túnel.
  * *Colunas Consultadas*: Quantidade de Maconha.
* **Apreensão de Cocaína / Crack**:
  * *Contexto*: Soma total no túnel.
  * *Colunas Consultadas*: Quantidade de Cocaína, Quantidade de Crack.
* **Apreensão de Armas**:
  * *Contexto*: Validação do tipo de arma.
  * *Colunas Consultadas*: Tipo da Arma, Quantidade de Armas.
* **Prisões**:
  * *Contexto*: Quantidade e tipo de detenção (APFD, TCO, BOC).
  * *Colunas Consultadas*: Detidos, APFD, TCO, BOC, Status (COM IMPUTADO).

*(TODO: Listar as regras matemáticas exatas de peso de drogas e limites da Tabela PIP).*

---

### 3. Matemática do PIP

#### Como funciona o cálculo do PIP
O cálculo do PIP (Prêmio de Integração Policial) consulta a Tabela PIP oficial do governo.
O Motor consolida a soma física dos fatos dentro do Túnel (ex: 3 armas) e converte isso na moeda de pontuação, de acordo com o peso de cada tipo de apreensão.

#### Como funciona o Rateio (Regra de 1/4)
A pontuação total da ocorrência nunca é somada de forma cumulativa se o policial tiver múltiplas linhas na mesma ocorrência.
1. O motor acha a **pontuação máxima** (Ficção) produzida pelo Túnel inteiro.
2. Cada policial ganha um **rateio igualitário** (ex: 1/4 da pontuação da equipe).
3. Linhas extras não criam policiais fantasmas nem multiplicam os pontos. O rateio divide os pontos pelos participantes reais (CPFs únicos) envolvidos no evento.

---

### 4. Validação e Governança

#### Verificador de Boas Práticas (Futuro)
As seguintes violações devem gerar um alerta, aviso ou erro no futuro Verificador de Boas Práticas:

* **ERRO GRAVE**: Policial sem matrícula ou com matrícula inválida.
* **ERRO GRAVE**: Ocorrência registrada sem MIKE ou BOE.
* **ERRO MATEMÁTICO**: Quantidades físicas negativas (ex: -1 arma).
* **AVISO DE INTEGRIDADE**: Múltiplas linhas do mesmo policial na mesma ocorrência sem fatos extras que justifiquem.
* **AVISO OPERACIONAL**: Ocorrência com imputado, mas sem nenhum Detido / APFD / TCO preenchido.
* **ALERTA DE INDICADOR SEM FATO (AM)**: Ocorrência que informa um indicador (ex: "Apreensão de maconha"), mas tem os totalizadores físicos zerados no túnel.
  * *Limitação Conhecida (V1)*: A fórmula na aba hoje (`=IF(AND(...)`) abrange apenas Maconha, Crack e Cocaína. Indicadores de armas, veículos recuperados, etc., ainda não possuem alerta de integridade automatizado na aba.
