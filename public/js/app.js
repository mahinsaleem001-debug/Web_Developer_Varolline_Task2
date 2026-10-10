// Starts the app: restores the session, draws the navigation and the current page,
// and enforces the route guards before any page is shown.
import { api } from './api.js';
import { session } from './session.js';
import { parseHash, navigate } from './router.js';
import { PAGES, findPage, checkAccess, canAccess } from './access.js';
import { views } from './routes.js';
import { el, toast, roleBadge, initials } from './ui.js';

const navRoot = document.getElementById('nav-root');
const main = document.getElementById('main');
let renderCounter = 0;

function renderNav(currentPath) {
  const user = session.user;
  if (!user) {
    navRoot.replaceChildren();
    return;
  }

  const links = PAGES.filter((page) => page.nav && canAccess(page, user));

  const logout = el(
    'button',
    {
      class: 'btn btn-ghost btn-sm',
      type: 'button',
      onclick: async () => {
        try {
          await api.logout();
        } catch {
          /* the cookie may already be gone, continue anyway */
        }
        session.clear();
        toast('You have been logged out.', 'info');
        navigate('/login', { replace: true });
      },
    },
    'Log out'
  );

  navRoot.replaceChildren(
    el(
      'nav',
      { class: 'topbar', 'aria-label': 'Main' },
      el(
        'div',
        { class: 'topbar-inner' },
        el('a', { class: 'logo', href: '#/dashboard' }, el('span', { class: 'logo-mark', 'aria-hidden': 'true' }, '✓'), 'AccessHub'),
        el(
          'ul',
          { class: 'nav-links' },
          links.map((page) =>
            el('li', {}, el('a', { href: `#${page.path}`, 'aria-current': page.path === currentPath ? 'page' : null }, page.title))
          )
        ),
        el(
          'div',
          { class: 'user-chip' },
          el('div', { class: 'avatar', 'aria-hidden': 'true' }, initials(user.name)),
          el('div', { class: 'user-chip-text' }, el('strong', {}, user.name), roleBadge(user.role)),
          logout
        )
      )
    )
  );
}

async function render() {
  const myRender = ++renderCounter;
  const { path, params, full } = parseHash();

  // "/" is not a page: send people to the right place.
  if (path === '/') {
    navigate(session.user ? '/dashboard' : '/login', { replace: true });
    return;
  }

  const page = findPage(path) || findPage('/not-found');

  // ROUTE GUARD: runs before the page is drawn.
  const decision = checkAccess(page, session.user, full);
  if (!decision.allowed) {
    navigate(decision.redirect, { replace: true });
    return;
  }

  renderNav(page.path);
  document.title = `${page.title} · AccessHub`;
  main.className = page.access === 'guest' ? 'main-auth' : 'main-app';
  main.replaceChildren(el('div', { class: 'loading', role: 'status' }, el('span', { class: 'spinner' }), 'Loading…'));

  try {
    const view = await views[page.path]({ params });
    if (myRender !== renderCounter) return; // the user already moved to another page
    main.replaceChildren(view);
  } catch (error) {
    if (myRender !== renderCounter) return;
    if (error.status === 401) return; // handled by the "auth:expired" listener
    if (error.status === 403) {
      navigate('/forbidden', { replace: true }); // the server said no, even though the UI allowed it
      return;
    }
    main.replaceChildren(
      el('div', { class: 'page page-narrow message-page' }, el('h1', {}, 'Something went wrong'), el('p', { class: 'muted' }, error.message))
    );
  }

  window.scrollTo(0, 0);
  main.focus({ preventScroll: true });
}

// Any protected API call that comes back 401 means the session ended.
window.addEventListener('auth:expired', () => {
  if (!session.user) return;
  session.clear();
  navigate('/login?expired=1', { replace: true });
});

window.addEventListener('hashchange', render);

(async function start() {
  await session.restore(); // session persistence: is the cookie still valid?
  render();
})();
