// Shared layout for the login and signup pages: brand panel on the left, form on the right.
import { el } from '../ui.js';

export function authShell(formCard) {
  const points = [
    ['Signed sessions', 'Login uses JWT tokens stored in a secure cookie.'],
    ['Role-based access', 'Users, managers and admins each see only what they should.'],
    ['Protected pages', 'Direct links to restricted pages are checked on the server too.'],
  ];

  return el(
    'div',
    { class: 'auth-shell' },
    el(
      'aside',
      { class: 'auth-brand' },
      el('div', { class: 'brand-mark', 'aria-hidden': 'true' }, '✓'),
      el('h1', {}, 'AccessHub'),
      el('p', { class: 'auth-tagline' }, 'Secure access for every member of your team.'),
      el(
        'ul',
        { class: 'auth-points' },
        points.map(([title, text]) => el('li', {}, el('strong', {}, title), el('span', {}, text)))
      )
    ),
    el('section', { class: 'auth-panel' }, formCard)
  );
}
