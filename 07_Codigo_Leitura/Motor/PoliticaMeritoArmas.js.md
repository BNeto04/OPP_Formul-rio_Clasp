# ESPELHO — PoliticaMeritoArmas.js

> [!NOTE] Espelho rico de código (Metodo §46.15) — gerado por `scripts/downplant/espelho-rico.mjs`
> Somente leitura. Não editar à mão: qualquer edição é sobrescrita na próxima geração.
> O código abaixo é cópia verbatim do arquivo de origem no commit declarado; divergência entre o embutido e a origem é deriva (§18.1).
> Regra do sha256 declarado: sha256 do conteúdo **normalizado para LF** (igual ao blob do Git). Em arquivo CRLF com terminador final diferente, ele difere do `sha256sum` dos bytes crus — a comparação de deriva é feita conteúdo-contra-conteúdo.
> Papel desta cópia: CANÔNICA (repositório). O derivado navegável no vault é gerado com as mesmas entradas.

- **Endereço Down Plant:** `C04_Motor / MOD-C04-01_MOTOR_ANALITICO` — [NOTA_DE_RESPONSABILIDADE.md](../../02_Comodos/C04_Motor/01_Dominio/modulos/MOD-C04-01_MOTOR_ANALITICO/NOTA_DE_RESPONSABILIDADE.md)
- **Arquivo de origem (link para o disco):** [`Motor/PoliticaMeritoArmas.js`](../../Motor/PoliticaMeritoArmas.js)
- **Commit de referência:** `fbb0608e7b98144533628c7f9b773a10505b800d` (`fbb0608`)
- **Data da última sincronização:** 2026-09-13T21:45:39-03:00

## Código-fonte embutido

Verbatim de `Motor/PoliticaMeritoArmas.js` em `fbb0608`. sha256 do bloco (LF): `0b146af98147aeb49ca81b424a9c1005eb3504bc388264303be1af7e78a3cbe8` — 216 linhas.

```javascript
/**
 * ARQUIVO: Motor/PoliticaMeritoArmas.js
 * DESCRIÇÃO: Motor puro de cálculo de Mérito de Equipe por Armas (TASK-M06.3-05I.2).
 * REGRA DE OURO: Agrupa ocorrências pelo túnel (DATA | MIKE | BOE).
 * ARMA é a fonte exclusiva de arma de fogo física (numérica). QDT ARMAS não entra no cálculo.
 * Reconhecimento de artesanal vem de indicadores textuais (TIPO/MODELO/ARMA), nunca de QDT ARMAS.
 * Pecúlio externo fornece apenas ORD; nome, graduação e pelotão do líder vêm da ocorrência mensal.
 * Atribui o mérito ao militar de menor N (mais antigo).
 */

const PoliticaMeritoArmas = {
  /**
   * Processa uma lista de ocorrências canônicas ou fatos estruturados e gera os registros de mérito.
   * @param {Array<Object>} ocorrencias - Lista de ocorrências com chave do túnel e integrantes.
   * @param {Object.<string, number>} mapaAntiguidade - Mapa { matricula: numeroN } de antiguidade.
   * @returns {Array<Object>} Registros de mérito calculados por túnel com status e atribuição.
   */
  processarMeritoArmas(ocorrencias, mapaAntiguidade = {}) {
    if (!Array.isArray(ocorrencias) || ocorrencias.length === 0) {
      return [];
    }

    const tuneis = {};

    // 1. Agrupar por túnel único (DATA | MIKE | BOE)
    ocorrencias.forEach(oc => {
      const dataStr = oc.data ? (oc.data instanceof Date ? oc.data.toISOString().split('T')[0] : String(oc.data)) : '';
      const mike = oc.mike || oc.chaveOcorrencia || oc.chave || '';
      const boe = oc.boe || '';

      const chaveTunel = (oc.chaveTunel || `${dataStr}_${mike}_${boe}`).toUpperCase();

      if (!tuneis[chaveTunel]) {
        tuneis[chaveTunel] = {
          chave: chaveTunel,
          data: oc.data,
          mike: mike,
          boe: boe,
          armasFogo: 0,
          armasArtesanais: 0,
          integrantes: {},
          linhas: []
        };
      }

      const t = tuneis[chaveTunel];
      t.linhas.push(oc);

      // Verificação textual de arma artesanal (NUNCA usa QDT ARMAS)
      const textCheck = `${oc.tipoArma || ''} ${oc.modelo || ''} ${oc.descricaoArma || ''} ${oc.arma || ''} ${oc.natureza || ''}`.toUpperCase();
      const isArtesanal = (oc.isArtesanal === true || oc.tipoArma === 'ARTESANAL' || textCheck.includes('ARTESANAL'));

      let qtdFogo = 0;
      let qtdArtesanal = 0;

      if (isArtesanal) {
        qtdArtesanal = 1;
        // Se houver armasFogo explicitado e positivo no caso de túnel duplo
        if (oc.armasFogo !== undefined && !isNaN(Number(oc.armasFogo)) && Number(oc.armasFogo) > 0) {
          qtdFogo = Number(oc.armasFogo);
        } else {
          qtdFogo = 0;
        }
      } else {
        const numVal = Number(oc.armas || oc.armasFogo || oc.armaFato || 0);
        qtdFogo = isNaN(numVal) ? 0 : numVal;
        qtdArtesanal = Number(oc.armasArtesanais || oc.qtdArtesanal || 0);
      }

      t.armasFogo += (isNaN(qtdFogo) ? 0 : qtdFogo);
      t.armasArtesanais += (isNaN(qtdArtesanal) ? 0 : qtdArtesanal);

      // Coleta os integrantes da equipe envolvidos no fato
      let pmsArray = [];
      if (Array.isArray(oc.policiais)) {
        pmsArray = oc.policiais;
      } else if (oc.policiais && typeof oc.policiais === 'object') {
        pmsArray = Object.values(oc.policiais);
      } else if (oc.matricula) {
        pmsArray = [oc];
      }

      pmsArray.forEach(pm => {
        const mat = String(pm.matricula || '').trim();
        if (!mat) return;

        if (!t.integrantes[mat]) {
          t.integrantes[mat] = {
            matricula: mat,
            nome: pm.nome || pm.policial || '',
            grad: pm.grad || pm.graduacao || '',
            pelotao: pm.pelotao || pm.designacao || pm.lote || ''
          };
        } else {
          // Preserva nome, grad e pelotão vindos da ocorrência mensal
          if (!t.integrantes[mat].nome && (pm.nome || pm.policial)) t.integrantes[mat].nome = pm.nome || pm.policial;
          if (!t.integrantes[mat].grad && (pm.grad || pm.graduacao)) t.integrantes[mat].grad = pm.grad || pm.graduacao;
          if (!t.integrantes[mat].pelotao && (pm.pelotao || pm.designacao)) t.integrantes[mat].pelotao = pm.pelotao || pm.designacao;
        }
      });
    });

    const resultados = [];

    // 2. Processar cada túnel com apreensão de armas
    Object.values(tuneis).forEach(t => {
      const totalFatosFisicos = t.armasFogo + t.armasArtesanais;
      if (totalFatosFisicos <= 0) return; // Ignora túneis sem armas

      const listaIntegrantes = Object.values(t.integrantes);
      if (listaIntegrantes.length === 0) {
        resultados.push({
          chaveTunel: t.chave,
          data: t.data,
          mike: t.mike,
          boe: t.boe,
          qtdArmas: t.armasFogo,
          armasFogo: t.armasFogo,
          armasArtesanais: t.armasArtesanais,
          totalFatosFisicos: totalFatosFisicos,
          status: 'PENDENTE_AUDITORIA',
          motivoPendente: 'SEM_INTEGRANTES',
          lider: null,
          integrantes: []
        });
        return;
      }

      let menorN = Infinity;
      let candidatosLider = [];
      let temIntegranteSemN = false;

      listaIntegrantes.forEach(pm => {
        const normMat = String(pm.matricula || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().trim();
        const n = mapaAntiguidade[pm.matricula] !== undefined ? mapaAntiguidade[pm.matricula] : mapaAntiguidade[normMat];
        const numN = Number(n);

        if (n === undefined || n === null || isNaN(numN) || numN <= 0) {
          temIntegranteSemN = true;
          pm.numN = null;
        } else {
          pm.numN = numN;
          if (numN < menorN) {
            menorN = numN;
            candidatosLider = [pm];
          } else if (numN === menorN) {
            candidatosLider.push(pm);
          }
        }
      });

      // Em caso de participante sem N cadastrado ou empate estrito de N, sinaliza pendência auditável
      if (temIntegranteSemN || candidatosLider.length === 0) {
        resultados.push({
          chaveTunel: t.chave,
          data: t.data,
          mike: t.mike,
          boe: t.boe,
          qtdArmas: t.armasFogo,
          armasFogo: t.armasFogo,
          armasArtesanais: t.armasArtesanais,
          totalFatosFisicos: totalFatosFisicos,
          status: 'PENDENTE_AUDITORIA',
          motivoPendente: 'ANTIGUIDADE_AUSENTE',
          lider: null,
          integrantes: listaIntegrantes
        });
        return;
      }

      if (candidatosLider.length > 1) {
        resultados.push({
          chaveTunel: t.chave,
          data: t.data,
          mike: t.mike,
          boe: t.boe,
          qtdArmas: t.armasFogo,
          armasFogo: t.armasFogo,
          armasArtesanais: t.armasArtesanais,
          totalFatosFisicos: totalFatosFisicos,
          status: 'PENDENTE_AUDITORIA',
          motivoPendente: 'EMPATE_ANTIGUIDADE',
          lider: null,
          integrantes: listaIntegrantes
        });
        return;
      }

      // Líder único de menor N definido: nome, grad e designação vêm da ocorrência mensal
      const vencedor = candidatosLider[0];
      resultados.push({
        chaveTunel: t.chave,
        data: t.data,
        mike: t.mike,
        boe: t.boe,
        lider: vencedor.nome,
        grad: vencedor.grad,
        matricula: vencedor.matricula,
        designacao: vencedor.pelotao,
        numN: vencedor.numN,
        qtdArmas: t.armasFogo, // Apenas armas de fogo numéricas para soma dos cards
        armasFogo: t.armasFogo,
        armasArtesanais: t.armasArtesanais,
        totalFatosFisicos: totalFatosFisicos,
        status: 'PROCESSADO',
        integrantes: listaIntegrantes
      });
    });

    return resultados;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PoliticaMeritoArmas;
}
```

## Responsabilidade observada

Fonte: `02_Comodos/C04_Motor/01_Dominio/modulos/MOD-C04-01_MOTOR_ANALITICO/MOD-C04-01_MOTOR_ANALITICO.md` — CAPSULA do modulo (formato 46.2), "## Responsabilidade".

Consolidar os fatos canonicos em **Registro Analitico** e calcular o **merito por armas**. Depois da
refatoracao, o Motor e um **orquestrador de plugins**: recebe fatos, dispara o ciclo de vida
(`inicializar -> processar -> finalizar`) e consolida o resultado.

Fonte: `02_Comodos/C04_Motor/01_Dominio/modulos/MOD-C04-01_MOTOR_ANALITICO/MOD-C04-01_MOTOR_ANALITICO.md` — CAPSULA do modulo (formato 46.2), "## Limites".

- **Nao le planilha** e **nao grava**: consome fatos e devolve registros.
- **Nao reimplementa regra de dominio:** as tabelas/limiares vivem na ARCA e em `Core/Constantes.js`.
- **Nao usa `QDT ARMAS` como arma fisica.** `ARMA` e a **fonte exclusiva** de arma de fogo fisica; o
  reconhecimento de artesanal vem de indicadores textuais (`TIPO`/`MODELO`/`ARMA`), nunca de `QDT ARMAS`.
- **Nao infere lideranca por outro criterio:** o merito vai ao militar de **menor `N`** (mais antigo).

## Portas expostas (se aplicável)

- Superfície exposta no nível do arquivo (nível global): `PoliticaMeritoArmas`
- Membros públicos observados: `processarMeritoArmas`

_Extraído por heurística do gerador (globais de nível arquivo + métodos/accessors de 1º–2º nível). Não substitui a declaração de porta da Planta: confirme no endereço acima._

## Divergência com a Planta declarada

Testes mecânicos executados na geração (commit `fbb0608`, 2026-09-13T21:45:39-03:00):

- OK — T1 endereco existe: NOTA_DE_RESPONSABILIDADE.md do modulo presente
- OK — T2 artefato declarado no endereco: "Motor/PoliticaMeritoArmas.js" aparece na Planta
- OK — T3 arquivo presente no commit de referencia (fbb0608:Motor/PoliticaMeritoArmas.js)
- OK — T4 conteudo em disco identico ao do commit de referencia (sha256 LF)
- OK — T5 espelho anterior sem deriva de codigo (sha256 do bloco == origem)
- OK — T6 endereco declarado no espelho anterior corresponde ao endereco canonico atual
- OK — T7 sem duplicidade: exatamente 1 espelho de leitura declara "Motor/PoliticaMeritoArmas.js" como origem

Veredito mecânico: **nenhuma divergência detectada pelos testes acima**.

Declaração verificada a mão por humano/agente (não derivável automaticamente):

- **Como o endereco foi derivado (nao inventado):** secao Artefatos; fonte `02_Comodos/C04_Motor/01_Dominio/modulos/MOD-C04-01_MOTOR_ANALITICO/MOD-C04-01_MOTOR_ANALITICO.md`:59.
- **Enderecos concorrentes declarados na Planta (2):** `C06_Relatorios/MOD-C06-02_MERITO_DE_ARMAS_GXT`, `C03_Dominio/MOD-C03-01_MODELO_DE_OCORRENCIA`. O artefato e referenciado em mais de um endereco; o campo acima registra o endereco PRIMARIO. Nao e erro de endereco — e declaracao concorrente na propria Planta.
- **Nada foi corrigido no artefato:** o gerador nao altera codigo de produto; o arquivo de origem permanece byte a byte como estava.

## Última verificação (data/commit)

- 2026-09-13T21:45:39-03:00 · commit `fbb0608` · sha256 da origem (LF): `0b146af98147aeb49ca81b424a9c1005eb3504bc388264303be1af7e78a3cbe8`
- Reexecutar: `node scripts/downplant/espelho-rico.mjs gerar --endereco C04_Motor/MOD-C04-01_MOTOR_ANALITICO --origem Motor/PoliticaMeritoArmas.js --saida <caminho>`
- Verificar deriva sem regravar: `node scripts/downplant/espelho-rico.mjs verificar --espelho <caminho>`
