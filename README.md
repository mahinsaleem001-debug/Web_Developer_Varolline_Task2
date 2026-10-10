# AccessHub: Auth Guards & Role-Based Access Control

A small full-stack web app that demonstrates **JWT authentication**, **login and signup forms**, **session persistence**, **protected routes** and **role-based access control (RBAC)**.

Built as an internship task for Varolline (Web Developer track).

## Features

- **Signup and login** with validation in the browser and again on the server
- **JWT authentication**: a signed token is stored in an `httpOnly`, `SameSite=Strict` cookie, so page scripts cannot read it
- **Session persistence**: refreshing the page or restarting the browser keeps you logged in until the session ends (2 hours by default)
- **Protected routes**: logged-out visitors are sent to the login page and returned to the page they wanted after logging in
- **Three roles** with different access:

| Page | user | manager | admin |
|------|:----:|:-------:|:-----:|
| Dashboard, My profile | yes | yes | yes |
| Reports | no | yes | yes |
| User management (change roles, delete users) | no | no | yes |

- **Server-side enforcement**: every protected API route checks the token and the role. Hiding a link is only for convenience; the server is what actually blocks access (HTTP 401 for "not logged in", 403 for "wrong role").
- Role changes and deleted accounts take effect immediately, even for people who are already logged in.
- Responsive design for desktop and mobile
- 28 automated API tests

## Tech Stack

- **Backend:** Node.js, Express, `jsonwebtoken`, `bcryptjs` (password hashing), `helmet` (security headers), `express-rate-limit`, `cookie-parser`, `dotenv`
- **Frontend:** plain HTML, CSS and JavaScript (ES modules), with a small hash-based router. No framework and no build step.
- **Storage:** a JSON file (`data/users.json`). A real project would use a database.

## Project Structure

```
auth-rbac-portal/
├── server/
│   ├── index.js            # starts the server
│   ├── app.js              # builds the Express app (also used by tests)
│   ├── config.js           # reads settings from .env
│   ├── db.js               # simple user store (JSON file)
│   ├── validators.js       # server-side input validation
│   ├── serialize.js        # what user data may be sent to the browser
│   ├── seed.js             # creates demo accounts
│   ├── middleware/auth.js  # authenticate (JWT) and authorize (roles)
│   └── routes/             # auth.js, users.js, reports.js
├── public/
│   ├── index.html
│   ├── css/style.css
│   └── js/
│       ├── access.js       # which page can who open (single source of truth)
│       ├── router.js, session.js, api.js, ui.js, validate.js
│       ├── routes.js       # page -> view function
│       ├── app.js          # starts the app and runs the route guard
│       └── pages/          # login, signup, dashboard, profile, reports, adminUsers, messages
├── tests/api.test.js
├── docs/                   # project report
├── .env.example
└── package.json
```

## Setup and Run

Requires **Node.js 18 or newer**.

```bash
# 1. Install dependencies
npm install

# 2. Create your settings file
cp .env.example .env          # on Windows PowerShell: copy .env.example .env

# 3. Put a long random secret in .env as JWT_SECRET. Generate one with:
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# 4. Create demo accounts (optional but recommended)
npm run seed

# 5. Start the app
npm start
```

Open **http://localhost:3000**.

The app also starts without a `.env` file (it uses a temporary random secret and warns you), but logins will reset every time the server restarts.

## Demo Accounts

Created by `npm run seed`. These are demo-only credentials, not real ones. On the login page, the **Admin / Manager / User** buttons log in with them in one click.

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@demo.com | Admin@1234 |
| Manager | manager@demo.com | Manager@1234 |
| User | user@demo.com | User@1234 |

You can also create your own account on the signup page. New accounts always get the `user` role.

## How to Try It

1. Log in as **User**: the navigation shows only Dashboard and My profile. Open `http://localhost:3000/#/reports` directly: you get "Access denied".
2. Log out, then open `#/reports` while logged out: you are sent to the login page. Log in as **Manager** and you land on Reports.
3. Log in as **Admin**, open User management, and change someone's role or delete a user.
4. Refresh the page at any time: you stay logged in.

## API Overview

| Method | Route | Access |
|--------|-------|--------|
| GET | `/api/auth/session` | public (returns the current user or `null`) |
| POST | `/api/auth/signup` | public |
| POST | `/api/auth/login` | public |
| POST | `/api/auth/logout` | public |
| GET | `/api/reports/summary` | manager, admin |
| GET | `/api/users` | admin |
| PATCH | `/api/users/:id/role` | admin |
| DELETE | `/api/users/:id` | admin |

## Run the Tests

```bash
npm test
```

The tests cover validation, signup and login, wrong passwords, tampered / expired / forged tokens, the `none` algorithm attack, every role against every protected route, role changes, deleting users, rate limiting and security headers.

## Security Decisions

- Passwords are hashed with bcrypt and never sent back to the browser.
- Login returns the same message for a wrong password and an unknown email, and takes similar time for both, so attackers cannot discover which emails exist.
- The JWT is kept in an `httpOnly` cookie (not `localStorage`), so an XSS bug could not steal it. `SameSite=Strict` protects against CSRF.
- The token stores only the user id. The role is read from the user store on every request.
- Signup ignores any `role` sent by the client, so nobody can make themselves an admin.
- Admins cannot change or delete their own account, so there is always at least one admin.
- The frontend builds the page with `textContent`, never `innerHTML`, so a name like `<script>` is shown as text.
- Login and signup are rate limited. `helmet` adds security headers, request bodies are limited to 10 KB.
- Secrets live in `.env`, which is ignored by Git. Only `.env.example` is committed.

## Known Limitations

- Users are stored in a JSON file, which is fine for a demo but not for many users or several server instances. Next step: PostgreSQL or MongoDB.
- No refresh tokens or "remember me": when the session ends, the user logs in again.
- No password reset, email verification or change-password page.
- Rate limiting is kept in memory, so it resets when the server restarts.
- The demo-account buttons are only shown outside production (`NODE_ENV=production` hides them).
- In production, serve the app over HTTPS and set `NODE_ENV=production` so the cookie is marked `Secure`.

## Future Improvements

- Database storage, refresh tokens and password reset by email
- Audit log of role changes
- More roles or fine-grained permissions
- Browser (end-to-end) tests in the repository

## Author

Mahin Saleem
