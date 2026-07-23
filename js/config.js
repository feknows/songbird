// === CONFIG - SENHA ===
async function alterarMinhaSenha() {
  const senhaAtual = document.getElementById('cfg-senha-atual').value.trim();
  const senhaNova = document.getElementById('cfg-senha-nova').value.trim();
  const confirm = document.getElementById('cfg-senha-confirm').value.trim();
  const ok = document.getElementById('cfg-senha-ok');
  const erro = document.getElementById('cfg-senha-erro');
  ok.classList.remove('show'); erro.classList.remove('show');
  if (!senhaAtual || !senhaNova || !confirm) { erro.textContent = 'Preencha todos os campos.'; erro.classList.add('show'); return; }
  if (senhaNova !== confirm) { erro.textContent = 'Senhas não conferem.'; erro.classList.add('show'); return; }
  try {
    const email = (await supabase.auth.getUser()).data.user.email;
    const { error: reAuthError } = await supabase.auth.signInWithPassword({ email, password: senhaAtual });
    if (reAuthError) { erro.textContent = 'Senha atual incorreta.'; erro.classList.add('show'); return; }
    const { error } = await supabase.auth.updateUser({ password: senhaNova });
    if (error) throw error;
    document.getElementById('cfg-senha-atual').value = '';
    document.getElementById('cfg-senha-nova').value = '';
    document.getElementById('cfg-senha-confirm').value = '';
    ok.textContent = 'Senha alterada com sucesso!';
    ok.classList.add('show');
    setTimeout(() => ok.classList.remove('show'), 3000);
  } catch (e) {
    erro.textContent = e.message;
    erro.classList.add('show');
  }
}

// === ADMIN PRODUTOS ===
function criarProduto() {
  document.getElementById('modal-produto-id').value = '';
  document.getElementById('modal-produto-nome').value = '';
  document.getElementById('modal-produto-tipo').value = '';
  document.getElementById('modal-produto-titulo').textContent = '[+] Novo Produto';
  document.getElementById('modal-produto-btn').textContent = 'Criar';
  document.getElementById('modal-novo-produto').style.display = 'flex';
  setTimeout(() => document.getElementById('modal-produto-nome').focus(), 100);
}

function editarProduto(id, nomeAtual) {
  document.getElementById('modal-produto-id').value = id;
  document.getElementById('modal-produto-nome').value = nomeAtual;
  document.getElementById('modal-produto-tipo').value = '';
  document.getElementById('modal-produto-titulo').textContent = 'Editar Produto';
  document.getElementById('modal-produto-btn').textContent = 'Salvar';
  document.getElementById('modal-novo-produto').style.display = 'flex';
  setTimeout(() => document.getElementById('modal-produto-nome').focus(), 100);
}

async function salvarNovoProduto() {
  const nome = document.getElementById('modal-produto-nome').value.trim();
  const tipo = document.getElementById('modal-produto-tipo').value.trim();
  const produtoId = document.getElementById('modal-produto-id').value;
  if (!nome) { alert('Preencha o nome do produto.'); return; }
  try {
    if (produtoId) {
      await supabase.from('produtos').update({ nome }).eq('id', parseInt(produtoId));
    } else {
      if (!tipo) { alert('Preencha o tipo do produto.'); return; }
      const { data: maxOrdem } = await supabase.from('produtos').select('ordem').order('ordem', { ascending: false }).limit(1);
      await supabase.from('produtos').insert({ nome, tipo, ordem: (maxOrdem?.[0]?.ordem ?? -1) + 1 });
    }
    fecharModalProduto();
    carregarProdutosAdmin();
  } catch (e) {
    alert(e.message);
  }
}

function fecharModalProduto() {
  document.getElementById('modal-novo-produto').style.display = 'none';
  document.getElementById('modal-produto-id').value = '';
  document.getElementById('modal-produto-nome').value = '';
  document.getElementById('modal-produto-tipo').value = '';
}

function deletarProduto(id, nome) {
  confirmarAcao('Remover Produto', `Remover "${nome}" e todas as suas faixas/módulos?`, async () => {
    try {
      await supabase.from('produtos').delete().eq('id', id);
      carregarProdutosAdmin();
    } catch (e) {
      alert(e.message);
    }
  });
}

async function carregarProdutosAdmin() {
  const div = document.getElementById('admin-produtos');
  try {
    const { data: produtos } = await supabase.from('produtos').select('*').order('ordem').order('id');
    let html = `<button class="btn btn-sm btn-success" onclick="criarProduto()" style="margin-bottom:12px;">+ Novo Produto</button>`;

    const grupos = {};
    for (const p of (produtos || [])) {
      if (!grupos[p.tipo]) grupos[p.tipo] = [];
      grupos[p.tipo].push(p);
    }

    for (const [tipo, prods] of Object.entries(grupos)) {
      const nomesTipo = { 'alarme': '🔔 Moni Alarme' };
      html += `<div style="margin:20px 0 6px 0;font-size:0.8rem;color:#525252;text-transform:uppercase;letter-spacing:0.5px;">${nomesTipo[tipo] || tipo}</div>`;

      for (const p of prods) {
        const { data: faixas } = await supabase.from('faixas').select('*').eq('produto_id', p.id).order('ordem').order('id');
        const { data: modulos } = await supabase.from('modulos').select('*').eq('produto_id', p.id).order('id');
        html += `<div style="background:var(--bg-raised);border:1px solid var(--primary-hairline);padding:12px;margin-bottom:12px;">`;
        html += `<strong style="font-size:1rem;">${p.nome}</strong> <button class="btn btn-sm btn-secondary" onclick="editarProduto(${p.id},'${p.nome.replace(/'/g, "\\'")}')" style="float:right;margin-right:4px;">✎</button><button class="btn btn-sm btn-danger" onclick="deletarProduto(${p.id},'${p.nome.replace(/'/g, "\\'")}')" style="float:right;">✕</button>`;
        html += `<div style="margin-top:8px;font-size:0.85rem;"><strong>Faixas</strong> <button class="btn btn-sm btn-success" onclick="adicionarFaixa(${p.id},'${p.tipo}')" style="margin-left:8px;">+</button></div>`;
        html += `<table style="width:100%;border-collapse:collapse;font-size:0.8rem;margin-top:4px;">`;
        html += `<thead><tr style="background:var(--primary-hairline);"><th style="padding:4px 6px;text-align:left;">Descrição</th><th style="padding:4px 6px;text-align:left;">Valor Base</th><th style="padding:4px 6px;text-align:left;">Valor Módulo</th><th style="padding:4px 6px;"></th></tr></thead><tbody>`;
        for (const f of (faixas || [])) {
          const fdata = JSON.stringify({id:f.id,descricao:f.descricao,valor_base:f.valor_base,valor_modulo:f.valor_modulo,tipo:p.tipo,produto_id:p.id});
          html += `<tr><td style="padding:4px 6px;border-bottom:1px solid var(--primary-hairline);">${f.descricao}</td>`;
          html += `<td style="padding:4px 6px;border-bottom:1px solid var(--primary-hairline);">R$ ${f.valor_base.toFixed(2).replace('.', ',')}</td>`;
          html += `<td style="padding:4px 6px;border-bottom:1px solid var(--primary-hairline);">R$ ${f.valor_modulo.toFixed(2).replace('.', ',')}</td>`;
          html += `<td style="padding:4px 6px;border-bottom:1px solid var(--primary-hairline);white-space:nowrap;"><button class="btn btn-sm btn-secondary" onclick='editarFaixa(${fdata})' style="margin-right:4px;">✎</button><button class="btn btn-sm btn-danger" onclick="deletarFaixa(${f.id},'${f.descricao.replace(/'/g, "\\'")}')">x</button></td></tr>`;
        }
        html += `</tbody></table>`;
        html += `<div style="margin-top:8px;font-size:0.85rem;"><strong>Módulos</strong> <button class="btn btn-sm btn-success" onclick="adicionarModulo(${p.id})" style="margin-left:8px;">+</button></div>`;
        html += `<table style="width:100%;border-collapse:collapse;font-size:0.8rem;margin-top:4px;">`;
        html += `<thead><tr style="background:var(--primary-hairline);"><th style="padding:4px 6px;text-align:left;">Nome</th><th style="padding:4px 6px;"></th></tr></thead><tbody>`;
        for (const m of (modulos || [])) {
          html += `<tr><td style="padding:4px 6px;border-bottom:1px solid var(--primary-hairline);">${m.nome}</td>`;
          html += `<td style="padding:4px 6px;border-bottom:1px solid var(--primary-hairline);"><button class="btn btn-sm btn-danger" onclick="deletarModulo(${m.id},'${m.nome.replace(/'/g, "\\'")}')">x</button></td></tr>`;
        }
        html += `</tbody></table></div>`;
      }
    }

    div.innerHTML = html;
  } catch (e) {
    div.innerHTML = `<span style="color:red;">Erro ao carregar produtos: ${e.message}</span>`;
  }
}

let faixaProdutoId = null;

function adicionarFaixa(produtoId, tipo) {
  faixaProdutoId = produtoId;
  document.getElementById('modal-faixa-titulo').textContent = 'Nova Faixa';
  document.getElementById('modal-faixa-desc').value = '';
  document.getElementById('modal-faixa-vb').value = '';
  document.getElementById('modal-faixa-vm').value = '';
  document.getElementById('modal-faixa-id').value = '';
  document.getElementById('modal-faixa-tipo').value = tipo || '';
  document.getElementById('modal-faixa-vm-wrapper').style.display = 'block';
  document.getElementById('modal-nova-faixa').style.display = 'flex';
  setTimeout(() => document.getElementById('modal-faixa-desc').focus(), 100);
}

function editarFaixa(data) {
  document.getElementById('modal-faixa-titulo').textContent = 'Editar Faixa';
  document.getElementById('modal-faixa-desc').value = data.descricao;
  document.getElementById('modal-faixa-vb').value = data.valor_base.toFixed(2).replace('.', ',');
  document.getElementById('modal-faixa-vm').value = data.valor_modulo.toFixed(2).replace('.', ',');
  document.getElementById('modal-faixa-id').value = data.id;
  document.getElementById('modal-faixa-tipo').value = data.tipo || '';
  document.getElementById('modal-faixa-vm-wrapper').style.display = 'block';
  document.getElementById('modal-nova-faixa').style.display = 'flex';
  setTimeout(() => document.getElementById('modal-faixa-desc').focus(), 100);
}

async function salvarFaixa() {
  const desc = document.getElementById('modal-faixa-desc').value.trim();
  const vb = parseFloat(document.getElementById('modal-faixa-vb').value.replace(/\./g, '').replace(',', '.')) || 0;
  const tipo = document.getElementById('modal-faixa-tipo').value;
  const vm = parseFloat(document.getElementById('modal-faixa-vm').value.replace(/\./g, '').replace(',', '.')) || 0;
  if (!desc) { alert('Preencha a descrição da faixa.'); return; }
  const faixaId = document.getElementById('modal-faixa-id').value;
  try {
    let novaId = null;
    if (faixaId) {
      await supabase.from('faixas').update({ descricao: desc, valor_base: vb, valor_modulo: vm }).eq('id', parseInt(faixaId));
      novaId = parseInt(faixaId);
    } else {
      const { data: maxOrdem } = await supabase.from('faixas').select('ordem').eq('produto_id', faixaProdutoId).order('ordem', { ascending: false }).limit(1);
      await supabase.from('faixas').insert({ produto_id: faixaProdutoId, descricao: desc, valor_base: vb, valor_modulo: vm, ordem: (maxOrdem?.[0]?.ordem ?? -1) + 1 });
    }
    fecharModalFaixa();
    carregarProdutosAdmin();
  } catch (e) {
    alert(e.message);
  }
}

function fecharModalFaixa() {
  document.getElementById('modal-nova-faixa').style.display = 'none';
}

function deletarFaixa(id, desc) {
  confirmarAcao('Remover Faixa', `Remover a faixa "${desc}"?`, async () => {
    try {
      await supabase.from('faixas').delete().eq('id', id);
      carregarProdutosAdmin();
    } catch (e) {
      alert(e.message);
    }
  });
}

let moduloProdutoId = null;

function adicionarModulo(produtoId) {
  moduloProdutoId = produtoId;
  document.getElementById('modal-modulo-nome').value = '';
  document.getElementById('modal-novo-modulo').style.display = 'flex';
  setTimeout(() => document.getElementById('modal-modulo-nome').focus(), 100);
}

async function salvarModulo() {
  const nome = document.getElementById('modal-modulo-nome').value.trim();
  if (!nome) { alert('Preencha o nome do módulo.'); return; }
  try {
    await supabase.from('modulos').insert({ produto_id: moduloProdutoId, nome });
    fecharModalModulo();
    carregarProdutosAdmin();
  } catch (e) {
    alert(e.message);
  }
}

function fecharModalModulo() {
  document.getElementById('modal-novo-modulo').style.display = 'none';
}

function deletarModulo(id, nome) {
  confirmarAcao('Remover Módulo', `Remover o módulo "${nome}"?`, async () => {
    try {
      await supabase.from('modulos').delete().eq('id', id);
      carregarProdutosAdmin();
    } catch (e) {
      alert(e.message);
    }
  });
}
