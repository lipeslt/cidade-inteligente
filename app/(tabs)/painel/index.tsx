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
import { Feather } from '@expo/vector-icons';

import { useSolicitacoesStore } from '@/stores/solicitacoesStore';
import { computeStatusCounts, filterByStatus } from '@/utils/roles';
import { SolicitacaoCard } from '@/components/SolicitacaoCard';
import type { StatusSolicitacao, Solicitacao } from '@/types';

// Configuração das cores e labels dos cards de status
const STATUS_CARDS: {
  status: StatusSolicitacao;
  label: string;
  color: string;
  icon: keyof typeof Feather.glyphMap;
}[] = [
  { status: 'aberto', label: 'Aberto', color: '#3b82f6', icon: 'circle' },
  { status: 'em_analise', label: 'Em Análise', color: '#f97316', icon: 'search' },
  { status: 'em_andamento', label: 'Em Andamento', color: '#eab308', icon: 'loader' },
  { status: 'resolvido', label: 'Resolvido', color: '#22c55e', icon: 'check-circle' },
  { status: 'fechado', label: 'Fechado', color: '#6b7280', icon: 'archive' },
  { status: 'cancelado', label: 'Cancelado', color: '#ef4444', icon: 'x-circle' },
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
      {STATUS_CARDS.map(({ status, label, color, icon }) => {
        const isActive = activeFilter === status;
        return (
          <TouchableOpacity
            key={status}
            style={[
              styles.statusCard,
              isActive
                ? { backgroundColor: color, borderColor: color }
                : { borderColor: color + '40' },
            ]}
            onPress={() => handleCardPress(status)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`${label}: ${statusCounts[status]} solicitações`}
            accessibilityState={{ selected: isActive }}
          >
            <Feather
              name={icon}
              size={18}
              color={isActive ? '#ffffff' : color}
              style={styles.statusCardIcon}
            />
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
                { color: isActive ? '#ffffffcc' : '#64748b' },
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
        <View style={styles.headerRow}>
          <View style={styles.headerIconCircle}>
            <Feather name="bar-chart-2" size={22} color="#ffffff" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Painel Administrativo</Text>
            <Text style={styles.subtitle}>Visão geral de todas as solicitações</Text>
          </View>
        </View>
      </View>
      {renderStatusCards()}
      {activeFilter && (
        <View style={styles.filterIndicator}>
          <View style={styles.filterIndicatorLeft}>
            <Feather name="filter" size={14} color="#1e40af" />
            <Text style={styles.filterText}>
              Filtrando: {STATUS_CARDS.find((c) => c.status === activeFilter)?.label}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setActiveFilter(undefined)}
            style={styles.clearFilterButton}
            activeOpacity={0.7}
          >
            <Feather name="x" size={14} color="#1e40af" />
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
        <View style={styles.emptyIconCircle}>
          <Feather name="inbox" size={32} color="#94a3b8" />
        </View>
        <Text style={styles.emptyTitle}>Nenhuma solicitação encontrada</Text>
        <Text style={styles.emptySubtext}>
          {activeFilter
            ? 'Tente limpar o filtro para ver todos os itens'
            : 'As solicitações aparecerão aqui quando forem criadas'}
        </Text>
      </View>
    );
  };

  if (error && solicitacoes.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerIconCircle}>
              <Feather name="bar-chart-2" size={22} color="#ffffff" />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>Painel Administrativo</Text>
              <Text style={styles.subtitle}>Visão geral de todas as solicitações</Text>
            </View>
          </View>
        </View>
        <View style={styles.errorContainer}>
          <View style={styles.errorIconCircle}>
            <Feather name="alert-triangle" size={28} color="#ef4444" />
          </View>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchSolicitacoes({ page: 1, per_page: 20 })}
            accessibilityRole="button"
            accessibilityLabel="Tentar novamente"
            activeOpacity={0.7}
          >
            <Feather name="refresh-cw" size={16} color="#ffffff" />
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
    paddingBottom: 16,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  headerIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1e40af',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 10,
  },
  statusCard: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  statusCardIcon: {
    marginBottom: 6,
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
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#e0e7ff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  filterIndicatorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterText: {
    fontSize: 13,
    color: '#1e40af',
    fontWeight: '600',
  },
  clearFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#ffffff',
  },
  clearFilter: {
    fontSize: 13,
    color: '#1e40af',
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 24,
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 15,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1e40af',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
