# QR Tracker

Create QR codes and track how often they're scanned.

Each QR code encodes a short tracking link (`https://<site>/r/<id>`) rather than your destination.
When someone scans it, [api.etiennethompson.com](https://github.com/EtienneThompson/api.etiennethompson.com)
records the visit (timestamp, user agent, referrer) in its Postgres database, then sends a `302` redirect
to the destination. Because the destination is stored server-side, you can change it later without reprinting.

Sign-in goes through [login.etiennethompson.com](https://github.com/EtienneThompson/login.etiennethompson.com),
like the other apps in the ecosystem. Only users added to the **QR Tracker** application in the
admin portal can use the web app. The scan links stay public.

```
QR scan ──▶ https://<site>/r/{id} ──(.htaccess)──▶ GET /qr/r/{id} (API) ──▶ record visit ──▶ 302 to target URL
Web app ──▶ /qr/codes…  (API) ──▶ Postgres
```

## Layout

| Path | What |
|---|---|
| `web/` | Vite + React + TypeScript single-page app. |
| `web/src/auth.ts` | Sign-in through login.etiennethompson.com. Stores the returned client id. |
| `web/src/api.ts` | Calls the QR Tracker routes on api.etiennethompson.com. |
| `web/src/aggregate.ts` | Groups visit timestamps into minute/hour/day/week/month buckets (in the viewer's time zone). |
| `scripts/deploy-web.sh` | Builds the web app and uploads it over SSH (e.g. DreamHost). |

The backend lives in the api.etiennethompson.com repo: `src/routes/QrTrackerHandler.ts` and
`migrations/002_qr_tracker.sql`.

### Data model (Postgres)

- **qr_codes**: `codeid` (the short id in the link), `name`, `target_url`, `created_at`, `visit_count`, `last_visit_at`.
- **qr_visits**: `codeid`, `visited_at`, `user_agent`, `referer`. Indexed on `(codeid, visited_at)`.
  Deleting a code deletes its visits.

### API

Routes on api.etiennethompson.com. Like every route there, they need `clientid` (from the login service) and
`appid` (QR Tracker's application id): in the query string for `GET`, in the JSON body otherwise. The user must
be a user or admin of QR Tracker, and the `appid` must be QR Tracker's. Missing or expired sessions get `401`,
and users without access get `403`.

| Method | Route | |
|---|---|---|
| `GET` | `/qr/r/{id}` | Record a scan and redirect (this is what the QR code points at). **Public.** |
| `GET` | `/qr/codes` | List codes with totals |
| `POST` | `/qr/codes` | Create `{ targetUrl, name? }` |
| `GET` / `PATCH` / `DELETE` | `/qr/codes/{id}` | Read, update `{ name?, targetUrl? }`, delete (also deletes its visits) |
| `GET` | `/qr/codes/{id}/visits?from=ISO&to=ISO` | Raw visits in a time range |

## Set up (once)

1. **Register the app.** In the admin portal (admin.etiennethompson.com), add an application named
   **QR Tracker** with redirect URL `https://qr.etiennethompson.com/` (your site's address, with the trailing `/`
   and no `#`). Note its application id. Then give yourself, and anyone else who should have access,
   an application-user entry for it with *isuser* (or *isadmin*) checked.
2. **Create the tables.** In api.etiennethompson.com: `APP_ENV=production yarn run migrate 002_qr_tracker.sql`.
3. **Configure the API** (Vercel environment variables, then redeploy):
   - `QR_APPLICATION_ID`: the application id from step 1. Without it, every `/qr/codes` call is refused.
   - `QR_PUBLIC_BASE_URL`: the site that forwards scan links, e.g. `https://qr.etiennethompson.com`.
     See [QR links on your own domain](#qr-links-on-your-own-domain).
4. **Allow the site to call the API.** The site's origin must be in `corsOptions` in the API's `src/index.ts`.
   `https://qr.etiennethompson.com` and `http://localhost:5173` are already there.

## Run locally

Prerequisites: Node 20+, and api.etiennethompson.com running locally (`yarn dev`, port 4000).

```sh
cd web
cp .env.example .env.local     # then set VITE_APPLICATION_ID
npm install && npm run dev     # http://localhost:5173
```

The Vite dev server proxies `/qr/` to `localhost:4000`, so no CORS setup is needed.

The login service sends you back to the application's registered redirect URL that contains `redirectBase`
(the page's host, e.g. `localhost:5173`), and falls back to the first one. The admin portal only stores one URL
per application, so to sign in locally add a second row for the same application id:

```sql
INSERT INTO applications (applicationid, applicationname, redirecturl)
VALUES ('<qr tracker app id>', 'QR Tracker (local)', 'http://localhost:5173/');
```

> QR codes created locally point at `http://localhost:4000/qr/r/…`, so a phone can't open them.

## Deploy

### Backend

Deploy api.etiennethompson.com as usual (`yarn run deploy`). There's nothing to deploy from this repo.

### Website

`scripts/deploy-web.sh` builds `web/` and uploads it over SSH. It's written with DreamHost in mind, but works
with any host that has SSH and rsync.

One-time SSH key setup (DreamHost):

1. In the DreamHost panel (*Websites → SFTP Users & Files*), make sure the site's user has SSH access, and
   note the server name (e.g. `pdx1-shared-a1-01.dreamhost.com`).
2. If you don't have a key yet, create one: `ssh-keygen -t ed25519`
3. Copy it to DreamHost (this asks for the user's password once): `ssh-copy-id myuser@<server>`
4. Check it works without a password: `ssh myuser@<server>`

Then deploy:

```sh
# First run (settings are remembered in .deploy-web.local)
scripts/deploy-web.sh --site-url https://qr.etiennethompson.com --ssh myuser@<server> --app-id <qr tracker app id>

# Later runs
scripts/deploy-web.sh
```

The API defaults to `https://project-hfhq4.vercel.app`; pass `--api-url` to change it. By default it uploads into
`~/<domain>`, which is where DreamHost serves each domain from. Pass `--path` for another folder. The script:

- checks that SSH key login works and the folder exists before building
- uploads `qr-assets/` (removing old files only in that folder) and then `index.html`. Nothing else in the
  folder is touched, but an existing `index.html` and `.htaccess` are replaced

### QR links on your own domain

QR codes encode `QR_PUBLIC_BASE_URL`, or the API's own address (`https://<api>/qr/r/<id>`) if it's not set.
Set it **before** printing codes, because changing it later breaks codes you've already printed.

Production builds include a generated `.htaccess` (from `VITE_API_BASE_URL`) that redirects
`https://<site>/r/<id>` to the API's `/qr/r/<id>`. Apache hosts such as DreamHost pick it up automatically.
It's a hidden file: in Finder press Cmd-Shift-. to see it when uploading by hand. If the site folder already
has an `.htaccess`, merge the rules instead of replacing it. Once `https://<site>/r/<some-id>` redirects,
set `QR_PUBLIC_BASE_URL=https://<site>` on the API.

### Settings

| Setting | Where | Purpose |
|---|---|---|
| `QR_APPLICATION_ID` | API | QR Tracker's application id. Only requests for this app can manage codes. |
| `QR_PUBLIC_BASE_URL` | API | Base URL encoded in QR codes (`<base>/r/<id>`). Defaults to `<api>/qr`. |
| `VITE_APPLICATION_ID` | Web build | Same application id, sent to the login service and the API |
| `VITE_API_BASE_URL` | Web build | Where the web app sends API calls. Empty in dev. |
| `VITE_LOGIN_ENDPOINT` | Web build | Optional. Defaults to `https://login.etiennethompson.com` |
| `VITE_LOGIN_REDIRECT` | Web build | Optional. Picks which registered redirect URL to return to. Defaults to the site's host. |

## Things to know

- Everyone with access sees and manages the same set of codes. There's no per-user ownership.
- Sessions come from the login service and last about 8 hours. When one expires, the app asks you to sign in again.
- Redirects are sent with `Cache-Control: no-store` so repeat scans from the same phone are still counted.
- Scan counts include bots and link previewers (e.g. chat apps unfurling the link). The user agent is
  stored with each visit if you want to filter them.
- The web app downloads raw visits for the selected range and aggregates them in the browser. Vercel limits
  responses to about 4.5 MB, roughly 20,000 visits per range. Beyond that, add pre-aggregated hourly counts.
