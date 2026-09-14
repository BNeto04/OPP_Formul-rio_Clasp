# ESPELHO — MotorAnaliticoV2.js

> [!NOTE] Espelho rico de código (Metodo §46.15) — gerado por `scripts/downplant/espelho-rico.mjs`
> Somente leitura. Não editar à mão: qualquer edição é sobrescrita na próxima geração.
> O código abaixo é cópia verbatim do arquivo de origem no commit declarado; divergência entre o embutido e a origem é deriva (§18.1).
> Regra do sha256 declarado: sha256 do conteúdo **normalizado para LF** (igual ao blob do Git). Em arquivo CRLF com terminador final diferente, ele difere do `sha256sum` dos bytes crus — a comparação de deriva é feita conteúdo-contra-conteúdo.
> Papel desta cópia: CANÔNICA (repositório). O derivado navegável no vault é gerado com as mesmas entradas.

- **Endereço Down Plant:** `C04_Motor / MOD-C04-01_MOTOR_ANALITICO` — [NOTA_DE_RESPONSABILIDADE.md](../../02_Comodos/C04_Motor/01_Dominio/modulos/MOD-C04-01_MOTOR_ANALITICO/NOTA_DE_RESPONSABILIDADE.md)
- **Arquivo de origem (link para o disco):** [`Motor/MotorAnaliticoV2.js`](../../Motor/MotorAnaliticoV2.js)
- **Commit de referência:** `fbb0608e7b98144533628c7f9b773a10505b800d` (`fbb0608`)
- **Data da última sincronização:** 2026-09-13T21:45:39-03:00

## Código-fonte embutido

Verbatim de `Motor/MotorAnaliticoV2.js` em `fbb0608`. sha256 do bloco (LF): `88d31d35a565b23bd1c958152d9cbb16d89a0dbeb6aac4042457e009e1b5e004` — 105 linhas.

```javascript
/**
 * ARQUIVO: Motor/MotorAnaliticoV2.js
 * PILAR 3: Motor Analítico (O Cérebro)
 * DESCRIÇÃO: O Motor deixou de ser um gigante de regras matemáticas e passou 
 * a ser um **Orquestrador de Plugins**. Ele recebe os fatos canônicos, 
 * dispara o ciclo de vida dos plugins (inicializar -> processar -> finalizar) 
 * e consolida o Registro Analítico.
 */
class MotorAnaliticoV2 {
  constructor() {
    this.plugins = [];
  }

  /**
   * Adiciona um plugin de métrica ao pipeline de processamento.
   * @param {IPluginMetrica} plugin 
   */
  registrarPlugin(plugin) {
    this.plugins.push(plugin);
  }

  /**
   * Executa a orquestração dos fatos sobre os plugins registrados.
   * @param {Array<RegistroCanonico>} fatosCanonicos 
   * @returns {Array<RegistroAnalitico>}
   */
  executar(fatosCanonicos) {
    const mapaPoliciais = {};
    const ocorrenciasProcessadas = new Set(); 

    fatosCanonicos.forEach(fato => {
      // Como o adaptador atualiza 1 PM por fato nesta versão
      const pmFato = fato.policiais[0]; 
      if (!pmFato || !pmFato.matricula) return;

      const matricula = pmFato.matricula;
      const chaveOcorrencia = fato.ocorrencia.chave;
      const chaveAtuacao = `${matricula}_${chaveOcorrencia}`;

      // Determina se é a primeira vez lendo este PM nesta ocorrência
      const primeiraVezNaOcorrencia = !ocorrenciasProcessadas.has(chaveAtuacao);
      if (primeiraVezNaOcorrencia) {
        ocorrenciasProcessadas.add(chaveAtuacao);
      }

      // Inicialização do PM no mapa
      if (!mapaPoliciais[matricula]) {
        mapaPoliciais[matricula] = {
          matricula: matricula,
          nome: pmFato.nome,
          grad: pmFato.graduacao,
          pelotao: pmFato.pelotao,
          historicoEscalas: [],
          fatos: {},
          indicadores: {}
        };
        // Notifica plugins para prepararem as chaves
        this.plugins.forEach(p => p.inicializar(mapaPoliciais[matricula]));
      }

      const consolidado = mapaPoliciais[matricula];

      // Rastreabilidade de Lotação (Regra core da plataforma, independe de métrica)
      if (pmFato.pelotao && pmFato.pelotao !== 'N/I') {
        consolidado.pelotao = pmFato.pelotao;
        if (!consolidado.historicoEscalas.includes(pmFato.pelotao)) {
          consolidado.historicoEscalas.push(pmFato.pelotao);
        }
      }

      // Processamento Delegado
      this.plugins.forEach(p => p.processar(fato, pmFato, consolidado, chaveAtuacao, primeiraVezNaOcorrencia));
    });

    // Finalização Delegada
    const resultadoAnalitico = [];
    Object.values(mapaPoliciais).forEach(consolidado => {
      this.plugins.forEach(p => p.finalizar(consolidado));
      resultadoAnalitico.push(new RegistroAnalitico(consolidado));
    });

    return resultadoAnalitico;
  }

  /**
   * Mantém a compatibilidade exata com a API estática usada na V1/V2 original.
   * Cria uma instância efêmera do Motor com os plugins institucionais padrão.
   */
  static processarProdutividadePolicial(fatosCanonicos) {
    const motor = new MotorAnaliticoV2();
    // Injeção de Dependências (Plugins)
    motor.registrarPlugin(new PluginOcorrencias());
    motor.registrarPlugin(new PluginArmas());
    motor.registrarPlugin(new PluginEntorpecentes());
    motor.registrarPlugin(new PluginPrisoes());
    motor.registrarPlugin(new PluginPontuacao());
    
    return motor.executar(fatosCanonicos);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MotorAnaliticoV2;
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

- Superfície exposta no nível do arquivo (nível global): `MotorAnaliticoV2`
- Membros públicos observados: `constructor`, `registrarPlugin`, `executar`, `processarProdutividadePolicial`

_Extraído por heurística do gerador (globais de nível arquivo + métodos/accessors de 1º–2º nível). Não substitui a declaração de porta da Planta: confirme no endereço acima._

## Divergência com a Planta declarada

Testes mecânicos executados na geração (commit `fbb0608`, 2026-09-13T21:45:39-03:00):

- OK — T1 endereco existe: NOTA_DE_RESPONSABILIDADE.md do modulo presente
- OK — T2 artefato declarado no endereco: "Motor/MotorAnaliticoV2.js" aparece na Planta
- OK — T3 arquivo presente no commit de referencia (fbb0608:Motor/MotorAnaliticoV2.js)
- OK — T4 conteudo em disco identico ao do commit de referencia (sha256 LF)
- OK — T5 espelho anterior sem deriva de codigo (sha256 do bloco == origem)
- OK — T6 endereco declarado no espelho anterior corresponde ao endereco canonico atual
- OK — T7 sem duplicidade: exatamente 1 espelho de leitura declara "Motor/MotorAnaliticoV2.js" como origem

Veredito mecânico: **nenhuma divergência detectada pelos testes acima**.

Declaração verificada a mão por humano/agente (não derivável automaticamente):

- **Como o endereco foi derivado (nao inventado):** secao Artefatos; fonte `02_Comodos/C04_Motor/01_Dominio/modulos/MOD-C04-01_MOTOR_ANALITICO/MOD-C04-01_MOTOR_ANALITICO.md`:59.
- **Nada foi corrigido no artefato:** o gerador nao altera codigo de produto; o arquivo de origem permanece byte a byte como estava.

## Última verificação (data/commit)

- 2026-09-13T21:45:39-03:00 · commit `fbb0608` · sha256 da origem (LF): `88d31d35a565b23bd1c958152d9cbb16d89a0dbeb6aac4042457e009e1b5e004`
- Reexecutar: `node scripts/downplant/espelho-rico.mjs gerar --endereco C04_Motor/MOD-C04-01_MOTOR_ANALITICO --origem Motor/MotorAnaliticoV2.js --saida <caminho>`
- Verificar deriva sem regravar: `node scripts/downplant/espelho-rico.mjs verificar --espelho <caminho>`
