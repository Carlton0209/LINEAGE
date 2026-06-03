# LINEAGE Progress

Last updated: 2026-06-03

## Baseline

- Branch: `codex/deployment-readiness`, created from `main` at `6b8d047`.
- `PROGRESS.md` was missing on `main`; this file establishes the repo-local progress
  baseline after user confirmation.
- Pre-existing local homepage changes are out of scope for this branch:
  `apps/web/app/globals.css`, `apps/web/app/page.tsx`,
  `apps/web/components/axion-homepage.tsx`, and `apps/web/public/`.

## Completed

### Deployment readiness

- Goal: make the FastAPI API and Postgres deployable on Railway while allowing the
  Vercel-hosted Next.js frontend to reach the deployed API.
- Scope: environment-driven API URL, database URL, CORS origins, production signing-key
  requirements, API Docker image startup, Railway config, and deployment docs.
- Acceptance: local fallbacks preserve current development behavior, the API image runs
  migrations before serving, no secrets are committed, and existing backend/frontend checks
  stay green.
- Out of scope: product features, ORM/framework changes, homepage edits, and extension
  feature work.
- Result: API env plumbing, CORS, production signing-key fail-fast behavior, Dockerfile,
  Railway config, web API env plumbing, env examples, and `DEPLOY.md` are in place.
- Validation: API Ruff, API pytest, Alembic SQL render, schema validation, web build,
  web typecheck after build, web hardcoded-localhost grep, and `git diff --check` passed.
- Gap: local Docker image build was not run because this machine does not have `docker`,
  `podman`, `nerdctl`, or `colima` on `PATH`.
