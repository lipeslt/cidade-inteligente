# Implementation Plan: Role-Based Features

## Overview

This plan implements role-specific functionality for admin and técnico users in the Conecta Sorriso app. The approach is incremental: first establish the pure utility layer (testable without UI), then refactor the existing TecnicoControls into a unified StatusControls component using React Native primitives, add new screens for admin dashboard and técnico work view, and finally wire everything together in the tab layout and home screen.

## Tasks

- [x] 1. Create role utility module with pure functions
  - [x] 1.1 Create `src/utils/roles.ts` with role utility functions
    - Implement `getHomeQuickActions(role)` returning 2 QuickAction cards per role (cidadao, admin, tecnico)
    - Implement `getTabsForRole(role)` returning TabConfig[] with correct visibility and center button logic
    - Implement `shouldShowStatusControls(role)` — true for admin/tecnico only
    - Implement `shouldShowLocationButton(role)` — true for tecnico only
    - Implement `shouldHighlight(status)` — true for "em_andamento" only
    - Implement `truncateDescription(description, maxLength=80)` — truncates with "..." at maxLength
    - Implement `computeStatusCounts(solicitacoes)` — returns Record<StatusSolicitacao, number>
    - Implement `filterByStatus(solicitacoes, status?)` — filters list or returns all if undefined
    - Implement `clampPerPage(perPage)` — returns min(perPage, 50)
    - Define QuickAction and TabConfig interfaces
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.3, 4.2, 4.5, 5.1, 6.1, 7.4, 7.5, 8.2_

  - [ ]* 1.2 Write property tests for role utility functions (Properties 1–9)
    - **Property 1: Role determines home quick actions** — verify getHomeQuickActions returns exactly 2 cards per role with no overlap
    - **Validates: Requirements 1.1, 1.2, 1.3**
    - **Property 2: Role determines tab configuration with common tabs preserved** — verify getTabsForRole always includes Início/Perfil, center button hidden only for admin
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6**
    - **Property 3: Status filtering returns only matching items** — verify filterByStatus returns subset with matching status
    - **Validates: Requirements 3.3, 4.2**
    - **Property 4: Description truncation respects maximum length** — verify truncateDescription output ≤ maxLength, ends with "..." if truncated
    - **Validates: Requirements 3.4, 4.3**
    - **Property 5: em_andamento highlighting** — verify shouldHighlight returns true iff status is "em_andamento"
    - **Validates: Requirements 4.5**
    - **Property 6: StatusControls visibility by role** — verify shouldShowStatusControls returns true iff admin or tecnico
    - **Validates: Requirements 5.1, 7.4, 7.5**
    - **Property 7: Location button visibility** — verify shouldShowLocationButton returns true iff tecnico
    - **Validates: Requirements 6.1, 7.1, 7.2, 7.3**
    - **Property 8: Comment validation rejects strings exceeding 500 characters** — verify validateComentario behavior
    - **Validates: Requirements 5.3**
    - **Property 9: per_page clamped to maximum 50** — verify clampPerPage returns min(value, 50)
    - **Validates: Requirements 8.2**

- [x] 2. Checkpoint - Ensure utility module tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Refactor StatusControls component
  - [x] 3.1 Create `src/components/StatusControls.tsx` using React Native primitives
    - Refactor existing TecnicoControls logic into StatusControls
    - Use View, Text, StyleSheet, TouchableOpacity, TextInput — NO Tamagui components
    - Accept props: `idSolicitacao`, `currentStatus`, `onStatusChanged`, `showLocationButton`
    - Read user.tipo from authStore — render only for admin/tecnico (using shouldShowStatusControls)
    - Include StatusSelector for 6 status values
    - Include optional comment TextInput (max 500 chars)
    - Include "Atualizar Status" TouchableOpacity button with loading state
    - Conditionally render "Compartilhar Localização" TouchableOpacity based on `showLocationButton` prop
    - Handle all error states (acesso_negado, status_invalido, solicitacao_nao_encontrada, network errors)
    - Handle location flow (permission → capture → POST) with error mapping
    - Display success messages that auto-dismiss after 3 seconds
    - Use ActivityIndicator instead of Tamagui Spinner
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [x] 3.2 Update `src/components/index.ts` to export StatusControls
    - Add StatusControls export
    - Keep existing TecnicoControls export for backward compatibility during transition
    - _Requirements: 7.4_

  - [ ]* 3.3 Write unit tests for StatusControls component
    - Test renders for admin (no location button)
    - Test renders for técnico (with location button)
    - Test does not render for cidadão
    - Test error messages display correctly for each API error code
    - Test success messages auto-dismiss after 3 seconds
    - Test uses TouchableOpacity (not Tamagui pressable)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

- [x] 4. Create Admin Dashboard screen
  - [x] 4.1 Create `app/(tabs)/painel/index.tsx` with Admin Dashboard
    - Use SafeAreaView, View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator
    - Display 6 status count cards using computeStatusCounts from roles utility
    - Make status cards tappable to filter the list below (using filterByStatus or applyFilter on store)
    - Render FlatList with SolicitacaoCard items, descriptions truncated to 80 chars
    - Implement pull-to-refresh with RefreshControl
    - Implement infinite scroll pagination using solicitacoesStore.loadNextPage
    - Navigate to detail screen on item tap
    - Display ErrorMessage component with retry button on API failure
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [x] 4.2 Create `app/(tabs)/painel/_layout.tsx` for nested routing
    - Use Stack from expo-router with headerShown: false
    - _Requirements: 3.5_

- [x] 5. Create Técnico Work View screen
  - [x] 5.1 Create `app/(tabs)/trabalho/index.tsx` with Técnico Work View
    - Use SafeAreaView, View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator
    - Display filter bar with status chips (TouchableOpacity elements for each StatusSolicitacao)
    - Render FlatList with SolicitacaoCard items, descriptions truncated to 80 chars
    - Highlight items with status "em_andamento" using a distinct left border (amber/orange)
    - Implement pull-to-refresh with RefreshControl
    - Implement infinite scroll pagination using solicitacoesStore.loadNextPage
    - Navigate to detail screen on item tap
    - Display ErrorMessage component with retry button on API failure
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [x] 5.2 Create `app/(tabs)/trabalho/_layout.tsx` for nested routing
    - Use Stack from expo-router with headerShown: false
    - _Requirements: 4.4_

- [x] 6. Checkpoint - Ensure new screens render without errors
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Wire role-based tab navigation and home screen
  - [x] 7.1 Modify `app/(tabs)/_layout.tsx` to support role-based tabs
    - Import useAuthStore to read user.tipo
    - Import getTabsForRole from @/utils/roles
    - Conditionally render "Painel" tab (bar-chart-2 icon) visible only for admin
    - Conditionally render "Trabalho" tab (tool icon) visible only for técnico
    - Hide center "Nova Solicitação" button for admin (use href: null)
    - Preserve existing tabs for cidadão role
    - Keep Início and Perfil tabs visible for all roles
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 7.2 Modify `app/(tabs)/index.tsx` to show role-based quick actions
    - Import useAuthStore to read user.tipo
    - Import getHomeQuickActions from @/utils/roles
    - Replace hardcoded quick action cards with dynamic cards from getHomeQuickActions
    - Use TouchableOpacity for card press handling (replace Tamagui onPress/pressStyle)
    - Each card navigates to its specified route using router.push
    - Keep existing FadeInView animation pattern (uses Animated API, not reanimated)
    - Keep existing "Como funciona" section for cidadão only
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [x] 7.3 Modify `app/(tabs)/minhas-solicitacoes/[id].tsx` to use StatusControls
    - Replace TecnicoControls import with StatusControls import
    - Use shouldShowStatusControls(user?.tipo) to conditionally render
    - Pass showLocationButton={shouldShowLocationButton(user?.tipo)} prop
    - Remove old user?.tipo === 'tecnico' check
    - _Requirements: 5.1, 6.1, 7.4, 7.5_

- [x] 8. Checkpoint - Ensure navigation and integration work correctly
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 9. Write property tests for store pagination behavior (Properties 10–12)
  - [ ]* 9.1 Write property test for pagination append
    - **Property 10: Pagination append preserves existing items**
    - **Validates: Requirements 8.3**
  - [ ]* 9.2 Write property test for filter reset
    - **Property 11: Filter change resets page to 1**
    - **Validates: Requirements 8.5**
  - [ ]* 9.3 Write property test for last page guard
    - **Property 12: No additional loading when on last page**
    - **Validates: Requirements 8.6**

- [x] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Use React Native primitives (View, Text, StyleSheet, TouchableOpacity) for ALL new components — NOT Tamagui
- Use Feather icons from @expo/vector-icons
- NO react-native-reanimated — use Animated API from react-native for animations
- The existing solicitacoesStore handles pagination and filtering; reuse it in admin/técnico screens
- fast-check is already installed as a devDependency

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["3.1", "4.1", "4.2", "5.1", "5.2"] },
    { "id": 3, "tasks": ["3.2", "3.3"] },
    { "id": 4, "tasks": ["7.1", "7.2", "7.3"] },
    { "id": 5, "tasks": ["9.1", "9.2", "9.3"] }
  ]
}
```
