"""Inicialização do módulo de queries.

IMPORTANTE: Cada novo pacote de área precisa ser importado aqui
para que os decorators @register_query sejam executados.

Estrutura:
  queries/
    comercial/          ← área
      planejamento.py   ← assunto  (chave: comercial.planejamento.*)
      estoque.py
      price.py
      compras.py
    financeiro/
      tesouraria.py
      contabilidade.py
    operacoes/
      producao.py
    rh/
      gestao.py

Para adicionar uma nova query:
  1. Identifique a área e o assunto
  2. Crie/edite o arquivo do assunto dentro da pasta da área
  3. Use @register_query("area.assunto.nome_da_query")
  4. Importe o novo módulo no __init__.py da área
"""
from app.services.queries.registry import QUERY_REGISTRY, register_query  # noqa: F401

# Importar pacotes de queries para que os decorators sejam executados
from app.services.queries import comercial  # noqa: F401
from app.services.queries import financeiro  # noqa: F401
from app.services.queries import operacoes  # noqa: F401
from app.services.queries import rh  # noqa: F401
