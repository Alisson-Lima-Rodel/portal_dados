Prompt 3: Motor de Gráficos e Visualização (O Painel)
Atue como um Especialista em Visualização de Dados utilizando React, TypeScript, Tremor, Recharts, TanStack Query (React Query) e Power BI Embedded.
Preciso implementar o motor de renderização de painéis corporativos. Siga estas diretrizes de performance e UX.
Todos os componentes devem ser tipados com as interfaces TypeScript definidas em types/ (Widget, Dashboard, LayoutPreferences, etc.), espelhando os schemas do backend.

**Nota:** Todo o código deste prompt fica dentro de `frontend/src/` (ver estrutura do monorepo no Prompt 2).

1. O "Homebroker" e Persistência de Layout:

Crie a página inicial (/home) com dois blocos principais:

Buscador de Dashboards (topo da página):
Crie um componente <DashboardSearch /> no topo da Home. Utilize um campo de busca (Shadcn Command/Combobox ou Input com autocomplete) que consulta GET /dashboards/catalog?search={termo}&limit=5 com debounce (300ms) conforme o usuário digita. Exiba os resultados em um dropdown instantâneo mostrando: nome do dashboard, área/departamento e badge indicando o tipo (nativo ou Power BI). Ao selecionar um resultado, navegue para /dashboard/{id}. Atalho de teclado: Ctrl+K (ou Cmd+K no Mac) abre o buscador em qualquer página (implementar via CommandDialog do Shadcn no layout raiz).

Grid do Homebroker (abaixo do buscador):
Area onde o usuário pode fixar KpiCards e gráficos.

Utilize <ResponsiveGridLayout> (da lib react-grid-layout) para adaptação automática Desktop/Tablet/Mobile.

Fluxo de dados com os endpoints do backend:
- Ao carregar a página, busque o layout salvo via GET /users/me/layout. Se não houver layout salvo (primeira vez), use um layout padrão.
- Busque os widgets do dashboard via GET /dashboards/{id}/widgets. O response contém a lista de widgets com: tipo (nativo | powerbi), query_service_key, parametros JSON, posicao_grid JSON.
- No evento onLayoutChange, implemente uma função com Debounce (ex: 2000ms) que envie o novo layout JSON para PUT /users/me/layout.
- Mostre um Toast (Shadcn) de confirmação quando o layout for salvo com sucesso, e Toast de erro em caso de falha.

2. Widget Factory (Renderização Dinâmica):

Crie um componente <WidgetRenderer widget={widget} /> (em components/charts/WidgetRenderer.tsx) que atua como factory/dispatcher:
- Se widget.tipo === "nativo" e widget.parametros.chartType é um tipo de gráfico (Bar, Line, Area, Pie, Donut) → renderiza <NativeChartWidget />
- Se widget.tipo === "nativo" e widget.parametros.chartType === "kpi" → renderiza <KpiCard />
- Se widget.tipo === "powerbi" → renderiza <PowerBIEmbed />
- Se tipo desconhecido → renderiza um fallback com mensagem de "Widget não suportado"

Escalabilidade: Este é o único ponto de despacho. Dashboards inúmeros (dezenas/centenas) todos convergem aqui. A rota [dashboardId]/page.tsx faz:
1. GET /dashboards/{id}/widgets → recebe lista de widgets
2. Para cada widget, renderiza <WidgetRenderer widget={widget} />
3. O WidgetRenderer escolhe o componente correto baseado em tipo + parametros

Adicionar um novo dashboard NÃO requer criar novos componentes — basta cadastrar dashboard + widgets no backend com os query_service_keys e chartTypes corretos.

Cada widget deve ser envolvido por um Error Boundary individual (components/widgets/WidgetErrorCard.tsx), para que um widget com erro não derrube os demais.

Cada widget deve exibir estados visuais (usando componentes de components/widgets/):
- Loading: <WidgetSkeleton /> com as dimensões do widget no grid
- Erro: <WidgetErrorCard /> com mensagem e botão "Tentar novamente" (retry da query)
- Sem dados: mensagem amigável "Nenhum dado disponível"

3. KPI Cards:

Crie um componente <KpiCard /> utilizando Tremor (Card + Badge + DeltaBar/DeltaType).

Props: titulo, valor_atual, valor_anterior (opcional, para cálculo de delta/variação %), icone, cor_destaque.

Se valor_anterior for fornecido, mostre a variação percentual com indicador visual (verde positivo, vermelho negativo, cinza neutro).

Os dados vêm do mesmo endpoint GET /dashboards/{id}/data, filtrados pelo query_service_key do widget.

4. Renderização Nativa e Gestão de Dados (React Query):

Crie o componente <NativeChartWidget />. Utilize Recharts/Tremor adaptados para a paleta de cores (Verde/Amarelo) configurada no Tailwind.

O componente deve suportar os tipos de gráfico: BarChart, LineChart, AreaChart, PieChart, DonutChart. O tipo é definido em widget.parametros.chartType.

Utilize TanStack Query (React Query) para buscar os dados de GET /dashboards/{id}/data, passando o query_service_key do widget.

Regra de refetchInterval: leia a taxa_atualizacao_minutos vinda do backend (campo do dashboard). Se for 0 ou nula, o refetchInterval é false (polling desativado, busca apenas 1 vez). Se possuir valor, converta para milissegundos (valor * 60 * 1000).

Os gráficos devem se adaptar ao Dark Mode: detectar o tema atual (via ThemeContext ou classe do Tailwind) e ajustar cores de fundo, grid lines, labels e tooltips automaticamente.

Os gráficos devem redimensionar responsivamente ao resize do container no grid-layout. Utilize a prop <ResponsiveContainer width="100%" height="100%"> do Recharts.

Adicione um botão de edição (ícone engrenagem) no header do widget que abra um modal (Shadcn Dialog) para o usuário alterar parâmetros básicos: tipo de gráfico, cores, título. As alterações devem ser salvas no backend via PUT no endpoint correspondente do widget.

5. Chart Templates (Presets na Aplicação):

Implemente um sistema de templates visuais de gráficos como constantes da aplicação front-end (sem banco de dados). Isso garante versionamento no código, zero latência e consistência entre ambientes.

Estrutura de arquivos (dentro de `frontend/`):

```
frontend/src/
├── config/
│   └── chart-templates/
│       ├── index.ts              # exporta registry com todos os templates
│       ├── types.ts              # interface ChartTemplate
│       ├── bar-comercial.ts      # preset individual
│       ├── line-financeiro.ts    # preset individual
│       ├── area-operacoes.ts     # preset individual
│       └── ...                   # um arquivo por template
```

Interface ChartTemplate (em types.ts):
```ts
interface ChartTemplate {
  id: string;                    // slug único (ex: "bar-comercial")
  nome: string;
  descricao: string;
  chartType: "BarChart" | "LineChart" | "AreaChart" | "PieChart" | "DonutChart";
  config: {
    cores: string[];             // paleta de cores das séries
    legendPosition: "top" | "bottom" | "left" | "right" | "none";
    showGrid: boolean;
    showTooltip: boolean;
    strokeWidth: number;
    fillOpacity: number;
    borderRadius: number;
    // extensível: novas props visuais podem ser adicionadas
  };
  thumbnail?: string;            // path para imagem de preview (em public/)
}
```

Registry (index.ts): Exporte um Map/Record indexado por id e uma função getTemplatesByChartType(chartType) que filtra os templates pelo tipo de gráfico.

Componentes:

- <ChartTemplatePicker chartType={tipo} onSelect={fn} />: Galeria/dropdown no modal de edição do widget. Lê os templates do registry local (import direto, sem API call). Filtra por chartType do widget atual. Exibe cada template como card de preview com miniatura, nome e descrição. Ao selecionar, chama onSelect(template.config) e o widget é re-renderizado com a nova configuração.

Fluxo no modal de edição do widget:
1. Usuário clica na engrenagem → abre modal de edição
2. Aba "Manual": ajusta parâmetros individualmente (já existente na seção 4)
3. Aba "Templates": exibe <ChartTemplatePicker /> com os presets disponíveis
4. Ao aplicar um template, os parâmetros visuais do widget.parametros são sobrescritos pelo config do template
5. As alterações são salvas no backend via PUT no endpoint do widget (o campo parametros JSON já comporta a config)
6. O widget mantém seus dados (query_service_key) — apenas a aparência muda

Adicionar novos templates: Basta criar um novo arquivo .ts em config/chart-templates/ seguindo a interface, importá-lo no index.ts e ele aparece automaticamente no <ChartTemplatePicker />. Sem migrações, sem deploy de backend.

Benefício: Padrões visuais (ex: "Barras Comercial", "Linha Financeiro") ficam versionados no código, aplicáveis a qualquer widget nativo de qualquer dashboard, garantindo consistência visual entre painéis.

6. Power BI Embedded:

Crie o componente <PowerBIEmbed /> usando powerbi-client-react.

Fluxo de integração com o backend:
- Busque o Embed Token via GET /dashboards/{id}/embed-token.
- O response contém: embedUrl, accessToken, reportId, tokenExpiry.
- Configure o componente powerbi-client-react com esses valores.

Gestão do token:
- Monitore a expiração do token (tokenExpiry). Antes de expirar (ex: 5 minutos antes), busque automaticamente um novo token via o mesmo endpoint.
- Enquanto o token é renovado, mantenha o relatório visível (não mostre loading).

Estados visuais:
- Loading: skeleton com dimensões do widget
- Erro de token/conexão: card com mensagem "Não foi possível carregar o relatório" e botão "Tentar novamente"

7. Acessibilidade nos Gráficos:

Adicione aria-label descritivo em cada widget (ex: "Gráfico de barras - Vendas por mês").
Os KpiCards devem ter role="status" e aria-live="polite" para anunciar atualizações de valor a leitores de tela.
Garanta contraste adequado de cores seguindo WCAG 2.1 AA.