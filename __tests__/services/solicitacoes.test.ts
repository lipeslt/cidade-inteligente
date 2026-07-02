import { listar, detalhar, criar, alterarStatus } from '../../src/services/solicitacoes';
import { apiClient } from '../../src/services/api';

// Mock do apiClient
jest.mock('../../src/services/api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const mockedGet = apiClient.get as jest.MockedFunction<typeof apiClient.get>;
const mockedPost = apiClient.post as jest.MockedFunction<typeof apiClient.post>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('solicitacoes.listar', () => {
  it('sends GET /solicitacoes with params and 15s timeout', async () => {
    const mockResponse = {
      data: {
        ok: true,
        dados: [
          {
            id_solicitacao: 1,
            id_usuario: 17,
            id_servico: 1,
            descricao: 'Buraco na rua',
            status: 'aberto',
            status_nome: 'Aberta',
            nome_servico: 'Tapa-buraco',
            criado_em: '2026-05-08 10:00:00',
          },
        ],
        paginacao: { page: 1, per_page: 10, total: 1, total_pages: 1 },
      },
    };
    mockedGet.mockResolvedValueOnce(mockResponse as never);

    const result = await listar({ page: 1, per_page: 10, status: 'aberto' });

    expect(mockedGet).toHaveBeenCalledWith('/solicitacoes', {
      timeout: 15000,
      params: { page: 1, per_page: 10, status: 'aberto' },
    });
    expect(result.dados).toHaveLength(1);
    expect(result.paginacao.total_pages).toBe(1);
  });

  it('passes empty params when no filters provided', async () => {
    mockedGet.mockResolvedValueOnce({
      data: { ok: true, dados: [], paginacao: { page: 1, per_page: 10, total: 0, total_pages: 0 } },
    } as never);

    await listar({});

    expect(mockedGet).toHaveBeenCalledWith('/solicitacoes', {
      timeout: 15000,
      params: {},
    });
  });
});

describe('solicitacoes.detalhar', () => {
  it('sends GET /solicitacoes/{id} with 15s timeout and returns dados', async () => {
    const detalhe = {
      id_solicitacao: 75,
      id_usuario: 17,
      id_servico: 1,
      nome_servico: 'Tapa-buraco',
      id_setor: 1,
      descricao: 'Buraco grande',
      status: 'aberto',
      fotos: [],
      localizacao_tecnico: null,
    };
    mockedGet.mockResolvedValueOnce({ data: { ok: true, dados: detalhe } } as never);

    const result = await detalhar(75);

    expect(mockedGet).toHaveBeenCalledWith('/solicitacoes/75', { timeout: 15000 });
    expect(result).toEqual(detalhe);
  });
});

describe('solicitacoes.criar', () => {
  it('sends JSON POST with 30s timeout when no fotos', async () => {
    mockedPost.mockResolvedValueOnce({
      data: { ok: true, id_solicitacao: 75, fotos: [] },
    } as never);

    const result = await criar({ id_servico: 1, descricao: 'Teste' });

    expect(mockedPost).toHaveBeenCalledWith(
      '/solicitacoes',
      { id_servico: 1, descricao: 'Teste', prioridade: 'media' },
      { timeout: 30000 },
    );
    expect(result.id_solicitacao).toBe(75);
    expect(result.fotos).toEqual([]);
  });

  it('defaults prioridade to "media" when not provided', async () => {
    mockedPost.mockResolvedValueOnce({
      data: { ok: true, id_solicitacao: 1, fotos: [] },
    } as never);

    await criar({ id_servico: 2, descricao: 'Sem prioridade' });

    const sentPayload = mockedPost.mock.calls[0][1];
    expect(sentPayload).toHaveProperty('prioridade', 'media');
  });

  it('preserves explicit prioridade when provided', async () => {
    mockedPost.mockResolvedValueOnce({
      data: { ok: true, id_solicitacao: 1, fotos: [] },
    } as never);

    await criar({ id_servico: 2, descricao: 'Alta prioridade', prioridade: 'alta' });

    const sentPayload = mockedPost.mock.calls[0][1];
    expect(sentPayload).toHaveProperty('prioridade', 'alta');
  });

  it('sends multipart/form-data with 60s timeout when fotos present', async () => {
    mockedPost.mockResolvedValueOnce({
      data: {
        ok: true,
        id_solicitacao: 75,
        fotos: [{ id_foto: 101, caminho: 'a1b2c3.jpg', url: 'http://example.com/a1b2c3.jpg', tipo: 'problema', metadata: { original_name: 'foto1.jpg', size: 123456, mime: 'image/jpeg', upload_date: '2026-05-08 10:00:00', source: 'mobile_api' } }],
      },
    } as never);

    const fotos = [
      { uri: 'file:///foto1.jpg', name: 'foto1.jpg', type: 'image/jpeg', size: 100000 },
    ];

    const result = await criar(
      { id_servico: 1, descricao: 'Com foto', endereco: 'Rua A', bairro: 'Centro', numero: '123', latitude: '-12.5448', longitude: '-55.7275' },
      fotos,
    );

    expect(mockedPost).toHaveBeenCalledWith(
      '/solicitacoes',
      expect.any(FormData),
      { timeout: 60000, headers: { 'Content-Type': 'multipart/form-data' } },
    );
    expect(result.id_solicitacao).toBe(75);
    expect(result.fotos).toHaveLength(1);
  });

  it('sends multipart with empty fotos array treated as no fotos', async () => {
    mockedPost.mockResolvedValueOnce({
      data: { ok: true, id_solicitacao: 10, fotos: [] },
    } as never);

    await criar({ id_servico: 1, descricao: 'Sem foto, array vazio' }, []);

    // Should send as JSON (not FormData) because fotos is empty array
    expect(mockedPost).toHaveBeenCalledWith(
      '/solicitacoes',
      { id_servico: 1, descricao: 'Sem foto, array vazio', prioridade: 'media' },
      { timeout: 30000 },
    );
  });
});

describe('solicitacoes.alterarStatus', () => {
  it('sends POST /solicitacoes/{id}/status with 30s timeout', async () => {
    mockedPost.mockResolvedValueOnce({ data: { ok: true } } as never);

    await alterarStatus(75, { status: 'em_andamento', comentario: 'Iniciado' });

    expect(mockedPost).toHaveBeenCalledWith(
      '/solicitacoes/75/status',
      { status: 'em_andamento', comentario: 'Iniciado' },
      { timeout: 30000 },
    );
  });

  it('sends without comentario when not provided', async () => {
    mockedPost.mockResolvedValueOnce({ data: { ok: true } } as never);

    await alterarStatus(10, { status: 'resolvido' });

    expect(mockedPost).toHaveBeenCalledWith(
      '/solicitacoes/10/status',
      { status: 'resolvido' },
      { timeout: 30000 },
    );
  });
});
