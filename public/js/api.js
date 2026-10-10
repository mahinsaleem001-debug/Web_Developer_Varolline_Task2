// All communication with the server goes through this file.
export class ApiError extends Error {
  constructor(message, status, details = {}) {
    super(message);
    this.status = status;
    this.details = details; // field-level errors, e.g. { email: 'Already registered' }
  }
}

// Endpoints where a 401 is a normal answer (wrong password), not an expired session.
const AUTH_ENDPOINTS = ['/api/auth/login', '/api/auth/signup', '/api/auth/session', '/api/auth/logout'];

async function request(method, url, body) {
  let response;
  try {
    response = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'same-origin', // send the httpOnly login cookie
    });
  } catch {
    throw new ApiError('Cannot reach the server. Check your connection and try again.', 0);
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 && !AUTH_ENDPOINTS.includes(url)) {
      window.dispatchEvent(new CustomEvent('auth:expired')); // handled in app.js
    }
    throw new ApiError(
      (data && data.error) || 'Something went wrong. Please try again.',
      response.status,
      (data && data.details) || {}
    );
  }
  return data;
}

export const api = {
  session: () => request('GET', '/api/auth/session'),
  signup: (values) => request('POST', '/api/auth/signup', values),
  login: (values) => request('POST', '/api/auth/login', values),
  logout: () => request('POST', '/api/auth/logout'),
  reportSummary: () => request('GET', '/api/reports/summary'),
  listUsers: () => request('GET', '/api/users'),
  changeRole: (id, role) => request('PATCH', `/api/users/${encodeURIComponent(id)}/role`, { role }),
  deleteUser: (id) => request('DELETE', `/api/users/${encodeURIComponent(id)}`),
};
