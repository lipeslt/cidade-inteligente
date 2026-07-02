import { Pressable } from 'react-native';
import { Card, Text, XStack, YStack } from 'tamagui';
import type { Solicitacao } from '../types';
import { truncateDescription, formatDateTime } from '../utils/formatters';
import { StatusBadge } from './StatusBadge';

export interface SolicitacaoCardProps {
  solicitacao: Solicitacao;
  onPress: () => void;
}

/**
 * Card para exibição de uma solicitação na lista.
 * Mostra descrição truncada (100 chars), badge de status, nome do serviço e data formatada.
 */
export function SolicitacaoCard({ solicitacao, onPress }: SolicitacaoCardProps) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      <Card
        elevate
        bordered
        padding="$3"
        marginVertical="$1.5"
        marginHorizontal="$2"
      >
        <YStack gap="$2">
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize="$3" fontWeight="600" color="$color" flexShrink={1}>
              {solicitacao.nome_servico}
            </Text>
            <StatusBadge status={solicitacao.status} />
          </XStack>

          <Text fontSize="$3" color="$gray10">
            {truncateDescription(solicitacao.descricao)}
          </Text>

          <Text fontSize="$2" color="$gray9">
            {formatDateTime(solicitacao.criado_em)}
          </Text>
        </YStack>
      </Card>
    </Pressable>
  );
}
