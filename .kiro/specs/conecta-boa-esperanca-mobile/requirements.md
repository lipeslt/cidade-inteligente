# Requirements Document

## Introduction

Aplicativo mobile "Conecta Boa Esperança" para plataforma de Cidade Inteligente. O aplicativo permite que cidadãos reportem problemas urbanos (buracos, postes com defeito, etc.) e acompanhem a resolução. Técnicos podem atualizar status e compartilhar localização GPS. O app consome uma API REST existente, utiliza React Native com Expo, Tamagui para UI, TypeScript, e toda interface é em pt-BR.

## Glossary

- **App**: O aplicativo mobile React Native/Expo que consome a API REST do Conecta Boa Esperança
- **API**: A API REST existente em http://cidadeinteligente.online/conecta_boaesperanca/api
- **Cidadão**: Usuário com tipo "cidadao" que pode criar e acompanhar solicitações
- **Técnico**: Usuário com tipo "tecnico" que pode atualizar status de solicitações e compartilhar localização GPS
- **Solicitação**: Registro de um problema urbano criado por um cidadão, contendo descrição, serviço, endereço, coordenadas GPS, prioridade e fotos opcionais
- **Setor**: Secretaria ou departamento municipal responsável por um grupo de serviços (ex: Infraestrutura)
- **Serviço**: Tipo de atendimento oferecido por um setor (ex: Iluminação pública, Tapa-buraco)
- **Token_JWT**: Token de autenticação Bearer retornado pelo endpoint POST /login, com validade de 7 dias (604800 segundos)
- **Secure_Storage**: Mecanismo seguro de armazenamento local do dispositivo para persistir o Token_JWT
- **Prioridade**: Nível de urgência da solicitação, restrito aos valores: baixa, media, alta, critica
- **Status**: Estado atual da solicitação, restrito aos valores: aberto, em_analise, em_andamento, resolvido, fechado, cancelado

## Requirements

### Requirement 1: Autenticação por Email e Senha

**User Story:** As a Cidadão, I want to log in with my email and password, so that I can access protected features of the App.

#### Acceptance Criteria

1. WHEN the Cidadão submits email and password credentials and the API returns a 200 response with "ok": true, THE App SHALL store the returned Token_JWT in Secure_Storage along with the expires_in value (604800 seconds) and persist the user object (id, nome, email, tipo, id_setor, imagem) in local state
2. WHILE a login request is in progress, THE App SHALL display a loading indicator and disable the submit button to prevent duplicate submissions
3. WHEN the API returns the error "email_e_senha_obrigatorios", THE App SHALL display the message "E-mail e senha são obrigatórios"
4. WHEN the API returns the error "email_ou_senha_invalidos", THE App SHALL display the message "E-mail ou senha inválidos"
5. WHEN the API returns the error "email_nao_confirmado", THE App SHALL display the message "E-mail não confirmado. Verifique sua caixa de entrada"
6. WHILE the user has a non-expired Token_JWT in Secure_Storage (based on the stored expires_in value), THE App SHALL include the Authorization Bearer header in all requests to protected endpoints
7. WHEN the API returns the error "token_invalido" or "usuario_nao_encontrado" on any protected request, THE App SHALL clear the stored Token_JWT from Secure_Storage and redirect the user to the login screen
8. IF the login request fails due to network unavailability or the server does not respond within 15 seconds, THEN THE App SHALL display an error message indicating connection failure and allow the Cidadão to retry

### Requirement 2: Logout

**User Story:** As a Cidadão, I want to log out of the App, so that I can protect my account on shared devices.

#### Acceptance Criteria

1. WHEN the user taps the logout button, THE App SHALL remove the Token_JWT from Secure_Storage, clear all cached user data (user object from login: id, nome, email, tipo, id_setor, imagem) from local state, and navigate to the login screen
2. WHEN the user logs out, THE App SHALL reset the navigation stack to prevent back-button access to authenticated screens
3. IF the Secure_Storage removal fails, THEN THE App SHALL still clear local state and navigate to the login screen, treating the session as terminated

### Requirement 3: Visualizar Perfil do Usuário

**User Story:** As a Cidadão, I want to view my profile information, so that I can confirm my account details.

#### Acceptance Criteria

1. WHEN the user navigates to the profile screen, THE App SHALL display a loading indicator and send a GET request to /me, then display the user's nome, email, tipo, and imagem within 10 seconds of the request being sent
2. IF the field imagem returned by the API is null, THEN THE App SHALL display a default placeholder image in place of the user's photo
3. IF the API returns the error "usuario_nao_encontrado" or "token_invalido", THEN THE App SHALL clear the session and redirect to the login screen
4. IF the GET /me request fails due to network unavailability or the response is not received within 10 seconds, THEN THE App SHALL display an error message indicating the connection failure and offer a retry option

### Requirement 4: Listar Setores

**User Story:** As a Cidadão, I want to browse available sectors, so that I can find the department responsible for my issue.

#### Acceptance Criteria

1. WHEN the user navigates to the service catalog screen, THE App SHALL send a GET request to /setores and display a loading indicator until the response is received
2. WHEN the API returns a successful response (ok: true) with a non-empty dados array, THE App SHALL display a list showing each setor's nome, sigla, and total_servicos
3. IF the API returns a successful response with an empty dados array, THEN THE App SHALL display the message "Nenhum setor disponível no momento"
4. IF the GET /setores request fails due to network error or the API returns a response with ok: false, THEN THE App SHALL display an error message indicating that setores could not be loaded and offer a retry option

### Requirement 5: Listar Serviços por Setor

**User Story:** As a Cidadão, I want to view services available within a sector, so that I can select the correct service type for my report.

#### Acceptance Criteria

1. WHEN the user selects a Setor from the list, THE App SHALL send a GET request to /servicos?id_setor={id} and display a loading indicator until the response is received
2. WHEN the API returns a successful response with a non-empty dados array, THE App SHALL display the filtered list of services showing nome and nome_setor
3. THE App SHALL allow the user to view all services without filtering by sending a GET request to /servicos
4. IF the API returns an empty dados array for the selected setor, THEN THE App SHALL display the message "Nenhum serviço disponível neste setor"
5. IF the GET /servicos request fails due to network error or the API returns ok: false, THEN THE App SHALL display an error message and offer a retry option

### Requirement 6: Criar Solicitação

**User Story:** As a Cidadão, I want to submit an urban issue report with details and photos, so that the city can address the problem.

#### Acceptance Criteria

1. WHEN the user attempts to submit a Solicitação without providing id_servico or descricao, THE App SHALL prevent submission and display a validation message indicating that both fields are required
2. THE App SHALL allow the user to optionally provide endereco, bairro, numero, latitude, longitude, and prioridade
3. WHEN the user does not specify a prioridade, THE App SHALL default to "media"
4. THE App SHALL restrict the prioridade field to one of the accepted values: "baixa", "media", "alta", "critica"
5. THE App SHALL allow the user to attach up to 5 photos to the Solicitação
6. THE App SHALL validate that each attached photo does not exceed 2 MB in file size
7. THE App SHALL validate that each attached photo has one of the accepted formats: jpg, jpeg, png, gif, bmp, webp
8. IF an attached photo exceeds 2 MB or has an unsupported format, THEN THE App SHALL display a validation message indicating the specific reason the photo was rejected and SHALL NOT attach the photo
9. WHEN the user submits a Solicitação without photos, THE App SHALL send a POST request to /solicitacoes with Content-Type application/json
10. WHEN the user submits a Solicitação with photos, THE App SHALL send a POST request to /solicitacoes with Content-Type multipart/form-data
11. WHEN the API returns HTTP 201 with "ok" equal to true, THE App SHALL display a success confirmation and navigate to the request list within 3 seconds
12. IF the API returns the error "id_servico_e_descricao_obrigatorios", THEN THE App SHALL display the message "Serviço e descrição são obrigatórios"
13. IF the API returns the error "prioridade_invalida", THEN THE App SHALL display the message "Prioridade selecionada é inválida"
14. IF the API returns the error "fotos_invalidas", THEN THE App SHALL display the message "Fotos inválidas" followed by the details provided by the API
15. IF the API request fails due to a network error or timeout of more than 30 seconds, THEN THE App SHALL display a message indicating the connection failure and SHALL preserve the user-entered data so the user can retry without re-entering information

### Requirement 7: Capturar Localização GPS

**User Story:** As a Cidadão, I want the App to capture my GPS coordinates, so that I can accurately report the location of the urban issue.

#### Acceptance Criteria

1. WHEN the user opens the new Solicitação form, THE App SHALL request device location permission if not already granted
2. WHEN the user grants location permission, THE App SHALL capture the current latitude and longitude within 15 seconds and pre-fill the coordinate fields with values containing up to 6 decimal places
3. IF the user denies location permission, THEN THE App SHALL allow the user to proceed without GPS coordinates and display the message "Localização não disponível. Informe o endereço manualmente"
4. IF the App cannot obtain GPS coordinates within 15 seconds after permission is granted, THEN THE App SHALL stop the acquisition attempt, display the message "Não foi possível obter a localização. Informe o endereço manualmente", and allow the user to proceed without GPS coordinates
5. WHEN latitude and longitude values are available (captured via GPS or entered manually), THE App SHALL display a map preview showing a marker at the corresponding coordinates

### Requirement 8: Listar Minhas Solicitações

**User Story:** As a Cidadão, I want to view a paginated list of my requests, so that I can track the status of my reported issues.

#### Acceptance Criteria

1. WHEN the user navigates to the "Minhas Solicitações" screen, THE App SHALL send an authenticated GET request to /solicitacoes?page=1&per_page=10 with the Authorization Bearer token and display the results
2. THE App SHALL display each Solicitação as a list item showing descricao (truncated to 100 characters if longer), status_nome, nome_servico, and criado_em formatted as DD/MM/YYYY HH:mm
3. WHEN the user scrolls to the end of the currently loaded list and the current page is less than total_pages from the paginacao response, THE App SHALL load the next page by incrementing the page parameter and appending the results to the existing list
4. WHEN the user selects a status filter value (aberto, em_analise, em_andamento, resolvido, fechado, or cancelado), THE App SHALL reset the list to page 1 and send a GET request to /solicitacoes with the selected status parameter
5. WHEN the user sets a date range filter, THE App SHALL send the data_inicio and data_fim parameters in YYYY-MM-DD format, resetting the list to page 1
6. IF the API returns an empty dados array, THEN THE App SHALL display the message "Nenhuma solicitação encontrada" in place of the list
7. IF the API request fails or returns ok=false, THEN THE App SHALL display an error message indicating the failure reason and provide an option to retry the request
8. WHILE the App is loading solicitações from the API, THE App SHALL display a loading indicator to the user

### Requirement 9: Visualizar Detalhe da Solicitação

**User Story:** As a Cidadão, I want to view the full details of a request, so that I can see its current status, photos, and assigned technician location.

#### Acceptance Criteria

1. WHEN the user taps on a Solicitação in the list, THE App SHALL send an authenticated GET request to /solicitacoes/{id} and display a loading indicator until the response is received
2. WHEN the API returns a successful response, THE App SHALL display the fields: descricao, status, nome_servico, fotos (as a list of thumbnails), and localizacao_tecnico (as a map pin); fields with null or empty values SHALL be hidden from the view
3. WHEN the Solicitação has one or more photos in the fotos array, THE App SHALL render each photo as a tappable thumbnail (maximum 5 photos) that opens a full-screen image viewer
4. WHEN the Solicitação has localizacao_tecnico data containing latitude and longitude, THE App SHALL display the technician's position as a marker on a map centered on those coordinates
5. IF the API returns the error "solicitacao_nao_encontrada", THEN THE App SHALL display the message "Solicitação não encontrada" and navigate back to the list after 3 seconds or upon user dismissal
6. IF the API returns the error "acesso_negado", THEN THE App SHALL display the message "Você não tem permissão para visualizar esta solicitação" and navigate back to the list after 3 seconds or upon user dismissal
7. IF the API request fails due to network unavailability or timeout (exceeding 15 seconds), THEN THE App SHALL display an error message indicating connection failure and offer a retry option

### Requirement 10: Alterar Status da Solicitação (Técnico)

**User Story:** As a Técnico, I want to update the status of a request, so that citizens can track the progress of their reported issue.

#### Acceptance Criteria

1. WHILE the authenticated user has tipo "tecnico", THE App SHALL display a status update control on the Solicitação detail screen
2. WHEN the Técnico interacts with the status update control, THE App SHALL present only the valid status options: aberto, em_analise, em_andamento, resolvido, fechado, cancelado
3. THE App SHALL allow the Técnico to provide an optional comentario of up to 500 characters when changing status
4. WHEN the Técnico submits a status change, THE App SHALL disable the submit control, display a loading indicator, and send a POST request to /solicitacoes/{id}/status with the selected status and comentario
5. WHEN the API returns a successful response, THE App SHALL refresh the Solicitação detail screen and display a confirmation message for at least 3 seconds
6. IF the API returns the error "acesso_negado", THEN THE App SHALL display the message "Você não tem permissão para alterar o status"
7. IF the API returns the error "status_invalido", THEN THE App SHALL display the message "Status selecionado é inválido"
8. IF the API returns the error "solicitacao_nao_encontrada", THEN THE App SHALL display an error message indicating the request was not found and navigate the user back to the solicitações list
9. IF the API request fails due to network unavailability or timeout after 30 seconds, THEN THE App SHALL display an error message indicating a connection failure and preserve the selected status and comentario values

### Requirement 11: Registrar Localização do Técnico

**User Story:** As a Técnico, I want to share my GPS location linked to a request, so that citizens can see my proximity to the reported issue.

#### Acceptance Criteria

1. WHILE the authenticated user has tipo "tecnico", THE App SHALL display a "Compartilhar Localização" button on the Solicitação detail screen
2. WHEN the Técnico taps the "Compartilhar Localização" button, THE App SHALL request device GPS coordinates and send a POST request to /tecnico/localizacao with the current solicitação's id_solicitacao, latitude, and longitude as strings with up to 8 decimal places
3. WHEN the API returns a response with "ok" equal to true, THE App SHALL display a confirmation message for at least 3 seconds indicating that the location was shared successfully
4. IF the device GPS is unavailable or location permission is denied, THEN THE App SHALL display a message indicating that location access is required and SHALL NOT send the POST request
5. IF the API returns the error "apenas_tecnico", THEN THE App SHALL display the message "Apenas técnicos podem compartilhar localização"
6. IF the API returns the error "dados_obrigatorios", THEN THE App SHALL display the message "Dados de localização são obrigatórios"
7. IF the API returns a failure response without a specific error code, THEN THE App SHALL display a message indicating that the location could not be shared and allow the Técnico to retry

### Requirement 12: Navegação e Estrutura de Telas

**User Story:** As a Cidadão, I want to intuitive navigation between screens, so that I can use the App efficiently.

#### Acceptance Criteria

1. WHILE no valid Token_JWT exists in Secure_Storage, THE App SHALL display only the login screen and prevent access to any other screen
2. WHEN the App launches and a valid Token_JWT exists in Secure_Storage, THE App SHALL navigate directly to the bottom tab navigation without requiring the user to log in again
3. WHILE the user is authenticated, THE App SHALL display a bottom tab navigation with exactly 4 tabs in the following left-to-right order: Início (Home), Nova Solicitação, Minhas Solicitações, and Perfil, with the Início tab selected by default
4. WHILE the user is authenticated, THE App SHALL visually distinguish the currently active tab from inactive tabs
5. WHEN the user taps a Solicitação item within the Minhas Solicitações tab, THE App SHALL navigate to the Solicitação detail screen within the same tab's navigation stack, preserving the bottom tab bar
6. THE App SHALL render all UI text, labels, placeholders, and messages in Brazilian Portuguese (pt-BR)
7. THE App SHALL use Tamagui components for all visual elements to maintain consistent design language

### Requirement 13: Tratamento de Erros de Rede

**User Story:** As a Cidadão, I want to be informed when network issues prevent communication with the server, so that I understand why an action failed.

#### Acceptance Criteria

1. IF a network request fails due to no internet connectivity (device is offline), THEN THE App SHALL display the message "Sem conexão com a internet. Verifique sua rede e tente novamente"
2. IF a network request fails because the server does not respond within 30 seconds, THEN THE App SHALL display the message "O servidor não respondeu. Tente novamente em alguns instantes"
3. IF a network request returns an unexpected error without a structured API error (response does not contain JSON with "ok" and "erro" fields), THEN THE App SHALL display the message "Ocorreu um erro inesperado. Tente novamente"
4. WHEN a network error message is displayed, THE App SHALL provide a retry button that re-executes the failed request with the same parameters
5. WHEN a network error occurs during a form submission, THE App SHALL preserve all user-entered data so the user can retry without re-entering information
