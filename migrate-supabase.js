/**
 * Migrate dados.db → Supabase
 *
 * 1. Crie um arquivo .env com:
 *    SUPABASE_URL=https://xxxxx.supabase.co
 *    SUPABASE_ANON_KEY=eyJhbGciOiJ...
 *
 * 2. Execute o script supabase-schema.sql no SQL Editor do Supabase
 *
 * 3. npm install @supabase/supabase-js sql.js
 *
 * 4. node migrate-supabase.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Load .env
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').trim().split('\n');
  for (const line of lines) {
    const [key, ...vals] = line.split('=');
    if (key && vals.length) process.env[key.trim()] = vals.join('=').trim();
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Erro: Crie o arquivo .env com SUPABASE_URL e SUPABASE_ANON_KEY');
  process.exit(1);
}

const { createClient } = require('@supabase/supabase-js');
const initSqlJs = require('sql.js');

function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const SQL = await initSqlJs();

  const dbPath = path.join(__dirname, 'dados.db');
  if (!fs.existsSync(dbPath)) {
    console.log('Nenhum dados.db encontrado. Nada a migrar.');
    return;
  }

  const buffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(buffer);

  function query(sql, params = []) {
    const stmt = db.prepare(sql);
    if (params.length > 0) stmt.bind(params);
    const results = [];
    while (stmt.step()) results.push(stmt.getAsObject());
    stmt.free();
    return results;
  }

  // --- Migrate usuarios ---
  const usuarios = query('SELECT * FROM usuarios');
  for (const u of usuarios) {
    const hash = sha256(u.senha);
    const { error } = await supabase.from('usuarios').upsert({
      id: u.id,
      nome: u.nome,
      senha: hash,
      permissao: u.permissao,
      criado_em: u.criado_em
    }, { onConflict: 'id' });
    if (error) console.error(`Erro ao migrar usuário ${u.nome}:`, error.message);
    else console.log(`  Usuário "${u.nome}" migrado`);
  }

  // --- Migrate produtos ---
  const produtos = query('SELECT * FROM produtos');
  for (const p of produtos) {
    const { error } = await supabase.from('produtos').upsert({
      id: p.id,
      nome: p.nome,
      tipo: p.tipo,
      ativo: p.ativo,
      ordem: p.ordem
    }, { onConflict: 'id' });
    if (error) console.error(`Erro ao migrar produto ${p.nome}:`, error.message);
    else console.log(`  Produto "${p.nome}" migrado`);
  }

  // --- Migrate faixas ---
  const faixas = query('SELECT * FROM faixas');
  for (const f of faixas) {
    const { error } = await supabase.from('faixas').upsert({
      id: f.id,
      produto_id: f.produto_id,
      descricao: f.descricao,
      valor_base: f.valor_base,
      valor_modulo: f.valor_modulo,
      ordem: f.ordem
    }, { onConflict: 'id' });
    if (error) console.error(`Erro ao migrar faixa ${f.id}:`, error.message);
    else console.log(`  Faixa "${f.descricao}" migrada`);
  }

  // --- Migrate modulos ---
  const modulos = query('SELECT * FROM modulos');
  for (const m of modulos) {
    const { error } = await supabase.from('modulos').upsert({
      id: m.id,
      produto_id: m.produto_id,
      nome: m.nome,
      ativo: m.ativo,
      ordem: m.ordem
    }, { onConflict: 'id' });
    if (error) console.error(`Erro ao migrar módulo ${m.nome}:`, error.message);
    else console.log(`  Módulo "${m.nome}" migrado`);
  }

  // --- Migrate leads ---
  const leads = query('SELECT * FROM leads');
  for (const l of leads) {
    const { error } = await supabase.from('leads').upsert({
      id: l.id,
      nome: l.nome,
      telefone: l.telefone || '',
      whatsapp: l.whatsapp || '',
      site: l.site || '',
      endereco: l.endereco || '',
      avaliacao: l.avaliacao,
      redes_sociais: l.redes_sociais || '',
      cidade: l.cidade,
      termo: l.termo,
      criado_em: l.criado_em
    }, { onConflict: 'id' });
    if (error) console.error(`Erro ao migrar lead ${l.nome}:`, error.message);
    else console.log(`  Lead "${l.nome}" migrado`);
  }

  db.close();
  console.log('\nMigração concluída!');

  // Rename dados.db so it's not reused
  fs.renameSync(dbPath, dbPath + '.bak');
  console.log('dados.db renomeado para dados.db.bak (backup local)');
}

main().catch(err => {
  console.error('Erro na migração:', err);
  process.exit(1);
});
