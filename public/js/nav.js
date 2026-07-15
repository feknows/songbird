// === MODO (CLASSIC / TERMINAL / DASHBOARD) ===
function toggleModo() {
  const body = document.body;
  if (body.classList.contains('mode-classic')) {
    body.classList.remove('mode-classic');
    body.classList.add('mode-terminal');
    setModoLabel('terminal');
    localStorage.setItem('songbird-modo', 'terminal');
  } else if (body.classList.contains('mode-terminal')) {
    body.classList.remove('mode-terminal');
    body.classList.add('mode-bulma', 'bulma-light');
    setModoLabel('bulma-light');
    localStorage.setItem('songbird-modo', 'bulma-light');
  } else if (body.classList.contains('bulma-light')) {
    body.classList.remove('bulma-light');
    body.classList.add('bulma-dark');
    setModoLabel('bulma-dark');
    localStorage.setItem('songbird-modo', 'bulma-dark');
  } else if (body.classList.contains('bulma-dark')) {
    body.classList.remove('mode-bulma', 'bulma-dark');
    body.classList.add('mode-dashboard');
    setModoLabel('dashboard');
    localStorage.setItem('songbird-modo', 'dashboard');
  } else {
    body.classList.remove('mode-dashboard');
    body.classList.add('mode-classic');
    setModoLabel('classic');
    localStorage.setItem('songbird-modo', 'classic');
  }
  atualizarBreadcrumb();
  atualizarNavBulma();
}

function setModoLabel(modo) {
  const labels = {
    'dashboard': '[ ◉ Classic ]',
    'classic': '[ >_ Terminal ]',
    'terminal': '[ ≡ Dashboard ]',
    'bulma-light': '[ ◐ Bulma Light ]',
    'bulma-dark': '[ ◑ Bulma Dark ]',
  };
  document.querySelectorAll('.mode-toggle').forEach(btn => {
    btn.textContent = labels[modo] || '';
  });
}

function initModo() {
  const saved = localStorage.getItem('songbird-modo') || 'dashboard';
  const body = document.body;
  body.classList.remove('mode-terminal', 'mode-dashboard', 'mode-classic', 'mode-bulma', 'bulma-light', 'bulma-dark');
  if (saved === 'classic') {
    body.classList.add('mode-classic');
    setModoLabel('classic');
  } else if (saved === 'terminal') {
    body.classList.add('mode-terminal');
    setModoLabel('terminal');
  } else if (saved === 'bulma-light') {
    body.classList.add('mode-bulma', 'bulma-light');
    setModoLabel('bulma-light');
  } else if (saved === 'bulma-dark') {
    body.classList.add('mode-bulma', 'bulma-dark');
    setModoLabel('bulma-dark');
  } else {
    body.classList.add('mode-dashboard');
    setModoLabel('dashboard');
  }
  atualizarBreadcrumb();
  atualizarNavBulma();
}

function atualizarBreadcrumb() {
  const activePage = document.querySelector('.page.active');
  const map = { 'page-home': 'home', 'page-vendas': 'vendas', 'page-distribuicao': 'distribuição', 'page-equipamentos': 'equipamentos', 'page-tarefas': 'tarefas', 'page-config': 'config' };
  const name = map[activePage?.id] || 'home';
  const topbar = document.querySelector('.topbar .breadcrumb');
  if (topbar) topbar.innerHTML = `<span>></span> ${name}`;
  const bulmaBc = document.querySelector('.mode-bulma-breadcrumb');
  if (bulmaBc) bulmaBc.innerHTML = `<span>></span> ${name}`;
}

function atualizarNavBulma() {
  const activePage = document.querySelector('.page.active');
  if (!activePage) return;
  const id = activePage.id.replace('page-', '');
  document.querySelectorAll('.mode-bulma-nav .mb-nav button').forEach(b => {
    b.classList.toggle('active', b.dataset.page === id);
  });
}

function toggleHamburger() {
  document.querySelector('.mode-bulma-nav .mb-nav').classList.toggle('open');
}

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
  const map = {home:'Home',vendas:'Vendas',distribuicao:'Distribuição',tarefas:'Tarefas',config:'Config'};
  document.querySelectorAll('.sidebar-nav button').forEach(b => {
    const txt = b.textContent.replace('>','').trim();
    b.classList.toggle('active', txt.includes(map[pagina]));
  });
  document.querySelectorAll('.mode-bulma-nav .mb-nav button').forEach(b => {
    b.classList.toggle('active', b.dataset.page === pagina);
  });
  document.querySelector('.mode-bulma-nav .mb-nav').classList.remove('open');
  if (pagina === 'home') { rotinaCarregar(); rotinaHookGerarTexto(); }
  if (pagina === 'vendas') { voltarHub(); carregarProdutos(); distribCarregarBadge(); }
  if (pagina === 'distribuicao') { distribCarregar(); }
  if (pagina === 'equipamentos') { eqCarregar(); }
  if (pagina === 'tarefas') { tarefasCarregar(); }
  atualizarBreadcrumb();
}

// === APP INIT ===
document.addEventListener('DOMContentLoaded', async () => {
  initModo();
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
      document.getElementById('app').style.display = 'none';
      document.getElementById('login-screen').style.display = 'flex';
      document.getElementById('login-user').value = '';
      document.getElementById('login-pass').value = '';
    }
  });
  await checkSession();
  document.getElementById('sb-ver').textContent = SONGBIRD_VERSION;
  document.getElementById('sb-footer-ver').textContent = 'v' + SONGBIRD_VERSION;
  const navVer = document.getElementById('nav-sb-version');
  if (navVer) navVer.textContent = 'v' + SONGBIRD_VERSION;
});
