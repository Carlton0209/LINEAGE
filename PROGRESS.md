# LINEAGE Progress

Last updated: 2026-06-20

## Baseline

- Current branch: `codex/unified-verification-workspace` from `main` at
  `d3c9f7d`, tracking not yet set.
- Pre-existing untracked `outputs/` content is outside the security pass and remains
  untouched.
- This file originated on `codex/deployment-readiness` and now tracks completed work
  carried into the mainline.

## Completed

### Unified verification workspace

- Goal: merge the separate Ledger, Verify, and Inspect surfaces into one
  project-centric `/verify` workspace without changing backend endpoint contracts or
  the six-stage `VerificationReport` shape.
- Scope: Next.js `/verify` workspace, reusable verification report rendering,
  reusable records table and filters, local file-hash matching section, client-side
  event proxy, old-route redirects, simplified navigation, and production demo data
  availability.
- Acceptance: `/verify` supports State A project/manifest loading and State B
  internal/external delivery views; `/verify?project=prj_demo_feature` loads a
  signed manifest, staged report, ledger records, files section, and manifest
  JSON/PDF export; `/ledger?project_id=...` redirects to `/verify?project=...`;
  `/inspect` redirects to `/verify?mode=files`; delivered file bytes stay local and
  only SHA-256 fingerprints are sent to lookup/verifier routes.
- Result: `/verify` is now the unified verification workspace. The old Ledger table
  and Inspect hashing behavior are recomposed into supporting Records and Files
  sections, while the six-stage report remains the visual spine. Header navigation is
  reduced to Home and Verify. Production demo data was seeded through the existing
  `/events` endpoint so the live project picker and `prj_demo_feature` deep link load
  real records.
- Deployment: Vercel production deployment `dpl_GSapmqD25Bf2inAfzWbCXtwHiPFw` is
  aliased at `https://lineage-puce.vercel.app`.
- Validation: `corepack pnpm --filter @lineage/web build`,
  `apps/api/.venv/bin/pytest apps/api/tests`, `corepack pnpm validate:schema`,
  `git diff --check`, local dev HTTP checks, headless Chrome hydration check for
  `/verify?project=prj_demo_feature`, production redirect checks, production
  `/api/events?project_id=prj_demo_feature`, production manifest generation, and
  production `/api/verify` staged-report roundtrip passed.

### Six-stage manifest verification and 0.2.0 production schema

- Goal: replace fragmented `/verify` output with one staged report while extending
  manifests into a production AI bill of materials that covers rights, consent,
  disclosure, derivation chains, and buyer delivery context.
- Scope: manifest JSON Schema 0.2.0, API Pydantic event boundaries, signed-manifest
  verification, completeness rules, asset-hash match seam, demo seed data, signed
  Atlas example manifest, Next.js verify proxy types, and `/verify` result rendering.
- Acceptance: legacy 0.1.0 signed manifests still verify structurally and
  cryptographically; 0.2.0 manifests can add optional project, rights, consent, and
  disclosure fields; `assetType` is accepted at either event or output level; HTTP
  verification outcomes remain `200`; no file upload or PDF export was added.
- Result: `POST /manifest/verify` now returns one `VerificationReport` with
  Structure, Integrity, Issuer, Provenance, Completeness, and Asset Match stages;
  completeness findings are centralized in `completeness_rules.py`; `/verify`
  renders the unified report with calm attention states and disclosure summary.
- Validation: manifest schema validation, 24 targeted manifest verifier tests, all
  57 API tests, API Ruff, production web build, signed-example proxy roundtrip, and
  `/verify` HTTP load passed on local API `8001` and web `3001`.

### Signed manifest event and reference integrity hardening

- Goal: prevent a cryptographically valid but event-schema-invalid or internally
  inconsistent manifest from being reported as valid by the shared API/CLI verifier.
- Scope: signed manifest event validation, event ID uniqueness, parent-event
  references, C2PA action references, and focused verifier regressions.
- Acceptance: nested generation parameters, malformed reference assets, unknown event
  fields, duplicate event IDs, missing/self parent references, and missing/duplicate
  C2PA action event references are rejected after signature verification, while valid
  generated manifests continue to verify.
- Result: the manifest verifier now reuses the authoritative `EventCreate`
  model for deep event validation and cross-checks manifest-local event references,
  keeping verification aligned with ingestion rules and the generated C2PA summary.
- Validation: 20 targeted manifest tests, all 52 API tests, API Ruff, manifest
  schema validation, and `git diff --check` passed.

### Buyer-side video inspector

- Goal: let a buyer check whether a finished video is a byte-exact asset recorded in
  LINEAGE and review the AI provenance events associated with that fingerprint.
- Scope: browser-side video metadata and SHA-256 hashing, a hash-only Next.js lookup
  proxy, matched/miss/service-unreachable result states, and shared navigation updates.
- Acceptance: video bytes remain on the buyer's device; only a 64-character SHA-256
  fingerprint reaches `POST /assets/lookup`; matched records show project, tool, model,
  prompt, asset type, and UTC capture time; misses explain the re-encoding limitation.
- Result: `/inspect` now provides drag/drop or file selection, a compact metadata
  summary, local Web Crypto hashing, exact-hash ledger lookup, and calm buyer-facing
  outcomes using the verifier's cream and terracotta visual system.
- Privacy: the client serializes only `{ hash }`, and the web route constructs a new
  upstream body containing only `hashes` and `algorithm`; no file bytes or local video
  metadata are uploaded.
- Validation: web typecheck, lint, production build, all 43 API tests, manifest schema
  validation, desktop/mobile browser inspection, HTTP 200 boundary-result checks, and
  matched/miss proxy checks against a local lookup stub passed.

### Local demo network exposure hardening

- Goal: prevent the one-command Docker Compose demo from exposing its database,
  API, and web ports to other hosts on the local network by default.
- Scope: host port bindings in `docker-compose.yml` and a focused Compose
  configuration regression test.
- Acceptance: every published demo port binds only to `127.0.0.1`, while the
  existing localhost URLs and container-to-container networking remain unchanged.
- Result: Postgres `5432`, API `8000`, and web `3000` now publish only on the
  loopback interface; the regression parses the Compose YAML and locks that
  contract for all services with published ports.
- Validation: targeted config tests, full API pytest suite, API Ruff, manifest
  schema validation, and `git diff --check` passed.
- Gap: the Compose stack was not started because this machine does not have
  `docker`, `podman`, `nerdctl`, or `colima` on `PATH`.

### Asset lookup hash boundary hardening

- Goal: keep `POST /assets/lookup` aligned with signed manifest hash semantics
  so malformed or unsupported digest queries cannot reach database lookup work.
- Scope: asset lookup request schema and focused API regression tests.
- Acceptance: lookup hashes must be exact 64-character SHA-256 hex digests,
  unsupported algorithms return `HTTP 422` before query execution, and valid
  SHA-256 lookups still work case-insensitively.
- Result: `AssetLookupRequest` now reuses the shared `SHA256_PATTERN` boundary
  and constrains `algorithm` to the manifest-supported `SHA-256` literal.
- Validation: targeted asset lookup tests, full API pytest suite, API Ruff,
  manifest schema validation, and `git diff --check` passed.

### Event list filter boundary hardening

- Goal: prevent `GET /events` optional filters from accepting values that cannot
  match valid stored event records or can force oversized query predicates.
- Scope: FastAPI event-list query parameters and focused route regression tests.
- Acceptance: invalid `tool`, overlong `asset`, and unknown `asset_type` filters
  return `HTTP 422` before database query execution; valid filters still list events.
- Result: `tool` now reuses `TOOL_ID_PATTERN`, `asset` has the same 1000-character
  boundary as stored output asset URLs, and `asset_type` is constrained to the
  manifest asset-type enum.
- Validation: targeted event payload tests, full API pytest suite, API Ruff,
  manifest schema validation, and `git diff --check` passed.

### Event asset filter wildcard hardening on integration demo

- Goal: prevent `GET /events?asset=...` from treating user-supplied `%` and `_`
  as SQL `LIKE` wildcards on the active `integration-demo` branch.
- Scope: FastAPI event listing filter and focused SQL compilation regression test.
- Acceptance: asset filter input containing wildcard characters is matched
  literally, generated PostgreSQL SQL uses `ESCAPE`, and existing API validation
  remains green.
- Result: `AIEvent.output_asset_url.contains(asset, autoescape=True)` now escapes
  wildcard characters before binding the query value.
- Validation: targeted event payload tests, full API pytest suite, API Ruff,
  manifest schema validation, and `git diff --check` passed.

### Deployment verification and commit-message guardrails

- Goal: move deployment readiness toward reproducible local verification while
  preventing future placeholder commit messages.
- Scope: repository commit-message hook/template, API `uv.lock`, frozen Docker
  dependency installation, local container verification docs, Railway production
  signing-key footgun docs, and progress tracking.
- Acceptance: placeholder commit subjects are rejected, real subjects pass, API
  Docker builds from a committed lockfile, local verification steps are documented,
  existing checks stay green, and any unavailable container runtime is recorded
  honestly instead of implied as passing.
- Result: commit message guardrails are configured; `apps/api/uv.lock` is generated;
  `apps/api/Dockerfile` now uses `uv sync --frozen --no-cache --no-dev`; `DEPLOY.md`
  includes the local Docker Compose verification pipeline and the Railway
  `LINEAGE_ENV=production` requirement.
- Validation: hook self-test, `uv lock`, `uv sync --frozen --no-cache --no-dev`,
  API Ruff, API pytest, Alembic SQL render, manifest schema validation, web build,
  web typecheck after build, hardcoded-localhost grep, and `git diff --check`
  passed on the cleaned branch.
- Gap: the local Docker Compose container pipeline was not run because this machine
  does not have `docker`, `podman`, `nerdctl`, or `colima` on `PATH`.

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

### Asset-hash lookup endpoint

- Goal: let buyers inspect provenance events by delivered asset hash without scanning
  project manifests manually.
- Scope: additive FastAPI lookup route, request/response schemas, model/index metadata,
  Alembic migration, and focused backend regression tests.
- Acceptance: `POST /assets/lookup` accepts 1-50 hashes, preserves request order,
  returns `HTTP 200` misses, performs one batched query, matches hashes
  case-insensitively, and reuses `EventRead` for matched events.
- Result: the endpoint queries `output_asset_hash_value`, filters by hash algorithm,
  groups matches by requested hash, and returns matched events or empty miss results.
- Validation: targeted asset lookup tests, full API pytest suite, API Ruff, manifest
  schema validation, Alembic SQL render, and `git diff --check` passed on the
  cleaned branch.

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
