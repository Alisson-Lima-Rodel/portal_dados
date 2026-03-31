# Portal de Dados Corporativo — Back-end

API back-end (BFF) em **FastAPI** para o portal de dados corporativo. Para a visão geral do projeto, veja o [README principal](../README.md).

---

## Índice

1. [Visão Geral](#visão-geral)
2. [Tecnologias Utilizadas](#tecnologias-utilizadas)
3. [Estrutura de Pastas](#estrutura-de-pastas)
4. [Primeiros Passos (Setup)](#primeiros-passos-setup)
5. [Variáveis de Ambiente (.env)](#variáveis-de-ambiente-env)
6. [Banco de Dados e Migrações](#banco-de-dados-e-migrações)
7. [Rodando o Projeto](#rodando-o-projeto)
8. [Arquitetura do Sistema](#arquitetura-do-sistema)
9. [Autenticação e Autorização](#autenticação-e-autorização)
10. [API — Todos os Endpoints](#api--todos-os-endpoints)
11. [Sistema de Cache Dinâmico](#sistema-de-cache-dinâmico)
12. [Como Adicionar Novos Dashboards/Queries](#como-adicionar-novos-dashboardsqueries)
13. [Power BI Embed](#power-bi-embed)
14. [Segurança](#segurança)
15. [Testes](#testes)
16. [Docker](#docker)
17. [Glossário](#glossário)

---

## Visão Geral

Este é o **back-end** de um portal de dados corporativo. Ele funciona como um **BFF (Backend for Frontend)**, ou seja:

- O **front-end nunca faz queries SQL diretamente** nos bancos de dados.
- Todas as consultas ficam protegidas no back-end, dentro da camada de **Services**.
- O front-end apenas chama os endpoints da API e recebe os dados prontos.

### O que o sistema faz?

| Funcionalidade | Descrição |
|---|---|
| **Dashboards** | Catálogo de dashboards organizados por área (Comercial, Financeiro, RH, etc.) |
| **Widgets nativos** | Gráficos alimentados por queries internas com cache automático |
| **Power BI Embed** | Integração para embutir relatórios Power BI no front |
| **RBAC** | Controle de acesso por grupos com permissões granulares |
| **Layout pessoal** | Cada usuário salva a posição dos widgets no seu "Homebroker" |
| **Auditoria** | Log de cada acesso (página, dashboard, IP, dispositivo) gravado em background |
| **Conexões externas** | Gerenciamento de conexões a bancos Fabric, Oracle, Postgres com senhas criptografadas |

---

## Tecnologias Utilizadas

| Tecnologia | Para que serve |
|---|---|
| **Python 3.12+** | Linguagem principal |
| **FastAPI** | Framework web assíncrono (cria a API REST) |
| **SQLAlchemy 2.0** | ORM para acessar o banco de dados (modo async) |
| **asyncpg** | Driver PostgreSQL assíncrono |
| **Alembic** | Gerenciar migrações do banco (criar/alterar tabelas) |
| **Pydantic v2** | Validação de dados (request/response da API) |
| **pydantic-settings** | Leitura de variáveis do arquivo `.env` |
| **python-jose** | Criação e validação de tokens JWT |
| **bcrypt** | Hash seguro de senhas de usuários |
| **cryptography (Fernet)** | Criptografia das senhas de conexões externas |
| **httpx** | Requisições HTTP async (para Power BI API) |
| **pytest + httpx** | Testes automatizados |
| **Docker** | Containerização do projeto |
| **PostgreSQL** | Banco de dados principal |
| **Redis** | Cache distribuído (opcional, desabilitado por padrão) |

---

## Estrutura de Pastas

```
001_aprendendo/                 ← RAIZ DO MONOREPO
│
├── backend/                    ← BACK-END (FastAPI + Python)
│   ├── app/                    ← Código principal da aplicação
│   │   ├── main.py             ← Ponto de entrada — configura o FastAPI
│   │   │
│   │   ├── core/               ← Configurações centrais
│   │   │   ├── config.py       ← Settings: lê variáveis do .env
│   │   │   ├── database.py     ← Conexão com PostgreSQL (engine, session)
│   │   │   ├── security.py     ← Hash de senhas, criação/validação JWT
│   │   │   └── deps.py         ← Dependências do FastAPI (autenticação, permissões)
│   │   │
│   │   ├── models/             ← Tabelas do banco de dados
│   │   │   └── models.py       ← Todas as tabelas (User, Dashboard, Widget, etc.)
│   │   │
│   │   ├── schemas/            ← Validação de dados da API
│   │   │   └── schemas.py      ← Schemas Pydantic (o que a API aceita e retorna)
│   │   │
│   │   ├── routers/            ← Endpoints da API (as "rotas")
│   │   │   ├── auth.py         ← Login e refresh de token
│   │   │   ├── users.py        ← CRUD de usuários + layout pessoal
│   │   │   ├── areas.py        ← CRUD de áreas/departamentos
│   │   │   ├── dashboards.py   ← CRUD de dashboards + dados + widgets
│   │   │   ├── widgets.py      ← CRUD de widgets individuais
│   │   │   ├── connections.py  ← CRUD de conexões externas
│   │   │   ├── powerbi.py      ← Embed token do Power BI
│   │   │   ├── audit.py        ← Registro e consulta de logs de acesso
│   │   │   └── health.py       ← Verificação de saúde da aplicação
│   │   │
│   │   ├── services/           ← Lógica de negócio (o "cérebro")
│   │   │   ├── auth_service.py
│   │   │   ├── dashboard_service.py
│   │   │   ├── connection_service.py
│   │   │   ├── powerbi_service.py
│   │   │   ├── audit_service.py
│   │   │   └── queries/        ← ⭐ QUERIES SQL POR ÁREA
│   │   │       ├── __init__.py ← Importa módulos para registro automático
│   │   │       ├── registry.py ← Dicionário central chave → função
│   │   │       ├── comercial.py
│   │   │       ├── financeiro.py
│   │   │       ├── operacoes.py
│   │   │       └── rh.py
│   │   │
│   │   ├── cache/
│   │   │   └── backend.py      ← Interface abstrata + cache in-memory com TTL
│   │   │
│   │   ├── middleware/
│   │   │   ├── security.py     ← Verifica JWT / intranet / dashboard público
│   │   │   └── logging.py      ← Gera request_id e loga cada requisição
│   │   │
│   │   └── utils/
│   │       └── crypto.py       ← Criptografia Fernet (senhas de conexões)
│   │
│   ├── alembic/                ← Migrações do banco de dados
│   │   ├── env.py
│   │   ├── script.py.mako
│   │   └── versions/
│   │
│   ├── tests/                  ← Testes automatizados
│   │   ├── conftest.py
│   │   ├── test_services.py
│   │   └── test_endpoints.py
│   │
│   ├── .env                    ← Variáveis de ambiente (NÃO commitar)
│   ├── .env.example            ← Modelo das variáveis
│   ├── alembic.ini
│   ├── requirements.txt
│   ├── pyproject.toml
│   ├── Dockerfile
│   └── venv/                   ← Ambiente virtual Python
│
├── frontend/                   ← FRONT-END (Next.js — a ser criado)
│   └── ...
│
├── docker-compose.yml          ← Orquestração dos containers (raiz)
├── README.md                   ← Este arquivo
├── 01_backend.md               ← Instruções de criação do back-end
├── 02_front.md                 ← Instruções de criação do front-end
└── 03_graficos.md              ← Instruções do motor de gráficos
```

### Como ler esta estrutura (dica para iniciantes)

- **Routers** = "o que a API aceita" (os endpoints, as URLs)
- **Schemas** = "que formato os dados têm" (validação automática)
- **Services** = "o que acontece por trás" (lógica de negócio)
- **Models** = "como os dados são guardados" (tabelas do banco)
- **Core** = "configuração e segurança" (JWT, banco, settings)

Uma requisição segue este fluxo:

```
Cliente → Middleware → Router → Service → Model/Banco
                                  ↓
                              Cache (se aplicável)
```

---

## Primeiros Passos (Setup — Primeira Vez)

Siga estes passos **uma única vez** ao configurar o projeto pela primeira vez.

### Pré-requisitos

- **Python 3.12** — no seu PC está em `C:\Users\aliss\anaconda3\python.exe`
- **Docker Desktop** — para rodar o banco de dados PostgreSQL
- **VS Code** — editor recomendado

### Passo 1: Criar o ambiente virtual (venv)

Abra o terminal na pasta do projeto e rode:

```powershell
cd "E:\Documentos\Cursos\Aplicacao\001_aprendendo\backend"

# Criar o venv usando o Python 3.12 do Anaconda
& "C:\Users\aliss\anaconda3\python.exe" -m venv venv
```

### Passo 2: Ativar o venv

```powershell
# Liberar execução de scripts (necessário no PowerShell)
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# Ativar o ambiente virtual
.\venv\Scripts\Activate.ps1

# Confirmar (deve mostrar Python 3.12.x)
python --version
```

> Quando o venv está ativo, aparece `(venv)` no início da linha do terminal.

### Passo 3: Instalar dependências

```powershell
pip install -r requirements.txt
```

### Passo 4: Configurar o `.env`

O arquivo `.env` já foi criado com chaves seguras geradas. Se precisar recriar:

```powershell
copy .env.example .env
```

E preencha os valores (veja a seção [Variáveis de Ambiente](#variáveis-de-ambiente-env)).

Para gerar uma nova chave Fernet:
```powershell
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Para gerar uma nova SECRET_KEY:
```powershell
python -c "import secrets; print(secrets.token_hex(32))"
```

### Passo 5: Subir o banco de dados (PostgreSQL via Docker)

```powershell
docker run -d --name portal_postgres `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=portal_dados `
  -p 5432:5432 `
  postgres:16-alpine
```

Isto cria um container chamado `portal_postgres`. Os dados ficam salvos mesmo se desligar a máquina.

### Passo 6: Criar as tabelas (migrações Alembic)

```powershell
alembic stamp head
alembic revision --autogenerate -m "initial"
alembic upgrade head
```

### Passo 7: Criar o usuário admin e dados iniciais

```powershell
python -c "
import asyncio
from app.core.database import async_session_factory
from app.core.security import hash_password
from app.models.models import GrupoAcesso, User, Area

async def seed():
    async with async_session_factory() as db:
        grupo = GrupoAcesso(nome='admin', permissoes=['view_dashboard','edit_dashboard','manage_users','manage_connections'])
        db.add(grupo)
        await db.flush()
        db.add(User(nome='Administrador', email='admin@portal.com', senha_hash=hash_password('admin123'), ativo=True, grupo_id=grupo.id))
        db.add(GrupoAcesso(nome='visualizador', permissoes=['view_dashboard']))
        for nome, icone in [('Comercial','chart-bar'),('Financeiro','dollar-sign'),('RH','users'),('Operacoes','cog')]:
            db.add(Area(nome=nome, icone=icone))
        await db.commit()
        print('Pronto! Login: admin@portal.com / Senha: admin123')

asyncio.run(seed())
"
```

### Passo 8: Iniciar o servidor

```powershell
uvicorn app.main:app --reload --port 8000
```

### Passo 9: Testar

Abra no navegador:
- **Swagger UI** (documentação interativa): http://localhost:8000/docs
- **Health check**: http://localhost:8000/health

---

## Subindo o Projeto no Dia a Dia (após reiniciar a máquina)

Quando ligar o computador e quiser trabalhar no projeto, rode apenas **3 comandos**:

```powershell
# 1. Iniciar o banco de dados (se não estiver rodando)
docker start portal_postgres

# 2. Ativar o ambiente virtual
cd "E:\Documentos\Cursos\Aplicacao\001_aprendendo\backend"
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\venv\Scripts\Activate.ps1

# 3. Iniciar o servidor
uvicorn app.main:app --reload --port 8000
```

Pronto! API no ar em http://localhost:8000/docs

### Como saber se o banco está rodando?

```powershell
docker ps --filter "name=portal_postgres"
```

Se aparecer `Up`, está rodando. Se não aparecer nada, rode `docker start portal_postgres`.

### Para desligar tudo

```powershell
# Parar o servidor: Ctrl+C no terminal

# Parar o banco (dados permanecem salvos)
docker stop portal_postgres
```

### Resumo rápido (cole na sua mesa)

| Quando | Comando |
|---|---|
| Ligar o banco | `docker start portal_postgres` |
| Ativar o venv | `cd backend` → `.\venv\Scripts\Activate.ps1` |
| Subir a API | `uvicorn app.main:app --reload --port 8000` |
| Parar a API | `Ctrl+C` |
| Parar o banco | `docker stop portal_postgres` |
| Ver docs da API | http://localhost:8000/docs |
| Login | `admin@portal.com` / `admin123` |

---

## Variáveis de Ambiente (.env)

Todas as configurações sensíveis ficam no arquivo `.env` (nunca commite este arquivo no Git!).

| Variável | Descrição | Exemplo |
|---|---|---|
| `DATABASE_URL` | URL de conexão com o PostgreSQL | `postgresql+asyncpg://postgres:postgres@localhost:5432/portal_dados` |
| `REDIS_URL` | URL do Redis (deixe vazio para usar cache in-memory) | `redis://localhost:6379` |
| `SECRET_KEY` | Chave secreta para assinar tokens JWT | `minha-chave-super-secreta-256bits` |
| `FERNET_KEY` | Chave para criptografar senhas de conexões externas | (gere com o comando da seção anterior) |
| `ALLOWED_INTRANET_CIDRS` | Faixas de IP da intranet (JSON) | `["10.0.0.0/8","192.168.0.0/16"]` |
| `CORS_ORIGINS` | Origens permitidas para o front-end (JSON) | `["http://localhost:3000"]` |
| `POWERBI_CLIENT_ID` | Client ID do Azure AD (Service Principal) | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| `POWERBI_CLIENT_SECRET` | Client Secret do Azure AD | `seu-secret` |
| `POWERBI_TENANT_ID` | Tenant ID do Azure AD | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |

### Dica importante

- `SECRET_KEY`: Use uma string longa e aleatória. Em produção, gere com: `openssl rand -hex 32`
- `FERNET_KEY`: Precisa ser uma chave Fernet válida. Use o comando Python da seção anterior.
- `DATABASE_URL`: O prefixo deve ser `postgresql+asyncpg://` (não `postgresql://`)

---

## Banco de Dados e Migrações

### Diagrama das Tabelas

```
┌─────────────────┐     ┌─────────────────────┐
│  grupos_acesso   │     │      usuarios        │
│─────────────────│     │─────────────────────│
│ id (PK)         │◄────│ grupo_id (FK)        │
│ nome            │     │ id (PK)              │
│ permissoes[]    │     │ nome                 │
└─────────────────┘     │ email (unique)       │
                        │ senha_hash           │
                        │ ativo                │
                        └──────┬──────────────┘
                               │ 1:1
                    ┌──────────▼──────────┐
                    │ preferencias_usuario │
                    │─────────────────────│
                    │ id (PK)             │
                    │ usuario_id (FK)     │
                    │ layout_json (JSON)  │ ← Posição dos widgets (react-grid-layout)
                    └─────────────────────┘

┌──────────┐     ┌─────────────────┐     ┌─────────────────┐
│  areas   │     │   dashboards    │     │    widgets      │
│──────────│     │─────────────────│     │─────────────────│
│ id (PK)  │◄────│ area_id (FK)    │◄────│ dashboard_id(FK)│
│ nome     │     │ id (PK)         │     │ id (PK)         │
│ icone    │     │ nome            │     │ tipo            │ ← "nativo" ou "powerbi"
└──────────┘     │ descricao       │     │ query_service_key│ ← ex: "comercial.vendas_mensal"
                 │ is_public       │     │ parametros (JSON)│
                 │ taxa_atualizacao│     │ posicao_grid(JSON)│
                 │ criado_por (FK) │     └─────────────────┘
                 └────────┬────────┘
                          │
                 ┌────────▼────────┐     ┌─────────────────┐
                 │  logs_acesso    │     │    conexoes     │
                 │─────────────────│     │─────────────────│
                 │ id (PK)         │     │ id (PK)         │
                 │ usuario_id (FK) │     │ nome            │
                 │ ip              │     │ tipo            │ ← fabric, oracle, postgres
                 │ pagina          │     │ host            │
                 │ dashboard_id(FK)│     │ porta           │
                 │ acao            │     │ database        │
                 │ origem          │     │ usuario         │
                 │ aparelho        │     │ senha_criptogr. │ ← Criptografia Fernet
                 │ created_at      │     └─────────────────┘
                 └─────────────────┘
```

### O que é uma Migração?

Uma **migração** é um arquivo que diz ao banco quais tabelas criar/alterar. Em vez de rodar SQL manualmente, o Alembic faz isso automaticamente a partir dos seus modelos Python.

### Comandos Alembic (os que você mais vai usar)

```bash
# Gerar uma nova migração a partir das mudanças nos models
alembic revision --autogenerate -m "descricao da mudanca"

# Aplicar todas as migrações pendentes
alembic upgrade head

# Desfazer a última migração
alembic downgrade -1

# Ver migração atual
alembic current

# Ver histórico de migrações
alembic history
```

### Fluxo de trabalho

1. Você altera algo em `app/models/models.py` (ex: adiciona uma coluna)
2. Roda `alembic revision --autogenerate -m "adiciona coluna X"`
3. Confere o arquivo gerado em `alembic/versions/`
4. Roda `alembic upgrade head` para aplicar

---

## Rodando o Projeto

Veja as seções acima:
- **Primeira vez?** → [Primeiros Passos (Setup — Primeira Vez)](#primeiros-passos-setup--primeira-vez)
- **Dia a dia (máquina reiniciou)?** → [Subindo o Projeto no Dia a Dia](#subindo-o-projeto-no-dia-a-dia-após-reiniciar-a-máquina)

---

## Arquitetura do Sistema

### Padrão BFF (Backend for Frontend)

```
 ┌──────────┐       ┌─────────────────────────────────────────────┐
 │          │       │              BACK-END (este projeto)        │
 │  FRONT   │──────►│                                             │
 │  (React) │ HTTP  │  Router → Service → Query Registry → Cache │
 │          │◄──────│                         │                   │
 └──────────┘ JSON  │                    ┌────▼────┐              │
                    │                    │ Bancos  │              │
                    │                    │ Externos│              │
                    │                    │(Fabric, │              │
                    │                    │ Oracle) │              │
                    │                    └─────────┘              │
                    └─────────────────────────────────────────────┘
```

**Por que BFF?**
- As queries SQL ficam **protegidas** no back-end (o front nunca vê SQL)
- O back-end formata os dados antes de enviar ao front
- Centraliza cache, autenticação e auditoria

### Fluxo de uma requisição típica

```
1. Usuário clica em um dashboard no front-end
2. Front faz GET /dashboards/5/data com o token JWT no header
3. Middleware verifica: token válido? Sim → continua
4. Router recebe a requisição e chama o Service
5. Service percorre os widgets do dashboard
6. Para cada widget nativo:
   a. Verifica o cache (já tem resultado recente?)
   b. Se sim → usa o cache
   c. Se não → busca a query no Registry → executa → salva no cache
7. Retorna JSON com os dados para o front-end
8. Front-end renderiza os gráficos
```

### Camadas do Sistema

| Camada | Pasta | Responsabilidade |
|---|---|---|
| **Apresentação** | `app/routers/` | Recebe requisições HTTP, valida dados, retorna responses |
| **Negócio** | `app/services/` | Lógica de negócio, orquestração, regras |
| **Dados** | `app/models/` | Define as tabelas e faz queries no banco |
| **Infraestrutura** | `app/core/`, `cache/`, `middleware/`, `utils/` | Configuração, segurança, cache, helpers |

---

## Autenticação e Autorização

### Como funciona o login?

```
1. POST /auth/login  →  { email, senha }
2. Back-end verifica no banco se email/senha batem
3. Se sim, retorna:
   - access_token  (válido por 30 min, usado em TODA requisição)
   - refresh_token (válido por 7 dias, usado para renovar o access_token)
```

### Como usar o token?

Em **toda** requisição que precisa de autenticação, envie o header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Quando o token expira?

Quando o `access_token` expira (30 min), o front-end deve chamar:

```
POST /auth/refresh  →  { refresh_token: "..." }
```

E recebe um novo `access_token`.

### Sistema de Permissões (RBAC)

Cada usuário pertence a um **Grupo de Acesso**. Cada grupo tem uma lista de **permissões**:

| Permissão | O que permite |
|---|---|
| `view_dashboard` | Visualizar dashboards |
| `edit_dashboard` | Criar, editar e excluir dashboards e widgets |
| `manage_users` | CRUD de usuários + consultar logs de auditoria |
| `manage_connections` | CRUD de conexões externas |

Exemplo de grupo:

```json
{
  "nome": "admin",
  "permissoes": ["view_dashboard", "edit_dashboard", "manage_users", "manage_connections"]
}
```

```json
{
  "nome": "visualizador",
  "permissoes": ["view_dashboard"]
}
```

### Acesso sem login (Intranet)

Se o usuário está **na rede intranet** (IP configurado em `ALLOWED_INTRANET_CIDRS`) e o dashboard é **público** (`is_public=True`), ele pode acessar **sem fazer login**.

---

## API — Todos os Endpoints

### Autenticação

| Método | Rota | Descrição | Autenticação |
|---|---|---|---|
| `POST` | `/auth/login` | Login (email + senha → tokens) | Não |
| `POST` | `/auth/refresh` | Renovar access_token | Não (usa refresh_token) |

**Exemplo de login:**

```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@empresa.com", "senha": "minhasenha"}'
```

**Resposta:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

---

### Usuários

| Método | Rota | Descrição | Permissão |
|---|---|---|---|
| `GET` | `/users/me` | Dados do usuário logado | Token válido |
| `GET` | `/users/me/layout` | Layout pessoal (Homebroker) | Token válido |
| `PUT` | `/users/me/layout` | Salvar layout pessoal | Token válido |
| `GET` | `/users` | Listar todos os usuários | `manage_users` |
| `POST` | `/users` | Criar usuário | `manage_users` |
| `GET` | `/users/{id}` | Buscar usuário por ID | `manage_users` |
| `PUT` | `/users/{id}` | Atualizar usuário | `manage_users` |
| `DELETE` | `/users/{id}` | Excluir usuário | `manage_users` |

**Exemplo — Salvar layout do Homebroker:**

```bash
curl -X PUT http://localhost:8000/users/me/layout \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "layout_json": {
      "lg": [
        {"i": "widget-1", "x": 0, "y": 0, "w": 6, "h": 4},
        {"i": "widget-2", "x": 6, "y": 0, "w": 6, "h": 4}
      ]
    }
  }'
```

---

### Áreas / Departamentos

| Método | Rota | Descrição | Permissão |
|---|---|---|---|
| `GET` | `/areas` | Listar áreas (para sidebar do front) | Token válido |
| `POST` | `/areas` | Criar área | Token válido |
| `PUT` | `/areas/{id}` | Atualizar área | Token válido |
| `DELETE` | `/areas/{id}` | Excluir área | Token válido |

---

### Dashboards

| Método | Rota | Descrição | Permissão |
|---|---|---|---|
| `GET` | `/dashboards/catalog` | Catálogo paginado (busca e filtro) | Token válido |
| `POST` | `/dashboards` | Criar dashboard | `edit_dashboard` |
| `GET` | `/dashboards/{id}` | Detalhes do dashboard | Token válido |
| `PUT` | `/dashboards/{id}` | Atualizar dashboard | `edit_dashboard` |
| `DELETE` | `/dashboards/{id}` | Excluir dashboard | `edit_dashboard` |
| `GET` | `/dashboards/{id}/data` | **Dados dos gráficos** (com cache) | Token válido |
| `GET` | `/dashboards/{id}/widgets` | Lista de widgets do dashboard | Token válido |
| `POST` | `/dashboards/{id}/widgets` | Criar widget | `edit_dashboard` |
| `GET` | `/dashboards/{id}/embed-token` | Token Power BI Embed | Token válido |

**Exemplo — Catálogo com busca e filtro:**

```bash
# Buscar dashboards com "vendas" no nome, da área 1
curl "http://localhost:8000/dashboards/catalog?search=vendas&area_id=1&limit=10&offset=0" \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Resposta:**

```json
{
  "items": [
    {
      "id": 1,
      "nome": "Vendas Mensal",
      "descricao": "Acompanhamento de vendas",
      "is_public": false,
      "taxa_atualizacao_minutos": 15,
      "area_id": 1,
      "criado_por": 1
    }
  ],
  "total": 1,
  "limit": 10,
  "offset": 0
}
```

**Exemplo — Buscar dados dos gráficos:**

```bash
curl http://localhost:8000/dashboards/1/data \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Resposta:**

```json
{
  "comercial.vendas_mensal": [
    {"mes": "2026-01", "valor": 150000},
    {"mes": "2026-02", "valor": 180000}
  ],
  "comercial.vendas_por_loja": [
    {"loja": "Matriz", "valor": 500000},
    {"loja": "Filial SP", "valor": 320000}
  ]
}
```

---

### Widgets

| Método | Rota | Descrição | Permissão |
|---|---|---|---|
| `GET` | `/widgets/{id}` | Detalhes de um widget | Token válido |
| `PUT` | `/widgets/{id}` | Atualizar widget | `edit_dashboard` |
| `DELETE` | `/widgets/{id}` | Excluir widget | `edit_dashboard` |

---

### Conexões Externas

| Método | Rota | Descrição | Permissão |
|---|---|---|---|
| `GET` | `/connections` | Listar conexões | `manage_connections` |
| `POST` | `/connections` | Criar conexão | `manage_connections` |
| `GET` | `/connections/{id}` | Detalhes da conexão | `manage_connections` |
| `PUT` | `/connections/{id}` | Atualizar conexão | `manage_connections` |
| `DELETE` | `/connections/{id}` | Excluir conexão | `manage_connections` |

> **Segurança:** A senha da conexão **nunca** é retornada na API. Ela é criptografada com Fernet antes de salvar e só descriptografada internamente quando o back-end precisa se conectar.

---

### Auditoria / Logs de Acesso

| Método | Rota | Descrição | Permissão |
|---|---|---|---|
| `POST` | `/audit/log` | Registrar acesso (assíncrono) | Opcional (com ou sem token) |
| `GET` | `/audit/logs` | Consultar logs com filtros | `manage_users` |

**Como funciona:**

O front-end chama `POST /audit/log` a cada navegação. O back-end:

1. Detecta automaticamente: IP, dispositivo (desktop/tablet/mobile), origem (intranet/externo)
2. Grava o log em **background** (BackgroundTask do FastAPI) — não atrasa a resposta
3. Retorna `202 Accepted` imediatamente

**Exemplo — Registrar acesso:**

```bash
curl -X POST http://localhost:8000/audit/log \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"pagina": "/dashboards/vendas", "dashboard_id": 1}'
```

**Exemplo — Consultar logs:**

```bash
curl "http://localhost:8000/audit/logs?usuario_id=1&data_inicio=2026-01-01&limit=50" \
  -H "Authorization: Bearer SEU_TOKEN"
```

---

### Health Check

| Método | Rota | Descrição | Autenticação |
|---|---|---|---|
| `GET` | `/health` | Status da aplicação, banco e cache | Não |

**Resposta:**

```json
{
  "status": "healthy",
  "components": {
    "app": "ok",
    "database": "ok",
    "cache": "ok"
  }
}
```

---

## Sistema de Cache Dinâmico

### O que é?

O cache guarda temporariamente o resultado das queries para não precisar consultar o banco toda vez. Quando alguém acessa o mesmo dashboard, os dados vêm do cache (muito mais rápido).

### Como funciona o TTL dinâmico?

Cada dashboard tem um campo `taxa_atualizacao_minutos`:

| Valor do campo | Comportamento |
|---|---|
| `15` | Cache expira em 15 minutos |
| `60` | Cache expira em 1 hora |
| `null` ou `0` | Usa o padrão: **24 horas** (86400 segundos) |

### Exemplo prático

```
Dashboard "Vendas" → taxa_atualizacao_minutos = 15

1ª requisição (09:00):  Executa a query → salva no cache com TTL=15min
2ª requisição (09:05):  Cache hit → retorna instantaneamente (sem query)
3ª requisição (09:10):  Cache hit → retorna instantaneamente
4ª requisição (09:16):  Cache expirou → executa a query novamente → cache renovado
```

### Arquitetura do Cache

```
┌─────────────────────┐
│   CacheBackend      │  ← Interface abstrata (ABC)
│   (protocolo)       │
├─────────────────────┤
│ + get(key)          │
│ + set(key, val, ttl)│
│ + delete(key)       │
│ + clear()           │
└──────────┬──────────┘
           │
     ┌─────┴──────┐
     │             │
┌────▼─────┐ ┌────▼──────┐
│InMemory  │ │  Redis    │  ← Troque no futuro sem mudar nada nos services
│ Cache    │ │  Cache    │
│(dict+TTL)│ │(futuro)   │
└──────────┘ └───────────┘
```

Para trocar para Redis no futuro, basta implementar `CacheBackend` com Redis e alterar a variável `cache` em `app/cache/backend.py`.

---

## Como Adicionar Novos Dashboards/Queries

Esta é a parte mais importante para o dia a dia. Para adicionar um novo dashboard:

### Passo 1: Criar as funções de query

Abra o arquivo da área correspondente (ex: `app/services/queries/comercial.py`) ou crie um novo arquivo se for uma nova área.

```python
# app/services/queries/comercial.py

from app.services.queries.registry import register_query


@register_query("comercial.ticket_medio")
async def ticket_medio(params: dict) -> list[dict]:
    """
    Retorna o ticket médio por mês.
    O decorator @register_query registra esta função com a chave
    "comercial.ticket_medio" no registry central.
    """
    # TODO: Aqui você faz a query real no banco externo (Fabric, Oracle, etc.)
    # Exemplo com dados mockados:
    return [
        {"mes": "2026-01", "ticket_medio": 85.50},
        {"mes": "2026-02", "ticket_medio": 92.30},
    ]
```

### Passo 2: Se criou um NOVO arquivo de área, registre no `__init__.py`

Abra `app/services/queries/__init__.py` e adicione o import:

```python
from app.services.queries import nova_area  # noqa: F401
```

### Passo 3: Cadastre o dashboard e widgets no banco

Via API ou diretamente no banco:

```bash
# 1. Criar o dashboard
curl -X POST http://localhost:8000/dashboards \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Ticket Médio",
    "descricao": "Acompanha o ticket médio",
    "area_id": 1,
    "taxa_atualizacao_minutos": 30
  }'
# Resposta: {"id": 5, ...}

# 2. Criar o widget apontando para a query
curl -X POST http://localhost:8000/dashboards/5/widgets \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dashboard_id": 5,
    "tipo": "nativo",
    "query_service_key": "comercial.ticket_medio",
    "posicao_grid": {"x": 0, "y": 0, "w": 12, "h": 6}
  }'
```

**Pronto!** Sem alterar nenhum router ou endpoint.

### Convenção de nomenclatura das chaves

```
"area.nome_da_query"

Exemplos:
  comercial.vendas_mensal
  comercial.vendas_por_loja
  financeiro.fluxo_caixa
  financeiro.dre_consolidado
  rh.headcount_mensal
  operacoes.producao_diaria
```

### Como as queries se conectam a bancos externos?

Quando quiser substituir os dados mockados por queries reais:

```python
from app.services.queries.registry import register_query
from app.services.connection_service import get_connection, get_decrypted_password
from app.core.database import async_session_factory

@register_query("comercial.vendas_mensal")
async def vendas_mensal(params: dict) -> list[dict]:
    # Buscar a conexão configurada
    async with async_session_factory() as db:
        conexao = await get_connection(db, connection_id=1)
        senha = get_decrypted_password(conexao)

    # Conectar ao banco externo e executar a query
    # (use asyncpg, cx_Oracle, etc. conforme o tipo)
    # ...
    return resultados
```

---

## Power BI Embed

### Como funciona?

1. Widget do tipo `"powerbi"` armazena `report_id` e `dataset_id` nos parâmetros
2. O front chama `GET /dashboards/{id}/embed-token`
3. O back-end autentica no Azure AD (client credentials) e gera o Embed Token
4. O front usa o token para renderizar o relatório Power BI embutido

### Configuração

1. Crie um **Service Principal** no Azure AD
2. Registre o app no Power BI (Admin Portal → Tenant settings)
3. Preencha no `.env`: `POWERBI_CLIENT_ID`, `POWERBI_CLIENT_SECRET`, `POWERBI_TENANT_ID`

### Cadastrar um widget Power BI

```bash
curl -X POST http://localhost:8000/dashboards/1/widgets \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dashboard_id": 1,
    "tipo": "powerbi",
    "parametros": {
      "report_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "dataset_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
    },
    "posicao_grid": {"x": 0, "y": 0, "w": 12, "h": 8}
  }'
```

---

## Segurança

### Resumo das proteções

| Proteção | Onde | Como |
|---|---|---|
| **Senhas de usuário** | `app/core/security.py` | Hash com bcrypt (irreversível) |
| **Senhas de conexão** | `app/utils/crypto.py` | Criptografia Fernet (reversível, com chave mestra) |
| **Autenticação** | `app/core/deps.py` | JWT (access + refresh tokens) |
| **Autorização** | `app/core/deps.py` | RBAC — verificação de permissões por grupo |
| **Acesso intranet** | `app/middleware/security.py` | IP da intranet + dashboard público = acesso sem login |
| **CORS** | `app/main.py` | Restrição de origens (apenas front-ends permitidos) |
| **SQL Injection** | SQLAlchemy | Queries parametrizadas (o ORM protege automaticamente) |
| **Validação** | Pydantic | Todos os inputs são validados antes de chegar ao service |
| **Erros** | `app/main.py` | Exception handlers globais (nunca expõe stack trace ao client) |
| **Logging** | `app/middleware/logging.py` | request_id único por requisição para rastreabilidade |

### Respostas de erro padronizadas

Todos os erros seguem o formato:

```json
{
  "detail": "Mensagem descritiva do erro",
  "error_code": "VALIDATION_ERROR",
  "status_code": 422
}
```

| Código HTTP | error_code | Quando |
|---|---|---|
| `401` | `UNAUTHORIZED` | Token ausente ou inválido |
| `403` | `FORBIDDEN` | Sem permissão para a ação |
| `404` | `NOT_FOUND` | Recurso não existe |
| `422` | `VALIDATION_ERROR` | Dados inválidos no request |
| `500` | `DATABASE_ERROR` | Erro no banco de dados |
| `500` | `CONNECTION_ERROR` | Erro em serviço externo |
| `500` | `INTERNAL_ERROR` | Qualquer erro não tratado |

---

## Testes

### Como rodar os testes

```bash
# Rode todos os testes
pytest

# Rode com output detalhado
pytest -v

# Rode apenas um arquivo
pytest tests/test_services.py
pytest tests/test_endpoints.py

# Rode apenas um teste específico
pytest tests/test_services.py::TestPasswordHashing::test_hash_and_verify
```

### Estrutura dos testes

| Arquivo | Tipo | O que testa |
|---|---|---|
| `test_services.py` | Unitário | Hash de senhas, JWT, criptografia Fernet |
| `test_endpoints.py` | Integração | Login, CRUD de usuários, dashboards, áreas, auditoria |

### Como os testes funcionam?

Os testes usam um **banco SQLite em memória** (não precisa de PostgreSQL rodando). A configuração está em `tests/conftest.py`:

- `db_session`: Sessão de banco de teste
- `client`: Cliente HTTP que chama a API
- `admin_user`: Cria um usuário admin automaticamente
- `auth_headers`: Faz login e retorna os headers com token

### Exemplo de fixture:

```python
# Isso acontece automaticamente antes de cada teste:
# 1. Cria as tabelas em memória
# 2. Cria um grupo "admin" com todas as permissões
# 3. Cria um usuário admin (admin@test.com / admin123)
# 4. Faz login e pega o token
# 5. Você usa auth_headers para chamar endpoints autenticados
```

### Para adicionar um novo teste

```python
# tests/test_endpoints.py (rode de dentro de backend/)

@pytest.mark.asyncio
class TestMinhaNovaFeature:
    async def test_algo(self, client: AsyncClient, auth_headers: dict):
        resp = await client.get("/minha-rota", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["chave"] == "valor_esperado"
```

---

## Docker

### Dockerfile (multi-stage)

O Dockerfile usa **duas etapas** para otimizar a imagem:

1. **Build stage**: instala as dependências Python
2. **Runtime stage**: copia só o necessário (imagem menor e mais segura)

### Comandos úteis

```bash
# Subir tudo (PostgreSQL + app)
docker compose up --build

# Subir em background (não trava o terminal)
docker compose up --build -d

# Ver logs
docker compose logs -f app

# Parar tudo
docker compose down

# Parar e apagar dados do banco
docker compose down -v

# Rebuild apenas a app (se mudou código)
docker compose build app
docker compose up -d app
```

### Habilitar Redis

Edite `docker-compose.yml` e descomente o serviço Redis:

```yaml
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped
```

E configure no `.env`:

```
REDIS_URL=redis://redis:6379
```

---

## Glossário

| Termo | Significado |
|---|---|
| **API** | Interface de Programação de Aplicações — conjunto de endpoints que o front pode chamar |
| **BFF** | Backend for Frontend — back-end projetado especificamente para atender um front-end |
| **CRUD** | Create, Read, Update, Delete — as 4 operações básicas de qualquer entidade |
| **JWT** | JSON Web Token — token assinado usado para autenticação |
| **RBAC** | Role-Based Access Control — controle de acesso baseado em papéis/grupos |
| **ORM** | Object-Relational Mapping — mapeia tabelas do banco para classes Python (SQLAlchemy) |
| **Migration** | Arquivo que descreve mudanças na estrutura do banco (Alembic) |
| **Middleware** | Código que intercepta todas as requisições antes/depois de chegar ao endpoint |
| **TTL** | Time To Live — tempo que um dado fica no cache antes de expirar |
| **Fernet** | Algoritmo de criptografia simétrica (mesma chave para encriptar e decriptar) |
| **Endpoint** | Uma URL específica da API (ex: `GET /dashboards/catalog`) |
| **Schema** | Definição do formato dos dados (Pydantic valida automaticamente) |
| **Service** | Camada que contém a lógica de negócio (entre o router e o banco) |
| **Registry** | Dicionário central que mapeia chaves de query para funções |
| **Fixture** | Dados/configuração criados automaticamente para testes |
| **Async** | Assíncrono — permite processar múltiplas requisições simultaneamente |
| **Hash** | Transformação irreversível (ex: senha → hash, mas hash → senha é impossível) |
| **Embed Token** | Token do Power BI que permite embutir um relatório em outra aplicação |
