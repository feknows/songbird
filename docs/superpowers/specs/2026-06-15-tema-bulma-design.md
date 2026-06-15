# Tema Bulma — Design

## Objetivo

Adicionar um novo tema inspirado no **Bulma CSS** ao SongBird, com:

1. Duas variantes: **claro** e **escuro**
2. Nova estrutura de layout: **top nav horizontal** (sem sidebar)
3. Refatoração do `mode-classic` atual (cores hardcoded → CSS custom properties)
4. Design responsivo com hamburger menu em mobile

## Abordagem escolhida

- **CSS Variables**: todo o tema Bulma (claro + escuro) via redefinição de `--*` properties no escopo `.mode-bulma`
- **Zero imports de framework**: apenas a paleta e tokens visuais do Bulma, sem carregar o CSS completo
- **Layout**: top nav horizontal fixa (`56px`), sidebar oculta, breadcrumb abaixo, footer global
- **Toggle**: ciclo expandido: `dashboard → terminal → classic → bulma-light → bulma-dark → dashboard`

## Sistema de Variáveis

### Novas variáveis em `:root`

```css
--accent:        #00d1b2;   /* Teal Bulma primary */
--accent-bright: #00e6c3;
--accent-dim:    rgba(0, 209, 178, 0.12);
--accent-hairline: rgba(0, 209, 178, 0.25);
--accent-glow:   rgba(0, 209, 178, 0.4);
--radius:        6px;
--shadow:        0 0.5em 1em -0.125em rgba(10,10,10,0.1);
--font-body:     'Nunito', 'Inter', system-ui, sans-serif;
```

### Refatoração das variáveis existentes

- `--green`, `--green-*` mantidos para compatibilidade com modos dashboard/terminal
- `--accent` é o novo token; modo Bulma usa `--accent` em vez de `--green`
- Futuramente os modos legados podem migrar para `--accent`

### `.mode-bulma` — Variantes claro/escuro

**`.bulma-light`** (herda de `.mode-bulma`):
```css
--bg-canvas:     #f5f5f5;
--bg-surface:    #ffffff;
--bg-raised:     #fafafa;
--bg-elevated:   #f5f5f5;
--text-primary:  #363636;
--text-secondary:#4a4a4a;
--text-muted:    #7a7a7a;
--danger:        #f14668;
--danger-hover:  #d9364e;
--shadow:        0 0.5em 1em -0.125em rgba(10,10,10,0.1);
```

**`.bulma-dark`** (herda de `.mode-bulma`):
```css
--bg-canvas:     #0a0a0a;
--bg-surface:    #141414;
--bg-raised:     #1c1c1c;
--bg-elevated:   #242424;
--text-primary:  #f5f5f5;
--text-secondary:#8a8a8a;
--text-muted:    #525252;
--danger:        #f14668;
--danger-hover:  #d9364e;
--shadow:        0 0.5em 1em -0.125em rgba(0,0,0,0.4);
```

**Ambos compartilham** (via `.mode-bulma`):
```css
--accent:        #00d1b2;
--accent-bright: #00e6c3;
--accent-dim:    rgba(0, 209, 178, 0.12);
--accent-hairline: rgba(0, 209, 178, 0.25);
--accent-glow:   rgba(0, 209, 178, 0.4);
--radius:        6px;
--font-body:     'Nunito', 'Inter', system-ui, sans-serif;
```

### Refatoração do `mode-classic` atual

Os ~100 overrides hardcoded são substituídos por redefinição de variáveis em `.mode-classic` (como o `.bulma-light` mas com a paleta original creme/escuro). Cada override individual vira obsoleto.

## Layout — Top Nav Horizontal

### Estrutura HTML

```html
<div class="mode-bulma-nav">
  <div class="mb-header">
    <button class="mb-hamburger" onclick="toggleHamburger()">☰</button>
    <span class="mb-logo">SongBird</span>
  </div>
  <nav class="mb-nav">
    <button class="active" data-page="home">Home</button>
    <button data-page="vendas">Vendas</button>
    <button data-page="distribuicao">Distribuição</button>
    <button data-page="equipamentos">Equipamentos</button>
    <button data-page="tarefas">Tarefas</button>
    <button data-page="config">Config</button>
  </nav>
  <div class="mb-actions">
    <span class="mb-user" id="sidebar-user"></span>
    <span class="mb-version" id="sb-footer-ver"></span>
    <button class="mode-toggle" id="mode-toggle-btn-bulma">[ ◉ Classic ]</button>
    <button onclick="fazerLogout()">Sair</button>
  </div>
</div>
```

- **`.mode-bulma-nav`**: display flex, `height: 56px`, gap entre logo/nav/actions
- **`.mb-hamburger`**: `display: none` em desktop, `display: block` em mobile
- **`.mb-nav`**: flex row com botões; item ativo com bottom-border na cor `--accent`
- **`.mb-actions`**: flex row, alinhado à direita (margin-left: auto)
- **Breadcrumb**: abaixo da nav, `padding: 0.5rem 1.5rem`, fonte menor

### CSS principal

```css
.mode-bulma .sidebar { display: none; }
.mode-bulma .topbar { display: none !important; }
.mode-bulma .wrap-sidebar-content > .main-content { margin-top: 0; }
.mode-bulma body { font-family: var(--font-body); }

.mode-bulma-nav {
  display: flex; align-items: center; height: 56px;
  padding: 0 1.5rem; background: var(--bg-surface);
  border-bottom: 1px solid var(--accent-hairline);
  gap: 1.5rem;
}

.mode-bulma-nav .mb-logo {
  font-size: 1.1rem; font-weight: 700; color: var(--accent);
  white-space: nowrap;
}

.mode-bulma-nav .mb-nav { display: flex; gap: 0.25rem; flex: 1; }
.mode-bulma-nav .mb-nav button {
  background: none; border: none; color: var(--text-secondary);
  padding: 0.5rem 1rem; cursor: pointer; font-size: 0.9rem;
  border-bottom: 2px solid transparent; font-family: var(--font-body);
  transition: color 0.15s, border-color 0.15s;
}
.mode-bulma-nav .mb-nav button:hover { color: var(--text-primary); }
.mode-bulma-nav .mb-nav button.active { color: var(--accent); border-bottom-color: var(--accent); }

.mode-bulma-nav .mb-actions {
  display: flex; align-items: center; gap: 0.75rem;
  margin-left: auto; font-size: 0.8rem;
}
.mode-bulma-nav .mb-actions .mb-user { color: var(--accent); }
.mode-bulma-nav .mb-actions .mb-version { color: var(--text-muted); }
.mode-bulma-nav .mb-actions button {
  background: none; border: 1px solid var(--accent-hairline); color: var(--text-secondary);
  padding: 0.3rem 0.75rem; border-radius: var(--radius); cursor: pointer;
  font-size: 0.75rem; font-family: var(--font-body);
}
.mode-bulma-nav .mb-actions button:hover { border-color: var(--accent); color: var(--accent); }

.mode-bulma .breadcrumb-bar {
  padding: 0.5rem 1.5rem; font-size: 0.8rem; color: var(--text-muted);
  background: var(--bg-canvas); border-bottom: 1px solid var(--accent-hairline);
}
.mode-bulma .breadcrumb-bar span { color: var(--accent); }
```

### Mobile (hamburger)

```css
.mb-hamburger {
  display: none; background: none; border: none;
  font-size: 1.3rem; color: var(--text-primary); cursor: pointer;
}

@media (max-width: 768px) {
  .mb-hamburger { display: block; }
  .mode-bulma-nav .mb-nav {
    display: none; position: fixed; top: 56px; left: 0; right: 0;
    background: var(--bg-surface); flex-direction: column;
    border-bottom: 1px solid var(--accent-hairline); z-index: 100;
  }
  .mode-bulma-nav .mb-nav.open { display: flex; }
  .mode-bulma-nav .mb-nav button { border-bottom: none; padding: 0.75rem 1.5rem; }
  .mode-bulma-nav .mb-actions { gap: 0.5rem; }
  .mode-bulma-nav .mb-actions .mb-version { display: none; }
  .mode-bulma .main-content { padding: 1rem; }
}
```

### Geração dinâmica

A nav horizontal é gerada/injetada via JS na função `initModo()` quando o modo é `bulma-light` ou `bulma-dark`. A navegação atualiza o `.active` nos botões da nav via `navegar()`.

## Toggle / Ciclo de Modos

```
dashboard → terminal → classic → bulma-light → bulma-dark → dashboard
```

### Botão toggle

No modo Bulma, o toggle usa o mesmo `#mode-toggle-btn`. Os textos:

| Modo | Texto do botão |
|------|---------------|
| `mode-dashboard` | `[ ◉ Classic ]` |
| `mode-terminal` | `[ ≡ Dashboard ]` |
| `mode-classic` | `[ >_ Terminal ]` |
| `mode-bulma` (light) | `[ ◑ Bulma Dark ]` |
| `mode-bulma` (dark) | `[ ◐ Bulma Light ]` |

### `localStorage`

- Chave `songbird-modo`: `'dashboard'`, `'terminal'`, `'classic'`, `'bulma-light'`, `'bulma-dark'`
- Se `prefers-color-scheme: dark` e modo salvo for `bulma` (sem light/dark), usar dark como padrão

## Componentes — Tokens Bulma

### Botões

```css
.mode-bulma .btn-primary {
  background: var(--accent); color: #fff; border: none;
  padding: 0.5rem 1.25rem; border-radius: var(--radius);
  font-family: var(--font-body); cursor: pointer;
}
.mode-bulma .btn-primary:hover { opacity: 0.9; }
.mode-bulma .btn-danger { background: var(--danger); color: #fff; ... }
.mode-bulma .btn-secondary { background: transparent; border: 1px solid var(--accent); color: var(--accent); ... }
```

### Cards

```css
.mode-bulma .home-card, .mode-bulma .hub-card, .mode-bulma .modulo-card {
  background: var(--bg-surface); border-radius: var(--radius);
  box-shadow: var(--shadow); border: 1px solid transparent;
  padding: 1.25rem;
}
.mode-bulma .home-card:hover, .mode-bulma .hub-card:hover {
  border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent);
}
```

### Inputs

```css
.mode-bulma .field input, .mode-bulma .field textarea, .mode-bulma .field select {
  border: 1px solid var(--text-muted); border-radius: var(--radius);
  background: var(--bg-raised); color: var(--text-primary);
  padding: 0.5rem 0.75rem; font-family: var(--font-body);
}
.mode-bulma .field input:focus {
  border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-dim);
  outline: none;
}
```

### Modal

```css
.mode-bulma .modal-box {
  border-radius: var(--radius); border: none; box-shadow: var(--shadow);
}
.mode-bulma .modal-header { border-bottom: 1px solid var(--accent-hairline); }
```

### Kanban

```css
.mode-bulma .kanban-col { background: var(--bg-raised); border-radius: var(--radius); }
.mode-bulma .kanban-card { border-radius: var(--radius); box-shadow: var(--shadow); border: none; }
```

## Escopo da Refatoração do `mode-classic`

- Substituir os ~100 overrides individuais por redefinição de variáveis em `.mode-classic`
- Paleta preservada: `#fdfcfc` (canvas), `#201d1d` (text), `#646262` (secondary), `#9a9898` (muted)
- Remover overrides de `.mode-classic .home-card`, `.mode-classic .hub-card`, etc.
- Manter apenas overrides de layout específicos (ex: `.mode-classic .topbar { display: none; }`) e `.login-classic`

## Plano de Implementação

1. Adicionar `--accent`, `--radius`, `--shadow`, `--font-body` no `:root`
2. Adicionar CSS do `.mode-bulma` + `.bulma-light` + `.bulma-dark` (variáveis)
3. Adicionar CSS da top nav horizontal e breadcrumb
4. Adicionar CSS mobile hamburger
5. Adicionar CSS de componentes (botões, cards, inputs, modal, kanban)
6. Refatorar `mode-classic` para usar variáveis
7. Atualizar `toggleModo()` e `initModo()`
8. Atualizar `navegar()` para destacar botões da top nav
9. Adicionar HTML da top nav (dinâmico via JS)
10. Testar e commit
