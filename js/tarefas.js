// === KANBAN / TAREFAS ===
var tarefasData = [];
var colunasData = [];
var tarefaEditandoId = null;
var kanbanSortables = [];
var COLUNAS_PADRAO = ['A Fazer', 'Fazendo', 'Feito'];

var kanbanFiltroAtual = 'ativas';

function tarefasFiltrar(filtro, el) {
  kanbanFiltroAtual = filtro;
  document.querySelectorAll('.kanban-filtro').forEach(s => s.classList.remove('ativo'));
  if (el) el.classList.add('ativo');
  tarefasCarregar();
}

async function tarefasCarregar() {
  const board = document.getElementById('kanban-board');
  if (!board) return;
  try {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    let query = supabase.from('tarefas').select('*').eq('user_id', user.id).order('ordem');
    if (kanbanFiltroAtual === 'ativas') {
      query = query.neq('status', 'Feito');
    } else if (kanbanFiltroAtual === 'inativas') {
      query = query.eq('status', 'Feito');
    }
    const { data: tarefas, error: errT } = await query;
    if (errT) throw errT;
    tarefasData = tarefas || [];

    const { data: cols, error: errC } = await supabase.from('colunas')
      .select('*').eq('user_id', user.id).order('ordem').order('id');
    if (errC) throw errC;

    if (!cols || cols.length === 0) {
      colunasData = COLUNAS_PADRAO.map((n, i) => ({ id: null, nome: n, ordem: i, cor: '#30d158', user_id: user.id, _nova: true }));
    } else {
      colunasData = cols;
    }

    tarefasRenderizar(board);
    tarefasCarregarHistorico();
  } catch (e) {
    board.innerHTML = `<span style="color:var(--danger);font-size:0.85rem;">Erro ao carregar tarefas: ${e.message}</span>`;
  }
}

function tarefasRenderizar(board) {
  kanbanSortables.forEach(s => s.destroy());
  kanbanSortables = [];

  let html = '';
  for (const col of colunasData) {
    const colNome = col.nome;
    const tarefasCol = tarefasData.filter(t => t.status === colNome)
      .sort((a, b) => a.ordem - b.ordem);
    const count = tarefasCol.length;

    html += `<div class="kanban-col" style="border-top-color:${col.cor || '#30d158'}">`;
    html += `<div class="kanban-col-header">`;
    html += `<span class="col-nome">${colNome}</span>`;
    html += `<span class="col-count">${count}</span>`;
    html += `<div class="col-actions">`;
    html += `<button title="Nova tarefa aqui" onclick="tarefaModalAbrir('${colNome.replace(/'/g, "\\'")}')">+</button>`;
    html += `</div></div>`;
    html += `<div class="kanban-col-body" data-coluna="${colNome.replace(/"/g, '&quot;')}" id="kanban-body-${colNome.replace(/\s+/g, '-')}">`;
    for (const t of tarefasCol) {
      html += tarefaCardHtml(t);
    }
    html += `</div></div>`;
  }
  board.innerHTML = html;

  for (const col of colunasData) {
    const colNome = col.nome;
    const el = document.getElementById('kanban-body-' + colNome.replace(/\s+/g, '-'));
    if (!el) continue;
    const s = new Sortable(el, {
      group: 'tarefas',
      animation: 150,
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      onEnd: async function(evt) {
        const tarefaId = parseInt(evt.item.dataset.tarefaId);
        const novoStatus = evt.to.dataset.coluna;
        const novaOrdem = evt.newIndex;
        if (!tarefaId) return;
        try {
          const tarefa = tarefasData.find(t => t.id === tarefaId);
          const statusAntigo = tarefa ? tarefa.status : '';
          await supabase.from('tarefas').update({ status: novoStatus, ordem: novaOrdem }).eq('id', tarefaId);
          if (tarefa) tarefa.status = novoStatus;
          if (tarefa) tarefa.ordem = novaOrdem;
          if (statusAntigo !== novoStatus) {
            const acao = novoStatus === 'Feito' ? 'concluida' : 'movida';
            await supabase.from('tarefas_historico').insert({
              tarefa_id: tarefaId, acao: acao,
              de_status: statusAntigo, para_status: novoStatus,
              user_id: (await supabase.auth.getUser()).data.user?.id
            });
            tarefasCarregarHistorico();
          }
          tarefasRenderizar(board);
        } catch (e) {
          console.warn('Erro ao mover tarefa:', e);
        }
      }
    });
    kanbanSortables.push(s);
  }
}

function tarefaCardHtml(t) {
  const prioClass = 'prioridade-' + (t.prioridade || 'media');
  const prioLabel = { alta: 'Alta', media: 'Média', baixa: 'Baixa' }[t.prioridade || 'media'];
  const venc = t.data_vencimento ? new Date(t.data_vencimento + 'T00:00:00') : null;
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const atrasado = venc && venc < hoje;
  const vencStr = venc ? venc.toLocaleDateString('pt-BR') : '';
  const clienteStr = [t.nome_cliente, t.codigo_cliente].filter(Boolean).join(' · ');
  return `<div class="kanban-card" data-tarefa-id="${t.id}" onclick="tarefaModalAbrirEdicao(${t.id})">
    <div class="card-top">
      <span class="card-titulo">${t.titulo || '(sem título)'}</span>
      <span class="card-prioridade ${prioClass}">${prioLabel}</span>
    </div>
    ${clienteStr ? `<div class="card-info"><span class="cliente">${clienteStr}</span></div>` : ''}
    ${t.telefone ? `<div class="card-info" style="margin-top:2px;">📞 ${t.telefone}</div>` : ''}
    ${vencStr ? `<div class="card-info"><span class="vencimento${atrasado ? ' atrasado' : ''}">📅 ${vencStr}${atrasado ? ' (atrasado)' : ''}</span></div>` : ''}
    ${t.resumo ? `<div class="card-resumo">${t.resumo}</div>` : ''}
  </div>`;
}

function tarefaModalAbrir(statusPrefill) {
  tarefaEditandoId = null;
  document.getElementById('modal-tarefa-titulo').textContent = '+ Nova Tarefa';
  document.getElementById('tarefa-id').value = '';
  document.getElementById('tarefa-titulo').value = '';
  document.getElementById('tarefa-prioridade').value = 'media';
  document.getElementById('tarefa-cliente').value = '';
  document.getElementById('tarefa-codigo').value = '';
  document.getElementById('tarefa-telefone').value = '';
  document.getElementById('tarefa-vencimento').value = '';
  document.getElementById('tarefa-descricao').value = '';
  document.getElementById('tarefa-resumo').value = '';
  document.getElementById('tarefa-anotacoes').value = '';
  document.getElementById('tarefa-btn-excluir').style.display = 'none';

  const statusSelect = document.getElementById('tarefa-status');
  statusSelect.innerHTML = colunasData.map(c =>
    `<option value="${c.nome}">${c.nome}</option>`
  ).join('');
  if (statusPrefill) statusSelect.value = statusPrefill;

  document.getElementById('modal-tarefa').style.display = 'flex';
  setTimeout(() => document.getElementById('tarefa-titulo').focus(), 100);
}

async function tarefaModalAbrirEdicao(id) {
  const t = tarefasData.find(x => x.id === id);
  if (!t) return;
  tarefaEditandoId = id;
  document.getElementById('modal-tarefa-titulo').textContent = '✎ Editar Tarefa';
  document.getElementById('tarefa-id').value = id;
  document.getElementById('tarefa-titulo').value = t.titulo || '';
  document.getElementById('tarefa-prioridade').value = t.prioridade || 'media';
  document.getElementById('tarefa-cliente').value = t.nome_cliente || '';
  document.getElementById('tarefa-codigo').value = t.codigo_cliente || '';
  document.getElementById('tarefa-telefone').value = t.telefone || '';
  document.getElementById('tarefa-vencimento').value = t.data_vencimento || '';
  document.getElementById('tarefa-descricao').value = t.descricao || '';
  document.getElementById('tarefa-resumo').value = t.resumo || '';
  document.getElementById('tarefa-anotacoes').value = t.anotacoes || '';
  document.getElementById('tarefa-btn-excluir').style.display = 'inline-block';

  const statusSelect = document.getElementById('tarefa-status');
  statusSelect.innerHTML = colunasData.map(c =>
    `<option value="${c.nome}">${c.nome}</option>`
  ).join('');
  statusSelect.value = t.status || '';

  document.getElementById('modal-tarefa').style.display = 'flex';
  setTimeout(() => document.getElementById('tarefa-titulo').focus(), 100);
}

function tarefaModalFechar() {
  document.getElementById('modal-tarefa').style.display = 'none';
  tarefaEditandoId = null;
}

async function tarefaModalSalvar() {
  const titulo = document.getElementById('tarefa-titulo').value.trim();
  if (!titulo) { alert('Preencha o título da tarefa.'); return; }

  const dados = {
    titulo: titulo,
    prioridade: document.getElementById('tarefa-prioridade').value,
    status: document.getElementById('tarefa-status').value,
    nome_cliente: document.getElementById('tarefa-cliente').value.trim(),
    codigo_cliente: document.getElementById('tarefa-codigo').value.trim(),
    telefone: document.getElementById('tarefa-telefone').value.trim(),
    data_vencimento: document.getElementById('tarefa-vencimento').value || null,
    descricao: document.getElementById('tarefa-descricao').value.trim(),
    resumo: document.getElementById('tarefa-resumo').value.trim(),
    anotacoes: document.getElementById('tarefa-anotacoes').value.trim(),
  };

  try {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    if (tarefaEditandoId) {
      const t = tarefasData.find(x => x.id === tarefaEditandoId);
      const statusAntigo = t ? t.status : '';
      await supabase.from('tarefas').update(dados).eq('id', tarefaEditandoId).eq('user_id', user.id);
      if (statusAntigo !== dados.status) {
        await supabase.from('tarefas_historico').insert({
          tarefa_id: tarefaEditandoId, acao: dados.status === 'Feito' ? 'concluida' : 'movida',
          de_status: statusAntigo, para_status: dados.status,
          user_id: user.id
        });
      } else {
        await supabase.from('tarefas_historico').insert({
          tarefa_id: tarefaEditandoId, acao: 'editada', user_id: user.id
        });
      }
    } else {
      const { data: maxOrdem } = await supabase.from('tarefas')
        .select('ordem').eq('status', dados.status).order('ordem', { ascending: false }).limit(1);
      dados.ordem = (maxOrdem?.[0]?.ordem ?? -1) + 1;
      dados.user_id = user.id;
      const { data: inserted } = await supabase.from('tarefas').insert(dados).select('id').single();
      if (inserted) {
        await supabase.from('tarefas_historico').insert({
          tarefa_id: inserted.id, acao: 'criada', para_status: dados.status, user_id: user.id
        });
      }
    }

    tarefaModalFechar();
    tarefasCarregar();
  } catch (e) {
    alert('Erro ao salvar tarefa: ' + e.message);
  }
}

async function tarefaExcluir() {
  if (!tarefaEditandoId) return;
  const id = tarefaEditandoId;
  const modal = document.getElementById('modal-tarefa');
  modal.style.display = 'none';
  confirmarAcao('Excluir Tarefa', 'Tem certeza que deseja excluir esta tarefa?', async () => {
    try {
      await supabase.from('tarefas').delete().eq('id', id);
      tarefaModalFechar();
      tarefasCarregar();
    } catch (e) {
      alert('Erro ao excluir: ' + e.message);
    }
  }, () => {
    modal.style.display = 'flex';
  });
}

// === COLUNAS ===
var colunasEditando = [];

function tarefaModalColunas() {
  colunasEditando = colunasData.map(c => ({ ...c }));
  document.getElementById('colunas-lista').innerHTML = '';
  const msg = document.getElementById('colunas-msg');
  if (msg) msg.classList.remove('show');
  colunasRenderizarLista();
  document.getElementById('modal-colunas').style.display = 'flex';
}

function tarefaModalColunasFechar() {
  document.getElementById('modal-colunas').style.display = 'none';
  colunasEditando = [];
}

function colunasRenderizarLista() {
  const div = document.getElementById('colunas-lista');
  let html = '';
  for (let i = 0; i < colunasEditando.length; i++) {
    const c = colunasEditando[i];
    html += `<div class="coluna-edit-row" data-index="${i}" style="display:flex;align-items:center;gap:8px;margin-bottom:8px;padding:8px;background:var(--bg-raised);border:1px solid var(--accent-hairline);border-radius:4px;">
      <span style="color:var(--text-muted);font-size:0.8rem;cursor:move;" title="Arrastar">⠿</span>
      <input type="color" class="col-cor" value="${c.cor || '#30d158'}" onchange="colunasEditando[${i}].cor=this.value" style="width:30px;height:30px;border:none;cursor:pointer;background:none;padding:0;">
      <input type="text" class="col-nome-input" value="${c.nome}" oninput="colunasEditando[${i}].nome=this.value" style="flex:1;padding:6px 8px;border:1px solid var(--accent-hairline);border-radius:4px;font-size:0.85rem;outline:none;background:var(--bg-raised);color:var(--text-primary);font-family:var(--font-mono);">
      <button class="btn btn-sm btn-danger" onclick="colunaRemover(${i})" style="padding:2px 6px;font-size:0.7rem;">✕</button>
    </div>`;
  }
  div.innerHTML = html;
  if (typeof Sortable !== 'undefined') {
    if (div._sortable) div._sortable.destroy();
    div._sortable = new Sortable(div, {
      animation: 150,
      handle: '.coluna-edit-row',
      onEnd: function(evt) {
        const items = div.querySelectorAll('.coluna-edit-row');
        const reordenado = [];
        items.forEach(el => {
          const idx = parseInt(el.dataset.index);
          reordenado.push(colunasEditando[idx]);
        });
        colunasEditando = reordenado;
        colunasRenderizarLista();
      }
    });
  }
}

function colunaAdicionar() {
  colunasEditando.push({ id: null, nome: 'Nova coluna', cor: '#30d158', ordem: colunasEditando.length, _nova: true });
  colunasRenderizarLista();
}

function colunaRemover(idx) {
  if (colunasEditando.length <= 1) { alert('Deve haver pelo menos uma coluna.'); return; }
  colunasEditando.splice(idx, 1);
  colunasRenderizarLista();
}

async function tarefaModalColunasSalvar() {
  const nomes = colunasEditando.map(c => c.nome.trim()).filter(Boolean);
  if (nomes.length === 0) { alert('Adicione pelo menos uma coluna com nome.'); return; }
  if (new Set(nomes).size !== nomes.length) { alert('Nomes de colunas duplicados.'); return; }

  try {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    await supabase.from('colunas').delete().eq('user_id', user.id);

    for (let i = 0; i < colunasEditando.length; i++) {
      const c = colunasEditando[i];
      await supabase.from('colunas').insert({
        nome: c.nome.trim(),
        cor: c.cor || '#30d158',
        ordem: i,
        user_id: user.id
      });
    }

    const msg = document.getElementById('colunas-msg');
    if (msg) { msg.textContent = 'Colunas salvas com sucesso!'; msg.classList.add('show'); }
    tarefaModalColunasFechar();
    tarefasCarregar();
  } catch (e) {
    alert('Erro ao salvar colunas: ' + e.message);
  }
}

// === HISTÓRICO ===
async function tarefasCarregarHistorico() {
  const tbody = document.getElementById('kanban-historico-body');
  if (!tbody) return;
  try {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;
    const { data: historico } = await supabase.from('tarefas_historico')
      .select('*, tarefas!inner(titulo, codigo_cliente)')
      .eq('user_id', user.id)
      .order('alterado_em', { ascending: false })
      .limit(50);
    if (!historico || historico.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:20px;">Nenhuma movimentação ainda.</td></tr>';
      return;
    }
    const acoesLabel = { criada: 'Criada', movida: 'Movida', editada: 'Editada', concluida: 'Concluída' };
    tbody.innerHTML = historico.map(h => {
      const acao = h.acao || '';
      const acaoLabel = acoesLabel[acao] || acao;
      const data = h.alterado_em ? new Date(h.alterado_em).toLocaleString('pt-BR') : '—';
      const titulo = h.tarefas?.titulo || '(removida)';
      const codigo = h.tarefas?.codigo_cliente || '—';
      return `<tr>
        <td style="color:var(--text-muted);">${codigo}</td>
        <td>${titulo}</td>
        <td><span class="badge-historico badge-${acao}">${acaoLabel}</span></td>
        <td style="color:var(--text-muted);">${h.de_status || '—'}</td>
        <td style="color:var(--text-muted);">${h.para_status || '—'}</td>
        <td style="color:var(--text-muted);">${data}</td>
      </tr>`;
    }).join('');
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--danger);padding:20px;">Erro: ${e.message}</td></tr>`;
  }
}
