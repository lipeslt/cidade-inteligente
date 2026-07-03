# Requirements Document

## Introduction

This feature extends the Conecta Sorriso mobile app with role-specific functionality for TÉCNICO and ADMIN users. Currently the app serves only the cidadão (citizen) role with screens for login, creating solicitações, and viewing their own solicitações. This extension adds role-adapted home screens, dedicated tabs, dashboard views, and status management capabilities for users with elevated permissions.

## Glossary

- **App**: The Conecta Sorriso React Native (Expo) mobile application
- **Auth_Store**: The Zustand store that manages authentication state including the authenticated user object
- **Tab_Navigator**: The Expo Router tab layout that renders bottom navigation tabs
- **Home_Screen**: The initial screen displayed after authentication within the tab navigator
- **Admin_Dashboard**: A dedicated screen for admin users showing aggregated metrics and all solicitações
- **Tecnico_Work_View**: A dedicated screen for técnico users showing their work queue and tools
- **Status_Controls**: UI components that allow admin and técnico users to change the status of a solicitação
- **Location_Service**: The existing service that handles GPS permission requests and position capture
- **Solicitacao**: A citizen request/complaint registered in the system
- **Status_Value**: One of the six valid status strings: aberto, em_analise, em_andamento, resolvido, fechado, cancelado
- **User_Role**: The tipo field of the authenticated user, one of: admin, setor, tecnico, cidadao, entrevistador

## Requirements

### Requirement 1: Role-Based Home Screen Adaptation

**User Story:** As a user of any role, I want to see quick actions and information relevant to my role on the home screen, so that I can access my most important tasks immediately after login.

#### Acceptance Criteria

1. WHILE the authenticated user has User_Role equal to "cidadao", THE Home_Screen SHALL display the existing quick action cards for "Nova Solicitação" and "Minhas Solicitações"
2. WHILE the authenticated user has User_Role equal to "admin", THE Home_Screen SHALL display quick action cards for "Painel Administrativo" and "Todas as Solicitações"
3. WHILE the authenticated user has User_Role equal to "tecnico", THE Home_Screen SHALL display quick action cards for "Meu Trabalho" and "Todas as Solicitações"
4. WHEN the user taps an admin quick action card, THE Home_Screen SHALL navigate to the corresponding admin screen
5. WHEN the user taps a técnico quick action card, THE Home_Screen SHALL navigate to the corresponding técnico screen
6. THE Home_Screen SHALL read the User_Role from the Auth_Store to determine which quick action cards to render

### Requirement 2: Role-Based Tab Navigation

**User Story:** As a user with an elevated role, I want dedicated navigation tabs that match my workflow, so that I can access role-specific screens without extra navigation steps.

#### Acceptance Criteria

1. WHILE the authenticated user has User_Role equal to "admin", THE Tab_Navigator SHALL display a "Painel" tab with a bar-chart-2 Feather icon
2. WHILE the authenticated user has User_Role equal to "tecnico", THE Tab_Navigator SHALL display a "Trabalho" tab with a tool Feather icon
3. WHILE the authenticated user has User_Role equal to "cidadao", THE Tab_Navigator SHALL display the existing tabs without modification
4. THE Tab_Navigator SHALL hide the "Nova Solicitação" center button for users with User_Role equal to "admin"
5. THE Tab_Navigator SHALL preserve the "Nova Solicitação" center button for users with User_Role equal to "tecnico"
6. THE Tab_Navigator SHALL preserve the "Início" and "Perfil" tabs for all User_Role values

### Requirement 3: Admin Dashboard Screen

**User Story:** As an admin, I want a dashboard that shows an overview of all solicitações grouped by status with counts, so that I can monitor the overall system health and prioritize work.

#### Acceptance Criteria

1. WHEN the Admin_Dashboard screen loads, THE App SHALL fetch all solicitações from the GET /solicitacoes endpoint without user-specific filtering
2. THE Admin_Dashboard SHALL display a summary section with the total count of solicitações for each Status_Value
3. WHEN the admin taps a status count card, THE Admin_Dashboard SHALL filter the displayed list to show only solicitações matching that Status_Value
4. THE Admin_Dashboard SHALL display a scrollable list of all solicitações with id, description truncated to 80 characters, service name, status badge, and creation date
5. WHEN the admin taps a solicitação item in the list, THE App SHALL navigate to the solicitação detail screen for that item
6. WHEN the admin pulls down on the list, THE Admin_Dashboard SHALL refresh the data from the API
7. IF the API request fails, THEN THE Admin_Dashboard SHALL display an error message with a retry button

### Requirement 4: Técnico Work View Screen

**User Story:** As a técnico, I want a dedicated work screen showing all solicitações with quick access to status changes and location sharing, so that I can efficiently manage my fieldwork.

#### Acceptance Criteria

1. WHEN the Tecnico_Work_View screen loads, THE App SHALL fetch all solicitações from the GET /solicitacoes endpoint
2. THE Tecnico_Work_View SHALL display a filter bar with options to filter by Status_Value
3. THE Tecnico_Work_View SHALL display a scrollable list of solicitações with id, description truncated to 80 characters, service name, status badge, and creation date
4. WHEN the técnico taps a solicitação item in the list, THE App SHALL navigate to the solicitação detail screen for that item
5. THE Tecnico_Work_View SHALL visually highlight solicitações with status "em_andamento" using a distinct left border color
6. WHEN the técnico pulls down on the list, THE Tecnico_Work_View SHALL refresh the data from the API
7. IF the API request fails, THEN THE Tecnico_Work_View SHALL display an error message with a retry button

### Requirement 5: Status Management for Admin Users

**User Story:** As an admin, I want to change the status of any solicitação from its detail screen, so that I can manage the lifecycle of citizen requests.

#### Acceptance Criteria

1. WHILE the authenticated user has User_Role equal to "admin", THE solicitação detail screen SHALL display Status_Controls below the solicitação details
2. THE Status_Controls for admin SHALL include a status selector showing all six Status_Value options
3. THE Status_Controls for admin SHALL include an optional comment text field limited to 500 characters
4. WHEN the admin submits a status change, THE App SHALL send a POST request to /solicitacoes/{id}/status with the selected status and optional comment
5. WHEN the status change succeeds, THE Status_Controls SHALL display a success confirmation message for 3 seconds
6. IF the status change request fails with "acesso_negado", THEN THE Status_Controls SHALL display the error message "Acesso negado"
7. IF the status change request fails with "status_invalido", THEN THE Status_Controls SHALL display the error message "Status inválido"
8. IF the status change request fails with "solicitacao_nao_encontrada", THEN THE Status_Controls SHALL display the error message and navigate back after 3 seconds

### Requirement 6: Técnico Location Sharing

**User Story:** As a técnico, I want to share my GPS location linked to a specific solicitação from the detail screen, so that the system can track my position during fieldwork.

#### Acceptance Criteria

1. WHILE the authenticated user has User_Role equal to "tecnico", THE solicitação detail screen SHALL display a "Compartilhar Localização" button
2. WHEN the técnico taps the location sharing button, THE Location_Service SHALL request GPS permission from the operating system
3. WHEN GPS permission is granted, THE Location_Service SHALL capture the current device coordinates
4. WHEN coordinates are captured, THE App SHALL send a POST request to /tecnico/localizacao with the solicitação id, latitude, and longitude
5. WHEN the location registration succeeds, THE App SHALL display a success confirmation message for 3 seconds
6. IF GPS permission is denied, THEN THE App SHALL display the error message "Acesso à localização é necessário"
7. IF the location registration request fails with "apenas_tecnico", THEN THE App SHALL display the error message "Apenas técnicos podem registrar localização"
8. IF the location registration request fails with "dados_obrigatorios", THEN THE App SHALL display the error message "Dados obrigatórios não informados"

### Requirement 7: Unified Status Controls Component

**User Story:** As a developer, I want a single reusable status controls component that works for both admin and técnico roles, so that the codebase avoids duplication and is maintainable.

#### Acceptance Criteria

1. THE Status_Controls component SHALL accept a prop indicating whether location sharing is enabled
2. WHILE location sharing is enabled, THE Status_Controls SHALL render the location sharing button
3. WHILE location sharing is disabled, THE Status_Controls SHALL hide the location sharing button
4. THE Status_Controls component SHALL render for any authenticated user with User_Role equal to "admin" or "tecnico"
5. THE Status_Controls component SHALL not render for users with User_Role equal to "cidadao"
6. THE Status_Controls component SHALL use TouchableOpacity for all interactive elements
7. THE Status_Controls component SHALL use React Native View, Text, and StyleSheet for layout

### Requirement 8: Solicitações List for Elevated Roles

**User Story:** As an admin or técnico, I want the solicitações list to show all system solicitações rather than only my own, so that I can see and manage all citizen requests.

#### Acceptance Criteria

1. WHILE the authenticated user has User_Role equal to "admin" or "tecnico", THE solicitações list service call SHALL fetch all solicitações from the API
2. THE solicitações list SHALL support pagination using page and per_page parameters with a maximum of 50 items per page
3. WHEN the user scrolls to the bottom of the list, THE App SHALL load the next page of results and append them to the existing list
4. THE solicitações list SHALL support filtering by Status_Value using a filter parameter in the API request
5. WHEN a filter is applied, THE App SHALL reset the page to 1 and replace the current list with filtered results
6. IF the current page equals total_pages from the API response, THEN THE App SHALL not attempt to load additional pages
