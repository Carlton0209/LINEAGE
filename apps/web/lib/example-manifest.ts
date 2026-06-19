export const EXAMPLE_MANIFEST_JSON = `{
  "@context": [
    "https://lineage.dev/contexts/ai-bom/v0.2",
    {
      "c2pa": "https://c2pa.org/specifications/specifications/2.1/specs/C2PA_Specification.html#"
    }
  ],
  "type": "LineageAIBillOfMaterials",
  "schemaVersion": "0.2.0",
  "manifestId": "urn:lineage:manifest:prj_atlas_ep104:20260617T160000Z",
  "project": {
    "id": "prj_atlas_ep104",
    "name": "Atlas — Episode 104",
    "title": "Atlas — Episode 104",
    "productionCompany": "Northlight Pictures",
    "deliveryTarget": "streamer_orig_v3",
    "periodStart": "2026-06-12",
    "periodEnd": "2026-06-17"
  },
  "generatedAt": "2026-06-17T16:00:00Z",
  "issuer": {
    "id": "lineage-demo",
    "name": "LINEAGE Demo Issuer",
    "url": "https://lineage.dev"
  },
  "events": [
    {
      "eventId": "evt_atlas_mj_bg_001",
      "timestamp": "2026-06-12T15:05:00Z",
      "projectId": "prj_atlas_ep104",
      "tool": {
        "identifier": "midjourney",
        "version": "6.1",
        "url": "https://www.midjourney.com"
      },
      "model": {
        "identifier": "v6.1"
      },
      "input": {
        "promptText": "Wide establishing matte painting of a cold orbital archive above a storm-lit planet, cinematic but grounded.",
        "parameters": {
          "aspectRatio": "16:9",
          "stylize": 120
        },
        "referenceAssets": []
      },
      "output": {
        "assetUrl": "https://assets.example.com/atlas/ep104/orbital-archive-bg.png",
        "assetHash": {
          "algorithm": "SHA-256",
          "value": "11d066d9faf3c4cd153079ade7cf7a1b856e80c4883a40b3ebe6b8115680195b"
        },
        "assetType": "image",
        "mimeType": "image/png"
      },
      "operator": {
        "userId": "usr_atlas_maya",
        "humanName": "Maya Chen"
      },
      "provenance": {
        "parentEventIds": []
      },
      "rights": {
        "commercialUse": "permitted",
        "outputLicense": "midjourney-enterprise",
        "trainingDataBasis": "vendor-indemnified"
      },
      "disclosure": {
        "category": "ai background image",
        "buyerProfile": "streamer_orig_v3"
      }
    },
    {
      "eventId": "evt_atlas_runway_002",
      "timestamp": "2026-06-12T17:20:00Z",
      "projectId": "prj_atlas_ep104",
      "tool": {
        "identifier": "runway-ml",
        "version": "2026.06",
        "url": "https://runwayml.com"
      },
      "model": {
        "identifier": "gen-3-alpha-turbo",
        "version": "3.0"
      },
      "input": {
        "promptText": "Animate the orbital archive background into a slow push-in with practical lens breathing and restrained debris drift.",
        "parameters": {
          "seconds": 8,
          "resolution": "1080p"
        },
        "referenceAssets": [
          {
            "assetUrl": "https://assets.example.com/atlas/ep104/orbital-archive-bg.png",
            "assetHash": {
              "algorithm": "SHA-256",
              "value": "11d066d9faf3c4cd153079ade7cf7a1b856e80c4883a40b3ebe6b8115680195b"
            },
            "assetType": "image",
            "relationship": "image-to-video-source"
          }
        ]
      },
      "output": {
        "assetUrl": "https://assets.example.com/atlas/ep104/orbital-archive-push.mp4",
        "assetHash": {
          "algorithm": "SHA-256",
          "value": "c550c8702516da2ddba7d6c756639c608039ea107494b04080df6541defa7a53"
        },
        "assetType": "video",
        "mimeType": "video/mp4",
        "durationSeconds": 8
      },
      "operator": {
        "userId": "usr_atlas_maya",
        "humanName": "Maya Chen"
      },
      "provenance": {
        "parentEventIds": [
          "evt_atlas_mj_bg_001"
        ]
      },
      "rights": {
        "commercialUse": "permitted",
        "outputLicense": "runway-enterprise",
        "trainingDataBasis": "vendor-indemnified"
      },
      "disclosure": {
        "category": "ai generated video",
        "buyerProfile": "streamer_orig_v3"
      }
    },
    {
      "eventId": "evt_atlas_voice_003",
      "timestamp": "2026-06-13T13:15:00Z",
      "projectId": "prj_atlas_ep104",
      "assetType": "audio",
      "tool": {
        "identifier": "elevenlabs",
        "version": "2026.06",
        "url": "https://elevenlabs.io"
      },
      "model": {
        "identifier": "eleven-v3"
      },
      "input": {
        "promptText": "Generate the approved synthetic voice line: 'Atlas control, archive window is open.'",
        "parameters": {
          "delivery": "urgent calm",
          "take": 3
        },
        "referenceAssets": []
      },
      "output": {
        "assetUrl": "https://assets.example.com/atlas/ep104/control-line.wav",
        "assetHash": {
          "algorithm": "SHA-256",
          "value": "f2b222b9b707e26918cb3cb056f9e27c9917239f4d6cbcf6acbe743c449c852f"
        },
        "mimeType": "audio/wav",
        "durationSeconds": 4
      },
      "operator": {
        "userId": "usr_atlas_eli",
        "humanName": "Eli Parker"
      },
      "provenance": {
        "parentEventIds": []
      },
      "rights": {
        "commercialUse": "permitted",
        "outputLicense": "elevenlabs-enterprise",
        "trainingDataBasis": "vendor-indemnified"
      },
      "consent": {
        "consentId": "cons_sag_atlas_104_lee",
        "subject": "Jordan Lee",
        "scope": "Synthetic voice line for Atlas Episode 104 streamer delivery",
        "guildReference": "SAG-AFTRA-AI-2026-104"
      },
      "disclosure": {
        "category": "synthetic voice",
        "buyerProfile": "streamer_orig_v3"
      }
    },
    {
      "eventId": "evt_atlas_comfy_004",
      "timestamp": "2026-06-14T11:40:00Z",
      "projectId": "prj_atlas_ep104",
      "tool": {
        "identifier": "comfyui",
        "version": "0.3.32",
        "url": "https://www.comfy.org"
      },
      "model": {
        "identifier": "flux-dev"
      },
      "input": {
        "promptText": "Inpaint a small tracking artifact from the archive window reflection while preserving the Runway motion plate.",
        "parameters": {
          "denoise": 0.28,
          "maskFeather": 12
        },
        "referenceAssets": [
          {
            "assetUrl": "https://assets.example.com/atlas/ep104/orbital-archive-push.mp4",
            "assetHash": {
              "algorithm": "SHA-256",
              "value": "c550c8702516da2ddba7d6c756639c608039ea107494b04080df6541defa7a53"
            },
            "assetType": "video",
            "relationship": "input"
          }
        ]
      },
      "output": {
        "assetUrl": "https://assets.example.com/atlas/ep104/orbital-archive-cleanup.mp4",
        "assetHash": {
          "algorithm": "SHA-256",
          "value": "d088230ae0e5885257a9e35d48ab09750a7a1df39f77d746520ba2a950323981"
        },
        "assetType": "video",
        "mimeType": "video/mp4",
        "durationSeconds": 8
      },
      "operator": {
        "userId": "usr_atlas_eli",
        "humanName": "Eli Parker"
      },
      "provenance": {
        "parentEventIds": [
          "evt_atlas_runway_002"
        ]
      },
      "rights": {
        "commercialUse": "permitted",
        "outputLicense": "flux-dev-noncommercial",
        "trainingDataBasis": "licensed"
      },
      "disclosure": {
        "category": "ai inpaint cleanup",
        "buyerProfile": "streamer_orig_v3"
      }
    },
    {
      "eventId": "evt_atlas_suno_005",
      "timestamp": "2026-06-15T18:30:00Z",
      "projectId": "prj_atlas_ep104",
      "tool": {
        "identifier": "suno-ai",
        "version": "4.5",
        "url": "https://suno.com"
      },
      "model": {
        "identifier": "suno-v4.5",
        "version": "4.5"
      },
      "input": {
        "promptText": "Temporary pulsing score bed for the archive corridor transition, unresolved and tense.",
        "parameters": {
          "duration": 20,
          "tempo": "slow"
        },
        "referenceAssets": []
      },
      "output": {
        "assetUrl": "https://assets.example.com/atlas/ep104/temp-score.wav",
        "assetHash": {
          "algorithm": "SHA-256",
          "value": "ed6f02ae7c120fe35c9043fe6e72eb281417b8c57314509c311d5b9359c1db61"
        },
        "assetType": "audio",
        "mimeType": "audio/wav",
        "durationSeconds": 20
      },
      "operator": {
        "userId": "usr_atlas_maya",
        "humanName": "Maya Chen"
      },
      "provenance": {
        "parentEventIds": []
      },
      "rights": {
        "commercialUse": "restricted",
        "outputLicense": "temp-only",
        "trainingDataBasis": "licensed"
      },
      "disclosure": {
        "category": "temporary score",
        "buyerProfile": "streamer_orig_v3"
      }
    }
  ],
  "c2pa": {
    "specVersion": "2.1",
    "manifestType": "standard",
    "assertionStoreLabel": "c2pa.assertions",
    "claimLabel": "c2pa.claim.v2",
    "claimSignatureLabel": "c2pa.signature",
    "claimGenerator": "LINEAGE/0.2.0",
    "signatureAlgorithm": "EdDSA",
    "signaturePayloadMode": "detached",
    "actions": [
      {
        "action": "c2pa.created",
        "when": "2026-06-12T15:05:00Z",
        "softwareAgent": "midjourney v6.1",
        "lineageEventId": "evt_atlas_mj_bg_001"
      },
      {
        "action": "c2pa.edited",
        "when": "2026-06-12T17:20:00Z",
        "softwareAgent": "runway-ml gen-3-alpha-turbo",
        "lineageEventId": "evt_atlas_runway_002"
      },
      {
        "action": "c2pa.created",
        "when": "2026-06-13T13:15:00Z",
        "softwareAgent": "elevenlabs eleven-v3",
        "lineageEventId": "evt_atlas_voice_003"
      },
      {
        "action": "c2pa.edited",
        "when": "2026-06-14T11:40:00Z",
        "softwareAgent": "comfyui flux-dev",
        "lineageEventId": "evt_atlas_comfy_004"
      },
      {
        "action": "c2pa.created",
        "when": "2026-06-15T18:30:00Z",
        "softwareAgent": "suno-ai suno-v4.5",
        "lineageEventId": "evt_atlas_suno_005"
      }
    ]
  },
  "signature": {
    "type": "LineageEd25519Signature2026",
    "createdAt": "2026-06-17T16:00:00Z",
    "algorithm": "Ed25519",
    "encoding": "base64url",
    "publicKey": {
      "kid": "lineage-atlas-demo-key-001",
      "kty": "OKP",
      "crv": "Ed25519",
      "x": "k1vOzuYt8gr9PkPkl07baHTyfdkcUXW5znSRyCTG5Ec"
    },
    "signedPayload": "canonical-json-without-signature",
    "digest": {
      "algorithm": "SHA-256",
      "value": "12ea667f95e2742baede54d525a7a9552d3bf7e1563263ced2f469004f0f0907"
    },
    "signatureValue": "b-jSlQVGA8XSJ_vGjpdnimQ7QJFBb-ZGZU41AlXM6Zd0dVpHKtNelwtVAqEl1MHYriRkjrGSQ8PFwsuxHydTDg",
    "c2pa": {
      "claimSignatureLabel": "c2pa.signature",
      "coseSignatureStructure": "COSE_Sign1_Tagged",
      "coseAlgorithm": "EdDSA",
      "payloadMode": "detached",
      "externalAAD": ""
    }
  }
}`;
