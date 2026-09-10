# Auditoria Independente: Promoção Seletiva sem GXT (Pacote R1)

## 1. Confirmação do Contexto
- **Projeto:** SYNTHÉON / Ocorrência por PEL
- **Pasta:** `C:\Users\Bneto04\Documents\Codex\syntheon-gs-downplant-offline`
- **Branch:** `refactor/down-plant-gs-offline`
- **Perfil:** P2
- **Módulo/Fatia:** R1 — Promoção seletiva sem GXT
- **Portão:** Somente leitura e montagem de evidência. (Publicação estritamente bloqueada)

## 2. Estado Git da Bancada (Inalterado)
A bancada local não sofreu *git reset*, *checkout* ou qualquer alteração.
**Evidência (`git status`):**
```text
On branch refactor/down-plant-gs-offline
Changes not staged for commit:
	modified:   Dominio/RegistroCanonico.js
	modified:   Leitura/LeitorAntiguidadePeculio.js
	modified:   Testes/TestLeitorAntiguidadePeculio.js
	modified:   Testes/TestRelatorioGxt.js

Untracked files:
	00_Painel/
	scripts/build-gxt.js
```

## 3. Identificação de Origem e Destino

### Origem de Homologação
- **Classificação:** FATO COMPROVADO
- **Script ID:** `1Pehkbdl6T-ADZCGozvKvgHHyM2AfvtL6hl5udxWF92kXsvfHPbEblCyS`
- **Quantidade de Arquivos Clonados:** 66
- **Interface UI:** Presença confirmada de `Formulario.html`, `DialogGxtSelecaoLivre.html`, `DialogComparativo2026.html`.
- **Vínculo com Planilha:** Confirmado. O ID `1S05sTbd3otgjGjrC-YrzHk7dXp7mzzaw_J2lyQ86hOY` está declarado literalmente em `Core\Config.js` (linha 21) e `Entrada\EntradaManual.js` (linhas 12 e 224).

### Destino de Produção
- **Classificação:** NÃO COMPROVADO / DIVERGÊNCIA CRÍTICA
- **Script ID Informado:** `1dudWJXeADZ3nSJSimyHgEQbi0Gu-RnV57w3dNvS6m-zbfqvtQ3GxEx4G`
- **Evidências do Clone:** O projeto retornou apenas 3 arquivos (`appsscript.json`, `Formulario.html`, `script Ranking.js`). O arquivo `script Ranking.js` contém código de manipulação direta de "Ranking de Armas AGO26" (230 linhas) que não corresponde à arquitetura SYNTHÉON.
- **Vínculo com Planilha:** Não possui referências textuais ao ID informado na base clonada.

## 4. Matriz de Exclusão GXT por Dependência Real (Base: Homologação)
| Arquivo ou Trecho | Classificação | Evidência Literal | Ação Proposta |
|-------------------|---------------|-------------------|---------------|
| `Features/CompiladorGxt.js` | EXCLUSIVO_GXT | Nomenclatura e objetivo intrínseco (Gxt). | NÃO COPIAR |
| `Render/RendererGxt.js` | EXCLUSIVO_GXT | Processamento visual unicamente para relatórios Gxt. | NÃO COPIAR |
| `Motor/DiagnosticoDeterministicoGxt.js`| EXCLUSIVO_GXT | Diagnóstico de falhas específico do Gxt. | NÃO COPIAR |
| `Entrada/DialogGxtSelecaoLivre.html` | EXCLUSIVO_GXT | UI dedicada para filtros do Relatório Gxt. | NÃO COPIAR |
| `Testes/TestRelatorioGxt.js` | EXCLUSIVO_GXT | Suíte focada em testar geração Gxt. | NÃO COPIAR |
| `scripts/build-gxt.js` | EXCLUSIVO_GXT | Script de build empacotador da feature. | NÃO COPIAR |
| `Motor/PoliticaMeritoArmas.js` | NÃO_GXT | Não possui dependência, referência ou callbacks 'Gxt'. É o motor puro de mérito por Armas do PIP. | COPIAR INTEGRALMENTE |
| `Entrada/Menu.js` | COMPARTILHADO_COM_GXT | Contém a função `criarMenuGxt_()` e a chamada para executá-la no `onOpen()`. | COPIAR COM PODA GXT |

## 5. Auditoria de Menus e Botões (`Entrada/Menu.js`)

Como o `Menu.js` da produção não pôde ser recuperado do ID informado (inexistente naquele script), a auditoria propõe a higienização puramente baseada na Origem de Homologação.

**Correções não-GXT preservadas (Devem subir para Produção):**
- Unificação PIP/CPM (`criarMenuUnificadoPipCPM_`).
- Menus de Produtividade (Comparativo 2026, Guardião Qualidade, Normalizar Efetivo).
- Tratamento de erro nos blocos `try...catch` de todos os sub-menus, que dão robustez à UI.

**Exclusivo GXT (A ser Removido na Poda):**
- A chamada `criarMenuGxt_()` dentro do `onOpen()`.
- O bloco da função inteira:
```javascript
function criarMenuGxt_() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Gxt')
    .addItem('Selecao livre', 'abrirMenuGxtSelecaoLivre')
    .addItem('Anual', 'gerarGxtAnual')
    .addSeparator()
    .addItem('[Dev] Diagnosticar GXT (Abril)', 'diagnosticarGxtAbril_')
    .addToUi();
}
```

## 6. Riscos e Divergências
> [!WARNING]
> **Bloqueio Identificado:** O ID de Produção fornecido (`1dudWJXeADZ3nSJSimyHgEQbi0Gu-RnV57w3dNvS6m-zbfqvtQ3GxEx4G`) **NÃO CONTÉM** o projeto atual em produção. O clone resultou em apenas 3 arquivos de um projeto chamado "Ranking de Armas", sem arquitetura (Features/Motor/Core) e sem vínculo com a planilha `1S05...`. O pacote **não pode ser promovido** para este Script ID sob risco de sobrescrever a ferramenta errada ou falhar catastroficamente ao não encontrar dependências.

## 7. Próximo Passo Seguro
1. **Revisar o Script ID de Produção:** O usuário deve verificar e fornecer o verdadeiro Script ID da Produção para que possamos validar o destino antes de gerar o pacote R1 definitivo.
2. **Autorizar a geração local do Menu Higienizado:** Caso o Script ID seja corrigido, criaremos a estrutura de promoção seletiva e montaremos o pacote local, podando o GXT.

---
**CONFIRMAÇÃO DE INTEGRIDADE:**
Declaro que a auditoria se limitou a *clones* em diretórios locais isolados (`temp_homol` e `temp_prod`). Nenhum *push* foi executado, nenhum `.clasp.json` da bancada foi modificado, e nenhuma linha de código, teste ou documentação do projeto foi alterada.
