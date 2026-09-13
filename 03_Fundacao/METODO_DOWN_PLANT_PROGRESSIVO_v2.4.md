<!--
MÉTODO DOWN PLANT PROGRESSIVO — VERSÃO 2.4
Fonte: texto fornecido pelo Proprietário (Manoel) em 13/09/2026, gravado verbatim.
Registrado por: HERMES. Card de referência: #57 (régua das quatro pontas).
SHA-256 do corpo: bf720099fd26597b3d7e5d373490f76c003b831c202ae2370698de09efb76942
NÃO EDITAR ESTE TEXTO — é a constituição metodológica. Alterações exigem §45 (versionamento semântico) e §5.3 (mudança constitucional).
-->

Método Down Plant Progressivo
Versão: 2.4 Tipo: constituição metodológica, referência operacional, sistema de governança e protocolo estrutural para humanos e agentes Aplicação: projetos novos, sistemas legados, automações, produtos digitais, integrações, dados, agentes de IA e software de alta confiabilidade Estado: candidata a baseline; validação progressiva em projeto real

Sumário
Propósito
Escopo e limites
Axiomas
Fontes de verdade
Constituição do projeto
Frentes inseparáveis
Papéis e responsabilidades
Ontologia espacial
Relação com C4 e DDD
Linguagem ubíqua
Gramáticas visuais
Portas e Design by Contract
Falha ruidosa e contenção
Fatias verticais
Pipeline Spec-Anchored
Ciclo completo de um Módulo
Correspondência bidirecional
Detecção de deriva arquitetural
Estados
Portões de passagem
Sistemas legados
Estratégia de testes
Mocks e runtimes proprietários
Evidência, proveniência e cadeia de custódia
Perfis de rigor
Segurança por construção
Privacidade e governança de dados
Acessibilidade e experiência humana
Observabilidade e confiabilidade
Desempenho e capacidade
Dependências, supply chain e tecnologia existente
Governança de agentes de IA
Ambientes, entrega e publicação
Git e controle de mudança
Canvas e integridade estrutural
Incidentes e recuperação
Depreciação e encerramento
Métricas do método
Escala, paralelismo e dependências
Estrutura documental
Critério de conclusão
Regra de parada
Antipadrões
Maturidade e adoção
Evolução e versionamento
Modelos operacionais
Referências técnicas

1. Propósito
O Down Plant Progressivo é um método para construir sistemas mantendo arquitetura, requisitos, código, testes, ambientes, documentação, evidências e estado estrutural sincronizados desde o início.
O sistema é tratado como um espaço navegável.
Cada capacidade deve:
possuir localização;
possuir responsabilidade;
possuir fronteiras;
declarar suas conexões;
possuir contrato proporcional;
representar seu comportamento quando não trivial;
materializar-se em artefatos reais;
ser testada;
produzir evidência;
declarar seu estado;
permanecer rastreável durante planejamento, execução e manutenção.
O princípio central é:
Nenhuma capacidade dependente pode avançar além do portão exigido enquanto requisito, localização, fluxo, código, teste, evidência e estado não contarem a mesma história.
O Down Plant não é um agente. O Down Plant não decide, executa ou programa por conta própria. Ele é: estrutura, mapa, linguagem e protocolo.
Humanos, agentes de IA, ferramentas e automações utilizam essa estrutura para saber:
onde estão;
em que estão trabalhando;
com o que aquilo se conecta;
o que podem alterar;
o que não podem alterar;
qual estado receberam;
qual estado podem produzir;
quando precisam parar.
INTENÇÃO
   ↓
PLANEJAMENTO
   ↓
LOCALIZAÇÃO DOWN PLANT
   ↓
TAREFA
   ↓
EXECUÇÃO
   ↓
PROVA
   ↓
RECONCILIAÇÃO
   ↓
ESTADO ATUALIZADO
O método busca reduzir: perda de contexto; desenvolvimento por adivinhação; vibe coding sem estrutura; documentação retrospectiva e imprecisa; código sem responsabilidade localizada; agentes trabalhando fora do espaço autorizado; expansão silenciosa de escopo; arquitetura fictícia; regressões silenciosas; fallbacks perigosos; mistura de projetos; publicações sem destino conferido; estados verdes sem prova; dependência excessiva da memória humana; dependência excessiva do contexto interno de modelos; dependência de um fornecedor específico de IA; reconstrução integral de contexto para pequenas modificações; e reimplementação de capacidades que já existem prontas fora do projeto.

2. Escopo e limites
O Down Plant pode ser aplicado a: aplicações web; aplicações móveis; desktop; scripts; automações; Apps Script; planilhas; APIs; microsserviços; pipelines de dados; integrações; sistemas orientados a eventos; produtos com IA; sistemas multiagente; sistemas legados; software de alta confiabilidade.
A ontologia pode futuramente ser aplicada a outros domínios de engenharia, desde que sejam definidos contratos e artefatos apropriados.
O método não afirma, por si só: correção matemática; ausência total de defeitos; conformidade legal automática; segurança absoluta; substituição de especialistas; equivalência a certificação externa; que toda técnica seja adequada a todo projeto; que uma representação visual seja prova de funcionamento; que um agente compreenda corretamente o projeto apenas por possuir acesso à documentação; que uma biblioteca externa encontrada por busca seja automaticamente adequada sem avaliação de risco.
Ter a skill Down Plant instalada não significa estar navegando pelo Down Plant. A navegação precisa ocorrer operacionalmente.

3. Axiomas
3.1 Ordem de criação
Cada elemento nasce dentro de seu elemento pai.
Terreno
├── Instalação transversal
└── Planta Geral
    └── Cômodo
        └── Módulo
            └── Submódulo
                └── Porta
                    └── Funções, algoritmos e artefatos
Não se cria Módulo sem Cômodo. Não se implementa função sem localizar sua responsabilidade. Não se cria Submódulo apenas para aumentar a taxonomia. Instalações transversais possuem âncora declarada. Módulos dependentes não avançam antes que seus predecessores alcancem o portão necessário.
3.2 Correspondência bidirecional
Toda implementação deve poder ser auditada nas duas direções:
Fluxo → Código
Código → Fluxo
E, quando houver agentes:
Tarefa → Localização → Implementação
Implementação → Localização → Tarefa
3.3 Fatias verticais
O projeto avança por capacidades pequenas e completas. Não por longas fases isoladas de código, documentação, arquitetura ou teste.
3.4 Verdade comprovada
Estado não é herdado. Cada nível exige sua própria prova.
3.5 Falha ruidosa
Ausência de precondição vital interrompe o fluxo explicitamente. Ambiguidade não autoriza avanço.
3.6 Uma única fatia ativa
Por padrão, somente uma fatia recebe selo 🔵 por responsável e espaço de trabalho. Paralelismo exige independência comprovada.
3.7 Preservação histórica
Erros são corrigidos por novos registros e commits. O passado não é apagado para simular perfeição.
3.8 Proporcionalidade
O rigor cresce conforme risco, impacto, irreversibilidade e criticidade.
3.9 Materialização governada
Raiz, Cômodos e Módulos obedecem a esquema estrutural versionado. Diferença sem perfil, gatilho, manifesto ou decisão constitui deriva.
3.10 Localização antes da ação
Nenhuma ação operacional deve começar sem uma localização Down Plant proporcional ao conhecimento disponível. A localização mínima normalmente é Terreno → Cômodo → Módulo; usar Submódulo/Circuito/Porta quando a tarefa alterar comportamento observável nesse nível.
Aplicação operacional deste axioma: §32.5.
3.11 Conexão é entidade arquitetural
Uma conexão não é apenas uma linha visual. Ela possui significado. Pode representar: chamada; dependência; fluxo de dados; evento; compartilhamento de estado; retorno; autorização; sincronização; integração externa. Conexões relevantes devem possuir origem, destino e contrato.
3.12 Descoberta não é autorização
Ao descobrir trabalho adicional, humano ou agente deve separar:
DESCOBRIR ≠ EXECUTAR
O fluxo correto é:
DETECTAR → LOCALIZAR → REGISTRAR → DEVOLVER AO PLANEJAMENTO
salvo quando a tarefa original já autorizar explicitamente a extensão.
Aplicação operacional deste axioma: §32.9.
3.13 Auto-similaridade estrutural
A tríade Elemento → Porta → Circuito se aplica recursivamente em qualquer profundidade da ontologia espacial (§8), não apenas no nível do Módulo.
Dois Módulos simples, ao serem incorporados a um Módulo composto, tornam-se Submódulos desse composto — perdem seu status de Módulo independente, mas preservam responsabilidade, contrato e Porta próprios.
Sempre que dois elementos do mesmo nível se conectam, existe uma Porta em cada ponta e um Circuito descrevendo a travessia entre elas — seja entre Submódulos dentro de um Módulo, entre Módulos dentro de um Cômodo, ou entre Cômodos dentro do Terreno.
Para evitar ambiguidade sobre qual escala uma referência descreve, o endereçamento e o Circuito declaram a escala explicitamente: submodulo, modulo ou comodo (ver nomenclatura em §40.4 e o campo escala em §46.12).
A Porta é o ponto de travessia (o "trilho" de conexão); o Circuito é a representação do comportamento ao longo desses trilhos, na escala em que estiver declarado.
Este axioma não cria uma nova camada — apenas declara que a ontologia de §8 é fractal, e que nenhum nível está isento de possuir Porta e Circuito quando conecta elementos do mesmo tipo.

4. Fontes de verdade
4.1 Verdade normativa
Requisitos, regras, contratos e decisões aprovadas definem o comportamento desejado.
4.2 Verdade operacional
Código e configuração efetiva definem o comportamento AS-IS.
4.3 Verdade empírica
Testes, telemetria e homologação demonstram comportamento observado.
4.4 Espelho navegacional humano e agêntico
O Obsidian e demais representações Down Plant tornam responsabilidades, relações, contratos e evidências navegáveis. O espelho serve tanto ao humano quanto aos agentes. Ele deve possibilitar responder: Onde estou? O que existe aqui? Quem é responsável? Com o que isso se conecta? Qual é o estado? Quais artefatos materializam isso?
O espelho não substitui código executável. Ele fornece coordenadas estruturais sobre ele. O mesmo princípio se aplica ao par YAML/Markdown do handoff entre agentes: ver §46.11/§46.12.
4.5 Conflitos
Não existe correção automática. Quando fontes divergirem:
requisito correto e código divergente → corrigir código;
código AS-IS correto e fluxo errado → corrigir fluxo;
requisito obsoleto → revisar requisito;
evidência contraditória → investigar;
localização estrutural divergente → reconciliar;
YAML e Markdown do handoff divergentes → o YAML vence; a divergência em si é deriva a ser reportada pelo Curador (§7.7);
dúvida não resolvida → 🔴 e parar.

5. Constituição do projeto
Todo Terreno deve possuir 03_Fundacao/CONSTITUICAO.md.
A Constituição contém princípios estáveis que orientam humanos e agentes. Inclui: propósito; fronteiras; princípios invioláveis; convenções; testes; segurança; dados; acessibilidade; qualidade; ambientes; publicação; Git; agentes de IA; regra de parada; navegação estrutural; processo de alteração constitucional.
5.1 Hierarquia
Constituição
  → Requisitos e regras
    → Especificação
      → Plano
        → Tasks
          → Código e testes
Cada camada deve preservar localização e intenção da anterior.
5.2 Núcleo e extensões
Núcleo obrigatório: identidade; fronteira; manifesto; localização; contrato; estado; evidência mínima; Git; ambiente; parada.
Extensões condicionais: segurança avançada; privacidade; acessibilidade; SLO; desempenho; supply chain; recuperação; segregação.
5.3 Mudança constitucional
Exige: motivo; impacto; elementos afetados; aprovação humana; versão; vigência; estratégia de migração.

6. Frentes inseparáveis
Frente Papel
F1 — Código e Git implementação, configuração e histórico
F2 — Bancada offline testes, mocks e diagnóstico
F3 — Homologação prova integrada humana ou operacional
F4 — Down Plant/Obsidian estrutura, Planta, Circuitos, contratos, decisões e evidências
Produção é ambiente separado.
6.1 Sincronização mínima
Uma alteração relevante deve, conforme aplicabilidade, produzir: mudança em F1; prova em F2; homologação em F3; atualização estrutural em F4. A ausência momentânea de sincronização deve ser detectável.

7. Papéis e responsabilidades
Uma pessoa ou agente pode acumular funções. As responsabilidades continuam distintas.
7.1 Proprietário
Define objetivo, prioridade, risco aceitável, decisões estratégicas, autorização de publicação. Permanece fora da microgestão operacional sempre que regras confiáveis permitirem.
7.2 Planejador
Transforma intenção ampla em problemas menores. Deve: interpretar objetivo; localizar a fatia; identificar dependências; selecionar Cômodo e Módulo; definir contrato; definir Circuito afetado; estabelecer escopo; selecionar testes; determinar parada; gerar tarefas executáveis, cada uma com um downplant_handoff válido (§32.14). O Planejador é responsável pelo pensamento de decomposição, não pela implementação detalhada.
7.3 Executor
Recebe uma tarefa suficientemente localizada, via downplant_handoff (§46.12).
Deve: confirmar coordenadas; executar somente o escopo; testar; registrar evidência; informar divergências; parar. Maximiza competência dentro do perímetro recebido; não trata descoberta de trabalho relacionado como autorização implícita (§3.12). Não reinterpreta a intenção global quando o planejamento já resolveu essa questão.
7.4 Conferidor
Audita artefatos, diff, testes, contratos, ambiente, localização, correspondência e o checklist de produção das Portas afetadas (§12.6).
7.5 Homologador
Confirma comportamento no ambiente autorizado.
7.6 Guardião da Constituição
Avalia mudanças que alterem princípios, fronteiras ou perfil.
7.7 Curador estrutural
Mantém manifesto, posições canônicas, referências, estado estrutural e compatibilidade entre código e espelho. Pode ser humano, agente ou automação. Um Curador automatizado pode observar mudanças em Git e verificar se a representação Down Plant correspondente permanece atualizada — incluindo divergência entre o downplant_handoff (YAML) e seu espelho em Markdown (§4.5).
O Curador não toma decisões arquiteturais por conta própria:
OBSERVA → COMPARA → DETECTA → ATUALIZA O QUE FOR MECÂNICO
                              ou
                            → REPORTA O QUE EXIGIR DECISÃO
7.8 Vigia de dependências
Papel irmão do Curador Estrutural, mas voltado para fora do projeto em vez de para dentro. Responsável por manter o inventário de tecnologia existente vinculada a Módulos, Circuitos e Portas (§31.4-31.6) atualizado, e por sinalizar quando uma dependência externa vinculada sofre atualização relevante upstream.
O Vigia não decide adotar ou trocar uma dependência por conta própria — apenas observa, compara e reporta ao Planejador ou Proprietário, da mesma forma que o Curador Estrutural opera em relação ao código interno.
7.9 Independência
Mudanças críticas não devem ser executadas e homologadas pelo mesmo participante sem controle adicional.

8. Ontologia espacial
8.1 Terreno
Delimita o produto.
8.2 Planta Geral
Mostra Cômodos, vizinhança, principais Portas, conexões, estados, quantidade de Módulos.
8.3 Cômodo
Agrupa capacidades de responsabilidade funcional coesa.
8.4 Módulo
Entrega uma capacidade verificável. Possui responsabilidade, contrato, fluxo, código, testes, evidências. Um Módulo composto por mais de um Módulo simples incorpora esses últimos como Submódulos (§3.13).
8.5 Submódulo
Recorte interno com fronteira e responsabilidade claras. Pode ser, na origem, um Módulo simples incorporado a um Módulo composto (§3.13).
8.6 Porta
Contrato formal de travessia. Existe em qualquer nível da ontologia onde dois elementos do mesmo tipo se conectam (§3.13): Porta de Submódulo, Porta de Módulo, Porta de Cômodo.
8.7 Pino
Elemento visual opcional de navegação. Estado metodológico: experimental.
8.8 Circuito
Representação funcional do comportamento real. Assim como a Porta, existe em múltiplas escalas (§3.13) — circuito entre Submódulos, circuito entre Módulos, circuito entre Cômodos — e o endereçamento declara em qual escala está operando.
8.9 Conexão
Ligação semanticamente definida entre elementos. Deve permitir responder: quem chama; quem recebe; o que passa; quando; em qual direção; sob qual contrato.
8.10 Artefato
Exemplos: código; configuração; interface; schema; teste; script; adaptador; evidência.
8.11 Instalação transversal
Capacidade técnica compartilhada. Exemplos: observabilidade; autenticação; auditoria; configuração; transporte; tratamento de erro. Deve possuir: ID; versão; âncora; contrato; consumidores; Portas; dados permitidos; falhas; observabilidade; responsável; testes.
8.12 Espelho AS-IS
Representação navegável do artefato vivo.
8.13 Fachada e UI
UI pertence ao Terreno, mas não deve absorver regras que pertencem ao domínio.
[UI] → PORTA → [MÓDULO] → PORTA → [SERVIÇO/EFEITO]

9. Relação com C4 e DDD
As abordagens são complementares.
Down Plant C4 possível DDD possível
Terreno Landscape/context context map
Planta System Context/Container relações
Cômodo system/container bounded context quando real
Módulo component serviço/aggregate/application service
Porta interface command/event/repository contract
Circuito dynamic view fluxo de caso de uso
Não forçar equivalências. A linguagem operacional principal continua sendo Down Plant.

10. Linguagem ubíqua
Todo projeto possui léxico controlado. Registrar: termo; significado; sinônimos; termos legados; dono semântico; exemplos; artefatos; posição; identificadores. Planejamento, execução, código, UI e testes devem utilizar os mesmos conceitos. Nenhuma skill ou agente introduz vocabulário próprio fora deste léxico (ver §32 para a regra correspondente em governança de agentes).

11. Gramáticas visuais
11.1 Espacial
Responde: Onde?
11.2 Funcional
Responde: Como funciona?
entrada → Porta → validação → função → decisão → efeito → saída
11.3 Circuito Molecular
A cadeia principal mostra etapas reais. Contratos, regras e observabilidade aparecem como ramificações. Serviços externos permanecem fora da fronteira. Specs, Tasks e evidências orbitam o Circuito sem fingir que executam o fluxo.
11.4 Natureza e estado
Natureza arquitetural e estado são informações diferentes. Cor não deve significar maturidade. Estado deve possuir símbolo ou selo explícito.
11.5 Espelhos ricos
Canvas → documento → espelho AS-IS → código vivo → teste/evidência
11.6 Legibilidade
Exigir: títulos completos; funções legíveis; ausência de sobreposição; conexões inequívocas; destinos navegáveis; fronteiras claras; evidências fora do fluxo executável.

12. Portas e Design by Contract
Toda Porta possui contrato.
12.1 require
Precondições.
12.2 ensure
Pós-condições.
12.3 invariant
Condições preservadas pelo Módulo.
12.4 Falha
require violado → problema do chamador; ensure violado → problema do fornecedor; invariant violado → estado inválido.
12.5 Contratos executáveis
Preferir quando viável: tipos; assertions; JSON Schema; OpenAPI; banco; runtime validation; testes de contrato.
12.6 Checklist de produção da Porta
Toda Porta que cruza Cômodo, expõe efeito externo ou lida com concorrência deve declarar, como parte do seu ensure/invariant, o checklist de produção:
checklist_producao:
  idempotente: aplicavel | nao_aplicavel | pendente
  deduplicacao: aplicavel | nao_aplicavel | pendente
  rate_limit: aplicavel | nao_aplicavel | pendente
  paginacao: aplicavel | nao_aplicavel | pendente
  validacao_entrada: aplicavel | nao_aplicavel | pendente
  operacao_atomica: aplicavel | nao_aplicavel | pendente
  race_condition: aplicavel | nao_aplicavel | pendente
  cache: aplicavel | nao_aplicavel | pendente
  retry_pelo_cliente: aplicavel | nao_aplicavel | pendente
Um item pendente bloqueia a Porta em G7 (verificação) — mesmo peso de um ensure não satisfeito (§12.4). Quando a resposta a um item já está coberta por uma Instalação transversal existente (§8.11), referenciar a instalação em vez de repeti-la.

13. Falha ruidosa e contenção
Detectar perto da origem. Conter propagação.
13.1 Comportamento
bancada → falha explícita; serviço → erro tipado; UI → mensagem útil; pipeline → bloqueio; produção → degradação ou contenção prevista.
13.2 Fallback
Somente se: contratado; observável; testado; não esconder perda; representado no Circuito; possuir condição de retirada quando provisório.

14. Fatias verticais
Uma fatia contém: localização; contrato; fluxo; algoritmo; implementação; testes; evidências; homologação quando aplicável; documentação; estado.
14.1 Proibição de antecipação
Não implementar fatia futura por conveniência.
14.2 Documentação como efeito
Documentação deve nascer junto da engenharia.

15. Pipeline Spec-Anchored
Constitution → Specify → Clarify → Plan → Checklist → Tasks →
Analyze → Implement → Reconcile → Converge → Homologate*
As etapas são responsabilidades lógicas. Podem compartilhar artefatos. Não podem desaparecer quando aplicáveis.
15.1 Specify
Definir o quê e por quê.
15.2 Clarify
Remover ambiguidades.
15.3 Plan
Definir arquitetura, localização, contratos, riscos e testes. Quando um Módulo, Circuito ou Porta tiver função identificável, incluir a busca de tecnologia existente (§31.4) antes de comprometer a implementação própria.
15.4 Checklist
Criar verificações, incluindo o checklist de produção (§12.6) quando aplicável.
15.5 Tasks
Produzir unidades executáveis e localizadas, cada uma com downplant_handoff válido (§32.14).
15.6 Analyze
Conferir consistência.
15.7 Implement
Executar tarefa aprovada.
15.8 Reconcile
Comparar mapa e realidade.
15.9 Converge
Retornar problemas à etapa responsável.
15.10 Homologate
Provar comportamento no ambiente correto.

16. Ciclo completo de um Módulo
selecionar Módulo elegível;
marcar 🔵;
localizar no Cômodo;
confirmar endereço Down Plant;
definir contrato;
buscar tecnologia existente para a função do Módulo (§31.4) e registrar decisão de adotar, adaptar ou construir;
desenhar Circuito;
especificar algoritmo;
definir risco;
gerar plano;
decompor em Tasks;
aprovar;
executar;
testar;
reconciliar;
corrigir deriva;
registrar evidências;
homologar;
publicar quando autorizado;
observar;
atualizar AS-IS;
atualizar espelho;
aplicar estado comprovado;
versionar contrato;
parar.

17. Correspondência bidirecional
Matriz mínima:
ID Localização Requisito Nó Contrato Função Teste Evidência Estado
Bloqueiam avanço: requisito sem localização; Task sem Módulo; nó sem função; função sem nó quando Circuito exigido; Porta sem contrato; Porta com item pendente no checklist de produção quando aplicável (§12.6); teste que não chama implementação real; efeito sem Porta; evidência sem ambiente; schema alterado sem decisão; futuro apresentado como AS-IS; execução fora do endereço autorizado; downplant_handoff que falhe o contrato de entrada (§32.14).

18. Deriva arquitetural
18.1 Derivas
Exemplos: função pública sem registro; Porta removida ainda presente; payload divergente; arquivo movido com link quebrado; verde sem teste; dependência não inventariada; escrita em Módulo read-only; regra de domínio na UI; aresta desaparecida; pasta fora do esquema; Task executada em Módulo diferente do planejado; alteração de conexão não refletida; agente expandindo escopo por inferência; YAML e Markdown do handoff divergentes (§4.5); dependência externa vinculada desatualizada em relação à versão registrada (§31.6).
18.2 Linter arquitetural
Verificar: Canvas; IDs; arestas; links; assinaturas; schemas; rastreabilidade; estados; evidências; referências; manifesto; nomes; posições; duplicações.
18.3 Bloqueio
Deriva crítica bloqueia promoção.

19. Estados
Selo Estado
⚪ não iniciado
🔵 ativo
🟡 parcial
🟢 comprovado
🔴 divergente
⏸️ estacionado
Estados podem ser dimensionais, por exemplo:
Contrato: 🟢
Código: 🟢
Teste: 🟢
Integração: 🟡
Visual: 🟢
Publicação: ⚪
Mudança relevante reabre estado.

20. Portões
Portão Exigência
G0 identidade
G1 Constituição
G2 contrato
G3 fluxo
G4 plano
G5 implementação
G6 reconciliação
G7 verificação
G8 evidência
G9 homologação
G10 liberação
G11 observação
G12 fechamento
Portões são catálogo lógico. Não significam necessariamente treze documentos.

21. Sistemas legados
21.1 Etapas
Baseline; inventário; dependências; AS-IS; fluxo; testes; divergências; arquitetura desejada; migração por fatia; compatibilidade; reconciliação. Não inventar modularidade inexistente.
Um projeto que já avançou antes da adoção do Down Plant entra neste modo por padrão: o código está à frente da Planta, e o primeiro trabalho é reconstruir a visão geral fiel ao que já existe — não construir capacidade nova. O Cômodo correspondente permanece 🟡 LEGADO ESTRUTURAL enquanto essa reconstrução estiver em curso.
O vínculo entre Planta e código nesse modo deve ser real, não narrativo: preferir espelhos ricos (§46.15) que embutem o código-fonte real e mantêm link vivo para o arquivo em disco, em vez de descrições em prosa sobre o que o código supostamente faz.
21.2 Critério de retomada de fatia de produto
O modo legado não tem duração própria — precisa de critério de saída explícito, para que o Cômodo não permaneça indefinidamente em autopreservação sem que ninguém perceba que o produto parou de avançar.
Um Cômodo em 🟡 LEGADO ESTRUTURAL está pronto para retomar fatias de produto como prioridade padrão quando, cumulativamente:
todo Módulo ativo do Cômodo possui espelho rico vinculado ao código real (§21.1), sem espelho pendente conhecido;
nenhuma Auditoria (§7.4, tipo AUDIT) do Cômodo está com rejeição em aberto;
o Proprietário confirma explicitamente que a visão geral do Cômodo foi restabelecida.
Atingido o critério, o Cômodo muda para 🟢 CATCH-UP CONCLUÍDO e o Planejador retoma fatias de produto (§14) como prioridade padrão. Task adicional de mapeamento nesse Cômodo passa a exigir justificativa explícita (ex: divergência nova detectada) em vez de ser gerada por rotina.
Enquanto o critério não for atingido, o Planejador deve declarar no handoff (§46.12) que a Task em curso é de catch-up estrutural, não de produto — para que a proporção entre as duas fique visível sem depender de auditoria manual do histórico (ver métrica em §38).

22. Estratégia de testes
Selecionar proporcionalmente: unidade; contrato; propriedade; integração; E2E; regressão; estrutural; visual; acessibilidade; desempenho; segurança; migração; recuperação; idempotência; concorrência; dados; análise estática.
Caminhos mínimos incluem: sucesso; vazio; limites; inválido; dependência ausente; timeout; permissão; efeito proibido; erro fatal; repetição; concorrência quando aplicável.

23. Mocks e runtimes proprietários
Mocks devem: chamar função real; simular somente fronteira necessária; registrar parâmetros; falhar em chamada inesperada; cobrir sucesso e erro.
Mock não prova: produção; rede real; permissões reais; integração completa; comportamento interno do fornecedor.

24. Evidência e proveniência
Toda evidência deve informar proporcionalmente: ID; localização; requisito; ambiente; commit; data; entrada; função; comando; resultado; saída; executor; limite; risco residual.
24.1 Integridade
Maior criticidade pode exigir: hash; assinatura; imutabilidade; trilha.
24.2 Honestidade
Canvas não prova execução; mock não prova produção; push não prova funcionamento; relatório não é prova automática; agente não deve validar sua própria alegação apenas por tê-la produzido; resultado de busca de tecnologia existente não prova adequação sem avaliação de risco (§31.5).

25. Perfis de rigor
P0 — Experimental: protótipo de baixo risco. P1 — Operacional: uso recorrente e impacto reversível. P2 — Alto impacto: dados sensíveis, finanças, público relevante ou automações importantes. P3 — Crítico: risco à vida, direitos, infraestrutura ou perdas graves.
O núcleo — identidade; localização; contrato; estado; teste; evidência; parada — permanece obrigatório.

26. Segurança por construção
Segurança é transversal. Considerar: ameaças; menor privilégio; segredos; validação; autorização; dependências; análise; logging; release; efeitos externos. Referenciais externos podem ser usados conforme risco.

27. Privacidade e dados
Todo dado relevante deve possuir: origem; finalidade; classificação; dono; schema; retenção; descarte; acesso; transformação; qualidade; linhagem; destino.

28. Acessibilidade
Interfaces devem considerar: teclado; foco; nomes acessíveis; contraste; mensagens; tamanho de alvo; texto alternativo; redimensionamento; linguagem; recuperação de erro.

29. Observabilidade
Sinais: logs; métricas; traces; eventos; correlação.
Módulos relevantes definem: começo; fim; sucesso; erro; latência; volume; dependências; informações proibidas.

30. Desempenho e capacidade
Definir conforme necessidade: latência; volume; pico; payload; memória; quota; custo; timeout; sobrecarga.

31. Dependências, supply chain e tecnologia existente
31.1 Inventário
Inventariar: diretas; transitivas; versão; licença; origem; hash; vulnerabilidade; dono; atualização.
31.2 Princípio de não reimplementação
Antes de construir uma capacidade do zero, verificar se ela já existe pronta fora do projeto. Isso vale tanto para código quanto para a decisão arquitetural que o Módulo, Circuito ou Porta representa.
31.3 Quando se aplica
A busca de tecnologia existente se aplica quando um Módulo, Submódulo, Circuito ou Porta tem função identificável — ou seja, quando é possível descrever "isto serve para X" de forma específica o bastante para comparar com soluções prontas. Não se aplica a elementos puramente organizacionais (ex: um Cômodo, ou um Módulo que só agrupa outros) nem a lógica de negócio proprietária que não corresponde a um problema genérico.
31.4 Fluxo de busca
Ao planejar um Módulo, Circuito ou Porta com função identificável (§15.3, §16 passo 6):
DEFINIR FUNÇÃO
   ↓
BUSCAR framework, biblioteca, API, plugin ou repositório existente
   ↓
AVALIAR: manutenção ativa, licença, compatibilidade, risco de dependência,
         superfície de ataque, adequação ao perfil de rigor (§25)
   ↓
DECIDIR: adotar | adaptar | construir
   ↓
REGISTRAR decisão como Decisão (§46.4) vinculada ao endereço Down Plant
A decisão de construir do zero quando existe alternativa pronta deve ser justificada (ex: licença incompatível, risco de dependência, requisito não coberto, restrição de perfil P2/P3) — não é automaticamente proibida, mas não pode ser silenciosa.
31.5 Avaliação de risco
Encontrar uma solução pronta não é adequação automática (§24.2). Avaliar proporcionalmente ao perfil (§25): manutenção ativa; comunidade ou fornecedor; licença compatível; superfície de ataque; histórico de vulnerabilidades; acoplamento resultante; custo de saída caso a dependência seja descontinuada.
31.6 Vínculo e monitoramento
Quando uma dependência externa é adotada para a função de um Módulo, Circuito ou Porta, registrar o vínculo no manifesto ou na cápsula do Módulo (§40.5): nome, versão, fonte, data da decisão, Decisão associada (§46.4).
O Vigia de dependências (§7.8) observa periodicamente essas dependências vinculadas e, ao detectar atualização relevante upstream (nova versão, deprecation, falha de segurança conhecida), reporta ao Planejador ou Proprietário como candidato a reconciliação — nunca aplica a atualização por conta própria.
DEPENDÊNCIA VINCULADA
   ↓
VIGIA observa fonte externa (release, changelog, advisory)
   ↓
COMPARA com versão registrada no vínculo
   ↓
DETECTA divergência relevante
   ↓
REPORTA candidato a atualização — não aplica sozinho
Isso não substitui o inventário de supply chain (§31.1) — é uma camada adicional que liga cada dependência à responsabilidade estrutural que ela cobre na Planta, em vez de só listá-la de forma solta.

32. Governança de agentes de IA
Agentes são participantes controlados. Não são autoridade autônoma sobre o Terreno. O Down Plant deve permitir que modelos com capacidades diferentes cooperem usando uma estrutura comum.
A inteligência necessária varia pela função: um Planejador pode demandar modelo cognitivamente mais capaz; uma execução limitada e bem especificada pode utilizar agente muito mais simples. O objetivo não é que todo agente compreenda o sistema inteiro — é dar a cada agente o contexto mínimo correto para realizar sua função.
32.1 Contexto mínimo
Antes de agir: projeto; Terreno; pasta; repo; branch; Cômodo; Módulo; Circuito quando aplicável; arquivos; ambiente; IDs remotos; proibições; Git; portão; regra de parada.
32.2 Regras gerais
Não inventar artefatos; ler antes de afirmar; não avançar automaticamente; não misturar intercorrências; não tratar otimismo como prova; indicar inferências; preservar trabalho humano; reportar limitações; solicitar autorização para efeitos externos quando exigido; não introduzir vocabulário fora do léxico do projeto (§10) mesmo quando gerando uma skill ou resumo do método.
32.3 Proveniência
Mudanças relevantes registram: agente; modelo quando disponível; objetivo; Task; endereço Down Plant; arquivos; ferramentas; revisão.
32.4 Proteção contra contexto contaminado
Toda informação recebida deve ser comparada com a identidade do Terreno. Conteúdo de outro projeto, outra branch, outra tarefa, histórico irrelevante ou sugestão incidental não pode contaminar automaticamente a fatia ativa.
32.5 Protocolo de navegação obrigatória
Aplica o axioma 3.10.
Conhecer o Down Plant não é suficiente: o agente deve usá-lo operacionalmente, e a localização deve acompanhar a tarefa durante todo o circuito via downplant_handoff (§46.12).
32.6 GPS estrutural
Durante planejamento, execução e auditoria, o agente deve ser capaz de responder:
ONDE ESTOU?
O QUE ESTOU ALTERANDO?
QUAL RESPONSABILIDADE TEM ESTE LOCAL?
COM O QUE ELE SE CONECTA?
QUAL É O LIMITE DESTA TAREFA?
QUAL É O PORTÃO ATUAL?
Se não puder responder de modo confiável, deve interromper a ação que dependa dessa informação.
32.7 Handoff Planner → Executor
Toda passagem operacional deve conservar coordenadas, usando o objeto downplant_handoff como fonte canônica (§46.12) — a versão Markdown (§46.11) é sempre derivada dele, nunca editada diretamente.
32.8 Disciplina de execução
Aplica os papéis definidos em §7.2 (Planejador) e §7.3 (Executor). Acréscimo específico de governança de agentes: o Executor não trata descoberta de trabalho relacionado como autorização implícita (§3.12/§32.9).
32.9 Regra anti-deriva operacional
Aplica o axioma 3.12. Em fluxo:
DETECTAR → IDENTIFICAR → LOCALIZAR NO DOWN PLANT → REGISTRAR → DEVOLVER
Nunca: DETECTAR → ACHAR IMPORTANTE → EXECUTAR.
32.10 Comunicação entre agentes
A conversa não é fonte estrutural da verdade. Ela transporta intenção e estado. Referências estruturais devem apontar para objetos Down Plant. Preferível: "Em C00/MOD-C00-01, corrigir P00..." em vez de "Corrija aquela validação." A linguagem natural pode continuar existindo; ela passa a possuir coordenadas.
32.11 Agentes de diferentes capacidades
Não se exige que todos os agentes possuam mesma inteligência geral.
INTENÇÃO HUMANA
      ↓
PLANNER (modelo de maior capacidade)
      ↓
decomposição + localização
      ↓
TASKS
      ↓
EXECUTORES ESPECIALIZADOS
      ↓
ferramentas
O modelo deve ser selecionado de acordo com a responsabilidade. A arquitetura Down Plant deve evitar acoplamento obrigatório a um fornecedor.
32.12 Memória curta e memória persistente
Agentes podem trabalhar com memória operacional pequena:
MEMÓRIA PERSISTENTE
        ↑ arquivamento
ESTADO ATUAL
   ↙️        ↘️
Planner   Executor
Agentes recebem somente o necessário para a tarefa atual. Histórico completo permanece disponível para auditoria ou consulta excepcional. O objetivo é reduzir tokens, ruído, contaminação, contradições e dependência de contexto longo.
32.13 Curador e sincronização estrutural
Um agente especializado pode cuidar da correspondência entre Git ↔️ Down Plant ↔️ Obsidian. Esse agente deve ser predominantemente mecânico. Ao detectar mudança: identifica commits relevantes; resolve Cômodos/Módulos afetados; compara representação; verifica estado; atualiza informações deriváveis com segurança; sinaliza ambiguidades; não inventa arquitetura. Se o Cômodo já estiver sincronizado: NO-OP.
32.14 Contrato de entrada do handoff
Aplica o Design by Contract da §12 ao próprio objeto downplant_handoff, tornando a navegação estrutural verificável em vez de apenas recomendada.
require:
  - downplant.comodo presente e não vazio
  - downplant.modulo presente e não vazio
  - downplant.escala ∈ {submodulo, modulo, comodo}
  - task.id presente, único e rastreável a Task existente
  - escopo.arquivos não vazio quando task.acao implicar alteração de arquivo
  - escopo.pode_expandir explicitamente true ou false (nunca ausente)
  - estado.portao_atual e estado.portao_destino presentes

ensure:
  - toda Task aceita pelo Executor referencia um downplant_handoff válido
  - todo commit gerado a partir da Task carrega task.id no histórico Git

invariant:
  - um Executor nunca inicia execução com handoff que falhe o require
require violado é problema do chamador (§12.4) — um handoff incompleto bloqueia antes da execução, com a mesma seriedade de uma Porta de código malformada. Isso pode ser auditado hoje, manualmente, pelo Conferidor (§7.4); quando automatizado, o require acima já está pronto para virar schema formal de validação.

33. Ambientes e publicação
Fluxo típico: Local → Teste → Homologação → Produção. Cada promoção exige evidência.
Pull, push, deploy, escrita externa e ativação são permissões distintas.

34. Git
Princípios: commits pequenos; branch identificada; diff revisado; árvore declarada; escopo preservado; sem reset destrutivo não autorizado; correção por novo commit; decisão estrutural registrada.
Git representa história operacional. Down Plant representa localização e sentido arquitetural. Os dois não se substituem.

35. Canvas e integridade
Auditar: JSON; IDs; arestas; links; caminhos; nós; estados.
Reprovar visualmente quando: texto estiver cortado; houver sobreposição; conexão for ambígua; destino não funcionar; estado estiver incoerente.

36. Incidentes
Fluxo: detectar; conter; preservar evidência; localizar impacto; comunicar; recuperar; validar; analisar; corrigir sistema e método.

37. Depreciação
Registrar: motivo; consumidores; substituto; compatibilidade; prazo; migração; dados; acessos; evidência de desligamento. Aplica-se também a dependências externas vinculadas (§31.6) quando descontinuadas upstream.

38. Métricas
Fluxo: tempo por fatia; tempo por portão; bloqueios; retrabalho; lote.
Correspondência: requisitos localizados; funções com nó; Portas contratadas; testes com evidência; links; deriva.
Agentes: Tasks executadas sem expansão de escopo; correções de localização; intercorrências devolvidas corretamente; quantidade média de contexto; custo por Task; retrabalho provocado por interpretação errada; handoffs rejeitados pelo contrato de entrada (§32.14).
Dependências: capacidades cobertas por tecnologia existente vs. construídas do zero; dependências vinculadas desatualizadas detectadas pelo Vigia (§7.8/§31.6).
Catch-up estrutural (§21.2): proporção de Tasks de catch-up vs. Tasks de produto por Cômodo e por ciclo; Módulos ativos com espelho rico pendente; Auditorias com rejeição em aberto. Um Cômodo em 🟡 LEGADO ESTRUTURAL cuja proporção de catch-up permanece dominante por muitos ciclos seguidos, sem aproximar-se do critério de retomada (§21.2), é sinal de que o mapeamento não está convergindo — motivo para revisão humana, não motivo para gerar mais Tasks de mapeamento automaticamente.
As métricas não devem virar objetivo artificial.

39. Escala, paralelismo e dependências
39.1 Grafo
Módulos declaram predecessores e conexões.
39.2 Paralelismo
Permitido quando: fatias independentes; contratos estáveis; arquivos sem colisão; responsáveis distintos; branches separadas; integração governada.
39.3 Programas grandes
Decompor em specs independentes. IDs referenciados tornam-se estáveis.
39.4 Sistemas de múltiplos agentes
Escalar agentes não deve significar criar um grande contexto compartilhado.
ESTRUTURA COMUM
      ↓
TASKS LOCALIZADAS
 ↙️      ↓      ↘️
A1      A2      A3
Cada agente recebe somente o contexto correspondente à responsabilidade.

40. Estrutura documental
40.1 DP-ESTRUTURA-001
Todo projeto usa a mesma lógica estrutural. Perfil define profundidade.
40.2 Raiz
README.md
00_Painel/
01_Planta/
02_Comodos/
03_Fundacao/
06_Inventario/
07_Codigo_Leitura/
08_Execucao_Ao_Vivo/
99_Arquivo_Transicao/
Pastas técnicas não contam como taxonomia documental.
40.3 Cômodo
CXX/
├── 00_Visao_Do_Comodo/
├── 01_Dominio/
├── 02_Integracoes/
├── 03_Especificacoes/
├── 04_Execucao/
├── 05_Evidencias/
└── 99_Historico/
40.4 Nomenclatura
Elemento Exemplo
Cômodo C00
Módulo MOD-C00-01_AUTH
Submódulo SUB-C00-01-01_LOGIN
Porta P00
Porta externa PE-01
Regra REG-C00-001_STATUS
Circuito (módulo) CIR-MOD-C00-01_AUTH.canvas
Circuito (submódulo) CIR-SUB-C00-01-01_X.canvas
Circuito (cômodo) CIR-COM-C00_X.canvas
Spec SPEC-C00-001_NOME.md
Task TASK-C00-001_NOME.md
Evidência EVD-C00-001_NOME.md
Endereço global: C00/MOD-C00-01/P00.
40.5 Cápsula
01_Dominio/
└── modulos/
    └── MOD-CXX-NN_NOME/
        ├── MOD-CXX-NN_NOME.md
        ├── CIR-MOD-CXX-NN_NOME.canvas
        ├── submodulos/
        ├── portas/
        ├── contratos/
        ├── regras/
        └── dependencias/         # vínculos de tecnologia existente (§31.6)
40.6 Materialização proporcional
P0 pode ser compacto. P1 exige operação repetível. P2 exige controles reforçados.
P3 exige formalidade crítica. Não criar documentos vazios para aparentar conformidade.
40.7 Manifesto
03_Fundacao/ESTRUTURA_DO_COFRE.md:
---
downplant_schema: DP-VAULT-1
downplant_version: "2.4"
perfil_base: P1
padrao_de_comodo: DP-ROOM-1
padrao_de_modulo: DP-MODULE-1
migracao_legada: progressiva
---
Registrar: estrutura; perfil; IDs; namespaces; condicionais; Cômodos; exceções; transições; último lint.
40.8 Lint
Detectar: taxonomia inválida; ausência estrutural; IDs inconsistentes; artefatos fora da posição; duplicações; links quebrados; Canvas inválido; nós sem implementação; espelhos órfãos; referências sem namespace; Tasks sem localização quando exigida; handoff que falhe o contrato de entrada (§32.14); dependência vinculada sem registro de decisão (§31.4).
Lint não corrige arquitetura por conta própria.
40.9 Legado
Migrar progressivamente. Não reorganizar tudo por estética.
40.10 Contra burocracia
A estrutura existe para reduzir complexidade, não multiplicá-la.
raiz → Cômodo → posição → Módulo → Submódulo/artefato

41. Critério de conclusão
Um Módulo fica 🟢 quando, conforme aplicabilidade: responsabilidade definida; localização válida; Constituição atendida; contrato consistente; checklist de produção sem itens pendentes quando a Porta se aplica (§12.6); decisão de tecnologia existente registrada quando a função se aplica (§31.4); Circuito válido; código reconciliado; invariantes preservadas; testes aprovados; efeitos proibidos ausentes; riscos tratados; evidência registrada; homologação concluída; links navegáveis; manifesto válido; lint aprovado; AS-IS atualizado; commits identificados; publicação comprovada quando aplicável; nenhuma divergência oculta.

42. Regra de parada
Ao concluir: parar; informar localização; informar Task; informar resultado; listar arquivos; declarar contratos; apresentar testes; apresentar evidências; informar commits; informar Git; informar ambiente; informar divergências; registrar trabalho descoberto fora do escopo; indicar próximo passo seguro; aguardar nova decisão quando necessária.
O Executor não inicia automaticamente a próxima Task dependente.

43. Antipadrões
vibe coding sem contrato; tarefa sem localização; agente com skill Down Plant que não usa o mapa; instrução como "mexa nisso" sem referência rastreável; expansão de escopo por iniciativa do Executor; arquitetura futura apresentada como AS-IS; documentação atrasada; código avançando sem espelho; Módulo dependente iniciado cedo; pasta inventada; migração global por estética; arquivo fictício; fallback silencioso; verde por herança; mock como produção; Canvas inválido visualmente; publicação sem destino; dependência não inventariada; relatório sem conferência; histórico apagado; agente recebendo o repositório inteiro quando uma fatia basta; usar modelo de alta capacidade para trabalho mecânico sem necessidade; usar modelo simples para decomposição complexa sem controle suficiente; conversas entre agentes sem coordenadas estruturais; reinventar método paralelo com vocabulário próprio em vez de estender o Down Plant existente; reimplementar do zero uma capacidade que já existe pronta sem registrar a decisão (§31.4); adotar dependência externa sem avaliação de risco proporcional ao perfil (§31.5).

44. Maturidade
Nível 0 — Ad hoc: sem estrutura consistente. Nível 1 — Visível: Terreno, Cômodos e Módulos identificados. Nível 2 — Repetível: Tasks, contratos, testes e evidências padronizados. Nível 3 — Reconciliado: mapa e implementação comparados regularmente. Nível 4 — Automatizado: lint, deriva, contratos e sincronização entram na automação. Nível 5 — Adaptativo: métricas e experiência real refinam o método.
44.1 Maturidade agêntica
A0 — Conversacional: agente trabalha apenas por prompts. A1 — Localizado: agente recebe Cômodo/Módulo. A2 — Contratado: agente recebe endereço, escopo e parada. A3 — Cooperativo: Planner e Executor realizam handoff estruturado, validado pelo contrato de entrada (§32.14). A4 — Auto-sincronizado: Curador verifica Git ↔️ Down Plant automaticamente; Vigia verifica dependências externas vinculadas (§7.8).
A5 — Orquestrado: Planner seleciona agentes conforme capacidade, custo e risco sem alterar o protocolo estrutural.
A5 não significa autonomia irrestrita. Significa automação sob contratos.

45. Evolução e versionamento
Usar versionamento semântico. MAJOR → mudança incompatível de axiomas ou ontologia; MINOR → nova capacidade compatível; PATCH → esclarecimento.
45.1 Alterações da v2.1
Estabeleceu: portões; perfis; Circuito Molecular; instalações transversais; estrutura documental; manifesto; lint; governança de agentes; migração progressiva.
45.2 Alterações da v2.2
Acrescentou: Down Plant explicitamente como GPS estrutural; espelho navegacional humano e agêntico; conexão como entidade arquitetural explícita; axioma de localização antes da ação; princípio "descoberta não é autorização"; navegação obrigatória para agentes; protocolo de handoff Planner → Executor; endereço Down Plant carregado entre agentes; regra anti-deriva operacional; disciplina para Executor; memória curta separada de histórico persistente; suporte conceitual a agentes com capacidades diferentes; Curador Estrutural automatizável; sincronização Git ↔️ Down Plant ↔️ Obsidian; maturidade agêntica separada da maturidade metodológica.
45.3 Alterações da v2.3
Acrescenta:
axioma 3.13 — auto-similaridade estrutural (Elemento → Porta → Circuito recursivo em Submódulo, Módulo e Cômodo), com campo escala no endereçamento;
consolidação de redundâncias: 32.5 e 32.9 passam a referenciar os axiomas 3.10 e 3.12 em vez de reescrevê-los; 32.8 passa a referenciar os papéis de §7.2/7.3;
reconciliação do handoff: YAML (§46.12) como fonte operacional canônica, Markdown (§46.11) como espelho derivado, nunca editado diretamente;
§12.6 — checklist de produção da Porta, absorvendo prontidão de produção (idempotência, dedup, rate limit, race condition etc.) como parte do contrato já existente, em vez de método paralelo;
§32.14 — contrato de entrada do handoff (require/ensure/invariant aplicado ao próprio downplant_handoff), tornando a navegação estrutural auditável, não apenas recomendada;
§31.2-31.6 — princípio de não reimplementação: busca de tecnologia existente (framework, biblioteca, API, plugin, repositório) para a função de Módulos, Circuitos e Portas, com avaliação de risco, registro de decisão e vínculo monitorado;
papel 7.8 — Vigia de dependências, irmão do Curador Estrutural, observando atualizações upstream de dependências vinculadas e reportando sem aplicar sozinho.
45.4 Alterações da v2.4
Acrescenta:
§21.1/21.2 — critério de retomada de fatia de produto: um Cômodo em modo legado (🟡 LEGADO ESTRUTURAL) só é considerado pronto para retomar fatias de produto como prioridade padrão quando todo Módulo ativo tem espelho rico sem pendência, nenhuma Auditoria está com rejeição em aberto, e o Proprietário confirma a visão geral restabelecida — fechando a lacuna em que o modo legado não tinha critério de saída e podia consumir ciclos inteiros de mapeamento sem sinalizar que o produto parou de avançar;
exigência de que o handoff declare quando uma Task é de catch-up estrutural em vez de produto, tornando essa proporção visível sem depender de auditoria manual do histórico;
métrica de catch-up estrutural em §38 — proporção catch-up vs. produto por Cômodo, espelhos ricos pendentes e rejeições em aberto, com o próprio método sinalizando quando o mapeamento parou de convergir.

46. Modelos operacionais
46.1 Constituição
# CONSTITUIÇÃO
## Propósito
## Princípios invioláveis
## Qualidade
## Segurança
## Dados
## Acessibilidade
## Testes
## Ambientes
## Publicação
## Git
## Governança de IA
## Navegação Down Plant
## Processo de alteração
46.2 Módulo
# MOD-CXX-NN_NOME
- ID:
- Endereço Down Plant:
- Estado:
- Perfil:
- Responsável:

## Responsabilidade
## Limites
## Entradas
## Saídas
## Portas
## Conexões
## Invariantes
## Regras
## Tecnologia existente avaliada (§31.4)
## Artefatos
## Dependências
## Erros
## Observabilidade
## Testes
## Evidências
## Divergências
## Critérios de verde
46.3 Porta
# PORTA
- Endereço global:
- Escala: submodulo | modulo | comodo
- Origem:
- Destino:
## Payload
## require
## ensure
## invariant
## Checklist de produção (§12.6)
## Erros
## Efeitos
## Segurança
## Observabilidade
## Implementação
## Testes
## Evidência
## Estado
46.4 Decisão
# DEC-NOME
- Estado:
- Data:
- Localização:
- Contexto:
- Decisão:
- Alternativas:
- Consequências:
- Riscos:
- Condição de revisão:
46.5 Evidência
# EVD-CXX-NNN
- Localização:
- Requisito:
- Ambiente:
- Commit:
- Entrada:
- Função:
- Comando:
- Resultado:
- Código de saída:
- Data:
- Limite:
- Risco residual:
46.6 Encerramento
# Resultado
## Localização Down Plant
## Task
## Arquivos alterados
## Contratos e regras
## Checklist de produção (quando aplicável)
## Testes
## Evidências
## Commits
## Árvore de trabalho
## Ambiente
## Publicação
## Divergências
## Trabalho descoberto fora do escopo
## Próximo passo seguro

Parei no limite autorizado.
46.7 Instalação transversal
# INST-NOME
- Estado:
- Versão:
- Âncora:
- Responsável:

## Contrato
## Portas
## Consumidores
## Dados
## Falhas
## Observabilidade
## Implementação
## Testes
## Evidências
## Migração
46.8 Manifesto
---
downplant_schema: DP-VAULT-1
downplant_version: "2.4"
perfil_base: P1
padrao_de_comodo: DP-ROOM-1
padrao_de_modulo: DP-MODULE-1
migracao_legada: progressiva
ultimo_lint:
---

# ESTRUTURA DO COFRE
## Estrutura
## IDs
## Portas
## Condicionais
## Cômodos ativos
## Cômodos legados
## Perfis
## Exceções
## Transições
## Último lint
46.9 Índice de posição
# CXX — POSIÇÃO
- Posição:
- Estado:
- Aplicabilidade:
- Responsável:
- Última revisão:

## Responsabilidade
## Artefatos
## Relações
## Destinos
## Conteúdo proibido
## Pendências
## Critério de revisão
46.10 Lint
# LINT ESTRUTURAL
- Esquema:
- Perfil:
- Escopo:
- Commit:
- Comando:
- Código:
- Data:

## Erros
## Avisos
## Condicionais
## Exceções
## Links
## Canvas
## Tasks sem localização
## Handoffs rejeitados (§32.14)
## Limites
## Próxima ação segura
46.11 Handoff Planner → Executor (espelho Markdown)
Gerado automaticamente a partir do objeto downplant_handoff (§46.12). Não editar diretamente — editar o YAML de origem e regerar.
# HANDOFF
## Localização Down Plant
- Terreno:
- Cômodo:
- Módulo:
- Submódulo:
- Escala:
- Circuito:
- Porta:

## Task
- ID:
- Objetivo:
- Ação:
- Resultado esperado:

## Escopo autorizado
- Arquivos:
- Funções:
- Artefatos:
- Ambiente:

## Conexões afetadas
- Origem:
- Destino:
- Contrato:

## Portões
- Atual:
- Destino:

## Proibições
- Expandir escopo:
- Efeitos externos:
- Publicação:
- Outros:

## Regra para intercorrências
Detectar → localizar → registrar → devolver ao Planner.

## Regra de parada
Ao concluir o escopo, registrar resultado e parar.
46.12 Handoff Planner → Executor (fonte operacional — YAML canônico)
Fonte única e canônica da passagem de tarefa. Todo objeto downplant_handoff deve satisfazer o contrato de entrada da §32.14 antes de chegar ao Executor.
downplant:
  terreno: SYN
  comodo: C00
  modulo: MOD-C00-01
  submodulo: null            # preencher quando escala = submodulo
  escala: modulo             # submodulo | modulo | comodo
  circuito: CIR-MOD-C00-01_AUTH
  porta: P00

task:
  id: TASK-C00-042
  acao: corrigir
  alvo: comportamento definido

escopo:
  arquivos:
    - arquivo-a
    - arquivo-b
  pode_expandir: false

estado:
  portao_atual: G4
  portao_destino: G7

fora_do_escopo:
  acao: REPORTAR_AO_PLANEJADOR
Este objeto pode ser substituído a cada interação. O histórico completo permanece fora do contexto operacional corrente (§32.12).
46.13 Relatório do Curador
# CURADOR DOWN PLANT
- Commit observado:
- Cômodos afetados:
- Módulos afetados:
- Circuitos afetados:
- Estado anterior:
- Estado encontrado:

## Alterações mecanicamente reconciliáveis
## Divergências
## Links e Canvas
## Handoffs YAML/Markdown divergentes
## Atualização realizada
## Decisão humana necessária
## Resultado

SINCRONIZADO | DIVERGENTE | NENHUMA AÇÃO
46.14 Relatório do Vigia de dependências
# VIGIA DE DEPENDÊNCIAS
- Data:
- Escopo observado:

## Dependências vinculadas monitoradas
## Atualizações detectadas upstream
## Divergência entre versão registrada e versão atual
## Risco estimado da defasagem
## Recomendação
## Decisão humana necessária

SINCRONIZADO | DEFASADO | NENHUMA AÇÃO
46.15 Espelho rico de código
Usado em modo legado (§21.1) e sempre que o espelho AS-IS (§8.12) precisar de vínculo verificável ao código real, não apenas descritivo. Diferente do espelho comum, embute o código-fonte vigente e mantém link vivo para o arquivo em disco — divergência entre o embutido e o arquivo real é deriva (§18.1).
# ESPELHO — NOME_DO_ARQUIVO
- Endereço Down Plant:
- Arquivo de origem (link para o disco):
- Commit de referência:
- Data da última sincronização:

## Código-fonte embutido
[código real, verbatim, do arquivo de origem no commit de referência]

## Responsabilidade observada
## Portas expostas (se aplicável)
## Divergência com a Planta declarada
## Última verificação (data/commit)

47. Referências técnicas
O método pode utilizar como referências complementares: C4 Model; Domain-Driven Design; Design by Contract; Spec-Driven Development; correctness by construction; NIST SSDF; OWASP ASVS; OpenTelemetry; WCAG; JSON Schema; Semantic Versioning; SLSA.
Nenhuma delas substitui a ontologia operacional Down Plant.

Síntese final
O Down Plant Progressivo transforma um projeto em um sistema navegável de responsabilidades, conexões, contratos, implementações e provas.
A Constituição determina princípios. O Terreno determina fronteira. A Planta mostra o espaço. O Cômodo localiza uma responsabilidade. O Módulo entrega capacidade. O Submódulo organiza responsabilidade interna — inclusive quando nasce da fusão de Módulos simples (§3.13). A Porta formaliza travessias, em qualquer escala. A conexão mostra relações. O Circuito descreve comportamento, também em qualquer escala. O código materializa. O teste verifica. A evidência prova. O Git preserva a história operacional. O Obsidian fornece o espelho navegável. O Planejador decompõe intenção. O Executor materializa tarefas limitadas, validadas por contrato antes de começar. O Conferidor compara realidade e especificação. O Curador mantém estrutura e implementação sincronizadas. O Vigia mantém o projeto alinhado ao que já existe pronto fora dele. O proprietário permanece na camada das decisões relevantes.
O Down Plant não precisa ser inteligente. Ele precisa ser preciso, simples, navegável e estável o suficiente para que inteligências diferentes consigam utilizá-lo da mesma maneira.
                      PROPRIETÁRIO
                           │
                        intenção
                           │
                           ▼
                     ┌──────────┐
                     │ PLANNER  │
                     └────┬─────┘
                          │
                 decomposição lógica
                 + busca de tecnologia existente
                          │
                          ▼
                    DOWN PLANT
           localização + contratos + checklist
                          │
           ┌──────────────┼──────────────┐
           ▼              ▼              ▼
       Executor A     Executor B     Executor C
           │              │              │
       ferramenta     ferramenta     ferramenta
           │              │              │
           └──────────────┬──────────────┘
                          ▼
                         Git
                          │
              ┌───────────┴───────────┐
              ▼                       ▼
     CURADOR ESTRUTURAL        VIGIA DE DEPENDÊNCIAS
              │                       │
              ▼                       ▼
       Down Plant / Obsidian   Fontes externas (upstream)
Uma tarefa pequena deve poder ser executada por um agente pequeno. Uma tarefa cognitivamente complexa deve poder ser planejada por um agente mais capaz. Nenhum deles precisa carregar o sistema inteiro na memória. Todos precisam compartilhar o mesmo mapa — e nenhum precisa reconstruir do zero o que já existe pronto fora dele.
Nenhuma ação sem localização.
Nenhuma expansão sem planejamento.
Nenhuma conexão relevante sem contrato.
Nenhuma alteração estrutural sem rastreabilidade.
Nenhum estado acima da evidência disponível.
Nenhuma capacidade construída do zero sem verificar o que já existe.
E, sobretudo: o Down Plant não é o cérebro do sistema. É o mapa que permite que cérebros diferentes trabalhem no mesmo sistema sem se perderem.

<!-- fim do texto canônico · sha256=bf720099fd26597b3d7e5d373490f76c003b831c202ae2370698de09efb76942 -->
