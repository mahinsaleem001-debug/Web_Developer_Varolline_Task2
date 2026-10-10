// Authentication (who are you?) and authorization (what may you do?).
const jwt = require('jsonwebtoken');

const ISSUER = 'accesshub';

function createAuth({ store, config }) {
  const cookieOptions = {
    httpOnly: true, // JavaScript in the page cannot read the token (protects against XSS theft)
    sameSite: 'strict', // the cookie is not sent on cross-site requests (protects against CSRF)
    secure: config.isProd, // HTTPS only in production
    path: '/',
  };

  function signToken(user) {
    // The token only stores the user id. The role is looked up fresh on every
    // request, so changing or deleting a user takes effect immediately.
    return jwt.sign({ sub: user.id }, config.jwtSecret, {
      algorithm: 'HS256',
      expiresIn: config.sessionSeconds,
      issuer: ISSUER,
    });
  }

  // Logging in = giving the browser a signed token inside an httpOnly cookie.
  // Because the cookie has maxAge, it survives page refreshes and browser restarts.
  function startSession(res, user) {
    res.cookie(config.cookieName, signToken(user), {
      ...cookieOptions,
      maxAge: config.sessionSeconds * 1000,
    });
  }

  function endSession(res) {
    res.clearCookie(config.cookieName, cookieOptions);
  }

  // Returns { user, exp } for a valid session, or null. Never throws.
  function readSession(req) {
    const token = req.cookies && req.cookies[config.cookieName];
    if (!token) return null;
    try {
      const payload = jwt.verify(token, config.jwtSecret, {
        algorithms: ['HS256'],
        issuer: ISSUER,
      });
      const user = store.findById(payload.sub);
      return user ? { user, exp: payload.exp } : null;
    } catch {
      return null; // expired, tampered or malformed token
    }
  }

  // Middleware: the request must carry a valid token, otherwise 401.
  function authenticate(req, res, next) {
    const session = readSession(req);
    if (!session) {
      return res.status(401).json({ error: 'Please log in to continue.' });
    }
    req.user = session.user;
    next();
  }

  // Middleware factory: the logged-in user must have one of the allowed roles, otherwise 403.
  function authorize(...allowedRoles) {
    return (req, res, next) => {
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ error: 'You do not have permission to access this resource.' });
      }
      next();
    };
  }

  return { startSession, endSession, readSession, authenticate, authorize };
}

module.exports = { createAuth };
