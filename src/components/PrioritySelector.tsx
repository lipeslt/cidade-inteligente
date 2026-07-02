import { Text, XStack, YStack } from 'tamagui';
import type { Prioridade } from '@/types';

/**
 * Mapeamento de labels pt-BR por prioridade.
 */
const PRIORIDADE_LABELS: Record<Prioridade, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  critica: 'Crítica',
};

/**
 * Mapeamento de cores por prioridade.
 */
const PRIORIDADE_COLORS: Record<Prioridade, { bg: string; border: string; text: string }> = {
  baixa: { bg: '$green3', border: '$green7', text: '$green11' },
  media: { bg: '$yellow3', border: '$yellow7', text: '$yellow11' },
  alta: { bg: '$orange3', border: '$orange7', text: '$orange11' },
  critica: { bg: '$red3', border: '$red7', text: '$red11' },
};

const PRIORIDADES: Prioridade[] = ['baixa', 'media', 'alta', 'critica'];

interface PrioritySelectorProps {
  value: Prioridade;
  onChange: (value: Prioridade) => void;
}

/**
 * Seletor de prioridade com opções Baixa, Média, Alta e Crítica.
 * Exibe as opções como itens pressionáveis com feedback visual de seleção.
 */
export function PrioritySelector({ value, onChange }: PrioritySelectorProps) {
  return (
    <YStack gap="$2">
      <Text fontSize="$3" fontWeight="500" color="$gray11">
        Prioridade
      </Text>
      <XStack gap="$2" flexWrap="wrap">
        {PRIORIDADES.map((prioridade) => {
          const isSelected = value === prioridade;
          const colors = PRIORIDADE_COLORS[prioridade];
          const label = PRIORIDADE_LABELS[prioridade];

          return (
            <XStack
              key={prioridade}
              backgroundColor={isSelected ? colors.bg : '$gray2'}
              borderWidth={1}
              borderColor={isSelected ? colors.border : '$gray6'}
              paddingHorizontal="$3"
              paddingVertical="$2"
              borderRadius="$3"
              pressStyle={{ opacity: 0.7 }}
              onPress={() => onChange(prioridade)}
              cursor="pointer"
              alignItems="center"
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`Prioridade ${label}`}
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
      </XStack>
    </YStack>
  );
}
