# LINEAGE Progress

Last updated: 2026-06-08

## Baseline

- Branch: `codex/deployment-readiness`, created from `main` at `6b8d047`.
- `PROGRESS.md` was missing on `main`; this file establishes the repo-local progress
  baseline after user confirmation.
- Pre-existing local homepage changes are out of scope for this branch:
  `apps/web/app/globals.css`, `apps/web/app/page.tsx`,
  `apps/web/components/axion-homepage.tsx`, and `apps/web/public/`.

## Completed

### Runway capture extension deployment

- Goal: bring the browser extension out of the old `codex/runway-capture-extension`
  branch and make it deployable from the current mainline.
- Scope: Manifest V3 Chrome extension, Runway content capture, service-worker hashing
  and event submission, popup/options UI, extension build/package scripts, deployment
  docs, and extension ignore rules.
- Acceptance: the extension builds from the monorepo, can be loaded unpacked or packaged
  as a zip, posts the existing `/events` payload shape to a configured API URL, keeps
  local defaults intact, and documents the production API URL setup.
- Result: `apps/extension` contains the extension source, `build` produces
  `apps/extension/dist`, `package` produces
  `apps/extension/lineage-capture-extension.zip`, and `DEPLOY.md` documents extension
  install/configuration steps.
- Validation: extension build, extension typecheck, extension package, manifest
  schema validation, API pytest suite, zip contents inspection, and
  `git diff --check` passed on the cleaned branch.

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

### Manifest verifier request bounds

- Goal: harden the public manifest verification path against request-boundary abuse.
- Scope: FastAPI `/manifest/verify`, Next.js `/api/verify`, and verifier endpoint
  regression tests.
- Acceptance: oversized verifier payloads are rejected before JSON verification work,
  non-object payloads cannot reach verifier logic, valid manifest verification still works,
  and the web proxy enforces the same 1 MB payload ceiling.
- Result: API and web verifier routes now stream-read request bodies with a 1 MB limit,
  require JSON objects, and return 413 for oversized verification payloads.
- Validation: API pytest, API Ruff, schema validation, web build, web typecheck after
  build-generated `.next/types`, and `git diff --check` passed.

### Project ID request boundary hardening

- Goal: prevent malformed project IDs from entering manifest generation, event ingestion,
  or web manifest download proxy paths.
- Scope: FastAPI event/list/manifest route validation, Next.js manifest JSON/PDF proxy
  validation, and focused backend regression tests.
- Acceptance: `project_id` matches the manifest schema pattern everywhere it enters API
  routes, invalid IDs are rejected before signing or persistence, web proxy routes do not
  reflect raw query values into upstream paths or download filenames, and existing checks
  stay green.
- Result: API and event schemas now share `PROJECT_ID_PATTERN`; manifest path/query
  parameters enforce it; web proxy routes reject invalid IDs, URL-encode upstream paths,
  and generate controlled download filenames.
- Validation: API pytest, API Ruff, schema validation, web build, web typecheck, and
  `git diff --check` passed.

### Signed manifest structure hardening

- Goal: prevent self-signed but schema-invalid manifests from verifying as trustworthy.
- Scope: shared API/CLI manifest verifier shape checks and regression tests for signed
  invalid manifests.
- Acceptance: cryptographically valid manifests still verify, but signed manifests with
  mutated signature metadata, missing summary fields, or empty events return
  `valid: false` instead of a success summary or server error.
- Result: the verifier now enforces required top-level, event, C2PA, and signature-block
  fields after digest/signature verification and before returning a trusted summary.
- Validation: API pytest, API Ruff, schema validation, web build, web typecheck, and
  `git diff --check` passed.

### Event ingestion schema hardening

- Goal: prevent schema-invalid event records from entering storage and later being signed
  into delivery manifests.
- Scope: FastAPI event payload models, shared verifier/schema regex constants, and event
  payload regression tests.
- Acceptance: invalid event IDs, parent event IDs, asset URIs, unsafe URI schemes, nested
  parameters, unknown payload fields, invalid reference relationships, and manifest-schema
  regex drift are rejected before persistence.
- Result: inbound event payload models now reject unknown fields, enforce key manifest
  schema patterns, allow only scalar generation parameters, require safe absolute
  asset/tool URIs, and keep verifier regexes tied to the same constants.
- Validation: API pytest, API Ruff, schema validation, web build, web typecheck after
  build completion, and `git diff --check` passed.
