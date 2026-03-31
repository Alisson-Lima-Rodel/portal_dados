# Portal de Dados Corporativo — Front-end

Interface web do Portal de Dados Corporativo, construída com **Next.js 15** (App Router), **React 19**, **Tailwind CSS v4**, **Shadcn/UI** e **Recharts**.

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router) |
| Linguagem | TypeScript |
| Estilização | Tailwind CSS v4 (oklch) |
| Componentes | Shadcn/UI |
| Gráficos | Recharts (via Shadcn Charts) |
| Gerenciamento de Estado | TanStack Query (React Query) |
| HTTP Client | Axios (JWT interceptors) |
| Grid Layout | react-grid-layout |
| Ícones | Lucide React |
| Tema | next-themes (dark mode) |

## Estrutura de Pastas

```
src/
├── app/
│   ├── (auth)/login/           # Página de login
│   ├── (dashboard)/            # Rotas protegidas
│   │   ├── home/               # Home com busca e áreas
│   │   ├── catalog/            # Catálogo de dashboards
│   │   ├── [dashboardId]/      # Dashboard dinâmico
│   │   └── admin/
│   │       ├── users/          # CRUD de usuários
│   │       ├── connections/    # CRUD de conexões
│   │       ├── dashboards/     # CRUD de dashboards
│   │       └── audit/          # Log de acessos
│   ├── layout.tsx              # Layout raiz (providers)
│   └── page.tsx                # Redirect → /home
├── components/
│   ├── ui/                     # Shadcn/UI primitivos
│   ├── layout/                 # TopBar, Sidebar, Breadcrumbs
│   ├── charts/                 # WidgetRenderer, NativeChart, KpiCard, PowerBI
│   ├── widgets/                # WidgetHeader, EditModal, Skeleton, ErrorCard
│   └── common/                 # EmptyState, ErrorBoundary, DashboardSearch
├── config/chart-templates/     # Templates visuais de gráficos
├── contexts/                   # AuthContext
├── hooks/                      # useAuditLog
├── services/                   # API client + endpoints tipados
├── types/                      # Interfaces TypeScript
└── lib/                        # QueryClient config
```

## Pré-requisitos

- **Node.js** ≥ 18 (testado com v22.12.0)
- **npm** ≥ 9
- Backend rodando em `http://localhost:8000`

## Configuração Inicial

```bash
# 1. Entrar na pasta do frontend
cd frontend

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.local.example .env.local
# Edite se necessário: NEXT_PUBLIC_API_URL=http://localhost:8000

# 4. Rodar em modo desenvolvimento
npm run dev
```

O frontend estará disponível em **http://localhost:3000**.

## Variáveis de Ambiente

| Variável | Descrição | Padrão |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | URL base da API backend | `http://localhost:8000` |

## Scripts Disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Desenvolvimento com hot reload |
| `npm run build` | Build de produção |
| `npm start` | Servir build de produção |
| `npm run lint` | Lint com ESLint |

## Funcionalidades

### Autenticação
- Login com email/senha (JWT + refresh token automático)
- Rotas protegidas com verificação de permissão
- Logout com limpeza de tokens

### Navegação
- Sidebar dinâmica (áreas carregadas da API)
- Busca global com **Ctrl+K** (CommandDialog)
- Breadcrumbs automáticos
- Dark mode com toggle
- Sidebar colapsável em mobile (drawer)

### Dashboard
- Renderização dinâmica via WidgetRenderer (factory pattern)
- Gráficos nativos: Bar, Line, Area, Pie, Donut
- KPI Cards com variação percentual
- Power BI Embedded com refresh automático de token
- Error Boundary individual por widget
- Auto-refresh configurável (taxa_atualizacao_minutos)

### Catálogo
- Grid/Lista toggle
- Filtro por área e busca por nome
- Paginação limit/offset
- Loading skeletons

### Administração
- Gestão de Usuários (CRUD, grupos)
- Gestão de Conexões (CRUD, senha mascarada)
- Gestão de Dashboards (CRUD, áreas)
- Log de Acessos (filtros por usuário, dashboard, período)

### Chart Templates
- Templates visuais como constantes (sem banco)
- Aplicáveis via modal de edição do widget
- Extensível: crie um arquivo `.ts` em `config/chart-templates/`

## Tema (Identidade Visual)

Inspirado na identidade Quero-Quero:
- **Primário**: Verde institucional `oklch(0.45 0.15 145)`
- **Destaque**: Amarelo `oklch(0.82 0.16 85)`
- **Dark mode** completo com variáveis oklch
- Paleta de gráficos: verde, amarelo, teal, azul

## Reinício Diário

```bash
cd frontend
npm run dev
```

> O backend precisa estar rodando antes (ver README do backend).
