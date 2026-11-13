# Kanthast Professional (NEET PG, INI CET, USMLE): backend

Standalone Express + MongoDB API. It shares no code, database, accounts or JWT secret with the other Kanthast product.

- Port: 4000 (frontend dev server on 5173)
- Run: `npm install && npm run dev`
- Env: copy `.env.example` to `.env`. Use a different `JWT_SECRET` and database from the other product.
- Base path: `/api/v1` (`auth`, `profile`, `payments`, `chat`, `contact`, `health`). Content: `/api/v1/medicine-usmle` (subject → chapter → lecture).
