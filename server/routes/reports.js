// Manager and admin only.
const express = require('express');

function reportRoutes({ store, auth }) {
  const router = express.Router();

  router.get('/summary', auth.authenticate, auth.authorize('manager', 'admin'), (req, res) => {
    const users = store.all();

    const byRole = { user: 0, manager: 0, admin: 0 };
    users.forEach((u) => {
      byRole[u.role] += 1;
    });

    // New accounts per day for the last 7 days (oldest first).
    const signupsLast7Days = [];
    for (let i = 6; i >= 0; i -= 1) {
      const day = new Date();
      day.setUTCDate(day.getUTCDate() - i);
      const date = day.toISOString().slice(0, 10);
      const count = users.filter((u) => u.createdAt.slice(0, 10) === date).length;
      signupsLast7Days.push({ date, count });
    }

    res.json({
      totalUsers: users.length,
      byRole,
      signupsLast7Days,
      generatedAt: new Date().toISOString(),
    });
  });

  return router;
}

module.exports = { reportRoutes };
