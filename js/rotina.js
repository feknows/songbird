// === ROTINA DIARIA ===
var rotinaKpisData = null;
var rotinaBlocosData = [];
var rotinaChecklistData = [];
var rotinaAbaAtual = 'hoje';
var rotinaBlocoEditandoId = null;
var rotinaItemBlocoAtual = null;

var BLOCOS_PADRAO = [
  { nome: 'Abertura do dia', hora_inicio: '09:00', hora_fim: '09:20', itens: ['Responder WhatsApp acumulado', 'Responder Chat', 'Ver e-mails urgentes', 'Conferir agenda', 'Verificar clientes que precisam de retorno'] },
  { nome: 'Follow-up quente', hora_inicio: '09:20', hora_fim: '09:45', itens: ['Pediram proposta ontem', 'Estao proximos do fechamento', 'Precisam de confirmacao'] },
  { nome: 'Prospeccao manha', hora_inicio: '09:45', hora_fim: '11:15', itens: ['Fazer 15 ligacoes', 'Enviar 20 WhatsApps', 'Enviar 10 e-mails'] },
  { nome: 'Atendimento', hora_inicio: '11:15', hora_fim: '12:00', itens: ['Responder WhatsApp', 'Responder chat', 'Retornar ligacoes'] },
  { nome: 'Almoco', hora_inicio: '12:00', hora_fim: '13:00', itens: [] },
  { nome: 'Nova limpeza', hora_inicio: '13:00', hora_fim: '13:30', itens: ['Responder WhatsApp', 'Responder chat', 'Responder e-mail'] },
  { nome: 'Apresentacoes', hora_inicio: '13:30', hora_fim: '14:30', itens: ['Demonstracoes', 'Reunioes', 'Videochamadas'] },
  { nome: 'Propostas', hora_inicio: '14:30', hora_fim: '15:15', itens: ['Montar propostas comerciais', 'Calculos e licencas', 'Definir valores'] },
  { nome: 'Prospeccao tarde', hora_inicio: '15:15', hora_fim: '16:15', itens: ['Fazer 10 ligacoes', 'Enviar 15 WhatsApps'] },
  { nome: 'Follow-up tarde', hora_inicio: '16:15', hora_fim: '17:00', itens: ['Quem recebeu proposta', 'Quem pediu orcamento'] },
  { nome: 'Organizacao', hora_inicio: '17:00', hora_fim: '17:45', itens: ['Atualizar CRM', 'Atualizar agenda', 'Separar clientes para amanha'] },
  { nome: 'Fechamento', hora_inicio: '17:45', hora_fim: '18:00', itens: ['Quantos contatos novos?', 'Propostas enviadas?', 'Follow-ups realizados?', 'Vendas fechadas?', 'O que ficou pendente?'] },
];

var KPI_CAMPOS = [
  { key: 'ligacoes', nome: 'Ligacoes', meta: 25 },
  { key: 'whatsapp', nome: 'WhatsApp', meta: 35 },
  { key: 'followups', nome: 'Follow-ups', meta: 15 },
  { key: 'propostas', nome: 'Propostas', meta: 5 },
  { key: 'demonstracoes', nome: 'Demonstracoes', meta: 2 },
  { key: 'contatos', nome: 'Contatos', meta: 30 },
  { key: 'vendas', nome: 'Vendas', meta: 0 }
];

function rotinaTrocarAba(aba, el) {
  rotinaAbaAtual = aba;
  document.querySelectorAll('.rotina-aba').forEach(b => b.classList.remove('ativo'));
  if (el) el.classList.add('ativo');
  document.getElementById('rotina-view-hoje').style.display = aba === 'hoje' ? '' : 'none';
  document.getElementById('rotina-view-semana').style.display = aba === 'semana' ? '' : 'none';
  if (aba === 'semana') rotinaCarregarSemana();
}

function rotinaDataHoje() {
  return new Date().toISOString().slice(0, 10);
}

function rotinaFormatarData(dataStr) {
  const d = new Date(dataStr + 'T12:00:00');
  const dias = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado'];
  const meses = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  return dias[d.getDay()] + ', ' + d.getDate() + ' de ' + meses[d.getMonth()];
}

async function rotinaCarregar() {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return;
  const hoje = rotinaDataHoje();

  document.getElementById('rotina-data').textContent = rotinaFormatarData(hoje);

  let { data: kpis } = await supabase.from('rotina_kpis').select('*').eq('user_id', user.id).eq('data', hoje).maybeSingle();
  if (!kpis) {
    const insert = { user_id: user.id, data: hoje };
    KPI_CAMPOS.forEach(k => { insert[k.key + '_meta'] = k.meta; insert[k.key + '_atual'] = 0; });
    const { data: newKpis } = await supabase.from('rotina_kpis').insert(insert).select().single();
    kpis = newKpis;
  }
  rotinaKpisData = kpis;

  let { data: blocos } = await supabase.from('rotina_blocos').select('*').eq('user_id', user.id).order('ordem');
  if (!blocos || blocos.length === 0) {
    for (let i = 0; i < BLOCOS_PADRAO.length; i++) {
      const b = BLOCOS_PADRAO[i];
      await supabase.from('rotina_blocos').insert({ user_id: user.id, nome: b.nome, hora_inicio: b.hora_inicio, hora_fim: b.hora_fim, ordem: i });
    }
    const { data: refreshed } = await supabase.from('rotina_blocos').select('*').eq('user_id', user.id).order('ordem');
    blocos = refreshed;
  }
  rotinaBlocosData = blocos || [];

  let { data: checklist } = await supabase.from('rotina_checklist').select('*').eq('user_id', user.id).eq('data', hoje).order('id');
  if (!checklist || checklist.length === 0) {
    for (const b of rotinaBlocosData) {
      const padrao = BLOCOS_PADRAO.find(p => p.nome === b.nome);
      if (padrao && padrao.itens.length > 0) {
        for (const item of padrao.itens) {
          await supabase.from('rotina_checklist').insert({ user_id: user.id, bloco: b.nome, item: item, concluido: false, data: hoje });
        }
      }
    }
    const { data: refreshed } = await supabase.from('rotina_checklist').select('*').eq('user_id', user.id).eq('data', hoje).order('id');
    checklist = refreshed;
  }
  rotinaChecklistData = checklist || [];

  rotinaRenderizarKPIs();
  rotinaRenderizarTimeline();
}

function rotinaRenderizarKPIs() {
  const container = document.getElementById('rotina-kpis');
  if (!container || !rotinaKpisData) return;
  const k = rotinaKpisData;
  let html = '';
  KPI_CAMPOS.forEach(kpi => {
    const atual = k[kpi.key + '_atual'] || 0;
    const meta = k[kpi.key + '_meta'] || kpi.meta;
    const pct = meta > 0 ? Math.min(100, Math.round((atual / meta) * 100)) : 0;
    const cor = pct >= 80 ? 'kpi-verde' : pct >= 50 ? 'kpi-amarelo' : 'kpi-vermelho';
    const trend = rotinaTendencia(kpi.key);
    const podeIncrementar = ['ligacoes', 'whatsapp', 'followups', 'contatos'].includes(kpi.key);
    html += '<div class="kpi-card ' + cor + '">';
    html += '<div class="kpi-nome">' + kpi.nome + '</div>';
    html += '<div class="kpi-valores">' + atual + ' / ' + meta + '</div>';
    html += '<div class="kpi-barra"><div class="kpi-barra-fill" style="width:' + pct + '%"></div></div>';
    html += '<div class="kpi-tendencia ' + trend.cls + '">' + trend.icon + ' ' + trend.text + '</div>';
    if (podeIncrementar) {
      html += '<div class="kpi-controles">';
      html += '<button class="kpi-btn" onclick="rotinaKpiDelta(\'' + kpi.key + '\', -1)">−</button>';
      html += '<button class="kpi-btn" onclick="rotinaKpiDelta(\'' + kpi.key + '\', 1)">+</button>';
      html += '</div>';
    }
    html += '</div>';
  });
  container.innerHTML = html;
}

function rotinaTendencia(key) {
  const k = rotinaKpisData;
  if (!k) return { cls: 'flat', icon: '—', text: '' };
  const atual = k[key + '_atual'] || 0;
  const meta = k[key + '_meta'] || 1;
  const ratio = atual / meta;
  const hour = new Date().getHours();
  const expected = Math.min(1, (hour - 9) / 9);
  if (ratio >= expected * 1.1) return { cls: 'up', icon: '▲', text: 'Acima da meta' };
  if (ratio <= expected * 0.8) return { cls: 'down', icon: '▼', text: 'Abaixo da meta' };
  return { cls: 'flat', icon: '—', text: 'No ritmo' };
}

async function rotinaKpiDelta(key, delta) {
  if (!rotinaKpisData) return;
  const campo = key + '_atual';
  const novo = Math.max(0, (rotinaKpisData[campo] || 0) + delta);
  rotinaKpisData[campo] = novo;
  rotinaRenderizarKPIs();
  await supabase.from('rotina_kpis').update({ [campo]: novo }).eq('id', rotinaKpisData.id);
}

function rotinaRenderizarTimeline() {
  const container = document.getElementById('rotina-timeline');
  if (!container) return;
  const agora = new Date();
  const horaAtual = agora.getHours().toString().padStart(2, '0') + ':' + agora.getMinutes().toString().padStart(2, '0');
  let html = '';
  rotinaBlocosData.forEach(bloco => {
    const itens = rotinaChecklistData.filter(c => c.bloco === bloco.nome);
    const concluidos = itens.filter(c => c.concluido).length;
    const total = itens.length;
    const ehAtual = horaAtual >= bloco.hora_inicio && horaAtual < bloco.hora_fim;
    html += '<div class="bloco-card' + (ehAtual ? ' bloco-atual' : '') + '" data-bloco-id="' + bloco.id + '">';
    html += '<div class="bloco-header" onclick="rotinaToggleBloco(this)">';
    html += '<span class="bloco-horario">' + bloco.hora_inicio + ' – ' + bloco.hora_fim + '</span>';
    html += '<span class="bloco-nome">' + bloco.nome + '</span>';
    if (total > 0) html += '<span class="bloco-progresso">✓ ' + concluidos + '/' + total + '</span>';
    html += '<span class="bloco-actions">';
    html += '<button class="bloco-action-btn" onclick="event.stopPropagation();rotinaEditarBloco(' + bloco.id + ')" title="Editar">&#9998;</button>';
    html += '<button class="bloco-action-btn" onclick="event.stopPropagation();rotinaRemoverBloco(' + bloco.id + ')" title="Remover">&#10005;</button>';
    html += '</span>';
    html += '<span class="bloco-toggle">▶</span>';
    html += '</div>';
    html += '<div class="bloco-body">';
    itens.forEach(item => {
      html += '<div class="bloco-item">';
      html += '<div class="bloco-item-check' + (item.concluido ? ' checked' : '') + '" onclick="rotinaToggleItem(' + item.id + ',' + !item.concluido + ')"></div>';
      html += '<span class="bloco-item-texto' + (item.concluido ? ' concluido' : '') + '">' + item.item + '</span>';
      html += '<button class="bloco-item-del" onclick="rotinaRemoverItem(' + item.id + ')" title="Remover">✕</button>';
      html += '</div>';
    });
    html += '<div class="bloco-add-item" onclick="rotinaAdicionarItem(\'' + bloco.nome.replace(/'/g, "\'") + '\')">+ Adicionar item</div>';
    html += '</div>';
    html += '</div>';
  });
  container.innerHTML = html;
}

function rotinaToggleBloco(header) {
  header.closest('.bloco-card').classList.toggle('bloco-aberto');
}

async function rotinaToggleItem(id, concluido) {
  const item = rotinaChecklistData.find(c => c.id === id);
  if (!item) return;
  item.concluido = concluido;
  rotinaRenderizarTimeline();
  await supabase.from('rotina_checklist').update({ concluido: concluido }).eq('id', id);
}

function rotinaAdicionarItem(blocoNome) {
  rotinaItemBlocoAtual = blocoNome;
  document.getElementById('modal-item-texto').value = '';
  document.getElementById('modal-item').style.display = '';
  setTimeout(() => document.getElementById('modal-item-texto').focus(), 100);
}

async function rotinaSalvarItem() {
  const texto = document.getElementById('modal-item-texto').value.trim();
  if (!texto) return;
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return;
  const { data } = await supabase.from('rotina_checklist').insert({
    user_id: user.id, bloco: rotinaItemBlocoAtual, item: texto, concluido: false, data: rotinaDataHoje()
  }).select().single();
  if (data) rotinaChecklistData.push(data);
  rotinaRenderizarTimeline();
  rotinaFecharModal('modal-item');
}

async function rotinaRemoverItem(id) {
  rotinaChecklistData = rotinaChecklistData.filter(c => c.id !== id);
  rotinaRenderizarTimeline();
  await supabase.from('rotina_checklist').delete().eq('id', id);
}

function rotinaEditarBloco(id) {
  const bloco = rotinaBlocosData.find(b => b.id === id);
  if (!bloco) return;
  rotinaBlocoEditandoId = id;
  document.getElementById('modal-bloco-nome').value = bloco.nome;
  document.getElementById('modal-bloco-hora-inicio').value = bloco.hora_inicio;
  document.getElementById('modal-bloco-hora-fim').value = bloco.hora_fim;
  document.getElementById('modal-bloco-titulo').textContent = 'Editar Bloco';
  document.getElementById('modal-bloco').style.display = '';
  setTimeout(() => document.getElementById('modal-bloco-nome').focus(), 100);
}

function rotinaNovoBloco() {
  rotinaBlocoEditandoId = null;
  document.getElementById('modal-bloco-nome').value = '';
  document.getElementById('modal-bloco-hora-inicio').value = '';
  document.getElementById('modal-bloco-hora-fim').value = '';
  document.getElementById('modal-bloco-titulo').textContent = 'Novo Bloco';
  document.getElementById('modal-bloco').style.display = '';
  setTimeout(() => document.getElementById('modal-bloco-nome').focus(), 100);
}

async function rotinaSalvarBloco() {
  const nome = document.getElementById('modal-bloco-nome').value.trim();
  const hora_inicio = document.getElementById('modal-bloco-hora-inicio').value.trim();
  const hora_fim = document.getElementById('modal-bloco-hora-fim').value.trim();
  if (!nome || !hora_inicio || !hora_fim) return;
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return;
  if (rotinaBlocoEditandoId) {
    await supabase.from('rotina_blocos').update({ nome, hora_inicio, hora_fim }).eq('id', rotinaBlocoEditandoId);
    const b = rotinaBlocosData.find(b => b.id === rotinaBlocoEditandoId);
    if (b) { b.nome = nome; b.hora_inicio = hora_inicio; b.hora_fim = hora_fim; }
  } else {
    const ordem = rotinaBlocosData.length;
    const { data } = await supabase.from('rotina_blocos').insert({ user_id: user.id, nome, hora_inicio, hora_fim, ordem }).select().single();
    if (data) rotinaBlocosData.push(data);
  }
  rotinaRenderizarTimeline();
  rotinaFecharModal('modal-bloco');
}

async function rotinaRemoverBloco(id) {
  if (!confirm('Remover este bloco e todos os itens?')) return;
  rotinaBlocosData = rotinaBlocosData.filter(b => b.id !== id);
  rotinaChecklistData = rotinaChecklistData.filter(c => {
    const bloco = rotinaBlocosData.find(b => b.nome === c.bloco);
    return !!bloco;
  });
  rotinaRenderizarTimeline();
  await supabase.from('rotina_blocos').delete().eq('id', id);
}

function rotinaFecharModal(id) {
  document.getElementById(id).style.display = 'none';
}

async function rotinaCarregarSemana() {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return;
  const hoje = new Date();
  const dias = [];
  for (let i = 4; i >= 0; i--) {
    const d = new Date(hoje);
    d.setDate(d.getDate() - i);
    dias.push(d.toISOString().slice(0, 10));
  }
  const { data } = await supabase.from('rotina_kpis').select('*').eq('user_id', user.id).gte('data', dias[0]).lte('data', dias[dias.length - 1]);
  const kpisPorDia = {};
  (data || []).forEach(k => { kpisPorDia[k.data] = k; });

  const grid = document.getElementById('rotina-semana-grid');
  const resumo = document.getElementById('rotina-semana-resumo');
  if (!grid) return;

  let gridHtml = '';
  KPI_CAMPOS.forEach(kpi => {
    const maxVal = Math.max(kpi.meta, ...dias.map(d => (kpisPorDia[d] || {})[kpi.key + '_atual'] || 0));
    gridHtml += '<div class="semana-card"><h4>' + kpi.nome + '</h4>';
    gridHtml += '<div class="semana-barras">';
    let totalSemana = 0;
    dias.forEach(d => {
      const val = (kpisPorDia[d] || {})[kpi.key + '_atual'] || 0;
      totalSemana += val;
      const h = maxVal > 0 ? Math.max(4, (val / maxVal) * 80) : 4;
      const diaLabel = d.slice(8, 10) + '/' + d.slice(5, 7);
      gridHtml += '<div class="semana-barra" style="height:' + h + 'px" title="' + val + '"><span class="semana-barra-label">' + diaLabel + '</span></div>';
    });
    gridHtml += '</div>';
    gridHtml += '<div class="semana-total">' + totalSemana + '</div>';
    gridHtml += '<div class="semana-total-label">total semana</div>';
    gridHtml += '</div>';
  });
  grid.innerHTML = gridHtml;

  let resumoHtml = '<h3>Resumo da Semana</h3><div class="semana-resumo-grid">';
  KPI_CAMPOS.forEach(kpi => {
    let total = 0;
    dias.forEach(d => { total += (kpisPorDia[d] || {})[kpi.key + '_atual'] || 0; });
    resumoHtml += '<div class="semana-resumo-item"><div class="sr-val">' + total + '</div><div class="sr-label">' + kpi.nome + '</div></div>';
  });
  resumoHtml += '</div>';
  resumo.innerHTML = resumoHtml;
}

// === ROTINA: Auto-increment propostas on Gerar Texto ===
var _rotinaOriginalGerarTexto = null;
function rotinaHookGerarTexto() {
  setTimeout(() => {
    document.querySelectorAll('.btn-success').forEach(btn => {
      if (btn.textContent.includes('Gerar texto') && !btn.dataset.rotinaHook) {
        btn.dataset.rotinaHook = '1';
        btn.addEventListener('click', () => {
          if (rotinaKpisData) {
            rotinaKpiDelta('propostas', 1);
          }
        });
      }
    });
  }, 500);
}
