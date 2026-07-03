import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Slot, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { TamaguiProvider } from '@tamagui/core';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import config from '../tamagui.config';
import { useAuthStore } from '@/stores/authStore';
import { LoadingOverlay } from '@/components/LoadingOverlay';

/**
 * Root Layout com auth guard.
 */
export default function RootLayout() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  // Verifica token armazenado ao iniciar o app
  useEffect(() => {
    checkAuth();
  }, []);

  // Redireciona conforme estado de autenticação e rota atual
  useEffect(() => {
    if (isLoading) return;
    // Espera a navegação estar pronta antes de redirecionar
    if (!navigationState?.key) return;

    const inAuthGroup = segments[0] === '(tabs)';

    if (!isAuthenticated && inAuthGroup) {
      router.replace('/login');
    } else if (isAuthenticated && !inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments, navigationState?.key]);

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
