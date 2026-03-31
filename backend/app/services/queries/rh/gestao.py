"""Queries de RH > Gestão — dados mockados para exemplo."""
from app.services.queries.registry import register_query


@register_query("rh.gestao.headcount_mensal")
async def headcount_mensal(params: dict) -> list[dict]:
    return [
        {"mes": "2026-01", "headcount": 342},
        {"mes": "2026-02", "headcount": 350},
        {"mes": "2026-03", "headcount": 355},
    ]
