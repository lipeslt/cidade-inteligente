import { create } from 'zustand';
import { listarSetores, listarServicos } from '@/services/catalog';
import { AppError } from '@/utils/errors';
import type { Setor, Servico } from '@/types';

interface CatalogState {
  setores: Setor[];
  servicos: Servico[];
  isLoading: boolean;
  error: string | null;
  fetchSetores: () => Promise<void>;
  fetchServicos: (idSetor?: number) => Promise<void>;
}

export const useCatalogStore = create<CatalogState>((set) => ({
  setores: [],
  servicos: [],
  isLoading: false,
  error: null,

  fetchSetores: async () => {
    set({ isLoading: true, error: null });
    try {
      const setores = await listarSetores();
      set({ setores, isLoading: false });
    } catch (err) {
      const message =
        err instanceof AppError
          ? err.message
          : 'Ocorreu um erro inesperado. Tente novamente';
      set({ error: message, isLoading: false });
    }
  },

  fetchServicos: async (idSetor?: number) => {
    set({ isLoading: true, error: null });
    try {
      const servicos = await listarServicos(idSetor);
      set({ servicos, isLoading: false });
    } catch (err) {
      const message =
        err instanceof AppError
          ? err.message
          : 'Ocorreu um erro inesperado. Tente novamente';
      set({ error: message, isLoading: false });
    }
  },
}));
