# Publishing protected lectures (Professional)

One-time setup
1. `cd Professional/Backend/scripts/video && npm install` (installs ffmpeg for encoding; not part of the deployed backend).
2. In `Professional/Backend/.env` set `MONGODB_URL` (the production database), `VIDEO_KEY_SECRET` (32+ random characters,
   made with `openssl rand -hex 32`; never change it after publishing, every lecture key is derived from it, and it must
   differ from School's), and the four `R2_*` values for a private bucket.
3. In the Cloudflare R2 bucket add a CORS rule: allowed origin `https://kanthast.in`, method `GET`.
4. On Vercel set the same values with the `PRO_` prefix (`PRO_VIDEO_KEY_SECRET`, `PRO_R2_ACCOUNT_ID`, `PRO_R2_BUCKET`,
   `PRO_R2_ACCESS_KEY_ID`, `PRO_R2_SECRET_ACCESS_KEY`). Do not set `ALLOW_EXTERNAL_VIDEO_LINKS`.

Publish a lecture
- `node scripts/video/list.mjs` prints every lecture id.
- `node scripts/video/publish.mjs <lectureId> "<video file>"`, or `--map lectures.json` for many.
- `HIDE=1` uploads without making it live. Hide or show later: `PATCH /api/v1/admin/playback/lectures/<id>` with `{"status":"hidden"|"live"}` (admin token).

Go live
- Lectures stay "coming soon" until `PRO_LECTURES_LIVE=true` on Vercel. Flip it only after a test lecture plays end to end.
