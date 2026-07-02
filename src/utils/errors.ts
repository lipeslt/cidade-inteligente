import type { ErrorType } from '@/types';

/**
 * Mapa de códigos de erro da API para mensagens em pt-BR exibidas ao usuário.
 */
export const ERROR_MESSAGES: Record<string, string> = {
  email_e_senha_obrigatorios: 'E-mail e senha são obrigatórios',
  email_ou_senha_invalidos: 'E-mail ou senha inválidos',
  email_nao_confirmado: 'E-mail não confirmado. Verifique sua caixa de entrada',
  token_invalido: 'Sessão expirada. Faça login novamente',
  usuario_nao_encontrado: 'Usuário não encontrado',
  id_servico_e_descricao_obrigatorios: 'Serviço e descrição são obrigatórios',
  prioridade_invalida: 'Prioridade selecionada é inválida',
  fotos_invalidas: 'Fotos inválidas',
  acesso_negado: 'Você não tem permissão para esta ação',
  status_invalido: 'Status selecionado é inválido',
  solicitacao_nao_encontrada: 'Solicitação não encontrada',
  apenas_tecnico: 'Apenas técnicos podem compartilhar localização',
  dados_obrigatorios: 'Dados de localização são obrigatórios',
  erro_ao_criar_solicitacao: 'Erro ao criar solicitação. Tente novamente',
};

/**
 * Mensagens para erros de rede (sem conexão, timeout, inesperado).
 */
export const NETWORK_ERROR_MESSAGES = {
  offline: 'Sem conexão com a internet. Verifique sua rede e tente novamente',
  timeout: 'O servidor não respondeu. Tente novamente em alguns instantes',
  unexpected: 'Ocorreu um erro inesperado. Tente novamente',
} as const;

/**
 * Erro customizado do aplicativo com tipo classificado e detalhes opcionais.
 */
export class AppError extends Error {
  public type: ErrorType;
  public details?: string[];

  constructor(type: ErrorType, message: string, details?: string[]) {
    super(message);
    this.type = type;
    this.details = details;
    this.name = 'AppError';
  }
}
