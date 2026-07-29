# Especificação Técnica — Cômodo M04 Motor Analítico

> **Código do Cômodo:** M04  
> **Nome:** Motor Analítico & Plugins de Métrica  
> **Status:** VERIFICADO OFFLINE - Sprint 1  

---

## 1. Visão Geral e Responsabilidades

O cômodo **M04 Motor Analítico** é a inteligência computacional do SYNTHÉON GS. Ele recebe do M02 (Leitura) e M03 (Domínio) os registros canônicos imutáveis e executa os cálculos, acumulações e deduplicações de produtividade através de uma arquitetura baseada em plugins extensíveis.

### Pertence ao M04:
- `Motor/MotorAnaliticoV2.js`
- `Plugins/IPluginMetrica.js`
- `Plugins/Metricas/PluginArmas.js`
- `Plugins/Metricas/PluginEntorpecentes.js`
- `Plugins/Metricas/PluginOcorrencias.js`
- `Plugins/Metricas/PluginPontuacao.js`
- `Plugins/Metricas/PluginPrisoes.js`
- `Core/Metricas.js`
- `Core/Ranking.js`

### Vedações (NÃO pertence ao M04):
- Leitura direta de células ou planilhas (`SpreadsheetApp`).
- Formatação de células, pintura de cores ou alinhamento de tabela (cômodo M06).
- Interação com menus, HTML, formulários ou modais (cômodo M01).
- Definição ou parsing de entidades do domínio (cômodo M03).

---

## 2. Diretrizes Principais de Cálculo

1. **Separação Fatos vs Indicadores:** Fatos (armas físicas, peso de entorpecentes em gramas, detenções) são contabilizados diretamente; Indicadores (pontuações rateadas) são deduplicados pelo valor MÁXIMO da ocorrência.
2. **Deduplicação de Ocorrências e BOE:** A contagem de ocorrências únicas e do BOE ocorre apenas na primeira aparição do fato dentro do mesmo túnel (`MIKE|BOE`).
3. **Comutatividade Lógica:** A ordem física das linhas na planilha não afeta o resultado final dos rankings.
4. **Respeito às Regras Visuais (Transversal):** O motor compila os totais de produtividade sem truncar pelotões (`1º PEL GTAR`, `2º PEL GTAR`) ou contagens de armas, garantindo os insumos do M06.

---

## 3. Invariantes do Motor Analítico

As seguintes regras constituem os **Invariantes do Motor Analítico** do SYNTHÉON e nunca podem ser violadas:

- **Isolamento de Infraestrutura:** O Motor Analítico e seus plugins nunca acessam Google Apps Script (`SpreadsheetApp`, `HtmlService`, `Logger`, `Utilities`, `Session`).
- **Isolamento de I/O:** O Motor não lê nem escreve diretamente em células, ranges, abas ou planilhas.
- **Isolamento de UI/Renderização:** O Motor não gera relatórios, gráficos, modais ou menus visuais.
- **Arquitetura Aberta a Plugins:** Toda nova métrica ou regra de cálculo deve ser implementada herdando de `IPluginMetrica`, sem alterar o core do `MotorAnaliticoV2`.
- **Deduplicação por Túnel:** A pontuação no mesmo túnel (`MIKE|BOE`) é deduplicada pelo valor MÁXIMO lido (`Math.max`), enquanto a contagem de ocorrências e BOEs ocorre apenas na primeira leitura do policial na ocorrência.
- **Acumulação Física de Fatos:** Apreensões de armas, entorpecentes e prisões acumulam fisicamente por linha para o militar.
- **Preservação de Dados de Lotação:** O histórico de escalas e a sigla completa do pelotão/subunidade (`1º PEL GTAR`, `2º PEL GTAR`) devem ser propagados intactos para o `RegistroAnalitico`.
- **Comutatividade de Período:** A ordem de processamento das linhas dentro de uma mesma unidade de tempo não altera os totais calculados.
