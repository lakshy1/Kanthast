# Kanthast

One domain, three apps that share no code or accounts:

| Path | App | Folder |
|---|---|---|
| `kanthast.in/` | Landing page | `Brand/` |
| `kanthast.in/professional` | Kanthast Professional (NEET PG, INI CET, USMLE) | `Professional/Frontend`, `Professional/Backend` |
| `kanthast.in/school` | Kanthast School (Classes VIII–X) | `School/Frontend`, `School/Backend` |

Professional and School have separate databases, user accounts, JWT secrets and admin logins.

## Run locally

Requires Node 20+.

```bash
npm run setup   # first time: installs every app
npm run dev     # starts all five
```

Then open **http://localhost:5170**. It works like the live site: `/professional` and `/school` (pages and APIs) are forwarded to the right app.

| Port | Process |
|---|---|
| 5170 | Landing page (open this) |
| 5173 | Professional frontend (`/professional/`) |
| 5174 | School frontend (`/school/`) |
| 4010 | Professional API |
| 4011 | School API |

`npm run pro` or `npm run school` starts just one app (open `http://localhost:5173/professional/` or `http://localhost:5174/school/`).

### Environment

Each backend needs its own `.env` (copy `.env.example`). Frontends need no `.env`.

If a port is already taken, `npm run dev` stops with `EADDRINUSE` or `Port … is in use`. Find the process with `lsof -i :<port>` and stop it.

## Deploy

`kanthast.in` is a single Vercel project using Services (`vercel.json` at the repo root). Every push to `master` deploys all five parts together. On Vercel, backend settings are stored as `PRO_*` and `SCHOOL_*` variables, and each backend reads only its own.
