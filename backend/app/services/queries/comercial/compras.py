"""Queries de Comercial > Compras — dados mockados para exemplo."""
from app.services.queries.registry import register_query


@register_query("comercial.compras.pedidos_compra")
async def pedidos_compra(params: dict) -> list[dict]:
    # TODO: substituir por query real
    return [
        {"fornecedor": "Fornecedor X", "valor": 85000, "status": "aprovado"},
        {"fornecedor": "Fornecedor Y", "valor": 42000, "status": "pendente"},
        {"fornecedor": "Fornecedor Z", "valor": 63000, "status": "aprovado"},
    ]
