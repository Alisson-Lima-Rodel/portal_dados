"""Queries de Comercial > Estoque — dados mockados para exemplo."""
from app.services.queries.registry import register_query


@register_query("comercial.estoque.posicao_atual")
async def posicao_atual(params: dict) -> list[dict]:
    # TODO: substituir por query real
    return [
        {"produto": "Produto A", "quantidade": 1200, "valor_unitario": 45.50},
        {"produto": "Produto B", "quantidade": 800, "valor_unitario": 32.00},
        {"produto": "Produto C", "quantidade": 350, "valor_unitario": 120.00},
    ]
