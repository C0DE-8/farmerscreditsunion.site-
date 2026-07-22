# Farmers Credit Union Site

Full-stack online banking application with an Express/MySQL backend and a React/Vite frontend.

## Project Structure

- `backend/` - Express API, MySQL connection, authentication, admin routes, user routes, mailers, Telegram notifications, SQL migrations, and upload handling.
- `frontend/` - React dashboard and public site built with Vite.

## Backend

```bash
cd backend
npm install
npm run dev
```

See [backend/README.md](backend/README.md) for required environment variables and database setup notes.

## Frontend

```bash
cd frontend
npm install
npm run dev
```

See [frontend/README.md](frontend/README.md) for frontend scripts and build notes.

## Deployment Notes

- Keep `.env` files and credentials out of git.
- Run backend migrations in `backend/migrations/` against the target MySQL database before using new features.
- Build the frontend with `npm run build` from `frontend/`.
