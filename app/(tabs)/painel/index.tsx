import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useSolicitacoesStore } from '@/stores/solicitacoesStore';
import { computeStatusCounts, filterByStatus } from '@/utils/roles';
import { SolicitacaoCard } from '@/components/SolicitacaoCard';
import type { StatusSolicitacao, Solicitacao } from '@/types';

// Configuração das cores e labels dos cards de status
const STATUS_CARDS: {
  status: StatusSolicitacao;
  label: string;
  color: string;
}[] = [
  { status: 'aberto', label: 'Aberto', color: '#3b82f6' },
  { status: 'em_analise', label: 'Em Análise', color: '#f97316' },
  { status: 'em_andamento', label: 'Em Andamento', color: '#eab308' },
  { status: 'resolvido', label: 'Resolvido', color: '#22c55e' },
  { status: 'fechado', label: 'Fechado', color: '#6b7280' },
  { status: 'cancelado', label: 'Cancelado', color: '#ef4444' },
];

export default function PainelScreen() {
  const router = useRouter();
  const {
    solicitacoes,
    paginacao,
    isLoading,
    error,
    fetchSolicitacoes,
    loadNextPage,
  } = useSolicitacoesStore();

  const [activeFilter, setActiveFilter] = useState<StatusSolicitacao | undefined>(undefined);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSolicitacoes({ page: 1, per_page: 20 });
  }, [fetchSolicitacoes]);

  const statusCounts = computeStatusCounts(solicitacoes);
  const filteredData = filterByStatus(solicitacoes, activeFilter);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSolicitacoes({ page: 1, per_page: 20 });
    setRefreshing(false);
  }, [fetchSolicitacoes]);

  const handleEndReached = useCallback(() => {
    if (!isLoading && paginacao && paginacao.page < paginacao.total_pages) {
      loadNextPage();
    }
  }, [isLoading, paginacao, loadNextPage]);

  const handleCardPress = useCallback((status: StatusSolicitacao) => {
    setActiveFilter((prev) => (prev === status ? undefined : status));
  }, []);

  const handleItemPress = useCallback(
    (item: Solicitacao) => {
      router.push(`/(tabs)/minhas-solicitacoes/${item.id_solicitacao}`);
    },
    [router],
  );

  const renderStatusCards = () => (
    <View style={styles.cardsGrid}>
      {STATUS_CARDS.map(({ status, label, color }) => {
        const isActive = activeFilter === status;
        return (
          <TouchableOpacity
            key={status}
            style={[
              styles.statusCard,
              { borderColor: color },
              isActive && { backgroundColor: color },
            ]}
            onPress={() => handleCardPress(status)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`${label}: ${statusCounts[status]} solicitações`}
            accessibilityState={{ selected: isActive }}
          >
            <Text
              style={[
                styles.statusCardCount,
                { color: isActive ? '#ffffff' : color },
              ]}
            >
              {statusCounts[status]}
            </Text>
            <Text
              style={[
                styles.statusCardLabel,
                { color: isActive ? '#ffffff' : '#64748b' },
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerSection}>
      <View style={styles.header}>
        <Text style={styles.title}>Painel Administrativo</Text>
        <Text style={styles.subtitle}>Visão geral de todas as solicitações</Text>
      </View>
      {renderStatusCards()}
      {activeFilter && (
        <View style={styles.filterIndicator}>
          <Text style={styles.filterText}>
            Filtrando por: {STATUS_CARDS.find((c) => c.status === activeFilter)?.label}
          </Text>
          <TouchableOpacity onPress={() => setActiveFilter(undefined)}>
            <Text style={styles.clearFilter}>Limpar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderItem = useCallback(
    ({ item }: { item: Solicitacao }) => (
      <SolicitacaoCard
        solicitacao={item}
        onPress={() => handleItemPress(item)}
      />
    ),
    [handleItemPress],
  );

  const renderFooter = () => {
    if (!isLoading || refreshing) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#1e40af" />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Nenhuma solicitação encontrada</Text>
      </View>
    );
  };

  if (error && solicitacoes.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Painel Administrativo</Text>
          <Text style={styles.subtitle}>Visão geral de todas as solicitações</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchSolicitacoes({ page: 1, per_page: 20 })}
            accessibilityRole="button"
            accessibilityLabel="Tentar novamente"
          >
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={filteredData}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id_solicitacao)}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#1e40af']}
            tintColor="#1e40af"
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerSection: {
    paddingBottom: 12,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
  },
  statusCard: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    padding: 14,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statusCardCount: {
    fontSize: 28,
    fontWeight: '700',
  },
  statusCardLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  filterIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#e0e7ff',
    borderRadius: 8,
  },
  filterText: {
    fontSize: 13,
    color: '#1e40af',
    fontWeight: '500',
  },
  clearFilter: {
    fontSize: 13,
    color: '#1e40af',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  listContent: {
    paddingBottom: 24,
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#64748b',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 15,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#1e40af',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
