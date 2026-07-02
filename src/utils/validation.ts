import type { Prioridade } from '@/types';

// =============================================================================
// Constantes de Validação
// =============================================================================

export const MAX_PHOTO_SIZE = 2097152; // 2MB em bytes
export const MAX_PHOTOS = 5;
export const MAX_COMENTARIO_LENGTH = 500;
export const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
export const VALID_PRIORIDADES: Prioridade[] = ['baixa', 'media', 'alta', 'critica'];

// =============================================================================
// Funções de Validação
// =============================================================================

/**
 * Valida o formulário de login (email e senha obrigatórios, formato email básico).
 */
export function validateLoginForm(
  email: string,
  senha: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!email || email.trim().length === 0) {
    errors.push('E-mail é obrigatório');
  } else if (!isValidEmail(email.trim())) {
    errors.push('Formato de e-mail inválido');
  }

  if (!senha || senha.trim().length === 0) {
    errors.push('Senha é obrigatória');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Valida o formulário de criação de solicitação.
 * Verifica id_servico > 0 e descricao não vazia/whitespace.
 */
export function validateSolicitacaoForm(data: {
  id_servico?: number;
  descricao?: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.id_servico || data.id_servico <= 0) {
    errors.push('Selecione um serviço');
  }

  if (!data.descricao || data.descricao.trim().length === 0) {
    errors.push('Descrição é obrigatória');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Valida se o valor de prioridade é um dos permitidos.
 * Aceita apenas: "baixa", "media", "alta", "critica".
 */
export function validatePrioridade(value: string): boolean {
  return VALID_PRIORIDADES.includes(value as Prioridade);
}

/**
 * Valida uma foto individual.
 * Verifica tamanho ≤ 2MB e extensão permitida.
 */
export function validatePhoto(file: {
  size: number;
  name: string;
}): { valid: boolean; error?: string } {
  if (file.size > MAX_PHOTO_SIZE) {
    return { valid: false, error: 'Foto excede o tamanho máximo de 2 MB' };
  }

  const extension = getFileExtension(file.name);
  if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: `Formato não suportado: ${extension || 'desconhecido'}`,
    };
  }

  return { valid: true };
}

/**
 * Valida um conjunto de fotos.
 * Verifica count ≤ 5 e valida cada foto individualmente.
 */
export function validatePhotoSet(
  files: { size: number; name: string }[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (files.length > MAX_PHOTOS) {
    errors.push('Máximo de 5 fotos permitido');
  }

  for (const file of files) {
    const result = validatePhoto(file);
    if (!result.valid && result.error) {
      errors.push(result.error);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Valida o comprimento de um comentário.
 * Aceita até 500 caracteres.
 */
export function validateComentario(text: string): { valid: boolean; error?: string } {
  if (text.length > MAX_COMENTARIO_LENGTH) {
    return { valid: false, error: 'Comentário excede 500 caracteres' };
  }

  return { valid: true };
}

// =============================================================================
// Funções Auxiliares (privadas)
// =============================================================================

/**
 * Validação básica de formato de email.
 */
function isValidEmail(email: string): boolean {
  // Regex simples: algo@algo.algo
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Extrai a extensão do arquivo (lowercase) a partir do nome.
 */
function getFileExtension(filename: string): string | null {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1 || lastDot === filename.length - 1) {
    return null;
  }
  return filename.slice(lastDot + 1).toLowerCase();
}
