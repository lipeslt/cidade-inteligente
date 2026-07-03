import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useSolicitacoesStore } from '@/stores/solicitacoesStore';
import { SolicitacaoCard } from '@/components/SolicitacaoCard';
import { shouldHighlight } from '@/utils/roles';
import type { StatusSolicitacao, Solicitacao } from '@/types';

// Chips de filtro de status
const STATUS_CHIPS: { status: StatusSolicitacao | undefined; label: string }[] = [
  { status: undefined, label: 'Todos' },
  { status: 'aberto', label: 'Aberto' },
  { status: 'em_analise', label: 'Em Análise' },
  { status: 'em_andamento', label: 'Em Andamento' },
  { status: 'resolvido', label: 'Resolvido' },
  { status: 'fechado', label: 'Fechado' },
  { status: 'cancelado', label: 'Cancelado' },
];

export default function TrabalhoScreen() {
  const router = useRouter();
  const {
    solicitacoes,
    paginacao,
    isLoading,
    error,
    fetchSolicitacoes,
    loadNextPage,
    applyFilter,
  } = useSolicitacoesStore();

  const [activeFilter, setActiveFilter] = useState<StatusSolicitacao | undefined>(undefined);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSolicitacoes({ page: 1, per_page: 20 });
  }, [fetchSolicitacoes]);

  const handleFilterPress = useCallback(
    (status: StatusSolicitacao | undefined) => {
      setActiveFilter(status);
      if (status) {
        applyFilter({ status });
      } else {
        applyFilter({ status: undefined });
      }
    },
    [applyFilter],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (activeFilter) {
      await applyFilter({ status: activeFilter });
    } else {
      await fetchSolicitacoes({ page: 1, per_page: 20 });
    }
    setRefreshing(false);
  }, [fetchSolicitacoes, applyFilter, activeFilter]);

  const handleEndReached = useCallback(() => {
    if (!isLoading && paginacao && paginacao.page < paginacao.total_pages) {
      loadNextPage();
    }
  }, [isLoading, paginacao, loadNextPage]);

  const handleItemPress = useCallback(
    (item: Solicitacao) => {
      router.push(`/(tabs)/minhas-solicitacoes/${item.id_solicitacao}`);
    },
    [router],
  );

  const renderFilterBar = () => (
    <View style={styles.filterBarContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterBarContent}
      >
        {STATUS_CHIPS.map(({ status, label }) => {
          const isActive = activeFilter === status;
          return (
            <TouchableOpacity
              key={label}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => handleFilterPress(status)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Filtrar por ${label}`}
              accessibilityState={{ selected: isActive }}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isActive && styles.filterChipTextActive,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderItem = useCallback(
    ({ item }: { item: Solicitacao }) => {
      const highlighted = shouldHighlight(item.status);
      return (
        <View
          style={highlighted ? styles.highlightedItem : undefined}
        >
          <SolicitacaoCard
            solicitacao={item}
            onPress={() => handleItemPress(item)}
          />
        </View>
      );
    },
    [handleItemPress],
  );

  const renderHeader = () => (
    <View>
      <View style={styles.header}>
        <Text style={styles.title}>Meu Trabalho</Text>
        <Text style={styles.subtitle}>Solicitações para atendimento</Text>
      </View>
      {renderFilterBar()}
    </View>
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
          <Text style={styles.title}>Meu Trabalho</Text>
          <Text style={styles.subtitle}>Solicitações para atendimento</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchSolicitacoes({ page: 1, per_page: 20 })}
            activeOpacity={0.7}
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
        data={solicitacoes}
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
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
  filterBarContainer: {
    paddingVertical: 12,
  },
  filterBarContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: '#1e40af',
    borderColor: '#1e40af',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  highlightedItem: {
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
    borderRadius: 4,
    marginLeft: 0,
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
