# Especificação Técnica — Cômodo M03 Domínio

> **Código do Cômodo:** M03  
> **Nome:** Camada de Domínio  
> **Status:** SPEC APROVADA (AGUARDANDO EXECUÇÃO)  

---

## 1. Visão Geral e Responsabilidades

O cômodo **M03 Domínio** reúne as regras de negócio puras, modelos conceituais, entidades e Value Objects do SYNTHÉON GS. Ele representa a verdade conceitual do sistema, independente da forma de armazenamento (Google Sheets, Firebase ou arquivos JSON).

### Pertence ao M03:
- `Dominio/RegistroCanonico.js`
- `Dominio/RegistroAnalitico.js`
- `Dominio/Policial.js`
- `Dominio/Ocorrencia.js`
- `Dominio/OcorrenciaFactory.js`
- `Dominio/Equipe.js`
- `Dominio/Arma.js`
- `Dominio/Droga.js`
- `Dominio/ValueObjects/ChaveOcorrencia.js`

### Vedações (NÃO pertence ao M03):
- Leitura de planilhas ou chamadas a `SpreadsheetApp` (cômodo M02).
- Cálculo e compilação de rankings operacionais (cômodo M04).
- Geração de HTML, menus ou modais (cômodo M01).
- Aplicação de estilos de cor ou formatação de células (cômodo M06).

---

## 2. Regra de Preservação Visual (Transversal)

Toda entidade e objeto de valor do M03 deve preservar integralmente as propriedades que alimentam o M06 Relatórios. O Domínio não aplica cores nem estilos visuais, porém é **estritamente obrigado** a manter a fidelidade e riqueza dos dados de origem para que o M06 possa aplicar as regras de formatacão declaradas em `planta/02_SPECS/REGRA_TRANSVERSAL_FORMATACAO_RELATORIOS.md`.

---

## 3. Diretrizes de Imutabilidade e Pureza

1. **Pureza Total:** Zero imports de bibliotecas de infraestrutura de planilhas.
2. **Value Objects Imutáveis:** Instâncias de `ChaveOcorrencia`, `Arma` e `Droga` devem ser congeladas via `Object.freeze`.
3. **Fatos Canônicos:** O `RegistroCanonico` representa o evento imutável da ocorrência e não pode ser alterado após a instanciação.
