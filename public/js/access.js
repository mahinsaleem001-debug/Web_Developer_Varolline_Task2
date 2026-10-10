// The single source of truth for "which page can who open".
// The router, the navigation bar and the dashboard's access table all read from this list.
//
// access: 'guest'  -> only for logged-out visitors (login, signup)
//         'public' -> everyone
//         'auth'   -> any logged-in user
//         [roles]  -> only these roles
export const ROLES = ['user', 'manager', 'admin'];

export const ROLE_INFO = {
  user: 'Standard member. Can use the dashboard and manage their own profile.',
  manager: 'Everything a user can do, plus access to team reports.',
  admin: 'Full control. Can also manage users and change their roles.',
};

export const PAGES = [
  { path: '/login', title: 'Log in', access: 'guest' },
  { path: '/signup', title: 'Create account', access: 'guest' },
  { path: '/dashboard', title: 'Dashboard', access: 'auth', nav: true, summary: 'Your overview and permissions' },
  { path: '/profile', title: 'My profile', access: 'auth', nav: true, summary: 'Your account and session details' },
  { path: '/reports', title: 'Reports', access: ['manager', 'admin'], nav: true, summary: 'Team and signup statistics' },
  { path: '/admin/users', title: 'User management', access: ['admin'], nav: true, summary: 'Change roles and remove users' },
  { path: '/forbidden', title: 'Access denied', access: 'public' },
  { path: '/not-found', title: 'Page not found', access: 'public' },
];

export function findPage(path) {
  return PAGES.find((page) => page.path === path) || null;
}

export function canAccess(page, user) {
  if (page.access === 'public') return true;
  if (page.access === 'guest') return !user;
  if (!user) return false;
  if (page.access === 'auth') return true;
  return page.access.includes(user.role);
}

// Decides what to do when someone opens a page: show it, or redirect somewhere else.
export function checkAccess(page, user, requestedPath) {
  if (canAccess(page, user)) return { allowed: true };

  if (page.access === 'guest') {
    return { allowed: false, redirect: '/dashboard' }; // already logged in
  }
  if (!user) {
    // Not logged in: go to login, and remember where they wanted to go.
    return { allowed: false, redirect: `/login?next=${encodeURIComponent(requestedPath)}` };
  }
  return { allowed: false, redirect: '/forbidden' }; // logged in, wrong role
}

// After login, only follow a "next" link that points to a real page this user may open.
export function safeNextPath(next, user) {
  const page = typeof next === 'string' ? findPage(next) : null;
  if (page && page.access !== 'guest' && canAccess(page, user)) return page.path;
  return '/dashboard';
}
