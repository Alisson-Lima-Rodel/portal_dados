"""Queries de Financeiro > Contabilidade — dados mockados para exemplo."""
from app.services.queries.registry import register_query


@register_query("financeiro.contabilidade.dre_consolidado")
async def dre_consolidado(params: dict) -> list[dict]:
    return [
        {"conta": "Receita Bruta", "valor": 1200000},
        {"conta": "Deduções", "valor": -120000},
        {"conta": "Receita Líquida", "valor": 1080000},
    ]
