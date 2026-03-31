# Portal de Dados Corporativo

Portal de dados corporativo com dashboards interativos, cache dinâmico, controle de acesso RBAC e integração com Power BI.

---

## Arquitetura

```
┌──────────────┐       ┌──────────────────────────────────────────┐
│              │       │           BACK-END  (porta 8000)         │
│   FRONT-END  │──────►│  FastAPI · SQLAlchemy · Alembic · JWT    │
│   Next.js    │ HTTP  │  Router → Service → Query Registry → Cache│
│   (porta 3000)│◄──────│                        │                 │
└──────────────┘ JSON  │                   ┌────▼─────┐           │
                       │                   │ Bancos   │           │
                       │                   │ Externos │           │
                       │                   └──────────┘           │
                       └──────────────────────────────────────────┘
                                        │
                                   ┌────▼─────┐
                                   │PostgreSQL │
                                   │ (Docker)  │
                                   └──────────┘
```

---

## Estrutura do Monorepo

```
001_aprendendo/
├── backend/               ← API FastAPI (Python 3.12)
│   ├── app/               ← Código da aplicação
│   ├── alembic/           ← Migrações do banco
│   ├── tests/             ← Testes automatizados
│   ├── .env               ← Variáveis de ambiente
│   ├── requirements.txt
│   ├── Dockerfile
│   └── README.md          ← Documentação completa do back-end
│
├── frontend/              ← Interface Next.js (TypeScript)
│   ├── src/               ← Código da aplicação
│   ├── .env.local         ← Variáveis de ambiente
│   ├── package.json
│   ├── Dockerfile
│   └── README.md          ← Documentação completa do front-end
│
├── docker-compose.yml     ← Orquestra todos os serviços
└── README.md              ← Este arquivo
```

---

## Tecnologias

| Camada | Stack |
|---|---|
| **Back-end** | Python 3.12, FastAPI, SQLAlchemy 2.0 (async), Pydantic v2, Alembic, JWT, Fernet |
| **Front-end** | Next.js 14 (App Router), TypeScript, Tailwind CSS, Shadcn/UI, Tremor, Recharts, TanStack Query |
| **Banco** | PostgreSQL 16 (Docker) |
| **Infra** | Docker, Docker Compose |

---

## Primeiros Passos

### Pré-requisitos

- **Python 3.12** — `C:\Users\aliss\anaconda3\python.exe`
- **Node.js 18+** — para o front-end
- **Docker Desktop** — para o PostgreSQL
- **VS Code** — editor recomendado

### 1. Subir o banco de dados

```powershell
docker start portal_postgres
# Ou, se for a primeira vez:
docker run -d --name portal_postgres `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=portal_dados `
  -p 5432:5432 `
  postgres:16-alpine
```

### 2. Subir o back-end

```powershell
cd backend
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```

API disponível em: http://localhost:8000/docs

### 3. Subir o front-end

```powershell
cd frontend
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
npm run dev
```

Front disponível em: http://localhost:3000

---

## Documentação Detalhada

| Projeto | README |
|---|---|
| **Back-end** | [backend/README.md](backend/README.md) — API, endpoints, segurança, cache, migrações, testes |
| **Front-end** | [frontend/README.md](frontend/README.md) — Componentes, páginas, hooks, design system |

---

## Credenciais de Desenvolvimento

| Serviço | Credencial |
|---|---|
| **Login admin** | `admin@portal.com` / `admin123` |
| **PostgreSQL** | `postgres` / `postgres` / db: `portal_dados` |

---

## Cheat Sheet

| Quando | Comando |
|---|---|
| Ligar o banco | `docker start portal_postgres` |
| Subir o back-end | `cd backend` → ativar venv → `uvicorn app.main:app --reload --port 8000` |
| Subir o front-end | `cd frontend` → `npm run dev` |
| Parar tudo | `Ctrl+C` nos terminais + `docker stop portal_postgres` |
| Rodar testes back | `cd backend` → `pytest` |
| Rodar testes front | `cd frontend` → `npm test` |
| Nova migração | `cd backend` → `alembic revision --autogenerate -m "descricao"` → `alembic upgrade head` |
