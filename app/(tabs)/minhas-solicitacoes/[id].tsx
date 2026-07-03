import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView as RNScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { StatusBadge, MapPreview, ErrorMessage, TecnicoControls } from '@/components';
import { detalhar } from '@/services/solicitacoes';
import { useAuthStore } from '@/stores/authStore';
import { AppError } from '@/utils/errors';
import type { SolicitacaoDetalhe, Foto } from '@/types';

/**
 * Tela de detalhe de uma solicitação — layout card-based profissional.
 *
 * Exibe serviço, status, descrição, fotos e localização do técnico
 * em cards separados com visual consistente com nova-solicitacao.
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

  useEffect(() => {
    fetchDetalhe();
  }, [fetchDetalhe]);

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

  const handleStatusChanged = useCallback(() => {
    fetchDetalhe();
  }, [fetchDetalhe]);

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1e40af" />
          <Text style={styles.loadingText}>Carregando solicitação...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error with auto-navigate back
  if (error && isNavigatingBack) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Feather name="alert-circle" size={48} color="#ef4444" />
          <Text style={styles.errorTitle}>{error}</Text>
          <Text style={styles.errorSubtitle}>Retornando à lista...</Text>
          <TouchableOpacity
            style={styles.btnOutline}
            onPress={handleGoBack}
            activeOpacity={0.7}
            accessibilityLabel="Voltar para lista"
          >
            <Text style={styles.btnOutlineText}>Voltar agora</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Network error with retry
  if (error && !isNavigatingBack) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleGoBack}
            activeOpacity={0.7}
            style={styles.backButton}
            accessibilityLabel="Voltar"
          >
            <Feather name="arrow-left" size={20} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalhes</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centered}>
          <ErrorMessage message={error} onRetry={fetchDetalhe} />
        </View>
      </SafeAreaView>
    );
  }

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
    <SafeAreaView style={styles.safeArea}>
      {/* Fullscreen photo modal */}
      <Modal
        visible={selectedPhoto !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setSelectedPhoto(null)}
          activeOpacity={1}
          accessibilityLabel="Fechar foto"
        >
          {selectedPhoto && (
            <Image
              source={{ uri: selectedPhoto.url }}
              style={styles.modalImage}
              resizeMode="contain"
              accessibilityLabel={`Foto: ${selectedPhoto.metadata?.original_name || 'imagem'}`}
            />
          )}
          <Text style={styles.modalHint}>Toque para fechar</Text>
        </TouchableOpacity>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleGoBack}
          activeOpacity={0.7}
          style={styles.backButton}
          accessibilityLabel="Voltar para lista de solicitações"
          accessibilityRole="button"
        >
          <Feather name="arrow-left" size={20} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes</Text>
        <View style={styles.headerSpacer} />
      </View>

      <RNScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Serviço card */}
        {nome_servico ? (
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.serviceIcon}>
                <Feather name="tool" size={20} color="#1e40af" />
              </View>
              <View style={styles.serviceInfo}>
                <Text style={styles.cardLabel}>Serviço</Text>
                <Text style={styles.serviceName}>{nome_servico}</Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Status card */}
        {status ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Status</Text>
            <View style={styles.statusContainer}>
              <StatusBadge status={status} />
            </View>
          </View>
        ) : null}

        {/* Descrição card */}
        {descricao ? (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Feather name="file-text" size={16} color="#64748b" />
              <Text style={styles.cardLabel}>Descrição</Text>
            </View>
            <Text style={styles.descriptionText}>{descricao}</Text>
          </View>
        ) : null}

        {/* Fotos card */}
        {photosToShow.length > 0 ? (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Feather name="camera" size={16} color="#64748b" />
              <Text style={styles.cardLabel}>Fotos</Text>
            </View>
            <RNScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photosRow}
            >
              {photosToShow.map((foto) => (
                <TouchableOpacity
                  key={foto.id_foto}
                  onPress={() => setSelectedPhoto(foto)}
                  activeOpacity={0.8}
                  accessibilityLabel={`Ver foto: ${foto.metadata?.original_name || 'imagem'}`}
                  accessibilityRole="button"
                >
                  <Image
                    source={{ uri: foto.url }}
                    style={styles.photoThumb}
                  />
                </TouchableOpacity>
              ))}
            </RNScrollView>
          </View>
        ) : null}

        {/* Location card */}
        {hasLocation ? (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Feather name="map-pin" size={16} color="#64748b" />
              <Text style={styles.cardLabel}>Localização do Técnico</Text>
            </View>
            <View style={styles.mapContainer}>
              <MapPreview
                latitude={parseFloat(localizacao_tecnico!.latitude)}
                longitude={parseFloat(localizacao_tecnico!.longitude)}
              />
            </View>
          </View>
        ) : null}

        {/* Técnico controls */}
        {user?.tipo === 'tecnico' ? (
          <View style={styles.card}>
            <TecnicoControls
              idSolicitacao={solicitacao.id_solicitacao}
              currentStatus={status}
              onStatusChanged={handleStatusChanged}
            />
          </View>
        ) : null}
      </RNScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  errorTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#ef4444',
    textAlign: 'center',
  },
  errorSubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  btnOutline: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e40af',
  },
  btnOutlineText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceInfo: {
    flex: 1,
    gap: 4,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  statusContainer: {
    marginTop: 8,
  },
  descriptionText: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
  },
  photosRow: {
    gap: 10,
    paddingVertical: 4,
  },
  photoThumb: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#e2e8f0',
  },
  mapContainer: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: '80%',
  },
  modalHint: {
    color: '#ffffff',
    marginTop: 16,
    fontSize: 14,
  },
});
