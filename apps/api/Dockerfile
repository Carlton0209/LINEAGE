FROM ghcr.io/astral-sh/uv:0.5.4-python3.12-bookworm-slim

WORKDIR /app

COPY apps/api/pyproject.toml apps/api/README.md ./
COPY apps/api/lineage_api ./lineage_api
COPY apps/api/alembic.ini ./alembic.ini
COPY apps/api/alembic ./alembic

RUN uv sync --no-cache

EXPOSE 8000

CMD ["sh", "-c", "uv run alembic upgrade head && uv run uvicorn lineage_api.main:app --host 0.0.0.0 --port 8000"]
