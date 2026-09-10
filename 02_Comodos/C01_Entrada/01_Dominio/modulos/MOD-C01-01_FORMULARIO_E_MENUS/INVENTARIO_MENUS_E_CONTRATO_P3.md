# INVENTÁRIO DOS MENUS ATUAIS E CONTRATO DO MENU ÚNICO P3

Card: **#129** (MENU-P3-001) | Branch: `sprint/g01-guardiao-qualidade-live-001` | Regra ADM: #57
Módulo: `MOD-C01-01_FORMULARIO_E_MENUS` (C01_Entrada)
Natureza desta task: **somente inventário/documentação** — nenhum comportamento alterado, nenhum código de produto tocado.

## 1. Ponto de entrada único (confirmado)

`onOpen()` existe **em um único arquivo**: `Entrada/Menu.js` (linha 5). Não há `onOpen` duplicado no produto.
Hoje ele monta **5 menus superiores**: `Formulario`, `Armas`, `Produtividade`, `Pip`, `Drogas`.
Os builders `criarMenuArmas_` (Compilador_Armas.js) e `criarMenuDrogas_` (Compilador de Entorpecentes.js) são chamados por `onOpen` com guarda `typeof === 'function'`.

## 2. Matriz completa — ITEM_ATUAL | FUNCAO | MENU_ATUAL | MENU_P3_ALVO | MÓDULO/CIRCUITO | OBSERVAÇÃO

| # | ITEM_ATUAL | FUNCAO ALVO | MENU_ATUAL | MENU_P3_ALVO | MÓDULO/CIRCUITO | OBSERVAÇÃO |
|---|---|---|---|---|---|---|
| 1 | Nova ocorrencia (formulario) | `abrirFormularioEntrada` | Formulario | P3 > Formulário | C01 / MOD-C01-01 (Entrada/Formulario.html) | OK |
| 2 | Selecao livre (Armas) | `abrirMenuSelecaoLivre` | Armas | P3 > Armas | Compilador_Armas.js | **Nome duplicado** em `Compatibilidade.js:25` |
| 3 | Anual (Armas) | `iniciarModoAnual` | Armas | P3 > Armas | Compilador_Armas.js:23 | **Nome duplicado** em `Compatibilidade.js:30` |
| 4 | Gerar produtividade / comparativo 2026 | `abrirMenuComparativo2026` | Produtividade | P3 > Produtividade / Comparativo | Features/CompiladorProdutividade.js:14 | OK |
| 5 | Auditar Guardiao (seletor de meses) | `abrirSeletorMesesGuardiao` | Produtividade | P3 > Guardião da Qualidade | Entrada/SeletorMesesGuardiao.js:329 (+ DialogSeletorMesesGuardiao.html) | OK |
| 6 | Auditar aba atual | `executarGuardiaoQualidade` | Produtividade | P3 > Guardião da Qualidade | Features/GuardiaoQualidade.js:523 | OK |
| 7 | Sincronizar efetivo pelo peculio | `normalizarEfetivo` | Produtividade | P3 > Efetivo | Features/NormalizadorEfetivo.js:374 (MOD-C01-02) | OK — já consome ARCA (#127) |
| 8 | [Dev] Rodar teste de homologacao V1 x V2 | `rodarTesteDeHomologacao` | Produtividade | P3 > Desenvolvimento | Compatibilidade.js:60 | Duplicado em `Homologacao/` (pasta fora do push) |
| 9 | Pip > Gerar mensal | `abrirMenuPipMensal` | Pip | P3 > PIP / CPM | Compilador PIP.js:61 | OK |
| 10 | Pip > Selecao livre | `abrirMenuPipLivre` | Pip | P3 > PIP / CPM | Compilador PIP.js:89 | OK |
| 11 | Pip > Anual | `gerarPipAnual` | Pip | P3 > PIP / CPM | Compilador PIP.js:125 | OK |
| 12 | Cpm > Gerar mensal | `abrirMenuCPMMensal` | Pip | P3 > PIP / CPM | CPM – Compilador de Pontuação Mensal.js:64 | OK |
| 13 | Cpm > Selecao livre | `abrirMenuCPMLivre` | Pip | P3 > PIP / CPM | CPM – Compilador de Pontuação Mensal.js:92 | OK |
| 14 | Cpm > Anual | `gerarCPMAnual` | Pip | P3 > PIP / CPM | CPM – Compilador de Pontuação Mensal.js:128 | OK |
| 15 | Selecao livre (Drogas) | `abrirMenuSelecaoLivreDrogas` | Drogas | P3 > Drogas | Compilador de Entorpecentes.js:84 | OK |
| 16 | Anual (Drogas) | `iniciarModoAnualDrogas` | Drogas | P3 > Drogas | Compilador de Entorpecentes.js:69 | OK |

### 2.1 Entrypoints que EXISTEM e hoje NÃO têm entrada em menu (recuperar no P3)

| # | FUNCAO | ARQUIVO | MENU_ATUAL | MENU_P3_ALVO | OBSERVAÇÃO |
|---|---|---|---|---|---|
| 17 | `abrirMenuGxtSelecaoLivre` | Features/CompiladorGxt.js:567 | **nenhum** | P3 > Produtividade / Comparativo | GXT completo (seleção livre + anual) sem porta de entrada; diálogo `Entrada/DialogGxtSelecaoLivre.html` chama `gerarGxtSelecaoLivre` |
| 18 | `gerarGxtAnual` | Features/CompiladorGxt.js:737 | **nenhum** | idem | idem |
| 19 | `abrirMenuCentralAnaliticaSelecaoLivre` | Features/CentralAnalitica.js:41 | **nenhum** | P3 > Produtividade / Comparativo | Central Analítica sem porta de entrada |
| 20 | `rodarCentralAnaliticaAnual` | Features/CentralAnalitica.js:25 | **nenhum** | idem | idem |
| 21 | `abrirSeletorMesesGuardiaoPorTexto` | Entrada/SeletorMesesGuardiao.js:257 | **nenhum** | P3 > Guardião (variante) | Alternativa por texto ao seletor por botões; não exposta |

### 2.2 Builders de menu mortos (não chamados por `onOpen`)

- `criarMenuPip_` — `Compilador PIP.js:10` (menu legado `🏆 PIP` com emoji)
- `criarMenuCPM_` — `CPM – Compilador de Pontuação Mensal.js:15` (menu legado `⭐ CPM`)

Mantidos no código nesta fase (nenhuma remoção autorizada no #129); o P3 não deve usá-los.

### 2.3 Definições duplicadas no projeto Apps Script (risco real: a última carregada vence)

| FUNCAO | ARQUIVO A | ARQUIVO B |
|---|---|---|
| `abrirMenuSelecaoLivre` | `Compatibilidade.js:25` | `Compilador_Armas.js` |
| `iniciarModoAnual` | `Compatibilidade.js:30` | `Compilador_Armas.js` |
| `compilarProdutividadeAvancada` | `Compatibilidade.js` | `Features/CompiladorProdutividade.js` |
| `compilarProdutividadeRapida` | `Compatibilidade.js` | `Features/CompiladorProdutividade.js` |
| `rodarTesteDeHomologacao` | `Compatibilidade.js:60` | `Homologacao/RodarTesteDeHomologacao.js` (fora do push) |

`Compatibilidade.js` é um arquivo-sombra de compatibilidade que redefine funções vivas. **Não foi alterado nesta task** (fora do escopo); fica registrado para decisão do #130 (o menu P3 deve apontar para a implementação canônica, e a duplicidade precisa de um tratamento explícito).

## 3. Árvore canônica do menu único P3 (pronta para implementação no #130)

```
P3
├── Formulário
│   └── Nova ocorrência (formulário)              -> abrirFormularioEntrada
├── Armas
│   ├── Seleção livre                             -> abrirMenuSelecaoLivre
│   └── Anual                                     -> iniciarModoAnual
├── Drogas
│   ├── Seleção livre                             -> abrirMenuSelecaoLivreDrogas
│   └── Anual                                     -> iniciarModoAnualDrogas
├── Produtividade / Comparativo
│   ├── Gerar produtividade / comparativo 2026    -> abrirMenuComparativo2026
│   ├── GXT — seleção livre                       -> abrirMenuGxtSelecaoLivre      (RECUPERADO)
│   ├── GXT — anual                               -> gerarGxtAnual                 (RECUPERADO)
│   ├── Central Analítica — anual                 -> rodarCentralAnaliticaAnual    (RECUPERADO)
│   └── Central Analítica — seleção livre         -> abrirMenuCentralAnaliticaSelecaoLivre (RECUPERADO)
├── Guardião da Qualidade
│   ├── Auditar (seletor de meses)                -> abrirSeletorMesesGuardiao
│   ├── Auditar aba atual                         -> executarGuardiaoQualidade
│   └── (futuro) Normalizar com segurança         -> SOMENTE quando a função existir (#122)
├── Efetivo
│   └── Sincronizar efetivo pelo pécúlio          -> normalizarEfetivo
├── PIP / CPM
│   ├── PIP | Ciclo 29–28
│   │   ├── Gerar mensal                          -> abrirMenuPipMensal
│   │   ├── Seleção livre                         -> abrirMenuPipLivre
│   │   └── Anual                                 -> gerarPipAnual
│   └── CPM | Mês civil
│       ├── Gerar mensal                          -> abrirMenuCPMMensal
│       ├── Seleção livre                         -> abrirMenuCPMLivre
│       └── Anual                                 -> gerarCPMAnual
└── Desenvolvimento
    └── [Dev] Teste de homologação V1 x V2        -> rodarTesteDeHomologacao
```

## 4. Invariantes herdadas para o #130

1. **Nenhum entrypoint atual pode ser perdido** — os 16 itens da matriz §2 permanecem alcançáveis.
2. **Nenhuma função alvo é renomeada** nesta fase (o menu referencia nomes existentes).
3. **GXT e Central Analítica são recuperados** (hoje inalcançáveis pelo menu).
4. **Normalizador Seguro não entra** enquanto não existir função real (#122) — nada de item apontando para função inexistente.
5. Armas e Drogas deixam de ser menus superiores e viram submenus do P3.
6. Grupo `Desenvolvimento` isola itens `[Dev]`.
7. Construção defensiva: ausência de feature opcional não pode derrubar o restante do menu.
8. Menus superiores legados não podem ficar duplicados após o P3.
