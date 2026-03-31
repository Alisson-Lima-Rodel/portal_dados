"""Queries de Comercial > Planejamento — dados mockados para exemplo."""
from app.services.queries.registry import register_query


@register_query("comercial.planejamento.vendas_mensal")
async def vendas_mensal(params: dict) -> list[dict]:
    return [
        {"mes": "2026-01", "valor": 150000},
        {"mes": "2026-02", "valor": 180000},
        {"mes": "2026-03", "valor": 210000},
    ]


@register_query("comercial.planejamento.vendas_por_loja")
async def vendas_por_loja(params: dict) -> list[dict]:
    return [
        {"loja": "Matriz", "valor": 500000},
        {"loja": "Filial SP", "valor": 320000},
        {"loja": "Filial RJ", "valor": 280000},
    ]
