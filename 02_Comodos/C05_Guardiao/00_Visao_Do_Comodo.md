# Protocolo de HomologaÃ§Ã£o Manual do GuardiÃ£o da Qualidade Operacional (C05)

> **Documento:** `02_Comodos/M05_GUARDIAO_HOMOLOGACAO.md`  
> **Status:** VERIFICADO OFFLINE - SPRINT C05.1 (Ajuste de Regra PIP ConcluÃ­do)  
> **Ambiente:** Bancada Offline (`refactor/down-plant-gs-offline`)  

---

## ðŸ›‘ Diretriz de PreservaÃ§Ã£o e SeguranÃ§a Offline

- **Zero Push Rule:** Ã‰ terminantemente proibido executar `git push` ou `clasp push`.
- **PreservaÃ§Ã£o de Dados Operacionais:** O GuardiÃ£o observa, demonstra a evidÃªncia e orienta a correÃ§Ã£o. Ele **nunca** corrige, apaga, preenche ou substitui dados operacionais automaticamente.
- **Divisor Fixo do Rateio PIP (`DIVISOR_RATEIO_PIP = 4`):** A fraÃ§Ã£o PIP de PONTOS FICÃ‡ÃƒO por linha Ã© **sempre `totalPontosTunel / 4`**, independentemente se a equipe no tÃºnel tem 1, 4, 5 ou 10 policiais.

---

## ðŸ“‹ Roteiro de HomologaÃ§Ã£o Passo a Passo em Planilha-CÃ³pia

Quando a homologaÃ§Ã£o em ambiente Google Sheets for autorizada, siga este protocolo em uma **planilha-cÃ³pia de testes**:

### Passo 1: PreparaÃ§Ã£o do Ambiente
1. Abra a planilha-cÃ³pia no Google Sheets.
2. Certifique-se de que a aba mensal de ocorrÃªncias (ex: `JUN2026` ou `JUL2026`) estÃ¡ aberta e selecionada.
3. Verifique se a aba `Tabela PIP` (ou alias como `TABELA-PIP`, `tabela_pip`) estÃ¡ presente na planilha com o cabeÃ§alho `INDICADOR PIP`.

### Passo 2: ExecuÃ§Ã£o da Auditoria
1. No menu da planilha, acione **GuardiÃ£o da Qualidade -> Auditar Integridade da Aba**.
2. Aguarde a mensagem de confirmaÃ§Ã£o do sistema informando a quantidade de tÃºneis, linhas analisadas e alertas gerados.

### Passo 3: ValidaÃ§Ã£o da Coluna AM (`Alerta Integridade`)
1. Verifique a Coluna AM da aba mensal auditada:
   - Linhas sem problemas devem permanecer totalmente **vazias/limpas**.
   - Linhas com inconformidades devem exibir resumos curtos em texto (ex: `MIKE suspeito: 2026 | Evento incompleto: AG preenchido sem IMPUTADO?`).
   - Confirme que a coluna AM **nÃ£o contÃ©m objetos `[object Object]`** nem textos longos com aÃ§Ãµes recomendadas.

### Passo 4: ValidaÃ§Ã£o da Aba `[AUDITORIA] Ocorrencias` (Ãšltima ExecuÃ§Ã£o)
1. Abra a aba `[AUDITORIA] Ocorrencias`.
2. Confirme os dados do Resumo Superior (Linhas 1 a 3):
   - Data/Hora da execuÃ§Ã£o.
   - Aba auditada.
   - Quantidade de tÃºneis e linhas analisadas.
   - Totalizadores por severidade (`CrÃ­ticos`, `Alertas`, `ObservaÃ§Ãµes`, `ExceÃ§Ãµes Manuais`).
3. Confirme o conteÃºdo da Tabela de 8 Colunas (Linha 5 em diante):
   - `ABA`, `TÃšNEL`, `LINHA`, `SEVERIDADE`, `REGRA`, `DIAGNÃ“STICO`, `EVIDÃŠNCIA`, `AÃ‡ÃƒO RECOMENDADA`.
   - Caso a aba esteja 100% integra, confirme se a primeira linha exibe `SEVERIDADE = APROVADO` e `REGRA = INTEGRIDADE_OK`.

### Passo 5: ValidaÃ§Ã£o da Aba `[HISTORICO] Auditoria Ocorrencias` (Cumulativo)
1. Abra a aba `[HISTORICO] Auditoria Ocorrencias`.
2. Verifique se os registros da execuÃ§Ã£o foram anexados ao final da aba com a coluna `DATA/HORA EXECUÃ‡ÃƒO`.
3. Execute o GuardiÃ£o uma segunda vez em outra aba (ou na mesma) e confirme que a aba de histÃ³rico **preservou os registros anteriores**, adicionando os novos dados abaixo sem sobrescrever nada.

---

## ðŸ“Š Matriz de InterpretaÃ§Ã£o das Regras e DiagnÃ³sticos

| DiagnÃ³stico | Severidade | Comportamento Esperado | AÃ§Ã£o Recomendada Exibida |
| :--- | :--- | :--- | :--- |
| `OCORRENCIA_ORFA` | **CRITICO** | Linha com policial/evento sem nÃºmero MIKE. | Preencher o MIKE completo da ocorrÃªncia. |
| `MIKE_SUSPEITO` | **ALERTA** | MIKE com ano isolado (ex: `2026`) ou tamanho atÃ­pico. | Confirmar nÃºmero formatado ou dÃ­gitos do MIKE. |
| `MIKE_DATA_DIVERGENTE` | **ALERTA** | Data da planilha diverge do ano/mÃªs/dia embutido no MIKE. | Harmonizar a data da coluna A com a data real do MIKE. |
| `MIKE_BOE_DIVERGENTE` | **ALERTA** | Mesmo MIKE associado a BOEs diferentes em linhas distintas. | Verificar se houve digitaÃ§Ã£o incorreta de BOE no mesmo tÃºnel. |
| `MIKE_DATAS_DIVERGENTES` | **ALERTA** | Mesmo MIKE utilizado em datas diferentes na planilha. | Corrigir a data ou verificar se o nÃºmero do MIKE foi duplicado. |
| `EVENTO_INCOMPLETO_AG` | **ALERTA** | OcorrÃªncia PIP (AG) preenchida sem o status IMPUTADO? (AH). | Definir COM IMPUTADO ou SEM IMPUTADO em AH. |
| `IMPUTADO_SEM_EVENTO_AH` | **ALERTA** | IMPUTADO? (AH) preenchido sem o indicador OCORRÃŠNCIA PIP (AG). | Preencher o indicador em AG ou limpar o campo em AH. |
| `RATEIO_PONTOS_INCOERENTE` | **ALERTA** | Pontos de ficÃ§Ã£o lidos diferem do rateio exato (`pontosTotais / 4`) ou um policial estÃ¡ com `PONTOS FICÃ‡ÃƒO = 0`. | Ajustar a pontuaÃ§Ã£o da linha para `pontosTotais / 4` (equipe base = 4). |
| `EXCECAO_MANUAL_JUSTIFICADA` | **EXCECAO MANUAL** | CÃ©lula calculada sem fÃ³rmula mas com nota iniciada por `EXCECAO:`. | Tratado como exceÃ§Ã£o justificada, sem alerta de erro. |
| `FATO_NAO_AUDITAVEL_AUTOMATICAMENTE` | **OBSERVACAO** | Indicadores como ApreensÃ£o de NumerÃ¡rio sem valor em reais. | Registrado como observaÃ§Ã£o tÃ©cnica. |
| `INDICADOR_DESCONHECIDO` | **OBSERVACAO** | Indicador nÃ£o cadastrado na Tabela PIP. | Verificar grafia do indicador ou atualizar a Tabela PIP. |
| `MODO_LIMITADO_CATALOGO_PIP` | **OBSERVACAO** | Aba Tabela PIP ou coluna de indicador ausente. | Ativa auditoria em modo limitado sem falsos erros. |

---

## ðŸ“Œ DiferenciaÃ§Ã£o: Melhorias Esperadas vs RegressÃµes

1. **Divisor de Rateio PIP Fixo em 4**: NÃ£o importa quantos policiais estejam no mesmo tÃºnel (4, 5, 10 ou mais), todos devem receber `pontosTotais / 4`. Se a ocorrÃªncia gerou 304 pontos e hÃ¡ 5 policiais, todos recebem 76. Se um policial estiver com 0, apenas essa linha zerada gerarÃ¡ alerta.
2. **ExceÃ§Ã£o por Nota (`EXCECAO_MANUAL_JUSTIFICADA`)**: Permite auditoria limpa quando o operador justifica ajustes manuais por nota na cÃ©lula.
3. **CoerÃªncia Cruzada do TÃºnel (`MIKE_BOE_DIVERGENTE` / `MIKE_DATAS_DIVERGENTES`)**: Identifica divergÃªncias entre linhas do mesmo tÃºnel antes da consolidaÃ§Ã£o do motor.

---

## ðŸ”’ ConclusÃ£o da HomologaÃ§Ã£o Offline

O cÃ´modo **C05 GuardiÃ£o da Qualidade Operacional** estÃ¡ **100% testado, alinhado e homologado em ambiente offline** com **64/64 testes automatizados aprovados**.

