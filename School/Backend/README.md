# Kanthast School (Classes VIII–X): backend

Standalone Express + MongoDB API. It shares no code, database, accounts or JWT secret with the other Kanthast product.

- Port: 4001 (frontend dev server on 5174)
- Run: `npm install && npm run dev`
- Env: copy `.env.example` to `.env`. Use a different `JWT_SECRET` and database from the other product.
- Base path: `/api/v1` (`auth`, `profile`, `payments`, `chat`, `contact`, `health`). Includes the AI Video Creator (`/api/v1/chat/video/*`). The School catalog itself is still served from the frontend.
