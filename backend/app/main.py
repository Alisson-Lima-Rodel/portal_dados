"""Ponto de entrada principal da aplicação FastAPI.

Este arquivo:
  1. Cria a instância do FastAPI (a "app")
  2. Configura os middlewares (segurança, CORS, logging)
  3. Registra todos os routers (endpoints)
  4. Define exception handlers globais (erros padronizados)

Para rodar:
  uvicorn app.main:app --reload --port 8000

A documentação interativa fica em:
  http://localhost:8000/docs     (Swagger UI)
  http://localhost:8000/redoc    (ReDoc)
"""
import logging
import sys

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings
from app.middleware.headers import SecurityHeadersMiddleware
from app.middleware.logging import RequestLoggingMiddleware
from app.middleware.security import IntranetSecurityMiddleware
from app.routers import areas, audit, auth, connections, dashboards, health, powerbi, users, widgets

# Importar queries para que os decorators @register_query sejam executados
import app.services.queries  # noqa: F401

# --------------- Logging ---------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("app")

# --------------- App ---------------
app = FastAPI(
    title="QQ Insights",
    description="API BFF para o QQ Insights com dashboards, cache dinâmico e RBAC.",
    version="1.0.0",
)

# --------------- Middlewares (ordem importa: último adicionado é executado primeiro) ---------------
# Ordem Starlette: último adicionado executa PRIMEIRO.
# SecurityHeaders → Security → Logging → CORS (CORS precisa responder OPTIONS antes de tudo)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(IntranetSecurityMiddleware)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
)

# --------------- Rate Limiter ---------------
from app.routers.auth import limiter  # noqa: E402
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# --------------- Routers ---------------
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(areas.router)
app.include_router(dashboards.router)
app.include_router(widgets.router)
app.include_router(connections.router)
app.include_router(powerbi.router)
app.include_router(audit.router)


# --------------- Exception Handlers ---------------

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Não expor detalhes internos de validação — logar e retornar mensagem genérica
    logger.warning("Validation error: %s", exc.errors())
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Dados de entrada inválidos",
            "error_code": "VALIDATION_ERROR",
            "status_code": 422,
        },
    )


@app.exception_handler(SQLAlchemyError)
async def database_exception_handler(request: Request, exc: SQLAlchemyError):
    logger.error(f"Database error: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Erro interno de banco de dados",
            "error_code": "DATABASE_ERROR",
            "status_code": 500,
        },
    )


@app.exception_handler(ConnectionError)
async def connection_exception_handler(request: Request, exc: ConnectionError):
    logger.error(f"Connection error: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Erro de conexão com serviço externo",
            "error_code": "CONNECTION_ERROR",
            "status_code": 500,
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Erro interno do servidor",
            "error_code": "INTERNAL_ERROR",
            "status_code": 500,
        },
    )
