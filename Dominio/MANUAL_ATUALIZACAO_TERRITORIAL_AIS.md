# Manual de Atualização Territorial de Áreas Integradas de Segurança (AIS)

**Módulo:** `Dominio/TabelaTerritorialAIS.js` e `Dominio/ResolverAIS.js`  
**Contexto:** Gestão da Malha Territorial de Segurança Pública do Estado de Pernambuco  
**Versão:** 1.0.0

---

## 1. Fundamentação Legal Canônica
A divisão territorial de Segurança Pública em Pernambuco é regida pelos seguintes atos normativos oficiais:
1. **Lei Estadual nº 14.320, de 27 de maio de 2011:** Cria as Regiões Integradas de Segurança Pública (RISP) e as Áreas Integradas de Segurança (AIS) no Estado de Pernambuco (alterada pela Lei nº 14.890, de 20 de novembro de 2012).
2. **Portaria SDS nº 1197, de 11 de junho de 2010 (publicada no DOE de 15 de junho de 2010):** Fixa a responsabilidade territorial dos municípios e dos bairros do Recife entre as AIS 1, 2, 3, 4 e 5, além da Região Metropolitana e Interior.
3. **Portaria SDS nº 129, de 15 de fevereiro de 2008 e Decreto Estadual nº 26.868/2004:** Estabelecem critérios técnico-cartográficos e a compatibilização territorial entre a Polícia Militar (BPM/CIPM) e a Polícia Civil (DESEC/DPC).

---

## 2. Princípios de Resolução Automatizada
1. **Mono-AIS (Certeza Absoluta):** 
   - Quando um município pertence integralmente a uma única AIS (ex: Olinda na AIS 7, Garanhuns na AIS 18, Caruaru na AIS 14), o nome do município é **suficiente** para determinar a AIS, independentemente do bairro informado.
2. **Multi-AIS (Desambiguação Obrigatória):**
   - No município do Recife, o território é dividido entre cinco AIS (AIS 1 a 5).
   - O preenchimento do **bairro** é indispensável para cravar a AIS correta.
   - Bairros históricos ou notórios (ex: Boa Viagem -> AIS 3; Santo Amaro -> AIS 1; Espinheiro -> AIS 2; Várzea -> AIS 4; Casa Amarela -> AIS 5) resolvem imediatamente.
3. **Não-Invenção de Dados (Princípio da Prudência Operacional):**
   - Se o município for Recife e o bairro não for informado ou não constar na malha oficial, o sistema **jamais** chuta uma AIS.
   - O campo permanece vazio ou editável e o sistema exibe o aviso: *"⚠️ Conferir AIS (Recife requer bairro)"*.
4. **Soberania do Operador:**
   - A edição manual direta no campo AIS tem precedência sobre o cálculo automático. O operador humano pode a qualquer momento ajustar o valor.

---

## 3. Procedimento para Atualização da Tabela
Caso uma nova Portaria da Secretaria de Defesa Social (SDS) ou Lei Estadual altere a circunscrição de municípios ou bairros:

1. **Editar a Definição Canônica:**
   - Abra o arquivo `Dominio/TabelaTerritorialAIS.js`.
   - Localize o objeto `TABELA_TERRITORIAL_AIS`.
   - Se um novo município for criado ou remanejado entre AIS, atualize a chave em `municipiosMonoAis`.
   - Se novos bairros forem regularizados ou criados no Recife, adicione a chave correspondente em maiúsculas e sem acento em `municipiosMultiAis['RECIFE'].bairros`.
2. **Atualizar o Arquivo Serializado:**
   - Atualize de forma idêntica o arquivo `Dominio/tabela_territorial_ais.json`.
3. **Rodar a Suíte de Validação de Integridade:**
   ```bash
   node -e "const { TABELA_TERRITORIAL_AIS } = require('./Dominio/TabelaTerritorialAIS'); const { validarIntegridadeTabela } = require('./Dominio/ValidarIntegridadeTabelaAIS'); console.log(validarIntegridadeTabela(TABELA_TERRITORIAL_AIS));"
   ```
   - O relatório deve retornar obrigatoriamente `valido: true` e `erros: []`.
4. **Executar a Suíte Completa de Testes:**
   ```bash
   node Testes/RodarTodosOsTestes.js
   ```
   - Todas as asserções de resolução e regressão devem passar com exit code 0.
