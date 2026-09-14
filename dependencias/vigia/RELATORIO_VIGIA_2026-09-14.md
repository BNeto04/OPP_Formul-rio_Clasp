# VIGIA DE DEPENDÊNCIAS
- Data: 2026-09-14
- Escopo observado: dependencias/ (4 registros §31.6) - fontes declaradas no campo `fonte` de cada registro
- Observacao upstream: `dependencias/vigia/UPSTREAM_OBSERVADO.json`
- Observador: Executor (card #167) - observacao assistida, uma rodada, sem automatizacao de rede

> Relatorio gerado por `scripts/downplant/vigia-dependencias.mjs` - **somente leitura**.
> O Vigia **observa, compara e reporta**; **nao decide** e **nao aplica** atualizacao (§7.8 / §31.6).

## Dependências vinculadas monitoradas
| Registro | Dependencia | Versao registrada | Decisao (§46.4) | Fonte observada |
|---|---|---|---|---|
| `DEP-001` | Google Apps Script | `V8` | `DEC-DEP-001` | https://developers.google.com/apps-script/release-notes (feed oficial: https://developers.google.com/feeds/apps-script-release-notes.xml) |
| `DEP-002` | Google Sheets (planilha operacional) | `NAO_PINADA` | `DEC-DEP-002` | planilha viva (abas mensais/EFETIVO) + Google Workspace Updates (https://workspaceupdates.googleblog.com/) |
| `DEP-003` | clasp (CLI de deploy) | `AUSENTE_DECLARADO` | `DEC-DEP-003` | https://registry.npmjs.org/@google/clasp (dist-tags.latest) + https://github.com/google/clasp/releases |
| `DEP-004` | Abas e bases canonicas (EFETIVO, catalogo PIP, base territorial AIS) | `1.0.0 (AIS)` | `DEC-DEP-004` | Dominio/tabela_territorial_ais.json (versao + fontesOficiais declaradas) + abas vivas EFETIVO/PIP na planilha |

## Atualizações detectadas upstream
| Registro | Observado | Versao observada | Origem |
|---|---|---|---|
| `DEP-001` | sim | `V8` | https://developers.google.com/apps-script/release-notes |
| `DEP-002` | nao | - | fonte viva (conteudo da planilha + Google Workspace Updates) nao consultada nesta rodada: nao ha leitura remota autorizada nesta fatia |
| `DEP-003` | sim | `3.4.1` | https://registry.npmjs.org/@google/clasp (dist-tags.latest) + https://github.com/google/clasp/releases |
| `DEP-004` | sim | `1.0.0` | Dominio/tabela_territorial_ais.json:3-4 (versao + publicacao) |

## Divergência entre versão registrada e versão atual
| Registro | Registrada | Observada | Estado | Motivo |
|---|---|---|---|---|
| `DEP-001` | `V8` | `V8` | **SINCRONIZADO** | versao registrada == versao observada (V8) |
| `DEP-002` | `NAO_PINADA` | `-` | **NENHUMA AÇÃO** | fonte viva (conteudo da planilha + Google Workspace Updates) nao consultada nesta rodada: nao ha leitura remota autorizada nesta fatia |
| `DEP-003` | `AUSENTE_DECLARADO` | `3.4.1` | **DEFASADO** | versao registrada ausente/nao pinada no vinculo, embora o §31.6 exija versao |
| `DEP-004` | `1.0.0 (AIS)` | `1.0.0` | **SINCRONIZADO** | versao registrada == versao observada (1.0.0) |

## Risco estimado da defasagem
| Registro | Risco |
|---|---|
| `DEP-001` | baixo |
| `DEP-002` | nao estimado - sem observacao |
| `DEP-003` | medio - a versao instalada nunca foi registrada no repositorio, embora o §31.6 exija versao no vinculo |
| `DEP-004` | baixo - a observacao cobre a copia versionada, nao a base viva |

## Recomendação
- `DEP-001`: nenhuma acao; o vinculo continua valido
- `DEP-002`: registrar observacao da fonte declarada (`fonte`) na proxima rodada do Vigia
- `DEP-003`: registrar a versao instalada no campo `versao` do vinculo (dependencias/DEP-003) - nao ha aplicacao automatica: e registro de decisao, §31.6
- `DEP-004`: nenhuma acao; o vinculo continua valido

## Decisão humana necessária
| Registro | Decisao humana necessaria | O que precisa ser decidido |
|---|---|---|
| `DEP-001` | Não | nenhuma acao; o vinculo continua valido |
| `DEP-002` | Não | registrar observacao da fonte declarada (`fonte`) na proxima rodada do Vigia |
| `DEP-003` | Sim | registrar a versao instalada no campo `versao` do vinculo (dependencias/DEP-003) - nao ha aplicacao automatica: e registro de decisao, §31.6 |
| `DEP-004` | Não | nenhuma acao; o vinculo continua valido |

**Estado do Vigia (§46.14):** `DEFASADO`

SINCRONIZADO | DEFASADO | NENHUMA AÇÃO
