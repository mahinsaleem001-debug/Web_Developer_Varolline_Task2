// Server-side input validation. The browser also validates for a better
// experience, but the server must never trust the browser.
const ROLES = ['user', 'manager', 'admin'];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const isString = (value) => typeof value === 'string';

function validateSignup(body) {
  const input = body || {};
  const errors = {};

  const name = isString(input.name) ? input.name.trim().replace(/\s+/g, ' ') : '';
  const email = isString(input.email) ? input.email.trim().toLowerCase() : '';
  const password = isString(input.password) ? input.password : '';

  if (!name) errors.name = 'Name is required.';
  else if (name.length < 2) errors.name = 'Name must be at least 2 characters.';
  else if (name.length > 50) errors.name = 'Name must be 50 characters or less.';

  if (!email) errors.email = 'Email is required.';
  else if (email.length > 254 || !EMAIL_RE.test(email)) errors.email = 'Enter a valid email address.';

  if (!password) errors.password = 'Password is required.';
  else if (password.length < 8) errors.password = 'Password must be at least 8 characters.';
  else if (password.length > 72) errors.password = 'Password must be 72 characters or less.';
  else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    errors.password = 'Password must contain at least one letter and one number.';
  }

  return { errors, values: { name, email, password } };
}

function validateLogin(body) {
  const input = body || {};
  const errors = {};

  const email = isString(input.email) ? input.email.trim().toLowerCase() : '';
  const password = isString(input.password) ? input.password : '';

  if (!email) errors.email = 'Email is required.';
  if (!password) errors.password = 'Password is required.';

  return { errors, values: { email, password } };
}

module.exports = { ROLES, validateSignup, validateLogin };
