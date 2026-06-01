# LINEAGE Capture Extension

LINEAGE Capture is a Manifest V3 Chrome extension for capturing Runway video
generations into the LINEAGE API. It injects a manual capture button on
`app.runwayml.com`, attempts best-effort automatic capture for newly loaded
videos, hashes the real video bytes with SHA-256 in the service worker, and posts
the existing `POST /events` payload shape.

## Build

From the repo root:

```sh
pnpm --filter @lineage/extension build
```

The unpacked extension is written to `apps/extension/dist`.

## Package

Create a Chrome Web Store/local distribution zip:

```sh
pnpm --filter @lineage/extension package
```

The package is written to `apps/extension/lineage-capture-extension.zip`.

## Configure

Load `apps/extension/dist` from `chrome://extensions` with Developer Mode enabled,
or upload `lineage-capture-extension.zip` to the Chrome Web Store. Open the
extension Options page and set:

```text
Project ID: prj_week_zero
API URL: https://your-lineage-api.up.railway.app
Operator ID: op_extension
Default model: gen-3-alpha
```

Use the API origin only, with no trailing slash. For local development, keep the
default API URL `http://localhost:8000`.

## Permissions

`manifest.json` intentionally grants broad `https://*/*` host access for the demo
so the service worker can fetch real Runway video bytes from unknown CDN domains
before hashing them. Production should narrow this to the exact Runway CDN
domains once they are confirmed. The local `http://localhost/*` and
`http://127.0.0.1/*` permissions are present only so the extension can post to a
local LINEAGE API during development.
