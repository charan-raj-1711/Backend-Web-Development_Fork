# LU48 — Cookies, Sessions and Authentication

## Setup

```bash
cp .env.example .env
npm install
npm run setup
npm run dev
```

On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp` if needed.

Set `COOKIE_SECRET` in `.env` to a random value of at least 32 characters. Keep `COOKIE_SECURE=false` for local HTTP; production must use HTTPS with `COOKIE_SECURE=true`.

Seeded demo account: `sam@example.com` / `SessionDemo!48`.

## Endpoints

- `POST /auth/login` — checks credentials and sets the signed, HTTP-only `sid` cookie.
- `GET /auth/me` — checks the signed cookie and the matching unexpired server-side session.
- `POST /auth/logout` — deletes the session and clears the cookie; returns `204 No Content`.

Example request body (JSON):

```json
{ "email": "sam@example.com", "password": "SessionDemo!48" }
```

## Verify with curl

Login and save the cookie:

```bash
curl -i -c cookies.txt -H "Content-Type: application/json" -d "{\"email\":\"sam@example.com\",\"password\":\"SessionDemo!48\"}" http://localhost:3000/auth/login
```

Use the saved cookie to check the current user:

```bash
curl -i -b cookies.txt http://localhost:3000/auth/me
```

Logout, preserving the cookie jar for the request:

```bash
curl -i -b cookies.txt -c cookies.txt -X POST http://localhost:3000/auth/logout
```

After logout, `GET /auth/me` should return `401 Unauthorized`. A login attempt with an unknown email or incorrect password should also return `401` with the same generic credentials message. Calling logout repeatedly should still return `204`.

## Implementation notes

The in-memory session Map is intended for this single-process learning assignment. It loses sessions when the server restarts and is not suitable for a multi-instance production deployment; use a shared store such as Redis for production. The database is accessed through `src/repositories/userRepository.js`, and only safe user fields are returned by the API.
