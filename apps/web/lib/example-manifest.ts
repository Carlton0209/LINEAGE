export const EXAMPLE_MANIFEST_JSON = `{
  "@context": [
    "https://lineage.dev/contexts/ai-bom/v0.1",
    {
      "c2pa": "https://c2pa.org/specifications/specifications/2.1/specs/C2PA_Specification.html#"
    }
  ],
  "type": "LineageAIBillOfMaterials",
  "schemaVersion": "0.1.0",
  "manifestId": "urn:lineage:manifest:prj_week_zero_cut_001",
  "project": {
    "id": "prj_week_zero",
    "name": "Week Zero Runway Capture"
  },
  "generatedAt": "2026-05-20T14:25:00Z",
  "issuer": {
    "id": "lineage-local-dev",
    "name": "LINEAGE Local Development Issuer",
    "url": "https://lineage.dev"
  },
  "events": [
    {
      "eventId": "evt_runway0001",
      "timestamp": "2026-05-20T14:20:30Z",
      "projectId": "prj_week_zero",
      "tool": {
        "identifier": "runway-ml",
        "url": "https://app.runwayml.com"
      },
      "model": {
        "identifier": "gen-3-alpha"
      },
      "input": {
        "promptText": "A locked-off shot of rain sliding down a neon storefront window at night.",
        "parameters": {
          "durationSeconds": 10,
          "aspectRatio": "16:9"
        },
        "referenceAssets": []
      },
      "output": {
        "assetUrl": "https://assets.example.com/week-zero/runway-0001.mp4",
        "assetHash": {
          "algorithm": "SHA-256",
          "value": "b1c25a5e0b182f6c0ad84c35e8b5273f470e529bf7f1d3a3c2f9a6b7c8d9e0f1"
        },
        "assetType": "video",
        "mimeType": "video/mp4",
        "durationSeconds": 10
      },
      "operator": {
        "userId": "user_local_001"
      },
      "provenance": {
        "parentEventIds": []
      }
    }
  ],
  "c2pa": {
    "specVersion": "2.1",
    "manifestType": "standard",
    "assertionStoreLabel": "c2pa.assertions",
    "claimLabel": "c2pa.claim.v2",
    "claimSignatureLabel": "c2pa.signature",
    "claimGenerator": "LINEAGE/0.1.0",
    "signatureAlgorithm": "EdDSA",
    "signaturePayloadMode": "detached",
    "actions": [
      {
        "action": "c2pa.created",
        "when": "2026-05-20T14:20:30Z",
        "softwareAgent": "Runway ML gen-3-alpha",
        "lineageEventId": "evt_runway0001"
      }
    ]
  },
  "signature": {
    "type": "LineageEd25519Signature2026",
    "createdAt": "2026-05-20T14:25:00Z",
    "algorithm": "Ed25519",
    "encoding": "base64url",
    "publicKey": {
      "kid": "lineage-local-dev-key-001",
      "kty": "OKP",
      "crv": "Ed25519",
      "x": "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB"
    },
    "signedPayload": "canonical-json-without-signature",
    "digest": {
      "algorithm": "SHA-256",
      "value": "0000000000000000000000000000000000000000000000000000000000000000"
    },
    "signatureValue": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    "c2pa": {
      "claimSignatureLabel": "c2pa.signature",
      "coseSignatureStructure": "COSE_Sign1_Tagged",
      "coseAlgorithm": "EdDSA",
      "payloadMode": "detached",
      "externalAAD": ""
    }
  }
}`;
