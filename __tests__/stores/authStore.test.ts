import { useAuthStore } from '@/stores/authStore';
import * as authService from '@/services/auth';
import { AppError } from '@/utils/errors';
import type { LoginResponse, Usuario } from '@/types';

// Mock do serviço de autenticação
jest.mock('@/services/auth');

const mockedAuthService = authService as jest.Mocked<typeof authService>;

const mockUsuario: Usuario = {
  id: 1,
  nome: 'João Silva',
  email: 'joao@example.com',
  tipo: 'cidadao',
  id_setor: null,
  imagem: null,
};

const mockLoginResponse: LoginResponse = {
  ok: true,
  token: 'jwt-token-123',
  expires_in: 604800,
  usuario: mockUsuario,
};

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset store state between tests
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    jest.clearAllMocks();
  });

  describe('estado inicial', () => {
    it('deve ter user null, isAuthenticated false e isLoading false', () => {
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('login', () => {
    it('deve autenticar com sucesso, armazenar token e atualizar estado', async () => {
      mockedAuthService.login.mockResolvedValue(mockLoginResponse);
      mockedAuthService.storeToken.mockResolvedValue(undefined);

      await useAuthStore.getState().login('joao@example.com', 'senha123');

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUsuario);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);

      expect(mockedAuthService.login).toHaveBeenCalledWith({
        email: 'joao@example.com',
        senha: 'senha123',
      });
      expect(mockedAuthService.storeToken).toHaveBeenCalledWith(
        'jwt-token-123',
        604800
      );
    });

    it('deve setar isLoading true durante a requisição', async () => {
      let loadingDuringRequest = false;
      mockedAuthService.login.mockImplementation(async () => {
        loadingDuringRequest = useAuthStore.getState().isLoading;
        return mockLoginResponse;
      });
      mockedAuthService.storeToken.mockResolvedValue(undefined);

      await useAuthStore.getState().login('joao@example.com', 'senha123');

      expect(loadingDuringRequest).toBe(true);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('deve re-lançar AppError em caso de falha e resetar isLoading', async () => {
      const appError = new AppError('api', 'E-mail ou senha inválidos');
      mockedAuthService.login.mockRejectedValue(appError);

      await expect(
        useAuthStore.getState().login('joao@example.com', 'senha-errada')
      ).rejects.toThrow(appError);

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });

    it('deve re-lançar erros genéricos e resetar isLoading', async () => {
      const genericError = new Error('Network Error');
      mockedAuthService.login.mockRejectedValue(genericError);

      await expect(
        useAuthStore.getState().login('joao@example.com', 'senha123')
      ).rejects.toThrow(genericError);

      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('logout', () => {
    it('deve limpar token, resetar user e isAuthenticated', async () => {
      // Simula estado autenticado
      useAuthStore.setState({
        user: mockUsuario,
        isAuthenticated: true,
      });
      mockedAuthService.clearToken.mockResolvedValue(undefined);

      await useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(mockedAuthService.clearToken).toHaveBeenCalled();
    });

    it('deve limpar estado mesmo se clearToken falhar', async () => {
      useAuthStore.setState({
        user: mockUsuario,
        isAuthenticated: true,
      });
      mockedAuthService.clearToken.mockRejectedValue(
        new Error('SecureStore error')
      );

      await useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('checkAuth', () => {
    it('deve autenticar se token válido e obter perfil', async () => {
      mockedAuthService.isTokenValid.mockResolvedValue(true);
      mockedAuthService.getProfile.mockResolvedValue(mockUsuario);

      await useAuthStore.getState().checkAuth();

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUsuario);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('deve setar isAuthenticated false se token inválido', async () => {
      mockedAuthService.isTokenValid.mockResolvedValue(false);

      await useAuthStore.getState().checkAuth();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });

    it('deve setar isAuthenticated false se getProfile falhar', async () => {
      mockedAuthService.isTokenValid.mockResolvedValue(true);
      mockedAuthService.getProfile.mockRejectedValue(
        new Error('Network Error')
      );

      await useAuthStore.getState().checkAuth();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });

    it('deve setar isLoading true durante verificação', async () => {
      let loadingDuringCheck = false;
      mockedAuthService.isTokenValid.mockImplementation(async () => {
        loadingDuringCheck = useAuthStore.getState().isLoading;
        return false;
      });

      await useAuthStore.getState().checkAuth();

      expect(loadingDuringCheck).toBe(true);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('clearSession', () => {
    it('deve limpar token e resetar estado (best-effort, sem try/catch)', async () => {
      useAuthStore.setState({
        user: mockUsuario,
        isAuthenticated: true,
      });
      mockedAuthService.clearToken.mockResolvedValue(undefined);

      await useAuthStore.getState().clearSession();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(mockedAuthService.clearToken).toHaveBeenCalled();
    });

    it('deve propagar erro se clearToken falhar (diferente do logout)', async () => {
      useAuthStore.setState({
        user: mockUsuario,
        isAuthenticated: true,
      });
      const error = new Error('SecureStore error');
      mockedAuthService.clearToken.mockRejectedValue(error);

      await expect(useAuthStore.getState().clearSession()).rejects.toThrow(
        'SecureStore error'
      );
    });
  });
});
