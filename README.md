# APLUSTECH backend

A real backend for the A+ Tech Services site: a small Express API backed by
Postgres, replacing the previous setup where the browser talked to Supabase
directly with a public anon key.

- `POST /api/leads` — public endpoint the contact form submits to.
- `POST /api/admin/login` — admin signs in, gets an httpOnly session cookie.
- `POST /api/admin/logout`
- `GET  /api/admin/me` — check if the current session is valid.
- `GET  /api/admin/leads` — protected, list all leads.
- `PATCH /api/admin/leads/:id` — protected, update a lead's status.
- `GET  /api/health` — uptime check.

## 1. Local setup

```bash
npm install
cp .env.example .env
# edit .env: set DATABASE_URL to a Postgres instance you can reach
npm run migrate          # creates the leads + admin_users tables
npm run create-admin     # creates the admin login from ADMIN_EMAIL / ADMIN_PASSWORD in .env
npm start
```

The API listens on `http://localhost:4000` (or `PORT` from `.env`).

## 2. Deploy on Render

**Option A — one-click via the blueprint**
1. Push this folder to a GitHub repo (or add it to your existing APLUSTECH repo).
2. In Render: **New > Blueprint**, point it at the repo. Render reads
   `render.yaml` and creates both the web service and a free Postgres
   database automatically, and wires `DATABASE_URL` between them.
3. Render will prompt you for `FRONTEND_ORIGIN` (the only var marked
   `sync: false`) — enter your site's URL, e.g. `https://aplustech.com`.
   You can add more than one, comma-separated.
4. Once it's deployed, open the **Shell** tab on the web service and run:
   ```bash
   npm run migrate
   ADMIN_EMAIL=you@aplustech.com ADMIN_PASSWORD=aStrongPassword npm run create-admin
   ```

**Option B — manual setup**
1. **New > PostgreSQL** — create a free database, copy its *Internal Database URL*.
2. **New > Web Service** — connect the repo, root directory = this folder
   (or repo root if you keep it at the top level).
   - Build command: `npm install`
   - Start command: `npm start`
3. Add environment variables on the web service:
   - `DATABASE_URL` = the Internal Database URL from step 1
   - `DB_SSL` = `true`
   - `JWT_SECRET` = a long random string (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`)
   - `FRONTEND_ORIGIN` = your site's URL
   - `NODE_ENV` = `production`
4. Deploy, then open the **Shell** tab and run the same `migrate` /
   `create-admin` commands as above.

## 3. Point the frontend at it

In `index.html`, replace the Supabase insert in the contact form handler with
a call to your new API, and do the same for `admin.html`'s login/dashboard.
See `frontend-changes.md` in this bundle for the exact code to paste in,
including the deployed API's base URL as a variable to fill in.

Once that's live you can remove the Supabase `<script>` tags and the
`SUPABASE_URL` / `SUPABASE_ANON_KEY` constants from both HTML files — they're
no longer used.

## Notes

- Admin sessions use an httpOnly, `SameSite=None; Secure` cookie, so the
  dashboard and API must both be served over HTTPS (Render gives you this by
  default) — cookies won't be set over plain `http://`.
- The `/api/leads` endpoint is rate-limited (10 requests / 15 min per IP) to
  stop the public form being used to spam the database.
- `admin_users` supports more than one admin — just run `create-admin` again
  with a different `ADMIN_EMAIL`.
