// Admin-only user management.
const express = require('express');
const { ROLES } = require('../validators');
const { publicUser } = require('../serialize');

function userRoutes({ store, auth }) {
  const router = express.Router();

  // Every route below needs a valid login AND the "admin" role.
  router.use(auth.authenticate, auth.authorize('admin'));

  router.get('/', (req, res) => {
    const users = store
      .all()
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map(publicUser);
    res.json({ users });
  });

  router.patch('/:id/role', (req, res) => {
    const role = req.body && req.body.role;
    if (!ROLES.includes(role)) {
      return res.status(400).json({ error: `Role must be one of: ${ROLES.join(', ')}.` });
    }

    const target = store.findById(req.params.id);
    if (!target) return res.status(404).json({ error: 'User not found.' });

    // Because admins cannot edit themselves, at least one admin always remains.
    if (target.id === req.user.id) {
      return res.status(400).json({ error: 'You cannot change your own role.' });
    }

    res.json({ user: publicUser(store.update(target.id, { role })) });
  });

  router.delete('/:id', (req, res) => {
    const target = store.findById(req.params.id);
    if (!target) return res.status(404).json({ error: 'User not found.' });

    if (target.id === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own account.' });
    }

    store.remove(target.id);
    res.json({ ok: true });
  });

  return router;
}

module.exports = { userRoutes };
