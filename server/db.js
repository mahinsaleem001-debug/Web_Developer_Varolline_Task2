// A tiny user store. Users live in memory and are saved to a JSON file.
// (A real project would use a database such as PostgreSQL or MongoDB.)
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function createStore(file) {
  let users = [];

  if (file && fs.existsSync(file)) {
    try {
      users = JSON.parse(fs.readFileSync(file, 'utf8')).users || [];
    } catch (error) {
      throw new Error(`Could not read ${file}: ${error.message}`);
    }
  }

  // Write to a temp file first, then rename, so a crash cannot corrupt the data.
  function persist() {
    if (!file) return; // file = null means "memory only" (used by tests)
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const tmp = `${file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify({ users }, null, 2));
    fs.renameSync(tmp, file);
  }

  const findById = (id) => users.find((u) => u.id === id) || null;
  const findByEmail = (email) => users.find((u) => u.email === email) || null;

  return {
    all: () => users.map((u) => ({ ...u })),
    findById,
    findByEmail,

    create({ name, email, passwordHash, role = 'user', createdAt }) {
      if (findByEmail(email)) {
        const error = new Error('Email already registered');
        error.code = 'DUPLICATE_EMAIL';
        throw error;
      }
      const user = {
        id: crypto.randomUUID(),
        name,
        email,
        passwordHash,
        role,
        createdAt: createdAt || new Date().toISOString(),
      };
      users.push(user);
      persist();
      return { ...user };
    },

    update(id, changes) {
      const user = findById(id);
      if (!user) return null;
      Object.assign(user, changes);
      persist();
      return { ...user };
    },

    remove(id) {
      const before = users.length;
      users = users.filter((u) => u.id !== id);
      if (users.length === before) return false;
      persist();
      return true;
    },
  };
}

module.exports = { createStore };
