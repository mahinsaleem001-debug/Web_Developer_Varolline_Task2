import { api } from '../api.js';
import { session } from '../session.js';
import { navigate } from '../router.js';
import { safeNextPath } from '../access.js';
import { el, textField, passwordField, withLoading, toast } from '../ui.js';
import { checkEmail, checkRequired } from '../validate.js';
import { authShell } from './authShell.js';

export function loginPage({ params }) {
  const email = textField({ id: 'email', label: 'Email', type: 'email', autocomplete: 'username', placeholder: 'you@company.com' });
  const password = passwordField({ id: 'password', label: 'Password', autocomplete: 'current-password', placeholder: 'Your password' });

  const expired = params.get('expired') === '1';
  const notice = el('div', { class: 'alert alert-info', role: 'status', hidden: !expired }, 'Your session has expired. Please log in again.');
  const alertBox = el('div', { class: 'alert alert-error', role: 'alert', hidden: true });
  const submit = el('button', { class: 'btn btn-primary btn-block', type: 'submit' }, 'Log in');

  function showError(message) {
    alertBox.textContent = message;
    alertBox.hidden = !message;
  }

  const form = el(
    'form',
    {
      novalidate: true,
      onsubmit: async (event) => {
        event.preventDefault();
        showError('');
        notice.hidden = true;

        const emailError = checkEmail(email.value);
        const passwordError = checkRequired('Password')(password.value);
        email.setError(emailError);
        password.setError(passwordError);
        if (emailError || passwordError) return;

        try {
          const { user } = await withLoading(submit, 'Logging in…', () =>
            api.login({ email: email.value, password: password.value })
          );
          const data = await api.session(); // also gives us the expiry time
          session.setUser(user, data.expiresAt);
          toast(`Welcome back, ${user.name.split(' ')[0]}!`, 'success');
          navigate(safeNextPath(params.get('next'), user), { replace: true });
        } catch (error) {
          email.setError(error.details.email);
          password.setError(error.details.password);
          showError(error.details.email || error.details.password ? '' : error.message);
        }
      },
    },
    notice,
    alertBox,
    email.root,
    password.root,
    submit
  );

  // Demo box (only shown when the server has demo accounts enabled).
  const demo = session.demoAccounts.length
    ? el(
        'div',
        { class: 'demo-box' },
        el('p', { class: 'demo-title' }, 'Try a demo account'),
        el(
          'div',
          { class: 'demo-buttons' },
          session.demoAccounts.map((account) =>
            el(
              'button',
              {
                type: 'button',
                class: 'btn btn-soft',
                onclick: () => {
                  email.input.value = account.email;
                  password.input.value = account.password;
                  email.setError('');
                  password.setError('');
                  form.requestSubmit();
                },
              },
              account.label
            )
          )
        )
      )
    : null;

  return authShell(
    el(
      'div',
      { class: 'auth-card' },
      el('h2', {}, 'Welcome back'),
      el('p', { class: 'muted' }, 'Log in to continue to your dashboard.'),
      form,
      demo,
      el('p', { class: 'auth-switch' }, 'New here? ', el('a', { href: '#/signup' }, 'Create an account'))
    )
  );
}
