"""Queries de Comercial > Price — dados mockados para exemplo."""
from app.services.queries.registry import register_query


@register_query("comercial.price.preco_medio")
async def preco_medio(params: dict) -> list[dict]:
    # TODO: substituir por query real
    return [
        {"categoria": "Categoria A", "preco_medio": 89.90},
        {"categoria": "Categoria B", "preco_medio": 54.50},
        {"categoria": "Categoria C", "preco_medio": 210.00},
    ]
