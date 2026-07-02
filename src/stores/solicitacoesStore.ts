import { create } from 'zustand';

import * as solicitacoesService from '@/services/solicitacoes';
import type { ListarSolicitacoesParams, PaginacaoResponse, Solicitacao } from '@/types';
import { AppError } from '@/utils/errors';

interface SolicitacoesState {
  solicitacoes: Solicitacao[];
  paginacao: PaginacaoResponse | null;
  currentFilter: ListarSolicitacoesParams;
  isLoading: boolean;
  error: string | null;
  fetchSolicitacoes: (params?: ListarSolicitacoesParams) => Promise<void>;
  loadNextPage: () => Promise<void>;
  resetList: () => void;
  applyFilter: (filter: Partial<ListarSolicitacoesParams>) => Promise<void>;
}

const DEFAULT_FILTER: ListarSolicitacoesParams = {
  page: 1,
  per_page: 10,
};

export const useSolicitacoesStore = create<SolicitacoesState>((set, get) => ({
  solicitacoes: [],
  paginacao: null,
  currentFilter: { ...DEFAULT_FILTER },
  isLoading: false,
  error: null,

  /**
   * Busca solicitações usando os parâmetros fornecidos (ou currentFilter).
   * Substitui a lista existente com os novos resultados.
   */
  fetchSolicitacoes: async (params?: ListarSolicitacoesParams) => {
    const mergedParams = params ?? get().currentFilter;

    set({ isLoading: true, error: null, currentFilter: mergedParams });

    try {
      const { dados, paginacao } = await solicitacoesService.listar(mergedParams);
      set({ solicitacoes: dados, paginacao, isLoading: false });
    } catch (error) {
      const message =
        error instanceof AppError
          ? error.message
          : 'Ocorreu um erro inesperado. Tente novamente';
      set({ error: message, isLoading: false });
    }
  },

  /**
   * Carrega a próxima página e APPENDA resultados à lista existente.
   * Só dispara se page atual < total_pages (Property 9).
   */
  loadNextPage: async () => {
    const { paginacao, currentFilter, isLoading } = get();

    // Não carregar se já está carregando
    if (isLoading) return;

    // Property 9: só carrega próxima página se page < total_pages
    if (!paginacao || paginacao.page >= paginacao.total_pages) return;

    const nextPage = paginacao.page + 1;
    const nextParams: ListarSolicitacoesParams = { ...currentFilter, page: nextPage };

    set({ isLoading: true, error: null });

    try {
      const { dados, paginacao: novaPaginacao } = await solicitacoesService.listar(nextParams);
      set((state) => ({
        solicitacoes: [...state.solicitacoes, ...dados],
        paginacao: novaPaginacao,
        currentFilter: nextParams,
        isLoading: false,
      }));
    } catch (error) {
      const message =
        error instanceof AppError
          ? error.message
          : 'Ocorreu um erro inesperado. Tente novamente';
      set({ error: message, isLoading: false });
    }
  },

  /**
   * Reseta a lista para o estado inicial.
   */
  resetList: () => {
    set({
      solicitacoes: [],
      paginacao: null,
      currentFilter: { ...DEFAULT_FILTER },
      error: null,
    });
  },

  /**
   * Aplica um filtro parcial, reseta page para 1 (Property 10) e busca novos dados.
   * Substitui a lista (não appenda).
   */
  applyFilter: async (filter: Partial<ListarSolicitacoesParams>) => {
    const { currentFilter, fetchSolicitacoes } = get();

    // Property 10: ao mudar filtro, sempre reseta page para 1
    const newFilter: ListarSolicitacoesParams = {
      ...currentFilter,
      ...filter,
      page: 1,
    };

    await fetchSolicitacoes(newFilter);
  },
}));
