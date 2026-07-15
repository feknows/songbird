// === MÁSCARAS E UTILS ===
function abrirCalendario(inputId) {
  const input = document.getElementById(inputId);
  document.querySelector('.temp-date-picker')?.remove();
  const rect = input.getBoundingClientRect();
  const temp = document.createElement('input');
  temp.type = 'date';
  temp.className = 'temp-date-picker';
  temp.style.cssText = `
    position: fixed;
    left: ${rect.left}px;
    top: ${rect.top}px;
    width: ${rect.width}px;
    height: ${rect.height}px;
    opacity: 0.99;
    color: transparent;
    background: transparent;
    border: none;
    outline: none;
    z-index: 10000;
  `;
  temp.addEventListener('change', () => {
    if (temp.value) {
      const [ano, mes, dia] = temp.value.split('-');
      input.value = `${dia}/${mes}/${ano}`;
    }
    temp.remove();
  });
  temp.addEventListener('blur', () => setTimeout(() => temp.remove(), 500));
  document.body.appendChild(temp);
  temp.focus();
  setTimeout(() => {
    try { temp.showPicker(); } catch (e) { temp.click(); }
  }, 50);
}

function formatDate(input) {
  let val = input.value.replace(/\D/g, '').slice(0, 8);
  if (val.length > 4) val = val.slice(0, 2) + '/' + val.slice(2, 4) + '/' + val.slice(4);
  else if (val.length > 2) val = val.slice(0, 2) + '/' + val.slice(2);
  input.value = val;
}

function formatDateShort(input) {
  let val = input.value.replace(/\D/g, '').slice(0, 6);
  if (val.length > 4) val = val.slice(0, 2) + '/' + val.slice(2, 4) + '/' + val.slice(4);
  else if (val.length > 2) val = val.slice(0, 2) + '/' + val.slice(2);
  input.value = val;
}

function formatCurrency(input) {
  let v = input.value.replace(/\D/g, '');
  if (v.length === 0) { input.value = ''; return; }
  v = v.padStart(3, '0');
  let reais = v.slice(0, -2).replace(/^0+/, '') || '0';
  let centavos = v.slice(-2);
  reais = reais.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  input.value = reais + ',' + centavos;
}

function parseCurrency(str) {
  return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
}

function pluralizar(nome) {
  const map = {
    'Portaria Virtual': 'Portarias Virtuais',
    'Controle de Acesso': 'Controles de Acesso',
    'Portaria Autonoma': 'Portarias Autônomas',
  };
  return map[nome] || nome + 's';
}

// === COPIAR ===
async function copiar(outputId, msgId) {
  const output = document.getElementById(outputId);
  try {
    await navigator.clipboard.writeText(output.textContent);
  } catch (_) {
    const textarea = document.createElement('textarea');
    textarea.value = output.textContent;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
  const msg = document.getElementById(msgId);
  msg.classList.add('show');
  setTimeout(() => msg.classList.remove('show'), 2000);
}

// === MODAL CONFIRMAÇÃO ===
let confirmCallback = null;
let confirmCancelCallback = null;

function confirmarAcao(titulo, msg, callback, cancelCallback) {
  document.getElementById('modal-confirm-titulo').textContent = titulo;
  document.getElementById('modal-confirm-msg').innerHTML = msg;
  confirmCallback = callback;
  confirmCancelCallback = cancelCallback || null;
  document.getElementById('modal-confirm').style.display = 'flex';
}

function fecharModalConfirm() {
  document.getElementById('modal-confirm').style.display = 'none';
  if (confirmCancelCallback) confirmCancelCallback();
  confirmCallback = null;
  confirmCancelCallback = null;
}

function executarConfirm() {
  document.getElementById('modal-confirm').style.display = 'none';
  if (confirmCallback) {
    const cb = confirmCallback;
    confirmCallback = null;
    confirmCancelCallback = null;
    cb();
  }
}
