// API tests using Node's built-in test runner. Run with: npm test
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { buildConfig } = require('../server/config');
const { createStore } = require('../server/db');
const { createApp } = require('../server/app');

const SECRET = 'test-secret-that-is-at-least-32-characters-long';
const config = buildConfig({ JWT_SECRET: SECRET, BCRYPT_ROUNDS: '4', RATE_LIMIT_MAX: '1000' });

let server;
let base;
let store;

before(async () => {
  store = createStore(null); // memory only
  const hash = bcrypt.hashSync('Admin@1234', 4);
  store.create({ name: 'Test Admin', email: 'admin@test.com', passwordHash: hash, role: 'admin' });
  store.create({ name: 'Test Manager', email: 'manager@test.com', passwordHash: hash, role: 'manager' });
  store.create({ name: 'Test User', email: 'user@test.com', passwordHash: hash, role: 'user' });

  server = createApp({ store, config }).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

// Small helper: send a request, optionally with a cookie, and return status, body and cookie.
async function call(method, url, { body, cookie } = {}) {
  const res = await fetch(base + url, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const setCookie = res.headers.getSetCookie ? res.headers.getSetCookie()[0] : res.headers.get('set-cookie');
  return {
    status: res.status,
    data: await res.json().catch(() => null),
    cookie: setCookie ? setCookie.split(';')[0] : null,
    rawSetCookie: setCookie || '',
  };
}

async function loginAs(email) {
  const res = await call('POST', '/api/auth/login', { body: { email, password: 'Admin@1234' } });
  assert.equal(res.status, 200);
  return res.cookie;
}

// ---------- Signup ----------
test('signup rejects invalid input with field errors', async () => {
  const res = await call('POST', '/api/auth/signup', { body: { name: 'A', email: 'nope', password: 'short' } });
  assert.equal(res.status, 400);
  assert.ok(res.data.details.name);
  assert.ok(res.data.details.email);
  assert.ok(res.data.details.password);
});

test('signup requires a letter and a number in the password', async () => {
  const res = await call('POST', '/api/auth/signup', {
    body: { name: 'Pass Test', email: 'pass@test.com', password: 'onlyletters' },
  });
  assert.equal(res.status, 400);
  assert.match(res.data.details.password, /letter and one number/);
});

test('signup creates a "user" and ignores a role sent by the client', async () => {
  const res = await call('POST', '/api/auth/signup', {
    body: { name: 'New Person', email: 'New@Test.com', password: 'Password1', role: 'admin' },
  });
  assert.equal(res.status, 201);
  assert.equal(res.data.user.role, 'user');
  assert.equal(res.data.user.email, 'new@test.com'); // normalised to lowercase
  assert.equal(res.data.user.passwordHash, undefined); // never sent to the browser
  assert.match(res.rawSetCookie, /HttpOnly/i);
  assert.match(res.rawSetCookie, /SameSite=Strict/i);
});

test('signup rejects a duplicate email', async () => {
  const res = await call('POST', '/api/auth/signup', {
    body: { name: 'Copy Cat', email: 'user@test.com', password: 'Password1' },
  });
  assert.equal(res.status, 409);
});

test('passwords are stored hashed, not as plain text', () => {
  const stored = store.findByEmail('new@test.com');
  assert.notEqual(stored.passwordHash, 'Password1');
  assert.ok(stored.passwordHash.startsWith('$2'));
});

// ---------- Login / session ----------
test('login fails with the same message for wrong password and unknown email', async () => {
  const wrongPassword = await call('POST', '/api/auth/login', { body: { email: 'user@test.com', password: 'Wrong@123' } });
  const unknownEmail = await call('POST', '/api/auth/login', { body: { email: 'ghost@test.com', password: 'Wrong@123' } });
  assert.equal(wrongPassword.status, 401);
  assert.equal(unknownEmail.status, 401);
  assert.equal(wrongPassword.data.error, unknownEmail.data.error);
  assert.equal(wrongPassword.cookie, null);
});

test('login rejects missing fields', async () => {
  const res = await call('POST', '/api/auth/login', { body: {} });
  assert.equal(res.status, 400);
});

test('session endpoint returns the user while logged in and null when logged out', async () => {
  const cookie = await loginAs('user@test.com');
  const loggedIn = await call('GET', '/api/auth/session', { cookie });
  assert.equal(loggedIn.status, 200);
  assert.equal(loggedIn.data.user.email, 'user@test.com');
  assert.ok(loggedIn.data.expiresAt > Date.now());

  const anonymous = await call('GET', '/api/auth/session');
  assert.equal(anonymous.status, 200);
  assert.equal(anonymous.data.user, null);
});

test('logout clears the cookie', async () => {
  const res = await call('POST', '/api/auth/logout');
  assert.equal(res.status, 200);
  assert.match(res.rawSetCookie, /access_token=;/);
});

// ---------- Token security ----------
test('protected route without a token returns 401', async () => {
  const res = await call('GET', '/api/users');
  assert.equal(res.status, 401);
});

test('tampered token is rejected', async () => {
  const cookie = await loginAs('admin@test.com');
  const tampered = cookie.slice(0, -3) + 'abc';
  const res = await call('GET', '/api/users', { cookie: tampered });
  assert.equal(res.status, 401);
});

test('token signed with a different secret is rejected', async () => {
  const admin = store.findByEmail('admin@test.com');
  const forged = jwt.sign({ sub: admin.id }, 'some-other-secret-that-is-long-enough-xx', { issuer: 'accesshub' });
  const res = await call('GET', '/api/users', { cookie: `access_token=${forged}` });
  assert.equal(res.status, 401);
});

test('expired token is rejected', async () => {
  const admin = store.findByEmail('admin@test.com');
  const expired = jwt.sign({ sub: admin.id }, SECRET, { issuer: 'accesshub', expiresIn: -10 });
  const res = await call('GET', '/api/users', { cookie: `access_token=${expired}` });
  assert.equal(res.status, 401);
});

test('token with algorithm "none" is rejected', async () => {
  const admin = store.findByEmail('admin@test.com');
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub: admin.id, iss: 'accesshub' })).toString('base64url');
  const res = await call('GET', '/api/users', { cookie: `access_token=${header}.${payload}.` });
  assert.equal(res.status, 401);
});

// ---------- Role-based access control ----------
test('user role: blocked from reports and user management (403)', async () => {
  const cookie = await loginAs('user@test.com');
  assert.equal((await call('GET', '/api/reports/summary', { cookie })).status, 403);
  assert.equal((await call('GET', '/api/users', { cookie })).status, 403);
});

test('manager role: can see reports, blocked from user management', async () => {
  const cookie = await loginAs('manager@test.com');
  const reports = await call('GET', '/api/reports/summary', { cookie });
  assert.equal(reports.status, 200);
  assert.ok(reports.data.totalUsers >= 3);
  assert.equal(reports.data.signupsLast7Days.length, 7);
  assert.equal((await call('GET', '/api/users', { cookie })).status, 403);
});

test('admin role: can see reports and manage users', async () => {
  const cookie = await loginAs('admin@test.com');
  assert.equal((await call('GET', '/api/reports/summary', { cookie })).status, 200);
  const list = await call('GET', '/api/users', { cookie });
  assert.equal(list.status, 200);
  assert.ok(list.data.users.every((u) => u.passwordHash === undefined));
});

test('non-admin cannot change roles', async () => {
  const cookie = await loginAs('manager@test.com');
  const target = store.findByEmail('user@test.com');
  const res = await call('PATCH', `/api/users/${target.id}/role`, { cookie, body: { role: 'admin' } });
  assert.equal(res.status, 403);
  assert.equal(store.findByEmail('user@test.com').role, 'user');
});

test('admin can change a role, and the change applies immediately', async () => {
  const adminCookie = await loginAs('admin@test.com');
  const userCookie = await loginAs('user@test.com');
  const target = store.findByEmail('user@test.com');

  assert.equal((await call('GET', '/api/reports/summary', { cookie: userCookie })).status, 403);

  const res = await call('PATCH', `/api/users/${target.id}/role`, { cookie: adminCookie, body: { role: 'manager' } });
  assert.equal(res.status, 200);
  assert.equal(res.data.user.role, 'manager');

  // The same old token now has manager access, because the role is read fresh each time.
  assert.equal((await call('GET', '/api/reports/summary', { cookie: userCookie })).status, 200);

  await call('PATCH', `/api/users/${target.id}/role`, { cookie: adminCookie, body: { role: 'user' } });
});

test('admin cannot set an invalid role', async () => {
  const cookie = await loginAs('admin@test.com');
  const target = store.findByEmail('user@test.com');
  const res = await call('PATCH', `/api/users/${target.id}/role`, { cookie, body: { role: 'superuser' } });
  assert.equal(res.status, 400);
});

test('admin cannot change or delete their own account', async () => {
  const cookie = await loginAs('admin@test.com');
  const self = store.findByEmail('admin@test.com');
  assert.equal((await call('PATCH', `/api/users/${self.id}/role`, { cookie, body: { role: 'user' } })).status, 400);
  assert.equal((await call('DELETE', `/api/users/${self.id}`, { cookie })).status, 400);
  assert.equal(store.findByEmail('admin@test.com').role, 'admin');
});

test('deleting a user also invalidates their existing session', async () => {
  const adminCookie = await loginAs('admin@test.com');
  const victimCookie = (
    await call('POST', '/api/auth/signup', { body: { name: 'Temp Person', email: 'temp@test.com', password: 'Password1' } })
  ).cookie;
  const victim = store.findByEmail('temp@test.com');

  assert.equal((await call('GET', '/api/auth/session', { cookie: victimCookie })).data.user.email, 'temp@test.com');
  assert.equal((await call('DELETE', `/api/users/${victim.id}`, { cookie: adminCookie })).status, 200);
  assert.equal((await call('GET', '/api/auth/session', { cookie: victimCookie })).data.user, null);
});

test('unknown user id returns 404', async () => {
  const cookie = await loginAs('admin@test.com');
  assert.equal((await call('DELETE', '/api/users/does-not-exist', { cookie })).status, 404);
});

// ---------- Misc ----------
test('malformed JSON returns 400, not a crash', async () => {
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{ not json',
  });
  assert.equal(res.status, 400);
});

test('unknown API route returns a JSON 404', async () => {
  const res = await call('GET', '/api/nothing-here');
  assert.equal(res.status, 404);
  assert.ok(res.data.error);
});

test('security headers are set and the tech stack is not advertised', async () => {
  const res = await fetch(`${base}/api/auth/session`);
  assert.ok(res.headers.get('content-security-policy'));
  assert.equal(res.headers.get('x-powered-by'), null);
  assert.equal(res.headers.get('cache-control'), 'no-store');
});

test('login is rate limited after too many attempts', async () => {
  const limited = createApp({ store, config: buildConfig({ JWT_SECRET: SECRET, BCRYPT_ROUNDS: '4', RATE_LIMIT_MAX: '3' }) }).listen(0);
  await new Promise((resolve) => limited.once('listening', resolve));
  const url = `http://127.0.0.1:${limited.address().port}/api/auth/login`;
  const statuses = [];
  for (let i = 0; i < 5; i += 1) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@test.com', password: 'Wrong@123' }),
    });
    statuses.push(res.status);
  }
  limited.close();
  assert.deepEqual(statuses, [401, 401, 401, 429, 429]);
});

// ---------- Config ----------
test('config refuses the public example secret in production and ignores it in development', () => {
  const example = 'change-me-to-a-long-random-string-of-at-least-32-characters';
  assert.throws(() => buildConfig({ NODE_ENV: 'production', JWT_SECRET: example }), /JWT_SECRET/);
  assert.throws(() => buildConfig({ NODE_ENV: 'production' }), /JWT_SECRET/);

  const originalWarn = console.warn;
  console.warn = () => {};
  const dev = buildConfig({ JWT_SECRET: example });
  console.warn = originalWarn;
  assert.notEqual(dev.jwtSecret, example);
  assert.ok(dev.jwtSecret.length >= 32);

  const real = 'a'.repeat(40);
  assert.equal(buildConfig({ NODE_ENV: 'production', JWT_SECRET: real }).jwtSecret, real);
  assert.equal(buildConfig({ NODE_ENV: 'production', JWT_SECRET: real }).showDemoAccounts, false);
});
