import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useAuthStore } from '@/stores/authStore';
import { shouldShowStatusControls } from '@/utils/roles';
import { alterarStatus } from '@/services/solicitacoes';
import {
  requestPermission,
  getCurrentPosition,
  registrarLocalizacaoTecnico,
} from '@/services/location';
import { validateComentario } from '@/utils/validation';
import { AppError } from '@/utils/errors';
import type { StatusSolicitacao } from '@/types';

// =============================================================================
// Tipos e Constantes
// =============================================================================

interface StatusControlsProps {
  idSolicitacao: number;
  currentStatus: StatusSolicitacao;
  onStatusChanged: () => void;
  showLocationButton: boolean;
}

const STATUS_OPTIONS: { value: StatusSolicitacao; label: string; color: string }[] = [
  { value: 'aberto', label: 'Aberto', color: '#3b82f6' },
  { value: 'em_analise', label: 'Em Análise', color: '#f97316' },
  { value: 'em_andamento', label: 'Em Andamento', color: '#eab308' },
  { value: 'resolvido', label: 'Resolvido', color: '#22c55e' },
  { value: 'fechado', label: 'Fechado', color: '#6b7280' },
  { value: 'cancelado', label: 'Cancelado', color: '#ef4444' },
];

// =============================================================================
// Componente Principal
// =============================================================================

/**
 * Controles unificados de status para admin e técnico.
 * Renderiza seletor de status, campo de comentário, botão de atualização
 * e opcionalmente botão de compartilhar localização.
 *
 * Usa APENAS React Native primitives — sem Tamagui, sem react-native-reanimated.
 */
export function StatusControls({
  idSolicitacao,
  currentStatus,
  onStatusChanged,
  showLocationButton,
}: StatusControlsProps) {
  const user = useAuthStore((state) => state.user);

  // Só renderiza para admin ou tecnico
  if (!user || !shouldShowStatusControls(user.tipo)) {
    return null;
  }

  return (
    <StatusControlsInner
      idSolicitacao={idSolicitacao}
      currentStatus={currentStatus}
      onStatusChanged={onStatusChanged}
      showLocationButton={showLocationButton}
    />
  );
}

// =============================================================================
// Componente Interno (hooks incondicionais)
// =============================================================================

function StatusControlsInner({
  idSolicitacao,
  currentStatus,
  onStatusChanged,
  showLocationButton,
}: StatusControlsProps) {
  const router = useRouter();

  // --- Status Update State ---
  const [selectedStatus, setSelectedStatus] = useState<StatusSolicitacao>(currentStatus);
  const [comentario, setComentario] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  // --- Location State ---
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // --- Handlers ---

  const handleComentarioChange = useCallback((text: string) => {
    if (text.length <= 500) {
      setComentario(text);
    }
  }, []);

  const handleSubmitStatus = useCallback(async () => {
    // Validar comentário se preenchido
    if (comentario.length > 0) {
      const validation = validateComentario(comentario);
      if (!validation.valid) {
        setStatusError(validation.error || 'Comentário inválido');
        return;
      }
    }

    setIsSubmitting(true);
    setStatusError(null);
    setStatusMessage(null);

    try {
      await alterarStatus(idSolicitacao, {
        status: selectedStatus,
        ...(comentario.trim() ? { comentario: comentario.trim() } : {}),
      });

      // Sucesso: mostrar confirmação por 3s e notificar pai
      setStatusMessage('Status atualizado com sucesso!');
      onStatusChanged();

      setTimeout(() => {
        setStatusMessage(null);
      }, 3000);
    } catch (err) {
      if (err instanceof AppError) {
        if (err.message === 'Solicitação não encontrada') {
          setStatusError(err.message);
          setTimeout(() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/minhas-solicitacoes');
            }
          }, 3000);
          return;
        }
        setStatusError(err.message);
      } else {
        // Mostrar erro completo para debug
        const errorMsg = err instanceof Error ? err.message : JSON.stringify(err);
        setStatusError(`Erro: ${errorMsg}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [idSolicitacao, selectedStatus, comentario, onStatusChanged, router]);

  const handleShareLocation = useCallback(async () => {
    setIsSharingLocation(true);
    setLocationError(null);
    setLocationMessage(null);

    try {
      const granted = await requestPermission();
      if (!granted) {
        setLocationError('Acesso à localização é necessário');
        setIsSharingLocation(false);
        return;
      }

      const coords = await getCurrentPosition();
      if (!coords) {
        setLocationError('Não foi possível obter a localização. Tente novamente');
        setIsSharingLocation(false);
        return;
      }

      await registrarLocalizacaoTecnico(idSolicitacao, coords);

      setLocationMessage('Localização compartilhada com sucesso!');
      setTimeout(() => {
        setLocationMessage(null);
      }, 3000);
    } catch (err) {
      if (err instanceof AppError) {
        setLocationError(err.message);
      } else {
        setLocationError('Não foi possível compartilhar a localização. Tente novamente');
      }
    } finally {
      setIsSharingLocation(false);
    }
  }, [idSolicitacao]);

  return (
    <View style={styles.container}>
      {/* Título da seção */}
      <Text style={styles.sectionTitle}>Controles de Status</Text>

      {/* Seletor de Status */}
      <View style={styles.statusGrid}>
        {STATUS_OPTIONS.map(({ value, label, color }) => {
          const isActive = selectedStatus === value;
          return (
            <TouchableOpacity
              key={value}
              style={[
                styles.statusButton,
                { borderColor: color },
                isActive && { backgroundColor: color },
              ]}
              onPress={() => setSelectedStatus(value)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Status: ${label}`}
              accessibilityState={{ selected: isActive }}
            >
              <Text
                style={[
                  styles.statusButtonText,
                  { color: isActive ? '#ffffff' : color },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Campo de Comentário */}
      <View style={styles.commentSection}>
        <Text style={styles.commentLabel}>Comentário (opcional)</Text>
        <TextInput
          style={styles.commentInput}
          value={comentario}
          onChangeText={handleComentarioChange}
          placeholder="Adicione um comentário..."
          placeholderTextColor="#94a3b8"
          maxLength={500}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          accessibilityLabel="Campo de comentário"
          accessibilityHint="Máximo de 500 caracteres"
        />
        <Text style={styles.charCounter}>{comentario.length}/500</Text>
      </View>

      {/* Mensagem de sucesso do status */}
      {statusMessage ? (
        <View style={styles.successBanner}>
          <Feather name="check-circle" size={16} color="#15803d" />
          <Text style={styles.successText}>{statusMessage}</Text>
        </View>
      ) : null}

      {/* Mensagem de erro do status */}
      {statusError ? (
        <View style={styles.errorBanner}>
          <Feather name="alert-circle" size={16} color="#dc2626" />
          <Text style={styles.errorText}>{statusError}</Text>
        </View>
      ) : null}

      {/* Botão Atualizar Status */}
      <TouchableOpacity
        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
        onPress={handleSubmitStatus}
        disabled={isSubmitting}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Atualizar Status"
        accessibilityState={{ disabled: isSubmitting }}
      >
        {isSubmitting ? (
          <View style={styles.buttonContent}>
            <ActivityIndicator size="small" color="#ffffff" />
            <Text style={styles.submitButtonText}>Atualizando...</Text>
          </View>
        ) : (
          <Text style={styles.submitButtonText}>Atualizar Status</Text>
        )}
      </TouchableOpacity>

      {/* Seção: Compartilhar Localização (condicional) */}
      {showLocationButton ? (
        <View style={styles.locationSection}>
          {/* Mensagem de sucesso da localização */}
          {locationMessage ? (
            <View style={styles.successBanner}>
              <Feather name="check-circle" size={16} color="#15803d" />
              <Text style={styles.successText}>{locationMessage}</Text>
            </View>
          ) : null}

          {/* Mensagem de erro da localização */}
          {locationError ? (
            <View style={styles.errorBanner}>
              <Feather name="alert-circle" size={16} color="#dc2626" />
              <Text style={styles.errorText}>{locationError}</Text>
            </View>
          ) : null}

          {/* Botão Compartilhar Localização */}
          <TouchableOpacity
            style={[
              styles.locationButton,
              isSharingLocation && styles.locationButtonDisabled,
            ]}
            onPress={handleShareLocation}
            disabled={isSharingLocation}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Compartilhar Localização"
            accessibilityState={{ disabled: isSharingLocation }}
          >
            {isSharingLocation ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text style={styles.locationButtonText}>Obtendo localização...</Text>
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <Feather name="map-pin" size={18} color="#ffffff" />
                <Text style={styles.locationButtonText}>Compartilhar Localização</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

// =============================================================================
// Estilos
// =============================================================================

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  statusButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    minWidth: '30%',
    alignItems: 'center',
  },
  statusButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  commentSection: {
    marginBottom: 12,
  },
  commentLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 6,
  },
  commentInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1e293b',
    minHeight: 80,
  },
  charCounter: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'right',
    marginTop: 4,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 10,
  },
  successText: {
    fontSize: 14,
    color: '#15803d',
    fontWeight: '500',
    flex: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '500',
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#1e40af',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  locationButton: {
    backgroundColor: '#166534',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationButtonDisabled: {
    opacity: 0.6,
  },
  locationButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});
