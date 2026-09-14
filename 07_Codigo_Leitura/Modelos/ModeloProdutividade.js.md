# ESPELHO — ModeloProdutividade.js

> [!NOTE] Espelho rico de código (Metodo §46.15) — gerado por `scripts/downplant/espelho-rico.mjs`
> Somente leitura. Não editar à mão: qualquer edição é sobrescrita na próxima geração.
> O código abaixo é cópia verbatim do arquivo de origem no commit declarado; divergência entre o embutido e a origem é deriva (§18.1).
> Regra do sha256 declarado: sha256 do conteúdo **normalizado para LF** (igual ao blob do Git). Em arquivo CRLF com terminador final diferente, ele difere do `sha256sum` dos bytes crus — a comparação de deriva é feita conteúdo-contra-conteúdo.
> Papel desta cópia: CANÔNICA (repositório). O derivado navegável no vault é gerado com as mesmas entradas.

- **Endereço Down Plant:** `C06_Relatorios / MOD-C06-01_RELATORIOS_OFICIAIS` — [NOTA_DE_RESPONSABILIDADE.md](../../02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-01_RELATORIOS_OFICIAIS/NOTA_DE_RESPONSABILIDADE.md)
- **Arquivo de origem (link para o disco):** [`Modelos/ModeloProdutividade.js`](../../Modelos/ModeloProdutividade.js)
- **Commit de referência:** `fbb0608e7b98144533628c7f9b773a10505b800d` (`fbb0608`)
- **Data da última sincronização:** 2026-09-13T21:45:37-03:00

## Código-fonte embutido

Verbatim de `Modelos/ModeloProdutividade.js` em `fbb0608`. sha256 do bloco (LF): `a70fb4ccd46fb61632208f7e604589b50faef5482e21bc9c5b22af65f3567b45` — 43 linhas.

```javascript
/**
 * ARQUIVO: Modelos/ModeloProdutividade.js
 * DESCRIÇÃO: Define as regras de exibição e ordenação para o relatório
 * de Produtividade Geral. Delega o preenchimento físico das colunas para o Schema.
 */

class ModeloProdutividade extends IRelatorioModelo {
  constructor() {
    super();
    // Opcionalmente podemos injetar um tema aqui futuramente
  }

  obterTitulo() {
    return "PRODUTIVIDADE_GERAL_V2";
  }

  obterColunas() {
    return ProdutividadeSchema.getHeaders();
  }

  formatarLinha(registroAnalitico) {
    return ProdutividadeSchema.formatarLinha(registroAnalitico);
  }

  ordenarDados(registrosAnaliticos) {
    // A lógica de ordenação sai do Compilador e vem morar no Modelo.
    return registrosAnaliticos.sort((a, b) => {
      // 1. Maior pontuação total primeiro
      if (b.indicadores.pontosTotais !== a.indicadores.pontosTotais) {
        return b.indicadores.pontosTotais - a.indicadores.pontosTotais;
      }
      // 2. Desempate: Mais ocorrências atendidas
      if (b.fatos.ocorrencias !== a.fatos.ocorrencias) {
        return b.fatos.ocorrencias - a.fatos.ocorrencias;
      }
      // 3. Ordem alfabética pelo nome
      if (a.nome && b.nome) {
        return a.nome.localeCompare(b.nome);
      }
      return 0;
    });
  }
}
```

## Responsabilidade observada

Fonte: `02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-01_RELATORIOS_OFICIAIS/MOD-C06-01_RELATORIOS_OFICIAIS.md` — CAPSULA do modulo (formato 46.2), "## Responsabilidade".

Gerar e publicar os **relatorios oficiais** do produto - em especial o `COMPARATIVO_2026` (produtividade
consolidada por policial) - a partir dos fatos canonicos, com renderizacao propria.

Fonte: `02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-01_RELATORIOS_OFICIAIS/MOD-C06-01_RELATORIOS_OFICIAIS.md` — CAPSULA do modulo (formato 46.2), "## Limites".

- **Nao decide regra de dominio:** consome o que o C04 consolidou e o que a ARCA declara.
- **Nao corrige a fonte:** quando o valor publicado diverge, o defeito e rastreado ate a origem
  (o #152 separa "defeito do produto" de "defeito da entrada").
- **Nao inventa valor:** a ordem de entrega de armas segue a regra do proprietario (score desc, empate por
  antiguidade - R10) e a divergencia fica **registrada**, nao resolvida por conveniencia.

## Portas expostas (se aplicável)

- Superfície exposta no nível do arquivo (nível global): `ModeloProdutividade`
- Membros públicos observados: `constructor`, `super`, `obterTitulo`, `obterColunas`, `formatarLinha`, `ordenarDados`

_Extraído por heurística do gerador (globais de nível arquivo + métodos/accessors de 1º–2º nível). Não substitui a declaração de porta da Planta: confirme no endereço acima._

## Divergência com a Planta declarada

Testes mecânicos executados na geração (commit `fbb0608`, 2026-09-13T21:45:37-03:00):

- OK — T1 endereco existe: NOTA_DE_RESPONSABILIDADE.md do modulo presente
- OK — T3 arquivo presente no commit de referencia (fbb0608:Modelos/ModeloProdutividade.js)
- OK — T4 conteudo em disco identico ao do commit de referencia (sha256 LF)
- OK — T5 espelho anterior sem deriva de codigo (sha256 do bloco == origem)
- OK — T6 endereco declarado no espelho anterior corresponde ao endereco canonico atual
- OK — T7 sem duplicidade: exatamente 1 espelho de leitura declara "Modelos/ModeloProdutividade.js" como origem
- **ACHADO** — T2 artefato NAO declarado no endereco: "Modelos/ModeloProdutividade.js" nao aparece nas NOTAS/capsula de C06_Relatorios / MOD-C06-01_RELATORIOS_OFICIAIS

Veredito mecânico: **1 divergência(s) detectada(s) pelos testes acima**.

Declaração verificada a mão por humano/agente (não derivável automaticamente):

- **Como o endereco foi derivado (nao inventado):** menção em arquivo do próprio endereço; fonte `02_Comodos/C06_Relatorios/01_Dominio/modulos/MOD-C06-01_RELATORIOS_OFICIAIS/CIR-MOD-C06-01_RELATORIOS_OFICIAIS.canvas`.
- **Enderecos concorrentes declarados na Planta (1):** `C04_Motor/MOD-C04-01_MOTOR_ANALITICO`. O artefato e referenciado em mais de um endereco; o campo acima registra o endereco PRIMARIO. Nao e erro de endereco — e declaracao concorrente na propria Planta.
- **Nada foi corrigido no artefato:** o gerador nao altera codigo de produto; o arquivo de origem permanece byte a byte como estava.

## Última verificação (data/commit)

- 2026-09-13T21:45:37-03:00 · commit `fbb0608` · sha256 da origem (LF): `a70fb4ccd46fb61632208f7e604589b50faef5482e21bc9c5b22af65f3567b45`
- Reexecutar: `node scripts/downplant/espelho-rico.mjs gerar --endereco C06_Relatorios/MOD-C06-01_RELATORIOS_OFICIAIS --origem Modelos/ModeloProdutividade.js --saida <caminho>`
- Verificar deriva sem regravar: `node scripts/downplant/espelho-rico.mjs verificar --espelho <caminho>`
