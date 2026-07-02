import { useEffect, useState, useCallback } from 'react';
import { Image } from 'react-native';
import { YStack, XStack, Text, Button, Spinner } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { useAuthStore } from '@/stores/authStore';
import * as authService from '@/services/auth';
import { ErrorMessage } from '@/components/ErrorMessage';
import { AppError } from '@/utils/errors';
import type { Usuario } from '@/types';

/**
 * Mapa de tipos de usuário para labels em pt-BR.
 */
const TIPO_LABELS: Record<string, string> = {
  admin: 'Administrador',
  setor: 'Setor',
  tecnico: 'Técnico',
  cidadao: 'Cidadão',
  entrevistador: 'Entrevistador',
};

/**
 * Extrai as iniciais do nome do usuário (até 2 caracteres).
 */
function getInitials(nome: string): string {
  const parts = nome.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Tela de Perfil do Conecta Boa Esperança.
 *
 * Carrega dados do usuário via GET /me ao montar.
 * Exibe nome, email, tipo e imagem (ou iniciais como avatar).
 * Permite logout com limpeza de sessão.
 */
export default function PerfilScreen() {
  const { user, logout, clearSession } = useAuthStore();

  const [profile, setProfile] = useState<Usuario | null>(user);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await authService.getProfile();
      setProfile(data);
    } catch (error) {
      if (error instanceof AppError && error.type === 'auth') {
        // token_invalido ou usuario_nao_encontrado → limpa sessão
        // O root layout vai redirecionar para login automaticamente
        await clearSession();
        return;
      }

      if (error instanceof AppError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Ocorreu um erro inesperado. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    await logout();
    // O root layout auth guard redireciona para /login automaticamente
  }, [logout]);

  // Estado de carregamento
  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
        <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$background">
          <Spinner size="large" color="$blue10" />
          <Text marginTop="$3" color="$gray10" fontSize="$4">
            Carregando perfil...
          </Text>
        </YStack>
      </SafeAreaView>
    );
  }

  // Estado de erro
  if (errorMessage) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
        <YStack flex={1} justifyContent="center" backgroundColor="$background" padding="$4">
          <ErrorMessage message={errorMessage} onRetry={fetchProfile} />
        </YStack>
      </SafeAreaView>
    );
  }

  // Perfil carregado
  if (!profile) {
    return null;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <YStack flex={1} backgroundColor="$background" padding="$5" justifyContent="space-between">
        {/* Conteúdo do perfil */}
        <YStack alignItems="center" gap="$5" paddingTop="$6">
          {/* Avatar */}
          {profile.imagem ? (
            <YStack
              width={100}
              height={100}
              borderRadius={50}
              overflow="hidden"
              backgroundColor="$gray4"
            >
              <Image
                source={{ uri: profile.imagem }}
                style={{ width: 100, height: 100 }}
                accessibilityLabel={`Foto de ${profile.nome}`}
              />
            </YStack>
          ) : (
            <YStack
              width={100}
              height={100}
              borderRadius={50}
              backgroundColor="$blue8"
              justifyContent="center"
              alignItems="center"
            >
              <Text fontSize={36} fontWeight="700" color="white">
                {getInitials(profile.nome)}
              </Text>
            </YStack>
          )}

          {/* Nome */}
          <Text fontSize="$7" fontWeight="700" color="$gray12" textAlign="center">
            {profile.nome}
          </Text>

          {/* Informações */}
          <YStack
            width="100%"
            gap="$4"
            backgroundColor="$gray2"
            borderRadius="$4"
            padding="$4"
          >
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize="$4" color="$gray10" fontWeight="500">
                E-mail
              </Text>
              <Text fontSize="$4" color="$gray12" flexShrink={1} textAlign="right">
                {profile.email}
              </Text>
            </XStack>

            <XStack
              borderTopWidth={1}
              borderTopColor="$gray4"
              paddingTop="$4"
              justifyContent="space-between"
              alignItems="center"
            >
              <Text fontSize="$4" color="$gray10" fontWeight="500">
                Tipo
              </Text>
              <Text fontSize="$4" color="$gray12">
                {TIPO_LABELS[profile.tipo] || profile.tipo}
              </Text>
            </XStack>
          </YStack>
        </YStack>

        {/* Botão de logout */}
        <YStack paddingBottom="$4">
          <Button
            onPress={handleLogout}
            disabled={isLoggingOut}
            backgroundColor="#dc2626"
            color="#ffffff"
            fontWeight="700"
            size="$5"
            borderRadius="$4"
            pressStyle={{ backgroundColor: '#b91c1c', scale: 0.98 }}
            disabledStyle={{ opacity: 0.6 }}
            accessibilityLabel="Sair da conta"
            icon={isLoggingOut ? undefined : <Feather name="log-out" size={18} color="#ffffff" />}
          >
            {isLoggingOut ? <Spinner color="#ffffff" /> : 'Sair'}
          </Button>
        </YStack>
      </YStack>
    </SafeAreaView>
  );
}
