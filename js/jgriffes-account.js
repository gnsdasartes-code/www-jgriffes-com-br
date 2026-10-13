(() => {
  const login = new URLSearchParams(location.search).get('modo') === 'login';
  const form = document.getElementById('account-form');
  const password = document.getElementById('password');
  const confirm = document.getElementById('confirm');
  if (login) {
    document.title = 'Iniciar sessão | J Griffes';
    document.getElementById('page-title').textContent = 'Iniciar sessão';
    document.getElementById('breadcrumb-current').textContent = 'Login';
    document.getElementById('page-intro').textContent = 'Acesse sua conta J Griffes.';
    document.getElementById('submit-label').textContent = 'INICIAR SESSÃO';
    document.getElementById('mode-switch').innerHTML = 'Não possui uma conta ainda? <a href="cadastro.html">Criar uma conta</a>';
    document.querySelectorAll('[data-register]').forEach(section => {
      section.hidden = true;
      section.querySelectorAll('input').forEach(input => { input.disabled = true; });
    });
    password.autocomplete = 'current-password';
    password.removeAttribute('minlength');
    password.placeholder = 'Digite sua senha';
  }
  document.querySelectorAll('.reveal').forEach(button => {
    button.addEventListener('click', () => {
      const input = document.getElementById(button.getAttribute('aria-controls'));
      const visible = input.type === 'password';
      input.type = visible ? 'text' : 'password';
      button.textContent = visible ? 'Ocultar' : 'Mostrar';
      button.setAttribute('aria-label', (visible ? 'Ocultar' : 'Mostrar') + (input === confirm ? ' confirmação de senha' : ' senha'));
      button.setAttribute('aria-pressed', String(visible));
    });
  });
  const validateConfirmation = () => confirm.setCustomValidity(!login && confirm.value !== password.value ? 'As senhas precisam ser iguais.' : '');
  password.addEventListener('input', validateConfirmation);
  confirm.addEventListener('input', validateConfirmation);
  form.addEventListener('submit', event => {
    event.preventDefault();
    validateConfirmation();
    if (!form.reportValidity()) return;
    document.getElementById('form-status').textContent = 'O sistema de contas ainda não está conectado. Nenhum dado foi enviado ou salvo. Para atendimento, entre em contato pelo WhatsApp da loja.';
  });
})();
