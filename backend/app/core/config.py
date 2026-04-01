"""Configurações centrais da aplicação.

Todas as variáveis são lidas automaticamente do arquivo .env.
Se não encontrar no .env, usa o valor padrão definido aqui.

Como funciona:
  1. O pydantic-settings lê o .env na raiz do projeto
  2. Cada atributo da classe vira uma variável configurável
  3. O tipo do atributo valida automaticamente (str, int, list, etc.)
  4. A instância `settings` no final é importada por todo o projeto

SEGURANÇA: SECRET_KEY e FERNET_KEY NÃO têm valor padrão.
  Se não forem fornecidos no .env, a aplicação NÃO inicia.
"""
import logging
from pathlib import Path

from pydantic import model_validator
from pydantic_settings import BaseSettings

logger = logging.getLogger("app.config")

_INSECURE_SECRETS = {"change-me-in-production", "change-me-generate-with-Fernet.generate_key", "secret", ""}


class Settings(BaseSettings):
    # Banco de dados — o prefixo postgresql+asyncpg:// indica que usa driver async
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/portal_dados"

    # Redis (opcional)
    REDIS_URL: str | None = None

    # JWT — SEM valor padrão: deve ser definido no .env
    SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Fernet (criptografia de senhas de conexões) — SEM valor padrão
    FERNET_KEY: str

    # Segurança de rede
    ALLOWED_INTRANET_CIDRS: list[str] = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]
    TRUSTED_PROXY_IPS: list[str] = ["127.0.0.1"]

    # Power BI
    POWERBI_CLIENT_ID: str = ""
    POWERBI_CLIENT_SECRET: str = ""
    POWERBI_TENANT_ID: str = ""

    # Cache padrão
    DEFAULT_CACHE_TTL_SECONDS: int = 86400  # 24h

    # Rate limiting
    LOGIN_RATE_LIMIT: str = "5/minute"

    @model_validator(mode="after")
    def _check_insecure_secrets(self):
        if self.SECRET_KEY in _INSECURE_SECRETS:
            raise ValueError("SECRET_KEY insegura — defina um valor forte no .env")
        if self.FERNET_KEY in _INSECURE_SECRETS:
            raise ValueError("FERNET_KEY insegura — gere com Fernet.generate_key() e coloque no .env")
        if len(self.SECRET_KEY) < 32:
            raise ValueError("SECRET_KEY deve ter pelo menos 32 caracteres")
        return self

    model_config = {
        "env_file": str(Path(__file__).resolve().parent.parent.parent / ".env"),
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


settings = Settings()
