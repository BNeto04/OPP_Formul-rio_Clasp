---
manifest: "DP-VAULT-1"
version: "2.1"
profile: "P1"
owner: "SYNTHEON"
trigger: "Manual/Linter"
namespaces:
  - "C00..C08"
  - "MOD-CXX-NN"
  - "SUB-CXX-NN-NN"
active_rooms:
  - "C00_Governanca_Estrutural"
  - "C01_Entrada"
  - "C02_Leitura"
  - "C03_Dominio"
  - "C04_Motor"
  - "C05_Guardiao"
  - "C06_Relatorios"
  - "C08_Homologacao"
conditional_directories:
  - "C07_Efetivo (Pendente de Fronteira Comprovada)"
  - "99_Arquivo_Transicao (NAO_APLICAVEL: condicional sem gatilho comprovado)"
---

# Estrutura do Cofre

Organização canônica do projeto SYNTHEON GS sob a metodologia Down Plant 2.1.

## Diretórios Raiz
- `00_Painel`: Entradas de documentação.
- `01_Planta`: Visão de arquitetura geral (Canvas).
- `02_Comodos`: Diretórios das fronteiras arquiteturais.
- `03_Fundacao`: Regras e manifesto do cofre.
- `06_Inventario`: Levantamento do estado "As Is".
- `07_Codigo_Leitura`: Referências ao código base.
- `08_Execucao_Ao_Vivo`: Rastreador de sessões ativas.
- `dependencias`: Registro das dependências externas e de dados do produto (§31.6) — criado no card #153. **Não** entra na varredura do lint.

## Diretórios Condicionais e Transição
Um diretório condicional só se materializa quando o gatilho é comprovado, com origem, dono e condição de encerramento (§40.2).

| Elemento | Estado | Gatilho de ativação | Dono | Condição de encerramento |
| --- | --- | --- | --- | --- |
| `C07_Efetivo` | condicional, não materializado | fronteira de domínio independente comprovada | Proprietário | consolidação da fronteira C07 |
| `99_Arquivo_Transicao` | NÃO_APLICÁVEL (condicional não ativado) | acervo legado em migração que precise ser preservado durante a transição | Proprietário | encerramento da migração correspondente |

`99_Arquivo_Transicao` **não** é materializado: a raiz já materializa os oito diretórios ativos (incluindo `dependencias`, criado no #153) e o `README.md` da taxonomia canônica; código e documentação vivos estão endereçados em `02_Comodos` e `07_Codigo_Leitura`; e não existe acervo legado aguardando transição. Criar a pasta sem origem, dono e encerramento seria estrutura ornamental e, pelo §40.8, um achado de "pasta de transição sem dono, motivo ou condição de encerramento". A ausência é decisão registrada, não divergência.

## Padrão de Cômodos (CXX)
Todo cômodo deve conter obrigatoriamente os seguintes seis slots físicos (diretórios com `INDICE.md`):
1. `00_Visao_Do_Comodo/INDICE.md`
2. `01_Dominio/INDICE.md`
3. `02_Integracoes/INDICE.md`
4. `03_Especificacoes/INDICE.md`
5. `04_Execucao/INDICE.md`
6. `05_Evidencias/INDICE.md`

## Módulos e Submódulos
Os módulos residem em `01_Dominio/modulos/MOD-CXX-NN_NOME/` e contêm:
- `NOTA_DE_RESPONSABILIDADE.md`
- `CIR-MOD-CXX-NN_NOME.canvas`
- Diretórios `portas/`, `contratos/`, `regras/`
- Submódulos em `submodulos/SUB-CXX-NN-NN_NOME/`

## Resultado do Lint
O lint estrutural (`scripts/downplant/lint-estrutura.mjs`) valida a integridade dessas regras.
