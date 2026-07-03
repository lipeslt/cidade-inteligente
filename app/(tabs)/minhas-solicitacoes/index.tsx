import { useEffect, useState, useCallback } from 'react';
import { FlatList, ScrollView, TouchableOpacity, View, StyleSheet } from 'react-native';
import { YStack, XStack, Text, Spinner } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { useSolicitacoesStore } from '@/stores/solicitacoesStore';
import { SolicitacaoCard } from '@/components/SolicitacaoCard';
import { ErrorMessage } from '@/components/ErrorMessage';
import type { Solicitacao, StatusSolicitacao } from '@/types';

/**
 * Opções de filtro por status exibidas como chips na parte superior da lista.
 * "Todos" limpa o filtro de status.
 */
interface FilterOption {
  label: string;
  value: StatusSolicitacao | undefined;
  icon: keyof typeof Feather.glyphMap;
}

const STATUS_FILTERS: FilterOption[] = [
  { label: 'Todos', value: undefined, icon: 'layers' },
  { label: 'Aberto', value: 'aberto', icon: 'circle' },
  { label: 'Em Análise', value: 'em_analise', icon: 'search' },
  { label: 'Em Andamento', value: 'em_andamento', icon: 'clock' },
  { label: 'Resolvido', value: 'resolvido', icon: 'check-circle' },
  { label: 'Fechado', value: 'fechado', icon: 'archive' },
  { label: 'Cancelado', value: 'cancelado', icon: 'x-circle' },
];

/**
 * Tela "Minhas Solicitações" – lista paginada de solicitações do cidadão.
 *
 * Funcionalidades:
 * - Busca inicial com fetchSolicitacoes() ao montar
 * - Scroll infinito via onEndReached → loadNextPage()
 * - Filtro por status via chips horizontais
 * - Indicador de carregamento (centro na carga inicial, rodapé na paginação)
 * - Empty state e error state com retry
 */
export default function MinhasSolicitacoesScreen() {
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

  const [selectedStatus, setSelectedStatus] = useState<StatusSolicitacao | undefined>(undefined);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    const load = async () => {
      await fetchSolicitacoes();
      setIsInitialLoad(false);
    };
    load();
  }, [fetchSolicitacoes]);

  const handleStatusFilter = useCallback(
    async (status: StatusSolicitacao | undefined) => {
      setSelectedStatus(status);
      setIsInitialLoad(true);
      await applyFilter({ status });
      setIsInitialLoad(false);
    },
    [applyFilter]
  );

  const handleCardPress = useCallback(
    (id: number) => {
      router.push(`/minhas-solicitacoes/${id}`);
    },
    [router]
  );

  const handleEndReached = useCallback(() => {
    if (!isLoading && paginacao && paginacao.page < paginacao.total_pages) {
      loadNextPage();
    }
  }, [isLoading, paginacao, loadNextPage]);

  const handleRetry = useCallback(async () => {
    setIsInitialLoad(true);
    await fetchSolicitacoes();
    setIsInitialLoad(false);
  }, [fetchSolicitacoes]);

  const renderItem = useCallback(
    ({ item }: { item: Solicitacao }) => (
      <SolicitacaoCard
        solicitacao={item}
        onPress={() => handleCardPress(item.id_solicitacao)}
      />
    ),
    [handleCardPress]
  );

  const renderFooter = useCallback(() => {
    if (isLoading && !isInitialLoad) {
      return (
        <YStack p="$4" ai="center">
          <Spinner size="small" color="$blue10" />
        </YStack>
      );
    }
    return null;
  }, [isLoading, isInitialLoad]);

  const renderEmpty = useCallback(() => {
    if (isLoading) return null;
    return (
      <YStack f={1} jc="center" ai="center" p="$8">
        <View style={styles.emptyIconContainer}>
          <Feather name="inbox" size={48} color="#94a3b8" />
        </View>
        <Text fontSize="$5" fontWeight="600" color="#475569" ta="center" mt="$4">
          Nenhuma solicitação encontrada
        </Text>
        <Text fontSize="$3" color="#94a3b8" ta="center" mt="$2">
          {selectedStatus
            ? 'Tente outro filtro ou crie uma nova solicitação'
            : 'Suas solicitações aparecerão aqui'}
        </Text>
      </YStack>
    );
  }, [isLoading, selectedStatus]);

  const renderHeader = useCallback(() => (
    <YStack gap="$3" pb="$2">
      {/* Page header */}
      <YStack px="$4" pt="$2" gap="$1">
        <Text fontSize={24} fontWeight="800" color="#1e293b">
          Minhas Solicitações
        </Text>
        <Text fontSize="$3" color="#64748b">
          Acompanhe o andamento das suas solicitações
        </Text>
      </YStack>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
      >
        {STATUS_FILTERS.map((filter) => {
          const isActive = selectedStatus === filter.value;
          return (
            <TouchableOpacity
              key={filter.label}
              onPress={() => handleStatusFilter(filter.value)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`Filtrar por ${filter.label}`}
              style={[
                styles.filterChip,
                isActive ? styles.filterChipActive : styles.filterChipInactive,
              ]}
            >
              <Feather
                name={filter.icon}
                size={14}
                color={isActive ? '#ffffff' : '#64748b'}
              />
              <Text
                fontSize="$3"
                fontWeight={isActive ? '600' : '400'}
                color={isActive ? '#ffffff' : '#475569'}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </YStack>
  ), [selectedStatus, handleStatusFilter]);

  // Estado de carregamento inicial
  if (isInitialLoad && isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
        <YStack f={1} jc="center" ai="center" bg="#f8fafc">
          <Spinner size="large" color="#1e40af" />
          <Text mt="$3" color="#64748b" fontSize="$4">
            Carregando solicitações...
          </Text>
        </YStack>
      </SafeAreaView>
    );
  }

  // Estado de erro
  if (error && solicitacoes.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
        <YStack f={1} bg="#f8fafc">
          {renderHeader()}
          <YStack f={1} jc="center" p="$4">
            <ErrorMessage message={error} onRetry={handleRetry} />
          </YStack>
        </YStack>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <YStack f={1} bg="#f8fafc">
        <FlatList
          data={solicitacoes}
          keyExtractor={(item) => String(item.id_solicitacao)}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 16 }}
        />
      </YStack>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  filtersContainer: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: '#1e40af',
  },
  filterChipInactive: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
