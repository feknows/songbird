# Changelog

## [1.3.0] — 2026-07-15

### Refatorado
- CSS extraído de `index.html` para 6 arquivos separados: `base.css`, `layout.css`, `components.css`, `pages.css`, `rotina.css`, `themes.css`
- JavaScript extraído de `index.html` para 10 módulos: `supabase-init.js`, `utils.js`, `auth.js`, `nav.js`, `rotina.js`, `config.js`, `vendas.js`, `equipamentos.js`, `tarefas.js`, `distribuicao.js`
- `index.html` reduzido de ~5060 para ~990 linhas (apenas HTML + referências)
- Funções reorganizadas por domínio (rotina, vendas, distribuição, equipamentos, tarefas, config)

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
