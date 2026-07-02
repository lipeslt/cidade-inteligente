import React from 'react';
import { truncateDescription, formatDateTime } from '../../src/utils/formatters';
import type { Solicitacao } from '../../src/types';

// Unit tests for SolicitacaoCard logic (rendering tested via formatters)
describe('SolicitacaoCard display logic', () => {
  const baseSolicitacao: Solicitacao = {
    id_solicitacao: 1,
    id_usuario: 10,
    id_servico: 5,
    descricao: 'Buraco na rua principal próximo ao número 200, causando risco para pedestres e veículos que passam pelo local diariamente',
    status: 'aberto',
    status_nome: 'Aberto',
    nome_servico: 'Tapa-buraco',
    criado_em: '2024-03-15 14:30:00',
  };

  it('deve truncar descrição com mais de 100 caracteres', () => {
    const result = truncateDescription(baseSolicitacao.descricao);
    expect(result.length).toBe(103); // 100 chars + "..."
    expect(result).toEndWith('...');
  });

  it('não deve truncar descrição com 100 ou menos caracteres', () => {
    const shortDesc = 'Descrição curta';
    const result = truncateDescription(shortDesc);
    expect(result).toBe(shortDesc);
  });

  it('deve formatar data criado_em como DD/MM/YYYY HH:mm', () => {
    const result = formatDateTime(baseSolicitacao.criado_em);
    expect(result).toBe('15/03/2024 14:30');
  });

  it('deve formatar data com mês e dia de um dígito', () => {
    const result = formatDateTime('2024-01-05 09:05:00');
    expect(result).toBe('05/01/2024 09:05');
  });
});

expect.extend({
  toEndWith(received: string, suffix: string) {
    const pass = received.endsWith(suffix);
    return {
      pass,
      message: () => `expected "${received}" to end with "${suffix}"`,
    };
  },
});

declare global {
  namespace jest {
    interface Matchers<R> {
      toEndWith(suffix: string): R;
    }
  }
}
