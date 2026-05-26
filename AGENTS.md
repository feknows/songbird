# SongBird — AGENTS.md

## Project

Sistema de registro de vendas (sales registration system). Portuguese-only (UI, code, comments).

Single-page app (`public/index.html`) no build step, talking to Supabase. Hosted on GitHub Pages.

**Leads scraper** was separated into its own project at `C:\Users\Felipe\SongBird-Leads` — see its own `AGENTS.md`.

## Supabase setup

1. Create a Supabase project.
2. Copy `.env.example` to `.env` locally (for `migrate-supabase.js`).
3. **Critical**: In `public/index.html:609-610`, replace the placeholder credentials with real Supabase URL and anon key.
4. Run the SQL below in the SQL Editor (creates schema + RLS policies):
   ```sql
   -- SongBird - Supabase Schema
   CREATE TABLE IF NOT EXISTS usuarios (
     id SERIAL PRIMARY KEY,
     nome TEXT NOT NULL UNIQUE,
     senha TEXT NOT NULL,
     permissao TEXT NOT NULL DEFAULT 'user',
     criado_em TIMESTAMPTZ DEFAULT NOW()
   );
   CREATE TABLE IF NOT EXISTS produtos (
     id SERIAL PRIMARY KEY,
     nome TEXT NOT NULL,
     tipo TEXT NOT NULL,
     ativo INTEGER DEFAULT 1,
     ordem INTEGER DEFAULT 0
   );
   CREATE TABLE IF NOT EXISTS faixas (
     id SERIAL PRIMARY KEY,
     produto_id INTEGER NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
     descricao TEXT NOT NULL,
     valor_base REAL NOT NULL DEFAULT 0,
     valor_modulo REAL NOT NULL DEFAULT 0,
     ordem INTEGER DEFAULT 0
   );
   CREATE TABLE IF NOT EXISTS modulos (
     id SERIAL PRIMARY KEY,
     produto_id INTEGER NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
     nome TEXT NOT NULL,
     ativo INTEGER DEFAULT 1,
     ordem INTEGER DEFAULT 0
   );
   CREATE TABLE IF NOT EXISTS leads (
     id SERIAL PRIMARY KEY,
     nome TEXT NOT NULL,
     telefone TEXT DEFAULT '',
     whatsapp TEXT DEFAULT '',
     site TEXT DEFAULT '',
     endereco TEXT DEFAULT '',
     avaliacao REAL,
     redes_sociais TEXT DEFAULT '',
     cidade TEXT NOT NULL,
     termo TEXT NOT NULL,
     criado_em TIMESTAMPTZ DEFAULT NOW()
   );
    GRANT USAGE ON SCHEMA public TO anon;
    GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
    ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
    ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
    ALTER TABLE faixas ENABLE ROW LEVEL SECURITY;
    ALTER TABLE modulos ENABLE ROW LEVEL SECURITY;
    ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "usuarios_select" ON usuarios;
   DROP POLICY IF EXISTS "usuarios_update" ON usuarios;
   CREATE POLICY "usuarios_select" ON usuarios FOR SELECT USING (true);
   CREATE POLICY "usuarios_update" ON usuarios FOR UPDATE USING (true) WITH CHECK (true);
   DROP POLICY IF EXISTS "produtos_all" ON produtos;
   DROP POLICY IF EXISTS "faixas_all" ON faixas;
   DROP POLICY IF EXISTS "modulos_all" ON modulos;
   CREATE POLICY "produtos_all" ON produtos FOR ALL USING (true) WITH CHECK (true);
   CREATE POLICY "faixas_all" ON faixas FOR ALL USING (true) WITH CHECK (true);
   CREATE POLICY "modulos_all" ON modulos FOR ALL USING (true) WITH CHECK (true);
   DROP POLICY IF EXISTS "leads_all" ON leads;
   CREATE POLICY "leads_all" ON leads FOR ALL USING (true) WITH CHECK (true);
   ```
5. Create an admin user via SQL Editor (generate SHA-256 hash with `node -e "console.log(require('crypto').createHash('sha256').update('SUA_SENHA').digest('hex'))"`):
   ```sql
   INSERT INTO usuarios (nome, senha, permissao)
   VALUES ('seu_usuario', 'SEU_HASH_AQUI', 'admin');
   ```

## Commands

| Command | Purpose |
|---------|---------|
| `node migrate-supabase.js` | Migrate from legacy SQLite `dados.db` to Supabase (requires `npm install @supabase/supabase-js sql.js`) |

## Password

- SHA-256, **not bcrypt**. Both client-side login (`public/index.html:613-616`) and server-side migration use it.
- `migrate-supabase.js` reads `dados.db` (SQLite), SHA-256 hashes passwords, upserts to Supabase, then renames `dados.db` → `dados.db.bak`.

## Deployment

- **GitHub Pages** via `gh-pages` branch.
- `main` branch has all source files.
- `gh-pages` branch has `index.html` (from `public/`) at root with real Supabase credentials.
- The frontend is static HTML/JS — no server, no env injection. Credentials are hardcoded in the file.

## Important gotchas

- `public/index.html:609-610` has hardcoded Supabase credentials that must be replaced with real ones before the app works.
- `DESIGN.md` is for the OpenCode marketing site design system, unrelated to this project.
- `migrate-supabase.js` is a one-shot script for migrating legacy SQLite data.
- Password is SHA-256, **not bcrypt**. Both client-side login (and server-side migration) use it.
- Gerenciamento de usuários (criar/editar/deletar) é feito pelo SQL Editor do Supabase — o frontend não tem essa aba.
- Arquivos `*.sql` são locais e **nunca** devem ser commitados. Estão no `.gitignore`.
- O schema SQL está embutido neste arquivo na seção Supabase setup — copie de lá para o SQL Editor.
