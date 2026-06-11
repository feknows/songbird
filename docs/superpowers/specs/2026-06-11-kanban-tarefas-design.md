# Kanban de Tarefas — Design

## Objetivo

Quadro Kanban pessoal para tarefas diárias de trabalho dentro do SongBird, com
persistência no Supabase, colunas customizáveis, drag-and-drop, e histórico de
movimentações.

## Abordagem escolhida: B — SortableJS

- **Drag-and-drop** via SortableJS (CDN) para suporte nativo a touch e menos
  boilerplate.
- **Modal** para criar/editar tarefas (mesmo padrão dos modais existentes).
- **Sem framework** — vanilla JS, como todo o projeto.

## Schema

### Tabela `public.tarefas`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | `BIGINT PK` | Gerado por identity |
| titulo | `TEXT NOT NULL` | Título da tarefa |
| prioridade | `TEXT NOT NULL DEFAULT 'media'` | `'alta'`, `'media'` ou `'baixa'` |
| status | `TEXT NOT NULL DEFAULT 'A Fazer'` | Nome da coluna atual |
| ordem | `INTEGER NOT NULL DEFAULT 0` | Ordem dentro da coluna |
| nome_cliente | `TEXT DEFAULT ''` | Nome do cliente |
| codigo_cliente | `TEXT DEFAULT ''` | Código do cliente |
| telefone | `TEXT DEFAULT ''` | Telefone do cliente |
| data_vencimento | `DATE` | Data de vencimento |
| descricao | `TEXT DEFAULT ''` | Descrição da tarefa |
| resumo | `TEXT DEFAULT ''` | Resumo curto |
| anotacoes | `TEXT DEFAULT ''` | Anotações livres |
| user_id | `UUID NOT NULL` | FK → `auth.users(id)` CASCADE |
| criado_em | `TIMESTAMPTZ DEFAULT NOW()` | Criado automaticamente |

### Tabela `public.tarefas_historico`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | `BIGINT PK` | Gerado por identity |
| tarefa_id | `BIGINT NOT NULL FK → tarefas(id) CASCADE` | Tarefa relacionada |
| acao | `TEXT NOT NULL` | `'criada'`, `'movida'`, `'editada'`, `'concluida'` |
| de_status | `TEXT` | Status anterior (movimentação) |
| para_status | `TEXT` | Novo status (movimentação) |
| user_id | `UUID` | Quem executou a ação |
| alterado_em | `TIMESTAMPTZ DEFAULT NOW()` | Quando ocorreu |

### Tabela `public.colunas` (personalização)

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | `BIGINT PK` | Gerado por identity |
| nome | `TEXT NOT NULL` | Nome da coluna |
| cor | `TEXT DEFAULT '#30d158'` | Cor da coluna (hex) |
| ordem | `INTEGER NOT NULL DEFAULT 0` | Ordem no quadro |
| user_id | `UUID NOT NULL FK → auth.users(id) CASCADE` | Dono da coluna |

### RLS

```sql
-- tarefas
CREATE POLICY "tarefas_select" ON tarefas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tarefas_insert" ON tarefas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tarefas_update" ON tarefas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "tarefas_delete" ON tarefas FOR DELETE USING (auth.uid() = user_id);

-- tarefas_historico
CREATE POLICY "tarefas_historico_select" ON tarefas_historico FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "tarefas_historico_insert" ON tarefas_historico FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- colunas
CREATE POLICY "colunas_select" ON colunas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "colunas_insert" ON colunas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "colunas_update" ON colunas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "colunas_delete" ON colunas FOR DELETE USING (auth.uid() = user_id);
```

```sql
-- GRANTs
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tarefas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tarefas_historico TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.colunas TO authenticated;
```

## Interface

### Navegação

Novo botão **Tarefas** no sidebar entre Equipamentos e Config.

### Página `#page-tarefas`

**Topo:**
- Botão "+ Nova Tarefa" → modal de criação
- Alternador "Todas / Apenas ativas"
- Botão "⚙ Gerenciar Colunas"

**Grid de colunas:**
Cada coluna:
- Cabeçalho: nome + contador + menu "⚙" (renomear/deletar) + "+"
- Cards SortableJS (grupo compartilhado)

**Card:**
- Título + badge prioridade
- Nome/cliente + código
- Telefone
- Data de vencimento
- Clique → modal edição

### Modal de tarefa

Campos: título, prioridade, status, nome_cliente, codigo_cliente, telefone,
data_vencimento, descricao, resumo, anotacoes.

### Gerenciamento de Colunas

Modal que lista colunas com ordem, cor, nome editável. Botões + e -.
Padrão: "A Fazer", "Fazendo", "Feito".

## Comportamento

### Drag-and-drop (SortableJS)

```js
Sortable.create(el, {
  group: 'tarefas',
  animation: 150,
  onEnd: async (evt) => {
    // Atualizar tarefa.status e tarefa.ordem
    // Inserir em tarefas_historico (acao = 'movida')
  }
});
```

### Histórico

Abaixo do Kanban: tabela com últimas movimentações.
Filtro "Todas / Apenas ativas" alterna a query.

### Exclusão
Modal confirmação → delete físico com cascade.

## Implementação

Tudo em `public/index.html`:
1. Schemas SQL + GRANTs
2. SortableJS CDN
3. Sidebar + página + modais (HTML)
4. CSS Kanban
5. JS: CRUD, drag-drop, histórico, filtro
