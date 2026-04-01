"""Middleware de security headers — adiciona headers de proteção em TODA resposta.

Headers adicionados:
  - X-Content-Type-Options: nosniff → impede o browser de "adivinhar" o tipo do arquivo
  - X-Frame-Options: DENY → impede que a API seja embutida em iframe (clickjacking)
  - X-XSS-Protection: 1; mode=block → ativa filtro XSS do browser (legado)
  - Strict-Transport-Security → força HTTPS por 1 ano (HSTS)
  - Referrer-Policy: strict-origin-when-cross-origin → limita dados no header Referer
  - Permissions-Policy → desativa câmera, microfone, geolocalização
  - Cache-Control → impede cache de respostas com dados sensíveis
"""
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

_SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Cache-Control": "no-store",
}


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        for header, value in _SECURITY_HEADERS.items():
            response.headers[header] = value
        return response
