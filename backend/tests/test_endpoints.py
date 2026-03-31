import pytest
import pytest_asyncio
from httpx import AsyncClient

from app.models.models import User


@pytest.mark.asyncio
class TestAuth:
    async def test_login_success(self, client: AsyncClient, admin_user: User):
        resp = await client.post("/auth/login", json={"email": "admin@test.com", "senha": "admin123"})
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data

    async def test_login_wrong_password(self, client: AsyncClient, admin_user: User):
        resp = await client.post("/auth/login", json={"email": "admin@test.com", "senha": "errada"})
        assert resp.status_code == 401

    async def test_refresh_token(self, client: AsyncClient, admin_user: User):
        login_resp = await client.post("/auth/login", json={"email": "admin@test.com", "senha": "admin123"})
        refresh_token = login_resp.json()["refresh_token"]
        resp = await client.post("/auth/refresh", json={"refresh_token": refresh_token})
        assert resp.status_code == 200
        assert "access_token" in resp.json()


@pytest.mark.asyncio
class TestUsers:
    async def test_get_me(self, client: AsyncClient, auth_headers: dict):
        resp = await client.get("/users/me", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["email"] == "admin@test.com"

    async def test_list_users(self, client: AsyncClient, auth_headers: dict):
        resp = await client.get("/users", headers=auth_headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    async def test_create_user(self, client: AsyncClient, auth_headers: dict):
        resp = await client.post(
            "/users",
            json={"nome": "Novo", "email": "novo@test.com", "senha": "teste123"},
            headers=auth_headers,
        )
        assert resp.status_code == 201
        assert resp.json()["email"] == "novo@test.com"


@pytest.mark.asyncio
class TestAreas:
    async def test_create_and_list_areas(self, client: AsyncClient, auth_headers: dict):
        resp = await client.post("/areas", json={"nome": "Comercial", "icone": "chart"}, headers=auth_headers)
        assert resp.status_code == 201
        resp = await client.get("/areas", headers=auth_headers)
        assert resp.status_code == 200
        assert len(resp.json()) >= 1


@pytest.mark.asyncio
class TestDashboards:
    async def test_create_and_catalog(self, client: AsyncClient, auth_headers: dict):
        resp = await client.post(
            "/dashboards",
            json={"nome": "Vendas", "descricao": "Dashboard de vendas", "is_public": True},
            headers=auth_headers,
        )
        assert resp.status_code == 201
        dashboard_id = resp.json()["id"]

        resp = await client.get("/dashboards/catalog", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["total"] >= 1

    async def test_dashboard_widgets(self, client: AsyncClient, auth_headers: dict):
        # Criar dashboard
        resp = await client.post(
            "/dashboards",
            json={"nome": "Test Widgets"},
            headers=auth_headers,
        )
        dashboard_id = resp.json()["id"]

        # Criar widget
        resp = await client.post(
            f"/dashboards/{dashboard_id}/widgets",
            json={
                "dashboard_id": dashboard_id,
                "tipo": "nativo",
                "query_service_key": "comercial.vendas_mensal",
                "posicao_grid": {"x": 0, "y": 0, "w": 6, "h": 4},
            },
            headers=auth_headers,
        )
        assert resp.status_code == 201

        # Listar widgets
        resp = await client.get(f"/dashboards/{dashboard_id}/widgets", headers=auth_headers)
        assert resp.status_code == 200
        assert len(resp.json()) == 1


@pytest.mark.asyncio
class TestHealth:
    async def test_health(self, client: AsyncClient):
        resp = await client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["status"] in ("healthy", "degraded")


@pytest.mark.asyncio
class TestLayout:
    async def test_save_and_get_layout(self, client: AsyncClient, auth_headers: dict):
        layout = {"lg": [{"i": "widget-1", "x": 0, "y": 0, "w": 6, "h": 4}]}
        resp = await client.put("/users/me/layout", json={"layout_json": layout}, headers=auth_headers)
        assert resp.status_code == 200

        resp = await client.get("/users/me/layout", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["layout_json"] == layout


@pytest.mark.asyncio
class TestAudit:
    async def test_log_access(self, client: AsyncClient, auth_headers: dict):
        resp = await client.post(
            "/audit/log",
            json={"pagina": "/home"},
            headers=auth_headers,
        )
        assert resp.status_code == 202

    async def test_list_logs(self, client: AsyncClient, auth_headers: dict):
        resp = await client.get("/audit/logs", headers=auth_headers)
        assert resp.status_code == 200
        assert "items" in resp.json()
