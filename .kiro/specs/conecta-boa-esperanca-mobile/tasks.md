# Implementation Plan: Conecta Boa Esperança Mobile

## Overview

Implementação incremental do aplicativo mobile React Native (Expo) + Tamagui + TypeScript. O plano reestrutura o projeto atual (biblioteca UI Tamagui) em um app Expo funcional, implementa camada de serviços (Axios + interceptors), estado global (Zustand), navegação (Expo Router com tabs), telas e componentes UI, e testes (Jest + fast-check).

## Tasks

- [x] 1. Reestruturar projeto como Expo App
  - [x] 1.1 Reestruturar package.json e instalar dependências Expo
    - Substituir a configuração de biblioteca Tamagui por um package.json de app Expo
    - Manter dependências Tamagui 2.4, adicionar expo, expo-router, expo-secure-store, expo-location, expo-image-picker, react-native-maps, axios, zustand, fast-check, jest, @testing-library/react-native
    - Configurar scripts: start, android, ios, test
    - Criar/atualizar app.json com configuração Expo (scheme, plugins)
    - Criar tsconfig.json compatível com Expo Router
    - Criar babel.config.js com preset expo
    - _Requirements: 12.7_

  - [x] 1.2 Criar estrutura de diretórios do app
    - Criar diretórios: app/, app/(tabs)/, src/services/, src/stores/, src/components/, src/utils/, src/types/, __tests__/
    - Remover arquivos de build de biblioteca (dist/, types/, native/, web/, linear-gradient/, native-test/, bundle-native.mjs)
    - Manter tamagui.config.ts
    - _Requirements: 12.7_

  - [x] 1.3 Configurar Tamagui Provider e tema
    - Criar app/_layout.tsx (Root Layout) com TamaguiProvider
    - Configurar tamagui.config.ts com tokens, temas e fonts para o app
    - _Requirements: 12.7_

- [x] 2. Implementar tipos e utilitários base
  - [x] 2.1 Criar tipos TypeScript (src/types/)
    - Definir interfaces: Usuario, Setor, Servico, Solicitacao, SolicitacaoDetalhe, Foto, LocalizacaoTecnico, ImageFile, ApiErrorResponse
    - Definir types: TipoUsuario, Prioridade, StatusSolicitacao, ErrorType
    - Definir interfaces de request/response: LoginRequest, LoginResponse, CriarSolicitacaoRequest, ListarSolicitacoesParams, PaginacaoResponse, AlterarStatusRequest
    - _Requirements: 6.4, 10.2_

  - [x] 2.2 Implementar funções de validação (src/utils/validation.ts)
    - validateLoginForm(email, senha): verifica campos obrigatórios e formato email
    - validateSolicitacaoForm(data): verifica id_servico > 0 e descricao não vazia
    - validatePrioridade(value): aceita apenas "baixa", "media", "alta", "critica"
    - validatePhoto(file): verifica tamanho ≤ 2MB e extensão ∈ {jpg,jpeg,png,gif,bmp,webp}
    - validatePhotoSet(files): verifica count ≤ 5 e cada foto individual
    - validateComentario(text): verifica length ≤ 500
    - _Requirements: 1.3, 6.1, 6.4, 6.5, 6.6, 6.7, 6.8, 10.3_

  - [ ]* 2.3 Property tests para validação (Property 2, 4, 5, 12)
    - **Property 2: Solicitação form required field validation**
    - **Property 4: Prioridade value restriction**
    - **Property 5: Photo attachment validation**
    - **Property 12: Comentário length enforcement**
    - **Validates: Requirements 6.1, 6.4, 6.5, 6.6, 6.7, 10.3**

  - [x] 2.4 Implementar funções de formatação (src/utils/formatters.ts)
    - formatCoordinateCitizen(value): formata coordenada com até 6 casas decimais
    - formatCoordinateTechnician(value): formata coordenada com até 8 casas decimais
    - truncateDescription(text, maxLength=100): trunca com indicador de ellipsis
    - formatDateTime(dateString): converte "YYYY-MM-DD HH:mm:ss" para "DD/MM/YYYY HH:mm"
    - _Requirements: 7.2, 8.2, 11.2_

  - [ ]* 2.5 Property tests para formatação (Property 6, 7, 8)
    - **Property 6: Coordinate formatting precision**
    - **Property 7: Description truncation**
    - **Property 8: Date formatting for display**
    - **Validates: Requirements 7.2, 8.2, 11.2**

  - [x] 2.6 Implementar mapa de erros e constantes (src/utils/errors.ts)
    - Criar ERROR_MESSAGES record com todas as mensagens mapeadas da API
    - Criar NETWORK_ERROR_MESSAGES (offline, timeout, unexpected)
    - Criar classe AppError com type, message e details
    - _Requirements: 13.1, 13.2, 13.3_

- [x] 3. Implementar camada de serviços (API)
  - [x] 3.1 Criar Axios instance com interceptors (src/services/api.ts)
    - Configurar baseURL (http://cidadeinteligente.online/conecta_boaesperanca/api)
    - Request interceptor: ler token do SecureStore e injetar header Authorization Bearer
    - Response interceptor: classificar erros (offline, timeout, auth, api, unexpected)
    - Response interceptor: em token_invalido/usuario_nao_encontrado → clearSession + redirect /login
    - Timeout default: 30000ms
    - _Requirements: 1.6, 1.7, 13.1, 13.2, 13.3, 13.4_

  - [ ]* 3.2 Property tests para API interceptors (Property 1, 13)
    - **Property 1: Token injection in requests**
    - **Property 13: Network error classification**
    - **Validates: Requirements 1.6, 13.1, 13.2, 13.3**

  - [x] 3.3 Implementar Auth Service (src/services/auth.ts)
    - login(credentials): POST /login com timeout 15s
    - getProfile(): GET /me com timeout 10s
    - storeToken(token, expiresIn): salva no SecureStore com expiresAt calculado
    - clearToken(): remove token e expiresAt do SecureStore
    - getStoredToken(): recupera token se não expirado
    - isTokenValid(): verifica existência e expiração
    - _Requirements: 1.1, 1.8, 2.1, 3.1_

  - [x] 3.4 Implementar Catalog Service (src/services/catalog.ts)
    - listarSetores(): GET /setores com timeout 15s
    - listarServicos(idSetor?): GET /servicos ou /servicos?id_setor={id} com timeout 15s
    - _Requirements: 4.1, 5.1, 5.3_

  - [x] 3.5 Implementar Solicitações Service (src/services/solicitacoes.ts)
    - listar(params): GET /solicitacoes com paginação e filtros
    - detalhar(id): GET /solicitacoes/{id} com timeout 15s
    - criar(data, fotos?): POST /solicitacoes com JSON ou multipart/form-data, prioridade default "media"
    - alterarStatus(id, data): POST /solicitacoes/{id}/status com timeout 30s
    - _Requirements: 6.3, 6.9, 6.10, 6.11, 8.1, 9.1, 10.4_

  - [ ]* 3.6 Property test para default prioridade (Property 3)
    - **Property 3: Default prioridade assignment**
    - **Validates: Requirements 6.3**

  - [x] 3.7 Implementar Location Service (src/services/location.ts)
    - requestPermission(): solicita permissão expo-location
    - getCurrentPosition(timeoutMs=15000): obtém coords com timeout
    - registrarLocalizacaoTecnico(idSolicitacao, coords): POST /tecnico/localizacao com timeout 15s
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 11.2_

- [x] 4. Implementar estado global (Zustand Stores)
  - [x] 4.1 Implementar Auth Store (src/stores/authStore.ts)
    - Estado: user, isAuthenticated, isLoading
    - Actions: login(email, senha), logout(), checkAuth(), clearSession()
    - login: chama authService.login, armazena token, seta user
    - logout: remove token, limpa estado, navega para login
    - checkAuth: verifica token no SecureStore ao abrir app
    - clearSession: chamado pelo interceptor em erros de auth
    - _Requirements: 1.1, 1.7, 2.1, 2.2, 2.3, 12.1, 12.2_

  - [ ]* 4.2 Property test para Auth guard (Property 14)
    - **Property 14: Auth guard enforcement**
    - **Validates: Requirements 12.1**

  - [x] 4.3 Implementar Solicitações Store (src/stores/solicitacoesStore.ts)
    - Estado: solicitacoes[], paginacao, currentFilter, isLoading, error
    - Actions: fetchSolicitacoes(params), loadNextPage(), resetList(), applyFilter(filter)
    - Paginação: incrementa page quando page < total_pages, append resultados
    - Filtro: ao mudar status ou datas, reseta page para 1
    - _Requirements: 8.1, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

  - [ ]* 4.4 Property tests para paginação e filtros (Property 9, 10)
    - **Property 9: Pagination boundary enforcement**
    - **Property 10: Filter application resets pagination**
    - **Validates: Requirements 8.3, 8.4, 8.5**

  - [x] 4.5 Implementar Catalog Store (src/stores/catalogStore.ts)
    - Estado: setores[], servicos[], isLoading, error
    - Actions: fetchSetores(), fetchServicos(idSetor?)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.4, 5.5_

- [x] 5. Checkpoint - Verificar camada de serviços e stores
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implementar componentes UI reutilizáveis
  - [x] 6.1 Criar componentes base (src/components/)
    - LoadingOverlay: Spinner fullscreen com Tamagui
    - ErrorMessage: Card de erro com botão retry e mensagem
    - StatusBadge: Badge colorido por StatusSolicitacao
    - _Requirements: 1.2, 13.4, 8.8_

  - [x] 6.2 Criar componentes de formulário (src/components/)
    - PrioritySelector: Select Tamagui com opções baixa/media/alta/critica
    - StatusSelector: Select com os 6 status (uso pelo técnico)
    - PhotoPicker: Grid de thumbnails com add/remove (max 5), validação de tamanho/formato
    - _Requirements: 6.4, 6.5, 6.6, 6.7, 6.8, 10.2_

  - [x] 6.3 Criar componentes de exibição (src/components/)
    - SolicitacaoCard: Card com descricao truncada, status badge, nome_servico, criado_em formatado
    - MapPreview: MapView compacto com marker para coordenadas
    - _Requirements: 8.2, 7.5, 9.4_

  - [ ]* 6.4 Property test para visibilidade de controles do técnico (Property 11)
    - **Property 11: Técnico-only UI controls visibility**
    - **Validates: Requirements 10.1, 11.1**

- [x] 7. Implementar navegação e telas de autenticação
  - [x] 7.1 Configurar Root Layout com auth guard (app/_layout.tsx)
    - Verificar token no SecureStore ao iniciar
    - Se token válido → redirecionar para (tabs)
    - Se sem token → exibir tela de login
    - Resetar navigation stack no logout
    - _Requirements: 12.1, 12.2_

  - [x] 7.2 Implementar tela de Login (app/login.tsx)
    - Campos email e senha com validação client-side
    - Botão de submit com loading indicator durante request
    - Exibir mensagens de erro mapeadas (email_e_senha_obrigatorios, email_ou_senha_invalidos, email_nao_confirmado)
    - Timeout de 15s com mensagem de falha de conexão
    - Navegação para (tabs) após sucesso
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.8_

  - [x] 7.3 Configurar Tab Layout (app/(tabs)/_layout.tsx)
    - 4 tabs: Início, Nova Solicitação, Minhas Solicitações, Perfil
    - Início selecionado por default
    - Tab ativo visualmente distinto
    - Ícones e labels em pt-BR
    - _Requirements: 12.3, 12.4, 12.6_

- [x] 8. Implementar telas principais
  - [x] 8.1 Implementar tela Início (app/(tabs)/index.tsx)
    - Tela inicial com boas-vindas e acesso rápido às funcionalidades
    - _Requirements: 12.3_

  - [x] 8.2 Implementar tela Perfil (app/(tabs)/perfil.tsx)
    - GET /me com loading indicator
    - Exibir nome, email, tipo, imagem (ou placeholder se null)
    - Botão de logout
    - Tratamento de erro com retry
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 2.1, 2.2_

  - [x] 8.3 Implementar tela Catálogo de Setores/Serviços (app/(tabs)/nova-solicitacao.tsx - seleção)
    - GET /setores com lista mostrando nome, sigla, total_servicos
    - Ao selecionar setor → GET /servicos?id_setor={id}
    - Lista de serviços com nome e nome_setor
    - Empty states: "Nenhum setor disponível no momento" / "Nenhum serviço disponível neste setor"
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.4, 5.5_

  - [x] 8.4 Implementar formulário Nova Solicitação (app/(tabs)/nova-solicitacao.tsx - formulário)
    - Campos: serviço (selecionado), descrição (obrigatório), endereço, bairro, número, prioridade (default media)
    - PhotoPicker para anexar até 5 fotos
    - Captura GPS com expo-location (timeout 15s)
    - MapPreview com marker ao obter coordenadas
    - Mensagem se GPS negado/indisponível
    - Validação client-side antes de submit
    - POST com JSON (sem fotos) ou multipart/form-data (com fotos)
    - Timeout de 30s (60s com fotos)
    - Sucesso: confirmação + navegar para lista em 3s
    - Erro: preservar dados do formulário
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10, 6.11, 6.12, 6.13, 6.14, 6.15, 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 8.5 Property test para preservação de dados em erro de rede (Property 15)
    - **Property 15: Form data preservation on network failure**
    - **Validates: Requirements 6.15, 10.9, 13.5**

- [x] 9. Implementar telas de solicitações
  - [x] 9.1 Implementar lista Minhas Solicitações (app/(tabs)/minhas-solicitacoes/index.tsx)
    - GET /solicitacoes?page=1&per_page=10 com token Bearer
    - Lista com SolicitacaoCard (descricao truncada 100 chars, status_nome, nome_servico, criado_em DD/MM/YYYY HH:mm)
    - Scroll infinito: carregar próxima página ao chegar no fim (enquanto page < total_pages)
    - Filtro por status (aberto, em_analise, em_andamento, resolvido, fechado, cancelado)
    - Filtro por data (data_inicio, data_fim em YYYY-MM-DD)
    - Filtros resetam lista para page=1
    - Empty state: "Nenhuma solicitação encontrada"
    - Loading indicator durante carregamento
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

  - [x] 9.2 Implementar detalhe da Solicitação (app/(tabs)/minhas-solicitacoes/[id].tsx)
    - GET /solicitacoes/{id} com loading
    - Exibir: descricao, status, nome_servico, fotos (thumbnails tappable → fullscreen), localizacao_tecnico (marker no mapa)
    - Ocultar campos null/vazios
    - Erro solicitacao_nao_encontrada: mensagem + voltar em 3s
    - Erro acesso_negado: mensagem + voltar em 3s
    - Retry em falha de rede
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

  - [x] 9.3 Implementar controles do Técnico no detalhe
    - Condicional: exibir apenas se user.tipo === "tecnico"
    - StatusSelector com os 6 status válidos
    - Campo comentário opcional (max 500 chars)
    - POST /solicitacoes/{id}/status com loading, disable submit
    - Sucesso: refresh detalhe + confirmação 3s
    - Erros mapeados: acesso_negado, status_invalido, solicitacao_nao_encontrada
    - Preservar valores em erro de rede
    - Botão "Compartilhar Localização": captura GPS + POST /tecnico/localizacao
    - Confirmação de localização compartilhada por 3s
    - Erro se GPS indisponível/negado
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_

- [x] 10. Checkpoint - Verificar integração completa
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The project restructure (task 1) must be completed first as all other tasks depend on Expo project structure
- All UI text must be in Brazilian Portuguese (pt-BR) per Requirement 12.6
- Tamagui components must be used for all visual elements per Requirement 12.7

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["1.3", "2.1"] },
    { "id": 3, "tasks": ["2.2", "2.4", "2.6"] },
    { "id": 4, "tasks": ["2.3", "2.5", "3.1"] },
    { "id": 5, "tasks": ["3.2", "3.3", "3.4", "3.5", "3.7"] },
    { "id": 6, "tasks": ["3.6", "4.1", "4.5"] },
    { "id": 7, "tasks": ["4.2", "4.3"] },
    { "id": 8, "tasks": ["4.4", "6.1", "6.2", "6.3"] },
    { "id": 9, "tasks": ["6.4", "7.1"] },
    { "id": 10, "tasks": ["7.2", "7.3"] },
    { "id": 11, "tasks": ["8.1", "8.2", "8.3"] },
    { "id": 12, "tasks": ["8.4"] },
    { "id": 13, "tasks": ["8.5", "9.1"] },
    { "id": 14, "tasks": ["9.2"] },
    { "id": 15, "tasks": ["9.3"] }
  ]
}
```
