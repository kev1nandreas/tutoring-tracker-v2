<div align="center">

# Next Dashboard Starter

**A ready-to-ship admin dashboard template.**
Next.js 16 · React 19 · Tailwind CSS v4 · MUI · TypeScript

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss&logoColor=white)
![MUI](https://img.shields.io/badge/MUI-9-007fff?logo=mui&logoColor=white)

[Quick start](#quick-start) · [Structure](#project-structure) · [Environment](#environment-variables) · [Scripts](#scripts) · [Cleanup](#cleanup-script) · [Contributing](#contributing)

</div>

---

## Overview

Opinionated starter for dashboards and internal tools. You get a responsive sidebar layout, themed MUI form components, a typed API layer, and a strict lint/commit workflow, so you can start on features instead of boilerplate.

> **Auth is currently disabled.** `/dashboard` opens directly. The `withAuth` HOC is no longer applied to the dashboard layout and the logic in `src/proxy.ts` is commented out (only a no-op pass-through remains, since Next.js requires the file to export a function; Next 16 renamed `middleware` to `proxy`). To re-enable guarding, wrap the layout with `withAuth` again and restore the original proxy.

## Tech Stack

| Area | Tools |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack), React 19, TypeScript |
| Styling | Tailwind CSS v4, MUI 9 + Emotion, `clsx` + `tailwind-merge` |
| Forms | React Hook Form, Zod, `@hookform/resolvers`, `react-dropzone` |
| Data | Axios, TanStack Query, TanStack Table, `nuqs` (URL state) |
| State | Zustand + Immer, `auto-zustand-selectors-hook` |
| UX | `react-hot-toast`, GSAP animations, Lucide icons, Lightbox |
| Tooling | Biome (lint + format), Husky, lint-staged, Commitlint |
| SEO | `next-sitemap` (generated after build) |

## Features

- **Dashboard shell**: collapsible sidebar, header, breadcrumbs, and a `PageTemplate` for consistent pages.
- **Themed MUI components**: `Button`, `IconButton`, `Input`, `SelectInput`, `TextArea`, `UploadFile`, `ConfirmationDialog`, styled to the Tailwind brand palette.
- **Data table**: sortable, paginated, filterable table built on TanStack Table.
- **Typed API layer**: Axios client with interceptors (token refresh and retry), plus helpers in `src/services/api`.
- **Auth pieces (optional)**: login, forgot/reset password flows, `useAuthStore`, `withAuth` HOC, idle timeout.
- **Sandbox pages**: `/sandbox` demos for buttons, forms, tables, and fetching.
- **Path alias**: import anything from `src` with `@/`.
- **Quality gates**: Biome, Husky pre-commit, and Conventional Commits enforced.

## Quick Start

**Prerequisites:** Node.js 20.9+ and [pnpm](https://pnpm.io/).

```bash
# 1. Create your repo from the template (or clone it)
git clone https://github.com/kev1nandreas/next-dashboard-starter my-app
cd my-app

# 2. Install dependencies
pnpm install

# 3. Configure environment
cp .env.example .env

# 4. Start the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Go straight to `/dashboard`, or browse `/sandbox` for component demos.

### Make it yours

- Search the codebase for `!CHANGETHIS` comments and follow each instruction.
- Rename the package in `package.json`.
- Replace favicons and assets in `public/` and `src/app/favicon.ico`.
- Add sidebar entries in `NAV_ITEMS` inside `src/layouts/AppSidebar.tsx`.

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # login, forgot-password, reset-password
│   ├── (dashboard)/     # dashboard layout + pages
│   ├── sandbox/         # component demos
│   ├── stores/          # Zustand stores
│   └── providers.tsx    # MUI theme, React Query, toaster
├── components/          # button, form, table, dialog, links, hoc
├── configs/             # environment config
├── context/             # sidebar context
├── hooks/               # shared hooks
├── layouts/             # sidebar, header, dashboard layout
├── lib/                 # helpers, cookies, MUI theme, clsxm
├── services/api/        # axios client, endpoints, interceptor
├── shared/              # constants such as route paths
├── types/               # shared TypeScript types
└── proxy.ts             # route guard (currently disabled)
```

## Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_RUN_MODE` | `development` or `production` |
| `NEXT_PUBLIC_API_URL_DEV` | API base URL in development |
| `NEXT_PUBLIC_API_URL_PROD` | API base URL in production |
| `NEXT_PUBLIC_TOKEN_KEY` | Cookie name used to store the access token |
| `SITE_URL` | Public site URL, used by `next-sitemap` |
| `NEXT_PUBLIC_MEASUREMENT_ID` | Google Analytics measurement ID |

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

A single multi-stage `Dockerfile` (plus `docker-compose.yml`) is included. Build-time `NEXT_PUBLIC_*` values are passed as build args; the port defaults to 3000 and can be changed with `--build-arg PORT=8080`.

```bash
docker compose up --build
# or
docker build -t my-app --build-arg NEXT_PUBLIC_API_URL_PROD=https://api.example.com .
```

## Cleanup Script

Don't need a module? Strip its files, dependencies, and provider wiring:

```bash
chmod +x cleanup.sh   # only if not yet executable
./cleanup.sh <component_name>
```

| Component | Removes |
| --- | --- |
| `api` | Axios, TanStack Query, Zustand, react-hot-toast, and the auth hooks/stores |
| `table` | Table component, TanStack Table, `nuqs` |
| `form` | Input, SelectInput, TextArea, UploadFile, React Hook Form, Zod, resolvers, react-dropzone, lightbox |
| `button` | Button, IconButton, ButtonLink, IconLink |
| `dialog` | ConfirmationDialog |

> `@mui/material`, Emotion, and the `ThemeProvider` in `src/app/providers.tsx` are shared by `button`, `form`, and `dialog`. Remove them only if you delete all three.

## Contributing

Commits follow [Conventional Commits](https://www.conventionalcommits.org/) and are checked by Commitlint on commit.

```
feat: add user table filters
fix: correct sidebar active state
docs: update readme
```

Husky runs lint-staged before each commit, so staged files are checked and formatted automatically.
