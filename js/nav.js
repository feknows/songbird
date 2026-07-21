// === NAVEGAÇÃO ===
function configTab(tab) {
  document.querySelectorAll('.config-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.config-tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById('cfg-btn-' + tab).classList.add('active');
  document.getElementById('cfg-tab-' + tab).classList.add('active');
  if (tab === 'produtos') carregarProdutosAdmin();
  if (tab === 'equipamentos') carregarAdminEquipamentos();
}

function navegar(pagina) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + pagina).classList.add('active');
  const map = {home:'Agenda',vendas:'Vendas',distribuicao:'Distribuição',tarefas:'Tarefas',config:'Config'};
  document.querySelectorAll('.mb-nav button').forEach(b => {
    b.classList.toggle('active', b.dataset.page === pagina);
  });
  document.querySelector('.mb-nav').classList.remove('open');
  if (pagina === 'home') { agendaCarregar(); }
  if (pagina === 'vendas') { voltarHub(); carregarProdutos(); distribCarregarBadge(); }
  if (pagina === 'distribuicao') { distribCarregar(); }
  if (pagina === 'equipamentos') { eqCarregar(); }
  if (pagina === 'tarefas') { tarefasCarregar(); }
  atualizarBreadcrumb();
}

function atualizarBreadcrumb() {
  const activePage = document.querySelector('.page.active');
  const map = { 'page-home': 'agenda', 'page-vendas': 'vendas', 'page-distribuicao': 'distribuição', 'page-equipamentos': 'equipamentos', 'page-tarefas': 'tarefas', 'page-config': 'config' };
  const name = map[activePage?.id] || 'agenda';
  const bc = document.querySelector('.mode-bulma-breadcrumb');
  if (bc) bc.innerHTML = `<span>></span> ${name}`;
}

function toggleHamburger() {
  document.querySelector('.mb-nav').classList.toggle('open');
}

// === APP INIT ===
document.addEventListener('DOMContentLoaded', async () => {
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
      document.getElementById('app').style.display = 'none';
      document.getElementById('login-screen').style.display = 'flex';
      document.getElementById('login-user').value = '';
      document.getElementById('login-pass').value = '';
    }
  });
  await checkSession();
  const navVer = document.getElementById('nav-sb-version');
  if (navVer) navVer.textContent = 'v' + SONGBIRD_VERSION;
});