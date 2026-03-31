"""Middleware de logging — gera um ID único por requisição e loga dados úteis.

Por que request_id?
  Quando vários usuários fazem requisições ao mesmo tempo, o log fica confuso.
  Com um request_id único, você consegue filtrar TUDO que aconteceu numa requisição.

Exemplo de log gerado:
  2026-03-29 10:15:23 [INFO] app - request
  request_id=abc-123, method=GET, path=/dashboards/1/data, status=200, duration=45ms

O request_id também é retornado no header da resposta (X-Request-ID).
Isso ajuda o front a informar o ID ao suporte em caso de erro.
"""
import logging
import time
import uuid

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("app")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Gera request_id e loga: método, rota, status, tempo de resposta."""

    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        start = time.perf_counter()
        response = await call_next(request)
        elapsed_ms = (time.perf_counter() - start) * 1000

        logger.info(
            "request",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "duration_ms": round(elapsed_ms, 2),
                "client_ip": request.client.host if request.client else None,
            },
        )

        response.headers["X-Request-ID"] = request_id
        return response
