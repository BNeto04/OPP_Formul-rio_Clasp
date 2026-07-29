# Protocolo de Homologação Manual do Guardião da Qualidade Operacional (M05)

> **Documento:** `planta/M05_GUARDIAO_HOMOLOGACAO.md`  
> **Status:** VERIFICADO OFFLINE - SPRINT M05.1 (Ajuste de Regra PIP Concluído)  
> **Ambiente:** Bancada Offline (`refactor/down-plant-gs-offline`)  

---

## 🛑 Diretriz de Preservação e Segurança Offline

- **Zero Push Rule:** É terminantemente proibido executar `git push` ou `clasp push`.
- **Preservação de Dados Operacionais:** O Guardião observa, demonstra a evidência e orienta a correção. Ele **nunca** corrige, apaga, preenche ou substitui dados operacionais automaticamente.
- **Divisor Fixo do Rateio PIP (`DIVISOR_RATEIO_PIP = 4`):** A fração PIP de PONTOS FICÇÃO por linha é **sempre `totalPontosTunel / 4`**, independentemente se a equipe no túnel tem 1, 4, 5 ou 10 policiais.

---

## 📋 Roteiro de Homologação Passo a Passo em Planilha-Cópia

Quando a homologação em ambiente Google Sheets for autorizada, siga este protocolo em uma **planilha-cópia de testes**:

### Passo 1: Preparação do Ambiente
1. Abra a planilha-cópia no Google Sheets.
2. Certifique-se de que a aba mensal de ocorrências (ex: `JUN2026` ou `JUL2026`) está aberta e selecionada.
3. Verifique se a aba `Tabela PIP` (ou alias como `TABELA-PIP`, `tabela_pip`) está presente na planilha com o cabeçalho `INDICADOR PIP`.

### Passo 2: Execução da Auditoria
1. No menu da planilha, acione **Guardião da Qualidade -> Auditar Integridade da Aba**.
2. Aguarde a mensagem de confirmação do sistema informando a quantidade de túneis, linhas analisadas e alertas gerados.

### Passo 3: Validação da Coluna AM (`Alerta Integridade`)
1. Verifique a Coluna AM da aba mensal auditada:
   - Linhas sem problemas devem permanecer totalmente **vazias/limpas**.
   - Linhas com inconformidades devem exibir resumos curtos em texto (ex: `MIKE suspeito: 2026 | Evento incompleto: AG preenchido sem IMPUTADO?`).
   - Confirme que a coluna AM **não contém objetos `[object Object]`** nem textos longos com ações recomendadas.

### Passo 4: Validação da Aba `[AUDITORIA] Ocorrencias` (Última Execução)
1. Abra a aba `[AUDITORIA] Ocorrencias`.
2. Confirme os dados do Resumo Superior (Linhas 1 a 3):
   - Data/Hora da execução.
   - Aba auditada.
   - Quantidade de túneis e linhas analisadas.
   - Totalizadores por severidade (`Críticos`, `Alertas`, `Observações`, `Exceções Manuais`).
3. Confirme o conteúdo da Tabela de 8 Colunas (Linha 5 em diante):
   - `ABA`, `TÚNEL`, `LINHA`, `SEVERIDADE`, `REGRA`, `DIAGNÓSTICO`, `EVIDÊNCIA`, `AÇÃO RECOMENDADA`.
   - Caso a aba esteja 100% integra, confirme se a primeira linha exibe `SEVERIDADE = APROVADO` e `REGRA = INTEGRIDADE_OK`.

### Passo 5: Validação da Aba `[HISTORICO] Auditoria Ocorrencias` (Cumulativo)
1. Abra a aba `[HISTORICO] Auditoria Ocorrencias`.
2. Verifique se os registros da execução foram anexados ao final da aba com a coluna `DATA/HORA EXECUÇÃO`.
3. Execute o Guardião uma segunda vez em outra aba (ou na mesma) e confirme que a aba de histórico **preservou os registros anteriores**, adicionando os novos dados abaixo sem sobrescrever nada.

---

## 📊 Matriz de Interpretação das Regras e Diagnósticos

| Diagnóstico | Severidade | Comportamento Esperado | Ação Recomendada Exibida |
| :--- | :--- | :--- | :--- |
| `OCORRENCIA_ORFA` | **CRITICO** | Linha com policial/evento sem número MIKE. | Preencher o MIKE completo da ocorrência. |
| `MIKE_SUSPEITO` | **ALERTA** | MIKE com ano isolado (ex: `2026`) ou tamanho atípico. | Confirmar número formatado ou dígitos do MIKE. |
| `MIKE_DATA_DIVERGENTE` | **ALERTA** | Data da planilha diverge do ano/mês/dia embutido no MIKE. | Harmonizar a data da coluna A com a data real do MIKE. |
| `MIKE_BOE_DIVERGENTE` | **ALERTA** | Mesmo MIKE associado a BOEs diferentes em linhas distintas. | Verificar se houve digitação incorreta de BOE no mesmo túnel. |
| `MIKE_DATAS_DIVERGENTES` | **ALERTA** | Mesmo MIKE utilizado em datas diferentes na planilha. | Corrigir a data ou verificar se o número do MIKE foi duplicado. |
| `EVENTO_INCOMPLETO_AG` | **ALERTA** | Ocorrência PIP (AG) preenchida sem o status IMPUTADO? (AH). | Definir COM IMPUTADO ou SEM IMPUTADO em AH. |
| `IMPUTADO_SEM_EVENTO_AH` | **ALERTA** | IMPUTADO? (AH) preenchido sem o indicador OCORRÊNCIA PIP (AG). | Preencher o indicador em AG ou limpar o campo em AH. |
| `RATEIO_PONTOS_INCOERENTE` | **ALERTA** | Pontos de ficção lidos diferem do rateio exato (`pontosTotais / 4`) ou um policial está com `PONTOS FICÇÃO = 0`. | Ajustar a pontuação da linha para `pontosTotais / 4` (equipe base = 4). |
| `EXCECAO_MANUAL_JUSTIFICADA` | **EXCECAO MANUAL** | Célula calculada sem fórmula mas com nota iniciada por `EXCECAO:`. | Tratado como exceção justificada, sem alerta de erro. |
| `FATO_NAO_AUDITAVEL_AUTOMATICAMENTE` | **OBSERVACAO** | Indicadores como Apreensão de Numerário sem valor em reais. | Registrado como observação técnica. |
| `INDICADOR_DESCONHECIDO` | **OBSERVACAO** | Indicador não cadastrado na Tabela PIP. | Verificar grafia do indicador ou atualizar a Tabela PIP. |
| `MODO_LIMITADO_CATALOGO_PIP` | **OBSERVACAO** | Aba Tabela PIP ou coluna de indicador ausente. | Ativa auditoria em modo limitado sem falsos erros. |

---

## 📌 Diferenciação: Melhorias Esperadas vs Regressões

1. **Divisor de Rateio PIP Fixo em 4**: Não importa quantos policiais estejam no mesmo túnel (4, 5, 10 ou mais), todos devem receber `pontosTotais / 4`. Se a ocorrência gerou 304 pontos e há 5 policiais, todos recebem 76. Se um policial estiver com 0, apenas essa linha zerada gerará alerta.
2. **Exceção por Nota (`EXCECAO_MANUAL_JUSTIFICADA`)**: Permite auditoria limpa quando o operador justifica ajustes manuais por nota na célula.
3. **Coerência Cruzada do Túnel (`MIKE_BOE_DIVERGENTE` / `MIKE_DATAS_DIVERGENTES`)**: Identifica divergências entre linhas do mesmo túnel antes da consolidação do motor.

---

## 🔒 Conclusão da Homologação Offline

O cômodo **M05 Guardião da Qualidade Operacional** está **100% testado, alinhado e homologado em ambiente offline** com **64/64 testes automatizados aprovados**.
