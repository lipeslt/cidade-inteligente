import { apiClient } from './api';
import type {
  AlterarStatusRequest,
  CriarSolicitacaoRequest,
  Foto,
  ImageFile,
  ListarSolicitacoesParams,
  PaginacaoResponse,
  Solicitacao,
  SolicitacaoDetalhe,
} from '@/types';

/**
 * Serviço de solicitações — criação, listagem, detalhamento e alteração de status.
 */

/**
 * Lista solicitações do usuário autenticado com paginação e filtros opcionais.
 * GET /solicitacoes — timeout 15s.
 */
export async function listar(
  params: ListarSolicitacoesParams,
): Promise<{ dados: Solicitacao[]; paginacao: PaginacaoResponse }> {
  const response = await apiClient.get<{
    ok: true;
    dados: Solicitacao[];
    paginacao: PaginacaoResponse;
  }>('/solicitacoes', {
    timeout: 15000,
    params,
  });
  return { dados: response.data.dados, paginacao: response.data.paginacao };
}

/**
 * Obtém os detalhes de uma solicitação específica.
 * GET /solicitacoes/{id} — timeout 15s.
 */
export async function detalhar(id: number): Promise<SolicitacaoDetalhe> {
  const response = await apiClient.get<{ ok: true; dados: SolicitacaoDetalhe }>(
    `/solicitacoes/${id}`,
    { timeout: 15000 },
  );
  return response.data.dados;
}

/**
 * Cria uma nova solicitação.
 *
 * - Sem fotos: envia JSON com timeout de 30s.
 * - Com fotos: envia multipart/form-data com timeout de 60s (upload de até 5 fotos × 2MB).
 * - Sempre atribui prioridade "media" quando não informada (Property 3).
 *
 * POST /solicitacoes
 */
export async function criar(
  data: CriarSolicitacaoRequest,
  fotos?: ImageFile[],
): Promise<{ id_solicitacao: number; fotos: Foto[] }> {
  // Garante prioridade default "media" (Property 3 - default prioridade assignment)
  const payload: CriarSolicitacaoRequest = {
    ...data,
    prioridade: data.prioridade ?? 'media',
  };

  if (!fotos || fotos.length === 0) {
    // Envio como JSON (sem fotos)
    const response = await apiClient.post<{ ok: true; id_solicitacao: number; fotos: Foto[] }>(
      '/solicitacoes',
      payload,
      { timeout: 30000 },
    );
    return { id_solicitacao: response.data.id_solicitacao, fotos: response.data.fotos };
  }

  // Envio como multipart/form-data (com fotos)
  const formData = new FormData();

  // Append campos de texto
  formData.append('id_servico', String(payload.id_servico));
  formData.append('descricao', payload.descricao);
  formData.append('prioridade', payload.prioridade!);

  if (payload.endereco) {
    formData.append('endereco', payload.endereco);
  }
  if (payload.bairro) {
    formData.append('bairro', payload.bairro);
  }
  if (payload.numero) {
    formData.append('numero', payload.numero);
  }
  if (payload.latitude) {
    formData.append('latitude', payload.latitude);
  }
  if (payload.longitude) {
    formData.append('longitude', payload.longitude);
  }

  // Append fotos como "fotos[]"
  for (const foto of fotos) {
    formData.append('fotos[]', {
      uri: foto.uri,
      name: foto.name,
      type: foto.type,
    } as unknown as Blob);
  }

  const response = await apiClient.post<{ ok: true; id_solicitacao: number; fotos: Foto[] }>(
    '/solicitacoes',
    formData,
    {
      timeout: 60000,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
  return { id_solicitacao: response.data.id_solicitacao, fotos: response.data.fotos };
}

/**
 * Altera o status de uma solicitação (uso exclusivo por técnicos/admin/setor).
 * POST /solicitacoes/{id}/status — timeout 30s.
 */
export async function alterarStatus(id: number, data: AlterarStatusRequest): Promise<void> {
  await apiClient.post('/solicitacoes/' + id + '/status', data, {
    timeout: 30000,
  });
}
