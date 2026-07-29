# Regra Transversal — Formatação Dos Relatórios

## Status

ATIVA / OBRIGATÓRIA

## Objetivo

Preservar a aparência operacional dos relatórios já aprovados visualmente na planilha, especialmente o `COMPARATIVO_2026` e relatórios derivados.

## Regra

Nenhuma refatoração de leitura, domínio, motor, guardião ou relatório pode remover, simplificar ou alterar silenciosamente as regras visuais já empregadas nos relatórios oficiais.

## Formatações Protegidas

### Pelotões / Subunidades

As cores por grupo devem ser preservadas:

- Oficiais
- 1º PEL
- 2º PEL
- 3º PEL
- 1º PEL GTAR
- 2º PEL GTAR
- Registros fora do Pecúlio, quando aplicável

### Armas

A escala visual de quantidade de armas deve ser preservada:

- 0 armas: destaque quando a regra do relatório exigir chamar atenção
- 1 a 3
- 4 a 5
- 6 a 9
- 10+

A formatação deve continuar permitindo leitura rápida de quem participou ou não de apreensão de arma.

### Comparativo 2026

O relatório `COMPARATIVO_2026` deve preservar:

- Cabeçalho institucional;
- Ordenação definida;
- Cores por pelotão/subunidade;
- Destaque visual de armas;
- Formatos numéricos legíveis;
- Congelamento/organização visual;
- Carimbo/metadados no local definido;
- Layout compatível com a apresentação operacional.

### PIP / Prévia

Relatórios PIP e prévias devem preservar:

- Pontuação formatada de forma legível;
- Designação/subunidade quando necessária;
- Ordenação por pontuação;
- Filtros úteis para Looker Studio;
- Campos necessários para conferência pelos policiais.

## Critério de Aceite

Qualquer alteração em renderizadores deve ser validada visualmente contra uma versão anterior aprovada.

A alteração só é aceita se:

- Os dados continuam corretos;
- A formatação operacional foi preservada;
- A leitura humana não piorou;
- Nenhuma cor semântica foi perdida;
- Os testes automatizados continuam passando.

## Cômodo Dono

M06 Relatórios.

## Cômodos Obrigados a Respeitar

- M01 Entrada
- M02 Leitura
- M03 Domínio
- M04 Motor
- M05 Guardião
- M06 Relatórios
- M07 Efetivo
- M08 Homologação/Testes
