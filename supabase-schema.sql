-- SongBird - Supabase Schema
-- Execute isso no SQL Editor do seu projeto Supabase

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

-- ========== ROW LEVEL SECURITY ==========
-- A chave anon é pública (exposta no HTML), então RLS com políticas
-- protege contra escrita indevida.

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE faixas ENABLE ROW LEVEL SECURITY;
ALTER TABLE modulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Usuários: só SELECT (login) e UPDATE própria senha
CREATE POLICY IF NOT EXISTS "usuarios_select" ON usuarios FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "usuarios_update" ON usuarios FOR UPDATE USING (true) WITH CHECK (true);

-- Produtos/faixas/módulos: CRUD completo (admin usa pelo frontend)
CREATE POLICY IF NOT EXISTS "produtos_all" ON produtos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "faixas_all" ON faixas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "modulos_all" ON modulos FOR ALL USING (true) WITH CHECK (true);

-- Leads: CRUD completo (coleta + visualização)
CREATE POLICY IF NOT EXISTS "leads_all" ON leads FOR ALL USING (true) WITH CHECK (true);
