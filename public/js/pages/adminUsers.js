import { api } from '../api.js';
import { session } from '../session.js';
import { ROLES } from '../access.js';
import { el, toast, roleBadge, formatDate, initials } from '../ui.js';

export async function adminUsersPage() {
  const { users } = await api.listUsers();
  const me = session.user;

  const tbody = el('tbody');
  const empty = el('p', { class: 'empty', hidden: true }, 'No users match your search.');
  const count = el('p', { class: 'muted' });

  function renderRows(filter = '') {
    const term = filter.trim().toLowerCase();
    const visible = users.filter((u) => u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term));

    tbody.replaceChildren(...visible.map(renderRow));
    empty.hidden = visible.length > 0;
    count.textContent = `${visible.length} of ${users.length} user${users.length === 1 ? '' : 's'}`;
  }

  function renderRow(user) {
    const isMe = user.id === me.id;

    const select = el(
      'select',
      {
        'aria-label': `Role for ${user.name}`,
        disabled: isMe,
        onchange: async () => {
          const previous = user.role;
          try {
            const { user: updated } = await api.changeRole(user.id, select.value);
            user.role = updated.role;
            toast(`${user.name} is now ${updated.role}.`, 'success');
          } catch (error) {
            select.value = previous; // undo the dropdown if the server said no
            toast(error.message, 'error');
          }
        },
      },
      ROLES.map((role) => el('option', { value: role, selected: role === user.role }, role))
    );

    const remove = el(
      'button',
      {
        class: 'btn btn-danger btn-sm',
        disabled: isMe,
        title: isMe ? 'You cannot delete your own account' : `Delete ${user.name}`,
        onclick: async () => {
          if (!window.confirm(`Delete ${user.name}? This cannot be undone.`)) return;
          try {
            await api.deleteUser(user.id);
            users.splice(users.indexOf(user), 1);
            renderRows(search.value);
            toast(`${user.name} was deleted.`, 'success');
          } catch (error) {
            toast(error.message, 'error');
          }
        },
      },
      'Delete'
    );

    return el(
      'tr',
      {},
      el(
        'td',
        { 'data-label': 'User' },
        el(
          'div',
          { class: 'user-cell' },
          el('div', { class: 'avatar', 'aria-hidden': 'true' }, initials(user.name)),
          el('div', {}, el('strong', {}, user.name, isMe ? el('span', { class: 'you-tag' }, 'You') : null), el('span', { class: 'cell-note' }, user.email))
        )
      ),
      el('td', { 'data-label': 'Role' }, isMe ? roleBadge(user.role) : select),
      el('td', { 'data-label': 'Joined' }, formatDate(user.createdAt)),
      el('td', { class: 'cell-actions' }, remove)
    );
  }

  const search = el('input', {
    type: 'search',
    class: 'search',
    placeholder: 'Search by name or email',
    'aria-label': 'Search users',
    oninput: () => renderRows(search.value),
  });

  renderRows();

  return el(
    'div',
    { class: 'page' },
    el('h1', { class: 'page-title' }, 'User management'),
    el('p', { class: 'muted page-sub' }, 'Admins only. Role changes take effect immediately.'),
    el(
      'section',
      { class: 'card' },
      el('div', { class: 'toolbar' }, search, count),
      el(
        'div',
        { class: 'table-wrap' },
        el(
          'table',
          { class: 'table users-table' },
          el('thead', {}, el('tr', {}, el('th', {}, 'User'), el('th', {}, 'Role'), el('th', {}, 'Joined'), el('th', {}, el('span', { class: 'sr-only' }, 'Actions')))),
          tbody
        )
      ),
      empty
    )
  );
}
