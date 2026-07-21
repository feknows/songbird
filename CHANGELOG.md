# Changelog

## [2.0.0] — 2026-07-21

### Redesign
- Novo design system "Stripe Canvas" — minimalista quente
- Paleta: cream (#EFECE3) como fundo, azul escuro (#4A70A9) como acento primário, azul médio (#8FABD4) como secundário
- Tipografia: Sora (corpo) e JetBrains Mono (mono) via Google Fonts
- Sombras sutis (0 1px 3px rgba(0,0,0,0.06)) em cards e painéis
- Bordas arredondadas (8px) em todos os componentes
- Top nav renomeado de `.mode-bulma-nav` para `.sb-nav`
- Breadcrumb renomeado de `.mode-bulma-breadcrumb` para `.sb-breadcrumb`
- Login com card branco e sombra sobre fundo cream
- Botões com hover states usando `var(--primary-dim)` em vez de opacidade
- Modais com backdrop-filter blur e sombra sutil
- Kanban cards com sombra leve em hover
- Agenda mantém layout 3-colunas com novo visual
- Perigo (#C45B4A) e sucesso (#5A8F6A) como tons quentes complementares

## [1.5.0] — 2026-07-15

### Removido
- Todos os temas exceto Bulma Light (Classic, Terminal, Dark removidos)
- Botões de toggle de tema (sidebar e nav)
- Sidebar lateral (navegação movida para top nav Bulma)
- Estilos `.mode-terminal`, `.mode-classic`, `.mode-dashboard`
- Função `toggleModo()` e `initModo()`

### Simplificado
- Layout do app agora usa apenas top nav Bulma Light
- Login simplificado (sem ASCII art, labels claros)
- `layout.css` reduzido (sem estilos de sidebar/terminal)
- `auth.js` limpo de refs ao sidebar removido

## [1.4.0] — 2026-07-15

### Adicionado
- Nova página "Agenda" inspirada no Todoist para gestão de tempo
- Layout com sidebar (filtros + projetos), lista de tarefas e painel de detalhes
- Filtros: Hoje, Amanhã, Próximos 7 dias, Todas
- Projetos com cores personalizáveis
- Tarefas com prioridade (1-4), data de vencimento, recorrência (diária/semanal/mensal)
- Subtarefas via self-referencing
- Arrastar para reordenar (SortableJS)
- Modal de criação de tarefa com todos os campos
- Edição inline via painel de detalhes

### Removido
- Rotina Comercial (KPIs, blocos de tempo, checklists) — substituída pela Agenda
- `rotina.js`, `rotina.css` removidos

## [1.3.0] — 2026-07-15

### Refatorado
- CSS extraído de `index.html` para 6 arquivos separados: `base.css`, `layout.css`, `components.css`, `pages.css`, `themes.css`
- JavaScript extraído de `index.html` para 10 módulos: `supabase-init.js`, `utils.js`, `auth.js`, `nav.js`, `config.js`, `vendas.js`, `equipamentos.js`, `tarefas.js`, `distribuicao.js`
- `index.html` reduzido de ~5060 para ~990 linhas (apenas HTML + referências)
- Funções reorganizadas por domínio (vendas, distribuição, equipamentos, tarefas, config)

## [1.2.1] — 2026-06-19

### Corrigido
- Fundo da listagem de produtos em Config > Produtos usando variáveis CSS em vez de hardcoded
- Cores dos badges e bordas passam a usar `var(--green-hairline)` / `var(--green-dim)`
- Temas agora sobrescrevem `--green-*` para o accent correto em cada modo (Bulma usa teal)

## [1.2.0] — 2026-06-15

### Adicionado
- Novo tema Bulma (claro + escuro) inspirado no Bulma CSS Framework
- Top nav horizontal (layout moderno, sidebar oculta no modo Bulma)
- Ciclo de 5 modos: Dashboard → Classic → Terminal → Bulma Light → Bulma Dark
- Suporte responsivo com hamburger menu no modo Bulma
- Novas variáveis CSS: `--accent` (teal), `--radius`, `--shadow`, `--font-body`

## [1.1.0] — 2026-06-11

### Adicionado
- Kanban de tarefas diárias com drag-and-drop (SortableJS)
- Colunas customizáveis (adicionar, renomear, reordenar, alterar cor, excluir)
- Histórico de movimentações com código do cliente
- Filtro de exibição: Ativas | Inativas | Todas
- Modal de criação/edição de tarefa com campos completos
- Gerenciamento de colunas via modal com SortableJS
- Versionamento visível do app (sidebar + terminal)

## [1.0.0] — 2026-05-20

### Adicionado
- Release inicial do SongBird
- Autenticação com Supabase Auth (Email/Password)
- Cadastro de vendas com produtos, faixas e módulos
- Distribuição de vendas
- Gerenciamento de equipamentos
- Sistema de leads
- Três modos de visualização: Dashboard, Terminal, Classic
- Suporte a GitHub Pages (static single-page app)
