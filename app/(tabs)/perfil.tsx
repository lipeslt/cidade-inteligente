import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
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
  }, [logout]);

  // Estado de carregamento
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1e40af" />
          <Text style={styles.loadingText}>Carregando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Estado de erro
  if (errorMessage) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ErrorMessage message={errorMessage} onRetry={fetchProfile} />
        </View>
      </SafeAreaView>
    );
  }

  // Perfil carregado
  if (!profile) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header com avatar e nome */}
        <View style={styles.headerSection}>
          {profile.imagem ? (
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: profile.imagem }}
                style={styles.avatarImage}
                accessibilityLabel={`Foto de ${profile.nome}`}
              />
            </View>
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitials}>
                {getInitials(profile.nome)}
              </Text>
            </View>
          )}
          <Text style={styles.profileName}>{profile.nome}</Text>
        </View>

        {/* Info section */}
        <View style={styles.infoCard}>
          {/* Email row */}
          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <Feather name="mail" size={18} color="#1e40af" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>E-mail</Text>
              <Text style={styles.infoValue}>{profile.email}</Text>
            </View>
          </View>

          {/* Separator */}
          <View style={styles.separator} />

          {/* Tipo row */}
          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <Feather name="shield" size={18} color="#1e40af" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Tipo de conta</Text>
              <Text style={styles.infoValue}>
                {TIPO_LABELS[profile.tipo] || profile.tipo}
              </Text>
            </View>
          </View>
        </View>

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Botão de logout */}
        <TouchableOpacity
          style={[styles.logoutButton, isLoggingOut && styles.logoutButtonDisabled]}
          onPress={handleLogout}
          disabled={isLoggingOut}
          activeOpacity={0.8}
          accessibilityLabel="Sair da conta"
          accessibilityRole="button"
        >
          {isLoggingOut ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Feather name="log-out" size={18} color="#ffffff" />
              <Text style={styles.logoutText}>Sair</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    backgroundColor: '#e2e8f0',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  avatarImage: {
    width: 100,
    height: 100,
  },
  avatarFallback: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1e40af',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  avatarInitials: {
    fontSize: 36,
    fontWeight: '700',
    color: '#ffffff',
  },
  profileName: {
    marginTop: 16,
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
  },
  infoCard: {
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1e293b',
  },
  separator: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 4,
  },
  spacer: {
    flex: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc2626',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  logoutButtonDisabled: {
    opacity: 0.6,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
});
