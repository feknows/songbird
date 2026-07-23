// === NAVEGAÇÃO VENDAS ===
function abrirForm(tipo) {
  document.getElementById('hub').style.display = 'none';
  document.getElementById('form-container').style.display = 'block';
  document.getElementById('form-' + tipo).style.display = 'block';
  carregarProdutos();
  if (tipo === 'orcamento') orcamentoAddItem();
}

function voltarHub() {
  console.log('voltarHub');
  try { pLimpar(); } catch (_) { console.warn('pLimpar', _); }
  try { aLimpar(); } catch (_) { console.warn('aLimpar', _); }
  try { mLimpar(); } catch (_) { console.warn('mLimpar', _); }
  try { dLimpar(); } catch (_) { console.warn('dLimpar', _); }
  try { orcamentoLimpar(); } catch (_) { console.warn('orcamentoLimpar', _); }
  document.getElementById('hub').style.display = 'block';
  document.getElementById('form-container').style.display = 'none';
  document.getElementById('form-portaria').style.display = 'none';
  document.getElementById('form-alarme').style.display = 'none';
  document.getElementById('form-modulo').style.display = 'none';
  document.getElementById('form-desconto').style.display = 'none';
  document.getElementById('form-orcamento').style.display = 'none';
}

// === PORTARIA ===
let pItemCount = 0;
function pAddItem(numero, nome) {
  numero = numero || ''; nome = nome || '';
  pItemCount++;
  const div = document.createElement('div');
  div.className = 'item-row'; div.id = 'p-item-' + pItemCount;
  div.innerHTML = `<div class="field"><label>Número</label><input type="text" class="p-item-numero" value="${numero}" placeholder="Ex: 21"></div><div class="field"><label>Nome</label><input type="text" class="p-item-nome" value="${nome}" placeholder="Ex: Condomínio Paineiras"></div><button class="btn btn-danger" onclick="this.parentElement.remove()" style="margin-bottom:0;align-self:end;height:36px;padding:0 10px;">X</button>`;
  document.getElementById('p-items-container').appendChild(div);
}

function pGerar() {
  const cliente = document.getElementById('p-cliente').value.trim();
  const licenca = document.getElementById('p-licenca').value.trim();
  const quantidade = parseInt(document.getElementById('p-quantidade').value.trim()) || 0;
  const valorUnitario = parseCurrency(document.getElementById('p-valorUnitario').value);
  const pagamento = document.getElementById('p-pagamento').value.trim();
  const observacoes = document.getElementById('p-observacoes').value.trim();
  if (!cliente || !licenca || !quantidade || !valorUnitario) {
    document.getElementById('p-output').textContent = 'Preencha todos os campos obrigatórios.'; return;
  }
  const itens = document.querySelectorAll('#form-portaria .item-row');
  const listaItens = [];
  itens.forEach(row => {
    const num = row.querySelector('.p-item-numero').value.trim();
    const nome = row.querySelector('.p-item-nome').value.trim();
    if (num || nome) listaItens.push({ numero: num, nome: nome });
  });
  const valorTotal = (quantidade * valorUnitario).toFixed(2).replace('.', ',');
  const valorUnitStr = valorUnitario.toFixed(2).replace('.', ',');
  const licencaPlural = quantidade === 1 ? licenca : pluralizar(licenca);
  let texto = `Negociado com ${cliente} a licença de ${quantidade} ${licencaPlural}\nVALORES:\n${quantidade} ${licencaPlural} = R$ ${valorUnitStr} cada\n\n`;
  if (listaItens.length > 0) {
    let lastNum = '';
    listaItens.forEach(item => {
      const num = item.numero;
      if (num) {
        if (lastNum) {
          const currInt = parseInt(num);
          texto += currInt === parseInt(lastNum) + 1 ? `${num}º - ${item.nome}\n` : `\n${num}º - ${item.nome}\n`;
        } else { texto += `${num}º - ${item.nome}\n`; }
        lastNum = num;
      } else if (item.nome) { texto += `${item.nome}\n`; }
    });
  }
  texto += `TOTAL = R$ ${valorTotal}\n\n`;
  if (pagamento) texto += `Pagamento para ${pagamento}\n`;
  if (observacoes) texto += `${observacoes}\n`;
  document.getElementById('p-output').textContent = texto;
  document.getElementById('p-totalDisplay').textContent = `Total: R$ ${valorTotal}`;
  setTimeout(() => copiar('p-output', 'p-copiedMsg'), 50);
}

function pLimpar() {
  document.getElementById('p-cliente').value = ''; document.getElementById('p-licenca').selectedIndex = 0;
  document.getElementById('p-quantidade').value = ''; document.getElementById('p-valorUnitario').value = '';
  document.getElementById('p-pagamento').value = ''; document.getElementById('p-observacoes').selectedIndex = 0;
  document.getElementById('p-items-container').innerHTML = '';
  document.getElementById('p-output').textContent = 'Preencha os dados e clique em "Gerar texto"';
  document.getElementById('p-totalDisplay').textContent = '';
  pItemCount = 0;
}

// === PRODUTOS (carregar do banco) ===
let faixasAlarme = [];
let modulosAlarme = [];
let faixaIdAtual = null;
let faixaIdModulo = null;

const iconesModulos = {
  'Moni Discador': '📞',
  'Moni Imagens': '📷',
  'Moni Mensagens': '✉️',
  'Moni Mobile': '📱',
  'Moni Veículos': '🚗',
  'Moni Web': '💻',
};

async function carregarProdutos() {
  try {
    const { data: produtos } = await supabase.from('produtos').select('*').order('id');
    const moniBase = (produtos || []).find(p => p.tipo === 'alarme');
    if (!moniBase) { console.warn('carregarProdutos: nenhum produto com tipo="alarme" encontrado'); return; }

    const { data: faixas } = await supabase.from('faixas').select('*').eq('produto_id', moniBase.id).order('ordem').order('id');
    const { data: modulos } = await supabase.from('modulos').select('*').eq('produto_id', moniBase.id).order('id');
    faixasAlarme = faixas || [];
    modulosAlarme = modulos || [];

    const select = document.getElementById('a-faixa');
    select.innerHTML = '<option value="">Selecione uma faixa</option>' + faixasAlarme.map(f =>
      `<option value="${encodeURIComponent(JSON.stringify({desc: f.descricao, valor: f.valor_base, valor_modulo: f.valor_modulo, id: f.id}))}">${f.descricao} = R$ ${f.valor_base.toFixed(2).replace('.', ',')}</option>`
    ).join('');

    const container = document.getElementById('a-modulos-container');
    container.innerHTML = modulosAlarme.map(m =>
      `<div class="modulo-card" data-modulo-id="${m.id}" onclick="aMToggle(this)"><div class="modulo-nome"><input type="checkbox" onclick="event.stopPropagation()" onchange="aMToggle(this.parentElement.parentElement)"> ${m.nome}<span class="modulo-icone">${iconesModulos[m.nome] || ''}</span></div><div class="modulo-valor"><span style="font-size:0.85rem;color:#8a8a8a;margin-right:4px;">R$</span><input type="text" class="a-m-valor" placeholder="0,00" oninput="formatCurrency(this)" onclick="event.stopPropagation()"></div></div>`
    ).join('');

    const mSelect = document.getElementById('m-faixa');
    mSelect.innerHTML = '<option value="">Selecione uma faixa</option>' + faixasAlarme.map(f =>
      `<option value="${encodeURIComponent(JSON.stringify({desc: f.descricao, valor_modulo: f.valor_modulo, id: f.id}))}">${f.descricao}</option>`
    ).join('');

    const mContainer = document.getElementById('m-modulos');
    mContainer.innerHTML = modulosAlarme.map(m =>
      `<div class="modulo-card" data-modulo-id="${m.id}" onclick="mToggle(this)"><div class="modulo-nome"><input type="checkbox" onclick="event.stopPropagation()" onchange="mToggle(this.parentElement.parentElement)"> ${m.nome}<span class="modulo-icone">${iconesModulos[m.nome] || ''}</span></div><div class="modulo-valor"><span style="font-size:0.85rem;color:#8a8a8a;margin-right:4px;">R$</span><input type="text" class="m-valor" placeholder="0,00" oninput="formatCurrency(this)" onclick="event.stopPropagation()"></div></div>`
    ).join('');

    const dSelect = document.getElementById('d-faixa');
    dSelect.innerHTML = '<option value="">Selecione uma faixa</option>' + faixasAlarme.map(f =>
      `<option value="${encodeURIComponent(JSON.stringify({desc: f.descricao, valor_base: f.valor_base, valor_modulo: f.valor_modulo, id: f.id}))}">${f.descricao} — R$ ${f.valor_base.toFixed(2).replace('.', ',')}</option>`
    ).join('');

    const dModulosContainer = document.getElementById('d-modulos-container');
    dModulosContainer.innerHTML = modulosAlarme.map(m =>
      `<div class="modulo-card" data-modulo-id="${m.id}" data-modulo-nome="${m.nome}" onclick="dModuloToggle(this)"><div class="modulo-nome">${m.nome}<span class="modulo-icone">${iconesModulos[m.nome] || ''}</span></div></div>`
    ).join('');

    const dNovaSelect = document.getElementById('d-nova-faixa');
    dNovaSelect.innerHTML = '<option value="">Selecione a nova faixa</option>' + faixasAlarme.map(f =>
      `<option value="${encodeURIComponent(JSON.stringify({desc: f.descricao, valor_base: f.valor_base, valor_modulo: f.valor_modulo, id: f.id}))}">${f.descricao} — R$ ${f.valor_base.toFixed(2).replace('.', ',')}</option>`
    ).join('');

    const tbody = document.getElementById('d-tabela-body');
    tbody.innerHTML = `<tr id="d-row-faixa" style="background:var(--bg-raised);"><td style="padding:8px;border-bottom:1px solid var(--primary-hairline);font-weight:600;" id="d-faixa-nome">Faixa de contas</td><td style="padding:8px;text-align:right;border-bottom:1px solid var(--primary-hairline);" id="d-valor-base">R$ 0,00</td><td style="padding:8px;text-align:right;border-bottom:1px solid var(--primary-hairline);"><input type="text" class="d-pago" data-tipo="faixa" style="width:100%;padding:4px 6px;border:1px solid var(--primary-hairline);border-radius:4px;font-size:0.85rem;text-align:right;outline:none;" placeholder="0,00" oninput="formatCurrency(this);dAutoCalc()"></td><td style="padding:8px;text-align:right;border-bottom:1px solid var(--primary-hairline);" class="d-desc-pct" id="d-desc-faixa">—</td></tr>`;
  } catch (e) { console.error('carregarProdutos erro:', e); }
}

carregarProdutos();

let valorModuloAtual = 0;
let valorModuloModulo = 0;

function aFaixaChange() {
  const select = document.getElementById('a-faixa');
  if (!select.value) { faixaIdAtual = null; return; }
  const faixa = JSON.parse(decodeURIComponent(select.value));
  faixaIdAtual = faixa.id;
  valorModuloAtual = faixa.valor_modulo || 0;
  document.querySelectorAll('#form-alarme .modulo-card').forEach(c => {
    const mid = parseInt(c.dataset.moduloId);
    var el = c.querySelector('.a-m-valor');
    if (el) el.value = faixa.valor_modulo > 0 ? (Math.floor(faixa.valor_modulo).toLocaleString('pt-BR') + ',' + String(Math.round((faixa.valor_modulo - Math.floor(faixa.valor_modulo)) * 100)).padStart(2, '0')) : '';
  });
}

function mFaixaChange() {
  const select = document.getElementById('m-faixa');
  if (!select.value) { valorModuloModulo = 0; faixaIdModulo = null; return; }
  const faixa = JSON.parse(decodeURIComponent(select.value));
  faixaIdModulo = faixa.id;
  valorModuloModulo = faixa.valor_modulo || 0;
  document.querySelectorAll('#m-modulos .modulo-card').forEach(c => {
    const mid = parseInt(c.dataset.moduloId);
    var el = c.querySelector('.m-valor');
    if (el) el.value = faixa.valor_modulo > 0 ? (Math.floor(faixa.valor_modulo).toLocaleString('pt-BR') + ',' + String(Math.round((faixa.valor_modulo - Math.floor(faixa.valor_modulo)) * 100)).padStart(2, '0')) : '';
  });
}

// === ALARME ===
function aMToggle(el) {
  const checkbox = el.querySelector('input[type="checkbox"]');
  checkbox.checked = !checkbox.checked;
  el.classList.toggle('selected', checkbox.checked);
  if (checkbox.checked) {
    const moduloId = parseInt(el.dataset.moduloId);
    if (valorModuloAtual > 0) {
      const valorInput = el.querySelector('.a-m-valor');
      const reais = Math.floor(valorModuloAtual);
      const centavos = Math.round((valorModuloAtual - reais) * 100);
      valorInput.value = reais.toLocaleString('pt-BR') + ',' + String(centavos).padStart(2, '0');
    }
  }
}

function aGerar() {
  const cliente = document.getElementById('a-cliente').value.trim();
  const pagamento = document.getElementById('a-pagamento').value.trim();
  const periodoTeste = document.querySelector('input[name="a-teste"]:checked');
  if (!cliente) { document.getElementById('a-output').textContent = 'Preencha o nome do cliente.'; return; }
  const faixaVal = document.getElementById('a-faixa').value;
  if (!faixaVal) { document.getElementById('a-output').textContent = 'Selecione uma faixa de contas.'; return; }
  const faixa = JSON.parse(decodeURIComponent(faixaVal));
  const valorFormatado = faixa.valor.toFixed(2).replace('.', ',');
  const testeLabel = periodoTeste ? (periodoTeste.value === 'remover' ? 'Pode ser removido' : 'Deve ser mantido') : '';
  const faixaDescUppercase = faixa.desc.toUpperCase();
  const modulos = document.querySelectorAll('#form-alarme .modulo-card.selected');
  let totalMod = 0;
  const linhasMod = [];
  modulos.forEach(card => {
    const nome = card.querySelector('.modulo-nome').textContent.trim();
    const valor = parseCurrency(card.querySelector('.a-m-valor').value);
    const valorStr = valor.toFixed(2).replace('.', ',');
    linhasMod.push({ nome, valorStr }); totalMod += valor;
  });
  const totalGeralStr = (faixa.valor + totalMod).toFixed(2).replace('.', ',');
  let texto = `Negociado com ${cliente} a Licença do Moni ${faixaDescUppercase}\nLICENÇA DO MONI ${faixaDescUppercase} = R$ ${valorFormatado}\n`;
  linhasMod.forEach(l => { texto += `${l.nome} = R$ ${l.valorStr}\n`; });
  texto += `TOTAL = R$ ${totalGeralStr}\n`;
  if (pagamento) texto += `Pagamento para ${pagamento}\n`;
  if (testeLabel) texto += `${testeLabel}\n`;
  document.getElementById('a-output').textContent = texto;
  document.getElementById('a-totalDisplay').textContent = `Total: R$ ${totalGeralStr}`;
  setTimeout(() => copiar('a-output', 'a-copiedMsg'), 50);
}

function aLimpar() {
  document.getElementById('a-cliente').value = ''; document.getElementById('a-pagamento').value = '';
  document.querySelector('input[name="a-teste"][value="remover"]').checked = true;
  if (document.getElementById('a-faixa').options.length > 0) document.getElementById('a-faixa').selectedIndex = 0;
  aFaixaChange();
  document.querySelectorAll('#form-alarme .modulo-card').forEach(c => {
    c.classList.remove('selected');
    var el = c.querySelector('input[type="checkbox"]');
    if (el) el.checked = false;
    var el = c.querySelector('.a-m-valor');
    if (el) el.value = '';
  });
  document.getElementById('a-output').textContent = 'Preencha os dados e clique em "Gerar texto"';
  document.getElementById('a-totalDisplay').textContent = '';
}

// === MÓDULO ===
function mToggle(el) {
  const checkbox = el.querySelector('input[type="checkbox"]');
  checkbox.checked = !checkbox.checked;
  el.classList.toggle('selected', checkbox.checked);
  if (checkbox.checked) {
    const moduloId = parseInt(el.dataset.moduloId);
    if (valorModuloModulo > 0) {
      const valorInput = el.querySelector('.m-valor');
      const reais = Math.floor(valorModuloModulo);
      const centavos = Math.round((valorModuloModulo - reais) * 100);
      valorInput.value = reais.toLocaleString('pt-BR') + ',' + String(centavos).padStart(2, '0');
    }
  }
}

function mGerar() {
  const cliente = document.getElementById('m-cliente').value.trim();
  const pagamento = document.getElementById('m-pagamento').value.trim();
  const periodoTeste = document.querySelector('input[name="m-teste"]:checked');
  const testeLabel = periodoTeste ? (periodoTeste.value === 'remover' ? 'Pode ser removido' : 'Deve ser mantido') : '';
  if (!cliente) { document.getElementById('m-output').textContent = 'Preencha o nome do cliente.'; return; }
  const modulos = document.querySelectorAll('#m-modulos .modulo-card.selected');
  if (modulos.length === 0) { document.getElementById('m-output').textContent = 'Selecione pelo menos um módulo.'; return; }
  let total = 0;
  const linhas = [];
  modulos.forEach(card => {
    const nome = card.querySelector('.modulo-nome').textContent.trim();
    const valor = parseCurrency(card.querySelector('.m-valor').value);
    const valorStr = valor.toFixed(2).replace('.', ',');
    linhas.push({ nome, valorStr }); total += valor;
  });
  const totalStr = total.toFixed(2).replace('.', ',');
  let texto = `Negociado com ${cliente}\nMódulo Adicional\n\n`;
  linhas.forEach(l => { texto += `${l.nome} = R$ ${l.valorStr}\n`; });
  texto += `TOTAL = R$ ${totalStr}\n\n`;
  if (pagamento) texto += `Pagamento para ${pagamento}\n`;
  if (testeLabel) texto += `${testeLabel}\n`;
  document.getElementById('m-output').textContent = texto;
  document.getElementById('m-totalDisplay').textContent = `Total: R$ ${totalStr}`;
  setTimeout(() => copiar('m-output', 'm-copiedMsg'), 50);
}

function mLimpar() {
  document.getElementById('m-cliente').value = ''; document.getElementById('m-pagamento').value = '';
  document.querySelector('input[name="m-teste"][value="remover"]').checked = true;
  if (document.getElementById('m-faixa').options.length > 0) document.getElementById('m-faixa').selectedIndex = 0;
  mFaixaChange();
  document.querySelectorAll('#m-modulos .modulo-card').forEach(c => {
    c.classList.remove('selected');
    var el = c.querySelector('input[type="checkbox"]');
    if (el) el.checked = false;
    var el = c.querySelector('.m-valor');
    if (el) el.value = '';
  });
  document.getElementById('m-output').textContent = 'Preencha os dados e clique em "Gerar texto"';
  document.getElementById('m-totalDisplay').textContent = '';
}

// === DESCONTO ===
var dFaixaData = null;
var dModCounter = 0;
var dPercDesconto = 0;
var dTotalEsperado = 0;
var dTotalPago = 0;

function dFaixaChange() {
  const select = document.getElementById('d-faixa');
  if (!select.value) { dFaixaData = null; document.getElementById('d-faixa-nome').textContent = 'Faixa de contas'; return; }
  dFaixaData = JSON.parse(decodeURIComponent(select.value));
  document.getElementById('d-faixa-nome').textContent = dFaixaData.desc;
  document.getElementById('d-valor-base').textContent = 'R$ ' + dFaixaData.valor_base.toFixed(2).replace('.', ',');
  document.querySelectorAll('#d-modulos-container .modulo-card').forEach(c => c.classList.remove('selected'));
  document.querySelectorAll('#d-tabela-body .d-mod-row').forEach(r => r.remove());
  dModCounter = 0;
  dAutoCalc();
}

function dModuloToggle(el) {
  const isSelected = el.classList.toggle('selected');
  const modId = parseInt(el.dataset.moduloId);
  const modNome = el.dataset.moduloNome;
  if (isSelected) {
    dAddModuloRow(modId, modNome);
  } else {
    const row = document.querySelector(`#d-tabela-body .d-mod-row[data-modulo-id="${modId}"]`);
    if (row) row.remove();
    dAutoCalc();
  }
}

function dAddModuloRow(modId, modNome) {
  dModCounter++;
  const id = dModCounter;
  const tbody = document.getElementById('d-tabela-body');
  const tr = document.createElement('tr');
  tr.id = 'd-mod-row-' + id;
  tr.className = 'd-mod-row';
  tr.dataset.moduloId = modId;
  tr.style.background = 'var(--bg-raised)';
  let valorEsperado = 'R$ 0,00';
  if (dFaixaData) {
    valorEsperado = 'R$ ' + dFaixaData.valor_modulo.toFixed(2).replace('.', ',');
  }
  tr.innerHTML = `<td style="padding:8px;border-bottom:1px solid var(--primary-hairline);font-weight:600;">${modNome}</td><td style="padding:8px;text-align:right;border-bottom:1px solid var(--primary-hairline);">${valorEsperado}</td><td style="padding:8px;text-align:right;border-bottom:1px solid var(--primary-hairline);"><input type="text" class="d-pago" data-tipo="mod" style="width:100%;padding:4px 6px;border:1px solid var(--primary-hairline);border-radius:4px;font-size:0.85rem;text-align:right;outline:none;" placeholder="0,00" oninput="formatCurrency(this);dAutoCalc()"></td><td style="padding:8px;text-align:right;border-bottom:1px solid var(--primary-hairline);" class="d-desc-pct">—</td></tr>`;
  tbody.appendChild(tr);
  dAutoCalc();
}

function dAutoCalc() {
  const foot = document.getElementById('d-tabela-foot');
  if (!dFaixaData) {
    foot.innerHTML = '<tr><td colspan="4" style="padding:10px 8px;text-align:center;color:#525252;">Selecione uma faixa para ver os resultados</td></tr>';
    document.getElementById('d-output').textContent = 'Preencha os dados e clique em "Calcular desconto"';
    return;
  }
  const inputs = document.querySelectorAll('#d-tabela-body .d-pago');
  let totalEsperado = dFaixaData.valor_base;
  let totalPago = 0;
  inputs.forEach(inp => {
    const pago = parseCurrency(inp.value);
    totalPago += pago;
    if (inp.dataset.tipo === 'faixa') {
      const faixaPago = pago;
      const descEl = document.getElementById('d-desc-faixa');
      if (dFaixaData.valor_base > 0 && faixaPago > 0) {
        const fpct = ((dFaixaData.valor_base - faixaPago) / dFaixaData.valor_base) * 100;
        descEl.textContent = fpct.toFixed(2).replace('.', ',') + '%';
        descEl.style.color = fpct > 0 ? 'var(--primary)' : 'var(--danger)';
      } else {
        descEl.textContent = '—';
      }
      return;
    }
  });
  document.querySelectorAll('#d-tabela-body .d-mod-row').forEach(row => {
    const pagoInput = row.querySelector('.d-pago');
    const descEl = row.querySelector('.d-desc-pct');
    const cells = row.querySelectorAll('td');
    const esperadoText = cells[1] ? cells[1].textContent.replace('R$ ', '').trim() : '0';
    const esperado = parseCurrency(esperadoText);
    const pago = parseCurrency(pagoInput.value);
    totalEsperado += esperado;
    if (esperado > 0 && pago > 0) {
      const pct = ((esperado - pago) / esperado) * 100;
      descEl.textContent = pct.toFixed(2).replace('.', ',') + '%';
      descEl.style.color = pct > 0 ? 'var(--primary)' : 'var(--danger)';
    } else {
      descEl.textContent = '—';
    }
  });
  dTotalEsperado = totalEsperado;
  dTotalPago = totalPago;
  const dif = totalEsperado - totalPago;
  const perc = totalEsperado > 0 ? (dif / totalEsperado) * 100 : 0;
  dPercDesconto = perc;
  const f = v => 'R$ ' + v.toFixed(2).replace('.', ',');
  foot.innerHTML = `<tr><td style="padding:10px 8px;color:#e8e8e8;">TOTAL</td><td style="padding:10px 8px;text-align:right;">${f(totalEsperado)}</td><td style="padding:10px 8px;text-align:right;color:#e8e8e8;">${f(totalPago)}</td><td style="padding:10px 8px;text-align:right;color:${perc > 0 ? 'var(--primary)' : 'var(--danger)'};">${perc.toFixed(2).replace('.', ',')}%</td></tr>`;
  const linhas = [];
  linhas.push(`Faixa: ${dFaixaData.desc} — Valor base: ${f(dFaixaData.valor_base)} | Pago: ${f(document.querySelector('#d-row-faixa .d-pago') ? parseCurrency(document.querySelector('#d-row-faixa .d-pago').value) : 0)}`);
  document.querySelectorAll('#d-tabela-body .d-mod-row').forEach(row => {
    const nome = row.dataset.moduloNome || 'Módulo';
    const cells = row.querySelectorAll('td');
    const esperadoText = cells[1] ? cells[1].textContent.replace('R$ ', '').trim() : '0';
    const esperado = parseCurrency(esperadoText);
    const pago = parseCurrency(row.querySelector('.d-pago').value);
    linhas.push(`${nome}: Esperado ${f(esperado)} | Pago ${f(pago)}`);
  });
  linhas.push(`Total esperado: ${f(totalEsperado)}`);
  linhas.push(`Total pago: ${f(totalPago)}`);
  linhas.push(`Diferença: ${dif >= 0 ? '-' : '+'}${f(Math.abs(dif))}`);
  linhas.push(`Desconto total: ${perc.toFixed(2).replace('.', ',')}%`);
  document.getElementById('d-output').textContent = linhas.join('\n');
}

function dCalcular() {
  if (!dFaixaData) { document.getElementById('d-output').textContent = 'Selecione uma faixa de clientes.'; return; }
  dAutoCalc();
  setTimeout(() => copiar('d-output', 'd-copiedMsg'), 50);
}

function dMudarFaixa() {
  if (!dFaixaData) { document.getElementById('d-output').textContent = 'Selecione a faixa atual primeiro.'; return; }
  document.getElementById('d-nova-faixa').focus();
}

function dNovaFaixaChange() {
  const select = document.getElementById('d-nova-faixa');
  const resultDiv = document.getElementById('d-upgrade-result');
  if (!select.value || !dFaixaData) { resultDiv.innerHTML = ''; return; }
  const novaFaixa = JSON.parse(decodeURIComponent(select.value));
  const cliente = document.getElementById('d-cliente').value.trim() || 'Cliente';

  const faixaPagoInput = document.querySelector('#d-row-faixa .d-pago');
  const faixaPago = faixaPagoInput ? parseCurrency(faixaPagoInput.value) : 0;
  const valorBaseAtual = faixaPago > 0 ? faixaPago : dFaixaData.valor_base;

  const difBase = novaFaixa.valor_base - valorBaseAtual;

  const modRows = document.querySelectorAll('#d-tabela-body .d-mod-row');
  let totalModAtual = 0;
  let totalModNovo = 0;
  let qtdMod = 0;
  modRows.forEach(row => {
    qtdMod++;
    const modId = parseInt(row.dataset.moduloId) || 0;
    const pagoInput = row.querySelector('.d-pago');
    const pagoVal = pagoInput ? parseCurrency(pagoInput.value) : 0;
    const modValAtual = pagoVal > 0 ? pagoVal : dFaixaData.valor_modulo;
    totalModAtual += modValAtual;
    const modValNovo = novaFaixa.valor_modulo;
    totalModNovo += modValNovo;
  });

  const difMod = qtdMod > 0 ? (totalModNovo / qtdMod) - (totalModAtual / qtdMod) : 0;

  const totalAtual = valorBaseAtual + totalModAtual;
  const totalNovo = novaFaixa.valor_base + totalModNovo;
  const totalDif = totalNovo - totalAtual;

  const f = v => (v >= 0 ? 'R$ ' : '-R$ ') + Math.abs(v).toFixed(2).replace('.', ',');
  const descAtual = dFaixaData.desc;
  const descNovo = novaFaixa.desc;

  const labelAtual = faixaPago > 0 ? 'Valor atual (pago)' : 'Valor atual';
  const modLabel = (pagoVal) => pagoVal > 0 ? 'pago' : 'esperado';

  let html = `<div style="background:var(--bg-raised);border:1px solid var(--primary-hairline);padding:12px;font-size:0.85rem;line-height:1.8;">
    <strong style="color:var(--primary);">Resumo da Mudança</strong><br><br>
    <strong>Licença:</strong> ${descAtual} → ${descNovo}<br>
    ${labelAtual}: ${f(valorBaseAtual)} → ${f(novaFaixa.valor_base)} <span style="color:${difBase >= 0 ? 'var(--primary)' : 'var(--danger)'};font-weight:600;">(dif: ${f(difBase)})</span><br>`;
  if (qtdMod > 0) {
    const modValLabel = `Módulos (${qtdMod}x)`;
    html += `${modValLabel}: ${f(totalModAtual)} → ${f(totalModNovo)} <span style="color:${difMod >= 0 ? 'var(--primary)' : 'var(--danger)'};font-weight:600;">(dif: ${f(difMod * qtdMod)})</span><br>`;
  }
  html += `<br><strong>${labelAtual}:</strong> ${f(totalAtual)}<br>
    <strong>Total novo:</strong> ${f(totalNovo)}<br>
    <strong style="color:#e8e8e8;">Diferença total: ${f(totalDif)}</strong>
  </div>`;
  resultDiv.innerHTML = html;

  let texto = `Negociado com ${cliente} — mudança para ${descNovo.toUpperCase()}\nVALORES + DIFERENÇAS:\n`;
  texto += `Mudança ${descNovo} = ${f(novaFaixa.valor_base)} (diferença = ${f(difBase)})\n`;
  modRows.forEach(row => {
    const nomeMod = row.dataset.moduloNome || 'Módulo';
    const pago = parseCurrency(row.querySelector('.d-pago').value);
    const modAtual = pago > 0 ? pago : dFaixaData.valor_modulo;
    const dif = novaFaixa.valor_modulo - modAtual;
    texto += `${nomeMod} ${descNovo} = ${f(novaFaixa.valor_modulo)} (diferença = ${f(dif)})\n`;
  });
  texto += `\nTOTAL = ${f(totalNovo)} (diferença = ${f(totalDif)})\n`;
  const pagamento = document.getElementById('d-pagamento').value.trim();
  if (pagamento) texto += `\nPagamento para ${pagamento}\n`;
  const testeLabel = document.querySelector('input[name="d-teste"]:checked');
  if (testeLabel) texto += `${testeLabel.value === 'remover' ? 'Período teste pode ser removido' : 'Período teste deve ser mantido'}\n`;
  texto += `\nObservações:\n`;
  document.getElementById('d-output').textContent = texto;
  setTimeout(() => copiar('d-output', 'd-copiedMsg'), 50);
}

function dAplicarDesconto() {
  const select = document.getElementById('d-nova-faixa');
  if (!select.value || !dFaixaData) { document.getElementById('d-output').textContent = 'Selecione a nova faixa primeiro.'; return; }
  const novaFaixa = JSON.parse(decodeURIComponent(select.value));
  if (dPercDesconto === 0 && dTotalPago === 0) { document.getElementById('d-output').textContent = 'Calcule o desconto atual primeiro.'; return; }
  const cliente = document.getElementById('d-cliente').value.trim() || 'Cliente';
  const f = v => (v >= 0 ? 'R$ ' : '-R$ ') + Math.abs(v).toFixed(2).replace('.', ',');

  const modRows = document.querySelectorAll('#d-tabela-body .d-mod-row');

  const faixaPagoInput = document.querySelector('#d-row-faixa .d-pago');
  const faixaPago = faixaPagoInput ? parseCurrency(faixaPagoInput.value) : 0;
  const valorBaseAtual = faixaPago > 0 ? faixaPago : dFaixaData.valor_base;

  let qtdMod = 0;
  let totalModAtualPago = 0;
  modRows.forEach(row => {
    qtdMod++;
    const pagoInput = row.querySelector('.d-pago');
    const pagoVal = pagoInput ? parseCurrency(pagoInput.value) : 0;
    totalModAtualPago += pagoVal > 0 ? pagoVal : dFaixaData.valor_modulo;
  });

  const totalPagoAtual = valorBaseAtual + totalModAtualPago;
  const totalNovoCheio = novaFaixa.valor_base + qtdMod * novaFaixa.valor_modulo;
  const totalNovoDesc = totalNovoCheio * (1 - dPercDesconto / 100);
  const difCliente = totalNovoDesc - totalPagoAtual;

  const difBase = novaFaixa.valor_base - valorBaseAtual;
  const difMod = qtdMod > 0 ? novaFaixa.valor_modulo - (totalModAtualPago / qtdMod) : 0;

  const resultDiv = document.getElementById('d-upgrade-result');

  const descAtual = dFaixaData.desc;
  const descNovo = novaFaixa.desc;

  const propBase = valorBaseAtual / (totalPagoAtual || 1);
  const propMod = totalModAtualPago > 0 ? totalModAtualPago / (totalPagoAtual || 1) : 0;
  const novoBaseDesc = novaFaixa.valor_base * (1 - dPercDesconto / 100);
  const novoModDesc = qtdMod > 0 ? novaFaixa.valor_modulo * (1 - dPercDesconto / 100) : 0;
  const difBaseDesc = novoBaseDesc - valorBaseAtual;
  const difModDesc = novoModDesc - (totalModAtualPago > 0 ? totalModAtualPago / qtdMod : 0);

  const labelAtual = faixaPago > 0 ? 'pago' : 'esperado';

  let html = `<div style="background:var(--bg-raised);border:1px solid var(--primary-hairline);padding:12px;font-size:0.85rem;line-height:1.8;">
    <strong style="color:var(--primary);">Comparativo com mesmo desconto (${dPercDesconto.toFixed(2).replace('.', ',')}%)</strong><br><br>
    <strong>Licença:</strong> ${descAtual} → ${descNovo}<br>
    Valor ${labelAtual}: ${f(valorBaseAtual)} → cheio: ${f(novaFaixa.valor_base)} / c/ desc: ${f(novoBaseDesc)}<br>
    Diferença: ${f(difBase)} (cheio) | ${f(difBaseDesc)} (c/ desconto)<br>`;
  if (qtdMod > 0) {
    html += `<br><strong>Módulos (${qtdMod}x):</strong><br>
      Valor ${labelAtual}: ${f(totalModAtualPago)} → cheio: ${f(qtdMod * novaFaixa.valor_modulo)} / c/ desc: ${f(novoModDesc * qtdMod)}<br>
      Diferença: ${f(difMod * qtdMod)} (cheio) | ${f(difModDesc * qtdMod)} (c/ desconto)<br>`;
  }
  html += `<br><strong>Total ${labelAtual}:</strong> ${f(totalPagoAtual)}<br>
    <strong>Total novo cheio:</strong> ${f(totalNovoCheio)}<br>
    <strong style="color:#e8e8e8;">Total novo c/ desconto: ${f(totalNovoDesc)}</strong><br>
    <strong>Diferença para o cliente:</strong> <span style="color:${difCliente >= 0 ? 'var(--primary)' : 'var(--danger)'};font-weight:600;">${f(difCliente)}</span>
  </div>`;
  resultDiv.innerHTML = html;

  const pagamento = document.getElementById('d-pagamento').value.trim();
  const testeLabel = document.querySelector('input[name="d-teste"]:checked');

  let texto = `Negociado com ${cliente} — mudança para ${descNovo.toUpperCase()}\nVALORES + DIFERENÇAS:\n`;
  texto += `Mudança ${descNovo} = ${f(novaFaixa.valor_base)} (diferença = ${f(difBase)})\n`;
  modRows.forEach(row => {
    const nomeMod = row.dataset.moduloNome || 'Módulo';
    const pago = parseCurrency(row.querySelector('.d-pago').value);
    const modAtual = pago > 0 ? pago : dFaixaData.valor_modulo;
    const dif = novaFaixa.valor_modulo - modAtual;
    texto += `${nomeMod} ${descNovo} = ${f(novaFaixa.valor_modulo)} (diferença = ${f(dif)})\n`;
  });
  texto += `\nTOTAL = ${f(totalNovoCheio)} (diferença = ${f(totalNovoCheio - totalPagoAtual)})\n`;

  texto += `\n--- COM MESMO DESCONTO (${dPercDesconto.toFixed(2).replace('.', ',')}%) ---\n`;
  texto += `Mudança ${descNovo} = ${f(novoBaseDesc)} (diferença = ${f(difBaseDesc)})\n`;
  modRows.forEach(row => {
    const nomeMod = row.dataset.moduloNome || 'Módulo';
    const pago = parseCurrency(row.querySelector('.d-pago').value);
    const modAtual = pago > 0 ? pago : dFaixaData.valor_modulo;
    const dif = novoModDesc - modAtual;
    texto += `${nomeMod} ${descNovo} = ${f(novoModDesc)} (diferença = ${f(dif)})\n`;
  });
  texto += `\nTOTAL = ${f(totalNovoDesc)} (diferença = ${f(difCliente)})\n`;
  if (pagamento) texto += `\nPagamento para ${pagamento}\n`;
  if (testeLabel) texto += `${testeLabel.value === 'remover' ? 'Período teste pode ser removido' : 'Período teste deve ser mantido'}\n`;
  texto += `\nObservações:\n`;
  document.getElementById('d-output').textContent = texto;
  setTimeout(() => copiar('d-output', 'd-copiedMsg'), 50);
}

function dLimpar() {
  if (document.getElementById('d-faixa').options.length > 0) document.getElementById('d-faixa').selectedIndex = 0;
  document.getElementById('d-cliente').value = '';
  document.getElementById('d-pagamento').value = '';
  var el = document.querySelector('input[name="d-teste"][value="remover"]');
  if (el) el.checked = true;
  dFaixaData = null;
  dPercDesconto = 0;
  dTotalEsperado = 0;
  dTotalPago = 0;
  var el = document.getElementById('d-faixa-nome');
  if (el) el.textContent = 'Faixa de contas';
  var el = document.getElementById('d-valor-base');
  if (el) el.textContent = 'R$ 0,00';
  var el = document.querySelector('#d-row-faixa .d-pago');
  if (el) el.value = '';
  document.querySelectorAll('.d-mod-row').forEach(r => r.remove());
  document.querySelectorAll('#d-modulos-container .modulo-card').forEach(c => c.classList.remove('selected'));
  var el = document.getElementById('d-desc-faixa');
  if (el) el.textContent = '—';
  var el = document.getElementById('d-tabela-foot');
  if (el) el.innerHTML = '<tr><td colspan="4" style="padding:10px 8px;text-align:center;color:#525252;">Selecione uma faixa para ver os resultados</td></tr>';
  document.getElementById('d-output').textContent = 'Preencha os dados e clique em "Calcular desconto"';
  document.getElementById('d-nova-faixa').value = '';
  var el = document.getElementById('d-upgrade-result');
  if (el) el.innerHTML = '';
  dModCounter = 0;
}

// === ORÇAMENTO ===
let orcItemCount = 0;

function orcamentoAddItem() {
  orcItemCount++;
  const id = orcItemCount;
  const div = document.createElement('div');
  div.className = 'orcamento-item';
  div.dataset.id = id;
  div.style.cssText = 'background:var(--bg-raised);border:1px solid var(--primary-hairline);padding:12px;margin-bottom:12px;';

  div.innerHTML = `
    <div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) minmax(100px,130px);gap:8px;margin-bottom:8px;">
      <div class="field" style="min-width:0;"><label>Produto</label><select class="o-produto" onchange="orcamentoProdutoChange(this)" style="width:100%;max-width:100%;padding:8px 10px;border:1px solid var(--primary-hairline);border-radius:4px;font-size:0.9rem;outline:none;background:var(--bg-raised);"><option value="">Selecione</option></select></div>
      <div class="field" style="min-width:0;"><label>Faixa</label><select class="o-faixa" onchange="orcamentoFaixaChange(this)" style="width:100%;max-width:100%;padding:8px 10px;border:1px solid var(--primary-hairline);border-radius:4px;font-size:0.9rem;outline:none;background:var(--bg-raised);"><option value="">Carregando...</option></select></div>
      <div class="field" style="min-width:0;"><label>Valor (R$)</label><input type="text" class="o-valor" value="0,00" oninput="formatCurrency(this);orcamentoAtualizarResumo()" style="width:100%;max-width:100%;padding:8px 10px;border:1px solid var(--primary-hairline);border-radius:4px;font-size:0.9rem;outline:none;"></div>
    </div>
    <div class="modulo-grid o-modulos" style="margin-bottom:4px;"></div>
    <button class="btn btn-sm btn-danger" onclick="orcamentoRemoveItem(${id})">✕ Remover item</button>
  `;

  document.getElementById('orcamento-items').appendChild(div);
  orcamentoCarregarSelect(div.querySelector('.o-produto'));
}

async function orcamentoCarregarSelect(select) {
  try {
    const { data: produtos } = await supabase.from('produtos').select('*').order('id');
    select.innerHTML = '<option value="">Selecione</option>' + (produtos || []).map(p =>
      `<option value="${p.id}">${p.nome}</option>`
    ).join('');
  } catch (e) {
    select.innerHTML = '<option value="">Erro ao carregar</option>';
  }
}

async function orcamentoProdutoChange(el) {
  const item = el.closest('.orcamento-item');
  const produtoId = el.value;
  const faixaSelect = item.querySelector('.o-faixa');
  const modContainer = item.querySelector('.o-modulos');
  const valorDiv = item.querySelector('.o-valor');

  if (!produtoId) {
    faixaSelect.innerHTML = '<option value="">Selecione um produto</option>';
    modContainer.innerHTML = '';
    valorDiv.textContent = 'R$ 0,00';
    orcamentoAtualizarResumo();
    return;
  }

  try {
    const [{ data: faixas }, { data: modulos }] = await Promise.all([
      supabase.from('faixas').select('*').eq('produto_id', produtoId).order('ordem').order('id'),
      supabase.from('modulos').select('*').eq('produto_id', produtoId).order('id')
    ]);

    faixaSelect.innerHTML = '<option value="">Selecione a faixa</option>' + (faixas || []).map(f =>
      `<option value="${encodeURIComponent(JSON.stringify({desc:f.descricao,valor_base:f.valor_base,valor_modulo:f.valor_modulo,id:f.id}))}">${f.descricao}</option>`
    ).join('');

    modContainer.innerHTML = (modulos || []).map(m =>
      `<div class="modulo-card" data-modulo-id="${m.id}" onclick="orcamentoModToggle(this)">
        <div class="modulo-nome">
          <input type="checkbox" onclick="event.stopPropagation()" onchange="orcamentoModToggle(this.parentElement.parentElement)">
          ${m.nome}<span class="modulo-icone">${iconesModulos[m.nome] || ''}</span>
        </div>
        <div class="modulo-valor">
          <span style="font-size:0.85rem;color:#8a8a8a;margin-right:4px;">R$</span>
          <span class="o-mod-valor">0,00</span>
        </div>
      </div>`
    ).join('');

    valorDiv.value = '0,00';
    orcamentoAtualizarResumo();
  } catch (e) {
    faixaSelect.innerHTML = '<option value="">Erro ao carregar</option>';
  }
}

function orcamentoFaixaChange(el) {
  const item = el.closest('.orcamento-item');
  const valorDiv = item.querySelector('.o-valor');
  const modCards = item.querySelectorAll('.o-modulos .modulo-card');

  if (!el.value) {
    valorDiv.value = '0,00';
    modCards.forEach(card => { card.querySelector('.o-mod-valor').textContent = '0,00'; });
    orcamentoAtualizarResumo();
    return;
  }

  const faixa = JSON.parse(decodeURIComponent(el.value));

  valorDiv.value = faixa.valor_base.toFixed(2).replace('.', ',');

  modCards.forEach(card => {
    var intPart = Math.floor(faixa.valor_modulo);
    var centPart = Math.round((faixa.valor_modulo - intPart) * 100);
    card.querySelector('.o-mod-valor').textContent = intPart.toLocaleString('pt-BR') + ',' + String(centPart).padStart(2, '0');
  });

  orcamentoAtualizarResumo();
}

function orcamentoModToggle(el) {
  const checkbox = el.querySelector('input[type="checkbox"]');
  checkbox.checked = !checkbox.checked;
  el.classList.toggle('selected', checkbox.checked);
  orcamentoAtualizarResumo();
}

function orcamentoRemoveItem(id) {
  const el = document.querySelector(`.orcamento-item[data-id="${id}"]`);
  if (el) el.remove();
  orcamentoAtualizarResumo();
}

function orcamentoAtualizarResumo() {
  const items = document.querySelectorAll('.orcamento-item');
  const resumoDiv = document.getElementById('orcamento-resumo');
  const totalDiv = document.getElementById('orcamento-total');

  let html = '';
  let totalGeral = 0;
  let idx = 0;

  items.forEach(item => {
    const faixaSelect = item.querySelector('.o-faixa');
    if (!faixaSelect.value) return;
    idx++;

    const valorUnit = parseCurrency(item.querySelector('.o-valor').value) || 0;
    const subtotal = valorUnit;
    const prodSelect = item.querySelector('.o-produto');
    const prodName = prodSelect.options[prodSelect.selectedIndex]?.text || 'Produto';
    const faixa = JSON.parse(decodeURIComponent(faixaSelect.value));

    html += `<div style="font-size:0.85rem;margin-bottom:4px;">${idx}. ${prodName} (${faixa.desc}) = R$ ${subtotal.toFixed(2).replace('.', ',')}</div>`;

    item.querySelectorAll('.o-modulos .modulo-card.selected').forEach(card => {
      const nome = card.querySelector('.modulo-nome').textContent.trim();
      const valStr = card.querySelector('.o-mod-valor').textContent;
      const val = parseFloat(valStr.replace(/\./g, '').replace(',', '.'));
      totalGeral += val;
      html += `<div style="font-size:0.8rem;color:#8a8a8a;padding-left:16px;margin-bottom:2px;">+ ${nome} = R$ ${valStr}</div>`;
    });

    totalGeral += subtotal;
  });

  if (!html) {
    resumoDiv.innerHTML = '<span style="color:#525252;font-size:0.85rem;">Adicione itens e selecione produtos/faixas</span>';
    totalDiv.textContent = '';
    return;
  }

  resumoDiv.innerHTML = html;
  totalDiv.textContent = 'TOTAL GERAL = R$ ' + totalGeral.toFixed(2).replace('.', ',');
}

function orcamentoGerar() {
  const items = document.querySelectorAll('.orcamento-item');
  if (items.length === 0) { document.getElementById('orcamento-output').textContent = 'Adicione pelo menos um item.'; return; }

  let texto = 'ORÇAMENTO\n\n';
  let totalGeral = 0;
  let idx = 0;
  let hasItems = false;

  items.forEach(item => {
    const faixaSelect = item.querySelector('.o-faixa');
    if (!faixaSelect.value) return;
    hasItems = true;
    idx++;

    const faixa = JSON.parse(decodeURIComponent(faixaSelect.value));
    const prodSelect = item.querySelector('.o-produto');
    const prodName = prodSelect.options[prodSelect.selectedIndex]?.text || 'Produto';
    const valorUnit = parseCurrency(item.querySelector('.o-valor').value) || 0;
    const subtotal = valorUnit;
    const modCards = item.querySelectorAll('.o-modulos .modulo-card.selected');

    texto += `${idx}) ${prodName.toUpperCase()} (${faixa.desc.toUpperCase()})\n`;
    texto += `${prodName} ${faixa.desc} = R$ ${valorUnit.toFixed(2).replace('.', ',')}\n`;

    let totalMod = 0;
    modCards.forEach(card => {
      const nome = card.querySelector('.modulo-nome').textContent.trim();
      const valStr = card.querySelector('.o-mod-valor').textContent;
      const val = parseFloat(valStr.replace(/\./g, '').replace(',', '.'));
      totalMod += val;
      texto += `${nome} = R$ ${valStr}\n`;
    });

    texto += `Subtotal: R$ ${(subtotal + totalMod).toFixed(2).replace('.', ',')}\n\n`;
    totalGeral += subtotal + totalMod;
  });

  if (!hasItems) { document.getElementById('orcamento-output').textContent = 'Configure pelo menos um item com produto e faixa.'; return; }

  texto += `TOTAL GERAL = R$ ${totalGeral.toFixed(2).replace('.', ',')}\n`;

  document.getElementById('orcamento-output').textContent = texto;
  document.getElementById('orcamento-totalDisplay').textContent = 'Total: R$ ' + totalGeral.toFixed(2).replace('.', ',');
  setTimeout(() => copiar('orcamento-output', 'orcamento-copiedMsg'), 50);
}

function orcamentoLimpar() {
  document.getElementById('orcamento-items').innerHTML = '';
  document.getElementById('orcamento-resumo').innerHTML = '<span style="color:#525252;font-size:0.85rem;">Adicione itens e selecione produtos/faixas</span>';
  document.getElementById('orcamento-total').textContent = '';
  document.getElementById('orcamento-totalDisplay').textContent = '';
  document.getElementById('orcamento-output').textContent = 'Adicione itens e clique em "Gerar Texto"';
  orcItemCount = 0;
}

// === ITEM INICIAL PORTARIA ===
pAddItem();
