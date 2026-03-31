"""Sistema de cache com interface abstrata.

O que é cache?
  Cache é uma "memória rápida" que guarda resultados temporariamente.
  Em vez de consultar o banco toda vez, guardamos o resultado e reutilizamos.

Como funciona neste projeto:
  1. Primeira requisição → executa a query → guarda resultado no cache
  2. Próximas requisições → pega direto do cache (instantâneo)
  3. Depois de X minutos (TTL) → cache expira → executa a query novamente

Por que interface abstrata?
  Hoje usamos InMemoryCache (dicionário Python — simples, sem dependência).
  No futuro, se precisar de cache distribuído (várias instâncias do app),
  basta implementar RedisCache com a mesma interface. Os services não mudam.
"""
from __future__ import annotations

import abc
import time
from typing import Any


class CacheBackend(abc.ABC):
    """Interface abstrata de cache. Qualquer implementação deve ter estes 4 métodos."""

    @abc.abstractmethod
    async def get(self, key: str) -> Any | None: ...

    @abc.abstractmethod
    async def set(self, key: str, value: Any, ttl: int) -> None: ...

    @abc.abstractmethod
    async def delete(self, key: str) -> None: ...

    @abc.abstractmethod
    async def clear(self) -> None: ...


class InMemoryCache(CacheBackend):
    """Cache in-memory com TTL por entrada."""

    def __init__(self) -> None:
        self._store: dict[str, tuple[Any, float]] = {}  # key -> (value, expires_at)

    async def get(self, key: str) -> Any | None:
        entry = self._store.get(key)
        if entry is None:
            return None
        value, expires_at = entry
        if time.time() > expires_at:
            del self._store[key]
            return None
        return value

    async def set(self, key: str, value: Any, ttl: int) -> None:
        self._store[key] = (value, time.time() + ttl)

    async def delete(self, key: str) -> None:
        self._store.pop(key, None)

    async def clear(self) -> None:
        self._store.clear()


# Instância global — substituir por RedisCache quando necessário
cache = InMemoryCache()


def get_cache() -> CacheBackend:
    return cache
