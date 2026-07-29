# Especificação Técnica — Cômodo M01 Entrada

> **Código do Cômodo:** M01  
> **Nome:** Entrada (Porta Humana)  
> **Status:** VERIFICADO OFFLINE  

---

## 1. Visão Geral e Fronteiras

O cômodo **M01 Entrada** é a única interface entre o operador humano e o sistema SYNTHÉON GS. Ele engloba o menu da planilha, modais HTML de formulário e relatórios, e o controlador de entrada manual de ocorrências.

### Pertence ao M01:
- `Entrada/Menu.js`
- `Entrada/Formulario.html`
- `Entrada/DialogComparativo2026.html`
- `Entrada/EntradaManual.js` (controlador de payload humano)

### Vedações (NÃO pertence ao M01):
- Cálculos analíticos e regras de pontuação (pertencem ao M04 Motor).
- Leitura profunda de registros históricos (pertencem ao M02 Leitura).
- Validações de consistência lógica complexa (pertencem ao M05 Guardião).
- Formatação gráfica de relatórios (pertencem ao M06 Relatórios).
- Leitura direta da base de policiais (pertence ao M07 Efetivo).

---

## 2. Regras Arquiteturais

1. **Dono Único do `onOpen()`:**
   - Somente `Entrada/Menu.js` pode conter a função `onOpen()`.
   - Outros módulos expõem funções privadas do tipo `criarMenuX_()`, invocadas defensivamente por `Entrada/Menu.js`.

2. **Isolamento de Payload:**
   - O controlador `EntradaManual.js` recebe o JSON bruto enviado pela interface HTML (`google.script.run`) e decompõe a chamada em passos determinísticos:
     - Resolução da aba alvo (`resolverNomeAbaMensal`)
     - Verificação anti-duplicidade (`verificarDuplicidadeOcorrencia`)
     - Montagem da matriz de linhas (`montarLinhasEntradaManual`)
     - Escrita preservando fórmulas em chunks (`gravarLinhasEntradaManual`)

---

## 3. Mapeamento de Portas de Comunicação

| Origem | Destino | Função / Mecanismo | Propósito |
| :--- | :--- | :--- | :--- |
| **M01** | **M05 Guardião** | `executarGuardiaoQualidade()` | Disparar auditoria de integridade |
| **M01** | **M06 Relatórios** | `abrirMenuComparativo2026()` | Abrir modal de seleção de meses |
| **M01** | **M07 Efetivo** | `getEfetivo()` | Retornar lista de militares para autocomplete |
| **M01** | **M02/M06** | `gravarLinhasEntradaManual()` | Persistir ocorrências sem destruir fórmulas |
| **M01** | **M08 Homologação**| `rodarTesteDeHomologacao()` | Executar suíte de validação V1 x V2 |

---

## 4. Dívidas Técnicas Mapeadas (Regularização)
- **ID de Planilha Fixo:** Presença de `SS_ID = '1S05sTbd3otgjGjrC...'` em `EntradaManual.js`. A ser movido para `Core/Config.js` na refatoração do M02.
- **Acoplamento de `getEfetivo()`:** A leitura direta da aba `EFETIVO` reside em `EntradaManual.js`. Deve ser migrada para o cômodo M07 Efetivo.
