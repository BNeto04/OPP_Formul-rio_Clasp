# Especificação Técnica — Cômodo M04 Motor Analítico

> **Código do Cômodo:** M04  
> **Nome:** Motor Analítico & Plugins de Métrica  
> **Status:** SPEC APROVADA (AGUARDANDO EXECUÇÃO)  

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
