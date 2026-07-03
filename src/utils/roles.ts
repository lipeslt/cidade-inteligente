import type { TipoUsuario, StatusSolicitacao, Solicitacao } from '@/types';

// =============================================================================
// Interfaces
// =============================================================================

export interface QuickAction {
  title: string;
  subtitle: string;
  icon: string;
  route: string;
  bgColor: string;
  iconBgColor: string;
  textColor: string;
}

export interface TabConfig {
  name: string;
  title: string;
  icon: string;
  visible: boolean;
  isCenterButton: boolean;
}

// =============================================================================
// Quick Actions por Role
// =============================================================================

const cidadaoActions: QuickAction[] = [
  {
    title: 'Nova Solicitação',
    subtitle: 'Registrar um problema',
    icon: 'plus-circle',
    route: '/(tabs)/nova-solicitacao',
    bgColor: '#eff6ff',
    iconBgColor: '#1e40af',
    textColor: '#1e40af',
  },
  {
    title: 'Minhas Solicitações',
    subtitle: 'Acompanhar pedidos',
    icon: 'list',
    route: '/(tabs)/minhas-solicitacoes',
    bgColor: '#f0fdf4',
    iconBgColor: '#166534',
    textColor: '#166534',
  },
];

const adminActions: QuickAction[] = [
  {
    title: 'Painel Administrativo',
    subtitle: 'Visão geral do sistema',
    icon: 'bar-chart-2',
    route: '/(tabs)/painel',
    bgColor: '#f5f3ff',
    iconBgColor: '#6d28d9',
    textColor: '#6d28d9',
  },
  {
    title: 'Todas as Solicitações',
    subtitle: 'Gerenciar solicitações',
    icon: 'inbox',
    route: '/(tabs)/painel',
    bgColor: '#eef2ff',
    iconBgColor: '#4338ca',
    textColor: '#4338ca',
  },
];

const tecnicoActions: QuickAction[] = [
  {
    title: 'Meu Trabalho',
    subtitle: 'Tarefas atribuídas',
    icon: 'tool',
    route: '/(tabs)/trabalho',
    bgColor: '#fffbeb',
    iconBgColor: '#b45309',
    textColor: '#b45309',
  },
  {
    title: 'Todas as Solicitações',
    subtitle: 'Ver todas as solicitações',
    icon: 'inbox',
    route: '/(tabs)/trabalho',
    bgColor: '#f0fdfa',
    iconBgColor: '#0f766e',
    textColor: '#0f766e',
  },
];

// =============================================================================
// Functions
// =============================================================================

/**
 * Retorna os 2 cards de ação rápida da home baseado no role do usuário.
 */
export function getHomeQuickActions(role: TipoUsuario): QuickAction[] {
  switch (role) {
    case 'admin':
      return adminActions;
    case 'tecnico':
      return tecnicoActions;
    case 'cidadao':
    default:
      return cidadaoActions;
  }
}

/**
 * Retorna a configuração completa de tabs baseada no role do usuário.
 * Sempre inclui "Início" e "Perfil".
 */
export function getTabsForRole(role: TipoUsuario): TabConfig[] {
  const commonStart: TabConfig = {
    name: 'index',
    title: 'Início',
    icon: 'home',
    visible: true,
    isCenterButton: false,
  };

  const commonEnd: TabConfig = {
    name: 'perfil',
    title: 'Perfil',
    icon: 'user',
    visible: true,
    isCenterButton: false,
  };

  switch (role) {
    case 'admin':
      return [
        commonStart,
        {
          name: 'painel',
          title: 'Painel',
          icon: 'bar-chart-2',
          visible: true,
          isCenterButton: false,
        },
        commonEnd,
      ];

    case 'tecnico':
      return [
        commonStart,
        {
          name: 'nova-solicitacao',
          title: 'Nova Solicitação',
          icon: 'plus',
          visible: true,
          isCenterButton: true,
        },
        {
          name: 'trabalho',
          title: 'Trabalho',
          icon: 'tool',
          visible: true,
          isCenterButton: false,
        },
        commonEnd,
      ];

    case 'cidadao':
    default:
      return [
        commonStart,
        {
          name: 'nova-solicitacao',
          title: 'Nova Solicitação',
          icon: 'plus',
          visible: true,
          isCenterButton: true,
        },
        commonEnd,
      ];
  }
}

/**
 * Determina se o componente StatusControls deve ser renderizado.
 * Verdadeiro apenas para admin ou tecnico.
 */
export function shouldShowStatusControls(role: TipoUsuario): boolean {
  return role === 'admin' || role === 'tecnico';
}

/**
 * Determina se o botão de compartilhar localização deve aparecer.
 * Verdadeiro apenas para tecnico.
 */
export function shouldShowLocationButton(role: TipoUsuario): boolean {
  return role === 'tecnico';
}

/**
 * Determina se uma solicitação deve ser visualmente destacada.
 * Verdadeiro quando o status é "em_andamento".
 */
export function shouldHighlight(status: StatusSolicitacao): boolean {
  return status === 'em_andamento';
}

/**
 * Calcula a contagem de solicitações por status.
 * Inicializa todos os 6 status com 0.
 */
export function computeStatusCounts(
  solicitacoes: Solicitacao[]
): Record<StatusSolicitacao, number> {
  const counts: Record<StatusSolicitacao, number> = {
    aberto: 0,
    em_analise: 0,
    em_andamento: 0,
    resolvido: 0,
    fechado: 0,
    cancelado: 0,
  };

  for (const s of solicitacoes) {
    if (s.status in counts) {
      counts[s.status]++;
    }
  }

  return counts;
}

/**
 * Filtra solicitações por status. Retorna todas se status for undefined.
 */
export function filterByStatus(
  solicitacoes: Solicitacao[],
  status?: StatusSolicitacao
): Solicitacao[] {
  if (status === undefined) {
    return solicitacoes;
  }
  return solicitacoes.filter((s) => s.status === status);
}

/**
 * Limita per_page ao máximo da API (50).
 */
export function clampPerPage(perPage: number): number {
  return Math.min(perPage, 50);
}
