import { session } from '../session.js';
import { ROLE_INFO } from '../access.js';
import { el, roleBadge, formatDate, formatDateTime, initials } from '../ui.js';

export function profilePage() {
  const user = session.user;

  return el(
    'div',
    { class: 'page page-narrow' },
    el('h1', { class: 'page-title' }, 'My profile'),
    el(
      'section',
      { class: 'card profile-card' },
      el('div', { class: 'avatar avatar-lg', 'aria-hidden': 'true' }, initials(user.name)),
      el('h2', {}, user.name),
      el('p', { class: 'muted' }, user.email),
      el(
        'dl',
        { class: 'details' },
        el('dt', {}, 'Role'),
        el('dd', {}, roleBadge(user.role)),
        el('dt', {}, 'What this means'),
        el('dd', {}, ROLE_INFO[user.role]),
        el('dt', {}, 'Member since'),
        el('dd', {}, formatDate(user.createdAt)),
        el('dt', {}, 'Session ends'),
        el('dd', {}, session.expiresAt ? formatDateTime(session.expiresAt) : '—')
      )
    )
  );
}
