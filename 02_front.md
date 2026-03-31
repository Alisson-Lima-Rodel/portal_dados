Prompt 2: Front-end e Design System (A Vitrine)
Atue como um Desenvolvedor Front-end Sênior especialista em React, Next.js (App Router) e Tailwind CSS com TypeScript.
Preciso da interface de um portal de dados corporativo usando as bibliotecas Shadcn/UI e Tremor para estabelecer um Design System escalável.

0. Estrutura do Projeto (Monorepo) e Configuração:

O projeto segue uma estrutura de **monorepo**. O back-end já existe em `backend/`. O front-end deve ser criado em `frontend/` na raiz do monorepo:

```
001_aprendendo/                 # raiz do monorepo
├── backend/                    # back-end FastAPI (já criado pelo Prompt 1)
├── frontend/                   # ← TUDO do front-end fica aqui
│   ├── src/
│   │   ├── app/                # App Router (layouts, pages, loading, error)
│   │   │   ├── (auth)/         # grupo de rotas públicas (login)
│   │   │   ├── (dashboard)/    # grupo de rotas protegidas (layout com sidebar)
│   │   │   │   ├── catalog/
│   │   │   │   ├── home/
│   │   │   │   ├── admin/
│   │   │   │   │   ├── users/
│   │   │   │   │   ├── connections/
│   │   │   │   │   └── dashboards/
│   │   │   │   └── [dashboardId]/
│   │   │   │       ├── page.tsx
│   │   │   │       ├── loading.tsx
│   │   │   │       └── error.tsx
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── ui/             # Shadcn/UI primitivos
│   │   │   ├── layout/         # Sidebar, TopBar, Breadcrumbs
│   │   │   ├── catalog/        # Cards, Tabela, Filtros do catálogo
│   │   │   ├── charts/         # motor de gráficos
│   │   │   │   ├── WidgetRenderer.tsx
│   │   │   │   ├── NativeChartWidget.tsx
│   │   │   │   ├── PowerBIEmbed.tsx
│   │   │   │   ├── KpiCard.tsx
│   │   │   │   └── ChartTemplatePicker.tsx
│   │   │   ├── widgets/        # componentes auxiliares de widgets
│   │   │   │   ├── WidgetHeader.tsx
│   │   │   │   ├── WidgetEditModal.tsx
│   │   │   │   ├── WidgetSkeleton.tsx
│   │   │   │   └── WidgetErrorCard.tsx
│   │   │   └── common/         # Loading, EmptyState, ErrorBoundary
│   │   ├── config/
│   │   │   └── chart-templates/
│   │   ├── hooks/
│   │   ├── services/           # camada de API (apiClient, endpoints tipados)
│   │   ├── contexts/           # AuthContext, ThemeContext
│   │   ├── types/              # interfaces TypeScript
│   │   ├── lib/                # configurações (queryClient, axios)
│   │   └── styles/             # globals.css, tema Tailwind
│   ├── public/
│   ├── .env.local              # variáveis de ambiente do front
│   ├── .env.local.example
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── next.config.ts
│   └── Dockerfile
├── docker-compose.yml          # orquestra backend + frontend + banco
├── README.md
└── *.md                        # instruções de criação
```

**Importante:** Todo código Next.js fica dentro de `frontend/`. O `docker-compose.yml` na raiz orquestra todos os serviços. O back-end está em `backend/` e roda na porta 8000.

1. Camada de API e Autenticação:

Configure uma instância do axios (ou fetch wrapper) em lib/apiClient.ts com:
- Base URL lida de NEXT_PUBLIC_API_URL
- Interceptor de request que anexa o JWT (access_token) do localStorage/cookie em todo request
- Interceptor de response que, ao receber 401, tenta automaticamente o refresh token (POST /auth/refresh). Se falhar, redireciona para /login

Crie um AuthContext/Provider que exponha: user, login(), logout(), isAuthenticated, isLoading.
- login() chama POST /auth/login e armazena os tokens
- logout() limpa tokens e redireciona para /login

Crie um middleware Next.js (middleware.ts) ou componente ProtectedRoute que redirecione para /login se não autenticado. Para rotas admin, verifique também a permissão do grupo do usuário.

Crie a página de Login (/login) com formulário de email/senha, usando componentes Shadcn/UI. Mostre feedback de erro inline.

2. Identidade Visual:

Configure o tema do Tailwind inspirado na identidade visual das Lojas Quero-Quero. Utilize um Verde institucional forte como cor primária, amplo espaço em branco (clear design) para os fundos, e Amarelo para destaques e botões de ação (Call-to-Action).

Adicione suporte a Dark Mode via classe (class strategy do Tailwind) com toggle no TopBar.

3. Estrutura de Navegação:

Crie um layout base com:

- TopBar: logo, nome do usuário logado (de GET /users/me), botão de toggle dark mode, botão de logout.
- Sidebar de navegação lateral: As seções/áreas devem ser carregadas dinamicamente do endpoint GET /areas do backend. Cada área mostra seus dashboards como sub-itens. A sidebar deve ser colapsável em telas menores.
- Breadcrumbs: componente de navegação hierárquica (ex: Home > Comercial > Dashboard Vendas).

Tracking de Navegação (Log de Acesso):

Crie o hook useAuditLog() que, a cada mudança de rota (via usePathname do Next.js), envia automaticamente POST /audit/log com { pagina, dashboard_id } para o backend. A chamada deve ser fire-and-forget (não bloqueia navegação, sem loading). Instancie o hook no layout raiz das rotas protegidas ((dashboard)/layout.tsx), garantindo que toda navegação é logada.

Configure o TanStack Query (React Query) globalmente no layout raiz com QueryClientProvider. Defina defaults sensatos (staleTime, retry).

4. Catálogo de Dashboards:

Crie a página "Catálogo de Dashboards" (GET /dashboards/catalog). Ela deve ter:

Barra de filtros:
- Campo de busca por nome (parâmetro ?search= do backend)
- Dropdown de filtro por Área/Departamento (parâmetro ?area_id=, opções vindas de GET /areas)

Um botão de toggle que permita ao usuário alternar entre duas visualizações:

View em Grid: Utilizando Cards elegantes do Tremor (mostrar nome, descrição, área, badge público/privado).

View em Lista: Utilizando uma Tabela minimalista.

Paginação: Implemente paginação (limit/offset) sincronizada com os parâmetros do backend. Mostre contagem total de resultados.

Estados de UX:
- Loading: skeletons (Shadcn Skeleton) enquanto carrega
- Empty: mensagem amigável quando não há resultados para o filtro
- Error: componente de erro com botão "Tentar novamente"

5. Feedback e Notificações:

Utilize o componente Toast do Shadcn/UI para feedback de ações do usuário (salvar layout, erro de conexão, CRUD concluído).

Implemente Error Boundaries por seção da página para que um widget com erro não derrube a página inteira.

6. Páginas de Administração (protegidas por permissão):

Crie as seguintes páginas acessíveis somente para usuários com as permissões adequadas:

- Gestão de Usuários (/admin/users): tabela com CRUD, atribuição de grupo/permissão. (permissão: manage_users)
- Gestão de Conexões (/admin/connections): tabela com CRUD, campo de senha nunca exibido (apenas placeholder "••••••"). (permissão: manage_connections)
- Criação/Edição de Dashboard (/admin/dashboards): formulário para criar/editar dashboard (nome, descrição, área, is_public, taxa_atualizacao_minutos). (permissão: edit_dashboard)
- Log de Acessos (/admin/audit): tabela com os registros de acesso dos usuários (GET /audit/logs). Filtros por usuário, dashboard, período (data_inicio/data_fim). Paginada. (permissão: manage_users)

7. Responsividade:

Garanta que todas as páginas funcionem em Desktop (≥1024px), Tablet (768-1023px) e Mobile (<768px). A sidebar colapsa em um drawer no mobile. O catálogo em grid reduz colunas automaticamente.