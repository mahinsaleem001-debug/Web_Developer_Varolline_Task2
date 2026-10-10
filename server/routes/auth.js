const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { validateSignup, validateLogin } = require('../validators');
const { publicUser } = require('../serialize');
const { DEMO_ACCOUNTS } = require('../demoAccounts');

function authRoutes({ store, config, auth }) {
  const router = express.Router();

  // Slows down password-guessing attacks.
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: config.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many attempts. Please wait a few minutes and try again.' },
  });

  // Used when the email does not exist, so the response time is the same
  // as for a wrong password (prevents guessing which emails are registered).
  const dummyHash = bcrypt.hashSync('not-a-real-password', config.bcryptRounds);

  // Session persistence: the browser asks "am I still logged in?" on every page load.
  // Always answers 200, so a logged-out visitor does not see errors in the console.
  router.get('/session', (req, res) => {
    const session = auth.readSession(req);
    res.json({
      user: session ? publicUser(session.user) : null,
      expiresAt: session ? session.exp * 1000 : null,
      demoAccounts: config.showDemoAccounts
        ? DEMO_ACCOUNTS.map(({ label, email, password }) => ({ label, email, password }))
        : [],
    });
  });

  router.post('/signup', limiter, async (req, res, next) => {
    try {
      const { errors, values } = validateSignup(req.body);
      if (Object.keys(errors).length > 0) {
        return res.status(400).json({ error: 'Please fix the highlighted fields.', details: errors });
      }

      const passwordHash = await bcrypt.hash(values.password, config.bcryptRounds);

      let user;
      try {
        // Role is always "user". Anything the client sends as "role" is ignored.
        user = store.create({ name: values.name, email: values.email, passwordHash, role: 'user' });
      } catch (error) {
        if (error.code === 'DUPLICATE_EMAIL') {
          return res.status(409).json({
            error: 'An account with this email already exists.',
            details: { email: 'This email is already registered.' },
          });
        }
        throw error;
      }

      auth.startSession(res, user);
      res.status(201).json({ user: publicUser(user) });
    } catch (error) {
      next(error);
    }
  });

  router.post('/login', limiter, async (req, res, next) => {
    try {
      const { errors, values } = validateLogin(req.body);
      if (Object.keys(errors).length > 0) {
        return res.status(400).json({ error: 'Please enter your email and password.', details: errors });
      }

      const user = store.findByEmail(values.email);
      const passwordMatches = await bcrypt.compare(values.password, user ? user.passwordHash : dummyHash);

      if (!user || !passwordMatches) {
        // Same message for "no such email" and "wrong password" on purpose.
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      auth.startSession(res, user);
      res.json({ user: publicUser(user) });
    } catch (error) {
      next(error);
    }
  });

  router.post('/logout', (req, res) => {
    auth.endSession(res);
    res.json({ ok: true });
  });

  return router;
}

module.exports = { authRoutes };
