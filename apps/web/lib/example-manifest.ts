export const EXAMPLE_MANIFEST_JSON = `{
  "@context": [
    "https://lineage.dev/contexts/ai-bom/v0.1",
    {
      "c2pa": "https://c2pa.org/specifications/specifications/2.1/specs/C2PA_Specification.html#"
    }
  ],
  "type": "LineageAIBillOfMaterials",
  "schemaVersion": "0.1.0",
  "manifestId": "urn:lineage:manifest:prj_verify_example:20260615T120500Z",
  "project": {
    "id": "prj_verify_example",
    "name": "prj_verify_example"
  },
  "generatedAt": "2026-06-15T12:05:00Z",
  "issuer": {
    "id": "lineage-example",
    "name": "LINEAGE Verification Example",
    "url": "https://lineage-puce.vercel.app"
  },
  "events": [
    {
      "eventId": "evt_example0001",
      "timestamp": "2026-06-15T12:00:00Z",
      "projectId": "prj_verify_example",
      "tool": {
        "identifier": "runway-ml",
        "version": "1.0",
        "url": "https://app.runwayml.com"
      },
      "model": {
        "identifier": "gen-4"
      },
      "input": {
        "promptText": "A sunrise over a quiet coastal city, filmed as a slow aerial shot.",
        "referenceAssets": [],
        "parameters": {
          "durationSeconds": 10
        }
      },
      "output": {
        "assetUrl": "https://assets.example.com/verify-example.mp4",
        "assetHash": {
          "algorithm": "SHA-256",
          "value": "b1c25a5e0b182f6c0ad84c35e8b5273f470e529bf7f1d3a3c2f9a6b7c8d9e0f1"
        },
        "assetType": "video",
        "mimeType": "video/mp4",
        "durationSeconds": 10.0
      },
      "operator": {
        "userId": "user_example",
        "humanName": "Example Operator"
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
        "when": "2026-06-15T12:00:00Z",
        "softwareAgent": "runway-ml gen-4",
        "lineageEventId": "evt_example0001"
      }
    ]
  },
  "signature": {
    "type": "LineageEd25519Signature2026",
    "createdAt": "2026-06-15T12:05:00Z",
    "algorithm": "Ed25519",
    "encoding": "base64url",
    "publicKey": {
      "kid": "lineage-example-key-001",
      "kty": "OKP",
      "crv": "Ed25519",
      "x": "O2onvM62pC1io6jQKm8Nc2UyFXcd4kOmOsBIoYtZ2ik"
    },
    "signedPayload": "canonical-json-without-signature",
    "digest": {
      "algorithm": "SHA-256",
      "value": "bad1ca50e33211560a6c9006542ec652a06f0fbda90e25aa23a36ba8904c2b31"
    },
    "signatureValue": "5zOe2CAGL_HBoQdH3SBrotyOiHryf4fGzIfMPQbp6pqVl2M9rbRQ_XByP-lXyHrO47PdAzd6ES5fX4pJ9HhBAQ",
    "c2pa": {
      "claimSignatureLabel": "c2pa.signature",
      "coseSignatureStructure": "COSE_Sign1_Tagged",
      "coseAlgorithm": "EdDSA",
      "payloadMode": "detached",
      "externalAAD": ""
    }
  }
}`;
