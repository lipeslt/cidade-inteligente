import { useCatalogStore } from '../../src/stores/catalogStore';
import * as catalogService from '../../src/services/catalog';
import { AppError } from '../../src/utils/errors';
import type { Setor, Servico } from '../../src/types';

jest.mock('../../src/services/catalog');

const mockedListarSetores = catalogService.listarSetores as jest.MockedFunction<
  typeof catalogService.listarSetores
>;
const mockedListarServicos = catalogService.listarServicos as jest.MockedFunction<
  typeof catalogService.listarServicos
>;

beforeEach(() => {
  jest.clearAllMocks();
  // Reset store state between tests
  useCatalogStore.setState({
    setores: [],
    servicos: [],
    isLoading: false,
    error: null,
  });
});

describe('catalogStore.fetchSetores', () => {
  const mockSetores: Setor[] = [
    { id_setor: 1, nome: 'Infraestrutura', sigla: 'INFRA', total_servicos: 5 },
    { id_setor: 2, nome: 'Saúde', sigla: 'SAU', total_servicos: 3 },
  ];

  it('sets isLoading=true and error=null at start', async () => {
    mockedListarSetores.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockSetores), 50)),
    );

    const promise = useCatalogStore.getState().fetchSetores();

    expect(useCatalogStore.getState().isLoading).toBe(true);
    expect(useCatalogStore.getState().error).toBeNull();

    await promise;
  });

  it('sets setores and isLoading=false on success', async () => {
    mockedListarSetores.mockResolvedValueOnce(mockSetores);

    await useCatalogStore.getState().fetchSetores();

    const state = useCatalogStore.getState();
    expect(state.setores).toEqual(mockSetores);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('sets error message from AppError on failure', async () => {
    mockedListarSetores.mockRejectedValueOnce(
      new AppError('api', 'Sem conexão com a internet. Verifique sua rede e tente novamente'),
    );

    await useCatalogStore.getState().fetchSetores();

    const state = useCatalogStore.getState();
    expect(state.setores).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe('Sem conexão com a internet. Verifique sua rede e tente novamente');
  });

  it('uses fallback message for non-AppError exceptions', async () => {
    mockedListarSetores.mockRejectedValueOnce(new Error('Network Error'));

    await useCatalogStore.getState().fetchSetores();

    const state = useCatalogStore.getState();
    expect(state.error).toBe('Ocorreu um erro inesperado. Tente novamente');
    expect(state.isLoading).toBe(false);
  });
});

describe('catalogStore.fetchServicos', () => {
  const mockServicos: Servico[] = [
    { id_servico: 1, id_setor: 1, nome: 'Tapa-buraco', nome_setor: 'Infraestrutura' },
    { id_servico: 2, id_setor: 1, nome: 'Iluminação pública', nome_setor: 'Infraestrutura' },
  ];

  it('sets isLoading=true and error=null at start', async () => {
    mockedListarServicos.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockServicos), 50)),
    );

    const promise = useCatalogStore.getState().fetchServicos(1);

    expect(useCatalogStore.getState().isLoading).toBe(true);
    expect(useCatalogStore.getState().error).toBeNull();

    await promise;
  });

  it('passes idSetor to catalogService.listarServicos', async () => {
    mockedListarServicos.mockResolvedValueOnce(mockServicos);

    await useCatalogStore.getState().fetchServicos(1);

    expect(mockedListarServicos).toHaveBeenCalledWith(1);
  });

  it('calls listarServicos without idSetor when not provided', async () => {
    mockedListarServicos.mockResolvedValueOnce(mockServicos);

    await useCatalogStore.getState().fetchServicos();

    expect(mockedListarServicos).toHaveBeenCalledWith(undefined);
  });

  it('sets servicos and isLoading=false on success', async () => {
    mockedListarServicos.mockResolvedValueOnce(mockServicos);

    await useCatalogStore.getState().fetchServicos(1);

    const state = useCatalogStore.getState();
    expect(state.servicos).toEqual(mockServicos);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('sets error message from AppError on failure', async () => {
    mockedListarServicos.mockRejectedValueOnce(
      new AppError('timeout', 'O servidor não respondeu. Tente novamente em alguns instantes'),
    );

    await useCatalogStore.getState().fetchServicos(2);

    const state = useCatalogStore.getState();
    expect(state.servicos).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe('O servidor não respondeu. Tente novamente em alguns instantes');
  });

  it('uses fallback message for non-AppError exceptions', async () => {
    mockedListarServicos.mockRejectedValueOnce(new TypeError('unexpected'));

    await useCatalogStore.getState().fetchServicos();

    const state = useCatalogStore.getState();
    expect(state.error).toBe('Ocorreu um erro inesperado. Tente novamente');
    expect(state.isLoading).toBe(false);
  });
});
