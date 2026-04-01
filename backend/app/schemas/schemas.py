"""Schemas Pydantic — validação dos dados de entrada e saída da API.

O que é um Schema?
  É a definição do FORMATO dos dados que a API aceita (request) e retorna (response).
  O Pydantic valida automaticamente: se o front enviar um email inválido, por exemplo,
  a API retorna erro 422 sem que você precise escrever código de validação.

Convenção de nomes:
  - XxxCreate  → dados para criar (POST)
  - XxxUpdate  → dados para atualizar (PUT) — campos opcionais
  - XxxRead    → dados retornados pela API (GET) — nunca expõe dados sensíveis

Exemplo:
  - UserCreate: nome, email, senha (o front envia)
  - UserRead: id, nome, email, ativo, grupo (a API retorna — sem a senha!)

model_config = {"from_attributes": True}
  → Permite converter objetos SQLAlchemy em schemas automaticamente.
    Ex: UserRead.model_validate(user_do_banco)
"""
import re
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator


def _validate_password_strength(v: str) -> str:
    """Exige pelo menos 8 chars, 1 maiúscula, 1 minúscula e 1 número."""
    if len(v) < 8:
        raise ValueError("Senha deve ter pelo menos 8 caracteres")
    if not re.search(r"[A-Z]", v):
        raise ValueError("Senha deve conter pelo menos uma letra maiúscula")
    if not re.search(r"[a-z]", v):
        raise ValueError("Senha deve conter pelo menos uma letra minúscula")
    if not re.search(r"\d", v):
        raise ValueError("Senha deve conter pelo menos um número")
    return v


# ======================== Auth ========================

class LoginRequest(BaseModel):
    email: EmailStr
    senha: str = Field(min_length=8)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ======================== Grupo de Acesso ========================

class GrupoAcessoCreate(BaseModel):
    nome: str = Field(max_length=100)
    permissoes: list[str] = []


class GrupoAcessoUpdate(BaseModel):
    nome: str | None = None
    permissoes: list[str] | None = None


class GrupoAcessoRead(BaseModel):
    id: int
    nome: str
    permissoes: list[str]

    model_config = {"from_attributes": True}


# ======================== Usuário ========================

class UserCreate(BaseModel):
    nome: str = Field(max_length=200)
    email: EmailStr
    senha: str = Field(min_length=8)
    ativo: bool = True
    grupo_id: int | None = None

    @field_validator("senha")
    @classmethod
    def senha_strength(cls, v: str) -> str:
        return _validate_password_strength(v)


class UserUpdate(BaseModel):
    nome: str | None = None
    email: EmailStr | None = None
    senha: str | None = Field(default=None, min_length=8)
    ativo: bool | None = None
    grupo_id: int | None = None

    @field_validator("senha")
    @classmethod
    def senha_strength(cls, v: str | None) -> str | None:
        if v is not None:
            return _validate_password_strength(v)
        return v


class UserRead(BaseModel):
    id: int
    nome: str
    email: str
    ativo: bool
    grupo_id: int | None
    grupo: GrupoAcessoRead | None = None

    model_config = {"from_attributes": True}


# ======================== Área ========================

class AreaCreate(BaseModel):
    nome: str = Field(max_length=100)
    icone: str | None = None


class AreaUpdate(BaseModel):
    nome: str | None = None
    icone: str | None = None


class AreaRead(BaseModel):
    id: int
    nome: str
    icone: str | None

    model_config = {"from_attributes": True}


# ======================== Dashboard ========================

class DashboardCreate(BaseModel):
    nome: str = Field(max_length=200)
    descricao: str | None = None
    is_public: bool = False
    taxa_atualizacao_minutos: int | None = None
    area_id: int | None = None


class DashboardUpdate(BaseModel):
    nome: str | None = None
    descricao: str | None = None
    is_public: bool | None = None
    taxa_atualizacao_minutos: int | None = None
    area_id: int | None = None


class DashboardRead(BaseModel):
    id: int
    nome: str
    descricao: str | None
    is_public: bool
    taxa_atualizacao_minutos: int | None
    area_id: int | None
    criado_por: int | None

    model_config = {"from_attributes": True}


# ======================== Widget ========================

class WidgetCreate(BaseModel):
    dashboard_id: int
    tipo: str = Field(pattern=r"^(nativo|powerbi)$")
    query_service_key: str | None = None
    parametros: dict | None = None
    posicao_grid: dict | None = None


class WidgetUpdate(BaseModel):
    tipo: str | None = Field(default=None, pattern=r"^(nativo|powerbi)$")
    query_service_key: str | None = None
    parametros: dict | None = None
    posicao_grid: dict | None = None


class WidgetRead(BaseModel):
    id: int
    dashboard_id: int
    tipo: str
    query_service_key: str | None
    parametros: dict | None
    posicao_grid: dict | None

    model_config = {"from_attributes": True}


# ======================== Conexão ========================

class ConexaoCreate(BaseModel):
    nome: str = Field(max_length=200)
    tipo: str = Field(pattern=r"^(fabric|oracle|postgres)$")
    host: str = Field(max_length=300)
    porta: int = Field(ge=1, le=65535)
    database: str = Field(max_length=200)
    usuario: str = Field(max_length=200)
    senha: str  # plain, será criptografada no service


class ConexaoUpdate(BaseModel):
    nome: str | None = None
    tipo: str | None = Field(default=None, pattern=r"^(fabric|oracle|postgres)$")
    host: str | None = None
    porta: int | None = Field(default=None, ge=1, le=65535)
    database: str | None = None
    usuario: str | None = None
    senha: str | None = None


class ConexaoRead(BaseModel):
    id: int
    nome: str
    tipo: str
    host: str
    porta: int
    database: str
    usuario: str
    # senha NUNCA exposta

    model_config = {"from_attributes": True}


# ======================== Preferências / Layout ========================

class LayoutRead(BaseModel):
    layout_json: dict

    model_config = {"from_attributes": True}


class LayoutUpdate(BaseModel):
    layout_json: dict


# ======================== Log de Acesso ========================

class LogAcessoCreate(BaseModel):
    pagina: str
    dashboard_id: int | None = None


class LogAcessoRead(BaseModel):
    id: int
    usuario_id: int | None
    ip: str
    pagina: str
    dashboard_id: int | None
    acao: str
    origem: str | None
    aparelho: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


# ======================== Paginação ========================

class PaginatedResponse(BaseModel):
    items: list
    total: int
    limit: int
    offset: int


# ======================== Erro Padrão ========================

class ErrorResponse(BaseModel):
    detail: str
    error_code: str
    status_code: int
