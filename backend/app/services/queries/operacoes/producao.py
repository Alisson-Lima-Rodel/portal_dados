"""Queries de Operações > Produção — dados mockados para exemplo."""
from app.services.queries.registry import register_query


@register_query("operacoes.producao.producao_diaria")
async def producao_diaria(params: dict) -> list[dict]:
    return [
        {"data": "2026-03-27", "unidades": 1500},
        {"data": "2026-03-28", "unidades": 1620},
    ]
