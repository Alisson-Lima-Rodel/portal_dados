"""Registry central de queries — o coração do sistema de dashboards.

Como funciona:
  1. QUERY_REGISTRY é um dicionário: {chave: função}
     Ex: {"comercial.vendas_mensal": <função vendas_mensal>}

  2. O decorator @register_query("chave") adiciona funções ao dicionário

  3. Quando o front pede os dados de um dashboard:
     - O back-end lê os widgets do dashboard
     - Cada widget tem um query_service_key (ex: "comercial.vendas_mensal")
     - O back-end busca no QUERY_REGISTRY a função correspondente
     - Executa a função e retorna os dados

Por que isso é bom?
  - Para adicionar um novo gráfico, basta criar a função com @register_query
  - NÃO precisa mexer em routers, endpoints, ou qualquer outro arquivo
  - Escala horizontal: 10 queries ou 1000 queries, o mecanismo é o mesmo
"""
from __future__ import annotations

from typing import Any, Callable, Coroutine

# Dicionário central: mapeia chave (str) → função async que retorna dados
QUERY_REGISTRY: dict[str, Callable[..., Coroutine[Any, Any, Any]]] = {}


def register_query(key: str):
    """Decorator para registrar uma função de query no registry central.

    Uso:
        @register_query("comercial.vendas_mensal")
        async def vendas_mensal(params: dict) -> list[dict]:
            ...
    """
    def decorator(fn: Callable[..., Coroutine[Any, Any, Any]]):
        if key in QUERY_REGISTRY:
            raise ValueError(f"Query key '{key}' já registrada")
        QUERY_REGISTRY[key] = fn
        return fn
    return decorator
