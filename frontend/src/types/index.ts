// Interfaces TypeScript espelhando os schemas Pydantic do backend

// ============ Auth ============
export interface LoginRequest {
  email: string;
  senha: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface RefreshRequest {
  refresh_token: string;
}

// ============ User ============
export interface User {
  id: number;
  nome: string;
  email: string;
  ativo: boolean;
  grupo_id: number;
  grupo?: GrupoAcesso;
}

export interface UserCreate {
  nome: string;
  email: string;
  senha: string;
  grupo_id: number;
}

export interface UserUpdate {
  nome?: string;
  email?: string;
  senha?: string;
  ativo?: boolean;
  grupo_id?: number;
}

// ============ GrupoAcesso ============
export interface GrupoAcesso {
  id: number;
  nome: string;
  permissoes: string[];
}

export type Permission =
  | "view_dashboard"
  | "edit_dashboard"
  | "manage_users"
  | "manage_connections";

// ============ Area ============
export interface Area {
  id: number;
  nome: string;
  icone: string;
}

// ============ Dashboard ============
export interface Dashboard {
  id: number;
  nome: string;
  descricao: string | null;
  is_public: boolean;
  taxa_atualizacao_minutos: number | null;
  area_id: number;
  criado_por: number;
  area?: Area;
}

export interface DashboardCreate {
  nome: string;
  descricao?: string;
  is_public?: boolean;
  taxa_atualizacao_minutos?: number;
  area_id: number;
}

export interface DashboardUpdate {
  nome?: string;
  descricao?: string;
  is_public?: boolean;
  taxa_atualizacao_minutos?: number;
  area_id?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

// ============ Widget ============
export interface Widget {
  id: number;
  dashboard_id: number;
  tipo: "nativo" | "powerbi";
  query_service_key: string | null;
  parametros: Record<string, unknown>;
  posicao_grid: GridPosition;
}

export interface WidgetCreate {
  dashboard_id: number;
  tipo: "nativo" | "powerbi";
  query_service_key?: string;
  parametros?: Record<string, unknown>;
  posicao_grid?: GridPosition;
}

export interface WidgetUpdate {
  tipo?: "nativo" | "powerbi";
  query_service_key?: string;
  parametros?: Record<string, unknown>;
  posicao_grid?: GridPosition;
}

export interface GridPosition {
  x: number;
  y: number;
  w: number;
  h: number;
  i?: string;
}

// ============ Connection ============
export interface Connection {
  id: number;
  nome: string;
  tipo: "fabric" | "oracle" | "postgres";
  host: string;
  porta: number;
  database: string;
  usuario: string;
}

export interface ConnectionCreate {
  nome: string;
  tipo: "fabric" | "oracle" | "postgres";
  host: string;
  porta: number;
  database: string;
  usuario: string;
  senha: string;
}

export interface ConnectionUpdate {
  nome?: string;
  tipo?: "fabric" | "oracle" | "postgres";
  host?: string;
  porta?: number;
  database?: string;
  usuario?: string;
  senha?: string;
}

// ============ Layout / Preferências ============
export interface LayoutPreferences {
  layout_json: Record<string, unknown>;
}

// ============ Audit ============
export interface AuditLogCreate {
  pagina: string;
  dashboard_id?: number;
}

export interface AuditLog {
  id: number;
  usuario_id: number | null;
  ip: string;
  pagina: string;
  dashboard_id: number | null;
  acao: string;
  origem: string;
  aparelho: string;
  created_at: string;
}

// ============ Health ============
export interface HealthResponse {
  status: string;
  components: {
    app: string;
    database: string;
    cache: string;
  };
}

// ============ Power BI ============
export interface EmbedTokenResponse {
  embedUrl: string;
  accessToken: string;
  reportId: string;
  tokenExpiry: string;
}
