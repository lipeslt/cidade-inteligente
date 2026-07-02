import { useEffect, useState, useCallback, useRef } from 'react';
import { Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { YStack, XStack, Text, Input, TextArea, Button, ScrollView, Spinner } from 'tamagui';
import * as ImagePicker from 'expo-image-picker';

import { useCatalogStore } from '@/stores/catalogStore';
import { ErrorMessage, PrioritySelector, PhotoPicker, MapPreview } from '@/components';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { requestPermission, getCurrentPosition } from '@/services/location';
import { criar } from '@/services/solicitacoes';
import { validateSolicitacaoForm, validatePhoto } from '@/utils/validation';
import { formatCoordinateCitizen } from '@/utils/formatters';
import type { Setor, Servico, Prioridade, ImageFile, CriarSolicitacaoRequest } from '@/types';

type Step = 'setores' | 'servicos' | 'formulario';

/**
 * Tela Nova Solicitação — fluxo multi-step (state machine).
 *
 * Step 1: Selecionar Setor → Selecionar Serviço
 * Step 2: Preencher formulário (implementado na Task 8.4)
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.4, 5.5
 */
export default function NovaSolicitacaoScreen() {
  const [step, setStep] = useState<Step>('setores');
  const [selectedSetor, setSelectedSetor] = useState<Setor | null>(null);
  const [selectedServico, setSelectedServico] = useState<Servico | null>(null);

  // ─── Form state ──────────────────────────────────────────────────────────
  const [descricao, setDescricao] = useState('');
  const [endereco, setEndereco] = useState('');
  const [bairro, setBairro] = useState('');
  const [numero, setNumero] = useState('');
  const [prioridade, setPrioridade] = useState<Prioridade>('media');
  const [fotos, setFotos] = useState<ImageFile[]>([]);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [gpsMessage, setGpsMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const gpsAttempted = useRef(false);

  const {
    setores,
    servicos,
    isLoading,
    error,
    fetchSetores,
    fetchServicos,
  } = useCatalogStore();

  // Busca setores ao montar o componente
  useEffect(() => {
    fetchSetores();
  }, [fetchSetores]);

  const handleSelectSetor = useCallback(
    (setor: Setor) => {
      setSelectedSetor(setor);
      setStep('servicos');
      fetchServicos(setor.id_setor);
    },
    [fetchServicos],
  );

  const handleSelectServico = useCallback((servico: Servico) => {
    setSelectedServico(servico);
    setStep('formulario');
  }, []);

  const handleBackToSetores = useCallback(() => {
    setSelectedSetor(null);
    setStep('setores');
  }, []);

  const handleRetrySetores = useCallback(() => {
    fetchSetores();
  }, [fetchSetores]);

  const handleRetryServicos = useCallback(() => {
    if (selectedSetor) {
      fetchServicos(selectedSetor.id_setor);
    }
  }, [fetchServicos, selectedSetor]);

  // ─── GPS Capture on form step entry ──────────────────────────────────────
  useEffect(() => {
    if (step === 'formulario' && !gpsAttempted.current) {
      gpsAttempted.current = true;
      (async () => {
        const granted = await requestPermission();
        if (!granted) {
          setGpsMessage('Localização não disponível. Informe o endereço manualmente');
          return;
        }
        const coords = await getCurrentPosition(15000);
        if (coords) {
          setLatitude(coords.latitude);
          setLongitude(coords.longitude);
          setGpsMessage(null);
        } else {
          setGpsMessage('Não foi possível obter a localização. Informe o endereço manualmente');
        }
      })();
    }
  }, [step]);

  // ─── Photo add handler ───────────────────────────────────────────────────
  const handleAddPhoto = useCallback(async () => {
    setPhotoError(null);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: false,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return;
    }

    const asset = result.assets[0];
    const uri = asset.uri;
    const fileName = asset.fileName || uri.split('/').pop() || 'photo.jpg';
    const mimeType = asset.mimeType || 'image/jpeg';
    const fileSize = asset.fileSize || 0;

    const photoFile = { uri, name: fileName, type: mimeType, size: fileSize };
    const validation = validatePhoto(photoFile);

    if (!validation.valid) {
      setPhotoError(validation.error || 'Foto inválida');
      return;
    }

    if (fotos.length >= 5) {
      setPhotoError('Máximo de 5 fotos permitido');
      return;
    }

    setFotos((prev) => [...prev, photoFile]);
  }, [fotos.length]);

  // ─── Photo remove handler ────────────────────────────────────────────────
  const handleRemovePhoto = useCallback((index: number) => {
    setFotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoError(null);
  }, []);

  // ─── Form reset ──────────────────────────────────────────────────────────
  const resetForm = useCallback(() => {
    setDescricao('');
    setEndereco('');
    setBairro('');
    setNumero('');
    setPrioridade('media');
    setFotos([]);
    setLatitude(null);
    setLongitude(null);
    setGpsMessage(null);
    setFormError(null);
    setPhotoError(null);
    setSelectedServico(null);
    setSelectedSetor(null);
    gpsAttempted.current = false;
    setStep('setores');
  }, []);

  // ─── Submit handler ──────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    setFormError(null);

    // Client-side validation
    const validation = validateSolicitacaoForm({
      id_servico: selectedServico?.id_servico,
      descricao,
    });

    if (!validation.valid) {
      setFormError(validation.errors.join('. '));
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: CriarSolicitacaoRequest = {
        id_servico: selectedServico!.id_servico,
        descricao: descricao.trim(),
        prioridade,
      };

      if (endereco.trim()) payload.endereco = endereco.trim();
      if (bairro.trim()) payload.bairro = bairro.trim();
      if (numero.trim()) payload.numero = numero.trim();
      if (latitude !== null && longitude !== null) {
        payload.latitude = formatCoordinateCitizen(latitude);
        payload.longitude = formatCoordinateCitizen(longitude);
      }

      await criar(payload, fotos.length > 0 ? fotos : undefined);

      Alert.alert('Sucesso', 'Solicitação criada com sucesso!');

      // Reset form and navigate back to setores after 3s
      setTimeout(() => {
        resetForm();
      }, 3000);
    } catch (err: any) {
      // Preserve form data on error (Requirement 6.15)
      const message = err?.message || 'Ocorreu um erro ao enviar a solicitação. Tente novamente.';
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedServico, descricao, prioridade, endereco, bairro, numero, latitude, longitude, fotos, resetForm]);

  // ─── Step: Formulário ────────────────────────────────────────────────────
  if (step === 'formulario') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
        {isSubmitting && <LoadingOverlay />}
        <ScrollView flex={1} showsVerticalScrollIndicator={false}>
          <YStack flex={1} padding="$4" gap="$4">
            {/* Back button */}
            <Button
              size="$3"
              theme="gray"
              onPress={() => {
                setSelectedServico(null);
                setStep('servicos');
              }}
              accessibilityLabel="Voltar para serviços"
            >
              ← Voltar
            </Button>

            {/* Service display (read-only) */}
            {selectedServico && (
              <YStack
                backgroundColor="$blue2"
                borderRadius="$3"
                padding="$3"
                borderWidth={1}
                borderColor="$blue6"
              >
                <Text fontSize="$2" color="$blue9" fontWeight="500">
                  Serviço selecionado
                </Text>
                <Text fontSize="$4" fontWeight="600" color="$blue11" marginTop="$1">
                  {selectedServico.nome}
                </Text>
              </YStack>
            )}

            {/* Descrição (required) */}
            <YStack gap="$2">
              <Text fontSize="$3" fontWeight="500" color="$gray11">
                Descrição *
              </Text>
              <TextArea
                placeholder="Descreva o problema..."
                value={descricao}
                onChangeText={setDescricao}
                numberOfLines={4}
                minHeight={100}
                borderWidth={1}
                borderColor="$gray6"
                borderRadius="$3"
                padding="$3"
                fontSize="$3"
                accessibilityLabel="Descrição do problema"
              />
            </YStack>

            {/* Endereço fields (optional) */}
            <YStack gap="$2">
              <Text fontSize="$3" fontWeight="500" color="$gray11">
                Endereço (opcional)
              </Text>
              <Input
                placeholder="Rua / Avenida"
                value={endereco}
                onChangeText={setEndereco}
                borderWidth={1}
                borderColor="$gray6"
                borderRadius="$3"
                fontSize="$3"
                accessibilityLabel="Endereço"
              />
              <XStack gap="$2">
                <Input
                  flex={2}
                  placeholder="Bairro"
                  value={bairro}
                  onChangeText={setBairro}
                  borderWidth={1}
                  borderColor="$gray6"
                  borderRadius="$3"
                  fontSize="$3"
                  accessibilityLabel="Bairro"
                />
                <Input
                  flex={1}
                  placeholder="Nº"
                  value={numero}
                  onChangeText={setNumero}
                  borderWidth={1}
                  borderColor="$gray6"
                  borderRadius="$3"
                  fontSize="$3"
                  keyboardType="numeric"
                  accessibilityLabel="Número"
                />
              </XStack>
            </YStack>

            {/* Prioridade */}
            <PrioritySelector value={prioridade} onChange={setPrioridade} />

            {/* GPS Location */}
            <YStack gap="$2">
              <Text fontSize="$3" fontWeight="500" color="$gray11">
                Localização
              </Text>
              {gpsMessage && (
                <Text fontSize="$2" color="$orange10">
                  {gpsMessage}
                </Text>
              )}
              {latitude !== null && longitude !== null && (
                <YStack gap="$2">
                  <Text fontSize="$2" color="$gray9">
                    Lat: {formatCoordinateCitizen(latitude)}, Lng: {formatCoordinateCitizen(longitude)}
                  </Text>
                  <MapPreview latitude={latitude} longitude={longitude} height={160} />
                </YStack>
              )}
              {latitude === null && longitude === null && !gpsMessage && (
                <YStack
                  height={40}
                  justifyContent="center"
                  alignItems="center"
                >
                  <XStack gap="$2" alignItems="center">
                    <Spinner size="small" color="$blue10" />
                    <Text fontSize="$2" color="$gray9">
                      Obtendo localização...
                    </Text>
                  </XStack>
                </YStack>
              )}
            </YStack>

            {/* Photos */}
            <YStack gap="$2">
              <PhotoPicker
                photos={fotos}
                onAdd={handleAddPhoto}
                onRemove={handleRemovePhoto}
                maxPhotos={5}
              />
              {photoError && (
                <Text fontSize="$2" color="$red10">
                  {photoError}
                </Text>
              )}
            </YStack>

            {/* Form error */}
            {formError && (
              <ErrorMessage message={formError} />
            )}

            {/* Submit button */}
            <Button
              size="$4"
              theme="blue"
              onPress={handleSubmit}
              disabled={isSubmitting}
              accessibilityLabel="Enviar solicitação"
              marginTop="$2"
              marginBottom="$4"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Solicitação'}
            </Button>
          </YStack>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Step: Serviços ────────────────────────────────────────────────────────
  if (step === 'servicos') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
        <YStack flex={1} padding="$4" gap="$4">
          {/* Header com botão voltar */}
          <XStack alignItems="center" gap="$3">
            <Button
              size="$3"
              theme="gray"
              onPress={handleBackToSetores}
              accessibilityLabel="Voltar para setores"
            >
              ← Voltar
            </Button>
            <YStack flex={1}>
              <Text fontSize="$5" fontWeight="600" color="$gray12" numberOfLines={1}>
                {selectedSetor?.nome ?? 'Serviços'}
              </Text>
              <Text fontSize="$2" color="$gray8">
                Selecione um serviço
              </Text>
            </YStack>
          </XStack>

          {/* Loading */}
          {isLoading && (
            <YStack flex={1} justifyContent="center" alignItems="center">
              <Spinner size="large" color="$blue10" />
              <Text marginTop="$3" color="$gray10">
                Carregando serviços...
              </Text>
            </YStack>
          )}

          {/* Error */}
          {!isLoading && error && (
            <ErrorMessage message={error} onRetry={handleRetryServicos} />
          )}

          {/* Empty state */}
          {!isLoading && !error && servicos.length === 0 && (
            <YStack flex={1} justifyContent="center" alignItems="center" padding="$4">
              <Text fontSize="$5" color="$gray10" textAlign="center">
                Nenhum serviço disponível neste setor
              </Text>
            </YStack>
          )}

          {/* Lista de serviços */}
          {!isLoading && !error && servicos.length > 0 && (
            <ScrollView flex={1} showsVerticalScrollIndicator={false}>
              <YStack gap="$2">
                {servicos.map((servico) => (
                  <Pressable
                    key={servico.id_servico}
                    onPress={() => handleSelectServico(servico)}
                    accessibilityRole="button"
                    accessibilityLabel={`Selecionar serviço ${servico.nome}`}
                  >
                    <YStack
                      backgroundColor="$background"
                      borderWidth={1}
                      borderColor="$gray4"
                      borderRadius="$4"
                      padding="$4"
                      pressStyle={{ backgroundColor: '$blue2' }}
                    >
                      <Text fontSize="$4" fontWeight="600" color="$gray12">
                        {servico.nome}
                      </Text>
                      <Text fontSize="$3" color="$gray8" marginTop="$1">
                        {servico.nome_setor}
                      </Text>
                    </YStack>
                  </Pressable>
                ))}
              </YStack>
            </ScrollView>
          )}
        </YStack>
      </SafeAreaView>
    );
  }

  // ─── Step: Setores (default) ───────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <YStack flex={1} padding="$4" gap="$4">
        {/* Header */}
        <YStack gap="$1" paddingTop="$2">
          <Text fontSize="$6" fontWeight="700" color="$blue10">
            Nova Solicitação
          </Text>
          <Text fontSize="$3" color="$gray10">
            Selecione o setor responsável
          </Text>
        </YStack>

        {/* Loading */}
        {isLoading && (
          <YStack flex={1} justifyContent="center" alignItems="center">
            <Spinner size="large" color="$blue10" />
            <Text marginTop="$3" color="$gray10">
              Carregando setores...
            </Text>
          </YStack>
        )}

        {/* Error */}
        {!isLoading && error && (
          <ErrorMessage message={error} onRetry={handleRetrySetores} />
        )}

        {/* Empty state */}
        {!isLoading && !error && setores.length === 0 && (
          <YStack flex={1} justifyContent="center" alignItems="center" padding="$4">
            <Text fontSize="$5" color="$gray10" textAlign="center">
              Nenhum setor disponível no momento
            </Text>
          </YStack>
        )}

        {/* Lista de setores */}
        {!isLoading && !error && setores.length > 0 && (
          <ScrollView flex={1} showsVerticalScrollIndicator={false}>
            <YStack gap="$2">
              {setores.map((setor) => (
                <Pressable
                  key={setor.id_setor}
                  onPress={() => handleSelectSetor(setor)}
                  accessibilityRole="button"
                  accessibilityLabel={`Selecionar setor ${setor.nome}`}
                >
                  <YStack
                    backgroundColor="$background"
                    borderWidth={1}
                    borderColor="$gray4"
                    borderRadius="$4"
                    padding="$4"
                    pressStyle={{ backgroundColor: '$blue2' }}
                  >
                    <XStack justifyContent="space-between" alignItems="center">
                      <YStack flex={1}>
                        <Text fontSize="$4" fontWeight="600" color="$gray12">
                          {setor.nome}
                        </Text>
                        <Text fontSize="$3" color="$gray8" marginTop="$1">
                          {setor.sigla}
                        </Text>
                      </YStack>
                      <YStack
                        backgroundColor="$blue2"
                        borderRadius="$3"
                        paddingHorizontal="$3"
                        paddingVertical="$1"
                      >
                        <Text fontSize="$2" color="$blue10" fontWeight="500">
                          {setor.total_servicos}{' '}
                          {setor.total_servicos === 1 ? 'serviço' : 'serviços'}
                        </Text>
                      </YStack>
                    </XStack>
                  </YStack>
                </Pressable>
              ))}
            </YStack>
          </ScrollView>
        )}
      </YStack>
    </SafeAreaView>
  );
}
