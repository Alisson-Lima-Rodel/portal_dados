"""Configurações centrais da aplicação.

Todas as variáveis são lidas automaticamente do arquivo .env.
Se não encontrar no .env, usa o valor padrão definido aqui.

Como funciona:
  1. O pydantic-settings lê o .env na raiz do projeto
  2. Cada atributo da classe vira uma variável configurável
  3. O tipo do atributo valida automaticamente (str, int, list, etc.)
  4. A instância `settings` no final é importada por todo o projeto
"""
from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Banco de dados — o prefixo postgresql+asyncpg:// indica que usa driver async
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/portal_dados"

    # Redis (opcional)
    REDIS_URL: str | None = None

    # JWT
    SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Fernet (criptografia de senhas de conexões)
    FERNET_KEY: str = "change-me-generate-with-Fernet.generate_key"

    # Segurança de rede
    ALLOWED_INTRANET_CIDRS: list[str] = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    # Power BI
    POWERBI_CLIENT_ID: str = ""
    POWERBI_CLIENT_SECRET: str = ""
    POWERBI_TENANT_ID: str = ""

    # Cache padrão
    DEFAULT_CACHE_TTL_SECONDS: int = 86400  # 24h

    model_config = {
        "env_file": str(Path(__file__).resolve().parent.parent.parent / ".env"),
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


settings = Settings()
