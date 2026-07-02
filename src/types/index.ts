// =============================================================================
// Tipos Base
// =============================================================================

export type TipoUsuario = 'admin' | 'setor' | 'tecnico' | 'cidadao' | 'entrevistador';

export type Prioridade = 'baixa' | 'media' | 'alta' | 'critica';

export type StatusSolicitacao =
  | 'aberto'
  | 'em_analise'
  | 'em_andamento'
  | 'resolvido'
  | 'fechado'
  | 'cancelado';

export type ErrorType = 'offline' | 'timeout' | 'auth' | 'api' | 'unexpected' | 'validation';

// =============================================================================
// Entidades
// =============================================================================

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  tipo: TipoUsuario;
  id_setor: number | null;
  imagem: string | null;
}

export interface Setor {
  id_setor: number;
  nome: string;
  sigla: string;
  total_servicos: number;
}

export interface Servico {
  id_servico: number;
  id_setor: number;
  nome: string;
  nome_setor: string;
  sigla?: string;
}

export interface Solicitacao {
  id_solicitacao: number;
  id_usuario: number;
  id_servico: number;
  descricao: string;
  status: StatusSolicitacao;
  status_nome: string;
  nome_servico: string;
  criado_em: string; // "YYYY-MM-DD HH:mm:ss"
}

export interface SolicitacaoDetalhe {
  id_solicitacao: number;
  id_usuario: number;
  id_servico: number;
  nome_servico: string;
  id_setor: number;
  descricao: string;
  status: StatusSolicitacao;
  fotos: Foto[];
  localizacao_tecnico: LocalizacaoTecnico | null;
}

export interface Foto {
  id_foto: number;
  caminho: string;
  url: string;
  tipo: string;
  metadata: {
    original_name: string;
    size: number;
    mime: string;
    upload_date: string;
    source: string;
  };
}

export interface LocalizacaoTecnico {
  latitude: string;
  longitude: string;
}

export interface ImageFile {
  uri: string;
  name: string;
  type: string; // mime type
  size: number; // bytes
}

// =============================================================================
// API Error Response
// =============================================================================

export interface ApiErrorResponse {
  ok: false;
  erro: string;
  detalhes?: string[];
}

// =============================================================================
// Request / Response
// =============================================================================

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface LoginResponse {
  ok: true;
  token: string;
  expires_in: number;
  usuario: Usuario;
}

export interface CriarSolicitacaoRequest {
  id_servico: number;
  descricao: string;
  endereco?: string;
  bairro?: string;
  numero?: string;
  latitude?: string;
  longitude?: string;
  prioridade?: Prioridade;
}

export interface ListarSolicitacoesParams {
  page?: number;
  per_page?: number;
  status?: StatusSolicitacao;
  data_inicio?: string; // YYYY-MM-DD
  data_fim?: string; // YYYY-MM-DD
}

export interface PaginacaoResponse {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface AlterarStatusRequest {
  status: StatusSolicitacao;
  comentario?: string;
}
