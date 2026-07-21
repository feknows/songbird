// === AGENDA - Gestão de Tempo ===

// Estado global
let agendaTarefas = [];
let agendaProjetos = [];
let agendaFiltroAtual = 'hoje';
let agendaProjetoFiltro = null;
let agendaTarefaSelecionada = null;

// === CARREGAMENTO ===
async function agendaCarregar() {
  await Promise.all([agendaCarregarProjetos(), agendaCarregarTarefas()]);
  agendaRenderizar();
}

async function agendaCarregarProjetos() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data, error } = await supabase
    .from('agenda_projetos')
    .select('*')
    .eq('user_id', user.id)
    .order('ordem');

  if (!error) agendaProjetos = data || [];
}

async function agendaCarregarTarefas() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data, error } = await supabase
    .from('agenda_tarefas')
    .select('*')
    .eq('user_id', user.id)
    .order('ordem');

  if (!error) agendaTarefas = data || [];
}

// === RENDERIZAÇÃO ===
function agendaRenderizar() {
  agendaRenderizarProjetos();
  agendaRenderizarLista();
}

function agendaRenderizarProjetos() {
  const container = document.getElementById('agenda-projetos-lista');
  if (!container) return;

  container.innerHTML = agendaProjetos.map(p => {
    const count = agendaTarefas.filter(t => t.projeto_id === p.id && !t.concluido).length;
    const isActive = agendaProjetoFiltro === p.id;
    return `
      <div class="agenda-projeto-item ${isActive ? 'active' : ''}" onclick="agendaFiltrarProjeto(${p.id})">
        <span class="agenda-projeto-dot" style="background:${p.cor}"></span>
        <span>${p.nome}</span>
        <span class="agenda-projeto-count">${count}</span>
      </div>
    `;
  }).join('');
}

function agendaRenderizarLista() {
  const container = document.getElementById('agenda-lista');
  const contador = document.getElementById('agenda-contador');
  const titulo = document.getElementById('agenda-titulo-view');
  if (!container) return;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);
  const em7dias = new Date(hoje);
  em7dias.setDate(em7dias.getDate() + 7);

  let tarefasFiltradas = agendaTarefas.filter(t => !t.concluido);

  // Filtro por data
  if (agendaFiltroAtual === 'hoje') {
    tarefasFiltradas = tarefasFiltradas.filter(t => {
      if (!t.data_vencimento) return false;
      const venc = new Date(t.data_vencimento + 'T00:00:00');
      return venc <= hoje;
    });
    titulo.textContent = 'Hoje';
  } else if (agendaFiltroAtual === 'amanha') {
    tarefasFiltradas = tarefasFiltradas.filter(t => {
      if (!t.data_vencimento) return false;
      const venc = new Date(t.data_vencimento + 'T00:00:00');
      return venc.getTime() === amanha.getTime();
    });
    titulo.textContent = 'Amanhã';
  } else if (agendaFiltroAtual === '7dias') {
    tarefasFiltradas = tarefasFiltradas.filter(t => {
      if (!t.data_vencimento) return false;
      const venc = new Date(t.data_vencimento + 'T00:00:00');
      return venc >= hoje && venc <= em7dias;
    });
    titulo.textContent = 'Próximos 7 dias';
  } else {
    titulo.textContent = 'Todas as tarefas';
  }

  // Filtro por projeto
  if (agendaProjetoFiltro) {
    tarefasFiltradas = tarefasFiltradas.filter(t => t.projeto_id === agendaProjetoFiltro);
  }

  // Ordenar por prioridade e vencimento
  tarefasFiltradas.sort((a, b) => {
    if (a.prioridade !== b.prioridade) return a.prioridade - b.prioridade;
    if (a.data_vencimento && b.data_vencimento) return a.data_vencimento.localeCompare(b.data_vencimento);
    if (a.data_vencimento) return -1;
    if (b.data_vencimento) return 1;
    return (a.ordem || 0) - (b.ordem || 0);
  });

  contador.textContent = `${tarefasFiltradas.length} tarefa${tarefasFiltradas.length !== 1 ? 's' : ''}`;

  if (tarefasFiltradas.length === 0) {
    container.innerHTML = `
      <div class="agenda-vazio">
        <div class="agenda-vazio-icon">📋</div>
        <div class="agenda-vazio-texto">Nenhuma tarefa${agendaFiltroAtual !== 'todas' ? ' para este período' : ''}</div>
      </div>
    `;
    return;
  }

  container.innerHTML = tarefasFiltradas.map(t => agendaTarefaHtml(t)).join('');

  // Inicializar SortableJS
  if (window.Sortable) {
    Sortable.create(container, {
      animation: 150,
      ghostClass: 'sortable-ghost',
      dragClass: 'sortable-drag',
      onEnd: async function(evt) {
        const ids = [];
        container.querySelectorAll('.agenda-tarefa').forEach(el => {
          ids.push(parseInt(el.dataset.id));
        });
        for (let i = 0; i < ids.length; i++) {
          const t = agendaTarefas.find(t => t.id === ids[i]);
          if (t) t.ordem = i;
        }
        await agendaSalvarOrdem(ids);
      }
    });
  }
}

function agendaTarefaHtml(t) {
  const projeto = agendaProjetos.find(p => p.id === t.projeto_id);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  let vencimentoHtml = '';
  if (t.data_vencimento) {
    const venc = new Date(t.data_vencimento + 'T00:00:00');
    const diff = Math.ceil((venc - hoje) / (1000 * 60 * 60 * 24));
    let classe = '';
    let texto = '';

    if (diff < 0) {
      classe = 'atrasada';
      texto = `Atrasada ${Math.abs(diff)} dia${Math.abs(diff) > 1 ? 's' : ''}`;
    } else if (diff === 0) {
      classe = 'hoje';
      texto = 'Hoje';
    } else if (diff === 1) {
      texto = 'Amanhã';
    } else {
      texto = `Em ${diff} dias`;
    }

    vencimentoHtml = `<span class="agenda-tarefa-vencimento ${classe}">${texto}</span>`;
  }

  const selecionada = agendaTarefaSelecionada === t.id;

  return `
    <div class="agenda-tarefa ${t.concluido ? 'concluida' : ''} ${selecionada ? 'selecionada' : ''}"
         data-id="${t.id}"
         onclick="agendaSelecionarTarefa(${t.id})">
      <div class="agenda-tarefa-checkbox" onclick="event.stopPropagation();agendaToggleConcluido(${t.id})"></div>
      <span class="agenda-tarefa-prioridade p${t.prioridade}"></span>
      <div class="agenda-tarefa-conteudo">
        <div class="agenda-tarefa-titulo">${t.titulo}</div>
        <div class="agenda-tarefa-meta">
          ${projeto ? `<span class="agenda-tarefa-projeto"><span class="agenda-projeto-dot" style="background:${projeto.cor};width:6px;height:6px;border-radius:50%;"></span>${projeto.nome}</span>` : ''}
          ${vencimentoHtml}
        </div>
      </div>
    </div>
  `;
}

// === FILTROS ===
function agendaFiltrar(filtro, el) {
  agendaFiltroAtual = filtro;
  agendaProjetoFiltro = null;
  document.querySelectorAll('.agenda-filtro').forEach(f => f.classList.remove('active'));
  document.querySelectorAll('.agenda-projeto-item').forEach(p => p.classList.remove('active'));
  if (el) el.classList.add('active');
  agendaRenderizar();
}

function agendaFiltrarProjeto(id) {
  if (agendaProjetoFiltro === id) {
    agendaProjetoFiltro = null;
  } else {
    agendaProjetoFiltro = id;
    agendaFiltroAtual = 'todas';
    document.querySelectorAll('.agenda-filtro').forEach(f => f.classList.remove('active'));
  }
  agendaRenderizar();
}

// === AÇÕES NAS TAREFAS ===
async function agendaToggleConcluido(id) {
  const t = agendaTarefas.find(t => t.id === id);
  if (!t) return;

  t.concluido = !t.concluido;
  t.concluido_em = t.concluido ? new Date().toISOString() : null;

  await supabase
    .from('agenda_tarefas')
    .update({ concluido: t.concluido, concluido_em: t.concluido_em })
    .eq('id', id);

  // Se tiver recorrência e foi concluída, criar nova tarefa
  if (t.concluido && t.recorrencia) {
    await agendaCriarRecorrencia(t);
  }

  agendaRenderizar();
}

async function agendaCriarRecorrencia(tarefaOriginal) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  let novaData = new Date(tarefaOriginal.data_vencimento + 'T00:00:00');

  if (tarefaOriginal.recorrencia === 'diaria') {
    novaData.setDate(novaData.getDate() + 1);
  } else if (tarefaOriginal.recorrencia === 'semanal') {
    novaData.setDate(novaData.getDate() + 7);
  } else if (tarefaOriginal.recorrencia === 'mensal') {
    novaData.setMonth(novaData.getMonth() + 1);
  }

  const dataStr = novaData.toISOString().split('T')[0];

  // Verificar se já existe tarefa similar para essa data
  const { data: existente } = await supabase
    .from('agenda_tarefas')
    .select('id')
    .eq('user_id', user.id)
    .eq('titulo', tarefaOriginal.titulo)
    .eq('data_vencimento', dataStr)
    .limit(1);

  if (existente && existente.length > 0) return;

  const novaTarefa = {
    user_id: user.id,
    titulo: tarefaOriginal.titulo,
    descricao: tarefaOriginal.descricao,
    projeto_id: tarefaOriginal.projeto_id,
    prioridade: tarefaOriginal.prioridade,
    data_vencimento: dataStr,
    recorrencia: tarefaOriginal.recorrencia,
    concluido: false,
    ordem: tarefaOriginal.ordem
  };

  await supabase.from('agenda_tarefas').insert(novaTarefa);
}

function agendaSelecionarTarefa(id) {
  agendaTarefaSelecionada = id;
  const t = agendaTarefas.find(t => t.id === id);
  if (!t) return;

  const detalhes = document.getElementById('agenda-detalhes');
  detalhes.style.display = 'block';

  document.getElementById('agenda-detalhe-id').value = t.id;
  document.getElementById('agenda-detalhe-titulo').value = t.titulo;
  document.getElementById('agenda-detalhe-desc').value = t.descricao || '';
  document.getElementById('agenda-detalhe-vencimento').value = t.data_vencimento || '';
  document.getElementById('agenda-detalhe-recorrencia').value = t.recorrencia || '';

  // Popular select de projetos
  const selectProjeto = document.getElementById('agenda-detalhe-projeto');
  selectProjeto.innerHTML = `<option value="">Sem projeto</option>` +
    agendaProjetos.map(p => `<option value="${p.id}" ${t.projeto_id === p.id ? 'selected' : ''}>${p.nome}</option>`).join('');

  document.getElementById('agenda-detalhe-prioridade').value = t.prioridade;

  agendaRenderizarLista();
}

function agendaFecharDetalhes() {
  document.getElementById('agenda-detalhes').style.display = 'none';
  agendaTarefaSelecionada = null;
  agendaRenderizarLista();
}

async function agendaSalvarDetalhe() {
  const id = parseInt(document.getElementById('agenda-detalhe-id').value);
  if (!id) return;

  const updates = {
    titulo: document.getElementById('agenda-detalhe-titulo').value,
    descricao: document.getElementById('agenda-detalhe-desc').value,
    projeto_id: document.getElementById('agenda-detalhe-projeto').value || null,
    prioridade: parseInt(document.getElementById('agenda-detalhe-prioridade').value),
    data_vencimento: document.getElementById('agenda-detalhe-vencimento').value || null,
    recorrencia: document.getElementById('agenda-detalhe-recorrencia').value || null
  };

  await supabase.from('agenda_tarefas').update(updates).eq('id', id);

  const t = agendaTarefas.find(t => t.id === id);
  if (t) Object.assign(t, updates);

  agendaRenderizar();
}

async function agendaExcluirTarefa() {
  const id = parseInt(document.getElementById('agenda-detalhe-id').value);
  if (!id) return;

  if (!confirm('Excluir esta tarefa?')) return;

  await supabase.from('agenda_tarefas').delete().eq('id', id);
  agendaTarefas = agendaTarefas.filter(t => t.id !== id);
  agendaFecharDetalhes();
  agendaRenderizar();
}

// === ADICIONAR RÁPIDO ===
async function agendaAdicionarRapido() {
  const input = document.getElementById('agenda-input-rapido');
  const titulo = input.value.trim();
  if (!titulo) return;

  const originalPlaceholder = input.placeholder;
  input.disabled = true;
  input.placeholder = 'Adicionando...';

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    input.disabled = false;
    input.placeholder = originalPlaceholder;
    return;
  }

  const novaTarefa = {
    user_id: user.id,
    titulo: titulo,
    prioridade: 3,
    data_vencimento: agendaFiltroAtual === 'hoje' ? new Date().toISOString().split('T')[0] :
                     agendaFiltroAtual === 'amanha' ? new Date(Date.now() + 86400000).toISOString().split('T')[0] :
                     null,
    projeto_id: agendaProjetoFiltro || null,
    ordem: agendaTarefas.length
  };

  const { data, error } = await supabase.from('agenda_tarefas').insert(novaTarefa).select();
  input.disabled = false;
  input.placeholder = originalPlaceholder;
  if (!error && data && data[0]) {
    agendaTarefas.push(data[0]);
    input.value = '';
    agendaRenderizar();
  }
}

// === ORDENAÇÃO ===
async function agendaSalvarOrdem(ids) {
  for (let i = 0; i < ids.length; i++) {
    await supabase.from('agenda_tarefas').update({ ordem: i }).eq('id', ids[i]);
  }
}

// === MODAL PROJETO ===
function agendaModalProjetoAbrir() {
  const modal = document.createElement('div');
  modal.className = 'agenda-modal-overlay';
  modal.id = 'modal-agenda-projeto';
  modal.innerHTML = `
    <div class="agenda-modal">
      <div class="agenda-modal-header">
        <h3>Novo Projeto</h3>
        <button class="agenda-modal-close" onclick="document.getElementById('modal-agenda-projeto').remove()">&times;</button>
      </div>
      <div class="agenda-modal-body">
        <div class="field">
          <label>Nome do projeto</label>
          <input type="text" id="agenda-novo-projeto-nome" placeholder="Ex: Prospecção"
                 onkeydown="if(event.key==='Enter')agendaSalvarProjeto()">
        </div>
        <div class="field">
          <label>Cor</label>
          <input type="color" id="agenda-novo-projeto-cor" value="#30d158">
        </div>
      </div>
      <div class="agenda-modal-footer">
        <button class="btn btn-secondary" onclick="document.getElementById('modal-agenda-projeto').remove()">Cancelar</button>
        <button class="btn btn-success" onclick="agendaSalvarProjeto()">Criar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById('agenda-novo-projeto-nome').focus();
}

async function agendaSalvarProjeto() {
  const nome = document.getElementById('agenda-novo-projeto-nome').value.trim();
  const cor = document.getElementById('agenda-novo-projeto-cor').value;
  if (!nome) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const novoProjeto = {
    user_id: user.id,
    nome: nome,
    cor: cor,
    ordem: agendaProjetos.length
  };

  const { data, error } = await supabase.from('agenda_projetos').insert(novoProjeto).select();
  if (!error && data && data[0]) {
    agendaProjetos.push(data[0]);
    document.getElementById('modal-agenda-projeto').remove();
    agendaRenderizar();
  }
}

// === MODAL TAREFA ===
function agendaModalTarefaAbrir() {
  const modal = document.createElement('div');
  modal.className = 'agenda-modal-overlay';
  modal.id = 'modal-agenda-tarefa';

  const optionsProjetos = agendaProjetos.map(p =>
    `<option value="${p.id}">${p.nome}</option>`
  ).join('');

  const dataDefault = agendaFiltroAtual === 'hoje' ? new Date().toISOString().split('T')[0] :
                      agendaFiltroAtual === 'amanha' ? new Date(Date.now() + 86400000).toISOString().split('T')[0] : '';

  modal.innerHTML = `
    <div class="agenda-modal">
      <div class="agenda-modal-header">
        <h3>Nova Tarefa</h3>
        <button class="agenda-modal-close" onclick="document.getElementById('modal-agenda-tarefa').remove()">&times;</button>
      </div>
      <div class="agenda-modal-body">
        <div class="field">
          <label>Título <span style="color:var(--red);">*</span></label>
          <input type="text" id="agenda-nova-tarefa-titulo" placeholder="Ex: Ligar para cliente"
                 onkeydown="if(event.key==='Enter')document.getElementById('agenda-nova-tarefa-desc').focus()">
        </div>
        <div class="field">
          <label>Descrição</label>
          <textarea id="agenda-nova-tarefa-desc" rows="2" placeholder="Opcional..."></textarea>
        </div>
        <div class="field">
          <label>Projeto</label>
          <select id="agenda-nova-tarefa-projeto">
            <option value="">Sem projeto</option>
            ${optionsProjetos}
          </select>
        </div>
        <div class="field">
          <label>Prioridade</label>
          <select id="agenda-nova-tarefa-prioridade">
            <option value="3" selected>🟡 Baixa</option>
            <option value="2">🟠 Média</option>
            <option value="1">🔴 Alta</option>
            <option value="4">⚪ Nenhuma</option>
          </select>
        </div>
        <div class="field">
          <label>Data de vencimento</label>
          <input type="date" id="agenda-nova-tarefa-vencimento" value="${dataDefault}">
        </div>
        <div class="field">
          <label>Recorrência</label>
          <select id="agenda-nova-tarefa-recorrencia">
            <option value="">Nenhuma</option>
            <option value="diaria">Diária</option>
            <option value="semanal">Semanal</option>
            <option value="mensal">Mensal</option>
          </select>
        </div>
      </div>
      <div class="agenda-modal-footer">
        <button class="btn btn-secondary" onclick="document.getElementById('modal-agenda-tarefa').remove()">Cancelar</button>
        <button class="btn btn-success" onclick="agendaCriarTarefa()">Criar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById('agenda-nova-tarefa-titulo').focus();
}

async function agendaCriarTarefa() {
  const titulo = document.getElementById('agenda-nova-tarefa-titulo').value.trim();
  if (!titulo) return;

  const modal = document.getElementById('modal-agenda-tarefa');
  const btnCriar = modal.querySelector('.btn-success');
  const btnCancelar = modal.querySelector('.btn-secondary');
  btnCriar.disabled = true;
  btnCriar.textContent = 'Criando...';
  btnCancelar.disabled = true;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    btnCriar.disabled = false;
    btnCriar.textContent = 'Criar';
    btnCancelar.disabled = false;
    return;
  }

  const novaTarefa = {
    user_id: user.id,
    titulo: titulo,
    descricao: document.getElementById('agenda-nova-tarefa-desc').value,
    projeto_id: document.getElementById('agenda-nova-tarefa-projeto').value || null,
    prioridade: parseInt(document.getElementById('agenda-nova-tarefa-prioridade').value),
    data_vencimento: document.getElementById('agenda-nova-tarefa-vencimento').value || null,
    recorrencia: document.getElementById('agenda-nova-tarefa-recorrencia').value || null,
    ordem: agendaTarefas.length
  };

  const { data, error } = await supabase.from('agenda_tarefas').insert(novaTarefa).select();
  if (!error && data && data[0]) {
    agendaTarefas.push(data[0]);
    modal.remove();
    agendaRenderizar();
  } else {
    btnCriar.disabled = false;
    btnCriar.textContent = 'Criar';
    btnCancelar.disabled = false;
  }
  }
}

// === FECHAR MODAIS COM ESC ===
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const modalTarefa = document.getElementById('modal-agenda-tarefa');
    const modalProjeto = document.getElementById('modal-agenda-projeto');
    if (modalTarefa) modalTarefa.remove();
    if (modalProjeto) modalProjeto.remove();
    agendaFecharDetalhes();
  }
});