# EspecificaÃ§Ã£o TÃ©cnica â€” CÃ´modo C01 Entrada

> **CÃ³digo do CÃ´modo:** C01  
> **Nome:** Entrada (Porta Humana)  
> **Status:** VERIFICADO OFFLINE  

---

## 1. VisÃ£o Geral e Fronteiras

O cÃ´modo **C01 Entrada** Ã© a Ãºnica interface entre o operador humano e o sistema SYNTHÃ‰ON GS. Ele engloba o menu da planilha, modais HTML de formulÃ¡rio e relatÃ³rios, e o controlador de entrada manual de ocorrÃªncias.

### Pertence ao C01:
- `Entrada/Menu.js`
- `Entrada/Formulario.html`
- `Entrada/DialogComparativo2026.html`
- `Entrada/EntradaManual.js` (controlador de payload humano)

### VedaÃ§Ãµes (NÃƒO pertence ao C01):
- CÃ¡lculos analÃ­ticos e regras de pontuaÃ§Ã£o (pertencem ao C04 Motor).
- Leitura profunda de registros histÃ³ricos (pertencem ao C02 Leitura).
- ValidaÃ§Ãµes de consistÃªncia lÃ³gica complexa (pertencem ao C05 GuardiÃ£o).
- FormataÃ§Ã£o grÃ¡fica de relatÃ³rios (pertencem ao C06 RelatÃ³rios).
- Leitura direta da base de policiais (pertence ao C07 Efetivo).

---

## 2. Regras Arquiteturais

1. **Dono Ãšnico do `onOpen()`:**
   - Somente `Entrada/Menu.js` pode conter a funÃ§Ã£o `onOpen()`.
   - Outros mÃ³dulos expÃµem funÃ§Ãµes privadas do tipo `criarMenuX_()`, invocadas defensivamente por `Entrada/Menu.js`.

2. **Isolamento de Payload:**
   - O controlador `EntradaManual.js` recebe o JSON bruto enviado pela interface HTML (`google.script.run`) e decompÃµe a chamada em passos determinÃ­sticos:
     - ResoluÃ§Ã£o da aba alvo (`resolverNomeAbaMensal`)
     - VerificaÃ§Ã£o anti-duplicidade (`verificarDuplicidadeOcorrencia`)
     - Montagem da matriz de linhas (`montarLinhasEntradaManual`)
     - Escrita preservando fÃ³rmulas em chunks (`gravarLinhasEntradaManual`)

---

## 3. Mapeamento de Portas de ComunicaÃ§Ã£o

| Origem | Destino | FunÃ§Ã£o / Mecanismo | PropÃ³sito |
| :--- | :--- | :--- | :--- |
| **C01** | **C05 GuardiÃ£o** | `executarGuardiaoQualidade()` | Disparar auditoria de integridade |
| **C01** | **C06 RelatÃ³rios** | `abrirMenuComparativo2026()` | Abrir modal de seleÃ§Ã£o de meses |
| **C01** | **C07 Efetivo** | `getEfetivo()` | Retornar lista de militares para autocomplete |
| **C01** | **C02/C06** | `gravarLinhasEntradaManual()` | Persistir ocorrÃªncias sem destruir fÃ³rmulas |
| **C01** | **C08 HomologaÃ§Ã£o**| `rodarTesteDeHomologacao()` | Executar suÃ­te de validaÃ§Ã£o V1 x V2 |

---

## 4. DÃ­vidas TÃ©cnicas Mapeadas (RegularizaÃ§Ã£o)
- **ID de Planilha Fixo:** PresenÃ§a de `SS_ID = '1S05sTbd3otgjGjrC...'` em `EntradaManual.js`. A ser movido para `Core/Config.js` na refatoraÃ§Ã£o do C02.
- **Acoplamento de `getEfetivo()`:** A leitura direta da aba `EFETIVO` reside em `EntradaManual.js`. Deve ser migrada para o cÃ´modo C07 Efetivo.

