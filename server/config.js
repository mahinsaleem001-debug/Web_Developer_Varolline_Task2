// Reads settings from environment variables (.env) in one place.
const path = require('path');
const crypto = require('crypto');

function buildConfig(env = process.env) {
  const isProd = env.NODE_ENV === 'production';

  let jwtSecret = env.JWT_SECRET;
  // The example value from .env.example is public, so it must never be used as a real secret.
  const isPlaceholder = /^change-me/i.test(jwtSecret || '');
  if (!jwtSecret || jwtSecret.length < 32 || isPlaceholder) {
    if (isProd) {
      throw new Error('JWT_SECRET must be set to your own random string of 32+ characters in production.');
    }
    // Development fallback: a random secret that changes on every restart.
    jwtSecret = crypto.randomBytes(48).toString('hex');
    console.warn(
      '[config] JWT_SECRET is missing, too short or still the example value. Using a temporary random secret, ' +
        'so logins reset on restart. Copy .env.example to .env to fix this.'
    );
  }

  const sessionHours = Number(env.SESSION_HOURS) || 2;

  return Object.freeze({
    isProd,
    port: Number(env.PORT) || 3000,
    jwtSecret,
    sessionSeconds: Math.round(sessionHours * 3600),
    cookieName: 'access_token',
    bcryptRounds: Number(env.BCRYPT_ROUNDS) || 10,
    dbFile: env.DB_FILE || path.join(__dirname, '..', 'data', 'users.json'),
    showDemoAccounts: !isProd && env.SHOW_DEMO_ACCOUNTS !== 'false',
    rateLimitMax: Number(env.RATE_LIMIT_MAX) || 20,
  });
}

module.exports = { buildConfig };
