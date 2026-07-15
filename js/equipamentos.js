// === EQUIPAMENTOS HOMOLOGADOS ===
var eqCategorias = [];
var eqEquipamentos = [];
var eqEditandoId = null;

function badgeStatus(status) {
  const map = {
    'integrado': '<span class="badge badge-integrado">Integrado</span>',
    'testes': '<span class="badge badge-testes">Testes</span>',
    'desenvolvimento': '<span class="badge badge-desenvolvimento">Em desenvolvimento</span>',
    'nao_integrado': '<span class="badge badge-nao_integrado">Não integrado</span>',
  };
  return map[status] || status;
}

function versaoDisplay(v) {
  return v ? 'v' + v : '—';
}

async function eqCarregar() {
  try {
    const [resCat, resEquip] = await Promise.all([
      supabase.from('equip_categorias').select('*').order('ordem').order('id'),
      supabase.from('equipamentos').select('*, equip_categorias(nome)').order('categoria_id').order('id')
    ]);
    eqCategorias = resCat.data || [];
    eqEquipamentos = resEquip.data || [];

    const select = document.getElementById('eq-filtro-categoria');
    const currentVal = select.value;
    select.innerHTML = '<option value="">Todas as categorias</option>' +
      eqCategorias.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
    if (currentVal) select.value = currentVal;

    eqFiltrar();
  } catch (e) {
    document.getElementById('eq-tbody').innerHTML =
      `<tr><td colspan="5" style="text-align:center;color:var(--danger);padding:40px;">Erro ao carregar: ${e.message}</td></tr>`;
  }
}

function eqFiltrar() {
  const catId = document.getElementById('eq-filtro-categoria').value;
  const busca = document.getElementById('eq-busca').value.trim().toLowerCase();
  let filtrados = eqEquipamentos;

  if (catId) filtrados = filtrados.filter(e => e.categoria_id == catId);
  if (busca) filtrados = filtrados.filter(e => e.nome.toLowerCase().includes(busca));

  document.getElementById('eq-contagem').textContent = `${filtrados.length} equipamento${filtrados.length !== 1 ? 's' : ''}`;

  const tbody = document.getElementById('eq-tbody');
  if (filtrados.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:40px;">Nenhum equipamento encontrado.</td></tr>';
    return;
  }

  tbody.innerHTML = filtrados.map(e => {
    const catNome = e.equip_categorias?.nome || '';
    return `<tr>
      <td>${e.nome}</td>
      <td>${catNome}</td>
      <td>${badgeStatus(e.status)}</td>
      <td>${versaoDisplay(e.versao)}</td>
      <td style="color:var(--text-secondary);font-size:0.8rem;">${e.observacoes || '—'}</td>
    </tr>`;
  }).join('');
}

function eqCopiarLista() {
  const catId = document.getElementById('eq-filtro-categoria').value;
  const busca = document.getElementById('eq-busca').value.trim().toLowerCase();
  let filtrados = eqEquipamentos;
  if (catId) filtrados = filtrados.filter(e => e.categoria_id == catId);
  if (busca) filtrados = filtrados.filter(e => e.nome.toLowerCase().includes(busca));
  if (filtrados.length === 0) return;
  const grupos = {};
  for (const e of filtrados) {
    const cat = e.equip_categorias?.nome || 'Sem categoria';
    if (!grupos[cat]) grupos[cat] = [];
    grupos[cat].push(e);
  }
  const statusLabel = { 'integrado':'Integrado', 'testes':'Testes', 'desenvolvimento':'Desenvolvimento', 'nao_integrado':'Não integrado' };
  const linhas = ['═ EQUIPAMENTOS HOMOLOGADOS ═',''];
  for (const [cat, equipamentos] of Object.entries(grupos)) {
    linhas.push(`> ${cat}`);
    for (const e of equipamentos) {
      const sta = statusLabel[e.status] || e.status;
      const ver = e.versao ? `v${e.versao}` : '';
      linhas.push(`  ${e.nome}${ver ? `  ${ver}` : ''}  (${sta})`);
    }
    linhas.push('');
  }
  navigator.clipboard.writeText(linhas.join('\n')).then(() => {
    const msg = document.getElementById('eq-copy-msg');
    msg.style.opacity = '1';
    setTimeout(() => msg.style.opacity = '0', 2000);
  });
}

// === ADMIN EQUIPAMENTOS ===
function configTabEquipamentos() {
  carregarAdminEquipamentos();
}

async function carregarAdminEquipamentos() {
  const div = document.getElementById('admin-equipamentos');
  try {
    const [resCat, resEquip] = await Promise.all([
      supabase.from('equip_categorias').select('*').order('ordem').order('id'),
      supabase.from('equipamentos').select('*').order('categoria_id').order('id')
    ]);
    eqCategorias = resCat.data || [];
    eqEquipamentos = resEquip.data || [];

    let html = `<div class="equip-admin-grid">`;

    html += `<div class="equip-admin-section">
      <h3>Categorias</h3>
      <button class="btn btn-sm btn-success" onclick="criarCategoria()" style="margin-bottom:8px;">+ Nova Categoria</button>
      <ul class="equip-list-compact" id="eq-admin-cat-list">`;

    for (const cat of eqCategorias) {
      const count = eqEquipamentos.filter(e => e.categoria_id === cat.id).length;
      html += `<li><span>${cat.nome} <span style="color:var(--text-muted);font-size:0.75rem;">(${count})</span></span>
        <button class="btn btn-sm btn-danger" onclick="deletarCategoria(${cat.id},'${cat.nome.replace(/'/g, "\\'")}')" style="padding:2px 6px;font-size:0.7rem;">✕</button></li>`;
    }

    html += `</ul></div>`;

    html += `<div>
      <div class="equip-admin-section">
        <h3>Equipamentos</h3>
        <div class="field" style="margin-bottom:8px;">
          <label>Filtrar por categoria</label>
          <select id="eq-admin-filtro-cat" class="styled-select" onchange="carregarAdminEquipamentos()">
            <option value="">Todas</option>
            ${eqCategorias.map(c => `<option value="${c.id}">${c.nome}</option>`).join('')}
          </select>
        </div>
        <button class="btn btn-sm btn-success" onclick="criarEquipamento()" style="margin-bottom:8px;">+ Novo Equipamento</button>
        <ul class="equip-list-compact" id="eq-admin-equip-list">`;

    const filtroCat = document.getElementById('eq-admin-filtro-cat')?.value || '';
    let equipFiltrados = eqEquipamentos;
    if (filtroCat) equipFiltrados = equipFiltrados.filter(e => e.categoria_id == filtroCat);

    for (const e of equipFiltrados) {
      const catNome = eqCategorias.find(c => c.id === e.categoria_id)?.nome || '';
      html += `<li>
        <span><strong>${e.nome}</strong> <span style="color:var(--text-muted);font-size:0.75rem;">(${catNome})</span> ${badgeStatus(e.status)}</span>
        <span>
          <button class="btn btn-sm btn-secondary" onclick="editarEquipamento(${e.id})" style="padding:2px 6px;font-size:0.7rem;margin-right:4px;">✎</button>
          <button class="btn btn-sm btn-danger" onclick="deletarEquipamento(${e.id},'${e.nome.replace(/'/g, "\\'")}')" style="padding:2px 6px;font-size:0.7rem;">✕</button>
        </span>
      </li>`;
    }

    html += `</ul></div></div></div>`;
    div.innerHTML = html;
  } catch (e) {
    div.innerHTML = `<span style="color:var(--danger);font-size:0.85rem;">Erro ao carregar: ${e.message}</span>`;
  }
}

// === CRUD CATEGORIAS ===
function criarCategoria() {
  document.getElementById('modal-cat-nome').value = '';
  document.getElementById('modal-nova-categoria').style.display = 'flex';
  setTimeout(() => document.getElementById('modal-cat-nome').focus(), 100);
}

function fecharModalCategoria() {
  document.getElementById('modal-nova-categoria').style.display = 'none';
}

async function salvarCategoria() {
  const nome = document.getElementById('modal-cat-nome').value.trim();
  if (!nome) { alert('Preencha o nome da categoria.'); return; }
  try {
    const { data: maxOrdem } = await supabase.from('equip_categorias').select('ordem').order('ordem', { ascending: false }).limit(1);
    await supabase.from('equip_categorias').insert({ nome, ordem: (maxOrdem?.[0]?.ordem ?? -1) + 1 });
    fecharModalCategoria();
    carregarAdminEquipamentos();
  } catch (e) {
    alert(e.message);
  }
}

function deletarCategoria(id, nome) {
  confirmarAcao('Remover Categoria', `Remover "${nome}" e TODOS os equipamentos desta categoria?`, async () => {
    try {
      await supabase.from('equip_categorias').delete().eq('id', id);
      carregarAdminEquipamentos();
    } catch (e) {
      alert(e.message);
    }
  });
}

// === CRUD EQUIPAMENTOS ===
async function criarEquipamento() {
  eqEditandoId = null;
  document.getElementById('modal-equip-titulo').textContent = '[+] Novo Equipamento';
  document.getElementById('modal-equip-id').value = '';
  document.getElementById('modal-equip-nome').value = '';
  document.getElementById('modal-equip-versao').value = '';
  document.getElementById('modal-equip-obs').value = '';
  document.getElementById('modal-equip-status').value = 'integrado';

  const catSelect = document.getElementById('modal-equip-cat');
  catSelect.innerHTML = eqCategorias.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
  if (eqCategorias.length > 0) catSelect.selectedIndex = 0;

  document.getElementById('modal-equipamento').style.display = 'flex';
  setTimeout(() => document.getElementById('modal-equip-nome').focus(), 100);
}

async function editarEquipamento(id) {
  eqEditandoId = id;
  const equip = eqEquipamentos.find(e => e.id === id);
  if (!equip) return;

  document.getElementById('modal-equip-titulo').textContent = '✎ Editar Equipamento';
  document.getElementById('modal-equip-id').value = id;
  document.getElementById('modal-equip-nome').value = equip.nome;
  document.getElementById('modal-equip-versao').value = equip.versao || '';
  document.getElementById('modal-equip-obs').value = equip.observacoes || '';
  document.getElementById('modal-equip-status').value = equip.status;

  const catSelect = document.getElementById('modal-equip-cat');
  catSelect.innerHTML = eqCategorias.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
  catSelect.value = equip.categoria_id;

  document.getElementById('modal-equipamento').style.display = 'flex';
  setTimeout(() => document.getElementById('modal-equip-nome').focus(), 100);
}

function fecharModalEquipamento() {
  document.getElementById('modal-equipamento').style.display = 'none';
  eqEditandoId = null;
}

async function salvarEquipamento() {
  const categoria_id = parseInt(document.getElementById('modal-equip-cat').value);
  const nome = document.getElementById('modal-equip-nome').value.trim();
  const status = document.getElementById('modal-equip-status').value;
  const versao = document.getElementById('modal-equip-versao').value.trim();
  const observacoes = document.getElementById('modal-equip-obs').value.trim();

  if (!categoria_id || !nome) { alert('Preencha categoria e nome.'); return; }

  try {
    if (eqEditandoId) {
      await supabase.from('equipamentos').update({ categoria_id, nome, status, versao, observacoes }).eq('id', eqEditandoId);
    } else {
      await supabase.from('equipamentos').insert({ categoria_id, nome, status, versao, observacoes });
    }
    fecharModalEquipamento();
    carregarAdminEquipamentos();
  } catch (e) {
    alert(e.message);
  }
}

function deletarEquipamento(id, nome) {
  confirmarAcao('Remover Equipamento', `Remover "${nome}"?`, async () => {
    try {
      await supabase.from('equipamentos').delete().eq('id', id);
      carregarAdminEquipamentos();
    } catch (e) {
      alert(e.message);
    }
  });
}
