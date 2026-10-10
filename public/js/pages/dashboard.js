import { session } from '../session.js';
import { PAGES, ROLES, ROLE_INFO, canAccess } from '../access.js';
import { el, roleBadge, formatDateTime } from '../ui.js';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

// Builds the "who can open what" table straight from the PAGES list in access.js.
function accessTable(user) {
  const pages = PAGES.filter((page) => page.nav);

  return el(
    'div',
    { class: 'table-wrap' },
    el(
      'table',
      { class: 'table access-table' },
      el(
        'thead',
        {},
        el(
          'tr',
          {},
          el('th', {}, 'Page'),
          ROLES.map((role) => el('th', { class: role === user.role ? 'col-current' : '' }, role))
        )
      ),
      el(
        'tbody',
        {},
        pages.map((page) =>
          el(
            'tr',
            {},
            el('td', {}, el('strong', {}, page.title), el('span', { class: 'cell-note' }, page.summary)),
            ROLES.map((role) => {
              const allowed = canAccess(page, { role });
              return el(
                'td',
                { class: `${role === user.role ? 'col-current ' : ''}${allowed ? 'yes' : 'no'}` },
                el('span', { 'aria-label': allowed ? 'Allowed' : 'Not allowed' }, allowed ? '✓' : '—')
              );
            })
          )
        )
      )
    )
  );
}

export function dashboardPage() {
  const user = session.user;
  const links = PAGES.filter((page) => page.nav && page.path !== '/dashboard' && canAccess(page, user));

  return el(
    'div',
    { class: 'page' },
    el(
      'section',
      { class: 'hero' },
      el('p', { class: 'eyebrow' }, greeting()),
      el('h1', {}, user.name),
      el('p', { class: 'hero-sub' }, 'You are signed in as ', roleBadge(user.role), ' ', ROLE_INFO[user.role])
    ),
    el(
      'div',
      { class: 'grid grid-2' },
      el(
        'section',
        { class: 'card' },
        el('h2', {}, 'Quick links'),
        el(
          'ul',
          { class: 'link-list' },
          links.map((page) =>
            el('li', {}, el('a', { href: `#${page.path}` }, el('strong', {}, page.title), el('span', {}, page.summary)))
          )
        )
      ),
      el(
        'section',
        { class: 'card' },
        el('h2', {}, 'Your session'),
        el(
          'dl',
          { class: 'details' },
          el('dt', {}, 'Signed in as'),
          el('dd', {}, user.email),
          el('dt', {}, 'Session ends'),
          el('dd', {}, session.expiresAt ? formatDateTime(session.expiresAt) : '—'),
          el('dt', {}, 'Stays signed in'),
          el('dd', {}, 'Yes, even after refreshing the page or restarting the browser, until the session ends.')
        )
      )
    ),
    el(
      'section',
      { class: 'card' },
      el('h2', {}, 'What each role can access'),
      el('p', { class: 'muted' }, 'Your role is highlighted. Pages you cannot open are also blocked on the server.'),
      accessTable(user)
    )
  );
}
