// Builds the Express app. Kept separate from index.js so tests can start it easily.
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { createAuth } = require('./middleware/auth');
const { authRoutes } = require('./routes/auth');
const { userRoutes } = require('./routes/users');
const { reportRoutes } = require('./routes/reports');

function createApp({ store, config }) {
  const app = express();
  const auth = createAuth({ store, config });

  app.disable('x-powered-by');
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: { 'upgrade-insecure-requests': null }, // keeps http://localhost working
      },
    })
  );
  app.use(express.json({ limit: '10kb' }));
  app.use(cookieParser());

  // API responses contain personal data, so browsers must not cache them.
  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  app.use('/api/auth', authRoutes({ store, config, auth }));
  app.use('/api/users', userRoutes({ store, auth }));
  app.use('/api/reports', reportRoutes({ store, auth }));

  app.use('/api', (req, res) => res.status(404).json({ error: 'API route not found.' }));

  app.use(express.static(path.join(__dirname, '..', 'public')));

  // Last-resort error handler: never leaks internal details to the browser.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Request body must be valid JSON.' });
    }
    if (err.type === 'entity.too.large') {
      return res.status(413).json({ error: 'Request body is too large.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Something went wrong on the server.' });
  });

  return app;
}

module.exports = { createApp };
