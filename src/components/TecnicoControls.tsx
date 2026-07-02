import { useState, useCallback } from 'react';
import { YStack, Text, Button, TextArea, Spinner } from 'tamagui';
import { useRouter } from 'expo-router';

import { StatusSelector } from './StatusSelector';
import { useAuthStore } from '@/stores/authStore';
import { alterarStatus } from '@/services/solicitacoes';
import {
  requestPermission,
  getCurrentPosition,
  registrarLocalizacaoTecnico,
} from '@/services/location';
import { validateComentario } from '@/utils/validation';
import { AppError } from '@/utils/errors';
import type { StatusSolicitacao } from '@/types';

interface TecnicoControlsProps {
  idSolicitacao: number;
  currentStatus: StatusSolicitacao;
  onStatusChanged: () => void;
}

/**
 * Controles exclusivos do técnico exibidos na tela de detalhe da solicitação.
 *
 * Inclui:
 * - Seletor de status com os 6 valores possíveis
 * - Campo de comentário opcional (max 500 chars)
 * - Botão para atualizar status
 * - Botão para compartilhar localização GPS
 *
 * Renderizado condicionalmente apenas quando user.tipo === 'tecnico'.
 */
export function TecnicoControls({
  idSolicitacao,
  currentStatus,
  onStatusChanged,
}: TecnicoControlsProps) {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  // Só renderiza para técnicos
  if (user?.tipo !== 'tecnico') {
    return null;
  }

  return (
    <TecnicoControlsInner
      idSolicitacao={idSolicitacao}
      currentStatus={currentStatus}
      onStatusChanged={onStatusChanged}
      router={router}
    />
  );
}

/**
 * Componente interno que contém toda a lógica dos controles do técnico.
 * Separado para que os hooks sejam chamados incondicionalmente.
 */
function TecnicoControlsInner({
  idSolicitacao,
  currentStatus,
  onStatusChanged,
  router,
}: TecnicoControlsProps & { router: ReturnType<typeof useRouter> }) {
  // --- Status Update State ---
  const [selectedStatus, setSelectedStatus] = useState<StatusSolicitacao>(currentStatus);
  const [comentario, setComentario] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  // --- Location State ---
  const [isShareingLocation, setIsSharingLocation] = useState(false);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // --- Status Update Handlers ---

  const handleComentarioChange = useCallback((text: string) => {
    // Limita a 500 caracteres no input
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
        comentario: comentario || undefined,
      });

      // Sucesso: mostrar confirmação por 3s e atualizar detalhe
      setStatusMessage('Status atualizado com sucesso!');
      onStatusChanged();

      setTimeout(() => {
        setStatusMessage(null);
      }, 3000);
    } catch (err) {
      if (err instanceof AppError) {
        if (err.message === 'Solicitação não encontrada') {
          setStatusError(err.message);
          // Navegar de volta após 3s
          setTimeout(() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/minhas-solicitacoes');
            }
          }, 3000);
          return;
        }

        // Erros mapeados: acesso_negado, status_invalido
        setStatusError(err.message);
      } else {
        setStatusError('Ocorreu um erro inesperado. Tente novamente');
      }
      // Preservar valores selecionados (selectedStatus e comentario permanecem no state)
    } finally {
      setIsSubmitting(false);
    }
  }, [idSolicitacao, selectedStatus, comentario, onStatusChanged, router]);

  // --- Location Handlers ---

  const handleShareLocation = useCallback(async () => {
    setIsSharingLocation(true);
    setLocationError(null);
    setLocationMessage(null);

    try {
      // Solicitar permissão GPS
      const granted = await requestPermission();
      if (!granted) {
        setLocationError('Acesso à localização é necessário');
        setIsSharingLocation(false);
        return;
      }

      // Capturar posição
      const coords = await getCurrentPosition();
      if (!coords) {
        setLocationError('Acesso à localização é necessário');
        setIsSharingLocation(false);
        return;
      }

      // Enviar localização
      await registrarLocalizacaoTecnico(idSolicitacao, coords);

      // Sucesso
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
    <YStack gap="$4" marginTop="$4" paddingTop="$4" borderTopWidth={1} borderTopColor="$gray5">
      {/* Título da seção */}
      <Text fontSize="$5" fontWeight="600" color="$gray12">
        Controles do Técnico
      </Text>

      {/* --- Seção: Atualizar Status --- */}
      <YStack gap="$3">
        <StatusSelector value={selectedStatus} onChange={setSelectedStatus} />

        {/* Campo de comentário opcional */}
        <YStack gap="$1">
          <Text fontSize="$3" fontWeight="500" color="$gray11">
            Comentário (opcional)
          </Text>
          <TextArea
            value={comentario}
            onChangeText={handleComentarioChange}
            placeholder="Adicione um comentário..."
            maxLength={500}
            numberOfLines={3}
            size="$4"
            borderColor="$gray6"
            accessibilityLabel="Campo de comentário"
            accessibilityHint="Máximo de 500 caracteres"
          />
          <Text fontSize="$2" color="$gray8" textAlign="right">
            {comentario.length}/500
          </Text>
        </YStack>

        {/* Mensagem de sucesso do status */}
        {statusMessage ? (
          <Text color="$green10" fontSize="$3" fontWeight="500">
            {statusMessage}
          </Text>
        ) : null}

        {/* Mensagem de erro do status */}
        {statusError ? (
          <Text color="$red10" fontSize="$3" fontWeight="500">
            {statusError}
          </Text>
        ) : null}

        {/* Botão Atualizar Status */}
        <Button
          size="$4"
          backgroundColor="$blue9"
          color="white"
          onPress={handleSubmitStatus}
          disabled={isSubmitting}
          opacity={isSubmitting ? 0.6 : 1}
          accessibilityLabel="Atualizar Status"
          accessibilityState={{ disabled: isSubmitting }}
        >
          {isSubmitting ? (
            <XStackLoading label="Atualizando..." />
          ) : (
            'Atualizar Status'
          )}
        </Button>
      </YStack>

      {/* --- Seção: Compartilhar Localização --- */}
      <YStack gap="$3" marginTop="$2">
        {/* Mensagem de sucesso da localização */}
        {locationMessage ? (
          <Text color="$green10" fontSize="$3" fontWeight="500">
            {locationMessage}
          </Text>
        ) : null}

        {/* Mensagem de erro da localização */}
        {locationError ? (
          <Text color="$red10" fontSize="$3" fontWeight="500">
            {locationError}
          </Text>
        ) : null}

        {/* Botão Compartilhar Localização */}
        <Button
          size="$4"
          backgroundColor="$green9"
          color="white"
          onPress={handleShareLocation}
          disabled={isShareingLocation}
          opacity={isShareingLocation ? 0.6 : 1}
          accessibilityLabel="Compartilhar Localização"
          accessibilityState={{ disabled: isShareingLocation }}
        >
          {isShareingLocation ? (
            <XStackLoading label="Obtendo localização..." />
          ) : (
            'Compartilhar Localização'
          )}
        </Button>
      </YStack>
    </YStack>
  );
}

/**
 * Helper: exibe spinner inline com label.
 */
function XStackLoading({ label }: { label: string }) {
  return (
    <YStack flexDirection="row" alignItems="center" gap="$2">
      <Spinner size="small" color="white" />
      <Text color="white" fontSize="$3">
        {label}
      </Text>
    </YStack>
  );
}
