import { View, Text } from '@tamagui/core';
import type { StatusSolicitacao } from '@/types';

/**
 * Mapeamento de cores por status da solicitação.
 */
const STATUS_COLORS: Record<StatusSolicitacao, { bg: string; text: string }> = {
  aberto: { bg: '$blue4', text: '$blue10' },
  em_analise: { bg: '$orange4', text: '$orange10' },
  em_andamento: { bg: '$yellow4', text: '$yellow10' },
  resolvido: { bg: '$green4', text: '$green10' },
  fechado: { bg: '$gray4', text: '$gray10' },
  cancelado: { bg: '$red4', text: '$red10' },
};

/**
 * Mapeamento de nomes legíveis por status.
 */
const STATUS_LABELS: Record<StatusSolicitacao, string> = {
  aberto: 'Aberto',
  em_analise: 'Em Análise',
  em_andamento: 'Em Andamento',
  resolvido: 'Resolvido',
  fechado: 'Fechado',
  cancelado: 'Cancelado',
};

export interface StatusBadgeProps {
  status: StatusSolicitacao;
}

/**
 * Badge colorido exibindo o nome do status da solicitação.
 * Cores mapeadas conforme o status:
 * - aberto → azul
 * - em_analise → laranja
 * - em_andamento → amarelo
 * - resolvido → verde
 * - fechado → cinza
 * - cancelado → vermelho
 */
export function StatusBadge({ status }: StatusBadgeProps) {
  const colors = STATUS_COLORS[status];
  const label = STATUS_LABELS[status];

  return (
    <View
      bg={colors.bg as any}
      px="$2"
      py="$1"
      rounded="$2"
      self="flex-start"
      flexDirection="row"
    >
      <Text color={colors.text as any} fontSize="$2" fontWeight="600">
        {label}
      </Text>
    </View>
  );
}
