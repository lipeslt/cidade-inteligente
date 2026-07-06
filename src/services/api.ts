import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

import { AppError, ERROR_MESSAGES, NETWORK_ERROR_MESSAGES } from '@/utils/errors';

/**
 * Instância Axios configurada para a API do Conecta Boa Esperança.
 *
 * - Request interceptor: injeta token JWT se válido (não expirado)
 * - Response interceptor: classifica erros em tipos (offline, timeout, auth, api, unexpected)
 */
const apiClient = axios.create({
  baseURL: 'https://cidadeinteligente.online/conecta_boaesperanca/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---------------------------------------------------------------------------
// Request Interceptor
// ---------------------------------------------------------------------------

apiClient.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('token');
    const expiresAt = await SecureStore.getItemAsync('expiresAt');

    if (token && expiresAt && Date.now() < parseInt(expiresAt, 10)) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('[API] Token not injected - token:', !!token, 'expiresAt:', expiresAt, 'now:', Date.now());
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// ---------------------------------------------------------------------------
// Response Interceptor
// ---------------------------------------------------------------------------

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Sem resposta do servidor (rede ou timeout)
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        throw new AppError('timeout', NETWORK_ERROR_MESSAGES.timeout);
      }
      throw new AppError('offline', NETWORK_ERROR_MESSAGES.offline);
    }

    const data = error.response.data;

    // Resposta estruturada da API ({ ok: false, erro: '...' })
    if (data?.ok === false && data?.erro) {
      const erro: string = data.erro;

      // Erros de autenticação → limpa sessão (o auth store captura o AppError type 'auth')
      if (erro === 'token_invalido' || erro === 'usuario_nao_encontrado') {
        try {
          await SecureStore.deleteItemAsync('token');
          await SecureStore.deleteItemAsync('expiresAt');
        } catch (e) {
          // Ignora erros de SecureStore
        }
        throw new AppError('auth', ERROR_MESSAGES[erro] || 'Sessão expirada');
      }

      // Outros erros mapeados da API
      throw new AppError('api', ERROR_MESSAGES[erro] || NETWORK_ERROR_MESSAGES.unexpected, data.detalhes);
    }

    // Resposta não estruturada (erro genérico HTTP sem formato esperado)
    const statusCode = error.response?.status || 'unknown';
    throw new AppError('unexpected', `${NETWORK_ERROR_MESSAGES.unexpected} (HTTP ${statusCode})`);
  },
);

export { apiClient };
export default apiClient;
