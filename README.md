# Tutoring Tracker

Full-stack platform for tutors to manage students, class schedules, attendance, homework, feedback and payments. Tutors and students get separate portals.

| Part | Stack | Docs |
| --- | --- | --- |
| [`backend/`](backend) | Go, Gin, GORM, PostgreSQL, Redis, RabbitMQ, MinIO, MongoDB | [backend/README.md](backend/README.md) |
| [`frontend/`](frontend) | Next.js 16, React 19, TypeScript, Tailwind CSS v4, MUI | [frontend/README.md](frontend/README.md) |

## Features

- **Roles**: tutor and student portals with role-based access.
- **Auth**: JWT login, Google sign-in, email verification, password reset.
- **Tutorials and meetings**: create tutorials, import a schedule from Excel, attach material to meetings.
- **Enrollment**: students request to enroll; tutors validate requests (pending validation).
- **Attendance and homework**: mark attendance, collect submissions, grade them.
- **Feedback**: public feedback form per tutorial, shared by code.
- **Payments**: track payments per student; sync to a personal website's income list.
- **Notifications**: in-app and email, fanned out asynchronously through RabbitMQ.
- **Bundles**: students download a tutorial's material as one zip, with a summary PDF.
- **Dashboards**: separate summaries for tutors and students.

## Architecture

```text
Next.js frontend ──HTTP/JSON──▶ Gin REST API (modular monolith)
                                  ├─ PostgreSQL   main data (GORM)
                                  ├─ Redis        cache
                                  ├─ RabbitMQ     async jobs (notifications)
                                  ├─ MinIO        file storage (presigned upload/download)
                                  └─ MongoDB      request logs and notifications
```

The backend is split into domain modules under `backend/src/modules` (tutorial, meeting, attendance, submission, feedback, payment, bundle, notification, pending_validation, and more). Each module has `entity`, `dto`, `repository`, `usecase` and `factory` layers.

## Repository layout

```text
.
├── backend/          Go REST API, Swagger docs, seeders, E2E tests
├── frontend/         Next.js app (App Router)
├── Jenkinsfile       CI/CD for the backend (Jenkins on the VPS)
└── .github/workflows CI/CD for the backend (deploy to VPS over SSH)
```

## Quick start

Prerequisites: Go 1.26+, Node.js 20.9+, pnpm, Docker.

```bash
# Backend (API on :8080)
cd backend
cp .env.example .env        # fill in secrets
docker compose up -d db mongo
# Redis, RabbitMQ and MinIO must also be reachable (see backend/README.md)
make seed-tutor             # roles + default tutor
go run main.go

# Frontend (app on :3000)
cd frontend
cp .env.example .env        # point NEXT_PUBLIC_API_URL_DEV at the API
pnpm install
pnpm dev
```

Swagger UI: `http://localhost:8080/swagger/index.html`.

## Deployment

Pushes to `main` that touch `backend/**` deploy the backend to a VPS, through GitHub Actions or the mirrored Jenkins pipeline. The backend runs in Docker Compose and joins an external `shared_net` network for Redis, RabbitMQ and MinIO. See [Jenkinsfile](Jenkinsfile) and [.github/workflows/be-main-deploy.yml](.github/workflows/be-main-deploy.yml).

## Conventions

Conventional Commits, enforced by Commitlint and Husky on the frontend. Frontend lint and format use Biome.
