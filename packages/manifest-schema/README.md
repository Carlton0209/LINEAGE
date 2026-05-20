# LINEAGE Manifest Schema

This package contains the draft 2020-12 JSON Schema for the LINEAGE AI bill of materials manifest.

The manifest is JSON-LD and designed as a C2PA 2.1-compatible external delivery artifact. It records project metadata, AI generation events, C2PA alignment metadata, and an Ed25519 signature block over the canonical JSON payload with the `signature` property removed.

## Validate Examples

```sh
pnpm --filter @lineage/manifest-schema validate
```

Valid examples live in `examples/valid`. Invalid examples live in `examples/invalid` and must fail validation.
