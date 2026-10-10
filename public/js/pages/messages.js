import { el } from '../ui.js';

export function forbiddenPage() {
  return el(
    'div',
    { class: 'page page-narrow message-page' },
    el('p', { class: 'message-code' }, '403'),
    el('h1', {}, 'Access denied'),
    el('p', { class: 'muted' }, 'Your role does not have permission to open this page.'),
    el('a', { class: 'btn btn-primary', href: '#/dashboard' }, 'Back to dashboard')
  );
}

export function notFoundPage() {
  return el(
    'div',
    { class: 'page page-narrow message-page' },
    el('p', { class: 'message-code' }, '404'),
    el('h1', {}, 'Page not found'),
    el('p', { class: 'muted' }, 'The page you are looking for does not exist.'),
    el('a', { class: 'btn btn-primary', href: '#/dashboard' }, 'Back to dashboard')
  );
}
