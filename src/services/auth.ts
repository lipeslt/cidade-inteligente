import * as SecureStore from 'expo-secure-store';

import { apiClient } from './api';
import type { LoginRequest, LoginResponse, Usuario } from '@/types';

/**
 * Serviço de autenticação do Conecta Boa Esperança.
 *
 * Responsável por login, perfil, e gerenciamento seguro do token JWT.
 */

/**
 * Realiza login com email e senha.
 * POST /login — timeout 15s.
 */
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/login', credentials, {
    timeout: 15000,
  });
  return response.data;
}

/**
 * Obtém o perfil do usuário autenticado.
 * GET /me — timeout 10s.
 */
export async function getProfile(): Promise<Usuario> {
  const response = await apiClient.get<{ ok: true; usuario: Usuario }>('/me', {
    timeout: 10000,
  });
  return response.data.usuario;
}

/**
 * Armazena o token JWT e o timestamp de expiração no SecureStore.
 *
 * @param token - Token JWT retornado pelo login
 * @param expiresIn - Tempo de validade em segundos (ex: 604800 para 7 dias)
 */
export async function storeToken(token: string, expiresIn: number): Promise<void> {
  const expiresAt = (Date.now() + expiresIn * 1000).toString();
  await SecureStore.setItemAsync('token', token);
  await SecureStore.setItemAsync('expiresAt', expiresAt);
}

/**
 * Remove token e expiresAt do SecureStore (logout / sessão expirada).
 */
export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync('token');
  await SecureStore.deleteItemAsync('expiresAt');
}

/**
 * Recupera o token armazenado se ainda não estiver expirado.
 * Retorna null se o token não existir ou se já tiver expirado.
 */
export async function getStoredToken(): Promise<string | null> {
  const token = await SecureStore.getItemAsync('token');
  const expiresAt = await SecureStore.getItemAsync('expiresAt');

  if (!token || !expiresAt) {
    return null;
  }

  if (Date.now() >= parseInt(expiresAt, 10)) {
    return null;
  }

  return token;
}

/**
 * Verifica se existe um token válido (presente e não expirado) no SecureStore.
 */
export async function isTokenValid(): Promise<boolean> {
  const token = await getStoredToken();
  return token !== null;
}
