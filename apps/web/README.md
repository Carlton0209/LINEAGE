# LINEAGE Web

Next.js dashboard for the LINEAGE week-zero MVP.

```sh
pnpm --filter @lineage/web dev
```

Environment:

```sh
LINEAGE_API_URL=http://localhost:8000
```

The page is server-rendered and uses route handlers to proxy manifest JSON and PDF downloads from the API.
