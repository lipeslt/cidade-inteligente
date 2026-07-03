# Requirements Document

## Introduction

O aplicativo Conecta Sorriso (Cidade Inteligente) atualmente oferece funcionalidades genéricas para todos os usuários (login, criar solicitação, visualizar próprias solicitações). Esta feature adiciona telas e funcionalidades específicas por papel (role) para usuários do tipo "técnico" e "admin", incluindo dashboards dedicados, filas de trabalho, navegação condicional e permissões diferenciadas de visualização e ação sobre solicitações.

## Glossary

- **App**: O aplicativo móvel Conecta Sorriso construído com React Native, Expo Router, Tamagui e Zustand
- **Auth_Store**: O store Zustand que mantém o estado de autenticação incluindo o objeto Usuario com o campo tipo
- **Tab_Layout**: O componente de navegação por abas (Tabs) que define a estrutura de navegação principal do App
- **Role_Router**: O mecanismo que determina qual conteúdo e navegação exibir com base no campo usuario.tipo da Auth_Store
- **Técnico**: Usuário com tipo "tecnico" na Auth_Store, responsável por atender solicitações em campo
- **Admin**: Usuário com tipo "admin" na Auth_Store, responsável por gerenciar e supervisionar todas as solicitações
- **Cidadão**: Usuário com tipo "cidadao" na Auth_Store, que cria solicitações e visualiza apenas as próprias
- **Solicitação**: Uma requisição de serviço público criada por um cidadão, contendo descrição, status e metadados
- **Fila_Trabalho**: Lista de todas as solicitações disponíveis para o Técnico atuar, obtida via GET /solicitacoes
- **Painel_Admin**: Tela administrativa com estatísticas, listagem completa e filtros de todas as solicitações
- **Dashboard**: Tela inicial personalizada com informações resumidas e ações rápidas baseadas no papel do usuário
- **Status_Solicitacao**: Um dos valores: aberto, em_analise, em_andamento, resolvido, fechado, cancelado
- **API**: A API REST em https://cidadeinteligente.online/conecta_boaesperanca/api

## Requirements

### Requirement 1: Navegação Condicional por Papel

**User Story:** Como usuário autenticado, eu quero que a navegação do App se adapte ao meu papel, para que eu veja apenas opções relevantes à minha função.

#### Acceptance Criteria

1. WHEN um usuário com tipo "cidadao" faz login, THE Tab_Layout SHALL exibir as abas: Início, +Nova Solicitação, Perfil
2. WHEN um usuário com tipo "tecnico" faz login, THE Tab_Layout SHALL exibir as abas: Início, Solicitações, Perfil
3. WHEN um usuário com tipo "admin" faz login, THE Tab_Layout SHALL exibir as abas: Início, Painel, Perfil
4. THE Role_Router SHALL determinar as abas visíveis consultando o campo tipo do objeto usuario na Auth_Store
5. WHEN o campo tipo da Auth_Store contém um valor diferente de "cidadao", "tecnico" ou "admin", THE Tab_Layout SHALL exibir as abas padrão de cidadão

### Requirement 2: Dashboard do Cidadão

**User Story:** Como cidadão, eu quero ver a tela inicial atual com ações rápidas, para que eu possa criar solicitações e acompanhar as minhas.

#### Acceptance Criteria

1. WHILE o usuario.tipo é "cidadao", THE Dashboard SHALL exibir a saudação personalizada com o primeiro nome do usuário
2. WHILE o usuario.tipo é "cidadao", THE Dashboard SHALL exibir atalhos para "Nova Solicitação" e "Minhas Solicitações"
3. WHILE o usuario.tipo é "cidadao", THE Dashboard SHALL exibir a seção informativa "Como funciona"

### Requirement 3: Dashboard do Técnico

**User Story:** Como técnico, eu quero ver um painel com resumo do meu trabalho pendente, para que eu saiba rapidamente quantas solicitações preciso atender.

#### Acceptance Criteria

1. WHILE o usuario.tipo é "tecnico", THE Dashboard SHALL exibir contadores de solicitações agrupados por Status_Solicitacao
2. WHILE o usuario.tipo é "tecnico", THE Dashboard SHALL exibir um atalho para acessar a Fila_Trabalho
3. WHILE o usuario.tipo é "tecnico", THE Dashboard SHALL exibir as 5 solicitações mais recentes com status "aberto" ou "em_andamento"
4. WHEN o Técnico pressiona uma solicitação no Dashboard, THE App SHALL navegar para a tela de detalhe da solicitação correspondente

### Requirement 4: Dashboard do Admin

**User Story:** Como admin, eu quero ver um painel com visão geral de todas as solicitações, para que eu possa supervisionar o atendimento da cidade.

#### Acceptance Criteria

1. WHILE o usuario.tipo é "admin", THE Dashboard SHALL exibir contadores totais de solicitações agrupados por Status_Solicitacao
2. WHILE o usuario.tipo é "admin", THE Dashboard SHALL exibir as 10 solicitações mais recentes de todos os cidadãos
3. WHILE o usuario.tipo é "admin", THE Dashboard SHALL exibir um atalho para acessar o Painel_Admin
4. WHEN o Admin pressiona uma solicitação no Dashboard, THE App SHALL navegar para a tela de detalhe da solicitação correspondente

### Requirement 5: Fila de Trabalho do Técnico

**User Story:** Como técnico, eu quero visualizar todas as solicitações disponíveis para atendimento, para que eu possa selecionar e atuar nas que forem pertinentes.

#### Acceptance Criteria

1. THE Fila_Trabalho SHALL listar todas as solicitações obtidas via GET /solicitacoes com paginação
2. THE Fila_Trabalho SHALL exibir para cada solicitação: descrição, nome do serviço, status e data de criação
3. WHEN o Técnico seleciona um filtro de status, THE Fila_Trabalho SHALL exibir apenas solicitações com o Status_Solicitacao selecionado
4. WHEN o Técnico pressiona uma solicitação na Fila_Trabalho, THE App SHALL navegar para a tela de detalhe com controles do técnico visíveis
5. WHEN o Técnico rola até o final da lista, THE Fila_Trabalho SHALL carregar a próxima página de resultados automaticamente
6. WHEN a Fila_Trabalho está carregando dados, THE App SHALL exibir um indicador de carregamento
7. IF a requisição GET /solicitacoes falhar, THEN THE Fila_Trabalho SHALL exibir mensagem de erro com opção de tentar novamente

### Requirement 6: Painel Administrativo

**User Story:** Como admin, eu quero um painel completo com todas as solicitações e capacidade de filtro e busca, para que eu possa gerenciar o atendimento de forma eficiente.

#### Acceptance Criteria

1. THE Painel_Admin SHALL listar todas as solicitações de todos os usuários obtidas via GET /solicitacoes com paginação
2. THE Painel_Admin SHALL exibir contadores de solicitações por cada Status_Solicitacao no topo da tela
3. WHEN o Admin seleciona um filtro de status, THE Painel_Admin SHALL exibir apenas solicitações com o Status_Solicitacao selecionado
4. WHEN o Admin informa um intervalo de datas (data_inicio e data_fim), THE Painel_Admin SHALL exibir apenas solicitações criadas dentro do período
5. WHEN o Admin pressiona uma solicitação no Painel_Admin, THE App SHALL navegar para a tela de detalhe da solicitação
6. WHEN o Admin rola até o final da lista, THE Painel_Admin SHALL carregar a próxima página de resultados automaticamente
7. IF a requisição GET /solicitacoes falhar, THEN THE Painel_Admin SHALL exibir mensagem de erro com opção de tentar novamente

### Requirement 7: Alteração de Status pelo Admin

**User Story:** Como admin, eu quero alterar o status de qualquer solicitação, para que eu possa intervir quando necessário no fluxo de atendimento.

#### Acceptance Criteria

1. WHILE o usuario.tipo é "admin", THE App SHALL exibir controles de alteração de status na tela de detalhe de qualquer solicitação
2. WHEN o Admin seleciona um novo status e confirma, THE App SHALL enviar POST /solicitacoes/{id}/status com o status selecionado e comentário opcional
3. WHEN a API retorna ok:true após alteração de status, THE App SHALL exibir mensagem de sucesso e atualizar o status exibido
4. IF a API retorna erro "acesso_negado", THEN THE App SHALL exibir mensagem informando que a ação não é permitida
5. IF a API retorna erro "solicitacao_nao_encontrada", THEN THE App SHALL exibir mensagem de erro e navegar de volta para a listagem

### Requirement 8: Localização GPS do Técnico

**User Story:** Como técnico, eu quero compartilhar minha localização GPS vinculada a uma solicitação, para que a equipe saiba onde estou durante o atendimento.

#### Acceptance Criteria

1. WHILE o usuario.tipo é "tecnico" e a tela de detalhe está aberta, THE App SHALL exibir o botão "Compartilhar Localização"
2. WHEN o Técnico pressiona "Compartilhar Localização", THE App SHALL solicitar permissão de GPS caso não concedida
3. WHEN a permissão de GPS é concedida, THE App SHALL capturar a posição atual e enviar POST /tecnico/localizacao com id_solicitacao, latitude e longitude
4. WHEN a API retorna ok:true, THE App SHALL exibir mensagem de sucesso por 3 segundos
5. IF a permissão de GPS é negada, THEN THE App SHALL exibir mensagem informando que o acesso à localização é necessário
6. IF a requisição POST /tecnico/localizacao falhar, THEN THE App SHALL exibir mensagem de erro e permitir nova tentativa

### Requirement 9: Texto em Português Brasileiro

**User Story:** Como usuário, eu quero que toda a interface esteja em português brasileiro, para que eu compreenda todas as informações e ações disponíveis.

#### Acceptance Criteria

1. THE App SHALL exibir todos os textos de interface (labels, botões, mensagens, placeholders) em português brasileiro (pt-BR)
2. THE App SHALL exibir mensagens de erro da API traduzidas para português brasileiro
3. THE App SHALL exibir nomes de Status_Solicitacao no formato legível em português: "Aberta", "Em Análise", "Em Andamento", "Resolvida", "Fechada", "Cancelada"
