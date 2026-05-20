# LINEAGE API

FastAPI ledger backend for the week-zero LINEAGE vertical slice.

## Local Development

The full local stack is intended to run through the repository root `docker-compose.yml`.

```sh
docker compose up postgres api
```

For direct local development with uv:

```sh
cd apps/api
uv sync --extra dev
uv run alembic upgrade head
uv run uvicorn lineage_api.main:app --reload
```

Required environment:

```sh
DATABASE_URL=postgresql+psycopg://lineage:lineage@localhost:5432/lineage
LINEAGE_ENV=local
```
