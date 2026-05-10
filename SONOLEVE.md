# Especificação do Sistema Sono Leve

## Estado atual do projeto

- Nesta fase, o projeto possui frontend com dados mockados no navegador.
- O backend foi removido do fluxo atual; detalhes historicos estao em `backend.MD`.
- Existem dados iniciais de teste em `client/src/lib/api.ts` para permitir validar os fluxos sem precisar cadastrar tudo manualmente.
- O arquivo `SONOLEVE.md` e a referencia funcional principal do projeto.
- Este documento deve registrar regras de negocio, fluxos e decisoes funcionais. Detalhes tecnicos de programacao devem ficar no codigo, README ou comentarios tecnicos quando necessario.

## Gerais

### Atalhos globais

- Salvar:
  - Windows/Linux: `Ctrl + S`.
  - macOS: `Command + S`.
- `Enter`: confirmar campo ou ação.
- `Tab`: próximo campo.
- `Esc`: voltar ou cancelar.

### Atalhos por contexto

- `F2`: nova operação conforme a tela atual.
- `F3`: na tela de Vendas, aciona "De Encomenda".
- `F4`: na tela de Vendas, aciona "De Ficha".
- `Shift + número`: navega entre abas pela ordem visual da tela ou modal.

### Configuração de atalhos

- Os atalhos devem ser configuráveis.
- Deve existir uma tela ou seção de configurações para visualizar e alterar atalhos.
- Os atalhos devem ser persistidos localmente por maquina, sem banco de dados nesta fase.
- Os atalhos devem possuir uma base padrao em arquivo JSON.
- Alteracoes feitas em `Configuracoes > Atalhos` devem sobrescrever localmente o padrao, preservando a estrutura base.
- O sistema deve exibir o atalho correto conforme a plataforma do usuário.
- No macOS, atalhos que normalmente usam `Ctrl` em Windows/Linux devem priorizar `Command`.
- Teclas de função (`F1`, `F2`, `F3`, `F4`) podem depender da tecla `fn` em alguns teclados de Mac.
- Para macOS, o sistema deve permitir configurar alternativas para ações baseadas em teclas de função.
- O sistema deve evitar atalhos que conflitem com atalhos nativos importantes do navegador ou do sistema operacional.
- Quando um atalho for alterado, todos os locais que exibem essa dica devem refletir a nova configuração.
- A tela de atalhos deve mostrar campos separados para Windows/Linux e macOS.
- Deve existir acao para restaurar os atalhos padrao.

Regras:

- `F2` não representa sempre nova venda.
- `F2` deve respeitar o contexto atual:
  - Em Vendas: nova venda.
  - Em Produtos: novo produto.
  - Em Clientes: novo cliente.
  - Em Encomendas: nova encomenda.
  - Em Ficha: nova ficha.
- `F3` não deve ser atalho global de nova encomenda.
- `F3` deve funcionar apenas na tela de Vendas como atalho para "De Encomenda".
- A ação "De Encomenda" deve exibir as encomendas disponíveis para gerar venda.
- `F4` deve funcionar apenas na tela de Vendas como atalho para "De Ficha".
- A ação "De Ficha" deve exibir as fichas disponíveis para gerar venda.
- "De Encomenda" e "De Ficha" devem ter comportamento equivalente, mudando apenas a origem dos dados.
- No Dashboard, deve existir contexto proprio de atalhos:
  - `F2`: Nova venda.
  - `F3`: Nova encomenda.
  - `F4`: Nova ficha.
- Em telas com abas:
  - `Shift + 1`, `Shift + 2`, `Shift + 3` e assim por diante devem mudar para a aba correspondente.
  - Ao trocar de aba por `Shift + número`, a aba deve receber foco.
  - Ao pressionar `Tab` em seguida, o foco deve cair diretamente na primeira ação útil da aba ativa.
  - Se a aba tiver lista de ações, a navegação entre elas deve aceitar `Seta para cima` e `Seta para baixo`.
- `Esc` deve funcionar como voltar/cancelar em todas as telas.
- `Esc` nao deve interferir quando o foco estiver em `input`, `textarea`, `select` ou area editavel.
- Se a tela tiver contexto de origem, o `Esc` deve respeitar esse retorno.

### Princípios gerais

- Todos os registros devem possuir status claro e regras de transição definidas.
- Nenhum cancelamento remove o registro fisicamente do sistema.
- Ações críticas devem preservar histórico.
- O sistema deve priorizar rapidez operacional, clareza visual e consistência de fluxo.
- Ao cadastrar ou salvar qualquer registro, o sistema deve indicar estado de salvamento e bloquear nova submissao ate a conclusao.
- Atalhos e dicas visuais devem aparecer na própria interface sempre que possível.
- Navegação por atalho não deve gerar toast ou notificações desnecessárias.

### Padrões visuais e de interação

- Modais com grande volume de dados devem manter tamanho fixo ou previsível.
- Quando o conteúdo exceder o espaço, o scroll deve acontecer dentro da área de dados do modal, e não expandir a janela inteira.
- Em tabelas dentro de modais, o cabeçalho deve permanecer estável sempre que possível.
- Explicações auxiliares devem preferir ícone de informação com tooltip em vez de texto fixo poluindo a tela.
- Os títulos dos módulos podem exibir um ícone de informação ao lado, explicando rapidamente a função da tela.
- Abas devem exibir o atalho correspondente de forma discreta.

### Identidade visual

- A aplicação deve usar a identidade visual da Sono Leve.
- O logo oficial deve ser usado na sidebar e nos ícones do aplicativo.
- O favicon e os ícones derivados do logo devem preservar fundo branco quando necessário para boa leitura no navegador.

### Dados iniciais de teste e consistência

- Os dados iniciais de teste servem apenas para demonstracao e validacao de regras.
- Dados de teste devem evitar invenções automáticas que possam gerar inconsistência.
- Se um detalhamento de itens não existir, o sistema deve informar isso claramente, em vez de criar produtos fictícios.
- Listagem, edição e detalhamento devem buscar coerência a partir da mesma fonte de dados sempre que possível.

### Fluxos específicos já consolidados

- No módulo de Vendas:
  - `Histórico` mostra apenas vendas já geradas.
  - `Faturar encomendas` mostra encomendas prontas ou fabricadas parcialmente aguardando geração de venda.
  - `Faturar fichas` mostra fichas com itens vendidos aguardando faturamento.
- Ao faturar uma encomenda com status `Fabricado parcialmente`, se houver saldo restante, o sistema deve gerar uma nova encomenda remanescente com esse saldo.

### Salvamento e prevenção de duplicidade

- Ao clicar em salvar, cadastrar, finalizar ou confirmar, o botao deve entrar em estado de loading.
- O texto do botao deve mudar para "Salvando...", "Cadastrando..." ou equivalente conforme o contexto.
- Enquanto a acao estiver em andamento, o sistema deve bloquear novos cliques na mesma acao.
- A tela ou formulario pode ficar parcialmente bloqueado durante o processamento.
- O objetivo e impedir registros duplicados, como cadastrar o mesmo produto, cliente, venda ou encomenda mais de uma vez por clique repetido.
- Ao concluir com sucesso, exibir toast de confirmacao e atualizar o status do registro.
- Ao ocorrer erro, liberar novamente a acao, manter os dados preenchidos e exibir mensagem clara.

---

## Sidebar

### Estrutura

- Logo + texto "Sono Leve".
- Lista de módulos.
- Configurações no rodapé.

### Comportamento

- Ocupa toda a altura da janela.
- Pode ser recolhida para exibir apenas ícones.
- Ao passar o mouse, pode expandir temporariamente.
- Deve manter navegação consistente em todas as telas.
- Deve usar a cor primaria do sistema como base visual.
- O estado de hover das opcoes deve ser claramente perceptivel.
- O estado ativo deve ser mais forte que o hover.
- Hover e ativo devem ter retorno visual por fundo, contraste, leve sombra e destaque do ícone.

---

## Header - Navegação e Contexto

### Conceito

O header representa o contexto atual da aplicação, incluindo navegação, estado do registro e ações disponíveis.

### Funções principais

- Orientar o usuário.
- Identificar o contexto atual.
- Centralizar ações.
- Exibir estado do registro.

### Estrutura

#### Breadcrumb

Formato:

```text
Módulo / Submódulo / Tela / Registro
```

Exemplos:

- Vendas.
- Vendas / Nova venda.
- Vendas / Venda / #1234.
- Produtos / Cadastro / Camisola Manga Curta.

Regras:

- Cada nível do breadcrumb deve ser clicável, exceto o último.
- O breadcrumb deve refletir sempre o estado atual da navegação.
- Ao navegar para trás, manter filtros e contexto quando possível.
- Quando uma tela for aberta a partir do Dashboard, o breadcrumb deve refletir essa origem.
- Exemplos:
  - `Dashboard / Venda / Nova venda`
  - `Dashboard / Encomenda / Nova encomenda`
  - `Dashboard / Ficha / Nova ficha`
- Nesses casos, o botao `Cancelar` deve voltar ao Dashboard.

#### Identificação do registro

Exibido em telas de edição ou visualização.

Conteúdo:

- Nome principal.
- Identificador secundário.

Exemplo:

```text
Venda #1234
Cliente Maria Silva
```

#### Estado do registro

Exibido ao lado do título.

Exemplos:

- Em edição.
- Finalizada.
- Paga.
- Cancelada.
- Não salvo.

Regras:

- Atualizado em tempo real.
- "Não salvo" aparece quando houver alterações pendentes.
- Status controla ações disponíveis.

#### Ações principais

Localizadas à direita.

Exemplos:

- Salvar.
- Cancelar.
- Duplicar.
- Mais ações.

Regras:

- Variam conforme contexto e status.
- Ações inválidas devem ser ocultadas ou bloqueadas.

#### Botão Consultar

- Sempre visível em listagens.
- Recarrega dados.

#### Se houver alteração externa

- Exibir indicador visual de desatualização.

#### Estado de edição

- Exibir "Não salvo" ao alterar dados.
- Impedir saída sem confirmação.

#### Ações contextuais

Variam conforme tela.

Exemplos:

- Venda: adicionar pagamento, cancelar.
- Ficha: registrar devolução, finalizar.
- Produto: inativar, duplicar.

#### Responsividade

- Breadcrumb pode ser reduzido.
- Ações agrupadas em menu.

#### Concorrência

- Exibir aviso de alteração externa.
- Opcional mostrar usuário e data.

#### Feedback

- Ao salvar: mostrar estado de salvamento, bloquear nova submissao, exibir toast e atualizar status.
- Ao erro: mensagem + manter estado.

---

## Filtro de Período

### Opções

- Hoje.
- 7 dias.
- 30 dias.
- Personalizado.
- Todo o período, quando o contexto nao exigir data manual.

Observacao:

- Em listagens operacionais, `Personalizado` continua valido.
- No Dashboard, a opcao atual pode usar `Todo o período` no lugar de `Personalizado`.

### Campos

- Data inicial.
- Data final.

### Regras

- Clique em opção atualiza datas.
- Alteração manual define como personalizado.
- Atualiza automaticamente conforme contexto.
- No Dashboard, o seletor de periodo deve afetar apenas os cards superiores.
- No Dashboard, esse seletor nao deve alterar calendario, mes exibido nem encomendas do dia.

---

## Dashboard

### Calendário

- Baseado na data de entrega das encomendas.
- Abre no mês atual.
- O dia atual deve iniciar selecionado ao abrir o Dashboard.
- Permite navegação entre meses.
- Clique no dia mostra encomendas do dia.
- Deve permitir clicar tambem nos dias exibidos do mes anterior e do proximo.
- Dias fora do mes corrente devem aparecer mais apagados, mas com comportamento identico de clique e exibicao de dados.
- O calendario deve sempre usar grade completa de 6 semanas, para distribuir melhor as datas na area disponivel.
- O calendario e o card `Encomendas do dia` devem ocupar a area util da tela no desktop sem criar scroll da pagina por causa deles.
- Se houver muitas encomendas no dia, o scroll deve acontecer apenas dentro do card `Encomendas do dia`.

### Cards

- Faturado.
- Recebido.
- Em aberto.
- Quantidade de vendas.
- Ticket médio.
- Fichas em aberto.
- Encomendas prontas.

### Regras

- Filtro afeta apenas os cards.
- Calendário permanece independente.
- O cabecalho do Dashboard deve oferecer:
  - seletor de periodo
  - Nova venda
  - Nova encomenda
  - Nova ficha
- Os cards superiores devem manter o rotulo ao lado do icone.
- O calendario substitui alertas por `Encomendas do dia`.
- Ao clicar em uma data, o painel lateral deve listar cliente, codigo, status e total das encomendas daquele dia.
- O painel lateral nao deve listar encomendas `Cancelada`.

### Indicadores por data

- As datas com encomendas devem ter indicadores compactos por status.
- Os indicadores devem aparecer sempre nesta ordem:
  - Novo
  - Em producao
  - Fabricado parcialmente
  - Pronta
- Cada indicador deve exibir a quantidade daquele status dentro da propria bolinha.
- Encomendas `Cancelada`, `Entregue` ou `Faturada` nao entram nesses indicadores.

### Cores dos indicadores

- `Novo`: azul.
- `Em producao`: amarelo.
- `Fabricado parcialmente`: marrom claro puxado para caramelo/ambar.
- `Pronta`: verde.

---

## Vendas

### Abas

- Histórico.
- Encomendas.
- Ficha.

### Listagem

- Cliente.
- Data.
- Peças.
- Pagamento.
- Total.
- Status.
- Ações.

### Ações rápidas

- `F2`: nova venda.
- `F3`: De Encomenda.
- `F4`: De Ficha.
- A ação "De Encomenda" deve abrir uma seleção de encomendas disponíveis para gerar venda.
- A ação "De Ficha" deve abrir uma seleção de fichas disponíveis para gerar venda.
- Ao selecionar uma encomenda, o sistema deve iniciar a venda a partir dos dados da encomenda.
- Ao selecionar uma ficha, o sistema deve iniciar a venda a partir dos itens vendidos/calculados da ficha.
- A venda gerada deve manter vínculo com a encomenda de origem.
- A venda gerada deve manter vínculo com a ficha de origem, quando iniciada por "De Ficha".
- A origem, seja encomenda ou ficha, deve preservar seu histórico.

### Barra de busca e filtros

- A listagem de vendas deve possuir uma barra superior com:
  - Busca.
  - Filtros.
  - Período.
- Os filtros por coluna continuam existindo.
- A barra superior serve para consultas rápidas e filtros mais comuns.

#### Busca

- Campo de busca livre.
- Deve buscar por:
  - Cliente.
  - Valor.
  - Data.
- A busca deve considerar o período selecionado.
- Ao alterar a busca, o usuário deve poder consultar novamente sem perder os filtros aplicados.

#### Botão Filtros

- Ao clicar em Filtros, abrir painel ou popover com opções de seleção.
- Filtros disponíveis:
  - Tipo do cliente: varejo ou atacado.
  - Forma de pagamento.
  - Status.
- O tipo da venda nao deve ser selecionado manualmente.
- O tipo exibido/filtrado na venda deve ser derivado do cadastro do cliente.
- Deve ser possível aplicar os filtros.
- Deve ser possível limpar os filtros.
- Filtros aplicados devem ficar visualmente indicados no botão ou próximos à barra.

#### Período

- O filtro de período deve aparecer na listagem de vendas.
- Opções padrão:
  - Hoje.
  - Últimos 7 dias.
  - Últimos 30 dias.
  - Personalizado.
- Por padrão, ao abrir a tela de vendas, o período selecionado deve ser Últimos 7 dias.
- Ao selecionar Personalizado, abrir calendário para escolha da data inicial e data final.
- O período deve afetar a busca, os filtros e os dados exibidos na listagem.

### Filtros na listagem

- Os filtros de vendas devem ficar diretamente nas colunas da tabela.
- Ao clicar no cabeçalho de uma coluna, o sistema deve permitir filtrar por uma informação específica daquela coluna.
- Por padrao, a listagem deve abrir com ordenacao decrescente.
- A ordenacao padrao deve exibir as vendas mais recentes primeiro.
- A ordenacao padrao pode considerar data de venda e, em caso de empate, identificador da venda.
- Exemplos:
  - Cliente: filtrar por nome do cliente.
  - Data: filtrar por período ou data específica.
  - Peças: filtrar por quantidade ou produto vendido.
  - Pagamento: filtrar por forma de pagamento.
  - Total: filtrar por faixa de valor.
  - Status: filtrar por Gerada ou Cancelada.
- Os filtros aplicados devem ficar visualmente claros no cabeçalho da coluna.
- Deve ser possível limpar o filtro de uma coluna sem limpar todos os filtros da listagem.
- Ao navegar para outra tela e voltar, manter os filtros quando possível.

### Coluna Status

- A listagem de vendas deve possuir coluna Status.
- Se a venda estiver cancelada, exibir status `Cancelada` em vermelho.
- Se a venda nao estiver cancelada, exibir status `Gerada` em verde.
- A cor deve ajudar na leitura rapida da grade.
- O status exibido na grade deve refletir o status real do registro.

### Coluna Peças

- Na listagem de vendas, a coluna Peças deve exibir apenas a quantidade total de peças da venda.
- O conteúdo visível da célula deve ser numérico, por exemplo: `3`, `8`, `15`.
- A coluna Peças deve ser clicável em cada linha.
- Ao clicar na coluna Peças de uma venda, abrir modal com o resumo das peças vendidas.
- O modal deve exibir produto, tamanho, quantidade, preço unitário, desconto e total por item.
- O modal deve exibir também o total de peças e o total da venda.
- O modal é apenas informativo nesta primeira versão.
- Alterações nos itens devem ser feitas na tela da venda, respeitando o status do registro.

### Status

- Gerada.
- Cancelada.

### Regras

- O fluxo da venda é o vendedor gerar uma venda e, depois disso, ter a possibilidade de cancelar.
- Ao gerar a venda, o registro fica com status Gerada.
- Nao existem status "Em edicao", "Finalizada" ou "Paga" para venda.
- Pagamento total, parcial ou em aberto deve ser controlado pelo financeiro e pelas contas a receber.
- Status da venda controla apenas se ela esta valida ou cancelada.
- Venda gerada deve consolidar itens, pagamentos informados, contas a receber quando houver saldo e movimentacoes de estoque quando aplicavel.
- Venda cancelada nao pode ser editada.

### Cancelamento

- Exige justificativa.
- Remove pagamentos.
- Remove contas a receber.
- Estorna crédito.
- Mantém registro com status Cancelada.

---

## Nova Venda

### Conceito

Tela usada para gerar uma venda.

A venda nao deve ter um estado intermediario complexo. O usuario preenche os dados, confere os itens, informa pagamento ou saldo em aberto e gera a venda.

Ao gerar a venda, o registro passa a existir com status `Gerada`.

### Abertura da tela

- Pode ser aberta pelo botao Nova Venda.
- Pode ser aberta pelo atalho `F2` quando o usuario estiver na tela de Vendas.
- Pode ser iniciada pela acao "De Encomenda", usando o atalho `F3` na tela de Vendas.
- Pode ser iniciada pela acao "De Ficha", usando o atalho `F4` na tela de Vendas.
- Quando iniciada de uma encomenda, deve carregar os dados da encomenda selecionada.
- Quando iniciada de uma encomenda, deve manter vinculo com a encomenda de origem.
- Quando iniciada de uma ficha, deve carregar os itens vendidos/calculados da ficha selecionada.
- Quando iniciada de uma ficha, deve manter vinculo com a ficha de origem.

### Estrutura da tela

- Cliente.
- Itens da venda.
- Resumo financeiro.
- Pagamento.
- Conta a receber, quando houver saldo.
- Observacoes.
- Acoes principais.

### Cliente

- Cliente pode ser selecionado de um cadastro existente.
- Deve permitir cadastro rapido de cliente por modal.
- O campo de cliente deve funcionar como busca/autocomplete.
- Ao digitar, o sistema deve listar clientes encontrados.
- A ultima opcao da lista deve ser "Cadastrar novo cliente" ou texto equivalente.
- Exemplo de lista:
  - Cliente 1.
  - Cliente 2.
  - Cliente 3.
  - Cadastrar novo cliente.
- Ao clicar em "Cadastrar novo cliente", abrir modal de cadastro rapido.
- Depois de cadastrar o cliente, o sistema deve selecionar automaticamente o cliente recem-criado na venda.
- O cadastro rapido nao deve limpar os itens ou dados ja preenchidos na venda.
- Se houver cliente selecionado, a venda deve ficar vinculada a ele.
- Se a venda permitir cliente nao identificado, isso deve ser uma regra configuravel.
- Credito do cliente deve aparecer quando houver saldo disponivel ou negativo.
- Credito pode ser usado para abater valores conforme regra financeira.

### Itens da venda

- A venda deve possuir pelo menos um item.
- Cada item deve possuir produto, tamanho, quantidade, preco unitario e total.
- Produto pode repetir na venda, desde que o tamanho ou a condicao da venda justifique.
- A tela deve permitir adicionar, alterar quantidade e remover item antes de gerar a venda.
- Produto inativo nao deve aparecer para nova venda.
- Produto sem saldo disponivel deve ser bloqueado ou sinalizado, conforme regra de estoque configurada.
- Ao selecionar um produto, o sistema deve respeitar a grade de tamanhos da categoria.

### Grade de tamanhos

- A venda deve usar a grade herdada da categoria do produto.
- O usuario nao digita tamanhos manualmente.
- O usuario informa a quantidade por tamanho.
- Tamanhos com quantidade zero nao precisam entrar nos itens da venda.
- A grade deve facilitar venda rapida por tamanho.
- A selecao pode ser feita por tamanho individual ou por matriz de tamanho x quantidade.

### Preços

- O tipo da venda nao pode ser selecionado manualmente.
- O tipo da venda deve ser considerado conforme o cadastro do cliente.
- Cliente varejo deve utilizar preco varejo por padrao.
- Cliente atacado deve utilizar preco atacado por padrao.
- Se nao houver cliente selecionado, o sistema deve usar preco varejo por padrao, salvo configuracao futura.
- Ao alterar o cliente da venda, o sistema deve revisar os precos dos itens conforme o tipo do novo cliente.
- Se houver itens ja adicionados e o tipo do cliente mudar, o sistema deve avisar antes de recalcular os precos.
- Preco do item pode ser alterado apenas se a regra do sistema permitir.
- Alteracao manual de preco deve ficar registrada no historico.

### Descontos

- Subtotal.
- Desconto por item.
- Desconto total.
- Total.
- Desconto pode ser em valor ou percentual.
- Desconto por item afeta apenas o item selecionado.
- Desconto total afeta o total da venda.
- O sistema deve recalcular subtotal, descontos e total automaticamente.
- Desconto nao deve gerar total negativo.
- Desconto aplicado deve ficar registrado no historico da venda.

### Resumo financeiro

- Subtotal.
- Total de descontos.
- Total da venda.
- Valor pago.
- Saldo em aberto.
- Troco, quando houver.
- Taxas estimadas da forma de pagamento.
- Recebido bruto.
- Recebido liquido.

### Pagamento

- A venda pode ter um ou mais pagamentos.
- Deve permitir pagamento total.
- Deve permitir pagamento parcial.
- Se houver saldo em aberto, deve gerar conta a receber.
- Deve permitir selecionar forma de pagamento.
- A taxa da forma de pagamento nao altera o total da venda.
- A taxa afeta apenas o valor recebido liquido.
- Deve permitir troco com confirmacao.
- Se o pagamento informado for maior que o total, o sistema deve avisar e pedir confirmacao do troco.
- Pagamentos informados devem ser consolidados ao gerar a venda.

### Conta a receber

- Deve ser gerada automaticamente quando houver saldo em aberto.
- Deve ficar vinculada a venda.
- Deve possuir cliente, origem, total, recebido, saldo e status.
- Pode receber pagamentos posteriores.
- Cancelamento da venda deve cancelar ou remover o vinculo financeiro conforme regra definida em Contas a Receber.

### Estoque

- Ao gerar a venda, o sistema deve baixar o estoque dos produtos vendidos.
- A baixa deve considerar produto e tamanho.
- Se o produto estiver em ficha, nao deve ser considerado disponivel para venda comum.
- Caso nao haja saldo suficiente, o sistema deve bloquear a venda ou exigir confirmacao conforme configuracao futura.
- Toda baixa de estoque deve gerar movimentacao e historico.

### Gerar venda

- A acao principal deve ser "Gerar venda".
- Ao clicar em "Gerar venda", o botao deve entrar em estado de loading.
- O texto pode mudar para "Gerando venda..." ou equivalente.
- Enquanto estiver gerando, bloquear novo clique para evitar duplicidade.
- Ao concluir, exibir toast de sucesso.
- A venda deve receber status `Gerada`.
- A tela deve permitir imprimir, duplicar ou cancelar a venda conforme regras futuras.

### Validação

- Cliente obrigatório se a regra exigir venda vinculada a cliente.
- Pelo menos um item obrigatório.
- Quantidade obrigatória e maior que zero.
- Produto obrigatório.
- Tamanho obrigatório quando o produto possuir grade.
- Forma de pagamento obrigatória quando houver valor pago.
- Conta a receber obrigatória quando houver saldo em aberto.
- Borda vermelha nos campos com erro.
- Mensagem clara ao gerar venda.
- Scroll ate o primeiro erro.
- Dados preenchidos devem ser mantidos em caso de erro.

### Comportamento

- Bloqueio durante salvamento.
- Indicador de loading.
- Toast ao concluir.
- Impedir saida da tela se houver dados preenchidos ainda nao gerados.
- Permitir limpar venda com confirmacao.
- Alteracoes antes de gerar venda nao precisam criar historico detalhado.
- Apos gerar venda, alteracoes diretas nos itens nao devem ser permitidas nesta primeira versao.
- Para corrigir uma venda gerada, o caminho inicial e cancelar e gerar nova venda.

---

## Encomendas

### Conceito

Registro de pedidos feitos sob encomenda.

A encomenda representa algo que sera feito para o cliente, mas nao gera ordem de producao nesta primeira versao.

### Campos obrigatórios

- Cliente.
- Data.
- Itens.
- Valor total.

### Campos opcionais

- Observacoes.
- Personalizacoes.
- Data prevista de entrega.
- Valor de entrada.
- Saldo em aberto.

### Estrutura da tela

- Cliente.
- Dados da encomenda.
- Itens encomendados.
- Personalizacoes.
- Valores e entrada.
- Status.
- Historico.
- Acoes principais.

### Cliente

- Cliente deve ser selecionado de um cadastro existente ou criado por cadastro rapido.
- O campo de cliente deve seguir o mesmo comportamento de busca/autocomplete da nova venda.
- Ao cadastrar cliente pelo modal, o cliente recem-criado deve ser selecionado automaticamente.
- A encomenda deve ficar vinculada ao cliente.

### Itens e personalizacoes

- A encomenda deve permitir itens cadastrados e itens personalizados.
- Item cadastrado usa produto, categoria, tamanho, quantidade e preco.
- Item personalizado deve permitir descricao livre.
- Personalizacoes devem ficar visiveis na tela e no historico.
- A encomenda nao reserva estoque nesta primeira versao.
- A encomenda pode usar o preco do produto como base, mas deve permitir ajuste conforme regra.

### Valores e entrada

- Deve calcular valor total da encomenda.
- Deve permitir entrada/sinal.
- Entrada pode ser menor que o total.
- Saldo em aberto deve ser calculado automaticamente.
- Entrada registrada deve criar movimentacao financeira ou recebimento vinculado a encomenda.
- Se a encomenda for cancelada, a entrada deve ser estornada ou convertida em credito conforme regra financeira.

### Listagem

- Por padrao, a listagem deve abrir com ordenacao decrescente.
- A ordenacao padrao deve exibir as encomendas mais recentes primeiro.
- A ordenacao padrao pode considerar data de cadastro e, em caso de empate, identificador da encomenda.
- O usuario pode alterar a ordenacao manualmente pelas colunas quando disponivel.
- Deve exibir cliente, data de cadastro, data prevista, valor total, entrada, saldo, status e acoes.
- Deve possuir busca por cliente, data e valor.
- Deve possuir filtro de status.
- Deve possuir filtro de periodo com Hoje, Ultimos 7 dias, Ultimos 30 dias e Personalizado.
- Por padrao, o periodo da listagem deve abrir em Ultimos 7 dias.

### Status

- Aberta.
- Em produção.
- Fabricado parcialmente.
- Pronta.
- Entregue.
- Cancelada.

### Regras

- Status controla comportamento.
- O status "Em producao" indica apenas a fase da encomenda.
- Nao existe ordem de producao nesta primeira versao.
- Encomenda nao reserva estoque.
- Encomenda pode possuir itens personalizados.
- Encomenda pode receber pagamento parcial antes de ficar pronta.
- O pagamento parcial deve ser tratado como entrada.
- Ao ser entregue, a encomenda pode gerar uma venda.
- Venda e encomenda sao registros separados.
- A venda pode ser gerada a partir de uma encomenda pela ação "De Encomenda" na tela de Vendas.
- Uma mesma operacao nao mistura venda imediata e encomenda.
- Caso haja saldo em aberto, deve gerar conta a receber.
- Na leitura visual, o status `Aberta` deve ser tratado para o usuario como `Novo`.
- O status `Fabricado parcialmente` representa que apenas parte dos itens encomendados ja foi fabricada.

### Transicoes de status

- Aberta -> Em producao.
- Aberta -> Fabricado parcialmente.
- Aberta -> Cancelada.
- Em producao -> Fabricado parcialmente.
- Em producao -> Pronta.
- Em producao -> Cancelada.
- Fabricado parcialmente -> Pronta.
- Fabricado parcialmente -> Cancelada.
- Pronta -> Entregue.
- Pronta -> Cancelada.
- Entregue nao deve voltar de status nesta primeira versao, salvo regra futura.
- Cancelada nao deve ser editada.

### Acoes principais

- Salvar.
- Marcar como em producao.
- Marcar como fabricado parcialmente.
- Marcar como pronta.
- Marcar como entregue.
- Gerar venda, quando aplicavel.
- Cancelar com justificativa.
- Duplicar, se fizer sentido para uma nova encomenda parecida.

### Finalizacao parcial

- Ao finalizar uma encomenda, o sistema deve abrir uma tela ou modal para selecionar quais pijamas ja foram fabricados.
- Por padrao, todos os itens devem vir marcados.
- O usuario pode desmarcar os itens que ainda nao foram fabricados.
- Se todos os itens estiverem marcados, a encomenda pode seguir para `Pronta`.
- Se apenas parte estiver marcada, a encomenda deve ficar com status `Fabricado parcialmente`.
- Esse fluxo deve preservar clareza visual sobre o que ja foi produzido e o que ainda falta.

### Cores de status de encomenda

- `Novo`: azul do sistema.
- `Em producao`: amarelo.
- `Fabricado parcialmente`: marrom claro / caramelo.
- `Pronta`: verde.
- `Entregue`: neutro.
- `Cancelada`: vermelho.

### Cancelamento

- Exige justificativa.
- Mantém histórico.
- Estorna pagamentos ou creditos conforme regra financeira.
- Nao remove a encomenda fisicamente.
- Bloqueia novas alteracoes apos cancelamento.

---

## Ficha

### Conceito

Consignado para revendedora.

A ficha representa produtos enviados para uma revendedora, que devolve parte dos itens depois e paga apenas o que foi vendido.

### Fluxo

- Criar.
- Devolver.
- Ajustar.
- Finalizar.
- Gerar venda.
- Gerar venda pela tela de Vendas usando a ação "De Ficha".

### Estrutura da tela

- Revendedora.
- Data de abertura.
- Itens enviados.
- Devolucoes.
- Vendido calculado.
- Pagamentos.
- Saldo.
- Historico.
- Acoes principais.

### Revendedora

- A ficha deve estar vinculada a uma cliente/revendedora.
- A revendedora deve ser cliente do tipo atacado ou marcada como revendedora conforme regra do cadastro.
- O campo de revendedora deve permitir busca/autocomplete.
- Deve permitir cadastro rapido de revendedora sem perder os dados da ficha.

### Itens

- Enviado.
- Devolvido.
- Vendido.

### Itens enviados

- Cada item enviado deve possuir produto, tamanho, quantidade e preco de atacado.
- Ao enviar itens para ficha, o estoque deve mover de Disponivel para Em ficha.
- Produto sem saldo disponivel deve ser bloqueado ou sinalizado conforme configuracao futura.
- A ficha deve mostrar total de pecas enviadas.

### Devolucoes

- Deve permitir registrar multiplas devolucoes.
- Cada devolucao deve informar produto, tamanho, quantidade e data.
- Quantidade devolvida nao pode ultrapassar quantidade enviada ainda nao devolvida.
- Ao registrar devolucao, o estoque deve retornar de Em ficha para Disponivel.
- Cada devolucao deve gerar historico.

### Vendido calculado

- Vendido = Enviado - Devolvido.
- O usuario nao informa vendido manualmente.
- O sistema deve recalcular vendido a cada devolucao ou ajuste.
- O total financeiro da ficha deve considerar apenas os itens vendidos.

### Pagamentos

- Permite pagamento parcial.
- Pagamentos devem ficar vinculados a ficha.
- Se houver saldo ao finalizar, deve gerar conta a receber.
- Pagamentos devem respeitar formas de pagamento e taxas quando aplicavel.

### Regras

- Vendido calculado automaticamente.
- Permite múltiplas devoluções.
- Cada ação gera histórico.
- Nao possui limite de credito nesta primeira versao.
- Nao possui prazo obrigatorio de devolucao nesta primeira versao.
- Utiliza preco de atacado.
- Permite pagamento parcial.
- Ao finalizar, gera uma venda com os itens vendidos.
- A ficha também pode ser usada como origem de venda pela ação "De Ficha" na tela de Vendas.
- A ação "De Ficha" deve listar fichas disponíveis para geração de venda.
- Fichas disponíveis são fichas com itens vendidos/calculados ainda não vinculados a uma venda.
- Ao selecionar uma ficha, a venda deve carregar os itens vendidos/calculados da ficha.
- A venda gerada deve manter vínculo com a ficha de origem.
- Caso haja saldo em aberto, gera conta a receber.
- Produtos enviados para ficha ficam indisponiveis no estoque disponivel.
- O sistema deve permitir identificar quais produtos estao em ficha e com qual revendedora.

### Status

- Em aberto.
- Parcial.
- Finalizada.
- Cancelada.

### Transicoes de status

- Em aberto: ficha criada e com itens enviados.
- Parcial: ficha com devolucao ou pagamento parcial, mas ainda nao finalizada.
- Finalizada: ficha encerrada e venda gerada ou pronta para vinculo financeiro.
- Cancelada: ficha cancelada com justificativa.
- Ficha finalizada nao deve aceitar novas devolucoes nesta primeira versao.
- Ficha cancelada nao deve ser editada.

### Regras adicionais

- Bloqueia cancelamento se houver venda.
- Permite reabertura conforme regra.
- Reabertura deve exigir historico e justificativa.
- Cancelamento sem venda deve retornar itens em ficha para disponivel, conforme regra.
- Cancelamento com venda vinculada deve ser bloqueado para evitar divergencia financeira e de estoque.

---

## Produtos

### Conceito

Produtos sao as pecas vendidas pela loja, organizadas por classificacoes comerciais e por uma categoria operacional.

O modulo deve evitar sobreposicao de conceitos: cada campo possui uma responsabilidade clara para facilitar o cadastro, a busca e a venda.

### Estrutura

- Marca.
- Tipo.
- Subtipo.
- Categoria.
- Coleção.
- Modelo.

### Visao geral consolidada

- Marca: quem assina o produto.
- Tipo: classificacao geral.
- Subtipo: detalhamento do tipo.
- Categoria: define regras operacionais, principalmente grade de tamanhos.
- Colecao: agrupamento comercial ou sazonal.
- Modelo: identificacao base da peca.

### Fluxo ideal de preenchimento

1. Marca.
2. Tipo.
3. Subtipo.
4. Categoria.
5. Colecao.
6. Modelo.

### Marca

Representa a identidade comercial do produto.

Responsabilidades:

- Identificar a origem comercial do produto.
- Permitir agrupamento por marca.
- Facilitar relatorios e filtros.
- Organizar visualmente produtos no sistema.

Regras:

- Cada produto deve possuir uma unica marca.
- Nao permitir exclusao se houver produtos vinculados.
- Permitir inativacao.

### Tipo

Representa a classificacao macro do produto.

Exemplos:

- Curto.
- Longo.

Responsabilidades:

- Separar grandes grupos de produtos.
- Servir como base para os subtipos.
- Orientar o cadastro de forma mais rapida.

Regras:

- Cada produto deve possuir um tipo.
- O tipo controla quais subtipos estarao disponiveis.

### Subtipo

Representa o detalhamento direto do tipo.

Exemplo:

Tipo: curto.

Subtipos:

- Camisola de alca.
- Conjunto de regata.
- Camisola de manga curta.

Responsabilidades:

- Refinar a classificacao do produto.
- Facilitar busca e organizacao.
- Melhorar clareza no cadastro.

Regras:

- Cada produto deve possuir um subtipo.
- O subtipo deve estar obrigatoriamente vinculado a um tipo.
- O sistema deve filtrar os subtipos com base no tipo escolhido.

### Categoria

Define a estrutura operacional do produto dentro do sistema.

Diferente de marca, tipo, subtipo, colecao e modelo, a categoria influencia diretamente o comportamento do produto no cadastro e na venda.

Responsabilidades:

- Definir a grade de tamanhos do produto.
- Padronizar o cadastro.
- Controlar comportamento da entrada de quantidades.
- Garantir consistencia entre produtos do mesmo tipo estrutural.

### Grade de tamanhos

A grade de tamanhos pertence a categoria, nao ao produto.

Regras:

- A categoria possui uma lista ordenada de tamanhos.
- Todo produto vinculado a essa categoria herda a grade automaticamente.
- O usuario nao cadastra tamanhos no produto.
- O usuario informa apenas a quantidade por tamanho.
- A ordem dos tamanhos deve ser configuravel na categoria.
- Nao permitir tamanhos duplicados na mesma categoria.
- Nao permitir alterar a grade de uma categoria se houver produtos vinculados, exceto com regra especifica de tratamento de impacto.
- Nao permitir excluir categoria com produtos vinculados.
- Permitir inativacao de categoria.
- Vendas antigas devem manter os tamanhos registrados corretamente.

Exemplos:

```text
Categoria: Camisola Adulto
Grade: P, M, G, GG

Categoria: Infantil
Grade: 2, 4, 6, 8

Categoria: Plus Size
Grade: G1, G2, G3
```

Exemplo de entrada de quantidade:

```text
Tamanho | Quantidade
P       | 10
M       | 15
G       | 8
GG      | 5
```

Comportamento no cadastro:

- Ao selecionar a categoria, o sistema carrega automaticamente a grade de tamanhos.
- A tela exibe uma estrutura de tamanho x quantidade.
- O usuario nao precisa digitar tamanhos manualmente.
- A grade evita inconsistencias como "M", "Medio" e "Médio".

Comportamento na venda:

- Ao adicionar um produto, o sistema deve respeitar a grade configurada na categoria.
- A selecao pode ser feita por tamanho especifico.
- A selecao pode evoluir para uma matriz de tamanho x quantidade.

### Colecao

Representa um agrupamento comercial ou sazonal.

Exemplos:

- Verao 2026.
- Inverno 2026.
- Dia das Maes.
- Linha Basica.

Responsabilidades:

- Organizar produtos por periodo ou campanha.
- Facilitar analises comerciais.
- Melhorar visualizacao de lancamentos.

Regras:

- Produto pode possuir uma colecao ou nenhuma.
- Colecao nao impacta regras operacionais.
- Colecao serve apenas para organizacao.

### Modelo

Representa o nome ou identificacao base da peca.

Exemplos:

- Aurora.
- Luna.
- Soft.

Responsabilidades:

- Identificar o design ou familia do produto.
- Diferenciar produtos semelhantes.
- Facilitar reconhecimento comercial.

Regras:

- Pode ser um campo simples ou um cadastro proprio.
- Pode ser reutilizado entre produtos.
- Nao impacta regra estrutural do sistema.

### Cadastro

- Nome único.
- Referência única.
- Preço varejo.
- Preço atacado.
- Imagem.
- Grade de quantidades herdada da categoria.

### Estrutura da tela

- Dados principais.
- Classificacao.
- Precificacao.
- Grade e saldo inicial.
- Imagem.
- Status.
- Historico.

### Dados principais

- Nome do produto.
- Referencia.
- Descricao opcional.
- Imagem.
- Status.
- Observacoes internas.

### Precificacao

- Preco varejo obrigatorio.
- Preco atacado obrigatorio quando houver venda para clientes atacado.
- Preco atacado pode ser igual ou menor que preco varejo, conforme regra comercial.
- Alteracao de preco nao deve alterar vendas antigas.
- Historico deve registrar alteracoes de preco.

### Grade e estoque inicial

- Ao selecionar categoria, carregar grade de tamanhos.
- O cadastro pode permitir informar saldo inicial por tamanho.
- Saldo inicial deve gerar movimentacao de estoque.
- Alterar saldo depois do cadastro deve ser feito por movimentacao/ajuste de estoque, nao por edicao direta do produto.

### Status

- Ativo.
- Inativo.

### Listagem

- Agrupado por marca.
- Deve permitir busca por nome, referencia, marca, tipo, subtipo, categoria, colecao e modelo.
- Deve permitir filtro por status.
- Deve permitir filtro por marca, tipo, subtipo, categoria e colecao.
- Deve exibir preco varejo, preco atacado, status e saldo resumido.
- Deve abrir por padrao em ordem alfabetica ou por marca, conforme configuracao.

### Regras

- Produto inativo não aparece em novos lançamentos.
- Pode restringir uso por contexto.
- Produto deve possuir uma unica marca.
- Produto deve possuir um tipo.
- Produto deve possuir um subtipo.
- Produto deve possuir uma categoria.
- Produto pode possuir uma colecao ou nenhuma.
- Modelo nao deve impactar regras estruturais do sistema.
- Produto com venda, ficha, encomenda ou movimentacao de estoque nao deve ser excluido fisicamente.
- Produto deve ser inativado quando nao for mais usado.
- Referencia deve ser unica.
- Nome deve ser unico ou exigir confirmacao caso exista nome semelhante.

---

## Estoque

### Conceito

Controle simples de saldo por produto e tamanho.

O objetivo inicial e saber o que esta disponivel, o que saiu em venda e o que esta em ficha com revendedora, sem criar uma estrutura complexa de almoxarifado ou producao.

### Saldos principais

- Disponivel.
- Em ficha.
- Vendido.

### Estrutura da tela

- Busca.
- Filtros.
- Saldos por produto e tamanho.
- Movimentacoes.
- Rastreio de ficha.
- Acoes de entrada e ajuste.

### Busca e filtros

- Buscar por produto, referencia, tamanho e revendedora.
- Filtrar por marca, categoria, status do produto e saldo.
- Filtrar produtos com saldo zerado.
- Filtrar produtos com saldo em ficha.

### Regras

- Produto pronto entra no estoque por produto e tamanho.
- Venda gerada baixa o saldo disponivel.
- Ficha movimenta produtos de disponivel para em ficha.
- Devolucao de ficha movimenta produtos de em ficha para disponivel.
- Finalizacao de ficha baixa como vendido apenas o que nao foi devolvido.
- Cancelamento deve gerar movimento reverso quando houver impacto no estoque.
- Nenhuma movimentacao de estoque deve apagar o historico anterior.

### Movimentacoes

- Entrada.
- Saida por venda.
- Envio para ficha.
- Devolucao de ficha.
- Baixa por finalizacao de ficha.
- Ajuste manual.
- Estorno por cancelamento.

Regras de movimentacao:

- Toda movimentacao deve registrar data, origem, produto, tamanho, quantidade, usuario e observacao.
- Ajuste manual deve exigir justificativa.
- Movimentacao nao deve ser apagada.
- Saldo atual deve ser resultado das movimentacoes.

### Rastreio de ficha

O sistema deve permitir consultar:

- Produto.
- Tamanho.
- Quantidade em ficha.
- Revendedora responsavel.
- Data de envio.
- Ficha de origem.

### Observacao sobre complexidade

Controle de estoque por saldo nao e dificil se as regras forem mantidas simples.

O ponto principal e registrar toda entrada e saida como movimentacao, em vez de apenas alterar um numero solto. Assim o saldo atual pode ser calculado ou conferido pelo historico.

### Alertas

- Sinalizar produto sem saldo.
- Sinalizar quantidade em ficha.
- Sinalizar tentativa de vender mais que o disponivel.
- Sinalizar divergencia de saldo quando houver ajuste manual.

---

## Clientes

### Campos

- Nome.
- Telefone.
- CPF.
- Endereço.
- Crédito.
- Tipo de cliente.

### Estrutura da tela

- Dados principais.
- Contato.
- Endereco.
- Tipo de cliente.
- Credito.
- Historico.
- Vendas, encomendas, fichas e contas vinculadas.

### Dados principais

- Nome obrigatorio.
- Telefone recomendado.
- CPF opcional nesta primeira versao.
- Endereco opcional.
- Tipo de cliente: varejo ou atacado.
- Status: ativo ou inativo.

### Crédito

- Pode ser negativo.
- Histórico completo.
- Pode abater valores.
- Credito positivo pode ser usado para abater venda, ficha, encomenda ou conta a receber.
- Credito negativo indica valor devido ou ajuste contra o cliente.
- Toda alteracao de credito deve gerar historico.
- Ajuste manual de credito deve exigir observacao.

### Cadastro rápido

- Modal.
- Deve pedir apenas campos essenciais.
- Deve estar disponivel na venda, encomenda e ficha.
- Ao concluir, seleciona automaticamente o cliente no fluxo que chamou o modal.
- Nao deve limpar os dados ja preenchidos no fluxo de origem.

### Atacado

- Cliente pode ser marcado como atacado no cadastro.
- Cliente atacado usa preco atacado por padrao nas vendas.
- Leva produtos.
- Devolve depois.
- Paga apenas vendido.

### Listagem

- Deve exibir nome, telefone, tipo, credito, status e acoes.
- Deve permitir busca por nome, telefone e CPF.
- Deve permitir filtro por tipo de cliente.
- Deve permitir filtro por status.
- Deve permitir acessar rapidamente vendas, encomendas, fichas e contas vinculadas.

### Regras

- Cliente com movimentacao nao deve ser excluido fisicamente.
- Cliente pode ser inativado.
- Cliente inativo nao deve aparecer como sugestao principal em novos lancamentos.
- Cliente inativo pode continuar visivel em registros antigos.

---

## Formas de Pagamento

### Campos

- Nome.
- Tipo.
- Status.

### Tipos sugeridos

- Dinheiro.
- Pix.
- Cartao de debito.
- Cartao de credito.
- Transferencia.
- Outro.

### Aba Taxas

A aba de taxas deve sempre aparecer no cadastro da forma de pagamento.

Campos sugeridos:

- Percentual da taxa.
- Valor fixo, se houver.
- Numero de parcelas.
- Prazo estimado de recebimento.
- Status.

### Estrutura da tela

- Dados principais.
- Aba Taxas.
- Regras de troco.
- Status.
- Historico.

### Regras

- Permite troco.
- Taxa não altera venda.
- Afeta valor recebido.
- A taxa deve ser usada para calcular recebido liquido.
- Venda registra o valor faturado.
- Financeiro registra recebido real considerando taxas.
- Forma inativa nao deve aparecer em novos pagamentos.
- Forma usada em venda ou recebimento nao deve ser excluida fisicamente.
- Taxa pode variar por parcela.
- Taxa pode ser percentual, valor fixo ou combinacao dos dois.
- Prazo de recebimento serve para previsao financeira futura.

---

## Contas a Receber

### Estrutura

- Cliente.
- Origem.
- Total.
- Recebido.
- Saldo.
- Status.
- Parcelas.

### Estrutura da tela

- Dados da conta.
- Origem.
- Parcelas.
- Recebimentos.
- Saldo.
- Historico.
- Acoes.

### Origem

- Venda.
- Ficha.
- Encomenda.
- Ajuste manual.

### Status

- Aberto.
- Parcial.
- Pago.
- Atrasado.

### Parcelas

- Conta pode possuir uma ou mais parcelas.
- Parcela deve possuir valor, vencimento, recebido, saldo e status.
- Recebimento pode quitar uma parcela inteira ou parcialmente.
- Soma das parcelas deve bater com o total da conta.
- Alteracao manual de parcela deve exigir historico.

### Regras

- Geradas automaticamente.
- Múltiplos pagamentos.
- Crédito pode abater.
- Cancelar venda remove vínculo.
- Deve registrar faturamento e recebimento real.
- Deve permitir parcelamento.
- Deve permitir recebimento parcial.
- Deve considerar taxas da forma de pagamento para calcular valor liquido.
- Deve permitir cancelamentos e estornos mantendo historico.
- Deve permitir uso de credito de cliente.
- Deve permitir registrar recebimento.
- Recebimento deve informar data, valor, forma de pagamento e observacao opcional.
- Taxas devem impactar recebido liquido.
- Conta paga deve bloquear novos recebimentos, exceto estorno ou ajuste.
- Conta cancelada ou vinculada a origem cancelada deve ficar visivel no historico.
- Atrasado pode ser calculado pela data de vencimento.

### Acoes

- Registrar recebimento.
- Usar credito.
- Estornar recebimento.
- Ver origem.
- Ajustar vencimento, se permitido.
- Cancelar conta manual, se for ajuste manual.

### Conceitos financeiros iniciais

- Faturado: valor total da venda, encomenda ou ficha.
- Recebido bruto: valor pago pelo cliente.
- Taxa: desconto operacional da forma de pagamento.
- Recebido liquido: valor realmente recebido apos taxas.
- Em aberto: saldo ainda nao recebido.

---

## Histórico

Disponível em todos os módulos principais.

### Conteúdo

- Data e hora.
- Usuário.
- Origem.
- Ação.
- Antes/depois.
- Observação.

### Origem

- Manual.
- Sistema.

### Eventos que devem gerar histórico

- Criação de registro.
- Alteração de campos importantes.
- Mudança de status.
- Cancelamento.
- Estorno.
- Ajuste manual.
- Entrada ou saída de estoque.
- Registro de pagamento.
- Uso de crédito.
- Alteração de preço.
- Geração de venda a partir de encomenda ou ficha.

### Regras

- Historico deve ser somente leitura.
- Historico nao deve ser apagado pelo usuario.
- Deve mostrar antes/depois quando houver alteracao de dados.
- Deve aceitar observacao em acoes manuais.
- Acoes automaticas devem indicar origem Sistema.
- Mesmo com apenas um usuario na primeira versao, registrar usuario padrao ou identificacao do operador.

---

## Concorrência

### Se houver alteração simultânea

- Exibir aviso.
- Preservar dados digitados pelo usuario sempre que possivel.
- Informar que o registro foi atualizado externamente.
- Permitir recarregar dados.
- Em caso de conflito ao salvar, impedir sobrescrever silenciosamente.

### Mensagem

```text
Este registro foi atualizado por outro usuário
```

### Primeira versao

- Como havera poucos usuarios, a concorrencia pode ser simples.
- O sistema deve pelo menos identificar quando o registro mudou desde que foi aberto.
- Caso isso aconteca, avisar antes de salvar.

---

## Usuarios e Permissoes

### Primeira versao

- Sistema pensado para uma confeccao pequena.
- Uso principal por mae e filha.
- Apenas um perfil operacional controla tudo.
- Nao havera regras avancadas de permissao nesta primeira versao.

### Futuro

Perfis podem ser criados depois, se necessario.

Exemplos:

- Administrador.
- Vendedora.
- Financeiro.
- Producao.
- Consulta.

---

## UX

### Padrões

- Toast no canto inferior.
- Confirmar e cancelar.
- Mensagens claras e curtas.
- Acoes destrutivas exigem confirmacao.
- Cancelamentos exigem justificativa.
- Status deve ser visivel em registros importantes.
- O sistema deve priorizar leitura rapida, consistencia e sensacao constante de retorno visual.

### Comportamentos

- Scroll até erro.
- Loading.
- Bloqueio durante ações.
- Bloqueio de duplo clique em salvar, cadastrar, finalizar ou confirmar.
- Botoes de acao devem indicar "Salvando..." ou texto equivalente enquanto o processamento estiver em andamento.
- Formularios devem manter dados preenchidos quando ocorrer erro.
- Campos obrigatorios devem ser indicados visualmente.
- Listagens devem manter filtros ao voltar para a tela quando possivel.
- Modais devem fechar com `Esc`, salvo quando houver alteracoes pendentes.
- Ao sair de uma tela com alteracoes pendentes, pedir confirmacao.
- Hover em botoes, cards clicaveis e itens de menu deve ser visualmente perceptivel.
- Feedback de clique e selecao deve ser claro em calendario, sidebar e breadcrumbs.
- Sempre que possivel, o sistema deve evitar scroll da pagina inteira quando a interacao puder acontecer dentro de um bloco especifico.

### Tema e identidade visual

- A cor primaria do sistema e `#1FA3FF`.
- As demais cores do sistema devem derivar dessa primaria, mantendo coerencia visual.
- A sidebar deve seguir a paleta principal do sistema.
- Componentes com status nao devem usar azuis aleatorios fora do design system.

---

## Infra e Arquitetura

- Nesta fase, a arquitetura possui frontend com dados mockados em `localStorage`.
- O sistema pode manter persistencias locais apenas para preferencias por maquina, como atalhos.
- Configuracoes de atalhos devem usar JSON de defaults + persistencia local por maquina.
- Cada tela carrega apenas o necessário.
- Evitar carregamento massivo.
- Listagens devem usar paginacao ou carregamento incremental quando houver muitos registros.
- Consultas devem respeitar filtros e periodo para evitar carregar dados desnecessarios.
- Cadastros usados em buscas/autocomplete devem carregar sob demanda.
- Imagens de produtos devem ter tamanho otimizado.
- Acoes criticas devem ser transacionais quando envolverem financeiro e estoque.

### Objetivos

- Performance.
- Clareza.
- Escalabilidade.
- Confiabilidade dos saldos.
- Facilidade de manutencao.
- Evoluir regras de negocio e UX junto com a persistencia definitiva, sem transformar este documento em especificacao tecnica de codigo.

---

## Futuro

- Trocas.
- Relatórios.
- Financeiro avançado.
- Permissões avançadas.
