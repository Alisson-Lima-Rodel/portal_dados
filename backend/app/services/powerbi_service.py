"""Serviço de integração Power BI — gera Embed Tokens.

Fluxo (client credentials do Azure AD):
  1. Faz POST no Azure AD para obter access_token (autenticação M2M)
  2. Com o access_token, faz POST na Power BI REST API para gerar Embed Token
  3. Retorna o Embed Token para o front-end renderizar o relatório

Pré-requisitos:
  - Service Principal criado no Azure AD
  - App registrado no Power BI Admin Portal
  - POWERBI_CLIENT_ID, POWERBI_CLIENT_SECRET, POWERBI_TENANT_ID no .env
"""
import httpx

from app.core.config import settings


async def get_powerbi_embed_token(report_id: str, dataset_id: str | None = None) -> dict:
    """Obtém Embed Token do Power BI via Azure AD (client credentials flow)."""
    tenant_id = settings.POWERBI_TENANT_ID
    client_id = settings.POWERBI_CLIENT_ID
    client_secret = settings.POWERBI_CLIENT_SECRET

    # 1. Obter access token do Azure AD
    token_url = f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token"
    token_data = {
        "grant_type": "client_credentials",
        "client_id": client_id,
        "client_secret": client_secret,
        "scope": "https://analysis.windows.net/powerbi/api/.default",
    }

    async with httpx.AsyncClient() as client:
        token_resp = await client.post(token_url, data=token_data)
        token_resp.raise_for_status()
        access_token = token_resp.json()["access_token"]

        # 2. Gerar Embed Token via Power BI REST API
        embed_url = "https://api.powerbi.com/v1.0/myorg/GenerateToken"
        headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}

        body: dict = {
            "reports": [{"id": report_id}],
            "datasets": [{"id": dataset_id}] if dataset_id else [],
        }

        embed_resp = await client.post(embed_url, json=body, headers=headers)
        embed_resp.raise_for_status()
        return embed_resp.json()
