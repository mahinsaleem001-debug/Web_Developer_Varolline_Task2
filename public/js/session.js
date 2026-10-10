// Holds "who is logged in" for the page. The real proof of login is the httpOnly cookie;
// this is only a copy used to decide what to show.
import { api } from './api.js';

let user = null;
let expiresAt = null;
let demoAccounts = [];

export const session = {
  get user() {
    return user;
  },
  get expiresAt() {
    return expiresAt;
  },
  get demoAccounts() {
    return demoAccounts;
  },

  setUser(newUser, newExpiresAt = null) {
    user = newUser;
    expiresAt = newExpiresAt;
  },

  clear() {
    user = null;
    expiresAt = null;
  },

  // Session persistence: on every page load, ask the server if the cookie is still valid.
  async restore() {
    try {
      const data = await api.session();
      user = data.user;
      expiresAt = data.expiresAt;
      demoAccounts = data.demoAccounts || [];
    } catch {
      user = null;
      expiresAt = null;
    }
  },
};
