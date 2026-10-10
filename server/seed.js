// Creates demo accounts so every role can be tried. Safe to run more than once.
require('dotenv').config({ quiet: true });
const bcrypt = require('bcryptjs');
const { buildConfig } = require('./config');
const { createStore } = require('./db');
const { DEMO_ACCOUNTS, SAMPLE_USERS, SAMPLE_PASSWORD } = require('./demoAccounts');

const config = buildConfig();
const store = createStore(config.dbFile);

function addUser({ name, email, password, role, daysAgo = 0 }) {
  const existing = store.findByEmail(email);
  if (existing) {
    // Agar user pehle se hai to uska name update kar do
    store.update(existing.id, { name, role });
    return false;
  }
  const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
  store.create({ name, email, passwordHash: bcrypt.hashSync(password, config.bcryptRounds), role, createdAt });
  return true;
}

let created = 0;
DEMO_ACCOUNTS.forEach((account) => {
  if (addUser({ ...account, daysAgo: 7 })) created += 1;
});
SAMPLE_USERS.forEach((account) => {
  if (addUser({ ...account, password: SAMPLE_PASSWORD })) created += 1;
});

console.log(`Seed complete: ${created} user(s) created, ${store.all().length} in total.`);
console.log('Demo logins: admin@demo.com / Admin@1234, manager@demo.com / Manager@1234, user@demo.com / User@1234');
