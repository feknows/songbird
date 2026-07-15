// === SESSION ===
async function checkSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  const meta = session.user.user_metadata;
  document.getElementById('sidebar-user').textContent = meta.nome;
  const navUser = document.getElementById('nav-sidebar-user');
  if (navUser) navUser.textContent = meta.nome;
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  if (meta.permissao === 'admin') {
    document.getElementById('cfg-btn-produtos').style.display = 'block';
    document.getElementById('cfg-btn-equipamentos').style.display = 'block';
  }
  initModo();
  rotinaCarregar();
  rotinaHookGerarTexto();
  rotinaCarregar();
  rotinaHookGerarTexto();
}

async function fazerLogin() {
  const nome = document.getElementById('login-user').value.trim();
  const senha = document.getElementById('login-pass').value.trim();
  const btn = document.getElementById('login-btn');
  const loginErr = document.getElementById('login-error');
  const originalText = btn.textContent;
  console.log('[SongBird] fazerLogin chamado para:', nome);
  btn.disabled = true;
  btn.textContent = 'ENTRANDO...';
  loginErr.style.display = 'none';
  loginErr.classList.remove('shake');
  try {
    if (!supabase) throw new Error('Supabase client não inicializado');
    const email = nome + '@songbird.app';
    const loginPromise = supabase.auth.signInWithPassword({ email, password: senha });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout: servidor não respondeu em 15s')), 15000)
    );
    const { data, error } = await Promise.race([loginPromise, timeoutPromise]);
    if (error) throw error;
    const meta = data.user.user_metadata;
    document.getElementById('sidebar-user').textContent = meta.nome;
    const navUser = document.getElementById('nav-sidebar-user');
    if (navUser) navUser.textContent = meta.nome;
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    if (meta.permissao === 'admin') {
      document.getElementById('cfg-btn-produtos').style.display = 'block';
      document.getElementById('cfg-btn-equipamentos').style.display = 'block';
    }
    initModo();
  } catch (e) {
    console.error('[SongBird] Erro no login:', e);
    let msg;
    if (e?.message?.includes('Invalid login credentials')) {
      msg = 'Usuário ou senha inválidos';
    } else if (e?.message?.includes('Failed to fetch') || e?.message?.includes('NetworkError')) {
      msg = 'Erro de conexão com o servidor. Verifique sua internet.';
    } else if (e?.message?.includes('Timeout')) {
      msg = 'Servidor demorou para responder. Verifique sua internet e tente novamente.';
    } else {
      msg = 'Erro inesperado: ' + (e?.message || 'desconhecido');
    }
    loginErr.textContent = msg;
    loginErr.style.display = 'block';
    void loginErr.offsetWidth;
    loginErr.classList.add('shake');
  }
  btn.disabled = false;
  btn.textContent = originalText;
}

async function fazerLogout() {
  await supabase.auth.signOut();
  document.getElementById('app').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('login-user').value = '';
  document.getElementById('login-pass').value = '';
}
