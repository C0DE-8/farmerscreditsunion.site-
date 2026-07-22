# Backend

Express API for the online banking application. It provides authentication, user banking routes, admin management routes, Gmail/email helpers, Telegram notifications, MySQL persistence, and static access to uploaded files.

## Requirements

- Node.js 18 or newer
- npm
- MySQL database

## Setup

```bash
npm install
```

Create a local `.env` file in `backend/`:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=farmerscreditsunion
JWT_SECRET=change_me
OTP_SECRET=change_me
OTP_EXPIRY_MINUTES=10
FRONTEND_URL=http://localhost:5173

EMAIL_HOST=
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=
EMAIL_PASS=

GMAIL_USER=
GMAIL_APP_PASSWORD=

TELEGRAM_BOT_TOKEN=
TELEGRAM_ADMIN_CHAT_IDS=
```

Run the SQL schema and migrations against the configured database:

```bash
mysql -u root -p farmerscreditsunion < sql.sql
```

Apply any files in `migrations/` that are needed for the target environment.

## Development

```bash
npm run dev
```

The API starts on `http://localhost:5000` unless `PORT` is set.

## Production

```bash
npm install --omit=dev
npm start
```

Configure production environment variables through the hosting provider. Do not commit `.env` files, database dumps with live data, uploaded identity documents, or credentials.
