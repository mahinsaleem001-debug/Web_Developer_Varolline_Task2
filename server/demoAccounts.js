// Demo data used by "npm run seed" and by the optional demo box on the login page.
// These are NOT real credentials. Never enable demo accounts in production.
const DEMO_ACCOUNTS = [
  { label: 'Admin', name: 'Muhammad Ahmad', email: 'admin@demo.com', password: 'Admin@1234', role: 'admin' },
  { label: 'Manager', name: 'Muhammad Mehmood', email: 'manager@demo.com', password: 'Manager@1234', role: 'manager' },
  { label: 'User', name: 'Amal Usman', email: 'user@demo.com', password: 'User@1234', role: 'user' },
];

// Extra people so the reports and user-management pages are not empty.
const SAMPLE_USERS = [
  { name: 'Hamza Ali', email: 'hamza@demo.com', role: 'user', daysAgo: 6 },
  { name: 'Sara Khan', email: 'sara@demo.com', role: 'user', daysAgo: 5 },
  { name: 'Bilal Ahmed', email: 'bilal@demo.com', role: 'manager', daysAgo: 4 },
  { name: 'Noor Fatima', email: 'noor@demo.com', role: 'user', daysAgo: 2 },
  { name: 'Zain Malik', email: 'zain@demo.com', role: 'user', daysAgo: 2 },
  { name: 'Iqra Shah', email: 'iqra@demo.com', role: 'user', daysAgo: 1 },
];

module.exports = { DEMO_ACCOUNTS, SAMPLE_USERS, SAMPLE_PASSWORD: 'Sample@1234' };
