import { apiClient } from './api';
import type { Setor, Servico } from '@/types';

/**
 * Serviço de catálogo — consulta setores e serviços disponíveis.
 */

/**
 * Lista todos os setores cadastrados.
 * GET /setores com timeout de 15s.
 */
export async function listarSetores(): Promise<Setor[]> {
  const response = await apiClient.get<{ ok: true; dados: Setor[] }>('/setores', {
    timeout: 15000,
  });
  return response.data.dados;
}

/**
 * Lista serviços disponíveis, opcionalmente filtrados por setor.
 * GET /servicos (todos) ou GET /servicos?id_setor={idSetor} (por setor).
 * Timeout de 15s.
 */
export async function listarServicos(idSetor?: number): Promise<Servico[]> {
  const params = idSetor !== undefined ? { id_setor: idSetor } : undefined;
  const response = await apiClient.get<{ ok: true; dados: Servico[] }>('/servicos', {
    timeout: 15000,
    params,
  });
  return response.data.dados;
}
