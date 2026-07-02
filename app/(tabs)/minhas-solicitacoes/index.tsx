import { useEffect, useState, useCallback } from 'react';
import { FlatList } from 'react-native';
import { YStack, XStack, Text, Spinner } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

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
}

const STATUS_FILTERS: FilterOption[] = [
  { label: 'Todos', value: undefined },
  { label: 'Aberto', value: 'aberto' },
  { label: 'Em Análise', value: 'em_analise' },
  { label: 'Em Andamento', value: 'em_andamento' },
  { label: 'Resolvido', value: 'resolvido' },
  { label: 'Fechado', value: 'fechado' },
  { label: 'Cancelado', value: 'cancelado' },
];

/**
 * Tela "Minhas Solicitações" – lista paginada de solicitações do cidadão.
 *
 * Funcionalidades:
 * - Busca inicial com fetchSolicitacoes() ao montar
 * - Scroll infinito via onEndReached → loadNextPage()
 * - Filtro por status via chips
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
        <YStack padding="$4" alignItems="center">
          <Spinner size="small" color="$blue10" />
        </YStack>
      );
    }
    return null;
  }, [isLoading, isInitialLoad]);

  const renderEmpty = useCallback(() => {
    if (isLoading) return null;
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" padding="$6">
        <Text fontSize="$5" color="$gray10" textAlign="center">
          Nenhuma solicitação encontrada
        </Text>
      </YStack>
    );
  }, [isLoading]);

  const renderHeader = useCallback(() => (
    <XStack
      paddingHorizontal="$2"
      paddingVertical="$3"
      gap="$2"
      flexWrap="wrap"
    >
      {STATUS_FILTERS.map((filter) => {
        const isActive = selectedStatus === filter.value;
        return (
          <YStack
            key={filter.label}
            pressStyle={{ opacity: 0.7 }}
            onPress={() => handleStatusFilter(filter.value)}
            backgroundColor={isActive ? '$blue10' : '$gray3'}
            paddingHorizontal="$3"
            paddingVertical="$2"
            borderRadius="$10"
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`Filtrar por ${filter.label}`}
          >
            <Text
              fontSize="$3"
              fontWeight={isActive ? '600' : '400'}
              color={isActive ? 'white' : '$gray11'}
            >
              {filter.label}
            </Text>
          </YStack>
        );
      })}
    </XStack>
  ), [selectedStatus, handleStatusFilter]);

  // Estado de carregamento inicial
  if (isInitialLoad && isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
        <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$background">
          <Spinner size="large" color="$blue10" />
          <Text marginTop="$3" color="$gray10" fontSize="$4">
            Carregando solicitações...
          </Text>
        </YStack>
      </SafeAreaView>
    );
  }

  // Estado de erro
  if (error && solicitacoes.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
        <YStack flex={1} backgroundColor="$background">
          {renderHeader()}
          <YStack flex={1} justifyContent="center" padding="$4">
            <ErrorMessage message={error} onRetry={handleRetry} />
          </YStack>
        </YStack>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <YStack flex={1} backgroundColor="$background">
        <FlatList
          data={solicitacoes}
          keyExtractor={(item) => String(item.id_solicitacao)}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          contentContainerStyle={{ flexGrow: 1 }}
        />
      </YStack>
    </SafeAreaView>
  );
}
