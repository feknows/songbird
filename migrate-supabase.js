/**
 * Migrate dados.db → Supabase
 *
 * 1. Crie um arquivo .env com:
 *    SUPABASE_URL=https://xxxxx.supabase.co
 *    SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJ...  (Project Settings → API → service_role key)
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
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Erro: Crie o arquivo .env com SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const { createClient } = require('@supabase/supabase-js');
const initSqlJs = require('sql.js');

function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

async function batchUpsert(supabase, table, rows, conflictColumn = 'id') {
  if (rows.length === 0) return;
  const { error } = await supabase.from(table).upsert(rows, { onConflict: conflictColumn });
  if (error) {
    console.error(`  Erro ao migrar lote de ${table}:`, error.message);
  } else {
    console.log(`  ${rows.length} registro(s) de "${table}" migrado(s)`);
  }
}

async function main() {
  // Usa service_role key para contornar RLS durante a migração
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
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
  const usuarios = query('SELECT * FROM usuarios').map(u => ({
    id: u.id,
    nome: u.nome,
    senha: sha256(u.senha),
    permissao: u.permissao,
    criado_em: u.criado_em
  }));
  await batchUpsert(supabase, 'usuarios', usuarios);

  // --- Migrate produtos ---
  const produtos = query('SELECT * FROM produtos');
  await batchUpsert(supabase, 'produtos', produtos);

  // --- Migrate faixas ---
  const faixas = query('SELECT * FROM faixas');
  await batchUpsert(supabase, 'faixas', faixas);

  // --- Migrate modulos ---
  const modulos = query('SELECT * FROM modulos');
  await batchUpsert(supabase, 'modulos', modulos);

  // --- Migrate leads ---
  const leads = query('SELECT * FROM leads').map(l => ({
    ...l,
    telefone: l.telefone || '',
    whatsapp: l.whatsapp || '',
    site: l.site || '',
    endereco: l.endereco || '',
    redes_sociais: l.redes_sociais || ''
  }));
  await batchUpsert(supabase, 'leads', leads);

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
