## Run the demo

1. `docker compose up`
2. Open `http://localhost:3000`
3. Go to Ledger, use Project ID `prj_demo_feature`, and click `Filter` to see captured AI events
4. Click `Generate JSON` for the signed manifest, then `Generate PDF` to download the signed PDF
5. Go to Verify, paste the manifest JSON, and see it verify

# LINEAGE

LINEAGE is a compliance layer for AI-assisted media production. The week-zero MVP proves the core pipeline: capture AI generation events, write them to a ledger, and certify a project-scoped AI bill of materials.

Current implementation scope: manifest schema package plus the first FastAPI ledger skeleton.

## Schema Validation

```sh
pnpm install
pnpm validate:schema
```

## API Skeleton

The API skeleton lives in `apps/api`.

Generate a local signing key before using `/manifest`:

```sh
uv run --project apps/api lineage-generate-signing-key
export LINEAGE_ED25519_PRIVATE_KEY_B64URL=<generated-private-key>
```

```sh
docker compose up postgres api
```

Health check:

```sh
curl http://localhost:8000/healthz
```

Create an event:

```sh
curl -X POST http://localhost:8000/events \
  -H 'Content-Type: application/json' \
  -d @apps/api/examples/runway-event.json
```

Generate and verify a signed manifest:

```sh
curl -X POST http://localhost:8000/manifest/prj_week_zero > manifest.json
uv run --project apps/api lineage-verify-manifest manifest.json
```

Generate the PDF summary:

```sh
curl -X POST http://localhost:8000/manifest/prj_week_zero/pdf \
  -o lineage-prj_week_zero-manifest.pdf
```

## Dashboard

```sh
pnpm dev:web
```

The dashboard runs at `http://localhost:3000` and reads the API at `NEXT_PUBLIC_API_URL`,
defaulting to `http://localhost:8000`.
