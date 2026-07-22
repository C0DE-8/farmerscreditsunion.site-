# Frontend

React/Vite frontend for the online banking application. It includes the public marketing pages, customer dashboard, admin dashboard, authentication screens, and reusable UI components.

## Requirements

- Node.js 18 or newer
- npm

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

Vite serves the app at `http://localhost:5173` by default.

## Scripts

- `npm run dev` - start the Vite development server.
- `npm run build` - create a production build in `dist/`.
- `npm run preview` - preview the production build locally.
- `npm run lint` - run ESLint.

## API Configuration

The API base URL is configured in `src/api/axios.js`. Update `API_BASE_URL` and `API_ORIGIN` there when switching backend environments.

## Build

```bash
npm run build
```

Deploy the generated `dist/` directory to the frontend host.
