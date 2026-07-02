import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Slot, useRouter, useSegments } from 'expo-router';
import { TamaguiProvider } from '@tamagui/core';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import config from '../tamagui.config';
import { useAuthStore } from '@/stores/authStore';
import { LoadingOverlay } from '@/components/LoadingOverlay';

/**
 * Root Layout com auth guard.
 *
 * Ao montar, verifica token armazenado via checkAuth().
 * Enquanto carrega, exibe splash/loading fullscreen.
 * Após resolução, redireciona conforme estado de autenticação:
 * - Autenticado em rota pública (login) → redireciona para (tabs)
 * - Não autenticado em rota protegida → redireciona para /login
 */
export default function RootLayout() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // Verifica token armazenado ao iniciar o app
  useEffect(() => {
    checkAuth();
  }, []);

  // Redireciona conforme estado de autenticação e rota atual
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(tabs)';

    if (!isAuthenticated && inAuthGroup) {
      // Não autenticado em rota protegida → redireciona para login
      router.replace('/login');
    } else if (isAuthenticated && !inAuthGroup) {
      // Autenticado em rota pública (login) → redireciona para tabs
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments]);

  // Exibe loading fullscreen enquanto verifica autenticação
  if (isLoading) {
    return (
      <SafeAreaProvider>
        <TamaguiProvider config={config} defaultTheme="light">
          <LoadingOverlay />
          <StatusBar style="auto" />
        </TamaguiProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <TamaguiProvider config={config} defaultTheme="light">
        <Slot />
        <StatusBar style="auto" />
      </TamaguiProvider>
    </SafeAreaProvider>
  );
}
