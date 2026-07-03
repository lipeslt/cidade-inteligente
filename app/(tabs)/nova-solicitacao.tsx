import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Alert, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { YStack, XStack, Text, Input, TextArea, Button, ScrollView, Spinner } from 'tamagui';

import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';

import { useCatalogStore } from '@/stores/catalogStore';
import { ErrorMessage, PrioritySelector, PhotoPicker, MapPreview } from '@/components';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { requestPermission, getCurrentPosition } from '@/services/location';
import { criar } from '@/services/solicitacoes';
import { validateSolicitacaoForm, validatePhoto } from '@/utils/validation';
import { formatCoordinateCitizen } from '@/utils/formatters';
import type { Setor, Servico, Prioridade, ImageFile, CriarSolicitacaoRequest } from '@/types';

type Step = 'setores' | 'servicos' | 'formulario';

// ─── Icon helpers ────────────────────────────────────────────────────────────

interface IconStyle {
  name: string;
  bg: string;
  color: string;
}

/** Mapeia nome do serviço para ícone Feather + cores personalizadas */
function getServiceIcon(name: string): IconStyle {
  const lower = name.toLowerCase();
  if (lower.includes('lixo') || lower.includes('coleta')) return { name: 'trash-2', bg: '#dcfce7', color: '#166534' };
  if (lower.includes('iluminação') || lower.includes('iluminacao') || lower.includes('luz')) return { name: 'zap', bg: '#fef9c3', color: '#854d0e' };
  if (lower.includes('buraco') || lower.includes('via') || lower.includes('asfalto')) return { name: 'alert-triangle', bg: '#fee2e2', color: '#991b1b' };
  if (lower.includes('poda') || lower.includes('árvore') || lower.includes('arvore')) return { name: 'scissors', bg: '#d1fae5', color: '#065f46' };
  if (lower.includes('cão') || lower.includes('cao') || lower.includes('gato') || lower.includes('animal')) return { name: 'heart', bg: '#fce7f3', color: '#9d174d' };
  if (lower.includes('transporte') || lower.includes('trânsito') || lower.includes('transito')) return { name: 'truck', bg: '#e0e7ff', color: '#3730a3' };
  if (lower.includes('obra')) return { name: 'package', bg: '#ffedd5', color: '#9a3412' };
  if (lower.includes('saúde') || lower.includes('saude')) return { name: 'activity', bg: '#fce4ec', color: '#b71c1c' };
  if (lower.includes('governo')) return { name: 'briefcase', bg: '#e8eaf6', color: '#283593' };
  if (lower.includes('meio ambient') || lower.includes('ambiente')) return { name: 'cloud', bg: '#e8f5e9', color: '#2e7d32' };
  if (lower.includes('segurança') || lower.includes('seguranca')) return { name: 'shield', bg: '#e3f2fd', color: '#1565c0' };
  if (lower.includes('infraestrutura')) return { name: 'settings', bg: '#f3e5f5', color: '#6a1b9a' };
  if (lower.includes('agricultura')) return { name: 'sun', bg: '#fff8e1', color: '#f57f17' };
  if (lower.includes('água') || lower.includes('agua') || lower.includes('esgoto')) return { name: 'droplet', bg: '#e0f7fa', color: '#00695c' };
  if (lower.includes('educação') || lower.includes('educacao') || lower.includes('escola')) return { name: 'book-open', bg: '#ede7f6', color: '#4527a0' };
  return { name: 'tool', bg: '#f1f5f9', color: '#475569' };
}

/** Mapeia nome do setor para ícone Feather + cores personalizadas */
function getSetorIcon(name: string): IconStyle {
  const lower = name.toLowerCase();
  if (lower.includes('infraestrutura')) return { name: 'settings', bg: '#f3e5f5', color: '#6a1b9a' };
  if (lower.includes('saúde') || lower.includes('saude')) return { name: 'activity', bg: '#fce4ec', color: '#b71c1c' };
  if (lower.includes('educação') || lower.includes('educacao')) return { name: 'book-open', bg: '#ede7f6', color: '#4527a0' };
  if (lower.includes('meio ambient') || lower.includes('ambiente')) return { name: 'cloud', bg: '#e8f5e9', color: '#2e7d32' };
  if (lower.includes('segurança') || lower.includes('seguranca')) return { name: 'shield', bg: '#e3f2fd', color: '#1565c0' };
  if (lower.includes('transporte') || lower.includes('trânsito') || lower.includes('transito')) return { name: 'truck', bg: '#e0e7ff', color: '#3730a3' };
  if (lower.includes('agricultura')) return { name: 'sun', bg: '#fff8e1', color: '#f57f17' };
  if (lower.includes('obra')) return { name: 'package', bg: '#ffedd5', color: '#9a3412' };
  if (lower.includes('governo') || lower.includes('administra')) return { name: 'briefcase', bg: '#e8eaf6', color: '#283593' };
  if (lower.includes('social') || lower.includes('assistência') || lower.includes('assistencia')) return { name: 'users', bg: '#fce7f3', color: '#9d174d' };
  if (lower.includes('cultura') || lower.includes('esporte') || lower.includes('lazer')) return { name: 'music', bg: '#fff3e0', color: '#e65100' };
  if (lower.includes('água') || lower.includes('agua') || lower.includes('saneamento')) return { name: 'droplet', bg: '#e0f7fa', color: '#00695c' };
  if (lower.includes('limpeza') || lower.includes('lixo') || lower.includes('coleta')) return { name: 'trash-2', bg: '#dcfce7', color: '#166534' };
  if (lower.includes('iluminação') || lower.includes('iluminacao') || lower.includes('energia')) return { name: 'zap', bg: '#fef9c3', color: '#854d0e' };
  return { name: 'briefcase', bg: '#dbeafe', color: '#1e40af' };
}

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
        <ScrollView f={1} showsVerticalScrollIndicator={false}>
          <YStack f={1} p="$4" gap="$4">
            {/* Back button */}
            <TouchableOpacity
              onPress={() => {
                setSelectedServico(null);
                setStep('servicos');
              }}
              accessibilityLabel="Voltar para serviços"
              accessibilityRole="button"
              activeOpacity={0.7}
            >
              <XStack ai="center" gap="$2">
                <Feather name="arrow-left" size={20} color="#1e293b" />
                <Text fontSize="$3" color="#1e293b" fontWeight="500">Voltar</Text>
              </XStack>
            </TouchableOpacity>

            {/* Service display (read-only) */}
            {selectedServico && (
              <YStack
                bg="$blue2"
                br="$3"
                p="$3"
                bw={1}
                borderColor="$blue6"
              >
                <Text fontSize="$2" color="$blue9" fontWeight="500">
                  Serviço selecionado
                </Text>
                <Text fontSize="$4" fontWeight="600" color="$blue11" mt="$1">
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
                minh={100}
                bw={1}
                borderColor="$gray6"
                br="$3"
                p="$3"
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
                bw={1}
                borderColor="$gray6"
                br="$3"
                fontSize="$3"
                accessibilityLabel="Endereço"
              />
              <XStack gap="$2">
                <Input
                  f={2}
                  placeholder="Bairro"
                  value={bairro}
                  onChangeText={setBairro}
                  bw={1}
                  borderColor="$gray6"
                  br="$3"
                  fontSize="$3"
                  accessibilityLabel="Bairro"
                />
                <Input
                  f={1}
                  placeholder="Nº"
                  value={numero}
                  onChangeText={setNumero}
                  bw={1}
                  borderColor="$gray6"
                  br="$3"
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
                  h={40}
                  jc="center"
                  ai="center"
                >
                  <XStack gap="$2" ai="center">
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
              size="$5"
              bg="#1e40af"
              color="#ffffff"
              fontWeight="700"
              br="$4"
              onPress={handleSubmit}
              disabled={isSubmitting}
              pressStyle={{ bg: '#1d4ed8', scale: 0.98 }}
              disabledStyle={{ o: 0.6 }}
              accessibilityLabel="Enviar solicitação"
              mt="$2"
              mb="$4"
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
        <YStack f={1} p="$4" gap="$4">
          {/* Header com botão voltar */}
          <XStack ai="center" gap="$3">
            <TouchableOpacity
              onPress={handleBackToSetores}
              accessibilityLabel="Voltar para setores"
              accessibilityRole="button"
              activeOpacity={0.7}
              style={{ padding: 4 }}
            >
              <Feather name="arrow-left" size={24} color="#1e293b" />
            </TouchableOpacity>
            <YStack f={1}>
              <Text fontSize={20} fontWeight="700" color="#1e293b" numberOfLines={2}>
                {selectedSetor?.nome ?? 'Serviços'}
              </Text>
              <Text fontSize="$2" color="#64748b">
                Selecione um serviço
              </Text>
            </YStack>
          </XStack>

          {/* Loading */}
          {isLoading && (
            <YStack f={1} jc="center" ai="center" gap="$4">
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' }}>
                <Spinner size="large" color="#1e40af" />
              </View>
              <Text color="#64748b" fontSize="$4" fontWeight="500">
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
            <YStack f={1} jc="center" ai="center" p="$4">
              <Feather name="inbox" size={48} color="#94a3b8" />
              <Text fontSize="$4" color="#64748b" ta="center" mt="$3">
                Nenhum serviço disponível neste setor
              </Text>
            </YStack>
          )}

          {/* Lista de serviços */}
          {!isLoading && !error && servicos.length > 0 && (
            <ScrollView f={1} showsVerticalScrollIndicator={false}>
              <YStack gap="$3">
                {servicos.map((servico) => {
                  const icon = getServiceIcon(servico.nome);
                  return (
                    <TouchableOpacity
                      key={servico.id_servico}
                      onPress={() => handleSelectServico(servico)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`Selecionar serviço ${servico.nome}`}
                    >
                      <XStack
                        bg="#ffffff"
                        bw={1}
                        borderColor="#e2e8f0"
                        br="$4"
                        p="$4"
                        ai="center"
                        gap="$3"
                        elevation={1}
                      >
                        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: icon.bg, alignItems: 'center', justifyContent: 'center' }}>
                          <Feather name={icon.name as any} size={18} color={icon.color} />
                        </View>
                        <YStack f={1}>
                          <Text fontSize="$4" fontWeight="600" color="#1e293b">
                            {servico.nome}
                          </Text>
                          <Text fontSize="$2" color="#94a3b8" mt={2}>
                            {servico.nome_setor}
                          </Text>
                        </YStack>
                        <View style={{ alignSelf: 'center' }}><Feather name="chevron-right" size={18} color="#94a3b8" /></View>
                      </XStack>
                    </TouchableOpacity>
                  );
                })}
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
      <YStack f={1} p="$4" gap="$4">
        {/* Header */}
        <YStack gap="$1" pt="$2">
          <Text fontSize={24} fontWeight="800" color="#1e293b">
            Nova Solicitação
          </Text>
          <Text fontSize="$3" color="#64748b">
            Selecione o setor responsável
          </Text>
        </YStack>

        {/* Loading */}
        {isLoading && (
          <YStack f={1} jc="center" ai="center" gap="$4">
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' }}>
              <Spinner size="large" color="#1e40af" />
            </View>
            <Text color="#64748b" fontSize="$4" fontWeight="500">
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
          <YStack f={1} jc="center" ai="center" p="$4">
            <Feather name="inbox" size={48} color="#94a3b8" />
            <Text fontSize="$4" color="#64748b" ta="center" mt="$3">
              Nenhum setor disponível no momento
            </Text>
          </YStack>
        )}

        {/* Lista de setores */}
        {!isLoading && !error && setores.length > 0 && (
          <ScrollView f={1} showsVerticalScrollIndicator={false}>
            <YStack gap="$3">
              {setores.map((setor) => {
                const icon = getSetorIcon(setor.nome);
                return (
                  <TouchableOpacity
                    key={setor.id_setor}
                    onPress={() => handleSelectSetor(setor)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`Selecionar setor ${setor.nome}`}
                  >
                    <XStack
                      bg="#ffffff"
                      bw={1}
                      borderColor="#e2e8f0"
                      br="$4"
                      p="$4"
                      ai="center"
                      gap="$3"
                      elevation={1}
                    >
                      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: icon.bg, alignItems: 'center', justifyContent: 'center' }}>
                        <Feather name={icon.name as any} size={20} color={icon.color} />
                      </View>
                      <YStack f={1} flexShrink={1}>
                        <Text fontSize="$4" fontWeight="600" color="#1e293b" numberOfLines={2}>
                          {setor.nome}
                        </Text>
                        <Text fontSize="$2" color="#94a3b8" mt={2}>
                          {setor.sigla}
                        </Text>
                      </YStack>
                      <XStack ai="center" gap="$1" flexShrink={0}>
                        <Text fontSize="$2" color="#1e40af" fontWeight="500">
                          {setor.total_servicos}{' '}
                          {setor.total_servicos === 1 ? 'serviço' : 'serviços'}
                        </Text>
                        <View style={{ alignSelf: 'center' }}><Feather name="chevron-right" size={18} color="#94a3b8" /></View>
                      </XStack>
                    </XStack>
                  </TouchableOpacity>
                );
              })}
            </YStack>
          </ScrollView>
        )}
      </YStack>
    </SafeAreaView>
  );
}
