import { useEffect, useState, useCallback } from 'react';
import { Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { YStack, XStack, Text, Button, ScrollView, Image, Spinner } from 'tamagui';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { StatusBadge, MapPreview, ErrorMessage, TecnicoControls } from '@/components';
import { detalhar } from '@/services/solicitacoes';
import { useAuthStore } from '@/stores/authStore';
import { AppError } from '@/utils/errors';
import type { SolicitacaoDetalhe, Foto } from '@/types';

/**
 * Tela de detalhe de uma solicitação.
 *
 * Exibe descrição, status, serviço, fotos e localização do técnico.
 * Trata erros específicos da API (solicitacao_nao_encontrada, acesso_negado)
 * e erros de rede com opção de retry.
 *
 * Para técnicos, exibe controles adicionais de alteração de status e
 * compartilhamento de localização via TecnicoControls.
 */
export default function DetalhesSolicitacaoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [solicitacao, setSolicitacao] = useState<SolicitacaoDetalhe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNavigatingBack, setIsNavigatingBack] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Foto | null>(null);

  const fetchDetalhe = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    setError(null);

    try {
      const dados = await detalhar(Number(id));
      setSolicitacao(dados);
    } catch (err) {
      if (err instanceof AppError) {
        if (err.type === 'api') {
          // Verificar erros específicos que exigem voltar após 3s
          if (err.message === 'Solicitação não encontrada') {
            setError(err.message);
            setIsNavigatingBack(true);
            return;
          }
          if (err.message === 'Você não tem permissão para esta ação') {
            setError('Você não tem permissão para visualizar esta solicitação');
            setIsNavigatingBack(true);
            return;
          }
        }
        setError(err.message);
      } else {
        setError('Ocorreu um erro inesperado. Tente novamente');
      }
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  // Carregar dados ao montar
  useEffect(() => {
    fetchDetalhe();
  }, [fetchDetalhe]);

  // Navegar de volta após 3s em erros de solicitacao_nao_encontrada ou acesso_negado
  useEffect(() => {
    if (!isNavigatingBack) return;

    const timer = setTimeout(() => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/minhas-solicitacoes');
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [isNavigatingBack, router]);

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/minhas-solicitacoes');
    }
  };

  // Callback chamado quando o técnico atualiza o status
  const handleStatusChanged = useCallback(() => {
    fetchDetalhe();
  }, [fetchDetalhe]);

  // Estado de carregamento
  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <YStack flex={1} alignItems="center" justifyContent="center">
          <Spinner size="large" color="$blue10" />
          <Text marginTop="$3" color="$gray9" fontSize="$3">
            Carregando solicitação...
          </Text>
        </YStack>
      </SafeAreaView>
    );
  }

  // Estado de erro com navegação automática (solicitacao_nao_encontrada / acesso_negado)
  if (error && isNavigatingBack) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <YStack flex={1} alignItems="center" justifyContent="center" padding="$4">
          <Text color="$red10" fontSize="$5" textAlign="center" fontWeight="600">
            {error}
          </Text>
          <Text color="$gray8" fontSize="$3" marginTop="$2" textAlign="center">
            Retornando à lista...
          </Text>
          <Button
            marginTop="$4"
            size="$3"
            onPress={handleGoBack}
            accessibilityLabel="Voltar para lista"
          >
            Voltar agora
          </Button>
        </YStack>
      </SafeAreaView>
    );
  }

  // Estado de erro de rede com retry
  if (error && !isNavigatingBack) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <YStack flex={1} padding="$4">
          <Button
            size="$3"
            chromeless
            onPress={handleGoBack}
            alignSelf="flex-start"
            marginBottom="$3"
            accessibilityLabel="Voltar"
          >
            ← Voltar
          </Button>
          <YStack flex={1} alignItems="center" justifyContent="center">
            <ErrorMessage message={error} onRetry={fetchDetalhe} />
          </YStack>
        </YStack>
      </SafeAreaView>
    );
  }

  // Sem dados (não deveria acontecer, mas por segurança)
  if (!solicitacao) {
    return null;
  }

  const { descricao, status, nome_servico, fotos, localizacao_tecnico } = solicitacao;
  const hasPhotos = fotos && fotos.length > 0;
  const photosToShow = hasPhotos ? fotos.slice(0, 5) : [];
  const hasLocation =
    localizacao_tecnico !== null &&
    localizacao_tecnico.latitude !== '' &&
    localizacao_tecnico.longitude !== '';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Modal de imagem fullscreen */}
      <Modal
        visible={selectedPhoto !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.9)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={() => setSelectedPhoto(null)}
        >
          {selectedPhoto && (
            <Image
              source={{ uri: selectedPhoto.url }}
              width="100%"
              height="80%"
              resizeMode="contain"
              accessibilityLabel={`Foto: ${selectedPhoto.metadata?.original_name || 'imagem'}`}
            />
          )}
          <Text color="white" marginTop="$3" fontSize="$3">
            Toque para fechar
          </Text>
        </Pressable>
      </Modal>

      <ScrollView flex={1}>
        <YStack padding="$4" gap="$4">
          {/* Botão voltar */}
          <Button
            size="$3"
            chromeless
            onPress={handleGoBack}
            alignSelf="flex-start"
            accessibilityLabel="Voltar para lista de solicitações"
          >
            ← Voltar
          </Button>

          {/* Serviço */}
          {nome_servico ? (
            <YStack gap="$1">
              <Text fontSize="$2" color="$gray8" fontWeight="500">
                Serviço
              </Text>
              <Text fontSize="$5" fontWeight="600" color="$gray12">
                {nome_servico}
              </Text>
            </YStack>
          ) : null}

          {/* Status */}
          {status ? (
            <YStack gap="$1">
              <Text fontSize="$2" color="$gray8" fontWeight="500">
                Status
              </Text>
              <StatusBadge status={status} />
            </YStack>
          ) : null}

          {/* Descrição */}
          {descricao ? (
            <YStack gap="$1">
              <Text fontSize="$2" color="$gray8" fontWeight="500">
                Descrição
              </Text>
              <Text fontSize="$4" color="$gray11" lineHeight={22}>
                {descricao}
              </Text>
            </YStack>
          ) : null}

          {/* Fotos */}
          {photosToShow.length > 0 ? (
            <YStack gap="$2">
              <Text fontSize="$2" color="$gray8" fontWeight="500">
                Fotos
              </Text>
              <XStack flexWrap="wrap" gap="$2">
                {photosToShow.map((foto) => (
                  <Pressable
                    key={foto.id_foto}
                    onPress={() => setSelectedPhoto(foto)}
                    accessibilityLabel={`Ver foto: ${foto.metadata?.original_name || 'imagem'}`}
                    accessibilityRole="button"
                  >
                    <Image
                      source={{ uri: foto.url }}
                      width={80}
                      height={80}
                      borderRadius={8}
                      backgroundColor="$gray4"
                    />
                  </Pressable>
                ))}
              </XStack>
            </YStack>
          ) : null}

          {/* Localização do técnico */}
          {hasLocation ? (
            <YStack gap="$2">
              <Text fontSize="$2" color="$gray8" fontWeight="500">
                Localização do Técnico
              </Text>
              <MapPreview
                latitude={parseFloat(localizacao_tecnico!.latitude)}
                longitude={parseFloat(localizacao_tecnico!.longitude)}
              />
            </YStack>
          ) : null}

          {/* Controles do Técnico (renderizado apenas para user.tipo === 'tecnico') */}
          {user?.tipo === 'tecnico' ? (
            <TecnicoControls
              idSolicitacao={solicitacao.id_solicitacao}
              currentStatus={status}
              onStatusChanged={handleStatusChanged}
            />
          ) : null}
        </YStack>
      </ScrollView>
    </SafeAreaView>
  );
}
