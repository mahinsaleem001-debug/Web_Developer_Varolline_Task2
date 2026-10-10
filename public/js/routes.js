// Connects each page in access.js to the function that draws it.
import { loginPage } from './pages/login.js';
import { signupPage } from './pages/signup.js';
import { dashboardPage } from './pages/dashboard.js';
import { profilePage } from './pages/profile.js';
import { reportsPage } from './pages/reports.js';
import { adminUsersPage } from './pages/adminUsers.js';
import { forbiddenPage, notFoundPage } from './pages/messages.js';

export const views = {
  '/login': loginPage,
  '/signup': signupPage,
  '/dashboard': dashboardPage,
  '/profile': profilePage,
  '/reports': reportsPage,
  '/admin/users': adminUsersPage,
  '/forbidden': forbiddenPage,
  '/not-found': notFoundPage,
};
