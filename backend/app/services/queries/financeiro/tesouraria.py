"""Queries de Financeiro > Tesouraria — dados mockados para exemplo."""
from app.services.queries.registry import register_query


@register_query("financeiro.tesouraria.fluxo_caixa")
async def fluxo_caixa(params: dict) -> list[dict]:
    return [
        {"mes": "2026-01", "entrada": 300000, "saida": 250000},
        {"mes": "2026-02", "entrada": 350000, "saida": 270000},
    ]
