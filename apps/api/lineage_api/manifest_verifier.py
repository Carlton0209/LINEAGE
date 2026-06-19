from __future__ import annotations

import re
from typing import Any

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
from pydantic import ValidationError

from lineage_api.completeness_rules import evaluate_completeness
from lineage_api.crypto import b64url_decode, canonical_json_bytes, sha256_hex
from lineage_api.schemas import (
    EVENT_ID_PATTERN as EVENT_ID_PATTERN_TEXT,
    MANIFEST_ID_PATTERN as MANIFEST_ID_PATTERN_TEXT,
    MODEL_ID_PATTERN as MODEL_ID_PATTERN_TEXT,
    PROJECT_ID_PATTERN as PROJECT_ID_PATTERN_TEXT,
    SHA256_PATTERN as SHA256_PATTERN_TEXT,
    TIMESTAMP_PATTERN as TIMESTAMP_PATTERN_TEXT,
    TOOL_ID_PATTERN as TOOL_ID_PATTERN_TEXT,
    EventCreate,
)

MANIFEST_ID_PATTERN = re.compile(MANIFEST_ID_PATTERN_TEXT)
PROJECT_ID_PATTERN = re.compile(PROJECT_ID_PATTERN_TEXT)
EVENT_ID_PATTERN = re.compile(EVENT_ID_PATTERN_TEXT)
TIMESTAMP_PATTERN = re.compile(TIMESTAMP_PATTERN_TEXT)
SHA256_PATTERN = re.compile(SHA256_PATTERN_TEXT)
TOOL_ID_PATTERN = re.compile(TOOL_ID_PATTERN_TEXT)
MODEL_ID_PATTERN = re.compile(MODEL_ID_PATTERN_TEXT)
PUBLIC_KEY_PATTERN = re.compile(r"^[A-Za-z0-9_-]{43}$")
SIGNATURE_VALUE_PATTERN = re.compile(r"^[A-Za-z0-9_-]{86}$")

SUPPORTED_SCHEMA_VERSIONS = {"0.1.0", "0.2.0"}
ASSET_TYPES = {"image", "video", "audio", "text"}
COMMERCIAL_USE_VALUES = {"permitted", "restricted", "unknown"}
TRAINING_DATA_BASIS_VALUES = {"licensed", "vendor-indemnified", "unknown"}
C2PA_ACTIONS = {"c2pa.created", "c2pa.edited", "c2pa.opened", "c2pa.published"}
PROJECT_OPTIONAL_FIELDS = (
    "title",
    "productionCompany",
    "deliveryTarget",
    "periodStart",
    "periodEnd",
)

VerificationReport = dict[str, Any]


def _field_path(parent: str, key: str) -> str:
    return f"{parent}.{key}" if parent else key


def _require_key(payload: dict[str, Any], key: str, parent: str = "") -> Any:
    if key not in payload:
        raise ValueError(f"manifest is missing {_field_path(parent, key)}")
    return payload[key]


def _require_object(payload: dict[str, Any], key: str, parent: str = "") -> dict[str, Any]:
    value = _require_key(payload, key, parent)
    if not isinstance(value, dict):
        raise ValueError(f"manifest {_field_path(parent, key)} must be an object")
    return value


def _require_list(
    payload: dict[str, Any],
    key: str,
    parent: str = "",
    *,
    min_items: int = 0,
) -> list[Any]:
    value = _require_key(payload, key, parent)
    path = _field_path(parent, key)
    if not isinstance(value, list):
        raise ValueError(f"manifest {path} must be an array")
    if len(value) < min_items:
        raise ValueError(f"manifest {path} must be a non-empty array")
    return value


def _require_string(
    payload: dict[str, Any],
    key: str,
    parent: str = "",
    *,
    pattern: re.Pattern[str] | None = None,
) -> str:
    value = _require_key(payload, key, parent)
    path = _field_path(parent, key)
    if not isinstance(value, str) or not value:
        raise ValueError(f"manifest {path} must be a non-empty string")
    if pattern and not pattern.fullmatch(value):
        raise ValueError(f"manifest {path} has invalid format")
    return value


def _require_optional_string(payload: dict[str, Any], key: str, parent: str = "") -> None:
    if key not in payload:
        return
    value = payload[key]
    if not isinstance(value, str) or not value:
        raise ValueError(f"manifest {_field_path(parent, key)} must be a non-empty string")


def _require_const(payload: dict[str, Any], key: str, expected: str, parent: str = "") -> None:
    value = _require_key(payload, key, parent)
    if value != expected:
        raise ValueError(f"manifest {_field_path(parent, key)} must be {expected}")


def _require_one_of(payload: dict[str, Any], key: str, expected: set[str], parent: str = "") -> str:
    value = _require_string(payload, key, parent)
    if value not in expected:
        allowed = ", ".join(sorted(expected))
        raise ValueError(f"manifest {_field_path(parent, key)} must be one of: {allowed}")
    return value


def _validate_project_shape(project: dict[str, Any]) -> str:
    project_id = _require_string(project, "id", "project", pattern=PROJECT_ID_PATTERN)
    _require_string(project, "name", "project")
    for field in PROJECT_OPTIONAL_FIELDS:
        _require_optional_string(project, field, "project")
    return project_id


def _validate_signature_shape(signature: dict[str, Any]) -> None:
    _require_const(signature, "type", "LineageEd25519Signature2026", "signature")
    _require_string(signature, "createdAt", "signature", pattern=TIMESTAMP_PATTERN)
    _require_const(signature, "algorithm", "Ed25519", "signature")
    _require_const(signature, "encoding", "base64url", "signature")
    _require_const(signature, "signedPayload", "canonical-json-without-signature", "signature")
    _require_string(signature, "signatureValue", "signature", pattern=SIGNATURE_VALUE_PATTERN)

    public_key = _require_object(signature, "publicKey", "signature")
    _require_const(public_key, "kty", "OKP", "signature.publicKey")
    _require_const(public_key, "crv", "Ed25519", "signature.publicKey")
    _require_string(public_key, "x", "signature.publicKey", pattern=PUBLIC_KEY_PATTERN)

    digest = _require_object(signature, "digest", "signature")
    _require_const(digest, "algorithm", "SHA-256", "signature.digest")
    _require_string(digest, "value", "signature.digest", pattern=SHA256_PATTERN)

    c2pa = _require_object(signature, "c2pa", "signature")
    _require_const(c2pa, "claimSignatureLabel", "c2pa.signature", "signature.c2pa")
    _require_const(c2pa, "coseSignatureStructure", "COSE_Sign1_Tagged", "signature.c2pa")
    _require_const(c2pa, "coseAlgorithm", "EdDSA", "signature.c2pa")
    _require_const(c2pa, "payloadMode", "detached", "signature.c2pa")
    _require_const(c2pa, "externalAAD", "", "signature.c2pa")


def _validate_rights_shape(event: dict[str, Any], event_path: str) -> None:
    if "rights" not in event:
        return
    rights = _require_object(event, "rights", event_path)
    _require_one_of(rights, "commercialUse", COMMERCIAL_USE_VALUES, f"{event_path}.rights")
    _require_string(rights, "outputLicense", f"{event_path}.rights")
    _require_one_of(
        rights,
        "trainingDataBasis",
        TRAINING_DATA_BASIS_VALUES,
        f"{event_path}.rights",
    )


def _validate_consent_shape(event: dict[str, Any], event_path: str) -> None:
    if "consent" not in event:
        return
    consent = _require_object(event, "consent", event_path)
    _require_string(consent, "consentId", f"{event_path}.consent")
    _require_string(consent, "subject", f"{event_path}.consent")
    _require_string(consent, "scope", f"{event_path}.consent")
    _require_string(consent, "guildReference", f"{event_path}.consent")


def _validate_disclosure_shape(event: dict[str, Any], event_path: str) -> None:
    if "disclosure" not in event:
        return
    disclosure = _require_object(event, "disclosure", event_path)
    _require_string(disclosure, "category", f"{event_path}.disclosure")
    _require_string(disclosure, "buyerProfile", f"{event_path}.disclosure")


def _validate_event_shape(event: dict[str, Any], project_id: str, index: int) -> str:
    event_path = f"events[{index}]"
    event_project_id = _require_string(event, "projectId", event_path, pattern=PROJECT_ID_PATTERN)
    if event_project_id != project_id:
        raise ValueError(f"manifest {event_path}.projectId must match project.id")

    event_id = _require_string(event, "eventId", event_path, pattern=EVENT_ID_PATTERN)
    _require_string(event, "timestamp", event_path, pattern=TIMESTAMP_PATTERN)

    top_level_asset_type = None
    if "assetType" in event:
        top_level_asset_type = _require_one_of(event, "assetType", ASSET_TYPES, event_path)

    tool = _require_object(event, "tool", event_path)
    _require_string(tool, "identifier", f"{event_path}.tool", pattern=TOOL_ID_PATTERN)

    model = _require_object(event, "model", event_path)
    _require_string(model, "identifier", f"{event_path}.model", pattern=MODEL_ID_PATTERN)

    input_payload = _require_object(event, "input", event_path)
    _require_string(input_payload, "promptText", f"{event_path}.input")
    _require_list(input_payload, "referenceAssets", f"{event_path}.input")

    output = _require_object(event, "output", event_path)
    _require_string(output, "assetUrl", f"{event_path}.output")
    output_hash = _require_object(output, "assetHash", f"{event_path}.output")
    _require_const(output_hash, "algorithm", "SHA-256", f"{event_path}.output.assetHash")
    _require_string(output_hash, "value", f"{event_path}.output.assetHash", pattern=SHA256_PATTERN)

    output_asset_type = None
    if "assetType" in output:
        output_asset_type = _require_one_of(output, "assetType", ASSET_TYPES, f"{event_path}.output")
    if top_level_asset_type is None and output_asset_type is None:
        raise ValueError(f"manifest {event_path} must include assetType on the event or output")
    if top_level_asset_type and output_asset_type and top_level_asset_type != output_asset_type:
        raise ValueError(f"manifest {event_path}.assetType must match output.assetType")

    operator = _require_object(event, "operator", event_path)
    _require_string(operator, "userId", f"{event_path}.operator")
    provenance = _require_object(event, "provenance", event_path)
    parent_ids = _require_list(provenance, "parentEventIds", f"{event_path}.provenance")
    seen_parent_ids: set[str] = set()
    for parent_index, parent_event_id in enumerate(parent_ids):
        if not isinstance(parent_event_id, str) or not EVENT_ID_PATTERN.fullmatch(parent_event_id):
            raise ValueError(
                f"manifest {event_path}.provenance.parentEventIds[{parent_index}] has invalid format"
            )
        if parent_event_id in seen_parent_ids:
            raise ValueError(f"manifest {event_path}.provenance.parentEventIds must be unique")
        seen_parent_ids.add(parent_event_id)

    _validate_rights_shape(event, event_path)
    _validate_consent_shape(event, event_path)
    _validate_disclosure_shape(event, event_path)

    try:
        EventCreate.model_validate(event)
    except ValidationError as exc:
        raise ValueError(f"manifest {event_path} does not match event schema") from exc
    return event_id


def _validate_c2pa_action_references(actions: list[Any], event_ids: set[str]) -> None:
    action_event_ids: set[str] = set()
    for index, action in enumerate(actions):
        action_path = f"c2pa.actions[{index}]"
        lineage_event_id = _require_string(
            action,
            "lineageEventId",
            action_path,
            pattern=EVENT_ID_PATTERN,
        )
        if lineage_event_id in action_event_ids:
            raise ValueError("manifest c2pa.actions lineageEventId values must be unique")
        if lineage_event_id not in event_ids:
            raise ValueError(
                f"manifest {action_path}.lineageEventId must reference an event in this manifest"
            )
        action_event_ids.add(lineage_event_id)

    if action_event_ids != event_ids:
        raise ValueError("manifest c2pa.actions must cover every event")


def _validate_manifest_shape(manifest: dict[str, Any]) -> None:
    _require_list(manifest, "@context", min_items=1)
    _require_const(manifest, "type", "LineageAIBillOfMaterials")
    _require_one_of(manifest, "schemaVersion", SUPPORTED_SCHEMA_VERSIONS)
    _require_string(manifest, "manifestId", pattern=MANIFEST_ID_PATTERN)
    _require_string(manifest, "generatedAt", pattern=TIMESTAMP_PATTERN)

    project = _require_object(manifest, "project")
    project_id = _validate_project_shape(project)

    issuer = _require_object(manifest, "issuer")
    _require_string(issuer, "id", "issuer")
    _require_string(issuer, "name", "issuer")

    events = _require_list(manifest, "events", min_items=1)
    event_ids: set[str] = set()
    for index, event in enumerate(events):
        if not isinstance(event, dict):
            raise ValueError(f"manifest events[{index}] must be an object")
        event_id = _validate_event_shape(event, project_id, index)
        if event_id in event_ids:
            raise ValueError("manifest events eventId values must be unique")
        event_ids.add(event_id)

    c2pa = _require_object(manifest, "c2pa")
    _require_const(c2pa, "specVersion", "2.1", "c2pa")
    _require_one_of(c2pa, "manifestType", {"standard", "update"}, "c2pa")
    _require_const(c2pa, "assertionStoreLabel", "c2pa.assertions", "c2pa")
    _require_const(c2pa, "claimLabel", "c2pa.claim.v2", "c2pa")
    _require_const(c2pa, "claimSignatureLabel", "c2pa.signature", "c2pa")
    _require_string(c2pa, "claimGenerator", "c2pa")
    _require_const(c2pa, "signatureAlgorithm", "EdDSA", "c2pa")
    _require_const(c2pa, "signaturePayloadMode", "detached", "c2pa")
    actions = _require_list(c2pa, "actions", "c2pa", min_items=1)
    for index, action in enumerate(actions):
        action_path = f"c2pa.actions[{index}]"
        if not isinstance(action, dict):
            raise ValueError(f"manifest {action_path} must be an object")
        _require_one_of(action, "action", C2PA_ACTIONS, action_path)
        _require_string(action, "when", action_path, pattern=TIMESTAMP_PATTERN)
        _require_string(action, "softwareAgent", action_path)
    _validate_c2pa_action_references(actions, event_ids)

    signature = _require_object(manifest, "signature")
    _validate_signature_shape(signature)


def _stage(
    stage_id: str,
    name: str,
    status: str,
    detail: str,
    findings: list[dict[str, str]] | None = None,
) -> dict[str, Any]:
    return {
        "id": stage_id,
        "name": name,
        "status": status,
        "detail": detail,
        "findings": findings or [],
    }


def _presented_content_note(detail: str, integrity_failed: bool) -> str:
    if not integrity_failed:
        return detail
    return f"{detail}; evaluated on presented content because integrity did not match"


def _structure_stage(manifest: dict[str, Any]) -> dict[str, Any]:
    try:
        _validate_manifest_shape(manifest)
    except Exception as exc:
        return _stage("structure", "Structure", "failed", f"malformed: {exc}")
    return _stage("structure", "Structure", "verified", "well-formed")


def _verify_integrity(manifest: dict[str, Any]) -> None:
    signature_block = manifest.get("signature")
    if not isinstance(signature_block, dict):
        raise ValueError("manifest is missing signature block")

    unsigned_manifest = dict(manifest)
    unsigned_manifest.pop("signature", None)
    canonical_payload = canonical_json_bytes(unsigned_manifest)

    expected_digest = sha256_hex(canonical_payload)
    actual_digest = signature_block.get("digest", {}).get("value")
    if actual_digest != expected_digest:
        raise ValueError("manifest digest does not match canonical unsigned payload")

    public_key_jwk = signature_block.get("publicKey", {})
    if public_key_jwk.get("kty") != "OKP" or public_key_jwk.get("crv") != "Ed25519":
        raise ValueError("signature publicKey must be an Ed25519 OKP JWK")

    public_key_value = public_key_jwk.get("x")
    signature_value = signature_block.get("signatureValue")
    if not isinstance(public_key_value, str) or not isinstance(signature_value, str):
        raise ValueError("signature block is missing public key or signature value")

    public_key = Ed25519PublicKey.from_public_bytes(b64url_decode(public_key_value))
    try:
        public_key.verify(b64url_decode(signature_value), canonical_payload)
    except InvalidSignature as exc:
        raise ValueError("manifest signature does not match canonical unsigned payload") from exc


def _integrity_stage(manifest: dict[str, Any]) -> dict[str, Any]:
    try:
        _verify_integrity(manifest)
    except Exception as exc:
        return _stage(
            "integrity",
            "Integrity",
            "failed",
            f"content changed since signing: {exc}",
        )
    return _stage(
        "integrity",
        "Integrity",
        "verified",
        "signature matches the embedded public key over the canonical content",
    )


def public_key_fingerprint(public_key_b64url: str, key_id: str | None = None) -> str:
    del key_id
    raw_public_key = b64url_decode(public_key_b64url)
    digest = sha256_hex(raw_public_key)[:16]
    chunks = ":".join(digest[index : index + 4] for index in range(0, 16, 4))
    return f"lng:{chunks}"


def _issuer_stage(manifest: dict[str, Any]) -> tuple[dict[str, Any], str | None]:
    public_key = manifest.get("signature", {}).get("publicKey", {})
    public_key_value = public_key.get("x") if isinstance(public_key, dict) else None
    if not isinstance(public_key_value, str):
        return (
            _stage(
                "issuer",
                "Issuer",
                "informational",
                (
                    "issuer key could not be identified. LINEAGE does not verify the issuer's "
                    "real-world identity; confirm the key fingerprint with the issuer through a "
                    "separate channel."
                ),
            ),
            None,
        )

    try:
        fingerprint = public_key_fingerprint(public_key_value)
    except Exception:
        return (
            _stage(
                "issuer",
                "Issuer",
                "informational",
                (
                    "issuer key could not be identified. LINEAGE does not verify the issuer's "
                    "real-world identity; confirm the key fingerprint with the issuer through a "
                    "separate channel."
                ),
            ),
            None,
        )

    return (
        _stage(
            "issuer",
            "Issuer",
            "informational",
            (
                f"key fingerprint {fingerprint}. LINEAGE does not verify the issuer's real-world "
                "identity; confirm this fingerprint with the issuer through a separate channel."
            ),
        ),
        fingerprint,
    )


def _manifest_events(manifest: dict[str, Any]) -> list[dict[str, Any]]:
    events = manifest.get("events")
    if not isinstance(events, list):
        return []
    return [event for event in events if isinstance(event, dict)]


def _cycle_findings(graph: dict[str, list[str]]) -> list[dict[str, str]]:
    state: dict[str, str] = {}
    stack: list[str] = []
    cycles: set[str] = set()
    findings: list[dict[str, str]] = []

    def visit(event_id: str) -> None:
        state[event_id] = "visiting"
        stack.append(event_id)
        for parent_id in graph[event_id]:
            if parent_id not in graph:
                continue
            if state.get(parent_id) == "visiting":
                cycle_start = stack.index(parent_id)
                cycle = stack[cycle_start:] + [parent_id]
                cycle_path = " -> ".join(cycle)
                if cycle_path not in cycles:
                    cycles.add(cycle_path)
                    findings.append(
                        {
                            "eventId": event_id,
                            "level": "attention",
                            "message": f"cycle detected: {cycle_path}",
                        }
                    )
            elif state.get(parent_id) != "visited":
                visit(parent_id)
        stack.pop()
        state[event_id] = "visited"

    for event_id in graph:
        if state.get(event_id) is None:
            visit(event_id)

    return findings


def _provenance_stage(manifest: dict[str, Any], integrity_failed: bool) -> dict[str, Any]:
    events = _manifest_events(manifest)
    if not events:
        return _stage(
            "provenance",
            "Provenance",
            "informational",
            _presented_content_note("could not run - no event graph available", integrity_failed),
        )

    graph: dict[str, list[str]] = {}
    for index, event in enumerate(events):
        event_id = event.get("eventId")
        if not isinstance(event_id, str) or not event_id:
            event_id = f"events[{index}]"
        provenance = event.get("provenance")
        parent_ids = []
        if isinstance(provenance, dict) and isinstance(provenance.get("parentEventIds"), list):
            parent_ids = [
                parent_id
                for parent_id in provenance["parentEventIds"]
                if isinstance(parent_id, str)
            ]
        graph[event_id] = parent_ids

    event_ids = set(graph)
    findings: list[dict[str, str]] = []
    for event_id, parent_ids in graph.items():
        for parent_id in parent_ids:
            if parent_id not in event_ids:
                findings.append(
                    {
                        "eventId": event_id,
                        "level": "attention",
                        "message": f"dangling parent reference: {parent_id}",
                    }
                )

    findings.extend(_cycle_findings(graph))
    if findings:
        detail = f"broken-chain: {len(findings)} derivation issue"
        if len(findings) != 1:
            detail += "s"
        return _stage(
            "provenance",
            "Provenance",
            "failed",
            _presented_content_note(detail, integrity_failed),
            findings,
        )

    chain_count = sum(1 for parent_ids in graph.values() if parent_ids)
    detail = f"coherent: {len(graph)} events, {chain_count} derivation chains"
    return _stage(
        "provenance",
        "Provenance",
        "verified",
        _presented_content_note(detail, integrity_failed),
    )


def _delivery_target(manifest: dict[str, Any]) -> str:
    project = manifest.get("project")
    if isinstance(project, dict) and isinstance(project.get("deliveryTarget"), str):
        return project["deliveryTarget"]
    return "declared delivery target"


def _completeness_stage(manifest: dict[str, Any], integrity_failed: bool) -> dict[str, Any]:
    findings = evaluate_completeness(manifest)
    target = _delivery_target(manifest)
    if findings:
        return _stage(
            "completeness",
            "Completeness",
            "attention",
            _presented_content_note(f"needs follow-up for {target}", integrity_failed),
            findings,
        )
    return _stage(
        "completeness",
        "Completeness",
        "verified",
        _presented_content_note(f"complete for {target}", integrity_failed),
    )


def _asset_match_stage(
    manifest: dict[str, Any],
    asset_hashes: list[str] | None,
    integrity_failed: bool,
) -> dict[str, Any]:
    if asset_hashes is None:
        return _stage("asset_match", "Asset Match", "informational", "skipped — no files provided")

    provided_hashes = [item.strip().lower() for item in asset_hashes if item.strip()]
    if not provided_hashes:
        return _stage("asset_match", "Asset Match", "informational", "skipped — no files provided")

    recorded_hashes: dict[str, list[str]] = {}
    for event in _manifest_events(manifest):
        event_id = event.get("eventId")
        output = event.get("output")
        asset_hash = output.get("assetHash") if isinstance(output, dict) else None
        value = asset_hash.get("value") if isinstance(asset_hash, dict) else None
        if isinstance(event_id, str) and isinstance(value, str):
            recorded_hashes.setdefault(value.lower(), []).append(event_id)

    matched = [hash_value for hash_value in provided_hashes if hash_value in recorded_hashes]
    unmatched = [hash_value for hash_value in provided_hashes if hash_value not in recorded_hashes]
    detail = f"matched {len(matched)} of {len(provided_hashes)} provided asset hashes"
    detail = _presented_content_note(detail, integrity_failed)
    if unmatched:
        return _stage(
            "asset_match",
            "Asset Match",
            "attention",
            detail,
            [
                {
                    "eventId": hash_value,
                    "level": "attention",
                    "message": "provided hash not found in manifest outputs",
                }
                for hash_value in unmatched
            ],
        )
    return _stage("asset_match", "Asset Match", "verified", detail)


def _project_summary(manifest: dict[str, Any]) -> dict[str, str | None] | None:
    project = manifest.get("project")
    if not isinstance(project, dict):
        return None

    project_id = project.get("id")
    if not isinstance(project_id, str):
        return None

    title = project.get("title") or project.get("name")
    return {
        "id": project_id,
        "title": title if isinstance(title, str) else None,
        "productionCompany": (
            project["productionCompany"] if isinstance(project.get("productionCompany"), str) else None
        ),
        "deliveryTarget": (
            project["deliveryTarget"] if isinstance(project.get("deliveryTarget"), str) else None
        ),
    }


def _disclosure_summary(
    manifest: dict[str, Any],
    stages: list[dict[str, Any]],
) -> list[dict[str, str]]:
    attention_event_ids = {
        finding["eventId"]
        for stage in stages
        for finding in stage["findings"]
        if finding.get("level") == "attention"
    }
    categories: dict[str, str] = {}
    for event in _manifest_events(manifest):
        event_id = event.get("eventId")
        disclosure = event.get("disclosure")
        category = disclosure.get("category") if isinstance(disclosure, dict) else None
        if not isinstance(category, str) or not category:
            continue
        if category not in categories:
            categories[category] = "verified"
        if isinstance(event_id, str) and event_id in attention_event_ids:
            categories[category] = "attention"

    return [{"category": category, "status": status} for category, status in categories.items()]


def _overall_status(stages: list[dict[str, Any]]) -> dict[str, str]:
    fatal_stage_failed = any(
        stage["id"] in {"structure", "integrity"} and stage["status"] == "failed"
        for stage in stages
    )
    if fatal_stage_failed:
        return {
            "status": "failed",
            "summary": "Manifest verification needs a fresh signed copy before it can be trusted.",
        }

    if any(stage["status"] in {"attention", "failed"} for stage in stages):
        return {
            "status": "verified_with_attention",
            "summary": "Manifest verifies, with follow-up items in the report.",
        }

    return {
        "status": "verified",
        "summary": "Manifest verifies across the staged LINEAGE checks.",
    }


def verification_result(
    manifest: dict[str, Any],
    asset_hashes: list[str] | None = None,
) -> VerificationReport:
    structure = _structure_stage(manifest)
    integrity = _integrity_stage(manifest)
    integrity_failed = integrity["status"] == "failed"
    issuer, fingerprint = _issuer_stage(manifest)
    provenance = _provenance_stage(manifest, integrity_failed)
    completeness = _completeness_stage(manifest, integrity_failed)
    asset_match = _asset_match_stage(manifest, asset_hashes, integrity_failed)
    stages = [structure, integrity, issuer, provenance, completeness, asset_match]

    return {
        "overall": _overall_status(stages),
        "project": _project_summary(manifest),
        "issuerFingerprint": fingerprint,
        "stages": stages,
        "disclosure": _disclosure_summary(manifest, stages),
    }


def verify_signed_manifest(manifest: dict[str, Any]) -> None:
    report = verification_result(manifest)
    for stage in report["stages"]:
        if stage["id"] in {"structure", "integrity"} and stage["status"] == "failed":
            raise ValueError(stage["detail"])
