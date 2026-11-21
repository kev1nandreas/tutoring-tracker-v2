# Tutoring Tracker — Frontend

Next.js app for the [Tutoring Tracker](../README.md) platform. It has a tutor portal and a student portal, backed by the [Go API](../backend/README.md).

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss&logoColor=white)
![MUI](https://img.shields.io/badge/MUI-9-007fff?logo=mui&logoColor=white)

## Tech stack

| Area | Tools |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, MUI 9 + Emotion, `clsx` + `tailwind-merge` |
| Auth | NextAuth (Google sign-in), JWT stored in a cookie |
| Forms | React Hook Form, Zod, `react-dropzone` |
| Data | Axios, TanStack Query, TanStack Table, `nuqs` (URL state) |
| State | Zustand + Immer |
| UX | `react-hot-toast`, GSAP, Lucide icons, Lightbox |
| Tooling | Biome, Husky, lint-staged, Commitlint |

## Pages

| Area | Routes |
| --- | --- |
| Auth | `/login`, `/register`, `/login/google`, `/register/google`, `/verify-email`, `/forgot-password`, `/reset-password`, `/complete-profile` |
| Student `(student)` | `/` dashboard, `/tutorials`, `/tutorials/[id]`, `/enroll`, `/notifications`, `/settings` |
| Tutor `/tutor` | dashboard, `/tutor/tutorials`, `/tutor/tutorials/[id]`, meeting `attendance` and `homework`, tutorial `feedback`, `/tutor/students`, `/tutor/payments`, `/tutor/pending-validation`, `/tutor/notifications`, `/tutor/settings` |
| Public | `/form/feedback/[code]` feedback form |
| Dev | `/sandbox` component demos |

## Quick start

Prerequisites: Node.js 20.9+, [pnpm](https://pnpm.io/), and a running [backend](../backend/README.md).

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_RUN_MODE` | `development` or `production` |
| `NEXT_PUBLIC_API_URL_DEV` | Backend API base URL in development, for example `http://localhost:8080/api/v1` |
| `NEXT_PUBLIC_API_URL_PROD` | Backend API base URL in production |
| `NEXT_PUBLIC_TOKEN_KEY` | Cookie name for the access token |
| `SITE_URL` | Public site URL, used by `next-sitemap` |
| `NEXT_PUBLIC_MEASUREMENT_ID` | Google Analytics measurement ID |
| `NEXTAUTH_URL` | App URL for NextAuth |
| `NEXTAUTH_SECRET` | NextAuth secret |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID (same one the backend checks) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |

## Project structure

```text
src/
├── app/
│   ├── (auth)/          login, register, verify and reset flows
│   ├── (student)/       student portal
│   ├── tutor/           tutor portal
│   ├── form/            public feedback form
│   ├── sandbox/         component demos
│   └── providers.tsx    MUI theme, React Query, toaster
├── components/          button, form, table, dialog, links, hoc
├── configs/             environment config
├── context/             sidebar context
├── hooks/               shared hooks
├── layouts/             sidebar, header, dashboard layout
├── lib/                 helpers, cookies, MUI theme
├── services/api/        axios client, endpoints, interceptors
├── shared/              route paths and constants
├── types/               shared TypeScript types
└── proxy.ts             route guard
```

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build, then generate the sitemap |
| `pnpm start` | Serve the production build |
| `pnpm typecheck` | Run `tsc --noEmit` |
| `pnpm check` / `check:write` | Biome lint + format check (and fix) |
| `pnpm lint` / `lint:write` | Biome lint only (and fix) |
| `pnpm format` / `format:write` | Biome format only (and fix) |

## Docker

```bash
docker compose up --build
```

`NEXT_PUBLIC_*` values are passed as build args (see `docker-compose.yml`). The app listens on port 3000.

## Contributing

Commits follow [Conventional Commits](https://www.conventionalcommits.org/), checked by Commitlint. Husky runs lint-staged before each commit.

```text
feat: add payment filters
fix: correct sidebar active state
docs: update readme
```
