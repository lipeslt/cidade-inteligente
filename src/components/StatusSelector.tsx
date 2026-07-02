import { Text, XStack, YStack } from 'tamagui';
import type { StatusSolicitacao } from '@/types';

/**
 * Mapeamento de labels pt-BR por status.
 */
const STATUS_LABELS: Record<StatusSolicitacao, string> = {
  aberto: 'Aberto',
  em_analise: 'Em Análise',
  em_andamento: 'Em Andamento',
  resolvido: 'Resolvido',
  fechado: 'Fechado',
  cancelado: 'Cancelado',
};

/**
 * Mapeamento de cores por status.
 */
const STATUS_COLORS: Record<StatusSolicitacao, { bg: string; border: string; text: string }> = {
  aberto: { bg: '$blue3', border: '$blue7', text: '$blue11' },
  em_analise: { bg: '$orange3', border: '$orange7', text: '$orange11' },
  em_andamento: { bg: '$yellow3', border: '$yellow7', text: '$yellow11' },
  resolvido: { bg: '$green3', border: '$green7', text: '$green11' },
  fechado: { bg: '$gray3', border: '$gray7', text: '$gray11' },
  cancelado: { bg: '$red3', border: '$red7', text: '$red11' },
};

const STATUS_OPTIONS: StatusSolicitacao[] = [
  'aberto',
  'em_analise',
  'em_andamento',
  'resolvido',
  'fechado',
  'cancelado',
];

interface StatusSelectorProps {
  value: StatusSolicitacao;
  onChange: (value: StatusSolicitacao) => void;
}

/**
 * Seletor de status para uso pelo técnico.
 * Exibe os 6 status possíveis como itens pressionáveis com feedback visual.
 */
export function StatusSelector({ value, onChange }: StatusSelectorProps) {
  return (
    <YStack gap="$2">
      <Text fontSize="$3" fontWeight="500" color="$gray11">
        Status
      </Text>
      <YStack gap="$2">
        {STATUS_OPTIONS.map((status) => {
          const isSelected = value === status;
          const colors = STATUS_COLORS[status];
          const label = STATUS_LABELS[status];

          return (
            <XStack
              key={status}
              backgroundColor={isSelected ? colors.bg : '$gray2'}
              borderWidth={1}
              borderColor={isSelected ? colors.border : '$gray6'}
              paddingHorizontal="$3"
              paddingVertical="$2.5"
              borderRadius="$3"
              pressStyle={{ opacity: 0.7 }}
              onPress={() => onChange(status)}
              cursor="pointer"
              alignItems="center"
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`Status ${label}`}
            >
              <Text
                color={isSelected ? colors.text : '$gray9'}
                fontSize="$3"
                fontWeight={isSelected ? '600' : '400'}
              >
                {label}
              </Text>
            </XStack>
          );
        })}
      </YStack>
    </YStack>
  );
}
