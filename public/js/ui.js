// Small helpers for building the page safely.
// Text is always added with textContent / text nodes, never innerHTML,
// so user-provided names or emails can never run as code (no XSS).

export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);

  for (const [key, value] of Object.entries(props || {})) {
    if (value === undefined || value === null || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (value === true) node.setAttribute(key, '');
    else node.setAttribute(key, value);
  }

  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

export function toast(message, type = 'info') {
  const container = document.getElementById('toasts');
  const item = el('div', { class: `toast toast-${type}`, role: type === 'error' ? 'alert' : 'status' }, message);
  container.append(item);
  setTimeout(() => {
    item.classList.add('toast-out');
    setTimeout(() => item.remove(), 300);
  }, 4200);
}

// A labelled input with its own error message line.
export function textField({ id, label, type = 'text', autocomplete, placeholder, hint }) {
  const input = el('input', { id, name: id, type, autocomplete, placeholder, 'aria-describedby': `${id}-error` });
  const error = el('p', { class: 'field-error', id: `${id}-error` });
  const root = el('div', { class: 'field' }, el('label', { for: id }, label), input, hint ? el('p', { class: 'field-hint' }, hint) : null, error);

  return {
    root,
    input,
    get value() {
      return input.value;
    },
    setError(message) {
      error.textContent = message || '';
      input.classList.toggle('input-invalid', Boolean(message));
      if (message) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
    },
  };
}

// Password input with a show/hide button.
export function passwordField({ id, label, autocomplete, placeholder, hint }) {
  const field = textField({ id, label, type: 'password', autocomplete, placeholder, hint });

  const toggle = el(
    'button',
    {
      type: 'button',
      class: 'toggle-visibility',
      'aria-label': 'Show password',
      onclick: () => {
        const show = field.input.type === 'password';
        field.input.type = show ? 'text' : 'password';
        toggle.textContent = show ? 'Hide' : 'Show';
        toggle.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      },
    },
    'Show'
  );

  // Put the input and the button side by side inside one box.
  const wrap = el('div', { class: 'password-wrap' });
  field.input.replaceWith(wrap);
  wrap.append(field.input, toggle);
  return field;
}

// Disables a button and shows "busy" text while an async action runs.
export async function withLoading(button, busyText, action) {
  const original = button.textContent;
  button.disabled = true;
  button.textContent = busyText;
  try {
    return await action();
  } finally {
    button.disabled = false;
    button.textContent = original;
  }
}

export function formatDate(value) {
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(value) {
  return new Date(value).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function roleBadge(role) {
  return el('span', { class: `badge badge-${role}` }, role);
}

export function initials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}
