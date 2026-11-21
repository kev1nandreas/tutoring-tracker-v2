# Tutoring Tracker — Backend

Go REST API for the [Tutoring Tracker](../README.md) platform. Modular monolith on **Gin** and **GORM**.

## Stack

- Go 1.26, Gin, GORM, PostgreSQL
- Redis (cache), RabbitMQ (async jobs), MinIO (object storage), MongoDB (logs and notifications)
- JWT auth, Google sign-in, SMTP email
- Swagger (swaggo), zap logging, rate limiting, XSS and secure-header middleware
- Docker, Docker Compose, Air hot reload

## Project structure

```text
.
├── main.go
├── config/                  env helpers
├── src
│   ├── factory/             DB, cache, Mongo, RabbitMQ, MinIO, middleware
│   ├── handler/             router.go and HTTP handlers
│   ├── modules/             one folder per domain, each with
│   │   │                    entity / dto / repository / usecase / factory
│   │   ├── user, role, student
│   │   ├── tutorial, meeting, attachment
│   │   ├── attendance, submission, feedback
│   │   ├── pending_validation   enrollment requests
│   │   ├── payment, dashboard
│   │   └── notification, job, bundle
│   └── shared/
│       ├── auth, googleauth     JWT, password hashing, Google ID token check
│       ├── cache, objstore      Redis and MinIO helpers
│       ├── notifier             queue publisher and worker for notifications
│       ├── mailer               SMTP email
│       ├── scheduleimport       Excel schedule import and template
│       ├── incomesync           payment sync to personal website API
│       ├── pdfdoc               PDF writer (bundle summary)
│       └── pagination, response, datetime
├── scripts/seeders/         seeders (roles, tutor, fake data)
├── docs/                    generated Swagger docs
├── tests/e2e.py             Python E2E tests
├── Dockerfile
├── docker-compose.yml
└── Makefile
```

## Getting started

Prerequisites: Go 1.26+, Docker.

```bash
cp .env.example .env
```

Fill in the secrets (see [Environment variables](#environment-variables)).

`docker-compose.yml` runs the API, PostgreSQL and MongoDB. Redis, RabbitMQ and MinIO are **not** in the compose file. Point the `REDIS_*`, `RABBITMQ_*` and `MINIO_*` variables at running instances. In production the API joins the external `shared_net` Docker network, so create it first (`docker network create shared_net`).

```bash
# Docker
make up

# Local development
docker compose up -d db mongo
make seed-tutor        # roles and default tutor
go run main.go         # or: air
```

## Environment variables

Copy [.env.example](.env.example). Main groups:

| Group | Variables |
| --- | --- |
| App | `APP_NAME`, `APP_PORT`, `APP_DEBUG`, `APP_URL_PROD`, `APP_MIGRATIONS`, `APP_MONGO_LOGGING`, `FRONTEND_URL` |
| PostgreSQL | `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` |
| Redis | `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_DB` |
| RabbitMQ | `RABBITMQ_HOST`, `RABBITMQ_PORT`, `RABBITMQ_USER`, `RABBITMQ_PASSWORD`, `RABBITMQ_VHOST`, `RABBITMQ_USE_SSL` |
| MinIO | `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`, `MINIO_USE_SSL`, `MINIO_PUBLIC_ENDPOINT`, `MINIO_PUBLIC_USE_SSL`, `STORAGE_UPLOAD_URL_EXPIRY_MINUTES`, `STORAGE_DOWNLOAD_URL_EXPIRY_MINUTES` |
| MongoDB | `MONGO_HOST`, `MONGO_PORT`, `MONGO_DATABASE`, `MONGO_COLLECTION`, `MONGO_NOTIFICATION_COLLECTION` |
| Security | `JWT_SECRET_KEY`, `API_SECRET_KEY`, `GOOGLE_CLIENT_ID` |
| Email | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM`, `SMTP_FROM_NAME` |
| Seeding | `SEED_TUTOR_USERNAME`, `SEED_TUTOR_PASSWORD`, `SEED_TUTOR_NAME`, `SEED_TUTOR_EMAIL` |
| Integration | `PERSONAL_WEBSITE_URL`, `PERSONAL_WEBSITE_API_KEY` |

Generate a random secret with `go run scripts/generate_key.go`.

## Makefile

| Command | Description |
| --- | --- |
| `make setup` | Install swag and generate Swagger docs |
| `make build` | Build the app |
| `make run-local` | Start infra containers and run the app |
| `make up` / `make down` / `make restart` | Manage Docker Compose |
| `make build-docker` | Build the Docker image without cache |
| `make test` | Run tests with race detector and coverage |
| `make seed` | Seed roles, tutor and fake data |
| `make seed-tutor` | Seed roles and the default tutor only |
| `make seed-clear` | Remove seeded data |

Migrations run on startup when `APP_MIGRATIONS=true` (GORM `AutoMigrate`, see `src/factory/db.go`).

## API

Base path `/api/v1`. Full reference in Swagger: `http://localhost:8080/swagger/index.html`. Regenerate with `make setup`.

| Area | Endpoints |
| --- | --- |
| Health | `GET /` |
| Auth (public, rate limited) | `POST /login`, `/login/google`, `/register`, `/register/google`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/verify-email` |
| Me | `GET /me`, `PUT /me/profile`, `POST /me/email/verification`, `PUT /me/email-notifications` |
| Public feedback | `GET`/`POST /public/feedback/:code` |
| Tutorials | `/tutorials`, `/tutorials/:id`, `/me/tutorials`, `/tutorials/:id/meetings/import`, `/schedule-import/template` |
| Enrollment | `/pending-validations` (list, count, mine, enroll, validate), `DELETE /tutorials/:id/students/:userId` |
| Meetings | `/meetings`, `/meetings/:id`, `/tutorials/:id/meetings` |
| Attachments | `/meetings/:id/attachments` (list, `upload-url`, `complete`), `/attachments/:id/download` |
| Attendance | `/meetings/:id/attendance`, `/meetings/:id/attendance/me`, `/meetings/:id/attendance/upload-url` |
| Homework | `/meetings/:id/submissions`, `PUT /submissions/:id/grade` |
| Feedback | `GET /tutorials/:id/feedback`, `GET /me/tutorials/:id/feedback-status` |
| Bundles | `POST /me/tutorials/:id/bundle`, `GET /me/bundles/:id`, `GET /bundles/:id/download` |
| Payments | `/payments`, `/payments/:id` |
| Notifications | `/users/:id/notifications`, `/notifications/:id`, `PATCH /notifications/:id/read` |
| Dashboard | `GET /dashboard/tutor`, `GET /dashboard/student` |
| Users, roles, students, jobs | `/users`, `/roles`, `/students`, `/jobs` |

Everything except the public routes needs a JWT (`Authorization: Bearer <token>`).

## Background work

- **Notifications**: a handler publishes one small job to RabbitMQ; a worker fans it out to students (in-app and email).
- **Bundles**: a student requests a download (`POST /me/tutorials/:id/bundle`), checks `GET /me/bundles/:id`, then downloads a zip of the tutorial's material plus a summary PDF. The zip is streamed, never stored.
- **Income sync**: payment changes are pushed to the personal website API.

## Testing

```bash
make test                          # Go unit tests
pip install -r tests/requirements.txt
pytest tests/e2e.py                # E2E tests against a running API
```

## Deployment

`.github/workflows/be-main-deploy.yml` and the root `Jenkinsfile` both deploy `main` to a VPS with Docker Compose. See the [root README](../README.md#deployment).
