import { api } from '../api.js';
import { session } from '../session.js';
import { navigate } from '../router.js';
import { el, textField, passwordField, withLoading, toast } from '../ui.js';
import { checkName, checkEmail, checkNewPassword, checkConfirm } from '../validate.js';
import { authShell } from './authShell.js';

export function signupPage() {
  const name = textField({ id: 'name', label: 'Full name', autocomplete: 'name', placeholder: 'e.g. Sara Khan' });
  const email = textField({ id: 'email', label: 'Email', type: 'email', autocomplete: 'email', placeholder: 'you@company.com' });
  const password = passwordField({
    id: 'password',
    label: 'Password',
    autocomplete: 'new-password',
    placeholder: 'At least 8 characters',
    hint: 'Use 8 or more characters with at least one letter and one number.',
  });
  const confirm = passwordField({ id: 'confirm', label: 'Confirm password', autocomplete: 'new-password', placeholder: 'Repeat your password' });

  const alertBox = el('div', { class: 'alert alert-error', role: 'alert', hidden: true });
  const submit = el('button', { class: 'btn btn-primary btn-block', type: 'submit' }, 'Create account');

  // Clear a field's error as soon as the user starts fixing it.
  [name, email, password, confirm].forEach((field) => field.input.addEventListener('input', () => field.setError('')));

  const form = el(
    'form',
    {
      novalidate: true,
      onsubmit: async (event) => {
        event.preventDefault();
        alertBox.hidden = true;

        const errors = {
          name: checkName(name.value),
          email: checkEmail(email.value),
          password: checkNewPassword(password.value),
          confirm: checkConfirm(password.value)(confirm.value),
        };
        name.setError(errors.name);
        email.setError(errors.email);
        password.setError(errors.password);
        confirm.setError(errors.confirm);
        if (Object.values(errors).some(Boolean)) return;

        try {
          await withLoading(submit, 'Creating account…', () =>
            api.signup({ name: name.value, email: email.value, password: password.value })
          );
          const data = await api.session(); // signup logs you in
          session.setUser(data.user, data.expiresAt);
          toast(`Account created. Welcome, ${data.user.name.split(' ')[0]}!`, 'success');
          navigate('/dashboard', { replace: true });
        } catch (error) {
          name.setError(error.details.name);
          email.setError(error.details.email);
          password.setError(error.details.password);
          if (!Object.keys(error.details).length) {
            alertBox.textContent = error.message;
            alertBox.hidden = false;
          }
        }
      },
    },
    alertBox,
    name.root,
    email.root,
    password.root,
    confirm.root,
    submit
  );

  return authShell(
    el(
      'div',
      { class: 'auth-card' },
      el('h2', {}, 'Create your account'),
      el('p', { class: 'muted' }, 'New accounts start with the standard "user" role.'),
      form,
      el('p', { class: 'auth-switch' }, 'Already registered? ', el('a', { href: '#/login' }, 'Log in'))
    )
  );
}
