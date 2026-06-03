# LINEAGE Web

Next.js dashboard for the LINEAGE week-zero MVP.

```sh
pnpm --filter @lineage/web dev
```

Environment:

```sh
NEXT_PUBLIC_API_URL=https://your-lineage-api.example.com
```

Set `NEXT_PUBLIC_API_URL` when the web app should use a deployed API. Leave it unset
for local development; the app has a built-in local API fallback.
