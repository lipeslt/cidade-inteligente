import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';
import type { Solicitacao, StatusSolicitacao } from '../types';
import { truncateDescription, formatDateTime } from '../utils/formatters';

export interface SolicitacaoCardProps {
  solicitacao: Solicitacao;
  onPress: () => void;
}

/**
 * Cores da barra lateral e indicador de status por tipo.
 */
const STATUS_COLORS: Record<StatusSolicitacao, { bar: string; dot: string; bg: string; text: string; label: string }> = {
  aberto: { bar: '#3b82f6', dot: '#3b82f6', bg: '#eff6ff', text: '#1d4ed8', label: 'Aberto' },
  em_analise: { bar: '#f97316', dot: '#f97316', bg: '#fff7ed', text: '#c2410c', label: 'Em Análise' },
  em_andamento: { bar: '#eab308', dot: '#eab308', bg: '#fefce8', text: '#a16207', label: 'Em Andamento' },
  resolvido: { bar: '#22c55e', dot: '#22c55e', bg: '#f0fdf4', text: '#15803d', label: 'Resolvido' },
  fechado: { bar: '#6b7280', dot: '#6b7280', bg: '#f9fafb', text: '#4b5563', label: 'Fechado' },
  cancelado: { bar: '#ef4444', dot: '#ef4444', bg: '#fef2f2', text: '#b91c1c', label: 'Cancelado' },
};

/**
 * Card redesenhado para exibição de uma solicitação na lista.
 * Mostra barra lateral colorida por status, título do serviço, descrição truncada,
 * badge de status com indicador dot e data formatada.
 */
export function SolicitacaoCard({ solicitacao, onPress }: SolicitacaoCardProps) {
  const statusConfig = STATUS_COLORS[solicitacao.status] || STATUS_COLORS.aberto;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Solicitação ${solicitacao.nome_servico}, status ${statusConfig.label}`}
      style={styles.container}
    >
      {/* Barra lateral colorida */}
      <View style={[styles.leftBar, { backgroundColor: statusConfig.bar }]} />

      {/* Conteúdo */}
      <YStack f={1} p="$3" gap="$2">
        <XStack jc="space-between" ai="flex-start">
          <Text fontSize="$4" fontWeight="600" color="#1e293b" f={1} mr="$2" numberOfLines={1}>
            {solicitacao.nome_servico}
          </Text>

          {/* Status badge */}
          <View style={[styles.badge, { backgroundColor: statusConfig.bg }]}>
            <View style={[styles.dot, { backgroundColor: statusConfig.dot }]} />
            <Text fontSize="$2" fontWeight="600" color={statusConfig.text}>
              {statusConfig.label}
            </Text>
          </View>
        </XStack>

        <Text fontSize="$3" color="#64748b" numberOfLines={2}>
          {truncateDescription(solicitacao.descricao, 120)}
        </Text>

        <Text fontSize="$2" color="#94a3b8" mt="$1">
          {formatDateTime(solicitacao.criado_em)}
        </Text>
      </YStack>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  leftBar: {
    width: 4,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
});
