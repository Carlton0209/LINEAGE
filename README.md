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
