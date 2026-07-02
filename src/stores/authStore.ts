import { create } from 'zustand';

import * as authService from '@/services/auth';
import { AppError } from '@/utils/errors';
import type { Usuario } from '@/types';

/**
 * Estado e ações de autenticação do aplicativo.
 */
export interface AuthState {
  user: Usuario | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearSession: () => Promise<void>;
}

/**
 * Store Zustand para gerenciamento de autenticação.
 *
 * - login: autentica o usuário, armazena token e atualiza estado
 * - logout: remove token, limpa estado
 * - checkAuth: verifica token armazenado ao abrir o app
 * - clearSession: limpeza best-effort (chamada pelo interceptor em erros de auth)
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (email: string, senha: string) => {
    set({ isLoading: true });
    try {
      const response = await authService.login({ email, senha });
      await authService.storeToken(response.token, response.expires_in);
      set({
        user: response.usuario,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      if (error instanceof AppError) {
        throw error;
      }
      throw error;
    }
  },

  logout: async () => {
    try {
      await authService.clearToken();
    } catch {
      // best-effort: mesmo se falhar, limpa estado local
    }
    set({
      user: null,
      isAuthenticated: false,
    });
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const valid = await authService.isTokenValid();
      if (valid) {
        const user = await authService.getProfile();
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch {
      set({
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  clearSession: async () => {
    await authService.clearToken();
    set({
      user: null,
      isAuthenticated: false,
    });
  },
}));
