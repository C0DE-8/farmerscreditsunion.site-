# Online Bank Live DBMS

Static banking frontend with an Express API backend backed by a DBMS gateway.

## Project Layout

- `frontend/` - static HTML, CSS, JavaScript, images, auth pages, user dashboard pages, and admin pages.
- `frontend/api.js` - frontend API origin configuration.
- `frontend/js/live-chat.js` - Smartsupp live chat loader.
- `backend/` - Express API, auth routes, user routes, admin routes, mail utilities, uploads, and DBMS gateway client.
- `backend/online_bank_0_2.sql` - database schema/sample export.

## Frontend

Open the public site from `frontend/index.html`.

Important routes:

- User login: `frontend/auth/login.html`
- User dashboard: `frontend/pages/dashboard.html`
- Admin login: `frontend/admin/index.html`
- Admin dashboard: `frontend/admin/admin-dashboard.html`

The frontend API base is configured in `frontend/api.js`.

Default API origin:

```js
https://farmerscreditsunion-site-9deb.vercel.app
```

To override it before `api.js` loads:

```html
<script>
  window.APP_API_URL = "http://localhost:5000";
</script>
<script src="api.js"></script>
```

## Authentication

User and admin authentication are separate.

User auth:

- API base: `/api/auth`
- Login endpoint: `POST /api/auth/login`
- OTP endpoint: `POST /api/auth/login/verify-otp`
- Browser storage keys: `token`, `user`

Admin auth:

- API base: `/api/admin`
- Login endpoint: `POST /api/admin/login`
- OTP endpoint: `POST /api/admin/login/verify-otp`
- Browser storage keys: `adminToken`, `adminUser`

Admin accounts are blocked from the normal user login path and must sign in through `frontend/admin/index.html`.

Admin impersonation is the one intentional bridge: when an admin impersonates a user, the app stores a user session in `token` and `user`, then redirects to the user dashboard.

## Live Chat

Smartsupp live chat is loaded through:

```text
frontend/js/live-chat.js
```

Current Smartsupp key:

```text
409c3f069162620d184619c6045023c9bfa7e3c1
```

Every non-font frontend HTML page includes this script before `</body>`.

## Support Email

Current site/support email:

```text
farmerscreditunion612@gmail.com
```

This is used in visible frontend contact areas and as `EMAIL_USER` for backend mail configuration.

## Backend Setup

Install dependencies:

```sh
cd backend
npm install
```

Create/update `backend/.env`:

```env
PORT=5000
JWT_SECRET=change_me
SITE_ID=online-bank-live-dbms
API_KEY=dbms_full_key_from_gateway
DBMS_URL=http://localhost:4000
DBMS_TIMEOUT_MS=15000

EMAIL_USER=farmerscreditunion612@gmail.com
EMAIL_PASS=your_email_app_password
OTP_EXPIRY_MINUTES=10
```

Start the backend:

```sh
cd backend
npm start
```

The API runs on:

```text
http://localhost:5000
```

Health check:

```text
GET /health
```

## API Mounts

- `/api/auth` - registration, user login, password reset, user OTP verification.
- `/api/user` - authenticated user banking routes.
- `/api/admin` - admin login and protected admin management routes.
- `/uploads` - uploaded files.

Protected API requests use:

```http
Authorization: Bearer <jwt>
```

## Verification

Useful syntax checks:

```sh
node --check backend/routes/authRoutes.js
node --check backend/routes/adminRoutes.js
node --check backend/middleware/authMiddleware.js
node --check frontend/js/live-chat.js
```

There is no automated test suite configured yet.
