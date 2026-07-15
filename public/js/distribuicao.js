// === DISTRIBUICAO ===
const DISTRIB_VENDEDORES = ['Denis', 'Marcelo', 'Ricardo'];
let DISTRIB_produtosCache = [];
let DISTRIB_faixasCache = [];
let distribVendedorAlvo = null;
let distribProdutoAlarmeId = null;
let distribEditandoId = null;

async function distribCarregar() {
  const widget = document.getElementById('distrib-widget');
  if (!widget) return;
  try {
    const { data: rows, error } = await supabase
      .from('distribuicao')
      .select('id, vendedor, criado_em, crm_id, produto_id, faixa_id, modulos, avulsos')
      .order('id', { ascending: false });
    if (error) throw error;

    widget.style.display = 'block';

    const stats = {};
    DISTRIB_VENDEDORES.forEach(v => stats[v] = 0);
    let ultimo = null;
    if (rows && rows.length > 0) {
      ultimo = rows[0].vendedor;
      rows.forEach(r => { if (stats[r.vendedor] !== undefined) stats[r.vendedor]++; });
    }

    await distribCarregarCache();

    const valorPorVendedor = {};
    DISTRIB_VENDEDORES.forEach(v => valorPorVendedor[v] = 0);
    let totalGeral = 0;
    if (rows) {
      rows.forEach(r => {
        const val = distribCalcularTotal(r);
        if (valorPorVendedor[r.vendedor] !== undefined) valorPorVendedor[r.vendedor] += val;
        totalGeral += val;
      });
    }

    const proximo = distribProximo(ultimo);
    distribRenderizar(proximo, stats, rows ? rows.length : 0, valorPorVendedor, totalGeral);
    distribRenderizarHistorico(rows || []);
    distribRenderizarBadge(proximo);
  } catch (e) {
    console.warn('distribCarregar erro:', e);
    widget.style.display = 'none';
  }
}

async function distribCarregarCache() {
  if (DISTRIB_produtosCache.length) return;
  const { data: prods } = await supabase.from('produtos').select('id, nome').order('id');
  const { data: faixas } = await supabase.from('faixas').select('id, descricao, valor_base').order('id');
  DISTRIB_produtosCache = prods || [];
  DISTRIB_faixasCache = faixas || [];
}

function distribNomeProduto(id) {
  const p = DISTRIB_produtosCache.find(x => x.id === id);
  return p ? p.nome : '—';
}

function distribNomeFaixa(id) {
  const f = DISTRIB_faixasCache.find(x => x.id === id);
  return f ? f.descricao : '—';
}

function distribCalcularTotal(r) {
  const totalFaixa = (DISTRIB_faixasCache.find(f => f.id === r.faixa_id)?.valor_base || 0);
  const totalModulos = (r.modulos || []).reduce((s, m) => s + (m.valor || 0), 0);
  const totalAvulsos = (r.avulsos || []).reduce((s, a) => {
    const v = DISTRIB_faixasCache.find(f => f.descricao === a.nome)?.valor_base || 0;
    return s + v * (a.quantidade || 1);
  }, 0);
  return totalFaixa + totalModulos + totalAvulsos;
}

async function distribCarregarBadge() {
  try {
    const { data: rows, error } = await supabase
      .from('distribuicao')
      .select('vendedor')
      .order('id', { ascending: false });
    if (error) throw error;
    const ultimo = rows && rows.length > 0 ? rows[0].vendedor : null;
    const proximo = distribProximo(ultimo);
    distribRenderizarBadge(proximo);
  } catch (_) {}
}

function distribProximo(ultimo) {
  if (!ultimo) return DISTRIB_VENDEDORES[0];
  const idx = DISTRIB_VENDEDORES.indexOf(ultimo);
  if (idx === -1) return DISTRIB_VENDEDORES[0];
  return DISTRIB_VENDEDORES[(idx + 1) % DISTRIB_VENDEDORES.length];
}

function distribRenderizar(proximo, stats, total, valorPorVendedor, totalGeral) {
  const info = document.getElementById('distrib-info');
  const statsEl = document.getElementById('distrib-stats');
  if (!info || !statsEl) return;

  const fmt = v => 'R$ ' + v.toFixed(2).replace('.', ',');

  const vendedoresHtml = DISTRIB_VENDEDORES.map(v => {
    const ativo = v === proximo ? ' ativo' : '';
    const cnt = stats[v] || 0;
    const val = valorPorVendedor?.[v] || 0;
    return '<div class="distrib-vendedor' + ativo + '" onclick="distribAvancar(\'' + v + '\')">' + v + ' <span class="cnt">(' + cnt + ')</span><span class="valor">' + fmt(val) + '</span></div>';
  }).join('<span class="distrib-seta">→</span>');

  info.innerHTML = vendedoresHtml + '<button class="btn btn-success btn-sm distrib-btn" onclick="distribAvancar()">✓ Distribuir para ' + proximo + '</button>';

  statsEl.innerHTML =
    '<div class="distrib-stats-summary">' +
      '<span>Total distribuído: <strong>' + total + '</strong></span>' +
    '</div>' +
    '<div class="distrib-stats-divider"></div>' +
    '<div class="distrib-stats-vendedores">' +
      DISTRIB_VENDEDORES.map(v => {
        const val = valorPorVendedor?.[v] || 0;
        const cnt = stats[v] || 0;
        return '<div class="distrib-stats-vendedor">' +
          '<span class="nome">' + v + '</span>' +
          '<span class="valor">' + fmt(val) + '</span>' +
          '<span class="cnt">' + cnt + ' distribuições</span>' +
          '</div>';
      }).join('') +
    '</div>' +
    '<div class="distrib-stats-total-geral">Valor total acumulado: ' + fmt(totalGeral || 0) + '</div>';
}

function distribRenderizarBadge(proximo) {
  const badge = document.getElementById('distrib-badge');
  const nome = document.getElementById('distrib-badge-nome');
  if (!badge || !nome) return;
  badge.style.display = 'block';
  nome.textContent = proximo;
}

function distribRenderizarHistorico(rows) {
  const tbody = document.getElementById('distrib-historico');
  if (!tbody) return;
  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:20px;">Nenhuma distribuição ainda.</td></tr>';
    return;
  }
  tbody.innerHTML = rows.slice(0, 20).map((r, i) => {
    const data = r.criado_em ? new Date(r.criado_em).toLocaleString('pt-BR') : '—';
    const modulosHtml = (r.modulos && r.modulos.length)
      ? r.modulos.map(m => m.nome).join(', ') : '—';
    const avulsosHtml = (r.avulsos && r.avulsos.length)
      ? r.avulsos.map(a => a.nome + (a.quantidade > 1 ? ' (×' + a.quantidade + ')' : '')).join(', ')
      : '—';
    const total = distribCalcularTotal(r);
    const detalhes = '<strong>Produto:</strong> ' + distribNomeProduto(r.produto_id) +
      ' · <strong>Faixa:</strong> ' + distribNomeFaixa(r.faixa_id) +
      '<br><strong>Módulos:</strong> ' + modulosHtml +
      '<br><strong>Avulsos:</strong> ' + avulsosHtml;
    return '<tr class="distrib-row" onclick="distribToggleDetalhes(this)" style="cursor:pointer;" data-id="' + r.id + '">' +
      '<td style="padding:8px;border-bottom:1px solid var(--accent-hairline);color:var(--text-muted);">#' + (rows.length - i) + '</td>' +
      '<td style="padding:8px;border-bottom:1px solid var(--accent-hairline);">' + r.vendedor + '</td>' +
      '<td style="padding:8px;border-bottom:1px solid var(--accent-hairline);font-family:monospace;font-size:0.8rem;">' + (r.crm_id || '—') + '</td>' +
      '<td style="padding:8px;border-bottom:1px solid var(--accent-hairline);color:var(--text-muted);">' + data + '</td>' +
      '<td style="padding:8px;border-bottom:1px solid var(--accent-hairline);font-family:monospace;font-size:0.8rem;">R$ ' + total.toFixed(2).replace('.', ',') + '</td>' +
      '</tr>' +
      '<tr class="distrib-detalhes" style="display:none;">' +
      '<td colspan="5" style="padding:6px 8px 10px 8px;font-size:0.8rem;color:var(--text-secondary);background:var(--bg-raised);border-bottom:1px solid var(--accent-hairline);line-height:1.6;">' +
        detalhes +
        '<div style="margin-top:8px;display:flex;gap:6px;">' +
          '<button class="btn btn-sm btn-secondary" onclick="event.stopPropagation();distribEditar(' + r.id + ')">✎ Editar</button>' +
          '<button class="btn btn-sm btn-danger" onclick="event.stopPropagation();distribDeletar(' + r.id + ')">✕ Excluir</button>' +
        '</div>' +
      '</td>' +
      '</tr>';
  }).join('');
}

function distribToggleDetalhes(tr) {
  const next = tr.nextElementSibling;
  if (next && next.classList.contains('distrib-detalhes')) {
    next.style.display = next.style.display === 'none' ? 'table-row' : 'none';
  }
}

function distribMensagem(texto) {
  const el = document.getElementById('distrib-msg');
  if (el) el.textContent = texto;
}

async function distribAvancar(vendedor) {
  const info = document.getElementById('distrib-info');
  if (!info) return;
  if (!vendedor) {
    const ativo = info.querySelector('.distrib-vendedor.ativo');
    if (!ativo) { distribMensagem('Erro: nenhum vendedor ativo'); return; }
    vendedor = ativo.textContent.trim().split(' ')[0];
  }
  distribVendedorAlvo = vendedor;
  distribEditandoId = null;
  document.getElementById('distrib-modal-titulo').innerHTML = '◆ Distribuir para <span id="distrib-modal-vendedor">' + distribVendedorAlvo + '</span>';
  document.getElementById('modal-distribuir').style.display = 'flex';
  await distribModalCarregar();
}

async function distribModalCarregar(editData) {
  document.getElementById('distrib-crm-id').value = '';
  document.getElementById('distrib-crm-error').style.display = 'none';
  document.getElementById('distrib-modal-msg').style.display = 'none';

  const { data: prodAlarme } = await supabase.from('produtos').select('id').eq('tipo', 'alarme').maybeSingle();
  if (!prodAlarme) {
    distribModalMsg('Nenhum produto do tipo alarme encontrado');
    return;
  }
  distribProdutoAlarmeId = prodAlarme.id;

  const { data: faixas } = await supabase.from('faixas').select('*').eq('produto_id', distribProdutoAlarmeId).order('ordem').order('id');
  const { data: modulos } = await supabase.from('modulos').select('*').eq('produto_id', distribProdutoAlarmeId).order('id');

  const faixaSelect = document.getElementById('distrib-faixa');
  faixaSelect.innerHTML = '<option value="">Selecione</option>' + (faixas || []).map(f =>
    '<option value="' + encodeURIComponent(JSON.stringify({ id: f.id, desc: f.descricao, valor_base: f.valor_base, valor_modulo: f.valor_modulo })) + '">' + f.descricao + '</option>'
  ).join('');

  const modulosDiv = document.getElementById('distrib-modulos');
  if (!modulos || !modulos.length) {
    modulosDiv.innerHTML = '<span style="color:var(--text-muted);font-size:0.85rem;">Nenhum módulo disponível.</span>';
  } else {
    modulosDiv.innerHTML = modulos.map(m =>
      '<div class="modulo-card" data-modulo-id="' + m.id + '" data-modulo-nome="' + m.nome.replace(/"/g, '&quot;') + '" onclick="distribToggleModulo(this)">' +
        '<div class="modulo-nome">' +
          '<input type="checkbox" onclick="event.stopPropagation()" onchange="distribToggleModulo(this.parentElement.parentElement)"> ' + m.nome +
        '</div>' +
        '<div class="modulo-valor">' +
          '<span style="font-size:0.85rem;color:#8a8a8a;margin-right:4px;">R$</span>' +
          '<input type="text" class="distrib-m-valor" placeholder="0,00" oninput="formatCurrency(this);distribAtualizarTotal()" onclick="event.stopPropagation()">' +
        '</div>' +
      '</div>'
    ).join('');
  }

  if (editData && editData.crm_id) {
    document.getElementById('distrib-crm-id').value = editData.crm_id;
  }

  if (editData && editData.faixa_id && faixas) {
    const match = faixas.find(f => f.id === editData.faixa_id);
    if (match) {
      const encoded = encodeURIComponent(JSON.stringify({ id: match.id, desc: match.descricao, valor_base: match.valor_base, valor_modulo: match.valor_modulo }));
      faixaSelect.value = encoded;
      distribFaixaChange();
    }
  }

  if (editData && editData.modulos && editData.modulos.length) {
    editData.modulos.forEach(m => {
      const card = modulosDiv.querySelector('.modulo-card[data-modulo-id="' + m.id + '"]');
      if (card) {
        card.querySelector('input[type="checkbox"]').checked = true;
        card.classList.add('selected');
        const valorInput = card.querySelector('.distrib-m-valor');
        if (valorInput && m.valor > 0) {
          const reais = Math.floor(m.valor);
          const centavos = Math.round((m.valor - reais) * 100);
          valorInput.value = reais.toLocaleString('pt-BR') + ',' + String(centavos).padStart(2, '0');
        }
      }
    });
  }

  const avulsosDiv = document.getElementById('distrib-avulsos');
  const { data: avulsoProd } = await supabase.from('produtos').select('id').eq('tipo', 'Licenças unitárias').maybeSingle();
  if (!avulsoProd) {
    avulsosDiv.innerHTML = '<span style="color:var(--text-muted);font-size:0.85rem;">Nenhum produto avulso cadastrado.</span>';
  } else {
    const { data: faixas } = await supabase.from('faixas').select('*').eq('produto_id', avulsoProd.id).order('ordem').order('id');
    if (!faixas || !faixas.length) {
      avulsosDiv.innerHTML = '<span style="color:var(--text-muted);font-size:0.85rem;">Nenhum avulso cadastrado.</span>';
    } else {
      avulsosDiv.innerHTML = faixas.map(f =>
        '<div class="modulo-card avulso-card" data-nome="' + f.descricao.replace(/"/g, '&quot;') + '" data-valor="' + f.valor_base + '" onclick="distribToggleAvulso(this)">' +
          '<div class="modulo-nome">' +
            '<input type="checkbox" class="avulso-check" onclick="event.stopPropagation()" onchange="distribToggleAvulso(this.parentElement.parentElement)"> ' + f.descricao +
            '<span style="color:var(--text-muted);font-size:0.8rem;margin-left:6px;">(R$ ' + f.valor_base.toFixed(2).replace('.', ',') + ')</span>' +
          '</div>' +
          '<div class="modulo-valor" style="gap:4px;">' +
            '<span style="font-size:0.85rem;color:var(--text-muted);">Qtd:</span>' +
            '<input type="number" class="avulso-qtd" value="1" min="1" style="width:50px;padding:2px 4px;font-size:0.85rem;" disabled onchange="distribAtualizarTotal()">' +
          '</div>' +
        '</div>'
      ).join('');

      if (editData && editData.avulsos && editData.avulsos.length) {
        editData.avulsos.forEach(a => {
          const card = avulsosDiv.querySelector('.avulso-card[data-nome="' + a.nome + '"]');
          if (card) {
            card.querySelector('.avulso-check').checked = true;
            card.classList.add('selected');
            const qtdInput = card.querySelector('.avulso-qtd');
            qtdInput.disabled = false;
            if (a.quantidade > 1) qtdInput.value = a.quantidade;
          }
        });
      }
    }
  }

  distribAtualizarTotal();
}

function distribFaixaChange() {
  const select = document.getElementById('distrib-faixa');
  if (!select.value) return;
  const faixa = JSON.parse(decodeURIComponent(select.value));
  const valor = faixa.valor_modulo || 0;
  document.querySelectorAll('#distrib-modulos .modulo-card').forEach(c => {
    const el = c.querySelector('.distrib-m-valor');
    if (el) el.value = valor > 0
      ? Math.floor(valor).toLocaleString('pt-BR') + ',' + String(Math.round((valor - Math.floor(valor)) * 100)).padStart(2, '0')
      : '';
  });
  distribAtualizarTotal();
}

function distribToggleModulo(el) {
  const checkbox = el.querySelector('input[type="checkbox"]');
  checkbox.checked = !checkbox.checked;
  el.classList.toggle('selected', checkbox.checked);
  if (checkbox.checked) {
    const select = document.getElementById('distrib-faixa');
    if (select.value) {
      const faixa = JSON.parse(decodeURIComponent(select.value));
      if (faixa.valor_modulo > 0) {
        const valorInput = el.querySelector('.distrib-m-valor');
        const reais = Math.floor(faixa.valor_modulo);
        const centavos = Math.round((faixa.valor_modulo - reais) * 100);
        valorInput.value = reais.toLocaleString('pt-BR') + ',' + String(centavos).padStart(2, '0');
      }
    }
  }
  distribAtualizarTotal();
}

function distribToggleAvulso(el) {
  const checkbox = el.querySelector('.avulso-check');
  checkbox.checked = !checkbox.checked;
  el.classList.toggle('selected', checkbox.checked);
  el.querySelector('.avulso-qtd').disabled = !checkbox.checked;
  distribAtualizarTotal();
}

function distribAtualizarTotal() {
  let total = 0;
  const faixaSelect = document.getElementById('distrib-faixa');
  if (faixaSelect.value) {
    const faixa = JSON.parse(decodeURIComponent(faixaSelect.value));
    total += faixa.valor_base || 0;
  }
  document.querySelectorAll('#distrib-modulos .modulo-card.selected').forEach(c => {
    const valorStr = c.querySelector('.distrib-m-valor').value;
    total += parseFloat(valorStr.replace(/\./g, '').replace(',', '.')) || 0;
  });
  document.querySelectorAll('#distrib-avulsos .avulso-card.selected').forEach(c => {
    const valor = parseFloat(c.dataset.valor) || 0;
    const qtd = parseInt(c.querySelector('.avulso-qtd').value) || 1;
    total += valor * qtd;
  });
  const el = document.getElementById('distrib-modal-total');
  if (el) el.textContent = 'R$ ' + total.toFixed(2).replace('.', ',');
}

async function distribModalConfirmar() {
  const crmId = document.getElementById('distrib-crm-id').value.trim().toUpperCase();
  const errorEl = document.getElementById('distrib-crm-error');

  if (!/^[A-Z0-9]{4,6}$/.test(crmId)) {
    errorEl.textContent = 'Código deve ter 4 a 6 letras ou números';
    errorEl.style.display = 'block';
    document.getElementById('distrib-crm-id').focus();
    return;
  }
  errorEl.style.display = 'none';

  const produtoId = distribProdutoAlarmeId;
  if (!produtoId) { distribModalMsg('Erro: produto não identificado'); return; }

  const faixaSelect = document.getElementById('distrib-faixa');
  const temFaixa = !!faixaSelect.value;
  const temModulos = document.querySelectorAll('#distrib-modulos .modulo-card.selected').length > 0;
  const temAvulsos = document.querySelectorAll('#distrib-avulsos .avulso-card.selected').length > 0;
  if (!temFaixa && !temModulos && !temAvulsos) {
    distribModalMsg('Selecione uma faixa ou ao menos um módulo/avulso');
    return;
  }
  let faixa = null;
  if (temFaixa) faixa = JSON.parse(decodeURIComponent(faixaSelect.value));

  const modulos = [];
  document.querySelectorAll('#distrib-modulos .modulo-card.selected').forEach(c => {
    const id = parseInt(c.dataset.moduloId);
    const nome = c.dataset.moduloNome;
    const valorStr = c.querySelector('.distrib-m-valor').value;
    const valor = parseFloat(valorStr.replace(/\./g, '').replace(',', '.')) || 0;
    modulos.push({ id, nome, valor });
  });

  const avulsos = [];
  document.querySelectorAll('#distrib-avulsos .avulso-card.selected').forEach(c => {
    const nome = c.dataset.nome;
    const qtd = parseInt(c.querySelector('.avulso-qtd').value) || 1;
    avulsos.push({ nome, quantidade: qtd });
  });

  try {
    if (distribEditandoId) {
      const { error } = await supabase.from('distribuicao').update({
        crm_id: crmId,
        produto_id: produtoId,
        faixa_id: faixa ? faixa.id : null,
        modulos: modulos,
        avulsos: avulsos
      }).eq('id', distribEditandoId);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('distribuicao').insert({
        vendedor: distribVendedorAlvo,
        crm_id: crmId,
        produto_id: produtoId,
        faixa_id: faixa ? faixa.id : null,
        modulos: modulos,
        avulsos: avulsos
      });
      if (error) throw error;
    }
    distribModalFechar();
    await distribCarregar();
  } catch (e) {
    console.warn('distribModalConfirmar erro:', e);
    distribModalMsg('Erro ao registrar distribuição');
  }
}

async function distribEditar(id) {
  const { data, error } = await supabase.from('distribuicao').select('*').eq('id', id).single();
  if (error || !data) { distribMensagem('Erro ao carregar registro'); return; }
  distribEditandoId = id;
  distribVendedorAlvo = data.vendedor;
  document.getElementById('distrib-modal-titulo').innerHTML = '◆ Editar distribuição de <span id="distrib-modal-vendedor">' + data.vendedor + '</span>';
  document.getElementById('modal-distribuir').style.display = 'flex';
  await distribModalCarregar(data);
}

async function distribDeletar(id) {
  if (!confirm('Tem certeza que deseja excluir esta distribuição?')) return;
  try {
    const { error } = await supabase.from('distribuicao').delete().eq('id', id);
    if (error) throw error;
    await distribCarregar();
  } catch (e) {
    console.warn('distribDeletar erro:', e);
    distribMensagem('Erro ao excluir distribuição');
  }
}

function distribModalMsg(texto) {
  const el = document.getElementById('distrib-modal-msg');
  if (el) { el.textContent = texto; el.style.display = 'block'; }
}

function distribModalFechar() {
  distribEditandoId = null;
  document.getElementById('modal-distribuir').style.display = 'none';
  document.getElementById('distrib-crm-error').style.display = 'none';
  document.getElementById('distrib-modal-msg').style.display = 'none';
  document.getElementById('distrib-faixa').value = '';
  document.querySelectorAll('#distrib-modulos .modulo-card.selected, #distrib-avulsos .avulso-card.selected').forEach(c => {
    const checkbox = c.querySelector('input[type="checkbox"], .avulso-check');
    if (checkbox) checkbox.checked = false;
    c.classList.remove('selected');
    const qtd = c.querySelector('.avulso-qtd');
    if (qtd) { qtd.disabled = true; qtd.value = 1; }
  });
}
