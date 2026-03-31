Prompt 1: Back-end (O Cérebro, Cache Dinâmico e Preferências)
Atue como um Arquiteto de Software Sênior especialista em Python (FastAPI) e PostgreSQL.
Preciso criar o back-end de um portal de dados corporativo pronto para rodar em Docker (Linux) ou local (windows). Use a biblioteca pathlib.

0. Estrutura do Projeto (Monorepo) e Configuração:

O projeto segue uma estrutura de **monorepo** com pastas separadas para back-end e front-end:

```
001_aprendendo/                 # raiz do monorepo
├── backend/                    # ← TUDO do back-end fica aqui
│   ├── app/
│   │   ├── core/               # config (Settings), segurança, dependências globais
│   │   ├── models/             # modelos SQLAlchemy
│   │   ├── schemas/            # schemas Pydantic (request/response)
│   │   ├── routers/            # endpoints agrupados por domínio
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── areas.py
│   │   │   ├── dashboards.py
│   │   │   ├── widgets.py
│   │   │   ├── connections.py
│   │   │   ├── powerbi.py
│   │   │   ├── audit.py
│   │   │   └── health.py
│   │   ├── services/           # lógica de negócio e queries protegidas (BFF)
│   │   │   ├── auth_service.py
│   │   │   ├── dashboard_service.py
│   │   │   ├── connection_service.py
│   │   │   ├── powerbi_service.py
│   │   │   ├── audit_service.py
│   │   │   └── queries/        # queries SQL organizadas por área/domínio
│   │   │       ├── __init__.py # importa todos os módulos de query para registro automático
│   │   │       ├── registry.py # registry central: mapeia query_service_key → função
│   │   │       ├── comercial.py
│   │   │       ├── financeiro.py
│   │   │       ├── operacoes.py
│   │   │       ├── rh.py
│   │   │       └── ...         # um arquivo por área/domínio (escala horizontal)
│   │   ├── cache/              # camada de cache com interface abstrata
│   │   ├── middleware/         # middlewares (segurança, CORS, logging)
│   │   ├── utils/              # helpers (criptografia Fernet, etc.)
│   │   └── main.py            # entry point FastAPI
│   ├── alembic/                # migrações de banco
│   ├── tests/                  # testes automatizados
│   ├── .env                    # variáveis de ambiente (NÃO commitar)
│   ├── .env.example            # modelo das variáveis
│   ├── alembic.ini
│   ├── requirements.txt
│   ├── pyproject.toml
│   ├── Dockerfile
│   └── venv/                   # ambiente virtual Python (local)
├── frontend/                   # ← TUDO do front-end fica aqui (Next.js)
│   └── ...                     # criado pelo Prompt 2
├── docker-compose.yml          # orquestra backend + banco (+ frontend no futuro)
├── 01_backend.md               # instruções de criação
├── 02_front.md
├── 03_graficos.md
└── README.md                   # documentação geral
```

**Importante:** Todo código Python, configs e testes do back-end ficam dentro de `backend/`. O `docker-compose.yml` fica na raiz do monorepo pois orquestra múltiplos serviços.

Crie o arquivo `backend/app/services/queries/__init__.py` que importa todos os módulos de query para que o decorator `@register_query` seja executado ao iniciar a aplicação:

```python
from app.services.queries import comercial, financeiro, operacoes, rh  # noqa: F401
```

Ao adicionar uma nova área, basta criar o arquivo e adicioná-lo neste import.

Crie uma classe Settings usando pydantic-settings (BaseSettings) que leia do .env todas as variáveis: DATABASE_URL, REDIS_URL (opcional), SECRET_KEY (JWT), FERNET_KEY, ALLOWED_INTRANET_CIDRS, CORS_ORIGINS, POWERBI_CLIENT_ID, POWERBI_CLIENT_SECRET, POWERBI_TENANT_ID.

Forneça um arquivo .env.example documentando cada variável.

1. Modelagem (SQLAlchemy) e Arquitetura BFF:

Crie tabelas para:
- Usuários (id, nome, email, senha_hash, ativo, grupo_id)
- Grupos de Acesso / RBAC (id, nome, permissões como lista: view_dashboard, edit_dashboard, manage_users, manage_connections)
- Áreas/Departamentos (id, nome, icone) — para organizar a sidebar do front-end
- Dashboards (id, nome, descricao, is_public, taxa_atualizacao_minutos, area_id FK, criado_por FK)
- Widgets (id, dashboard_id FK, tipo [nativo, powerbi], query_service_key, parametros JSON, posicao_grid JSON)
- Conexões (id, nome, tipo [fabric, oracle, postgres], host, porta, database, usuario, senha_criptografada)
- LogAcesso (id, usuario_id FK nullable, ip, pagina texto, dashboard_id FK nullable, acao [page_view, dashboard_view, login, logout], created_at timestamp com default now) — registra cada acesso do usuário, origem [intranet ou fora], aparelho [desktop, tablet, mobile]. Gravar de forma assíncrona (background task) para não impactar a latência da requisição.

Crie uma tabela PreferenciasUsuario (ou campo JSON) para armazenar o estado do layout do dashboard pessoal (Homebroker) do usuário. O JSON deve ser compatível com o formato do react-grid-layout.

Crie Schemas Pydantic de request e response para cada entidade (Create, Update, Read), garantindo validação automática e documentação OpenAPI.

Configure Alembic com autogenerate a partir dos modelos SQLAlchemy para gerenciar migrações do banco.

O back-end atuará como um BFF. As queries SQL não virão do front-end. O back-end terá uma camada de Services onde as queries para os bancos externos (Fabric, Oracle, Postgres) ficarão protegidas.

Registry de Queries (services/queries/registry.py):

Como os dashboards podem ser inúmeros (dezenas ou centenas), cada um com widgets que apontam para um query_service_key, implemente um padrão Registry:

- Crie um dicionário central QUERY_REGISTRY: dict[str, Callable] que mapeia cada query_service_key (ex: "comercial.vendas_mensal", "financeiro.fluxo_caixa") para a função async que executa a query e retorna os dados.
- Cada arquivo em services/queries/ (ex: comercial.py) define suas funções de query e as registra no registry via decorator @register_query("comercial.vendas_mensal") ou chamada explícita no __init__.
- O endpoint GET /dashboards/{id}/data recebe o query_service_key do widget, busca no QUERY_REGISTRY e executa. Se a key não existir, retorne 404 com mensagem clara.
- Para adicionar um novo dashboard/widget: basta criar as funções de query no arquivo da área correspondente (ou criar um novo arquivo de área), registrar as keys, e cadastrar o dashboard/widgets no banco. Zero alteração nos routers.

Convenção de nomenclatura das keys: "area.nome_query" (ex: "comercial.vendas_por_loja", "rh.headcount_mensal", "financeiro.dre_consolidado").

2. Cache de Performance Dinâmico (TTL):

Implemente uma camada de Cache com interface abstrata (protocolo/ABC). A implementação padrão será in-memory (dict com TTL). A interface deve permitir trocar para Redis (fastapi-cache2) sem alterar os services.

Aplique o cache nos endpoints que retornam os dados dos gráficos.

A regra do TTL (Time to Live) deve ser dinâmica: leia o campo taxa_atualizacao_minutos do dashboard associado. Se possuir valor, use-o como TTL. Se for nulo ou 0, defina o TTL padrão para 24 horas (86400 segundos).

3. Autenticação e Autorização:

Implemente autenticação por JWT com os seguintes endpoints:
- POST /auth/login — recebe email/senha, retorna access_token + refresh_token
- POST /auth/refresh — recebe refresh_token, retorna novo access_token

Crie uma dependência get_current_user (via Depends do FastAPI) que decodifica o JWT e retorna o usuário autenticado.

Crie uma dependência check_permission(permissao: str) que verifica se o grupo do usuário ou usuario possui a permissão necessária. Retorne 403 se não possuir.

Abstraia o provider de autenticação (interface/protocolo) para permitir integração futura com LDAP/Active Directory sem alterar os routers.

4. Segurança e Intranet:

Senhas das conexões externas salvas no Postgres devem ser criptografadas (Fernet/Chave Mestra via .env).

Middleware de Segurança: Rota sem JWT? Verifique se o IP é da Intranet (ex: 10.x.x.x, configurável via ALLOWED_INTRANET_CIDRS) E se o dashboard é is_public=True. Se sim, permita. Se não, erro 401.

Configure CORSMiddleware com origens permitidas lidas do .env (CORS_ORIGINS).

Adicione exception handlers globais para erros de validação (422), banco de dados (500) e conexões externas, retornando respostas JSON padronizadas com campos: detail, error_code, status_code.

5. Endpoints da API:

Implemente os seguintes grupos de rotas:

Auth:
- POST /auth/login
- POST /auth/refresh

Usuários:
- GET /users/me — dados do usuário logado
- CRUD /users (somente para grupo com manage_users)

Áreas:
- GET /areas — lista áreas/departamentos (para popular a sidebar do front)

Dashboards:
- GET /dashboards/catalog — com paginação (limit/offset), busca por nome (?search=) e filtro por área (?area_id=)
- CRUD /dashboards (permissão edit_dashboard)

Layout/Preferências:
- GET /users/me/layout — retorna JSON do layout do Homebroker
- PUT /users/me/layout — salva JSON do layout (recebido do react-grid-layout via debounce do front)

Conexões:
- CRUD /connections (permissão manage_connections, senhas criptografadas no response nunca são expostas)

Dados/Gráficos:
- GET /dashboards/{id}/data — retorna dados dos widgets nativos (com cache dinâmico)
- GET /dashboards/{id}/widgets — retorna configuração dos widgets do dashboard

Power BI:
- GET /dashboards/{id}/embed-token — gera e retorna o Embed Token via Azure AD / Power BI REST API (usando POWERBI_CLIENT_ID, POWERBI_CLIENT_SECRET, POWERBI_TENANT_ID do .env)

Auditoria / Log de Acesso:
- POST /audit/log — registra um acesso (chamado pelo front a cada navegação). Body: { pagina, dashboard_id? }. A gravação deve ser feita via BackgroundTask do FastAPI para não bloquear o response. O usuario_id e ip são extraídos automaticamente do JWT e do request.
- GET /audit/logs — consulta logs de acesso com filtros: ?usuario_id=, ?dashboard_id=, ?data_inicio=, ?data_fim=, paginado (limit/offset). Permissão: manage_users.

Health:
- GET /health — status da aplicação, conexão com banco e cache

6. Docker e Infraestrutura:

Crie um Dockerfile multi-stage (build + runtime) otimizado para produção dentro de `backend/`.

O `docker-compose.yml` fica na **raiz do monorepo** (fora de `backend/`) com build context apontando para `./backend`. Inclua os serviços: app (FastAPI), postgres e redis (opcional, comentado por padrão).

O comando de inicialização deve rodar as migrações Alembic automaticamente antes de subir a aplicação.

7. Logging e Observabilidade:

Configure logging estruturado (structlog ou loguru) com um request_id único por requisição, propagado via middleware.

8. Testes:

Exija testes unitários nos services (lógica de negócio) e testes de integração nos endpoints usando pytest + httpx AsyncClient com banco de teste isolado.

9. Dados Iniciais (Seed):

Crie um script ou instrução para popular o banco com dados iniciais obrigatórios:

- **Grupo "admin"** com todas as permissões: `["view_dashboard", "edit_dashboard", "manage_users", "manage_connections"]`
- **Grupo "visualizador"** com permissão: `["view_dashboard"]`
- **Usuário admin** (nome: Administrador, email: admin@portal.com, senha: admin123, ativo: true, grupo: admin)
- **Áreas padrão**: Comercial (icone: chart-bar), Financeiro (icone: dollar-sign), RH (icone: users), Operações (icone: cog)

Esses dados são necessários para que o sistema funcione na primeira execução.