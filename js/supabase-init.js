// === SUPABASE INIT ===
const SUPABASE_URL = 'https://wtnbbtnvadkpbdibnndu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0bmJidG52YWRrcGJkaWJubmR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NzQyMDIsImV4cCI6MjA5NTM1MDIwMn0.6WwEuiK87D-L3iuGxwXXJW0aIx949YkVjJElaZDradM';
if (!window.supabase) {
  const errDiv = document.createElement('div');
  errDiv.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#0a0a0a;z-index:9999;color:#ff3b30;font-family:monospace;text-align:center;padding:20px;';
  errDiv.innerHTML = 'Erro ao carregar dependências.<br>Verifique sua conexão e recarregue a página (Ctrl+Shift+R).';
  document.body.appendChild(errDiv);
  throw new Error('Supabase JS não carregou');
}
var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const SONGBIRD_VERSION = '1.5.0';
